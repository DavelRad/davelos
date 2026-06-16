import { qa, fallbackAnswer, profile } from "../data/profile";
import { repoFiles } from "../data/repo";

/**
 * Terminal engine for the Claude Code app.
 *
 * The `route` function is a deterministic keyword router over the curated Q&A
 * in data/profile.ts. It is a STAND-IN for a real RAG backend — Davel already
 * built the production retrieval stack at Nogic (BM25 + LLM rerank feeding a
 * 6-tool agent loop with a hallucination-checking verification pass). Wiring
 * this terminal to that backend (streaming SSE) is the intended next step;
 * the tool-call "flavor" lines below mimic what that loop emits.
 */

export interface ToolCall {
  /** e.g. "Reading about.md" */
  label: string;
}

export interface RouterResult {
  toolCalls: ToolCall[];
  answer: string;
  /** files "touched" — shown in the closing "Done" line. */
  fileCount: number;
}

const FILE_HINTS: Record<string, string[]> = {
  "experience.md": ["nogic", "fetch", "moderna", "intern", "jonajo", "work", "experience", "hire", "job"],
  "about.md": ["who", "about", "bio", "education", "school", "sjsu", "gpa", "background"],
  "projects.md": ["project", "landdrop", "databae", "hackathon", "won", "win"],
  "stack.md": ["stack", "tech", "language", "tools", "framework"],
  "contact.md": ["contact", "reach", "email", "linkedin", "hire", "connect"],
  "README.md": ["nogic", "building", "current", "now", "retrieval", "rag"],
};

function pickFiles(q: string): string[] {
  const lower = q.toLowerCase();
  const hits = repoFiles
    .map((f) => f.path)
    .filter((path) => (FILE_HINTS[path] ?? []).some((kw) => lower.includes(kw)));
  if (hits.length === 0) return ["README.md", "about.md"];
  return hits.slice(0, 3);
}

/** Route a natural-language question to a curated answer + tool-call flavor. */
export function route(input: string): RouterResult {
  const q = input.toLowerCase();
  let best: { score: number; answer: string } | null = null;
  for (const entry of qa) {
    const score = entry.keywords.reduce(
      (acc, kw) => (q.includes(kw) ? acc + kw.length : acc),
      0,
    );
    if (score > 0 && (!best || score > best.score)) {
      best = { score, answer: entry.answer };
    }
  }
  const answer = best?.answer ?? fallbackAnswer;
  const files = pickFiles(input);
  const toolCalls: ToolCall[] = files.map((f, i) => ({
    label: i === 0 ? `Reading ${f}` : `Searching ${f}`,
  }));
  return { toolCalls, answer, fileCount: files.length };
}

/* ---------------------------- slash commands ---------------------------- */

export interface CommandResult {
  /** lines to print directly (no streaming). */
  lines?: string[];
  /** if set, clear the screen. */
  clear?: boolean;
  /** if set, treat as a natural-language question (run the router). */
  ask?: string;
}

const HELP = [
  "Available commands:",
  "  help              show this help",
  "  whoami            quick identity summary",
  "  ls                list repo files",
  "  cat <file>        print a repo file (e.g. cat experience.md)",
  "  clear             clear the screen",
  "",
  "Or just ask in plain English — e.g. \"What is Nogic?\"",
];

export function runCommand(raw: string): CommandResult {
  const input = raw.trim();
  const [cmd, ...rest] = input.split(/\s+/);
  switch (cmd.toLowerCase()) {
    case "help":
    case "--help":
    case "-h":
      return { lines: HELP };
    case "clear":
    case "cls":
      return { clear: true };
    case "whoami":
      return {
        lines: [
          `${profile.name} — ${profile.role}`,
          `${profile.location} · ${profile.status}`,
          `${profile.tagline}`,
        ],
      };
    case "ls":
      return {
        lines: [
          repoFiles.map((f) => f.name).join("   "),
          "",
          "Tip: cat experience.md",
        ],
      };
    case "cat": {
      const name = rest[0];
      if (!name) return { lines: ["usage: cat <file>"] };
      const file = repoFiles.find(
        (f) => f.name === name || f.path === name,
      );
      if (!file) {
        return {
          lines: [
            `cat: ${name}: no such file`,
            `files: ${repoFiles.map((f) => f.name).join(", ")}`,
          ],
        };
      }
      return { lines: file.body.split("\n") };
    }
    default:
      // not a known command -> treat whole input as a question
      return { ask: input };
  }
}

export const SUGGESTED = [
  "What is Nogic?",
  "What's your tech stack?",
  "Why should we hire you?",
  "What are you building?",
];

/* --------------------------- live backend (SSE) --------------------------- */

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export type AskOutcome =
  | { status: "ok" } // streamed a real answer from Claude
  | { status: "offline" } // backend up but no API key -> caller uses canned answer
  | { status: "rate_limited"; retryAfter: number }
  | { status: "error" }; // network/backend failure -> caller uses canned answer

/**
 * Stream a real, grounded answer from the FastAPI `/api/ask` backend, invoking
 * `onDelta` with each text chunk as it arrives. Same-origin `/api` works in
 * prod (Firebase rewrites it to Cloud Run) and in dev (Vite proxies it to the
 * local FastAPI server). On "offline" | "error" the caller should fall back to
 * the built-in canned answer from `route`, so the terminal works with no
 * backend at all.
 */
export async function askBackend(
  messages: ChatMessage[],
  onDelta: (text: string) => void,
  signal?: AbortSignal,
): Promise<AskOutcome> {
  let res: Response;
  try {
    res = await fetch("/api/ask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages }),
      signal,
    });
  } catch {
    return { status: "error" };
  }

  if (res.status === 429) {
    let retryAfter = 10;
    try {
      const j = (await res.json()) as { retry_after?: number };
      retryAfter = Number(j.retry_after) || retryAfter;
    } catch {
      /* ignore */
    }
    return { status: "rate_limited", retryAfter };
  }
  if (!res.ok || !res.body) return { status: "error" };

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buf = "";
  let streamed = false;
  let outcome: AskOutcome = { status: "ok" };

  // SSE: events are separated by a blank line; each carries a `data:` JSON line.
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    let nl: number;
    while ((nl = buf.indexOf("\n\n")) >= 0) {
      const frame = buf.slice(0, nl).trim();
      buf = buf.slice(nl + 2);
      if (!frame.startsWith("data:")) continue;
      const payload = frame.slice(5).trim();
      if (!payload) continue;
      try {
        const evt = JSON.parse(payload) as { type: string; text?: string };
        if (evt.type === "delta" && evt.text) {
          streamed = true;
          onDelta(evt.text);
        } else if (evt.type === "offline") {
          outcome = { status: "offline" };
        } else if (evt.type === "error") {
          outcome = { status: "error" };
        }
      } catch {
        /* ignore malformed frame */
      }
    }
  }

  // If real text streamed, it's a success regardless of trailing events.
  return streamed ? { status: "ok" } : outcome;
}

import { qa, fallbackAnswer, profile } from "../data/profile";
import { repoFiles } from "../data/repo";
import type { AppId } from "../os/types";
import type { OsBridge } from "../os/osBridge";

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
  "Why should we hire you?",
  "Open my photos",
  "Switch to dark mode",
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

/* ----------------------------- agent actions ----------------------------- *
 * Beyond *answering*, this terminal can actually DRIVE davelOS — the same
 * readable things a visitor could do by hand (open an app, flip the theme,
 * reduce motion, pop Spotlight). `parseAction` is a deterministic intent parser
 * that runs BEFORE the backend: if the input is a clear command it returns an
 * AgentAction (with realistic tool-call flavor); otherwise null and we fall
 * through to the normal grounded Q&A. Nothing here mutates the site.
 * ------------------------------------------------------------------------- */

export type OsIntent =
  | { type: "openApp"; app: AppId }
  | { type: "setTheme"; theme: "dark" | "light" }
  | { type: "toggleTheme" }
  | { type: "reduceMotion"; on: boolean }
  | { type: "openSpotlight" };

export interface AgentAction {
  intent: OsIntent;
  /** realistic Claude Code tool-call line, e.g. `Bash(open -a "Obsidian")`. */
  tool: string;
  /** the tool's result line, shown under it. */
  result: string;
  /** the confirmation Claude "says" (streamed into an answer line). */
  say: string;
}

/** Apply a parsed intent to the live OS via the shell-provided bridge. */
export function applyIntent(intent: OsIntent, os: OsBridge): void {
  switch (intent.type) {
    case "openApp":
      os.openApp(intent.app);
      break;
    case "setTheme":
      os.setTheme(intent.theme);
      break;
    case "toggleTheme":
      os.toggleTheme();
      break;
    case "reduceMotion":
      os.setReduceMotion(intent.on);
      break;
    case "openSpotlight":
      os.openSpotlight();
      break;
  }
}

/** Verbs that signal "open this app for me". */
const OPEN_VERB =
  /\b(open|launch|show|pull up|bring up|fire up|boot up|start up|go to|take me to|let me see|display|view|gimme|give me|run|jump to|play)\b/;

interface AppTarget {
  app: AppId;
  label: string;
  /** the .app it "launches" (for the Bash flavor line). */
  bin: string;
  aliases: RegExp;
  say: string;
}

const APP_TARGETS: AppTarget[] = [
  {
    app: "obsidian",
    label: "Obsidian",
    bin: "Obsidian",
    aliases: /\b(obsidian|the vault|my vault|notes? vault|the wiki|the story)\b/,
    say: "Opening my Obsidian vault — the full story: who I am, what I'm shipping, and every project, all interlinked.",
  },
  {
    app: "photos",
    label: "Photos",
    bin: "Photos",
    aliases: /\b(photos?|pictures?|pics|gallery|albums?)\b/,
    say: "Pulling up Photos. Hackathons, demo days, and the occasional touched grass. 📸",
  },
  {
    app: "spotify",
    label: "Spotify",
    bin: "Spotify",
    aliases: /\b(spotify|music|a song|some tunes|something to listen)\b/,
    say: "Opening Spotify — here's what's actually on repeat. Hit play. 🎧",
  },
  {
    app: "startup",
    label: "Startup",
    bin: "Startup",
    aliases: /\b(startup|founder journey|founder|yc|y combinator|paxel)\b/,
    say: "Opening the Startup app — the founder journey, Nogic, and my real YC report.",
  },
  {
    app: "mail",
    label: "Mail",
    bin: "Mail",
    aliases: /\b(mail|email|contact|get in touch|reach out)\b/,
    say: "Opening Mail — easiest way to reach me. Say hi. 👋",
  },
  {
    app: "preview",
    label: "Preview",
    bin: "Preview",
    aliases: /\b(resume|résumé|cv)\b/,
    say: "Opening my resume in Preview.",
  },
  {
    app: "github",
    label: "GitHub",
    bin: "open",
    aliases: /\b(github|the repo|source code|the code|his code|your code)\b/,
    say: "Opening my GitHub in a new tab — go poke at the code.",
  },
  {
    app: "settings",
    label: "Settings",
    bin: "System Settings",
    aliases: /\b(settings|preferences|system settings)\b/,
    say: "Opening System Settings.",
  },
  {
    app: "notes",
    label: "Notes",
    bin: "Stickies",
    aliases: /\b(stickies|sticky note|notes app)\b/,
    say: "Opening Notes.",
  },
  {
    app: "editor",
    label: "VS Code",
    bin: "Visual Studio Code",
    aliases: /\b(vs ?code|the editor|about\.ts)\b/,
    say: "Opening the editor.",
  },
];

const THEME_DARK =
  /\b(dark mode|dark theme|night mode|go dark|lights? off|turn off the lights?)\b/;
const THEME_LIGHT =
  /\b(light mode|light theme|day mode|go light|lights? on|turn on the lights?|bright mode)\b/;
const THEME_TOGGLE =
  /\b(toggle (?:the )?theme|switch (?:the )?theme|change (?:the )?theme|flip (?:the )?theme|switch appearance|toggle appearance|change appearance)\b/;
const MOTION_REDUCE =
  /\b(reduce (?:the )?motion|less motion|calm (?:it|things) down|stop the animations?|disable (?:the )?animations?|turn off (?:the )?animations?|less movement)\b/;
const MOTION_FULL =
  /\b(enable (?:the )?animations?|turn on (?:the )?animations?|more motion|full motion|restore motion|bring back (?:the )?motion)\b/;
const SPOTLIGHT =
  /\b(spotlight|command palette|open search|cmd\s*\+?\s*k|⌘\s*k)\b/;

/** Parse a natural-language command into a runnable OS action, or null. */
export function parseAction(raw: string): AgentAction | null {
  const q = raw.toLowerCase();

  // appearance
  if (THEME_TOGGLE.test(q))
    return {
      intent: { type: "toggleTheme" },
      tool: "Settings(appearance: toggle)",
      result: "appearance switched",
      say: "Flipped the appearance for you.",
    };
  if (THEME_DARK.test(q))
    return {
      intent: { type: "setTheme", theme: "dark" },
      tool: "Settings(appearance: dark)",
      result: "theme = dark",
      say: "Dark mode on. Easier on the eyes. 🌙",
    };
  if (THEME_LIGHT.test(q))
    return {
      intent: { type: "setTheme", theme: "light" },
      tool: "Settings(appearance: light)",
      result: "theme = light",
      say: "Light mode on. ☀️",
    };

  // motion
  if (MOTION_REDUCE.test(q))
    return {
      intent: { type: "reduceMotion", on: true },
      tool: "Settings(motion: reduce)",
      result: "reduce-motion = on",
      say: "Calmed the motion down — dock magnification and the bounces are dialed back.",
    };
  if (MOTION_FULL.test(q))
    return {
      intent: { type: "reduceMotion", on: false },
      tool: "Settings(motion: full)",
      result: "reduce-motion = off",
      say: "Full motion restored. Let it bounce.",
    };

  // spotlight
  if (SPOTLIGHT.test(q))
    return {
      intent: { type: "openSpotlight" },
      tool: "Hotkey(⌘K)",
      result: "Spotlight opened",
      say: "Spotlight's up — start typing to jump anywhere. (⌘K)",
    };

  // open an app
  if (OPEN_VERB.test(q)) {
    for (const t of APP_TARGETS) {
      if (t.aliases.test(q)) {
        const tool =
          t.app === "github"
            ? "Bash(open https://github.com/DavelRad)"
            : `Bash(open -a "${t.bin}")`;
        const result =
          t.app === "github"
            ? "opening github.com/DavelRad"
            : `${t.label} launched`;
        return { intent: { type: "openApp", app: t.app }, tool, result, say: t.say };
      }
    }
  }

  return null;
}

/** "what can you do" style meta-question → a capabilities listing. */
const CAPABILITY_RE =
  /\b(what can you (?:do|control|open|run)|what (?:can|do) you actually do|can you (?:open|control|do) (?:apps|things|stuff)|what are you capable|your capabilities|what commands|how do you work|what else can you)\b/;

export function isCapabilityQuery(raw: string): boolean {
  return CAPABILITY_RE.test(raw.toLowerCase());
}

export const CAPABILITIES = [
  "I'm wired into davelOS — so I can actually drive it, not just talk:",
  "",
  '  open apps     "open Obsidian", "show me your photos", "play Spotify"',
  '  appearance    "dark mode", "light mode", "toggle the theme"',
  '  motion        "reduce motion", "turn the animations back on"',
  '  spotlight     "open Spotlight"  (desktop)',
  "",
  "  …or just ask anything about Davel — I answer from a grounded knowledge base.",
];

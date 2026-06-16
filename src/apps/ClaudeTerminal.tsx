import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { useDelightMotion } from "../lib/useDelightMotion";
import {
  askBackend,
  route,
  runCommand,
  SUGGESTED,
  type ChatMessage,
  type ToolCall,
} from "./terminalEngine";

interface ClaudeTerminalProps {
  /** an external question (from Spotlight) to run on mount/update. */
  pendingQuestion?: string | null;
  onQuestionConsumed?: () => void;
}

type Line =
  | { id: number; kind: "input"; text: string }
  | { id: number; kind: "output"; text: string }
  | { id: number; kind: "tool"; text: string }
  | { id: number; kind: "answer"; text: string };

let seq = 0;
const nextId = () => ++seq;

/**
 * Styled to look like the real Claude Code CLI: a `✻ Welcome to Claude Code!`
 * box, a `>` input prompt, `●` tool-use bullet lines, `⏺` answer markers, muted
 * gray system text, and Claude's clay/coral accent (#D97757) — never green.
 */
export function ClaudeTerminal({
  pendingQuestion,
  onQuestionConsumed,
}: ClaudeTerminalProps) {
  // Decoupled from OS reduce-motion: the streamed "agentic" reply is a
  // signature showcase, so it animates unless the user opts out in Settings.
  const reduced = !useDelightMotion();
  const [lines, setLines] = useState<Line[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const [histIdx, setHistIdx] = useState(-1);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const timers = useRef<number[]>([]);
  // running conversation sent to the backend for follow-up context
  const convo = useRef<ChatMessage[]>([]);

  // cleanup any pending timers on unmount
  useEffect(
    () => () => {
      timers.current.forEach((t) => window.clearTimeout(t));
      timers.current = [];
    },
    [],
  );

  // auto-scroll
  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: reduced ? "auto" : "smooth",
    });
  }, [lines, busy, reduced]);

  const push = useCallback((line: Omit<Line, "id">) => {
    setLines((l) => [...l, { ...line, id: nextId() } as Line]);
  }, []);

  const wait = (ms: number) =>
    new Promise<void>((resolve) => {
      const t = window.setTimeout(() => resolve(), ms);
      timers.current.push(t);
    });

  /** Word-stream `text` into an EXISTING answer line (instant if reduced). */
  const streamInto = useCallback(
    async (id: number, text: string) => {
      if (reduced) {
        setLines((l) => l.map((ln) => (ln.id === id ? { ...ln, text } : ln)));
        return;
      }
      const words = text.split(" ");
      let acc = "";
      for (let i = 0; i < words.length; i++) {
        acc += (i === 0 ? "" : " ") + words[i];
        const snapshot = acc;
        setLines((l) =>
          l.map((ln) => (ln.id === id ? { ...ln, text: snapshot } : ln)),
        );
        await wait(14 + Math.random() * 22);
      }
    },
    [reduced],
  );

  const runQuestion = useCallback(
    async (question: string) => {
      const { toolCalls, answer: fallback, fileCount } = route(question);
      // emit agentic "tool call" flavor lines with small delays
      for (const call of toolCalls as ToolCall[]) {
        push({ kind: "tool", text: `● ${call.label}…` });
        await wait(reduced ? 0 : 280 + Math.random() * 220);
      }
      push({
        kind: "tool",
        text: `● Done (${fileCount} file${fileCount === 1 ? "" : "s"})`,
      });
      await wait(reduced ? 0 : 200);

      // live answer line the backend streams real tokens into
      const id = nextId();
      setLines((l) => [...l, { id, kind: "answer", text: "" }]);
      let acc = "";
      const append = (t: string) => {
        acc += t;
        const snapshot = acc;
        setLines((l) =>
          l.map((ln) => (ln.id === id ? { ...ln, text: snapshot } : ln)),
        );
      };

      convo.current.push({ role: "user", content: question });
      const outcome = await askBackend(convo.current.slice(-12), append);

      if (outcome.status === "rate_limited") {
        const note = `Easy — that's a lot of questions fast. Give it ${outcome.retryAfter}s and ask again.`;
        if (!acc) await streamInto(id, note);
        else append("\n\n" + note);
      } else if (outcome.status !== "ok") {
        // backend offline (no API key) or errored -> use the built-in answer
        if (!acc) await streamInto(id, fallback);
        acc = acc || fallback;
      }

      convo.current.push({ role: "assistant", content: acc || fallback });
      if (convo.current.length > 24) {
        convo.current = convo.current.slice(-24);
      }
    },
    [push, reduced, streamInto],
  );

  const submit = useCallback(
    async (raw: string) => {
      const value = raw.trim();
      if (!value || busy) return;
      setInput("");
      setHistory((h) => [...h, value]);
      setHistIdx(-1);
      push({ kind: "input", text: value });
      setBusy(true);

      const result = runCommand(value);
      if (result.clear) {
        setLines([]);
      } else if (result.lines) {
        for (const text of result.lines) push({ kind: "output", text });
      } else if (result.ask) {
        await runQuestion(result.ask);
      }
      setBusy(false);
      requestAnimationFrame(() => inputRef.current?.focus());
    },
    [busy, push, runQuestion],
  );

  // run external (Spotlight) question
  useEffect(() => {
    if (pendingQuestion) {
      void submit(pendingQuestion);
      onQuestionConsumed?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingQuestion]);

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (history.length === 0) return;
      const idx = histIdx === -1 ? history.length - 1 : Math.max(0, histIdx - 1);
      setHistIdx(idx);
      setInput(history[idx]);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (histIdx === -1) return;
      const idx = histIdx + 1;
      if (idx >= history.length) {
        setHistIdx(-1);
        setInput("");
      } else {
        setHistIdx(idx);
        setInput(history[idx]);
      }
    }
  }

  const empty = lines.length === 0;

  return (
    <div
      className="flex h-full flex-col bg-[#1c1b1a]/95 font-mono text-[0.82rem] leading-[1.7] text-[#d7d3cc] backdrop-blur-xl"
      onClick={() => inputRef.current?.focus()}
    >
      {/* subtle terminal tab strip */}
      <div className="flex h-7 shrink-0 items-center gap-2 border-b border-white/[0.06] bg-white/[0.03] px-4">
        <span className="flex items-center gap-1.5 text-[0.72rem] text-[#a8a39c]">
          <span className="text-claude">✻</span>
          claude — ~/davel
        </span>
      </div>

      <div
        ref={scrollRef}
        className="scroll-region min-h-0 flex-1 overflow-y-auto px-[18px] py-4"
        aria-live="polite"
        aria-label="Claude Code terminal output"
      >
        {/* Claude Code welcome box */}
        <div className="mb-4 rounded-lg border border-[#3c3833] px-4 py-3">
          <p className="text-[#ece9e3]">
            <span className="text-claude">✻</span>{" "}
            <span className="font-semibold">Welcome to Claude Code!</span>
          </p>
          <div className="mt-2 space-y-1 text-[#8a8782]">
            <p>
              Ask anything about Davel — or type{" "}
              <span className="text-[#a8a39c]">/help</span>
            </p>
            <p className="text-[#6f6b64]">cwd: ~/davel</p>
          </div>
        </div>

        {lines.map((line) => {
          switch (line.kind) {
            case "input":
              return (
                <div key={line.id} className="mt-2">
                  <span className="text-claude">{"> "}</span>
                  <span className="text-[#ece9e3]">{line.text}</span>
                </div>
              );
            case "tool":
              return (
                <div key={line.id} className="text-[#8a8782]">
                  {line.text}
                </div>
              );
            case "answer":
              return (
                <div
                  key={line.id}
                  className="mt-1.5 flex gap-2 whitespace-pre-wrap text-[#d7d3cc]"
                >
                  <span className="text-claude">{"⏺"}</span>
                  <span>{line.text}</span>
                </div>
              );
            case "output":
            default:
              return (
                <div key={line.id} className="whitespace-pre-wrap text-[#b3afa8]">
                  {line.text || " "}
                </div>
              );
          }
        })}

        {/* Claude Code input box */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void submit(input);
          }}
          className="mt-3"
        >
          <div className="flex items-center rounded-lg border border-[#3c3833] px-3 py-2 transition-colors focus-within:border-claude/60">
            <span className="text-claude">{">"}</span>
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              disabled={busy}
              spellCheck={false}
              autoComplete="off"
              autoCapitalize="off"
              aria-label="Terminal input"
              className="ml-2 flex-1 bg-transparent text-[#ece9e3] caret-[#d97757] outline-none placeholder:text-[#6f6b64] disabled:opacity-60"
              placeholder={busy ? "working…" : "Ask anything about Davel…"}
            />
            {busy ? (
              <span className="ml-2 size-2 shrink-0 animate-pulse rounded-full bg-[#d97757]" />
            ) : null}
          </div>
          <p className="mt-1.5 px-1 text-[0.7rem] text-[#6f6b64]">
            <span className="text-[#8a8782]">?</span> for shortcuts
          </p>
        </form>
      </div>

      {/* suggested prompts */}
      {empty ? (
        <div className="flex flex-wrap gap-2 border-t border-white/[0.06] px-[18px] py-3">
          {SUGGESTED.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => void submit(s)}
              className="rounded-full border border-white/10 px-3 py-1 text-[0.72rem] text-[#b3afa8] transition-colors hover:border-claude/50 hover:text-claude"
            >
              {s}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

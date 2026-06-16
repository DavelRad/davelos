import { useMemo } from "react";
import hljs from "highlight.js/lib/core";
import typescript from "highlight.js/lib/languages/typescript";
import { FileCode2, Circle } from "lucide-react";

hljs.registerLanguage("typescript", typescript);

/**
 * VS Code-style read-only editor showing Davel modeled as a typed object.
 * A small professional flex — he ships a VS Code extension. Syntax-highlighted
 * with highlight.js; gutter line numbers; no editing.
 */
const SOURCE = `/**
 * davel.config.ts — a software engineer & founder, as a typed object.
 */
export const davel = {
  name: "Davel Radindra",
  role: "Software Engineer & Co-founder",
  location: "San Francisco, CA",
  building: "AI developer tools @ Nogic",

  shipped: {
    vscodeInstalls: 35_000,
    inputTokenCostCut: "~90%",
    usersServed: 25_000,
  },

  stack: {
    languages: ["Python", "TypeScript", "Go", "SQL"],
    backend: ["FastAPI", "Cloud Run", "Docker", "Claude"],
    agentic: ["LangGraph", "uAgents", "BM25 + LLM rerank"],
  },

  education: {
    school: "San José State University",
    degree: "B.S. Computer Science",
    detail: "Dec 2025 · GPA 3.9",
  },

  openTo: "select work",
  contact: "davel.radindra2@gmail.com",
} as const;
`;

export function AboutEditor() {
  const highlighted = useMemo(
    () => hljs.highlight(SOURCE, { language: "typescript" }).value,
    [],
  );
  const lineCount = SOURCE.replace(/\n$/, "").split("\n").length;

  return (
    <div className="flex h-full flex-col bg-[#1e1e1e] text-[0.8rem]">
      {/* tab bar — VS Code dark */}
      <div className="flex shrink-0 items-center gap-2 bg-[#252526] px-0 py-0 text-xs">
        <span className="flex items-center gap-1.5 border-r border-[#1e1e1e] border-t-2 border-t-[#0e639c] bg-[#1e1e1e] px-3 py-1.5 text-[#d4d4d4]">
          <FileCode2 className="size-3.5 text-[#519aba]" />
          about.ts
          <Circle className="size-1.5 fill-[#858585] text-[#858585]" />
        </span>
        <span className="ml-auto px-3 font-mono text-[0.6rem] text-[#858585]">
          read-only
        </span>
      </div>

      {/* code with gutter */}
      <div className="scroll-region min-h-0 flex-1 overflow-auto">
        <div className="flex min-w-max font-mono leading-[1.55]">
          <div
            aria-hidden
            className="select-none px-3 py-3 text-right text-[#6e7681]"
          >
            {Array.from({ length: lineCount }, (_, i) => (
              <div key={i}>{i + 1}</div>
            ))}
          </div>
          <pre className="hljs flex-1 bg-transparent px-4 py-3 text-[#d4d4d4]">
            <code dangerouslySetInnerHTML={{ __html: highlighted }} />
          </pre>
        </div>
      </div>

      {/* status bar — VS Code blue */}
      <div className="flex shrink-0 items-center justify-between bg-[#007acc] px-3 py-1 font-mono text-[0.6rem] text-white">
        <span>TypeScript</span>
        <span>UTF-8 · LF · Ln {lineCount}</span>
      </div>
    </div>
  );
}

import {
  ExternalLink,
  TrendingUp,
  AlertTriangle,
  Rocket,
  Check,
  Building2,
  ClipboardList,
  Quote,
  type LucideIcon,
} from "lucide-react";
import { PhotoSlot } from "../components/PhotoSlot";

/* ------------------------------------------------------------------ *
 * Startup app — Davel's startup journey. Three sections:
 *   1. Nogic (the company)         2. Founders Inc (community/studio)
 *   3. YC · Paxel report (his genuine YC-tool artifact)
 * The Paxel content is verbatim from the real Y Combinator tool report.
 *
 * Visual language matches the Obsidian app: tinted, accent-bordered callouts.
 * ------------------------------------------------------------------ */

const STATS: { label: string; value: string; sub?: string }[] = [
  { label: "The Architect", value: "67%", sub: "sessions include architecture discussions" },
  { label: "Working style", value: "Back-and-forth", sub: "works in dialogue, not dictation" },
  { label: "Longest session", value: "16h 0m" },
  { label: "Parallelism", value: "3 agents", sub: "at once" },
  { label: "Total", value: "95 hours", sub: "across 18 sessions" },
  { label: "Prompts / session", value: "67" },
  { label: "Avg prompt length", value: "244 words" },
  { label: "Product Thinker", value: "67%", sub: "reference product decisions" },
];

const DECISIONS = [
  { label: "Full Stop and Investigate", count: 22 },
  { label: "Follow the Reference Product", count: 11 },
  { label: "Workflow from User Backwards", count: 6 },
];

const STRENGTHS = [
  "Product-frame correction instinct — interrogates the framing before building.",
  "High quality bar near public release — rejects incoherent output instead of polishing around it.",
  "Knows when to delete a broken foundation and reset, rather than patching.",
];

const GROWTH = [
  "Planning consistency across sessions.",
  "Tighter specs on generation tasks.",
  "Add explicit acceptance checks after redirects.",
];

/* ---- callout (same look as the Obsidian reading view) ---- */

type CalloutColor = "green" | "blue" | "teal" | "purple" | "orange" | "gray";

const CO: Record<CalloutColor, string> = {
  green: "94, 211, 154",
  blue: "84, 156, 255",
  teal: "56, 191, 168",
  purple: "167, 139, 250",
  orange: "230, 159, 70",
  gray: "158, 158, 166",
};

function Callout({
  color,
  icon: Icon,
  title,
  children,
}: {
  color: CalloutColor;
  icon: LucideIcon;
  title: string;
  children?: React.ReactNode;
}) {
  const rgb = CO[color];
  return (
    <div
      className="mb-3 rounded-lg border p-3"
      style={{
        borderColor: `rgba(${rgb}, 0.32)`,
        borderLeft: `3px solid rgb(${rgb})`,
        background: `rgba(${rgb}, 0.08)`,
      }}
    >
      <div
        className="flex items-center gap-2 text-sm font-semibold"
        style={{ color: `rgb(${rgb})` }}
      >
        <Icon className="size-4 shrink-0" />
        {title}
      </div>
      {children ? (
        <div className="mt-1.5 text-sm leading-relaxed text-[#d4d4da]">
          {children}
        </div>
      ) : null}
    </div>
  );
}

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border border-[#fb651e55] bg-[#fb651e1f] px-2 py-0.5 text-[0.72rem] font-medium text-[#ffb38c]">
      {children}
    </span>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-3 mt-7 flex items-center gap-2 text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-[#8a8a93] first:mt-0">
      {children}
    </p>
  );
}

export function Startup() {
  return (
    <div className="flex h-full flex-col bg-[#0f0f11] text-[#e7e7ea]">
      {/* header */}
      <div className="flex shrink-0 items-center gap-3 border-b border-white/8 bg-[#141417] px-5 py-3">
        <div className="grid size-8 place-items-center rounded-lg bg-[#fb651e] text-sm font-bold text-white">
          <Rocket className="size-4" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">Davel — Startup Journey</p>
          <p className="truncate text-xs text-[#9a9aa2]">
            Nogic · Founders Inc · Y Combinator
          </p>
        </div>
      </div>

      <div className="scroll-region min-h-0 flex-1 overflow-y-auto px-5 py-5">
        {/* 1. NOGIC */}
        <SectionLabel>
          <Rocket className="size-3.5 text-[#fb651e]" /> Startup — Nogic
        </SectionLabel>

        <Callout color="teal" icon={ClipboardList} title="What it is">
          <span className="font-semibold text-white">Nogic</span> is the dev-tools
          startup I co-founded — AI that reads your codebase and explains changes.
          A VS Code extension and a GitHub App that generate codebase and PR
          walkthroughs.
        </Callout>

        <div className="mb-3 flex flex-wrap gap-2">
          <Tag>#dev-tools</Tag>
          <Tag>#claude</Tag>
          <Tag>#fastapi</Tag>
          <Tag>#founders-inc</Tag>
        </div>

        <div className="grid gap-2.5 sm:grid-cols-2">
          <Callout color="green" icon={Check} title="35,000+ installs">
            VS Code extension shipped, plus a GitHub App generating codebase and
            PR walkthroughs.
          </Callout>
          <Callout color="green" icon={Check} title="~90% input-token cost cut">
            FastAPI / Cloud Run backend — 13 REST + SSE endpoints — with Claude
            model routing and prompt caching.
          </Callout>
        </div>

        <div className="mt-3">
          <PhotoSlot name="nogic-team" caption="Nogic — building day" />
        </div>

        {/* 2. FOUNDERS INC */}
        <SectionLabel>Founders Inc</SectionLabel>

        <Callout color="blue" icon={Building2} title="Founders Inc alum">
          Nogic went through <span className="font-semibold text-white">Founders
          Inc</span> (f.inc) — an SF startup community and studio at{" "}
          <span className="text-white">Fort Mason</span>, Marina. Founded{" "}
          <span className="text-white">2020 by Furqan Rydhan</span>, backing
          emerging-tech founders across AI, hardware, robotics, AR/VR, and
          consumer.
        </Callout>

        <div className="grid gap-2.5 sm:grid-cols-2">
          <div className="rounded-lg border border-white/8 bg-[#141417] p-3 text-xs text-[#c4c4cc]">
            <ul className="space-y-1.5">
              <li>• ~4–7% equity, indefinite-support model (not a fixed batch)</li>
              <li>• 42,000-sqft campus at Fort Mason</li>
              <li>• Hardware lab · media studio · gym · event spaces</li>
              <li>• Community of emerging-tech founders</li>
            </ul>
          </div>
          <div className="grid gap-2.5">
            <PhotoSlot name="founders-inc-campus" caption="Founders Inc — Fort Mason" />
          </div>
        </div>
        <div className="mt-2.5">
          <PhotoSlot name="founders-inc-demo" caption="Demo day" />
        </div>

        {/* 3. YC · PAXEL */}
        <SectionLabel>Y Combinator · Paxel report</SectionLabel>
        <div className="flex items-center gap-3 rounded-t-xl border border-b-0 border-white/8 bg-[#141417] px-4 py-3">
          <div className="grid size-8 place-items-center rounded-lg bg-[#fb651e] font-serif text-base font-bold text-white">
            Y
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">Report #2 — nogic</p>
            <p className="truncate text-xs text-[#9a9aa2]">18 sessions · Jun 6, 2026</p>
          </div>
          <a
            href="https://paxel.ycombinator.com/results/zcdbf2hp"
            target="_blank"
            rel="noopener noreferrer"
            className="ml-auto flex items-center gap-1 rounded-full border border-white/12 px-2.5 py-1 text-[0.7rem] text-[#c4c4cc] transition-colors hover:bg-white/5 active:scale-95"
          >
            View report <ExternalLink className="size-3" />
          </a>
        </div>

        <div className="rounded-b-xl border border-white/8 bg-[#0f0f11] p-4">
          {/* headline narrative as a quote callout */}
          <Callout
            color="purple"
            icon={Quote}
            title="How Davel codes with Claude Code"
          >
            “Strong engineering judgment when the work has stakes: interrogates the
            product frame, forces Claude Code back to real files and real
            screenshots, and rejects incoherent output instead of polishing around
            it.”
          </Callout>

          {/* stat grid */}
          <div className="mt-1 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            {STATS.map((s) => (
              <div key={s.label} className="rounded-lg border border-white/8 bg-[#16161a] p-3">
                <p className="text-[0.6rem] uppercase tracking-wide text-[#8a8a93]">{s.label}</p>
                <p className="mt-1 text-lg font-semibold leading-tight text-white">{s.value}</p>
                {s.sub ? <p className="mt-0.5 text-[0.65rem] leading-snug text-[#9a9aa2]">{s.sub}</p> : null}
              </div>
            ))}
          </div>

          {/* AI style + quirky prompts */}
          <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
            <div className="rounded-lg border border-white/8 bg-[#16161a] p-3">
              <p className="text-[0.6rem] uppercase tracking-wide text-[#8a8a93]">AI style</p>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                <span className="rounded-full bg-white/8 px-2.5 py-0.5 text-xs text-[#e7e7ea]">Dances with Robots</span>
                <span className="rounded-full bg-white/8 px-2.5 py-0.5 text-xs text-[#e7e7ea]">Cognitive Breadth</span>
              </div>
            </div>
            <div className="rounded-lg border border-white/8 bg-[#16161a] p-3 font-mono text-xs">
              <p className="text-[#9a9aa2]">
                go-to prompt <span className="text-[#e7e7ea]">“d2 creates svg?”</span>{" "}
                <span className="text-[#6a6a72]">×3</span>
              </p>
              <p className="mt-1.5 text-[#9a9aa2]">
                most cryptic <span className="text-[#e7e7ea]">“this shit just blank”</span>
              </p>
            </div>
          </div>

          {/* decision patterns */}
          <p className="mb-2 mt-5 text-sm font-semibold text-white">Decision patterns</p>
          <div className="space-y-1.5">
            {DECISIONS.map((d) => {
              const max = DECISIONS[0].count;
              return (
                <div key={d.label} className="flex items-center gap-3">
                  <span className="w-52 shrink-0 truncate text-xs text-[#c4c4cc]">{d.label}</span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/8">
                    <div className="h-full rounded-full bg-[#6b7cff]" style={{ width: `${(d.count / max) * 100}%` }} />
                  </div>
                  <span className="w-8 text-right font-mono text-xs text-[#9a9aa2]">×{d.count}</span>
                </div>
              );
            })}
          </div>

          {/* strengths as a green callout */}
          <div className="mt-5">
            <Callout color="green" icon={TrendingUp} title="Strengths">
              <ul className="space-y-1.5">
                {STRENGTHS.map((s) => (
                  <li key={s} className="flex gap-2 leading-relaxed">
                    <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-[#5ed39a]" />
                    {s}
                  </li>
                ))}
              </ul>
            </Callout>
          </div>

          {/* growth (compact, orange) */}
          <div className="rounded-lg border border-[#e69f4644] bg-[#e69f4614] px-4 py-3">
            <p className="flex items-center gap-2 text-xs font-semibold text-[#e69f46]">
              <AlertTriangle className="size-3.5" /> Growth areas
            </p>
            <ul className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[#c9b89a]">
              {GROWTH.map((g) => (
                <li key={g} className="flex items-center gap-1.5">
                  <span className="size-1 rounded-full bg-[#e69f46]" />
                  {g}
                </li>
              ))}
            </ul>
          </div>

          {/* more YC experience placeholder */}
          <div className="mt-3 rounded-lg border border-dashed border-white/12 bg-white/[0.02] px-4 py-3 text-xs text-[#9a9aa2]">
            <span className="font-medium text-[#c4c4cc]">More YC experience</span> —
            placeholder for additional Y Combinator involvement Davel will add
            later.
          </div>

          <p className="mt-4 text-center text-[0.6rem] text-[#6a6a72]">
            Built by Y Combinator · paxel.ycombinator.com
          </p>
        </div>
      </div>
    </div>
  );
}

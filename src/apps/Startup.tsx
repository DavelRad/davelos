import {
  ExternalLink,
  AlertTriangle,
  Rocket,
  Check,
  Building2,
  ClipboardList,
  Quote,
  Compass,
  Layers,
  TrendingDown,
  Crosshair,
  Users,
  type LucideIcon,
} from "lucide-react";
import { Gallery } from "../components/Gallery";
import { photosFor } from "../data/photos";

/* ------------------------------------------------------------------ *
 * Startup app — Davel's FOUNDER JOURNEY. Sections:
 *   1. The build — Nogic (product-forward: metrics + pipeline diagram, no photos)
 *   2. Founders Inc (the studio + real photos from his time there)
 *   3. How I operate — founder skills (grounded in real wins + the Paxel data)
 *   4. Y Combinator · the data (his genuine Paxel-tool report)
 * Visual language matches the Obsidian app: tinted, accent-bordered callouts.
 * ------------------------------------------------------------------ */

const FOUNDER_SKILLS: { icon: LucideIcon; title: string; body: string }[] = [
  {
    icon: Rocket,
    title: "Ship to real users, fast",
    body: "Nogic hit 35,000+ installs and htmlnote shipped as an OSS Claude Code plugin — I get things into people's hands instead of polishing prototypes.",
  },
  {
    icon: Layers,
    title: "Go a layer deeper than the API",
    body: "I built the retrieval (BM25 + rerank), the agent loop, and the verification layer most teams skip. Depth on the hard infra is the moat.",
  },
  {
    icon: TrendingDown,
    title: "Founder-grade cost discipline",
    body: "~90% input-token cost cut at Nogic; 80% infra + 50% LLM cost cut at Jonajo. I treat unit economics as a feature, not an afterthought.",
  },
  {
    icon: Crosshair,
    title: "Correct the frame before building",
    body: "I interrogate the product framing and work backwards from the user — the Paxel analysis flagged this as my strongest instinct.",
  },
  {
    icon: Check,
    title: "High bar near release",
    body: "I reject incoherent output instead of patching around it, and I'll delete a broken foundation and reset rather than ship it.",
  },
  {
    icon: Users,
    title: "Orchestrate, don't dictate",
    body: "I run multiple agents in parallel and build in dialogue — 95 hours across 18 sessions on Nogic, back-and-forth, not one-shot.",
  },
];

const STATS: { label: string; value: string; sub?: string }[] = [
  { label: "Archetype", value: "The Architect", sub: "67% of sessions discuss architecture" },
  { label: "Working style", value: "Back-and-forth", sub: "builds in dialogue, not dictation" },
  { label: "Total", value: "95 hours", sub: "across 18 sessions" },
  { label: "Parallelism", value: "3 agents", sub: "at once" },
  { label: "Longest session", value: "16h 0m" },
  { label: "Prompts / session", value: "67" },
  { label: "Avg prompt length", value: "244 words" },
  { label: "Product Thinker", value: "67%", sub: "reference product decisions" },
];

const DECISIONS = [
  { label: "Full Stop and Investigate", count: 22 },
  { label: "Follow the Reference Product", count: 11 },
  { label: "Workflow from User Backwards", count: 6 },
];

const GROWTH = [
  "Planning consistency across sessions.",
  "Tighter specs on generation tasks.",
  "Explicit acceptance checks after redirects.",
];

/* ---- the Y Combinator mark (authentic logo: thick white Y on orange) ---- */
function YCMark({ size = 32 }: { size?: number }) {
  return (
    <div
      className="relative grid shrink-0 place-items-center overflow-hidden"
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.22,
        background: "#fb651e",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.35), 0 2px 6px -2px rgba(0,0,0,0.5)",
      }}
    >
      <svg viewBox="0 0 100 100" width="100%" height="100%" aria-hidden="true">
        <g stroke="#fff" strokeWidth={10.5} fill="none" strokeLinecap="butt">
          <path d="M30 26 L50 50 L70 26" />
          <path d="M50 49 L50 76" />
        </g>
      </svg>
    </div>
  );
}

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
        <div className="mt-1.5 text-sm leading-relaxed text-[#d4d4da]">{children}</div>
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
    <p className="mb-3 mt-8 flex items-center gap-2 text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-[#8a8a93] first:mt-0">
      {children}
    </p>
  );
}

export function Startup() {
  return (
    <div className="flex h-full flex-col bg-[#0f0f11] text-[#e7e7ea]">
      {/* header */}
      <div className="flex shrink-0 items-center gap-3 border-b border-white/8 bg-[#141417] px-5 py-3">
        <YCMark size={34} />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">Davel — Founder's Journey</p>
          <p className="truncate text-xs text-[#9a9aa2]">Nogic · Founders Inc · Y Combinator</p>
        </div>
      </div>

      <div className="scroll-region min-h-0 flex-1 overflow-y-auto px-5 py-5">
        {/* 1. THE BUILD — NOGIC (product) */}
        <SectionLabel>
          <Rocket className="size-3.5 text-[#fb651e]" /> The build — Nogic
        </SectionLabel>

        <Callout color="teal" icon={ClipboardList} title="What I'm building">
          <span className="font-semibold text-white">Nogic</span> — the dev-tools
          startup I co-founded. AI that reads your codebase and explains changes: a
          VS Code extension and a GitHub App that generate codebase and PR
          walkthroughs.
        </Callout>

        <div className="grid gap-2.5 sm:grid-cols-2">
          <Callout color="green" icon={Check} title="35,000+ installs">
            VS Code extension shipped, plus a GitHub App generating codebase and PR
            walkthroughs.
          </Callout>
          <Callout color="green" icon={Check} title="~90% input-token cost cut">
            FastAPI / Cloud Run backend — 13 REST + SSE endpoints — with Claude
            model routing and prompt caching.
          </Callout>
        </div>

        {/* the product, as an architecture diagram */}
        <img
          src="/diagrams/nogic-pipeline.svg"
          alt="Nogic pipeline: codebase → retrieval → agent loop → verification → walkthrough"
          className="mt-3 w-full rounded-xl"
          loading="lazy"
        />

        <div className="mt-3 flex flex-wrap gap-2">
          <Tag>#dev-tools</Tag>
          <Tag>#claude</Tag>
          <Tag>#fastapi</Tag>
          <Tag>#cloud-run</Tag>
        </div>

        {/* 2. FOUNDERS INC + photos */}
        <SectionLabel>
          <Building2 className="size-3.5 text-[#549cff]" /> Founders Inc
        </SectionLabel>

        <Callout color="blue" icon={Building2} title="Founders Inc alum">
          Nogic went through <span className="font-semibold text-white">Founders Inc</span>{" "}
          (f.inc) — the SF startup studio + community at{" "}
          <span className="text-white">Fort Mason</span>, Marina. A ~4–7% equity,
          indefinite-support model on a 42,000-sqft campus — hardware lab, media
          studio, gym, and a community of emerging-tech founders.
        </Callout>

        <Gallery photos={photosFor("founders-inc")} />

        {/* 3. FOUNDER SKILLS */}
        <SectionLabel>
          <Compass className="size-3.5 text-[#a78bfa]" /> How I operate — founder skills
        </SectionLabel>

        <div className="grid gap-2.5 sm:grid-cols-2">
          {FOUNDER_SKILLS.map(({ icon: Icon, title, body }) => (
            <div key={title} className="rounded-lg border border-white/8 bg-[#141417] p-3">
              <p className="flex items-center gap-2 text-sm font-semibold text-white">
                <Icon className="size-4 shrink-0 text-[#a78bfa]" />
                {title}
              </p>
              <p className="mt-1 text-xs leading-relaxed text-[#b4b4bc]">{body}</p>
            </div>
          ))}
        </div>

        {/* 4. YC · PAXEL — the data behind the skills */}
        <SectionLabel>Y Combinator · the data</SectionLabel>
        <div className="flex items-center gap-3 rounded-t-xl border border-b-0 border-white/8 bg-[#141417] px-4 py-3">
          <YCMark size={32} />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">Paxel report #2 — nogic</p>
            <p className="truncate text-xs text-[#9a9aa2]">
              a YC tool analyzed how I actually build · 18 sessions
            </p>
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
          <Callout color="purple" icon={Quote} title="The headline">
            “Strong engineering judgment when the work has stakes: interrogates the
            product frame, forces Claude Code back to real files and real
            screenshots, and rejects incoherent output instead of polishing around
            it.”
          </Callout>

          <div className="mt-1 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            {STATS.map((s) => (
              <div key={s.label} className="rounded-lg border border-white/8 bg-[#16161a] p-3">
                <p className="text-[0.6rem] uppercase tracking-wide text-[#8a8a93]">{s.label}</p>
                <p className="mt-1 text-base font-semibold leading-tight text-white">{s.value}</p>
                {s.sub ? <p className="mt-0.5 text-[0.65rem] leading-snug text-[#9a9aa2]">{s.sub}</p> : null}
              </div>
            ))}
          </div>

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

          <div className="mt-5 rounded-lg border border-[#e69f4644] bg-[#e69f4614] px-4 py-3">
            <p className="flex items-center gap-2 text-xs font-semibold text-[#e69f46]">
              <AlertTriangle className="size-3.5" /> Where I'm still leveling up
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

          <p className="mt-4 text-center text-[0.6rem] text-[#6a6a72]">
            Built by Y Combinator · paxel.ycombinator.com
          </p>
        </div>
      </div>
    </div>
  );
}

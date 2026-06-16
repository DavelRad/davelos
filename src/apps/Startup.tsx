import {
  Rocket,
  Building2,
  Compass,
  Layers,
  TrendingDown,
  Crosshair,
  Check,
  Users,
  FileText,
  type LucideIcon,
} from "lucide-react";
import { Gallery } from "../components/Gallery";
import { photosFor } from "../data/photos";
import { PaxelReport } from "./PaxelReport";

/* Davel's FOUNDER JOURNEY — prose-forward (not box-spam):
 *   1. The build — Nogic (a paragraph + a clean stat row + the pipeline diagram)
 *   2. Founders Inc (a paragraph + the real photo gallery, captioned)
 *   3. Founder skills (a clean divided list, grounded in real wins + Paxel)
 *   4. Y Combinator — the actual Paxel report, recreated 1:1
 */

const FOUNDER_SKILLS: { icon: LucideIcon; title: string; body: string }[] = [
  { icon: Rocket, title: "Ship to real users, fast", body: "Nogic hit 35,000+ installs and htmlnote shipped as an OSS Claude Code plugin — I get things into people's hands instead of polishing prototypes." },
  { icon: Layers, title: "Go a layer deeper than the API", body: "I built the retrieval (BM25 + rerank), the agent loop, and the verification layer most teams skip. Depth on the hard infra is the moat." },
  { icon: TrendingDown, title: "Founder-grade cost discipline", body: "~90% input-token cost cut at Nogic; 80% infra + 50% LLM cost cut at Jonajo. I treat unit economics as a feature." },
  { icon: Crosshair, title: "Correct the frame before building", body: "I interrogate the product framing and work backwards from the user — the Paxel analysis flagged this as my strongest instinct." },
  { icon: Check, title: "High bar near release", body: "I reject incoherent output instead of patching around it, and I'll delete a broken foundation and reset rather than ship it." },
  { icon: Users, title: "Orchestrate, don't dictate", body: "I run multiple agents in parallel and build in dialogue — 95 hours across 18 sessions on Nogic, back-and-forth, not one-shot." },
];

const TAGS = ["#dev-tools", "#claude", "#fastapi", "#cloud-run"];

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

function SectionLabel({ icon: Icon, tint, children }: { icon: LucideIcon; tint: string; children: React.ReactNode }) {
  return (
    <p className="mb-3 mt-9 flex items-center gap-2 text-[0.7rem] font-semibold uppercase tracking-[0.15em] text-[#8a8a93] first:mt-0">
      <Icon className="size-3.5" style={{ color: tint }} />
      {children}
    </p>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <p className="text-xl font-semibold leading-none text-white">{value}</p>
      <p className="mt-1.5 text-[0.7rem] text-[#9a9aa2]">{label}</p>
    </div>
  );
}

export function Startup() {
  return (
    <div className="flex h-full flex-col bg-[#0f0f11] text-[#e7e7ea]">
      <div className="flex shrink-0 items-center gap-3 border-b border-white/8 bg-[#141417] px-5 py-3">
        <YCMark size={34} />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">Davel — Founder's Journey</p>
          <p className="truncate text-xs text-[#9a9aa2]">Nogic · Founders Inc · Y Combinator</p>
        </div>
      </div>

      <div className="scroll-region min-h-0 flex-1 overflow-y-auto px-5 py-5">
        {/* 1. THE BUILD — NOGIC */}
        <SectionLabel icon={Rocket} tint="#fb651e">The build — Nogic</SectionLabel>
        <p className="text-sm leading-relaxed text-[#c8c8d0]">
          <span className="font-semibold text-white">Nogic</span> is the dev-tools
          startup I co-founded — AI that reads your codebase and explains changes. A
          VS Code extension and a GitHub App that generate codebase and PR
          walkthroughs, on a FastAPI / Cloud Run backend with Claude model routing
          and prompt caching.
        </p>
        <div className="mt-4 flex flex-wrap gap-x-9 gap-y-3">
          <Stat value="35,000+" label="VS Code installs" />
          <Stat value="~90%" label="input-token cost cut" />
          <Stat value="13" label="REST + SSE endpoints" />
        </div>
        <img
          src="/diagrams/nogic-pipeline.svg"
          alt="Nogic pipeline: codebase → retrieval → agent loop → verification → walkthrough"
          className="mt-4 w-full rounded-xl"
          loading="lazy"
        />
        <div className="mt-3 flex flex-wrap gap-2">
          {TAGS.map((t) => (
            <span
              key={t}
              className="rounded-full border border-[#fb651e55] bg-[#fb651e1f] px-2 py-0.5 text-[0.72rem] font-medium text-[#ffb38c]"
            >
              {t}
            </span>
          ))}
        </div>

        {/* 2. FOUNDERS INC */}
        <SectionLabel icon={Building2} tint="#549cff">Founders Inc</SectionLabel>
        <p className="text-sm leading-relaxed text-[#c8c8d0]">
          Nogic went through <span className="font-semibold text-white">Founders Inc</span>{" "}
          (f.inc) — the SF startup studio and community at Fort Mason. A ~4–7% equity,
          indefinite-support model on a 42,000-sqft campus: hardware lab, media studio,
          gym, and a room full of emerging-tech founders. Late nights, demo days, and a
          lot of "0 → 15,000 installs" on the big screen.
        </p>
        <div className="mt-3">
          <Gallery photos={photosFor("founders-inc")} />
        </div>

        {/* 3. FOUNDER SKILLS — clean list */}
        <SectionLabel icon={Compass} tint="#a78bfa">How I operate — founder skills</SectionLabel>
        <div>
          {FOUNDER_SKILLS.map(({ icon: Icon, title, body }) => (
            <div key={title} className="flex gap-3 border-b border-white/[0.06] py-3 last:border-0">
              <Icon className="mt-0.5 size-4 shrink-0 text-[#a78bfa]" />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-white">{title}</p>
                <p className="mt-0.5 text-xs leading-relaxed text-[#a6a6ae]">{body}</p>
              </div>
            </div>
          ))}
        </div>

        {/* 4. Y COMBINATOR — the real Paxel report */}
        <SectionLabel icon={FileText} tint="#fb651e">Y Combinator — the report</SectionLabel>
        <p className="mb-3 text-sm leading-relaxed text-[#c8c8d0]">
          A YC tool (Paxel) analyzed 18 of my Claude Code sessions building Nogic.
          Here's the actual report:
        </p>
        <PaxelReport />
      </div>
    </div>
  );
}

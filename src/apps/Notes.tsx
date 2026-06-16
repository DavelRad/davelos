/**
 * Notes — a small macOS "stickies"-style note with a short personal note from
 * Davel. Adds a lived-in, human touch to the desktop. Read-only.
 */
export function Notes() {
  return (
    <div
      className="flex h-full flex-col text-[#4a4321]"
      style={{
        background: "linear-gradient(180deg, #fff7c2 0%, #ffe98a 100%)",
      }}
    >
      {/* Stickies-style title strip (slightly darker yellow band) */}
      <div
        className="shrink-0 px-4 py-1.5"
        style={{
          background: "linear-gradient(180deg, #ffe98a 0%, #fbdf6f 100%)",
          boxShadow: "inset 0 -1px 0 rgba(0,0,0,0.06)",
        }}
      >
        <p className="text-xs font-semibold tracking-tight text-[#7a6f33]">
          Sticky Note
        </p>
      </div>

      <div className="scroll-region min-h-0 flex-1 overflow-y-auto px-4 py-3 text-sm leading-relaxed">
        <p className="font-semibold">Hey — thanks for poking around davelOS 👋</p>
        <p className="mt-2">
          This whole desktop is the portfolio. A few pointers:
        </p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>
            <span className="font-medium">Obsidian</span> (left) — read my vault.
            About, work notes, projects.
          </li>
          <li>
            <span className="font-medium">Claude Code</span> (right) — ask it
            anything about me.
          </li>
          <li>
            <span className="font-medium">Startup</span> — Nogic, Founders Inc,
            and a YC tool's report on how I work with AI.
          </li>
          <li>
            Hit <span className="font-mono">⌘K</span> for Spotlight.
          </li>
        </ul>
        <p className="mt-3 text-[#6b6128]">
          Currently building <span className="font-semibold">Nogic</span> and
          open to select work. Let's talk.
        </p>
        <p className="mt-3 text-xs text-[#8a7d3a]">— Davel</p>
      </div>
    </div>
  );
}

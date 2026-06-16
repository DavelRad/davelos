/**
 * A faithful recreation of Davel's real Y Combinator "Paxel" report — the white
 * page, the orange frame, and the fanned deck of halftone "trading cards", each
 * with a question / answer / description. Data is verbatim from his report #2.
 */
const CARDS: { q: string; a: string; d: string }[] = [
  { q: "Which kind of builder are you?", a: "The Architect", d: "67% of sessions include architecture discussions." },
  { q: "How do you work with your agent?", a: "A back-and-forth", d: "You work in dialogue, shaping the work as you go." },
  { q: "Your longest single session?", a: "16h 0m", d: "Your deepest uninterrupted stretch with an agent." },
  { q: "How often do you plan first?", a: "6% in plan mode", d: "1 of 18 sessions opened in plan mode before writing code." },
  { q: "How many agents do you run?", a: "3 at once", d: "As many as 3 main sessions running at the same time." },
  { q: "What's your go-to prompt?", a: "“d2 creates svg?”", d: "You sent it 3 times." },
  { q: "And what else?", a: "Product Thinker", d: "67% of sessions reference product decisions." },
  { q: "How often do you change course?", a: "13% of the time", d: "You stop and redirect the agent mid-task rather than letting it run." },
  { q: "How long are your prompts?", a: "244 words", d: "On average — mostly conversational prompts." },
  { q: "How much time did you put in?", a: "95 hours", d: "Across 18 sessions." },
  { q: "Your most cryptic prompt?", a: "“this shit just blank”", d: "Somehow the agent knew exactly what you meant." },
  { q: "How much do you talk to your agent?", a: "67 prompts", d: "Per session, on average." },
];

const ROT = [-3, 2, -1.5, 2.5, -2, 1.5, -2.5, 1, -1.5, 2, -2, 1.5];

function YCSquare() {
  return (
    <div
      style={{ width: 26, height: 26, borderRadius: 6, background: "#fb651e", display: "grid", placeItems: "center" }}
    >
      <svg viewBox="0 0 100 100" width="100%" height="100%" aria-hidden="true">
        <g stroke="#fff" strokeWidth={11} fill="none" strokeLinecap="butt">
          <path d="M30 26 L50 50 L70 26" />
          <path d="M50 49 L50 76" />
        </g>
      </svg>
    </div>
  );
}

export function PaxelReport() {
  const url = "https://paxel.ycombinator.com/results/zcdbf2hp";
  return (
    <div className="pax">
      <div className="pax-nav">
        <YCSquare />
        <div className="pax-nav-right">
          Reports <span>[ ↑ Upload ]</span>
        </div>
      </div>

      <div className="pax-pagebody">
        <p className="pax-back">← Back to reports</p>
        <div className="pax-notice">
          This report is public. Anyone you send the link to can open it.
        </div>

        <div className="pax-head">
          <div>
            <p className="pax-title">Report #2</p>
            <p className="pax-sub">nogic · 18 sessions · Jun 6, 2026</p>
          </div>
          <a className="pax-share" href={url} target="_blank" rel="noopener noreferrer">
            ⇆ Share Report
          </a>
        </div>

        <p className="pax-lead">
          You show strong engineering judgment when the work has stakes: you
          interrogate the product frame, force Claude Code back to real files and
          real screenshots, and reject incoherent output instead of polishing
          around it.
        </p>

        <div className="pax-cards">
          {CARDS.map((c, i) => (
            <div className="pax-card" key={c.q} style={{ transform: `rotate(${ROT[i]}deg)` }}>
              <div className="pax-halftone">
                <span className="pax-hole" style={{ left: "30%" }} />
                <span className="pax-hole" style={{ left: "50%" }} />
                <span className="pax-hole" style={{ left: "70%" }} />
              </div>
              <div className="pax-card-body">
                <p className="pax-q">{c.q}</p>
                <p className="pax-a">{c.a}</p>
                <p className="pax-d">{c.d}</p>
              </div>
            </div>
          ))}
        </div>

        <a className="pax-ask" href={url} target="_blank" rel="noopener noreferrer">
          💬 Ask anything about this report
        </a>
      </div>
    </div>
  );
}

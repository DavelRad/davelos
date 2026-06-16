/**
 * macOS dock icons — REAL artwork extracted from the user's own Mac (their
 * installed .app bundles, converted to PNG in /public/icons), so the dock
 * matches a genuine macOS dock instead of hand-drawn approximations. The icons
 * already carry their own squircle shape, depth, and specular sheen; we just
 * render them at full size with a soft dock drop-shadow.
 *
 * Two icons are drawn (no installed app to extract): the Y Combinator mark for
 * the Startup app, and Obsidian uses its extracted brand png.
 */
import type { AppId } from "./types";

/** App id → real icon file (extracted from the user's installed apps). */
const ICON: Partial<Record<AppId, string>> = {
  obsidian: "/icons/obsidian.png",
  terminal: "/icons/claude.png", // Claude.app — the "Claude Code" session
  spotify: "/icons/spotify.png",
  notes: "/icons/stickies.png", // Stickies.app
  editor: "/icons/vscode.png", // Visual Studio Code
  mail: "/icons/mail.png",
  settings: "/icons/settings.png",
  github: "/icons/github.png", // opens the real profile in a new tab
  preview: "/icons/settings.png", // (preview has no dock slot; fallback)
};

function IconImg({ src, alt }: { src: string; alt: string }) {
  return (
    <img
      src={src}
      alt={alt}
      draggable={false}
      className="size-full object-contain"
    />
  );
}

/** Y Combinator logo — squircle in YC orange with a white serif "Y". */
function YCIcon() {
  return (
    <div
      className="relative grid size-full place-items-center overflow-hidden"
      style={{
        borderRadius: "23%",
        background: "#fb651e",
        boxShadow:
          "inset 0 1px 0 rgba(255,255,255,0.4), 0 3px 8px -2px rgba(0,0,0,0.5)",
      }}
    >
      {/* specular top sheen, matching the real-icon look */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.28) 0%, rgba(255,255,255,0.05) 24%, transparent 52%)",
        }}
      />
      <span
        style={{
          position: "relative",
          color: "#fff",
          fontWeight: 700,
          fontSize: "60%",
          lineHeight: 1,
          fontFamily: 'Georgia, "Times New Roman", "Times", serif',
        }}
      >
        Y
      </span>
    </div>
  );
}

export function TrashIcon() {
  return <IconImg src="/icons/trash.png" alt="Trash" />;
}

/** Resolve an app id to its dock icon. */
export function DockAppIcon({ id }: { id: AppId }) {
  if (id === "startup") return <YCIcon />;
  return <IconImg src={ICON[id] ?? "/icons/settings.png"} alt={id} />;
}

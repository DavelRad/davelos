/**
 * Authentic brand glyphs for apps that have a real product identity.
 * Typed to be drop-in compatible with how the dock / switchers render lucide
 * icons (they pass `className` and sometimes `strokeWidth`). These use
 * `fill="currentColor"` so the dock's `text-*` color drives them.
 */
export interface GlyphProps {
  className?: string;
  strokeWidth?: string | number;
  size?: string | number;
}

/** The Spotify "three bars in a circle" mark. */
export function SpotifyGlyph({ className }: GlyphProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="currentColor"
      aria-hidden
    >
      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.5 17.3a.75.75 0 0 1-1.03.25c-2.82-1.72-6.37-2.11-10.55-1.16a.75.75 0 1 1-.33-1.46c4.57-1.04 8.5-.59 11.66 1.34.36.22.47.68.25 1.03zm1.47-3.27a.94.94 0 0 1-1.29.31c-3.23-1.98-8.16-2.56-11.98-1.4a.94.94 0 1 1-.54-1.8c4.37-1.32 9.8-.68 13.5 1.6.44.27.58.85.31 1.29zm.13-3.4C15.78 8.3 8.7 8.07 4.97 9.2a1.12 1.12 0 1 1-.65-2.15c4.28-1.3 12.1-1.05 16.5 1.57a1.12 1.12 0 1 1-1.15 1.93z" />
    </svg>
  );
}

/** The Apple logo (menu bar). Uses currentColor. */
export function AppleLogo({ className }: GlyphProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M17.05 12.54c-.03-2.7 2.2-3.99 2.3-4.06-1.25-1.84-3.2-2.09-3.9-2.12-1.66-.17-3.24.98-4.08.98-.84 0-2.14-.96-3.52-.93-1.81.03-3.48 1.05-4.41 2.67-1.88 3.27-.48 8.1 1.35 10.76.9 1.3 1.96 2.76 3.36 2.71 1.35-.05 1.86-.87 3.49-.87 1.63 0 2.09.87 3.52.84 1.45-.03 2.37-1.32 3.26-2.63 1.03-1.5 1.45-2.96 1.47-3.04-.03-.01-2.82-1.08-2.85-4.28zM14.4 4.6c.74-.9 1.24-2.15 1.1-3.4-1.07.04-2.36.71-3.13 1.61-.69.79-1.29 2.06-1.13 3.27 1.19.09 2.42-.6 3.16-1.48z" />
    </svg>
  );
}

/** Control Center glyph — two stacked pill toggles (macOS menu bar). */
export function ControlCenterGlyph({ className }: GlyphProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden>
      <rect
        x="4.5"
        y="5.5"
        width="15"
        height="5"
        rx="2.5"
        stroke="currentColor"
        strokeWidth="1.4"
      />
      <circle cx="8" cy="8" r="1.4" fill="currentColor" />
      <rect
        x="4.5"
        y="13.5"
        width="15"
        height="5"
        rx="2.5"
        stroke="currentColor"
        strokeWidth="1.4"
      />
      <circle cx="16" cy="16" r="1.4" fill="currentColor" />
    </svg>
  );
}

/** Claude's "sunburst / asterisk" spark mark. */
export function ClaudeGlyph({ className }: GlyphProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="currentColor"
      aria-hidden
    >
      <path d="M12 2.2c.34 0 .62.27.63.61l.2 5.33 3.4-4.1a.63.63 0 0 1 1.02.73l-2.55 4.69 4.7-2.55a.63.63 0 0 1 .73 1.02l-4.1 3.4 5.33.2a.63.63 0 0 1 0 1.26l-5.33.2 4.1 3.4a.63.63 0 0 1-.73 1.02l-4.7-2.55 2.55 4.69a.63.63 0 0 1-1.02.73l-3.4-4.1-.2 5.33a.63.63 0 0 1-1.26 0l-.2-5.33-3.4 4.1a.63.63 0 0 1-1.02-.73l2.55-4.69-4.7 2.55a.63.63 0 0 1-.73-1.02l4.1-3.4-5.33-.2a.63.63 0 0 1 0-1.26l5.33-.2-4.1-3.4a.63.63 0 0 1 .73-1.02l4.7 2.55-2.55-4.69a.63.63 0 0 1 1.02-.73l3.4 4.1.2-5.33c.01-.34.29-.61.63-.61z" />
    </svg>
  );
}

import { useCallback, useEffect, useState } from "react";

/**
 * A responsive photo gallery with a full-screen lightbox (click a thumbnail,
 * arrow-keys / on-screen arrows to move, Esc / backdrop to close).
 *
 * All container elements are <span>s (with CSS display) + <button>/<img> so the
 * gallery is valid *inline* content — it can be dropped inside an Obsidian note
 * paragraph (`![gallery](gallery:<bucket>)`) as well as used directly in the
 * Startup app. Styling lives in index.css (.ph-*).
 */
export function Gallery({ photos }: { photos: string[] }) {
  const [open, setOpen] = useState<number | null>(null);
  const close = useCallback(() => setOpen(null), []);
  const step = useCallback(
    (d: number) =>
      setOpen((i) => (i === null ? i : (i + d + photos.length) % photos.length)),
    [photos.length],
  );

  useEffect(() => {
    if (open === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      else if (e.key === "ArrowLeft") step(-1);
      else if (e.key === "ArrowRight") step(1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, close, step]);

  if (!photos.length) return null;

  return (
    <span className="ph-gallery">
      <span className="ph-grid">
        {photos.map((src, i) => (
          <button
            key={src}
            type="button"
            className="ph-thumb"
            onClick={() => setOpen(i)}
            aria-label={`Open photo ${i + 1} of ${photos.length}`}
          >
            <img src={src} alt="" loading="lazy" />
          </button>
        ))}
      </span>

      {open !== null ? (
        <span className="ph-lightbox" onClick={close} role="dialog" aria-modal="true">
          <button
            type="button"
            className="ph-lb-btn ph-lb-close"
            onClick={close}
            aria-label="Close"
          >
            ✕
          </button>
          {photos.length > 1 ? (
            <button
              type="button"
              className="ph-lb-btn ph-lb-prev"
              onClick={(e) => {
                e.stopPropagation();
                step(-1);
              }}
              aria-label="Previous photo"
            >
              ‹
            </button>
          ) : null}
          <img
            className="ph-lb-img"
            src={photos[open]}
            alt=""
            onClick={(e) => e.stopPropagation()}
          />
          {photos.length > 1 ? (
            <button
              type="button"
              className="ph-lb-btn ph-lb-next"
              onClick={(e) => {
                e.stopPropagation();
                step(1);
              }}
              aria-label="Next photo"
            >
              ›
            </button>
          ) : null}
          <span className="ph-lb-count">
            {open + 1} / {photos.length}
          </span>
        </span>
      ) : null}
    </span>
  );
}

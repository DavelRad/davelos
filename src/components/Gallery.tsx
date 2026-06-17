import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { captionFor } from "../data/captions";

/**
 * A responsive photo gallery with a full-screen lightbox + per-photo captions.
 *
 * The lightbox is rendered through a PORTAL to document.body: davelOS windows
 * are positioned with CSS `transform`, which would otherwise trap a
 * `position: fixed` overlay inside the window (making the image overflow / look
 * zoomed-in). Portaling escapes that transform so the lightbox truly fills the
 * viewport and the image fits with `object-fit: contain`.
 *
 * Thumbnails are inline (<span>/<button>/<img>) so a gallery is valid inside a
 * note paragraph (`![gallery](gallery:<bucket>)`). Styling lives in index.css.
 */
export function Gallery({
  photos,
  variant = "default",
}: {
  photos: string[];
  /** "ios" = full-bleed square grid (the iPhone Photos look). */
  variant?: "default" | "ios";
}) {
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

  const caption = open !== null ? captionFor(photos[open]) : undefined;

  const ios = variant === "ios";
  return (
    <span className={ios ? "ph-gallery ph-gallery-ios" : "ph-gallery"}>
      <span className={ios ? "ph-grid ph-grid-ios" : "ph-grid"}>
        {photos.map((src, i) => {
          const cap = captionFor(src);
          return (
            <button
              key={src}
              type="button"
              className="ph-thumb"
              onClick={() => setOpen(i)}
              aria-label={cap ?? `Open photo ${i + 1} of ${photos.length}`}
            >
              <img src={src} alt={cap ?? ""} loading="lazy" />
              {cap && !ios ? <span className="ph-cap">{cap}</span> : null}
            </button>
          );
        })}
      </span>

      {open !== null
        ? createPortal(
            <div
              className="ph-lightbox"
              onClick={close}
              role="dialog"
              aria-modal="true"
            >
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

              <figure className="ph-lb-fig" onClick={(e) => e.stopPropagation()}>
                <img className="ph-lb-img" src={photos[open]} alt={caption ?? ""} />
                {caption ? <figcaption className="ph-lb-cap">{caption}</figcaption> : null}
              </figure>

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
            </div>,
            document.body,
          )
        : null}
    </span>
  );
}

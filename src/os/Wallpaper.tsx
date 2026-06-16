/**
 * davelOS wallpaper — an Apple-caliber abstract gradient, Tahoe-style.
 *
 * Built from layered radial "color blobs" + a base diagonal wash + a soft
 * vignette + faint film grain, so it reads like a real macOS desktop picture
 * rather than a flat fill. Theme-aware via CSS variables (.dark = deep
 * dusk/aurora; .light = bright airy blue→lavender→warm). Static (no animation)
 * for calm and perf. Layers live in index.css under `.wallpaper-*`.
 */
export function Wallpaper() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
    >
      {/* base diagonal wash */}
      <div className="wallpaper-base absolute inset-0" />
      {/* large soft aurora blobs */}
      <div className="wallpaper-blobs absolute inset-0" />
      {/* faint grain for texture/depth */}
      <div className="wallpaper-grain absolute inset-0" />
      {/* radial vignette for depth */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(135% 120% at 50% 38%, transparent 52%, rgba(0,0,0,0.42) 100%)",
        }}
      />
    </div>
  );
}

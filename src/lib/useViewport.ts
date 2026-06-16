import { useEffect, useState } from "react";

export interface Viewport {
  width: number;
  height: number;
  /** below this width we drop the windowed desktop for a mobile shell. */
  isMobile: boolean;
}

const MOBILE_BREAKPOINT = 820;

function read(): Viewport {
  if (typeof window === "undefined") {
    return { width: 1440, height: 900, isMobile: false };
  }
  const width = window.innerWidth;
  const height = window.innerHeight;
  return { width, height, isMobile: width < MOBILE_BREAKPOINT };
}

/** Reactive viewport size + a mobile flag for the windowed/mobile split. */
export function useViewport(): Viewport {
  const [vp, setVp] = useState<Viewport>(read);

  useEffect(() => {
    let raf = 0;
    const onResize = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => setVp(read()));
    };
    window.addEventListener("resize", onResize);
    window.addEventListener("orientationchange", onResize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("orientationchange", onResize);
    };
  }, []);

  return vp;
}

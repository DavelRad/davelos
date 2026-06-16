import { useEffect, useState } from "react";

/**
 * Motion policy for davelOS.
 *
 * IMPORTANT: this is a *showcase* portfolio. The signature, tactile
 * interactions (dock magnification, icon hover/press, app-launch bounce, window
 * open/close/minimize, button press, menu/Spotlight open, tooltips) must feel
 * alive EVEN when the visitor's OS has "Reduce Motion" turned on — otherwise
 * the desktop feels dead. So those interactions are gated on
 * `useDelightMotion()`, NOT on `useReducedMotion()`.
 *
 * Genuinely heavy/ambient motion (cursor-follow glow, large parallax, infinite
 * autoplay loops, elaborate boot motion) stays gated on `useReducedMotion()`
 * and is degraded, not just toggled.
 *
 * A user can still force the delightful motion off via a Settings toggle, which
 * writes `dr-reduce-delight=1` to localStorage. Default = delight ON.
 */
const STORAGE_KEY = "dr-reduce-delight";

function readPref(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(STORAGE_KEY) === "1";
}

/** Cross-instance sync so the Settings toggle updates every consumer live. */
function emitChange() {
  window.dispatchEvent(new Event("dr-delight-change"));
}

export function setReduceDelight(reduce: boolean) {
  if (typeof window === "undefined") return;
  if (reduce) window.localStorage.setItem(STORAGE_KEY, "1");
  else window.localStorage.removeItem(STORAGE_KEY);
  emitChange();
}

export function getReduceDelight(): boolean {
  return readPref();
}

/**
 * Returns `true` when the delightful, signature interactions should animate.
 * Defaults to `true` (ignores the OS reduce-motion setting on purpose); only
 * `false` when the user explicitly opts out via Settings.
 */
export function useDelightMotion(): boolean {
  const [reduce, setReduce] = useState<boolean>(readPref);

  useEffect(() => {
    const onChange = () => setReduce(readPref());
    window.addEventListener("dr-delight-change", onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener("dr-delight-change", onChange);
      window.removeEventListener("storage", onChange);
    };
  }, []);

  return !reduce;
}

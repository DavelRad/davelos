import { createContext, useContext } from "react";
import type { AppId } from "./types";

/**
 * The set of *readable, user-grade* actions the Claude Code terminal is allowed
 * to perform on the visitor's behalf — exactly the things they could do
 * themselves by clicking around davelOS (open an app, flip the theme, calm the
 * motion, pop Spotlight). Nothing here mutates the site or touches anything a
 * visitor couldn't already trigger.
 *
 * The shell provides the implementation: the windowed desktop wires `openApp`
 * to the window manager, while the iPhone shell wires it to its app switcher —
 * so "open Spotify" does the right thing in either context.
 */
export interface OsBridge {
  /** open / focus an app (or run a link app like github). */
  openApp: (id: AppId) => void;
  setTheme: (t: "dark" | "light") => void;
  toggleTheme: () => void;
  /** true = calmer, reduced motion. */
  setReduceMotion: (on: boolean) => void;
  /** open Spotlight. No-op where unavailable (see `spotlightAvailable`). */
  openSpotlight: () => void;
  /** false on mobile (the iPhone shell has no Spotlight). */
  spotlightAvailable: boolean;
}

const noop = () => {};
const NULL_BRIDGE: OsBridge = {
  openApp: noop,
  setTheme: noop,
  toggleTheme: noop,
  setReduceMotion: noop,
  openSpotlight: noop,
  spotlightAvailable: false,
};

export const OsBridgeContext = createContext<OsBridge>(NULL_BRIDGE);

/** Consume the OS bridge for the current shell (desktop or mobile). */
export function useOsBridge(): OsBridge {
  return useContext(OsBridgeContext);
}

import type { ComponentType } from "react";

/** Icon component compatible with both lucide icons and custom brand glyphs.
 * `strokeWidth`/`size` accept string|number to match lucide's prop types. */
export type AppIcon = ComponentType<{
  className?: string;
  strokeWidth?: string | number;
  size?: string | number;
}>;

/** Every openable app in davelOS. */
export type AppId =
  | "obsidian"
  | "terminal"
  | "spotify"
  | "startup"
  | "notes"
  | "editor"
  | "mail"
  | "settings"
  | "preview"
  | "github";

export interface AppMeta {
  id: AppId;
  /** Short name (dock tooltip, menu bar). */
  name: string;
  /** Longer descriptive name for Spotlight. */
  longName: string;
  icon: AppIcon;
  /** Accent tint for the dock icon background gradient. */
  tint: string;
  /** Default window geometry as viewport fractions {x,y,w,h} in 0..1. */
  defaults: { x: number; y: number; w: number; h: number };
  /** Minimum pixel size. */
  min: { w: number; h: number };
}

export interface WindowState {
  id: AppId;
  /** stacking order — higher is closer to front. */
  z: number;
  open: boolean;
  minimized: boolean;
  maximized: boolean;
  /** top-left position in px. */
  x: number;
  y: number;
  /** size in px (non-maximized). */
  w: number;
  h: number;
}

export type OSAction =
  | { type: "open"; id: AppId }
  | { type: "close"; id: AppId }
  | { type: "focus"; id: AppId }
  | { type: "minimize"; id: AppId }
  | { type: "restore"; id: AppId }
  | { type: "toggleMaximize"; id: AppId }
  | { type: "toggleMinimize"; id: AppId }
  | { type: "move"; id: AppId; x: number; y: number }
  | { type: "resize"; id: AppId; w: number; h: number; x?: number; y?: number };

export interface OSState {
  windows: Record<AppId, WindowState>;
  /** running order — apps with open === true. */
  order: AppId[];
  topZ: number;
  /** the most recently *launched* (closed→open) app + a nonce, for the dock
   * launch-bounce. Nonce changes every launch so repeats still fire. */
  lastLaunch: { id: AppId; nonce: number } | null;
}

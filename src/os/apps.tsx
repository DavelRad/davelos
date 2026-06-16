import {
  TerminalSquare,
  FileCode2,
  Mail,
  Settings,
  Rocket,
  StickyNote,
  FileText,
  BookText,
  Github,
  Images,
} from "lucide-react";
import type { AppId, AppMeta } from "./types";
import { SpotifyGlyph } from "./brandIcons";

/**
 * The davelOS app registry. Order here is the dock order. Window default
 * geometry is expressed in viewport fractions and resolved to px at open time
 * by the window manager, so the layout scales with the screen.
 *
 * `github` is a special dock entry: it has no window — clicking it opens the
 * real GitHub profile in a new tab (handled in Desktop's activate wrapper).
 */
export const APPS: Record<AppId, AppMeta> = {
  obsidian: {
    id: "obsidian",
    name: "Obsidian",
    longName: "Obsidian — Davel's Vault",
    icon: BookText,
    tint: "#6b4ea8",
    defaults: { x: 0.035, y: 0.085, w: 0.52, h: 0.84 },
    min: { w: 520, h: 400 },
  },
  terminal: {
    id: "terminal",
    name: "Claude Code",
    longName: "Claude Code — ask about Davel",
    icon: TerminalSquare,
    tint: "#2a2522",
    defaults: { x: 0.58, y: 0.075, w: 0.38, h: 0.6 },
    min: { w: 400, h: 320 },
  },
  spotify: {
    id: "spotify",
    name: "Spotify",
    longName: "Spotify",
    icon: SpotifyGlyph,
    tint: "#191414",
    defaults: { x: 0.05, y: 0.4, w: 0.32, h: 0.5 },
    min: { w: 320, h: 380 },
  },
  startup: {
    id: "startup",
    name: "Startup",
    longName: "Davel — Startup Journey",
    icon: Rocket,
    tint: "#fb651e",
    defaults: { x: 0.34, y: 0.3, w: 0.46, h: 0.66 },
    min: { w: 420, h: 380 },
  },
  photos: {
    id: "photos",
    name: "Photos",
    longName: "Photos — Davel's albums",
    icon: Images,
    tint: "#2a2a2e",
    defaults: { x: 0.18, y: 0.12, w: 0.56, h: 0.74 },
    min: { w: 480, h: 380 },
  },
  notes: {
    id: "notes",
    name: "Notes",
    longName: "Notes",
    icon: StickyNote,
    tint: "#2b2a26",
    defaults: { x: 0.66, y: 0.5, w: 0.26, h: 0.34 },
    min: { w: 260, h: 220 },
  },
  editor: {
    id: "editor",
    name: "Editor",
    longName: "Editor — about.ts",
    icon: FileCode2,
    tint: "#22272e",
    defaults: { x: 0.2, y: 0.16, w: 0.5, h: 0.62 },
    min: { w: 420, h: 320 },
  },
  mail: {
    id: "mail",
    name: "Mail",
    longName: "Mail — contact Davel",
    icon: Mail,
    tint: "#26303b",
    defaults: { x: 0.26, y: 0.18, w: 0.42, h: 0.5 },
    min: { w: 360, h: 300 },
  },
  github: {
    id: "github",
    name: "GitHub",
    longName: "GitHub — DavelRad",
    icon: Github,
    tint: "#24292f",
    // never opened as a window (outbound link); geometry unused.
    defaults: { x: 0.3, y: 0.2, w: 0.4, h: 0.5 },
    min: { w: 360, h: 300 },
  },
  settings: {
    id: "settings",
    name: "Settings",
    longName: "System Settings",
    icon: Settings,
    tint: "#2a2a2e",
    defaults: { x: 0.3, y: 0.2, w: 0.38, h: 0.5 },
    min: { w: 360, h: 300 },
  },
  // Preview opens on demand (resume.pdf) — not a permanent dock slot, but it
  // appears in the dock while open via the running windows.
  preview: {
    id: "preview",
    name: "Preview",
    longName: "Preview — resume.pdf",
    icon: FileText,
    tint: "#3a3a3c",
    defaults: { x: 0.24, y: 0.07, w: 0.46, h: 0.86 },
    min: { w: 420, h: 420 },
  },
};

/** Dock order (the apps with a permanent dock slot). */
export const DOCK_ORDER: AppId[] = [
  "obsidian",
  "terminal",
  "spotify",
  "startup",
  "photos",
  "notes",
  "editor",
  "mail",
  "github",
  "settings",
];

/** Apps that have no managed window — clicking the dock icon runs a side effect
 * (e.g. github opens the real profile in a new tab). */
export const LINK_APPS: Partial<Record<AppId, string>> = {
  github: "https://github.com/DavelRad",
};

/** Every app id with a managed window (excludes link-only apps like github). */
export const ALL_APP_IDS: AppId[] = (Object.keys(APPS) as AppId[]).filter(
  (id) => !(id in LINK_APPS),
);

export const APP_LIST: AppMeta[] = DOCK_ORDER.map((id) => APPS[id]);

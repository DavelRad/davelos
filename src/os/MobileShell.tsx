import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useLocalClock } from "../lib/useLocalClock";
import { useDelightMotion, setReduceDelight } from "../lib/useDelightMotion";
import { track } from "../lib/analytics";
import { APPS, LINK_APPS } from "./apps";
import { DockAppIcon } from "./DockIcons";
import { OsBridgeContext, type OsBridge } from "./osBridge";
import type { AppId, AppMeta } from "./types";

/**
 * Mobile shell — a real iPhone, not a tab bar.
 *
 * Phones get an actual iOS home screen: a status bar, a grid of app icons over
 * Davel's wallpaper, a frosted dock, and tap-to-open with an icon-origin zoom
 * (the app springs out of the icon you tapped). A draggable/tappable home
 * indicator returns to the home screen, shrinking the app back into place.
 *
 * Everything is driven by the same `OsBridge` the desktop uses, so Claude Code
 * can "open Spotify" / "switch to dark mode" here exactly like on the desktop —
 * `openApp` just switches the foreground app instead of spawning a window.
 */

const STATUS_H = 44; // px — status bar height
const SAFE_BOTTOM = 34; // px — home-indicator safe area (apps stop above it)
const ICON = 56; // px — home/dock icon size

const DOCK_IDS: AppId[] = ["obsidian", "terminal", "startup", "photos"];
const GRID_IDS: AppId[] = ["spotify", "github", "mail", "notes", "editor", "settings"];
const dockApps: AppMeta[] = DOCK_IDS.map((id) => APPS[id]);
const gridApps: AppMeta[] = GRID_IDS.map((id) => APPS[id]);

interface MobileShellProps {
  theme: "dark" | "light";
  onToggleTheme: () => void;
  onSetTheme: (t: "dark" | "light") => void;
  renderApp: (id: AppId) => React.ReactNode;
  onOpenGitHub: () => void;
}

export function MobileShell({
  onToggleTheme,
  onSetTheme,
  renderApp,
  onOpenGitHub,
}: MobileShellProps) {
  const reduced = !useDelightMotion();
  const [active, setActive] = useState<AppId | null>(null);
  // center of the tapped icon (viewport px) → transform-origin for the zoom.
  const [origin, setOrigin] = useState<{ x: number; y: number } | null>(null);

  const launch = useCallback(
    (id: AppId, rect?: DOMRect) => {
      // link-only apps (github) run their side effect; they don't take over.
      if (id in LINK_APPS) {
        if (id === "github") onOpenGitHub();
        return;
      }
      track("app_open", { app: id, source: "mobile" });
      setOrigin(
        rect ? { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 } : null,
      );
      setActive(id);
    },
    [onOpenGitHub],
  );

  const goHome = useCallback(() => setActive(null), []);

  // one-time "Start here" nudge → Obsidian, the way iOS surfaces a notification
  // shortly after you land on the home screen. Shows once per visit; tap opens
  // the vault, swipe up dismisses, and it auto-hides after a few seconds.
  const [showBanner, setShowBanner] = useState(false);
  const bannerDone = useRef(false);
  const activeRef = useRef(active);
  activeRef.current = active;

  useEffect(() => {
    const t = window.setTimeout(() => {
      if (!bannerDone.current && activeRef.current === null) setShowBanner(true);
    }, 1100);
    return () => window.clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!showBanner) return;
    const t = window.setTimeout(() => {
      setShowBanner(false);
      bannerDone.current = true;
    }, 6500);
    return () => window.clearTimeout(t);
  }, [showBanner]);

  const openFromBanner = useCallback(() => {
    bannerDone.current = true;
    setShowBanner(false);
    launch("obsidian");
  }, [launch]);

  const dismissBanner = useCallback(() => {
    bannerDone.current = true;
    setShowBanner(false);
  }, []);

  // bridge the Claude Code terminal uses to drive the phone.
  const bridge = useMemo<OsBridge>(
    () => ({
      openApp: (id) => launch(id),
      setTheme: onSetTheme,
      toggleTheme: onToggleTheme,
      setReduceMotion: setReduceDelight,
      openSpotlight: () => {},
      spotlightAvailable: false,
    }),
    [launch, onSetTheme, onToggleTheme],
  );

  const activeMeta = active ? APPS[active] : null;

  return (
    <OsBridgeContext.Provider value={bridge}>
      <div className="relative h-dvh w-full select-none overflow-hidden bg-black">
        {/* wallpaper backdrop (the home screen) */}
        <div aria-hidden className="absolute inset-0">
          <div className="wallpaper-base absolute inset-0" />
          <div className="wallpaper-blobs absolute inset-0" />
          <div className="wallpaper-grain absolute inset-0" />
        </div>

        {/* HOME SCREEN — icons + dock */}
        <HomeScreen onLaunch={launch} />

        {/* FOREGROUND APP — springs out of the tapped icon */}
        <AnimatePresence>
          {active && activeMeta ? (
            <motion.div
              key={active}
              className="absolute inset-0 overflow-hidden"
              style={{
                background: "#0a0a0b",
                transformOrigin: origin ? `${origin.x}px ${origin.y}px` : "50% 92%",
              }}
              initial={
                reduced
                  ? { opacity: 0 }
                  : { opacity: 0, scale: 0.32, borderRadius: 46 }
              }
              animate={
                reduced
                  ? { opacity: 1 }
                  : { opacity: 1, scale: 1, borderRadius: 0 }
              }
              exit={
                reduced
                  ? { opacity: 0 }
                  : { opacity: 0, scale: 0.32, borderRadius: 46 }
              }
              transition={
                reduced
                  ? { duration: 0.14 }
                  : { type: "spring", stiffness: 320, damping: 32, mass: 0.9 }
              }
            >
              <div
                className="absolute inset-0 overflow-hidden"
                style={{ paddingTop: STATUS_H, paddingBottom: SAFE_BOTTOM }}
              >
                {renderApp(active)}
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>

        {/* STATUS BAR — always on top */}
        <StatusBar />

        {/* "Start here" notification → Obsidian (home screen, first visit) */}
        <AnimatePresence>
          {active === null && showBanner ? (
            <StartHereBanner
              reduced={reduced}
              onOpen={openFromBanner}
              onDismiss={dismissBanner}
            />
          ) : null}
        </AnimatePresence>

        {/* HOME INDICATOR — swipe/tap to go home (only while an app is open) */}
        {active ? <HomeIndicator onHome={goHome} /> : null}
      </div>
    </OsBridgeContext.Provider>
  );
}

/* ------------------------------- home screen ----------------------------- */

function HomeScreen({
  onLaunch,
}: {
  onLaunch: (id: AppId, rect?: DOMRect) => void;
}) {
  return (
    <div
      className="absolute inset-0 flex flex-col"
      style={{ paddingTop: STATUS_H + 10, paddingBottom: SAFE_BOTTOM }}
    >
      {/* app grid */}
      <div className="scroll-region flex-1 overflow-y-auto px-6 pt-5">
        <div className="grid grid-cols-4 gap-x-3 gap-y-6">
          {gridApps.map((app) => (
            <HomeIcon key={app.id} app={app} onLaunch={onLaunch} label />
          ))}
        </div>
      </div>

      {/* page dot */}
      <div className="flex justify-center pb-3">
        <span className="size-[7px] rounded-full bg-white/85" />
      </div>

      {/* dock */}
      <div className="px-4 pb-2">
        <div className="liquid-glass mx-auto flex max-w-[360px] items-center justify-around rounded-[30px] px-3 py-2.5">
          {dockApps.map((app) => (
            <HomeIcon key={app.id} app={app} onLaunch={onLaunch} />
          ))}
        </div>
      </div>
    </div>
  );
}

function HomeIcon({
  app,
  onLaunch,
  label,
}: {
  app: AppMeta;
  onLaunch: (id: AppId, rect?: DOMRect) => void;
  label?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={app.name}
      onClick={(e) => onLaunch(app.id, e.currentTarget.getBoundingClientRect())}
      className="flex flex-col items-center gap-1.5 transition-transform duration-150 active:scale-90"
    >
      <span
        className="block"
        style={{
          width: ICON,
          height: ICON,
          filter: "drop-shadow(0 8px 14px rgba(0,0,0,0.42))",
        }}
      >
        <DockAppIcon id={app.id} />
      </span>
      {label ? (
        <span
          className="max-w-[68px] truncate text-[11px] font-medium leading-none text-white"
          style={{ textShadow: "0 1px 3px rgba(0,0,0,0.55)" }}
        >
          {app.name}
        </span>
      ) : null}
    </button>
  );
}

/* ----------------------------- start-here banner ------------------------- */

function StartHereBanner({
  reduced,
  onOpen,
  onDismiss,
}: {
  reduced: boolean;
  onOpen: () => void;
  onDismiss: () => void;
}) {
  return (
    <motion.div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      aria-label="Start here — open Obsidian"
      className="liquid-glass absolute left-3 right-3 z-[70] flex cursor-pointer items-center gap-3 rounded-[20px] px-3.5 py-3 text-left text-ink"
      style={{ top: STATUS_H + 6 }}
      initial={reduced ? { opacity: 0 } : { y: -140, opacity: 0 }}
      animate={reduced ? { opacity: 1 } : { y: 0, opacity: 1 }}
      exit={reduced ? { opacity: 0 } : { y: -140, opacity: 0 }}
      transition={
        reduced ? { duration: 0.15 } : { type: "spring", stiffness: 320, damping: 30 }
      }
      drag={reduced ? false : "y"}
      dragConstraints={{ top: -200, bottom: 0 }}
      dragElastic={{ top: 0.4, bottom: 0 }}
      dragMomentum={false}
      dragSnapToOrigin
      onDragEnd={(_, info) => {
        if (info.offset.y < -28) onDismiss();
      }}
    >
      <span
        className="block size-9 shrink-0 overflow-hidden rounded-[9px]"
        style={{ filter: "drop-shadow(0 2px 5px rgba(0,0,0,0.35))" }}
      >
        <DockAppIcon id="obsidian" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="mb-0.5 flex items-center justify-between">
          <span className="text-[0.6rem] font-semibold uppercase tracking-wide text-ink-muted">
            Obsidian
          </span>
          <span className="text-[0.6rem] text-ink-faint">now</span>
        </span>
        <span className="block text-[0.92rem] font-semibold leading-tight text-ink">
          Start here 👋
        </span>
        <span className="mt-0.5 block text-[0.8rem] leading-snug text-ink-muted">
          Tap to open my story — who I am &amp; what I'm shipping.
        </span>
      </span>
    </motion.div>
  );
}

/* -------------------------------- status bar ----------------------------- */

function StatusBar() {
  // iOS status bar shows time without AM/PM.
  const time = useLocalClock("America/Los_Angeles").replace(/\s?[AP]M$/i, "");
  return (
    <div
      className="pointer-events-none absolute inset-x-0 top-0 z-[60] flex items-center justify-between px-7 text-white"
      style={{ height: STATUS_H }}
    >
      <span
        className="text-[15px] font-semibold tabular-nums tracking-tight"
        style={{ textShadow: "0 1px 2px rgba(0,0,0,0.35)" }}
      >
        {time}
      </span>
      <span
        className="flex items-center gap-1.5"
        style={{ filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.35))" }}
      >
        <CellularGlyph />
        <WifiGlyph />
        <BatteryGlyph />
      </span>
    </div>
  );
}

function CellularGlyph() {
  return (
    <svg width="17" height="11" viewBox="0 0 17 11" fill="currentColor" aria-hidden>
      <rect x="0" y="7.5" width="3" height="3.5" rx="1" />
      <rect x="4.5" y="5" width="3" height="6" rx="1" />
      <rect x="9" y="2.5" width="3" height="8.5" rx="1" />
      <rect x="13.5" y="0" width="3" height="11" rx="1" />
    </svg>
  );
}

function WifiGlyph() {
  return (
    <svg
      width="16"
      height="11"
      viewBox="0 0 16 11"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      aria-hidden
    >
      <path d="M1.6 3.7 A 9 9 0 0 1 14.4 3.7" />
      <path d="M4.2 6.3 A 5.3 5.3 0 0 1 11.8 6.3" />
      <circle cx="8" cy="9.3" r="1.05" fill="currentColor" stroke="none" />
    </svg>
  );
}

function BatteryGlyph() {
  return (
    <span className="flex items-center gap-[2px]">
      <span
        className="relative inline-block rounded-[3px] border border-white/65"
        style={{ width: 23, height: 12 }}
      >
        <span
          className="absolute rounded-[1.5px] bg-white"
          style={{ left: 1.5, top: 1.5, bottom: 1.5, width: "72%" }}
        />
      </span>
      <span
        className="inline-block rounded-r-[1px] bg-white/65"
        style={{ width: 1.5, height: 4 }}
      />
    </span>
  );
}

/* ------------------------------ home indicator --------------------------- */

function HomeIndicator({ onHome }: { onHome: () => void }) {
  return (
    // full-width track is click-through; only the centered grab area is live, so
    // it never blocks app controls on the sides. Swipe up or tap to go home.
    <div
      className="pointer-events-none absolute inset-x-0 bottom-0 z-[60] flex items-end justify-center"
      style={{ height: SAFE_BOTTOM }}
    >
      <motion.div
        role="button"
        tabIndex={0}
        aria-label="Home"
        onClick={onHome}
        className="pointer-events-auto flex touch-none cursor-pointer items-end justify-center"
        style={{ width: 168, height: 26, paddingBottom: 9 }}
        drag="y"
        dragConstraints={{ top: -260, bottom: 0 }}
        dragElastic={0.22}
        dragMomentum={false}
        dragSnapToOrigin
        onDragEnd={(_, info) => {
          if (info.offset.y < -48 || info.velocity.y < -320) onHome();
        }}
      >
        <span
          className="h-[5px] w-[134px] rounded-full bg-white"
          style={{ mixBlendMode: "difference" }}
        />
      </motion.div>
    </div>
  );
}

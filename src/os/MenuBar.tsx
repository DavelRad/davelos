import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Wifi, Search, Github } from "lucide-react";
import { cn } from "../lib/cn";
import { useLocalClock } from "../lib/useLocalClock";
import { useDelightMotion } from "../lib/useDelightMotion";
import type { GitHubData } from "../lib/useGitHub";
import type { AppId } from "./types";
import { APPS } from "./apps";
import { AppleLogo, ControlCenterGlyph } from "./brandIcons";

interface MenuBarProps {
  theme: "dark" | "light";
  onToggleTheme: () => void;
  frontApp: AppId | null;
  github: { data: GitHubData | null; loading: boolean; fallback: boolean };
  onOpenSpotlight: () => void;
  onMenuAction: (action: MenuAction) => void;
}

export type MenuAction =
  | "about"
  | "resume"
  | "contact"
  | "github"
  | "obsidian"
  | "terminal"
  | "spotlight"
  | "theme";

interface MenuItem {
  label?: string;
  action?: MenuAction;
  shortcut?: string;
  divider?: boolean;
  disabled?: boolean;
}
interface MenuDef {
  key: string;
  /** bold = the active app's name slot. */
  label: string;
  bold?: boolean;
  items: MenuItem[];
}

/** The Apple-logo menu (system menu). */
const APPLE_MENU: MenuItem[] = [
  { label: "About This Mac", action: "about" },
  { divider: true },
  { label: "Open Résumé…", action: "resume" },
  { label: "Contact…", action: "contact" },
  { divider: true },
  { label: "Toggle Appearance", action: "theme", shortcut: "⇧T" },
];

function buildMenus(activeName: string): MenuDef[] {
  return [
    {
      key: "app",
      label: activeName,
      bold: true,
      items: [
        { label: `About ${activeName}`, action: "about" },
        { divider: true },
        { label: "Preferences…", action: "theme", shortcut: "⇧T" },
      ],
    },
    {
      key: "file",
      label: "File",
      items: [
        { label: "Open Vault (Obsidian)", action: "obsidian" },
        { label: "Open Claude Code", action: "terminal" },
        { divider: true },
        { label: "Open GitHub ↗", action: "github" },
        { label: "New Message…", action: "contact" },
      ],
    },
    {
      key: "edit",
      label: "Edit",
      items: [
        { label: "Undo", shortcut: "⌘Z", disabled: true },
        { label: "Redo", shortcut: "⇧⌘Z", disabled: true },
        { divider: true },
        { label: "Cut", shortcut: "⌘X", disabled: true },
        { label: "Copy", shortcut: "⌘C", disabled: true },
        { label: "Paste", shortcut: "⌘V", disabled: true },
      ],
    },
    {
      key: "view",
      label: "View",
      items: [
        { label: "Open Vault (Obsidian)", action: "obsidian" },
        { label: "Open Claude Code", action: "terminal" },
        { label: "Spotlight…", action: "spotlight", shortcut: "⌘K" },
        { divider: true },
        { label: "Toggle Appearance", action: "theme", shortcut: "⇧T" },
      ],
    },
    {
      key: "window",
      label: "Window",
      items: [
        { label: "Minimize", shortcut: "⌘M", disabled: true },
        { label: "Zoom", disabled: true },
        { divider: true },
        { label: "Bring All to Front", disabled: true },
      ],
    },
    {
      key: "help",
      label: "Help",
      items: [
        { label: "Open Résumé…", action: "resume" },
        { label: "Contact Davel…", action: "contact" },
      ],
    },
  ];
}

/** macOS clock: "Sun Jun 15" — weekday + month + day, no comma (Tahoe style). */
function clockDate(): string {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: "America/Los_Angeles",
  })
    .format(new Date())
    .replace(",", "");
}

export function MenuBar({
  theme,
  onToggleTheme,
  frontApp,
  github,
  onOpenSpotlight,
  onMenuAction,
}: MenuBarProps) {
  const time = useLocalClock("America/Los_Angeles");
  const delight = useDelightMotion();
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [popover, setPopover] = useState<"cc" | "clock" | null>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const [date, setDate] = useState(clockDate);

  useEffect(() => {
    const id = window.setInterval(() => setDate(clockDate()), 30_000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (!openMenu && !popover) return;
    const onDown = (e: PointerEvent) => {
      if (!barRef.current?.contains(e.target as Node)) {
        setOpenMenu(null);
        setPopover(null);
      }
    };
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpenMenu(null);
        setPopover(null);
      }
    };
    window.addEventListener("pointerdown", onDown);
    window.addEventListener("keydown", onEsc);
    return () => {
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("keydown", onEsc);
    };
  }, [openMenu, popover]);

  const activeName = frontApp ? APPS[frontApp].name : "Finder";
  const menus = buildMenus(activeName);

  function handleItem(item: MenuItem) {
    setOpenMenu(null);
    if (item.disabled || !item.action) return;
    if (item.action === "theme") onToggleTheme();
    else if (item.action === "spotlight") onOpenSpotlight();
    else onMenuAction(item.action);
  }

  function renderDropdown(items: MenuItem[]) {
    return (
      <motion.div
        initial={delight ? { opacity: 0, y: -4, scale: 0.98 } : { opacity: 1 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={delight ? { opacity: 0, y: -4, scale: 0.98 } : { opacity: 0 }}
        transition={{ duration: 0.12, ease: [0.32, 0.72, 0, 1] }}
        style={{ transformOrigin: "top left" }}
        className="liquid-glass-strong absolute left-0 top-[26px] min-w-56 overflow-hidden rounded-[10px] p-1 text-ink shadow-[0_24px_60px_-14px_rgba(0,0,0,0.55)]"
        role="menu"
      >
        {items.map((item, i) =>
          item.divider ? (
            <div key={`d${i}`} className="my-1 h-px bg-line" />
          ) : (
            <button
              key={item.label}
              type="button"
              role="menuitem"
              disabled={item.disabled}
              onClick={() => handleItem(item)}
              className={cn(
                "flex w-full items-center justify-between gap-8 rounded-[6px] px-2.5 py-[5px] text-left text-[0.8rem]",
                item.disabled
                  ? "cursor-default text-ink-faint"
                  : "text-ink hover:bg-os-accent hover:text-white",
              )}
            >
              <span>{item.label}</span>
              {item.shortcut ? (
                <span className="text-[0.72rem] opacity-60">{item.shortcut}</span>
              ) : null}
            </button>
          ),
        )}
      </motion.div>
    );
  }

  return (
    <div
      ref={barRef}
      className="fixed inset-x-0 top-0 z-[1000] flex h-[26px] items-center gap-0.5 px-2 text-[0.8rem] text-white/90"
      role="menubar"
      aria-label="menu bar"
      style={{
        // Tahoe: transparent menu bar — wallpaper shows through, faint blur.
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
        background:
          "linear-gradient(to bottom, rgba(0,0,0,0.18), rgba(0,0,0,0.04))",
      }}
    >
      {/* Apple logo menu */}
      <div className="relative">
        <button
          type="button"
          aria-label="Apple menu"
          onClick={() => setOpenMenu((m) => (m === "apple" ? null : "apple"))}
          onMouseEnter={() => openMenu && setOpenMenu("apple")}
          className={cn(
            "grid h-[22px] place-items-center rounded-[5px] px-2",
            openMenu === "apple" && "bg-white/20",
          )}
        >
          <AppleLogo className="size-[15px] text-white drop-shadow-sm" />
        </button>
        <AnimatePresence>
          {openMenu === "apple" ? renderDropdown(APPLE_MENU) : null}
        </AnimatePresence>
      </div>

      {/* app name (bold) + menus */}
      {menus.map((menu) => (
        <div key={menu.key} className="relative">
          <button
            type="button"
            role="menuitem"
            aria-haspopup="true"
            aria-expanded={openMenu === menu.key}
            onClick={() => setOpenMenu((m) => (m === menu.key ? null : menu.key))}
            onMouseEnter={() => openMenu && setOpenMenu(menu.key)}
            className={cn(
              "h-[22px] rounded-[5px] px-2 transition-colors",
              menu.bold ? "font-semibold" : "font-normal",
              openMenu === menu.key
                ? "bg-white/20 text-white"
                : "text-white/90 hover:bg-white/10",
            )}
          >
            {menu.label}
          </button>
          <AnimatePresence>
            {openMenu === menu.key ? renderDropdown(menu.items) : null}
          </AnimatePresence>
        </div>
      ))}

      {/* right status cluster — thin SF-Symbol-style glyphs */}
      <div className="ml-auto flex items-center gap-3 pr-1 text-white/90">
        {/* live GitHub repo count (subtle, neutral) */}
        <button
          type="button"
          onClick={() => onMenuAction("github")}
          title={
            github.fallback
              ? "GitHub: offline (cached)"
              : `GitHub: ${github.data?.publicRepos ?? 0} public repos`
          }
          className="hidden items-center gap-1 text-[0.74rem] tabular-nums opacity-90 lg:flex"
        >
          <GitHubMark />
          {github.loading ? "··" : github.fallback ? "—" : github.data?.publicRepos ?? 0}
        </button>

        {/* battery + % */}
        <span className="hidden items-center gap-1 sm:flex" title="Battery 100%">
          <BatteryGlyph />
          <span className="text-[0.74rem] tabular-nums">100%</span>
        </span>

        {/* Wi-Fi */}
        <Wifi className="hidden size-[16px] sm:block" strokeWidth={2} aria-hidden />

        {/* Spotlight */}
        <button
          type="button"
          onClick={onOpenSpotlight}
          title="Spotlight (⌘K)"
          aria-label="Open Spotlight"
          className="grid place-items-center"
        >
          <Search className="size-[15px]" strokeWidth={2} />
        </button>

        {/* Control Center */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setPopover((p) => (p === "cc" ? null : "cc"))}
            title="Control Center"
            aria-label="Control Center"
            aria-expanded={popover === "cc"}
            className={cn(
              "grid size-6 place-items-center rounded-[6px] transition-colors",
              popover === "cc" && "bg-white/20",
            )}
          >
            <ControlCenterGlyph className="size-[17px]" />
          </button>
          <AnimatePresence>
            {popover === "cc" ? (
              <ControlCenter
                theme={theme}
                delight={delight}
                onToggleTheme={onToggleTheme}
              />
            ) : null}
          </AnimatePresence>
        </div>

        {/* date + time — opens a small calendar popover */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setPopover((p) => (p === "clock" ? null : "clock"))}
            aria-expanded={popover === "clock"}
            className={cn(
              "rounded-[6px] px-1.5 py-0.5 text-[0.78rem] tabular-nums transition-colors hover:bg-white/10",
              popover === "clock" && "bg-white/20",
            )}
          >
            <span className="hidden md:inline">{date}&nbsp;&nbsp;</span>
            {time}
          </button>
          <AnimatePresence>
            {popover === "clock" ? <CalendarPopover delight={delight} /> : null}
          </AnimatePresence>
        </div>

        <span className="sr-only">{theme} appearance</span>
      </div>
    </div>
  );
}

/** Liquid-Glass Control Center popover: appearance toggle + decorative
 * brightness/volume sliders (visual). */
function ControlCenter({
  theme,
  delight,
  onToggleTheme,
}: {
  theme: "dark" | "light";
  delight: boolean;
  onToggleTheme: () => void;
}) {
  const [brightness, setBrightness] = useState(80);
  const [volume, setVolume] = useState(55);
  return (
    <motion.div
      initial={delight ? { opacity: 0, y: -6, scale: 0.97 } : { opacity: 1 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={delight ? { opacity: 0, y: -6, scale: 0.97 } : { opacity: 0 }}
      transition={{ duration: 0.14, ease: [0.32, 0.72, 0, 1] }}
      style={{ transformOrigin: "top right" }}
      className="liquid-glass-strong absolute right-0 top-8 w-64 rounded-2xl p-3 text-ink shadow-[0_24px_60px_-14px_rgba(0,0,0,0.55)]"
      role="dialog"
      aria-label="Control Center"
    >
      <button
        type="button"
        onClick={onToggleTheme}
        className="flex w-full items-center gap-3 rounded-xl border border-line bg-white/5 p-2.5 text-left transition-colors hover:bg-white/10 active:scale-[0.98]"
      >
        <span className="grid size-9 place-items-center rounded-full bg-os-accent text-white">
          {theme === "dark" ? "🌙" : "☀️"}
        </span>
        <span>
          <span className="block text-sm font-medium">Appearance</span>
          <span className="block text-xs text-ink-muted">
            {theme === "dark" ? "Dark" : "Light"} — tap to switch
          </span>
        </span>
      </button>

      <CcSlider label="Display" value={brightness} onChange={setBrightness} />
      <CcSlider label="Sound" value={volume} onChange={setVolume} />
    </motion.div>
  );
}

function CcSlider({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="mt-2 block rounded-xl border border-line bg-white/5 p-2.5">
      <span className="mb-1.5 block text-[0.7rem] font-medium text-ink-muted">
        {label}
      </span>
      <input
        type="range"
        min={0}
        max={100}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-white/20 accent-os-accent"
        aria-label={label}
      />
    </label>
  );
}

/** Small calendar popover anchored to the clock. */
function CalendarPopover({ delight }: { delight: boolean }) {
  const now = new Date();
  const monthName = new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
  }).format(now);
  const today = now.getDate();
  const first = new Date(now.getFullYear(), now.getMonth(), 1).getDay();
  const daysInMonth = new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    0,
  ).getDate();
  const cells: (number | null)[] = [
    ...Array(first).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  return (
    <motion.div
      initial={delight ? { opacity: 0, y: -6, scale: 0.97 } : { opacity: 1 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={delight ? { opacity: 0, y: -6, scale: 0.97 } : { opacity: 0 }}
      transition={{ duration: 0.14, ease: [0.32, 0.72, 0, 1] }}
      style={{ transformOrigin: "top right" }}
      className="liquid-glass-strong absolute right-0 top-8 w-60 rounded-2xl p-3 text-ink shadow-[0_24px_60px_-14px_rgba(0,0,0,0.55)]"
      role="dialog"
      aria-label="Calendar"
    >
      <p className="mb-2 text-center text-sm font-semibold">{monthName}</p>
      <div className="grid grid-cols-7 gap-y-1 text-center text-[0.65rem] text-ink-faint">
        {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
          <span key={i}>{d}</span>
        ))}
      </div>
      <div className="mt-1 grid grid-cols-7 gap-y-1 text-center text-xs">
        {cells.map((c, i) => (
          <span
            key={i}
            className={cn(
              "mx-auto grid size-6 place-items-center rounded-full",
              c === today
                ? "bg-os-accent font-semibold text-white"
                : "text-ink",
            )}
          >
            {c ?? ""}
          </span>
        ))}
      </div>
    </motion.div>
  );
}

function GitHubMark() {
  return <Github className="size-[14px]" strokeWidth={2} aria-hidden />;
}

/** A thin macOS-style battery glyph (full charge). */
function BatteryGlyph() {
  return (
    <svg width="26" height="13" viewBox="0 0 26 13" fill="none" aria-hidden>
      <rect
        x="1"
        y="1.5"
        width="21"
        height="10"
        rx="3"
        stroke="currentColor"
        strokeOpacity="0.6"
        strokeWidth="1.2"
      />
      <rect x="2.6" y="3" width="17.5" height="7" rx="1.6" fill="currentColor" />
      <path
        d="M23.5 4.5c1 .4 1 3.6 0 4"
        stroke="currentColor"
        strokeOpacity="0.6"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

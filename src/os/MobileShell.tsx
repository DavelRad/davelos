import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Sun, Moon } from "lucide-react";
import { cn } from "../lib/cn";
import { useLocalClock } from "../lib/useLocalClock";
import { useDelightMotion } from "../lib/useDelightMotion";
import { APP_LIST, LINK_APPS } from "./apps";
import type { AppId } from "./types";

interface MobileShellProps {
  theme: "dark" | "light";
  onToggleTheme: () => void;
  renderApp: (id: AppId) => React.ReactNode;
  onOpenGitHub: () => void;
}

/**
 * Mobile fallback: the windowed desktop doesn't work on phones, so each app is
 * a full-screen view and the dock becomes a bottom app-switcher tab bar. The
 * Obsidian vault and Claude Code terminal are fully usable here. Link-only
 * apps (GitHub) run their side effect instead of switching the view.
 */
export function MobileShell({
  theme,
  onToggleTheme,
  renderApp,
  onOpenGitHub,
}: MobileShellProps) {
  const reduced = !useDelightMotion();
  const [active, setActive] = useState<AppId>("obsidian");
  const time = useLocalClock("America/Los_Angeles");
  const activeMeta = APP_LIST.find((a) => a.id === active);

  function tapApp(id: AppId) {
    if (id in LINK_APPS) {
      if (id === "github") onOpenGitHub();
      return;
    }
    setActive(id);
  }

  return (
    <div className="flex h-dvh flex-col bg-canvas">
      {/* simplified status/menu bar */}
      <div className="flex h-9 shrink-0 items-center gap-2 border-b border-line bg-surface/70 px-3 text-xs backdrop-blur-xl">
        <span className="grid size-[18px] place-items-center rounded-[5px] bg-ink/90 text-[0.55rem] font-bold text-canvas">
          DR
        </span>
        <span className="font-medium text-ink">{activeMeta?.name}</span>
        <span className="ml-auto flex items-center gap-1.5 text-ink-muted">
          <span className="relative flex size-1.5">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-ink-muted opacity-50" />
            <span className="relative inline-flex size-1.5 rounded-full bg-ink-muted" />
          </span>
        </span>
        <button
          type="button"
          onClick={onToggleTheme}
          className="text-ink-muted"
          aria-label="Toggle appearance"
        >
          {theme === "dark" ? <Moon className="size-4" /> : <Sun className="size-4" />}
        </button>
        <span className="tabular-nums text-ink">{time}</span>
      </div>

      {/* full-screen app view */}
      <div className="relative min-h-0 flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={active}
            initial={reduced ? { opacity: 1 } : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduced ? { opacity: 0 } : { opacity: 0, y: -10 }}
            transition={{ duration: reduced ? 0 : 0.22 }}
            className="absolute inset-0"
          >
            {renderApp(active)}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* bottom tab / app-switcher bar (scrolls if apps overflow) */}
      <nav
        className="scroll-region flex shrink-0 items-stretch gap-0.5 overflow-x-auto border-t border-line bg-surface/85 px-1 pb-[env(safe-area-inset-bottom)] pt-1 backdrop-blur-xl"
        aria-label="App switcher"
      >
        {APP_LIST.map((app) => {
          const Icon = app.icon;
          const on = active === app.id;
          return (
            <button
              key={app.id}
              type="button"
              onClick={() => tapApp(app.id)}
              aria-label={app.name}
              aria-current={on}
              className={cn(
                "flex min-w-[58px] flex-1 flex-col items-center gap-0.5 rounded-lg py-1.5 text-[0.55rem] transition-colors",
                on ? "text-ink" : "text-ink-faint",
              )}
            >
              <Icon className="size-[18px]" strokeWidth={on ? 2.2 : 1.8} />
              <span className="truncate">{app.name}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}

import { Sun, Moon, Monitor } from "lucide-react";
import { cn } from "../lib/cn";
import { profile } from "../data/profile";
import {
  setReduceDelight,
  useDelightMotion,
} from "../lib/useDelightMotion";

interface SettingsProps {
  theme: "dark" | "light";
  onSetTheme: (t: "dark" | "light") => void;
}

/** A small "System Settings" panel — appearance + an about card. */
export function Settings({ theme, onSetTheme }: SettingsProps) {
  const delight = useDelightMotion();
  return (
    <div className="flex h-full flex-col overflow-y-auto bg-surface p-5">
      {/* about card */}
      <div className="flex items-center gap-4 rounded-xl border border-line bg-surface-2/50 p-4">
        <div className="grid size-14 place-items-center rounded-2xl bg-ink/90 text-xl font-bold text-canvas">
          DR
        </div>
        <div>
          <p className="text-base font-medium text-ink">{profile.name}</p>
          <p className="text-xs text-ink-muted">{profile.role}</p>
          <p className="font-mono text-[0.65rem] text-ink-faint">davelOS 1.0</p>
        </div>
      </div>

      {/* appearance */}
      <p className="mb-2 mt-5 text-[0.65rem] uppercase tracking-wide text-ink-faint">
        Appearance
      </p>
      <div className="grid grid-cols-3 gap-2">
        <AppearanceTile
          label="Light"
          icon={Sun}
          active={theme === "light"}
          onClick={() => onSetTheme("light")}
        />
        <AppearanceTile
          label="Dark"
          icon={Moon}
          active={theme === "dark"}
          onClick={() => onSetTheme("dark")}
        />
        <AppearanceTile label="Auto" icon={Monitor} active={false} disabled />
      </div>

      {/* motion */}
      <p className="mb-2 mt-5 text-[0.65rem] uppercase tracking-wide text-ink-faint">
        Motion
      </p>
      <button
        type="button"
        onClick={() => setReduceDelight(delight)}
        role="switch"
        aria-checked={!delight}
        className="flex w-full items-center justify-between rounded-xl border border-line bg-surface-2/50 px-4 py-3 text-left transition-colors hover:border-line-strong active:scale-[0.99]"
      >
        <span>
          <span className="block text-sm text-ink">Reduce motion</span>
          <span className="block text-xs text-ink-muted">
            Dim the dock magnification, bounce &amp; window animations
          </span>
        </span>
        <span
          className={cn(
            "relative h-6 w-10 shrink-0 rounded-full transition-colors",
            !delight ? "bg-os-accent" : "bg-line-strong",
          )}
        >
          <span
            className={cn(
              "absolute top-0.5 size-5 rounded-full bg-white shadow transition-all",
              !delight ? "left-[18px]" : "left-0.5",
            )}
          />
        </span>
      </button>

      <p className="mt-6 text-xs leading-relaxed text-ink-muted">
        davelOS is a portfolio environment — a windowed desktop built with React,
        TypeScript, Tailwind, and framer-motion. Press{" "}
        <kbd className="rounded border border-line bg-surface-2 px-1.5 py-0.5 font-mono text-[0.65rem]">
          ⌘K
        </kbd>{" "}
        for Spotlight.
      </p>
    </div>
  );
}

function AppearanceTile({
  label,
  icon: Icon,
  active,
  disabled,
  onClick,
}: {
  label: string;
  icon: typeof Sun;
  active: boolean;
  disabled?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex flex-col items-center gap-2 rounded-xl border p-3 text-xs transition-colors",
        active
          ? "border-os-accent/60 bg-os-accent/15 text-ink"
          : "border-line text-ink-muted hover:border-line-strong hover:text-ink",
        disabled && "cursor-not-allowed opacity-40 hover:border-line",
      )}
    >
      <Icon className="size-5" />
      {label}
    </button>
  );
}

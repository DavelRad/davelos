import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Search,
  FileText,
  ExternalLink,
  CornerDownLeft,
  MessageSquare,
} from "lucide-react";
import { cn } from "../lib/cn";
import { track } from "../lib/analytics";
import { useDelightMotion } from "../lib/useDelightMotion";
import { APP_LIST, LINK_APPS } from "./apps";
import type { AppIcon, AppId } from "./types";
import { vaultNotes } from "../data/vault";
import { contactLinks } from "../data/profile";

interface SpotlightProps {
  open: boolean;
  onClose: () => void;
  /** open/activate an app (link-only apps run their side effect). */
  onOpenApp: (id: AppId) => void;
  /** open a vault note in Obsidian by title. */
  onOpenNote: (title: string) => void;
  onAsk: (question: string) => void;
  onToggleTheme: () => void;
  onOpenResume: () => void;
  onOpenGitHub: () => void;
}

type Item =
  | { kind: "app"; id: AppId; title: string; subtitle: string; icon: AppIcon }
  | { kind: "note"; note: string; title: string; subtitle: string; icon: AppIcon }
  | { kind: "link"; href: string; title: string; subtitle: string; icon: AppIcon }
  | { kind: "ask"; query: string; title: string; subtitle: string; icon: AppIcon }
  | { kind: "resume"; title: string; subtitle: string; icon: AppIcon }
  | { kind: "github"; title: string; subtitle: string; icon: AppIcon }
  | { kind: "action"; action: "theme"; title: string; subtitle: string; icon: AppIcon };

export function Spotlight({
  open,
  onClose,
  onOpenApp,
  onOpenNote,
  onAsk,
  onToggleTheme,
  onOpenResume,
  onOpenGitHub,
}: SpotlightProps) {
  const delight = useDelightMotion();
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setQuery("");
      setActive(0);
      // focus after mount/animation frame
      const id = requestAnimationFrame(() => inputRef.current?.focus());
      return () => cancelAnimationFrame(id);
    }
  }, [open]);

  const items = useMemo<Item[]>(() => {
    const base: Item[] = [
      ...APP_LIST.filter((a) => !(a.id in LINK_APPS)).map(
        (a): Item => ({
          kind: "app",
          id: a.id,
          title: a.name,
          subtitle: "Application",
          icon: a.icon,
        }),
      ),
      ...vaultNotes.map(
        (n): Item => ({
          kind: "note",
          note: n.title,
          title: n.title,
          subtitle: n.folder ? `${n.folder} · Obsidian note` : "Obsidian note",
          icon: FileText,
        }),
      ),
      {
        kind: "github",
        title: "GitHub",
        subtitle: "Open github.com/DavelRad ↗",
        icon: ExternalLink,
      },
      ...contactLinks.map(
        (l): Item => ({
          kind: "link",
          href: l.href,
          title: l.label,
          subtitle: l.value,
          icon: ExternalLink,
        }),
      ),
      {
        kind: "resume",
        title: "Résumé",
        subtitle: "Open resume.pdf in Preview",
        icon: FileText,
      },
      {
        kind: "action",
        action: "theme",
        title: "Toggle appearance",
        subtitle: "Switch light / dark",
        icon: Search,
      },
    ];

    const q = query.trim().toLowerCase();
    if (!q) return base.slice(0, 8);

    const filtered = base.filter(
      (it) =>
        it.title.toLowerCase().includes(q) ||
        it.subtitle.toLowerCase().includes(q),
    );

    // Always offer "Ask Davel" with the typed query
    const ask: Item = {
      kind: "ask",
      query,
      title: `Ask Davel: "${query}"`,
      subtitle: "Open Claude Code with this question",
      icon: MessageSquare,
    };

    return [ask, ...filtered].slice(0, 9);
  }, [query]);

  useEffect(() => {
    setActive(0);
  }, [query]);

  function run(item: Item) {
    onClose();
    switch (item.kind) {
      case "app":
        onOpenApp(item.id);
        break;
      case "note":
        onOpenNote(item.note);
        break;
      case "link":
        track("contact_click", { label: item.title, source: "spotlight" });
        window.open(item.href, "_blank", "noopener,noreferrer");
        break;
      case "github":
        onOpenGitHub();
        break;
      case "ask":
        onAsk(item.query);
        break;
      case "resume":
        onOpenResume();
        break;
      case "action":
        onToggleTheme();
        break;
    }
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => (a + 1) % items.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => (a - 1 + items.length) % items.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      const item = items[active];
      if (item) run(item);
    } else if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    }
  }

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[2000] flex items-start justify-center px-4 pt-[18vh]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: delight ? 0.16 : 0.08 }}
        >
          <button
            type="button"
            aria-label="Close Spotlight"
            onClick={onClose}
            className="absolute inset-0 cursor-default bg-black/40 backdrop-blur-sm"
          />
          <motion.div
            role="dialog"
            aria-label="Spotlight search"
            initial={delight ? { opacity: 0, scale: 0.97, y: -8 } : { opacity: 1 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={delight ? { opacity: 0, scale: 0.98, y: -8 } : { opacity: 0 }}
            transition={{ type: "spring", stiffness: 420, damping: 30 }}
            className="liquid-glass-strong relative z-10 w-full max-w-xl overflow-hidden rounded-2xl shadow-[0_40px_120px_-30px_rgba(0,0,0,0.85)]"
          >
            <div className="flex items-center gap-3 border-b border-line px-4">
              <Search className="size-5 text-ink-faint" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder="Search apps, files, links — or ask about Davel…"
                aria-label="Spotlight search"
                className="w-full bg-transparent py-4 text-base text-ink outline-none placeholder:text-ink-faint"
              />
            </div>

            <ul className="max-h-[46vh] overflow-y-auto p-2" role="listbox">
              {items.length === 0 ? (
                <li className="px-3 py-6 text-center text-sm text-ink-faint">
                  No results
                </li>
              ) : (
                items.map((item, i) => {
                  const Icon = item.icon;
                  return (
                    <li key={`${item.kind}-${item.title}-${i}`} role="option" aria-selected={i === active}>
                      <button
                        type="button"
                        onMouseEnter={() => setActive(i)}
                        onClick={() => run(item)}
                        className={cn(
                          "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors",
                          i === active
                            ? "bg-os-accent text-white"
                            : "hover:bg-surface-2",
                        )}
                      >
                        <span
                          className={cn(
                            "grid size-8 shrink-0 place-items-center rounded-lg border border-line",
                            i === active && "border-white/20 bg-white/10",
                          )}
                        >
                          <Icon
                            className={cn(
                              "size-4",
                              i === active ? "text-white" : "text-ink-muted",
                            )}
                          />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span
                            className={cn(
                              "block truncate text-sm",
                              i === active ? "text-white" : "text-ink",
                            )}
                          >
                            {item.title}
                          </span>
                          <span
                            className={cn(
                              "block truncate text-xs",
                              i === active ? "text-white/70" : "text-ink-faint",
                            )}
                          >
                            {item.subtitle}
                          </span>
                        </span>
                        {i === active ? (
                          <CornerDownLeft className="size-4 shrink-0 text-white/80" />
                        ) : null}
                      </button>
                    </li>
                  );
                })
              )}
            </ul>

            <div className="flex items-center justify-between border-t border-line px-4 py-2 font-mono text-[0.65rem] text-ink-faint">
              <span>↑↓ navigate · ↵ open · esc close</span>
              <span>davelOS Spotlight</span>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

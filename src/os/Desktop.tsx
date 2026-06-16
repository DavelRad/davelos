import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { useGitHub } from "../lib/useGitHub";
import type { Theme } from "../lib/useTheme";
import { useViewport } from "../lib/useViewport";
import { APPS, LINK_APPS } from "./apps";
import type { AppId } from "./types";
import { useWindowManager } from "./useWindowManager";
import { Wallpaper } from "./Wallpaper";
import { DesktopIcons } from "./DesktopIcons";
import { MenuBar, type MenuAction } from "./MenuBar";
import { Dock } from "./Dock";
import { Spotlight } from "./Spotlight";
import { Window } from "./Window";
import { MobileShell } from "./MobileShell";

import { Obsidian } from "../apps/Obsidian";
import { ClaudeTerminal } from "../apps/ClaudeTerminal";
import { Spotify } from "../apps/Spotify";
import { Startup } from "../apps/Startup";
import { Notes } from "../apps/Notes";
import { AboutEditor } from "../apps/AboutEditor";
import { Mail } from "../apps/Mail";
import { Settings } from "../apps/Settings";
import { Preview } from "../apps/Preview";

interface DesktopProps {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (t: Theme) => void;
  booted: boolean;
}

export function Desktop({ theme, toggleTheme, setTheme, booted }: DesktopProps) {
  const vp = useViewport();
  const wm = useWindowManager();
  const github = useGitHub();

  const [spotlightOpen, setSpotlightOpen] = useState(false);
  // cross-app messages
  const [requestedNote, setRequestedNote] = useState<string | null>(null);
  const [pendingQuestion, setPendingQuestion] = useState<string | null>(null);

  const didBoot = useRef(false);

  // Open GitHub = an honest outbound link to the real profile (no window).
  const openGitHub = useCallback(() => {
    window.open(LINK_APPS.github, "_blank", "noopener,noreferrer");
  }, []);

  /** Dock/Spotlight activation: link-only apps run a side effect; the rest
   * open/focus a window. */
  const activate = useCallback(
    (id: AppId) => {
      if (id in LINK_APPS) {
        if (id === "github") openGitHub();
        return;
      }
      wm.activate(id);
    },
    [openGitHub, wm],
  );

  // default boot layout: a lived-in desktop. Background apps open first (lower
  // z, offset, partially visible), then Obsidian (left) + Claude Code (right)
  // open in front as the focused split.
  useEffect(() => {
    if (!booted || didBoot.current || vp.isMobile) return;
    didBoot.current = true;
    // behind:
    wm.open("spotify");
    wm.open("startup");
    wm.open("notes");
    // front split:
    wm.open("terminal");
    wm.open("obsidian");
    wm.focus("obsidian");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [booted, vp.isMobile]);

  const openNoteInObsidian = useCallback(
    (title: string) => {
      wm.open("obsidian");
      setRequestedNote(title);
    },
    [wm],
  );

  const askInTerminal = useCallback(
    (question: string) => {
      wm.open("terminal");
      setPendingQuestion(question);
    },
    [wm],
  );

  const openResume = useCallback(() => wm.open("preview"), [wm]);

  const onMenuAction = useCallback(
    (action: MenuAction) => {
      switch (action) {
        case "about":
          openNoteInObsidian("About");
          break;
        case "resume":
          openResume();
          break;
        case "contact":
          wm.open("mail");
          break;
        case "github":
          openGitHub();
          break;
        case "terminal":
          wm.open("terminal");
          break;
        case "obsidian":
          wm.open("obsidian");
          break;
        case "spotlight":
          setSpotlightOpen(true);
          break;
        case "theme":
          toggleTheme();
          break;
      }
    },
    [openNoteInObsidian, openResume, openGitHub, wm, toggleTheme],
  );

  // global hotkeys: ⌘K / ⌘Space open Spotlight; ⇧T toggles appearance.
  useEffect(() => {
    const isTyping = (t: EventTarget | null) =>
      t instanceof HTMLElement &&
      (t.tagName === "INPUT" ||
        t.tagName === "TEXTAREA" ||
        t.isContentEditable);

    const onKey = (e: KeyboardEvent) => {
      if (
        (e.metaKey || e.ctrlKey) &&
        (e.key.toLowerCase() === "k" || e.code === "Space")
      ) {
        e.preventDefault();
        setSpotlightOpen((o) => !o);
        return;
      }
      if (isTyping(e.target) || e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.shiftKey && e.key.toLowerCase() === "t") {
        e.preventDefault();
        toggleTheme();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [toggleTheme]);

  const renderApp = useCallback(
    (id: AppId) => {
      switch (id) {
        case "obsidian":
          return (
            <Obsidian
              requestedNote={requestedNote}
              onRequestConsumed={() => setRequestedNote(null)}
            />
          );
        case "terminal":
          return (
            <ClaudeTerminal
              pendingQuestion={pendingQuestion}
              onQuestionConsumed={() => setPendingQuestion(null)}
            />
          );
        case "spotify":
          return <Spotify />;
        case "startup":
          return <Startup />;
        case "notes":
          return <Notes />;
        case "editor":
          return <AboutEditor />;
        case "mail":
          return <Mail />;
        case "settings":
          return <Settings theme={theme} onSetTheme={setTheme} />;
        case "preview":
          return <Preview />;
        case "github":
          return null; // link-only; never rendered as a window
      }
    },
    [requestedNote, pendingQuestion, theme, setTheme],
  );

  // ---- mobile fallback ----
  if (vp.isMobile) {
    return (
      <MobileShell
        theme={theme}
        onToggleTheme={toggleTheme}
        renderApp={renderApp}
        onOpenGitHub={openGitHub}
      />
    );
  }

  // ---- windowed desktop ----
  return (
    <div className="absolute inset-0 overflow-hidden">
      <Wallpaper />
      <DesktopIcons onOpenResume={openResume} onOpenEditor={() => wm.open("editor")} />

      <MenuBar
        theme={theme}
        onToggleTheme={toggleTheme}
        frontApp={wm.frontApp}
        github={github}
        onOpenSpotlight={() => setSpotlightOpen(true)}
        onMenuAction={onMenuAction}
      />

      {/* windows */}
      <AnimatePresence>
        {wm.state.order.map((id) => {
          const win = wm.state.windows[id];
          if (!win.open) return null;
          return (
            <Window
              key={id}
              meta={{ name: APPS[id].longName }}
              win={win}
              minSize={APPS[id].min}
              focused={wm.frontApp === id}
              onFocus={() => wm.focus(id)}
              onClose={() => wm.close(id)}
              onMinimize={() => wm.minimize(id)}
              onToggleMaximize={() => wm.toggleMaximize(id)}
              onMove={(x, y) => wm.move(id, x, y)}
              onResize={(w, h) => wm.resize(id, w, h)}
            >
              {renderApp(id)}
            </Window>
          );
        })}
      </AnimatePresence>

      <Dock
        isRunning={wm.isRunning}
        frontApp={wm.frontApp}
        onActivate={activate}
        lastLaunch={wm.lastLaunch}
      />

      <Spotlight
        open={spotlightOpen}
        onClose={() => setSpotlightOpen(false)}
        onOpenApp={activate}
        onOpenNote={openNoteInObsidian}
        onAsk={askInTerminal}
        onToggleTheme={toggleTheme}
        onOpenResume={openResume}
        onOpenGitHub={openGitHub}
      />
    </div>
  );
}

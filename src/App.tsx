import { useState } from "react";
import { useTheme } from "./lib/useTheme";
import { Desktop } from "./os/Desktop";
import { BootScreen } from "./os/BootScreen";

/**
 * davelOS — a refined, macOS-inspired desktop environment that presents Davel
 * Radindra's portfolio as a developer's workspace: a GitHub repo browser, a
 * Claude Code terminal, a magnifying dock, Spotlight, and a window manager.
 */
export default function App() {
  const { theme, toggleTheme, setTheme } = useTheme();
  const [booted, setBooted] = useState(false);

  return (
    <div className="grain relative h-dvh w-full overflow-hidden">
      <Desktop
        theme={theme}
        toggleTheme={toggleTheme}
        setTheme={setTheme}
        booted={booted}
      />
      <BootScreen onDone={() => setBooted(true)} />
    </div>
  );
}

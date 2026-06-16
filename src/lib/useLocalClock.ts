import { useEffect, useState } from "react";

/** macOS-style time: 12-hour, no seconds, e.g. "10:09 PM". */
function format(timezone: string): string {
  try {
    return new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).format(new Date());
  } catch {
    return new Date().toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  }
}

/** Live ticking clock for a given IANA timezone (default: San Francisco).
 * Updates every 5s (no seconds shown, so a tighter interval is wasteful). */
export function useLocalClock(timezone = "America/Los_Angeles") {
  const [time, setTime] = useState(() => format(timezone));

  useEffect(() => {
    setTime(format(timezone));
    const id = window.setInterval(() => setTime(format(timezone)), 5000);
    return () => window.clearInterval(id);
  }, [timezone]);

  return time;
}

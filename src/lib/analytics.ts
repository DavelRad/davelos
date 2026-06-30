/**
 * First-party, cookieless usage telemetry.
 *
 * Fire-and-forget anonymous events ("which app did they open") to /api/event on
 * the same Cloud Run service — no third-party script, no tracking cookies. The
 * chatbot's questions are NOT sent here; they're logged server-side alongside
 * their answers (see server/main.py). This only records lightweight UX signals.
 *
 * Everything is best-effort: a blocked beacon or storage error never throws and
 * never affects the UI.
 */

type Props = Record<string, string | number | boolean | null | undefined>;

/** Mirror of ALLOWED_EVENTS in server/main.py — anything else is dropped. */
const ALLOWED = new Set([
  "session_start",
  "app_open",
  "resume_view",
  "spotlight_open",
  "github_open",
  "contact_click",
  "copy_email",
  "external_link",
]);

let cachedSid = "";

/** Per-tab session id (sessionStorage, NOT a cookie) to thread events together
 * and join them to chatbot turns (passed into the /api/ask body too). */
export function getSid(): string {
  if (cachedSid) return cachedSid;
  try {
    const key = "dr-sid";
    let v = sessionStorage.getItem(key);
    if (!v) {
      v =
        Math.random().toString(36).slice(2, 10) +
        Date.now().toString(36).slice(-4);
      sessionStorage.setItem(key, v);
    }
    cachedSid = v;
  } catch {
    cachedSid = "nostore";
  }
  return cachedSid;
}

/** Emit one anonymous usage event. No-op for unknown names; never throws. */
export function track(name: string, props?: Props): void {
  if (!ALLOWED.has(name)) return;
  try {
    const body = JSON.stringify({ name, props: props ?? {}, sid: getSid() });
    if (typeof navigator !== "undefined" && navigator.sendBeacon) {
      navigator.sendBeacon(
        "/api/event",
        new Blob([body], { type: "application/json" }),
      );
    } else {
      void fetch("/api/event", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
        keepalive: true,
      }).catch(() => {});
    }
  } catch {
    /* analytics is best-effort — swallow everything */
  }
}

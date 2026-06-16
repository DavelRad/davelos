import { useCallback, useMemo, useReducer } from "react";
import { ALL_APP_IDS, APPS } from "./apps";
import type { AppId, OSAction, OSState, WindowState } from "./types";

/** Reserved top inset for the menu bar (px) — windows can't go above this. */
export const MENU_BAR_H = 26;
/** Reserved bottom inset for the dock (px). */
export const DOCK_RESERVE = 96;

function clamp(v: number, lo: number, hi: number): number {
  return Math.min(Math.max(v, lo), hi);
}

/** Resolve an app's fractional defaults into px geometry for the viewport. */
function resolveGeometry(id: AppId): Pick<WindowState, "x" | "y" | "w" | "h"> {
  const meta = APPS[id];
  const vw = typeof window === "undefined" ? 1440 : window.innerWidth;
  const vh = typeof window === "undefined" ? 900 : window.innerHeight;
  const w = Math.max(meta.min.w, Math.round(meta.defaults.w * vw));
  const h = Math.max(meta.min.h, Math.round(meta.defaults.h * vh));
  const x = clamp(Math.round(meta.defaults.x * vw), 8, Math.max(8, vw - w - 8));
  const y = clamp(
    Math.round(meta.defaults.y * vh),
    MENU_BAR_H + 6,
    Math.max(MENU_BAR_H + 6, vh - h - 8),
  );
  return { x, y, w, h };
}

function makeWindow(id: AppId): WindowState {
  return {
    id,
    z: 0,
    open: false,
    minimized: false,
    maximized: false,
    ...resolveGeometry(id),
  };
}

function initState(): OSState {
  const windows = {} as Record<AppId, WindowState>;
  for (const id of ALL_APP_IDS) windows[id] = makeWindow(id);
  return { windows, order: [], topZ: 0, lastLaunch: null };
}

let launchNonce = 0;

function bringToFront(state: OSState, id: AppId): OSState {
  const topZ = state.topZ + 1;
  return {
    ...state,
    topZ,
    windows: { ...state.windows, [id]: { ...state.windows[id], z: topZ } },
  };
}

function reducer(state: OSState, action: OSAction): OSState {
  const win = state.windows[action.id];
  // Link-only apps (e.g. github) have no managed window — ignore any action.
  if (!win) return state;
  switch (action.type) {
    case "open": {
      const already = win.open;
      // fire a launch bounce when the app appears (fresh open OR un-minimize)
      const launched = !already || win.minimized;
      let next: OSState = {
        ...state,
        windows: {
          ...state.windows,
          [action.id]: {
            ...win,
            open: true,
            minimized: false,
          },
        },
        order: already ? state.order : [...state.order, action.id],
        lastLaunch: launched
          ? { id: action.id, nonce: ++launchNonce }
          : state.lastLaunch,
      };
      next = bringToFront(next, action.id);
      return next;
    }
    case "close":
      return {
        ...state,
        windows: {
          ...state.windows,
          [action.id]: {
            ...makeWindow(action.id), // reset geometry for next open
          },
        },
        order: state.order.filter((o) => o !== action.id),
      };
    case "focus":
      if (!win.open || win.minimized) return state;
      return bringToFront(state, action.id);
    case "minimize":
      return {
        ...state,
        windows: {
          ...state.windows,
          [action.id]: { ...win, minimized: true },
        },
      };
    case "restore": {
      const next = {
        ...state,
        windows: {
          ...state.windows,
          [action.id]: { ...win, minimized: false, open: true },
        },
        order: win.open ? state.order : [...state.order, action.id],
        lastLaunch: { id: action.id, nonce: ++launchNonce },
      };
      return bringToFront(next, action.id);
    }
    case "toggleMinimize":
      if (win.minimized) return reducer(state, { type: "restore", id: action.id });
      return reducer(state, { type: "minimize", id: action.id });
    case "toggleMaximize":
      return bringToFront(
        {
          ...state,
          windows: {
            ...state.windows,
            [action.id]: { ...win, maximized: !win.maximized },
          },
        },
        action.id,
      );
    case "move":
      return {
        ...state,
        windows: {
          ...state.windows,
          [action.id]: { ...win, x: action.x, y: action.y },
        },
      };
    case "resize":
      return {
        ...state,
        windows: {
          ...state.windows,
          [action.id]: {
            ...win,
            w: Math.max(APPS[action.id].min.w, action.w),
            h: Math.max(APPS[action.id].min.h, action.h),
            x: action.x ?? win.x,
            y: action.y ?? win.y,
          },
        },
      };
    default:
      return state;
  }
}

export interface WindowManager {
  state: OSState;
  open: (id: AppId) => void;
  close: (id: AppId) => void;
  focus: (id: AppId) => void;
  minimize: (id: AppId) => void;
  restore: (id: AppId) => void;
  toggleMinimize: (id: AppId) => void;
  toggleMaximize: (id: AppId) => void;
  move: (id: AppId, x: number, y: number) => void;
  resize: (id: AppId, w: number, h: number, x?: number, y?: number) => void;
  /** "open" toggles focus/minimize for an already-running app. */
  activate: (id: AppId) => void;
  isRunning: (id: AppId) => boolean;
  /** the currently focused (front-most, non-minimized) open app. */
  frontApp: AppId | null;
  /** most-recent launch {id, nonce} — drives the dock launch bounce. */
  lastLaunch: OSState["lastLaunch"];
}

export function useWindowManager(): WindowManager {
  const [state, dispatch] = useReducer(reducer, undefined, initState);

  const open = useCallback((id: AppId) => dispatch({ type: "open", id }), []);
  const close = useCallback((id: AppId) => dispatch({ type: "close", id }), []);
  const focus = useCallback((id: AppId) => dispatch({ type: "focus", id }), []);
  const minimize = useCallback(
    (id: AppId) => dispatch({ type: "minimize", id }),
    [],
  );
  const restore = useCallback(
    (id: AppId) => dispatch({ type: "restore", id }),
    [],
  );
  const toggleMinimize = useCallback(
    (id: AppId) => dispatch({ type: "toggleMinimize", id }),
    [],
  );
  const toggleMaximize = useCallback(
    (id: AppId) => dispatch({ type: "toggleMaximize", id }),
    [],
  );
  const move = useCallback(
    (id: AppId, x: number, y: number) => dispatch({ type: "move", id, x, y }),
    [],
  );
  const resize = useCallback(
    (id: AppId, w: number, h: number, x?: number, y?: number) =>
      dispatch({ type: "resize", id, w, h, x, y }),
    [],
  );

  const isRunning = useCallback(
    (id: AppId) => state.windows[id]?.open ?? false,
    [state],
  );

  /** Activate from the dock: open if closed, restore if minimized, else focus.
   * Link-only apps (no window) are a no-op here — Desktop intercepts them. */
  const activate = useCallback(
    (id: AppId) => {
      const w = state.windows[id];
      if (!w) return;
      if (!w.open) dispatch({ type: "open", id });
      else if (w.minimized) dispatch({ type: "restore", id });
      else dispatch({ type: "focus", id });
    },
    [state],
  );

  const frontApp = useMemo<AppId | null>(() => {
    let best: AppId | null = null;
    let bestZ = -1;
    for (const id of state.order) {
      const w = state.windows[id];
      if (w.open && !w.minimized && w.z > bestZ) {
        bestZ = w.z;
        best = id;
      }
    }
    return best;
  }, [state]);

  return {
    state,
    open,
    close,
    focus,
    minimize,
    restore,
    toggleMinimize,
    toggleMaximize,
    move,
    resize,
    activate,
    isRunning,
    frontApp,
    lastLaunch: state.lastLaunch,
  };
}

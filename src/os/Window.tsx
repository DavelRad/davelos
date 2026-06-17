import { useEffect, useRef, useState, type ReactNode } from "react";
import { motion, useDragControls, useMotionValue } from "framer-motion";
import { X, Minus, Plus } from "lucide-react";
import { cn } from "../lib/cn";
import { useDelightMotion } from "../lib/useDelightMotion";
import { MENU_BAR_H } from "./useWindowManager";
import type { WindowState } from "./types";

interface WindowProps {
  meta: { name: string };
  win: WindowState;
  /** minimum window size in px (for live-resize clamping). */
  minSize: { w: number; h: number };
  focused: boolean;
  children: ReactNode;
  /** title-bar accessory rendered on the right (optional). */
  titleAccessory?: ReactNode;
  onFocus: () => void;
  onClose: () => void;
  onMinimize: () => void;
  onToggleMaximize: () => void;
  onMove: (x: number, y: number) => void;
  onResize: (w: number, h: number, x?: number, y?: number) => void;
}

/** The eight macOS resize directions. */
type ResizeDir = "n" | "s" | "e" | "w" | "ne" | "nw" | "se" | "sw";

/** A macOS traffic-light control: 12px circle, darker inner border, glyph on
 * the cluster's hover. Gray when the window is inactive (real macOS behavior). */
function TrafficLight({
  color,
  inner,
  active,
  label,
  onClick,
  icon: Icon,
}: {
  color: string;
  inner: string;
  active: boolean;
  label: string;
  onClick: () => void;
  icon: typeof X;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      onPointerDown={(e) => e.stopPropagation()}
      className="grid size-3 place-items-center rounded-full transition-colors"
      style={{
        backgroundColor: active ? color : "var(--tl-inactive)",
        boxShadow: active ? `inset 0 0 0 0.5px ${inner}` : "none",
      }}
    >
      <Icon
        className="size-[9px] opacity-0 transition-opacity group-hover/lights:opacity-100"
        style={{ color: "rgba(0,0,0,0.55)" }}
        strokeWidth={2.6}
      />
    </button>
  );
}

export function Window({
  meta,
  win,
  minSize,
  focused,
  children,
  titleAccessory,
  onFocus,
  onClose,
  onMinimize,
  onToggleMaximize,
  onMove,
  onResize,
}: WindowProps) {
  const delight = useDelightMotion();
  const dragControls = useDragControls();
  const resizeStart = useRef({ w: 0, h: 0, mx: 0, my: 0 });
  const draggingRef = useRef(false);
  const resizingRef = useRef(false);
  const [dragging, setDragging] = useState(false);

  const maximized = win.maximized;

  // Position is a GPU transform (translate via motion values) — NOT left/top —
  // so dragging never triggers layout reflow or per-frame React re-renders.
  // framer-motion's `drag` updates these motion values directly on the
  // compositor; we only commit the final position to state on drag END.
  const x = useMotionValue(maximized ? 8 : win.x);
  const y = useMotionValue(maximized ? MENU_BAR_H + 6 : win.y);

  // Size is ALSO a motion value, so the resize handle writes width/height
  // directly (no setState/re-render per frame) and we commit once on release —
  // mirroring the drag's commit-on-end pattern.
  const width = useMotionValue(maximized ? window.innerWidth - 16 : win.w);
  const height = useMotionValue(maximized ? window.innerHeight - MENU_BAR_H - 14 : win.h);

  // Sync the transform when position/maximize changes externally (open, restore,
  // zoom) — but never mid-drag or mid-resize (those own x/y then; a top/left
  // resize edge moves the origin, so a re-render must not reset it).
  useEffect(() => {
    if (draggingRef.current || resizingRef.current) return;
    x.set(maximized ? 8 : win.x);
    y.set(maximized ? MENU_BAR_H + 6 : win.y);
  }, [win.x, win.y, maximized, x, y]);

  // Sync size from state (open/zoom/restore/external resize) — but never mid-
  // resize (the handle owns width/height then).
  useEffect(() => {
    if (resizingRef.current) return;
    width.set(maximized ? window.innerWidth - 16 : win.w);
    height.set(maximized ? window.innerHeight - MENU_BAR_H - 14 : win.h);
  }, [win.w, win.h, maximized, width, height]);

  // Edge/corner resize, macOS-style — any of the 8 directions. We write the
  // width/height (and, for top/left edges, the x/y) motion values directly each
  // frame, clamp to the app's min size, and commit once to state on release.
  function startResize(e: React.PointerEvent, dir: ResizeDir) {
    e.stopPropagation();
    e.preventDefault();
    if (maximized) return;
    onFocus();
    resizingRef.current = true;
    const x0 = x.get();
    const y0 = y.get();
    resizeStart.current = { w: win.w, h: win.h, mx: e.clientX, my: e.clientY };
    const target = e.currentTarget as HTMLElement;
    target.setPointerCapture(e.pointerId);

    const onMoveResize = (ev: PointerEvent) => {
      const dx = ev.clientX - resizeStart.current.mx;
      const dy = ev.clientY - resizeStart.current.my;
      const { w: w0, h: h0 } = resizeStart.current;

      if (dir.includes("e")) {
        width.set(Math.max(minSize.w, w0 + dx));
      } else if (dir.includes("w")) {
        // left edge moves: shrink/grow from the left, holding the right edge.
        const nw = Math.max(minSize.w, w0 - dx);
        width.set(nw);
        x.set(x0 + (w0 - nw));
      }
      if (dir.includes("s")) {
        height.set(Math.max(minSize.h, h0 + dy));
      } else if (dir.includes("n")) {
        // top edge moves: hold the bottom edge.
        const nh = Math.max(minSize.h, h0 - dy);
        height.set(nh);
        y.set(Math.max(MENU_BAR_H + 6, y0 + (h0 - nh)));
      }
    };
    const onUp = (ev: PointerEvent) => {
      target.releasePointerCapture(ev.pointerId);
      window.removeEventListener("pointermove", onMoveResize);
      window.removeEventListener("pointerup", onUp);
      resizingRef.current = false;
      // commit the final geometry to state — once, on release
      onResize(
        Math.round(width.get()),
        Math.round(height.get()),
        Math.round(x.get()),
        Math.round(y.get()),
      );
    };
    window.addEventListener("pointermove", onMoveResize);
    window.addEventListener("pointerup", onUp);
  }

  return (
    <motion.div
      role="dialog"
      aria-label={meta.name}
      drag={!maximized}
      dragListener={false}
      dragControls={dragControls}
      dragMomentum={false}
      dragElastic={0.04}
      dragConstraints={{
        left: -win.w + 140,
        right: window.innerWidth - 140,
        top: MENU_BAR_H + 6,
        bottom: window.innerHeight - 52,
      }}
      onDragStart={() => {
        draggingRef.current = true;
        setDragging(true);
      }}
      onDragEnd={() => {
        draggingRef.current = false;
        setDragging(false);
        // commit the final transform position to state — once, on release
        onMove(Math.round(x.get()), Math.round(y.get()));
      }}
      onPointerDownCapture={onFocus}
      initial={delight ? { opacity: 0, scale: 0.96 } : { opacity: 1 }}
      animate={
        win.minimized
          ? delight
            ? { opacity: 0, scale: 0.5, filter: "blur(3px)" }
            : { opacity: 0 }
          : delight
            ? { opacity: 1, scale: 1, filter: "blur(0px)" }
            : { opacity: 1, scale: 1 }
      }
      exit={delight ? { opacity: 0, scale: 0.94 } : { opacity: 0 }}
      transition={
        delight
          ? { type: "spring", stiffness: 380, damping: 32, mass: 0.8 }
          : { duration: 0.12 }
      }
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        x,
        y,
        width,
        height,
        zIndex: 100 + win.z,
        pointerEvents: win.minimized ? "none" : "auto",
        transformOrigin: "center bottom",
        borderRadius: 11,
        // authentic macOS window shadow + hairline ring (composited with the
        // transform layer, so it moves smoothly during a drag)
        boxShadow: focused
          ? "0 25px 50px -12px rgba(0,0,0,0.55), 0 0 0 0.5px rgba(0,0,0,0.35)"
          : "0 16px 38px -16px rgba(0,0,0,0.5), 0 0 0 0.5px rgba(0,0,0,0.3)",
        willChange: "transform",
      }}
      // solid surface (no window-level backdrop-blur — it was ~invisible behind a
      // 92%-opaque bg but recomputed every frame while dragging)
      className="group/window flex flex-col overflow-hidden bg-surface"
    >
      {/* title bar (drag handle) — Liquid Glass vibrancy when idle, solid while
          dragging so the heavy backdrop blur isn't recomputed every frame */}
      <div
        onPointerDown={(e) => {
          if ((e.target as HTMLElement).closest("[data-no-drag]")) return;
          dragControls.start(e);
        }}
        onDoubleClick={(e) => {
          if ((e.target as HTMLElement).closest("[data-no-drag]")) return;
          onToggleMaximize();
        }}
        className={cn(
          "relative flex h-10 shrink-0 cursor-grab select-none items-center gap-2 border-b border-line/70 px-3 active:cursor-grabbing",
          dragging
            ? "bg-surface-2"
            : cn("backdrop-blur-xl", focused ? "bg-surface-2/65" : "bg-surface-2/40"),
        )}
      >
        {/* traffic lights: 12px left inset, 8px gap */}
        <div className="group/lights flex items-center gap-2 pl-0.5" data-no-drag>
          <TrafficLight
            color="#ff5f57"
            inner="rgba(0,0,0,0.18)"
            active={focused}
            label={`Close ${meta.name}`}
            icon={X}
            onClick={onClose}
          />
          <TrafficLight
            color="#febc2e"
            inner="rgba(0,0,0,0.16)"
            active={focused}
            label={`Minimize ${meta.name}`}
            icon={Minus}
            onClick={onMinimize}
          />
          <TrafficLight
            color="#28c840"
            inner="rgba(0,0,0,0.16)"
            active={focused}
            label={`Zoom ${meta.name}`}
            icon={Plus}
            onClick={onToggleMaximize}
          />
        </div>
        <div
          className={cn(
            "pointer-events-none absolute inset-x-0 flex items-center justify-center truncate text-[0.8rem] font-semibold",
            focused ? "text-ink/85" : "text-ink-faint",
          )}
        >
          <span className="truncate px-28">{meta.name}</span>
        </div>
        <div className="ml-auto flex items-center" data-no-drag>
          {titleAccessory}
        </div>
      </div>

      {/* body — inactive windows dim slightly */}
      <div
        className={cn(
          "relative min-h-0 flex-1 overflow-hidden transition-opacity",
          focused ? "opacity-100" : "opacity-[0.94]",
        )}
      >
        {children}
      </div>

      {/* resize handles — 4 edges + 4 corners, like real macOS */}
      {!maximized ? (
        <>
          {/* edges (thin strips, inset so corners win at the ends) */}
          <div onPointerDown={(e) => startResize(e, "n")} aria-hidden className="absolute inset-x-3 top-0 z-10 h-[5px] cursor-ns-resize" />
          <div onPointerDown={(e) => startResize(e, "s")} aria-hidden className="absolute inset-x-3 bottom-0 z-10 h-[5px] cursor-ns-resize" />
          <div onPointerDown={(e) => startResize(e, "w")} aria-hidden className="absolute inset-y-3 left-0 z-10 w-[5px] cursor-ew-resize" />
          <div onPointerDown={(e) => startResize(e, "e")} aria-hidden className="absolute inset-y-3 right-0 z-10 w-[5px] cursor-ew-resize" />
          {/* corners (sit above edges) */}
          <div onPointerDown={(e) => startResize(e, "nw")} aria-hidden className="absolute left-0 top-0 z-20 size-3 cursor-nwse-resize" />
          <div onPointerDown={(e) => startResize(e, "ne")} aria-hidden className="absolute right-0 top-0 z-20 size-3 cursor-nesw-resize" />
          <div onPointerDown={(e) => startResize(e, "sw")} aria-hidden className="absolute bottom-0 left-0 z-20 size-3 cursor-nesw-resize" />
          <div onPointerDown={(e) => startResize(e, "se")} aria-hidden className="absolute bottom-0 right-0 z-20 size-3 cursor-nwse-resize" />
        </>
      ) : null}
    </motion.div>
  );
}

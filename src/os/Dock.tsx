import { useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  motion,
  useAnimationControls,
  useMotionValue,
  useSpring,
  useTransform,
  type MotionValue,
} from "framer-motion";
import { cn } from "../lib/cn";
import { useDelightMotion } from "../lib/useDelightMotion";
import { APP_LIST } from "./apps";
import type { AppId } from "./types";
import { DockAppIcon, TrashIcon } from "./DockIcons";

interface DockProps {
  isRunning: (id: AppId) => boolean;
  frontApp: AppId | null;
  onActivate: (id: AppId) => void;
  /** {id, nonce} of the most recently launched app (drives the bounce). */
  lastLaunch: { id: AppId; nonce: number } | null;
}

// Magnification tuning — canonical macOS-dock feel.
const BASE = 52; // resting icon size (px)
const MAX = 88; // peak size under the cursor (px) — rises up out of the bar
// The glass bar holds a STABLE height (sized to the resting icons); magnified
// icons overflow UPWARD out of it, exactly like the real macOS Dock — the bar
// itself doesn't inflate, the icons pop up out of it.
const DOCK_H = 72;
// Influence reaches ~3 neighbours each side, so the size curve is wide and the
// transition between magnified/unmagnified is gradual (not steppy).
const INFLUENCE = 150;
// A smooth, slightly weighty spring (low mass → responsive; moderate damping →
// fluid, low-jitter). Tuned per the canonical Dock feel.
const MAG_SPRING = { mass: 0.1, stiffness: 170, damping: 14 } as const;

export function Dock({ isRunning, frontApp, onActivate, lastLaunch }: DockProps) {
  const delight = useDelightMotion();
  // pointer x within the dock; Infinity means "far away" (no magnification)
  const mouseX = useMotionValue<number>(Infinity);

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-2 z-[900] flex justify-center">
      <motion.div
        onMouseMove={(e) => mouseX.set(e.clientX)}
        onMouseLeave={() => mouseX.set(Infinity)}
        className="liquid-glass pointer-events-auto flex items-end gap-2.5 px-3 pb-2"
        style={{
          borderRadius: 26,
          height: DOCK_H,
          overflow: "visible",
          // lighter blur than the shared liquid-glass (40px) — the dock resizes
          // every frame during magnification, so a heavy backdrop blur recomputes
          // continuously and stutters. 18px still reads as glass, far cheaper.
          backdropFilter: "blur(18px) saturate(150%)",
          WebkitBackdropFilter: "blur(18px) saturate(150%)",
        }}
        role="toolbar"
        aria-label="Dock"
      >
        {APP_LIST.map((app) => (
          <DockItem
            key={app.id}
            mouseX={mouseX}
            delight={delight}
            name={app.name}
            running={isRunning(app.id)}
            front={frontApp === app.id}
            launch={lastLaunch && lastLaunch.id === app.id ? lastLaunch.nonce : 0}
            onClick={() => onActivate(app.id)}
          >
            <DockAppIcon id={app.id} />
          </DockItem>
        ))}

        {/* separator + Trash (realism) */}
        <div className="mb-1 h-12 w-px self-center bg-white/20" aria-hidden />
        <DockItem
          mouseX={mouseX}
          delight={delight}
          name="Trash"
          running={false}
          front={false}
          launch={0}
        >
          <TrashIcon />
        </DockItem>
      </motion.div>
    </div>
  );
}

interface DockItemProps {
  mouseX: MotionValue<number>;
  delight: boolean;
  name: string;
  running: boolean;
  front: boolean;
  /** nonce that changes when this app launches; 0 = never. */
  launch: number;
  onClick?: () => void;
  children: React.ReactNode;
}

function DockItem({
  mouseX,
  delight,
  name,
  running,
  front,
  launch,
  onClick,
  children,
}: DockItemProps) {
  const ref = useRef<HTMLButtonElement>(null);
  const [hovered, setHovered] = useState(false);
  const bounce = useAnimationControls();

  // Cache this icon's RESTING center-x once (and on resize) instead of reading
  // getBoundingClientRect on every pointer move. Reading layout each frame while
  // also writing width each frame is layout-thrash — the main source of the
  // choppiness. A cached center also removes the feedback loop where a growing
  // icon shifts its own center and oscillates. Mapping the cursor to fixed
  // resting slots is exactly how the real Dock behaves, and it's buttery.
  const centerX = useRef(0);
  useLayoutEffect(() => {
    const measure = () => {
      const el = ref.current;
      if (el) {
        const r = el.getBoundingClientRect();
        centerX.current = r.left + r.width / 2;
      }
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  // Continuous distance→size mapping with a smooth wide cosine falloff so the
  // magnification reads as one fluid curve across ~3 neighbours each side.
  const sizeRaw = useTransform(mouseX, (x) => {
    if (!delight || x === Infinity || !centerX.current) return BASE;
    const dist = x - centerX.current;
    const t = Math.min(1, Math.abs(dist) / INFLUENCE);
    if (t >= 1) return BASE;
    // raised-cosine: 1 at the cursor, 0 at the influence edge, smooth in between
    const falloff = 0.5 * (1 + Math.cos(t * Math.PI));
    return BASE + (MAX - BASE) * falloff;
  });
  // magnification ALWAYS runs (decoupled from OS reduce-motion); only the
  // explicit Settings "reduce delight" toggle disables it.
  const size = useSpring(sizeRaw, MAG_SPRING);

  // app-launch bounce — fires whenever `launch` changes to a new nonce
  useEffect(() => {
    if (!launch) return;
    if (!delight) return;
    void bounce.start({
      y: [0, -22, 0, -10, 0],
      transition: { duration: 0.75, times: [0, 0.3, 0.6, 0.8, 1], ease: "easeOut" },
    });
  }, [launch, delight, bounce]);

  return (
    <div className="relative flex flex-col items-center">
      {/* tooltip — glass bubble above */}
      <motion.span
        initial={false}
        animate={{ opacity: hovered ? 1 : 0, y: hovered ? 0 : 6 }}
        transition={{ duration: 0.14 }}
        className="liquid-glass pointer-events-none absolute -top-10 z-10 whitespace-nowrap rounded-lg px-2.5 py-1 text-[0.74rem] font-medium text-ink"
      >
        {name}
      </motion.span>

      <motion.button
        ref={ref}
        type="button"
        style={{ width: size, height: size }}
        animate={bounce}
        onClick={onClick}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onFocus={() => setHovered(true)}
        onBlur={() => setHovered(false)}
        whileTap={{ scale: 0.84 }}
        transition={{ type: "spring", stiffness: 500, damping: 28 }}
        aria-label={`${name}${running ? " (running)" : ""}`}
        title={name}
        className="grid aspect-square place-items-center"
      >
        {children}
      </motion.button>

      {/* running indicator — small dot under open apps */}
      <span
        className={cn(
          "mt-1 size-[3px] rounded-full transition-colors",
          running ? "bg-white/80" : "bg-transparent",
        )}
        aria-hidden
      />
      <span className="sr-only">{front ? "frontmost" : ""}</span>
    </div>
  );
}

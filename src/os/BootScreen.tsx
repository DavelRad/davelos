import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useReducedMotion } from "../lib/useReducedMotion";

interface BootScreenProps {
  onDone: () => void;
}

/**
 * A short (<1.5s), skippable boot flash. Click/keypress dismisses early.
 * Under reduced motion it resolves immediately.
 */
export function BootScreen({ onDone }: BootScreenProps) {
  const reduced = useReducedMotion();
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (reduced) {
      setVisible(false);
      onDone();
      return;
    }
    const t = window.setTimeout(() => {
      setVisible(false);
    }, 1300);
    const skip = () => setVisible(false);
    window.addEventListener("keydown", skip);
    window.addEventListener("pointerdown", skip);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener("keydown", skip);
      window.removeEventListener("pointerdown", skip);
    };
  }, [reduced, onDone]);

  return (
    <AnimatePresence onExitComplete={onDone}>
      {visible ? (
        <motion.div
          className="fixed inset-0 z-[5000] grid place-items-center"
          style={{ background: "#000000" }}
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
        >
          <div className="flex flex-col items-center gap-9">
            <motion.div
              initial={{ scale: 0.94, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="grid size-[64px] place-items-center rounded-[22%] text-white"
              style={{
                background: "linear-gradient(160deg, #2c2c2e 0%, #161618 100%)",
                boxShadow:
                  "inset 0 1px 0 rgba(255,255,255,0.18), 0 8px 30px rgba(0,0,0,0.6)",
              }}
            >
              <span className="text-[1.35rem] font-semibold tracking-tight">
                DR
              </span>
            </motion.div>
            <div className="h-[4px] w-44 overflow-hidden rounded-full bg-white/12">
              <motion.div
                className="h-full bg-white/85"
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ duration: 1.1, ease: "easeInOut" }}
              />
            </div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

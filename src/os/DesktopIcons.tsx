import { motion } from "framer-motion";
import { FileText, FileCode2 } from "lucide-react";

interface DesktopIconsProps {
  onOpenResume: () => void;
  onOpenEditor: () => void;
}

/**
 * Desktop "file" icons (top-right corner). Open on SINGLE click (portfolio-
 * friendly) with a brief press animation; double-click still works. resume.pdf
 * opens the Preview app on the real PDF; davel.config.ts opens the Editor.
 */
export function DesktopIcons({ onOpenResume, onOpenEditor }: DesktopIconsProps) {
  return (
    <div className="pointer-events-none absolute right-4 top-[42px] z-[5] flex flex-col gap-4">
      <DesktopIcon
        label="resume.pdf"
        icon={<FileText className="size-7 text-ink-muted" strokeWidth={1.6} />}
        onOpen={onOpenResume}
      />
      <DesktopIcon
        label="davel.config.ts"
        icon={<FileCode2 className="size-7 text-ink" strokeWidth={1.6} />}
        onOpen={onOpenEditor}
      />
    </div>
  );
}

function DesktopIcon({
  label,
  icon,
  onOpen,
}: {
  label: string;
  icon: React.ReactNode;
  onOpen: () => void;
}) {
  return (
    <motion.button
      type="button"
      onClick={onOpen}
      onDoubleClick={onOpen}
      whileTap={{ scale: 0.92 }}
      transition={{ type: "spring", stiffness: 500, damping: 26 }}
      className="pointer-events-auto group flex w-20 cursor-pointer flex-col items-center gap-1.5 rounded-lg p-2 text-center transition-colors hover:bg-white/5 focus-visible:bg-white/5"
      title={`Open ${label}`}
    >
      <span className="grid size-12 place-items-center rounded-xl border border-line bg-surface/60 backdrop-blur-md transition-colors group-hover:border-line-strong group-active:bg-surface/80">
        {icon}
      </span>
      <span className="rounded px-1 text-[0.68rem] leading-tight text-ink-muted group-hover:bg-os-accent group-hover:text-white">
        {label}
      </span>
    </motion.button>
  );
}

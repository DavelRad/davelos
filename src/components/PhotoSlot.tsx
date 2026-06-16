import { useState } from "react";
import { ImageIcon } from "lucide-react";

interface PhotoSlotProps {
  /** filename stem; loads /photos/<name>.jpg, falls back to a placeholder. */
  name: string;
  caption: string;
  /** aspect ratio class (Tailwind), default 16/9-ish. */
  className?: string;
}

/**
 * A photo slot that tries to load `/public/photos/<name>.jpg`. When the file
 * is missing it shows a tasteful placeholder (dashed border, image icon, the
 * caption, and the exact path to drop the file). Davel can add real photos by
 * placing them in /public/photos/.
 */
export function PhotoSlot({ name, caption, className }: PhotoSlotProps) {
  const [failed, setFailed] = useState(false);
  const src = `/photos/${name}.jpg`;

  if (failed) {
    return (
      <figure
        className={
          "flex flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-white/15 bg-white/[0.03] p-5 text-center " +
          (className ?? "aspect-[16/10]")
        }
      >
        <ImageIcon className="size-6 text-[#6a6a72]" />
        <figcaption className="text-xs font-medium text-[#c4c4cc]">
          {caption}
        </figcaption>
        <span className="font-mono text-[0.6rem] text-[#6a6a72]">
          add /public/photos/{name}.jpg
        </span>
      </figure>
    );
  }

  return (
    <figure
      className={
        "overflow-hidden rounded-xl border border-white/10 " +
        (className ?? "aspect-[16/10]")
      }
    >
      <img
        src={src}
        alt={caption}
        onError={() => setFailed(true)}
        className="size-full object-cover"
        loading="lazy"
      />
      <figcaption className="bg-black/40 px-3 py-1 text-[0.65rem] text-[#c4c4cc]">
        {caption}
      </figcaption>
    </figure>
  );
}

import { useMemo, useState } from "react";
import { Images } from "lucide-react";
import { cn } from "../lib/cn";
import { Gallery } from "../components/Gallery";
import { photoSets } from "../data/photos";

/**
 * Photos — a macOS-Photos-style album browser for davelOS. Left sidebar of
 * albums (the event buckets), main grid of the selected album, click-to-expand
 * lightbox (reuses <Gallery>). Albums are derived from the photo manifest, so
 * uploading more via the photo tool + regenerating photos.ts is all it takes.
 */
const ALBUMS: { id: string; name: string; sub?: string }[] = (
  [
    { id: "life", name: "Life", sub: "outside the terminal" },
    { id: "founders-inc", name: "Founders Inc", sub: "Fort Mason" },
    { id: "fetchai", name: "Fetch.ai", sub: "the internship" },
    { id: "calhacks", name: "CalHacks", sub: "Databae" },
    { id: "hack-for-social-impact", name: "Hack for Social Impact", sub: "LandDrop" },
    { id: "jonajo", name: "Jonajo" },
  ] as const
).filter((a) => (photoSets[a.id] ?? []).length > 0);

export function Photos() {
  const [album, setAlbum] = useState<string>("all");
  const all = useMemo(() => ALBUMS.flatMap((a) => photoSets[a.id] ?? []), []);
  const photos = album === "all" ? all : photoSets[album] ?? [];
  const title =
    album === "all" ? "All Photos" : ALBUMS.find((a) => a.id === album)?.name ?? "";

  return (
    <div className="flex h-full bg-[#1b1b1d] text-[#e7e7ea]">
      {/* sidebar */}
      <aside className="w-44 shrink-0 overflow-y-auto border-r border-white/8 bg-[#161618] p-2.5">
        <p className="px-2 pb-1 pt-1 text-[0.6rem] font-semibold uppercase tracking-wider text-[#76767e]">
          Library
        </p>
        <SideItem
          active={album === "all"}
          onClick={() => setAlbum("all")}
          name="All Photos"
          count={all.length}
        />
        <p className="px-2 pb-1 pt-3 text-[0.6rem] font-semibold uppercase tracking-wider text-[#76767e]">
          Albums
        </p>
        {ALBUMS.map((a) => (
          <SideItem
            key={a.id}
            active={album === a.id}
            onClick={() => setAlbum(a.id)}
            name={a.name}
            count={(photoSets[a.id] ?? []).length}
          />
        ))}
      </aside>

      {/* main */}
      <section className="flex min-w-0 flex-1 flex-col">
        <div className="flex shrink-0 items-baseline gap-2.5 border-b border-white/8 px-5 py-3.5">
          <h2 className="text-[0.95rem] font-semibold">{title}</h2>
          <span className="text-xs text-[#8a8a92]">
            {photos.length} photo{photos.length === 1 ? "" : "s"}
          </span>
        </div>
        <div className="scroll-region min-h-0 flex-1 overflow-y-auto p-4">
          {photos.length ? (
            <Gallery photos={photos} />
          ) : (
            <p className="text-sm text-[#76767e]">No photos yet.</p>
          )}
        </div>
      </section>
    </div>
  );
}

function SideItem({
  active,
  onClick,
  name,
  count,
}: {
  active: boolean;
  onClick: () => void;
  name: string;
  count: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-[0.82rem] transition-colors",
        active ? "bg-white/12 text-white" : "text-[#c4c4cc] hover:bg-white/[0.06]",
      )}
    >
      <Images
        className={cn("size-3.5 shrink-0", active ? "text-[#e7e7ea]" : "text-[#76767e]")}
      />
      <span className="flex-1 truncate">{name}</span>
      <span className="text-[0.7rem] text-[#76767e]">{count}</span>
    </button>
  );
}

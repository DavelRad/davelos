import { useCallback, useEffect, useRef, useState } from "react";
import { Play, Pause, SkipBack, SkipForward, ExternalLink } from "lucide-react";
import { useDelightMotion } from "../lib/useDelightMotion";
import { SpotifyGlyph } from "../os/brandIcons";

/* ------------------------------------------------------------------ *
 * Spotify app — real Spotify dark look (#121212 bg, #1DB954 accent).
 * Fetches /api/spotify (a Vercel serverless function); on failure or empty
 * response it falls back to a clean MOCK so the app always works in dev,
 * pre-credentials. See /api/spotify.ts.
 * ------------------------------------------------------------------ */

interface Track {
  title: string;
  artist: string;
  album: string;
  albumArt: string | null;
  url: string;
}

interface NowPlaying extends Track {
  isPlaying: boolean;
  progressMs: number;
  durationMs: number;
}

interface SpotifyPayload {
  nowPlaying: NowPlaying | null;
  topTracks: Track[];
}

const PROFILE_URL = "https://open.spotify.com/user/davelgans";

/** Clean local mock used until the serverless endpoint returns real data. */
const MOCK: SpotifyPayload = {
  nowPlaying: {
    title: "Glue",
    artist: "bibio",
    album: "Ambivalence Avenue",
    albumArt: null,
    url: PROFILE_URL,
    isPlaying: true,
    progressMs: 84_000,
    durationMs: 213_000,
  },
  topTracks: [
    { title: "Midnight City", artist: "M83", album: "Hurry Up, We're Dreaming", albumArt: null, url: PROFILE_URL },
    { title: "A Walk", artist: "Tycho", album: "Dive", albumArt: null, url: PROFILE_URL },
    { title: "Nightcall", artist: "Kavinsky", album: "OutRun", albumArt: null, url: PROFILE_URL },
    { title: "Open Eye Signal", artist: "Jon Hopkins", album: "Immunity", albumArt: null, url: PROFILE_URL },
    { title: "Spaceship", artist: "Tycho", album: "Weather", albumArt: null, url: PROFILE_URL },
  ],
};

function fmt(ms: number): string {
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

export function Spotify() {
  const delight = useDelightMotion();
  const [data, setData] = useState<SpotifyPayload>(MOCK);
  const [usingMock, setUsingMock] = useState(true);
  // local playback state so the controls actually do something
  const [trackIndex, setTrackIndex] = useState(0);
  const [playing, setPlaying] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    (async () => {
      try {
        const res = await fetch("/api/spotify", { signal: controller.signal });
        if (!res.ok) throw new Error(`spotify ${res.status}`);
        const json = (await res.json()) as SpotifyPayload;
        if (!active) return;
        if (!json.nowPlaying && (!json.topTracks || json.topTracks.length === 0)) {
          return;
        }
        setData(json);
        setUsingMock(false);
        setPlaying(json.nowPlaying?.isPlaying ?? true);
      } catch {
        // keep the mock; expected before creds are configured
      }
    })();
    return () => {
      active = false;
      controller.abort();
    };
  }, []);

  // The "queue" is [nowPlaying, ...topTracks]; prev/next cycle through it.
  const queue: NowPlaying[] = [];
  if (data.nowPlaying) queue.push(data.nowPlaying);
  for (const t of data.topTracks) {
    queue.push({ ...t, isPlaying: true, progressMs: 0, durationMs: 210_000 });
  }
  const current = queue.length
    ? { ...queue[trackIndex % queue.length], isPlaying: playing }
    : null;

  const prev = useCallback(
    () => setTrackIndex((i) => (i - 1 + queue.length) % queue.length),
    [queue.length],
  );
  const next = useCallback(
    () => setTrackIndex((i) => (i + 1) % queue.length),
    [queue.length],
  );
  const togglePlay = useCallback(() => setPlaying((p) => !p), []);

  return (
    <div className="flex h-full flex-col bg-[#121212] text-white">
      {/* header */}
      <div className="flex shrink-0 items-center gap-2 border-b border-white/5 bg-[#0a0a0a] px-4 py-2.5">
        <SpotifyGlyph className="size-5 text-spotify" />
        <span className="text-sm font-semibold">Spotify</span>
        <a
          href={PROFILE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="ml-auto flex items-center gap-1 text-[0.7rem] text-[#b3b3b3] transition-colors hover:text-white"
        >
          davelgans <ExternalLink className="size-3" />
        </a>
      </div>

      <div className="scroll-region min-h-0 flex-1 overflow-y-auto px-4 py-4">
        {/* now playing */}
        {current ? (
          <NowPlayingCard
            np={current}
            delight={delight}
            onPrev={prev}
            onNext={next}
            onTogglePlay={togglePlay}
          />
        ) : null}

        {/* top tracks — clicking sets the current track */}
        <p className="mb-2 mt-5 text-xs font-semibold uppercase tracking-wide text-[#b3b3b3]">
          Top tracks this month
        </p>
        <ol className="space-y-0.5">
          {data.topTracks.map((t, i) => {
            const queuePos = (data.nowPlaying ? 1 : 0) + i;
            const isCurrent = trackIndex % queue.length === queuePos;
            return (
              <li key={`${t.title}-${i}`}>
                <button
                  type="button"
                  onClick={() => {
                    setTrackIndex(queuePos);
                    setPlaying(true);
                  }}
                  className={cnRow(isCurrent)}
                >
                  <span
                    className={
                      "w-4 text-right text-xs " +
                      (isCurrent ? "text-spotify" : "text-[#b3b3b3] group-hover:text-white")
                    }
                  >
                    {isCurrent && playing ? "▶" : i + 1}
                  </span>
                  <AlbumThumb art={t.albumArt} size="sm" />
                  <span className="min-w-0 flex-1 text-left">
                    <span
                      className={
                        "block truncate text-sm " +
                        (isCurrent ? "text-spotify" : "text-white")
                      }
                    >
                      {t.title}
                    </span>
                    <span className="block truncate text-xs text-[#b3b3b3]">{t.artist}</span>
                  </span>
                  <a
                    href={t.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    title="Open in Spotify"
                    className="opacity-0 transition-opacity group-hover:opacity-100"
                  >
                    <ExternalLink className="size-3.5 text-[#b3b3b3] hover:text-white" />
                  </a>
                </button>
              </li>
            );
          })}
        </ol>

        <p className="mt-4 font-mono text-[0.6rem] text-[#6a6a6a]">
          {usingMock ? "// mock — set Spotify env vars to go live (see README)" : "// live via /api/spotify"}
        </p>
      </div>
    </div>
  );
}

function cnRow(isCurrent: boolean): string {
  return (
    "group flex w-full items-center gap-3 rounded-md px-2 py-1.5 text-left transition-colors hover:bg-white/5 active:bg-white/10 " +
    (isCurrent ? "bg-white/[0.06]" : "")
  );
}

function NowPlayingCard({
  np,
  delight,
  onPrev,
  onNext,
  onTogglePlay,
}: {
  np: NowPlaying;
  delight: boolean;
  onPrev: () => void;
  onNext: () => void;
  onTogglePlay: () => void;
}) {
  // local progress ticker so the bar advances while playing
  const [progress, setProgress] = useState(np.progressMs);
  const raf = useRef<number>(0);
  const last = useRef<number>(performance.now());

  // reset progress whenever the track changes
  useEffect(() => {
    setProgress(np.progressMs);
  }, [np.title, np.progressMs]);

  useEffect(() => {
    if (!np.isPlaying) return;
    last.current = performance.now();
    const tick = (now: number) => {
      const dt = now - last.current;
      last.current = now;
      setProgress((p) => {
        const nextP = p + dt;
        if (nextP >= np.durationMs) {
          onNext();
          return 0;
        }
        return nextP;
      });
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [np.isPlaying, np.durationMs, np.title, onNext]);

  const pct = np.durationMs ? Math.min(100, (progress / np.durationMs) * 100) : 0;

  return (
    <div className="rounded-xl bg-gradient-to-b from-[#1f1f1f] to-[#121212] p-4">
      <div className="flex items-center gap-4">
        <div className="relative">
          <AlbumThumb art={np.albumArt} size="lg" />
          {/* equalizer overlay when playing (decoupled from OS reduce-motion) */}
          {np.isPlaying ? (
            <div className="absolute bottom-1.5 left-1.5 flex items-end gap-[2px]">
              {[0.5, 0.9, 0.6, 1].map((h, i) => (
                <span
                  key={i}
                  className="w-[3px] rounded-full bg-spotify"
                  style={{
                    height: 14,
                    transformOrigin: "bottom",
                    transform: delight ? undefined : `scaleY(${h})`,
                    animation: delight
                      ? `eq-bounce ${0.7 + i * 0.18}s ease-in-out infinite`
                      : undefined,
                  }}
                />
              ))}
            </div>
          ) : null}
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-[0.6rem] font-semibold uppercase tracking-wider text-spotify">
            {np.isPlaying ? "Now playing" : "Paused"}
          </p>
          <a
            href={np.url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-0.5 block truncate text-base font-bold text-white hover:underline"
          >
            {np.title}
          </a>
          <p className="truncate text-sm text-[#b3b3b3]">{np.artist}</p>
        </div>
      </div>

      {/* progress */}
      <div className="mt-3">
        <div className="h-1 overflow-hidden rounded-full bg-white/15">
          <div
            className="h-full rounded-full bg-white"
            style={{ width: `${pct}%`, transition: "width 0.1s linear" }}
          />
        </div>
        <div className="mt-1 flex justify-between font-mono text-[0.6rem] text-[#b3b3b3]">
          <span>{fmt(progress)}</span>
          <span>{fmt(np.durationMs)}</span>
        </div>
      </div>

      {/* controls — functional */}
      <div className="mt-2 flex items-center justify-center gap-5 text-[#b3b3b3]">
        <button
          type="button"
          aria-label="Previous"
          onClick={onPrev}
          className="transition-transform hover:text-white active:scale-90"
        >
          <SkipBack className="size-4 fill-current" />
        </button>
        <button
          type="button"
          aria-label={np.isPlaying ? "Pause" : "Play"}
          onClick={onTogglePlay}
          className="grid size-9 place-items-center rounded-full bg-white text-black transition-transform hover:scale-105 active:scale-95"
        >
          {np.isPlaying ? (
            <Pause className="size-4 fill-current" />
          ) : (
            <Play className="size-4 fill-current" />
          )}
        </button>
        <button
          type="button"
          aria-label="Next"
          onClick={onNext}
          className="transition-transform hover:text-white active:scale-90"
        >
          <SkipForward className="size-4 fill-current" />
        </button>
      </div>
    </div>
  );
}

function AlbumThumb({
  art,
  size,
}: {
  art: string | null;
  size: "sm" | "lg";
}) {
  const cls = size === "lg" ? "size-20 rounded-lg" : "size-9 rounded";
  if (art) {
    return (
      <img
        src={art}
        alt=""
        className={`${cls} shrink-0 object-cover`}
        loading="lazy"
      />
    );
  }
  return (
    <div
      className={`${cls} grid shrink-0 place-items-center bg-gradient-to-br from-[#404040] to-[#181818]`}
    >
      <SpotifyGlyph className={size === "lg" ? "size-8 text-spotify/70" : "size-4 text-spotify/70"} />
    </div>
  );
}

import { useEffect, useState } from "react";
import { ExternalLink } from "lucide-react";
import { SpotifyGlyph } from "../os/brandIcons";

/* ------------------------------------------------------------------ *
 * Spotify app — real Spotify dark look (#121212 bg, #1DB954 accent).
 * Fetches /api/spotify for the live now-playing + top tracks, and embeds the
 * official Spotify player (a 30s preview for logged-out visitors, the full
 * track for logged-in ones). Clicking any track loads it into the player.
 * Falls back to a clean MOCK (no player) before credentials are configured.
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
  _mock?: boolean;
}

const PROFILE_URL = "https://open.spotify.com/user/davelgans";

const MOCK: SpotifyPayload = {
  nowPlaying: null,
  topTracks: [
    { title: "Midnight City", artist: "M83", album: "Hurry Up, We're Dreaming", albumArt: null, url: PROFILE_URL },
    { title: "A Walk", artist: "Tycho", album: "Dive", albumArt: null, url: PROFILE_URL },
    { title: "Nightcall", artist: "Kavinsky", album: "OutRun", albumArt: null, url: PROFILE_URL },
    { title: "Open Eye Signal", artist: "Jon Hopkins", album: "Immunity", albumArt: null, url: PROFILE_URL },
    { title: "Spaceship", artist: "Tycho", album: "Weather", albumArt: null, url: PROFILE_URL },
  ],
  _mock: true,
};

/** Extract a 22-char Spotify track id from a track URL. */
function trackId(url: string): string | null {
  const m = url.match(/track\/([A-Za-z0-9]{22})/);
  return m ? m[1] : null;
}

export function Spotify() {
  const [data, setData] = useState<SpotifyPayload>(MOCK);
  const [usingMock, setUsingMock] = useState(true);
  const [selectedUrl, setSelectedUrl] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    (async () => {
      try {
        const res = await fetch("/api/spotify", { signal: controller.signal });
        if (!res.ok) throw new Error(String(res.status));
        const json = (await res.json()) as SpotifyPayload;
        if (!active) return;
        if (json._mock || (!json.nowPlaying && !(json.topTracks && json.topTracks.length))) return;
        setData(json);
        setUsingMock(false);
      } catch {
        // keep the mock — expected before credentials exist
      }
    })();
    return () => {
      active = false;
      controller.abort();
    };
  }, []);

  const featuredUrl = selectedUrl ?? data.nowPlaying?.url ?? data.topTracks[0]?.url ?? null;
  const id = featuredUrl ? trackId(featuredUrl) : null;
  const isLiveNow = !!data.nowPlaying && featuredUrl === data.nowPlaying.url;

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
        {/* featured / now-playing — the REAL, playable Spotify embed */}
        {id ? (
          <>
            <p className="mb-2 text-[0.6rem] font-semibold uppercase tracking-wider text-spotify">
              {isLiveNow
                ? data.nowPlaying?.isPlaying
                  ? "● Now playing"
                  : "Last played"
                : "Featured"}
            </p>
            <iframe
              key={id}
              title="Spotify player"
              src={`https://open.spotify.com/embed/track/${id}?utm_source=generator`}
              width="100%"
              height="152"
              style={{ borderRadius: 12, border: 0 }}
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
              loading="lazy"
            />
          </>
        ) : (
          <div className="rounded-xl bg-gradient-to-b from-[#1f1f1f] to-[#121212] p-5 text-center text-sm text-[#b3b3b3]">
            The player goes live once Spotify is connected.
          </div>
        )}

        {/* top tracks — click to load into the player */}
        <p className="mb-2 mt-5 text-xs font-semibold uppercase tracking-wide text-[#b3b3b3]">
          Top tracks this month
        </p>
        <ol className="space-y-0.5">
          {data.topTracks.map((t, i) => {
            const isCurrent = featuredUrl === t.url;
            const playable = !!trackId(t.url);
            return (
              <li key={`${t.title}-${i}`}>
                <button
                  type="button"
                  onClick={() => playable && setSelectedUrl(t.url)}
                  className={cnRow(isCurrent, playable)}
                  title={playable ? "Play in the player above" : undefined}
                >
                  <span
                    className={
                      "w-4 text-right text-xs " +
                      (isCurrent ? "text-spotify" : "text-[#b3b3b3] group-hover:text-white")
                    }
                  >
                    {isCurrent ? "♪" : i + 1}
                  </span>
                  <AlbumThumb art={t.albumArt} size="sm" />
                  <span className="min-w-0 flex-1 text-left">
                    <span
                      className={
                        "block truncate text-sm " + (isCurrent ? "text-spotify" : "text-white")
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
          {usingMock ? "// mock — connect Spotify to go live" : "// live · tap a track to play it ▶"}
        </p>
      </div>
    </div>
  );
}

function cnRow(isCurrent: boolean, playable: boolean): string {
  return (
    "group flex w-full items-center gap-3 rounded-md px-2 py-1.5 text-left transition-colors hover:bg-white/5 active:bg-white/10 " +
    (isCurrent ? "bg-white/[0.06] " : "") +
    (playable ? "" : "cursor-default")
  );
}

function AlbumThumb({ art, size }: { art: string | null; size: "sm" | "lg" }) {
  const cls = size === "lg" ? "size-20 rounded-lg" : "size-9 rounded";
  if (art) {
    return <img src={art} alt="" className={`${cls} shrink-0 object-cover`} loading="lazy" />;
  }
  return (
    <div className={`${cls} grid shrink-0 place-items-center bg-gradient-to-br from-[#404040] to-[#181818]`}>
      <SpotifyGlyph className={size === "lg" ? "size-8 text-spotify/70" : "size-4 text-spotify/70"} />
    </div>
  );
}

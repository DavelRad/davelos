/**
 * /api/spotify — Vercel serverless function.
 *
 * Returns Davel's Spotify now-playing + top tracks as sanitized JSON:
 *   { nowPlaying: NowPlaying | null, topTracks: Track[] }
 *
 * Auth flow (Authorization Code w/ refresh token):
 *   1. Reads env: SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET, SPOTIFY_REFRESH_TOKEN
 *   2. Exchanges the refresh token for a short-lived access token via
 *      POST https://accounts.spotify.com/api/token (grant_type=refresh_token,
 *      Authorization: Basic base64(client_id:client_secret)).
 *   3. Calls:
 *        GET /v1/me/player/currently-playing  (204 => nothing playing => null)
 *        GET /v1/me/top/tracks?limit=5
 *
 * If the env vars are MISSING, it returns a documented MOCK payload so the app
 * keeps working before credentials are configured.
 *
 * Local dev: `vercel dev` runs this function at http://localhost:3000/api/spotify
 * (the Vite dev server alone will NOT serve /api — use `vercel dev`).
 * Required scopes when minting the refresh token:
 *   user-read-currently-playing, user-read-recently-played, user-top-read
 */

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

interface Payload {
  nowPlaying: NowPlaying | null;
  topTracks: Track[];
}

const TOKEN_URL = "https://accounts.spotify.com/api/token";
const NOW_PLAYING_URL = "https://api.spotify.com/v1/me/player/currently-playing";
const TOP_TRACKS_URL = "https://api.spotify.com/v1/me/top/tracks?limit=5";
const PROFILE_URL = "https://open.spotify.com/user/davelgans";

/** Documented mock used when env vars are absent. */
const MOCK: Payload = {
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

// Minimal shapes for the bits of the Spotify API we read.
interface SpotifyArtist {
  name: string;
}
interface SpotifyImage {
  url: string;
}
interface SpotifyTrack {
  name: string;
  artists: SpotifyArtist[];
  album: { name: string; images: SpotifyImage[] };
  external_urls: { spotify: string };
  duration_ms: number;
}

function mapTrack(t: SpotifyTrack): Track {
  return {
    title: t.name,
    artist: t.artists.map((a) => a.name).join(", "),
    album: t.album?.name ?? "",
    albumArt: t.album?.images?.[0]?.url ?? null,
    url: t.external_urls?.spotify ?? PROFILE_URL,
  };
}

async function getAccessToken(
  clientId: string,
  clientSecret: string,
  refreshToken: string,
): Promise<string> {
  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  });
  if (!res.ok) throw new Error(`token exchange failed: ${res.status}`);
  const json = (await res.json()) as { access_token: string };
  return json.access_token;
}

async function getNowPlaying(token: string): Promise<NowPlaying | null> {
  const res = await fetch(NOW_PLAYING_URL, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (res.status === 204 || res.status > 400) return null; // nothing playing
  const json = (await res.json()) as {
    is_playing: boolean;
    progress_ms: number;
    item: SpotifyTrack | null;
  };
  if (!json.item) return null;
  return {
    ...mapTrack(json.item),
    isPlaying: json.is_playing,
    progressMs: json.progress_ms ?? 0,
    durationMs: json.item.duration_ms ?? 0,
  };
}

async function getTopTracks(token: string): Promise<Track[]> {
  const res = await fetch(TOP_TRACKS_URL, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return [];
  const json = (await res.json()) as { items: SpotifyTrack[] };
  return (json.items ?? []).map(mapTrack);
}

// Vercel Node function (req/res). Typed loosely to avoid a build-time dep on
// @vercel/node — this file is only invoked by the Vercel runtime / `vercel dev`.
export default async function handler(
  _req: { method?: string },
  res: {
    setHeader: (k: string, v: string) => void;
    status: (c: number) => { json: (b: unknown) => void };
  },
): Promise<void> {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  const refreshToken = process.env.SPOTIFY_REFRESH_TOKEN;

  // cache at the edge for 60s, allow stale-while-revalidate for 5m
  res.setHeader(
    "Cache-Control",
    "public, s-maxage=60, stale-while-revalidate=300",
  );

  // No credentials configured yet → serve the documented mock.
  if (!clientId || !clientSecret || !refreshToken) {
    res.status(200).json({ ...MOCK, _mock: true });
    return;
  }

  try {
    const token = await getAccessToken(clientId, clientSecret, refreshToken);
    const [nowPlaying, topTracks] = await Promise.all([
      getNowPlaying(token),
      getTopTracks(token),
    ]);
    const payload: Payload = { nowPlaying, topTracks };
    res.status(200).json(payload);
  } catch (err) {
    // On any upstream failure, degrade gracefully to the mock (client also
    // falls back, but returning 200 keeps the UX clean).
    res.status(200).json({ ...MOCK, _mock: true, _error: String(err) });
  }
}

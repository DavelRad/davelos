# davelOS — Davel Radindra's Portfolio

An interactive **macOS-inspired desktop environment** that presents Davel
Radindra's portfolio as a developer's workspace: an **Obsidian vault** of
interlinked notes (the primary "read about Davel" reader), a Claude Code
terminal, a Spotify app (with a real data path), a **Startup** app (Nogic /
Founders Inc / a YC tool report), plus a magnifying dock, Spotlight (⌘K), and a
draggable window manager. GitHub is an honest outbound link to the real profile.

The **OS chrome is neutral** (translucent grays, like real macOS); each **app
wears its real product's colors** — Obsidian purple, Claude's clay, Spotify
green, VS Code blue, YC orange.

## Stack

- **Vite + React 18 + TypeScript** (strict)
- **Tailwind CSS v4** via `@tailwindcss/vite` (`@import "tailwindcss";`)
- **Framer Motion** (window springs, dock magnification, transitions)
- **react-markdown + remark-gfm + rehype-highlight** for the GitHub repo render
- **lucide-react** icons, **clsx**
- Type: **Clash Display** + **General Sans** (Fontshare), **JetBrains Mono** (Google)

## Run

Frontend:

```bash
npm install
npm run dev      # Vite dev server (port 5173); /api is proxied to localhost:8080
npm run build    # type-check (tsc -b) + production build
npm run preview  # preview the production build
```

Backend (the "Ask Davel" bot + Spotify), for the full experience locally:

```bash
cd server
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
export ANTHROPIC_API_KEY=sk-ant-...        # omit to run the bot in offline mode
uvicorn main:app --port 8080 --reload
```

With both running, the terminal streams real answers; without the backend (or
without a key) it falls back to built-in canned answers, so dev never breaks.

**Deployment is on GCP** — a **single Cloud Run service** (`davelos`) whose
multi-stage `Dockerfile` builds the SPA, then serves the static site *and*
`/api/*` from one FastAPI process (one origin, no CORS). Live at
<https://davelos-630783796094.us-central1.run.app> (davelradindra.com pending
DNS). See **[DEPLOY.md](./DEPLOY.md)** for the runbook.
(`vercel.json` / `api/spotify.ts` remain as an alternative all-Vercel path,
superseded by `server/`.)

## Architecture

- **Windowed desktop.** `src/os/` holds the OS: a `useWindowManager` reducer
  (open / focus / minimize / maximize / move / resize, z-ordering), the menu
  bar, magnifying `Dock`, draggable `Window` (with working traffic lights),
  `Spotlight` (⌘K / ⌘Space), `Wallpaper`, and a `MobileShell` fallback.
- **Apps** live in `src/apps/`: `Obsidian`, `ClaudeTerminal`, `Spotify`,
  `Startup`, `Notes`, `AboutEditor`, `Mail`, `Settings`, `Preview`. GitHub is a
  link-only dock entry (opens `github.com/DavelRad` in a new tab — no window).
- **Obsidian vault.** `src/data/vault.ts` holds the notes (Davel / Work /
  Projects folders) with `[[wikilinks]]`; the app has a file explorer, reading
  view (reuses the markdown pipeline), outline/backlinks panel, and a knowledge
  **Graph View** built from the wikilinks. No contribution graph.
- **Boot layout.** After a short skippable flash, the desktop opens a lived-in
  layout: Spotify / Startup / Notes behind, with Obsidian (left) + Claude Code
  (right) in front as the focused split.
- **Single source of truth.** Profile content is typed in `src/data/profile.ts`;
  vault notes live in `src/data/vault.ts`; the Claude-terminal `ls`/`cat`
  fixtures still use `src/data/repo.ts`.
- **Photos.** The Startup app uses `<PhotoSlot name="…" />`, which loads
  `/public/photos/<name>.jpg` and shows a labeled placeholder when missing.
  Drop real photos in `public/photos/` (used names: `nogic-team`,
  `founders-inc-campus`, `founders-inc-demo`).
- **Theme.** Neutral dark default + light, persisted to `localStorage`,
  respects `prefers-color-scheme`. CSS variables → Tailwind v4 via `@theme
  inline`. The OS uses a neutral system accent; brand colors are scoped to apps.
- **Claude Code terminal (the "Ask Davel" bot).** Streams real, grounded answers
  from the FastAPI backend (`server/`) — Claude Haiku with the bio prompt-cached,
  rate-limited per IP + globally. The deterministic keyword router
  (`src/apps/terminalEngine.ts`) provides the tool-call flavor lines and doubles
  as the **offline fallback** when no backend/API key is present.
- **Accessibility.** Focus-visible states, ARIA live region for the terminal,
  full `prefers-reduced-motion` support (magnification / streaming / springs →
  instant), and a mobile fallback (full-screen apps + bottom app switcher).

## Ask Davel bot (`server/`)

A **FastAPI service on Cloud Run** answers questions about Davel:

- `POST /api/ask` — streams (SSE) a grounded answer from **Claude Haiku**. The
  knowledge base is `server/davel_context.md` (compiled from the vault), sent as
  a **prompt-cached** system block (~90% cheaper input on repeats). Speaks in the
  first person as Davel; refuses off-topic asks and prompt-injection.
- **Rate limiting** (`server/ratelimit.py`): per-IP sliding window + per-IP daily
  cap + a **global daily ceiling** so a traffic spike can't drain the API budget.
- `GET /api/spotify` — now-playing + top tracks (ported from the old Vercel fn).
- `GET /api/health` — liveness + whether the API key is wired.

No key configured → `/api/ask` returns an `offline` event and the front end uses
its canned answers, so the whole site deploys and works *before* the key exists.

## Spotify integration

The Spotify app fetches `/api/spotify` (served by the FastAPI backend); if that
fails or returns no data it falls back to a clean local mock, so dev works before
credentials exist. (`api/spotify.ts` is the equivalent Vercel function, kept for
the alternative all-Vercel deploy path.)

### 1. Create a Spotify app

1. Go to <https://developer.spotify.com/dashboard> and **Create app**.
2. Add a **Redirect URI** (any URL you control works for the one-time token
   mint), e.g. `http://localhost:3000/callback`.
3. Note the **Client ID** and **Client Secret**.

### 2. Mint a refresh token (one time)

Authorize with these **scopes**:

```
user-read-currently-playing user-read-recently-played user-top-read
```

- Visit the authorize URL (replace `CLIENT_ID` / `REDIRECT_URI`):
  ```
  https://accounts.spotify.com/authorize?client_id=CLIENT_ID&response_type=code&redirect_uri=REDIRECT_URI&scope=user-read-currently-playing%20user-read-recently-played%20user-top-read
  ```
- Grab the `?code=...` from the redirect, then exchange it for tokens:
  ```bash
  curl -X POST https://accounts.spotify.com/api/token \
    -H "Authorization: Basic $(printf '%s:%s' CLIENT_ID CLIENT_SECRET | base64)" \
    -d grant_type=authorization_code \
    -d code=THE_CODE \
    -d redirect_uri=REDIRECT_URI
  ```
- Save the `refresh_token` from the response.

### 3. Set the three env vars

Locally (`.env.local`) and in **Vercel → Project → Settings → Environment
Variables**:

```
SPOTIFY_CLIENT_ID=...
SPOTIFY_CLIENT_SECRET=...
SPOTIFY_REFRESH_TOKEN=...
```

With those set, `api/spotify.ts` exchanges the refresh token for an access
token and returns `{ nowPlaying, topTracks }`. Without them, it returns a
documented mock. Run `vercel dev` to exercise the function locally (the plain
Vite dev server does not serve `/api`).

## Notes

- The X/Twitter link is a placeholder (`https://x.com/`) pending the real handle
  — see the `// TODO` in `src/data/profile.ts`.
- GitHub follower/repo stats are fetched live (unauthenticated); on
  offline/rate-limit they fall back to a labeled static identity. Stars/forks
  and the contribution graph are illustrative.
- The Paxel report reproduces real output from Paxel (a Y Combinator tool) that
  analyzed Davel's Claude Code usage.

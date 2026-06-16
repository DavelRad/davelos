# davelOS

My portfolio, except it's a macOS desktop you can actually use.

### → [davelradindra.com](https://davelradindra.com)

Most portfolios are a page you scroll. This one is a workspace you pilot — boot
it up, open windows, drag them around, poke at the apps. It's how I'd rather show
my work: operable software, not a brochure.

## What's inside

- **Obsidian** — my work as a vault of interlinked notes: who I am, what I'm
  shipping, every project, with diagrams and demos.
- **Claude Code** — an *"Ask Davel"* terminal. Ask it anything about me; it
  answers from a real, grounded knowledge base (streaming, rate-limited, no
  hallucinating).
- **Photos** — albums from CalHacks, Founders Inc, Fetch.ai, and life — every
  shot captioned.
- **Startup** — the founder journey: Nogic, Founders Inc, and my actual Y
  Combinator report.
- **Spotify** — what I'm really listening to, live.
- …plus a magnifying dock, Spotlight (⌘K), and a window manager that behaves.

## How it's built

- **Frontend** — Vite + React + TypeScript + Tailwind v4 + Framer Motion. A real
  window manager, dock magnification, and the macOS-Tahoe "liquid glass" look —
  built from my actual Mac's wallpaper and app icons.
- **Backend** — a FastAPI service on **Google Cloud Run** that powers the Ask
  Davel bot (Claude Haiku, prompt-cached, per-IP + global rate limits) and the
  Spotify feed. Site and API are one Cloud Run service behind davelradindra.com.

## Running it

You don't — it's a live site, not a template. Just visit
**[davelradindra.com](https://davelradindra.com)**. *(Curious how it's wired?
It's all in here, and [DEPLOY.md](./DEPLOY.md) tells the deploy story.)*

---

Built by **Davel Radindra** — software engineer & co-founder, San Francisco.
Say hi: [davel.radindra2@gmail.com](mailto:davel.radindra2@gmail.com)

"""
"Ask Davel" backend — FastAPI on Google Cloud Run.

Endpoints
  GET  /api/health   -> liveness probe
  POST /api/ask      -> streaming (SSE) answer from Claude, grounded in the
                        Davel knowledge base, rate-limited per IP + globally.
  GET  /api/spotify  -> Davel's now-playing + top tracks (ported from the old
                        Vercel function so everything lives in one service).

The whole thing is fronted by Firebase Hosting, which rewrites `/api/**` to this
Cloud Run service — so to the browser it's all one origin (davelradindra.com).

Anthropic prompt-caching is applied to the (large, static) system prompt, so
repeat questions cost ~90% less on input tokens. If ANTHROPIC_API_KEY is unset,
/api/ask returns an `offline` event and the front end falls back to its built-in
canned answers — so the site is fully deployable before the key exists.
"""
from __future__ import annotations

import json
import os
from typing import Any, AsyncIterator

import httpx
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse

from knowledge import system_prompt
from ratelimit import Limits, RateLimiter

# ----------------------------- configuration ------------------------------ #
MODEL = os.environ.get("ANTHROPIC_MODEL", "claude-haiku-4-5")
MAX_TOKENS = int(os.environ.get("ASK_MAX_TOKENS", "512"))
MAX_MSG_CHARS = 2_000          # per message
MAX_MESSAGES = 16              # keep only the last N turns of context
MAX_TOTAL_CHARS = 8_000        # across the whole conversation

limiter = RateLimiter(
    Limits(
        per_ip_window_seconds=int(os.environ.get("RL_WINDOW", "30")),
        per_ip_in_window=int(os.environ.get("RL_BURST", "6")),
        per_ip_per_day=int(os.environ.get("RL_IP_DAY", "50")),
        global_per_day=int(os.environ.get("RL_GLOBAL_DAY", "1000")),
    )
)

app = FastAPI(title="Ask Davel", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=(
        r"^https?://(localhost|127\.0\.0\.1)(:\d+)?$"
        r"|^https://([a-z0-9-]+\.)*(davelradindra\.com|web\.app|firebaseapp\.com|run\.app)$"
    ),
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type"],
)


# ------------------------------- helpers ---------------------------------- #
def client_ip(req: Request) -> str:
    """Real client IP. Cloud Run sets X-Forwarded-For: <client>, <proxy...>."""
    xff = req.headers.get("x-forwarded-for")
    if xff:
        return xff.split(",")[0].strip()
    return req.client.host if req.client else "unknown"


def sse(event: dict[str, Any]) -> str:
    return f"data: {json.dumps(event, ensure_ascii=False)}\n\n"


def sanitize(raw_messages: Any) -> list[dict[str, str]] | None:
    """Validate + clamp the client-supplied conversation. Returns None if invalid."""
    if not isinstance(raw_messages, list) or not raw_messages:
        return None
    out: list[dict[str, str]] = []
    total = 0
    for m in raw_messages[-MAX_MESSAGES:]:
        if not isinstance(m, dict):
            continue
        role = m.get("role")
        content = m.get("content")
        if role not in ("user", "assistant") or not isinstance(content, str):
            continue
        content = content.strip()[:MAX_MSG_CHARS]
        if not content:
            continue
        total += len(content)
        out.append({"role": role, "content": content})
    if not out or out[-1]["role"] != "user" or total > MAX_TOTAL_CHARS:
        return None
    return out


# -------------------------------- /ask ------------------------------------ #
async def stream_answer(messages: list[dict[str, str]]) -> AsyncIterator[str]:
    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        # No key yet -> tell the client to use its built-in offline answer.
        yield sse({"type": "offline"})
        yield sse({"type": "done"})
        return

    try:
        from anthropic import AsyncAnthropic
    except ImportError:
        yield sse({"type": "error", "message": "sdk_missing"})
        yield sse({"type": "done"})
        return

    client = AsyncAnthropic(api_key=api_key)
    try:
        async with client.messages.stream(
            model=MODEL,
            max_tokens=MAX_TOKENS,
            system=[
                {
                    "type": "text",
                    "text": system_prompt(),
                    "cache_control": {"type": "ephemeral"},
                }
            ],
            messages=messages,
        ) as stream:
            async for text in stream.text_stream:
                if text:
                    yield sse({"type": "delta", "text": text})
        yield sse({"type": "done"})
    except Exception as err:  # degrade gracefully; client falls back to canned
        yield sse({"type": "error", "message": type(err).__name__})
        yield sse({"type": "done"})
    finally:
        await client.close()


@app.post("/api/ask")
async def ask(req: Request) -> Any:
    try:
        body = await req.json()
    except Exception:
        return JSONResponse({"error": "bad_json"}, status_code=400)

    messages = sanitize(body.get("messages"))
    if messages is None:
        return JSONResponse({"error": "bad_request"}, status_code=400)

    decision = limiter.check(client_ip(req))
    if not decision.allowed:
        return JSONResponse(
            {"error": "rate_limited", "reason": decision.reason,
             "retry_after": decision.retry_after},
            status_code=429,
            headers={"Retry-After": str(decision.retry_after)},
        )

    return StreamingResponse(
        stream_answer(messages),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache, no-transform",
            "X-Accel-Buffering": "no",
            "Connection": "keep-alive",
        },
    )


# ------------------------------ /spotify ---------------------------------- #
TOKEN_URL = "https://accounts.spotify.com/api/token"
NOW_PLAYING_URL = "https://api.spotify.com/v1/me/player/currently-playing"
TOP_TRACKS_URL = "https://api.spotify.com/v1/me/top/tracks?limit=5"
PROFILE_URL = "https://open.spotify.com/user/davelgans"

_MOCK = {
    "nowPlaying": {
        "title": "Glue", "artist": "bibio", "album": "Ambivalence Avenue",
        "albumArt": None, "url": PROFILE_URL, "isPlaying": True,
        "progressMs": 84_000, "durationMs": 213_000,
    },
    "topTracks": [
        {"title": "Midnight City", "artist": "M83", "album": "Hurry Up, We're Dreaming", "albumArt": None, "url": PROFILE_URL},
        {"title": "A Walk", "artist": "Tycho", "album": "Dive", "albumArt": None, "url": PROFILE_URL},
        {"title": "Nightcall", "artist": "Kavinsky", "album": "OutRun", "albumArt": None, "url": PROFILE_URL},
        {"title": "Open Eye Signal", "artist": "Jon Hopkins", "album": "Immunity", "albumArt": None, "url": PROFILE_URL},
        {"title": "Spaceship", "artist": "Tycho", "album": "Weather", "albumArt": None, "url": PROFILE_URL},
    ],
    "_mock": True,
}


def _map_track(t: dict[str, Any]) -> dict[str, Any]:
    album = t.get("album") or {}
    images = album.get("images") or []
    return {
        "title": t.get("name", ""),
        "artist": ", ".join(a.get("name", "") for a in t.get("artists", [])),
        "album": album.get("name", ""),
        "albumArt": images[0]["url"] if images else None,
        "url": (t.get("external_urls") or {}).get("spotify", PROFILE_URL),
    }


@app.get("/api/spotify")
async def spotify() -> Any:
    cid = os.environ.get("SPOTIFY_CLIENT_ID")
    secret = os.environ.get("SPOTIFY_CLIENT_SECRET")
    refresh = os.environ.get("SPOTIFY_REFRESH_TOKEN")
    headers = {"Cache-Control": "public, s-maxage=60, stale-while-revalidate=300"}

    if not (cid and secret and refresh):
        return JSONResponse(_MOCK, headers=headers)

    try:
        async with httpx.AsyncClient(timeout=8.0) as http:
            tok = await http.post(
                TOKEN_URL,
                auth=(cid, secret),
                data={"grant_type": "refresh_token", "refresh_token": refresh},
            )
            tok.raise_for_status()
            access = tok.json()["access_token"]
            auth = {"Authorization": f"Bearer {access}"}

            now_res, top_res = None, None
            np = await http.get(NOW_PLAYING_URL, headers=auth)
            if np.status_code == 200 and np.content:
                j = np.json()
                if j.get("item"):
                    now_res = {**_map_track(j["item"]),
                               "isPlaying": j.get("is_playing", False),
                               "progressMs": j.get("progress_ms", 0),
                               "durationMs": j["item"].get("duration_ms", 0)}
            tp = await http.get(TOP_TRACKS_URL, headers=auth)
            if tp.status_code == 200:
                top_res = [_map_track(x) for x in tp.json().get("items", [])]

        return JSONResponse(
            {"nowPlaying": now_res, "topTracks": top_res or []}, headers=headers
        )
    except Exception as err:
        return JSONResponse({**_MOCK, "_error": str(err)}, headers=headers)


# ------------------------------- /health ---------------------------------- #
@app.get("/api/health")
async def health() -> dict[str, Any]:
    return {"status": "ok", "model": MODEL, "ask_enabled": bool(os.environ.get("ANTHROPIC_API_KEY"))}

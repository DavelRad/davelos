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
import time
import uuid
from typing import Any, AsyncIterator

import httpx
from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import (
    FileResponse,
    JSONResponse,
    PlainTextResponse,
    StreamingResponse,
)

from knowledge import system_prompt
from ratelimit import Limits, RateLimiter
from telemetry import A_CAP, LOG_ANSWERS, Q_CAP, clip, emit, ip_hash

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

# Usage events (/api/event) are higher-frequency and cheap, so they get their own
# looser limiter. Its only job is to stop someone from flooding the logs (and any
# downstream BigQuery sink) — over the cap, events are dropped silently.
event_limiter = RateLimiter(
    Limits(
        per_ip_window_seconds=10,
        per_ip_in_window=40,
        per_ip_per_day=3000,
        global_per_day=100_000,
    )
)

# Only these anonymous frontend events are accepted; anything else is ignored.
ALLOWED_EVENTS = {
    "session_start",
    "app_open",
    "resume_view",
    "spotlight_open",
    "github_open",
    "contact_click",
    "copy_email",
    "external_link",
}
MAX_EVENTS_PER_REQ = 20
MAX_PROPS_CHARS = 1_000

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
async def stream_answer(
    messages: list[dict[str, str]], meta: dict[str, Any]
) -> AsyncIterator[str]:
    t0 = meta["t0"]
    answer_parts: list[str] = []
    ttfb_ms: int | None = None
    logged = False

    def _log(outcome: str, **extra: Any) -> None:
        """Emit exactly one structured log line for this /api/ask request."""
        nonlocal logged
        if logged:
            return
        logged = True
        emit({
            "event": "ask",
            "req_id": meta["req_id"],
            "outcome": outcome,
            "model": MODEL,
            "question": clip(meta["question"], Q_CAP),
            "n_prior": meta["n_prior"],
            "ip_hash": meta["ip_hash"],
            "ua": meta["ua"],
            "sid": meta["sid"],
            "latency_ms": round((time.perf_counter() - t0) * 1000),
            **extra,
        })

    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        # No key yet -> tell the client to use its built-in offline answer.
        yield sse({"type": "offline"})
        yield sse({"type": "done"})
        _log("offline")
        return

    try:
        from anthropic import AsyncAnthropic
    except ImportError:
        yield sse({"type": "error", "message": "sdk_missing"})
        yield sse({"type": "done"})
        _log("error", error="sdk_missing")
        return

    client = AsyncAnthropic(api_key=api_key)
    try:
        usage: dict[str, Any] = {}
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
                    if ttfb_ms is None:
                        ttfb_ms = round((time.perf_counter() - t0) * 1000)
                    answer_parts.append(text)
                    yield sse({"type": "delta", "text": text})
            # Still inside the stream context: the final message + token usage
            # (incl. prompt-cache hits) are available here.
            try:
                u = (await stream.get_final_message()).usage
                usage = {
                    "tokens_in": getattr(u, "input_tokens", None),
                    "tokens_out": getattr(u, "output_tokens", None),
                    "cache_read": getattr(u, "cache_read_input_tokens", None),
                    "cache_creation": getattr(u, "cache_creation_input_tokens", None),
                }
            except Exception:
                usage = {}
        yield sse({"type": "done"})
        answer = "".join(answer_parts)
        extra: dict[str, Any] = {"ttfb_ms": ttfb_ms, "answer_chars": len(answer), **usage}
        if LOG_ANSWERS:
            extra["answer"] = clip(answer, A_CAP)
        _log("ok", **extra)
    except Exception as err:  # degrade gracefully; client falls back to canned
        yield sse({"type": "error", "message": type(err).__name__})
        yield sse({"type": "done"})
        _log("error", error=type(err).__name__, ttfb_ms=ttfb_ms)
    finally:
        # If the client disconnected mid-stream (CancelledError), nothing above
        # logged — record a partial so the request still shows up.
        _log("client_closed", ttfb_ms=ttfb_ms,
             answer_chars=sum(len(p) for p in answer_parts))
        await client.close()


@app.post("/api/ask")
async def ask(req: Request) -> Any:
    t0 = time.perf_counter()
    ip_h = ip_hash(client_ip(req))
    ua = req.headers.get("user-agent", "")[:200]
    req_id = uuid.uuid4().hex[:8]

    try:
        body = await req.json()
    except Exception:
        emit({"event": "ask", "req_id": req_id, "outcome": "bad_json",
              "ip_hash": ip_h, "ua": ua})
        return JSONResponse({"error": "bad_json"}, status_code=400)

    messages = sanitize(body.get("messages"))
    if messages is None:
        emit({"event": "ask", "req_id": req_id, "outcome": "bad_request",
              "ip_hash": ip_h, "ua": ua})
        return JSONResponse({"error": "bad_request"}, status_code=400)

    question = messages[-1]["content"]
    sid = str(body.get("sid", ""))[:40] if isinstance(body, dict) else ""

    decision = limiter.check(client_ip(req))
    if not decision.allowed:
        emit({"event": "ask", "req_id": req_id, "outcome": "rate_limited",
              "rl_reason": decision.reason, "question": clip(question, Q_CAP),
              "n_prior": len(messages) - 1, "ip_hash": ip_h, "ua": ua, "sid": sid})
        return JSONResponse(
            {"error": "rate_limited", "reason": decision.reason,
             "retry_after": decision.retry_after},
            status_code=429,
            headers={"Retry-After": str(decision.retry_after)},
        )

    meta = {
        "req_id": req_id,
        "ip_hash": ip_h,
        "ua": ua,
        "sid": sid,
        "question": question,
        "n_prior": len(messages) - 1,
        "t0": t0,
    }
    return StreamingResponse(
        stream_answer(messages, meta),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache, no-transform",
            "X-Accel-Buffering": "no",
            "Connection": "keep-alive",
        },
    )


# ------------------------------- /event ----------------------------------- #
@app.post("/api/event")
async def event(req: Request) -> Response:
    """Anonymous, first-party usage events (app opens, etc.). Best-effort: always
    returns 204 and silently drops anything malformed, over-limit, or unknown."""
    ip = client_ip(req)
    if not event_limiter.check(ip).allowed:
        return Response(status_code=204)
    try:
        body = await req.json()
    except Exception:
        return Response(status_code=204)

    if isinstance(body, list):
        events, sid = body, ""
    elif isinstance(body, dict):
        raw = body.get("events")
        events = raw if isinstance(raw, list) else [body]
        sid = str(body.get("sid", ""))[:40]
    else:
        return Response(status_code=204)

    ip_h = ip_hash(ip)
    ua = req.headers.get("user-agent", "")[:200]
    for ev in events[:MAX_EVENTS_PER_REQ]:
        if not isinstance(ev, dict) or ev.get("name") not in ALLOWED_EVENTS:
            continue
        props = ev.get("props")
        try:
            props_str = json.dumps(props, ensure_ascii=False)[:MAX_PROPS_CHARS] if props else ""
        except (TypeError, ValueError):
            props_str = ""
        emit({
            "event": "ux",
            "name": ev["name"],
            "props": props_str,
            "sid": sid or str(ev.get("sid", ""))[:40],
            "ip_hash": ip_h,
            "ua": ua,
        })
    return Response(status_code=204)


# ----------------------------- security.txt ------------------------------- #
_SECURITY_TXT = (
    "Contact: mailto:davel.radindra2@gmail.com\n"
    "Expires: 2027-06-26T00:00:00.000Z\n"
    "Preferred-Languages: en\n"
    "Canonical: https://davelradindra.com/.well-known/security.txt\n"
)


@app.get("/.well-known/security.txt")
async def security_txt() -> Response:
    return PlainTextResponse(
        _SECURITY_TXT, headers={"Cache-Control": "public, max-age=86400"}
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


# --------------------------- static SPA (prod) ---------------------------- #
# In the container the built frontend is copied to ./static and served by this
# same service, so the whole site (UI + /api) is one Cloud Run service on one
# origin. Locally there's no ./static dir, so this is skipped and Vite serves
# the UI (proxying /api here). This catch-all is registered LAST, so the
# specific /api/* routes above always win.
_STATIC_DIR = os.path.join(os.path.dirname(__file__), "static")
if os.path.isdir(_STATIC_DIR):
    _INDEX = os.path.join(_STATIC_DIR, "index.html")

    @app.get("/{full_path:path}")
    async def spa(full_path: str) -> Any:
        if full_path.startswith("api/"):
            return JSONResponse({"error": "not_found"}, status_code=404)
        # serve a real built file if it exists (assets, icons, wallpaper, pdf),
        # else fall back to index.html for the SPA. Guard against path traversal.
        candidate = os.path.normpath(os.path.join(_STATIC_DIR, full_path))
        if (
            full_path
            and candidate.startswith(_STATIC_DIR + os.sep)
            and os.path.isfile(candidate)
            and os.path.basename(candidate) != "index.html"
        ):
            # hashed build assets are immutable; other static files cache a day
            cache = (
                "public, max-age=31536000, immutable"
                if full_path.startswith("assets/")
                else "public, max-age=86400"
            )
            return FileResponse(candidate, headers={"Cache-Control": cache})
        # the SPA shell must NOT be cached, so a refresh always loads the current
        # asset filenames (otherwise a stale index.html → 404s → blank page).
        return FileResponse(_INDEX, headers={"Cache-Control": "no-cache, must-revalidate"})

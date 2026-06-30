"""
First-party, dependency-free telemetry for davelOS.

Everything is emitted as a single JSON line to stdout, which Cloud Run ingests
into Cloud Logging as a structured `jsonPayload` — no extra service, no DB, no
third-party analytics. A log sink can fan these lines out to BigQuery for SQL
analysis (see DEPLOY.md).

Two event families share this pipeline:
  - "ask" : one line per /api/ask (question, answer, outcome, tokens, latency)
  - "ux"  : one line per anonymous frontend event from /api/event (app_open, …)

Privacy
  - Client IPs are NEVER stored raw. They're HMAC-hashed with LOG_SALT so we can
    count distinct/repeat visitors without holding PII (set a stable LOG_SALT in
    Secret Manager — see DEPLOY.md). The hash is truncated and not reversible to
    an IP in practice.
  - Chatbot text is logged ONLY here, inside your own GCP project — it is never
    sent to any third party. Answer logging is toggleable via LOG_ANSWERS.
"""
from __future__ import annotations

import hashlib
import hmac
import json
import os
import sys
from typing import Any

_SALT = os.environ.get("LOG_SALT", "").encode("utf-8")

# Truncation caps (chars) — keep log lines small and bound sensitive content.
Q_CAP = int(os.environ.get("LOG_Q_CAP", "2000"))
A_CAP = int(os.environ.get("LOG_A_CAP", "4000"))
# Log the assistant's answer text (truncated). Set LOG_ANSWERS=0 for
# questions-only logging (smaller, less content retained).
LOG_ANSWERS = os.environ.get("LOG_ANSWERS", "1") != "0"


def ip_hash(ip: str) -> str:
    """Stable, salted, truncated pseudonym for an IP — not reversible to PII."""
    if not ip:
        return "none"
    return hmac.new(_SALT, ip.encode("utf-8"), hashlib.sha256).hexdigest()[:12]


def clip(s: str | None, n: int) -> str:
    """Trim + cap a string for logging (adds an ellipsis when truncated)."""
    if not s:
        return ""
    s = s.strip()
    return s if len(s) <= n else s[:n] + "…"


def emit(payload: dict[str, Any]) -> None:
    """Write one structured log line to stdout (Cloud Logging reads `severity`)."""
    try:
        line = json.dumps({"severity": "INFO", **payload}, ensure_ascii=False)
    except (TypeError, ValueError):
        line = json.dumps({"severity": "ERROR", "event": "log_error"})
    # Best-effort and non-blocking in practice — a single buffered write.
    sys.stdout.write(line + "\n")
    sys.stdout.flush()

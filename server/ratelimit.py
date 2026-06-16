"""
In-memory rate limiting for the "Ask Davel" bot.

Two layers protect against spam and runaway API cost:
  1. Per-IP sliding window  — stops one visitor from hammering the bot.
  2. Per-IP daily cap        — bounds any single visitor over a day.
  3. Global daily cap        — a hard ceiling on total questions/day so a traffic
                               spike (or a botnet) can't drain the Anthropic budget.

This is intentionally in-memory: the Cloud Run service is deployed with
`--max-instances=1`, so a single process sees all traffic and the counters are
globally accurate while staying free (no Redis/Firestore). If the service is ever
scaled past one instance, swap this for a Firestore- or Redis-backed limiter
(the call sites only use `check()`), otherwise the caps become per-instance.
"""
import time
from collections import defaultdict, deque
from dataclasses import dataclass


@dataclass(frozen=True)
class Limits:
    per_ip_window_seconds: int = 30
    per_ip_in_window: int = 6          # max requests / window / IP
    per_ip_per_day: int = 50           # max requests / day / IP
    global_per_day: int = 1000         # hard ceiling across everyone / day


@dataclass(frozen=True)
class Decision:
    allowed: bool
    retry_after: int = 0               # seconds the client should wait
    reason: str = ""


_DAY = 86_400


class RateLimiter:
    def __init__(self, limits: Limits | None = None) -> None:
        self.limits = limits or Limits()
        # IP -> deque[timestamps] within the burst window
        self._window: dict[str, deque[float]] = defaultdict(deque)
        # IP -> (day_epoch, count)
        self._daily: dict[str, list[float]] = {}
        # (day_epoch, count) global
        self._global: list[float] = [0.0, 0.0]

    def check(self, ip: str, now: float | None = None) -> Decision:
        now = time.time() if now is None else now
        lim = self.limits
        day = now // _DAY

        # --- global daily cap ---------------------------------------------
        if self._global[0] != day:
            self._global = [day, 0.0]
        if self._global[1] >= lim.global_per_day:
            return Decision(False, retry_after=int((day + 1) * _DAY - now),
                            reason="global_daily")

        # --- per-IP daily cap ---------------------------------------------
        d = self._daily.get(ip)
        if d is None or d[0] != day:
            d = [day, 0.0]
            self._daily[ip] = d
        if d[1] >= lim.per_ip_per_day:
            return Decision(False, retry_after=int((day + 1) * _DAY - now),
                            reason="ip_daily")

        # --- per-IP sliding window ----------------------------------------
        q = self._window[ip]
        cutoff = now - lim.per_ip_window_seconds
        while q and q[0] < cutoff:
            q.popleft()
        if len(q) >= lim.per_ip_in_window:
            retry = int(q[0] + lim.per_ip_window_seconds - now) + 1
            return Decision(False, retry_after=max(1, retry), reason="ip_burst")

        # --- allowed: record it -------------------------------------------
        q.append(now)
        d[1] += 1
        self._global[1] += 1

        # opportunistic cleanup so memory doesn't grow unbounded
        if len(self._window) > 10_000:
            self._gc(cutoff)

        return Decision(True)

    def _gc(self, cutoff: float) -> None:
        dead = [ip for ip, q in self._window.items() if not q or q[-1] < cutoff]
        for ip in dead:
            self._window.pop(ip, None)

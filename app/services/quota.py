"""Plan limits + quota enforcement.

Per-plan monthly video limits come from ``Settings``. ``check_quota`` is a pure
function (easy to unit-test); the router calls it before spawning GPU work and
returns 402 when over.
"""

from __future__ import annotations

from dataclasses import dataclass

from app.config import Settings


def plan_limit(plan: str, settings: Settings) -> int:
    return {
        "free": settings.free_monthly_videos,
        "starter": settings.starter_monthly_videos,
        "pro": settings.pro_monthly_videos,
    }.get(plan, settings.free_monthly_videos)


#: Sentinel limit meaning "no cap" — local mode pays GPU time, not per video.
UNLIMITED = -1


@dataclass
class QuotaResult:
    ok: bool
    plan: str
    used: int
    limit: int

    @property
    def unlimited(self) -> bool:
        return self.limit == UNLIMITED

    @property
    def remaining(self) -> int:
        if self.unlimited:
            return UNLIMITED
        return max(0, self.limit - self.used)


def check_quota(plan: str, used_this_period: int, settings: Settings) -> QuotaResult:
    """Both /jobs and /account/usage route through here, so the local-mode
    exemption lives here rather than in each caller."""
    if settings.is_local_mode:
        return QuotaResult(ok=True, plan="local", used=used_this_period, limit=UNLIMITED)
    limit = plan_limit(plan, settings)
    return QuotaResult(ok=used_this_period < limit, plan=plan, used=used_this_period, limit=limit)

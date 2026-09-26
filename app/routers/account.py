"""Account — usage summary + GDPR data deletion."""

from __future__ import annotations

from datetime import datetime, timezone

from fastapi import APIRouter, Depends

from app.config import Settings, get_settings
from app.deps import get_current_user, get_repo
from app.services.quota import check_quota
from app.services.repo import Repo

router = APIRouter(prefix="/account", tags=["account"])


@router.get("/usage")
def usage(user=Depends(get_current_user), repo: Repo = Depends(get_repo),
          settings: Settings = Depends(get_settings)):
    period = datetime.now(timezone.utc).strftime("%Y-%m")
    sub = repo.get_subscription(user["id"])
    used = repo.get_usage(user["id"], period)
    q = check_quota(sub["plan"], used["videos_processed"], settings)
    # q.plan, not sub["plan"] — local mode reports "local", not the stored row.
    return {"plan": q.plan, "period": period,
            "videos_used": q.used, "videos_limit": q.limit, "remaining": q.remaining,
            "seconds_processed": used["seconds_processed"]}


@router.delete("")
def delete_account(user=Depends(get_current_user), repo: Repo = Depends(get_repo)):
    """GDPR erasure — delete all of the user's data."""
    deleted = repo.delete_user_data(user["id"])
    return {"deleted": deleted, "status": "erased"}

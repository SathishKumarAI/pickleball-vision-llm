"""FastAPI dependencies — current user, settings, admin guard."""

from __future__ import annotations

from typing import Any, Dict, Optional

from fastapi import Depends, Header, HTTPException, status

from app.config import LOCAL_USER, Settings, get_settings
from app.security.jwt import InvalidToken, claims_to_user, verify_supabase_jwt
from app.services.dispatch import Dispatcher, FakeDispatcher, ModalDispatcher
from app.services.repo import InMemoryRepo, Repo, SupabaseRepo
from app.services.storage import FakeStorage, Storage, SupabaseStorage

# Process-wide singletons (chosen by whether Supabase/Modal are configured).
_repo: Optional[Repo] = None
_dispatcher: Optional[Dispatcher] = None
_storage: Optional[Storage] = None


def get_repo() -> Repo:
    global _repo
    if _repo is None:
        s = get_settings()
        _repo = (SupabaseRepo(s.supabase_url, s.supabase_service_key)
                 if s.supabase_url and s.supabase_service_key else InMemoryRepo())
    return _repo


def get_dispatcher() -> Dispatcher:
    global _dispatcher
    if _dispatcher is None:
        s = get_settings()
        _dispatcher = (ModalDispatcher(s.modal_app_name, s.modal_function)
                       if s.environment != "dev" and s.supabase_url else FakeDispatcher())
    return _dispatcher


def get_storage() -> Storage:
    global _storage
    if _storage is None:
        s = get_settings()
        _storage = (SupabaseStorage(s.supabase_url, s.supabase_service_key)
                    if s.supabase_url and s.supabase_service_key else FakeStorage())
    return _storage


def reset_singletons() -> None:
    """Test helper: clear cached service singletons."""
    global _repo, _dispatcher, _storage
    _repo = _dispatcher = _storage = None


def _bearer(authorization: Optional[str]) -> Optional[str]:
    if authorization and authorization.startswith("Bearer "):
        return authorization[7:]
    return None


def get_current_user(
    authorization: Optional[str] = Header(None),
    settings: Settings = Depends(get_settings),
) -> Dict[str, Any]:
    """Verify the Supabase JWT and return the current user. 401 if missing/invalid.

    In local mode there is no auth server and exactly one user, so the check is
    skipped (RFC-004 L5). Managed mode is unchanged.
    """
    if settings.is_local_mode:
        return dict(LOCAL_USER)

    token = _bearer(authorization)
    if not token:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "authentication required")
    try:
        claims = verify_supabase_jwt(token, settings)
    except InvalidToken as e:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, f"invalid token: {e}") from e
    return claims_to_user(claims)


def require_admin(user: Dict[str, Any] = Depends(get_current_user)) -> Dict[str, Any]:
    """Guard admin-only routes."""
    if not user.get("is_admin"):
        raise HTTPException(status.HTTP_403_FORBIDDEN, "admin only")
    return user

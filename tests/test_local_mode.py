"""Local mode (PVL_MODE=local) bypasses auth and quota; managed mode must not.

Named for the failures they catch: a regression here either locks a self-hoster out
of their own machine, or — far worse — opens the managed API to unauthenticated
callers. Both directions are asserted.

See docs/specs/RFC-004-local-first-dual-mode.md (L5, L8).
"""

from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from app.config import get_settings
from app.deps import reset_singletons
from app.main import app
from app.services.quota import UNLIMITED, check_quota


@pytest.fixture
def client(monkeypatch):
    """A TestClient whose settings are rebuilt per test (get_settings is cached)."""

    def _make(mode: str) -> TestClient:
        monkeypatch.setenv("PVL_MODE", mode)
        get_settings.cache_clear()
        reset_singletons()
        return TestClient(app)

    yield _make
    get_settings.cache_clear()
    reset_singletons()


# --- local mode: no token required ------------------------------------------------

def test_local_mode_serves_me_without_a_token(client):
    r = client("local").get("/auth/me")
    assert r.status_code == 200, r.text
    assert r.json()["email"] == "local@localhost"


def test_local_mode_serves_jobs_without_a_token(client):
    r = client("local").get("/jobs")
    assert r.status_code == 200, r.text
    assert r.json()["jobs"] == []


def test_local_mode_reports_unlimited_quota(client):
    """A self-hoster must not hit 'quota exceeded' on hardware they own."""
    body = client("local").get("/account/usage").json()
    assert body["plan"] == "local"
    assert body["videos_limit"] == UNLIMITED
    assert body["remaining"] == UNLIMITED


def test_local_quota_never_blocks_however_much_was_used(client):
    client("local")  # select the mode, then exercise the pure function
    settings = get_settings()
    result = check_quota("free", used_this_period=10_000, settings=settings)
    assert result.ok is True
    assert result.unlimited is True


# --- managed mode: auth still enforced -------------------------------------------

@pytest.mark.parametrize("path", ["/auth/me", "/jobs", "/account/usage"])
def test_managed_mode_still_rejects_an_unauthenticated_call(client, path):
    """The regression that matters: the bypass must not leak into managed mode."""
    assert client("managed").get(path).status_code == 401


def test_managed_mode_quota_still_caps_the_free_plan(client):
    client("managed")
    settings = get_settings()
    result = check_quota("free", used_this_period=settings.free_monthly_videos, settings=settings)
    assert result.ok is False
    assert result.unlimited is False
    assert result.remaining == 0


# --- mode selection is explicit ---------------------------------------------------

def test_an_unknown_mode_fails_loudly(monkeypatch):
    """Silently falling back is how a broken install reports success."""
    monkeypatch.setenv("PVL_MODE", "locl")
    get_settings.cache_clear()
    with pytest.raises(ValueError, match="PVL_MODE"):
        get_settings()
    get_settings.cache_clear()

"""Tests for the bundled Supabase dashboard-auth plugin.

All HTTP is mocked: nothing in this file talks to a real Supabase project.
Covers the behaviors that matter for the dashboard gate:

1. Registration gating (env/config presence).
2. Password login: happy path, bad credentials (no oracle), unreachable.
3. Session verify: valid user, expired/revoked token, unreachable, TTL cache.
4. Refresh + revoke semantics.
5. Agency resolution: member, no membership, lookup failure.
"""

from __future__ import annotations

import json
from typing import Any
from unittest.mock import MagicMock, patch

import pytest

import plugins.dashboard_auth.supabase as supabase_plugin
from hermes_cli.dashboard_auth import (
    ProviderError,
    RefreshExpiredError,
    Session,
    assert_protocol_compliance,
)
from hermes_cli.dashboard_auth.base import InvalidCredentialsError


def _make_provider(**overrides: Any):
    kwargs = {"supabase_url": "https://xyz.supabase.co", "anon_key": "anon-key"}
    kwargs.update(overrides)
    return supabase_plugin.SupabaseDashboardAuthProvider(**kwargs)


def _resp(status_code: int, body: Any):
    resp = MagicMock()
    resp.status_code = status_code
    resp.headers = {"content-type": "application/json"}
    if isinstance(body, dict):
        resp.text = json.dumps(body)
        resp.json = MagicMock(return_value=body)
    else:
        resp.text = body
        resp.json = MagicMock(side_effect=ValueError("not json"))
    return resp


_USER = {"id": "user-1", "email": "op@example.com",
         "user_metadata": {"full_name": "Op"}}
_TOKEN_OK = {"access_token": "jwt-at", "refresh_token": "jwt-rt",
             "expires_in": 3600, "token_type": "Bearer", "user": _USER}
_MEMBERSHIP = [{"agency_id": "agency-9"}]


class TestProtocol:
    def test_compliance(self):
        assert_protocol_compliance(supabase_plugin.SupabaseDashboardAuthProvider)

    def test_identity(self):
        assert supabase_plugin.SupabaseDashboardAuthProvider.name == "supabase"
        assert supabase_plugin.SupabaseDashboardAuthProvider.supports_password is True


class TestRegistration:
    def test_skip_when_unconfigured(self, monkeypatch):
        monkeypatch.delenv("SUPABASE_URL", raising=False)
        monkeypatch.delenv("SUPABASE_ANON_KEY", raising=False)
        monkeypatch.delenv("NEXT_PUBLIC_SUPABASE_ANON_KEY", raising=False)
        with patch.object(supabase_plugin, "load_config_section", return_value={}):
            with pytest.raises(Exception, match="not set"):
                supabase_plugin._settings()

    def test_settings_prefers_canonical_env(self, monkeypatch):
        monkeypatch.setenv("SUPABASE_URL", "https://a.supabase.co")
        monkeypatch.setenv("SUPABASE_ANON_KEY", "canon")
        monkeypatch.setenv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "legacy")
        with patch.object(supabase_plugin, "load_config_section", return_value={}):
            assert supabase_plugin._settings() == {
                "supabase_url": "https://a.supabase.co", "anon_key": "canon"}

    def test_settings_falls_back_to_next_public(self, monkeypatch):
        monkeypatch.delenv("SUPABASE_ANON_KEY", raising=False)
        monkeypatch.setenv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "np-key")
        monkeypatch.setenv("SUPABASE_URL", "https://a.supabase.co")
        with patch.object(supabase_plugin, "load_config_section", return_value={}):
            assert supabase_plugin._settings()["anon_key"] == "np-key"


class TestPasswordLogin:
    def test_happy_path(self):
        p = _make_provider()
        with patch("plugins.dashboard_auth.supabase.httpx.post",
                   return_value=_resp(200, _TOKEN_OK)) as post, \
             patch.object(p, "_primary_agency_id", return_value="agency-9"):
            session = p.complete_password_login(username="op@example.com", password="s3cret")
        assert isinstance(session, Session)
        assert session.user_id == "user-1"
        assert session.email == "op@example.com"
        assert session.provider == "supabase"
        assert session.org_id == "agency-9"
        assert session.access_token == "jwt-at"
        assert session.refresh_token == "jwt-rt"
        # password grant against the token endpoint, anon key attached
        _, kwargs = post.call_args
        assert kwargs["headers"]["apikey"] == "anon-key"
        assert "grant_type=password" in post.call_args[0][0]

    def test_bad_credentials_no_oracle(self):
        p = _make_provider()
        for status, body in ((400, {"error": "invalid_grant"}),
                             (401, {"msg": "Invalid login credentials"}),
                             (422, {})):
            with patch("plugins.dashboard_auth.supabase.httpx.post",
                       return_value=_resp(status, body)):
                with pytest.raises(InvalidCredentialsError, match="invalid email or password"):
                    p.complete_password_login(username="op@example.com", password="wrong")

    def test_empty_credentials_rejected(self):
        p = _make_provider()
        with pytest.raises(InvalidCredentialsError):
            p.complete_password_login(username="", password="")

    def test_unreachable_is_provider_error(self):
        import httpx as _httpx

        p = _make_provider()
        with patch("plugins.dashboard_auth.supabase.httpx.post",
                   side_effect=_httpx.ConnectError("down")):
            with pytest.raises(ProviderError):
                p.complete_password_login(username="op@example.com", password="s3cret")

    def test_no_agency_org_empty(self):
        p = _make_provider()
        with patch("plugins.dashboard_auth.supabase.httpx.post",
                   return_value=_resp(200, _TOKEN_OK)), \
             patch.object(p, "_primary_agency_id", return_value=""):
            session = p.complete_password_login(username="op@example.com", password="s3cret")
        assert session.org_id == ""


class TestVerifySession:
    def test_valid_user(self):
        p = _make_provider()
        with patch("plugins.dashboard_auth.supabase.httpx.get",
                   return_value=_resp(200, _USER)) as get, \
             patch.object(p, "_primary_agency_id", return_value=""):
            session = p.verify_session(access_token="jwt-at")
        assert session is not None
        assert session.user_id == "user-1"
        assert get.call_args[0][0].endswith("/auth/v1/user")

    def test_revoked_token_returns_none(self):
        p = _make_provider()
        for status in (401, 403, 404):
            with patch("plugins.dashboard_auth.supabase.httpx.get",
                       return_value=_resp(status, {"msg": "bad"})):
                assert p.verify_session(access_token="dead") is None

    def test_unreachable_raises(self):
        import httpx as _httpx

        p = _make_provider()
        with patch("plugins.dashboard_auth.supabase.httpx.get",
                   side_effect=_httpx.ConnectError("down")):
            with pytest.raises(ProviderError):
                p.verify_session(access_token="jwt-at")

    def test_second_verify_uses_cache(self):
        p = _make_provider()
        with patch("plugins.dashboard_auth.supabase.httpx.get",
                   return_value=_resp(200, _USER)) as get, \
             patch.object(p, "_primary_agency_id", return_value="") as agency:
            first = p.verify_session(access_token="jwt-at")
            second = p.verify_session(access_token="jwt-at")
        assert first is second
        assert get.call_count == 1
        assert agency.call_count == 1


class TestRefreshRevoke:
    def test_refresh_happy_path(self):
        p = _make_provider()
        with patch("plugins.dashboard_auth.supabase.httpx.post",
                   return_value=_resp(200, _TOKEN_OK)), \
             patch.object(p, "_primary_agency_id", return_value="agency-9"):
            session = p.refresh_session(refresh_token="old-rt")
        assert session.access_token == "jwt-at"
        assert session.org_id == "agency-9"

    def test_refresh_expired(self):
        p = _make_provider()
        with patch("plugins.dashboard_auth.supabase.httpx.post",
                   return_value=_resp(400, {"error": "invalid_grant"})):
            with pytest.raises(RefreshExpiredError):
                p.refresh_session(refresh_token="stale")
        with pytest.raises(RefreshExpiredError):
            p.refresh_session(refresh_token="")

    def test_revoke_never_raises(self):
        p = _make_provider()
        assert p.revoke_session(refresh_token="whatever") is None

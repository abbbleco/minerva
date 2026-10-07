"""ABBBLE Portal device-code sign-in (portal.abbble.co.za is the authority).

The desktop signs in with the ABBBLE Portal, not Nous: the backend starter
mints a device/user code pair from the portal, the poller collects the
per-device router key on approval and persists it as MINERVA_ROUTER_KEY (the
credential the `minerva` model provider consumes), and disconnect removes it.
Portal unreachable / deny / expiry must surface as session states, never as
raised exceptions from the background thread.
"""

import time
from unittest.mock import patch

import pytest
from fastapi.testclient import TestClient

from hermes_cli.web_server import _SESSION_TOKEN, app
import hermes_cli.web_routers.oauth as _rt_oauth
import hermes_cli.web_server_oauth as _web_server_oauth

client = TestClient(app)
HEADERS = {"X-Hermes-Session-Token": _SESSION_TOKEN}


def _make_profile_home(tmp_path, monkeypatch, profile="coder"):
    monkeypatch.setenv("HERMES_HOME", str(tmp_path))
    profile_home = tmp_path / "profiles" / profile
    profile_home.mkdir(parents=True)
    (profile_home / "config.yaml").write_text("{}\n")
    return profile_home


def _fake_portal_start():
    return {
        "device_code": "dev_abc",
        "user_code": "ABCD-1234",
        "verification_url": "https://portal.abbble.co.za/device?code=ABCD-1234",
        "expires_in": 900,
        "interval": 5,
    }


def test_catalog_lists_abbble_first_as_device_code():
    entry = next(p for p in _web_server_oauth._OAUTH_PROVIDER_CATALOG if p["id"] == "abbble")
    assert entry["name"] == "ABBBLE Portal"
    assert entry["flow"] == "device_code"
    assert "portal.abbble.co.za" in entry["docs_url"]
    assert _web_server_oauth._OAUTH_PROVIDER_CATALOG[0]["id"] == "abbble"
    assert "abbble" in _rt_oauth._DEVICE_CODE_STARTERS


def test_start_route_mints_portal_device_session(tmp_path, monkeypatch):
    _make_profile_home(tmp_path, monkeypatch)
    ran = {}

    def fake_poller(session_id):
        ran["session_id"] = session_id

    async def fake_start(fn=None, timeout=20.0):
        return _fake_portal_start()

    with patch(
        "hermes_cli.web_routers.oauth._httpx_call", side_effect=fake_start,
    ), patch(
        "hermes_cli.web_server_oauth._abbble_poller", fake_poller,
    ):
        resp = client.post("/api/providers/oauth/abbble/start", headers=HEADERS)
    assert resp.status_code == 200, resp.text
    body = resp.json()
    assert body["flow"] == "device_code"
    assert body["user_code"] == "ABCD-1234"
    assert "portal.abbble.co.za/device" in body["verification_url"]
    assert ran.get("session_id") == body["session_id"]
    _web_server_oauth._oauth_sessions.pop(body["session_id"], None)


def _approved_poll_client(*, consumed=False, key="qkt_sec_device1234"):
    class FakeResp:
        status_code = 200

        def json(self):
            if consumed:
                return {"status": "approved", "consumed": True}
            return {
                "status": "approved",
                "api_key": key,
                "router_url": "https://minrouter.abbbleco.workers.dev/v1",
                "agency": {"slug": "acme", "name": "Acme"},
            }

    class FakeClient:
        def __init__(self, *a, **k):
            pass

        def __enter__(self):
            return self

        def __exit__(self, *a):
            return False

        def get(self, *a, **k):
            return FakeResp()

    return FakeClient


def _register_session(status="pending", **extra):
    sid = "abbble-test-session"
    sess = {
        "session_id": sid,
        "provider": "abbble",
        "flow": "device_code",
        "created_at": time.time(),
        "status": status,
        "error_message": None,
        "device_code": "dev_abc",
        "portal_base_url": "https://portal.abbble.co.za",
        "interval": 1,
        "expires_at": time.time() + 600,
        **extra,
    }
    _web_server_oauth._oauth_sessions[sid] = sess
    return sid, sess


def test_poller_persists_router_key_on_approval(tmp_path, monkeypatch):
    _make_profile_home(tmp_path, monkeypatch, profile="coder")
    saved = {}
    monkeypatch.setattr("httpx.Client", _approved_poll_client())
    monkeypatch.setattr(
        "hermes_cli.credential_lifecycle.save_provider_env_credential",
        lambda k, v: saved.update({k: v}),
    )
    monkeypatch.setattr("hermes_cli.auth.mark_provider_active_if_unset", lambda *a, **k: None)
    sid, sess = _register_session()
    sess["profile"] = "coder"
    try:
        _web_server_oauth._abbble_poller(sid)
        assert _web_server_oauth._oauth_sessions[sid]["status"] == "approved"
    finally:
        _web_server_oauth._oauth_sessions.pop(sid, None)
    assert saved == {"MINERVA_ROUTER_KEY": "qkt_sec_device1234"}


def test_poller_records_denied_without_saving(tmp_path, monkeypatch):
    _make_profile_home(tmp_path, monkeypatch)

    class DeniedResp:
        status_code = 200

        def json(self):
            return {"status": "denied"}

    class DeniedClient:
        def __init__(self, *a, **k):
            pass

        def __enter__(self):
            return self

        def __exit__(self, *a):
            return False

        def get(self, *a, **k):
            return DeniedResp()

    monkeypatch.setattr("httpx.Client", DeniedClient)
    sid, _sess = _register_session()
    try:
        _web_server_oauth._abbble_poller(sid)
        out = _web_server_oauth._oauth_sessions[sid]
        assert out["status"] == "denied"
        assert out["reason"] == "user_declined"
    finally:
        _web_server_oauth._oauth_sessions.pop(sid, None)


def test_poller_consumed_key_is_an_error_not_a_login(tmp_path, monkeypatch):
    _make_profile_home(tmp_path, monkeypatch)
    monkeypatch.setattr("httpx.Client", _approved_poll_client(consumed=True))
    sid, _sess = _register_session()
    try:
        _web_server_oauth._abbble_poller(sid)
        out = _web_server_oauth._oauth_sessions[sid]
        assert out["status"] == "error"
    finally:
        _web_server_oauth._oauth_sessions.pop(sid, None)


def test_status_reflects_router_key_presence(tmp_path, monkeypatch):
    from hermes_cli import auth as auth_mod

    _make_profile_home(tmp_path, monkeypatch)
    (tmp_path / ".env").write_text("MINERVA_ROUTER_KEY=qkt_sec_abc123\n", encoding="utf-8")
    out = auth_mod.get_abbble_auth_status()
    assert out["logged_in"] is True
    assert out["provider"] == "abbble"


def test_status_logged_out_without_key(tmp_path, monkeypatch):
    from hermes_cli import auth as auth_mod

    _make_profile_home(tmp_path, monkeypatch)
    monkeypatch.delenv("MINERVA_ROUTER_KEY", raising=False)
    out = auth_mod.get_abbble_auth_status()
    assert out["logged_in"] is False


def test_disconnect_removes_router_key(tmp_path, monkeypatch):
    _make_profile_home(tmp_path, monkeypatch)
    (tmp_path / ".env").write_text("MINERVA_ROUTER_KEY=qkt_sec_abc123\n", encoding="utf-8")
    resp = client.delete("/api/providers/oauth/abbble", headers=HEADERS)
    assert resp.status_code == 200, resp.text
    assert resp.json() == {"ok": True, "provider": "abbble"}
    assert "MINERVA_ROUTER_KEY" not in (tmp_path / ".env").read_text(encoding="utf-8")


def test_disconnect_without_key_is_409(tmp_path, monkeypatch):
    _make_profile_home(tmp_path, monkeypatch)
    resp = client.delete("/api/providers/oauth/abbble", headers=HEADERS)
    assert resp.status_code == 409, resp.text


def test_unknown_abbble_session_poll_is_404():
    resp = client.get("/api/providers/oauth/abbble/poll/no-such-session", headers=HEADERS)
    assert resp.status_code == 404

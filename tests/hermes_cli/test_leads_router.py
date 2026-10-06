"""E2E tests for the LEADS dashboard router (hermes_cli/web_routers/leads.py).

Exercises the real HTTP path — premium gate, profile scope, contact
resolution, override writes, reply validation — with a temp home. Contact
derivation itself is covered in test_leads.py (patched here); the network
boundary (platform senders) and gateway config are stubbed at their module
seams. Module-level functions only (tmp_path/monkeypatch).
"""
import contextlib
from pathlib import Path


def _isolate(tmp_path, monkeypatch):
    home = tmp_path / ".hermes"
    home.mkdir()
    monkeypatch.setattr(Path, "home", lambda: tmp_path)
    monkeypatch.setenv("HERMES_HOME", str(home))
    import hermes_cli.web_server_profiles as wsp

    @contextlib.contextmanager
    def _noop(profile=None):
        yield

    monkeypatch.setattr(wsp, "_profile_scope", _noop)
    return home


def _client(monkeypatch, subscription):
    from fastapi import FastAPI
    from fastapi.testclient import TestClient

    from hermes_cli import nous_billing
    from hermes_cli.web_routers import leads as leads_router

    monkeypatch.setattr(nous_billing, "get_subscription_state", lambda: subscription)
    app = FastAPI()
    app.include_router(leads_router.router)
    return TestClient(app)


def _paid():
    return {"logged_in": True, "current": {"tier_id": "plus"}}


def _free():
    return {"logged_in": True, "current": {"tier_id": "free"}}


def _contact(**overrides):
    contact = {
        "id": "c_abc", "display_name": "Ada", "platform": "telegram",
        "channels": [{"platform": "telegram", "chat_type": "dm", "chat_id": "424242",
                       "thread_id": None, "scope_id": None, "session_key": "k1",
                       "session_id": "sess-1", "last_active": 100.0}],
        "emails": [], "phones": [], "first_seen_at": 1.0, "last_seen_at": 100.0,
        "snippet": "Ada: hi", "snippet_at": 90.0, "unread": 1,
        "muted": False, "pinned": False, "note": "",
        "also_on": [{"contact_id": "c2", "display_name": "Example Ltd",
                     "via": "phone 424242"}],
    }
    contact.update(overrides)
    return contact


def _patch_directory(monkeypatch, contacts):
    import hermes_cli.leads as leads_mod

    by_id = {c["id"]: c for c in contacts}
    monkeypatch.setattr(leads_mod, "list_contacts",
                        lambda include_muted=False, limit=200: [
                            c for c in contacts if include_muted or not c.get("muted")][:limit])
    monkeypatch.setattr(leads_mod, "get_contact", lambda cid: by_id.get(cid))


def _patch_send(monkeypatch, *, resolve_err=None, denial=None, result=None):
    import tools.send_message_tool as send_mod

    async def fake_send(*args, **kwargs):
        calls.append((args, kwargs))
        return dict(result) if result is not None else {"success": True}

    calls = []
    monkeypatch.setattr(send_mod, "_send_to_platform", fake_send)
    monkeypatch.setattr(send_mod, "_resolve_platform_config",
                        lambda name, config: ("telegram", {"token": "x"}, None, resolve_err))
    monkeypatch.setattr(send_mod, "_authorize_relay_target", lambda *a, **k: denial)
    import gateway.config as gateway_config
    monkeypatch.setattr(gateway_config, "load_gateway_config", lambda: object())
    return calls


def test_free_tier_is_refused_with_402(tmp_path, monkeypatch):
    _isolate(tmp_path, monkeypatch)
    client = _client(monkeypatch, _free())
    assert client.get("/api/leads").status_code == 402


def test_list_and_platform_filter(tmp_path, monkeypatch):
    _isolate(tmp_path, monkeypatch)
    _patch_directory(monkeypatch, [_contact(), _contact(id="c_wa", platform="whatsapp", display_name="Bo")])
    client = _client(monkeypatch, _paid())
    assert [c["id"] for c in client.get("/api/leads").json()["contacts"]] == ["c_abc", "c_wa"]
    assert [c["id"] for c in client.get("/api/leads", params={"platform": "whatsapp"}).json()["contacts"]] == ["c_wa"]
    first = client.get("/api/leads").json()["contacts"][0]
    assert "snippet" in first and first["also_on"][0]["via"] == "phone 424242"


def test_show_unknown_is_404_and_known_returns_contact(tmp_path, monkeypatch):
    _isolate(tmp_path, monkeypatch)
    _patch_directory(monkeypatch, [_contact()])
    client = _client(monkeypatch, _paid())
    assert client.get("/api/leads/nope").status_code == 404
    body = client.get("/api/leads/c_abc").json()
    assert body["contact"]["display_name"] == "Ada"
    assert body["messages"] == []


def test_override_mute_persists(tmp_path, monkeypatch):
    _isolate(tmp_path, monkeypatch)
    _patch_directory(monkeypatch, [_contact()])
    client = _client(monkeypatch, _paid())
    body = client.patch("/api/leads/c_abc", json={"muted": True, "note": "spammy"}).json()
    assert body["override"] == {"muted": True, "note": "spammy"}
    assert client.patch("/api/leads/nope", json={"muted": True}).status_code == 404


def test_merge_unmerge_round_trip_with_rules(tmp_path, monkeypatch):
    _isolate(tmp_path, monkeypatch)
    import hermes_cli.leads as leads_mod
    fixtures = [
        _contact(),
        _contact(id="c_form", display_name="Example Ltd", platform="form", channels=[],
                 emails=["ada@example.com"]),
    ]

    def fake_get(cid):
        folded = leads_mod._apply_merges([dict(c) for c in fixtures],
                                         leads_mod.get_overrides())
        return next((c for c in folded if c["id"] == cid), None)

    monkeypatch.setattr(leads_mod, "get_contact", fake_get)
    monkeypatch.setattr(leads_mod, "list_contacts", lambda **k: [])
    client = _client(monkeypatch, _paid())
    merged = client.patch("/api/leads/c_form", json={"merged_into": "c_abc"}).json()
    assert merged["override"] == {"merged_into": "c_abc"}
    assert merged["contact"]["id"] == "c_abc"
    assert client.get("/api/leads/c_form").status_code == 404
    assert "c_abc" in client.get("/api/leads/c_form").json()["detail"]

    relink = client.patch("/api/leads/c_form", json={"merged_into": "c_abc"}).json()
    assert relink["contact"]["id"] == "c_abc"
    assert client.patch("/api/leads/c_abc", json={"merged_into": "c_abc"}).status_code == 400
    assert client.patch("/api/leads/c_abc", json={"merged_into": "nope"}).status_code == 404
    assert client.patch("/api/leads/c_abc", json={"merged_into": ""}).status_code == 400

    unmerged = client.patch("/api/leads/c_form", json={"merged_into": ""}).json()
    assert unmerged["override"] == {}
    assert unmerged["contact"]["id"] == "c_form"
    assert client.get("/api/leads/c_form").status_code == 200


def test_lead_intake_returns_form_events_and_empty_for_chats(tmp_path, monkeypatch):
    home = _isolate(tmp_path, monkeypatch)
    form_contact = _contact(id="c_form", display_name="Example Ltd", platform="form", channels=[
        {"platform": "form", "chat_type": "form", "chat_id": "sub-1",
         "thread_id": None, "scope_id": None, "session_key": "",
         "session_id": "", "conversation_id": "sub-1", "last_active": 50.0}])
    _patch_directory(monkeypatch, [_contact(), form_contact])
    from hermes_cli.intake import IntakeEvent
    from hermes_cli.prd_store import PrdStore
    store = PrdStore(home)
    event = IntakeEvent.create(source="website-form", text="Please add dark mode.",
                               author_id="ada@example.com", author_name="Example Ltd",
                               conversation_id="sub-1")
    store.append_intake(event.to_dict())
    client = _client(monkeypatch, _paid())
    body = client.get("/api/leads/c_form/intake").json()
    assert len(body["events"]) == 1
    assert body["events"][0]["text"] == "Please add dark mode."
    assert body["events"][0]["conversation_id"] == "sub-1"
    assert client.get("/api/leads/c_abc/intake").json() == {"events": []}
    assert client.get("/api/leads/nope/intake").status_code == 404


def test_reply_sends_newest_dm_and_marks_read(tmp_path, monkeypatch):
    _isolate(tmp_path, monkeypatch)
    contact = _contact(channels=[
        {"platform": "telegram", "chat_type": "dm", "chat_id": "111", "thread_id": None,
         "scope_id": None, "session_key": "k1", "session_id": "old", "last_active": 10.0},
        {"platform": "telegram", "chat_type": "dm", "chat_id": "424242", "thread_id": None,
         "scope_id": None, "session_key": "k2", "session_id": "sess-1", "last_active": 100.0},
    ])
    _patch_directory(monkeypatch, [contact])
    calls = _patch_send(monkeypatch)
    import hermes_cli.leads as leads_mod
    marked = []
    monkeypatch.setattr(leads_mod, "mark_channel_read",
                        lambda sid: marked.append(sid) or True)
    client = _client(monkeypatch, _paid())
    body = client.post("/api/leads/reply", json={"contact_id": "c_abc", "text": "Hello Ada"}).json()
    assert body == {"ok": True, "contact_id": "c_abc", "platform": "telegram", "chat_id": "424242"}
    assert len(calls) == 1
    assert marked == ["sess-1"]


def test_reply_validation_and_resolution_failures(tmp_path, monkeypatch):
    _isolate(tmp_path, monkeypatch)
    group = _contact(id="c_g", channels=[
        {"platform": "telegram", "chat_type": "group", "chat_id": "-1001",
         "thread_id": None, "scope_id": None, "session_key": "kg",
         "session_id": "gs", "last_active": 50.0}])
    form = _contact(id="c_f", platform="form", channels=[
        {"platform": "form", "chat_type": "form", "chat_id": "sub-1",
         "thread_id": None, "scope_id": None, "session_key": "",
         "session_id": "", "conversation_id": "sub-1", "last_active": 50.0}])
    _patch_directory(monkeypatch, [_contact(), group, form])
    _patch_send(monkeypatch)
    client = _client(monkeypatch, _paid())
    assert client.post("/api/leads/reply", json={"contact_id": "c_abc", "text": ""}).status_code == 400
    assert client.post("/api/leads/reply", json={"contact_id": "c_abc", "text": "x" * 4001}).status_code == 400
    assert client.post("/api/leads/reply", json={"contact_id": "nope", "text": "hi"}).status_code == 404
    assert client.post("/api/leads/reply", json={"contact_id": "c_g", "text": "hi"}).status_code == 400
    assert client.post("/api/leads/reply", json={"contact_id": "c_f", "text": "hi"}).status_code == 400


def test_reply_refusals_and_failures_surface(tmp_path, monkeypatch):
    _isolate(tmp_path, monkeypatch)
    _patch_directory(monkeypatch, [_contact()])
    client = _client(monkeypatch, _paid())

    _patch_send(monkeypatch, resolve_err="telegram is not configured")
    assert client.post("/api/leads/reply", json={"contact_id": "c_abc", "text": "hi"}).status_code == 409

    _patch_send(monkeypatch, denial="relay refuses this target")
    denied = client.post("/api/leads/reply", json={"contact_id": "c_abc", "text": "hi"})
    assert denied.status_code == 409

    _patch_send(monkeypatch, result={"error": "flood, retry in 30s"})
    failed = client.post("/api/leads/reply", json={"contact_id": "c_abc", "text": "hi"})
    assert failed.status_code == 502
    assert "flood" in failed.json()["detail"]

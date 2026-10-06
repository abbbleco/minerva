"""E2E tests for the PRDs dashboard router (hermes_cli/web_routers/prds.py).

Exercises the real HTTP path — premium gate, profile scope, intake, review
transitions, dispatch — with a temp home. Module-level functions only
(tmp_path/monkeypatch), so pytest and the repo's minimal shim both collect
them. Model calls are injected by seeding intake directly (triage judge
would need a network); the review/dispatch flow is what HTTP owns.
"""
from __future__ import annotations

import contextlib
import json
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
    from hermes_cli.web_routers import prds as prds_router

    monkeypatch.setattr(nous_billing, "get_subscription_state", lambda: subscription)
    app = FastAPI()
    app.include_router(prds_router.router)
    return TestClient(app)


def _paid():
    return {"logged_in": True, "current": {"tier_id": "plus"}}


def _free():
    return {"logged_in": True, "current": {"tier_id": "free"}}


def _judge_ok(system, user):
    return json.dumps({"strength": 0.95, "reason": "explicit request",
                       "title": "Export", "duplicate_of": ""})


def _seed_draft(tmp_path):
    """A drafted PRD via the real pipeline (stub judge/writer), for review tests."""
    import re

    from hermes_cli import prd_pipeline
    from hermes_cli.prd_store import PrdStore

    def writer(system, user):
        ids = re.findall(r"\[event ([^\]]+)\]", user)
        first = ids[0]
        return json.dumps({
            "title": "Export", "problem": "No export.", "users": "Analysts",
            "requirements": ["CSV"], "acceptance_criteria": ["Downloads CSV"],
            "open_questions": [],
            "section_sources": {"problem": [first], "users": [first],
                                "requirements": [first], "acceptance_criteria": [first],
                                "open_questions": []}})

    store = PrdStore(tmp_path / ".hermes")
    event, case = prd_pipeline.ingest_intake(store, source="telegram", text="Build export",
                                             judge_fn=_judge_ok, writer_fn=writer)
    assert case["status"] == "drafted"
    return case["prd_id"]


def test_free_tier_is_refused_with_402(tmp_path, monkeypatch):
    _isolate(tmp_path, monkeypatch)
    client = _client(monkeypatch, _free())
    response = client.get("/api/prds")
    assert response.status_code == 402
    assert response.json()["detail"]["error"] == "premium_required"


def test_review_lifecycle_over_http(tmp_path, monkeypatch):
    _isolate(tmp_path, monkeypatch)
    client = _client(monkeypatch, _paid())

    assert client.get("/api/prds").json()["prds"] == []
    prd_id = _seed_draft(tmp_path)

    shown = client.get(f"/api/prds/{prd_id}").json()
    assert shown["prd"]["status"] == "draft"
    assert shown["prd"]["section_sources"]["requirements"]
    assert shown["case"]["status"] == "drafted"
    assert shown["events"] and shown["events"][0]["text"] == "Build export"

    assert client.get("/api/prds-cases", params={"status": "drafted"}).json()["cases"]
    assert client.post(f"/api/prds/{prd_id}/review",
                       json={"action": "revise", "field": "problem", "value": "Sharper."}).json()["prd"]["problem"] == "Sharper."
    assert client.post(f"/api/prds/{prd_id}/review",
                       json={"action": "approve", "reason": "ship it"}).json()["prd"]["status"] == "approved"

    bad = client.post(f"/api/prds/{prd_id}/review", json={"action": "approve"})
    assert bad.status_code == 400
    assert client.get("/api/prds/nope").status_code == 404
    assert client.post("/api/prds/nope/review", json={"action": "approve"}).status_code == 400


def test_intake_endpoint_stores_and_returns_tracking_id(tmp_path, monkeypatch):
    _isolate(tmp_path, monkeypatch)
    client = _client(monkeypatch, _paid())
    # Triage judge would need a network: seed the event directly is covered
    # above, so here the judge is unreachable → watch case, event stored.
    import hermes_cli.prd_triage as triage
    monkeypatch.setattr(triage, "triage_conversation",
                        lambda store, cid, judge_fn=None, writer_fn=None: {
                            "id": "case-1", "conversation_id": cid, "status": "watch",
                            "reason": "queued", "event_ids": [], "prd_id": None,
                            "triage_count": 1})
    body = client.post("/api/prds/intake", json={"text": "Build export"}).json()
    assert body["event_id"] and body["conversation_id"] == body["event_id"]
    assert body["case"]["status"] == "watch"


def test_file_intake_processes_attachments(tmp_path, monkeypatch):
    home = _isolate(tmp_path, monkeypatch)
    client = _client(monkeypatch, _paid())
    import hermes_cli.prd_triage as triage
    monkeypatch.setattr(triage, "triage_conversation",
                        lambda store, cid, judge_fn=None, writer_fn=None: None)
    response = client.post("/api/prds/intake/file",
                           data={"text": "see attached"},
                           files={"upload": ("request.md", b"# Request\nBuild export.\n",
                                             "text/markdown")})
    body = response.json()
    assert response.status_code == 201 and body["event_id"]
    from hermes_cli.prd_store import PrdStore
    events = PrdStore(home).list_intake(body["conversation_id"])
    assert len(events) == 1
    assert "Build export" in events[0]["attachments"][0].get("transcript", "")


def test_dispatch_endpoint_mints_and_is_idempotent(tmp_path, monkeypatch):
    _isolate(tmp_path, monkeypatch)
    client = _client(monkeypatch, _paid())
    prd_id = _seed_draft(tmp_path)
    client.post(f"/api/prds/{prd_id}/review", json={"action": "approve"})

    import hermes_cli.kanban_db_connect as kbc
    import hermes_cli.kanban_decompose as decomp

    original = kbc.connect_closing
    monkeypatch.setattr(kbc, "connect_closing", lambda: original(tmp_path / "kanban.db"))

    class _Outcome:
        ok = True
        child_ids = ["c1"]
        reason = ""

    monkeypatch.setattr(decomp, "decompose_task", lambda task_id, author=None: _Outcome())
    first = client.post(f"/api/prds/{prd_id}/dispatch").json()
    assert first["created"] is True and first["child_ids"] == ["c1"]
    second = client.post(f"/api/prds/{prd_id}/dispatch").json()
    assert second["created"] is False and second["task_id"] == first["task_id"]

    unapproved = _seed_draft(tmp_path)
    refused = client.post(f"/api/prds/{unapproved}/dispatch")
    assert refused.status_code == 400


def test_forms_sync_enable_run_lifecycle(tmp_path, monkeypatch):
    _isolate(tmp_path, monkeypatch)
    monkeypatch.delenv("MINERVA_INTAKE_API_KEY", raising=False)
    client = _client(monkeypatch, _paid())

    status = client.get("/api/prds/forms-sync").json()
    assert status == {"enabled": False, "job_count": 0, "configured": False}

    enabled = client.post("/api/prds/forms-sync", json={"enabled": True}).json()
    assert enabled["enabled"] is True and enabled["status"] == "created"
    assert client.get("/api/prds/forms-sync").json()["enabled"] is True

    import hermes_cli.prd_forms as forms
    monkeypatch.setenv("MINERVA_INTAKE_API_KEY", "qkt_sec_site")
    monkeypatch.setattr(forms, "_api", lambda *a, **k: {"submissions": []})
    run = client.post("/api/prds/forms-sync/run").json()
    assert run["fetched"] == 0 and run["ingested"] == 0

    disabled = client.post("/api/prds/forms-sync", json={"enabled": False}).json()
    assert disabled["status"] == "paused"
    assert client.get("/api/prds/forms-sync").json()["enabled"] is False

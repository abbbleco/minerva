"""E2E tests for the Goals dashboard router (hermes_cli/web_routers/goals.py).

Exercises the real HTTP path — premium gate → profile scope → registry → kanban
bridge — with a temp home, rather than mocking the registry away. Module-level
functions only (tmp_path/monkeypatch), so pytest and the repo's minimal shim
both collect them.
"""

from __future__ import annotations

import contextlib
from pathlib import Path

import pytest


def _isolate(tmp_path, monkeypatch):
    home = tmp_path / ".hermes"
    home.mkdir()
    monkeypatch.setattr(Path, "home", lambda: tmp_path)
    monkeypatch.setenv("HERMES_HOME", str(home))
    from hermes_cli import goal_registry, goals

    goals._DB_CACHE.clear()
    goal_registry._MIGRATED_HOMES.clear()

    # Profile scope is a no-op in tests; the router resolves it late, so patching
    # the owning module attribute is what the request path actually sees.
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
    from hermes_cli.web_routers import goals as goals_router

    monkeypatch.setattr(nous_billing, "get_subscription_state", lambda: subscription)
    app = FastAPI()
    app.include_router(goals_router.router)
    return TestClient(app)


def _paid():
    return {"logged_in": True, "current": {"tier_id": "plus"}}


def _free():
    return {"logged_in": True, "current": {"tier_id": "free"}}


def test_free_tier_is_refused_with_402(tmp_path, monkeypatch):
    _isolate(tmp_path, monkeypatch)
    client = _client(monkeypatch, _free())
    response = client.get("/api/goals")
    assert response.status_code == 402
    assert response.json()["detail"]["error"] == "premium_required"


def test_goal_lifecycle_over_http(tmp_path, monkeypatch):
    _isolate(tmp_path, monkeypatch)
    client = _client(monkeypatch, _paid())

    assert client.get("/api/goals").json()["goals"] == []

    created = client.post("/api/goals", json={"title": "Ship phase 3",
                                              "contract": {"verification": "tests green"}})
    assert created.status_code == 201
    goal = created.json()["goal"]
    assert goal["title"] == "Ship phase 3"
    assert goal["status"] == "active"
    assert goal["contract"] == {"verification": "tests green"}
    gid = goal["id"]

    listed = client.get("/api/goals").json()
    assert len(listed["goals"]) == 1
    assert listed["goals"][0]["id"] == gid

    shown = client.get(f"/api/goals/{gid}").json()["goal"]
    assert shown["id"] == gid and "history" in shown

    completed = client.post(f"/api/goals/{gid}/complete")
    assert completed.status_code == 200
    assert completed.json()["goal"]["status"] == "complete"

    reopened = client.post(f"/api/goals/{gid}/reopen")
    assert reopened.json()["goal"]["status"] == "active"


def test_pending_completion_confirm_flow_over_http(tmp_path, monkeypatch):
    _isolate(tmp_path, monkeypatch)
    client = _client(monkeypatch, _paid())
    gid = client.post("/api/goals", json={"title": "Draft notes"}).json()["goal"]["id"]

    # Confirm before a proposal exists is a 400, not a silent state change.
    assert client.post(f"/api/goals/{gid}/confirm").status_code == 400

    from hermes_cli import goal_registry
    goal_registry.transition(gid, goal_registry.STATUS_PENDING, "proposed", evidence="done")

    listed = client.get("/api/goals").json()
    assert gid in listed["pending"]
    confirmed = client.post(f"/api/goals/{gid}/confirm")
    assert confirmed.json()["goal"]["status"] == "complete"


def test_dispatch_endpoint_mints_and_is_idempotent(tmp_path, monkeypatch):
    _isolate(tmp_path, monkeypatch)
    client = _client(monkeypatch, _paid())
    gid = client.post("/api/goals", json={"title": "Ship phase 3"}).json()["goal"]["id"]

    first = client.post(f"/api/goals/{gid}/dispatch")
    assert first.status_code == 200
    body = first.json()
    assert body["created"] is True and body["task_id"]
    assert body["goal"]["kanban_task_id"] == body["task_id"]

    second = client.post(f"/api/goals/{gid}/dispatch").json()
    assert second["created"] is False and second["task_id"] == body["task_id"]


def test_unknown_and_invalid_requests_are_4xx(tmp_path, monkeypatch):
    _isolate(tmp_path, monkeypatch)
    client = _client(monkeypatch, _paid())

    assert client.post("/api/goals/nope/complete").status_code == 404
    assert client.get("/api/goals/nope").status_code == 404
    assert client.post("/api/goals", json={"title": ""}).status_code == 400

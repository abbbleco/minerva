"""Goals dashboard routes (premium).

Tracked-goal registry for the Goals pane: plural named goals per profile, their
audit history, the confirmation inbox for proposed completions, and the explicit
kanban bridge. Thin adapter layer on purpose: ``hermes_cli/goal_registry.py``
owns storage, transitions, migration and detection; this only translates HTTP
into shapes those functions already accept, exactly like the feeds router defers
to ``hermes_cli/feeds.py``.

Every route re-checks premium entitlement server-side
(``require_premium_tier`` over a fresh subscription state) — the pane's lock is
visibility only. The registry lives in the profile's ``state_meta`` table, so
``_profile_scope(profile)`` is what keeps profiles isolated.
"""
import asyncio
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from hermes_cli.web_routers._common import log as _log

router = APIRouter()

from hermes_cli.web_deps import late  # noqa: E402

_profile_scope = late("_profile_scope", "hermes_cli.web_server_profiles")


def _check_premium() -> str:
    """Active premium tier id, or raise 402. Fetches fresh subscription state:
    entitlement changes (upgrade, expiry) take effect on the next call, never
    from a cached verdict."""
    from hermes_cli import nous_billing
    try:
        state = nous_billing.get_subscription_state()
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"billing state unavailable: {exc}")
    try:
        return nous_billing.require_premium_tier(state)
    except nous_billing.PremiumRequiredError as exc:
        raise HTTPException(status_code=402, detail={"error": "premium_required", "message": str(exc)})


def _public_goal(entry: Dict[str, Any], *, with_history: bool = False) -> Dict[str, Any]:
    goal = {
        "id": entry.get("id"),
        "title": entry.get("title", ""),
        "contract": entry.get("contract") or {},
        "status": entry.get("status"),
        "session_id": entry.get("session_id"),
        "kanban_task_id": entry.get("kanban_task_id"),
        "created_at": entry.get("created_at"),
        "updated_at": entry.get("updated_at"),
    }
    if with_history:
        goal["history"] = entry.get("history") or []
    return goal


def _registry_error(exc: Exception) -> HTTPException:
    from hermes_cli import goal_registry
    if isinstance(exc, goal_registry.RegistryError):
        message = str(exc)
        # Unknown ids are 404; everything else (illegal transition, empty title) is 400.
        status = 404 if "unknown goal id" in message else 400
        return HTTPException(status_code=status, detail=message)
    return HTTPException(status_code=500, detail=str(exc))


class GoalCreate(BaseModel):
    title: str = ""
    contract: Optional[Dict[str, str]] = None


def _transition(goal_id: str, fn, *, success: str) -> Dict[str, Any]:
    from hermes_cli import goal_registry
    try:
        entry = fn(goal_registry, goal_id)
    except Exception as exc:  # noqa: BLE001 — RegistryError -> 4xx, anything else -> 500
        raise _registry_error(exc)
    return {"ok": True, "action": success, "goal": _public_goal(entry)}


@router.get("/api/goals")
async def list_goals(profile: Optional[str] = None, status: Optional[str] = None):
    def _run():
        with _profile_scope(profile):
            _check_premium()
            from hermes_cli import goal_registry
            goals: List[Dict[str, Any]] = goal_registry.load_registry()
            if status:
                goals = [g for g in goals if g.get("status") == status]
            order = {name: index for index, name in enumerate(goal_registry.STATUSES)}
            goals.sort(key=lambda g: (order.get(g.get("status"), 99), -(g.get("updated_at") or 0)))
            return {"goals": [_public_goal(g, with_history=True) for g in goals],
                    "statuses": list(goal_registry.STATUSES),
                    "pending": [g["id"] for g in goals if g.get("status") == goal_registry.STATUS_PENDING]}
    try:
        return await asyncio.to_thread(_run)
    except HTTPException:
        raise
    except Exception as exc:
        _log.exception("GET /api/goals failed")
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/api/goals", status_code=201)
async def create_goal(body: GoalCreate, profile: Optional[str] = None):
    def _run():
        with _profile_scope(profile):
            _check_premium()
            from hermes_cli import goal_registry
            try:
                entry = goal_registry.create_entry(body.title, body.contract)
            except Exception as exc:  # noqa: BLE001
                raise _registry_error(exc)
            return {"goal": _public_goal(entry, with_history=True)}
    try:
        return await asyncio.to_thread(_run)
    except HTTPException:
        raise
    except Exception as exc:
        _log.exception("POST /api/goals failed")
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/api/goals/{goal_id}")
async def show_goal(goal_id: str, profile: Optional[str] = None):
    def _run():
        with _profile_scope(profile):
            _check_premium()
            from hermes_cli import goal_registry
            entry = goal_registry.get_entry(goal_id)
            if entry is None:
                raise HTTPException(status_code=404, detail=f"unknown goal id: {goal_id}")
            return {"goal": _public_goal(entry, with_history=True)}
    try:
        return await asyncio.to_thread(_run)
    except HTTPException:
        raise
    except Exception as exc:
        _log.exception("GET /api/goals/{id} failed")
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/api/goals/{goal_id}/complete")
async def complete_goal(goal_id: str, profile: Optional[str] = None):
    return await _run_transition(profile, goal_id, "completed",
                                 lambda r, i: r.transition(i, r.STATUS_COMPLETE, "user-completed",
                                                           "completed by user"), "POST /api/goals/complete")


@router.post("/api/goals/{goal_id}/abandon")
async def abandon_goal(goal_id: str, profile: Optional[str] = None):
    return await _run_transition(profile, goal_id, "abandoned",
                                 lambda r, i: r.transition(i, r.STATUS_ABANDONED, "abandoned",
                                                           "abandoned by user"), "POST /api/goals/abandon")


@router.post("/api/goals/{goal_id}/pause")
async def pause_goal(goal_id: str, profile: Optional[str] = None):
    return await _run_transition(profile, goal_id, "paused",
                                 lambda r, i: r.transition(i, r.STATUS_PAUSED, "paused",
                                                           "paused by user"), "POST /api/goals/pause")


@router.post("/api/goals/{goal_id}/resume")
async def resume_goal(goal_id: str, profile: Optional[str] = None):
    return await _run_transition(profile, goal_id, "resumed",
                                 lambda r, i: r.transition(i, r.STATUS_ACTIVE, "resumed",
                                                           "resumed by user"), "POST /api/goals/resume")


@router.post("/api/goals/{goal_id}/confirm")
async def confirm_goal(goal_id: str, profile: Optional[str] = None):
    return await _run_transition(profile, goal_id, "confirmed",
                                 lambda r, i: r.confirm_entry(i), "POST /api/goals/confirm")


@router.post("/api/goals/{goal_id}/dismiss")
async def dismiss_goal(goal_id: str, profile: Optional[str] = None):
    return await _run_transition(profile, goal_id, "dismissed",
                                 lambda r, i: r.dismiss_proposal(i), "POST /api/goals/dismiss")


@router.post("/api/goals/{goal_id}/reopen")
async def reopen_goal(goal_id: str, profile: Optional[str] = None):
    return await _run_transition(profile, goal_id, "reopened",
                                 lambda r, i: r.reopen_entry(i), "POST /api/goals/reopen")


@router.post("/api/goals/{goal_id}/dispatch")
async def dispatch_goal(goal_id: str, profile: Optional[str] = None):
    """Explicit kanban bridge: mint a work item from a tracked goal. Idempotent
    on the goal id, so a double-click returns the same task."""
    def _run():
        with _profile_scope(profile):
            _check_premium()
            from hermes_cli import goal_registry
            try:
                result = goal_registry.dispatch_to_kanban(goal_id)
            except Exception as exc:  # noqa: BLE001
                raise _registry_error(exc)
            return {"ok": True, "task_id": result.get("task_id"), "created": result.get("created"),
                    "goal": _public_goal(result.get("goal") or {})}
    try:
        return await asyncio.to_thread(_run)
    except HTTPException:
        raise
    except Exception as exc:
        _log.exception("POST /api/goals/dispatch failed")
        raise HTTPException(status_code=500, detail=str(exc))


async def _run_transition(profile: Optional[str], goal_id: str, success: str, fn, log_msg: str):
    def _run():
        with _profile_scope(profile):
            _check_premium()
            return _transition(goal_id, fn, success=success)
    try:
        return await asyncio.to_thread(_run)
    except HTTPException:
        raise
    except Exception as exc:
        _log.exception("%s failed", log_msg)
        raise HTTPException(status_code=500, detail=str(exc))

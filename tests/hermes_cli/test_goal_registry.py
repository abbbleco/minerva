"""Tests for hermes_cli/goal_registry.py — Phase 3 tracked-goal registry.

Written as module-level functions using only ``tmp_path`` and ``monkeypatch``
(no ``@pytest.fixture``) so the suite runs under both pytest and the repo's
minimal pytest shim, which collects module-level ``test_*`` functions.

Behaviour contracts asserted here (not snapshots):
- every status change is a legal transition and appends one history row;
- ``confirm``/``dismiss`` only apply to a pending proposal;
- detection proposes, never completes — unless auto-complete is opted in;
- evidence must be a real substring of the turn or nothing is proposed;
- a turn with no tools never spends a judge call;
- legacy single session goals migrate once, idempotently;
- ``/goal`` subcommands and the REST-independent dispatch adapter agree.
"""

from __future__ import annotations

import json
import time
from pathlib import Path

import pytest


def _isolate(tmp_path, monkeypatch):
    """Fresh profile home + cleared caches, so nothing leaks between tests."""
    home = tmp_path / ".hermes"
    home.mkdir()
    monkeypatch.setattr(Path, "home", lambda: tmp_path)
    monkeypatch.setenv("HERMES_HOME", str(home))
    from hermes_cli import goal_registry, goals

    goals._DB_CACHE.clear()
    goal_registry._MIGRATED_HOMES.clear()
    return home


def _judge(payload):
    return lambda system, user: json.dumps(payload)


# ── turn_tool_names ─────────────────────────────────────────────────────────

def test_turn_tool_names_collects_only_the_last_turn(tmp_path, monkeypatch):
    _isolate(tmp_path, monkeypatch)
    from hermes_cli import goal_registry

    messages = [
        {"role": "user", "content": "first"},
        {"role": "assistant", "content": None, "tool_calls": [{"function": {"name": "OldTool"}}]},
        {"role": "tool", "content": "ok"},
        {"role": "assistant", "content": "done"},
        {"role": "user", "content": "second"},
        {"role": "assistant", "content": None,
         "tool_calls": [{"function": {"name": "Write"}}, {"name": "Bash"}]},
        {"role": "tool", "content": "ok"},
        {"role": "assistant", "content": "finished"},
    ]
    assert goal_registry.turn_tool_names(messages) == ["Write", "Bash"]


def test_turn_tool_names_empty_for_conversational_turn(tmp_path, monkeypatch):
    _isolate(tmp_path, monkeypatch)
    from hermes_cli import goal_registry

    assert goal_registry.turn_tool_names(
        [{"role": "user", "content": "hi"}, {"role": "assistant", "content": "hello"}]) == []
    assert goal_registry.turn_tool_names(None) == []


# ── registry CRUD + transitions ─────────────────────────────────────────────

def test_create_and_get_entry(tmp_path, monkeypatch):
    _isolate(tmp_path, monkeypatch)
    from hermes_cli import goal_registry

    entry = goal_registry.create_entry("Ship phase 3", {"verification": "tests green"})
    assert entry["status"] == goal_registry.STATUS_ACTIVE
    assert entry["title"] == "Ship phase 3"
    assert entry["contract"] == {"verification": "tests green"}
    assert entry["history"][0]["trigger"] == "created"
    assert goal_registry.get_entry(entry["id"])["id"] == entry["id"]
    assert goal_registry.get_entry("nope") is None


def test_empty_title_is_rejected(tmp_path, monkeypatch):
    _isolate(tmp_path, monkeypatch)
    from hermes_cli import goal_registry

    with pytest.raises(goal_registry.RegistryError):
        goal_registry.create_entry("   ")


def test_illegal_transition_is_rejected_and_history_is_append_only(tmp_path, monkeypatch):
    _isolate(tmp_path, monkeypatch)
    from hermes_cli import goal_registry

    entry = goal_registry.create_entry("Goal")
    goal_registry.transition(entry["id"], goal_registry.STATUS_COMPLETE, "user-completed")
    # complete -> paused is not a legal move.
    with pytest.raises(goal_registry.RegistryError):
        goal_registry.transition(entry["id"], goal_registry.STATUS_PAUSED, "nope")
    # complete -> active (reopen) is the documented undo.
    reopened = goal_registry.transition(entry["id"], goal_registry.STATUS_ACTIVE, "reopened")
    triggers = [row["trigger"] for row in reopened["history"]]
    assert triggers == ["created", "user-completed", "reopened"]


def test_confirm_and_dismiss_are_pending_only(tmp_path, monkeypatch):
    _isolate(tmp_path, monkeypatch)
    from hermes_cli import goal_registry

    entry = goal_registry.create_entry("Goal")
    with pytest.raises(goal_registry.RegistryError):
        goal_registry.confirm_entry(entry["id"])
    with pytest.raises(goal_registry.RegistryError):
        goal_registry.dismiss_proposal(entry["id"])

    goal_registry.transition(entry["id"], goal_registry.STATUS_PENDING, "proposed", evidence="x")
    assert goal_registry.dismiss_proposal(entry["id"])["status"] == goal_registry.STATUS_ACTIVE

    goal_registry.transition(entry["id"], goal_registry.STATUS_PENDING, "proposed", evidence="x")
    assert goal_registry.confirm_entry(entry["id"])["status"] == goal_registry.STATUS_COMPLETE


def test_bound_entry_tracks_the_session_goal(tmp_path, monkeypatch):
    _isolate(tmp_path, monkeypatch)
    from hermes_cli import goal_registry, goals

    goals._DB_CACHE.clear()
    mgr = goals.GoalManager(session_id="sess-1")
    mgr.set("Ship the pane")
    bound = goal_registry.bound_entry("sess-1")
    assert bound is not None and bound["title"] == "Ship the pane"

    mgr.mark_done("judge ruled done")
    assert goal_registry.get_entry(bound["id"])["status"] == goal_registry.STATUS_COMPLETE

    # A new goal in the same session (the old one is complete) creates a fresh entry.
    mgr2 = goals.GoalManager(session_id="sess-1")
    mgr2.set("Second goal")
    assert goal_registry.bound_entry("sess-1")["title"] == "Second goal"
    assert len(goal_registry.load_registry()) == 2


def test_pause_and_resume_mirror_the_session_goal(tmp_path, monkeypatch):
    _isolate(tmp_path, monkeypatch)
    from hermes_cli import goal_registry, goals

    goals._DB_CACHE.clear()
    mgr = goals.GoalManager(session_id="sess-pause")
    mgr.set("Pausable goal")
    gid = goal_registry.bound_entry("sess-pause")["id"]

    mgr.pause(reason="user-paused")
    assert goal_registry.get_entry(gid)["status"] == goal_registry.STATUS_PAUSED
    mgr.resume()
    assert goal_registry.get_entry(gid)["status"] == goal_registry.STATUS_ACTIVE


def test_loop_judging_done_completes_the_entry(tmp_path, monkeypatch):
    """The loop's own 'done' branch (not GoalManager.mark_done) must complete
    the bound entry — it sets status directly, so the binding lives there too."""
    _isolate(tmp_path, monkeypatch)
    from hermes_cli import goal_registry, goals

    goals._DB_CACHE.clear()
    monkeypatch.setattr("hermes_cli.goals.judge_goal",
                        lambda *a, **k: ("done", "shipped", False, None, False))
    mgr = goals.GoalManager(session_id="sess-loop")
    mgr.set("Ship the release")
    gid = goal_registry.bound_entry("sess-loop")["id"]

    decision = mgr.evaluate_after_turn("I shipped the release", user_initiated=True)
    assert decision["status"] == "done"
    entry = goal_registry.get_entry(gid)
    assert entry["status"] == goal_registry.STATUS_COMPLETE
    assert entry["history"][-1]["trigger"] == "session-loop"


def test_budget_pause_mirrors_the_session_goal(tmp_path, monkeypatch):
    _isolate(tmp_path, monkeypatch)
    from hermes_cli import goal_registry, goals

    goals._DB_CACHE.clear()
    monkeypatch.setattr("hermes_cli.goals.judge_goal",
                        lambda *a, **k: ("continue", "keep going", False, None, False))
    mgr = goals.GoalManager(session_id="sess-budget", default_max_turns=1)
    mgr.set("Tiny goal")
    gid = goal_registry.bound_entry("sess-budget")["id"]

    mgr.evaluate_after_turn("still going", user_initiated=True)
    assert goal_registry.get_entry(gid)["status"] == goal_registry.STATUS_PAUSED


def test_clearing_a_session_goal_abandons_the_entry(tmp_path, monkeypatch):
    _isolate(tmp_path, monkeypatch)
    from hermes_cli import goal_registry, goals

    goals._DB_CACHE.clear()
    mgr = goals.GoalManager(session_id="sess-clear")
    mgr.set("Transient goal")
    gid = goal_registry.bound_entry("sess-clear")["id"]
    mgr.clear()
    assert goal_registry.get_entry(gid)["status"] == goal_registry.STATUS_ABANDONED


# ── legacy migration ────────────────────────────────────────────────────────

def test_legacy_active_goal_migrates_once(tmp_path, monkeypatch):
    _isolate(tmp_path, monkeypatch)
    from hermes_cli import goal_registry, goals

    goals._DB_CACHE.clear()
    state = goals.GoalState(
        goal="Legacy objective", status="active", turns_used=0, created_at=time.time(),
        last_turn_at=0.0, max_turns=20, contract=goals.GoalContract(),
    )
    goals.save_goal("legacy-sess", state)

    migrated = goal_registry.load_registry()
    assert len(migrated) == 1
    assert migrated[0]["title"] == "Legacy objective"
    assert migrated[0]["status"] == goal_registry.STATUS_ACTIVE
    assert migrated[0]["session_id"] == "legacy-sess"

    # Second read is idempotent (the home is marked migrated in-process).
    assert len(goal_registry.load_registry()) == 1


# ── detection ───────────────────────────────────────────────────────────────

def test_detection_proposes_a_pending_completion(tmp_path, monkeypatch):
    _isolate(tmp_path, monkeypatch)
    from hermes_cli import goal_registry

    entry = goal_registry.create_entry("Ship the release")
    turn = "I shipped the release and tagged v1.0."
    proposals = goal_registry.detect_completions(
        "s1", turn, tools_ran=True, tool_names=["Bash"],
        judge_fn=_judge({"results": [{"id": entry["id"], "accomplished": True,
                                      "confidence": 0.95, "evidence": "I shipped the release"}]}),
    )
    assert len(proposals) == 1
    assert proposals[0]["auto_completed"] is False
    stored = goal_registry.get_entry(entry["id"])
    assert stored["status"] == goal_registry.STATUS_PENDING
    assert stored["history"][-1]["trigger"] == "proposed"
    assert stored["history"][-1]["evidence"] == "I shipped the release"


def test_detection_ignores_a_close_but_incomplete_turn(tmp_path, monkeypatch):
    _isolate(tmp_path, monkeypatch)
    from hermes_cli import goal_registry

    entry = goal_registry.create_entry("Ship the release")
    proposals = goal_registry.detect_completions(
        "s1", "I made progress but it is not released yet.", tools_ran=True, tool_names=["Bash"],
        judge_fn=_judge({"results": [{"id": entry["id"], "accomplished": False,
                                      "confidence": 0.3, "evidence": ""}]}),
    )
    assert proposals == []
    assert goal_registry.get_entry(entry["id"])["status"] == goal_registry.STATUS_ACTIVE


def test_detection_requires_evidence_in_the_turn(tmp_path, monkeypatch):
    _isolate(tmp_path, monkeypatch)
    from hermes_cli import goal_registry

    entry = goal_registry.create_entry("Ship the release")
    proposals = goal_registry.detect_completions(
        "s1", "I shipped the release.", tools_ran=True, tool_names=["Bash"],
        judge_fn=_judge({"results": [{"id": entry["id"], "accomplished": True,
                                      "confidence": 0.99, "evidence": "not in the turn"}]}),
    )
    assert proposals == []
    assert goal_registry.get_entry(entry["id"])["status"] == goal_registry.STATUS_ACTIVE


def test_no_tools_means_no_judge_call(tmp_path, monkeypatch):
    _isolate(tmp_path, monkeypatch)
    from hermes_cli import goal_registry

    goal_registry.create_entry("Ship the release")
    calls = {"n": 0}

    def _counting_judge(system, user):
        calls["n"] += 1
        return "{}"

    proposals = goal_registry.detect_completions(
        "s1", "any text", tools_ran=False, tool_names=[], judge_fn=_counting_judge)
    assert proposals == []
    assert calls["n"] == 0


def test_paused_goals_are_never_judged(tmp_path, monkeypatch):
    _isolate(tmp_path, monkeypatch)
    from hermes_cli import goal_registry

    entry = goal_registry.create_entry("Ship the release")
    goal_registry.transition(entry["id"], goal_registry.STATUS_PAUSED, "paused")
    calls = {"n": 0}

    def _counting_judge(system, user):
        calls["n"] += 1
        return json.dumps({"results": [{"id": entry["id"], "accomplished": True,
                                        "confidence": 0.99, "evidence": "x"}]})

    assert goal_registry.detect_completions(
        "s1", "x", tools_ran=True, tool_names=["Bash"], judge_fn=_counting_judge) == []
    assert calls["n"] == 0  # no active candidates → the judge is not even called


def test_auto_complete_opt_in_completes_directly(tmp_path, monkeypatch):
    _isolate(tmp_path, monkeypatch)
    from hermes_cli import goal_registry

    entry = goal_registry.create_entry("Ship the release")
    turn = "I shipped the release."
    monkeypatch.setattr(goal_registry, "tracking_auto_complete", lambda: True)
    monkeypatch.setattr(goal_registry, "tracking_auto_threshold", lambda: 0.9)
    proposals = goal_registry.detect_completions(
        "s1", turn, tools_ran=True, tool_names=["Bash"],
        judge_fn=_judge({"results": [{"id": entry["id"], "accomplished": True,
                                      "confidence": 0.95, "evidence": "I shipped the release"}]}),
    )
    assert proposals[0]["auto_completed"] is True
    stored = goal_registry.get_entry(entry["id"])
    assert stored["status"] == goal_registry.STATUS_COMPLETE
    assert stored["history"][-1]["trigger"] == "auto-completed"


def test_auto_complete_does_not_fire_below_threshold(tmp_path, monkeypatch):
    _isolate(tmp_path, monkeypatch)
    from hermes_cli import goal_registry

    entry = goal_registry.create_entry("Ship the release")
    monkeypatch.setattr(goal_registry, "tracking_auto_complete", lambda: True)
    monkeypatch.setattr(goal_registry, "tracking_auto_threshold", lambda: 0.9)
    proposals = goal_registry.detect_completions(
        "s1", "I shipped the release.", tools_ran=True, tool_names=["Bash"],
        judge_fn=_judge({"results": [{"id": entry["id"], "accomplished": True,
                                      "confidence": 0.6, "evidence": "I shipped the release"}]}),
    )
    assert proposals[0]["auto_completed"] is False
    assert goal_registry.get_entry(entry["id"])["status"] == goal_registry.STATUS_PENDING


def test_unparseable_judge_reply_proposes_nothing(tmp_path, monkeypatch):
    _isolate(tmp_path, monkeypatch)
    from hermes_cli import goal_registry

    entry = goal_registry.create_entry("Ship the release")
    proposals = goal_registry.detect_completions(
        "s1", "text", tools_ran=True, tool_names=["Bash"], judge_fn=lambda s, u: "not json")
    assert proposals == []
    assert goal_registry.get_entry(entry["id"])["status"] == goal_registry.STATUS_ACTIVE


def test_tracking_disabled_skips_detection(tmp_path, monkeypatch):
    _isolate(tmp_path, monkeypatch)
    from hermes_cli import goal_registry

    goal_registry.create_entry("Ship the release")
    monkeypatch.setattr(goal_registry, "tracking_enabled", lambda: False)
    assert goal_registry.detect_completions(
        "s1", "text", tools_ran=True, tool_names=["Bash"],
        judge_fn=_judge({"results": []})) == []


# ── config defaults (invariant) ─────────────────────────────────────────────

def test_tracking_config_defaults_are_present_and_typed(tmp_path, monkeypatch):
    _isolate(tmp_path, monkeypatch)
    from hermes_cli.config_defaults import DEFAULT_CONFIG
    from hermes_cli import goal_registry

    goals_cfg = DEFAULT_CONFIG["goals"]
    assert goals_cfg["tracking_enabled"] is True
    assert goals_cfg["tracking_auto_complete"] is False
    assert goals_cfg["tracking_auto_threshold"] == 0.9
    # Readers resolve the defaults from an isolated (config-less) home.
    assert goal_registry.tracking_enabled() is True
    assert goal_registry.tracking_auto_complete() is False
    assert goal_registry.tracking_auto_threshold() == 0.9


def test_tracking_threshold_clamps_out_of_range_values(tmp_path, monkeypatch):
    _isolate(tmp_path, monkeypatch)
    from hermes_cli import goal_registry

    monkeypatch.setattr("hermes_cli.config.load_config",
                        lambda: {"goals": {"tracking_auto_threshold": 2.0}})
    assert goal_registry.tracking_auto_threshold() == 1.0
    monkeypatch.setattr("hermes_cli.config.load_config",
                        lambda: {"goals": {"tracking_auto_threshold": -3}})
    assert goal_registry.tracking_auto_threshold() == 0.0


def test_tracking_garbage_setting_falls_back_to_default(tmp_path, monkeypatch):
    _isolate(tmp_path, monkeypatch)
    from hermes_cli import goal_registry

    monkeypatch.setattr("hermes_cli.config.load_config",
                        lambda: {"goals": {"tracking_auto_threshold": "not-a-number"}})
    assert goal_registry.tracking_auto_threshold() == 0.9


# ── /goal subcommand parity ─────────────────────────────────────────────────

def _dispatch(mgr, arg):
    from hermes_cli import goal_command

    return goal_command.dispatch_goal_command(mgr, arg, authorize_gate=lambda: None)


def test_goal_registry_subcommands_round_trip(tmp_path, monkeypatch):
    _isolate(tmp_path, monkeypatch)
    from hermes_cli import goal_command, goal_registry, goals

    goals._DB_CACHE.clear()
    mgr = goals.GoalManager(session_id="cli")

    created = _dispatch(mgr, "create Ship premium goals")
    assert created.error is False and "Tracked goal created" in created.output
    gid = goal_registry.load_registry()[0]["id"]

    listed = _dispatch(mgr, "list")
    assert gid in listed.output and "Ship premium goals" in listed.output

    shown = _dispatch(mgr, f"show {gid}")
    assert gid in shown.output and "history:" in shown.output

    assert "complete" in _dispatch(mgr, f"complete {gid}").output
    assert "active" in _dispatch(mgr, f"reopen {gid}").output
    assert "abandoned" in _dispatch(mgr, f"abandon {gid}").output
    assert "active" in _dispatch(mgr, f"reopen {gid}").output

    # confirm/dismiss require a pending proposal.
    assert _dispatch(mgr, f"confirm {gid}").error is True
    goal_registry.transition(gid, goal_registry.STATUS_PENDING, "proposed", evidence="x")
    assert "complete" in _dispatch(mgr, f"confirm {gid}").output


def test_goal_registry_subcommands_report_unknown_ids(tmp_path, monkeypatch):
    _isolate(tmp_path, monkeypatch)
    from hermes_cli import goals

    goals._DB_CACHE.clear()
    mgr = goals.GoalManager(session_id="cli")
    assert _dispatch(mgr, "complete nope").error is True
    assert _dispatch(mgr, "show nope").error is True
    assert _dispatch(mgr, "dispatch").error is True  # missing id


def test_registry_verbs_are_goal_control_not_new_goals(tmp_path, monkeypatch):
    _isolate(tmp_path, monkeypatch)
    from hermes_cli import goal_command

    for arg in ("create x", "list", "complete abc", "abandon abc", "confirm abc",
                "dismiss abc", "reopen abc", "dispatch abc"):
        assert goal_command.is_goal_control(arg) is True, arg
    assert goal_command.is_goal_control("build the thing") is False


# ── kanban bridge ───────────────────────────────────────────────────────────

def test_dispatch_mints_a_kanban_task_once(tmp_path, monkeypatch):
    _isolate(tmp_path, monkeypatch)
    from hermes_cli import goal_registry

    entry = goal_registry.create_entry("Ship phase 3", {"verification": "tests green"})
    first = goal_registry.dispatch_to_kanban(entry["id"])
    assert first["created"] is True and first["task_id"]
    assert first["goal"]["kanban_task_id"] == first["task_id"]

    # Idempotent: the second call returns the same task, never a duplicate.
    second = goal_registry.dispatch_to_kanban(entry["id"])
    assert second["created"] is False
    assert second["task_id"] == first["task_id"]


def test_dispatch_unknown_goal_raises(tmp_path, monkeypatch):
    _isolate(tmp_path, monkeypatch)
    from hermes_cli import goal_registry

    with pytest.raises(goal_registry.RegistryError):
        goal_registry.dispatch_to_kanban("nope")

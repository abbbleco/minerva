"""Phase 3 passive goal tracking: a per-profile registry of named goals.

The session loop (``GoalManager``/``evaluate_after_turn``) is the *execution*
engine — one active goal per session with continuation prompts. This module is
the *tracking* layer over it: plural named goals per profile, each with a
status, an audit history, and an optional session binding.

Relationship between the two layers (deliberate, read before changing):

- Setting a session goal (``GoalManager.set``) creates or updates the bound
  registry entry; clearing abandons it; the loop reaching ``done`` completes
  it. The loop never reads the registry — registry failures are swallowed so
  tracking can never break an active goal loop.
- Detection (``detect_completions``) runs at turn end when tools ran and at
  least one registry goal is active. It proposes, never completes — except
  above the configured confidence threshold when the (default-off)
  ``goals.tracking_auto_complete`` setting opts in. History records every
  transition with trigger + evidence; ``reopen`` is the undo.
- ``pending-confirmation`` is the only proposal state: confirm → complete,
  dismiss → active, abandon always allowed.

Storage is one ``state_meta`` key (``goals:registry:v1``) under the profile
home — the same table the session rows live in, so profiles stay isolated
and no new database is introduced.
"""

from __future__ import annotations

import json
import logging
import time
import uuid
from typing import Any, Callable, Dict, List, Optional

logger = logging.getLogger(__name__)

REGISTRY_META_KEY = "goals:registry:v1"

STATUS_ACTIVE = "active"
STATUS_PAUSED = "paused"
STATUS_PENDING = "pending-confirmation"
STATUS_COMPLETE = "complete"
STATUS_ABANDONED = "abandoned"

STATUSES = (STATUS_ACTIVE, STATUS_PAUSED, STATUS_PENDING, STATUS_COMPLETE, STATUS_ABANDONED)

_TRANSITIONS = {
    STATUS_ACTIVE: {STATUS_PAUSED, STATUS_PENDING, STATUS_COMPLETE, STATUS_ABANDONED},
    STATUS_PAUSED: {STATUS_ACTIVE, STATUS_ABANDONED},
    STATUS_PENDING: {STATUS_COMPLETE, STATUS_ACTIVE, STATUS_ABANDONED},
    STATUS_COMPLETE: {STATUS_ACTIVE},
    STATUS_ABANDONED: {STATUS_ACTIVE},
}

_MIGRATED_HOMES: set = set()

TRACKING_SYSTEM_PROMPT = (
    "You check whether the latest assistant turn accomplished any of the user's tracked goals. "
    "Reply with exactly one JSON object, no other text:\n"
    '{"results": [{"id": "<goal id>", "accomplished": true/false, '
    '"confidence": 0.0-1.0, "evidence": "<exact quote from the turn or empty>"}]}\n'
    "Rules: include one result per tracked goal, in the given order. accomplished is true only "
    "when the turn itself achieved the goal's outcome — partial progress is false. evidence must "
    "be an exact substring of the turn text; an empty evidence forces accomplished false. "
    "When unsure, say false with low confidence."
)


class RegistryError(ValueError):
    """Illegal transition, unknown id, or empty title."""


def _now() -> float:
    return time.time()


def _new_id() -> str:
    return uuid.uuid4().hex[:12]


def _db():
    from hermes_cli.goals import _get_session_db
    return _get_session_db()


def _empty_registry() -> Dict[str, Any]:
    return {"version": 1, "goals": []}


def _read_registry() -> List[Dict[str, Any]]:
    """Raw read, no migration. Never raises — a broken store reads empty."""
    try:
        db = _db()
        if db is None:
            return []
        raw = db.get_meta(REGISTRY_META_KEY)
        if not raw:
            return []
        data = json.loads(raw)
        goals = data.get("goals") if isinstance(data, dict) else None
        if not isinstance(goals, list):
            return []
        return [g for g in goals if isinstance(g, dict) and g.get("id")]
    except Exception as exc:
        logger.debug("goal registry load failed: %s", exc)
        return []


def load_registry() -> List[Dict[str, Any]]:
    """All registry entries for this profile (migrating legacy session goals
    once per home per process)."""
    ensure_migrated()
    return _read_registry()


def _save_registry(goals: List[Dict[str, Any]]) -> None:
    db = _db()
    if db is None:
        logger.debug("goal registry save skipped: no session DB")
        return
    db.set_meta(REGISTRY_META_KEY, json.dumps({"version": 1, "goals": goals}))


def _history(ts: float, trigger: str, detail: str = "", evidence: str = "") -> Dict[str, str]:
    entry: Dict[str, str] = {"ts": ts, "trigger": trigger}
    if detail:
        entry["detail"] = detail
    if evidence:
        entry["evidence"] = evidence
    return entry


def _entry(goal_id: str, title: str, contract: Dict[str, str], status: str,
           session_id: Optional[str], trigger: str, detail: str = "") -> Dict[str, Any]:
    now = _now()
    return {
        "id": goal_id,
        "title": title,
        "contract": contract,
        "status": status,
        "session_id": session_id,
        "kanban_task_id": None,
        "history": [_history(now, trigger, detail)],
        "created_at": now,
        "updated_at": now,
    }


def get_entry(goal_id: str) -> Optional[Dict[str, Any]]:
    for goal in load_registry():
        if goal.get("id") == goal_id:
            return goal
    return None


def bound_entry(session_id: str) -> Optional[Dict[str, Any]]:
    """Newest registry entry bound to a session (one live binding wins; older
    bindings for the same session are superseded, never double-counted)."""
    if not session_id:
        return None
    candidates = [g for g in load_registry() if g.get("session_id") == session_id]
    if not candidates:
        return None
    return sorted(candidates, key=lambda g: g.get("updated_at", 0))[-1]


def create_entry(title: str, contract: Optional[Dict[str, str]] = None,
                 session_id: Optional[str] = None) -> Dict[str, Any]:
    title = (title or "").strip()
    if not title:
        raise RegistryError("goal title is empty")
    goals = load_registry()
    entry = _entry(_new_id(), title, dict(contract or {}), STATUS_ACTIVE,
                   session_id, "created",
                   "tracked from session" if session_id else "tracked")
    goals.append(entry)
    _save_registry(goals)
    return entry


def transition(goal_id: str, to_status: str, trigger: str, detail: str = "",
               evidence: str = "") -> Dict[str, Any]:
    """Move one entry, appending history. The single chokepoint: every status
    change in every surface goes through here, so the audit trail is complete."""
    if to_status not in STATUSES:
        raise RegistryError(f"unknown goal status: {to_status}")
    goals = load_registry()
    for goal in goals:
        if goal.get("id") != goal_id:
            continue
        from_status = goal.get("status")
        if to_status not in _TRANSITIONS.get(from_status, set()):
            raise RegistryError(f"cannot move goal from {from_status} to {to_status}")
        goal["status"] = to_status
        goal["updated_at"] = _now()
        history = goal.get("history")
        if not isinstance(history, list):
            history = goal["history"] = []
        history.append(_history(goal["updated_at"], trigger, detail, evidence))
        _save_registry(goals)
        return goal
    raise RegistryError(f"unknown goal id: {goal_id}")


def confirm_entry(goal_id: str) -> Dict[str, Any]:
    """Accept a proposed completion. Pending-only: confirming a goal that is not
    awaiting confirmation is a caller bug, not a transition."""
    entry = get_entry(goal_id)
    if entry is None:
        raise RegistryError(f"unknown goal id: {goal_id}")
    if entry.get("status") != STATUS_PENDING:
        raise RegistryError(f"goal {goal_id} is not awaiting confirmation ({entry.get('status')})")
    return transition(goal_id, STATUS_COMPLETE, "confirmed", "proposal confirmed by user")


def dismiss_proposal(goal_id: str) -> Dict[str, Any]:
    """Reject a proposed completion, resuming tracking. Pending-only."""
    entry = get_entry(goal_id)
    if entry is None:
        raise RegistryError(f"unknown goal id: {goal_id}")
    if entry.get("status") != STATUS_PENDING:
        raise RegistryError(f"goal {goal_id} has no pending proposal ({entry.get('status')})")
    return transition(goal_id, STATUS_ACTIVE, "proposal-dismissed",
                      "proposal rejected; tracking continues")


def reopen_entry(goal_id: str) -> Dict[str, Any]:
    return transition(goal_id, STATUS_ACTIVE, "reopened", "reopened by user (undo)")


def _kanban_body(entry: Dict[str, Any]) -> str:
    """Work-item body for a minted goal: the title, its contract, and the evidence
    history that justified tracking it."""
    lines = [f"Tracked goal: {entry.get('title', '')}"]
    contract = entry.get("contract") or {}
    if isinstance(contract, dict):
        for key in ("objective", "verification", "constraints"):
            value = contract.get(key)
            if value:
                lines.append(f"{key}: {value}")
    evidence = [h.get("evidence") for h in (entry.get("history") or [])
                if isinstance(h, dict) and h.get("evidence")]
    if evidence:
        lines.append("")
        lines.append("Evidence so far:")
        lines.extend(f"- {item}" for item in evidence[-3:])
    lines.append("")
    lines.append(f"Minted from tracked goal {entry.get('id', '')}.")
    return "\n".join(lines)


def dispatch_to_kanban(goal_id: str, *, board: Optional[str] = None,
                       assignee: Optional[str] = None) -> Dict[str, Any]:
    """Explicitly mint a kanban work item from a tracked goal and link it back.

    Goals track *outcomes*, kanban tracks *work*; the link is explicit, never
    automatic — only a user-issued ``/goal dispatch`` (or the pane's Dispatch
    action) reaches here. ``idempotency_key`` is the goal id, so a second call
    returns the same task instead of minting a duplicate.
    """
    entry = get_entry(goal_id)
    if entry is None:
        raise RegistryError(f"unknown goal id: {goal_id}")
    if entry.get("kanban_task_id"):
        return {"task_id": entry["kanban_task_id"], "created": False, "goal": entry}
    from hermes_cli import kanban_db as kb
    from hermes_cli import kanban_db_connect as kbc

    with kbc.connect_closing(board=board) as conn:
        task_id = kb.create_task(
            conn, title=entry.get("title") or "Tracked goal", body=_kanban_body(entry),
            assignee=assignee, created_by="minerva-goals", workspace_kind="scratch",
            idempotency_key=f"goal:{goal_id}",
        )
    return {"task_id": task_id, "created": True, "goal": record_dispatch(goal_id, task_id)}


def record_dispatch(goal_id: str, task_id: str) -> Dict[str, Any]:
    goals = load_registry()
    for goal in goals:
        if goal.get("id") != goal_id:
            continue
        goal["kanban_task_id"] = task_id
        goal["updated_at"] = _now()
        history = goal.get("history")
        if not isinstance(history, list):
            history = goal["history"] = []
        history.append(_history(goal["updated_at"], "dispatched", f"kanban task {task_id}"))
        _save_registry(goals)
        return goal
    raise RegistryError(f"unknown goal id: {goal_id}")


# ── session-loop binding (advisory; never raises into the loop) ─────────────

def _bind_safely(fn: Callable[[], None]) -> None:
    try:
        fn()
    except Exception as exc:
        logger.debug("goal registry binding skipped: %s", exc)


def bind_session_goal(session_id: str, title: str, contract=None) -> None:
    """A session goal was set: create or refresh the bound registry entry."""
    def _bind():
        from hermes_cli.goals import GoalContract
        entry = bound_entry(session_id)
        contract_dict = contract.to_dict() if isinstance(contract, GoalContract) else dict(contract or {})
        if entry is not None and entry.get("status") in (STATUS_ACTIVE, STATUS_PAUSED, STATUS_PENDING):
            goals = load_registry()
            for goal in goals:
                if goal.get("id") == entry["id"]:
                    goal["title"] = (title or "").strip() or goal["title"]
                    goal["contract"] = contract_dict
                    goal["updated_at"] = _now()
                    goal.setdefault("history", []).append(
                        _history(goal["updated_at"], "updated", "re-set from session"))
                    break
            _save_registry(goals)
            return
        create_entry(title, contract_dict, session_id=session_id)
    _bind_safely(_bind)


def session_goal_cleared(session_id: str) -> None:
    """A session goal was cleared: abandon the bound entry (tracked intent
    dropped with the loop; history keeps the reason)."""
    def _clear():
        entry = bound_entry(session_id)
        if entry is not None and entry.get("status") in (STATUS_ACTIVE, STATUS_PAUSED, STATUS_PENDING):
            transition(entry["id"], STATUS_ABANDONED, "session-cleared",
                       "session goal cleared")
    _bind_safely(_clear)


def session_goal_done(session_id: str, reason: str = "") -> None:
    """The session loop judged its goal done: complete the bound entry."""
    def _done():
        entry = bound_entry(session_id)
        if entry is not None and entry.get("status") in (STATUS_ACTIVE, STATUS_PENDING):
            transition(entry["id"], STATUS_COMPLETE, "session-loop",
                       reason or "session judge ruled done")
    _bind_safely(_done)


def session_goal_paused(session_id: str, reason: str = "") -> None:
    """The session goal paused (user or budget): mirror the bound entry as
    paused, so the pane never shows a stalled goal as active."""
    def _pause():
        entry = bound_entry(session_id)
        if entry is not None and entry.get("status") == STATUS_ACTIVE:
            transition(entry["id"], STATUS_PAUSED, "session-paused",
                       reason or "session goal paused")
    _bind_safely(_pause)


def session_goal_resumed(session_id: str) -> None:
    """The session goal resumed: mirror the bound entry back to active."""
    def _resume():
        entry = bound_entry(session_id)
        if entry is not None and entry.get("status") == STATUS_PAUSED:
            transition(entry["id"], STATUS_ACTIVE, "session-resumed", "session goal resumed")
    _bind_safely(_resume)


# ── legacy migration ────────────────────────────────────────────────────────

def ensure_migrated() -> int:
    """Import active/paused legacy session goals once per home per process.
    Returns the number of entries created. Done/cleared rows are history, not
    tracking — they stay where they are."""
    from hermes_constants import get_hermes_home
    try:
        home = str(get_hermes_home())
    except Exception:
        return 0
    if home in _MIGRATED_HOMES:
        return 0
    _MIGRATED_HOMES.add(home)
    try:
        from hermes_cli.goals import GoalState
        db = _db()
        if db is None:
            return 0
        goals = _read_registry()
        bound_sessions = {g.get("session_id") for g in goals if g.get("session_id")}
        created = 0
        for key, raw in db.list_meta_prefix("goal:"):
            session_id = key.split("goal:", 1)[-1]
            if not session_id or session_id in bound_sessions:
                continue
            try:
                state = GoalState.from_json(raw)
            except Exception:
                continue
            if state is None or state.status not in ("active", "paused"):
                continue
            contract = state.contract.to_dict() if state.has_contract() else {}
            entry = _entry(_new_id(), state.goal, contract, STATUS_ACTIVE if state.status == "active" else STATUS_PAUSED,
                           session_id, "migrated", f"imported legacy {state.status} session goal")
            goals.append(entry)
            bound_sessions.add(session_id)
            created += 1
        if created:
            _save_registry(goals)
        return created
    except Exception as exc:
        logger.debug("goal registry migration failed: %s", exc)
        return 0


# ── tracking config ───────────────────────────────────────────────────────

def _tracking_setting(key: str, default, cast):
    """Resolve ``goals.<key>``; garbage falls back to ``default`` rather than
    crashing turn end. Mirrors ``goals._goal_judge_setting`` (which reads the
    auxiliary section); ``load_config()`` is cached so this is cheap."""
    try:
        from hermes_cli.config import load_config

        return cast((load_config().get("goals") or {}).get(key, default))
    except Exception:
        return default


def tracking_enabled() -> bool:
    return bool(_tracking_setting("tracking_enabled", True, bool))


def tracking_auto_complete() -> bool:
    return bool(_tracking_setting("tracking_auto_complete", False, bool))


def tracking_auto_threshold() -> float:
    try:
        value = float(_tracking_setting("tracking_auto_threshold", 0.9, float))
    except (TypeError, ValueError):
        return 0.9
    return min(1.0, max(0.0, value))


# ── turn-end detection ────────────────────────────────────────────────────

_MAX_TURN_CHARS = 4000
_MAX_TOOL_NAMES = 20


def _truncate_turn(text: str) -> str:
    text = text or ""
    if len(text) <= _MAX_TURN_CHARS:
        return text
    return text[:_MAX_TURN_CHARS] + "…[truncated]"


def build_tracking_prompt(entries: List[Dict[str, Any]], last_response: str,
                           tool_names: List[str]) -> List[Dict[str, str]]:
    """Judge input for one turn. ``entries`` are the active registry goals;
    the turn text is capped so a long transcript cannot blow up the cheap
    judge call."""
    lines = []
    for entry in entries:
        lines.append(f"- id: {entry['id']}\n  title: {entry.get('title', '')}")
        contract = entry.get("contract") or {}
        verification = contract.get("verification", "") if isinstance(contract, dict) else ""
        if verification:
            lines.append(f"  done looks like: {verification}")
    tools = ", ".join(tool_names[:_MAX_TOOL_NAMES]) if tool_names else "(no tool names recorded)"
    user = (
        "Tracked goals:\n" + "\n".join(lines)
        + f"\n\nTools used this turn: {tools}"
        + f"\n\nLatest turn text:\n{_truncate_turn(last_response)}"
    )
    return [
        {"role": "system", "content": TRACKING_SYSTEM_PROMPT},
        {"role": "user", "content": user},
    ]


def parse_tracking_reply(text: str) -> Dict[str, Dict[str, Any]]:
    """``{goal_id: {accomplished, confidence, evidence}}``. Unparseable or
    wrong-shaped replies yield {} — detection fails silent, never proposes."""
    try:
        from hermes_cli.goals import _extract_json_object
        data = _extract_json_object(text)
    except Exception:
        return {}
    if not isinstance(data, dict) or not isinstance(data.get("results"), list):
        return {}
    parsed: Dict[str, Dict[str, Any]] = {}
    for result in data["results"]:
        if not isinstance(result, dict) or not result.get("id"):
            continue
        try:
            confidence = float(result.get("confidence", 0.0))
        except (TypeError, ValueError):
            confidence = 0.0
        parsed[str(result["id"])] = {
            "accomplished": bool(result.get("accomplished", False)),
            "confidence": min(1.0, max(0.0, confidence)),
            "evidence": str(result.get("evidence") or ""),
        }
    return parsed


def detect_completions(session_id: str, last_response: str, *, tools_ran: bool,
                       tool_names: Optional[List[str]] = None,
                       judge_fn: Optional[Callable[[str, str], str]] = None) -> List[Dict[str, Any]]:
    """One passive detection pass over the active registry goals. Returns
    proposals ``[{id, title, auto_completed, confidence, evidence}]``. Proposes,
    never completes — unless auto-complete opted in and confidence clears the
    threshold. Any failure (disabled, no candidates, judge error, bad JSON,
    quoteless evidence) yields [] with no state change."""
    if not tools_ran or not tracking_enabled():
        return []
    candidates = [g for g in load_registry() if g.get("status") == STATUS_ACTIVE]
    if not candidates:
        return []
    try:
        messages = build_tracking_prompt(candidates, last_response or "", list(tool_names or []))
        if judge_fn is None:
            from agent.auxiliary_client import call_llm
            from hermes_cli.goals import _call_goal_judge_llm

            raw = _call_goal_judge_llm(call_llm, messages[0]["content"], messages[1]["content"], timeout=30.0)
        else:
            raw = judge_fn(messages[0]["content"], messages[1]["content"])
        turn_text = _truncate_turn(last_response or "")
        verdicts = parse_tracking_reply(raw)
    except Exception as exc:
        logger.debug("goal tracking judge failed: %s", exc)
        return []
    proposals = []
    for entry in candidates:
        verdict = verdicts.get(entry["id"])
        if not verdict or not verdict["accomplished"]:
            continue
        evidence = (verdict["evidence"] or "").strip()
        if not evidence or evidence not in turn_text:
            continue
        auto = tracking_auto_complete() and verdict["confidence"] >= tracking_auto_threshold()
        try:
            if auto:
                transition(entry["id"], STATUS_COMPLETE, "auto-completed",
                           f"confidence {verdict['confidence']:.2f} cleared threshold", evidence)
            else:
                transition(entry["id"], STATUS_PENDING, "proposed",
                           "judge proposed completion; awaiting confirm", evidence)
        except RegistryError as exc:
            logger.debug("goal tracking transition skipped: %s", exc)
            continue
        proposals.append({
            "id": entry["id"],
            "title": entry.get("title", ""),
            "auto_completed": auto,
            "confidence": verdict["confidence"],
            "evidence": evidence,
        })
    return proposals


# ── turn-artifact helpers (shared by the three post-turn surfaces) ─────────

def turn_tool_names(messages: Any) -> List[str]:
    """Tool names the *last* turn called, from a conversation message list.

    Bounded by the last user message, so tool calls from earlier turns never
    leak in and inflate the judge prompt. ``[]`` means the turn ran no tools
    (pure chat) — the caller uses that as the "did tools run" gate, which is
    why the judge is skipped entirely for conversational turns.
    """
    if not isinstance(messages, list):
        return []
    start = 0
    for index, message in enumerate(messages):
        if isinstance(message, dict) and message.get("role") == "user":
            start = index
    names: List[str] = []
    for message in messages[start + 1:]:
        if not isinstance(message, dict) or message.get("role") != "assistant":
            continue
        for call in message.get("tool_calls") or []:
            name = None
            if isinstance(call, dict):
                function = call.get("function")
                name = (function.get("name") if isinstance(function, dict) else None) or call.get("name")
            if name:
                names.append(str(name))
    return names


def track_turn(session_id: str, messages: Any, last_response: str, *,
               judge_fn: Optional[Callable[[str, str], str]] = None) -> List[Dict[str, Any]]:
    """One post-turn detection pass, deriving the tools-ran gate from the turn's
    own messages. Surfaces call this instead of ``detect_completions`` so the
    "no tools → no judge call" rule is identical everywhere."""
    names = turn_tool_names(messages)
    return detect_completions(session_id, last_response, tools_ran=bool(names),
                              tool_names=names, judge_fn=judge_fn)


def render_proposal_notice(proposal: Dict[str, Any]) -> str:
    """One-line user-facing notice for a proposed (or auto) completion. Plain
    text like the existing goal-loop notices in ``goals.py``; the desktop pane
    localizes its own copy separately."""
    title = proposal.get("title") or "goal"
    evidence = (proposal.get("evidence") or "").strip()
    quote = f'\n  "{evidence}"' if evidence else ""
    if proposal.get("auto_completed"):
        return (f"✓ Goal auto-completed: {title}{quote}\n"
                f"  Undo with /goal reopen {proposal.get('id', '')}")
    return (f"⊙ Goal may be complete: {title}{quote}\n"
            f"  /goal confirm {proposal.get('id', '')} · /goal dismiss {proposal.get('id', '')}")

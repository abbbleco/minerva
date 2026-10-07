"""The CLI's /goal semantics, shared by every goal command surface.

Adapters supply authorization and schedule the returned prompt; this module alone
parses subcommands and mutates goal state. It never changes conversation history.
"""
from __future__ import annotations

from dataclasses import dataclass
import logging
from typing import Callable

from hermes_cli import goals

logger = logging.getLogger(__name__)


@dataclass(frozen=True)
class GoalCommandResult:
    output: str
    prompt: str | None = None
    kickoff: bool = False
    clear_pending: str | None = None
    error: bool = False


def _english(key, default, **values):
    return default.format(**values)


def _status(mgr, arg, render):
    return GoalCommandResult(mgr.status_line())


def _show(mgr, arg, render):
    return GoalCommandResult(f"{mgr.status_line()}\n{mgr.render_contract()}")


def _pause(mgr, arg, render):
    state = mgr.pause(reason="user-paused")
    return GoalCommandResult(
        render("gateway.goal.paused", "⏸ Goal paused: {goal}", goal=state.goal) if state
        else render("gateway.goal.no_goal_set", "No goal set."),
        clear_pending="pause" if state else None,
    )


def _resume(mgr, arg, render):
    state = mgr.resume()
    if state is None:
        return GoalCommandResult(render("gateway.goal.no_resume", "No goal to resume."))
    return GoalCommandResult(render("gateway.goal.resumed", "▶ Goal resumed: {goal}", goal=state.goal),
                             prompt=mgr.next_continuation_prompt())


def _clear(mgr, arg, render):
    had = mgr.has_goal()
    mgr.clear()
    return GoalCommandResult(render("gateway.goal_cleared", "✓ Goal cleared.") if had else
                             render("gateway.no_active_goal", "No active goal."), clear_pending="clear")


def _unwait(mgr, arg, render):
    return GoalCommandResult("▶ Wait barrier cleared — goal loop resumes." if mgr.stop_waiting()
                             else "No wait barrier set.")


def _wait(mgr, arg):
    if not arg:
        return GoalCommandResult("Usage: /goal wait <pid> [reason]", error=True)
    tokens = arg.split(None, 1)
    try:
        pid = int(tokens[0])
    except ValueError:
        return GoalCommandResult("/goal wait: <pid> must be an integer process id.", error=True)
    reason = tokens[1].strip() if len(tokens) > 1 else ""
    mgr.wait_on(pid, reason=reason)
    suffix = f" ({reason})" if reason else ""
    return GoalCommandResult(f"⏳ Goal parked on pid {pid}{suffix}. Loop pauses until it exits.")


def _gate_add(mgr, arg):
    gate = mgr.add_gate(arg)
    return GoalCommandResult(f"⚿ Gate added: $ {gate.command} "
                             f"({gate.max_retries} retries, {gate.timeout_seconds}s timeout). "
                             "It must pass before the goal can complete.")


def _gate_remove(mgr, arg):
    return GoalCommandResult(f"✓ Gate removed: $ {mgr.remove_gate(int(arg))}")


def _gate_clear(mgr, arg):
    count = mgr.clear_gates()
    return GoalCommandResult(f"✓ Cleared {count} gate{'s' if count != 1 else ''}.")


_GATE_HANDLERS = {"add": _gate_add, "remove": _gate_remove, "rm": _gate_remove, "clear": _gate_clear}
_EXACT_HANDLERS = {
    "": _status, "status": _status, "show": _show, "pause": _pause,
    "resume": _resume, "clear": _clear, "stop": _clear, "done": _clear, "unwait": _unwait,
}


def _gate(mgr, arg, authorize_gate):
    if not arg or arg.lower() == "list":
        return GoalCommandResult(mgr.render_gates())
    tokens = arg.split(None, 1)
    verb, rest = tokens[0].lower(), tokens[1].strip() if len(tokens) > 1 else ""
    handler = _GATE_HANDLERS.get(verb)
    if handler is None or (verb == "clear" and rest) or (verb != "clear" and not rest):
        return GoalCommandResult("Usage: /goal gate [list | add <command> | remove <N> | clear]", error=True)
    # Gates run shell commands without a later approval. The adapter must explicitly
    # authorize creation; recovery commands remain available to non-admin senders.
    if verb == "add" and (denial := authorize_gate()):
        return GoalCommandResult(denial, error=True)
    try:
        return handler(mgr, rest)
    except (RuntimeError, ValueError, IndexError) as exc:
        operation = "remove" if verb == "rm" else verb
        return GoalCommandResult(f"/goal gate {operation}: {exc}", error=True)


def _set(mgr, arg, *, drafting, last_user_message, render, progress):
    if drafting:
        if not arg:
            return GoalCommandResult("Usage: /goal draft <objective in plain language>", error=True)
        if progress is not None:
            progress("Drafting completion contract…")
        try:
            contract = goals.draft_contract(arg)
        except Exception as exc:
            logger.debug("goal draft failed: %s", exc)
            contract = None
        headline = arg
    else:
        headline, contract = goals.parse_contract(arg)
        contract = contract if not contract.is_empty() else None
    state = mgr.set(headline or arg, contract=contract)
    output = render("gateway.goal.set", "⊙ Goal set ({budget}-turn budget): {goal}",
                    budget=state.max_turns, goal=state.goal)
    if state.has_contract():
        label = "Drafted completion contract:" if drafting else "Completion contract:"
        output += f"\n{label}\n{state.contract.render_block()}"
    if drafting:
        output += ("\nTighten any field by re-setting the goal with inline lines "
                   "(e.g. verify: <command>), then /goal resume. Use /goal show to review."
                   if state.has_contract() else
                   "\nCouldn't draft a contract (aux model unavailable) — running as a "
                   "free-form goal. The per-turn judge still applies.")
    else:
        against = " against the contract above" if state.has_contract() else ""
        output += (f"\nAfter each turn, a judge model checks if the goal is done{against}. "
                   "Minerva keeps working until it is, you pause/clear it, or the budget is "
                   "exhausted. Use /goal status, /goal show, /goal pause, /goal resume, /goal clear.")
    return GoalCommandResult(output, goals.goal_kick_prompt(state.goal, last_user_message), kickoff=True)


# ── Phase-3 registry subcommands ────────────────────────────────────────────
# Plural, named, tracked goals per profile (``hermes_cli.goal_registry``). These
# adapt the registry onto the SAME command surface — no new parser, per the
# slash-command rules. Plain-English output like the /goal gate and /goal wait
# handlers above; the desktop pane localizes its own copy separately.

def _registry_create(arg):
    from hermes_cli import goal_registry
    if not arg.strip():
        return GoalCommandResult("Usage: /goal create <title>", error=True)
    try:
        entry = goal_registry.create_entry(arg)
    except goal_registry.RegistryError as exc:
        return GoalCommandResult(f"/goal create: {exc}", error=True)
    return GoalCommandResult(f"⊙ Tracked goal created ({entry['id']}): {entry['title']}")


def _registry_list(arg):
    from hermes_cli import goal_registry
    goals = goal_registry.load_registry()
    if not goals:
        return GoalCommandResult("No tracked goals. Create one with /goal create <title>.")
    order = {status: index for index, status in enumerate(goal_registry.STATUSES)}
    goals.sort(key=lambda g: (order.get(g.get("status"), 99), -(g.get("updated_at") or 0)))
    lines = ["Tracked goals:"]
    for goal in goals:
        lines.append(f"  [{goal.get('status')}] {goal.get('id')}  {goal.get('title')}")
    return GoalCommandResult("\n".join(lines))


def _registry_show(arg):
    from hermes_cli import goal_registry
    entry = goal_registry.get_entry(arg.strip())
    if entry is None:
        return GoalCommandResult(f"/goal show: unknown tracked goal {arg.strip()!r}", error=True)
    lines = [f"{entry.get('title')}  [{entry.get('status')}]", f"  id: {entry.get('id')}"]
    contract = entry.get("contract") or {}
    if isinstance(contract, dict):
        for key in ("objective", "verification", "constraints"):
            if contract.get(key):
                lines.append(f"  {key}: {contract[key]}")
    if entry.get("session_id"):
        lines.append(f"  session: {entry['session_id']}")
    if entry.get("kanban_task_id"):
        lines.append(f"  kanban: {entry['kanban_task_id']}")
    history = entry.get("history") or []
    if history:
        lines.append("  history:")
        for item in history[-6:]:
            detail = f" — {item['detail']}" if item.get("detail") else ""
            lines.append(f"    {item.get('trigger')}{detail}")
    return GoalCommandResult("\n".join(lines))


def _registry_apply(verb: str, arg: str, action):
    from hermes_cli import goal_registry
    if not arg.strip():
        return GoalCommandResult(f"Usage: /goal {verb} <id>", error=True)
    try:
        entry = action(goal_registry, arg.strip())
    except goal_registry.RegistryError as exc:
        return GoalCommandResult(f"/goal {verb}: {exc}", error=True)
    return GoalCommandResult(f"✓ Goal {entry.get('id')} → {entry.get('status')}: {entry.get('title')}")


def _registry_complete(arg):
    return _registry_apply("complete", arg, lambda r, i: r.transition(
        i, r.STATUS_COMPLETE, "user-completed", "completed by user"))


def _registry_abandon(arg):
    return _registry_apply("abandon", arg, lambda r, i: r.transition(
        i, r.STATUS_ABANDONED, "abandoned", "abandoned by user"))


def _registry_confirm(arg):
    return _registry_apply("confirm", arg, lambda r, i: r.confirm_entry(i))


def _registry_dismiss(arg):
    return _registry_apply("dismiss", arg, lambda r, i: r.dismiss_proposal(i))


def _registry_reopen(arg):
    return _registry_apply("reopen", arg, lambda r, i: r.reopen_entry(i))


def _registry_dispatch(arg):
    from hermes_cli import goal_registry
    if not arg.strip():
        return GoalCommandResult("Usage: /goal dispatch <id>", error=True)
    try:
        result = goal_registry.dispatch_to_kanban(arg.strip())
    except Exception as exc:  # noqa: BLE001 — surface any kanban/registry failure as a message
        return GoalCommandResult(f"/goal dispatch: {exc}", error=True)
    verb = "Minted" if result.get("created") else "Already linked"
    return GoalCommandResult(
        f"⚒ {verb} kanban task {result.get('task_id')} for goal {arg.strip()}.")


_REGISTRY_HANDLERS = {
    "create": _registry_create, "list": _registry_list, "ls": _registry_list,
    "complete": _registry_complete, "abandon": _registry_abandon,
    "confirm": _registry_confirm, "dismiss": _registry_dismiss,
    "reopen": _registry_reopen, "dispatch": _registry_dispatch,
}

_REGISTRY_VERBS = frozenset(_REGISTRY_HANDLERS)


def is_goal_control(arg: str) -> bool:
    """Whether this command controls an existing goal rather than replacing it."""
    normalized = arg.strip().lower()
    verb = normalized.split(None, 1)[0] if normalized else ""
    return normalized in _EXACT_HANDLERS or verb in {"wait", "gate"} or verb in _REGISTRY_VERBS


def dispatch_goal_command(
    mgr: goals.GoalManager, arg: str, *, authorize_gate: Callable[[], str | None],
    last_user_message=None, render: Callable = _english,
    progress: Callable[[str], None] | None = None,
) -> GoalCommandResult:
    """Apply one command. ``authorize_gate`` returns a denial or None (explicit approval).

    Synchronous like GoalManager: async adapters run this off-loop with copied
    ContextVars so draft credentials and persisted I/O stay in the caller's profile.
    """
    arg = arg.strip()
    tokens = arg.split(None, 1)
    verb = tokens[0].lower() if tokens else ""
    rest = tokens[1].strip() if len(tokens) > 1 else ""
    prefix = "Invalid goal"
    try:
        if handler := _EXACT_HANDLERS.get(arg.lower()):
            return handler(mgr, "", render)
        if verb in _REGISTRY_HANDLERS:
            prefix = f"/goal {verb}"
            return _REGISTRY_HANDLERS[verb](rest)
        if verb == "show" and rest:
            prefix = "/goal show"
            return _registry_show(rest)
        if verb == "wait":
            prefix = "/goal wait"
            return _wait(mgr, rest)
        if verb == "gate":
            prefix = "/goal gate"
            return _gate(mgr, rest, authorize_gate)
        return _set(mgr, rest if verb == "draft" else arg,
                    drafting=verb == "draft", last_user_message=last_user_message,
                    render=render, progress=progress)
    except (RuntimeError, ValueError, IndexError) as exc:
        output = (render("gateway.goal.invalid", "Invalid goal: {error}", error=str(exc))
                  if prefix == "Invalid goal" else f"{prefix}: {exc}")
        return GoalCommandResult(output, error=True)

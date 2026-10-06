"""The `/prd` review-queue command semantics, shared by every surface.

Adapters supply the actor and render the returned output; this module alone
parses subcommands and applies review transitions. It never starts turns,
never touches conversation history, and never spends model calls — review is
human judgment over pipeline output.

Verbs: ``list [status]``, ``show <id>``, ``approve <id> [reason]``,
``reject <id> <reason>``. Editing stays in the pane (structured fields don't
fit chat); rejection-with-reason is the chat path for feedback.
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Callable, Optional

from hermes_cli import prd_pipeline


@dataclass(frozen=True)
class PrdCommandResult:
    output: str
    error: bool = False


def _english(key, default, **values):
    return default.format(**values)


def _store():
    from pathlib import Path

    from hermes_constants import get_hermes_home
    from hermes_cli.prd_store import PrdStore
    return PrdStore(Path(get_hermes_home()))


def _short(doc) -> str:
    return f"{doc.id[:8]} [{doc.status}] {doc.title}"


def _list(store, arg: str) -> PrdCommandResult:
    wanted = (arg or "").strip().lower() or None
    docs = store.list_prds(status=wanted) if wanted else store.list_prds()
    if wanted and wanted not in ("draft", "in_review", "approved", "rejected"):
        return PrdCommandResult(f"Unknown status: {wanted}.", error=True)
    if not docs:
        return PrdCommandResult("No PRDs." if not wanted else f"No {wanted} PRDs.")
    order = {"draft": 0, "in_review": 1, "approved": 2, "rejected": 3}
    docs = sorted(docs, key=lambda d: (order.get(d.status, 9), d.id))
    watches = store.list_cases(status="watch")
    lines = [_short(d) for d in docs]
    if watches and not wanted:
        lines.append(f"{len(watches)} conversation(s) watching for more context.")
    return PrdCommandResult("\n".join(lines))


def _show(store, arg: str) -> PrdCommandResult:
    if not arg:
        return PrdCommandResult("Usage: /prd show <id>", error=True)
    doc = store.get_prd(_resolve(store, arg))
    if doc is None:
        return PrdCommandResult(f"Unknown PRD: {arg}.", error=True)
    return PrdCommandResult(doc.to_markdown())


def _resolve(store, ref: str) -> str:
    """Full id or unambiguous id prefix (pane shows short ids)."""
    ref = (ref or "").strip()
    matches = [d.id for d in store.list_prds() if d.id.startswith(ref)]
    if len(matches) == 1:
        return matches[0]
    return ref


def _review(store, arg: str, action: str, actor: str) -> PrdCommandResult:
    if not arg:
        need = " <reason>" if action == "reject" else ""
        return PrdCommandResult(f"Usage: /prd {action} <id>{need}", error=True)
    if action == "reject":
        tokens = arg.split(None, 1)
        if len(tokens) < 2 or not tokens[1].strip():
            return PrdCommandResult("Usage: /prd reject <id> <reason>", error=True)
        ref, reason = tokens[0], tokens[1].strip()
    else:
        tokens = arg.split(None, 1)
        ref, reason = tokens[0], (tokens[1].strip() if len(tokens) > 1 else "")
    try:
        doc = prd_pipeline.review_prd(store, _resolve(store, ref), action, actor, reason=reason)
    except Exception as exc:
        return PrdCommandResult(f"/prd {action}: {exc}", error=True)
    verbs = {"approve": "approved", "reject": "rejected"}
    return PrdCommandResult(f"✓ PRD {verbs[action]}: {doc.title}")


def dispatch_prd_command(arg: str, *, actor: str,
                         render: Callable = _english) -> PrdCommandResult:
    """Apply one `/prd` subcommand against the active profile's store."""
    _ = render
    store = _store()
    arg = (arg or "").strip()
    tokens = arg.split(None, 1)
    verb = tokens[0].lower() if tokens else ""
    rest = tokens[1].strip() if len(tokens) > 1 else ""
    if verb in ("", "list"):
        return _list(store, rest)
    if verb == "show":
        return _show(store, rest)
    if verb in ("approve", "reject"):
        return _review(store, rest, verb, actor)
    return PrdCommandResult(
        "Usage: /prd [list [status] | show <id> | approve <id> [reason] | reject <id> <reason>]",
        error=True)

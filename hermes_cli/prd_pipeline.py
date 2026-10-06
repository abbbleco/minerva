"""Phase 4 orchestration: ingestion seam, review actions, kanban bridge.

``ingest_intake`` is the ONE ingestion function every surface calls — the
gateway turn hook, the dashboard REST ``POST /api/prds/intake``, manual
paste/file injection, and (Phase 5) the portal's public form endpoint. Auth,
rate limiting and premium gating stay in those callers; this module only
stores intake and optionally triages immediately. Storing is synchronous and
fast (the Phase-5 latency budget); triage is the caller's choice via
``triage_now`` (the portal defers it to its async enqueue).

Privacy: intake content is the most sensitive data in the system. Nothing
here logs event text — failures log shapes (counts, ids), never content.

Review actions (``review_prd``): start / approve / reject / revise. Approve
and reject auto-hop through ``in_review`` when invoked on a draft, so both
transitions land in history even for one-click approvals. Nothing reaches
the kanban bridge without passing review: ``dispatch_approved`` refuses
non-approved documents, mints idempotently (``idempotency_key``), and records
the task link on the triage case.
"""

from __future__ import annotations

import logging
import time
from typing import Any, Callable, Dict, List, Optional, Tuple

logger = logging.getLogger(__name__)

REVIEW_ACTIONS = ("start", "approve", "reject", "revise")


def _prds_setting(key: str, default, cast):
    try:
        from hermes_cli.config import load_config

        return cast((load_config().get("prds") or {}).get(key, default))
    except Exception:
        return default


def triage_min_events() -> int:
    try:
        return max(1, int(_prds_setting("triage_min_events", 1, int)))
    except (TypeError, ValueError):
        return 1


def ingest_intake(store, *, source: str, text: str = "", author_id: str = "",
                  author_name: str = "", conversation_id: Optional[str] = None,
                  attachments: Optional[List[Any]] = None,
                  thread_context: Optional[List[str]] = None,
                  triage_now: bool = True,
                  judge_fn: Optional[Callable[[str, str], str]] = None,
                  writer_fn: Optional[Callable[[str, str], str]] = None) -> Tuple[Dict[str, Any], Optional[Dict[str, Any]]]:
    """Store one intake event, optionally triage its conversation now.
    Returns ``(event_dict, case_or_None)``. ``conversation_id`` defaults to
    the event's own id (single-shot submissions — forms, pastes — triage as
    their own conversation). Attachment objects (or dicts) run through the
    Phase-0 pipeline; transcripts land on the event, never in logs."""
    from hermes_cli.attachments import process_attachment
    from hermes_cli.intake import IntakeAttachment, IntakeEvent

    processed = []
    for attachment in attachments or []:
        item = attachment if isinstance(attachment, IntakeAttachment) else IntakeAttachment.from_dict(attachment)
        result = process_attachment(item)
        if not result.ok:
            logger.debug("prd ingest: attachment skipped (%s)", result.error)
            continue
        processed.append(result.attachment)

    event = IntakeEvent.create(
        source=source, text=text or "", author_id=author_id, author_name=author_name,
        attachments=processed,
        conversation_id=conversation_id or "",
        thread_context=[t for t in (thread_context or []) if t],
    )
    if not event.conversation_id:
        event = IntakeEvent.from_dict({**event.to_dict(), "conversation_id": event.id})
    stored = store.append_intake(event.to_dict())

    case = None
    if triage_now:
        from hermes_cli import prd_triage
        case = prd_triage.triage_conversation(
            store, stored["conversation_id"], judge_fn=judge_fn, writer_fn=writer_fn)
    return stored, case


def observe_gateway_turn(session_id: str, platform: str, user_text: str,
                         assistant_text: str = "",
                         judge_fn: Optional[Callable[[str, str], str]] = None,
                         writer_fn: Optional[Callable[[str, str], str]] = None) -> Optional[Dict[str, Any]]:
    """Gateway turn-end hook: premium-gated, stores the turn as intake,
    triages when the conversation grew since the last verdict. Returns the
    case (or None when skipped). Never raises into the turn loop."""
    if not (user_text or "").strip() and not (assistant_text or "").strip():
        return None
    try:
        from hermes_cli import nous_billing, prd_triage
        from hermes_cli.prd_store import PrdStore

        try:
            nous_billing.require_premium_tier(nous_billing.get_subscription_state())
        except Exception:
            return None
        if not prd_triage.triage_enabled():
            return None
        store = PrdStore()
        prior = store.case_for_conversation(session_id)
        known = set(prior.get("event_ids", []) if prior else [])
        ingest_intake(
            store, source=platform, text=user_text or "",
            conversation_id=session_id,
            thread_context=[assistant_text] if (assistant_text or "").strip() else [],
            triage_now=False, judge_fn=judge_fn, writer_fn=writer_fn)
        current = {e.get("id") for e in store.list_intake(session_id)}
        if current <= known:
            return prior
        if len(current) < triage_min_events():
            return prior
        return prd_triage.triage_conversation(store, session_id, judge_fn=judge_fn,
                                             writer_fn=writer_fn)
    except Exception as exc:
        logger.debug("prd observe_turn skipped: %s", exc)
        return None


def track_turn(session_id: str, source: Any, user_text: str, final_response: str) -> Optional[Dict[str, Any]]:
    """Gateway hook entry: derive the platform from the source and observe
    the turn. Slash-command turns are control plane, not product discussion —
    they skip intake entirely (no junk events, no judge spend). Returns the
    triage case only when a draft was minted *by this turn* (a previously
    shipped conversation re-triaged stays quiet); the caller announces that
    once. Never raises."""
    try:
        if (user_text or "").strip().startswith("/"):
            return None
        from hermes_cli.prd_store import PrdStore
        prior = PrdStore().case_for_conversation(session_id)
        prior_prd = (prior.get("prd_id") if prior else None) or ""
        platform = getattr(source, "platform", None)
        platform_name = getattr(platform, "value", None) or str(platform or "unknown")
        case = observe_gateway_turn(session_id, platform_name, user_text or "",
                                    final_response or "")
        if (case is not None and case.get("status") == "drafted" and case.get("prd_id")
                and case.get("prd_id") != prior_prd):
            return case
        return None
    except Exception as exc:
        logger.debug("prd track_turn skipped: %s", exc)
        return None


def review_prd(store, prd_id: str, action: str, actor: str, reason: str = "",
               field: str = "", value: Any = None):
    """Review-queue action. ``actor`` is ``reviewer:<id>``. Approve/reject on
    a draft auto-hop through ``in_review`` so the full path is audited.
    Raises ``PrdError`` on illegal moves or frozen-state edits."""
    from hermes_cli.prd import PrdError

    if action not in REVIEW_ACTIONS:
        raise PrdError(f"unknown review action: {action}")
    doc = store.get_prd(prd_id)
    if doc is None:
        raise PrdError(f"unknown PRD: {prd_id}")
    if action == "revise":
        doc.revise_section(field, value, actor=actor)
    elif action == "start":
        doc.transition("in_review", actor=actor, reason=reason or "review started")
    elif action == "approve":
        if doc.status == "draft":
            doc.transition("in_review", actor=actor, reason="review started (auto on approve)")
        doc.transition("approved", actor=actor, reason=reason or "approved")
    elif action == "reject":
        if doc.status == "draft":
            doc.transition("in_review", actor=actor, reason="review started (auto on reject)")
        if not (reason or "").strip():
            raise PrdError("rejection needs a reason (triage tuning signal)")
        doc.transition("rejected", actor=actor, reason=reason)
    store.save_prd(doc)
    return doc


def dispatch_approved(store, prd_id: str, *, author: str) -> Dict[str, Any]:
    """Mint a kanban triage task from an approved PRD and decompose it.
    Idempotent two ways: the triage case link (normal path — triage always
    links the case when it drafts) and a ``dispatched`` note in the document
    history (covers documents minted outside triage, which have no case).
    Either returns the recorded task instead of minting again. The kanban
    ``idempotency_key`` guards the race beneath both. Refuses non-approved
    documents."""
    import re

    from hermes_cli.prd import PrdError, PrdTransition

    doc = store.get_prd(prd_id)
    if doc is None:
        raise PrdError(f"unknown PRD: {prd_id}")
    if doc.status != "approved":
        raise PrdError(f"only approved PRDs dispatch (got {doc.status})")
    case = next((c for c in store.list_cases() if c.get("prd_id") == prd_id), None)
    if case is not None and case.get("kanban_task_id"):
        return {"task_id": case["kanban_task_id"], "created": False,
                "child_ids": list(case.get("kanban_child_ids", []))}
    for transition in doc.history:
        match = re.search(r"dispatched kanban task (\S+)", transition.reason or "")
        if match:
            return {"task_id": match.group(1), "created": False, "child_ids": []}

    from hermes_cli import kanban_db, kanban_decompose
    from hermes_cli.kanban_db_connect import connect_closing

    with connect_closing() as conn:
        task_id = kanban_db.create_task(
            conn, title=doc.title, body=doc.to_markdown(),
            created_by=author, triage=True, idempotency_key=f"prd-{prd_id}")
    try:
        outcome = kanban_decompose.decompose_task(task_id, author=author)
        child_ids = list(outcome.child_ids or []) if outcome.ok else []
        decompose_note = "" if outcome.ok else f" (decompose pending: {outcome.reason})"
    except Exception as exc:
        child_ids, decompose_note = [], f" (decompose failed: {exc})"
    note = f"dispatched kanban task {task_id} (+{len(child_ids)} children){decompose_note}"
    doc.history.append(PrdTransition(at=time.time(), from_status=doc.status,
                                     to_status=doc.status, actor=author, reason=note))
    store.save_prd(doc)
    if case is not None:
        case["kanban_task_id"] = task_id
        case["kanban_child_ids"] = child_ids
        history = case.get("reason_history") or []
        history.append(note)
        case["reason_history"] = history[-10:]
        store.save_case(case)
    logger.debug("prd dispatched %s -> task %s%s", prd_id, task_id, decompose_note)
    return {"task_id": task_id, "created": True, "child_ids": child_ids}

"""Phase 4 triage gate: the smart part of the PRD pipeline.

One classifier over each *conversation* (never a single message), with the
intelligence concentrated here exactly so the pipeline does not mint a PRD
per conversation. The judge returns a scalar strength plus an optional
duplicate link; thresholds live in config (``prds.draft_threshold`` /
``watch_threshold``), never in the prompt, so tuning never rewrites prompts.

Outcomes: **draft** (strength clears the high bar — the drafting writer takes
it from here), **watch** (ambiguous — the case accumulates context and is
re-evaluated on new intake), **dismiss** (with the reason logged on the case;
rejections are tuning signal, not silence). Duplicates dismiss against the
existing PRD id. Unparseable judge output fails toward **watch** (recall over
precision; the review queue shows watches, so nothing vanishes silently).

Dedupe is judge-based, not embedding-based: there is no reusable embedding
client in the tree, and PRD titles (+ one-line problems) fit dozens to a
prompt. The candidate set is capped (``prds.dedupe_max_prds``, most recent).
"""

from __future__ import annotations

import logging
import uuid
from typing import Any, Callable, Dict, List, Optional

logger = logging.getLogger(__name__)

TRIAGE_SYSTEM_PROMPT = (
    "You triage one conversation for PRD-worthiness. Reply with exactly one JSON object, no other text:\n"
    '{"strength": 0.0-1.0, "reason": "<one sentence>", '
    '"title": "<short feature title or empty>", "duplicate_of": "<PRD id or empty>"}\n'
    "strength is how strongly this conversation warrants a written PRD: explicit requests to "
    "build/change something, sustained multi-turn problem discussion, explicit \"we should\" "
    "language, or a repeated topic score high; chit-chat, resolved Q&A, and status updates score "
    "near zero. duplicate_of names an existing PRD (by id, from the list given) when this "
    "conversation asks for the same thing — never invent an id. When unsure, score low."
)

_MAX_EVENTS_PER_TRIAGE = 30
_MAX_EVENT_CHARS = 12000


def _triage_setting(key: str, default, cast):
    try:
        from hermes_cli.config import load_config

        return cast((load_config().get("prds") or {}).get(key, default))
    except Exception:
        return default


def triage_enabled() -> bool:
    return bool(_triage_setting("triage_enabled", True, bool))


def draft_threshold() -> float:
    try:
        return min(1.0, max(0.0, float(_triage_setting("draft_threshold", 0.85, float))))
    except (TypeError, ValueError):
        return 0.85


def watch_threshold() -> float:
    try:
        return min(1.0, max(0.0, float(_triage_setting("watch_threshold", 0.5, float))))
    except (TypeError, ValueError):
        return 0.5


def dedupe_max_prds() -> int:
    try:
        return max(1, int(_triage_setting("dedupe_max_prds", 30, int)))
    except (TypeError, ValueError):
        return 30


def _render_events(events: List[Dict[str, Any]]) -> str:
    chunks = []
    total = 0
    for event in events[-_MAX_EVENTS_PER_TRIAGE:]:
        text = str(event.get("text", "") or "")
        thread = event.get("thread_context") or []
        block = text
        if thread:
            block += "\n" + "\n".join(str(t) for t in thread if t)
        block = block.strip()
        if not block:
            continue
        if total + len(block) > _MAX_EVENT_CHARS:
            block = block[: max(0, _MAX_EVENT_CHARS - total)] + "…[truncated]"
        chunks.append(f"[event {event.get('id', '?')}]\n{block}")
        total += len(block)
        if total >= _MAX_EVENT_CHARS:
            break
    return "\n\n".join(chunks)


def build_triage_prompt(events: List[Dict[str, Any]], existing_prds: List,
                        prior_reason: str = "") -> List[Dict[str, str]]:
    """Judge input: the conversation's intake so far, candidate PRDs for
    duplicate linking, and the prior watch reason (if re-evaluating)."""
    prd_lines = []
    for doc in existing_prds[-dedupe_max_prds():]:
        problem = (doc.problem or "").strip().splitlines()
        prd_lines.append(f"- id: {doc.id}\n  title: {doc.title}\n  problem: {problem[0][:200] if problem else ''}")
    user = "Conversation intake:\n" + (_render_events(events) or "(empty)")
    if prd_lines:
        user += "\n\nExisting PRDs (link duplicates by id):\n" + "\n".join(prd_lines)
    else:
        user += "\n\nExisting PRDs: none."
    if prior_reason:
        user += f"\n\nPrior evaluation (re-check with the new context): {prior_reason}"
    return [
        {"role": "system", "content": TRIAGE_SYSTEM_PROMPT},
        {"role": "user", "content": user},
    ]


def parse_triage_reply(text: str) -> Dict[str, Any]:
    """``{strength, reason, title, duplicate_of}``; garbage → strength 0
    (caller maps that to dismiss — except the pipeline maps judge *transport*
    failure to watch; see ``triage_conversation``)."""
    try:
        from hermes_cli.goals import _extract_json_object
        data = _extract_json_object(text)
    except Exception:
        return {"strength": 0.0, "reason": "unparseable judge reply", "title": "", "duplicate_of": ""}
    if not isinstance(data, dict):
        return {"strength": 0.0, "reason": "unparseable judge reply", "title": "", "duplicate_of": ""}
    try:
        strength = min(1.0, max(0.0, float(data.get("strength", 0.0))))
    except (TypeError, ValueError):
        strength = 0.0
    return {
        "strength": strength,
        "reason": str(data.get("reason") or "no reason given"),
        "title": str(data.get("title") or ""),
        "duplicate_of": str(data.get("duplicate_of") or ""),
    }


def triage_conversation(store, conversation_id: str,
                        judge_fn: Optional[Callable[[str, str], str]] = None,
                        writer_fn: Optional[Callable[[str, str], str]] = None) -> Dict[str, Any]:
    """Evaluate one conversation and persist the case (and the drafted PRD,
    when the bar clears). Returns the case dict. Never raises: transport
    failure becomes a watch case (retry on new intake), and a drafting
    failure downgrades a would-be draft to watch with the reason kept."""
    from hermes_cli import prd_drafting
    from hermes_cli.prd_store import CASE_DISMISSED, CASE_DRAFTED, CASE_WATCH

    events = store.list_intake(conversation_id)
    prior = store.case_for_conversation(conversation_id)
    if prior is not None and prior.get("status") == CASE_DRAFTED and prior.get("prd_id"):
        return prior
    if not events:
        return store.save_case({
            "id": prior["id"] if prior else f"case-{uuid.uuid4().hex[:12]}",
            "conversation_id": conversation_id,
            "status": CASE_WATCH,
            "reason": "no intake yet",
            "event_ids": [],
            "triage_count": (prior.get("triage_count", 0) if prior else 0) + 1,
        })

    known_ids = set()
    try:
        existing = store.list_prds()
    except Exception:
        existing = []
    known_ids = {d.id for d in existing}
    try:
        messages = build_triage_prompt(events, existing, (prior.get("reason", "") if prior else ""))
        if judge_fn is None:
            from agent.auxiliary_client import call_llm
            from hermes_cli.goals import _call_goal_judge_llm

            raw = _call_goal_judge_llm(call_llm, messages[0]["content"], messages[1]["content"], timeout=120.0)
        else:
            raw = judge_fn(messages[0]["content"], messages[1]["content"])
        verdict = parse_triage_reply(raw)
    except Exception as exc:
        logger.debug("prd triage judge failed: %s", exc)
        return _save_watch(store, prior, conversation_id, events, f"judge unavailable: {exc}")

    strength, reason = verdict["strength"], verdict["reason"]
    duplicate_of = verdict["duplicate_of"] if verdict["duplicate_of"] in known_ids else ""
    if duplicate_of and strength >= draft_threshold():
        return _save_dismiss(store, prior, conversation_id, events,
                             f"duplicate of {duplicate_of}: {reason}", prd_id=duplicate_of)
    if strength >= draft_threshold():
        try:
            return _draft(store, prior, conversation_id, events, verdict, writer_fn)
        except Exception as exc:
            logger.debug("prd drafting failed, watching instead: %s", exc)
            return _save_watch(store, prior, conversation_id, events, f"draft failed: {exc}")
    if strength >= watch_threshold():
        return _save_watch(store, prior, conversation_id, events, reason)
    return _save_dismiss(store, prior, conversation_id, events, reason)


def _event_ids(events: List[Dict[str, Any]]) -> List[str]:
    return [str(e.get("id")) for e in events if e.get("id")]


def _save_watch(store, prior, conversation_id, events, reason) -> Dict[str, Any]:
    from hermes_cli.prd_store import CASE_WATCH
    history = list((prior.get("reason_history") or []) if prior else [])
    if prior and prior.get("reason"):
        history.append(prior["reason"])
    return store.save_case({
        "id": prior["id"] if prior else f"case-{uuid.uuid4().hex[:12]}",
        "conversation_id": conversation_id,
        "status": CASE_WATCH,
        "reason": reason,
        "reason_history": history[-10:],
        "event_ids": _event_ids(events),
        "prd_id": prior.get("prd_id") if prior else None,
        "triage_count": (prior.get("triage_count", 0) if prior else 0) + 1,
    })


def _save_dismiss(store, prior, conversation_id, events, reason, prd_id=None) -> Dict[str, Any]:
    from hermes_cli.prd_store import CASE_DISMISSED
    return store.save_case({
        "id": prior["id"] if prior else f"case-{uuid.uuid4().hex[:12]}",
        "conversation_id": conversation_id,
        "status": CASE_DISMISSED,
        "reason": reason,
        "event_ids": _event_ids(events),
        "prd_id": prd_id or (prior.get("prd_id") if prior else None),
        "triage_count": (prior.get("triage_count", 0) if prior else 0) + 1,
    })


def _draft(store, prior, conversation_id, events, verdict, writer_fn=None) -> Dict[str, Any]:
    from hermes_cli import prd_drafting
    from hermes_cli.prd_store import CASE_DRAFTED
    doc, section_sources = prd_drafting.draft_prd(
        events, title_hint=verdict["title"] or None, writer_fn=writer_fn)
    store.save_prd(doc)
    return store.save_case({
        "id": prior["id"] if prior else f"case-{uuid.uuid4().hex[:12]}",
        "conversation_id": conversation_id,
        "status": CASE_DRAFTED,
        "reason": verdict["reason"],
        "event_ids": _event_ids(events),
        "prd_id": doc.id,
        "section_sources": section_sources,
        "triage_count": (prior.get("triage_count", 0) if prior else 0) + 1,
    })

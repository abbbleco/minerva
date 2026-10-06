"""Phase 4 drafting writer: conversation intake → cited PRD document.

Takes over only after the triage gate clears the draft bar. The writer
produces the Phase-0 PRD schema (problem, users, requirements, acceptance
criteria, open questions) with every non-empty section citing its source
intake events — sources are clickable back to the original conversation
because citations are intake-event ids, never embedded copies.

Validation is strict and the writer gets no second chance inside one call:
missing sections, empty requirements/acceptance, citations to unknown events,
or a section with no citation raises ``DraftError``. The caller (triage)
downgrades that to a watch case with the reason kept, so a weak writer
retries on richer context instead of shipping a sourceless PRD.

Section-level citation maps ride alongside the document (stored on the
triage case, not in ``PrdDocument`` — the schema stays frozen).
"""

from __future__ import annotations

import logging
from typing import Any, Callable, Dict, List, Optional, Tuple

logger = logging.getLogger(__name__)

DRAFTER_SYSTEM_PROMPT = (
    "You write a product requirements document from a conversation. Reply with exactly one "
    "JSON object, no other text:\n"
    '{"title": "<short feature title>", "problem": "<2-4 sentences>", '
    '"users": "<who is affected>", "requirements": ["<must 1>", ...], '
    '"acceptance_criteria": ["<checkable 1>", ...], "open_questions": ["<q 1>", ...], '
    '"section_sources": {"problem": ["<event id>"], "users": [...], "requirements": [...], '
    '"acceptance_criteria": [...], "open_questions": [...]}}'
    "\nRules: requirements and acceptance_criteria each need at least one entry; acceptance "
    "criteria must be checkable (observable behavior, not effort). Every non-empty section "
    "must cite at least one of the given event ids in section_sources; cite only ids from "
    "the intake below — never invent one. open_questions may be empty (cite nothing then). "
    "Write for a builder who never saw the conversation."
)

SECTIONS = ("problem", "users", "requirements", "acceptance_criteria", "open_questions")
_LIST_SECTIONS = ("requirements", "acceptance_criteria", "open_questions")

_MAX_EVENTS_PER_DRAFT = 40
_MAX_EVENT_CHARS = 20000


class DraftError(ValueError):
    """Writer output failed schema or citation validation."""


def _render_events(events: List[Dict[str, Any]]) -> str:
    chunks = []
    total = 0
    for event in events[-_MAX_EVENTS_PER_DRAFT:]:
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


def build_draft_prompt(events: List[Dict[str, Any]], title_hint: Optional[str] = None) -> List[Dict[str, str]]:
    user = "Conversation intake:\n" + (_render_events(events) or "(empty)")
    if title_hint:
        user += f"\n\nWorking title: {title_hint}"
    return [
        {"role": "system", "content": DRAFTER_SYSTEM_PROMPT},
        {"role": "user", "content": user},
    ]


def _as_list(value: Any) -> List[str]:
    if isinstance(value, list):
        return [str(v).strip() for v in value if str(v).strip()]
    if isinstance(value, str) and value.strip():
        return [value.strip()]
    return []


def parse_draft_reply(text: str, event_ids: List[str]) -> Tuple[Dict[str, Any], Dict[str, List[str]]]:
    """Validate writer output → (``PrdDocument`` kwargs, section_sources).
    Raises ``DraftError`` with the concrete defect (logged by the caller as a
    reason, never with intake content)."""
    try:
        from hermes_cli.goals import _extract_json_object
        data = _extract_json_object(text)
    except Exception:
        raise DraftError("writer returned unparseable output")
    if not isinstance(data, dict):
        raise DraftError("writer returned unparseable output")

    title = str(data.get("title") or "").strip()
    problem = str(data.get("problem") or "").strip()
    if not title:
        raise DraftError("writer omitted the title")
    if not problem:
        raise DraftError("writer omitted the problem statement")
    users = str(data.get("users") or "").strip()
    requirements = _as_list(data.get("requirements"))
    acceptance = _as_list(data.get("acceptance_criteria"))
    questions = _as_list(data.get("open_questions"))
    if not requirements:
        raise DraftError("writer produced no requirements")
    if not acceptance:
        raise DraftError("writer produced no acceptance criteria")

    known = set(event_ids)
    raw_sources = data.get("section_sources")
    section_sources: Dict[str, List[str]] = {}
    if not isinstance(raw_sources, dict):
        raise DraftError("writer omitted section_sources")
    sections = {"problem": problem, "users": users, "requirements": requirements,
                "acceptance_criteria": acceptance, "open_questions": questions}
    for section in SECTIONS:
        cited = [str(i) for i in (raw_sources.get(section) or []) if str(i)]
        unknown = [i for i in cited if i not in known]
        if unknown:
            raise DraftError(f"writer cited unknown events in {section}: {unknown}")
        content = sections[section]
        if content and not cited:
            raise DraftError(f"section {section} has no cited source")
        section_sources[section] = cited

    doc_kwargs = {
        "title": title, "problem": problem, "users": users,
        "requirements": requirements, "acceptance_criteria": acceptance,
        "open_questions": questions,
        "sources": sorted(known),
    }
    return doc_kwargs, section_sources


def _drafter_setting(key: str, default, cast):
    try:
        from hermes_cli.config import load_config

        return cast((load_config().get("prds") or {}).get(key, default))
    except Exception:
        return default


def drafter_max_tokens() -> int:
    try:
        return max(500, int(_drafter_setting("drafter_max_tokens", 4000, int)))
    except (TypeError, ValueError):
        return 4000


def draft_prd(events: List[Dict[str, Any]], title_hint: Optional[str] = None,
              writer_fn: Optional[Callable[[str, str], str]] = None):
    """Run the writer over intake events → (``PrdDocument`` draft, section
    sources). The document is created (not yet stored — the caller persists
    it with the triage case). Raises ``DraftError`` on any defect."""
    from hermes_cli.prd import PrdDocument

    event_ids = [str(e.get("id")) for e in events if e.get("id")]
    if not event_ids:
        raise DraftError("no intake events to draft from")
    messages = build_draft_prompt(events, title_hint)
    if writer_fn is None:
        from agent.auxiliary_client import call_llm

        resp = call_llm(
            task="prd_drafter",
            messages=messages,
            temperature=None,
            max_tokens=drafter_max_tokens(),
            timeout=300.0,
        )
        try:
            raw = resp.choices[0].message.content or ""
        except Exception:
            raw = ""
    else:
        raw = writer_fn(messages[0]["content"], messages[1]["content"])
    doc_kwargs, section_sources = parse_draft_reply(raw, event_ids)
    return PrdDocument.create_draft(actor="triage", **doc_kwargs), section_sources

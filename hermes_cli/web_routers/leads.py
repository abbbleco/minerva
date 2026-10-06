"""LEADS dashboard routes (premium).

Directory of human contacts plus the reply box. Thin adapter layer: contact
derivation lives in ``hermes_cli/leads.py``; sending reuses the
``send_message_tool`` standalone path (chunking, per-platform senders) with
the target resolved server-side from the contact — the client names a
contact, never a chat id, so target spoofing is structurally impossible.

Every route re-checks premium entitlement server-side. Replies send as the
connected bot account (stated in the pane) and touch ``last_read_at``.
"""
import asyncio
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from hermes_cli.web_deps import late
from hermes_cli.web_routers._common import log as _log

router = APIRouter()

_profile_scope = late("_profile_scope", "hermes_cli.web_server_profiles")

MAX_REPLY_CHARS = 4000
DETAIL_MESSAGE_LIMIT = 20


def _check_premium() -> str:
    from hermes_cli import nous_billing
    try:
        state = nous_billing.get_subscription_state()
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"billing state unavailable: {exc}")
    try:
        return nous_billing.require_premium_tier(state)
    except nous_billing.PremiumRequiredError as exc:
        raise HTTPException(status_code=402, detail={"error": "premium_required", "message": str(exc)})


def _public_contact(contact: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "id": contact.get("id"),
        "display_name": contact.get("display_name"),
        "platform": contact.get("platform"),
        "channels": [
            {k: c.get(k) for k in ("platform", "chat_type", "chat_id", "thread_id",
                                   "scope_id", "session_key", "last_active")}
            for c in contact.get("channels", [])
        ],
        "emails": list(contact.get("emails", [])),
        "phones": list(contact.get("phones", [])),
        "first_seen_at": contact.get("first_seen_at", 0),
        "last_seen_at": contact.get("last_seen_at", 0),
        "snippet": contact.get("snippet", ""),
        "snippet_at": contact.get("snippet_at", 0),
        "unread": contact.get("unread", 0),
        "muted": contact.get("muted", False),
        "pinned": contact.get("pinned", False),
        "note": contact.get("note", ""),
        "also_on": list(contact.get("also_on", [])),
        "merged_into": contact.get("merged_into"),
        "merged_from": list(contact.get("merged_from", [])),
    }


def _mutable_contact(contact_id: str) -> Dict[str, Any]:
    """Contact by id, with a guiding 404 for merged-away ids (reply, patch
    and show all act on visible contacts; the hint names the target)."""
    from hermes_cli import leads
    contact = leads.get_contact(contact_id)
    if contact is not None:
        return contact
    target = leads.get_overrides().get(contact_id, {}).get("merged_into")
    if target:
        raise HTTPException(status_code=404,
                            detail=f"contact merged into {target} — unmerge it first")
    raise HTTPException(status_code=404, detail=f"unknown contact: {contact_id}")


class OverrideBody(BaseModel):
    muted: Optional[bool] = None
    pinned: Optional[bool] = None
    note: Optional[str] = None
    merged_into: Optional[str] = None


class ReplyBody(BaseModel):
    contact_id: str = ""
    text: str = ""


@router.get("/api/leads")
async def list_leads(profile: Optional[str] = None, platform: Optional[str] = None,
                     include_muted: bool = False):
    def _run():
        with _profile_scope(profile):
            _check_premium()
            from hermes_cli import leads
            contacts = leads.list_contacts(include_muted=include_muted)
            if platform:
                contacts = [c for c in contacts if c.get("platform") == platform.lower()]
            return {"contacts": [_public_contact(c) for c in contacts]}
    try:
        return await asyncio.to_thread(_run)
    except HTTPException:
        raise
    except Exception as exc:
        _log.exception("GET /api/leads failed")
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/api/leads/{contact_id}")
async def show_lead(contact_id: str, profile: Optional[str] = None):
    def _run():
        with _profile_scope(profile):
            _check_premium()
            contact = _mutable_contact(contact_id)
            messages = _recent_messages(contact)
            return {"contact": _public_contact(contact), "messages": messages}
    try:
        return await asyncio.to_thread(_run)
    except HTTPException:
        raise
    except Exception as exc:
        _log.exception("GET /api/leads/{id} failed")
        raise HTTPException(status_code=500, detail=str(exc))


def _recent_messages(contact: Dict[str, Any]) -> List[Dict[str, Any]]:
    """Bounded recent messages across the contact's DM channels (newest
    last). Snippet-level fields only — the sessions endpoints serve full
    transcripts; the inbox needs recency, not archives."""
    from hermes_state_registry import acquire, release_or_close
    out: List[tuple] = []
    try:
        db = acquire()
        try:
            for channel in contact.get("channels", []) or []:
                if channel.get("chat_type") not in (None, "dm", "form"):
                    continue
                session_id = str(channel.get("session_id") or "")
                if not session_id:
                    continue
                try:
                    rows = db.get_messages(session_id, limit=DETAIL_MESSAGE_LIMIT, latest=True)
                except Exception:
                    continue
                for row in rows or []:
                    text = leads_text(row.get("content"))
                    if not text:
                        continue
                    try:
                        stamp = float(row.get("timestamp") or 0)
                    except (TypeError, ValueError):
                        stamp = 0.0
                    out.append((stamp, {"role": str(row.get("role") or ""),
                                        "text": text[:2000], "timestamp": stamp}))
        finally:
            release_or_close(db)
    except Exception as exc:
        _log.debug("leads recent messages unavailable: %s", exc)
    out.sort(key=lambda item: item[0])
    return [message for _, message in out[-DETAIL_MESSAGE_LIMIT:]]


def leads_text(content: Any) -> str:
    if isinstance(content, str):
        return content.strip()
    if isinstance(content, list):
        parts = []
        for block in content:
            if isinstance(block, dict):
                text = block.get("text")
                parts.append(text if isinstance(text, str) else str(block.get("content", "")))
            elif block:
                parts.append(str(block))
        return "\n".join(p for p in parts if p).strip()
    return "" if content is None else str(content).strip()


@router.patch("/api/leads/{contact_id}")
async def patch_lead(contact_id: str, body: OverrideBody, profile: Optional[str] = None):
    def _run():
        with _profile_scope(profile):
            _check_premium()
            from hermes_cli import leads
            if body.merged_into is not None:
                return _merge_action(contact_id, body.merged_into)
            contact = _mutable_contact(contact_id)
            entry = leads.set_override(contact_id, muted=body.muted,
                                       pinned=body.pinned, note=body.note)
            contact = leads.get_contact(contact_id)
            return {"override": entry, "contact": _public_contact(contact) if contact else None}
    try:
        return await asyncio.to_thread(_run)
    except HTTPException:
        raise
    except Exception as exc:
        _log.exception("PATCH /api/leads/{id} failed")
        raise HTTPException(status_code=500, detail=str(exc))


def _merge_action(source_id: str, target: str) -> Dict[str, Any]:
    """Merge/unmerge mechanics. Merge works on visible contacts AND on
    already-merged ones (re-linking); only totally unknown ids 404. The
    merged-away source vanishes from listings, so merge returns the target
    and unmerge returns the restored source."""
    from hermes_cli import leads
    if not target:
        if not leads.unmerge_contact(source_id):
            raise HTTPException(status_code=400, detail="contact is not merged")
        contact = leads.get_contact(source_id)
        return {"override": {}, "contact": _public_contact(contact) if contact else None}
    visible = leads.get_contact(source_id)
    merged_away = leads.get_overrides().get(source_id, {}).get("merged_into")
    if visible is None and not merged_away:
        raise HTTPException(status_code=404, detail=f"unknown contact: {source_id}")
    if leads.get_contact(target) is None:
        raise HTTPException(status_code=404, detail=f"unknown merge target: {target}")
    try:
        leads.merge_contacts(source_id, target)
    except leads.MergeError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    merged = leads.get_contact(target)
    return {"override": {"merged_into": target},
            "contact": _public_contact(merged) if merged else None}


@router.get("/api/leads/{contact_id}/intake")
async def lead_intake(contact_id: str, profile: Optional[str] = None):
    """Source intake events behind a contact's form channels (the deep link
    from a form lead back to its submissions). Bounded, text-capped, newest
    last — the same shape the PRD show endpoint serves its events in."""
    def _run():
        with _profile_scope(profile):
            _check_premium()
            from pathlib import Path

            from hermes_constants import get_hermes_home
            from hermes_cli.prd_store import PrdStore
            contact = _mutable_contact(contact_id)
            conversations = {str(c.get("conversation_id") or "")
                             for c in contact.get("channels", [])
                             if (c.get("chat_type") or "") == "form"}
            conversations.discard("")
            if not conversations:
                return {"events": []}
            store = PrdStore(Path(get_hermes_home()))
            events = []
            for conversation in sorted(conversations):
                for event in store.list_intake(conversation):
                    events.append({
                        "id": event.get("id"),
                        "text": str(event.get("text") or "")[:2000],
                        "conversation_id": event.get("conversation_id"),
                    })
            return {"events": events[:20]}
    try:
        return await asyncio.to_thread(_run)
    except HTTPException:
        raise
    except Exception as exc:
        _log.exception("GET /api/leads/{id}/intake failed")
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/api/leads/reply")
async def reply_lead(body: ReplyBody, profile: Optional[str] = None):
    def _run():
        with _profile_scope(profile):
            _check_premium()
            return _send_reply((body.contact_id or "").strip(), body.text or "")
    try:
        return await asyncio.to_thread(_run)
    except HTTPException:
        raise
    except Exception as exc:
        _log.exception("POST /api/leads/reply failed")
        raise HTTPException(status_code=500, detail=str(exc))


def _send_reply(contact_id: str, text: str) -> Dict[str, Any]:
    """Resolve contact → newest DM channel → platform sender. The channel
    (platform/chat/thread) always comes from our session rows, never the
    client — the request names a contact and carries text, nothing else."""
    from hermes_cli import leads

    if not contact_id:
        raise HTTPException(status_code=400, detail="contact_id is required")
    text = (text or "").strip()
    if not text:
        raise HTTPException(status_code=400, detail="reply text is required")
    if len(text) > MAX_REPLY_CHARS:
        raise HTTPException(status_code=400,
                            detail=f"reply is too long (max {MAX_REPLY_CHARS} characters)")
    contact = _mutable_contact(contact_id)
    dm_channels = [c for c in contact.get("channels", [])
                   if (c.get("chat_type") or "dm") == "dm" and c.get("chat_id")]
    if not dm_channels:
        if any((c.get("chat_type") or "") in ("group", "channel", "forum")
               for c in contact.get("channels", [])):
            raise HTTPException(status_code=400, detail="group chats are read-only in v1")
        raise HTTPException(status_code=400, detail="contact has no chat channel (form leads reply by email)")
    channel = sorted(dm_channels, key=lambda c: c.get("last_active") or 0, reverse=True)[0]

    from gateway.config import load_gateway_config
    from tools.send_message_tool import (
        _authorize_relay_target, _resolve_platform_config, _send_to_platform,
    )
    try:
        config = load_gateway_config()
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"gateway config unavailable: {exc}")
    platform_name = str(channel.get("platform") or "")
    platform, pconfig, _entry, err = _resolve_platform_config(platform_name, config)
    if err:
        raise HTTPException(status_code=409, detail=err)
    denial = _authorize_relay_target(
        platform_name, str(channel.get("chat_id") or ""),
        str(channel.get("thread_id") or "") or None,
        native_token=getattr(pconfig, "token", None))
    if denial:
        raise HTTPException(status_code=409, detail=denial)
    from model_tools import _run_async
    try:
        result = _run_async(_send_to_platform(
            platform, pconfig, str(channel.get("chat_id") or ""), text,
            thread_id=str(channel.get("thread_id") or "") or None))
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"send failed: {exc}")
    if not isinstance(result, dict) or not result.get("success"):
        detail = ""
        if isinstance(result, dict):
            detail = str(result.get("error") or "")
        raise HTTPException(status_code=502, detail=f"delivery failed{': ' + detail if detail else ''}")
    session_id = str(channel.get("session_id") or "")
    if session_id:
        leads.mark_channel_read(session_id)
    return {"ok": True, "contact_id": contact_id,
            "platform": platform_name, "chat_id": channel.get("chat_id")}

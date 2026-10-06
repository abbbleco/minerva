"""LEADS directory backend (plan phase 1): derive human contacts.

Contacts are DERIVED from rows that already exist — gateway session rows
(human peers), pairing approvals (names), and local website-form intake
events (email/phone) — never captured by a new writer. Derivation cannot
disagree with the source of truth, and there is no table to rot when
sessions move. The only stored user data is small overrides (mute/pin/note)
in ``state_meta`` (``leads:overrides:v1``); everything else is computed per
read, bounded and profile-scoped by the home's own ``state.db``.

Privacy law of this feature: this module persists NOTHING about message
content — routing keys (platform/chat/thread/user) plus bounded metadata
only. Snippets and unread counts are read at render from the session's own
messages and never copied here.

Contact keys (stable: ``c_`` + id prefix doubles as the overrides key):
WhatsApp DMs key on digit-stripped JID user parts (``@lid`` aliases stay
distinct — same-human merge is an explicit later action, never heuristic);
groups key per chat; Slack keys on team+user; Discord/Telegram on user id
(groups per chat); forms key on lowercased email.
"""

from __future__ import annotations

import hashlib
import json
import logging
import re
import time
from typing import Any, Callable, Dict, List, Optional

logger = logging.getLogger(__name__)

LEADS_OVERRIDES_KEY = "leads:overrides:v1"
MAX_CONTACTS = 200
SNIPPET_CHARS = 140
MESSAGES_PER_CONTACT = 5
FORM_SOURCE = "website-form"

_NON_DIGITS_RE = re.compile(r"\D+")


def _digits(text: str) -> str:
    return _NON_DIGITS_RE.sub("", text or "")


def _stable_id(key: str) -> str:
    return "c_" + hashlib.sha1(key.encode("utf-8")).hexdigest()[:12]


def contact_key(platform: str, chat_type: str, chat_id: str,
                user_id: str, scope_id: str = "") -> Optional[str]:
    """Stable per-channel contact key, or None when the row names no human
    (bot peers and identity-less rows never become contacts)."""
    platform = (platform or "").lower()
    if not user_id:
        return None
    if platform == "whatsapp":
        if chat_type == "group" or "@g.us" in (chat_id or ""):
            return f"whatsapp:group:{chat_id}" if chat_id else None
        user_part = user_id.split("@")[0]
        number = _digits(user_part)
        if not number:
            return None
        return f"whatsapp:{number}"
    if platform in ("whatsapp_cloud", "whatsapp-cloud"):
        number = _digits(user_id)
        return f"whatsapp:{number}" if number else None
    if platform == "slack":
        return f"slack:{scope_id or ''}:{user_id}"
    if platform == "discord":
        return f"discord:{user_id}"
    if platform == "telegram":
        if chat_type in ("group", "channel", "forum"):
            return f"telegram:group:{chat_id}" if chat_id else None
        return f"telegram:{user_id}"
    return f"{platform}:{user_id}" if platform else None


def _text_content(content: Any) -> str:
    if isinstance(content, str):
        return content
    if isinstance(content, list):
        parts = []
        for block in content:
            if isinstance(block, dict):
                text = block.get("text")
                parts.append(text if isinstance(text, str) else str(block.get("content", "")))
            elif block:
                parts.append(str(block))
        return "\n".join(p for p in parts if p).strip()
    return "" if content is None else str(content)


def snippet_for(messages: List[Dict[str, Any]], peer_name: str = "") -> tuple[str, float]:
    """Newest non-empty text (any role) capped to a bounded prefix. Returns
    ``(snippet, timestamp)``; empty when the transcript has no text."""
    for message in reversed(messages or []):
        text = _text_content(message.get("content")).strip()
        if not text:
            continue
        first_line = text.splitlines()[0].strip()
        if len(first_line) > SNIPPET_CHARS:
            first_line = first_line[:SNIPPET_CHARS] + "…"
        role = str(message.get("role") or "")
        if peer_name and role == "user":
            first_line = f"{peer_name}: {first_line}"[: SNIPPET_CHARS + len(peer_name) + 3]
        try:
            stamp = float(message.get("timestamp") or 0)
        except (TypeError, ValueError):
            stamp = 0.0
        return first_line, stamp
    return "", 0.0


def derive_contacts(session_rows: List[Dict[str, Any]],
                    messages_by_session: Dict[str, List[Dict[str, Any]]],
                    intake_events: List[Dict[str, Any]],
                    pairing_names: Dict[tuple, str],
                    overrides: Dict[str, Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Pure derivation: session rows + supporting data → contact dicts.
    The I/O layer (``list_contacts``) fetches; everything decidable lives
    here so tests run without a database."""
    contacts: Dict[str, Dict[str, Any]] = {}

    def ensure(key: str, platform: str) -> Dict[str, Any]:
        contact = contacts.get(key)
        if contact is None:
            contact = {
                "id": _stable_id(key), "key": key, "platform": platform,
                "display_name": "", "channels": [], "emails": [], "phones": [],
                "first_seen_at": 0.0, "last_seen_at": 0.0,
                "snippet": "", "snippet_at": 0.0, "unread": 0,
                "muted": False, "pinned": False, "note": "", "also_on": [],
                "merged_into": None, "merged_from": [],
            }
            contacts[key] = contact
        return contact

    for row in session_rows:
        origin = row.get("origin") or {}
        platform = str(origin.get("platform") or row.get("source") or "").lower()
        chat_type = str(origin.get("chat_type") or row.get("chat_type") or "dm")
        chat_id = str(origin.get("chat_id") or row.get("chat_id") or "")
        user_id = str(origin.get("user_id") or row.get("user_id") or "")
        if origin.get("is_bot"):
            continue
        scope_id = str(origin.get("scope_id") or origin.get("guild_id") or "")
        key = contact_key(platform, chat_type, chat_id, user_id, scope_id)
        if key is None:
            continue
        contact = ensure(key, platform)
        if key.startswith("whatsapp:") and not key.startswith("whatsapp:group:"):
            number = key.split(":", 1)[1]
            if number and number not in contact["phones"]:
                contact["phones"].append(number)
        user_name = str(origin.get("user_name") or "").strip()
        paired = pairing_names.get((platform, user_id), "")
        chat_name = str(origin.get("chat_name") or row.get("display_name") or "").strip()
        if chat_type == "dm":
            candidate = user_name or paired or chat_name
            if candidate:
                contact["display_name"] = candidate
        else:
            candidate = chat_name or user_name or paired
            if candidate and not contact["display_name"]:
                contact["display_name"] = candidate
        session_id = str(row.get("session_id") or row.get("id") or "")
        try:
            last_active = float(row.get("last_active") or row.get("last_activity_at") or 0)
        except (TypeError, ValueError):
            last_active = 0.0
        try:
            started = float(row.get("started_at") or 0)
        except (TypeError, ValueError):
            started = 0.0
        channel = {
            "platform": platform, "chat_type": chat_type, "chat_id": chat_id,
            "thread_id": str(origin.get("thread_id") or row.get("thread_id") or "") or None,
            "scope_id": scope_id or None,
            "session_key": str(row.get("session_key") or ""),
            "session_id": session_id, "last_active": last_active,
        }
        if all(c.get("session_key") != channel["session_key"] or not channel["session_key"]
               for c in contact["channels"]):
            contact["channels"].append(channel)
        if last_active > contact["last_seen_at"]:
            contact["last_seen_at"] = last_active
        if started and (not contact["first_seen_at"] or started < contact["first_seen_at"]):
            contact["first_seen_at"] = started
        messages = messages_by_session.get(session_id, [])
        snippet, stamp = snippet_for(messages, contact["display_name"])
        if stamp >= contact["snippet_at"] and snippet:
            contact["snippet"] = snippet
            contact["snippet_at"] = stamp
        try:
            last_read = row.get("last_read_at")
            last_read = float(last_read) if last_read is not None else None
        except (TypeError, ValueError):
            last_read = None
        if last_read is not None:
            contact["unread"] = contact.get("unread", 0) + sum(
                1 for m in messages
                if _stamp(m) > last_read and str(m.get("role") or "") == "user")

    for event in intake_events or []:
        if str(event.get("source") or "") != FORM_SOURCE:
            continue
        email = str(event.get("author_id") or "").strip().lower()
        if "@" not in email:
            continue
        key = f"form:{email}"
        contact = ensure(key, "form")
        org = str(event.get("author_name") or "").strip()
        if org and not contact["display_name"]:
            contact["display_name"] = org
        if not contact["display_name"]:
            contact["display_name"] = email
        if email not in contact["emails"]:
            contact["emails"].append(email)
        phone = _phone_from_contact_thread(event.get("thread_context") or [])
        if phone and phone not in contact["phones"]:
            contact["phones"].append(phone)
        conversation = str(event.get("conversation_id") or event.get("id") or "")
        if conversation and all(c.get("conversation_id") != conversation for c in contact["channels"]):
            contact["channels"].append({
                "platform": "form", "chat_type": "form", "chat_id": conversation,
                "thread_id": None, "scope_id": None, "session_key": "",
                "session_id": "", "conversation_id": conversation, "last_active": 0.0,
            })
        try:
            stamp = time.mktime(time.strptime(str(event.get("timestamp") or "")[:19], "%Y-%m-%dT%H:%M:%S"))
        except (TypeError, ValueError):
            stamp = 0.0
        if stamp > contact["last_seen_at"]:
            contact["last_seen_at"] = stamp
            text = str(event.get("text") or "").strip().splitlines()
            if text:
                contact["snippet"] = text[0][:SNIPPET_CHARS]

    for contact in contacts.values():
        override = overrides.get(contact["id"], {})
        contact["muted"] = bool(override.get("muted", False))
        contact["pinned"] = bool(override.get("pinned", False))
        contact["note"] = str(override.get("note", ""))
        contact["merged_into"] = None
        contact["merged_from"] = []
        if not contact["display_name"]:
            contact["display_name"] = contact["key"]

    _attach_sharing_hints(contacts)

    merged = _apply_merges(list(contacts.values()), overrides)
    ordered = sorted(merged,
                     key=lambda c: (not c["pinned"], c["muted"], -c["last_seen_at"]))
    return ordered


def _attach_sharing_hints(contacts: Dict[str, Dict[str, Any]]) -> None:
    """Cross-channel 'also on' hints: contacts sharing an email or phone get
    a hint each way (display only — merging stays an explicit later action,
    never heuristic)."""
    by_email: Dict[str, List[Dict[str, Any]]] = {}
    by_phone: Dict[str, List[Dict[str, Any]]] = {}
    for contact in contacts.values():
        for email in contact.get("emails", []):
            by_email.setdefault(str(email).lower(), []).append(contact)
        for phone in contact.get("phones", []):
            by_phone.setdefault(_digits(str(phone)), []).append(contact)
    for contact in contacts.values():
        hints: Dict[str, Dict[str, str]] = {}
        for email in contact.get("emails", []):
            for other in by_email.get(str(email).lower(), []):
                if other["id"] != contact["id"]:
                    hints[other["id"]] = {"contact_id": other["id"],
                                         "display_name": other["display_name"],
                                         "via": f"email {email}"}
        for phone in contact.get("phones", []):
            for other in by_phone.get(_digits(str(phone)), []):
                if other["id"] != contact["id"] and other["id"] not in hints:
                    hints[other["id"]] = {"contact_id": other["id"],
                                         "display_name": other["display_name"],
                                         "via": f"phone {phone}"}
        contact["also_on"] = sorted(hints.values(), key=lambda h: h["display_name"])


def _stamp(message: Dict[str, Any]) -> float:
    try:
        return float(message.get("timestamp") or 0)
    except (TypeError, ValueError):
        return 0.0


def _phone_from_contact_thread(thread_context: Any) -> str:
    """Phone the drain wrote into the contact line (``tel <phone>`` inside a
    ``Submitted by …`` line). Parses only our own format — anything else is
    not a phone, however dialable it looks."""
    lines = thread_context if isinstance(thread_context, list) else []
    for line in lines:
        text = str(line or "")
        if not text.startswith("Submitted by"):
            continue
        # Our drain format always puts the phone last ("… / tel <phone>"),
        # so the remainder of the line after the marker IS the number.
        _, _, tail = text.partition("tel ")
        candidate = tail.strip().rstrip(",;")
        if candidate:
            return candidate
    return ""


# ── I/O layer ─────────────────────────────────────────────────────────────

def _db():
    from hermes_cli.goals import _get_session_db
    return _get_session_db()


def get_overrides() -> Dict[str, Dict[str, Any]]:
    try:
        db = _db()
        if db is None:
            return {}
        raw = db.get_meta(LEADS_OVERRIDES_KEY)
        data = json.loads(raw) if raw else {}
        return data if isinstance(data, dict) else {}
    except Exception as exc:
        logger.debug("leads overrides load failed: %s", exc)
        return {}


def set_override(contact_id: str, *, muted: Optional[bool] = None,
                 pinned: Optional[bool] = None, note: Optional[str] = None,
                 merged_into: Optional[str] = None) -> Dict[str, Any]:
    """Upsert one contact's overrides. ``merged_into`` merges this contact
    away (use ``""`` to clear); merging itself is validated in
    ``merge_contacts`` — this stays a dumb store. Never raises (a broken
    store degrades to in-memory)."""
    overrides = get_overrides()
    entry = dict(overrides.get(contact_id, {}))
    if muted is not None:
        entry["muted"] = bool(muted)
    if pinned is not None:
        entry["pinned"] = bool(pinned)
    if note is not None:
        entry["note"] = str(note)
    if merged_into is not None:
        if merged_into:
            entry["merged_into"] = str(merged_into)
        else:
            entry.pop("merged_into", None)
    overrides[contact_id] = entry
    try:
        db = _db()
        if db is not None:
            db.set_meta(LEADS_OVERRIDES_KEY, json.dumps(overrides))
    except Exception as exc:
        logger.debug("leads overrides save failed: %s", exc)
    return entry


class MergeError(ValueError):
    """Illegal merge (unknown id, self-merge, target merged away)."""


def merge_contacts(source_id: str, target_id: str) -> Dict[str, str]:
    """Merge source away into target (explicit, user-issued). Validates, then
    records the link; the fold itself happens at read time in
    ``derive``/``list`` so unmerge is lossless. Cycles are structurally
    impossible: a merged-away contact can never be a target."""
    if not source_id or not target_id:
        raise MergeError("source and target contact ids are required")
    if source_id == target_id:
        raise MergeError("cannot merge a contact into itself")
    overrides = get_overrides()
    if overrides.get(target_id, {}).get("merged_into"):
        raise MergeError("merge target is itself merged away — unmerge it first")
    set_override(source_id, merged_into=target_id)
    return {"source_id": source_id, "target_id": target_id}


def unmerge_contact(source_id: str) -> bool:
    """Release a merged-away contact. Returns False when it wasn't merged."""
    overrides = get_overrides()
    if not overrides.get(source_id, {}).get("merged_into"):
        return False
    set_override(source_id, merged_into="")
    return True


def _apply_merges(contacts: List[Dict[str, Any]],
                  overrides: Dict[str, Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Fold merged-away contacts into their targets (channels/emails/phones
    union, newest snippet, summed unread, widest span). Sources vanish from
    the listing; targets gain a ``merged_from`` roll for unmerge UI."""
    by_id = {c["id"]: c for c in contacts}
    absorbed: Dict[str, List[Dict[str, str]]] = {}
    for contact in contacts:
        target_id = overrides.get(contact["id"], {}).get("merged_into")
        target = by_id.get(target_id or "")
        if not target or target["id"] == contact["id"]:
            continue
        if overrides.get(target["id"], {}).get("merged_into"):
            continue
        target["channels"] = _union_channels(target["channels"], contact["channels"])
        for field in ("emails", "phones"):
            seen = set(target[field])
            for value in contact[field]:
                if value not in seen:
                    seen.add(value)
                    target[field].append(value)
        if contact["last_seen_at"] > target["last_seen_at"]:
            target["last_seen_at"] = contact["last_seen_at"]
        if contact["first_seen_at"] and (not target["first_seen_at"]
                                         or contact["first_seen_at"] < target["first_seen_at"]):
            target["first_seen_at"] = contact["first_seen_at"]
        if contact["snippet_at"] >= target["snippet_at"] and contact["snippet"]:
            target["snippet"] = contact["snippet"]
            target["snippet_at"] = contact["snippet_at"]
        target["unread"] = target.get("unread", 0) + contact.get("unread", 0)
        absorbed.setdefault(target["id"], []).append(
            {"id": contact["id"], "display_name": contact["display_name"]})
        contact["merged_into"] = target["id"]
    for contact in contacts:
        if contact["id"] in absorbed:
            contact["merged_from"] = sorted(absorbed[contact["id"]],
                                            key=lambda e: e["display_name"])
    return [c for c in contacts if not c.get("merged_into")]


def _union_channels(left: List[Dict[str, Any]],
                    right: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    seen = set()
    out = []
    for channel in list(left) + list(right):
        key = (str(channel.get("session_key") or ""),
               str(channel.get("conversation_id") or ""),
               str(channel.get("chat_id") or ""))
        if key in seen:
            continue
        seen.add(key)
        out.append(channel)
    return out


def _pairing_names() -> Dict[tuple, str]:
    try:
        from gateway.pairing import PairingStore
        return {(str(p.get("platform") or "").lower(), str(p.get("user_id") or "")): str(p.get("user_name") or "")
                for p in PairingStore().list_approved()
                if p.get("user_id")}
    except Exception as exc:
        logger.debug("leads pairing names unavailable: %s", exc)
        return {}


def _form_events() -> List[Dict[str, Any]]:
    try:
        from hermes_constants import get_hermes_home
        from hermes_cli.prd_store import PrdStore
        from pathlib import Path
        events = PrdStore(Path(get_hermes_home())).list_intake()
        return [e for e in events if isinstance(e, dict) and e.get("source") == FORM_SOURCE]
    except Exception as exc:
        logger.debug("leads form events unavailable: %s", exc)
        return []


def list_contacts(*, include_muted: bool = False, limit: int = MAX_CONTACTS) -> List[Dict[str, Any]]:
    """All contacts for the active profile, newest first (pinned lead).
    Never raises — a broken store reads empty, like every sibling surface."""
    try:
        from hermes_state_registry import acquire, release_or_close
        db = acquire()
        try:
            lister = getattr(db, "list_gateway_sessions", None)
            rows = lister(active_only=False) if callable(lister) else []
        finally:
            release_or_close(db)
    except Exception as exc:
        logger.debug("leads session rows unavailable: %s", exc)
        rows = []
    try:
        rows = sorted(rows, key=lambda r: float(r.get("last_active") or 0), reverse=True)
    except Exception:
        pass
    for row in rows:
        if isinstance(row.get("origin"), dict):
            continue
        try:
            origin = json.loads(row.get("origin_json") or "") or {}
        except (TypeError, ValueError):
            origin = {}
        if not isinstance(origin, dict) or not origin:
            origin = {
                "platform": row.get("source"),
                "chat_id": row.get("chat_id"),
                "thread_id": row.get("thread_id"),
                "chat_name": row.get("display_name"),
                "user_id": row.get("user_id"),
            }
        row["origin"] = origin
    messages_by_session: Dict[str, List[Dict[str, Any]]] = {}
    try:
        db = acquire()
        try:
            for row in rows[:limit]:
                session_id = str(row.get("session_id") or row.get("id") or "")
                if not session_id:
                    continue
                try:
                    messages_by_session[session_id] = db.get_messages(
                        session_id, limit=MESSAGES_PER_CONTACT, latest=True)
                except Exception:
                    messages_by_session[session_id] = []
        finally:
            release_or_close(db)
    except Exception as exc:
        logger.debug("leads messages unavailable: %s", exc)
    contacts = derive_contacts(rows, messages_by_session, _form_events(),
                               _pairing_names(), get_overrides())
    if not include_muted:
        contacts = [c for c in contacts if not c["muted"]]
    return contacts[:limit]


def get_contact(contact_id: str) -> Optional[Dict[str, Any]]:
    for contact in list_contacts(include_muted=True, limit=MAX_CONTACTS):
        if contact.get("id") == contact_id:
            return contact
    return None


def mark_channel_read(session_id: str) -> bool:
    """Stamp a channel's session read (a sent reply marks the conversation
    read). Never raises."""
    if not session_id:
        return False
    try:
        db = _db()
        if db is None:
            return False
        return bool(db.set_session_read(session_id, True))
    except Exception as exc:
        logger.debug("leads mark-read failed: %s", exc)
        return False

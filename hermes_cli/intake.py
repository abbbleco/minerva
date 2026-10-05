"""Canonical intake events: "something arrived that might become work".

Every producer — gateway platform adapters (via :class:`MessageEvent`), the
desktop (paste/upload/voice-note), the website form proxy — normalizes into
this shape. Every consumer (feed summarizer, PRD triage, goal evidence)
reads this shape. Nothing downstream may reach back into platform specifics.

Attachments carry a ``bytes_ref`` (local path or URL the pipeline can fetch),
never inline bytes: an intake event must stay small enough to log, queue and
embed. The attachment pipeline (``hermes_cli/attachments.py``) resolves refs
into ``{transcript, summary}`` before triage runs.
"""
from __future__ import annotations

import uuid
from dataclasses import asdict, dataclass, field
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional


ATTACHMENT_KINDS = frozenset({"image", "audio", "file"})

# Upper bounds keep a single event loggable and embeddable. Larger content
# stays behind ``bytes_ref``; triage reads the transcript, not the bytes.
MAX_TEXT_CHARS = 200_000
MAX_THREAD_MESSAGES = 50


class IntakeError(ValueError):
    """An intake event failed validation."""


@dataclass(frozen=True)
class IntakeAttachment:
    """One non-text payload. ``transcript``/``summary`` start empty and are
    filled by the attachment pipeline; downstream consumers must tolerate both
    empty (not yet processed) and set."""
    kind: str  # "image" | "audio" | "file"
    mime: str
    bytes_ref: str
    transcript: str = ""
    summary: str = ""

    def validate(self) -> None:
        if self.kind not in ATTACHMENT_KINDS:
            raise IntakeError(f"attachment kind must be one of {sorted(ATTACHMENT_KINDS)}")
        if not self.mime or not self.bytes_ref:
            raise IntakeError("attachment needs a mime type and a bytes_ref")
        if len(self.transcript) > MAX_TEXT_CHARS or len(self.summary) > MAX_TEXT_CHARS:
            raise IntakeError("attachment transcript/summary exceeds size cap")

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "IntakeAttachment":
        attachment = cls(
            kind=str(data.get("kind", "")),
            mime=str(data.get("mime", "")),
            bytes_ref=str(data.get("bytes_ref", "")),
            transcript=str(data.get("transcript", "")),
            summary=str(data.get("summary", "")),
        )
        attachment.validate()
        return attachment


@dataclass(frozen=True)
class IntakeEvent:
    """One normalized arrival. Immutable: downstream stages derive new data
    (triage verdicts, drafts) rather than mutating the event."""
    id: str
    source: str  # platform name ("telegram", "discord", ...) or origin ("desktop-paste", "form", "voice-note", ...)
    author_id: Optional[str]
    author_name: Optional[str]
    timestamp: str  # ISO-8601
    text: str
    attachments: List[IntakeAttachment] = field(default_factory=list)
    conversation_id: Optional[str] = None
    thread_context: List[str] = field(default_factory=list)

    def validate(self) -> None:
        if not self.id:
            raise IntakeError("intake event needs an id")
        if not self.source:
            raise IntakeError("intake event needs a source")
        if len(self.text) > MAX_TEXT_CHARS:
            raise IntakeError("intake event text exceeds size cap")
        if len(self.thread_context) > MAX_THREAD_MESSAGES:
            raise IntakeError("intake thread context exceeds message cap")
        for attachment in self.attachments:
            attachment.validate()

    def to_dict(self) -> Dict[str, Any]:
        data = asdict(self)
        data["attachments"] = [a.to_dict() for a in self.attachments]
        return data

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "IntakeEvent":
        event = cls(
            id=str(data.get("id", "")),
            source=str(data.get("source", "")),
            author_id=data.get("author_id"),
            author_name=data.get("author_name"),
            timestamp=str(data.get("timestamp", "")),
            text=str(data.get("text", "")),
            attachments=[IntakeAttachment.from_dict(a) for a in (data.get("attachments") or [])],
            conversation_id=data.get("conversation_id"),
            thread_context=[str(m) for m in (data.get("thread_context") or [])],
        )
        event.validate()
        return event

    @classmethod
    def create(
        cls,
        *,
        source: str,
        text: str = "",
        author_id: Optional[str] = None,
        author_name: Optional[str] = None,
        attachments: Optional[List[IntakeAttachment]] = None,
        conversation_id: Optional[str] = None,
        thread_context: Optional[List[str]] = None,
    ) -> "IntakeEvent":
        """Build a new event with a fresh id and timestamp. Prefer this over
        hand-rolling ids at call sites, so ids stay unique by construction."""
        event = cls(
            id=uuid.uuid4().hex,
            source=source,
            author_id=author_id,
            author_name=author_name,
            timestamp=datetime.now(timezone.utc).isoformat(),
            text=text,
            attachments=list(attachments or []),
            conversation_id=conversation_id,
            thread_context=list(thread_context or []),
        )
        event.validate()
        return event

    @classmethod
    def from_message_event(cls, event: Any) -> "IntakeEvent":
        """Map a gateway :class:`MessageEvent` onto the canonical shape.

        Reads only the documented public fields (``text``, ``user_id``,
        ``user_name``, ``message_id``, ``media_urls`` + ``media_types``,
        ``reply_to_*``, ``source``). Platform-specific payloads in
        ``raw_message`` are deliberately dropped: downstream must never depend
        on them.
        """
        source = event.source
        platform = getattr(source, "platform", None)
        platform_name = getattr(platform, "value", None) or str(platform or "unknown")
        attachments: List[IntakeAttachment] = []
        for url, mime in zip(
            getattr(event, "media_urls", None) or [],
            getattr(event, "media_types", None) or [],
        ):
            kind = "image" if (mime or "").startswith("image/") else (
                "audio" if (mime or "").startswith("audio/") else "file")
            attachments.append(IntakeAttachment(kind=kind, mime=mime or "application/octet-stream",
                                                bytes_ref=url))
        thread_context = [t for t in (
            getattr(event, "reply_to_text", None),
        ) if t]
        return cls.create(
            source=platform_name,
            text=getattr(event, "text", "") or "",
            author_id=getattr(event, "user_id", None),
            author_name=getattr(event, "user_name", None),
            attachments=attachments,
            conversation_id=getattr(event, "message_id", None),
            thread_context=thread_context,
        )

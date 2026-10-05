"""Attachment pipeline: resolve intake attachments into text.

Dispatcher, not an implementation: audio goes to the existing STT path,
plain-text documents are read inline, and everything needing model access
(images via vision, PDFs/office docs via extraction) is marked for downstream
in-turn analysis. Triage and drafting read transcripts; they must never
re-implement this routing.

Two hard rules:
- Never raise on content failure. An unprocessable attachment yields
  ``ok=False`` with a reason, and the intake event still flows. Intake is a
  funnel, not a filter.
- Never inline bytes into the event. Transcripts are capped text; originals
  stay behind ``bytes_ref``.
"""
from __future__ import annotations

import os
import tempfile
import urllib.parse
import urllib.request
from dataclasses import dataclass
from typing import Optional

from hermes_cli.intake import IntakeAttachment

# Transcripts stay loggable and embeddable; the rest remains behind bytes_ref.
MAX_TRANSCRIPT_CHARS = 50_000
# Remote fetch guard: intake must not become an SSRF oracle or a disk filler.
MAX_FETCH_BYTES = 25 * 1024 * 1024
FETCH_TIMEOUT_SECONDS = 30

TEXT_MIMES = ("text/", "application/json", "application/xml", "application/javascript")
TEXT_EXTENSIONS = (".txt", ".md", ".markdown", ".json", ".yaml", ".yml", ".csv", ".log")


@dataclass
class AttachmentResult:
    """Outcome for one attachment. ``attachment`` carries any filled
    transcript/summary; ``needs_model_analysis`` tells downstream to analyze
    in-turn (vision for images, extraction for documents)."""
    attachment: IntakeAttachment
    ok: bool
    error: Optional[str] = None
    needs_model_analysis: bool = False


def _fetch_remote(ref: str) -> str:
    """Fetch an http(s) bytes_ref into a temp file. Returns the temp path."""
    parsed = urllib.parse.urlparse(ref)
    if parsed.scheme not in ("http", "https") or not parsed.hostname:
        raise ValueError(f"refusing to fetch non-http(s) bytes_ref: {ref[:80]}")
    request = urllib.request.Request(ref, headers={"User-Agent": "HermesAgent-intake/1.0"})
    with urllib.request.urlopen(request, timeout=FETCH_TIMEOUT_SECONDS) as response:
        chunks: list[bytes] = []
        total = 0
        while True:
            chunk = response.read(65536)
            if not chunk:
                break
            total += len(chunk)
            if total > MAX_FETCH_BYTES:
                raise ValueError("remote attachment exceeds size cap")
            chunks.append(chunk)
    suffix = os.path.splitext(parsed.path)[1][:16] or ".bin"
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as handle:
        handle.write(b"".join(chunks))
        return handle.name


def _local_path(ref: str) -> str:
    if ref.startswith(("http://", "https://")):
        return _fetch_remote(ref)
    if not os.path.isfile(ref):
        raise ValueError(f"attachment bytes_ref is not a readable file: {ref[:120]}")
    return ref


def _is_textual(mime: str, path: str) -> bool:
    return mime.startswith(TEXT_MIMES) or path.lower().endswith(TEXT_EXTENSIONS)


def _read_text_file(path: str) -> str:
    # Cap by bytes first so a huge log never fully materializes as str.
    with open(path, "rb") as handle:
        raw = handle.read(MAX_TRANSCRIPT_CHARS * 4)
    text = raw.decode("utf-8", errors="replace")
    return text[:MAX_TRANSCRIPT_CHARS]


def process_attachment(attachment: IntakeAttachment) -> AttachmentResult:
    """Resolve one attachment. Dispatches by kind; never raises."""
    try:
        return _process(attachment)
    except Exception as exc:  # noqa: BLE001 — funnel, not filter; see module docstring
        return AttachmentResult(attachment=attachment, ok=False,
                                error=f"{type(exc).__name__}: {exc}")


def _process(attachment: IntakeAttachment) -> AttachmentResult:
    from dataclasses import replace
    kind, mime = attachment.kind, attachment.mime

    if kind == "audio":
        from tools.transcription_tools import transcribe_audio
        path = _local_path(attachment.bytes_ref)
        try:
            result = transcribe_audio(path, source="intake")
        finally:
            if path != attachment.bytes_ref:
                try:
                    os.unlink(path)
                except OSError:
                    pass
        transcript = str(result.get("transcript", "") or "").strip()[:MAX_TRANSCRIPT_CHARS]
        if not result.get("success") or not transcript:
            return AttachmentResult(
                attachment=attachment, ok=False,
                error=str(result.get("error", "transcription produced no text")),
                )
        return AttachmentResult(
            attachment=replace(attachment, transcript=transcript,
                               summary=transcript[:500]),
            ok=True)

    if kind == "file":
        # Decide from metadata alone: a remote non-text file must never be
        # downloaded just to be deferred.
        ref_path = (urllib.parse.urlparse(attachment.bytes_ref).path
                    if attachment.bytes_ref.startswith(("http://", "https://"))
                    else attachment.bytes_ref)
        if not _is_textual(mime, ref_path):
            return AttachmentResult(
                attachment=attachment, ok=True, needs_model_analysis=True,
                error=None)
        path = _local_path(attachment.bytes_ref)
        try:
            text = _read_text_file(path)
        finally:
            if path != attachment.bytes_ref:
                try:
                    os.unlink(path)
                except OSError:
                    pass
        if not text.strip():
            return AttachmentResult(attachment=attachment, ok=False,
                                    error="document is empty")
        return AttachmentResult(
            attachment=replace(attachment, transcript=text,
                               summary=text[:500]),
            ok=True)

    if kind == "image":
        # Vision access lives in-turn (turn-scoped dedupe, model routing, auth).
        # The pipeline records the reference; triage/drafting analyze it there.
        return AttachmentResult(attachment=attachment, ok=True,
                                needs_model_analysis=True)

    return AttachmentResult(attachment=attachment, ok=False,
                            error=f"unknown attachment kind: {kind!r}")

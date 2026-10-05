"""Invariant tests for the attachment pipeline.

Contract: the pipeline is a funnel, never a filter. Content failure yields
``ok=False`` with a reason — never an exception — and the intake event still
flows. Remote non-text is deferred from metadata alone, without downloading.
"""
from hermes_cli.attachments import process_attachment
from hermes_cli.intake import IntakeAttachment


def _attachment(**overrides):
    args = {"kind": "file", "mime": "text/plain", "bytes_ref": __file__}
    args.update(overrides)
    return IntakeAttachment(**args)


def test_text_file_resolves_inline(tmp_path):
    target = tmp_path / "note.md"
    target.write_text("# Hello\nworld\n", encoding="utf-8")
    result = process_attachment(_attachment(bytes_ref=str(target)))
    assert result.ok is True
    assert "Hello" in result.attachment.transcript
    assert result.needs_model_analysis is False


def test_missing_file_fails_soft_not_loud():
    result = process_attachment(_attachment(bytes_ref="/nonexistent/note.txt"))
    assert result.ok is False
    assert result.error


def test_non_text_file_defers_without_downloading(monkeypatch):
    fetched = []
    import hermes_cli.attachments as attachments_mod
    monkeypatch.setattr(
        attachments_mod, "_fetch_remote",
        lambda ref: fetched.append(ref) or (_ for _ in ()).throw(AssertionError("must not fetch")))
    result = process_attachment(_attachment(
        kind="file", mime="application/pdf",
        bytes_ref="https://example.invalid/spec.pdf"))
    assert result.ok is True
    assert result.needs_model_analysis is True
    assert fetched == []


def test_audio_uses_stt_path(monkeypatch, tmp_path):
    # _process imports transcribe_audio inside the function, so patching the
    # provider module takes effect on the next call with no reload dance.
    target = tmp_path / "note.wav"
    target.write_bytes(b"RIFF....")
    import tools.transcription_tools as transcription_tools
    monkeypatch.setattr(
        transcription_tools, "transcribe_audio",
        lambda *a, **k: {"success": True, "transcript": "hello world"})
    result = process_attachment(_attachment(kind="audio", mime="audio/wav", bytes_ref=str(target)))
    assert result.ok is True
    assert result.attachment.transcript == "hello world"


def test_failed_transcription_is_soft():
    result = process_attachment(_attachment(kind="audio", mime="audio/wav",
                                            bytes_ref="/nonexistent/note.wav"))
    assert result.ok is False
    assert result.error


def test_image_defers_to_in_turn_vision():
    result = process_attachment(_attachment(kind="image", mime="image/png",
                                            bytes_ref="/tmp/photo.png"))
    assert result.ok is True
    assert result.needs_model_analysis is True
    assert result.attachment.transcript == ""


def test_unknown_kind_fails_soft():
    result = process_attachment(_attachment(kind="video", mime="video/mp4",
                                            bytes_ref="/tmp/a.mp4"))
    assert result.ok is False
    assert "video" in (result.error or "")

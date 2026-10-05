"""Invariant tests for the intake event schema.

Contract: every producer normalizes into this shape, every consumer reads
only this shape. Platform specifics in ``raw_message`` must never survive
the mapping; validation rejects what downstream cannot handle.
"""
import pytest

from hermes_cli.intake import IntakeAttachment, IntakeError, IntakeEvent


def _gateway_event(**overrides):
    """A MessageEvent-shaped stand-in (duck-typed; the mapper reads attributes)."""
    from types import SimpleNamespace

    base = {
        "text": "please add dark mode",
        "user_id": "u1",
        "user_name": "Ada",
        "message_id": "m1",
        "media_urls": [],
        "media_types": [],
        "reply_to_text": None,
        "source": SimpleNamespace(platform=SimpleNamespace(value="telegram")),
        "raw_message": {"update_id": 123, "secret": "must-not-survive"},
    }
    base.update(overrides)
    return SimpleNamespace(**base)


def test_round_trip_preserves_everything():
    event = IntakeEvent.create(
        source="telegram",
        text="hello",
        author_id="u1",
        attachments=[IntakeAttachment(kind="image", mime="image/png", bytes_ref="/tmp/a.png")],
        conversation_id="m1",
        thread_context=["earlier"],
    )
    assert IntakeEvent.from_dict(event.to_dict()) == event


def test_from_message_event_maps_public_fields_only():
    event = IntakeEvent.from_message_event(_gateway_event())
    assert event.source == "telegram"
    assert event.text == "please add dark mode"
    assert event.author_id == "u1"
    assert event.conversation_id == "m1"
    assert "must-not-survive" not in event.to_dict().__repr__()


def test_from_message_event_maps_media_to_attachments():
    event = IntakeEvent.from_message_event(_gateway_event(
        media_urls=["/tmp/v.ogg", "/tmp/photo.jpg", "/tmp/spec.pdf"],
        media_types=["audio/ogg", "image/jpeg", "application/pdf"],
    ))
    assert [a.kind for a in event.attachments] == ["audio", "image", "file"]
    assert all(a.transcript == "" and a.summary == "" for a in event.attachments)


def test_from_message_event_pulls_reply_into_thread_context():
    event = IntakeEvent.from_message_event(_gateway_event(reply_to_text="the dark one"))
    assert event.thread_context == ["the dark one"]


def test_validation_rejects_empty_identity():
    with pytest.raises(IntakeError):
        IntakeEvent.create(source="", text="x")
    with pytest.raises(IntakeError):
        IntakeAttachment(kind="video", mime="video/mp4", bytes_ref="/tmp/a.mp4").validate()
    with pytest.raises(IntakeError):
        IntakeAttachment(kind="image", mime="", bytes_ref="").validate()


def test_from_dict_rejects_bad_payloads():
    with pytest.raises(IntakeError):
        IntakeEvent.from_dict({"id": "", "source": "x"})
    with pytest.raises(IntakeError):
        IntakeEvent.from_dict({"id": "a", "source": "x", "attachments": [{"kind": "nope"}]})

"""Invariant tests for the PRD document.

Contract: triage creates drafts, the review queue moves them, nothing else
does. Status is never a bare flag — every transition is recorded — and illegal
moves raise instead of silently landing.
"""
import pytest

from hermes_cli.prd import PrdDocument, PrdError


def _draft(**overrides):
    args = {"title": "Dark mode", "problem": "The app blinds users at night.",
            "sources": ["evt1"]}
    args.update(overrides)
    return PrdDocument.create_draft(**args)


def test_happy_path_draft_to_approved():
    doc = _draft()
    assert doc.status == "draft"
    doc.transition("in_review", actor="reviewer:ada", reason="looks real")
    doc.transition("approved", actor="reviewer:ada")
    assert doc.status == "approved"
    assert [(t.from_status, t.to_status) for t in doc.history] == [
        ("", "draft"), ("draft", "in_review"), ("in_review", "approved")]
    assert all(t.actor for t in doc.history)


def test_illegal_transitions_raise_and_change_nothing():
    doc = _draft()
    with pytest.raises(PrdError):
        doc.transition("approved", actor="reviewer:ada")
    assert doc.status == "draft" and len(doc.history) == 1
    doc.transition("in_review", actor="reviewer:ada")
    with pytest.raises(PrdError):
        doc.transition("draft", actor="reviewer:ada")
    assert doc.status == "in_review"


def test_validation_requires_title_problem_and_source():
    with pytest.raises(PrdError):
        _draft(title="  ")
    with pytest.raises(PrdError):
        _draft(problem="")
    with pytest.raises(PrdError):
        _draft(sources=[])
    with pytest.raises(PrdError):
        PrdDocument.from_dict({"id": "a", "title": "t", "problem": "p",
                               "sources": ["s"], "status": "shipped"})


def test_round_trip_preserves_document_and_history():
    doc = _draft(requirements=["r1"], acceptance_criteria=["c1"])
    doc.transition("in_review", actor="reviewer:ada")
    assert PrdDocument.from_dict(doc.to_dict()).to_dict() == doc.to_dict()


def test_markdown_contains_sections_and_sources():
    text = _draft(requirements=["r1"], acceptance_criteria=["c1"]).to_markdown()
    for expected in ("# Dark mode", "## Problem", "## Requirements", "- r1",
                     "## Acceptance criteria", "- [ ] c1", "## Sources", "`evt1`"):
        assert expected in text

"""Product Requirement Documents: the artifact the intake pipeline produces.

A PRD is created by triage (never by intake directly), moves only through the
review queue (``draft -> in_review -> approved | rejected``), and decomposes
into kanban work items only once approved. Every transition appends to
``history`` — a PRD's status is never a bare flag.

Sources are intake-event ids, not embedded content: the document cites its
evidence, and the evidence stays addressable where it lives.
"""
from __future__ import annotations

import time
import uuid
from dataclasses import asdict, dataclass, field
from typing import Any, Dict, List, Optional


PRD_STATUSES = ("draft", "in_review", "approved", "rejected")

# Draft → review → approved/rejected only. Reopening an approved PRD mints a
# follow-up instead of rewinding history; rejected drafts return to in_review
# via re-submission, never silently.
PRD_TRANSITIONS = {
    "draft": ("in_review",),
    "in_review": ("approved", "rejected"),
    "approved": (),
    "rejected": (),
}


class PrdError(ValueError):
    """A PRD failed validation or an illegal transition was attempted."""


@dataclass(frozen=True)
class PrdTransition:
    """One audit entry. ``actor`` is "triage", "reviewer:<id>" or "system"."""
    at: float
    from_status: str
    to_status: str
    actor: str
    reason: str = ""


@dataclass
class PrdDocument:
    """A structured product requirement. Mutable only through the methods
    below so every mutation is validated and recorded."""
    id: str
    title: str
    problem: str
    users: str = ""
    requirements: List[str] = field(default_factory=list)
    acceptance_criteria: List[str] = field(default_factory=list)
    open_questions: List[str] = field(default_factory=list)
    sources: List[str] = field(default_factory=list)
    status: str = "draft"
    history: List[PrdTransition] = field(default_factory=list)

    def validate(self) -> None:
        if not self.id:
            raise PrdError("PRD needs an id")
        if not self.title.strip():
            raise PrdError("PRD needs a title")
        if not self.problem.strip():
            raise PrdError("PRD needs a problem statement")
        if self.status not in PRD_STATUSES:
            raise PrdError(f"PRD status must be one of {PRD_STATUSES}")
        if not self.sources:
            raise PrdError("PRD needs at least one cited intake source")

    def transition(self, to_status: str, *, actor: str, reason: str = "") -> None:
        """Move status, recording the transition. Raises on illegal moves."""
        if to_status not in PRD_TRANSITIONS.get(self.status, ()):
            raise PrdError(f"cannot move PRD from {self.status!r} to {to_status!r}")
        self.history.append(PrdTransition(
            at=time.time(), from_status=self.status, to_status=to_status,
            actor=actor, reason=reason))
        self.status = to_status

    def to_dict(self) -> Dict[str, Any]:
        data = asdict(self)
        data["history"] = [asdict(t) for t in self.history]
        return data

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "PrdDocument":
        doc = cls(
            id=str(data.get("id", "")),
            title=str(data.get("title", "")),
            problem=str(data.get("problem", "")),
            users=str(data.get("users", "")),
            requirements=[str(r) for r in (data.get("requirements") or [])],
            acceptance_criteria=[str(c) for c in (data.get("acceptance_criteria") or [])],
            open_questions=[str(q) for q in (data.get("open_questions") or [])],
            sources=[str(s) for s in (data.get("sources") or [])],
            status=str(data.get("status", "draft")),
            history=[PrdTransition(**t) for t in (data.get("history") or [])],
        )
        doc.validate()
        return doc

    @classmethod
    def create_draft(
        cls, *, title: str, problem: str, sources: List[str], actor: str = "triage",
        **kwargs: Any,
    ) -> "PrdDocument":
        """Mint a draft. Triage is the only caller; drafts never appear ex nihilo."""
        doc = cls(id=uuid.uuid4().hex, title=title, problem=problem,
                  sources=list(sources), status="draft", **kwargs)
        doc.history.append(PrdTransition(
            at=time.time(), from_status="", to_status="draft",
            actor=actor, reason="created by triage"))
        doc.validate()
        return doc

    def to_markdown(self) -> str:
        """Human-readable rendering for the review queue, kanban handoff and export."""
        lines = [f"# {self.title}", "", f"Status: {self.status}", "",
                 "## Problem", "", self.problem or "_Not stated._", ""]
        if self.users:
            lines += ["## Users", "", self.users, ""]
        if self.requirements:
            lines += ["## Requirements", "",
                      *[f"- {r}" for r in self.requirements], ""]
        if self.acceptance_criteria:
            lines += ["## Acceptance criteria", "",
                      *[f"- [ ] {c}" for c in self.acceptance_criteria], ""]
        if self.open_questions:
            lines += ["## Open questions", "",
                      *[f"- {q}" for q in self.open_questions], ""]
        lines += ["## Sources", "", *[f"- `{s}`" for s in self.sources], ""]
        return "\n".join(lines).rstrip() + "\n"

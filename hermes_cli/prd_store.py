"""Phase 4 durable storage: intake log, PRD documents, triage cases.

Three JSON files under ``<home>/prds/`` (atomic renames, same shape as the
feeds store — reads are cheap, writes are whole-file):

- ``intake.json``: append-only arrival log of ``IntakeEvent`` dicts, capped
  (oldest uncited-first pruning keeps PRD citations resolvable).
- ``prds.json``: ``PrdDocument`` dicts, upserted by id. Mutations go through
  ``PrdDocument.transition`` so history stays complete; the store never
  rewrites status itself.
- ``triage.json``: triage cases — one per evaluated conversation. ``watch``
  cases accumulate context across turns; ``dismissed`` keeps the reason (tuning
  signal); ``drafted`` links the minted PRD. The anti-requirement (no PRD per
  conversation) is enforced upstream by the triage gate, not here.

Profiles stay isolated (home-scoped paths); nothing here touches the network
or the model — triage and drafting inject their functions.
"""

from __future__ import annotations

import json
import os
import tempfile
import time
from pathlib import Path
from typing import Any, Dict, List, Optional

STORE_DIRNAME = "prds"
INTAKE_FILENAME = "intake.json"
PRDS_FILENAME = "prds.json"
TRIAGE_FILENAME = "triage.json"

MAX_INTAKE_EVENTS = 2000

CASE_WATCH = "watch"
CASE_DISMISSED = "dismissed"
CASE_DRAFTED = "drafted"
CASE_STATUSES = (CASE_WATCH, CASE_DISMISSED, CASE_DRAFTED)


class PrdStoreError(ValueError):
    """Bad case status, unknown PRD id, or unreadable store."""


def _atomic_write_json(path: Path, value: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    fd, tmp = tempfile.mkstemp(dir=str(path.parent), prefix=".prds-", suffix=".tmp")
    try:
        with os.fdopen(fd, "w", encoding="utf-8") as handle:
            json.dump(value, handle, ensure_ascii=False, indent=2)
        os.replace(tmp, path)
    except BaseException:
        try:
            os.unlink(tmp)
        except OSError:
            pass
        raise


def _read_json_list(path: Path) -> List[Dict[str, Any]]:
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, ValueError):
        return []
    return [row for row in data if isinstance(row, dict)] if isinstance(data, list) else []


class PrdStore:
    """Intake events, PRD documents and triage cases under one home."""

    def __init__(self, home: Optional[Path] = None):
        if home is not None:
            self._dir = Path(home) / STORE_DIRNAME
        else:
            from hermes_constants import get_hermes_home
            self._dir = Path(get_hermes_home()) / STORE_DIRNAME

    def _intake_path(self) -> Path:
        return self._dir / INTAKE_FILENAME

    def _prds_path(self) -> Path:
        return self._dir / PRDS_FILENAME

    def _triage_path(self) -> Path:
        return self._dir / TRIAGE_FILENAME

    # ── intake log ──

    def append_intake(self, event: Dict[str, Any]) -> Dict[str, Any]:
        """Append one validated intake-event dict; prune past the cap
        (cited events last, so PRD sources stay resolvable)."""
        from hermes_cli.intake import IntakeEvent
        IntakeEvent.from_dict(event).validate()
        events = _read_json_list(self._intake_path())
        events.append(event)
        if len(events) > MAX_INTAKE_EVENTS:
            cited = {source for row in _read_json_list(self._prds_path()) for source in row.get("sources", [])}
            overflow = len(events) - MAX_INTAKE_EVENTS
            keep_uncited = [e for e in events if e.get("id") not in cited]
            drop_ids = {e.get("id") for e in keep_uncited[:overflow]}
            remaining = overflow - len(drop_ids)
            events = [e for e in events if e.get("id") not in drop_ids]
            if remaining > 0:
                events = events[remaining:]
        _atomic_write_json(self._intake_path(), events)
        return event

    def list_intake(self, conversation_id: Optional[str] = None) -> List[Dict[str, Any]]:
        events = _read_json_list(self._intake_path())
        if conversation_id is None:
            return events
        return [e for e in events if e.get("conversation_id") == conversation_id]

    # ── PRD documents ──

    def save_prd(self, doc) -> None:
        """Upsert a ``PrdDocument`` (validated; status changes must already
        have gone through ``doc.transition``)."""
        doc.validate()
        raw = doc.to_dict()
        prds = [p for p in _read_json_list(self._prds_path()) if p.get("id") != raw["id"]]
        prds.append(raw)
        _atomic_write_json(self._prds_path(), prds)

    def get_prd(self, prd_id: str):
        from hermes_cli.prd import PrdDocument
        for raw in _read_json_list(self._prds_path()):
            if raw.get("id") == prd_id:
                return PrdDocument.from_dict(raw)
        return None

    def list_prds(self, status: Optional[str] = None) -> List:
        from hermes_cli.prd import PrdDocument
        docs = []
        for raw in _read_json_list(self._prds_path()):
            try:
                docs.append(PrdDocument.from_dict(raw))
            except Exception:
                continue
        if status is not None:
            docs = [d for d in docs if d.status == status]
        return sorted(docs, key=lambda d: d.id)

    # ── triage cases ──

    def save_case(self, case: Dict[str, Any]) -> Dict[str, Any]:
        """Upsert a triage case ``{id, conversation_id, status, reason,
        event_ids[], prd_id?, triage_count, updated_at}``."""
        case = dict(case)
        if case.get("status") not in CASE_STATUSES:
            raise PrdStoreError(f"bad triage status: {case.get('status')}")
        if not case.get("id") or not case.get("conversation_id"):
            raise PrdStoreError("triage case needs id + conversation_id")
        case["updated_at"] = time.time()
        cases = [c for c in _read_json_list(self._triage_path()) if c.get("id") != case["id"]]
        cases.append(case)
        _atomic_write_json(self._triage_path(), cases)
        return case

    def get_case(self, case_id: str) -> Optional[Dict[str, Any]]:
        for case in _read_json_list(self._triage_path()):
            if case.get("id") == case_id:
                return case
        return None

    def case_for_conversation(self, conversation_id: str) -> Optional[Dict[str, Any]]:
        """Newest case for a conversation (re-triage updates in place; the
        log of past verdicts lives in each case's reason history, not in
        duplicate rows)."""
        matches = [c for c in _read_json_list(self._triage_path())
                   if c.get("conversation_id") == conversation_id]
        if not matches:
            return None
        return sorted(matches, key=lambda c: c.get("updated_at", 0))[-1]

    def list_cases(self, status: Optional[str] = None) -> List[Dict[str, Any]]:
        cases = _read_json_list(self._triage_path())
        if status is not None:
            cases = [c for c in cases if c.get("status") == status]
        return sorted(cases, key=lambda c: c.get("updated_at", 0))

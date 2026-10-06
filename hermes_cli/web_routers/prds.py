"""PRD dashboard routes (premium).

Review queue + manual intake for the PRDs pane. Thin adapter layer: the
pipeline (``hermes_cli/prd_pipeline.py``) owns ingestion, review and
dispatch; this only translates HTTP into shapes those functions accept.

Every route re-checks premium entitlement server-side. Secrets never cross
these routes: intake text is user content (never logged — the pipeline
guarantees that), and attachment uploads are processed server-side from a
temp path that is removed before the response returns.
"""
import asyncio
import tempfile
from pathlib import Path
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from pydantic import BaseModel, Field

from hermes_cli.web_deps import late
from hermes_cli.web_routers._common import log as _log

router = APIRouter()

_profile_scope = late("_profile_scope", "hermes_cli.web_server_profiles")


def _store():
    from hermes_cli.prd_store import PrdStore
    from hermes_constants import get_hermes_home
    return PrdStore(Path(get_hermes_home()))


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


def _case_for_prd(store, prd_id: str) -> Optional[Dict[str, Any]]:
    return next((c for c in store.list_cases() if c.get("prd_id") == prd_id), None)


def _public_prd(doc, store) -> Dict[str, Any]:
    case = _case_for_prd(store, doc.id)
    return {
        **doc.to_dict(),
        "section_sources": (case.get("section_sources") or {}) if case else {},
        "conversation_id": (case.get("conversation_id") if case else None),
        "kanban_task_id": (case.get("kanban_task_id") if case else None),
    }


def _public_case(case: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "id": case.get("id"),
        "conversation_id": case.get("conversation_id"),
        "status": case.get("status"),
        "reason": case.get("reason", ""),
        "event_ids": list(case.get("event_ids", [])),
        "prd_id": case.get("prd_id"),
        "triage_count": case.get("triage_count", 0),
        "updated_at": case.get("updated_at", 0),
    }


class IntakeCreate(BaseModel):
    text: str = ""
    conversation_id: Optional[str] = None
    source: str = "desktop-paste"


class ReviewAction(BaseModel):
    action: str = ""
    reason: str = ""
    field: str = ""
    value: Any = None


@router.get("/api/prds")
async def list_prds(profile: Optional[str] = None, status: Optional[str] = None):
    def _run():
        with _profile_scope(profile):
            _check_premium()
            store = _store()
            return {"prds": [_public_prd(d, store) for d in store.list_prds(status=status)]}
    try:
        return await asyncio.to_thread(_run)
    except HTTPException:
        raise
    except Exception as exc:
        _log.exception("GET /api/prds failed")
        raise HTTPException(status_code=500, detail=str(exc))


class FormsSyncBody(BaseModel):
    enabled: bool = False


@router.get("/api/prds/forms-sync")
async def forms_sync_status(profile: Optional[str] = None):
    """Background website-forms sync state: whether the cron job is active
    and whether a site key is configured. Enabling is explicit (POST).

    Registered before ``/{prd_id}`` on purpose: FastAPI matches routes in
    registration order, and a literal must precede the parameter route.
    """
    def _run():
        with _profile_scope(profile):
            _check_premium()
            from hermes_cli import prd_forms
            jobs = prd_forms.find_sync_jobs()
            active = any(j.get("enabled", True) for j in jobs)
            return {"enabled": active, "job_count": len(jobs),
                    "configured": bool(prd_forms.intake_api_key())}
    try:
        return await asyncio.to_thread(_run)
    except HTTPException:
        raise
    except Exception as exc:
        _log.exception("GET /api/prds/forms-sync failed")
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/api/prds/forms-sync")
async def forms_sync_set(body: FormsSyncBody, profile: Optional[str] = None):
    def _run():
        with _profile_scope(profile):
            _check_premium()
            from hermes_cli import prd_forms
            return {"enabled": body.enabled,
                    "status": prd_forms.sync_forms_job(_store(), body.enabled)}
    try:
        return await asyncio.to_thread(_run)
    except HTTPException:
        raise
    except Exception as exc:
        _log.exception("POST /api/prds/forms-sync failed")
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/api/prds/forms-sync/run")
async def forms_sync_run(profile: Optional[str] = None):
    """Drain queued form submissions once, now. The background job calls the
    same function on schedule; this is the manual trigger."""
    def _run():
        with _profile_scope(profile):
            _check_premium()
            from hermes_cli import prd_forms
            return prd_forms.sync_form_submissions(_store())
    try:
        return await asyncio.to_thread(_run)
    except HTTPException:
        raise
    except Exception as exc:
        _log.exception("POST /api/prds/forms-sync/run failed")
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/api/prds/{prd_id}")
async def show_prd(prd_id: str, profile: Optional[str] = None):
    def _run():
        with _profile_scope(profile):
            _check_premium()
            from hermes_cli.prd import PrdError
            store = _store()
            doc = store.get_prd(prd_id)
            if doc is None:
                raise HTTPException(status_code=404, detail=f"unknown PRD: {prd_id}")
            case = _case_for_prd(store, prd_id)
            return {"prd": _public_prd(doc, store),
                    "case": _public_case(case) if case else None,
                    "events": [e for e in store.list_intake(case.get("conversation_id"))
                               if e.get("id") in set(case.get("event_ids", []))] if case else []}
    try:
        return await asyncio.to_thread(_run)
    except HTTPException:
        raise
    except Exception as exc:
        _log.exception("GET /api/prds/{id} failed")
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/api/prds-cases")
async def list_cases(profile: Optional[str] = None, status: Optional[str] = None):
    def _run():
        with _profile_scope(profile):
            _check_premium()
            return {"cases": [_public_case(c) for c in _store().list_cases(status=status)]}
    try:
        return await asyncio.to_thread(_run)
    except HTTPException:
        raise
    except Exception as exc:
        _log.exception("GET /api/prds-cases failed")
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/api/prds/intake", status_code=201)
async def inject_intake(body: IntakeCreate, profile: Optional[str] = None):
    def _run():
        with _profile_scope(profile):
            _check_premium()
            from hermes_cli import prd_pipeline
            event, case = prd_pipeline.ingest_intake(
                _store(), source=body.source or "desktop-paste", text=body.text or "",
                author_name="desktop user",
                conversation_id=(body.conversation_id or "") or None)
            return {"event_id": event["id"], "conversation_id": event["conversation_id"],
                    "case": _public_case(case) if case else None}
    try:
        return await asyncio.to_thread(_run)
    except HTTPException:
        raise
    except Exception as exc:
        _log.exception("POST /api/prds/intake failed")
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/api/prds/intake/file", status_code=201)
async def inject_file(profile: Optional[str] = None,
                      text: str = Form(""),
                      conversation_id: Optional[str] = Form(None),
                      upload: UploadFile = File(...)):
    def _run():
        with _profile_scope(profile):
            _check_premium()
            from hermes_cli import prd_pipeline
            suffix = Path(upload.filename or "upload").suffix or ".bin"
            tmp: Optional[Path] = None
            try:
                with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as handle:
                    tmp = Path(handle.name)
                with open(tmp, "wb") as handle:
                    handle.write(upload.file.read())
                event, case = prd_pipeline.ingest_intake(
                    _store(), source="desktop-paste", text=text or "",
                    author_name="desktop user",
                    conversation_id=conversation_id or None,
                    attachments=[{"kind": "file",
                                  "mime": upload.content_type or "application/octet-stream",
                                  "bytes_ref": str(tmp)}])
            finally:
                try:
                    if tmp is not None:
                        tmp.unlink(missing_ok=True)
                except OSError:
                    pass
            return {"event_id": event["id"], "conversation_id": event["conversation_id"],
                    "case": _public_case(case) if case else None}
    try:
        return await asyncio.to_thread(_run)
    except HTTPException:
        raise
    except Exception as exc:
        _log.exception("POST /api/prds/intake/file failed")
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/api/prds/{prd_id}/review")
async def review_prd(prd_id: str, body: ReviewAction, profile: Optional[str] = None):
    def _run():
        with _profile_scope(profile):
            _check_premium()
            from hermes_cli import prd_pipeline
            from hermes_cli.prd import PrdError
            store = _store()
            try:
                doc = prd_pipeline.review_prd(
                    store, prd_id, (body.action or "").strip(),
                    actor=f"reviewer:{profile or 'default'}",
                    reason=body.reason or "", field=body.field or "", value=body.value)
            except PrdError as exc:
                raise HTTPException(status_code=400, detail=str(exc))
            return {"prd": _public_prd(doc, store)}
    try:
        return await asyncio.to_thread(_run)
    except HTTPException:
        raise
    except Exception as exc:
        _log.exception("POST /api/prds/{id}/review failed")
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/api/prds/{prd_id}/dispatch")
async def dispatch_prd(prd_id: str, profile: Optional[str] = None):
    def _run():
        with _profile_scope(profile):
            _check_premium()
            from hermes_cli import prd_pipeline
            from hermes_cli.prd import PrdError
            try:
                result = prd_pipeline.dispatch_approved(
                    _store(), prd_id, author=f"reviewer:{profile or 'default'}")
            except PrdError as exc:
                raise HTTPException(status_code=400, detail=str(exc))
            return result
    try:
        return await asyncio.to_thread(_run)
    except HTTPException:
        raise
    except Exception as exc:
        _log.exception("POST /api/prds/{id}/dispatch failed")
        raise HTTPException(status_code=500, detail=str(exc))


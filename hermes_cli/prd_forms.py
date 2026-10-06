"""Phase 5 drain: portal website-form submissions → Phase-4 pipeline.

The portal upstream stores form posts and returns ids in under a second; this
module (run by the ``Website forms background sync`` cron job, or on demand
via ``POST /api/prds/forms-sync/run``) pulls ``queued`` rows, ingests each
as a ``website-form`` intake event triaged immediately, and acks them
done/failed. The submission id becomes the intake conversation id, so the
submitter's tracking id addresses the triaged conversation and the drafted
PRD cites the submission as its source verbatim.

Never raises into callers: per-submission isolation (one bad row acks failed
and the rest continue), premium lapse skips silently (rows stay queued
upstream and sync resumes on upgrade), and a dead portal yields an error
result instead of an exception.
"""

from __future__ import annotations

import json
import logging
import os
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path
from typing import Any, Callable, Dict, List, Optional

logger = logging.getLogger(__name__)

FORMS_SCRIPT_NAME = "minerva_prd_forms_sync.py"
FORMS_JOB_NAME = "Website forms background sync"
FORMS_SCHEDULE = "every 15m"
FORMS_PAUSE_REASON = "forms sync disabled"
SHIM_VERSION = 1
SHIM_STAMP = f"# minerva-prd-forms-sync-shim v{SHIM_VERSION}"

DEFAULT_PORTAL_BASE = "https://portal.abbble.co.za"
FETCH_TIMEOUT_SECONDS = 30.0
DRAIN_LIMIT = 25

SHIM_BODY = f'''"""Minerva website-forms background sync — managed by the PRDs surface, do not edit."""
{SHIM_STAMP}
from cron.scripts.prd_forms_sync import main

if __name__ == "__main__":
    raise SystemExit(main())
'''


class FormsSyncError(Exception):
    """Portal transport or contract failure (fetch/ack)."""


def intake_base_url() -> str:
    """Portal base for the intake API: explicit override wins, else the
    production portal (same default the auth constants carry)."""
    return (os.getenv("MINERVA_INTAKE_BASE_URL") or DEFAULT_PORTAL_BASE).rstrip("/") or DEFAULT_PORTAL_BASE


def intake_api_key() -> str:
    return (os.getenv("MINERVA_INTAKE_API_KEY") or "").strip()


def _api(method: str, path: str, key: str, base: str,
         body: Optional[Dict[str, Any]] = None) -> Any:
    url = f"{base}{path}"
    payload = json.dumps(body or {}).encode("utf-8") if method != "GET" else None
    request = urllib.request.Request(
        url, data=payload, method=method,
        headers={"Authorization": f"Bearer {key}",
                 "Content-Type": "application/json",
                 "User-Agent": "HermesAgent-prd-forms/1.0"})
    try:
        with urllib.request.urlopen(request, timeout=FETCH_TIMEOUT_SECONDS) as response:
            return json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as exc:
        detail = ""
        try:
            detail = exc.read().decode("utf-8")[:300]
        except Exception:
            pass
        raise FormsSyncError(f"portal {method} {path} -> HTTP {exc.code}: {detail}")
    except Exception as exc:
        raise FormsSyncError(f"portal {method} {path} failed: {type(exc).__name__}: {exc}")


def fetch_queued(base: str, key: str, limit: int = DRAIN_LIMIT) -> List[Dict[str, Any]]:
    payload = _api("GET", f"/api/v1/intake/queued?limit={max(1, min(limit, 100))}", key, base)
    submissions = payload.get("submissions") if isinstance(payload, dict) else None
    if not isinstance(submissions, list):
        raise FormsSyncError("portal queued response has no submissions list")
    return [s for s in submissions if isinstance(s, dict) and s.get("id")]


def ack_submission(base: str, key: str, submission_id: str,
                   status: str, error: str = "") -> bool:
    payload = _api("POST", f"/api/v1/intake/{urllib.parse.quote(str(submission_id))}/ack",
                   key, base, {"status": status, "error": error[:500]})
    return bool(isinstance(payload, dict) and payload.get("ok"))


def sync_form_submissions(store, *, base_url: Optional[str] = None, api_key: Optional[str] = None,
                           judge_fn: Optional[Callable[[str, str], str]] = None,
                           writer_fn: Optional[Callable[[str, str], str]] = None,
                           limit: int = DRAIN_LIMIT) -> Dict[str, Any]:
    """Drain queued form submissions through ingest+triage, acking each.
    Returns ``{fetched, ingested, drafted, failed: {id: reason}}`` or
    ``{"skipped": reason}`` / ``{"error": reason}``. Never raises."""
    from hermes_cli import nous_billing, prd_pipeline

    try:
        try:
            nous_billing.require_premium_tier(nous_billing.get_subscription_state())
        except Exception:
            return {"skipped": "non_premium"}
        key = (api_key if api_key is not None else intake_api_key()).strip()
        if not key:
            return {"skipped": "no_api_key"}
        base = (base_url or intake_base_url()).rstrip("/") or DEFAULT_PORTAL_BASE
        try:
            queued = fetch_queued(base, key, limit)
        except FormsSyncError as exc:
            return {"fetched": 0, "ingested": 0, "drafted": 0,
                    "failed": {}, "error": str(exc)}
        result: Dict[str, Any] = {"fetched": len(queued), "ingested": 0,
                                  "drafted": 0, "failed": {}}
        for submission in queued:
            sub_id = str(submission.get("id"))
            try:
                attachments = []
                media_url = str(submission.get("media_url") or "").strip()
                if media_url:
                    attachments.append({"kind": "file", "mime": "application/octet-stream",
                                        "bytes_ref": media_url})
                org = str(submission.get("organization_name") or "").strip()
                email = str(submission.get("client_email") or "").strip()
                phone = str(submission.get("client_phone") or "").strip()
                who = " / ".join(part for part in
                                 (org, email, f"tel {phone}" if phone else "") if part)
                contact = f"Submitted by {who}" if who else ""
                _event, case = prd_pipeline.ingest_intake(
                    store, source="website-form",
                    text=str(submission.get("brief") or ""),
                    author_id=email, author_name=org,
                    conversation_id=sub_id,
                    attachments=attachments,
                    thread_context=[contact] if contact else [],
                    triage_now=True, judge_fn=judge_fn, writer_fn=writer_fn)
                result["ingested"] += 1
                if case is not None and case.get("status") == "drafted":
                    result["drafted"] += 1
                ack_submission(base, key, sub_id, "done")
            except Exception as exc:
                logger.debug("forms sync: submission %s failed: %s", sub_id, exc)
                result["failed"][sub_id] = f"{type(exc).__name__}: {exc}"
                try:
                    ack_submission(base, key, sub_id, "failed", str(exc))
                except Exception as ack_exc:
                    logger.debug("forms sync: ack failed for %s: %s", sub_id, ack_exc)
        return result
    except Exception as exc:
        logger.debug("forms sync failed: %s", exc)
        return {"fetched": 0, "ingested": 0, "drafted": 0, "failed": {}, "error": str(exc)}


# ── background-job lifecycle (mirrors hermes_cli.feeds_cron) ─────────────

def _home_of(store) -> Path:
    return Path(store._dir).parent


def install_sync_script(home: Path) -> Optional[Path]:
    """Write the sync shim into ``<home>/scripts/``. None when a foreign file
    already owns that name (never clobbered)."""
    target = Path(home) / "scripts" / FORMS_SCRIPT_NAME
    if target.exists():
        try:
            existing = target.read_text(encoding="utf-8")
        except OSError:
            return None
        if SHIM_STAMP in existing:
            return target
        return None
    try:
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(SHIM_BODY, encoding="utf-8")
    except OSError:
        return None
    return target


def find_sync_jobs() -> List[Dict]:
    from cron import jobs as cron_jobs
    return [j for j in cron_jobs.list_jobs(include_disabled=True)
            if str(j.get("script") or "").endswith(FORMS_SCRIPT_NAME)]


def sync_forms_job(store, enabled: bool) -> str:
    """Reconcile the background-sync job. Returns ``created | resumed |
    paused | ok | left-user-paused | blocked-no-script``. Never raises."""
    from cron import jobs as cron_jobs

    try:
        ours = find_sync_jobs()
        if not enabled:
            for job in ours:
                if job.get("enabled", True):
                    cron_jobs.pause_job(job["id"], FORMS_PAUSE_REASON)
                    return "paused"
            return "ok"
        script_path = install_sync_script(_home_of(store))
        if script_path is None and not ours:
            return "blocked-no-script"
        if not ours:
            cron_jobs.create_job(
                prompt="Pull queued website-form intake submissions from the portal and triage them.",
                schedule=FORMS_SCHEDULE,
                name=FORMS_JOB_NAME,
                script=FORMS_SCRIPT_NAME,
                no_agent=True,
            )
            return "created"
        job = ours[0]
        if (not job.get("enabled", True)
                and job.get("paused_reason") == FORMS_PAUSE_REASON):
            cron_jobs.resume_job(job["id"])
            return "resumed"
        if not job.get("enabled", True):
            return "left-user-paused"
        return "ok"
    except Exception:
        logger.exception("forms sync job reconcile failed")
        return "ok"

"""Feeds background-poll cron job lifecycle.

One ``no_agent`` script job per profile (``Feeds background poll``, every 15
minutes) runs the due-source poll; per-source intervals and backoff stay in
``hermes_cli.feeds.poll_due``, so the tick is frequent and each source still
polls on its own cadence. The job is an ordinary cron record — visible in
``minerva cron list``, pausable, removable — never hidden machinery.

Ownership rules (the pane owns this job; the user owns the off switch):

- ``sync_poll_job`` is called after every source mutation (add, enable,
  disable, remove). It creates the job when the first source is enabled and
  pauses it (with our reason) when none remain.
- A job the user paused themselves (any other ``paused_reason``) is never
  resumed or re-created by sync — pause is the supported "stop background
  polling" control. Deleting the job removes that run only; the next source
  mutation re-asserts it, because background polling is part of the Feeds
  feature contract.
- The script file lives in ``<home>/scripts/`` (the only place the scheduler
  runs scripts from). It is a version-stamped shim importing the real logic
  from ``cron.scripts.feeds_poll``, so checkout updates apply without
  reinstalls. A foreign file under our name blocks installation (fail safe:
  sync reports it and creates no job against code it does not own).
"""

from __future__ import annotations

from pathlib import Path
from typing import Dict, List, Optional

POLL_SCRIPT_NAME = "minerva_feeds_poll.py"
POLL_JOB_NAME = "Feeds background poll"
POLL_SCHEDULE = "every 15m"
SHIM_VERSION = 1
SHIM_STAMP = f"# minerva-feeds-poll-shim v{SHIM_VERSION}"
PAUSE_REASON_NO_SOURCES = "no enabled feed sources"

SHIM_BODY = f'''""\"Minerva feeds background poll — managed by the Feeds pane, do not edit.""\"
{SHIM_STAMP}
from cron.scripts.feeds_poll import main

if __name__ == "__main__":
    raise SystemExit(main())
'''


def _home_of(store) -> Path:
    """Profile home for a FeedStore (``<home>/feeds`` is its dir)."""
    return Path(store._dir).parent


def install_poll_script(home: Path) -> Optional[Path]:
    """Write the poll shim into ``<home>/scripts/``. Returns its path, or
    None when a foreign file already owns that name (never clobbered)."""
    target = Path(home) / "scripts" / POLL_SCRIPT_NAME
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


def find_poll_jobs() -> List[Dict]:
    """Every job record pointing at our script (normally zero or one)."""
    from cron import jobs as cron_jobs
    found = []
    for job in cron_jobs.list_jobs(include_disabled=True):
        if str(job.get("script") or "").endswith(POLL_SCRIPT_NAME):
            found.append(job)
    return found


def sync_poll_job(store) -> str:
    """Reconcile the background-poll job with the source list. Returns
    ``created | resumed | paused | ok | left-user-paused | blocked-no-script``.
    Never raises: a broken cron store must not break source management (the
    pane's manual refresh keeps working)."""
    from cron import jobs as cron_jobs

    try:
        ours = find_poll_jobs()
        enabled = [s for s in store.list_sources() if s.enabled]
        if not enabled and not ours:
            return "ok"
        script_path = install_poll_script(_home_of(store))
        if not enabled:
            for job in ours:
                if job.get("enabled", True):
                    cron_jobs.pause_job(job["id"], PAUSE_REASON_NO_SOURCES)
                    return "paused"
            return "ok"
        if script_path is None and not ours:
            return "blocked-no-script"
        if not ours:
            cron_jobs.create_job(
                prompt="Poll due Minerva feed sources and summarize new items.",
                schedule=POLL_SCHEDULE,
                name=POLL_JOB_NAME,
                script=POLL_SCRIPT_NAME,
                no_agent=True,
            )
            return "created"
        job = ours[0]
        if (not job.get("enabled", True)
                and job.get("paused_reason") == PAUSE_REASON_NO_SOURCES):
            cron_jobs.resume_job(job["id"])
            return "resumed"
        if not job.get("enabled", True):
            return "left-user-paused"
        return "ok"
    except Exception:
        import logging
        logging.getLogger(__name__).exception("feeds poll job sync failed")
        return "ok"

"""Background sync for website-form intake (cron ``no_agent`` script job).

Pulls ``queued`` portal submissions and runs each through ingest+triage,
acking done/failed. Success prints NOTHING (empty stdout is the scheduler's
silent signal — new drafts surface in the review queue, never via delivery).
Exit 0 covers every handled outcome (no key, non-premium, portal errors);
only an unexpected internal error exits non-zero.

Importable for tests: ``run()`` takes the same seams as the pipeline
(``judge_fn``, ``writer_fn``) plus portal overrides.
"""

from __future__ import annotations

import sys
import traceback
from pathlib import Path
from typing import Any, Callable, Dict, Optional


def run(home: Optional[Path] = None,
        judge_fn: Optional[Callable[[str, str], str]] = None,
        writer_fn: Optional[Callable[[str, str], str]] = None,
        base_url: Optional[str] = None, api_key: Optional[str] = None) -> Dict[str, Any]:
    """Drain queued form submissions once. Returns the sync summary; raises
    only on unexpected internal errors."""
    from hermes_cli.prd_forms import sync_form_submissions
    from hermes_cli.prd_store import PrdStore

    if home is None:
        from hermes_constants import get_hermes_home
        home = Path(get_hermes_home())
    return sync_form_submissions(PrdStore(home), base_url=base_url, api_key=api_key,
                                 judge_fn=judge_fn, writer_fn=writer_fn)


def main() -> int:
    try:
        run()
    except Exception:
        traceback.print_exc()
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())

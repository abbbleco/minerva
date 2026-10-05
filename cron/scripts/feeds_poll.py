"""Background poll for Minerva feed sources (cron ``no_agent`` script job).

Runs ``poll_due`` (per-source intervals + backoff already enforced there) and
fills briefs for up to a few unsummarized items via the user's configured
provider. Success prints NOTHING: empty stdout is the scheduler's silent-run
signal, and per the Feeds interaction rules unread counts update quietly in
the pane — never via a delivery. Exit 0 covers every handled outcome
(including non-premium and per-source failures, which are recorded on the
source row as degraded state); only an unexpected internal error exits
non-zero so a genuinely broken poller still alerts.

Importable for tests: ``run()`` takes the same seams as the poll RPC
(``complete_fn``, ``fetcher``, ``now``).
"""

from __future__ import annotations

import sys
import traceback
from pathlib import Path
from typing import Any, Callable, Dict, List, Optional

SUMMARIZE_PER_TICK = 5


def _complete_fn() -> Callable[[List[Dict[str, str]], Any], str]:
    """Model completion bound to the user's configured provider. Built here
    (not imported at module level) so this module stays import-light and
    tests inject a stub instead of touching agent machinery."""
    from agent.auxiliary_client import call_llm

    def complete(messages, item):
        response = call_llm(
            task="feeds_summarization",
            messages=messages,
            max_tokens=300,
            temperature=None,
            timeout=60.0,
        )
        message = response.choices[0].message
        return (message.content or "").strip()

    return complete


def run(
    home: Optional[Path] = None,
    complete_fn: Optional[Callable[[List[Dict[str, str]], Any], str]] = None,
    now: Optional[float] = None,
    fetcher: Optional[Callable[[str], bytes]] = None,
) -> Dict[str, Any]:
    """Poll due sources and summarize fresh items. Returns the ``poll_due``
    result dict; ``{"skipped": reason}`` when there is nothing to do. Raises
    only on unexpected internal errors (the caller turns those into exit 1)."""
    from hermes_cli import feeds, nous_billing

    if home is None:
        from hermes_constants import get_hermes_home
        home = Path(get_hermes_home())
    try:
        tier = nous_billing.require_premium_tier(nous_billing.get_subscription_state())
    except Exception:
        return {"skipped": "non_premium"}
    store = feeds.FeedStore(home)
    if not any(source.enabled for source in store.list_sources()):
        return {"skipped": "no_enabled_sources"}
    result = feeds.poll_due(store, now=now, fetcher=fetcher)
    unsummarized = [item for item in store.list_items() if not item.brief][:SUMMARIZE_PER_TICK]
    if unsummarized:
        filled = {item.id: item for item in feeds.summarize_items(unsummarized, complete_fn or _complete_fn())}
        store.save_items([filled.get(item.id, item) for item in store.list_items()])
    result["tier"] = tier
    return result


def main() -> int:
    try:
        run()
    except Exception:
        traceback.print_exc()
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())

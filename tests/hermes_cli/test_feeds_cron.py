"""Invariant tests for the feeds background-poll cron job.

Contract: the Feeds pane owns one ``no_agent`` script job per profile. Sync
creates it when the first source is enabled, pauses it (with our reason) when
none remain, resumes only our own pause, and never touches a job the user
paused themselves. The poll script itself is silent on success (empty stdout)
and records per-source failures as degraded state, never as job errors. Real
``cron.jobs`` records against an isolated store; network and model calls are
injected (``fetcher``, ``complete_fn``).
"""
from cron import jobs as cron_jobs
from cron.scripts import feeds_poll
from hermes_cli import feeds_cron, nous_billing
from hermes_cli.feeds import FeedStore, add_source, set_source_enabled


def _isolated_cron(tmp_path, monkeypatch):
    """Point the cron store at a temp home. Plain helper (not a fixture):
    the local shim runner only injects ``tmp_path``/``monkeypatch``."""
    home = tmp_path / "hermes"
    monkeypatch.setattr("cron.jobs.CRON_DIR", home / "cron")
    monkeypatch.setattr("cron.jobs.JOBS_FILE", home / "cron" / "jobs.json")
    monkeypatch.setattr("cron.jobs.OUTPUT_DIR", home / "cron" / "output")
    return home


def _premium(monkeypatch):
    monkeypatch.setattr(nous_billing, "get_subscription_state", lambda: {"tier": "test"})
    monkeypatch.setattr(nous_billing, "require_premium_tier", lambda state: "test")


def _store(home):
    return FeedStore(home)


def test_no_sources_no_job(tmp_path, monkeypatch):
    home = _isolated_cron(tmp_path, monkeypatch)
    assert feeds_cron.sync_poll_job(_store(home)) == "ok"
    assert feeds_cron.find_poll_jobs() == []
    assert not (home / "scripts").exists()


def test_first_enabled_source_creates_job_idempotently(tmp_path, monkeypatch):
    home = _isolated_cron(tmp_path, monkeypatch)
    store = _store(home)
    add_source(store, name="Example", url="https://example.invalid/feed.xml")
    assert feeds_cron.sync_poll_job(store) == "created"
    assert feeds_cron.sync_poll_job(store) == "ok"
    jobs = feeds_cron.find_poll_jobs()
    assert len(jobs) == 1
    job = jobs[0]
    assert job["no_agent"] is True
    assert job["script"] == feeds_cron.POLL_SCRIPT_NAME
    assert job.get("enabled", True) is True
    shim = home / "scripts" / feeds_cron.POLL_SCRIPT_NAME
    assert shim.exists() and feeds_cron.SHIM_STAMP in shim.read_text(encoding="utf-8")


def test_last_source_disabled_pauses_only_ours(tmp_path, monkeypatch):
    home = _isolated_cron(tmp_path, monkeypatch)
    store = _store(home)
    source = add_source(store, name="Example", url="https://example.invalid/feed.xml")
    assert feeds_cron.sync_poll_job(store) == "created"
    set_source_enabled(store, source.id, False)
    assert feeds_cron.sync_poll_job(store) == "paused"
    job = feeds_cron.find_poll_jobs()[0]
    assert job.get("enabled", True) is False
    assert job.get("paused_reason") == feeds_cron.PAUSE_REASON_NO_SOURCES
    # A user-paused job is never resumed by sync.
    cron_jobs.update_job(job["id"], {"paused_reason": "user break"})
    set_source_enabled(store, source.id, True)
    assert feeds_cron.sync_poll_job(store) == "left-user-paused"
    assert feeds_cron.find_poll_jobs()[0].get("enabled", True) is False
    # Our own pause resumes when sources return.
    cron_jobs.update_job(job["id"], {"paused_reason": feeds_cron.PAUSE_REASON_NO_SOURCES})
    assert feeds_cron.sync_poll_job(store) == "resumed"
    assert feeds_cron.find_poll_jobs()[0].get("enabled", True) is True


def test_foreign_shim_blocks_job_creation(tmp_path, monkeypatch):
    home = _isolated_cron(tmp_path, monkeypatch)
    shim = home / "scripts" / feeds_cron.POLL_SCRIPT_NAME
    shim.parent.mkdir(parents=True, exist_ok=True)
    shim.write_text("# user's own script\nprint('hi')\n", encoding="utf-8")
    store = _store(home)
    add_source(store, name="Example", url="https://example.invalid/feed.xml")
    assert feeds_cron.sync_poll_job(store) == "blocked-no-script"
    assert feeds_cron.find_poll_jobs() == []


RSS = b"""<?xml version="1.0"?>
<rss version="2.0"><channel><title>Example</title>
<item><title>First post</title><link>https://example.invalid/1</link></item>
</channel></rss>"""


def test_script_polls_and_summarizes_silently(tmp_path, monkeypatch):
    _premium(monkeypatch)
    home = tmp_path / "hermes"
    store = FeedStore(home)
    add_source(store, name="Example", url="https://example.invalid/feed.xml",
               interval_minutes=60)
    result = feeds_poll.run(
        home,
        complete_fn=lambda messages, item: "Brief: first post happened\nWhy it matters: testing",
        now=100000.0,
        fetcher=lambda url: RSS,
    )
    assert result["new_items"] == 1
    items = store.list_items()
    assert items[0].brief == "first post happened"
    assert items[0].why_it_matters == "testing"


def test_script_skips_quietly_without_premium(tmp_path, monkeypatch):
    def boom(state):
        raise nous_billing.PremiumRequiredError("pay up")
    monkeypatch.setattr(nous_billing, "get_subscription_state", lambda: {})
    monkeypatch.setattr(nous_billing, "require_premium_tier", boom)
    assert feeds_poll.run(tmp_path / "hermes") == {"skipped": "non_premium"}


def test_script_skips_quietly_without_enabled_sources(tmp_path, monkeypatch):
    _premium(monkeypatch)
    assert feeds_poll.run(tmp_path / "hermes") == {"skipped": "no_enabled_sources"}


def test_script_model_failure_leaves_item_unbriefed(tmp_path, monkeypatch):
    _premium(monkeypatch)
    home = tmp_path / "hermes"
    store = FeedStore(home)
    add_source(store, name="Example", url="https://example.invalid/feed.xml")
    def fail(messages, item):
        raise RuntimeError("model down")
    result = feeds_poll.run(home, complete_fn=fail, now=100000.0,
                            fetcher=lambda url: RSS)
    assert result["new_items"] == 1
    assert store.list_items()[0].brief == ""


def test_main_reports_internal_errors_as_exit_1(monkeypatch):
    monkeypatch.setattr(feeds_poll, "run", lambda: 1 / 0)
    assert feeds_poll.main() == 1

"""Invariant tests for the website-forms drain (Phase 5 Minerva side).

Contract: queued portal rows become ``website-form`` intake events triaged
immediately (submission id = conversation id = submitter tracking id), each
acked done/failed exactly once; failures isolate per submission; no key or
lapsed premium skips silently with rows left queued; the portal is never
touched except through the ``_api`` seam (faked here; the HTTP contract is
pinned by the portal's own suite).
"""
import json
import re

from hermes_cli import prd_forms
from hermes_cli.prd_forms import FormsSyncError
from hermes_cli.prd_store import PrdStore


def _store(tmp_path):
    return PrdStore(tmp_path / "hermes")


def _premium(monkeypatch, ok=True):
    import hermes_cli.nous_billing as billing
    monkeypatch.setattr(billing, "get_subscription_state", lambda: {"tier": "test"})
    if ok:
        monkeypatch.setattr(billing, "require_premium_tier", lambda state: "test")
    else:
        def lapsed(state):
            raise Exception("lapsed")
        monkeypatch.setattr(billing, "require_premium_tier", lapsed)


def _portal(monkeypatch, submissions, acks, fail_fetch=False):
    def fake(method, path, key, base, body=None):
        assert key == "qkt_sec_site"
        assert base == "https://portal.example"
        if method == "GET" and path.startswith("/api/v1/intake/queued"):
            if fail_fetch:
                raise FormsSyncError("portal down")
            return {"submissions": submissions}
        if method == "POST" and path.endswith("/ack"):
            acks.append({"path": path, "body": body})
            return {"ok": True}
        raise AssertionError(f"unexpected portal call: {method} {path}")
    monkeypatch.setattr(prd_forms, "_api", fake)


def _judge(strength):
    def fn(system, user):
        return json.dumps({"strength": strength, "reason": "form ask",
                           "title": "Form feature", "duplicate_of": ""})
    return fn


def _writer(system, user):
    ids = re.findall(r"\[event ([^\]]+)\]", user)
    first = ids[0]
    return json.dumps({
        "title": "Form feature", "problem": "Users want it.", "users": "Visitors",
        "requirements": ["Build it"], "acceptance_criteria": ["It works"],
        "open_questions": [],
        "section_sources": {"problem": [first], "users": [first], "requirements": [first],
                            "acceptance_criteria": [first], "open_questions": []}})


def _sub(sub_id, brief="Please add dark mode", media=None, **overrides):
    row = {"id": sub_id, "brief": brief, "client_email": "ada@example.com",
           "organization_name": "Example Ltd", "source": "web_form",
           "created_at": "2026-10-05T10:00:00Z"}
    if media:
        row["media_url"] = media
    row.update(overrides)
    return row


def test_drain_ingests_drafts_and_acks_done(tmp_path, monkeypatch):
    _premium(monkeypatch)
    monkeypatch.setenv("MINERVA_INTAKE_API_KEY", "qkt_sec_site")
    monkeypatch.setenv("MINERVA_INTAKE_BASE_URL", "https://portal.example")
    acks = []
    _portal(monkeypatch, [_sub("s1"), _sub("s2", brief="hi")], acks)
    store = _store(tmp_path)
    result = prd_forms.sync_form_submissions(store, judge_fn=_judge(0.95), writer_fn=_writer)
    assert result["fetched"] == 2 and result["ingested"] == 2 and result["drafted"] == 2
    assert result["failed"] == {}
    assert sorted(a["body"]["status"] for a in acks) == ["done", "done"]
    events = store.list_intake("s1")
    assert len(events) == 1 and events[0]["text"] == "Please add dark mode"
    assert "Example Ltd" in events[0]["thread_context"][0]


def test_drain_forwards_phone_into_contact_line(tmp_path, monkeypatch):
    _premium(monkeypatch)
    monkeypatch.setenv("MINERVA_INTAKE_API_KEY", "qkt_sec_site")
    monkeypatch.setenv("MINERVA_INTAKE_BASE_URL", "https://portal.example")
    acks = []
    _portal(monkeypatch, [_sub("sp", client_phone="+27 82 555 0147")], acks)
    store = _store(tmp_path)
    prd_forms.sync_form_submissions(store, judge_fn=_judge(0.05), writer_fn=_writer)
    contact = store.list_intake("sp")[0]["thread_context"][0]
    assert "tel +27 82 555 0147" in contact


def test_drain_dismisses_without_prd_but_still_acks(tmp_path, monkeypatch):
    _premium(monkeypatch)
    monkeypatch.setenv("MINERVA_INTAKE_API_KEY", "qkt_sec_site")
    monkeypatch.setenv("MINERVA_INTAKE_BASE_URL", "https://portal.example")
    acks = []
    _portal(monkeypatch, [_sub("s9", brief="thanks bye")], acks)
    store = _store(tmp_path)
    result = prd_forms.sync_form_submissions(store, judge_fn=_judge(0.05), writer_fn=_writer)
    assert result["drafted"] == 0 and result["ingested"] == 1
    assert acks[0]["body"]["status"] == "done"


def test_drain_media_url_becomes_attachment_ref(tmp_path, monkeypatch):
    _premium(monkeypatch)
    monkeypatch.setenv("MINERVA_INTAKE_API_KEY", "qkt_sec_site")
    monkeypatch.setenv("MINERVA_INTAKE_BASE_URL", "https://portal.example")
    acks = []
    _portal(monkeypatch, [_sub("sm", media="https://example.com/shot.png")], acks)
    store = _store(tmp_path)
    prd_forms.sync_form_submissions(store, judge_fn=_judge(0.05), writer_fn=_writer)
    attachments = store.list_intake("sm")[0]["attachments"]
    assert attachments and attachments[0]["bytes_ref"] == "https://example.com/shot.png"


def test_drain_failure_acks_failed_and_continues(tmp_path, monkeypatch):
    _premium(monkeypatch)
    monkeypatch.setenv("MINERVA_INTAKE_API_KEY", "qkt_sec_site")
    monkeypatch.setenv("MINERVA_INTAKE_BASE_URL", "https://portal.example")
    acks = []
    _portal(monkeypatch, [_sub("bad"), _sub("good")], acks)
    import hermes_cli.prd_pipeline as pipeline
    real_ingest = pipeline.ingest_intake

    def flaky(store, **kwargs):
        if kwargs.get("conversation_id") == "bad":
            raise RuntimeError("intake store blew up")
        return real_ingest(store, **kwargs)

    monkeypatch.setattr(pipeline, "ingest_intake", flaky)
    store = _store(tmp_path)
    result = prd_forms.sync_form_submissions(store, judge_fn=_judge(0.05), writer_fn=_writer)
    assert set(result["failed"]) == {"bad"} and result["ingested"] == 1
    by_path = {a["path"].split("/")[-2]: a["body"]["status"] for a in acks}
    assert by_path == {"bad": "failed", "good": "done"}


def test_drain_skips_quietly_without_key_or_premium(tmp_path, monkeypatch):
    _premium(monkeypatch)
    monkeypatch.delenv("MINERVA_INTAKE_API_KEY", raising=False)
    store = _store(tmp_path)
    assert prd_forms.sync_form_submissions(store) == {"skipped": "no_api_key"}
    _premium(monkeypatch, ok=False)
    monkeypatch.setenv("MINERVA_INTAKE_API_KEY", "qkt_sec_site")
    assert prd_forms.sync_form_submissions(store) == {"skipped": "non_premium"}


def test_drain_fetch_failure_is_a_result_not_an_exception(tmp_path, monkeypatch):
    _premium(monkeypatch)
    monkeypatch.setenv("MINERVA_INTAKE_API_KEY", "qkt_sec_site")
    monkeypatch.setenv("MINERVA_INTAKE_BASE_URL", "https://portal.example")
    _portal(monkeypatch, [], [], fail_fetch=True)
    result = prd_forms.sync_form_submissions(_store(tmp_path))
    assert result["fetched"] == 0 and "portal down" in result["error"]


def test_forms_sync_job_lifecycle(tmp_path, monkeypatch):
    home = tmp_path / "hermes"
    monkeypatch.setattr("cron.jobs.CRON_DIR", home / "cron")
    monkeypatch.setattr("cron.jobs.JOBS_FILE", home / "cron" / "jobs.json")
    monkeypatch.setattr("cron.jobs.OUTPUT_DIR", home / "cron" / "output")
    store = PrdStore(home)
    assert prd_forms.sync_forms_job(store, True) == "created"
    assert prd_forms.sync_forms_job(store, True) == "ok"
    assert len(prd_forms.find_sync_jobs()) == 1
    assert prd_forms.sync_forms_job(store, False) == "paused"
    assert prd_forms.sync_forms_job(store, True) == "resumed"
    import cron.jobs as cron_jobs
    cron_jobs.pause_job(prd_forms.find_sync_jobs()[0]["id"], "user break")
    assert prd_forms.sync_forms_job(store, True) == "left-user-paused"


def test_forms_script_run_end_to_end(tmp_path, monkeypatch):
    _premium(monkeypatch)
    monkeypatch.setenv("MINERVA_INTAKE_API_KEY", "qkt_sec_site")
    monkeypatch.setenv("MINERVA_INTAKE_BASE_URL", "https://portal.example")
    monkeypatch.setenv("HERMES_HOME", str(tmp_path / "hermes"))
    acks = []
    _portal(monkeypatch, [_sub("s7")], acks)
    from cron.scripts import prd_forms_sync
    result = prd_forms_sync.run(judge_fn=_judge(0.95), writer_fn=_writer)
    assert result["drafted"] == 1 and len(acks) == 1
    # main() must never spend model calls: stub triage, keep the real fetch.
    import hermes_cli.prd_triage as triage
    monkeypatch.setattr(triage, "triage_conversation",
                        lambda store, cid, judge_fn=None, writer_fn=None: None)
    assert prd_forms_sync.main() == 0


def test_approved_form_prd_cites_the_submission(tmp_path, monkeypatch):
    _premium(monkeypatch)
    monkeypatch.setenv("MINERVA_INTAKE_API_KEY", "qkt_sec_site")
    monkeypatch.setenv("MINERVA_INTAKE_BASE_URL", "https://portal.example")
    _portal(monkeypatch, [_sub("s5")], [])
    store = _store(tmp_path)
    prd_forms.sync_form_submissions(store, judge_fn=_judge(0.95), writer_fn=_writer)
    from hermes_cli import prd_pipeline
    case = store.case_for_conversation("s5")
    assert case["status"] == "drafted"
    prd_pipeline.review_prd(store, case["prd_id"], "approve", "reviewer:test")
    doc = store.get_prd(case["prd_id"])
    assert doc.status == "approved"
    event_ids = [e["id"] for e in store.list_intake("s5")]
    assert doc.sources == event_ids and event_ids

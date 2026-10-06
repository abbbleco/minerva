"""Invariant tests for the Phase-4 PRD pipeline (store, triage, drafting,
review, dispatch, ingestion).

Contract: triage judges whole conversations with thresholds in code, never in
prompts; drafting validates schema + citations strictly (defects downgrade to
watch, never ship); review transitions stay audited; dispatch is
approved-only and idempotent; ingestion is the single seam every surface
shares. Network and model calls are injected (judge_fn/writer_fn/fetcher
equivalents); kanban is stubbed at its module seam (its own suites own the
real path).
"""
import json
import re

from hermes_cli import prd_command, prd_drafting, prd_pipeline, prd_triage
from hermes_cli.prd import PrdDocument, PrdError
from hermes_cli.prd_store import PrdStore


def _store(tmp_path):
    return PrdStore(tmp_path / "hermes")


def _patch_config(monkeypatch, cfg):
    import hermes_cli.config as config_mod

    monkeypatch.setattr(config_mod, "load_config", lambda: cfg)


def _event(store, conversation="conv-1", text="Build export please"):
    from hermes_cli.intake import IntakeEvent
    event = IntakeEvent.create(source="telegram", text=text, author_id="u1",
                               author_name="Ada", conversation_id=conversation)
    return store.append_intake(event.to_dict())


def _judge(strength, reason="explicit build request", title="Export", duplicate_of=""):
    def fn(system, user):
        return json.dumps({"strength": strength, "reason": reason,
                           "title": title, "duplicate_of": duplicate_of})
    return fn


def _writer(system, user):
    ids = re.findall(r"\[event ([^\]]+)\]", user)
    first = ids[0] if ids else "missing"
    return json.dumps({
        "title": "Export", "problem": "Users cannot export their data.",
        "users": "Analysts", "requirements": ["CSV export"],
        "acceptance_criteria": ["Button downloads a CSV"],
        "open_questions": [],
        "section_sources": {"problem": [first], "users": [first],
                            "requirements": [first], "acceptance_criteria": [first],
                            "open_questions": []}})


# ── store ──

def test_intake_round_trip_and_conversation_filter(tmp_path):
    store = _store(tmp_path)
    _event(store, conversation="a", text="one")
    _event(store, conversation="b", text="two")
    assert len(store.list_intake()) == 2
    assert [e["text"] for e in store.list_intake("a")] == ["one"]


def test_prd_save_get_list_filter(tmp_path):
    store = _store(tmp_path)
    doc = PrdDocument.create_draft(title="T", problem="P", sources=["e1"])
    store.save_prd(doc)
    assert store.get_prd(doc.id).title == "T"
    assert [d.id for d in store.list_prds("draft")] == [doc.id]
    assert store.list_prds("approved") == []
    assert store.get_prd("nope") is None


def test_case_validation_rejects_bad_status_and_missing_keys(tmp_path):
    store = _store(tmp_path)
    try:
        store.save_case({"id": "c1", "conversation_id": "a", "status": "bogus"})
    except Exception:
        pass
    else:
        raise AssertionError("bad status must be rejected")
    try:
        store.save_case({"id": "", "conversation_id": "a", "status": "watch"})
    except Exception:
        pass
    else:
        raise AssertionError("missing id must be rejected")
    assert store.case_for_conversation("a") is None


# ── triage fixtures ──

def test_triage_drafts_above_threshold_with_citations(tmp_path):
    store = _store(tmp_path)
    saved = _event(store)
    case = prd_triage.triage_conversation(store, "conv-1", judge_fn=_judge(0.95),
                                          writer_fn=_writer)
    assert case["status"] == "drafted"
    doc = store.get_prd(case["prd_id"])
    assert doc.status == "draft" and saved["id"] in doc.sources
    assert case["section_sources"]["requirements"] == [saved["id"]]


def test_triage_watches_ambiguity_and_dismisses_chitchat(tmp_path):
    store = _store(tmp_path)
    _event(store, conversation="w", text="maybe someday we should improve things?")
    watch = prd_triage.triage_conversation(store, "w", judge_fn=_judge(0.6, "vague"))
    assert watch["status"] == "watch"
    assert "vague" in watch["reason"]
    _event(store, conversation="d", text="thanks, that answered it!")
    dismissed = prd_triage.triage_conversation(store, "d", judge_fn=_judge(0.1, "resolved qa"))
    assert dismissed["status"] == "dismissed"


def test_triage_dedupes_against_existing_prd(tmp_path):
    store = _store(tmp_path)
    doc = PrdDocument.create_draft(title="Export", problem="No export.", sources=["e0"])
    store.save_prd(doc)
    _event(store, text="we still cannot export, please add it")
    dup = prd_triage.triage_conversation(store, "conv-1", judge_fn=_judge(0.97, "same ask", duplicate_of=doc.id),
                                         writer_fn=_writer)
    assert dup["status"] == "dismissed"
    assert doc.id in dup["reason"]
    assert dup["prd_id"] == doc.id


def test_triage_ignores_hallucinated_duplicate_id(tmp_path):
    store = _store(tmp_path)
    _event(store)
    case = prd_triage.triage_conversation(store, "conv-1", judge_fn=_judge(0.95, duplicate_of="ghost"),
                                          writer_fn=_writer)
    assert case["status"] == "drafted"


def test_triage_empty_conversation_watches_and_judge_failure_watches(tmp_path):
    store = _store(tmp_path)
    assert prd_triage.triage_conversation(store, "empty", judge_fn=_judge(0.95))["status"] == "watch"
    _event(store)
    def boom(system, user):
        raise RuntimeError("model down")
    case = prd_triage.triage_conversation(store, "conv-1", judge_fn=boom)
    assert case["status"] == "watch" and "unavailable" in case["reason"]


def test_triage_writer_failure_downgrades_to_watch(tmp_path):
    store = _store(tmp_path)
    _event(store)
    def bad_writer(system, user):
        return json.dumps({"title": "", "problem": ""})
    case = prd_triage.triage_conversation(store, "conv-1", judge_fn=_judge(0.95),
                                          writer_fn=bad_writer)
    assert case["status"] == "watch" and "draft failed" in case["reason"]


def test_triage_never_rejudges_a_shipped_conversation(tmp_path):
    store = _store(tmp_path)
    _event(store)
    first = prd_triage.triage_conversation(store, "conv-1", judge_fn=_judge(0.95), writer_fn=_writer)
    calls = []
    def counting(system, user):
        calls.append(1)
        return json.dumps({"strength": 0.95, "reason": "x", "title": "y", "duplicate_of": ""})
    second = prd_triage.triage_conversation(store, "conv-1", judge_fn=counting)
    assert second["prd_id"] == first["prd_id"] and calls == []


# ── drafting validation ──

def test_draft_writer_output_validates_citations(tmp_path):
    store = _store(tmp_path)
    saved = _event(store)
    doc, section_sources = prd_drafting.draft_prd(store.list_intake("conv-1"), writer_fn=_writer)
    assert doc.status == "draft" and saved["id"] in doc.sources
    assert section_sources["problem"] == [saved["id"]]


def test_draft_rejects_missing_requirements_unknown_and_uncited(tmp_path):
    events = [{"id": "e1", "text": "hi"}]
    for bad in (
        {"title": "T", "problem": "P", "users": "U", "requirements": [],
         "acceptance_criteria": ["A"], "open_questions": [],
         "section_sources": {"problem": ["e1"], "users": ["e1"], "requirements": [],
                             "acceptance_criteria": ["e1"], "open_questions": []}},
        {"title": "T", "problem": "P", "users": "U", "requirements": ["R"],
         "acceptance_criteria": ["A"], "open_questions": [],
         "section_sources": {"problem": ["ghost"], "users": ["e1"], "requirements": ["e1"],
                             "acceptance_criteria": ["e1"], "open_questions": []}},
        {"title": "T", "problem": "P", "users": "U", "requirements": ["R"],
         "acceptance_criteria": ["A"], "open_questions": [],
         "section_sources": {"problem": [], "users": ["e1"], "requirements": ["e1"],
                             "acceptance_criteria": ["e1"], "open_questions": []}},
    ):
        try:
            prd_drafting.parse_draft_reply(json.dumps(bad), ["e1"])
        except Exception:
            pass
        else:
            raise AssertionError(f"defective writer output must be rejected: {bad}")
    try:
        prd_drafting.draft_prd([], writer_fn=_writer)
    except Exception:
        pass
    else:
        raise AssertionError("drafting without events must fail")


# ── review ──

def _draft_doc(store):
    doc = PrdDocument.create_draft(title="T", problem="P", sources=["e1"],
                                   requirements=["R"], acceptance_criteria=["A"])
    store.save_prd(doc)
    return doc


def test_review_start_approve_reject_paths(tmp_path):
    store = _store(tmp_path)
    doc = _draft_doc(store)
    reviewed = prd_pipeline.review_prd(store, doc.id, "start", "reviewer:ada")
    assert reviewed.status == "in_review"
    approved = prd_pipeline.review_prd(store, doc.id, "approve", "reviewer:ada", "ship it")
    assert approved.status == "approved"
    assert [t.to_status for t in approved.history] == ["draft", "in_review", "approved"]

    doc2 = _draft_doc(store)
    rejected = prd_pipeline.review_prd(store, doc2.id, "reject", "reviewer:ada", "out of scope")
    assert rejected.status == "rejected"
    assert rejected.history[-1].reason == "out of scope"


def test_review_reject_needs_reason_revise_validates_and_freezes(tmp_path):
    store = _store(tmp_path)
    doc = _draft_doc(store)
    try:
        prd_pipeline.review_prd(store, doc.id, "reject", "reviewer:ada")
    except PrdError:
        pass
    else:
        raise AssertionError("reject without reason must fail")
    try:
        prd_pipeline.review_prd(store, doc.id, "revise", "reviewer:ada",
                                field="bogus", value="x")
    except PrdError:
        pass
    else:
        raise AssertionError("revise of unknown section must fail")
    revised = prd_pipeline.review_prd(store, doc.id, "revise", "reviewer:ada",
                                      field="problem", value="Sharper problem.")
    assert revised.problem == "Sharper problem."
    assert store.get_prd(doc.id).problem == "Sharper problem."
    prd_pipeline.review_prd(store, doc.id, "approve", "reviewer:ada")
    try:
        prd_pipeline.review_prd(store, doc.id, "revise", "reviewer:ada",
                                field="problem", value="Too late.")
    except PrdError:
        pass
    else:
        raise AssertionError("frozen PRD must refuse revise")


# ── dispatch ──

class _Outcome:
    def __init__(self, ok=True, child_ids=(), reason=""):
        self.ok = ok
        self.child_ids = list(child_ids)
        self.reason = reason


def _stub_kanban(monkeypatch, child_ids=("c1", "c2")):
    import hermes_cli.kanban_decompose as decomp
    calls = []
    monkeypatch.setattr(decomp, "decompose_task",
                        lambda task_id, author=None: calls.append(task_id) or _Outcome(child_ids=child_ids))
    return calls


def _stub_connect(monkeypatch, tmp_path):
    import hermes_cli.kanban_db_connect as kbc

    db_path = tmp_path / "kanban.db"
    original = kbc.connect_closing
    monkeypatch.setattr(kbc, "connect_closing", lambda: original(db_path))


def test_dispatch_refuses_unapproved_and_mints_once(tmp_path, monkeypatch):
    _stub_connect(monkeypatch, tmp_path)
    calls = _stub_kanban(monkeypatch)
    store = _store(tmp_path)
    doc = _draft_doc(store)
    try:
        prd_pipeline.dispatch_approved(store, doc.id, author="reviewer:ada")
    except PrdError:
        pass
    else:
        raise AssertionError("unapproved dispatch must be refused")
    prd_pipeline.review_prd(store, doc.id, "approve", "reviewer:ada")
    first = prd_pipeline.dispatch_approved(store, doc.id, author="reviewer:ada")
    assert first["created"] is True and first["child_ids"] == ["c1", "c2"] and calls
    # No triage case here (doc minted directly): idempotency rides the history note.
    second = prd_pipeline.dispatch_approved(store, doc.id, author="reviewer:ada")
    assert second == {"task_id": first["task_id"], "created": False, "child_ids": []}
    assert len(calls) == 1


def test_dispatch_records_linkage_on_the_triage_case(tmp_path, monkeypatch):
    _stub_connect(monkeypatch, tmp_path)
    _stub_kanban(monkeypatch)
    store = _store(tmp_path)
    _event(store)
    case = prd_triage.triage_conversation(store, "conv-1", judge_fn=_judge(0.95),
                                          writer_fn=_writer)
    prd_pipeline.review_prd(store, case["prd_id"], "approve", "reviewer:ada")
    first = prd_pipeline.dispatch_approved(store, case["prd_id"], author="reviewer:ada")
    assert first["created"] is True
    second = prd_pipeline.dispatch_approved(store, case["prd_id"], author="reviewer:ada")
    assert second == {"task_id": first["task_id"], "created": False, "child_ids": ["c1", "c2"]}


# ── ingestion seam ──

def test_ingest_stores_and_triages_text(tmp_path):
    store = _store(tmp_path)
    event, case = prd_pipeline.ingest_intake(store, source="desktop-paste", text="Build export",
                                             author_name="Ada", judge_fn=_judge(0.95),
                                             writer_fn=_writer)
    assert event["conversation_id"] == event["id"]
    assert case["status"] == "drafted"


def test_ingest_defers_triage_for_async_callers(tmp_path):
    store = _store(tmp_path)
    event, case = prd_pipeline.ingest_intake(store, source="website-form", text="Build export",
                                             triage_now=False, judge_fn=_judge(0.95))
    assert case is None and store.list_intake(event["conversation_id"])


def test_ingest_processes_text_attachments(tmp_path):
    store = _store(tmp_path)
    req = tmp_path / "request.md"
    req.write_text("# Request\nBuild export please.\n", encoding="utf-8")
    event, _ = prd_pipeline.ingest_intake(
        store, source="desktop-paste", text="see attached",
        attachments=[{"kind": "file", "mime": "text/markdown", "bytes_ref": str(req)}],
        triage_now=False)
    assert event["attachments"] and "Build export" in event["attachments"][0].get("transcript", "")


def test_observe_gateway_turn_premium_gated_and_triages(tmp_path, monkeypatch):
    import hermes_cli.nous_billing as billing
    monkeypatch.setenv("HERMES_HOME", str(tmp_path / "hermes"))
    monkeypatch.setattr(billing, "get_subscription_state", lambda: {"tier": "test"})
    monkeypatch.setattr(billing, "require_premium_tier", lambda state: "test")
    calls = []
    def counting(system, user):
        calls.append(1)
        return json.dumps({"strength": 0.95, "reason": "x", "title": "y", "duplicate_of": ""})
    prd_pipeline.observe_gateway_turn("sess-1", "telegram", "Build export", "On it.",
                                      judge_fn=counting, writer_fn=_writer)
    assert len(calls) == 1
    monkeypatch.setattr(billing, "require_premium_tier",
                        lambda state: (_ for _ in ()).throw(Exception("lapsed")))
    assert prd_pipeline.observe_gateway_turn("sess-1", "telegram", "more", judge_fn=counting) is None


# ── /prd command ──

def _seed_home(tmp_path, monkeypatch):
    monkeypatch.setenv("HERMES_HOME", str(tmp_path / "hermes"))
    store = _store(tmp_path)
    _event(store)
    case = prd_triage.triage_conversation(store, "conv-1", judge_fn=_judge(0.95),
                                          writer_fn=_writer)
    return case["prd_id"]


def test_prd_list_show_approve_reject_round_trip(tmp_path, monkeypatch):
    prd_id = _seed_home(tmp_path, monkeypatch)
    listed = prd_command.dispatch_prd_command("list", actor="reviewer:test")
    assert prd_id[:8] in listed.output and "[draft]" in listed.output
    shown = prd_command.dispatch_prd_command(f"show {prd_id[:8]}", actor="reviewer:test")
    assert "# Export" in shown.output and "## Requirements" in shown.output
    approved = prd_command.dispatch_prd_command(f"approve {prd_id}", actor="reviewer:test")
    assert approved.error is False and "approved" in approved.output


def test_prd_reject_needs_reason_and_unknowns_error(tmp_path, monkeypatch):
    prd_id = _seed_home(tmp_path, monkeypatch)
    assert prd_command.dispatch_prd_command("reject", actor="r").error is True
    assert prd_command.dispatch_prd_command(f"reject {prd_id}", actor="r").error is True
    assert prd_command.dispatch_prd_command("show nope", actor="r").error is True
    assert prd_command.dispatch_prd_command("frobnicate", actor="r").error is True
    assert prd_command.dispatch_prd_command("list bogus", actor="r").error is True
    rejected = prd_command.dispatch_prd_command(f"reject {prd_id} out of scope", actor="r")
    assert rejected.error is False


# ── config ──

def test_prds_config_defaults_and_threshold_clamping(monkeypatch):
    _patch_config(monkeypatch, {"prds": {}})
    assert prd_triage.triage_enabled() is True
    assert prd_triage.draft_threshold() == 0.85
    assert prd_triage.watch_threshold() == 0.5
    _patch_config(monkeypatch, {"prds": {"draft_threshold": 99, "watch_threshold": -3,
                                         "triage_enabled": False, "dedupe_max_prds": "many"}})
    assert prd_triage.draft_threshold() == 1.0
    assert prd_triage.watch_threshold() == 0.0
    assert prd_triage.triage_enabled() is False
    assert prd_triage.dedupe_max_prds() == 30

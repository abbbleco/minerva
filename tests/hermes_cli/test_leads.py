"""Invariant tests for the LEADS directory backend (plan phase 1).

Contract: contacts derive from session rows + pairing names + form intake —
no new capture, no database. Identity rules per channel (JID digits, Slack
team scope, group-per-chat, form email); bot and identity-less rows never
become contacts; snippets are bounded; unread counts only inbound traffic
after last_read (unknown read state reads zero, never everything); overrides
mute/pin/note without touching the derivation. Pure ``derive_contacts`` and
helpers only — the I/O layer is a thin fetch the REST phase will cover.
"""
from hermes_cli import leads
from hermes_cli.leads import contact_key, derive_contacts, snippet_for


def _row(platform, user_id, user_name, session_id, **overrides):
    origin = {
        "platform": platform,
        "chat_id": overrides.get("chat_id", f"chat-{session_id}"),
        "chat_type": overrides.get("chat_type", "dm"),
        "chat_name": overrides.get("chat_name", user_name),
        "user_id": user_id,
        "user_name": user_name,
    }
    if "scope_id" in overrides:
        origin["scope_id"] = overrides["scope_id"]
    if overrides.get("is_bot"):
        origin["is_bot"] = True
    row = {
        "session_id": session_id, "id": session_id,
        "session_key": f"agent:main:{platform}:dm:{session_id}",
        "source": platform, "origin": origin,
        "last_active": 1000.0, "last_read_at": None, "started_at": 900.0,
    }
    row.update({k: v for k, v in overrides.items()
                if k not in ("scope_id", "is_bot", "chat_id", "chat_type", "chat_name")})
    return row


def _msg(role, text, ts):
    return {"role": role, "content": text, "timestamp": ts}


def test_contact_key_matrix():
    assert contact_key("whatsapp", "dm", "c", "15551234567@s.whatsapp.net", "") == "whatsapp:15551234567"
    assert contact_key("whatsapp", "group", "120363@g.us", "1555@s.whatsapp.net", "") == "whatsapp:group:120363@g.us"
    assert contact_key("whatsapp_cloud", "dm", "c", "27825550147", "") == "whatsapp:27825550147"
    assert contact_key("slack", "dm", "c", "U123", "T1") == "slack:T1:U123"
    assert contact_key("slack", "dm", "c", "U123", "") == "slack::U123"
    assert contact_key("discord", "dm", "c", "987654321", "") == "discord:987654321"
    assert contact_key("telegram", "dm", "c", "424242", "") == "telegram:424242"
    assert contact_key("telegram", "group", "-1001", "424242", "") == "telegram:group:-1001"
    assert contact_key("signal", "dm", "c", "+1555", "") == "signal:+1555"
    assert contact_key("whatsapp", "dm", "c", "", "") is None
    assert contact_key("", "dm", "c", "u1", "") is None


def test_whatsapp_dm_derives_with_snippet_and_unread():
    rows = [_row("whatsapp", "15551234567@s.whatsapp.net", "Ada", "s1", last_read_at=100.0)]
    messages = {"s1": [_msg("user", "Hi, pricing?", 90.0),
                       _msg("assistant", "Hello!", 95.0),
                       _msg("user", "Need 10 seats.", 150.0)]}
    (contact,) = derive_contacts(rows, messages, [], {}, {})
    assert contact["key"] == "whatsapp:15551234567"
    assert contact["display_name"] == "Ada"
    assert contact["snippet"] == "Ada: Need 10 seats."
    assert contact["unread"] == 1
    assert contact["channels"][0]["platform"] == "whatsapp"


def test_unknown_read_state_reads_zero_unread():
    rows = [_row("telegram", "42", "Bo", "s1", last_read_at=None)]
    messages = {"s1": [_msg("user", "hello", 50.0)]}
    (contact,) = derive_contacts(rows, messages, [], {}, {})
    assert contact["unread"] == 0
    assert contact["snippet"] == "Bo: hello"


def test_bot_and_identity_less_rows_never_become_contacts():
    rows = [
        _row("telegram", "99", "SomeBot", "b1", is_bot=True),
        _row("slack", "", "", "nouser"),
    ]
    assert derive_contacts(rows, {}, [], {}, {}) == []


def test_group_keys_per_chat_with_chat_name():
    rows = [_row("telegram", "42", "Bo", "g1", chat_type="group",
                 chat_id="-1001", chat_name="Support")]
    (contact,) = derive_contacts(rows, {}, [], {}, {})
    assert contact["key"] == "telegram:group:-1001"
    assert contact["display_name"] == "Support"


def test_same_human_two_chats_is_one_contact_with_two_channels():
    rows = [
        _row("slack", "U1", "Ada", "s1", chat_id="D1", scope_id="T1", last_active=100.0),
        _row("slack", "U1", "Ada", "s2", chat_id="D2", scope_id="T1", last_active=200.0),
    ]
    (contact,) = derive_contacts(rows, {}, [], {}, {})
    assert contact["key"] == "slack:T1:U1"
    assert len(contact["channels"]) == 2
    assert contact["last_seen_at"] == 200.0


def test_different_slack_teams_stay_split():
    rows = [
        _row("slack", "U1", "Ada", "s1", scope_id="T1"),
        _row("slack", "U1", "Ada", "s2", scope_id="T2"),
    ]
    assert len(derive_contacts(rows, {}, [], {}, {})) == 2


def test_pairing_name_fills_missing_display_name():
    rows = [_row("discord", "987", "", "s1")]
    (contact,) = derive_contacts(rows, {}, [], {("discord", "987"): "Ada (paired)"}, {})
    assert contact["display_name"] == "Ada (paired)"


def test_form_event_becomes_email_contact_with_phone():
    events = [{
        "id": "evt-1", "source": "website-form", "author_id": "Ada@Example.COM",
        "author_name": "Example Ltd", "text": "Please add dark mode.",
        "conversation_id": "sub-1", "timestamp": "2026-10-05T10:00:00",
        "thread_context": ["Submitted by Example Ltd / ada@example.com / tel +27 82 555 0147"],
    }]
    (contact,) = derive_contacts([], {}, events, {}, {})
    assert contact["key"] == "form:ada@example.com"
    assert contact["display_name"] == "Example Ltd"
    assert contact["emails"] == ["ada@example.com"]
    assert contact["phones"] == ["+27 82 555 0147"]
    assert contact["channels"][0]["conversation_id"] == "sub-1"
    assert contact["snippet"] == "Please add dark mode."


def test_form_without_phone_has_no_phones_and_non_form_events_ignored():
    events = [
        {"id": "e1", "source": "website-form", "author_id": "Bo@x.io",
         "text": "Hi.", "conversation_id": "s1"},
        {"id": "e2", "source": "telegram", "author_id": "someone",
         "text": "Not a form.", "conversation_id": "s2"},
        {"id": "e3", "source": "website-form", "author_id": "not-an-email",
         "text": "No email.", "conversation_id": "s3"},
    ]
    (contact,) = derive_contacts([], {}, events, {}, {})
    assert contact["key"] == "form:bo@x.io"
    assert contact["phones"] == []


def test_overrides_mute_pin_note_and_sort():
    rows = [
        _row("telegram", "1", "Old", "s1", last_active=100.0),
        _row("telegram", "2", "New", "s2", last_active=200.0),
        _row("telegram", "3", "Muted", "s3", last_active=300.0),
    ]
    overrides = {
        leads._stable_id("telegram:1"): {"pinned": True},
        leads._stable_id("telegram:3"): {"muted": True, "note": "spammy"},
    }
    contacts = derive_contacts(rows, {}, [], {}, overrides)
    assert [c["display_name"] for c in contacts] == ["Old", "New", "Muted"]
    by_name = {c["display_name"]: c for c in contacts}
    assert by_name["Muted"]["muted"] is True and by_name["Muted"]["note"] == "spammy"
    assert by_name["Old"]["pinned"] is True
    # Muting is a read-time filter in list_contacts, not derivation.
    visible = [c for c in contacts if not c["muted"]]
    assert [c["display_name"] for c in visible] == ["Old", "New"]


def test_snippet_truncates_and_skips_empties():
    long_text = "x" * 200
    snippet, _ = snippet_for([{"role": "user", "content": "", "timestamp": 1.0},
                              {"role": "user", "content": long_text, "timestamp": 2.0}])
    assert len(snippet) == leads.SNIPPET_CHARS + 1 and snippet.endswith("…")
    assert snippet_for([]) == ("", 0.0)
    snippet_blocks, _ = snippet_for([{"role": "assistant",
                                     "content": [{"text": "Hello "}, {"text": "there"}],
                                     "timestamp": 3.0}])
    assert snippet_blocks == "Hello"


def test_display_falls_back_to_key():
    rows = [_row("discord", "987", "", "s1")]
    (contact,) = derive_contacts(rows, {}, [], {}, {})
    assert contact["display_name"] == "discord:987"


def test_whatsapp_number_links_form_contact_with_same_phone():
    form_event = {
        "id": "evt-9", "source": "website-form", "author_id": "ada@example.com",
        "author_name": "Example Ltd", "text": "Please add dark mode.",
        "conversation_id": "sub-9", "timestamp": "2026-10-05T10:00:00",
        "thread_context": ["Submitted by Example Ltd / ada@example.com / tel +1 555 123 4567"],
    }
    wa_row = _row("whatsapp", "15551234567@s.whatsapp.net", "Ada", "s9")
    contacts = derive_contacts([wa_row], {}, [form_event], {}, {})
    assert len(contacts) == 2
    by_id = {c["id"]: c for c in contacts}
    wa = next(c for c in contacts if c["platform"] == "whatsapp")
    form = next(c for c in contacts if c["platform"] == "form")
    assert wa["phones"] == ["15551234567"]
    assert wa["also_on"] == [{"contact_id": form["id"], "display_name": "Example Ltd",
                              "via": "phone 15551234567"}]
    assert form["also_on"] == [{"contact_id": wa["id"], "display_name": "Ada",
                                "via": "phone +1 555 123 4567"}]
    assert by_id


def test_also_on_hints_when_contacts_share_email_or_phone():
    from hermes_cli.leads import _attach_sharing_hints
    ada_wa = {"id": "c1", "display_name": "Ada", "emails": ["ada@example.com"],
              "phones": ["+2711"], "muted": False, "pinned": False, "last_seen_at": 2.0}
    ada_form = {"id": "c2", "display_name": "Example Ltd", "emails": ["ADA@example.com"],
                "phones": ["+2711"], "muted": False, "pinned": False, "last_seen_at": 1.0}
    solo = {"id": "c3", "display_name": "Bo", "emails": [], "phones": [],
            "muted": False, "pinned": False, "last_seen_at": 3.0}
    contacts = {"k1": ada_wa, "k2": ada_form, "k3": solo}
    _attach_sharing_hints(contacts)
    assert ada_wa["also_on"] == [{"contact_id": "c2", "display_name": "Example Ltd",
                                  "via": "email ada@example.com"}]
    assert ada_form["also_on"] == [{"contact_id": "c1", "display_name": "Ada",
                                   "via": "email ADA@example.com"}]
    assert solo["also_on"] == []


def test_unread_accumulates_across_channels():
    rows = [
        _row("slack", "U1", "Ada", "s1", scope_id="T1", last_read_at=100.0),
        _row("slack", "U1", "Ada", "s2", scope_id="T1", last_read_at=100.0),
    ]
    messages = {"s1": [_msg("user", "one", 150.0)],
                "s2": [_msg("user", "two", 160.0), _msg("user", "three", 170.0)]}
    (contact,) = derive_contacts(rows, messages, [], {}, {})
    assert contact["unread"] == 3


def test_overrides_round_trip_and_empty_directory(tmp_path, monkeypatch):
    monkeypatch.setenv("HERMES_HOME", str(tmp_path / "hermes"))
    assert leads.get_overrides() == {}
    assert leads.list_contacts() == []
    leads.set_override("c_abc", muted=True, note="hi")
    assert leads.get_overrides() == {"c_abc": {"muted": True, "note": "hi"}}
    leads.set_override("c_abc", pinned=True)
    assert leads.get_overrides()["c_abc"] == {"muted": True, "note": "hi", "pinned": True}


def _wa_form_pair():
    form_event = {
        "id": "evt-9", "source": "website-form", "author_id": "ada@example.com",
        "author_name": "Example Ltd", "text": "Please add dark mode.",
        "conversation_id": "sub-9", "timestamp": "2026-10-05T10:00:00",
        "thread_context": ["Submitted by Example Ltd / ada@example.com / tel +1 555 123 4567"],
    }
    wa_row = _row("whatsapp", "15551234567@s.whatsapp.net", "Ada", "s9",
                  last_read_at=10.0)
    messages = {"s9": [_msg("user", "Pricing?", 50.0)]}
    return [wa_row], messages, [form_event]


def test_merge_folds_source_into_target_losslessly():
    rows, messages, events = _wa_form_pair()
    wa_id = leads._stable_id("whatsapp:15551234567")
    form_id = leads._stable_id("form:ada@example.com")
    # Fold reads plain override dicts (no DB): merge_contacts is only the writer.
    overrides = {form_id: {"merged_into": wa_id}}
    contacts = derive_contacts(rows, messages, events, {}, overrides)
    assert [c["id"] for c in contacts] == [wa_id]
    (target,) = contacts
    assert "ada@example.com" in target["emails"]
    assert "+1 555 123 4567" in target["phones"]
    assert len(target["channels"]) == 2
    assert target["unread"] == 1
    assert target["merged_from"] == [{"id": form_id, "display_name": "Example Ltd"}]


def test_unmerge_restores_both_contacts():
    rows, messages, events = _wa_form_pair()
    wa_id = leads._stable_id("whatsapp:15551234567")
    form_id = leads._stable_id("form:ada@example.com")
    assert len(derive_contacts(rows, messages, events, {}, {form_id: {"merged_into": wa_id}})) == 1
    assert len(derive_contacts(rows, messages, events, {}, {})) == 2


def test_merge_rejects_self_and_empty_ids():
    for source, target in (("c_a", "c_a"), ("", "c_b"), ("c_a", "")):
        try:
            leads.merge_contacts(source, target)
        except leads.MergeError:
            pass
        else:
            raise AssertionError(f"merge({source!r}, {target!r}) must be refused")
    assert leads.unmerge_contact("c_nobody") is False


def test_merge_rules_against_stored_overrides(tmp_path, monkeypatch):
    monkeypatch.setenv("HERMES_HOME", str(tmp_path / "hermes"))
    leads.merge_contacts("c_a", "c_b")
    try:
        leads.merge_contacts("c_c", "c_a")
    except leads.MergeError as exc:
        assert "unmerge it first" in str(exc)
    else:
        raise AssertionError("merging into a merged-away target must be refused")
    assert leads.unmerge_contact("c_a") is True
    assert leads.unmerge_contact("c_a") is False

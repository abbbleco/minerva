"""Invariant tests for curated feeds.

Contract: deterministic fetch+parse here, model calls only through the
injected ``complete_fn``. Poll failures back off per source without blocking
siblings; dedupe is by URL identity; the store caps per-source growth.
Network is never touched: ``fetcher`` injects bytes.
"""
import pytest

from hermes_cli import feeds
from hermes_cli.feeds import (
    FeedItem,
    FeedSource,
    FeedStore,
    FeedsError,
    add_source,
    build_summarize_prompt,
    item_id,
    mark_read,
    parse_summary_reply,
    poll_due,
    poll_source,
    remove_source,
    set_source_enabled,
    summarize_items,
)

RSS = b"""<?xml version="1.0"?>
<rss version="2.0"><channel><title>Example</title>
<item><title>First post</title><link>https://example.invalid/1</link>
<pubDate>Mon, 05 Oct 2026 12:00:00 GMT</pubDate></item>
<item><title>Second post</title><link>https://example.invalid/2</link></item>
<item><title></title><link>https://example.invalid/empty</link></item>
</channel></rss>"""

ATOM = b"""<?xml version="1.0"?>
<feed xmlns="http://www.w3.org/2005/Atom"><title>Example</title>
<entry><title>Atom post</title><link href="https://example.invalid/a"/>
<updated>2026-10-05T12:00:00Z</updated></entry>
</feed>"""

GARBAGE = b"<html><body>not a feed at all"


def _source(**overrides):
    args = {"id": "s1", "name": "Example", "url": "https://example.invalid/feed.xml"}
    args.update(overrides)
    return FeedSource(**args)


def test_poll_source_extracts_entries_and_skips_untitled():
    items, updated = poll_source(_source(), fetcher=lambda url: RSS, now=1000.0)
    assert [i.title for i in items] == ["First post", "Second post"]
    assert items[0].url == "https://example.invalid/1"
    assert items[0].published_at is not None
    assert updated.last_polled_at == 1000.0
    assert updated.consecutive_failures == 0


def test_poll_source_handles_atom():
    items, _ = poll_source(_source(), fetcher=lambda url: ATOM)
    assert [i.title for i in items] == ["Atom post"]


def test_poll_source_dedupes_by_url_identity():
    first, _ = poll_source(_source(), fetcher=lambda url: RSS)
    known = {i.id for i in first}
    second, _ = poll_source(_source(), known_ids=set(known), fetcher=lambda url: RSS)
    assert second == []
    # Same URL under a different guid still dedupes: URL is the identity.
    assert item_id("s1", "https://example.invalid/1", "other-guid") == item_id("s1", "https://example.invalid/1")


def test_poll_source_raises_on_garbage():
    with pytest.raises(Exception):
        poll_source(_source(), fetcher=lambda url: GARBAGE)


def test_source_validation_rejects_bad_urls_and_intervals():
    with pytest.raises(FeedsError):
        FeedSource(id="x", name="x", url="ftp://example.invalid/feed").validate()
    with pytest.raises(FeedsError):
        FeedSource(id="x", name="x", url="https://example.invalid/feed.xml",
                   interval_minutes=1).validate()


def test_due_at_respects_interval_enable_and_backoff():
    assert _source(last_polled_at=0.0).due_at(now=3600.0 * 2) is True
    assert _source(last_polled_at=3590.0).due_at(now=3600.0) is False
    assert _source(last_polled_at=0.0, enabled=False).due_at(now=999999.0) is False
    # One failure doubles the 60min gap: not due at +61min, due at +121min.
    failing = _source(last_polled_at=0.0, consecutive_failures=1)
    assert failing.due_at(now=61 * 60.0) is False
    assert failing.due_at(now=121 * 60.0) is True


def test_poll_due_persists_items_sources_and_backoff(tmp_path):
    store = FeedStore(tmp_path / "hermes")
    good = add_source(store, name="Good", url="https://example.invalid/good.xml")
    bad = add_source(store, name="Bad", url="https://example.invalid/bad.xml")

    def fetcher(url):
        if "bad" in url:
            raise ConnectionError("dns down")
        return RSS

    result = poll_due(store, now=100000.0, fetcher=fetcher)
    assert result["polled"] == [good.id]
    assert result["new_items"] == 2
    assert list(result["failed"]) == [bad.id]
    assert store.list_sources()[1].consecutive_failures == 1
    assert len(store.list_items()) == 2

    # Second run: nothing due (intervals fresh), failures preserved.
    again = poll_due(store, now=100001.0, fetcher=fetcher)
    assert again["polled"] == [] and again["new_items"] == 0


def test_poll_due_caps_per_source(tmp_path, monkeypatch):
    import hermes_cli.feeds as feeds_mod
    monkeypatch.setattr(feeds_mod, "MAX_ITEMS_PER_SOURCE", 1)
    store = FeedStore(tmp_path / "hermes")
    add_source(store, name="Good", url="https://example.invalid/good.xml")
    poll_due(store, now=100000.0, fetcher=lambda url: RSS)
    assert len(store.list_items()) == 1


def test_add_source_idempotent_on_url_remove_drops_items(tmp_path):
    store = FeedStore(tmp_path / "hermes")
    first = add_source(store, name="A", url="https://example.invalid/a.xml")
    assert add_source(store, name="B", url="https://example.invalid/a.xml").id == first.id
    assert len(store.list_sources()) == 1
    store.save_items([FeedItem(id="i1", source_id=first.id, title="t", url="u")])
    assert remove_source(store, first.id) is True
    assert store.list_sources() == [] and store.list_items() == []
    assert remove_source(store, "nope") is False


def test_set_source_enabled_and_mark_read(tmp_path):
    store = FeedStore(tmp_path / "hermes")
    source = add_source(store, name="A", url="https://example.invalid/a.xml")
    assert set_source_enabled(store, source.id, False) is True
    assert store.list_sources()[0].enabled is False
    assert set_source_enabled(store, "nope", True) is False
    store.save_items([FeedItem(id="i1", source_id=source.id, title="t", url="u")])
    assert mark_read(store, "i1") is True
    assert store.list_items()[0].read is True
    assert mark_read(store, "nope") is False


def test_default_sources_ship_something_sane(tmp_path):
    store = FeedStore(tmp_path / "hermes")
    assert store.list_sources() == []
    sources = store.ensure_defaults()
    assert len(sources) >= 1
    for source in sources:
        source.validate()
    # Second call is a no-op read, not a duplicate seed.
    assert [s.id for s in store.ensure_defaults()] == [s.id for s in sources]


def test_build_summarize_prompt_shape_and_parse():
    messages = build_summarize_prompt("Big news", "https://example.invalid/1", "2026-10-05")
    assert messages[0]["role"] == "system" and messages[1]["role"] == "user"
    assert "Big news" in messages[1]["content"]
    brief, why = parse_summary_reply("Brief: X happened.\nWhy it matters: Y because Z.")
    assert (brief, why) == ("X happened.", "Y because Z.")
    assert parse_summary_reply("just some prose") == ("", "")
    assert parse_summary_reply("") == ("", "")


def test_summarize_items_fills_and_skips_and_survives():
    items = [
        FeedItem(id="a", source_id="s", title="A", url="u1"),
        FeedItem(id="b", source_id="s", title="B", url="u2", brief="kept", why_it_matters="kept"),
        FeedItem(id="c", source_id="s", title="C", url="u3"),
    ]

    def complete(messages, item):
        assert messages[0]["role"] == "system"
        if item.id == "c":
            raise RuntimeError("model down")
        return "Brief: Did the thing.\nWhy it matters: Because reasons."

    out = summarize_items(items, complete)
    assert out[0].brief == "Did the thing." and out[0].why_it_matters == "Because reasons."
    assert out[1].brief == "kept"
    assert out[2].brief == "" and out[2].why_it_matters == ""

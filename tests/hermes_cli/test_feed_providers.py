"""Invariant tests for feed providers (bring-your-own-token social sources).

Contract: every provider normalizes to the RSS entry shape
({title, link, published, author, summary}) so downstream mapping is shared;
credential problems raise ProviderAuthError (user must reconnect), everything
else is an ordinary failure for backoff. No network is touched: HTTP is
injected at the urlopen seam with fixture Graph API payloads.
"""
import io
import json
import urllib.error
import urllib.request

import pytest

from hermes_cli import feeds
from hermes_cli.feeds import (
    FeedSource,
    FeedsError,
    ProviderAuthError,
    fetch_facebook_feed,
    fetch_instagram_feed,
    known_providers,
    poll_source,
    provider_token_env,
    read_provider_secret,
    validate_facebook_token,
    validate_instagram_token,
)


FACEBOOK_FEED = {
    "data": [
        {"id": "1", "message": "Hello world\nsecond line here",
         "created_time": "2026-10-05T12:00:00+0000",
         "permalink_url": "https://facebook.com/p/1",
         "from": {"name": "Ada"}},
        {"id": "2", "message": "   ",
         "created_time": "2026-10-05T13:00:00+0000",
         "permalink_url": "https://facebook.com/p/2",
         "from": {"name": "Nobody"}},
        {"id": "3",
         "created_time": "2026-10-05T14:00:00+0000",
         "permalink_url": "https://facebook.com/p/3",
         "from": {"name": "Silent"}},
    ]
}


class _FakeResponse:
    def __init__(self, payload, status=200):
        self._body = json.dumps(payload).encode()
        self.status = status

    def read(self):
        return self._body

    def __enter__(self):
        return self

    def __exit__(self, *args):
        return False


def _install(monkeypatch, payload=None, status=200, exc=None):
    def fake_urlopen(request, timeout=None):
        if exc is not None:
            raise exc
        return _FakeResponse(payload, status)
    monkeypatch.setattr(urllib.request, "urlopen", fake_urlopen)


def _facebook_source(**overrides):
    args = {"id": "fb1", "name": "Facebook", "url": "https://facebook.com/me",
            "provider": "facebook", "auth_ref": "FEEDS_FACEBOOK_TOKEN"}
    args.update(overrides)
    return FeedSource(**args)


INSTAGRAM_ACCOUNTS = {
    "data": [
        {"id": "page1", "instagram_business_account": {"id": "17841400000000000", "username": "abbble"}},
        {"id": "page2"},
    ]
}

INSTAGRAM_MEDIA = {
    "data": [
        {"id": "m1", "caption": "New drop is live\nShop the link in bio",
         "media_type": "IMAGE", "timestamp": "2026-10-05T12:00:00+0000",
         "permalink": "https://instagram.com/p/m1", "username": "abbble"},
        {"id": "m2", "caption": "   ",
         "media_type": "VIDEO", "timestamp": "2026-10-05T13:00:00+0000",
         "permalink": "https://instagram.com/p/m2", "username": "abbble"},
        {"id": "m3",
         "media_type": "CAROUSEL_ALBUM", "timestamp": "2026-10-05T14:00:00+0000",
         "permalink": "https://instagram.com/p/m3", "username": "abbble"},
    ]
}


def _install_many(monkeypatch, payloads):
    """Serve one fixture payload per sequential Graph call (Instagram polls do
    discovery, then media). Extra calls reuse the last payload."""
    queue = list(payloads)

    def fake_urlopen(request, timeout=None):
        payload = queue.pop(0) if len(queue) > 1 else queue[0]
        return _FakeResponse(payload)

    monkeypatch.setattr(urllib.request, "urlopen", fake_urlopen)


def _instagram_source(**overrides):
    args = {"id": "ig1", "name": "Instagram", "url": "https://instagram.com",
            "provider": "instagram", "auth_ref": "FEEDS_INSTAGRAM_TOKEN"}
    args.update(overrides)
    return FeedSource(**args)


def test_known_providers_lists_rss_and_registered():
    assert "rss" in known_providers()
    assert "facebook" in known_providers()
    assert "instagram" in known_providers()


def test_provider_token_env_naming():
    assert provider_token_env("facebook") == "FEEDS_FACEBOOK_TOKEN"
    assert provider_token_env("instagram") == "FEEDS_INSTAGRAM_TOKEN"


def test_register_provider_rejects_rss_override():
    with pytest.raises(FeedsError):
        feeds.register_provider("rss", lambda source, token: [])


def test_poll_source_unknown_provider_fails_loud():
    with pytest.raises(FeedsError):
        poll_source(_facebook_source(provider="myspace"))


def test_poll_source_without_credential_asks_to_reconnect(monkeypatch):
    monkeypatch.setenv("FEEDS_FACEBOOK_TOKEN", "")
    with pytest.raises(ProviderAuthError):
        poll_source(_facebook_source())


def test_facebook_maps_posts_to_entries(monkeypatch):
    _install(monkeypatch, FACEBOOK_FEED)
    entries = fetch_facebook_feed(_facebook_source(), "tok123")
    # Empty-message posts are skipped (no title can be derived).
    assert [e["title"] for e in entries] == ["Hello world"]
    assert entries[0]["link"] == "https://facebook.com/p/1"
    assert entries[0]["author"] == "Ada"
    assert "second line" in entries[0]["summary"]


def test_facebook_poll_end_to_end(monkeypatch):
    _install(monkeypatch, FACEBOOK_FEED)
    monkeypatch.setenv("FEEDS_FACEBOOK_TOKEN", "tok123")
    items, updated = poll_source(_facebook_source(), now=1000.0)
    assert len(items) == 1 and items[0].source_id == "fb1"
    assert updated.last_error is None


def test_facebook_expired_token_is_auth_error_not_backoff(monkeypatch):
    error_body = {"error": {"message": "Invalid OAuth access token", "code": 190}}
    _install(monkeypatch, None, exc=urllib.error.HTTPError(
        "https://graph.facebook.com/", 401, "Unauthorized", {}, io.BytesIO(json.dumps(error_body).encode())))
    with pytest.raises(ProviderAuthError):
        fetch_facebook_feed(_facebook_source(), "tok-expired")


def test_facebook_transport_failure_is_ordinary(monkeypatch):
    _install(monkeypatch, None, exc=ConnectionError("dns down"))
    try:
        fetch_facebook_feed(_facebook_source(), "tok123")
    except ProviderAuthError:
        raise AssertionError("transport failure must not masquerade as auth failure")
    except Exception:
        pass


def test_validate_facebook_token_returns_account(monkeypatch):
    _install(monkeypatch, {"id": "42", "name": "Ada Lovelace"})
    assert validate_facebook_token("tok123") == {"ok": True, "account": "Ada Lovelace"}


def test_validate_rejects_empty_and_bad_tokens(monkeypatch):
    with pytest.raises(ProviderAuthError):
        validate_facebook_token("  ")
    error_body = {"error": {"message": "Invalid OAuth access token", "code": 190}}
    _install(monkeypatch, None, exc=urllib.error.HTTPError(
        "https://graph.facebook.com/", 401, "Unauthorized", {}, io.BytesIO(json.dumps(error_body).encode())))
    with pytest.raises(ProviderAuthError):
        validate_facebook_token("tok-bad")


def test_read_provider_secret_prefers_profile_scope(monkeypatch):
    monkeypatch.setenv("FEEDS_FACEBOOK_TOKEN", "from-env")
    assert read_provider_secret("FEEDS_FACEBOOK_TOKEN") == "from-env"
    assert read_provider_secret(None) == ""
    assert read_provider_secret("") == ""
    monkeypatch.delenv("FEEDS_FACEBOOK_TOKEN", raising=False)
    assert read_provider_secret("FEEDS_FACEBOOK_TOKEN") == ""


def test_instagram_discovers_account_then_maps_media(monkeypatch):
    _install_many(monkeypatch, [INSTAGRAM_ACCOUNTS, INSTAGRAM_MEDIA])
    entries = fetch_instagram_feed(_instagram_source(), "tok123")
    # Caption-less media are skipped (no title can be derived).
    assert [e["title"] for e in entries] == ["New drop is live"]
    assert entries[0]["link"] == "https://instagram.com/p/m1"
    assert entries[0]["author"] == "abbble"
    assert "Shop the link" in entries[0]["summary"]


def test_instagram_poll_end_to_end(monkeypatch):
    _install_many(monkeypatch, [INSTAGRAM_ACCOUNTS, INSTAGRAM_MEDIA])
    monkeypatch.setenv("FEEDS_INSTAGRAM_TOKEN", "tok123")
    items, updated = poll_source(_instagram_source(), now=1000.0)
    assert len(items) == 1 and items[0].source_id == "ig1"
    assert updated.last_error is None


def test_instagram_without_linked_account_asks_to_reconnect(monkeypatch):
    _install(monkeypatch, {"data": [{"id": "page1"}]})
    with pytest.raises(ProviderAuthError) as excinfo:
        fetch_instagram_feed(_instagram_source(), "tok123")
    assert "business account" in str(excinfo.value)


def test_instagram_without_credential_asks_to_reconnect(monkeypatch):
    monkeypatch.setenv("FEEDS_INSTAGRAM_TOKEN", "")
    with pytest.raises(ProviderAuthError):
        poll_source(_instagram_source())


def test_validate_instagram_token_returns_username(monkeypatch):
    _install(monkeypatch, INSTAGRAM_ACCOUNTS)
    assert validate_instagram_token("tok123") == {"ok": True, "account": "abbble"}


def test_validate_instagram_rejects_empty_and_unlinked(monkeypatch):
    with pytest.raises(ProviderAuthError):
        validate_instagram_token("  ")
    _install(monkeypatch, {"data": []})
    with pytest.raises(ProviderAuthError):
        validate_instagram_token("tok-no-ig")

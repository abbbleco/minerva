"""HttpChannelStore: the channel publisher against the Minerva Assets origin.

Covers the three operations ChannelPublisher depends on - get with an ETag,
compare-and-swap put, and prefix listing - and the status mapping that decides
whether a failure is retryable. The origin itself is proven by its own
end-to-end smoke test (minerva-monorepo/apps/minerva-assets/scripts/smoke.mjs),
so these tests fix the CLIENT contract.
"""
from __future__ import annotations

import json

import pytest

from hermes_cli.release_channels import ChannelError
from scripts.releases.channels import ChannelConflict, HttpChannelStore

ORIGIN = "https://minerva-assets.abbble.co.za"
RECORD = b'{"schema":1,"name":"stable"}\n'


class FakeOrigin:
    """Records calls and replays a scripted (status, headers, body) per call."""

    def __init__(self, *responses):
        self.responses = list(responses)
        self.calls: list[tuple[str, str, dict]] = []

    def __call__(self, method: str, url: str, *, body=None, headers=None):
        self.calls.append((method, url, dict(headers or {}), body))
        return self.responses.pop(0) if self.responses else (200, {}, b"{}")


def store(*responses, token="secret") -> tuple[HttpChannelStore, FakeOrigin]:
    origin = FakeOrigin(*responses)
    subject = HttpChannelStore(ORIGIN, token, opener=origin)
    return subject, origin


def test_get_returns_body_and_etag():
    subject, origin = store((200, {"etag": 'W/"1-2"'}, RECORD))
    assert subject.get("releases/channels/stable.json") == (RECORD, 'W/"1-2"')
    method, url, headers, _ = origin.calls[0]
    assert method == "GET"
    assert url == f"{ORIGIN}/releases/channels/stable.json"
    assert headers["authorization"] == "Bearer secret"


def test_get_missing_key_is_none_not_an_error():
    subject, _ = store((404, {}, b""))
    assert subject.get("releases/channels/stable.json") is None


def test_get_without_etag_is_refused():
    # The publisher's whole CAS loop is built on the ETag; a read that omits it
    # must fail loudly rather than silently downgrade to a blind overwrite.
    subject, _ = store((200, {}, RECORD))
    with pytest.raises(ChannelError, match="ETag"):
        subject.get("releases/channels/stable.json")


def test_get_rejects_an_oversized_body():
    subject, _ = store((200, {"etag": "x"}, b"a" * (4 * 1024 * 1024 + 1)))
    with pytest.raises(ChannelError, match="size limit"):
        subject.get("releases/channels/stable.json")


def test_put_without_etag_is_create_only():
    subject, origin = store((201, {}, b"{}"))
    subject.put("releases/channels/canary.json", RECORD)
    _, url, headers, body = origin.calls[0]
    assert url == f"{ORIGIN}/api/publish?key=releases%2Fchannels%2Fcanary.json"
    assert headers["If-None-Match"] == "*"
    assert "If-Match" not in headers
    assert body == RECORD


def test_put_with_etag_is_compare_and_swap():
    subject, origin = store((200, {}, b"{}"))
    subject.put("releases/channels/stable.json", RECORD, etag='W/"9-a"')
    _, _, headers, _ = origin.calls[0]
    assert headers["If-Match"] == 'W/"9-a"'
    assert "If-None-Match" not in headers


@pytest.mark.parametrize("status", [412])
def test_precondition_failure_is_a_conflict(status):
    subject, _ = store((status, {}, b""))
    with pytest.raises(ChannelConflict):
        subject.put("releases/channels/stable.json", RECORD, etag='W/"9-a"')


@pytest.mark.parametrize("status", [401, 403])
def test_unauthorized_is_named_not_retried(status):
    subject, _ = store((status, {}, b""))
    with pytest.raises(ChannelError, match="unauthorized"):
        subject.put("releases/channels/stable.json", RECORD)


def test_validation_refusal_carries_the_origins_reason():
    # A 422 means the origin rejected the DOCUMENT. The publisher needs to see
    # which rule broke, otherwise it can only say "write failed".
    subject, _ = store((422, {}, b'{"detail":"head.manifestKey must be ..."}'))
    with pytest.raises(ChannelError, match="manifestKey"):
        subject.put("releases/channels/stable.json", RECORD)


def test_immutable_overwrite_refusal_is_terminal():
    subject, _ = store((409, {}, b'{"error":"refusing to overwrite"}'))
    with pytest.raises(ChannelError, match="refused"):
        subject.put("releases/channel-builds/" + "0" * 32 + "/build.json", RECORD)


def test_unconfigured_origin_is_named():
    subject, _ = store((503, {}, b'{"error":"MINERVA_ASSETS_ROOT unset"}'))
    with pytest.raises(ChannelError, match="not configured"):
        subject.put("releases/channels/stable.json", RECORD)


@pytest.mark.parametrize("status", [500, 502, 504])
def test_server_error_is_uncertain_not_a_conflict(status):
    # A lost response must not be reported as a conflict: the write may have
    # landed, and the operator has to inspect before retrying.
    subject, _ = store((status, {}, b""))
    with pytest.raises(ChannelError, match="uncertain"):
        subject.put("releases/channels/stable.json", RECORD)


def test_keys_lists_the_prefix():
    payload = json.dumps({"keys": ["releases/channels/canary.json", "releases/channels/stable.json"]})
    subject, origin = store((200, {}, payload.encode()))
    assert subject.keys("releases/channels/") == [
        "releases/channels/canary.json", "releases/channels/stable.json"]
    method, url, headers, _ = origin.calls[0]
    assert method == "GET"
    assert url.startswith(f"{ORIGIN}/api/objects?prefix=")
    assert headers["authorization"] == "Bearer secret"


@pytest.mark.parametrize("payload", [b"not json", b"{}", b'{"keys":"nope"}', b'{"keys":[1,2]}'])
def test_malformed_listing_is_refused(payload):
    subject, _ = store((200, {}, payload))
    with pytest.raises(ChannelError, match="malformed"):
        subject.keys("releases/channels/")


def test_empty_token_is_refused_at_construction():
    # Fail closed: a publisher with no token has no write path, rather than an
    # open one that a misconfigured CI run would discover in production.
    with pytest.raises(ChannelError, match="token is required"):
        HttpChannelStore(ORIGIN, "")


def test_trailing_slash_on_origin_is_normalised():
    assert HttpChannelStore(f"{ORIGIN}/", "t", opener=FakeOrigin()).origin == ORIGIN


def test_invalid_key_never_reaches_the_network():
    subject, origin = store()
    with pytest.raises(ChannelError):
        subject.get("releases/../../etc/passwd")
    assert origin.calls == []

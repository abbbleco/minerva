"""Curated feeds: poll RSS/Atom sources, dedupe, summarize at ingest.

Architecture (deliberately boring): deterministic fetch+parse here, model
calls only for summarization through the caller's ``complete_fn``. This module
never touches the network beyond fetching a source, never opens chats, never
steals focus — it is a library the RPC layer, the CLI and the scheduler all
call. Scheduling (when to poll) belongs to the caller; this module answers
"what is due" (``due_sources``) and "poll now" (``poll_source``).

Storage is two JSON files under ``HERMES_HOME/feeds/`` (``sources.json``,
``items.json``), written atomically. Items are capped per source so one chatty
feed cannot grow the store without bound.
"""
from __future__ import annotations

import hashlib
import json
import logging
import os
import tempfile
import time
import urllib.error
import urllib.request
from dataclasses import asdict, dataclass, field
from pathlib import Path
from typing import Any, Callable, Dict, List, Optional

logger = logging.getLogger(__name__)

DEFAULT_POLL_INTERVAL_MINUTES = 60
MAX_ITEMS_PER_SOURCE = 200
MAX_BRIEF_CHARS = 600
FETCH_TIMEOUT_SECONDS = 20

# Shipped defaults: high-stability, long-lived feeds. This is a starting set,
# not an endorsement — users manage their own list, and a dead default
# degrades visibly rather than blocking the panel.
DEFAULT_SOURCES = (
    {"name": "Hacker News", "url": "https://news.ycombinator.com/rss"},
)


class FeedsError(ValueError):
    """A feeds operation failed validation."""


class ProviderAuthError(FeedsError):
    """A provider rejected the credential (expired/revoked token, missing
    permission). Unlike transport failures this never heals by retrying: the
    user must reconnect. Callers distinguish it to surface "Reconnect" instead
    of silent backoff."""


# Feed providers beyond plain RSS. ``rss`` needs no credential; every other
# provider reads its token from the profile secret scope via ``auth_ref`` (the
# env var NAME, never the secret — secrets never touch the store file).
RSS_PROVIDER = "rss"

#: Env var holding the provider token, by provider. One account connection per
#: provider per profile: the user authenticates once, every source on that
#: provider shares it. Revocation is a single delete.
def provider_token_env(provider: str) -> str:
    return f"FEEDS_{provider.upper()}_TOKEN"


@dataclass(frozen=True)
class FeedSource:
    """One polled source. ``interval_minutes`` is a minimum gap, not a
    schedule: the caller decides when to run; this decides what is due."""
    id: str
    name: str
    url: str
    interval_minutes: int = DEFAULT_POLL_INTERVAL_MINUTES
    enabled: bool = True
    last_polled_at: float = 0.0
    consecutive_failures: int = 0
    provider: str = RSS_PROVIDER
    auth_ref: Optional[str] = None
    last_error: Optional[str] = None

    def validate(self) -> None:
        if not self.id or not self.url:
            raise FeedsError("feed source needs an id and a url")
        if self.provider != RSS_PROVIDER:
            # Provider sources address an API, not a document: the url is a
            # label for display, and any http(s) value (or empty) is accepted.
            if self.url and not self.url.startswith(("http://", "https://")):
                raise FeedsError(f"feed source url must be http(s): {self.url[:80]}")
        else:
            parsed = urllib.parse.urlparse(self.url)
            if parsed.scheme not in ("http", "https") or not parsed.hostname:
                raise FeedsError(f"feed source url must be http(s): {self.url[:80]}")
        if self.provider != RSS_PROVIDER and not self.auth_ref:
            raise FeedsError(f"provider {self.provider!r} needs an auth_ref naming its token")
        if self.interval_minutes < 5:
            raise FeedsError("feed poll interval must be at least 5 minutes")

    def due_at(self, now: Optional[float] = None) -> bool:
        """Due when enabled and the interval elapsed. Failures back off
        exponentially (15min, 30min, 1h, capped at 6h) so a dead source
        degrades quietly instead of hammering on every tick."""
        if not self.enabled:
            return False
        now = time.time() if now is None else now
        gap = self.interval_minutes * 60 * (2 ** min(self.consecutive_failures, 3))
        gap = min(gap, 6 * 3600)
        return (now - self.last_polled_at) >= gap

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "FeedSource":
        auth_ref = data.get("auth_ref")
        last_error = data.get("last_error")
        source = cls(
            id=str(data.get("id", "")),
            name=str(data.get("name", "") or data.get("url", "")),
            url=str(data.get("url", "")),
            interval_minutes=int(data.get("interval_minutes", DEFAULT_POLL_INTERVAL_MINUTES)),
            enabled=bool(data.get("enabled", True)),
            last_polled_at=float(data.get("last_polled_at", 0.0)),
            consecutive_failures=int(data.get("consecutive_failures", 0)),
            provider=str(data.get("provider", "") or RSS_PROVIDER),
            auth_ref=str(auth_ref) if auth_ref is not None else None,
            last_error=str(last_error) if last_error is not None else None,
        )
        source.validate()
        return source

    def evolve(self, **changes: Any) -> "FeedSource":
        """Copy with changes. The only way to rebuild: new fields added here
        ride along automatically instead of being dropped at each call site."""
        data = self.to_dict()
        data.update(changes)
        return FeedSource.from_dict(data)


@dataclass(frozen=True)
class FeedItem:
    """One entry. ``brief``/``why_it_matters`` are filled by the summarizer at
    ingest; the pane renders them directly and never summarizes at render."""
    id: str
    source_id: str
    title: str
    url: str
    published_at: Optional[str] = None
    brief: str = ""
    why_it_matters: str = ""
    read: bool = False

    def validate(self) -> None:
        if not self.id or not self.source_id:
            raise FeedsError("feed item needs an id and a source_id")
        if not self.title:
            raise FeedsError("feed item needs a title")

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "FeedItem":
        item = cls(
            id=str(data.get("id", "")),
            source_id=str(data.get("source_id", "")),
            title=str(data.get("title", "")),
            url=str(data.get("url", "")),
            published_at=data.get("published_at"),
            brief=str(data.get("brief", "")),
            why_it_matters=str(data.get("why_it_matters", "")),
            read=bool(data.get("read", False)),
        )
        item.validate()
        return item


def item_id(source_id: str, url: str, guid: str = "") -> str:
    """Stable dedupe key: source + URL, falling back to guid. Content hashing
    would re-admit an edited repost as new; URL identity matches how readers
    think about "have I seen this"."""
    seed = f"{source_id}\x00{url or guid}"
    return hashlib.sha256(seed.encode("utf-8")).hexdigest()[:32]


def _feeds_dir(home: Optional[Path] = None) -> Path:
    if home is not None:
        return Path(home) / "feeds"
    from hermes_constants import get_hermes_home
    return Path(get_hermes_home()) / "feeds"


def _read_json(path: Path, default: Any) -> Any:
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (OSError, ValueError):
        return default


def _write_json_atomic(path: Path, value: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    fd, tmp = tempfile.mkstemp(dir=str(path.parent), prefix=".feeds-", suffix=".tmp")
    try:
        with os.fdopen(fd, "w", encoding="utf-8") as handle:
            json.dump(value, handle, ensure_ascii=False, indent=2)
        os.replace(tmp, path)
    except BaseException:
        try:
            os.unlink(tmp)
        except OSError:
            pass
        raise


class FeedStore:
    """Sources + items under a HERMES_HOME. One instance per operation is
    fine — reads are cheap JSON, writes are atomic renames."""

    def __init__(self, home: Optional[Path] = None):
        self._dir = _feeds_dir(home)

    def _sources_path(self) -> Path:
        return self._dir / "sources.json"

    def _items_path(self) -> Path:
        return self._dir / "items.json"

    def list_sources(self) -> List[FeedSource]:
        data = _read_json(self._sources_path(), [])
        return [FeedSource.from_dict(raw) for raw in data]

    def ensure_defaults(self) -> List[FeedSource]:
        """Seed the shipped source list on a fresh install. Explicit, never
        implicit: reads stay pure so tests get empty stores and the only
        writer of defaults is this call (RPC boot, CLI setup). Routes through
        ``add_source`` so id derivation and validation live in exactly one
        place."""
        if self._sources_path().exists():
            return self.list_sources()
        for entry in DEFAULT_SOURCES:
            add_source(self, name=entry["name"], url=entry["url"])
        return self.list_sources()

    def save_sources(self, sources: List[FeedSource]) -> None:
        for source in sources:
            source.validate()
        _write_json_atomic(self._sources_path(), [s.to_dict() for s in sources])

    def list_items(self, source_id: Optional[str] = None) -> List[FeedItem]:
        data = _read_json(self._items_path(), [])
        items = [FeedItem.from_dict(raw) for raw in data]
        if source_id is not None:
            items = [item for item in items if item.source_id == source_id]
        return items

    def save_items(self, items: List[FeedItem]) -> None:
        for item in items:
            item.validate()
        _write_json_atomic(self._items_path(), [i.to_dict() for i in items])

    def known_ids(self) -> set:
        return {item.id for item in self.list_items()}


def read_provider_secret(auth_ref: Optional[str]) -> str:
    """Resolve a provider token by env var NAME through the profile secret
    scope (multiplex-safe: the active profile's secrets, never another
    profile's, never logged). Falls back to process env when multiplexing is
    inactive, exactly like every other secret read. Empty when unset."""
    if not auth_ref:
        return ""
    try:
        from agent.secret_scope import get_secret
        return str(get_secret(auth_ref) or "")
    except Exception:  # noqa: BLE001 — secret scope unavailable (tests, CLI without agent)
        return os.environ.get(auth_ref, "")


# Provider fetchers: (source, credential) -> entry dicts shaped exactly like
# the RSS parser's entries ({title, link, published, author, summary}), so
# poll_source normalizes once downstream. Registered, never hardcoded in the
# poll path: a new provider is a function plus a registration line.
PROVIDER_FETCHERS: Dict[str, Callable[[FeedSource, str], List[Dict[str, Any]]]] = {}


def register_provider(name: str, fetcher: Callable[[FeedSource, str], List[Dict[str, Any]]]) -> None:
    """Register a feed provider fetcher. Names are lowercase slugs ('rss' is
    reserved for the built-in parser path and cannot be overridden)."""
    if name == RSS_PROVIDER:
        raise FeedsError("cannot override the built-in rss provider")
    PROVIDER_FETCHERS[name] = fetcher


def known_providers() -> List[str]:
    return sorted([RSS_PROVIDER, *PROVIDER_FETCHERS])


FACEBOOK_GRAPH_VERSION = "v18.0"
FACEBOOK_GRAPH_BASE = "https://graph.facebook.com"


def _facebook_api(path: str, token: str, params: Optional[Dict[str, str]] = None,
                   product: str = "Facebook") -> Dict[str, Any]:
    """One authenticated Graph call. Meta errors arrive as HTTP 4xx with a
    JSON ``{"error": {...}}`` body; token/permission problems (code 190,
    200-299, 10, 102) become ProviderAuthError so the caller surfaces
    "Reconnect" instead of backing off a dead credential."""
    query = dict(params or {})
    query["access_token"] = token
    url = f"{FACEBOOK_GRAPH_BASE}/{FACEBOOK_GRAPH_VERSION}{path}?{urllib.parse.urlencode(query)}"
    request = urllib.request.Request(url, headers={"User-Agent": "HermesAgent-feeds/1.0"})
    try:
        with urllib.request.urlopen(request, timeout=FETCH_TIMEOUT_SECONDS) as response:
            payload = json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as exc:
        try:
            payload = json.loads(exc.read().decode("utf-8"))
        except Exception:
            raise FeedsError(f"{product} API HTTP {exc.code} with unreadable body")
        error = payload.get("error", {}) if isinstance(payload, dict) else {}
        code = error.get("code")
        if exc.code in (401, 403) or code in (190, 102, 10) or (isinstance(code, int) and 200 <= code <= 299):
            raise ProviderAuthError(
                f"{product} rejected the credential: {error.get('message', exc)}")
        raise FeedsError(f"{product} API HTTP {exc.code}: {error.get('message', exc)}")
    if not isinstance(payload, dict):
        raise FeedsError(f"{product} API returned a non-object payload")
    return payload


def fetch_facebook_feed(source: FeedSource, token: str) -> List[Dict[str, Any]]:
    """The authenticated user's own feed. Entries mirror the RSS parser shape
    so downstream normalization is shared. Titles are derived (posts have no
    titles): first line, capped — the summarizer, not the fetcher, decides
    what matters."""
    if not token:
        raise ProviderAuthError("Facebook source has no credential; reconnect the account")
    payload = _facebook_api("/me/feed", token, params={
        "fields": "id,message,created_time,permalink_url,from",
        "limit": "25",
    })
    entries = []
    for post in payload.get("data", []) or []:
        if not isinstance(post, dict):
            continue
        message = str(post.get("message", "") or "").strip()
        if not message:
            continue
        first_line = message.splitlines()[0].strip()[:140]
        entries.append({
            "title": first_line,
            "link": str(post.get("permalink_url", "") or ""),
            "published": str(post.get("created_time", "") or ""),
            "author": str(((post.get("from") or {}) if isinstance(post.get("from"), dict) else {}).get("name", "") or ""),
            "summary": message[:2000],
        })
    return entries


def validate_facebook_token(token: str) -> Dict[str, Any]:
    """Check a user-pasted token before storing it. Returns ``{"ok": True,
    "account": <name>}`` or raises ProviderAuthError with the platform's own
    reason. Called by the connect RPC; never stores anything itself."""
    if not token or not token.strip():
        raise ProviderAuthError("empty token")
    payload = _facebook_api("/me", token.strip(), params={"fields": "id,name"})
    name = str(payload.get("name", "") or "").strip()
    if not name:
        raise ProviderAuthError("Facebook accepted the token but returned no profile")
    return {"ok": True, "account": name}


register_provider("facebook", fetch_facebook_feed)


INSTAGRAM_NO_ACCOUNT_MESSAGE = (
    "no Instagram business account linked to this login — connect a Business "
    "or Creator account to a Facebook Page, then reconnect"
)


def _discover_instagram_account(token: str) -> Dict[str, str]:
    """Resolve the token to its first Page-linked Instagram business account.
    Instagram's Graph API has no '/me/media' for a bare login: media lives
    under the business account id, so discovery is part of every poll (no
    cached ids to go stale when the user relinks a different account)."""
    payload = _facebook_api("/me/accounts", token, params={
        "fields": "instagram_business_account{id,username}",
        "limit": "25",
    }, product="Instagram")
    for page in payload.get("data", []) or []:
        if not isinstance(page, dict):
            continue
        business = page.get("instagram_business_account") or {}
        if not isinstance(business, dict):
            continue
        account_id = str(business.get("id", "") or "").strip()
        username = str(business.get("username", "") or "").strip()
        if account_id:
            return {"id": account_id, "username": username}
    raise ProviderAuthError(INSTAGRAM_NO_ACCOUNT_MESSAGE)


def fetch_instagram_feed(source: FeedSource, token: str) -> List[Dict[str, Any]]:
    """Recent media from the linked Instagram business account. Entries mirror
    the RSS parser shape; captions stand in for body text (no video
    transcription — the caption is the content)."""
    if not token:
        raise ProviderAuthError("Instagram source has no credential; reconnect the account")
    account = _discover_instagram_account(token)
    payload = _facebook_api(f"/{account['id']}/media", token, params={
        "fields": "id,caption,media_type,timestamp,permalink,username",
        "limit": "25",
    }, product="Instagram")
    entries = []
    for media in payload.get("data", []) or []:
        if not isinstance(media, dict):
            continue
        caption = str(media.get("caption", "") or "").strip()
        if not caption:
            continue
        first_line = caption.splitlines()[0].strip()[:140]
        entries.append({
            "title": first_line,
            "link": str(media.get("permalink", "") or ""),
            "published": str(media.get("timestamp", "") or ""),
            "author": str(media.get("username", "") or account["username"]),
            "summary": caption[:2000],
        })
    return entries


def validate_instagram_token(token: str) -> Dict[str, Any]:
    """Check a user-pasted token before storing it. Returns ``{"ok": True,
    "account": <instagram username>}`` or raises ProviderAuthError. Discovery
    IS the validation: a token with no linked business account cannot poll."""
    if not token or not token.strip():
        raise ProviderAuthError("empty token")
    account = _discover_instagram_account(token.strip())
    if not account["username"]:
        raise ProviderAuthError("Instagram accepted the token but returned no username")
    return {"ok": True, "account": account["username"]}


register_provider("instagram", fetch_instagram_feed)


PROVIDER_VALIDATORS: Dict[str, Callable[[str], Dict[str, Any]]] = {}


def register_validator(name: str, validator: Callable[[str], Dict[str, Any]]) -> None:
    """Register a bring-your-own-token validator for a provider. The validate
    RPC reads this table, so a new provider never adds a branch there."""
    PROVIDER_VALIDATORS[name] = validator


register_validator("facebook", validate_facebook_token)
register_validator("instagram", validate_instagram_token)


SUMMARIZE_SYSTEM_PROMPT = (
    "You summarize one feed entry for a busy reader. Reply with exactly two lines:\n"
    "Brief: <what happened, one or two sentences>\n"
    "Why it matters: <one sentence on why this reader should care>\n"
    "No preamble, no hedging, no extra lines."
)


def build_summarize_prompt(title: str, url: str, published_at: Optional[str] = None) -> List[Dict[str, str]]:
    """Prompt shapes for the summarizer. Pure function of the entry: the model
    call itself stays with the caller (RPC layer binds the user's configured
    provider; tests inject a stub). Titles-only by default — fetching full
    article bodies is a per-source opt-in the store does not track yet."""
    user = f"Title: {title}\nURL: {url}"
    if published_at:
        user += f"\nPublished: {published_at}"
    return [
        {"role": "system", "content": SUMMARIZE_SYSTEM_PROMPT},
        {"role": "user", "content": user},
    ]


def parse_summary_reply(text: str) -> tuple[str, str]:
    """Extract (brief, why) from a model reply. Lenient on formatting, strict
    on emptiness: a reply that yields nothing is a miss, not a blank summary."""
    brief, why = "", ""
    for line in (text or "").splitlines():
        stripped = line.strip()
        lowered = stripped.lower()
        if lowered.startswith("brief:"):
            brief = stripped[len("brief:"):].strip()
        elif lowered.startswith("why it matters:"):
            why = stripped[len("why it matters:"):].strip()
    return brief[:MAX_BRIEF_CHARS], why[:MAX_BRIEF_CHARS]


def fetch_source(url: str, timeout: float = FETCH_TIMEOUT_SECONDS) -> bytes:
    """Fetch one source document. HTTP(S) only, capped time. Raises on any
    transport failure — the caller records the failure for backoff."""
    parsed = urllib.parse.urlparse(url)
    if parsed.scheme not in ("http", "https"):
        raise FeedsError(f"refusing to fetch non-http(s) source: {url[:80]}")
    request = urllib.request.Request(url, headers={"User-Agent": "HermesAgent-feeds/1.0"})
    with urllib.request.urlopen(request, timeout=timeout) as response:
        return response.read()


def _feed_module():
    """The shared RSS skill parser, loaded by path (dash-named dirs are not
    importable packages). Single source of feed truth: this module never
    reimplements parsing, so a parser fix lands everywhere at once."""
    import importlib.util
    from pathlib import Path as _Path
    candidates = [
        _Path(__file__).resolve().parent.parent / "optional-skills" / "research"
        / "rss-feeds" / "scripts" / "feed.py",
    ]
    for candidate in candidates:
        if candidate.is_file():
            spec = importlib.util.spec_from_file_location("hermes_rss_feed_skill", candidate)
            module = importlib.util.module_from_spec(spec)
            spec.loader.exec_module(module)
            return module
    raise FeedsError("RSS parser skill script not found")


def poll_source(
    source: FeedSource,
    *,
    known_ids: Optional[set] = None,
    fetcher: Optional[Callable[[str], bytes]] = None,
    now: Optional[float] = None,
) -> tuple[List[FeedItem], FeedSource]:
    """Fetch one source, return (new_items, updated_source). Raises on
    transport/parse failure — the caller records ``consecutive_failures`` and
    persists the backoff. ``fetcher`` injects bytes for tests; parsers come
    from the shared RSS skill module, not a second implementation. Provider
    sources resolve their token from the profile secret scope and normalize
    through the same entry mapping below, so every provider's items are
    indistinguishable downstream."""
    source.validate()
    if source.provider != RSS_PROVIDER:
        try:
            fetcher_fn = PROVIDER_FETCHERS[source.provider]
        except KeyError:
            raise FeedsError(f"unknown feed provider: {source.provider!r}")
        token = read_provider_secret(source.auth_ref)
        if not token:
            raise ProviderAuthError(
                f"{source.provider} source has no credential; reconnect the account")
        entries = fetcher_fn(source, token)
    else:
        feed_mod = _feed_module()
        raw = fetcher(source.url) if fetcher is not None else feed_mod.fetch(source.url)[0]
        # The RSS parser already emits the shared entry shape; provider
        # fetchers are contractually identical, so one mapping serves both.
        entries = feed_mod.parse_feed(raw).get("entries", []) or []
    seen = known_ids if known_ids is not None else set()
    items: List[FeedItem] = []
    for entry in entries:
        title = str(entry.get("title", "") or "").strip()
        if not title:
            continue
        link = str(entry.get("link", "") or "").strip()
        guid = str(entry.get("id", "") or entry.get("guid", "") or "").strip()
        ident = item_id(source.id, link, guid)
        if ident in seen:
            continue
        seen.add(ident)
        items.append(FeedItem(
            id=ident,
            source_id=source.id,
            title=title,
            url=link,
            published_at=entry.get("published"),
        ))
    updated = source.evolve(
        last_polled_at=time.time() if now is None else now,
        consecutive_failures=0,
        last_error=None,
    )
    return items, updated


def due_sources(store: FeedStore, *, now: Optional[float] = None) -> List[FeedSource]:
    """Sources ready to poll. The caller decides cadence (cron tick, manual
    refresh, app boot); this decides eligibility, including backoff."""
    moment = time.time() if now is None else now
    return [s for s in store.list_sources() if s.due_at(moment)]


def poll_due(
    store: FeedStore,
    *,
    now: Optional[float] = None,
    fetcher: Optional[Callable[[str], bytes]] = None,
) -> Dict[str, Any]:
    """Poll every due source, persist new items and updated source state.
    Returns ``{"polled": [...], "new_items": n, "failed": {source_id: error}}``.
    A failed source keeps its old ``last_polled_at`` and gains a failure for
    backoff — it degrades quietly instead of hammering on every tick. Items
    are capped per source so one chatty feed cannot grow the store unbounded.
    """
    moment = time.time() if now is None else now
    sources = store.list_sources()
    known = store.known_ids()
    existing = store.list_items()
    by_source: Dict[str, List[FeedItem]] = {}
    for item in existing:
        by_source.setdefault(item.source_id, []).append(item)
    result: Dict[str, Any] = {"polled": [], "new_items": 0, "failed": {}, "auth_failed": []}
    updated_sources: List[FeedSource] = []
    changed = False
    for source in sources:
        if not source.due_at(moment):
            updated_sources.append(source)
            continue
        try:
            new_items, updated = poll_source(source, known_ids=known, fetcher=fetcher, now=moment)
        except Exception as exc:  # noqa: BLE001 — per-source isolation; see module docstring
            logger.warning("feed poll failed for %s: %s", source.id, exc)
            result["failed"][source.id] = f"{type(exc).__name__}: {exc}"
            if isinstance(exc, ProviderAuthError):
                # No retry heals a dead credential; the pane offers Reconnect
                # instead of watching backoff count climb.
                result["auth_failed"].append(source.id)
            updated_sources.append(source.evolve(
                consecutive_failures=source.consecutive_failures + 1,
                last_error=f"{type(exc).__name__}: {exc}"))
            changed = True
            continue
        result["polled"].append(source.id)
        if new_items:
            merged = list(new_items) + by_source.get(source.id, [])
            merged = merged[:MAX_ITEMS_PER_SOURCE]
            by_source[source.id] = merged
            for item in new_items:
                known.add(item.id)
            result["new_items"] += len(new_items)
            changed = True
        updated_sources.append(updated)
        changed = True
    if changed:
        store.save_sources(updated_sources)
        store.save_items([item for items in by_source.values() for item in items])
    return result


def summarize_items(
    items: List[FeedItem],
    complete_fn: Callable[[List[Dict[str, str]], FeedItem], str],
) -> List[FeedItem]:
    """Fill briefs at ingest via the caller's model function. ``complete_fn``
    receives (messages, item) and returns raw reply text; it is bound by the
    caller to the user's configured provider (RPC layer binds ``call_llm``
    with ``task="feeds_summarization"``; tests inject a stub). A reply that
    yields nothing leaves the item unsummarized — a miss retries next poll,
    never a blank summary. Never raises: one bad item must not poison a batch.
    """
    summarized: List[FeedItem] = []
    for item in items:
        if item.brief:
            summarized.append(item)
            continue
        try:
            messages = build_summarize_prompt(item.title, item.url, item.published_at)
            brief, why = parse_summary_reply(complete_fn(messages, item))
        except Exception as exc:  # noqa: BLE001 — see module docstring
            logger.warning("feed summarize failed for %s: %s", item.id, exc)
            summarized.append(item)
            continue
        if not brief:
            summarized.append(item)
            continue
        summarized.append(FeedItem(
            id=item.id, source_id=item.source_id, title=item.title, url=item.url,
            published_at=item.published_at, brief=brief, why_it_matters=why,
            read=item.read))
    return summarized


def mark_read(store: FeedStore, item_id: str, read: bool = True) -> bool:
    """Set the read flag. Returns False when the id is unknown."""
    items = store.list_items()
    found = False
    updated = []
    for item in items:
        if item.id == item_id:
            found = True
            updated.append(FeedItem(
                id=item.id, source_id=item.source_id, title=item.title, url=item.url,
                published_at=item.published_at, brief=item.brief,
                why_it_matters=item.why_it_matters, read=read))
        else:
            updated.append(item)
    if found:
        store.save_items(updated)
    return found


def add_source(store: FeedStore, *, name: str, url: str,
               interval_minutes: int = DEFAULT_POLL_INTERVAL_MINUTES,
               provider: str = RSS_PROVIDER,
               auth_ref: Optional[str] = None) -> FeedSource:
    """Add a source. Idempotent on URL: re-adding returns the existing row
    instead of duplicating the feed."""
    for existing in store.list_sources():
        if existing.url.rstrip("/") == url.rstrip("/") and existing.provider == provider:
            return existing
    if provider != RSS_PROVIDER and provider not in PROVIDER_FETCHERS:
        raise FeedsError(f"unknown feed provider: {provider!r}")
    source = FeedSource(
        id=hashlib.sha256(f"{provider}\x00{url}".encode("utf-8")).hexdigest()[:16],
        name=name.strip() or url, url=url.strip(), interval_minutes=interval_minutes,
        provider=provider, auth_ref=auth_ref)
    source.validate()
    sources = store.list_sources() + [source]
    store.save_sources(sources)
    return source


def remove_source(store: FeedStore, source_id: str) -> bool:
    """Remove a source and its items. Returns False when unknown."""
    sources = [s for s in store.list_sources() if s.id != source_id]
    if len(sources) == len(store.list_sources()):
        return False
    store.save_sources(sources)
    store.save_items([i for i in store.list_items() if i.source_id != source_id])
    return True


def set_source_enabled(store: FeedStore, source_id: str, enabled: bool) -> bool:
    """Toggle polling for a source. Returns False when unknown."""
    sources = store.list_sources()
    changed = False
    updated = []
    for source in sources:
        if source.id == source_id:
            changed = True
            updated.append(source.evolve(enabled=enabled))
        else:
            updated.append(source)
    if changed:
        store.save_sources(updated)
    return changed

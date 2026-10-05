"""Feeds dashboard routes (premium).

Sources, items, polling and provider onboarding for the Feeds pane. Thin
adapter layer on purpose: ``hermes_cli/feeds.py`` owns storage, parsing,
dedupe, backoff and summarization prompts; this only translates HTTP into
shapes those functions already accept, exactly like the cron router defers
scheduling to ``cron/jobs.py``.

Every route re-checks premium entitlement server-side
(``require_premium_tier`` over a fresh subscription state) — the pane's lock
is visibility only. Secrets never cross these routes in either direction:
``auth_ref`` names travel, tokens do not (validate-then-store happens with
the token in a single POST body that is never logged or persisted).
"""
import asyncio
from pathlib import Path
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, Field

from hermes_cli.web_deps import late
from hermes_cli.web_routers._common import log as _log

router = APIRouter()

_profile_scope = late("_profile_scope", "hermes_cli.web_server_profiles")


def _store():
    from hermes_cli import feeds
    from hermes_constants import get_hermes_home
    return feeds.FeedStore(Path(get_hermes_home()))


def _check_premium() -> str:
    """Active premium tier id, or raise 402. Fetches fresh subscription state:
    entitlement changes (upgrade, expiry) take effect on the next call, never
    from a cached verdict."""
    from hermes_cli import nous_billing
    try:
        state = nous_billing.get_subscription_state()
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"billing state unavailable: {exc}")
    try:
        return nous_billing.require_premium_tier(state)
    except nous_billing.PremiumRequiredError as exc:
        raise HTTPException(status_code=402, detail={"error": "premium_required", "message": str(exc)})


def _public_source(source) -> Dict[str, Any]:
    from hermes_cli import feeds
    connected = True
    if source.provider != feeds.RSS_PROVIDER:
        connected = bool(feeds.read_provider_secret(source.auth_ref))
    return {
        "id": source.id,
        "name": source.name,
        "url": source.url,
        "provider": source.provider,
        "interval_minutes": source.interval_minutes,
        "enabled": source.enabled,
        "last_polled_at": source.last_polled_at,
        "consecutive_failures": source.consecutive_failures,
        "last_error": source.last_error,
        "connected": connected,
    }


def _public_item(item) -> Dict[str, Any]:
    return {
        "id": item.id,
        "source_id": item.source_id,
        "title": item.title,
        "url": item.url,
        "published_at": item.published_at,
        "brief": item.brief,
        "why_it_matters": item.why_it_matters,
        "read": item.read,
    }


class SourceCreate(BaseModel):
    name: str = ""
    url: str = ""
    provider: str = "rss"
    interval_minutes: int = 60
    auth_ref: Optional[str] = None


class SourcePatch(BaseModel):
    enabled: Optional[bool] = None


class ItemPatch(BaseModel):
    read: bool = True


class ProviderValidate(BaseModel):
    provider: str = ""
    token: str = ""


@router.get("/api/feeds/sources")
async def list_sources(profile: Optional[str] = None):
    def _run():
        with _profile_scope(profile):
            _check_premium()
            from hermes_cli import feeds
            store = _store()
            return {"sources": [_public_source(s) for s in store.list_sources()],
                    "providers": feeds.known_providers()}
    try:
        return await asyncio.to_thread(_run)
    except HTTPException:
        raise
    except Exception as exc:
        _log.exception("GET /api/feeds/sources failed")
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/api/feeds/sources", status_code=201)
async def add_source(body: SourceCreate, profile: Optional[str] = None):
    def _run():
        with _profile_scope(profile):
            _check_premium()
            from hermes_cli import feeds
            auth_ref = body.auth_ref
            if body.provider != feeds.RSS_PROVIDER and not auth_ref:
                auth_ref = feeds.provider_token_env(body.provider)
            try:
                source = feeds.add_source(
                    _store(), name=body.name, url=body.url or f"{body.provider}://connected-account",
                    interval_minutes=body.interval_minutes, provider=body.provider,
                    auth_ref=auth_ref)
            except feeds.FeedsError as exc:
                raise HTTPException(status_code=400, detail=str(exc))
            from hermes_cli import feeds_cron
            feeds_cron.sync_poll_job(_store())
            return {"source": _public_source(source)}
    try:
        return await asyncio.to_thread(_run)
    except HTTPException:
        raise
    except Exception as exc:
        _log.exception("POST /api/feeds/sources failed")
        raise HTTPException(status_code=500, detail=str(exc))


@router.delete("/api/feeds/sources/{source_id}")
async def remove_source(source_id: str, profile: Optional[str] = None):
    def _run():
        with _profile_scope(profile):
            _check_premium()
            from hermes_cli import feeds
            # Credential cleanup stays explicit (disconnect), never implicit:
            # removing a source must not silently revoke an account others share.
            removed = feeds.remove_source(_store(), source_id)
            from hermes_cli import feeds_cron
            feeds_cron.sync_poll_job(_store())
            return {"removed": removed}
    try:
        return await asyncio.to_thread(_run)
    except HTTPException:
        raise
    except Exception as exc:
        _log.exception("DELETE /api/feeds/sources failed")
        raise HTTPException(status_code=500, detail=str(exc))


@router.patch("/api/feeds/sources/{source_id}")
async def patch_source(source_id: str, body: SourcePatch, profile: Optional[str] = None):
    def _run():
        with _profile_scope(profile):
            _check_premium()
            from hermes_cli import feeds
            if body.enabled is None:
                raise HTTPException(status_code=400, detail="enabled is required")
            updated = feeds.set_source_enabled(_store(), source_id, body.enabled)
            from hermes_cli import feeds_cron
            feeds_cron.sync_poll_job(_store())
            return {"updated": updated}
    try:
        return await asyncio.to_thread(_run)
    except HTTPException:
        raise
    except Exception as exc:
        _log.exception("PATCH /api/feeds/sources failed")
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/api/feeds/items")
async def list_items(profile: Optional[str] = None, source_id: Optional[str] = None,
                     unread_only: bool = False, limit: int = 100):
    def _run():
        with _profile_scope(profile):
            _check_premium()
            store = _store()
            items = store.list_items(source_id=source_id)
            if unread_only:
                items = [item for item in items if not item.read]
            return {"items": [_public_item(item) for item in items[:max(1, min(limit, 500))]],
                    "unread": sum(1 for item in store.list_items() if not item.read)}
    try:
        return await asyncio.to_thread(_run)
    except HTTPException:
        raise
    except Exception as exc:
        _log.exception("GET /api/feeds/items failed")
        raise HTTPException(status_code=500, detail=str(exc))


@router.patch("/api/feeds/items/{item_id}")
async def patch_item(item_id: str, body: ItemPatch, profile: Optional[str] = None):
    def _run():
        with _profile_scope(profile):
            _check_premium()
            from hermes_cli import feeds
            return {"updated": feeds.mark_read(_store(), item_id, body.read)}
    try:
        return await asyncio.to_thread(_run)
    except HTTPException:
        raise
    except Exception as exc:
        _log.exception("PATCH /api/feeds/items failed")
        raise HTTPException(status_code=500, detail=str(exc))


def _summarize_fn():
    """Model completion bound to the user's configured provider, for ingest.
    Defined here (not in hermes_cli.feeds) because model access lives in the
    backend process; feeds.py stays importable without agent machinery."""
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


@router.post("/api/feeds/poll")
async def poll_feeds(body: Dict[str, Any] = None, profile: Optional[str] = None):  # noqa: B006
    def _run():
        with _profile_scope(profile):
            _check_premium()
            from hermes_cli import feeds
            store = _store()
            source_id = (body or {}).get("source_id")
            if source_id:
                sources = [s for s in store.list_sources() if s.id == str(source_id)]
                if not sources:
                    raise HTTPException(status_code=404, detail="unknown source")
                for source in sources:
                    store.save_sources([s if s.id != source.id else source.evolve(last_polled_at=0.0)
                                        for s in store.list_sources()])
            result = feeds.poll_due(store)
            if result["new_items"]:
                unsummarized = [i for i in store.list_items() if not i.brief][:5]
                if unsummarized:
                    fresh = feeds.summarize_items(unsummarized, _summarize_fn())
                    by_id = {i.id: i for i in fresh}
                    store.save_items([by_id.get(i.id, i) for i in store.list_items()])
                    result["summarized"] = sum(1 for i in fresh if i.brief)
            return result
    try:
        return await asyncio.to_thread(_run)
    except HTTPException:
        raise
    except Exception as exc:
        _log.exception("POST /api/feeds/poll failed")
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/api/feeds/provider/validate")
async def validate_provider(body: ProviderValidate, profile: Optional[str] = None):
    """Check a user-pasted token against the live platform API. Read-only:
    validates without storing anything; the pane stores via the env bridge on
    success. The token crosses this call transiently and is never logged."""
    def _run():
        with _profile_scope(profile):
            _check_premium()
            from hermes_cli import feeds
            if body.provider == feeds.RSS_PROVIDER:
                return {"ok": True, "account": None}
            validator = feeds.PROVIDER_VALIDATORS.get(body.provider)
            if validator is None:
                raise HTTPException(status_code=400, detail=f"unknown feed provider: {body.provider}")
            try:
                return validator(body.token)
            except feeds.ProviderAuthError as exc:
                raise HTTPException(status_code=401, detail=str(exc))
    try:
        return await asyncio.to_thread(_run)
    except HTTPException:
        raise
    except Exception as exc:
        _log.exception("POST /api/feeds/provider/validate failed")
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/api/feeds/providers/status")
async def provider_status(profile: Optional[str] = None):
    """Whether each provider has a stored credential. Presence only — values
    never cross this call, so status is safe to poll for affordances."""
    def _run():
        with _profile_scope(profile):
            _check_premium()
            from hermes_cli import feeds
            status = {}
            for provider in feeds.known_providers():
                if provider == feeds.RSS_PROVIDER:
                    status[provider] = {"connected": True}
                    continue
                status[provider] = {"connected": bool(feeds.read_provider_secret(
                    feeds.provider_token_env(provider)))}
            return {"providers": status}
    try:
        return await asyncio.to_thread(_run)
    except HTTPException:
        raise
    except Exception as exc:
        _log.exception("GET /api/feeds/providers/status failed")
        raise HTTPException(status_code=500, detail=str(exc))

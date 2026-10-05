"""Minerva billing summary for the dashboard (read-only).

``GET /api/billing/summary`` answers "who am I billed as" for the current
dashboard session: agency, plan, subscription state and credit balance. All
reads go through PostgREST with the *user's own* Supabase JWT, so the
project's RLS member policies — not this backend — decide visibility. There
is no service-role key on this host by design.

Source of truth for money movement stays the portal (portal.abbble.co.za):
checkout, invoices and API-key minting link out; this route never writes.
Auth-required (the dashboard gate enforces); non-Supabase sessions get
``{"linked": false}`` rather than an error so the UI can offer the connect
step. Requires migration 033 in minerva-monorepo (member SELECT on
``agency_subscriptions``); without it subscriptions read empty and every paid
tenant degrades to ``free`` rather than erroring.
"""

from __future__ import annotations

import logging
import os
import time
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

import httpx
from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse

router = APIRouter()

_log = logging.getLogger(__name__)

_TIMEOUT_SEC = 10.0
_PORTAL_URL = "https://portal.abbble.co.za"


def _supabase_settings() -> tuple[str, str]:
    url = os.environ.get("SUPABASE_URL", "").strip() or os.environ.get(
        "NEXT_PUBLIC_SUPABASE_URL", "").strip()
    anon = os.environ.get("SUPABASE_ANON_KEY", "").strip() or os.environ.get(
        "NEXT_PUBLIC_SUPABASE_ANON_KEY", "").strip()
    return url.rstrip("/"), anon


def _portal_url() -> str:
    return os.environ.get("MINERVA_PORTAL_URL", "").strip().rstrip("/") or _PORTAL_URL


def _rest(table: str, token: str, base: str, anon: str,
          params: Dict[str, str]) -> Optional[list]:
    """PostgREST SELECT with the caller's JWT (RLS applies). None on any failure."""
    try:
        resp = httpx.get(
            f"{base}/rest/v1/{table}", headers={"apikey": anon, "Accept": "application/json",
                                                "Authorization": f"Bearer {token}"},
            params=params, timeout=_TIMEOUT_SEC)
    except httpx.TransportError as exc:
        _log.warning("billing: PostgREST %s unreachable: %s", table, exc)
        return None
    if resp.status_code != 200:
        if resp.status_code >= 500:
            _log.warning("billing: PostgREST %s returned %s", table, resp.status_code)
        return None
    try:
        body = resp.json()
    except ValueError:
        return None
    return body if isinstance(body, list) else None


def _period_end_ms(value: Any) -> int:
    """Parse an ISO timestamptz to epoch ms; 0 when absent/unparseable (fail-open)."""
    if not value:
        return 0
    try:
        dt = datetime.fromisoformat(str(value).replace("Z", "+00:00"))
    except ValueError:
        return 0
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    try:
        return int(dt.timestamp() * 1000)
    except (OverflowError, OSError, ValueError):
        return 0


# Paid plans the summary recognises. Canonical portal tiers first
# (PLUS/SUPER/ULTRA — the correct pricing), legacy agency still honoured
# on old subscription rows. Must stay in sync with PlanId in
# minerva-monorepo/packages/billing/src/plans.ts.
_PAID_PLANS = ("plus", "super", "ultra", "agency")


def _active_subscription(subs: List[dict], now_ms: int) -> Optional[dict]:
    for s in subs:
        if not isinstance(s, dict):
            continue
        if s.get("status") != "active":
            continue
        end_ms = _period_end_ms(s.get("current_period_end"))
        if end_ms and end_ms <= now_ms:
            continue
        if s.get("plan") in _PAID_PLANS:
            return s
    return None


def _past_due(subs: List[dict]) -> Optional[dict]:
    for s in subs:
        if isinstance(s, dict) and s.get("status") == "past_due" and s.get("plan") in _PAID_PLANS:
            return s
    return None


def summarize(user_id: str, token: str, base: str, anon: str) -> Dict[str, Any]:
    """Build the billing summary dict (pure orchestration over PostgREST reads)."""
    memberships = _rest("agency_memberships", token, base, anon,
                        {"select": "agency_id,role", "user_id": f"eq.{user_id}",
                         "status": "eq.active", "order": "created_at.asc", "limit": "1"})
    if not memberships:
        return {"linked": True, "agency": None, "portal_url": _portal_url()}
    agency_id = str((memberships[0] or {}).get("agency_id") or "")
    if not agency_id:
        return {"linked": True, "agency": None, "portal_url": _portal_url()}

    agencies = _rest("agencies", token, base, anon,
                     {"select": "id,slug,name,plan,status,credits_balance_usd",
                      "id": f"eq.{agency_id}", "limit": "1"})
    agency = (agencies or [None])[0] or {}
    subs = _rest("agency_subscriptions", token, base, anon,
                 {"select": "plan,status,current_period_end", "agency_id": f"eq.{agency_id}",
                  "order": "updated_at.desc"}) or []

    now_ms = int(time.time() * 1000)
    active = _active_subscription(subs, now_ms)
    past_due = None if active else _past_due(subs)
    if active:
        plan, billing_state = str(active.get("plan")), "active"
    elif past_due:
        plan, billing_state = str(past_due.get("plan")), "past_due"
    else:
        plan, billing_state = "free", "free"

    raw_balance = agency.get("credits_balance_usd")
    try:
        balance = float(raw_balance) if raw_balance is not None else None
    except (TypeError, ValueError):
        balance = None
    current = active or past_due
    return {
        "linked": True,
        "agency": {"id": agency.get("id"), "slug": agency.get("slug"),
                   "name": agency.get("name")},
        "plan": plan,
        "billing_state": billing_state,
        "balance_usd": balance,
        "subscription": ({"status": current.get("status"),
                          "current_period_end": current.get("current_period_end")}
                         if current else None),
        "portal_url": _portal_url(),
    }


@router.get("/api/billing/summary", name="billing_summary")
async def api_billing_summary(request: Request):
    """Current dashboard user's billing summary. Auth-required (gate enforces)."""
    sess = getattr(request.state, "session", None)
    if sess is None:
        return JSONResponse({"error": "Unauthorized"}, status_code=401)
    if getattr(sess, "provider", "") != "supabase":
        return {"linked": False, "provider": getattr(sess, "provider", ""),
                "portal_url": _portal_url()}
    base, anon = _supabase_settings()
    if not base or not anon:
        return JSONResponse({"error": "Supabase is not configured on this host"}, status_code=503)
    return summarize(sess.user_id, sess.access_token, base, anon)

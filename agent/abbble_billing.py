"""ABBBLE Portal billing overview for device-key sign-ins.

The ABBBLE device flow persists only ``MINERVA_ROUTER_KEY`` — no Nous OAuth —
so the NAS-backed builders (:mod:`agent.billing_view`,
:mod:`agent.subscription_view`) report logged-out for Portal users and the
desktop billing page shows no account or plan. This module builds the same
state shapes from ABBBLE sources instead:

- agency identity + balance + plan: the Minerva router ``GET /v1/credits``
  (the only component that maps a device key to its agency);
- tier catalog: the portal's public ``GET /api/portal/plans``.

Fail-open throughout: ``None`` when no router key is configured (callers keep
their existing logged-out answer); ``logged_in=True`` with ``error`` set when
the key exists but a fetch failed. In-app mutations (charges, plan changes)
stay portal-side — ``can_change_plan`` is False so surfaces render portal
links, never dead actions.
"""

from __future__ import annotations

import json
import logging
import urllib.error
import urllib.parse
import urllib.request
from decimal import Decimal
from typing import Any, Optional

from agent.billing_view import BillingState, parse_money
from agent.secret_scope import get_secret_str
from agent.subscription_view import CurrentSubscription, SubscriptionState, SubscriptionTier

logger = logging.getLogger(__name__)

ROUTER_KEY_ENV_VAR = "MINERVA_ROUTER_KEY"
DEFAULT_ROUTER_ORIGIN = "https://minrouter.abbbleco.workers.dev"
FETCH_TIMEOUT_SECONDS = 10.0


def router_base_url() -> str:
    """Router ``/v1`` base: ``MINERVA_ROUTER_URL`` origin (or the default), ``/v1``-suffixed."""
    import os

    origin = (os.getenv("MINERVA_ROUTER_URL") or DEFAULT_ROUTER_ORIGIN).strip().rstrip("/")
    if not origin:
        origin = DEFAULT_ROUTER_ORIGIN
    return origin if origin.endswith("/v1") else f"{origin}/v1"


def portal_base_url() -> str:
    """Portal origin, honoring the same env overrides as the Nous client."""
    try:
        from hermes_cli.nous_billing import resolve_portal_base_url

        return resolve_portal_base_url().rstrip("/")
    except Exception:
        return "https://portal.abbble.co.za"


def router_key() -> str:
    """Configured Portal router key, or "" (absent/unscoped — never raises)."""
    try:
        return get_secret_str(ROUTER_KEY_ENV_VAR, "").strip()
    except Exception:
        return ""


def has_router_key() -> bool:
    """Whether an ABBBLE sign-in credential is usable."""
    try:
        from hermes_cli.auth import has_usable_secret

        return bool(has_usable_secret(router_key()))
    except Exception:
        return bool(router_key())


def _http_get_json(url: str, *, bearer: Optional[str] = None, timeout: float) -> Optional[Any]:
    """GET + parse JSON, or None on any failure (non-200, bad JSON, timeout)."""
    try:
        headers = {"Accept": "application/json"}
        if bearer:
            headers["Authorization"] = f"Bearer {bearer}"
        req = urllib.request.Request(url, headers=headers, method="GET")
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            if getattr(resp, "status", 200) != 200:
                return None
            return json.loads(resp.read().decode("utf-8", errors="replace"))
    except Exception:
        logger.debug("abbble billing GET %s failed (fail-open)", url.split("?")[0], exc_info=True)
        return None


def fetch_router_credits(*, timeout: float = FETCH_TIMEOUT_SECONDS) -> Optional[dict]:
    """Router ``/v1/credits`` for the configured key, or None."""
    key = router_key()
    if not key:
        return None
    payload = _http_get_json(f"{router_base_url()}/credits", bearer=key, timeout=timeout)
    return payload if isinstance(payload, dict) else None


def fetch_portal_plans(*, timeout: float = FETCH_TIMEOUT_SECONDS) -> Optional[list]:
    """Portal public tier catalog, or None."""
    payload = _http_get_json(f"{portal_base_url()}/api/portal/plans", timeout=timeout)
    if not isinstance(payload, dict):
        return None
    plans = payload.get("plans")
    return plans if isinstance(plans, list) else None


def _agency_of(credits: dict) -> tuple[Optional[str], Optional[str], Optional[str]]:
    """``(id, slug, name)`` of the agency behind a credits payload (Nones when absent)."""
    agency = credits.get("agency")
    if not isinstance(agency, dict):
        return None, None, None

    def _text(value: Any) -> Optional[str]:
        return value.strip() if isinstance(value, str) and value.strip() else None

    return _text(agency.get("id")), _text(agency.get("slug")), _text(agency.get("name"))


def _plan_of(credits: dict) -> str:
    """Router plan id (``free`` when absent — the router's own default)."""
    plan = credits.get("plan")
    return plan.strip().lower() if isinstance(plan, str) and plan.strip() else "free"


def _tiers_from_plans(plans: list, *, current_plan: str) -> tuple[SubscriptionTier, ...]:
    """Portal plans → picker rows, price-ascending; the router plan marked current."""
    rows: list[dict] = [p for p in plans if isinstance(p, dict) and isinstance(p.get("id"), str)]

    def _price(p: dict) -> float:
        try:
            return float(p.get("price") or 0)
        except (TypeError, ValueError):
            return 0.0

    rows.sort(key=_price)
    tiers = []
    for order, p in enumerate(rows):
        tier_id = str(p["id"])
        tiers.append(
            SubscriptionTier(
                tier_id=tier_id,
                name=str(p.get("name") or tier_id),
                tier_order=order,
                dollars_per_month=parse_money(p.get("price")),
                monthly_credits=parse_money(p.get("credits")),
                is_current=tier_id == current_plan,
                is_enabled=True,
            )
        )
    return tuple(tiers)


def _current_from_plan(
    plan: str, tiers: tuple[SubscriptionTier, ...], *, used_this_month: Optional[Decimal],
) -> Optional[CurrentSubscription]:
    """Current subscription for the router plan: the catalog row when listed,
    else a minimal row (legacy/custom plan ids) so the plan still names itself."""
    match = next((t for t in tiers if t.tier_id == plan), None)
    if match is not None:
        remaining: Optional[Decimal] = None
        # Derived display: what the monthly grant has left after this month's
        # spend. The desktop clamps negatives and names the overage itself.
        if match.monthly_credits is not None and used_this_month is not None:
            remaining = match.monthly_credits - used_this_month
        return CurrentSubscription(
            tier_id=match.tier_id,
            tier_name=match.name,
            monthly_credits=match.monthly_credits,
            credits_remaining=remaining,
        )
    if plan and plan != "free":
        return CurrentSubscription(tier_id=plan, tier_name=plan.capitalize() or plan)
    free = next((t for t in tiers if t.tier_id == "free"), None)
    if free is not None:
        return CurrentSubscription(
            tier_id=free.tier_id, tier_name=free.name, monthly_credits=free.monthly_credits,
            credits_remaining=free.monthly_credits,
        )
    return None


def build_abbble_billing_state(*, timeout: float = FETCH_TIMEOUT_SECONDS) -> Optional[BillingState]:
    """ABBBLE-backed billing state, or None when no router key is configured."""
    if not has_router_key():
        return None
    portal_url = f"{portal_base_url()}/billing"
    credits = fetch_router_credits(timeout=timeout)
    if credits is None:
        return BillingState(logged_in=True, portal_url=portal_url, error="could not reach Minerva router")
    agency_id, agency_slug, agency_name = _agency_of(credits)
    return BillingState(
        logged_in=True,
        org_id=agency_id,
        org_slug=agency_slug,
        org_name=agency_name,
        balance_usd=parse_money(credits.get("balance")),
        portal_url=portal_url,
    )


def build_abbble_subscription_state(*, timeout: float = FETCH_TIMEOUT_SECONDS) -> Optional[SubscriptionState]:
    """ABBBLE-backed subscription state, or None when no router key is configured."""
    if not has_router_key():
        return None
    portal_url = portal_base_url()
    credits = fetch_router_credits(timeout=timeout)
    if credits is None:
        return SubscriptionState(logged_in=True, portal_url=portal_url, error="could not reach Minerva router")
    agency_id, _, agency_name = _agency_of(credits)
    plan = _plan_of(credits)
    tiers = _tiers_from_plans(fetch_portal_plans(timeout=timeout) or [], current_plan=plan)
    return SubscriptionState(
        logged_in=True,
        org_name=agency_name,
        org_id=agency_id,
        context="personal",
        current=_current_from_plan(plan, tiers, used_this_month=parse_money(credits.get("used"))),
        tiers=tiers,
        portal_url=portal_url,
    )

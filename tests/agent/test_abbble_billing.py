"""ABBBLE-backed billing overview for device-key sign-ins.

The ABBBLE device flow persists only ``MINERVA_ROUTER_KEY`` (no Nous OAuth),
so the NAS-backed builders report logged-out for Portal users. These tests
exercise the real builders against a temp ``HERMES_HOME`` with stubbed network
fetchers (patched where production reads them): account + plan resolve from
router credits + the portal plans catalog, and genuinely keyless homes stay
logged-out.
"""

from decimal import Decimal

import pytest

from agent import abbble_billing as ab


CREDITS_PAID = {
    "balance": 42.5,
    "used": 10,
    "currency": "USD",
    "reset_at": "2026-11-01T00:00:00Z",
    "plan": "plus",
    "agency": {"id": "agency_123", "slug": "acme", "name": "Acme Inc"},
}

PLANS = [
    {"id": "free", "name": "Free", "price": 0, "currency": "usd", "credits": 0},
    {"id": "plus", "name": "Plus", "price": 20, "currency": "usd", "credits": 22},
    {"id": "super", "name": "Super", "price": 100, "currency": "usd", "credits": 110},
]


@pytest.fixture(autouse=True)
def _router_key(monkeypatch):
    monkeypatch.setenv("MINERVA_ROUTER_KEY", "qkt_sec_testkey1234567890abcdef")
    monkeypatch.setattr(ab, "fetch_router_credits", lambda *, timeout=10.0: dict(CREDITS_PAID))
    monkeypatch.setattr(ab, "fetch_portal_plans", lambda *, timeout=10.0: [dict(p) for p in PLANS])


def test_no_router_key_builds_nothing(monkeypatch):
    monkeypatch.delenv("MINERVA_ROUTER_KEY", raising=False)
    assert ab.build_abbble_billing_state() is None
    assert ab.build_abbble_subscription_state() is None


def test_billing_state_carries_agency_and_balance():
    state = ab.build_abbble_billing_state()
    assert state is not None
    assert state.logged_in is True
    assert state.org_id == "agency_123"
    assert state.org_slug == "acme"
    assert state.org_name == "Acme Inc"
    assert state.balance_usd == Decimal("42.5")
    assert state.portal_url == "https://portal.abbble.co.za/billing"
    assert state.error is None
    # In-app mutations stay portal-side.
    assert state.can_change_plan is False


def test_subscription_state_marks_current_tier():
    state = ab.build_abbble_subscription_state()
    assert state is not None
    assert state.logged_in is True
    assert state.org_id == "agency_123"
    assert [t.tier_id for t in state.tiers] == ["free", "plus", "super"]
    current = state.current
    assert current is not None
    assert (current.tier_id, current.tier_name) == ("plus", "Plus")
    assert current.monthly_credits == Decimal("22")
    assert current.credits_remaining == Decimal("12")
    assert next(t for t in state.tiers if t.tier_id == "plus").is_current is True
    assert state.portal_url == "https://portal.abbble.co.za"


def test_free_plan_resolves_free_tier(monkeypatch):
    credits = dict(CREDITS_PAID, plan="free", balance=0, used=0)
    monkeypatch.setattr(ab, "fetch_router_credits", lambda *, timeout=10.0: credits)
    state = ab.build_abbble_subscription_state()
    assert state is not None and state.current is not None
    assert (state.current.tier_id, state.current.tier_name) == ("free", "Free")


def test_unlisted_plan_still_names_itself(monkeypatch):
    """Legacy/custom plan ids absent from the catalog must not blank the plan."""
    credits = dict(CREDITS_PAID, plan="agency")
    monkeypatch.setattr(ab, "fetch_router_credits", lambda *, timeout=10.0: credits)
    state = ab.build_abbble_subscription_state()
    assert state is not None and state.current is not None
    assert state.current.tier_id == "agency"
    assert state.current.tier_name == "Agency"
    assert all(t.is_current is False for t in state.tiers)


def test_unreachable_router_is_signed_in_with_error(monkeypatch):
    monkeypatch.setattr(ab, "fetch_router_credits", lambda *, timeout=10.0: None)
    billing = ab.build_abbble_billing_state()
    assert billing is not None and billing.logged_in is True
    assert billing.error == "could not reach Minerva router"
    subscription = ab.build_abbble_subscription_state()
    assert subscription is not None and subscription.logged_in is True
    assert subscription.error == "could not reach Minerva router"


def test_builders_fall_back_only_for_keyed_homes(monkeypatch):
    """Nous-logged-out + router key -> ABBBLE state; keyless stays logged-out."""
    from hermes_cli import nous_billing as nb

    def _raise_auth(*, timeout=15.0):
        raise nb.BillingAuthError("Not logged into ABBBLE Portal", status=401, error="invalid_token")

    monkeypatch.setattr(nb, "get_billing_state", _raise_auth)
    monkeypatch.setattr(nb, "get_subscription_state", _raise_auth)

    from agent.billing_view import build_billing_state
    from agent.subscription_view import build_subscription_state

    assert build_billing_state().logged_in is True
    assert build_billing_state().org_name == "Acme Inc"
    sub = build_subscription_state()
    assert sub.logged_in is True
    assert sub.current is not None and sub.current.tier_id == "plus"

    monkeypatch.delenv("MINERVA_ROUTER_KEY", raising=False)
    assert build_billing_state().logged_in is False
    assert build_subscription_state().logged_in is False


def test_nous_login_still_wins_over_router_key(monkeypatch):
    """A live Nous session keeps its state; the ABBBLE fallback must not override it."""
    from hermes_cli import nous_billing as nb

    monkeypatch.setattr(
        nb, "get_billing_state", lambda *, timeout=15.0: {"org": {"id": "org_nous", "name": "Nous Org"}}
    )

    def _forbid(*, timeout=10.0):
        raise AssertionError("ABBBLE fallback must not run for Nous-logged-in homes")

    monkeypatch.setattr(ab, "build_abbble_billing_state", _forbid)

    from agent.billing_view import build_billing_state

    state = build_billing_state()
    assert state.logged_in is True
    assert state.org_id == "org_nous"

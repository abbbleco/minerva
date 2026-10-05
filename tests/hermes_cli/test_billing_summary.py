"""Tests for the dashboard billing summary (hermes_cli/web_routers/billing.py).

Pure orchestration over PostgREST reads (mocked at the ``_rest`` seam — no
network, no database). Asserts the entitlement contract the UI depends on:

- unknown is not zero: unreadable balance surfaces null, never 0
- expired subscriptions degrade to free, never to an error
- past_due is reported, never hidden
- no memberships means onboarding, not failure
"""

from unittest.mock import patch

from hermes_cli.web_routers import billing as billing_router

BASE = "https://xyz.supabase.co"
ANON = "anon-key"
TOKEN = "user-jwt"


def _rows(memberships=None, agency=None, subs=None):
    memberships = [{"agency_id": "agency-9", "role": "owner"}] if memberships is None else memberships
    agency = [{"id": "agency-9", "slug": "acme", "name": "Acme",
               "plan": "free", "status": "active",
               "credits_balance_usd": 12.5}] if agency is None else agency
    subs = [] if subs is None else subs

    def fake(table, token, base, anon, params):
        assert token == TOKEN and base == BASE and anon == ANON
        return {"agency_memberships": memberships, "agencies": agency,
                "agency_subscriptions": subs}[table]

    return fake


class TestSummarize:
    def test_free_member(self):
        with patch.object(billing_router, "_rest", side_effect=_rows()):
            out = billing_router.summarize("user-1", TOKEN, BASE, ANON)
        assert out["linked"] is True
        assert out["agency"]["slug"] == "acme"
        assert (out["plan"], out["billing_state"]) == ("free", "free")
        assert out["balance_usd"] == 12.5
        assert out["subscription"] is None

    def test_active_paid_subscription(self):
        subs = [{"plan": "super", "status": "active", "current_period_end": "2099-01-01T00:00:00+00:00"}]
        with patch.object(billing_router, "_rest", side_effect=_rows(subs=subs)):
            out = billing_router.summarize("user-1", TOKEN, BASE, ANON)
        assert (out["plan"], out["billing_state"]) == ("super", "active")
        assert out["subscription"]["status"] == "active"

    def test_expired_subscription_degrades_to_free(self):
        subs = [{"plan": "plus", "status": "active", "current_period_end": "2020-01-01T00:00:00+00:00"}]
        with patch.object(billing_router, "_rest", side_effect=_rows(subs=subs)):
            out = billing_router.summarize("user-1", TOKEN, BASE, ANON)
        assert (out["plan"], out["billing_state"]) == ("free", "free")
        assert out["subscription"] is None

    def test_past_due_reported(self):
        subs = [{"plan": "agency", "status": "past_due", "current_period_end": "2099-01-01T00:00:00+00:00"}]
        with patch.object(billing_router, "_rest", side_effect=_rows(subs=subs)):
            out = billing_router.summarize("user-1", TOKEN, BASE, ANON)
        assert (out["plan"], out["billing_state"]) == ("agency", "past_due")

    def test_active_portal_tier_recognised(self):
        subs = [{"plan": "super", "status": "active", "current_period_end": "2099-01-01T00:00:00+00:00"}]
        with patch.object(billing_router, "_rest", side_effect=_rows(subs=subs)):
            out = billing_router.summarize("user-1", TOKEN, BASE, ANON)
        assert (out["plan"], out["billing_state"]) == ("super", "active")
        assert out["subscription"]["status"] == "active"

    def test_past_due_portal_tier_reported(self):
        subs = [{"plan": "plus", "status": "past_due", "current_period_end": "2099-01-01T00:00:00+00:00"}]
        with patch.object(billing_router, "_rest", side_effect=_rows(subs=subs)):
            out = billing_router.summarize("user-1", TOKEN, BASE, ANON)
        assert (out["plan"], out["billing_state"]) == ("plus", "past_due")

    def test_no_membership_means_onboarding(self):
        with patch.object(billing_router, "_rest", side_effect=_rows(memberships=[])):
            out = billing_router.summarize("user-1", TOKEN, BASE, ANON)
        assert out == {"linked": True, "agency": None, "portal_url": out["portal_url"]}

    def test_unreadable_balance_is_null_not_zero(self):
        agency = [{"id": "agency-9", "slug": "acme", "name": "Acme",
                   "plan": "free", "status": "active", "credits_balance_usd": None}]
        with patch.object(billing_router, "_rest", side_effect=_rows(agency=agency)):
            out = billing_router.summarize("user-1", TOKEN, BASE, ANON)
        assert out["balance_usd"] is None

    def test_unparseable_balance_is_null_not_zero(self):
        agency = [{"id": "agency-9", "slug": "acme", "name": "Acme",
                   "plan": "free", "status": "active", "credits_balance_usd": "n/a"}]
        with patch.object(billing_router, "_rest", side_effect=_rows(agency=agency)):
            out = billing_router.summarize("user-1", TOKEN, BASE, ANON)
        assert out["balance_usd"] is None

    def test_total_outage_degrades_to_onboarding_shape(self):
        with patch.object(billing_router, "_rest", return_value=None):
            out = billing_router.summarize("user-1", TOKEN, BASE, ANON)
        assert out["linked"] is True and out["agency"] is None

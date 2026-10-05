"""Invariant tests for the premium entitlement gate.

The gate answers "may this surface run" from an already-fetched
subscription-state payload. Behaviour contract, not snapshots: paid tiers
pass, everything else raises, and the two tier lists (here and the
renderer's ``entitlement.ts``) must agree — enforced by asserting the exact
set, so adding a tier on one side without the other goes red.
"""
from hermes_cli.nous_billing import (
    PREMIUM_TIERS,
    PremiumRequiredError,
    current_tier_id,
    is_premium_tier,
    require_premium_tier,
)


def _subscription(**overrides):
    base = {"ok": True, "logged_in": True}
    base.update(overrides)
    return base


def test_premium_tier_set_matches_renderer_contract():
    # The renderer twin is apps/desktop/src/lib/entitlement.ts::PREMIUM_TIERS.
    # Same members, same fail-closed semantics; a new paid tier must be added
    # to both in the same change.
    assert PREMIUM_TIERS == frozenset({"plus", "super", "ultra", "agency"})


def test_is_premium_tier_grants_paid_denies_rest():
    for tier in ("plus", "super", "ultra", "agency"):
        assert is_premium_tier(tier) is True
    for tier in ("free", "", "enterprise", "ultra-plus", None, 42):
        assert is_premium_tier(tier) is False


def test_is_premium_tier_tolerates_case_and_whitespace():
    assert is_premium_tier("  Plus ") is True


def test_current_tier_id_prefers_current_then_flag():
    assert current_tier_id({"current": {"tier_id": "plus"}}) == "plus"
    flagged = {"tiers": [
        {"tier_id": "super", "is_current": True},
        {"tier_id": "free", "is_current": False},
    ]}
    assert current_tier_id(flagged) == "super"


def test_current_tier_id_unresolvable_is_none():
    assert current_tier_id({}) is None
    assert current_tier_id(None) is None
    assert current_tier_id({"current": {"tier_id": ""}}) is None


def test_require_premium_tier_returns_tier_or_raises():
    assert require_premium_tier(_subscription(current={"tier_id": "super"})) == "super"
    for bad in (
        _subscription(logged_in=False, current={"tier_id": "super"}),
        _subscription(current={"tier_id": "free"}),
        _subscription(),
        None,
    ):
        try:
            require_premium_tier(bad)
        except PremiumRequiredError as exc:
            assert exc.error == "premium_required"
        else:
            raise AssertionError(f"expected PremiumRequiredError for {bad!r}")

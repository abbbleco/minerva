/**
 * Account display rules (Phase: portal signed-in state): welcome-name
 * derivation and plan CTA mapping. Pure functions, no React/Next.
 */
import assert from "node:assert/strict";
import test from "node:test";

import {
  displayNameForSession,
  planActionForTier,
} from "../app/lib/account-display";

test("displayNameForSession uses the email local-part", () => {
  assert.equal(displayNameForSession({ id: "1", email: "Ada@Example.com" }), "Ada");
  assert.equal(displayNameForSession({ id: "1", email: "  bo@x.io " }), "bo");
  assert.equal(displayNameForSession({ id: "1" }), null);
  assert.equal(displayNameForSession({ id: "1", email: "not-an-email" }), "not-an-email");
  assert.equal(displayNameForSession(null), null);
});

test("signed-out plans all link to signup", () => {
  const plan = { id: "PLUS", cta: "Get Minerva" };
  assert.deepEqual(planActionForTier(plan, null), {
    kind: "link", text: "Subscribe", href: "/signup",
  });
  assert.deepEqual(
    planActionForTier(plan, { logged_in: false, current: null }),
    { kind: "link", text: "Subscribe", href: "/signup" },
  );
});

test("current tier locks, free users get plan CTAs, paid users get switch", () => {
  const plus = { id: "PLUS", cta: "Get Minerva" };
  const freeSub = { logged_in: true, current: { tier_id: "free", name: "Free", monthly_credits: 0 } };
  const plusSub = { logged_in: true, current: { tier_id: "plus", name: "Plus", monthly_credits: 10 } };

  assert.deepEqual(planActionForTier(plus, freeSub), {
    kind: "link", text: "Get Minerva", href: "/manage-subscription?plan=PLUS",
  });
  assert.deepEqual(planActionForTier(plus, plusSub), { kind: "current", text: "Current plan" });
  // Case-insensitive: API tier_ids are lowercase, display ids upper.
  assert.deepEqual(
    planActionForTier({ id: "FREE", cta: "Try Minerva" }, freeSub),
    { kind: "current", text: "Current plan" },
  );
  assert.deepEqual(
    planActionForTier({ id: "FREE", cta: "Try Minerva" }, plusSub),
    { kind: "link", text: "Switch plan", href: "/manage-subscription?plan=FREE" },
  );
});

import assert from "node:assert/strict";
import { test } from "node:test";

import {
  canManageMembers,
  claimableInvites,
  guardMutation,
  isMemberRole,
  mayGrantRole,
  normalizeAllowance,
  normalizeEmail,
  validateAllowance,
  validateInvite,
} from "../app/lib/members.js";

test("emails normalize to lowercase trim; non-strings empty", () => {
  assert.equal(normalizeEmail("  Ada@Example.CO.ZA "), "ada@example.co.za");
  assert.equal(normalizeEmail(null), "");
  assert.equal(normalizeEmail(42), "");
});

test("invite validation: shape only, permission lives in the route", () => {
  assert.equal(validateInvite("", "operator"), "an email address is required");
  assert.equal(validateInvite("not-an-email", "operator"), "that email address does not look valid");
  assert.equal(validateInvite("a@b.co", "superadmin"), "pick a role: owner, manager, operator, or viewer");
  assert.equal(validateInvite("a@b.co", "owner"), null);
  assert.equal(validateInvite("a@b.co", "viewer"), null);
});

test("management is owner/manager; only owners grant owners", () => {
  assert.equal(canManageMembers("owner"), true);
  assert.equal(canManageMembers("manager"), true);
  assert.equal(canManageMembers("operator"), false);
  assert.equal(canManageMembers("viewer"), false);
  assert.equal(canManageMembers(null), false);
  assert.equal(mayGrantRole("owner", "owner"), true);
  assert.equal(mayGrantRole("manager", "owner"), false);
  assert.equal(mayGrantRole("manager", "operator"), true);
  assert.equal(mayGrantRole("operator", "viewer"), false);
  assert.equal(isMemberRole("manager"), true);
  assert.equal(isMemberRole("root"), false);
});

test("mutations: nobody touches their own row", () => {
  const self = { id: "m1", user_id: "u1", role: "owner", status: "active" };
  for (const change of [
    { kind: "role", role: "viewer" },
    { kind: "status", status: "suspended" },
    { kind: "remove" },
  ] as const) {
    const guard = guardMutation({ callerUserId: "u1", callerRole: "owner", target: self, change });
    assert.equal(guard.ok, false);
  }
});

test("mutations: managers never touch owner rows; only owners grant owner", () => {
  const owner = { id: "m1", user_id: "u1", role: "owner", status: "active" };
  const demote = guardMutation({
    callerUserId: "u2",
    callerRole: "manager",
    target: owner,
    change: { kind: "role", role: "viewer" },
  });
  assert.equal(demote.ok, false);
  const grant = guardMutation({
    callerUserId: "u2",
    callerRole: "manager",
    target: { id: "m3", user_id: "u3", role: "viewer", status: "active" },
    change: { kind: "role", role: "owner" },
  });
  assert.equal(grant.ok, false);
  const ownerGrant = guardMutation({
    callerUserId: "u2",
    callerRole: "owner",
    target: { id: "m3", user_id: "u3", role: "viewer", status: "active" },
    change: { kind: "role", role: "owner" },
  });
  assert.equal(ownerGrant.ok, true);
});

test("mutations: pending invites activate on sign-in, never by hand", () => {
  const invited = { id: "m9", user_id: null, role: "operator", status: "invited" };
  const activate = guardMutation({
    callerUserId: "u2",
    callerRole: "owner",
    target: invited,
    change: { kind: "status", status: "active" },
  });
  assert.equal(activate.ok, false);
  const roleChange = guardMutation({
    callerUserId: "u2",
    callerRole: "owner",
    target: invited,
    change: { kind: "role", role: "viewer" },
  });
  assert.equal(roleChange.ok, true);
});

test("mutations: viewers and operators are refused outright", () => {
  const target = { id: "m3", user_id: "u3", role: "viewer", status: "active" };
  for (const role of ["viewer", "operator"]) {
    const guard = guardMutation({
      callerUserId: "u9",
      callerRole: role,
      target,
      change: { kind: "remove" },
    });
    assert.equal(guard.ok, false);
    assert.equal(guard.reason, "managers and owners only");
  }
});

test("allowances: finite dollars rounded to cents; empty clears; negatives rejected", () => {
  assert.equal(validateAllowance(null), null);
  assert.equal(validateAllowance(undefined), null);
  assert.equal(validateAllowance(""), null);
  assert.equal(validateAllowance(25), null);
  assert.equal(validateAllowance("10.5"), null);
  assert.equal(validateAllowance(0), null);
  assert.equal(validateAllowance(-1), "allowance cannot be negative");
  assert.equal(validateAllowance("abc"), "allowance must be a dollar amount");
  assert.equal(validateAllowance(Number.NaN), "allowance must be a dollar amount");
  assert.equal(validateAllowance(2_000_000), "allowance is unreasonably large");
  assert.equal(normalizeAllowance(null), null);
  assert.equal(normalizeAllowance(""), null);
  assert.equal(normalizeAllowance("10.555"), 10.56);
  assert.equal(normalizeAllowance(7), 7);
});

test("allowances: managers may set them, never on owners or selves", () => {
  const viewer = { id: "m3", user_id: "u3", role: "viewer", status: "active" };
  const byManager = guardMutation({
    callerUserId: "u2",
    callerRole: "manager",
    target: viewer,
    change: { kind: "allowance" },
  });
  assert.equal(byManager.ok, true);
  const onOwner = guardMutation({
    callerUserId: "u2",
    callerRole: "manager",
    target: { id: "m1", user_id: "u1", role: "owner", status: "active" },
    change: { kind: "allowance" },
  });
  assert.equal(onOwner.ok, false);
  const onSelf = guardMutation({
    callerUserId: "u2",
    callerRole: "owner",
    target: { id: "m2", user_id: "u2", role: "owner", status: "active" },
    change: { kind: "allowance" },
  });
  assert.equal(onSelf.ok, false);
  const byViewer = guardMutation({
    callerUserId: "u9",
    callerRole: "viewer",
    target: viewer,
    change: { kind: "allowance" },
  });
  assert.equal(byViewer.ok, false);
  // Invited rows accept allowances too — they apply on claim.
  const onInvite = guardMutation({
    callerUserId: "u2",
    callerRole: "owner",
    target: { id: "m9", user_id: null, role: "operator", status: "invited" },
    change: { kind: "allowance" },
  });
  assert.equal(onInvite.ok, true);
});

test("claims split on the user's own active agencies, never a stranger's", () => {
  const invited = [
    { id: "i1", agency_id: "a1" },
    { id: "i2", agency_id: "a2" },
  ];
  assert.deepEqual(claimableInvites(invited, ["a1"]), { claim: ["i2"], consume: ["i1"] });
  assert.deepEqual(claimableInvites(invited, new Set(["a2"])), { claim: ["i1"], consume: ["i2"] });
  assert.deepEqual(claimableInvites(invited, []), { claim: ["i1", "i2"], consume: [] });
  assert.deepEqual(claimableInvites([], ["a1"]), { claim: [], consume: [] });
});

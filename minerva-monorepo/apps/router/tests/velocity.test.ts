/**
 * Velocity limiter tests: burst allowance, window slide, tier ceilings,
 * fail-open store, env overrides. Pure-ish (injected store + clock), so no
 * I/O, no sleeps, no flakiness.
 */
import assert from "node:assert/strict";
import test from "node:test";

import {
  checkVelocity,
  MemoryVelocityStore,
  velocityLimits,
  type VelocityLimits,
} from "../src/velocity.js";

const LIMITS: VelocityLimits = { windowMs: 60_000, freePerWindow: 2, paidPerWindow: 5 };

test("allows up to the ceiling, then 429s with retry-after", () => {
  const store = new MemoryVelocityStore();
  assert.equal(checkVelocity("a1", false, store, LIMITS, 0).allowed, true);
  assert.equal(checkVelocity("a1", false, store, LIMITS, 1_000).allowed, true);
  const denied = checkVelocity("a1", false, store, LIMITS, 2_000);
  assert.equal(denied.allowed, false);
  assert.equal(denied.retryAfterSeconds, 60);
});

test("window slides: old hits age out", () => {
  const store = new MemoryVelocityStore();
  checkVelocity("a1", false, store, LIMITS, 0);
  checkVelocity("a1", false, store, LIMITS, 1_000);
  assert.equal(checkVelocity("a1", false, store, LIMITS, 2_000).allowed, false);
  assert.equal(checkVelocity("a1", false, store, LIMITS, 61_000).allowed, true);
});

test("paid ceiling is separate and higher", () => {
  const store = new MemoryVelocityStore();
  for (let i = 0; i < 5; i++) {
    assert.equal(checkVelocity("a1", true, store, LIMITS, i).allowed, true);
  }
  assert.equal(checkVelocity("a1", true, store, LIMITS, 5).allowed, false);
});

test("buckets are per agency", () => {
  const store = new MemoryVelocityStore();
  checkVelocity("a1", false, store, LIMITS, 0);
  checkVelocity("a1", false, store, LIMITS, 1);
  assert.equal(checkVelocity("a2", false, store, LIMITS, 2).allowed, true);
});

test("empty agency id never denies", () => {
  const store = new MemoryVelocityStore();
  for (let i = 0; i < 100; i++) {
    assert.equal(checkVelocity("", false, store, LIMITS, i).allowed, true);
  }
});

test("broken store fails open", () => {
  const broken = {
    hits(): number {
      throw new Error("db down");
    },
    add(): void {
      throw new Error("db down");
    },
  };
  assert.equal(checkVelocity("a1", false, broken, LIMITS, 0).allowed, true);
});

test("env overrides ceilings", () => {
  process.env.MINERVA_RPM_FREE = "7";
  process.env.MINERVA_RPM_PAID = "9";
  try {
    const limits = velocityLimits();
    assert.equal(limits.freePerWindow, 7);
    assert.equal(limits.paidPerWindow, 9);
  } finally {
    delete process.env.MINERVA_RPM_FREE;
    delete process.env.MINERVA_RPM_PAID;
  }
});

test("garbage env falls back to defaults", () => {
  process.env.MINERVA_RPM_FREE = "many";
  try {
    assert.equal(velocityLimits().freePerWindow, 20);
  } finally {
    delete process.env.MINERVA_RPM_FREE;
  }
});

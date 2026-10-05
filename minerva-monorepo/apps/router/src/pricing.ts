/** Token -> USD maths for the credits ledger. Pure and side-effect free. */

import type { CatalogEntry } from './catalog.js';

/** Vertex `text-embedding-004` (768-dim), USD per 1M input tokens. */
export const EMBEDDING_PER_1M = 0.02;

export type Usage = {
  promptTokens: number;
  completionTokens: number;
};

/**
 * Cost of a chat call in USD.
 *
 * Ledger entries are rounded to 6 dp (1e-6 USD) rather than to cents: a single call is
 * often worth a fraction of a cent, and rounding each row to whole cents would drift the
 * monthly reconciliation by more than the ±1% target once a tenant makes thousands of calls.
 */
export function chatCostUsd(entry: CatalogEntry, usage: Usage): number {
  const prompt = (Math.max(0, usage.promptTokens) / 1_000_000) * entry.promptPer1M;
  const completion = (Math.max(0, usage.completionTokens) / 1_000_000) * entry.completionPer1M;
  return roundUsd(prompt + completion);
}

export function embeddingCostUsd(promptTokens: number): number {
  return roundUsd((Math.max(0, promptTokens) / 1_000_000) * EMBEDDING_PER_1M);
}

export function roundUsd(value: number): number {
  return Math.round(value * 1e6) / 1e6;
}

/** Apply the billing multiplier: how many credits one USD of subscription buys. */
export function toCredits(usd: number, multiplier: number): number {
  return roundUsd(usd * multiplier);
}

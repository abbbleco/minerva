/**
 * Agency API key derivation — shared by `apps/web` (key issuance) and `apps/router`
 * (key verification).
 *
 * Both sides must hash identically or every router call 401s. Keeping one implementation
 * is the only way to guarantee that.
 */

import { createHash, randomBytes } from "node:crypto";

/** Publishable keys are browser-embedded; server keys are for backends. */
export type KeyPurpose = "publishable" | "server";

/** SHA-256 hex of the full token. The plaintext is never stored. */
export function hashApiKey(token: string): string {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

export interface GeneratedApiKey {
  token: string;
  prefix: string;
  last4: string;
  hash: string;
}

/**
 * Mint a new key. `qkt_pub_*` for publishable, `qkt_sec_*` for server — the prefix is load
 * bearing: the router's tier detection and the intake purpose restrictions both read it.
 *
 * Format preserved exactly from v1 (`base64url` body, `prefix` = first 16 chars of the token):
 * the stored `agency_api_keys.key_prefix` column is displayed in the UI, so changing the shape
 * would silently alter what operators see.
 */
export function generateApiKey(purpose: KeyPurpose): GeneratedApiKey {
  const raw = randomBytes(24).toString("base64url");
  const prefix = purpose === "publishable" ? "qkt_pub" : "qkt_sec";
  const token = `${prefix}_${raw}`;
  return {
    token,
    prefix: token.slice(0, 16),
    last4: token.slice(-4),
    hash: hashApiKey(token),
  };
}

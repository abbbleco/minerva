/**
 * Publish authorization for the release origin.
 *
 * This app serves the update feed every installed client trusts, so write
 * access is the highest-privilege thing in the deployment: whoever can publish
 * can ship an installer to every install. The client's own defenses (a pinned
 * signing identity the feed cannot supply, sha256-pinned manifests) mean a
 * forged artifact cannot be *installed*, but a forged CHANNEL RECORD can still
 * wedge every client that reads it — so the record path is exactly the one that
 * must never be reachable without the secret.
 *
 * Design:
 *   - One bearer token from the environment. Fail closed when unset: an origin
 *     with no token has no publish path at all, rather than an open one.
 *   - Compared in constant time with a fixed-length digest on both sides, so
 *     neither the comparison nor its duration reveals the token.
 *   - The token is never logged, echoed, or included in an error body.
 */

import { createHash, timingSafeEqual } from "node:crypto";

export type PublishAuth =
  | { ok: true }
  | { ok: false; status: 503 | 401; error: string };

function digest(value: string): Buffer {
  // Hashing first makes the comparison fixed-length regardless of the secret's
  // length, so timingSafeEqual cannot throw on a length mismatch and cannot be
  // used as a length oracle.
  return createHash("sha256").update(value, "utf8").digest();
}

export function authorizePublish(request: Request): PublishAuth {
  const expected = process.env.MINERVA_ASSETS_PUBLISH_TOKEN?.trim();
  if (!expected) {
    // Named distinctly from 401: this is an operator problem, not a caller one.
    return {
      ok: false,
      status: 503,
      error: "publish is not configured on this origin (MINERVA_ASSETS_PUBLISH_TOKEN unset)",
    };
  }

  const header = request.headers.get("authorization") ?? "";
  const match = /^Bearer[ ]+(.+)$/.exec(header);
  if (!match) {
    return { ok: false, status: 401, error: "publish requires a bearer token" };
  }

  const presented = digest(match[1]!.trim());
  const wanted = digest(expected);
  if (!timingSafeEqual(presented, wanted)) {
    return { ok: false, status: 401, error: "publish token rejected" };
  }

  return { ok: true };
}

import { createHash, createPrivateKey, createPublicKey, createSign, createVerify, randomBytes } from "node:crypto";

/**
 * ES256 JWT issuance and JWKS publication for the portal's OAuth server, with
 * no new dependencies (node:crypto only).
 *
 * The signing key lives in OAUTH_JWT_PRIVATE_KEY_PEM (PKCS8 PEM). The public
 * half is derived at boot and served at /.well-known/jwks.json under a stable
 * `kid` (the SHA-256 thumbprint of the public key). Rotation is additive:
 * generate a second key, publish both kids, then retire the old one — a
 * client caches JWKS, so removing a kid orphans every token signed with it.
 */

const KEY_ID_LENGTH = 16;

export interface JwtKey {
  kid: string;
  privateKeyPem: string;
  publicJwk: JsonWebKey & { kid: string };
}

let cached: JwtKey | null = null;

function base64UrlEncode(input: Buffer | string): string {
  return Buffer.from(input).toString("base64url");
}

function base64UrlDecode(input: string): Buffer {
  return Buffer.from(input, "base64url");
}

export function getJwtKey(): JwtKey {
  if (cached) return cached;
  const pem = process.env.OAUTH_JWT_PRIVATE_KEY_PEM?.trim();
  if (!pem) {
    throw new Error("OAUTH_JWT_PRIVATE_KEY_PEM is not set (generate: openssl ecparam -genkey -name prime256v1 -noout)");
  }
  const privateKey = createPrivateKey(pem);
  const publicKey = createPublicKey(privateKey);
  const jwk = publicKey.export({ format: "jwk" }) as JsonWebKey;
  if (jwk.kty !== "EC" || jwk.crv !== "P-256" || !jwk.x || !jwk.y) {
    throw new Error("OAUTH_JWT_PRIVATE_KEY_PEM must be a P-256 EC key");
  }
  // Stable kid: thumbprint of the public key, so key and kid can never drift.
  const kidSource = JSON.stringify({ crv: "P-256", kty: "EC", x: jwk.x, y: jwk.y });
  const kid = createHash("sha256").update(kidSource, "utf8").digest("hex").slice(0, KEY_ID_LENGTH);

  cached = {
    kid,
    privateKeyPem: pem,
    publicJwk: { kty: "EC", crv: "P-256", x: jwk.x, y: jwk.y, kid, use: "sig", alg: "ES256" },
  };
  return cached;
}

export function jwksDocument(): { keys: Array<JsonWebKey & { kid?: string }> } {
  return { keys: [getJwtKey().publicJwk] };
}

export interface AccessClaims {
  /** Bare client_id the token was minted for (the plugin checks exactly this). */
  aud: string;
  /** Portal origin (the plugin checks exactly this). */
  iss: string;
  sub: string;
  org_id?: string;
  client_id?: string;
  oauth_contract_version: 1;
  scope?: string;
  agent_instance_id?: string;
}

/** Mint an access JWT. `ttlSeconds` is capped at 1h: these are bearer tokens. */
export function signAccessToken(claims: AccessClaims, ttlSeconds = 3600): string {
  const key = getJwtKey();
  const now = Math.floor(Date.now() / 1000);
  const body = {
    ...claims,
    iat: now,
    exp: now + Math.min(Math.max(ttlSeconds, 60), 3600),
  };
  const header = base64UrlEncode(JSON.stringify({ alg: "ES256", typ: "JWT", kid: key.kid }));
  const payload = base64UrlEncode(JSON.stringify(body));
  const signingInput = `${header}.${payload}`;
  // JWS needs raw R||S, not DER: ieee-p1363 gives the 64-byte concatenation.
  const signature = createSign("SHA256")
    .update(signingInput)
    .sign({ key: key.privateKeyPem, dsaEncoding: "ieee-p1363" }, "base64url");
  return `${signingInput}.${signature}`;
}

/** Verify a token this server minted. Returns the claims or null (never throws). */
export function verifyAccessToken(token: string): Record<string, unknown> | null {
  try {
    const key = getJwtKey();
    const [headerB64, payloadB64, signatureB64] = token.split(".");
    if (!headerB64 || !payloadB64 || !signatureB64) return null;
    const header = JSON.parse(base64UrlDecode(headerB64).toString("utf8")) as { alg?: string; kid?: string };
    if (header.alg !== "ES256" || header.kid !== key.kid) return null;
    const valid = createVerify("SHA256")
      .update(`${headerB64}.${payloadB64}`)
      .verify({ key: key.privateKeyPem, dsaEncoding: "ieee-p1363" }, base64UrlDecode(signatureB64));
    if (!valid) return null;
    const claims = JSON.parse(base64UrlDecode(payloadB64).toString("utf8")) as Record<string, unknown>;
    const exp = typeof claims.exp === "number" ? claims.exp : 0;
    if (exp * 1000 <= Date.now()) return null;
    return claims;
  } catch {
    return null;
  }
}

/** PKCE S256 verification: SHA-256(verifier) base64url == challenge. */
export function verifyPkceChallenge(verifier: string, challenge: string, method: string): boolean {
  if (method !== "S256" && method !== "plain") return false;
  if (method === "plain") {
    return verifier.length >= 43 && verifier.length <= 128 && verifier === challenge;
  }
  if (verifier.length < 43 || verifier.length > 128) return false;
  return createHash("sha256").update(verifier, "utf8").digest("base64url") === challenge;
}

export function randomSecret(bytes = 32): string {
  return randomBytes(bytes).toString("base64url");
}

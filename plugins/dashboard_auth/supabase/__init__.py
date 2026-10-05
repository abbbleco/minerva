"""Supabase dashboard-auth provider — Minerva portal accounts in the Hermes dashboard.

Authenticates dashboard users against the Minerva Supabase project (the same
users who subscribe at portal.abbble.co.za), so one account unlocks the portal
*and* a self-hosted dashboard. No service-role key anywhere: every Supabase
call uses the public anon key, and every row read is gated by the project's
RLS member policies — the dashboard backend never sees another tenant's rows.

Flow (all standard GoTrue REST, no extra dependencies):
  login    POST {url}/auth/v1/token?grant_type=password {email, password}
  verify   GET  {url}/auth/v1/user  (+ agency lookup for org_id)
  refresh  POST {url}/auth/v1/token?grant_type=refresh_token {refresh_token}
  revoke   POST {url}/auth/v1/logout (best-effort)

``verify_session`` runs on the dashboard's per-request path, so verified
sessions are cached for ``_VERIFY_TTL_SECONDS`` keyed by token hash. Only the
validated Session is cached — never credentials — and logout clears it.

Registration is skipped (with LAST_SKIP_REASON, like the other providers)
unless both ``SUPABASE_URL``/``SUPABASE_ANON_KEY`` env (or
``dashboard.supabase.url``/``anon_key`` in config.yaml) are set.
"""

from __future__ import annotations

import base64
import hashlib
import json
import logging
import os
import threading
import time
from typing import Any, Dict, Optional, Tuple

import httpx

from hermes_cli.dashboard_auth import (
    DashboardAuthProvider,
    ProviderError,
    RefreshExpiredError,
    Session,
)
from plugins.dashboard_auth._shared import (
    NonInteractiveMixin,
    SkipRegistration,
    load_config_section,
    register_provider,
    resolve_env_or_cfg,
)

logger = logging.getLogger(__name__)
_TAG = "dashboard-auth-supabase"

_TIMEOUT_SEC = 10.0
_VERIFY_TTL_SECONDS = 60.0


def _decode_jwt_exp(access_token: str) -> int:
    """``exp`` claim without verification (validity comes from the /user call).

    Returns 0 when the token is not a decodable JWT — callers treat that as
    "already expired" rather than failing open.
    """
    try:
        payload_b64 = access_token.split(".")[1]
        payload_b64 += "=" * (-len(payload_b64) % 4)
        payload = json.loads(base64.urlsafe_b64decode(payload_b64.encode("ascii")))
        exp = int(payload.get("exp", 0))
        return exp if exp > 0 else 0
    except Exception:
        return 0


def _is_bad_credentials(status: int, body: Any) -> bool:
    if status in (400, 401, 403, 404, 422):
        return True
    if isinstance(body, dict):
        code = str(body.get("error_code") or body.get("error") or "").lower()
        return code in ("invalid_grant", "invalid_credentials", "user_not_found",
                        "email_not_confirmed", "invalid_email_or_password")
    return False


class SupabaseDashboardAuthProvider(NonInteractiveMixin, DashboardAuthProvider):
    """Email/password provider backed by Supabase Auth (GoTrue)."""

    name = "supabase"
    display_name = "Minerva Account"
    supports_password = True
    _NOT_INTERACTIVE = "SupabaseDashboardAuthProvider is password-only; use complete_password_login."
    _NO_START_LOGIN = (
        "SupabaseDashboardAuthProvider is password-only; there is no OAuth redirect flow. "
        "The login page POSTs to /auth/password-login instead.")

    def __init__(self, *, supabase_url: str, anon_key: str) -> None:
        url = (supabase_url or "").strip().rstrip("/")
        if not url or not url.startswith(("https://", "http://")):
            raise ValueError("supabase_url must be an http(s) URL")
        if not (anon_key or "").strip():
            raise ValueError("anon_key must be non-empty")
        self._base = url
        self._anon_key = anon_key.strip()
        self._verify_cache: Dict[str, Tuple[float, Session]] = {}
        self._verify_lock = threading.Lock()

    # ---- HTTP helpers --------------------------------------------------------

    def _headers(self, token: Optional[str] = None) -> Dict[str, str]:
        headers = {"apikey": self._anon_key, "Accept": "application/json",
                   "Content-Type": "application/json"}
        if token:
            headers["Authorization"] = f"Bearer {token}"
        return headers

    def _post(self, path: str, body: Dict[str, Any], *, token: Optional[str] = None) -> httpx.Response:
        try:
            return httpx.post(f"{self._base}{path}", json=body, headers=self._headers(token),
                              timeout=_TIMEOUT_SEC)
        except httpx.TransportError as exc:
            raise ProviderError(f"Supabase unreachable: {exc}") from exc

    def _get(self, path: str, *, token: str, params: Optional[Dict[str, str]] = None) -> httpx.Response:
        try:
            return httpx.get(f"{self._base}{path}", headers=self._headers(token),
                             params=params, timeout=_TIMEOUT_SEC)
        except httpx.TransportError as exc:
            raise ProviderError(f"Supabase unreachable: {exc}") from exc

    @staticmethod
    def _json_or_none(response: httpx.Response) -> Any:
        ctype = response.headers.get("content-type", "")
        if "application/json" not in ctype:
            return None
        try:
            return response.json()
        except ValueError:
            return None

    def _postgrest(self, table: str, token: str, params: Dict[str, str]) -> Any:
        """Authenticated PostgREST read (RLS applies the caller's membership).

        Raises ProviderError on transport failure or 5xx; returns None on 401/403
        (token valid for Auth but not entitled here — caller decides); raises
        InvalidCodeError-never: RLS denials are data, not credential failures.
        """
        resp = self._get(f"/rest/v1/{table}", token=token, params=params)
        if resp.status_code in (401, 403):
            return None
        if resp.status_code >= 500:
            raise ProviderError(f"Supabase PostgREST {table} returned {resp.status_code}")
        if resp.status_code != 200:
            logger.warning("%s: PostgREST %s returned %s", _TAG, table, resp.status_code)
            return None
        body = self._json_or_none(resp)
        return body if isinstance(body, list) else None

    # ---- agency resolution ----------------------------------------------------

    def _primary_agency_id(self, token: str) -> str:
        """First active agency id for the token owner, or "" (portal onboarding)."""
        try:
            rows = self._postgrest(
                "agency_memberships", token,
                {"select": "agency_id", "status": "eq.active", "order": "created_at.asc", "limit": "1"})
        except ProviderError:
            raise
        except Exception as exc:  # noqa: BLE001 — entitlement reads fail open to no-agency
            logger.warning("%s: agency lookup failed: %s", _TAG, exc)
            return ""
        if not rows:
            return ""
        agency_id = (rows[0] or {}).get("agency_id") or ""
        return str(agency_id)

    # ---- password login ---------------------------------------------------------

    def complete_password_login(self, *, username: str, password: str) -> Session:
        email = (username or "").strip()
        if not email or not password:
            # Generic message + no oracle: identical shape for empty and wrong.
            raise InvalidCredentialsError("invalid email or password")
        resp = self._post("/auth/v1/token?grant_type=password",
                          {"email": email, "password": password})
        body = self._json_or_none(resp)
        if resp.status_code != 200 or not isinstance(body, dict) or not body.get("access_token"):
            if _is_bad_credentials(resp.status_code, body):
                raise InvalidCredentialsError("invalid email or password")
            raise ProviderError(f"Supabase token endpoint returned {resp.status_code}")
        return self._session_from_token_response(body)

    def _session_from_token_response(self, body: Dict[str, Any]) -> Session:
        access_token = str(body.get("access_token") or "")
        refresh_token = str(body.get("refresh_token") or "")
        user = body.get("user") or {}
        user_id = str(user.get("id") or "")
        if not access_token or not user_id:
            raise ProviderError("Supabase token response missing access_token/user")
        email = str(user.get("email") or "")
        meta = user.get("user_metadata") or {}
        display_name = str(meta.get("full_name") or meta.get("name") or email.split("@")[0])
        try:
            expires_in = int(body.get("expires_in") or 0)
        except (TypeError, ValueError):
            expires_in = 0
        expires_at = int(time.time()) + expires_in if expires_in > 0 else _decode_jwt_exp(access_token)
        return Session(
            user_id=user_id, email=email, display_name=display_name,
            org_id=self._primary_agency_id(access_token),
            provider=self.name, expires_at=expires_at,
            access_token=access_token, refresh_token=refresh_token)

    # ---- session lifecycle -------------------------------------------------------

    def _cache_get(self, token: str) -> Optional[Session]:
        key = hashlib.sha256(token.encode("utf-8")).hexdigest()
        with self._verify_lock:
            hit = self._verify_cache.get(key)
            if hit is None:
                return None
            fetched_at, session = hit
            if time.monotonic() - fetched_at > _VERIFY_TTL_SECONDS:
                self._verify_cache.pop(key, None)
                return None
            return session

    def _cache_put(self, token: str, session: Session) -> None:
        key = hashlib.sha256(token.encode("utf-8")).hexdigest()
        with self._verify_lock:
            self._verify_cache[key] = (time.monotonic(), session)
            if len(self._verify_cache) > 1024:
                oldest = min(self._verify_cache, key=lambda k: self._verify_cache[k][0])
                self._verify_cache.pop(oldest, None)

    def _cache_drop(self, token: str) -> None:
        key = hashlib.sha256(token.encode("utf-8")).hexdigest()
        with self._verify_lock:
            self._verify_cache.pop(key, None)

    def verify_session(self, *, access_token: str) -> Optional[Session]:
        if not access_token:
            return None
        cached = self._cache_get(access_token)
        if cached is not None:
            # Re-check expiry against the clock: a cached session outlives its
            # usefulness the moment its exp passes, TTL or not.
            if cached.expires_at and cached.expires_at <= int(time.time()):
                self._cache_drop(access_token)
            else:
                return cached
        resp = self._get("/auth/v1/user", token=access_token)
        if resp.status_code in (401, 403, 404):
            self._cache_drop(access_token)
            return None
        if resp.status_code != 200:
            # Deliberately 503, not a degraded login: the credential is valid
            # but we cannot tell who it belongs to, and guessing wrong (e.g.
            # an empty org_id) would misattribute billing state.
            raise ProviderError(f"Supabase user endpoint returned {resp.status_code}")
        user = self._json_or_none(resp)
        if not isinstance(user, dict) or not user.get("id"):
            return None
        email = str(user.get("email") or "")
        meta = user.get("user_metadata") or {}
        display_name = str(meta.get("full_name") or meta.get("name") or email.split("@")[0])
        session = Session(
            user_id=str(user.get("id")), email=email, display_name=display_name,
            org_id=self._primary_agency_id(access_token),
            provider=self.name, expires_at=_decode_jwt_exp(access_token) or int(time.time()) + 3600,
            access_token=access_token, refresh_token="")
        self._cache_put(access_token, session)
        return session

    def refresh_session(self, *, refresh_token: str) -> Session:
        if not refresh_token:
            raise RefreshExpiredError("no refresh token present in session")
        resp = self._post("/auth/v1/token?grant_type=refresh_token", {"refresh_token": refresh_token})
        body = self._json_or_none(resp)
        if resp.status_code in (400, 401, 403, 404) or not isinstance(body, dict) or not body.get("access_token"):
            raise RefreshExpiredError("refresh token expired or invalid")
        if resp.status_code != 200:
            raise ProviderError(f"Supabase token endpoint returned {resp.status_code}")
        return self._session_from_token_response(body)

    def revoke_session(self, *, refresh_token: str) -> None:
        # Best-effort per the provider contract: logout failures must not raise.
        # Without the access token we cannot call /logout, so there is nothing
        # server-side to do — the Supabase JWT simply expires.
        _ = refresh_token
        return None


# ---- Plugin entry point ----

LAST_SKIP_REASON: str = ""


def _load_config_supabase_section() -> dict:
    return load_config_section(logger, _TAG, "dashboard", "supabase")


def _settings() -> dict:
    """Resolve SupabaseDashboardAuthProvider kwargs; skip when unconfigured."""
    section = _load_config_supabase_section()
    url = (
        resolve_env_or_cfg("SUPABASE_URL", section.get("url", ""))
        or os.environ.get("NEXT_PUBLIC_SUPABASE_URL", "").strip()
    )
    anon_key = (
        resolve_env_or_cfg("SUPABASE_ANON_KEY", section.get("anon_key", ""))
        or os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY", "").strip()
    )
    if not url or not anon_key:
        raise SkipRegistration(
            "SUPABASE_URL / SUPABASE_ANON_KEY are not set (and dashboard.supabase.url / "
            "anon_key in config.yaml are empty). Set both to enable Minerva-account "
            "login on this dashboard, or leave unset to keep local-only auth.")
    return {"supabase_url": url, "anon_key": anon_key}


def register(ctx) -> None:
    """Register ``SupabaseDashboardAuthProvider`` when Supabase is configured."""
    global LAST_SKIP_REASON
    LAST_SKIP_REASON = ""
    kwargs, LAST_SKIP_REASON = register_provider(ctx, logger, _TAG, SupabaseDashboardAuthProvider, _settings)
    if kwargs is not None:
        logger.info("dashboard-auth-supabase: registered provider (url=%s)", kwargs["supabase_url"])

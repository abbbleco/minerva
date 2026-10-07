"""Minerva Router provider profile — OpenAI-compatible credits gateway.

The Minerva Router (``minerva-monorepo/apps/router``, live at
``https://minrouter.abbbleco.workers.dev``) is the ONLY component that holds upstream
inference credentials. The engine never does: it authenticates with a
per-agency ``qkt_sec_*`` key (minted at portal.abbble.co.za/console/hermes),
and the router meters the call and debits the agency ledger.

Thin by design — inference is plain OpenAI-compatible ``chat_completions`` and
the router owns model-tier filtering, so the stock transport and the inherited
``fetch_models`` are already correct.

Model IDs: wire IDs are ``minerva/<flattened-upstream-id>``; omitting ``model``
uses the free meta-router. See ``apps/router/src/catalog.ts``.
"""

from __future__ import annotations

import os
from typing import Any

from providers import register_provider
from providers.base import ProviderProfile

#: Router origin when ``MINERVA_ROUTER_URL`` is unset. Production default is the
#: hosted router; local dev points the env var at http://127.0.0.1:8090.
DEFAULT_ROUTER_URL = "https://minrouter.abbbleco.workers.dev"

#: Picker list used only when ``GET /v1/models`` fails. Keep in sync with
#: ``apps/router/src/catalog.ts``. Free models only, so the fallback is usable
#: on every tier — a paid flagship here would fail validation on free keys.
FALLBACK_MODELS = (
    "minerva/openrouter-free",
    "minerva/google-gemma-4-31b-it:free",
    "minerva/nvidia-nemotron-3-ultra-550b-a55b:free",
)


def router_base_url() -> str:
    """OpenAI-compat base URL: ``{origin}/v1``.

    ``MINERVA_ROUTER_URL`` is the router *origin* (scheme + host + port), not
    the API prefix, so one env var drives both inference
    (``/v1/chat/completions``) and discovery (``/v1/models``). An explicit
    ``/v1`` suffix is honoured rather than doubled.
    """
    origin = (os.environ.get("MINERVA_ROUTER_URL") or DEFAULT_ROUTER_URL).strip().rstrip("/")
    if not origin:
        origin = DEFAULT_ROUTER_URL
    return origin if origin.endswith("/v1") else f"{origin}/v1"


class MinervaProfile(ProviderProfile):
    """Minerva Router — single-subscription credits gateway."""

    def default_reasoning_config(self, model: str | None = None) -> dict | None:
        """Pin ``medium`` rather than inheriting the upstream model's own default.

        Every token on this provider is metered against a real credit balance,
        and a hosted reasoning model left to its own default can pick its
        ceiling. ``medium`` is the honest default for a metered relay;
        operators who want more set ``agent.reasoning_effort`` explicitly.
        """
        return {"enabled": True, "effort": "medium"}

    def build_extra_body(self, *, session_id: str | None = None, **context: Any) -> dict[str, Any]:
        """Sticky routing key so upstream prompt caching can actually hit.

        The router forwards it upstream so repeated calls in one session land
        on the same provider endpoint. Cost control, not correctness: the
        router ignores it if upstream does not accept it.
        """
        return {"session_id": session_id} if session_id else {}


_base = router_base_url()

minerva = MinervaProfile(
    name="minerva",
    aliases=("minerva-router", "abbble"),
    env_vars=("MINERVA_ROUTER_KEY", "MINERVA_ROUTER_URL"),
    base_url=_base,
    models_url=f"{_base}/models",
    fallback_models=FALLBACK_MODELS,
    display_name="Minerva",
    description="Minerva credits router (single subscription)",
    signup_url="https://portal.abbble.co.za/pricing",
    # A per-agency router key is required; there is no anonymous tier.
    auth_type="api_key",
)

register_provider(minerva)

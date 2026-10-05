"""Tests for the bundled Minerva Router provider plugin.

The router is the only holder of upstream inference credentials; the engine
authenticates per agency key and the router meters + debits. These assert the
profile wiring (registration, endpoint derivation, metered defaults), never
live network — fetch_models against the real router is covered by the
router's own suite.
"""

from providers import get_provider_profile


def _profile():
    p = get_provider_profile("minerva")
    assert p is not None
    return p


class TestMinervaProfile:
    def test_registered_under_minerva(self):
        p = _profile()
        assert p.name == "minerva"
        assert p.display_name == "Minerva"
        assert p.auth_type == "api_key"

    def test_base_url_defaults_to_hosted_router(self, monkeypatch):
        monkeypatch.delenv("MINERVA_ROUTER_URL", raising=False)
        import plugins.model_providers.minerva as plugin

        assert plugin.router_base_url() == "https://minrouter.abbble.co.za/v1"

    def test_base_url_env_override_no_double_v1(self, monkeypatch):
        import plugins.model_providers.minerva as plugin

        monkeypatch.setenv("MINERVA_ROUTER_URL", "http://127.0.0.1:8090")
        assert plugin.router_base_url() == "http://127.0.0.1:8090/v1"
        monkeypatch.setenv("MINERVA_ROUTER_URL", "http://127.0.0.1:8090/v1")
        assert plugin.router_base_url() == "http://127.0.0.1:8090/v1"

    def test_fallback_models_are_minerva_wire_ids(self):
        assert _profile().fallback_models == (
            "minerva/anthropic-claude-opus-4.6",
            "minerva/anthropic-claude-sonnet-4.6",
        )

    def test_metered_reasoning_default(self):
        assert _profile().default_reasoning_config() == {"enabled": True, "effort": "medium"}

    def test_session_id_sticky_body(self):
        assert _profile().build_extra_body(session_id="s1") == {"session_id": "s1"}
        assert _profile().build_extra_body() == {}

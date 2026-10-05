"""ABBBLE Portal is the default provider when its credential is present.

``resolve_provider("auto")`` previously fell through to OpenRouter
auto-detection even for a signed-in ABBBLE user, because the ABBBLE
credential (``MINERVA_ROUTER_KEY``) participated in no rung: the ``nous``
row is ``oauth_device_code``, not ``api_key``, so the env-key scan skipped
it. These tests lock in that a usable router key resolves to ``minerva``
ahead of ambient third-party keys, while explicit config still wins over
everything and the OpenRouter path is unchanged when ABBBLE is absent.
"""

import pytest

from hermes_cli import auth as auth_mod


@pytest.fixture(autouse=True)
def _isolated_home(tmp_path, monkeypatch):
    """No real config, no ambient credentials: every rung below is seeded."""
    home = tmp_path / "hermes"
    home.mkdir(parents=True, exist_ok=True)
    monkeypatch.setenv("HERMES_HOME", str(home))
    for key in (
        "OPENROUTER_API_KEY",
        "OPENAI_API_KEY",
        "MINERVA_ROUTER_KEY",
        "MINERVA_ROUTER_URL",
        "NOUS_API_KEY",
        "HERMES_PORTAL_BASE_URL",
        "NOUS_PORTAL_BASE_URL",
    ):
        monkeypatch.delenv(key, raising=False)
    from hermes_cli import config as _cfg

    _cfg._LOAD_CONFIG_CACHE.clear()
    _cfg._RAW_CONFIG_CACHE.clear()
    auth_mod._RESOLVE_TOKEN_CACHE.clear()


def test_abbble_router_key_beats_ambient_openrouter_key(monkeypatch):
    """Product credential outranks third-party ambient credential."""
    monkeypatch.setenv("MINERVA_ROUTER_KEY", "qkt_sec_testkey1234567890abcdef")
    monkeypatch.setenv("OPENROUTER_API_KEY", "sk-or-test1234567890abcdef")
    assert auth_mod.resolve_provider("auto") == "minerva"


def test_openrouter_unchanged_without_abbbe_credential(monkeypatch):
    """No ABBBLE credential: the OpenRouter rung behaves exactly as before."""
    monkeypatch.setenv("OPENROUTER_API_KEY", "sk-or-test1234567890abcdef")
    assert auth_mod.resolve_provider("auto") == "openrouter"


def test_explicit_config_still_wins_over_abbbe_login(tmp_path, monkeypatch):
    """An explicit `model.provider` pin beats the ABBBLE rung (rung 2 > new rung)."""
    monkeypatch.setenv("MINERVA_ROUTER_KEY", "qkt_sec_testkey1234567890abcdef")
    (tmp_path / "hermes" / "config.yaml").write_text(
        "model:\n  provider: openrouter\n", encoding="utf-8"
    )
    from hermes_cli import config as _cfg

    _cfg._LOAD_CONFIG_CACHE.clear()
    _cfg._RAW_CONFIG_CACHE.clear()
    assert auth_mod.resolve_provider("auto") == "openrouter"

"""Dual binary names: `minerva*` aliases must behave exactly like `hermes*`.

Contract (rebrand): `minerva`, `minerva-agent` and `minerva-acp` are the same
entry points as their `hermes*` twins — same mains, same argv-identity
matching, same-family relaunch. Old names keep working unchanged.
"""

import sys

import pytest

from hermes_cli._launchers import ENTRY_POINTS
from hermes_cli._parser import (
    CLI_ENTRY_BASENAMES,
    CLI_NAMES,
    invocation_prog,
)


def test_entry_points_cover_both_families_with_shared_mains():
    assert ENTRY_POINTS["minerva"] == ENTRY_POINTS["hermes"] == ("hermes_cli.main", "main")
    assert ENTRY_POINTS["minerva-agent"] == ENTRY_POINTS["hermes-agent"] == ("agent.legacy_cli", "main")
    assert ENTRY_POINTS["minerva-acp"] == ENTRY_POINTS["hermes-acp"] == ("acp_adapter.entry", "main")


def test_identity_matcher_accepts_both_families():
    assert CLI_NAMES == ("hermes", "minerva")
    for stem in ("hermes", "hermes.exe", "minerva", "minerva.exe"):
        assert stem in CLI_ENTRY_BASENAMES
    assert "bogus" not in CLI_ENTRY_BASENAMES


@pytest.mark.parametrize(
    ("argv0", "expected"),
    [
        ("hermes", "hermes"),
        ("minerva", "minerva"),
        (r"C:\venv\Scripts\minerva.exe", "minerva"),
        ("/usr/local/bin/minerva", "minerva"),
        ("python -m hermes_cli.main", "hermes"),  # module runs fall back
        ("main.py", "hermes"),
        ("__main__.py", "hermes"),
        ("python", "hermes"),
        ("bogus-tool", "hermes"),
    ],
)
def test_invocation_prog_follows_recognised_alias(monkeypatch, argv0, expected):
    monkeypatch.setattr(sys, "argv", [argv0])
    assert invocation_prog("hermes", "hermes", "minerva") == expected


def test_acp_help_shows_invoked_alias(monkeypatch, capsys):
    from acp_adapter.entry import _parse_args

    monkeypatch.setattr(sys, "argv", ["minerva-acp"])
    with pytest.raises(SystemExit):
        _parse_args(["--help"])
    assert capsys.readouterr().out.splitlines()[0].startswith("usage: minerva-acp")

    monkeypatch.setattr(sys, "argv", ["hermes-acp"])
    with pytest.raises(SystemExit):
        _parse_args(["--help"])
    assert capsys.readouterr().out.splitlines()[0].startswith("usage: hermes-acp")


def test_legacy_prog_follows_its_alias(monkeypatch):
    from agent.legacy_cli import _build_parser

    monkeypatch.setattr(sys, "argv", ["minerva-agent"])
    assert _build_parser().prog == "minerva-agent"
    monkeypatch.setattr(sys, "argv", ["hermes-agent"])
    assert _build_parser().prog == "hermes-agent"


def test_relaunch_prefers_same_family_binary(monkeypatch, tmp_path):
    import shutil

    from hermes_cli import relaunch

    hermes_bin = tmp_path / "hermes"
    minerva_bin = tmp_path / "minerva"
    hermes_bin.write_text("#!/bin/sh\n")
    minerva_bin.write_text("#!/bin/sh\n")
    monkeypatch.setattr(shutil, "which", lambda name: str(tmp_path / name))

    # `.exe` argv never resolves as a CWD-relative file, so the PATH lookup runs.
    monkeypatch.setattr(sys, "argv", ["minerva.exe"])
    assert relaunch.resolve_hermes_bin() == str(minerva_bin)
    monkeypatch.setattr(sys, "argv", ["hermes.exe"])
    assert relaunch.resolve_hermes_bin() == str(hermes_bin)


def test_installation_command_spawns_minerva(monkeypatch, tmp_path):
    """Service units (systemd ExecStart, launchd) spawn the minerva launcher."""
    from pathlib import Path

    from hermes_cli import _launchers

    monkeypatch.setattr(
        _launchers, "resolve_store_python", lambda root: Path("/store/python")
    )
    command = _launchers.installation_command(tmp_path, ["gateway", "run"])
    assert command[0] == str(Path(tmp_path) / ".hermes" / "bin" / "minerva")
    assert command[1:] == ["gateway", "run"]


def test_relaunch_falls_back_across_families(monkeypatch, tmp_path):
    import shutil

    from hermes_cli import relaunch

    hermes_bin = tmp_path / "hermes"
    hermes_bin.write_text("#!/bin/sh\n")
    monkeypatch.setattr(shutil, "which", lambda name: str(hermes_bin) if name == "hermes" else None)

    # Only `hermes` on PATH: a `minerva` invocation still relaunches correctly.
    monkeypatch.setattr(sys, "argv", ["minerva.exe"])
    assert relaunch.resolve_hermes_bin() == str(hermes_bin)

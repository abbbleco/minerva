"""Render every app icon from two master tiles.

Inputs (hand-maintained, the only brand assets this needs):
    assets/icon-master.svg        1024x1024 light tile, full bleed
    assets/icon-master-dark.svg   1024x1024 dark tile, full bleed

The rule is one sentence: a target is the master rendered at N pixels behind a
squircle mask. Nothing about the artwork is interpreted - no path extraction, no
bounding-box fit, no node editing - so the master can come out of any drawing
tool with any number of paths, colours or export metadata.

Two targets cannot come from a full-bleed tile and are reported as skipped: the
bare-mark wordmark (website/static/img/logo*.png) needs the mark alone on
transparency, and the Icon Composer packages need a separate art layer.
Supply assets/nous-mark.png to generate the wordmark.

    HERMES_PYTHON=<runtime python> node scripts/generate-icons.mjs   # wrapper
    python scripts/render_icons.py [--check]

Pillow and resvg-py are core runtime dependencies.
"""
from __future__ import annotations

import argparse
import io
import math
import sys
from pathlib import Path

import resvg_py
from PIL import Image, ImageDraw

REPO = Path(__file__).resolve().parent.parent
ASSETS = REPO / "assets"
DARK_HEX = "#0d1117"

# The plate corner radius as a fraction of the tile edge, matching the squircle
# the committed desktop icons use (rx=245 on a 1024 canvas).
SQUIRCLE_RX = 245 / 1024

# Windows resource qualifiers. targetsize-* gives the taskbar, Start and search
# an exact bitmap per slot instead of an upscale of the 44px base, and
# electron-builder only runs makepri when these qualified siblings are staged.
APPX_SCALES = (100, 125, 150, 200, 400)
APPX_TARGET_SIZES = (16, 20, 24, 30, 32, 36, 40, 48, 60, 64, 72, 80, 96, 256)
APPX_ALTFORMS = (("", "light"), ("_altform-unplated", "dark"), ("_altform-lightunplated", "light"))
APPX_LOGOS = {"Square44x44Logo": 44, "Square150x150Logo": 150, "StoreLogo": 50,
              "Wide310x150Logo": (310, 150)}

SKIPPED = {
    "website/static/img/logo.png": "needs assets/nous-mark.png (bare mark on transparency)",
    "website/static/img/logo-dark.png": "needs assets/nous-mark.png (bare mark on transparency)",
    "apps/desktop/assets/icon.icon/": "Icon Composer package needs a separate art layer",
    "apps/bootstrap-installer/src-tauri/icons/icon.icon/": "Icon Composer package needs a separate art layer",
    "apps/desktop/packaging/dmg-volume.icns": "hand-made drive artwork; built from assets/dmg-volume.png",
}


def scaled(base: int, scale: int) -> int:
    """Microsoft's tables round up (150 @ 125% = 188, 50 @ 125% = 63)."""
    return math.ceil(base * scale / 100 - 1e-9)


def squircle_mask(size: int) -> Image.Image:
    mask = Image.new("L", (size, size), 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, size - 1, size - 1),
                                           radius=SQUIRCLE_RX * size, fill=255)
    return mask


class Masters:
    """The two brand tiles, resolved once."""

    def __init__(self, root: Path = REPO) -> None:
        self.light_svg = (root / "assets" / "icon-master.svg").read_text(encoding="utf-8-sig")
        self.dark_svg = (root / "assets" / "icon-master-dark.svg").read_text(encoding="utf-8-sig")

    def render(self, svg: str, size: int) -> Image.Image:
        data = resvg_py.svg_to_bytes(svg_string=svg, width=size, height=size)
        return Image.open(io.BytesIO(data)).convert("RGBA")

    def tile(self, size: int, dark: bool = False) -> Image.Image:
        img = self.render(self.dark_svg if dark else self.light_svg, size)
        img.putalpha(Image.composite(img.getchannel("A"), Image.new("L", img.size, 0),
                                     squircle_mask(size)))
        return img


def png_bytes(img: Image.Image) -> bytes:
    buf = io.BytesIO()
    img.save(buf, "PNG", optimize=True)
    return buf.getvalue()


def ico_bytes(img: Image.Image, sizes: list[int]) -> bytes:
    buf = io.BytesIO()
    img.save(buf, format="ICO", sizes=[(s, s) for s in sizes])
    return buf.getvalue()


def icns_bytes(img: Image.Image) -> bytes:
    buf = io.BytesIO()
    frames = [img.resize((s, s), Image.LANCZOS) for s in (16, 32, 64, 128, 256, 512, 1024)]
    frames[0].save(buf, format="ICNS", append_images=frames[1:])
    return buf.getvalue()


def appx_targets() -> list[tuple[str, str, object]]:
    out: list[tuple[str, str, object]] = []
    for name, base in APPX_LOGOS.items():
        for scale in APPX_SCALES:
            qualifier = "" if scale == 100 else f".scale-{scale}"
            if isinstance(base, tuple):
                w, h = base
                out.append((f"{name}{qualifier}.png", "wide",
                            (scaled(w, scale), scaled(h, scale), scaled(100, scale))))
            else:
                out.append((f"{name}{qualifier}.png", "tile", scaled(base, scale)))
    for size in APPX_TARGET_SIZES:
        for suffix, polarity in APPX_ALTFORMS:
            out.append((f"Square44x44Logo.targetsize-{size}{suffix}.png", polarity, size))
    return out


def build_targets() -> list[tuple[str, str, object]]:
    """(relative path, kind, argument) for every generated file."""
    targets: list[tuple[str, str, object]] = []
    for name, kind, arg in appx_targets():
        targets.append((f"apps/desktop/assets/appx/{name}", kind, arg))

    desktop = "apps/desktop/assets"
    targets += [
        (f"{desktop}/icon.png", "tile", 1024),
        (f"{desktop}/icon-dark.png", "tile_dark", 1024),
        (f"{desktop}/icon-mac.png", "tile", 1024),
        (f"{desktop}/icon.ico", "ico", [16, 24, 32, 48, 64, 128, 256]),
        (f"{desktop}/icon-dark.ico", "ico_dark", [16, 24, 32, 48, 64, 128, 256]),
        (f"{desktop}/icon.icns", "icns", None),
        (f"{desktop}/icon-dark.icns", "icns_dark", None),
        ("apps/desktop/public/apple-touch-icon.png", "tile", 1024),
        ("apps/desktop/public/nous-girl.png", "tile", 256),
        ("apps/desktop/public/nous-girl-dark.png", "tile_dark", 256),
        ("website/static/img/nous-logo.png", "opaque_light", 150),
        ("website/static/img/nous-logo-dark.png", "opaque_dark", 150),
        ("website/static/img/favicon-16x16.png", "tile", 16),
        ("website/static/img/favicon-32x32.png", "tile", 32),
        ("website/static/img/favicon.ico", "ico", [16, 32, 48]),
        ("website/static/img/favicon.svg", "svg", None),
        ("web/public/favicon.ico", "ico", [16, 32, 48]),
        ("apps/bootstrap-installer/src-tauri/icons/32x32.png", "tile", 32),
        ("apps/bootstrap-installer/src-tauri/icons/128x128.png", "tile", 128),
        ("apps/bootstrap-installer/src-tauri/icons/128x128@2x.png", "tile", 256),
        ("apps/bootstrap-installer/src-tauri/icons/icon.ico", "ico", [16, 32, 64, 128, 256]),
        ("apps/bootstrap-installer/src-tauri/icons/icon.icns", "icns", None),
        ("apps/bootstrap-installer/public/nous-girl.png", "tile", 256),
    ]
    return targets


def target_bytes(masters: Masters, kind: str, arg: object) -> bytes:
    dark = kind in ("tile_dark", "ico_dark", "icns_dark", "opaque_dark")
    if kind == "svg":
        return masters.light_svg.encode("utf-8")
    if kind == "wide":
        w, h, tile = arg
        canvas = Image.new("RGBA", (w, h), (0, 0, 0, 0))
        canvas.alpha_composite(masters.tile(tile), ((w - tile) // 2, (h - tile) // 2))
        return png_bytes(canvas)
    if kind in ("opaque_light", "opaque_dark"):
        plate = Image.new("RGBA", masters.tile(arg, dark).size, (255, 255, 255, 255) if not dark
                          else _hex_rgb(DARK_HEX) + (255,))
        return png_bytes(Image.alpha_composite(plate, masters.tile(arg, dark)))
    if kind == "ico":
        return ico_bytes(masters.tile(max(arg)), arg)
    if kind == "ico_dark":
        return ico_bytes(masters.tile(max(arg), True), arg)
    if kind == "icns":
        return icns_bytes(masters.tile(1024))
    if kind == "icns_dark":
        return icns_bytes(masters.tile(1024, True))
    return png_bytes(masters.tile(arg, dark))


def _hex_rgb(value: str) -> tuple[int, int, int]:
    value = value.lstrip("#")
    return tuple(int(value[i:i + 2], 16) for i in (0, 2, 4))


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--out", type=Path, default=REPO, help="output root (default: repo root)")
    parser.add_argument("--check", action="store_true", help="verify on-disk files match a fresh render")
    args = parser.parse_args()

    masters = Masters()
    targets = build_targets()
    failures = 0
    for rel, kind, arg in targets:
        path = args.out / rel
        try:
            data = target_bytes(masters, kind, arg)
        except Exception as exc:  # noqa: BLE001 - report every target, then fail once
            failures += 1
            print(f"  !! {rel}: FAILED ({exc})")
            continue
        if args.check:
            if not path.exists():
                failures += 1
                print(f"  !! {rel}: MISSING")
            elif path.read_bytes() != data:
                failures += 1
                print(f"  !! {rel}: STALE")
        else:
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_bytes(data)

    verb = "checked" if args.check else "wrote"
    print(f"[{verb}] {len(targets)} targets, {failures} problem(s)")
    for rel, why in SKIPPED.items():
        print(f"  skipped {rel} - {why}")
    return int(failures > 0)


if __name__ == "__main__":
    sys.exit(main())

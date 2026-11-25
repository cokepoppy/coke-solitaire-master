#!/usr/bin/env python3
"""Extract native-resolution card-back previews from the 327-second frame."""

from __future__ import annotations

import argparse
import subprocess
from pathlib import Path

from PIL import Image


SOURCE_SIZE = (884, 1920)
GALLERY_CROPS = {
    "teal": (100, 513, 300, 813),
    "lattice": (342, 513, 542, 813),
    "blue": (583, 513, 783, 813),
    "spade": (100, 869, 300, 1169),
    "coral": (583, 869, 783, 1169),
    "floral": (100, 1224, 300, 1524),
    "amber": (342, 1224, 542, 1524),
}
RUBY_SELECTED_CROP = (339, 866, 555, 1180)
OUTPUT = Path(__file__).resolve().parents[1] / "assets" / "cards"
SRGB_PROFILE = "/System/Library/ColorSync/Profiles/sRGB Profile.icc"


def save_crop(source: Image.Image, name: str, bounds: tuple[int, int, int, int], output: Path) -> None:
    crop = source.crop(bounds)
    target = output / name
    crop.save(target, optimize=True)
    subprocess.run(["sips", "-e", SRGB_PROFILE, str(target)], check=True, capture_output=True, text=True)
    print(f"{target.name}: {crop.width}x{crop.height}, sRGB profile")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("source_frame", type=Path, help="884×1920 frame at 327 s / PTS 5022720")
    parser.add_argument("--output-dir", type=Path, default=OUTPUT)
    args = parser.parse_args()

    with Image.open(args.source_frame) as image:
        if image.size != SOURCE_SIZE:
            raise SystemExit(f"expected an 884x1920 source frame, got {image.size}")
        source = image.convert("RGB")

    args.output_dir.mkdir(parents=True, exist_ok=True)
    for back, bounds in GALLERY_CROPS.items():
        save_crop(source, f"back-{back}-gallery-reference.png", bounds, args.output_dir)
    save_crop(source, "back-ruby-gallery-selected-reference.png", RUBY_SELECTED_CROP, args.output_dir)


if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""Extract the six remaining unselected card backs from the Back Style frame."""

from __future__ import annotations

import argparse
from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "assets" / "cards"
SOURCE_RECTS = {
    "teal": (100, 513, 300, 813),
    "lattice": (342, 513, 542, 813),
    "spade": (100, 869, 300, 1169),
    "coral": (583, 869, 783, 1169),
    "floral": (100, 1224, 300, 1524),
    "amber": (342, 1224, 542, 1524),
}
SOURCE_SIZE = (884, 1920)
CARD_CROP_SIZE = (200, 300)
TARGET_SIZE = (118, 177)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("source_frame", type=Path, help="884×1920 frame at 327 s / PTS 5022720")
    parser.add_argument("--output-dir", type=Path, default=OUTPUT)
    args = parser.parse_args()

    with Image.open(args.source_frame) as source:
        if source.size != SOURCE_SIZE:
            raise ValueError(f"Expected {SOURCE_SIZE[0]}×{SOURCE_SIZE[1]} frame, got {source.size}")
        rgb = source.convert("RGB")
        args.output_dir.mkdir(parents=True, exist_ok=True)
        for name, box in SOURCE_RECTS.items():
            crop = rgb.crop(box)
            if crop.size != CARD_CROP_SIZE:
                raise ValueError(f"Unexpected crop size for {name}: {crop.size}")
            target = args.output_dir / f"back-{name}-reference.png"
            crop.resize(TARGET_SIZE, Image.Resampling.LANCZOS).save(target)
            print(f"{target.name}: source box={box}, target={TARGET_SIZE[0]}×{TARGET_SIZE[1]}")


if __name__ == "__main__":
    main()

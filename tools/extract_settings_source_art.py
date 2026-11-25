#!/usr/bin/env python3
"""Extract native-scale Settings controls from a source gameplay frame."""

from __future__ import annotations

import argparse
from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "assets" / "ui"
SOURCE_CROPS = {
    "settings-switch-on-reference.png": (701, 365, 824, 423),
    "settings-switch-off-reference.png": (701, 1155, 824, 1213),
    "settings-draw-mode-1-reference.png": (49, 789, 836, 893),
}


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("source_frame", type=Path, help="884×1920 frame at source PTS 4915200 (320 seconds).")
    args = parser.parse_args()

    frame = Image.open(args.source_frame).convert("RGB")
    if frame.size != (884, 1920):
        raise ValueError(f"Expected an 884×1920 source frame, got {frame.size}")
    OUTPUT.mkdir(parents=True, exist_ok=True)
    for filename, box in SOURCE_CROPS.items():
        crop = frame.crop(box)
        crop.save(OUTPUT / filename)
        print(f"{filename}: box={box}, size={crop.size}")


if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""Extract the unselected blue diamond card-back preview from a source frame."""

import argparse
from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
SOURCE_RECT = (583, 513, 783, 813)
TARGET_SIZE = (118, 177)
OUTPUT = ROOT / "assets" / "cards" / "back-blue-reference.png"


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("source_frame", type=Path, help="884x1920 frame at 327 seconds (PTS 5022720)")
    parser.add_argument("--output", type=Path, default=OUTPUT)
    args = parser.parse_args()

    with Image.open(args.source_frame) as source:
        if source.size != (884, 1920):
            raise ValueError(f"Expected 884x1920 source frame, got {source.size}")
        crop = source.convert("RGB").crop(SOURCE_RECT)
        if crop.size != (200, 300):
            raise ValueError(f"Unexpected card crop size: {crop.size}")
        reference = crop.resize(TARGET_SIZE, Image.Resampling.LANCZOS)

    args.output.parent.mkdir(parents=True, exist_ok=True)
    reference.save(args.output, optimize=True)
    print(f"Saved {args.output} ({TARGET_SIZE[0]}x{TARGET_SIZE[1]})")


if __name__ == "__main__":
    main()

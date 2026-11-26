#!/usr/bin/env python3
"""Extract complete Style 4 card faces from official App Store screenshot 3."""

from __future__ import annotations

import argparse
from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "assets" / "cards"
SOURCE_SIZE = (1242, 2688)
SOURCE_CARD_SIZE = (116, 174)
OUTPUT_CARD_SIZE = (118, 177)

# Full, unobstructed card rectangles in the official App Store iPhone screenshot 3.
# The exposed Queen of Clubs is intentionally omitted because Jack of Hearts
# overlaps its lower half in the source image.
SAMPLES = {
    "2-of-clubs": (201, 799),
    "ace-of-hearts": (321, 799),
    "10-of-clubs": (803, 799),
    "king-of-clubs": (321, 1015),
    "3-of-hearts": (563, 1084),
    "king-of-hearts": (683, 1108),
    "jack-of-hearts": (803, 1173),
    "6-of-clubs": (923, 1132),
    "6-of-diamonds": (201, 1500),
}


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("screenshot", type=Path, help="Official 1242×2688 iPhone screenshot 3")
    args = parser.parse_args()

    source = Image.open(args.screenshot).convert("RGB")
    if source.size != SOURCE_SIZE:
        raise ValueError(f"Expected {SOURCE_SIZE[0]}×{SOURCE_SIZE[1]}, got {source.size}")

    OUTPUT.mkdir(parents=True, exist_ok=True)
    for name, (x, y) in SAMPLES.items():
        box = (x, y, x + SOURCE_CARD_SIZE[0], y + SOURCE_CARD_SIZE[1])
        card = source.crop(box).resize(OUTPUT_CARD_SIZE, Image.Resampling.LANCZOS)
        output = OUTPUT / f"face-style-4-{name}-reference.png"
        card.save(output)
        print(f"{output.name}: source box={box}, size={OUTPUT_CARD_SIZE}")


if __name__ == "__main__":
    main()

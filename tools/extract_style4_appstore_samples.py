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

SAMPLES_BY_SCREENSHOT = {
    2: {
        "4-of-spades": (201, 1015),
        "8-of-spades": (441, 1070),
        "8-of-hearts": (756, 799),
    },
    3: {
        "2-of-clubs": (201, 799),
        "ace-of-hearts": (321, 799),
        "10-of-clubs": (803, 799),
        "king-of-clubs": (321, 1015),
        "3-of-hearts": (563, 1084),
        "king-of-hearts": (683, 1108),
        "jack-of-hearts": (803, 1173),
        "6-of-clubs": (923, 1132),
        "6-of-diamonds": (201, 1500),
    },
    4: {
        "ace-of-spades": (321, 799),
        "2-of-diamonds": (756, 799),
        "6-of-hearts": (201, 1015),
        "7-of-clubs": (561, 1088),
        "jack-of-diamonds": (681, 1112),
        "queen-of-diamonds": (801, 1143),
    },
}


def extract_samples(screenshot_number: int, screenshot_path: Path) -> None:
    source = Image.open(screenshot_path).convert("RGB")
    if source.size != SOURCE_SIZE:
        raise ValueError(f"Expected {SOURCE_SIZE[0]}×{SOURCE_SIZE[1]} at {screenshot_path}, got {source.size}")

    for name, (x, y) in SAMPLES_BY_SCREENSHOT[screenshot_number].items():
        box = (x, y, x + SOURCE_CARD_SIZE[0], y + SOURCE_CARD_SIZE[1])
        card = source.crop(box).resize(OUTPUT_CARD_SIZE, Image.Resampling.LANCZOS)
        output = OUTPUT / f"face-style-4-{name}-reference.png"
        card.save(output)
        print(f"{output.name}: screenshot={screenshot_number}, source box={box}, size={OUTPUT_CARD_SIZE}")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("screenshot_3", type=Path, help="Official 1242×2688 iPhone screenshot 3")
    parser.add_argument("--screenshot-2", type=Path, help="Also extract from official App Store screenshot 2")
    parser.add_argument("--screenshot-4", type=Path, help="Also extract from official App Store screenshot 4")
    args = parser.parse_args()

    OUTPUT.mkdir(parents=True, exist_ok=True)
    if args.screenshot_2:
        extract_samples(2, args.screenshot_2)
    extract_samples(3, args.screenshot_3)
    if args.screenshot_4:
        extract_samples(4, args.screenshot_4)


if __name__ == "__main__":
    main()

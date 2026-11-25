#!/usr/bin/env python3
"""Extract source-observed sample cards from the five Face Style gallery strips."""

from __future__ import annotations

from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "assets" / "ui"
OUTPUT = ROOT / "assets" / "cards"
CARD_NAMES = (
    "10-of-diamonds",
    "jack-of-clubs",
    "queen-of-hearts",
    "king-of-spades",
    "ace-of-diamonds",
)
# Boundaries follow the visible vertical card frames in each 607×197 strip.
X_BOUNDS = (0, 122, 241, 359, 477, 607)
STRIP_SIZE = (607, 197)
CARD_SIZE = (118, 177)


def main() -> None:
    OUTPUT.mkdir(parents=True, exist_ok=True)
    for style in (3, 4, 5):
        strip_path = SOURCE / f"theme-face-style-{style}-reference.png"
        strip = Image.open(strip_path).convert("RGB")
        if strip.size != STRIP_SIZE:
            raise ValueError(f"Expected {STRIP_SIZE} strip at {strip_path}, got {strip.size}")
        for index, name in enumerate(CARD_NAMES):
            box = (X_BOUNDS[index], 0, X_BOUNDS[index + 1], STRIP_SIZE[1])
            card = strip.crop(box).resize(CARD_SIZE, Image.Resampling.LANCZOS)
            output = OUTPUT / f"face-style-{style}-{name}-reference.png"
            card.save(output)
            print(f"{output.name}: strip={strip_path.name}, box={box}, size={CARD_SIZE}")


if __name__ == "__main__":
    main()

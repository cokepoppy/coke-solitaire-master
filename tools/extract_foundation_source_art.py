#!/usr/bin/env python3
"""Crop the four empty Ace foundation frames from the audited source game frame."""

from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "research" / "solitaire-master" / "gameplay-opening-2025" / "keyframes" / "target-pts-153600.png"
OUTPUT = ROOT / "assets" / "ui"


def main() -> None:
    frame = Image.open(SOURCE)
    OUTPUT.mkdir(parents=True, exist_ok=True)
    for index, x in enumerate((8, 133, 258, 383), start=1):
        frame.crop((x, 429, x + 118, 606)).save(OUTPUT / f"foundation-empty-{index}.png")


if __name__ == "__main__":
    main()

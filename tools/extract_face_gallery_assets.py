#!/usr/bin/env python3
"""Extract the five source card-face preview strips from the audited frame."""

from __future__ import annotations

import argparse
from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "assets" / "ui"
FRAME_SIZE = (884, 1920)
STRIP_X = 139
STRIP_WIDTH = 607
STRIP_HEIGHT = 197
STRIP_TOPS = (554, 809, 1063, 1318, 1574)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("face_frame", type=Path, help="Frame at source 325 s, Face Style selected")
    args = parser.parse_args()

    frame = Image.open(args.face_frame).convert("RGB")
    if frame.size != FRAME_SIZE:
        raise ValueError(f"Expected {FRAME_SIZE[0]}×{FRAME_SIZE[1]} frame, got {frame.size}")

    OUTPUT.mkdir(parents=True, exist_ok=True)
    strips = [
        frame.crop((STRIP_X, top, STRIP_X + STRIP_WIDTH, top + STRIP_HEIGHT))
        for top in STRIP_TOPS
    ]

    # The selected first strip has a green check overlapping the lower-right
    # corner. The Ace of Diamonds artwork is identical in every style preview;
    # restore that small area from the unselected second strip.
    patches = (
        (0, STRIP_HEIGHT - 12, 12, STRIP_HEIGHT),
        (STRIP_WIDTH - 48, 160, STRIP_WIDTH, STRIP_HEIGHT),
        (0, STRIP_HEIGHT - 1, STRIP_WIDTH, STRIP_HEIGHT),
    )
    for patch in patches:
        strips[0].paste(strips[1].crop(patch), patch[:2])

    for index, strip in enumerate(strips, start=1):
        name = f"theme-face-style-{index}-reference.png"
        strip.save(OUTPUT / name)
        print(f"{name}: source box=({STRIP_X},{STRIP_TOPS[index - 1]},{STRIP_WIDTH},{STRIP_HEIGHT})")


if __name__ == "__main__":
    main()

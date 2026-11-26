#!/usr/bin/env python3
"""Extract the selected-card frame from the official App Store screenshot."""

from __future__ import annotations

import argparse
from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
SOURCE_RECT = (807, 1129, 923, 1303)
OUTPUT_SIZE = (118, 177)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("screenshot", type=Path, help="Official 1242×2688 App Store screenshot 2")
    parser.add_argument("--output", type=Path, default=ROOT / "assets/ui/selected-card-frame-reference.png")
    args = parser.parse_args()

    source = Image.open(args.screenshot).convert("RGB")
    if source.size != (1242, 2688):
        raise ValueError(f"Expected a 1242×2688 screenshot, got {source.size}")
    frame = source.crop(SOURCE_RECT).resize(OUTPUT_SIZE, Image.Resampling.LANCZOS).convert("RGBA")
    pixels = frame.load()
    width, height = frame.size
    for y in range(height):
        for x in range(width):
            edge_distance = min(x, width - 1 - x, y, height - 1 - y)
            alpha = 255 if edge_distance <= 5 else 192 if edge_distance == 6 else 96 if edge_distance == 7 else 0
            red, green, blue, _ = pixels[x, y]
            pixels[x, y] = (red, green, blue, alpha)

    args.output.parent.mkdir(parents=True, exist_ok=True)
    frame.save(args.output)
    print(f"{args.output}: crop={SOURCE_RECT}, size={OUTPUT_SIZE}")


if __name__ == "__main__":
    main()

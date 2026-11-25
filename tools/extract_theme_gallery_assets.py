#!/usr/bin/env python3
"""Extract source-scale Themes header and active tab states from audited frames."""

from __future__ import annotations

import argparse
from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "assets" / "ui"
FRAME_SIZE = (884, 1920)
HEADER = (0, 0, 884, 306)
TAB_BAR = (0, 306, 884, 462)


def load_frame(path: Path) -> Image.Image:
    image = Image.open(path).convert("RGB")
    if image.size != FRAME_SIZE:
        raise ValueError(f"Expected {FRAME_SIZE[0]}×{FRAME_SIZE[1]} frame at {path}, got {image.size}")
    return image


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("background_frame", type=Path, help="Frame at source 323 s, Backgrounds selected")
    parser.add_argument("faces_frame", type=Path, help="Frame at source 325 s, Card faces selected")
    parser.add_argument("backs_frame", type=Path, help="Frame at source 326 s, Card backs selected")
    args = parser.parse_args()

    frames = {
        "backgrounds": load_frame(args.background_frame),
        "faces": load_frame(args.faces_frame),
        "backs": load_frame(args.backs_frame),
    }
    OUTPUT.mkdir(parents=True, exist_ok=True)
    outputs = {
        "theme-gallery-header-reference.png": frames["backgrounds"].crop(HEADER),
        **{
            f"theme-gallery-tabs-{name}-reference.png": frame.crop(TAB_BAR)
            for name, frame in frames.items()
        },
    }
    for name, image in outputs.items():
        image.save(OUTPUT / name)
        print(f"{name}: box={HEADER if 'header' in name else TAB_BAR}, size={image.size}")


if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""Extract the zero score glyph shown in official App Store screenshot 5."""

from __future__ import annotations

import argparse
from pathlib import Path

import numpy as np
from PIL import Image


SOURCE_SIZE = (1242, 2688)
SOURCE_BOX = (662, 1416, 718, 1506)
OUTPUT_SIZE = (53, 94)
BACKGROUND_KEY_THRESHOLD = 10
OPAQUE_DELTA = 32


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("screenshot", type=Path, help="Official 1242×2688 App Store screenshot 5")
    parser.add_argument("output", type=Path, nargs="?", default=Path("assets/ui/win-result-score-digit-0-reference.png"))
    args = parser.parse_args()

    source_path = args.screenshot.expanduser()
    with Image.open(source_path) as image:
        if image.size != SOURCE_SIZE:
            raise SystemExit(f"Expected source screenshot {SOURCE_SIZE}, got {image.size}.")
        source = np.asarray(image.convert("RGB"), dtype=np.float32)

    x1, y1, x2, y2 = SOURCE_BOX
    crop = source[y1:y2, x1:x2]
    # The four-pixel ring is plain dark navy from the score panel, clear of both
    # neighboring digits. Key it out and unmatte the antialiased orange edges.
    ring = np.concatenate((
        crop[:4].reshape(-1, 3),
        crop[-4:].reshape(-1, 3),
        crop[4:-4, :4].reshape(-1, 3),
        crop[4:-4, -4:].reshape(-1, 3),
    ))
    background = np.median(ring, axis=0)
    delta = np.max(np.abs(crop - background), axis=2)
    alpha = np.clip((delta - BACKGROUND_KEY_THRESHOLD) / (OPAQUE_DELTA - BACKGROUND_KEY_THRESHOLD), 0, 1)
    foreground = np.zeros_like(crop)
    visible = alpha > 0
    foreground[visible] = np.clip(
        (crop[visible] - background * (1 - alpha[visible, None])) / alpha[visible, None],
        0,
        255,
    )
    rgba = np.dstack((foreground.astype(np.uint8), np.round(alpha * 255).astype(np.uint8)))
    output = Image.fromarray(rgba, "RGBA").resize(OUTPUT_SIZE, Image.Resampling.LANCZOS)
    output_path = args.output.expanduser()
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output.save(output_path, optimize=True)
    print(f"{output_path}: source_box={SOURCE_BOX}, source_size={crop.shape[1]}×{crop.shape[0]}, output={OUTPUT_SIZE[0]}×{OUTPUT_SIZE[1]}")


if __name__ == "__main__":
    main()

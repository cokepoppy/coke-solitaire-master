#!/usr/bin/env python3
"""Extract the observed large score glyphs from the 310 s result frame."""

from __future__ import annotations

import argparse
import hashlib
from pathlib import Path

import numpy as np
from PIL import Image


FRAME_SIZE = (884, 1920)
BACKDROP_SIZE = (884, 153)
GLYPH_Y = (862, 956)
GLYPH_RECTS = {
    "win-result-score-digit-5-reference.png": (428, 479),
    "win-result-score-digit-2-a-reference.png": (479, 531),
    "win-result-score-digit-2-b-reference.png": (531, 584),
    "win-result-score-digit-3-reference.png": (584, 636),
}
BACKDROP_TOP = 834
ALPHA_DELTA_THRESHOLD = 16


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("source", type=Path, help="884×1920 frame at 310 seconds")
    parser.add_argument("backdrop", type=Path, help="the 884×153 inpainted backdrop bridge")
    parser.add_argument("output_dir", type=Path)
    args = parser.parse_args()

    with Image.open(args.source.expanduser()) as image:
        if image.size != FRAME_SIZE:
            raise SystemExit(f"Expected source frame {FRAME_SIZE}, got {image.size}.")
        source = np.asarray(image.convert("RGB"), dtype=np.int16)
    with Image.open(args.backdrop.expanduser()) as image:
        if image.size != BACKDROP_SIZE:
            raise SystemExit(f"Expected backdrop bridge {BACKDROP_SIZE}, got {image.size}.")
        backdrop = np.asarray(image.convert("RGB"), dtype=np.int16)

    output_dir = args.output_dir.expanduser().resolve()
    output_dir.mkdir(parents=True, exist_ok=True)
    y1, y2 = GLYPH_Y
    for filename, (x1, x2) in GLYPH_RECTS.items():
        original = source[y1:y2, x1:x2]
        sampled_backdrop = backdrop[y1 - BACKDROP_TOP : y2 - BACKDROP_TOP, x1:x2]
        delta = np.max(np.abs(original - sampled_backdrop), axis=2)
        alpha = np.where(delta > ALPHA_DELTA_THRESHOLD, 255, 0).astype(np.uint8)
        rgba = np.dstack((original.astype(np.uint8), alpha))
        output = output_dir / filename
        Image.fromarray(rgba, "RGBA").save(output, optimize=True)
        digest = hashlib.sha256(output.read_bytes()).hexdigest()
        print(f"{output} {x2 - x1}×{y2 - y1} sha256={digest}")


if __name__ == "__main__":
    main()

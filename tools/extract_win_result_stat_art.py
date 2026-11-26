#!/usr/bin/env python3
"""Extract observed time and move values from the source win-result frame."""

from __future__ import annotations

import argparse
import hashlib
from pathlib import Path

import numpy as np
from PIL import Image


FRAME_SIZE = (884, 1920)
SOURCE_PNG_SHA256 = "a09af0132a4bd4fcd594e7560e731104435aaae6e94c4400e2b67d26db510b9d"
BACKGROUND = np.array([5, 14, 24], dtype=np.float32)
FOREGROUND = np.array([246, 245, 247], dtype=np.float32)
STAT_CROPS = {
    "win-result-time-02-13-reference.png": (471, 1107, 601, 1152),
    "win-result-moves-121-reference.png": (471, 1184, 550, 1229),
}


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("source", type=Path, help="the verified 884×1920 source frame at 310 seconds")
    parser.add_argument("output_dir", type=Path)
    args = parser.parse_args()

    source_path = args.source.expanduser().resolve()
    source_bytes = source_path.read_bytes()
    source_hash = hashlib.sha256(source_bytes).hexdigest()
    if source_hash != SOURCE_PNG_SHA256:
        raise SystemExit(f"Unexpected 310-second frame hash: {source_hash}")
    with Image.open(source_path) as image:
        if image.size != FRAME_SIZE:
            raise SystemExit(f"Expected source frame {FRAME_SIZE}, got {image.size}.")
        source = np.asarray(image.convert("RGB"), dtype=np.float32)

    output_dir = args.output_dir.expanduser().resolve()
    output_dir.mkdir(parents=True, exist_ok=True)
    denominator = np.dot(FOREGROUND - BACKGROUND, FOREGROUND - BACKGROUND)
    for filename, crop in STAT_CROPS.items():
        x1, y1, x2, y2 = crop
        pixels = source[y1:y2, x1:x2]
        delta = pixels - BACKGROUND
        alpha = np.clip(np.sum(delta * (FOREGROUND - BACKGROUND), axis=2) / denominator, 0, 1)
        alpha[alpha < 0.045] = 0
        rgba = np.dstack((np.broadcast_to(FOREGROUND, pixels.shape), np.rint(alpha * 255))).astype(np.uint8)
        output = output_dir / filename
        Image.fromarray(rgba, "RGBA").save(output, optimize=True)
        digest = hashlib.sha256(output.read_bytes()).hexdigest()
        print(f"{output} {x2 - x1}×{y2 - y1} sha256={digest}")


if __name__ == "__main__":
    main()

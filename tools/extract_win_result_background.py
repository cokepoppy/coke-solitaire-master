#!/usr/bin/env python3
"""Extract the source win-screen backdrop that continues below its banner."""

from __future__ import annotations

import argparse
import hashlib
from pathlib import Path

import numpy as np
from PIL import Image


FRAME_SIZE = (884, 1920)
BRIDGE_RECT = (0, 834, 884, 987)
# The result score and optional Best badge are live UI elements rendered over
# this background bridge. Fill their source pixels so other values stay clean.
LIVE_ELEMENT_RECTS = (
    (392, 846, 659, 970),  # Score and shadow, with a clean interpolation margin
    (662, 825, 812, 970),  # Optional Best badge and shadow
)


def inpaint_smooth_region(rgb: np.ndarray, mask: np.ndarray, iterations: int = 360) -> None:
    """Harmonically extend the sampled low-frequency backdrop through masks."""
    known = ~mask
    while np.any(mask & ~known):
        padded_known = np.pad(known, ((1, 1), (1, 1)), mode="constant", constant_values=False)
        padded_rgb = np.pad(rgb, ((1, 1), (1, 1), (0, 0)), mode="edge")
        north, south = padded_known[:-2, 1:-1], padded_known[2:, 1:-1]
        west, east = padded_known[1:-1, :-2], padded_known[1:-1, 2:]
        count = north.astype(np.float32) + south + west + east
        total = (
            padded_rgb[:-2, 1:-1] * north[..., None]
            + padded_rgb[2:, 1:-1] * south[..., None]
            + padded_rgb[1:-1, :-2] * west[..., None]
            + padded_rgb[1:-1, 2:] * east[..., None]
        )
        newly_known = mask & ~known & (count > 0)
        rgb[newly_known] = total[newly_known] / count[newly_known, None]
        known[newly_known] = True

    for _ in range(iterations):
        padded = np.pad(rgb, ((1, 1), (1, 1), (0, 0)), mode="edge")
        average = (
            padded[:-2, 1:-1]
            + padded[2:, 1:-1]
            + padded[1:-1, :-2]
            + padded[1:-1, 2:]
        ) * 0.25
        rgb[mask] = average[mask]


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("source", type=Path, help="884×1920 frame at 310 seconds")
    parser.add_argument("output", type=Path, help="output 884×153 RGB PNG")
    args = parser.parse_args()

    source_path = args.source.expanduser().resolve()
    with Image.open(source_path) as image:
        if image.size != FRAME_SIZE:
            raise SystemExit(f"Expected source frame {FRAME_SIZE}, got {image.size}.")
        source = image.convert("RGB")

    x1, y1, x2, y2 = BRIDGE_RECT
    bridge = np.asarray(source.crop(BRIDGE_RECT), dtype=np.float32).copy()
    mask = np.zeros((y2 - y1, x2 - x1), dtype=bool)
    for left, top, right, bottom in LIVE_ELEMENT_RECTS:
        clipped_left, clipped_top = max(left, x1), max(top, y1)
        clipped_right, clipped_bottom = min(right, x2), min(bottom, y2)
        if clipped_left >= clipped_right or clipped_top >= clipped_bottom:
            continue
        mask[clipped_top - y1 : clipped_bottom - y1, clipped_left - x1 : clipped_right - x1] = True
    inpaint_smooth_region(bridge, mask)

    output = args.output.expanduser().resolve()
    output.parent.mkdir(parents=True, exist_ok=True)
    Image.fromarray(np.clip(np.rint(bridge), 0, 255).astype(np.uint8), "RGB").save(output, optimize=True)
    digest = hashlib.sha256(output.read_bytes()).hexdigest()
    print(f"Wrote {output} ({x2 - x1}×{y2 - y1}); sha256={digest}")


if __name__ == "__main__":
    main()

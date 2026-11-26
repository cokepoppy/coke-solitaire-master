#!/usr/bin/env python3
"""Extract the source thumbs-up badge from two audited win-streak frames."""

import argparse
import hashlib
from pathlib import Path

import numpy as np
from PIL import Image


SOURCE_SIZE = (884, 1920)
SOURCE_CROP = (534, 754, 628, 848)
SRGB_PROFILE = Path("/System/Library/ColorSync/Profiles/sRGB Profile.icc")


def read_crop(path: Path) -> np.ndarray:
    with Image.open(path) as image:
        if image.size != SOURCE_SIZE:
            raise ValueError(f"Expected {SOURCE_SIZE[0]}×{SOURCE_SIZE[1]} frame, got {image.width}×{image.height}: {path}")
        return np.asarray(image.convert("RGB").crop(SOURCE_CROP), dtype=np.float32)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("flare_frame", type=Path, help="source frame at 304.5 s; used for the clean badge matte")
    parser.add_argument("settled_frame", type=Path, help="source frame at 307 s; used for the badge without the light streak")
    parser.add_argument("output", type=Path, help="transparent PNG output path")
    args = parser.parse_args()

    flare = read_crop(args.flare_frame)
    settled = read_crop(args.settled_frame)
    _, height, _ = flare.shape

    # The 304.5 s frame has a dark felt field behind the badge. Estimate that
    # field down the crop edges to recover the badge's anti-aliased silhouette.
    top = np.median(np.concatenate([flare[:4, :8], flare[:4, -8:]], axis=1), axis=(0, 1))
    bottom = np.median(np.concatenate([flare[-4:, :8], flare[-4:, -8:]], axis=1), axis=(0, 1))
    background = np.linspace(top, bottom, height, dtype=np.float32)[:, None, :]
    distance = np.max(np.abs(flare - background), axis=2)
    matte = np.clip((distance - 8) / 70, 0, 1)

    # The 307 s frame has no horizontal flare. Its card fan is dim enough that
    # this brightness gate keeps the foreground badge while rejecting cards.
    luminance = settled[..., 0] * 0.2126 + settled[..., 1] * 0.7152 + settled[..., 2] * 0.0722
    stable_badge = np.clip((luminance - 62) / 65, 0, 1)
    alpha = np.minimum(matte, stable_badge)

    # The source's brief flare crosses the badge near its lower points. Remove
    # isolated sparkle pixels outside the badge silhouette before cropping.
    alpha[:9] = 0
    alpha[90:] = 0

    # Restore RGB against the source's dim green felt so the sprite has clean,
    # non-premultiplied edges when composited over the web game's darkened board.
    underlay = np.array([8, 25, 10], dtype=np.float32)
    rgba = np.zeros((*alpha.shape, 4), dtype=np.uint8)
    for row in range(height):
        coverage = alpha[row, :, None]
        rgb = np.where(coverage > 0.06, (settled[row] - underlay * (1 - coverage)) / np.maximum(coverage, 0.06), 0)
        rgba[row, :, :3] = np.clip(rgb, 0, 255).astype(np.uint8)
    rgba[..., 3] = np.round(alpha * 255).astype(np.uint8)

    sprite = Image.fromarray(rgba, mode="RGBA")
    bounds = sprite.getchannel("A").point(lambda value: 255 if value >= 26 else 0).getbbox()
    if bounds is None:
        raise ValueError("Could not locate the thumbs-up badge in the source crops.")
    left, top, right, bottom = bounds
    padding = 2
    sprite = sprite.crop((max(0, left - padding), max(0, top - padding), min(sprite.width, right + padding), min(sprite.height, bottom + padding)))

    if not SRGB_PROFILE.is_file():
        raise FileNotFoundError(f"Missing stable sRGB profile: {SRGB_PROFILE}")
    args.output.parent.mkdir(parents=True, exist_ok=True)
    sprite.save(args.output, optimize=True, icc_profile=SRGB_PROFILE.read_bytes())
    digest = hashlib.sha256(args.output.read_bytes()).hexdigest()
    print(f"{args.output} {sprite.width}×{sprite.height} {args.output.stat().st_size} bytes SHA-256 {digest}")


if __name__ == "__main__":
    main()

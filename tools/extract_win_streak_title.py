#!/usr/bin/env python3
"""Extract the source win-streak title as a transparent, high-density sprite."""

import argparse
import hashlib
from pathlib import Path

import numpy as np
from PIL import Image


SOURCE_SIZE = (884, 1920)
TITLE_CROP = (103, 612, 783, 738)
WHITE = np.array([255, 255, 255], dtype=np.uint8)
ORANGE = np.array([249, 146, 30], dtype=np.uint8)
SRGB_PROFILE = Path("/System/Library/ColorSync/Profiles/sRGB Profile.icc")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("source_frame", type=Path, help="the 307-second source PNG frame")
    parser.add_argument("output", type=Path, help="transparent title PNG output path")
    args = parser.parse_args()

    with Image.open(args.source_frame) as frame:
        source = frame.convert("RGB")
        if source.size != SOURCE_SIZE:
            raise ValueError(f"Expected {SOURCE_SIZE[0]}×{SOURCE_SIZE[1]} source frame, got {source.width}×{source.height}.")
        pixels = np.asarray(source.crop(TITLE_CROP), dtype=np.float32)

    red, green, blue = pixels.transpose(2, 0, 1)
    luminance = red * 0.2126 + green * 0.7152 + blue * 0.0722
    spread = np.maximum(np.maximum(red, green), blue) - np.minimum(np.minimum(red, green), blue)
    white_mask = (luminance > 100) & (spread < 85)
    orange_mask = (
        (red > 100)
        & (green > 35)
        & (blue < 90)
        & (red > green * 1.2)
        & (green > blue * 1.2)
    )

    white_alpha = np.where(white_mask, np.clip((luminance - 100) / 85, 0, 1), 0)
    orange_alpha = np.where(orange_mask, np.clip((red - blue - 25) / 190, 0, 1), 0)
    use_orange = orange_alpha > white_alpha
    alpha = np.maximum(white_alpha, orange_alpha)

    rgba = np.zeros((*alpha.shape, 4), dtype=np.uint8)
    rgba[..., :3] = np.where(use_orange[..., None], ORANGE, WHITE)
    rgba[..., 3] = np.round(alpha * 255).astype(np.uint8)

    args.output.parent.mkdir(parents=True, exist_ok=True)
    if not SRGB_PROFILE.is_file():
        raise FileNotFoundError(f"Missing stable sRGB profile: {SRGB_PROFILE}")
    Image.fromarray(rgba, mode="RGBA").save(
        args.output,
        optimize=True,
        icc_profile=SRGB_PROFILE.read_bytes(),
    )
    digest = hashlib.sha256(args.output.read_bytes()).hexdigest()
    print(f"{args.output} {args.output.stat().st_size} bytes SHA-256 {digest}")


if __name__ == "__main__":
    main()

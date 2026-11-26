#!/usr/bin/env python3
"""Extract the crown and title sprites from the source result transition."""

import argparse
import hashlib
from pathlib import Path

import numpy as np
from PIL import Image


SOURCE_SIZE = (884, 1920)
SRGB_PROFILE = Path("/System/Library/ColorSync/Profiles/sRGB Profile.icc")
SPRITES = {
    "crown": {
        "crop": (320, 60, 564, 230),
        "background": np.array([3, 30, 30], dtype=np.float32),
        "transparent_below": 18,
        "opaque_above": 46,
        "filename": "win-result-crown-intro-reference.png",
    },
    "title": {
        "crop": (0, 520, 884, 730),
        "background": np.array([1, 12, 25], dtype=np.float32),
        "transparent_below": 4,
        "opaque_above": 12,
        "filename": "win-result-title-intro-reference.png",
    },
}


def extract(frame_path: Path, output_dir: Path, settings: dict) -> Path:
    with Image.open(frame_path) as frame:
        source = frame.convert("RGB")
        if source.size != SOURCE_SIZE:
            raise ValueError(f"Expected {SOURCE_SIZE[0]}×{SOURCE_SIZE[1]} frame, got {source.width}×{source.height}.")
        pixels = np.asarray(source.crop(settings["crop"]), dtype=np.float32)

    distance = np.max(np.abs(pixels - settings["background"]), axis=2)
    alpha = np.clip(
        (distance - settings["transparent_below"])
        / (settings["opaque_above"] - settings["transparent_below"]),
        0,
        1,
    )
    rgba = np.empty((*alpha.shape, 4), dtype=np.uint8)
    rgba[..., :3] = np.asarray(pixels, dtype=np.uint8)
    rgba[..., 3] = np.round(alpha * 255).astype(np.uint8)

    output = output_dir / settings["filename"]
    output.parent.mkdir(parents=True, exist_ok=True)
    if not SRGB_PROFILE.is_file():
        raise FileNotFoundError(f"Missing stable sRGB profile: {SRGB_PROFILE}")
    Image.fromarray(rgba, mode="RGBA").save(output, optimize=True, icc_profile=SRGB_PROFILE.read_bytes())
    digest = hashlib.sha256(output.read_bytes()).hexdigest()
    print(f"{output} {output.stat().st_size} bytes SHA-256 {digest}")
    return output


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("crown_frame", type=Path, help="the 307.8-second source frame")
    parser.add_argument("title_frame", type=Path, help="the 308.0-second source frame")
    parser.add_argument("output_dir", type=Path, help="directory for the two transparent sprites")
    args = parser.parse_args()
    extract(args.crown_frame, args.output_dir, SPRITES["crown"])
    extract(args.title_frame, args.output_dir, SPRITES["title"])


if __name__ == "__main__":
    main()

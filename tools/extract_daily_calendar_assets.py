#!/usr/bin/env python3
"""Crop the daily calendar controls and reward art from the official store screenshot."""

import argparse
from pathlib import Path

from PIL import Image, ImageCms


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("source", type=Path)
    parser.add_argument("output", nargs="?", type=Path, default=Path("assets/ui"))
    args = parser.parse_args()

    image = Image.open(args.source).convert("RGB")
    profile = ImageCms.ImageCmsProfile(ImageCms.createProfile("sRGB")).tobytes()
    crops = {
        "daily-reward-crown-reference.png": (84, 462, 123, 504),
        "daily-reward-bronze-reference.png": (140, 458, 180, 504),
        "daily-reward-silver-reference.png": (190, 458, 229, 504),
        "daily-reward-gold-reference.png": (244, 458, 285, 504),
        "daily-calendar-completed-crown-reference.png": (147, 326, 171, 350),
        "daily-calendar-play-reference.png": (96, 545, 238, 584),
        "daily-calendar-rewards-button-reference.png": (243, 543, 291, 585),
    }
    args.output.mkdir(parents=True, exist_ok=True)
    for name, bounds in crops.items():
        target = args.output / name
        image.crop(bounds).save(target, format="PNG", icc_profile=profile)
        print(f"{target}: {bounds[2] - bounds[0]}x{bounds[3] - bounds[1]}")


if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""Compare the neutral card fan in a source frame and a web screenshot."""

import argparse
import json

import numpy as np
from PIL import Image


def source_at_viewport(path: str, width: int, height: int) -> np.ndarray:
    image = Image.open(path).convert("RGB")
    scaled_height = round(image.height * width / image.width)
    image = image.resize((width, scaled_height), Image.Resampling.LANCZOS)
    if scaled_height < height:
        raise ValueError("The resized source frame is shorter than the web viewport.")
    return np.asarray(image.crop((0, 0, width, height)), dtype=np.float32) / 255


def rgb(path: str, width: int, height: int) -> np.ndarray:
    image = Image.open(path).convert("RGB")
    if image.size != (width, height):
        raise ValueError(f"Web screenshot must be {width}x{height}, got {image.width}x{image.height}.")
    return np.asarray(image, dtype=np.float32) / 255


def neutral_card_mask(image: np.ndarray, top: int, bottom: int, *, exclude_fixed_overlays: bool = False) -> np.ndarray:
    region = image[top:bottom]
    mask = (region.mean(axis=2) > 0.18) & ((region.max(axis=2) - region.min(axis=2)) < 0.20)
    if exclude_fixed_overlays:
        # The title and reward sit above the fan in both captures. Exclude their
        # shared area so the score reflects only the scattered-card silhouette.
        overlay_top = max(270, top) - top
        overlay_bottom = min(400, bottom) - top
        if overlay_bottom > overlay_top:
            mask[overlay_top:overlay_bottom, 42:350] = False
    return mask


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("source_frame")
    parser.add_argument("web_screenshot")
    parser.add_argument("--width", type=int, default=390)
    parser.add_argument("--height", type=int, default=844)
    parser.add_argument("--top", type=int, default=320)
    parser.add_argument("--bottom", type=int, default=680)
    parser.add_argument(
        "--exclude-fixed-overlays",
        action="store_true",
        help="exclude the shared title/reward overlay rectangle from the neutral-card mask",
    )
    args = parser.parse_args()

    source = source_at_viewport(args.source_frame, args.width, args.height)
    web = rgb(args.web_screenshot, args.width, args.height)
    source_mask = neutral_card_mask(source, args.top, args.bottom, exclude_fixed_overlays=args.exclude_fixed_overlays)
    web_mask = neutral_card_mask(web, args.top, args.bottom, exclude_fixed_overlays=args.exclude_fixed_overlays)
    union = source_mask | web_mask
    intersection = source_mask & web_mask
    difference = np.abs(source[args.top:args.bottom] - web[args.top:args.bottom])
    ys, xs = np.where(web_mask)
    bbox = None if not len(xs) else [int(xs.min()), int(ys.min() + args.top), int(xs.max()), int(ys.max() + args.top)]
    print(json.dumps({
        "viewport": [args.width, args.height],
        "roiY": [args.top, args.bottom],
        "excludedFixedOverlayRect": [42, 270, 350, 400] if args.exclude_fixed_overlays else None,
        "sourceNeutralPixels": int(source_mask.sum()),
        "webNeutralPixels": int(web_mask.sum()),
        "maskIoU": round(float(intersection.sum() / union.sum()), 4) if union.any() else 1.0,
        "sourceMaskRgbMae": round(float(difference[source_mask].mean()), 4) if source_mask.any() else 0.0,
        "unionMaskRgbMae": round(float(difference[union].mean()), 4) if union.any() else 0.0,
        "webMaskBounds": bbox,
    }, indent=2))


if __name__ == "__main__":
    main()

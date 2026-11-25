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


def neutral_card_mask(image: np.ndarray, top: int, bottom: int) -> np.ndarray:
    region = image[top:bottom]
    return (region.mean(axis=2) > 0.18) & ((region.max(axis=2) - region.min(axis=2)) < 0.20)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("source_frame")
    parser.add_argument("web_screenshot")
    parser.add_argument("--width", type=int, default=390)
    parser.add_argument("--height", type=int, default=844)
    parser.add_argument("--top", type=int, default=320)
    parser.add_argument("--bottom", type=int, default=680)
    args = parser.parse_args()

    source = source_at_viewport(args.source_frame, args.width, args.height)
    web = rgb(args.web_screenshot, args.width, args.height)
    source_mask = neutral_card_mask(source, args.top, args.bottom)
    web_mask = neutral_card_mask(web, args.top, args.bottom)
    union = source_mask | web_mask
    intersection = source_mask & web_mask
    difference = np.abs(source[args.top:args.bottom] - web[args.top:args.bottom])
    ys, xs = np.where(web_mask)
    bbox = None if not len(xs) else [int(xs.min()), int(ys.min() + args.top), int(xs.max()), int(ys.max() + args.top)]
    print(json.dumps({
        "viewport": [args.width, args.height],
        "roiY": [args.top, args.bottom],
        "sourceNeutralPixels": int(source_mask.sum()),
        "webNeutralPixels": int(web_mask.sum()),
        "maskIoU": round(float(intersection.sum() / union.sum()), 4) if union.any() else 1.0,
        "sourceMaskRgbMae": round(float(difference[source_mask].mean()), 4) if source_mask.any() else 0.0,
        "unionMaskRgbMae": round(float(difference[union].mean()), 4) if union.any() else 0.0,
        "webMaskBounds": bbox,
    }, indent=2))


if __name__ == "__main__":
    main()

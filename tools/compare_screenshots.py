#!/usr/bin/env python3
"""Compare a rendered game screenshot to a source frame without rescaling."""

from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path

from PIL import Image, ImageChops, ImageDraw, ImageStat


def digest(path: Path) -> str:
    value = hashlib.sha256()
    with path.open("rb") as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b""):
            value.update(block)
    return value.hexdigest()


def named_rect(value: str) -> tuple[str, tuple[int, int, int, int]]:
    try:
        name, coordinates = value.split("=", 1)
        x, y, width, height = (int(part) for part in coordinates.split(","))
    except (ValueError, TypeError) as error:
        raise argparse.ArgumentTypeError("expected NAME=X,Y,WIDTH,HEIGHT") from error
    if not name or width <= 0 or height <= 0:
        raise argparse.ArgumentTypeError("rectangle needs a name and positive dimensions")
    return name, (x, y, x + width, y + height)


def validate_rect(rect: tuple[int, int, int, int], size: tuple[int, int]) -> None:
    left, top, right, bottom = rect
    if left < 0 or top < 0 or right > size[0] or bottom > size[1]:
        raise ValueError(f"Rectangle {rect} is outside image bounds {size}.")


def metrics(diff: Image.Image) -> dict[str, float | int]:
    channels = ImageStat.Stat(diff).mean
    black_pixels = sum(1 for pixel in diff.get_flattened_data() if pixel == (0, 0, 0))
    pixel_count = diff.width * diff.height
    return {
        "mean_absolute_rgb_error": round(sum(channels) / 3, 6),
        "exact_rgb_pixel_fraction": round(black_pixels / pixel_count, 8),
        "pixel_count": pixel_count,
    }


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("reference", type=Path, help="source frame image")
    parser.add_argument("rendered", type=Path, help="browser screenshot image")
    parser.add_argument("--output", type=Path, required=True, help="JSON report path")
    parser.add_argument("--ignore", type=named_rect, action="append", default=[], metavar="NAME=X,Y,W,H", help="source-only screen area excluded from pixel error")
    parser.add_argument("--region", type=named_rect, action="append", default=[], metavar="NAME=X,Y,W,H", help="named area to report separately")
    args = parser.parse_args()

    reference_path = args.reference.expanduser().resolve()
    rendered_path = args.rendered.expanduser().resolve()
    with Image.open(reference_path) as source:
        reference = source.convert("RGB")
    with Image.open(rendered_path) as source:
        rendered = source.convert("RGB")
    if reference.size != rendered.size:
        raise SystemExit(f"Image dimensions differ: reference {reference.size}, rendered {rendered.size}; rescaling is disabled.")

    for _, rect in [*args.ignore, *args.region]:
        validate_rect(rect, reference.size)

    difference = ImageChops.difference(reference, rendered)
    masked = difference.copy()
    draw = ImageDraw.Draw(masked)
    for _, rect in args.ignore:
        draw.rectangle(rect, fill=(0, 0, 0))

    report = {
        "dimensions": {"width": reference.width, "height": reference.height},
        "reference": {"path": reference_path.name, "sha256": digest(reference_path)},
        "rendered": {"path": rendered_path.name, "sha256": digest(rendered_path)},
        "comparison": {
            "rescaled": False,
            "ignored_rectangles": [{"name": name, "x": rect[0], "y": rect[1], "width": rect[2] - rect[0], "height": rect[3] - rect[1]} for name, rect in args.ignore],
            "all_pixels": metrics(difference),
            "after_ignored_rectangles": metrics(masked),
            "regions": {name: metrics(difference.crop(rect)) for name, rect in args.region},
            "note": "Encoded-source video compression and browser rasterization contribute to pixel error; compare spatial error maps and known OS-only regions as well as the aggregate value.",
        },
    }
    args.output.expanduser().resolve().parent.mkdir(parents=True, exist_ok=True)
    args.output.expanduser().resolve().write_text(json.dumps(report, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(json.dumps(report["comparison"], indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()

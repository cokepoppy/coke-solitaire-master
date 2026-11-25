#!/usr/bin/env python3
"""Extract the fully visible background previews from the 323s source frame."""

from __future__ import annotations

import argparse
from pathlib import Path

from PIL import Image


# Crop only the artwork inside each source tile's outline. Coordinates are in
# the original 884x1920 video frame at PTS 4,961,280 (323 seconds).
PREVIEW_CROPS = {
    "lagoon": (112, 493, 410, 610),
    "emerald": (472, 493, 776, 610),
    "mountain": (112, 680, 410, 978),
    "felt": (475, 683, 773, 976),
    "midnight": (112, 1047, 410, 1345),
    "plum": (472, 1047, 776, 1345),
    "forest": (112, 1416, 410, 1714),
    "violet": (472, 1416, 776, 1714),
}


def remove_felt_selection_badge(tile: Image.Image) -> Image.Image:
    """Restore the smooth radial felt under the source's green check badge.

    The source's felt swatch is the only selected background in this frame.
    Its gradient is horizontally symmetric, so mirror the unobstructed left
    side over the small bottom-right check badge. The selected outline was
    excluded from the crop itself.
    """
    pixels = tile.load()
    center_x = (tile.width - 1) / 2
    start_x = tile.width - 55
    start_y = tile.height - 51
    for y in range(start_y, tile.height):
        for x in range(start_x, tile.width):
            mirror_x = round(2 * center_x - x)
            mirror_x = min(tile.width - 1, max(0, mirror_x))
            pixels[x, y] = pixels[mirror_x, y]
    return tile


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("source_frame", type=Path)
    parser.add_argument("output_dir", type=Path, nargs="?", default=Path("assets/themes"))
    args = parser.parse_args()

    source = Image.open(args.source_frame).convert("RGB")
    if source.size != (884, 1920):
        raise SystemExit(f"expected an 884x1920 source frame, got {source.size}")
    args.output_dir.mkdir(parents=True, exist_ok=True)

    for theme, bounds in PREVIEW_CROPS.items():
        tile = source.crop(bounds)
        if theme == "felt":
            tile = remove_felt_selection_badge(tile)
        output = args.output_dir / f"theme-background-{theme}-reference.png"
        tile.save(output, optimize=True)
        print(f"{output}: {tile.width}x{tile.height}")


if __name__ == "__main__":
    main()

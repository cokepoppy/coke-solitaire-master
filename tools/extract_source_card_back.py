#!/usr/bin/env python3
"""Crop the default Solitaire Master stock card back from the audited 10 s frame."""

from pathlib import Path

from PIL import Image, ImageChops, ImageFilter


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "research" / "solitaire-master" / "gameplay-opening-2025" / "keyframes" / "target-pts-153600.png"
SOURCE_OUTPUT = ROOT / "assets" / "cards" / "back-solitaire-master-source.png"
OUTPUT = ROOT / "assets" / "cards" / "back-solitaire-master-reference.png"
SOURCE_RECT = (758, 429, 876, 606)


def main() -> None:
    frame = Image.open(SOURCE).convert("RGB")
    source_crop = frame.crop(SOURCE_RECT)
    if source_crop.size != (118, 177):
        raise ValueError(f"Unexpected card back crop size: {source_crop.size}")
    source_crop.save(SOURCE_OUTPUT)
    crop = source_crop.convert("RGBA")

    # The source stock counter is overlaid on the back at the lower-left. Clear
    # just its bright glyphs so the live counter can be rendered above the crop.
    mask = Image.new("L", crop.size, 0)
    source_pixels = crop.convert("RGB").load()
    mask_pixels = mask.load()
    for y in range(145, 171):
        for x in range(4, 42):
            red, green, blue = source_pixels[x, y]
            if min(red, green, blue) > 180:
                mask_pixels[x, y] = 255
    mask = mask.filter(ImageFilter.MaxFilter(5))
    crop.putalpha(ImageChops.subtract(crop.getchannel("A"), mask))
    crop.save(OUTPUT)


if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""Crop the default Solitaire Master stock card back from the audited 10 s frame."""

from pathlib import Path

from PIL import Image, ImageChops, ImageDraw


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

    # The source stock counter and its translucent badge are overlaid on the
    # back at the lower-left. Clear that small area so the vector underlay can
    # restore the pattern on tableau cards and in gallery previews.
    mask = Image.new("L", crop.size, 0)
    ImageDraw.Draw(mask).rectangle((4, 144, 46, 171), fill=255)
    crop.putalpha(ImageChops.subtract(crop.getchannel("A"), mask))
    crop.save(OUTPUT)


if __name__ == "__main__":
    main()

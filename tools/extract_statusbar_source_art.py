#!/usr/bin/env python3
"""Extract the menu, score crown, and move glyphs from the source 20s frame."""

from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "research" / "solitaire-master" / "gameplay-opening-2025" / "keyframes" / "target-pts-307200.png"
OUTPUT = ROOT / "assets" / "ui"


def color_glyph(frame: Image.Image, box: tuple[int, int, int, int], metric, threshold: float, span: float, filename: str) -> None:
    crop = frame.crop(box).convert("RGB")
    pixels = []
    for red, green, blue in crop.get_flattened_data():
        alpha = max(0, min(255, round((metric(red, green, blue) - threshold) * 255 / span)))
        pixels.append((red, green, blue, alpha))
    image = Image.new("RGBA", crop.size)
    image.putdata(pixels)
    image.save(OUTPUT / filename)


def main() -> None:
    OUTPUT.mkdir(parents=True, exist_ok=True)
    frame = Image.open(SOURCE).convert("RGB")
    # The menu crop includes its complete captured circle. Its felt surround
    # matches the default table and remains hidden on alternate backgrounds.
    frame.crop((25, 303, 97, 377)).save(OUTPUT / "menu-source.png")
    color_glyph(frame, (119, 317, 171, 357), lambda r, g, b: min(r, g) - b, 12, 118, "stat-crown.png")
    color_glyph(frame, (653, 316, 687, 358), lambda r, g, b: min(r, g, b), 24, 80, "stat-moves.png")


if __name__ == "__main__":
    main()

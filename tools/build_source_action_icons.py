#!/usr/bin/env python3
"""Extract transparent action glyphs from the audited Solitaire Master frames."""

from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
REVIEW = ROOT / "research" / "solitaire-master" / "gameplay-opening-2025" / "keyframes"
DESTINATION = ROOT / "assets" / "ui"


def white_glyph(frame: Image.Image, box: tuple[int, int, int, int], center: tuple[int, int], filename: str) -> None:
    crop = frame.crop(box)
    center_x, center_y = center
    pixels = []
    for index, (red, green, blue) in enumerate(crop.get_flattened_data()):
        x, y = index % crop.width, index // crop.width
        alpha = max(0, min(255, round((min(red, green, blue) - 22) * 255 / 218)))
        if (x - center_x) ** 2 + (y - center_y) ** 2 > 47**2:
            alpha = 0
        pixels.append((255, 255, 255, alpha))
    image = Image.new("RGBA", crop.size)
    image.putdata(pixels)
    image.save(DESTINATION / filename)


def play_glyph(frame: Image.Image) -> None:
    crop = frame.crop((51, 1707, 126, 1778))
    pixels = []
    for red, _green, _blue in crop.get_flattened_data():
        alpha = max(0, min(255, round((247 - red) * 255 / 220)))
        pixels.append((15, 113, 67, alpha))
    image = Image.new("RGBA", crop.size)
    image.putdata(pixels)
    image.save(DESTINATION / "action-play-plus.png")


def main() -> None:
    DESTINATION.mkdir(parents=True, exist_ok=True)
    frame10 = Image.open(REVIEW / "target-pts-153600.png").convert("RGB")
    frame20 = Image.open(REVIEW / "target-pts-307200.png").convert("RGB")
    frame10.crop((20, 1660, 864, 1884)).save(DESTINATION / "action-row-initial-reference.png")
    frame20.crop((20, 1660, 864, 1884)).save(DESTINATION / "action-row-used-reference.png")
    play_glyph(frame10)
    white_glyph(frame10, (441, 1720, 530, 1792), (44, 25), "action-magic.png")
    white_glyph(frame10, (596, 1705, 685, 1795), (42, 40), "action-hint.png")
    white_glyph(frame20, (748, 1705, 834, 1795), (46, 40), "action-undo.png")


if __name__ == "__main__":
    main()

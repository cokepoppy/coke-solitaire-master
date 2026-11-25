#!/usr/bin/env python3
"""Extract the source timer frame and remove its fixed digits."""

from math import hypot
from pathlib import Path
from statistics import median

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "research" / "solitaire-master" / "gameplay-opening-2025" / "keyframes" / "target-pts-153600.png"
OUTPUT = ROOT / "assets" / "ui" / "timer-frame-source.png"
SOURCE_RECT = (320, 290, 640, 390)
FELT = (11, 115, 63)
TEXT_RECT = (96, 29, 214, 71)
PANEL_SAMPLE_LEFT = range(34, 63)
PANEL_SAMPLE_RIGHT = range(183, 213)


def main() -> None:
    frame = Image.open(SOURCE).convert("RGB").crop(SOURCE_RECT)
    pixels = frame.load()
    width, height = frame.size

    # The source text changes every second. Fill only the flat center panel,
    # sampling each row on both sides of the text to retain its shading.
    x0, y0, x1, y1 = TEXT_RECT
    for y in range(y0, y1):
        samples = [pixels[x, y] for x in (*PANEL_SAMPLE_LEFT, *PANEL_SAMPLE_RIGHT)]
        fill = tuple(round(median(color[channel] for color in samples)) for channel in range(3))
        for x in range(x0, x1):
            pixels[x, y] = fill

    rgba = frame.convert("RGBA")
    pixels = rgba.load()
    for y in range(height):
        for x in range(width):
            red, green, blue, _ = pixels[x, y]
            distance = hypot(red - FELT[0], green - FELT[1], blue - FELT[2])
            alpha = max(0, min(255, round((distance - 7) * 255 / 24)))
            pixels[x, y] = (red, green, blue, alpha)

    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    rgba.save(OUTPUT)


if __name__ == "__main__":
    main()

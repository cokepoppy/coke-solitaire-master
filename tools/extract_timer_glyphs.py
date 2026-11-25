#!/usr/bin/env python3
"""Build transparent timer numeral sprites from audited Solitaire Master frames."""

import argparse
from pathlib import Path

from PIL import Image


# Requested source second and character slot in the observed MM:SS string.
SAMPLES = {
    "0": (10, 0),
    "1": (30, 3),
    "2": (15, 4),
    "3": (43, 3),
    "4": (380, 3),
    "5": (370, 4),
    "6": (19, 4),
    "7": (20, 4),
    "8": (525, 4),
    "9": (695, 4),
    ":": (20, 2),
}
SLOT_X = (110, 134, 159, 167, 192)
SLOT_WIDTH = (21, 21, 4, 21, 21)
TEXT_Y = 34
TEXT_HEIGHT = 31


def timer_frame(directories: list[Path], timestamp: int) -> Image.Image:
    prefix = f"time-{timestamp:07.3f}-actual-"
    matches = sorted(frame for directory in directories for frame in directory.glob(f"{prefix}*.png"))
    if not matches:
        raise FileNotFoundError(f"Expected a frame for source time {timestamp}s in {directories}")
    if any(frame.read_bytes() != matches[0].read_bytes() for frame in matches[1:]):
        raise ValueError(f"Duplicate source frames for {timestamp}s differ: {matches}")
    image = Image.open(matches[0]).convert("RGB")
    if image.size != (320, 100):
        raise ValueError(f"{matches[0]} has size {image.size}, expected 320×100")
    return image


def alpha_for_pixel(foreground: tuple[int, int, int], background: tuple[int, int, int]) -> int:
    direction = tuple(255 - value for value in background)
    difference = tuple(foreground[index] - background[index] for index in range(3))
    denominator = sum(value * value for value in direction)
    alpha = max(0.0, min(1.0, sum(difference[index] * direction[index] for index in range(3)) / denominator))
    if alpha < 0.035:
        return 0
    return round(alpha * 255)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("frames", type=Path, nargs="+", help="one or more timer-crop directories produced by extract_timer_frames.swift")
    parser.add_argument("--base", type=Path, default=Path("assets/ui/timer-frame-source.png"))
    parser.add_argument("--output", type=Path, default=Path("assets/ui"))
    args = parser.parse_args()

    base = Image.open(args.base).convert("RGBA")
    if base.size != (320, 100):
        raise ValueError(f"{args.base} has size {base.size}, expected 320×100")
    args.output.mkdir(parents=True, exist_ok=True)

    for glyph, (timestamp, slot) in SAMPLES.items():
        source = timer_frame(args.frames, timestamp)
        x, width = SLOT_X[slot], SLOT_WIDTH[slot]
        sprite = Image.new("RGBA", (width, TEXT_HEIGHT), (255, 255, 255, 0))
        pixels = sprite.load()
        for sprite_y in range(TEXT_HEIGHT):
            y = TEXT_Y + sprite_y
            for sprite_x in range(width):
                source_rgb = source.getpixel((x + sprite_x, y))
                base_rgba = base.getpixel((x + sprite_x, y))
                alpha = alpha_for_pixel(source_rgb, base_rgba[:3])
                pixels[sprite_x, sprite_y] = (255, 255, 255, alpha)
        filename = "timer-colon.png" if glyph == ":" else f"timer-digit-{glyph}.png"
        sprite.save(args.output / filename, optimize=True)


if __name__ == "__main__":
    main()

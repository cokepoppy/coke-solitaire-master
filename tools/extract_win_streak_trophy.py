#!/usr/bin/env python3
"""Remove the sampled navy result background from the captured trophy sprite."""

import argparse
from pathlib import Path

from PIL import Image


BACKGROUND = (1, 12, 25)
KEY_START = 3
KEY_END = 36


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("source", type=Path, help="the cropped win-trophy-reference.png sprite")
    parser.add_argument("output", type=Path, help="transparent PNG output path")
    args = parser.parse_args()

    with Image.open(args.source) as source:
        pixels = []
        for red, green, blue, _ in source.convert("RGBA").getdata():
            distance = max(abs(red - BACKGROUND[0]), abs(green - BACKGROUND[1]), abs(blue - BACKGROUND[2]))
            alpha = max(0.0, min(1.0, (distance - KEY_START) / (KEY_END - KEY_START)))
            if alpha < 0.025:
                pixels.append((0, 0, 0, 0))
                continue
            unpremultiplied = tuple(
                max(0, min(255, round((value - background * (1 - alpha)) / alpha)))
                for value, background in zip((red, green, blue), BACKGROUND)
            )
            pixels.append((*unpremultiplied, round(alpha * 255)))

        output = Image.new("RGBA", source.size)
        output.putdata(pixels)
        args.output.parent.mkdir(parents=True, exist_ok=True)
        output.save(args.output, optimize=True)
    print(f"{args.output} {args.output.stat().st_size} bytes")


if __name__ == "__main__":
    main()

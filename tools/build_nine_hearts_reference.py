#!/usr/bin/env python3
"""Build a source-style 9♥ face from matching Solitaire Master card captures."""

from collections import deque
from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
CARDS = ROOT / "assets" / "cards"


def red_alpha(pixel: tuple[int, int, int]) -> int:
    strength = pixel[0] - max(pixel[1], pixel[2]) - 5
    return max(0, min(255, round(strength * 255 / 82)))


def pip_sprite(source: Image.Image, box: tuple[int, int, int, int]) -> Image.Image:
    crop = source.crop(box).convert("RGBA")
    crop.putalpha(Image.new("L", crop.size))
    alpha = Image.new("L", crop.size)
    alpha.putdata([red_alpha(pixel) for pixel in source.crop(box).convert("RGB").get_flattened_data()])
    crop.putalpha(alpha)
    return crop


def erase_pip(image: Image.Image, box: tuple[int, int, int, int]) -> None:
    left, top, right, bottom = box
    width, height = right - left, bottom - top
    pixels = image.load()
    masked = [[red_alpha(pixels[left + x, top + y]) > 12 for x in range(width)] for y in range(height)]
    expanded = [row[:] for row in masked]
    for y in range(height):
        for x in range(width):
            if masked[y][x]:
                for yy in range(max(0, y - 1), min(height, y + 2)):
                    for xx in range(max(0, x - 1), min(width, x + 2)):
                        expanded[yy][xx] = True

    # Nearest-background fill removes the diamond while preserving the captured
    # card's local paper and compression texture around its replacement pip.
    nearest: list[list[tuple[int, int, int] | None]] = [[None] * width for _ in range(height)]
    queue: deque[tuple[int, int]] = deque()
    for y in range(height):
        for x in range(width):
            if not expanded[y][x]:
                nearest[y][x] = pixels[left + x, top + y]
                queue.append((x, y))
    while queue:
        x, y = queue.popleft()
        for nx, ny in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)):
            if 0 <= nx < width and 0 <= ny < height and nearest[ny][nx] is None:
                nearest[ny][nx] = nearest[y][x]
                queue.append((nx, ny))
    for y in range(height):
        for x in range(width):
            if expanded[y][x]:
                pixels[left + x, top + y] = nearest[y][x]


def main() -> None:
    nine_diamonds = Image.open(CARDS / "9-of-diamonds-reference.png").convert("RGB")
    five_hearts = Image.open(CARDS / "5-of-hearts-reference.png").convert("RGB")
    result = nine_diamonds.copy()
    replacements = (
        ((72, 11, 112, 55), (77, 8, 110, 40), (77, 8)),
        ((16, 72, 101, 169), (20, 88, 96, 164), (20, 88)),
    )
    for erase_box, source_box, target in replacements:
        erase_pip(result, erase_box)
        sprite = pip_sprite(five_hearts, source_box)
        result.paste(sprite, target, sprite)
    result.save(CARDS / "9-of-hearts-reference.png")


if __name__ == "__main__":
    main()

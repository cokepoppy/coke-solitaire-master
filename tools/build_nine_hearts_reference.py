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

    # The 243-second gameplay frame shows an unobstructed top 80px of the
    # 9♥ before the next tableau card overlaps it. Prefer those source pixels
    # for its rank, corner pip, frame, and paper texture.
    source_top = Image.open(CARDS / "9-of-hearts-source-top.png").convert("RGB")
    if source_top.size != (118, 80):
        raise ValueError(f"Expected an unoccluded 118×80 source strip, got {source_top.size}.")
    reconstructed = result.copy()
    result.paste(source_top, (0, 0))
    # Blend only the paper texture at the cut edge; keep red source ink intact.
    blend_start, blend_end = 50, 80
    source_band = source_top.crop((0, blend_start, 118, blend_end))
    base_band = reconstructed.crop((0, blend_start, 118, blend_end))
    mask = Image.new("L", (118, blend_end - blend_start))
    source_pixels = source_band.load()
    mask_pixels = mask.load()
    for y in range(blend_end - blend_start):
        row_alpha = round(255 * (blend_end - blend_start - 1 - y) / (blend_end - blend_start - 1))
        for x in range(118):
            red, green, blue = source_pixels[x, y]
            mask_pixels[x, y] = 255 if red > green * 1.12 and red > blue * 1.12 and red > 100 else row_alpha
    result.paste(Image.composite(source_band, base_band, mask), (0, blend_start))
    result.save(CARDS / "9-of-hearts-reference.png")


if __name__ == "__main__":
    main()

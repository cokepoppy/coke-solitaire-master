#!/usr/bin/env python3
"""Extract the 24-card stock back from the exact 20 s source frame."""

from pathlib import Path
import subprocess

from PIL import Image, ImageChops


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "research" / "solitaire-master" / "gameplay-opening-2025" / "keyframes" / "target-pts-307200.png"
OUTPUT = ROOT / "assets" / "cards" / "back-solitaire-master-source-20s.png"
SOURCE_RECT = (758, 429, 876, 606)
SRGB_PROFILE = "/System/Library/ColorSync/Profiles/sRGB Profile.icc"


def main() -> None:
    with Image.open(SOURCE) as frame:
        if frame.size != (884, 1920):
            raise SystemExit(f"expected an 884x1920 source frame, got {frame.size}")
        crop = frame.convert("RGB").crop(SOURCE_RECT)

    if crop.size != (118, 177):
        raise SystemExit(f"unexpected stock back size: {crop.size}")
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    crop.save(OUTPUT)
    subprocess.run(["sips", "-e", SRGB_PROFILE, str(OUTPUT)], check=True, capture_output=True, text=True)

    with Image.open(OUTPUT) as saved:
        if ImageChops.difference(crop, saved.convert("RGB")).getbbox():
            raise SystemExit("sRGB tagging changed the source crop's RGB values")
    print(f"Saved exact 118x177 source crop to {OUTPUT}")


if __name__ == "__main__":
    main()

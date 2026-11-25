#!/usr/bin/env python3
"""Crop the source-matched win-result sprites from the audited 310 s frame."""

import argparse
import hashlib
from pathlib import Path

from PIL import Image


ASSETS = {
    "win-banner-reference.png": (0, 260, 884, 834),
    "win-best-reference.png": (678, 838, 795, 956),
    "win-trophy-reference.png": (372, 1288, 450, 1374),
    "win-new-deal-reference.png": (154, 1408, 730, 1538),
}


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("frame", type=Path, help="the 884x1920 PNG at source PTS 4761600")
    parser.add_argument("output_dir", type=Path)
    args = parser.parse_args()

    with Image.open(args.frame) as frame:
        if frame.size != (884, 1920):
            raise SystemExit(f"Expected an 884x1920 frame, got {frame.width}x{frame.height}")
        args.output_dir.mkdir(parents=True, exist_ok=True)
        for filename, box in ASSETS.items():
            output = args.output_dir / filename
            frame.crop(box).save(output, optimize=True)
            print(f"{output} {sha256(output)}")


if __name__ == "__main__":
    main()

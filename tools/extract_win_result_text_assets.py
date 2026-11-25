#!/usr/bin/env python3
"""Extract fixed result-screen labels at native source resolution."""

import argparse
import hashlib
from pathlib import Path

from PIL import Image, ImageCms


ASSETS = {
    "win-result-score-label-reference.png": (190, 880, 374, 950),
    "win-result-percent-reference.png": (35, 987, 845, 1068),
    "win-result-time-label-reference.png": (270, 1092, 418, 1160),
    "win-result-moves-label-reference.png": (242, 1172, 416, 1233),
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
        profile = ImageCms.ImageCmsProfile(ImageCms.createProfile("sRGB")).tobytes()
        args.output_dir.mkdir(parents=True, exist_ok=True)
        for filename, box in ASSETS.items():
            output = args.output_dir / filename
            frame.crop(box).save(output, optimize=True, icc_profile=profile)
            print(f"{output} {sha256(output)}")


if __name__ == "__main__":
    main()

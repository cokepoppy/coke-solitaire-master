#!/usr/bin/env python3
"""Crop the source tutorial bubble from a 760x390 review frame."""

from __future__ import annotations

import argparse
import struct
from pathlib import Path

from PIL import Image, ImageCms


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("frame_png", type=Path, help="760x390 crop at source origin (60,1300)")
    parser.add_argument("--output", type=Path, default=Path("assets/ui/tutorial-tip-reference.png"))
    args = parser.parse_args()

    source = Image.open(args.frame_png)
    if source.size != (760, 390):
        parser.error(f"expected a 760x390 review crop, got {source.width}x{source.height}")
    asset = source.crop((31, 85, 733, 308))
    profile = bytearray(ImageCms.ImageCmsProfile(ImageCms.createProfile("sRGB")).tobytes())
    # LittleCMS stamps the current time into newly generated profiles. Normalize
    # the ICC creation date so rebuilding this source crop is byte-for-byte stable.
    profile[24:36] = struct.pack(">6H", 2020, 1, 1, 0, 0, 0)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    asset.save(args.output, icc_profile=bytes(profile))
    print(f"Wrote {asset.width}x{asset.height} source tutorial art to {args.output}")


if __name__ == "__main__":
    main()

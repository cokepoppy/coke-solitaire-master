#!/usr/bin/env python3
"""Cut out a short reward animation by differencing its video frames from a clean felt frame."""

import argparse
import json
from pathlib import Path

import numpy as np
from PIL import Image


def cutout(frame: Image.Image, reference: Image.Image, crop: tuple[int, int, int, int]) -> Image.Image:
    x, y, width, height = crop
    current = np.asarray(frame.convert("RGB").crop((x, y, x + width, y + height)), dtype=np.float32)
    background = np.asarray(reference.convert("RGB").crop((x, y, x + width, y + height)), dtype=np.float32)
    if current.shape != background.shape:
        raise ValueError("Frame and reference crop sizes do not match")

    distance = np.linalg.norm(current - background, axis=2)
    alpha = np.clip((distance - 10) / 45, 0, 1)
    alpha[alpha < 0.025] = 0
    rgba = np.zeros((*current.shape[:2], 4), dtype=np.uint8)
    visible = alpha > 0
    for channel in range(3):
        recovered = (current[:, :, channel] - background[:, :, channel] * (1 - alpha)) / np.maximum(alpha, 0.001)
        rgba[:, :, channel][visible] = np.clip(recovered[visible], 0, 255).astype(np.uint8)
    rgba[:, :, 3] = np.round(alpha * 255).astype(np.uint8)
    return Image.fromarray(rgba, "RGBA")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("frames", type=Path, help="Directory written by extract_video_window.swift")
    parser.add_argument("reference", type=Path, help="Same-sized clean frame used as the background")
    parser.add_argument("output", type=Path, help="Animated WebP output")
    parser.add_argument("--crop", nargs=4, required=True, type=int, metavar=("X", "Y", "WIDTH", "HEIGHT"), help="Crop inside each extracted frame")
    parser.add_argument("--frame-ms", type=int, default=17, help="Frame delay in milliseconds (default: 17)")
    args = parser.parse_args()

    files = sorted(args.frames.glob("frame-*.png"))
    if len(files) < 2:
        parser.error("frames must contain at least two PNG images")
    if args.frame_ms < 10:
        parser.error("animated WebP frame delays must be at least 10 ms")

    reference = Image.open(args.reference)
    frames = [cutout(Image.open(path), reference, tuple(args.crop)) for path in files]
    args.output.parent.mkdir(parents=True, exist_ok=True)
    frames[0].save(
        args.output,
        format="WEBP",
        save_all=True,
        append_images=frames[1:],
        duration=args.frame_ms,
        loop=1,
        lossless=True,
        method=6,
        exact=True,
    )

    source_manifest = args.frames / "manifest.json"
    source_hash = None
    if source_manifest.exists():
        source_hash = json.loads(source_manifest.read_text(encoding="utf-8")).get("source_sha256")
    metadata = {
        "output": args.output.name,
        "source_sha256": source_hash,
        "frame_count": len(frames),
        "frame_delay_ms": args.frame_ms,
        "crop_in_extracted_frames": args.crop,
        "background_reference": args.reference.name,
        "alpha_method": "pixel difference from the clean frame with inverse-alpha foreground recovery",
    }
    args.output.with_suffix(".json").write_text(json.dumps(metadata, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"output": str(args.output), "frames": len(frames), "bytes": args.output.stat().st_size}, indent=2))


if __name__ == "__main__":
    main()

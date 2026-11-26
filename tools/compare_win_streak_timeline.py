#!/usr/bin/env python3
"""Compare sampled mobile-web win animation frames with the source video."""

import argparse
import json
import re
from pathlib import Path

import numpy as np
from PIL import Image


def load_mask(path: Path, width: int, height: int, *, source: bool, top: int, bottom: int) -> np.ndarray:
    with Image.open(path) as image:
        rgb = image.convert("RGB")
        if source:
            scaled_height = round(rgb.height * width / rgb.width)
            rgb = rgb.resize((width, scaled_height), Image.Resampling.LANCZOS)
            if scaled_height < height:
                raise ValueError(f"Resized source frame is shorter than the {height}px viewport: {path}")
            rgb = rgb.crop((0, 0, width, height))
        elif rgb.size != (width, height):
            raise ValueError(f"Web frame must be {width}×{height}, got {rgb.width}×{rgb.height}: {path}")

    pixels = np.asarray(rgb, dtype=np.float32) / 255
    region = pixels[top:bottom]
    return (region.mean(axis=2) > 0.18) & ((region.max(axis=2) - region.min(axis=2)) < 0.20)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("source_frames", type=Path, help="AVFoundation extraction directory")
    parser.add_argument("web_frames", type=Path, help="test-results/win-streak-timeline directory")
    parser.add_argument("--start", type=float, default=303.5, help="source time aligned to web animation start")
    parser.add_argument("--end", type=float, default=307.0, help="last source time to compare")
    parser.add_argument("--width", type=int, default=390)
    parser.add_argument("--height", type=int, default=844)
    parser.add_argument("--top", type=int, default=320)
    parser.add_argument("--bottom", type=int, default=680)
    parser.add_argument("--json-output", type=Path)
    args = parser.parse_args()

    capture = json.loads((args.web_frames / "manifest.json").read_text())
    if capture.get("viewport") != [args.width, args.height]:
        raise ValueError(f"Browser capture viewport must be {args.width}×{args.height}: {capture.get('viewport')}")
    samples = capture.get("samples", [])
    if not samples:
        raise ValueError("The browser capture manifest contains no sampled frames.")

    web_frames = []
    for sample in samples:
        web_frames.append((float(sample["actualMs"]), load_mask(args.web_frames / sample["filename"], args.width, args.height, source=False, top=args.top, bottom=args.bottom)))

    rows = []
    for frame in sorted(args.source_frames.glob("frame-*-req-*-pts-*.png")):
        match = re.search(r"req-(\d+\.\d+)-pts-", frame.name)
        if not match:
            continue
        source_seconds = float(match.group(1))
        if source_seconds < args.start or source_seconds > args.end:
            continue
        source_mask = load_mask(frame, args.width, args.height, source=True, top=args.top, bottom=args.bottom)
        target_ms = (source_seconds - args.start) * 1000
        web_ms, web_mask = min(web_frames, key=lambda sample: abs(sample[0] - target_ms))
        union = source_mask | web_mask
        rows.append({
            "sourceSeconds": source_seconds,
            "webCaptureMs": round(web_ms, 1),
            "sourceNeutralPixels": int(source_mask.sum()),
            "webNeutralPixels": int(web_mask.sum()),
            "maskIoU": float((source_mask & web_mask).sum() / max(int(union.sum()), 1)),
        })

    if not rows:
        raise ValueError(f"No source frames fell within {args.start}–{args.end} seconds.")

    checkpoints = [row for row in rows if round((row["sourceSeconds"] - args.start) * 10) % 5 == 0]
    report = {
        "viewport": [args.width, args.height],
        "roiY": [args.top, args.bottom],
        "sourceIntervalSeconds": [args.start, args.end],
        "sampleCount": len(rows),
        "meanMaskIoU": float(np.mean([row["maskIoU"] for row in rows])),
        "neutralPixelCountMAE": float(np.mean([abs(row["sourceNeutralPixels"] - row["webNeutralPixels"]) for row in rows])),
        "checkpoints": checkpoints,
    }
    output = json.dumps(report, indent=2)
    print(output)
    if args.json_output:
        args.json_output.parent.mkdir(parents=True, exist_ok=True)
        args.json_output.write_text(output + "\n")


if __name__ == "__main__":
    main()

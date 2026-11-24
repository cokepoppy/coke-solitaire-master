#!/usr/bin/env python3
"""Extract an exact timestamped PCM window from a video on macOS."""

from __future__ import annotations

import argparse
import hashlib
import json
import shutil
import subprocess
import tempfile
import wave
from datetime import datetime, timezone
from pathlib import Path


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as source:
        while block := source.read(8 * 1024 * 1024):
            digest.update(block)
    return digest.hexdigest()


def extract(args: argparse.Namespace) -> None:
    source = Path(args.video).expanduser().resolve()
    output = Path(args.output).expanduser().resolve()
    manifest_path = Path(args.manifest).expanduser().resolve() if args.manifest else output.with_suffix(".json")
    if output == source or manifest_path == source or output == manifest_path:
        raise ValueError("The video, WAV output, and manifest must be three different paths")
    afconvert = shutil.which(args.afconvert)
    if not afconvert:
        raise FileNotFoundError(f"Could not find macOS afconvert executable: {args.afconvert}")

    with tempfile.TemporaryDirectory(prefix="solitaire-audio-window-") as temporary_directory:
        full_pcm = Path(temporary_directory) / "decoded-source.wav"
        subprocess.run(
            [afconvert, "-f", "WAVE", "-d", "LEI16@44100", "-c", "2", str(source), str(full_pcm)],
            check=True,
        )
        with wave.open(str(full_pcm), "rb") as decoded:
            params = decoded.getparams()
            if (params.framerate, params.nchannels, params.sampwidth, params.comptype) != (44_100, 2, 2, "NONE"):
                raise ValueError(f"afconvert produced unexpected PCM format: {params}")
            sample_rate = params.framerate
            start_frame = round(args.start * sample_rate)
            end_frame = round(args.end * sample_rate)
            if end_frame <= start_frame:
                raise ValueError("The requested range is shorter than one 44.1 kHz sample frame")
            if start_frame < 0 or end_frame > params.nframes:
                raise ValueError(f"Requested {args.start:.6f}–{args.end:.6f}s outside decoded source duration {params.nframes / sample_rate:.6f}s")
            decoded.setpos(start_frame)
            pcm = decoded.readframes(end_frame - start_frame)
            full_pcm_sha256 = sha256_file(full_pcm)

    output.parent.mkdir(parents=True, exist_ok=True)
    with wave.open(str(output), "wb") as extracted:
        extracted.setparams(params._replace(nframes=0, compname="not compressed"))
        extracted.writeframes(pcm)

    manifest = {
        "source_file": source.name,
        "source_sha256": sha256_file(source),
        "source_url": args.url,
        "decoder": "macOS afconvert",
        "decoded_pcm_format": "44.1 kHz stereo signed PCM16 little-endian",
        "decoded_full_pcm_sha256": full_pcm_sha256,
        "requested_source_start_seconds": args.start,
        "requested_source_end_seconds": args.end,
        "sample_rate_hz": sample_rate,
        "channels": params.nchannels,
        "sample_width_bits": params.sampwidth * 8,
        "start_sample_frame": start_frame,
        "end_sample_frame_exclusive": end_frame,
        "frame_count": end_frame - start_frame,
        "actual_start_seconds": start_frame / sample_rate,
        "actual_end_seconds": end_frame / sample_rate,
        "duration_seconds": (end_frame - start_frame) / sample_rate,
        "output_file": output.name,
        "output_sha256": sha256_file(output),
        "extracted_at_utc": datetime.now(timezone.utc).isoformat(),
        "note": "The WAV is cropped at the recorded source-time sample indices with no fade or timeline offset; keep this manifest beside it.",
    }
    manifest_path.parent.mkdir(parents=True, exist_ok=True)
    manifest_path.write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(json.dumps({"output": str(output), "manifest": str(manifest_path), "frames": end_frame - start_frame, "duration_seconds": manifest["duration_seconds"]}, indent=2))


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("video", help="Local MP4/MOV reference recording.")
    parser.add_argument("--start", type=float, required=True, help="Absolute source time in seconds.")
    parser.add_argument("--end", type=float, required=True, help="Absolute source end time in seconds.")
    parser.add_argument("--output", required=True, help="Output PCM16 WAV path.")
    parser.add_argument("--manifest", help="Optional JSON sidecar path; defaults to OUTPUT.json.")
    parser.add_argument("--url", default="", help="Original video URL for the sidecar.")
    parser.add_argument("--afconvert", default="afconvert", help="Path or command name for macOS afconvert.")
    args = parser.parse_args()
    if args.start < 0 or args.end <= args.start:
        parser.error("require 0 <= start < end")
    return args


if __name__ == "__main__":
    extract(parse_args())

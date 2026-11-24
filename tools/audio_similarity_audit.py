#!/usr/bin/env python3
"""Find normalized waveform matches between a PCM source and reference cues."""

from __future__ import annotations

import argparse
import hashlib
import json
import wave
from datetime import datetime, timezone
from pathlib import Path

import numpy as np


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as source:
        while block := source.read(8 * 1024 * 1024):
            digest.update(block)
    return digest.hexdigest()


def read_pcm(path: Path) -> tuple[int, int, np.ndarray]:
    with wave.open(str(path), "rb") as wav:
        if wav.getsampwidth() != 2 or wav.getcomptype() != "NONE":
            raise ValueError(f"{path} must be uncompressed PCM16 WAV")
        channels = wav.getnchannels()
        if channels not in (1, 2):
            raise ValueError(f"{path} must be mono or stereo, got {channels} channels")
        rate = wav.getframerate()
        samples = np.frombuffer(wav.readframes(wav.getnframes()), dtype="<i2").reshape(-1, channels)
    return rate, channels, samples.astype(np.float64).mean(axis=1) / 32768.0


def normalized_matches(source: np.ndarray, template: np.ndarray, sample_rate: int, count: int, source_offset: float) -> list[dict[str, float]]:
    template = template - np.mean(template)
    template_frames = len(template)
    if template_frames > len(source):
        raise ValueError("A reference cue is longer than the source audio window")
    if not np.any(template):
        raise ValueError("A reference cue is silent")

    convolution_length = len(source) + template_frames - 1
    fft_size = 1 << (convolution_length - 1).bit_length()
    convolution = np.fft.irfft(
        np.fft.rfft(source, fft_size) * np.fft.rfft(template[::-1], fft_size), fft_size
    )[:convolution_length]
    numerator = convolution[template_frames - 1 : len(source)]
    cumulative_sum = np.concatenate(([0.0], np.cumsum(source)))
    cumulative_energy = np.concatenate(([0.0], np.cumsum(source * source)))
    window_sum = cumulative_sum[template_frames:] - cumulative_sum[:-template_frames]
    window_energy = cumulative_energy[template_frames:] - cumulative_energy[:-template_frames]
    centered_energy = np.maximum(window_energy - window_sum * window_sum / template_frames, 1e-20)
    correlation = numerator / np.sqrt(centered_energy * np.sum(template * template))

    separation = max(1, round(min(0.25, len(template) / sample_rate / 4) * sample_rate))
    matches: list[dict[str, float]] = []
    for index in np.argsort(np.abs(correlation))[::-1]:
        if all(abs(int(index) - round(match["window_relative_start_seconds"] * sample_rate)) >= separation for match in matches):
            value = float(correlation[index])
            relative_start = int(index) / sample_rate
            matches.append({
                "start_seconds": round(source_offset + relative_start, 6),
                "end_seconds": round(source_offset + (int(index) + template_frames) / sample_rate, 6),
                "window_relative_start_seconds": round(relative_start, 6),
                "signed_correlation": round(value, 8),
                "absolute_correlation": round(abs(value), 8),
            })
            if len(matches) == count:
                break
    return matches


def audit(args: argparse.Namespace) -> None:
    source_path = Path(args.source).expanduser().resolve()
    source_rate, source_channels, source = read_pcm(source_path)
    references = []
    for raw_path in args.references:
        path = Path(raw_path).expanduser().resolve()
        rate, channels, template = read_pcm(path)
        if rate != source_rate:
            raise ValueError(f"Sample-rate mismatch: {source_path} is {source_rate} Hz, {path} is {rate} Hz")
        references.append({
            "file": path.name,
            "sha256": sha256_file(path),
            "channels": channels,
            "duration_seconds": round(len(template) / rate, 6),
            "top_matches": normalized_matches(source, template, rate, args.matches, args.source_offset_seconds),
        })

    report = {
        "source_file": source_path.name,
        "source_sha256": sha256_file(source_path),
        "source_sample_rate_hz": source_rate,
        "source_channels": source_channels,
        "source_duration_seconds": round(len(source) / source_rate, 6),
        "source_offset_seconds": args.source_offset_seconds,
        "normalization": "Peak absolute Pearson-style normalized cross-correlation after mono downmix; positive and negative matches are ranked by absolute value.",
        "references": references,
        "audited_at_utc": datetime.now(timezone.utc).isoformat(),
        "note": "Correlation peaks are waveform similarity candidates only; they do not identify an action or prove that a low score means the same sound is absent.",
    }
    output = Path(args.output).expanduser().resolve()
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(report, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(json.dumps({"output": str(output), "reference_matches": references}, indent=2))


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("source", help="PCM16 WAV to search, usually an extracted recording window.")
    parser.add_argument("references", nargs="+", help="One or more PCM16 cue WAV files to find in the source.")
    parser.add_argument("--output", required=True, help="JSON report destination.")
    parser.add_argument("--matches", type=int, default=5, help="Number of separated peaks to keep per cue.")
    parser.add_argument("--source-offset-seconds", type=float, default=0, help="Source-media timestamp of frame zero in the WAV.")
    args = parser.parse_args()
    if args.matches < 1 or args.source_offset_seconds < 0:
        parser.error("--matches must be positive and source offset nonnegative")
    return args


if __name__ == "__main__":
    audit(parse_args())

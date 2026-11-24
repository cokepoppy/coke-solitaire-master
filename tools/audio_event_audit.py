#!/usr/bin/env python3
"""Summarize short PCM WAV windows for source-timestamp audio review."""

from __future__ import annotations

import argparse
import csv
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


def sliding_median(values: np.ndarray, radius: int) -> np.ndarray:
    padded = np.pad(values, (radius, radius), mode="edge")
    windows = np.lib.stride_tricks.sliding_window_view(padded, 2 * radius + 1)
    return np.median(windows, axis=1)


def analyze(args: argparse.Namespace) -> None:
    source = Path(args.wav).expanduser().resolve()
    output = Path(args.output).expanduser().resolve()
    output.mkdir(parents=True, exist_ok=True)
    with wave.open(str(source), "rb") as wav:
        channels = wav.getnchannels()
        sample_rate = wav.getframerate()
        sample_width = wav.getsampwidth()
        frame_count = wav.getnframes()
        compression = wav.getcomptype()
        raw = wav.readframes(frame_count)
    if sample_width != 2 or compression != "NONE":
        raise ValueError("Input must be uncompressed 16-bit PCM WAV (extract it from the source audio first).")
    if channels not in (1, 2):
        raise ValueError(f"Expected mono or stereo audio, got {channels} channels.")
    samples_per_window = sample_rate * args.hop_ms / 1000
    if not samples_per_window.is_integer():
        raise ValueError(f"--hop-ms must produce a whole number of samples at {sample_rate} Hz.")
    hop = int(samples_per_window)
    audio = np.frombuffer(raw, dtype="<i2").reshape(-1, channels).astype(np.float32) / 32768.0
    window_count = len(audio) // hop
    if window_count == 0:
        raise ValueError("The WAV is shorter than one analysis window.")
    audio = audio[: window_count * hop].reshape(window_count, hop, channels)
    rms_by_channel = np.sqrt(np.mean(audio * audio, axis=1))
    rms = np.sqrt(np.mean(rms_by_channel * rms_by_channel, axis=1))
    peak = np.max(np.abs(audio), axis=(1, 2))

    mono = np.mean(audio, axis=2)
    taper = np.hanning(hop).astype(np.float32)
    spectrum = np.abs(np.fft.rfft(mono * taper, axis=1))
    power = spectrum * spectrum
    frequencies = np.fft.rfftfreq(hop, 1 / sample_rate)
    total_power = np.sum(power, axis=1) + 1e-20

    def band_fraction(low: float, high: float) -> np.ndarray:
        selected = (frequencies >= low) & (frequencies < high)
        return np.sum(power[:, selected], axis=1) / total_power

    low_fraction = band_fraction(20, 200)
    mid_fraction = band_fraction(200, 2000)
    high_fraction = band_fraction(2000, min(10000, sample_rate / 2))
    centroid = np.sum(spectrum * frequencies, axis=1) / (np.sum(spectrum, axis=1) + 1e-20)

    baseline = sliding_median(rms, max(1, round(1000 / args.hop_ms)))
    candidate_mask = (rms >= np.maximum(baseline * 1.45, baseline + 0.003)) & (high_fraction >= 0.12)
    candidates = np.flatnonzero(candidate_mask)
    candidate_groups: list[int] = []
    for index in candidates:
        if not candidate_groups or index - candidate_groups[-1] > round(250 / args.hop_ms):
            candidate_groups.append(int(index))
        elif rms[index] > rms[candidate_groups[-1]]:
            candidate_groups[-1] = int(index)
    ranked = sorted(candidate_groups, key=lambda index: rms[index], reverse=True)[: args.max_events]
    ranked.sort()
    windows_above_001 = int(np.count_nonzero(rms > 0.01))
    windows_above_005 = int(np.count_nonzero(rms > 0.05))

    features_path = output / "audio-windows.csv"
    with features_path.open("w", newline="", encoding="utf-8") as ledger:
        writer = csv.writer(ledger, lineterminator="\n")
        writer.writerow(["window_index", "source_time_seconds", "rms", "peak", "low_20_200_fraction", "mid_200_2000_fraction", "high_2000_10000_fraction", "spectral_centroid_hz"])
        for index in range(window_count):
            time = args.source_offset_seconds + index * args.hop_ms / 1000
            writer.writerow([
                index,
                f"{time:.3f}",
                f"{rms[index]:.8f}",
                f"{peak[index]:.8f}",
                f"{low_fraction[index]:.6f}",
                f"{mid_fraction[index]:.6f}",
                f"{high_fraction[index]:.6f}",
                f"{centroid[index]:.2f}",
            ])

    events = []
    for index in ranked:
        events.append({
            "source_time_seconds": round(args.source_offset_seconds + index * args.hop_ms / 1000, 3),
            "rms": round(float(rms[index]), 8),
            "peak": round(float(peak[index]), 8),
            "high_band_fraction": round(float(high_fraction[index]), 6),
            "spectral_centroid_hz": round(float(centroid[index]), 2),
        })
    report = {
        "source_url": args.url,
        "source_video_sha256": args.video_sha256,
        "source_wav_name": source.name,
        "source_wav_sha256": sha256_file(source),
        "audit_timestamp_utc": datetime.now(timezone.utc).isoformat(),
        "sample_rate_hz": sample_rate,
        "channels": channels,
        "sample_width_bits": sample_width * 8,
        "source_duration_seconds": frame_count / sample_rate,
        "source_offset_seconds": args.source_offset_seconds,
        "analysis_hop_ms": args.hop_ms,
        "analysis_window_count": window_count,
        "global_rms_median": round(float(np.median(rms)), 8),
        "global_rms_p95": round(float(np.quantile(rms, 0.95)), 8),
        "global_rms_max": round(float(np.max(rms)), 8),
        "windows_above_rms_0_01": windows_above_001,
        "fraction_windows_above_rms_0_01": round(windows_above_001 / window_count, 6),
        "windows_above_rms_0_05": windows_above_005,
        "fraction_windows_above_rms_0_05": round(windows_above_005 / window_count, 6),
        "candidate_events": events,
        "features_csv": features_path.name,
        "note": "Thresholded peaks are event candidates in a mixed track, not verified action-to-effect labels.",
    }
    (output / "manifest.json").write_text(json.dumps(report, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(json.dumps({"windows": window_count, "duration_seconds": report["source_duration_seconds"], "rms_p95": report["global_rms_p95"], "candidate_events": events, "output": str(output)}, indent=2))


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("wav", help="Uncompressed mono/stereo PCM16 WAV extracted from the source video.")
    parser.add_argument("--output", required=True, help="Directory for audio-windows.csv and manifest.json.")
    parser.add_argument("--url", default="", help="Original public source URL.")
    parser.add_argument("--video-sha256", default="", help="SHA-256 of the containing source video.")
    parser.add_argument("--source-offset-seconds", type=float, default=0, help="Absolute source-video time of the first sample in this WAV.")
    parser.add_argument("--hop-ms", type=int, default=50, help="Window size; 50 ms is suitable for short card sounds.")
    parser.add_argument("--max-events", type=int, default=40, help="Maximum peak candidates listed in manifest.json.")
    args = parser.parse_args()
    if args.hop_ms < 10 or args.max_events < 1 or args.source_offset_seconds < 0:
        parser.error("hop must be at least 10 ms, max events positive, and source offset nonnegative")
    return args


if __name__ == "__main__":
    analyze(parse_args())

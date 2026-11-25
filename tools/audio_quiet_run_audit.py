#!/usr/bin/env python3
"""Summarize quiet-window coverage and the longest quiet run in an audio audit CSV."""

from __future__ import annotations

import argparse
import csv
import json
from pathlib import Path


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("windows_csv", type=Path, help="CSV from audio_event_audit.py")
    parser.add_argument(
        "--threshold",
        type=float,
        nargs="+",
        default=[0.0, 0.0001, 0.001, 0.01],
        help="RMS thresholds to report (default: 0 0.0001 0.001 0.01)",
    )
    args = parser.parse_args()

    with args.windows_csv.open(newline="", encoding="utf-8") as source:
        rows = list(csv.DictReader(source))
    if not rows:
        raise SystemExit("The audit CSV has no windows")

    starts = [float(row["source_time_seconds"]) for row in rows]
    rms = [float(row["rms"]) for row in rows]
    hop = starts[1] - starts[0] if len(starts) > 1 else 0.05
    report = {"window_count": len(rows), "window_hop_seconds": hop, "thresholds": []}
    for threshold in args.threshold:
        count = sum(value <= threshold for value in rms)
        longest_length = longest_start = 0
        run_start: int | None = None
        for index, value in enumerate(rms + [float("inf")]):
            if value <= threshold and run_start is None:
                run_start = index
            elif value > threshold and run_start is not None:
                length = index - run_start
                if length > longest_length:
                    longest_length, longest_start = length, run_start
                run_start = None

        report["thresholds"].append({
            "rms_lte": threshold,
            "window_count": count,
            "fraction": count / len(rms),
            "longest_run_seconds": longest_length * hop,
            "longest_run_start_seconds": starts[longest_start] if longest_length else None,
            "longest_run_end_exclusive_seconds": starts[longest_start] + longest_length * hop if longest_length else None,
        })

    print(json.dumps(report, indent=2))


if __name__ == "__main__":
    main()

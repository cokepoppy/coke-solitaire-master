#!/usr/bin/env python3
"""Create source-PTS, decoded-pixel hashes, contact sheets, and verified keyframes."""

from __future__ import annotations

import argparse
import csv
import hashlib
import json
import math
import queue
import re
import subprocess
import sys
import threading
from datetime import datetime, timezone
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


SHOWINFO = re.compile(r"\bn:\s*(\d+)\s+pts:\s*(NOPTS|-?\d+)\s+pts_time:\s*(NOPTS|-?[\d.eE+-]+)")
VIDEO_STREAM = re.compile(r"(?P<width>\d{2,5})x(?P<height>\d{2,5}).*?(?P<fps>\d+(?:\.\d+)?) fps")


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as source:
        while block := source.read(8 * 1024 * 1024):
            digest.update(block)
    return digest.hexdigest()


def read_exact(stream, size: int) -> bytes:
    data = bytearray()
    while len(data) < size:
        block = stream.read(size - len(data))
        if not block:
            break
        data.extend(block)
    return bytes(data)


def ffmpeg_info(ffmpeg: str, source: Path) -> tuple[dict, str, list[str]]:
    result = subprocess.run(
        [ffmpeg, "-hide_banner", "-i", str(source)],
        capture_output=True,
        text=True,
        check=False,
    )
    text = result.stderr
    stream_line = next((line for line in text.splitlines() if "Video:" in line), None)
    if not stream_line:
        raise RuntimeError("FFmpeg could not identify a video stream in the source file.")
    match = VIDEO_STREAM.search(stream_line)
    if not match:
        raise RuntimeError(f"Could not parse dimensions/frame rate from: {stream_line}")
    duration = re.search(r"Duration:\s*(\d{2}:\d{2}:\d{2}\.\d+)", text)
    time_base = re.search(r"\b(\d+) tbn\b", stream_line)
    audio_line = next((line.strip() for line in text.splitlines() if "Audio:" in line), None)
    metadata = {
        "width": int(match.group("width")),
        "height": int(match.group("height")),
        "nominal_fps": float(match.group("fps")),
        "time_base_denominator": int(time_base.group(1)) if time_base else None,
        "container_duration": duration.group(1) if duration else None,
        "video_stream": stream_line.strip(),
        "audio_stream": audio_line,
    }
    version = subprocess.run([ffmpeg, "-version"], capture_output=True, text=True, check=True).stdout.splitlines()[0]
    return metadata, version


def make_contact_sheet(images: list[tuple[int, int, str, Image.Image]], destination: Path, columns: int, tile_width: int) -> None:
    if not images:
        return
    image_width, image_height = images[0][3].size
    tile_height = round(tile_width * image_height / image_width)
    label_height = 19
    rows = math.ceil(len(images) / columns)
    sheet = Image.new("RGB", (columns * tile_width, rows * (tile_height + label_height)), "#101814")
    draw = ImageDraw.Draw(sheet)
    font = ImageFont.load_default()
    for position, (frame_index, pts, pts_time, image) in enumerate(images):
        x = (position % columns) * tile_width
        y = (position // columns) * (tile_height + label_height)
        sheet.paste(image.resize((tile_width, tile_height), Image.Resampling.LANCZOS), (x, y))
        draw.text((x + 4, y + tile_height + 2), f"{frame_index:06d}  PTS {pts}  {pts_time}s", fill="#f4e9c5", font=font)
    sheet.save(destination, quality=90)


def input_window_args(args: argparse.Namespace) -> list[str]:
    options = ["-copyts"]
    if args.start_seconds is not None:
        options.extend(["-seek_timestamp", "1", "-ss", f"{args.start_seconds:.9f}"])
    if args.end_seconds is not None:
        start = args.start_seconds or 0.0
        options.extend(["-t", f"{args.end_seconds - start:.9f}"])
    options.extend(["-i", str(Path(args.video).expanduser().resolve())])
    return options


def verify_keyframes(args: argparse.Namespace, width: int, height: int, expected: dict[str, str]) -> dict:
    if not expected:
        return {}
    target_pts = sorted(int(pts) for pts in expected)
    expression = "+".join(f"eq(pts\\,{pts})" for pts in target_pts)
    command = [
        args.ffmpeg,
        "-hide_banner",
        "-v",
        "error",
        *input_window_args(args),
        "-map",
        "0:v:0",
        "-an",
        "-vf",
        f"select='{expression}',format=rgb24",
        "-fps_mode",
        "passthrough",
        "-pix_fmt",
        "rgb24",
        "-f",
        "rawvideo",
        "pipe:1",
    ]
    result = subprocess.run(command, capture_output=True, check=False)
    if result.returncode:
        raise RuntimeError(f"Independent keyframe extraction failed: {result.stderr.decode(errors='replace')[-1200:]}")
    frame_size = width * height * 3
    if len(result.stdout) != frame_size * len(target_pts):
        raise RuntimeError(f"Independent extraction returned {len(result.stdout)} bytes; expected {frame_size * len(target_pts)}.")
    checks = {}
    for index, pts in enumerate(target_pts):
        begin = index * frame_size
        digest = hashlib.sha256(result.stdout[begin : begin + frame_size]).hexdigest()
        checks[str(pts)] = {"expected_rgb_sha256": expected[str(pts)], "independent_rgb_sha256": digest, "match": digest == expected[str(pts)]}
    if not all(item["match"] for item in checks.values()):
        raise RuntimeError("One or more independently extracted keyframe pixel hashes did not match the main pass.")
    return checks


def run(args: argparse.Namespace) -> None:
    source = Path(args.video).expanduser().resolve()
    output = Path(args.output).expanduser().resolve()
    output.mkdir(parents=True, exist_ok=True)
    metadata, ffmpeg_version = ffmpeg_info(args.ffmpeg, source)
    frame_size = metadata["width"] * metadata["height"] * 3
    target_pts = set(args.keyframe_pts)
    keyframe_dir = output / "keyframes"
    saved_hashes: dict[str, str] = {}
    retained_pts: set[int] = set()
    keyframe_neighbors: dict[str, dict] = {str(pts): {} for pts in target_pts}
    csv_path = output / "frames.csv"
    contact_images: list[tuple[int, int, str, Image.Image]] = []
    overview_images: list[tuple[int, int, str, Image.Image]] = []
    next_overview_second = 0
    contact_index = 0
    frame_index = 0
    previous: tuple[int, str, bytes] | None = None
    pending_after: set[int] = set()
    frames_per_sheet = args.frames_per_sheet
    contact_dir = output

    command = [
        args.ffmpeg,
        "-hide_banner",
        "-nostats",
        "-loglevel",
        "info",
        *input_window_args(args),
        "-map",
        "0:v:0",
        "-an",
        "-vf",
        "showinfo,format=rgb24",
        "-fps_mode",
        "passthrough",
        "-pix_fmt",
        "rgb24",
        "-f",
        "rawvideo",
        "pipe:1",
    ]
    process = subprocess.Popen(command, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    frame_events: queue.Queue = queue.Queue()
    log_tail: list[str] = []

    def read_stderr() -> None:
        assert process.stderr is not None
        for raw_line in process.stderr:
            line = raw_line.decode(errors="replace").strip()
            match = SHOWINFO.search(line)
            if match:
                frame_events.put((match.group(1), match.group(2), match.group(3)))
            elif line:
                log_tail.append(line)
                if len(log_tail) > 40:
                    del log_tail[:10]
        frame_events.put(None)

    stderr_thread = threading.Thread(target=read_stderr, daemon=True)
    stderr_thread.start()
    first_frame = None
    last_frame = None
    with csv_path.open("w", newline="", encoding="utf-8") as manifest:
        writer = csv.writer(manifest, lineterminator="\n")
        writer.writerow(["frame_index", "source_pts", "pts_time_seconds", "decoded_rgb_sha256"])
        assert process.stdout is not None
        while raw_frame := read_exact(process.stdout, frame_size):
            if len(raw_frame) != frame_size:
                process.kill()
                raise RuntimeError(f"Truncated decoded frame {frame_index}: {len(raw_frame)} of {frame_size} bytes.")
            try:
                event = frame_events.get(timeout=60)
            except queue.Empty as error:
                process.kill()
                raise RuntimeError("No source PTS arrived for a decoded frame.") from error
            if event is None:
                process.kill()
                raise RuntimeError("FFmpeg ended before it reported all decoded frame timestamps.")
            _, pts_text, time_text = event
            if pts_text == "NOPTS" or time_text == "NOPTS":
                process.kill()
                raise RuntimeError(f"Frame {frame_index} has no source PTS; refusing to invent a timestamp.")
            pts = int(pts_text)
            pts_time = float(time_text)
            rgb_hash = hashlib.sha256(raw_frame).hexdigest()
            writer.writerow([frame_index, pts, f"{pts_time:.9f}", rgb_hash])
            saved_hashes[str(pts)] = rgb_hash
            first_frame = first_frame or {"index": frame_index, "pts": pts, "pts_time_seconds": pts_time}
            last_frame = {"index": frame_index, "pts": pts, "pts_time_seconds": pts_time}

            image = Image.frombytes("RGB", (metadata["width"], metadata["height"]), raw_frame)
            if pending_after:
                keyframe_dir.mkdir(parents=True, exist_ok=True)
                for target in pending_after:
                    image.save(keyframe_dir / f"after-of-pts-{target}-source-pts-{pts}.png")
                    keyframe_neighbors[str(target)]["after_pts"] = pts
                    retained_pts.add(pts)
                pending_after.clear()
            if pts in target_pts:
                keyframe_dir.mkdir(parents=True, exist_ok=True)
                image.save(keyframe_dir / f"target-pts-{pts}.png")
                keyframe_neighbors[str(pts)]["target_frame_index"] = frame_index
                retained_pts.add(pts)
                if previous:
                    previous_pts, _, previous_rgb = previous
                    Image.frombytes("RGB", (metadata["width"], metadata["height"]), previous_rgb).save(keyframe_dir / f"before-of-pts-{pts}-source-pts-{previous_pts}.png")
                    keyframe_neighbors[str(pts)]["before_pts"] = previous_pts
                    retained_pts.add(previous_pts)
                pending_after.add(pts)

            thumb_width = args.tile_width
            thumb_height = round(thumb_width * metadata["height"] / metadata["width"])
            thumb = image.resize((thumb_width, thumb_height), Image.Resampling.LANCZOS)
            contact_images.append((frame_index, pts, f"{pts_time:.3f}", thumb))
            if len(contact_images) == frames_per_sheet:
                make_contact_sheet(contact_images, contact_dir / f"contact-{contact_index + 1:03d}.jpg", args.columns, args.tile_width)
                contact_index += 1
                contact_images = []
            if pts_time >= next_overview_second:
                overview_width = 320
                overview_height = round(overview_width * metadata["height"] / metadata["width"])
                overview_images.append((frame_index, pts, f"{pts_time:.3f}", image.resize((overview_width, overview_height), Image.Resampling.LANCZOS)))
                next_overview_second = math.floor(pts_time) + 1
            previous = (pts, f"{pts_time:.9f}", raw_frame)
            frame_index += 1
    if contact_images:
        make_contact_sheet(contact_images, contact_dir / f"contact-{contact_index + 1:03d}.jpg", args.columns, args.tile_width)
        contact_index += 1
    stderr_thread.join()
    return_code = process.wait()
    if return_code:
        raise RuntimeError("FFmpeg frame decode failed:\n" + "\n".join(log_tail[-20:]))
    missing_targets = sorted(target_pts - {int(pts) for pts in saved_hashes})
    if missing_targets:
        raise RuntimeError(f"Requested PTS values were not decoded in this source window: {missing_targets}")
    if overview_images:
        make_contact_sheet(overview_images, output / "overview-1fps.jpg", 4, 320)

    independent_checks = verify_keyframes(args, metadata["width"], metadata["height"], {str(pts): saved_hashes[str(pts)] for pts in sorted(retained_pts) if str(pts) in saved_hashes})
    report = {
        "source_url": args.url,
        "source_file_name": source.name,
        "source_sha256": sha256_file(source),
        "audit_timestamp_utc": datetime.now(timezone.utc).isoformat(),
        "ffmpeg_version": ffmpeg_version,
        "decode_command": ["ffmpeg" if item == args.ffmpeg else source.name if item == str(source) else item for item in command],
        "requested_window_seconds": {"start": args.start_seconds, "end": args.end_seconds},
        "source_stream": metadata,
        "decoded_frame_count": frame_index,
        "first_frame": first_frame,
        "last_frame": last_frame,
        "frames_csv": csv_path.name,
        "contact_sheet_count": contact_index,
        "keyframe_pts_requested": sorted(target_pts),
        "keyframe_neighbor_pts": keyframe_neighbors,
        "independent_keyframe_hash_checks": independent_checks,
    }
    (output / "manifest.json").write_text(json.dumps(report, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(json.dumps({"frames": frame_index, "source_sha256": report["source_sha256"], "first": first_frame, "last": last_frame, "contact_sheets": contact_index, "output": str(output)}, indent=2))


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("video", help="Local source video (the tool never downloads or modifies it).")
    parser.add_argument("--output", required=True, help="Directory for CSV/JSON manifests, contact sheets, and selected frames.")
    parser.add_argument("--url", default="", help="Original public source URL recorded in manifest.json.")
    parser.add_argument("--ffmpeg", default="ffmpeg", help="FFmpeg executable path; must support showinfo and rawvideo output.")
    parser.add_argument("--frames-per-sheet", type=int, default=120, help="Decoded source frames per full-rate contact sheet.")
    parser.add_argument("--columns", type=int, default=10, help="Contact sheet columns.")
    parser.add_argument("--tile-width", type=int, default=160, help="Contact sheet thumbnail width.")
    parser.add_argument("--keyframe-pts", type=int, nargs="*", default=[], help="Exact source PTS values to retain with adjacent frames and independently verify.")
    parser.add_argument("--start-seconds", type=float, help="Optional absolute source timestamp where decoding begins (preserves source PTS).")
    parser.add_argument("--end-seconds", type=float, help="Optional absolute source timestamp where decoding stops (preserves source PTS).")
    args = parser.parse_args()
    if args.frames_per_sheet < 1 or args.columns < 1 or args.tile_width < 32:
        parser.error("sheet and tile dimensions must be positive (tile width at least 32)")
    if args.start_seconds is not None and args.start_seconds < 0:
        parser.error("--start-seconds must be nonnegative")
    if args.end_seconds is not None and (args.end_seconds < 0 or (args.start_seconds is not None and args.end_seconds <= args.start_seconds)):
        parser.error("--end-seconds must be greater than --start-seconds")
    return args


if __name__ == "__main__":
    try:
        run(parse_args())
    except (OSError, RuntimeError, subprocess.SubprocessError) as error:
        print(f"video-frame-audit: {error}", file=sys.stderr)
        sys.exit(1)

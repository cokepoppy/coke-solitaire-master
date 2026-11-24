#!/usr/bin/env python3
"""Crop a PCM16 WAV reference sample and apply a short linear edge fade."""

import argparse
import wave


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("input")
    parser.add_argument("output")
    parser.add_argument("--start", type=float, required=True, help="Crop start in seconds")
    parser.add_argument("--end", type=float, required=True, help="Crop end in seconds")
    parser.add_argument("--fade-ms", type=float, default=8)
    args = parser.parse_args()
    if args.start < 0 or args.end <= args.start or args.fade_ms < 0:
        parser.error("require 0 <= start < end and a nonnegative fade")

    with wave.open(args.input, "rb") as source:
        params = source.getparams()
        if params.sampwidth != 2 or params.comptype != "NONE":
            parser.error("input must be uncompressed PCM16 WAV")
        rate, channels = params.framerate, params.nchannels
        start = round(args.start * rate)
        end = round(args.end * rate)
        source.setpos(start)
        data = bytearray(source.readframes(end - start))
    frames = len(data) // (channels * 2)
    fade = min(round(args.fade_ms * rate / 1000), frames // 2)
    for frame in range(fade):
        left = frame / max(1, fade)
        right = (fade - frame - 1) / max(1, fade)
        for channel in range(channels):
            for edge, gain in ((frame, left), (frames - fade + frame, right)):
                offset = (edge * channels + channel) * 2
                sample = int.from_bytes(data[offset:offset + 2], "little", signed=True)
                value = round(sample * gain)
                data[offset:offset + 2] = value.to_bytes(2, "little", signed=True)
    with wave.open(args.output, "wb") as output:
        output.setparams(params._replace(nframes=0, comptype="NONE", compname="not compressed"))
        output.writeframes(data)


if __name__ == "__main__":
    main()

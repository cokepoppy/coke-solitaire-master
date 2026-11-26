# Auto Collect source timing

This audit samples the recorded Auto Collect transition at 50 ms intervals and checks the move counter and last stock card against the mobile implementation.

## Source and reproduction

- Video: [Solitaire Master iOS gameplay](https://www.youtube.com/watch?v=gLd0HXtDt5I)
- Local source: `research/solitaire-master/source-videos/gLd0HXtDt5I.mp4` (ignored by Git)
- Video SHA-256: `56489d4aac9256d15de461d236a990df361621363fdc2904341a0e8e9cb64928`
- Native size and rate: 884×1920, 60 fps; PTS time base 1/15360
- Sample window: 300.500–303.500 s, 50 ms spacing; 61 of 61 counter readings were legible

Reproduce the OCR ledger from the repository root:

```sh
swift tools/scan_video_move_counter.swift \
  research/solitaire-master/source-videos/gLd0HXtDt5I.mp4 \
  research/solitaire-master/auto-collect-source-timing-2026-11-26/move-counter-50ms.csv \
  300.5 0.05 303.5
```

The CSV stores the requested and actual media time, source PTS, recognized text, and extracted move count for every sample. The default four-second whole-video scan remains available by omitting the optional time arguments.

## Observations

- The stock count remains 1 at 300.850 s and is 0 at 300.900 s. At 300.900 s the move count is 101; it reaches 102 by 300.950 s and 103 by 301.050 s.
- The move counter reaches 121 by 302.750 s and stays there through the 303.500 s sample. The move count advances 24 times from 97 at 300.500 s to 121 at 302.750 s. Sampled transition gaps range from 50 to 250 ms, with a 100 ms median; the 50 ms OCR grid bounds transitions only to adjacent samples.
- The 303.000 s frame still shows the last cards clearing. The first neutral pixels of the separate winning-streak fan are measured at 303.500 s in the [win-clear frame audit](../../../docs/video-frame-audit.md#win-clear-transition).

The evidence supports a short pause after the stock empties and roughly 100 ms between automatic foundation moves. The replica uses a 150 ms Auto Collect start delay followed by 100 ms steps. Its mobile E2E draws a final stock card by touch, records the actual Auto Collect start and foundation moves, and checks the startup delay and step spacing. The audit does not reveal the source solver's exact card-choice policy; its 50 ms OCR grid also cannot distinguish events within one sample interval.

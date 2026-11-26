# Full-video Auto Hint idle scan

Source: [gameplay recording](https://www.youtube.com/watch?v=gLd0HXtDt5I), local file `source-videos/gLd0HXtDt5I.mp4`, SHA-256 `56489d4aac9256d15de461d236a990df361621363fdc2904341a0e8e9cb64928`. The source is 884×1920 at 60 fps, with PTS timescale 15,360 and duration 17:24.06.

The initial scan sampled the moves counter every four source seconds from 10 through 1,042 seconds. Apple Vision OCR read 230 of 259 samples; 29 samples were blank and are listed in the CSV but excluded from stable-counter runs. Exact requested/actual source timestamps, PTS, raw OCR text, and extracted move digits are recorded there. The OCR crop is `(740,296,120,90)` in source pixels, and `tools/scan_video_move_counter.swift` reproduces the CSV on macOS.

Three intervals had the same readable move count at three consecutive samples (8 seconds from first to last sample): 71 at 442–450 s, 84 at 478–486 s, and 87 at 638–646 s. No readable interval retained a constant count across four consecutive samples (12 seconds). This is only a coarse screen-state filter: four-second sampling can miss brief actions followed by undo or other transitions, and a steady move counter does not prove every pixel of the board stayed unchanged.

The 87-move interval matches the focused source review: frames at 636, 641, and 646 s show the same board and no visible Auto Hint; the next move is visible by 648 s. The recording therefore rules out a five-second hint delay for this observed idle window, but it never shows the source Auto Hint firing. The web version's 12-second delay remains an explicit conservative inference, not an exact source measurement.

## One-second follow-up

A second pass sampled every second across the same full recording. Apple Vision read 912 of 1,033 counters; 121 were blank. The longest adjacent readable runs with one unchanged counter lasted 11 seconds: moves 71 from 441–452 s and moves 87 from 636–647 s. Further 10-second runs occurred at moves 84 (478–487 s), 87 (975–985 s), and 91 (991–1001 s). In the first two longest intervals the next counter is 72 at 453 s and 88 at 648 s, respectively. No visible Auto Hint firing has been confirmed, so the source's exact timeout remains unknown; these counter runs also cannot rule out brief board changes that do not alter the counter. The complete one-second OCR ledger and its hash are in [`move-counter-every-second.csv`](move-counter-every-second.csv) and [`one-second-scan-manifest.json`](one-second-scan-manifest.json).

Reproduce the denser scan with:

```sh
swift tools/scan_video_move_counter.swift \
  research/solitaire-master/source-videos/gLd0HXtDt5I.mp4 \
  research/solitaire-master/auto-hint-full-video-scan-2026-11-25/move-counter-every-second.csv \
  10 1 1042
```

Re-run the scan after placing the source video at the documented local path:

```sh
swift tools/scan_video_move_counter.swift \
  research/solitaire-master/source-videos/gLd0HXtDt5I.mp4 \
  /tmp/solitaire-move-counter-samples.csv
```

The full source video is intentionally ignored by Git; only its hash, scan output, and reproducible workflow are committed.

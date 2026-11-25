# Full-video Auto Hint idle scan

Source: [gameplay recording](https://www.youtube.com/watch?v=gLd0HXtDt5I), local file `source-videos/gLd0HXtDt5I.mp4`, SHA-256 `56489d4aac9256d15de461d236a990df361621363fdc2904341a0e8e9cb64928`. The source is 884×1920 at 60 fps, with PTS timescale 15,360 and duration 17:24.06.

The scan sampled the moves counter every four source seconds from 10 through 1,042 seconds. Apple Vision OCR read 230 of 259 samples; 29 samples were blank and are listed in the CSV but excluded from stable-counter runs. Exact requested/actual source timestamps, PTS, raw OCR text, and extracted move digits are recorded there. The OCR crop is `(740,296,120,90)` in source pixels, and `tools/scan_video_move_counter.swift` reproduces the CSV on macOS.

Three intervals had the same readable move count at three consecutive samples (8 seconds from first to last sample): 71 at 442–450 s, 84 at 478–486 s, and 87 at 638–646 s. No readable interval retained a constant count across four consecutive samples (12 seconds). This is only a coarse screen-state filter: four-second sampling can miss brief actions followed by undo or other transitions, and a steady move counter does not prove every pixel of the board stayed unchanged.

The 87-move interval matches the focused source review: frames at 636, 641, and 646 s show the same board and no visible Auto Hint; the next move is visible by 648 s. The recording therefore rules out a five-second hint delay for this observed idle window, but it never shows the source Auto Hint firing. The web version's 12-second delay remains an explicit conservative inference, not an exact source measurement.

Re-run the scan after placing the source video at the documented local path:

```sh
swift tools/scan_video_move_counter.swift \
  research/solitaire-master/source-videos/gLd0HXtDt5I.mp4 \
  /tmp/solitaire-move-counter-samples.csv
```

The full source video is intentionally ignored by Git; only its hash, scan output, and reproducible workflow are committed.

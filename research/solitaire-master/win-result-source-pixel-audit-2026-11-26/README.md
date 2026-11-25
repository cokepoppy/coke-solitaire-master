# Win result source pixel audit

This audit compares the mobile web result screen against the 310-second frame of the 884×1920 gameplay recording. The source video is `research/solitaire-master/source-videos/gLd0HXtDt5I.mp4` (SHA-256 `56489d4aac9256d15de461d236a990df361621363fdc2904341a0e8e9cb64928`). The selected frame is PTS 4,761,600 at time scale 15,360 (310.000 seconds); its decoded PNG SHA-256 is `a09af0132a4bd4fcd594e7560e731104435aaae6e94c4400e2b67d26db510b9d`.

The browser test reproduces the visible values from that frame (score 5,223, time 02:13, moves 121, trophies 2) at 442×960 CSS pixels and device scale factor 2. It asserts each source sprite's pixel-space bounds, waits for image decoding, and saves `test-results/source-win-result-884x1920.png`. The four fixed text labels are exact RGB crops from the source frame. The observed large `5`, two `2`s, and `3` score glyphs are source crops; other score digits, time, moves, and local win count remain dynamic. The Best badge appears when the local score is a new best.

## Reproduce

```sh
swift tools/extract_video_window.swift \
  research/solitaire-master/source-videos/gLd0HXtDt5I.mp4 \
  310 310 1 /tmp/solitaire-win-result-source
python3 tools/extract_win_result_background.py \
  /tmp/solitaire-win-result-source/frame-00000-req-310.000000-pts-4761600.png \
  assets/ui/win-result-background-reference.png
python3 tools/extract_win_result_score_glyphs.py \
  /tmp/solitaire-win-result-source/frame-00000-req-310.000000-pts-4761600.png \
  assets/ui/win-result-background-reference.png assets/ui
npx playwright test -g "result artwork aligns with the 310-second source frame"
python3 tools/compare_screenshots.py \
  /tmp/solitaire-win-result-source/frame-00000-req-310.000000-pts-4761600.png \
  test-results/source-win-result-884x1920.png \
  --output research/solitaire-master/win-result-source-pixel-audit-2026-11-26/pixel-diff.json \
  --region win-banner=75,420,734,460 \
  --region score-best=160,820,560,190 \
  --region result-lines=0,985,884,420 \
  --region trophy=320,1270,240,140 \
  --region new-deal=100,1380,684,210 \
  --region home-indicator=270,1860,344,60
```

The complete machine-readable report is in `pixel-diff.json`; neither screenshot input is committed. There is no resizing or ignored region in this measurement. The backdrop bridge and observed score sprites lower the full-screen mean absolute RGB error from 1.964960 to 1.054187 and raise the exact RGB pixel fraction from 82.068% to 86.352%. The score/Best area's MAE falls from 15.040 to 1.572. Other large result digits remain live browser text because they are not visible in the source capture; video compression, browser rasterization, and the native iOS home indicator also contribute to remaining error.

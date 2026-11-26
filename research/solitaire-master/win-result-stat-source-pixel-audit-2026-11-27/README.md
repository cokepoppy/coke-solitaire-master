# Win-result time and move value audit

This audit extracts the two dynamic values visible in the 310-second result frame of the third-party gameplay recording: time `02:13` and moves `121`. The source is `research/solitaire-master/source-videos/gLd0HXtDt5I.mp4`, SHA-256 `56489d4aac9256d15de461d236a990df361621363fdc2904341a0e8e9cb64928`. The decoded 884×1920 frame is PTS 4,761,600 at time scale 15,360 (310.000 s), PNG SHA-256 `a09af0132a4bd4fcd594e7560e731104435aaae6e94c4400e2b67d26db510b9d`.

The extracted rectangles preserve the source's 2× mobile pixel grid:

| Value | Source rectangle (x1,y1,x2,y2) | PNG dimensions | SHA-256 |
| --- | --- | --- | --- |
| Time `02:13` | `(471,1107,601,1152)` | 130×45 | `7060f5a1b628736bef0c2425c221782daf295e5dea0c90fa7e7dec3804c6a08b` |
| Moves `121` | `(471,1184,550,1229)` | 79×45 | `8518dddf82ba88ce240371740efb2e3262a278bff365b826f117685db9289ebd` |

The extractor estimates the dark-navy key color from the source result field and turns the white lettering into alpha sprites. The browser renders the source crops only when the live values exactly match `02:13` and `121`; all other game times and move counts stay dynamic text because the available recording does not show their glyph variants cleanly.

Recreate the source frame and sprites with:

```sh
swift tools/extract_video_window.swift research/solitaire-master/source-videos/gLd0HXtDt5I.mp4 \
  310 310 1 /tmp/solitaire-win-result-source
python3 tools/extract_win_result_stat_art.py \
  /tmp/solitaire-win-result-source/frame-00000-req-310.000000-pts-4761600.png assets/ui
npm run test:e2e -- --grep "result artwork aligns with the 310-second source frame"
```

The Playwright result-flow test reproduces score `5223`, time `02:13`, moves `121`, and trophy count `2`, then checks both stat sprites' native dimensions and exact source-frame origins. The full-screen browser/source comparison is in `pixel-diff.json`; the screenshot used for that report is regenerated at `test-results/source-win-result-884x1920.png`.

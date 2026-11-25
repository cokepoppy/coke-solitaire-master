# Winning streak source-frame comparison

This review compares the completed win-streak fan at 307.000 seconds in the gameplay recording with the mobile-web animation at the matching three-second point. It uses one source win, so the observed scatter is a visual sample rather than a rule for every deal.

## Reproduce

The source video is the ignored local file `research/solitaire-master/source-videos/gLd0HXtDt5I.mp4`, SHA-256 `56489d4aac9256d15de461d236a990df361621363fdc2904341a0e8e9cb64928`. Extract the 307-second frame and run the deterministic browser test:

```sh
swift tools/extract_video_window.swift \
  research/solitaire-master/source-videos/gLd0HXtDt5I.mp4 \
  307 307 1 /tmp/solitaire-win-clear-01s
npx playwright test --grep 'winning shows'
```

The source is 884×1920. For a visual comparison at the test's 390×844 CSS viewport, resize it to 390×847 and crop the last three rows. The web screenshot is written to the ignored `test-results/mobile-win-streak.png`; neither image derivative is committed.

## Measurements

| Measurement | Source | Web |
| --- | ---: | ---: |
| Bright title-pixel bounding box | `(47, 272)–(342, 323)` | `(47, 270)–(344, 312)` |
| Neutral card-pixel bounding box | `(0, 320)–(381, 671)` | `(1, 320)–(388, 677)` |
| Neutral card-pixel count | 37,324 | 36,440 |
| Median neutral luminance in the fan region | 0.2157 | 0.2209 |

For the card mask, pixels in rows 320–679 have mean RGB intensity above 0.18 and channel spread below 0.20. The luminance median uses neutral pixels with intensity above 0.08 and channel spread below 0.16 in the same region. The approximate fan extents and face brightness now match closely. A row scan still shows the web fan slightly too far right around row 440 and narrower on the right side around row 600; the source's individual card scatter remains unfinished.

The Playwright test also checks that all 52 card animations finish within three seconds, the lower-left card ends below and left of the upper-right card, and the title/reward/continue elements stay within the measured mobile bounds. Source video compression, font rasterization, and the game's card order remain visible sources of difference.

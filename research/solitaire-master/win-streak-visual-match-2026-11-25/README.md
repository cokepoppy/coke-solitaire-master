# Winning streak source-frame comparison

This review compares the completed win-streak fan at 307.000 seconds in the gameplay recording with the mobile-web animation. The source's first visible fan pixels appear at 303.500 s, the streak title is visible by 304.000 s, and the cards are settled at 307.000 s. The web fan now stays in motion after three seconds and settles at about 3.5 seconds. It uses one source win, so the observed scatter is a visual sample rather than a rule for every deal.

## Reproduce

The source video is the ignored local file `research/solitaire-master/source-videos/gLd0HXtDt5I.mp4`, SHA-256 `56489d4aac9256d15de461d236a990df361621363fdc2904341a0e8e9cb64928`. Extract the 303.2–307.2 s sequence at 100 ms intervals and the 307-second comparison frame, then run the deterministic browser test:

```sh
swift tools/extract_video_window.swift \
  research/solitaire-master/source-videos/gLd0HXtDt5I.mp4 \
  303.2 307.2 0.1 /tmp/solitaire-win-streak-transition
swift tools/extract_video_window.swift \
  research/solitaire-master/source-videos/gLd0HXtDt5I.mp4 \
  307 307 1 /tmp/solitaire-win-clear-01s
npx playwright test -g 'winning shows a result card'
python3 tools/compare_win_streak_fan.py \
  /tmp/solitaire-win-clear-01s/frame-00000-req-307.000000-pts-4715520.png \
  test-results/mobile-win-streak.png
```

The source is 884×1920. For a visual comparison at the test's 390×844 CSS viewport, resize it to 390×847 and crop the last three rows. The web screenshot is written to the ignored `test-results/mobile-win-streak.png`; neither image derivative is committed.

## Measurements

| Measurement | Source | Web |
| --- | ---: | ---: |
| Bright title-pixel bounding box | `(47, 272)–(342, 323)` | `(47, 270)–(344, 312)` |
| Neutral card-pixel bounding box | `(0, 320)–(381, 671)` | `(1, 320)–(385, 679)` |
| Neutral card-pixel count | 37,322 | 38,069 |
| Source/web card-mask intersection over union | — | `0.3936` (`0.3235` before this pass) |
| RGB MAE on source card-mask pixels | — | `0.0729` (`0.0854` before this pass) |

The mask uses pixels in rows 320–679 with mean RGB intensity above 0.18 and channel spread below 0.20. The web uses the source-visible Hearts, Diamonds, Spades, Clubs fan order. A parameter sweep of the card endpoints reduced the masked source-pixel MAE by 14.6% and improved mask IoU by 21.7% over the prior `main` rendering. The normalized endpoint map is `x = -15% + 25% × suitIndex + 40% × rankProgress` and `y = 72.5% - 9% × suitIndex - 24% × rankProgress`, with the existing low-rank stack and small lower-left curve. The 41-frame mask counts, source PTS values, and PNG hashes are in [`frames-100ms.csv`](frames-100ms.csv). The individual card scatter remains an approximation; the recording captures only one completed deal.

The settled 307-second source frame also shows all four foundation slots empty behind the fan. The replica now hides those four displayed top cards for the win sequence while retaining the complete 13-card piles in game state; the win-flow browser test checks both the empty display and preserved piles, then checks that a new deal restores normal empty-slot art.

The Playwright test checks that all 52 cards appear in the observed suit groups, animation is still active after three seconds, the cascade then finishes, and the title/reward/continue elements stay within the measured mobile bounds. Source video compression, font rasterization, and deal-specific card positions remain visible sources of difference.

# Winning streak source-frame comparison

This is the historical source-frame and fan-endpoint fit from 2026-11-26. The source-driven foundation origins and King-to-Ace suit timing calibrated on 2026-11-27 are documented in the [current flight timing audit](../win-streak-foundation-flight-2026-11-27/README.md). Measurements below describe the earlier shared-origin animation and its endpoint fit; the recorded scatter remains a visual sample from one completed deal, not a rule for every deal.

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
python3 tools/compare_win_streak_timeline.py \
  /tmp/solitaire-win-streak-transition \
  test-results/win-streak-timeline
python3 tools/compare_win_streak_fan.py \
  /tmp/solitaire-win-clear-01s/frame-00000-req-307.000000-pts-4715520.png \
  test-results/mobile-win-streak.png
```

The source is 884×1920. For a visual comparison at the test's 390×844 CSS viewport, resize it to 390×847 and crop the last three rows. The win-flow E2E captures 36 browser screenshots at 100 ms intervals under the ignored `test-results/win-streak-timeline/` directory, and saves the settled web frame as `test-results/mobile-win-streak.png`; neither image derivative is committed.

## Measurements

| Measurement | Source | Web |
| --- | ---: | ---: |
| Title crop display bounds | `(45, 270)–(345, 326)` | `(45, 270)–(345, 326)` |
| Neutral card-pixel bounding box | `(0, 320)–(381, 671)` | `(1, 320)–(385, 679)` |
| Neutral card-pixel count | 37,322 | 38,124 |
| Source/web card-mask intersection over union | — | `0.3942` (`0.3235` before this pass) |
| RGB MAE on source card-mask pixels | — | `0.0720` (`0.0854` before this pass) |
| Mean mask IoU across 36 transition frames | — | `0.2595` (`0.2361` before motion matching) |
| Neutral-pixel count MAE across 36 frames | — | `3,700` (`5,172` before motion matching) |

The title now uses a transparent 680×126 source crop from PTS 4,715,520 instead of browser-rendered text. At the 390×844 viewport it displays at 300×55.6 CSS pixels from `(45, 270)`, matching the source crop's scaled coordinates; the win-flow E2E checks its loaded dimensions and measured bounds. The first sampled fan pixels at 303.500 s are centered at `(241, 320)` in the 390 px viewport. Cards now begin from that shared origin (`left: 55%`, `top: 36.3%`) and use `rankIndex × 100 ms + suitIndex × 250 ms` delays with a 1.55 s flight, preserving the existing 3.5 s settle time. The title starts at 120 ms, the reward at 200 ms, and the board dim reaches its source level over 200 ms. The result transition is set to 4.5 s, matching the 303.5–308.0 s source interval. Card endpoint coordinates remain unchanged. The neutral-card mask spans rows 320–679 and includes the title's small overlap at its top edge.

The mask uses pixels in rows 320–679 with mean RGB intensity above 0.18 and channel spread below 0.20. The web uses the source-visible Hearts, Diamonds, Spades, Clubs fan order. Across the 36 samples, the timed change raised mean mask IoU from 0.2361 to 0.2595 and lowered neutral-pixel count MAE from 5,172 to 3,700. The settled-frame endpoint sweep reduced masked source-pixel MAE by 14.6% and improved mask IoU by 21.7% over the earlier rendering. The normalized endpoint map is `x = -15% + 25% × suitIndex + 40% × rankProgress` and `y = 72.5% - 9% × suitIndex - 24% × rankProgress`, with the existing low-rank stack and small lower-left curve. The 41-frame mask counts, source PTS values, and PNG hashes are in [`frames-100ms.csv`](frames-100ms.csv), and the current source-to-web metrics are in [`timeline-comparison-2026-11-26.json`](timeline-comparison-2026-11-26.json). The timeline metric is directional: the automated web win fixture has four Kings on an otherwise empty tableau, while the recorded source still shows its completed tableau, so underlying board pixels also affect the comparison. Individual card scatter remains an approximation; the recording captures only one completed deal.

The settled 307-second source frame also shows all four foundation slots empty behind the fan. The replica now hides those four displayed top cards for the win sequence while retaining the complete 13-card piles in game state; the win-flow browser test checks both the empty display and preserved piles, then checks that a new deal restores normal empty-slot art.

The Playwright test checks that all 52 cards appear in the observed suit groups, animation is still active after three seconds, the cascade then finishes, and the title/reward/continue elements stay within the measured mobile bounds. Source video compression, browser rasterization, and deal-specific card positions remain visible sources of difference.

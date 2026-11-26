# Source-timed win-streak foundation flights

This pass rechecked the winning-streak fan against the official gameplay recording at 303.2–307.2 seconds. The local source MP4 is 884×1920, 60 fps, PTS time scale 15,360, and SHA-256 `56489d4aac9256d15de461d236a990df361621363fdc2904341a0e8e9cb64928`. It is the ignored local file `research/solitaire-master/source-videos/gLd0HXtDt5I.mp4`; extracted PNGs and browser captures stay in `/tmp` and `test-results/`.

## Evidence and timing

The 100 ms source frames show the cascade leaving the foundations in this order: Clubs, Diamonds, Hearts, Spades. The cards leave King-to-Ace. The sampled top cards give these timing anchors relative to the completed win at about 303.2 s:

| Source time | Visible top cards | Approximate cascade time |
| --- | --- | ---: |
| 304.0 s | Clubs A, Diamonds K | 0.8 s |
| 304.2 s | Diamonds J | 1.0 s |
| 304.4 s | Diamonds 8 | 1.2 s |
| 304.6 s | Diamonds 4 | 1.4 s |
| 305.0 s | Hearts J | 1.8 s |
| 305.2 s | Hearts 7 | 2.0 s |
| 305.4 s | Hearts 4 | 2.2 s |
| 305.8 s | Spades 10 | 2.6 s |
| 306.0 s | Spades 7 | 2.8 s |
| 307.0 s | settled 52-card fan | 3.8 s |

The browser now uses 60 ms rank steps and foundation-index start delays `[2420, 1680, 900, 0]` ms for Spades, Hearts, Diamonds, Clubs. The last card starts at 3.14 s and its 620 ms flight ends at 3.76 s. Each card starts at its actual foundation slot in the compact mobile layout; this keeps the flight attached to the visible board after the user-requested removal of the large top gap. The fan still settles into the measured Hearts, Diamonds, Spades, Clubs arrangement.

The timing estimates come from one recorded deal and 100 ms samples, so individual anchors have roughly one-frame uncertainty. The E2E drives four real tableau-to-foundation clicks, verifies all 52 card origins, checks every card's schedule against the measured per-suit and per-rank offsets, captures 39 mobile screenshots at 100 ms intervals, and checks that all flights finish before the result transition.

## Comparison and remaining differences

The timeline comparison uses the source interval 303.2–307.0 s and the 390×844 browser viewport. The current broad neutral-card mask reports mean IoU `0.1731` and neutral-pixel-count MAE `2,946` across 39 frames. Treat these as directional measures: the source recording has its status row and foundation origins about 100 px lower than the compact web board, and the separate background dim/title animation changes the card pixels. At the settled 307 s frame, the fan endpoint fit remains `0.4112` IoU with the title/reward region excluded; the mid-flight origins now follow the actual browser foundations.

The source begins its result transition around 307.8 s: the small “YOU WIN” text appears by 308.0 s, the banner is visible by 308.1 s, and the score counts upward from 3,614 to 5,223 through about 309.4 s. The web result card currently switches in at 4.8 s with a static score, and the captured win audio begins at 308.180 s while the web cue starts with the card switch at 308.0 s. The source-based result entrance, score count-up, and 180 ms audio offset remain follow-up work.

## Reproduce

```sh
swift tools/extract_video_window.swift \
  research/solitaire-master/source-videos/gLd0HXtDt5I.mp4 \
  303.2 307.2 0.1 /tmp/solitaire-win-streak-100ms
npx playwright test -g 'winning shows a result card and records a completed daily challenge'
python3 tools/compare_win_streak_timeline.py \
  /tmp/solitaire-win-streak-100ms \
  test-results/win-streak-timeline \
  --exclude-fixed-overlays \
  --json-output /tmp/win-streak-timeline-comparison.json
```

# Source opening visual comparison

This comparison measures the web replica against the 20-second frame from the 60 fps portrait gameplay recording. It checks a fixed, reproducible opening state at the original 884×1920 pixel size and does not resize either image.

## Inputs

- Source video: `https://www.youtube.com/watch?v=gLd0HXtDt5I`
- Local video: `research/solitaire-master/source-videos/gLd0HXtDt5I.mp4` (ignored by Git)
- Video SHA-256: `56489d4aac9256d15de461d236a990df361621363fdc2904341a0e8e9cb64928`
- Source frame: requested 20.000000 s, PTS 307200, source time scale 15360, 884×1920
- Web frame: `test-results/source-opening-replay.png`, captured by the deterministic Playwright opening replay at 442×960 CSS pixels and test-scoped `deviceScaleFactor: 2`
- The replay sets the same cards, exposed cards, score, move count, and timer as the source frame. It marks the one-time first-move tutorial as already shown, matching the source's 20-second state.

The PNG inputs are local derivatives and are not committed. The video extraction manifest and screenshot test provide their provenance and regeneration steps.

## Reproduce

From the repository root, extract the source frame and run the focused browser test:

```sh
swift tools/extract_video_window.swift \
  research/solitaire-master/source-videos/gLd0HXtDt5I.mp4 \
  20 20 1 /tmp/solitaire-source-20s
npx playwright test -g "source opening replay matches"
```

Then compare the newly extracted source frame and browser screenshot:

```sh
python3 tools/compare_screenshots.py \
  /tmp/solitaire-source-20s/frame-00000-req-020.000000-pts-307200.png \
  test-results/source-opening-replay.png \
  --output research/solitaire-master/source-opening-visual-match-2026-11-25/pixel-diff.json \
  --ignore ios-home-indicator=280,1885,330,25 \
  --region header=0,240,884,160 \
  --region foundation_stock=0,400,884,240 \
  --region tableau=0,640,884,410 \
  --region empty_bg=0,1050,884,550 \
  --region bottom_controls=0,1600,884,320
```

## Results

| Region | Mean absolute RGB error |
| --- | ---: |
| Full image | 5.421620 |
| Full image with the iOS home indicator masked | 5.020332 |
| Header | 7.221828 |
| Foundations and stock | 4.633814 |
| Tableau | 11.718549 |
| Empty background | 2.340421 |
| Bottom controls | 4.755362 |

The default felt action row uses state-matched 844×224 source crops positioned at native scale in this 2× browser viewport; the buttons remain clickable through the pointer-transparent sprites. Its bottom-controls error fell from 14.617496 to 4.755362. An earlier spatial scan found the foundation/stock row one output pixel too low, so `.top-row` was raised by 0.5 CSS px; the source replay checks that foundation coordinate. This reduced foundation/stock error from 6.466442 to 4.633814 and full masked-frame error from 5.319615 to 5.090536. The subsequent tableau-grid adjustment aligns all seven column origins to the source frame. At the 442 CSS-pixel replay width, the card width renders at about 118×177 device pixels, matching the source card crops' native size. The mask covers only the iPhone home indicator visible in the source recording; the Chrome page has no corresponding operating-system element. Source H.264 compression and browser text/image rasterization contribute to the remaining pixel error. This is a measured one-frame comparison, not evidence that every screen, animation, or audio cue is pixel-perfect.

The source menu crop is 72×74 pixels and was previously squeezed into a 72×72 box. It now renders at 36×37 CSS pixels with a half-pixel offset in the 2× source replay. The menu crop remains aligned at its recorded origin; header-region error fell from 7.661925 to 7.221828. The source tableau card origins are `(8, 133, 258, 383, 508, 633, 758)` at 884×1920. The grid now rounds to those same device-pixel origins, reducing tableau error from 11.875565 to 11.718549 and full masked-frame error from 5.053861 to 5.020332. The E2E replay checks the menu origin, menu dimensions, and seven tableau positions. This remains a measured comparison of one static frame.

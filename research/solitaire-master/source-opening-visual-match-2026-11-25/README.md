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
| Full image | 5.720903 |
| Full image with the iOS home indicator masked | 5.319615 |
| Header | 7.661925 |
| Foundations and stock | 6.466442 |
| Tableau | 11.875565 |
| Empty background | 2.340421 |
| Bottom controls | 4.755362 |

The default felt action row now uses state-matched 844×224 source crops positioned at native scale in this 2× browser viewport; the buttons remain clickable through the pointer-transparent sprites. Its bottom-controls error fell from 14.617496 to 4.755362, and the full masked-frame error fell from 6.978345 to 5.319615. At the 442 CSS-pixel replay width, the card width is tuned to render at about 118×177 device pixels, matching the source card crops' native size. This reduced full-frame error from 5.735950 to 5.720903 and tableau error from 11.977231 to 11.875565 compared with the prior sizing. The mask covers only the iPhone home indicator visible in the source recording; the Chrome page has no corresponding operating-system element. Source H.264 compression and browser text/image rasterization contribute to the remaining pixel error. This is a measured one-frame comparison, not evidence that every screen, animation, or audio cue is pixel-perfect.

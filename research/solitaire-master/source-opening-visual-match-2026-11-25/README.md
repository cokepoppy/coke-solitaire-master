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
| Full image | 7.379634 |
| Full image with the iOS home indicator masked | 6.978345 |
| Header | 7.661925 |
| Foundations and stock | 6.419474 |
| Tableau | 11.977231 |
| Empty background | 2.337637 |
| Bottom controls | 14.617496 |

The mask covers only the iPhone home indicator visible in the source recording; the Chrome page has no corresponding operating-system element. Source H.264 compression and browser text/image rasterization contribute to the remaining pixel error. The low error on the empty felt and card layout supports a close match of this static frame; the higher tableau and control errors remain useful targets for local alignment and artwork review. This is a measured one-frame comparison, not evidence that every screen, animation, or audio cue is pixel-perfect.

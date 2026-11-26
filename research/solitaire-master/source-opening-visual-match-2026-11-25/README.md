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
  --region bottom_controls=0,1600,884,320 \
  --region score=105,295,215,100 \
  --region timer=310,285,340,105 \
  --region moves=640,295,215,100
```

## Results

| Region | Mean absolute RGB error |
| --- | ---: |
| Full image | 3.787956 |
| Full image with the iOS home indicator masked | 3.386667 |
| Header | 3.439880 |
| Foundations and stock | 3.820436 |
| Tableau | 9.440155 |
| Empty background | 0.263135 |
| Bottom controls | 4.502385 |
| Score panel | 7.972357 |
| Timer panel | 4.009655 |
| Moves panel | 7.465659 |

The default felt action row uses state-matched 844×224 source crops positioned at native scale in this 2× browser viewport; the buttons remain clickable through the pointer-transparent sprites. Its bottom-controls error fell from 14.617496 to 4.502385 after matching the field color. Fourteen exact-time source frames from 9–22 s place the unobstructed felt at RGB `(14,116,65)`; matching that center color reduces empty-background error from 2.340421 to 0.263135, with 92.54% exact RGB matches in that region. The score and moves panels use the measured source fill `(15,95,49)`. The 320×100 timer crop now includes both complete leaf ornaments; at the 442 CSS-pixel replay width, it occupies the source bounds `(320,290,640,390)`. These changes reduce header MAE from 6.086404 to 3.439880; score and moves regions fall from 15.878264 to 7.972357 and from 16.493504 to 7.465659. The six card faces visible in the 20-second replay are direct AVFoundation crops from PTS 307200. The 5♦, Q♠, K♦, and J♦ are additional direct crops from PTS 153600 (10 s). Each PNG carries an sRGB profile without changing its RGB values, so Chrome renders the recorded source channels without a second profile conversion. Relative to the earlier unrefreshed card crops, tableau MAE falls from 11.099697 to 9.440155, masked full-frame MAE from 4.006699 to 3.397868, and exact RGB matches in the full masked image rise from 45.28% to 50.16%. The 20-second source frame PNG SHA-256 is `b5444a64ad16ed8465fcec42efa16d8afd236631d1cedbd5f4abd6364ef94e01`; the 10-second source frame PNG SHA-256 is `1eac5f82681bbf39378262383d91904318c3806799e5fa006d57039fac8145aa`; the video SHA-256 is recorded above. The 2× replay also asserts the source origins of all four foundation slots and seven tableau columns. At the 442 CSS-pixel replay width, the card width renders at about 118×177 device pixels, matching the source card crops' native size. The mask covers only the iPhone home indicator visible in the source recording; the Chrome page has no corresponding operating-system element. Source H.264 compression and browser rasterization contribute to the remaining pixel error. This is a measured one-frame comparison, not evidence that every screen, animation, or audio cue is pixel-perfect.

The opening stock at 24 cards now uses `back-solitaire-master-source-20s.png`, an exact 118×177 crop from the same PTS 307200 frame at `(758,429)`. This source-frame-specific stock art lowers full-image MAE from 3.799156 to 3.787956, masked full-image MAE from 3.397868 to 3.386667, and the foundations-and-stock region from 3.910043 to 3.820436. E2E verifies the crop's recorded hash and that the subpath release caches it offline.

The source menu crop is 72×74 pixels and was previously squeezed into a 72×72 box. It now renders at 36×37 CSS pixels with a half-pixel offset in the 2× source replay. The menu crop remains aligned at its recorded origin. The source tableau card origins are `(8, 133, 258, 383, 508, 633, 758)` at 884×1920, and the four empty foundations begin at `(8,429)`, `(133,429)`, `(258,429)`, and `(383,429)`. The E2E replay checks those origins, the menu position and size, and the exact felt gradient color. This remains a measured comparison of one static frame.

The follow-up 2× audit also places the face-up cards in tableau columns 4 and 6 at the source's fractional-grid pixel centers with a `0.25px` CSS left offset. The pile-column grid stays fixed; only those visible face cards move. In the 20-second replay this lowers tableau MAE from `9.440155` to `9.374513` and masked full-frame MAE from `3.386667` to `3.380511`. E2E verifies the court-card left origins `(383,383,383)` and Q♣ origin `633` at device-pixel precision. This small fit is specific to the measured 2× reference state and does not establish a universal offset for every viewport or deal.


## Compact mobile layout update

The source frame reserves a large plain-felt band above the menu. The web version collapses it at the user's request, including when a phone browser reports a wide layout viewport, moving the topbar and board up 131 CSS pixels (262 device pixels in this 2× replay); the bottom controls remain anchored. The region MAE table above and the original `pixel-diff.json` describe the earlier source-aligned layout, not the current whole-screen position. For current component comparisons, align the web header and board 262 device pixels downward before measuring; compare the bottom row at its existing coordinates.

The current 2× E2E pins the default-felt status icons to their source crop bounds after that shift: the crown is `[119,55,52,40]` and the move arrows are `[653,54,34,42]`. The source crops are from PTS 307200 at `(119,317,52,40)` and `(653,316,34,42)`, respectively.

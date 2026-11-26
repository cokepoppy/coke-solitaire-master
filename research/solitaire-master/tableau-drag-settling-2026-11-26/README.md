# Tableau drag settling frames

This audit samples the first source-recorded tableau drag at the video's native 60 fps. It separates the user's drag motion from the card's final settled position, so the replica's snap animation is not tuned from a single before/after screenshot.

## Source

- Video: [Solitaire Master gameplay](https://www.youtube.com/watch?v=gLd0HXtDt5I)
- Local source: `research/solitaire-master/source-videos/gLd0HXtDt5I.mp4`
- SHA-256: `56489d4aac9256d15de461d236a990df361621363fdc2904341a0e8e9cb64928`
- Native frame size: 884×1920; PTS time base: 1/15360
- Sample range: 13.050–13.166667 seconds, one frame every 1/60 second
- Eight PNG frame hashes and exact PTS values: [`frames.csv`](frames.csv), [`manifest.json`](manifest.json)

## Observation

At PTS 200448 (13.050 s), 4♣ is selected at its source pile. It leaves that position by PTS 200704 (13.066667 s); the card is still visibly moving through PTS 201472 (13.116667 s). By PTS 201728 (13.133333 s), it has settled on 5♦ at the destination position `(8, 732)` and remains there through the last sampled frame at PTS 202240 (13.166667 s).

These frames bound the visible drag and settling sequence, but they do not expose the player's exact pointer-release time. They therefore do not justify changing the replica's 50 ms post-release card flight. The reproducible 20-second opening replay separately checks the final source position and its retained vertical offset.

## Newly revealed-card highlight

The same opening exposes Q♣ in tableau column 6. Native 60 fps crops in [`reveal-glow/source-crops`](reveal-glow/source-crops/) show its gold edge and green underglow shortly after the 13.083333 s reveal. The highlight is still bright at 13.166667 s, fades across the samples at 13.25–13.416667 s, and is effectively gone by 13.5 s. The crop-ledger records the exact PTS and frame hashes.

The replica starts the highlight when the 50 ms face-reveal animation ends, then fades it over 420 ms. A source-sized Playwright replay pauses both glow layers at 50 ms, saves glow and no-glow frames, and verifies both have faded by 430 ms. The user's top-gap reduction shifts the replica's Q♣ to `(633,482)` in the 884×1920 screenshot, while the source card is at `(633,744)`. To isolate the reveal effect, the [comparison image](reveal-glow/source-vs-web-card-crop.png) and [pixel-diff report](reveal-glow/pixel-diff.json) align the 150×190 card crop from source PTS 201728 (source crop origin `(610,720)`) with the replica crop at `(610,458)`. Splitting the bright gold/green rim from the 55%-opacity multiply tint lowers mean absolute RGB error from 34.568281 without glow to 28.847123 with it. The layout shift makes whole-screen vertical alignment unsuitable for this comparison; the local crop shows a measured improvement, not proof that every reveal matches identically.

## Reproduce

```sh
swift tools/extract_video_window.swift \
  research/solitaire-master/source-videos/gLd0HXtDt5I.mp4 \
  13.05 13.183335 0.016667 /tmp/solitaire-tableau-drag-settling
```

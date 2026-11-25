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

## Reproduce

```sh
swift tools/extract_video_window.swift \
  research/solitaire-master/source-videos/gLd0HXtDt5I.mp4 \
  13.05 13.183335 0.016667 /tmp/solitaire-tableau-drag-settling
```

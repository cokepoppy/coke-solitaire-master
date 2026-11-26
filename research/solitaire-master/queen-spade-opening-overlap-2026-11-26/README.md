# Opening Queen of Spades overlap

This audit checks the vertical overlap of Q♠ in the recorded first playable deal and corrects the corresponding teaching deal in the mobile replica.

## Source frames

- Video: [Solitaire Master gameplay](https://www.youtube.com/watch?v=gLd0HXtDt5I)
- Local source: `research/solitaire-master/source-videos/gLd0HXtDt5I.mp4`
- SHA-256: `56489d4aac9256d15de461d236a990df361621363fdc2904341a0e8e9cb64928`
- Frame size: 884×1920 at 60 fps; PTS time base: 1/15360
- Opening frame: PTS 153600 / 10.000 s; decoded RGB SHA-256: `5afae4b81510d9553447c58cf7ff070270dbd140ba8dfa635a1b2a58173abd8a`
- Follow-up frame: PTS 199680 / 13.000 s; decoded RGB SHA-256: `7b728c89f6ea7a32b1a9408001879caf80a3a660cb0bea77dd2c80c4f8840481`
- Both PTS entries are preserved in [`gameplay-opening-2025/frames.csv`](../gameplay-opening-2025/frames.csv).

## Measurement and change

In both sampled frames, the Q♠ crop begins at `(133, 679)` and remains fixed before the first recorded move. The face-down card above begins near y=646, for a visible vertical step of about 33 source pixels. At the 442×960 CSS viewport rendered at device scale 2, the replica's generic face-up stack step put Q♠ at y=670. The opening teaching deal now records a per-card `tableauOffsetRatio` of `0.19`, placing the card at `(133, 679)` while preserving normal stack spacing in subsequent deals.

The source-sized Playwright test asserts the Q♠ origin and its captured face asset. This is a measured adjustment for the recorded opening deal; it does not establish that every original game installation uses this exact deal.

## Reproduce

Extract the opening frames from the local MP4 with the existing source-rate workflow, then run the source-sized visual test:

```sh
swift tools/extract_video_window.swift \
  research/solitaire-master/source-videos/gLd0HXtDt5I.mp4 \
  10 13.016667 3 /tmp/solitaire-opening-overlap

npm run test:e2e -- --grep "fresh-deal Queen of Spades"
```

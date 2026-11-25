# Tableau card drop positions

The source game preserves the vertical position where a dragged card lands. A fixed face-up stack step cannot reproduce the opening replay after a player moves a card.

## Source measurements

- Recording: `research/solitaire-master/source-videos/gLd0HXtDt5I.mp4`
- SHA-256: `56489d4aac9256d15de461d236a990df361621363fdc2904341a0e8e9cb64928`
- Native frame: 884×1920, PTS time base 1/15360.
- The sampled frame ledger for 17.8–20.0 s is [`source-frame-ledger.json`](source-frame-ledger.json); regenerate it with `swift tools/extract_video_window.swift research/solitaire-master/source-videos/gLd0HXtDt5I.mp4 17.8 20.0 0.05 /tmp/solitaire-source-move-18-to-20`.

The first move is visible in the existing [13-second frame ledger](../tableau-move-2026-11-25/frames.csv). By 13.100 s (PTS 201216), the 4♣ has settled at `(8,732)`, 86 source pixels below the 5♦ at `(8,646)`. At 18.300 s (PTS 281088), Q♠ is at `(383,814)`, 95 pixels below K♦ at `(383,719)`. At 19.300 s (PTS 296448), J♦ is at `(383,888)`, 74 pixels below Q♠. Those positions remain stable through the sampled frames at 19.5–20.0 s. The differing gaps are direct visual evidence; the interpretation that the app retains the user's drop position is an inference about its layout behavior.

## Replica behavior

When a pointer drag ends on a tableau pile, the replica stores the dropped card's top position relative to that pile, normalized by card height. A dragged face-up sequence keeps its internal spacing. The position is included in game saves and undo snapshots, and moving the card again clears its old pile-relative value. Tap-to-move and automatic moves continue to use the normal stack spacing.

The source-opening Playwright replay now drags the three cards to their measured release positions and checks the resulting K♦/Q♠/J♦ pixel rows. Against the 20-second source frame, the tableau mean absolute error fell from 10.6188 to 9.4402 RGB levels; column 4 fell from 29.4743 to 20.6537, and masked whole-screen error fell from 3.9027 to 3.6184. The video is H.264-compressed and the comparison covers one source state, so these measurements do not establish that all game states or animations are pixel-identical.

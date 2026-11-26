# Solitaire Master standard scoring audit

The source is the third-party gameplay recording at [YouTube](https://www.youtube.com/watch?v=gLd0HXtDt5I), saved locally as `source-videos/gLd0HXtDt5I.mp4`. Its SHA-256 is `56489d4aac9256d15de461d236a990df361621363fdc2904341a0e8e9cb64928`; it is 884×1920 at 60 fps with a 15,360 PTS timescale. The source Settings screen shows **Standard** scoring as the default. It is useful evidence of recorded behavior, not first-party confirmation.

`score-moves-half-second.csv` is the coarse first pass from 10–180 seconds at 500 ms intervals; it records the score and move counter. `score-moves-quarter-second.csv` is the focused follow-up at 250 ms intervals and also records the displayed timer. The current macOS Vision scanner records requested time, actual decoded time, source PTS, and OCR text/digits from all three fields. It reads score pixels `(195,300,120,85)`, timer pixels `(400,296,120,90)`, and move-counter pixels `(740,296,120,90)`. Reproduce the focused scan with:

```sh
swift tools/scan_video_score_and_moves.swift \
  research/solitaire-master/source-videos/gLd0HXtDt5I.mp4 \
  /tmp/score-moves-quarter-second.csv 20 0.25 66
```

The retained source header crops are 884×120 pixels from y=280. Their exact PTS and PNG hashes are listed in [`frames/frames.csv`](frames/frames.csv).

The opening reference replay reaches score 30 at timer `00:07`, with 3 moves (source PTS 307,200). Its three reconstructed tableau moves each add 10 points: +5 for the move and +5 for turning over the next tableau card. At timer `00:10`, the score is 28 while the move counter remains 3 (PTS 349,440). Further samples show score 46 at `00:20` with 7 moves, 94 at `00:30` with 13 moves, 132 at `00:40` with 17 moves, and 170 at `00:50` with 25 moves. Immediately after the `00:30` deduction, the score rises from 94 to 104 as the move counter advances from 13 to 14. These sequences isolate a **2-point deduction every 10 seconds of game time**, independent of move count.

`SolitaireGame.tick()` now applies that Standard-mode deduction and keeps the visible score sprites in sync. A mobile Chrome test advances the timer through `00:10`, checks the score changes from 30 to 28, then switches to Vegas and confirms that the score does not incur a timed deduction at `00:20`.

The recording does not expose a low-score timer tick, so it cannot establish whether the source clamps the time deduction at zero. The replica retains its existing minimum-zero score behavior. The recording also does not show a Vegas deal; Vegas timer behavior follows the usual no-time-penalty convention rather than direct target-app evidence.

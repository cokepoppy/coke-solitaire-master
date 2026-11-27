# Conflicting `COMBO 2` foundation rewards

The source is the third-party gameplay recording at [YouTube](https://www.youtube.com/watch?v=gLd0HXtDt5I), saved locally as `source-videos/gLd0HXtDt5I.mp4`. Its SHA-256 is `56489d4aac9256d15de461d236a990df361621363fdc2904341a0e8e9cb64928`; the video is 884×1920 at 60 fps with a 15,360 PTS timescale. The extracted full-resolution frames and their PTS and PNG hashes are listed in [`frames.csv`](frames.csv).

Two foundation moves show the same `COMBO 2` label and the same observed score/move delta, but different reward names:

| Event | Score and moves | Card/action | Feedback |
| --- | --- | --- | --- |
| 65.4 s | 200 → 220; 28 → 29 | 2♥ enters the heart foundation | `COMBO 2` is visible at 65.5 s; `Good` appears by 65.85 s. |
| 101.95 s | 484 → 504; 59 → 60 | 4♣ enters the club foundation | `COMBO 2` is visible by 102.3 s; `Great` appears at 102.5 s. |

The source `Good` composite matches the mixed recording at 65.5 s with normalized correlation `0.999073`; the source `Great` reward-only crop matches at 102.7 s with correlation `0.998612`. Both samples are documented in the [Good audio review](../foundation-good-audio-window-2026-11-25/README.md) and [Great audio review](../great-reward-audio-window-2026-11-25/README.md).

This contradicts a deterministic reward table keyed only by the visible combo number. The web implementation currently maps combo 1 to Good and combo 2 to Great in `src/app.js`; changing that table to make combo 2 always Good would break the second verified event. The two clips do not reveal whether another part of the action history, a hidden reward rule, or a recording artifact selects the tier. Keep the reward selection unchanged until another source event isolates that rule. The existing score OCR ledgers are in [`scoring-source-audit-2026-11-27`](../scoring-source-audit-2026-11-27/README.md).

## Reproduce the selected frames

```sh
swift tools/extract_video_window.swift \
  research/solitaire-master/source-videos/gLd0HXtDt5I.mp4 \
  65.05 65.9 0.05 /tmp/solitaire-combo-good-frames
swift tools/extract_video_window.swift \
  research/solitaire-master/source-videos/gLd0HXtDt5I.mp4 \
  101.8 102.6 0.1 /tmp/solitaire-combo-great-frames
```

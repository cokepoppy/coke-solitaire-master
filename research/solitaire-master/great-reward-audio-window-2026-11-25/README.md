# Foundation `Great` reward audio timing

This review aligns the source `Great` reward to the foundation move that triggers it, then checks the browser schedule against the source timeline.

## Source window

- Video: [Solitaire Master gameplay](https://www.youtube.com/watch?v=gLd0HXtDt5I)
- Video SHA-256: `56489d4aac9256d15de461d236a990df361621363fdc2904341a0e8e9cb64928`
- Video frames: 101.8–103.5 s in 100 ms steps; source PTS and PNG hashes are in `frames.csv` and `manifest.json`.
- Audio: 101.8–103.5 s from the locally decoded 44.1 kHz stereo track. This is mixed third-party audio, not an isolated original stem.

## Timing evidence

At 102.0 s, the score changes from 484 to 504 and the move count from 59 to 60 as the foundation action completes. `COMBO 2` is visible by 102.3 s, and the `Great` reward is visible by 102.5 s. The source `combo-great-reference.wav` begins at 102.700 s; the 50 ms envelope rises from RMS `0.0880` at 102.70 s to `0.2768` at 102.75 s and `0.1923` at 102.85 s.

Searching the 101.8–103.5 s source audio finds the Great sample at 102.700 s with normalized correlation `0.99861161`. In the same window, the generic foundation sample peaks at `0.02820573` and the move sample at `0.077122`. The Great sample is a reward-only crop that follows the foundation action, rather than an action-plus-reward composite like the `Good` event.

The web version keeps the generic foundation cue at move time and schedules `Great` 700 ms after the move. This aligns the captured reward transient at 102.7 s to the observed action at 102.0 s. The 700 ms interval is an inference from the mixed recording's source timeline; audio/video synchronization and visual changes are sampled at 100 ms resolution, so it should be treated as an approximate source delay. Playwright checks both the requested delay and the actual Web Audio buffer start offset.

## Reproduce

Regenerate the visual window and the 50 ms event envelope with:

```sh
swift tools/extract_video_window.swift \
  research/solitaire-master/source-videos/gLd0HXtDt5I.mp4 \
  101.8 103.5 0.1 /tmp/solitaire-great-event-frames
python3 tools/audio_similarity_audit.py \
  /tmp/solitaire-great-event-101_8-103_5.wav \
  assets/audio/card-move-reference.wav \
  assets/audio/foundation-reference.wav \
  assets/audio/combo-great-reference.wav \
  --output /tmp/great-event-audio-matches.json \
  --matches 6 --source-offset-seconds 101.8
```

The WAV crop is a 1.7-second PCM16 slice beginning at frame `round(101.8 × sample_rate)` in the locally decoded `/tmp/solitaire-master-reference-full.wav`. The retained audio envelope, frame PTS ledger, and correlation report make the analysis reproducible without committing the source video or PCM.

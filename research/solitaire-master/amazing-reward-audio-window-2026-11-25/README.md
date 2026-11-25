# Foundation `Amazing` reward timing

This review aligns the source `Amazing` reward with the move that triggers it and checks whether the existing 0.96-second crop duplicates the generic foundation cue.

## Source window

- Video: [Solitaire Master gameplay](https://www.youtube.com/watch?v=gLd0HXtDt5I)
- Video SHA-256: `56489d4aac9256d15de461d236a990df361621363fdc2904341a0e8e9cb64928`
- Full frames: 72.4–74.2 seconds in 100 ms steps; requested/actual PTS and PNG hashes are in `frames-100ms.csv` and `manifest-100ms.json`.
- Header/card-detail frames: 71.8–73.1 seconds in 50 ms steps, cropped to the HUD and foundation row; PTS and hashes are in `frames-50ms-header-crop.csv` and `manifest-50ms-header-crop.json`.
- Audio: 72.4–74.2 seconds from the locally decoded 44.1 kHz stereo track. This is mixed third-party audio, not an isolated original stem.

## Timing evidence

The move counter advances from 38 to 39 by 72.35 seconds. The `COMBO 4` label is visible by 72.70 seconds and the large `Amazing` reward is visible by 72.80 seconds. The 50 ms audio envelope rises at 72.85 seconds (RMS `0.0732`, peak `0.3521`), then has stronger peaks at 72.90–73.10 seconds (RMS reaches `0.4873` at 73.05 s) and a second transient around 73.55 seconds.

Scanning the full 72.4–74.2 second mixed window finds `combo-amazing-reference.wav` at 72.820 seconds with normalized correlation `0.99993679`. The generic foundation and card-move samples peak at `0.0404847` and `0.07167397`, respectively. The crop therefore matches the later reward event rather than the generic foundation sample. The web version keeps the foundation cue at move time and schedules this reward 500 ms after the action; the interval is rounded from the observed ~470 ms source difference and should be treated as approximate.

The cue remains a mixed-track excerpt. The correlation supports the source location of this exact waveform, not proof that the game used an isolated sound stem or that both transients have been separated from other audio.

## Reproduce

Regenerate the frame ledgers:

```sh
swift tools/extract_video_window.swift \
  research/solitaire-master/source-videos/gLd0HXtDt5I.mp4 \
  72.4 74.2 0.1 /tmp/solitaire-amazing-event-frames
swift tools/extract_video_window.swift \
  research/solitaire-master/source-videos/gLd0HXtDt5I.mp4 \
  71.8 73.1 0.05 /tmp/solitaire-amazing-event-frames-fine \
  18 280 860 420
```

Recreate the mixed-audio crop and match report from the decoded local source track:

```sh
python3 tools/extract_audio_reference.py /tmp/solitaire-master-reference-full.wav \
  /tmp/solitaire-amazing-event-72_4-74_2.wav --start 72.400 --end 74.200
python3 tools/audio_similarity_audit.py \
  /tmp/solitaire-amazing-event-72_4-74_2.wav \
  assets/audio/card-move-reference.wav \
  assets/audio/foundation-reference.wav \
  assets/audio/combo-amazing-reference.wav \
  --output /tmp/amazing-event-audio-matches.json \
  --matches 6 --source-offset-seconds 72.4
```

The retained envelope, frame PTS/hash ledgers, and correlation output make the comparison reproducible without committing the source video or decoded full-track PCM.

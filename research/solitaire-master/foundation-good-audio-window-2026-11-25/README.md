# Foundation `Good` reward audio review

This review checks whether a foundation move that triggers the source `Good` reward should also play the separate generic foundation sample.

## Source window

- Video: [Solitaire Master gameplay](https://www.youtube.com/watch?v=gLd0HXtDt5I)
- Video SHA-256: `56489d4aac9256d15de461d236a990df361621363fdc2904341a0e8e9cb64928`
- Visual review: 65.2–66.3 seconds in 100 ms steps; source PTS values and PNG hashes are in `frames.csv` and `manifest.json`.
- Audio review: 65.0–67.0 seconds from the locally decoded, mixed PCM track; extracted samples are not isolated stems.

## Evidence

The score and move counters advance at source time 65.4 seconds as the 2♥ enters a foundation. `COMBO 2` is visible at 65.5 seconds, and the `Good` banner first appears at 65.9 seconds. The 50 ms audio envelope rises at the move (`RMS 0.0904` at 65.5 s), remains elevated through 65.95 s, then grows into a second transient (`RMS 0.2807` at 66.05 s and `0.3307` at 66.10 s). The existing 65.5–66.3 s `combo-good-reference.wav` covers this entire action-and-reward window.

Matching that sample against the 65–67 s source window peaks at `0.999073` at 65.5 s. The existing generic `foundation-reference.wav` peaks at only `0.049637` in the same window, and the generic card-move sample peaks at `0.269418` at 65.046712 s. This does not prove the original game has no layered foundation sound, because the source track is mixed. It does show that the Good capture is an event-aligned composite and that adding the unrelated generic foundation crop would introduce an extra waveform absent from the matched Good window.

The web version therefore plays the `Good` composite alone for this tier. Other reward tiers keep their existing foundation-plus-reward behavior because comparable whole-event captures have not yet been isolated for those tiers. The browser test verifies the exact cue sequence for Good, Great, and Amazing separately. `audio-envelope-65-67.csv` retains all 41 source-aligned 50 ms RMS, peak, band-energy, and centroid rows used to inspect the two-stage event.

## Reproduce

Extract the visual window and regenerate the audio correlation report from the preserved local source recordings:

```sh
swift tools/extract_video_window.swift \
  research/solitaire-master/source-videos/gLd0HXtDt5I.mp4 \
  65.2 66.3 0.1 /tmp/solitaire-good-event-frames
python3 tools/audio_similarity_audit.py \
  /tmp/solitaire-good-event-65-67.wav \
  assets/audio/card-move-reference.wav \
  assets/audio/foundation-reference.wav \
  assets/audio/combo-good-reference.wav \
  --output /tmp/good-event-move-foundation-matches.json \
  --matches 6 --source-offset-seconds 65
```

The PCM crop can be recreated by seeking to 65 seconds in the locally decoded `/tmp/solitaire-master-reference-full.wav` and writing 88,200 stereo PCM16 frames. WAV review files and PNG source frames remain local; this repository records the source hashes, frame ledger, and correlation output.

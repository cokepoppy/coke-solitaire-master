# Invalid-move audio search

This pass checks whether the first 120 seconds of the recorded Hungry Studio gameplay contain an identifiable invalid-move cue. The source is the third-party [Solitaire Master gameplay recording](https://www.youtube.com/watch?v=gLd0HXtDt5I), SHA-256 `56489d4aac9256d15de461d236a990df361621363fdc2904341a0e8e9cb64928`. The exact 0–120 s PCM crop and its hashes are in [`window-extraction.json`](window-extraction.json); waveform-match results are in [`audio-matches.json`](audio-matches.json).

The known 0.38 s card-move sample matches at 18.040 s (correlation 1.000), 69.240 s (0.9979), 64.547 s (0.9942), 55.160 s (0.9931), 106.360 s (0.9930), and 107.640 s (0.9921). Integer-second move-counter OCR around these events generally shows the counter advancing in the same interval. These are consistent with successful actions and do not identify a rejected move.

The known generic tap sample has no strong match in this window. Its best listed candidate is 98.539 s at correlation 0.218; the next candidates are below 0.183. A 2.931 s candidate at 0.176 is visibly on the app's first-run terms/onboarding screen, not a game board; the retained frame is [`first-candidate-frame-2.9s.png`](first-candidate-frame-2.9s.png). Since the video mixes game and device audio, weak correlations and counter stability alone cannot label a sound as an invalid-move response.

No source-backed invalid-move cue was identified, so the replica's current procedural rejection feedback remains unchanged. A clean recording of an explicit rejected move, synchronized to its board frame, is still needed before matching that sound.

Reproduce the analysis:

```sh
python3 tools/extract_audio_window.py research/solitaire-master/source-videos/gLd0HXtDt5I.mp4 \
  --start 0 --end 120 --output /tmp/solitaire-audio-invalid-search-0-120.wav \
  --url 'https://www.youtube.com/watch?v=gLd0HXtDt5I'
python3 tools/audio_similarity_audit.py /tmp/solitaire-audio-invalid-search-0-120.wav \
  assets/audio/card-move-reference.wav assets/audio/ui-tap-reference.wav \
  assets/audio/stock-recycle-reference.wav assets/audio/draw-after-recycle-reference.wav \
  assets/audio/foundation-reference.wav --source-offset-seconds 0 --matches 6 \
  --output /tmp/solitaire-audio-invalid-search-matches.json
```

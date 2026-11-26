# Invalid-move audio search

This pass checks whether the first 120 seconds of the recorded Hungry Studio gameplay contain an identifiable invalid-move cue. The source is the third-party [Solitaire Master gameplay recording](https://www.youtube.com/watch?v=gLd0HXtDt5I), SHA-256 `56489d4aac9256d15de461d236a990df361621363fdc2904341a0e8e9cb64928`. The exact 0–120 s PCM crop and its hashes are in [`window-extraction.json`](window-extraction.json); waveform-match results are in [`audio-matches.json`](audio-matches.json).

The known 0.38 s card-move sample matches at 18.040 s (correlation 1.000), 69.240 s (0.9979), 64.547 s (0.9942), 55.160 s (0.9931), 106.360 s (0.9930), and 107.640 s (0.9921). Integer-second move-counter OCR around these events generally shows the counter advancing in the same interval. These are consistent with successful actions and do not identify a rejected move.

The known generic tap sample has no strong match in this window. Its best listed candidate is 98.539 s at correlation 0.218; the next candidates are below 0.183. A 2.931 s candidate at 0.176 is visibly on the app's first-run terms/onboarding screen, not a game board; the retained frame is [`first-candidate-frame-2.9s.png`](first-candidate-frame-2.9s.png). Since the video mixes game and device audio, weak correlations and counter stability alone cannot label a sound as an invalid-move response.

No source-backed invalid-move cue was identified, so the replica's current procedural rejection feedback remains unchanged. A clean recording of an explicit rejected move, synchronized to its board frame, is still needed before matching that sound.

## Full-recording cross-check

To check beyond the opening, a 10 ms transient pass covered the full 1,044 seconds and retained 581 separated high-band candidates in [`full-video-review/full-10ms-audio-candidates.json`](full-video-review/full-10ms-audio-candidates.json). Cross-checking those timestamps against the existing one-second move-counter OCR found 23 candidate windows with at least three readable, unchanged samples within ±2 seconds. These windows fall into seven event groups, documented with source frames, PTS values, and PNG hashes in [`candidate-frames.csv`](full-video-review/candidate-frames.csv).

Five groups (149.23–150.22, 305.02–306.63, 672.26–673.01, 828.21–829.47, and 1035.05–1036.66 s) occur while the screen shows the `Winning Streak` overlay. The other two apparent stable-counter cases are playable-board moves that the one-second OCR misread: the 697.600 s frame shows 8 moves and `COMBO 2`, and the 855.300 s frame shows 8 moves and `COMBO 7`. Their audio matches the known card-move sample at correlations 0.9644 (697.464 s) and 0.9921 (855.160 s); reports are [`move-match-697.json`](full-video-review/move-match-697.json) and [`move-match-855.json`](full-video-review/move-match-855.json). The seven sampled full-resolution frames are retained under [`full-video-review/frames/`](full-video-review/frames/).

This scan found no candidate that can be assigned to a rejected in-game move. It is bounded to separated transient candidates and a one-second OCR ledger; it does not prove that every quiet or masked touch in the mixed recording is represented. Do not infer an invalid-move sound from a sound peak alone.

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
python3 tools/extract_audio_window.py research/solitaire-master/source-videos/gLd0HXtDt5I.mp4 \
  --start 0 --end 1044 --output /tmp/solitaire-gameplay-full.wav \
  --url 'https://www.youtube.com/watch?v=gLd0HXtDt5I'
python3 tools/audio_event_audit.py /tmp/solitaire-gameplay-full.wav \
  --output /tmp/solitaire-invalid-full-audit \
  --url 'https://www.youtube.com/watch?v=gLd0HXtDt5I' \
  --video-sha256 56489d4aac9256d15de461d236a990df361621363fdc2904341a0e8e9cb64928 \
  --source-offset-seconds 0 --hop-ms 10 --max-events 5000
```

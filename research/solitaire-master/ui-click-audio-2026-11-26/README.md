# Cross-screen UI-tap sound match

This pass checks whether the short sound first captured while opening Themes is a gallery-only transition or a more general UI tap. The source is [gLd0HXtDt5I](https://www.youtube.com/watch?v=gLd0HXtDt5I), video SHA-256 `56489d4aac9256d15de461d236a990df361621363fdc2904341a0e8e9cb64928`.

The 313.0–317.5 s audio window is decoded as 44.1 kHz stereo PCM16. Its WAV SHA-256 is `8fcc58e2b7aa752c78f9cefd5e2c5c838a13be3a9197602bd0ae9ecfe818596c`. The synchronized 100 ms frame ledger shows the result screen at 313.0–314.1 s, the game board by 314.2 s, and Settings by 314.7 s. The screenshot series is in `control-transition-contact.jpg`; `frames.csv` retains the video PTS and frame hashes.

The 10 ms audio audit found transients peaking at 313.27, 314.51, and 315.19 s. The 0.24 s `ui-tap-reference.wav` crop from 322.580–322.820 s matches windows beginning at 313.193, 314.431, and 315.113 s with normalized correlations `0.9929`, `0.9598`, and `0.9911`. The `theme-gallery-select-reference.wav` clip reaches only `0.2869` absolute correlation against those events. The 314.431 s match precedes the Settings screen appearing at 314.7 s; the 313.193 s match falls on the result screen before the new board appears by 314.2 s. The 315.113 s event is not visually resolved. This repeat evidence supports using the first clip as the generic `tap` cue and keeping theme-preview selection separate.

The clips are event-aligned excerpts from a mixed gameplay recording, not isolated source stems. The correlation does not identify every button sound in the game. The app now uses the UI-tap crop for its existing `tap` events and the Theme-gallery entry; it retains the separate selection sample for category and appearance choices. Asset provenance and the theme-panel timing audit are in [`assets/audio/README.md`](../../../assets/audio/README.md) and [`theme-panel-audio-2026-11-26`](../theme-panel-audio-2026-11-26/README.md).

The extracted window, 10 ms event ledger, and waveform matches are preserved in `window-extraction.json`, `audio-audit/`, and `similarity-audit.json`. Recreate the time-aligned audio review from the source video with:

```sh
python3 tools/extract_audio_window.py \
  research/solitaire-master/source-videos/gLd0HXtDt5I.mp4 \
  --start 313 --end 317.5 --output /tmp/solitaire-ui-window-313-317.5.wav \
  --url 'https://www.youtube.com/watch?v=gLd0HXtDt5I'
python3 tools/audio_event_audit.py /tmp/solitaire-ui-window-313-317.5.wav \
  --output /tmp/solitaire-ui-window-313-317.5-audit \
  --source-offset-seconds 313 --hop-ms 10 --max-events 40
python3 tools/audio_similarity_audit.py /tmp/solitaire-ui-window-313-317.5.wav \
  assets/audio/ui-tap-reference.wav assets/audio/theme-gallery-select-reference.wav \
  --output /tmp/solitaire-ui-window-313-317.5-matches.json \
  --matches 10 --source-offset-seconds 313
```

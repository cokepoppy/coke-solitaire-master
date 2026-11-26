# Background music evidence

This audit checks whether the source gameplay recording contains an audible continuous background score. The source is the third-party [gLd0HXtDt5I gameplay video](https://www.youtube.com/watch?v=gLd0HXtDt5I), video SHA-256 `56489d4aac9256d15de461d236a990df361621363fdc2904341a0e8e9cb64928`.

The recorded 0–120 s window is 44.1 kHz stereo PCM16, measured in 2,400 consecutive 50 ms windows. The global RMS median is `0.00001166`; 1,453 windows (60.54%) are at or below `0.0001`, and 1,709 (71.21%) are at or below `0.001`. The longest run at or below `0.0001` lasts 9.8 seconds, from 3.45 to 13.25 seconds. `quiet-run.json` is the full threshold report; its input event ledger is [`gameplay-audio-opening-2025/audio-windows.csv`](../gameplay-audio-opening-2025/audio-windows.csv).

The first move sound appears near 13.176 seconds, after that near-silent stretch. This initial window provides no evidence of continuous audible BGM. A full-recording pass below reaches the same bounded conclusion for this video. The web replica keeps its optional synthesized chord-bed disabled and does not copy music from the official promo short. This recording may have game audio disabled, so it does not prove that the app itself has no music; leave music disabled until a source capture demonstrates it.

Reproduce the quiet-run report with:

```sh
python3 tools/audio_quiet_run_audit.py \
  research/solitaire-master/gameplay-audio-opening-2025/audio-windows.csv \
  --threshold 0.0001 0.001 0.01
```

## Full 17:24 recording pass

The complete 1044-second recording was decoded to 44.1 kHz stereo PCM16 and analyzed in 20,880 consecutive 50 ms windows. The decoded full-PCM SHA-256 is `69db2a5a1dd0b006f9f9df082578fed68f5f1550c1c4eb87e7198584e3f3fa64`; the exact 0–1044 s analysis crop SHA-256 is `035f2b43e6e467a511feb1ce36dc9ea9cbdf87a6f8e3e3a7af15f7a2d4602b7c`. The event ledger and sidecar are [`full-audio-windows.csv`](full-audio-windows.csv) and [`full-audio-manifest.json`](full-audio-manifest.json).

The full-crop RMS median is `0.00002547`, P95 is `0.09262063`, and 22.75% of windows exceed RMS `0.01`. A quiet-run pass found 56.05% of windows at or below `0.0001`, 65.39% at or below `0.001`, and 77.25% at or below `0.01`. The longest exactly digital-zero run lasts 11.35 s, from 636.30 to 647.65 s; the same span stays at or below `0.001` for 11.8 s. These results show that this particular gameplay recording has long silent stretches and no evidence of a continuous audible music bed. Because it is a third-party recording, its audio settings and capture path are unknown; this cannot establish whether the installed game plays BGM when sound is enabled.

The complete quiet-run thresholds are in [`full-quiet-run.json`](full-quiet-run.json). Recreate the extraction and audit with:

```sh
python3 tools/extract_audio_window.py research/solitaire-master/source-videos/gLd0HXtDt5I.mp4 \
  --start 0 --end 1044 --output /tmp/solitaire-gameplay-full.wav \
  --url 'https://www.youtube.com/watch?v=gLd0HXtDt5I'
python3 tools/audio_event_audit.py /tmp/solitaire-gameplay-full.wav \
  --output /tmp/solitaire-gameplay-full-audit \
  --url 'https://www.youtube.com/watch?v=gLd0HXtDt5I' \
  --video-sha256 56489d4aac9256d15de461d236a990df361621363fdc2904341a0e8e9cb64928 \
  --source-offset-seconds 0 --hop-ms 50 --max-events 120
python3 tools/audio_quiet_run_audit.py \
  /tmp/solitaire-gameplay-full-audit/audio-windows.csv \
  --threshold 0 0.0001 0.001 0.01
```

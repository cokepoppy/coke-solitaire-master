# Background music evidence

This audit checks whether the first two minutes of the source gameplay recording contain an audible continuous background score. The source is [gLd0HXtDt5I](https://www.youtube.com/watch?v=gLd0HXtDt5I), video SHA-256 `56489d4aac9256d15de461d236a990df361621363fdc2904341a0e8e9cb64928`.

The recorded 0–120 s window is 44.1 kHz stereo PCM16, measured in 2,400 consecutive 50 ms windows. The global RMS median is `0.00001166`; 1,453 windows (60.54%) are at or below `0.0001`, and 1,709 (71.21%) are at or below `0.001`. The longest run at or below `0.0001` lasts 9.8 seconds, from 3.45 to 13.25 seconds. `quiet-run.json` is the full threshold report; its input event ledger is [`gameplay-audio-opening-2025/audio-windows.csv`](../gameplay-audio-opening-2025/audio-windows.csv).

The first move sound appears near 13.176 seconds, after that near-silent stretch. This window therefore provides no evidence of continuous audible BGM. The web replica keeps its optional synthesized chord-bed disabled and does not copy music from the official promo short. This is a bounded finding about the inspected recording segment, not proof that no version or setting of the game can play music; leave music disabled until a source capture demonstrates it.

Reproduce the quiet-run report with:

```sh
python3 tools/audio_quiet_run_audit.py \
  research/solitaire-master/gameplay-audio-opening-2025/audio-windows.csv \
  --threshold 0.0001 0.001 0.01
```

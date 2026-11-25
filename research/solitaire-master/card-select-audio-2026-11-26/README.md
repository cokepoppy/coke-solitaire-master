# Card selection audio check

The first recorded tableau move shows the 4♣ selected at 13.050 s (PTS 200448), in flight at 13.066667 s (PTS 200704), and settled by 13.100 s (PTS 201216). The source frame ledger and PNG hashes are in [`../tableau-move-2026-11-25/frames.csv`](../tableau-move-2026-11-25/frames.csv).

An exact source-time 12.700–14.000 s audio crop was decoded from `gLd0HXtDt5I.mp4` as 44.1 kHz stereo PCM16. The video SHA-256 is `56489d4aac9256d15de461d236a990df361621363fdc2904341a0e8e9cb64928`, decoded full-PCM SHA-256 is `69db2a5a1dd0b006f9f9df082578fed68f5f1550c1c4eb87e7198584e3f3fa64`, and the 1.3 s crop SHA-256 is `6b4905b370ff0f1f775d74c472bfe118b09c4c9119dbbe117b4893801a7e3ebd`.

In 10 ms RMS windows, the sampled source remains digital zero from 12.950 through 13.170 s. The 0.38 s move asset from 18.040–18.420 s matches the source crop beginning at 13.176009 s with normalized correlation `0.97001409`. This evidence supports a silent selection phase followed by the captured move effect; it does not establish whether other card selections or control buttons sound different.

Recreate the analysis on macOS from the preserved source video:

```sh
python3 tools/extract_audio_window.py \
  research/solitaire-master/source-videos/gLd0HXtDt5I.mp4 \
  --start 12.700 --end 14.000 --output /tmp/solitaire-opening-move-12.7-14.wav \
  --url 'https://www.youtube.com/watch?v=gLd0HXtDt5I'
python3 tools/audio_event_audit.py /tmp/solitaire-opening-move-12.7-14.wav \
  --output /tmp/solitaire-opening-move-audio-audit \
  --url 'https://www.youtube.com/watch?v=gLd0HXtDt5I' \
  --video-sha256 56489d4aac9256d15de461d236a990df361621363fdc2904341a0e8e9cb64928 \
  --source-offset-seconds 12.700 --hop-ms 10 --max-events 80
python3 tools/audio_similarity_audit.py /tmp/solitaire-opening-move-12.7-14.wav \
  assets/audio/card-move-reference.wav \
  --output /tmp/solitaire-opening-move-correlation.json \
  --matches 5 --source-offset-seconds 12.700
```

The web replica no longer synthesizes a tap when a card is selected. Its subsequent successful move still plays the captured `move` cue. The sample belongs to a mixed third-party recording and is not an isolated original stem.

# Stock recycle transition evidence

Source: [IOSTouchplayHD Solitaire Master gameplay](https://www.youtube.com/watch?v=gLd0HXtDt5I), local source-video SHA-256 `56489d4aac9256d15de461d236a990df361621363fdc2904341a0e8e9cb64928`. The focused frame pass covers 94.5–99.5 seconds at 100 ms intervals, cropping x=720, y=400, width=164, height=240 from the 884×1920 portrait source. `frames.csv` records the actual source PTS and PNG-byte SHA-256; the PNG review crops remain ignored/local.

The stock is empty at 95.0 s (PTS 1,459,200). A tutorial hand is visible by 95.5 s. At 98.1 s the recycle slot is still empty; at 98.2 s (PTS 1,508,352) the returned stock appears with count 11. Around 98.8 s (PTS 1,517,568), a 9♠ is visible in the waste and the stock count is 10. The review supports the UI state/order of recycle, but the 100 ms samples do not resolve a detailed card-by-card return animation.

The accompanying audio analysis uses source 94.0–99.0 s. The decoded PCM crop is 44.1 kHz stereo PCM16, SHA-256 `cd3274a7b9eb5802edfeddb63ccb29ba4d5ecf082bd09ae375fb9a25a86adfd7`; its extraction metadata is in `audio-extraction.json`. The strongest event at 95.28 s matches the known move cue at normalized correlation 0.970 and follows the last stock draw. Another event at 98.61 s has RMS 0.081 and low similarity to the known move/foundation samples. Since it lands after the stock reappears but before the first post-recycle card is visible, this mixed recording cannot confidently separate a recycle effect from the next draw. The browser therefore gives the action its own `recycle` cue name but uses the existing procedural flip synthesis; no recycled WAV sample is shipped.

Regenerate the frame ledger and local PNGs:

```sh
swift tools/extract_video_window.swift research/solitaire-master/source-videos/gLd0HXtDt5I.mp4 \
  94.5 99.5 0.1 /tmp/solitaire-recycle-transition 720 400 164 240
```

Regenerate the audio crop and cue similarity report:

```sh
python3 tools/extract_audio_window.py research/solitaire-master/source-videos/gLd0HXtDt5I.mp4 \
  --start 94 --end 99 --output /tmp/solitaire-recycle-audio-94-99.wav \
  --url 'https://www.youtube.com/watch?v=gLd0HXtDt5I'
python3 tools/audio_similarity_audit.py /tmp/solitaire-recycle-audio-94-99.wav \
  assets/audio/card-move-reference.wav assets/audio/foundation-reference.wav \
  --source-offset-seconds 94 --output /tmp/solitaire-recycle-audio-matches.json
```

The audio envelope CSV and similarity report are exploratory measurements on mixed audio, not standalone proof of cue attribution.

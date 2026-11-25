# Theme-gallery sound evidence

This pass checks the Settings → Themes transition and theme-preview interactions in the local gameplay capture [gLd0HXtDt5I](https://www.youtube.com/watch?v=gLd0HXtDt5I). The source-video SHA-256 is `56489d4aac9256d15de461d236a990df361621363fdc2904341a0e8e9cb64928`.

The source window is 317.000–328.500 seconds, decoded with macOS `afconvert` to 44.1 kHz stereo PCM16. Its WAV SHA-256 is `7a09cfd41f8dd1b6133f2149d1e6c8e82f95943b8d4f2da42bc80493ee214f28`. `frames.csv` records the exact 100 ms requested and actual media times, video PTS, and image hashes. `audio-windows.csv` records 10 ms RMS, peak, high-band fraction, and spectral-centroid measurements. `theme-gallery-contact.jpg` shows one frame every 500 ms.

The 100 ms frames show the theme gallery by 322.5 s, card backs by 323.5 s, card faces by 324.0 s, a selected face preview by 325.5 s, card backs again by 326.0 s, and backgrounds again by 327.5 s. The synchronized audio audit found six transient candidates:

| Audio peak | Source RMS | Visual action | Reference clip |
| ---: | ---: | --- | --- |
| 322.66 s | 0.1564 | Open Themes from Settings | `theme-gallery-open-reference.wav` |
| 323.62 s | 0.1877 | Switch to card backs | `theme-gallery-select-reference.wav` |
| 324.14 s | 0.2211 | Switch to card faces | `theme-gallery-select-reference.wav` |
| 325.46 s | 0.1189 | Select a face preview | `theme-gallery-select-reference.wav` |
| 326.06 s | 0.2164 | Switch to card backs | `theme-gallery-select-reference.wav` |
| 327.76 s | 0.2127 | Switch to backgrounds | `theme-gallery-select-reference.wav` |

The open candidate is a 0.24 s crop from 322.580–322.820 s with a 5 ms edge fade. It matches its source position at normalized correlation 0.999969 and has maximum absolute correlation 0.305 against the later candidate peaks. The separate 0.24 s selection crop from 323.580–323.820 s has a 5 ms edge fade; it matches later candidates at 324.092, 327.719, 326.012, and 325.415 s with correlations 0.9931, 0.9918, 0.9907, and 0.9853. This supports separate gallery-open and repeated gallery-selection cues.

Both assets are short, event-aligned excerpts from mixed gameplay audio, not isolated original sound stems. The open cue is observed only once in this window, so its use is limited to entering the theme gallery. This pass does not identify a universal button sound, and the previously verified silent card-selection interval remains unchanged.

Reproduce the video and audio ledgers from the preserved source file with:

```sh
swift tools/extract_video_window.swift research/solitaire-master/source-videos/gLd0HXtDt5I.mp4 317 328.5 0.1 /tmp/solitaire-ui-window-317
python3 tools/extract_audio_window.py research/solitaire-master/source-videos/gLd0HXtDt5I.mp4 \
  --start 317 --end 328.5 --output /tmp/solitaire-ui-window-317.wav \
  --manifest /tmp/solitaire-ui-window-317.json \
  --url 'https://www.youtube.com/watch?v=gLd0HXtDt5I'
python3 tools/audio_event_audit.py /tmp/solitaire-ui-window-317.wav \
  --output /tmp/solitaire-ui-window-317-audit \
  --source-offset-seconds 317 --hop-ms 10 --max-events 100
python3 tools/extract_audio_reference.py /tmp/solitaire-ui-window-317.wav \
  assets/audio/theme-gallery-open-reference.wav --start 5.58 --end 5.82 --fade-ms 5
python3 tools/extract_audio_reference.py /tmp/solitaire-ui-window-317.wav \
  assets/audio/theme-gallery-select-reference.wav --start 6.58 --end 6.82 --fade-ms 5
python3 tools/audio_similarity_audit.py /tmp/solitaire-ui-window-317.wav \
  assets/audio/theme-gallery-open-reference.wav assets/audio/theme-gallery-select-reference.wav \
  --output research/solitaire-master/theme-panel-audio-2026-11-26/similarity-audit.json \
  --matches 12 --source-offset-seconds 317
```

The stored ledgers and repeat-match output are `window-extraction.json`, `event-audit.json`, and `similarity-audit.json`. The trimmed clips are documented in [`assets/audio/README.md`](../../../assets/audio/README.md).

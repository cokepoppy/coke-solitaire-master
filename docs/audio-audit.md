# Official video audio audit

## Source and capture

- Source: Hungry Studio's official [“solitaire classic” short](https://www.youtube.com/watch?v=Yvi1HA3OcxU).
- Captured: 2026-11-24, in Chrome, using the playing video's `captureStream()` audio track and a Web Audio `AnalyserNode`.
- Browser presentation: 11.041 seconds, 640×360, 30 fps. The stream exposed one audio track. The analyser ran at 48 kHz with a 2048-sample time-domain window. The source file is now preserved locally at 1280×720/60 fps with AAC 44.1 kHz stereo; see the source hash and exact video PTS in [the frame audit](video-frame-audit.md).
- Sampled: 663 analyser readings across playback; 656 had RMS above 0.0005. Maximum measured RMS was 0.2647. Strong local peaks occurred near media times 3.089 s (0.2074), 3.589 s (0.2647), 4.042 s (0.1588), and 5.106 s (0.1188).

These readings confirm an audio-bearing promo clip and provide approximate media-time locations for louder events. They do not identify the original effect or establish which peaks come from card actions. The clip does not expose isolated music and effects stems; its promotional audio and game sounds are mixed together. The MP4 and its source hash are now preserved locally, so exact source audio can be re-extracted, but the earlier browser RMS capture remains a rough timing note rather than a reference master.

A full-length 17:24 portrait gameplay recording is also available locally with AAC 44.1 kHz stereo. A reproducible 0–120 second envelope pass is now recorded below. It finds short transients, including several near feedback overlays, but does not isolate a clean sound or prove which UI action produced it. Taps, invalid moves, recycling, and ambient music still use approximations.

## Third-party gameplay audio envelope

- Source: [IOSTouchplayHD gameplay](https://www.youtube.com/watch?v=gLd0HXtDt5I), local file `gLd0HXtDt5I.mp4`; source-video SHA-256 `56489d4aac9256d15de461d236a990df361621363fdc2904341a0e8e9cb64928`.
- Extracted range: source time 0–120 seconds, PCM16 stereo at 44.1 kHz. The extracted WAV SHA-256 is `a60436252a556d845ab473bbd026d461d1c90e78377cfb825c8db97202c9e2fd`.
- Analysis: 2,400 contiguous 50 ms windows. Normalized RMS median is `0.00001166`, P95 is `0.06133980`, and max is `0.48727646`; 17.58% of windows exceed RMS `0.01`, and 7.13% exceed `0.05`. This is a sparse envelope with clear bursts and quiet intervals, not evidence of a continuously audible music bed in this segment. The recording may be muted, ducked, or otherwise altered, so this cannot establish that the game has no music.
- Strong peak candidates begin at 72.900 s (RMS `0.33768201`), 73.550 s (`0.23930280`), and 102.850 s (`0.19234923`). The matching frame windows show “Combo 4 / Amazing”, its follow-through, and later “Great” feedback, respectively. These are plausible feedback-sound locations; the mixed track and lack of direct listening/A-B comparison mean their sound labels remain unverified.
- Reproducible outputs: `research/solitaire-master/gameplay-audio-opening-2025/manifest.json` and `audio-windows.csv`. Candidate timestamps identify windows for review; they are not an automatic classifier for taps, card moves, music, or speech.

The complete 17:24 recording was also decoded with macOS `afconvert` to 44.1 kHz stereo PCM16. Its WAV SHA-256 is `69db2a5a1dd0b006f9f9df082578fed68f5f1550c1c4eb87e7198584e3f3fa64`. A 20 ms full-length pass produced 52,200 windows: median RMS `0.0000132`, P95 `0.09231466`, maximum `0.50907975`, with 23.11% of windows above RMS `0.01`. These wider results show repeated short audible events outside the earlier 0–120 second window.

## Official-short waveform cross-check

The official [Hungry Studio short](https://www.youtube.com/watch?v=Yvi1HA3OcxU) has 11.075918 seconds of decoded AAC audio. A normalized cross-correlation scan of that full track against the three existing gameplay crops found maximum absolute coefficients of `0.074825` for `card-move-reference.wav`, `0.097951` for `combo-amazing-reference.wav`, and `0.020598` for `foundation-reference.wav`. These low matches do not prove the game uses different sounds: the short is a mixed promo track and may use other timing, processing, or cue versions. They do show that these gameplay crops cannot be presented as waveform-identical copies of the official short's audio.

The same tools were checked against a positive control: extracting 18.040–18.420 seconds from the long gameplay recording produces the exact `card-move-reference.wav` hash, and the matcher reports correlation `1.0` at original media time 18.040 seconds. Source hashes, extracted-window hashes, cue hashes, match times, and coefficients are in [`research/solitaire-master/official-audio-reference-2026-11-25`](../research/solitaire-master/official-audio-reference-2026-11-25/README.json). The WAV review crops stay local and are regenerated from the ignored source recordings.

The opening move counter changes from 0 to 1 between 13.0 and 13.1 seconds; the 0.38 second move crop from 18.040–18.420 seconds has normalized cross-correlation 0.970 against PCM starting at 13.176 seconds. That opening move uncovers a face-down tableau card, so the evidence supports using the same captured `move` cue when a drag also flips a newly exposed card, instead of layering a procedural `flip` sound. The first stock-draw visual change occurs at 23.2167 seconds, but the waveform starting at 23.416 seconds correlates 0.970 with the same move crop. Treat these as separate visual and audio timeline evidence; the audio candidate is about 200 ms after the visual change, possibly due to stream offset or delayed sound. Later tableau moves at 18.22 and 26.12 seconds show counters 2 and 5; their snippets correlate at 0.895 after a 6.69 ms alignment shift. The build now uses the verified crop for both tableau moves and stock draws. A second 0.96 second crop from 72.820–73.780 seconds is aligned to the visible `COMBO 4` / `Amazing` feedback, and now plays at that combo tier. Both are source-matched cues from the mixed third-party recording, not clean isolated masters; provenance and hashes are in [the audio assets note](../assets/audio/README.md). Captured samples compensate for the browser's master/effects gain so their PCM level is preserved in the digital output. Other effects and ambient music remain approximations.

Recreate the extraction and analysis from the preserved local source video:

```sh
python3 -m venv /tmp/solitaire-audio-audit-venv
/tmp/solitaire-audio-audit-venv/bin/python -m pip install -r tools/requirements-audio-audit.txt
python3 tools/extract_audio_window.py research/solitaire-master/source-videos/gLd0HXtDt5I.mp4 \
  --start 0 --end 120 --output /tmp/gameplay-audio-0-120.wav \
  --url 'https://www.youtube.com/watch?v=gLd0HXtDt5I'
/tmp/solitaire-audio-audit-venv/bin/python tools/audio_event_audit.py /tmp/gameplay-audio-0-120.wav \
  --output research/solitaire-master/gameplay-audio-opening-2025 \
  --url 'https://www.youtube.com/watch?v=gLd0HXtDt5I' \
  --video-sha256 56489d4aac9256d15de461d236a990df361621363fdc2904341a0e8e9cb64928 \
  --source-offset-seconds 0 --hop-ms 50
```

The tool hashes its WAV input, writes per-window RMS/peak and broad-band spectral features, and records thresholded transient candidates in JSON. It accepts uncompressed mono or stereo PCM16 WAV. Use the matching video frame ledger and contact sheets to review any candidate at source time; use listening and action-by-action capture to decide what the sound actually is.

`extract_audio_window.py` uses the built-in macOS `afconvert` decoder to convert source audio to stereo PCM16 and crop the requested absolute source-time range at exact 44.1 kHz sample indices. It writes a JSON sidecar with video hash, decoded-audio hash, sample range, and crop hash. AAC audio can end a few milliseconds before the video container, so the command rejects windows beyond the decoded audio duration. On systems with FFmpeg, an equivalent PCM window can be extracted with `ffmpeg -copyts -ss START -to END -i VIDEO -map 0:a:0 -vn -ar 44100 -ac 2 -c:a pcm_s16le OUTPUT.wav`; retain original source times in a sidecar rather than treating the cropped WAV's zero as the video start.

Compare an extracted window with known cue samples using normalized waveform correlation:

```sh
python3 tools/audio_similarity_audit.py /tmp/solitaire-official-short-review.wav \
  assets/audio/card-move-reference.wav \
  assets/audio/combo-amazing-reference.wav \
  assets/audio/foundation-reference.wav \
  --output /tmp/official-short-cue-matches.json
```

The matcher writes the highest absolute, locally normalized correlations and candidate source times. A high match can help find a repeated waveform; a low match does not prove that a different sound is used. Pair it with frame evidence and listening.

When the input WAV is a crop, pass `--source-offset-seconds` from its extraction manifest so every match is reported on the original video timeline. The default offset is zero.

## Reproducible analysis workflow

1. Record the video URL, capture date, app version, duration, dimensions, frame rate, and source hash.
2. Use `requestVideoFrameCallback` to collect presented frame media times and `captureStream()` to inspect the video's audio track in the same playback session.
3. Sample short windows with a time-domain RMS and FFT/spectrogram. Keep all audio event timestamps on the video's media timeline; do not align them only by wall-clock time.
4. Match peaks against the frame ledger for deal, draw, flip, move, undo, recycle, and win. Treat a mixed promo track as evidence only when an event can be separated by timing and spectrum.
5. Compare browser `AudioContext` state, scheduled cues, captured PCM, and physical phone-speaker output as separate checks. UI state and a running context alone do not establish audible playback.

The implementation uses source-matched crops for tableau moves, stock draws, and foundation placement, plus event-aligned candidate windows for the observed foundation rewards (`Good`, `Great`, and `Amazing`), the win transition, and an ambient chord loop. The Good (65.500–66.300 s) and Great (102.700–103.200 s) windows align with those visual events, but neither sound is isolated from the mixed recording, so their exact cue identity remains uncertain. The 308.180–310.320 s win crop begins with the first RMS event during the final card-clear sequence and spans the result appearing around 309 s; it is a source-aligned candidate, not a clean isolated win sound. The official short's mixed track is not copied into the app. These source-matched effects are excerpts from a mixed third-party recording, not isolated original sound stems.

For the foundation cue, 100 ms video frames show a second Ace entering the foundation at 60.7 seconds and a flare over it at 61.0 seconds. The mixed audio transient begins at 60.99 seconds and has maximum normalized correlation 0.058 against the move cue. The 60.980–61.800 second sample is therefore scheduled 0.29 seconds after the action. Sample details, hash, and extraction command are in [the audio assets note](../assets/audio/README.md).

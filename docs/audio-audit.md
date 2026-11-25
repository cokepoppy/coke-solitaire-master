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
- Quiet-run check on the same CSV: 48.8% of windows are exactly digital zero; 60.5% have RMS at or below `0.0001`. The longest run at that level lasts 9.8 seconds, with 50 ms windows starting from 3.45 through 13.20 s. This source does not provide a recoverable continuous gameplay music bed. Since the recording may have music disabled or ducked, treat the result as “no audible source found,” not proof that the app contains no music.
- Strong peak candidates begin at 72.900 s (RMS `0.33768201`), 73.550 s (`0.23930280`), and 102.850 s (`0.19234923`). The matching frame windows show “Combo 4 / Amazing”, its follow-through, and later “Great” feedback, respectively. These are plausible feedback-sound locations; the mixed track and lack of direct listening/A-B comparison mean their sound labels remain unverified.
- Reproducible outputs: `research/solitaire-master/gameplay-audio-opening-2025/manifest.json` and `audio-windows.csv`. Candidate timestamps identify windows for review; they are not an automatic classifier for taps, card moves, music, or speech.

The complete 17:24 recording was also decoded with macOS `afconvert` to 44.1 kHz stereo PCM16. Its WAV SHA-256 is `69db2a5a1dd0b006f9f9df082578fed68f5f1550c1c4eb87e7198584e3f3fa64`. A 20 ms full-length pass produced 52,200 windows: median RMS `0.0000132`, P95 `0.09231466`, maximum `0.50907975`, with 23.11% of windows above RMS `0.01`. These wider results show repeated short audible events outside the earlier 0–120 second window.

### Auto Collect audio event

The source audio from 300.700–303.500 s spans the last stock draw and rapid automatic foundation sweep. The implementation uses the event crop 301.000–303.200 s once when collection starts, with an 8 ms edge fade. Its highest normalized correlations against the existing move, foundation, and win crops are `0.262`, `0.330`, and `0.095`; these weak similarities do not identify a reusable isolated sound. Source timing, PCM hash, and the similarity report are preserved in [`auto-collect-audio-2026-11-25`](../research/solitaire-master/auto-collect-audio-2026-11-25). The 2.20 second crop is an event-level approximation from mixed third-party audio, not a clean auto-collect stem. The win sample now starts when the result transition begins rather than when the final foundation card moves.

## Official-short waveform cross-check

The official [Hungry Studio short](https://www.youtube.com/watch?v=Yvi1HA3OcxU) has 11.075918 seconds of decoded AAC audio. A normalized cross-correlation scan of that full track against the three existing gameplay crops found maximum absolute coefficients of `0.074825` for `card-move-reference.wav`, `0.097951` for `combo-amazing-reference.wav`, and `0.020598` for `foundation-reference.wav`. These low matches do not prove the game uses different sounds: the short is a mixed promo track and may use other timing, processing, or cue versions. They do show that these gameplay crops cannot be presented as waveform-identical copies of the official short's audio.

The same tools were checked against a positive control: extracting 18.040–18.420 seconds from the long gameplay recording produces the exact `card-move-reference.wav` hash, and the matcher reports correlation `1.0` at original media time 18.040 seconds. Source hashes, extracted-window hashes, cue hashes, match times, and coefficients are in [`research/solitaire-master/official-audio-reference-2026-11-25`](../research/solitaire-master/official-audio-reference-2026-11-25/README.json). The WAV review crops stay local and are regenerated from the ignored source recordings.

The opening move counter changes from 0 to 1 between 13.0 and 13.1 seconds; the 0.38 second move crop from 18.040–18.420 seconds has normalized cross-correlation 0.970 against PCM starting at 13.176 seconds. That opening move uncovers a face-down tableau card, so the evidence supports using the same captured `move` cue when a drag also flips a newly exposed card, instead of layering a procedural `flip` sound. The first stock-draw visual change occurs at 23.2167 seconds, but the waveform starting at 23.416 seconds correlates 0.970 with the same move crop. Treat these as separate visual and audio timeline evidence; the audio candidate is about 200 ms after the visual change, possibly due to stream offset or delayed sound. Later tableau moves at 18.22 and 26.12 seconds show counters 2 and 5; their snippets correlate at 0.895 after a 6.69 ms alignment shift. The build now uses the verified crop for both tableau moves and stock draws. A second 0.96 second crop from 72.820–73.780 seconds is aligned to the visible `COMBO 4` / `Amazing` feedback, and now plays at that combo tier. Both are source-matched cues from the mixed third-party recording, not clean isolated masters; provenance and hashes are in [the audio assets note](../assets/audio/README.md). Captured samples compensate for the browser's master/effects gain so their PCM level is preserved in the digital output. Other effects and ambient music remain approximations.

### Card selection versus move sound

At source PTS 200448 (13.050 s), the first 4♣ is still selected; by PTS 200704 (13.066667 s) it is in flight, and it has settled by PTS 201216 (13.100 s). In an exact 12.700–14.000 s PCM extraction, every 10 ms RMS window from 12.950 through 13.170 s is digital zero. The 0.38 s `card-move-reference.wav` then matches the source at 13.176009 s with normalized correlation 0.970014. This supports one move sound after the card action and no separate click sound on card selection. The web version keeps card selection silent. Theme-gallery opening and selection have separate source-matched candidates from the 322.5–327.8 s panel sequence; other procedural control-button taps remain unverified. The frame PTS/hashes, PCM hash, RMS ledger, correlation output, and reproduction command are in [`card-select-audio-2026-11-26`](../research/solitaire-master/card-select-audio-2026-11-26/README.md).

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

To summarize quiet windows in the resulting CSV, including the longest continuous run below each RMS threshold, run:

```sh
python3 tools/audio_quiet_run_audit.py research/solitaire-master/gameplay-audio-opening-2025/audio-windows.csv
```

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

The implementation uses source-matched crops for tableau moves, stock draws, foundation placement, Auto Collect, theme-gallery opening and selection, and event-aligned candidate windows for the observed foundation rewards (`Good`, `Great`, and `Amazing`) and the win transition. The Good (65.500–66.300 s) and Great (102.700–103.200 s) windows align with those visual events, but neither sound is isolated from the mixed recording, so their exact cue identity remains uncertain. The 308.180–310.320 s win crop begins with the first RMS event during the final card-clear/result transition and spans the result appearing around 309 s; it is a source-aligned candidate, not a clean isolated win sound. The Auto Collect crop is played once across its matching 2.2-second visual sweep. A quiet-run audit of the original 0–120 s recording finds no audible continuous BGM, so the optional synthesized chord-bed prototype remains disabled; see the [background-audio audit](../research/solitaire-master/gameplay-bgm-audit-2026-11-26/README.md). The official short's mixed promo track is not copied into the app. Captured effects are excerpts from a mixed third-party recording, not isolated original sound stems.

For stock recycle, a 60 fps frame pass over 97.5–99.2 seconds resolves two adjacent audio events after the stock empties: the 11-card stock is visible by 98.2 s (PTS 1,508,352); the first candidate sound window begins at 98.400 s while the stock remains at 11; and a second event begins at 98.580 s, before stock-card motion first changes the frame at 98.650 s. The move counter reaches 56 by 98.783 s (PTS 1,517,312), and the 9♠ is visible by 98.800 s (PTS 1,517,568). Two 0.14-second crops match their positions in the 0–120 s source PCM at normalized correlations 0.999806 and 0.999960. The first is assigned to recycle completion and the second to the first draw after recycling; this action mapping is inferred from the synchronized visual sequence because the third-party recording mixes effects and does not expose original stems. The web version now plays the crops for those two distinct actions and keeps the ordinary stock draw sample unchanged. Full 60 fps PTS/hash data and 10 ms audio measurements are in [`source-stock-recycle-audio-2026-11-26`](../research/solitaire-master/source-stock-recycle-audio-2026-11-26/README.md).

For the foundation cue, 100 ms video frames show a second Ace entering the foundation at 60.7 seconds and a flare over it at 61.0 seconds. The mixed audio transient begins at 60.99 seconds and has maximum normalized correlation 0.058 against the move cue. The 60.980–61.800 second sample is therefore scheduled 0.29 seconds after the action. Sample details, hash, and extraction command are in [the audio assets note](../assets/audio/README.md).

The `Good` reward window at 65.500–66.300 seconds covers a different foundation event: the score and move count advance at 65.4 seconds, `COMBO 2` is visible by 65.5 seconds, and `Good` appears by 65.9 seconds. Its audio envelope has an action-level onset around 65.45 seconds and a second stronger transient at 66.0–66.1 seconds. The complete window correlates 0.999 with `combo-good-reference.wav`, while the generic foundation sample correlates at most 0.050 within the 65–67 second crop. Because the existing Good asset is a full action-and-reward crop, the mobile version no longer layers the unrelated generic foundation crop for that tier. The audio remains mixed, so this is an evidence-based event mapping rather than proof of separated stems; the exact PTS, 50 ms envelope, and correlation report are in [`foundation-good-audio-window-2026-11-25`](../research/solitaire-master/foundation-good-audio-window-2026-11-25/README.md).

For `Great`, the source score and move counters advance at 102.0 seconds, the banner is visible at 102.5 seconds, and the captured 102.700–103.200 second reward sample has its strongest transient at 102.75 seconds. Its correlation against the full mixed audio crop peaks at 0.9986 at the sample's original 102.7 second start; the generic foundation and card-move samples peak at only 0.0282 and 0.0771 in the same window. The mobile version now schedules this reward crop 700 ms after the foundation action, preserving the separate foundation cue at the action time. The delay is a source-timeline inference from 100 ms video samples and mixed audio; the retained PTS, 50 ms envelope, and correlation output are in [`great-reward-audio-window-2026-11-25`](../research/solitaire-master/great-reward-audio-window-2026-11-25/README.md).

For `Amazing`, the move counter advances from 38 to 39 by 72.35 seconds, the `COMBO 4` label appears by 72.70 seconds, and the 72.820–73.780 second reward crop begins with the matching transient. Its correlation against the 72.4–74.2 second mixed source window peaks at 0.999937 at 72.82 seconds; the generic foundation and card-move samples peak at 0.0405 and 0.0717. The web version keeps the foundation cue at action time and schedules `Amazing` 500 ms later. This is an approximate timeline inference from 50 ms audio windows and 100 ms reward frames, and the third-party mixed track does not prove isolated cue stems. Frame PTS, hashes, envelope, and correlation output are in [`amazing-reward-audio-window-2026-11-25`](../research/solitaire-master/amazing-reward-audio-window-2026-11-25/README.md).

For theme controls, a 100 ms frame ledger and synchronized audio window at 317.0–328.5 seconds show the Themes page by 322.5 seconds and five later tab/preview interactions. A 0.24-second opening candidate at 322.580–322.820 seconds does not match the later selection clicks (maximum absolute correlation 0.305). A separate 0.24-second selection sample at 323.580–323.820 seconds matches four later clicks at normalized correlations 0.985–0.993. The app uses these only for opening and interacting with the theme gallery. The samples are short excerpts of mixed third-party audio, and this evidence does not establish a universal tap sound. See [`theme-panel-audio-2026-11-26`](../research/solitaire-master/theme-panel-audio-2026-11-26/README.md).

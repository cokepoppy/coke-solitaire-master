# Official video audio audit

## Source and capture

- Source: Hungry Studio's official [“solitaire classic” short](https://www.youtube.com/watch?v=Yvi1HA3OcxU).
- Captured: 2026-11-24, in Chrome, using the playing video's `captureStream()` audio track and a Web Audio `AnalyserNode`.
- Browser presentation: 11.041 seconds, 640×360, 30 fps. The stream exposed one audio track. The analyser ran at 48 kHz with a 2048-sample time-domain window. The source file is now preserved locally at 1280×720/60 fps with AAC 44.1 kHz stereo; see the source hash and exact video PTS in [the frame audit](video-frame-audit.md).
- Sampled: 663 analyser readings across playback; 656 had RMS above 0.0005. Maximum measured RMS was 0.2647. Strong local peaks occurred near media times 3.089 s (0.2074), 3.589 s (0.2647), 4.042 s (0.1588), and 5.106 s (0.1188).

These readings confirm an audio-bearing promo clip and provide approximate media-time locations for louder events. They do not identify the original effect or establish which peaks come from card actions. The clip does not expose isolated music and effects stems; its promotional audio and game sounds are mixed together. The MP4 and its source hash are now preserved locally, so exact source audio can be re-extracted, but the earlier browser RMS capture remains a rough timing note rather than a reference master.

A full-length 17:24 portrait gameplay recording is also available locally with AAC 44.1 kHz stereo. Its audio should be inspected against exact source PTS for isolated card actions and music-loop boundaries. Until that event-aligned listen/analysis is complete, the existing Web Audio effects and ambient loop remain approximations; the presence of a mixed audio track alone is not evidence of a match.

## Reproducible analysis workflow

1. Record the video URL, capture date, app version, duration, dimensions, frame rate, and source hash.
2. Use `requestVideoFrameCallback` to collect presented frame media times and `captureStream()` to inspect the video's audio track in the same playback session.
3. Sample short windows with a time-domain RMS and FFT/spectrogram. Keep all audio event timestamps on the video's media timeline; do not align them only by wall-clock time.
4. Match peaks against the frame ledger for deal, draw, flip, move, undo, recycle, and win. Treat a mixed promo track as evidence only when an event can be separated by timing and spectrum.
5. Compare browser `AudioContext` state, scheduled cues, captured PCM, and physical phone-speaker output as separate checks. UI state and a running context alone do not establish audible playback.

The implementation currently uses independent procedural Web Audio sounds and an ambient chord loop. The official short's mixed track is not copied into the app, and the procedural sounds remain an approximation until a clean game-only source can be compared.

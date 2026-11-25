# Auto Hint idle-window evidence

Source: [IOSTouchplayHD Solitaire Master gameplay](https://www.youtube.com/watch?v=gLd0HXtDt5I), video SHA-256 `56489d4aac9256d15de461d236a990df361621363fdc2904341a0e8e9cb64928`. The visible `Auto Hints` setting is enabled in the Settings capture at 319–321 s. The 635.469–635.849 s audio window matches `card-move-reference.wav` at normalized correlation 0.969, with its strongest transient at 635.66 s. The board settles at 636 s with 87 moves. Frames at 636, 641, and 646 s show the same board and no hint highlight. The move counter remains 87 at 646 s; the next move-count change is visible by 648 s.

A 20 ms PCM audit of 635–648 s finds RMS at or below `0.0001` continuously from 636.18 to 647.68 s, an 11.5-second quiet interval. At 647.68 s the next audible event begins; a move-count change follows by 648 s. The audio is mixed gameplay audio, so this bounds the idle period but does not identify the next event's exact sound. `frames.csv` and `manifest.json` retain PTS and PNG-byte hashes for one-second samples. Three full-resolution keyframes are retained in the local worktree beside the ledger; the repository ignores these extracted PNGs. Audio extraction, per-window RMS, quiet-run output, and waveform correlation reports are in `audio-extraction.json` and `audio-analysis/`.

This evidence contradicts the replica's old five-second Auto Hint: no hint is visible through ten seconds of stable board time, and the board remains unchanged for about 11.7 seconds before the next action. It does not reveal the exact source timeout because a longer idle interval with a visible hint is absent. The replica now waits 12 seconds after an idle state before showing a hint; this is a conservative timing inference, not an exact measurement.

Reproduce the video and audio evidence from the ignored local source file:

```sh
swift tools/extract_video_window.swift research/solitaire-master/source-videos/gLd0HXtDt5I.mp4 \
  635 648 1 research/solitaire-master/auto-hint-idle-2026-11-25
python3 tools/extract_audio_window.py research/solitaire-master/source-videos/gLd0HXtDt5I.mp4 \
  --start 635 --end 648 \
  --output /tmp/solitaire-auto-hint-audio-635-648.wav \
  --url 'https://www.youtube.com/watch?v=gLd0HXtDt5I'
python3 tools/audio_event_audit.py /tmp/solitaire-auto-hint-audio-635-648.wav \
  --output /tmp/solitaire-auto-hint-audio-analysis \
  --url 'https://www.youtube.com/watch?v=gLd0HXtDt5I' \
  --video-sha256 56489d4aac9256d15de461d236a990df361621363fdc2904341a0e8e9cb64928 \
  --source-offset-seconds 635 --hop-ms 20
python3 tools/audio_quiet_run_audit.py \
  /tmp/solitaire-auto-hint-audio-analysis/audio-windows.csv --threshold 0.0001
python3 tools/audio_similarity_audit.py /tmp/solitaire-auto-hint-audio-635-648.wav \
  assets/audio/card-move-reference.wav --source-offset-seconds 635 \
  --output /tmp/solitaire-auto-hint-audio-matches.json
```

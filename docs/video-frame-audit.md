# Solitaire Master video frame audit

This workflow keeps source timestamps attached to decoded frames, hashes the RGB pixels, creates review contact sheets, and preserves selected transition frames with their immediate neighbors. It is intended for studying card layout, touch feedback, deal/move timing, win transitions, and the timing of mixed audio. It does not infer hidden game rules from promotional footage.

## Sources and first findings

- Hungry Studio official promo short: [“solitaire classic”](https://www.youtube.com/watch?v=Yvi1HA3OcxU), also linked from the [Hungry Studio YouTube channel](https://www.youtube.com/@hungrystudio_games). Audited on 2026-11-24. The source file is 1280×720, nominally 60 fps, with 662 decoded frames over about 11.02 seconds. Container audio is AAC, 44.1 kHz stereo. SHA-256 and exact first/last source PTS are recorded in `research/solitaire-master/official-short-2026-11-24/manifest.json`.
- Full-length third-party portrait gameplay capture: [Solitaire Master iOS gameplay](https://www.youtube.com/watch?v=gLd0HXtDt5I), uploaded by IOSTouchplayHD on 2025-08-12. It is 884×1920, 60 fps, 17:24, with AAC 44.1 kHz stereo. Its source is kept locally under the ignored `research/solitaire-master/source-videos/` directory; only its URL and analysis notes belong in the repository.
- The [Hungry Studio corporate homepage](https://www.hungrystudio.com/home) is a general company site; I found no game-specific Solitaire Master manual there. The first-party [App Store listing](https://apps.apple.com/us/app/solitaire-master/id6464113198) describes seven tableau columns, four foundations, alternating-color descending tableau moves, face-up stock draws, recycling an empty stock, hints, undo, daily puzzles, and the option to move a whole exposed sequence. Treat the listing as rules evidence; video remains the source for visual timing and interaction details.

The official short is an edited promo, not an ordinary play session. Around 1.17–1.50 seconds, oversized spinning cards and title treatments replace a normal deal. Later sections are quick montage cuts. Do not tune routine deal or move animation timing from those promo transitions. Use the long portrait recording to inspect real board geometry and interactions, then confirm any rule against the first-party description or by playing the app.

## Reproduce the frame ledger

Install the video-only Python dependency and provide an FFmpeg build that supports `showinfo`, `select`, and raw RGB output:

```sh
python3 -m pip install -r tools/requirements-video-audit.txt
yt-dlp --write-info-json --format 'bv*+ba/b' --merge-output-format mp4 \
  --output 'research/solitaire-master/source-videos/%(id)s.%(ext)s' \
  'https://www.youtube.com/watch?v=VIDEO_ID'
python3 tools/video_frame_audit.py path/to/source.mp4 \
  --output research/solitaire-master/session-name \
  --url 'https://www.youtube.com/watch?v=VIDEO_ID' \
  --keyframe-pts 17920 18432 20480
```

The script does not download, transcode, or modify the source. It streams each decoded frame, reads its PTS and time from FFmpeg `showinfo`, writes a CSV row with the SHA-256 of the decoded RGB pixels, and renders aspect-preserving contact sheets. Requested PTS values get a full-resolution image and the immediately adjacent decoded frames. It independently extracts and hashes all available retained PTS values; a mismatch stops the run. `manifest.json` records source SHA-256, FFmpeg version, stream metadata, time window, requested PTS values, neighbors, and verification results.

For a short section of a long video, pass absolute source timestamps. Source PTS are retained, rather than reset to zero:

```sh
python3 tools/video_frame_audit.py path/to/source.mp4 \
  --output research/solitaire-master/session-window \
  --url 'https://www.youtube.com/watch?v=VIDEO_ID' \
  --start-seconds 42 --end-seconds 54 \
  --keyframe-pts 645120 660480
```

Images and downloaded videos are ignored by Git because they are review derivatives of public video. Commit the CSV/JSON timestamp and hash evidence plus written observations, not copied source footage.

## Observed stock-draw transition

A zero-tolerance AVFoundation review of the 60 fps source frames around the first stock draw found the first changed frame at 23.216667 s: the stock count changes from 24 to 23, the move count advances from 3 to 4, and the 6♥ is already face up. The card moves left from the stock toward the waste and reaches the waste slot at about 23.35 s. The mixed-audio transient candidate begins near 23.416 s, about 200 ms later. That gap may be stream offset or delayed sound, so keep the audio and visual timestamps separate when tuning. The web version uses a 150 ms linear flight and shows the face immediately.

## Reviewing interactions and sound

1. Start with the overview and contact sheets to identify likely actions. Use the CSV to jump to exact PTS, then compare a target image with its saved before/after frames.
2. For animation timing, inspect every source frame within the action window and record its first visible change, motion interval, settling point, and any board/UI transition. Do not estimate these boundaries from a sparse storyboard alone.
3. Align audio analysis to the same media timestamps. Record the original audio stream details and source hash. A mixed promo soundtrack can locate audible events but cannot establish which sound belongs to a card action. Compare spectrum and waveform around isolated deal, draw, move, flip, undo, recycle, and win actions in an unedited play recording.
4. For browser sound replication, separately verify AudioContext resume, scheduled cue state, captured output, and playback through a phone speaker. A running context does not prove that sound reaches the device.
5. Keep observed facts, rule citations, and implementation guesses separate. Record any uncertainty in the session notes before tuning the game.

For the dynamic timer's changing text, `tools/extract_timer_frames.swift` uses AVFoundation's zero-tolerance frame generator and records both the requested and actual media time in each output filename. The timer digit rebuild command and selected source times are in [the UI sprite notes](../assets/ui/README.md).

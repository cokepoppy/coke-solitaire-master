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

On macOS, if FFmpeg is unavailable, use the AVFoundation window extractor for focused transition reviews. It requests each frame with zero time tolerance and writes PNGs plus a CSV and manifest containing requested and actual media times, source PTS/time scale, source-file SHA-256, and each PNG's SHA-256. An optional crop keeps transition sets small enough to review in Finder or Preview:

```sh
swift tools/extract_video_window.swift path/to/source.mp4 \
  23.18 23.40 0.016666667 research/solitaire-master/stock-draw-window \
  0 250 884 800
```

The last four arguments are crop `x y width height`; omit them to retain each full frame. The frame list is recorded at the actual decoded source times, which may differ from the requested times by one frame. Keep this AVFoundation PNG-byte hash evidence distinct from the Python auditor's decoded-RGB hashes.

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

A zero-tolerance AVFoundation review of the 60 fps source frames around the first stock draw found the first changed frame at 23.216667 s: the stock count changes from 24 to 23, the move count advances from 3 to 4, and the 6♥ is already face up. The card moves left from the stock toward the waste and reaches the waste slot at about 23.35 s, an eight-frame flight of 133.333 ms. The source PTS and per-frame PNG hashes for this transition are recorded in the [frame ledger](../research/solitaire-master/stock-draw-2026-11-25/frames.csv) and [manifest](../research/solitaire-master/stock-draw-2026-11-25/manifest.json); regenerate the omitted review images with the AVFoundation command above. The mixed-audio transient candidate begins near 23.416 s, about 200 ms later. That gap may be stream offset or delayed sound, so keep the audio and visual timestamps separate when tuning. The web version uses a 133.333 ms linear flight and shows the face immediately.

### Observed stock recycle

The source stock is empty by 95.0 s, with the recycle tutorial hand visible from 95.5 s. The first reviewed frame with a returned pile and count 11 is 98.2 s; the first visible 9♠ in the waste and count 10 occur around 98.8 s. The 94.5–99.5 s, 100 ms frame ledger preserves source PTS and PNG hashes in [`stock-recycle-transition-2026-11-25`](../research/solitaire-master/stock-recycle-transition-2026-11-25/README.md). An audio transient at 98.61 s falls between these two visual states, so the mixed recording cannot determine whether it belongs to recycling or the next draw. The browser emits a distinct `recycle` event using its existing procedural flip sound; it does not play an unverified source crop.

## Observed win result

The third-party gameplay recording shows an automatic card-clear sequence beginning around 301 s and the full-screen result visible by source time 309 s. At 310.000 s (PTS 4,761,600; source time scale 15,360), the result reads Score 5,223, You defeated 86% of players, Time 02:13, Moves 121, a trophy count of 2, and a yellow New Deal button. The screen uses a solid near-black navy field with a crown-and-ribbon image; the result stays visible in the next sampled frames. The source frame SHA-256 is `a09af0132a4bd4fcd594e7560e731104435aaae6e94c4400e2b67d26db510b9d`; the source recording SHA-256 is in [the audio audit](audio-audit.md). The web result now uses the captured banner, Best badge, trophy, and button, while score, time, moves, and local win count remain live text/data. The 86% ranking is copied from this one capture; other ranking values and the exact server rule are not established by the recording.

### Win clear transition

An AVFoundation pass sampled the source from 303–309 s at 100 ms intervals, preserving the original PTS and PNG hashes in `/tmp/solitaire-win-clear-01s/frames.csv` (the review frames are local derivatives). At 303.000 s (PTS 4,654,080), the last tableau cards are still clearing while the score rises. At 304.000 s (PTS 4,669,440), the board is dimmed and a centered `winning streak` title, trophy, streak count, and thumbs-up appear; `Tap to Continue` is also visible. Between 304.500 s and 307.000 s, face-up cards animate into a broad, layered fan across the dimmed board. The 307.000 s frame (PTS 4,715,520) shows the complete fan. The result transition starts by 308.000 s (PTS 4,730,880), and the full result is visible by 308.500 s; by 309.000 s (PTS 4,746,240) the result is stable. Selected PNG hashes: 303.000 `862b1f274e0f5fcacaf18e90c13264deb8979f0507ec2ae51807a482f10cbe66`, 304.000 `ab1d76ef52fb45baf38fe1b883194e77a2a93ca40b01c6dfaf26a1d1b42a0ba2`, 307.000 `af29061de9306c5e42529cbc18e795db83b8ca5c8303a80d12d7aab2d9bd0a46`, and 309.000 `fa33145bf9c56369b650a50464658547253a2bf54b7d2f0bc975c4fb2b0329fa`. The web version now builds a 52-card animated fan under the streak message, accepts the source `Tap to Continue` action, and advances to the result after 4.7 seconds if untouched. The captured source only samples one completed game, so the exact streak-count rule is not established.

## Observed Settings page

At 320.000 s (PTS 4,915,200; source time scale 15,360), the gameplay video shows the full-screen Settings page. Audio and Vibration appear above Statistics and Themes; Game Mode contains Draw Mode 1/3 and Scoring Mode Standard; Preferences contains Left Hand, Quick Play, Auto Collect, Auto Hints, Show Three Waste Cards, and Movable highlight. The source frame SHA-256 is `987579124b58123cb63d0740478ae9983491b11b2520c60b6a11d4a6ad411161`. This single third-party screenshot establishes the visible labels, grouping, and Standard default. The web replica now matches the light full-screen treatment and supports Standard/Vegas selection. The video does not show how each preference behaves or establish the scoring arithmetic.

### Observed Auto Collect sequence

The 297–303 s review advances in half-second steps. At 300.500 s (PTS 4,615,680), the stock shows one face-down card and the move counter reads 97. By 301.000 s (PTS 4,623,360), the stock is empty, the tableau has no visible face-down cards, several cards are already moving toward the foundations, and the move counter has advanced to 102. The move counter reaches 121 by 303.000 s (PTS 4,654,080), when the final cards are clearing. PTS and PNG hashes for every half-second sample are preserved in the [frame ledger](../research/solitaire-master/auto-collect-transition-2026-11-25/frames.csv) and [manifest](../research/solitaire-master/auto-collect-transition-2026-11-25/manifest.json). Selected PNG hashes for 300.500, 301.000, and 303.000 are `df6607e6c6822f703c24e74df9515cdeacf95489e8468a9564f3c898bf3b6138`, `494d2a22cf6fc018426005761dada85109bb91ef162806e18b7d7e1e9bf17576`, and `862b1f274e0f5fcacaf18e90c13264deb8979f0507ec2ae51807a482f10cbe66`. This supports the observed trigger: once the stock is exhausted and every tableau card is face-up, Auto Collect sweeps legal cards to foundations. The mobile version now animates one legal foundation move about every 100 ms and enters the existing win-clear sequence when all 52 cards are collected. The feature’s exact solver policy is not visible in these frames.

Auto Hints appears in the Settings page, but the recording does not show its idle delay or animation. The mobile version currently treats it as a five-second idle hint, using the same legal-move selection as the manual Hint control; this timing remains an approximation pending a source capture of an idle interval.

## Observed tableau-move transition

In the same 60 fps recording, the selected 4♣ remains at its source position at 13.050 s, has started moving by 13.0667 s, and is settled by 13.100 s. The newly uncovered Q♣ flips face up in that window. This brackets the flight to roughly 50 ms and the visible flip to no more than two frame intervals; the web version uses a 50 ms linear flight and a 50 ms flip. Exact PTS and PNG-byte hashes are in the [tableau-move ledger](../research/solitaire-master/tableau-move-2026-11-25/frames.csv) and [manifest](../research/solitaire-master/tableau-move-2026-11-25/manifest.json). The PNG review frames stay local and can be regenerated with the same AVFoundation command.

## Reviewing interactions and sound

1. Start with the overview and contact sheets to identify likely actions. Use the CSV to jump to exact PTS, then compare a target image with its saved before/after frames.
2. For animation timing, inspect every source frame within the action window and record its first visible change, motion interval, settling point, and any board/UI transition. Do not estimate these boundaries from a sparse storyboard alone.
3. Align audio analysis to the same media timestamps. Record the original audio stream details and source hash. A mixed promo soundtrack can locate audible events but cannot establish which sound belongs to a card action. Compare spectrum and waveform around isolated deal, draw, move, flip, undo, recycle, and win actions in an unedited play recording.
4. For browser sound replication, separately verify AudioContext resume, scheduled cue state, captured output, and playback through a phone speaker. A running context does not prove that sound reaches the device.
5. Keep observed facts, rule citations, and implementation guesses separate. Record any uncertainty in the session notes before tuning the game.

For the dynamic timer's changing text, `tools/extract_timer_frames.swift` uses AVFoundation's zero-tolerance frame generator and records both the requested and actual media time in each output filename. The timer digit rebuild command and selected source times are in [the UI sprite notes](../assets/ui/README.md).

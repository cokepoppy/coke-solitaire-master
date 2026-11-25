# Source UI sprites

These four transparent PNG glyphs are extracted from the game-action row in the audited third-party Solitaire Master gameplay recording: [source video](https://www.youtube.com/watch?v=gLd0HXtDt5I), 884×1920 at 60 fps. `action-play-plus.png`, `action-magic.png`, and `action-hint.png` use source PTS 153600 (10s); `action-undo.png` uses PTS 307200 (20s), where Undo is enabled and its white icon is unobscured. The crops retain the original glyph pixels and use an alpha mask to remove the felt around them. CSS supplies the circle outline/fill, labels, and live Magic badge.

The source-frame crops are part of the local ignored review derivatives. Regenerate the committed glyphs with `python3 tools/build_source_action_icons.py` after creating the keyframes described in [`docs/video-frame-audit.md`](../../docs/video-frame-audit.md). The four icons are included in the service-worker shell cache for offline play.

`action-row-initial-reference.png` and `action-row-used-reference.png` are 844×224 crops from source PTS 153600 (10s) and 307200 (20s), both from rectangle `(20,1660,864,1884)`. The first shows Undo disabled before any move; the second shows Undo enabled after moves. At the matching 442×960 CSS viewport and 2× pixel density, the default felt theme displays the correct row at source size based on whether undo history exists. The semantic buttons stay in place for taps; source art is hidden for alternate themes and after the one-use Magic charge is spent, when live controls remain visible. Both sprites are in the service-worker cache and omit the iOS home indicator.

`foundation-empty-1.png` through `foundation-empty-4.png` are the exact four 118×177 empty foundation slots from PTS 153600 (10s), source rectangles `(8,429)`, `(133,429)`, `(258,429)`, and `(383,429)`. They retain the source gold double outline, green inset, and serif Ace placeholder. The default felt board displays these source crops; alternate backgrounds keep the CSS placeholder so their artwork is not covered by the captured felt. Regenerate them with `python3 tools/extract_foundation_source_art.py`.

`menu-source.png`, `stat-crown.png`, and `stat-moves.png` come from PTS 307200 (20s), where the values are Score 30 and Moves 3. The menu crop includes its 72×74 circle; the crown and mint move arrows are isolated into transparent PNGs from source rectangles `(119,317,52,40)` and `(653,316,34,42)`. The default felt menu uses its source crop, while alternate themes retain the vector menu. Score and move values render with the same 21×31 source numeral sprites as the timer, with hidden live text retained for accessibility. Regenerate the icon crops with `python3 tools/extract_statusbar_source_art.py`.

`timer-frame-source.png` is a 286×100 crop from PTS 153600 (10s), source rectangle `(340,290,626,390)`. Its `00:00` digits are alpha-keyed as separate glyphs in `timer-digit-0.png` through `timer-digit-9.png` and `timer-colon.png`; the sprites preserve the source font's 21×31 px numeral cells, exact colon shape, and spacing. The glyph source readings were checked against their full timer crops: `0` at 10s (`00:00`), `1` at 30s (`00:17`), `2` at 15s (`00:02`), `3` at 43s (`00:30`), `4` at 380s (`00:45`), `5` at 370s (`00:35`), `6` at 19s (`00:06`), `7` at 20s (`00:07`), `8` at 525s (`00:08`), and `9` at 695s (`00:09`). The earlier mapping mistakenly sampled `3` and `6` from the 100-second frame, which actually reads `01:27`; those two sprites are corrected. All assets are in the service-worker shell cache and render with a text equivalent for accessibility. Alternate backgrounds retain the vector frame but use the same captured digits.

Rebuild the timer sprites from the source recording, preserving the requested and decoded frame times:

```sh
swift tools/extract_timer_frames.swift research/solitaire-master/source-videos/gLd0HXtDt5I.mp4 10 1000 5 /tmp/solitaire-timer-frames-5s
swift tools/extract_timer_frames.swift research/solitaire-master/source-videos/gLd0HXtDt5I.mp4 19 43 1 /tmp/solitaire-timer-frames-19-43s
python3 tools/extract_timer_glyphs.py /tmp/solitaire-timer-frames-5s /tmp/solitaire-timer-frames-19-43s
```

`extract_timer_frames.swift` uses AVFoundation with zero time tolerance and crops the 286×100 timer panel. `extract_timer_glyphs.py` keys the numeral pixels against the committed blank frame. The recording is third-party gameplay footage; the captures are documented visual references, not official asset files.

The source-frame PTS values, observed timer readings, and PNG SHA-256 hashes for every sampled glyph are recorded in [frames.csv](../../research/solitaire-master/timer-glyph-sources-2026-11-25/frames.csv) and [manifest.json](../../research/solitaire-master/timer-glyph-sources-2026-11-25/manifest.json).

`win-banner-reference.png`, `win-best-reference.png`, `win-trophy-reference.png`, and `win-new-deal-reference.png` are crops from source time 310.000 seconds, PTS 4,761,600. They reproduce the crown ribbon, optional Best badge, trophy, and yellow New Deal button on the full-screen result. The banner and small overlays retain their sampled navy background so the edges blend into the result screen. Recreate them from the exact source frame with:

```sh
swift tools/extract_video_window.swift research/solitaire-master/source-videos/gLd0HXtDt5I.mp4 310 310 1 /tmp/solitaire-win-source
python3 tools/extract_win_result_assets.py /tmp/solitaire-win-source/frame-00000-req-310.000000-pts-4761600.png assets/ui
```

The crops are included in the service-worker shell cache. The layout evidence and source-frame hash are recorded in [the win-result audit](../../docs/video-frame-audit.md#observed-win-result). The source shows `86%` and a trophy count of `2` in this one result; the ranking rule is unknown, and the web version uses 86% as the captured label plus a local win count.

`win-streak-trophy-reference.png` uses the same source trophy cropped from the result capture, with the sampled navy removed so it can sit over the animated card fan. Rebuild it with `python3 tools/extract_win_streak_trophy.py assets/ui/win-trophy-reference.png assets/ui/win-streak-trophy-reference.png`.

`settings-switch-on-reference.png` and `settings-switch-off-reference.png` are 123×58 px crops of the Settings switches at PTS 4,915,200 (320 s). `settings-draw-mode-1-reference.png` is a 787×104 px crop of the Draw Mode 1 row from that same frame. At the source-sized 442×960 CSS viewport / 2× density, these retain the original control artwork while accessible live buttons handle taps. The switch image changes with its checked state; the Draw Mode 1 row sprite is shown only while that option is selected. Regenerate them with:

```sh
swift tools/extract_video_window.swift research/solitaire-master/source-videos/gLd0HXtDt5I.mp4 320 320 1 /tmp/solitaire-settings-source
python3 tools/extract_settings_source_art.py /tmp/solitaire-settings-source/frame-00000-req-320.000000-pts-4915200.png
```

All three settings crops are included in the service-worker shell cache and are verified by the offline E2E test.

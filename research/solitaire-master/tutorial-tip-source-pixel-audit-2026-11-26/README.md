# First-move tutorial tip source-pixel audit

This audit measures the one-time rules bubble around its first appearance and disappearance in the third-party [Solitaire Master gameplay recording](https://www.youtube.com/watch?v=gLd0HXtDt5I). The local source is 884×1920 at 60 fps, PTS time scale 15,360, and SHA-256 `56489d4aac9256d15de461d236a990df361621363fdc2904341a0e8e9cb64928`. The [`show-frames.csv`](show-frames.csv) and [`show-manifest.json`](show-manifest.json) ledger covers 13.400–13.600 s; the [`hide-frames.csv`](hide-frames.csv) and [`hide-manifest.json`](hide-manifest.json) ledger covers 17.600–17.900 s. Each has a 760×390 review crop from `(60,1300)`.

At 13.450001 s (PTS 206,592) the bubble is absent. It is fully visible by 13.466668 s (PTS 206,848), remains fully visible at 17.783337 s (PTS 273,152), and is gone by 17.800004 s (PTS 273,408). The two visible/hidden boundaries each fit inside one 60 fps frame interval (16.667 ms); the recorded fully visible span is 4.316669 s, with disappearance bounded at 4.333336 s.

The source rectangle is `(91,1385)` to `(793,1608)` at 884×1920: 702×223 pixels. The interior fill is `(9,64,33)` (`#094021`), the three text lines are white, and the surrounding felt is `(14,116,65)` (`#0e7441`). At the 442×960 CSS reference viewport rendered at 2×, that is `(45.5,692.5)` with size 351×111.5 CSS pixels. The retained [frame before the show](show-before-13.450001-pts-206592.png), [first visible frame](show-after-13.466668-pts-206848.png), [last fully visible frame](hide-before-17.783337-pts-273152.png), and [first absent frame](hide-after-17.800004-pts-273408.png) show both boundaries; the full frame ledgers preserve adjacent PTS and PNG hashes.

The default-felt web UI now displays the 702×223 source crop directly at that measured scale and position. The crop keeps the source text raster and H.264 edge pixels, while its sRGB profile is assigned without changing RGB values. A same-size 884×1920 Chrome capture has a mean absolute RGB difference of 3.20 over the bubble rectangle. Alternate felt themes keep the live-text CSS fallback. The web appearance delay remains 350 ms after the first tableau move; on the default felt, the bubble appears and disappears without a visible easing, matching the one-frame source boundaries. The hide timer is 4,333 ms after the show callback; exact pointer-release timing remains unavailable in the recording.

Recreate the retained boundary frames and crop:

```sh
swift tools/extract_video_window.swift research/solitaire-master/source-videos/gLd0HXtDt5I.mp4 \
  13.4 13.6 0.016667 /tmp/solitaire-tutorial-show-60fps 60 1300 760 390
swift tools/extract_video_window.swift research/solitaire-master/source-videos/gLd0HXtDt5I.mp4 \
  17.6 17.9 0.016667 /tmp/solitaire-tutorial-hide-60fps 60 1300 760 390
python3 tools/extract_tutorial_tip_asset.py \
  /tmp/solitaire-tutorial-show-60fps/frame-00004-req-013.466668-pts-206848.png
```

This is a third-party gameplay capture; it establishes the recorded appearance and timing, not first-party source code or input-event timestamps.

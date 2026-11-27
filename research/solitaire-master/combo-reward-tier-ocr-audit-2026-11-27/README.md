# Combo reward tier OCR audit

The source is the third-party gameplay recording at [YouTube](https://www.youtube.com/watch?v=gLd0HXtDt5I), saved locally as `source-videos/gLd0HXtDt5I.mp4`. Its SHA-256 is `56489d4aac9256d15de461d236a990df361621363fdc2904341a0e8e9cb64928`; the video is 884×1920 at 60 fps with a 15,360 PTS timescale. The extracted full-resolution frames and their PTS and PNG hashes are listed in [`frames.csv`](frames.csv).

The 65.4 s foundation event changes the score and move count by +20 and +1. A 2♥ is moving into the heart foundation at 65.5 s, when `COMBO` is readable but the moving card covers the numeral after it. `Good` appears by 65.85 s. The digit is still occluded in the retained full-frame sample, so this clip does **not** establish that Good belongs to COMBO 2.

The 101.95 s event also changes the score and move count by +20 and +1. A 4♣ is moving into the club foundation; `COMBO 2` is readable by 102.3 s and `Great` appears at 102.5 s.

I scanned the complete 1,044-second recording at 250 ms intervals with [`scan_video_combo_feedback.swift`](../../../tools/scan_video_combo_feedback.swift). The raw OCR hits are in [`ocr-feedback-hits-0-1044s-step-0.25.csv`](ocr-feedback-hits-0-1044s-step-0.25.csv); a sample can miss a short animation or misread text, so the retained full-resolution frames were checked visually. Clear co-occurrences include:

| Source time | Visible feedback | Frame |
| --- | --- | --- |
| 255.75 s | `COMBO 5` + `Amazing` | [frame](frames/amazing-combo5-255.75s-pts-3928320.png) |
| 259.25 s | `COMBO 9` + `Good` | [frame](frames/good-combo9-259.25s-pts-3982080.png) |
| 293.25 s | `COMBO 3` + `Amazing` | [frame](frames/amazing-combo3-293.25s-pts-4504320.png) |
| 718.00 s | `COMBO 3` + `Good` | [frame](frames/good-combo3-718.00s-pts-11028480.png) |
| 102.30–102.50 s | `COMBO 2` + `Great` | [card frame](frames/great-combo2-card-4c-102.30s-pts-1571328.png), [reward frame](frames/great-combo2-banner-102.50s-pts-1574400.png) |

The same displayed combo count can appear with different feedback tiers, so these samples do not establish a simple one-to-one mapping from combo count to tier. They also do not reveal the source's selection rule. The replica keeps its current playable combo feedback; exact reward-tier behavior remains a known fidelity gap.

| Event | Score and moves | Card/action | Feedback |
| --- | --- | --- | --- |
| 65.4 s | 200 → 220; 28 → 29 | 2♥ enters the heart foundation | `COMBO` is visible at 65.5 s, but its numeral is hidden; `Good` appears by 65.85 s. |
| 101.95 s | 484 → 504; 59 → 60 | 4♣ enters the club foundation | `COMBO 2` is visible by 102.3 s; `Great` appears at 102.5 s. |

The source `Good` composite matches the mixed recording at 65.5 s with normalized correlation `0.999073`; the source `Great` reward-only crop matches at 102.7 s with correlation `0.998612`. Both samples are documented in the [Good audio review](../foundation-good-audio-window-2026-11-25/README.md) and [Great audio review](../great-reward-audio-window-2026-11-25/README.md). The existing score OCR ledgers are in [`scoring-source-audit-2026-11-27`](../scoring-source-audit-2026-11-27/README.md).

## Reproduce the selected frames

```sh
swift tools/extract_video_window.swift \
  research/solitaire-master/source-videos/gLd0HXtDt5I.mp4 \
  65.05 65.9 0.05 /tmp/solitaire-combo-good-frames
swift tools/extract_video_window.swift \
  research/solitaire-master/source-videos/gLd0HXtDt5I.mp4 \
  101.8 102.6 0.1 /tmp/solitaire-combo-great-frames
swift tools/scan_video_combo_feedback.swift \
  research/solitaire-master/source-videos/gLd0HXtDt5I.mp4 \
  0 1044 0.25 /tmp/solitaire-combo-feedback-0-1044.csv
```

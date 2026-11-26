# Stock recycle return flight

This audit resolves the recycle transition that the 100 ms pass in [`stock-recycle-transition-2026-11-25`](../stock-recycle-transition-2026-11-25/README.md) could not show. It reviews a 60 fps window from the third-party [Solitaire Master gameplay recording](https://www.youtube.com/watch?v=gLd0HXtDt5I). The local source is 884×1920, time scale 15,360, and SHA-256 `56489d4aac9256d15de461d236a990df361621363fdc2904341a0e8e9cb64928`. The retained crop is `(480,400,404,230)`; [`frames.csv`](frames.csv) records every sample's actual PTS and PNG hash, and [`manifest.json`](manifest.json) records the source and extraction parameters. Four selected crops preserve the pre-flight, first visible flight, middle flight, and settled states.

| Source time / PTS | Observation |
| --- | --- |
| 98.100006 s / 1,506,816 | The waste still shows the 8♥ face. |
| 98.150007 s / 1,507,584 | The three-card waste fan is still in place. |
| 98.166674 s / 1,507,840 | The visible cards have turned face down and begun returning; the leading back is around source `(558,429)`. The stock's recycle arrow and count remain visible at the destination. |
| 98.183341–98.316677 s | The backs travel rightward across the waste-to-stock gap. Approximate leading-card x positions sampled at 60 fps are 624, 652, 677, 698, 717, 717, 732, 743, and 751 pixels. |
| 98.333344 s / 1,510,400 | The returned cards have settled into a single back at approximately `(758,429)`. |
| 98.800017 s / 1,517,568 | The next draw reveals 9♠ and the stock count drops from 11 to 10. |

The visible return lasts about 167 ms from the first sampled in-flight frame through the settled frame. This bounds the observed animation but does not reveal the exact touch-release instant. The replica therefore uses a 167 ms ease-out flight for the three visible waste cards, flips them to backs, keeps the recycle arrow and updated count at the stock destination, then restores the normal stock artwork. The precise easing curve and initial unsampled motion remain implementation approximations.

To regenerate the 60 fps review crops and ledger:

```sh
swift tools/extract_video_window.swift research/solitaire-master/source-videos/gLd0HXtDt5I.mp4 \
  97.8 98.5 0.016667 /tmp/solitaire-recycle-60fps-full-review 480 400 404 230
```

The crop PNGs selected for this audit are preserved here; the complete 42-frame extraction stays in `/tmp` to avoid checking in a redundant frame sequence. The source recording is a third-party reference for observed play, not a definitive first-party timing specification.

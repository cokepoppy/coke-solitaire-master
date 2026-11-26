# Win-streak fan endpoint pixel fit

This pass remeasures the settled 52-card fan at 307.000 seconds in the 60 fps [Solitaire Master gameplay recording](https://www.youtube.com/watch?v=gLd0HXtDt5I). The source MP4 is 884×1920 with PTS time scale 15,360 and SHA-256 `56489d4aac9256d15de461d236a990df361621363fdc2904341a0e8e9cb64928`. The retained source frame is PTS 4,715,520 with PNG-byte SHA-256 `af29061de9306c5e42529cbc18e795db83b8ca5c8303a80d12d7aab2d9bd0a46`.

The mobile Chrome test renders at 390×844. The source is scaled to 390×847 with Lanczos and cropped to the same viewport. A binary mask selects neutral card pixels (`mean RGB > 0.18`, channel spread `< 0.20`); the fixed title/reward overlay rectangle `(42,270)–(350,400)` is excluded in both images. This keeps the score focused on the visible fan silhouette, including cards outside the central title and reward.

## Endpoint change

Cards remain grouped left-to-right in Hearts, Diamonds, Spades, Clubs order. With suit index `s` and rank progress `p` from Ace `0` to King `1`, the new endpoint is:

```text
x = -17% + 25% × s + 35% × p
y = 72.5% - 9% × s - 21% × p
    + 7% × (1 - p) for suits after Hearts
    + 4% × sin(πp) for Hearts
```

The previous map used x coefficients `-15, 25, 40` and y coefficients `72.5, -9, -24`, with a 4% low-rank stack and 6% Hearts curve. E2E now checks the Ace of Hearts, King of Hearts, and King of Clubs endpoint coordinates.

## Comparison

| Card silhouette region | Previous IoU | New IoU | Previous source-mask RGB MAE | New source-mask RGB MAE |
| --- | ---: | ---: | ---: | ---: |
| y=320–680, excluding fixed overlay | 0.3969 | 0.4112 | 0.0697 | 0.0632 |
| y=200–700, excluding fixed overlay | 0.3880 | 0.3982 | 0.0750 | 0.0697 |

On the primary y=320–680 region, source-mask RGB MAE fell about 9.4%; the union-mask MAE fell from 0.0954 to 0.0933. The prior endpoint values are from the parent `main` commit `3dc51f2`; both screenshots use the same win-flow E2E setup.

## Reproduce

```sh
swift tools/extract_video_window.swift \
  research/solitaire-master/source-videos/gLd0HXtDt5I.mp4 \
  307 307 1 /tmp/solitaire-win-streak-source
npx playwright test -g 'winning shows a result card and records a completed daily challenge'
python3 tools/compare_win_streak_fan.py \
  /tmp/solitaire-win-streak-source/frame-00000-req-307.000000-pts-4715520.png \
  test-results/mobile-win-streak.png \
  --exclude-fixed-overlays
python3 tools/compare_win_streak_fan.py \
  /tmp/solitaire-win-streak-source/frame-00000-req-307.000000-pts-4715520.png \
  test-results/mobile-win-streak.png \
  --top 200 --bottom 700 --exclude-fixed-overlays
```

This fits one observed win animation and its fixed deal-specific state. Video compression, browser filtering/rasterization, and the different underlying gameplay board still contribute to the remaining error; the new fit improves the fan silhouette but does not establish a universal source scatter formula.

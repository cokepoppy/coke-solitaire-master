# Source-timed win-result entrance

This pass resolves the transition after the 52-card win fan. The ignored source video is `research/solitaire-master/source-videos/gLd0HXtDt5I.mp4`, 884×1920 at 60 fps, PTS time scale 15,360, SHA-256 `56489d4aac9256d15de461d236a990df361621363fdc2904341a0e8e9cb64928`.

## Observed sequence

At 307.8 s (PTS 4,727,808), the board is dimmed and a small crown appears at the top. At 308.0 s (PTS 4,730,880), the `YOU WIN` text appears over a navy result field. By 308.1 s, the result banner and the initial score 3,614 are visible. The Best badge and percentage are visible by 308.5 s; Time begins fading in around 308.6 s and is bright by 308.9 s; Moves begins fading in by 308.9 s; the trophy appears around 309.0 s and is bright by 309.4 s, when the New Deal button is fully visible and the score reaches 5,223. The win-audio crop's first RMS event is at 308.180 s, 380 ms after the result transition begins and about 180 ms after the title appears.

The 50 ms score samples from 308.10–309.40 s are:

```text
3614, 3785, 3996, 4092, 4229, 4391, 4466, 4568, 4691, 4746,
4822, 4908, 4947, 4998, 5056, 5081, 5114, 5149, 5163, 5181,
5199, 5205, 5213, 5219, 5221, 5222, 5223
```

The full 31-frame ledger contains PTS, timestamps, and SHA-256 of each cropped PNG in [`frames.csv`](frames.csv); its source metadata and extraction settings are in [`manifest.json`](manifest.json). The crop is `(120,760,650,300)` from each 884×1920 source frame. The intro sprites are cropped at source scale and alpha-keyed: `win-result-crown-intro-reference.png` hash `33ee4578d61836873295d37c283f18d41228a3d201923d1f54049e9f4bd8403c`, and `win-result-title-intro-reference.png` hash `d1b08c0335abae99321f3762e24af037a60fa4ebf67b8d291c4445b286e48436`. The exact source-frame PTS and PNG-byte hashes are preserved in [`intro-frames.csv`](intro-frames.csv) with extraction metadata in [`intro-manifest.json`](intro-manifest.json); the selected frames hash to `b7b7e477810832b23592ae136917b776d1cead287ebc15daeac69e5623140c6b` (crown, PTS 4,727,808) and `fae66c6e1cb86cc79f39458bc752e3414155efc823774409ee8c448232892b53` (title, PTS 4,730,880). Their crop locations and reproducible command are documented in [`assets/ui/README.md`](../../../assets/ui/README.md).

## Browser behavior

The mobile result now follows the same order: crown over the dimmed board, title at +200 ms, banner and score at +300 ms, the win-audio cue at +380 ms, Best/percentage at +700 ms, Time at +800 ms, Moves at +1,100 ms, trophy at +1,200 ms, and New Deal at +1,400 ms. The stat and trophy fades continue for about 320–400 ms, matching their sampled reveal. The score starts at the recorded 3,614 baseline and follows the 27 observed 50 ms values over 1.3 seconds. For other game scores, the observed count-up curve is scaled to that game's final score; the video contains only one completed score, so scaling the curve is an implementation inference. New Deal remains disabled until its source-timed reveal.

The source audio is the mixed-recording candidate at 308.180–310.320 s described in [`docs/audio-audit.md`](../../../docs/audio-audit.md); the replica schedules that existing sample 380 ms after the transition starts. This aligns its audible onset with the first measured source event but does not make the mixed recording an isolated original stem.

The source-sized E2E verifies initial score, title/banner ordering, an advancing intermediate value, settled score glyph geometry, delayed sound scheduling, and that the interactive result controls unlock. Reproduce with:

```sh
npx playwright test -g 'result artwork aligns with the 310-second source frame|winning shows a result card and records a completed daily challenge'
```

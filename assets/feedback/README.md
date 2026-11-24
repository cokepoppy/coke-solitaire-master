# Reward animation cutouts

The `Good` and `Great` animated WebP files are transparent cutouts from the 60 fps gameplay capture [gLd0HXtDt5I](https://www.youtube.com/watch?v=gLd0HXtDt5I), whose SHA-256 is `56489d4aac9256d15de461d236a990df361621363fdc2904341a0e8e9cb64928`.

`combo-good.webp` covers source time 65.500–66.483 seconds. It preserves the `Good` word animation and sparkles that follow the 2♥ foundation placement. `combo-great.webp` covers 101.950–102.983 seconds and preserves the `Great` animation after the 4♣ foundation placement. The capture shows the word beginning around 65.7 and 102.333 seconds, respectively.

Each animation is cropped from a 324×130 region at source coordinates x=280, y=1020, then trimmed to x=40, y=0, width=244, height=130. The alpha channel comes from pixel differences against a clean frame from the same background region. [`tools/build_reward_animation.py`](../../tools/build_reward_animation.py) records its crop and frame-count metadata in the adjacent JSON sidecars. The original game uses a flat green felt in these captures; the cutouts preserve its glow and shadow colors.

Recreate the Good sprite with:

```sh
swift tools/extract_video_window.swift research/solitaire-master/source-videos/gLd0HXtDt5I.mp4 65.5 66.5 0.016667 /tmp/reward-good 280 1020 324 130
swift tools/extract_video_window.swift research/solitaire-master/source-videos/gLd0HXtDt5I.mp4 65.5 65.5 0.016667 /tmp/reward-good-base 280 1020 324 130
python3 tools/build_reward_animation.py /tmp/reward-good /tmp/reward-good-base/frame-00000-req-065.500000-pts-1006080.png assets/feedback/combo-good.webp --crop 40 0 244 130
```

For Great, use the same extraction commands with ranges `101.95 103.0` and `101.95 101.95`, output folders `/tmp/reward-great` and `/tmp/reward-great-base`, and reference frame `frame-00000-req-101.950000-pts-1565952.png`.

The large `Amazing` banner overlaps cards in this capture, so its extracted frames contain board artifacts. The web app retains its existing CSS recreation for that banner until a clean source cutout can be made.

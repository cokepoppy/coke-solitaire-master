# Theme artwork

`mountain-valley.jpg` is an original generated landscape illustration used as an optional table background. It is a visual approximation inspired by the mountain theme shown in Solitaire Master promotional screenshots; it is not an extracted game asset.

The default theme gallery now uses eight artwork crops from the 884×1920 gameplay frame at PTS 4,961,280 (323 s): `theme-background-lagoon-reference.png`, `theme-background-emerald-reference.png`, `theme-background-mountain-reference.png`, `theme-background-felt-reference.png`, `theme-background-midnight-reference.png`, `theme-background-plum-reference.png`, `theme-background-forest-reference.png`, and `theme-background-violet-reference.png`. The first two previews are 298/304×117 px landscape swatches; the six fully visible lower previews are about 300×300 px. Their grid positions and aspect ratios follow the source frame. `theme-background-felt-reference.png` comes from the selected tile, so the crop excludes its green frame and restores the small bottom-right check badge area from the horizontally symmetric gradient. Rebuild these previews with:

```sh
swift tools/extract_video_window.swift research/solitaire-master/source-videos/gLd0HXtDt5I.mp4 323 323 1 /tmp/solitaire-theme-background-source
python3 tools/extract_theme_background_assets.py /tmp/solitaire-theme-background-source/frame-00000-req-323.000000-pts-4961280.png
```

The capture shows only the top portions of two more tiles at the bottom edge. Their complete artwork and the full gallery item count are not established by this frame. These crops reproduce gallery previews; the playable table's alternate-color backgrounds, including the full-resolution Mountain landscape, still need source-quality assets.

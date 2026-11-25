# Theme artwork

`mountain-valley.jpg` is an original generated landscape illustration used as an optional table background. It is a visual approximation inspired by the mountain theme shown in Solitaire Master promotional screenshots; it is not an extracted game asset.

The source Backgrounds gallery contains eleven tiles. The first eight preview crops come from the 884×1920 gameplay frame at PTS 4,961,280 (323 s). Three more previews are fully visible after scrolling at PTS 5,045,760 (328.5 s). The later frame is `research/solitaire-master/source-videos/gLd0HXtDt5I.mp4` (SHA-256 `56489d4aac9256d15de461d236a990df361621363fdc2904341a0e8e9cb64928`); the exact 328.5 s PNG has SHA-256 `3a31cd3881e58be2069ee849bee4c3bd20a2153bc1ce6236a20075da176064af`.

Captured preview PNGs with an embedded HDTV ICC profile are tagged as sRGB without changing their RGB samples, so mobile Chrome displays the source colors directly. The raw file hashes are checked in `tests/fixtures/source-art-srgb-hashes.json`; source-frame visual comparisons for the Backgrounds, Face Style, and Back Style pages are recorded in [`research/solitaire-master/theme-gallery-source-pixel-audit-2026-11-25/`](../../research/solitaire-master/theme-gallery-source-pixel-audit-2026-11-25/).

The three newly captured crops are `theme-background-green-9-reference.png` (298×298; crop `(112,1083,410,1381)`), `theme-background-green-10-reference.png` (304×298; crop `(472,1083,776,1381)`), and `theme-background-green-11-reference.png` (298×298; crop `(112,1452,410,1750)`). Their visible source tiles have no readable names, so “Green 9/10/11” are descriptive accessibility labels. The tabs remain at the top of the scroll area in the 328.5 s frame. Rebuild all eleven preview crops with:

```sh
swift tools/extract_video_window.swift research/solitaire-master/source-videos/gLd0HXtDt5I.mp4 323 323 1 /tmp/solitaire-theme-background-source
swift tools/extract_video_window.swift research/solitaire-master/source-videos/gLd0HXtDt5I.mp4 328.5 328.5 1 /tmp/solitaire-theme-background-lower
python3 tools/extract_theme_background_assets.py /tmp/solitaire-theme-background-source/frame-00000-req-323.000000-pts-4961280.png assets/themes --lower-frame /tmp/solitaire-theme-background-lower/frame-00000-req-328.500000-pts-5045760.png
```

The crop for `theme-background-felt-reference.png` excludes its green selected frame and restores the small bottom-right check area from the horizontally symmetric gradient. These are exact gallery previews. The source video does not show the full-screen gameplay boards for every theme, so the new themes’ in-game radial colors remain approximations pending those frames or original assets.

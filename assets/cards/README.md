# Card artwork

The 52 base face-card SVGs and the alternate blue/red card-back SVGs in this directory are from [OpenDecks: Public Domain and CC0 Playing Cards](https://github.com/hhonbo/OpenDecks-Public-Domain-and-CC0-Playing-Cards). That project releases these assets as public domain / CC0; its full license text is preserved in [CC0-1.0.txt](CC0-1.0.txt). Credit is included here as a courtesy.

The source deck credits public-domain court-card art from vector-playing-cards, CC0 suit pips and rank glyphs from Openclipart, and CC0 card-back artwork from OpenGameArt. The SVGs are served locally so the game can load and play offline.

`back-solitaire-master-source-20s.png` is the unmodified 118×177 crop at `(758,429)` from PTS 307200 (20s) in the 884×1920 gameplay frame; the opening replay uses it while all 24 stock cards remain, matching the screenshot's baked-in counter. Its SHA-256 is `ea9d6f6a86b77a13db3266601d96a2c8237ffa4711063f28f5d3b92609465533`. Rebuild it with `python3 tools/extract_source_stock_back_20s.py` after creating the 20-second keyframe described in [`docs/video-frame-audit.md`](../../docs/video-frame-audit.md).

`back-solitaire-master-source.png` is the unmodified 118×177 crop at `(758,429)` from PTS 153600 (10s); it preserves the same baked-in `24` counter as a secondary source sample. `back-solitaire-master-reference.png` is that crop with the counter and its translucent badge cleared. A vector underlay restores the pattern in that small area on lower-count stock cards, tableau stacks, and gallery previews. `back-solitaire-master.svg` remains the transition art during deal and flip animations. The PNGs and SVG are cached for offline play. Regenerate the 10-second pair with `python3 tools/extract_source_card_back.py` after creating the 10-second keyframe described in [`docs/video-frame-audit.md`](../../docs/video-frame-audit.md).

At 327 s (PTS 5,022,720), the Back Style gallery shows all eight backs. The seven unselected previews are source crops resized from 200×300 to 118×177. Blue was previously extracted with `python3 tools/extract_source_blue_card_back.py`; extract the other six with `python3 tools/extract_source_card_backs.py`:

The gallery now uses dedicated, unscaled 200×300 crops for the seven unselected previews (`back-*-gallery-reference.png`); the selected Ruby preview uses a 216×314 crop that retains its green outline and checkmark. `tools/extract_card_back_gallery_assets.py` rebuilds these from PTS 5,022,720. The older 118×177 crops remain the board-card art. The gallery E2E checks all eight 200×300 tile positions against the 884×1920 source frame. Across all eight source back PNGs, the crops are pixel-identical to their source rectangles.

Seventy-two source-frame PNGs in this project were encoded with an HDTV ICC profile even though their recorded channel values are already the desired sRGB samples. Their embedded profile is now tagged as sRGB without changing the decoded RGB pixels, preventing Chrome from applying an unwanted color conversion. `tests/fixtures/source-art-srgb-hashes.json` and the `color-profiled source artwork keeps its recorded PNG files` E2E test preserve the exact delivered-file hashes.

| Asset | Source crop `(x1,y1,x2,y2)` | Asset SHA-256 |
| --- | --- | --- |
| `back-teal-reference.png` | `(100,513,300,813)` | `b9b2fd9f143edca573c279133b21000131dbcb65c284007703886d9395cebd38` |
| `back-lattice-reference.png` | `(342,513,542,813)` | `c9b59c7d173c8a5d6fe1b45450fede469fa409843c661ddc0ca53422dcac33ae` |
| `back-blue-reference.png` | `(583,513,783,813)` | `ee0d6b294520ff658c0177d50d2c4595ed9d2f1d63a69129f47776cba549556d` |
| `back-spade-reference.png` | `(100,869,300,1169)` | `c3bc1d1281509084647a2226f172b075a2fbb4b61bfa2ddaf013a22593175848` |
| `back-coral-reference.png` | `(583,869,783,1169)` | `1860729f4b5ff52e8ba4501bcdc08d1ecbddd54f29f18e5c1c48f614338e2b58` |
| `back-floral-reference.png` | `(100,1224,300,1524)` | `fb75df913b72d8c3b9d00764382b57095af564e566af612a71d4a62b59d5f997` |
| `back-amber-reference.png` | `(342,1224,542,1524)` | `c93fc0b1f7db8b1b70d0e71ee4a458c99699433dc8218de69373fa06c82c3f37` |

The source MP4 SHA-256 is `56489d4aac9256d15de461d236a990df361621363fdc2904341a0e8e9cb64928`; the 327-second source-frame PNG SHA-256 is `7bd63feaacc18412cf3ec5763f9cd40c382e23c552e94db795d8146b481c000f`. The Ruby preview is selected and covered by a green check in this frame, so the game keeps the unobscured Solitaire Master back crop from the 10-second gameplay frame instead.

The following 118×177 PNGs are crops of matching cards from the gameplay video [`gLd0HXtDt5I`](https://www.youtube.com/watch?v=gLd0HXtDt5I). Coordinates are source pixels in its 884×1920 frames; PTS uses its 1/15360 time base.

| Card image | PTS (time) | Crop origin (x, y) |
| --- | ---: | ---: |
| `5-of-diamonds-reference.png` | 153600 (10s) | (8, 646) |
| `queen-of-spades-reference.png` | 153600 (10s) | (133, 679) |
| `king-of-diamonds-reference.png` | 153600 (10s) | (383, 719) |
| `jack-of-diamonds-reference.png` | 153600 (10s) | (508, 741) |
| `queen-of-clubs-reference.png` | 307200 (20s) | (633, 744) |
| `queen-of-diamonds-reference.png` | 1152000 (75s) | (133, 734) |
| `queen-of-hearts-reference.png` | 4608000 (300s) | (8, 735) |
| `king-of-clubs-reference.png` | 14407680 (938s) | (622, 428) |
| `king-of-hearts-reference.png` | 2764800 (180s) | (622, 428) |
| `king-of-spades-reference.png` | 1382400 (90s) | (258, 647) |
| `jack-of-clubs-reference.png` | 4147200 (270s) | (383, 823) |
| `jack-of-hearts-reference.png` | 1152000 (75s) | (633, 829) |
| `jack-of-spades-reference.png` | 1612800 (105s) | (622, 428) |

All twelve Jack, Queen, and King cards use complete source-frame crops; the same table includes the 5♦. Nineteen further number-card faces have 118×177 crops from the gameplay recording:

| Card image | PTS (time) |
| --- | ---: |
| `6-of-hearts-reference.png` | 353280 (23s) |
| `6-of-clubs-reference.png` | 307200 (20s) |
| `2-of-clubs-reference.png` | 307200 (20s) |
| `4-of-clubs-reference.png` | 307200 (20s) |
| `3-of-clubs-reference.png` | 307200 (20s) |
| `9-of-diamonds-reference.png` | 307200 (20s) |
| `9-of-spades-reference.png` | 814080 (53s) |
| `2-of-diamonds-reference.png` | 844800 (55s) |
| `ace-of-spades-reference.png` | 921600 (60s) |
| `6-of-diamonds-reference.png` | 952320 (62s) |
| `4-of-hearts-reference.png` | 967680 (63s) |
| `ace-of-clubs-reference.png` | 1075200 (70s) |
| `5-of-hearts-reference.png` | 1136640 (74s) |
| `6-of-spades-reference.png` | 1244160 (81s) |
| `7-of-hearts-reference.png` | 1274880 (83s) |
| `2-of-spades-reference.png` | 1290240 (84s) |
| `8-of-clubs-reference.png` | 1320960 (86s) |
| `10-of-hearts-reference.png` | 1367040 (89s) |
| `8-of-hearts-reference.png` | 1459200 (95s) |

The 8♥ crop uses source rectangle `(648, 428, 118, 177)` from the 95-second gameplay frame; the full card face is visible in that source frame.

The 6♣, 2♣, 4♣, 3♣, Q♣, and 9♦ use complete crops from the 20-second opening frame at `(133,646)`, `(258,695)`, `(8,732)`, `(508,720)`, `(633,744)`, and `(758,794)`, respectively; each crop is 118×177 pixels. The 6♣ and 2♣ replace App Store crops whose blue-tinted clubs did not match the black artwork. These six visible faces come from the exact frame used by the opening-board replay.

For the 884×1920 replay comparison, the six 20-second faces above and the 5♦, Q♠, K♦, and J♦ are unscaled crops from AVFoundation frames, tagged with the sRGB ICC profile using `sips -e` without changing their RGB channel values. The additional four use the 10-second frame at PTS 153600 (PNG SHA-256 `1eac5f82681bbf39378262383d91904318c3806799e5fa006d57039fac8145aa`) and the coordinates in the table above. This avoids an extra color conversion in Chrome. Together, the ten source-cropped faces reduce tableau MAE from 11.099697 to 10.618841; the exact screenshot comparison is recorded in the [visual comparison](../../research/solitaire-master/source-opening-visual-match-2026-11-25/README.md).

On macOS, `sips -c 177 118 --cropOffset Y X source-frame.png --out card-reference.png` reproduces a 118×177 crop without resampling; replace `Y` and `X` with the documented source origin.

The matching reference PNG is selected at runtime and included in the offline shell cache. The remaining number-card faces are listed with their sources below.

Three additional number-card faces are 118×177 source-frame crops from the full gameplay recording:

| Card image | PTS (time) | Crop origin (x, y) |
| --- | ---: | ---: |
| `10-of-clubs-reference.png` | 1843200 (120s) | (633, 916) |
| `7-of-diamonds-reference.png` | 3732480 (243s) | (622, 428) |
| `2-of-hearts-reference.png` | 9231360 (601s) | (622, 428) |

Seven more number-card faces are crops from the official [App Store listing](https://apps.apple.com/us/app/solitaire-master/id6464113198?platform=ipad), from its 1242×2688 screenshot renditions. Each listed 116×174 source rectangle is resized to the app's 118×177 card art size:

| Card image | Listing screenshot | Crop origin (x, y) |
| --- | ---: | ---: |
| `ace-of-hearts-reference.png` | 4 | (201, 799) |
| `7-of-clubs-reference.png` | 4 | (563, 1084) |
| `3-of-diamonds-reference.png` | 4 | (927, 1223) |
| `4-of-spades-reference.png` | 2 | (201, 1015) |
| `8-of-spades-reference.png` | 2 | (443, 1061) |
| `3-of-hearts-reference.png` | 3 | (563, 1084) |
| `3-of-spades-reference.png` | 2 | (807, 1129) |

The 3♠ shown in screenshot 2 has a gold selected-card glow. Its rank, suit, and center artwork remain source pixels; the 6-pixel perimeter is reconstructed from the unselected 4♠ card frame in the same screenshot so the selection glow does not become part of the default deck.

Two more number-card faces are crops from the official [Google Play listing](https://play.google.com/store/apps/details?id=solitaire.classic.hungrystudio.free.klondike.card.patience). They come from the 1200×675 first listing image; the listed source rectangles are resized to 118×177:

| Card image | Listing image | Crop origin (x, y) | Source size |
| --- | ---: | ---: | ---: |
| `ace-of-diamonds-reference.png` | 1 | (274, 152) | 116×172 |
| `10-of-diamonds-reference.png` | 1 | (943, 480) | 114×170 |

Seven further number-card faces are complete crops from full gameplay frames. Each 118×177 crop was checked against the full 884×1920 source frame to ensure that another card, stock counter, selection glow, or UI overlay does not cover the face:

| Card image | PTS (time) | Crop origin (x, y) |
| --- | ---: | ---: |
| `5-of-clubs-reference.png` | 8294400 (540s) | (508, 907) |
| `8-of-diamonds-reference.png` | 9830400 (640s) | (8, 1077) |
| `10-of-spades-reference.png` | 11059200 (720s) | (133, 907) |
| `7-of-spades-reference.png` | 11212800 (730s) | (383, 1217) |
| `5-of-spades-reference.png` | 11673600 (760s) | (133, 428) |
| `4-of-diamonds-reference.png` | 14745600 (960s) | (383, 428) |
| `9-of-clubs-reference.png` | 15052800 (980s) | (383, 994) |

The 10♣ crop comes from the default black-suit gameplay frame at 120 seconds. It was re-extracted independently from the full source frame and pixel-compared with the committed 118×177 crop; the complete face is unobstructed. Source PTS, frame hash, crop hash, and extraction coordinates are recorded in [`research/solitaire-master/source-card-10-of-clubs-2026-11-25`](../../research/solitaire-master/source-card-10-of-clubs-2026-11-25).

The runtime selects these crops for their matching cards and includes them in the offline shell cache. All twelve court cards and all forty number-card faces use source-frame or official store crops.

The complete 9♥ face is directly cropped from the gameplay frame at PTS 4623360 (301s), at `(133, 990)`. It is the unobscured bottom card in tableau column 2, with no card overlap or selection effect. The crop is 118×177 and its source-video hash, frame PTS, crop coordinates, and PNG hash are recorded in `9-of-hearts-reference.json`.

## Alternate Face Style samples

The Face Style gallery at 325 s shows the same five sample cards—10♦, J♣, Q♥, K♠, and A♦—in styles 1–5. For styles 3, 4, and 5, `face-style-<style>-<card>-reference.png` contains the matching sample crop from that style's 607×197 source preview strip, resized to 118×177. Rebuild all 15 assets from the committed preview strips with:

```sh
python3 tools/extract_theme_face_samples.py
```

The runtime switches these five cards to the selected style and caches the crops for offline play. Official App Store screenshot 3 also exposes nine complete, unobstructed Style 4 faces. The 1242×2688 source image hash is `6c613726538104f30dd053e2d9cdb0499961a4fd87fff1b42e4f1aee4cbc7cd4`; each 116×174 crop is resized to 118×177. Rebuild the nine crops with:

```sh
python3 tools/extract_style4_appstore_samples.py /path/to/iphone-3.jpg
```

| Card image | Crop origin `(x,y)` |
| --- | ---: |
| `face-style-4-2-of-clubs-reference.png` | (201, 799) |
| `face-style-4-ace-of-hearts-reference.png` | (321, 799) |
| `face-style-4-10-of-clubs-reference.png` | (803, 799) |
| `face-style-4-king-of-clubs-reference.png` | (321, 1015) |
| `face-style-4-3-of-hearts-reference.png` | (563, 1084) |
| `face-style-4-king-of-hearts-reference.png` | (683, 1108) |
| `face-style-4-jack-of-hearts-reference.png` | (803, 1173) |
| `face-style-4-6-of-clubs-reference.png` | (923, 1132) |
| `face-style-4-6-of-diamonds-reference.png` | (201, 1500) |

The overlapped Queen of Clubs in screenshot 3 is deliberately excluded because Jack of Hearts covers its lower half. These nine crops plus the five gallery samples give Style 4 fourteen directly observed faces; its other 38 faces remain unverified. Styles 3 and 5 still have only their five gallery samples, so their other 47 faces use Solitaire Master artwork. The alternate decks are not complete.

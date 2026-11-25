# Card artwork

The 52 base face-card SVGs and the alternate blue/red card-back SVGs in this directory are from [OpenDecks: Public Domain and CC0 Playing Cards](https://github.com/hhonbo/OpenDecks-Public-Domain-and-CC0-Playing-Cards). That project releases these assets as public domain / CC0; its full license text is preserved in [CC0-1.0.txt](CC0-1.0.txt). Credit is included here as a courtesy.

The source deck credits public-domain court-card art from vector-playing-cards, CC0 suit pips and rank glyphs from Openclipart, and CC0 card-back artwork from OpenGameArt. The SVGs are served locally so the game can load and play offline.

`back-solitaire-master-source.png` is the unmodified 118×177 crop at `(758,429)` from PTS 153600 (10s) in the 884×1920 gameplay frame; it preserves the source stock's baked-in `24` counter and is used while all 24 cards remain. `back-solitaire-master-reference.png` is the same crop with the stock counter and its translucent badge cleared. A vector underlay restores the pattern in that small area on lower-count stock cards, tableau stacks, and gallery previews. `back-solitaire-master.svg` remains the transition art during deal and flip animations. Both PNGs and the SVG are cached for offline play. Regenerate them with `python3 tools/extract_source_card_back.py` after creating the keyframe described in [`docs/video-frame-audit.md`](../../docs/video-frame-audit.md).

`back-blue-reference.png` replaces the generic blue SVG in the Blue diamonds style with the unselected card-back preview from the gameplay recording at 327 s / PTS 5,022,720. Crop `(583,513,783,813)` from the 884×1920 frame (the right-exclusive rectangle is 200×300), then downsample to 118×177 with `python3 tools/extract_source_blue_card_back.py`. The source MP4 SHA-256 is `56489d4aac9256d15de461d236a990df361621363fdc2904341a0e8e9cb64928`, the source-frame PNG SHA-256 is `7bd63feaacc18412cf3ec5763f9cd40c382e23c552e94db795d8146b481c000f`, and the resulting asset SHA-256 is `ee0d6b294520ff658c0177d50d2c4595ed9d2f1d63a69129f47776cba549556d`.

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

The 6♣, 2♣, 4♣, 3♣, Q♣, and 9♦ use complete crops from the 20-second opening frame at `(133,646)`, `(258,695)`, `(8,732)`, `(508,720)`, `(633,744)`, and `(758,794)`, respectively; each crop is 118×177 pixels. The 6♣ and 2♣ replace App Store crops whose blue-tinted clubs did not match the black artwork. These six visible faces now come from the exact frame used by the opening-board replay.

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

The runtime switches these five cards to the selected style and caches the crops for offline play. The source does not show the remaining 47 faces for those styles, so they keep the Solitaire Master artwork; these assets do not imply that the alternate decks are complete.

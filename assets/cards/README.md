# Card artwork

The 52 base face-card SVGs and the alternate blue/red card-back SVGs in this directory are from [OpenDecks: Public Domain and CC0 Playing Cards](https://github.com/hhonbo/OpenDecks-Public-Domain-and-CC0-Playing-Cards). That project releases these assets as public domain / CC0; its full license text is preserved in [CC0-1.0.txt](CC0-1.0.txt). Credit is included here as a courtesy.

The source deck credits public-domain court-card art from vector-playing-cards, CC0 suit pips and rank glyphs from Openclipart, and CC0 card-back artwork from OpenGameArt. The SVGs are served locally so the game can load and play offline.

`back-solitaire-master.svg` is a locally drawn vector recreation of the default red-and-gold ornamental back visible in the [gameplay reference video](https://www.youtube.com/watch?v=gLd0HXtDt5I), including its inset frame, corner flourishes, nested diamond, and center emblem. It is used for the Ruby deck choice and for deal/flip transitions when Ruby is selected.

The following 118×177 PNGs are crops of matching cards from the gameplay video [`gLd0HXtDt5I`](https://www.youtube.com/watch?v=gLd0HXtDt5I). Coordinates are source pixels in its 884×1920 frames; PTS uses its 1/15360 time base.

| Card image | PTS (time) | Crop origin (x, y) |
| --- | ---: | ---: |
| `5-of-diamonds-reference.png` | 153600 (10s) | (8, 646) |
| `queen-of-spades-reference.png` | 153600 (10s) | (133, 679) |
| `king-of-diamonds-reference.png` | 153600 (10s) | (383, 719) |
| `jack-of-diamonds-reference.png` | 153600 (10s) | (508, 741) |
| `queen-of-clubs-reference.png` | 460800 (30s) | (633, 744) |
| `queen-of-diamonds-reference.png` | 1152000 (75s) | (133, 734) |
| `queen-of-hearts-reference.png` | 4608000 (300s) | (8, 735) |
| `king-of-clubs-reference.png` | 14407680 (938s) | (622, 428) |
| `king-of-hearts-reference.png` | 2764800 (180s) | (622, 428) |
| `king-of-spades-reference.png` | 1382400 (90s) | (258, 647) |
| `jack-of-clubs-reference.png` | 4147200 (270s) | (383, 823) |
| `jack-of-hearts-reference.png` | 1152000 (75s) | (633, 829) |
| `jack-of-spades-reference.png` | 1612800 (105s) | (622, 428) |

All twelve Jack, Queen, and King cards now use complete source-frame crops. Fifteen number-card faces also have 118×177 crops from the early default-deck section of the gameplay recording:

| Card image | PTS (time) |
| --- | ---: |
| `6-of-hearts-reference.png` | 353280 (23s) |
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

The matching reference PNG is selected at runtime and included in the offline shell cache. Other number-card faces still use the credited CC0 deck artwork.

Nine more number-card faces are crops from the official [App Store listing](https://apps.apple.com/us/app/solitaire-master/id6464113198?platform=ipad), from its 1242×2688 screenshot renditions. Each listed 116×174 source rectangle is resized to the app's 118×177 card art size:

| Card image | Listing screenshot | Crop origin (x, y) |
| --- | ---: | ---: |
| `ace-of-hearts-reference.png` | 4 | (201, 799) |
| `7-of-clubs-reference.png` | 4 | (563, 1084) |
| `3-of-diamonds-reference.png` | 4 | (927, 1223) |
| `4-of-spades-reference.png` | 2 | (201, 1015) |
| `8-of-spades-reference.png` | 2 | (443, 1061) |
| `3-of-hearts-reference.png` | 3 | (563, 1084) |
| `6-of-clubs-reference.png` | 3 | (927, 1130) |
| `2-of-clubs-reference.png` | 3 | (201, 799) |
| `10-of-clubs-reference.png` | 3 | (806, 799) |

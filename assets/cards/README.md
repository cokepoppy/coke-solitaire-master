# Card artwork

The 52 base face-card SVGs and the alternate blue/red card-back SVGs in this directory are from [OpenDecks: Public Domain and CC0 Playing Cards](https://github.com/hhonbo/OpenDecks-Public-Domain-and-CC0-Playing-Cards). That project releases these assets as public domain / CC0; its full license text is preserved in [CC0-1.0.txt](CC0-1.0.txt). Credit is included here as a courtesy.

The source deck credits public-domain court-card art from vector-playing-cards, CC0 suit pips and rank glyphs from Openclipart, and CC0 card-back artwork from OpenGameArt. The SVGs are served locally so the game can load and play offline.

`back-solitaire-master.svg` is a locally drawn vector recreation of the default red-and-gold ornamental back visible in the [gameplay reference video](https://www.youtube.com/watch?v=gLd0HXtDt5I), including its inset frame, corner flourishes, nested diamond, and center emblem. It is used for the Ruby deck choice and for deal/flip transitions when Ruby is selected.

The following 118×177 PNGs are crops of matching cards from the gameplay video [`gLd0HXtDt5I`](https://www.youtube.com/watch?v=gLd0HXtDt5I). Coordinates are source pixels in its 884×1920 frames; PTS uses its 1/15360 time base.

| Card image | PTS (time) | Crop origin (x, y) |
| --- | ---: | ---: |
| `queen-of-spades-reference.png` | 153600 (10s) | (133, 679) |
| `king-of-diamonds-reference.png` | 153600 (10s) | (383, 719) |
| `jack-of-diamonds-reference.png` | 153600 (10s) | (508, 741) |
| `queen-of-clubs-reference.png` | 460800 (30s) | (633, 744) |
| `queen-of-diamonds-reference.png` | 1152000 (75s) | (133, 734) |
| `queen-of-hearts-reference.png` | 4608000 (300s) | (8, 735) |
| `king-of-hearts-reference.png` | 2764800 (180s) | (622, 428) |
| `king-of-spades-reference.png` | 1382400 (90s) | (258, 647) |
| `jack-of-clubs-reference.png` | 4147200 (270s) | (383, 823) |
| `jack-of-hearts-reference.png` | 1152000 (75s) | (633, 829) |
| `jack-of-spades-reference.png` | 1612800 (105s) | (622, 428) |

The gameplay recording does not expose the full King of Clubs card. It remains on the tableau under a Queen of Diamonds throughout the recorded play, and a 5 fps scan did not find a fully revealed source frame. That single card continues to use the CC0 SVG until a complete reference crop is available; the partial video crop is not used.

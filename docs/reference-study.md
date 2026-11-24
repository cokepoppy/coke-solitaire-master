# Reference study

## Sources and observed scope

- The supplied Hungry Studio product-matrix image identifies `Solitaire Master!` as its classic card game. It is an app-list image, not a gameplay reference.
- The official [App Store listing](https://apps.apple.com/us/app/solitaire-master/id6464113198) describes a 28-card, seven-column Klondike deal, four Ace-to-King foundations, descending alternating-color tableau stacks, King-only empty columns, stock recycling, hints, undo, themes, left-hand mode, and statistics.
- The official [Google Play listing](https://play.google.com/store/apps/details?id=solitaire.classic.hungrystudio.free.klondike.card.patience) repeats the Klondike rules and lists daily puzzles, offline play, card/background customization, statistics, and a travel puzzle feature. It exposes six official screenshots, but this environment returned only their links and no viewable image pixels.
- The [Hungry Studio YouTube channel](https://www.youtube.com/@hungrystudio_games) lists a video titled “solitaire classic.” A separate [iOS gameplay recording](https://www.youtube.com/watch?v=gLd0HXtDt5I) is labeled as Solitaire Master by Hungry Studio and includes a rules summary. The video playback surface was unavailable in this run, so this implementation has not been frame-audited against the full recording.

## Frame-by-frame workflow from the synced replica notes

When the source video can be reviewed, keep an evidence ledger with the video URL, capture date, version, duration, frame rate, and source hash. Scan the whole clip at a low rate to mark state changes, then extract short transition windows at the source frame rate. Preserve original presentation timestamps with `ffmpeg -copyts`; do not rely on seek-rebased timestamps. For a 25 fps source, a five-second window should contain 125 frames spaced 40 ms apart. Record actual decoded frame count and PTS, make a contact sheet for each window, and retain full-resolution images only for key transitions. Re-extract selected frames and compare PTS, pixel hashes, and contact-sheet hashes before treating a frame as evidence.

For this game, label the regions separately: top counters, stock/waste, each foundation, all seven tableau columns, action controls, modal surfaces, and background. Record exact event times for deal, flip, draw, move, hint, undo, recycle, and win animations. Compare the same region at matched timestamps and keep source frame IDs beside each observation.

## Rules and state model

The game engine keeps stock, waste, four foundations, seven tableau piles, score, elapsed time, move count, options, and a bounded undo history. A card can move to a tableau pile only in descending rank with alternating color; an empty pile accepts a King. Foundations build upward by suit from Ace to King. Drawing uses the selected one-card or three-card mode, and the waste returns to the stock when that pile is empty. Face-up sequences can move together, and uncovering a hidden tableau card flips it face up. A daily deal is deterministic for the local calendar date, so the same device receives the same shuffle for that day.

## Audio and animation status

The original game's audio could not be isolated from the available text and screenshot references. This build therefore uses original Web Audio cues for taps, draws, flips, moves, invalid drops, and wins, plus an optional soft ambient loop. Audio starts after a user gesture and queues a cue while `AudioContext.resume()` is pending. This preserves mobile autoplay behavior; it does not claim to reproduce the original recording or its exact mix.

The interface currently animates the initial deal, card landing, drag preview, win treatment, and audio cues. A true pixel match for the original background, card face/back artwork, timing curves, and music requires source frames and audio that can be inspected at their original resolution.

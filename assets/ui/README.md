# Source action icons

These four transparent PNG glyphs are extracted from the game-action row in the audited third-party Solitaire Master gameplay recording: [source video](https://www.youtube.com/watch?v=gLd0HXtDt5I), 884×1920 at 60 fps. `action-play-plus.png`, `action-magic.png`, and `action-hint.png` use source PTS 153600 (10s); `action-undo.png` uses PTS 307200 (20s), where Undo is enabled and its white icon is unobscured. The crops retain the original glyph pixels and use an alpha mask to remove the felt around them. CSS supplies the circle outline/fill, labels, and live Magic badge.

The source-frame crops are part of the local ignored review derivatives. Regenerate the committed glyphs with `python3 tools/build_source_action_icons.py` after creating the keyframes described in [`docs/video-frame-audit.md`](../../docs/video-frame-audit.md). The four icons are included in the service-worker shell cache for offline play.

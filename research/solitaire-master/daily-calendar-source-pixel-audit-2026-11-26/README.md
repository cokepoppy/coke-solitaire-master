# Daily calendar screen audit

The reference is screenshot 6 from Hungry Studio's [official Google Play listing for Solitaire Master](https://play.google.com/store/apps/details?id=solitaire.classic.hungrystudio.free.klondike.card.patience). The listing image is a 380×675 promotional phone mockup. Its game viewport is approximately `(69, 130)–(314, 657)`, or 245×527 pixels. The source screenshot SHA-256 is `a9a72d2d2b1e7fc7c81a9dc2e4b8a8c8f503520dbbd1f59e593c703d5c8e53a1`.

The page is compared at 390×844 CSS pixels. The source viewport crop is resized with Lanczos to that size and compared to the browser screenshot captured by the Playwright test `daily calendar matches the official mobile screen and starts the selected deal`. That run produced a mean absolute RGB difference of `13.0209` per channel and `73.09%` exact RGB pixels. `84.61%` of pixels differ by no more than 16 in any channel. These whole-screen values include the black camera cutout in the store mockup, image compression, and low-resolution source text; they are therefore a broad visual check rather than a direct game-frame identity score.

The test screenshot was 390×844 pixels. It was captured after navigating from November 2026 back to May 2026, selecting May 6, and seeding May 5 as completed, to match the reference's selected day and visible crown. It also verifies the full-screen bounds, positions of the calendar, reward tray, and Play button, source image loading, and that tapping Play starts the selected deterministic deal.

All seven extracted image hashes are recorded in [`source-art-srgb-hashes.json`](../../../tests/fixtures/source-art-srgb-hashes.json). Recreate the crops with:

```sh
python3 tools/extract_daily_calendar_assets.py /path/to/official-screenshot-6.jpg
npx playwright test -g 'daily calendar matches the official'
```

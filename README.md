# Solitaire Master Mobile

An installable, mobile-first web adaptation of Hungry Studio's classic Klondike solitaire. It supports tap and drag moves, Draw 1/Draw 3, undo, hints, daily deals, local statistics, a three-tab theme gallery for table backgrounds/card backs/card faces, sound effects, and offline play.

## Run it

```sh
npm install
npm run dev
```

Open `http://localhost:4173` in Chrome. The page is a static PWA and can be served from any HTTPS static host.

## Verify browser interactions

```sh
npm run check
npm run test:e2e
```

The mobile Chrome E2E suite checks the staggered initial deal, stock draw, undo, hinted tap moves, drag moves, settings, daily deal repeatability, saved-game restoration, offline card images, and Web Audio unlock/music controls.

## Reference

- [Solitaire Master! on the App Store](https://apps.apple.com/us/app/solitaire-master/id6464113198)
- [Solitaire Master! on Google Play](https://play.google.com/store/apps/details?id=solitaire.classic.hungrystudio.free.klondike.card.patience)
- [Hungry Studio on YouTube](https://www.youtube.com/@hungrystudio_games)
- [Solitaire Master! gameplay recording](https://www.youtube.com/watch?v=gLd0HXtDt5I)
- [Official Hungry Studio Solitaire Classic short](https://www.youtube.com/watch?v=Yvi1HA3OcxU)
- Card art source and license: [assets/cards/README.md](assets/cards/README.md)
- Frame audit, rule notes, and known fidelity gaps: [docs/reference-study.md](docs/reference-study.md)
- Official video audio evidence and capture workflow: [docs/audio-audit.md](docs/audio-audit.md)

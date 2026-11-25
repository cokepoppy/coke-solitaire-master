# VPS static release

The VPS build is a subpath-scoped static copy. Its public route is `/solitaire/`; source files and the existing root application remain usable at `/`.

Build and validate the distributable from the repository root:

```sh
npm run build:vps
npm run test:release-path
```

The build writes to `/tmp/solitaire-master-vps-release`. It rewrites the root asset URLs for `/solitaire/`, gives the subpath its own service-worker cache, and the release-path test opens the built copy in mobile Chrome, draws a card, changes the background, verifies the worker scope, and confirms a second game's origin cache remains intact.

On the VPS, keep releases under `/var/www/coke-game-solitaire/releases/<timestamp>` and atomically point `/var/www/coke-game-solitaire/current` at the new release. Keep at least one previous release for rollback and maintain the established disk-use ceiling below 79%.

Before editing Nginx, inspect `/etc/nginx/sites-enabled/coke-openrouter` itself with `ls -l` and `readlink -f`, then back up that active file. Add only the `/solitaire` redirect and `/solitaire/` alias to `/var/www/coke-game-solitaire/current/`. Run `sudo nginx -t`; reload Nginx only after it passes. Do not change the other app routes or restart application, K3D, or VPS services.

After release, verify `/app/` is still 200, `/solitaire/` is 200 with `text/html`, and its CSS, JavaScript, image, and audio assets return 200 with their correct MIME types. Then run a mobile Chrome click test against the public route and check that the service worker is scoped to `/solitaire/`.

# Publication

The active production app is published on Vercel from the `app/` folder.

This repository also includes a GitHub Pages workflow for sharing the full app
from GitHub without touching Vercel. The GitHub Pages build serves the same
static app root and overlays the built 3D campus so `Alpaca Online` can open
the campus from the main app.

## Published Target

- Production URL: `https://wsc-2026-study-routes.vercel.app`
- Vercel config: `vercel.json`
- Published folder: `app/`

## GitHub Pages

- Workflow: `.github/workflows/pages.yml`
- Build command: `cd app && npm run build:pages`
- Pages artifact: `app/dist-pages/`
- App entry: `/`
- 3D campus entry: `/alpaca-campus-3d/`
- Published URL: `https://proffrancois-cloud.github.io/WSCapp/`

The workflow sets `VITE_BASE` to `/${{ github.event.repository.name }}/`, builds the Vite 3D campus, copies the Vercel-style app root into the Pages artifact, and overlays the built 3D campus so the main app can launch it from Alpaca Online.

Current GitHub Pages behavior:

- `/` opens the main WSC app.
- `Join online` / `Alpaca Online` opens `./alpaca-campus-3d/?mode=multiplayer`.
- the campus auto-selects multiplayer mode from the query string.
- public 3D assets are resolved with a base path that works under `/WSCapp/`.

Current Vercel behavior:

- Vercel still publishes the static `app/` folder directly.
- The GitHub Pages workflow does not update Vercel.
- Publish the 3D campus to Vercel only after an explicit Vercel build plan is
  approved.

## What Gets Published

- Static app shell: `app/index.html`, `app/styles.css`, `app/app.js`
- Generated runtime: `app/generated/current-runtime/`
- Extracted modules: `app/src/`
- Runtime assets: `app/assets/`, `app/app-icons/`, and `app/content/regular-guides/`
- Supabase browser config: `app/supabase-config.js`

## What Stays Local Or Archived

- `app/node_modules/`: local dependencies, restorable with `npm install`
- `archive/toreview/`: old builds, exports, one-off scripts, generated artifacts, and unused assets
- Desktop build outputs: archived under `archive/toreview/2026-05-17-desktop-builds/`

## Compatibility Target

- Chrome: primary browser target.
- MacBook: use the Vercel URL in Chrome/Safari-compatible browsers.
- Windows 11: use the Vercel URL in Chrome/Edge-compatible browsers.
- Desktop Electron source remains in `app/desktop/`, but the current publication path is web/Vercel.

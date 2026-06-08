# Publication

The active online app is published on Vercel from the `app/` folder.

This repository also includes a GitHub Pages workflow for sharing a public 3D app demo without touching Vercel.

## Published Target

- Production URL: `https://wsc-2026-study-routes.vercel.app`
- Vercel config: `vercel.json`
- Published folder: `app/`

## GitHub Pages Demo

- Workflow: `.github/workflows/pages.yml`
- Build command: `cd app && npm run build:pages`
- Pages artifact: `app/dist-3d/`
- Demo entry: `/alpaca-campus-3d/`
- Expected URL after Pages is enabled: `https://proffrancois-cloud.github.io/WSCapp/`

The workflow sets `VITE_BASE` to `/${{ github.event.repository.name }}/`, prepares the Vite build for project Pages, and copies the legacy runtime bridges that the 3D campus loads from script tags.

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

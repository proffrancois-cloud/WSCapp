# Publication

The active GitHub app is published from the public `proffrancois-cloud/WSCapp` repository.

## Published Target

- GitHub Pages URL: `https://proffrancois-cloud.github.io/WSCapp/`
- GitHub repository: `https://github.com/proffrancois-cloud/WSCapp`
- Repository name: `WSCapp`
- GitHub Pages source: GitHub Actions
- Vercel fallback URL: `https://wsc-2026-study-routes.vercel.app`

## What Gets Published

- Static app shell: `app/index.html`, `app/styles.css`, `app/app.js`
- Generated runtime: `app/generated/current-runtime/`
- Extracted modules: `app/src/`
- Runtime assets: `app/assets/`, `app/app-icons/`, and `app/content/regular-guides/`
- Supabase browser config: `app/supabase-config.js`

The GitHub Pages workflow runs verification, builds the Pages artifact with the `/WSCapp/` base path, audits the public artifact, then deploys it.

## What Stays Local Or Archived

- `app/node_modules/`: local dependencies, restorable with `npm install`
- `archive/toreview/`: old builds, exports, one-off scripts, generated artifacts, and unused assets
- Desktop build outputs: archived under `archive/toreview/2026-05-17-desktop-builds/`

## Compatibility Target

- Chrome: primary browser target.
- MacBook: use the GitHub Pages URL in Chrome/Safari-compatible browsers.
- Windows 11: use the GitHub Pages URL in Chrome/Edge-compatible browsers.
- Desktop Electron source remains in `app/desktop/`, but the current publication path is web/Vercel.

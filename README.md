# WSCapp

This is the active WSCapp workspace for the World Scholar's Cup 2026 theme.

Canonical app URL: `https://wscapp.app/`

Fallback GitHub app URL: `https://proffrancois-cloud.github.io/WSCapp/`

GitHub repository: `https://github.com/proffrancois-cloud/WSCapp`

## Main Folders

- `app/`: current published static app root.
- `content/themes/2026/`: normalized source-of-truth content for the 2026 theme.
- `tools/`: generators and validators that rebuild/check the app runtime.
- `archive/toreview/`: quarantine for old builds, generated artifacts, one-off scripts, and unused assets.

## Current Runtime

Cloudflare Pages is the target canonical host for `wscapp.app`. GitHub Pages can remain as a fallback while the Cloudflare cutover is validated. The browser loads `app/generated/current-runtime/`, extracted modules in `app/src/`, then the remaining orchestrator in `app/app.js`.

Realtime multiplayer is prepared for Cloudflare Durable Objects in `workers/realtime/`. Supabase remains responsible for auth, profiles, progress, and persistent app data.

Use [CURRENT_ARCHITECTURE.md](/Users/francoismo/Documents/Playground/WSC/CURRENT_ARCHITECTURE.md) for the exact current folder map and [ARCHITECTURE_TARGET.md](/Users/francoismo/Documents/Playground/WSC/ARCHITECTURE_TARGET.md) for the long-term target.

## Validation

```zsh
cd /Users/francoismo/Documents/Playground/WSC/app
npm run test:theme
npm run test:smoke
```

## Launch Checklist

Use [docs/launch/cloudflare-supabase-cutover.md](/Users/francoismo/Documents/Playground/WSC/docs/launch/cloudflare-supabase-cutover.md) for Cloudflare Pages, Supabase Auth, realtime Worker, and search-indexing cutover steps.

## Cleanup Rule

Active runtime/source stays in `app/`, `content/`, and `tools/`. Anything not loaded, generated, or intentionally kept for current validation goes to `archive/toreview/` instead of being deleted.

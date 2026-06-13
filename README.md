# WSC 2026 Study Routes

This is the active World Scholar's Cup 2026 app workspace.

## Main Folders

- `app/`: current static app source and artifact build workspace.
- `content/themes/2026/`: normalized source-of-truth content for the 2026 theme.
- `tools/`: generators and validators that rebuild/check the app runtime.
- `archive/toreview/`: quarantine for old builds, generated artifacts, one-off scripts, and unused assets.

## Current Runtime

GitHub Pages publishes `app/dist-pages/` after `npm run build:pages`. Future
Vercel builds are configured to publish `app/dist-vercel/` after
`npm run build:vercel`; pushing this repo does not deploy Vercel by itself.
The browser loads `app/generated/current-runtime/`, extracted modules in
`app/src/`, then the remaining orchestrator in `app/app.js`.

Use [CURRENT_ARCHITECTURE.md](CURRENT_ARCHITECTURE.md) for the exact current
folder map and [ARCHITECTURE_TARGET.md](ARCHITECTURE_TARGET.md) for the
long-term target.

Use [REVIEW_GUIDE.md](REVIEW_GUIDE.md) when sharing the GitHub codebase with a
developer or specialist reviewer.

## Validation

```zsh
cd /Users/francoismo/Documents/Playground/WSC/app
npm run test:theme
npm run test:smoke
npm run test:campus-smoke
VITE_BASE=/WSCapp/ npm run build:pages
npm run audit:pages
npm run verify
```

`test:theme` validates the source theme and compares the active runtime profile.
Use `npm run theme:compare:strict` for the full legacy compatibility audit and
`npm run theme:compare:legacy-audit` to report accepted legacy/current-runtime
deltas without failing the normal check.

## Cleanup Rule

Active runtime/source stays in `app/`, `content/`, and `tools/`. Anything not loaded, generated, or intentionally kept for current validation goes to `archive/toreview/` instead of being deleted.

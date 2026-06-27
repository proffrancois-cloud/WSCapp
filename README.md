# WSCapp

This is the active World Scholar's Cup 2026 app workspace.

Live GitHub app URL: `https://proffrancois-cloud.github.io/WSCapp/`

GitHub repository: `https://github.com/proffrancois-cloud/WSCapp`

## Main Folders

- `app/`: current published static app root.
- `content/themes/2026/`: normalized source-of-truth content for the 2026 theme.
- `tools/`: generators and validators that rebuild/check the app runtime.
- `archive/toreview/`: quarantine for old builds, generated artifacts, one-off scripts, and unused assets.

## Current Runtime

GitHub Pages publishes a built Pages artifact for `WSCapp`. Vercel can still publish `app/` via `vercel.json`. The browser loads `app/generated/current-runtime/`, extracted modules in `app/src/`, then the remaining orchestrator in `app/app.js`.

Use [CURRENT_ARCHITECTURE.md](/Users/francoismo/Documents/Playground/WSC/CURRENT_ARCHITECTURE.md) for the exact current folder map and [ARCHITECTURE_TARGET.md](/Users/francoismo/Documents/Playground/WSC/ARCHITECTURE_TARGET.md) for the long-term target.

## Validation

```zsh
cd /Users/francoismo/Documents/Playground/WSC/app
npm run test:theme
npm run test:smoke
```

## Cleanup Rule

Active runtime/source stays in `app/`, `content/`, and `tools/`. Anything not loaded, generated, or intentionally kept for current validation goes to `archive/toreview/` instead of being deleted.

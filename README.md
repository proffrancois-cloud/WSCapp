# WSC 2026 Study Routes

This is the active World Scholar's Cup 2026 app workspace.

## Main Folders

- `app/`: current static app source and artifact build workspace.
- `content/themes/2026/`: normalized source-of-truth content for the 2026 theme.
- `tools/`: generators and validators that rebuild/check the app runtime.
- `archive/toreview/`: quarantine for old builds, generated artifacts, one-off scripts, and unused assets.

## Current Runtime

Node.js `24.x` is the only supported project runtime. Use the root `.nvmrc` or
`.node-version` before installing dependencies or running build/test commands.
`app/package-lock.json` may include third-party dependency compatibility ranges
that mention Node 20; those ranges are not the WSCapp runtime policy.

GitHub Pages publishes `app/dist-pages/` after `npm run build:pages`. Future
Vercel builds are configured to publish `app/dist-vercel/` after
`npm run build:vercel`; pushing this repo does not deploy Vercel by itself.
The browser loads `app/generated/current-runtime/`, extracted modules in
`app/src/`, then the remaining orchestrator in `app/app.js`.
The generated runtime is committed for static hosting, but it must be
reproducible from `content/themes/2026/`; `npm run theme:check-runtime`
regenerates it into `tmp/current-runtime-ci/` and fails if the committed files
drift. Legacy root runtime files such as `app/data.js` and
`app/raw-content-bank.js` are compatibility material, not the active browser
runtime loaded by `index.html`.

Use [CURRENT_ARCHITECTURE.md](CURRENT_ARCHITECTURE.md) for the exact current
folder map and [ARCHITECTURE_TARGET.md](ARCHITECTURE_TARGET.md) for the
long-term target.

Use [REVIEW_GUIDE.md](REVIEW_GUIDE.md) when sharing the GitHub codebase with a
developer or specialist reviewer.

## Validation

```zsh
cd /Users/francoismo/Documents/Playground/WSC/app
npm run test:node-version
npm run test:theme
npm run test:smoke
npm run test:storage-failure
npm run test:headers
npm run test:html-boundary
npm run test:html-sinks
npm run test:campus-network
npm run test:campus-assets
npm run test:a11y-smoke
npm run test:campus-smoke
VITE_BASE=/WSCapp/ npm run build:pages
npm run audit:pages
npm run verify
npm run verify:vercel
```

`test:theme` validates the source theme, keeps the legacy active-runtime
compatibility comparison, and checks that `app/generated/current-runtime/`
matches a fresh generation from `content/themes/2026/`. Use
`npm run theme:compare:strict` and `npm run theme:compare:legacy-audit` for
legacy compatibility audits only; they are not the source-of-truth gate.

## Cleanup Rule

Active runtime/source stays in `app/`, `content/`, and `tools/`. Anything not loaded, generated, or intentionally kept for current validation goes to `archive/toreview/` instead of being deleted.

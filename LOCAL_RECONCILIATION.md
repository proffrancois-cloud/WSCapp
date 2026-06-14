# Local Reconciliation

This document records the source-of-truth decision for reconciling the public
GitHub repository with the larger local workspace.

## Source Of Truth

- Clean base: `https://github.com/proffrancois-cloud/WSCapp`
- Clean commit: `0ee91776572617f53cd34935312208978b070b72`
- Working branch for reconciliation: `codex/source-of-truth-reconciliation`
- Local comparison folder: `/Users/francoismo/Documents/Playground/WSC`
- Local comparison HEAD: `8ed06ee7c97b91cdfdc18fec05c2c4eec9efde38`

The local folder must be treated as read-only source material until individual
files are explicitly classified and imported. Do not merge it wholesale into
GitHub.

## Comparison Snapshot

The comparison ignored `.git`, dependency installs, generated build outputs,
coverage/test outputs, Vercel metadata, Playwright caches, and local artifacts.

```text
GitHub files:      1295
Local files:       3458
Same files:        1283
Modified files:    9
Local-only files:  2166
GitHub-only files: 3
```

Size snapshot:

```text
Local WSC folder:  9.2G
Local archive/:    2.6G
Local output/:     1.1G
Local outputs/:    3.1M
Local app/:        2.4G
GitHub copy:       3.9G
GitHub app/:       3.1G
```

## Keep From GitHub

GitHub is the clean source for the active app and deployment setup. Keep these
GitHub-only files:

- `.github/workflows/pages.yml`: deploys the full app to GitHub Pages.
- `tools/deployment/prepare-github-pages.mjs`: prepares the Pages artifact by
  copying the Vercel-style app root and overlaying the built 3D campus.
- `app/src/features/alpaca-campus-3d/public-url.ts`: resolves public 3D assets
  under both root deploys and `/WSCapp/` project Pages deploys.

Keep GitHub versions of these modified files because they contain the latest
Pages and Alpaca Online integration:

- `.gitignore`
- `PUBLICATION.md`
- `app/package.json`
- `app/vite.config.ts`
- `app/app.js`
- `app/src/ui/wizard-renderer.js`
- `app/src/features/alpaca-campus-3d/Campus3DApp.tsx`
- `app/src/features/alpaca-campus-3d/asset-manifest.ts`
- `app/src/features/alpaca-campus-3d/environment-assets.ts`

These GitHub versions preserve:

- `npm run build:pages`
- GitHub Pages artifact generation
- `Join online -> ./alpaca-campus-3d/?mode=multiplayer`
- `?mode=multiplayer` auto-launch in the 3D campus
- base-path-safe 3D public asset URLs

## Local Material To Reimport

No active local-only runtime candidates were found after filtering out archives,
outputs, generated builds, and system files.

Future reimports must meet at least one of these criteria:

- referenced by `app/index.html`, `app/alpaca-campus-3d/index.html`, or active
  runtime code;
- referenced by an active generator, validator, deployment script, or package
  script;
- needed to fix a documented missing asset or failing test;
- needed for a new feature with a clear implementation plan.

If a local file only exists under `archive/`, `output/`, or `outputs/`, the
default decision is not to import it.

## Ignore Permanently

Ignore these local-only groups unless a future task explicitly identifies one
file as needed:

- `archive/`: old builds, experiments, one-off scripts, quarantined material.
- `output/` and `outputs/`: generated reports/screenshots/export outputs.
- `.DS_Store` and nested `.DS_Store` files.
- old generated builds and dependency folders.
- old scripts not called by `app/package.json`, `tools/`, GitHub Actions, or
  documented workflows.
- environment-specific metadata and caches.

## Reconciliation Rule

Use GitHub as the base. Treat local as an archive. Import local files only by
explicit file path, with a reason, in small commits.

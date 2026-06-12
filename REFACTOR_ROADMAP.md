# Refactor Roadmap

This roadmap keeps the current app behavior intact while making the codebase
safer for future developers and agents.

## Principles

- GitHub is the clean source of truth.
- The local workspace is an archive candidate, not a merge source.
- Keep changes small and reviewable.
- Do not rewrite the app from scratch.
- Do not migrate the main app to React yet.
- Preserve GitHub Pages and Vercel-style publication behavior.
- Run verification after every pass.

## Pass 1: Source-Of-Truth Stabilization

Status: started by `LOCAL_RECONCILIATION.md`.

Goals:

- keep branch work based on GitHub commit `0ee9177`;
- classify local-only material before importing anything;
- ignore archives, outputs, generated builds, and system files;
- document which GitHub-only files are required for Pages and 3D base paths.

Acceptance:

- no local wholesale merge;
- no runtime behavior changes;
- source-of-truth decision documented.

## Pass 2: Architecture Documentation

Status: started by `ARCHITECTURE_CURRENT.md`.

Goals:

- document the content pipeline;
- document the `index.html -> window.WSC_* -> app.js` boot chain;
- document the extracted `app/src` bridge;
- document the React/TypeScript/Vite 3D campus;
- document Vercel and GitHub Pages deployment differences;
- record known risks and current test status.

Acceptance:

- a developer can understand where to edit content, runtime code, 3D code, and
  deploy code without reading the whole repo first.

## Pass 3: No-Behavior-Change Cleanup

Do this before any refactor.

Tasks:

- keep `.gitignore` aligned with the source-of-truth decision;
- update publication docs when deploy behavior changes;
- remove or quarantine only files proven unused and untracked;
- avoid touching content, UI, runtime behavior, or generated data;
- keep `build:pages`, `public-url.ts`, `VITE_BASE`, and
  `prepare-github-pages.mjs` intact.

Acceptance:

- `npm run typecheck:3d` passes;
- `VITE_BASE=/WSCapp/ npm run build:pages` passes;
- targeted browser smoke still opens Alpaca Online into the 3D campus.

## Pass 4: Extract `app.js` Gradually

Do not start with a large rewrite. Each extraction should move one responsibility
and leave a compatibility wrapper in `app.js`.

Recommended order:

1. app entry gate and local/online launcher;
2. bootstrap/init and event listener registration;
3. app state defaults and selectors;
4. navigation and route-builder actions;
5. auth/session orchestration;
6. progress and stats orchestration;
7. game launch orchestration;
8. live/online orchestration.

Each module should own mechanics, while `app.js` temporarily owns policy and
coordination.

Current progress:

- `src/app/app-entry-service.js` now owns the online alpaca name, the campus 3D
  URL, and the button metadata used by the app-shell entry points.
- `src/app/app-bootstrap-service.js` now owns startup task execution, app-ready
  signaling, and global listener registration mechanics.

Acceptance per extraction:

- small diff;
- no UI changes unless explicitly requested;
- existing browser script load path still works;
- tests/typechecks run;
- rollback is easy.

## Pass 5: Reduce CSS Risk

After functional modules are separated, split `styles.css` by feature or move
to a bundler-supported style structure.

Recommended first cuts:

- app shell and entry gate;
- route builder/wizard;
- learn modes;
- play modes;
- auth/resources modals;
- 3D campus styles are already separate and should stay separate.

Acceptance:

- no class renames unless proven safe;
- visual smoke check on desktop and mobile sizes;
- no layout regressions in entry gate and major modes.

## Pass 6: Build Unification

Unify publication only after the code boundaries are clearer.

Keep these commands:

- `npm run serve`: static app local server.
- `npm run build:3d`: 3D campus build.
- `npm run build:pages`: GitHub Pages full app build.

Future command to add only when Vercel should publish the 3D campus too:

- `npm run build:vercel`: explicit Vercel artifact build.

Acceptance:

- Vercel root deploy and GitHub project Pages use explicit base path policy;
- no hardcoded `/assets/...` paths in code that must run under `/WSCapp/`;
- Pages artifact remains below practical size limits.

## Pass 7: Optional React/TypeScript Migration

Start only after passes 1-6 are stable.

Recommended approach:

- TypeScript first for services and engines.
- React only route-by-route or mode-by-mode.
- Keep content and game engines framework-agnostic.
- Use the existing 3D campus as the pattern for typed state and component
  boundaries, not as permission to rewrite everything.

Acceptance:

- app behavior stays stable across each migrated mode;
- old and new implementations do not coexist indefinitely;
- tests cover migrated state and rendering boundaries.

## Known Verification Notes

- `npm run test:theme` currently fails in `theme:compare` because the legacy
  current runtime and `generated/current-runtime` differ for full-voyage and
  first guide question fields. Treat that as a separate compatibility bugfix
  pass.
- `npm run test:smoke` currently passes in the clean GitHub copy and should stay
  part of the verification loop.

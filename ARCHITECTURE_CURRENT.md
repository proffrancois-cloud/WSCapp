# Current Architecture

This document describes the current GitHub state of WSCapp at commit
`0ee91776572617f53cd34935312208978b070b72`.

## Runtime Shape

WSCapp is currently a static web app with a modern React/TypeScript 3D campus
mounted beside an older vanilla JavaScript main app.

```text
WSCapp/
  app/                         active static web app root
  content/themes/2026/         source-of-truth content pack
  tools/                       generators, validators, deployment helpers
  .github/workflows/pages.yml  GitHub Pages deployment
  vercel.json                  Vercel config, outputDirectory: app
```

Vercel serves `app/` directly. GitHub Pages runs a Vite build for the 3D campus,
then creates `app/dist-pages/` by copying the static app root and overlaying the
built 3D campus.

## Content Flow

The source content lives under `content/themes/2026/`:

- `theme.json`, `manifest.json`, `aliases.json`, and `assets.json` define the
  theme identity and content map.
- `sections/{section-id}/` contains section raw content, guides, media,
  questions, Alpacards, and channel videos.
- `questions/question-bank.json` is the normalized question source of truth.
- `theme-wide/` contains cross-section Alpacards and channel videos.

Generator scripts in `tools/generators/` build browser-ready runtime files in
`app/generated/current-runtime/`:

- `data.js`
- `knowledge-bank.js`
- `assets-config.js`
- `raw-content-bank.js`
- `alpaca-channel.js`
- `content/alpacards.js`

Those generated files assign globals such as `window.WSC_DATA` and
`window.WSC_RAW_CONTENT_BANK`.

## Main App Boot Path

`app/index.html` is the main browser entry point. It loads scripts in a strict
order:

1. generated runtime data;
2. Supabase browser config;
3. compatibility/theme services;
4. app services;
5. learn mode renderers;
6. UI renderers;
7. play engines and renderers;
8. `app/app.js`;
9. `pwa.js`.

The main app does not use a bundler. Most modules are classic browser scripts
that attach APIs to `window.WSC_*`. `app/app.js` then reads those globals.

## `app.js`

`app/app.js` is the main orchestrator and remains the highest-risk file. It owns
or coordinates:

- global app state and DOM ref consumers;
- app entry gate and local/online mode selection;
- central event delegation for click, input, submit, keydown, wheel, and touch;
- wizard navigation and route selection;
- mode and experience orchestration;
- auth and Alpaccount UI flow through the extracted auth controller;
- progress, stats, and local storage integration through the extracted
  progress-storage controller;
- learn/play/train mode bridges;
- live Alpacapardy room orchestration;
- timers and cleanup for games and overlays.

`app.js` is functional, but it is a god file. Future work should extract small
behavioral seams while keeping compatibility wrappers.

## `app/src` Bridge

`app/src/` is a transition layer. It already separates some mechanics from
`app.js`, but these files are still loaded as browser scripts rather than ES
module imports in the main app.

Important groups:

- `src/app/`: app-shell helpers extracted from `app.js`, currently including
  the app entry, online campus launcher, bootstrap/listener registration,
  initial state factories, selectors, DOM ref lookup, safe HTML mounts,
  template parsing, dynamic overlay mount creation, and route-builder selection
  state transitions, Alpaccount auth/session orchestration, and local
  progress-storage orchestration.
- `src/services/`: assets, storage, progress, video helpers, auth, Supabase
  profile calls, raw content filtering, game questions, Scholar's Bowl, and
  Alpacapardy live table calls.
- `src/ui/`: auth modal and wizard renderers.
- `src/modes/learn/`: Alpacards, Alpaca Channel, Mind Map, Regular Guide, and
  Raw Content renderers.
- `src/modes/play/`: Alpaquiz, Alpacapardy, and transport-neutral live session
  logic.
- `src/features/campus-shared/`: browser-script data/realtime bridges shared
  by the 3D campus.

The current pattern is useful for incremental extraction, but the target should
eventually be true module imports and typed interfaces.

## 3D Campus

The 3D campus is a separate React/TypeScript/Vite app rooted at
`app/alpaca-campus-3d/index.html`.

Key pieces:

- `app/vite.config.ts`: builds only the campus entry into `app/dist-3d/`, with
  React, React/Zustand, Three, and general vendor chunks.
- `src/features/alpaca-campus-3d/main.tsx`: mounts React into
  `#alpaca-campus-3d-root`.
- `Campus3DApp.tsx`: mode gate, UI shell, chat, controls, panels, room dock, and
  realtime hook wiring.
- `CampusScene.tsx`: Three.js/React Three Fiber scene, avatar, rooms, objects,
  camera, movement, collision, seats, and interactions.
- `campus-store.ts`: Zustand state for room, player, remote players, chat,
  seats, panels, debug state, camera settings, and pending realtime events.
- `use-campus-realtime.ts`: Supabase Realtime presence/broadcast bridge.
- `public-url.ts`: fixes public asset URLs under `/` and `/WSCapp/`.

The campus can launch in local or multiplayer mode. GitHub's main app opens it
with `./alpaca-campus-3d/?mode=multiplayer`, which auto-selects multiplayer.

## Supabase And Realtime

The browser config is in `app/supabase-config.js` and contains a public
publishable key. Security must come from Supabase RLS and database policies, not
from hiding this config. See `SECURITY_NOTES.md` for the current security
posture and review checklist.

SQL files:

- `app/supabase/alpaccounts.sql`: Alpaccount profiles and progress setup.
- `app/supabase/alpacapardy_live.sql`: future live game rooms, players, events,
  snapshots, RLS, and realtime publication setup.

The 3D campus currently uses Supabase Realtime presence/broadcast channels for
room state, movement, seat events, and chat. That is not yet a persisted MMO
world model.

## Deployment

Vercel:

- `vercel.json` publishes `app/`.
- `.vercelignore` excludes `app/public/`, `app/dist-3d/`, local artifacts, and
  archived material.
- The Vercel app is not automatically updated by GitHub Pages work.

GitHub Pages:

- `.github/workflows/pages.yml` runs `npm ci` and `npm run build:pages`.
- `VITE_BASE=/${repository}/` ensures Vite output works under `/WSCapp/`.
- `prepare-github-pages.mjs` copies the static app, overlays the built 3D
  campus, and prunes unused heavy custom 3D props.

## Current Risks

- `app.js` and `styles.css` are large god files.
- `index.html` relies on strict script order and global variables.
- Main app modules are not true imports, so dependency boundaries are weak.
- Route-builder state transitions are partially centralized in
  `route-builder-controller.js`, but `app.js` still owns rendering, scrolling,
  timers, and launch policy.
- Auth/session mechanics are partially centralized in `auth-controller.js`, but
  `app.js` still owns UI rendering callbacks and live game callers.
- Local progress, raw mastery, and guest-name persistence are centralized in
  `progress-storage-controller.js`, while `app.js` still decides when progress
  is saved.
- The 3D campus intentionally keeps separate avatar local storage in
  `campus-store.ts` until campus state has a broader persistence design.
- HTML string rendering is now partially centralized through
  `app-dom-service.js`, but it still increases XSS risk if user-generated
  content expands.
- Vercel and GitHub Pages currently use different publication paths.
- Asset base paths differ between Vercel root deploys and GitHub project Pages.
- Supabase access must be reviewed at the RLS/policy level.
- `npm run test:theme` currently fails in the runtime compatibility compare
  step because `fullVoyageQuestions`, `firstGuideQuestion`, and
  `firstFullVoyage` differ between the legacy current files and the generated
  runtime files.
- `npm run test:smoke` currently passes in the clean GitHub copy.

## Architecture Decision

Short term: keep the hybrid architecture stable.

- Main app stays vanilla JavaScript plus extracted browser-script modules.
- 3D campus stays React/TypeScript/Vite.
- Do not migrate the full app to React yet.
- Refactor by small no-behavior-change extractions.

Medium term: move the main app toward TypeScript modules and a single Vite
build. React can become the app-wide UI direction later, after module
boundaries, tests, and deployment are stable.

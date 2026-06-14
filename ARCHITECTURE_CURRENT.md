# Current Architecture

This document describes the current GitHub state of WSCapp at commit
`0ee91776572617f53cd34935312208978b070b72`.

## Runtime Shape

WSCapp is currently a static web app with a modern React/TypeScript 3D campus
mounted beside an older vanilla JavaScript main app.

The repo-controlled build/runtime policy is Node.js `24.x`. The root `.nvmrc`,
`.node-version`, root package metadata, app package metadata, GitHub workflows,
and `npm run test:node-version` all enforce or document that policy. Third-party
dependency ranges inside `app/package-lock.json` can mention older Node majors
as compatibility ranges; they are not the app runtime target.

```text
WSCapp/
  app/                         active static web app root
  content/themes/2026/         source-of-truth content pack
  tools/                       generators, validators, deployment helpers
  .github/workflows/pages.yml  GitHub Pages deployment
  vercel.json                  Vercel config, outputDirectory: app/dist-vercel
```

GitHub Pages runs a Vite build for the 3D campus, then creates
`app/dist-pages/` from an explicit runtime allowlist and overlays the built 3D
campus. Future Vercel builds use the same artifact path pattern through
`app/dist-vercel/`; this repo change does not deploy Vercel by itself.

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
- `content/raw-content-overrides.js`
- `alpaca-channel.js`
- `content/alpacards.js`

Those generated files assign globals such as `window.WSC_DATA` and
`window.WSC_RAW_CONTENT_BANK`. Editorial raw-content corrections live in
`content/themes/2026/compat/raw-content-overrides.json`; the generator hydrates
them into `window.WSC_RAW_CONTENT_OVERRIDES` so `app.js` no longer carries large
editorial override tables.

`app/generated/current-runtime/` is committed because GitHub Pages serves a
static artifact, but it is not edited by hand. `npm run theme:check-runtime`
regenerates the runtime into `tmp/current-runtime-ci/`, compares it with the
committed runtime, and validates that `summary.json` matches the real runtime
payload. The older root files such as `app/data.js`, `app/knowledge-bank.js`,
and `app/raw-content-bank.js` are legacy compatibility material; the active
browser path loads `app/generated/current-runtime/`.

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

`app/app.js` is the main orchestrator and remains the highest-risk file. After
the legacy live-room renderer/controller, content-normalization helper, app
event-router, raw-content controller, study-game controller, arcade-game
controller, Alpacards controller/renderer bridge, Alpaca Channel/video
controller, and Debate Lab/Build Case controller extractions, plus the
route-builder view controller and app-shell renderer extractions, it is about
10.1k lines, down from the roughly
19.2k-line state described in the
architecture analysis DOCX, but it is still above the high-risk threshold for a
single browser script. It owns or coordinates:

- global app state and DOM ref consumers;
- app entry gate and local/online mode selection;
- central event listener binding, with click/input/submit/keydown/wheel/touch
  dispatch now routed through `app-event-router.js`;
- wizard navigation and route selection;
- mode and experience orchestration;
- raw-content normalization startup wiring;
- auth and Alpaccount UI flow through the extracted auth controller;
- progress, stats, and local storage integration through the extracted
  progress-storage controller;
- learn/play/train mode bridges;
- live Alpacapardy room wrappers and game-specific compatibility calls;
- timers and cleanup for games and overlays.

`app.js` is functional, but it is still a god file. Future work should extract
small behavioral seams while keeping compatibility wrappers. The next risk
target is to move it below 10k lines with passing smoke/build/typecheck gates;
true low risk requires explicit imports, typed contracts, focused unit tests,
browser journey coverage, and much less dependence on `window.WSC_*` script
order.

## Stylesheets

The main app still loads `app/styles.css` from `app/index.html`, but that file
is now an ordered import index rather than a 19k-line stylesheet. The imported
chunks live beside it in `app/` so existing `url("./assets/...")` references
still resolve in the static app, GitHub Pages, Vercel, and the desktop package:

- `styles-app-shell.css`: app shell, entry gate, auth, shared base, and early
  responsive shell styles.
- `styles-route-builder.css`: initial route-builder, wizard, panel, and
  choice-card styles.
- `styles-experience-shared.css`: shared experience panels and early learn-mode
  selector groups.
- `styles-play-live-modes.css`: play, live-room, online hub, relay, race, jump,
  and run selector groups.
- `styles-raw-content.css`: Raw Content and regular guide reader styles.
- `styles-late-shell-overrides.css`: late shell/header/raw visual/online/live
  waiting overrides kept in cascade order.
- `styles-route-builder-overrides.css`: late route-builder, header compaction,
  section dock, and staged path-card overrides.
- `styles-learn-mode-overrides.css`: Mind Map orbit gallery, app font, and
  Raw/Guide question gallery overrides.
- `styles-online-overrides.css`: final online setup and lobby cleanup overrides.

This is a risk-reduction split, not a final design-system extraction. Several
late override chunks still contain mixed responsibilities because preserving
the current cascade is safer than semantically reordering old selector passes.

## `app/src` Bridge

`app/src/` is a transition layer. It already separates some mechanics from
`app.js`, but these files are still loaded as browser scripts rather than ES
module imports in the main app.

Important groups:

- `src/app/`: app-shell helpers extracted from `app.js`, currently including
  the app entry, online campus launcher, bootstrap/listener registration,
  initial state factories, selectors, DOM ref lookup, trusted HTML mount
  boundaries, text escaping helpers, template parsing, dynamic overlay mount
  creation, app-shell rendering for stats/session controls/entry/auth/resources
  and cooperation modals, Alpacards selection/rendering/carousel bridge
  mechanics, Alpaca Channel playlist/video helper mechanics, Debate Lab topic,
  spinner, suggestion, scoring, and render mechanics, route-builder selection
  state transitions, wizard view
  orchestration, mode-choice card animation, Alpaccount
  auth/session orchestration, and local progress-storage orchestration,
  selected-mode launch/close mechanics, experience-panel render dispatch, and
  the public online-mode boundary, plus legacy/live room rendering through
  `legacy-live-room-renderer.js`, DOM event dispatch through
  `app-event-router.js`, Raw Content/media-lightbox orchestration through
  `raw-content-controller.js`, local Writing/Bowl/Alpaquiz action mechanics
  through `study-game-controller.js`, and local Race/Run/Relay/Jump action
  mechanics through `arcade-game-controller.js`, plus legacy/live room access,
  lobby/session sync, event reducers, chat, and start/join/leave actions
  through `legacy-live-room-controller.js`, and raw-content import
  normalization, title cleanup, support-field cleanup, subject/big-idea alias
  mapping, and French-text fallback generation through
  `content-normalization-helpers.js`.
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
That public path is named `3D Campus Preview` in
`ONLINE_MODE_BOUNDARIES.md` and `online-mode-controller.js` because it is not
yet a persisted MMO experience.

The older main-app Alpaca Online/live room screens are separate legacy/future
live game room mechanics. Their rendering now lives in
`legacy-live-room-renderer.js`, and their access, lobby/session sync, live
event reducers, chat, and start/join/leave actions now live in
`legacy-live-room-controller.js`. `app.js` keeps compatibility wrappers and
some Jeopardy-specific local game calls. These screens are not the public
`Explore preview` destination, and `LEGACY_LIVE_ROOMS_PUBLIC_ENABLED` keeps
them disabled in public builds.

## Supabase And Realtime

The browser config is in `app/supabase-config.js` and contains a public
publishable key. Security must come from Supabase RLS and database policies, not
from hiding this config. See `SECURITY_NOTES.md` for the current security
posture and review checklist.

SQL files:

- `app/supabase/alpaccounts.sql`: Alpaccount profiles and progress setup.
- `app/supabase/alpacapardy_live.sql`: future live game rooms, players, events,
  snapshots, RLS, and realtime publication setup.

Alpaccount sign-in and password reset are email-only. The client no longer
performs alpaca-name-to-email lookup, and `alpaccounts.sql` drops the old
`resolve_alpaca_login(text)` RPC.

The 3D campus currently uses Supabase Realtime presence/broadcast channels for
room state, movement, seat events, and chat. That is not yet a persisted MMO
world model.

## Deployment

Vercel:

- `vercel.json` runs `cd app && npm ci && npm run build:vercel`.
- `vercel.json` publishes `app/dist-vercel/`.
- `.vercelignore` excludes local artifacts and generated output directories
  from source uploads.
- The Vercel app is not automatically updated by GitHub Pages work.

GitHub Pages:

- `.github/workflows/pages.yml` runs `npm ci` and `npm run build:pages`.
- The Pages build job has read-only repository permissions; only the deploy job
  gets `pages: write` and `id-token: write`.
- `VITE_BASE=/${repository}/` ensures Vite output works under `/WSCapp/`.
- `prepare-github-pages.mjs` copies only allowlisted runtime files, overlays
  the built 3D campus, and prunes unused heavy custom 3D props.
- `audit-public-artifact.mjs` checks artifacts for forbidden source/config/SQL
  files before they are treated as publishable.

Pull requests and `codex/**` branches run `.github/workflows/verify.yml`, which
installs dependencies, installs Playwright Chromium for future browser tests,
and runs `npm run verify`. `tools/servers/serve-public-artifact.mjs` serves
`app/dist-pages/` under `/WSCapp/` for Playwright a11y/mobile and campus smoke
tests without deploying anything.

## Current Risks

- `app.js` is still a large god file.
- CSS is split into ordered chunks, but late override files still carry mixed
  responsibilities and need a later semantic cleanup pass.
- `index.html` relies on strict script order and global variables.
- Main app modules are not true imports, so dependency boundaries are weak.
- Route-builder state transitions are centralized in
  `route-builder-controller.js`, while wizard view orchestration and the
  mode-choice card animation are centralized in
  `route-builder-view-controller.js`. `app.js` still keeps compatibility
  wrappers, route scrolling, timers, and launch policy.
- App-shell rendering for the stats strip, session controls, app-entry gate,
  auth modal context, resources modal, cooperation modal, insight cards, and
  summary chips is centralized in `app-shell-renderer.js`; `app.js` still
  decides when the shell surfaces render and keeps entry/auth state actions.
- Alpacards selection, experience construction, renderer bridging, carousel DOM
  synchronization, flip/navigation, and shuffle mechanics are centralized in
  `alpacards-controller.js`; `app.js` keeps compatibility wrappers for the
  event router and mode factory registry.
- Alpaca Channel experience construction, rendering bridge/fallbacks, playlist
  construction, standalone-video matching, YouTube embed/preview helpers, and
  video URL normalization are centralized in `alpaca-channel-controller.js`;
  `app.js` keeps compatibility wrappers for Raw Content, Regular Guide,
  legacy live waiting videos, and mode runtime dispatch.
- Debate Lab / Build Case experience construction, topic selection, spinner
  timers, side assignment, suggestion rounds, NPG reveal timers, scoring, and
  rendering are centralized in `build-case-controller.js`; `app.js` keeps
  compatibility wrappers for the event router and mode runtime dispatch.
- Auth/session mechanics are partially centralized in `auth-controller.js`, but
  `app.js` still owns auth state actions and live game callers.
- Local progress, raw mastery, and guest-name persistence are centralized in
  `progress-storage-controller.js`, while `app.js` still decides when progress
  is saved.
- Selected-mode launch, unavailable-mode launch, route-attempt reset, and
  ordinary close cleanup are centralized in `game-launch-controller.js`, while
  `app.js` still owns the mode factory registry, render calls, scrolling, and
  game-specific start/reset flows.
- Experience-panel render dispatch and shared render lifecycle sync are now
  centralized in `mode-runtime-controller.js`, while `app.js` still owns the
  renderer implementations and the mode registry passed into that controller.
- The public online path is now named separately in `online-mode-controller.js`;
  legacy live game room rendering is now isolated in
  `legacy-live-room-renderer.js`, and legacy room access, session/lobby sync,
  live event reducers, chat, start/join/leave actions, and arcade-live actions
  are centralized in `legacy-live-room-controller.js`. Legacy live rooms stay
  disabled publicly until RPC/RLS, persistence, and moderation are reviewed in
  the active Supabase project.
- DOM event dispatch is now centralized in `app-event-router.js`; `app.js`
  still supplies the action callbacks and keeps compatibility wrappers for the
  listener registration path.
- Raw Content route filtering, entry rendering glue, mastery toggles, quiz
  pager state, visual asset selection, and media-lightbox state are now
  centralized in `raw-content-controller.js`; `app.js` still keeps compatibility
  wrappers and still passes shared helpers/renderers through classic browser
  globals.
- Local study-game actions for Collaborative Writing, Scholar's Bowl, and
  Scholar's Challenge are now centralized in `study-game-controller.js`;
  `app.js` still owns their builders/renderers and provides compatibility
  wrappers to the event router.
- Local arcade/route-game actions for Race, Alpaca Run, Relay, and Jump are now
  centralized in `arcade-game-controller.js`; `app.js` still owns their
  builders, renderers, timers, DOM patch helpers, and compatibility wrappers.
- Browser storage writes go through safe helpers. Main-app progress uses
  `storage-service.js` and `progress-storage-controller.js`; the 3D campus
  avatar uses `browser-storage.ts`.
- 3D campus realtime now applies network guardrails through
  `campus-network-guardrails.ts` and `room-channel.js`: movement frames omit
  avatar/display-name blobs, small deltas are throttled, idle heartbeat is
  explicit, payload byte limits are checked, and rendered remote players are
  capped.
- HTML string rendering is now routed through `app-dom-service.js`. Direct
  `innerHTML`/`outerHTML`/`insertAdjacentHTML`/React `dangerouslySetInnerHTML`
  use outside that service is blocked by `npm run test:html-sinks`.
  Generated guide/content HTML is treated as trusted build-time content; future
  user-generated text must be escaped or rendered with `textContent`, not sent
  to `trustedHtml`.
- Modal focus is now centralized in `src/app/modal-focus-service.js`, but modal
  open/close policy still lives in `app.js`.
- Vercel and GitHub Pages currently use different publication paths. Vercel has
  a non-deploying artifact path plus baseline security headers in `vercel.json`.
- Asset base paths differ between Vercel root deploys and GitHub project Pages.
- Supabase access must still be reviewed at the RLS/policy level before any
  claim of durable MMO readiness.
- `npm run test:theme` validates the source theme, keeps the active-runtime
  compatibility comparison, and now fails if `app/generated/current-runtime/`
  cannot be reproduced from `content/themes/2026/`. `npm run
  theme:compare:strict` remains available for the full legacy compatibility
  audit, but it is not the source-of-truth gate.
- `npm run test:smoke` currently passes in the clean GitHub copy.

## Risk Targets

The current target is not "perfect architecture"; it is lower severity and
lower likelihood for the failures a specialist team would reasonably expect
from a large script-driven app.

| Area | Current risk | Near-term target | Work required |
| --- | --- | --- | --- |
| `app/app.js` above 10k lines | High | Medium below 10k lines | Continue responsibility-based extraction with wrappers and tests. |
| `app/app.js` below 5k lines | Low-Medium | True Low | Move to explicit imports, typed contracts, focused unit tests, and browser journeys. |
| Script-order globals | Medium-High | Medium | Add a dependency map, then migrate stable modules toward ES modules. |
| HTML string rendering | Medium | Medium-Low | Keep all sinks behind `app-dom-service`; escape or text-render user values. |
| CSS late overrides | Medium | Medium-Low | Add screenshot coverage before semantic selector cleanup. |
| Supabase live/MMO claims | High if reopened | Low only after review | Validate active-project RLS/RPC policies, moderation, and durable state design. |

## Architecture Decision

Short term: keep the hybrid architecture stable.

- Main app stays vanilla JavaScript plus extracted browser-script modules.
- 3D campus stays React/TypeScript/Vite.
- Do not migrate the full app to React yet.
- Refactor by small no-behavior-change extractions.

Medium term: move the main app toward TypeScript modules and a single Vite
build. React can become the app-wide UI direction later, after module
boundaries, tests, and deployment are stable.

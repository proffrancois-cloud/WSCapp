# WSCapp Specialist Review Guide

This guide is for a developer, software architect, frontend/UI reviewer,
security/IT reviewer, QA reviewer, 3D/game specialist, or product/content
reviewer who needs to inspect WSCapp without first reading the whole codebase.

## What This App Is

WSCapp is a static study/game app for the World Scholar's Cup 2026 theme. It has
two runtime layers:

- the main study app in `app/`, currently a vanilla JavaScript browser app with
  gradually extracted helper modules under `app/src/`;
- the 3D campus in `app/alpaca-campus-3d/`, a separate React/TypeScript/Vite app
  launched by `3D Campus Preview / Explore preview`.

The app is intentionally in an incremental cleanup phase. The current goal is a
reviewable, stable architecture without a full rewrite or global React
migration.

## Start Here

Read these files in this order:

1. `README.md`: repo purpose and validation commands.
2. `ARCHITECTURE_CURRENT.md`: current runtime architecture and known risks.
3. `LOCAL_RECONCILIATION.md`: why GitHub is the source of truth and local-only
   files are treated as archive candidates.
4. `REFACTOR_ROADMAP.md`: cleanup passes and what is intentionally deferred.
5. `SECURITY_NOTES.md`: Supabase/public-key/RLS posture.
6. `ONLINE_MODE_BOUNDARIES.md`: distinction between 3D campus preview and
   legacy live game-room mechanics.

## Run Locally

From the app folder:

```zsh
nvm use
cd app
npm ci
npm run test:node-version
npm run serve
```

Then open `http://127.0.0.1:4173/`.

Node.js `24.x` is the only supported repo runtime. If `test:node-version` fails,
switch Node before installing dependencies or running validation. Lockfile
entries from dependencies may mention Node 20 compatibility, but WSCapp itself
does not support Node 20 as its build/runtime environment.

The local static server serves the vanilla app directly. The 3D campus source is
also present, but the production Pages artifact is the best way to test the
GitHub `/WSCapp/` base path.

## Build And Validate

From `app/`:

```zsh
npm run test:node-version
npm run typecheck:3d
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
```

Optional content checks:

```zsh
npm run test:theme
npm run theme:compare:strict
npm run theme:compare:legacy-audit
```

`test:theme` uses the active-runtime compatibility profile. The strict command
is intentionally stricter and may report known legacy/current-runtime deltas.

## Deployment Split

Vercel and GitHub Pages are deliberately separate right now.

- Future Vercel builds publish `app/dist-vercel/` through `vercel.json` after
  running `npm run build:vercel`.
- GitHub Pages runs `.github/workflows/pages.yml`, executes
  `npm run build:pages`, and publishes `app/dist-pages/`.
- `build:pages` and `build:vercel` build the 3D campus with Vite, copy only
  allowlisted runtime files, and overlay the built campus.
- `npm run audit:pages` and `npm run audit:vercel` verify that public artifacts
  do not include package metadata, SQL, source-only TS/TSX, docs, desktop code,
  local artifacts, or test/build debris.
- `.github/workflows/verify.yml` runs the PR/branch verification gate and
  installs Playwright Chromium so browser smoke tests can be added without
  changing CI setup again.
- `npm run test:campus-smoke` serves the built Pages artifact under `/WSCapp/`
  and checks the 3D campus route, canvas screenshot pixels, and local JS/CSS/
  GLB/texture responses with Playwright.
- `npm run test:a11y-smoke` serves the same Pages artifact and checks modal
  focus trapping, Escape close behavior, and 390px horizontal overflow on the
  entry gate and route builder.
- `npm run test:storage-failure` verifies blocked browser storage is reported
  as non-fatal instead of throwing.
- `npm run test:headers` validates the future Vercel artifact path and baseline
  security headers in `vercel.json`.
- `npm run test:html-boundary` validates the trusted HTML wrapper and escaping
  helper in `app-dom-service.js`.
- `npm run test:html-sinks` blocks direct HTML sinks outside
  `app-dom-service.js`.
- `npm run test:campus-network` validates movement payload size, idle heartbeat
  decisions, remote-player caps, and room-channel oversized-payload rejection.
- `npm run test:campus-assets` verifies 3D runtime asset references against the
  bundled `app/assets` tree and Vite-copied `app/public` assets.
- Do not assume pushing a branch updates Vercel.

The public online path is:

```text
Explore preview -> ./alpaca-campus-3d/?mode=multiplayer
```

On GitHub Pages this resolves as:

```text
/WSCapp/alpaca-campus-3d/?mode=multiplayer
```

## Current Architecture Map

```text
WSCapp/
  app/
    index.html                  script-order entry point
    app.js                      main orchestrator, still large
    styles.css                  ordered stylesheet import index
    styles-*.css                split main-app CSS chunks
    generated/current-runtime/  browser globals generated from content
    src/app/                    app-shell controllers and services
    src/services/               storage, auth, progress, assets, data helpers
    src/ui/                     extracted HTML renderers
    src/modes/                  learn/play mode engines and renderers
    alpaca-campus-3d/           React/TypeScript/Vite 3D campus entry
    supabase/                   SQL setup for Alpaccounts and live rooms
  content/themes/2026/          source-of-truth content pack
  tools/                        generators, validators, deploy helpers
```

## Main App Design

`app/index.html` loads classic browser scripts in a strict order. Those scripts
attach APIs to `window.WSC_*`. `app/app.js` reads those globals and coordinates
state, navigation, render calls, auth, progress, game launches, and online/live
flows.

Recent extractions reduce `app.js` without changing behavior:

- `app-entry-service.js`: app entry labels and campus launcher metadata.
- `app-bootstrap-service.js`: startup task execution and global listeners.
- `app-state-service.js`: default state factories and selectors.
- `app-dom-service.js`: DOM refs, trusted HTML boundaries, escaping, text
  extraction, and safe mount helpers.
- `modal-focus-service.js`: active dialog focus trapping, inert background
  siblings, and focus restoration for HTML-rendered modals.
- `route-builder-controller.js`: route-builder state transitions.
- `route-builder-view-controller.js`: wizard render orchestration,
  route-builder render context/helper wiring, and mode-choice card animation.
- `auth-controller.js`: Alpaccount/session form orchestration.
- `progress-storage-controller.js`: local stats, mastery, and guest-name
  persistence.
- `game-launch-controller.js`: launch/close/reset mechanics.
- `mode-runtime-controller.js`: experience-panel render dispatch and shared
  post-render lifecycle sync.
- `online-mode-controller.js`: public 3D campus path separated from legacy live
  rooms.
- `legacy-live-room-renderer.js`: legacy/live room rendering, waiting overlays,
  room cards, and live arcade display templates.
- `legacy-live-room-controller.js`: legacy/live room access, lobby/session sync,
  heartbeat/subscription cleanup, live event reducers, chat, start/join/leave
  actions, and arcade-live actions.
- `content-normalization-helpers.js`: raw-content section/entry normalization,
  support-field cleanup, subject and big-idea alias mapping, wrong-answer
  cleanup, and French-text fallback generation.
- `app-event-router.js`: document-level click/input/submit/keydown/wheel/touch
  dispatch mapped to explicit action callbacks.
- `raw-content-controller.js`: Raw Content payloads, entry-card orchestration,
  mastery toggles, quiz pager state, visual asset selection, and media-lightbox
  state.
- `study-game-controller.js`: local Collaborative Writing, Scholar's Bowl, and
  Scholar's Challenge action mechanics.
- `arcade-game-controller.js`: local Race, Alpaca Run, Relay, and Jump action
  mechanics.

`app.js` still owns too much policy and rendering coordination. The current
cleanup pattern is: extract mechanics into `app/src`, keep compatibility
wrappers in `app.js`, verify behavior, then repeat.

## 3D Campus Design

The 3D campus is intentionally separate from the vanilla main app.

- Framework: React + TypeScript + Vite.
- Rendering: React Three Fiber / Three.js.
- State: Zustand store in the campus feature area.
- Realtime: Supabase Realtime presence/broadcast hooks.
- Public URL policy: `public-url.ts` handles root and `/WSCapp/` paths.

The campus is not yet a fully persisted MMO world. It can use realtime presence,
movement, seat events, and chat, but long-lived world state and moderation need
separate backend design.

## CSS Design

The main app no longer has one 19k-line stylesheet file. `app/styles.css` is now
an import index that preserves the old cascade order:

- `styles-app-shell.css`
- `styles-route-builder.css`
- `styles-experience-shared.css`
- `styles-play-live-modes.css`
- `styles-raw-content.css`
- `styles-late-shell-overrides.css`
- `styles-route-builder-overrides.css`
- `styles-learn-mode-overrides.css`
- `styles-online-overrides.css`

This is a first risk-reduction pass, not a complete design-system cleanup. The
late override files still contain mixed responsibilities because the safer
choice was to preserve visual behavior before reorganizing selectors
semantically.

## Security And IT Posture

The browser Supabase config in `app/supabase-config.js` is public by design.
The publishable key is not treated as a secret. Real protection must come from:

- Supabase Row Level Security policies;
- table/RPC permissions;
- auth/session validation;
- avoiding service-role keys in browser code;
- reviewing any user-generated text before rendering it as HTML.

Alpaccount login and password reset are email-only. The client does not resolve
alpaca names to email addresses, and `app/supabase/alpaccounts.sql` drops the
old `resolve_alpaca_login(text)` RPC. Signup duplicate-name failures are shown
with generic wording instead of public account-existence language.

Current higher-risk areas:

- HTML strings remain common in renderers and `app.js`, but direct sinks are
  guarded so new HTML rendering must pass through `app-dom-service.js`;
- legacy live rooms are disabled publicly and need policy review before public
  MMO use;
- campus realtime flows still need policy review before expanded MMO use;
- browser storage writes now go through safe helpers, including campus avatar
  persistence, but storage UX is still intentionally minimal;
- Vercel and GitHub Pages have different base-path behavior.

## Known Technical Debt

- `app/app.js` is still the main god file and should continue shrinking.
- As of the route-builder view controller extraction, `app/app.js` is about 13.6k
  lines. That is smaller than the pre-refactor file, but still above the
  target for the Medium-risk threshold.
- `index.html` depends on strict script order and browser globals.
- Main app modules are not true ES imports yet.
- Route rendering and route policy remain partly mixed.
- CSS is split, but late override chunks still need semantic cleanup.
- Browser smoke found pre-existing mobile horizontal overflow from offscreen
  route-builder/header elements rendered behind the entry state; this was not
  introduced by the CSS split.
- Supabase live-room SQL and realtime use need a full policy review before
  legacy live rooms are reopened.
- Tests are useful smoke gates, but they are not yet enough for deep UI, auth,
  realtime, or game-rule coverage.

## Risk Reduction Targets

The architecture analysis DOCX frames `app/app.js` as the highest severity and
likelihood risk. Use these thresholds when reviewing future cleanup PRs:

| State | Review risk | What a reviewer should expect |
| --- | --- | --- |
| `app.js` above 10k lines | High | Hidden coupling, fragile event flow, and difficult regression review. |
| `app.js` below 10k lines with passing gates | Medium | Reviewable responsibilities, but globals and untyped contracts remain. |
| `app.js` below 5k lines with modules/types/tests | Low-Medium | Mostly orchestration/bootstrap; remaining risks are explicit. |
| True Low | Low | Explicit imports, typed contracts, focused unit tests, browser journeys, and reduced script-order dependence. |

Most important roadmap recommendations from the DOCX:

- Do not do a full React rewrite now.
- Move toward TypeScript and ES modules after behavioral boundaries are clearer.
- Keep approved HTML sinks behind `app-dom-service`.
- Add screenshot coverage before deeper CSS cleanup.
- Review Supabase RLS/RPC policies in the active project before any MMO or
  legacy live-room claim.

## Specialist Checklists

### Software Engineering

- Confirm each `app/src/app/*controller*.js` owns mechanics, not broad product
  policy.
- Continue extracting `app.js` by responsibility, not by arbitrary line ranges.
- Prefer pure helpers and compatibility wrappers until the runtime can move to
  true modules.
- Watch for duplicated render/update/storage/auth patterns before adding new
  features.

### Software Architecture

- Decide the long-term module boundary for the vanilla app: classic scripts,
  ES modules, or a bundler migration.
- Keep content, engines, storage, auth, and UI renderers separable.
- Do not migrate everything to React until state boundaries are cleaner.
- Treat the 3D campus as a separate sub-app unless there is a deliberate shell
  unification plan.

### Frontend And UI

- Build screenshot coverage before changing the late CSS override files.
- Fix mobile overflow and hidden/offscreen route-stage layout debt as a focused
  UI pass.
- Introduce tokens/components gradually; avoid class-name churn.
- Keep the current visual identity unless a product/design decision says
  otherwise.

### Security And IT

- Review `SECURITY_NOTES.md` and the SQL files under `app/supabase/`.
- Confirm RLS policies match the intended public behavior.
- Verify no service-role key, private token, or deployment secret is committed.
- Review all future chat/profile/user-generated rendering for escaping and
  moderation.

### QA

- Keep `npm run test:smoke` as the baseline app boot/mode check.
- Add browser tests for entry gate, local route builder, Raw Content,
  Alpacards, Alpacapardy, and 3D campus launch.
- Add targeted auth tests once auth flows are isolated enough.
- Add visual regression snapshots before major CSS cleanup.

### 3D And Game

- Keep the campus build passing with `npm run typecheck:3d`.
- Add a canvas nonblank and asset-200 check for `/WSCapp/alpaca-campus-3d/`.
- Separate transient realtime presence from persisted world state.
- Keep game rules in engines/services instead of UI components.

### Product And Content

- Treat `content/themes/2026/` as the source of truth.
- Use generators in `tools/generators/` rather than editing generated runtime
  files by hand.
- Keep `test:theme` passing for the active runtime profile.
- Document accepted legacy/current-runtime differences when strict comparison
  reports them.

## Suggested Next Refactor Passes

1. Continue shrinking `app.js` by extracting remaining game render/build
   orchestration.
2. Add screenshot-based UI coverage before semantic CSS cleanup.
3. Extract remaining Jeopardy local tile/focus/start mechanics.
4. Review Supabase RLS and realtime policy before expanding real multiplayer.
5. Move the main app toward true module imports once enough boundaries are
   stable.

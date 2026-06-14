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
- targeted browser smoke still opens 3D Campus Preview into the 3D campus.

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
- `src/app/app-shell-renderer.js` now owns app-shell rendering for insight
  cards, stats, session controls, the app-entry gate, app-entry auth panel,
  auth modal context/render wrappers, summary chips, resources, and cooperation
  modals while `app.js` keeps state transitions, render timing, and action
  policy.
- `src/app/alpacards-controller.js` now owns Alpacards selection, experience
  construction, renderer bridging, carousel DOM synchronization, flip,
  navigation, and shuffle mechanics while `app.js` keeps compatibility wrappers
  for the event router and mode factory registry.
- `src/app/alpaca-channel-controller.js` now owns Alpaca Channel experience
  construction, render bridge/fallbacks, playlist building, standalone-video
  matching, YouTube embed/preview helpers, domain generation, and video URL
  normalization while `app.js` keeps compatibility wrappers for Raw Content,
  Regular Guide, legacy live waiting videos, and mode runtime dispatch.
- `src/app/build-case-controller.js` now owns Debate Lab / Build Case
  experience construction, topic selection, spinner timers, side assignment,
  suggestion rounds, NPG reveal timers, scoring, and rendering while `app.js`
  keeps compatibility wrappers for the event router and mode runtime dispatch.
- `src/app/app-bootstrap-service.js` now owns startup task execution, app-ready
  signaling, and global listener registration mechanics.
- `src/app/app-state-service.js` now owns initial state factories and small
  selectors while `app.js` still owns the live mutable state object.
- `src/app/app-dom-service.js` now owns app DOM ref lookup, safe HTML mount
  helpers, template parsing, and dynamic body mount creation while `app.js`
  still owns what each renderer displays.
- `src/app/route-builder-controller.js` now owns route-builder selection
  mutations for paths, lenses, target sections, modes, clear/change actions,
  and route deep-links while `app.js` keeps timers, render calls, scrolling,
  unavailable-mode handling, and experience launch policy.
- `src/app/route-builder-view-controller.js` now owns wizard render
  orchestration, route-builder render context/helper wiring, and the
  mode-choice card spread/open/close animation while `app.js` keeps
  compatibility wrappers plus route scrolling and launch policy.
- `src/app/auth-controller.js` now owns Alpaccount client/session setup,
  profile/progress loading, signup/login/forgot/reset form actions, sign-out,
  and anonymous live-session auth while `app.js` keeps compatibility wrappers
  and UI rendering callbacks.
- `SECURITY_NOTES.md` now documents the public Supabase config posture, RLS
  responsibility, secret-handling rules, and review checklist.
- `src/app/progress-storage-controller.js` now owns local stats, raw mastery,
  and guest-name persistence plus progress normalization wrappers while
  `app.js` keeps the policy decision of when local progress should be saved.
- `src/app/game-launch-controller.js` now owns selected-mode launch,
  unavailable-mode launch, route-attempt reset, and ordinary close cleanup
  mechanics while `app.js` keeps the mode factory registry, rendering,
  scrolling, and game-specific start/reset flows.
- `src/app/mode-runtime-controller.js` now owns experience-panel render
  dispatch, empty-panel cleanup, popup/lightbox reset mechanics, and shared
  post-render sync calls while `app.js` keeps the renderer implementations and
  mode registry wiring.
- `src/app/online-mode-controller.js` and `ONLINE_MODE_BOUNDARIES.md` now name
  the public `3D Campus Preview` launcher separately from legacy/future
  main-app live game room mechanics.
- `src/app/legacy-live-room-renderer.js` now owns legacy/live room HTML
  rendering, live waiting overlays, room cards, and arcade live-game display
  templates.
- `src/app/legacy-live-room-controller.js` now owns legacy/live room access,
  lobby/session sync, heartbeat/subscription cleanup, live event reducers,
  chat, start/join/leave actions, and arcade-live action mechanics while
  `app.js` keeps compatibility wrappers, public availability flags, and
  remaining Jeopardy-local game calls.
- `src/app/content-normalization-helpers.js` now owns raw-content section/entry
  normalization, support-field cleanup, subject and big-idea alias mapping,
  wrong-answer cleanup, and French-text fallback generation while `app.js`
  keeps raw override data and startup wiring. Moving `RAW_ENTRY_OVERRIDES` and
  `RAW_SECTION_OVERRIDES` out of `app.js` remains a separate
  content-canonicalization pass.
- `src/app/app-event-router.js` now owns document-level click, input, submit,
  keydown, wheel, touchstart, and touchend dispatch mechanics while `app.js`
  keeps the action implementations and compatibility handler wrappers.
- `src/app/raw-content-controller.js` now owns Raw Content route payloads,
  entry-card orchestration, mastery toggles, quiz pager state, visual asset
  selection, media-lightbox state, and raw-content display helpers while
  `app.js` keeps compatibility wrappers for existing callers in Regular Guide,
  Mind Map, game setup, and event actions.
- `src/app/study-game-controller.js` now owns local Collaborative Writing,
  Scholar's Bowl, and Scholar's Challenge action mechanics while `app.js` keeps
  their builders, renderers, and compatibility wrappers.
- `src/app/arcade-game-controller.js` now owns local Race, Alpaca Run, Relay,
  and Jump action mechanics while `app.js` keeps their builders, renderers,
  timers, DOM patch helpers, and compatibility wrappers.
- `src/app/modal-focus-service.js` now owns active dialog focus trapping,
  background inerting, and focus restoration while `app.js` keeps modal
  open/close policy.
- `src/services/storage-service.js` and `src/app/progress-storage-controller.js`
  now report non-fatal browser storage failures; `vercel.json` carries baseline
  static security headers for future Vercel artifacts.
- `src/app/app-dom-service.js` now owns the trusted HTML boundary, HTML-to-text
  conversion, and escaping helper; `npm run test:html-sinks` blocks direct HTML
  sinks outside that approved service.
- `src/features/alpaca-campus-3d/campus-network-guardrails.ts` now owns
  movement delta/heartbeat decisions, payload-size helpers, network value
  sanitization, and remote-player caps for the 3D campus preview.

Acceptance per extraction:

- small diff;
- no UI changes unless explicitly requested;
- existing browser script load path still works;
- tests/typechecks run;
- rollback is easy.

### `app.js` Risk Targets

The architecture analysis DOCX identifies `app/app.js` as the top severity and
likelihood risk until it is small enough to review by responsibility instead of
by scrolling through one giant file. The targets below are review gates, not
automatic safety guarantees. After the Debate Lab / Build Case extraction,
`app.js` is about 11.0k lines, so it is improved but still above the target
for the Medium-risk band.

| `app.js` state | Target risk | Meaning |
| --- | --- | --- |
| Above 10k lines | High | Still a god file. Reviewers should assume hidden coupling, fragile globals, and high regression likelihood. |
| Below 10k lines with passing smoke/build/typecheck gates | Medium | Responsibilities are visible enough for targeted review, but script-order and untyped contracts still matter. |
| Below 5k lines with modules, typed contracts, and focused tests | Low-Medium | `app.js` becomes orchestration/bootstrap rather than business/rendering logic. |
| True Low | Low | Requires explicit imports, typed public contracts, focused unit tests, browser journey coverage, and much less dependence on `window.WSC_*` script order. |

Highest-value next extractions from the architecture analysis:

- route render orchestration and timer lifecycle;
- mode-specific renderers that can move behind feature modules;
- remaining Jeopardy-specific local start/reset/tile/focus flows after current
  smoke coverage is broadened;
- a classic-script dependency map before any ES module or bundler migration.

Non-goals remain important: do not rewrite the whole main app in React now, do
not move all UI into TypeScript at once, and do not reopen legacy live rooms
without active Supabase RLS/RPC review.

## Pass 5: Reduce CSS Risk

Status: started. `app/styles.css` is now an ordered import index and the former
single stylesheet has been split into root-level `styles-*.css` chunks so
existing asset URLs remain stable across static hosting, GitHub Pages, Vercel,
and the desktop package.

Completed first cuts:

- app shell and entry gate;
- route builder/wizard;
- shared experience and learn-mode selectors;
- play, live, and online mode selectors;
- Raw Content and regular guide;
- late shell/header/route-builder/learn/online overrides kept in original
  cascade order;
- 3D campus styles are already separate and should stay separate.

Next CSS cleanup work:

- reduce mixed responsibilities in late override chunks only after screenshot
  coverage is strong;
- move toward a clearer token/base/component/feature structure;
- keep class names stable unless a renderer migration proves a rename safe.

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

- `npm run test:theme` validates the source theme, runs the active-runtime
  compatibility comparison, and checks that `app/generated/current-runtime/`
  is exactly regenerable from `content/themes/2026/`.
- Use `npm run theme:compare:strict` and `npm run theme:compare:legacy-audit`
  only for legacy compatibility audits; they are not the source-of-truth gate.
- `npm run test:smoke` currently passes in the clean GitHub copy and should stay
  part of the verification loop.

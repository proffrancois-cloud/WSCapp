# Alpaca Campus 3D Studio Board

This board is the local coordination surface for the first specialist-agent sprint. The project runs with one lead-gated workflow: specialists own narrow workstreams, and David head engineer integrates, verifies, and resolves conflicts.

## Sprint 1 Goal

Ship a polished 5-room vertical slice for:

- `school-lobby`
- `guiding-library-lounge`
- `flashcard-museum`
- `debate-room-1`
- `games-hall`

The slice must prove the full campus loop: move, see other players, enter rooms, open real WSC content, claim seats/roles, and launch room-local activities.

## Team Roster

| Role | Agent | Ownership | Status |
|---|---|---|---|
| Head Engineer / Producer | David head engineer | Board, integration, verification, merge decisions | Integrated |
| 3D Rendering / Technical Artist | Sidi Yahya artist 3d `019e6886-fc6b-7561-876e-10a58d2c274d` | Asset pipeline, GLB budgets, first asset manifest | Integrated |
| Rooms / Foundation Engineer | Robin architecte `019e6887-00df-7340-8353-fd7b760f78f8` | 5-room manifest, room contract, camera/portal expectations | Integrated |
| Connection / Content Integrator | Taylor connector `019e6887-0575-7aa1-870a-0b2e84805a4c` | Per-room content surfaces and WSC data mapping | Integrated |
| Mini-Games Engineer | Ira jeux dans jeu `019e6887-09a5-7a32-8034-af9d3dc125fd` | Debate/game/activity contracts and event names | Integrated |
| Network / Bandwidth Engineer | Ely Reseauteur `019e6887-0dd3-7d60-a670-c8650deec2ee` | Supabase Realtime policy, movement/seat event contracts | Integrated |
| Player Mock / QA | Eugene player `019e6887-12bd-7413-84f5-1f30d991a585` | Human-eye QA, acceptance gaps, desktop/mobile checks | Integrated |
| WSC Master | WSC Master `019e68c9-1b85-7580-93da-c805a907c83a` | WSC context, solo-mode alignment, content logic, WSC rules fidelity | Integrated |

## Lead-Gated Rules

- Specialists must not edit outside their assigned files/modules.
- Any shared runtime change goes through David head engineer.
- Content remains source-of-truth driven by existing WSC runtime/window APIs.
- Multiplayer runtime starts with Supabase Realtime; dedicated game servers stay deferred.
- Blender authoring is allowed, but runtime assets must be web-deliverable `.glb`.
- No generated room mesh or texture may bake in WSC guide/video/card content that should remain dynamic.

## Sprint Gates

| Gate | Required Evidence |
|---|---|
| Contract gate | Asset, room, content, activity, and network contracts exist and typecheck. |
| Vertical slice gate | Each of the 5 rooms has at least one meaningful interactive surface. |
| Multiplayer gate | Presence is room-scoped, movement is throttled, seat claims have a single-winner path. |
| Visual gate | Desktop and mobile screenshots show nonblank WebGL scenes with readable controls. |
| QA gate | Eugene player report is triaged into blocker/confusing/polish lists. |
| WSC context gate | WSC Master confirms room content, slideshow/library organization, and mini-game rules match the real WSC app and WSC logic. |

## Integration Order

1. Create/read specialist contract files.
2. Import contracts into the 3D runtime only after typecheck passes.
3. Wire visible UI affordances for content and activity surfaces.
4. Add shared-state/seat event flow without changing database schema.
5. Run typecheck/build.
6. Run desktop/mobile Playwright screenshots.
7. Run two-session presence/room-switch smoke test.
8. Update this board with final status and residual risks.

## Current Notes

- Blender is installed as `/Applications/Blender.app`, but no `blender` command is on PATH yet.
- The 3D campus dev server can run with `npm run dev:3d` from `app/`.
- The current implementation is intentionally a first playable shell, not final art.
- Existing unrelated repo changes must be preserved.

## Integrated Outputs

- Asset contract: `asset-manifest.ts` and `docs/ASSET_PIPELINE.md`.
- Room contract: `room-manifest.ts` and `docs/ROOM_CONTRACT.md`.
- Content contract: `content-surfaces.ts` and `docs/CONTENT_CONTRACT.md`.
- Activity contract: `activity-contracts.ts` and `docs/ACTIVITY_CONTRACT.md`.
- Network contract: `network-contract.ts` and `docs/NETWORK_POLICY.md`.
- Runtime integration: five-room dock ordering, contract-backed room materials/camera defaults, content-surface panel metadata, Games Hall arcade launches, Debate Room role/seat panels, room-scoped seat occupancy broadcasts, and user-facing realtime status labels.

## Verification Results

- `npm run typecheck:3d` passed.
- `npm run build:3d` passed. Existing Vite warnings remain for legacy non-module bridge scripts and the large Three.js vendor chunk.
- Desktop visual smoke passed at `http://127.0.0.1:5173/alpaca-campus-3d/`.
- Mobile visual smoke passed at 390px width.
- Five-room dock smoke passed for School Lobby, Library, Museum, Debate Room, and Games Hall with one canvas present in each room.
- Content mapping smoke passed: lobby `Campus Updates`, library first guide, museum first Alpacard, debate `Judge Desk`, games `Play Path`.
- Two-tab smoke passed: both players appeared in Debate Room, the second player saw the already claimed debate seat as occupied, and leaving the room removed that player from the first room's online count.

## Residual Risks

- Seat locking is still Supabase Realtime/presence based, not a database-backed authoritative lease. The durable event policy is defined, but the persistence adapter/RLS migration is still a later sprint item.
- Runtime room art is generated Three.js geometry until authored GLBs land under the asset manifest paths.
- The Three.js vendor chunk is large; code-splitting and GLB lazy loading should be handled before a broader public beta.

## User Direction For Next Agent Pass

### Sidi Yahya artist 3d

PNG images generated with GPT image generator are useful as concept art, orthographic references, texture references, posters, icons, billboards, and UI surfaces. They are not automatically clean 3D models. For GPT image prompts, request:

- Orthographic front/side/back/top references when the object needs to become a 3D prop.
- Isolated asset sheets on a plain background with one object per image.
- Consistent scale cues: doors, chairs, alpacas, shelves, tables, screens, and wall panels should be comparable across rooms.
- Clean silhouettes, no text baked into the image, no watermarks, no dramatic blur, and no cropped edges.
- Separate material intent: wood, painted metal, fabric, glass, screen, paper, carpet, stone.
- For rooms, ask for a clean isometric or top-down layout plus separate wall/furniture references; avoid a single cinematic angle as the only source.

Starter asset list:

- Global: five alpaca avatar body/outfit references, nameplate style, interaction marker, portal/door frame kit, seat kit, small sign kit, dynamic screen/frame kit.
- Lobby: information alpaca desk, four clear doors/portals, WSC updates board, lobby seating, reception desk, wall signage.
- Library: guide shelves, reading tables, book cart, shelf labels as dynamic surfaces, quiet seating, return door.
- Museum: slideshow wall, video wall, Alpacard frames, gallery ropes/stands, exhibit label holder as dynamic surface, return door.
- Debate Room: proposition table, opposition table, judge/moderator table, lectern, whiteboard/timer board, spectator rows, team/judge seat markers.
- Games Hall: arcade cabinets, live Alpacapardy board/screen, team tables, bleachers, trophy/scoreboard dynamic surfaces, game launch signs.

Current avatar assignment:

- Own the first real player alpaca pipeline in `docs/AVATAR_ASSET_PIPELINE.md`.
- Start from orthographic GPT reference PNGs, then build/rig/animate in Blender unless an image-to-3D mesh survives cleanup and rigging tests.
- First runtime animation target is a clean in-place `idle` and `walk` loop in GLB, with the alpaca facing `-Z`, root on the floor, and all four hooves readable from the current high follow camera.
- For the Library shelves/tables, use `docs/KENNEY_LIBRARY_AND_GAME_HALL_HANDOFF.md`: the preferred `kenney_isometricLibrary` objects are PNG references, so use them as visual targets or temporary billboards until a real GLB shelf/table kit is modeled.
- For the Games Hall experiment, use the copied `kenney_furniture-kit` GLBs under `app/assets/campus-3d/props/kenney-furniture/`.

### Robin architecte

Room architecture must make movement clear. Doors need to be placed where players visually expect passage from one room to another. Robin must coordinate with Sidi Yahya so door positions, portal labels, dynamic surfaces, seat locations, and collision proxies line up between room topology and final visual assets. Every room needs readable spawn points, return paths, blocked areas, and camera defaults.

Current lobby correction:

- Portal doors must be attached to the actual lobby wall planes, not floating in the room center.
- The reception desk faces the player-facing lobby area, with the red Information Alpaca positioned behind the desk.
- Runtime camera is restored to the previous high follow view; future doors, shelves, and table spacing should be checked from that framing.
- Games Hall layout now has a first Kenney furniture pass: central team tables, side bleachers, desk stations, scoreboard wall, and screen/speaker props.

### Taylor connector

Taylor owns the exact Library organization plan in `docs/LIBRARY_ORGANIZATION_PLAN.md`: every shelf maps to the current guide `sectionIndex`, table/cart surfaces stay indexes into existing WSC content, and long guide/raw-entry detail opens in edge panels or bottom sheets so the center 3D view stays focused on the room.

Taylor should also read `docs/KENNEY_LIBRARY_AND_GAME_HALL_HANDOFF.md` so the visual shelf plan stays attached to the existing `guide-shelf-N` content mapping instead of becoming a separate content list.

### Ira jeux dans jeu

Start with Debate Room logic before broadening to other mini-games. WSC debate UX must respect real tournament flow: team versus team, one debate at a time per room/table set, clear proposition/opposition/judge/spectator positions, speech order, preparation state, speaking state, judging state, and room-visible progress. Ira owns the seating/role-lock logic and must tell Robin and Sidi Yahya where tables, judge positions, audience rows, whiteboard/timer surfaces, and active speaker positions belong.

Current debate assignment:

- Own the detailed Debate Lab model in `docs/DEBATE_LAB_LOGIC.md`.
- First playable supports one active 3v3 debate table in `debate-room-1`, with PRO/CON speaker seats, judge/moderator controls, spectator areas, prep timer, alternating speeches, feedback phase, and clear seat locking.
- Physical placement handoff to Robin and Sidi Yahya must include team tables, judge desk, lectern, whiteboard/timer board, spectator rows, active speaker zone, and lock indicators.
- For the Games Hall, coordinate with Robin and Sidi Yahya around `docs/KENNEY_LIBRARY_AND_GAME_HALL_HANDOFF.md`: team tables are future live-game groups, bleachers are spectator seating, and screens/cabinets are launch anchors.

### Ely Reseauteur

Supabase must stay efficient. Chat/conversation-style messages should be ephemeral unless explicitly marked as a saved artifact. Presence, movement, typing, hover, temporary debate speech timers, and room-local chat are realtime/ephemeral. Persistent Supabase data should be deliberate: user profile, progress, avatar/cosmetic choices, team membership, school affiliation, debate/game results when needed, achievements, and authored/saved work. Ely must keep a clear matrix of ephemeral vs durable state before adding tables.

### Eugene player

QA must include macOS now, plus iOS, Windows, Android/non-iOS phones, desktop browsers, and mobile browsers as target behavior. Evaluate as a 12-16 year old user: the center of the screen stays focused on the game world, extra information is hidden in menus/popups/drawers, and panels appear on edges/top/side without blocking the core view. Every extra info surface must be easy to open, close, and ignore.

### WSC Master

WSC Master owns context fidelity. They verify that the 3D campus is not random: it must stay connected to solo mode content, WSC curriculum organization, WSC learning paths, and real WSC activity logic. WSC Master double-checks slideshow placement in the museum, library organization by guiding sections and entries, Alpacard/video/raw-content mapping, and mini-game rules with Ira so debates and games respect how WSC actually works.

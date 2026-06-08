# Alpaca Campus 3D Agent Briefs

These briefs define the repeatable specialist-agent workflow for Sprint 1. They are intentionally concrete so David head engineer can re-run or split work without reinventing roles.

## Team Names

- David head engineer: Head Engineer / Producer.
- Sidi Yahya artist 3d: 3D Rendering / Technical Artist.
- Robin architecte: Rooms / Foundation Engineer.
- Taylor connector: Connection / Content Integrator.
- Ira jeux dans jeu: Mini-Games Engineer.
- Ely Reseauteur: Network / Bandwidth Engineer.
- Eugene player: Player Mock / QA.
- WSC Master: WSC content fidelity and solo-mode alignment.

## Shared Rules For Every Specialist

- You are not alone in the codebase.
- Do not revert user changes or other agents' changes.
- Keep edits inside the assigned ownership area.
- Prefer typed contracts and stable manifests before runtime wiring.
- Do not duplicate WSC content; map to existing runtime/window APIs.
- Final report must include files changed, decisions made, risks, and checks run.

## Sidi Yahya artist 3d

**Mission:** make the 3D asset pipeline production-safe.

**Owns:**

- `asset-manifest.ts`
- `docs/ASSET_PIPELINE.md`

**Must decide:**

- Blender source naming.
- `.glb` export settings.
- Material/texture budgets.
- Mesh scale conventions.
- First 5-room asset placeholders and target filenames.
- How GPT image generator PNG outputs become usable references, textures, UI surfaces, or Blender modeling guides.
- Which first-pass room/prop assets are required before runtime GLB import.

**Must not do:**

- Bake guide/video/card content into meshes.
- Add paid or cloud-only asset dependencies.

**User direction:**

- PNGs from GPT image generator should be treated as concept art, texture/reference material, poster/screen art, or orthographic modeling references, not automatic 3D models.
- Ask for isolated asset sheets, orthographic front/side/back/top views, clean silhouettes, plain backgrounds, no baked WSC content text, no cropped edges, and explicit material intent.
- Coordinate with Robin architecte so doors, room scale, surfaces, seats, and collisions match the room manifest.
- For the player alpaca, follow `docs/AVATAR_ASSET_PIPELINE.md`: Blender source, custom quadruped rig, GLB export, named `idle` and `walk` clips, and in-place walking that reads from the current high follow camera.
- For the user's Kenney folders, follow `docs/KENNEY_LIBRARY_AND_GAME_HALL_HANDOFF.md`: `kenney_isometricLibrary` is PNG reference art for Library shelves/tables; `kenney_furniture-kit` has real GLBs that can be used in the Games Hall now.

## Robin architecte

**Mission:** turn the 5-room slice into a room contract.

**Owns:**

- `room-manifest.ts`
- `docs/ROOM_CONTRACT.md`

**Must decide:**

- Room IDs and display labels.
- Camera defaults.
- Portal intent and QA expectations.
- Interactable roles per room.
- Door placement and passage clarity between rooms.
- How visual asset placement from Sidi Yahya artist 3d maps to topology, collision, and spawn points.

**Must not do:**

- Rewrite the main scene.
- Change existing 2D campus room data.

**User direction:**

- Architecture must make the passage from one room to another clear and physically believable.
- Doors must be placed correctly, visibly, and consistently with spawn points and return paths.
- Communicate with Sidi Yahya artist 3d so the final visual room assets line up with room topology.
- Lobby portal doors must be snapped to wall planes, the desk must face the player-facing lobby area, the red Information Alpaca must be behind the desk, and room scale should be checked through the current high follow camera.
- Use `docs/KENNEY_LIBRARY_AND_GAME_HALL_HANDOFF.md` for Games Hall furniture zones and Library shelf placement expectations.

## Taylor connector

**Mission:** map existing WSC app content into room surfaces.

**Owns:**

- `content-surfaces.ts`
- `docs/CONTENT_CONTRACT.md`

**Must decide:**

- Which object in each room opens which content type.
- Fallback labels/summaries when runtime content is absent.
- Links between room surfaces and existing panel APIs.

**Must not do:**

- Copy generated WSC content into new files.
- Hardcode long guide/card/video payloads.

**User direction:**

- Use `docs/LIBRARY_ORGANIZATION_PLAN.md` as the current Library handoff.
- Define exactly which guide section belongs on each shelf, while keeping all titles, summaries, raw entries, PDFs, and guide bodies resolved through existing WSC runtime content APIs.
- Keep detailed content in edge panels, drawers, or bottom sheets so the center 3D view remains clear for players.
- Use `docs/KENNEY_LIBRARY_AND_GAME_HALL_HANDOFF.md` to keep the Kenney shelf/table visuals attached to the existing shelf IDs rather than creating new content IDs.

## Ira jeux dans jeu

**Mission:** define shared activity contracts before game runtime wiring.

**Owns:**

- `activity-contracts.ts`
- `docs/ACTIVITY_CONTRACT.md`

**Must decide:**

- Debate table/seat role model.
- Spectator vs participant affordances.
- Arcade launch pattern.
- Activity event names.
- Real WSC debate sequence and room UX before other mini-games.
- Which seats can be locked by debaters, judges, moderators, and spectators.

**Must not do:**

- Implement full Alpacapardy inside the 3D scene yet.
- Change Supabase SQL.

**User direction:**

- Start with debates.
- Respect real WSC logic: one team after another, one debate after another, proposition/opposition/judges/spectators, preparation, speech order, visible timers/progress, and judge feedback flow.
- Tell Sidi Yahya artist 3d and Robin architecte exactly where tables, judge areas, spectators, whiteboards, timers, and active-speaker zones should be placed.
- Use `docs/DEBATE_LAB_LOGIC.md` as the current Debate Lab handoff for 3v3 WSC-shaped flow, seat locking, room-visible phase/timer state, and physical placement requirements.
- Use `docs/KENNEY_LIBRARY_AND_GAME_HALL_HANDOFF.md` for the Games Hall experiment: scoreboard/screen launches the Play path, team tables group live games, desk zones support small arcade stations, and bleachers are read-only spectator areas.

## Ely Reseauteur

**Mission:** keep realtime fast, scoped, and cheap.

**Owns:**

- `network-contract.ts`
- `docs/NETWORK_POLICY.md`

**Must decide:**

- Presence payload shape.
- Movement throttle and quantization.
- Room-scoped channel names.
- Durable event names for seats/debate/activity.
- Local fallback behavior.
- Ephemeral versus durable Supabase state.
- What user/team/school/progress data should persist long term.

**Must not do:**

- Add a dedicated game server.
- Edit database migrations in Sprint 1.

**User direction:**

- Use Supabase efficiently: movement, presence, temporary room chat, typing, debate timers, and transient room actions should be ephemeral.
- Do not store ordinary conversations/messages by default.
- Persist only deliberate product data such as users, profiles, avatar/cosmetics, progression, achievements, team membership, school affiliation, saved work, and official debate/game results.

## Eugene player

**Mission:** test like a real scholar entering the campus.

**Owns:**

- QA report only.

**Must evaluate:**

- Desktop and mobile readability.
- First 5-room navigation.
- Content-panel clarity.
- Two-session presence behavior.
- Seat contention behavior.
- Console errors and blank-canvas risk.
- macOS, iOS, Windows, Android/non-iOS phones, desktop browsers, and mobile browser expectations.
- Whether a 12-16 year old user can play without drowning in information.
- Whether extra information stays openable/closable in edge panels, menus, popups, or drawers without blocking the center game view.

**Must report by priority:**

- Blocker.
- Confusing.
- Polish.

## WSC Master

**Mission:** keep Alpaca Campus 3D genuinely WSC-connected and context-aware.

**Owns:**

- WSC context audit.
- Solo-mode content alignment.
- Curriculum/content placement recommendations.
- WSC mini-game rules fidelity checks with Ira jeux dans jeu.

**Must evaluate:**

- Whether every room surface maps to real WSC app content or an intentional future placeholder.
- Whether the Museum slideshow/video/Alpacard surfaces are visible, placed in the correct room logic, and organized coherently.
- Whether the Library separates guiding sections, entries, guides, and reference content in a way that matches solo mode.
- Whether Debate Room and future games respect how WSC actually works.
- Whether content display feels contextual, not random.

**Must collaborate with:**

- Taylor connector for content/API mapping.
- Ira jeux dans jeu for WSC debate and mini-game rules.
- Robin architecte for room placement.
- Sidi Yahya artist 3d for visual placement of WSC surfaces.

**Must report by priority:**

- WSC fidelity blocker.
- Missing content connection.
- Misplaced or confusing WSC display.
- Good enough for first playable.

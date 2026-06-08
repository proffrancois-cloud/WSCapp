# Alpaca Campus Visual Asset Pipeline

This is the repeatable workflow for turning a generated room image into a playable Alpaca Campus environment.

## Current Room Assets

The image-backed rooms are wired from the visual panels in:

`/Users/francoismo/Desktop/Pro/ILG - MORET FRANCOIS/FLE/2025-2026/WSC/Multiplayer habbo project/Visuals panel`

Served backgrounds now live in:

`app/assets/campus/backgrounds/`

Mapped rooms:

| Room ID | Served asset | Source panel |
|---|---|---|
| `campus-courtyard` | `campus-courtyard.png` | `01. CAMPUS COURTYARD 2.png` |
| `school-lobby` | `school-lobby.png` | `02. SCHOOL LOBBY.png` |
| `learning-commons` | `learning-commons.png` | `03. LEARNING COMMONS.png` |
| `flashcard-museum` | `flashcard-museum.png` | `04. FLASHCARD MUSEUM.png` |
| `slideshow-studio` | `slideshow-studio.png` | `05. SLIDESHOW STUDIO.png` |
| `mind-map-lab` | `mind-map-lab.png` | `06. MIND MAP LAB.png` |
| `alpaca-channel-cinema` | `alpaca-channel-cinema.png` | `07. CINEMA.png` |
| `raw-content-classroom` | `raw-content-classroom.png` | `08. RAW CONTENT CLASSROOM.png` |
| `guiding-library-lounge` | `guiding-library-lounge.png` | `09. GUIDING LIBRARY LOUNDGE.png` |
| `games-hall` | `games-hall.png` | `10. GAMES HALL.png` |
| `alpacapardy-hall` | `alpacapardy-hall.png` | `11. ALPACAPARDY HALL.png` |
| `alpaca-run-track` | `alpaca-run-track.png` | `12. ALPACA RUN TRACK.png` |
| `alpaca-jump-gym` | `alpaca-jump-gym.png` | `13. ALPACA JUMP GYM.png` |
| `alpaquiz-relay-room` | `alpaquiz-relay-room.png` | `14. ALPAQUIZ RELAY ROOM.png` |
| `survivalpaca-arena` | `survivalpaca-arena.png` | `00. First draft general panel.png` fallback thumbnail |
| `training-center` | `training-center.png` | `16. TRAINING CENTER.png` |
| `writing-studio` | `writing-studio.png` | `17_writing_studio_room_background_only.png` |
| `debate-lab` | `debate-lab.png` | `18. DEBATE LAB.png` |
| `scholars-bowl-studio` | `scholars-bowl-studio.png` | `19. SCHOLARS BOWL.png` |
| `scholars-challenge-room` | `scholars-challenge-room.png` | `20. SCHOLARS CHALLENGE.png` |
| `grand-amphitheater` | `grand-amphitheater.png` | `00. First draft general panel.png` fallback thumbnail |
| `debate-room-1` | `debate-room-1.png` | `21. CLASSROOM 1 - objects.png` room preview |
| `debate-room-2` | `debate-room-2.png` | `22. CLASSROOM 2 - objects.png` room preview |
| `debate-room-3` | `debate-room-3.png` | `23. CLASSROOM 3 - objects.png` room preview |

The duplicate source panel `01. CAMPUS COURTYARD.png` was kept as a reference, but the runtime uses the cleaner `01. CAMPUS COURTYARD 2.png` extraction.

Object reference sheets used for clickable geometry:

- `00-08 objects.png`: courtyard, lobby, learning commons, flashcard museum, slideshow studio, mind map lab, cinema, raw classroom furniture and prop reference.
- `09-13 objects.png`: guiding library, games hall, Alpacapardy, run track, and jump gym furniture and prop reference.
- `17_writing_studio_objects_variants_only.png`, `18. DEBATE LAB - objects.png`, `19. SCHOLARS BOWL - objects *.png`, `20. SCHOLARS CHALLENGE - objects.png`, and `25. MEDITATION ROOM - objects.png` remain prop references unless separate transparent sprite extraction is added later.

## Runtime Mechanic

1. `data/room-assets.js` maps a room ID to a background texture key and served image URL.
2. `campus-world-scene.js` preloads every mapped background image.
3. When a room loads, Phaser checks the room asset manifest.
4. If a background image exists, it draws that image at room-world size.
5. If no image exists, the scene falls back to the procedural placeholder background.
6. Movement, blocked zones, portals, seats, realtime presence, chat, object interactions, and content panels continue to use room data from `data/rooms.js`.

This means future rooms can move from placeholder to image-backed without rewriting the scene.

## Add A New Room Visual

1. Put the cleaned/cropped room image into:

   `app/assets/campus/backgrounds/<room-id>.png`

2. Add an entry to `app/src/features/alpaca-campus/data/room-assets.js`:

   ```js
   "room-id": {
     key: "campus-bg-room-id",
     src: "../assets/campus/backgrounds/room-id.png",
     sourcePanel: "Source panel filename.png",
     extraction: "primary full-room view"
   }
   ```

3. Keep the room geometry in `data/rooms.js`:

   - `world`
   - `walkBounds`
   - `walkZones`
   - `blockedZones`
   - `portals`
   - `objects`
   - `seats`
   - `spawnPoints`

4. Run syntax checks:

   ```bash
   node --check app/src/features/alpaca-campus/data/room-assets.js
   node --check app/src/features/alpaca-campus/game/campus-world-scene.js
   node --check app/src/features/alpaca-campus/game/movement-engine.js
   node --check app/src/features/alpaca-campus/data/rooms.js
   ```

5. Open:

   `http://localhost:4173/alpaca-campus/?campusDebug=1`

6. Confirm `window.WSC_ALPACA_CAMPUS_DEBUG.getSnapshot().backgroundKey` shows the expected texture key.

## Important Notes

- Do not bake NPCs or player alpacas into final backgrounds.
- Keep blank frames/screens in room art so the app can overlay real alpacards, guide images, raw content, and video thumbnails.
- If a visual panel includes notes, closeups, or palette blocks, crop only the main full-room view before adding it to `app/assets/campus/backgrounds/`.
- If a full-room crop has panel labels, crop below the label or clean the source before serving it.
- Room images are visual plates only; the playable boundaries still come from `rooms.js`.
- Use the green walkable-space reference in each visual panel as the source of truth for `walkZones`. Alpacas should be able to approach furniture from the green/aisle area and then sit or interact; they should not route through walls, backdrops, or object-only regions.

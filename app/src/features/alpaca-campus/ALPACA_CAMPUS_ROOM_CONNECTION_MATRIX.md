# Alpaca Campus Room Connection Matrix

This document is the product and implementation map for the current Alpaca Campus MVP. It answers three questions for every room:

- Which part of the WSC app or future campus experience does this room host?
- Which real app data/content is already connected?
- Which premium visual assets are needed to replace the current placeholder shapes?

The playable route is `/alpaca-campus/`. The implementation is intentionally isolated from the production homepage, Learn, Play, Train, dashboard, and existing multiplayer routes.

## Campus Scale

- Runtime room scale: `1.65x` prototype layout scale.
- Camera: zoomed out to `0.62` so rooms feel like real social spaces instead of tiny demo rooms.
- Multiplayer model: players are scoped to their current room channel, so 300+ users can be distributed across the campus rather than rendered in one room.
- Visual generation target: generate large room backgrounds using the final sizes in `ALPACA_CAMPUS_IMAGE_GENERATION_PROMPT_PACK.md`.

## App Paths Covered

| App path | Existing modes covered by Campus rooms |
|---|---|
| Learn | Slideshow Lesson, Mind Map, Raw Content, Guide, Alpaca Channel, Alpacard |
| Play | Alpacapardy, Alpaca Run, Alpaca Jump, Alpaquiz, Survivalpaca |
| Train | Collaborative Writing, Debate Lab, Scholar's Bowl, Scholar's Challenge |
| Campus social | Courtyard, School Lobby, Learning Commons, Games Hall, Training Center, Amphitheater, Debate Rooms |

## Live/Reused Data Sources

| Campus area | Source already loaded |
|---|---|
| Flashcard Museum | `window.WSC_ALPACARDS` from generated alpacards content |
| Alpaca Channel Cinema | `window.WSC_ALPACA_CHANNEL.videos` |
| Raw Content Classroom | `window.WSC_RAW_CONTENT_BANK.sections` media and entries |
| Guiding Library Lounge | `window.WSC_RAW_CONTENT_BANK.regularGuides` and `window.WSC_KNOWLEDGE_BANK.sections` |
| Debate Lab | `window.WSC_DEBATE_LAB_DATA.topics` |
| Bowl Studio | Existing local Scholar's Bowl stimulus assets in `app/assets/scholars-bowl/stimuli/` |
| Challenge / Games | Raw content quiz questions and Full Voyage questions |
| Profile/avatar/quests | Campus progress under existing `alpaca_progress.game_stats.campus` shape when authenticated, local storage for guests |
| Realtime | Supabase Presence for roster, Broadcast for movement/chat/objects/seat events |

## Room Matrix

### 1. Campus Courtyard

- Room ID: `campus-courtyard`
- Role: social arrival area and outdoor campus entrance.
- Current interactions: click-to-move, ball kick, six swing seats, gathering area panel, entrance portal to School Lobby.
- App connection: not tied to one app mode; it is the social entry layer for all paths.
- Realtime: room-specific presence, chat, movement, ball events, swing/seat occupancy.
- Premium assets needed:
  - `bg-campus-courtyard`
  - `hero-courtyard-school-building`
  - `hero-courtyard-sports-court`
  - `hero-courtyard-gathering-circle`
  - `prop-school-entrance-door`
  - `prop-campus-ball`
  - `prop-swing-set-frame`
  - `prop-swing-seat`
  - `prop-welcome-board`

### 2. School Lobby

- Room ID: `school-lobby`
- Role: main indoor hub after entering the campus.
- Current interactions: Information Alpaca, Coach Alpaca, Syllabus Board, Big Ideas Board, Updates Board, portals to learning/game/training/event/debate rooms.
- App connection: starter Learn Lobby quests and navigation into all app paths.
- Real data used: WSC subjects, guide sections, insights, first knowledge atoms.
- Realtime: room-specific presence, chat, movement, seat/object events where added later.
- Premium assets needed:
  - `bg-school-lobby`
  - `prop-information-desk`
  - `npc-information-alpaca`
  - `npc-coach-alpaca`
  - `prop-syllabus-board`
  - `prop-big-idea-board`
  - `prop-welcome-board`
  - `prop-door-learning`
  - `prop-door-games`
  - `prop-door-training`
  - `prop-generic-campus-door`

### 3. Learning Commons

- Room ID: `learning-commons`
- Role: Learn path hub.
- Current interactions: Learn Path Directory, Learning Alpaca, study seats, portals to Learn rooms.
- App connection: routes users toward Slideshow, Mind Map, Alpacard, Alpaca Channel, Guide, and Raw Content.
- Real data used: mode definitions and Learn path summary.
- Premium assets needed:
  - `bg-learning-commons`
  - `npc-learning-alpaca`
  - `prop-study-seat`
  - `prop-route-board`
  - `prop-generic-campus-door`

### 4. Flashcard Museum

- Room ID: `flashcard-museum`
- Role: Alpacard room.
- Current interactions: 10 exhibit frames with proximity interaction.
- App connection: Learn path, Alpacard mode.
- Real data used: actual alpacard titles, images, metadata, summaries, and source links.
- Current content behavior: real alpacard images are shown as wall previews and in the drawer panel.
- Premium assets needed:
  - `bg-flashcard-museum`
  - `prop-museum-frame-large`
  - `prop-museum-frame-small`
  - `prop-generic-campus-door`

### 5. Slideshow Studio

- Room ID: `slideshow-studio`
- Role: slideshow lesson room.
- Current interactions: projector screen, route board, lesson seats.
- App connection: Learn path, Slideshow Lesson mode.
- Real data used: guide titles and summaries are exposed in the Campus mode panel.
- Placeholder status: full slideshow playback is not embedded yet.
- Premium assets needed:
  - `bg-slideshow-studio`
  - `prop-cinema-screen`
  - `prop-route-board`
  - `prop-study-seat`
  - `prop-generic-campus-door`

### 6. Mind Map Lab

- Room ID: `mind-map-lab`
- Role: concept mapping room.
- Current interactions: central mind map table, lens board, lab stools.
- App connection: Learn path, Mind Map mode.
- Real data used: WSC subjects and descriptions.
- Placeholder status: full interactive mind map engine is not embedded yet.
- Premium assets needed:
  - `bg-mind-map-lab`
  - `prop-mind-map-table`
  - `prop-big-idea-board`
  - `prop-study-seat`
  - `prop-generic-campus-door`

### 7. Alpaca Channel Cinema

- Room ID: `alpaca-channel-cinema`
- Role: video/media learning theater.
- Current interactions: screen, poster frames, video selector, cinema seats.
- App connection: Learn path, Alpaca Channel mode.
- Real data used: actual Alpaca Channel video titles, YouTube thumbnails, embeds, summaries.
- Current content behavior: screen/posters show video thumbnails; drawer can embed the selected video.
- Premium assets needed:
  - `bg-alpaca-channel-cinema`
  - `prop-cinema-screen`
  - `prop-cinema-poster-frame`
  - `prop-study-seat`
  - `prop-generic-campus-door`

### 8. Raw Content Classroom

- Room ID: `raw-content-classroom`
- Role: raw content reader room.
- Current interactions: front board, side visual frames, desks.
- App connection: Learn path, Raw Content mode.
- Real data used: actual raw content media cards, images, guide links, summaries.
- Current content behavior: raw content images are shown as room previews and drawer media cards.
- Premium assets needed:
  - `bg-raw-content-classroom`
  - `prop-raw-content-frame`
  - `prop-syllabus-board`
  - `prop-desk-seat`
  - `prop-generic-campus-door`

### 9. Guiding Library Lounge

- Room ID: `guiding-library-lounge`
- Role: main guide/library Learn room.
- Current interactions: 15 guide shelves, guide table, lounge seats.
- App connection: Learn path, Guide mode.
- Real data used: actual guide HTML, knowledge section summaries, content atoms, raw imagery.
- Current content behavior: shelves open the matching guide/section panel with real guide content.
- Premium assets needed:
  - `bg-guiding-library-lounge`
  - `prop-guide-shelf-card`
  - `prop-lounge-chair`
  - `prop-study-seat`
  - `prop-generic-campus-door`

### 10. Games Hall

- Room ID: `games-hall`
- Role: Play path hub.
- Current interactions: Play Path Scoreboard, Games Host, bleachers, portals to game rooms.
- App connection: Play path overview.
- Real data used: Play mode definitions and question/sample content in child rooms.
- Premium assets needed:
  - `bg-games-hall`
  - `prop-scoreboard`
  - `npc-games-host-alpaca`
  - `prop-bench`
  - `prop-generic-campus-door`

### 11. Alpacapardy Hall

- Room ID: `alpacapardy-hall`
- Role: Jeopardy-style competition room.
- Current interactions: Alpacapardy board, Board Host, team seats.
- App connection: Play path, Alpacapardy mode.
- Real data used: raw question samples in the mode panel.
- Placeholder status: full Alpacapardy gameplay board is not embedded yet.
- Premium assets needed:
  - `bg-alpacapardy-hall`
  - `hero-alpacapardy-board`
  - `prop-scoreboard`
  - `prop-team-seat`
  - `npc-games-host-alpaca`

### 12. Alpaca Run Track

- Room ID: `alpaca-run-track`
- Role: Road to the Cup route game room.
- Current interactions: start line, route board, stands.
- App connection: Play path, Alpaca Run mode.
- Real data used: checkpoint concept tied to raw/guide/Full Voyage question levels.
- Placeholder status: full running game is not embedded yet.
- Premium assets needed:
  - `bg-alpaca-run-track`
  - `hero-run-route-track`
  - `prop-route-board`
  - `prop-bench`
  - `prop-generic-campus-door`

### 13. Alpaca Jump Gym

- Room ID: `alpaca-jump-gym`
- Role: obstacle practice game room.
- Current interactions: jump course, Jump Coach, benches.
- App connection: Play path, Alpaca Jump mode.
- Real data used: question samples in the mode panel.
- Placeholder status: full jump game is not embedded yet.
- Premium assets needed:
  - `bg-alpaca-jump-gym`
  - `hero-jump-obstacle-course`
  - `npc-jump-coach`
  - `prop-bench`
  - `prop-generic-campus-door`

### 14. Alpaquiz Relay Room

- Room ID: `alpaquiz-relay-room`
- Role: buzz-first team quiz room.
- Current interactions: buzz console, scoreboard, team seats.
- App connection: Play path, Alpaquiz mode.
- Real data used: question samples in the mode panel.
- Placeholder status: full relay/buzzer game is not embedded yet.
- Premium assets needed:
  - `bg-alpaquiz-relay-room`
  - `prop-buzz-console`
  - `prop-scoreboard`
  - `prop-team-seat`
  - `prop-timer-display`

### 15. Survivalpaca Arena

- Room ID: `survivalpaca-arena`
- Role: sudden-death race/challenge room.
- Current interactions: survival clock, threshold gate, arena seats.
- App connection: Play path, Survivalpaca mode.
- Real data used: question samples in the mode panel.
- Placeholder status: full Survivalpaca game is not embedded yet.
- Premium assets needed:
  - `bg-survivalpaca-arena`
  - `hero-survival-threshold-gate`
  - `prop-timer-display`
  - `prop-bench`
  - `prop-generic-campus-door`

### 16. Training Center

- Room ID: `training-center`
- Role: Train path hub.
- Current interactions: Training Director, tournament events board, prep benches, portals to Train rooms.
- App connection: Train path overview.
- Real data used: Train mode definitions and child room data.
- Premium assets needed:
  - `bg-training-center`
  - `hero-training-events-board`
  - `npc-training-director`
  - `prop-bench`
  - `prop-generic-campus-door`

### 17. Writing Studio

- Room ID: `writing-studio`
- Role: Collaborative Writing room.
- Current interactions: Prompt Board, Drafting Table, writer seats.
- App connection: Train path, Collaborative Writing mode.
- Real data used: writing-ready prompts from raw content relevance, takeaways, and debate relevance.
- Placeholder status: full writing collaboration engine is not embedded yet.
- Premium assets needed:
  - `bg-writing-studio`
  - `prop-writing-table`
  - `prop-big-idea-board`
  - `prop-study-seat`
  - `prop-generic-campus-door`

### 18. Debate Lab

- Room ID: `debate-lab`
- Role: case prep and debate room selector.
- Current interactions: Motion Wheel, PRO/CON Prep Board, prep seats, portals to Debate Rooms 1-3.
- App connection: Train path, Debate Lab mode.
- Real data used: actual debate motions, core issues, PRO/CON clash notes from `WSC_DEBATE_LAB_DATA`.
- Premium assets needed:
  - `bg-debate-lab`
  - `prop-motion-wheel`
  - `prop-big-idea-board`
  - `prop-study-seat`
  - `prop-generic-campus-door`

### 19. Scholar's Bowl Studio

- Room ID: `scholars-bowl-studio`
- Role: stimulus-first Bowl practice room.
- Current interactions: media screen, question console, team seats.
- App connection: Train path, Scholar's Bowl mode.
- Real data used: existing local Bowl stimulus assets and question samples.
- Placeholder status: full Bowl engine is not embedded yet.
- Premium assets needed:
  - `bg-scholars-bowl-studio`
  - `prop-cinema-screen`
  - `prop-bowl-question-console`
  - `prop-team-seat`
  - `prop-buzz-console`

### 20. Scholar's Challenge Room

- Room ID: `scholars-challenge-room`
- Role: solo Challenge practice room.
- Current interactions: challenge clock, bubble strategy board, desks.
- App connection: Train path, Scholar's Challenge mode.
- Real data used: raw question samples and Full Voyage question samples.
- Placeholder status: full Challenge engine is not embedded yet.
- Premium assets needed:
  - `bg-scholars-challenge-room`
  - `prop-timer-display`
  - `prop-challenge-bubble-board`
  - `prop-desk-seat`
  - `prop-generic-campus-door`

### 21. Grand Amphitheater

- Room ID: `grand-amphitheater`
- Role: future large event room.
- Current interactions: stage, screen, event seating, coming-soon panel.
- App connection: future Scholar's Ball, finals, live event programming.
- Real data used: none yet beyond room shell.
- Premium assets needed:
  - `bg-grand-amphitheater`
  - `hero-grand-amphi-stage`
  - `prop-cinema-screen`
  - `prop-study-seat`
  - `ui-room-transition-card`

### 22. Debate Room 1

- Room ID: `debate-room-1`
- Role: small formal debate room.
- Current interactions: Judge Alpaca, timer display, pro/con seats.
- App connection: future debate practice engine connected from Debate Lab.
- Real data used: shared Debate Lab panel shell.
- Realtime: seat occupancy visible in this room only.
- Premium assets needed:
  - `bg-debate-room-1`
  - `npc-judge-alpaca`
  - `prop-timer-display`
  - `prop-team-seat`
  - `prop-generic-campus-door`

### 23. Debate Room 2

- Room ID: `debate-room-2`
- Role: second small debate room for parallel teams.
- Current interactions: Judge Alpaca, timer display, pro/con seats.
- App connection: future debate practice engine connected from Debate Lab.
- Real data used: shared Debate Lab panel shell.
- Realtime: seat occupancy visible in this room only.
- Premium assets needed:
  - `bg-debate-room-2`
  - `npc-judge-alpaca`
  - `prop-timer-display`
  - `prop-team-seat`
  - `prop-generic-campus-door`

### 24. Debate Room 3

- Room ID: `debate-room-3`
- Role: third small debate room for parallel teams.
- Current interactions: Judge Alpaca, timer display, pro/con seats.
- App connection: future debate practice engine connected from Debate Lab.
- Real data used: shared Debate Lab panel shell.
- Realtime: seat occupancy visible in this room only.
- Premium assets needed:
  - `bg-debate-room-3`
  - `npc-judge-alpaca`
  - `prop-timer-display`
  - `prop-team-seat`
  - `prop-generic-campus-door`

## Cross-Campus Assets

### Avatar

- `avatar-body-premium-base`
- `avatar-body-shadow`
- `avatar-cap-campus`
- `avatar-pin-guide`
- `avatar-glasses-round`
- `avatar-shades-focus`
- `avatar-scarf-club`
- `avatar-medal-gold`
- `avatar-debate-badge`
- `avatar-writing-pencil`

### UI And Markers

- `ui-quest-marker-available`
- `ui-quest-marker-locked`
- `ui-quest-marker-complete`
- `ui-interaction-ring`
- `ui-room-transition-card`
- `ui-chat-bubble`
- `ui-map-pin-open`
- `ui-map-pin-shell`

## Completion Status

Functional now:

- Isolated `/alpaca-campus/` route.
- Multi-room Phaser campus with 24 rooms.
- Room-specific Supabase realtime channels.
- Presence, movement broadcast, chat, avatar updates, object events, and seat events.
- Real content previews for Alpacards, Alpaca Channel, Guides, Raw Content, Debate motions, Bowl stimuli, and question samples.
- Starter quests and avatar customization.
- Large-room scale and zoomed-out camera.
- Detailed premium asset brief and prompt pack.

Still a future pass:

- Embedding full production game engines inside room panels.
- Replacing procedural Phaser room drawings with generated premium backgrounds/props.
- Crowd-management UX for very large live events.
- Moderation backend for chat mute/report/profanity beyond the current safe-rendering placeholders.

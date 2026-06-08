# Alpaca Campus Premium Asset Generation Brief

This brief is for generating the visual asset set that will replace the current Phaser primitive shapes with a premium WSC school / college campus world.

## Global Art Direction

- Style: premium playful academic campus, polished 2D game environment, WSC / alpaca themed, non-childish, warm, clean, readable.
- Camera: top-down with slight three-quarter/isometric feeling. Keep floor plans readable for click-to-move.
- Lighting: soft daylight for outdoor/campus spaces, warm study lighting for library/classrooms, cinematic low light for cinema, dramatic but readable lighting for arenas.
- Palette: warm paper, teal, deep blue, muted gold, rose accent, natural wood, green campus landscaping. Avoid a one-color palette.
- Texture: subtle paper grain, soft brush detail, clean outlines, gentle ambient shadows.
- Characters: do not bake player alpacas into room backgrounds. NPC alpacas should be separate transparent props.
- Output format:
  - Room backgrounds: PNG or WebP, no UI text baked except environmental signage when requested.
  - Props: transparent PNG/WebP with alpha.
  - Content frames: transparent or isolated prop art, no baked copyrighted thumbnails unless they come from the app content itself.
- Composition rule: leave walkable floor visible and uncluttered. Props must not hide the player.
- Text rule: keep generated text minimal. For signs, prefer blank sign surfaces or simple large labels that can be overlaid by the app.

## Room Backgrounds

Generate one complete background for each room. Use the listed world size as the target canvas ratio. The app can scale assets later.

Important: the current playable campus uses a 1.65x larger world scale and a zoomed-out camera. For final generation canvas sizes and copy-paste prompts, use `ALPACA_CAMPUS_IMAGE_GENERATION_PROMPT_PACK.md`. The sizes below remain useful as base ratios and layout references.

| Asset ID | Target file | Size | Description |
|---|---:|---:|---|
| bg-campus-courtyard | assets/campus/backgrounds/campus-courtyard.png | 2400x1600 | Large outdoor arrival courtyard with school facade at north, central paths, open gathering circle, sports court left, swing area right, landscaped borders, premium WSC academy feel. Leave center and paths walkable. |
| bg-school-lobby | assets/campus/backgrounds/school-lobby.png | 1900x1250 | Grand indoor school lobby with reception desk, polished floor, north doors, side wing doors, WSC crest area, warm academic lighting. Door areas must be clear. |
| bg-learning-commons | assets/campus/backgrounds/learning-commons.png | 1900x1200 | Modern college learning commons with central help desk, collaborative tables, visible doors to lesson studio, mind map lab, museum, cinema, library, classroom. |
| bg-flashcard-museum | assets/campus/backgrounds/flashcard-museum.png | 1800x1120 | Museum/gallery room with clean walls, track lighting, two rows of framed exhibit spaces, subtle plaques, open walking floor. Frames should be blank/empty for real alpacard images. |
| bg-slideshow-studio | assets/campus/backgrounds/slideshow-studio.png | 1700x1080 | Classroom projection studio with large presentation screen, small teacher console, rows of seats, clean lecture-room feel. |
| bg-mind-map-lab | assets/campus/backgrounds/mind-map-lab.png | 1800x1120 | Concept mapping lab with central round table, glass boards, colored node diagrams, wall panels for subject/section/big idea lenses. |
| bg-alpaca-channel-cinema | assets/campus/backgrounds/alpaca-channel-cinema.png | 1800x1120 | Premium small cinema with large front screen, red/dark seats, side poster frames, control booth/selector area, readable aisle. |
| bg-raw-content-classroom | assets/campus/backgrounds/raw-content-classroom.png | 1650x1100 | Calm study classroom with board, teacher desk, student desks, side walls with raw content visual display frames. |
| bg-guiding-library-lounge | assets/campus/backgrounds/guiding-library-lounge.png | 2100x1360 | Warm library lounge with left and right shelving for 15 guide sections, central reading table, sofas/chairs, premium cozy lighting. |
| bg-games-hall | assets/campus/backgrounds/games-hall.png | 2000x1300 | WSC games hub with scoreboard wall, doors to game rooms, arcade-meets-school-competition hall, polished floor, bleachers. |
| bg-alpacapardy-hall | assets/campus/backgrounds/alpacapardy-hall.png | 1900x1200 | Jeopardy-style game hall with big category board area, host desk, team seating, stage lighting. Board cells should be blank for overlay. |
| bg-alpaca-run-track | assets/campus/backgrounds/alpaca-run-track.png | 2300x1350 | Outdoor/indoor training track named Road to the Cup, route signs for Regional, Global, ToC, start line, spectator stands. |
| bg-alpaca-jump-gym | assets/campus/backgrounds/alpaca-jump-gym.png | 1800x1120 | Gym obstacle course with soft mats, hurdles, jump lane, coach area, safety padding, school sports vibe. |
| bg-alpaquiz-relay-room | assets/campus/backgrounds/alpaquiz-relay-room.png | 1700x1080 | Buzz-first quiz lab with central buzz console, team tables left/right, scoreboard, timer lights. |
| bg-survivalpaca-arena | assets/campus/backgrounds/survivalpaca-arena.png | 1900x1220 | Dramatic timed arena with large clock, threshold gate, circular race area, dark premium challenge atmosphere. |
| bg-training-center | assets/campus/backgrounds/training-center.png | 1900x1250 | Tournament training hub with event doors for Writing, Debate, Bowl, Challenge, front desk, rubric board, prep benches. |
| bg-writing-studio | assets/campus/backgrounds/writing-studio.png | 1700x1080 | Collaborative writing studio with prompt board, large drafting table, notebooks, wall planning boards, calm creative atmosphere. |
| bg-debate-lab | assets/campus/backgrounds/debate-lab.png | 1800x1120 | Debate prep lab with motion wheel, PRO/CON prep board, case tables, doors to debate rooms, judge notes station. |
| bg-scholars-bowl-studio | assets/campus/backgrounds/scholars-bowl-studio.png | 1800x1120 | Media clue studio with large screen, question console, team seating, stimulus gallery wall, Bowl competition lighting. |
| bg-scholars-challenge-room | assets/campus/backgrounds/scholars-challenge-room.png | 1750x1100 | Solo Challenge practice room with desks, clock, bubble strategy board, quiet test-room atmosphere. |
| bg-grand-amphitheater | assets/campus/backgrounds/grand-amphitheater.png | 2200x1400 | Large event amphitheater with stage, big screen, rows of seats, polished WSC final-event mood, coming-soon shell. |
| bg-debate-room-1 | assets/campus/backgrounds/debate-room-1.png | 1500x980 | Small formal debate room with judge desk, three podium/seats per side, timer display, clear central floor. |
| bg-debate-room-2 | assets/campus/backgrounds/debate-room-2.png | 1500x980 | Variant of debate room 1 with slightly different color/accent, same layout. |
| bg-debate-room-3 | assets/campus/backgrounds/debate-room-3.png | 1500x980 | Variant of debate room 1 with slightly different color/accent, same layout. |

## Core Prop Set

Generate these transparent props as reusable objects. Each should include a soft contact shadow as a separate optional layer if possible.

| Asset ID | Target file | Suggested size | Used in | Prompt detail |
|---|---:|---:|---|---|
| prop-school-entrance-door | assets/campus/props/school-entrance-door.png | 220x150 | Courtyard | Large academy entrance door, teal/blue, gold trim, welcoming but premium. |
| prop-campus-ball | assets/campus/props/campus-ball.png | 96x96 | Courtyard | WSC campus sports ball, simple readable top-down ball, teal/gold accents. |
| prop-swing-set-frame | assets/campus/props/swing-set-frame.png | 620x260 | Courtyard | Six-seat swing frame, safe campus playground object, not childish, clean metal/wood. |
| prop-swing-seat | assets/campus/props/swing-seat.png | 88x70 | Courtyard | Single swing seat, transparent, readable from top-down angle. |
| prop-welcome-board | assets/campus/props/welcome-board.png | 260x140 | Courtyard/Lobby | Blank WSC notice board, wood/gold frame, teal header. |
| prop-information-desk | assets/campus/props/information-desk.png | 520x180 | Lobby | Reception desk with WSC crest, warm wood, no baked text. |
| prop-info-alpaca-npc | assets/campus/npcs/information-alpaca.png | 180x180 | Lobby | Friendly fixed alpaca NPC behind information desk, premium mascot look, transparent. |
| prop-coach-alpaca-npc | assets/campus/npcs/coach-alpaca.png | 180x180 | Lobby | Coach alpaca with whistle or clipboard, school club guide. |
| prop-door-learning | assets/campus/props/door-learning-wing.png | 190x130 | Lobby | Door sign/arch for Learning Wing, teal/gold academic style. |
| prop-door-games | assets/campus/props/door-games-hall.png | 190x130 | Lobby | Door sign/arch for Games Hall, energetic but premium. |
| prop-door-training | assets/campus/props/door-training-center.png | 190x130 | Lobby | Door sign/arch for Training Center, tournament preparation style. |
| prop-generic-campus-door | assets/campus/props/generic-campus-door.png | 190x130 | Many rooms | Reusable interior room door with blank sign plate. |
| prop-study-seat | assets/campus/props/study-seat.png | 90x80 | Learning/Training | Single chair/study seat, warm wood, readable at small size. |
| prop-lounge-chair | assets/campus/props/lounge-chair.png | 105x90 | Library | Soft library lounge chair, warm fabric, premium. |
| prop-bench | assets/campus/props/bench.png | 140x75 | Games/Gym/Training | School bench/bleacher seat. |
| prop-team-seat | assets/campus/props/team-seat.png | 95x85 | Game rooms | Team competition chair/podium seat. |
| prop-desk-seat | assets/campus/props/desk-seat.png | 95x85 | Classroom/Challenge | Single desk and chair, exam room angle. |

## Content Display Props

These props should be blank containers because the app overlays real WSC images, thumbnails, titles, and guide text.

| Asset ID | Target file | Suggested size | Used in | Prompt detail |
|---|---:|---:|---|---|
| prop-museum-frame-large | assets/campus/props/museum-frame-large.png | 220x150 | Flashcard Museum | Premium gallery frame with blank inner image space, small plaque space below. |
| prop-museum-frame-small | assets/campus/props/museum-frame-small.png | 180x125 | Museum variants | Smaller gallery frame, same style. |
| prop-cinema-screen | assets/campus/props/cinema-screen.png | 700x220 | Cinema/Bowl | Large blank cinema screen with subtle glow, no text. |
| prop-cinema-poster-frame | assets/campus/props/cinema-poster-frame.png | 220x150 | Cinema | Poster display frame with blank inner thumbnail area. |
| prop-raw-content-frame | assets/campus/props/raw-content-frame.png | 220x145 | Classroom | Classroom visual card frame for raw content images. |
| prop-guide-shelf-card | assets/campus/props/guide-shelf-card.png | 180x100 | Library | Shelf face/card for one guide section, blank title strip. |
| prop-big-idea-board | assets/campus/props/big-idea-board.png | 260x145 | Lobby/Labs | Blank concept board with sticky-note zones. |
| prop-syllabus-board | assets/campus/props/syllabus-board.png | 260x145 | Lobby | Blank syllabus board with subject color bands, no small text. |
| prop-route-board | assets/campus/props/route-board.png | 280x150 | Slideshow/Run | Board for path progression, blank nodes/route line. |
| prop-mind-map-table | assets/campus/props/mind-map-table.png | 560x260 | Mind Map Lab | Central table with blank glowing node map surface. |
| prop-buzz-console | assets/campus/props/buzz-console.png | 360x180 | Relay/Bowl | Team quiz buzzer console, buttons visible, blank display. |
| prop-scoreboard | assets/campus/props/scoreboard.png | 500x180 | Games Hall | Blank scoreboard with team columns and WSC framing. |
| prop-timer-display | assets/campus/props/timer-display.png | 360x130 | Debate/Challenge/Survival | Large blank digital timer/clock display. |
| prop-motion-wheel | assets/campus/props/motion-wheel.png | 430x180 | Debate Lab | Debate motion spinner/wheel, blank center, PRO/CON colors. |
| prop-writing-table | assets/campus/props/writing-table.png | 540x230 | Writing Studio | Collaborative table with notebooks, pencils, blank prompt cards. |
| prop-bowl-question-console | assets/campus/props/bowl-question-console.png | 380x150 | Bowl Studio | Media clue control desk, blank screen, buttons. |
| prop-challenge-bubble-board | assets/campus/props/challenge-bubble-board.png | 280x160 | Challenge Room | Strategy board showing blank multi-bubble answer patterns. |

## Room-Specific Hero Props

These are larger pieces that define the room identity.

| Asset ID | Target file | Suggested size | Room | Prompt detail |
|---|---:|---:|---|---|
| hero-courtyard-school-building | assets/campus/hero/school-building.png | 1200x430 | Courtyard | WSC academy facade, teal roof/trim, gold accents, central door area, transparent foreground edge. |
| hero-courtyard-gathering-circle | assets/campus/hero/gathering-circle.png | 430x320 | Courtyard | Circular outdoor meeting plaza, subtle WSC crest pattern, walkable surface. |
| hero-courtyard-sports-court | assets/campus/hero/sports-court.png | 620x410 | Courtyard | Basketball/soccer hybrid practice court, clean white markings, premium school sports look. |
| hero-lobby-reception-zone | assets/campus/hero/lobby-reception-zone.png | 620x260 | School Lobby | Reception desk, information wall, polished lobby material. |
| hero-alpacapardy-board | assets/campus/hero/alpacapardy-board.png | 850x300 | Alpacapardy Hall | Jeopardy-style category board with blank cells, stage frame, no text. |
| hero-run-route-track | assets/campus/hero/run-route-track.png | 1200x520 | Alpaca Run Track | Curving track with checkpoint banners for Regional/Global/ToC but leave label areas blank. |
| hero-jump-obstacle-course | assets/campus/hero/jump-obstacle-course.png | 950x300 | Alpaca Jump Gym | Soft obstacle lane with hurdles, low barriers, landing mats. |
| hero-survival-threshold-gate | assets/campus/hero/survival-threshold-gate.png | 700x260 | Survivalpaca Arena | Dramatic threshold gate, timer lights, no text. |
| hero-training-events-board | assets/campus/hero/training-events-board.png | 440x180 | Training Center | Board showing four tournament-event quadrants with blank label zones. |
| hero-grand-amphi-stage | assets/campus/hero/grand-amphi-stage.png | 1180x330 | Grand Amphitheater | Main stage, big blank screen, WSC final event atmosphere. |

## NPCs

Generate each NPC as a separate transparent PNG, full body, facing slightly downward/front, no background.

| Asset ID | Target file | Size | Personality |
|---|---:|---:|---|
| npc-information-alpaca | assets/campus/npcs/information-alpaca.png | 256x256 | Calm receptionist with small badge or headset. |
| npc-coach-alpaca | assets/campus/npcs/coach-alpaca.png | 256x256 | Energetic school club coach with clipboard. |
| npc-learning-alpaca | assets/campus/npcs/learning-alpaca.png | 256x256 | Helpful librarian/tutor alpaca with glasses or book. |
| npc-games-host-alpaca | assets/campus/npcs/games-host-alpaca.png | 256x256 | Competition host with microphone/card. |
| npc-jump-coach | assets/campus/npcs/jump-coach.png | 256x256 | Sports coach alpaca, whistle, friendly. |
| npc-training-director | assets/campus/npcs/training-director.png | 256x256 | Tournament prep director with rubric clipboard. |
| npc-judge-alpaca | assets/campus/npcs/judge-alpaca.png | 256x256 | Formal judge for debate rooms, calm and authoritative. |

## Avatar Cosmetic Assets

Transparent overlays aligned to the current alpaca body.

| Asset ID | Target file | Size | Detail |
|---|---:|---:|---|
| avatar-body-premium-base | assets/campus/avatar/body-base.png | 256x256 | Neutral cream alpaca body, top-down/front hybrid, replace procedural body. |
| avatar-body-shadow | assets/campus/avatar/body-shadow.png | 256x256 | Soft floor shadow. |
| avatar-cap-campus | assets/campus/avatar/accessory-cap-campus.png | 256x256 | Teal/gold campus cap. |
| avatar-pin-guide | assets/campus/avatar/accessory-pin-guide.png | 256x256 | Small guide pin. |
| avatar-glasses-round | assets/campus/avatar/accessory-glasses-round.png | 256x256 | Round glasses. |
| avatar-shades-focus | assets/campus/avatar/accessory-shades-focus.png | 256x256 | Focus shades. |
| avatar-scarf-club | assets/campus/avatar/accessory-scarf-club.png | 256x256 | Club scarf. |
| avatar-medal-gold | assets/campus/avatar/accessory-medal-gold.png | 256x256 | Gold medal necklace. |

## UI And Marker Assets

These are small SVG or PNG UI items for the DOM/Phaser overlay.

| Asset ID | Target file | Size | Detail |
|---|---:|---:|---|
| ui-quest-marker-available | assets/campus/ui/quest-marker-available.svg | 96x40 | Gold quest label, blank text slot. |
| ui-quest-marker-locked | assets/campus/ui/quest-marker-locked.svg | 96x40 | Muted locked label. |
| ui-quest-marker-complete | assets/campus/ui/quest-marker-complete.svg | 96x40 | Green complete label. |
| ui-interaction-ring | assets/campus/ui/interaction-ring.svg | 160x120 | Soft teal hover/interaction ring. |
| ui-room-transition-card | assets/campus/ui/room-transition-card.png | 640x220 | Soft card background for room transition toast. |
| ui-chat-bubble | assets/campus/ui/chat-bubble.svg | 320x140 | White chat bubble with tail. |
| ui-map-pin-open | assets/campus/ui/map-pin-open.svg | 48x48 | Campus map open room pin. |
| ui-map-pin-shell | assets/campus/ui/map-pin-shell.svg | 48x48 | Campus map coming-soon/shell pin. |

## Generation Prompt Template

Use this base prompt for each asset, then append the room/object-specific detail:

```
Premium 2D browser game asset for a WSC alpaca school campus, warm academic style, polished playful but not childish, top-down with slight three-quarter perspective, clean readable shapes, soft ambient shadows, teal deep blue muted gold warm paper palette, subtle texture, no UI overlay, no tiny unreadable text, no characters unless requested, transparent background for props.
```

Negative prompt:

```
childish cartoon, messy collage, dark blurry stock photo, neon cyberpunk, one-color purple palette, excessive gradients, illegible text, photorealistic humans, cluttered walkable floor, warped perspective, low resolution, watermark, logo, copyrighted character.
```

## Implementation Notes For Codex

- Keep room backgrounds and props separate so Phaser can position interactive objects independently.
- Do not bake app content images into generated room backgrounds. The app already overlays real alpacards, YouTube thumbnails, guide imagery, and raw content images.
- Use stable filenames from this brief so `rooms.js` can later gain an asset manifest without changing room IDs.
- Each generated room should leave enough empty floor for click-to-move and multiplayer alpacas.
- Every visible door/portal should have a matching transparent prop and a matching room ID in `rooms.js`.

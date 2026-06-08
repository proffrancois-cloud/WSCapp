# Alpaca Campus Image Generation Prompt Pack

This file is the copy-paste prompt source for turning the current Alpaca Campus prototype into a premium WSC school / college world. Use it with the asset inventory in `ALPACA_CAMPUS_PREMIUM_ASSET_BRIEF.md`.

## Master Style Lock

Use this at the beginning of every prompt:

```text
Premium 2D browser game asset for a World Scholar's Cup alpaca school campus, polished playful academic style, non-childish, warm and elegant, top-down with a slight three-quarter/isometric angle, clean readable shapes, soft ambient shadows, subtle paper texture, hand-painted but crisp, high-end educational game environment, warm paper + teal + deep blue + muted gold + rose accent + natural wood palette, no neon, no one-color palette, no messy collage, no photorealistic humans, no watermark, no UI overlay.
```

Use this negative prompt every time:

```text
childish cartoon, babyish mascot style, messy collage, photorealistic people, stock photo, dark blurry render, excessive gradients, neon cyberpunk, purple-dominated palette, beige-only palette, cluttered floor, tiny unreadable text, warped perspective, low resolution, watermark, logo, copyrighted character, UI buttons, screenshots, visible browser chrome, player avatars baked into background.
```

## Global Composition Rules

- Room backgrounds must contain the environment only. Do not include movable player alpacas.
- NPCs must be separate transparent PNGs, never baked into the background.
- Content frames must be blank. The app overlays real alpacards, YouTube thumbnails, guide cards, and raw content images.
- Generate rooms for a large multiplayer campus, not a small demo room. The current implementation scales prototype room coordinates by 1.65x and uses a zoomed-out camera.
- Keep at least 55 percent of each room as visibly walkable floor so rooms can support crowded social use.
- Keep doorways, seats, wall displays, screens, and boards visually obvious from a small game camera.
- Avoid tiny generated writing. Use blank sign plates, big symbolic shapes, or very short large labels only when requested.
- All backgrounds should feel like parts of the same campus: same flooring language, same teal/gold trim, same warm academic lighting, same slightly textured paper/game art finish.
- Room perspective must be consistent: top is north/back wall, bottom is entrance/spawn side, side walls visible enough to place exhibits and shelves.

## Room Background Prompt Formula

Use this formula, then append the room-specific detail below:

```text
[MASTER STYLE LOCK]

Create a full-room background, canvas [SIZE], top-down three-quarter view. North/back wall at the top, entrance/spawn area toward the bottom. No characters, no UI, no player alpacas. Leave wide clean walkable floor paths. Include blank interactive surfaces where the app will overlay real content. Make this look like a premium WSC college campus room, cohesive with the rest of the asset set.

Room-specific detail: [ROOM PROMPT]
```

## Final Room Canvas Sizes

Use these final scaled sizes for generation. They are intentionally large because the campus should support 300+ users across the whole environment and the camera now sits farther back.

| Room | Final canvas |
|---|---:|
| Campus Courtyard | 3960x2640 |
| School Lobby | 3135x2063 |
| Learning Commons | 3135x1980 |
| Flashcard Museum | 2970x1848 |
| Slideshow Studio | 2805x1782 |
| Mind Map Lab | 2970x1848 |
| Alpaca Channel Cinema | 2970x1848 |
| Raw Content Classroom | 2723x1815 |
| Guiding Library Lounge | 3465x2244 |
| Games Hall | 3300x2145 |
| Alpacapardy Hall | 3135x1980 |
| Alpaca Run Track | 3795x2228 |
| Alpaca Jump Gym | 2970x1848 |
| Alpaquiz Relay Room | 2805x1782 |
| Survivalpaca Arena | 3135x2013 |
| Training Center | 3135x2063 |
| Writing Studio | 2805x1782 |
| Debate Lab | 2970x1848 |
| Scholar's Bowl Studio | 2970x1848 |
| Scholar's Challenge Room | 2888x1815 |
| Grand Amphitheater | 3630x2310 |
| Debate Room 1 | 2475x1617 |
| Debate Room 2 | 2475x1617 |
| Debate Room 3 | 2475x1617 |

## Room Background Prompts

### Campus Courtyard

Target: `assets/campus/backgrounds/campus-courtyard.png`, 3960x2640.

```text
Large outdoor arrival courtyard for the WSC Alpaca Campus. North side has an elegant school facade with teal roof/trim, gold accents, central academy entrance door, and clear path leading to it. Center has a broad open gathering plaza with subtle compass/crest pattern, no text. Left side has a clean sports court area for a simple ball interaction, with white court markings and enough empty space around it. Right side has a six-swing area with frame footprint and safe clear floor. Add landscaped borders, stone paths, warm daylight, premium college atmosphere. Do not include players. Keep the entrance, court, swings, and gathering area readable at small scale.
```

### School Lobby

Target: `assets/campus/backgrounds/school-lobby.png`, 3135x2063.

```text
Grand indoor school lobby and main hub. North wall has multiple clearly separated doorways with blank sign plates above each door. Center-top has a polished reception/information desk area, but no NPC baked in. Flooring is warm stone or wood with subtle WSC-style teal and gold accents. Include side wing entrances for Learning Wing, Games Hall, and Training Center. Leave a broad central walking area and clear door approach zones. Premium academic, welcoming, not childish.
```

### Learning Commons

Target: `assets/campus/backgrounds/learning-commons.png`, 3135x1980.

```text
Modern college learning commons that acts as the Learn path hub. Include collaborative study tables, a central help desk, wall signs or blank panels for Slideshow Studio, Mind Map Lab, Flashcard Museum, Alpaca Channel Cinema, Guiding Library, and Raw Content Classroom. Use warm study lighting, teal/gold academic accents, comfortable but organized layout. Keep doors readable and leave wide walkable aisles.
```

### Flashcard Museum

Target: `assets/campus/backgrounds/flashcard-museum.png`, 2970x1848.

```text
Elegant museum/gallery room for alpacard flashcards. North and side walls show two rows of blank premium frames and small blank plaque strips. Track lighting highlights the frames. Floor is calm polished stone with a wide central walking corridor. Do not include any actual artwork in the frames; the app overlays real flashcard images. The room should feel like a serious gallery adapted for a playful academic campus.
```

### Slideshow Studio

Target: `assets/campus/backgrounds/slideshow-studio.png`, 2805x1782.

```text
Lesson projector room for Slideshow Lesson mode. Front wall has a large blank presentation screen, a small teacher console, and rows of lecture seats. Include subtle route/progression motifs on side boards without readable tiny text. Calm, focused classroom lighting, premium school style, wide aisles for walking.
```

### Mind Map Lab

Target: `assets/campus/backgrounds/mind-map-lab.png`, 2970x1848.

```text
Concept mapping lab for Mind Map mode. Center has a large round or oval table with a blank glowing map surface and node/line motifs. Side walls include glass boards with abstract subject, section, and big-idea node diagrams, but no readable text. Scientific/creative study lab feeling, warm academic palette, clear walking ring around central table.
```

### Alpaca Channel Cinema

Target: `assets/campus/backgrounds/alpaca-channel-cinema.png`, 2970x1848.

```text
Small premium campus cinema for Alpaca Channel. Front wall has a large blank cinema screen, side walls have blank poster frames for video thumbnails, and floor has rows of red or deep rose theater seats with aisles. Include a small control booth or selector area. Lighting is cinematic but readable. Do not show actual video stills or YouTube UI; the app overlays thumbnails and embeds.
```

### Raw Content Classroom

Target: `assets/campus/backgrounds/raw-content-classroom.png`, 2723x1815.

```text
Calm study classroom for raw WSC content. Front has a large blank board and teacher desk. Side walls have blank visual display frames where raw content images can be overlaid. Include student desks and chairs, notebooks, warm daylight, study-focused mood. Keep floor paths clear between desks and display frames.
```

### Guiding Library Lounge

Target: `assets/campus/backgrounds/guiding-library-lounge.png`, 3465x2244.

```text
Warm premium library lounge for the 15 guiding sections. Left and right walls have 15 clear shelf/display positions, each with a blank title strip or card surface. Center has a reading table, sofas, comfortable chairs, warm lamps, and quiet study atmosphere. Make it the most inviting Learn room in the campus. Keep shelf approaches and center floor walkable.
```

### Games Hall

Target: `assets/campus/backgrounds/games-hall.png`, 3300x2145.

```text
WSC games hub for the Play path. Large scoreboard wall, doors to five game rooms, bleacher seating, polished competition floor, arcade-meets-school-tournament energy but still premium and academic. Include blank scoreboard cells and blank room signs. Keep central floor open for groups.
```

### Alpacapardy Hall

Target: `assets/campus/backgrounds/alpacapardy-hall.png`, 3135x1980.

```text
Jeopardy-style game hall for Alpacapardy. Front has a large blank category board with clear tile grid, host desk below it, team seating areas, stage lighting, and a classroom competition atmosphere. Do not write category text or scores into the image. Keep board and host desk visually dominant.
```

### Alpaca Run Track

Target: `assets/campus/backgrounds/alpaca-run-track.png`, 3795x2228.

```text
Road to the Cup track room for Alpaca Run. Large readable running track with start line, route checkpoint zones, spectator stands, and blank banners for Regional, Global, and Tournament of Champions labels. Can be indoor/outdoor hybrid. Make it dynamic but keep the track walkable and uncluttered.
```

### Alpaca Jump Gym

Target: `assets/campus/backgrounds/alpaca-jump-gym.png`, 2970x1848.

```text
School sports gym for Alpaca Jump. Include soft mats, hurdles, low barriers, jump lane, safety padding, coach corner, benches, and warm gym lighting. Keep obstacle shapes readable but do not overfill the floor. Premium campus athletics, not childish playground.
```

### Alpaquiz Relay Room

Target: `assets/campus/backgrounds/alpaquiz-relay-room.png`, 2805x1782.

```text
Buzz-first quiz relay room. Center has a blank buzzer console, left and right team tables, front scoreboard/timer wall, subtle colored team accents, and clear aisles. Competition room for quick team answering, polished school tournament style. No tiny written questions.
```

### Survivalpaca Arena

Target: `assets/campus/backgrounds/survivalpaca-arena.png`, 3135x2013.

```text
Dramatic timed arena for Survivalpaca. Include a large blank clock/timer display, threshold gate, circular or rectangular challenge floor, side seating, and controlled dramatic lighting. It should feel intense but still readable and premium, not horror or neon.
```

### Training Center

Target: `assets/campus/backgrounds/training-center.png`, 3135x2063.

```text
Tournament training hub for Train path. North wall has four clear event doorways for Writing, Debate, Bowl, and Challenge. Center has front desk or event director station, rubric board, prep benches, and competition preparation mood. Warm academic palette, clean layout, wide walkable center.
```

### Writing Studio

Target: `assets/campus/backgrounds/writing-studio.png`, 2805x1782.

```text
Collaborative writing room. Include a large drafting table, notebooks, pencils, prompt board, wall planning boards, sticky-note zones, and calm creative lighting. It should feel like a serious writing workshop for teams, not a generic classroom. Keep table approach and seats clear.
```

### Debate Lab

Target: `assets/campus/backgrounds/debate-lab.png`, 2970x1848.

```text
Debate preparation lab. Include a motion wheel, PRO/CON prep board, case tables, judge notes station, and doors to three small debate rooms. Use balanced team colors without looking like a sports locker room. Clear central prep floor and visible discussion zones.
```

### Scholar's Bowl Studio

Target: `assets/campus/backgrounds/scholars-bowl-studio.png`, 2970x1848.

```text
Stimulus-first media studio for Scholar's Bowl. Front has a large blank media screen, question console, team seating, small stimulus gallery wall, and competition lighting. It should feel like a smart quiz broadcast studio inside a school. Do not include actual media stills; blank surfaces only.
```

### Scholar's Challenge Room

Target: `assets/campus/backgrounds/scholars-challenge-room.png`, 2888x1815.

```text
Solo Challenge practice room. Include rows of desks, front blank clock/timer display, bubble strategy board, calm test-room atmosphere, and quiet focus lighting. It should feel disciplined but not stressful. Keep aisles clear between desks.
```

### Grand Amphitheater

Target: `assets/campus/backgrounds/grand-amphitheater.png`, 3630x2310.

```text
Large event amphitheater shell for Scholar's Ball, finals, and campus-wide events. Include a grand stage, large blank screen, curved rows of seats, warm dramatic lighting, and premium WSC final-event mood. It should read as locked/coming soon through atmosphere and blank event signage, but no UI labels.
```

### Debate Rooms 1, 2, 3

Target:
- `assets/campus/backgrounds/debate-room-1.png`, 2475x1617
- `assets/campus/backgrounds/debate-room-2.png`, 2475x1617
- `assets/campus/backgrounds/debate-room-3.png`, 2475x1617

```text
Small formal debate room with judge desk at the front, three seats or podiums on the left team side, three seats or podiums on the right team side, blank timer display, clear central speaking floor, and calm academic formality. Make each version a subtle variant with different accent colors or wall decor, but keep identical layout logic for gameplay.
```

## Transparent Prop Prompt Formula

Use this for props and NPCs:

```text
[MASTER STYLE LOCK]

Create a single transparent PNG prop for a 2D top-down three-quarter browser game. Isolated object only, alpha background, soft contact shadow, same WSC campus palette and material language. No room background, no UI, no player character. Object must be readable at small size.

Prop-specific detail: [PROP DETAIL]
```

## Priority Prop Prompts

Use these first, because they will replace the most obvious procedural shapes.

```text
Large academy entrance door, teal/deep blue panels, muted gold trim, warm wood details, welcoming but premium, blank sign plate above door, transparent PNG, readable from top-down three-quarter view.
```

```text
Six-seat swing set frame for a college courtyard, elegant metal and wood construction, not childish, six separate hanging seats visible, soft contact shadow, transparent PNG, top-down three-quarter angle.
```

```text
Single swing seat, warm wood and teal rope/chain accents, transparent PNG, readable at small size, soft contact shadow.
```

```text
WSC campus sports ball, simple readable top-down ball, cream base with teal and muted gold accent panels, transparent PNG, soft contact shadow.
```

```text
Premium gallery frame with blank inner image area and small blank plaque strip below, warm wood and muted gold frame, transparent PNG. Do not include artwork.
```

```text
Large blank cinema screen with subtle glow and deep blue frame, no video still, no UI, transparent PNG.
```

```text
Blank classroom/raw-content visual frame, warm wood and paper surface, small blank caption strip, transparent PNG.
```

```text
Guide shelf display card for a library wall, warm wood shelf face with blank title strip and small icon plaque area, transparent PNG.
```

```text
Blank WSC syllabus board with teal header, muted gold trim, subject color band shapes but no readable text, transparent PNG.
```

```text
Blank big-idea board with sticky-note zones, route arrows, teal/gold academic frame, no readable text, transparent PNG.
```

```text
Jeopardy-style blank category board, five columns by five rows suggested by empty tiles, deep blue board with muted gold trim, no text or scores, transparent PNG.
```

```text
Quiz buzzer console with multiple colored buzz buttons, blank display screen, polished school tournament style, transparent PNG.
```

```text
Large blank digital timer display, deep blue casing, warm gold trim, no numbers, transparent PNG.
```

```text
Debate motion wheel, circular spinner, balanced PRO and CON color zones, blank center label, polished academic prop, transparent PNG.
```

```text
Collaborative writing table with notebooks, paper stacks, pencils, blank prompt cards, warm wood, transparent PNG, no readable writing.
```

## NPC Prompt Formula

NPCs should be separate assets so the app can place them exactly.

```text
[MASTER STYLE LOCK]

Create one full-body alpaca NPC, transparent PNG, facing slightly downward/front for a top-down three-quarter 2D game, soft contact shadow, premium WSC campus mascot style, expressive but not childish, no background, no UI, no text.

NPC detail: [NPC DETAIL]
```

NPC details:

- Information Alpaca: calm receptionist with small badge or headset, helpful, composed, maybe holding a clipboard.
- Coach Alpaca: energetic school club coach with clipboard and whistle, welcoming, slightly sporty.
- Learning Alpaca: tutor/librarian with glasses and book, warm and clever.
- Games Host Alpaca: competition host with microphone or cue cards, lively but polished.
- Jump Coach: sports coach with whistle and training clipboard.
- Training Director: tournament prep director with rubric clipboard and formal badge.
- Judge Alpaca: formal debate judge, calm, authoritative, at-home behind a judge desk.

## Avatar Cosmetic Prompt Formula

```text
[MASTER STYLE LOCK]

Create a transparent overlay asset aligned for a 256x256 alpaca avatar sprite, front/top-down hybrid view, no background, no shadow unless requested, clean readable shape at small size.

Cosmetic detail: [COSMETIC DETAIL]
```

Cosmetic details:

- Teal/gold campus cap.
- Small guide pin or scholar pin.
- Round glasses.
- Focus shades.
- Club scarf in teal/gold.
- Gold medal necklace.
- Debate badge.
- Writing pencil tucked behind ear.

## UI Marker Prompt Formula

Prefer SVG for these if possible.

```text
Premium WSC Alpaca Campus UI marker, simple vector-like shape, transparent background, warm paper + teal + muted gold palette, readable at small size, blank text area, no icons that look childish, no gradients that dominate.
```

Marker details:

- Available quest marker: gold label with blank text slot.
- Locked marker: muted brown/gray label with small lock icon, blank text slot.
- Completed marker: teal/green label with check icon, blank text slot.
- Interaction ring: soft teal oval ring with subtle glow, transparent center.
- Campus map pin open: teal pin with gold dot.
- Campus map pin shell: muted gold/gray pin with small lock or clock.
- Chat bubble: warm white bubble with subtle shadow and tail.

## Quality Gate For Generated Assets

Accept an asset only if all answers are yes:

- Does it match the same camera angle as the rest of the campus?
- Is the walkable floor still clear?
- Are content frames blank and ready for app overlays?
- Is the asset readable at game scale?
- Are there no baked player alpacas in room backgrounds?
- Are there no tiny unreadable words?
- Does it avoid a childish mascot/playground tone?
- Does it avoid looking like a stock illustration collage?
- Does it feel premium, academic, playful, and WSC-compatible?

## Batch Generation Order

1. Generate the 24 room backgrounds as environment plates.
2. Generate the 15 highest-priority props listed above.
3. Generate NPCs.
4. Generate avatar cosmetic overlays.
5. Generate UI markers.
6. Only after the style is approved, generate variant props and decorative extras.

## Important Implementation Note

The current app should continue to overlay actual WSC content inside blank frames:

- Flashcard Museum: real alpacard images.
- Alpaca Channel Cinema: real video thumbnails and embeds.
- Guiding Library Lounge: real guide section cards and images.
- Raw Content Classroom: real raw content images.
- Game and Train rooms: mode shells connected to existing app mode definitions.

Do not generate copyrighted artwork or video thumbnails into room backgrounds. Generate the frame, wall, screen, or display system; the app supplies the content.

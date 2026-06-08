# WSC Master Audit: Alpaca Campus 3D

Date: 2026-05-27
Role: WSC Master
Scope: first five-room 3D slice only: School Lobby, Library, Museum, Debate Room, and Games Hall.

## Role Statement

WSC Master protects content fidelity. The 3D campus should feel like a World Scholar's Cup learning and practice environment connected to the existing solo mode, not a generic school scene with WSC labels. For this audit, I checked whether surfaces, rooms, and activity contracts map back to the existing solo-mode content bridge, WSC Learn/Play/Train paths, guide structure, Alpacards, Alpaca Channel videos, Debate Lab material, and WSC-style team activity flow.

## Summary Judgment

The first slice has a real WSC spine: the five-room contract uses the same path/mode language as solo mode, panels resolve through `WSC_ALPACA_CAMPUS_CONTENT`, and the 3D UI opens content/API-backed panel data instead of duplicating long payloads. This is good enough as a first playable shell if it is presented as a content-connected prototype.

The main fidelity risk is visibility mismatch. Some WSC concepts are defined in `content-surfaces.ts` and `asset-manifest.ts` but are not all present as first-five runtime room objects in the current 2D room data slice. Museum video and slideshow surfaces are the clearest example: they are contracted and asset-planned, but the runtime Museum object list currently exposes only Alpacard exhibits unless the 3D scene has separate authored nodes for them.

## Findings By Room

### School Lobby

- Good enough: The lobby is WSC-specific through the Information Alpaca, room dock, and direct routing to Library, Museum, Debate Room, and Games Hall. The Information Alpaca resolves to "Campus Updates" and links to the official WSC site through the content bridge.
- Good enough: In the first-five slice, the lobby is simplified from the full 2D campus to avoid drowning the user. That is acceptable for first playable because it creates a clean hub.
- Missing content connection: The first-five 3D slice removes the Syllabus Board and Big Ideas Board that exist in the broader 2D campus. Those boards are strong WSC anchors. If the lobby starts feeling generic, restore at least one compact syllabus/big-ideas surface.

### Museum

- Good enough: Alpacard exhibits are faithful. `flashcard-exhibit-*` objects map to the existing `flashcards` panel and `getAlpacardWorldCard`, showing title, creator/year/category metadata, image source, summary, and source link where available.
- WSC fidelity blocker before sprint close: Museum video and slideshow surfaces are contracted in `content-surfaces.ts` as `museum-video-surface` and `museum-slideshow-surface`, and they are also required/dynamic surfaces in the asset manifest. The current source room data for `flashcard-museum` shows ten Alpacard exhibit objects but does not show those two item IDs. If the 3D runtime depends on room object IDs for interaction, video and slideshow will not be visible/openable.
- Placement recommendation: Keep the Alpacard frames as the main gallery row, put slideshow on a larger lesson wall, and put video on a distinct cinema-style screen or alcove. This avoids confusing Alpacards, Alpaca Channel, and Slideshow Lesson as the same media type.
- Fidelity note: It is acceptable for Museum to include Alpacards plus "featured media" for first playable, but labels and panels must make clear that Alpacards are recognition cards, Alpaca Channel is video/media, and Slideshow is a lesson progression mode.

### Library

- Good enough: The Library is the strongest WSC content room. Guide shelves are generated from `getRegularGuides()` count, fall back to fifteen shelves matching the current guiding-section count, and open `guide-section` panels by `sectionIndex`.
- Good enough: Separation is mostly faithful: shelves are guiding sections, the help desk/reading table/book cart open the broader `library` panel, and `getGuideSectionPanel` can show one selected guide plus section atoms/reference concepts.
- Missing clarity: The runtime UI labels the broader panel as "Library Wall", while shelves open specific guiding sections. First playable should visually separate "specific guide shelf" from "reference/help desk" so users do not think every object opens the same guide.
- Next fidelity fix: Add explicit visual categories for "Guiding Sections", "Reference / Help Desk", and "Reading Table". This can be art/layout first, without changing content contracts.

### Debate Room

- Good enough: The activity contract understands the right WSC shape: proposition, opposition, moderator/judge/timekeeper, researchers, spectators, whiteboard, lectern, and visible seat groups. Seat occupancy is room-scoped and already smoke-tested.
- Good enough for first playable: The table setup is close enough for a first multiplayer classroom: proposition and opposition front/support groups, neutral flow table, moderator desk, speaker lectern, whiteboard, and spectator row.
- WSC fidelity gap: The solo-mode Debate Lab has motion selection, side draw, clash card, speaker jobs for three speakers, argument quality, rebuttals, judge prep, exchanges, and feedback. The 3D Debate Room currently surfaces role/seat structure and a generic Judge Desk panel, not the full debate sequence.
- Required before calling it a real debate engine: One debate/table active state, motion/topic selection, PRO/CON assignment, prep phase, ordered speeches, timers, active-speaker indication, judge feedback, and result/notes flow.
- Terminology note: The contract uses proposition/opposition, while solo mode uses PRO/CON. Both are understandable, but the UI should show both where useful: "Proposition / PRO" and "Opposition / CON".

### Games Hall

- Good enough: The Games Hall is correctly contextualized as the Play Path. Arcade launches map to solo play modes: Alpacapardy (`jeopardy`), Alpaca Run (`run`), Alpaca Jump (`jump`), Alpaquiz (`relay`), and Survivalpaca (`race`).
- Good enough: Launch links currently go to the existing app with `../?path=play&mode=...`, which is a faithful solo-mode bridge for first playable.
- WSC fidelity blocker before live multiplayer: Do not present these as live multiplayer games yet. Only Alpacapardy has a placeholder live session contract, and even that needs host, board state, category/question selection, team buzz/answer flow, scoring, spectators, reconnect behavior, and result persistence policy before it is live.
- Next fix: Label deferred games as "solo bridge" or "preview" in UI, and reserve "live" for activities that have a real shared-state engine and tested seat/session rules.

## Cross-Room WSC Context

- The strongest WSC-specific signals are the path/mode taxonomy: Learn Path, Play Path, Train Path, Slideshow Lesson, Guide, Alpacard, Alpaca Channel, Debate Lab, Scholar's Bowl, Scholar's Challenge, and Collaborative Writing.
- The campus remains context-aware because content panels resolve from existing runtime/window APIs: `WSC_DATA`, `WSC_KNOWLEDGE_BANK`, `WSC_RAW_CONTENT_BANK`, `WSC_ALPACARDS`, `WSC_ALPACA_CHANNEL`, and `WSC_DEBATE_LAB_DATA`.
- The first five rooms should keep using dynamic surfaces. Do not bake guide titles, cards, videos, debate motions, or scores into GLBs or static textures.
- The generic-risk areas are any room with only furniture and no visible WSC surface: empty tables, generic whiteboards, and arcade cabinets without mode labels can quickly read as random school scenery.

## Required Collaborations

### Taylor connector

- Confirm every first-five interactable object has a matching content surface or an intentional placeholder.
- Resolve the Museum mismatch for `museum-video-surface` and `museum-slideshow-surface`: either add runtime objects through the owning integrator path or downgrade them in the first playable contract until visible.
- Add a small panel taxonomy note or labels so Library surfaces clearly distinguish guide shelves from general reference/help surfaces.

### Ira jeux dans jeu

- Turn Debate Room from role seating into debate flow: motion selection, side assignment, prep, ordered speeches, timer/progress, judge feedback, and result.
- Define when a debate room can host exactly one active debate versus multiple table sets.
- Keep Games Hall launch contracts honest: solo bridge, placeholder live session, or live multiplayer must be distinct states.

### Robin architecte

- Verify Museum has physical room space for three distinct content types: Alpacard exhibit frames, slideshow wall, and video screen.
- Verify Debate Room physical layout supports actual WSC debate flow: proposition and opposition sides face clearly, judge/moderator area sees both teams, lectern/active speaker zone is obvious, spectators are behind or to the side.
- Keep first-five routing simple, but preserve enough WSC signposting that the lobby feels like a tournament campus hub.

### Sidi Yahya artist 3d

- Provide stable dynamic surface nodes for all content surfaces, especially Museum slideshow/video and Library shelf nodes.
- Do not bake WSC text, guide titles, Alpacard content, videos, debate motions, or game scores into meshes.
- Use visual affordances that distinguish WSC object types: gallery frame for Alpacards, projector/screen for slideshow, video wall for Alpaca Channel, judge/timer board for debate, arcade cabinet/scoreboard for Play Path.

## Blockers

- Museum video and slideshow are not proven visible/openable in the current room object data despite being contracted. This must be resolved before WSC context gate passes.
- Debate Room does not yet implement real WSC debate sequence; it is currently a role/seat shell with content-panel support.
- Games Hall live multiplayer is not ready. Launches are solo bridges/placeholders until shared state, scoring, host controls, and persistence policy are implemented.

## Next Fixes

- Add or verify interactive Museum objects for `museum-video-surface` and `museum-slideshow-surface`.
- Add first-playable panel labels that distinguish solo bridge, placeholder, and live activity.
- Give Debate Room one minimal debate state model: selected motion, phase, active side/speaker, timer, and judge feedback placeholder.
- Add stronger WSC labels/signage to first-five surfaces without baking dynamic content into art.
- Reintroduce a compact syllabus or big-ideas surface in the first-five lobby if user testing reports generic-campus confusion.

## Good Enough For First Playable

- Library guide shelves connected to existing guide data.
- Museum Alpacard exhibit mapping connected to existing Alpacard data.
- Games Hall launch links connected to existing Play path modes.
- Debate Room seat groups and visible role structure ready for first multiplayer seat testing.
- Cross-room dock and simplified lobby route the user through a coherent WSC Learn/Play/Debate slice.

## Reusable WSC Master Sprint-Close Checklist

- [ ] Every first-five interactable surface maps to existing WSC content/API data or is explicitly labeled as a placeholder.
- [ ] Museum shows distinct Alpacard, video, and slideshow surfaces when those contracts are active.
- [ ] Library separates guiding section shelves from general reference/help surfaces.
- [ ] Debate Room has proposition/PRO, opposition/CON, judge/moderator/timekeeper, spectator, timer/progress, and feedback affordances.
- [ ] Games Hall distinguishes solo bridges, placeholders, and true live multiplayer launches.
- [ ] No long WSC content is duplicated into new static files or baked into GLB/textures.
- [ ] Room labels, panels, and object affordances use WSC path/mode language from the existing app.
- [ ] First-playable UI makes the campus feel like WSC practice, not a generic classroom/gallery/arcade.
- [ ] Taylor, Ira, Robin, and Sidi Yahya have clear follow-up ownership for any fidelity gap.
- [ ] WSC context gate records blockers, good-enough calls, and deferred fidelity work before sprint close.

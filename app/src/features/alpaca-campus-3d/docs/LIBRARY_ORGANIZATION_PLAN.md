# Library Organization Plan

Owner: Taylor connector  
Room: `guiding-library-lounge`  
Scope: organization plan only. Do not duplicate WSC content or edit runtime code.

## Goal

The Library is the Learn-path browsing room for current WSC guide content. It should feel like a real room with readable shelf landmarks, but every detailed title, summary, guide body, atom, raw entry, media card, and link must come from the existing solo-mode/runtime content APIs.

The center of the 3D game view should stay clear for avatar movement, camera framing, multiplayer presence, and room readability. Interactions open right/left side panels or compact popups; the only in-world text should be short shelf labels, numeric markers, hover highlights, and small status chips.

## Existing Contracts To Reuse

- Room id: `guiding-library-lounge`.
- 3D asset dynamic surfaces from `asset-manifest.ts`:
  - `SURFACE__guide-shelf-1` through `SURFACE__guide-shelf-15`.
  - `SURFACE__library-center-table`.
  - `SURFACE__library-resource-cart`.
- Content surface contract from `content-surfaces.ts`:
  - Each shelf maps to `panelId: "guide-section"` with `panelContext: { sectionIndex }`.
  - Guide shelf count is `getRegularGuides().length`, falling back to 15.
  - Table/cart should remain content surfaces and resolve through `window.WSC_ALPACA_CAMPUS_CONTENT`.
- Existing 2D room layout from `data/rooms.js`:
  - `guide-shelf-*` objects are shelf interactions.
  - `library-center-table` and `library-resource-cart` currently open the broader `library` panel.
  - In the five-room 3D slice, the only portal is `library-exit`; side doors to Raw Classroom and Alpaca Channel Cinema are not part of this slice.
- Content bridge from `data/content-bridge.js`:
  - `getRegularGuides()` reads `window.WSC_RAW_CONTENT_BANK.regularGuides`.
  - `getGuideSectionPanel(context)` reads guide `sectionIndex`, corresponding knowledge section, guide HTML, guide link, and up to four atoms.
  - `getLibraryPanel()` reads the first seven guides and first four knowledge sections for a broad Library Wall summary.
  - `getWorldContentForObject(item)` resolves shelf world cards for `panel: "guide-section"` and resolves broader library cards for `panel: "library"`.

## Room Areas

| Area | Physical affordance | Surface ids | Content role | Panel behavior |
| --- | --- | --- | --- | --- |
| Back guide wall | Main shelf run at the front/back wall | `guide-shelf-1` to `guide-shelf-8` | First eight regular guide sections, in current `regularGuides` order | Open `guide-section` side panel for the selected shelf |
| Side guide alcoves | Left/right lower shelf clusters | `guide-shelf-9` to `guide-shelf-15` | Remaining regular guide sections | Open `guide-section` side panel for the selected shelf |
| Center reading table | Shared table in the middle | `library-center-table` | Browse/index surface for the Library Wall, recent/featured guides, and selected shelf continuation | Open `library` side panel with guide index and pin/continue controls |
| Resource cart | Small portable cart near the right/bottom reading area | `library-resource-cart` | Quick-pick surface for guide PDFs/links and raw-entry jump lists | Open compact side drawer or popover using the same `library` data, not copied lists |
| Reading seats | Claimable seating clusters | `library-seat-*` | Presence/study context only | Claim seat; do not show heavy content unless a shelf/table panel is already open |
| Exit | Door back to lobby | `library-exit` | Navigation only | Transition to `school-lobby`, spawn `library` |

## Shelf-To-Content Map

Use this exact mapping for the current runtime order. Every shelf calls `getPanel("guide-section", { sectionIndex })` and `getWorldContentForObject({ panel: "guide-section", sectionIndex })`; the entries listed below are a planning map of what the current raw-content section contains, not content to copy into the 3D code.

| Shelf | `sectionIndex` | Current guide | Raw entries currently in that section |
| --- | ---: | --- | --- |
| `guide-shelf-1` | 0 | Call of Duty-Free | From Roadside Stops to Hotels; The Grand Tour: Travel as a Rite of Passage; The Golden Age of Travel... or Just a Golden Myth?; Traveling Differently: The Search for "Authentic" Tourism; When Goods Travel: The World of Trade Hubs |
| `guide-shelf-2` | 1 | Concluding Questions | When Is It Wise to Let Go?; Would You Want to Know the Exact Waiting Time?; Zeno and the Problem of Ever Getting There; Patience: A Virtue, a Strategy, or a Burden?; The End of History-or Just Another Delay?; When Stories Refuse to End Clearly; We're There. What Comes After? |
| `guide-shelf-3` | 2 | Going Pains | Adolescence Is Old. Teenagers Are New.; Growing Up Has Different Names; Rites, Rules, and the Moment You "Become" an Adult; Growing Up Is Messy; "Adulting": Acting Like a Grown-Up; The Last Threshold |
| `guide-shelf-4` | 3 | Home and Wandering | Finding the Sea: Tools That Made the Ocean Measurable; How Animals Find Their Way; Wayfinding Without Screens; Should Some Parts of the World Stay Foggy?; Stuck in Transit; Reaching the Border Is Not the Same as Being Accepted; Poems of Migration and In-Between Lives; Art, Music, and the Migrant In-Between |
| `guide-shelf-5` | 4 | Introductory Questions | To Consider Before Diving In; Frank Sinatra, My Way; The Lord of the Rings: Nice Trilogy, Strange Ending Experience?; Simba, Teenagers, and Life in the In-Between; Technologies That Seemed Close but Never Arrived; Things We Commit To but Do Not Finish |
| `guide-shelf-6` | 5 | Monkey See, Monkey Prototype | From Rough Draft to Real Product; Fast Models, Real Risks; Vibe Coding and the Flood of New Software; The Mechanical Turk and the Ethics of Fake Intelligence; Rigged Demos and the Performance of Readiness; Humans Behind the Curtain |
| `guide-shelf-7` | 6 | More To Do Than Can Ever Be Listed | A Brief on To-Do Lists; The Zeigarnik Effect and the Done List; Umberto Eco, the To-Do List Specialist |
| `guide-shelf-8` | 7 | Next Year in Futurism | Always Almost There; What 2018 Thought 2028 Would Look Like; Tesla's Tower and the Meaning of "Soon"; Future Promises and the Problem of Timing; How Long Should Humans Try to Live?; Yesterday's Tomorrow; Quantum Supremacy and the Fear of Q-Day; Can We Still Tell Human Writing from AI Writing?; What Would AGI Change?; The Next Frontier Underground |
| `guide-shelf-9` | 8 | Progress, Not Regress | The History of the Progress Bar, Brad A. Myers; Progress Bar, So Many of Them!; Placebo Buttons, Feeling Faker; The Airport Baggage Claim Trick; Effect of Progress Indicators on Individuals; Play to Wait; How Can Societies Measure Progress?; Is the World on Its Way to a Better or Worse Place? |
| `guide-shelf-10` | 9 | The End is Nearish | When Power Is Supposed to Be Temporary; Lame Ducks and Fading Power; If No One Knew Who Was Next; The Clock That Measures Doom; Why People Keep Predicting the End; Renaissance Visions of the End; Modern Apocalypses and New Fears; A Soundtrack for the End; The Point of No Return; Profiting from Disaster |
| `guide-shelf-11` | 10 | The Lovely and the Liminal | The Doorway Effect; Lost in the In-Between; Playable Liminality; Beauty Without Arrival; Shared Liminal Spaces; The Architecture of Waiting; Is "Liminal" Becoming Too Broad?; Stuck in the In-Between; Music for Airports? |
| `guide-shelf-12` | 11 | There's a Draft in Here | Rough Draft in Arts; Music Is Also a Creative Process; Never Released... Until the Internet Allowed It |
| `guide-shelf-13` | 12 | We're All in This to Get There | Projects That Took Too Long to Get There; Project Management Before It Had a Name; What a Gantt Chart Shows - and What It Hides; The Iron Triangle and the Tools of Trade-Offs; Rigid Maps, Fast Pivots, and the New Logic of Work; The Stopwatch Era - Then and Now; The Laws of Human Effort; The 80/20 Question |
| `guide-shelf-14` | 13 | Where the Sidewalk Starts | The Sidewalk Between Street and Building; Why Moving Sidewalks Never Took Over the World; How Parking Took Over the Landscape; When Parking Lots Become Architecture; What Is a Snout House?; Frank Lloyd Wright and the House Built Around the Car; Turning Parking Into Public Space |
| `guide-shelf-15` | 14 | Where We're Going, We'll Still Need Them | Roads Before Roads Became Obvious; Roads That Think, Charge, Heal, and Drain; Shortcuts, Scenic Routes, and the Logic of the Best Path; Why Stroads Fail; The Road as a State of Mind; Why the Road Trip Became American; Can a Bus Journey Be a Road Trip?; Why Route 66 Still Matters; Motels: Sleeping on the Road; Songs, Paintings, and the Feeling of the Highway; Circles, Detours, and Why a Journey Matters |

## Display Model

### In-World

- Shelves should show only a short shelf number, a concise guide title, hover/focus outline, and optional progress/visited badge.
- Do not render full summaries, raw entries, quiz questions, or guide HTML in the 3D scene.
- The selected shelf can brighten or tilt a small title plaque, but the center floor should stay clear.
- Center table should display a few closed books/cards labeled "Library Index", "Continue", and "Pinned"; these are interaction hints only.
- Resource cart should display a small "Links / PDFs" cue and a count from the live guide list when available.

### Side Panel For A Shelf

Open a non-modal side panel pinned to the right on desktop and bottom sheet on mobile:

- Eyebrow from panel: expected `Library`.
- Title from `getGuideSectionPanel({ sectionIndex }).title`.
- Summary from panel `summary`.
- Featured image/meta from `featuredImage` and `featuredMeta` when present.
- Guide document/link from panel `guides[0]`.
- "Section ideas" list from panel `atoms`, capped at four items by the bridge.
- Optional "Raw entries in this shelf" list should be resolved from the raw-content bank by guide id/section id at render time. It must deep-link or command-open the existing raw-content entry renderer instead of duplicating entry bodies.
- A primary action can be "Open in Guide" or "Read Guide"; it should launch or route to the current solo-mode guide experience.

### Side Panel For Center Table

Open the broader `library` panel:

- Title: `Library Wall`.
- Summary: use `getLibraryPanel().summary`.
- Display a searchable/scrollable guide index sourced from `getRegularGuides()`, not only the current `getLibraryPanel().guides.slice(0, 7)` if the UI needs all shelves.
- Show "Featured ideas" from `getLibraryPanel().atoms`.
- Selecting a guide in this panel should switch to the corresponding shelf section panel by `sectionIndex` and optionally highlight the shelf in-world.
- Keep this as a drawer/index, not a full-screen overlay, so the player can still see the Library.

### Popup For Resource Cart

Use a compact popup or narrow drawer:

- Purpose: quick access to PDF/source links and saved/visited shelves.
- Data source: same `regularGuides` array and guide `href || pdfHref`, plus per-user progress if available.
- It should not be a second copy of guide summaries. It should link users into the shelf panel or existing solo-mode guide route.

## Content Surface Mapping Rules

- `guide-shelf-N` maps to:
  - `id: library-guide-shelf-N`
  - `itemId: guide-shelf-N`
  - `kind: guide-shelf`
  - `panelId: guide-section`
  - `panelContext: { sectionIndex: N - 1 }`
- `library-center-table` maps to:
  - `kind: guide`/`library`
  - `panelId: library`
  - `panelContext: {}` unless a selected guide is being continued.
- `library-resource-cart` maps to:
  - `kind: guide`/`library`
  - `panelId: library`
  - A cart-specific view mode may be UI-only, but the content source remains the `library`/guide API.
- Do not serialize guide summaries, entry text, or atoms into GLB metadata.
- Do not create a parallel Library content JSON for the 3D room. The source of truth remains:
  - `window.WSC_RAW_CONTENT_BANK.regularGuides`
  - `window.WSC_RAW_CONTENT_BANK.sections`
  - `window.WSC_KNOWLEDGE_BANK.sections`
  - `window.WSC_ALPACA_CAMPUS_CONTENT.getPanel`
  - `window.WSC_ALPACA_CAMPUS_CONTENT.getWorldContentForObject`

## Interaction Flow

1. Player approaches or points at a shelf.
2. Hover/focus hint shows the guide title and "Open".
3. Click/confirm calls the content surface resolver for the shelf.
4. Side panel opens without moving the camera or covering the avatar.
5. Player can select entries/links in the panel; these open existing solo-mode guide/raw-content experiences or nested media lightboxes.
6. Closing the panel restores full movement focus; the shelf remains visibly selected for a short time.

## Layout Notes

- Arrange `guide-shelf-1` to `guide-shelf-8` as the strongest first-read wall. These are the initial scan order from left to right.
- Arrange `guide-shelf-9` to `guide-shelf-15` in side/lower alcoves. These remain equally important, but the visual hierarchy can suggest "continue around the room".
- Keep the central table walkable on all sides. It is an index surface, not a big text board.
- Keep the resource cart near the right/bottom path so it does not compete with shelves.
- Seats are for presence and study vibes. Avoid attaching content to each individual seat.

## QA Checklist

- All 15 shelves resolve a distinct `sectionIndex`.
- Shelf labels match `getRegularGuides()[sectionIndex].title`.
- Shelf side panels show live panel data and continue to work if guide titles/summaries change.
- Center table and resource cart open the broad Library view without duplicating guide content.
- The Library remains usable when `WSC_ALPACA_CAMPUS_CONTENT` is missing by falling back to generic guide labels.
- Mobile panel uses bottom sheet behavior and does not cover movement controls.
- No long text appears in the 3D center view.

## Risks

- `getGuideSectionPanel` currently pairs `getRegularGuides()[index]` with `getKnowledgeSections()[index]`. If those arrays are not in the same conceptual order, shelf summaries/atoms can mismatch guide titles.
- `content-surfaces.ts` currently only creates explicit blueprints for shelves, not separate table/cart `library` blueprints. The asset manifest includes table/cart surfaces, so runtime integration should confirm they are exposed through the same content-surface contract.
- The current `getLibraryPanel()` intentionally slices guides to seven. The center-table index should use `getRegularGuides()` directly or an expanded panel contract if the user expects all 15 from the table.
- Raw entry lists should be resolved by guide id/section id at display time; relying on array order alone may break if generated content order changes.

## Open Questions

- Should the center table show all 15 guide sections, or only "continue/recent/pinned" plus a link to the shelf wall?
- Should raw entries be visible directly inside shelf panels as a compact list, or should they require one extra click into the existing Raw Content reader?
- Do we want shelf grouping labels by WSC subject/theme, or should the room preserve the current generated guide order exactly?
- Should the resource cart prioritize PDF/source links, student progress, or teacher-facing printable materials?

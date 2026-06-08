# Assetsraw Room Layout Plan - Robin

Scope: layout/deployment plan only. Runtime code should stay untouched. All proposed objects come from `/Users/francoismo/Desktop/Pro/ILG - MORET FRANCOIS/FLE/2025-2026/WSC/Multiplayer habbo project/assetsraw`.

## Coordinate And Readability Rules

- Use one shared room grid: `x` left/right, `z` front/back, center at `(0, 0)`. Keep the avatar spawn and main camera sightline near the front/south edge at `z = -7`.
- Keep a continuous 2-tile-wide walking spine from every room door to its primary activity object. No seat, table, bookcase, exhibit, or arcade machine may intrude into this spine.
- Doors should be visually obvious and wide: use `kenney_furniture-kit/Models/GLTF format/doorwayOpen.glb`, `wallDoorwayWide.glb`, `doorwayFront.glb`, or `kenney_isometricLibrary/.../wallDoorway_*.png` depending on the renderer path.
- Camera readability target: no tall asset in the front third unless it is against a side wall. Keep main vertical silhouettes along north/east/west walls so the default angled camera can read interactables, seats, and portals.
- Recommended room footprint: `18 x 14` tiles for standard rooms; `22 x 16` for debate lab. Leave at least 1 tile between wall props and usable furniture, 2 tiles for aisles, 3 tiles in front of stage/screen focal points.

## Shared Asset Palette

- Floors/walls/doors: `kenney_furniture-kit/Models/GLTF format/floorFull.glb`, `wall.glb`, `wallHalf.glb`, `wallWindow.glb`, `wallDoorway.glb`, `wallDoorwayWide.glb`, `doorwayOpen.glb`; optional isometric doorway variants from `kenney_isometricLibrary/.../wallDoorway_E/N/S/W.png`.
- Seating: `loungeSofa.glb`, `loungeSofaLong.glb`, `loungeSofaCorner.glb`, `loungeChair.glb`, `bench.glb`, `benchCushion.glb`, `chair.glb`, `chairDesk.glb`, `chairModernCushion.glb`, `libraryChair_*.png`, `CAFETERIAchair.glb`, `PRINCIPALOFFICEchair.glb`.
- Tables/desks: `desk.glb`, `deskCorner.glb`, `table.glb`, `tableRound.glb`, `tableCoffee.glb`, `tableCoffeeSquare.glb`, `longTable_*.png`, `longTableChairs_*.png`, `COMPUTERtable.glb`, `CAFETERIAtable.glb`, `PRINCIPALOFFICEdesk.glb`.
- Book/storage/display: `bookcaseOpen.glb`, `bookcaseClosed.glb`, `bookcaseOpenLow.glb`, `books.glb`, `bookcaseBooks_*.png`, `bookcaseWideBooks_*.png`, `displayCase_*.png`, `displayCaseBooks_*.png`, `displayCaseOpen_*.png`, `displayCaseSword_*.png`, `PRINCIPALOFFICEshelf.glb`, `shelf_A_big.gltf`.
- Media/map/signage: `televisionModern.glb`, `televisionVintage.glb`, `TV.glb`, `TVNew.glb`, `COMPUTERscreen.glb`, `COMPUTERprojector.glb`, `blackboardbig.glb`, `blackboardlittle.glb`, `pictureframe_large_A.gltf`, `pictureframe_large_B.gltf`, `sign.glb`, `signpost.glb`, `arrow-standing.glb`.
- Decor/lighting: `pottedPlant.glb`, `plantSmall1.glb`, `plantSmall2.glb`, `lampRoundFloor.glb`, `lampSquareFloor.glb`, `lampWall.glb`, `rugRectangle.glb`, `rugSquare.glb`, `floorCarpet_*.png`, `candleStand_*.png`, `flag-banner-long.glb`, `flag-wide.glb`.
- Games: `kenney_mini-arcade/air-hockey.glb`, `arcade-machine.glb`, `basketball-game.glb`, `claw-machine.glb`, `dance-machine.glb`, `pinball.glb`, `prize-wheel.glb`, `ticket-machine.glb`, `vending-machine.glb`, plus `StylooClassroomAssetPack GLTF & FBX/CAFETERIApingpongtable.glb`.

## Campus Layout Topology

Use the lobby as the hub. Put specialist room exits on the lobby perimeter so players understand navigation without UI help.

- Lobby north wall: center portal to Debate Lab, labeled by `sign.glb` or `blackboardlittle.glb`.
- Lobby west wall: Library portal.
- Lobby east wall: Museum portal.
- Lobby southwest corner: Classroom portal.
- Lobby southeast corner: Games/Play portal.
- Every specialist room gets one return portal on its south wall, centered or near the original entry sightline.

## Lobby - `school-lobby`

Footprint: `18 x 14`. Spawn at `(0, -6)`, facing north. Main walk spine from `(0, -6)` to reception at `(0, 4)`, then branches left/right to portals.

- Reception desk: place `desk.glb` or `PRINCIPALOFFICEdesk.glb` at `(0, 5.2)`, facing south. Add `PRINCIPALOFFICEchair.glb` behind it at `(0, 6.2)` and `laptop.glb` or `COMPUTERscreen.glb` on the desk as the service marker.
- Info campus map: mount `blackboardbig.glb` or `pictureframe_large_A.gltf` on the north wall behind reception at `(0, 6.8)`. Flank with `signpost.glb` and `arrow-standing.glb` pointing toward portals. This is the "campus map" interactable.
- Sofa waiting zone west: L-shape using `loungeSofaLong.glb` at `(-5.5, -1)` and `loungeSofaCorner.glb` at `(-7, 0.5)`, with `tableCoffeeSquare.glb` at `(-5.6, 0.5)` and `rugRectangle.glb` under it.
- Sofa waiting zone east: mirrored lighter lounge using `loungeSofa.glb`, `loungeChair.glb`, `tableCoffee.glb`, and `plantSmall*.glb`.
- Portal labels: use `sign.glb` beside each doorway and `arrow-standing.glb` set back from the walk path. Avoid blocking the portal threshold.
- Camera note: keep reception low enough or far enough north that the player sees the campus map, sofa clusters, and at least three portal signs from spawn.

## Library - `guiding-library-lounge`

Footprint: `18 x 14`. Return door at `(0, -6.8)`. Primary activity focus at `(0, 2.5)`.

- Bookshelf rows: three north/south rows on the west half using `bookcaseBooks_N/S/E/W.png` or `bookcaseOpen.glb`. Suggested rows at `x = -6`, `x = -3.5`, and `x = -1`, spanning `z = -1` to `z = 5`. Leave 2-tile aisles between rows and a 2.5-tile cross aisle at `z = 1.5`.
- Reading tables: place two `longTableChairs_*.png` or `longTableDecoratedChairsBooks_*.png` on the east half at `(3.5, 1.2)` and `(3.5, 4.1)`. If using GLB, combine `table.glb` or `tableRound.glb` with `chair.glb`/`chairDesk.glb`.
- Lounge reading nook: southeast corner with `loungeChairRelax.glb`, `tableCoffee.glb`, `lampRoundFloor.glb`, `rugRound.glb`, and `books.glb`.
- Librarian/help desk: small `desk.glb` at `(0, -3.5)`, facing the entrance, but offset enough to preserve the 2-tile path from door to shelves.
- Display moment: `displayCaseBooks_*.png` near the north wall at `(5.8, 5.8)` as a "featured source" exhibit.
- Camera note: shelves should not occupy the front/south edge. From the default camera, the east reading tables and west aisles must read as separate zones.

## Debate Lab - `debate-room-1`

Footprint: `22 x 16`. Return door at `(0, -7.8)`. The debate floor is a clear central rectangle from `x = -6` to `6`, `z = -2` to `4`.

- Stage/scene: raised visual focus along north wall using `floor-stairs.glb`, `floor-steps.glb`, or a 1-tile high platform made from `kenney_isometricPrototypeTiles` slab/floor pieces. Place `blackboardbig.glb`, `TVNew.glb`, or `COMPUTERprojector.glb` centered at `(0, 6.8)` as the motion/topic screen.
- Team A bench/table: `table.glb` or `longTable_*.png` at `(-4.2, 1.2)`, with 3 `chairDesk.glb` facing east/northeast. Add `flag.glb` or `flag-banner-short.glb` behind them.
- Team B bench/table: mirror at `(4.2, 1.2)`, chairs facing west/northwest, separate color/side marker via another `flag*.glb`.
- Speakers' lecterns: use `desk.glb`, `tableCross.glb`, or `bookStand_*.png` at `(-2, 3.2)` and `(2, 3.2)`, angled slightly toward judge and spectators. Keep a 2-tile lane between lecterns.
- Judge area: centered south of stage at `(0, 4.8)`, using `PRINCIPALOFFICEdesk.glb`, `PRINCIPALOFFICEprincipalchair.glb`, `lampSquareTable.glb`, and `COMPUTERscreen.glb` or `laptop.glb`.
- Spectator rows: three shallow rows across the south half, using `bench.glb`/`benchCushion.glb` or repeated `chair.glb`: row 1 at `z = -2.8`, row 2 at `z = -4.2`, row 3 at `z = -5.6`, with a central aisle `x = -1` to `1` left empty.
- Moderator/media corner: east/north corner with `speaker.glb`, `speakerSmall.glb`, `televisionModern.glb`, and `COMPUTERscreen.glb`.
- Camera note: put tall screen and flags on the north wall only. From spawn, players should see spectators first, then teams, then judge/stage, giving the room a full arena read.

## Classic Classroom - `raw-content-classroom`

Footprint: `18 x 14`. Return door at south center. Teacher wall north.

- Teacher zone: `PRINCIPALOFFICEdesk.glb` or `desk.glb` centered at `(0, 5.2)`, `PRINCIPALOFFICEchair.glb` behind, `blackboardbig.glb` on north wall at `(0, 6.8)`, `blackboardlittle.glb` as side notes.
- Student desks: 4 columns x 3 rows of `chairtable.glb` if using Styloo, or `desk.glb` plus `chairDesk.glb`. Positions: `x = -5.4, -1.8, 1.8, 5.4`; `z = -2.8, -0.4, 2.0`. Leave center aisle only if reducing to 3 columns.
- Resource shelves: `PRINCIPALOFFICEshelf.glb`, `bookcaseClosed.glb`, and `book.glb` along west wall; `COMPUTERprojector.glb` or `COMPUTERscreen.glb` on east wall as digital lesson surface.
- Small science/knowledge props: `CHEMISTRYglobe_1.glb`, `CHEMISTRYmicroscope.glb`, `CHEMISTRYsolarsystem_9.glb` on side tables if this room needs more WSC personality.
- Camera note: the board should be readable over the desks. Keep student props below head height and push shelves to side walls.

## Museum - `flashcard-museum`

Footprint: `20 x 14`. Return door south center. Primary path is a loop: enter, split left/right around center exhibits, rejoin at north media wall.

- Exhibit cases: arrange `displayCase_*.png`, `displayCaseOpen_*.png`, `displayCaseBooks_*.png`, and `displayCaseSword_*.png` in two staggered rows: `x = -4.5` and `x = 4.5`, `z = -1, 1.8, 4.6`. Keep the center aisle `x = -1.5` to `1.5` open.
- Slideshow wall: north wall gets 3 large "screen" surfaces: `TVNew.glb`, `televisionModern.glb`, and `COMPUTERscreen.glb`/`blackboardbig.glb`, positioned at `x = -4, 0, 4`, `z = 6.8`. These can represent slideshow/video-ish lesson cards without importing new media assets.
- Gallery frames/decor: use `pictureframe_large_A.gltf`, `pictureframe_large_B.gltf`, `pictureframe_medium.gltf`, and `PRINCIPALOFFICEpicture.glb` on side walls.
- Center feature: `displayCaseOpen_*.png` or `displayCaseBooks_*.png` at `(0, 2.5)` with `floorCarpet_*.png`/`rugRectangle.glb` below, but leave 2 tiles around it.
- Decorative lighting: `lampWall.glb`, `lampSquareFloor.glb`, `candleStand_*.png`, `pottedPlant.glb`, and `flag-banner-long.glb` along walls.
- Camera note: use a low central exhibit and tall media only on the north wall, so the loop path remains legible from the entrance.

## Games / Play Area - `games-hall`

Footprint: `20 x 14`. Return door south center. This room is useful as a social decompression zone and mini-game launch surface.

- Arcade wall: line north/east walls with `arcade-machine.glb`, `pinball.glb`, `dance-machine.glb`, `claw-machine.glb`, `ticket-machine.glb`, and `vending-machine.glb`. Keep them against walls, facing inward.
- Active game islands: place `air-hockey.glb` at `(-4, 1.5)`, `CAFETERIApingpongtable.glb` at `(3.8, 1.5)`, and `basketball-game.glb` at `(6.5, 5.4)` against the north/east corner.
- Prize/social counter: `cash-register.glb`, `prizes.glb`, and `prize-wheel.glb` near `(0, 5.4)`, with `character-employee.glb` if NPC/static character use is allowed.
- Seating: `benchCushion.glb` or `loungeSofa.glb` along the west wall, with `tableCoffee.glb` and `rugSquare.glb`.
- Path: main 2-tile path runs from south door to prize counter, then loops around the two game islands. Do not place arcade machines in the center.
- Camera note: center islands must be low/medium height; tall machines belong on walls to avoid hiding players.

## Deployment Checklist

- Confirm every used asset path resolves under `assetsraw`; no external downloads or generated runtime props.
- Before placement, normalize scale per pack: Styloo classroom assets, Kenney furniture GLB, KayKit furniture GLTF, and isometric PNGs likely need separate scale presets.
- Use door thresholds as no-place zones: minimum `2 x 2` clear space on both sides of every doorway.
- Keep interaction hotspots in front of objects, not inside object bounds: reception map, library featured case, debate lecterns/judge desk, classroom board, museum screens, game machines.
- Verify with top-down and default angled camera screenshots. Required readability checks: lobby portals visible from spawn, library aisles not blocked, debate teams/judge/spectators all visible, classroom board visible over desks, museum loop path visible, games wall machines not occluding center path.

# Assetsraw Selection - Sidi Yahya Environment Pass

Scope: audit limited to `/Users/francoismo/Desktop/Pro/ILG - MORET FRANCOIS/FLE/2025-2026/WSC/Multiplayer habbo project/assetsraw`.

This pass is environment-only. WSC content mapping, topic placement, activity semantics, and room-to-curriculum links come later.

## Best Packs By Room

| Room | Best source folders | Use |
| --- | --- | --- |
| Lobby | `kenney_furniture-kit/Models/GLTF format`, `KayKit_Furniture_Bits_1.0_FREE/Assets/gltf`, `KayKit_RPGToolsBits_1.0_FREE/Assets/gltf`, `StylooClassroomAssetPack GLTF & FBX/walls/GLB` | Reception seating, front desk, map/info props, neutral school walls/floors. |
| Library | `kenney_furniture-kit/Models/GLTF format`, `KayKit_Furniture_Bits_1.0_FREE/Assets/gltf`, `StylooClassroomAssetPack GLTF & FBX/classroom/GLTF` | Bookcases, reading tables, chairs, loose books, lamps. |
| Debate lab | `kenney_furniture-kit/Models/GLTF format`, `KayKit_Furniture_Bits_1.0_FREE/Assets/gltf`, `KayKit_DungeonRemastered_1.1_FREE/Assets/gltf`, `KayKit_Platformer_Pack_1.0_FREE/Assets/gltf/blue` | Team tables, judge desk, chairs, simple raised stage/platforms, banners/signage. |
| Classroom | `StylooClassroomAssetPack GLTF & FBX/classroom/GLTF`, `StylooClassroomAssetPack GLTF & FBX/walls/GLB`, `kenney_furniture-kit/Models/GLTF format` | Classroom desks, blackboards, shelves, lockers, school clutter. |
| Museum | `StylooClassroomAssetPack GLTF & FBX/ArtRoom/glb`, `KayKit_Furniture_Bits_1.0_FREE/Assets/gltf`, `kenney_furniture-kit/Models/GLTF format`, `KayKit_DungeonRemastered_1.1_FREE/Assets/gltf` | Frames, paintings, statue, display-like cabinets, columns, banners, plinth substitutes. |
| Games/play area | `kenney_mini-arcade/Models/GLB format`, `StylooClassroomAssetPack GLTF & FBX/catferia/GLTF`, `kenney_furniture-kit/Models/GLTF format` | Arcade machines, air hockey, pinball, ping-pong, casual seating, vending. |

Note: `kenney_isometricLibrary` has useful library visual references, but the inspected assets are PNG sprites, not GLB/GLTF runtime assets. Do not treat it as selected 3D source unless a later conversion pass is approved.

## Concrete GLB/GLTF Picks

### Lobby

- Sofas: `kenney_furniture-kit/Models/GLTF format/loungeSofa.glb`, `loungeSofaLong.glb`, `loungeSofaCorner.glb`, `loungeDesignSofa.glb`; alternate softer style from `KayKit_Furniture_Bits_1.0_FREE/Assets/gltf/couch.gltf`, `couch_pillows.gltf`, `armchair_pillows.gltf`.
- Reception desk: `kenney_furniture-kit/Models/GLTF format/desk.glb`, `deskCorner.glb`; if a longer counter is needed, compose with `KayKit_Restaurant_Bits_1.0_FREE/Assets/gltf/kitchencounter_straight_A.gltf`, `kitchencounter_outercorner.gltf`, `kitchencounter_innercorner.gltf`.
- Info board / campus map: `KayKit_RPGToolsBits_1.0_FREE/Assets/gltf/map.gltf`, `map_empty.gltf`, `blueprint.gltf`; wall/info surfaces from `StylooClassroomAssetPack GLTF & FBX/classroom/GLTF/blackboardlittle.glb`, `blackboardbig.glb`, and directional stand-ins from `KayKit_Platformer_Pack_1.0_FREE/Assets/gltf/blue/signage_arrow_stand_blue.gltf`.
- Lobby decor and structure: `StylooClassroomAssetPack GLTF & FBX/walls/GLB/walldoor_001.glb`, `wallwindow_001.glb`, `floorpattern.glb`; plants from `kenney_furniture-kit/Models/GLTF format/pottedPlant.glb`, `plantSmall1.glb`.

### Library

- Bookshelves: `kenney_furniture-kit/Models/GLTF format/bookcaseOpen.glb`, `bookcaseOpenLow.glb`, `bookcaseClosed.glb`, `bookcaseClosedWide.glb`; KayKit alternatives `KayKit_Furniture_Bits_1.0_FREE/Assets/gltf/shelf_B_large_decorated.gltf`, `shelf_B_large.gltf`, `shelf_A_big.gltf`.
- Tables: `kenney_furniture-kit/Models/GLTF format/table.glb`, `tableCoffee.glb`, `tableCoffeeSquare.glb`; KayKit reading table options `KayKit_Furniture_Bits_1.0_FREE/Assets/gltf/table_medium_long.gltf`, `table_medium.gltf`, `table_low.gltf`.
- Chairs: `kenney_furniture-kit/Models/GLTF format/chair.glb`, `chairCushion.glb`, `chairModernCushion.glb`; KayKit alternatives `KayKit_Furniture_Bits_1.0_FREE/Assets/gltf/chair_A_wood.gltf`, `chair_B_wood.gltf`, `armchair.gltf`.
- Book clutter: `kenney_furniture-kit/Models/GLTF format/books.glb`; `KayKit_Furniture_Bits_1.0_FREE/Assets/gltf/book_set.gltf`, `book_single.gltf`; Styloo classroom loose books `StylooClassroomAssetPack GLTF & FBX/classroom/GLTF/book.glb`, `book_001.glb`, `book_002.glb`.

### Debate Lab

- Debate stage / platform: `KayKit_Platformer_Pack_1.0_FREE/Assets/gltf/blue/platform_6x6x1_blue.gltf`, `platform_6x2x1_blue.gltf`, `platform_4x2x1_blue.gltf`; edge control with `railing_straight_single_blue.gltf`, `railing_corner_single_blue.gltf`.
- Team tables: `KayKit_Furniture_Bits_1.0_FREE/Assets/gltf/table_medium_long.gltf`, `table_medium.gltf`; sharper Kenney options `kenney_furniture-kit/Models/GLTF format/table.glb`, `desk.glb`.
- Judge area: `kenney_furniture-kit/Models/GLTF format/desk.glb`, `chairDesk.glb`, `chairModernFrameCushion.glb`; formal banner accents from `KayKit_DungeonRemastered_1.1_FREE/Assets/gltf/banner_blue.gltf`, `banner_red.gltf`, `banner_triple_blue.gltf`.
- Chairs: `KayKit_Furniture_Bits_1.0_FREE/Assets/gltf/chair_A.gltf`, `chair_B.gltf`, `chair_C.gltf`; use `kenney_furniture-kit/Models/GLTF format/chair.glb` if the room follows the Kenney furniture style.

### Classroom

- Classroom desks: `StylooClassroomAssetPack GLTF & FBX/classroom/GLTF/desk.glb`, `chairtable.glb`, `table.glb`; teacher desk alternate `kenney_furniture-kit/Models/GLTF format/desk.glb`.
- Board: `StylooClassroomAssetPack GLTF & FBX/classroom/GLTF/blackboardbig.glb`, `blackboardbig_1.glb`, `blackboardlittle.glb`; board accessories `chalk.glb`, `chalk_001.glb`, `chalkboard_sponge_.glb`, `markers.glb`.
- Chairs: `StylooClassroomAssetPack GLTF & FBX/classroom/GLTF/chair.glb`; computer-room support `StylooClassroomAssetPack GLTF & FBX/computer/GLTF/COMPUTERchair.glb`.
- Classroom environment: `StylooClassroomAssetPack GLTF & FBX/classroom/GLTF/wallsfloor.glb`, `shelf.glb`, `shelf_001.glb`, `locker.glb`, `TVNew.glb`, `curtains.glb`.

### Museum

- Displays / pedestals / cases: best direct display-like picks are `KayKit_Furniture_Bits_1.0_FREE/Assets/gltf/cabinet_medium_decorated.gltf`, `cabinet_small_decorated.gltf`, `shelf_B_small_decorated.gltf`; plinth substitutes from `KayKit_DungeonRemastered_1.1_FREE/Assets/gltf/column.gltf`, `barrier_column.gltf`, `barrier_colum_half.gltf`.
- Frames / wall art: `KayKit_Furniture_Bits_1.0_FREE/Assets/gltf/pictureframe_large_A.gltf`, `pictureframe_large_B.gltf`, `pictureframe_medium.gltf`, `pictureframe_standing_A.gltf`, `pictureframe_standing_B.gltf`; Styloo art assets `StylooClassroomAssetPack GLTF & FBX/ArtRoom/glb/painting.glb`, `painting_001.glb`, `painting_002.glb`, `paintingbig.glb`, `paintingreal.glb`.
- Museum objects and decor: `StylooClassroomAssetPack GLTF & FBX/ArtRoom/glb/statue.glb`, `easel.glb`, `palette.glb`, `holder.glb`; academic decor from `StylooClassroomAssetPack GLTF & FBX/chemestry lab/GLTF/CHEMISTRYglobe_1.glb`, `CHEMISTRYsolarsystem_9.glb`, `CHESMISTRYatoms.glb`.
- Soft museum seating: `kenney_furniture-kit/Models/GLTF format/bench.glb`, `benchCushion.glb`, `benchCushionLow.glb`.

### Games / Play Area

- Arcade anchors: `kenney_mini-arcade/Models/GLB format/arcade-machine.glb`, `pinball.glb`, `air-hockey.glb`, `basketball-game.glb`, `claw-machine.glb`, `dance-machine.glb`, `ticket-machine.glb`, `prize-wheel.glb`.
- Support props: `kenney_mini-arcade/Models/GLB format/vending-machine.glb`, `prizes.glb`, `cash-register.glb`, `floor.glb`, `wall.glb`, `wall-window.glb`.
- Casual school play: `StylooClassroomAssetPack GLTF & FBX/catferia/GLTF/CAFETERIApingpongtable.glb`, `CAFETERIAtable.glb`, `CAFETERIAchair.glb`, `CAFETERIAvendingmachine.glb`.
- Seating / lounge spillover: `kenney_furniture-kit/Models/GLTF format/loungeChair.glb`, `loungeChairRelax.glb`, `loungeSofaOttoman.glb`; KayKit `chair_stool.gltf`, `table_low.gltf`.

## Style Coherence Risks

- Lobby: Kenney furniture and KayKit furniture are both low-poly but differ in proportions and material palette. Pick one primary furniture family for the whole lobby; use the other only for minor props.
- Library: Styloo classroom books and Kenney/KayKit bookcases may have different scale and color density. Keep library shelving mostly Kenney or mostly KayKit, then use loose Styloo books sparingly as desk clutter.
- Debate lab: KayKit Platformer stage pieces are more game-like and saturated than furniture assets. Use the blue platform set only as a restrained raised floor; avoid mixing too many platform colors.
- Classroom: Styloo is the strongest complete-room set. If Kenney furniture is added, use it for teacher/utility furniture only, because Styloo classroom pieces are more specifically school-coded.
- Museum: ArtRoom assets have painterly classroom flavor, while Dungeon columns/banners can push medieval/fantasy. Keep Dungeon pieces to neutral columns/plinths/banners and avoid treasure, skull, weapon, or dungeon floor assets.
- Games/play area: Kenney Mini Arcade has a compact arcade style that can clash with school cafeteria props. Separate the arcade cluster from ping-pong/cafeteria props with floor zoning and consistent lighting.

## Exclusions For This Pass

- No runtime code edits.
- No assets outside `assetsraw`.
- No WSC content mapping yet; this is only the environment asset selection pass.

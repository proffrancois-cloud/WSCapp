# Kenney Library And Game Hall Handoff

Date: 2026-05-27
Owner: David head engineer
Recipients: Sidi Yahya artist 3d, Robin architecte, Ira jeux dans jeu, Taylor connector

## Immediate Decision

The two Kenney folders are not the same kind of source.

- `/Users/francoismo/Downloads/kenney_isometricLibrary` is a 2D PNG pack. The preferred assets `bookcaseWideBooks_E/N/S/W` and `longTableDecoratedChairs_E/N/S/W` exist, but they are flat `256 x 512` PNGs, not 3D models.
- `/Users/francoismo/Downloads/kenney_furniture-kit` is usable for runtime now because it includes `.glb` files under `Models/GLTF format`.

So the practical split is:

- Library: use the isometric library PNGs as visual reference and temporary style targets, not final high-quality 3D geometry.
- Games Hall: use the furniture-kit `.glb` files directly for a first live 3D layout test.

## Sidi Yahya Artist 3D: Library Direction

Use these exact PNGs as the preferred visual target:

- `Angle/bookcaseWideBooks_E.png`
- `Angle/bookcaseWideBooks_N.png`
- `Angle/bookcaseWideBooks_S.png`
- `Angle/bookcaseWideBooks_W.png`
- `Angle/longTableDecoratedChairs_E.png`
- `Angle/longTableDecoratedChairs_N.png`
- `Angle/longTableDecoratedChairs_S.png`
- `Angle/longTableDecoratedChairs_W.png`

They can be used in three ways:

1. Temporary billboard/proxy: place the PNG on a vertical plane so Robin and Taylor can test layout and content mapping quickly.
2. Blender modeling reference: rebuild the bookcase and long table as real low-poly GLB assets from the four views.
3. Texture/style reference: borrow the palette, book density, proportions, and silhouette while using real 3D furniture as the base.

Do not present the PNGs as final 3D models. A PNG-to-3D tool may give a prototype mesh, but the likely production path is still: model/rebuild in Blender, separate table/chair meshes where seats need to be claimable, export GLB, then validate in the campus route.

Required Library assets:

- `library-bookcase-wide-books.glb`: the core shelf based on `bookcaseWideBooks`.
- `library-bookcase-wide-books-corner.glb`: optional corner/side wall variant.
- `library-long-table.glb`: table separated from chairs.
- `library-reading-chair.glb`: separate claimable chair aligned to seat IDs.
- `library-shelf-label-surface.glb`: small dynamic surface/plaque, no baked guide text.

## Robin Architecte: Library Placement

Use the visual target from Sidi Yahya but keep the room contract clean.

- Back wall: use repeated wide bookcases for `guide-shelf-1` to `guide-shelf-8`.
- Side walls/alcoves: use repeated wide bookcases for `guide-shelf-9` to `guide-shelf-15`.
- Center area: use the long table as an index/study table, with chairs around it but enough walk space on all sides.
- Every shelf must preserve a dynamic surface or interaction anchor for Taylor's `sectionIndex` mapping.
- Do not merge all chairs into one static table object if seats need to be claimable.

## Taylor Connector: Library Content

Keep using `docs/LIBRARY_ORGANIZATION_PLAN.md`.

- The Kenney shelf style changes the room look only.
- It does not change content source of truth.
- `guide-shelf-N` still maps to `sectionIndex: N - 1`.
- Long text remains in side panels/bottom sheets.

## Games Hall Runtime Trial

The first live Games Hall pass now uses copied `.glb` files from:

`/Users/francoismo/Downloads/kenney_furniture-kit/Models/GLTF format`

Runtime copies live under:

`/Users/francoismo/Documents/Playground/WSC/app/assets/campus-3d/props/kenney-furniture/`

Current imported assets:

- `desk.glb`
- `desk-corner.glb`
- `chair-desk.glb`
- `chair-cushion.glb`
- `table.glb`
- `table-round.glb`
- `bench-cushion.glb`
- `television-modern.glb`
- `computer-screen.glb`
- `computer-keyboard.glb`
- `laptop.glb`
- `speaker.glb`
- `rug-rectangle.glb`
- `cabinet-television-doors.glb`

## Robin Architecte: Games Hall Placement

Use the runtime pass as a layout prototype.

- Main scoreboard wall: TV/cabinet/speakers near the top wall.
- Four central team tables: tables and chairs around the existing team-table zones.
- Side spectator areas: bench cushions along left/right bleacher zones.
- Desk area: two small desk/computer zones near the lower left/right edges.
- Keep the center path readable for player movement and multiplayer clustering.
- Keep existing collision zones even when placeholder dark boxes are hidden.

## Ira Jeux Dans Jeu: Games Hall Logic

Treat the room as a playable hub, not a decorative lounge.

- Scoreboard wall: launches or summarizes the Play path.
- Team tables: future live Alpacapardy/team game seating.
- Desk zones: small solo/duo arcade or control stations.
- Bleachers: spectator seating for live games.
- Cabinets/screens are launch anchors, not content storage.

For the first playable, focus on one live game pattern first: Alpacapardy from the scoreboard/main screen, with team tables as the natural grouping surface.

## Risks

- The Library PNGs are attractive, but they are flat art. Using them directly in a 3D camera can look like cardboard unless the room stays strongly isometric.
- Furniture-kit style is different from the current lobby/museum style. That is acceptable for a Games Hall experiment, but Sidi Yahya should later decide whether to restyle, recolor, or rebuild a coherent final kit.
- Kenney GLBs are small and useful, but scale/orientation may need a visual tuning pass after screenshots.

# Alpaca Campus 3D Asset Pipeline

This is the first-slice contract for Blender-authored, web-deliverable assets. The runtime may keep using generated Three.js geometry until GLBs exist, but every room asset must be authored against this contract.

## Source And Runtime Paths

- Blender source: `assets-source/campus-3d/rooms/{roomId}/{roomId}.blend`
- Runtime GLB: `/assets/campus-3d/rooms/{roomId}/{roomId}.glb`
- Blender CLI: `/Applications/Blender.app/Contents/MacOS/Blender`
- Blender version checked: `5.1.2`

## Coordinate Contract

Use the current campus room coordinate system as source of truth.

```text
sceneX = (runtimeX - room.width / 2) * 0.012
sceneZ = (runtimeY - room.height / 2) * 0.012
sceneY = height
```

Room GLBs are centered at the scene origin. `Y` is up. Do not compensate for asset scale in runtime code unless the manifest changes.

## Naming Rules

- Nodes: `{roomId}__{category}__{name}`
- Collision proxies: `COLLIDER__{blockedZoneId}`
- Spawn and interaction anchors: `ANCHOR__{id}`
- Dynamic content surfaces: `SURFACE__{objectId}`

Collision proxy names should match existing `blockedZones` IDs wherever possible. Dynamic WSC content is never baked into meshes or textures; the app maps it onto surfaces at runtime.

## Optimization

Export from Blender to GLB, then optimize with glTF Transform:

```bash
npx --yes @gltf-transform/cli optimize input.glb output.glb --compress meshopt --texture-compress webp --texture-size 2048
```

The repo also includes a dry-run helper for the current custom props:

```bash
cd app
npm run optimize:campus-glbs
npm run optimize:campus-glbs -- --write
```

The helper writes to `app/public/assets/campus-3d/props/optimized/`. Do not repoint runtime assets to optimized files until the visual pass confirms scale, pivots, materials, and interaction proxies still match the current campus look.

Use web-safe PBR materials, reuse materials aggressively, and keep image textures proportional to how large the object appears on screen.

## Loading Tiers And Budgets

Every placed environment asset must fit one of these tiers:

- `critical`: floor, collisions, portals, labels, simple content surfaces, and tiny props required for the room to be usable.
- `deferred`: non-blocking room dressing that may load after idle once the player has a stable first frame.
- `highDetail`: signature raw GLBs and large decorative props. These load only when the local `High detail` toggle is enabled.

Initial multiplayer route budgets:

| Route Stage | Critical Asset Budget |
|---|---:|
| Campus shell visible | no GLB required |
| Courtyard ready | 8 MB max |
| Lobby ready | 12 MB max |
| Any single room ready | 16 MB max |
| Any GLB before explicit interaction/high detail | 20 MB max |

The forbidden-before-ready list currently includes `alhambra-study-ii.glb`, `masjid-al-aqsa-dome-of-the-rock.glb`, `oriental-fountain.glb`, `cour-du-chateau-de-chambord.glb`, and `old-wooden-door.glb`.

## Room Asset Budgets

| Room | Max Tris | Max Draw Calls | Max Optimized GLB |
|---|---:|---:|---:|
| School Lobby | 180k | 35 | 12 MB |
| Library | 220k | 45 | 16 MB |
| Museum | 180k | 40 | 14 MB |
| Debate Room | 140k | 30 | 10 MB |
| Games Hall | 220k | 45 | 16 MB |

The first slice should stay under roughly `68 MB` optimized.

## Validation Checklist

- GLB loads without console errors in the 3D campus route.
- Mesh roots, colliders, anchors, and dynamic surfaces match `asset-manifest.ts`.
- No baked WSC guide text, card text, video frame, score, debate motion, or live-game state.
- Pivots/origins make interaction surfaces easy to target.
- Colliders match blocked areas closely enough that players cannot walk through major furniture.
- Desktop and 390px mobile screenshots show nonblank, readable rooms.

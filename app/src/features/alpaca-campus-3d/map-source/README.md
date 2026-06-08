# Alpaca Campus Map Source

This folder is the clean map source contract for the 3D campus.

`index.ts` normalizes the current room/runtime data and 3D decorative placements into one shape. Use `getCampusMapRooms()`, `getCampusMapRoomById(roomId)`, or `getCampusMapRoom(room)` when building render, debug, or editor tooling.

- `rooms`
- `backgroundMapAssetKey`
- `spawnPoint` / `spawnPoints`
- `doors`
- `npcs`
- `staticObjects`
- `decorativeObjects`
- `collisionZones`
- `interactionZones`
- `seats`

Every normalized object has:

- `id`
- `type`
- `x`
- `y`
- `assetKey`
- `depthRule`
- optional `collisionBox`
- optional `interactionZone`

For now, room topology, doors, NPCs, runtime objects, collisions, and interaction values still come from `app/src/features/alpaca-campus/data/rooms.js` because the solo/runtime bridge uses that file. Decorative GLB objects still come from `app/src/features/alpaca-campus-3d/environment-assets.ts`.

Rendering, debug overlays, and future editing tools should read through this folder instead of directly stitching those sources together.

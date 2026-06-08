# Alpaca Campus 3D Debug Mode

Press `Q` in the campus to toggle developer debug mode. Debug mode is disabled by default.

Placement helper while debug mode is on:

- Click empty floor to log the world coordinate in the browser console and update `last click`; it does not move the alpaca in debug mode.
- Click an object, decorative asset, non-walkable zone, or Sitting area to select it in the debug editor.
- `Shift` + click shows a ready-to-use `object(...)` snippet and tries to copy it.
- `Alt` + click shows a suggested `rect(...)` collision-box starting point and tries to copy it.
- `R` raises the debug `z` value by `0.05`; `F` lowers it by `0.05`.
- `W/A/S/D` nudges the fluorescent pink debug placement point north/west/south/east by `10` world units. Hold `Shift` for `1`, or `Alt` for `100`.
- The debug editor has Info, Non-walkable, and Sitting area tabs. Zone edits are local drafts until Confirm logs and copies the data for code updates.

The overlay reads from the normalized map source used by gameplay:

- `app/src/features/alpaca-campus-3d/map-source/index.ts` is the clean source contract consumed by render/debug code.
- Room positions, portals, seats, interactable objects, walk bounds, and collision zones currently originate in `app/src/features/alpaca-campus/data/rooms.js`.
- Visual-only GLB placements currently originate in `app/src/features/alpaca-campus-3d/environment-assets.ts`.
- Shared debug formatting helpers live in `app/src/features/alpaca-campus-3d/campus-debug.ts`.

Use `room.blockedZones` for future collision rectangles and ring walls. Use `room.sittingZones` for future Sitting area markers. Use stable `id` values on portals, objects, seats, collision zones, sitting zones, and asset placements so the debug labels match what Robin/Sidi/Taylor are discussing.

Coordinate notes:

- `x/y` values are campus world coordinates, matching the values in `rooms.js`.
- `z` is the vertical placement height used for 3D asset placement. In code this usually maps to an environment placement `height` value.
- The fluorescent pink corner marker is the reliable 3D placement cursor. The exact point is the tiny sphere where the three lines meet. Click sets it; `W/A/S/D` moves it without depending on the mouse pointer.
- The mouse coordinate appears when the cursor is over the room floor.
- The last clicked coordinate stores the active `z` value at the time of the click.
- The tile coordinate uses the debug grid size from `CAMPUS_DEBUG_TILE_SIZE`.

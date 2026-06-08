# Alpaca Campus 3D Content Contract

`content-surfaces.ts` defines the importable content contract for the first five active 3D rooms:

- `school-lobby`: lobby information surface bound to `info`.
- `guiding-library-lounge`: guide shelf surfaces bound to `guide-section`.
- `flashcard-museum`: exhibit, video, and slideshow surfaces bound to `flashcards`, `alpaca-channel`, and `mode-slideshow`.
- `debate-room-1`: debate board surface bound to `debate`.
- `games-hall`: arcade entry surface bound to `path-play`.

The contract does not copy WSC guide, card, video, debate, or game content. It resolves panel titles and world-card labels through `window.WSC_ALPACA_CAMPUS_CONTENT` via `campus-data.ts` when the shared bridge is loaded, and falls back to generic labels when it is not.

Use `getCampusContentSurfaceContract()` for the whole deterministic room map, or `getContentSurfacesForRoom(roomId)` for a single room. Tests and importers can pass a stub `contentApi` to keep assertions independent from browser globals.

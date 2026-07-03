# Refactor Roadmap

## Current Direction

The old separate campus runtime has been removed. The active target is a classic
app architecture with a small 2D campus runtime embedded in the Online mode.

## Near-Term Cleanup

- Keep `app/src/features/campus-2d/` focused on room simulation, rendering,
  input, and realtime presence.
- Keep game creation/join and durable game events inside the existing live-game
  services.
- Move future room lesson/game hotspots into small data manifests before adding
  new UI branching to `app.js`.
- Add Playwright coverage for the Lobby spawn, three portals, chat bubbles,
  color selection, and Games popup.

## Guardrails

- Do not reintroduce a separate bundled campus app.
- Do not add new 3D assets or GLB optimization scripts for this online campus.
- Do not duplicate live-game persistence inside the campus presence channel.

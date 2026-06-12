# Online Mode Boundaries

WSCapp currently has two different online concepts. They should not be treated
as the same system during refactors.

## Public Path: 3D Campus Multiplayer

This is the user-facing `ALPACA ONLINE / Join online` path.

- Entry point: `app/src/app/online-mode-controller.js`
- Backward-compatible URL source: `app/src/app/app-entry-service.js`
- Runtime URL: `./alpaca-campus-3d/?mode=multiplayer`
- Default visible alpaca name: `Devalpacca`
- Login requirement: none
- Current realtime model: 3D campus presence/broadcast through Supabase
  Realtime channels

This path must keep working on GitHub Pages under `/WSCapp/`.

## Legacy/Future Path: Live Game Room Mechanics

This is the older main-app live room system for Alpacapardy and arcade-style
live games. It is not the public `Join online` destination.

- Main orchestration still lives in `app/app.js`.
- Supabase table helpers live in
  `app/src/services/alpacapardy-live-supabase-service.js`.
- Transport-neutral reducers/helpers live under `app/src/modes/play/`.
- SQL setup lives in `app/supabase/alpacapardy_live.sql`.
- This path may require authenticated or anonymous Supabase sessions when a
  user creates or joins a live room.

Treat this as legacy/future MMO game-room work until it is extracted behind a
clear live-room controller and backed by reviewed Supabase RLS/persistence.

## Refactor Rule

Do not add login gating, room-table assumptions, or legacy Alpacapardy live-room
state to the 3D campus launcher. If live game rooms are revived, wire them
through a separately named live-room controller and keep the public campus entry
as `3D campus multiplayer`.

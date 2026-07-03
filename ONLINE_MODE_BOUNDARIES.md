# Online Mode Boundaries

WSCapp now has one public online entry and one live-game subsystem.

## Public Entry: 2D Campus

- Entry path: the main app Online choice.
- Runtime: classic browser scripts under `app/src/features/campus-2d/`.
- First room: Lobby.
- Movement: arrow keys and click/tap-to-move.
- Realtime model: Supabase Realtime presence/broadcast per 2D room.
- Game launcher: the existing online game cards are reused inside the campus
  popup.

The public online entry must stay inside the main app so GitHub Pages and
Vercel deploy the same runtime.

## Live Game Rooms

Live game creation, join, chat, and event persistence still use the existing
Alpacapardy/live-game services:

- `app/src/services/alpacapardy-live-supabase-service.js`
- `app/src/modes/play/live-session-service.js`
- `app/src/modes/play/alpacapardy/alpacapardy-live.js`
- `app/supabase/alpacapardy_live.sql`

The 2D campus is the social shell. A selected game card can still switch into
the existing live-game room UI.

## Refactor Rule

Keep room presence/chat ephemeral in the campus. Keep durable game state in the
live-game subsystem. Do not add a second game-room database model for campus
movement.

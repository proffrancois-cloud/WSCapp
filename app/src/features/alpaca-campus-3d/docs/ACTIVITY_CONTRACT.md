# Activity Contract

`activity-contracts.ts` defines the mini-game surface for the first 3D campus slice. It is intentionally data-only: scene rendering, store state, Supabase wiring, and UI panels should import these constants later rather than re-declare ids.

## Rooms

The active five-room slice is:

- `school-lobby`
- `guiding-library-lounge`
- `flashcard-museum`
- `debate-room-1`
- `games-hall`

The Games Hall can advertise room-local play targets that are not active 3D rooms yet:

- `alpacapardy-hall`
- `alpaca-run-track`
- `alpaca-jump-gym`
- `alpaquiz-relay-room`
- `survivalpaca-arena`

## Debate

`DEBATE_ROOM_1_SEAT_GROUPS` maps existing Debate Room 1 seat ids into proposition, opposition, moderator-flow, and spectator groups. `DEBATE_ROOM_1_ROLE_SURFACES` names the moderator desk, lectern, and whiteboard as role-selection surfaces. `DEBATE_ROOM_1_SPECTATOR_AREA` reserves the back row and bottom aisle for audience state.

## Games Hall

`GAMES_HALL_ARCADE_LAUNCH_TARGETS` is the arcade launch pattern. Each target starts in `games-hall`, points to a deferred room id/spawn id, and publishes `campus3d.activity.launch.requested` before any future UI chooses whether to open a local panel, request a live session, or enter a target room.

`GAMES_HALL_SEAT_GROUPS` provides four team tables plus bleachers, and `GAMES_HALL_SPECTATOR_AREA` gives shared spectator state a stable id.

## Live Alpacapardy

`LIVE_ALPACAPARDY_PLACEHOLDER_CONTRACT` is a placeholder for hosted live play. It names the planned live service key, target room, host surface, board surface, three four-player teams, and live-session event names. It does not imply the 3D runtime can enter `alpacapardy-hall` yet.

## Shared State

Use `ACTIVITY_SHARED_STATE_EVENT_NAMES` for network/store events. Seat, role, spectator, launch, live-session, and generic state-patch names are centralized there so UI and realtime code can agree on payload intent before runtime wiring begins.

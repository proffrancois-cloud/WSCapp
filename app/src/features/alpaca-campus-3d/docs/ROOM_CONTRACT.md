# Alpaca Campus 3D Room Contract

`room-manifest.ts` is the typed handoff for the first 5-room slice. It does not wire runtime behavior directly; David head engineer can import it after the contract gate passes.

## Covered Rooms

- `school-lobby`
- `guiding-library-lounge`
- `flashcard-museum`
- `debate-room-1`
- `games-hall`

## Contract Scope

Each room entry defines:

- Camera defaults for the current avatar-follow camera model.
- Environment style keys that match the existing 3D material presets.
- Portal intent limited to the five active slice rooms.
- Interactable roles for room navigation, content panels, activity launches, and seat claims.
- QA expectations for counts, required spawn ids, smoke checks, and screenshot targets.

## Integration Notes

- The lobby is the only hub in this slice. Every specialist room returns to `school-lobby`.
- Portal ids match the limited five-room room data produced by the existing 2D campus room source.
- Object and seat counts are expectations for the limited five-room data, not the temporary one-room fallback in `campus-data.ts`.
- Activity launch roles are owned by the mini-games contract; this manifest only names the room-local affordances that should trigger them.

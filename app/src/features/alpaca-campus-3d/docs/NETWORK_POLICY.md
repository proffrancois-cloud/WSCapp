# Alpaca Campus 3D Network Policy

Checked against Supabase Realtime Presence and Broadcast docs on 2026-05-27.

## Topology

- Room presence and movement use one Supabase Realtime channel per room: `alpaca-campus::{roomId}`. This preserves compatibility with the current browser room-channel factory.
- Presence uses `clientId` as the Supabase presence key. The presence payload carries identity, avatar, room, seat/activity focus, and interest snapshot. It does not carry high-frequency coordinates.
- Movement is an ephemeral Supabase Broadcast event named `campus3d.avatar.move`.
- Seat, debate, and activity actions are durable events on `alpaca-campus-durable::{roomId}`. The durable lane expects ack/replay semantics once the persistence adapter exists.
- Activity-specific high-interest traffic may use `alpaca-campus-activity::{roomId}::{activityId}` only while the activity is open or the player is seated there.

Presence payload shape:

```ts
{
  v: 1,
  schema: "campus3d.realtime.v1",
  kind: "presence",
  roomId: string,
  clientId: string,
  userId: string,
  displayName: string,
  alpacaName: string,
  avatar: { id: string, name?: string, wool?: string, outfit?: string, accent?: string },
  status: "online" | "away" | "idle" | "walking" | "sitting" | "in_activity",
  seatId?: string,
  activityId?: string,
  interest: {
    mode: "room" | "room-zone" | "activity",
    zoneIds?: string[],
    viewport?: { x: number, y: number, width: number, height: number, paddingPx?: number },
    focusObjectId?: string,
    seatId?: string,
    activityId?: string,
    activityKind?: "debate" | "flashcards" | "games" | "content" | "custom"
  },
  onlineAtMs: number,
  updatedAtMs: number
}
```

## Movement Budget

- Positions are sent only as Broadcast movement frames, not as Presence updates.
- Send rate: 10 Hz maximum, one movement frame every 100 ms.
- Idle heartbeat: 1 Hz maximum, one frame every 1000 ms if the player is still connected but not moving.
- Send only when the player moved at least 3 world pixels, changed target/facing/locomotion, or hit the idle heartbeat.
- Round `x`, `y`, `targetX`, and `targetY` to one decimal place.
- Movement payload target: 384 bytes or less. Do not include display names, large avatar objects, room metadata, or content data in movement frames.
- Current runtime enforcement lives in `campus-network-guardrails.ts`,
  `use-campus-realtime.ts`, and `campus-shared/realtime/room-channel.js`.
  `npm run test:campus-network` checks movement delta/heartbeat decisions,
  oversized-payload rejection, and the 24-player render cap.

Movement payload shape:

```ts
{
  v: 1,
  schema: "campus3d.realtime.v1",
  kind: "move",
  roomId: string,
  clientId: string,
  userId?: string,
  seq: number,
  sentAtMs: number,
  x: number,
  y: number,
  targetX?: number,
  targetY?: number,
  facing?: "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw",
  locomotion: "idle" | "walking" | "sitting" | "in_activity",
  seatId?: string,
  activityId?: string
}
```

## Durable Events

Durable event names are fully qualified and stable:

- Seats: `campus3d.seat.claim.requested`, `campus3d.seat.claimed`, `campus3d.seat.claim.rejected`, `campus3d.seat.released`, `campus3d.seat.expired`
- Debate: `campus3d.debate.session.opened`, `campus3d.debate.motion.selected`, `campus3d.debate.side.assigned`, `campus3d.debate.speech.started`, `campus3d.debate.speech.submitted`, `campus3d.debate.round.closed`
- Activity: `campus3d.activity.opened`, `campus3d.activity.joined`, `campus3d.activity.left`, `campus3d.activity.state.patched`, `campus3d.activity.completed`, `campus3d.activity.closed`

Only `campus3d.seat.claimed` changes authoritative seat occupancy. A claim request may update local optimistic UI, but the first authoritative claim wins until release or expiry. Seat leases last 30 seconds and should heartbeat every 5 seconds.

Durable event envelope:

```ts
{
  v: 1,
  schema: "campus3d.realtime.v1",
  eventId: string,
  eventName: string,
  roomId: string,
  actor: { clientId: string, userId: string, displayName?: string },
  clientSeq: number,
  dedupeKey: string,
  createdAtMs: number,
  payload: Record<string, unknown>
}
```

## Interest Management

- Subscribe to exactly one room presence/movement channel for the current room.
- Leave the old room channel before joining the next room after portal travel.
- Publish `interest.mode`, `zoneIds`, `viewport`, `focusObjectId`, `seatId`, and `activityId` in presence so clients can prioritize rendering nearby or relevant players.
- Join an activity channel only while a player has the activity open, is seated in it, or is hosting it.
- Render at most 24 remote players by default, prioritizing same activity, same zone, then nearest viewport distance.
- Current preview enforcement caps remote players before rendering; deeper
  priority sorting by activity/zone/viewport remains future MMO work.

## Local Fallback

If Supabase config, client, authorization, or subscription is unavailable, the runtime stays playable in `local-only` mode:

- Local movement, room travel, content panels, seat claims, and activity launch still work.
- Remote presence, movement broadcast, durable replay, and single-winner cross-client seat arbitration are disabled.
- Events may be kept in memory for UI consistency, but they must be marked as local-only and must not be replayed as authoritative events later.

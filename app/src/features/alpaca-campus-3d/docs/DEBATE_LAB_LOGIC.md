# Debate Lab Logic

Date: 2026-05-27
Owner: Ira jeux dans jeu
Scope: `debate-room-1` activity logic only. This is a design/logic handoff for Robin architecte and Sidi Yahya artist 3d. Do not treat this file as runtime wiring.

## Purpose

The 3D Debate Lab should feel like World Scholar's Cup Team Debate, not a generic classroom speech game. The room must support one active team-versus-team debate at a time per debate table set, with visible teams, judge/moderator control, preparation, alternating speeches, timers, feedback, spectators, and locked seats that other players can understand from inside the room.

The current first slice already has `debate-room-1`, debate seat groups, a whiteboard, a lectern, a moderator desk role surface, and a spectator area. This document defines the missing logic so visual and runtime owners can build toward the same model.

## WSC Debate Shape

Use the current WSC public event description as the fidelity baseline:

- Team Debate is three-on-three.
- Each team debates multiple times during a tournament day; the 3D room only needs one round instance at a time.
- Motions are tied to WSC subjects/theme content.
- Teams receive 15 minutes of team preparation.
- Each scholar speaks for up to 4 minutes.
- Every team member should speak once in the round.
- After the debate, each team gives constructive feedback to the other team.
- The 2026 public FAQ says teams have no access to devices or the internet during Team Debate. In 3D, show this as a room rule and avoid any in-room "research web" affordance during active prep.

For in-room ordering, use the standard alternating six-speech team flow:

1. Proposition / PRO speaker 1.
2. Opposition / CON speaker 1.
3. Proposition / PRO speaker 2.
4. Opposition / CON speaker 2.
5. Proposition / PRO speaker 3.
6. Opposition / CON speaker 3.

No reply speeches, cross-examination, or open floor are needed for first playable unless a later WSC rules pass explicitly adds them.

## Roles

### Debating Teams

Each active debate has two teams:

- `proposition` / `PRO`: argues for the motion.
- `opposition` / `CON`: argues against the motion.

Each team has exactly three speaker slots:

- `speaker1`: opening case, definitions/framing, first main arguments.
- `speaker2`: extension, evidence/examples, direct rebuttal.
- `speaker3`: final rebuttal, weighing, closing comparison.

The existing front/support seat groups can stay for first playable, but the logic must expose three speaker assignments per side. If the physical room keeps extra support seats, they are observers/research helpers only before the round starts; they are not official speakers in the active round.

### Judge Team

At minimum, one judge controls the round. The room should allow one to three judge seats later.

Judge responsibilities:

- Open or reset a debate session.
- Confirm both teams and speaker slots.
- Reveal or select the motion.
- Start the 15-minute prep timer.
- Start, pause, resume, and end each speech timer.
- Mark speeches complete if a speaker finishes early.
- Enter or attach feedback after the round.
- Close the round.

Do not let debaters advance the official phase unless the judge role is absent and a solo/practice fallback has explicitly granted host rights.

### Moderator / Timekeeper

The moderator/timekeeper may be the same player as the judge in first playable.

Responsibilities:

- Keep the visible room clock synchronized.
- Signal protected/simple speaking states visually: ready, speaking, final minute, time.
- Move the active-speaker indicator between the lectern and the next speaker seat.

### Spectators

Spectators can sit or stand in the spectator area, see the current motion, phase, timer, active speaker, and round status, but cannot:

- Claim debate team seats after seat lock.
- Edit motion, timer, speaker order, scores, or feedback.
- Trigger next phase.

Spectators should have a quiet visual state: visible attendance, optional reactions later, no gameplay authority.

## Seat Locking

Seat locking is required so players cannot scramble the round once it starts.

### Claiming Before Lock

Before the judge locks the table:

- A player may claim one unoccupied seat.
- A player may switch seats if their old claim is released.
- A judge/moderator seat can be claimed independently from team seats.
- Spectator seats remain flexible and can be entered or left at any time.

### Lock Moment

The table locks when the judge confirms the debate setup and starts prep.

At lock:

- `proposition` and `opposition` official speaker slots are frozen.
- Each official speaker slot must map to one player or one practice placeholder.
- The judge/moderator role is frozen unless the judge disconnects.
- Debate team seats display side and speaker number.
- Empty non-official support seats become unavailable for official speaking.

### During Active Debate

While `phase` is `prep`, `speech`, `judge-deliberation`, `feedback`, or `closed`:

- Debaters cannot switch sides.
- Debaters cannot change speaker order.
- A disconnected official speaker stays reserved for a reconnect grace period.
- If the reconnect grace expires, the judge can mark the slot as `forfeit`, `substitute`, or `practice-placeholder`.
- Spectators can still enter/leave spectator seats and standing zones.

### Unlock

Unlock only when the judge closes or resets the round. Closing preserves the round result/notes if persistence exists; resetting discards the live state.

## One Debate At A Time

For first playable, `debate-room-1` has one debate table set and one active debate session:

- Shared state key: `activities.debate-practice.session`.
- Room-level lock key: `activities.debate-practice.tableLock`.
- If a session is active, all debate team and judge role surfaces point to that session.
- New arrivals see the active session state instead of opening a second round.
- A second debate can only begin after the current session reaches `idle`, `closed`, or `reset`.

If Robin later adds multiple physical table sets, each set needs its own table id, physical zones, lock, judge desk, active speaker zone, board slice, and spectator boundary. Do not run multiple debates on the same whiteboard/lectern pair.

## Room-Visible State

Everything important should be visible in the room without opening a hidden panel.

Minimum visible state:

- Session status: idle, forming, prep, speaking, judge deliberation, feedback, closed.
- Motion text or "motion hidden until judge reveal".
- Side assignment: Proposition / PRO and Opposition / CON.
- Team names or player display names for both sides.
- Speaker order with completed/current/next markers.
- Main timer with phase label.
- Active speaker name, side, and speaker number.
- Seat lock status.
- Judge/moderator name.
- Spectator count.

Room state should be readable from three places:

- Main debate board / whiteboard for room-wide status.
- Judge desk panel for controls and feedback.
- Lectern surface for active-speaker status.

## Debate State Machine

Use this phase model when runtime logic is added:

### `idle`

No active debate. Seats are claimable. Board shows "Open Debate Table".

Allowed transitions:

- `idle` -> `forming` when a judge/host opens a session.

### `forming`

Players claim side seats, assign speaker numbers, and confirm judge/moderator. Motion can be hidden, previewed, or selected depending on the practice mode.

Required to advance:

- One judge/host.
- Three proposition speaker slots filled or practice placeholders assigned.
- Three opposition speaker slots filled or practice placeholders assigned.
- One motion selected or queued.

Allowed transitions:

- `forming` -> `prep` when the judge locks seats and reveals the motion.
- `forming` -> `idle` if the judge cancels.

### `prep`

The room displays the motion and a 15-minute prep timer. Debaters can stay at team tables. The lectern is inactive.

Allowed transitions:

- `prep` -> `speech` when the timer reaches zero or the judge starts early.
- `prep` -> `forming` only through judge unlock/reset before any speech starts.

### `speech`

The active speaker is expected at or visually associated with the lectern. The 4-minute speech timer is visible to everyone.

Speech order:

- `proposition.speaker1`
- `opposition.speaker1`
- `proposition.speaker2`
- `opposition.speaker2`
- `proposition.speaker3`
- `opposition.speaker3`

Allowed transitions:

- Current speech -> next speech when judge marks complete or timer expires.
- Final speech -> `judge-deliberation`.
- `speech` -> `paused` if the judge pauses for a disconnect or moderation issue.

### `paused`

The debate is frozen. Timers stop. The board shows who paused it and why.

Allowed transitions:

- `paused` -> prior `speech` state.
- `paused` -> `judge-deliberation` if the judge must end the speech sequence.
- `paused` -> `closed` if the round is abandoned.

### `judge-deliberation`

Judges finalize notes, rankings, and feedback prompts. Debaters and spectators wait. No seat changes.

Allowed transitions:

- `judge-deliberation` -> `feedback`.
- `judge-deliberation` -> `closed` if feedback is skipped in a practice-only mode.

### `feedback`

Each team gives constructive feedback to the other team, matching WSC's community-oriented debate flow. Judges can also show feedback.

Suggested order:

1. Judge summary / decision placeholder.
2. Proposition feedback to Opposition.
3. Opposition feedback to Proposition.
4. Judge improvement notes.

Allowed transitions:

- `feedback` -> `closed`.

### `closed`

The round is complete. Board can show result/summary, feedback saved state, and "reset table" call to action.

Allowed transitions:

- `closed` -> `idle` when the judge resets table for the next debate.

## Timers

Timer defaults:

- Prep: 15:00.
- Each speech: 4:00.
- Feedback segments: configurable, first playable can use untimed or 1:00 each.
- Reconnect grace for official speaker: 1:00.

Timer display requirements:

- Main whiteboard timer must be readable from spectator seating.
- Lectern timer must be visible to the active speaker.
- Judge desk must show controls and exact remaining time.
- Final minute should have a distinct visual treatment.
- Time expired should be obvious but not disruptive; WSC is supportive, so avoid harsh alarm styling.

Network/runtime expectation:

- Store timer authority with the judge/host or server clock, not each client.
- Room clients derive display from `startedAt`, `durationMs`, `pausedAt`, and accumulated pause time.
- Timer ticks are ephemeral; phase changes and speech submissions are durable events.

## Suggested Session State Contract

Future runtime code can map to this shape without baking it into this doc:

```ts
type DebatePhase =
  | "idle"
  | "forming"
  | "prep"
  | "speech"
  | "paused"
  | "judge-deliberation"
  | "feedback"
  | "closed";

type DebateSide = "proposition" | "opposition";

type DebateSessionState = {
  debateId: string;
  roomId: "debate-room-1";
  tableId: "debate-room-1-main-table";
  phase: DebatePhase;
  lockStatus: "unlocked" | "locked";
  motion: {
    id?: string;
    text?: string;
    source: "wsc-debate-lab" | "manual-practice" | "placeholder";
    visible: boolean;
  };
  teams: Record<DebateSide, {
    displayName: string;
    speakerSlots: Array<{
      speakerNumber: 1 | 2 | 3;
      playerId?: string;
      seatId?: string;
      status: "empty" | "claimed" | "locked" | "speaking" | "complete" | "forfeit" | "placeholder";
    }>;
  }>;
  judge: {
    playerId?: string;
    seatId?: string;
    role: "judge" | "judge-moderator" | "practice-host";
  };
  activeSpeech?: {
    side: DebateSide;
    speakerNumber: 1 | 2 | 3;
    startedAt: string;
    durationMs: 240000;
    status: "ready" | "speaking" | "paused" | "complete";
  };
  prepTimer?: {
    startedAt: string;
    durationMs: 900000;
    status: "running" | "paused" | "complete";
  };
  spectators: {
    seatedSeatIds: string[];
    standingCount: number;
  };
};
```

## Physical Zones Robin Must Place

Robin should treat the debate room as a tournament room, not a lecture hall.

Required zones:

- `debate-room-1-main-table-zone`: the whole official debate table set; owns the one-debate-at-a-time lock.
- `debate-room-1-proposition-zone`: left or clearly marked PRO side, visible from entrance and board.
- `debate-room-1-opposition-zone`: right or clearly marked CON side, facing/parallel to PRO.
- `debate-room-1-judge-zone`: centered or front-corner view of both teams, with clean sightline to board and lectern.
- `debate-room-1-active-speaker-zone`: lectern or marked standing spot at the front, visible to teams/judges/spectators.
- `debate-room-1-prep-zone-proposition`: team prep surface for PRO notes during prep.
- `debate-room-1-prep-zone-opposition`: team prep surface for CON notes during prep.
- `debate-room-1-spectator-zone-seated`: audience row behind the teams or along the back wall.
- `debate-room-1-spectator-zone-standing`: bottom/back aisle for overflow spectators.
- `debate-room-1-entry-buffer`: arrival area that does not overlap active speaking, judge desk, or locked seats.

Spatial rules:

- PRO and CON must read as equal status. Do not make one side look like the "teacher" side.
- The active speaker zone must not block the judge desk or whiteboard.
- Spectators should not sit between the judge and debaters.
- The entry path should let late arrivals become spectators without crossing the lectern.
- If the room is too small, keep debate tables and judge desk; reduce decorative furniture first.

## Physical Tables, Boards, And Surfaces Sidi Yahya Must Build

Required physical objects/surfaces:

- Main debate board / whiteboard: dynamic surface for motion, phase, speaker order, and main timer.
- Judge/moderator desk: role claim surface plus control/readout surface.
- Speaker lectern: active-speaker surface with small timer/readout.
- Proposition table: three official speaker seats, with optional non-official support stools clearly secondary.
- Opposition table: three official speaker seats, with optional non-official support stools clearly secondary.
- Spectator seating row: non-authority seats, visually separate from team tables.
- Standing spectator boundary: subtle floor marking or back-aisle zone.
- Seat lock indicators: small lamps/tags/rings that can show unlocked, claimed, locked, active, complete.
- Side labels: dynamic or neutral labels for "Proposition / PRO" and "Opposition / CON"; do not bake current team names into art.
- Timer light or status strip: calm visible treatment for prep, speaking, final minute, and time.

Do not bake the following into meshes or static textures:

- Motion text.
- Team names.
- Player names.
- Scores/results.
- Timer numbers.
- Current WSC topic/category.
- Feedback text.

Stable suggested node names for asset planning:

- `SURFACE__debate-room-1-whiteboard`
- `SURFACE__debate-room-1-lectern`
- `SURFACE__debate-room-1-judge-desk`
- `ZONE__debate-room-1-main-table`
- `ZONE__debate-room-1-proposition`
- `ZONE__debate-room-1-opposition`
- `ZONE__debate-room-1-active-speaker`
- `ZONE__debate-room-1-spectators-seated`
- `ZONE__debate-room-1-spectators-standing`
- `ANCHOR__debate-proposition-speaker-1`
- `ANCHOR__debate-proposition-speaker-2`
- `ANCHOR__debate-proposition-speaker-3`
- `ANCHOR__debate-opposition-speaker-1`
- `ANCHOR__debate-opposition-speaker-2`
- `ANCHOR__debate-opposition-speaker-3`
- `ANCHOR__debate-judge-1`
- `ANCHOR__debate-judge-2`
- `ANCHOR__debate-judge-3`
- `ANCHOR__debate-lectern-speaker`

## Interaction Surfaces

Whiteboard:

- Opens room-visible debate status.
- Shows motion, phase, speaker order, timer, and lock status.
- Can be clicked by judge/host to select or reveal a motion.

Judge desk:

- Claims judge/moderator role.
- Opens setup controls in `forming`.
- Opens timer controls in `prep` and `speech`.
- Opens feedback/results controls in `judge-deliberation` and `feedback`.

Lectern:

- Shows active speaker prompt.
- Allows the active speaker to mark "ready" or "finished early" if judge settings allow it.
- Does not let non-active speakers hijack the timer.

Team seats:

- Claim side and speaker number before lock.
- Show side/speaker badges after lock.
- Move active marker to the speaker's seat and lectern during their speech.

Spectator seats/standing zone:

- Claim spectator presence.
- Show read-only round status.

## Event And Persistence Boundaries

Use the existing durable debate event family when runtime wiring arrives:

- `campus3d.debate.session.opened`
- `campus3d.debate.motion.selected`
- `campus3d.debate.side.assigned`
- `campus3d.debate.speech.started`
- `campus3d.debate.speech.submitted`
- `campus3d.debate.round.closed`

Additional events likely needed later:

- `campus3d.debate.table.locked`
- `campus3d.debate.table.unlocked`
- `campus3d.debate.timer.paused`
- `campus3d.debate.timer.resumed`
- `campus3d.debate.feedback.submitted`
- `campus3d.debate.speaker.reassigned`

Ephemeral state:

- Timer ticks.
- Presence, hovering, ready indicators, and standing spectator count.
- In-room chat or reactions.
- Temporary draft notes unless explicitly saved.

Durable state:

- Session opened/closed.
- Motion selected.
- Seat lock and official speaker assignments.
- Speech start/submit/completion events.
- Judge result/feedback if product decides to save practice history.

## First-Playable Acceptance Checklist

- [ ] Entering `debate-room-1` shows one obvious debate table set, not multiple ambiguous classroom clusters.
- [ ] PRO and CON sides are visible and equally weighted.
- [ ] Judge/moderator position has authority without looking like a team side.
- [ ] Spectators have a clear place that does not interfere with debaters.
- [ ] A room-visible board can show motion, phase, timer, speaker order, and seat lock.
- [ ] A lectern/active speaker zone exists and is visually connected to the current speaker.
- [ ] Seat labels can show side plus speaker number after lock.
- [ ] Only one active debate session can exist for the table.
- [ ] Prep phase uses 15 minutes.
- [ ] Speech phase uses six alternating 4-minute speeches.
- [ ] Judge feedback and team-to-team constructive feedback have a visible post-round phase.
- [ ] No dynamic WSC content is baked into 3D art.

## Risks

- WSC rules can evolve by season. Keep timings and no-device messaging configurable, even though the 2026 public FAQ supports the no-device rule.
- The existing seat groups currently expose front/support buckets, not exact official `speaker1`/`speaker2`/`speaker3` seats. Runtime will need a speaker-slot mapping layer or adjusted seat ids.
- If support seats look official, users may expect more than three speakers per side. Art should make official speaker seats unmistakable.
- Multiple table sets would multiply timer, board, judge, and lock complexity. First playable should stay at one table.
- If timers are client-owned, reconnects and spectators will drift. Timer authority needs a shared/server-derived clock.

## Next Questions

- Should first playable support practice placeholders for missing debaters, or require six live debaters before prep can start?
- Should the judge enter an actual winner/score in this prototype, or only feedback and completion?
- Should motions come only from existing `WSC_DEBATE_LAB_DATA`, or can judges create manual practice motions?
- Should feedback be saved to user/team history, or remain ephemeral for the first multiplayer slice?

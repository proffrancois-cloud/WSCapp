export const ACTIVITY_CONTRACT_VERSION = "campus3d.activity-contract.v1" as const;

export const FIVE_ROOM_ACTIVITY_ROOM_IDS = [
  "school-lobby",
  "guiding-library-lounge",
  "flashcard-museum",
  "debate-room-1",
  "games-hall"
] as const;

export type FiveRoomActivityRoomId = (typeof FIVE_ROOM_ACTIVITY_ROOM_IDS)[number];

export const ROOM_LOCAL_ACTIVITY_TARGET_ROOM_IDS = [
  "alpacapardy-hall",
  "alpaca-run-track",
  "alpaca-jump-gym",
  "alpaquiz-relay-room",
  "survivalpaca-arena"
] as const;

export type RoomLocalActivityTargetRoomId = (typeof ROOM_LOCAL_ACTIVITY_TARGET_ROOM_IDS)[number];

export type ActivityContractRoomId = FiveRoomActivityRoomId | RoomLocalActivityTargetRoomId;

export const MINI_GAME_ACTIVITY_IDS = [
  "debate-practice",
  "games-hall-arcade",
  "live-alpacapardy",
  "alpaca-run",
  "alpaca-jump",
  "alpaquiz-relay",
  "survivalpaca"
] as const;

export type MiniGameActivityId = (typeof MINI_GAME_ACTIVITY_IDS)[number];

export const ACTIVITY_SHARED_STATE_EVENT_NAMES = {
  ACTIVITY_FOCUSED: "campus3d.activity.focused",
  ACTIVITY_CLEARED: "campus3d.activity.cleared",
  SEAT_CLAIM_REQUESTED: "campus3d.activity.seat.claim.requested",
  SEAT_CLAIM_CONFIRMED: "campus3d.activity.seat.claim.confirmed",
  SEAT_RELEASE_REQUESTED: "campus3d.activity.seat.release.requested",
  ROLE_SELECTED: "campus3d.activity.role.selected",
  SPECTATOR_JOINED: "campus3d.activity.spectator.joined",
  SPECTATOR_LEFT: "campus3d.activity.spectator.left",
  LAUNCH_TARGET_SELECTED: "campus3d.activity.launchTarget.selected",
  LAUNCH_REQUESTED: "campus3d.activity.launch.requested",
  LAUNCH_STARTED: "campus3d.activity.launch.started",
  LAUNCH_FAILED: "campus3d.activity.launch.failed",
  LIVE_SESSION_PLACEHOLDER_OPENED: "campus3d.activity.liveSession.placeholder.opened",
  LIVE_SESSION_REQUESTED: "campus3d.activity.liveSession.requested",
  LIVE_SESSION_JOIN_REQUESTED: "campus3d.activity.liveSession.join.requested",
  STATE_PATCH_PUBLISHED: "campus3d.activity.state.patch.published"
} as const;

export const ACTIVITY_EVENT_NAMES = ACTIVITY_SHARED_STATE_EVENT_NAMES;

export type ActivityEventName = (typeof ACTIVITY_SHARED_STATE_EVENT_NAMES)[keyof typeof ACTIVITY_SHARED_STATE_EVENT_NAMES];

export type ActivitySurfaceKind =
  | "arcade"
  | "bleacher"
  | "board"
  | "control"
  | "lectern"
  | "screen"
  | "seat"
  | "stage"
  | "table";

export type ActivitySeatRole =
  | "contestant"
  | "host"
  | "judge"
  | "moderator"
  | "opposition-researcher"
  | "opposition-speaker"
  | "proposition-researcher"
  | "proposition-speaker"
  | "scorekeeper"
  | "spectator"
  | "timekeeper";

export type ActivitySide =
  | "audience"
  | "neutral"
  | "opposition"
  | "proposition"
  | "team-a"
  | "team-b"
  | "team-c"
  | "team-d";

export type ActivitySeatGroup = {
  id: string;
  activityId: MiniGameActivityId;
  roomId: ActivityContractRoomId;
  label: string;
  role: ActivitySeatRole;
  surfaceKind: ActivitySurfaceKind;
  seatIds: readonly string[];
  capacity: number;
  side: ActivitySide;
  tableZoneId?: string;
  tableZoneIds?: readonly string[];
  surfaceItemId?: string;
  sharedStateKey: string;
};

export type ActivityRoleSurface = {
  id: string;
  activityId: MiniGameActivityId;
  roomId: ActivityContractRoomId;
  label: string;
  surfaceKind: ActivitySurfaceKind;
  roleIds: readonly ActivitySeatRole[];
  surfaceItemId: string;
  eventName: ActivityEventName;
};

export type ActivitySpectatorArea = {
  id: string;
  activityId: MiniGameActivityId;
  roomId: ActivityContractRoomId;
  label: string;
  seatGroupIds: readonly string[];
  seatIds: readonly string[];
  standingZoneIds: readonly string[];
  joinEventName: ActivityEventName;
  leaveEventName: ActivityEventName;
  sharedStateKey: string;
};

export type ActivityLaunchAvailability = "deferred" | "placeholder" | "ready";

export type ActivityLaunchPattern = "enter-target-room" | "open-room-local-panel" | "request-live-session";

export type ActivityLaunchTarget = {
  id: string;
  activityId: MiniGameActivityId;
  roomId: FiveRoomActivityRoomId;
  label: string;
  triggerItemId: string;
  targetRoomId: RoomLocalActivityTargetRoomId;
  targetSpawnId: string;
  pathId: "play";
  modeId: string;
  availability: ActivityLaunchAvailability;
  launchPattern: readonly ActivityLaunchPattern[];
  eventName: ActivityEventName;
  fallbackPanelId: string;
  minPlayers: number;
  maxPlayers?: number;
  spectatorAreaId?: string;
};

export type CampusActivityContract = {
  id: MiniGameActivityId;
  roomId: ActivityContractRoomId;
  title: string;
  summary: string;
  availability: ActivityLaunchAvailability;
  seatGroupIds: readonly string[];
  surfaceIds: readonly string[];
  launchTargetIds: readonly string[];
  eventNames: readonly ActivityEventName[];
};

export const DEBATE_ROLE_IDS = [
  "moderator",
  "judge",
  "timekeeper",
  "proposition-speaker",
  "proposition-researcher",
  "opposition-speaker",
  "opposition-researcher",
  "spectator"
] as const satisfies readonly ActivitySeatRole[];

export type DebateRoleId = (typeof DEBATE_ROLE_IDS)[number];

export const DEBATE_ROOM_1_SEAT_GROUPS = [
  {
    id: "debate-room-1-proposition-front-table",
    activityId: "debate-practice",
    roomId: "debate-room-1",
    label: "Proposition front table",
    role: "proposition-speaker",
    surfaceKind: "table",
    seatIds: ["debate-room-1-student-1", "debate-room-1-student-2"],
    capacity: 2,
    side: "proposition",
    tableZoneId: "student-desk-a",
    sharedStateKey: "activities.debate-practice.roles.proposition.front"
  },
  {
    id: "debate-room-1-proposition-support-table",
    activityId: "debate-practice",
    roomId: "debate-room-1",
    label: "Proposition support table",
    role: "proposition-researcher",
    surfaceKind: "table",
    seatIds: ["debate-room-1-student-7", "debate-room-1-student-8"],
    capacity: 2,
    side: "proposition",
    tableZoneId: "student-desk-d",
    sharedStateKey: "activities.debate-practice.roles.proposition.support"
  },
  {
    id: "debate-room-1-opposition-front-table",
    activityId: "debate-practice",
    roomId: "debate-room-1",
    label: "Opposition front table",
    role: "opposition-speaker",
    surfaceKind: "table",
    seatIds: ["debate-room-1-student-5", "debate-room-1-student-6"],
    capacity: 2,
    side: "opposition",
    tableZoneId: "student-desk-c",
    sharedStateKey: "activities.debate-practice.roles.opposition.front"
  },
  {
    id: "debate-room-1-opposition-support-table",
    activityId: "debate-practice",
    roomId: "debate-room-1",
    label: "Opposition support table",
    role: "opposition-researcher",
    surfaceKind: "table",
    seatIds: ["debate-room-1-student-13", "debate-room-1-student-14"],
    capacity: 2,
    side: "opposition",
    tableZoneId: "student-desk-g",
    sharedStateKey: "activities.debate-practice.roles.opposition.support"
  },
  {
    id: "debate-room-1-flow-table",
    activityId: "debate-practice",
    roomId: "debate-room-1",
    label: "Moderator flow table",
    role: "timekeeper",
    surfaceKind: "table",
    seatIds: [
      "debate-room-1-student-3",
      "debate-room-1-student-4",
      "debate-room-1-student-9",
      "debate-room-1-student-10",
      "debate-room-1-student-11",
      "debate-room-1-student-12"
    ],
    capacity: 6,
    side: "neutral",
    tableZoneId: "student-desk-b",
    tableZoneIds: ["student-desk-b", "student-desk-e", "student-desk-f"],
    sharedStateKey: "activities.debate-practice.roles.neutral.flow"
  },
  {
    id: "debate-room-1-spectator-row",
    activityId: "debate-practice",
    roomId: "debate-room-1",
    label: "Spectator row",
    role: "spectator",
    surfaceKind: "seat",
    seatIds: [
      "debate-room-1-student-15",
      "debate-room-1-student-16",
      "debate-room-1-student-17",
      "debate-room-1-student-18",
      "debate-room-1-student-19",
      "debate-room-1-student-20"
    ],
    capacity: 6,
    side: "audience",
    tableZoneId: "student-desk-h",
    tableZoneIds: ["student-desk-h", "student-desk-i", "student-desk-j"],
    sharedStateKey: "activities.debate-practice.spectators.seated"
  }
] as const satisfies readonly ActivitySeatGroup[];

export const DEBATE_ROOM_1_ROLE_SURFACES = [
  {
    id: "debate-room-1-moderator-desk-role",
    activityId: "debate-practice",
    roomId: "debate-room-1",
    label: "Moderator desk",
    surfaceKind: "control",
    roleIds: ["moderator", "judge", "timekeeper"],
    surfaceItemId: "debate-room-1-moderator-desk",
    eventName: ACTIVITY_EVENT_NAMES.ROLE_SELECTED
  },
  {
    id: "debate-room-1-speaker-lectern-role",
    activityId: "debate-practice",
    roomId: "debate-room-1",
    label: "Speaker lectern",
    surfaceKind: "lectern",
    roleIds: ["proposition-speaker", "opposition-speaker"],
    surfaceItemId: "debate-room-1-lectern",
    eventName: ACTIVITY_EVENT_NAMES.ROLE_SELECTED
  },
  {
    id: "debate-room-1-whiteboard-role",
    activityId: "debate-practice",
    roomId: "debate-room-1",
    label: "Debate whiteboard",
    surfaceKind: "board",
    roleIds: ["moderator", "judge", "proposition-researcher", "opposition-researcher"],
    surfaceItemId: "debate-room-1-whiteboard",
    eventName: ACTIVITY_EVENT_NAMES.ACTIVITY_FOCUSED
  }
] as const satisfies readonly ActivityRoleSurface[];

export const DEBATE_ROOM_1_SPECTATOR_AREA = {
  id: "debate-room-1-spectator-area",
  activityId: "debate-practice",
  roomId: "debate-room-1",
  label: "Back-row spectators",
  seatGroupIds: ["debate-room-1-spectator-row"],
  seatIds: [
    "debate-room-1-student-15",
    "debate-room-1-student-16",
    "debate-room-1-student-17",
    "debate-room-1-student-18",
    "debate-room-1-student-19",
    "debate-room-1-student-20"
  ],
  standingZoneIds: ["debate-classroom-bottom-aisle"],
  joinEventName: ACTIVITY_EVENT_NAMES.SPECTATOR_JOINED,
  leaveEventName: ACTIVITY_EVENT_NAMES.SPECTATOR_LEFT,
  sharedStateKey: "activities.debate-practice.spectators"
} as const satisfies ActivitySpectatorArea;

export const GAMES_HALL_SEAT_GROUPS = [
  {
    id: "games-hall-team-table-a",
    activityId: "games-hall-arcade",
    roomId: "games-hall",
    label: "Team table A",
    role: "contestant",
    surfaceKind: "table",
    seatIds: ["games-table-a-1", "games-table-a-2", "games-table-a-3", "games-table-a-4"],
    capacity: 4,
    side: "team-a",
    tableZoneId: "games-team-table-a",
    sharedStateKey: "activities.games-hall-arcade.tables.teamA"
  },
  {
    id: "games-hall-team-table-b",
    activityId: "games-hall-arcade",
    roomId: "games-hall",
    label: "Team table B",
    role: "contestant",
    surfaceKind: "table",
    seatIds: ["games-table-a-5", "games-table-a-6", "games-table-a-7", "games-table-a-8"],
    capacity: 4,
    side: "team-b",
    tableZoneId: "games-team-table-b",
    sharedStateKey: "activities.games-hall-arcade.tables.teamB"
  },
  {
    id: "games-hall-team-table-c",
    activityId: "games-hall-arcade",
    roomId: "games-hall",
    label: "Team table C",
    role: "contestant",
    surfaceKind: "table",
    seatIds: ["games-table-a-9", "games-table-a-10", "games-table-a-11", "games-table-a-12"],
    capacity: 4,
    side: "team-c",
    tableZoneId: "games-team-table-c",
    sharedStateKey: "activities.games-hall-arcade.tables.teamC"
  },
  {
    id: "games-hall-spectator-bleachers",
    activityId: "games-hall-arcade",
    roomId: "games-hall",
    label: "Games hall bleachers",
    role: "spectator",
    surfaceKind: "bleacher",
    seatIds: [
      "games-bleacher-left-1",
      "games-bleacher-left-2",
      "games-bleacher-left-3",
      "games-bleacher-left-4",
      "games-bleacher-left-5",
      "games-bleacher-left-6",
      "games-bleacher-left-7",
      "games-bleacher-left-8"
    ],
    capacity: 8,
    side: "audience",
    sharedStateKey: "activities.games-hall-arcade.spectators.seated"
  },
  {
    id: "games-hall-team-table-d",
    activityId: "games-hall-arcade",
    roomId: "games-hall",
    label: "Team table D",
    role: "contestant",
    surfaceKind: "table",
    seatIds: ["games-table-a-13", "games-table-a-14", "games-table-a-15", "games-table-a-16"],
    capacity: 4,
    side: "team-d",
    tableZoneId: "games-team-table-d",
    sharedStateKey: "activities.games-hall-arcade.tables.teamD"
  }
] as const satisfies readonly ActivitySeatGroup[];

export const GAMES_HALL_SPECTATOR_AREA = {
  id: "games-hall-spectator-area",
  activityId: "games-hall-arcade",
  roomId: "games-hall",
  label: "Games hall bleachers",
  seatGroupIds: ["games-hall-spectator-bleachers"],
  seatIds: [
    "games-bleacher-left-1",
    "games-bleacher-left-2",
    "games-bleacher-left-3",
    "games-bleacher-left-4",
    "games-bleacher-left-5",
    "games-bleacher-left-6",
    "games-bleacher-left-7",
    "games-bleacher-left-8"
  ],
  standingZoneIds: ["games-left-door-aisle", "games-right-door-aisle"],
  joinEventName: ACTIVITY_EVENT_NAMES.SPECTATOR_JOINED,
  leaveEventName: ACTIVITY_EVENT_NAMES.SPECTATOR_LEFT,
  sharedStateKey: "activities.games-hall-arcade.spectators"
} as const satisfies ActivitySpectatorArea;

export const LIVE_ALPACAPARDY_SEAT_GROUPS = [
  {
    id: "alpacapardy-team-a",
    activityId: "live-alpacapardy",
    roomId: "alpacapardy-hall",
    label: "Alpacapardy team A",
    role: "contestant",
    surfaceKind: "table",
    seatIds: ["alpacapardy-team-1", "alpacapardy-team-2", "alpacapardy-team-3", "alpacapardy-team-4"],
    capacity: 4,
    side: "team-a",
    tableZoneId: "alpacapardy-team-a-table",
    sharedStateKey: "activities.live-alpacapardy.teams.teamA"
  },
  {
    id: "alpacapardy-team-b",
    activityId: "live-alpacapardy",
    roomId: "alpacapardy-hall",
    label: "Alpacapardy team B",
    role: "contestant",
    surfaceKind: "table",
    seatIds: ["alpacapardy-team-5", "alpacapardy-team-6", "alpacapardy-team-7", "alpacapardy-team-8"],
    capacity: 4,
    side: "team-b",
    tableZoneId: "alpacapardy-team-b-table",
    sharedStateKey: "activities.live-alpacapardy.teams.teamB"
  },
  {
    id: "alpacapardy-team-c",
    activityId: "live-alpacapardy",
    roomId: "alpacapardy-hall",
    label: "Alpacapardy team C",
    role: "contestant",
    surfaceKind: "table",
    seatIds: ["alpacapardy-team-9", "alpacapardy-team-10", "alpacapardy-team-11", "alpacapardy-team-12"],
    capacity: 4,
    side: "team-c",
    tableZoneId: "alpacapardy-team-c-table",
    sharedStateKey: "activities.live-alpacapardy.teams.teamC"
  }
] as const satisfies readonly ActivitySeatGroup[];

export const GAMES_HALL_ARCADE_LAUNCH_TARGETS = [
  {
    id: "games-hall-launch-alpacapardy",
    activityId: "live-alpacapardy",
    roomId: "games-hall",
    label: "Launch Alpacapardy",
    triggerItemId: "games-alpacapardy",
    targetRoomId: "alpacapardy-hall",
    targetSpawnId: "games",
    pathId: "play",
    modeId: "jeopardy",
    availability: "placeholder",
    launchPattern: ["open-room-local-panel", "request-live-session", "enter-target-room"],
    eventName: ACTIVITY_EVENT_NAMES.LAUNCH_REQUESTED,
    fallbackPanelId: "alpacapardy-live-placeholder",
    minPlayers: 1,
    maxPlayers: 12,
    spectatorAreaId: "games-hall-spectator-area"
  },
  {
    id: "games-hall-launch-alpaca-run",
    activityId: "alpaca-run",
    roomId: "games-hall",
    label: "Launch Alpaca Run",
    triggerItemId: "games-run",
    targetRoomId: "alpaca-run-track",
    targetSpawnId: "games",
    pathId: "play",
    modeId: "run",
    availability: "deferred",
    launchPattern: ["open-room-local-panel", "enter-target-room"],
    eventName: ACTIVITY_EVENT_NAMES.LAUNCH_REQUESTED,
    fallbackPanelId: "alpaca-run-placeholder",
    minPlayers: 1,
    spectatorAreaId: "games-hall-spectator-area"
  },
  {
    id: "games-hall-launch-alpaca-jump",
    activityId: "alpaca-jump",
    roomId: "games-hall",
    label: "Launch Alpaca Jump",
    triggerItemId: "games-jump",
    targetRoomId: "alpaca-jump-gym",
    targetSpawnId: "games",
    pathId: "play",
    modeId: "jump",
    availability: "deferred",
    launchPattern: ["open-room-local-panel", "enter-target-room"],
    eventName: ACTIVITY_EVENT_NAMES.LAUNCH_REQUESTED,
    fallbackPanelId: "alpaca-jump-placeholder",
    minPlayers: 1,
    spectatorAreaId: "games-hall-spectator-area"
  },
  {
    id: "games-hall-launch-alpaquiz-relay",
    activityId: "alpaquiz-relay",
    roomId: "games-hall",
    label: "Launch Alpaquiz Relay",
    triggerItemId: "games-relay",
    targetRoomId: "alpaquiz-relay-room",
    targetSpawnId: "games",
    pathId: "play",
    modeId: "relay",
    availability: "deferred",
    launchPattern: ["open-room-local-panel", "enter-target-room"],
    eventName: ACTIVITY_EVENT_NAMES.LAUNCH_REQUESTED,
    fallbackPanelId: "alpaquiz-relay-placeholder",
    minPlayers: 2,
    maxPlayers: 16,
    spectatorAreaId: "games-hall-spectator-area"
  },
  {
    id: "games-hall-launch-survivalpaca",
    activityId: "survivalpaca",
    roomId: "games-hall",
    label: "Launch Survivalpaca",
    triggerItemId: "games-survival",
    targetRoomId: "survivalpaca-arena",
    targetSpawnId: "games",
    pathId: "play",
    modeId: "race",
    availability: "deferred",
    launchPattern: ["open-room-local-panel", "enter-target-room"],
    eventName: ACTIVITY_EVENT_NAMES.LAUNCH_REQUESTED,
    fallbackPanelId: "survivalpaca-placeholder",
    minPlayers: 2,
    spectatorAreaId: "games-hall-spectator-area"
  }
] as const satisfies readonly ActivityLaunchTarget[];

export type GamesHallArcadeLaunchTargetId = (typeof GAMES_HALL_ARCADE_LAUNCH_TARGETS)[number]["id"];

export const LIVE_ALPACAPARDY_PLACEHOLDER_CONTRACT = {
  id: "live-alpacapardy",
  roomId: "games-hall",
  targetRoomId: "alpacapardy-hall",
  launchTargetId: "games-hall-launch-alpacapardy",
  title: "Live Alpacapardy",
  summary: "Placeholder contract for a hosted live Jeopardy-style activity launched from the Games Hall.",
  availability: "placeholder",
  serviceKey: "alpacapardy-live",
  gameType: "alpacapardy",
  boardSurfaceId: "alpacapardy-board",
  hostSurfaceId: "alpacapardy-host",
  teamSeatGroupIds: ["alpacapardy-team-a", "alpacapardy-team-b", "alpacapardy-team-c"],
  maxTeams: 3,
  playersPerTeam: 4,
  eventNames: [
    ACTIVITY_EVENT_NAMES.LIVE_SESSION_PLACEHOLDER_OPENED,
    ACTIVITY_EVENT_NAMES.LIVE_SESSION_REQUESTED,
    ACTIVITY_EVENT_NAMES.LIVE_SESSION_JOIN_REQUESTED,
    ACTIVITY_EVENT_NAMES.STATE_PATCH_PUBLISHED
  ]
} as const;

export const CAMPUS_ACTIVITY_CONTRACTS = [
  {
    id: "debate-practice",
    roomId: "debate-room-1",
    title: "Debate Room Practice",
    summary: "Assigns proposition, opposition, moderator, flow, and spectator roles to Debate Room 1 seats.",
    availability: "ready",
    seatGroupIds: DEBATE_ROOM_1_SEAT_GROUPS.map((group) => group.id),
    surfaceIds: DEBATE_ROOM_1_ROLE_SURFACES.map((surface) => surface.id),
    launchTargetIds: [],
    eventNames: [
      ACTIVITY_EVENT_NAMES.ACTIVITY_FOCUSED,
      ACTIVITY_EVENT_NAMES.SEAT_CLAIM_REQUESTED,
      ACTIVITY_EVENT_NAMES.SEAT_CLAIM_CONFIRMED,
      ACTIVITY_EVENT_NAMES.SEAT_RELEASE_REQUESTED,
      ACTIVITY_EVENT_NAMES.ROLE_SELECTED,
      ACTIVITY_EVENT_NAMES.SPECTATOR_JOINED,
      ACTIVITY_EVENT_NAMES.SPECTATOR_LEFT
    ]
  },
  {
    id: "games-hall-arcade",
    roomId: "games-hall",
    title: "Games Hall Arcade",
    summary: "Room-local launch hub for play-path activities without requiring runtime scene changes.",
    availability: "placeholder",
    seatGroupIds: GAMES_HALL_SEAT_GROUPS.map((group) => group.id),
    surfaceIds: ["games-scoreboard", "games-trophy-display", "games-host-alpaca"],
    launchTargetIds: GAMES_HALL_ARCADE_LAUNCH_TARGETS.map((target) => target.id),
    eventNames: [
      ACTIVITY_EVENT_NAMES.LAUNCH_TARGET_SELECTED,
      ACTIVITY_EVENT_NAMES.LAUNCH_REQUESTED,
      ACTIVITY_EVENT_NAMES.LAUNCH_STARTED,
      ACTIVITY_EVENT_NAMES.LAUNCH_FAILED,
      ACTIVITY_EVENT_NAMES.SPECTATOR_JOINED,
      ACTIVITY_EVENT_NAMES.SPECTATOR_LEFT
    ]
  },
  {
    id: "live-alpacapardy",
    roomId: "alpacapardy-hall",
    title: "Live Alpacapardy",
    summary: LIVE_ALPACAPARDY_PLACEHOLDER_CONTRACT.summary,
    availability: "placeholder",
    seatGroupIds: LIVE_ALPACAPARDY_SEAT_GROUPS.map((group) => group.id),
    surfaceIds: ["alpacapardy-board", "alpacapardy-host"],
    launchTargetIds: ["games-hall-launch-alpacapardy"],
    eventNames: LIVE_ALPACAPARDY_PLACEHOLDER_CONTRACT.eventNames
  }
] as const satisfies readonly CampusActivityContract[];

export const ACTIVITY_SEAT_GROUPS = [
  ...DEBATE_ROOM_1_SEAT_GROUPS,
  ...GAMES_HALL_SEAT_GROUPS,
  ...LIVE_ALPACAPARDY_SEAT_GROUPS
] as const satisfies readonly ActivitySeatGroup[];

export const ACTIVITY_SPECTATOR_AREAS = [
  DEBATE_ROOM_1_SPECTATOR_AREA,
  GAMES_HALL_SPECTATOR_AREA
] as const satisfies readonly ActivitySpectatorArea[];

export type SeatClaimEventPayload = {
  activityId: MiniGameActivityId;
  roomId: ActivityContractRoomId;
  seatId: string;
  seatGroupId: string;
  role: ActivitySeatRole;
  actorClientId: string;
  requestId: string;
};

export type LaunchTargetEventPayload = {
  activityId: MiniGameActivityId;
  roomId: FiveRoomActivityRoomId;
  launchTargetId: GamesHallArcadeLaunchTargetId;
  triggerItemId: string;
  targetRoomId: RoomLocalActivityTargetRoomId;
  targetSpawnId: string;
  actorClientId: string;
  requestId: string;
};

export type SpectatorEventPayload = {
  activityId: MiniGameActivityId;
  roomId: ActivityContractRoomId;
  spectatorAreaId: string;
  seatId?: string;
  actorClientId: string;
};

export type ActivitySharedStateEvent =
  | {
      name:
        | typeof ACTIVITY_EVENT_NAMES.SEAT_CLAIM_REQUESTED
        | typeof ACTIVITY_EVENT_NAMES.SEAT_CLAIM_CONFIRMED
        | typeof ACTIVITY_EVENT_NAMES.SEAT_RELEASE_REQUESTED;
      payload: SeatClaimEventPayload;
    }
  | {
      name:
        | typeof ACTIVITY_EVENT_NAMES.LAUNCH_TARGET_SELECTED
        | typeof ACTIVITY_EVENT_NAMES.LAUNCH_REQUESTED
        | typeof ACTIVITY_EVENT_NAMES.LAUNCH_STARTED
        | typeof ACTIVITY_EVENT_NAMES.LAUNCH_FAILED;
      payload: LaunchTargetEventPayload;
    }
  | {
      name: typeof ACTIVITY_EVENT_NAMES.SPECTATOR_JOINED | typeof ACTIVITY_EVENT_NAMES.SPECTATOR_LEFT;
      payload: SpectatorEventPayload;
    }
  | {
      name:
        | typeof ACTIVITY_EVENT_NAMES.ACTIVITY_FOCUSED
        | typeof ACTIVITY_EVENT_NAMES.ACTIVITY_CLEARED
        | typeof ACTIVITY_EVENT_NAMES.ROLE_SELECTED
        | typeof ACTIVITY_EVENT_NAMES.LIVE_SESSION_PLACEHOLDER_OPENED
        | typeof ACTIVITY_EVENT_NAMES.LIVE_SESSION_REQUESTED
        | typeof ACTIVITY_EVENT_NAMES.LIVE_SESSION_JOIN_REQUESTED
        | typeof ACTIVITY_EVENT_NAMES.STATE_PATCH_PUBLISHED;
      payload: Record<string, unknown>;
    };

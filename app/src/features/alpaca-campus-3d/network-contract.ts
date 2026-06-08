export const CAMPUS_NETWORK_PROTOCOL_VERSION = 1 as const;
export const CAMPUS_NETWORK_PROTOCOL_NAME = "campus3d.realtime" as const;
export const CAMPUS_NETWORK_SCHEMA = "campus3d.realtime.v1" as const;

export const CAMPUS_NETWORK_TOPICS = {
  roomPrefix: "alpaca-campus::",
  durablePrefix: "alpaca-campus-durable::",
  activityPrefix: "alpaca-campus-activity::",
  maxTopicPartLength: 64
} as const;

export const CAMPUS_NETWORK_EVENTS = {
  avatarMove: "campus3d.avatar.move",
  avatarEmote: "campus3d.avatar.emote",
  seatClaimRequested: "campus3d.seat.claim.requested",
  seatClaimed: "campus3d.seat.claimed",
  seatClaimRejected: "campus3d.seat.claim.rejected",
  seatReleased: "campus3d.seat.released",
  seatExpired: "campus3d.seat.expired",
  debateSessionOpened: "campus3d.debate.session.opened",
  debateMotionSelected: "campus3d.debate.motion.selected",
  debateSideAssigned: "campus3d.debate.side.assigned",
  debateSpeechStarted: "campus3d.debate.speech.started",
  debateSpeechSubmitted: "campus3d.debate.speech.submitted",
  debateRoundClosed: "campus3d.debate.round.closed",
  activityOpened: "campus3d.activity.opened",
  activityJoined: "campus3d.activity.joined",
  activityLeft: "campus3d.activity.left",
  activityStatePatched: "campus3d.activity.state.patched",
  activityCompleted: "campus3d.activity.completed",
  activityClosed: "campus3d.activity.closed"
} as const;

export const CAMPUS_EPHEMERAL_BROADCAST_EVENT_NAMES = [
  CAMPUS_NETWORK_EVENTS.avatarMove,
  CAMPUS_NETWORK_EVENTS.avatarEmote
] as const;

export const CAMPUS_DURABLE_EVENT_NAMES = [
  CAMPUS_NETWORK_EVENTS.seatClaimRequested,
  CAMPUS_NETWORK_EVENTS.seatClaimed,
  CAMPUS_NETWORK_EVENTS.seatClaimRejected,
  CAMPUS_NETWORK_EVENTS.seatReleased,
  CAMPUS_NETWORK_EVENTS.seatExpired,
  CAMPUS_NETWORK_EVENTS.debateSessionOpened,
  CAMPUS_NETWORK_EVENTS.debateMotionSelected,
  CAMPUS_NETWORK_EVENTS.debateSideAssigned,
  CAMPUS_NETWORK_EVENTS.debateSpeechStarted,
  CAMPUS_NETWORK_EVENTS.debateSpeechSubmitted,
  CAMPUS_NETWORK_EVENTS.debateRoundClosed,
  CAMPUS_NETWORK_EVENTS.activityOpened,
  CAMPUS_NETWORK_EVENTS.activityJoined,
  CAMPUS_NETWORK_EVENTS.activityLeft,
  CAMPUS_NETWORK_EVENTS.activityStatePatched,
  CAMPUS_NETWORK_EVENTS.activityCompleted,
  CAMPUS_NETWORK_EVENTS.activityClosed
] as const;

export const CAMPUS_MOVEMENT_POLICY = {
  sendHz: 10,
  sendIntervalMs: 100,
  idleHeartbeatHz: 1,
  idleHeartbeatIntervalMs: 1000,
  minPositionDeltaPx: 3,
  positionDecimalPlaces: 1,
  interpolationBufferMs: 120,
  staleRemoteAfterMs: 5000,
  maxPayloadBytes: 384
} as const;

export const CAMPUS_PRESENCE_POLICY = {
  presenceKeyField: "clientId",
  refreshHz: 1,
  refreshIntervalMs: 1000,
  staleAfterMs: 10000,
  maxPayloadBytes: 1024
} as const;

export const CAMPUS_DURABLE_EVENT_POLICY = {
  ackRequired: true,
  replayLimit: 25,
  retryAttempts: 3,
  retryBaseDelayMs: 250,
  maxPayloadBytes: 2048
} as const;

export const CAMPUS_SEAT_POLICY = {
  leaseMs: 30000,
  heartbeatMs: 5000,
  winnerEvent: CAMPUS_NETWORK_EVENTS.seatClaimed,
  conflictRule: "first-authoritative-seat-claim-wins-until-release-or-expiry"
} as const;

export const CAMPUS_INTEREST_POLICY = {
  defaultMode: "room",
  highFrequencyRadiusPx: 900,
  viewportPaddingPx: 360,
  maxRenderedRemotePlayers: 24,
  maxPresenceZoneIds: 4,
  activityChannelOnlyWhileOpen: true
} as const;

export const CAMPUS_SUPABASE_REALTIME_POLICY = {
  roomPresenceMovement: {
    topicPrefix: CAMPUS_NETWORK_TOPICS.roomPrefix,
    roomScoped: true,
    extensions: ["presence", "broadcast"],
    private: false,
    broadcastSelf: false,
    broadcastAck: false,
    presenceKeyField: CAMPUS_PRESENCE_POLICY.presenceKeyField,
    receivesOwnPresenceEvents: true
  },
  durableEvents: {
    topicPrefix: CAMPUS_NETWORK_TOPICS.durablePrefix,
    roomScoped: true,
    extensions: ["broadcast"],
    private: true,
    broadcastSelf: false,
    broadcastAck: CAMPUS_DURABLE_EVENT_POLICY.ackRequired,
    replayLimit: CAMPUS_DURABLE_EVENT_POLICY.replayLimit,
    persistence: "append-event-first-then-broadcast"
  },
  activityInterest: {
    topicPrefix: CAMPUS_NETWORK_TOPICS.activityPrefix,
    roomScoped: true,
    extensions: ["broadcast"],
    private: true,
    broadcastSelf: false,
    broadcastAck: true,
    joinRule: "only-while-activity-open-or-player-seated"
  }
} as const;

export const CAMPUS_NETWORK_FALLBACK_POLICY = {
  mode: "local-only",
  statusLabel: "Local prototype",
  preservesLocalMovement: true,
  preservesLocalSeatClaims: true,
  preservesLocalActivityLaunch: true,
  disablesRemotePresence: true,
  disablesDurableReplay: true
} as const;

export type CampusNetworkSchema = typeof CAMPUS_NETWORK_SCHEMA;
export type CampusNetworkEventName = (typeof CAMPUS_NETWORK_EVENTS)[keyof typeof CAMPUS_NETWORK_EVENTS];
export type CampusEphemeralBroadcastEventName = (typeof CAMPUS_EPHEMERAL_BROADCAST_EVENT_NAMES)[number];
export type CampusDurableEventName = (typeof CAMPUS_DURABLE_EVENT_NAMES)[number];
export type CampusNetworkDeliveryMode = "supabase-realtime" | "local-only";
export type CampusNetworkFallbackReason =
  | "missing-supabase-config"
  | "missing-supabase-client"
  | "channel-factory-unavailable"
  | "subscribe-timeout"
  | "permission-denied"
  | "network-unavailable";

export type CampusNetworkRoomId = string;
export type CampusNetworkClientId = string;
export type CampusNetworkUserId = string;
export type CampusNetworkSeatId = string;
export type CampusNetworkActivityId = string;

export type CampusNetworkVector2 = {
  x: number;
  y: number;
};

export type CampusAvatarFacing = "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw";
export type CampusLocomotionState = "idle" | "walking" | "sitting" | "in_activity";
export type CampusPresenceStatus = CampusLocomotionState | "online" | "away";

export type CampusAvatarSnapshot = {
  id: string;
  name?: string;
  wool?: string;
  outfit?: string;
  accent?: string;
  textureId?: string;
};

export type CampusInterestMode = "room" | "room-zone" | "activity";

export type CampusViewportInterest = CampusNetworkVector2 & {
  width: number;
  height: number;
  paddingPx?: number;
};

export type CampusInterestSnapshot = {
  mode: CampusInterestMode;
  zoneIds?: string[];
  viewport?: CampusViewportInterest;
  focusObjectId?: string;
  seatId?: CampusNetworkSeatId;
  activityId?: CampusNetworkActivityId;
  activityKind?: "debate" | "flashcards" | "games" | "content" | "custom";
};

export type CampusPresencePayload = {
  v: typeof CAMPUS_NETWORK_PROTOCOL_VERSION;
  schema: CampusNetworkSchema;
  kind: "presence";
  roomId: CampusNetworkRoomId;
  clientId: CampusNetworkClientId;
  userId: CampusNetworkUserId;
  displayName: string;
  alpacaName: string;
  avatar: CampusAvatarSnapshot;
  status: CampusPresenceStatus;
  x: number;
  y: number;
  targetX?: number;
  targetY?: number;
  facing?: CampusAvatarFacing;
  seatId?: CampusNetworkSeatId;
  activityId?: CampusNetworkActivityId;
  interest: CampusInterestSnapshot;
  onlineAtMs: number;
  updatedAtMs: number;
};

export type CampusMovementPayload = {
  v: typeof CAMPUS_NETWORK_PROTOCOL_VERSION;
  schema: CampusNetworkSchema;
  kind: "move";
  roomId: CampusNetworkRoomId;
  clientId: CampusNetworkClientId;
  userId?: CampusNetworkUserId;
  seq: number;
  sentAtMs: number;
  x: number;
  y: number;
  targetX?: number;
  targetY?: number;
  facing?: CampusAvatarFacing;
  locomotion: CampusLocomotionState;
  seatId?: CampusNetworkSeatId;
  activityId?: CampusNetworkActivityId;
};

export type CampusEventActor = {
  clientId: CampusNetworkClientId;
  userId: CampusNetworkUserId;
  displayName?: string;
};

export type CampusDurableEventEnvelope<
  TEventName extends CampusDurableEventName = CampusDurableEventName,
  TPayload = Record<string, unknown>
> = {
  v: typeof CAMPUS_NETWORK_PROTOCOL_VERSION;
  schema: CampusNetworkSchema;
  eventId: string;
  eventName: TEventName;
  roomId: CampusNetworkRoomId;
  actor: CampusEventActor;
  clientSeq: number;
  dedupeKey: string;
  createdAtMs: number;
  payload: TPayload;
};

export type CampusSeatAction = "claim-request" | "claim" | "reject" | "release" | "expire" | "heartbeat";

export type CampusSeatEventPayload = {
  action: CampusSeatAction;
  seatId: CampusNetworkSeatId;
  seatGroupId?: string;
  occupantClientId?: CampusNetworkClientId;
  occupantUserId?: CampusNetworkUserId;
  previousOccupantClientId?: CampusNetworkClientId;
  leaseExpiresAtMs?: number;
  reason?: "user-action" | "room-exit" | "timeout" | "conflict" | "moderator";
};

export type CampusDebatePhase =
  | "lobby"
  | "motion"
  | "prep"
  | "speech"
  | "rebuttal"
  | "vote"
  | "closed";

export type CampusDebateSide = "pro" | "con" | "judge" | "observer";

export type CampusDebateEventPayload = {
  debateId: string;
  phase: CampusDebatePhase;
  motionId?: string;
  motionText?: string;
  side?: CampusDebateSide;
  speakerClientId?: CampusNetworkClientId;
  roundIndex?: number;
  timerStartedAtMs?: number;
  timerDurationMs?: number;
  submittedText?: string;
  scorePatch?: Record<string, number>;
};

export type CampusActivityPhase = "opened" | "joining" | "active" | "completed" | "closed";

export type CampusActivityEventPayload = {
  activityId: CampusNetworkActivityId;
  activityKind: "debate" | "flashcards" | "games" | "content" | "custom";
  phase: CampusActivityPhase;
  hostClientId?: CampusNetworkClientId;
  participantClientIds?: CampusNetworkClientId[];
  objectId?: string;
  statePatch?: Record<string, unknown>;
  result?: Record<string, unknown>;
};

export type CampusDurableSeatEvent = CampusDurableEventEnvelope<
  Extract<CampusDurableEventName, `campus3d.seat.${string}`>,
  CampusSeatEventPayload
>;

export type CampusDurableDebateEvent = CampusDurableEventEnvelope<
  Extract<CampusDurableEventName, `campus3d.debate.${string}`>,
  CampusDebateEventPayload
>;

export type CampusDurableActivityEvent = CampusDurableEventEnvelope<
  Extract<CampusDurableEventName, `campus3d.activity.${string}`>,
  CampusActivityEventPayload
>;

export type CampusDurableEvent =
  | CampusDurableSeatEvent
  | CampusDurableDebateEvent
  | CampusDurableActivityEvent;

export type CampusNetworkSendResult = {
  ok: boolean;
  mode: CampusNetworkDeliveryMode;
  eventName?: CampusNetworkEventName;
  reason?: CampusNetworkFallbackReason;
  queued?: boolean;
  replayed?: boolean;
};

export function sanitizeCampusNetworkTopicPart(value: string): string {
  return (
    value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9_-]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, CAMPUS_NETWORK_TOPICS.maxTopicPartLength) || "room"
  );
}

export function getCampusRoomTopic(roomId: CampusNetworkRoomId): string {
  return `${CAMPUS_NETWORK_TOPICS.roomPrefix}${sanitizeCampusNetworkTopicPart(roomId)}`;
}

export function getCampusDurableTopic(roomId: CampusNetworkRoomId): string {
  return `${CAMPUS_NETWORK_TOPICS.durablePrefix}${sanitizeCampusNetworkTopicPart(roomId)}`;
}

export function getCampusActivityTopic(
  roomId: CampusNetworkRoomId,
  activityId: CampusNetworkActivityId
): string {
  return [
    CAMPUS_NETWORK_TOPICS.activityPrefix,
    sanitizeCampusNetworkTopicPart(roomId),
    "::",
    sanitizeCampusNetworkTopicPart(activityId)
  ].join("");
}

export function isCampusDurableEventName(eventName: string): eventName is CampusDurableEventName {
  return (CAMPUS_DURABLE_EVENT_NAMES as readonly string[]).includes(eventName);
}

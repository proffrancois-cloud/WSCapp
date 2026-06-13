import {
  CAMPUS_INTEREST_POLICY,
  CAMPUS_MOVEMENT_POLICY
} from "./network-contract";

export type CampusMovementSnapshot = {
  roomId: string;
  x: number;
  y: number;
  targetX?: number;
  targetY?: number;
  seatId?: string;
  activityId?: string;
  locomotion?: string;
};

export type MovementFrameDecision = {
  shouldSend: boolean;
  reason: "initial" | "context" | "target" | "delta" | "heartbeat" | "throttle";
  deltaPx: number;
};

export type RemotePlayerCandidate = {
  clientId?: string;
  updatedAtMs?: number;
  sentAtMs?: number;
  onlineAtMs?: number;
};

export function getJsonPayloadByteSize(payload: unknown): number {
  try {
    const json = JSON.stringify(payload);
    if (typeof json !== "string") {
      return 0;
    }

    if (typeof TextEncoder !== "undefined") {
      return new TextEncoder().encode(json).byteLength;
    }

    return json.length;
  } catch (_error) {
    return Number.POSITIVE_INFINITY;
  }
}

export function isPayloadWithinByteLimit(payload: unknown, maxBytes: number): boolean {
  return getJsonPayloadByteSize(payload) <= maxBytes;
}

export function sanitizeNetworkText(value: unknown, fallback: string, maxLength = 48): string {
  const normalized = String(value || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
  return normalized || fallback;
}

export function sanitizeNetworkId(value: unknown, fallback: string, maxLength = 80): string {
  const normalized = String(value || "")
    .trim()
    .replace(/[^\w:.-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, maxLength);
  return normalized || fallback;
}

export function sanitizeNetworkCoordinate(value: unknown, fallback = 0): number {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return fallback;
  }

  return Math.max(-10000, Math.min(10000, numeric));
}

function hasTargetChanged(previous: CampusMovementSnapshot, next: CampusMovementSnapshot): boolean {
  return previous.targetX !== next.targetX || previous.targetY !== next.targetY;
}

function hasContextChanged(previous: CampusMovementSnapshot, next: CampusMovementSnapshot): boolean {
  return (
    previous.roomId !== next.roomId ||
    previous.seatId !== next.seatId ||
    previous.activityId !== next.activityId ||
    previous.locomotion !== next.locomotion
  );
}

export function shouldSendMovementFrame({
  previous,
  next,
  nowMs,
  lastSentAtMs,
  forceHeartbeat = false
}: {
  previous: CampusMovementSnapshot | null;
  next: CampusMovementSnapshot;
  nowMs: number;
  lastSentAtMs: number;
  forceHeartbeat?: boolean;
}): MovementFrameDecision {
  if (!previous) {
    return { shouldSend: true, reason: "initial", deltaPx: Number.POSITIVE_INFINITY };
  }

  const deltaPx = Math.hypot(next.x - previous.x, next.y - previous.y);
  const heartbeatDue = nowMs - lastSentAtMs >= CAMPUS_MOVEMENT_POLICY.idleHeartbeatIntervalMs;
  const sendDue = nowMs - lastSentAtMs >= CAMPUS_MOVEMENT_POLICY.sendIntervalMs;

  if (hasContextChanged(previous, next)) {
    return { shouldSend: sendDue || forceHeartbeat, reason: "context", deltaPx };
  }

  if (hasTargetChanged(previous, next)) {
    return { shouldSend: sendDue || forceHeartbeat, reason: "target", deltaPx };
  }

  if (deltaPx >= CAMPUS_MOVEMENT_POLICY.minPositionDeltaPx) {
    return { shouldSend: sendDue || forceHeartbeat, reason: "delta", deltaPx };
  }

  if (heartbeatDue) {
    return { shouldSend: true, reason: "heartbeat", deltaPx };
  }

  return { shouldSend: false, reason: "throttle", deltaPx };
}

export function selectRenderedRemotePlayers<T extends RemotePlayerCandidate>(
  players: T[],
  maxPlayers = CAMPUS_INTEREST_POLICY.maxRenderedRemotePlayers
): T[] {
  const byClientId = new Map<string, T>();

  players.forEach((player) => {
    const clientId = String(player.clientId || "");
    if (!clientId || byClientId.has(clientId)) {
      return;
    }

    byClientId.set(clientId, player);
  });

  return Array.from(byClientId.values()).slice(0, maxPlayers);
}

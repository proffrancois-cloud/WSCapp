import { create } from "zustand";
import {
  type CampusItem,
  type CampusPanel,
  type CampusPoint,
  type CampusRoom,
  type CampusZone,
  getDistance,
  getPanelForItem,
  getRoom,
  getRoomItems,
  getRoomsApi,
  getSpawnPoint,
  getWorldContentForItem,
  type WorldContentCard
} from "./campus-data";
import { PLAYER_ALPACA_VARIANTS } from "./avatar-assets";
import {
  CAMPUS_DEBUG_DEFAULT_Z,
  CAMPUS_DEBUG_Z_MAX,
  CAMPUS_DEBUG_Z_MIN,
  roundDebugZ,
  type CampusDebugPlacementClick
} from "./campus-debug";

export type AlpacaAvatar = {
  id: string;
  name: string;
  wool: string;
  outfit: string;
  accent: string;
  textureId: string;
};

export type CampusPlayer = CampusPoint & {
  clientId: string;
  userId: string;
  displayName: string;
  alpacaName: string;
  avatar: AlpacaAvatar;
  targetX?: number;
  targetY?: number;
  seatId?: string;
  activityId?: string;
};

export type OpenPanelState = {
  item: CampusItem | null;
  panel: CampusPanel;
  content: WorldContentCard | null;
};

export type CampusLaunchMode = "local" | "multiplayer";

export type CampusChatMessage = {
  id: string;
  roomId: string;
  clientId: string;
  userId: string;
  displayName: string;
  alpacaName: string;
  message: string;
  avatarWool: string;
  avatarAccent: string;
  sentAtMs: number;
  expiresAtMs: number;
  isLocal?: boolean;
};

export type CampusViewSettings = {
  yaw: number;
  distance: number;
  height: number;
  light: number;
};

export type CampusSeatRuntimeEvent = {
  action: "claim" | "release";
  seatId: string;
  roomId: string;
  clientId: string;
  requestId: string;
  sentAtMs: number;
};

export type CampusDebugZoneKind = "blocked" | "sitting";

export type CampusDebugSelection = {
  roomId: string;
  targetType: "item" | "asset" | "zone";
  id: string;
  zoneKind?: CampusDebugZoneKind;
};

export function getCampusDebugZoneDraftKey(roomId: string, zoneKind: CampusDebugZoneKind, zoneId: string): string {
  return `${roomId}:${zoneKind}:${zoneId}`;
}

type CampusState = {
  rooms: CampusRoom[];
  campusMode: CampusLaunchMode | null;
  currentRoomId: string;
  localPlayer: CampusPlayer;
  remotePlayers: CampusPlayer[];
  chatMessages: CampusChatMessage[];
  movementTarget: CampusPoint | null;
  debugMode: boolean;
  debugMouseWorld: CampusPoint | null;
  debugLastMapClick: CampusDebugPlacementClick | null;
  debugPlacementZ: number;
  debugPlacementPoint: CampusPoint | null;
  debugSelection: CampusDebugSelection | null;
  debugZoneDrafts: Record<string, CampusZone>;
  openPanel: OpenPanelState | null;
  realtimeStatus: string;
  claimedSeatId: string | null;
  occupiedSeats: Record<string, string>;
  pendingSeatEvent: CampusSeatRuntimeEvent | null;
  pendingChatMessage: CampusChatMessage | null;
  viewSettings: CampusViewSettings;
  setCampusMode: (mode: CampusLaunchMode) => void;
  setRoom: (roomId: string, spawnId?: string) => void;
  setMovementTarget: (point: CampusPoint | null) => void;
  setPlayerPosition: (point: CampusPoint) => void;
  stepLocalPlayer: (deltaSeconds: number) => void;
  toggleDebugMode: () => void;
  setDebugMouseWorld: (point: CampusPoint | null) => void;
  setDebugLastMapClick: (click: CampusDebugPlacementClick | null) => void;
  nudgeDebugPlacementZ: (delta: number) => void;
  setDebugPlacementPoint: (point: CampusPoint | null) => void;
  nudgeDebugPlacementPoint: (delta: CampusPoint) => void;
  selectDebugTarget: (selection: CampusDebugSelection | null) => void;
  setDebugZoneDraft: (roomId: string, zoneKind: CampusDebugZoneKind, zone: CampusZone) => void;
  resetDebugZoneDraft: (roomId: string, zoneKind: CampusDebugZoneKind, zoneId: string) => void;
  chooseAvatar: (avatar: AlpacaAvatar) => void;
  nudgeViewSettings: (delta: Partial<CampusViewSettings>) => void;
  setViewLook: (look: Pick<CampusViewSettings, "yaw" | "height">) => void;
  setViewLight: (light: number) => void;
  resetViewSettings: () => void;
  openItemPanel: (item: CampusItem) => void;
  closePanel: () => void;
  claimSeat: (seat: CampusItem) => void;
  setRealtimeStatus: (status: string) => void;
  setRemotePlayers: (players: Partial<CampusPlayer>[]) => void;
  upsertRemotePlayer: (player: Partial<CampusPlayer>) => void;
  syncSeatEvent: (event: CampusSeatRuntimeEvent) => void;
  clearPendingSeatEvent: (requestId: string) => void;
  sendChatMessage: (message: string) => void;
  receiveChatMessage: (payload: Record<string, unknown>) => void;
  clearPendingChatMessage: (id: string) => void;
  pruneChatMessages: (nowMs?: number) => void;
};

export const avatarOptions: AlpacaAvatar[] = [
  ...PLAYER_ALPACA_VARIANTS.map((variant) => ({
    id: variant.id,
    name: variant.name,
    wool: variant.wool,
    outfit: "#24323a",
    accent: variant.accent,
    textureId: variant.id
  }))
];

const LOCAL_AVATAR_KEY = "wsc-campus-3d-avatar";
const INITIAL_ROOM_ID = "campus-courtyard";
export const DEFAULT_LOCAL_ALPACA_NAME = "Scholar Alpaca";
export const DEFAULT_ONLINE_ALPACA_NAME = "Devalpacca";
const CHAT_MESSAGE_TTL_MS = 12800;
const CHAT_MESSAGE_LIMIT = 8;
export const PLAYER_BLOCKING_RADIUS = 52;
export const PLAYER_BLOCKING_FRONT_Y_REDUCTION = 40;
export const PLAYER_BLOCKING_FRONT_RADIUS = Math.max(0, PLAYER_BLOCKING_RADIUS - PLAYER_BLOCKING_FRONT_Y_REDUCTION);
export const PLAYER_BLOCKING_BOUNDS = {
  left: PLAYER_BLOCKING_RADIUS,
  right: PLAYER_BLOCKING_RADIUS,
  backY: PLAYER_BLOCKING_RADIUS,
  frontY: PLAYER_BLOCKING_FRONT_RADIUS
} as const;
const VIEW_LOOK_YAW_LIMIT = Math.PI / 4;
const VIEW_LOOK_VERTICAL_LIMIT = 0.52;
const VIEW_ZOOM_MIN = 0.72;
const VIEW_ZOOM_MAX = 1.58;
type PlayerBlockingBounds = {
  left: number;
  right: number;
  backY: number;
  frontY: number;
};
const DEFAULT_VIEW_SETTINGS: CampusViewSettings = {
  yaw: 0,
  distance: 1,
  height: 0,
  light: 1.85
};

function readSavedAvatar(): AlpacaAvatar {
  try {
    const saved = window.localStorage.getItem(LOCAL_AVATAR_KEY);
    if (saved) {
      const parsed = JSON.parse(saved) as AlpacaAvatar;
      return avatarOptions.find((avatar) => avatar.id === parsed.id) || avatarOptions[0];
    }
  } catch (_error) {}

  return avatarOptions[0];
}

function createClientId(): string {
  const random = Math.random().toString(36).slice(2, 9);
  return `campus3d-${Date.now().toString(36)}-${random}`;
}

function createChatMessageId(): string {
  const random = Math.random().toString(36).slice(2, 8);
  return `chat-${Date.now().toString(36)}-${random}`;
}

function normalizeChatText(value: unknown): string {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 180);
}

function clampNumber(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function resolveAvatar(avatar: Partial<AlpacaAvatar> | undefined, fallbackAvatar = avatarOptions[0]): AlpacaAvatar {
  if (!avatar?.id) {
    return fallbackAvatar;
  }

  return avatarOptions.find((option) => option.id === avatar.id) || {
    ...fallbackAvatar,
    ...avatar,
    id: String(avatar.id),
    name: String(avatar.name || fallbackAvatar.name),
    wool: String(avatar.wool || fallbackAvatar.wool),
    outfit: String(avatar.outfit || fallbackAvatar.outfit),
    accent: String(avatar.accent || fallbackAvatar.accent),
    textureId: String(avatar.textureId || avatar.id)
  };
}

function normalizePlayer(player: Partial<CampusPlayer>, fallbackAvatar = avatarOptions[0]): CampusPlayer {
  return {
    clientId: String(player.clientId || player.userId || createClientId()),
    userId: String(player.userId || player.clientId || "guest"),
    displayName: String(player.displayName || player.alpacaName || "Scholar"),
    alpacaName: String(player.alpacaName || player.displayName || "Scholar"),
    avatar: resolveAvatar(player.avatar as Partial<AlpacaAvatar> | undefined, fallbackAvatar),
    x: Number(player.x) || 0,
    y: Number(player.y) || 0,
    targetX: Number(player.targetX) || undefined,
    targetY: Number(player.targetY) || undefined,
    seatId: player.seatId ? String(player.seatId) : undefined,
    activityId: player.activityId ? String(player.activityId) : undefined
  };
}

function createRequestId(): string {
  const random = Math.random().toString(36).slice(2, 8);
  return `seat-${Date.now().toString(36)}-${random}`;
}

function shouldIncomingSeatWin(currentClientId: string, incomingClientId: string): boolean {
  if (!currentClientId) {
    return true;
  }

  return incomingClientId.localeCompare(currentClientId) < 0;
}

function clampToWalkBounds(room: CampusRoom, point: CampusPoint): CampusPoint {
  const bounds = room.walkBounds || {
    x: 0,
    y: 0,
    width: room.world.width,
    height: room.world.height
  };

  return {
    x: Math.max(bounds.x, Math.min(bounds.x + bounds.width, point.x)),
    y: Math.max(bounds.y, Math.min(bounds.y + bounds.height, point.y))
  };
}

function clampToRoomWorld(room: CampusRoom, point: CampusPoint): CampusPoint {
  return {
    x: Math.round(clampNumber(point.x, 0, room.world.width)),
    y: Math.round(clampNumber(point.y, 0, room.world.height))
  };
}

function clampToDebugReferenceBounds(room: CampusRoom, point: CampusPoint): CampusPoint {
  const clamped = room.walkBounds ? clampToWalkBounds(room, point) : clampToRoomWorld(room, point);

  return {
    x: Math.round(clamped.x),
    y: Math.round(clamped.y)
  };
}

function isPointBlocked(room: CampusRoom, point: CampusPoint): boolean {
  return getBlockedDepth(room, point) > 0;
}

function getBlockedZoneCenter(zone: CampusZone): CampusPoint {
  return zone.center || {
    x: zone.x + zone.width / 2,
    y: zone.y + zone.height / 2
  };
}

function getZoneBlockingBounds(zone: CampusZone): PlayerBlockingBounds {
  const padding = zone.collisionPadding;

  if (typeof padding === "number") {
    return {
      left: padding,
      right: padding,
      backY: padding,
      frontY: padding
    };
  }

  if (padding && typeof padding === "object") {
    return {
      left: typeof padding.left === "number" ? padding.left : PLAYER_BLOCKING_BOUNDS.left,
      right: typeof padding.right === "number" ? padding.right : PLAYER_BLOCKING_BOUNDS.right,
      backY: typeof padding.backY === "number" ? padding.backY : PLAYER_BLOCKING_BOUNDS.backY,
      frontY: typeof padding.frontY === "number" ? padding.frontY : PLAYER_BLOCKING_BOUNDS.frontY
    };
  }

  return PLAYER_BLOCKING_BOUNDS;
}

function getRingBlockedDepth(zone: CampusZone, point: CampusPoint): number {
  if (zone.shape !== "ring" || typeof zone.radius !== "number") {
    return 0;
  }

  const center = getBlockedZoneCenter(zone);
  const thickness = typeof zone.thickness === "number" ? zone.thickness : 48;
  const blockingBounds = getZoneBlockingBounds(zone);
  const yRadius = point.y >= center.y ? blockingBounds.frontY : blockingBounds.backY;
  const expandedHalfThickness = thickness / 2 + yRadius;
  const distanceFromRing = Math.abs(getDistance(point, center) - zone.radius);

  return Math.max(0, expandedHalfThickness - distanceFromRing);
}

function getClosestPointOnSegment(point: CampusPoint, start: CampusPoint, end: CampusPoint): CampusPoint {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const lengthSquared = dx * dx + dy * dy;

  if (lengthSquared === 0) {
    return start;
  }

  const t = Math.max(0, Math.min(1, ((point.x - start.x) * dx + (point.y - start.y) * dy) / lengthSquared));
  return {
    x: start.x + t * dx,
    y: start.y + t * dy
  };
}

function getDistanceToSegment(point: CampusPoint, start: CampusPoint, end: CampusPoint): number {
  return getDistance(point, getClosestPointOnSegment(point, start, end));
}

function getPathBlockedDepth(zone: CampusZone, point: CampusPoint): number {
  if (zone.shape !== "path" || !Array.isArray(zone.points) || zone.points.length < 2) {
    return 0;
  }

  const closest = zone.points.slice(1).reduce<{ distance: number; point: CampusPoint | null }>((closestSegment, segmentEnd, index) => {
    const segmentStart = zone.points?.[index];
    if (!segmentStart) {
      return closestSegment;
    }

    const segmentPoint = getClosestPointOnSegment(point, segmentStart, segmentEnd);
    const distance = getDistance(point, segmentPoint);
    return distance < closestSegment.distance ? { distance, point: segmentPoint } : closestSegment;
  }, { distance: Infinity, point: null });
  const blockingBounds = getZoneBlockingBounds(zone);
  const yRadius = closest.point && point.y >= closest.point.y ? blockingBounds.frontY : blockingBounds.backY;
  const halfThickness = (typeof zone.thickness === "number" ? zone.thickness : 46) / 2 + yRadius;

  return Math.max(0, halfThickness - closest.distance);
}

function getBlockedDepth(room: CampusRoom, point: CampusPoint): number {
  return (room.blockedZones || []).reduce((deepest, zone) => {
    if (zone.shape === "ring") {
      return Math.max(deepest, getRingBlockedDepth(zone, point));
    }

    if (zone.shape === "path") {
      return Math.max(deepest, getPathBlockedDepth(zone, point));
    }

    const blockingBounds = getZoneBlockingBounds(zone);
    const left = zone.x - blockingBounds.left;
    const right = zone.x + zone.width + blockingBounds.right;
    const top = zone.y - blockingBounds.backY;
    const bottom = zone.y + zone.height + blockingBounds.frontY;

    if (point.x < left || point.x > right || point.y < top || point.y > bottom) {
      return deepest;
    }

    return Math.max(deepest, Math.min(point.x - left, right - point.x, point.y - top, bottom - point.y));
  }, 0);
}

function resolveBlockedMovement(room: CampusRoom, current: CampusPoint, desired: CampusPoint): CampusPoint {
  const target = clampToWalkBounds(room, desired);
  const currentBlockedDepth = getBlockedDepth(room, current);
  const targetBlockedDepth = getBlockedDepth(room, target);

  if (targetBlockedDepth === 0 || (currentBlockedDepth > 0 && targetBlockedDepth < currentBlockedDepth)) {
    return target;
  }

  const xOnly = clampToWalkBounds(room, { x: target.x, y: current.y });
  const xOnlyBlockedDepth = getBlockedDepth(room, xOnly);
  if (xOnlyBlockedDepth === 0 || (currentBlockedDepth > 0 && xOnlyBlockedDepth < currentBlockedDepth)) {
    return xOnly;
  }

  const yOnly = clampToWalkBounds(room, { x: current.x, y: target.y });
  const yOnlyBlockedDepth = getBlockedDepth(room, yOnly);
  if (yOnlyBlockedDepth === 0 || (currentBlockedDepth > 0 && yOnlyBlockedDepth < currentBlockedDepth)) {
    return yOnly;
  }

  return clampToWalkBounds(room, current);
}

function getInitialPlayer(): CampusPlayer {
  const spawn = getSpawnPoint(INITIAL_ROOM_ID);

  return {
    clientId: createClientId(),
    userId: "local-scholar",
    displayName: DEFAULT_LOCAL_ALPACA_NAME,
    alpacaName: DEFAULT_LOCAL_ALPACA_NAME,
    avatar: readSavedAvatar(),
    x: spawn.x,
    y: spawn.y
  };
}

function createChatMessage({
  roomId,
  player,
  message,
  id = createChatMessageId(),
  sentAtMs = Date.now(),
  isLocal = false
}: {
  roomId: string;
  player: CampusPlayer;
  message: string;
  id?: string;
  sentAtMs?: number;
  isLocal?: boolean;
}): CampusChatMessage {
  return {
    id,
    roomId,
    clientId: player.clientId,
    userId: player.userId,
    displayName: player.displayName || player.alpacaName || "Alpaca",
    alpacaName: player.alpacaName || player.displayName || "Alpaca",
    message,
    avatarWool: player.avatar.wool,
    avatarAccent: player.avatar.accent,
    sentAtMs,
    expiresAtMs: sentAtMs + CHAT_MESSAGE_TTL_MS,
    isLocal
  };
}

function appendChatMessage(messages: CampusChatMessage[], message: CampusChatMessage): CampusChatMessage[] {
  const nowMs = Date.now();
  return [
    ...messages
      .filter((entry) => entry.id !== message.id && entry.expiresAtMs > nowMs)
      .slice(-(CHAT_MESSAGE_LIMIT - 1)),
    message
  ];
}

export function getNearestActionItem(room: CampusRoom, point: CampusPoint): CampusItem | null {
  const items = getRoomItems(room);
  const candidates = items
    .map((item) => {
      const anchor = item.interactionPoint || item.sitPoint || item;
      return {
        item,
        distance: getDistance(point, anchor)
      };
    })
    .filter(({ item, distance }) => distance <= (item.proximity || 150))
    .sort((left, right) => left.distance - right.distance);

  return candidates[0]?.item || null;
}

export const useCampusStore = create<CampusState>((set, get) => ({
  rooms: getRoomsApi().rooms,
  campusMode: null,
  currentRoomId: INITIAL_ROOM_ID,
  localPlayer: getInitialPlayer(),
  remotePlayers: [],
  chatMessages: [],
  movementTarget: null,
  debugMode: false,
  debugMouseWorld: null,
  debugLastMapClick: null,
  debugPlacementZ: CAMPUS_DEBUG_DEFAULT_Z,
  debugPlacementPoint: null,
  debugSelection: null,
  debugZoneDrafts: {},
  openPanel: null,
  realtimeStatus: "Preparing campus",
  claimedSeatId: null,
  occupiedSeats: {},
  pendingSeatEvent: null,
  pendingChatMessage: null,
  viewSettings: DEFAULT_VIEW_SETTINGS,

  setCampusMode(mode) {
    const nextName = mode === "multiplayer" ? DEFAULT_ONLINE_ALPACA_NAME : DEFAULT_LOCAL_ALPACA_NAME;
    set((state) => ({
      campusMode: mode,
      remotePlayers: [],
      chatMessages: [],
      pendingChatMessage: null,
      claimedSeatId: null,
      occupiedSeats: {},
      pendingSeatEvent: null,
      realtimeStatus: mode === "multiplayer" ? "Connecting online" : "Local campus",
      localPlayer: {
        ...state.localPlayer,
        userId: mode === "multiplayer" ? `devalpacca-${state.localPlayer.clientId}` : "local-scholar",
        displayName: nextName,
        alpacaName: nextName,
        seatId: undefined
      }
    }));
  },

  setRoom(roomId, spawnId = "default") {
    const room = getRoom(roomId);
    const spawn = getSpawnPoint(room.id, spawnId);

    set((state) => ({
      currentRoomId: room.id,
      movementTarget: null,
      debugMouseWorld: null,
      debugLastMapClick: null,
      debugSelection: null,
      debugPlacementPoint: state.debugMode ? { x: Math.round(spawn.x), y: Math.round(spawn.y) } : null,
      claimedSeatId: null,
      chatMessages: [],
      pendingChatMessage: null,
      openPanel: null,
      localPlayer: {
        ...state.localPlayer,
        x: spawn.x,
        y: spawn.y,
        targetX: undefined,
        targetY: undefined,
        seatId: undefined
      }
    }));
  },

  setMovementTarget(point) {
    const room = getRoom(get().currentRoomId);
    if (!point) {
      set({ movementTarget: null });
      return;
    }

    const target = clampToWalkBounds(room, point);
    if (isPointBlocked(room, target)) {
      set({ movementTarget: null });
      return;
    }

    set((state) => {
      if (!state.claimedSeatId) {
        return { movementTarget: target };
      }

      const occupiedSeats = { ...state.occupiedSeats };
      delete occupiedSeats[state.claimedSeatId];

      return {
        claimedSeatId: null,
        occupiedSeats,
        movementTarget: target,
        pendingSeatEvent: {
          action: "release",
          seatId: state.claimedSeatId,
          roomId: state.currentRoomId,
          clientId: state.localPlayer.clientId,
          requestId: createRequestId(),
          sentAtMs: Date.now()
        },
        localPlayer: {
          ...state.localPlayer,
          seatId: undefined
        }
      };
    });
  },

  setPlayerPosition(point) {
    const room = getRoom(get().currentRoomId);

    set((state) => ({
      claimedSeatId: null,
      occupiedSeats: state.claimedSeatId
        ? Object.fromEntries(Object.entries(state.occupiedSeats).filter(([seatId]) => seatId !== state.claimedSeatId))
        : state.occupiedSeats,
      pendingSeatEvent: state.claimedSeatId
        ? {
          action: "release",
          seatId: state.claimedSeatId,
          roomId: state.currentRoomId,
          clientId: state.localPlayer.clientId,
          requestId: createRequestId(),
          sentAtMs: Date.now()
        }
        : state.pendingSeatEvent,
      localPlayer: {
        ...state.localPlayer,
        ...resolveBlockedMovement(room, state.localPlayer, point),
        seatId: undefined
      }
    }));
  },

  stepLocalPlayer(deltaSeconds) {
    const state = get();
    const target = state.movementTarget;
    if (!target) {
      return;
    }

    const room = getRoom(state.currentRoomId);
    const speed = 520 / 3;
    const current = state.localPlayer;
    const distance = getDistance(current, target);
    const step = speed * deltaSeconds;

    if (distance <= step || distance < 5) {
      set((existing) => {
        const next = resolveBlockedMovement(room, existing.localPlayer, target);
        return {
          movementTarget: null,
          localPlayer: {
            ...existing.localPlayer,
            x: next.x,
            y: next.y
          }
        };
      });
      return;
    }

    const ratio = step / distance;
    set((existing) => {
      const desired = {
        x: existing.localPlayer.x + (target.x - existing.localPlayer.x) * ratio,
        y: existing.localPlayer.y + (target.y - existing.localPlayer.y) * ratio
      };
      const next = resolveBlockedMovement(room, existing.localPlayer, desired);
      const movementWasStopped = next.x === existing.localPlayer.x && next.y === existing.localPlayer.y;

      return {
        movementTarget: movementWasStopped ? null : existing.movementTarget,
        localPlayer: {
          ...existing.localPlayer,
          x: next.x,
          y: next.y,
          targetX: movementWasStopped ? undefined : target.x,
          targetY: movementWasStopped ? undefined : target.y
        }
      };
    });
  },

  toggleDebugMode() {
    set((state) => ({
      debugMode: !state.debugMode,
      debugMouseWorld: state.debugMode ? null : state.debugMouseWorld,
      debugLastMapClick: state.debugMode ? null : state.debugLastMapClick,
      debugSelection: state.debugMode ? null : state.debugSelection,
      debugPlacementPoint: state.debugMode ? null : state.debugPlacementPoint || {
        x: Math.round(state.localPlayer.x),
        y: Math.round(state.localPlayer.y)
      }
    }));
  },

  setDebugMouseWorld(point) {
    set({ debugMouseWorld: point });
  },

  setDebugLastMapClick(click) {
    set({ debugLastMapClick: click });
  },

  selectDebugTarget(selection) {
    set({
      debugSelection: selection,
      openPanel: selection ? null : get().openPanel
    });
  },

  setDebugZoneDraft(roomId, zoneKind, zone) {
    const key = getCampusDebugZoneDraftKey(roomId, zoneKind, zone.id);
    set((state) => ({
      debugZoneDrafts: {
        ...state.debugZoneDrafts,
        [key]: {
          ...zone,
          x: Math.round(zone.x),
          y: Math.round(zone.y),
          width: Math.max(1, Math.round(zone.width)),
          height: Math.max(1, Math.round(zone.height))
        }
      }
    }));
  },

  resetDebugZoneDraft(roomId, zoneKind, zoneId) {
    const key = getCampusDebugZoneDraftKey(roomId, zoneKind, zoneId);
    set((state) => {
      const nextDrafts = { ...state.debugZoneDrafts };
      delete nextDrafts[key];
      return { debugZoneDrafts: nextDrafts };
    });
  },

  nudgeDebugPlacementZ(delta) {
    set((state) => ({
      debugPlacementZ: roundDebugZ(clampNumber(state.debugPlacementZ + delta, CAMPUS_DEBUG_Z_MIN, CAMPUS_DEBUG_Z_MAX))
    }));
  },

  setDebugPlacementPoint(point) {
    if (!point) {
      set({ debugPlacementPoint: null });
      return;
    }

    const room = getRoom(get().currentRoomId);
    set({ debugPlacementPoint: clampToDebugReferenceBounds(room, point) });
  },

  nudgeDebugPlacementPoint(delta) {
    set((state) => {
      const room = getRoom(state.currentRoomId);
      const base = state.debugPlacementPoint || state.localPlayer;

      return {
        debugPlacementPoint: clampToDebugReferenceBounds(room, {
          x: base.x + delta.x,
          y: base.y + delta.y
        })
      };
    });
  },

  chooseAvatar(avatar) {
    window.localStorage.setItem(LOCAL_AVATAR_KEY, JSON.stringify(avatar));
    set((state) => ({
      localPlayer: {
        ...state.localPlayer,
        avatar
      }
    }));
  },

  nudgeViewSettings(delta) {
    set((state) => ({
      viewSettings: {
        yaw: clampNumber(state.viewSettings.yaw + (delta.yaw || 0), -VIEW_LOOK_YAW_LIMIT, VIEW_LOOK_YAW_LIMIT),
        distance: clampNumber(state.viewSettings.distance + (delta.distance || 0), VIEW_ZOOM_MIN, VIEW_ZOOM_MAX),
        height: clampNumber(state.viewSettings.height + (delta.height || 0), -VIEW_LOOK_VERTICAL_LIMIT, VIEW_LOOK_VERTICAL_LIMIT),
        light: clampNumber(state.viewSettings.light + (delta.light || 0), 0.45, 1.85)
      }
    }));
  },

  setViewLook(look) {
    set((state) => ({
      viewSettings: {
        ...state.viewSettings,
        yaw: clampNumber(look.yaw, -VIEW_LOOK_YAW_LIMIT, VIEW_LOOK_YAW_LIMIT),
        height: clampNumber(look.height, -VIEW_LOOK_VERTICAL_LIMIT, VIEW_LOOK_VERTICAL_LIMIT)
      }
    }));
  },

  setViewLight(light) {
    set((state) => ({
      viewSettings: {
        ...state.viewSettings,
        light: clampNumber(light, 0.45, 1.85)
      }
    }));
  },

  resetViewSettings() {
    set({ viewSettings: DEFAULT_VIEW_SETTINGS });
  },

  openItemPanel(item) {
    const state = get();
    if (state.debugMode) {
      return;
    }

    if (item.kind === "portal" && item.targetRoomId) {
      get().setRoom(item.targetRoomId, item.targetSpawnId || "default");
      return;
    }

    if (item.kind === "seat") {
      get().claimSeat(item);
    }

    set({
      openPanel: {
        item,
        panel: getPanelForItem(item),
        content: getWorldContentForItem(item)
      }
    });
  },

  closePanel() {
    set({ openPanel: null });
  },

  claimSeat(seat) {
    set((state) => {
      const wasClaimed = state.claimedSeatId === seat.id;
      const occupiedSeats = { ...state.occupiedSeats };
      const occupant = occupiedSeats[seat.id];
      const isOccupiedByAnotherPlayer = Boolean(occupant && occupant !== state.localPlayer.clientId);

      if (!wasClaimed && isOccupiedByAnotherPlayer) {
        return state;
      }

      if (state.claimedSeatId) {
        delete occupiedSeats[state.claimedSeatId];
      }

      const event: CampusSeatRuntimeEvent = {
        action: wasClaimed ? "release" : "claim",
        seatId: seat.id,
        roomId: state.currentRoomId,
        clientId: state.localPlayer.clientId,
        requestId: createRequestId(),
        sentAtMs: Date.now()
      };

      if (!wasClaimed) {
        occupiedSeats[seat.id] = state.localPlayer.clientId;
      }

      const sitPoint = seat.sitPoint || { x: seat.x, y: seat.y };

      return {
        claimedSeatId: wasClaimed ? null : seat.id,
        occupiedSeats,
        movementTarget: null,
        pendingSeatEvent: event,
        localPlayer: {
          ...state.localPlayer,
          x: wasClaimed ? state.localPlayer.x : sitPoint.x,
          y: wasClaimed ? state.localPlayer.y : sitPoint.y,
          targetX: undefined,
          targetY: undefined,
          seatId: wasClaimed ? undefined : seat.id
        }
      };
    });
  },

  setRealtimeStatus(realtimeStatus) {
    set({ realtimeStatus });
  },

  setRemotePlayers(players) {
    const localId = get().localPlayer.clientId;
    const remotePlayers = players
      .filter((player) => player.clientId !== localId)
      .map((player) => normalizePlayer(player));
    const occupiedSeats = Object.fromEntries(
      Object.entries(get().occupiedSeats).filter(([, clientId]) => clientId === localId)
    );

    remotePlayers.forEach((player) => {
      if (player.seatId) {
        occupiedSeats[player.seatId] = player.clientId;
      }
    });

    set({
      remotePlayers,
      occupiedSeats
    });
  },

  upsertRemotePlayer(player) {
    const normalized = normalizePlayer(player);
    if (normalized.clientId === get().localPlayer.clientId) {
      return;
    }

    set((state) => {
      const existing = state.remotePlayers.filter((entry) => entry.clientId !== normalized.clientId);
      const occupiedSeats = { ...state.occupiedSeats };
      Object.keys(occupiedSeats).forEach((seatId) => {
        if (occupiedSeats[seatId] === normalized.clientId) {
          delete occupiedSeats[seatId];
        }
      });
      if (normalized.seatId) {
        occupiedSeats[normalized.seatId] = normalized.clientId;
      }

      return {
        remotePlayers: [...existing, normalized],
        occupiedSeats
      };
    });
  },

  syncSeatEvent(event) {
    const state = get();
    if (event.roomId !== state.currentRoomId || event.clientId === state.localPlayer.clientId) {
      return;
    }

    set((existing) => {
      const occupiedSeats = { ...existing.occupiedSeats };
      const currentClientId = occupiedSeats[event.seatId] || "";

      if (event.action === "release") {
        if (currentClientId === event.clientId) {
          delete occupiedSeats[event.seatId];
        }

        return { occupiedSeats };
      }

      if (!shouldIncomingSeatWin(currentClientId, event.clientId)) {
        return existing;
      }

      Object.keys(occupiedSeats).forEach((seatId) => {
        if (occupiedSeats[seatId] === event.clientId) {
          delete occupiedSeats[seatId];
        }
      });
      occupiedSeats[event.seatId] = event.clientId;

      return {
        claimedSeatId: existing.claimedSeatId === event.seatId ? null : existing.claimedSeatId,
        occupiedSeats
      };
    });
  },

  clearPendingSeatEvent(requestId) {
    set((state) => (
      state.pendingSeatEvent?.requestId === requestId ? { pendingSeatEvent: null } : state
    ));
  },

  sendChatMessage(message) {
    const normalizedMessage = normalizeChatText(message);
    if (!normalizedMessage) {
      return;
    }

    set((state) => {
      const chatMessage = createChatMessage({
        roomId: state.currentRoomId,
        player: state.localPlayer,
        message: normalizedMessage,
        isLocal: true
      });

      return {
        chatMessages: appendChatMessage(state.chatMessages, chatMessage),
        pendingChatMessage: state.campusMode === "multiplayer" ? chatMessage : null
      };
    });
  },

  receiveChatMessage(payload) {
    const normalizedMessage = normalizeChatText(payload.message || payload.text || payload.body);
    if (!normalizedMessage) {
      return;
    }

    const state = get();
    const roomId = String(payload.roomId || state.currentRoomId);
    const clientId = String(payload.clientId || payload.userId || "");
    if (roomId !== state.currentRoomId || clientId === state.localPlayer.clientId) {
      return;
    }

    const sentAtMs = Number(payload.sentAtMs) || Date.now();
    const avatar = typeof payload.avatar === "object" && payload.avatar
      ? payload.avatar as Partial<AlpacaAvatar>
      : undefined;
    const remotePlayer = normalizePlayer({
      clientId,
      userId: String(payload.userId || clientId || "guest"),
      displayName: normalizeChatText(payload.displayName || payload.alpacaName || "Alpaca"),
      alpacaName: normalizeChatText(payload.alpacaName || payload.displayName || "Alpaca"),
      avatar: avatar ? resolveAvatar(avatar) : undefined
    });
    const chatMessage = createChatMessage({
      roomId,
      player: remotePlayer,
      message: normalizedMessage,
      id: String(payload.chatId || payload.id || `${clientId}-${sentAtMs}-${normalizedMessage}`),
      sentAtMs
    });

    set((existing) => ({
      chatMessages: appendChatMessage(existing.chatMessages, chatMessage)
    }));
  },

  clearPendingChatMessage(id) {
    set((state) => (
      state.pendingChatMessage?.id === id ? { pendingChatMessage: null } : state
    ));
  },

  pruneChatMessages(nowMs = Date.now()) {
    set((state) => ({
      chatMessages: state.chatMessages.filter((message) => message.expiresAtMs > nowMs)
    }));
  }
}));

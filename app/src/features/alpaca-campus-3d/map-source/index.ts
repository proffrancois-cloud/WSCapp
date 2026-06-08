import { getRoomsApi, type CampusItem, type CampusPoint, type CampusRoom, type CampusZone } from "../campus-data";
import {
  ROOM_ENVIRONMENT_PLACEMENTS,
  type EnvironmentAssetKey,
  type EnvironmentAssetPlacement
} from "../environment-assets";

export type CampusMapObjectType = "door" | "npc" | "static" | "decorative" | "seat";
export type CampusMapObjectSource = "room.portal" | "room.object" | "room.seat" | "environment.placement";
export type CampusMapDepthRule =
  | { mode: "world-y"; value: number; label: string }
  | { mode: "fixed-height"; value: number; label: string }
  | { mode: "none"; label: string };

export type CampusMapInteractionZone = CampusZone & {
  anchor: CampusPoint;
  radius: number;
};

export type CampusMapObject = {
  id: string;
  type: CampusMapObjectType;
  x: number;
  y: number;
  width?: number;
  height?: number;
  label?: string;
  assetKey: string;
  depthRule: CampusMapDepthRule;
  collisionBox?: CampusZone;
  interactionZone?: CampusMapInteractionZone;
  runtimeItem?: CampusItem;
  placement?: EnvironmentAssetPlacement;
  source: CampusMapObjectSource;
  targetRoomId?: string;
  targetSpawnId?: string;
  panel?: string | null;
};

export type CampusMapRoom = {
  id: string;
  title: string;
  backgroundStyle?: string;
  backgroundMapAssetKey: string;
  fullEnvironmentModel: boolean;
  world: CampusRoom["world"];
  spawnPoint: CampusPoint;
  spawnPoints: Record<string, CampusPoint>;
  walkBounds?: CampusZone;
  walkZones: CampusZone[];
  sittingZones: CampusZone[];
  doors: CampusMapObject[];
  npcs: CampusMapObject[];
  staticObjects: CampusMapObject[];
  decorativeObjects: CampusMapObject[];
  seats: CampusMapObject[];
  collisionZones: CampusZone[];
  interactionZones: CampusMapInteractionZone[];
  objects: CampusMapObject[];
};

const DEFAULT_OBJECT_SIZE = 80;
const DEFAULT_INTERACTION_RADIUS = 150;

const FULL_ENVIRONMENT_MODEL_ROOM_IDS = new Set(["campus-courtyard", "debate-room-1", "raw-content-classroom"]);

const DECORATED_OBJECT_IDS_BY_ROOM: Partial<Record<string, readonly string[]>> = {
  "campus-courtyard": [],
  "school-lobby": [],
  "guiding-library-lounge": [
    ...Array.from({ length: 15 }, (_item, index) => `guide-shelf-${index + 1}`),
    "library-help-desk",
    "library-center-table",
    "library-resource-cart"
  ],
  "debate-room-1": ["debate-room-1-whiteboard", "debate-room-1-lectern"],
  "raw-content-classroom": ["raw-board", "raw-visual-1", "raw-visual-2", "raw-visual-3", "raw-visual-4"],
  "flashcard-museum": Array.from({ length: 10 }, (_item, index) => `flashcard-exhibit-${index + 1}`),
  "games-hall": ["games-scoreboard", "games-trophy-display"],
  "debate-lab": ["debate-motion-wheel", "debate-case-board", "debate-judge-desk"]
};

const ENVIRONMENT_OBJECT_LABEL_IDS = new Set([
  "guiding-library-lounge:library-help-desk",
  "guiding-library-lounge:library-center-table",
  "guiding-library-lounge:library-resource-cart",
  "debate-room-1:debate-room-1-whiteboard",
  "debate-room-1:debate-room-1-lectern",
  "raw-content-classroom:raw-board",
  "flashcard-museum:flashcard-exhibit-1",
  "flashcard-museum:flashcard-exhibit-6",
  "games-hall:games-scoreboard",
  "games-hall:games-trophy-display",
  "debate-lab:debate-motion-wheel",
  "debate-lab:debate-case-board",
  "debate-lab:debate-judge-desk"
]);

const ROOM_BACKGROUND_ASSET_KEYS: Partial<Record<string, string>> = {
  "campus-courtyard": "customChambordCourtyard",
  "debate-room-1": "customDebateLab",
  "raw-content-classroom": "customAnimeClassroom",
  "school-lobby": "procedural-lobby",
  "guiding-library-lounge": "procedural-library",
  "flashcard-museum": "procedural-museum",
  "games-hall": "procedural-game-hall"
};

// Source-of-truth editing rule:
// - Room topology, spawn points, doors, NPCs, runtime objects, collisions, and interaction values are in
//   app/src/features/alpaca-campus/data/rooms.js until the solo and 3D runtimes are fully merged.
// - Decorative GLB placements are in app/src/features/alpaca-campus-3d/environment-assets.ts and normalized here.
// - Game/render/debug code should read this module, not hand-merge rooms and visual placements directly.
export function getCampusMapRoom(room: CampusRoom): CampusMapRoom {
  const doors = (room.portals || []).map((item) => campusItemToMapObject(room, item, "door", "room.portal"));
  const roomObjects = (room.objects || []).map((item) =>
    campusItemToMapObject(room, item, item.kind === "npc" ? "npc" : "static", "room.object")
  );
  const seats = (room.seats || []).map((item) => campusItemToMapObject(room, item, "seat", "room.seat"));
  const decorativeObjects = getCampusMapDecorativePlacements(room.id).map((placement) =>
    placementToMapObject(room, placement)
  );
  const allRuntimeObjects = [...doors, ...roomObjects, ...seats];

  return {
    id: room.id,
    title: room.title,
    backgroundStyle: room.backgroundStyle,
    backgroundMapAssetKey: getCampusMapBackgroundAssetKey(room),
    fullEnvironmentModel: isCampusMapFullEnvironmentModelRoom(room.id),
    world: room.world,
    spawnPoint: room.spawnPoints?.default || { x: room.world.width / 2, y: room.world.height / 2 },
    spawnPoints: room.spawnPoints || {},
    walkBounds: room.walkBounds,
    walkZones: room.walkZones || [],
    sittingZones: room.sittingZones || [],
    doors,
    npcs: roomObjects.filter((object) => object.type === "npc"),
    staticObjects: roomObjects.filter((object) => object.type === "static"),
    decorativeObjects,
    seats,
    collisionZones: room.blockedZones || [],
    interactionZones: allRuntimeObjects
      .map((object) => object.interactionZone)
      .filter((zone): zone is CampusMapInteractionZone => Boolean(zone)),
    objects: [...allRuntimeObjects, ...decorativeObjects]
  };
}

export function getCampusMapRooms(): CampusMapRoom[] {
  return getRoomsApi().rooms.map((room) => getCampusMapRoom(room));
}

export function getCampusMapRoomById(roomId: string): CampusMapRoom {
  const api = getRoomsApi();
  return getCampusMapRoom(api.getRoom(roomId));
}

export function getCampusMapDecorativePlacements(roomId: string): readonly EnvironmentAssetPlacement[] {
  return ROOM_ENVIRONMENT_PLACEMENTS[roomId] || [];
}

export function isCampusMapDecoratedRoom(roomId: string): boolean {
  return Boolean(getCampusMapDecorativePlacements(roomId).length);
}

export function isCampusMapFullEnvironmentModelRoom(roomId: string): boolean {
  return FULL_ENVIRONMENT_MODEL_ROOM_IDS.has(roomId);
}

export function isCampusMapDecoratedObject(roomId: string, objectId: string): boolean {
  return DECORATED_OBJECT_IDS_BY_ROOM[roomId]?.includes(objectId) ?? false;
}

export function shouldShowCampusMapObjectLabel(roomId: string, objectId: string): boolean {
  return ENVIRONMENT_OBJECT_LABEL_IDS.has(`${roomId}:${objectId}`);
}

function campusItemToMapObject(
  room: CampusRoom,
  item: CampusItem,
  type: CampusMapObjectType,
  source: CampusMapObjectSource
): CampusMapObject {
  return {
    id: item.id,
    type,
    x: item.x,
    y: item.y,
    width: item.width,
    height: item.height,
    label: item.label,
    assetKey: getRuntimeItemAssetKey(item, type),
    depthRule: getRuntimeItemDepthRule(item),
    collisionBox: getCollisionBoxForItem(room, item),
    interactionZone: getInteractionZoneForItem(item),
    runtimeItem: item,
    source,
    targetRoomId: item.targetRoomId,
    targetSpawnId: item.targetSpawnId,
    panel: item.panel
  };
}

function placementToMapObject(room: CampusRoom, placement: EnvironmentAssetPlacement): CampusMapObject {
  return {
    id: placement.id,
    type: "decorative",
    x: placement.point.x,
    y: placement.point.y,
    assetKey: placement.asset,
    depthRule: getPlacementDepthRule(placement),
    collisionBox: getCollisionBoxForDecorativePlacement(room, placement),
    placement,
    source: "environment.placement"
  };
}

function getCampusMapBackgroundAssetKey(room: CampusRoom): string {
  const explicit = ROOM_BACKGROUND_ASSET_KEYS[room.id];
  if (explicit) {
    return explicit;
  }

  const fullRoomPlacement = getCampusMapDecorativePlacements(room.id).find((placement) => placement.normalize);
  return fullRoomPlacement?.asset || `procedural-${room.backgroundStyle || "room"}`;
}

function getRuntimeItemAssetKey(item: CampusItem, type: CampusMapObjectType): string {
  if (type === "door") {
    return `door:${item.targetRoomId || "unknown"}`;
  }

  if (type === "seat") {
    return `seat:${item.seatType || "seat"}`;
  }

  if (type === "npc") {
    return item.avatar ? "npc:custom-alpaca" : "npc:alpaca";
  }

  return `surface:${item.kind || "object"}`;
}

function getRuntimeItemDepthRule(item: CampusItem): CampusMapDepthRule {
  return {
    mode: "world-y",
    value: item.y + (item.height || 0),
    label: "world-y-bottom"
  };
}

function getPlacementDepthRule(placement: EnvironmentAssetPlacement): CampusMapDepthRule {
  if (typeof placement.height === "number") {
    return {
      mode: "fixed-height",
      value: placement.height,
      label: placement.normalize ? "fixed-height-normalized" : "fixed-height"
    };
  }

  return {
    mode: "world-y",
    value: placement.point.y,
    label: placement.normalize ? "world-y-normalized" : "world-y"
  };
}

function getInteractionZoneForItem(item: CampusItem): CampusMapInteractionZone {
  const anchor = item.interactionPoint || item.sitPoint || getItemCenter(item);
  const radius = item.proximity || DEFAULT_INTERACTION_RADIUS;

  return {
    id: `${item.id}-interaction`,
    x: anchor.x - radius,
    y: anchor.y - radius,
    width: radius * 2,
    height: radius * 2,
    anchor,
    radius
  };
}

function getCollisionBoxForItem(room: CampusRoom, item: CampusItem): CampusZone | undefined {
  return findMatchingCollisionBox(room, item.id);
}

function getCollisionBoxForDecorativePlacement(room: CampusRoom, placement: EnvironmentAssetPlacement): CampusZone | undefined {
  return findMatchingCollisionBox(room, placement.id);
}

function findMatchingCollisionBox(room: CampusRoom, objectId: string): CampusZone | undefined {
  return (room.blockedZones || []).find((zone) =>
    zone.id === objectId ||
    zone.id === `${objectId}-block` ||
    zone.id.replace(/-block$/, "") === objectId
  );
}

function getItemCenter(item: CampusItem): CampusPoint {
  return {
    x: item.x + (item.width || DEFAULT_OBJECT_SIZE) / 2,
    y: item.y + (item.height || DEFAULT_OBJECT_SIZE) / 2
  };
}

export type { EnvironmentAssetKey, EnvironmentAssetPlacement };

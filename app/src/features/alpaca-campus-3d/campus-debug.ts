import {
  type CampusItem,
  type CampusPoint,
  type CampusRoom,
  type CampusZone
} from "./campus-data";
import {
  getCampusMapDecorativePlacements,
  getCampusMapRoom,
  type EnvironmentAssetPlacement
} from "./map-source";

// Debug source of truth:
// - Debug reads app/src/features/alpaca-campus-3d/map-source as the normalized campus map contract.
// - Future collision rectangles or ring walls should still be authored in room.blockedZones so movement,
//   debug overlays, and QA all read the same data through map-source.
export const CAMPUS_DEBUG_GRID_STEP = 100;
export const CAMPUS_DEBUG_TILE_SIZE = CAMPUS_DEBUG_GRID_STEP;
export const CAMPUS_DEBUG_DEFAULT_Z = 0;
export const CAMPUS_DEBUG_POINT_STEP = 10;
export const CAMPUS_DEBUG_POINT_FINE_STEP = 1;
export const CAMPUS_DEBUG_POINT_FAST_STEP = 100;
export const CAMPUS_DEBUG_Z_STEP = 0.05;
export const CAMPUS_DEBUG_Z_MIN = -2;
export const CAMPUS_DEBUG_Z_MAX = 8;

export type CampusDebugItemKind = "portal" | "object" | "seat";

export type CampusDebugItem = {
  item: CampusItem;
  debugKind: CampusDebugItemKind;
};

export type CampusDebugPlacementClickMode = "coordinate" | "object" | "collision";

export type CampusDebugPlacementClick = {
  point: CampusPoint;
  z: number;
  roomId: string;
  mode: CampusDebugPlacementClickMode;
  snippet: string;
  copied: boolean;
  createdAtMs: number;
};

type MaybeLayeredItem = CampusItem & {
  depth?: unknown;
  layer?: unknown;
  renderLayer?: unknown;
  zIndex?: unknown;
};

export function formatDebugNumber(value: number | undefined | null): string {
  return Number.isFinite(value) ? Math.round(Number(value)).toString() : "--";
}

export function formatDebugPoint(point: CampusPoint | null | undefined): string {
  if (!point) {
    return "-- / --";
  }

  return `${formatDebugNumber(point.x)} / ${formatDebugNumber(point.y)}`;
}

export function formatDebugZ(value: number | undefined | null): string {
  return Number.isFinite(value) ? Number(value).toFixed(2) : "--";
}

export function formatDebugPoint3D(point: CampusPoint | null | undefined, z: number | undefined | null): string {
  if (!point) {
    return "-- / -- / --";
  }

  return `${formatDebugNumber(point.x)} / ${formatDebugNumber(point.y)} / ${formatDebugZ(z)}`;
}

export function getCampusDebugTile(point: CampusPoint | null | undefined): CampusPoint | null {
  if (!point) {
    return null;
  }

  return {
    x: Math.floor(point.x / CAMPUS_DEBUG_TILE_SIZE),
    y: Math.floor(point.y / CAMPUS_DEBUG_TILE_SIZE)
  };
}

export function getCampusDebugCollisionZones(room: CampusRoom): CampusZone[] {
  return getCampusMapRoom(room).collisionZones;
}

export function getCampusDebugSittingZones(room: CampusRoom): CampusZone[] {
  return getCampusMapRoom(room).sittingZones;
}

export function getCampusDebugInteractables(room: CampusRoom): CampusDebugItem[] {
  return getCampusMapRoom(room).objects
    .filter((object) => object.runtimeItem)
    .map((object) => ({
      item: object.runtimeItem as CampusItem,
      debugKind: object.type === "door" ? "portal" : object.type === "seat" ? "seat" : "object"
    }));
}

export function getCampusDebugAssetPlacements(roomId: string): readonly EnvironmentAssetPlacement[] {
  return getCampusMapDecorativePlacements(roomId);
}

export function getCampusDebugInteractiveCount(room: CampusRoom): number {
  return getCampusDebugInteractables(room).length;
}

export function getCampusDebugItemCenter(item: CampusItem): CampusPoint {
  return {
    x: item.x + item.width / 2,
    y: item.y + item.height / 2
  };
}

export function getCampusDebugInteractionAnchor(item: CampusItem): CampusPoint {
  return item.interactionPoint || item.sitPoint || getCampusDebugItemCenter(item);
}

export function getCampusDebugItemLayerLabel(item: CampusItem): string | null {
  const layeredItem = item as MaybeLayeredItem;
  const candidates = [
    ["depth", layeredItem.depth],
    ["layer", layeredItem.layer],
    ["render", layeredItem.renderLayer],
    ["z", layeredItem.zIndex]
  ] as const;

  for (const [label, value] of candidates) {
    if (value !== undefined && value !== null && value !== "") {
      return `${label}:${String(value)}`;
    }
  }

  if (typeof item.sectionIndex === "number") {
    return `section:${item.sectionIndex}`;
  }

  return null;
}

export function getCampusDebugPlacementLayerLabel(placement: EnvironmentAssetPlacement): string | null {
  if (typeof placement.height === "number") {
    return `h:${placement.height}`;
  }

  if (placement.normalize) {
    return "normalized";
  }

  return null;
}

export function createCampusDebugPlacementClick({
  roomId,
  point,
  z,
  altKey,
  shiftKey,
  copied = false
}: {
  roomId: string;
  point: CampusPoint;
  z: number;
  altKey: boolean;
  shiftKey: boolean;
  copied?: boolean;
}): CampusDebugPlacementClick {
  const mode: CampusDebugPlacementClickMode = altKey ? "collision" : shiftKey ? "object" : "coordinate";
  const roundedPoint = roundDebugPoint(point);
  const roundedZ = roundDebugZ(z);

  return {
    point: roundedPoint,
    z: roundedZ,
    roomId,
    mode,
    snippet: getCampusDebugPlacementSnippet(roundedPoint, mode, roundedZ),
    copied,
    createdAtMs: Date.now()
  };
}

export function getCampusDebugPlacementSnippet(point: CampusPoint, mode: CampusDebugPlacementClickMode, z = CAMPUS_DEBUG_DEFAULT_Z): string {
  const rounded = roundDebugPoint(point);
  const roundedZ = roundDebugZ(z);
  const zLabel = formatDebugZ(roundedZ);

  if (mode === "collision") {
    const width = 160;
    const height = 120;
    return `rect("new-collision-block", ${Math.round(rounded.x - width / 2)}, ${Math.round(rounded.y - height / 2)}, ${width}, ${height}) // z:${zLabel}`;
  }

  if (mode === "object") {
    return [
      `// x:${rounded.x} y:${rounded.y} z:${zLabel}`,
      `object("new-object-id", "static", "New Object", ${rounded.x}, ${rounded.y}, 140, 90, "info", {`,
      `  interactionPoint: point(${rounded.x}, ${rounded.y + 130}),`,
      "  proximity: 140",
      "})"
    ].join("\n");
  }

  return `point(${rounded.x}, ${rounded.y}) // z:${zLabel}`;
}

function roundDebugPoint(point: CampusPoint): CampusPoint {
  return {
    x: Math.round(point.x),
    y: Math.round(point.y)
  };
}

export function roundDebugZ(value: number): number {
  return Math.round(value * 100) / 100;
}

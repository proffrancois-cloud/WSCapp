import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Text, useGLTF, useTexture } from "@react-three/drei";
import { Physics, RigidBody } from "@react-three/rapier";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import type { ReactElement } from "react";
import { Box3, ClampToEdgeWrapping, DoubleSide, Group, Mesh, MeshStandardMaterial, PCFShadowMap, Plane, RepeatWrapping, SRGBColorSpace, Vector3, type Material, type Texture } from "three";
import { type CampusItem, type CampusPoint, type CampusRoom, type CampusZone, createSittingZoneSeat, getRoom } from "./campus-data";
import {
  PLAYER_BLOCKING_BOUNDS,
  type CampusDebugSelection,
  type CampusDebugZoneKind,
  type CampusPlayer,
  getNearestActionItem,
  getCampusDebugZoneDraftKey,
  useCampusStore
} from "./campus-store";
import {
  CAMPUS_DEBUG_GRID_STEP,
  CAMPUS_DEBUG_POINT_FAST_STEP,
  CAMPUS_DEBUG_POINT_FINE_STEP,
  CAMPUS_DEBUG_POINT_STEP,
  CAMPUS_DEBUG_Z_STEP,
  createCampusDebugPlacementClick,
  formatDebugPoint3D,
  formatDebugZ,
  getCampusDebugAssetPlacements,
  getCampusDebugCollisionZones,
  getCampusDebugInteractables,
  getCampusDebugInteractionAnchor,
  getCampusDebugItemCenter,
  getCampusDebugItemLayerLabel,
  getCampusDebugPlacementLayerLabel,
  getCampusDebugSittingZones
} from "./campus-debug";
import { roomManifests, type RoomManifestRoomId } from "./room-manifest";
import {
  PLAYER_ALPACA_MODEL_SRC,
  PLAYER_ALPACA_TEXTURES,
  getPlayerAlpacaTextureSrc
} from "./avatar-assets";
import lobbyFloorBaseColorSrc from "../../../assets/campus-3d/materials/medievaltiles-red/base-color.webp?url";
import lobbyFloorMetallicRoughnessSrc from "../../../assets/campus-3d/materials/medievaltiles-red/metallic-roughness.webp?url";
import lobbyFloorNormalSrc from "../../../assets/campus-3d/materials/medievaltiles-red/normal.webp?url";
import lobbyDoorBaseColorSrc from "../../../assets/campus-3d/materials/lobby-door-20/base-color.webp?url";
import lobbyDoorNormalSrc from "../../../assets/campus-3d/materials/lobby-door-20/normal.webp?url";
import lobbyDoorRoughnessSrc from "../../../assets/campus-3d/materials/lobby-door-20/roughness.webp?url";
import lobbyWallBaseColorSrc from "../../../assets/campus-3d/materials/lobby-wall-18/base-color.webp?url";
import lobbyWallNormalSrc from "../../../assets/campus-3d/materials/lobby-wall-18/normal.webp?url";
import lobbyWallRoughnessSrc from "../../../assets/campus-3d/materials/lobby-wall-18/roughness.webp?url";
import libraryFloorBaseColorSrc from "../../../assets/campus-3d/materials/library-fantasy-wood/base-color.png?url";
import libraryFloorNormalSrc from "../../../assets/campus-3d/materials/library-fantasy-wood/normal.png?url";
import {
  CAMPUS_ORNATE_FRAME_TEXTURE_SRC,
  CAMPUS_LIBRARY_ROCOCO_WALLPAPER_TEXTURE_SRC,
  LOBBY_INFORMATION_ALPACA_ASSET_POINT,
  RAW_ENVIRONMENT_ASSETS,
  getCampusWallFramePlacements,
  getCampusWallWallpaperPlacements,
  type CampusWallFramePlacement,
  type CampusWallWallpaperPlacement
} from "./environment-assets";
import {
  getCampusMapDecorativePlacements,
  getCampusMapRoom,
  isCampusMapDecoratedObject,
  isCampusMapDecoratedRoom,
  isCampusMapFullEnvironmentModelRoom,
  shouldShowCampusMapObjectLabel,
  type EnvironmentAssetPlacement
} from "./map-source";

const WORLD_SCALE = 0.012;
const DESIGN_COORDINATE_SCALE = 1.65;
const PLAYER_HEIGHT = 0.78;
const CAMERA_BASE_HEIGHT = PLAYER_HEIGHT * 2;
const CAMERA_BASE_BACK_DISTANCE = PLAYER_HEIGHT * 1.32;
const CAMERA_LOOK_AHEAD_DISTANCE = PLAYER_HEIGHT * 0.68;
const CAMERA_LOOK_TARGET_HEIGHT = PLAYER_HEIGHT * 0.82;
const CAMERA_POSITION_DAMPING = 12;
const CAMERA_LOOK_DAMPING = 16;
const CAMERA_HEADING_DAMPING = 14;
const CAMERA_FOV = 58;
const CAMERA_NEAR = 0.04;
const CAMERA_FAR = 80;
const CAMERA_ROOM_EDGE_INSET = 42;
const CAMERA_BLOCKER_PADDING = 34;
const CAMERA_BLOCKER_MARGIN = 28;
const PLAYER_AVATAR_BASE_HEIGHT = 0.3;
const LIBRARY_PLAYER_AVATAR_BASE_HEIGHT = 0;
const DEBATE_ROOM_BASE_SURFACE_HEIGHT = 0.77;
const DEBATE_ROOM_CUBE_SURFACE_HEIGHT = 1.489;
const DEBATE_ROOM_STEP_SURFACE_TOP_HEIGHT = 1.329;
const DEBATE_ROOM_STEP_LEVELS = 3;
const DEBATE_ROOM_CUBE_BOUNDS = { x: 193, y: -626, width: 855, height: 534 } as const;
const DEBATE_ROOM_STEP_BOUNDS = [
  { x: 689, y: -92, width: 107, height: 78 },
  { x: 473, y: -92, width: 107, height: 78 }
] as const;
const AVATAR_WALK_PHASE_PER_WORLD_UNIT = 0.022;
const LOBBY_INFORMATION_ALPACA_POSITION = LOBBY_INFORMATION_ALPACA_ASSET_POINT;
const LOBBY_WALL_THICKNESS = 0.35;
const LOBBY_FLOOR_TEXTURES = {
  map: lobbyFloorBaseColorSrc,
  normalMap: lobbyFloorNormalSrc,
  roughnessMap: lobbyFloorMetallicRoughnessSrc
};
const LOBBY_WALL_TEXTURES = {
  map: lobbyWallBaseColorSrc,
  normalMap: lobbyWallNormalSrc,
  roughnessMap: lobbyWallRoughnessSrc
};
const LOBBY_DOOR_TEXTURES = {
  map: lobbyDoorBaseColorSrc,
  normalMap: lobbyDoorNormalSrc,
  roughnessMap: lobbyDoorRoughnessSrc
};
const LIBRARY_FLOOR_TEXTURES = {
  map: libraryFloorBaseColorSrc,
  normalMap: libraryFloorNormalSrc
};
const TRANSPARENT_PIXEL_TEXTURE_SRC = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==";
const ORNATE_BOOK_MESH_PATTERN = /(?:black|burgundy|green|navy|brown|tan|red)_leather/i;
const ORNATE_BOOK_COLORS = ["#c79a2f", "#102a56", "#123d2d", "#641d24"] as const;
type AvatarWalkUniforms = {
  uWalkTime: { value: number };
  uWalkStrength: { value: number };
  uSitStrength: { value: number };
};
type CampusTextureSetPaths = {
  map: string;
  normalMap: string;
  roughnessMap: string;
};

const roomMaterials: Record<string, { background: string; floor: string; carpet: string; wall: string; accent: string }> = {
  courtyard: { background: "#cfe8f5", floor: "#78a96d", carpet: "#9fc47f", wall: "#5f7355", accent: "#d6a15c" },
  lobby: { background: "#e8ece4", floor: "#d9d3c3", carpet: "#7b9e89", wall: "#e8d7bd", accent: "#e3b448" },
  library: { background: "#f4efe0", floor: "#c9b894", carpet: "#56705b", wall: "#e8d7bd", accent: "#b7783b" },
  museum: { background: "#eef0ed", floor: "#d6d2c8", carpet: "#8b4050", wall: "#26364f", accent: "#d8b266" },
  classroom: { background: "#e8ece4", floor: "#c7d3c1", carpet: "#526f8a", wall: "#2f3d46", accent: "#c6533f" },
  "game-hall": { background: "#e9eef0", floor: "#b9c7c9", carpet: "#514f7d", wall: "#1f2d36", accent: "#ef8354" },
  amphitheater: { background: "#efe8dc", floor: "#bba78b", carpet: "#6f1d1b", wall: "#2b2118", accent: "#f2cc8f" }
};

function getRoomMaterial(room: CampusRoom) {
  if (room.id in roomManifests) {
    const manifest = roomManifests[room.id as RoomManifestRoomId];
    return {
      background: manifest.environment.backgroundColor,
      floor: manifest.environment.floorColor,
      carpet: manifest.environment.carpetColor,
      wall: manifest.environment.wallColor,
      accent: manifest.environment.accentColor
    };
  }

  return roomMaterials[room.backgroundStyle || ""] || roomMaterials.lobby;
}

function getCameraDefaults(room: CampusRoom) {
  if (room.id === "raw-content-classroom") {
    return {
      mode: "avatar-follow",
      initialPosition: [7.2, 11.5, 11.5],
      followOffset: [5.8, 12.4, 10.2],
      lookAtOffset: [0, 1.15, -2.4],
      fov: 46,
      near: 0.1,
      far: 100,
      damping: 0.07
    } as const;
  }

  return room.id in roomManifests ? roomManifests[room.id as RoomManifestRoomId].camera : null;
}

function worldToScene(room: CampusRoom, point: CampusPoint, height = 0): [number, number, number] {
  return [
    (point.x - room.world.width / 2) * WORLD_SCALE,
    height,
    (point.y - room.world.height / 2) * WORLD_SCALE
  ];
}

function sceneToWorld(room: CampusRoom, point: Vector3): CampusPoint {
  return {
    x: point.x / WORLD_SCALE + room.world.width / 2,
    y: point.z / WORLD_SCALE + room.world.height / 2
  };
}

function zoneCenter(zone: CampusItem): CampusPoint {
  if (zone.kind === "portal") {
    return { x: zone.x + zone.width / 2, y: zone.y + zone.height / 2 };
  }

  return zone.sitPoint || zone.interactionPoint || { x: zone.x, y: zone.y };
}

function blockedZoneCenter(zone: CampusZone): CampusPoint {
  return zone.center || {
    x: zone.x + zone.width / 2,
    y: zone.y + zone.height / 2
  };
}

function getRoomFloorBounds(
  room: CampusRoom,
  walkBounds: CampusZone
): { id: string; x: number; y: number; width: number; height: number } {
  const minX = Math.min(0, walkBounds.x);
  const minY = Math.min(0, walkBounds.y);
  const maxX = Math.max(room.world.width, walkBounds.x + walkBounds.width);
  const maxY = Math.max(room.world.height, walkBounds.y + walkBounds.height);

  return {
    id: "floor",
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY
  };
}

function isPointInRect(point: CampusPoint, bounds: { x: number; y: number; width: number; height: number }): boolean {
  return point.x >= bounds.x
    && point.x <= bounds.x + bounds.width
    && point.y >= bounds.y
    && point.y <= bounds.y + bounds.height;
}

function getRectDistance(
  point: CampusPoint,
  bounds: { x: number; y: number; width: number; height: number }
): number {
  const dx = Math.max(bounds.x - point.x, 0, point.x - (bounds.x + bounds.width));
  const dy = Math.max(bounds.y - point.y, 0, point.y - (bounds.y + bounds.height));
  return Math.hypot(dx, dy);
}

function isRingZone(zone: CampusZone | undefined): zone is CampusZone & { shape: "ring"; radius: number } {
  return zone?.shape === "ring" && typeof zone.radius === "number";
}

function isPathZone(zone: CampusZone | undefined): zone is CampusZone & { shape: "path"; points: CampusPoint[] } {
  return zone?.shape === "path" && Array.isArray(zone.points) && zone.points.length >= 2;
}

type CameraBlockingRect = {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
};

function clampValue(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function getPointDistance(left: CampusPoint, right: CampusPoint): number {
  return Math.hypot(right.x - left.x, right.y - left.y);
}

function isRectCameraBlocker(zone: CampusZone | undefined): zone is CampusZone & CameraBlockingRect {
  if (!zone) {
    return false;
  }

  return !isRingZone(zone) && !isPathZone(zone);
}

function expandCameraRect(rect: CameraBlockingRect, padding: number): CameraBlockingRect {
  return {
    id: rect.id,
    x: rect.x - padding,
    y: rect.y - padding,
    width: rect.width + padding * 2,
    height: rect.height + padding * 2
  };
}

function getCameraRoomBounds(room: CampusRoom): CameraBlockingRect {
  return room.walkBounds || {
    id: "world",
    x: 0,
    y: 0,
    width: room.world.width,
    height: room.world.height
  };
}

function clampCameraToRoomBounds(room: CampusRoom, point: CampusPoint): CampusPoint {
  const bounds = getCameraRoomBounds(room);
  const inset = Math.max(0, Math.min(CAMERA_ROOM_EDGE_INSET, bounds.width / 2 - 1, bounds.height / 2 - 1));
  const minX = bounds.x + inset;
  const maxX = bounds.x + bounds.width - inset;
  const minY = bounds.y + inset;
  const maxY = bounds.y + bounds.height - inset;

  if (minX > maxX || minY > maxY) {
    return {
      x: bounds.x + bounds.width / 2,
      y: bounds.y + bounds.height / 2
    };
  }

  return {
    x: clampValue(point.x, minX, maxX),
    y: clampValue(point.y, minY, maxY)
  };
}

function getSegmentRectEntryRatio(
  start: CampusPoint,
  end: CampusPoint,
  rect: CameraBlockingRect
): number | null {
  const deltaX = end.x - start.x;
  const deltaY = end.y - start.y;
  let tMin = 0;
  let tMax = 1;

  function updateAxis(startValue: number, delta: number, min: number, max: number): boolean {
    if (Math.abs(delta) < 0.000001) {
      return startValue >= min && startValue <= max;
    }

    let near = (min - startValue) / delta;
    let far = (max - startValue) / delta;

    if (near > far) {
      const previousNear = near;
      near = far;
      far = previousNear;
    }

    tMin = Math.max(tMin, near);
    tMax = Math.min(tMax, far);
    return tMin <= tMax;
  }

  if (!updateAxis(start.x, deltaX, rect.x, rect.x + rect.width)) {
    return null;
  }

  if (!updateAxis(start.y, deltaY, rect.y, rect.y + rect.height)) {
    return null;
  }

  if (tMax < 0 || tMin > 1) {
    return null;
  }

  return clampValue(tMin, 0, 1);
}

function getCameraBlockingRects(room: CampusRoom): CameraBlockingRect[] {
  const mapRoom = getCampusMapRoom(room);
  const seenIds = new Set<string>();
  const rects: CameraBlockingRect[] = [];

  function addRect(zone: CampusZone | undefined) {
    if (!isRectCameraBlocker(zone) || seenIds.has(zone.id)) {
      return;
    }

    seenIds.add(zone.id);
    rects.push(zone);
  }

  (room.blockedZones || []).forEach(addRect);
  mapRoom.objects.forEach((object) => addRect(object.collisionBox));
  return rects;
}

function resolveCameraWorldPoint(
  room: CampusRoom,
  origin: CampusPoint,
  desired: CampusPoint,
  blockers: CameraBlockingRect[],
  padding = CAMERA_BLOCKER_PADDING,
  margin = CAMERA_BLOCKER_MARGIN
): CampusPoint {
  const boundedDesired = clampCameraToRoomBounds(room, desired);
  let nearestEntryRatio = 1;

  blockers.forEach((blocker) => {
    const expanded = expandCameraRect(blocker, padding);
    if (isPointInRect(origin, expanded)) {
      return;
    }

    const entryRatio = getSegmentRectEntryRatio(origin, boundedDesired, expanded);
    if (entryRatio !== null && entryRatio > 0.0001 && entryRatio < nearestEntryRatio) {
      nearestEntryRatio = entryRatio;
    }
  });

  if (nearestEntryRatio >= 1) {
    return boundedDesired;
  }

  const distance = getPointDistance(origin, boundedDesired);
  const marginRatio = distance > 0 ? Math.min(0.35, margin / distance) : 0;
  const safeRatio = Math.max(0, nearestEntryRatio - marginRatio);

  return clampCameraToRoomBounds(room, {
    x: origin.x + (boundedDesired.x - origin.x) * safeRatio,
    y: origin.y + (boundedDesired.y - origin.y) * safeRatio
  });
}

function getRingZoneRadii(zone: CampusZone): { innerRadius: number; outerRadius: number } {
  const radius = (zone.radius ?? Math.min(zone.width, zone.height) / 2) * WORLD_SCALE;
  const halfThickness = ((zone.thickness ?? 48) * WORLD_SCALE) / 2;

  return {
    innerRadius: Math.max(0.01, radius - halfThickness),
    outerRadius: Math.max(0.02, radius + halfThickness)
  };
}

function getPathZoneSegments(zone: CampusZone & { points: CampusPoint[] }): Array<[CampusPoint, CampusPoint]> {
  return zone.points.slice(1).map((point, index) => [zone.points[index], point]);
}

function getPathSegmentPose(
  room: CampusRoom,
  start: CampusPoint,
  end: CampusPoint,
  height: number
): { position: [number, number, number]; length: number; rotationY: number } {
  const [startX, , startZ] = worldToScene(room, start, height);
  const [endX, , endZ] = worldToScene(room, end, height);
  const deltaX = endX - startX;
  const deltaZ = endZ - startZ;

  return {
    position: [(startX + endX) / 2, height, (startZ + endZ) / 2],
    length: Math.hypot(deltaX, deltaZ),
    rotationY: Math.atan2(-deltaZ, deltaX)
  };
}

function designPoint(x: number, y: number): CampusPoint {
  return {
    x: Math.round(x * DESIGN_COORDINATE_SCALE),
    y: Math.round(y * DESIGN_COORDINATE_SCALE)
  };
}

function lerpAngle(start: number, end: number, alpha: number): number {
  const delta = Math.atan2(Math.sin(end - start), Math.cos(end - start));
  return start + delta * alpha;
}

function stableHash(value: string): number {
  let hash = 2166136261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return Math.abs(hash);
}

async function copyCampusDebugSnippet(snippet: string): Promise<boolean> {
  try {
    if (!window.navigator.clipboard?.writeText) {
      return false;
    }

    await window.navigator.clipboard.writeText(snippet);
    return true;
  } catch (_error) {
    return false;
  }
}

function getOrnateBookColor(placementId: string, meshName: string): string {
  return ORNATE_BOOK_COLORS[stableHash(`${placementId}:${meshName}`) % ORNATE_BOOK_COLORS.length];
}

function cloneAvatarMaterial(material: Material, texture: Texture, walkUniforms: AvatarWalkUniforms[]): Material {
  const cloned = material.clone();
  if (cloned instanceof MeshStandardMaterial && (cloned.map || cloned.name === "Material_0")) {
    const uniforms: AvatarWalkUniforms = {
      uWalkTime: { value: 0 },
      uWalkStrength: { value: 0 },
      uSitStrength: { value: 0 }
    };

    cloned.map = texture;
    cloned.color.set("#ffffff");
    cloned.metalness = 0;
    cloned.roughness = Math.max(cloned.roughness, 0.7);
    cloned.onBeforeCompile = (shader) => {
      shader.uniforms.uWalkTime = uniforms.uWalkTime;
      shader.uniforms.uWalkStrength = uniforms.uWalkStrength;
      shader.uniforms.uSitStrength = uniforms.uSitStrength;
      shader.vertexShader = shader.vertexShader
        .replace(
          "#include <common>",
          `#include <common>
uniform float uWalkTime;
uniform float uWalkStrength;
uniform float uSitStrength;`
        )
        .replace(
          "#include <begin_vertex>",
          `#include <begin_vertex>
float walkStrength = uWalkStrength;
float sit = uSitStrength * uSitStrength * (3.0 - 2.0 * uSitStrength);
float sitMid = sin(uSitStrength * 3.14159265);
float walkPi = 3.14159265;
float side = position.z < 0.0 ? -1.0 : 1.0;
float side01 = step(0.0, side);
float lowerLegMask = 1.0 - smoothstep(-0.205, -0.105, position.y);
float upperLegMask = (1.0 - smoothstep(-0.145, -0.035, position.y)) * smoothstep(-0.225, -0.145, position.y);
float hoofMask = 1.0 - smoothstep(-0.225, -0.184, position.y);
float frontLegColumn = 1.0 - smoothstep(-0.150, -0.095, position.x);
float rearLegColumn = smoothstep(-0.120, -0.028, position.x);
float legColumnTotal = max(0.0001, frontLegColumn + rearLegColumn);
float rearLegBlend = rearLegColumn / legColumnTotal;
float legColumnMask = clamp(frontLegColumn + rearLegColumn, 0.0, 1.0);
float frontPhase = uWalkTime + side01 * walkPi;
float rearPhase = uWalkTime + (1.0 - side01) * walkPi + walkPi * 0.54;
float legPhase = mix(frontPhase, rearPhase, rearLegBlend);
float swingLift = pow(max(0.0, sin(legPhase)), 1.45);
float contactPress = pow(max(0.0, cos(legPhase - 0.25)), 3.0);
float passingTuck = max(0.0, sin(legPhase - walkPi * 0.32));
float strideArc = cos(legPhase);
float plantedStride = mix(strideArc * 0.34, strideArc, swingLift);
float legAmplitude = mix(1.0, 0.78, rearLegBlend);
float bodyMask = smoothstep(-0.13, -0.015, position.y) * (1.0 - smoothstep(0.070, 0.155, position.y));
float shoulderMask = bodyMask * (1.0 - smoothstep(-0.175, -0.105, position.x));
float hipMask = bodyMask * smoothstep(-0.105, -0.025, position.x);
float headMask = smoothstep(0.050, 0.180, position.y) * (1.0 - smoothstep(-0.205, -0.165, position.x));
float earMask = smoothstep(0.160, 0.220, position.y) * (1.0 - smoothstep(-0.235, -0.180, position.x));
float tailMask = smoothstep(-0.024, 0.045, position.x) * smoothstep(-0.070, 0.020, position.y) * (1.0 - smoothstep(0.032, 0.090, position.y));
float bodyStep = sin(uWalkTime * 2.0 - 0.35);
float bodyBob = max(0.0, bodyStep) * 0.007 - max(0.0, -bodyStep) * 0.008;
float shoulderSway = sin(uWalkTime + 0.30);
float shoulderReach = cos(uWalkTime + 0.12);

transformed.x += upperLegMask * legColumnMask * plantedStride * 0.026 * legAmplitude * walkStrength;
transformed.x += lowerLegMask * legColumnMask * plantedStride * 0.050 * legAmplitude * walkStrength;
transformed.x += hoofMask * legColumnMask * plantedStride * 0.064 * legAmplitude * walkStrength;
transformed.y += lowerLegMask * legColumnMask * swingLift * 0.040 * legAmplitude * walkStrength;
transformed.y += hoofMask * legColumnMask * swingLift * 0.024 * legAmplitude * walkStrength;
transformed.y -= hoofMask * legColumnMask * contactPress * 0.010 * walkStrength;
transformed.z += hoofMask * legColumnMask * side * swingLift * 0.012 * walkStrength;
transformed.z += upperLegMask * legColumnMask * side * passingTuck * 0.004 * walkStrength;
transformed.y += bodyMask * bodyBob * walkStrength;
transformed.x += shoulderMask * shoulderReach * 0.006 * walkStrength;
transformed.x -= hipMask * shoulderReach * 0.005 * walkStrength;
transformed.z += shoulderMask * shoulderSway * 0.007 * walkStrength;
transformed.z -= hipMask * shoulderSway * 0.008 * walkStrength;
transformed.y += headMask * (bodyBob * 0.65 + sin(uWalkTime * 2.0 - 0.82) * 0.007) * walkStrength;
transformed.x += headMask * sin(uWalkTime * 2.0 + 0.45) * 0.006 * walkStrength;
transformed.z += headMask * shoulderSway * 0.004 * walkStrength;
transformed.y += earMask * sin(uWalkTime * 2.0 - 1.15) * 0.010 * walkStrength;
transformed.z += earMask * side * sin(uWalkTime - 0.80) * 0.005 * walkStrength;
transformed.y += tailMask * sin(uWalkTime * 2.0 - 1.35) * 0.008 * walkStrength;
transformed.z += tailMask * sin(uWalkTime - 1.05) * 0.013 * walkStrength;

transformed.y -= bodyMask * (0.030 + sitMid * 0.006) * sit;
transformed.y -= hipMask * (0.052 + sitMid * 0.014) * sit;
transformed.y -= shoulderMask * (0.026 + sitMid * 0.010) * sit;
transformed.z += bodyMask * side * 0.012 * sit;
transformed.x -= hipMask * 0.014 * sit;
transformed.x += shoulderMask * 0.012 * sit;
transformed.y -= lowerLegMask * rearLegColumn * 0.034 * sit;
transformed.x -= lowerLegMask * rearLegColumn * 0.050 * sit;
transformed.y += hoofMask * rearLegColumn * 0.014 * sit;
transformed.z += hoofMask * rearLegColumn * side * 0.012 * sit;
transformed.y -= lowerLegMask * frontLegColumn * 0.018 * sit;
transformed.x += lowerLegMask * frontLegColumn * 0.036 * sit;
transformed.y += hoofMask * frontLegColumn * 0.008 * sit;
transformed.z -= hoofMask * frontLegColumn * side * 0.006 * sit;
transformed.y -= headMask * (0.032 + sitMid * 0.022) * sit;
transformed.x -= headMask * (0.008 + sitMid * 0.008) * sit;
transformed.z += headMask * side * sitMid * 0.004 * sit;
transformed.y -= earMask * (0.016 + sitMid * 0.010) * sit;
transformed.z += earMask * side * sitMid * 0.006 * sit;
transformed.y -= tailMask * (0.024 + sitMid * 0.008) * sit;
transformed.z += tailMask * side * 0.010 * sit;`
        );
    };
    cloned.customProgramCacheKey = () => "alpaca-avatar-walk-sit-displacement-v8";
    walkUniforms.push(uniforms);
    cloned.needsUpdate = true;
  }
  return cloned;
}

function cloneAvatarScene(scene: Group, texture: Texture, walkUniforms: AvatarWalkUniforms[]): Group {
  texture.colorSpace = SRGBColorSpace;
  texture.flipY = false;
  texture.needsUpdate = true;

  const clone = scene.clone(true);
  clone.traverse((object) => {
    if (!(object instanceof Mesh)) {
      return;
    }

    object.castShadow = true;
    object.receiveShadow = true;
    object.material = Array.isArray(object.material)
      ? object.material.map((material) => cloneAvatarMaterial(material, texture, walkUniforms))
      : cloneAvatarMaterial(object.material, texture, walkUniforms);
  });

  return clone;
}

function getObjectMarkerPoint(room: CampusRoom, item: CampusItem): CampusPoint {
  if (room.id === "school-lobby" && item.id === "information-alpaca") {
    return LOBBY_INFORMATION_ALPACA_POSITION;
  }

  return zoneCenter(item);
}

function isWallFrameItem(roomId: string, itemId: string): boolean {
  return getCampusWallFramePlacements(roomId).some((placement) => placement.itemId === itemId);
}

const MODEL_BACKED_PORTALS = new Set([
  "campus-courtyard:school-entrance",
  "campus-courtyard:school-entrance-2",
  "campus-courtyard:school-entrance-3",
  "school-lobby:lobby-exit",
  "school-lobby:lobby-courtyard-2",
  "school-lobby:lobby-courtyard-3",
  "school-lobby:lobby-library",
  "school-lobby:lobby-debate",
  "guiding-library-lounge:library-to-debate",
  "debate-room-1:debate-room-library"
]);

function isModelBackedPortal(roomId: string, itemId: string): boolean {
  return MODEL_BACKED_PORTALS.has(`${roomId}:${itemId}`);
}

function getPortalPose(room: CampusRoom, item: CampusItem): { position: [number, number, number]; rotationY: number } {
  const [x, , z] = worldToScene(room, zoneCenter(item), 0);
  const floorWidth = room.world.width * WORLD_SCALE;
  const floorDepth = room.world.height * WORLD_SCALE;

  if (room.id === "guiding-library-lounge") {
    const inset = 0.2;

    if (item.id === "library-exit") {
      return { position: [x, 0, floorDepth / 2 - inset], rotationY: Math.PI };
    }

    if (item.id === "library-to-debate") {
      return { position: [floorWidth / 2 - inset, 0, z], rotationY: -Math.PI / 2 };
    }
  }

  if (room.id === "debate-room-1") {
    if (item.id === "debate-room-exit") {
      return { position: [x, 0, z], rotationY: Math.PI };
    }

    if (item.id === "debate-room-library") {
      return { position: [x, 0, z], rotationY: 0 };
    }
  }

  if (room.id !== "school-lobby") {
    return { position: [x, 0, z], rotationY: 0 };
  }

  const inset = LOBBY_WALL_THICKNESS / 2 + 0.08;

  if (item.id === "lobby-library" || item.id === "lobby-debate") {
    return { position: [x, 0, -floorDepth / 2 + inset], rotationY: 0 };
  }

  if (item.id === "lobby-exit") {
    return { position: [x, 0, floorDepth / 2 - inset], rotationY: Math.PI };
  }

  if (item.id === "lobby-courtyard-2" || item.id === "lobby-museum" || item.id === "lobby-classroom") {
    return { position: [-floorWidth / 2 + inset, 0, z], rotationY: Math.PI / 2 };
  }

  if (item.id === "lobby-courtyard-3" || item.id === "lobby-games") {
    return { position: [floorWidth / 2 - inset, 0, z], rotationY: -Math.PI / 2 };
  }

  return { position: [x, 0, z], rotationY: 0 };
}

export function CampusScene(): ReactElement {
  const light = useCampusStore((state) => state.viewSettings.light);

  return (
    <div className="campus3d-canvas">
      <Canvas shadows={{ type: PCFShadowMap }} camera={{ position: [7, 7, 10], fov: 45, near: 0.1, far: 100 }}>
        <RendererClippingSettings />
        <color attach="background" args={["#e8ece4"]} />
        <ambientLight intensity={0.72 * light} />
        <directionalLight
          position={[6, 10, 5]}
          intensity={1.55 * light}
          castShadow
          shadow-mapSize={[2048, 2048]}
        />
        <Physics gravity={[0, -9.81, 0]}>
          <CampusWorld />
        </Physics>
      </Canvas>
    </div>
  );
}

function RendererClippingSettings(): null {
  const { gl } = useThree();

  useEffect(() => {
    const previous = gl.localClippingEnabled;
    gl.localClippingEnabled = true;

    return () => {
      gl.localClippingEnabled = previous;
    };
  }, [gl]);

  return null;
}

function CampusWorld(): ReactElement {
  const roomId = useCampusStore((state) => state.currentRoomId);
  const room = getRoom(roomId);

  return (
    <>
      <color attach="background" args={[getRoomMaterial(room).background]} />
      <RoomGeometry room={room} />
      <KeyboardDriver room={room} />
      <FollowCamera room={room} />
      <LocalAvatar room={room} />
      <RemoteAvatars room={room} />
      <RoomMarkers room={room} />
      <CampusDebugOverlay room={room} />
    </>
  );
}

function RoomGeometry({ room }: { room: CampusRoom }): ReactElement {
  const setMovementTarget = useCampusStore((state) => state.setMovementTarget);
  const debugMode = useCampusStore((state) => state.debugMode);
  const setDebugMouseWorld = useCampusStore((state) => state.setDebugMouseWorld);
  const setDebugLastMapClick = useCampusStore((state) => state.setDebugLastMapClick);
  const setDebugPlacementPoint = useCampusStore((state) => state.setDebugPlacementPoint);
  const selectDebugTarget = useCampusStore((state) => state.selectDebugTarget);
  const debugPlacementZ = useCampusStore((state) => state.debugPlacementZ);
  const material = getRoomMaterial(room);
  const walkBounds = room.walkBounds || { id: "walk", x: 0, y: 0, width: room.world.width, height: room.world.height };
  const floorBounds = getRoomFloorBounds(room, walkBounds);
  const floorWidth = floorBounds.width * WORLD_SCALE;
  const floorDepth = floorBounds.height * WORLD_SCALE;
  const floorCenter = blockedZoneCenter(floorBounds);
  const [floorX, , floorZ] = worldToScene(room, floorCenter, 0);
  const walkCenter = blockedZoneCenter(walkBounds);
  const [walkX, , walkZ] = worldToScene(room, walkCenter, 0.012);
  const wallThickness = room.id === "school-lobby" ? LOBBY_WALL_THICKNESS : 0.35;
  const wallHeight = room.id === "campus-courtyard" ? 0.34 : room.id === "guiding-library-lounge" ? 2.05 : 1.6;
  const wallCenterY = wallHeight / 2;
  const shouldHideSouthWall = room.id === "school-lobby" || room.id === "guiding-library-lounge";
  const usesFullEnvironmentModel = isCampusMapFullEnvironmentModelRoom(room.id);

  return (
    <group>
      <RigidBody type="fixed" colliders="cuboid">
        <mesh
          receiveShadow
          position={[floorX, 0, floorZ]}
          rotation={[-Math.PI / 2, 0, 0]}
          onPointerDown={(event) => {
            event.stopPropagation();
            const worldPoint = sceneToWorld(room, event.point);

            if (debugMode) {
              const debugClick = createCampusDebugPlacementClick({
                roomId: room.id,
                point: worldPoint,
                z: debugPlacementZ,
                altKey: event.altKey,
                shiftKey: event.shiftKey
              });

              window.console.log(
                `[campus-debug] room=${room.id} mode=${debugClick.mode} x=${debugClick.point.x} y=${debugClick.point.y} z=${formatDebugZ(debugClick.z)}`
              );
              window.console.log(`[campus-debug] snippet ${debugClick.snippet}`);

              if (event.shiftKey || event.altKey) {
                void copyCampusDebugSnippet(debugClick.snippet).then((copied) => {
                  useCampusStore.getState().setDebugLastMapClick({
                    ...debugClick,
                    copied
                  });
                });
              }

              setDebugLastMapClick(debugClick);
              setDebugPlacementPoint(debugClick.point);
              selectDebugTarget(null);
              return;
            }

            if (!event.shiftKey && !event.altKey) {
              setMovementTarget(worldPoint);
            }
          }}
          onPointerMove={(event) => {
            if (debugMode) {
              setDebugMouseWorld(sceneToWorld(room, event.point));
            }
          }}
          onPointerLeave={() => {
            if (debugMode) {
              setDebugMouseWorld(null);
            }
          }}
        >
          <planeGeometry args={[floorWidth, floorDepth]} />
          {usesFullEnvironmentModel ? (
            <meshBasicMaterial transparent opacity={0} depthWrite={false} />
          ) : room.id === "guiding-library-lounge" ? (
            <Suspense fallback={<meshStandardMaterial color="#a76422" roughness={0.8} />}>
              <LibraryFloorMaterial floorWidth={floorWidth} floorDepth={floorDepth} />
            </Suspense>
          ) : (
            <meshStandardMaterial color={material.floor} roughness={0.92} />
          )}
        </mesh>
      </RigidBody>
      {!usesFullEnvironmentModel
      && room.id !== "school-lobby"
      && room.id !== "campus-courtyard"
      && room.id !== "guiding-library-lounge" ? (
        <mesh position={[walkX, 0.018, walkZ]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[walkBounds.width * WORLD_SCALE, walkBounds.height * WORLD_SCALE]} />
          <meshStandardMaterial color={material.carpet} roughness={0.95} />
        </mesh>
      ) : null}

      {room.id === "campus-courtyard" ? <ChambordCourtyardGround room={room} /> : null}
      {room.id === "campus-courtyard" && !usesFullEnvironmentModel ? <CourtyardGroundDetails room={room} /> : null}

      {!usesFullEnvironmentModel ? (
        <>
          <mesh position={[0, wallCenterY, -floorDepth / 2]} castShadow receiveShadow>
            <boxGeometry args={[floorWidth, wallHeight, wallThickness]} />
            <meshStandardMaterial color={material.wall} roughness={0.86} />
          </mesh>
          {!shouldHideSouthWall ? (
            <mesh position={[0, wallCenterY, floorDepth / 2]} castShadow receiveShadow>
              <boxGeometry args={[floorWidth, wallHeight, wallThickness]} />
              <meshStandardMaterial color={material.wall} roughness={0.86} />
            </mesh>
          ) : null}
          <mesh position={[-floorWidth / 2, wallCenterY, 0]} castShadow receiveShadow>
            <boxGeometry args={[wallThickness, wallHeight, floorDepth]} />
            <meshStandardMaterial color={material.wall} roughness={0.86} />
          </mesh>
          <mesh position={[floorWidth / 2, wallCenterY, 0]} castShadow receiveShadow>
            <boxGeometry args={[wallThickness, wallHeight, floorDepth]} />
            <meshStandardMaterial color={material.wall} roughness={0.86} />
          </mesh>
        </>
      ) : null}

      {(room.blockedZones || []).map((zone) => {
        const [x, , z] = worldToScene(room, blockedZoneCenter(zone), 0.18);

        if (isRingZone(zone) || isPathZone(zone)) {
          return null;
        }

        return (
          <RigidBody key={zone.id} type="fixed" colliders="cuboid">
            <mesh position={[x, 0.18, z]} visible={false}>
              <boxGeometry args={[zone.width * WORLD_SCALE, 0.36, zone.height * WORLD_SCALE]} />
              <meshBasicMaterial transparent opacity={0} depthWrite={false} />
            </mesh>
          </RigidBody>
        );
      })}

      <Suspense fallback={null}>
        <EnvironmentAssetProps room={room} />
      </Suspense>
      <Suspense fallback={null}>
        <WallWallpaperProps room={room} />
      </Suspense>
      <Suspense fallback={null}>
        <WallFrameProps room={room} />
      </Suspense>
    </group>
  );
}

function CourtyardGroundPatch({
  room,
  x,
  y,
  width,
  depth,
  color,
  opacity = 1,
  height = 0.026,
  rotationZ = 0
}: {
  room: CampusRoom;
  x: number;
  y: number;
  width: number;
  depth: number;
  color: string;
  opacity?: number;
  height?: number;
  rotationZ?: number;
}): ReactElement {
  const position = worldToScene(room, designPoint(x, y), height);

  return (
    <mesh position={position} rotation={[-Math.PI / 2, 0, rotationZ]} receiveShadow>
      <planeGeometry args={[width * DESIGN_COORDINATE_SCALE * WORLD_SCALE, depth * DESIGN_COORDINATE_SCALE * WORLD_SCALE]} />
      <meshStandardMaterial color={color} roughness={0.9} transparent={opacity < 1} opacity={opacity} />
    </mesh>
  );
}

function ChambordCourtyardGround({ room }: { room: CampusRoom }): ReactElement {
  const position = worldToScene(room, designPoint(1200, 875), 0.008);

  return (
    <mesh position={position} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[2300 * DESIGN_COORDINATE_SCALE * WORLD_SCALE, 1280 * DESIGN_COORDINATE_SCALE * WORLD_SCALE]} />
      <meshStandardMaterial color="#bfb7ab" roughness={0.96} metalness={0.02} />
    </mesh>
  );
}

function CourtyardAthleticsTrack({ room }: { room: CampusRoom }): ReactElement {
  const position = worldToScene(room, designPoint(1770, 1010), 0.043);

  return (
    <group position={position}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} scale={[1.55, 1, 1]} receiveShadow>
        <circleGeometry args={[2.42, 72]} />
        <meshStandardMaterial color="#6ea162" roughness={0.95} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} scale={[1.55, 1, 1]}>
        <ringGeometry args={[2.55, 3.55, 96]} />
        <meshStandardMaterial color="#b85f42" roughness={0.86} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} scale={[1.55, 1, 1]}>
        <ringGeometry args={[2.83, 2.88, 96]} />
        <meshBasicMaterial color="#f8e7c4" transparent opacity={0.84} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} scale={[1.55, 1, 1]}>
        <ringGeometry args={[3.16, 3.21, 96]} />
        <meshBasicMaterial color="#f8e7c4" transparent opacity={0.84} />
      </mesh>
      <mesh position={[0, 0.012, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.08, 6.6]} />
        <meshBasicMaterial color="#f8e7c4" transparent opacity={0.8} />
      </mesh>
    </group>
  );
}

function CourtyardSwingSet({ room }: { room: CampusRoom }): ReactElement {
  const position = worldToScene(room, designPoint(430, 910), 0.04);
  const swingXs = [-0.82, 0, 0.82];

  return (
    <group position={position}>
      <mesh position={[0, 1.2, 0]} castShadow>
        <boxGeometry args={[3.15, 0.08, 0.08]} />
        <meshStandardMaterial color="#7d5534" roughness={0.78} />
      </mesh>
      {[-1.45, 1.45].map((postX) => (
        <mesh key={postX} position={[postX, 0.6, 0]} castShadow>
          <boxGeometry args={[0.1, 1.2, 0.1]} />
          <meshStandardMaterial color="#7d5534" roughness={0.78} />
        </mesh>
      ))}
      {swingXs.map((swingX) => (
        <group key={swingX} position={[swingX, 0, 0]}>
          <mesh position={[-0.16, 0.78, 0]}>
            <boxGeometry args={[0.025, 0.72, 0.025]} />
            <meshStandardMaterial color="#efe8dc" roughness={0.65} />
          </mesh>
          <mesh position={[0.16, 0.78, 0]}>
            <boxGeometry args={[0.025, 0.72, 0.025]} />
            <meshStandardMaterial color="#efe8dc" roughness={0.65} />
          </mesh>
          <mesh position={[0, 0.42, 0]} castShadow>
            <boxGeometry args={[0.48, 0.08, 0.3]} />
            <meshStandardMaterial color="#d6a15c" roughness={0.74} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function CourtyardSlide({ room }: { room: CampusRoom }): ReactElement {
  const position = worldToScene(room, designPoint(265, 1085), 0.06);

  return (
    <group position={position} rotation={[0, -Math.PI / 7, 0]}>
      <mesh position={[0, 0.35, 0]} castShadow>
        <boxGeometry args={[0.92, 0.7, 0.85]} />
        <meshStandardMaterial color="#4f7e9a" roughness={0.78} />
      </mesh>
      <mesh position={[0.62, 0.28, 0]} rotation={[0, 0, -0.48]} castShadow>
        <boxGeometry args={[1.2, 0.12, 0.42]} />
        <meshStandardMaterial color="#e3b448" roughness={0.7} />
      </mesh>
    </group>
  );
}

function CourtyardGroundDetails({ room }: { room: CampusRoom }): ReactElement {
  const parkingStripeXs = [360, 450, 540, 630, 720, 810];

  return (
    <>
      <CourtyardGroundPatch room={room} x={1200} y={985} width={230} depth={980} color="#d8c58f" height={0.024} />
      <CourtyardGroundPatch room={room} x={1200} y={570} width={680} depth={220} color="#cfb77d" height={0.025} />
      <CourtyardGroundPatch room={room} x={580} y={1350} width={720} depth={330} color="#3f464a" height={0.027} />
      <CourtyardGroundPatch room={room} x={580} y={1190} width={560} depth={62} color="#536066" height={0.029} />
      {parkingStripeXs.map((stripeX) => (
        <CourtyardGroundPatch
          key={stripeX}
          room={room}
          x={stripeX}
          y={1360}
          width={8}
          depth={245}
          color="#f1ead6"
          opacity={0.72}
          height={0.031}
        />
      ))}
      <CourtyardGroundPatch room={room} x={430} y={990} width={560} depth={370} color="#b9a06c" opacity={0.38} height={0.028} />
      <CourtyardGroundPatch room={room} x={540} y={655} width={610} depth={330} color="#bda875" opacity={0.5} height={0.028} />
      <CourtyardAthleticsTrack room={room} />
      <CourtyardSwingSet room={room} />
      <CourtyardSlide room={room} />
    </>
  );
}

function useConfiguredTextureSet(paths: CampusTextureSetPaths, repeat: [number, number]) {
  const sourceTextures = useTexture(paths);
  const textures = useMemo(
    () => ({
      map: sourceTextures.map.clone(),
      normalMap: sourceTextures.normalMap.clone(),
      roughnessMap: sourceTextures.roughnessMap.clone()
    }),
    [sourceTextures.map, sourceTextures.normalMap, sourceTextures.roughnessMap]
  );

  useEffect(() => {
    [textures.map, textures.normalMap, textures.roughnessMap].forEach((texture: Texture) => {
      texture.wrapS = RepeatWrapping;
      texture.wrapT = RepeatWrapping;
      texture.repeat.set(repeat[0], repeat[1]);
      texture.needsUpdate = true;
    });

    textures.map.colorSpace = SRGBColorSpace;
  }, [repeat, textures.map, textures.normalMap, textures.roughnessMap]);

  useEffect(() => {
    return () => {
      [textures.map, textures.normalMap, textures.roughnessMap].forEach((texture) => texture.dispose());
    };
  }, [textures]);

  return textures;
}

function LobbyFloorMaterial({ floorWidth, floorDepth }: { floorWidth: number; floorDepth: number }): ReactElement {
  const textures = useConfiguredTextureSet(LOBBY_FLOOR_TEXTURES, [
    Math.max(1, floorWidth / 2),
    Math.max(1, floorDepth / 2)
  ]);

  return (
    <meshStandardMaterial
      map={textures.map}
      normalMap={textures.normalMap}
      roughnessMap={textures.roughnessMap}
      roughness={0.94}
      metalness={0.02}
    />
  );
}

function LibraryFloorMaterial({ floorWidth, floorDepth }: { floorWidth: number; floorDepth: number }): ReactElement {
  const sourceTextures = useTexture(LIBRARY_FLOOR_TEXTURES);
  const textures = useMemo(
    () => ({
      map: sourceTextures.map.clone(),
      normalMap: sourceTextures.normalMap.clone()
    }),
    [sourceTextures.map, sourceTextures.normalMap]
  );

  useEffect(() => {
    [textures.map, textures.normalMap].forEach((texture: Texture) => {
      texture.wrapS = RepeatWrapping;
      texture.wrapT = RepeatWrapping;
      texture.repeat.set(Math.max(1, floorWidth / 1.25), Math.max(1, floorDepth / 1.25));
      texture.needsUpdate = true;
    });

    textures.map.colorSpace = SRGBColorSpace;
  }, [floorDepth, floorWidth, textures.map, textures.normalMap]);

  useEffect(() => {
    return () => {
      textures.map.dispose();
      textures.normalMap.dispose();
    };
  }, [textures]);

  return <meshStandardMaterial map={textures.map} normalMap={textures.normalMap} roughness={0.64} metalness={0.02} />;
}

function LobbyWallMaterial({ repeat }: { repeat: [number, number] }): ReactElement {
  const textures = useConfiguredTextureSet(LOBBY_WALL_TEXTURES, repeat);

  return (
    <meshStandardMaterial
      map={textures.map}
      normalMap={textures.normalMap}
      roughnessMap={textures.roughnessMap}
      roughness={0.68}
      metalness={0.02}
    />
  );
}

function LobbyDoorMaterial(): ReactElement {
  const textures = useConfiguredTextureSet(LOBBY_DOOR_TEXTURES, [1, 1]);

  return (
    <meshStandardMaterial
      map={textures.map}
      normalMap={textures.normalMap}
      roughnessMap={textures.roughnessMap}
      roughness={0.78}
      metalness={0.02}
    />
  );
}

function EnvironmentAssetProps({ room }: { room: CampusRoom }): ReactElement {
  const placements = getCampusMapDecorativePlacements(room.id);

  return (
    <group>
      {placements.map((placement) => (
        <EnvironmentAssetProp key={placement.id} room={room} placement={placement} />
      ))}
    </group>
  );
}

function WallFrameProps({ room }: { room: CampusRoom }): ReactElement | null {
  const placements = getCampusWallFramePlacements(room.id);

  if (!placements.length) {
    return null;
  }

  return (
    <group>
      {placements.map((placement) => (
        <WallFrame key={placement.id} room={room} placement={placement} />
      ))}
    </group>
  );
}

function WallWallpaperProps({ room }: { room: CampusRoom }): ReactElement | null {
  const placements = getCampusWallWallpaperPlacements(room.id);

  if (!placements.length) {
    return null;
  }

  return (
    <group>
      {placements.map((placement) => (
        <WallWallpaper key={placement.id} room={room} placement={placement} />
      ))}
    </group>
  );
}

function getWallSurfacePose(
  room: CampusRoom,
  placement: CampusWallWallpaperPlacement
): { position: [number, number, number]; rotationY: number } {
  const floorWidth = room.world.width * WORLD_SCALE;
  const floorDepth = room.world.height * WORLD_SCALE;
  const verticalCenter = placement.bottomHeight + placement.height / 2;
  const [x, , z] = worldToScene(room, placement.point, verticalCenter);
  const wallOffset = 0.205;

  if (placement.wall === "north") {
    return { position: [x, verticalCenter, -floorDepth / 2 + wallOffset], rotationY: 0 };
  }

  if (placement.wall === "south") {
    return { position: [x, verticalCenter, floorDepth / 2 - wallOffset], rotationY: Math.PI };
  }

  if (placement.wall === "west") {
    return { position: [-floorWidth / 2 + wallOffset, verticalCenter, z], rotationY: Math.PI / 2 };
  }

  return { position: [floorWidth / 2 - wallOffset, verticalCenter, z], rotationY: -Math.PI / 2 };
}

function WallWallpaper({
  room,
  placement
}: {
  room: CampusRoom;
  placement: CampusWallWallpaperPlacement;
}): ReactElement {
  const texture = useTexture(CAMPUS_LIBRARY_ROCOCO_WALLPAPER_TEXTURE_SRC) as Texture;
  const pose = getWallSurfacePose(room, placement);

  useEffect(() => {
    texture.colorSpace = SRGBColorSpace;
    texture.wrapS = ClampToEdgeWrapping;
    texture.wrapT = ClampToEdgeWrapping;
    texture.needsUpdate = true;
  }, [texture]);

  return (
    <mesh
      position={pose.position}
      rotation={[0, pose.rotationY, 0]}
      scale={[placement.mirrored ? -1 : 1, 1, 1]}
      renderOrder={3}
    >
      <planeGeometry args={[placement.width, placement.height]} />
      <meshBasicMaterial map={texture} side={DoubleSide} toneMapped={false} />
    </mesh>
  );
}

function getWallFramePose(
  room: CampusRoom,
  placement: CampusWallFramePlacement
): { position: [number, number, number]; rotationY: number } {
  const floorWidth = room.world.width * WORLD_SCALE;
  const floorDepth = room.world.height * WORLD_SCALE;
  const verticalCenter = placement.bottomHeight + placement.height / 2;
  const [x, , z] = worldToScene(room, placement.point, verticalCenter);
  const wallOffset = 0.2;

  if (placement.wall === "north") {
    return { position: [x, verticalCenter, -floorDepth / 2 + wallOffset], rotationY: 0 };
  }

  if (placement.wall === "south") {
    return { position: [x, verticalCenter, floorDepth / 2 - wallOffset], rotationY: Math.PI };
  }

  if (placement.wall === "west") {
    return { position: [-floorWidth / 2 + wallOffset, verticalCenter, z], rotationY: Math.PI / 2 };
  }

  return { position: [floorWidth / 2 - wallOffset, verticalCenter, z], rotationY: -Math.PI / 2 };
}

function WallFrameImage({
  src,
  width,
  height
}: {
  src: string;
  width: number;
  height: number;
}): ReactElement | null {
  const texture = useTexture(src || TRANSPARENT_PIXEL_TEXTURE_SRC) as Texture;
  const image = texture.image as { width?: number; height?: number } | undefined;
  const imageAspect = image?.width && image?.height ? image.width / image.height : width / height;
  const frameAspect = width / height;
  const fittedWidth = imageAspect >= frameAspect ? width : height * imageAspect;
  const fittedHeight = imageAspect >= frameAspect ? width / imageAspect : height;

  useEffect(() => {
    texture.colorSpace = SRGBColorSpace;
    texture.wrapS = ClampToEdgeWrapping;
    texture.wrapT = ClampToEdgeWrapping;
    texture.needsUpdate = true;
  }, [texture]);

  if (!src) {
    return null;
  }

  return (
    <mesh position={[0, 0, -0.006]} renderOrder={9}>
      <planeGeometry args={[fittedWidth, fittedHeight]} />
      <meshBasicMaterial map={texture} side={DoubleSide} toneMapped={false} />
    </mesh>
  );
}

function WallFrame({
  room,
  placement
}: {
  room: CampusRoom;
  placement: CampusWallFramePlacement;
}): ReactElement {
  const texture = useTexture(CAMPUS_ORNATE_FRAME_TEXTURE_SRC) as Texture;
  const openItemPanel = useCampusStore((state) => state.openItemPanel);
  const item = useMemo(
    () => [
      ...(room.objects || []),
      ...(room.portals || []),
      ...(room.seats || [])
    ].find((entry) => entry.id === placement.itemId) || null,
    [placement.itemId, room]
  );
  const pose = getWallFramePose(room, placement);

  useEffect(() => {
    texture.colorSpace = SRGBColorSpace;
    texture.needsUpdate = true;
  }, [texture]);

  return (
    <group
      position={pose.position}
      rotation={[0, pose.rotationY, 0]}
      onPointerDown={item ? (event) => {
        event.stopPropagation();
        openItemPanel(item);
      } : undefined}
      onPointerOver={item ? (event) => {
        event.stopPropagation();
        document.body.style.cursor = "pointer";
      } : undefined}
      onPointerOut={item ? () => {
        document.body.style.cursor = "";
      } : undefined}
    >
      <WallFrameImage src={placement.imageSrc} width={placement.width * 0.68} height={placement.height * 0.62} />
      <mesh renderOrder={10}>
        <planeGeometry args={[placement.width, placement.height]} />
        <meshBasicMaterial
          map={texture}
          transparent
          alphaTest={0.08}
          depthWrite={false}
          side={DoubleSide}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}

function EnvironmentAssetProp({
  room,
  placement
}: {
  room: CampusRoom;
  placement: EnvironmentAssetPlacement;
}): ReactElement {
  const groupRef = useRef<Group>(null);
  const openProgressRef = useRef(0);
  const [isOpen, setIsOpen] = useState(false);
  const openItemPanel = useCampusStore((state) => state.openItemPanel);
  const debugMode = useCampusStore((state) => state.debugMode);
  const debugPlacementZ = useCampusStore((state) => state.debugPlacementZ);
  const setDebugLastMapClick = useCampusStore((state) => state.setDebugLastMapClick);
  const setDebugPlacementPoint = useCampusStore((state) => state.setDebugPlacementPoint);
  const selectDebugTarget = useCampusStore((state) => state.selectDebugTarget);
  const { scene } = useGLTF(RAW_ENVIRONMENT_ASSETS[placement.asset]);
  const linkedPortal = useMemo(
    () => placement.portalId ? (room.portals || []).find((item) => item.id === placement.portalId) || null : null,
    [placement.portalId, room.portals]
  );
  const shouldAnimateDoor = Boolean(placement.openOnClick && linkedPortal);
  const hiddenMeshNameKey = placement.hiddenMeshNames?.join("|") || "";
  const clippingPlanes = useMemo(
    () => placement.clipWorldBounds ? createWorldClippingPlanes(room, placement.clipWorldBounds) : null,
    [placement.clipWorldBounds, room]
  );
  const model = useMemo(() => {
    const clone = scene.clone(true);
    const hiddenMeshNames = new Set(placement.hiddenMeshNames || []);
    const hiddenMeshes: Mesh[] = [];

    clone.traverse((object) => {
      if (!(object instanceof Mesh)) {
        return;
      }

      if (hiddenMeshNames.has(object.name)) {
        hiddenMeshes.push(object);
        return;
      }

      if (placement.renderOnTop) {
        object.renderOrder = 12;
      }

      object.castShadow = true;
      object.receiveShadow = true;
      object.material = Array.isArray(object.material)
        ? object.material.map((material) => material.clone())
        : object.material.clone();

      const materials = Array.isArray(object.material) ? object.material : [object.material];
      materials.forEach((material) => {
        material.side = DoubleSide;
        if (placement.tintColor && material instanceof MeshStandardMaterial) {
          material.map = null;
          material.normalMap = null;
          material.roughnessMap = null;
          material.color.set(placement.tintColor);
          material.metalness = 0.02;
          material.roughness = 0.76;
        }
        if (placement.renderOnTop) {
          material.depthTest = false;
          material.depthWrite = false;
        }
        if (
          (placement.asset === "customWhiteboard" || placement.asset === "customClassroomWhiteboard") &&
          material instanceof MeshStandardMaterial
        ) {
          material.map = null;
          material.color.set("#f8f6ec");
          material.metalness = 0.02;
          material.roughness = 0.74;
        }
        if (clippingPlanes) {
          material.clippingPlanes = clippingPlanes;
          material.clipIntersection = false;
        }
        material.needsUpdate = true;
      });

      if (placement.asset === "ornateLibraryBookcase" && ORNATE_BOOK_MESH_PATTERN.test(object.name)) {
        const sourceMaterial = Array.isArray(object.material) ? object.material[0] : object.material;
        const material = sourceMaterial instanceof MeshStandardMaterial ? sourceMaterial.clone() : new MeshStandardMaterial();
        const bookColor = getOrnateBookColor(placement.id, object.name);
        material.color.set(bookColor);
        material.metalness = bookColor === "#c79a2f" ? 0.16 : 0.04;
        material.roughness = 0.66;
        material.side = DoubleSide;
        object.material = material;
      }
    });

    hiddenMeshes.forEach((mesh) => mesh.parent?.remove(mesh));

    if (placement.normalize) {
      clone.updateMatrixWorld(true);
      const bounds = new Box3().setFromObject(clone);
      const center = bounds.getCenter(new Vector3());
      clone.position.x -= center.x;
      if (placement.upAxis === "z") {
        clone.position.y -= center.y;
        clone.position.z -= bounds.min.z;
      } else {
        clone.position.z -= center.z;
        clone.position.y -= bounds.min.y;
      }
    }

    return clone;
  }, [clippingPlanes, hiddenMeshNameKey, placement.asset, placement.hiddenMeshNames, placement.id, placement.normalize, placement.renderOnTop, placement.tintColor, placement.upAxis, scene]);
  const [x, , z] = worldToScene(room, placement.point, placement.height ?? 0.02);

  useFrame((_state, delta) => {
    if (!shouldAnimateDoor || !groupRef.current) {
      return;
    }

    const target = isOpen ? 1 : 0;
    openProgressRef.current += (target - openProgressRef.current) * (1 - Math.exp(-8 * delta));
    const openAngle = (placement.openAngle ?? Math.PI / 2) * (placement.openDirection ?? 1) * openProgressRef.current;
    groupRef.current.rotation.set(
      placement.rotationX ?? 0,
      (placement.rotationY ?? 0) + openAngle,
      placement.rotationZ ?? 0
    );
  });

  return (
    <group
      ref={groupRef}
      position={[x, placement.height ?? 0.02, z]}
      rotation={[placement.rotationX ?? 0, placement.rotationY ?? 0, placement.rotationZ ?? 0]}
      renderOrder={placement.renderOnTop ? 12 : undefined}
      scale={placement.scale ?? 1}
      onPointerDown={debugMode || linkedPortal ? (event) => {
        event.stopPropagation();
        if (debugMode) {
          const worldPoint = sceneToWorld(room, event.point);
          const debugClick = createCampusDebugPlacementClick({
            roomId: room.id,
            point: worldPoint,
            z: debugPlacementZ,
            altKey: event.altKey,
            shiftKey: event.shiftKey
          });

          window.console.log(
            `[campus-debug] room=${room.id} mode=${debugClick.mode} x=${debugClick.point.x} y=${debugClick.point.y} z=${formatDebugZ(debugClick.z)}`
          );
          window.console.log(`[campus-debug] snippet ${debugClick.snippet}`);
          setDebugLastMapClick(debugClick);
          setDebugPlacementPoint(debugClick.point);
          selectDebugTarget(null);
          return;
        }
        if (!linkedPortal) {
          return;
        }
        if (shouldAnimateDoor) {
          setIsOpen(true);
          window.setTimeout(() => openItemPanel(linkedPortal), 220);
          return;
        }
        openItemPanel(linkedPortal);
      } : undefined}
    >
      <primitive object={model} />
    </group>
  );
}

function createWorldClippingPlanes(
  room: CampusRoom,
  bounds: { x: number; y: number; width: number; height: number }
): Plane[] {
  const minSceneX = worldToScene(room, { x: bounds.x, y: 0 })[0];
  const maxSceneX = worldToScene(room, { x: bounds.x + bounds.width, y: 0 })[0];
  const minSceneZ = worldToScene(room, { x: 0, y: bounds.y })[2];
  const maxSceneZ = worldToScene(room, { x: 0, y: bounds.y + bounds.height })[2];

  return [
    new Plane(new Vector3(1, 0, 0), -minSceneX),
    new Plane(new Vector3(-1, 0, 0), maxSceneX),
    new Plane(new Vector3(0, 0, 1), -minSceneZ),
    new Plane(new Vector3(0, 0, -1), maxSceneZ)
  ];
}

const DEBUG_COLORS = {
  asset: "#f8f0df",
  collision: "#ff4d00",
  grid: "#2f7cff",
  interaction: "#d946ef",
  object: "#00d1ff",
  player: "#2cff9a",
  portal: "#f2cc8f",
  seat: "#b5f25c",
  sitting: "#48f5a5",
  walkBounds: "#38bdf8"
} as const;

function CampusDebugOverlay({ room }: { room: CampusRoom }): ReactElement | null {
  const debugMode = useCampusStore((state) => state.debugMode);
  const localPlayer = useCampusStore((state) => state.localPlayer);
  const mouseWorld = useCampusStore((state) => state.debugMouseWorld);
  const debugPlacementZ = useCampusStore((state) => state.debugPlacementZ);
  const debugPlacementPoint = useCampusStore((state) => state.debugPlacementPoint);
  const debugZoneDrafts = useCampusStore((state) => state.debugZoneDrafts);

  if (!debugMode) {
    return null;
  }

  const interactables = getCampusDebugInteractables(room);
  const collisionZones = getCampusDebugCollisionZones(room).map((zone) =>
    debugZoneDrafts[getCampusDebugZoneDraftKey(room.id, "blocked", zone.id)] || zone
  );
  const sittingZones = getCampusDebugSittingZones(room).map((zone) =>
    debugZoneDrafts[getCampusDebugZoneDraftKey(room.id, "sitting", zone.id)] || zone
  );
  const assetPlacements = getCampusDebugAssetPlacements(room.id);

  return (
    <group renderOrder={1000}>
      <DebugGrid room={room} />
      <DebugWalkBounds room={room} />
      <DebugPlayerBox room={room} player={localPlayer} />
      {collisionZones.map((zone) => (
        <DebugCollisionZone key={zone.id} room={room} zone={zone} />
      ))}
      {sittingZones.map((zone) => (
        <DebugSittingZone key={zone.id} room={room} zone={zone} />
      ))}
      {interactables.map(({ item, debugKind }) => (
        <group key={item.id}>
          <DebugItemBox room={room} item={item} color={getDebugItemColor(debugKind)} />
          <DebugInteractionZone room={room} item={item} />
          <DebugItemLabel room={room} item={item} color={getDebugItemColor(debugKind)} />
        </group>
      ))}
      {assetPlacements.map((placement) => (
        <DebugAssetPlacementLabel key={placement.id} room={room} placement={placement} />
      ))}
      <DebugMousePoint room={room} point={mouseWorld} z={debugPlacementZ} />
      <DebugPlacementPoint room={room} point={debugPlacementPoint} z={debugPlacementZ} />
    </group>
  );
}

function DebugWalkBounds({ room }: { room: CampusRoom }): ReactElement | null {
  if (!room.walkBounds) {
    return null;
  }

  const [x, , z] = worldToScene(room, blockedZoneCenter(room.walkBounds), 0.16);
  const width = room.walkBounds.width * WORLD_SCALE;
  const depth = room.walkBounds.height * WORLD_SCALE;

  return (
    <group>
      <mesh position={[x, 0.16, z]}>
        <boxGeometry args={[width, 0.08, depth]} />
        <meshBasicMaterial color={DEBUG_COLORS.walkBounds} wireframe transparent opacity={0.95} depthTest={false} />
      </mesh>
      <Text position={[x, 0.56, z]} fontSize={0.12} maxWidth={3.4} anchorX="center" anchorY="middle" color={DEBUG_COLORS.walkBounds}>
        {`${room.walkBounds.id || "walkBounds"}\nwalk bounds`}
      </Text>
    </group>
  );
}

function DebugGrid({ room }: { room: CampusRoom }): ReactElement {
  const bounds = room.walkBounds
    ? room.walkBounds
    : { id: "room-debug-grid", x: 0, y: 0, width: room.world.width, height: room.world.height };
  const verticalLines = useMemo(
    () => {
      const first = Math.ceil(bounds.x / CAMPUS_DEBUG_GRID_STEP) * CAMPUS_DEBUG_GRID_STEP;
      const last = Math.floor((bounds.x + bounds.width) / CAMPUS_DEBUG_GRID_STEP) * CAMPUS_DEBUG_GRID_STEP;
      return Array.from(
        { length: Math.max(0, Math.floor((last - first) / CAMPUS_DEBUG_GRID_STEP) + 1) },
        (_item, index) => first + index * CAMPUS_DEBUG_GRID_STEP
      );
    },
    [bounds.width, bounds.x]
  );
  const horizontalLines = useMemo(
    () => {
      const first = Math.ceil(bounds.y / CAMPUS_DEBUG_GRID_STEP) * CAMPUS_DEBUG_GRID_STEP;
      const last = Math.floor((bounds.y + bounds.height) / CAMPUS_DEBUG_GRID_STEP) * CAMPUS_DEBUG_GRID_STEP;
      return Array.from(
        { length: Math.max(0, Math.floor((last - first) / CAMPUS_DEBUG_GRID_STEP) + 1) },
        (_item, index) => first + index * CAMPUS_DEBUG_GRID_STEP
      );
    },
    [bounds.height, bounds.y]
  );
  const gridWidth = bounds.width * WORLD_SCALE;
  const gridDepth = bounds.height * WORLD_SCALE;
  const lineThickness = 0.012;

  return (
    <group>
      {verticalLines.map((xWorld) => {
        const [x, , z] = worldToScene(room, { x: xWorld, y: bounds.y + bounds.height / 2 }, 0.07);
        return (
          <mesh key={`grid-x-${xWorld}`} position={[x, 0.07, z]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[lineThickness, gridDepth]} />
            <meshBasicMaterial color={DEBUG_COLORS.grid} transparent opacity={0.24} depthWrite={false} depthTest={false} />
          </mesh>
        );
      })}
      {horizontalLines.map((yWorld) => {
        const [x, , z] = worldToScene(room, { x: bounds.x + bounds.width / 2, y: yWorld }, 0.071);
        return (
          <mesh key={`grid-y-${yWorld}`} position={[x, 0.071, z]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[gridWidth, lineThickness]} />
            <meshBasicMaterial color={DEBUG_COLORS.grid} transparent opacity={0.24} depthWrite={false} depthTest={false} />
          </mesh>
        );
      })}
    </group>
  );
}

function DebugPlayerBox({ room, player }: { room: CampusRoom; player: CampusPlayer }): ReactElement {
  const yCenterOffset = (PLAYER_BLOCKING_BOUNDS.frontY - PLAYER_BLOCKING_BOUNDS.backY) / 2;
  const debugCenter = { x: player.x, y: player.y + yCenterOffset };
  const [x, , z] = worldToScene(room, debugCenter, 0.26);
  const width = (PLAYER_BLOCKING_BOUNDS.left + PLAYER_BLOCKING_BOUNDS.right) * WORLD_SCALE;
  const depth = (PLAYER_BLOCKING_BOUNDS.backY + PLAYER_BLOCKING_BOUNDS.frontY) * WORLD_SCALE;

  return (
    <group>
      <mesh position={[x, 0.08, z]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[width, depth]} />
        <meshBasicMaterial color={DEBUG_COLORS.player} transparent opacity={0.24} depthWrite={false} depthTest={false} />
      </mesh>
      <mesh position={[x, 0.28, z]}>
        <boxGeometry args={[width, 0.38, depth]} />
        <meshBasicMaterial color={DEBUG_COLORS.player} wireframe transparent opacity={0.95} depthTest={false} />
      </mesh>
      <Text position={[x, 1.34, z]} fontSize={0.12} maxWidth={2.4} anchorX="center" anchorY="middle" color={DEBUG_COLORS.player}>
        {`player\n${formatDebugPoint3D(player, 0)}`}
      </Text>
    </group>
  );
}

function DebugCollisionZone({
  room,
  zone
}: {
  room: CampusRoom;
  zone: CampusZone;
}): ReactElement {
  const debugSelection = useCampusStore((state) => state.debugSelection);
  const isSelected = debugSelection?.roomId === room.id
    && debugSelection.targetType === "zone"
    && debugSelection.zoneKind === "blocked"
    && debugSelection.id === zone.id;
  const color = isSelected ? "#fffaf0" : DEBUG_COLORS.collision;
  const [x, , z] = worldToScene(room, blockedZoneCenter(zone), 0.11);

  if (isRingZone(zone)) {
    const { innerRadius, outerRadius } = getRingZoneRadii(zone);

    return (
      <group>
        <mesh position={[x, 0.095, z]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[innerRadius, outerRadius, 128]} />
          <meshBasicMaterial color={color} transparent opacity={isSelected ? 0.46 : 0.36} depthWrite={false} depthTest={false} />
        </mesh>
        <mesh position={[x, 0.115, z]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[innerRadius, outerRadius, 128]} />
          <meshBasicMaterial color={color} wireframe transparent opacity={0.95} depthTest={false} />
        </mesh>
        <Text position={[x, 0.72, z]} fontSize={0.12} maxWidth={3.2} anchorX="center" anchorY="middle" color={color}>
          {`${zone.id}\nr:${Math.round(zone.radius)} t:${Math.round(zone.thickness ?? 48)}`}
        </Text>
      </group>
    );
  }

  if (isPathZone(zone)) {
    const thickness = (zone.thickness ?? 46) * WORLD_SCALE;

    return (
      <group>
        {getPathZoneSegments(zone).map(([start, end], index) => {
          const segment = getPathSegmentPose(room, start, end, 0.11);

          return (
            <mesh key={`${zone.id}-${index}`} position={segment.position} rotation={[0, segment.rotationY, 0]}>
              <boxGeometry args={[segment.length, 0.055, thickness]} />
              <meshBasicMaterial color={color} wireframe transparent opacity={0.95} depthTest={false} />
            </mesh>
          );
        })}
        {getPathZoneSegments(zone).map(([start, end], index) => {
          const segment = getPathSegmentPose(room, start, end, 0.09);

          return (
            <mesh key={`${zone.id}-fill-${index}`} position={segment.position} rotation={[0, segment.rotationY, 0]}>
              <boxGeometry args={[segment.length, 0.03, thickness]} />
              <meshBasicMaterial color={color} transparent opacity={isSelected ? 0.4 : 0.28} depthWrite={false} depthTest={false} />
            </mesh>
          );
        })}
        <Text position={[x, 0.72, z]} fontSize={0.12} maxWidth={3.4} anchorX="center" anchorY="middle" color={color}>
          {`${zone.id}\npath:${zone.points.length} t:${Math.round(zone.thickness ?? 46)}`}
        </Text>
      </group>
    );
  }

  const width = zone.width * WORLD_SCALE;
  const depth = zone.height * WORLD_SCALE;

  return (
    <group>
      <mesh position={[x, 0.085, z]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[width, depth]} />
        <meshBasicMaterial color={color} transparent opacity={isSelected ? 0.42 : 0.28} depthWrite={false} depthTest={false} />
      </mesh>
      <mesh position={[x, 0.28, z]}>
        <boxGeometry args={[width, 0.38, depth]} />
        <meshBasicMaterial color={color} wireframe transparent opacity={0.95} depthTest={false} />
      </mesh>
      <Text position={[x, 0.68, z]} fontSize={0.12} maxWidth={2.8} anchorX="center" anchorY="middle" color={color}>
        {zone.id}
      </Text>
    </group>
  );
}

function DebugSittingZone({
  room,
  zone
}: {
  room: CampusRoom;
  zone: CampusZone;
}): ReactElement {
  const debugSelection = useCampusStore((state) => state.debugSelection);
  const isSelected = debugSelection?.roomId === room.id
    && debugSelection.targetType === "zone"
    && debugSelection.zoneKind === "sitting"
    && debugSelection.id === zone.id;
  const color = isSelected ? "#fffaf0" : DEBUG_COLORS.sitting;
  const [x, , z] = worldToScene(room, blockedZoneCenter(zone), 0.13);

  if (isRingZone(zone)) {
    const { innerRadius, outerRadius } = getRingZoneRadii(zone);

    return (
      <group>
        <mesh position={[x, 0.13, z]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[innerRadius, outerRadius, 128]} />
          <meshBasicMaterial color={color} transparent opacity={isSelected ? 0.46 : 0.32} depthWrite={false} depthTest={false} />
        </mesh>
        <mesh position={[x, 0.145, z]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[innerRadius, outerRadius, 128]} />
          <meshBasicMaterial color={color} wireframe transparent opacity={0.9} depthTest={false} />
        </mesh>
        <Text position={[x, 0.86, z]} fontSize={0.12} maxWidth={3.2} anchorX="center" anchorY="middle" color={color}>
          {`${zone.id}\nSitting area`}
        </Text>
      </group>
    );
  }

  if (isPathZone(zone)) {
    const thickness = (zone.thickness ?? 46) * WORLD_SCALE;

    return (
      <group>
        {getPathZoneSegments(zone).map(([start, end], index) => {
          const segment = getPathSegmentPose(room, start, end, 0.13);

          return (
            <mesh key={`${zone.id}-${index}`} position={segment.position} rotation={[0, segment.rotationY, 0]}>
              <boxGeometry args={[segment.length, 0.045, thickness]} />
              <meshBasicMaterial color={color} transparent opacity={isSelected ? 0.42 : 0.3} depthWrite={false} depthTest={false} />
            </mesh>
          );
        })}
        <Text position={[x, 0.86, z]} fontSize={0.12} maxWidth={3.4} anchorX="center" anchorY="middle" color={color}>
          {`${zone.id}\nSitting area`}
        </Text>
      </group>
    );
  }

  const width = zone.width * WORLD_SCALE;
  const depth = zone.height * WORLD_SCALE;

  return (
    <group>
      <mesh position={[x, 0.115, z]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[width, depth]} />
        <meshBasicMaterial color={color} transparent opacity={isSelected ? 0.42 : 0.28} depthWrite={false} depthTest={false} />
      </mesh>
      <mesh position={[x, 0.3, z]}>
        <boxGeometry args={[width, 0.36, depth]} />
        <meshBasicMaterial color={color} wireframe transparent opacity={0.88} depthTest={false} />
      </mesh>
      <Text position={[x, 0.76, z]} fontSize={0.12} maxWidth={2.9} anchorX="center" anchorY="middle" color={color}>
        {`${zone.id}\nSitting area`}
      </Text>
    </group>
  );
}

function DebugItemBox({
  room,
  item,
  color
}: {
  room: CampusRoom;
  item: CampusItem;
  color: string;
}): ReactElement {
  const [x, , z] = worldToScene(room, getCampusDebugItemCenter(item), 0.095);
  const width = item.width * WORLD_SCALE;
  const depth = item.height * WORLD_SCALE;

  return (
    <group>
      <mesh position={[x, 0.095, z]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[width, depth]} />
        <meshBasicMaterial color={color} transparent opacity={0.18} depthWrite={false} depthTest={false} />
      </mesh>
      <mesh position={[x, 0.24, z]}>
        <boxGeometry args={[width, 0.22, depth]} />
        <meshBasicMaterial color={color} wireframe transparent opacity={0.9} depthTest={false} />
      </mesh>
    </group>
  );
}

function DebugInteractionZone({ room, item }: { room: CampusRoom; item: CampusItem }): ReactElement {
  const anchor = getCampusDebugInteractionAnchor(item);
  const [x, , z] = worldToScene(room, anchor, 0.12);
  const radius = (item.proximity || 150) * WORLD_SCALE;

  return (
    <mesh position={[x, 0.12, z]} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[Math.max(0.03, radius - 0.025), radius, 48]} />
      <meshBasicMaterial color={DEBUG_COLORS.interaction} transparent opacity={0.72} depthWrite={false} depthTest={false} />
    </mesh>
  );
}

function DebugItemLabel({
  room,
  item,
  color
}: {
  room: CampusRoom;
  item: CampusItem;
  color: string;
}): ReactElement {
  const [x, , z] = worldToScene(room, getCampusDebugItemCenter(item), 0.72);
  const layerLabel = getCampusDebugItemLayerLabel(item);
  const label = layerLabel ? `${item.id}\n${layerLabel}` : item.id;

  return (
    <Text position={[x, 0.9, z]} fontSize={0.11} maxWidth={2.8} anchorX="center" anchorY="middle" color={color}>
      {label}
    </Text>
  );
}

function DebugAssetPlacementLabel({
  room,
  placement
}: {
  room: CampusRoom;
  placement: EnvironmentAssetPlacement;
}): ReactElement {
  const [x, , z] = worldToScene(room, placement.point, 0.86);
  const layerLabel = getCampusDebugPlacementLayerLabel(placement);
  const label = layerLabel ? `${placement.id}\n${layerLabel}` : placement.id;

  return (
    <Text position={[x, 1.08, z]} fontSize={0.12} maxWidth={3.2} anchorX="center" anchorY="middle" color={DEBUG_COLORS.asset}>
      {label}
    </Text>
  );
}

function DebugMousePoint({ room, point, z: debugZ }: { room: CampusRoom; point: CampusPoint | null; z: number }): ReactElement | null {
  if (!point) {
    return null;
  }

  const [x, , z] = worldToScene(room, point, 0.14);

  return (
    <group>
      <mesh position={[x, 0.14, z]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.12, 0.17, 32]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.9} depthWrite={false} depthTest={false} />
      </mesh>
      <Text position={[x, 0.72, z]} fontSize={0.11} maxWidth={2.6} anchorX="center" anchorY="middle" color="#ffffff">
        {`mouse\n${formatDebugPoint3D(point, debugZ)}`}
      </Text>
    </group>
  );
}

function DebugPlacementPoint({ room, point, z: debugZ }: { room: CampusRoom; point: CampusPoint | null; z: number }): ReactElement | null {
  if (!point) {
    return null;
  }

  const [x, , z] = worldToScene(room, point, 0.16);
  const markerY = Math.max(0.035, debugZ);
  const markerColor = "#ff19d8";
  const lineLength = 0.42;
  const lineThickness = 0.018;

  return (
    <group>
      <mesh position={[x + lineLength / 2, markerY, z]}>
        <boxGeometry args={[lineLength, lineThickness, lineThickness]} />
        <meshBasicMaterial color={markerColor} transparent opacity={0.98} depthWrite={false} depthTest={false} />
      </mesh>
      <mesh position={[x, markerY, z + lineLength / 2]}>
        <boxGeometry args={[lineThickness, lineThickness, lineLength]} />
        <meshBasicMaterial color={markerColor} transparent opacity={0.98} depthWrite={false} depthTest={false} />
      </mesh>
      <mesh position={[x, markerY + lineLength / 2, z]}>
        <boxGeometry args={[lineThickness, lineLength, lineThickness]} />
        <meshBasicMaterial color={markerColor} transparent opacity={0.98} depthWrite={false} depthTest={false} />
      </mesh>
      <mesh position={[x, markerY, z]}>
        <sphereGeometry args={[0.035, 12, 10]} />
        <meshBasicMaterial color={markerColor} transparent opacity={1} depthWrite={false} depthTest={false} />
      </mesh>
      <Text position={[x, Math.max(0.74, markerY + 0.54), z]} fontSize={0.105} maxWidth={3.0} anchorX="center" anchorY="middle" color={markerColor}>
        {`point\n${formatDebugPoint3D(point, debugZ)}`}
      </Text>
    </group>
  );
}

function getDebugItemColor(kind: "portal" | "object" | "seat"): string {
  if (kind === "portal") {
    return DEBUG_COLORS.portal;
  }

  if (kind === "seat") {
    return DEBUG_COLORS.seat;
  }

  return DEBUG_COLORS.object;
}

type DebugSelectionCandidate = {
  selection: CampusDebugSelection;
  distance: number;
  priority: number;
};

function getZoneDebugSelectionCandidate(
  roomId: string,
  zone: CampusZone,
  point: CampusPoint,
  zoneKind: CampusDebugZoneKind,
  priority: number
): DebugSelectionCandidate | null {
  const distance = getRectDistance(point, zone);

  if (distance > 36) {
    return null;
  }

  return {
    selection: {
      roomId,
      targetType: "zone",
      zoneKind,
      id: zone.id
    },
    distance,
    priority
  };
}

function getNearestDebugSelection(room: CampusRoom, point: CampusPoint): CampusDebugSelection | null {
  const candidates: DebugSelectionCandidate[] = [
    ...getCampusDebugSittingZones(room)
      .map((zone) => getZoneDebugSelectionCandidate(room.id, zone, point, "sitting", 0))
      .filter((candidate): candidate is DebugSelectionCandidate => Boolean(candidate)),
    ...getCampusDebugCollisionZones(room)
      .map((zone) => getZoneDebugSelectionCandidate(room.id, zone, point, "blocked", 1))
      .filter((candidate): candidate is DebugSelectionCandidate => Boolean(candidate)),
    ...getCampusDebugInteractables(room)
      .map(({ item }) => {
        const distance = getRectDistance(point, item);

        if (distance > 44) {
          return null;
        }

        return {
          selection: {
            roomId: room.id,
            targetType: "item",
            id: item.id
          },
          distance,
          priority: 2
        };
      })
      .filter((candidate): candidate is DebugSelectionCandidate => Boolean(candidate)),
    ...getCampusDebugAssetPlacements(room.id)
      .map((placement) => {
        const distance = Math.hypot(point.x - placement.point.x, point.y - placement.point.y);

        if (distance > 220) {
          return null;
        }

        return {
          selection: {
            roomId: room.id,
            targetType: "asset",
            id: placement.id
          },
          distance,
          priority: 3
        };
      })
      .filter((candidate): candidate is DebugSelectionCandidate => Boolean(candidate))
  ];

  return candidates
    .sort((left, right) => left.priority - right.priority || left.distance - right.distance)[0]?.selection || null;
}

function selectDebugTargetAtReference(room: CampusRoom): void {
  const state = useCampusStore.getState();
  const point = state.debugPlacementPoint || state.debugMouseWorld || state.localPlayer;
  const selection = getNearestDebugSelection(room, point);
  state.selectDebugTarget(selection);

  if (selection) {
    window.console.log(`[campus-debug] selected ${selection.targetType}:${selection.id} (${selection.zoneKind || "item"})`);
    return;
  }

  window.console.log(`[campus-debug] no selectable target near x=${Math.round(point.x)} y=${Math.round(point.y)}`);
}

useGLTF.preload(PLAYER_ALPACA_MODEL_SRC);
useTexture.preload(CAMPUS_ORNATE_FRAME_TEXTURE_SRC);
Object.values(PLAYER_ALPACA_TEXTURES).forEach((src) => useTexture.preload(src));

function KeyboardDriver({ room }: { room: CampusRoom }): null {
  const keysRef = useRef<Record<string, boolean>>({});

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const key = event.key.toLowerCase();
      keysRef.current[key] = true;

      if (key === "q" && !event.repeat && !isEditableKeyboardTarget(event.target)) {
        event.preventDefault();
        useCampusStore.getState().toggleDebugMode();
      }

      if (
        (key === "r" || key === "f") &&
        useCampusStore.getState().debugMode &&
        !event.metaKey &&
        !event.ctrlKey &&
        !event.altKey &&
        !event.shiftKey &&
        !isEditableKeyboardTarget(event.target)
      ) {
        event.preventDefault();
        const delta = key === "r" ? CAMPUS_DEBUG_Z_STEP : -CAMPUS_DEBUG_Z_STEP;
        const state = useCampusStore.getState();
        state.nudgeDebugPlacementZ(delta);
        window.console.log(`[campus-debug] z=${formatDebugZ(useCampusStore.getState().debugPlacementZ)} (${key.toUpperCase()})`);
      }

      if (
        ["w", "a", "s", "d"].includes(key) &&
        useCampusStore.getState().debugMode &&
        !event.metaKey &&
        !event.ctrlKey &&
        !isEditableKeyboardTarget(event.target)
      ) {
        event.preventDefault();
        const step = event.altKey
          ? CAMPUS_DEBUG_POINT_FAST_STEP
            : event.shiftKey
              ? CAMPUS_DEBUG_POINT_FINE_STEP
              : CAMPUS_DEBUG_POINT_STEP;
        const xDelta = key === "a" ? -step : key === "d" ? step : 0;
        const yDelta = key === "w" ? -step : key === "s" ? step : 0;
        const state = useCampusStore.getState();
        state.nudgeDebugPlacementPoint({ x: xDelta, y: yDelta });
        const point = useCampusStore.getState().debugPlacementPoint;
        if (point) {
          window.console.log(`[campus-debug] point x=${point.x} y=${point.y} z=${formatDebugZ(useCampusStore.getState().debugPlacementZ)}`);
        }
      }

      if (
        key === "z" &&
        useCampusStore.getState().debugMode &&
        !event.metaKey &&
        !event.ctrlKey &&
        !event.altKey &&
        !event.shiftKey &&
        !isEditableKeyboardTarget(event.target)
      ) {
        event.preventDefault();
        selectDebugTargetAtReference(room);
      }

      if (key === "e" || event.key === "Enter") {
        const state = useCampusStore.getState();
        const item = getNearestActionItem(room, state.localPlayer);
        if (item) {
          state.openItemPanel(item);
        }
      }
    }

    function onKeyUp(event: KeyboardEvent) {
      keysRef.current[event.key.toLowerCase()] = false;
    }

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [room]);

  useFrame((_state, delta) => {
    const keys = keysRef.current;
    const xAxis = Number(Boolean(keys.arrowright)) - Number(Boolean(keys.arrowleft));
    const yAxis = Number(Boolean(keys.arrowdown)) - Number(Boolean(keys.arrowup));

    if (!xAxis && !yAxis) {
      useCampusStore.getState().stepLocalPlayer(delta);
      return;
    }

    const state = useCampusStore.getState();
    const speed = 680 / 3;
    const length = Math.hypot(xAxis, yAxis) || 1;
    state.setMovementTarget(null);
    state.setPlayerPosition({
      x: state.localPlayer.x + (xAxis / length) * speed * delta,
      y: state.localPlayer.y + (yAxis / length) * speed * delta
    });
  });

  return null;
}

function isEditableKeyboardTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  return Boolean(
    target.closest("input, textarea, select, [contenteditable='true']")
  );
}

function FollowCamera({ room }: { room: CampusRoom }): null {
  const localPlayer = useCampusStore((state) => state.localPlayer);
  const viewSettings = useCampusStore((state) => state.viewSettings);
  const targetRef = useRef(new Vector3());
  const desiredRef = useRef(new Vector3());
  const playerPositionRef = useRef(new Vector3());
  const lastPlayerPositionRef = useRef<Vector3 | null>(null);
  const headingRef = useRef(new Vector3(0, 0, -1));
  const movementDirectionRef = useRef(new Vector3());
  const smoothedLookAtRef = useRef(new Vector3());
  const snapCameraRef = useRef(true);
  const { camera } = useThree();
  const cameraBlockers = useMemo(() => getCameraBlockingRects(room), [room]);

  useEffect(() => {
    if ("fov" in camera && "near" in camera && "far" in camera) {
      camera.fov = CAMERA_FOV;
      camera.near = CAMERA_NEAR;
      camera.far = CAMERA_FAR;
      camera.updateProjectionMatrix();
    }
  }, [camera]);

  useEffect(() => {
    headingRef.current.set(0, 0, -1);
    lastPlayerPositionRef.current = null;
    snapCameraRef.current = true;
  }, [room.id]);

  useFrame((_state, delta) => {
    const playerBaseHeight = getPlayerAvatarBaseHeight(room, localPlayer);
    const [x, y, z] = worldToScene(room, localPlayer, playerBaseHeight);
    const lastPlayerPosition = lastPlayerPositionRef.current;

    playerPositionRef.current.set(x, y, z);
    if (lastPlayerPosition) {
      const moveX = playerPositionRef.current.x - lastPlayerPosition.x;
      const moveZ = playerPositionRef.current.z - lastPlayerPosition.z;
      const movementLength = Math.hypot(moveX, moveZ);

      if (movementLength > 0.00025) {
        movementDirectionRef.current.set(moveX / movementLength, 0, moveZ / movementLength);
        headingRef.current
          .lerp(movementDirectionRef.current, 1 - Math.exp(-CAMERA_HEADING_DAMPING * delta))
          .normalize();
      }

      lastPlayerPosition.copy(playerPositionRef.current);
    } else {
      lastPlayerPositionRef.current = playerPositionRef.current.clone();
    }

    const yawCos = Math.cos(viewSettings.yaw);
    const yawSin = Math.sin(viewSettings.yaw);
    const heading = headingRef.current;
    const lookForwardX = heading.x * yawCos - heading.z * yawSin;
    const lookForwardZ = heading.x * yawSin + heading.z * yawCos;
    const cameraDistance = CAMERA_BASE_BACK_DISTANCE * viewSettings.distance;
    const cameraHeight = y + CAMERA_BASE_HEIGHT + Math.max(0, viewSettings.distance - 1) * 0.22;
    const targetHeight = y + CAMERA_LOOK_TARGET_HEIGHT + viewSettings.height;

    desiredRef.current.set(
      x - lookForwardX * cameraDistance,
      Math.max(y + PLAYER_HEIGHT * 1.18, cameraHeight),
      z - lookForwardZ * cameraDistance
    );

    targetRef.current.set(
      x + lookForwardX * CAMERA_LOOK_AHEAD_DISTANCE,
      targetHeight,
      z + lookForwardZ * CAMERA_LOOK_AHEAD_DISTANCE
    );

    const safeCameraWorld = resolveCameraWorldPoint(
      room,
      localPlayer,
      sceneToWorld(room, desiredRef.current),
      cameraBlockers
    );
    const [safeCameraX, , safeCameraZ] = worldToScene(room, safeCameraWorld, desiredRef.current.y);
    desiredRef.current.set(safeCameraX, desiredRef.current.y, safeCameraZ);

    const safeTargetWorld = resolveCameraWorldPoint(
      room,
      localPlayer,
      sceneToWorld(room, targetRef.current),
      cameraBlockers,
      8,
      8
    );
    const [safeTargetX, , safeTargetZ] = worldToScene(room, safeTargetWorld, targetRef.current.y);
    targetRef.current.set(safeTargetX, targetRef.current.y, safeTargetZ);

    const shouldSnap = snapCameraRef.current;
    const positionAlpha = shouldSnap ? 1 : 1 - Math.exp(-CAMERA_POSITION_DAMPING * delta);
    const lookAlpha = shouldSnap ? 1 : 1 - Math.exp(-CAMERA_LOOK_DAMPING * delta);

    camera.position.lerp(desiredRef.current, positionAlpha);
    smoothedLookAtRef.current.lerp(targetRef.current, lookAlpha);
    camera.lookAt(smoothedLookAtRef.current);
    snapCameraRef.current = false;
  });

  return null;
}

function LocalAvatar({ room }: { room: CampusRoom }): ReactElement {
  const player = useCampusStore((state) => state.localPlayer);
  return <AlpacaAvatarMesh room={room} player={player} />;
}

function RemoteAvatars({ room }: { room: CampusRoom }): ReactElement {
  const players = useCampusStore((state) => state.remotePlayers);

  return (
    <>
      {players.map((player) => (
        <AlpacaAvatarMesh key={player.clientId} room={room} player={player} />
      ))}
    </>
  );
}

export function getPlayerAvatarBaseHeight(room: CampusRoom, point: CampusPoint): number {
  if (room.id === "debate-room-1") {
    return getDebateRoomSurfaceHeight(room, point);
  }

  return room.id === "guiding-library-lounge" || room.id === "school-lobby"
    ? LIBRARY_PLAYER_AVATAR_BASE_HEIGHT
    : PLAYER_AVATAR_BASE_HEIGHT;
}

function getZoneSurfaceZ(zone: CampusZone): number | null {
  return typeof zone.surfaceZ === "number" ? zone.surfaceZ : null;
}

function getSittingSurfaceHeight(room: CampusRoom, point: CampusPoint): number | null {
  const sittingZone = (room.sittingZones || []).find((zone) => isPointInRect(point, zone));
  return sittingZone ? getZoneSurfaceZ(sittingZone) : null;
}

function getDebateRoomStepSurfaceHeight(point: CampusPoint): number | null {
  const step = DEBATE_ROOM_STEP_BOUNDS.find((bounds) => isPointInRect(point, bounds));

  if (!step) {
    return null;
  }

  const rawProgress = (step.y + step.height - point.y) / step.height;
  const progress = Math.min(1, Math.max(0, rawProgress));
  const level = Math.min(DEBATE_ROOM_STEP_LEVELS, Math.max(1, Math.ceil(progress * DEBATE_ROOM_STEP_LEVELS)));
  const levelProgress = level / DEBATE_ROOM_STEP_LEVELS;

  return DEBATE_ROOM_BASE_SURFACE_HEIGHT
    + (DEBATE_ROOM_STEP_SURFACE_TOP_HEIGHT - DEBATE_ROOM_BASE_SURFACE_HEIGHT) * levelProgress;
}

function getDebateRoomSurfaceHeight(room: CampusRoom, point: CampusPoint): number {
  const sittingSurfaceHeight = getSittingSurfaceHeight(room, point);

  if (sittingSurfaceHeight !== null) {
    return sittingSurfaceHeight;
  }

  if (isPointInRect(point, DEBATE_ROOM_CUBE_BOUNDS)) {
    return DEBATE_ROOM_CUBE_SURFACE_HEIGHT;
  }

  return getDebateRoomStepSurfaceHeight(point) ?? DEBATE_ROOM_BASE_SURFACE_HEIGHT;
}

function AlpacaAvatarMesh({
  room,
  player
}: {
  room: CampusRoom;
  player: CampusPlayer;
}): ReactElement {
  const avatarRef = useRef<Group>(null);
  const visualRef = useRef<Group>(null);
  const lastScenePositionRef = useRef<Vector3 | null>(null);
  const walkTimeRef = useRef(0);
  const walkStrengthRef = useRef(0);
  const sitStrengthRef = useRef(0);
  const { scene } = useGLTF(PLAYER_ALPACA_MODEL_SRC);
  const avatarTexture = useTexture(getPlayerAlpacaTextureSrc(player.avatar.textureId || player.avatar.id));
  const walkUniforms = useMemo<AvatarWalkUniforms[]>(() => [], [avatarTexture, scene]);
  const avatarScene = useMemo(() => cloneAvatarScene(scene, avatarTexture, walkUniforms), [avatarTexture, scene, walkUniforms]);
  const [x, y, z] = worldToScene(room, player, getPlayerAvatarBaseHeight(room, player));
  const isSitting = Boolean(player.seatId);

  useEffect(() => {
    lastScenePositionRef.current = null;
  }, [room.id, player.clientId]);

  useFrame((_state, delta) => {
    if (!avatarRef.current) {
      return;
    }

    const lastScenePosition = lastScenePositionRef.current;
    let targetWalkStrength = 0;
    let worldMovementLength = 0;
    if (!isSitting && lastScenePosition) {
      const moveX = avatarRef.current.position.x - lastScenePosition.x;
      const moveZ = avatarRef.current.position.z - lastScenePosition.z;
      const movementLength = Math.hypot(moveX, moveZ);

      if (movementLength > 0.00025) {
        targetWalkStrength = 1;
        worldMovementLength = movementLength / WORLD_SCALE;
        const targetYaw = Math.atan2(-moveZ, moveX);
        avatarRef.current.rotation.y = lerpAngle(
          avatarRef.current.rotation.y,
          targetYaw,
          1 - Math.exp(-10 * delta)
        );
      }
    }

    walkStrengthRef.current += (targetWalkStrength - walkStrengthRef.current) * (1 - Math.exp(-26 * delta));
    sitStrengthRef.current += ((isSitting ? 1 : 0) - sitStrengthRef.current) * (1 - Math.exp(-7 * delta));
    if (worldMovementLength > 0) {
      walkTimeRef.current += worldMovementLength * AVATAR_WALK_PHASE_PER_WORLD_UNIT;
    }

    walkUniforms.forEach((uniforms) => {
      uniforms.uWalkTime.value = walkTimeRef.current;
      uniforms.uWalkStrength.value = walkStrengthRef.current;
      uniforms.uSitStrength.value = sitStrengthRef.current;
    });

    if (visualRef.current) {
      const walkStrength = walkStrengthRef.current;
      const sitStrength = sitStrengthRef.current;
      const bodyStep = Math.sin(walkTimeRef.current * 2 - 0.35);
      const bodyBob = (Math.max(0, bodyStep) * 0.01 - Math.max(0, -bodyStep) * 0.014) * walkStrength * (1 - sitStrength);
      const shoulderSway = Math.sin(walkTimeRef.current + 0.25) * walkStrength;
      const headFollow = Math.sin(walkTimeRef.current * 2 - 0.82) * walkStrength * (1 - sitStrength);
      const sitEase = sitStrength * sitStrength * (3 - 2 * sitStrength);
      const sitSettle = Math.sin(sitStrength * Math.PI);

      visualRef.current.position.set(0, 0.34 + bodyBob - sitEase * 0.070 - sitSettle * 0.018, 0);
      visualRef.current.rotation.set(
        headFollow * 0.014 + sitEase * 0.050 + sitSettle * 0.020,
        Math.PI + shoulderSway * 0.01,
        shoulderSway * 0.032
      );
    }

    lastScenePositionRef.current = avatarRef.current.position.clone();
  });

  return (
    <group ref={avatarRef} position={[x, y, z]}>
      <group ref={visualRef} position={[0, 0.34, 0]} rotation={[0, Math.PI, 0]} scale={1.45}>
        <primitive object={avatarScene} dispose={null} />
      </group>
    </group>
  );
}

function RoomMarkers({ room }: { room: CampusRoom }): ReactElement {
  const debugZoneDrafts = useCampusStore((state) => state.debugZoneDrafts);
  const sittingZones = (room.sittingZones || []).map((zone) =>
    debugZoneDrafts[getCampusDebugZoneDraftKey(room.id, "sitting", zone.id)] || zone
  );

  return (
    <>
      {(room.portals || []).map((item) => (
        <PortalMarker key={item.id} room={room} item={item} />
      ))}
      {(room.objects || []).filter((item) => !isWallFrameItem(room.id, item.id)).map((item) => (
        <ObjectMarker key={item.id} room={room} item={item} />
      ))}
      {(room.seats || []).map((item) => (
        <SeatMarker key={item.id} room={room} item={item} />
      ))}
      {sittingZones.map((zone) => (
        <SittingZoneMarker key={zone.id} room={room} zone={zone} />
      ))}
    </>
  );
}

function PortalMarker({ room, item }: { room: CampusRoom; item: CampusItem }): ReactElement | null {
  const openItemPanel = useCampusStore((state) => state.openItemPanel);
  const material = getRoomMaterial(room);
  const portalPose = getPortalPose(room, item);
  const isLobbyPortal = room.id === "school-lobby";
  const isCourtyardSchoolEntrance = room.id === "campus-courtyard" && item.id === "school-entrance";

  if (isModelBackedPortal(room.id, item.id)) {
    return null;
  }

  if (isCourtyardSchoolEntrance) {
    return (
      <group
        position={portalPose.position}
        rotation={[0, portalPose.rotationY, 0]}
        onPointerDown={(event) => {
          event.stopPropagation();
          openItemPanel(item);
        }}
      >
        <mesh position={[0, 0.3, 0]}>
          <boxGeometry args={[item.width * WORLD_SCALE, 0.6, item.height * WORLD_SCALE]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>
      </group>
    );
  }

  return (
    <group
      position={portalPose.position}
      rotation={[0, portalPose.rotationY, 0]}
      onPointerDown={(event) => {
        event.stopPropagation();
        openItemPanel(item);
      }}
    >
      <mesh position={[0, 0.72, 0]} castShadow receiveShadow>
        <boxGeometry args={[item.width * WORLD_SCALE, 1.45, 0.16]} />
        <meshStandardMaterial color={isLobbyPortal ? "#2f2118" : material.accent} roughness={0.72} />
      </mesh>
      <mesh position={[0, 0.72, isLobbyPortal ? 0.12 : -0.09]} castShadow>
        <boxGeometry args={[Math.max(0.75, item.width * WORLD_SCALE * 0.72), 1.08, isLobbyPortal ? 0.055 : 0.12]} />
        {isLobbyPortal ? (
          <Suspense fallback={<meshStandardMaterial color="#a86129" roughness={0.8} />}>
            <LobbyDoorMaterial />
          </Suspense>
        ) : (
          <meshStandardMaterial color="#f8f0df" roughness={0.8} />
        )}
      </mesh>
      <mesh position={[0, 0.055, 0.12]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.58, 0.72, 36]} />
        <meshBasicMaterial color={isLobbyPortal ? "#d6a15c" : material.accent} transparent opacity={0.72} />
      </mesh>
      <Text
        position={[0, 1.58, isLobbyPortal ? 0.18 : 0.08]}
        fontSize={0.18}
        maxWidth={2.4}
        anchorX="center"
        anchorY="middle"
        color="#1f2d36"
      >
        {item.label}
      </Text>
    </group>
  );
}

function ObjectMarker({ room, item }: { room: CampusRoom; item: CampusItem }): ReactElement {
  const openItemPanel = useCampusStore((state) => state.openItemPanel);
  const [x, , z] = worldToScene(room, getObjectMarkerPoint(room, item), 0.42);
  const isNpc = item.kind === "npc";
  const isInformationNpc = item.id === "information-alpaca" || item.id === "library-information-alpaca";
  const isEnvironmentObject = isCampusMapDecoratedObject(room.id, item.id);
  const shouldShowLabel = !isEnvironmentObject || shouldShowCampusMapObjectLabel(room.id, item.id);

  return (
    <group
      position={[x, 0, z]}
      onPointerDown={(event) => {
        event.stopPropagation();
        openItemPanel(item);
      }}
    >
      {isNpc ? (
        <MiniNpc isInformation={isInformationNpc} />
      ) : isEnvironmentObject ? (
        <EnvironmentHotspot color={getRoomMaterial(room).accent} />
      ) : (
        <>
          <mesh position={[0, 0.45, 0]} castShadow receiveShadow>
            <boxGeometry args={[Math.max(0.55, item.width * WORLD_SCALE), 0.78, Math.max(0.14, item.height * WORLD_SCALE)]} />
            <meshStandardMaterial color="#f4efe0" roughness={0.78} />
          </mesh>
          <mesh position={[0, 0.86, 0.01]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[Math.max(0.5, item.width * WORLD_SCALE * 0.82), Math.max(0.18, item.height * WORLD_SCALE * 0.62)]} />
            <meshStandardMaterial color="#fffaf0" roughness={0.68} />
          </mesh>
        </>
      )}
      {shouldShowLabel ? (
        <Text
          position={[0, isEnvironmentObject ? 0.78 : 1.12, 0.02]}
          fontSize={isEnvironmentObject ? 0.12 : 0.16}
          maxWidth={2.5}
          anchorX="center"
          anchorY="middle"
          color="#17202a"
        >
          {item.label}
        </Text>
      ) : null}
    </group>
  );
}

function EnvironmentHotspot({ color }: { color: string }): ReactElement {
  return (
    <group>
      <mesh position={[0, 0.04, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.28, 0.38, 32]} />
        <meshBasicMaterial color={color} transparent opacity={0.38} />
      </mesh>
      <mesh position={[0, 0.36, 0]} castShadow>
        <boxGeometry args={[0.16, 0.24, 0.1]} />
        <meshStandardMaterial color={color} roughness={0.72} />
      </mesh>
    </group>
  );
}

function MiniNpc({ isInformation = false }: { isInformation?: boolean }): ReactElement {
  const woolColor = isInformation ? "#c6533f" : "#efe0b7";
  const outfitColor = isInformation ? "#f2cc8f" : "#8b4050";

  return (
    <group>
      <mesh position={[0, 0.38, 0]} castShadow>
        <sphereGeometry args={[0.28, 18, 16]} />
        <meshStandardMaterial color={woolColor} roughness={0.84} />
      </mesh>
      <mesh position={[0.12, 0.72, -0.04]} castShadow>
        <sphereGeometry args={[0.18, 16, 14]} />
        <meshStandardMaterial color={woolColor} roughness={0.84} />
      </mesh>
      <mesh position={[0.02, 0.52, 0]} castShadow>
        <boxGeometry args={[0.38, 0.16, 0.42]} />
        <meshStandardMaterial color={outfitColor} roughness={0.78} />
      </mesh>
    </group>
  );
}

function SeatMarker({ room, item }: { room: CampusRoom; item: CampusItem }): ReactElement {
  const openItemPanel = useCampusStore((state) => state.openItemPanel);
  const occupiedSeats = useCampusStore((state) => state.occupiedSeats);
  const claimedSeatId = useCampusStore((state) => state.claimedSeatId);
  const point = item.sitPoint || { x: item.x, y: item.y };
  const [x, , z] = worldToScene(room, point, 0.18);
  const isMine = claimedSeatId === item.id;
  const isOccupied = Boolean(occupiedSeats[item.id]);
  const useSeatHotspot = isCampusMapDecoratedRoom(room.id);

  return (
    <group
      position={[x, 0, z]}
      onPointerDown={(event) => {
        event.stopPropagation();
        openItemPanel(item);
      }}
    >
      {useSeatHotspot ? (
        <>
          <mesh position={[0, 0.035, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.13, 0.17, 24]} />
            <meshBasicMaterial color={isMine ? "#e3b448" : isOccupied ? "#8b4050" : "#526f8a"} transparent opacity={0.38} />
          </mesh>
          <mesh position={[0, 0.08, 0]} castShadow>
            <sphereGeometry args={[0.035, 10, 8]} />
            <meshStandardMaterial color={isMine ? "#f2cc8f" : "#d8d2c4"} roughness={0.82} />
          </mesh>
        </>
      ) : (
        <>
          <mesh position={[0, 0.23, 0]} castShadow receiveShadow>
            <boxGeometry args={[0.42, 0.18, 0.42]} />
            <meshStandardMaterial color={isMine ? "#e3b448" : isOccupied ? "#8b4050" : "#526f8a"} roughness={0.8} />
          </mesh>
          <mesh position={[0, 0.48, -0.18]} castShadow receiveShadow>
            <boxGeometry args={[0.44, 0.42, 0.1]} />
            <meshStandardMaterial color={isMine ? "#f2cc8f" : "#d8d2c4"} roughness={0.82} />
          </mesh>
        </>
      )}
    </group>
  );
}

function SittingZoneMarker({ room, zone }: { room: CampusRoom; zone: CampusZone }): ReactElement {
  const item = useMemo(() => createSittingZoneSeat(zone), [zone]);
  const openItemPanel = useCampusStore((state) => state.openItemPanel);
  const debugMode = useCampusStore((state) => state.debugMode);
  const occupiedSeats = useCampusStore((state) => state.occupiedSeats);
  const claimedSeatId = useCampusStore((state) => state.claimedSeatId);
  const center = item.sitPoint || blockedZoneCenter(zone);
  const surfaceZ = getZoneSurfaceZ(zone) ?? 0;
  const [x, , z] = worldToScene(room, center, surfaceZ);
  const width = zone.width * WORLD_SCALE;
  const depth = zone.height * WORLD_SCALE;
  const isMine = claimedSeatId === item.id;
  const isOccupied = Boolean(occupiedSeats[item.id]);
  const color = isMine ? "#e3b448" : isOccupied ? "#8b4050" : "#526f8a";

  return (
    <group
      position={[x, surfaceZ, z]}
      onPointerDown={!debugMode ? (event) => {
        event.stopPropagation();
        openItemPanel(item);
      } : undefined}
    >
      <mesh position={[0, 0.045, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[width, depth]} />
        <meshBasicMaterial color={color} transparent opacity={isMine ? 0.22 : 0.1} depthWrite={false} />
      </mesh>
      <mesh position={[0, 0.075, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.13, 0.18, 28]} />
        <meshBasicMaterial color={color} transparent opacity={isMine ? 0.68 : 0.34} depthWrite={false} />
      </mesh>
    </group>
  );
}

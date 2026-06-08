import { toCampusPublicUrl } from "./public-url";

export const CAMPUS_3D_ASSET_CONTRACT_VERSION = "campus3d.assets.v1" as const;
export const CAMPUS_3D_WORLD_SCALE = 0.012 as const;

export type Campus3DRoomAssetId =
  | "school-lobby"
  | "guiding-library-lounge"
  | "flashcard-museum"
  | "debate-room-1"
  | "games-hall";

export type Campus3DAssetBudget = {
  maxTriangles: number;
  maxDrawCalls: number;
  maxOptimizedGlbMb: number;
};

export type Campus3DDynamicSurface = {
  objectId: string;
  nodeName: string;
  contentKind: "npc_info" | "guide" | "slideshow" | "video" | "alpacard" | "debate_board" | "game";
};

export type Campus3DRoomAssetSpec = {
  roomId: Campus3DRoomAssetId;
  title: string;
  src: string;
  sourceBlend: string;
  worldSize: {
    width: number;
    height: number;
  };
  budgets: Campus3DAssetBudget;
  requiredNodes: readonly string[];
  colliders: readonly string[];
  anchors: readonly string[];
  dynamicSurfaces: readonly Campus3DDynamicSurface[];
  notes: readonly string[];
};

export const CAMPUS_3D_ASSET_BUDGET_TOTAL_MB = 68 as const;

export const campus3dAssetManifest = [
  {
    roomId: "school-lobby",
    title: "School Lobby",
    src: toCampusPublicUrl("assets/campus-3d/rooms/school-lobby/school-lobby.glb"),
    sourceBlend: "assets-source/campus-3d/rooms/school-lobby/school-lobby.blend",
    worldSize: { width: 3135, height: 2063 },
    budgets: { maxTriangles: 180000, maxDrawCalls: 35, maxOptimizedGlbMb: 12 },
    requiredNodes: [
      "school-lobby__room__shell",
      "school-lobby__portal__lobby-library",
      "school-lobby__portal__lobby-museum",
      "school-lobby__portal__lobby-games",
      "school-lobby__portal__lobby-debate",
      "school-lobby__surface__information-alpaca"
    ],
    colliders: [
      "COLLIDER__reception-desk",
      "COLLIDER__north-wall",
      "COLLIDER__lobby-left-sofa-block",
      "COLLIDER__lobby-right-sofa-block",
      "COLLIDER__lobby-left-display-block",
      "COLLIDER__lobby-right-display-block"
    ],
    anchors: [
      "ANCHOR__spawn-default",
      "ANCHOR__spawn-library",
      "ANCHOR__spawn-museum",
      "ANCHOR__spawn-debate",
      "ANCHOR__spawn-games"
    ],
    dynamicSurfaces: [
      {
        objectId: "information-alpaca",
        nodeName: "SURFACE__information-alpaca",
        contentKind: "npc_info"
      }
    ],
    notes: [
      "Lobby is the hub room; keep portal silhouettes readable from the default camera.",
      "Information Alpaca must remain a dynamic content surface, not baked text."
    ]
  },
  {
    roomId: "guiding-library-lounge",
    title: "Library",
    src: toCampusPublicUrl("assets/campus-3d/rooms/guiding-library-lounge/guiding-library-lounge.glb"),
    sourceBlend: "assets-source/campus-3d/rooms/guiding-library-lounge/guiding-library-lounge.blend",
    worldSize: { width: 3465, height: 2244 },
    budgets: { maxTriangles: 220000, maxDrawCalls: 45, maxOptimizedGlbMb: 16 },
    requiredNodes: [
      "guiding-library-lounge__room__shell",
      "guiding-library-lounge__portal__library-exit",
      "guiding-library-lounge__surface__library-center-table",
      "guiding-library-lounge__surface__library-resource-cart"
    ],
    colliders: [
      "COLLIDER__library-back-shelves",
      "COLLIDER__library-left-wall-shelves",
      "COLLIDER__library-right-wall-shelves",
      "COLLIDER__library-help-desk-block",
      "COLLIDER__library-left-study-row",
      "COLLIDER__library-center-study-row",
      "COLLIDER__library-right-study-row"
    ],
    anchors: ["ANCHOR__spawn-default", "ANCHOR__spawn-lobby"],
    dynamicSurfaces: [
      ...Array.from({ length: 15 }, (_item, index) => ({
        objectId: `guide-shelf-${index + 1}`,
        nodeName: `SURFACE__guide-shelf-${index + 1}`,
        contentKind: "guide" as const
      })),
      {
        objectId: "library-center-table",
        nodeName: "SURFACE__library-center-table",
        contentKind: "guide"
      },
      {
        objectId: "library-resource-cart",
        nodeName: "SURFACE__library-resource-cart",
        contentKind: "guide"
      }
    ],
    notes: [
      "Shelves may share mesh/material instances; individual surface nodes need stable names.",
      "Guide titles and summaries must be projected from runtime content, not baked into the GLB."
    ]
  },
  {
    roomId: "flashcard-museum",
    title: "Museum",
    src: toCampusPublicUrl("assets/campus-3d/rooms/flashcard-museum/flashcard-museum.glb"),
    sourceBlend: "assets-source/campus-3d/rooms/flashcard-museum/flashcard-museum.blend",
    worldSize: { width: 2970, height: 1848 },
    budgets: { maxTriangles: 180000, maxDrawCalls: 40, maxOptimizedGlbMb: 14 },
    requiredNodes: [
      "flashcard-museum__room__shell",
      "flashcard-museum__portal__museum-exit",
      "flashcard-museum__surface__museum-video-surface",
      "flashcard-museum__surface__museum-slideshow-surface"
    ],
    colliders: [
      "COLLIDER__north-gallery-wall",
      "COLLIDER__museum-left-display-row",
      "COLLIDER__museum-right-display-row",
      "COLLIDER__museum-front-rope-left",
      "COLLIDER__museum-front-rope-right"
    ],
    anchors: ["ANCHOR__spawn-default", "ANCHOR__spawn-lobby"],
    dynamicSurfaces: [
      ...Array.from({ length: 10 }, (_item, index) => ({
        objectId: `flashcard-exhibit-${index + 1}`,
        nodeName: `SURFACE__flashcard-exhibit-${index + 1}`,
        contentKind: "alpacard" as const
      })),
      {
        objectId: "museum-video-surface",
        nodeName: "SURFACE__museum-video-surface",
        contentKind: "video"
      },
      {
        objectId: "museum-slideshow-surface",
        nodeName: "SURFACE__museum-slideshow-surface",
        contentKind: "slideshow"
      }
    ],
    notes: [
      "Museum frames can be static, but card/video/slideshow media is dynamic.",
      "Reserve wall planes for future texture/video projection in Three.js."
    ]
  },
  {
    roomId: "debate-room-1",
    title: "Debate Room",
    src: toCampusPublicUrl("assets/campus-3d/rooms/debate-room-1/debate-room-1.glb"),
    sourceBlend: "assets-source/campus-3d/rooms/debate-room-1/debate-room-1.blend",
    worldSize: { width: 2475, height: 1617 },
    budgets: { maxTriangles: 140000, maxDrawCalls: 30, maxOptimizedGlbMb: 10 },
    requiredNodes: [
      "debate-room-1__room__shell",
      "debate-room-1__portal__debate-room-exit",
      "debate-room-1__surface__debate-room-1-whiteboard",
      "debate-room-1__surface__debate-room-1-lectern"
    ],
    colliders: [
      "COLLIDER__teacher-desk-block",
      "COLLIDER__lectern-block",
      "COLLIDER__front-cabinet-block",
      "COLLIDER__student-desk-a",
      "COLLIDER__student-desk-b",
      "COLLIDER__student-desk-c",
      "COLLIDER__student-desk-d",
      "COLLIDER__student-desk-e",
      "COLLIDER__student-desk-f",
      "COLLIDER__student-desk-g",
      "COLLIDER__student-desk-h",
      "COLLIDER__student-desk-i",
      "COLLIDER__student-desk-j"
    ],
    anchors: [
      "ANCHOR__spawn-default",
      "ANCHOR__spawn-lobby",
      "ANCHOR__debate-proposition",
      "ANCHOR__debate-opposition",
      "ANCHOR__debate-judges"
    ],
    dynamicSurfaces: [
      {
        objectId: "debate-room-1-whiteboard",
        nodeName: "SURFACE__debate-room-1-whiteboard",
        contentKind: "debate_board"
      },
      {
        objectId: "debate-room-1-lectern",
        nodeName: "SURFACE__debate-room-1-lectern",
        contentKind: "debate_board"
      }
    ],
    notes: [
      "Twenty seat anchors must stay aligned with the activity contract seat IDs.",
      "Table layout must make proposition, opposition, judge, and spectator zones legible."
    ]
  },
  {
    roomId: "games-hall",
    title: "Games Hall",
    src: toCampusPublicUrl("assets/campus-3d/rooms/games-hall/games-hall.glb"),
    sourceBlend: "assets-source/campus-3d/rooms/games-hall/games-hall.blend",
    worldSize: { width: 3300, height: 2145 },
    budgets: { maxTriangles: 220000, maxDrawCalls: 45, maxOptimizedGlbMb: 16 },
    requiredNodes: [
      "games-hall__room__shell",
      "games-hall__portal__games-exit",
      "games-hall__surface__games-scoreboard",
      "games-hall__surface__games-trophy-display"
    ],
    colliders: [
      "COLLIDER__games-scoreboard-wall",
      "COLLIDER__games-left-bleachers",
      "COLLIDER__games-right-bleachers",
      "COLLIDER__games-team-table-a",
      "COLLIDER__games-team-table-b",
      "COLLIDER__games-team-table-c",
      "COLLIDER__games-team-table-d"
    ],
    anchors: [
      "ANCHOR__spawn-default",
      "ANCHOR__spawn-lobby",
      "ANCHOR__arcade-alpacapardy",
      "ANCHOR__arcade-run",
      "ANCHOR__arcade-jump",
      "ANCHOR__arcade-relay",
      "ANCHOR__arcade-survival"
    ],
    dynamicSurfaces: [
      {
        objectId: "games-scoreboard",
        nodeName: "SURFACE__games-scoreboard",
        contentKind: "game"
      },
      {
        objectId: "games-trophy-display",
        nodeName: "SURFACE__games-trophy-display",
        contentKind: "game"
      }
    ],
    notes: [
      "Arcade cabinets are launch surfaces; scores and game screens must remain dynamic.",
      "Team tables and bleachers must leave enough floor space for readable player clusters."
    ]
  }
] as const satisfies readonly Campus3DRoomAssetSpec[];

export const campus3dAssetManifestByRoom = campus3dAssetManifest.reduce((byRoom, asset) => {
  byRoom[asset.roomId] = asset;
  return byRoom;
}, {} as Record<Campus3DRoomAssetId, Campus3DRoomAssetSpec>);

export function getCampus3DRoomAsset(roomId: Campus3DRoomAssetId): Campus3DRoomAssetSpec {
  return campus3dAssetManifestByRoom[roomId];
}

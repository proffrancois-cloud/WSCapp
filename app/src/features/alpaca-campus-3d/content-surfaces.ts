import {
  getContentApi,
  type CampusItem,
  type CampusPanel,
  type WorldContentCard
} from "./campus-data";

export const FIRST_FIVE_CONTENT_ROOM_IDS = [
  "school-lobby",
  "guiding-library-lounge",
  "flashcard-museum",
  "debate-room-1",
  "games-hall"
] as const;

export type FirstFiveContentRoomId = typeof FIRST_FIVE_CONTENT_ROOM_IDS[number];

export type CampusContentSurfaceKind =
  | "info"
  | "guide-shelf"
  | "museum-exhibit"
  | "museum-video"
  | "museum-slideshow"
  | "debate-board"
  | "arcade-entry";

export type CampusSurfacePanelId =
  | "info"
  | "library"
  | "guide-section"
  | "flashcards"
  | "alpaca-channel"
  | "mode-slideshow"
  | "debate"
  | "path-play";

export type CampusSurfacePanelContext = {
  contentId?: number;
  sectionIndex?: number;
  modeId?: string;
  pathId?: string;
};

export type CampusContentSurface = {
  id: string;
  roomId: FirstFiveContentRoomId;
  itemId: string;
  kind: CampusContentSurfaceKind;
  surfaceLabel: string;
  panelId: CampusSurfacePanelId;
  panelContext: CampusSurfacePanelContext;
  fallbackPanelLabel: string;
  resolvedPanelLabel: string;
  panelSummary: string;
  contentKind: string;
  contentLabel: string;
  contentSummary: string;
  source: "content-api" | "fallback";
};

export type CampusContentSurfaceRoom = {
  roomId: FirstFiveContentRoomId;
  surfaces: CampusContentSurface[];
  fallbackPanelLabels: Record<string, string>;
};

export type CampusContentSurfaceContract = {
  version: 1;
  roomOrder: FirstFiveContentRoomId[];
  surfaces: CampusContentSurface[];
  rooms: Record<FirstFiveContentRoomId, CampusContentSurfaceRoom>;
  fallbackPanelLabels: Record<CampusSurfacePanelId, string>;
};

export type CampusContentSurfaceOptions = {
  contentApi?: SharedCampusContentApi | null;
  guideShelfCount?: number;
};

export type SharedCampusContentApi = {
  getPanel?: (panelId: string, context?: Record<string, unknown>) => CampusPanel;
  getWorldContentForObject?: (item: CampusItem) => WorldContentCard | null;
  getRegularGuides?: () => unknown[];
};

type SurfaceBlueprint = {
  id: string;
  roomId: FirstFiveContentRoomId;
  itemId: string;
  kind: CampusContentSurfaceKind;
  surfaceLabel: string;
  panelId: CampusSurfacePanelId;
  panelContext?: CampusSurfacePanelContext;
  fallbackPanelLabel?: string;
};

const DEFAULT_GUIDE_SHELF_COUNT = 15;

export const FALLBACK_PANEL_LABELS: Record<CampusSurfacePanelId, string> = {
  info: "Campus Updates",
  library: "Library Wall",
  "guide-section": "Guide Shelf",
  flashcards: "Alpacard Exhibit",
  "alpaca-channel": "Alpaca Channel",
  "mode-slideshow": "Slideshow Lesson",
  debate: "Debate Board",
  "path-play": "Play Path"
};

function resolveContentApi(contentApi: CampusContentSurfaceOptions["contentApi"]): SharedCampusContentApi | null {
  if (contentApi !== undefined) {
    return contentApi;
  }

  return typeof window === "undefined" ? null : (getContentApi() as SharedCampusContentApi | null);
}

function getGuideShelfCount(api: SharedCampusContentApi | null, requestedCount?: number): number {
  if (Number.isFinite(requestedCount) && Number(requestedCount) > 0) {
    return Math.floor(Number(requestedCount));
  }

  const guideCount = safeReadList(() => api?.getRegularGuides?.()).length;
  return guideCount || DEFAULT_GUIDE_SHELF_COUNT;
}

function safeReadList(read: () => unknown[] | undefined): unknown[] {
  try {
    const value = read();
    return Array.isArray(value) ? value : [];
  } catch (_error) {
    return [];
  }
}

function safeReadPanel(
  api: SharedCampusContentApi | null,
  panelId: CampusSurfacePanelId,
  context: CampusSurfacePanelContext
): CampusPanel | null {
  try {
    return api?.getPanel?.(panelId, context as Record<string, unknown>) || null;
  } catch (_error) {
    return null;
  }
}

function safeReadWorldContent(
  api: SharedCampusContentApi | null,
  item: CampusItem
): WorldContentCard | null {
  try {
    return api?.getWorldContentForObject?.(item) || null;
  } catch (_error) {
    return null;
  }
}

function cleanPanelContext(context: CampusSurfacePanelContext = {}): CampusSurfacePanelContext {
  return Object.fromEntries(
    Object.entries(context).filter(([, value]) => value !== undefined && value !== null)
  ) as CampusSurfacePanelContext;
}

function toVirtualCampusItem(blueprint: SurfaceBlueprint, context: CampusSurfacePanelContext): CampusItem {
  return {
    id: blueprint.itemId,
    kind: blueprint.kind,
    label: blueprint.surfaceLabel,
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    panel: blueprint.panelId,
    contentId: context.contentId,
    sectionIndex: context.sectionIndex,
    modeId: context.modeId || null,
    pathId: context.pathId || null
  };
}

function createGuideShelfBlueprints(count: number): SurfaceBlueprint[] {
  return Array.from({ length: count }, (_item, index) => {
    const shelfNumber = index + 1;
    return {
      id: `library-guide-shelf-${shelfNumber}`,
      roomId: "guiding-library-lounge",
      itemId: `guide-shelf-${shelfNumber}`,
      kind: "guide-shelf",
      surfaceLabel: `Guide Shelf ${shelfNumber}`,
      panelId: "guide-section",
      panelContext: { sectionIndex: index },
      fallbackPanelLabel: `Guide Shelf ${shelfNumber}`
    };
  });
}

function createSurfaceBlueprints(api: SharedCampusContentApi | null, options: CampusContentSurfaceOptions): SurfaceBlueprint[] {
  return [
    {
      id: "lobby-info",
      roomId: "school-lobby",
      itemId: "information-alpaca",
      kind: "info",
      surfaceLabel: "Information Alpaca",
      panelId: "info",
      fallbackPanelLabel: "Campus Updates"
    },
    ...createGuideShelfBlueprints(getGuideShelfCount(api, options.guideShelfCount)),
    {
      id: "museum-featured-exhibit",
      roomId: "flashcard-museum",
      itemId: "flashcard-exhibit-1",
      kind: "museum-exhibit",
      surfaceLabel: "Featured Exhibit",
      panelId: "flashcards",
      panelContext: { contentId: 0 },
      fallbackPanelLabel: "Alpacard Exhibit"
    },
    {
      id: "museum-video-surface",
      roomId: "flashcard-museum",
      itemId: "museum-video-surface",
      kind: "museum-video",
      surfaceLabel: "Museum Video Surface",
      panelId: "alpaca-channel",
      panelContext: { contentId: 0 },
      fallbackPanelLabel: "Alpaca Channel"
    },
    {
      id: "museum-slideshow-surface",
      roomId: "flashcard-museum",
      itemId: "museum-slideshow-surface",
      kind: "museum-slideshow",
      surfaceLabel: "Museum Slideshow Surface",
      panelId: "mode-slideshow",
      panelContext: { modeId: "slideshow", pathId: "learn" },
      fallbackPanelLabel: "Slideshow Lesson"
    },
    {
      id: "debate-board",
      roomId: "debate-room-1",
      itemId: "debate-room-1-whiteboard",
      kind: "debate-board",
      surfaceLabel: "Debate Board",
      panelId: "debate",
      fallbackPanelLabel: "Debate Board"
    },
    {
      id: "games-arcade-entry",
      roomId: "games-hall",
      itemId: "games-scoreboard",
      kind: "arcade-entry",
      surfaceLabel: "Games Arcade Entry",
      panelId: "path-play",
      panelContext: { pathId: "play" },
      fallbackPanelLabel: "Play Path"
    }
  ];
}

function resolveSurface(api: SharedCampusContentApi | null, blueprint: SurfaceBlueprint): CampusContentSurface {
  const panelContext = cleanPanelContext(blueprint.panelContext);
  const fallbackPanelLabel = blueprint.fallbackPanelLabel || FALLBACK_PANEL_LABELS[blueprint.panelId];
  const item = toVirtualCampusItem(blueprint, panelContext);
  const panel = safeReadPanel(api, blueprint.panelId, panelContext);
  const worldContent = safeReadWorldContent(api, item);

  return {
    id: blueprint.id,
    roomId: blueprint.roomId,
    itemId: blueprint.itemId,
    kind: blueprint.kind,
    surfaceLabel: blueprint.surfaceLabel,
    panelId: blueprint.panelId,
    panelContext,
    fallbackPanelLabel,
    resolvedPanelLabel: panel?.title || fallbackPanelLabel,
    panelSummary: panel?.summary || "",
    contentKind: worldContent?.kind || "",
    contentLabel: worldContent?.title || "",
    contentSummary: worldContent?.summary || "",
    source: panel || worldContent ? "content-api" : "fallback"
  };
}

function createEmptyRooms(): Record<FirstFiveContentRoomId, CampusContentSurfaceRoom> {
  return FIRST_FIVE_CONTENT_ROOM_IDS.reduce((rooms, roomId) => {
    rooms[roomId] = {
      roomId,
      surfaces: [],
      fallbackPanelLabels: {}
    };
    return rooms;
  }, {} as Record<FirstFiveContentRoomId, CampusContentSurfaceRoom>);
}

export function getCampusContentSurfaceContract(
  options: CampusContentSurfaceOptions = {}
): CampusContentSurfaceContract {
  const api = resolveContentApi(options.contentApi);
  const surfaces = createSurfaceBlueprints(api, options).map((blueprint) => resolveSurface(api, blueprint));
  const rooms = createEmptyRooms();

  surfaces.forEach((surface) => {
    rooms[surface.roomId].surfaces.push(surface);
    rooms[surface.roomId].fallbackPanelLabels[surface.id] = surface.fallbackPanelLabel;
  });

  return {
    version: 1,
    roomOrder: [...FIRST_FIVE_CONTENT_ROOM_IDS],
    surfaces,
    rooms,
    fallbackPanelLabels: { ...FALLBACK_PANEL_LABELS }
  };
}

export function getContentSurfacesForRoom(
  roomId: FirstFiveContentRoomId,
  options: CampusContentSurfaceOptions = {}
): CampusContentSurface[] {
  return getCampusContentSurfaceContract(options).rooms[roomId].surfaces;
}

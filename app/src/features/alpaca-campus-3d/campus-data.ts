export type CampusPoint = {
  x: number;
  y: number;
};

export type CampusCollisionPadding = {
  left?: number;
  right?: number;
  backY?: number;
  frontY?: number;
};

export type CampusZone = CampusPoint & {
  id: string;
  width: number;
  height: number;
  shape?: "rect" | "ring" | "path";
  center?: CampusPoint;
  radius?: number;
  thickness?: number;
  points?: CampusPoint[];
  surfaceZ?: number;
  collisionPadding?: number | CampusCollisionPadding;
};

export type CampusItem = CampusZone & {
  kind: string;
  label: string;
  panel?: string | null;
  targetRoomId?: string;
  targetSpawnId?: string;
  interactionPoint?: CampusPoint;
  sitPoint?: CampusPoint;
  proximity?: number;
  group?: string;
  seatType?: string;
  sectionIndex?: number;
  contentId?: number | string;
  modeId?: string | null;
  pathId?: string | null;
  avatar?: unknown;
};

export type CampusRoom = {
  id: string;
  title: string;
  subtitle?: string;
  backgroundStyle?: string;
  world: {
    width: number;
    height: number;
  };
  spawnPoints?: Record<string, CampusPoint>;
  walkBounds?: CampusZone;
  walkZones?: CampusZone[];
  blockedZones?: CampusZone[];
  sittingZones?: CampusZone[];
  portals?: CampusItem[];
  objects?: CampusItem[];
  seats?: CampusItem[];
};

export type CampusPanel = {
  id?: string;
  eyebrow?: string;
  title?: string;
  summary?: string;
  notes?: string[];
  links?: Array<{
    title?: string;
    href?: string;
    summary?: string;
  }>;
  guides?: Array<{
    id?: string;
    title?: string;
    href?: string;
    summary?: string;
  }>;
  subjects?: Array<{
    id?: string;
    label?: string;
    description?: string;
    color?: string;
  }>;
  mediaCards?: Array<{
    title?: string;
    summary?: string;
    imageSrc?: string;
    href?: string;
    embedUrl?: string;
  }>;
  videos?: Array<{
    id?: string;
    title?: string;
    summary?: string;
    imageSrc?: string;
    embedUrl?: string;
    href?: string;
  }>;
  alpacards?: Array<{
    id?: string;
    title?: string;
    summary?: string;
    meta?: string;
    imageSrc?: string;
    href?: string;
  }>;
  insights?: Array<{
    title?: string;
    body?: string;
  }>;
  sections?: Array<{
    id?: string;
    title?: string;
    summary?: string;
  }>;
  atoms?: Array<{
    title?: string;
    summary?: string;
    subjects?: string[];
  }>;
  featuredImage?: string;
  featuredMeta?: string;
  featuredVideo?: WorldContentCard | null;
  sourceHref?: string;
  htmlContent?: string;
};

export type WorldContentCard = {
  kind?: string;
  title?: string;
  subtitle?: string;
  summary?: string;
  imageSrc?: string;
  embedUrl?: string;
  sourceHref?: string;
  data?: unknown;
};

type RoomsApi = {
  rooms: CampusRoom[];
  getRoom: (roomId: string) => CampusRoom;
  getSpawnPoint: (roomId: string, spawnId?: string) => CampusPoint;
};

type ContentApi = {
  getPanel: (panelId: string, context?: Record<string, unknown>) => CampusPanel;
  getWorldContentForObject: (item: CampusItem) => WorldContentCard | null;
};

declare global {
  interface Window {
    WSC_ALPACA_CAMPUS_ROOMS?: RoomsApi;
    WSC_ALPACA_CAMPUS_CONTENT?: ContentApi;
    WSC_ALPACA_CAMPUS_REALTIME?: {
      createCampusRoomChannel?: (options: Record<string, unknown>) => CampusRoomChannel | null;
    };
    WSC_SUPABASE_CONFIG?: {
      url?: string;
      publishableKey?: string;
    };
    WSC_STORAGE_SERVICE?: {
      getJson?: <T>(key: string, fallback: T) => T;
      setJson?: (key: string, value: unknown) => { ok: boolean; key?: string; error?: string };
    };
    supabase?: {
      createClient?: (url: string, key: string) => unknown;
    };
  }
}

export type CampusRoomChannel = {
  clientId: string;
  topic: string;
  subscribe: () => void;
  updatePresence: (extra?: Record<string, unknown>) => Promise<unknown> | null;
  sendMovement: (command: Record<string, unknown>) => Promise<unknown> | null;
  sendChat?: (message: Record<string, unknown>) => Promise<unknown> | null;
  sendObject?: (eventPayload: Record<string, unknown>) => Promise<unknown> | null;
  destroy: () => Promise<void>;
};

const fallbackRooms: CampusRoom[] = [
  {
    id: "school-lobby",
    title: "School Lobby",
    subtitle: "Main hub",
    backgroundStyle: "lobby",
    world: { width: 3135, height: 2063 },
    spawnPoints: {
      default: { x: 1568, y: 1716 },
      library: { x: 2087, y: 726 },
      debate: { x: 2657, y: 1287 }
    },
    walkBounds: { id: "floor", x: 198, y: 347, width: 2739, height: 1502 },
    blockedZones: [],
    portals: [
      {
        id: "lobby-library",
        kind: "portal",
        label: "Library",
        x: 1947,
        y: 281,
        width: 281,
        height: 182,
        targetRoomId: "guiding-library-lounge",
        targetSpawnId: "lobby"
      },
      {
        id: "lobby-debate",
        kind: "portal",
        label: "Debate Room",
        x: 2729,
        y: 1188,
        width: 248,
        height: 152,
        targetRoomId: "debate-room-1",
        targetSpawnId: "lobby"
      }
    ],
    objects: [
      {
        id: "information-alpaca",
        kind: "npc",
        label: "Information Alpaca",
        x: 1568,
        y: 393,
        width: 211,
        height: 182,
        panel: "info",
        proximity: 248
      }
    ],
    seats: []
  }
];

function createFallbackRoomsApi(): RoomsApi {
  const byId = Object.fromEntries(fallbackRooms.map((room) => [room.id, room]));

  return {
    rooms: fallbackRooms,
    getRoom(roomId) {
      return byId[roomId] || fallbackRooms[0];
    },
    getSpawnPoint(roomId, spawnId = "default") {
      const room = byId[roomId] || fallbackRooms[0];
      return room.spawnPoints?.[spawnId] || room.spawnPoints?.default || {
        x: room.world.width / 2,
        y: room.world.height / 2
      };
    }
  };
}

export function getRoomsApi(): RoomsApi {
  return window.WSC_ALPACA_CAMPUS_ROOMS || createFallbackRoomsApi();
}

export function getContentApi(): ContentApi | null {
  return window.WSC_ALPACA_CAMPUS_CONTENT || null;
}

export function getRoom(roomId: string): CampusRoom {
  return getRoomsApi().getRoom(roomId);
}

export function getSpawnPoint(roomId: string, spawnId = "default"): CampusPoint {
  return getRoomsApi().getSpawnPoint(roomId, spawnId);
}

function getZoneCenter(zone: CampusZone): CampusPoint {
  return zone.center || {
    x: zone.x + zone.width / 2,
    y: zone.y + zone.height / 2
  };
}

export function createSittingZoneSeat(zone: CampusZone): CampusItem {
  const center = getZoneCenter(zone);

  return {
    ...zone,
    kind: "seat",
    label: zone.id
      .replace(/-/g, " ")
      .replace(/\b\w/g, (letter) => letter.toUpperCase()),
    seatType: "sitting-zone",
    interactionPoint: center,
    sitPoint: center,
    proximity: Math.max(110, Math.max(zone.width, zone.height) / 2),
    group: zone.id,
    panel: null
  };
}

export function getRoomItems(room: CampusRoom): CampusItem[] {
  return [
    ...(room.portals || []),
    ...(room.objects || []),
    ...(room.seats || []),
    ...(room.sittingZones || []).map(createSittingZoneSeat)
  ];
}

export function getPanelForItem(item: CampusItem): CampusPanel {
  const api = getContentApi();
  if (!api || !item.panel) {
    if (item.kind === "seat") {
      return {
        eyebrow: "Seat",
        title: item.label || "Room Seat",
        summary: "Take this seat to join the visible group in this room. Taking another seat releases the previous one."
      };
    }

    if (item.kind === "board" || item.kind === "control") {
      return {
        eyebrow: "Activity",
        title: item.label,
        summary: "This station is ready for room-local activity state."
      };
    }

    return {
      eyebrow: item.kind,
      title: item.label,
      summary: "This surface is ready for campus content."
    };
  }

  try {
    return api.getPanel(item.panel, item as unknown as Record<string, unknown>);
  } catch (_error) {
    return {
      eyebrow: item.kind,
      title: item.label,
      summary: "This campus surface is available, but its live content could not be loaded."
    };
  }
}

export function getWorldContentForItem(item: CampusItem): WorldContentCard | null {
  return getContentApi()?.getWorldContentForObject(item) || null;
}

export function getDistance(left: CampusPoint, right: CampusPoint): number {
  return Math.hypot(left.x - right.x, left.y - right.y);
}

export const ROOM_MANIFEST_ROOM_IDS = [
  "school-lobby",
  "guiding-library-lounge",
  "flashcard-museum",
  "debate-room-1",
  "games-hall"
] as const;

export type RoomManifestRoomId = (typeof ROOM_MANIFEST_ROOM_IDS)[number];

export type RoomMaterialKey = "lobby" | "library" | "museum" | "classroom" | "game-hall";

export type RoomVector3 = readonly [number, number, number];

export type RoomCameraDefaults = {
  mode: "avatar-follow";
  initialPosition: RoomVector3;
  followOffset: RoomVector3;
  lookAtOffset: RoomVector3;
  fov: number;
  near: number;
  far: number;
  damping: number;
};

export type RoomEnvironmentStyle = {
  materialKey: RoomMaterialKey;
  lightingPreset: "open-daylight" | "warm-study" | "gallery-focus" | "classroom-practice" | "arcade-gym";
  backgroundColor: string;
  floorColor: string;
  carpetColor: string;
  wallColor: string;
  accentColor: string;
  assetKey: string;
  assetPath: string;
};

export type RoomPortalIntent = {
  id: string;
  label: string;
  targetRoomId: RoomManifestRoomId;
  targetSpawnId: string;
  intent: "hub-to-room" | "return-to-hub";
  expectedAction: "transition-room";
};

export type RoomInteractableRole = {
  role:
    | "navigation"
    | "host-npc"
    | "guide-content"
    | "flashcard-content"
    | "debate-practice"
    | "play-path"
    | "seat-claim";
  itemKinds: readonly string[];
  expectedIds?: readonly string[];
  expectedIdPattern?: string;
  expectedCount: number;
  interaction: "portal-transition" | "open-panel" | "claim-seat" | "launch-activity";
  owner: "rooms-foundation" | "content-integrator" | "mini-games" | "network-bandwidth";
};

export type RoomQaExpectations = {
  expectedPortalCount: number;
  expectedObjectCount: number;
  expectedSeatCount: number;
  requiredSpawnIds: readonly string[];
  smokeChecks: readonly string[];
  screenshotTargets: readonly string[];
};

export type RoomManifest<RoomId extends RoomManifestRoomId = RoomManifestRoomId> = {
  id: RoomId;
  title: string;
  contract: "five-room-slice";
  camera: RoomCameraDefaults;
  environment: RoomEnvironmentStyle;
  portalIntents: readonly RoomPortalIntent[];
  interactableRoles: readonly RoomInteractableRole[];
  qa: RoomQaExpectations;
};

const defaultCamera = {
  mode: "avatar-follow",
  near: 0.1,
  far: 100,
  damping: 0.075
} as const;

export const roomManifests = {
  "school-lobby": {
    id: "school-lobby",
    title: "School Lobby",
    contract: "five-room-slice",
    camera: {
      ...defaultCamera,
      initialPosition: [7, 7, 10],
      followOffset: [6.4, 6.2, 8.2],
      lookAtOffset: [0, 0.78, 0],
      fov: 45
    },
    environment: {
      materialKey: "lobby",
      lightingPreset: "open-daylight",
      backgroundColor: "#e8ece4",
      floorColor: "#d9d3c3",
      carpetColor: "#7b9e89",
      wallColor: "#e8d7bd",
      accentColor: "#e3b448",
      assetKey: "campus-bg-school-lobby",
      assetPath: "assets/campus/backgrounds/school-lobby.png"
    },
    portalIntents: [
      {
        id: "lobby-library",
        label: "Library",
        targetRoomId: "guiding-library-lounge",
        targetSpawnId: "lobby",
        intent: "hub-to-room",
        expectedAction: "transition-room"
      },
      {
        id: "lobby-museum",
        label: "Museum",
        targetRoomId: "flashcard-museum",
        targetSpawnId: "lobby",
        intent: "hub-to-room",
        expectedAction: "transition-room"
      },
      {
        id: "lobby-games",
        label: "Games Hall",
        targetRoomId: "games-hall",
        targetSpawnId: "lobby",
        intent: "hub-to-room",
        expectedAction: "transition-room"
      },
      {
        id: "lobby-debate",
        label: "Debate Room",
        targetRoomId: "debate-room-1",
        targetSpawnId: "lobby",
        intent: "hub-to-room",
        expectedAction: "transition-room"
      }
    ],
    interactableRoles: [
      {
        role: "navigation",
        itemKinds: ["portal"],
        expectedIds: ["lobby-library", "lobby-museum", "lobby-games", "lobby-debate"],
        expectedCount: 4,
        interaction: "portal-transition",
        owner: "rooms-foundation"
      },
      {
        role: "host-npc",
        itemKinds: ["npc"],
        expectedIds: ["information-alpaca"],
        expectedCount: 1,
        interaction: "open-panel",
        owner: "content-integrator"
      },
      {
        role: "seat-claim",
        itemKinds: ["seat"],
        expectedIdPattern: "lobby-lounge-*",
        expectedCount: 6,
        interaction: "claim-seat",
        owner: "network-bandwidth"
      }
    ],
    qa: {
      expectedPortalCount: 4,
      expectedObjectCount: 1,
      expectedSeatCount: 6,
      requiredSpawnIds: ["default", "lobby", "library", "museum", "debate", "games"],
      smokeChecks: [
        "Lobby loads as the default room.",
        "Each visible lobby portal resolves to one of the four other slice rooms.",
        "Information Alpaca opens an info panel without changing rooms.",
        "Lobby seats can be claimed and cleared on room change."
      ],
      screenshotTargets: ["desktop-lobby", "mobile-lobby"]
    }
  },
  "guiding-library-lounge": {
    id: "guiding-library-lounge",
    title: "Library",
    contract: "five-room-slice",
    camera: {
      ...defaultCamera,
      initialPosition: [7.2, 7.4, 10.4],
      followOffset: [6.7, 6.5, 8.6],
      lookAtOffset: [0, 0.78, 0],
      fov: 43
    },
    environment: {
      materialKey: "library",
      lightingPreset: "warm-study",
      backgroundColor: "#f4efe0",
      floorColor: "#c9b894",
      carpetColor: "#56705b",
      wallColor: "#e8d7bd",
      accentColor: "#b7783b",
      assetKey: "campus-bg-guiding-library-lounge",
      assetPath: "assets/campus/backgrounds/guiding-library-lounge.png"
    },
    portalIntents: [
      {
        id: "library-exit",
        label: "School Lobby",
        targetRoomId: "school-lobby",
        targetSpawnId: "library",
        intent: "return-to-hub",
        expectedAction: "transition-room"
      }
    ],
    interactableRoles: [
      {
        role: "navigation",
        itemKinds: ["portal"],
        expectedIds: ["library-exit"],
        expectedCount: 1,
        interaction: "portal-transition",
        owner: "rooms-foundation"
      },
      {
        role: "guide-content",
        itemKinds: ["shelf", "library"],
        expectedIds: ["library-center-table", "library-resource-cart"],
        expectedIdPattern: "guide-shelf-*",
        expectedCount: 17,
        interaction: "open-panel",
        owner: "content-integrator"
      },
      {
        role: "seat-claim",
        itemKinds: ["seat"],
        expectedIdPattern: "library-seat-*",
        expectedCount: 22,
        interaction: "claim-seat",
        owner: "network-bandwidth"
      }
    ],
    qa: {
      expectedPortalCount: 1,
      expectedObjectCount: 17,
      expectedSeatCount: 22,
      requiredSpawnIds: ["default", "lobby"],
      smokeChecks: [
        "Library entry from the lobby lands near the room exit path.",
        "Guide shelves and reading surfaces open content panels.",
        "The exit portal returns to school-lobby with the library spawn.",
        "Library seating remains claimable without blocking guide interactions."
      ],
      screenshotTargets: ["desktop-library", "mobile-library"]
    }
  },
  "flashcard-museum": {
    id: "flashcard-museum",
    title: "Museum",
    contract: "five-room-slice",
    camera: {
      ...defaultCamera,
      initialPosition: [6.6, 7.1, 9.6],
      followOffset: [6.1, 6.3, 7.8],
      lookAtOffset: [0, 0.78, 0],
      fov: 44
    },
    environment: {
      materialKey: "museum",
      lightingPreset: "gallery-focus",
      backgroundColor: "#eef0ed",
      floorColor: "#d6d2c8",
      carpetColor: "#8b4050",
      wallColor: "#26364f",
      accentColor: "#d8b266",
      assetKey: "campus-bg-flashcard-museum",
      assetPath: "assets/campus/backgrounds/flashcard-museum.png"
    },
    portalIntents: [
      {
        id: "museum-exit",
        label: "School Lobby",
        targetRoomId: "school-lobby",
        targetSpawnId: "museum",
        intent: "return-to-hub",
        expectedAction: "transition-room"
      }
    ],
    interactableRoles: [
      {
        role: "navigation",
        itemKinds: ["portal"],
        expectedIds: ["museum-exit"],
        expectedCount: 1,
        interaction: "portal-transition",
        owner: "rooms-foundation"
      },
      {
        role: "flashcard-content",
        itemKinds: ["exhibit"],
        expectedIdPattern: "flashcard-exhibit-*",
        expectedCount: 10,
        interaction: "open-panel",
        owner: "content-integrator"
      }
    ],
    qa: {
      expectedPortalCount: 1,
      expectedObjectCount: 10,
      expectedSeatCount: 0,
      requiredSpawnIds: ["default", "lobby"],
      smokeChecks: [
        "Museum entry from the lobby lands in the central gallery path.",
        "Each exhibit role can open an Alpacard-style panel.",
        "The exit portal returns to school-lobby with the museum spawn.",
        "No seat claim controls appear in this room."
      ],
      screenshotTargets: ["desktop-museum", "mobile-museum"]
    }
  },
  "debate-room-1": {
    id: "debate-room-1",
    title: "Debate Room",
    contract: "five-room-slice",
    camera: {
      ...defaultCamera,
      initialPosition: [6, 6.7, 9.2],
      followOffset: [5.9, 6.1, 7.5],
      lookAtOffset: [0, 0.78, 0],
      fov: 46
    },
    environment: {
      materialKey: "classroom",
      lightingPreset: "classroom-practice",
      backgroundColor: "#e8ece4",
      floorColor: "#c7d3c1",
      carpetColor: "#526f8a",
      wallColor: "#2f3d46",
      accentColor: "#c6533f",
      assetKey: "campus-bg-debate-room-1",
      assetPath: "assets/campus/backgrounds/debate-room-1.png"
    },
    portalIntents: [
      {
        id: "debate-room-exit",
        label: "School Lobby",
        targetRoomId: "school-lobby",
        targetSpawnId: "debate",
        intent: "return-to-hub",
        expectedAction: "transition-room"
      }
    ],
    interactableRoles: [
      {
        role: "navigation",
        itemKinds: ["portal"],
        expectedIds: ["debate-room-exit"],
        expectedCount: 1,
        interaction: "portal-transition",
        owner: "rooms-foundation"
      },
      {
        role: "debate-practice",
        itemKinds: ["board", "control"],
        expectedIds: ["debate-room-1-whiteboard", "debate-room-1-lectern"],
        expectedCount: 2,
        interaction: "launch-activity",
        owner: "mini-games"
      },
      {
        role: "seat-claim",
        itemKinds: ["seat"],
        expectedIdPattern: "debate-room-1-student-*",
        expectedCount: 20,
        interaction: "claim-seat",
        owner: "network-bandwidth"
      }
    ],
    qa: {
      expectedPortalCount: 1,
      expectedObjectCount: 2,
      expectedSeatCount: 20,
      requiredSpawnIds: ["default", "lobby"],
      smokeChecks: [
        "Debate Room entry from the lobby lands at the classroom floor spawn.",
        "Whiteboard and lectern affordances can launch or open the debate practice surface.",
        "The exit portal returns to school-lobby with the debate spawn.",
        "Student seats are claimable and do not overlap the lectern interaction."
      ],
      screenshotTargets: ["desktop-debate-room-1", "mobile-debate-room-1"]
    }
  },
  "games-hall": {
    id: "games-hall",
    title: "Games Hall",
    contract: "five-room-slice",
    camera: {
      ...defaultCamera,
      initialPosition: [7, 7.2, 10.2],
      followOffset: [6.6, 6.4, 8.4],
      lookAtOffset: [0, 0.78, 0],
      fov: 45
    },
    environment: {
      materialKey: "game-hall",
      lightingPreset: "arcade-gym",
      backgroundColor: "#e9eef0",
      floorColor: "#b9c7c9",
      carpetColor: "#514f7d",
      wallColor: "#1f2d36",
      accentColor: "#ef8354",
      assetKey: "campus-bg-games-hall",
      assetPath: "assets/campus/backgrounds/games-hall.png"
    },
    portalIntents: [
      {
        id: "games-exit",
        label: "School Lobby",
        targetRoomId: "school-lobby",
        targetSpawnId: "games",
        intent: "return-to-hub",
        expectedAction: "transition-room"
      }
    ],
    interactableRoles: [
      {
        role: "navigation",
        itemKinds: ["portal"],
        expectedIds: ["games-exit"],
        expectedCount: 1,
        interaction: "portal-transition",
        owner: "rooms-foundation"
      },
      {
        role: "play-path",
        itemKinds: ["display"],
        expectedIds: ["games-scoreboard", "games-trophy-display"],
        expectedCount: 2,
        interaction: "launch-activity",
        owner: "mini-games"
      },
      {
        role: "seat-claim",
        itemKinds: ["seat"],
        expectedIdPattern: "games-*",
        expectedCount: 24,
        interaction: "claim-seat",
        owner: "network-bandwidth"
      }
    ],
    qa: {
      expectedPortalCount: 1,
      expectedObjectCount: 2,
      expectedSeatCount: 24,
      requiredSpawnIds: ["default", "lobby"],
      smokeChecks: [
        "Games Hall entry from the lobby lands in the play hub floor area.",
        "Scoreboard and trophy display can launch or open play path surfaces.",
        "The exit portal returns to school-lobby with the games spawn.",
        "Team table and bleacher seats are claimable with clear occupied states."
      ],
      screenshotTargets: ["desktop-games-hall", "mobile-games-hall"]
    }
  }
} as const satisfies { readonly [RoomId in RoomManifestRoomId]: RoomManifest<RoomId> };

export const roomManifestList = ROOM_MANIFEST_ROOM_IDS.map((roomId) => roomManifests[roomId]);

export function getRoomManifest(roomId: RoomManifestRoomId): RoomManifest {
  return roomManifests[roomId];
}

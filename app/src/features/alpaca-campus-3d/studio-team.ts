export type StudioAgentStatus = "assigned" | "in_progress" | "ready_for_review" | "integrated" | "blocked";

export type StudioAgentRole =
  | "head-engineer"
  | "technical-artist"
  | "rooms-foundation"
  | "content-integrator"
  | "mini-games"
  | "network-bandwidth"
  | "player-mock-qa"
  | "wsc-master";

export type StudioAgent = {
  role: StudioAgentRole;
  name: string;
  agentId?: string;
  owns: string[];
  deliverables: string[];
  status: StudioAgentStatus;
};

export const FIRST_SLICE_ROOM_IDS = [
  "school-lobby",
  "guiding-library-lounge",
  "flashcard-museum",
  "debate-room-1",
  "games-hall"
] as const;

export type FirstSliceRoomId = (typeof FIRST_SLICE_ROOM_IDS)[number];

export const studioAgents: StudioAgent[] = [
  {
    role: "head-engineer",
    name: "David head engineer",
    owns: ["integration", "verification", "merge decisions", "sprint board"],
    deliverables: ["reviewed specialist outputs", "working vertical slice", "final QA report"],
    status: "integrated"
  },
  {
    role: "technical-artist",
    name: "Sidi Yahya artist 3d",
    agentId: "019e6886-fc6b-7561-876e-10a58d2c274d",
    owns: ["Blender to GLB pipeline", "asset budgets", "asset manifest"],
    deliverables: ["asset-manifest.ts", "asset pipeline documentation"],
    status: "integrated"
  },
  {
    role: "rooms-foundation",
    name: "Robin architecte",
    agentId: "019e6887-00df-7340-8353-fd7b760f78f8",
    owns: ["room manifest", "portal expectations", "camera expectations"],
    deliverables: ["room-manifest.ts", "room contract documentation"],
    status: "integrated"
  },
  {
    role: "content-integrator",
    name: "Taylor connector",
    agentId: "019e6887-0575-7aa1-870a-0b2e84805a4c",
    owns: ["room content surfaces", "WSC data mapping", "fallback labels"],
    deliverables: ["content-surfaces.ts", "content contract documentation"],
    status: "integrated"
  },
  {
    role: "mini-games",
    name: "Ira jeux dans jeu",
    agentId: "019e6887-09a5-7a32-8034-af9d3dc125fd",
    owns: ["debate activity contract", "games hall arcade contract", "activity event names"],
    deliverables: ["activity-contracts.ts", "activity contract documentation"],
    status: "integrated"
  },
  {
    role: "network-bandwidth",
    name: "Ely Reseauteur",
    agentId: "019e6887-0dd3-7d60-a670-c8650deec2ee",
    owns: ["Realtime payloads", "movement throttle policy", "seat event policy"],
    deliverables: ["network-contract.ts", "network policy documentation"],
    status: "integrated"
  },
  {
    role: "player-mock-qa",
    name: "Eugene player",
    agentId: "019e6887-12bd-7413-84f5-1f30d991a585",
    owns: ["human-eye QA", "desktop/mobile checks", "multi-session test gaps"],
    deliverables: ["triaged QA report", "acceptance test recommendations"],
    status: "integrated"
  },
  {
    role: "wsc-master",
    name: "WSC Master",
    agentId: "019e68c9-1b85-7580-93da-c805a907c83a",
    owns: ["WSC content fidelity", "solo-mode alignment", "curriculum context", "WSC mini-game rules"],
    deliverables: ["WSC context audit", "content placement recommendations", "mini-game fidelity notes"],
    status: "integrated"
  }
];

export const sprintGates = [
  "contract-gate",
  "vertical-slice-gate",
  "multiplayer-gate",
  "visual-gate",
  "qa-gate",
  "wsc-context-gate"
] as const;

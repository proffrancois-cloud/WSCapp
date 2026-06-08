import {
  ArrowDown,
  ArrowUp,
  BookOpen,
  Camera,
  DoorOpen,
  ExternalLink,
  Gamepad2,
  Gavel,
  Image,
  MapPin,
  MessageCircle,
  Monitor,
  Play,
  RefreshCcw,
  RotateCcw,
  RotateCw,
  Send,
  Sun,
  Users,
  Wifi,
  X,
  ZoomIn,
  ZoomOut
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { FormEvent, ReactElement } from "react";
import { CampusScene, getPlayerAvatarBaseHeight } from "./CampusScene";
import {
  getCampusDebugZoneDraftKey,
  getNearestActionItem,
  avatarOptions,
  DEFAULT_ONLINE_ALPACA_NAME,
  type CampusLaunchMode,
  type CampusDebugSelection,
  type CampusDebugZoneKind,
  useCampusStore
} from "./campus-store";
import { type CampusItem, type CampusPanel, type CampusRoom, type CampusZone, type WorldContentCard, getRoom } from "./campus-data";
import {
  CAMPUS_DEBUG_TILE_SIZE,
  CAMPUS_DEBUG_Z_STEP,
  formatDebugPoint3D,
  formatDebugZ,
  getCampusDebugCollisionZones,
  getCampusDebugInteractables,
  getCampusDebugSittingZones,
  getCampusDebugTile
} from "./campus-debug";
import { useCampusRealtime } from "./use-campus-realtime";
import {
  DEBATE_ROOM_1_SEAT_GROUPS,
  GAMES_HALL_ARCADE_LAUNCH_TARGETS,
  type ActivitySeatGroup
} from "./activity-contracts";
import {
  getContentSurfacesForRoom,
  type CampusContentSurface,
  type FirstFiveContentRoomId
} from "./content-surfaces";
import { ROOM_MANIFEST_ROOM_IDS, type RoomManifestRoomId } from "./room-manifest";
import { getCampusMapRoom, type CampusMapObject } from "./map-source";

const roomIcons: Record<string, typeof DoorOpen> = {
  "campus-courtyard": MapPin,
  "school-lobby": DoorOpen,
  "guiding-library-lounge": BookOpen,
  "flashcard-museum": Image,
  "debate-room-1": Gavel,
  "games-hall": Gamepad2,
  "raw-content-classroom": BookOpen
};

const CAMPUS_DOCK_ROOM_IDS = ["campus-courtyard", "school-lobby", "guiding-library-lounge", "debate-room-1"] as const;

function isFirstSliceRoomId(roomId: string): roomId is RoomManifestRoomId {
  return (ROOM_MANIFEST_ROOM_IDS as readonly string[]).includes(roomId);
}

function orderFirstSliceRooms(rooms: CampusRoom[]): CampusRoom[] {
  return CAMPUS_DOCK_ROOM_IDS
    .map((sliceRoomId) => rooms.find((room) => room.id === sliceRoomId))
    .filter((room): room is CampusRoom => Boolean(room));
}

function getSeatGroupForSeat(seatId: string | undefined): ActivitySeatGroup | null {
  if (!seatId) {
    return null;
  }

  return DEBATE_ROOM_1_SEAT_GROUPS.find((group) => (group.seatIds as readonly string[]).includes(seatId)) || null;
}

function formatActivityLabel(value: string | undefined): string {
  return String(value || "")
    .split(/[-_]/)
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(" ");
}

type AlpacardPanelData = {
  id?: string;
  title?: string;
  creator?: string;
  year?: string;
  locationMedium?: string;
  movementContext?: string;
  notice?: string;
  wscConnection?: string;
  entryTitle?: string;
  category?: string;
  sourceUrl?: string;
};

function getAlpacardPanelData(content: WorldContentCard | null): AlpacardPanelData | null {
  const value = content?.data;
  return value && typeof value === "object" ? value as AlpacardPanelData : null;
}

function ViewControls(): ReactElement {
  const viewSettings = useCampusStore((state) => state.viewSettings);
  const nudgeViewSettings = useCampusStore((state) => state.nudgeViewSettings);
  const setViewLight = useCampusStore((state) => state.setViewLight);
  const resetViewSettings = useCampusStore((state) => state.resetViewSettings);

  return (
    <section className="campus3d-view-controls" aria-label="Camera and light controls">
      <Camera className="campus3d-view-icon" size={16} aria-hidden="true" />
      <button type="button" onClick={() => nudgeViewSettings({ yaw: -Math.PI / 12 })} aria-label="Rotate camera left" title="Rotate camera left">
        <RotateCcw size={16} aria-hidden="true" />
      </button>
      <button type="button" onClick={() => nudgeViewSettings({ yaw: Math.PI / 12 })} aria-label="Rotate camera right" title="Rotate camera right">
        <RotateCw size={16} aria-hidden="true" />
      </button>
      <button type="button" onClick={() => nudgeViewSettings({ distance: -0.14 })} aria-label="Move camera closer" title="Move camera closer">
        <ZoomIn size={16} aria-hidden="true" />
      </button>
      <button type="button" onClick={() => nudgeViewSettings({ distance: 0.14 })} aria-label="Move camera farther" title="Move camera farther">
        <ZoomOut size={16} aria-hidden="true" />
      </button>
      <button type="button" onClick={() => nudgeViewSettings({ height: 0.72 })} aria-label="Raise camera" title="Raise camera">
        <ArrowUp size={16} aria-hidden="true" />
      </button>
      <button type="button" onClick={() => nudgeViewSettings({ height: -0.72 })} aria-label="Lower camera" title="Lower camera">
        <ArrowDown size={16} aria-hidden="true" />
      </button>
      <button type="button" onClick={resetViewSettings} aria-label="Reset camera" title="Reset camera">
        <RefreshCcw size={16} aria-hidden="true" />
      </button>
      <label className="campus3d-light-slider" title="Scene light">
        <Sun size={15} aria-hidden="true" />
        <input
          type="range"
          min="0.45"
          max="1.85"
          step="0.05"
          value={viewSettings.light}
          onChange={(event) => setViewLight(event.currentTarget.valueAsNumber)}
          aria-label="Scene light"
        />
      </label>
    </section>
  );
}

function getSurfaceForItem(
  roomId: string,
  item: CampusItem | null | undefined
): CampusContentSurface | null {
  if (!item || !isFirstSliceRoomId(roomId)) {
    return null;
  }

  return getContentSurfacesForRoom(roomId as FirstFiveContentRoomId).find((surface) => surface.itemId === item.id) || null;
}

export function Campus3DApp(): ReactElement {
  const campusMode = useCampusStore((state) => state.campusMode);

  if (!campusMode) {
    return <Campus3DModeGate />;
  }

  return <Campus3DRuntime realtimeEnabled={campusMode === "multiplayer"} />;
}

function Campus3DModeGate(): ReactElement {
  const setCampusMode = useCampusStore((state) => state.setCampusMode);
  const choices: Array<{
    mode: CampusLaunchMode;
    label: string;
    title: string;
    detail: string;
    Icon: typeof Monitor;
  }> = [
    {
      mode: "local",
      label: "Local",
      title: "Local campus",
      detail: "Solo room",
      Icon: Monitor
    },
    {
      mode: "multiplayer",
      label: "Online",
      title: "Alpaca Online",
      detail: DEFAULT_ONLINE_ALPACA_NAME,
      Icon: Wifi
    }
  ];

  return (
    <main className="campus3d-entry-shell" aria-label="Choose Alpaca Campus mode">
      <section className="campus3d-entry-window">
        <div className="campus3d-entry-heading">
          <span className="campus3d-eyebrow">Alpaca Campus 3D</span>
          <h1>Choose a mode</h1>
        </div>
        <div className="campus3d-entry-choice-grid">
          {choices.map(({ mode, label, title, detail, Icon }) => (
            <button
              key={mode}
              type="button"
              className="campus3d-entry-choice"
              onClick={() => setCampusMode(mode)}
            >
              <span className="campus3d-entry-choice-icon">
                <Icon size={24} aria-hidden="true" />
              </span>
              <span className="campus3d-entry-choice-copy">
                <small>{label}</small>
                <strong>{title}</strong>
                <em>{detail}</em>
              </span>
            </button>
          ))}
        </div>
      </section>
    </main>
  );
}

function CampusChat(): ReactElement {
  const campusMode = useCampusStore((state) => state.campusMode);
  const chatMessages = useCampusStore((state) => state.chatMessages);
  const sendChatMessage = useCampusStore((state) => state.sendChatMessage);
  const pruneChatMessages = useCampusStore((state) => state.pruneChatMessages);
  const [draft, setDraft] = useState("");

  useEffect(() => {
    const timerId = window.setInterval(() => pruneChatMessages(), 500);
    return () => window.clearInterval(timerId);
  }, [pruneChatMessages]);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    sendChatMessage(draft);
    setDraft("");
  }

  return (
    <section className="campus3d-chat" aria-label={campusMode === "multiplayer" ? "Room chat" : "Local chat"}>
      <div className="campus3d-chat-float-rail" aria-live="polite">
        {chatMessages.map((message, index) => (
          <article
            key={message.id}
            className={`campus3d-chat-float${message.isLocal ? " is-local" : ""}`}
            style={{ animationDelay: `${Math.min(index, 4) * 70}ms` }}
          >
            <strong>{message.displayName}</strong>
            <span>{message.message}</span>
          </article>
        ))}
      </div>
      <form className="campus3d-chat-form" onSubmit={onSubmit}>
        <MessageCircle size={17} aria-hidden="true" />
        <input
          type="text"
          value={draft}
          onChange={(event) => setDraft(event.currentTarget.value)}
          maxLength={180}
          placeholder="Message the room"
          aria-label="Message the room"
        />
        <button type="submit" aria-label="Send message" title="Send message" disabled={!draft.trim()}>
          <Send size={16} aria-hidden="true" />
        </button>
      </form>
    </section>
  );
}

function Campus3DRuntime({ realtimeEnabled }: { realtimeEnabled: boolean }): ReactElement {
  useCampusRealtime(realtimeEnabled);

  const rooms = useCampusStore((state) => state.rooms);
  const roomId = useCampusStore((state) => state.currentRoomId);
  const localPlayer = useCampusStore((state) => state.localPlayer);
  const remotePlayers = useCampusStore((state) => state.remotePlayers);
  const realtimeStatus = useCampusStore((state) => state.realtimeStatus);
  const openPanel = useCampusStore((state) => state.openPanel);
  const claimedSeatId = useCampusStore((state) => state.claimedSeatId);
  const setRoom = useCampusStore((state) => state.setRoom);
  const chooseAvatar = useCampusStore((state) => state.chooseAvatar);
  const closePanel = useCampusStore((state) => state.closePanel);
  const openItemPanel = useCampusStore((state) => state.openItemPanel);
  const room = getRoom(roomId);
  const visibleRooms = useMemo(() => orderFirstSliceRooms(rooms), [rooms]);
  const nearestItem = useMemo(() => getNearestActionItem(room, localPlayer), [room, localPlayer.x, localPlayer.y]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        closePanel();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [closePanel]);

  return (
    <main className="campus3d-shell" aria-label="Alpaca Campus 3D">
      <CampusScene />
      <CampusDebugPanel />
      <CampusDebugEditorPanel />
      <CampusChat />

      <header className="campus3d-topbar" aria-label="Campus status">
        <div className="campus3d-room-title">
          <span className="campus3d-eyebrow">Alpaca Campus 3D</span>
          <h1>{room.title}</h1>
          <p>{room.subtitle || "WSC live campus"}</p>
        </div>
        <div className="campus3d-status-cluster">
          <ViewControls />
          <span className="campus3d-status-pill">
            <Users size={16} aria-hidden="true" />
            {remotePlayers.length + 1}
          </span>
          <span className="campus3d-status-pill">{realtimeStatus}</span>
          {claimedSeatId ? <span className="campus3d-status-pill is-seat">Seat locked</span> : null}
        </div>
      </header>

      <nav className="campus3d-room-dock" aria-label="Rooms">
        {visibleRooms.map((entry) => {
          const Icon = roomIcons[entry.id] || MapPin;
          return (
            <button
              key={entry.id}
              type="button"
              className={entry.id === roomId ? "is-active" : ""}
              onClick={() => setRoom(entry.id, "default")}
              aria-label={entry.title}
              title={entry.title}
            >
              <Icon size={18} aria-hidden="true" />
              <span>{entry.title}</span>
            </button>
          );
        })}
      </nav>

      <section className="campus3d-avatar-dock" aria-label="Alpaca selection">
        {avatarOptions.map((avatar) => (
          <button
            key={avatar.id}
            type="button"
            className={avatar.id === localPlayer.avatar.id ? "is-active" : ""}
            onClick={() => chooseAvatar(avatar)}
            aria-label={avatar.name}
            title={avatar.name}
          >
            <span style={{ background: avatar.wool }} />
          </button>
        ))}
      </section>

      {nearestItem ? (
        <div className="campus3d-action-pill">
          <span>{nearestItem.label}</span>
          <button type="button" onClick={() => openItemPanel(nearestItem)}>
            {nearestItem.kind === "portal" ? <DoorOpen size={16} aria-hidden="true" /> : <MapPin size={16} aria-hidden="true" />}
            <span>{nearestItem.kind === "portal" ? "Enter" : "Open"}</span>
          </button>
        </div>
      ) : null}

      {openPanel ? (
        <aside className="campus3d-panel" aria-label={openPanel.panel.title || openPanel.item?.label || "Campus panel"}>
          <header>
            <div>
              <span className="campus3d-eyebrow">{openPanel.panel.eyebrow || openPanel.item?.kind || "Campus"}</span>
              <h2>{openPanel.panel.title || openPanel.item?.label}</h2>
            </div>
            <button type="button" onClick={closePanel} aria-label="Close panel" title="Close">
              <X size={18} aria-hidden="true" />
            </button>
          </header>
          <PanelBody />
        </aside>
      ) : null}
    </main>
  );
}

function CampusDebugPanel(): ReactElement | null {
  const debugMode = useCampusStore((state) => state.debugMode);
  const roomId = useCampusStore((state) => state.currentRoomId);
  const localPlayer = useCampusStore((state) => state.localPlayer);
  const mouseWorld = useCampusStore((state) => state.debugMouseWorld);
  const lastMapClick = useCampusStore((state) => state.debugLastMapClick);
  const debugPlacementZ = useCampusStore((state) => state.debugPlacementZ);
  const debugPlacementPoint = useCampusStore((state) => state.debugPlacementPoint);

  if (!debugMode) {
    return null;
  }

  const room = getRoom(roomId);
  const playerDebugZ = getPlayerAvatarBaseHeight(room, localPlayer);
  const mouseTile = getCampusDebugTile(mouseWorld);
  const collisionCount = getCampusDebugCollisionZones(room).length;
  const sittingCount = getCampusDebugSittingZones(room).length;
  const interactiveCount = getCampusDebugInteractables(room).length;

  return (
    <aside className="campus3d-debug-panel" aria-label="Campus debug panel">
      <strong>Debug</strong>
      <dl>
        <div>
          <dt>player x/y/z</dt>
          <dd>{formatDebugPoint3D(localPlayer, playerDebugZ)}</dd>
        </div>
        <div>
          <dt>mouse x/y/z</dt>
          <dd>{formatDebugPoint3D(mouseWorld, debugPlacementZ)}</dd>
        </div>
        <div>
          <dt>last click</dt>
          <dd>{formatDebugPoint3D(lastMapClick?.point, lastMapClick?.z)}</dd>
        </div>
        <div>
          <dt>point WASD</dt>
          <dd>{formatDebugPoint3D(debugPlacementPoint, debugPlacementZ)}</dd>
        </div>
        <div>
          <dt>z R/F</dt>
          <dd title={`R +${CAMPUS_DEBUG_Z_STEP}, F -${CAMPUS_DEBUG_Z_STEP}`}>{formatDebugZ(debugPlacementZ)}</dd>
        </div>
        <div>
          <dt>room</dt>
          <dd title={room.id}>{room.id}</dd>
        </div>
        <div>
          <dt>tile</dt>
          <dd>{mouseTile ? `${mouseTile.x} / ${mouseTile.y}` : `-- / -- (${CAMPUS_DEBUG_TILE_SIZE})`}</dd>
        </div>
        <div>
          <dt>collisions</dt>
          <dd>{collisionCount}</dd>
        </div>
        <div>
          <dt>sitting areas</dt>
          <dd>{sittingCount}</dd>
        </div>
        <div>
          <dt>interactives</dt>
          <dd>{interactiveCount}</dd>
        </div>
        {lastMapClick ? (
          <div className="campus3d-debug-snippet">
            <dt>{lastMapClick.copied ? `${lastMapClick.mode} copied` : `${lastMapClick.mode} snippet`}</dt>
            <dd>
              <code>{lastMapClick.snippet}</code>
            </dd>
          </div>
        ) : null}
      </dl>
    </aside>
  );
}

type DebugEditorTab = "info" | "blocked" | "sitting";

const DEBUG_EDITOR_TABS: Array<{ id: DebugEditorTab; label: string }> = [
  { id: "info", label: "Info" },
  { id: "blocked", label: "Non-walkable" },
  { id: "sitting", label: "Sitting area" }
];

function CampusDebugEditorPanel(): ReactElement | null {
  const debugMode = useCampusStore((state) => state.debugMode);
  const selection = useCampusStore((state) => state.debugSelection);
  const debugZoneDrafts = useCampusStore((state) => state.debugZoneDrafts);
  const selectDebugTarget = useCampusStore((state) => state.selectDebugTarget);
  const [activeTab, setActiveTab] = useState<DebugEditorTab>("info");
  const selectionKey = selection ? `${selection.roomId}:${selection.targetType}:${selection.zoneKind || ""}:${selection.id}` : "";

  useEffect(() => {
    setActiveTab("info");
  }, [selectionKey]);

  if (!debugMode || !selection) {
    return null;
  }

  const room = getRoom(selection.roomId);
  const mapRoom = getCampusMapRoom(room);
  const mapObject = mapRoom.objects.find((object) => object.id === selection.id) || null;
  const selectedZone = selection.targetType === "zone" && selection.zoneKind
    ? findDebugEditorZone(room, selection, selection.zoneKind, mapObject)
    : null;
  const blockedBaseZone = findDebugEditorZone(room, selection, "blocked", mapObject);
  const sittingBaseZone = findDebugEditorZone(room, selection, "sitting", mapObject);
  const blockedZone = blockedBaseZone
    ? debugZoneDrafts[getCampusDebugZoneDraftKey(room.id, "blocked", blockedBaseZone.id)] || blockedBaseZone
    : null;
  const sittingZone = sittingBaseZone
    ? debugZoneDrafts[getCampusDebugZoneDraftKey(room.id, "sitting", sittingBaseZone.id)] || sittingBaseZone
    : null;

  return (
    <aside className="campus3d-debug-editor" aria-label="Debug object editor">
      <header>
        <div>
          <span className="campus3d-eyebrow">Debug selection</span>
          <h2>{getDebugSelectionLabel(selection, mapObject, selectedZone)}</h2>
        </div>
        <button type="button" onClick={() => selectDebugTarget(null)} aria-label="Close debug editor" title="Close">
          <X size={18} aria-hidden="true" />
        </button>
      </header>
      <div className="campus3d-debug-tabs" role="tablist" aria-label="Debug editor tabs">
        {DEBUG_EDITOR_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={activeTab === tab.id ? "is-active" : ""}
            onClick={() => setActiveTab(tab.id)}
            role="tab"
            aria-selected={activeTab === tab.id}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {activeTab === "info" ? (
        <DebugInfoTab selection={selection} mapObject={mapObject} selectedZone={selectedZone} />
      ) : null}
      {activeTab === "blocked" ? (
        <DebugZoneTab roomId={room.id} zoneKind="blocked" baseZone={blockedBaseZone} zone={blockedZone} />
      ) : null}
      {activeTab === "sitting" ? (
        <DebugZoneTab roomId={room.id} zoneKind="sitting" baseZone={sittingBaseZone} zone={sittingZone} />
      ) : null}
    </aside>
  );
}

function DebugInfoTab({
  selection,
  mapObject,
  selectedZone
}: {
  selection: CampusDebugSelection;
  mapObject: CampusMapObject | null;
  selectedZone: CampusZone | null;
}): ReactElement {
  const placement = mapObject?.placement;
  const runtimeItem = mapObject?.runtimeItem;
  const infoRows = [
    ["Name", getDebugSelectionLabel(selection, mapObject, selectedZone)],
    ["ID", selection.id],
    ["Type", selection.targetType === "zone" ? `${selection.zoneKind} zone` : mapObject?.type || selection.targetType],
    ["Room", selection.roomId],
    ["Source", mapObject?.source],
    ["Asset", placement?.asset || mapObject?.assetKey],
    ["Location", selectedZone ? `${selectedZone.x} / ${selectedZone.y}` : mapObject ? `${mapObject.x} / ${mapObject.y}` : ""],
    ["Size", selectedZone ? `${selectedZone.width} x ${selectedZone.height}` : getDebugObjectSizeLabel(mapObject)],
    ["Scale", formatDebugPlacementScale(placement?.scale)],
    ["Height", placement?.height !== undefined ? String(placement.height) : ""],
    ["Panel", runtimeItem?.panel || ""],
    ["Target", runtimeItem?.targetRoomId ? `${runtimeItem.targetRoomId}:${runtimeItem.targetSpawnId || "default"}` : ""]
  ].filter((row): row is [string, string] => Boolean(row[1]));

  return (
    <div className="campus3d-debug-editor-body">
      <dl className="campus3d-debug-info-list">
        {infoRows.map(([label, value]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd title={value}>{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function DebugZoneTab({
  roomId,
  zoneKind,
  baseZone,
  zone
}: {
  roomId: string;
  zoneKind: CampusDebugZoneKind;
  baseZone: CampusZone | null;
  zone: CampusZone | null;
}): ReactElement {
  const setDebugZoneDraft = useCampusStore((state) => state.setDebugZoneDraft);
  const resetDebugZoneDraft = useCampusStore((state) => state.resetDebugZoneDraft);
  const [confirmedSnippet, setConfirmedSnippet] = useState("");
  const draftKey = baseZone ? getCampusDebugZoneDraftKey(roomId, zoneKind, baseZone.id) : "";
  const hasDraft = useCampusStore((state) => Boolean(draftKey && state.debugZoneDrafts[draftKey]));

  useEffect(() => {
    setConfirmedSnippet("");
  }, [draftKey]);

  if (!baseZone || !zone) {
    return (
      <div className="campus3d-debug-editor-body">
        <section className="campus3d-debug-empty">
          <h3>{getDebugZoneKindLabel(zoneKind)}</h3>
          <p>No zone attached.</p>
        </section>
      </div>
    );
  }

  const editableZone = zone;

  function updateZoneField(field: "x" | "y" | "width" | "height", value: number) {
    if (!Number.isFinite(value)) {
      return;
    }
    setConfirmedSnippet("");
    setDebugZoneDraft(roomId, zoneKind, {
      ...editableZone,
      [field]: value
    });
  }

  async function confirmZoneDraft() {
    const snippet = formatDebugZoneExport(roomId, zoneKind, editableZone);
    setConfirmedSnippet(snippet);
    window.console.log(`[campus-debug-confirm]\n${snippet}`);
    try {
      await window.navigator.clipboard?.writeText(snippet);
    } catch (_error) {}
  }

  return (
    <div className="campus3d-debug-editor-body">
      <section className="campus3d-debug-zone-card">
        <div className="campus3d-debug-zone-head">
          <div>
            <span>{getDebugZoneKindLabel(zoneKind)}</span>
            <h3>{zone.id}</h3>
          </div>
          {hasDraft ? <small>Draft</small> : null}
        </div>
        <div className="campus3d-debug-zone-grid">
          <DebugNumberField label="X" value={zone.x} onChange={(value) => updateZoneField("x", value)} />
          <DebugNumberField label="Y" value={zone.y} onChange={(value) => updateZoneField("y", value)} />
          <DebugNumberField label="Width" value={zone.width} onChange={(value) => updateZoneField("width", value)} />
          <DebugNumberField label="Height" value={zone.height} onChange={(value) => updateZoneField("height", value)} />
        </div>
        <div className="campus3d-debug-zone-actions">
          <button type="button" onClick={confirmZoneDraft}>Confirm</button>
          {hasDraft ? (
            <button type="button" onClick={() => resetDebugZoneDraft(roomId, zoneKind, zone.id)}>Reset</button>
          ) : null}
        </div>
        {confirmedSnippet ? (
          <code className="campus3d-debug-confirm-code">{confirmedSnippet}</code>
        ) : null}
      </section>
    </div>
  );
}

function DebugNumberField({
  label,
  value,
  onChange
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}): ReactElement {
  return (
    <label className="campus3d-debug-number-field">
      <span>{label}</span>
      <input
        type="number"
        step="1"
        value={Math.round(value)}
        onChange={(event) => onChange(event.currentTarget.valueAsNumber)}
      />
    </label>
  );
}

function findDebugEditorZone(
  room: CampusRoom,
  selection: CampusDebugSelection,
  zoneKind: CampusDebugZoneKind,
  mapObject: CampusMapObject | null
): CampusZone | null {
  const zones = zoneKind === "blocked" ? getCampusDebugCollisionZones(room) : getCampusDebugSittingZones(room);

  if (selection.targetType === "zone" && selection.zoneKind === zoneKind) {
    return zones.find((zone) => zone.id === selection.id) || null;
  }

  const targetIds = [
    selection.id,
    mapObject?.id,
    mapObject?.runtimeItem?.id,
    mapObject?.placement?.id
  ].filter((value): value is string => Boolean(value));

  return zones.find((zone) => targetIds.some((targetId) => debugZoneIdMatchesTarget(zone.id, targetId))) || null;
}

function debugZoneIdMatchesTarget(zoneId: string, targetId: string): boolean {
  if (
    zoneId === targetId ||
    zoneId === `${targetId}-block` ||
    zoneId === `${targetId}-sitting-area` ||
    zoneId.replace(/-(?:block|sitting-area|zone|area)$/, "") === targetId
  ) {
    return true;
  }

  const zoneTokens = tokenizeDebugId(zoneId);
  const targetTokens = tokenizeDebugId(targetId);
  return zoneTokens.some((token) => targetTokens.includes(token));
}

function tokenizeDebugId(value: string): string[] {
  const ignored = new Set(["lobby", "school", "campus", "block", "zone", "area", "sitting", "seat", "custom"]);
  return value
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length > 2 && !ignored.has(token));
}

function getDebugSelectionLabel(
  selection: CampusDebugSelection,
  mapObject: CampusMapObject | null,
  selectedZone: CampusZone | null
): string {
  return mapObject?.label || mapObject?.placement?.id || selectedZone?.id || selection.id;
}

function getDebugObjectSizeLabel(mapObject: CampusMapObject | null): string {
  if (!mapObject) {
    return "";
  }
  if (typeof mapObject.width === "number" && typeof mapObject.height === "number") {
    return `${Math.round(mapObject.width)} x ${Math.round(mapObject.height)}`;
  }
  return "";
}

function formatDebugPlacementScale(scale: unknown): string {
  if (Array.isArray(scale)) {
    return scale.map((value) => String(value)).join(" / ");
  }
  return scale !== undefined && scale !== null ? String(scale) : "";
}

function getDebugZoneKindLabel(zoneKind: CampusDebugZoneKind): string {
  return zoneKind === "blocked" ? "Non-walkable zone" : "Sitting area";
}

function formatDebugZoneExport(roomId: string, zoneKind: CampusDebugZoneKind, zone: CampusZone): string {
  const collection = zoneKind === "blocked" ? "blockedZones" : "sittingZones";
  const helper = roomId === "school-lobby" ? "lobbyRect" : "rect";
  const zoneData = {
    id: zone.id,
    x: Math.round(zone.x),
    y: Math.round(zone.y),
    width: Math.round(zone.width),
    height: Math.round(zone.height)
  };

  return [
    `room: ${roomId}`,
    `collection: ${collection}`,
    `${helper}("${zone.id}", ${zoneData.x}, ${zoneData.y}, ${zoneData.width}, ${zoneData.height})`,
    `data: ${JSON.stringify(zoneData)}`
  ].join("\n");
}

function AlpacardFocusPanel({
  panel,
  content,
  item,
  surface
}: {
  panel: CampusPanel;
  content: WorldContentCard | null;
  item: CampusItem | null;
  surface: CampusContentSurface | null;
}): ReactElement {
  const data = getAlpacardPanelData(content);
  const imageSrc = content?.imageSrc || panel.featuredImage || panel.alpacards?.[0]?.imageSrc || "";
  const title = content?.title || data?.title || panel.title || item?.label || "Alpacard";
  const sourceHref = content?.sourceHref || panel.sourceHref || data?.sourceUrl || "";
  const details = [
    ["Creator", data?.creator],
    ["Year", data?.year],
    ["Where / medium", data?.locationMedium],
    ["Movement / context", data?.movementContext],
    ["Category", data?.category],
    ["WSC link", data?.wscConnection]
  ].filter((detail): detail is [string, string] => Boolean(detail[1]));

  return (
    <div className="campus3d-panel-body">
      {surface ? <SurfaceSummary surface={surface} /> : null}
      <section className="campus3d-alpacard-focus" aria-label={title}>
        {imageSrc ? (
          <div className="campus3d-alpacard-zoom-frame">
            <img src={imageSrc} alt={title} />
          </div>
        ) : null}
        <div className="campus3d-alpacard-info-card">
          <span>Back of card</span>
          <h3>{title}</h3>
          {data?.entryTitle ? <p className="campus3d-muted">{data.entryTitle}</p> : null}
          {data?.notice || content?.summary ? <p>{data?.notice || content?.summary}</p> : null}
          {details.length ? (
            <dl>
              {details.map(([label, value]) => (
                <div key={label}>
                  <dt>{label}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>
          ) : null}
          {sourceHref ? (
            <a className="campus3d-inline-link" href={sourceHref} target="_blank" rel="noreferrer">
              <ExternalLink size={14} aria-hidden="true" />
              Open source
            </a>
          ) : null}
        </div>
      </section>
    </div>
  );
}

function PanelBody(): ReactElement | null {
  const openPanel = useCampusStore((state) => state.openPanel);
  const roomId = useCampusStore((state) => state.currentRoomId);
  const claimedSeatId = useCampusStore((state) => state.claimedSeatId);
  const localClientId = useCampusStore((state) => state.localPlayer.clientId);
  const occupiedSeats = useCampusStore((state) => state.occupiedSeats);

  if (!openPanel) {
    return null;
  }

  const { panel, content, item } = openPanel;
  const surface = getSurfaceForItem(roomId, item);
  const duplicateSummary = Boolean(
    content?.summary &&
    panel.summary &&
    content.summary.trim().toLowerCase() === panel.summary.trim().toLowerCase()
  );
  const seatGroup = item?.kind === "seat" ? getSeatGroupForSeat(item.id) : null;
  const seatOccupant = item?.kind === "seat" ? occupiedSeats[item.id] : "";
  const isSeatClaimedByMe = item?.kind === "seat" && claimedSeatId === item.id;
  const seatStatus = isSeatClaimedByMe ? "You have this seat" : seatOccupant && seatOccupant !== localClientId ? "Occupied" : "Seat available";
  const featuredImage = panel.featuredImage && panel.featuredImage !== content?.imageSrc ? panel.featuredImage : "";

  if (item?.kind === "alpacard" || content?.kind === "alpacard") {
    return <AlpacardFocusPanel panel={panel} content={content} item={item} surface={surface} />;
  }

  return (
    <div className="campus3d-panel-body">
      {surface ? <SurfaceSummary surface={surface} /> : null}
      {content?.imageSrc ? (
        <img className="campus3d-panel-media" src={content.imageSrc} alt="" />
      ) : null}
      {featuredImage ? (
        <img className="campus3d-panel-media" src={featuredImage} alt="" />
      ) : null}
      {content?.embedUrl ? (
        <iframe
          className="campus3d-panel-video"
          src={content.embedUrl}
          title={content.title || "Campus video"}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      ) : null}
      {panel.featuredVideo?.embedUrl && panel.featuredVideo.embedUrl !== content?.embedUrl ? (
        <iframe
          className="campus3d-panel-video"
          src={panel.featuredVideo.embedUrl}
          title={panel.featuredVideo.title || "Campus video"}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      ) : null}
      {content?.title ? (
        <section className="campus3d-panel-section">
          <h3>{content.title}</h3>
          {content.subtitle ? <p className="campus3d-muted">{content.subtitle}</p> : null}
          {content.summary ? <p>{content.summary}</p> : null}
          {content.sourceHref ? (
            <a href={content.sourceHref} target="_blank" rel="noreferrer">
              Open source
            </a>
          ) : null}
        </section>
      ) : null}
      {panel.summary && !duplicateSummary ? <p className="campus3d-summary">{panel.summary}</p> : null}
      {panel.featuredMeta ? <p className="campus3d-muted">{panel.featuredMeta}</p> : null}
      {panel.sourceHref ? (
        <a className="campus3d-inline-link" href={panel.sourceHref} target="_blank" rel="noreferrer">
          <ExternalLink size={14} aria-hidden="true" />
          Open source
        </a>
      ) : null}
      {seatGroup ? <SeatAssignment group={seatGroup} status={seatStatus} /> : null}
      {item?.kind === "seat" && !seatGroup ? (
        <p className="campus3d-summary">{seatStatus}.</p>
      ) : null}
      <DebateActivityPanel item={item} />
      <GamesLaunchPanel item={item} />
      {panel.guides?.length ? (
        <section className="campus3d-panel-section">
          <h3>Guides</h3>
          <ul>
            {panel.guides.map((guide) => (
              <li key={guide.id || guide.title}>
                {guide.href ? (
                  <a href={guide.href} target="_blank" rel="noreferrer">
                    {guide.title}
                  </a>
                ) : (
                  <span>{guide.title}</span>
                )}
                {guide.summary ? <p>{guide.summary}</p> : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      {panel.sections?.length ? (
        <section className="campus3d-panel-section">
          <h3>Sections</h3>
          <ul>
            {panel.sections.map((section) => (
              <li key={section.id || section.title}>
                <span>{section.title}</span>
                {section.summary ? <p>{section.summary}</p> : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      {panel.subjects?.length ? (
        <section className="campus3d-panel-section">
          <h3>Subjects</h3>
          <div className="campus3d-chip-grid">
            {panel.subjects.map((subject) => (
              <span key={subject.id || subject.label} style={{ borderColor: subject.color || "#59747c" }}>
                {subject.label}
              </span>
            ))}
          </div>
        </section>
      ) : null}
      {panel.insights?.length ? (
        <section className="campus3d-panel-section">
          <h3>Practice Prompts</h3>
          <ul>
            {panel.insights.map((insight) => (
              <li key={insight.title || insight.body}>
                <span>{insight.title}</span>
                {insight.body ? <p>{insight.body}</p> : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      {panel.mediaCards?.length ? (
        <section className="campus3d-panel-section">
          <h3>Media</h3>
          <ul>
            {panel.mediaCards.map((card) => (
              <li key={card.title}>
                <span>{card.title}</span>
                {card.summary ? <p>{card.summary}</p> : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      {panel.videos?.length ? (
        <section className="campus3d-panel-section">
          <h3>Videos</h3>
          <div className="campus3d-card-list">
            {panel.videos.map((video) => (
              <a key={video.id || video.title} href={video.href || video.embedUrl || "#"} target="_blank" rel="noreferrer">
                {video.imageSrc ? <img src={video.imageSrc} alt="" /> : null}
                <span>{video.title}</span>
                {video.summary ? <p>{video.summary}</p> : null}
              </a>
            ))}
          </div>
        </section>
      ) : null}
      {panel.alpacards?.length ? (
        <section className="campus3d-panel-section">
          <h3>Alpacards</h3>
          <div className="campus3d-card-list">
            {panel.alpacards.map((card) => (
              <a key={card.id || card.title} href={card.href || "#"} target="_blank" rel="noreferrer">
                {card.imageSrc ? <img src={card.imageSrc} alt="" /> : null}
                <span>{card.title}</span>
                {card.meta ? <small>{card.meta}</small> : null}
                {card.summary ? <p>{card.summary}</p> : null}
              </a>
            ))}
          </div>
        </section>
      ) : null}
      {panel.atoms?.length ? (
        <section className="campus3d-panel-section">
          <h3>Big Ideas</h3>
          <ul>
            {panel.atoms.map((atom) => (
              <li key={atom.title}>
                <span>{atom.title}</span>
                {atom.summary ? <p>{atom.summary}</p> : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      {panel.notes?.length ? (
        <section className="campus3d-panel-section">
          <h3>Notes</h3>
          <ul>
            {panel.notes.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        </section>
      ) : null}
      {panel.links?.length ? (
        <section className="campus3d-panel-section">
          <h3>Links</h3>
          <div className="campus3d-link-list">
            {panel.links.map((link) => (
              <a key={link.href || link.title} href={link.href || "#"} target="_blank" rel="noreferrer">
                <ExternalLink size={14} aria-hidden="true" />
                <span>{link.title}</span>
              </a>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}

function SurfaceSummary({ surface }: { surface: CampusContentSurface }): ReactElement {
  return (
    <section className="campus3d-surface-summary" aria-label="Content surface">
      <span>{surface.contentLabel || surface.resolvedPanelLabel}</span>
      <small>{formatActivityLabel(surface.contentKind || surface.kind)}</small>
    </section>
  );
}

function SeatAssignment({ group, status }: { group: ActivitySeatGroup; status: string }): ReactElement {
  return (
    <section className="campus3d-seat-assignment">
      <span>{status}</span>
      <h3>{group.label}</h3>
      <p>
        {formatActivityLabel(group.side)} · {formatActivityLabel(group.role)} · {group.capacity} seats
      </p>
    </section>
  );
}

function DebateActivityPanel({ item }: { item?: CampusItem | null }): ReactElement | null {
  if (item?.panel !== "debate" && !getSeatGroupForSeat(item?.id)) {
    return null;
  }

  return (
    <section className="campus3d-panel-section">
      <h3>Debate Tables</h3>
      <div className="campus3d-role-grid">
        {DEBATE_ROOM_1_SEAT_GROUPS.map((group) => (
          <span key={group.id}>
            <strong>{group.label}</strong>
            <small>{formatActivityLabel(group.role)}</small>
          </span>
        ))}
      </div>
    </section>
  );
}

function GamesLaunchPanel({ item }: { item?: CampusItem | null }): ReactElement | null {
  if (item?.panel !== "path-play") {
    return null;
  }

  return (
    <section className="campus3d-panel-section">
      <h3>Arcade Launches</h3>
      <div className="campus3d-launch-grid">
        {GAMES_HALL_ARCADE_LAUNCH_TARGETS.map((target) => (
          <a key={target.id} href={`../?path=play&mode=${target.modeId}`} target="_blank" rel="noreferrer">
            <Play size={15} aria-hidden="true" />
            <span>{target.label.replace("Launch ", "")}</span>
            <small>{target.availability === "placeholder" ? "Live preview" : "Solo bridge"}</small>
          </a>
        ))}
      </div>
    </section>
  );
}

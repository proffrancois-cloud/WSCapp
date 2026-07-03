(function () {
  const STORAGE_COLOR_KEY = "wscCampus2dAlpacaColor";
  const STORAGE_ROOM_KEY = "wscCampus2dRoom";
  const STORAGE_DEV_ZONES_KEY = "wscCampus2dDevZones";
  const CHAT_TTL_MS = 7600;
  const MOVE_SPEED = 238;
  const MOVE_EPSILON = 6;
  const ALPACA_COLLISION_RADIUS = 28;
  const ALPACA_COLLISION_DISTANCE = ALPACA_COLLISION_RADIUS * 2;
  const MIN_DEV_ZONE_SIZE = 12;
  const DEV_ZONE_PASTE_OFFSET = 16;
  const DEV_ZONE_TYPES = ["blocked", "seat", "behind", "portal", "game"];
  const DEV_ZONE_FIELDS = ["x", "y", "width", "height"];
  const DEV_ZONE_CONFIG = Object.freeze({
    blocked: { key: "blockedZones", label: "pink blocked", className: "blocked" },
    seat: { key: "seats", label: "yellow seat", className: "seat" },
    behind: { key: "behindZones", label: "purple behind", className: "behind" },
    portal: { key: "portals", label: "blue portal", className: "portal" },
    game: { key: "gameZones", label: "orange game", className: "game" }
  });

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function getManifest() {
    return window.WSC_CAMPUS_2D_MANIFEST || null;
  }

  function getRealtimeApi() {
    return window.WSC_CAMPUS_2D_REALTIME || null;
  }

  function getRoom(roomId) {
    const manifest = getManifest();
    return manifest?.roomsById?.[roomId] || manifest?.roomsById?.[manifest.defaultRoomId] || null;
  }

  function isPointInRect(point, rect) {
    return point.x >= rect.x &&
      point.x <= rect.x + rect.width &&
      point.y >= rect.y &&
      point.y <= rect.y + rect.height;
  }

  function isPointInZones(point, zones = []) {
    return zones.some((zone) => isPointInRect(point, zone));
  }

  function isPointInRoom(room, point) {
    return point.x >= 0 && point.x <= room.width && point.y >= 0 && point.y <= room.height;
  }

  function getWalkability(room, point, zones = {}) {
    const inBounds = isPointInRoom(room, point);
    const blockedZones = zones.blockedZones || room.blockedZones || [];
    const seats = zones.seats || room.seats || [];
    const inBlockedZone = isPointInZones(point, blockedZones);
    const inSeat = seats.some((seat) => isPointInRect(point, seat.zone));
    return {
      inBounds,
      inBlockedZone,
      inSeat,
      walkable: inBounds && (inSeat || !inBlockedZone)
    };
  }

  function isWalkable(room, point, zones = {}) {
    return getWalkability(room, point, zones).walkable;
  }

  function getPointDistance(left, right) {
    return Math.hypot(left.x - right.x, left.y - right.y);
  }

  function safeStorageGet(key) {
    try {
      return window.localStorage.getItem(key);
    } catch (_error) {
      return null;
    }
  }

  function safeStorageSet(key, value) {
    try {
      window.localStorage.setItem(key, value);
    } catch (_error) {}
  }

  function safeStorageRemove(key) {
    try {
      window.localStorage.removeItem(key);
    } catch (_error) {}
  }

  function roundNumber(value) {
    return Math.round(Number(value) || 0);
  }

  function cloneRect(rect, fallbackId = "zone") {
    return {
      id: String(rect?.id || fallbackId),
      x: roundNumber(rect?.x),
      y: roundNumber(rect?.y),
      width: Math.max(MIN_DEV_ZONE_SIZE, roundNumber(rect?.width)),
      height: Math.max(MIN_DEV_ZONE_SIZE, roundNumber(rect?.height))
    };
  }

  function createEl(tagName, className, attributes = {}) {
    const element = document.createElement(tagName);
    if (className) {
      element.className = className;
    }
    Object.entries(attributes).forEach(([name, value]) => {
      if (value !== null && value !== undefined) {
        element.setAttribute(name, String(value));
      }
    });
    return element;
  }

  function isTextEntryTarget(target) {
    return Boolean(target?.closest?.("input, textarea, select, [contenteditable='true']"));
  }

  function getColor(manifest, colorId) {
    return manifest.colors.find((color) => color.id === colorId) || manifest.colors[0];
  }

  function normalizeDirection(vector, fallback = "down") {
    if (Math.abs(vector.x) > Math.abs(vector.y)) {
      return vector.x < 0 ? "left" : "right";
    }
    if (Math.abs(vector.y) > 0) {
      return vector.y < 0 ? "up" : "down";
    }
    return fallback;
  }

  function getFrame(direction) {
    const index = 1;
    if (direction === "up") {
      return { col: index, row: 2, flip: 1 };
    }
    if (direction === "left") {
      return { col: index, row: 1, flip: 1 };
    }
    if (direction === "right") {
      return { col: index, row: 1, flip: -1 };
    }
    return { col: index, row: 0, flip: 1 };
  }

  function spritePercent(index, count) {
    return count <= 1 ? "0%" : `${(index / (count - 1)) * 100}%`;
  }

  function pluralize(value, unit) {
    return `${value} ${unit}${value === 1 ? "" : "s"}`;
  }

  function addMonths(date, months) {
    const year = date.getUTCFullYear();
    const month = date.getUTCMonth() + months;
    const day = date.getUTCDate();
    const result = new Date(Date.UTC(
      year,
      month,
      1,
      date.getUTCHours(),
      date.getUTCMinutes(),
      date.getUTCSeconds(),
      date.getUTCMilliseconds()
    ));
    const lastDayOfMonth = new Date(Date.UTC(result.getUTCFullYear(), result.getUTCMonth() + 1, 0)).getUTCDate();
    result.setUTCDate(Math.min(day, lastDayOfMonth));
    return result;
  }

  function getAccountAgeParts(createdAt, now = new Date()) {
    const created = new Date(createdAt);
    if (Number.isNaN(created.getTime())) {
      return null;
    }
    const end = now < created ? created : now;
    const totalDays = Math.floor((end.getTime() - created.getTime()) / 86400000);
    let years = 0;
    while (addMonths(created, (years + 1) * 12) <= end) {
      years += 1;
    }
    let months = 0;
    while (addMonths(created, years * 12 + months + 1) <= end) {
      months += 1;
    }
    const anchor = addMonths(created, years * 12 + months);
    const days = Math.floor((end.getTime() - anchor.getTime()) / 86400000);
    return { years, months, days, totalDays };
  }

  function formatAccountAge(createdAt) {
    const age = getAccountAgeParts(createdAt);
    if (!age) {
      return "Unknown";
    }
    if (age.years > 0) {
      return [
        pluralize(age.years, "year"),
        pluralize(age.months, "month"),
        pluralize(age.days, "day")
      ].join(", ");
    }
    if (age.months >= 3) {
      return `${pluralize(age.months, "month")}, ${pluralize(age.days, "day")}`;
    }
    return pluralize(age.totalDays, "day");
  }

  function mount(options) {
    const manifest = getManifest();
    if (!manifest || !options?.mount) {
      return { destroy() {}, setRoom() {}, openGameLauncher() {} };
    }

    const mountNode = options.mount;
    const identity = options.identity || {};
    const colorIds = new Set(manifest.colors.map((color) => color.id));
    const initialColor = colorIds.has(safeStorageGet(STORAGE_COLOR_KEY))
      ? safeStorageGet(STORAGE_COLOR_KEY)
      : manifest.colors[0].id;
    const savedRoomId = safeStorageGet(STORAGE_ROOM_KEY);
    const initialRoom = getRoom(savedRoomId) || getRoom(manifest.defaultRoomId);
    const realtimeApi = getRealtimeApi();
    const localClientId = identity.clientId || realtimeApi?.createClientId?.() || `campus2d-${Date.now()}`;

    let room = initialRoom;
    let channel = null;
    let animationFrameId = 0;
    let lastFrameAt = performance.now();
    let lastMoveSentAt = 0;
    let lastPresenceSentAt = 0;
    let camera = { scale: 1, x: 0, y: 0 };
    let activeTarget = null;
    let debugEnabled = false;
    let zoneEditorEnabled = false;
    let selectedZoneType = "blocked";
    let selectedZoneId = null;
    let copiedZone = null;
    let zoneEditGesture = null;
    let devZoneData = loadDevZoneData();
    let debugMousePoint = null;
    let debugStatusText = "";
    let destroyed = false;
    const keys = new Set();
    const remotePlayers = new Map();
    const remoteElements = new Map();

    const spawn = room.spawnPoints.default;
    const localPlayer = {
      clientId: localClientId,
      userId: identity.userId || null,
      displayName: identity.displayName || "Guest",
      schoolName: identity.schoolName || "",
      createdAt: identity.createdAt || null,
      roomId: room.id,
      x: spawn.x,
      y: spawn.y,
      direction: "down",
      colorId: initialColor,
      moving: false
    };

    const root = createEl("section", "campus2d-root", {
      "aria-label": "Alpaca Online 2D campus",
      tabindex: "-1"
    });
    const viewport = createEl("div", "campus2d-viewport");
    const world = createEl("div", "campus2d-world");
    const mapImage = createEl("img", "campus2d-map", {
      alt: "",
      draggable: "false"
    });
    const entitiesLayer = createEl("div", "campus2d-entities");
    const hotspotsLayer = createEl("div", "campus2d-hotspots");
    const portalsLayer = createEl("div", "campus2d-portals");
    const seatsLayer = createEl("div", "campus2d-seats");
    const behindLayer = createEl("div", "campus2d-behind-layer");
    const debugLayer = createEl("div", "campus2d-debug-layer", { "aria-hidden": "true" });
    const sidePanel = createEl("aside", "campus2d-side-panel", {
      "aria-label": "Multiplayer controls",
      "data-campus2d-ui": ""
    });
    const hud = createEl("div", "campus2d-hud", { "data-campus2d-ui": "" });
    const roomTitle = createEl("strong", "campus2d-room-title");
    const statusPill = createEl("span", "campus2d-status-pill");
    const palette = createEl("div", "campus2d-palette", {
      "aria-label": "Choose alpaca color",
      role: "group"
    });
    const gamesButton = createEl("button", "campus2d-icon-button campus2d-games-button", {
      type: "button",
      title: "Games",
      "aria-label": "Open games"
    });
    const chatForm = createEl("form", "campus2d-chat-form", { "data-campus2d-ui": "" });
    const chatInput = createEl("input", "campus2d-chat-input", {
      type: "text",
      maxlength: "140",
      autocomplete: "off",
      placeholder: "Say something"
    });
    const chatButton = createEl("button", "campus2d-chat-submit", {
      type: "submit",
      "aria-label": "Send message",
      title: "Send"
    });
    const debugPanel = createEl("aside", "campus2d-debug-panel", {
      "data-campus2d-ui": "",
      hidden: ""
    });
    const debugTitle = createEl("strong", "campus2d-debug-title");
    const debugRoom = createEl("span", "campus2d-debug-line");
    const debugMouse = createEl("span", "campus2d-debug-line");
    const debugCounts = createEl("span", "campus2d-debug-line");
    const debugControls = createEl("div", "campus2d-debug-controls");
    const zoneTypeSelect = createEl("select", "campus2d-debug-select", {
      "aria-label": "Zone type",
      "data-campus2d-zone-type": ""
    });
    const zoneSelectionLabel = createEl("span", "campus2d-debug-line campus2d-zone-selection");
    const zoneFieldGrid = createEl("div", "campus2d-zone-fields");
    const zoneFieldInputs = {};
    const debugActions = createEl("div", "campus2d-debug-actions");
    const deleteZoneButton = createEl("button", "campus2d-debug-button", {
      type: "button",
      "data-campus2d-zone-delete": ""
    });
    const copySelectedButton = createEl("button", "campus2d-debug-button", {
      type: "button",
      "data-campus2d-zone-copy-selected": ""
    });
    const pasteZoneButton = createEl("button", "campus2d-debug-button", {
      type: "button",
      "data-campus2d-zone-paste": ""
    });
    const saveZonesButton = createEl("button", "campus2d-debug-button", {
      type: "button",
      "data-campus2d-zone-save": ""
    });
    const copyPatchButton = createEl("button", "campus2d-debug-button", {
      type: "button",
      "data-campus2d-zone-copy": ""
    });
    const exportJsonButton = createEl("button", "campus2d-debug-button", {
      type: "button",
      "data-campus2d-zone-export": ""
    });
    const debugStatus = createEl("span", "campus2d-debug-status");
    const localElement = createPlayerElement(localPlayer, true);

    gamesButton.textContent = "Games";
    chatButton.textContent = "Send";
    debugTitle.textContent = "Dev";
    DEV_ZONE_TYPES.forEach((type) => {
      const option = createEl("option", "");
      option.value = type;
      option.textContent = DEV_ZONE_CONFIG[type].label;
      zoneTypeSelect.append(option);
    });
    DEV_ZONE_FIELDS.forEach((field) => {
      const label = createEl("label", "campus2d-zone-field");
      const text = createEl("span", "");
      const input = createEl("input", "", {
        type: "number",
        step: "1",
        min: "0",
        "data-campus2d-zone-field": field
      });
      text.textContent = field === "width" ? "w" : field === "height" ? "h" : field;
      zoneFieldInputs[field] = input;
      label.append(text, input);
      zoneFieldGrid.append(label);
    });
    deleteZoneButton.textContent = "Delete";
    copySelectedButton.textContent = "Copy selected zone";
    pasteZoneButton.textContent = "Paste";
    saveZonesButton.textContent = "Save";
    copyPatchButton.textContent = "Copy patch";
    exportJsonButton.textContent = "Export JSON";
    debugControls.append(zoneTypeSelect);
    debugActions.append(copySelectedButton, pasteZoneButton, deleteZoneButton, saveZonesButton, copyPatchButton, exportJsonButton);
    debugPanel.append(
      debugTitle,
      debugRoom,
      debugMouse,
      debugCounts,
      debugControls,
      zoneSelectionLabel,
      zoneFieldGrid,
      debugActions,
      debugStatus
    );
    chatForm.append(chatInput, chatButton);
    hud.append(roomTitle, statusPill, palette, gamesButton);
    sidePanel.append(hud, chatForm);
    world.append(mapImage, hotspotsLayer, portalsLayer, seatsLayer, entitiesLayer, behindLayer, debugLayer);
    entitiesLayer.append(localElement);
    viewport.append(world);
    root.append(viewport, sidePanel, debugPanel);
    mountNode.replaceChildren(root);

    function createPlayerElement(player, isLocal) {
      const element = createEl("div", `campus2d-player${isLocal ? " is-local" : ""}`);
      const bubble = createEl("span", "campus2d-chat-bubble");
      const avatar = createEl("button", "campus2d-avatar", {
        type: "button",
        role: "img",
        "aria-label": `${player.displayName || "Alpaca"} avatar card`,
        "data-campus2d-avatar": player.clientId
      });
      const name = createEl("span", "campus2d-name");
      avatar.style.backgroundImage = `url("${manifest.sprite.asset}")`;
      name.textContent = player.displayName || "Guest";
      element.append(bubble, avatar, name);
      element._campus2d = { bubble, avatar, name };
      updatePlayerElement(element, player, performance.now());
      return element;
    }

    function updatePlayerElement(element, player, nowMs) {
      const color = getColor(manifest, player.colorId);
      const frame = getFrame(player.direction);
      const avatar = element._campus2d?.avatar;
      element.style.transform = `translate(${player.x}px, ${player.y}px)`;
      element.style.zIndex = String(Math.round(player.y));
      element.style.setProperty("--campus2d-color", color.hex);
      element.style.setProperty("--campus2d-sprite-x", spritePercent(frame.col, manifest.sprite.columns));
      element.style.setProperty("--campus2d-sprite-y", spritePercent(frame.row, manifest.sprite.rows));
      element.style.setProperty("--campus2d-flip", String(frame.flip));
      element.style.setProperty("--campus2d-step-flip-scale", String(frame.flip * 0.985));
      if (avatar) {
        avatar.style.backgroundImage = `url("${color.asset || manifest.sprite.asset}")`;
        avatar.setAttribute("aria-label", `${player.displayName || "Alpaca"} avatar card`);
      }
      element.classList.toggle("is-moving", Boolean(player.moving) && !player.seatId);
      element.classList.toggle("is-sitting", Boolean(player.seatId) && !player.moving);
      if (element._campus2d?.name) {
        element._campus2d.name.textContent = player.displayName || "Guest";
      }
    }

    function setStatus(value) {
      statusPill.textContent = value;
      root.dataset.realtimeStatus = value.toLowerCase();
    }

    function getPlayerProfilePayload(player) {
      return {
        schoolName: player.schoolName || "",
        createdAt: player.createdAt || null
      };
    }

    function getZoneConfig(type = selectedZoneType) {
      return DEV_ZONE_CONFIG[type] || DEV_ZONE_CONFIG.blocked;
    }

    function getZoneRect(type, zone) {
      return type === "seat" || type === "portal" || type === "game" ? zone?.zone : zone;
    }

    function createZoneItem(type, rect, existing = {}) {
      const nextRect = cloneRect(rect, existing.id || `${room.id}-${type}`);
      if (type === "seat") {
        return {
          ...existing,
          id: nextRect.id,
          zone: nextRect,
          x: nextRect.x + (nextRect.width / 2),
          y: nextRect.y + (nextRect.height / 2)
        };
      }
      if (type === "portal") {
        const fallbackRoomId = room.id === manifest.defaultRoomId ? manifest.rooms[1]?.id : manifest.defaultRoomId;
        return {
          ...existing,
          id: nextRect.id,
          targetRoomId: existing.targetRoomId || fallbackRoomId || room.id,
          targetSpawnId: existing.targetSpawnId || room.id,
          zone: nextRect
        };
      }
      if (type === "game") {
        return {
          ...existing,
          id: nextRect.id,
          mode: existing.mode || existing.kind || "game",
          label: existing.label || "Game zone",
          zone: nextRect
        };
      }
      return { ...existing, ...nextRect };
    }

    function cloneZoneItem(type, zone, fallbackId) {
      return createZoneItem(type, cloneRect(getZoneRect(type, zone), zone?.id || fallbackId), zone || {});
    }

    function cloneZoneItems(type, zones = []) {
      return zones.map((zone, index) => cloneZoneItem(type, zone, `${room.id}-${type}-${index + 1}`));
    }

    function loadDevZoneData() {
      try {
        const parsed = JSON.parse(safeStorageGet(STORAGE_DEV_ZONES_KEY) || "{}");
        if (parsed && typeof parsed === "object") {
          return {
            schema: "wsc.campus2d.devZones.v1",
            rooms: parsed.rooms && typeof parsed.rooms === "object" ? parsed.rooms : {}
          };
        }
      } catch (_error) {}
      return { schema: "wsc.campus2d.devZones.v1", rooms: {} };
    }

    function getRoomBaseZones(targetRoom = room) {
      return {
        blockedZones: cloneZoneItems("blocked", targetRoom.blockedZones || []),
        seats: cloneZoneItems("seat", targetRoom.seats || []),
        behindZones: cloneZoneItems("behind", targetRoom.behindZones || []),
        portals: cloneZoneItems("portal", targetRoom.portals || []),
        gameZones: cloneZoneItems("game", targetRoom.gameZones || [])
      };
    }

    function normalizeRoomOverride(targetRoom, override = {}) {
      const base = getRoomBaseZones(targetRoom);
      return {
        blockedZones: cloneZoneItems("blocked", Array.isArray(override.blockedZones) ? override.blockedZones : base.blockedZones),
        seats: cloneZoneItems("seat", Array.isArray(override.seats) ? override.seats : base.seats),
        behindZones: cloneZoneItems("behind", Array.isArray(override.behindZones) ? override.behindZones : base.behindZones),
        portals: cloneZoneItems("portal", Array.isArray(override.portals) ? override.portals : base.portals),
        gameZones: cloneZoneItems("game", Array.isArray(override.gameZones) ? override.gameZones : base.gameZones)
      };
    }

    function getRoomOverride(roomId = room.id) {
      return devZoneData.rooms?.[roomId] || null;
    }

    function ensureRoomOverride(targetRoom = room) {
      if (!devZoneData.rooms) {
        devZoneData.rooms = {};
      }
      const normalized = normalizeRoomOverride(targetRoom, devZoneData.rooms[targetRoom.id]);
      devZoneData.rooms[targetRoom.id] = normalized;
      return normalized;
    }

    function getEffectiveZones(targetRoom = room) {
      const override = getRoomOverride(targetRoom.id);
      return override ? normalizeRoomOverride(targetRoom, override) : getRoomBaseZones(targetRoom);
    }

    function getEditableZones(type = selectedZoneType) {
      const override = ensureRoomOverride(room);
      const key = getZoneConfig(type).key;
      if (!Array.isArray(override[key])) {
        override[key] = [];
      }
      return override[key];
    }

    function getSelectedZone() {
      if (!selectedZoneId) {
        return null;
      }
      return getEditableZones(selectedZoneType).find((zone) => zone.id === selectedZoneId) || null;
    }

    function setDebugStatus(message) {
      debugStatusText = message || "";
      debugStatus.textContent = debugStatusText;
    }

    function saveDevZones(message = "Saved to localStorage") {
      devZoneData.schema = "wsc.campus2d.devZones.v1";
      devZoneData.updatedAt = new Date().toISOString();
      if (!Object.keys(devZoneData.rooms || {}).length) {
        safeStorageRemove(STORAGE_DEV_ZONES_KEY);
      } else {
        safeStorageSet(STORAGE_DEV_ZONES_KEY, JSON.stringify(devZoneData));
      }
      setDebugStatus(message);
    }

    function createZoneId(type) {
      const zones = getEditableZones(type);
      let index = zones.length + 1;
      let id = `${room.id}-${type}-${index}`;
      const ids = new Set(zones.map((zone) => zone.id));
      while (ids.has(id)) {
        index += 1;
        id = `${room.id}-${type}-${index}`;
      }
      return id;
    }

    function clampRectToRoom(rect) {
      const width = clamp(roundNumber(rect.width), MIN_DEV_ZONE_SIZE, room.width);
      const height = clamp(roundNumber(rect.height), MIN_DEV_ZONE_SIZE, room.height);
      return {
        id: rect.id,
        x: clamp(roundNumber(rect.x), 0, Math.max(0, room.width - width)),
        y: clamp(roundNumber(rect.y), 0, Math.max(0, room.height - height)),
        width,
        height
      };
    }

    function updateZoneItemRect(type, zone, rect) {
      const next = createZoneItem(type, clampRectToRoom({ ...getZoneRect(type, zone), ...rect }), zone);
      Object.keys(zone).forEach((key) => delete zone[key]);
      Object.assign(zone, next);
    }

    function buildDragRect(startPoint, endPoint) {
      const left = clamp(Math.min(startPoint.x, endPoint.x), 0, room.width);
      const top = clamp(Math.min(startPoint.y, endPoint.y), 0, room.height);
      const right = clamp(Math.max(startPoint.x, endPoint.x), 0, room.width);
      const bottom = clamp(Math.max(startPoint.y, endPoint.y), 0, room.height);
      return clampRectToRoom({
        x: left,
        y: top,
        width: Math.max(MIN_DEV_ZONE_SIZE, right - left),
        height: Math.max(MIN_DEV_ZONE_SIZE, bottom - top)
      });
    }

    function isResizeHandleHit(point, type, zone) {
      const rect = getZoneRect(type, zone);
      return Math.abs(point.x - (rect.x + rect.width)) <= 18 &&
        Math.abs(point.y - (rect.y + rect.height)) <= 18;
    }

    function findZoneAtPoint(point, type = selectedZoneType) {
      const zones = getEditableZones(type);
      for (let index = zones.length - 1; index >= 0; index -= 1) {
        if (isPointInRect(point, getZoneRect(type, zones[index]))) {
          return zones[index];
        }
      }
      return null;
    }

    function findAnyZoneAtPoint(point) {
      for (const type of ["game", "portal", "behind", "seat", "blocked"]) {
        const zone = findZoneAtPoint(point, type);
        if (zone) {
          return { type, zone };
        }
      }
      return null;
    }

    function getOffsetPasteRect(rect) {
      const maxX = Math.max(0, room.width - rect.width);
      const maxY = Math.max(0, room.height - rect.height);
      const x = rect.x + DEV_ZONE_PASTE_OFFSET <= maxX
        ? rect.x + DEV_ZONE_PASTE_OFFSET
        : Math.max(0, rect.x - DEV_ZONE_PASTE_OFFSET);
      const y = rect.y + DEV_ZONE_PASTE_OFFSET <= maxY
        ? rect.y + DEV_ZONE_PASTE_OFFSET
        : Math.max(0, rect.y - DEV_ZONE_PASTE_OFFSET);
      return {
        ...rect,
        x,
        y
      };
    }

    function formatRectForManifest(type, zone, indent = "        ") {
      const rect = getZoneRect(type, zone);
      if (type === "seat") {
        return `${indent}seat("${zone.id}", ${rect.x}, ${rect.y}, ${rect.width}, ${rect.height})`;
      }
      if (type === "portal") {
        return `${indent}portal("${zone.id}", "${zone.targetRoomId}", "${zone.targetSpawnId}", ${rect.x}, ${rect.y}, ${rect.width}, ${rect.height})`;
      }
      if (type === "game") {
        return `${indent}gameZone("${zone.id}", "${zone.mode || "game"}", "${zone.label || "Game zone"}", ${rect.x}, ${rect.y}, ${rect.width}, ${rect.height})`;
      }
      return `${indent}rect("${zone.id}", ${rect.x}, ${rect.y}, ${rect.width}, ${rect.height})`;
    }

    function buildManifestPatchText() {
      const zones = getEffectiveZones(room);
      return [
        `// ${room.title} (${room.id}) zone patch`,
        `// Paste these arrays into the ${room.id} room in app/src/features/campus-2d/manifest.js.`,
        "blockedZones: [",
        ...zones.blockedZones.map((zone, index) => `${formatRectForManifest("blocked", zone)}${index < zones.blockedZones.length - 1 ? "," : ""}`),
        "      ],",
        "behindZones: [",
        ...zones.behindZones.map((zone, index) => `${formatRectForManifest("behind", zone)}${index < zones.behindZones.length - 1 ? "," : ""}`),
        "      ],",
        "seats: [",
        ...zones.seats.map((zone, index) => `${formatRectForManifest("seat", zone)}${index < zones.seats.length - 1 ? "," : ""}`),
        "      ],",
        "portals: [",
        ...zones.portals.map((zone, index) => `${formatRectForManifest("portal", zone)}${index < zones.portals.length - 1 ? "," : ""}`),
        "      ],",
        "gameZones: [",
        ...zones.gameZones.map((zone, index) => `${formatRectForManifest("game", zone)}${index < zones.gameZones.length - 1 ? "," : ""}`),
        "      ]"
      ].join("\n");
    }

    function buildZoneExportPayload() {
      const zones = getEffectiveZones(room);
      return {
        schema: "wsc.campus2d.devZones.v1",
        roomId: room.id,
        title: room.title,
        ...zones,
        exportedAt: new Date().toISOString()
      };
    }

    async function copyText(text) {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        return;
      }
      const fallback = createEl("textarea", "");
      fallback.value = text;
      fallback.setAttribute("readonly", "");
      fallback.style.position = "fixed";
      fallback.style.left = "-9999px";
      document.body.append(fallback);
      fallback.select();
      document.execCommand("copy");
      fallback.remove();
    }

    function exportZoneJson() {
      const payload = JSON.stringify(buildZoneExportPayload(), null, 2);
      const blob = new Blob([payload], { type: "application/json" });
      const link = createEl("a", "");
      link.href = URL.createObjectURL(blob);
      link.download = `campus2d-${room.id}-zones.json`;
      document.body.append(link);
      link.click();
      URL.revokeObjectURL(link.href);
      link.remove();
      setDebugStatus("Exported JSON");
    }

    function renderPalette() {
      palette.replaceChildren(...manifest.colors.map((color) => {
        const button = createEl("button", "campus2d-color-swatch", {
          type: "button",
          title: color.label,
          "aria-label": color.label,
          "data-campus2d-color": color.id
        });
        button.style.setProperty("--swatch", color.swatch || color.hex);
        button.classList.toggle("is-active", color.id === localPlayer.colorId);
        return button;
      }));
    }

    function renderHotspots() {
      hotspotsLayer.replaceChildren(...getClickableGameZones().map((entry) => {
        const button = createEl("button", "campus2d-hotspot campus2d-game-zone", {
          type: "button",
          "data-campus2d-game-zone": entry.id,
          "data-campus2d-hotspot": entry.id,
          "aria-label": entry.label || entry.mode || "Game zone"
        });
        button.style.left = `${entry.zone.x}px`;
        button.style.top = `${entry.zone.y}px`;
        button.style.width = `${entry.zone.width}px`;
        button.style.height = `${entry.zone.height}px`;
        return button;
      }));
    }

    function getLegacyHotspotMode(hotspot) {
      if (hotspot.kind === "games") {
        return "game";
      }
      if (hotspot.kind === "lesson") {
        return "learn";
      }
      return hotspot.kind || "game";
    }

    function getClickableGameZones() {
      const zones = getEffectiveZones(room).gameZones || [];
      const ids = new Set(zones.map((zone) => zone.id));
      const legacyZones = (room.hotspots || [])
        .filter((hotspot) => !ids.has(hotspot.id))
        .map((hotspot) => createZoneItem("game", hotspot.zone, {
          id: hotspot.id,
          mode: getLegacyHotspotMode(hotspot),
          label: hotspot.label || "Game zone"
        }));
      return [...zones, ...legacyZones];
    }

    function activateGameZone(entry) {
      const mode = entry.mode || entry.kind || "game";
      if (mode === "game" || mode === "games") {
        openGameLauncher();
        return;
      }
      const handled = options.onCampusZoneAction?.({
        roomId: room.id,
        zoneId: entry.id,
        mode,
        label: entry.label || ""
      });
      if (!handled) {
        showBubble(localElement, `${entry.label || mode} coming soon`);
      }
    }

    function renderPortals() {
      const zones = getEffectiveZones(room);
      portalsLayer.replaceChildren(...zones.portals.map((entry) => {
        const targetRoom = getRoom(entry.targetRoomId);
        const button = createEl("button", "campus2d-portal", {
          type: "button",
          "data-campus2d-portal": entry.id,
          "aria-label": `Go to ${targetRoom?.title || entry.targetRoomId}`
        });
        button.style.left = `${entry.zone.x}px`;
        button.style.top = `${entry.zone.y}px`;
        button.style.width = `${entry.zone.width}px`;
        button.style.height = `${entry.zone.height}px`;
        return button;
      }));
    }

    function renderSeats() {
      const zones = getEffectiveZones(room);
      seatsLayer.replaceChildren(...zones.seats.map((seat) => {
        const button = createEl("button", "campus2d-seat", {
          type: "button",
          "data-campus2d-seat": seat.id,
          "aria-label": `Sit ${seat.id}`
        });
        button.style.left = `${seat.zone.x}px`;
        button.style.top = `${seat.zone.y}px`;
        button.style.width = `${seat.zone.width}px`;
        button.style.height = `${seat.zone.height}px`;
        return button;
      }));
    }

    function createDebugZone(rect, type, options = {}) {
      const zone = createEl("span", [
        "campus2d-debug-zone",
        `is-${type}`,
        options.editor ? "is-editor-zone" : "",
        options.selected ? "is-selected" : ""
      ].filter(Boolean).join(" "));
      zone.style.left = `${rect.x}px`;
      zone.style.top = `${rect.y}px`;
      zone.style.width = `${rect.width}px`;
      zone.style.height = `${rect.height}px`;
      if (options.id) {
        zone.dataset.campus2dZoneId = options.id;
        zone.title = options.id;
      }
      if (options.selected) {
        zone.append(createEl("span", "campus2d-debug-zone-handle"));
      }
      return zone;
    }

    function renderDebugOverlay() {
      if (!debugEnabled) {
        debugLayer.replaceChildren();
        return;
      }
      const activeZones = getEffectiveZones(room);
      const zones = [
        ...activeZones.blockedZones.map((zone) => createDebugZone(zone, "blocked", {
          editor: zoneEditorEnabled,
          id: zone.id,
          selected: selectedZoneType === "blocked" && zone.id === selectedZoneId
        })),
        ...activeZones.seats.map((seat) => createDebugZone(seat.zone, "seat", {
          editor: zoneEditorEnabled,
          id: seat.id,
          selected: selectedZoneType === "seat" && seat.id === selectedZoneId
        })),
        ...activeZones.behindZones.map((zone) => createDebugZone(zone, "behind", {
          editor: zoneEditorEnabled,
          id: zone.id,
          selected: selectedZoneType === "behind" && zone.id === selectedZoneId
        })),
        ...activeZones.portals.map((entry) => createDebugZone(entry.zone, "portal", {
          editor: zoneEditorEnabled,
          id: entry.id,
          selected: selectedZoneType === "portal" && entry.id === selectedZoneId
        })),
        ...activeZones.gameZones.map((entry) => createDebugZone(entry.zone, "game", {
          editor: zoneEditorEnabled,
          id: entry.id,
          selected: selectedZoneType === "game" && entry.id === selectedZoneId
        }))
      ];
      debugLayer.replaceChildren(...zones);
    }

    function renderDebugControls() {
      const selectedZone = getSelectedZone();
      const selectedRect = selectedZone ? getZoneRect(selectedZoneType, selectedZone) : null;
      zoneTypeSelect.value = selectedZoneType;
      zoneFieldGrid.hidden = !zoneEditorEnabled;
      debugActions.hidden = !zoneEditorEnabled;
      zoneSelectionLabel.hidden = !zoneEditorEnabled;
      zoneTypeSelect.disabled = !zoneEditorEnabled;
      if (!zoneEditorEnabled) {
        zoneSelectionLabel.textContent = "Zone editor off";
      } else {
        zoneSelectionLabel.textContent = selectedZone
          ? `${getZoneConfig(selectedZoneType).label} ${selectedZone.id}`
          : `Drag to create ${getZoneConfig(selectedZoneType).label}`;
      }
      DEV_ZONE_FIELDS.forEach((field) => {
        const input = zoneFieldInputs[field];
        input.disabled = !zoneEditorEnabled || !selectedRect;
        input.value = selectedRect ? selectedRect[field] : "";
        input.max = field === "x" || field === "width" ? room.width : room.height;
      });
      deleteZoneButton.disabled = !zoneEditorEnabled || !selectedZone;
      copySelectedButton.disabled = !zoneEditorEnabled || !selectedZone;
      pasteZoneButton.disabled = !zoneEditorEnabled || !copiedZone;
      saveZonesButton.disabled = !zoneEditorEnabled;
      copyPatchButton.disabled = false;
      exportJsonButton.disabled = false;
      debugStatus.textContent = debugStatusText;
    }

    function updateDebugPanel() {
      if (!debugEnabled) {
        return;
      }
      const activeZones = getEffectiveZones(room);
      const mouse = debugMousePoint
        ? (() => {
          const walkability = getWalkability(room, debugMousePoint, activeZones);
          const status = !walkability.inBounds
            ? "outside map"
            : (walkability.inBlockedZone
              ? "blocked"
              : (walkability.inSeat ? "sitting zone" : "walkable"));
          return `Mouse x ${Math.round(debugMousePoint.x)}, y ${Math.round(debugMousePoint.y)} - ${status}`;
        })()
        : "Mouse outside map";
      debugRoom.textContent = `Room ${room.title}`;
      debugMouse.textContent = mouse;
      debugCounts.textContent = [
        "whole image walkable",
        `pink blocked ${activeZones.blockedZones.length}`,
        `yellow ${activeZones.seats.length}`,
        `blue ${activeZones.portals.length}`,
        `orange game ${activeZones.gameZones.length}`,
        `purple behind ${activeZones.behindZones.length}`
      ].join(" / ");
      renderDebugControls();
    }

    function setDebugEnabled(value) {
      debugEnabled = Boolean(value);
      zoneEditorEnabled = debugEnabled;
      activeTarget = null;
      keys.clear();
      localPlayer.moving = false;
      if (debugEnabled) {
        ensureRoomOverride(room);
        closePlayerCard();
        closeGameLauncher();
        setDebugStatus("Zone editor ready");
      } else {
        zoneEditGesture = null;
        selectedZoneId = null;
      }
      updatePlayerElement(localElement, localPlayer, performance.now());
      root.classList.toggle("is-debug", debugEnabled);
      root.classList.toggle("is-zone-editing", debugEnabled && zoneEditorEnabled);
      debugPanel.hidden = !debugEnabled;
      renderDebugOverlay();
      updateDebugPanel();
    }

    function setZoneEditorEnabled(value) {
      zoneEditorEnabled = Boolean(value);
      if (zoneEditorEnabled) {
        ensureRoomOverride(room);
        setDebugStatus("Zone editor ready");
      } else {
        selectedZoneId = null;
        zoneEditGesture = null;
      }
      root.classList.toggle("is-zone-editing", debugEnabled && zoneEditorEnabled);
      renderDebugOverlay();
      updateDebugPanel();
    }

    function renderBehindZones() {
      const zones = getEffectiveZones(room);
      behindLayer.replaceChildren(...zones.behindZones.map((zone) => {
        const overlay = createEl("span", "campus2d-behind-zone", { "aria-hidden": "true" });
        overlay.style.left = `${zone.x}px`;
        overlay.style.top = `${zone.y}px`;
        overlay.style.width = `${zone.width}px`;
        overlay.style.height = `${zone.height}px`;
        overlay.style.backgroundImage = `url("${room.asset}")`;
        overlay.style.backgroundSize = `${room.width}px ${room.height}px`;
        overlay.style.backgroundPosition = `-${zone.x}px -${zone.y}px`;
        return overlay;
      }));
    }

    function renderRoom() {
      roomTitle.textContent = room.title;
      mapImage.src = room.asset;
      world.style.width = `${room.width}px`;
      world.style.height = `${room.height}px`;
      mapImage.width = room.width;
      mapImage.height = room.height;
      safeStorageSet(STORAGE_ROOM_KEY, room.id);
      renderPalette();
      renderHotspots();
      renderPortals();
      renderSeats();
      renderBehindZones();
      renderDebugOverlay();
      updateDebugPanel();
      updatePlayerElement(localElement, localPlayer, performance.now());
      renderRemotePlayers();
      updateCamera();
    }

    function screenToWorld(clientX, clientY) {
      const rect = viewport.getBoundingClientRect();
      return {
        x: (clientX - rect.left - camera.x) / camera.scale,
        y: (clientY - rect.top - camera.y) / camera.scale
      };
    }

    function updateCamera() {
      const width = viewport.clientWidth || 1;
      const height = viewport.clientHeight || 1;
      const fitScale = Math.min(width / room.width, height / room.height);
      const targetScale = width < 720 ? 0.76 : 0.86;
      camera.scale = clamp(Math.max(fitScale, targetScale), fitScale, 1);
      const worldWidth = room.width * camera.scale;
      const worldHeight = room.height * camera.scale;
      const minX = Math.min(0, width - worldWidth);
      const minY = Math.min(0, height - worldHeight);
      camera.x = worldWidth <= width
        ? (width - worldWidth) / 2
        : clamp((width / 2) - (localPlayer.x * camera.scale), minX, 0);
      camera.y = worldHeight <= height
        ? (height - worldHeight) / 2
        : clamp((height / 2) - (localPlayer.y * camera.scale), minY, 0);
      world.style.transform = `translate(${camera.x}px, ${camera.y}px) scale(${camera.scale})`;
    }

    function setRoom(roomId, spawnId = "default") {
      const nextRoom = getRoom(roomId);
      if (!nextRoom) {
        return;
      }
      room = nextRoom;
      const nextSpawn = room.spawnPoints[spawnId] || room.spawnPoints.default;
      localPlayer.roomId = room.id;
      localPlayer.x = nextSpawn.x;
      localPlayer.y = nextSpawn.y;
      localPlayer.direction = "down";
      localPlayer.moving = false;
      localPlayer.seatId = null;
      activeTarget = null;
      selectedZoneId = null;
      zoneEditGesture = null;
      debugMousePoint = null;
      remotePlayers.clear();
      renderRoom();
      connectRealtime();
      publishPresence(true);
    }

    function getKeyboardVector() {
      return {
        x: (keys.has("ArrowRight") ? 1 : 0) - (keys.has("ArrowLeft") ? 1 : 0),
        y: (keys.has("ArrowDown") ? 1 : 0) - (keys.has("ArrowUp") ? 1 : 0)
      };
    }

    function getPlayerPoint(player) {
      const x = Number(player?.x);
      const y = Number(player?.y);
      if (!Number.isFinite(x) || !Number.isFinite(y)) {
        return null;
      }
      return { x, y };
    }

    function isPointBlockedByPlayers(point, originPoint = null) {
      for (const player of remotePlayers.values()) {
        if (player.roomId && player.roomId !== room.id) {
          continue;
        }
        const playerPoint = getPlayerPoint(player);
        if (!playerPoint) {
          continue;
        }
        const nextDistance = getPointDistance(point, playerPoint);
        if (nextDistance >= ALPACA_COLLISION_DISTANCE) {
          continue;
        }
        if (originPoint) {
          const currentDistance = getPointDistance(originPoint, playerPoint);
          if (currentDistance < ALPACA_COLLISION_DISTANCE && nextDistance > currentDistance + 0.5) {
            continue;
          }
        }
        return true;
      }
      return false;
    }

    function canPlayerStandAt(point, zones = getEffectiveZones(room), originPoint = null) {
      return isWalkable(room, point, zones) && !isPointBlockedByPlayers(point, originPoint);
    }

    function getSeatOccupant(seat) {
      const seatPoint = { x: seat.x, y: seat.y };
      for (const player of remotePlayers.values()) {
        if (player.roomId && player.roomId !== room.id) {
          continue;
        }
        if (player.seatId === seat.id) {
          return player;
        }
        const playerPoint = getPlayerPoint(player);
        if (playerPoint && getPointDistance(seatPoint, playerPoint) < ALPACA_COLLISION_DISTANCE) {
          return player;
        }
      }
      return null;
    }

    function sitAtSeat(seat, nowMs = performance.now()) {
      const occupant = getSeatOccupant(seat);
      if (occupant) {
        activeTarget = null;
        showBubble(localElement, `${occupant.displayName || "Someone"} is sitting there`);
        return;
      }
      localPlayer.x = seat.x;
      localPlayer.y = seat.y;
      localPlayer.direction = seat.direction || "down";
      localPlayer.moving = false;
      localPlayer.seatId = seat.id;
      activeTarget = null;
      updatePlayerElement(localElement, localPlayer, nowMs);
      updateCamera();
      publishMovement(true);
    }

    function stepMovement(deltaSeconds, nowMs) {
      if (debugEnabled) {
        activeTarget = null;
        localPlayer.moving = false;
        updatePlayerElement(localElement, localPlayer, nowMs);
        return;
      }
      const keyboardVector = getKeyboardVector();
      let vector = keyboardVector;
      if (!vector.x && !vector.y && activeTarget) {
        const dx = activeTarget.x - localPlayer.x;
        const dy = activeTarget.y - localPlayer.y;
        const distance = Math.hypot(dx, dy);
        if (distance <= MOVE_EPSILON) {
          activeTarget = null;
          vector = { x: 0, y: 0 };
        } else {
          vector = { x: dx / distance, y: dy / distance };
        }
      } else if (vector.x || vector.y) {
        activeTarget = null;
      }

      const length = Math.hypot(vector.x, vector.y);
      if (!length) {
        localPlayer.moving = false;
        updatePlayerElement(localElement, localPlayer, nowMs);
        return;
      }

      if (keyboardVector.x || keyboardVector.y) {
        localPlayer.seatId = null;
      }

      const normalized = { x: vector.x / length, y: vector.y / length };
      const distance = MOVE_SPEED * deltaSeconds;
      const nextX = localPlayer.x + normalized.x * distance;
      const nextY = localPlayer.y + normalized.y * distance;
      const nextPoint = {
        x: clamp(nextX, 0, room.width),
        y: clamp(nextY, 0, room.height)
      };
      const currentPoint = { x: localPlayer.x, y: localPlayer.y };
      const activeZones = getEffectiveZones(room);
      if (canPlayerStandAt(nextPoint, activeZones, currentPoint)) {
        localPlayer.x = nextPoint.x;
        localPlayer.y = nextPoint.y;
      } else if (canPlayerStandAt({ x: nextPoint.x, y: localPlayer.y }, activeZones, currentPoint)) {
        localPlayer.x = nextPoint.x;
      } else if (canPlayerStandAt({ x: localPlayer.x, y: nextPoint.y }, activeZones, currentPoint)) {
        localPlayer.y = nextPoint.y;
      } else {
        activeTarget = null;
      }

      localPlayer.direction = normalizeDirection(normalized, localPlayer.direction);
      localPlayer.moving = getPointDistance(currentPoint, localPlayer) > 0.01;
      updatePlayerElement(localElement, localPlayer, nowMs);
      updateCamera();
      publishMovement(false);
    }

    function loop(nowMs) {
      if (destroyed) {
        return;
      }
      const deltaSeconds = Math.min(0.05, Math.max(0, (nowMs - lastFrameAt) / 1000));
      lastFrameAt = nowMs;
      stepMovement(deltaSeconds, nowMs);
      remotePlayers.forEach((player, clientId) => {
        const element = remoteElements.get(clientId);
        if (element) {
          updatePlayerElement(element, player, nowMs);
        }
      });
      animationFrameId = window.requestAnimationFrame(loop);
    }

    function publishPresence(force) {
      if (!channel) {
        return;
      }
      const nowMs = Date.now();
      if (!force && nowMs - lastPresenceSentAt < 750) {
        return;
      }
      lastPresenceSentAt = nowMs;
      channel.updatePresence({
        x: localPlayer.x,
        y: localPlayer.y,
        direction: localPlayer.direction,
        colorId: localPlayer.colorId,
        displayName: localPlayer.displayName,
        roomId: room.id,
        seatId: localPlayer.seatId || null,
        ...getPlayerProfilePayload(localPlayer)
      });
    }

    function publishMovement(force) {
      if (!channel) {
        return;
      }
      const nowMs = Date.now();
      if (force || nowMs - lastMoveSentAt > 120) {
        lastMoveSentAt = nowMs;
        channel.sendMovement({
          x: localPlayer.x,
          y: localPlayer.y,
          direction: localPlayer.direction,
          colorId: localPlayer.colorId,
          displayName: localPlayer.displayName,
          seatId: localPlayer.seatId || null,
          ...getPlayerProfilePayload(localPlayer)
        });
      }
      publishPresence(force);
    }

    function connectRealtime() {
      if (channel) {
        channel.destroy();
        channel = null;
      }
      if (!options.client || !realtimeApi?.createRoomChannel) {
        setStatus("Local");
        return;
      }
      setStatus("Connecting");
      channel = realtimeApi.createRoomChannel({
        client: options.client,
        roomId: room.id,
        localPlayer,
        handlers: {
          onStatus(status) {
            setStatus(status === "SUBSCRIBED" ? "Online" : "Connecting");
          },
          onPresenceSync(presenceRows) {
            syncRemotePresence(presenceRows);
          },
          onMove(payload) {
            receiveRemoteMovement(payload);
          },
          onChat(payload) {
            receiveRemoteChat(payload);
          },
          onAvatar(payload) {
            receiveRemoteMovement(payload);
          }
        }
      });
      if (!channel) {
        setStatus("Local");
        return;
      }
      channel.subscribe();
    }

    function syncRemotePresence(presenceRows) {
      const seen = new Set();
      presenceRows
        .filter((presence) => presence.roomId === room.id)
        .forEach((presence) => {
          seen.add(presence.clientId);
          remotePlayers.set(presence.clientId, {
            clientId: presence.clientId,
            userId: presence.userId || null,
            displayName: presence.displayName || "Guest",
            roomId: room.id,
            x: Number(presence.x) || 0,
            y: Number(presence.y) || 0,
            direction: presence.direction || "down",
            colorId: presence.colorId || manifest.colors[0].id,
            seatId: presence.seatId || null,
            schoolName: presence.schoolName || "",
            createdAt: presence.createdAt || null,
            moving: false
          });
        });
      [...remotePlayers.keys()].forEach((clientId) => {
        if (!seen.has(clientId)) {
          remotePlayers.delete(clientId);
          remoteElements.get(clientId)?.remove();
          remoteElements.delete(clientId);
        }
      });
      renderRemotePlayers();
    }

    function receiveRemoteMovement(payload) {
      if (!payload || payload.clientId === localPlayer.clientId || payload.roomId !== room.id) {
        return;
      }
      const previous = remotePlayers.get(payload.clientId) || {};
      const next = {
        clientId: payload.clientId,
        userId: payload.userId || previous.userId || null,
        displayName: payload.displayName || previous.displayName || "Guest",
        roomId: room.id,
        x: Number(payload.x) || Number(previous.x) || 0,
        y: Number(payload.y) || Number(previous.y) || 0,
        direction: payload.direction || previous.direction || "down",
        colorId: payload.colorId || previous.colorId || manifest.colors[0].id,
        seatId: payload.seatId || previous.seatId || null,
        schoolName: payload.schoolName || previous.schoolName || "",
        createdAt: payload.createdAt || previous.createdAt || null,
        moving: Boolean(previous.x !== payload.x || previous.y !== payload.y)
      };
      remotePlayers.set(payload.clientId, next);
      renderRemotePlayers();
    }

    function receiveRemoteChat(payload) {
      if (!payload || payload.clientId === localPlayer.clientId || payload.roomId !== room.id) {
        return;
      }
      receiveRemoteMovement(payload);
      const target = remoteElements.get(payload.clientId);
      if (target) {
        showBubble(target, payload.message || "");
      }
    }

    function renderRemotePlayers() {
      remotePlayers.forEach((player, clientId) => {
        let element = remoteElements.get(clientId);
        if (!element) {
          element = createPlayerElement(player, false);
          remoteElements.set(clientId, element);
          entitiesLayer.append(element);
        }
        updatePlayerElement(element, player, performance.now());
      });
    }

    function closePlayerCard() {
      root.querySelector("[data-campus2d-id-card]")?.remove();
    }

    function getPlayerByClientId(clientId) {
      if (clientId === localPlayer.clientId) {
        return localPlayer;
      }
      return remotePlayers.get(clientId) || null;
    }

    function applyAvatarPreview(element, player) {
      const color = getColor(manifest, player.colorId);
      const frame = getFrame(player.direction);
      element.style.backgroundImage = `url("${color.asset || manifest.sprite.asset}")`;
      element.style.setProperty("--campus2d-sprite-x", spritePercent(frame.col, manifest.sprite.columns));
      element.style.setProperty("--campus2d-sprite-y", spritePercent(frame.row, manifest.sprite.rows));
      element.style.setProperty("--campus2d-flip", String(frame.flip));
    }

    function createIdCardField(label, value) {
      const row = createEl("div", "campus2d-id-field");
      const labelElement = createEl("span", "campus2d-id-label");
      const valueElement = createEl("strong", "campus2d-id-value");
      labelElement.textContent = label;
      valueElement.textContent = value || "Unknown";
      row.append(labelElement, valueElement);
      return row;
    }

    function openPlayerCard(player) {
      if (!player) {
        return;
      }
      closeGameLauncher();
      closePlayerCard();
      const layer = createEl("div", "campus2d-id-layer", {
        "data-campus2d-id-card": "",
        "data-campus2d-ui": ""
      });
      const card = createEl("section", "campus2d-id-card", {
        role: "dialog",
        "aria-modal": "true",
        "aria-label": "Alpaca ID card"
      });
      const preview = createEl("span", "campus2d-id-avatar", { "aria-hidden": "true" });
      const details = createEl("div", "campus2d-id-details");
      const header = createEl("div", "campus2d-id-header");
      const eyebrow = createEl("span", "campus2d-id-eyebrow");
      const closeButton = createEl("button", "campus2d-id-close", {
        type: "button",
        "aria-label": "Close alpaca ID card",
        "data-campus2d-id-close": ""
      });

      eyebrow.textContent = "Alpaca ID";
      closeButton.textContent = "Close";
      header.append(eyebrow, closeButton);
      details.append(
        header,
        createIdCardField("Name", player.displayName || "Guest"),
        createIdCardField("School", player.schoolName || "Unknown school"),
        createIdCardField("Account age", formatAccountAge(player.createdAt))
      );
      applyAvatarPreview(preview, player);
      card.append(preview, details);
      layer.append(card);
      root.append(layer);
      closeButton.focus({ preventScroll: true });
    }

    function showBubble(playerElement, message) {
      const text = String(message || "").trim().slice(0, 140);
      const bubble = playerElement?._campus2d?.bubble;
      if (!bubble || !text) {
        return;
      }
      bubble.textContent = text;
      bubble.classList.add("is-visible");
      window.setTimeout(() => {
        if (bubble.textContent === text) {
          bubble.classList.remove("is-visible");
          bubble.textContent = "";
        }
      }, CHAT_TTL_MS);
    }

    function sendChat(message) {
      const text = String(message || "").trim().slice(0, 140);
      if (!text) {
        return;
      }
      showBubble(localElement, text);
      channel?.sendChat({
        x: localPlayer.x,
        y: localPlayer.y,
        direction: localPlayer.direction,
        colorId: localPlayer.colorId,
        displayName: localPlayer.displayName,
        seatId: localPlayer.seatId || null,
        ...getPlayerProfilePayload(localPlayer),
        message: text
      });
      publishPresence(true);
    }

    function openGameLauncher() {
      closeGameLauncher();
      const overlay = createEl("div", "campus2d-popup-layer", { "data-campus2d-popup": "", "data-campus2d-ui": "" });
      const dialog = createEl("section", "campus2d-popup", {
        role: "dialog",
        "aria-modal": "true",
        "aria-label": "Choose a live game"
      });
      const header = createEl("header", "campus2d-popup-header");
      const title = createEl("h2", "");
      const closeButton = createEl("button", "campus2d-popup-close", {
        type: "button",
        "aria-label": "Close games",
        "data-campus2d-popup-close": ""
      });
      const body = createEl("div", "campus2d-popup-body");
      title.textContent = "Alpaca Online";
      closeButton.textContent = "Close";
      header.append(title, closeButton);
      const html = typeof options.getGameLauncherHtml === "function" ? options.getGameLauncherHtml() : "";
      if (html) {
        const range = document.createRange();
        range.selectNode(document.body);
        body.replaceChildren(range.createContextualFragment(html));
      }
      body.addEventListener("click", (event) => {
        const choice = event.target.closest("[data-online-game-choice]");
        if (!choice) {
          return;
        }
        event.preventDefault();
        event.stopPropagation();
        closeGameLauncher();
        options.onGameChoice?.(choice.dataset.onlineGameChoice);
      });
      dialog.append(header, body);
      overlay.append(dialog);
      root.append(overlay);
      closeButton.focus({ preventScroll: true });
    }

    function closeGameLauncher() {
      root.querySelector("[data-campus2d-popup]")?.remove();
    }

    function clampPointToRoom(point) {
      return {
        x: clamp(point.x, 0, room.width),
        y: clamp(point.y, 0, room.height)
      };
    }

    function updateZoneFromGesture(point) {
      if (!zoneEditGesture) {
        return;
      }
      const zone = getEditableZones(zoneEditGesture.type).find((entry) => entry.id === zoneEditGesture.zoneId);
      if (!zone) {
        return;
      }
      const current = clampPointToRoom(point);
      const dx = current.x - zoneEditGesture.startPoint.x;
      const dy = current.y - zoneEditGesture.startPoint.y;
      const startRect = zoneEditGesture.startRect;
      if (zoneEditGesture.mode === "move") {
        updateZoneItemRect(zoneEditGesture.type, zone, {
          x: startRect.x + dx,
          y: startRect.y + dy,
          width: startRect.width,
          height: startRect.height
        });
      } else if (zoneEditGesture.mode === "resize") {
        updateZoneItemRect(zoneEditGesture.type, zone, {
          x: startRect.x,
          y: startRect.y,
          width: startRect.width + dx,
          height: startRect.height + dy
        });
      } else {
        updateZoneItemRect(zoneEditGesture.type, zone, buildDragRect(zoneEditGesture.startPoint, current));
      }
      renderRoom();
    }

    function handleZoneEditorPointerDown(event) {
      event.preventDefault();
      closePlayerCard();
      closeGameLauncher();
      ensureRoomOverride(room);
      const point = clampPointToRoom(screenToWorld(event.clientX, event.clientY));
      const hit = findAnyZoneAtPoint(point);
      if (hit) {
        const hitRect = getZoneRect(hit.type, hit.zone);
        selectedZoneType = hit.type;
        selectedZoneId = hit.zone.id;
        zoneEditGesture = {
          pointerId: event.pointerId,
          type: hit.type,
          zoneId: hit.zone.id,
          mode: isResizeHandleHit(point, hit.type, hit.zone) ? "resize" : "move",
          startPoint: point,
          startRect: { ...hitRect }
        };
      } else {
        const rect = clampRectToRoom({
          id: createZoneId(selectedZoneType),
          x: point.x,
          y: point.y,
          width: MIN_DEV_ZONE_SIZE,
          height: MIN_DEV_ZONE_SIZE
        });
        const zone = createZoneItem(selectedZoneType, rect);
        getEditableZones(selectedZoneType).push(zone);
        selectedZoneId = zone.id;
        zoneEditGesture = {
          pointerId: event.pointerId,
          type: selectedZoneType,
          zoneId: zone.id,
          mode: "create",
          startPoint: point,
          startRect: { ...rect }
        };
      }
      viewport.setPointerCapture?.(event.pointerId);
      renderRoom();
    }

    function handleZoneEditorPointerUp(event) {
      if (!zoneEditGesture || zoneEditGesture.pointerId !== event.pointerId) {
        return;
      }
      updateZoneFromGesture(screenToWorld(event.clientX, event.clientY));
      zoneEditGesture = null;
      viewport.releasePointerCapture?.(event.pointerId);
      saveDevZones("Saved locally");
      renderRoom();
    }

    function deleteSelectedZone() {
      const zones = getEditableZones(selectedZoneType);
      const index = zones.findIndex((zone) => zone.id === selectedZoneId);
      if (index < 0) {
        return;
      }
      zones.splice(index, 1);
      selectedZoneId = null;
      saveDevZones("Deleted zone");
      renderRoom();
    }

    function copySelectedZone() {
      const zone = getSelectedZone();
      if (!zone) {
        return;
      }
      copiedZone = {
        type: selectedZoneType,
        zone: cloneZoneItem(selectedZoneType, zone)
      };
      setDebugStatus("Copied selected zone");
      updateDebugPanel();
    }

    function pasteCopiedZone() {
      if (!copiedZone) {
        return;
      }
      const type = copiedZone.type;
      const sourceRect = getZoneRect(type, copiedZone.zone);
      const rect = clampRectToRoom({
        ...getOffsetPasteRect(sourceRect),
        id: createZoneId(type)
      });
      const zone = createZoneItem(type, rect, copiedZone.zone);
      getEditableZones(type).push(zone);
      selectedZoneType = type;
      selectedZoneId = zone.id;
      saveDevZones("Pasted zone");
      renderRoom();
    }

    function applySelectedZoneField(field, rawValue) {
      const zone = getSelectedZone();
      if (!zone) {
        return;
      }
      const value = roundNumber(rawValue);
      updateZoneItemRect(selectedZoneType, zone, { ...getZoneRect(selectedZoneType, zone), [field]: value });
      saveDevZones("Saved locally");
      renderRoom();
    }

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        if (zoneEditGesture) {
          zoneEditGesture = null;
          renderRoom();
          return;
        }
        closePlayerCard();
        closeGameLauncher();
        return;
      }
      if (event.key?.toLowerCase() === "d") {
        if (isTextEntryTarget(event.target)) {
          return;
        }
        event.preventDefault();
        setDebugEnabled(!debugEnabled);
        return;
      }
      if (!["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.key)) {
        return;
      }
      if (debugEnabled) {
        event.preventDefault();
        return;
      }
      if (root.querySelector("[data-campus2d-popup]")) {
        return;
      }
      if (isTextEntryTarget(event.target)) {
        return;
      }
      event.preventDefault();
      keys.add(event.key);
    }

    function handleKeyUp(event) {
      if (keys.delete(event.key)) {
        event.preventDefault();
      }
    }

    function handlePointerDown(event) {
      if (debugEnabled) {
        if (!event.target.closest("[data-campus2d-ui]") && zoneEditorEnabled) {
          handleZoneEditorPointerDown(event);
        }
        return;
      }
      if (event.target.closest("[data-campus2d-ui], [data-campus2d-avatar], [data-campus2d-hotspot], [data-campus2d-seat], [data-campus2d-portal]")) {
        return;
      }
      const point = screenToWorld(event.clientX, event.clientY);
      if (canPlayerStandAt(point, getEffectiveZones(room))) {
        localPlayer.seatId = null;
        activeTarget = point;
      }
    }

    function handlePointerMove(event) {
      const point = screenToWorld(event.clientX, event.clientY);
      if (zoneEditGesture && zoneEditGesture.pointerId === event.pointerId) {
        event.preventDefault();
        updateZoneFromGesture(point);
        return;
      }
      if (!debugEnabled) {
        return;
      }
      debugMousePoint = {
        x: clamp(point.x, 0, room.width),
        y: clamp(point.y, 0, room.height)
      };
      updateDebugPanel();
    }

    function handlePointerUp(event) {
      handleZoneEditorPointerUp(event);
    }

    function handleRootClick(event) {
      if (debugEnabled) {
        if (!debugPanel.contains(event.target)) {
          event.preventDefault();
          event.stopPropagation();
        }
        return;
      }

      const avatarButton = event.target.closest("[data-campus2d-avatar]");
      if (avatarButton) {
        openPlayerCard(getPlayerByClientId(avatarButton.dataset.campus2dAvatar));
        return;
      }

      if (event.target.closest("[data-campus2d-id-close]") || event.target.matches("[data-campus2d-id-card]")) {
        closePlayerCard();
        return;
      }

      const colorButton = event.target.closest("[data-campus2d-color]");
      if (colorButton) {
        const colorId = colorButton.dataset.campus2dColor;
        if (colorIds.has(colorId)) {
          localPlayer.colorId = colorId;
          safeStorageSet(STORAGE_COLOR_KEY, colorId);
          renderPalette();
          updatePlayerElement(localElement, localPlayer, performance.now());
          channel?.sendAvatar({
            x: localPlayer.x,
            y: localPlayer.y,
            direction: localPlayer.direction,
            colorId,
            displayName: localPlayer.displayName,
            ...getPlayerProfilePayload(localPlayer)
          });
          publishPresence(true);
        }
        return;
      }

      const portalButton = event.target.closest("[data-campus2d-portal]");
      if (portalButton) {
        const portal = getEffectiveZones(room).portals.find((entry) => entry.id === portalButton.dataset.campus2dPortal);
        if (portal) {
          localPlayer.seatId = null;
          activeTarget = null;
          setRoom(portal.targetRoomId, portal.targetSpawnId);
        }
        return;
      }

      const seatButton = event.target.closest("[data-campus2d-seat]");
      if (seatButton) {
        const seat = getEffectiveZones(room).seats.find((entry) => entry.id === seatButton.dataset.campus2dSeat);
        if (seat) {
          sitAtSeat(seat);
        }
        return;
      }

      if (event.target.closest(".campus2d-games-button")) {
        openGameLauncher();
        return;
      }

      if (event.target.closest("[data-campus2d-popup-close]") || event.target.matches("[data-campus2d-popup]")) {
        closeGameLauncher();
        return;
      }

      const gameZoneButton = event.target.closest("[data-campus2d-game-zone]");
      if (gameZoneButton) {
        const gameZone = getClickableGameZones().find((entry) => entry.id === gameZoneButton.dataset.campus2dGameZone);
        if (gameZone) {
          activateGameZone(gameZone);
        }
        return;
      }

      const hotspotButton = event.target.closest("[data-campus2d-hotspot]");
      if (hotspotButton) {
        const hotspot = (room.hotspots || []).find((entry) => entry.id === hotspotButton.dataset.campus2dHotspot);
        if (hotspot?.kind === "games") {
          openGameLauncher();
        } else if (hotspot) {
          showBubble(localElement, `${hotspot.label} coming soon`);
        }
      }
    }

    function handleZoneTypeChange() {
      selectedZoneType = DEV_ZONE_TYPES.includes(zoneTypeSelect.value) ? zoneTypeSelect.value : "blocked";
      selectedZoneId = null;
      renderDebugOverlay();
      updateDebugPanel();
    }

    async function handleCopyPatch() {
      try {
        await copyText(buildManifestPatchText());
        setDebugStatus("Copied manifest patch");
      } catch (_error) {
        setDebugStatus("Copy failed");
      }
    }

    function handleChatSubmit(event) {
      event.preventDefault();
      sendChat(chatInput.value);
      chatInput.value = "";
      chatInput.focus({ preventScroll: true });
    }

    function setIdentity(nextIdentity = {}) {
      localPlayer.userId = nextIdentity.userId || null;
      localPlayer.displayName = nextIdentity.displayName || "Guest";
      localPlayer.schoolName = nextIdentity.schoolName || "";
      localPlayer.createdAt = nextIdentity.createdAt || null;
      updatePlayerElement(localElement, localPlayer, performance.now());
      publishPresence(true);
    }

    renderRoom();
    root.focus({ preventScroll: true });
    connectRealtime();
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("resize", updateCamera);
    viewport.addEventListener("pointerdown", handlePointerDown);
    viewport.addEventListener("pointermove", handlePointerMove);
    viewport.addEventListener("pointerup", handlePointerUp);
    viewport.addEventListener("pointercancel", handlePointerUp);
    root.addEventListener("click", handleRootClick);
    chatForm.addEventListener("submit", handleChatSubmit);
    zoneTypeSelect.addEventListener("change", handleZoneTypeChange);
    DEV_ZONE_FIELDS.forEach((field) => {
      zoneFieldInputs[field].addEventListener("change", (event) => {
        applySelectedZoneField(field, event.target.value);
      });
    });
    deleteZoneButton.addEventListener("click", deleteSelectedZone);
    copySelectedButton.addEventListener("click", copySelectedZone);
    pasteZoneButton.addEventListener("click", pasteCopiedZone);
    saveZonesButton.addEventListener("click", () => saveDevZones("Saved locally"));
    copyPatchButton.addEventListener("click", handleCopyPatch);
    exportJsonButton.addEventListener("click", exportZoneJson);
    animationFrameId = window.requestAnimationFrame(loop);

    return {
      destroy() {
        destroyed = true;
        window.cancelAnimationFrame(animationFrameId);
        window.removeEventListener("keydown", handleKeyDown);
        window.removeEventListener("keyup", handleKeyUp);
        window.removeEventListener("resize", updateCamera);
        viewport.removeEventListener("pointerdown", handlePointerDown);
        viewport.removeEventListener("pointermove", handlePointerMove);
        viewport.removeEventListener("pointerup", handlePointerUp);
        viewport.removeEventListener("pointercancel", handlePointerUp);
        channel?.destroy();
        mountNode.replaceChildren();
      },
      setIdentity,
      setRoom,
      openGameLauncher
    };
  }

  window.WSC_CAMPUS_2D = Object.freeze({ mount });
}());

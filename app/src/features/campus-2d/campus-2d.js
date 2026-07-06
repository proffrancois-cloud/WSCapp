(function () {
  const STORAGE_COLOR_KEY = "wscCampus2dAlpacaColor";
  const STORAGE_ROOM_KEY = "wscCampus2dRoom";
  const STORAGE_DEV_ZONES_KEY = "wscCampus2dDevZones";
  const STORAGE_SETTINGS_KEY = "wscCampus2dSettings";
  const BACKGROUND_MUSIC_SRC = "./assets/campus-2d/audio/alpaca-campus-lofi-loop-3min-less-bass.mp3";
  const DEFAULT_SETTINGS = Object.freeze({
    tone: 0,
    volume: 16,
    muted: false
  });
  const CHAT_TTL_MS = 10000;
  const CHAT_STACK_LIMIT = 10;
  const debateRules = window.WSC_CAMPUS_2D_DEBATE_RULES;
  const debateAudioApi = window.WSC_CAMPUS_2D_DEBATE_AUDIO;
  const DEBATE_ROOM_ID = "debate-lab";
  const DEBATE_SCHEMA = "campus2d.debate.v1";
  const DEBATE_BOARD_ID = "debate-board";
  const DEBATE_MODERATOR_NPC_ID = "debate-stage-moderator-npc";
  const DEBATE_MIN_TEAM_SIZE = 2;
  const DEBATE_MAX_TEAM_SIZE = 3;
  const DEBATE_MAX_DEBATERS = 6;
  const DEBATE_JOIN_CODE_LENGTH = 6;
  const DEBATE_INTRO_MS = 30000;
  const DEBATE_NPC_WALK_MS = 3200;
  const DEBATE_NOTE_MAX_LENGTH = 1400;
  const DEBATE_CENTER_STAGE = Object.freeze({ x: 588, y: 309 });
  const DEBATE_SIDE_STAGE = Object.freeze({ x: 860, y: 245 });
  const DEBATE_BOARD_RECT = Object.freeze({ x: 390, y: 30, width: 405, height: 175 });
  const DEBATE_NOTE_COLORS = Object.freeze([
    "#ffd166",
    "#6ec6ff",
    "#8bd17c",
    "#ff8aa8",
    "#c8a3ff",
    "#ff9f5c"
  ]);
  const NPC_DIALOGUE_TYPE_SPEED_MS = 12;
  const NPC_DIALOGUE_CHARS_PER_TICK = 2;
  const NPC_DIALOGUE_START_DELAY_MS = 120;
  const WALK_FRAME_COLUMNS = 7;
  const WALK_IDLE_FRAME = 3;
  const WALK_FRAME_MS = 115;
  const MOVE_SPEED = 238;
  const MOVE_EPSILON = 6;
  const ALPACA_COLLISION_RADIUS = 28;
  const ALPACA_COLLISION_DISTANCE = ALPACA_COLLISION_RADIUS * 2;
  const MIN_DEV_ZONE_SIZE = 12;
  const DEV_ZONE_PASTE_OFFSET = 16;
  const PLAYER_CARD_TILT_MAX_DEGREES = 9;
  const SEAT_EXIT_OFFSETS = [8, 16, 28, 44, 64, 96, 128];
  const SEAT_EXIT_DIRECTIONS = Object.freeze([
    Object.freeze({ x: 1, y: 0 }),
    Object.freeze({ x: -1, y: 0 }),
    Object.freeze({ x: 0, y: 1 }),
    Object.freeze({ x: 0, y: -1 }),
    Object.freeze({ x: Math.SQRT1_2, y: Math.SQRT1_2 }),
    Object.freeze({ x: -Math.SQRT1_2, y: Math.SQRT1_2 }),
    Object.freeze({ x: Math.SQRT1_2, y: -Math.SQRT1_2 }),
    Object.freeze({ x: -Math.SQRT1_2, y: -Math.SQRT1_2 })
  ]);
  const DEV_ZONE_TYPES = ["blocked", "seat", "behind", "portal", "game"];
  const DEV_ZONE_FIELDS = ["x", "y", "width", "height"];
  const SEAT_DIRECTIONS = ["down", "up", "left", "right"];
  const DEV_ZONE_CONFIG = Object.freeze({
    blocked: { key: "blockedZones", label: "pink blocked", className: "blocked" },
    seat: { key: "seats", label: "yellow seat", className: "seat" },
    behind: { key: "behindZones", label: "purple behind", className: "behind" },
    portal: { key: "portals", label: "blue portal", className: "portal" },
    game: { key: "gameZones", label: "orange game", className: "game" }
  });
  const RETIRED_DEV_ZONE_IDS = Object.freeze({
    lobby: Object.freeze({
      behindZones: new Set(["lobby-behind-15"])
    })
  });
  const ACHIEVEMENT_ROUNDS = Object.freeze([
    Object.freeze({ value: "regional", label: "Regional" }),
    Object.freeze({ value: "global", label: "Global" }),
    Object.freeze({ value: "toc", label: "ToC" })
  ]);
  const REWARD_ASSET_VERSION = "20260706debateaudiofree";
  const MAX_ID_REWARDS = 9;
  const ACHIEVEMENT_REWARD_TYPES = Object.freeze([
    Object.freeze({
      value: "jac-khor",
      label: "Jac Khor",
      asset: `./assets/campus-2d/rewards/jac-khor.png?v=${REWARD_ASSET_VERSION}`
    }),
    Object.freeze({
      value: "trophy",
      label: "Trophy",
      asset: `./assets/campus-2d/rewards/trophy.png?v=${REWARD_ASSET_VERSION}`
    }),
    Object.freeze({
      value: "gold-medal",
      label: "Gold medal",
      asset: `./assets/campus-2d/rewards/gold-medal.png?v=${REWARD_ASSET_VERSION}`
    }),
    Object.freeze({
      value: "silver-medal",
      label: "Silver medal",
      asset: `./assets/campus-2d/rewards/silver-medal.png?v=${REWARD_ASSET_VERSION}`
    })
  ]);
  const ACHIEVEMENT_REWARD_TYPE_VALUES = new Set(ACHIEVEMENT_REWARD_TYPES.map((entry) => entry.value));
  const ID_REWARD_ROW_PATTERNS = Object.freeze({
    0: Object.freeze([]),
    1: Object.freeze([1]),
    2: Object.freeze([2]),
    3: Object.freeze([3]),
    4: Object.freeze([2, 2]),
    5: Object.freeze([2, 3]),
    6: Object.freeze([3, 3]),
    7: Object.freeze([2, 2, 3]),
    8: Object.freeze([2, 3, 3]),
    9: Object.freeze([3, 3, 3])
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

  function normalizeSeatDirection(direction, fallback = "down") {
    return SEAT_DIRECTIONS.includes(direction) ? direction : fallback;
  }

  function getRoom(roomId) {
    const manifest = getManifest();
    return manifest?.roomsById?.[roomId] || manifest?.roomsById?.[manifest.defaultRoomId] || null;
  }

  function parseAchievementList(value) {
    if (Array.isArray(value)) {
      return value;
    }
    if (value && typeof value === "object") {
      return Array.isArray(value.achievements) ? value.achievements : [];
    }
    if (typeof value === "string" && value.trim()) {
      try {
        return parseAchievementList(JSON.parse(value));
      } catch (_error) {
        return [];
      }
    }
    return [];
  }

  function getAchievementRewardType(value) {
    return ACHIEVEMENT_REWARD_TYPES.find((entry) => entry.value === value) || ACHIEVEMENT_REWARD_TYPES[0];
  }

  function normalizeAchievementRewardType(value) {
    const normalized = String(value || "").trim().toLowerCase().replace(/_/g, "-");
    const aliases = {
      "jac khor": "jac-khor",
      jackhor: "jac-khor",
      gold: "gold-medal",
      "gold medal": "gold-medal",
      silver: "silver-medal",
      "silver medal": "silver-medal"
    };
    const key = aliases[normalized] || normalized;
    return ACHIEVEMENT_REWARD_TYPE_VALUES.has(key) ? key : ACHIEVEMENT_REWARD_TYPES[0].value;
  }

  function normalizeAchievementRound(value) {
    const normalized = String(value || "").trim().toLowerCase();
    if (normalized === "regional_round" || normalized === "regional") {
      return "regional";
    }
    if (normalized === "global_round" || normalized === "global") {
      return "global";
    }
    if (normalized === "tournament_of_champions" || normalized === "toc") {
      return "toc";
    }
    return ACHIEVEMENT_ROUNDS[0].value;
  }

  function normalizeAchievements(value) {
    return parseAchievementList(value)
      .map((entry) => ({
        fullName: String(entry?.fullName || entry?.full_name || "").trim(),
        rewardType: normalizeAchievementRewardType(entry?.rewardType || entry?.reward_type || entry?.type),
        round: normalizeAchievementRound(entry?.round || entry?.roundType || entry?.highest_wsc_round),
        city: String(entry?.city || "").trim(),
        approximateDate: String(entry?.approximateDate || entry?.approximate_date || entry?.date || "").trim()
      }))
      .filter((entry) => entry.city || entry.approximateDate || entry.fullName)
      .slice(0, MAX_ID_REWARDS);
  }

  function getRoundLabel(value) {
    return ACHIEVEMENT_ROUNDS.find((round) => round.value === value)?.label || String(value || "Round");
  }

  function getIdRewardRows(achievements) {
    const entries = normalizeAchievements(achievements).slice(0, MAX_ID_REWARDS);
    const pattern = ID_REWARD_ROW_PATTERNS[entries.length] || ID_REWARD_ROW_PATTERNS[MAX_ID_REWARDS];
    let start = 0;
    return pattern.map((count) => {
      const row = entries.slice(start, start + count);
      start += count;
      return row;
    });
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

  function getSeatZones(seats = []) {
    return seats.map((seat) => seat?.zone).filter(Boolean);
  }

  function isPointInRoom(room, point) {
    return point.x >= 0 && point.x <= room.width && point.y >= 0 && point.y <= room.height;
  }

  function getWalkability(room, point, zones = {}) {
    const inBounds = isPointInRoom(room, point);
    const blockedZones = zones.blockedZones || room.blockedZones || [];
    const seats = zones.seats || room.seats || [];
    const inBlockedZone = isPointInZones(point, blockedZones);
    const inSeat = isPointInZones(point, getSeatZones(seats));
    return {
      inBounds,
      inBlockedZone,
      inSeat,
      walkable: inBounds && !inBlockedZone && !inSeat
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

  function readNumberSetting(value, fallback, min, max) {
    const number = Number(value);
    return Number.isFinite(number) ? clamp(Math.round(number), min, max) : fallback;
  }

  function normalizeCampusSettings(value = {}) {
    const settings = value && typeof value === "object" ? value : {};
    return {
      tone: readNumberSetting(settings.tone, DEFAULT_SETTINGS.tone, -35, 35),
      volume: readNumberSetting(settings.volume, DEFAULT_SETTINGS.volume, 0, 100),
      muted: Boolean(settings.muted)
    };
  }

  function loadCampusSettings() {
    try {
      return normalizeCampusSettings(JSON.parse(safeStorageGet(STORAGE_SETTINGS_KEY) || "{}"));
    } catch (_error) {
      return normalizeCampusSettings();
    }
  }

  function formatToneLabel(tone) {
    if (tone > 0) {
      return `+${tone}% brighter`;
    }
    if (tone < 0) {
      return `${Math.abs(tone)}% darker`;
    }
    return "Normal";
  }

  function formatVolumeLabel(settings) {
    if (settings.muted || settings.volume <= 0) {
      return "Muted";
    }
    return `${settings.volume}%`;
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

  function getReadableTextColor(hex) {
    const value = String(hex || "").replace("#", "");
    if (!/^[0-9a-f]{6}$/i.test(value)) {
      return "#22160a";
    }
    const red = parseInt(value.slice(0, 2), 16) / 255;
    const green = parseInt(value.slice(2, 4), 16) / 255;
    const blue = parseInt(value.slice(4, 6), 16) / 255;
    const luminance = (0.2126 * red) + (0.7152 * green) + (0.0722 * blue);
    return luminance < 0.48 ? "#fff9e8" : "#22160a";
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

  function getWalkFrameColumn(nowMs) {
    return Math.floor(nowMs / WALK_FRAME_MS) % WALK_FRAME_COLUMNS;
  }

  function getFrame(direction, isSitting = false, isMoving = false, nowMs = 0) {
    const index = isMoving ? getWalkFrameColumn(nowMs) : WALK_IDLE_FRAME;
    if (isSitting) {
      if (direction === "up") {
        return { col: WALK_IDLE_FRAME, row: 7, flip: 1 };
      }
      if (direction === "left") {
        return { col: WALK_IDLE_FRAME, row: 5, flip: 1 };
      }
      if (direction === "right") {
        return { col: WALK_IDLE_FRAME, row: 6, flip: 1 };
      }
      return { col: WALK_IDLE_FRAME, row: 4, flip: 1 };
    }
    if (direction === "up") {
      return { col: index, row: 2, flip: 1 };
    }
    if (direction === "left") {
      return { col: index, row: 1, flip: -1 };
    }
    if (direction === "right") {
      return { col: index, row: 1, flip: 1 };
    }
    return { col: index, row: 0, flip: 1 };
  }

  function spritePercent(index, count) {
    return count <= 1 ? "0%" : `${(index / (count - 1)) * 100}%`;
  }

  function pluralize(value, unit) {
    return `${value} ${unit}${value === 1 ? "" : "s"}`;
  }

  function formatDebateClock(totalSeconds) {
    const seconds = Math.max(0, Math.ceil(Number(totalSeconds) || 0));
    const minutes = Math.floor(seconds / 60);
    const remainder = seconds % 60;
    return `${minutes}:${String(remainder).padStart(2, "0")}`;
  }

  function shortenDebateText(value, maxLength = 86) {
    const text = String(value || "").replace(/\s+/g, " ").trim();
    if (text.length <= maxLength) {
      return text;
    }
    return `${text.slice(0, Math.max(0, maxLength - 1)).trim()}...`;
  }

  function normalizeDebateCode(value) {
    return String(value || "")
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "")
      .slice(0, DEBATE_JOIN_CODE_LENGTH);
  }

  function createDebateJoinCode(length = DEBATE_JOIN_CODE_LENGTH) {
    const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "";
    for (let index = 0; index < length; index += 1) {
      code += alphabet[Math.floor(Math.random() * alphabet.length)];
    }
    return code;
  }

  function createDebateId(prefix = "debate") {
    return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
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
      return { destroy() {}, setRoom() {} };
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
    let selectedSeatDirection = "down";
    let debugMousePoint = null;
    let debugStatusText = "";
    let paletteOpen = false;
    let campusSettings = loadCampusSettings();
    let settingsHighlightTimer = 0;
    let settingsPopupOpen = false;
    let backgroundMusicBlocked = false;
    let activeNpcDialogue = null;
    let activeFeedbackDialog = null;
    let feedbackStatus = null;
    let feedbackSubmitting = false;
    let achievementDrafts = [createAchievementDraft()];
    let npcTypingTimer = 0;
    let debateState = null;
    let debateDraft = createDebateDraft();
    let debatePanelStatus = "";
    let debateNoteSendTimer = 0;
    let debateSpeechTimer = 0;
    let lastDebateSpeechId = "";
    let lastDebateClockKey = "";
    let lastDebateClockSecond = -1;
    let debateAudioStatus = {
      enabled: false,
      muted: false,
      connecting: false,
      permissionDenied: false,
      supported: Boolean(debateAudioApi?.createManager && window.RTCPeerConnection && navigator.mediaDevices?.getUserMedia),
      error: "",
      peerCount: 0,
      desiredPeerCount: 0,
      routedPeerCount: 0,
      connectionIssue: false,
      networkLabel: "Free browser audio",
      routeLabel: "Audio idle",
      canSend: false
    };
    let destroyed = false;
    const keys = new Set();
    const remotePlayers = new Map();
    const remoteElements = new Map();
    const npcElements = new Map();

    const spawn = room.spawnPoints.default;
    const localPlayer = {
      clientId: localClientId,
      userId: identity.userId || null,
      email: identity.email || "",
      alpacaName: identity.alpacaName || identity.displayName || "",
      displayName: identity.displayName || "Guest",
      schoolName: identity.schoolName || "",
      country: identity.country || "",
      wscEventCount: Number(identity.wscEventCount) || 0,
      highestWscRound: identity.highestWscRound || "",
      achievements: normalizeAchievements(identity.achievements || identity.wscAchievements),
      createdAt: identity.createdAt || null,
      roomId: room.id,
      x: spawn.x,
      y: spawn.y,
      direction: "down",
      colorId: initialColor,
      moving: false
    };
    const debateAudioManager = debateAudioApi?.createManager
      ? debateAudioApi.createManager({
        localClientId: localPlayer.clientId,
        sendSignal: sendDebateSignal,
        shouldHearPeer: (route, peerClientId) => debateRules.shouldHearPeer(route, peerClientId),
        shouldConnectPeer: (route, peerClientId) => debateRules.shouldConnectPeer(route, peerClientId),
        onStatusChange(status) {
          debateAudioStatus = status;
          updateDebateAudioStatusDisplays();
          if (!destroyed) {
            publishPresence(true);
          }
        }
      })
      : null;

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
    const decorationsLayer = createEl("div", "campus2d-decorations");
    const debateLayer = createEl("div", "campus2d-debate-layer", { "aria-hidden": "true" });
    const entitiesLayer = createEl("div", "campus2d-entities");
    const hotspotsLayer = createEl("div", "campus2d-hotspots");
    const portalsLayer = createEl("div", "campus2d-portals");
    const seatsLayer = createEl("div", "campus2d-seats");
    const behindLayer = createEl("div", "campus2d-behind-layer");
    const npcsLayer = createEl("div", "campus2d-npcs");
    const debugLayer = createEl("div", "campus2d-debug-layer", { "aria-hidden": "true" });
    const npcDialogueLayer = createEl("div", "campus2d-npc-dialogue-layer", {
      "data-campus2d-ui": "",
      hidden: ""
    });
    const backgroundMusic = new Audio(BACKGROUND_MUSIC_SRC);
    const activityPanel = createEl("aside", "campus2d-activity-panel", {
      "aria-label": "Campus activity",
      "data-campus2d-ui": ""
    });
    const activityMount = createEl("div", "campus2d-activity-mount", {
      id: "campus2dActivityPanel",
      "data-campus2d-activity-mount": ""
    });
    const controlsPanel = createEl("aside", "campus2d-controls-panel", {
      "aria-label": "Multiplayer messages",
      "data-campus2d-ui": ""
    });
    const controlsHeader = createEl("div", "campus2d-controls-header");
    const connectedCount = createEl("strong", "campus2d-connected-count", {
      "aria-live": "polite"
    });
    const headerCardHost = createEl("div", "campus2d-header-card-host", { "data-campus2d-ui": "" });
    const hud = createEl("div", "campus2d-hud", { "data-campus2d-ui": "" });
    const playerCard = createEl("section", "campus2d-player-card online-glow-card", {
      "aria-label": "Open your Alpaca ID",
      role: "button",
      tabindex: "0",
      "data-campus2d-open-self-card": ""
    });
    const playerCardContainer = createEl("span", "online-card-container noselect");
    const playerCardCanvas = createEl("span", "online-card-canvas");
    const playerCardFrame = createEl("span", "online-card-frame");
    const playerCardContent = createEl("span", "card-content");
    const playerCardGlare = createEl("span", "card-glare", { "aria-hidden": "true" });
    const playerCyberLines = createEl("span", "cyber-lines", { "aria-hidden": "true" });
    const playerPrompt = createEl("span", "online-card-prompt");
    const playerArt = createEl("span", "online-card-art campus2d-profile-art");
    const playerAvatarButton = createEl("button", "campus2d-profile-avatar", {
      type: "button",
      title: "Open your Alpaca ID",
      "aria-label": "Open your Alpaca ID",
      "data-campus2d-open-self-card": ""
    });
    const playerDetails = createEl("div", "subtitle campus2d-profile-details");
    const playerName = createEl("strong", "title campus2d-profile-name");
    const playerSchoolField = createEl("span", "campus2d-profile-field");
    const playerSchoolLabel = createEl("span", "campus2d-profile-label");
    const playerSchool = createEl("span", "campus2d-profile-school");
    const playerAgeField = createEl("span", "campus2d-profile-field");
    const playerAgeLabel = createEl("span", "campus2d-profile-label");
    const playerAge = createEl("span", "campus2d-profile-age");
    const playerGlowingElements = createEl("span", "glowing-elements", { "aria-hidden": "true" });
    const playerParticles = createEl("span", "card-particles", { "aria-hidden": "true" });
    const playerCorners = createEl("span", "corner-elements", { "aria-hidden": "true" });
    const playerScanLine = createEl("span", "scan-line", { "aria-hidden": "true" });
    const roomMeta = createEl("div", "campus2d-room-meta");
    const roomTitle = createEl("strong", "campus2d-room-title");
    const statusPill = createEl("span", "campus2d-status-pill");
    const settingsPanel = createEl("section", "campus2d-settings-panel", {
      "aria-label": "Campus settings",
      "data-campus2d-ui": "",
      tabindex: "-1"
    });
    const settingsHeader = createEl("div", "campus2d-settings-header");
    const settingsTitle = createEl("strong", "campus2d-settings-title");
    const muteButton = createEl("button", "campus2d-mute-button", {
      type: "button",
      "aria-pressed": "false",
      "data-campus2d-mute": ""
    });
    const toneControl = createEl("label", "campus2d-setting-control");
    const toneLabelRow = createEl("span", "campus2d-setting-row");
    const toneLabel = createEl("span", "campus2d-setting-label");
    const toneValue = createEl("span", "campus2d-setting-value", { "aria-live": "polite" });
    const toneInput = createEl("input", "campus2d-slider", {
      type: "range",
      min: "-35",
      max: "35",
      step: "1",
      "data-campus2d-tone": ""
    });
    const volumeControl = createEl("label", "campus2d-setting-control");
    const volumeLabelRow = createEl("span", "campus2d-setting-row");
    const volumeLabel = createEl("span", "campus2d-setting-label");
    const volumeValue = createEl("span", "campus2d-setting-value", { "aria-live": "polite" });
    const volumeInput = createEl("input", "campus2d-slider", {
      type: "range",
      min: "0",
      max: "100",
      step: "1",
      "data-campus2d-volume": ""
    });
    const palette = createEl("div", "campus2d-palette", {
      "aria-label": "Choose alpaca color",
      role: "group",
      hidden: ""
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
    const reportButton = createEl("button", "campus2d-report-button", {
      type: "button",
      "data-campus2d-report-open": "",
      "data-campus2d-ui": ""
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
    const seatDirectionControl = createEl("label", "campus2d-zone-direction");
    const seatDirectionLabel = createEl("span", "");
    const seatDirectionSelect = createEl("select", "campus2d-debug-select", {
      "aria-label": "Seat facing direction",
      "data-campus2d-seat-direction": ""
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

    backgroundMusic.loop = true;
    backgroundMusic.preload = "auto";
    backgroundMusic.setAttribute("playsinline", "");
    settingsTitle.textContent = "Settings";
    toneLabel.textContent = "Display tone";
    volumeLabel.textContent = "Music";
    chatButton.textContent = "Send";
    reportButton.textContent = "Report";
    debugTitle.textContent = "Dev";
    Array.from({ length: 9 }, (_value, index) => {
      playerCardCanvas.append(createEl("span", `tracker tr-${index + 1}`, { "aria-hidden": "true" }));
    });
    Array.from({ length: 4 }).forEach(() => {
      playerCyberLines.append(createEl("span", ""));
      playerCorners.append(createEl("span", ""));
    });
    ["glow-1", "glow-2", "glow-3"].forEach((className) => {
      playerGlowingElements.append(createEl("span", className));
    });
    Array.from({ length: 6 }).forEach(() => {
      playerParticles.append(createEl("span", ""));
    });
    DEV_ZONE_TYPES.forEach((type) => {
      const option = createEl("option", "");
      option.value = type;
      option.textContent = DEV_ZONE_CONFIG[type].label;
      zoneTypeSelect.append(option);
    });
    SEAT_DIRECTIONS.forEach((direction) => {
      const option = createEl("option", "");
      option.value = direction;
      option.textContent = direction;
      seatDirectionSelect.append(option);
    });
    seatDirectionLabel.textContent = "Facing";
    seatDirectionControl.append(seatDirectionLabel, seatDirectionSelect);
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
    debugControls.append(zoneTypeSelect, seatDirectionControl);
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
    settingsHeader.append(settingsTitle, muteButton);
    toneLabelRow.append(toneLabel, toneValue);
    toneControl.append(toneLabelRow, toneInput);
    volumeLabelRow.append(volumeLabel, volumeValue);
    volumeControl.append(volumeLabelRow, volumeInput);
    settingsPanel.append(settingsHeader, toneControl, volumeControl);
    settingsPanel.hidden = true;
    chatForm.append(chatInput, chatButton);
    playerArt.append(playerAvatarButton);
    playerSchoolField.append(playerSchool);
    playerDetails.append(playerSchoolField);
    playerCardContent.append(
      playerCardGlare,
      playerCyberLines,
      playerArt,
      playerName,
      playerGlowingElements,
      playerDetails,
      palette,
      playerParticles,
      playerCorners,
      playerScanLine
    );
    playerCardFrame.append(playerCardContent);
    playerCardCanvas.append(playerCardFrame);
    playerCardContainer.append(playerCardCanvas);
    playerCard.append(playerCardContainer);
    headerCardHost.append(playerCard);
    roomMeta.append(roomTitle, statusPill);
    controlsHeader.append(connectedCount, roomMeta);
    activityPanel.append(activityMount, debugPanel);
    world.append(mapImage, decorationsLayer, debateLayer, hotspotsLayer, portalsLayer, seatsLayer, entitiesLayer, behindLayer, npcsLayer, debugLayer);
    entitiesLayer.append(localElement);
    viewport.append(world, chatForm, reportButton, npcDialogueLayer);
    root.append(viewport, activityPanel, settingsPanel);
    mountNode.replaceChildren(root);
    mountHeaderCard();

    function mountHeaderCard() {
      const headerTarget = document.querySelector(".hero-layout") || document.querySelector(".hero");
      if (headerTarget) {
        headerTarget.append(headerCardHost);
        return;
      }
      root.append(headerCardHost);
    }

    function createPlayerElement(player, isLocal, isNpc = false) {
      const element = createEl("div", `campus2d-player${isLocal ? " is-local" : ""}${isNpc ? " is-npc" : ""}`);
      const chatStack = createEl("div", "campus2d-chat-stack", {
        "aria-live": "polite"
      });
      const avatarAttrs = isNpc
        ? {
          type: "button",
          title: `Talk to ${player.displayName || "NPC"}`,
          "aria-label": `Talk to ${player.displayName || "NPC"}`,
          "data-campus2d-npc": player.clientId
        }
        : {
          role: "img",
          "aria-label": `${player.displayName || "Alpaca"} avatar card`
        };
      if (!isNpc) {
        avatarAttrs.type = "button";
        avatarAttrs["data-campus2d-avatar"] = player.clientId;
      }
      const avatar = createEl("button", "campus2d-avatar", avatarAttrs);
      const name = createEl("span", "campus2d-name");
      avatar.style.backgroundImage = `url("${manifest.sprite.asset}")`;
      name.textContent = player.displayName || "Guest";
      element.append(chatStack, avatar, name);
      element._campus2d = { chatStack, avatar, name };
      updatePlayerElement(element, player, performance.now());
      return element;
    }

    function updatePlayerElement(element, player, nowMs) {
      const color = getColor(manifest, player.colorId);
      const isSitting = Boolean(player.seatId) && !player.moving;
      const isMoving = Boolean(player.moving) && !player.seatId;
      const frame = getFrame(player.direction, isSitting, isMoving, nowMs);
      const avatar = element._campus2d?.avatar;
      element.style.transform = `translate(${player.x}px, ${player.y}px)`;
      element.style.zIndex = String(Math.round(player.y));
      element.style.setProperty("--campus2d-color", color.hex);
      element.style.setProperty("--campus2d-bubble-text", getReadableTextColor(color.hex));
      element.style.setProperty("--campus2d-sprite-x", spritePercent(frame.col, manifest.sprite.columns));
      element.style.setProperty("--campus2d-sprite-y", spritePercent(frame.row, manifest.sprite.rows));
      element.style.setProperty("--campus2d-flip", String(frame.flip));
      if (avatar) {
        avatar.style.backgroundImage = `url("${color.asset || manifest.sprite.asset}")`;
        avatar.setAttribute("aria-label", `${player.displayName || "Alpaca"} avatar card`);
      }
      element.classList.toggle("is-moving", isMoving);
      element.classList.toggle("is-sitting", isSitting);
      if (element._campus2d?.name) {
        element._campus2d.name.textContent = player.displayName || "Guest";
      }
    }

    function setStatus(value) {
      statusPill.textContent = value;
      root.dataset.realtimeStatus = value.toLowerCase();
    }

    function setPaletteOpen(value) {
      paletteOpen = Boolean(value);
      palette.hidden = !paletteOpen;
      playerCard.classList.toggle("is-palette-open", paletteOpen);
      playerAvatarButton.setAttribute("aria-expanded", String(paletteOpen));
    }

    function renderLocalCard() {
      const color = getColor(manifest, localPlayer.colorId);
      playerCard.style.setProperty("--campus2d-color", color.hex);
      playerName.textContent = localPlayer.displayName || "Guest";
      playerSchool.textContent = localPlayer.schoolName || "Unknown school";
      playerAvatarButton.title = `${color.label} alpaca. Open your Alpaca ID`;
      playerAvatarButton.setAttribute("aria-label", `${color.label} alpaca. Open your Alpaca ID`);
      applyAvatarPreview(playerAvatarButton, localPlayer);
      setPaletteOpen(paletteOpen);
    }

    function updateConnectedCount() {
      const count = remotePlayers.size + 1;
      connectedCount.textContent = `${count} ${count === 1 ? "alpaca" : "alpacas"} connected`;
    }

    function saveCampusSettings() {
      safeStorageSet(STORAGE_SETTINGS_KEY, JSON.stringify(campusSettings));
    }

    function applyBackgroundMusicSettings() {
      backgroundMusic.volume = clamp(campusSettings.volume, 0, 100) / 100;
      backgroundMusic.muted = campusSettings.muted || campusSettings.volume <= 0;
    }

    function syncBackgroundMusicPlayback() {
      applyBackgroundMusicSettings();
      if (destroyed || campusSettings.muted || campusSettings.volume <= 0) {
        backgroundMusic.pause();
        return;
      }
      if (!backgroundMusic.paused) {
        return;
      }
      const playRequest = backgroundMusic.play();
      if (playRequest?.catch) {
        playRequest
          .then(() => {
            backgroundMusicBlocked = false;
          })
          .catch(() => {
            backgroundMusicBlocked = true;
          });
      }
    }

    function applyCampusSettings() {
      const tone = clamp(campusSettings.tone, -35, 35);
      const brightness = clamp(1 + (tone / 100), 0.65, 1.35);
      const contrast = tone >= 0
        ? clamp(1 + (tone / 240), 1, 1.15)
        : clamp(1 + (tone / 280), 0.88, 1);
      const saturation = tone >= 0
        ? clamp(1 + (tone / 260), 1, 1.14)
        : clamp(1 + (tone / 320), 0.88, 1);
      root.style.setProperty("--campus2d-map-brightness", brightness.toFixed(2));
      root.style.setProperty("--campus2d-map-contrast", contrast.toFixed(2));
      root.style.setProperty("--campus2d-map-saturation", saturation.toFixed(2));
      toneInput.value = String(campusSettings.tone);
      volumeInput.value = String(campusSettings.volume);
      toneValue.textContent = formatToneLabel(campusSettings.tone);
      volumeValue.textContent = formatVolumeLabel(campusSettings);
      muteButton.textContent = campusSettings.muted || campusSettings.volume <= 0 ? "Unmute" : "Mute";
      muteButton.title = campusSettings.muted || campusSettings.volume <= 0 ? "Turn music back on" : "Mute music";
      muteButton.setAttribute("aria-pressed", String(campusSettings.muted || campusSettings.volume <= 0));
      syncBackgroundMusicPlayback();
    }

    function updateCampusSettings(patch) {
      campusSettings = normalizeCampusSettings({ ...campusSettings, ...patch });
      saveCampusSettings();
      applyCampusSettings();
    }

    function setSettingsPanelOpen(value) {
      settingsPopupOpen = Boolean(value);
      settingsPanel.hidden = !settingsPopupOpen;
      settingsPanel.classList.toggle("is-open", settingsPopupOpen);
      window.clearTimeout(settingsHighlightTimer);
      settingsPanel.classList.remove("is-highlighted");
      if (!settingsPopupOpen) {
        return;
      }
      window.requestAnimationFrame(() => {
        settingsPanel.focus({ preventScroll: true });
        settingsPanel.classList.add("is-highlighted");
        settingsHighlightTimer = window.setTimeout(() => {
          settingsPanel.classList.remove("is-highlighted");
        }, 1200);
      });
    }

    function openSettingsPanel() {
      setSettingsPanelOpen(!settingsPopupOpen);
    }

    function handleOpenSettingsEvent() {
      openSettingsPanel();
    }

    function handleAudioUnlock() {
      if (backgroundMusicBlocked || backgroundMusic.paused) {
        syncBackgroundMusicPlayback();
      }
    }

    function handleToneInput(event) {
      updateCampusSettings({ tone: event.target.value });
    }

    function handleVolumeInput(event) {
      const volume = readNumberSetting(event.target.value, DEFAULT_SETTINGS.volume, 0, 100);
      updateCampusSettings({
        volume,
        muted: volume <= 0 ? true : false
      });
    }

    function handleMuteClick() {
      if (campusSettings.muted || campusSettings.volume <= 0) {
        updateCampusSettings({
          muted: false,
          volume: campusSettings.volume > 0 ? campusSettings.volume : DEFAULT_SETTINGS.volume
        });
        return;
      }
      updateCampusSettings({ muted: true });
    }

    function updatePlayerCardTilt(event) {
      if (event.pointerType === "touch") {
        return;
      }
      const rect = playerCard.getBoundingClientRect();
      if (!rect.width || !rect.height) {
        return;
      }
      const xRatio = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
      const yRatio = Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height));
      const rotateX = (0.5 - yRatio) * PLAYER_CARD_TILT_MAX_DEGREES * 2;
      const rotateY = (xRatio - 0.5) * PLAYER_CARD_TILT_MAX_DEGREES * 2;
      playerCard.style.setProperty("--campus2d-card-rotate-x", `${rotateX.toFixed(2)}deg`);
      playerCard.style.setProperty("--campus2d-card-rotate-y", `${rotateY.toFixed(2)}deg`);
      playerCard.classList.add("is-pointer-tilting");
    }

    function resetPlayerCardTilt() {
      playerCard.classList.remove("is-pointer-tilting");
      playerCard.style.removeProperty("--campus2d-card-rotate-x");
      playerCard.style.removeProperty("--campus2d-card-rotate-y");
    }

    function getPlayerProfilePayload(player) {
      return {
        email: player.email || "",
        alpacaName: player.alpacaName || "",
        schoolName: player.schoolName || "",
        country: player.country || "",
        wscEventCount: Number(player.wscEventCount) || 0,
        highestWscRound: player.highestWscRound || "",
        achievements: normalizeAchievements(player.achievements),
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
        const direction = existing.direction
          ? normalizeSeatDirection(existing.direction, selectedSeatDirection)
          : (existing.id ? null : selectedSeatDirection);
        const seat = {
          ...existing,
          id: nextRect.id,
          zone: nextRect,
          x: nextRect.x + (nextRect.width / 2),
          y: nextRect.y + (nextRect.height / 2)
        };
        if (direction) {
          seat.direction = direction;
        } else {
          delete seat.direction;
        }
        return seat;
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

    function getSeatDirection(targetRoom, seat, baseSeats = targetRoom?.seats || []) {
      if (seat?.direction) {
        return seat.direction;
      }
      const baseSeat = baseSeats.find((entry) => entry.id === seat?.id);
      if (baseSeat?.direction) {
        return baseSeat.direction;
      }
      return null;
    }

    function applySeatDirections(targetRoom, seats, baseSeats = targetRoom?.seats || []) {
      return seats.map((seat) => {
        const direction = getSeatDirection(targetRoom, seat, baseSeats);
        return direction ? { ...seat, direction } : seat;
      });
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
          const data = {
            schema: "wsc.campus2d.devZones.v1",
            rooms: parsed.rooms && typeof parsed.rooms === "object" ? parsed.rooms : {}
          };
          if (removeRetiredDevZones(data)) {
            safeStorageSet(STORAGE_DEV_ZONES_KEY, JSON.stringify(data));
          }
          return data;
        }
      } catch (_error) {}
      return { schema: "wsc.campus2d.devZones.v1", rooms: {} };
    }

    function isRetiredDevZone(roomId, key, zone) {
      return Boolean(RETIRED_DEV_ZONE_IDS[roomId]?.[key]?.has(zone?.id));
    }

    function filterRetiredDevZones(roomId, key, zones = []) {
      return zones.filter((zone) => !isRetiredDevZone(roomId, key, zone));
    }

    function removeRetiredDevZones(data) {
      let changed = false;
      Object.entries(data.rooms || {}).forEach(([roomId, roomData]) => {
        if (!roomData || typeof roomData !== "object") {
          return;
        }
        Object.keys(RETIRED_DEV_ZONE_IDS[roomId] || {}).forEach((key) => {
          if (!Array.isArray(roomData[key])) {
            return;
          }
          const filtered = filterRetiredDevZones(roomId, key, roomData[key]);
          if (filtered.length !== roomData[key].length) {
            roomData[key] = filtered;
            changed = true;
          }
        });
      });
      return changed;
    }

    function getRoomBaseZones(targetRoom = room) {
      return {
        blockedZones: cloneZoneItems("blocked", targetRoom.blockedZones || []),
        seats: applySeatDirections(targetRoom, cloneZoneItems("seat", targetRoom.seats || [])),
        behindZones: cloneZoneItems("behind", targetRoom.behindZones || []),
        portals: cloneZoneItems("portal", targetRoom.portals || []),
        gameZones: cloneZoneItems("game", targetRoom.gameZones || [])
      };
    }

    function normalizeRoomOverride(targetRoom, override = {}) {
      const base = getRoomBaseZones(targetRoom);
      return {
        blockedZones: cloneZoneItems("blocked", filterRetiredDevZones(targetRoom.id, "blockedZones", Array.isArray(override.blockedZones) ? override.blockedZones : base.blockedZones)),
        seats: applySeatDirections(targetRoom, cloneZoneItems("seat", filterRetiredDevZones(targetRoom.id, "seats", Array.isArray(override.seats) ? override.seats : base.seats)), base.seats),
        behindZones: cloneZoneItems("behind", filterRetiredDevZones(targetRoom.id, "behindZones", Array.isArray(override.behindZones) ? override.behindZones : base.behindZones)),
        portals: cloneZoneItems("portal", filterRetiredDevZones(targetRoom.id, "portals", Array.isArray(override.portals) ? override.portals : base.portals)),
        gameZones: cloneZoneItems("game", filterRetiredDevZones(targetRoom.id, "gameZones", Array.isArray(override.gameZones) ? override.gameZones : base.gameZones))
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
        const directionArg = zone.direction ? `, "${zone.direction}"` : "";
        return `${indent}seat("${zone.id}", ${rect.x}, ${rect.y}, ${rect.width}, ${rect.height}${directionArg})`;
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
      setPaletteOpen(paletteOpen);
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
      if (zones.length) {
        return zones;
      }
      const ids = new Set(zones.map((zone) => zone.id));
      const legacyZones = (room.hotspots || [])
        .filter((hotspot) => !ids.has(hotspot.id))
        .map((hotspot) => createZoneItem("game", hotspot.zone, {
          id: hotspot.id,
          mode: getLegacyHotspotMode(hotspot),
          label: hotspot.label || "Game zone"
        }));
      return legacyZones;
    }

    function activateGameZone(entry) {
      if (room.id === DEBATE_ROOM_ID && entry.id === DEBATE_BOARD_ID) {
        renderDebateUi();
        showBubble(localElement, "Debate Lab is open in the right panel");
        return;
      }

      const mode = entry.mode || entry.kind || "game";
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

    function getDebateTopics() {
      const topics = window.WSC_DEBATE_LAB_DATA?.topics;
      return Array.isArray(topics) ? topics.filter((topic) => topic?.motion) : [];
    }

    function getDefaultDebateTopicId() {
      const firstTopic = getDebateTopics()[0];
      return firstTopic ? String(firstTopic.id) : "";
    }

    function getDebateTopic(topicId) {
      const topics = getDebateTopics();
      return topics.find((topic) => String(topic.id) === String(topicId)) || topics[0] || null;
    }

    function getDebateTopicId(topicId) {
      const topic = getDebateTopic(topicId);
      return topic ? String(topic.id) : "";
    }

    function createDebateDraft() {
      return {
        topicId: getDefaultDebateTopicId(),
        hostSide: "pro",
        judgeMode: false,
        joinCode: ""
      };
    }

    function createTextElement(tagName, className, text, attributes = {}) {
      const element = createEl(tagName, className, attributes);
      element.textContent = text;
      return element;
    }

    function normalizeDebateSide(side) {
      return side === "con" ? "con" : "pro";
    }

    function getDebateSideLabel(side) {
      return normalizeDebateSide(side) === "con" ? "CON" : "PRO";
    }

    function getDebateMotion(topicId = debateState?.topicId || debateDraft.topicId) {
      return getDebateTopic(topicId)?.motion || "Choose a Debate Lab motion.";
    }

    function normalizeDebateParticipant(entry) {
      const clientId = String(entry?.clientId || "").trim();
      if (!clientId) {
        return null;
      }
      const colorId = manifest.colors.some((color) => color.id === entry?.colorId)
        ? entry.colorId
        : manifest.colors[0].id;
      return {
        clientId,
        userId: entry?.userId || null,
        displayName: String(entry?.displayName || "Guest").trim().slice(0, 80) || "Guest",
        colorId,
        noteColor: /^#[0-9a-f]{6}$/i.test(String(entry?.noteColor || "")) ? entry.noteColor : DEBATE_NOTE_COLORS[0],
        joinedAtMs: Number(entry?.joinedAtMs) || Date.now()
      };
    }

    function normalizeDebateTeam(entries = []) {
      const seen = new Set();
      const team = [];
      entries.forEach((entry) => {
        const participant = normalizeDebateParticipant(entry);
        if (!participant || seen.has(participant.clientId) || team.length >= DEBATE_MAX_TEAM_SIZE) {
          return;
        }
        seen.add(participant.clientId);
        team.push(participant);
      });
      return team;
    }

    function normalizeDebateNotes(notes, teams) {
      const result = { pro: {}, con: {} };
      ["pro", "con"].forEach((side) => {
        const allowedIds = new Set((teams[side] || []).map((participant) => participant.clientId));
        const source = notes?.[side] && typeof notes[side] === "object" ? notes[side] : {};
        Object.entries(source).forEach(([clientId, value]) => {
          if (!allowedIds.has(clientId)) {
            return;
          }
          result[side][clientId] = String(value || "").slice(0, DEBATE_NOTE_MAX_LENGTH);
        });
      });
      return result;
    }

    function normalizeDebateState(value) {
      if (!value || typeof value !== "object") {
        return null;
      }
      const nowMs = Date.now();
      const teams = {
        pro: normalizeDebateTeam(value.teams?.pro),
        con: normalizeDebateTeam(value.teams?.con)
      };
      const status = ["setup", "running", "ended"].includes(value.status) ? value.status : "setup";
      const judgeMode = Boolean(value.judgeMode);
      const judge = judgeMode ? normalizeDebateParticipant(value.judge) : null;
      return {
        schema: DEBATE_SCHEMA,
        roomId: DEBATE_ROOM_ID,
        sessionId: String(value.sessionId || createDebateId("debate-room")),
        joinCode: normalizeDebateCode(value.joinCode || createDebateJoinCode()),
        hostClientId: String(value.hostClientId || "").trim(),
        hostName: String(value.hostName || "Host").trim().slice(0, 80) || "Host",
        topicId: getDebateTopicId(value.topicId),
        judgeMode,
        judge,
        teams,
        notes: normalizeDebateNotes(value.notes, teams),
        status,
        createdAtMs: Number(value.createdAtMs) || nowMs,
        updatedAtMs: Number(value.updatedAtMs) || Number(value.createdAtMs) || nowMs,
        startedAtMs: Number(value.startedAtMs) || null,
        endedAtMs: Number(value.endedAtMs) || null,
        speechId: String(value.speechId || ""),
        announcement: String(value.announcement || "")
      };
    }

    function cloneDebateState(state = debateState) {
      return state ? JSON.parse(JSON.stringify(state)) : null;
    }

    function touchDebateState(state) {
      state.updatedAtMs = Date.now();
      return state;
    }

    function getDebatePresencePayload() {
      const payload = { debateRoom: null, debateAudio: null };
      if (room.id !== DEBATE_ROOM_ID || !debateState) {
        return payload;
      }
      if (debateState.hostClientId === localPlayer.clientId) {
        payload.debateRoom = cloneDebateState(debateState);
      }
      if (debateAudioStatus.enabled) {
        payload.debateAudio = {
          schema: "campus2d.debate.audio-presence.v1",
          enabled: true,
          muted: Boolean(debateAudioStatus.muted),
          connecting: Boolean(debateAudioStatus.connecting),
          sessionId: debateState.sessionId,
          routeLabel: debateAudioStatus.routeLabel || "",
          canSend: Boolean(debateAudioStatus.canSend),
          updatedAtMs: Date.now()
        };
      }
      return payload;
    }

    function isDebateBlocking(state = debateState) {
      return debateRules.isBlocking(state);
    }

    function isLocalDebateHost(state = debateState) {
      return debateRules.isHost(state, localPlayer.clientId);
    }

    function getDebateParticipantName(participant) {
      return debateRules.getParticipantName(participant);
    }

    function getLocalDebateRole(state = debateState) {
      const role = debateRules.getLocalRole(state, localPlayer.clientId);
      return role === "audience" ? "" : role;
    }

    function getLocalDebateParticipant(state = debateState) {
      return debateRules.getLocalParticipant(state, localPlayer.clientId);
    }

    function getNextDebateNoteColor(state, side) {
      const used = new Set((state?.teams?.[side] || []).map((participant) => participant.noteColor));
      return DEBATE_NOTE_COLORS.find((color) => !used.has(color)) || DEBATE_NOTE_COLORS[0];
    }

    function createLocalDebateParticipant(noteColor = DEBATE_NOTE_COLORS[0]) {
      return {
        clientId: localPlayer.clientId,
        userId: localPlayer.userId || null,
        displayName: localPlayer.displayName || "Guest",
        colorId: localPlayer.colorId || manifest.colors[0].id,
        noteColor,
        joinedAtMs: Date.now()
      };
    }

    function removeLocalDebateRole(state) {
      ["pro", "con"].forEach((side) => {
        state.teams[side] = (state.teams[side] || []).filter((participant) => participant.clientId !== localPlayer.clientId);
        if (state.notes?.[side]) {
          delete state.notes[side][localPlayer.clientId];
        }
      });
      if (state.judge?.clientId === localPlayer.clientId) {
        state.judge = null;
      }
      return state;
    }

    function setDebateState(nextState, options = {}) {
      const normalized = normalizeDebateState(nextState);
      debateState = normalized;
      if (debateState?.status === "ended") {
        debateAudioManager?.disable();
      }
      if (Object.prototype.hasOwnProperty.call(options, "status")) {
        debatePanelStatus = options.status || "";
      }
      if (options.render !== false) {
        renderDebateUi();
      }
      if (options.broadcast && debateState) {
        publishDebateState();
      }
      openDebateAnnouncementIfNeeded();
      updateDebateAudioContext();
    }

    function publishDebateState() {
      if (!debateState || room.id !== DEBATE_ROOM_ID) {
        return;
      }
      channel?.sendDebate({ debateState: cloneDebateState(debateState) });
      publishPresence(true);
    }

    function sendDebateSignal(payload) {
      if (!payload || room.id !== DEBATE_ROOM_ID || !debateState) {
        return;
      }
      channel?.sendDebateSignal({
        debateSignal: {
          roomId: DEBATE_ROOM_ID,
          sessionId: debateState.sessionId,
          ...payload
        }
      });
    }

    function getDebateAudioPeers() {
      return Array.from(remotePlayers.values())
        .filter((player) => player.roomId === DEBATE_ROOM_ID && player.debateAudio?.enabled)
        .map((player) => ({
          clientId: player.clientId,
          displayName: player.displayName || "Guest",
          debateAudio: player.debateAudio
        }));
    }

    function getDebateAudioRoute(nowMs = Date.now()) {
      return debateRules.createAudioRoute(debateState, localPlayer.clientId, nowMs);
    }

    function updateDebateAudioContext(nowMs = Date.now()) {
      if (!debateAudioManager) {
        return;
      }
      debateAudioManager.update({
        sessionId: debateState?.sessionId || "",
        debateStatus: debateState?.status || "",
        route: getDebateAudioRoute(nowMs),
        peers: getDebateAudioPeers()
      });
    }

    function receiveDebateSignal(payload) {
      const signal = payload?.debateSignal || payload;
      if (!signal || signal.roomId !== DEBATE_ROOM_ID || signal.toClientId !== localPlayer.clientId) {
        return;
      }
      debateAudioManager?.handleSignal(signal);
    }

    function shouldAcceptDebateState(incoming) {
      if (!incoming) {
        return false;
      }
      if (!debateState) {
        return true;
      }
      if (incoming.sessionId !== debateState.sessionId) {
        if (isDebateBlocking(debateState) && incoming.updatedAtMs < debateState.updatedAtMs) {
          return false;
        }
        return true;
      }
      return incoming.updatedAtMs >= debateState.updatedAtMs;
    }

    function receiveRemoteDebate(payload) {
      const incoming = normalizeDebateState(payload?.debateState || payload);
      if (!shouldAcceptDebateState(incoming)) {
        return;
      }
      setDebateState(incoming, { render: true, status: "" });
      if (isLocalDebateHost()) {
        publishPresence(true);
      }
    }

    function syncDebateStateFromPresence(presenceRows = []) {
      const latest = presenceRows
        .map((presence) => normalizeDebateState(presence?.debateRoom))
        .filter(Boolean)
        .sort((left, right) => right.updatedAtMs - left.updatedAtMs)[0] || null;
      if (latest && shouldAcceptDebateState(latest)) {
        setDebateState(latest, { render: true, status: "" });
      }
    }

    function createDebateRoom() {
      if (isDebateBlocking(debateState)) {
        debatePanelStatus = "A Debate Lab room is already active.";
        renderDebateUi();
        return;
      }
      const nowMs = Date.now();
      const side = normalizeDebateSide(debateDraft.hostSide);
      const next = {
        schema: DEBATE_SCHEMA,
        roomId: DEBATE_ROOM_ID,
        sessionId: createDebateId("debate-room"),
        joinCode: createDebateJoinCode(),
        hostClientId: localPlayer.clientId,
        hostName: localPlayer.displayName || "Host",
        topicId: getDebateTopicId(debateDraft.topicId),
        judgeMode: Boolean(debateDraft.judgeMode),
        judge: null,
        teams: { pro: [], con: [] },
        notes: { pro: {}, con: {} },
        status: "setup",
        createdAtMs: nowMs,
        updatedAtMs: nowMs
      };
      next.teams[side].push(createLocalDebateParticipant(getNextDebateNoteColor(next, side)));
      setDebateState(next, { broadcast: true, status: "Room created. Share the join code." });
    }

    function getDebateStartIssues(state = debateState) {
      return debateRules.getStartIssues(state);
    }

    function buildDebateAnnouncement(state) {
      const motion = getDebateMotion(state.topicId);
      const proNames = state.teams.pro.map(getDebateParticipantName).join(", ");
      const conNames = state.teams.con.map(getDebateParticipantName).join(", ");
      const judgeSentence = state.judgeMode && state.judge
        ? `At the end, Judge ${getDebateParticipantName(state.judge)} will give us the winning team.`
        : "At the end, Our audience and the debators will have two minutes to share their opinion on who won the debate and why.";
      return [
        "Dear speakers and audience,",
        `Today's motion is "${motion}".`,
        `On my right, our PRO team's speakers are ${proNames}.`,
        `On my left, our CON team's speakers are ${conNames}.`,
        `We will start with a 5mn preparation period, then, each speaker will have 3mn max to state, explain, defend their position. Between each speaker, we have a one minute transition period. ${judgeSentence}`,
        "Please speakers, turn on your microphones, Please audience, turn on your speakers.",
        "Let the 5mn prep start!"
      ].join("\n");
    }

    function startDebate() {
      if (!isLocalDebateHost() || debateState?.status !== "setup") {
        return;
      }
      const issues = getDebateStartIssues(debateState);
      if (issues.length) {
        debatePanelStatus = issues[0];
        renderDebateUi();
        return;
      }
      const nowMs = Date.now();
      const next = cloneDebateState();
      next.status = "running";
      next.startedAtMs = nowMs;
      next.endedAtMs = null;
      next.speechId = `${next.sessionId}-${nowMs}`;
      next.announcement = buildDebateAnnouncement(next);
      touchDebateState(next);
      setDebateState(next, { broadcast: true, status: "" });
    }

    function endDebate() {
      if (!isLocalDebateHost() || debateState?.status !== "running") {
        return;
      }
      const next = cloneDebateState();
      next.status = "ended";
      next.endedAtMs = Date.now();
      touchDebateState(next);
      setDebateState(next, { broadcast: true, status: "Debate ended." });
    }

    function setActiveDebateTopic(topicId) {
      if (!isLocalDebateHost() || debateState?.status !== "setup") {
        return;
      }
      const next = cloneDebateState();
      next.topicId = getDebateTopicId(topicId);
      touchDebateState(next);
      setDebateState(next, { broadcast: true, status: "Topic changed." });
    }

    function cycleDebateTopic() {
      const topics = getDebateTopics();
      if (!topics.length) {
        return;
      }
      const currentId = debateState && isLocalDebateHost() && debateState.status === "setup"
        ? debateState.topicId
        : debateDraft.topicId;
      const currentIndex = topics.findIndex((topic) => String(topic.id) === String(currentId));
      const nextTopic = topics[(currentIndex + 1 + topics.length) % topics.length] || topics[0];
      if (debateState && isLocalDebateHost() && debateState.status === "setup") {
        setActiveDebateTopic(nextTopic.id);
        return;
      }
      debateDraft.topicId = String(nextTopic.id);
      renderDebateUi();
    }

    function setDebateJudgeMode(enabled) {
      if (debateState && isLocalDebateHost() && debateState.status === "setup") {
        const next = cloneDebateState();
        next.judgeMode = Boolean(enabled);
        if (!next.judgeMode) {
          next.judge = null;
        }
        touchDebateState(next);
        setDebateState(next, { broadcast: true, status: next.judgeMode ? "Judge mode on." : "Judge mode off." });
        return;
      }
      debateDraft.judgeMode = Boolean(enabled);
      renderDebateUi();
    }

    function chooseHostDebateSide(side) {
      const normalizedSide = normalizeDebateSide(side);
      if (debateState && isLocalDebateHost() && debateState.status === "setup") {
        const next = removeLocalDebateRole(cloneDebateState());
        if (next.teams[normalizedSide].length >= DEBATE_MAX_TEAM_SIZE) {
          debatePanelStatus = `${getDebateSideLabel(normalizedSide)} is full.`;
          renderDebateUi();
          return;
        }
        next.teams[normalizedSide].push(createLocalDebateParticipant(getNextDebateNoteColor(next, normalizedSide)));
        touchDebateState(next);
        setDebateState(next, { broadcast: true, status: `Host joined ${getDebateSideLabel(normalizedSide)}.` });
        return;
      }
      debateDraft.hostSide = normalizedSide;
      renderDebateUi();
    }

    function joinDebateAs(role) {
      if (!debateState || debateState.status !== "setup") {
        return;
      }
      if (normalizeDebateCode(debateDraft.joinCode) !== debateState.joinCode && !getLocalDebateRole()) {
        debatePanelStatus = "Enter the host's join code first.";
        renderDebateUi();
        return;
      }
      const next = removeLocalDebateRole(cloneDebateState());
      if (role === "judge") {
        if (!next.judgeMode) {
          debatePanelStatus = "This room is not using a judge.";
          renderDebateUi();
          return;
        }
        if (next.judge && next.judge.clientId !== localPlayer.clientId) {
          debatePanelStatus = `${getDebateParticipantName(next.judge)} is already judging.`;
          renderDebateUi();
          return;
        }
        next.judge = createLocalDebateParticipant("#fff2b5");
        touchDebateState(next);
        setDebateState(next, { broadcast: true, status: "Joined as judge." });
        return;
      }
      const side = normalizeDebateSide(role);
      if (next.teams[side].length >= DEBATE_MAX_TEAM_SIZE) {
        debatePanelStatus = `${getDebateSideLabel(side)} is full.`;
        renderDebateUi();
        return;
      }
      next.teams[side].push(createLocalDebateParticipant(getNextDebateNoteColor(next, side)));
      touchDebateState(next);
      setDebateState(next, { broadcast: true, status: `Joined ${getDebateSideLabel(side)}.` });
    }

    function leaveDebateRole() {
      if (!debateState || debateState.status !== "setup" || isLocalDebateHost()) {
        return;
      }
      const next = removeLocalDebateRole(cloneDebateState());
      touchDebateState(next);
      setDebateState(next, { broadcast: true, status: "Left the signup list." });
    }

    function updateLocalDebateNote(side, text) {
      if (!debateState || getLocalDebateRole() !== side) {
        return;
      }
      const next = cloneDebateState();
      next.notes[side][localPlayer.clientId] = String(text || "").slice(0, DEBATE_NOTE_MAX_LENGTH);
      touchDebateState(next);
      debateState = normalizeDebateState(next);
      window.clearTimeout(debateNoteSendTimer);
      debateNoteSendTimer = window.setTimeout(() => {
        debateNoteSendTimer = 0;
        publishDebateState();
      }, 180);
    }

    function buildDebateTimeline(state = debateState) {
      return debateRules.buildTimeline(state);
    }

    function getDebateClock(state = debateState, nowMs = Date.now()) {
      return debateRules.getClock(state, nowMs);
    }

    function getDebateClockKey(clock) {
      return debateRules.getClockKey(clock, debateState);
    }

    function maybeAutoEndDebate(nowMs = Date.now()) {
      const clock = getDebateClock(debateState, nowMs);
      if (isLocalDebateHost() && debateState?.status === "running" && clock && clock.totalRemaining <= 0) {
        endDebate();
      }
    }

    function getDebateModeratorPosition(nowMs = Date.now()) {
      if (!debateState || debateState.status === "setup") {
        return { ...DEBATE_CENTER_STAGE, direction: "down", moving: false };
      }
      if (debateState.status === "running") {
        const walkStart = Number(debateState.startedAtMs || 0) + DEBATE_INTRO_MS;
        const progress = clamp((nowMs - walkStart) / DEBATE_NPC_WALK_MS, 0, 1);
        if (progress <= 0) {
          return { ...DEBATE_CENTER_STAGE, direction: "down", moving: false };
        }
        if (progress >= 1) {
          return { ...DEBATE_SIDE_STAGE, direction: "down", moving: false };
        }
        return {
          x: DEBATE_CENTER_STAGE.x + ((DEBATE_SIDE_STAGE.x - DEBATE_CENTER_STAGE.x) * progress),
          y: DEBATE_CENTER_STAGE.y + ((DEBATE_SIDE_STAGE.y - DEBATE_CENTER_STAGE.y) * progress),
          direction: "right",
          moving: true
        };
      }
      if (debateState.status === "ended" && debateState.endedAtMs) {
        const progress = clamp((nowMs - debateState.endedAtMs) / DEBATE_NPC_WALK_MS, 0, 1);
        if (progress >= 1) {
          return { ...DEBATE_CENTER_STAGE, direction: "down", moving: false };
        }
        return {
          x: DEBATE_SIDE_STAGE.x + ((DEBATE_CENTER_STAGE.x - DEBATE_SIDE_STAGE.x) * progress),
          y: DEBATE_SIDE_STAGE.y + ((DEBATE_CENTER_STAGE.y - DEBATE_SIDE_STAGE.y) * progress),
          direction: "left",
          moving: progress > 0
        };
      }
      return { ...DEBATE_CENTER_STAGE, direction: "down", moving: false };
    }

    function getDebateNpcRenderState(entry, nowMs = Date.now()) {
      if (room.id !== DEBATE_ROOM_ID || entry.id !== DEBATE_MODERATOR_NPC_ID) {
        return entry;
      }
      const position = getDebateModeratorPosition(nowMs);
      return {
        ...entry,
        x: position.x,
        y: position.y,
        direction: position.direction,
        moving: position.moving
      };
    }

    function updateDebateNpcElements(nowMs) {
      if (room.id !== DEBATE_ROOM_ID) {
        return;
      }
      const entry = getNpcById(DEBATE_MODERATOR_NPC_ID);
      const element = npcElements.get(DEBATE_MODERATOR_NPC_ID);
      if (!entry || !element) {
        return;
      }
      const npc = getDebateNpcRenderState(entry, Date.now());
      updatePlayerElement(element, {
        clientId: npc.id,
        displayName: npc.label || "NPC",
        x: npc.x,
        y: npc.y,
        direction: npc.direction || "down",
        colorId: npc.colorId || "red",
        moving: Boolean(npc.moving)
      }, nowMs);
    }

    function renderDebateTopicSelect(selectedId, dataAttribute) {
      const select = createEl("select", "campus2d-debate-select", {
        "data-campus2d-ui": "",
        [dataAttribute]: ""
      });
      getDebateTopics().forEach((topic, index) => {
        const option = createEl("option", "");
        option.value = String(topic.id);
        option.textContent = `${index + 1}. ${shortenDebateText(topic.motion, 92)}`;
        option.selected = String(topic.id) === String(selectedId);
        select.append(option);
      });
      return select;
    }

    function createDebateActionButton(label, action, className = "", attributes = {}) {
      const button = createTextElement("button", `campus2d-debate-button ${className}`.trim(), label, {
        type: "button",
        "data-campus2d-debate-action": action,
        "data-campus2d-ui": "",
        ...attributes
      });
      if (attributes.disabled) {
        button.disabled = true;
      }
      return button;
    }

    function createDebateTeamButton(side, label, attributes = {}) {
      const button = createTextElement("button", `campus2d-debate-button ${normalizeDebateSide(side)}`, label, {
        type: "button",
        "data-campus2d-debate-team": normalizeDebateSide(side),
        "data-campus2d-ui": "",
        ...attributes
      });
      if (attributes.disabled) {
        button.disabled = true;
      }
      return button;
    }

    function renderDebateCreateControls(panel) {
      const form = createEl("form", "campus2d-debate-card campus2d-debate-create", {
        "data-campus2d-debate-create-form": "",
        "data-campus2d-ui": ""
      });
      form.append(
        createTextElement("p", "campus2d-debate-eyebrow", "Host room"),
        createTextElement("h3", "", "Create Debate Lab")
      );
      const topicRow = createEl("label", "campus2d-debate-field");
      topicRow.append(createTextElement("span", "", "Topic"), renderDebateTopicSelect(debateDraft.topicId, "data-campus2d-debate-create-topic"));
      const topicActions = createEl("div", "campus2d-debate-actions");
      topicActions.append(createDebateActionButton("Change topic", "cycle-topic", "secondary"));
      const sideRow = createEl("div", "campus2d-debate-segment", { role: "group", "aria-label": "Host team" });
      ["pro", "con"].forEach((side) => {
        const button = createDebateTeamButton(side, getDebateSideLabel(side));
        button.classList.toggle("is-active", debateDraft.hostSide === side);
        sideRow.append(button);
      });
      const judgeLabel = createEl("label", "campus2d-debate-check");
      const judgeInput = createEl("input", "", {
        type: "checkbox",
        "data-campus2d-debate-judge-mode": "",
        "data-campus2d-ui": ""
      });
      judgeInput.checked = Boolean(debateDraft.judgeMode);
      judgeLabel.append(judgeInput, createTextElement("span", "", "Use a judge"));
      const submit = createTextElement("button", "campus2d-debate-button primary", "Create room", {
        type: "submit",
        "data-campus2d-ui": ""
      });
      form.append(topicRow, topicActions, createTextElement("span", "campus2d-debate-label", "Host team"), sideRow, judgeLabel, submit);
      panel.append(form);
    }

    function renderDebateTeamCard(side, panel) {
      const team = debateState?.teams?.[side] || [];
      const card = createEl("section", `campus2d-debate-team-card ${side}`);
      card.append(
        createTextElement("span", "campus2d-debate-team-label", getDebateSideLabel(side)),
        createTextElement("strong", "", `${team.length}/${DEBATE_MAX_TEAM_SIZE}`)
      );
      const list = createEl("div", "campus2d-debate-roster");
      for (let index = 0; index < DEBATE_MAX_TEAM_SIZE; index += 1) {
        const participant = team[index];
        const item = createEl("div", "campus2d-debate-roster-row");
        const swatch = createEl("span", "campus2d-debate-note-swatch", { "aria-hidden": "true" });
        swatch.style.setProperty("--debate-note-color", participant?.noteColor || "rgba(255,255,255,0.24)");
        item.append(swatch, createTextElement("span", "", participant ? getDebateParticipantName(participant) : `Speaker ${index + 1}`));
        item.classList.toggle("is-empty", !participant);
        list.append(item);
      }
      card.append(list);
      panel.append(card);
    }

    function renderDebateJudgeCard(panel) {
      if (!debateState?.judgeMode) {
        return;
      }
      const card = createEl("section", "campus2d-debate-judge-card");
      card.append(
        createTextElement("span", "campus2d-debate-team-label", "Judge"),
        createTextElement("strong", "", debateState.judge ? getDebateParticipantName(debateState.judge) : "Open")
      );
      panel.append(card);
    }

    function renderDebateRoomSummary(panel) {
      const topic = getDebateTopic(debateState.topicId);
      const card = createEl("section", "campus2d-debate-card campus2d-debate-summary");
      const header = createEl("div", "campus2d-debate-summary-header");
      header.append(
        createTextElement("span", "campus2d-debate-eyebrow", debateState.status === "running" ? "In progress" : debateState.status === "ended" ? "Ended" : "Room open"),
        createTextElement("strong", "", isLocalDebateHost() ? `Join code ${debateState.joinCode}` : "Join by code")
      );
      const motion = createTextElement("h3", "", topic?.motion || "Debate Lab");
      card.append(header, motion);
      if (isLocalDebateHost() && debateState.status === "setup") {
        const topicRow = createEl("label", "campus2d-debate-field");
        topicRow.append(createTextElement("span", "", "Topic"), renderDebateTopicSelect(debateState.topicId, "data-campus2d-debate-topic-select"));
        const actions = createEl("div", "campus2d-debate-actions");
        actions.append(createDebateActionButton("Change topic", "cycle-topic", "secondary"));
        const judgeLabel = createEl("label", "campus2d-debate-check");
        const judgeInput = createEl("input", "", {
          type: "checkbox",
          "data-campus2d-debate-judge-mode": "",
          "data-campus2d-ui": ""
        });
        judgeInput.checked = Boolean(debateState.judgeMode);
        judgeLabel.append(judgeInput, createTextElement("span", "", "Use a judge"));
        card.append(topicRow, actions, judgeLabel);
      }
      const timer = createEl("div", "campus2d-debate-timer-card");
      timer.append(
        createTextElement("span", "", "Countdown"),
        createTextElement("strong", "", "--:--", { "data-campus2d-debate-timer": "" }),
        createTextElement("em", "", "Setup", { "data-campus2d-debate-phase": "" })
      );
      card.append(timer);
      panel.append(card);
    }

    function renderDebateSignupControls(panel) {
      if (!debateState || debateState.status !== "setup") {
        return;
      }
      const role = getLocalDebateRole();
      const isHost = isLocalDebateHost();
      const card = createEl("section", "campus2d-debate-card campus2d-debate-signup");
      if (!role && !isHost) {
        const field = createEl("label", "campus2d-debate-field");
        const input = createEl("input", "campus2d-debate-code-input", {
          type: "text",
          inputmode: "latin",
          maxlength: String(DEBATE_JOIN_CODE_LENGTH),
          autocomplete: "off",
          placeholder: "Join code",
          "data-campus2d-debate-code-input": "",
          "data-campus2d-ui": ""
        });
        input.value = debateDraft.joinCode;
        field.append(createTextElement("span", "", "Code"), input);
        card.append(createTextElement("p", "campus2d-debate-eyebrow", "Join room"), field);
      } else {
        card.append(createTextElement("p", "campus2d-debate-eyebrow", isHost ? "Host signup" : "Your signup"));
      }
      const buttons = createEl("div", "campus2d-debate-actions");
      ["pro", "con"].forEach((side) => {
        const current = role === side;
        const full = debateState.teams[side].length >= DEBATE_MAX_TEAM_SIZE && !current;
        const button = createDebateTeamButton(side, current ? `${getDebateSideLabel(side)} selected` : `Join ${getDebateSideLabel(side)}`, {
          disabled: full || current
        });
        button.classList.toggle("is-active", current);
        buttons.append(button);
      });
      if (debateState.judgeMode && !isHost) {
        const judgeCurrent = role === "judge";
        const judgeTaken = debateState.judge && !judgeCurrent;
        const judgeButton = createDebateActionButton(judgeCurrent ? "Judge selected" : "Join as judge", "join-judge", "secondary", {
          disabled: judgeTaken || judgeCurrent
        });
        judgeButton.classList.toggle("is-active", judgeCurrent);
        buttons.append(judgeButton);
      }
      if (role && !isHost) {
        buttons.append(createDebateActionButton("Leave", "leave-role", "secondary"));
      }
      card.append(buttons);
      panel.append(card);
    }

    function renderDebateStartControls(panel) {
      if (!debateState || debateState.status !== "setup") {
        return;
      }
      const card = createEl("section", "campus2d-debate-card campus2d-debate-start");
      const issues = getDebateStartIssues();
      const list = createEl("ul", "campus2d-debate-requirements");
      if (issues.length) {
        issues.forEach((issue) => list.append(createTextElement("li", "", issue)));
      } else {
        list.append(createTextElement("li", "is-ready", "Teams are ready."));
      }
      card.append(createTextElement("p", "campus2d-debate-eyebrow", "Start gate"), list);
      if (isLocalDebateHost()) {
        card.append(createDebateActionButton("Let's Debate!", "start", "primary", { disabled: issues.length > 0 }));
      } else {
        card.append(createTextElement("p", "campus2d-debate-muted", "Only the host can start."));
      }
      panel.append(card);
    }

    function renderDebateRunningControls(panel) {
      if (!debateState || debateState.status !== "running") {
        return;
      }
      const card = createEl("section", "campus2d-debate-card campus2d-debate-running");
      card.append(
        createTextElement("p", "campus2d-debate-eyebrow", "Live round"),
        createTextElement("strong", "", "Debate in progress")
      );
      if (isLocalDebateHost()) {
        card.append(createDebateActionButton("End debate", "end", "danger"));
      } else {
        card.append(createTextElement("p", "campus2d-debate-muted", "The host controls this debate until it ends."));
      }
      panel.append(card);
    }

    function renderDebateEndedControls(panel) {
      if (!debateState || debateState.status !== "ended") {
        return;
      }
      const card = createEl("section", "campus2d-debate-card campus2d-debate-ended");
      card.append(
        createTextElement("p", "campus2d-debate-eyebrow", "Complete"),
        createTextElement("strong", "", "Ready for a new Debate Lab room"),
        createDebateActionButton("Create new debate", "new-room", "primary")
      );
      panel.append(card);
    }

    function renderDebateNotes(panel) {
      const role = getLocalDebateRole();
      if (!["pro", "con"].includes(role)) {
        return;
      }
      const card = createEl("section", `campus2d-debate-card campus2d-debate-notes ${role}`);
      card.append(
        createTextElement("p", "campus2d-debate-eyebrow", `${getDebateSideLabel(role)} notes`),
        createTextElement("h3", "", "Team notes")
      );
      const notes = debateState.notes?.[role] || {};
      const list = createEl("div", "campus2d-debate-note-list");
      (debateState.teams[role] || []).forEach((participant) => {
        const label = createEl("label", "campus2d-debate-note-block");
        const name = createTextElement("span", "", getDebateParticipantName(participant));
        name.style.setProperty("--debate-note-color", participant.noteColor);
        const textarea = createEl("textarea", "campus2d-debate-note-input", {
          maxlength: String(DEBATE_NOTE_MAX_LENGTH),
          rows: "4",
          "data-campus2d-debate-note-input": "",
          "data-campus2d-debate-note-side": role,
          "data-campus2d-debate-note-client": participant.clientId,
          "data-campus2d-ui": ""
        });
        textarea.value = notes[participant.clientId] || "";
        textarea.readOnly = participant.clientId !== localPlayer.clientId;
        textarea.style.setProperty("--debate-note-color", participant.noteColor);
        label.append(name, textarea);
        list.append(label);
      });
      card.append(list);
      panel.append(card);
    }

    function getDebateAudioStatusText() {
      if (!debateAudioStatus.supported) {
        return "Audio is not supported in this browser.";
      }
      if (debateAudioStatus.permissionDenied) {
        return "Microphone permission was denied.";
      }
      if (debateAudioStatus.connectionIssue || debateAudioStatus.error) {
        return debateAudioStatus.error || "Audio could not connect on this network.";
      }
      if (debateAudioStatus.connecting) {
        return "Connecting microphone...";
      }
      if (!debateAudioStatus.enabled) {
        return "Microphone off.";
      }
      if (debateAudioStatus.muted) {
        return "Muted.";
      }
      if (debateAudioStatus.canSend) {
        return "Microphone live.";
      }
      return "Listening. Your microphone opens only when the debate route allows it.";
    }

    function getDebateAudioPeerText() {
      const connected = debateAudioStatus.peerCount || 0;
      const expected = debateAudioStatus.desiredPeerCount || 0;
      return expected > 0 ? `${connected}/${expected} connected` : `${connected} connected`;
    }

    function updateDebateAudioStatusDisplays() {
      root.querySelectorAll("[data-campus2d-debate-audio-status]").forEach((element) => {
        element.textContent = getDebateAudioStatusText();
      });
      root.querySelectorAll("[data-campus2d-debate-audio-route]").forEach((element) => {
        element.textContent = debateAudioStatus.routeLabel || "Audio idle";
      });
      root.querySelectorAll("[data-campus2d-debate-audio-peers]").forEach((element) => {
        element.textContent = getDebateAudioPeerText();
      });
    }

    function renderDebateAudioControls(panel) {
      if (!debateState) {
        return;
      }
      const card = createEl("section", `campus2d-debate-card campus2d-debate-audio${debateAudioStatus.connectionIssue ? " is-warning" : ""}`);
      card.append(
        createTextElement("p", "campus2d-debate-eyebrow", "Audio"),
        createTextElement("strong", "", debateAudioStatus.enabled ? "Microphone ready" : "Join audio")
      );
      const status = createTextElement("p", "campus2d-debate-muted", getDebateAudioStatusText(), {
        "data-campus2d-debate-audio-status": "",
        "aria-live": "polite"
      });
      const route = createEl("div", "campus2d-debate-audio-route");
      route.append(
        createTextElement("span", "", debateAudioStatus.routeLabel || "Audio idle", { "data-campus2d-debate-audio-route": "" }),
        createTextElement("em", "", getDebateAudioPeerText(), { "data-campus2d-debate-audio-peers": "" })
      );
      card.append(status, route);
      const actions = createEl("div", "campus2d-debate-actions");
      if (!debateAudioStatus.supported) {
        actions.append(createTextElement("p", "campus2d-debate-muted", "Use a browser with WebRTC audio support."));
      } else if (!debateAudioStatus.enabled) {
        actions.append(createDebateActionButton("Enable mic", "enable-audio", "primary", {
          disabled: debateAudioStatus.connecting || !debateState
        }));
      } else {
        actions.append(createDebateActionButton(debateAudioStatus.muted ? "Unmute" : "Mute", debateAudioStatus.muted ? "unmute-audio" : "mute-audio", "secondary"));
        actions.append(createDebateActionButton("Leave audio", "disable-audio", "secondary"));
      }
      card.append(actions);
      panel.append(card);
    }

    function getDebateFocusSnapshot() {
      const active = document.activeElement;
      if (!active || !activityMount.contains(active)) {
        return null;
      }
      if (active.matches("[data-campus2d-debate-note-input]")) {
        return {
          type: "note",
          side: active.dataset.campus2dDebateNoteSide,
          clientId: active.dataset.campus2dDebateNoteClient,
          selectionStart: active.selectionStart,
          selectionEnd: active.selectionEnd
        };
      }
      if (active.matches("[data-campus2d-debate-code-input]")) {
        return {
          type: "code",
          selectionStart: active.selectionStart,
          selectionEnd: active.selectionEnd
        };
      }
      return null;
    }

    function restoreDebateFocus(snapshot) {
      if (!snapshot) {
        return;
      }
      let target = null;
      if (snapshot.type === "note") {
        target = activityMount.querySelector(`[data-campus2d-debate-note-side="${snapshot.side}"][data-campus2d-debate-note-client="${snapshot.clientId}"]`);
      } else if (snapshot.type === "code") {
        target = activityMount.querySelector("[data-campus2d-debate-code-input]");
      }
      if (!target) {
        return;
      }
      target.focus({ preventScroll: true });
      if (Number.isInteger(snapshot.selectionStart) && target.setSelectionRange) {
        target.setSelectionRange(snapshot.selectionStart, snapshot.selectionEnd);
      }
    }

    function renderDebatePanel() {
      const focusSnapshot = getDebateFocusSnapshot();
      const panel = createEl("section", "campus2d-debate-panel", {
        "data-campus2d-debate-panel": "",
        "data-campus2d-ui": "",
        "aria-label": "Debate Lab multiplayer"
      });
      const header = createEl("header", "campus2d-debate-header");
      header.append(createTextElement("p", "campus2d-debate-eyebrow", "Multiplayer"), createTextElement("h2", "", "Debate Lab"));
      panel.append(header);
      if (debatePanelStatus) {
        panel.append(createTextElement("p", "campus2d-debate-status", debatePanelStatus, { "aria-live": "polite" }));
      }
      if (!debateState || debateState.status === "ended") {
        if (debateState?.status === "ended") {
          renderDebateRoomSummary(panel);
          renderDebateEndedControls(panel);
        }
        renderDebateCreateControls(panel);
      } else {
        renderDebateRoomSummary(panel);
        const teams = createEl("div", "campus2d-debate-team-grid");
        renderDebateTeamCard("pro", teams);
        renderDebateTeamCard("con", teams);
        renderDebateJudgeCard(teams);
        panel.append(teams);
        renderDebateSignupControls(panel);
        renderDebateStartControls(panel);
        renderDebateRunningControls(panel);
        renderDebateAudioControls(panel);
        renderDebateNotes(panel);
      }
      activityMount.replaceChildren(panel);
      lastDebateClockKey = getDebateClockKey(getDebateClock(debateState));
      updateDebateTimerDisplays(Date.now());
      restoreDebateFocus(focusSnapshot);
    }

    function renderDebateWorldScreen() {
      debateLayer.replaceChildren();
      if (room.id !== DEBATE_ROOM_ID) {
        return;
      }
      const screen = createEl("section", "campus2d-debate-screen", { "aria-hidden": "true" });
      screen.style.left = `${DEBATE_BOARD_RECT.x}px`;
      screen.style.top = `${DEBATE_BOARD_RECT.y}px`;
      screen.style.width = `${DEBATE_BOARD_RECT.width}px`;
      screen.style.height = `${DEBATE_BOARD_RECT.height}px`;
      screen.append(
        createTextElement("span", "campus2d-debate-screen-label", debateState?.status === "running" ? "Live Debate Lab" : "Debate Lab"),
        createTextElement("strong", "campus2d-debate-screen-topic", getDebateMotion()),
        createTextElement("span", "campus2d-debate-screen-phase", debateState ? "Setup" : "Choose a topic", { "data-campus2d-debate-phase": "" }),
        createTextElement("em", "campus2d-debate-screen-timer", debateState?.status === "running" ? "--:--" : "", { "data-campus2d-debate-timer": "" })
      );
      debateLayer.append(screen);
    }

    function renderDebateUi() {
      renderDebateWorldScreen();
      if (room.id === DEBATE_ROOM_ID) {
        renderDebatePanel();
        return;
      }
      if (activityMount.querySelector("[data-campus2d-debate-panel]")) {
        activityMount.replaceChildren();
      }
    }

    function updateDebateTimerDisplays(nowMs = Date.now()) {
      const clock = getDebateClock(debateState, nowMs);
      const phaseText = clock
        ? clock.phase.label
        : debateState?.status === "ended"
          ? "Complete"
          : debateState?.status === "setup"
            ? "Setup"
            : "Ready";
      const timerText = clock ? formatDebateClock(clock.remaining) : "";
      root.querySelectorAll("[data-campus2d-debate-phase]").forEach((element) => {
        element.textContent = phaseText;
      });
      root.querySelectorAll("[data-campus2d-debate-timer]").forEach((element) => {
        element.textContent = timerText;
      });
    }

    function updateDebateRuntime(nowMs) {
      updateDebateNpcElements(nowMs);
      if (room.id !== DEBATE_ROOM_ID || !debateState) {
        return;
      }
      maybeAutoEndDebate(Date.now());
      const second = Math.floor(Date.now() / 1000);
      if (second === lastDebateClockSecond) {
        return;
      }
      lastDebateClockSecond = second;
      const clock = getDebateClock(debateState);
      const clockKey = getDebateClockKey(clock);
      updateDebateAudioContext(Date.now());
      if (clockKey !== lastDebateClockKey && activityMount.querySelector("[data-campus2d-debate-panel]")) {
        lastDebateClockKey = clockKey;
        renderDebateUi();
        return;
      }
      updateDebateTimerDisplays(Date.now());
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
      const isSeatZone = selectedZoneType === "seat";
      const currentSeatDirection = isSeatZone && selectedZone
        ? normalizeSeatDirection(selectedZone.direction, selectedSeatDirection)
        : selectedSeatDirection;
      zoneTypeSelect.value = selectedZoneType;
      seatDirectionSelect.value = currentSeatDirection;
      zoneFieldGrid.hidden = !zoneEditorEnabled;
      debugActions.hidden = !zoneEditorEnabled;
      zoneSelectionLabel.hidden = !zoneEditorEnabled;
      seatDirectionControl.hidden = !zoneEditorEnabled || !isSeatZone;
      zoneTypeSelect.disabled = !zoneEditorEnabled;
      seatDirectionSelect.disabled = !zoneEditorEnabled || !isSeatZone;
      if (!zoneEditorEnabled) {
        zoneSelectionLabel.textContent = "Zone editor off";
      } else {
        zoneSelectionLabel.textContent = selectedZone
          ? `${getZoneConfig(selectedZoneType).label} ${selectedZone.id}${isSeatZone ? ` facing ${currentSeatDirection}` : ""}`
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
            : (walkability.inSeat
              ? "sitting-only zone"
              : (walkability.inBlockedZone ? "blocked" : "walkable"));
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

    function renderDecorations() {
      decorationsLayer.replaceChildren(...(room.decorations || []).map((entry) => {
        const image = createEl("img", "campus2d-decoration", {
          alt: "",
          draggable: "false"
        });
        image.src = entry.asset;
        image.style.left = `${entry.x}px`;
        image.style.top = `${entry.y}px`;
        image.style.width = `${entry.width}px`;
        image.style.height = `${entry.height}px`;
        image.style.zIndex = String(entry.zIndex || Math.round(entry.y + entry.height));
        return image;
      }));
    }

    function renderNpcs() {
      npcElements.forEach((element) => element.remove());
      npcElements.clear();
      (room.npcs || []).forEach((entry) => {
        const npc = getDebateNpcRenderState(entry, Date.now());
        const element = createPlayerElement({
          clientId: npc.id,
          displayName: npc.label || "NPC",
          x: npc.x,
          y: npc.y,
          direction: npc.direction || "down",
          colorId: npc.colorId || "red",
          moving: Boolean(npc.moving)
        }, false, true);
        npcElements.set(npc.id, element);
        npcsLayer.append(element);
      });
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
      renderLocalCard();
      renderDecorations();
      renderNpcs();
      renderHotspots();
      renderPortals();
      renderSeats();
      renderBehindZones();
      renderDebateUi();
      renderDebugOverlay();
      updateDebugPanel();
      updatePlayerElement(localElement, localPlayer, performance.now());
      renderRemotePlayers();
      updateConnectedCount();
      updateCamera();
    }

    function screenToWorld(clientX, clientY) {
      const rect = viewport.getBoundingClientRect();
      return {
        x: (clientX - rect.left - camera.x) / camera.scale,
        y: (clientY - rect.top - camera.y) / camera.scale
      };
    }

    function updateShellHeight() {
      const shell = mountNode.closest("[data-campus2d-shell]");
      if (!shell) {
        return;
      }

      const shellTop = shell.getBoundingClientRect().top;
      const viewportHeight = window.visualViewport?.height || window.innerHeight || 0;
      const availableHeight = Math.max(360, Math.floor(viewportHeight - shellTop));
      shell.style.setProperty("--campus2d-shell-height", `${availableHeight}px`);
    }

    function updateCamera() {
      updateShellHeight();
      const width = viewport.clientWidth || 1;
      const height = viewport.clientHeight || 1;
      const fitScale = Math.min(width / room.width, height / room.height);
      const coverScale = Math.max(width / room.width, height / room.height);
      const targetScale = width < 720 ? 0.76 : 0.86;
      camera.scale = clamp(Math.max(coverScale, targetScale), fitScale, Math.max(coverScale, 1));
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
      updateNpcDialoguePosition();
    }

    function setRoom(roomId, spawnId = "default") {
      const nextRoom = getRoom(roomId);
      if (!nextRoom) {
        return;
      }
      if (room.id === DEBATE_ROOM_ID && nextRoom.id !== DEBATE_ROOM_ID) {
        debateAudioManager?.disable();
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
      remoteElements.forEach((element) => element.remove());
      remoteElements.clear();
      closeNpcDialogue();
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

    function getNormalizedVector(vector, fallback = { x: 0, y: 1 }) {
      const x = Number(vector?.x) || 0;
      const y = Number(vector?.y) || 0;
      const length = Math.hypot(x, y);
      if (length > 0.001) {
        return { x: x / length, y: y / length };
      }
      return fallback;
    }

    function getSeatCenter(seat) {
      const rect = seat?.zone;
      return {
        x: Number.isFinite(Number(seat?.x)) ? Number(seat.x) : rect.x + (rect.width / 2),
        y: Number.isFinite(Number(seat?.y)) ? Number(seat.y) : rect.y + (rect.height / 2)
      };
    }

    function getSeatExitDirections(vector) {
      const normalized = getNormalizedVector(vector);
      return [...SEAT_EXIT_DIRECTIONS].sort((left, right) => {
        const leftScore = (left.x * normalized.x) + (left.y * normalized.y);
        const rightScore = (right.x * normalized.x) + (right.y * normalized.y);
        return rightScore - leftScore;
      });
    }

    function getDistanceToSeatEdge(center, rect, direction) {
      const xDistance = direction.x > 0
        ? ((rect.x + rect.width) - center.x) / direction.x
        : (direction.x < 0 ? (rect.x - center.x) / direction.x : Infinity);
      const yDistance = direction.y > 0
        ? ((rect.y + rect.height) - center.y) / direction.y
        : (direction.y < 0 ? (rect.y - center.y) / direction.y : Infinity);
      const distance = Math.min(xDistance, yDistance);
      return Number.isFinite(distance) ? Math.max(0, distance) : 0;
    }

    function findSeatExitPoint(seat, vector, zones = getEffectiveZones(room)) {
      const rect = seat?.zone;
      if (!rect) {
        return null;
      }
      const center = getSeatCenter(seat);
      const originPoint = { x: localPlayer.x, y: localPlayer.y };
      const directions = getSeatExitDirections(vector);
      for (const offset of SEAT_EXIT_OFFSETS) {
        for (const direction of directions) {
          const edgeDistance = getDistanceToSeatEdge(center, rect, direction);
          const candidate = clampPointToRoom({
            x: center.x + (direction.x * (edgeDistance + offset)),
            y: center.y + (direction.y * (edgeDistance + offset))
          });
          if (isPointInRect(candidate, rect)) {
            continue;
          }
          if (canPlayerStandAt(candidate, zones, originPoint)) {
            return candidate;
          }
        }
      }
      return null;
    }

    function getCurrentSeat(zones = getEffectiveZones(room)) {
      const seats = zones.seats || [];
      if (localPlayer.seatId) {
        const explicitSeat = seats.find((seat) => seat.id === localPlayer.seatId);
        if (explicitSeat) {
          return explicitSeat;
        }
      }
      const playerPoint = { x: localPlayer.x, y: localPlayer.y };
      return seats.find((seat) => seat?.zone && isPointInRect(playerPoint, seat.zone)) || null;
    }

    function standUpFromSeat(vector, zones = getEffectiveZones(room)) {
      const seat = getCurrentSeat(zones);
      if (!localPlayer.seatId && !seat) {
        return true;
      }
      const previousSeatId = localPlayer.seatId;
      localPlayer.seatId = null;
      if (!seat?.zone) {
        return true;
      }
      const playerPoint = { x: localPlayer.x, y: localPlayer.y };
      if (!isPointInRect(playerPoint, seat.zone)) {
        return true;
      }
      const exitPoint = findSeatExitPoint(seat, vector, zones);
      if (!exitPoint) {
        localPlayer.seatId = previousSeatId;
        return false;
      }
      localPlayer.x = exitPoint.x;
      localPlayer.y = exitPoint.y;
      localPlayer.direction = normalizeDirection(getNormalizedVector(vector), localPlayer.direction);
      localPlayer.moving = false;
      return true;
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

      const normalized = { x: vector.x / length, y: vector.y / length };
      const activeZones = getEffectiveZones(room);
      if (!standUpFromSeat(normalized, activeZones)) {
        activeTarget = null;
        localPlayer.moving = false;
        updatePlayerElement(localElement, localPlayer, nowMs);
        return;
      }

      const distance = MOVE_SPEED * deltaSeconds;
      const nextX = localPlayer.x + normalized.x * distance;
      const nextY = localPlayer.y + normalized.y * distance;
      const nextPoint = {
        x: clamp(nextX, 0, room.width),
        y: clamp(nextY, 0, room.height)
      };
      const currentPoint = { x: localPlayer.x, y: localPlayer.y };
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
      updateDebateRuntime(nowMs);
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
        ...getDebatePresencePayload(),
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
          },
          onDebate(payload) {
            receiveRemoteDebate(payload);
          },
          onDebateSignal(payload) {
            receiveDebateSignal(payload);
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
            email: presence.email || "",
            alpacaName: presence.alpacaName || "",
            schoolName: presence.schoolName || "",
            country: presence.country || "",
            wscEventCount: Number(presence.wscEventCount) || 0,
            highestWscRound: presence.highestWscRound || "",
            achievements: normalizeAchievements(presence.achievements),
            debateAudio: presence.debateAudio || null,
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
      updateConnectedCount();
      syncDebateStateFromPresence(presenceRows);
      updateDebateAudioContext();
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
        email: payload.email || previous.email || "",
        alpacaName: payload.alpacaName || previous.alpacaName || "",
        schoolName: payload.schoolName || previous.schoolName || "",
        country: payload.country || previous.country || "",
        wscEventCount: Number(payload.wscEventCount ?? previous.wscEventCount) || 0,
        highestWscRound: payload.highestWscRound || previous.highestWscRound || "",
        achievements: normalizeAchievements(payload.achievements || previous.achievements),
        debateAudio: previous.debateAudio || null,
        createdAt: payload.createdAt || previous.createdAt || null,
        moving: Boolean(previous.x !== payload.x || previous.y !== payload.y)
      };
      remotePlayers.set(payload.clientId, next);
      renderRemotePlayers();
      updateConnectedCount();
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
      const frame = getFrame(player.direction, Boolean(player.seatId) && !player.moving);
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

    function createAchievementDraft(source = {}) {
      return {
        fullName: String(source.fullName || "").trim(),
        rewardType: normalizeAchievementRewardType(source.rewardType),
        round: ACHIEVEMENT_ROUNDS.some((round) => round.value === source.round) ? source.round : ACHIEVEMENT_ROUNDS[0].value,
        city: String(source.city || "").trim(),
        approximateDate: String(source.approximateDate || "").trim()
      };
    }

    function getReporterContact() {
      return localPlayer.email || localPlayer.alpacaName || localPlayer.displayName || localPlayer.userId || "";
    }

    function getFeedbackReporterPayload() {
      return {
        userId: localPlayer.userId || null,
        email: localPlayer.email || "",
        alpacaName: localPlayer.alpacaName || localPlayer.displayName || "",
        displayName: localPlayer.displayName || "",
        schoolName: localPlayer.schoolName || "",
        country: localPlayer.country || ""
      };
    }

    function createField(label, name, value = "", options = {}) {
      const field = createEl("label", "campus2d-form-field");
      const text = createEl("span", "");
      const control = createEl(options.multiline ? "textarea" : "input", "", {
        name,
        autocomplete: options.autocomplete || "off",
        placeholder: options.placeholder || "",
        maxlength: options.maxlength || (options.multiline ? "1200" : "160")
      });
      if (!options.multiline) {
        control.type = options.type || "text";
      } else {
        control.rows = options.rows || "5";
      }
      if (options.required) {
        control.required = true;
      }
      control.value = value || "";
      text.textContent = label;
      field.append(text, control);
      return field;
    }

    function createSelectField(label, name, value, optionsList) {
      const field = createEl("label", "campus2d-form-field");
      const text = createEl("span", "");
      const select = createEl("select", "", { name });
      text.textContent = label;
      optionsList.forEach((entry) => {
        const option = createEl("option", "");
        option.value = entry.value;
        option.textContent = entry.label;
        option.selected = entry.value === value;
        select.append(option);
      });
      field.append(text, select);
      return field;
    }

    function closeFeedbackDialog() {
      activeFeedbackDialog = null;
      feedbackStatus = null;
      feedbackSubmitting = false;
      root.querySelector("[data-campus2d-feedback-dialog]")?.remove();
    }

    function setFeedbackStatus(message, type = "info") {
      feedbackStatus = message ? { message, type } : null;
      const status = root.querySelector("[data-campus2d-feedback-status]");
      if (status) {
        status.textContent = message || "";
        status.dataset.status = type;
        status.hidden = !message;
      }
    }

    function setFeedbackSubmitting(value) {
      feedbackSubmitting = Boolean(value);
      root.querySelectorAll("[data-campus2d-feedback-submit]").forEach((button) => {
        button.disabled = feedbackSubmitting;
      });
    }

    function createFeedbackShell(title, subtitle = "") {
      root.querySelector("[data-campus2d-feedback-dialog]")?.remove();
      const layer = createEl("div", "campus2d-feedback-layer", {
        "data-campus2d-feedback-dialog": "",
        "data-campus2d-ui": ""
      });
      const card = createEl("section", "campus2d-feedback-card", {
        role: "dialog",
        "aria-modal": "true",
        "aria-label": title
      });
      const header = createEl("div", "campus2d-feedback-header");
      const copy = createEl("div", "campus2d-feedback-title");
      const heading = createEl("h3", "");
      const closeButton = createEl("button", "campus2d-id-close", {
        type: "button",
        "aria-label": "Close",
        "data-campus2d-feedback-close": ""
      });
      heading.textContent = title;
      closeButton.textContent = "Close";
      copy.append(heading);
      if (subtitle) {
        const paragraph = createEl("p", "");
        paragraph.textContent = subtitle;
        copy.append(paragraph);
      }
      header.append(copy, closeButton);
      card.append(header);
      layer.append(card);
      root.append(layer);
      return { layer, card };
    }

    function appendFeedbackStatus(parent) {
      const status = createEl("p", "campus2d-feedback-status", {
        "data-campus2d-feedback-status": "",
        "aria-live": "polite"
      });
      if (feedbackStatus?.message) {
        status.textContent = feedbackStatus.message;
        status.dataset.status = feedbackStatus.type || "info";
      } else {
        status.hidden = true;
      }
      parent.append(status);
    }

    function openReportDialog(reportType = "person") {
      activeFeedbackDialog = {
        type: "report",
        reportType: reportType === "problem" ? "problem" : "person"
      };
      feedbackStatus = null;
      renderReportDialog();
    }

    function renderReportDialog() {
      const currentType = activeFeedbackDialog?.reportType === "problem" ? "problem" : "person";
      const { card } = createFeedbackShell("Report", "Send a report directly to the WSC app admin.");
      const switcher = createEl("div", "campus2d-report-switcher", { role: "group", "aria-label": "Report type" });
      [
        ["person", "Report a person"],
        ["problem", "Report a problem"]
      ].forEach(([value, label]) => {
        const button = createEl("button", `campus2d-report-kind ${currentType === value ? "is-active" : ""}`, {
          type: "button",
          "data-campus2d-report-kind": value,
          "aria-pressed": String(currentType === value)
        });
        button.textContent = label;
        switcher.append(button);
      });

      const form = createEl("form", "campus2d-feedback-form", { "data-campus2d-report-form": "" });
      form.append(
        switcher,
        createField("What's your ID or email?", "reporterContact", getReporterContact(), { required: true, autocomplete: "email" }),
        createField("What's the person's ID or the room with the issue?", "target", currentType === "problem" ? room.title : "", { required: true }),
        createField("Describe the issue", "description", "", { multiline: true, required: true, rows: "6" })
      );
      const actions = createEl("div", "campus2d-feedback-actions");
      const submitButton = createEl("button", "campus2d-feedback-submit button primary", {
        type: "submit",
        "data-campus2d-feedback-submit": ""
      });
      submitButton.textContent = "Send";
      actions.append(submitButton);
      form.append(actions);
      appendFeedbackStatus(form);
      card.append(form);
      form.querySelector("input, textarea, select, button")?.focus({ preventScroll: true });
    }

    function collectAchievementDrafts(form) {
      return achievementDrafts.map((_draft, index) => createAchievementDraft({
        fullName: form.querySelector(`[name="achievement_${index}_fullName"]`)?.value || "",
        rewardType: form.querySelector(`[name="achievement_${index}_rewardType"]`)?.value || "",
        round: form.querySelector(`[name="achievement_${index}_round"]`)?.value || "",
        city: form.querySelector(`[name="achievement_${index}_city"]`)?.value || "",
        approximateDate: form.querySelector(`[name="achievement_${index}_approximateDate"]`)?.value || ""
      }));
    }

    function openAchievementDialog() {
      activeFeedbackDialog = { type: "achievements" };
      feedbackStatus = null;
      achievementDrafts = achievementDrafts.length ? achievementDrafts : [createAchievementDraft()];
      renderAchievementDialog();
    }

    function renderAchievementDialog() {
      const { card } = createFeedbackShell("Share achievements", "");
      const form = createEl("form", "campus2d-feedback-form campus2d-achievement-form", { "data-campus2d-achievement-form": "" });
      const intro = createEl("p", "campus2d-achievement-intro");
      intro.textContent = "You want to share you achievements? Let us know and we will add them to your ID! Please note that in order to make sure it is correct, we will need to double check with your legal name. We will not use your personal information for any other mean.";
      const submitter = createEl("p", "campus2d-achievement-submitter");
      submitter.textContent = `Submitting from ${getReporterContact() || "your Alpaccount"}`;
      form.append(intro, submitter);

      achievementDrafts.forEach((draft, index) => {
        const group = createEl("fieldset", "campus2d-achievement-group");
        const legend = createEl("legend", "");
        legend.textContent = `Achievement ${index + 1}`;
        group.append(
          legend,
          createField("Full name as displayed on the official WSC results", `achievement_${index}_fullName`, draft.fullName, { required: true }),
          createSelectField("Reward type", `achievement_${index}_rewardType`, draft.rewardType, ACHIEVEMENT_REWARD_TYPES),
          createSelectField("Round", `achievement_${index}_round`, draft.round, ACHIEVEMENT_ROUNDS),
          createField("City", `achievement_${index}_city`, draft.city, { required: true }),
          createField("Approximate date (month and year)", `achievement_${index}_approximateDate`, draft.approximateDate, {
            required: true,
            placeholder: "June 2026"
          })
        );
        form.append(group);
      });

      const actions = createEl("div", "campus2d-feedback-actions campus2d-achievement-actions");
      const addButton = createEl("button", "campus2d-feedback-secondary", {
        type: "button",
        "data-campus2d-add-achievement": ""
      });
      const submitButton = createEl("button", "campus2d-feedback-submit button primary", {
        type: "submit",
        "data-campus2d-feedback-submit": ""
      });
      const canAddMore = achievementDrafts.length < MAX_ID_REWARDS;
      addButton.disabled = !canAddMore;
      addButton.textContent = "+ Add another achievement";
      if (!canAddMore) {
        addButton.textContent = "Maximum 9 achievements";
      }
      submitButton.textContent = "Submit";
      actions.append(addButton, submitButton);
      form.append(actions);
      appendFeedbackStatus(form);
      card.append(form);
      form.querySelector("input, textarea, select, button")?.focus({ preventScroll: true });
    }

    async function submitFeedbackPayload(payload) {
      if (feedbackSubmitting) {
        return;
      }
      if (typeof options.onFeedbackSubmit !== "function") {
        setFeedbackStatus("Email sending is not configured for this build yet.", "error");
        return;
      }
      setFeedbackSubmitting(true);
      setFeedbackStatus("Sending...", "info");
      try {
        await options.onFeedbackSubmit({
          ...payload,
          roomId: room.id,
          roomTitle: room.title,
          reporter: getFeedbackReporterPayload()
        });
        setFeedbackStatus("Sent. Thank you for helping keep the campus safe and accurate.", "success");
      } catch (error) {
        setFeedbackStatus(error?.message || "The email could not be sent yet.", "error");
      } finally {
        setFeedbackSubmitting(false);
      }
    }

    function createRewardTooltip(achievement, rewardType) {
      const place = achievement.city || "Location pending";
      const date = achievement.approximateDate || "Date pending";
      return `${rewardType.label} · ${getRoundLabel(achievement.round)} · ${place} · ${date}`;
    }

    function createRewardIcon(achievement, index) {
      const rewardType = getAchievementRewardType(achievement.rewardType);
      const tooltipText = createRewardTooltip(achievement, rewardType);
      const button = createEl("button", "campus2d-id-reward", {
        type: "button",
        title: tooltipText,
        "aria-label": tooltipText,
        "aria-expanded": "false",
        "data-campus2d-reward": rewardType.value
      });
      const image = createEl("img", "campus2d-id-reward-image", {
        src: rewardType.asset,
        alt: "",
        "aria-hidden": "true",
        draggable: "false"
      });
      const tooltip = createEl("span", "campus2d-id-reward-tooltip", { role: "tooltip" });
      tooltip.textContent = tooltipText;
      button.append(image, tooltip);
      button.style.setProperty("--reward-order", String(index + 1));
      return button;
    }

    function createRewardRows(achievements) {
      const grid = createEl("div", "campus2d-id-reward-grid", {
        "aria-label": "Verified WSC rewards"
      });
      getIdRewardRows(achievements).forEach((row, rowIndex) => {
        const rowElement = createEl("div", "campus2d-id-reward-row");
        rowElement.style.setProperty("--reward-count", String(row.length));
        row.forEach((achievement, index) => {
          rowElement.append(createRewardIcon(achievement, rowIndex * 3 + index));
        });
        grid.append(rowElement);
      });
      return grid;
    }

    function createTrophyPanel(player) {
      const panel = createEl("aside", "campus2d-id-trophies", { "aria-label": "Achievements" });
      const title = createEl("strong", "");
      const list = createEl("div", "campus2d-id-reward-list");
      const achievements = normalizeAchievements(player?.achievements);
      title.textContent = "Achievements";
      if (achievements.length) {
        list.append(createRewardRows(achievements));
      } else {
        const empty = createEl("div", "campus2d-id-reward-empty");
        const rewardType = getAchievementRewardType("trophy");
        const image = createEl("img", "campus2d-id-reward-empty-image", {
          src: rewardType.asset,
          alt: "",
          "aria-hidden": "true",
          draggable: "false"
        });
        const copy = createEl("span", "");
        copy.textContent = "No verified rewards yet";
        empty.append(image, copy);
        list.append(empty);
      }
      panel.append(title, list);
      return panel;
    }

    function hideRewardTooltips(exceptButton = null) {
      root.querySelectorAll(".campus2d-id-reward.is-info-visible").forEach((button) => {
        if (button !== exceptButton) {
          button.classList.remove("is-info-visible");
          button.setAttribute("aria-expanded", "false");
        }
      });
    }

    function createIdColorPanel(player) {
      const panel = createEl("section", "campus2d-id-color-panel", { "aria-label": "Choose alpaca color" });
      const title = createEl("strong", "");
      const grid = createEl("div", "campus2d-id-color-grid");
      title.textContent = "Alpaca color";
      manifest.colors.forEach((color) => {
        const button = createEl("button", "campus2d-color-swatch campus2d-id-color-swatch", {
          type: "button",
          title: color.label,
          "aria-label": color.label,
          "data-campus2d-color": color.id
        });
        button.style.setProperty("--swatch", color.swatch || color.hex);
        button.classList.toggle("is-active", color.id === player.colorId);
        grid.append(button);
      });
      panel.append(title, grid);
      return panel;
    }

    function createOnlineIdCardShell() {
      const container = createEl("div", "online-card-container noselect");
      const canvas = createEl("div", "online-card-canvas");
      const frame = createEl("div", "online-card-frame");
      const content = createEl("div", "card-content campus2d-id-content");
      const glare = createEl("span", "card-glare", { "aria-hidden": "true" });
      const cyberLines = createEl("span", "cyber-lines", { "aria-hidden": "true" });
      const glowingElements = createEl("span", "glowing-elements", { "aria-hidden": "true" });
      const particles = createEl("span", "card-particles", { "aria-hidden": "true" });
      const corners = createEl("span", "corner-elements", { "aria-hidden": "true" });
      const scanLine = createEl("span", "scan-line", { "aria-hidden": "true" });

      Array.from({ length: 4 }).forEach(() => {
        cyberLines.append(createEl("span", ""));
        corners.append(createEl("span", ""));
      });
      ["glow-1", "glow-2", "glow-3"].forEach((className) => {
        glowingElements.append(createEl("span", className));
      });
      Array.from({ length: 6 }).forEach(() => {
        particles.append(createEl("span", ""));
      });

      content.append(glare, cyberLines);
      frame.append(content);
      canvas.append(frame);
      container.append(canvas);

      return {
        container,
        content,
        glowingElements,
        particles,
        corners,
        scanLine
      };
    }

    function openPlayerCard(player) {
      if (!player) {
        return;
      }
      closePlayerCard();
      closeFeedbackDialog();
      const isLocalPlayer = player.clientId === localPlayer.clientId;
      const layer = createEl("div", "campus2d-id-layer", {
        "data-campus2d-id-card": "",
        "data-campus2d-ui": ""
      });
      const card = createEl("section", `campus2d-id-card online-glow-card ${isLocalPlayer ? "is-local" : ""}`, {
        role: "dialog",
        "aria-modal": "true",
        "aria-label": "Alpaca ID card"
      });
      const shell = createOnlineIdCardShell();
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
        createIdCardField("Alpaca name", player.displayName || player.alpacaName || "Guest"),
        createIdCardField("School", player.schoolName || "Unknown school")
      );
      if (isLocalPlayer) {
        const achievementsButton = createEl("button", "campus2d-id-achievement-button", {
          type: "button",
          "data-campus2d-achievements-open": ""
        });
        achievementsButton.textContent = "Share achievements";
        details.append(createIdColorPanel(player), achievementsButton);
      }
      applyAvatarPreview(preview, player);
      shell.content.append(preview, details, createTrophyPanel(player), shell.glowingElements, shell.particles, shell.corners, shell.scanLine);
      card.append(shell.container);
      layer.append(card);
      root.append(layer);
      closeButton.focus({ preventScroll: true });
    }

    function getNpcById(npcId) {
      return (room.npcs || []).find((entry) => entry.id === npcId) || null;
    }

    function getNpcDialogueText(npc) {
      if (typeof npc?.dialogue === "string") {
        return npc.dialogue;
      }
      return npc?.dialogue?.body || "";
    }

    function getNpcDialogueTitle(npc) {
      if (npc?.dialogue && typeof npc.dialogue === "object" && npc.dialogue.title) {
        return npc.dialogue.title;
      }
      return npc?.label || "Guide";
    }

    function clearNpcTypingTimer() {
      if (npcTypingTimer) {
        window.clearTimeout(npcTypingTimer);
        npcTypingTimer = 0;
      }
    }

    function closeNpcDialogue() {
      clearNpcTypingTimer();
      if (debateSpeechTimer) {
        window.clearTimeout(debateSpeechTimer);
        debateSpeechTimer = 0;
      }
      activeNpcDialogue = null;
      npcDialogueLayer.replaceChildren();
      npcDialogueLayer.hidden = true;
    }

    function updateNpcDialoguePosition() {
      if (!activeNpcDialogue?.card || npcDialogueLayer.hidden) {
        return;
      }
      const { card, npc } = activeNpcDialogue;
      const viewportWidth = viewport.clientWidth || 1;
      const viewportHeight = viewport.clientHeight || 1;
      const screenX = (npc.x * camera.scale) + camera.x;
      const screenY = (npc.y * camera.scale) + camera.y;
      const textOnly = card.classList.contains("is-text-only");
      const maxDialogueWidth = textOnly ? 560 : 430;
      const minDialogueWidth = textOnly ? 300 : 260;
      const cardWidth = Math.min(maxDialogueWidth, Math.max(minDialogueWidth, viewportWidth - 24));
      card.style.width = `${cardWidth}px`;

      const cardHeight = card.offsetHeight || 260;
      const prefersRight = screenX < viewportWidth * 0.54;
      let left = textOnly ? screenX - (cardWidth / 2) : (prefersRight ? screenX + 30 : screenX - cardWidth - 30);
      left = clamp(left, 12, Math.max(12, viewportWidth - cardWidth - 12));

      let top = screenY - cardHeight - 22;
      let placement = "above";
      if (top < 12) {
        top = screenY + 34;
        placement = "below";
      }
      top = clamp(top, 12, Math.max(12, viewportHeight - cardHeight - 12));

      card.style.left = `${left}px`;
      card.style.top = `${top}px`;
      card.dataset.placement = placement;
      card.style.setProperty("--campus2d-npc-dialogue-arrow-x", `${clamp(screenX - left, 18, cardWidth - 18)}px`);
    }

    function typeNpcDialogueText(textElement, cursorElement, text) {
      clearNpcTypingTimer();
      const graphemes = Array.from(text);
      let index = 0;
      textElement.textContent = "";
      cursorElement.hidden = false;

      if (window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches) {
        textElement.textContent = text;
        cursorElement.hidden = true;
        updateNpcDialoguePosition();
        return;
      }

      const tick = () => {
        index = Math.min(graphemes.length, index + NPC_DIALOGUE_CHARS_PER_TICK);
        textElement.textContent = graphemes.slice(0, index).join("");
        updateNpcDialoguePosition();
        if (index >= graphemes.length) {
          cursorElement.hidden = true;
          npcTypingTimer = 0;
          return;
        }
        npcTypingTimer = window.setTimeout(tick, NPC_DIALOGUE_TYPE_SPEED_MS);
      };

      npcTypingTimer = window.setTimeout(tick, NPC_DIALOGUE_START_DELAY_MS);
    }

    function openNpcDialogueMessage(npc, title, message, options = {}) {
      closePlayerCard();
      closeNpcDialogue();
      const card = createEl("section", "campus2d-npc-dialogue is-text-only", {
        role: "dialog",
        "aria-live": "polite",
        "aria-label": title,
        "data-campus2d-ui": ""
      });
      const textBox = createEl("p", "campus2d-npc-dialogue-text");
      const copy = createEl("span", "campus2d-npc-dialogue-copy");
      const cursor = createEl("span", "campus2d-npc-dialogue-cursor", { "aria-hidden": "true" });
      textBox.append(copy, cursor);
      card.append(textBox);
      activeNpcDialogue = { card, npc, debateSpeechId: options.debateSpeechId || "" };
      npcDialogueLayer.hidden = false;
      npcDialogueLayer.replaceChildren(card);
      updateNpcDialoguePosition();
      window.requestAnimationFrame(() => {
        card.classList.add("is-visible");
        updateNpcDialoguePosition();
      });
      typeNpcDialogueText(copy, cursor, message);
      if (options.autoCloseMs) {
        debateSpeechTimer = window.setTimeout(() => {
          if (!options.debateSpeechId || activeNpcDialogue?.debateSpeechId === options.debateSpeechId) {
            closeNpcDialogue();
          }
        }, options.autoCloseMs);
      }
    }

    function openNpcDialogue(npcId) {
      const npc = getNpcById(npcId);
      const message = getNpcDialogueText(npc).trim();
      const npcElement = npcElements.get(npcId);
      if (!npc || !message) {
        if (npcElement) {
          showBubble(npcElement, `${npc?.label || "Guide"} has nothing to share yet`);
        }
        return;
      }
      openNpcDialogueMessage(npc, getNpcDialogueTitle(npc), message);
    }

    function openDebateAnnouncementIfNeeded() {
      if (
        !debateState ||
        debateState.status !== "running" ||
        !debateState.speechId ||
        !debateState.announcement ||
        debateState.speechId === lastDebateSpeechId ||
        Date.now() > Number(debateState.startedAtMs || 0) + DEBATE_INTRO_MS
      ) {
        return;
      }
      const npc = getNpcById(DEBATE_MODERATOR_NPC_ID);
      if (!npc) {
        return;
      }
      lastDebateSpeechId = debateState.speechId;
      openNpcDialogueMessage(
        { ...npc, ...DEBATE_CENTER_STAGE },
        "Moderator",
        debateState.announcement,
        {
          debateSpeechId: debateState.speechId,
          autoCloseMs: Math.max(1000, Number(debateState.startedAtMs || Date.now()) + DEBATE_INTRO_MS - Date.now())
        }
      );
    }

    function showBubble(playerElement, message) {
      const text = String(message || "").trim().slice(0, 140);
      const chatStack = playerElement?._campus2d?.chatStack;
      if (!chatStack || !text) {
        return;
      }
      const bubble = createEl("span", "campus2d-chat-bubble is-visible");
      bubble.textContent = text;
      chatStack.append(bubble);
      while (chatStack.children.length > CHAT_STACK_LIMIT) {
        chatStack.firstElementChild?.remove();
      }
      window.setTimeout(() => {
        bubble.classList.remove("is-visible");
        window.setTimeout(() => bubble.remove(), 180);
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
      ensureRoomOverride(room);
      const point = clampPointToRoom(screenToWorld(event.clientX, event.clientY));
      const hit = findAnyZoneAtPoint(point);
      if (hit) {
        const hitRect = getZoneRect(hit.type, hit.zone);
        selectedZoneType = hit.type;
        selectedZoneId = hit.zone.id;
        if (hit.type === "seat") {
          selectedSeatDirection = normalizeSeatDirection(hit.zone.direction, selectedSeatDirection);
        }
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
      if (type === "seat") {
        selectedSeatDirection = normalizeSeatDirection(zone.direction, selectedSeatDirection);
      }
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

    function handleSeatDirectionChange() {
      selectedSeatDirection = normalizeSeatDirection(seatDirectionSelect.value, selectedSeatDirection);
      const zone = selectedZoneType === "seat" ? getSelectedZone() : null;
      if (zone) {
        zone.direction = selectedSeatDirection;
        saveDevZones("Saved locally");
        renderRoom();
        return;
      }
      updateDebugPanel();
    }

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        if (activeFeedbackDialog) {
          closeFeedbackDialog();
          return;
        }
        if (settingsPopupOpen) {
          setSettingsPanelOpen(false);
          return;
        }
        if (activeNpcDialogue) {
          closeNpcDialogue();
          return;
        }
        if (zoneEditGesture) {
          zoneEditGesture = null;
          renderRoom();
          return;
        }
        closePlayerCard();
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
      if (isTextEntryTarget(event.target)) {
        return;
      }
      event.preventDefault();
      keys.add(event.key);
    }

    function handlePlayerCardKeyDown(event) {
      if (!["Enter", " "].includes(event.key) || isTextEntryTarget(event.target)) {
        return;
      }
      event.preventDefault();
      openPlayerCard(localPlayer);
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
      if (event.target.closest("[data-campus2d-ui], [data-campus2d-avatar], [data-campus2d-npc], [data-campus2d-hotspot], [data-campus2d-seat], [data-campus2d-portal]")) {
        return;
      }
      setSettingsPanelOpen(false);
      closeNpcDialogue();
      const point = screenToWorld(event.clientX, event.clientY);
      const activeZones = getEffectiveZones(room);
      if (canPlayerStandAt(point, activeZones)) {
        if (!standUpFromSeat({ x: point.x - localPlayer.x, y: point.y - localPlayer.y }, activeZones)) {
          return;
        }
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

    function handleDebateClick(event) {
      const teamButton = event.target.closest("[data-campus2d-debate-team]");
      if (teamButton) {
        event.preventDefault();
        const side = normalizeDebateSide(teamButton.dataset.campus2dDebateTeam);
        if (!debateState || teamButton.closest("[data-campus2d-debate-create-form]")) {
          chooseHostDebateSide(side);
        } else if (isLocalDebateHost()) {
          chooseHostDebateSide(side);
        } else {
          joinDebateAs(side);
        }
        return true;
      }

      const actionButton = event.target.closest("[data-campus2d-debate-action]");
      if (!actionButton) {
        return false;
      }

      event.preventDefault();
      const action = actionButton.dataset.campus2dDebateAction;
      if (action === "cycle-topic") {
        cycleDebateTopic();
      } else if (action === "join-judge") {
        joinDebateAs("judge");
      } else if (action === "leave-role") {
        leaveDebateRole();
      } else if (action === "start") {
        startDebate();
      } else if (action === "end") {
        endDebate();
      } else if (action === "new-room") {
        debateState = null;
        debatePanelStatus = "";
        debateDraft = createDebateDraft();
        debateAudioManager?.disable();
        renderDebateUi();
        publishPresence(true);
      } else if (action === "enable-audio") {
        debateAudioManager?.enable().then(() => {
          updateDebateAudioContext();
          renderDebateUi();
          publishPresence(true);
        });
      } else if (action === "mute-audio") {
        debateAudioManager?.setMuted(true);
        renderDebateUi();
        publishPresence(true);
      } else if (action === "unmute-audio") {
        debateAudioManager?.setMuted(false);
        renderDebateUi();
        publishPresence(true);
      } else if (action === "disable-audio") {
        debateAudioManager?.disable();
        renderDebateUi();
        publishPresence(true);
      }
      return true;
    }

    function handleRootClick(event) {
      if (debugEnabled) {
        if (!debugPanel.contains(event.target)) {
          event.preventDefault();
          event.stopPropagation();
        }
        return;
      }

      if (handleDebateClick(event)) {
        return;
      }

      if (event.target.closest("[data-campus2d-feedback-close]") || event.target.matches("[data-campus2d-feedback-dialog]")) {
        closeFeedbackDialog();
        return;
      }

      const reportKindButton = event.target.closest("[data-campus2d-report-kind]");
      if (reportKindButton) {
        activeFeedbackDialog = {
          type: "report",
          reportType: reportKindButton.dataset.campus2dReportKind === "problem" ? "problem" : "person"
        };
        feedbackStatus = null;
        renderReportDialog();
        return;
      }

      const addAchievementButton = event.target.closest("[data-campus2d-add-achievement]");
      if (addAchievementButton) {
        const form = root.querySelector("[data-campus2d-achievement-form]");
        achievementDrafts = form ? collectAchievementDrafts(form) : achievementDrafts;
        if (achievementDrafts.length >= MAX_ID_REWARDS) {
          setFeedbackStatus("You can add up to 9 achievements.", "info");
          return;
        }
        achievementDrafts.push(createAchievementDraft());
        feedbackStatus = null;
        renderAchievementDialog();
        return;
      }

      if (event.target.closest("[data-campus2d-achievements-open]")) {
        openAchievementDialog();
        return;
      }

      if (event.target.closest("[data-campus2d-report-open]")) {
        openReportDialog("person");
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

      const rewardButton = event.target.closest("[data-campus2d-reward]");
      if (rewardButton) {
        const shouldShow = !rewardButton.classList.contains("is-info-visible");
        hideRewardTooltips(rewardButton);
        rewardButton.classList.toggle("is-info-visible", shouldShow);
        rewardButton.setAttribute("aria-expanded", String(shouldShow));
        return;
      }

      hideRewardTooltips();

      if (event.target.closest("[data-campus2d-npc-dialogue-close]")) {
        closeNpcDialogue();
        return;
      }

      const npcButton = event.target.closest("[data-campus2d-npc]");
      if (npcButton) {
        openNpcDialogue(npcButton.dataset.campus2dNpc);
        return;
      }

      const colorButton = event.target.closest("[data-campus2d-color]");
      if (colorButton) {
        const colorId = colorButton.dataset.campus2dColor;
        if (colorIds.has(colorId)) {
          localPlayer.colorId = colorId;
          safeStorageSet(STORAGE_COLOR_KEY, colorId);
          setPaletteOpen(false);
          renderPalette();
          renderLocalCard();
          updatePlayerElement(localElement, localPlayer, performance.now());
          if (root.querySelector("[data-campus2d-id-card]")) {
            openPlayerCard(localPlayer);
          }
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

      if (event.target.closest("[data-campus2d-open-self-card]")) {
        openPlayerCard(localPlayer);
        return;
      }

      if (event.target.closest("[data-campus2d-color-toggle]")) {
        setPaletteOpen(!paletteOpen);
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
        if (hotspot) {
          showBubble(localElement, `${hotspot.label} coming soon`);
        }
      }
    }

    function handleRootSubmit(event) {
      const debateCreateForm = event.target.closest("[data-campus2d-debate-create-form]");
      if (debateCreateForm) {
        event.preventDefault();
        createDebateRoom();
        return;
      }

      const reportForm = event.target.closest("[data-campus2d-report-form]");
      if (reportForm) {
        event.preventDefault();
        const formData = new FormData(reportForm);
        const reporterContact = String(formData.get("reporterContact") || "").trim();
        const target = String(formData.get("target") || "").trim();
        const description = String(formData.get("description") || "").trim();
        if (!reporterContact || !target || !description) {
          setFeedbackStatus("Please complete every field before sending.", "error");
          return;
        }
        submitFeedbackPayload({
          category: "report",
          reportType: activeFeedbackDialog?.reportType === "problem" ? "problem" : "person",
          reporterContact,
          target,
          description
        });
        return;
      }

      const achievementForm = event.target.closest("[data-campus2d-achievement-form]");
      if (achievementForm) {
        event.preventDefault();
        achievementDrafts = collectAchievementDrafts(achievementForm);
        const achievements = achievementDrafts
          .map(createAchievementDraft)
          .filter((entry) => entry.fullName || entry.city || entry.approximateDate);
        if (!achievements.length || achievements.some((entry) => !entry.fullName || !entry.rewardType || !entry.city || !entry.approximateDate)) {
          setFeedbackStatus("Please complete every achievement field before submitting.", "error");
          return;
        }
        submitFeedbackPayload({
          category: "achievement_share",
          reporterContact: getReporterContact(),
          achievements
        });
      }
    }

    function handleRootInput(event) {
      const codeInput = event.target.closest("[data-campus2d-debate-code-input]");
      if (codeInput) {
        debateDraft.joinCode = normalizeDebateCode(codeInput.value);
        codeInput.value = debateDraft.joinCode;
        return;
      }

      const noteInput = event.target.closest("[data-campus2d-debate-note-input]");
      if (noteInput && !noteInput.readOnly) {
        updateLocalDebateNote(noteInput.dataset.campus2dDebateNoteSide, noteInput.value);
      }
    }

    function handleRootChange(event) {
      const draftTopic = event.target.closest("[data-campus2d-debate-create-topic]");
      if (draftTopic) {
        debateDraft.topicId = getDebateTopicId(draftTopic.value);
        renderDebateUi();
        return;
      }

      const activeTopic = event.target.closest("[data-campus2d-debate-topic-select]");
      if (activeTopic) {
        setActiveDebateTopic(activeTopic.value);
        return;
      }

      const judgeMode = event.target.closest("[data-campus2d-debate-judge-mode]");
      if (judgeMode) {
        setDebateJudgeMode(judgeMode.checked);
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
      localPlayer.email = nextIdentity.email || "";
      localPlayer.alpacaName = nextIdentity.alpacaName || nextIdentity.displayName || "";
      localPlayer.displayName = nextIdentity.displayName || "Guest";
      localPlayer.schoolName = nextIdentity.schoolName || "";
      localPlayer.country = nextIdentity.country || "";
      localPlayer.wscEventCount = Number(nextIdentity.wscEventCount) || 0;
      localPlayer.highestWscRound = nextIdentity.highestWscRound || "";
      localPlayer.achievements = normalizeAchievements(nextIdentity.achievements || nextIdentity.wscAchievements);
      localPlayer.createdAt = nextIdentity.createdAt || null;
      updatePlayerElement(localElement, localPlayer, performance.now());
      renderLocalCard();
      publishPresence(true);
    }

    renderRoom();
    applyCampusSettings();
    root.focus({ preventScroll: true });
    connectRealtime();
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("resize", updateCamera);
    window.addEventListener("pointerdown", handleAudioUnlock, { passive: true });
    window.addEventListener("keydown", handleAudioUnlock);
    window.addEventListener("wsc-campus-settings-open", handleOpenSettingsEvent);
    viewport.addEventListener("pointerdown", handlePointerDown);
    viewport.addEventListener("pointermove", handlePointerMove);
    viewport.addEventListener("pointerup", handlePointerUp);
    viewport.addEventListener("pointercancel", handlePointerUp);
    playerCard.addEventListener("pointermove", updatePlayerCardTilt);
    playerCard.addEventListener("pointerleave", resetPlayerCardTilt);
    playerCard.addEventListener("pointercancel", resetPlayerCardTilt);
    playerCard.addEventListener("keydown", handlePlayerCardKeyDown);
    headerCardHost.addEventListener("click", handleRootClick);
    root.addEventListener("click", handleRootClick);
    root.addEventListener("input", handleRootInput);
    root.addEventListener("change", handleRootChange);
    root.addEventListener("submit", handleRootSubmit);
    chatForm.addEventListener("submit", handleChatSubmit);
    toneInput.addEventListener("input", handleToneInput);
    volumeInput.addEventListener("input", handleVolumeInput);
    muteButton.addEventListener("click", handleMuteClick);
    zoneTypeSelect.addEventListener("change", handleZoneTypeChange);
    seatDirectionSelect.addEventListener("change", handleSeatDirectionChange);
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
        window.removeEventListener("pointerdown", handleAudioUnlock);
        window.removeEventListener("keydown", handleAudioUnlock);
        window.removeEventListener("wsc-campus-settings-open", handleOpenSettingsEvent);
        viewport.removeEventListener("pointerdown", handlePointerDown);
        viewport.removeEventListener("pointermove", handlePointerMove);
        viewport.removeEventListener("pointerup", handlePointerUp);
        viewport.removeEventListener("pointercancel", handlePointerUp);
        playerCard.removeEventListener("pointermove", updatePlayerCardTilt);
        playerCard.removeEventListener("pointerleave", resetPlayerCardTilt);
        playerCard.removeEventListener("pointercancel", resetPlayerCardTilt);
        playerCard.removeEventListener("keydown", handlePlayerCardKeyDown);
        headerCardHost.removeEventListener("click", handleRootClick);
        root.removeEventListener("click", handleRootClick);
        root.removeEventListener("input", handleRootInput);
        root.removeEventListener("change", handleRootChange);
        root.removeEventListener("submit", handleRootSubmit);
        seatDirectionSelect.removeEventListener("change", handleSeatDirectionChange);
        debateAudioManager?.destroy();
        channel?.destroy();
        backgroundMusic.pause();
        backgroundMusic.src = "";
        window.clearTimeout(settingsHighlightTimer);
        window.clearTimeout(debateNoteSendTimer);
        window.clearTimeout(debateSpeechTimer);
        headerCardHost.remove();
        clearNpcTypingTimer();
        mountNode.replaceChildren();
      },
      setIdentity,
      setRoom,
      openSettings: openSettingsPanel
    };
  }

  window.WSC_CAMPUS_2D = Object.freeze({ mount });
}());

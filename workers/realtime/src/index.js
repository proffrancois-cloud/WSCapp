const DEFAULT_ALLOWED_ORIGINS = [
  "https://wscapp.app",
  "https://www.wscapp.app",
  "https://proffrancois-cloud.github.io",
  "http://localhost:4173",
  "http://127.0.0.1:4173"
];

export const DEFAULTS = Object.freeze({
  MAX_PLAYERS_PER_ROOM: 50,
  MAX_MESSAGE_BYTES: 65536,
  MAX_COORDINATE_ABS: 10000,
  MOVEMENT_SEND_INTERVAL_MS: 200,
  SNAPSHOT_INTERVAL_MS: 100,
  CHAT_RATE_LIMIT_MAX_MESSAGES: 2,
  CHAT_RATE_LIMIT_WINDOW_MS: 3000,
  CHAT_MAX_LENGTH: 120,
  MESSAGE_RATE_LIMIT_MAX_MESSAGES: 60,
  MESSAGE_RATE_LIMIT_WINDOW_MS: 1000
});

const EVENT_RATE_LIMITS = Object.freeze({
  join: Object.freeze({ max: 2, windowMs: 5000 }),
  presence: Object.freeze({ max: 5, windowMs: 1000 }),
  avatar: Object.freeze({ max: 5, windowMs: 1000 }),
  debate: Object.freeze({ max: 10, windowMs: 1000 }),
  challenge: Object.freeze({ max: 10, windowMs: 1000 }),
  debateSignal: Object.freeze({ max: 30, windowMs: 1000 }),
  ping: Object.freeze({ max: 4, windowMs: 1000 })
});

const DIRECTIONS = new Set(["up", "down", "left", "right"]);
const ROOM_ID_PATTERN = /^[a-z0-9][a-z0-9_-]{0,63}$/;
const RESTRICTED_CHAT_TERMS = Object.freeze([
  "asshole", "bastard", "bitch", "cunt", "dickhead", "dumbass", "faggot", "fuck",
  "idiot", "kike", "kill yourself", "kys", "loser", "moron", "motherfucker", "nigga",
  "nigger", "retard", "shithead", "shut up", "slut", "spic", "stupid", "whore",
  "abruti", "abrutie", "con", "conne", "connard", "connasse", "encule", "fdp",
  "ferme ta gueule", "imbecile", "merde", "pute", "salope", "ta gueule", "va te faire foutre"
]);

function json(data, init = {}) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: {
      "content-type": "application/json; charset=utf-8",
      ...(init.headers || {})
    }
  });
}

function toFiniteNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function clampCoordinate(value, fallback = 0) {
  const number = toFiniteNumber(value, fallback);
  return Math.min(DEFAULTS.MAX_COORDINATE_ABS, Math.max(-DEFAULTS.MAX_COORDINATE_ABS, number));
}

function cleanText(value, maxLength) {
  return String(value || "").replace(/\s+/g, " ").trim().slice(0, maxLength);
}

function nullableText(value, maxLength) {
  const text = cleanText(value, maxLength);
  return text || null;
}

function cleanDirection(value) {
  return DIRECTIONS.has(value) ? value : "down";
}

export function sanitizeRoomId(value) {
  const roomId = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
  return ROOM_ID_PATTERN.test(roomId) ? roomId : "";
}

export function sanitizeChatMessage(value) {
  return cleanText(value, DEFAULTS.CHAT_MAX_LENGTH);
}

function normalizeModerationText(value) {
  return String(value || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[@4]/g, "a")
    .replace(/3/g, "e")
    .replace(/[1!|]/g, "i")
    .replace(/0/g, "o")
    .replace(/[5$]/g, "s")
    .replace(/7/g, "t")
    .replace(/(.)\1+/g, "$1")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function moderateChatMessage(value) {
  const message = sanitizeChatMessage(value);
  const normalized = normalizeModerationText(message);
  const restrictedTerm = RESTRICTED_CHAT_TERMS.find((term) => {
    const normalizedTerm = normalizeModerationText(term);
    if (normalizedTerm.includes(" ")) {
      return normalized.includes(normalizedTerm);
    }
    const tokenPattern = new RegExp(`(^|\\s)${normalizedTerm}(?=\\s|$)`);
    const obfuscatedPattern = new RegExp(`(^|\\s)${normalizedTerm.split("").join("\\s*")}(?=\\s|$)`);
    return tokenPattern.test(normalized) || obfuscatedPattern.test(normalized);
  });
  return {
    allowed: Boolean(message && !restrictedTerm),
    message,
    reason: restrictedTerm ? "restricted-language" : (message ? "" : "empty")
  };
}

export function consumeChatRateLimit(timestamps = [], nowMs = Date.now()) {
  const recent = timestamps.filter((timestamp) => nowMs - Number(timestamp || 0) < DEFAULTS.CHAT_RATE_LIMIT_WINDOW_MS);
  if (recent.length >= DEFAULTS.CHAT_RATE_LIMIT_MAX_MESSAGES) {
    return { allowed: false, timestamps: recent };
  }
  return { allowed: true, timestamps: [...recent, nowMs] };
}

export function consumeEventRateLimit(timestamps = [], max = 1, windowMs = 1000, nowMs = Date.now()) {
  const recent = timestamps.filter((timestamp) => nowMs - Number(timestamp || 0) < windowMs);
  if (recent.length >= max) {
    return { allowed: false, timestamps: recent };
  }
  return { allowed: true, timestamps: [...recent, nowMs] };
}

export function sanitizeStructuredPayload(value, depth = 0) {
  if (depth > 6 || value === undefined) {
    return null;
  }
  if (value === null || typeof value === "boolean") {
    return value;
  }
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }
  if (typeof value === "string") {
    return value.slice(0, 12000);
  }
  if (Array.isArray(value)) {
    return value.slice(0, 64).map((entry) => sanitizeStructuredPayload(entry, depth + 1));
  }
  if (typeof value !== "object") {
    return null;
  }

  const result = Object.create(null);
  for (const [rawKey, entry] of Object.entries(value).slice(0, 64)) {
    const key = cleanText(rawKey, 80);
    if (!key || key === "__proto__" || key === "prototype" || key === "constructor") {
      continue;
    }
    result[key] = sanitizeStructuredPayload(entry, depth + 1);
  }
  return result;
}

export function sanitizePlayerPayload(payload = {}, fallback = {}) {
  const clientId = cleanText(payload.clientId || fallback.clientId || "", 120);
  return {
    clientId,
    userId: nullableText(fallback.userId || "", 160),
    roomId: sanitizeRoomId(payload.roomId || fallback.roomId || ""),
    displayName: cleanText(payload.displayName || payload.alpacaName || fallback.displayName || "Guest", 80) || "Guest",
    x: clampCoordinate(payload.x, clampCoordinate(fallback.x, 0)),
    y: clampCoordinate(payload.y, clampCoordinate(fallback.y, 0)),
    direction: cleanDirection(payload.direction || fallback.direction),
    moving: Boolean(payload.moving),
    seatId: nullableText(payload.seatId || fallback.seatId || "", 80),
    colorId: cleanText(payload.colorId || fallback.colorId || "cream", 40) || "cream",
    alpacaName: cleanText(payload.alpacaName || fallback.alpacaName || "", 80),
    schoolName: "",
    country: "",
    wscEventCount: 0,
    highestWscRound: "",
    idRewards: [],
    createdAt: null,
    debateRoom: nullableText(payload.debateRoom || fallback.debateRoom || "", 80),
    debateAudio: payload.debateAudio && typeof payload.debateAudio === "object"
      ? sanitizeStructuredPayload(payload.debateAudio)
      : sanitizeStructuredPayload(fallback.debateAudio),
    scholarsChallenge: payload.scholarsChallenge && typeof payload.scholarsChallenge === "object"
      ? sanitizeStructuredPayload(payload.scholarsChallenge)
      : sanitizeStructuredPayload(fallback.scholarsChallenge),
    updatedAtMs: Date.now()
  };
}

function sanitizeMovementPayload(payload = {}, fallback = {}) {
  return {
    x: clampCoordinate(payload.x, fallback.x),
    y: clampCoordinate(payload.y, fallback.y),
    direction: cleanDirection(payload.direction || fallback.direction),
    moving: Boolean(payload.moving),
    seatId: nullableText(payload.seatId || fallback.seatId || "", 80),
    colorId: cleanText(payload.colorId || fallback.colorId || "cream", 40) || "cream",
    seq: Number.isFinite(Number(payload.seq)) ? Math.max(0, Math.floor(Number(payload.seq))) : undefined,
    updatedAtMs: Date.now()
  };
}

function getAllowedOrigins(env) {
  const configured = String(env.ALLOWED_ORIGINS || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
  return configured.length ? configured : DEFAULT_ALLOWED_ORIGINS;
}

function isAllowedOrigin(request, env) {
  const origin = request.headers.get("origin");
  if (!origin) {
    return false;
  }
  return getAllowedOrigins(env).includes(origin);
}

function corsHeaders(env) {
  return {
    "access-control-allow-origin": getAllowedOrigins(env)[0] || "https://wscapp.app",
    "access-control-allow-methods": "GET, OPTIONS",
    "access-control-allow-headers": "content-type, authorization"
  };
}

function parseEnvelope(message) {
  const text = typeof message === "string" ? message : new TextDecoder().decode(message);
  try {
    const envelope = JSON.parse(text);
    return envelope && typeof envelope === "object" ? envelope : null;
  } catch (_error) {
    return null;
  }
}

function websocketResponse(client) {
  return new Response(null, { status: 101, webSocket: client });
}

function createSession(player) {
  return {
    clientId: player.clientId,
    player,
    chatTimestamps: [],
    eventTimestamps: {},
    lastMovementAtMs: 0,
    joinedAtMs: Date.now()
  };
}

function publicEnvelope(type, payload) {
  return JSON.stringify({
    type,
    v: 1,
    schema: "campus2d.realtime.cloudflare.v1",
    sentAtMs: Date.now(),
    payload
  });
}

export class CampusRoom {
  constructor(state, env) {
    this.state = state;
    this.env = env;
    this.snapshotTimer = null;
    this.dirty = false;
    this.roomId = "";
  }

  async fetch(request) {
    if (!isAllowedOrigin(request, this.env)) {
      return json({ ok: false, error: "Origin not allowed." }, { status: 403 });
    }
    if (request.headers.get("upgrade")?.toLowerCase() !== "websocket") {
      return json({ ok: false, error: "Expected WebSocket upgrade." }, { status: 426 });
    }

    const url = new URL(request.url);
    const roomId = sanitizeRoomId(url.searchParams.get("roomId") || url.pathname.split("/").filter(Boolean).pop());
    if (!roomId) {
      return json({ ok: false, error: "Invalid room id." }, { status: 400 });
    }
    this.roomId = roomId;

    const activeSockets = this.getSockets();
    if (activeSockets.length >= DEFAULTS.MAX_PLAYERS_PER_ROOM) {
      return json({
        ok: false,
        type: "room_full",
        roomId,
        maxPlayers: DEFAULTS.MAX_PLAYERS_PER_ROOM,
        playerCount: activeSockets.length
      }, { status: 409 });
    }

    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);
    const requestedClientId = cleanText(url.searchParams.get("clientId") || "", 120);
    const existingClientIds = new Set(activeSockets.map((socket) => this.getSession(socket).clientId));
    const clientId = requestedClientId && !existingClientIds.has(requestedClientId)
      ? requestedClientId
      : crypto.randomUUID();
    const player = sanitizePlayerPayload({
      clientId,
      roomId
    });

    server.serializeAttachment(createSession(player));
    this.state.acceptWebSocket(server);
    server.send(publicEnvelope("connected", {
      roomId,
      clientId,
      maxPlayers: DEFAULTS.MAX_PLAYERS_PER_ROOM
    }));
    this.markDirty();
    this.ensureSnapshotLoop();
    return websocketResponse(client);
  }

  webSocketMessage(ws, message) {
    const messageSize = typeof message === "string"
      ? new TextEncoder().encode(message).byteLength
      : Number(message?.byteLength || message?.length || 0);
    if (messageSize > DEFAULTS.MAX_MESSAGE_BYTES) {
      ws.send(publicEnvelope("error", { code: "message_too_large", message: "Realtime message is too large." }));
      return;
    }
    const envelope = parseEnvelope(message);
    if (!envelope?.type || (envelope.v !== undefined && envelope.v !== 1)) {
      ws.send(publicEnvelope("error", { code: "bad_message", message: "Invalid realtime message." }));
      return;
    }
    const payload = envelope.payload && typeof envelope.payload === "object" && !Array.isArray(envelope.payload)
      ? sanitizeStructuredPayload(envelope.payload)
      : {};

    if (!this.consumeMessageRateLimit(ws, envelope.type)) {
      ws.send(publicEnvelope("error", { code: "message_rate_limited", message: "Please slow down." }));
      return;
    }

    if (envelope.type === "join" || envelope.type === "presence") {
      this.handlePresence(ws, payload);
      return;
    }
    if (envelope.type === "movement") {
      this.handleMovement(ws, payload);
      return;
    }
    if (envelope.type === "chat") {
      this.handleChat(ws, payload);
      return;
    }
    if (envelope.type === "avatar") {
      this.handleAvatar(ws, payload);
      return;
    }
    if (envelope.type === "debate") {
      this.broadcast("debate", this.withSender(ws, payload));
      return;
    }
    if (envelope.type === "challenge") {
      this.broadcast("challenge", this.withSender(ws, payload));
      return;
    }
    if (envelope.type === "debateSignal") {
      this.routeDebateSignal(ws, payload);
      return;
    }
    if (envelope.type === "ping") {
      ws.send(publicEnvelope("pong", { serverTimeMs: Date.now() }));
      return;
    }

    ws.send(publicEnvelope("error", { code: "unknown_type", message: "Unknown realtime message type." }));
  }

  webSocketClose() {
    this.markDirty();
    this.ensureSnapshotLoop();
  }

  webSocketError() {
    this.markDirty();
    this.ensureSnapshotLoop();
  }

  consumeMessageRateLimit(ws, type) {
    const config = EVENT_RATE_LIMITS[type];
    const session = this.getSession(ws);
    const eventTimestamps = session.eventTimestamps && typeof session.eventTimestamps === "object"
      ? session.eventTimestamps
      : {};
    const nowMs = Date.now();
    const globalResult = consumeEventRateLimit(
      eventTimestamps.__all__ || [],
      DEFAULTS.MESSAGE_RATE_LIMIT_MAX_MESSAGES,
      DEFAULTS.MESSAGE_RATE_LIMIT_WINDOW_MS,
      nowMs
    );
    const nextEventTimestamps = {
      ...eventTimestamps,
      __all__: globalResult.timestamps
    };
    if (!globalResult.allowed) {
      this.setSession(ws, { ...session, eventTimestamps: nextEventTimestamps });
      return false;
    }

    if (!config) {
      this.setSession(ws, { ...session, eventTimestamps: nextEventTimestamps });
      return true;
    }

    const result = consumeEventRateLimit(eventTimestamps[type] || [], config.max, config.windowMs, nowMs);
    this.setSession(ws, {
      ...session,
      eventTimestamps: {
        ...nextEventTimestamps,
        [type]: result.timestamps
      }
    });
    return result.allowed;
  }

  handlePresence(ws, payload) {
    const session = this.getSession(ws);
    const player = sanitizePlayerPayload({
      ...payload,
      clientId: session.clientId,
      roomId: this.roomId
    }, session.player);
    this.setSession(ws, { ...session, player });
    this.markDirty();
  }

  handleMovement(ws, payload) {
    const session = this.getSession(ws);
    const nowMs = Date.now();
    if (nowMs - Number(session.lastMovementAtMs || 0) < DEFAULTS.MOVEMENT_SEND_INTERVAL_MS) {
      return;
    }
    const movement = sanitizeMovementPayload(payload, session.player);
    const player = sanitizePlayerPayload({
      ...session.player,
      ...movement,
      clientId: session.clientId,
      roomId: this.roomId
    }, session.player);
    this.setSession(ws, {
      ...session,
      player,
      lastMovementAtMs: nowMs
    });
    this.markDirty();
  }

  handleAvatar(ws, payload) {
    const session = this.getSession(ws);
    const player = sanitizePlayerPayload({
      ...session.player,
      ...sanitizeMovementPayload(payload, session.player),
      clientId: session.clientId,
      roomId: this.roomId
    }, session.player);
    this.setSession(ws, { ...session, player });
    this.broadcast("avatar", player);
    this.markDirty();
  }

  handleChat(ws, payload) {
    const session = this.getSession(ws);
    const moderation = moderateChatMessage(payload.message);
    if (!moderation.message) {
      ws.send(publicEnvelope("error", { code: "empty_chat", message: "Chat message is empty." }));
      return;
    }
    if (!moderation.allowed) {
      ws.send(publicEnvelope("error", {
        code: "chat_restricted",
        message: "That message includes language that is not allowed on campus."
      }));
      return;
    }
    const limit = consumeChatRateLimit(session.chatTimestamps, Date.now());
    if (!limit.allowed) {
      this.setSession(ws, { ...session, chatTimestamps: limit.timestamps });
      ws.send(publicEnvelope("error", {
        code: "chat_rate_limited",
        message: "Please wait before sending another message."
      }));
      return;
    }
    const player = sanitizePlayerPayload({
      ...session.player,
      ...sanitizeMovementPayload(payload, session.player),
      clientId: session.clientId,
      roomId: this.roomId
    }, session.player);
    this.setSession(ws, {
      ...session,
      player,
      chatTimestamps: limit.timestamps
    });
    this.broadcast("chat", {
      ...player,
      message: moderation.message
    });
    this.markDirty();
  }

  routeDebateSignal(ws, payload) {
    const routedPayload = this.withSender(ws, payload);
    const targetClientId = cleanText(payload.targetClientId || payload.toClientId || "", 120);
    if (!targetClientId) {
      this.broadcast("debateSignal", routedPayload, { except: ws });
      return;
    }
    for (const socket of this.getSockets()) {
      const session = this.getSession(socket);
      if (session.clientId === targetClientId) {
        socket.send(publicEnvelope("debateSignal", routedPayload));
        return;
      }
    }
  }

  withSender(ws, payload) {
    const session = this.getSession(ws);
    return {
      ...sanitizeStructuredPayload(payload),
      roomId: this.roomId,
      clientId: session.clientId,
      userId: session.player.userId || null,
      sentAtMs: Date.now()
    };
  }

  getSockets() {
    return typeof this.state.getWebSockets === "function" ? this.state.getWebSockets() : [];
  }

  getSession(ws) {
    return ws.deserializeAttachment?.() || createSession(sanitizePlayerPayload({ roomId: this.roomId }));
  }

  setSession(ws, session) {
    ws.serializeAttachment(session);
  }

  getPlayers() {
    return this.getSockets()
      .map((socket) => this.getSession(socket).player)
      .filter((player) => player?.clientId && player.roomId === this.roomId)
      .slice(0, DEFAULTS.MAX_PLAYERS_PER_ROOM);
  }

  markDirty() {
    this.dirty = true;
  }

  ensureSnapshotLoop() {
    if (this.snapshotTimer) {
      return;
    }
    this.snapshotTimer = setInterval(() => {
      const socketCount = this.getSockets().length;
      if (socketCount === 0) {
        clearInterval(this.snapshotTimer);
        this.snapshotTimer = null;
        this.dirty = false;
        return;
      }
      if (this.dirty) {
        this.broadcastSnapshot();
      }
    }, DEFAULTS.SNAPSHOT_INTERVAL_MS);
  }

  broadcastSnapshot() {
    this.broadcast("snapshot", {
      roomId: this.roomId,
      full: true,
      serverTimeMs: Date.now(),
      players: this.getPlayers()
    });
    this.dirty = false;
  }

  broadcast(type, payload, options = {}) {
    const message = publicEnvelope(type, payload);
    for (const socket of this.getSockets()) {
      if (options.except && socket === options.except) {
        continue;
      }
      socket.send(message);
    }
  }
}

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders(env) });
    }

    const url = new URL(request.url);
    if (url.pathname === "/health") {
      return json({
        ok: true,
        service: "wscapp-realtime",
        defaults: DEFAULTS
      }, { headers: corsHeaders(env) });
    }

    const roomMatch = url.pathname.match(/^\/room\/([^/]+)\/?$/);
    if (!roomMatch) {
      return json({ ok: false, error: "Not found." }, { status: 404, headers: corsHeaders(env) });
    }
    if (!isAllowedOrigin(request, env)) {
      return json({ ok: false, error: "Origin not allowed." }, { status: 403 });
    }

    const roomId = sanitizeRoomId(roomMatch[1]);
    if (!roomId) {
      return json({ ok: false, error: "Invalid room id." }, { status: 400 });
    }
    if (request.headers.get("upgrade")?.toLowerCase() !== "websocket") {
      return json({ ok: false, error: "Expected WebSocket upgrade." }, { status: 426, headers: corsHeaders(env) });
    }

    const forwardedUrl = new URL(request.url);
    forwardedUrl.searchParams.set("roomId", roomId);
    forwardedUrl.searchParams.delete("userId");
    const id = env.CAMPUS_ROOM.idFromName(roomId);
    const stub = env.CAMPUS_ROOM.get(id);
    return stub.fetch(new Request(forwardedUrl.toString(), request));
  }
};

export const __testing = {
  sanitizeRoomId,
  sanitizeChatMessage,
  moderateChatMessage,
  sanitizePlayerPayload,
  sanitizeStructuredPayload,
  consumeChatRateLimit,
  consumeEventRateLimit
};

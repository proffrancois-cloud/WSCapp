const DEFAULT_ALLOWED_ORIGINS = [
  "https://wscapp.app",
  "https://www.wscapp.app",
  "https://proffrancois-cloud.github.io",
  "http://localhost:4173",
  "http://127.0.0.1:4173"
];

export const DEFAULTS = Object.freeze({
  MAX_PLAYERS_PER_ROOM: 50,
  MOVEMENT_SEND_INTERVAL_MS: 200,
  SNAPSHOT_INTERVAL_MS: 100,
  CHAT_RATE_LIMIT_MAX_MESSAGES: 2,
  CHAT_RATE_LIMIT_WINDOW_MS: 3000,
  CHAT_MAX_LENGTH: 120
});

const DIRECTIONS = new Set(["up", "down", "left", "right"]);
const ROOM_ID_PATTERN = /^[a-z0-9][a-z0-9_-]{0,63}$/;

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

export function consumeChatRateLimit(timestamps = [], nowMs = Date.now()) {
  const recent = timestamps.filter((timestamp) => nowMs - Number(timestamp || 0) < DEFAULTS.CHAT_RATE_LIMIT_WINDOW_MS);
  if (recent.length >= DEFAULTS.CHAT_RATE_LIMIT_MAX_MESSAGES) {
    return { allowed: false, timestamps: recent };
  }
  return { allowed: true, timestamps: [...recent, nowMs] };
}

export function sanitizePlayerPayload(payload = {}, fallback = {}) {
  const clientId = cleanText(payload.clientId || fallback.clientId || "", 120);
  return {
    clientId,
    userId: nullableText(payload.userId || fallback.userId || "", 160),
    roomId: sanitizeRoomId(payload.roomId || fallback.roomId || ""),
    displayName: cleanText(payload.displayName || payload.alpacaName || fallback.displayName || "Guest", 80) || "Guest",
    x: toFiniteNumber(payload.x, toFiniteNumber(fallback.x, 0)),
    y: toFiniteNumber(payload.y, toFiniteNumber(fallback.y, 0)),
    direction: cleanDirection(payload.direction || fallback.direction),
    moving: Boolean(payload.moving),
    seatId: nullableText(payload.seatId || fallback.seatId || "", 80),
    colorId: cleanText(payload.colorId || fallback.colorId || "cream", 40) || "cream",
    alpacaName: cleanText(payload.alpacaName || fallback.alpacaName || "", 80),
    schoolName: cleanText(payload.schoolName || fallback.schoolName || "", 120),
    country: cleanText(payload.country || fallback.country || "", 80),
    wscEventCount: Math.max(0, Math.floor(toFiniteNumber(payload.wscEventCount, fallback.wscEventCount || 0))),
    highestWscRound: cleanText(payload.highestWscRound || fallback.highestWscRound || "", 80),
    idRewards: Array.isArray(payload.idRewards) ? payload.idRewards.slice(0, 9) : Array.isArray(fallback.idRewards) ? fallback.idRewards.slice(0, 9) : [],
    createdAt: nullableText(payload.createdAt || fallback.createdAt || "", 80),
    debateRoom: nullableText(payload.debateRoom || fallback.debateRoom || "", 80),
    debateAudio: payload.debateAudio && typeof payload.debateAudio === "object" ? payload.debateAudio : fallback.debateAudio || null,
    updatedAtMs: Date.now()
  };
}

function sanitizeMovementPayload(payload = {}, fallback = {}) {
  return {
    x: toFiniteNumber(payload.x, fallback.x),
    y: toFiniteNumber(payload.y, fallback.y),
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
    return true;
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
    const clientId = cleanText(url.searchParams.get("clientId") || crypto.randomUUID(), 120);
    const player = sanitizePlayerPayload({
      clientId,
      userId: url.searchParams.get("userId") || "",
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
    const envelope = parseEnvelope(message);
    if (!envelope?.type) {
      ws.send(publicEnvelope("error", { code: "bad_message", message: "Invalid realtime message." }));
      return;
    }
    const payload = envelope.payload && typeof envelope.payload === "object" ? envelope.payload : {};

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
    const message = sanitizeChatMessage(payload.message);
    if (!message) {
      ws.send(publicEnvelope("error", { code: "empty_chat", message: "Chat message is empty." }));
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
      message
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
      ...payload,
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
    const id = env.CAMPUS_ROOM.idFromName(roomId);
    const stub = env.CAMPUS_ROOM.get(id);
    return stub.fetch(new Request(forwardedUrl.toString(), request));
  }
};

export const __testing = {
  sanitizeRoomId,
  sanitizeChatMessage,
  sanitizePlayerPayload,
  consumeChatRateLimit
};

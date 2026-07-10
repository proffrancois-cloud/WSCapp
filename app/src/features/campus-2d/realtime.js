(function () {
  const SCHEMA = "campus2d.realtime.v1";
  const MAX_PLAYERS_PER_ROOM = 50;
  const MOVEMENT_SEND_INTERVAL_MS = 200;
  const SNAPSHOT_INTERVAL_MS = 100;
  const CHAT_RATE_LIMIT_MAX_MESSAGES = 2;
  const CHAT_RATE_LIMIT_WINDOW_MS = 3000;
  const CHAT_MAX_LENGTH = 120;
  const MOVEMENT_PAYLOAD_FIELDS = Object.freeze([
    "clientId",
    "userId",
    "roomId",
    "x",
    "y",
    "direction",
    "moving",
    "seatId",
    "colorId",
    "seq",
    "sentAtMs"
  ]);
  const PUBLIC_PRESENCE_FIELDS = Object.freeze([
    "clientId",
    "userId",
    "roomId",
    "displayName",
    "x",
    "y",
    "direction",
    "colorId",
    "seatId",
    "schoolName",
    "alpacaName",
    "country",
    "wscEventCount",
    "highestWscRound",
    "idRewards",
    "createdAt",
    "debateRoom",
    "debateAudio",
    "scholarsChallenge",
    "updatedAtMs"
  ]);
  const DEFAULTS = Object.freeze({
    MAX_PLAYERS_PER_ROOM,
    MOVEMENT_SEND_INTERVAL_MS,
    SNAPSHOT_INTERVAL_MS,
    CHAT_RATE_LIMIT_MAX_MESSAGES,
    CHAT_RATE_LIMIT_WINDOW_MS,
    CHAT_MAX_LENGTH,
    MOVEMENT_PAYLOAD_FIELDS,
    PUBLIC_PRESENCE_FIELDS
  });
  const EVENTS = Object.freeze({
    move: "campus2d.avatar.move",
    snapshot: "campus2d.room.snapshot",
    chat: "campus2d.chat.message",
    avatar: "campus2d.avatar.update",
    debate: "campus2d.debate.state",
    debateSignal: "campus2d.debate.signal",
    challenge: "campus2d.scholars-challenge.state"
  });
  const DIRECTIONS = new Set(["up", "down", "left", "right"]);

  function createClientId() {
    const random = Math.random().toString(36).slice(2, 10);
    return `campus2d-${Date.now().toString(36)}-${random}`;
  }

  function sanitizeTopicPart(value) {
    return String(value || "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9_-]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 64) || "room";
  }

  function toFiniteNumber(value, fallback = 0) {
    const number = Number(value);
    return Number.isFinite(number) ? number : fallback;
  }

  function toOptionalString(value, maxLength = 80) {
    const text = String(value || "").trim();
    return text ? text.slice(0, maxLength) : "";
  }

  function toNullableString(value, maxLength = 80) {
    const text = toOptionalString(value, maxLength);
    return text || null;
  }

  function sanitizeDirection(value, fallback = "down") {
    return DIRECTIONS.has(value) ? value : fallback;
  }

  function sanitizeColorId(value) {
    return toOptionalString(value, 40) || "cream";
  }

  function sanitizeSeatId(value) {
    return toNullableString(value, 80);
  }

  function sanitizeText(value, maxLength = CHAT_MAX_LENGTH) {
    return String(value || "").replace(/\s+/g, " ").trim().slice(0, maxLength);
  }

  function compactMovementPayload(payload = {}) {
    const result = {
      x: toFiniteNumber(payload.x),
      y: toFiniteNumber(payload.y),
      direction: sanitizeDirection(payload.direction),
      moving: Boolean(payload.moving),
      seatId: sanitizeSeatId(payload.seatId),
      colorId: sanitizeColorId(payload.colorId)
    };
    if (Number.isFinite(Number(payload.seq))) {
      result.seq = Math.max(0, Math.floor(Number(payload.seq)));
    }
    return result;
  }

  function compactChatPayload(payload = {}) {
    const message = sanitizeText(payload.message);
    if (!message) {
      return null;
    }
    return {
      ...compactMovementPayload(payload),
      message
    };
  }

  function compactAvatarPayload(payload = {}) {
    return compactMovementPayload(payload);
  }

  function compactPublicPlayerPayload(payload = {}) {
    const idRewards = Array.isArray(payload.idRewards)
      ? payload.idRewards.slice(0, 9)
      : Array.isArray(payload.achievements)
        ? payload.achievements.slice(0, 9)
        : [];
    const result = {
      clientId: toOptionalString(payload.clientId, 120),
      userId: toNullableString(payload.userId, 160),
      roomId: toOptionalString(payload.roomId, 80),
      displayName: sanitizeText(payload.displayName || payload.alpacaName || "Guest", 80) || "Guest",
      x: toFiniteNumber(payload.x),
      y: toFiniteNumber(payload.y),
      direction: sanitizeDirection(payload.direction),
      colorId: sanitizeColorId(payload.colorId),
      seatId: sanitizeSeatId(payload.seatId),
      schoolName: sanitizeText(payload.schoolName || "", 120),
      alpacaName: sanitizeText(payload.alpacaName || payload.displayName || "", 80),
      country: sanitizeText(payload.country || "", 80),
      wscEventCount: Math.max(0, Math.floor(toFiniteNumber(payload.wscEventCount, 0))),
      highestWscRound: sanitizeText(payload.highestWscRound || "", 80),
      idRewards,
      createdAt: toNullableString(payload.createdAt, 80),
      debateRoom: toNullableString(payload.debateRoom, 80),
      debateAudio: payload.debateAudio && typeof payload.debateAudio === "object" ? payload.debateAudio : null,
      scholarsChallenge: payload.scholarsChallenge && typeof payload.scholarsChallenge === "object" ? payload.scholarsChallenge : null,
      updatedAtMs: Date.now()
    };
    delete result.email;
    return result;
  }

  function sanitizeOutgoingPayload(event, payload = {}) {
    if (event === EVENTS.move) {
      return compactMovementPayload(payload);
    }
    if (event === EVENTS.chat) {
      return compactChatPayload(payload);
    }
    if (event === EVENTS.avatar) {
      return compactAvatarPayload(payload);
    }
    return payload && typeof payload === "object" ? payload : {};
  }

  function flattenPresenceState(presenceState, localClientId, options = {}) {
    const roomId = options.roomId || "";
    const maxPlayers = Math.max(1, Number(options.maxPlayers) || MAX_PLAYERS_PER_ROOM);
    return Object.values(presenceState || {})
      .flat()
      .filter((presence) => presence && presence.clientId && presence.clientId !== localClientId)
      .filter((presence) => !roomId || presence.roomId === roomId)
      .sort((left, right) => Number(right.updatedAtMs || 0) - Number(left.updatedAtMs || 0))
      .slice(0, Math.max(0, maxPlayers - 1));
  }

  function getRoomPresenceRows(presenceState, localClientId, roomId = "") {
    return Object.values(presenceState || {})
      .flat()
      .filter((presence) => presence && presence.clientId && presence.clientId !== localClientId)
      .filter((presence) => !roomId || presence.roomId === roomId);
  }

  function createRoomChannel({ client, roomId, localPlayer, handlers = {}, limits = DEFAULTS }) {
    if (!client?.channel || !roomId || !localPlayer) {
      return null;
    }

    const clientId = localPlayer.clientId || createClientId();
    const topic = `alpaca-campus-2d::${sanitizeTopicPart(roomId)}`;
    const maxPlayers = Number(limits.MAX_PLAYERS_PER_ROOM) || MAX_PLAYERS_PER_ROOM;
    let subscribed = false;
    let destroyed = false;
    let channel = client.channel(topic, {
      config: {
        presence: { key: clientId },
        broadcast: { self: false }
      }
    });

    function getPresencePayload(extra = {}) {
      const nowMs = Date.now();
      const payload = {
        v: 1,
        schema: SCHEMA,
        kind: "presence",
        clientId,
        userId: localPlayer.userId || null,
        displayName: sanitizeText(localPlayer.displayName || "Guest", 80) || "Guest",
        roomId,
        x: toFiniteNumber(localPlayer.x),
        y: toFiniteNumber(localPlayer.y),
        direction: sanitizeDirection(localPlayer.direction),
        colorId: sanitizeColorId(localPlayer.colorId),
        seatId: sanitizeSeatId(localPlayer.seatId),
        schoolName: sanitizeText(localPlayer.schoolName || "", 120),
        createdAt: localPlayer.createdAt || null,
        updatedAtMs: nowMs,
        ...extra
      };
      delete payload.email;
      return payload;
    }

    function syncPresence() {
      if (destroyed) {
        return;
      }
      const presenceState = channel.presenceState();
      const roomRows = getRoomPresenceRows(presenceState, clientId, roomId);
      handlers.onPresenceSync?.(flattenPresenceState(presenceState, clientId, { roomId, maxPlayers }));
      if (roomRows.length + 1 > maxPlayers) {
        handlers.onRoomFull?.({
          roomId,
          maxPlayers,
          playerCount: roomRows.length + 1
        });
      }
    }

    channel = channel
      .on("presence", { event: "sync" }, syncPresence)
      .on("presence", { event: "join" }, syncPresence)
      .on("presence", { event: "leave" }, syncPresence)
      .on("broadcast", { event: EVENTS.move }, (payload) => handlers.onMove?.(payload.payload || payload))
      .on("broadcast", { event: EVENTS.snapshot }, (payload) => handlers.onSnapshot?.(payload.payload || payload))
      .on("broadcast", { event: EVENTS.chat }, (payload) => handlers.onChat?.(payload.payload || payload))
      .on("broadcast", { event: EVENTS.avatar }, (payload) => handlers.onAvatar?.(payload.payload || payload))
      .on("broadcast", { event: EVENTS.debate }, (payload) => handlers.onDebate?.(payload.payload || payload))
      .on("broadcast", { event: EVENTS.debateSignal }, (payload) => handlers.onDebateSignal?.(payload.payload || payload))
      .on("broadcast", { event: EVENTS.challenge }, (payload) => handlers.onChallenge?.(payload.payload || payload));

    function subscribe() {
      channel.subscribe(async (status) => {
        if (destroyed) {
          return;
        }
        handlers.onStatus?.(status);
        if (["CHANNEL_ERROR", "TIMED_OUT", "CLOSED"].includes(status)) {
          handlers.onError?.({
            status,
            message: `Realtime channel ${status.toLowerCase().replace(/_/g, " ")}.`
          });
        }
        if (status === "SUBSCRIBED") {
          subscribed = true;
          try {
            await channel.track(getPresencePayload());
            syncPresence();
          } catch (error) {
            handlers.onError?.(error);
          }
        }
      });
    }

    async function updatePresence(extra = {}) {
      if (!subscribed || destroyed) {
        return null;
      }
      try {
        return await channel.track(getPresencePayload(extra));
      } catch (error) {
        handlers.onError?.(error);
        return null;
      }
    }

    function send(event, payload) {
      if (!subscribed || destroyed) {
        return Promise.resolve(null);
      }
      const compactPayload = sanitizeOutgoingPayload(event, payload);
      if (!compactPayload) {
        return Promise.resolve(null);
      }
      const sentAtMs = Date.now();
      return Promise.resolve(channel.send({
        type: "broadcast",
        event,
        payload: {
          ...compactPayload,
          v: 1,
          schema: SCHEMA,
          roomId,
          clientId,
          userId: localPlayer.userId || null,
          sentAtMs
        }
      })).catch((error) => {
        handlers.onError?.(error);
        return null;
      });
    }

    async function destroy() {
      destroyed = true;
      try {
        if (subscribed && channel.untrack) {
          await channel.untrack();
        }
      } catch (_error) {}
      if (client.removeChannel) {
        client.removeChannel(channel);
      }
      subscribed = false;
    }

    return {
      clientId,
      topic,
      subscribe,
      updatePresence,
      sendMovement: (payload) => send(EVENTS.move, payload),
      sendSnapshot: (payload) => send(EVENTS.snapshot, payload),
      sendChat: (payload) => send(EVENTS.chat, payload),
      sendAvatar: (payload) => send(EVENTS.avatar, payload),
      sendDebate: (payload) => send(EVENTS.debate, payload),
      sendDebateSignal: (payload) => send(EVENTS.debateSignal, payload),
      sendChallenge: (payload) => send(EVENTS.challenge, payload),
      destroy
    };
  }

  function createSupabaseTransport({ client, limits = DEFAULTS } = {}) {
    let connection = null;
    return {
      type: "supabase",
      get clientId() {
        return connection?.clientId || "";
      },
      get topic() {
        return connection?.topic || "";
      },
      connect({ roomId, localPlayer, handlers = {} } = {}) {
        this.disconnect();
        connection = createRoomChannel({ client, roomId, localPlayer, handlers, limits });
        if (!connection) {
          return false;
        }
        connection.subscribe();
        return true;
      },
      disconnect() {
        const previous = connection;
        connection = null;
        return previous?.destroy?.() || Promise.resolve(null);
      },
      updatePresence(payload) {
        return connection?.updatePresence(payload) || Promise.resolve(null);
      },
      sendMovement(payload) {
        return connection?.sendMovement(payload) || Promise.resolve(null);
      },
      sendChat(payload) {
        return connection?.sendChat(payload) || Promise.resolve(null);
      },
      sendAvatar(payload) {
        return connection?.sendAvatar(payload) || Promise.resolve(null);
      },
      sendDebate(payload) {
        return connection?.sendDebate(payload) || Promise.resolve(null);
      },
      sendDebateSignal(payload) {
        return connection?.sendDebateSignal(payload) || Promise.resolve(null);
      },
      sendChallenge(payload) {
        return connection?.sendChallenge(payload) || Promise.resolve(null);
      }
    };
  }

  function safeJsonParse(value) {
    try {
      return JSON.parse(value);
    } catch (_error) {
      return null;
    }
  }

  function getRealtimeConfig() {
    return window.WSC_CAMPUS_2D_REALTIME_CONFIG || {};
  }

  function getTransportMode(config = getRealtimeConfig()) {
    const mode = String(config.mode || "supabase").trim().toLowerCase();
    return ["auto", "cloudflare", "supabase"].includes(mode) ? mode : "supabase";
  }

  function isCloudflareRealtimeHost(config = getRealtimeConfig()) {
    if (config.useOnAnyHost) {
      return true;
    }
    const host = window.location?.hostname || "";
    const hosts = Array.isArray(config.cloudflareHosts) && config.cloudflareHosts.length
      ? config.cloudflareHosts
      : ["wscapp.app", "www.wscapp.app"];
    return hosts.includes(host);
  }

  function getCloudflareEndpoint(config = getRealtimeConfig()) {
    return String(config.cloudflareEndpoint || "").trim();
  }

  function buildWebSocketUrl(endpoint, roomId, localPlayer = {}) {
    if (!endpoint) {
      return "";
    }
    const base = endpoint.endsWith("/") ? endpoint.slice(0, -1) : endpoint;
    const url = new URL(`${base}/${encodeURIComponent(sanitizeTopicPart(roomId))}`);
    url.searchParams.set("clientId", localPlayer.clientId || createClientId());
    if (localPlayer.userId) {
      url.searchParams.set("userId", localPlayer.userId);
    }
    return url.toString();
  }

  function createCloudflareWebSocketTransport({ endpoint = getCloudflareEndpoint(), limits = DEFAULTS } = {}) {
    let ws = null;
    let roomId = "";
    let localPlayer = null;
    let handlers = {};
    let destroyed = false;
    let opened = false;
    let clientId = "";

    function handleIncomingMessage(event) {
      const envelope = safeJsonParse(event.data);
      if (!envelope || typeof envelope !== "object") {
        return;
      }
      const payload = envelope.payload || envelope.snapshot || envelope;
      if (envelope.type === "snapshot") {
        handlers.onSnapshot?.(payload);
        return;
      }
      if (envelope.type === "presence") {
        handlers.onPresenceSync?.(Array.isArray(payload.players) ? payload.players : []);
        return;
      }
      if (envelope.type === "movement") {
        handlers.onMove?.(payload);
        return;
      }
      if (envelope.type === "chat") {
        handlers.onChat?.(payload);
        return;
      }
      if (envelope.type === "avatar") {
        handlers.onAvatar?.(payload);
        return;
      }
      if (envelope.type === "debate") {
        handlers.onDebate?.(payload);
        return;
      }
      if (envelope.type === "debateSignal") {
        handlers.onDebateSignal?.(payload);
        return;
      }
      if (envelope.type === "challenge") {
        handlers.onChallenge?.(payload);
        return;
      }
      if (envelope.type === "room_full") {
        handlers.onRoomFull?.(payload);
        return;
      }
      if (envelope.type === "error") {
        handlers.onError?.(payload);
      }
    }

    function sendEnvelope(type, payload = {}) {
      if (!ws || destroyed || ws.readyState !== WebSocket.OPEN) {
        return Promise.resolve(null);
      }
      ws.send(JSON.stringify({
        type,
        v: 1,
        schema: SCHEMA,
        roomId,
        clientId,
        sentAtMs: Date.now(),
        payload
      }));
      return Promise.resolve(true);
    }

    function sendCompact(type, payload = {}) {
      const compactPayload = type === "movement"
        ? compactMovementPayload(payload)
        : type === "chat"
          ? compactChatPayload(payload)
          : type === "avatar"
            ? compactAvatarPayload(payload)
            : payload;
      if (!compactPayload) {
        return Promise.resolve(null);
      }
      return sendEnvelope(type, {
        ...compactPayload,
        roomId,
        clientId,
        userId: localPlayer?.userId || null
      });
    }

    return {
      type: "cloudflare",
      get clientId() {
        return clientId;
      },
      get topic() {
        return roomId ? `cloudflare:${roomId}` : "";
      },
      get opened() {
        return opened;
      },
      connect({ roomId: nextRoomId, localPlayer: nextLocalPlayer, handlers: nextHandlers = {} } = {}) {
        this.disconnect();
        if (!endpoint || !nextRoomId || !nextLocalPlayer || typeof WebSocket !== "function") {
          return false;
        }
        roomId = nextRoomId;
        localPlayer = nextLocalPlayer;
        handlers = nextHandlers;
        clientId = localPlayer.clientId || createClientId();
        destroyed = false;
        opened = false;
        const wsUrl = buildWebSocketUrl(endpoint, roomId, { ...localPlayer, clientId });
        if (!wsUrl) {
          return false;
        }
        try {
          ws = new WebSocket(wsUrl);
        } catch (error) {
          handlers.onError?.(error);
          return false;
        }
        handlers.onStatus?.("CONNECTING");
        ws.addEventListener("open", () => {
          opened = true;
          handlers.onStatus?.("OPEN");
          sendEnvelope("join", compactPublicPlayerPayload({ ...localPlayer, roomId, clientId }));
        });
        ws.addEventListener("message", handleIncomingMessage);
        ws.addEventListener("error", () => {
          handlers.onError?.({
            status: "WEBSOCKET_ERROR",
            message: "Cloudflare realtime socket error."
          });
        });
        ws.addEventListener("close", () => {
          const wasDestroyed = destroyed;
          opened = false;
          handlers.onStatus?.("CLOSED");
          if (!wasDestroyed) {
            handlers.onError?.({
              status: "WEBSOCKET_CLOSED",
              message: "Cloudflare realtime socket closed."
            });
          }
        });
        return true;
      },
      disconnect() {
        destroyed = true;
        opened = false;
        if (ws && ws.readyState <= WebSocket.OPEN) {
          ws.close(1000, "disconnect");
        }
        ws = null;
        return Promise.resolve(null);
      },
      updatePresence(payload) {
        return sendEnvelope("presence", compactPublicPlayerPayload({ ...localPlayer, ...payload, roomId, clientId }));
      },
      sendMovement(payload) {
        return sendCompact("movement", payload);
      },
      sendChat(payload) {
        return sendCompact("chat", payload);
      },
      sendAvatar(payload) {
        return sendCompact("avatar", payload);
      },
      sendDebate(payload) {
        return sendCompact("debate", payload);
      },
      sendDebateSignal(payload) {
        return sendCompact("debateSignal", payload);
      },
      sendChallenge(payload) {
        return sendCompact("challenge", payload);
      }
    };
  }

  function createFallbackTransport(options = {}) {
    const primary = createCloudflareWebSocketTransport(options);
    const fallback = createSupabaseTransport(options);
    let active = primary;
    let fallbackStarted = false;
    let connectionOptions = null;

    function tryFallback(error) {
      if (fallbackStarted || !options.fallbackToSupabase) {
        return false;
      }
      fallbackStarted = true;
      primary.disconnect();
      active = fallback;
      if (!connectionOptions) {
        return false;
      }
      const connected = fallback.connect(connectionOptions);
      if (!connected) {
        connectionOptions.handlers?.onError?.(error);
      }
      return connected;
    }

    return {
      type: "cloudflare-with-supabase-fallback",
      get clientId() {
        return active.clientId;
      },
      get topic() {
        return active.topic;
      },
      connect(optionsForConnection = {}) {
        connectionOptions = {
          ...optionsForConnection,
          handlers: {
            ...(optionsForConnection.handlers || {}),
            onError(error) {
              if (tryFallback(error)) {
                return;
              }
              optionsForConnection.handlers?.onError?.(error);
            }
          }
        };
        active = primary;
        fallbackStarted = false;
        const connected = primary.connect(connectionOptions);
        if (!connected) {
          return tryFallback({ status: "WEBSOCKET_UNAVAILABLE" });
        }
        return true;
      },
      disconnect() {
        primary.disconnect();
        fallback.disconnect();
        active = primary;
        fallbackStarted = false;
        return Promise.resolve(null);
      },
      updatePresence(payload) {
        return active.updatePresence(payload);
      },
      sendMovement(payload) {
        return active.sendMovement(payload);
      },
      sendChat(payload) {
        return active.sendChat(payload);
      },
      sendAvatar(payload) {
        return active.sendAvatar(payload);
      },
      sendDebate(payload) {
        return active.sendDebate(payload);
      },
      sendDebateSignal(payload) {
        return active.sendDebateSignal(payload);
      },
      sendChallenge(payload) {
        return active.sendChallenge(payload);
      }
    };
  }

  function isTransportLike(value) {
    return Boolean(
      value &&
      typeof value.connect === "function" &&
      typeof value.disconnect === "function" &&
      typeof value.sendMovement === "function"
    );
  }

  function createTransport(options = {}) {
    if (isTransportLike(options.transport)) {
      return options.transport;
    }
    const config = getRealtimeConfig();
    const mode = getTransportMode(config);
    const cloudflareOptions = {
      ...options,
      endpoint: options.endpoint || getCloudflareEndpoint(config),
      fallbackToSupabase: config.fallbackToSupabase !== false
    };
    if (mode === "cloudflare") {
      return cloudflareOptions.fallbackToSupabase
        ? createFallbackTransport(cloudflareOptions)
        : createCloudflareWebSocketTransport(cloudflareOptions);
    }
    if (mode === "auto" && getCloudflareEndpoint(config) && isCloudflareRealtimeHost(config)) {
      return createFallbackTransport(cloudflareOptions);
    }
    return createSupabaseTransport(options);
  }

  window.WSC_CAMPUS_2D_REALTIME = Object.freeze({
    SCHEMA,
    DEFAULTS,
    MOVEMENT_PAYLOAD_FIELDS,
    PUBLIC_PRESENCE_FIELDS,
    EVENTS,
    createClientId,
    createTransport,
    createSupabaseTransport,
    createCloudflareWebSocketTransport,
    createRoomChannel,
    flattenPresenceState,
    compactPublicPlayerPayload
  });
}());

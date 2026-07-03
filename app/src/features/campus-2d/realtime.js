(function () {
  const SCHEMA = "campus2d.realtime.v1";
  const EVENTS = Object.freeze({
    move: "campus2d.avatar.move",
    chat: "campus2d.chat.message",
    avatar: "campus2d.avatar.update"
  });

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

  function flattenPresenceState(presenceState, localClientId) {
    return Object.values(presenceState || {})
      .flat()
      .filter((presence) => presence && presence.clientId && presence.clientId !== localClientId)
      .sort((left, right) => Number(right.updatedAtMs || 0) - Number(left.updatedAtMs || 0));
  }

  function createRoomChannel({ client, roomId, localPlayer, handlers = {} }) {
    if (!client?.channel || !roomId || !localPlayer) {
      return null;
    }

    const clientId = localPlayer.clientId || createClientId();
    const topic = `alpaca-campus-2d::${sanitizeTopicPart(roomId)}`;
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
      return {
        v: 1,
        schema: SCHEMA,
        kind: "presence",
        clientId,
        userId: localPlayer.userId || null,
        displayName: localPlayer.displayName || "Guest",
        roomId,
        x: Number(localPlayer.x) || 0,
        y: Number(localPlayer.y) || 0,
        direction: localPlayer.direction || "down",
        colorId: localPlayer.colorId || "cream",
        updatedAtMs: nowMs,
        ...extra
      };
    }

    function syncPresence() {
      if (destroyed) {
        return;
      }
      handlers.onPresenceSync?.(flattenPresenceState(channel.presenceState(), clientId));
    }

    channel = channel
      .on("presence", { event: "sync" }, syncPresence)
      .on("presence", { event: "join" }, syncPresence)
      .on("presence", { event: "leave" }, syncPresence)
      .on("broadcast", { event: EVENTS.move }, (payload) => handlers.onMove?.(payload.payload || payload))
      .on("broadcast", { event: EVENTS.chat }, (payload) => handlers.onChat?.(payload.payload || payload))
      .on("broadcast", { event: EVENTS.avatar }, (payload) => handlers.onAvatar?.(payload.payload || payload));

    function subscribe() {
      channel.subscribe(async (status) => {
        if (destroyed) {
          return;
        }
        handlers.onStatus?.(status);
        if (status === "SUBSCRIBED") {
          subscribed = true;
          await channel.track(getPresencePayload());
          syncPresence();
        }
      });
    }

    async function updatePresence(extra = {}) {
      if (!subscribed || destroyed) {
        return null;
      }
      return channel.track(getPresencePayload(extra));
    }

    function send(event, payload) {
      if (!subscribed || destroyed) {
        return Promise.resolve(null);
      }
      const sentAtMs = Date.now();
      return channel.send({
        type: "broadcast",
        event,
        payload: {
          v: 1,
          schema: SCHEMA,
          roomId,
          clientId,
          userId: localPlayer.userId || null,
          sentAtMs,
          ...payload
        }
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
      sendChat: (payload) => send(EVENTS.chat, payload),
      sendAvatar: (payload) => send(EVENTS.avatar, payload),
      destroy
    };
  }

  window.WSC_CAMPUS_2D_REALTIME = Object.freeze({
    SCHEMA,
    EVENTS,
    createClientId,
    createRoomChannel,
    flattenPresenceState
  });
}());

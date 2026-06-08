(function () {
  const EVENTS = Object.freeze({
    move: "campus3d.avatar.move",
    legacyMove: "avatar_move",
    chat: "room_chat",
    avatar: "campus3d.avatar.emote",
    legacyAvatar: "avatar_update",
    quest: "quest_event",
    object: "campus3d.object.event",
    legacyObject: "object_event",
    seatClaimed: "campus3d.seat.claimed",
    seatReleased: "campus3d.seat.released"
  });

  function createClientId() {
    const random = Math.random().toString(36).slice(2, 10);
    return `campus-${Date.now().toString(36)}-${random}`;
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
    const rows = Object.values(presenceState || {})
      .flat()
      .filter((presence) => presence && presence.clientId !== localClientId)
      .sort((left, right) => String(right.onlineAt || "").localeCompare(String(left.onlineAt || "")));
    const byUserId = new Map();
    rows.forEach((presence) => {
      const userId = String(presence.userId || presence.clientId || "");
      if (userId && !byUserId.has(userId)) {
        byUserId.set(userId, presence);
      }
    });
    return Array.from(byUserId.values());
  }

  function createCampusRoomChannel({ client, roomId, localPlayer, handlers = {} }) {
    if (!client?.channel || !roomId || !localPlayer) {
      return null;
    }

    const clientId = localPlayer.clientId || createClientId();
    const topic = `alpaca-campus::${sanitizeTopicPart(roomId)}`;
    let subscribed = false;
    let channel = client.channel(topic, {
      config: {
        presence: {
          key: clientId
        },
        broadcast: {
          self: false
        }
      }
    });

    function getPresencePayload(extra = {}) {
      const nowMs = Date.now();
      return {
        v: 1,
        schema: "campus3d.realtime.v1",
        kind: "presence",
        clientId,
        userId: localPlayer.userId,
        displayName: localPlayer.displayName,
        alpacaName: localPlayer.alpacaName || localPlayer.displayName,
        roomId,
        avatar: localPlayer.avatar || {},
        title: localPlayer.title || "",
        level: localPlayer.level || 1,
        xp: localPlayer.xp || 0,
        x: Number(localPlayer.x) || 640,
        y: Number(localPlayer.y) || 560,
        status: "online",
        onlineAt: new Date().toISOString(),
        onlineAtMs: nowMs,
        updatedAtMs: nowMs,
        interest: { mode: "room" },
        ...extra
      };
    }

    function syncPresence() {
      const presence = flattenPresenceState(channel.presenceState(), clientId);
      handlers.onPresenceSync?.(presence);
    }

    channel = channel
      .on("presence", { event: "sync" }, syncPresence)
      .on("presence", { event: "join" }, syncPresence)
      .on("presence", { event: "leave" }, syncPresence)
      .on("broadcast", { event: EVENTS.move }, (payload) => handlers.onMove?.(payload.payload || payload))
      .on("broadcast", { event: EVENTS.legacyMove }, (payload) => handlers.onMove?.(payload.payload || payload))
      .on("broadcast", { event: EVENTS.chat }, (payload) => handlers.onChat?.(payload.payload || payload))
      .on("broadcast", { event: EVENTS.avatar }, (payload) => handlers.onAvatar?.(payload.payload || payload))
      .on("broadcast", { event: EVENTS.legacyAvatar }, (payload) => handlers.onAvatar?.(payload.payload || payload))
      .on("broadcast", { event: EVENTS.quest }, (payload) => handlers.onQuest?.(payload.payload || payload))
      .on("broadcast", { event: EVENTS.object }, (payload) => handlers.onObject?.(payload.payload || payload))
      .on("broadcast", { event: EVENTS.legacyObject }, (payload) => handlers.onObject?.(payload.payload || payload))
      .on("broadcast", { event: EVENTS.seatClaimed }, (payload) => handlers.onObject?.(payload.payload || payload))
      .on("broadcast", { event: EVENTS.seatReleased }, (payload) => handlers.onObject?.(payload.payload || payload));

    function subscribe() {
      channel.subscribe(async (status) => {
        handlers.onStatus?.(status);
        if (status === "SUBSCRIBED") {
          subscribed = true;
          await channel.track(getPresencePayload());
          syncPresence();
        }
      });
    }

    async function updatePresence(extra = {}) {
      if (!subscribed) {
        return null;
      }
      return channel.track(getPresencePayload(extra));
    }

    function send(event, payload) {
      if (!subscribed) {
        return Promise.resolve(null);
      }
      const sentAtMs = Date.now();
      return channel.send({
        type: "broadcast",
        event,
        payload: {
          v: 1,
          schema: "campus3d.realtime.v1",
          roomId,
          userId: localPlayer.userId,
          clientId,
          sentAt: new Date(sentAtMs).toISOString(),
          sentAtMs,
          ...payload
        }
      });
    }

    function sendMovement(command) {
      return send(EVENTS.move, command);
    }

    function sendChat(message) {
      return send(EVENTS.chat, message);
    }

    function sendAvatar(avatar) {
      return send(EVENTS.avatar, avatar);
    }

    function sendQuest(eventPayload) {
      return send(EVENTS.quest, eventPayload);
    }

    function sendObject(eventPayload) {
      return send(eventPayload?.eventName || EVENTS.object, eventPayload);
    }

    async function destroy() {
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
      sendMovement,
      sendChat,
      sendAvatar,
      sendQuest,
      sendObject,
      destroy
    };
  }

  window.WSC_ALPACA_CAMPUS_REALTIME = Object.freeze({
    EVENTS,
    createClientId,
    createCampusRoomChannel,
    flattenPresenceState
  });
}());

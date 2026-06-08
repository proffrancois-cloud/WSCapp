(function () {
  const SUPPORTED_GAMES = new Set(["alpacapardy", "run", "quiz", "race", "alpaquiz"]);

  function nowIso(now = new Date()) {
    return now instanceof Date ? now.toISOString() : new Date(now).toISOString();
  }

  function createId(prefix) {
    const random = Math.random().toString(36).slice(2, 10);
    return `${prefix}-${Date.now().toString(36)}-${random}`;
  }

  function assertSupportedGame(gameType) {
    if (!SUPPORTED_GAMES.has(gameType)) {
      throw new Error(`Unsupported live game type: ${gameType}`);
    }
  }

  function createSession({ id = createId("session"), gameType, hostPlayerId, settings = {}, now = new Date() }) {
    assertSupportedGame(gameType);
    const timestamp = nowIso(now);
    return {
      id,
      gameType,
      hostPlayerId: hostPlayerId || null,
      status: "lobby",
      settings: { ...settings },
      players: [],
      events: [],
      revision: 0,
      createdAt: timestamp,
      updatedAt: timestamp
    };
  }

  function createPlayer({ id = createId("player"), userId = null, displayName, role = "player", now = new Date() }) {
    return {
      id,
      userId,
      displayName: String(displayName || "Alpaca").trim() || "Alpaca",
      role,
      joinedAt: nowIso(now),
      connected: true
    };
  }

  function addPlayer(session, player, now = new Date()) {
    const exists = session.players.some((item) => item.id === player.id);
    const players = exists
      ? session.players.map((item) => item.id === player.id ? { ...item, ...player, connected: true } : item)
      : session.players.concat(player);

    return touch({
      ...session,
      players
    }, now);
  }

  function removePlayer(session, playerId, now = new Date()) {
    return touch({
      ...session,
      players: session.players.map((player) => (
        player.id === playerId ? { ...player, connected: false } : player
      ))
    }, now);
  }

  function appendEvent(session, event, now = new Date()) {
    const nextRevision = session.revision + 1;
    const normalizedEvent = {
      id: event.id || createId("event"),
      type: event.type,
      playerId: event.playerId || null,
      payload: event.payload || {},
      revision: nextRevision,
      createdAt: nowIso(now)
    };

    return touch({
      ...session,
      events: session.events.concat(normalizedEvent),
      revision: nextRevision
    }, now);
  }

  function touch(session, now) {
    return {
      ...session,
      updatedAt: nowIso(now)
    };
  }

  function getPublicSnapshot(session) {
    const lastEvent = session.events[session.events.length - 1] || null;
    return {
      id: session.id,
      gameType: session.gameType,
      status: session.status,
      hostPlayerId: session.hostPlayerId,
      settings: { ...session.settings },
      players: session.players.map((player) => ({
        id: player.id,
        displayName: player.displayName,
        role: player.role,
        connected: player.connected
      })),
      revision: session.revision,
      lastEventId: lastEvent?.id || null,
      updatedAt: session.updatedAt
    };
  }

  window.WSC_LIVE_SESSION_SERVICE = Object.freeze({
    supportedGames: Array.from(SUPPORTED_GAMES),
    createSession,
    createPlayer,
    addPlayer,
    removePlayer,
    appendEvent,
    getPublicSnapshot
  });
}());

(function () {
  const STORAGE_KEY = "wsc-alpaca-campus-state-v2";
  const CAMPUS_STATS_KEY = "campus";
  const CAMPUS_STATE_VERSION = 2;

  function nowIso() {
    return new Date().toISOString();
  }

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function getDefaultCampusState() {
    return {
      version: CAMPUS_STATE_VERSION,
      profile: {
        displayName: "Alpaca",
        level: 1,
        totalXp: 0,
        currentRoom: "school-lobby",
        lastPosition: { x: 1568, y: 1716 },
        roomPositions: {
          "school-lobby": { x: 1568, y: 1716 }
        }
      },
      avatar: {
        woolColor: "alpaca-09",
        outfitId: "overall",
        accessoryHead: "none",
        accessoryFace: "none",
        accessoryNeck: "none",
        selectedTitle: "new-arrival"
      },
      quests: {},
      unlocks: [],
      inventory: ["new-arrival"],
      updatedAt: nowIso()
    };
  }

  function safeParseJson(value, fallback) {
    if (!value) {
      return fallback;
    }
    try {
      return JSON.parse(value);
    } catch (_error) {
      return fallback;
    }
  }

  function readLocalState() {
    try {
      return normalizeCampusState(safeParseJson(window.localStorage.getItem(STORAGE_KEY), null));
    } catch (_error) {
      return getDefaultCampusState();
    }
  }

  function writeLocalState(campusState) {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(normalizeCampusState(campusState)));
    } catch (_error) {}
  }

  function normalizeCampusState(value) {
    const defaults = getDefaultCampusState();
    const source = value && typeof value === "object" ? value : {};
    const isCurrentVersion = Number(source.version) >= CAMPUS_STATE_VERSION;
    const profile = source.profile && typeof source.profile === "object" ? source.profile : {};
    const avatar = source.avatar && typeof source.avatar === "object" ? source.avatar : {};
    const legacyColorIds = window.WSC_ALPACA_CAMPUS_COSMETICS?.legacyColorIds || {};
    const colorIds = new Set((window.WSC_ALPACA_CAMPUS_COSMETICS?.woolColors || []).map((color) => color.id));
    const outfitIds = new Set((window.WSC_ALPACA_CAMPUS_COSMETICS?.outfits || []).map((outfit) => outfit.id));
    const woolColor = legacyColorIds[avatar.woolColor] || avatar.woolColor || defaults.avatar.woolColor;
    const outfitId = avatar.outfitId || defaults.avatar.outfitId;
    const position = isCurrentVersion && profile.lastPosition && typeof profile.lastPosition === "object"
      ? profile.lastPosition
      : defaults.profile.lastPosition;
    const roomPositions = isCurrentVersion && profile.roomPositions && typeof profile.roomPositions === "object"
      ? profile.roomPositions
      : defaults.profile.roomPositions;

    return {
      version: CAMPUS_STATE_VERSION,
      profile: {
        ...defaults.profile,
        ...profile,
        level: Math.max(1, Number(profile.level) || defaults.profile.level),
        totalXp: Math.max(0, Number(profile.totalXp) || 0),
        currentRoom: String(profile.currentRoom || defaults.profile.currentRoom),
        lastPosition: {
          x: Number.isFinite(Number(position.x)) ? Number(position.x) : defaults.profile.lastPosition.x,
          y: Number.isFinite(Number(position.y)) ? Number(position.y) : defaults.profile.lastPosition.y
        },
        roomPositions: Object.fromEntries(Object.entries(roomPositions).map(([roomId, point]) => [
          String(roomId),
          {
            x: Number.isFinite(Number(point?.x)) ? Number(point.x) : defaults.profile.lastPosition.x,
            y: Number.isFinite(Number(point?.y)) ? Number(point.y) : defaults.profile.lastPosition.y
          }
        ]))
      },
      avatar: {
        ...defaults.avatar,
        ...avatar,
        woolColor: colorIds.has(woolColor) ? woolColor : defaults.avatar.woolColor,
        outfitId: outfitIds.has(outfitId) ? outfitId : defaults.avatar.outfitId
      },
      quests: source.quests && typeof source.quests === "object" ? { ...source.quests } : {},
      unlocks: Array.isArray(source.unlocks) ? [...new Set(source.unlocks.map(String))] : [],
      inventory: Array.isArray(source.inventory) ? [...new Set(source.inventory.map(String))] : [...defaults.inventory],
      updatedAt: String(source.updatedAt || nowIso())
    };
  }

  function getCampusStateFromProgress(progressRow) {
    const stats = progressRow?.game_stats && typeof progressRow.game_stats === "object"
      ? progressRow.game_stats
      : {};
    return normalizeCampusState(stats[CAMPUS_STATS_KEY]);
  }

  async function fetchProgress(client, userId) {
    if (!client || !userId) {
      return { data: null, error: null };
    }
    return client
      .from("alpaca_progress")
      .select("game_stats,raw_mastered_entries")
      .eq("user_id", userId)
      .maybeSingle();
  }

  async function loadCampusState(client, userId, { anonymous = false } = {}) {
    const localState = readLocalState();
    if (!client || !userId || anonymous) {
      return {
        campusState: localState,
        source: "local",
        rawProgress: null
      };
    }

    const response = await fetchProgress(client, userId);
    if (response.error) {
      return {
        campusState: localState,
        source: "local",
        rawProgress: null,
        error: response.error
      };
    }

    if (!response.data) {
      return {
        campusState: localState,
        source: "local",
        rawProgress: null
      };
    }

    const remoteState = getCampusStateFromProgress(response.data);
    const localUpdated = Date.parse(localState.updatedAt || 0) || 0;
    const remoteUpdated = Date.parse(remoteState.updatedAt || 0) || 0;
    const campusState = remoteUpdated >= localUpdated ? remoteState : localState;
    writeLocalState(campusState);

    return {
      campusState,
      source: remoteUpdated >= localUpdated ? "supabase" : "local",
      rawProgress: response.data
    };
  }

  async function saveCampusState(client, userId, campusState, { anonymous = false, rawProgress = null } = {}) {
    const normalized = normalizeCampusState({
      ...campusState,
      updatedAt: nowIso()
    });
    writeLocalState(normalized);

    if (!client || !userId || anonymous) {
      return { data: normalized, error: null, source: "local" };
    }

    let progressRow = rawProgress;
    if (!progressRow) {
      const fetched = await fetchProgress(client, userId);
      if (fetched.error) {
        return { data: normalized, error: fetched.error, source: "local" };
      }
      progressRow = fetched.data || null;
    }

    const gameStats = {
      ...(progressRow?.game_stats && typeof progressRow.game_stats === "object" ? progressRow.game_stats : {}),
      [CAMPUS_STATS_KEY]: normalized
    };
    const rawMastery = progressRow?.raw_mastered_entries && typeof progressRow.raw_mastered_entries === "object"
      ? progressRow.raw_mastered_entries
      : {};

    const response = await client
      .from("alpaca_progress")
      .upsert({
        user_id: userId,
        game_stats: gameStats,
        raw_mastered_entries: rawMastery,
        updated_at: nowIso()
      }, { onConflict: "user_id" })
      .select("game_stats,raw_mastered_entries")
      .maybeSingle();

    return {
      data: normalized,
      error: response.error || null,
      source: response.error ? "local" : "supabase",
      rawProgress: response.data || progressRow
    };
  }

  function awardQuest(campusState, quest) {
    const next = normalizeCampusState(clone(campusState));
    if (!quest || next.quests[quest.id]?.status === "completed") {
      return next;
    }

    next.quests[quest.id] = {
      status: "completed",
      completedAt: nowIso(),
      updatedAt: nowIso()
    };

    next.profile.totalXp += Math.max(0, Number(quest.rewards?.xp) || 0);
    next.profile.level = 1 + Math.floor(next.profile.totalXp / 150);

    (quest.rewards?.unlocks || []).forEach((unlockId) => {
      if (!next.unlocks.includes(unlockId)) {
        next.unlocks.push(unlockId);
      }
    });

    if (quest.rewards?.titleId && !next.inventory.includes(quest.rewards.titleId)) {
      next.inventory.push(quest.rewards.titleId);
    }

    if (quest.rewards?.titleId) {
      next.avatar.selectedTitle = quest.rewards.titleId;
    }

    next.updatedAt = nowIso();
    return next;
  }

  window.WSC_ALPACA_CAMPUS_API = Object.freeze({
    STORAGE_KEY,
    CAMPUS_STATS_KEY,
    getDefaultCampusState,
    normalizeCampusState,
    readLocalState,
    writeLocalState,
    loadCampusState,
    saveCampusState,
    awardQuest
  });
}());

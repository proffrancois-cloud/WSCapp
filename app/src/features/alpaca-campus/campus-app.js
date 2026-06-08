(function () {
  const DEFAULT_ROOM_ID = "school-lobby";
  const LEGACY_ROOM_IDS = new Set(["learn-lobby"]);
  const ANON_ID_KEY = "wsc-alpaca-campus-anon-client-id";
  const MAX_CHAT_LOG = 48;

  const dom = {};
  let supabaseClient = null;
  let session = null;
  let profile = null;
  let rawProgress = null;
  let campusState = null;
  let localPlayer = null;
  let roomChannel = null;
  let gameHandle = null;
  let sceneApi = null;
  let latestPresence = [];
  let saveTimer = null;
  let realtimeMode = "loading";
  let currentRoomId = DEFAULT_ROOM_ID;
  let campusInputLocked = false;

  function $(selector) {
    return document.querySelector(selector);
  }

  function getAnonId() {
    try {
      const existing = window.localStorage.getItem(ANON_ID_KEY);
      if (existing) {
        return existing;
      }
      const next = `guest-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
      window.localStorage.setItem(ANON_ID_KEY, next);
      return next;
    } catch (_error) {
      return `guest-${Math.random().toString(36).slice(2, 10)}`;
    }
  }

  function clear(node) {
    while (node?.firstChild) {
      node.removeChild(node.firstChild);
    }
  }

  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) {
      node.className = className;
    }
    if (text !== undefined && text !== null) {
      node.textContent = String(text);
    }
    return node;
  }

  function button(label, className, onClick) {
    const node = el("button", className || "campus-btn", label);
    node.type = "button";
    node.addEventListener("click", onClick);
    return node;
  }

  function trustedHtmlFragment(html) {
    const template = document.createElement("template");
    template.innerHTML = String(html || "");
    template.content.querySelectorAll("script, style, iframe, object, embed").forEach((node) => node.remove());
    return template.content.cloneNode(true);
  }

  function titleLabel(titleId) {
    return window.WSC_ALPACA_CAMPUS_COSMETICS.getTitle(titleId)?.label || "";
  }

  function getAvailableTitles() {
    const inventory = new Set(campusState.inventory || []);
    window.WSC_ALPACA_CAMPUS_QUESTS.getCompletedQuestIds(campusState.quests).forEach((questId) => {
      const titleId = window.WSC_ALPACA_CAMPUS_QUESTS.getQuest(questId)?.rewards?.titleId;
      if (titleId) {
        inventory.add(titleId);
      }
    });
    return window.WSC_ALPACA_CAMPUS_COSMETICS.titles.filter((title) => (
      !title.unlockQuestId || inventory.has(title.id)
    ));
  }

  function getLevelProgress(totalXp) {
    const xp = Math.max(0, Number(totalXp) || 0);
    const currentLevelStart = Math.floor(xp / 150) * 150;
    const next = currentLevelStart + 150;
    return {
      percent: Math.min(100, Math.round(((xp - currentLevelStart) / (next - currentLevelStart)) * 100)),
      next
    };
  }

  function getRealtimeDisplay(status) {
    if (status === "SUBSCRIBED") {
      return { text: "Live room connected", mode: "live" };
    }
    if (status === "CLOSED" || status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
      return { text: "Offline local mode", mode: "offline" };
    }
    return { text: "Connecting live room...", mode: "connecting" };
  }

  function getQuestStateLabel(state) {
    return {
      locked: "Locked",
      available: "Ready",
      in_progress: "Started",
      completed: "Done"
    }[state] || String(state || "").replace("_", " ");
  }

  function isDrawerOpen() {
    return Boolean(dom.drawer && !dom.drawer.hidden);
  }

  function setInputLocked(value) {
    campusInputLocked = Boolean(value);
    dom.root?.setAttribute("data-input-locked", campusInputLocked ? "true" : "false");
  }

  function stopOverlayEvent(event) {
    event.stopPropagation();
  }

  function bindOverlayGuards() {
    [
      dom.drawer,
      dom.chatLog,
      dom.chatForm,
      dom.chatInput,
      dom.toastRail,
      $(".campus-chat"),
      $(".campus-toolbar"),
      $(".campus-hud-profile"),
      $(".campus-live-status")
    ].filter(Boolean).forEach((node) => {
      ["pointerdown", "mousedown", "touchstart", "click", "dblclick"].forEach((type) => {
        node.addEventListener(type, stopOverlayEvent);
      });
    });

    dom.chatInput.addEventListener("keydown", stopOverlayEvent);
  }

  function bindDom() {
    dom.root = $(".campus-root");
    dom.game = $("#campus-game");
    dom.status = $("#campus-status");
    dom.onlineCount = $("#campus-online-count");
    dom.avatarDot = $(".campus-avatar-dot");
    dom.playerName = $("#campus-player-name");
    dom.playerTitle = $("#campus-player-title");
    dom.level = $("#campus-level");
    dom.xpLabel = $("#campus-xp-label");
    dom.xpBar = $("#campus-xp-bar");
    dom.drawer = $("#campus-drawer");
    dom.drawerTitle = $("#campus-drawer-title");
    dom.drawerEyebrow = $("#campus-drawer-eyebrow");
    dom.drawerBody = $("#campus-drawer-body");
    dom.closeDrawer = $("#campus-close-drawer");
    dom.chatForm = $("#campus-chat-form");
    dom.chatInput = $("#campus-chat-input");
    dom.chatLog = $("#campus-chat-log");
    dom.toastRail = $("#campus-toast-rail");

    dom.closeDrawer.addEventListener("click", closeDrawer);
    document.querySelectorAll("[data-campus-panel]").forEach((node) => {
      node.addEventListener("click", (event) => {
        event.stopPropagation();
        openPanel(node.dataset.campusPanel);
      });
    });
    dom.chatForm.addEventListener("submit", handleChatSubmit);
    bindOverlayGuards();
  }

  async function initializeAuthAndState() {
    supabaseClient = window.WSC_AUTH_SERVICE.createClient(window.WSC_SUPABASE_CONFIG, window.supabase);
    if (supabaseClient?.auth?.getSession) {
      const response = await supabaseClient.auth.getSession();
      session = response.data?.session || null;
    }

    const userId = session?.user?.id || getAnonId();
    if (session?.user?.id && window.WSC_SUPABASE_PROFILE_SERVICE?.fetchProfile) {
      const profileResponse = await window.WSC_SUPABASE_PROFILE_SERVICE.fetchProfile(supabaseClient, session.user.id);
      profile = profileResponse.data || null;
    }

    const loaded = await window.WSC_ALPACA_CAMPUS_API.loadCampusState(supabaseClient, session?.user?.id, {
      anonymous: !session?.user?.id
    });
    campusState = loaded.campusState;
    rawProgress = loaded.rawProgress || null;

    const displayName = profile?.alpaca_name || campusState.profile.displayName || "Guest Alpaca";
    const savedRoomId = campusState.profile.currentRoom;
    const validSavedRoom = window.WSC_ALPACA_CAMPUS_ROOMS.getRoom(savedRoomId)?.id === savedRoomId;
    currentRoomId = validSavedRoom && !LEGACY_ROOM_IDS.has(savedRoomId) ? savedRoomId : DEFAULT_ROOM_ID;
    const roomPosition = campusState.profile.roomPositions?.[currentRoomId];
    const spawnPoint = window.WSC_ALPACA_CAMPUS_ROOMS.getSpawnPoint(currentRoomId);
    const startPosition = roomPosition || spawnPoint;
    campusState.profile.displayName = displayName;
    campusState.profile.currentRoom = currentRoomId;
    campusState.profile.lastPosition = { ...startPosition };
    campusState.profile.roomPositions = {
      ...(campusState.profile.roomPositions || {}),
      [currentRoomId]: { ...startPosition }
    };
    campusState.profile.level = 1 + Math.floor((Number(campusState.profile.totalXp) || 0) / 150);

    localPlayer = {
      clientId: window.WSC_ALPACA_CAMPUS_REALTIME.createClientId(),
      userId,
      displayName,
      alpacaName: displayName,
      avatar: { ...campusState.avatar },
      title: titleLabel(campusState.avatar.selectedTitle),
      level: campusState.profile.level,
      xp: campusState.profile.totalXp,
      roomId: currentRoomId,
      x: startPosition.x,
      y: startPosition.y,
      seatId: null,
      seatType: null
    };
  }

  function startGame() {
    gameHandle = window.WSC_ALPACA_CAMPUS_WORLD.createCampusWorldGame({
      containerId: "campus-game",
      initialRoomId: currentRoomId,
      campusState,
      localPlayer,
      callbacks: {
        isInputLocked() {
          return campusInputLocked;
        },
        onReady(api) {
          sceneApi = api;
          if (new URLSearchParams(window.location.search).has("campusDebug")) {
            window.WSC_ALPACA_CAMPUS_DEBUG = {
              getSnapshot: () => sceneApi?.getDebugSnapshot?.() || null
            };
          }
          sceneApi.updatePresence(latestPresence);
        },
        onRoomLoaded(room, position) {
          currentRoomId = room.id;
          campusState.profile.currentRoom = room.id;
          updateStoredPosition(position, room.id);
          renderHud();
        },
        onMoveIntent(command) {
          roomChannel?.sendMovement({
            ...command,
            displayName: localPlayer.displayName,
            alpacaName: localPlayer.alpacaName,
            avatar: localPlayer.avatar,
            title: localPlayer.title,
            level: localPlayer.level,
            xp: localPlayer.xp,
            roomId: currentRoomId
          });
        },
        onLocalPosition(position, room) {
          const roomId = room?.id || currentRoomId;
          updateStoredPosition(position, roomId);
          localPlayer.x = position.x;
          localPlayer.y = position.y;
          localPlayer.roomId = roomId;
          persistCampusState({ debounce: true });
          roomChannel?.updatePresence({ x: position.x, y: position.y, roomId });
        },
        onObjectInteract(object) {
          openPanel(object.panel || "coach", object);
        },
        onPortal(portal) {
          transitionToRoom(portal.targetRoomId, portal.targetSpawnId || "default");
        },
        onObjectEvent(eventPayload) {
          roomChannel?.sendObject({ ...eventPayload, displayName: localPlayer.displayName });
        },
        onSeatChange(eventPayload) {
          localPlayer.seatId = eventPayload.action === "seat" ? eventPayload.seatId : null;
          localPlayer.seatType = eventPayload.action === "seat" ? eventPayload.seatType : null;
          if (eventPayload.action === "seat") {
            localPlayer.x = eventPayload.x;
            localPlayer.y = eventPayload.y;
            updateStoredPosition({ x: eventPayload.x, y: eventPayload.y }, currentRoomId);
            persistCampusState({ debounce: true });
          }
          roomChannel?.sendObject({ ...eventPayload, displayName: localPlayer.displayName });
          roomChannel?.updatePresence({
            seatId: localPlayer.seatId,
            seatType: localPlayer.seatType,
            x: localPlayer.x,
            y: localPlayer.y
          });
        },
        onSeatUnavailable(object) {
          appendSystemMessage(`${object.label} is already occupied.`);
        },
        onWalkCloser(object) {
          appendSystemMessage(`Walking closer to ${object.label}.`);
        }
      }
    });
  }

  function updateStoredPosition(position, roomId = currentRoomId) {
    campusState.profile.currentRoom = roomId;
    campusState.profile.lastPosition = { x: position.x, y: position.y };
    campusState.profile.roomPositions = {
      ...(campusState.profile.roomPositions || {}),
      [roomId]: { x: position.x, y: position.y }
    };
  }

  async function startRealtime(roomId = currentRoomId) {
    if (roomChannel) {
      await roomChannel.destroy();
      roomChannel = null;
    }
    latestPresence = [];
    renderOnlineCount();
    if (!supabaseClient?.channel) {
      setStatus("Offline local mode", "offline");
      return;
    }

    setStatus("Connecting live room...", "connecting");
    localPlayer.roomId = roomId;
    roomChannel = window.WSC_ALPACA_CAMPUS_REALTIME.createCampusRoomChannel({
      client: supabaseClient,
      roomId,
      localPlayer,
      handlers: {
        onStatus(status) {
          const display = getRealtimeDisplay(status);
          setStatus(display.text, display.mode);
          if (display.mode === "offline") {
            latestPresence = [];
            renderOnlineCount();
          }
        },
        onPresenceSync(players) {
          latestPresence = players || [];
          sceneApi?.updatePresence(latestPresence);
          renderOnlineCount();
        },
        onMove(payload) {
          sceneApi?.applyRemoteMove(payload);
        },
        onChat(payload) {
          if (payload?.roomId && payload.roomId !== currentRoomId) {
            return;
          }
          const normalized = window.WSC_ALPACA_CAMPUS_CHAT_SAFETY.normalizeChatMessage(payload.text || payload.message);
          if (!normalized.ok) {
            return;
          }
          appendChat({
            name: payload.displayName || payload.alpacaName || "Alpaca",
            text: normalized.text,
            isLocal: false
          });
          sceneApi?.showChatBubble(payload.userId || payload.clientId, normalized.text);
        },
        onAvatar(payload) {
          if (payload?.roomId && payload.roomId !== currentRoomId) {
            return;
          }
          sceneApi?.applyRemoteAvatar(payload);
        },
        onQuest(payload) {
          if (payload?.questTitle) {
            appendSystemMessage(`${payload.displayName || "An alpaca"} completed ${payload.questTitle}.`);
          }
        },
        onObject(payload) {
          sceneApi?.applyObjectEvent(payload);
        }
      }
    });

    if (roomChannel) {
      roomChannel.subscribe();
    }
  }

  async function transitionToRoom(roomId, spawnId = "default") {
    if (!window.WSC_ALPACA_CAMPUS_ROOMS.getRoom(roomId)) {
      appendSystemMessage("That room is not open yet.");
      return;
    }
    closeDrawer();
    currentRoomId = roomId;
    const spawnPoint = window.WSC_ALPACA_CAMPUS_ROOMS.getSpawnPoint(roomId, spawnId);
    updateStoredPosition(spawnPoint, roomId);
    localPlayer.roomId = roomId;
    localPlayer.x = spawnPoint.x;
    localPlayer.y = spawnPoint.y;
    localPlayer.seatId = null;
    localPlayer.seatType = null;
    clear(dom.chatLog);
    appendSystemMessage(`Entered ${window.WSC_ALPACA_CAMPUS_ROOMS.getRoom(roomId).title}.`);
    sceneApi?.loadRoom(roomId, spawnId, spawnPoint);
    await startRealtime(roomId);
    persistCampusState({ immediate: true });
  }

  function setStatus(message, mode = realtimeMode) {
    realtimeMode = mode;
    dom.status.textContent = message;
    dom.root.dataset.realtime = mode;
    dom.status.closest(".campus-live-status")?.setAttribute("data-state", mode);
  }

  function renderOnlineCount() {
    const count = 1 + latestPresence.length;
    dom.onlineCount.textContent = realtimeMode === "offline" ? "1 local" : `${count} online`;
  }

  function renderHud() {
    const progress = getLevelProgress(campusState.profile.totalXp);
    if (dom.playerName) dom.playerName.textContent = localPlayer.displayName;
    if (dom.playerTitle) dom.playerTitle.textContent = localPlayer.title || "New Arrival";
    if (dom.level) dom.level.textContent = `Level ${campusState.profile.level}`;
    if (dom.xpLabel) dom.xpLabel.textContent = `${campusState.profile.totalXp} XP`;
    if (dom.xpBar) dom.xpBar.style.width = `${progress.percent}%`;
    updateHudAvatar();
    renderOnlineCount();
  }

  function getAvatarVisuals(avatar = campusState.avatar) {
    const assets = window.WSC_ALPACA_CAMPUS_AVATAR_ASSETS;
    return {
      color: assets?.getColor?.(avatar.woolColor),
      outfit: assets?.getOutfit?.(avatar.outfitId)
    };
  }

  function updateHudAvatar() {
    if (!dom.avatarDot) {
      return;
    }
    const { color, outfit } = getAvatarVisuals();
    if (color?.previewSrc) {
      dom.avatarDot.style.setProperty("--avatar-base", `url("${color.previewSrc}")`);
      dom.avatarDot.style.setProperty("--avatar-outfit", outfit?.previewSrc ? `url("${outfit.previewSrc}")` : "none");
      dom.avatarDot.classList.add("has-avatar-preview");
      dom.avatarDot.title = `${color.label}${outfit?.label ? ` · ${outfit.label}` : ""}`;
      return;
    }
    dom.avatarDot.style.setProperty("--avatar-base", "none");
    dom.avatarDot.style.setProperty("--avatar-outfit", "none");
    dom.avatarDot.classList.remove("has-avatar-preview");
  }

  function renderAvatarComposite(target, avatar = campusState.avatar) {
    clear(target);
    const { color, outfit } = getAvatarVisuals(avatar);
    [
      ["base", color?.previewSrc, color?.label || "Alpaca color"],
      ["outfit", outfit?.previewSrc, outfit?.label || "Outfit"]
    ].forEach(([layer, src, alt]) => {
      if (!src) {
        return;
      }
      const image = el("img", `campus-avatar-layer is-${layer}`);
      image.src = src;
      image.alt = alt;
      image.draggable = false;
      target.appendChild(image);
    });
  }

  function renderQuestSummary(target) {
    if (!target) {
      return;
    }
    if (target.id === "campus-quest-mini") {
      clear(target);
    }
    const quests = window.WSC_ALPACA_CAMPUS_QUESTS.getQuestListWithState(campusState.quests);
    target.appendChild(el("div", "campus-quest-mini-title", "Active quests"));
    const list = el("div", "campus-quest-list");
    quests.forEach((quest) => {
      const item = el("div", `campus-quest-row is-${quest.state}`);
      item.appendChild(el("span", "campus-quest-name", quest.title));
      item.appendChild(el("span", "campus-quest-state", getQuestStateLabel(quest.state)));
      list.appendChild(item);
    });
    target.appendChild(list);
  }

  function closeDrawer() {
    dom.drawer.hidden = true;
    dom.drawer.classList.remove("is-open");
    setInputLocked(false);
  }

  function openDrawer({ eyebrow, title }) {
    dom.drawerEyebrow.textContent = eyebrow || "Alpaca Campus";
    dom.drawerTitle.textContent = title || "Panel";
    clear(dom.drawerBody);
    dom.drawer.hidden = false;
    dom.drawer.classList.add("is-open");
    setInputLocked(true);
  }

  function openPanel(panelId, object = null) {
    if (panelId === "my-alpaca") {
      renderMyAlpacaPanel();
      return;
    }
    if (panelId === "quest-log") {
      renderQuestLogPanel();
      return;
    }
    if (panelId === "settings") {
      renderSettingsPanel();
      return;
    }

    const panel = window.WSC_ALPACA_CAMPUS_CONTENT.getPanel(panelId, object || {});
    openDrawer(panel);
    renderContentPanel(panel, object);
  }

  function renderContentPanel(panel, object) {
    dom.drawerBody.appendChild(el("p", "campus-panel-summary", panel.summary));

    if (panel.featuredVideo?.embedUrl) {
      const videoCard = el("section", "campus-media-hero");
      const iframe = el("iframe", "campus-video-frame");
      iframe.src = panel.featuredVideo.embedUrl;
      iframe.title = panel.featuredVideo.title || "Alpaca Channel video";
      iframe.loading = "lazy";
      iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
      iframe.allowFullscreen = true;
      videoCard.appendChild(iframe);
      if (panel.featuredVideo.subtitle) {
        videoCard.appendChild(el("span", "campus-media-meta", panel.featuredVideo.subtitle));
      }
      dom.drawerBody.appendChild(videoCard);
    } else if (panel.featuredImage) {
      const imageCard = el("section", "campus-media-hero");
      const image = el("img", "");
      image.src = panel.featuredImage;
      image.alt = panel.title || "WSC visual";
      image.loading = "lazy";
      imageCard.appendChild(image);
      if (panel.featuredMeta) {
        imageCard.appendChild(el("span", "campus-media-meta", panel.featuredMeta));
      }
      dom.drawerBody.appendChild(imageCard);
    }

    if (object?.questId) {
      renderQuestInteraction(dom.drawerBody, object.questId);
    }

    if (Array.isArray(panel.notes)) {
      const list = el("div", "campus-card-grid compact");
      panel.notes.forEach((note) => list.appendChild(el("div", "campus-mini-card", note)));
      dom.drawerBody.appendChild(list);
    }

    if (Array.isArray(panel.subjects)) {
      const grid = el("div", "campus-card-grid");
      panel.subjects.forEach((subject) => {
        const card = el("article", "campus-content-card");
        card.style.setProperty("--accent", subject.color || "#2d6f69");
        card.appendChild(el("h3", "", subject.label));
        card.appendChild(el("p", "", subject.description));
        grid.appendChild(card);
      });
      dom.drawerBody.appendChild(grid);
    }

    if (Array.isArray(panel.insights)) {
      const grid = el("div", "campus-card-grid");
      panel.insights.forEach((insight) => {
        const card = el("article", "campus-content-card");
        card.appendChild(el("h3", "", insight.title));
        card.appendChild(el("p", "", insight.body));
        grid.appendChild(card);
      });
      dom.drawerBody.appendChild(grid);
    }

    if (panel.firstAtom) {
      const card = el("article", "campus-feature-card");
      card.appendChild(el("h3", "", panel.firstAtom.title));
      card.appendChild(el("p", "", panel.firstAtom.body));
      if (panel.firstAtom.keywords.length) {
        const chips = el("div", "campus-chip-row");
        panel.firstAtom.keywords.forEach((keyword) => chips.appendChild(el("span", "campus-chip", keyword)));
        card.appendChild(chips);
      }
      dom.drawerBody.appendChild(card);
    }

    if (Array.isArray(panel.roomGroups)) {
      panel.roomGroups.forEach((group) => {
        const section = el("section", "campus-panel-section");
        section.appendChild(el("h3", "", group.title));
        if (group.summary) {
          section.appendChild(el("p", "campus-panel-summary compact", group.summary));
        }
        const grid = el("div", "campus-card-grid");
        (group.rooms || []).forEach((roomItem) => {
          const card = el("article", "campus-content-card");
          card.appendChild(el("h3", "", roomItem.title));
          card.appendChild(el("p", "", roomItem.description));
          card.appendChild(el("span", "campus-chip", roomItem.status));
          if (roomItem.id !== currentRoomId) {
            card.appendChild(button("Go", "campus-btn compact", () => transitionToRoom(roomItem.id, "default")));
          } else {
            card.appendChild(el("span", "campus-chip is-current", "Current room"));
          }
          grid.appendChild(card);
        });
        section.appendChild(grid);
        dom.drawerBody.appendChild(section);
      });
    } else if (Array.isArray(panel.rooms)) {
      const grid = el("div", "campus-card-grid");
      panel.rooms.forEach((roomItem) => {
        const card = el("article", "campus-content-card");
        card.appendChild(el("h3", "", roomItem.title));
        card.appendChild(el("p", "", roomItem.description));
        card.appendChild(el("span", "campus-chip", roomItem.status));
        if (roomItem.id !== currentRoomId) {
          card.appendChild(button("Go", "campus-btn compact", () => transitionToRoom(roomItem.id, "default")));
        } else {
          card.appendChild(el("span", "campus-chip is-current", "Current room"));
        }
        grid.appendChild(card);
      });
      dom.drawerBody.appendChild(grid);
    }

    if (Array.isArray(panel.alpacards) && panel.alpacards.length) {
      const list = el("div", "campus-link-list");
      panel.alpacards.forEach((cardItem) => {
        const row = el(cardItem.href ? "a" : "div", "campus-link-row");
        if (cardItem.href) {
          row.href = cardItem.href;
          row.target = "_blank";
          row.rel = "noopener";
        }
        if (cardItem.imageSrc) {
          const thumbnail = el("img", "campus-row-thumb");
          thumbnail.src = cardItem.imageSrc;
          thumbnail.alt = cardItem.title;
          thumbnail.loading = "lazy";
          row.appendChild(thumbnail);
        }
        row.appendChild(el("strong", "", cardItem.title));
        row.appendChild(el("span", "", cardItem.meta || "Alpacard"));
        row.appendChild(el("span", "", cardItem.summary));
        list.appendChild(row);
      });
      dom.drawerBody.appendChild(list);
    }

    if (Array.isArray(panel.videos) && panel.videos.length) {
      const list = el("div", "campus-link-list");
      panel.videos.forEach((video) => {
        const row = el(video.href ? "a" : "div", "campus-link-row");
        if (video.href) {
          row.href = video.href;
          row.target = "_blank";
          row.rel = "noopener";
        }
        if (video.imageSrc) {
          const thumbnail = el("img", "campus-row-thumb");
          thumbnail.src = video.imageSrc;
          thumbnail.alt = video.title;
          thumbnail.loading = "lazy";
          row.appendChild(thumbnail);
        }
        row.appendChild(el("strong", "", video.title));
        row.appendChild(el("span", "", video.summary));
        list.appendChild(row);
      });
      const controls = el("div", "campus-form-actions");
      controls.appendChild(button("Change video", "campus-btn compact", () => appendSystemMessage("Video switching is ready for the next media pass.")));
      dom.drawerBody.appendChild(list);
      dom.drawerBody.appendChild(controls);
    }

    if (Array.isArray(panel.mediaCards) && panel.mediaCards.length) {
      const grid = el("div", "campus-media-grid");
      panel.mediaCards.forEach((media) => {
        const card = el("article", "campus-media-card");
        if (media.imageSrc) {
          const image = el("img", "");
          image.src = media.imageSrc;
          image.alt = media.title;
          image.loading = "lazy";
          card.appendChild(image);
        }
        card.appendChild(el("strong", "", media.title));
        if (media.summary) {
          card.appendChild(el("span", "", media.summary));
        }
        grid.appendChild(card);
      });
      dom.drawerBody.appendChild(grid);
    }

    if (Array.isArray(panel.links) && panel.links.length) {
      const list = el("div", "campus-link-list");
      panel.links.forEach((link) => {
        const row = el("a", "campus-link-row");
        row.href = link.href;
        row.target = "_blank";
        row.rel = "noopener";
        row.appendChild(el("strong", "", link.title));
        row.appendChild(el("span", "", link.summary || link.href));
        list.appendChild(row);
      });
      dom.drawerBody.appendChild(list);
    }

    const guideList = panel.guides || panel.sections || panel.atoms;
    if (Array.isArray(guideList) && guideList.length) {
      const list = el("div", "campus-link-list");
      guideList.forEach((item) => {
        const row = el(item.href ? "a" : "div", "campus-link-row");
        if (item.href) {
          row.href = `../${item.href}`;
          row.target = "_blank";
          row.rel = "noopener";
        }
        row.appendChild(el("strong", "", item.title));
        row.appendChild(el("span", "", item.summary || (item.subjects || []).join(" · ")));
        list.appendChild(row);
      });
      dom.drawerBody.appendChild(list);
    }

    if (panel.htmlContent) {
      const reader = el("section", "campus-guide-reader");
      reader.appendChild(trustedHtmlFragment(panel.htmlContent));
      dom.drawerBody.appendChild(reader);
    }
  }

  function renderQuestInteraction(target, questId) {
    const quest = window.WSC_ALPACA_CAMPUS_QUESTS.getQuest(questId);
    const state = window.WSC_ALPACA_CAMPUS_QUESTS.getQuestState(questId, campusState.quests);
    if (!quest) {
      return;
    }

    const card = el("section", `campus-quest-card is-${state}`);
    card.appendChild(el("span", "campus-chip", getQuestStateLabel(state)));
    card.appendChild(el("h3", "", quest.title));
    quest.dialogue.forEach((line) => card.appendChild(el("p", "", line)));

    if (state === "locked") {
      const requirements = quest.requirements.map((id) => window.WSC_ALPACA_CAMPUS_QUESTS.getQuest(id)?.title || id).join(", ");
      card.appendChild(el("p", "campus-muted", `Locked until: ${requirements}`));
    } else if (state === "available") {
      card.appendChild(button("Start quest", "campus-btn primary", () => {
        campusState.quests[quest.id] = {
          status: "in_progress",
          startedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        persistCampusState({ immediate: true });
        sceneApi?.setQuestStates(campusState.quests);
        openPanel(quest.giverId === "coach-alpaca" ? "coach" : quest.giverId === "syllabus-board" ? "syllabus" : "big-ideas", { questId: quest.id });
      }));
    } else if (state === "in_progress") {
      card.appendChild(el("p", "campus-question", quest.prompt));
      const options = el("div", "campus-answer-list");
      quest.options.forEach((option) => {
        options.appendChild(button(option.text, "campus-answer-btn", () => {
          if (option.correct) {
            completeQuest(quest);
          } else {
            appendSystemMessage("Not quite. Try the answer that best connects WSC preparation to a live learning journey.");
          }
        }));
      });
      card.appendChild(options);
    } else {
      card.appendChild(el("p", "campus-success", `Completed · +${quest.rewards.xp} XP`));
    }

    target.appendChild(card);
  }

  function renderQuestLogPanel() {
    openDrawer({ eyebrow: "Campus Progress", title: "Quest Log" });
    dom.drawerBody.appendChild(el("p", "campus-panel-summary", "Starter quests begin in School Club and carry into the wider campus as rooms become deeper missions."));
    renderQuestSummary(dom.drawerBody);
  }

  function renderSettingsPanel() {
    openDrawer({ eyebrow: "Campus", title: "Settings" });
    const room = window.WSC_ALPACA_CAMPUS_ROOMS.getRoom(currentRoomId);
    dom.drawerBody.appendChild(el("p", "campus-panel-summary", `Current room: ${room.title}.`));
    const grid = el("div", "campus-card-grid compact");
    grid.appendChild(el("div", "campus-mini-card", `Room: ${room.title}`));
    grid.appendChild(el("div", "campus-mini-card", session?.user?.id ? "Alpaccount connected" : "Guest alpaca"));
    dom.drawerBody.appendChild(grid);
    const actions = el("div", "campus-form-actions align-start");
    actions.appendChild(button("My Alpaca", "campus-btn primary", () => renderMyAlpacaPanel()));
    dom.drawerBody.appendChild(actions);
    const home = el("a", "campus-btn", "Back to WSC app");
    home.href = "../";
    dom.drawerBody.appendChild(home);
  }

  function renderMyAlpacaPanel() {
    openDrawer({ eyebrow: "Avatar", title: "My Alpaca" });
    const assets = window.WSC_ALPACA_CAMPUS_AVATAR_ASSETS;
    const form = el("form", "campus-avatar-form");
    const previewWrap = el("section", "campus-avatar-preview-card");
    const preview = el("div", "campus-avatar-preview");
    renderAvatarComposite(preview);
    previewWrap.appendChild(preview);
    const previewCopy = el("div", "campus-avatar-preview-copy");
    const selectedLook = el("span", "", "");
    previewCopy.appendChild(selectedLook);
    previewWrap.appendChild(previewCopy);
    form.appendChild(previewWrap);

    const colors = el("fieldset", "campus-fieldset");
    colors.appendChild(el("legend", "", "Color"));
    const swatches = el("div", "campus-swatch-row");
    window.WSC_ALPACA_CAMPUS_COSMETICS.woolColors.forEach((color) => {
      const swatch = button(color.label, "campus-swatch", () => {
        campusState.avatar.woolColor = color.id;
        commitAvatarPanelChange();
      });
      swatch.dataset.colorId = color.id;
      swatch.title = color.label;
      swatch.setAttribute("aria-label", color.label);
      swatch.style.setProperty("--swatch", color.hex);
      swatches.appendChild(swatch);
    });
    colors.appendChild(swatches);
    form.appendChild(colors);

    const outfitField = el("fieldset", "campus-fieldset");
    outfitField.appendChild(el("legend", "", "Outfit"));
    const outfitGrid = el("div", "campus-outfit-grid");
    (assets?.outfits || []).forEach((outfit) => {
      const card = button("", "campus-outfit-card", () => {
        campusState.avatar.outfitId = outfit.id;
        commitAvatarPanelChange();
      });
      card.dataset.outfitId = outfit.id;
      card.setAttribute("aria-label", outfit.label);
      card.title = outfit.label;
      const image = el("img", "");
      image.src = outfit.iconSrc;
      image.alt = "";
      image.loading = "lazy";
      card.appendChild(image);
      card.appendChild(el("span", "", outfit.label));
      outfitGrid.appendChild(card);
    });
    outfitField.appendChild(outfitGrid);
    form.appendChild(outfitField);

    const actions = el("div", "campus-form-actions");
    actions.appendChild(button("Done", "campus-btn primary", () => closeDrawer()));
    form.appendChild(actions);
    dom.drawerBody.appendChild(form);

    function refreshSelection() {
      renderAvatarComposite(preview);
      const color = window.WSC_ALPACA_CAMPUS_COSMETICS.getColor(campusState.avatar.woolColor);
      const outfit = window.WSC_ALPACA_CAMPUS_COSMETICS.getOutfit(campusState.avatar.outfitId);
      selectedLook.textContent = `${color.label} · ${outfit.label}`;
      swatches.querySelectorAll(".campus-swatch").forEach((node) => {
        const selected = node.dataset.colorId === color.id;
        node.classList.toggle("is-selected", selected);
        node.setAttribute("aria-pressed", selected ? "true" : "false");
      });
      outfitGrid.querySelectorAll(".campus-outfit-card").forEach((node) => {
        const selected = node.dataset.outfitId === outfit.id;
        node.classList.toggle("is-selected", selected);
        node.setAttribute("aria-pressed", selected ? "true" : "false");
      });
    }

    function commitAvatarPanelChange() {
      applyAvatarChanges({ debounce: true, silent: true });
      refreshSelection();
    }

    refreshSelection();
  }

  function applyAvatarChanges({ immediate = false, debounce = false, silent = false } = {}) {
    campusState.profile.level = 1 + Math.floor((Number(campusState.profile.totalXp) || 0) / 150);
    localPlayer.avatar = { ...campusState.avatar };
    localPlayer.title = titleLabel(campusState.avatar.selectedTitle);
    localPlayer.level = campusState.profile.level;
    localPlayer.x = campusState.profile.lastPosition.x;
    localPlayer.y = campusState.profile.lastPosition.y;
    sceneApi?.updateLocalPlayer(localPlayer);
    roomChannel?.sendAvatar({
      displayName: localPlayer.displayName,
      alpacaName: localPlayer.alpacaName,
      avatar: localPlayer.avatar,
      title: localPlayer.title,
      level: localPlayer.level,
      xp: localPlayer.xp,
      roomId: currentRoomId
    });
    roomChannel?.updatePresence({
      avatar: localPlayer.avatar,
      title: localPlayer.title,
      level: localPlayer.level,
      xp: localPlayer.xp,
      roomId: currentRoomId
    });
    persistCampusState({ immediate, debounce });
    renderHud();
    if (!silent) {
      appendSystemMessage("Your alpaca look is saved.");
    }
  }

  function completeQuest(quest) {
    campusState = window.WSC_ALPACA_CAMPUS_API.awardQuest(campusState, quest);
    campusState.profile.level = 1 + Math.floor((Number(campusState.profile.totalXp) || 0) / 150);
    localPlayer.xp = campusState.profile.totalXp;
    localPlayer.level = campusState.profile.level;
    localPlayer.avatar = { ...campusState.avatar };
    localPlayer.title = titleLabel(campusState.avatar.selectedTitle);
    persistCampusState({ immediate: true });
    renderHud();
    sceneApi?.setQuestStates(campusState.quests);
    sceneApi?.updateLocalPlayer(localPlayer);
    roomChannel?.sendQuest({
      questId: quest.id,
      questTitle: quest.title,
      displayName: localPlayer.displayName
    });
    roomChannel?.updatePresence({
      xp: localPlayer.xp,
      level: localPlayer.level,
      avatar: localPlayer.avatar,
      title: localPlayer.title,
      roomId: currentRoomId
    });
    appendSystemMessage(`Quest complete: ${quest.title}. +${quest.rewards.xp} XP`);
    renderQuestLogPanel();
  }

  async function persistCampusState({ immediate = false, debounce = false } = {}) {
    if (saveTimer) {
      window.clearTimeout(saveTimer);
      saveTimer = null;
    }

    const run = async () => {
      const response = await window.WSC_ALPACA_CAMPUS_API.saveCampusState(supabaseClient, session?.user?.id, campusState, {
        anonymous: !session?.user?.id,
        rawProgress
      });
      if (response.rawProgress) {
        rawProgress = response.rawProgress;
      }
      if (response.error) {
        setStatus("Saved locally", "offline");
      }
    };

    if (immediate) {
      await run();
      return;
    }

    if (debounce) {
      saveTimer = window.setTimeout(run, 500);
      return;
    }

    await run();
  }

  function appendChat({ name, text, isLocal }) {
    const row = el("li", `campus-chat-message${isLocal ? " is-local" : ""}`);
    row.appendChild(el("span", "campus-chat-name", name));
    row.appendChild(el("span", "campus-chat-text", text));
    dom.chatLog.appendChild(row);
    while (dom.chatLog.children.length > MAX_CHAT_LOG) {
      dom.chatLog.removeChild(dom.chatLog.firstChild);
    }
    dom.chatLog.scrollTop = dom.chatLog.scrollHeight;
  }

  function appendSystemMessage(text) {
    const row = el("li", "campus-toast", text);
    dom.toastRail.appendChild(row);
    while (dom.toastRail.children.length > 3) {
      dom.toastRail.removeChild(dom.toastRail.firstChild);
    }
    window.setTimeout(() => {
      row.classList.add("is-leaving");
      window.setTimeout(() => row.remove(), 240);
    }, 3600);
  }

  function handleChatSubmit(event) {
    event.preventDefault();
    const normalized = window.WSC_ALPACA_CAMPUS_CHAT_SAFETY.normalizeChatMessage(dom.chatInput.value);
    if (!normalized.ok) {
      return;
    }
    dom.chatInput.value = "";
    appendChat({ name: localPlayer.displayName, text: normalized.text, isLocal: true });
    sceneApi?.showChatBubble(localPlayer.userId, normalized.text);
    roomChannel?.sendChat({
      text: normalized.text,
      displayName: localPlayer.displayName,
      alpacaName: localPlayer.alpacaName,
      roomId: currentRoomId
    });
  }

  async function init() {
    bindDom();
    setStatus("Loading campus...", "loading");
    await initializeAuthAndState();
    renderHud();
    renderQuestSummary($("#campus-quest-mini"));
    startGame();
    startRealtime();
    appendSystemMessage(`Welcome to ${window.WSC_ALPACA_CAMPUS_ROOMS.getRoom(currentRoomId).title}.`);
    window.addEventListener("beforeunload", () => {
      roomChannel?.destroy();
      gameHandle?.destroy();
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    init().catch((error) => {
      console.error(error);
      setStatus("Campus failed to load", "offline");
    });
  });
}());

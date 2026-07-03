(function () {
  const STORAGE_COLOR_KEY = "wscCampus2dAlpacaColor";
  const STORAGE_ROOM_KEY = "wscCampus2dRoom";
  const CHAT_TTL_MS = 7600;
  const MOVE_SPEED = 238;
  const MOVE_EPSILON = 6;
  const PORTAL_COOLDOWN_MS = 650;

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

  function isWalkable(room, point) {
    const inWalkZone = (room.walkZones || []).some((zone) => isPointInRect(point, zone));
    const inBlockedZone = (room.blockedZones || []).some((zone) => isPointInRect(point, zone));
    const inSeat = (room.seats || []).some((seat) => isPointInRect(point, seat.zone));
    return inSeat || (inWalkZone && !inBlockedZone);
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

  function getFrame(direction, moving, nowMs) {
    const index = moving ? Math.floor(nowMs / 150) % 3 : 1;
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
    let lastPortalAt = 0;
    let lastMoveSentAt = 0;
    let lastPresenceSentAt = 0;
    let camera = { scale: 1, x: 0, y: 0 };
    let activeTarget = null;
    let pendingSeatId = null;
    let destroyed = false;
    const keys = new Set();
    const remotePlayers = new Map();
    const remoteElements = new Map();

    const spawn = room.spawnPoints.default;
    const localPlayer = {
      clientId: localClientId,
      userId: identity.userId || null,
      displayName: identity.displayName || "Guest",
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
    const seatsLayer = createEl("div", "campus2d-seats");
    const behindLayer = createEl("div", "campus2d-behind-layer");
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
    const localElement = createPlayerElement(localPlayer, true);

    gamesButton.textContent = "Games";
    chatButton.textContent = "Send";
    chatForm.append(chatInput, chatButton);
    hud.append(roomTitle, statusPill, palette, gamesButton);
    world.append(mapImage, hotspotsLayer, seatsLayer, entitiesLayer, behindLayer);
    entitiesLayer.append(localElement);
    viewport.append(world);
    root.append(viewport, hud, chatForm);
    mountNode.replaceChildren(root);

    function createPlayerElement(player, isLocal) {
      const element = createEl("div", `campus2d-player${isLocal ? " is-local" : ""}`);
      const bubble = createEl("span", "campus2d-chat-bubble");
      const avatar = createEl("span", "campus2d-avatar", {
        role: "img",
        "aria-label": `${player.displayName || "Alpaca"} avatar`
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
      const frame = getFrame(player.direction, player.moving, nowMs);
      element.style.transform = `translate(${player.x}px, ${player.y}px)`;
      element.style.zIndex = String(Math.round(player.y));
      element.style.setProperty("--campus2d-color", color.hex);
      element.style.setProperty("--campus2d-filter", color.filter);
      element.style.setProperty("--campus2d-sprite-x", spritePercent(frame.col, manifest.sprite.columns));
      element.style.setProperty("--campus2d-sprite-y", spritePercent(frame.row, manifest.sprite.rows));
      element.style.setProperty("--campus2d-flip", String(frame.flip));
      if (element._campus2d?.name) {
        element._campus2d.name.textContent = player.displayName || "Guest";
      }
    }

    function setStatus(value) {
      statusPill.textContent = value;
      root.dataset.realtimeStatus = value.toLowerCase();
    }

    function renderPalette() {
      palette.replaceChildren(...manifest.colors.map((color) => {
        const button = createEl("button", "campus2d-color-swatch", {
          type: "button",
          title: color.label,
          "aria-label": color.label,
          "data-campus2d-color": color.id
        });
        button.style.setProperty("--swatch", color.hex);
        button.classList.toggle("is-active", color.id === localPlayer.colorId);
        return button;
      }));
    }

    function renderHotspots() {
      hotspotsLayer.replaceChildren(...(room.hotspots || []).map((hotspot) => {
        const button = createEl("button", "campus2d-hotspot", {
          type: "button",
          "data-campus2d-hotspot": hotspot.id,
          "aria-label": hotspot.label || hotspot.kind
        });
        button.style.left = `${hotspot.zone.x}px`;
        button.style.top = `${hotspot.zone.y}px`;
        button.style.width = `${hotspot.zone.width}px`;
        button.style.height = `${hotspot.zone.height}px`;
        return button;
      }));
    }

    function renderSeats() {
      seatsLayer.replaceChildren(...(room.seats || []).map((seat) => {
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

    function renderBehindZones() {
      behindLayer.replaceChildren(...(room.behindZones || []).map((zone) => {
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
      renderSeats();
      renderBehindZones();
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
      pendingSeatId = null;
      activeTarget = null;
      remotePlayers.clear();
      renderRoom();
      connectRealtime();
      publishPresence(true);
    }

    function tryPortal(nowMs) {
      if (nowMs - lastPortalAt < PORTAL_COOLDOWN_MS) {
        return;
      }
      const portal = (room.portals || []).find((entry) => isPointInRect(localPlayer, entry.zone));
      if (!portal) {
        return;
      }
      lastPortalAt = nowMs;
      setRoom(portal.targetRoomId, portal.targetSpawnId);
    }

    function getKeyboardVector() {
      return {
        x: (keys.has("ArrowRight") ? 1 : 0) - (keys.has("ArrowLeft") ? 1 : 0),
        y: (keys.has("ArrowDown") ? 1 : 0) - (keys.has("ArrowUp") ? 1 : 0)
      };
    }

    function stepMovement(deltaSeconds, nowMs) {
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
        pendingSeatId = null;
      }

      const normalized = { x: vector.x / length, y: vector.y / length };
      const distance = MOVE_SPEED * deltaSeconds;
      const nextX = localPlayer.x + normalized.x * distance;
      const nextY = localPlayer.y + normalized.y * distance;
      const nextPoint = {
        x: clamp(nextX, 0, room.width),
        y: clamp(nextY, 0, room.height)
      };

      if (isWalkable(room, nextPoint)) {
        localPlayer.x = nextPoint.x;
        localPlayer.y = nextPoint.y;
        const reachedSeat = pendingSeatId && (room.seats || []).find((seat) => seat.id === pendingSeatId);
        if (reachedSeat && Math.hypot(reachedSeat.x - localPlayer.x, reachedSeat.y - localPlayer.y) <= MOVE_EPSILON + 2) {
          localPlayer.x = reachedSeat.x;
          localPlayer.y = reachedSeat.y;
          localPlayer.seatId = reachedSeat.id;
          pendingSeatId = null;
          activeTarget = null;
        }
      } else if (isWalkable(room, { x: nextPoint.x, y: localPlayer.y })) {
        localPlayer.x = nextPoint.x;
      } else if (isWalkable(room, { x: localPlayer.x, y: nextPoint.y })) {
        localPlayer.y = nextPoint.y;
      } else {
        activeTarget = null;
      }

      localPlayer.direction = normalizeDirection(normalized, localPlayer.direction);
      localPlayer.moving = true;
      updatePlayerElement(localElement, localPlayer, nowMs);
      updateCamera();
      publishMovement(false);
      tryPortal(nowMs);
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
        seatId: localPlayer.seatId || null
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
          seatId: localPlayer.seatId || null
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

    function handleKeyDown(event) {
      if (!["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.key)) {
        return;
      }
      if (root.querySelector("[data-campus2d-popup]")) {
        return;
      }
      if (event.target.closest("input, textarea, select, [contenteditable='true']")) {
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
      if (event.target.closest("[data-campus2d-ui], [data-campus2d-hotspot]")) {
        return;
      }
      const point = screenToWorld(event.clientX, event.clientY);
      if (isWalkable(room, point)) {
        activeTarget = point;
      }
    }

    function handleRootClick(event) {
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
            displayName: localPlayer.displayName
          });
          publishPresence(true);
        }
        return;
      }

      const seatButton = event.target.closest("[data-campus2d-seat]");
      if (seatButton) {
        const seat = (room.seats || []).find((entry) => entry.id === seatButton.dataset.campus2dSeat);
        if (seat) {
          activeTarget = { x: seat.x, y: seat.y };
          pendingSeatId = seat.id;
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

    function handleChatSubmit(event) {
      event.preventDefault();
      sendChat(chatInput.value);
      chatInput.value = "";
      chatInput.focus({ preventScroll: true });
    }

    renderRoom();
    root.focus({ preventScroll: true });
    connectRealtime();
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("resize", updateCamera);
    viewport.addEventListener("pointerdown", handlePointerDown);
    root.addEventListener("click", handleRootClick);
    chatForm.addEventListener("submit", handleChatSubmit);
    animationFrameId = window.requestAnimationFrame(loop);

    return {
      destroy() {
        destroyed = true;
        window.cancelAnimationFrame(animationFrameId);
        window.removeEventListener("keydown", handleKeyDown);
        window.removeEventListener("keyup", handleKeyUp);
        window.removeEventListener("resize", updateCamera);
        channel?.destroy();
        mountNode.replaceChildren();
      },
      setRoom,
      openGameLauncher
    };
  }

  window.WSC_CAMPUS_2D = Object.freeze({ mount });
}());

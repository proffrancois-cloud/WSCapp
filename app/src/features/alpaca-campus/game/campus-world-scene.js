(function () {
  const VIEWPORT = { width: 1280, height: 720 };
  const CAMERA_ZOOM = 0.48;
  const BASE_AVATAR_SPEED = 165;

  function playerKey(player) {
    return String(player?.userId || player?.clientId || "");
  }

  function asPoint(point, fallback) {
    return {
      x: Number.isFinite(Number(point?.x)) ? Number(point.x) : fallback.x,
      y: Number.isFinite(Number(point?.y)) ? Number(point.y) : fallback.y
    };
  }

  function contentTextureKey(src) {
    const value = String(src || "");
    let hash = 0;
    for (let index = 0; index < value.length; index += 1) {
      hash = ((hash << 5) - hash + value.charCodeAt(index)) | 0;
    }
    return `campus-content-${Math.abs(hash)}`;
  }

  function createCampusWorldGame({ containerId, initialRoomId, campusState, localPlayer, callbacks = {} }) {
    const Phaser = window.Phaser;
    const rooms = window.WSC_ALPACA_CAMPUS_ROOMS;
    const movementFactory = window.WSC_ALPACA_CAMPUS_MOVEMENT;
    const avatarFactory = window.WSC_ALPACA_CAMPUS_AVATAR_RENDERER;
    const questEngine = window.WSC_ALPACA_CAMPUS_QUESTS;
    let sceneApi = null;
    let game = null;

    class CampusWorldScene extends Phaser.Scene {
      constructor() {
        super("CampusWorldScene");
        this.currentRoom = null;
        this.roomLayer = null;
        this.localAvatar = null;
        this.remoteAvatars = new Map();
        this.objectSprites = new Map();
        this.objectMarkers = new Map();
        this.objectZones = new Map();
        this.interactionZones = [];
        this.seatOccupancy = new Map();
        this.localSeatId = null;
        this.ballState = new Map();
        this.currentBackgroundKey = "";
      }

      preload() {
        Object.values(window.WSC_ALPACA_CAMPUS_ROOM_ASSETS?.backgrounds || {}).forEach((asset) => {
          if (asset?.key && asset?.src && !this.textures.exists(asset.key)) {
            this.load.image(asset.key, asset.src);
          }
        });
        const avatarAssets = window.WSC_ALPACA_CAMPUS_AVATAR_ASSETS;
        [...(avatarAssets?.colors || []), ...(avatarAssets?.outfits || [])].forEach((asset) => {
          if (asset?.key && asset?.src && !this.textures.exists(asset.key)) {
            this.load.spritesheet(asset.key, asset.src, {
              frameWidth: avatarAssets.frameSize,
              frameHeight: avatarAssets.frameSize
            });
          }
        });
      }

      create() {
        this.avatarRenderer = avatarFactory.createAvatarRenderer(this, { avatarKey: "campus-avatar-base" });
        this.loadRoom(initialRoomId || "campus-courtyard", null, {
          x: localPlayer.x,
          y: localPlayer.y
        });
        this.bindInput();
        sceneApi = this.createApi();
        callbacks.onReady?.(sceneApi);
      }

      update(time, delta) {
        const deltaSeconds = delta / 1000;
        if (this.localAvatar) {
          this.stepAvatar(this.localAvatar, deltaSeconds, time);
        }
        this.remoteAvatars.forEach((avatar) => this.stepAvatar(avatar, deltaSeconds, time));
      }

      createApi() {
        return {
          loadRoom: (roomId, spawnId, position) => this.loadRoom(roomId, spawnId, position),
          updatePresence: (players) => this.updatePresence(players),
          applyRemoteMove: (payload) => this.applyRemoteMove(payload),
          applyRemoteAvatar: (payload) => this.applyRemoteAvatar(payload),
          applyObjectEvent: (payload) => this.applyObjectEvent(payload),
          showChatBubble: (id, message) => this.showChatBubble(id, message),
          updateLocalPlayer: (player) => this.updateLocalPlayer(player),
          setQuestStates: (questStates) => this.setQuestStates(questStates),
          getLocalPosition: () => this.getLocalPosition(),
          getCurrentRoomId: () => this.currentRoom?.id || "",
          getDebugSnapshot: () => this.getDebugSnapshot()
        };
      }

      loadRoom(roomId, spawnId, position) {
        const room = rooms.getRoom(roomId);
        const spawn = position || rooms.getSpawnPoint(room.id, spawnId || "default");
        this.currentRoom = room;
        const baseCellSize = room.designWorld?.width > 1800 ? 42 : 34;
        this.movement = movementFactory.createMovementEngine(room, { cellSize: Math.round(baseCellSize * this.getWorldScale()) });
        this.clearRoom();
        this.drawRoom(room);
        this.createInteractables(room);
        this.createLocalAvatar(spawn);
        this.cameras.main.setBounds(0, 0, room.world.width, room.world.height);
        this.cameras.main.startFollow(this.localAvatar, true, 0.12, 0.12);
        this.cameras.main.setZoom(this.getCameraZoom(room));
        this.setQuestStates(campusState.quests || {});
        callbacks.onRoomLoaded?.(room, this.getLocalPosition());
      }

      getWorldScale() {
        return Number(this.currentRoom?.layoutScale) || 1;
      }

      getCameraZoom(room = this.currentRoom) {
        return Number(room?.cameraZoom) || CAMERA_ZOOM;
      }

      getAvatarSpeed() {
        return Math.round(BASE_AVATAR_SPEED * this.getWorldScale());
      }

      clearRoom() {
        this.roomLayer?.destroy(true);
        this.roomLayer = this.add.container(0, 0);
        this.objectSprites.forEach((container) => container.destroy(true));
        this.objectMarkers.forEach((marker) => marker.destroy(true));
        new Set([...this.objectZones.values(), ...this.interactionZones]).forEach((zone) => zone.destroy());
        this.objectSprites.clear();
        this.objectMarkers.clear();
        this.objectZones.clear();
        this.interactionZones = [];
        this.remoteAvatars.forEach((avatar) => avatar.destroy());
        this.remoteAvatars.clear();
        this.seatOccupancy.clear();
        this.ballState.clear();
        this.currentBackgroundKey = "";
        this.localAvatar?.destroy();
        this.localAvatar = null;
        this.localSeatId = null;
      }

      bindInput() {
        this.input.on("pointerdown", (pointer) => {
          if (callbacks.isInputLocked?.()) {
            return;
          }
          if (!pointer || pointer.leftButtonDown && !pointer.leftButtonDown()) {
            return;
          }
          if (this.localSeatId) {
            this.standUp();
            return;
          }
          this.moveLocalTo({ x: pointer.worldX, y: pointer.worldY });
        });
      }

      drawRoom(room) {
        const background = window.WSC_ALPACA_CAMPUS_ROOM_ASSETS?.getBackground?.(room.id);
        if (background?.key && this.textures.exists(background.key)) {
          this.drawImageBackground(room, background);
        } else {
          const g = this.add.graphics();
          g.setScale(this.getWorldScale());
          this.roomLayer.add(g);
          const visualRoom = { ...room, world: room.designWorld || room.world };
          if (room.backgroundStyle === "courtyard") this.drawCourtyard(g, visualRoom);
          else if (room.backgroundStyle === "lobby") this.drawLobby(g, visualRoom);
          else if (room.backgroundStyle === "museum") this.drawMuseum(g, visualRoom);
          else if (room.backgroundStyle === "cinema") this.drawCinema(g, visualRoom);
          else if (room.backgroundStyle === "classroom") this.drawClassroom(g, visualRoom);
          else if (room.backgroundStyle === "library") this.drawLibrary(g, visualRoom);
          else if (room.backgroundStyle === "amphitheater") this.drawAmphitheater(g, visualRoom);
          else if (room.backgroundStyle === "debate") this.drawDebate(g, visualRoom);
          else if (room.backgroundStyle === "game-hall") this.drawGameHall(g, visualRoom);
          else if (room.backgroundStyle === "gym") this.drawGym(g, visualRoom);
          else if (room.backgroundStyle === "quiz-lab") this.drawQuizLab(g, visualRoom);
          else if (room.backgroundStyle === "studio") this.drawStudio(g, visualRoom);
          else if (room.backgroundStyle === "arena") this.drawArena(g, visualRoom);
          else this.drawLobby(g, visualRoom);
        }

        const title = this.add.text(38, 28, room.title, {
          fontFamily: "Shadows Into Light Two, system-ui, sans-serif",
          fontSize: "42px",
          color: room.backgroundStyle === "cinema" || room.backgroundStyle === "debate" ? "#fff8eb" : "#2f251b"
        }).setScrollFactor(0).setDepth(5000);
        const subtitle = this.add.text(42, 75, room.subtitle || "", {
          fontFamily: "system-ui, sans-serif",
          fontSize: "13px",
          color: room.backgroundStyle === "cinema" || room.backgroundStyle === "debate" ? "#f4dfb8" : "#6d5b48"
        }).setScrollFactor(0).setDepth(5000);
        this.roomLayer.add(title);
        this.roomLayer.add(subtitle);
      }

      drawImageBackground(room, background) {
        const image = this.add.image(0, 0, background.key).setOrigin(0);
        image.setDisplaySize(room.world.width, room.world.height);
        image.setDepth(-1000);
        image.backgroundAsset = background;
        this.currentBackgroundKey = background.key;
        this.roomLayer.add(image);
      }

      drawCourtyard(g, room) {
        g.fillStyle(0x98b995, 1).fillRect(0, 0, room.world.width, room.world.height);
        g.fillStyle(0xdac58e, 1).fillRoundedRect(920, 420, 560, 1010, 40);
        g.fillStyle(0xe8d39d, 1).fillRoundedRect(250, 1030, 580, 360, 24);
        g.lineStyle(6, 0xffffff, 0.68).strokeRoundedRect(290, 1065, 500, 285, 18);
        g.lineStyle(3, 0xffffff, 0.6).lineBetween(540, 1065, 540, 1350);
        g.strokeCircle(540, 1207, 54);
        g.fillStyle(0x2d6f69, 1).fillRoundedRect(650, 110, 1100, 360, 26);
        g.fillStyle(0xfff8eb, 1).fillRoundedRect(780, 180, 840, 250, 18);
        g.fillStyle(0x315f84, 1).fillRoundedRect(1100, 312, 200, 134, 18);
        g.fillStyle(0xc89c44, 1).fillRect(650, 430, 1100, 16);
        g.fillStyle(0x6f8f86, 1).fillRoundedRect(1040, 880, 340, 260, 130);
        g.lineStyle(4, 0xfff8eb, 0.5).strokeRoundedRect(1040, 880, 340, 260, 130);
        g.fillStyle(0x315f84, 0.26).fillRoundedRect(1535, 970, 560, 270, 30);
        g.lineStyle(6, 0x315f84, 0.55).lineBetween(1545, 1000, 2070, 1000);
      }

      drawLobby(g, room) {
        g.fillStyle(0xf0ddb6, 1).fillRect(0, 0, room.world.width, room.world.height);
        g.fillStyle(0x2d6f69, 1).fillRect(0, 0, room.world.width, 170);
        g.fillStyle(0xc89c44, 1).fillRect(0, 168, room.world.width, 10);
        g.fillStyle(0xfff8eb, 1).fillRoundedRect(720, 250, 460, 140, 22);
        g.fillStyle(0x8a6338, 1).fillRoundedRect(760, 292, 380, 80, 16);
        g.fillStyle(0xe6c787, 0.42).fillRoundedRect(430, 520, 1040, 260, 36);
      }

      drawMuseum(g, room) {
        g.fillStyle(0xe9ded0, 1).fillRect(0, 0, room.world.width, room.world.height);
        g.fillStyle(0x7f6e5f, 1).fillRect(0, 0, room.world.width, 130);
        g.fillStyle(0xf8edd5, 1).fillRoundedRect(125, 150, 1550, 790, 28);
        g.lineStyle(3, 0xc89c44, 0.45).strokeRoundedRect(125, 150, 1550, 790, 28);
      }

      drawCinema(g, room) {
        g.fillStyle(0x1f1a20, 1).fillRect(0, 0, room.world.width, room.world.height);
        g.fillStyle(0x2c1520, 1).fillRoundedRect(130, 130, 1540, 850, 28);
        g.fillStyle(0xfff8eb, 1).fillRoundedRect(560, 110, 680, 170, 14);
        g.fillStyle(0x315f84, 1).fillRoundedRect(600, 145, 600, 105, 10);
      }

      drawClassroom(g, room) {
        g.fillStyle(0xead7b7, 1).fillRect(0, 0, room.world.width, room.world.height);
        g.fillStyle(0x2d6f69, 1).fillRect(390, 90, 870, 130);
        g.fillStyle(0xfff8eb, 1).fillRoundedRect(650, 250, 350, 96, 12);
      }

      drawLibrary(g, room) {
        g.fillStyle(0xdbc8a4, 1).fillRect(0, 0, room.world.width, room.world.height);
        g.fillStyle(0x6f4e32, 1).fillRect(80, 120, 210, 1010);
        g.fillRect(1810, 120, 210, 1010);
        g.fillStyle(0x2d6f69, 0.18).fillRoundedRect(690, 470, 720, 390, 42);
      }

      drawAmphitheater(g, room) {
        g.fillStyle(0x203644, 1).fillRect(0, 0, room.world.width, room.world.height);
        g.fillStyle(0x8a6338, 1).fillRoundedRect(520, 140, 1160, 250, 32);
        g.fillStyle(0xfff8eb, 1).fillRoundedRect(800, 110, 600, 96, 12);
        for (let i = 0; i < 7; i += 1) {
          g.lineStyle(8, 0xf4dfb8, 0.28).strokeRoundedRect(310 + i * 45, 510 + i * 100, 1580 - i * 90, 90, 45);
        }
      }

      drawDebate(g, room) {
        g.fillStyle(0x24313a, 1).fillRect(0, 0, room.world.width, room.world.height);
        g.fillStyle(0xfff8eb, 1).fillRoundedRect(590, 135, 320, 130, 18);
        g.fillStyle(0x315f84, 1).fillRoundedRect(220, 370, 240, 300, 18);
        g.fillStyle(0x8a6338, 1).fillRoundedRect(1040, 370, 240, 300, 18);
        g.fillStyle(0xc89c44, 1).fillRoundedRect(650, 330, 200, 86, 14);
      }

      drawGameHall(g, room) {
        g.fillStyle(0x2d6f69, 1).fillRect(0, 0, room.world.width, room.world.height);
        g.fillStyle(0x203644, 1).fillRect(0, 0, room.world.width, 150);
        g.fillStyle(0xfff8eb, 1).fillRoundedRect(160, 185, room.world.width - 320, 160, 28);
        g.fillStyle(0xc89c44, 0.24).fillRoundedRect(360, 410, room.world.width - 720, 330, 48);
        g.lineStyle(5, 0xfff8eb, 0.5).strokeRoundedRect(360, 410, room.world.width - 720, 330, 48);
      }

      drawGym(g, room) {
        g.fillStyle(0xe5d1aa, 1).fillRect(0, 0, room.world.width, room.world.height);
        g.fillStyle(0x315f84, 1).fillRect(0, 0, room.world.width, 140);
        g.lineStyle(7, 0xffffff, 0.72).strokeRoundedRect(380, 360, room.world.width - 760, 250, 28);
        g.fillStyle(0xc85c6d, 0.2).fillRoundedRect(420, 390, room.world.width - 840, 190, 22);
      }

      drawQuizLab(g, room) {
        g.fillStyle(0xe8dccb, 1).fillRect(0, 0, room.world.width, room.world.height);
        g.fillStyle(0x203644, 1).fillRect(0, 0, room.world.width, 145);
        g.fillStyle(0xfff8eb, 1).fillRoundedRect(room.world.width / 2 - 300, 175, 600, 135, 18);
        g.lineStyle(3, 0x2d6f69, 0.38).strokeRoundedRect(210, 370, room.world.width - 420, 330, 34);
      }

      drawStudio(g, room) {
        g.fillStyle(0xf0ddb6, 1).fillRect(0, 0, room.world.width, room.world.height);
        g.fillStyle(0x6f4e32, 1).fillRect(0, 0, room.world.width, 145);
        g.fillStyle(0xfff8eb, 1).fillRoundedRect(520, 350, room.world.width - 1040, 260, 36);
        g.lineStyle(4, 0xc89c44, 0.48).strokeRoundedRect(520, 350, room.world.width - 1040, 260, 36);
      }

      drawArena(g, room) {
        g.fillStyle(0x1f1a20, 1).fillRect(0, 0, room.world.width, room.world.height);
        g.fillStyle(0x3b2730, 1).fillRoundedRect(220, 220, room.world.width - 440, 660, 80);
        g.lineStyle(8, 0xc85c6d, 0.62).strokeRoundedRect(250, 250, room.world.width - 500, 600, 70);
        g.fillStyle(0xfff8eb, 0.9).fillRoundedRect(room.world.width / 2 - 260, 245, 520, 96, 18);
      }

      createInteractables(room) {
        [...(room.portals || []), ...(room.objects || []), ...(room.seats || [])].forEach((item) => this.createInteractable(item));
      }

      createInteractable(item) {
        const scale = this.getWorldScale();
        const imageBackedRoom = Boolean(this.currentBackgroundKey);
        const imageSeat = imageBackedRoom && item.kind === "seat";
        const container = this.add.container(item.x, item.y).setDepth(Math.round(item.y + 100));
        const accent = item.kind === "portal" ? 0x315f84 : item.kind === "ball" ? 0xc85c6d : item.kind === "seat" ? 0xc89c44 : 0x2d6f69;
        const presentation = window.WSC_ALPACA_CAMPUS_CONTENT?.getWorldContentForObject?.(item);
        const g = this.add.graphics();
        if (item.kind === "npc" && item.avatar) {
          this.addNpcAvatar(container, item);
        } else {
          this.drawInteractableShape(g, item, accent);
          container.add(g);
        }
        if (this.shouldRenderContentPreview(item, imageBackedRoom, presentation)) {
          this.addContentPreview(container, item, presentation, accent);
        }
        const label = this.add.text(0, item.height / 2 + 24 * scale, item.statusLabel ? `${item.label}\n${item.statusLabel}` : item.label, {
          fontFamily: "system-ui, sans-serif",
          fontSize: `${Math.round(12 * scale)}px`,
          fontStyle: "800",
          color: "#2f251b",
          backgroundColor: "rgba(255,248,235,0.9)",
          align: "center",
          wordWrap: { width: Math.max(120 * scale, item.width + 72 * scale), useAdvancedWrap: true },
          padding: { left: 8 * scale, right: 8 * scale, top: 3 * scale, bottom: 3 * scale }
        }).setOrigin(0.5);
        label.setVisible(!imageSeat);
        container.add(label);
        const ring = this.add.graphics();
        ring.lineStyle(Math.max(3, Math.round(3 * scale)), accent, 0.5).strokeRoundedRect(
          -item.width / 2 - 18 * scale,
          -item.height / 2 - 18 * scale,
          item.width + 36 * scale,
          item.height + 36 * scale,
          18 * scale
        );
        ring.setVisible(false);
        container.add(ring);
        container.hoverRing = ring;
        container.item = item;
        this.objectSprites.set(item.id, container);

        if (item.questId) this.createQuestMarker(item);
        const zone = this.add.zone(item.x, item.y, item.width + 60 * scale, item.height + 90 * scale).setDepth(3000).setInteractive({ useHandCursor: true });
        zone.on("pointerover", () => ring.setVisible(true));
        zone.on("pointerout", () => ring.setVisible(false));
        zone.on("pointerdown", (_pointer, _x, _y, event) => {
          event?.stopPropagation?.();
          if (!callbacks.isInputLocked?.()) this.handleInteractableClick(item);
        });
        this.interactionZones.push(zone);
        this.objectZones.set(item.id, zone);
      }

      addNpcAvatar(container, item) {
        const assets = window.WSC_ALPACA_CAMPUS_AVATAR_ASSETS;
        const color = assets?.getColor?.(item.avatar.woolColor);
        const outfit = assets?.getOutfit?.(item.avatar.outfitId);
        const y = item.height * 0.34;
        if (color?.key && this.textures.exists(color.key)) {
          const base = this.add.sprite(0, y, color.key, 0)
            .setOrigin(0.5, 1)
            .setScale((assets.displayScale || 0.58) * 0.9);
          container.add(base);
        }
        if (outfit?.key && this.textures.exists(outfit.key)) {
          const clothing = this.add.sprite(0, y, outfit.key, 0)
            .setOrigin(0.5, 1)
            .setScale((assets.displayScale || 0.58) * 0.9);
          container.add(clothing);
        }
      }

      shouldRenderContentPreview(item, imageBackedRoom, presentation) {
        if (!presentation || item.kind === "seat") {
          return false;
        }
        if (!imageBackedRoom) {
          return true;
        }
        return ["screen", "board", "poster", "exhibit", "shelf", "display"].includes(item.kind);
      }

      addContentPreview(container, item, presentation, accent) {
        const scale = this.getWorldScale();
        const preview = this.add.container(0, 0);
        const imageWidth = Math.max(54, item.width - 24);
        const imageHeight = Math.max(38, item.height - 38);
        const isScreen = item.kind === "screen";
        const isShelf = item.kind === "shelf";
        const isBoard = item.kind === "board";
        const frame = this.add.graphics();
        frame.fillStyle(isScreen ? 0x102a3a : 0xfffbf1, isScreen ? 1 : 0.96);
        frame.fillRoundedRect(-imageWidth / 2, -imageHeight / 2 - 6, imageWidth, imageHeight, isScreen ? 10 : 8);
        frame.lineStyle(2, accent, 0.45).strokeRoundedRect(-imageWidth / 2, -imageHeight / 2 - 6, imageWidth, imageHeight, isScreen ? 10 : 8);
        preview.add(frame);
        const imageLayer = this.add.container(0, 0);
        preview.add(imageLayer);

        if (presentation.imageSrc) {
          this.addPreviewImage(imageLayer, presentation.imageSrc, {
            width: imageWidth - 10,
            height: isScreen ? imageHeight - 12 : Math.max(34, imageHeight * 0.62),
            y: isScreen ? -6 : -imageHeight * 0.18 - 6
          });
        } else {
          const icon = this.add.text(0, isScreen ? -6 : -18, presentation.kind === "video" ? "PLAY" : "WSC", {
            fontFamily: "system-ui, sans-serif",
            fontSize: `${Math.round((isScreen ? 24 : 18) * scale)}px`,
            fontStyle: "900",
            color: isScreen ? "#fff8eb" : "#315f84"
          }).setOrigin(0.5);
          preview.add(icon);
        }

        const titleWidth = isScreen ? imageWidth - 22 : imageWidth - 12;
        const title = this.add.text(0, isScreen ? imageHeight / 2 - 30 : imageHeight / 2 - 30, presentation.title || item.label, {
          fontFamily: "system-ui, sans-serif",
          fontSize: `${Math.round((isScreen ? 14 : isShelf || isBoard ? 11 : 10) * scale)}px`,
          fontStyle: "900",
          color: isScreen ? "#fff8eb" : "#2f251b",
          align: "center",
          wordWrap: { width: titleWidth, useAdvancedWrap: true },
          maxLines: isScreen ? 2 : 3
        }).setOrigin(0.5, 0);
        preview.add(title);

        if (presentation.subtitle && !isShelf && !isBoard) {
          const subtitle = this.add.text(0, imageHeight / 2 - 8, presentation.subtitle, {
            fontFamily: "system-ui, sans-serif",
            fontSize: `${Math.round(8 * scale)}px`,
            fontStyle: "700",
            color: isScreen ? "#f4dfb8" : "#6d5b48",
            align: "center",
            wordWrap: { width: titleWidth, useAdvancedWrap: true },
            maxLines: 1
          }).setOrigin(0.5, 0);
          preview.add(subtitle);
        }

        container.add(preview);
      }

      addPreviewImage(preview, src, options) {
        const key = contentTextureKey(src);
        const addImage = () => {
          if (!preview.scene || !this.textures.exists(key)) {
            return;
          }
          const image = this.add.image(0, options.y || 0, key);
          image.setDisplaySize(options.width, options.height);
          preview.add(image);
        };
        if (this.textures.exists(key)) {
          addImage();
          return;
        }
        const image = new Image();
        if (/^https?:/i.test(src)) {
          image.crossOrigin = "anonymous";
        }
        image.onload = () => {
          if (!this.textures.exists(key)) {
            this.textures.addImage(key, image);
          }
          addImage();
        };
        image.onerror = () => {
          const fallback = this.add.text(0, options.y || 0, "Image ready", {
            fontFamily: "system-ui, sans-serif",
            fontSize: `${Math.round(10 * this.getWorldScale())}px`,
            fontStyle: "900",
            color: "#315f84",
            align: "center"
          }).setOrigin(0.5);
          preview.add(fallback);
        };
        image.src = src;
      }

      drawInteractableShape(g, item, accent) {
        if (this.currentBackgroundKey && item.kind === "seat") {
          g.fillStyle(0xfff8eb, 0.05).fillRoundedRect(-item.width / 2, -item.height / 2, item.width, item.height, 12);
          g.lineStyle(2, accent, 0.18).strokeRoundedRect(-item.width / 2, -item.height / 2, item.width, item.height, 12);
          return;
        }
        if (this.currentBackgroundKey && ["meeting", "library", "control", "track", "stage"].includes(item.kind)) {
          g.fillStyle(0xfff8eb, 0.04).fillRoundedRect(-item.width / 2, -item.height / 2, item.width, item.height, 12);
          g.lineStyle(2, accent, 0.2).strokeRoundedRect(-item.width / 2, -item.height / 2, item.width, item.height, 12);
          return;
        }
        if (this.currentBackgroundKey && item.kind === "portal") {
          g.fillStyle(0x315f84, 0.16).fillRoundedRect(-item.width / 2, -item.height / 2, item.width, item.height, 16);
          g.lineStyle(4, 0xc89c44, 0.78).strokeRoundedRect(-item.width / 2, -item.height / 2, item.width, item.height, 16);
          return;
        }
        if (item.kind === "ball") {
          g.fillStyle(0xffffff, 1).fillCircle(0, 0, item.width / 2);
          g.lineStyle(3, 0x1d211f, 0.5).strokeCircle(0, 0, item.width / 2);
          g.lineStyle(2, 0xc85c6d, 0.8).lineBetween(-14, 0, 14, 0).lineBetween(0, -14, 0, 14);
          return;
        }
        if (item.kind === "seat") {
          g.fillStyle(item.seatType === "swing" ? 0xf4dfb8 : 0xfff8eb, 1).fillRoundedRect(-item.width / 2, -item.height / 2, item.width, item.height, 10);
          g.lineStyle(3, accent, 0.65).strokeRoundedRect(-item.width / 2, -item.height / 2, item.width, item.height, 10);
          if (item.seatType === "swing") {
            g.lineStyle(2, 0x315f84, 0.65).lineBetween(-18, -38, -18, -item.height / 2).lineBetween(18, -38, 18, -item.height / 2);
          }
          return;
        }
        if (item.kind === "portal") {
          g.fillStyle(0x315f84, 1).fillRoundedRect(-item.width / 2, -item.height / 2, item.width, item.height, 16);
          g.fillStyle(0x203644, 1).fillRoundedRect(-item.width / 2 + 12, -item.height / 2 + 14, item.width - 24, item.height - 18, 12);
          g.lineStyle(4, 0xc89c44, 0.85).strokeRoundedRect(-item.width / 2, -item.height / 2, item.width, item.height, 16);
          return;
        }
        if (item.kind === "screen" || item.kind === "stage") {
          g.fillStyle(0x315f84, 1).fillRoundedRect(-item.width / 2, -item.height / 2, item.width, item.height, 14);
          g.lineStyle(4, 0xc89c44, 0.8).strokeRoundedRect(-item.width / 2, -item.height / 2, item.width, item.height, 14);
          return;
        }
        if (item.kind === "npc") {
          g.fillStyle(0xfff8eb, 1).fillEllipse(0, 4, item.width * 0.78, item.height * 0.8);
          g.fillStyle(0xc89c44, 1).fillCircle(-20, -28, 13).fillCircle(20, -28, 13);
          g.fillStyle(0x2f251b, 1).fillCircle(-14, -6, 4).fillCircle(14, -6, 4);
          g.lineStyle(3, accent, 0.65).strokeEllipse(0, 4, item.width * 0.85, item.height * 0.86);
          return;
        }
        g.fillStyle(0xfff8eb, 1).fillRoundedRect(-item.width / 2, -item.height / 2, item.width, item.height, 14);
        g.lineStyle(3, accent, 0.55).strokeRoundedRect(-item.width / 2, -item.height / 2, item.width, item.height, 14);
        g.fillStyle(accent, 0.12).fillRoundedRect(-item.width / 2 + 8, -item.height / 2 + 8, item.width - 16, item.height - 16, 10);
      }

      createQuestMarker(item) {
        const scale = this.getWorldScale();
        const marker = this.add.container(item.x, item.y - item.height / 2 - 34 * scale).setDepth(3100);
        const bg = this.add.graphics();
        const text = this.add.text(0, 0, "Quest", { fontFamily: "system-ui, sans-serif", fontSize: `${Math.round(11 * scale)}px`, fontStyle: "900", color: "#ffffff" }).setOrigin(0.5);
        marker.add(bg);
        marker.add(text);
        marker.bg = bg;
        marker.label = text;
        marker.questId = item.questId;
        this.objectMarkers.set(item.id, marker);
      }

      handleInteractableClick(item) {
        if (this.localSeatId && item.id !== this.localSeatId) {
          this.standUp();
        }
        if (!this.isNear(item)) {
          this.moveLocalTo(item.interactionPoint || { x: item.x, y: item.y }, { item });
          callbacks.onWalkCloser?.(item);
          return;
        }
        this.performInteraction(item);
      }

      performInteraction(item) {
        if (item.kind === "portal") {
          callbacks.onPortal?.(item);
          return;
        }
        if (item.kind === "ball") {
          this.kickBall(item);
          return;
        }
        if (item.kind === "seat") {
          this.sitInSeat(item);
          return;
        }
        if (item.panel) {
          callbacks.onObjectInteract?.(item);
        }
      }

      isNear(item) {
        return this.movement.pointDistance(this.getLocalPosition(), item.interactionPoint || item) <= (item.proximity || 110);
      }

      moveLocalTo(target, meta = {}) {
        if (!this.localAvatar || callbacks.isInputLocked?.()) return;
        const from = this.getLocalPosition();
        const to = this.movement.findNearestWalkable(target);
        const path = this.movement.findPath(from, to);
        this.startMove(this.localAvatar, path, () => {
          const position = this.getLocalPosition();
          callbacks.onLocalPosition?.(position, this.currentRoom);
          if (meta.item && this.isNear(meta.item)) this.performInteraction(meta.item);
        });
        callbacks.onMoveIntent?.({ from, to, path, roomId: this.currentRoom.id });
      }

      startMove(container, path, onComplete) {
        const safePath = Array.isArray(path) ? path.filter((point) => Number.isFinite(point.x) && Number.isFinite(point.y)) : [];
        if (safePath.length < 2) {
          onComplete?.();
          return;
        }
        container.movePath = safePath;
        container.moveIndex = 1;
        container.onMoveComplete = onComplete;
        container.isMoving = true;
        container.seated = false;
      }

      getDirectionFromDelta(dx, dy, fallback = "down") {
        if (Math.abs(dx) > Math.abs(dy)) {
          return dx < 0 ? "left" : "right";
        }
        if (Math.abs(dy) > 0.5) {
          return dy < 0 ? "up" : "down";
        }
        return fallback;
      }

      stepAvatar(container, deltaSeconds, time) {
        if (container.seated && container.seatType === "swing") {
          this.avatarRenderer.setMotion(container, "down", false, time);
          const base = container.seatBase || { x: container.x, y: container.y };
          container.y = base.y + Math.sin(time / 320) * 9;
          container.rotation = Math.sin(time / 380) * 0.07;
          return;
        }
        container.rotation = 0;
        if (!container?.isMoving || !container.movePath?.length) {
          this.avatarRenderer.setMotion(container, container.avatarDirection || "down", false, time);
          return;
        }
        const target = container.movePath[container.moveIndex];
        if (!target) {
          container.isMoving = false;
          this.avatarRenderer.setMotion(container, container.avatarDirection || "down", false, time);
          container.onMoveComplete?.();
          container.onMoveComplete = null;
          return;
        }
        const dx = target.x - container.x;
        const dy = target.y - container.y;
        const direction = this.getDirectionFromDelta(dx, dy, container.avatarDirection || "down");
        this.avatarRenderer.setMotion(container, direction, true, time);
        const distance = this.movement.pointDistance({ x: container.x, y: container.y }, target);
        const step = Math.max(1, (container.speed || 170) * deltaSeconds);
        if (distance <= step) {
          this.avatarRenderer.setPosition(container, target.x, target.y);
          container.moveIndex += 1;
          if (container.moveIndex >= container.movePath.length) {
            container.isMoving = false;
            container.movePath = [];
            this.avatarRenderer.setMotion(container, direction, false, time);
            container.onMoveComplete?.();
            container.onMoveComplete = null;
          }
          return;
        }
        const angle = Math.atan2(target.y - container.y, target.x - container.x);
        this.avatarRenderer.setPosition(container, container.x + Math.cos(angle) * step, container.y + Math.sin(angle) * step);
      }

      kickBall(item) {
        const current = this.ballState.get(item.id) || { x: item.x, y: item.y };
        const avatar = this.getLocalPosition();
        const angle = Math.atan2(current.y - avatar.y, current.x - avatar.x) || Math.random() * Math.PI * 2;
        const next = this.movement.findNearestWalkable({ x: current.x + Math.cos(angle) * 120, y: current.y + Math.sin(angle) * 120 });
        this.moveObject(item.id, next);
        callbacks.onObjectEvent?.({ action: "ball", objectId: item.id, x: next.x, y: next.y });
      }

      sitInSeat(item) {
        const occupied = this.seatOccupancy.get(item.id);
        if (occupied && occupied.clientId !== localPlayer.clientId) {
          callbacks.onSeatUnavailable?.(item);
          return;
        }
        this.localSeatId = item.id;
        this.seatOccupancy.set(item.id, { clientId: localPlayer.clientId, userId: localPlayer.userId, displayName: localPlayer.displayName });
        this.avatarRenderer.setPosition(this.localAvatar, item.sitPoint.x, item.sitPoint.y);
        this.localAvatar.isMoving = false;
        this.localAvatar.seated = true;
        this.localAvatar.seatType = item.seatType;
        this.localAvatar.seatBase = { ...item.sitPoint };
        this.avatarRenderer.setMotion(this.localAvatar, "down", false);
        callbacks.onSeatChange?.({ action: "seat", seatId: item.id, seatType: item.seatType, x: item.sitPoint.x, y: item.sitPoint.y });
        if (item.panel) {
          callbacks.onObjectInteract?.(item);
        }
      }

      standUp() {
        if (!this.localSeatId) return;
        const seatId = this.localSeatId;
        this.localSeatId = null;
        this.seatOccupancy.delete(seatId);
        this.localAvatar.seated = false;
        this.localAvatar.seatType = "";
        this.localAvatar.rotation = 0;
        callbacks.onSeatChange?.({ action: "stand", seatId });
      }

      applyObjectEvent(payload) {
        if (!payload || payload.roomId && payload.roomId !== this.currentRoom.id) return;
        if (payload.action === "ball") {
          this.moveObject(payload.objectId, { x: payload.x, y: payload.y });
        } else if (payload.action === "seat") {
          this.seatOccupancy.set(payload.seatId, payload);
          this.applySeatToRemote(payload);
        } else if (payload.action === "stand") {
          this.seatOccupancy.delete(payload.seatId);
          const avatar = this.remoteAvatars.get(playerKey(payload));
          if (avatar) {
            avatar.seated = false;
            avatar.rotation = 0;
            this.avatarRenderer.setMotion(avatar, avatar.avatarDirection || "down", false);
          }
        }
      }

      moveObject(objectId, point) {
        const container = this.objectSprites.get(objectId);
        if (!container) return;
        container.setPosition(point.x, point.y);
        container.item.x = point.x;
        container.item.y = point.y;
        container.setDepth(Math.round(point.y + 100));
        this.objectZones.get(objectId)?.setPosition(point.x, point.y);
        this.ballState.set(objectId, { x: point.x, y: point.y });
      }

      createLocalAvatar(position) {
        const requestedPoint = asPoint(position, rooms.getSpawnPoint(this.currentRoom.id));
        const point = this.movement?.findNearestWalkable?.(requestedPoint) || requestedPoint;
        const player = { ...localPlayer, x: point.x, y: point.y, avatar: campusState.avatar, speed: this.getAvatarSpeed() };
        this.localAvatar = this.avatarRenderer.createAvatar(player, true);
        this.avatarRenderer.setPosition(this.localAvatar, point.x, point.y);
      }

      updatePresence(players) {
        const seen = new Set();
        (players || []).forEach((player) => {
          const key = playerKey(player);
          if (!key || key === playerKey(localPlayer)) return;
          seen.add(key);
          let avatar = this.remoteAvatars.get(key);
          const next = { ...player, x: Number(player.x) || 0, y: Number(player.y) || 0, speed: this.getAvatarSpeed() };
          if (!avatar) {
            avatar = this.avatarRenderer.createAvatar(next, false);
            this.remoteAvatars.set(key, avatar);
          }
          this.avatarRenderer.updateAvatar(avatar, next);
          if (player.seatId) {
            this.applySeatToRemote({ ...player, seatId: player.seatId, seatType: player.seatType, x: player.x, y: player.y });
          } else if (!avatar.isMoving) {
            avatar.seated = false;
            this.avatarRenderer.setPosition(avatar, next.x, next.y);
          }
        });
        Array.from(this.remoteAvatars.keys()).forEach((key) => {
          if (!seen.has(key)) {
            this.remoteAvatars.get(key)?.destroy();
            this.remoteAvatars.delete(key);
            this.seatOccupancy.forEach((occupant, seatId) => {
              if (playerKey(occupant) === key) {
                this.seatOccupancy.delete(seatId);
              }
            });
          }
        });
      }

      applyRemoteMove(payload) {
        const key = playerKey(payload);
        if (!key || key === playerKey(localPlayer) || payload.roomId && payload.roomId !== this.currentRoom.id) return;
        let avatar = this.remoteAvatars.get(key);
        if (!avatar) {
          avatar = this.avatarRenderer.createAvatar({ ...payload, x: payload.from?.x || payload.x || 0, y: payload.from?.y || payload.y || 0, speed: this.getAvatarSpeed() }, false);
          this.remoteAvatars.set(key, avatar);
        }
        avatar.speed = this.getAvatarSpeed();
        avatar.seated = false;
        this.avatarRenderer.updateAvatar(avatar, payload);
        const path = Array.isArray(payload.path) ? payload.path : this.movement.findPath({ x: avatar.x, y: avatar.y }, payload.to || payload);
        this.startMove(avatar, path);
      }

      applyRemoteAvatar(payload) {
        const avatar = this.remoteAvatars.get(playerKey(payload));
        if (avatar) this.avatarRenderer.updateAvatar(avatar, payload);
      }

      applySeatToRemote(payload) {
        const avatar = this.remoteAvatars.get(playerKey(payload));
        if (!avatar) return;
        avatar.isMoving = false;
        avatar.seated = true;
        avatar.seatType = payload.seatType;
        avatar.seatBase = { x: Number(payload.x) || avatar.x, y: Number(payload.y) || avatar.y };
        this.avatarRenderer.setPosition(avatar, avatar.seatBase.x, avatar.seatBase.y);
        this.avatarRenderer.setMotion(avatar, "down", false);
      }

      showChatBubble(id, message) {
        const key = String(id || "");
        if (key === playerKey(localPlayer) && this.localAvatar) {
          this.avatarRenderer.showBubble(this.localAvatar, message);
          return;
        }
        const avatar = this.remoteAvatars.get(key) || Array.from(this.remoteAvatars.values()).find((entry) => entry.playerData?.clientId === key || entry.playerData?.userId === key);
        if (avatar) this.avatarRenderer.showBubble(avatar, message);
      }

      updateLocalPlayer(player) {
        if (this.localAvatar) this.avatarRenderer.updateAvatar(this.localAvatar, player);
      }

      setQuestStates(savedProgress) {
        const scale = this.getWorldScale();
        this.objectMarkers.forEach((marker) => {
          const state = questEngine.getQuestState(marker.questId, savedProgress || {});
          const label = state === "completed" ? "Done" : state === "locked" ? "Locked" : state === "in_progress" ? "Started" : "Quest";
          marker.label.setText(label);
          const width = Math.max(72 * scale, marker.label.width + 30 * scale);
          marker.bg.clear().fillStyle(state === "locked" ? 0x6b5f54 : state === "completed" ? 0x3b8055 : 0xc89c44, 0.98);
          marker.bg.fillRoundedRect(-width / 2, -14 * scale, width, 28 * scale, 14 * scale);
        });
      }

      getLocalPosition() {
        return { x: this.localAvatar?.x || 0, y: this.localAvatar?.y || 0 };
      }

      getDebugSnapshot() {
        return {
          roomId: this.currentRoom?.id || "",
          world: this.currentRoom?.world || null,
          layoutScale: this.currentRoom?.layoutScale || 1,
          cameraZoom: this.cameras.main.zoom,
          backgroundKey: this.currentBackgroundKey,
          walkZoneCount: this.currentRoom?.walkZones?.length || 0,
          blockedZoneCount: this.currentRoom?.blockedZones?.length || 0,
          localPosition: this.getLocalPosition(),
          remoteCount: this.remoteAvatars.size,
          displayedObjectIds: this.children.list
            .filter((object) => object.item)
            .map((object) => object.item.id)
            .sort(),
          markerQuestIds: this.children.list
            .filter((object) => object.questId)
            .map((object) => object.questId)
            .sort(),
          zoneCount: this.interactionZones.length
        };
      }
    }

    game = new Phaser.Game({
      type: Phaser.AUTO,
      parent: containerId,
      width: VIEWPORT.width,
      height: VIEWPORT.height,
      backgroundColor: "#f0ddb6",
      render: { antialias: true, pixelArt: false },
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: VIEWPORT.width,
        height: VIEWPORT.height
      },
      scene: [CampusWorldScene]
    });

    return {
      game,
      destroy() {
        game?.destroy(true);
      },
      get api() {
        return sceneApi;
      }
    };
  }

  window.WSC_ALPACA_CAMPUS_WORLD = Object.freeze({
    createCampusWorldGame
  });
}());

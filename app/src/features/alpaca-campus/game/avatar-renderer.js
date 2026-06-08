(function () {
  const SPRITE_Y = 12;

  function hexToNumber(hex, fallback = 0xf7ead0) {
    const clean = String(hex || "").replace("#", "").trim();
    const parsed = Number.parseInt(clean, 16);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  function getNormalizedAvatar(avatar = {}) {
    const cosmetics = window.WSC_ALPACA_CAMPUS_COSMETICS;
    return {
      ...avatar,
      woolColor: cosmetics?.getColor?.(avatar.woolColor)?.id || "alpaca-09",
      outfitId: cosmetics?.getOutfit?.(avatar.outfitId)?.id || "overall"
    };
  }

  function createAvatarRenderer(scene) {
    const assets = window.WSC_ALPACA_CAMPUS_AVATAR_ASSETS;
    const spriteScale = assets?.displayScale || 0.58;

    function updateFrame(container, time = scene.time.now) {
      if (!container?.baseSprite) {
        return;
      }
      const frame = assets?.getFrame?.(container.avatarDirection || "down", container.avatarMoving, time) || 0;
      container.baseSprite.setFrame(frame);
      if (container.outfitSprite?.visible) {
        container.outfitSprite.setFrame(frame);
      }
    }

    function updateSpriteTextures(container, avatar) {
      const normalized = getNormalizedAvatar(avatar);
      const color = assets?.getColor?.(normalized.woolColor);
      const outfit = assets?.getOutfit?.(normalized.outfitId);

      if (color?.key && scene.textures.exists(color.key)) {
        container.baseSprite.setTexture(color.key);
      }

      if (outfit?.key && scene.textures.exists(outfit.key)) {
        container.outfitSprite.setTexture(outfit.key);
        container.outfitSprite.setVisible(true);
      } else {
        container.outfitSprite.setVisible(false);
      }
      updateFrame(container);
    }

    function updateLabel(container, player) {
      container.playerLabel = {
        displayName: String(player.displayName || player.alpacaName || "Alpaca").slice(0, 28),
        title: String(player.title || "").slice(0, 36)
      };
    }

    function createAvatar(player, isLocal = false) {
      const container = scene.add.container(player.x || 640, player.y || 560);
      container.playerId = player.userId;
      container.isLocal = isLocal;
      container.isMoving = false;
      container.avatarMoving = false;
      container.avatarDirection = "down";
      container.movePath = [];
      container.moveIndex = 0;
      container.speed = player.speed || 165;

      const shadow = scene.add.graphics();
      shadow.fillStyle(0x1d211f, 0.2);
      shadow.fillEllipse(0, 4, 84, 26);
      container.add(shadow);
      container.shadow = shadow;

      const aura = scene.add.graphics();
      aura.lineStyle(3, isLocal ? 0x2d6f69 : 0x8a6338, isLocal ? 0.55 : 0.24);
      aura.strokeEllipse(0, 2, 98, 36);
      container.add(aura);
      container.aura = aura;

      const initialColor = assets?.getColor?.(getNormalizedAvatar(player.avatar).woolColor);
      const initialOutfit = assets?.getOutfit?.(getNormalizedAvatar(player.avatar).outfitId);
      const baseSprite = scene.add.sprite(0, SPRITE_Y, initialColor?.key || "", 0)
        .setOrigin(0.5, 1)
        .setScale(spriteScale);
      container.add(baseSprite);
      container.baseSprite = baseSprite;

      const outfitSprite = scene.add.sprite(0, SPRITE_Y, initialOutfit?.key || "", 0)
        .setOrigin(0.5, 1)
        .setScale(spriteScale);
      container.add(outfitSprite);
      container.outfitSprite = outfitSprite;

      updateAvatar(container, player);
      return container;
    }

    function updateAvatar(container, player) {
      if (!container) {
        return;
      }
      const avatar = getNormalizedAvatar(player.avatar || container.playerData?.avatar);
      container.playerData = {
        ...(container.playerData || {}),
        ...player,
        avatar
      };
      updateSpriteTextures(container, avatar);
      updateLabel(container, {
        ...container.playerData,
        ...player,
        isLocal: container.isLocal
      });
    }

    function setMotion(container, direction = "down", moving = false, time = scene.time.now) {
      if (!container) {
        return;
      }
      container.avatarDirection = direction || container.avatarDirection || "down";
      container.avatarMoving = Boolean(moving);
      updateFrame(container, time);
    }

    function showBubble(container, message) {
      return undefined;
    }

    function setPosition(container, x, y) {
      container.setPosition(x, y);
      container.setDepth(Math.round(y));
    }

    return {
      createAvatar,
      updateAvatar,
      setMotion,
      showBubble,
      setPosition,
      hexToNumber
    };
  }

  window.WSC_ALPACA_CAMPUS_AVATAR_RENDERER = Object.freeze({
    createAvatarRenderer,
    hexToNumber
  });
}());

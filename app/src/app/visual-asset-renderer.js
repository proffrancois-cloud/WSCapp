(function () {
  function createVisualAssetRenderer({
    appState,
    assetService,
    constants,
    helpers
  }) {
    const state = appState;
    const appAssetService = assetService;
    const {
      ASSET_CACHE_VERSION,
      ALPACA_REVIEW_MODE,
      ALPACA_PENDING_REVIEW,
      ALPACA_REVIEW_BADGES
    } = constants;
    const { escapeHtml } = helpers;

    function getAssetValue(path, fallback = null) {
      return appAssetService?.getValue
        ? appAssetService.getValue(path, fallback)
        : fallback;
    }

    function getWizardCardAsset(asset) {
      return appAssetService?.getWizardCardAsset
        ? appAssetService.getWizardCardAsset(asset)
        : asset;
    }

    function renderAssetImage(src, alt, slotClass = "", imageClass = "", eager = false) {
      if (!src) {
        return "";
      }
      const resolvedSrc = versionAssetSrc(src);

      return `
        <div class="${["asset-slot", slotClass].filter(Boolean).join(" ")}">
          <img
            class="${["asset-image", imageClass].filter(Boolean).join(" ")}"
            src="${escapeHtml(resolvedSrc)}"
            alt="${escapeHtml(alt)}"
            loading="${eager ? "eager" : "lazy"}"
            decoding="async"
          />
        </div>
      `;
    }

    function versionAssetSrc(src) {
      const value = String(src || "");
      if (
        !value ||
        /[?&]v=/.test(value) ||
        /^(?:https?:|data:|blob:)/i.test(value) ||
        !/^(?:\.\/)?(?:assets|app-icons)\//.test(value)
      ) {
        return value;
      }

      return `${value}${value.includes("?") ? "&" : "?"}v=${ASSET_CACHE_VERSION}`;
    }

    function renderOptionToken(index) {
      const letter = String.fromCharCode(65 + index);
      const src = index >= 0 && index < 26
        ? `./assets/icons/letters/${letter}.png`
        : null;

      if (src && index < 4) {
        return `
          <span class="option-token image" aria-hidden="true">
            <img class="option-token-image" src="${src}" alt="${escapeHtml(letter)} option token" loading="lazy" decoding="async" />
          </span>
        `;
      }

      return `<span class="option-token text">${escapeHtml(letter)}</span>`;
    }

    function renderReviewBadgeMarkup(label) {
      if (!ALPACA_REVIEW_MODE || !label || !ALPACA_PENDING_REVIEW.has(String(label))) {
        return "";
      }

      return `<span class="alpaca-review-badge" aria-label="Review marker ${escapeHtml(label)}">${escapeHtml(label)}</span>`;
    }

    function wrapWithReviewBadge(markup, label) {
      if (!ALPACA_REVIEW_MODE || !label) {
        return markup;
      }

      return `<span class="alpaca-review-shell">${markup}${renderReviewBadgeMarkup(label)}</span>`;
    }

    function getPathReviewBadge(pathId) {
      return ALPACA_REVIEW_MODE ? (ALPACA_REVIEW_BADGES.paths?.[pathId] || null) : null;
    }

    function getLensReviewBadge(lensId) {
      return ALPACA_REVIEW_MODE ? (ALPACA_REVIEW_BADGES.lenses?.[lensId] || null) : null;
    }

    function getModeReviewBadge(modeId) {
      return ALPACA_REVIEW_MODE ? (ALPACA_REVIEW_BADGES.modes?.[modeId] || null) : null;
    }

    function getTargetReviewBadge(targetId = state.selection.targetId) {
      if (!ALPACA_REVIEW_MODE || !targetId) {
        return null;
      }

      if (targetId === "all") {
        return ALPACA_REVIEW_BADGES.targets?.all || null;
      }

      if (state.selection.lens === "bigidea") {
        return null;
      }

      const branch = state.selection.lens === "subject" ? "subject" : "section";
      return ALPACA_REVIEW_BADGES.targets?.[branch]?.[targetId] || null;
    }

    function getGameplayReviewBadge(stage, modeId = state.experience?.type || state.selection.mode) {
      if (!ALPACA_REVIEW_MODE || !modeId) {
        return null;
      }

      return ALPACA_REVIEW_BADGES.gameplay?.[stage]?.[modeId] || null;
    }

    function renderConfiguredMascotAsset(asset, fallbackMood, size, options = {}) {
      const badge = options.reviewBadge || null;

      if (asset) {
        return wrapWithReviewBadge(renderAssetImage(
          asset,
          options.alt || `${fallbackMood} alpaca`,
          ["mascot-slot", `mascot-slot-${size}`, options.slotClass].filter(Boolean).join(" "),
          ["mascot-asset", `mascot-asset-${size}`, options.imageClass].filter(Boolean).join(" "),
          options.eager === true
        ), badge);
      }

      return wrapWithReviewBadge(renderMascot(fallbackMood, size, options), badge);
    }

    function getTargetAssetPath(targetId = state.selection.targetId) {
      return appAssetService?.getTargetPath
        ? appAssetService.getTargetPath(targetId, state.selection.lens)
        : null;
    }

    function getModeAssetPath(modeId = state.selection.mode) {
      return appAssetService?.getModePath
        ? appAssetService.getModePath(modeId)
        : null;
    }

    function getGameplayAssetPath(stage, modeId = state.experience?.type || state.selection.mode) {
      return appAssetService?.getGameplayPath
        ? appAssetService.getGameplayPath(stage, modeId)
        : null;
    }

    function getResultAssetPath(modeId = state.experience?.type, outcome = "success") {
      return appAssetService?.getResultPath
        ? appAssetService.getResultPath(modeId, outcome)
        : null;
    }

    function getFallbackMood(mood) {
      const moodFallbacks = {
        excited: "happy",
        victory: "happy",
        retry: "sad",
        neutral: "wise",
        thinking: "wise"
      };

      return moodFallbacks[mood] || mood;
    }

    function renderMascot(mood, size, options = {}) {
      const asset = getAssetValue(["mascot", "states", mood, size]) || getAssetValue(["mascot", "states", mood, "default"]);

      if (asset) {
        return renderAssetImage(
          asset,
          options.alt || `${mood} alpaca`,
          ["mascot-slot", `mascot-slot-${size}`, options.slotClass].filter(Boolean).join(" "),
          ["mascot-asset", `mascot-asset-${size}`, options.imageClass].filter(Boolean).join(" "),
          options.eager === true
        );
      }

      return alpacaAvatar(getFallbackMood(mood), size);
    }

    function renderHeroVisual() {
      const heroAsset = getAssetValue(["screens", "hero", "main"]);
      const content = heroAsset
        ? renderAssetImage(heroAsset, "WSC 2026 Study Routes hero illustration", "hero-visual-asset", "hero-visual-image", true)
        : renderMascot("happy", "hero", { alt: "Hero alpaca", eager: true });

      return `<div class="hero-visual-slot">${content}</div>`;
    }

    function renderLessonVisual(type) {
      const key = type === "slideshow" ? "slideshowIllustration" : "mindmapGuide";
      const label = type === "slideshow" ? "Slideshow lesson illustration" : "Mind map guide illustration";
      const lessonAsset = getAssetValue(["lessons", key]) || getTargetAssetPath() || getModeAssetPath(type);
      const reviewBadge = getTargetReviewBadge() || getModeReviewBadge(type);
      const content = lessonAsset
        ? renderAssetImage(
          lessonAsset,
          label,
          `lesson-visual-slot lesson-visual-slot-${type}`,
          `lesson-visual-image lesson-visual-image-${type}`
        )
        : renderMascot("wise", "large", { alt: label });

      return `<div class="lesson-visual-shell lesson-visual-shell-${type}">${wrapWithReviewBadge(content, reviewBadge)}</div>`;
    }

    function renderCheckpointVisual(kind) {
      const isSuccess = kind === "success";
      const asset = getAssetValue(["screens", "checkpoints", isSuccess ? "success" : "fail"]);
      const label = isSuccess ? "Checkpoint cleared visual" : "Checkpoint retry visual";
      const content = asset
        ? renderAssetImage(
          asset,
          label,
          `checkpoint-visual-slot checkpoint-visual-slot-${kind}`,
          `checkpoint-visual-image checkpoint-visual-image-${kind}`
        )
        : renderMascot(isSuccess ? "happy" : "sad", "medium", { alt: label });

      return `<div class="checkpoint-visual checkpoint-visual-${kind}">${content}</div>`;
    }

    function renderJeopardyDecoration() {
      const asset = getAssetValue(["boards", "alpacapardyOverlay"]) || getAssetValue(["boards", "jeopardyOverlay"]);
      return renderAssetImage(
        asset,
        "Alpacapardy board decoration",
        "board-decoration board-decoration-jeopardy",
        "board-decoration-image board-decoration-image-jeopardy"
      );
    }

    function renderRaceFrame() {
      const asset = getAssetValue(["race", "frame"]);
      return renderAssetImage(
        asset,
        "Race mode frame",
        "race-card-art race-card-art-frame",
        "race-card-art-image race-card-art-image-frame"
      );
    }

    function getRaceLifeState(index, livesRemaining) {
      if (index >= livesRemaining) {
        return "empty";
      }

      if (livesRemaining === 1 && index === 0) {
        return "warning";
      }

      return "full";
    }

    function renderRaceLivesIcon(state) {
      const normalizedState = state || "empty";
      const asset = getAssetValue(["race", "livesIcon", normalizedState]) || getAssetValue(["race", "livesIcon"]);
      return renderAssetImage(
        asset,
        normalizedState === "warning" ? "Last chance" : normalizedState === "full" ? "Life available" : "Life spent",
        `race-life-asset ${normalizedState}`,
        "race-life-asset-image"
      );
    }

    function hasRaceLivesIconAssets() {
      return Boolean(
        getAssetValue(["race", "livesIcon", "full"]) ||
        getAssetValue(["race", "livesIcon", "warning"]) ||
        getAssetValue(["race", "livesIcon", "empty"]) ||
        getAssetValue(["race", "livesIcon"])
      );
    }

    function renderRaceFailVisual() {
      const asset = getAssetValue(["race", "failState"]);
      if (asset) {
        return renderAssetImage(
          asset,
          "Race fail state visual",
          "race-fail-visual",
          "race-fail-visual-image"
        );
      }

      return renderMascot("sad", "medium", { alt: "Race fail state" });
    }

    function alpacaAvatar(mood, size) {
      return `
        <div class="alpaca-avatar ${escapeHtml(mood)} ${escapeHtml(size)}" aria-hidden="true">
          <span class="alpaca-ear left"></span>
          <span class="alpaca-ear right"></span>
          <span class="alpaca-fluff"></span>
          <span class="alpaca-face">
            <span class="alpaca-eye left"></span>
            <span class="alpaca-eye right"></span>
            <span class="alpaca-snout"></span>
            <span class="alpaca-mouth"></span>
            <span class="alpaca-tear"></span>
          </span>
        </div>
      `;
    }

    function renderAlpacaList(items) {
      return `
        <div class="alpaca-list">
          ${items.map((item) => `
            <div class="alpaca-li">
              <span class="alpaca-bullet" aria-hidden="true"></span>
              <span>${escapeHtml(item)}</span>
            </div>
          `).join("")}
        </div>
      `;
    }

    return Object.freeze({
      getAssetValue,
      getWizardCardAsset,
      renderAssetImage,
      versionAssetSrc,
      renderOptionToken,
      renderReviewBadgeMarkup,
      wrapWithReviewBadge,
      getPathReviewBadge,
      getLensReviewBadge,
      getModeReviewBadge,
      getTargetReviewBadge,
      getGameplayReviewBadge,
      renderConfiguredMascotAsset,
      getTargetAssetPath,
      getModeAssetPath,
      getGameplayAssetPath,
      getResultAssetPath,
      getFallbackMood,
      renderMascot,
      renderHeroVisual,
      renderLessonVisual,
      renderCheckpointVisual,
      renderJeopardyDecoration,
      renderRaceFrame,
      getRaceLifeState,
      renderRaceLivesIcon,
      hasRaceLivesIconAssets,
      renderRaceFailVisual,
      alpacaAvatar,
      renderAlpacaList
    });
  }

  window.WSC_CREATE_VISUAL_ASSET_RENDERER = createVisualAssetRenderer;
}());

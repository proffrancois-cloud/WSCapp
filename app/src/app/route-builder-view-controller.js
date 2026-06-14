(function initRouteBuilderViewController(global) {
  "use strict";

  function requireObject(value, name) {
    if (!value || typeof value !== "object") {
      throw new Error(`WSC route builder view controller requires ${name}.`);
    }
    return value;
  }

  function requireFunction(collection, name) {
    const value = collection?.[name];
    if (typeof value !== "function") {
      throw new Error(`WSC route builder view controller requires ${name}().`);
    }
    return value;
  }

  function createRouteBuilderViewController(options = {}) {
    const state = requireObject(options.appState, "appState");
    const refs = requireObject(options.refs, "refs");
    const appDomService = requireObject(options.appDomService, "appDomService");
    const wizardRenderer = requireObject(options.wizardRenderer, "wizardRenderer");
    const windowRef = options.windowRef || global;
    const documentRef = options.documentRef || global.document;
    const constants = options.constants || {};
    const helpers = options.helpers || {};
    const callbacks = options.callbacks || {};

    const WIZARD_TOTAL_STEPS = constants.WIZARD_TOTAL_STEPS || 2;
    const DEFAULT_LENS_ID = constants.DEFAULT_LENS_ID || "section";
    const PATH_OPTIONS = Array.isArray(constants.PATH_OPTIONS) ? constants.PATH_OPTIONS : [];
    const LENS_OPTIONS = Array.isArray(constants.LENS_OPTIONS) ? constants.LENS_OPTIONS : [];

    const escapeHtml = requireFunction(helpers, "escapeHtml");
    const renderConfiguredMascotAsset = requireFunction(helpers, "renderConfiguredMascotAsset");
    const getAssetValue = requireFunction(helpers, "getAssetValue");
    const getWizardCardAsset = requireFunction(helpers, "getWizardCardAsset");
    const getTargetAssetPath = requireFunction(helpers, "getTargetAssetPath");
    const getModeAssetPath = requireFunction(helpers, "getModeAssetPath");
    const getPathReviewBadge = requireFunction(helpers, "getPathReviewBadge");
    const getLensReviewBadge = requireFunction(helpers, "getLensReviewBadge");
    const getTargetReviewBadge = requireFunction(helpers, "getTargetReviewBadge");
    const getModeReviewBadge = requireFunction(helpers, "getModeReviewBadge");
    const getTargetLabel = requireFunction(helpers, "getTargetLabel");
    const getModeOption = requireFunction(helpers, "getModeOption");
    const getSelectedSectionIds = requireFunction(helpers, "getSelectedSectionIds");
    const getTargetOptions = requireFunction(helpers, "getTargetOptions");
    const getVisibleModeOptions = requireFunction(helpers, "getVisibleModeOptions");
    const getVisibleModeOptionsForPath = requireFunction(helpers, "getVisibleModeOptionsForPath");
    const getModePath = requireFunction(helpers, "getModePath");
    const getAppModeSwitchIcon = requireFunction(helpers, "getAppModeSwitchIcon");
    const renderAlpacaOnlineHub = requireFunction(callbacks, "renderAlpacaOnlineHub");

    function getVisibleModeChoicePath() {
      return state.ui.openModeChoicePath
        || documentRef.querySelector(".mode-choice-board")?.dataset.activePath
        || documentRef.querySelector(".mode-choice-column.is-open")?.dataset.modeChoicePath
        || null;
    }

    function primeModeChoiceCardSpread(column) {
      column.querySelectorAll(".mode-choice-card-grid .wizard-choice-card").forEach((card, index) => {
        card.style.setProperty("opacity", "0", "important");
        card.style.setProperty("filter", "blur(2px)", "important");
        card.style.setProperty("transform", "translate(-50%, -50%) scale(0.18)", "important");
        card.style.setProperty("transition", "none", "important");
        card.style.setProperty("transition-delay", `${index * 36}ms`, "important");
      });
    }

    function scheduleModeChoiceCardSpread(column, board) {
      primeModeChoiceCardSpread(column);
      column.classList.remove("is-open");
      column.querySelector(".mode-choice-card-grid")?.getBoundingClientRect();
      column.classList.add("is-open");
      column.classList.remove("is-closing");
      column.querySelector(".mode-choice-card-grid")?.getBoundingClientRect();

      board._modeChoiceOpenFrame = windowRef.requestAnimationFrame(() => {
        board._modeChoiceOpenFrame = windowRef.requestAnimationFrame(() => {
          animateModeChoiceCardSpread(column, board);
          board._modeChoiceOpenFrame = null;
        });
      });
    }

    function getModeChoiceCardTarget(card) {
      const computedStyle = windowRef.getComputedStyle(card);
      const parsePercent = (value, fallback) => {
        const parsed = Number.parseFloat(String(value || "").replace("%", ""));
        return Number.isFinite(parsed) ? parsed : fallback;
      };
      return {
        x: parsePercent(computedStyle.getPropertyValue("--menu-x"), 50),
        y: parsePercent(computedStyle.getPropertyValue("--menu-y"), 0)
      };
    }

    function easeModeChoiceSpread(progress) {
      return progress < 0.5
        ? 4 * progress * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 3) / 2;
    }

    function setModeChoiceCardSpreadFrame(card, target, progress) {
      const eased = easeModeChoiceSpread(Math.min(1, Math.max(0, progress)));
      const x = -50 + (target.x + 50) * eased;
      const y = -50 + (target.y + 50) * eased;
      const scale = 0.18 + 0.82 * eased;
      const opacity = Math.min(1, Math.max(0, progress * 1.45));
      const blur = Math.max(0, 2 * (1 - eased));
      card.style.setProperty("opacity", String(opacity), "important");
      card.style.setProperty("filter", `blur(${blur.toFixed(2)}px)`, "important");
      card.style.setProperty("transform", `translate(${x.toFixed(2)}%, ${y.toFixed(2)}%) scale(${scale.toFixed(3)})`, "important");
    }

    function animateModeChoiceCardSpread(column, board) {
      const duration = 980;
      const cards = Array.from(column.querySelectorAll(".mode-choice-card-grid .wizard-choice-card")).map((card, index) => ({
        card,
        index,
        target: getModeChoiceCardTarget(card)
      }));
      const startedAt = windowRef.performance.now();

      const step = (now) => {
        let isRunning = false;
        cards.forEach(({ card, index, target }) => {
          const progress = (now - startedAt - index * 36) / duration;
          if (progress < 1) {
            isRunning = true;
          }
          setModeChoiceCardSpreadFrame(card, target, progress);
        });

        if (isRunning) {
          board._modeChoiceSpreadAnimationId = windowRef.requestAnimationFrame(step);
          return;
        }

        cards.forEach(({ card, target }) => {
          card.style.setProperty("opacity", "1", "important");
          card.style.setProperty("filter", "blur(0)", "important");
          card.style.setProperty("transform", `translate(${target.x}%, ${target.y}%) scale(1)`, "important");
        });
        board._modeChoiceSpreadAnimationId = null;
      };

      board._modeChoiceSpreadAnimationId = windowRef.requestAnimationFrame(step);
    }

    function clearModeChoiceCardSpread(column) {
      column.querySelectorAll(".mode-choice-card-grid .wizard-choice-card").forEach((card) => {
        card.style.removeProperty("opacity");
        card.style.removeProperty("filter");
        card.style.removeProperty("transform");
        card.style.removeProperty("transition");
        card.style.removeProperty("transition-delay");
      });
    }

    function freezeModeChoiceColumnAtCurrentPosition(column, board) {
      const boardRect = board.getBoundingClientRect();
      const columnRect = column.getBoundingClientRect();
      column.style.setProperty("left", `${columnRect.left - boardRect.left}px`, "important");
      column.style.setProperty("top", `${columnRect.top - boardRect.top}px`, "important");
      column.style.setProperty("width", `${columnRect.width}px`, "important");
      column.style.setProperty("height", `${columnRect.height}px`, "important");
      column.style.setProperty("transform", "none", "important");
      column.style.setProperty("opacity", "1", "important");
      column.getBoundingClientRect();
    }

    function getModeChoiceCollapsedSlot(column) {
      const pathId = column.dataset.modeChoicePath || "";
      const left = Math.min(16, Math.max(4, windowRef.innerWidth * 0.011));
      const topByPath = {
        learn: 40,
        play: 174,
        train: 308
      };
      return {
        left,
        top: topByPath[pathId] || 40,
        width: 112,
        height: 112
      };
    }

    function moveModeChoiceColumnToCollapsedSlot(column) {
      const slot = getModeChoiceCollapsedSlot(column);
      column.style.setProperty("left", `${slot.left}px`, "important");
      column.style.setProperty("top", `${slot.top}px`, "important");
      column.style.setProperty("width", `${slot.width}px`, "important");
      column.style.setProperty("height", `${slot.height}px`, "important");
      column.style.setProperty("transform", "none", "important");
      column.style.setProperty("opacity", "0.68", "important");
    }

    function clearModeChoiceColumnPosition(column) {
      ["left", "top", "width", "height", "transform", "opacity"].forEach((property) => {
        column.style.removeProperty(property);
      });
    }

    function toggleModeChoiceMenu(button) {
      const column = button.closest(".mode-choice-column");
      if (!column) {
        return;
      }

      if (!getSelectedSectionIds().length) {
        const board = column.closest(".mode-choice-board");
        board?.classList.add("needs-section-selection");
        windowRef.setTimeout(() => board?.classList.remove("needs-section-selection"), 560);
        return;
      }

      const board = column.closest(".mode-choice-board");
      if (!board) {
        return;
      }

      const pathId = column.dataset.modeChoicePath || button.dataset.toggleModeMenu || "";
      const isOpen = column.classList.contains("is-open");
      const openColumn = board.querySelector(".mode-choice-column.is-open");
      const isSwitching = Boolean(openColumn && openColumn !== column);
      const animationMs = 1240;

      if (board._modeChoiceTimer) {
        windowRef.clearTimeout(board._modeChoiceTimer);
      }
      if (board._modeChoiceFinishTimer) {
        windowRef.clearTimeout(board._modeChoiceFinishTimer);
      }
      if (board._modeChoiceOpenTimer) {
        windowRef.clearTimeout(board._modeChoiceOpenTimer);
      }
      if (board._modeChoiceOpenFrame) {
        windowRef.cancelAnimationFrame(board._modeChoiceOpenFrame);
        board._modeChoiceOpenFrame = null;
      }
      if (board._modeChoiceSpreadAnimationId) {
        windowRef.cancelAnimationFrame(board._modeChoiceSpreadAnimationId);
        board._modeChoiceSpreadAnimationId = null;
      }
      board.querySelectorAll(".mode-choice-column").forEach((item) => {
        if (item !== column) {
          clearModeChoiceCardSpread(item);
          clearModeChoiceColumnPosition(item);
        }
      });

      if (isOpen) {
        state.ui.openModeChoicePath = null;
        clearModeChoiceCardSpread(column);
        clearModeChoiceColumnPosition(column);
        column.classList.add("is-closing");
        board.classList.add("is-menu-closing");
        board.removeAttribute("data-active-path");
        button.setAttribute("aria-expanded", "false");
        board._modeChoiceTimer = windowRef.setTimeout(() => {
          clearModeChoiceCardSpread(column);
          clearModeChoiceColumnPosition(column);
          column.classList.remove("is-open", "is-closing", "is-opening", "is-targeting");
          board.classList.remove("is-menu-closing", "is-menu-switching");
          board._modeChoiceTimer = null;
        }, animationMs);
        return;
      }

      if (isSwitching && openColumn) {
        freezeModeChoiceColumnAtCurrentPosition(openColumn, board);
      }
      state.ui.openModeChoicePath = pathId;
      board.dataset.activePath = pathId;
      board.classList.toggle("is-menu-switching", isSwitching);
      board.querySelectorAll("[data-toggle-mode-menu]").forEach((menuButton) => {
        menuButton.setAttribute("aria-expanded", menuButton === button ? "true" : "false");
      });
      board.querySelectorAll(".mode-choice-column").forEach((item) => {
        item.classList.toggle("is-targeting", item === column);
        if (item === column) {
          item.classList.remove("is-closing");
          item.classList.add("is-opening");
          return;
        }
        item.classList.remove("is-opening", "is-targeting");
        if (item !== openColumn) {
          item.classList.remove("is-open", "is-closing");
        }
      });
      if (openColumn && openColumn !== column) {
        openColumn.classList.add("is-closing");
        openColumn.classList.remove("is-open", "is-opening", "is-targeting");
        moveModeChoiceColumnToCollapsedSlot(openColumn);
      }
      button.setAttribute("aria-expanded", "true");

      clearModeChoiceColumnPosition(column);
      scheduleModeChoiceCardSpread(column, board);

      board._modeChoiceTimer = windowRef.setTimeout(() => {
        board.querySelectorAll(".mode-choice-column").forEach((item) => {
          if (item === column) {
            item.classList.remove("is-opening", "is-targeting");
            clearModeChoiceCardSpread(item);
            clearModeChoiceColumnPosition(item);
            return;
          }
          clearModeChoiceCardSpread(item);
          clearModeChoiceColumnPosition(item);
          item.classList.remove("is-open", "is-closing", "is-opening", "is-targeting");
        });
        board._modeChoiceTimer = null;
        board.classList.remove("is-menu-switching", "is-menu-closing");
      }, animationMs);
    }

    function renderWizard() {
      if (state.ui.appShellMode === "online") {
        if (refs.routeBuilderTitle) {
          refs.routeBuilderTitle.textContent = "";
        }
        if (refs.wizardRailMount) {
          appDomService.clearHtml(refs.wizardRailMount);
        }
        appDomService.setHtml(refs.wizardSteps, renderAlpacaOnlineHub());
        return;
      }

      const renderedWizard = wizardRenderer.renderWizard(getWizardRenderContext(), getWizardRenderHelpers());

      if (refs.routeBuilderTitle) {
        refs.routeBuilderTitle.textContent = renderedWizard.title;
      }

      if (refs.wizardRailMount) {
        appDomService.setHtml(refs.wizardRailMount, renderedWizard.railHtml);
      }

      appDomService.setHtml(refs.wizardSteps, renderedWizard.stepsHtml);
    }

    function renderStepPanel(index, title, helper, content, gridClass) {
      return wizardRenderer.renderStepPanel(index, title, helper, content, gridClass, getWizardRenderContext(), getWizardRenderHelpers());
    }

    function getCurrentWizardStepNumber() {
      return wizardRenderer.getCurrentStepNumber(getWizardRenderContext());
    }

    function getWizardStepDefinition(stepNumber) {
      return wizardRenderer.getStepDefinition(stepNumber, getWizardRenderContext(), getWizardRenderHelpers());
    }

    function renderWizardRail(currentStep) {
      return wizardRenderer.renderWizardRail(currentStep, getWizardRenderContext(), getWizardRenderHelpers());
    }

    function renderWizardRailItem(item, currentStep) {
      return wizardRenderer.renderWizardRailItem(item, currentStep, getWizardRenderContext(), getWizardRenderHelpers());
    }

    function getWizardRailItems() {
      return wizardRenderer.getRailItems(getWizardRenderContext(), getWizardRenderHelpers());
    }

    function getWizardCompletionDepth() {
      return wizardRenderer.getCompletionDepth(getWizardRenderContext());
    }

    function renderPathCards() {
      return wizardRenderer.renderPathCards(getWizardRenderContext(), getWizardRenderHelpers());
    }

    function renderLensCards() {
      return wizardRenderer.renderLensCards(getWizardRenderContext(), getWizardRenderHelpers());
    }

    function renderTargetCards() {
      return wizardRenderer.renderTargetCards(getWizardRenderContext(), getWizardRenderHelpers());
    }

    function renderModeCards() {
      return wizardRenderer.renderModeCards(getWizardRenderContext(), getWizardRenderHelpers());
    }

    function renderModeChoiceBoard() {
      return wizardRenderer.renderModeChoiceBoard(getWizardRenderContext(), getWizardRenderHelpers());
    }

    function renderModeChoiceColumn(pathId, title, asset, options) {
      return wizardRenderer.renderModeChoiceColumn(pathId, title, asset, options, getWizardRenderContext(), getWizardRenderHelpers());
    }

    function renderModeChoiceCard(option, pathId) {
      return wizardRenderer.renderModeChoiceCard(option, pathId, getWizardRenderContext(), getWizardRenderHelpers());
    }

    function getWizardRenderContext() {
      return {
        selection: state.selection,
        ui: state.ui,
        wizardTotalSteps: WIZARD_TOTAL_STEPS,
        defaultLensId: DEFAULT_LENS_ID,
        pathOptions: PATH_OPTIONS,
        lensOptions: LENS_OPTIONS
      };
    }

    function getWizardRenderHelpers() {
      return {
        escapeHtml,
        renderConfiguredMascotAsset,
        getAssetValue,
        getWizardCardAsset,
        getTargetAssetPath,
        getModeAssetPath,
        getPathReviewBadge,
        getLensReviewBadge,
        getTargetReviewBadge,
        getModeReviewBadge,
        getTargetLabel,
        getModeOption,
        getSelectedSectionIds,
        getTargetOptions,
        getVisibleModeOptions,
        getVisibleModeOptionsForPath,
        getModePath,
        getAppModeSwitchIcon
      };
    }

    return Object.freeze({
      getVisibleModeChoicePath,
      primeModeChoiceCardSpread,
      scheduleModeChoiceCardSpread,
      getModeChoiceCardTarget,
      easeModeChoiceSpread,
      setModeChoiceCardSpreadFrame,
      animateModeChoiceCardSpread,
      clearModeChoiceCardSpread,
      freezeModeChoiceColumnAtCurrentPosition,
      getModeChoiceCollapsedSlot,
      moveModeChoiceColumnToCollapsedSlot,
      clearModeChoiceColumnPosition,
      toggleModeChoiceMenu,
      renderWizard,
      renderStepPanel,
      getCurrentWizardStepNumber,
      getWizardStepDefinition,
      renderWizardRail,
      renderWizardRailItem,
      getWizardRailItems,
      getWizardCompletionDepth,
      renderPathCards,
      renderLensCards,
      renderTargetCards,
      renderModeCards,
      renderModeChoiceBoard,
      renderModeChoiceColumn,
      renderModeChoiceCard,
      getWizardRenderContext,
      getWizardRenderHelpers
    });
  }

  global.WSC_CREATE_ROUTE_BUILDER_VIEW_CONTROLLER = createRouteBuilderViewController;
}(window));

(function () {
  const MODE_CHOICE_PATHS = Object.freeze(["learn", "play", "train"]);

  function resetRawQuizUi(appState, { resetPages = true } = {}) {
    appState.ui.rawQuizSelections = {};
    if (resetPages) {
      appState.ui.rawQuizPages = {};
    }
  }

  function resetExperience(appState) {
    appState.experience = null;
  }

  function resetSelection(appState, { defaultLensId = "section", path = null } = {}) {
    appState.selection.path = path;
    appState.selection.lens = defaultLensId;
    appState.selection.targetIds = [];
    appState.selection.targetId = null;
    appState.selection.mode = null;
  }

  function normalizeOrderedTargetIds(targetIds = [], getOrderedSectionIds = () => []) {
    const current = new Set(targetIds);
    return getOrderedSectionIds().filter((id) => current.has(id));
  }

  function choosePath(appState, pathId, { defaultLensId = "section" } = {}) {
    appState.ui.wizardTransition = "forward";
    resetRawQuizUi(appState);
    resetSelection(appState, { defaultLensId, path: pathId });
    resetExperience(appState);
  }

  function chooseLens(appState, lensId) {
    appState.ui.wizardTransition = "forward";
    resetRawQuizUi(appState);
    appState.selection.lens = lensId;
    appState.selection.targetIds = [];
    appState.selection.targetId = null;
    appState.selection.mode = null;
    resetExperience(appState);
  }

  function chooseTarget(appState, targetId, {
    getSelectedSectionIds = () => [],
    getOrderedSectionIds = () => []
  } = {}) {
    appState.ui.wizardTransition = "neutral";
    resetRawQuizUi(appState);

    const current = new Set(getSelectedSectionIds());
    if (current.has(targetId)) {
      current.delete(targetId);
    } else {
      current.add(targetId);
    }

    appState.selection.targetIds = normalizeOrderedTargetIds(current, getOrderedSectionIds);
    appState.selection.targetId = null;
    appState.selection.mode = null;
    resetExperience(appState);
  }

  function getPreservedModeChoicePath(visibleOpenPath) {
    return MODE_CHOICE_PATHS.includes(visibleOpenPath) ? visibleOpenPath : null;
  }

  function toggleModeChoiceSection(appState, targetId, {
    visibleOpenPath = null,
    getSelectedSectionIds = () => [],
    getOrderedSectionIds = () => []
  } = {}) {
    appState.ui.wizardTransition = "neutral";
    resetRawQuizUi(appState);

    const current = new Set(getSelectedSectionIds());
    if (current.has(targetId)) {
      current.delete(targetId);
    } else {
      current.add(targetId);
    }

    const selectedIds = normalizeOrderedTargetIds(current, getOrderedSectionIds);
    appState.selection.targetIds = selectedIds;
    appState.selection.targetId = selectedIds[0] || null;
    appState.selection.mode = null;
    resetExperience(appState);
    appState.ui.openModeChoicePath = selectedIds.length ? getPreservedModeChoicePath(visibleOpenPath) : null;
  }

  function continueTargetSelection(appState, {
    defaultLensId = "section",
    selectedIds = []
  } = {}) {
    if (!selectedIds.length) {
      return false;
    }

    appState.ui.wizardTransition = "forward";
    resetRawQuizUi(appState);
    appState.selection.lens = defaultLensId;
    appState.selection.targetIds = selectedIds;
    appState.selection.targetId = selectedIds[0];
    appState.selection.mode = null;
    resetExperience(appState);
    return true;
  }

  function chooseMode(appState, modeId, {
    pathId = null,
    defaultLensId = "section",
    selectedIds = [],
    getModePath = () => null,
    isModeUnavailable = () => false
  } = {}) {
    if (!selectedIds.length) {
      appState.selection.mode = null;
      resetExperience(appState);
      return { selected: false, unavailable: false };
    }

    appState.ui.wizardTransition = "forward";
    if (modeId !== "rawcontent") {
      resetRawQuizUi(appState);
    }
    if (!appState.selection.targetId && selectedIds.length) {
      appState.selection.targetId = selectedIds[0];
    }
    appState.selection.path = pathId || getModePath(modeId) || appState.selection.path || "learn";
    appState.selection.lens = defaultLensId;
    appState.selection.mode = modeId;
    resetExperience(appState);

    return {
      selected: true,
      unavailable: Boolean(isModeUnavailable(modeId))
    };
  }

  function changeGuidingSections(appState, { defaultLensId = "section" } = {}) {
    appState.ui.wizardTransition = "backward";
    resetRawQuizUi(appState);
    resetSelection(appState, { defaultLensId });
    resetExperience(appState);
  }

  function changeModeSelection(appState, {
    defaultLensId = "section",
    selectedIds = []
  } = {}) {
    appState.ui.wizardTransition = "backward";
    resetRawQuizUi(appState);
    appState.selection.path = null;
    appState.selection.lens = defaultLensId;
    appState.selection.targetIds = selectedIds;
    appState.selection.targetId = selectedIds[0] || appState.selection.targetId;
    appState.selection.mode = null;
    resetExperience(appState);
  }

  function clearFrom(appState, step, { defaultLensId = "section" } = {}) {
    appState.ui.wizardTransition = "backward";
    resetRawQuizUi(appState);

    if (step === "path") {
      resetSelection(appState, { defaultLensId });
    } else if (step === "lens") {
      appState.selection.lens = defaultLensId;
      appState.selection.targetIds = [];
      appState.selection.targetId = null;
      appState.selection.mode = null;
    } else if (step === "target") {
      resetSelection(appState, { defaultLensId });
    } else if (step === "mode") {
      appState.selection.lens = defaultLensId;
      appState.selection.mode = null;
    }

    resetExperience(appState);
  }

  function openRawConnection(appState, lensId, targetId) {
    if (!lensId || !targetId) {
      return false;
    }

    appState.ui.wizardTransition = "forward";
    resetRawQuizUi(appState);
    appState.selection.path = "learn";
    appState.selection.lens = lensId;
    appState.selection.targetIds = targetId && targetId !== "all" ? [targetId] : [];
    appState.selection.targetId = targetId;
    appState.selection.mode = "rawcontent";
    resetExperience(appState);
    return true;
  }

  function openGuideSection(appState, sectionId) {
    appState.ui.wizardTransition = "forward";
    resetRawQuizUi(appState);
    appState.selection.path = "learn";
    appState.selection.lens = "section";
    appState.selection.targetIds = [sectionId];
    appState.selection.targetId = sectionId;
    appState.selection.mode = "regularguide";
    resetExperience(appState);
  }

  function openSectionChannel(appState, sectionId, { normalizeSectionId = (id) => id } = {}) {
    const normalizedSectionId = normalizeSectionId(sectionId);
    appState.ui.wizardTransition = "forward";
    resetRawQuizUi(appState);
    appState.selection.path = "learn";
    appState.selection.lens = "section";
    appState.selection.targetId = normalizedSectionId;
    appState.selection.targetIds = [normalizedSectionId].filter(Boolean);
    appState.selection.mode = "channel";
    resetExperience(appState);
  }

  window.WSC_ROUTE_BUILDER_CONTROLLER = Object.freeze({
    choosePath,
    chooseLens,
    chooseTarget,
    toggleModeChoiceSection,
    continueTargetSelection,
    chooseMode,
    changeGuidingSections,
    changeModeSelection,
    clearFrom,
    openRawConnection,
    openGuideSection,
    openSectionChannel,
    getPreservedModeChoicePath
  });
}());

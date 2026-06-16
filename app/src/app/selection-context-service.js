(function () {
  function createSelectionContextService({
    appState,
    data,
    sectionById,
    bigIdeaRouteById,
    constants,
    helpers
  }) {
    const {
      lensOptions,
      modeOptions
    } = constants;
    const {
      getActiveSubjectCatalog,
      normalizeSectionId
    } = helpers;

    function getPathOption(pathId) {
      return window.WSC_APP_CONFIG.PATH_OPTIONS.find((option) => option.id === pathId) || null;
    }

    function getLensLabel(lensId) {
      const option = lensOptions.find((lens) => lens.id === lensId);
      return option ? option.title : "Route";
    }

    function getModeOption(modeId) {
      return Object.values(modeOptions).flat().find((option) => option.id === modeId) || null;
    }

    function getLensCardPluralLabel(lensId) {
      if (lensId === "subject") {
        return "subjects";
      }

      if (lensId === "bigidea") {
        return "big ideas";
      }

      return "guiding sections";
    }

    function getOrderedSectionIds() {
      return data.sections.map((section) => section.id);
    }

    function getSelectedSectionIds() {
      const orderedIds = getOrderedSectionIds();
      const selected = Array.isArray(appState.selection.targetIds) ? appState.selection.targetIds : [];
      const normalized = new Set(selected.map((id) => normalizeSectionId(id)).filter(Boolean));

      if (normalized.size) {
        return orderedIds.filter((id) => normalized.has(id));
      }

      if (appState.selection.lens === "section" && appState.selection.targetId && appState.selection.targetId !== "all") {
        const targetId = normalizeSectionId(appState.selection.targetId);
        return orderedIds.includes(targetId) ? [targetId] : [];
      }

      if (appState.selection.targetId === "all") {
        return orderedIds;
      }

      return [];
    }

    function getSelectedSectionLabels() {
      return getSelectedSectionIds()
        .map((id) => sectionById[id] ? sectionById[id].title : id)
        .filter(Boolean);
    }

    function getSelectedSectionLabel() {
      const selectedIds = getSelectedSectionIds();
      if (!selectedIds.length) {
        return "Guiding Sections";
      }

      if (selectedIds.length === 1) {
        return sectionById[selectedIds[0]] ? sectionById[selectedIds[0]].title : selectedIds[0];
      }

      return `${selectedIds.length} guiding sections`;
    }

    function getTargetLabelForLens(lensId, targetId) {
      if (targetId === "all") {
        if (lensId === "subject") {
          return "All subjects";
        }

        if (lensId === "bigidea") {
          return "All big ideas";
        }

        return "All guiding sections";
      }

      if (lensId === "subject") {
        const subjectCatalog = getActiveSubjectCatalog();
        const match = subjectCatalog.find((subject) => subject.id === targetId);
        return match ? match.label : targetId;
      }

      if (lensId === "bigidea") {
        return bigIdeaRouteById[targetId] ? bigIdeaRouteById[targetId].label : targetId;
      }

      return sectionById[targetId] ? sectionById[targetId].title : targetId;
    }

    function getTargetLabel() {
      if (appState.selection.lens === "section") {
        return getSelectedSectionLabel();
      }

      return getTargetLabelForLens(appState.selection.lens, appState.selection.targetId);
    }

    return Object.freeze({
      getPathOption,
      getLensLabel,
      getModeOption,
      getLensCardPluralLabel,
      getOrderedSectionIds,
      getSelectedSectionIds,
      getSelectedSectionLabels,
      getSelectedSectionLabel,
      getTargetLabelForLens,
      getTargetLabel
    });
  }

  window.WSC_CREATE_SELECTION_CONTEXT_SERVICE = createSelectionContextService;
}());

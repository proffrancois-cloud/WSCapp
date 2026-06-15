(function initMindMapController(global) {
  "use strict";

  function requireObject(value, name) {
    if (!value || typeof value !== "object") {
      throw new Error(`WSC mind map controller requires ${name}.`);
    }
    return value;
  }

  function requireFunction(collection, name) {
    const value = collection?.[name];
    if (typeof value !== "function") {
      throw new Error(`WSC mind map controller requires ${name}().`);
    }
    return value;
  }

  function createMindMapController(options = {}) {
    const state = requireObject(options.appState, "appState");
    const data = requireObject(options.data, "data");
    const renderers = options.renderers || {};
    const helpers = options.helpers || {};
    const callbacks = options.callbacks || {};

    const mindMapMode = requireObject(renderers.mindMapMode, "mindMapMode");
    const sectionById = data.sectionById || {};
    const dataSections = Array.isArray(data.sections) ? data.sections : [];
    const bigIdeaRoutes = Array.isArray(data.bigIdeaRoutes) ? data.bigIdeaRoutes : [];

    const compareRawEntriesByOfficialOrder = requireFunction(helpers, "compareRawEntriesByOfficialOrder");
    const escapeHtml = requireFunction(helpers, "escapeHtml");
    const findBigIdeaRouteIdByLabel = requireFunction(helpers, "findBigIdeaRouteIdByLabel");
    const findLearnSubjectRouteIdByLabel = requireFunction(helpers, "findLearnSubjectRouteIdByLabel");
    const getActiveSubjectCatalog = requireFunction(helpers, "getActiveSubjectCatalog");
    const getApprovedRawContentSection = requireFunction(helpers, "getApprovedRawContentSection");
    const getLensLabel = requireFunction(helpers, "getLensLabel");
    const getRawEntriesForRouteSelection = requireFunction(helpers, "getRawEntriesForRouteSelection");
    const getRawEntriesForSelection = requireFunction(helpers, "getRawEntriesForSelection");
    const getRawEntryMasteryKey = requireFunction(helpers, "getRawEntryMasteryKey");
    const getRegularGuideForSection = requireFunction(helpers, "getRegularGuideForSection");
    const getSelectedSectionIds = requireFunction(helpers, "getSelectedSectionIds");
    const getTargetLabel = requireFunction(helpers, "getTargetLabel");
    const getTargetLabelForLens = requireFunction(helpers, "getTargetLabelForLens");
    const normalizeSectionId = requireFunction(helpers, "normalizeSectionId");
    const renderAlpacaList = requireFunction(helpers, "renderAlpacaList");
    const renderLearnCardFooterNav = requireFunction(helpers, "renderLearnCardFooterNav");
    const renderPanelTitle = requireFunction(helpers, "renderPanelTitle");
    const renderRawMasteryToggle = requireFunction(helpers, "renderRawMasteryToggle");
    const renderRawMediaLightbox = requireFunction(helpers, "renderRawMediaLightbox");
    const renderRawQuizPager = requireFunction(helpers, "renderRawQuizPager");
    const renderRawStudentAssets = requireFunction(helpers, "renderRawStudentAssets");
    const renderRegularGuideDocument = requireFunction(helpers, "renderRegularGuideDocument");
    const renderRegularGuideQuestionBlock = requireFunction(helpers, "renderRegularGuideQuestionBlock");
    const renderTextWithBreaks = requireFunction(helpers, "renderTextWithBreaks");
    const usesGranularLearnSubjects = requireFunction(helpers, "usesGranularLearnSubjects");

    const renderExperienceCallback = requireFunction(callbacks, "renderExperience");
    const syncPopupScrollLock = requireFunction(callbacks, "syncPopupScrollLock");

    function buildExperience() {
      const selectedSectionIds = getSelectedSectionIds();
      const entries = getRawEntriesForSelection();
      let offset = 0;
      const maps = selectedSectionIds.length
        ? selectedSectionIds.map((sectionId) => {
            const sectionEntries = getRawEntriesForRouteSelection("section", sectionId);
            const map = buildMindMap(sectionId, sectionEntries, offset);
            offset += sectionEntries.length;
            return map;
          })
        : [buildMindMap(null, entries, 0)];

      return {
        type: "mindmap",
        title: "Idea Map",
        map: maps[0],
        maps,
        activeEntryKey: null,
        activeGuideSectionId: null
      };
    }

    function renderExperience() {
      return mindMapMode.renderExperience(state.experience, getRenderHelpers());
    }

    function renderRadialMindMap(layout) {
      return mindMapMode.renderRadialMindMap(layout, getRenderHelpers());
    }

    function buildRadialMindMapLayout(map) {
      const entries = (map.entries || []).slice();
      const entryCount = entries.length;
      const ringPlan = getMindMapRingPlan(entryCount);
      const ringCount = ringPlan.length;
      const firstEntryRadius = entryCount > 80 ? 230 : entryCount > 36 ? 220 : 190;
      const ringGap = entryCount > 80 ? 104 : 116;
      const outerRadius = firstEntryRadius + Math.max(0, ringCount - 1) * ringGap;
      const size = Math.ceil(Math.max(640, outerRadius * 2 + 250));
      const center = {
        x: Math.round(size / 2),
        y: Math.round(size / 2),
        title: map.centerTitle,
        sectionId: map.sectionId || null
      };
      const entryBubble = {
        width: entryCount > 96 ? 112 : entryCount > 64 ? 124 : entryCount > 36 ? 134 : 150,
        height: entryCount > 64 ? 54 : 60
      };
      const entryPaths = [];
      const rings = Array.from({ length: ringCount }, (_, ringIndex) => ({
        radius: Math.round(firstEntryRadius + ringIndex * ringGap),
        tone: ringIndex % 3,
        delay: ringIndex * 1.35
      }));

      const positionedEntries = entries.map((entry, entryIndex) => {
        const ring = getMindMapRingIndexForEntry(entryIndex, ringPlan);
        const ringStartIndex = ringPlan.slice(0, ring).reduce((total, count) => total + count, 0);
        const ringIndex = entryIndex - ringStartIndex;
        const ringEntryCount = ringPlan[ring] || 1;
        const offset = ringEntryCount > 1 && ring % 2 ? Math.PI / ringEntryCount : 0;
        const angle = (2 * Math.PI * ringIndex / Math.max(1, ringEntryCount)) - Math.PI / 2 + offset;
        const entryRadius = firstEntryRadius + ring * ringGap;
        const entryX = center.x + Math.cos(angle) * entryRadius;
        const entryY = center.y + Math.sin(angle) * entryRadius;
        const orbitDuration = 68 + ring * 18 + Math.min(42, entryCount * 0.24);
        const orbitDirection = ring % 2 === 0 ? 1 : -1;
        const orbitSpeed = orbitDirection * (2 * Math.PI / orbitDuration);

        entryPaths.push(getMindMapCurvePath(center.x, center.y, entryX, entryY, entryIndex));

        return {
          ...entry,
          x: Math.round(entryX),
          y: Math.round(entryY),
          orbitRadius: Math.round(entryRadius),
          orbitPhase: Number(angle.toFixed(5)),
          orbitSpeed: Number(orbitSpeed.toFixed(5)),
          orbitRing: ring,
          width: entryBubble.width,
          height: entryBubble.height
        };
      });

      return {
        size,
        kicker: "",
        title: map.centerTitle || "Mind Map",
        center,
        rings,
        entryPaths,
        entries: positionedEntries
      };
    }

    function getMindMapRingPlan(entryCount) {
      if (entryCount <= 0) {
        return [];
      }

      if (entryCount <= 3) {
        return [entryCount];
      }

      const firstRingCount = Math.floor(entryCount / 2);
      return [firstRingCount, entryCount - firstRingCount];
    }

    function getMindMapRingIndexForEntry(entryIndex, ringPlan) {
      let remainingIndex = entryIndex;

      for (let ringIndex = 0; ringIndex < ringPlan.length; ringIndex += 1) {
        const ringEntryCount = ringPlan[ringIndex] || 0;
        if (remainingIndex < ringEntryCount) {
          return ringIndex;
        }
        remainingIndex -= ringEntryCount;
      }

      return Math.max(0, ringPlan.length - 1);
    }

    function getRadialMindMapEntries(diagram) {
      const entriesByKey = new Map();

      (diagram?.groups || []).forEach((group) => {
        group.entries.forEach((entry) => {
          if (!entriesByKey.has(entry.key)) {
            entriesByKey.set(entry.key, {
              ...entry,
              lensLabels: []
            });
          }

          const item = entriesByKey.get(entry.key);
          if (group.label && !item.lensLabels.includes(group.label)) {
            item.lensLabels.push(group.label);
          }
        });
      });

      return [...entriesByKey.values()]
        .map((entry) => ({
          ...entry,
          meta: formatMindMapEntryMeta(entry.lensLabels, entry.meta)
        }))
        .sort(compareRawEntriesByOfficialOrder);
    }

    function formatMindMapEntryMeta(labels, fallback = "") {
      const uniqueLabels = [...new Set((labels || []).filter(Boolean))];
      if (!uniqueLabels.length) {
        return fallback;
      }

      if (uniqueLabels.length <= 2) {
        return uniqueLabels.join(" / ");
      }

      return `${uniqueLabels.slice(0, 2).join(" / ")} +${uniqueLabels.length - 2}`;
    }

    function getMindMapCurvePath(startX, startY, endX, endY, seed = 0) {
      const deltaX = endX - startX;
      const deltaY = endY - startY;
      const length = Math.max(1, Math.hypot(deltaX, deltaY));
      const midpointX = (startX + endX) / 2;
      const midpointY = (startY + endY) / 2;
      const bend = Math.min(72, length * 0.14) * (seed % 2 === 0 ? 1 : -1);
      const controlX = midpointX + (-deltaY / length) * bend;
      const controlY = midpointY + (deltaX / length) * bend;

      return `M ${Math.round(startX)} ${Math.round(startY)} Q ${Math.round(controlX)} ${Math.round(controlY)} ${Math.round(endX)} ${Math.round(endY)}`;
    }

    function renderEntryPopup() {
      return mindMapMode.renderEntryPopup(getRenderHelpers());
    }

    function buildMindMap(sectionId = null, providedEntries = null, entryOffset = 0) {
      const entries = Array.isArray(providedEntries) ? providedEntries : getRawEntriesForSelection();
      const section = sectionId ? sectionById[sectionId] : null;
      const centerTitle = section ? section.title : getTargetLabel();

      if (!entries.length) {
        return {
          kicker: "Route map",
          centerTitle,
          centerBody: "The imported raw entry bank is unavailable for this route, so the map is showing the overview only.",
          sectionId,
          entries: [],
          entryLookup: {}
        };
      }

      const mapEntries = entries.map((entry, index) => ({
        key: getMindMapEntryKey(entry, entryOffset + index),
        title: entry.title,
        meta: getMindMapEntryMeta(entry, state.selection.lens)
      }));

      return {
        kicker: `${getLensLabel(state.selection.lens)} focus`,
        centerTitle,
        centerBody: "",
        sectionId,
        entries: mapEntries,
        entryLookup: Object.fromEntries(entries.map((entry, index) => [getMindMapEntryKey(entry, entryOffset + index), { entry, index: entryOffset + index }]))
      };
    }

    function getMindMapEntryKey(entry, index) {
      return `${getRawEntryMasteryKey(entry)}::mindmap-${index}`;
    }

    function buildMindMapDiagram(lensId, entries) {
      const groups = new Map();

      entries.forEach((entry) => {
        getMindMapTargetsForLens(entry, lensId).forEach((target) => {
          if (!groups.has(target.id)) {
            groups.set(target.id, {
              id: target.id,
              label: target.label,
              entries: []
            });
          }

          const group = groups.get(target.id);
          const key = getRawEntryMasteryKey(entry);
          if (group.entries.some((item) => item.key === key)) {
            return;
          }

          group.entries.push({
            key,
            sectionId: entry.sectionId,
            entryIndex: entry.entryIndex,
            title: entry.title,
            meta: getMindMapEntryMeta(entry, lensId)
          });
        });
      });

      const orderedGroups = getOrderedMindMapGroups(lensId, groups);

      return {
        lensId,
        kicker: "Entry map",
        title: `By ${getMindMapLensLabel(lensId)}`,
        body: `Each clickable entry keeps its ${getMindMapLensLabel(lensId).toLowerCase()} label without adding an extra branch level.`,
        groups: orderedGroups
      };
    }

    function getMindMapTargetsForLens(entry, lensId) {
      if (lensId === "section") {
        return entry.sectionId
          ? [{
              id: entry.sectionId,
              label: entry.sectionTitle || getTargetLabelForLens("section", entry.sectionId)
            }]
          : [];
      }

      if (lensId === "subject") {
        return (entry.subjects || [])
          .map((label) => {
            const targetId = findLearnSubjectRouteIdByLabel(label);
            return targetId ? { id: targetId, label } : null;
          })
          .filter(Boolean);
      }

      return (entry.bigIdeas || [])
        .map((label) => {
          const targetId = findBigIdeaRouteIdByLabel(label);
          return targetId ? { id: targetId, label } : null;
        })
        .filter(Boolean);
    }

    function getOrderedMindMapGroups(lensId, groups) {
      const sortEntries = (items) => items.sort(compareRawEntriesByOfficialOrder);

      if (lensId === "section") {
        return dataSections
          .map((section) => section.id)
          .filter((id) => groups.has(id))
          .map((id) => {
            const group = groups.get(id);
            return {
              ...group,
              entries: sortEntries(group.entries.slice())
            };
          });
      }

      if (lensId === "subject") {
        return getActiveSubjectCatalog()
          .map((subject) => subject.id)
          .filter((id) => groups.has(id))
          .map((id) => {
            const group = groups.get(id);
            return {
              ...group,
              entries: sortEntries(group.entries.slice())
            };
          });
      }

      return bigIdeaRoutes
        .map((route) => route.id)
        .filter((id) => groups.has(id))
        .map((id) => {
          const group = groups.get(id);
          return {
            ...group,
            entries: sortEntries(group.entries.slice())
          };
        });
    }

    function getMindMapEntryMeta(entry, lensId) {
      if (lensId === "section") {
        return (entry.subjects || [])[0] || (entry.bigIdeas || [])[0] || entry.takeaway || "";
      }

      if (lensId === "subject") {
        return entry.sectionTitle || (entry.bigIdeas || [])[0] || entry.takeaway || "";
      }

      return entry.sectionTitle || (entry.subjects || [])[0] || entry.takeaway || "";
    }

    function getMindMapLensLabel(lensId) {
      if (lensId === "bigidea") {
        return "Big Ideas";
      }

      if (lensId === "subject") {
        return usesGranularLearnSubjects() ? "Study Lanes" : "Subject Routes";
      }

      return "Guiding Sections";
    }

    function getActiveEntryBundle() {
      const experience = state.experience;
      if (!experience || experience.type !== "mindmap" || !experience.activeEntryKey) {
        return null;
      }

      const maps = Array.isArray(experience.maps) && experience.maps.length
        ? experience.maps
        : [experience.map].filter(Boolean);

      for (const map of maps) {
        const bundle = map.entryLookup?.[experience.activeEntryKey];
        if (bundle) {
          return bundle;
        }
      }

      return null;
    }

    function openEntry(entryKey) {
      const experience = state.experience;
      if (!experience || experience.type !== "mindmap" || !entryKey) {
        return;
      }

      const maps = Array.isArray(experience.maps) && experience.maps.length
        ? experience.maps
        : [experience.map].filter(Boolean);
      const hasEntry = maps.some((map) => Boolean(map.entryLookup?.[entryKey]));
      if (!hasEntry) {
        return;
      }

      experience.activeEntryKey = entryKey;
      experience.activeGuideSectionId = null;
      syncPopupScrollLock();
      renderExperienceCallback();
    }

    function closeEntry() {
      const experience = state.experience;
      if (!experience || experience.type !== "mindmap" || !experience.activeEntryKey) {
        return;
      }

      state.ui.rawQuizSelections = {};
      state.ui.rawQuizPages = {};
      experience.activeEntryKey = null;
      syncPopupScrollLock();
      renderExperienceCallback();
    }

    function openGuide(sectionId) {
      const experience = state.experience;
      const normalizedSectionId = normalizeSectionId(sectionId);
      if (!experience || experience.type !== "mindmap" || !normalizedSectionId) {
        return;
      }

      experience.activeEntryKey = null;
      experience.activeGuideSectionId = normalizedSectionId;
      syncPopupScrollLock();
      renderExperienceCallback();
    }

    function closeGuide() {
      const experience = state.experience;
      if (!experience || experience.type !== "mindmap" || !experience.activeGuideSectionId) {
        return;
      }

      state.ui.rawQuizSelections = {};
      state.ui.rawQuizPages = {};
      experience.activeGuideSectionId = null;
      syncPopupScrollLock();
      renderExperienceCallback();
    }

    function renderGuidePopup() {
      return mindMapMode.renderGuidePopup(state.experience, getRenderHelpers());
    }

    function getRenderHelpers() {
      return {
        escapeHtml,
        renderPanelTitle,
        renderLearnCardFooterNav,
        renderRawMediaLightbox,
        renderRawMasteryToggle,
        renderTextWithBreaks,
        renderAlpacaList,
        renderRawStudentAssets,
        renderRawQuizPager,
        renderRegularGuideDocument,
        renderRegularGuideQuestionBlock,
        getTargetLabel,
        buildRadialMindMapLayout,
        getActiveMindMapEntryBundle: getActiveEntryBundle,
        getApprovedRawContentSection,
        getRegularGuideForSection
      };
    }

    return {
      buildExperience,
      buildMindMap,
      buildMindMapDiagram,
      buildRadialMindMapLayout,
      closeEntry,
      closeGuide,
      formatMindMapEntryMeta,
      getActiveEntryBundle,
      getMindMapCurvePath,
      getMindMapEntryKey,
      getMindMapEntryMeta,
      getMindMapLensLabel,
      getMindMapRingIndexForEntry,
      getMindMapRingPlan,
      getMindMapTargetsForLens,
      getOrderedMindMapGroups,
      getRadialMindMapEntries,
      getRenderHelpers,
      openEntry,
      openGuide,
      renderEntryPopup,
      renderExperience,
      renderGuidePopup,
      renderRadialMindMap
    };
  }

  global.WSC_CREATE_MIND_MAP_CONTROLLER = createMindMapController;
})(window);

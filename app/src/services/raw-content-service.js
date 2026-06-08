(function () {
  function createRawContentService(dependencies) {
    const rawContentSections = dependencies.rawContentSections || {};
    const sectionById = dependencies.sectionById || {};
    const subjectById = dependencies.subjectById || {};
    const bigIdeaRouteById = dependencies.bigIdeaRouteById || {};
    const learnSubjectRouteById = dependencies.learnSubjectRouteById || {};
    const normalizeKnowledgeKey = dependencies.normalizeKnowledgeKey;
    const getSectionIdFromGuidingTitle = dependencies.getSectionIdFromGuidingTitle;
    const compareOfficialSectionOrder = dependencies.compareOfficialSectionOrder;
    const compareRawEntriesByOfficialOrder = dependencies.compareRawEntriesByOfficialOrder;
    const entryMatchesLearnSubjectRoute = dependencies.entryMatchesLearnSubjectRoute;

    function getScopeLabel(selection) {
      if (selection?.lens === "subject") {
        return "Subject Route";
      }

      if (selection?.lens === "bigidea") {
        return "Big Idea Route";
      }

      return "Guiding Section";
    }

    function getApprovedSection(targetId) {
      if (!targetId || targetId === "all") {
        return null;
      }

      if (rawContentSections[targetId]) {
        return rawContentSections[targetId];
      }

      const selectedSection = sectionById[targetId];
      if (!selectedSection) {
        return null;
      }

      const normalizedTarget = normalizeKnowledgeKey(selectedSection.originalTitle);
      return Object.values(rawContentSections).find((section) => {
        return normalizeKnowledgeKey(section.guidingSection || section.title) === normalizedTarget;
      }) || null;
    }

    function getOrderedSections() {
      return Object.values(rawContentSections || {}).sort(compareOfficialSectionOrder);
    }

    function mapEntriesWithSection(section, entries) {
      const sectionId = section.id || getSectionIdFromGuidingTitle(section.guidingSection || section.title);
      const sectionLabel = sectionId && sectionById[sectionId]
        ? sectionById[sectionId].title
        : section.guidingSection || section.title;

      return entries.map((entry, index) => ({
        ...entry,
        sectionId,
        entryIndex: Number.isFinite(entry.entryIndex) ? entry.entryIndex : index + 1,
        sectionTitle: sectionLabel,
        sectionTransferTable: section.transferTable || null,
        sourceFile: section.sourceFile || section.title
      }));
    }

    function getEntriesForRouteSelection(lensId, targetId) {
      const sections = getOrderedSections();

      if (targetId === "all") {
        return sections.flatMap((section) => mapEntriesWithSection(section, section.entries || []));
      }

      if (lensId === "section") {
        const approved = getApprovedSection(targetId);
        if (!approved) {
          return [];
        }
        return mapEntriesWithSection(approved, approved.entries || []);
      }

      if (lensId === "bigidea") {
        const route = bigIdeaRouteById[targetId];
        if (!route) {
          return [];
        }

        return sections.flatMap((section) => {
          const entries = (section.entries || []).filter((entry) => (entry.bigIdeas || []).includes(route.label));
          return mapEntriesWithSection(section, entries);
        }).sort(compareRawEntriesByOfficialOrder);
      }

      if (lensId === "subject") {
        const subject = subjectById[targetId];
        if (subject) {
          const normalizedSubject = normalizeKnowledgeKey(subject.label);
          return sections.flatMap((section) => {
            const entries = (section.entries || []).filter((entry) => {
              const entrySubjects = entry.officialWscSubject ? [entry.officialWscSubject] : (entry.subjects || []);
              return entrySubjects.some((label) => normalizeKnowledgeKey(label) === normalizedSubject);
            });
            return mapEntriesWithSection(section, entries);
          }).sort(compareRawEntriesByOfficialOrder);
        }

        const route = learnSubjectRouteById[targetId];
        if (!route) {
          return [];
        }

        return sections.flatMap((section) => {
          const sectionId = section.id || getSectionIdFromGuidingTitle(section.guidingSection || section.title);
          const entries = (section.entries || []).filter((entry) => entryMatchesLearnSubjectRoute(entry, sectionId, route));
          return mapEntriesWithSection(section, entries);
        }).sort(compareRawEntriesByOfficialOrder);
      }

      return [];
    }

    function getEntriesForSelection(selection, selectedSectionIds) {
      if (selection?.lens === "section" && selectedSectionIds.length) {
        return selectedSectionIds.flatMap((sectionId) => getEntriesForRouteSelection("section", sectionId));
      }

      return getEntriesForRouteSelection(selection?.lens, selection?.targetId);
    }

    function getEntriesForCategoryIds(categoryIds, selection) {
      const seen = new Set();
      return (categoryIds || []).flatMap((categoryId) =>
        getEntriesForRouteSelection(selection?.lens, categoryId)
      ).filter((entry) => {
        const key = `${entry.sectionId || entry.guidingSection}|${entry.title}`;
        if (seen.has(key)) {
          return false;
        }
        seen.add(key);
        return true;
      });
    }

    function getPayload(selection, selectedSectionIds, title) {
      const entries = getEntriesForSelection(selection, selectedSectionIds);
      if (!entries.length) {
        return null;
      }

      return {
        scopeLabel: getScopeLabel(selection),
        title,
        entries
      };
    }

    function getEntryMasteryKey(entry) {
      return [
        entry.sectionId || getSectionIdFromGuidingTitle(entry.guidingSection || entry.sectionTitle || ""),
        entry.title || "",
        entry.sourceFile || ""
      ].map((part) => normalizeKnowledgeKey(part || "entry")).join("::");
    }

    function getAllEntries() {
      return getOrderedSections().flatMap((section) =>
        mapEntriesWithSection(section, section.entries || [])
      ).sort(compareRawEntriesByOfficialOrder);
    }

    function getTotalMasterableEntries() {
      return new Set(getAllEntries().map((entry) => getEntryMasteryKey(entry))).size;
    }

    function getMasteredEntryCount(rawMastery) {
      const validKeys = new Set(getAllEntries().map((entry) => getEntryMasteryKey(entry)));
      return Object.keys(rawMastery || {}).filter((key) => rawMastery[key] && validKeys.has(key)).length;
    }

    return Object.freeze({
      getScopeLabel,
      getApprovedSection,
      getOrderedSections,
      mapEntriesWithSection,
      getEntriesForRouteSelection,
      getEntriesForSelection,
      getEntriesForCategoryIds,
      getPayload,
      getEntryMasteryKey,
      getAllEntries,
      getTotalMasterableEntries,
      getMasteredEntryCount
    });
  }

  window.WSC_CREATE_RAW_CONTENT_SERVICE = createRawContentService;
}());

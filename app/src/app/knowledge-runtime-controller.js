(function () {
  function createKnowledgeRuntimeController(options = {}) {
    const data = options.data || { sections: [], subjects: [] };
    const knowledgeBank = options.knowledgeBank || { sections: [] };
    const sectionIdService = options.sectionIdService || {};
    const sectionById = options.sectionById || {};
    const subjectById = options.subjectById || {};
    const getAppState = options.getAppState || (() => options.appState || {});
    const constants = options.constants || {};
    const helpers = options.helpers || {};
    const getBigIdeaRoutes = options.getBigIdeaRoutes || (() => []);

    const deepStructureBigIdeas = constants.deepStructureBigIdeas || [];
    const bigIdeaRoutePresets = constants.bigIdeaRoutePresets || {};
    const learnSubjectRoutes = constants.learnSubjectRoutes || [];

    let sectionKnowledgeById = {};
    let subjectKnowledgeById = {};
    let learnSubjectKnowledgeById = {};
    let bigIdeaKnowledgeById = {};
    let wholeThemeKnowledge = null;

    function normalizeSectionId(sectionId) {
      return sectionIdService.toRuntimeId
        ? sectionIdService.toRuntimeId(sectionId)
        : String(sectionId || "").trim();
    }

    const officialSectionOrderIds = data.sections.map((section) => section.id);
    const officialSectionOrderById = Object.fromEntries(
      officialSectionOrderIds.map((sectionId, index) => [sectionId, index])
    );

    function normalizeKnowledgeKey(value) {
      return String(value || "")
        .normalize("NFKD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[’']/g, "")
        .replace(/&/g, "and")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, " ")
        .trim();
    }

    function getSectionIdFromGuidingTitle(title) {
      const normalizedTitle = normalizeKnowledgeKey(title);
      const matchingSection = data.sections.find((section) => normalizeKnowledgeKey(section.originalTitle) === normalizedTitle);
      return matchingSection ? matchingSection.id : null;
    }

    // The WSC site sequence is the source of truth. Raw imports may arrive alphabetized.
    function getOfficialSectionOrder(sectionOrId) {
      const sectionId = typeof sectionOrId === "string"
        ? normalizeSectionId(sectionOrId)
        : normalizeSectionId(
            sectionOrId?.sectionId ||
            sectionOrId?.id ||
            getSectionIdFromGuidingTitle(sectionOrId?.guidingSection || sectionOrId?.sectionTitle || sectionOrId?.title || "")
          );

      return Number.isInteger(officialSectionOrderById[sectionId])
        ? officialSectionOrderById[sectionId]
        : Number.MAX_SAFE_INTEGER;
    }

    function compareOfficialSectionOrder(left, right) {
      const orderDelta = getOfficialSectionOrder(left) - getOfficialSectionOrder(right);
      if (orderDelta !== 0) {
        return orderDelta;
      }

      const leftLabel = left?.sectionTitle || left?.guidingSection || left?.title || "";
      const rightLabel = right?.sectionTitle || right?.guidingSection || right?.title || "";
      return leftLabel.localeCompare(rightLabel);
    }

    function compareRawEntriesByOfficialOrder(left, right) {
      const sectionDelta = compareOfficialSectionOrder(left, right);
      if (sectionDelta !== 0) {
        return sectionDelta;
      }

      const leftIndex = Number.isFinite(left?.entryIndex) ? left.entryIndex : Number.MAX_SAFE_INTEGER;
      const rightIndex = Number.isFinite(right?.entryIndex) ? right.entryIndex : Number.MAX_SAFE_INTEGER;
      if (leftIndex !== rightIndex) {
        return leftIndex - rightIndex;
      }

      return String(left?.title || "").localeCompare(String(right?.title || ""));
    }

    function slugifyBigIdea(label) {
      return normalizeKnowledgeKey(label).replace(/\s+/g, "-");
    }

    function buildBigIdeaRoutes(rawSections) {
      const counts = new Map();

      Object.values(rawSections || {}).forEach((section) => {
        (section.entries || []).forEach((entry) => {
          (entry.bigIdeas || []).forEach((bigIdea) => {
            counts.set(bigIdea, (counts.get(bigIdea) || 0) + 1);
          });
        });
      });

      const orderedLabels = [
        ...deepStructureBigIdeas.filter((label) => counts.has(label)),
        ...Array.from(counts.keys())
          .filter((label) => !deepStructureBigIdeas.includes(label))
          .sort((left, right) => (counts.get(right) || 0) - (counts.get(left) || 0) || left.localeCompare(right))
      ];

      return orderedLabels
        .map((label) => {
          const id = slugifyBigIdea(label);
          const preset = bigIdeaRoutePresets[id] || {};
          return {
            id,
            label,
            description: preset.description || `${label} as a route through the 2026 theme.`,
            mood: preset.mood || "wise"
          };
        });
    }

    function countKnowledgeItems(atoms) {
      return atoms.reduce(
        (sum, atom) =>
          sum +
          atom.mustKnowPoints.length +
          atom.examples.length +
          atom.debateAngles.length +
          atom.keywords.length,
        0
      );
    }

    function normalizeBankSection(bankSection, sectionId) {
      const mappedSection = sectionById[sectionId];
      const atoms = (bankSection.content_atoms || []).map((atom, index) => ({
        id: `${sectionId}-atom-${index + 1}`,
        sectionId,
        sectionTitle: mappedSection.title,
        sectionOriginalTitle: mappedSection.originalTitle,
        subtopic: atom.subtopic,
        coreIdea: atom.core_idea,
        mustKnowPoints: atom.must_know_points || [],
        examples: atom.examples || [],
        debateAngles: atom.debate_angles || [],
        keywords: atom.keywords || [],
        possibleQuestionTypes: atom.possible_question_types || [],
        goodForModes: atom.good_for_modes || [],
        difficulty: atom.difficulty || "mixed"
      }));

      return {
        type: "section",
        sectionId,
        title: mappedSection.title,
        originalTitle: mappedSection.originalTitle,
        summary: bankSection.section_summary,
        officialSubjects: bankSection.official_subjects || [],
        overlayCategories: bankSection.overlay_categories || [],
        atoms,
        questionCount: helpers.countRawQuizQuestions(helpers.getRawEntriesForRouteSelection("section", sectionId)),
        knowledgeItemCount: countKnowledgeItems(atoms)
      };
    }

    function buildSubjectKnowledge(subjectId) {
      const subject = subjectById[subjectId];
      const normalizedSubject = normalizeKnowledgeKey(subject.label);
      const sections = data.sections
        .map((section) => sectionKnowledgeById[section.id])
        .filter(Boolean)
        .filter((section) => section.officialSubjects.some((label) => normalizeKnowledgeKey(label) === normalizedSubject));

      const atoms = sections.flatMap((section) =>
        section.atoms.map((atom) => ({
          ...atom,
          sourceSectionTitle: section.title,
          sourceSectionOriginalTitle: section.originalTitle,
          sourceSectionSummary: section.summary
        }))
      );

      return {
        type: "subject",
        subjectId,
        label: subject.label,
        description: subject.description,
        sections,
        atoms,
        questionCount: helpers.getQuestionsForRouteSelection("subject", subjectId).length,
        knowledgeItemCount: countKnowledgeItems(atoms)
      };
    }

    function atomMatchesLearnSubjectRoute(atom, section, route) {
      const haystack = normalizeKnowledgeKey(
        [
          atom.subtopic,
          atom.coreIdea,
          atom.mustKnowPoints.join(" "),
          atom.examples.join(" "),
          atom.debateAngles.join(" "),
          atom.keywords.join(" "),
          section.title,
          section.originalTitle,
          section.summary,
          section.officialSubjects.join(" "),
          section.overlayCategories.join(" ")
        ].join(" ")
      );

      const keywordMatch = (route.keywords || []).some((keyword) => haystack.includes(normalizeKnowledgeKey(keyword)));
      const overlayMatch = (route.overlayCategories || []).some((category) =>
        section.overlayCategories.some((label) => normalizeKnowledgeKey(label) === normalizeKnowledgeKey(category))
      );

      return keywordMatch || overlayMatch;
    }

    function entryMatchesLearnSubjectRoute(entry, sectionId, route) {
      const knowledgeSection = sectionId ? sectionKnowledgeById[sectionId] : null;
      const haystack = normalizeKnowledgeKey(
        [
          entry.title,
          entry.rawOfficialText,
          entry.studentExplanation,
          entry.whyItMatters,
          entry.takeaway,
          (entry.examples || []).join(" "),
          (entry.subjects || []).join(" "),
          (entry.bigIdeas || []).join(" "),
          knowledgeSection ? knowledgeSection.title : "",
          knowledgeSection ? knowledgeSection.originalTitle : "",
          knowledgeSection ? knowledgeSection.summary : "",
          knowledgeSection ? knowledgeSection.officialSubjects.join(" ") : "",
          knowledgeSection ? knowledgeSection.overlayCategories.join(" ") : ""
        ].join(" ")
      );

      const keywordMatch = (route.keywords || []).some((keyword) => haystack.includes(normalizeKnowledgeKey(keyword)));
      const overlayMatch = (route.overlayCategories || []).some((category) =>
        knowledgeSection && knowledgeSection.overlayCategories.some((label) => normalizeKnowledgeKey(label) === normalizeKnowledgeKey(category))
      );

      return keywordMatch || overlayMatch;
    }

    function buildLearnSubjectRouteKnowledge(route) {
      const sections = data.sections
        .map((section) => sectionKnowledgeById[section.id])
        .filter(Boolean)
        .map((section) => {
          const matchedAtoms = section.atoms.filter((atom) => atomMatchesLearnSubjectRoute(atom, section, route));
          if (!matchedAtoms.length) {
            return null;
          }

          return {
            ...section,
            atoms: matchedAtoms
          };
        })
        .filter(Boolean);

      const atoms = sections.flatMap((section) =>
        section.atoms.map((atom) => ({
          ...atom,
          sourceSectionTitle: section.title,
          sourceSectionOriginalTitle: section.originalTitle,
          sourceSectionSummary: section.summary
        }))
      );

      const matchedSectionIds = new Set(sections.map((section) => section.sectionId));
      const questionCount = helpers.countRawQuizQuestions(
        helpers.getOrderedRawContentSections().flatMap((rawSection) => {
          const sectionId = rawSection.id || getSectionIdFromGuidingTitle(rawSection.guidingSection || rawSection.title);
          if (!matchedSectionIds.has(sectionId)) {
            return [];
          }
          const entries = (rawSection.entries || []).filter((entry) => entryMatchesLearnSubjectRoute(entry, sectionId, route));
          return helpers.mapRawEntriesWithSection(rawSection, entries);
        })
      );

      return {
        type: "subject",
        subjectId: route.id,
        label: route.label,
        description: route.description,
        sections,
        atoms,
        questionCount,
        knowledgeItemCount: countKnowledgeItems(atoms)
      };
    }

    function buildBigIdeaKnowledge(route) {
      const matchingEntries = [];
      const sectionMap = new Map();

      helpers.getOrderedRawContentSections().forEach((rawSection) => {
        const matching = (rawSection.entries || []).filter((entry) => (entry.bigIdeas || []).includes(route.label));
        if (!matching.length) {
          return;
        }

        const sectionId = rawSection.id || getSectionIdFromGuidingTitle(rawSection.guidingSection || rawSection.title);
        const sectionRecord = sectionId ? sectionById[sectionId] : null;
        const knowledgeSection = sectionId ? sectionKnowledgeById[sectionId] : null;

        if (sectionId && !sectionMap.has(sectionId)) {
          sectionMap.set(sectionId, {
            sectionId,
            title: sectionRecord ? sectionRecord.title : rawSection.guidingSection || rawSection.title,
            originalTitle: sectionRecord ? sectionRecord.originalTitle : rawSection.guidingSection || rawSection.title,
            summary: knowledgeSection ? knowledgeSection.summary : "",
            entryCount: matching.length
          });
        }

        matching.forEach((entry) => {
          matchingEntries.push({
            ...entry,
            sectionId,
            sectionTitle: sectionRecord ? sectionRecord.title : rawSection.guidingSection || rawSection.title,
            sectionOriginalTitle: sectionRecord ? sectionRecord.originalTitle : rawSection.guidingSection || rawSection.title,
            sourceFile: rawSection.sourceFile || rawSection.title
          });
        });
      });

      const sections = Array.from(sectionMap.values()).sort(compareOfficialSectionOrder);
      matchingEntries.sort(compareRawEntriesByOfficialOrder);
      const questionCount = helpers.countRawQuizQuestions(matchingEntries);
      const knowledgeItemCount = matchingEntries.reduce((sum, entry) => {
        return sum + 1 + (entry.examples || []).length + (entry.subjects || []).length + (entry.bigIdeas || []).length;
      }, 0);

      return {
        type: "bigidea",
        bigIdeaId: route.id,
        label: route.label,
        description: route.description,
        sections,
        entries: matchingEntries,
        questionCount,
        knowledgeItemCount
      };
    }

    function buildWholeThemeKnowledge() {
      const sections = data.sections.map((section) => sectionKnowledgeById[section.id]).filter(Boolean);
      const atoms = sections.flatMap((section) =>
        section.atoms.map((atom) => ({
          ...atom,
          sourceSectionTitle: section.title,
          sourceSectionOriginalTitle: section.originalTitle,
          sourceSectionSummary: section.summary
        }))
      );

      return {
        type: "whole-theme",
        sections,
        atoms,
        questionCount: helpers.countRawQuizQuestions(helpers.getRawEntriesForRouteSelection(null, "all")),
        knowledgeItemCount: countKnowledgeItems(atoms)
      };
    }

    function hydrateKnowledgeBank() {
      const sections = Array.isArray(knowledgeBank.sections) ? knowledgeBank.sections : [];
      sectionKnowledgeById = {};

      sections.forEach((bankSection) => {
        const sectionId = getSectionIdFromGuidingTitle(bankSection.guiding_section);
        if (!sectionId) {
          return;
        }
        sectionKnowledgeById[sectionId] = normalizeBankSection(bankSection, sectionId);
      });

      subjectKnowledgeById = Object.fromEntries(
        data.subjects.map((subject) => [subject.id, buildSubjectKnowledge(subject.id)])
      );
      learnSubjectKnowledgeById = Object.fromEntries(
        learnSubjectRoutes.map((route) => [route.id, buildLearnSubjectRouteKnowledge(route)])
      );
      bigIdeaKnowledgeById = Object.fromEntries(
        getBigIdeaRoutes().map((route) => [route.id, buildBigIdeaKnowledge(route)])
      );
      wholeThemeKnowledge = buildWholeThemeKnowledge();
    }

    function getKnowledgeContext() {
      if (!knowledgeBank.sections || !knowledgeBank.sections.length) {
        return null;
      }

      const appState = getAppState() || {};
      const selection = appState.selection || {};

      if (selection.targetId === "all") {
        return wholeThemeKnowledge;
      }

      if (selection.lens === "subject") {
        return helpers.getActiveSubjectKnowledgeMap()[selection.targetId] || null;
      }

      if (selection.lens === "bigidea") {
        return bigIdeaKnowledgeById[selection.targetId] || null;
      }

      return sectionKnowledgeById[selection.targetId] || null;
    }

    return {
      normalizeSectionId,
      getOfficialSectionOrder,
      compareOfficialSectionOrder,
      compareRawEntriesByOfficialOrder,
      normalizeKnowledgeKey,
      slugifyBigIdea,
      buildBigIdeaRoutes,
      getSectionIdFromGuidingTitle,
      normalizeBankSection,
      buildSubjectKnowledge,
      buildLearnSubjectRouteKnowledge,
      buildBigIdeaKnowledge,
      atomMatchesLearnSubjectRoute,
      entryMatchesLearnSubjectRoute,
      buildWholeThemeKnowledge,
      hydrateKnowledgeBank,
      getKnowledgeContext,
      countKnowledgeItems,
      getSectionKnowledgeById: () => sectionKnowledgeById,
      getSubjectKnowledgeById: () => subjectKnowledgeById,
      getLearnSubjectKnowledgeById: () => learnSubjectKnowledgeById,
      getBigIdeaKnowledgeById: () => bigIdeaKnowledgeById,
      getWholeThemeKnowledge: () => wholeThemeKnowledge
    };
  }

  window.WSC_CREATE_KNOWLEDGE_RUNTIME_CONTROLLER = createKnowledgeRuntimeController;
}());

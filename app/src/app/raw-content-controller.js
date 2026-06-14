(function initRawContentController(global) {
  "use strict";

  function requiredFunction(collection, name) {
    const value = collection ? collection[name] : null;
    if (typeof value !== "function") {
      throw new Error("WSC raw content controller missing function dependency: " + name);
    }
    return value;
  }

  function createRawContentController(options = {}) {
    const {
      appState: state,
      refs = {},
      documentRef = global.document,
      windowRef = global,
      services = {},
      renderers = {},
      data = {},
      helpers = {},
      callbacks = {}
    } = options;

    if (!state) {
      throw new Error("WSC raw content controller missing app state.");
    }

    const document = documentRef;
    const window = windowRef;
    const rawContentService = services.rawContentService || null;
    const appVideoService = services.appVideoService || null;
    const rawContentMode = renderers.rawContentMode || null;
    const rawContentEntryRenderer = renderers.rawContentEntryRenderer || null;
    const rawContentQuizRenderer = renderers.rawContentQuizRenderer || null;
    const rawContentMediaLightbox = renderers.rawContentMediaLightbox || null;
    const rawContentVisualAssets = renderers.rawContentVisualAssets || null;
    const rawContentTransferTable = renderers.rawContentTransferTable || null;
    const rawContentMastery = renderers.rawContentMastery || null;
    const IMPORTED_RAW_CONTENT_BANK = data.IMPORTED_RAW_CONTENT_BANK || {};
    const sectionById = data.sectionById || {};
    const subjectById = data.subjectById || {};
    const bigIdeaRouteById = data.bigIdeaRouteById || {};
    const learnSubjectRouteById = data.learnSubjectRouteById || {};
    const BIG_IDEA_ROUTES = data.BIG_IDEA_ROUTES || [];
    const LEARN_SUBJECT_ROUTES = data.LEARN_SUBJECT_ROUTES || [];

    const escapeHtml = requiredFunction(helpers, "escapeHtml");
    const compareOfficialSectionOrder = requiredFunction(helpers, "compareOfficialSectionOrder");
    const compareRawEntriesByOfficialOrder = requiredFunction(helpers, "compareRawEntriesByOfficialOrder");
    const entryMatchesLearnSubjectRoute = requiredFunction(helpers, "entryMatchesLearnSubjectRoute");
    const getAlpacaChannelVideosForEntry = requiredFunction(helpers, "getAlpacaChannelVideosForEntry");
    const getAssetValue = requiredFunction(helpers, "getAssetValue");
    const getModeAssetPath = requiredFunction(helpers, "getModeAssetPath");
    const getSectionIdFromGuidingTitle = requiredFunction(helpers, "getSectionIdFromGuidingTitle");
    const getSelectedSectionIds = requiredFunction(helpers, "getSelectedSectionIds");
    const getTargetLabel = requiredFunction(helpers, "getTargetLabel");
    const getTargetLabelForLens = requiredFunction(helpers, "getTargetLabelForLens");
    const normalizeKnowledgeKey = requiredFunction(helpers, "normalizeKnowledgeKey");
    const renderAlpacaList = requiredFunction(helpers, "renderAlpacaList");
    const renderLearnCardFooterNav = requiredFunction(helpers, "renderLearnCardFooterNav");
    const renderOptionToken = requiredFunction(helpers, "renderOptionToken");
    const renderPanelTitle = requiredFunction(helpers, "renderPanelTitle");
    const usesGranularLearnSubjects = requiredFunction(helpers, "usesGranularLearnSubjects");
    const fallbackGetEmbeddableVideo = requiredFunction(helpers, "getEmbeddableVideo");
    const fallbackGetVideoPreview = requiredFunction(helpers, "getVideoPreview");

    const renderExperience = requiredFunction(callbacks, "renderExperience");
    const renderStats = requiredFunction(callbacks, "renderStats");
    const saveRawMastery = requiredFunction(callbacks, "saveRawMastery");
    const syncPopupScrollLock = requiredFunction(callbacks, "syncPopupScrollLock");

    function getApprovedRawContentSection(targetId = state.selection.targetId) {
      if (rawContentService?.getApprovedSection) {
        return rawContentService.getApprovedSection(targetId);
      }

      if (!targetId || targetId === "all") {
        return null;
      }

      if (IMPORTED_RAW_CONTENT_BANK[targetId]) {
        return IMPORTED_RAW_CONTENT_BANK[targetId];
      }

      const selectedSection = sectionById[targetId];
      if (!selectedSection) {
        return null;
      }

      const normalizedTarget = normalizeKnowledgeKey(selectedSection.originalTitle);
      return Object.values(IMPORTED_RAW_CONTENT_BANK).find((section) => {
        return normalizeKnowledgeKey(section.guidingSection || section.title) === normalizedTarget;
      }) || null;
    }

    function getRawVisibleQuizQuestionItems(entry) {
      return (entry.quizQuestions || [])
        .map((question, questionIndex) => ({ question, questionIndex }))
        .filter(({ question }) => [1, 2].includes(Number(question.level)));
    }

    function renderSectionTransferTable(sectionOrEntry, options = {}) {
      return rawContentTransferTable?.renderSectionTransferTable
        ? rawContentTransferTable.renderSectionTransferTable(sectionOrEntry, options, { escapeHtml })
        : "";
    }

    function getVisibleWrongExplanation(question, selectedOption) {
      if (!question || !selectedOption || selectedOption.correct) {
        return "";
      }

      const selectedKey = normalizeKnowledgeKey(selectedOption.text);
      const visibleWrongExplanations = Array.isArray(question.visibleWrongExplanations)
        ? question.visibleWrongExplanations
        : [];
      const matchingExplanation = visibleWrongExplanations.find((item) => (
        normalizeKnowledgeKey(item.answer) === selectedKey
        || normalizeKnowledgeKey(item.text) === selectedKey
      ));

      return matchingExplanation?.explanation || "";
    }

    function getVisibleQuizFeedbackParts(question, selectedOption) {
      if (!question || !selectedOption) {
        return null;
      }

      const wrongExplanation = getVisibleWrongExplanation(question, selectedOption);
      const correctExplanation = question.visibleCorrectExplanation || question.explanation || "";
      const paragraphs = [];

      if (!selectedOption.correct && wrongExplanation) {
        paragraphs.push(wrongExplanation);
      }

      if (question.visibleConnection) {
        paragraphs.push(question.visibleConnection);
      }

      if (correctExplanation && (selectedOption.correct || correctExplanation !== wrongExplanation)) {
        paragraphs.push(correctExplanation);
      }

      if (!paragraphs.length && question.explanation) {
        paragraphs.push(question.explanation);
      }

      return {
        heading: selectedOption.correct ? "Exactly" : "Not quite",
        paragraphs,
        takeaway: question.visibleTakeaway || ""
      };
    }

    function renderRawQuizFeedback(question, selectedOption) {
      const feedback = getVisibleQuizFeedbackParts(question, selectedOption);
      if (!feedback || (!feedback.paragraphs.length && !feedback.takeaway)) {
        return "";
      }

      return `
        <div class="raw-quiz-feedback ${selectedOption.correct ? "correct" : "incorrect"}">
          <strong>${feedback.heading}</strong>
          ${feedback.paragraphs.map((paragraph) => `<p>${renderTextWithBreaks(paragraph)}</p>`).join("")}
          ${feedback.takeaway ? `<p class="raw-quiz-takeaway"><span>Takeaway:</span> ${renderTextWithBreaks(feedback.takeaway)}</p>` : ""}
        </div>
      `;
    }

    function renderRawContentExperience() {
      const payload = getRawContentPayload();
      if (rawContentMode?.renderExperience) {
        return rawContentMode.renderExperience({
          experience: state.experience,
          payload,
          scopeLabel: getRawContentScopeLabel(),
          targetLabel: getTargetLabel()
        }, {
          escapeHtml,
          renderPanelTitle,
          renderEntryGroups: renderRawContentEntryGroups,
          renderMediaLightbox: renderRawMediaLightbox,
          renderLearnCardFooterNav
        });
      }

      if (!payload) {
        return `
          ${renderPanelTitle(
            "Raw Content",
            "",
            ""
          )}
          <div class="raw-content-shell">
            <article class="raw-source-card">
              <div class="raw-source-top">
                <div>
                  <p class="challenge-label">${escapeHtml(getRawContentScopeLabel())}</p>
                  <h3>${escapeHtml(getTargetLabel())}</h3>
                </div>
              </div>
              <p>Waiting for updates until you receive the ones.</p>
              <div class="chip-row">
                <span>${escapeHtml(getTargetLabel())}</span>
                <span>Raw Content update pending</span>
              </div>
            </article>
          </div>
        `;
      }

      return `
        ${renderPanelTitle(
          "Raw Content",
          "",
          `${payload.entries.length} raw entries`
        )}
        <div class="raw-content-shell">
          ${renderRawContentEntryGroups(payload.entries)}
          ${renderRawMediaLightbox()}
        </div>
        ${renderLearnCardFooterNav("rawcontent")}
      `;
    }

    function renderRawContentEntryGroups(entries) {
      const selectedSectionIds = getSelectedSectionIds();
      if (rawContentMode?.renderEntryGroups) {
        return rawContentMode.renderEntryGroups(entries, {
          selectedSectionIds,
          sectionById
        }, {
          escapeHtml,
          getSectionIdFromGuidingTitle,
          renderEntryCard: renderRawContentEntryCard
        });
      }

      if (selectedSectionIds.length <= 1) {
        return entries.map((entry, entryIndex) => renderRawContentEntryCard(entry, entryIndex)).join("");
      }

      const entriesBySection = new Map();
      entries.forEach((entry, entryIndex) => {
        const sectionId = entry.sectionId || getSectionIdFromGuidingTitle(entry.guidingSection || entry.sectionTitle || "");
        if (!entriesBySection.has(sectionId)) {
          entriesBySection.set(sectionId, []);
        }
        entriesBySection.get(sectionId).push({ entry, entryIndex });
      });

      return selectedSectionIds.map((sectionId) => {
        const sectionEntries = entriesBySection.get(sectionId) || [];
        if (!sectionEntries.length) {
          return "";
        }

        return `
          <article class="raw-source-card raw-section-group-card">
            <div class="raw-source-top raw-section-group-top">
              <div>
                <h3>${escapeHtml(sectionById[sectionId]?.title || sectionEntries[0].entry.sectionTitle || sectionId)}</h3>
              </div>
            </div>
            <div class="raw-section-entry-list">
              ${sectionEntries.map(({ entry, entryIndex }) => renderRawContentEntryCard(entry, entryIndex)).join("")}
            </div>
          </article>
        `;
      }).join("");
    }

    function renderRawContentEntryCard(entry, entryIndex) {
      if (rawContentEntryRenderer?.renderEntryCard) {
        return rawContentEntryRenderer.renderEntryCard(entry, entryIndex, {
          escapeHtml,
          renderTextWithBreaks,
          renderAlpacaList,
          renderRawStudentAssets,
          renderRawConnectionGroups,
          renderSectionTransferTable,
          renderRawQuizPager,
          renderRawMasteryToggle,
          getRawOfficialDisplayText
        });
      }

      const rawOfficialText = getRawOfficialDisplayText(entry);

      return `
        <article class="raw-atom-card raw-entry-card">
          <div class="raw-atom-top">
            <div>
              <h3>${escapeHtml(entry.title)}</h3>
            </div>
            ${entry.links && entry.links.length ? `
              <div class="raw-link-list raw-link-list-inline">
                ${entry.links.map((link) => `
                  <a class="raw-link-pill raw-link-pill-inline" href="${escapeHtml(link.url)}" target="_blank" rel="noreferrer">
                    ${escapeHtml(link.label || link.url)}
                  </a>
                `).join("")}
              </div>
            ` : ""}
          </div>
          ${(rawOfficialText || (entry.rawOfficialBullets && entry.rawOfficialBullets.length)) ? `
            <div class="raw-block">
              <strong>Raw official text</strong>
              ${rawOfficialText ? `<p>${renderTextWithBreaks(rawOfficialText)}</p>` : ""}
              ${entry.rawOfficialBullets && entry.rawOfficialBullets.length
                ? renderAlpacaList(entry.rawOfficialBullets)
                : ""}
            </div>
          ` : ""}
          ${entry.studentExplanation ? `
            <div class="raw-block">
              <strong>Student explanation</strong>
              <p>${renderTextWithBreaks(entry.studentExplanation)}</p>
              ${renderRawStudentAssets(entry, entryIndex)}
            </div>
          ` : ""}
          ${entry.whyItMatters ? `
            <div class="raw-block">
              <strong>Why it matters</strong>
              <p>${renderTextWithBreaks(entry.whyItMatters)}</p>
            </div>
          ` : ""}
          ${renderRawConnectionGroups(entry)}
          ${renderSectionTransferTable(entry, { collapsed: true, context: "raw" })}
          ${renderRawQuizPager(entry, entryIndex)}
          ${renderRawMasteryToggle(entry, { includeBackToTop: true, entryIndex })}
        </article>
      `;
    }

    function getRawContentScopeLabel() {
      if (rawContentService?.getScopeLabel) {
        return rawContentService.getScopeLabel(state.selection);
      }

      if (state.selection.lens === "subject") {
        return "Subject Route";
      }

      if (state.selection.lens === "bigidea") {
        return "Big Idea Route";
      }

      return "Guiding Section";
    }

    function getRawContentPayload() {
      if (rawContentService?.getPayload) {
        return rawContentService.getPayload(state.selection, getSelectedSectionIds(), getTargetLabel());
      }

      const entries = getRawEntriesForSelection();
      if (!entries.length) {
        return null;
      }

      return {
        scopeLabel: getRawContentScopeLabel(),
        title: getTargetLabel(),
        entries
      };
    }

    function getRawEntriesForSelection() {
      const selectedSectionIds = getSelectedSectionIds();
      if (rawContentService?.getEntriesForSelection) {
        return rawContentService.getEntriesForSelection(state.selection, selectedSectionIds);
      }

      if (state.selection.lens === "section" && selectedSectionIds.length) {
        return selectedSectionIds.flatMap((sectionId) => getRawEntriesForRouteSelection("section", sectionId));
      }

      return getRawEntriesForRouteSelection(state.selection.lens, state.selection.targetId);
    }

    function getRawEntriesForRouteSelection(lensId, targetId) {
      if (rawContentService?.getEntriesForRouteSelection) {
        return rawContentService.getEntriesForRouteSelection(lensId, targetId);
      }

      const sections = getOrderedRawContentSections();

      if (targetId === "all") {
        return sections.flatMap((section) => mapRawEntriesWithSection(section, section.entries || []));
      }

      if (lensId === "section") {
        const approved = getApprovedRawContentSection(targetId);
        if (!approved) {
          return [];
        }
        return mapRawEntriesWithSection(approved, approved.entries || []);
      }

      if (lensId === "bigidea") {
        const route = bigIdeaRouteById[targetId];
        if (!route) {
          return [];
        }

        return sections.flatMap((section) => {
          const entries = (section.entries || []).filter((entry) => (entry.bigIdeas || []).includes(route.label));
          return mapRawEntriesWithSection(section, entries);
        }).sort(compareRawEntriesByOfficialOrder);
      }

      if (lensId === "subject") {
        if (usesGranularLearnSubjects()) {
          const route = learnSubjectRouteById[targetId];
          if (!route) {
            return [];
          }

          return sections.flatMap((section) => {
            const sectionId = section.id || getSectionIdFromGuidingTitle(section.guidingSection || section.title);
            const entries = (section.entries || []).filter((entry) => entryMatchesLearnSubjectRoute(entry, sectionId, route));
            return mapRawEntriesWithSection(section, entries);
          }).sort(compareRawEntriesByOfficialOrder);
        }

        const subject = subjectById[targetId];
        if (!subject) {
          return [];
        }

        const normalizedSubject = normalizeKnowledgeKey(subject.label);
        return sections.flatMap((section) => {
          const entries = (section.entries || []).filter((entry) => {
            const entrySubjects = entry.officialWscSubject ? [entry.officialWscSubject] : (entry.subjects || []);
            return entrySubjects.some((label) => normalizeKnowledgeKey(label) === normalizedSubject);
          });
          return mapRawEntriesWithSection(section, entries);
        }).sort(compareRawEntriesByOfficialOrder);
      }

      return [];
    }

    function getRawEntriesForRunSetupCategoryIds(categoryIds) {
      if (rawContentService?.getEntriesForCategoryIds) {
        return rawContentService.getEntriesForCategoryIds(categoryIds, state.selection);
      }

      const seen = new Set();
      return (categoryIds || []).flatMap((categoryId) =>
        getRawEntriesForRouteSelection(state.selection.lens, categoryId)
      ).filter((entry) => {
        const key = `${entry.sectionId || entry.guidingSection}|${entry.title}`;
        if (seen.has(key)) {
          return false;
        }
        seen.add(key);
        return true;
      });
    }

    function countRawQuizQuestions(entries) {
      return (entries || []).reduce((sum, entry) => {
        return sum + (Array.isArray(entry.quizQuestions) ? entry.quizQuestions.length : 0);
      }, 0);
    }

    function getOrderedRawContentSections() {
      if (rawContentService?.getOrderedSections) {
        return rawContentService.getOrderedSections();
      }

      return Object.values(IMPORTED_RAW_CONTENT_BANK || {}).sort(compareOfficialSectionOrder);
    }

    function mapRawEntriesWithSection(section, entries) {
      if (rawContentService?.mapEntriesWithSection) {
        return rawContentService.mapEntriesWithSection(section, entries);
      }

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

    function getRawEntryMasteryKey(entry) {
      if (rawContentService?.getEntryMasteryKey) {
        return rawContentService.getEntryMasteryKey(entry);
      }

      return [
        entry.sectionId || getSectionIdFromGuidingTitle(entry.guidingSection || entry.sectionTitle || ""),
        entry.title || "",
        entry.sourceFile || ""
      ].map((part) => normalizeKnowledgeKey(part || "entry")).join("::");
    }

    function isRawEntryMastered(entry) {
      return Boolean(state.rawMastery[getRawEntryMasteryKey(entry)]);
    }

    function getRawMasteryHelpers() {
      return {
        escapeHtml,
        getEntryMasteryKey: getRawEntryMasteryKey,
        isEntryMastered: isRawEntryMastered,
        getAssetValue,
        getModeAssetPath,
        getAlpacaChannelVideosForEntry
      };
    }

    function renderRawMasteryToggle(entry, options = {}) {
      return rawContentMastery?.renderToggle
        ? rawContentMastery.renderToggle(entry, options, getRawMasteryHelpers())
        : "";
    }

    function renderRawEntryQuickActions(entry, entryIndex) {
      return rawContentMastery?.renderQuickActions
        ? rawContentMastery.renderQuickActions(entry, entryIndex, getRawMasteryHelpers())
        : "";
    }

    function renderRawBackToTopButton() {
      return rawContentMastery?.renderBackToTopButton
        ? rawContentMastery.renderBackToTopButton(getRawMasteryHelpers())
        : "";
    }

    function renderRawEntryChannelLinks(entry, entryIndex) {
      return rawContentMastery?.renderEntryChannelLinks
        ? rawContentMastery.renderEntryChannelLinks(entry, entryIndex, getRawMasteryHelpers())
        : "";
    }

    function toggleRawMastery(key) {
      if (!key) {
        return;
      }

      state.rawMastery = {
        ...state.rawMastery,
        [key]: !state.rawMastery[key]
      };

      if (!state.rawMastery[key]) {
        delete state.rawMastery[key];
      }

      saveRawMastery();
      renderStats();
      renderExperience();
    }

    function getAllRawEntries() {
      if (rawContentService?.getAllEntries) {
        return rawContentService.getAllEntries();
      }

      return getOrderedRawContentSections().flatMap((section) =>
        mapRawEntriesWithSection(section, section.entries || [])
      ).sort(compareRawEntriesByOfficialOrder);
    }

    function getTotalRawMasterableEntries() {
      if (rawContentService?.getTotalMasterableEntries) {
        return rawContentService.getTotalMasterableEntries();
      }

      return new Set(getAllRawEntries().map((entry) => getRawEntryMasteryKey(entry))).size;
    }

    function getMasteredRawEntryCount() {
      if (rawContentService?.getMasteredEntryCount) {
        return rawContentService.getMasteredEntryCount(state.rawMastery);
      }

      const validKeys = new Set(getAllRawEntries().map((entry) => getRawEntryMasteryKey(entry)));
      return Object.keys(state.rawMastery).filter((key) => state.rawMastery[key] && validKeys.has(key)).length;
    }

    function findLearnSubjectRouteIdByLabel(label) {
      const normalized = normalizeKnowledgeKey(label);
      const route = LEARN_SUBJECT_ROUTES.find((item) => normalizeKnowledgeKey(item.label) === normalized);
      return route ? route.id : null;
    }

    function findBigIdeaRouteIdByLabel(label) {
      const normalized = normalizeKnowledgeKey(label);
      const route = BIG_IDEA_ROUTES.find((item) => normalizeKnowledgeKey(item.label) === normalized);
      return route ? route.id : null;
    }

    function getRawConnectionGroups(entry) {
      const groups = [];

      if (state.selection.lens !== "section" && entry.sectionId) {
        groups.push({
          label: "Guiding Section",
          items: [
            {
              lens: "section",
              targetId: entry.sectionId,
              label: entry.sectionTitle || getTargetLabelForLens("section", entry.sectionId)
            }
          ]
        });
      }

      if (state.selection.lens !== "subject" && entry.subjects && entry.subjects.length) {
        const subjectItems = entry.subjects
          .map((label) => {
            const targetId = findLearnSubjectRouteIdByLabel(label);
            return targetId ? { lens: "subject", targetId, label } : null;
          })
          .filter(Boolean);

        if (subjectItems.length) {
          groups.push({
            label: "Subjects",
            items: subjectItems
          });
        }
      }

      if (state.selection.lens !== "bigidea" && entry.bigIdeas && entry.bigIdeas.length) {
        const bigIdeaItems = entry.bigIdeas
          .map((label) => {
            const targetId = findBigIdeaRouteIdByLabel(label);
            return targetId ? { lens: "bigidea", targetId, label } : null;
          })
          .filter(Boolean);

        if (bigIdeaItems.length) {
          groups.push({
            label: "Big Ideas",
            items: bigIdeaItems
          });
        }
      }

      return groups.length ? `
        <div class="raw-block raw-connections-block">
          <strong>Connections</strong>
          <div class="raw-connection-groups">
            ${groups.map((group) => `
              <div class="raw-connection-group">
                <span class="raw-connection-group-label">${escapeHtml(group.label)}</span>
                <div class="raw-connection-list">
                  ${group.items.map((item) => `
                    <span class="raw-connection-pill raw-connection-pill-static">
                      ${escapeHtml(item.label)}
                    </span>
                  `).join("")}
                </div>
              </div>
            `).join("")}
          </div>
        </div>
      ` : "";
    }

    function renderRawConnectionGroups(entry) {
      return getRawConnectionGroups(entry);
    }

    function getRawVisualAssetHelpers() {
      return {
        escapeHtml,
        getEmbeddableVideo
      };
    }

    function renderRawStudentAssets(entry, entryIndex) {
      return rawContentVisualAssets?.renderStudentAssets
        ? rawContentVisualAssets.renderStudentAssets(entry, entryIndex, state.ui.rawAssetSelections, getRawVisualAssetHelpers())
        : "";
    }

    function getRawAssetSelectionKey(entryIndex, assetIndex) {
      return rawContentVisualAssets?.getSelectionKey
        ? rawContentVisualAssets.getSelectionKey(entryIndex, assetIndex)
        : `${entryIndex}:${assetIndex}`;
    }

    function selectRawAssetPoint(entryIndex, assetIndex, pointIndex) {
      if (!Number.isFinite(entryIndex) || !Number.isFinite(assetIndex) || !Number.isFinite(pointIndex)) {
        return;
      }

      state.ui.rawAssetSelections = {
        ...state.ui.rawAssetSelections,
        [getRawAssetSelectionKey(entryIndex, assetIndex)]: pointIndex
      };
      renderExperience();
    }

    function renderRawSpecialAssets(assets, entryIndex) {
      return rawContentVisualAssets?.renderSpecialAssets
        ? rawContentVisualAssets.renderSpecialAssets(assets, entryIndex, state.ui.rawAssetSelections, getRawVisualAssetHelpers())
        : "";
    }

    function renderRawSpecialAsset(asset, entryIndex, assetIndex) {
      return rawContentVisualAssets?.renderSpecialAsset
        ? rawContentVisualAssets.renderSpecialAsset(asset, entryIndex, assetIndex, state.ui.rawAssetSelections, getRawVisualAssetHelpers())
        : "";
    }

    function renderRawTimelineAsset(asset, entryIndex, assetIndex) {
      return rawContentVisualAssets?.renderTimelineAsset
        ? rawContentVisualAssets.renderTimelineAsset(asset, entryIndex, assetIndex, state.ui.rawAssetSelections, getRawVisualAssetHelpers())
        : "";
    }

    function renderRawRouteMapAsset(asset, entryIndex, assetIndex) {
      return rawContentVisualAssets?.renderRouteMapAsset
        ? rawContentVisualAssets.renderRouteMapAsset(asset, entryIndex, assetIndex, state.ui.rawAssetSelections, getRawVisualAssetHelpers())
        : "";
    }

    function renderRawImageCardAsset(asset) {
      return rawContentVisualAssets?.renderImageCardAsset
        ? rawContentVisualAssets.renderImageCardAsset(asset, getRawVisualAssetHelpers())
        : "";
    }

    function renderRawVisualSections(sections, entryIndex) {
      return rawContentVisualAssets?.renderVisualSections
        ? rawContentVisualAssets.renderVisualSections(sections, entryIndex, getRawVisualAssetHelpers())
        : "";
    }

    function renderRawVisualFooterQuestion(footer) {
      return rawContentVisualAssets?.renderVisualFooterQuestion
        ? rawContentVisualAssets.renderVisualFooterQuestion(footer, getRawVisualAssetHelpers())
        : "";
    }

    function renderRawVisualGallery(items, entryIndex, sectionIndex = null) {
      return rawContentVisualAssets?.renderVisualGallery
        ? rawContentVisualAssets.renderVisualGallery(items, entryIndex, getRawVisualAssetHelpers(), sectionIndex)
        : "";
    }

    function renderRawVisualLinkPreview(item) {
      return rawContentVisualAssets?.renderVisualLinkPreview
        ? rawContentVisualAssets.renderVisualLinkPreview(item, getRawVisualAssetHelpers())
        : "";
    }

    function getRawMediaLinkItems(item) {
      if (rawContentMediaLightbox?.getLinkItems) {
        return rawContentMediaLightbox.getLinkItems(item);
      }

      const explicitLinks = Array.isArray(item.links)
        ? item.links.filter((link) => link && link.url)
        : [];

      if (explicitLinks.length) {
        return explicitLinks;
      }

      if (item.url) {
        return [
          {
            label: item.previewLabel || "Open source",
            url: item.url
          }
        ];
      }

      return [];
    }

    function renderRawMediaLinkButtons(item) {
      if (rawContentMediaLightbox?.renderLinkButtons) {
        return rawContentMediaLightbox.renderLinkButtons(item, escapeHtml);
      }

      const links = getRawMediaLinkItems(item);
      if (!links.length) {
        return "";
      }

      return `
        <div class="raw-media-lightbox-link-list">
          ${links.map((link) => `
            <a class="raw-media-lightbox-link-button" href="${escapeHtml(link.url)}" target="_blank" rel="noreferrer">
              ${escapeHtml(link.label || "Open source")}
            </a>
          `).join("")}
        </div>
      `;
    }

    function getEmbeddableVideo(url) {
      return appVideoService?.getEmbeddableVideo
        ? appVideoService.getEmbeddableVideo(url)
        : fallbackGetEmbeddableVideo(url);
    }

    function getVideoPreview(url) {
      return appVideoService?.getPreview
        ? appVideoService.getPreview(url)
        : fallbackGetVideoPreview(url);
    }

    function renderRawVisualPreview(kind) {
      return rawContentVisualAssets?.renderVisualPreview
        ? rawContentVisualAssets.renderVisualPreview(kind, getRawVisualAssetHelpers())
        : "";
    }

    function renderTextWithBreaks(value) {
      return escapeHtml(value).replace(/\n/g, "<br />");
    }

    function getRawOfficialDisplayText(entry) {
      return stripRawOfficialReferenceAppendix(entry?.rawOfficialText || "");
    }

    function stripRawOfficialReferenceAppendix(value) {
      const paragraphs = String(value || "")
        .replace(/\r\n?/g, "\n")
        .trimEnd()
        .split(/\n\s*\n+/);

      if (paragraphs.length < 2) {
        return String(value || "").trimEnd();
      }

      const cleaned = paragraphs.slice();
      while (cleaned.length > 1 && isRawOfficialReferenceAppendix(cleaned[cleaned.length - 1])) {
        cleaned.pop();
      }

      return cleaned.join("\n\n").trimEnd();
    }

    function isRawOfficialReferenceAppendix(block) {
      const lines = String(block || "")
        .split(/\n+/)
        .map((line) => line.trim())
        .filter(Boolean);

      if (!lines.length) {
        return false;
      }

      if (lines.length === 1) {
        const pieces = lines[0].split(/\s*\|\s*/).filter(Boolean);
        return pieces.length >= 3 && pieces.every((piece) => piece.length <= 90);
      }

      const pipeLines = lines.filter((line) => line.includes("|")).length;
      const referenceLines = lines.filter((line) => isRawOfficialReferenceLine(line)).length;

      return pipeLines / lines.length >= 0.7 || (lines.length >= 4 && referenceLines / lines.length >= 0.7);
    }

    function isRawOfficialReferenceLine(line) {
      const value = String(line || "").trim();
      if (!value) {
        return false;
      }

      if (value.includes("|")) {
        const pieces = value.split(/\s*\|\s*/).filter(Boolean);
        return pieces.length >= 2 && pieces.every((piece) => piece.length <= 96);
      }

      return /^[A-Z0-9"“][^.!?]{0,120}\((?:c\.\s*)?(?:\d{3,4}|early|late|mid)[^)]+\)\s*$/i.test(value);
    }

    function getRawQuizPagerKey(entry, entryIndex) {
      if (rawContentQuizRenderer?.getPagerKey) {
        return rawContentQuizRenderer.getPagerKey(entry, entryIndex, getSectionIdFromGuidingTitle);
      }

      return [
        "raw",
        entry?.sectionId || getSectionIdFromGuidingTitle(entry?.guidingSection || entry?.sectionTitle || "") || "section",
        entry?.id || entry?.title || "entry",
        entryIndex
      ].join("|");
    }

    function getRawQuizPageIndex(pagerKey, total) {
      if (rawContentQuizRenderer?.getPageIndex) {
        return rawContentQuizRenderer.getPageIndex(state.ui.rawQuizPages, pagerKey, total);
      }

      const index = Number(state.ui.rawQuizPages?.[pagerKey]);
      if (!Number.isFinite(index) || total < 1) {
        return 0;
      }
      return Math.max(0, Math.min(total - 1, index));
    }

    function renderRawQuizPager(entry, entryIndex) {
      if (rawContentQuizRenderer?.renderPager) {
        return rawContentQuizRenderer.renderPager(entry, entryIndex, {
          pages: state.ui.rawQuizPages,
          selections: state.ui.rawQuizSelections
        }, {
          escapeHtml,
          getVisibleQuizQuestionItems: getRawVisibleQuizQuestionItems,
          getSectionIdFromGuidingTitle,
          renderOptionToken,
          renderFeedback: renderRawQuizFeedback
        });
      }

      const items = getRawVisibleQuizQuestionItems(entry);
      if (!items.length) {
        return "";
      }

      const pagerKey = getRawQuizPagerKey(entry, entryIndex);
      const currentIndex = getRawQuizPageIndex(pagerKey, items.length);
      const current = items[currentIndex];

      return `
        <div class="raw-block raw-quiz-pager">
          <div class="raw-quiz-pager-head">
            <strong>Questions</strong>
            <span>Question ${currentIndex + 1} / ${items.length}</span>
          </div>
          ${renderRawQuizQuestion(current.question, entryIndex, current.questionIndex)}
          ${items.length > 1 ? `
            <div class="raw-quiz-pager-actions">
              <button
                class="button secondary small"
                type="button"
                data-raw-quiz-page="${escapeHtml(pagerKey)}"
                data-raw-quiz-direction="-1"
                data-raw-quiz-total="${items.length}"
                ${currentIndex === 0 ? "disabled" : ""}
              >Previous</button>
              <button
                class="button primary small"
                type="button"
                data-raw-quiz-page="${escapeHtml(pagerKey)}"
                data-raw-quiz-direction="1"
                data-raw-quiz-total="${items.length}"
                ${currentIndex === items.length - 1 ? "disabled" : ""}
              >Next</button>
            </div>
          ` : ""}
        </div>
      `;
    }

    function renderRawQuizQuestion(question, entryIndex, questionIndex) {
      if (rawContentQuizRenderer?.renderQuestion) {
        return rawContentQuizRenderer.renderQuestion(question, entryIndex, questionIndex, {
          selections: state.ui.rawQuizSelections
        }, {
          escapeHtml,
          renderOptionToken,
          renderFeedback: renderRawQuizFeedback
        });
      }

      const quizKey = getRawQuizQuestionKey(question);
      const selectedIndex = state.ui.rawQuizSelections[quizKey];
      const options = stableShuffleByKey([
        {
          text: question.correctAnswer,
          correct: true
        },
        ...(question.wrongAnswers || []).map((answer) => ({
          text: answer,
          correct: false
        }))
      ].filter((option) => option.text), `${question.level}|${question.prompt}|${question.correctAnswer}`);
      const selectedOption = Number.isInteger(selectedIndex) ? options[selectedIndex] : null;
      const displayLevel = question.displayLevel || (Number(question.level) ? Number(question.level) * 100 : "");

      return `
        <article class="raw-quiz-card">
          ${displayLevel ? `
            <div class="raw-quiz-top">
              <span class="raw-quiz-level">Level ${escapeHtml(displayLevel)}</span>
            </div>
          ` : ""}
          ${question.media?.src ? `
            <button
              class="raw-quiz-media"
              type="button"
              data-open-raw-media="question"
              data-raw-media-entry-index="${entryIndex}"
              data-raw-media-question-index="${questionIndex}"
              aria-label="Open question visual"
            >
              <img src="${escapeHtml(question.media.src)}" alt="${escapeHtml(question.media.alt || "Question visual")}" loading="lazy" />
            </button>
          ` : ""}
          <p class="raw-quiz-prompt">${escapeHtml(question.prompt)}</p>
          <div class="raw-quiz-options">
            ${options.map((option, index) => `
              <button
                class="raw-quiz-option ${renderRawQuizOptionStateClass(option, index, selectedIndex)}"
                type="button"
                data-raw-quiz-option="${index}"
                data-raw-quiz-key="${escapeHtml(quizKey)}"
                aria-pressed="${selectedIndex === index ? "true" : "false"}"
              >
                ${renderOptionToken(index)}
                <span>${escapeHtml(option.text)}</span>
              </button>
            `).join("")}
          </div>
          ${renderRawQuizFeedback(question, selectedOption)}
        </article>
      `;
    }

    function openRawMediaLightboxFromTrigger(trigger) {
      const payload = getRawContentPayload();
      if (!payload) {
        return;
      }

      const anchor = getRawMediaLightboxAnchor(trigger);
      const kind = trigger.dataset.openRawMedia;
      if (kind === "gallery") {
        const entry = payload.entries[Number(trigger.dataset.rawMediaEntryIndex)];
        const sectionIndex = Number(trigger.dataset.rawMediaSectionIndex);
        const sourceItems = Number.isFinite(sectionIndex)
          ? entry?.visualSections?.[sectionIndex]?.items || []
          : entry?.visualGallery || [];
        const items = sourceItems.filter((item) => {
          return item && (
            item.src ||
            item.url ||
            (Array.isArray(item.links) && item.links.length) ||
            item.note
          );
        });
        if (!items.length) {
          return;
        }

        state.ui.rawMediaLightbox = {
          items,
          index: Math.max(0, Math.min(items.length - 1, Number(trigger.dataset.rawMediaItemIndex) || 0)),
          anchor
        };
        syncPopupScrollLock();
        renderExperience();
        return;
      }

      if (kind === "entry-channel") {
        const entry = payload.entries[Number(trigger.dataset.rawMediaEntryIndex)];
        const items = getAlpacaChannelVideosForEntry(entry).map((video) => ({
          title: video.title || "Alpaca Channel video",
          url: video.url,
          previewLabel: "Play video",
          note: video.description || video.channel || "",
          links: [
            {
              label: "Open video",
              url: video.url
            }
          ]
        }));

        if (!items.length) {
          return;
        }

        state.ui.rawMediaLightbox = {
          items,
          index: Math.max(0, Math.min(items.length - 1, Number(trigger.dataset.rawMediaItemIndex) || 0)),
          anchor
        };
        syncPopupScrollLock();
        renderExperience();
        return;
      }

      if (kind === "question") {
        const entry = payload.entries[Number(trigger.dataset.rawMediaEntryIndex)];
        const question = entry?.quizQuestions?.[Number(trigger.dataset.rawMediaQuestionIndex)];
        if (!question?.media?.src) {
          return;
        }

        state.ui.rawMediaLightbox = {
          items: [
            {
              src: question.media.src,
              title: question.media.alt || question.prompt || "Question visual"
            }
          ],
          index: 0,
          anchor
        };
        syncPopupScrollLock();
        renderExperience();
      }
    }

    function getRawMediaLightboxAnchor(trigger) {
      if (!trigger || !trigger.getBoundingClientRect) {
        return null;
      }

      const rect = trigger.getBoundingClientRect();
      const shell = trigger.closest(".raw-content-shell") || refs.experiencePanel || document.body;
      const shellRect = shell.getBoundingClientRect();
      const viewportWidth = window.innerWidth || document.documentElement.clientWidth || 1280;
      const viewportHeight = window.innerHeight || document.documentElement.clientHeight || 800;
      const shellHeight = shell.scrollHeight || shellRect.height || viewportHeight;
      const estimatedWidth = Math.min(860, Math.max(320, Math.min(viewportWidth, shellRect.width || viewportWidth) - 32));
      const estimatedHeight = Math.min(720, Math.max(320, viewportHeight - 32));
      const centerX = rect.left - shellRect.left + rect.width / 2;
      const centerY = rect.top - shellRect.top + rect.height / 2;
      const minLeft = Math.max(16, -shellRect.left + 16);
      const maxLeft = Math.max(minLeft, -shellRect.left + viewportWidth - estimatedWidth - 16);
      const minTop = Math.max(16, -shellRect.top + 16);
      const maxTop = Math.max(
        minTop,
        Math.min(
          shellHeight - estimatedHeight - 16,
          -shellRect.top + viewportHeight - estimatedHeight - 16
        )
      );
      const left = Math.min(
        Math.max(minLeft, centerX - estimatedWidth / 2),
        maxLeft
      );
      const top = Math.min(
        Math.max(minTop, centerY - estimatedHeight / 2),
        maxTop
      );

      return {
        left: Math.round(left),
        top: Math.round(top)
      };
    }

    function closeRawMediaLightbox() {
      state.ui.rawMediaLightbox = null;
      state.ui.rawMediaSwipeStartX = null;
      syncPopupScrollLock();
      renderExperience();
    }

    function shiftRawMediaLightbox(direction) {
      const lightbox = state.ui.rawMediaLightbox;
      if (!lightbox || !lightbox.items?.length) {
        return;
      }

      const total = lightbox.items.length;
      lightbox.index = (lightbox.index + direction + total) % total;
      renderExperience();
    }

    function renderRawMediaLightbox() {
      if (rawContentMediaLightbox?.renderLightbox) {
        return rawContentMediaLightbox.renderLightbox(state.ui.rawMediaLightbox, {
          escapeHtml,
          getEmbeddableVideo,
          getVideoPreview,
          isDesktopApp: window.WSC_DESKTOP_APP === true
        });
      }

      const lightbox = state.ui.rawMediaLightbox;
      if (!lightbox || !lightbox.items?.length) {
        return "";
      }

      const current = lightbox.items[lightbox.index];
      const multi = lightbox.items.length > 1;
      const hasImage = Boolean(current.src);
      const hasLink = getRawMediaLinkItems(current).length > 0;
      const embeddedVideo = !hasImage ? getEmbeddableVideo(current.url) : null;
      const videoPreview = !hasImage ? getVideoPreview(current.url) : null;
      const canEmbedVideo = Boolean(embeddedVideo) && !window.WSC_DESKTOP_APP;
      const hasVideoPreview = Boolean(videoPreview);
      const anchor = lightbox.anchor || null;
      const anchorStyle = anchor
        ? ` style="--raw-media-anchor-left: ${Math.max(0, Math.round(Number(anchor.left) || 0))}px; --raw-media-anchor-top: ${Math.max(0, Math.round(Number(anchor.top) || 0))}px;"`
        : "";
      const anchorClass = anchor ? " raw-media-lightbox-overlay--anchored" : "";

      return `
        <div class="raw-media-lightbox-overlay${anchorClass}" data-close-raw-media role="dialog" aria-modal="true" aria-label="Raw content media viewer"${anchorStyle}>
          <div class="raw-media-lightbox-window" data-raw-media-window>
            <button class="popup-close-button" type="button" data-close-raw-media aria-label="Close media viewer">
              <span aria-hidden="true">×</span>
            </button>
            <div class="raw-media-lightbox-stack">
              <div class="raw-media-lightbox-top">
                <p class="challenge-label">Raw Content visual</p>
                <h3>${escapeHtml(current.title || "Visual")}</h3>
              </div>
              <div class="raw-media-lightbox-frame">
                ${multi ? `<button class="raw-media-lightbox-nav prev" type="button" data-raw-media-nav="prev" aria-label="Previous visual">‹</button>` : ""}
                <div class="raw-media-lightbox-asset ${hasImage ? "" : canEmbedVideo ? "video-slide" : hasVideoPreview ? "video-preview-slide" : "link-slide"}">
                  ${hasImage ? `
                    <img class="raw-media-lightbox-image${current.preserveOriginalColor ? " original-color" : ""}" src="${escapeHtml(current.src)}" alt="${escapeHtml(current.title || "Raw content visual")}" />
                  ` : canEmbedVideo ? `
                    <div class="raw-media-lightbox-video-wrap">
                      <iframe
                        class="raw-media-lightbox-iframe"
                        src="${escapeHtml(embeddedVideo.embedUrl)}"
                        title="${escapeHtml(current.title || "Embedded video")}"
                        loading="lazy"
                        referrerpolicy="strict-origin-when-cross-origin"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowfullscreen
                      ></iframe>
                    </div>
                  ` : hasVideoPreview ? `
                    <div class="raw-media-lightbox-video-preview">
                      <img class="raw-media-lightbox-video-thumb" src="${escapeHtml(videoPreview.thumbnailUrl)}" alt="${escapeHtml(current.title || "Video preview")}" loading="lazy" referrerpolicy="no-referrer" />
                      <div class="raw-media-lightbox-video-copy">
                        <span class="challenge-label">Video preview</span>
                        <p class="raw-media-lightbox-note">YouTube blocks direct playback inside the local Mac app, so this slide opens the original video reliably in your browser.</p>
                        ${renderRawMediaLinkButtons(current)}
                      </div>
                    </div>
                  ` : `
                    <div class="raw-media-lightbox-link-slide">
                      <span class="challenge-label">Reference slide</span>
                      <h4>${escapeHtml(current.title || "Reference")}</h4>
                      ${current.note ? `<p class="raw-media-lightbox-note">${escapeHtml(current.note)}</p>` : ""}
                      ${renderRawMediaLinkButtons(current)}
                    </div>
                  `}
                </div>
                ${multi ? `<button class="raw-media-lightbox-nav next" type="button" data-raw-media-nav="next" aria-label="Next visual">›</button>` : ""}
              </div>
              ${((hasImage || canEmbedVideo) && (current.note || hasLink)) ? `
                <div class="raw-media-lightbox-meta">
                  ${current.note ? `<p class="raw-media-lightbox-note">${escapeHtml(current.note)}</p>` : ""}
                  ${renderRawMediaLinkButtons(current)}
                </div>
              ` : ""}
              ${multi ? `
                <div class="raw-media-lightbox-footer">
                  <span>${lightbox.index + 1} / ${lightbox.items.length}</span>
                  <span>Swipe or use the arrows to move through the set.</span>
                </div>
              ` : ""}
            </div>
          </div>
        </div>
      `;
    }

    function getRawQuizQuestionKey(question) {
      if (rawContentQuizRenderer?.getQuestionKey) {
        return rawContentQuizRenderer.getQuestionKey(question);
      }

      return `${question.level}|${question.prompt}|${question.correctAnswer}`;
    }

    function selectRawQuizOption(quizKey, optionIndex) {
      if (!quizKey || !Number.isFinite(optionIndex)) {
        return;
      }

      state.ui.rawQuizSelections = {
        ...state.ui.rawQuizSelections,
        [quizKey]: optionIndex
      };

      renderExperience();
    }

    function rememberRawQuestionGallerySlide(target) {
      const gallery = target?.closest?.("[data-raw-question-gallery]");
      const slide = target?.closest?.("[data-raw-question-gallery-slide]");
      if (!gallery || !slide) {
        return;
      }

      setRawQuizPageIndex(
        gallery.dataset.rawQuestionPager,
        Number(slide.dataset.rawQuestionIndex),
        Number(gallery.dataset.rawQuestionTotal),
        false
      );
    }

    function setRawQuizPageIndex(pagerKey, index, total, sync = true) {
      if (!pagerKey || !Number.isFinite(index) || !Number.isFinite(total) || total < 1) {
        return null;
      }

      const nextIndex = Math.max(0, Math.min(total - 1, Math.round(index)));
      state.ui.rawQuizPages = {
        ...state.ui.rawQuizPages,
        [pagerKey]: nextIndex
      };

      if (sync) {
        const gallery = getRawQuestionGalleryByPagerKey(pagerKey);
        if (gallery) {
          syncRawQuestionGallery(gallery, { behavior: "smooth" });
        }
      }

      return nextIndex;
    }

    function shiftRawQuizPage(pagerKey, direction, total) {
      if (!pagerKey || !Number.isFinite(direction) || !Number.isFinite(total) || total < 1) {
        return;
      }

      const currentIndex = getRawQuizPageIndex(pagerKey, total);
      const nextIndex = setRawQuizPageIndex(pagerKey, currentIndex + direction, total, true);
      if (nextIndex === null || !getRawQuestionGalleryByPagerKey(pagerKey)) {
        renderExperience();
      }
    }

    function getRawQuestionGalleryByPagerKey(pagerKey) {
      if (!refs.experiencePanel || !pagerKey) {
        return null;
      }

      return [...refs.experiencePanel.querySelectorAll("[data-raw-question-gallery]")]
        .find((gallery) => gallery.dataset.rawQuestionPager === pagerKey) || null;
    }

    function syncRawQuestionGalleries(options = {}) {
      if (!refs.experiencePanel) {
        return;
      }

      refs.experiencePanel.querySelectorAll("[data-raw-question-gallery]").forEach((gallery) => {
        syncRawQuestionGallery(gallery, options);
      });
    }

    function syncRawQuestionGallery(gallery, options = {}) {
      if (!gallery) {
        return false;
      }

      const pagerKey = gallery.dataset.rawQuestionPager || "";
      const total = Number(gallery.dataset.rawQuestionTotal);
      const viewport = gallery.querySelector("[data-raw-question-gallery-viewport]");
      const slides = [...gallery.querySelectorAll("[data-raw-question-gallery-slide]")];
      if (!pagerKey || !viewport || !slides.length || !Number.isFinite(total)) {
        return false;
      }

      const currentIndex = getRawQuizPageIndex(pagerKey, Math.max(total, slides.length));
      const safeIndex = Math.max(0, Math.min(slides.length - 1, currentIndex));
      const targetSlide = slides[safeIndex];

      slides.forEach((slide, index) => {
        slide.classList.toggle("active", index === safeIndex);
        slide.setAttribute("aria-hidden", index === safeIndex ? "false" : "true");
      });

      const currentLabel = gallery.closest(".raw-quiz-pager, .regular-guide-question-block")
        ?.querySelector("[data-raw-question-current]");
      if (currentLabel) {
        currentLabel.textContent = `Question ${safeIndex + 1} / ${slides.length}`;
      }

      gallery.querySelectorAll("[data-raw-quiz-page]").forEach((button) => {
        const direction = Number(button.dataset.rawQuizDirection);
        button.disabled = direction < 0 ? safeIndex === 0 : safeIndex === slides.length - 1;
      });

      window.requestAnimationFrame(() => {
        const targetLeft = targetSlide.offsetLeft - Math.max(0, (viewport.clientWidth - targetSlide.offsetWidth) / 2);
        viewport.scrollTo({
          left: Math.max(0, targetLeft),
          behavior: options.behavior || "auto"
        });
      });

      return true;
    }

    function renderRawQuizOptionStateClass(option, index, selectedIndex) {
      if (rawContentQuizRenderer?.getOptionStateClass) {
        return rawContentQuizRenderer.getOptionStateClass(option, index, selectedIndex);
      }

      if (!Number.isInteger(selectedIndex)) {
        return "";
      }

      if (index === selectedIndex) {
        return option.correct ? "revealed-correct" : "revealed-selected";
      }

      if (option.correct) {
        return "revealed-correct";
      }

      return "revealed-wrong";
    }

    function stableShuffleByKey(items, key) {
      if (rawContentQuizRenderer?.stableShuffleByKey) {
        return rawContentQuizRenderer.stableShuffleByKey(items, key);
      }

      const output = [...items];
      let seed = hashString(key);

      for (let index = output.length - 1; index > 0; index -= 1) {
        seed = (seed * 1664525 + 1013904223) >>> 0;
        const swapIndex = seed % (index + 1);
        [output[index], output[swapIndex]] = [output[swapIndex], output[index]];
      }

      return output;
    }

    function hashString(value) {
      let hash = 2166136261;
      const text = String(value || "");
      for (let index = 0; index < text.length; index += 1) {
        hash ^= text.charCodeAt(index);
        hash = Math.imul(hash, 16777619);
      }
      return hash >>> 0;
    }

    return Object.freeze({
      getApprovedRawContentSection,
      getRawVisibleQuizQuestionItems,
      renderSectionTransferTable,
      getVisibleWrongExplanation,
      getVisibleQuizFeedbackParts,
      renderRawQuizFeedback,
      renderRawContentExperience,
      renderRawContentEntryGroups,
      renderRawContentEntryCard,
      getRawContentScopeLabel,
      getRawContentPayload,
      getRawEntriesForSelection,
      getRawEntriesForRouteSelection,
      getRawEntriesForRunSetupCategoryIds,
      countRawQuizQuestions,
      getOrderedRawContentSections,
      mapRawEntriesWithSection,
      getRawEntryMasteryKey,
      isRawEntryMastered,
      getRawMasteryHelpers,
      renderRawMasteryToggle,
      renderRawEntryQuickActions,
      renderRawBackToTopButton,
      renderRawEntryChannelLinks,
      toggleRawMastery,
      getAllRawEntries,
      getTotalRawMasterableEntries,
      getMasteredRawEntryCount,
      findLearnSubjectRouteIdByLabel,
      findBigIdeaRouteIdByLabel,
      getRawConnectionGroups,
      renderRawConnectionGroups,
      getRawVisualAssetHelpers,
      renderRawStudentAssets,
      getRawAssetSelectionKey,
      selectRawAssetPoint,
      renderRawSpecialAssets,
      renderRawSpecialAsset,
      renderRawTimelineAsset,
      renderRawRouteMapAsset,
      renderRawImageCardAsset,
      renderRawVisualSections,
      renderRawVisualFooterQuestion,
      renderRawVisualGallery,
      renderRawVisualLinkPreview,
      getRawMediaLinkItems,
      renderRawMediaLinkButtons,
      renderRawVisualPreview,
      renderTextWithBreaks,
      getRawOfficialDisplayText,
      stripRawOfficialReferenceAppendix,
      isRawOfficialReferenceAppendix,
      isRawOfficialReferenceLine,
      getRawQuizPagerKey,
      getRawQuizPageIndex,
      renderRawQuizPager,
      renderRawQuizQuestion,
      openRawMediaLightboxFromTrigger,
      getRawMediaLightboxAnchor,
      closeRawMediaLightbox,
      shiftRawMediaLightbox,
      renderRawMediaLightbox,
      getRawQuizQuestionKey,
      selectRawQuizOption,
      rememberRawQuestionGallerySlide,
      setRawQuizPageIndex,
      shiftRawQuizPage,
      getRawQuestionGalleryByPagerKey,
      syncRawQuestionGalleries,
      syncRawQuestionGallery,
      renderRawQuizOptionStateClass,
      stableShuffleByKey,
      hashString
    });
  }

  global.WSC_CREATE_RAW_CONTENT_CONTROLLER = createRawContentController;
}(window));

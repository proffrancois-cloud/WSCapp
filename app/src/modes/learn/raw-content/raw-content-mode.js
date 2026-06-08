(function () {
  function buildExperience(section) {
    return {
      type: "rawcontent",
      title: "Raw Content",
      section
    };
  }

  function renderExperience(context, helpers) {
    const escapeHtml = helpers.escapeHtml;
    const renderPanelTitle = helpers.renderPanelTitle;
    const renderEntryGroups = helpers.renderEntryGroups;
    const renderMediaLightbox = helpers.renderMediaLightbox;
    const renderLearnCardFooterNav = helpers.renderLearnCardFooterNav;
    const payload = context.payload;

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
                <p class="challenge-label">${escapeHtml(context.scopeLabel)}</p>
                <h3>${escapeHtml(context.targetLabel)}</h3>
              </div>
            </div>
            <p>Waiting for updates until you receive the ones.</p>
            <div class="chip-row">
              <span>${escapeHtml(context.targetLabel)}</span>
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
        ${renderEntryGroups(payload.entries)}
        ${renderMediaLightbox()}
      </div>
      ${renderLearnCardFooterNav("rawcontent")}
    `;
  }

  function renderEntryGroups(entries, context, helpers) {
    const selectedSectionIds = context.selectedSectionIds || [];
    const sectionById = context.sectionById || {};
    const escapeHtml = helpers.escapeHtml;
    const getSectionIdFromGuidingTitle = helpers.getSectionIdFromGuidingTitle;
    const renderEntryCard = helpers.renderEntryCard;

    if (selectedSectionIds.length <= 1) {
      return entries.map((entry, entryIndex) => renderEntryCard(entry, entryIndex)).join("");
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
            ${sectionEntries.map(({ entry, entryIndex }) => renderEntryCard(entry, entryIndex)).join("")}
          </div>
        </article>
      `;
    }).join("");
  }

  window.WSC_RAW_CONTENT_MODE = Object.freeze({
    buildExperience,
    renderExperience,
    renderEntryGroups
  });
}());

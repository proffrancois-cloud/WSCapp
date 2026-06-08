(function () {
  function renderEntryCard(entry, entryIndex, helpers) {
    const escapeHtml = helpers.escapeHtml;
    const renderTextWithBreaks = helpers.renderTextWithBreaks;
    const renderAlpacaList = helpers.renderAlpacaList;
    const renderRawStudentAssets = helpers.renderRawStudentAssets;
    const renderRawConnectionGroups = helpers.renderRawConnectionGroups;
    const renderSectionTransferTable = helpers.renderSectionTransferTable;
    const renderRawQuizPager = helpers.renderRawQuizPager;
    const renderRawMasteryToggle = helpers.renderRawMasteryToggle;
    const getRawOfficialDisplayText = helpers.getRawOfficialDisplayText || ((rawEntry) => rawEntry?.rawOfficialText || "");
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

  window.WSC_RAW_CONTENT_ENTRY_RENDERER = Object.freeze({
    renderEntryCard
  });
}());

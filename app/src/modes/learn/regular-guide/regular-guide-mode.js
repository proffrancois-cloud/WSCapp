(function () {
  function buildExperience(title, guides) {
    return {
      type: "regularguide",
      title,
      guides
    };
  }

  function renderExperience(experience, context, helpers) {
    const guides = experience.guides || [];

    if (!guides.length) {
      return `
        ${helpers.renderPanelTitle("Guide", helpers.getTargetLabel(), "No guide file yet")}
        <div class="raw-content-shell">
          <article class="raw-source-card">
            <div class="raw-source-top">
              <div>
                <p class="challenge-label">${helpers.escapeHtml(helpers.getRawContentScopeLabel())}</p>
                <h3>${helpers.escapeHtml(helpers.getTargetLabel())}</h3>
              </div>
            </div>
            <p>No regular guide has been attached to this route yet.</p>
          </article>
        </div>
        ${helpers.renderLearnCardFooterNav("regularguide")}
      `;
    }

    if (guides.length === 1) {
      const guide = guides[0];
      const section = context.importedRawContentBank[guide.sectionId] || null;
      return `
        ${helpers.renderPanelTitle("Guide", guide.sectionTitle || guide.title, null)}
        <div class="regular-guide-shell">
          <article class="raw-source-card regular-guide-card">
            <div class="raw-source-top">
              <div>
                <h3>${helpers.escapeHtml(guide.sectionTitle || guide.title)}</h3>
              </div>
            </div>
            ${renderDocument(guide, helpers)}
            ${renderQuestionBlock(section, context, helpers)}
          </article>
        </div>
        ${helpers.renderLearnCardFooterNav("regularguide")}
      `;
    }

    return `
      ${helpers.renderPanelTitle("Guide", helpers.getTargetLabel(), null)}
      <div class="regular-guide-shell">
        ${guides.map((guide) => `
          <article class="raw-source-card regular-guide-card">
            <div class="raw-source-top">
              <div>
                <h3>${helpers.escapeHtml(guide.sectionTitle || guide.title)}</h3>
              </div>
            </div>
            ${renderDocument(guide, helpers)}
            ${renderQuestionBlock(context.importedRawContentBank[guide.sectionId] || null, context, helpers)}
          </article>
        `).join("")}
      </div>
      ${helpers.renderLearnCardFooterNav("regularguide")}
    `;
  }

  function renderDocument(guide, helpers) {
    if (guide?.htmlContent) {
      return `
        <div class="regular-guide-document" aria-label="${helpers.escapeHtml(`${guide.sectionTitle || guide.title} guide content`)}">
          ${guide.htmlContent}
        </div>
      `;
    }

    const fallbackHref = guide?.docxHref || guide?.href || guide?.pdfHref || "";
    return `
      <div class="regular-guide-document regular-guide-document-empty">
        <p>The guide content is attached, but no inline guide has been generated for this section yet.</p>
        ${fallbackHref ? `<a class="button secondary small" href="${helpers.escapeHtml(fallbackHref)}" target="_blank" rel="noopener noreferrer">Open guide file</a>` : ""}
      </div>
    `;
  }

  function renderQuestionBlock(section, context, helpers) {
    const questions = helpers.getSectionGuideQuestions(section);
    const transferTable = helpers.renderSectionTransferTable(section, { collapsed: false, context: "guide" });
    const questionBlock = questions.length ? renderQuestionPager(section, questions, context, helpers) : "";

    return `${transferTable}${questionBlock}`;
  }

  function renderQuestionPager(section, questions, context, helpers) {
    const pagerKey = ["guide", section?.id || "section", "questions"].join("|");
    const currentIndex = typeof helpers.getRawQuizPageIndex === "function"
      ? helpers.getRawQuizPageIndex(pagerKey, questions.length)
      : 0;
    const safeIndex = Math.max(0, Math.min(questions.length - 1, currentIndex));

    return `
      <div class="raw-block regular-guide-question-block">
        <div class="raw-quiz-pager-head">
          <strong>Questions</strong>
          <span data-raw-question-current>Question ${safeIndex + 1} / ${questions.length}</span>
        </div>
        <p>These questions allow alpacas to practice the section-level connections in context.</p>
        <div
          class="mindmap-gallery raw-question-gallery ${questions.length > 1 ? "has-multiple" : ""}"
          data-raw-question-gallery
          data-raw-question-pager="${helpers.escapeHtml(pagerKey)}"
          data-raw-question-total="${questions.length}"
          aria-label="Guide question slideshow"
        >
          ${questions.length > 1 ? `
            <button
              class="mindmap-gallery-nav mindmap-gallery-nav--previous raw-question-gallery-nav"
              type="button"
              data-raw-quiz-page="${helpers.escapeHtml(pagerKey)}"
              data-raw-quiz-direction="-1"
              data-raw-quiz-total="${questions.length}"
              aria-label="Previous guide question"
              ${safeIndex === 0 ? "disabled" : ""}
            >
              <span aria-hidden="true">‹</span>
            </button>
            <button
              class="mindmap-gallery-nav mindmap-gallery-nav--next raw-question-gallery-nav"
              type="button"
              data-raw-quiz-page="${helpers.escapeHtml(pagerKey)}"
              data-raw-quiz-direction="1"
              data-raw-quiz-total="${questions.length}"
              aria-label="Next guide question"
              ${safeIndex === questions.length - 1 ? "disabled" : ""}
            >
              <span aria-hidden="true">›</span>
            </button>
          ` : ""}
          <div class="mindmap-gallery-track raw-question-gallery-track" data-raw-question-gallery-viewport>
            ${questions.map((question, index) => `
              <div
                class="mindmap-gallery-slide raw-question-gallery-slide ${index === safeIndex ? "active" : ""}"
                data-raw-question-gallery-slide
                data-raw-question-index="${index}"
                aria-hidden="${index === safeIndex ? "false" : "true"}"
              >
                ${helpers.renderGuideQuizQuestion(question, section, index)}
              </div>
            `).join("")}
          </div>
        </div>
        ${renderNavigation(section, context, helpers)}
      </div>
    `;
  }

  function renderNavigation(section, context, helpers) {
    const currentSectionId = section?.id || "";
    const guides = helpers.getOrderedRawContentSections()
      .map(helpers.getRegularGuideForSection)
      .filter(Boolean);
    const channelButton = renderSectionChannelButton(currentSectionId, context, helpers);

    if (!guides.length) {
      return "";
    }

    return `
      <div class="regular-guide-nav" aria-label="Guide sections">
        <strong>Guides</strong>
        <div class="regular-guide-nav-list">
          ${guides.map((guide) => `
            <button
              class="regular-guide-nav-chip ${guide.sectionId === currentSectionId ? "active" : ""}"
              type="button"
              data-open-guide-section="${helpers.escapeHtml(guide.sectionId)}"
            >
              <span>${helpers.escapeHtml(guide.title)}</span>
            </button>
          `).join("")}
        </div>
        ${channelButton ? `<div class="regular-guide-channel-row">${channelButton}${helpers.renderRawBackToTopButton()}</div>` : ""}
      </div>
    `;
  }

  function renderSectionChannelButton(sectionId, context, helpers) {
    if (!sectionId || !helpers.getAlpacaChannelVideosForSection(sectionId).length) {
      return "";
    }

    return `
      <button
        class="raw-entry-channel-link guide-channel-link"
        type="button"
        data-open-section-channel="${helpers.escapeHtml(sectionId)}"
        aria-label="Open Alpaca Channel for ${helpers.escapeHtml(context.sectionById[sectionId]?.title || "this guide")}"
        title="Open Alpaca Channel"
      >
        <img src="${helpers.escapeHtml(helpers.getModeAssetPath("channel"))}" alt="" aria-hidden="true" />
        <span>Alpaca Channel</span>
      </button>
    `;
  }

  window.WSC_REGULAR_GUIDE_MODE = Object.freeze({
    buildExperience,
    renderExperience,
    renderDocument,
    renderQuestionBlock,
    renderNavigation,
    renderSectionChannelButton
  });
}());

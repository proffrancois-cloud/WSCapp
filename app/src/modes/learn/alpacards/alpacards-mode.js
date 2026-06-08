(function () {
  const ASSET_VERSION = "20260523alpacardcarousel";

  function buildExperience(cards, routeTitle) {
    return {
      type: "alpacard",
      routeTitle,
      cards,
      index: 0,
      flipped: false
    };
  }

  function getCardsForSelection(options) {
    const cards = Array.isArray(options.cards) ? options.cards : [];
    const selectedSectionIds = Array.isArray(options.selectedSectionIds) ? options.selectedSectionIds : [];
    const selection = options.selection || {};
    const selectionQuestions = Array.isArray(options.selectionQuestions) ? options.selectionQuestions : [];
    const normalizeSectionId = typeof options.normalizeSectionId === "function"
      ? options.normalizeSectionId
      : (sectionId) => String(sectionId || "").trim();

    if (selection.lens === "section" && selectedSectionIds.length) {
      const sectionIds = new Set(selectedSectionIds.map((sectionId) => normalizeSectionId(sectionId)));
      return cards.filter((card) => sectionIds.has(normalizeSectionId(card.sectionId)));
    }

    if (!selection.lens || !selection.targetId || selection.targetId === "all") {
      return cards.slice();
    }

    if (selection.lens === "section") {
      const targetId = normalizeSectionId(selection.targetId);
      return cards.filter((card) => normalizeSectionId(card.sectionId) === targetId);
    }

    const sectionIds = new Set(selectionQuestions.map((question) => normalizeSectionId(question.sectionId)));
    return cards.filter((card) => sectionIds.has(normalizeSectionId(card.sectionId)));
  }

  function renderExperience(experience, helpers) {
    const escapeHtml = helpers.escapeHtml;
    const renderPanelTitle = helpers.renderPanelTitle;
    const renderLearnCardFooterNav = helpers.renderLearnCardFooterNav;
    const cards = experience.cards || [];
    const total = cards.length;
    const current = total ? cards[Math.min(experience.index, total - 1)] : null;
    const title = "Alpacard";
    const subtitle = total
      ? "Flip each card to practice recognizing the exact artwork, building, place, film, or game."
      : "No Alpacards are attached to this route yet.";
    const metaLine = total ? "" : "Choose more guiding sections for a larger deck.";

    if (!current) {
      return `
        ${renderPanelTitle(title, subtitle, metaLine)}
        <div class="alpacard-shell">
        <div class="alpacard-empty">
          <h3>No Alpacards here yet.</h3>
          <p>This selected route does not have a matching recognition card in the current local deck.</p>
        </div>
      </div>
      ${renderLearnCardFooterNav("alpacard")}
      `;
    }

    return `
      ${renderPanelTitle(title, subtitle, metaLine)}
      <div class="alpacard-shell">
        <div class="alpacard-meta-row">
          <span class="alpacard-badge" data-alpacard-current-category>${escapeHtml(current.category || "Recognition")}</span>
          <strong data-alpacard-counter>${experience.index + 1} / ${total}</strong>
        </div>
        <div class="alpacard-carousel" data-alpacard-carousel>
          <div class="alpacard-viewport">
            <div class="alpacard-track" data-alpacard-track style="transform: translate3d(-${experience.index * 100}%, 0, 0);">
              ${cards.map((card, cardIndex) => renderSlide(card, cardIndex, experience, escapeHtml)).join("")}
            </div>
            ${renderNavButton("previous", "Previous card")}
            ${renderNavButton("next", "Next card")}
          </div>
        </div>
        ${renderThumbnails(cards, experience.index, escapeHtml)}
        <div class="alpacard-controls">
          <button class="button primary alpacard-flip-button" type="button" data-alpacard-flip>
            <span data-alpacard-flip-label>Flip</span>
          </button>
        </div>
      </div>
      ${renderLearnCardFooterNav("alpacard")}
    `;
  }

  function renderSlide(card, cardIndex, experience, escapeHtml) {
    const isActive = cardIndex === experience.index;

    return `
      <article class="alpacard-slide ${isActive ? "is-active" : ""}" data-alpacard-slide data-alpacard-slide-index="${cardIndex}" aria-hidden="${isActive ? "false" : "true"}">
        <div class="alpacard-stage ${isActive && experience.flipped ? "is-flipped" : ""}" data-alpacard-stage>
          <div class="alpacard-flip-inner">
            ${renderFront(card, escapeHtml)}
            ${renderBack(card, escapeHtml)}
          </div>
        </div>
      </article>
    `;
  }

  function renderNavButton(direction, label) {
    const path = direction === "previous" ? "M15 19l-7-7 7-7" : "M9 5l7 7-7 7";

    return `
      <button
        class="alpacard-nav-button alpacard-nav-button--${direction}"
        type="button"
        data-alpacard-nav="${direction}"
        aria-label="${label}"
        title="${label}"
      >
        <svg aria-hidden="true" viewBox="0 0 24 24" focusable="false">
          <path d="${path}"></path>
        </svg>
      </button>
    `;
  }

  function renderThumbnails(cards, activeIndex, escapeHtml) {
    return `
      <div class="alpacard-thumbnails" data-alpacard-thumbnails aria-label="Alpacard deck thumbnails">
        <div class="alpacard-thumbnail-track">
          ${cards.map((card, cardIndex) => `
            <button
              class="alpacard-thumb ${cardIndex === activeIndex ? "is-active" : ""}"
              type="button"
              data-alpacard-index="${cardIndex}"
              aria-label="Go to card ${cardIndex + 1}: ${escapeHtml(card.title)}"
              aria-current="${cardIndex === activeIndex ? "true" : "false"}"
              title="${escapeHtml(card.title)}"
            >
              <img src="${getImageSrc(card, escapeHtml)}" alt="" loading="lazy" decoding="async" draggable="false" />
            </button>
          `).join("")}
        </div>
      </div>
    `;
  }

  function getImageSrc(card, escapeHtml) {
    return `./${escapeHtml(card.imagePath)}?v=${ASSET_VERSION}`;
  }

  function renderFront(card, escapeHtml) {
    const imageSrc = getImageSrc(card, escapeHtml);

    return `
      <div class="alpacard-card alpacard-face alpacard-front">
        <div class="alpacard-image-wrap" style="--alpacard-image-url: url('${imageSrc}');">
          <img class="alpacard-image" src="${imageSrc}" alt="${escapeHtml(card.title)}" loading="lazy" decoding="async" draggable="false" />
        </div>
      </div>
    `;
  }

  function renderBack(card, escapeHtml) {
    const fields = [
      ["Title / Name", card.title],
      ["Creator / Architect / Studio", card.creator],
      ["Year / Date", card.year],
      ["Location / Medium", card.locationMedium],
      ["Movement / Context", card.movementContext],
      ["Recognition focus", card.notice]
    ].filter(([, value]) => value);
    const connections = getConnectionChips(card);

    return `
      <div class="alpacard-card alpacard-face alpacard-back">
        <div class="alpacard-back-heading">
          <h3>${escapeHtml(card.title)}</h3>
        </div>
        <div class="alpacard-back-grid">
          ${fields.map(([label, value]) => `
            <div class="alpacard-field">
              <span>${escapeHtml(label)}</span>
              <p>${escapeHtml(value)}</p>
            </div>
          `).join("")}
        </div>
        ${connections.length ? `
          <div class="alpacard-connection-row" aria-label="WSC theme connection">
            ${connections.map((connection) => `<span>${escapeHtml(connection)}</span>`).join("")}
          </div>
        ` : ""}
      </div>
    `;
  }

  function getConnectionChips(card) {
    return String(card.wscConnection || "")
      .split("·")
      .flatMap((part) => part.replace(/^\s*(Guiding section|Big ideas|Subjects):\s*/i, "").split("/"))
      .map((part) => part.trim())
      .filter(Boolean)
      .filter((part, index, all) => all.indexOf(part) === index);
  }

  function navigate(experience, direction) {
    if (!experience || experience.type !== "alpacard" || !experience.cards.length) {
      return false;
    }

    const total = experience.cards.length;
    const currentIndex = clampIndex(experience.index, total);
    const targetIndex = direction === "previous"
      ? (currentIndex - 1 + total) % total
      : (currentIndex + 1) % total;

    experience.flipped = false;
    experience.index = targetIndex;
    return true;
  }

  function setIndex(experience, index) {
    if (!experience || experience.type !== "alpacard" || !experience.cards.length) {
      return false;
    }

    const targetIndex = clampIndex(index, experience.cards.length);
    if (targetIndex !== experience.index) {
      experience.flipped = false;
    }

    experience.index = targetIndex;
    return true;
  }

  function clampIndex(index, total) {
    const numericIndex = Number(index);
    if (!Number.isFinite(numericIndex)) {
      return 0;
    }

    return Math.max(0, Math.min(total - 1, Math.trunc(numericIndex)));
  }

  function flip(experience) {
    if (!experience || experience.type !== "alpacard") {
      return false;
    }

    experience.flipped = !experience.flipped;
    return true;
  }

  function shuffleDeck(experience, shuffleFn) {
    if (!experience || experience.type !== "alpacard" || experience.cards.length < 2) {
      return false;
    }

    experience.cards = shuffleFn([...experience.cards]);
    experience.index = 0;
    experience.flipped = false;
    return true;
  }

  window.WSC_ALPACARDS_MODE = Object.freeze({
    buildExperience,
    getCardsForSelection,
    renderExperience,
    renderFront,
    renderBack,
    getConnectionChips,
    navigate,
    setIndex,
    flip,
    shuffleDeck
  });
}());

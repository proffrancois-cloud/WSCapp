(function initAlpacardsController(global) {
  "use strict";

  function requiredFunction(collection, name) {
    const value = collection ? collection[name] : null;
    if (typeof value !== "function") {
      throw new Error("WSC alpacards controller missing function dependency: " + name);
    }
    return value;
  }

  function createAlpacardsController(options = {}) {
    const {
      appState: state,
      refs = {},
      data = {},
      renderers = {},
      helpers = {},
      callbacks = {}
    } = options;

    if (!state) {
      throw new Error("WSC alpacards controller missing app state.");
    }

    const alpacardsMode = renderers.alpacardsMode || null;

    const escapeHtml = requiredFunction(helpers, "escapeHtml");
    const getSelectedSectionIds = requiredFunction(helpers, "getSelectedSectionIds");
    const getSelectionQuestions = requiredFunction(helpers, "getSelectionQuestions");
    const getTargetLabel = requiredFunction(helpers, "getTargetLabel");
    const normalizeSectionId = requiredFunction(helpers, "normalizeSectionId");
    const renderLearnCardFooterNav = requiredFunction(helpers, "renderLearnCardFooterNav");
    const renderPanelTitle = requiredFunction(helpers, "renderPanelTitle");
    const shuffle = requiredFunction(helpers, "shuffle");

    const renderExperience = requiredFunction(callbacks, "renderExperience");

    function getSourceCards() {
      const sourceCards = typeof data.getCards === "function" ? data.getCards() : data.cards;
      return Array.isArray(sourceCards) ? sourceCards : [];
    }

    function buildExperience() {
      const selectedCards = getCardsForSelection();
      return alpacardsMode?.buildExperience
        ? alpacardsMode.buildExperience(selectedCards, getTargetLabel())
        : {
            type: "alpacard",
            routeTitle: getTargetLabel(),
            cards: selectedCards,
            index: 0,
            flipped: false
          };
    }

    function getCardsForSelection() {
      const cards = getSourceCards();
      const selectedSectionIds = getSelectedSectionIds();
      if (alpacardsMode?.getCardsForSelection) {
        return alpacardsMode.getCardsForSelection({
          cards,
          selectedSectionIds,
          selection: state.selection,
          selectionQuestions: state.selection.lens === "section" ? [] : getSelectionQuestions(),
          normalizeSectionId
        });
      }

      if (state.selection.lens === "section" && selectedSectionIds.length) {
        const sectionIds = new Set(selectedSectionIds);
        return cards.filter((card) => sectionIds.has(normalizeSectionId(card.sectionId)));
      }

      if (!state.selection.lens || !state.selection.targetId || state.selection.targetId === "all") {
        return cards.slice();
      }

      if (state.selection.lens === "section") {
        const targetId = normalizeSectionId(state.selection.targetId);
        return cards.filter((card) => normalizeSectionId(card.sectionId) === targetId);
      }

      const sectionIds = new Set(getSelectionQuestions().map((question) => question.sectionId));
      return cards.filter((card) => sectionIds.has(normalizeSectionId(card.sectionId)));
    }

    function renderAlpacardExperience() {
      if (alpacardsMode?.renderExperience) {
        return alpacardsMode.renderExperience(state.experience, {
          escapeHtml,
          renderPanelTitle,
          renderLearnCardFooterNav
        });
      }

      const experience = state.experience;
      const experienceCards = experience.cards || [];
      const total = experienceCards.length;
      const current = total ? experienceCards[Math.min(experience.index, total - 1)] : null;
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
        <span class="alpacard-badge">${escapeHtml(current.category || "Recognition")}</span>
        <strong>${experience.index + 1} / ${total}</strong>
      </div>
      <article class="alpacard-stage ${experience.flipped ? "is-flipped" : ""}">
        ${experience.flipped ? renderBack(current) : renderFront(current)}
      </article>
      <div class="alpacard-controls">
        <button class="button secondary" type="button" data-alpacard-nav="previous">Previous</button>
        <button class="button primary" type="button" data-alpacard-flip><span>Flip</span></button>
        <button class="button secondary" type="button" data-alpacard-nav="next">Next</button>
      </div>
    </div>
    ${renderLearnCardFooterNav("alpacard")}
  `;
    }

    function renderFront(card) {
      if (alpacardsMode?.renderFront) {
        return alpacardsMode.renderFront(card, escapeHtml);
      }

      return `
    <div class="alpacard-card alpacard-front">
      <div class="alpacard-image-wrap">
        <img class="alpacard-image" src="./${escapeHtml(card.imagePath)}?v=20260520train" alt="${escapeHtml(card.title)}" loading="lazy" decoding="async" />
      </div>
    </div>
  `;
    }

    function renderBack(card) {
      if (alpacardsMode?.renderBack) {
        return alpacardsMode.renderBack(card, escapeHtml);
      }

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
    <div class="alpacard-card alpacard-back">
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
      if (alpacardsMode?.getConnectionChips) {
        return alpacardsMode.getConnectionChips(card);
      }

      return String(card.wscConnection || "")
        .split("·")
        .flatMap((part) => part.replace(/^\s*(Guiding section|Big ideas|Subjects):\s*/i, "").split("/"))
        .map((part) => part.trim())
        .filter(Boolean)
        .filter((part, index, all) => all.indexOf(part) === index);
    }

    function navigate(direction) {
      const didNavigate = alpacardsMode?.navigate
        ? alpacardsMode.navigate(state.experience, direction)
        : false;
      if (didNavigate) {
        renderOrSync({ scrollThumbnail: true });
        return;
      }

      if (!state.experience || state.experience.type !== "alpacard" || !state.experience.cards.length) {
        return;
      }

      const total = state.experience.cards.length;
      const currentIndex = Math.max(0, Math.min(total - 1, state.experience.index));
      const targetIndex = direction === "previous"
        ? (currentIndex - 1 + total) % total
        : (currentIndex + 1) % total;

      state.experience.flipped = false;
      state.experience.index = targetIndex;
      renderOrSync({ scrollThumbnail: true });
    }

    function setIndex(index) {
      const didSetIndex = alpacardsMode?.setIndex
        ? alpacardsMode.setIndex(state.experience, index)
        : false;
      if (didSetIndex) {
        renderOrSync({ scrollThumbnail: true });
        return;
      }

      if (!state.experience || state.experience.type !== "alpacard" || !state.experience.cards.length) {
        return;
      }

      const total = state.experience.cards.length;
      const targetIndex = Math.max(0, Math.min(total - 1, Math.trunc(Number(index) || 0)));
      if (targetIndex !== state.experience.index) {
        state.experience.flipped = false;
      }

      state.experience.index = targetIndex;
      renderOrSync({ scrollThumbnail: true });
    }

    function flip() {
      const didFlip = alpacardsMode?.flip
        ? alpacardsMode.flip(state.experience)
        : false;
      if (didFlip) {
        renderOrSync({ scrollThumbnail: false });
        return;
      }

      if (!state.experience || state.experience.type !== "alpacard") {
        return;
      }

      state.experience.flipped = !state.experience.flipped;
      renderOrSync({ scrollThumbnail: false });
    }

    function shuffleDeck() {
      const didShuffle = alpacardsMode?.shuffleDeck
        ? alpacardsMode.shuffleDeck(state.experience, shuffle)
        : false;
      if (didShuffle) {
        renderExperience();
        return;
      }

      if (!state.experience || state.experience.type !== "alpacard" || state.experience.cards.length < 2) {
        return;
      }

      state.experience.cards = shuffle([...state.experience.cards]);
      state.experience.index = 0;
      state.experience.flipped = false;
      renderExperience();
    }

    function renderOrSync(options = {}) {
      if (!syncCarouselState(options)) {
        renderExperience();
      }
    }

    function syncCarouselState(options = {}) {
      if (!refs.experiencePanel || !state.experience || state.experience.type !== "alpacard") {
        return false;
      }

      const experienceCards = Array.isArray(state.experience.cards) ? state.experience.cards : [];
      if (!experienceCards.length) {
        return false;
      }

      const total = experienceCards.length;
      const index = Math.max(0, Math.min(total - 1, Math.trunc(Number(state.experience.index) || 0)));
      state.experience.index = index;

      const current = experienceCards[index] || {};
      const track = refs.experiencePanel.querySelector("[data-alpacard-track]");
      const counter = refs.experiencePanel.querySelector("[data-alpacard-counter]");
      const category = refs.experiencePanel.querySelector("[data-alpacard-current-category]");
      const flipLabel = refs.experiencePanel.querySelector("[data-alpacard-flip-label]");
      const previousButton = refs.experiencePanel.querySelector('[data-alpacard-nav="previous"]');
      const nextButton = refs.experiencePanel.querySelector('[data-alpacard-nav="next"]');
      const slides = refs.experiencePanel.querySelectorAll("[data-alpacard-slide]");
      const thumbnails = refs.experiencePanel.querySelectorAll("[data-alpacard-index]");

      if (!track || !slides.length || !thumbnails.length) {
        return false;
      }

      track.style.transform = `translate3d(-${index * 100}%, 0, 0)`;

      slides.forEach((slide, slideIndex) => {
        const isActive = slideIndex === index;
        const stage = slide.querySelector("[data-alpacard-stage]");
        slide.classList.toggle("is-active", isActive);
        slide.setAttribute("aria-hidden", isActive ? "false" : "true");
        if (stage) {
          stage.classList.toggle("is-flipped", isActive && Boolean(state.experience.flipped));
        }
      });

      thumbnails.forEach((thumbnail, thumbnailIndex) => {
        const isActive = thumbnailIndex === index;
        thumbnail.classList.toggle("is-active", isActive);
        thumbnail.setAttribute("aria-current", isActive ? "true" : "false");
      });

      if (counter) {
        counter.textContent = `${index + 1} / ${total}`;
      }

      if (category) {
        category.textContent = current.category || "Recognition";
      }

      if (flipLabel) {
        flipLabel.textContent = "Flip";
      }

      if (previousButton) {
        previousButton.disabled = false;
      }

      if (nextButton) {
        nextButton.disabled = false;
      }

      if (options.scrollThumbnail !== false) {
        const activeThumbnail = refs.experiencePanel.querySelector(`[data-alpacard-index="${index}"]`);
        activeThumbnail?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
      }

      return true;
    }

    return Object.freeze({
      buildExperience,
      getCardsForSelection,
      renderExperience: renderAlpacardExperience,
      renderFront,
      renderBack,
      getConnectionChips,
      navigate,
      setIndex,
      flip,
      shuffleDeck,
      syncCarouselState
    });
  }

  global.WSC_CREATE_ALPACARDS_CONTROLLER = createAlpacardsController;
}(window));

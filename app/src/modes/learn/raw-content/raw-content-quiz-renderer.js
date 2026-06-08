(function () {
  function getPagerKey(entry, entryIndex, getSectionIdFromGuidingTitle) {
    return [
      "raw",
      entry?.sectionId || getSectionIdFromGuidingTitle(entry?.guidingSection || entry?.sectionTitle || "") || "section",
      entry?.id || entry?.title || "entry",
      entryIndex
    ].join("|");
  }

  function getPageIndex(pages, pagerKey, total) {
    const index = Number(pages?.[pagerKey]);
    if (!Number.isFinite(index) || total < 1) {
      return 0;
    }
    return Math.max(0, Math.min(total - 1, index));
  }

  function renderPager(entry, entryIndex, context, helpers) {
    const items = helpers.getVisibleQuizQuestionItems(entry);
    if (!items.length) {
      return "";
    }

    const pagerKey = getPagerKey(entry, entryIndex, helpers.getSectionIdFromGuidingTitle);
    const currentIndex = getPageIndex(context.pages, pagerKey, items.length);
    const escapeHtml = helpers.escapeHtml;

    return `
      <div class="raw-block raw-quiz-pager">
        <div class="raw-quiz-pager-head">
          <strong>Questions</strong>
          <span data-raw-question-current>Question ${currentIndex + 1} / ${items.length}</span>
        </div>
        <div
          class="mindmap-gallery raw-question-gallery ${items.length > 1 ? "has-multiple" : ""}"
          data-raw-question-gallery
          data-raw-question-pager="${escapeHtml(pagerKey)}"
          data-raw-question-total="${items.length}"
          aria-label="Question slideshow"
        >
          ${items.length > 1 ? `
            <button
              class="mindmap-gallery-nav mindmap-gallery-nav--previous raw-question-gallery-nav"
              type="button"
              data-raw-quiz-page="${escapeHtml(pagerKey)}"
              data-raw-quiz-direction="-1"
              data-raw-quiz-total="${items.length}"
              aria-label="Previous question"
              ${currentIndex === 0 ? "disabled" : ""}
            >
              <span aria-hidden="true">‹</span>
            </button>
            <button
              class="mindmap-gallery-nav mindmap-gallery-nav--next raw-question-gallery-nav"
              type="button"
              data-raw-quiz-page="${escapeHtml(pagerKey)}"
              data-raw-quiz-direction="1"
              data-raw-quiz-total="${items.length}"
              aria-label="Next question"
              ${currentIndex === items.length - 1 ? "disabled" : ""}
            >
              <span aria-hidden="true">›</span>
            </button>
          ` : ""}
          <div class="mindmap-gallery-track raw-question-gallery-track" data-raw-question-gallery-viewport>
            ${items.map((item, index) => `
              <div
                class="mindmap-gallery-slide raw-question-gallery-slide ${index === currentIndex ? "active" : ""}"
                data-raw-question-gallery-slide
                data-raw-question-index="${index}"
                aria-hidden="${index === currentIndex ? "false" : "true"}"
              >
                ${renderQuestion(item.question, entryIndex, item.questionIndex, context, helpers)}
              </div>
            `).join("")}
          </div>
        </div>
      </div>
    `;
  }

  function renderQuestion(question, entryIndex, questionIndex, context, helpers) {
    const escapeHtml = helpers.escapeHtml;
    const quizKey = getQuestionKey(question);
    const selectedIndex = context.selections?.[quizKey];
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
              class="raw-quiz-option ${getOptionStateClass(option, index, selectedIndex)}"
              type="button"
              data-raw-quiz-option="${index}"
              data-raw-quiz-key="${escapeHtml(quizKey)}"
              aria-pressed="${selectedIndex === index ? "true" : "false"}"
            >
              ${helpers.renderOptionToken(index)}
              <span>${escapeHtml(option.text)}</span>
            </button>
          `).join("")}
        </div>
        ${helpers.renderFeedback(question, selectedOption)}
      </article>
    `;
  }

  function getQuestionKey(question) {
    return `${question.level}|${question.prompt}|${question.correctAnswer}`;
  }

  function getOptionStateClass(option, index, selectedIndex) {
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

  window.WSC_RAW_CONTENT_QUIZ_RENDERER = Object.freeze({
    getPagerKey,
    getPageIndex,
    renderPager,
    renderQuestion,
    getQuestionKey,
    getOptionStateClass,
    stableShuffleByKey,
    hashString
  });
}());

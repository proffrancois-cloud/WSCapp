(function () {
  function renderExperience(experience, helpers) {
    if (!experience) {
      return "";
    }

    if (!experience.started) {
      return renderSetup(experience, helpers);
    }

    return renderQuestionPage(experience, helpers);
  }

  function renderSetup(experience, helpers) {
    return `
      ${helpers.renderPanelTitle("Scholar's Challenge", "", "")}
      <div class="mode-shell">
        <article class="setup-card quiz-setup-card">
          <div class="setup-card-header">
            ${helpers.renderConfiguredMascotAsset(
              helpers.getModeAssetPath("quiz"),
              "thinking",
              "medium",
              { alt: "Scholar's Challenge launch alpaca" }
            )}
            <div>
              <p class="challenge-label">Challenge practice</p>
              <h3>The selected guiding sections need questions for every difficulty.</h3>
            </div>
          </div>
          <p class="quiz-warning">${helpers.escapeHtml(experience.unavailableReason || "This route cannot build the fixed 15-question quiz yet.")}</p>
          <div class="panel-actions">
            <button class="button secondary" type="button" data-close-experience>Back to routes</button>
          </div>
        </article>
      </div>
      ${helpers.renderLearnCardFooterNav("quiz")}
    `;
  }

  function renderQuestionPage(experience, helpers) {
    const answeredCount = Object.keys(experience.selectedAnswers).length;
    const total = experience.questions.length;
    const canSubmit = answeredCount === total;
    const remainingNotice = canSubmit ? "" : helpers.getQuizRemainingNotice(experience);

    return `
      ${helpers.renderPanelTitle(
        "Scholar's Challenge",
        "",
        `${total} questions · ${answeredCount}/${total} answered`
      )}
      <div class="quiz-shell">
        <div class="quiz-question-list">
          ${experience.questions.map((question, questionIndex) => renderQuestionCard(question, questionIndex, experience, helpers)).join("")}
        </div>

        ${experience.submitted ? renderResultsFooter(experience, helpers) : ""}

        <div class="panel-actions quiz-actions">
          ${experience.submitted ? `
            <button class="button secondary" type="button" data-quiz-reset>New Challenge</button>
          ` : `
            <span class="quiz-submit-wrap ${canSubmit ? "" : "is-disabled"}" ${remainingNotice ? `data-quiz-tooltip="${helpers.escapeHtml(remainingNotice)}"` : ""}>
              <button
                class="button primary"
                type="button"
                data-quiz-submit
                data-quiz-incomplete="${canSubmit ? "false" : "true"}"
                ${remainingNotice ? `title="${helpers.escapeHtml(remainingNotice)}"` : ""}
              >
                Validate Answers
              </button>
            </span>
          `}
        </div>
      </div>
      ${helpers.renderLearnCardFooterNav("quiz")}
    `;
  }

  function renderResultsFooter(experience, helpers) {
    return `
      <article class="quiz-results-footer">
        <h3>Results</h3>
        <p>Total: ${helpers.escapeHtml(`${experience.score}/${experience.questions.length} correct`)}</p>
        <div class="quiz-difficulty-results">
          ${helpers.getQuizDifficultyResults(experience).filter((row) => row.total > 0).map((row) => `
            <span>Difficulty ${row.level} out of 5: ${row.correct}/${row.total} correct</span>
          `).join("")}
        </div>
      </article>
    `;
  }

  function renderQuestionCard(question, questionIndex, experience, helpers) {
    const selectedIndex = experience.selectedAnswers[questionIndex];
    const isSubmitted = experience.submitted;
    const isCorrect = isSubmitted && selectedIndex === question.answerIndex;

    return `
      <article class="raw-quiz-card quiz-question-card">
        <div class="raw-quiz-top quiz-question-top">
          <span class="raw-quiz-level">Difficulty ${Number(question.rawLevel) || 1} out of 5</span>
          <span class="meta-pill section">${helpers.escapeHtml(helpers.getSectionTitle(question) || question.guidingSection || "Guiding Section")}</span>
        </div>
        <p class="quiz-question-number">Question ${questionIndex + 1}</p>
        <p class="raw-quiz-prompt">${helpers.escapeHtml(question.prompt)}</p>
        <div class="raw-quiz-options">
          ${question.options.map((option, optionIndex) => {
            let classes = "raw-quiz-option option-button";
            if (selectedIndex === optionIndex) {
              classes += " active";
            }
            if (isSubmitted) {
              if (optionIndex === question.answerIndex) {
                classes += " correct";
              } else if (selectedIndex === optionIndex) {
                classes += " wrong";
              }
              classes += " disabled";
            }
            return `
              <button
                class="${classes}"
                type="button"
                data-quiz-question="${questionIndex}"
                data-quiz-option="${optionIndex}"
                ${isSubmitted ? "disabled" : ""}
              >
                ${helpers.renderOptionToken(optionIndex)}
                <span>${helpers.escapeHtml(option)}</span>
              </button>
            `;
          }).join("")}
        </div>
        ${isSubmitted ? renderQuestionFeedback(question, selectedIndex, isCorrect, helpers) : ""}
      </article>
    `;
  }

  function renderQuestionFeedback(question, selectedIndex, isCorrect, helpers) {
    const correctFeedback = question.visibleCorrectExplanation || question.explanation || "Correct.";
    if (isCorrect) {
      return `
        <div class="raw-quiz-feedback correct">
          <strong>Correct</strong>
          <p>${helpers.renderTextWithBreaks(correctFeedback)}</p>
        </div>
      `;
    }

    const wrongFeedback = Number.isInteger(selectedIndex)
      ? question.optionFeedback?.[selectedIndex] || "This option does not match the kept answer."
      : "No answer was selected.";
    const whyFeedback = question.visibleConnection || (
      question.explanation && question.explanation !== correctFeedback ? question.explanation : ""
    ) || question.visibleTakeaway || (
      question.correctAnswer
        ? "The kept answer matches the source entry for this question; the selected option changes or misses that point."
        : "The kept answer matches the source entry for this question, while the selected option changes or misses that point."
    );

    return `
      <div class="raw-quiz-feedback incorrect">
        <strong>Not quite</strong>
        <p>${helpers.renderTextWithBreaks(wrongFeedback)}</p>
        <p>${helpers.renderTextWithBreaks(correctFeedback)}</p>
        ${whyFeedback ? `<p>${helpers.renderTextWithBreaks(whyFeedback)}</p>` : ""}
      </div>
    `;
  }

  window.WSC_ALPAQUIZ_RENDERER = Object.freeze({
    renderExperience,
    renderSetup,
    renderQuestionPage,
    renderResultsFooter,
    renderQuestionCard,
    renderQuestionFeedback
  });
}());

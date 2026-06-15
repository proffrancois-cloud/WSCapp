(function initTrainPracticeController(global) {
  "use strict";

  function requireObject(value, name) {
    if (!value || typeof value !== "object") {
      throw new Error(`WSC train practice controller requires ${name}.`);
    }
    return value;
  }

  function requireFunction(collection, name) {
    const value = collection?.[name];
    if (typeof value !== "function") {
      throw new Error(`WSC train practice controller requires ${name}().`);
    }
    return value;
  }

  function createTrainPracticeController(options = {}) {
    const state = requireObject(options.appState, "appState");
    const data = requireObject(options.data, "data");
    const constants = options.constants || {};
    const services = options.services || {};
    const helpers = options.helpers || {};
    const callbacks = options.callbacks || {};

    const trainTips = constants.trainTips || {};
    const writingPracticeFormats = Array.isArray(constants.writingPracticeFormats)
      ? constants.writingPracticeFormats
      : ["Essay", "Story", "Letter", "Reflection"];
    const writingPhases = Array.isArray(constants.writingPhases) ? constants.writingPhases : [];
    const bowlRoundTypes = Array.isArray(constants.bowlRoundTypes) ? constants.bowlRoundTypes : [];
    const scholarsBowlService = services.scholarsBowlService || null;

    const escapeHtml = requireFunction(helpers, "escapeHtml");
    const getAssetValue = requireFunction(helpers, "getAssetValue");
    const getModeAssetPath = requireFunction(helpers, "getModeAssetPath");
    const getRawEntriesForSelection = requireFunction(helpers, "getRawEntriesForSelection");
    const getSelectedSectionIds = requireFunction(helpers, "getSelectedSectionIds");
    const getTargetLabel = requireFunction(helpers, "getTargetLabel");
    const renderAssetImage = requireFunction(helpers, "renderAssetImage");
    const renderLearnCardFooterNav = requireFunction(helpers, "renderLearnCardFooterNav");
    const renderMetricCard = requireFunction(helpers, "renderMetricCard");
    const renderOptionToken = requireFunction(helpers, "renderOptionToken");
    const renderPanelTitle = requireFunction(helpers, "renderPanelTitle");
    const renderResultsScreen = requireFunction(helpers, "renderResultsScreen");
    const renderTextWithBreaks = requireFunction(helpers, "renderTextWithBreaks");
    const versionAssetSrc = requireFunction(helpers, "versionAssetSrc");
    const renderExperience = requireFunction(callbacks, "renderExperience");

    function closeTip() {
      if (!state.experience) {
        return;
      }
      state.experience.tipDismissed = true;
      renderExperience();
    }

    function renderTipSummary(modeId) {
      const tip = trainTips[modeId];
      if (!tip) {
        return "";
      }

      return `
        <p class="train-tip-intro">${escapeHtml(tip.intro)}</p>
        <div class="train-criteria-grid" aria-label="What judges or the event reward">
          ${tip.judged.map((item) => `<span>${escapeHtml(item)}</span>`).join("")}
        </div>
        <div class="setup-rule-list train-tip-rule-list">
          ${tip.tips.map((item) => `<p>${escapeHtml(item)}</p>`).join("")}
        </div>
      `;
    }

    function renderTipPopup(modeId) {
      const tip = trainTips[modeId];
      if (!tip || state.selection.path !== "train" || !state.experience || state.experience.tipDismissed) {
        return "";
      }

      const assetPath = getModeAssetPath(modeId) || getAssetValue(["contexts", "paths", "train"]);

      return `
        <div class="question-popup-overlay train-tip" role="dialog" aria-modal="true">
          <div class="question-popup-window train-tip-window">
            <button class="popup-close-button" type="button" data-train-tip-close aria-label="Close tip">
              <span aria-hidden="true">&times;</span>
            </button>
            <div class="question-popup-stack">
              <article class="setup-card train-tip-card">
                <div class="setup-card-header">
                  ${renderAssetImage(
                    assetPath,
                    `${tip.title} tip alpaca`,
                    "mascot-slot mascot-slot-medium",
                    "mascot-asset mascot-asset-medium"
                  )}
                  <div>
                    <p class="challenge-label">${escapeHtml(tip.label)}</p>
                    <h3>${escapeHtml(tip.title)}</h3>
                  </div>
                </div>
                ${renderTipSummary(modeId)}
                <div class="panel-actions">
                  <button class="button primary" type="button" data-train-tip-close>Start training</button>
                </div>
              </article>
            </div>
          </div>
        </div>
      `;
    }

    function buildWritingPromptPool() {
      const entries = getRawEntriesForSelection();
      const selectedSections = getSelectedSectionIds()
        .map((sectionId) => data.sectionById[sectionId])
        .filter(Boolean);
      const fallbackEntries = selectedSections.length
        ? selectedSections.map((section) => ({
            title: section.title,
            sectionTitle: section.title,
            studentExplanation: section.blurb,
            takeaway: section.angle
          }))
        : [{
            title: data.theme.name,
            sectionTitle: "Full theme",
            studentExplanation: data.theme.summary,
            takeaway: data.theme.summary
          }];
      const sourceEntries = (entries.length ? entries : fallbackEntries).slice(0, 8);

      return sourceEntries.map((entry, index) => {
        const format = writingPracticeFormats[index % writingPracticeFormats.length];
        const title = entry.title || entry.subtopic || getTargetLabel();
        const sectionLabel = entry.sectionTitle || entry.sectionLabel || getTargetLabel();
        const focus = entry.takeaway || entry.studentExplanation || entry.whyItMatters || entry.rawOfficialText || data.theme.summary;
        const prompts = {
          Essay: `Argue whether "${title}" shows progress, unfinished change, or both.`,
          Story: `Write a story in which "${title}" becomes the turning point of a journey.`,
          Letter: `Write a letter from someone affected by "${title}", explaining what should happen next.`,
          Reflection: `Use "${title}" as a metaphor for something that is almost finished but still changing.`
        };

        return {
          format,
          title,
          sectionLabel,
          focus,
          prompt: prompts[format] || prompts.Essay
        };
      });
    }

    function buildWritingExperience() {
      const prompts = buildWritingPromptPool();

      return {
        type: "writing",
        title: "Collaborative Writing",
        prompts,
        promptIndex: 0,
        phase: "prep",
        tipDismissed: false
      };
    }

    function getCurrentWritingPrompt(experience = state.experience) {
      if (!experience || !Array.isArray(experience.prompts) || !experience.prompts.length) {
        return null;
      }
      return experience.prompts[experience.promptIndex % experience.prompts.length];
    }

    function buildBowlExperience() {
      const questions = buildScholarsBowlQuestions();

      return {
        type: "bowl",
        title: "Scholar's Bowl",
        questions,
        index: 0,
        started: false,
        selectedIndex: null,
        revealed: false,
        score: 0,
        streak: 0,
        bestStreak: 0,
        answers: [],
        finished: false,
        tipDismissed: false,
        unavailableReason: questions.length < 1
          ? "This route needs raw syllabus entries before Scholar's Bowl production can run."
          : null
      };
    }

    function buildScholarsBowlQuestions() {
      const entries = getRawEntriesForSelection();
      if (scholarsBowlService?.buildProductionSet) {
        return scholarsBowlService.buildProductionSet(entries, {
          routeTitle: getTargetLabel(),
          selectedSectionIds: getSelectedSectionIds(),
          limit: 12
        }, {
          sectionById: data.sectionById
        });
      }

      return [];
    }

    function getBowlRoundType(index) {
      return bowlRoundTypes[index % bowlRoundTypes.length];
    }

    function getCurrentBowlQuestion(experience = state.experience) {
      if (!experience || !Array.isArray(experience.questions) || !experience.questions.length) {
        return null;
      }
      return experience.questions[Math.min(experience.index, experience.questions.length - 1)];
    }

    function shortenText(value, maxLength = 260) {
      const text = String(value || "").replace(/\s+/g, " ").trim();
      if (text.length <= maxLength) {
        return text;
      }
      return `${text.slice(0, maxLength - 1).trim()}...`;
    }

    function renderWritingPhaseButton(phase, activePhaseId) {
      const active = phase.id === activePhaseId;
      return `
        <button class="train-phase-button ${active ? "active" : ""}" type="button" data-writing-phase="${escapeHtml(phase.id)}">
          <span>${escapeHtml(phase.time)}</span>
          <strong>${escapeHtml(phase.title)}</strong>
          <em>${escapeHtml(phase.body)}</em>
        </button>
      `;
    }

    function renderWritingExperience() {
      const experience = state.experience;
      const prompt = getCurrentWritingPrompt(experience);

      if (!prompt) {
        return `
          ${renderPanelTitle("Collaborative Writing", "Practice the WSC writing event with a timed plan-draft-review flow.", "")}
          <div class="mode-shell">
            <article class="setup-card">
              <div class="setup-card-header">
                ${renderAssetImage(
                  getModeAssetPath("writing"),
                  "Collaborative Writing alpaca",
                  "mascot-slot mascot-slot-medium",
                  "mascot-asset mascot-asset-medium"
                )}
                <div>
                  <p class="challenge-label">Route update pending</p>
                  <h3>This route needs study content before writing practice can build prompts.</h3>
                </div>
              </div>
            </article>
          </div>
          ${renderTipPopup("writing")}
        `;
      }

      const currentPhase = writingPhases.find((phase) => phase.id === experience.phase) || writingPhases[0];
      const nextLabel = experience.prompts.length > 1 ? "New prompt" : "Keep prompt";

      return `
        ${renderPanelTitle(
          "Collaborative Writing",
          "Practice a WSC writing cycle: team planning, solo drafting, then focused teammate feedback.",
          `Route: ${getTargetLabel()} · Prompt ${experience.promptIndex + 1} of ${experience.prompts.length}`
        )}
        <div class="mode-shell train-practice-shell">
          <section class="train-practice-layout">
            <article class="train-practice-main train-writing-prompt">
              <div class="question-meta">
                <span class="meta-pill section">${escapeHtml(prompt.sectionLabel)}</span>
                <span class="meta-pill subject">${escapeHtml(prompt.format)}</span>
                <span class="meta-pill timer">${escapeHtml(currentPhase.time)}</span>
              </div>
              <p class="challenge-label">${escapeHtml(currentPhase.title)}</p>
              <h3>${escapeHtml(prompt.prompt)}</h3>
              <p>${escapeHtml(shortenText(prompt.focus))}</p>
              <div class="train-writing-checklist">
                <span>Prompt stays central</span>
                <span>Curriculum evidence appears naturally</span>
                <span>Ending feels intentional</span>
              </div>
              <div class="panel-actions">
                <button class="button secondary" type="button" data-writing-next-prompt ${experience.prompts.length > 1 ? "" : "disabled"}>${escapeHtml(nextLabel)}</button>
              </div>
            </article>

            <aside class="train-practice-side">
              <section class="train-side-section">
                <h3>Practice flow</h3>
                <div class="train-phase-list">
                  ${writingPhases.map((phase) => renderWritingPhaseButton(phase, experience.phase)).join("")}
                </div>
              </section>
              <section class="train-side-section">
                <h3>Judge check</h3>
                <div class="train-criteria-grid compact">
                  ${trainTips.writing.judged.map((item) => `<span>${escapeHtml(item)}</span>`).join("")}
                </div>
                <div class="setup-rule-list train-tip-rule-list">
                  <p>Clarity: readable structure, prompt focus, and clean enough language.</p>
                  <p>Content: relevant ideas, smart examples, and WSC connections.</p>
                  <p>Style and originality: a voice, form, or angle worth remembering.</p>
                </div>
              </section>
            </aside>
          </section>
          ${renderLearnCardFooterNav("writing")}
        </div>
        ${renderTipPopup("writing")}
      `;
    }

    function renderBowlOption(question, option, index, experience) {
      let classes = "raw-quiz-option option-button bowl-option-button";
      if (index === experience.selectedIndex) {
        classes += " active";
      }
      if (experience.revealed && index === question.answerIndex) {
        classes += " correct";
      } else if (experience.revealed && index === experience.selectedIndex) {
        classes += " wrong";
      }

      return `
        <button class="${classes}" type="button" data-bowl-option="${index}" ${experience.revealed ? "disabled" : ""}>
          ${renderOptionToken(index)}
          <span>${escapeHtml(option)}</span>
        </button>
      `;
    }

    function renderBowlFlowBar() {
      const steps = scholarsBowlService?.flowSteps || ["Media stimulus", "Connection logic", "Syllabus target", "Question", "Answer"];
      return `
        <div class="bowl-flow-bar" aria-label="Scholar's Bowl production flow">
          ${steps.map((step, index) => `
            <span>
              <strong>${index + 1}</strong>
              ${escapeHtml(step)}
            </span>
          `).join("")}
        </div>
      `;
    }

    function renderBowlSetup(experience) {
      return `
        <article class="setup-card train-bowl-setup scholars-bowl-setup">
          <div class="setup-card-header">
            ${renderAssetImage(
              getModeAssetPath("bowl"),
              "Scholar's Bowl launch alpaca",
              "mascot-slot mascot-slot-medium",
              "mascot-asset mascot-asset-medium"
            )}
            <div>
              <p class="challenge-label">Stimulus-first production</p>
              <h3>Build Bowl questions where the media is the clue, bridge, trap, source, or emotional setup.</h3>
            </div>
          </div>
          ${renderBowlFlowBar()}
          <div class="setup-rule-list">
            <p>Each produced item starts with a media stimulus before it names the syllabus target.</p>
            <p>The target may be one entry, several entries, a guiding section, or one larger WSC idea.</p>
            <p>The built-in quality gate rejects ID-only questions and decorative media.</p>
          </div>
          <div class="panel-actions">
            <button class="button primary" type="button" data-bowl-start>Open production set</button>
            <span class="bowl-produced-count">${escapeHtml(`${experience.questions.length} Bowl cards produced`)}</span>
          </div>
        </article>
      `;
    }

    function renderBowlStimulusCard(question, roundType) {
      const media = question.media || {};
      const hooks = Array.isArray(media.hooks) ? media.hooks.slice(0, 6) : [];
      const sourceLinks = Array.isArray(media.sourceLinks) ? media.sourceLinks.slice(0, 4) : [];
      if (media.sourceUrl) {
        sourceLinks.unshift({
          label: media.sourceLabel || "Open source",
          url: media.sourceUrl
        });
      }
      const resourcePills = [
        media.resourceDecision,
        media.credit,
        media.licenseOrUseNote
      ].filter(Boolean);
      return `
        <section class="bowl-stimulus-card" aria-label="Media stimulus">
          <div class="bowl-stimulus-head">
            <span class="bowl-media-kind">${escapeHtml(media.kind || "media stimulus")}</span>
            <span class="bowl-media-role">${escapeHtml(media.role || roundType.title)}</span>
          </div>
          ${media.localPath ? `
            <figure class="bowl-stimulus-media-frame">
              <img src="${escapeHtml(versionAssetSrc(media.localPath))}" alt="${escapeHtml(media.altText || media.title || "Scholar's Bowl media stimulus")}" loading="lazy" decoding="async" />
            </figure>
          ` : ""}
          <h3>${escapeHtml(media.title || "Media stimulus")}</h3>
          <p>${escapeHtml(media.description || "A stimulus is shown before the question.")}</p>
          ${media.cue ? `<div class="bowl-stimulus-cue">${escapeHtml(media.cue)}</div>` : ""}
          ${resourcePills.length ? `
            <div class="bowl-resource-row" aria-label="Media resource details">
              ${resourcePills.map((pill) => `<span>${escapeHtml(pill)}</span>`).join("")}
            </div>
          ` : ""}
          ${sourceLinks.length ? `
            <div class="bowl-source-row" aria-label="Reference sources">
              ${sourceLinks.map((link) => `
                <a href="${escapeHtml(link.url)}" target="_blank" rel="noreferrer">${escapeHtml(link.label || link.url)}</a>
              `).join("")}
            </div>
          ` : ""}
          ${hooks.length ? `
            <div class="bowl-hook-row" aria-label="Possible official hooks">
              ${hooks.map((hook) => `<span>${escapeHtml(hook)}</span>`).join("")}
            </div>
          ` : ""}
        </section>
      `;
    }

    function renderBowlTargetCard(target) {
      const chips = [
        target.sectionLabel,
        ...(target.bigIdeaLabels || []).slice(0, 2),
        ...(target.subjectLabels || []).slice(0, 1)
      ].filter(Boolean);

      return `
        <article class="bowl-target-card">
          <strong>${escapeHtml(target.title)}</strong>
          ${target.focus ? `<p>${escapeHtml(shortenText(target.focus, 170))}</p>` : ""}
          <div class="bowl-target-chip-row">
            ${chips.slice(0, 4).map((chip) => `<span>${escapeHtml(chip)}</span>`).join("")}
          </div>
        </article>
      `;
    }

    function renderBowlProductionLedger(question) {
      const targets = Array.isArray(question.targets) ? question.targets : [];
      const gates = Array.isArray(question.qualityGate) ? question.qualityGate : [];
      return `
        <section class="train-side-section">
          <h3>Syllabus targets</h3>
          <div class="bowl-target-list">
            ${targets.map(renderBowlTargetCard).join("")}
          </div>
        </section>
        <section class="train-side-section">
          <h3>Media-matters gate</h3>
          <div class="setup-rule-list train-tip-rule-list">
            ${gates.map((gate) => `<p>${escapeHtml(gate)}</p>`).join("")}
          </div>
        </section>
      `;
    }

    function renderBowlReveal(question, experience) {
      if (!experience.revealed) {
        return "";
      }

      const correct = experience.selectedIndex === question.answerIndex;
      const feedback = correct
        ? "Correct connection."
        : "Not this time. The trap is usually making the stimulus decorative, too literal, or too narrow.";

      return `
        <div class="bowl-reveal ${correct ? "correct" : "wrong"}">
          <strong>${escapeHtml(feedback)}</strong>
          <p>${renderTextWithBreaks(question.visibleCorrectExplanation || question.correctAnswer || "")}</p>
          ${question.connectionLogic ? `<p>${renderTextWithBreaks(question.connectionLogic)}</p>` : ""}
          <div class="panel-actions">
            <button class="button primary" type="button" data-bowl-next>${experience.index >= experience.questions.length - 1 ? "Show results" : "Next Bowl card"}</button>
          </div>
        </div>
      `;
    }

    function renderBowlExperience() {
      const experience = state.experience;

      if (experience.finished) {
        return renderResultsScreen({
          title: "Scholar's Bowl Results",
          subtitle: "Stimulus-first calls, connection logic, and a media-matters check after each reveal.",
          answers: experience.answers,
          failed: false,
          resultState: "success",
          primaryMetricLabel: "Team Score",
          primaryMetricValue: String(experience.score),
          secondaryMetricLabel: "Correct Calls",
          secondaryMetricValue: `${experience.answers.filter((answer) => answer.isCorrect).length}/${experience.answers.length}`,
          tertiaryMetricLabel: "Best Streak",
          tertiaryMetricValue: String(experience.bestStreak),
          quaternaryMetricLabel: "Current Route",
          quaternaryMetricValue: getTargetLabel()
        });
      }

      if (experience.unavailableReason) {
        return `
          ${renderPanelTitle("Scholar's Bowl", "Produce media-stimulus questions that lead into WSC connections.", "")}
          <div class="mode-shell">
            <article class="setup-card">
              <div class="setup-card-header">
                ${renderAssetImage(
                  getModeAssetPath("bowl"),
                  "Scholar's Bowl alpaca",
                  "mascot-slot mascot-slot-medium",
                  "mascot-asset mascot-asset-medium"
                )}
                <div>
                  <p class="challenge-label">Route update pending</p>
                  <h3>${escapeHtml(experience.unavailableReason)}</h3>
                </div>
              </div>
            </article>
          </div>
          ${renderTipPopup("bowl")}
        `;
      }

      const question = getCurrentBowlQuestion(experience);
      const roundType = getBowlRoundType(experience.index);
      const targetCount = Array.isArray(question?.targets) ? question.targets.length : 0;

      return `
        ${renderPanelTitle(
          "Scholar's Bowl",
          "Media stimulus to connection logic to syllabus target to question to answer.",
          `Route: ${getTargetLabel()} · Bowl card ${experience.index + 1} of ${experience.questions.length}`
        )}
        <div class="mode-shell train-practice-shell">
          ${!experience.started ? renderBowlSetup(experience) : `
            <section class="train-practice-layout">
              <article class="train-practice-main train-bowl-question scholars-bowl-card">
                <div class="question-meta">
                  <span class="meta-pill section">${escapeHtml(roundType.title)}</span>
                  <span class="meta-pill subject">${escapeHtml(`${targetCount} target${targetCount === 1 ? "" : "s"}`)}</span>
                  <span class="meta-pill timer">${escapeHtml(roundType.time)}</span>
                </div>
                ${renderBowlStimulusCard(question, roundType)}
                ${renderBowlFlowBar()}
                <p class="challenge-label">${escapeHtml(roundType.body)}</p>
                <h3>${escapeHtml(question.prompt)}</h3>
                <div class="raw-quiz-options">
                  ${question.options.map((option, index) => renderBowlOption(question, option, index, experience)).join("")}
                </div>
                ${renderBowlReveal(question, experience)}
              </article>

              <aside class="train-practice-side scholars-bowl-side">
                <section class="train-side-section train-bowl-score">
                  <h3>Team board</h3>
                  <div class="result-metrics compact">
                    ${renderMetricCard("Score", experience.score)}
                    ${renderMetricCard("Streak", experience.streak)}
                    ${renderMetricCard("Best", experience.bestStreak)}
                  </div>
                </section>
                ${renderBowlProductionLedger(question)}
              </aside>
            </section>
          `}
          ${renderLearnCardFooterNav("bowl")}
        </div>
        ${renderTipPopup("bowl")}
      `;
    }

    return {
      buildBowlExperience,
      buildScholarsBowlQuestions,
      buildWritingExperience,
      buildWritingPromptPool,
      closeTip,
      getBowlRoundType,
      getCurrentBowlQuestion,
      getCurrentWritingPrompt,
      renderBowlExperience,
      renderBowlFlowBar,
      renderBowlOption,
      renderBowlProductionLedger,
      renderBowlReveal,
      renderBowlSetup,
      renderBowlStimulusCard,
      renderBowlTargetCard,
      renderTipPopup,
      renderTipSummary,
      renderWritingExperience,
      renderWritingPhaseButton,
      shortenText
    };
  }

  global.WSC_CREATE_TRAIN_PRACTICE_CONTROLLER = createTrainPracticeController;
})(window);

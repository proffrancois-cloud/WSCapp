(function () {
  function renderWizard(context, helpers) {
    const stepNumber = getCurrentStepNumber(context);
    const step = getStepDefinition(stepNumber, context, helpers);

    return {
      title: step.title,
      railHtml: "",
      stepsHtml: context.selection.mode
        ? ""
        : `
          <div class="step-page-shell">
            ${renderStepPanel(stepNumber, step.title, step.helper, step.content, step.gridClass, context, helpers)}
          </div>
        `
    };
  }

  function renderStepPanel(_index, _title, _helper, content, gridClass, context, helpers) {
    return `
      <section class="step-panel page-${helpers.escapeHtml(context.ui.wizardTransition)}">
        <div class="step-grid ${gridClass}">${content}</div>
      </section>
    `;
  }

  function getCurrentStepNumber(context) {
    return 2;
  }

  function getStepDefinition(stepNumber, context, helpers) {
    if (stepNumber === 1) {
      return {
        title: "Select your Guiding Section(s)",
        helper: "",
        content: renderTargetCards(context, helpers),
        gridClass: "target-grid lens-section"
      };
    }

    return {
      title: "",
      helper: "",
      content: renderModeChoiceBoard(context, helpers),
      gridClass: "mode-landing-grid"
    };
  }

  function renderWizardRail(currentStep, context, helpers) {
    const progressPercent = Math.round((getCompletionDepth(context) / context.wizardTotalSteps) * 100);
    const steps = getRailItems(context, helpers);

    return `
      <aside class="wizard-rail wizard-rail-inline" aria-label="Route progress">
        <div class="wizard-rail-progress" aria-hidden="true">
          <span style="height:${progressPercent}%"></span>
        </div>
        <div class="wizard-rail-items">
          ${steps.map((item) => renderWizardRailItem(item, currentStep, context, helpers)).join("")}
        </div>
      </aside>
    `;
  }

  function renderWizardRailItem(item, currentStep, context, helpers) {
    const status = item.step === currentStep ? "active" : item.step < currentStep ? "done" : "upcoming";
    const clickable = item.step < currentStep || (item.step === 4 && Boolean(context.selection.mode));

    return `
      <button
        class="wizard-rail-item ${status}"
        type="button"
        ${clickable ? `data-go-step="${item.step}"` : "disabled"}
        ${item.step === currentStep ? 'aria-current="step"' : ""}
      >
        <span class="wizard-rail-dot" aria-hidden="true"></span>
        <span class="wizard-rail-copy">
          <span class="wizard-rail-title">${helpers.escapeHtml(item.title)}</span>
          <span class="wizard-rail-value">${helpers.escapeHtml(item.value)}</span>
        </span>
      </button>
    `;
  }

  function getRailItems(context, helpers) {
    const targetLabel = context.selection.targetId ? helpers.getTargetLabel() : "Pick your next stop";
    const defaultModeLabel = "Learn, Play, or Train";
    const modeLabel = context.selection.mode ? helpers.getModeOption(context.selection.mode).title : defaultModeLabel;

    return [
      { step: 1, title: "Select your Guiding Section(s)", value: targetLabel },
      { step: 2, title: "", value: modeLabel }
    ];
  }

  function getCompletionDepth(context) {
    let depth = 0;
    if (context.selection.targetId) {
      depth += 1;
    }
    if (context.selection.mode) {
      depth += 1;
    }
    return depth;
  }

  function renderPathCards(context, helpers) {
    return context.pathOptions.map((option) => {
      const active = context.selection.path === option.id;
      return `
        <button class="choice-card wizard-choice-card ${active ? "active" : ""}" data-pick-path="${option.id}">
          <div class="card-top">
            ${helpers.renderConfiguredMascotAsset(
              helpers.getWizardCardAsset(helpers.getAssetValue(["contexts", "paths", option.id])),
              option.mood,
              "small",
              {
                alt: `${option.title} route alpaca`,
                reviewBadge: helpers.getPathReviewBadge(option.id),
                slotClass: "wizard-choice-slot",
                imageClass: "wizard-choice-image"
              }
            )}
            <div class="wizard-choice-copy">
              <h3>${helpers.escapeHtml(option.title)}</h3>
            </div>
          </div>
        </button>
      `;
    }).join("");
  }

  function renderLensCards(context, helpers) {
    const orderedLensIds = ["section", "bigidea", "subject"];
    const orderedOptions = orderedLensIds
      .map((id) => context.lensOptions.find((option) => option.id === id))
      .filter(Boolean);

    return orderedOptions.map((option) => {
      const active = context.selection.lens === option.id;
      const fallbackMood = option.id === "subject" ? "wise" : "happy";
      return `
        <button class="choice-card wizard-choice-card ${active ? "active" : ""}" data-pick-lens="${option.id}">
          <div class="card-top">
            ${helpers.renderConfiguredMascotAsset(
              helpers.getWizardCardAsset(helpers.getAssetValue(["contexts", "lenses", option.id])),
              fallbackMood,
              "small",
              {
                alt: `${option.title} lens alpaca`,
                reviewBadge: helpers.getLensReviewBadge(option.id),
                slotClass: "wizard-choice-slot",
                imageClass: "wizard-choice-image"
              }
            )}
            <div class="wizard-choice-copy">
              <h3>${helpers.escapeHtml(option.title.replace(/^By\s+/i, ""))}</h3>
            </div>
          </div>
        </button>
      `;
    }).join("");
  }

  function renderTargetCards(context, helpers) {
    const selectedIds = helpers.getSelectedSectionIds();
    const canContinue = selectedIds.length > 0;
    const cards = helpers.getTargetOptions().map((option) => {
      const active = selectedIds.includes(option.id);
      const targetAsset = helpers.getWizardCardAsset(helpers.getTargetAssetPath(option.id));
      return `
        <button
          class="target-card wizard-choice-card selectable-target-card ${active ? "active selected" : ""}"
          type="button"
          data-pick-target="${option.id}"
          aria-pressed="${active ? "true" : "false"}"
        >
          <span class="target-select-dot" aria-hidden="true"></span>
          <div class="card-top">
            ${helpers.renderConfiguredMascotAsset(
              targetAsset,
              option.mood,
              "small",
              {
                alt: `${option.title} route alpaca`,
                reviewBadge: helpers.getTargetReviewBadge(option.id),
                slotClass: "wizard-choice-slot",
                imageClass: "wizard-choice-image"
              }
            )}
            <div class="wizard-choice-copy">
              <h3>${helpers.escapeHtml(option.title)}</h3>
            </div>
          </div>
        </button>
      `;
    }).join("");

    return `
      ${cards}
      <div class="target-next-row">
        <button class="button primary" type="button" data-target-next ${canContinue ? "" : "disabled"}>Next</button>
      </div>
    `;
  }

  function renderModeCards(context, helpers) {
    const options = helpers.getVisibleModeOptions();

    return options.map((option) => {
      const pathId = helpers.getModePath(option.id) || context.selection.path || "learn";
      const active = context.selection.mode === option.id;
      return `
        <button class="mode-card wizard-choice-card ${active ? "active" : ""}" data-pick-mode="${option.id}" data-pick-mode-path="${pathId}">
          <div class="card-top">
            ${helpers.renderConfiguredMascotAsset(
              helpers.getWizardCardAsset(helpers.getModeAssetPath(option.id)),
              option.mood,
              "small",
              {
                alt: `${option.title} mode alpaca`,
                reviewBadge: helpers.getModeReviewBadge(option.id),
                slotClass: "wizard-choice-slot",
                imageClass: "wizard-choice-image"
              }
            )}
            <div class="wizard-choice-copy">
              <h3>${helpers.escapeHtml(option.title)}</h3>
              ${option.meta ? `<p class="mode-card-thanks">${helpers.escapeHtml(option.meta)}</p>` : ""}
            </div>
          </div>
        </button>
      `;
    }).join("");
  }

  function renderModeChoiceBoard(context, helpers) {
    const hasSelection = helpers.getSelectedSectionIds().length > 0;
    const openPath = hasSelection && ["learn", "play", "train"].includes(context.ui.openModeChoicePath)
      ? context.ui.openModeChoicePath
      : null;
    return `
      <div class="mode-choice-shell">
        <div class="mode-choice-picker-row">
          ${renderHubModeSwitch(context, helpers)}
          ${renderGuidingSectionPickerStrip(context, helpers)}
        </div>
        <div class="mode-choice-board ${hasSelection ? "has-section-selection" : "no-section-selection"}" ${openPath ? `data-active-path="${helpers.escapeHtml(openPath)}"` : ""}>
          ${renderModeChoiceColumn("learn", "Learn", helpers.getAssetValue(["contexts", "paths", "learn"]), helpers.getVisibleModeOptionsForPath("learn"), context, helpers, openPath)}
          ${renderModeChoiceColumn("play", "Play", helpers.getAssetValue(["contexts", "paths", "play"]), helpers.getVisibleModeOptionsForPath("play"), context, helpers, openPath)}
          ${renderModeChoiceColumn("train", "Train", helpers.getAssetValue(["contexts", "paths", "train"]), helpers.getVisibleModeOptionsForPath("train"), context, helpers, openPath)}
        </div>
      </div>
    `;
  }

  function renderHubModeSwitch(context, helpers) {
    const switchTarget = context.ui.appShellMode === "online" ? "local" : "online";
    const label = switchTarget === "online" ? "Explore preview" : "Study solo";
    const icon = helpers.getAppModeSwitchIcon
      ? helpers.getAppModeSwitchIcon()
      : helpers.getAssetValue(["contexts", "paths", "play"]);
    const actionAttribute = switchTarget === "online"
      ? "data-open-alpaca-online-campus"
      : "data-open-app-entry-gate";

    return `
      <button
        class="hub-mode-switch"
        type="button"
        ${actionAttribute}
        aria-label="${helpers.escapeHtml(label)}"
        title="${helpers.escapeHtml(label)}"
      >
        <img src="${helpers.escapeHtml(icon)}" alt="" aria-hidden="true" />
        <span>${helpers.escapeHtml(label)}</span>
      </button>
    `;
  }

  function renderGuidingSectionPickerStrip(context, helpers) {
    const selectedIds = helpers.getSelectedSectionIds();
    const targetOptions = helpers.getTargetOptions();
    if (!targetOptions.length) {
      return "";
    }

    const selected = new Set(selectedIds);
    const renderSectionChip = (option, active) => {
      return `
        <button
          class="selected-section-chip ${active ? "active" : ""}"
          type="button"
          data-toggle-mode-section="${helpers.escapeHtml(option.id)}"
          data-section-title="${helpers.escapeHtml(option.title)}"
          aria-pressed="${active ? "true" : "false"}"
          aria-label="${active ? "Remove" : "Add"} ${helpers.escapeHtml(option.title)} ${active ? "from" : "to"} this route"
        >
          ${helpers.renderConfiguredMascotAsset(
            helpers.getWizardCardAsset(helpers.getTargetAssetPath(option.id)),
            option.mood,
            "small",
            {
              alt: "",
              slotClass: "selected-section-chip-slot",
              imageClass: "selected-section-chip-image"
            }
          )}
          <span>${helpers.escapeHtml(option.title)}</span>
        </button>
      `;
    };
    const availableChips = targetOptions
      .filter((option) => !selected.has(option.id))
      .map((option) => renderSectionChip(option, false))
      .join("");
    const selectedChips = targetOptions
      .filter((option) => selected.has(option.id))
      .map((option) => renderSectionChip(option, true))
      .join("");

    return `
      <div class="selected-section-chip-strip" aria-label="Guiding sections for this route">
        ${availableChips}
      </div>
      ${selectedChips ? `
        <div class="selected-section-selected-row" aria-label="Selected guiding sections">
          ${selectedChips}
        </div>
      ` : ""}
    `;
  }

  function renderModeChoiceColumn(pathId, title, asset, options, context, helpers, openPath = null) {
    const headingMood = pathId === "learn" ? "wise" : pathId === "train" ? "excited" : "determined";
    const hasSelection = helpers.getSelectedSectionIds().length > 0;
    const isOpen = openPath === pathId;

    return `
      <section class="mode-choice-column mode-choice-column-${helpers.escapeHtml(pathId)} ${isOpen ? "is-open" : ""}" data-mode-choice-path="${helpers.escapeHtml(pathId)}">
        <button
          class="mode-choice-heading"
          type="button"
          data-toggle-mode-menu="${helpers.escapeHtml(pathId)}"
          aria-expanded="${isOpen ? "true" : "false"}"
          aria-label="${isOpen ? "Close" : "Open"} ${helpers.escapeHtml(title)} menu"
          ${hasSelection ? "" : "disabled"}
        >
          ${helpers.renderConfiguredMascotAsset(asset, headingMood, "small", {
            alt: `${title} alpaca`,
            slotClass: "mode-choice-heading-slot",
            imageClass: "mode-choice-heading-image"
          })}
          <h3>${helpers.escapeHtml(title)}</h3>
        </button>
        <div class="mode-choice-card-grid">
          ${options.map((option) => renderModeChoiceCard(option, pathId, context, helpers)).join("")}
        </div>
      </section>
    `;
  }

  function renderModeChoiceCard(option, pathId, context, helpers) {
    const active = context.selection.mode === option.id;
    const hasSelection = helpers.getSelectedSectionIds().length > 0;
    const unavailable = Boolean(option.unavailableReason);
    const disabled = !hasSelection || unavailable;
    const meta = unavailable ? "Available soon" : option.meta;
    return `
      <button
        class="mode-card wizard-choice-card ${active ? "active" : ""} ${disabled ? "disabled" : ""} ${unavailable ? "unavailable" : ""}"
        data-pick-mode="${option.id}"
        data-pick-mode-path="${pathId}"
        ${disabled ? "disabled" : ""}
        ${unavailable ? `title="${helpers.escapeHtml(option.unavailableReason)}"` : ""}
      >
        <div class="card-top">
          ${helpers.renderConfiguredMascotAsset(
            helpers.getWizardCardAsset(helpers.getModeAssetPath(option.id)),
            option.mood,
            "small",
            {
              alt: `${option.title} mode alpaca`,
              reviewBadge: helpers.getModeReviewBadge(option.id),
              slotClass: "wizard-choice-slot",
              imageClass: "wizard-choice-image"
            }
          )}
          <div class="wizard-choice-copy">
            <h3>${helpers.escapeHtml(option.title)}</h3>
            ${meta ? `<p class="mode-card-thanks">${helpers.escapeHtml(meta)}</p>` : ""}
          </div>
        </div>
      </button>
    `;
  }

  window.WSC_WIZARD_RENDERER = Object.freeze({
    renderWizard,
    renderStepPanel,
    getCurrentStepNumber,
    getStepDefinition,
    renderWizardRail,
    renderWizardRailItem,
    getRailItems,
    getCompletionDepth,
    renderPathCards,
    renderLensCards,
    renderTargetCards,
    renderModeCards,
    renderModeChoiceBoard,
    renderHubModeSwitch,
    renderGuidingSectionPickerStrip,
    renderModeChoiceColumn,
    renderModeChoiceCard
  });
}());

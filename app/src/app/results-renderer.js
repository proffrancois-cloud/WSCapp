(function initResultsRenderer(global) {
  "use strict";

  function requireObject(value, name) {
    if (!value || typeof value !== "object") {
      throw new Error(`WSC results renderer requires ${name}.`);
    }
    return value;
  }

  function requireFunction(collection, name) {
    const value = collection?.[name];
    if (typeof value !== "function") {
      throw new Error(`WSC results renderer requires ${name}().`);
    }
    return value;
  }

  function createResultsRenderer(options = {}) {
    const state = requireObject(options.appState, "appState");
    const data = requireObject(options.data, "data");
    const helpers = options.helpers || {};
    const bigIdeaRoutes = Array.isArray(options.bigIdeaRoutes) ? options.bigIdeaRoutes : [];

    const escapeHtml = requireFunction(helpers, "escapeHtml");
    const getAccuracy = requireFunction(helpers, "getAccuracy");
    const getMindMapLensLabel = requireFunction(helpers, "getMindMapLensLabel");
    const getPerformanceMood = requireFunction(helpers, "getPerformanceMood");
    const getPerformanceRating = requireFunction(helpers, "getPerformanceRating");
    const getResultAssetPath = requireFunction(helpers, "getResultAssetPath");
    const getTargetLabel = requireFunction(helpers, "getTargetLabel");
    const renderConfiguredMascotAsset = requireFunction(helpers, "renderConfiguredMascotAsset");
    const renderExperienceCloseButton = requireFunction(helpers, "renderExperienceCloseButton");
    const renderPanelTitle = requireFunction(helpers, "renderPanelTitle");

    function renderResultsScreen(config) {
      const rating = getPerformanceRating(getAccuracy(config.answers));
      const mood = getPerformanceMood(getAccuracy(config.answers));
      const resultMascotSize = mood === "victory" ? "large" : "medium";
      const contextualResultAsset = getResultAssetPath(
        state.experience?.type,
        config.resultState || (config.failed ? "fail" : "success")
      );
      const visualMarkup = config.visualHtml || renderConfiguredMascotAsset(
        contextualResultAsset,
        mood,
        resultMascotSize,
        { alt: `${state.experience?.type || "route"} result alpaca` }
      );
      const metrics = Array.isArray(config.metrics)
        ? config.metrics
        : [
          { label: config.primaryMetricLabel, value: config.primaryMetricValue },
          { label: config.secondaryMetricLabel, value: config.secondaryMetricValue },
          { label: config.tertiaryMetricLabel, value: config.tertiaryMetricValue },
          { label: config.quaternaryMetricLabel, value: config.quaternaryMetricValue }
        ].filter((metric) => metric.label);

      return `
        ${config.showPanelTitle === false ? "" : renderPanelTitle(config.title, config.subtitle, `Route: ${getTargetLabel()}`, {
          showReplay: config.showTopReplay !== false
        })}
        <article class="result-shell">
          ${config.showTopClose === false ? "" : renderExperienceCloseButton("result-close-button")}
          ${config.showBanner === false ? "" : `<div class="result-banner">
            <div class="result-visual">${visualMarkup}</div>
            ${config.showPerformanceMessage === false ? "" : `
              <div>
                <p class="challenge-label">${escapeHtml(rating.badge)}</p>
                <h2>${escapeHtml(rating.title)}</h2>
                <p>${escapeHtml(rating.body)}</p>
              </div>
            `}
          </div>`}

          <div class="result-metrics">
            ${metrics.map((metric) => renderMetricCard(metric.label, metric.value)).join("")}
          </div>

          ${config.breakdownHtml || (config.showBreakdowns === false ? "" : renderBreakdowns(config.answers))}

          ${config.showBottomReplay === false ? "" : `<div class="result-actions">
            <button class="button primary" data-replay-current>Take This Route Again</button>
          </div>`}
        </article>
      `;
    }

    function renderMetricCard(label, value) {
      return `
        <div class="metric-card">
          <span>${escapeHtml(label)}</span>
          <strong>${escapeHtml(value)}</strong>
        </div>
      `;
    }

    function renderBreakdowns(answers) {
      const subjectRows = data.subjects
        .map((subject) => {
          const related = answers.filter((answer) => answer.subjectIds.includes(subject.id));
          if (!related.length) {
            return "";
          }
          const correct = related.filter((answer) => answer.isCorrect).length;
          const accuracy = Math.round((correct / related.length) * 100);
          return renderBreakdownRow(subject.label, `${correct}/${related.length}`, accuracy);
        })
        .join("");

      const sectionRows = data.sections
        .map((section) => {
          const related = answers.filter((answer) => answer.sectionId === section.id);
          if (!related.length) {
            return "";
          }
          const correct = related.filter((answer) => answer.isCorrect).length;
          const accuracy = Math.round((correct / related.length) * 100);
          return renderBreakdownRow(section.title, `${correct}/${related.length}`, accuracy);
        })
        .join("");

      return `
        <div class="breakdown-columns">
          <div class="breakdown-column">
            <h3>By Subject</h3>
            <div class="breakdown-list">${subjectRows}</div>
          </div>
          <div class="breakdown-column">
            <h3>By Guiding Section</h3>
            <div class="breakdown-list">${sectionRows}</div>
          </div>
        </div>
      `;
    }

    function renderSelectedTargetBreakdown(answers) {
      const total = answers.length;
      if (!total) {
        return "";
      }

      const correct = answers.filter((answer) => answer.isCorrect).length;
      const accuracy = Math.round((correct / total) * 100);
      return `
        <div class="breakdown-columns single">
          <div class="breakdown-column">
            <h3>${escapeHtml(getTargetLabel())}</h3>
            <div class="breakdown-list">${renderBreakdownRow(getTargetLabel(), `${correct}/${total}`, accuracy)}</div>
          </div>
        </div>
      `;
    }

    function renderAlternateLensBreakdown(answers) {
      const alternateLensId = getAlternateBreakdownLensId();
      const rows = getBreakdownRowsForLens(answers, alternateLensId);

      if (!rows) {
        return "";
      }

      return `
        <div class="breakdown-columns single">
          <div class="breakdown-column">
            <h3>By ${escapeHtml(getMindMapLensLabel(alternateLensId))}</h3>
            <div class="breakdown-list">${rows}</div>
          </div>
        </div>
      `;
    }

    function getAlternateBreakdownLensId() {
      if (state.selection.lens === "section") {
        return "bigidea";
      }

      if (state.selection.lens === "bigidea") {
        return "section";
      }

      return "section";
    }

    function getBreakdownRowsForLens(answers, lensId) {
      if (lensId === "bigidea") {
        return bigIdeaRoutes
          .map((route) => {
            const related = answers.filter((answer) => (answer.bigIdeaIds || []).includes(route.id));
            if (!related.length) {
              return "";
            }

            const correct = related.filter((answer) => answer.isCorrect).length;
            const accuracy = Math.round((correct / related.length) * 100);
            return renderBreakdownRow(route.label, `${correct}/${related.length}`, accuracy);
          })
          .join("");
      }

      if (lensId === "subject") {
        return data.subjects
          .map((subject) => {
            const related = answers.filter((answer) => (answer.subjectIds || []).includes(subject.id));
            if (!related.length) {
              return "";
            }

            const correct = related.filter((answer) => answer.isCorrect).length;
            const accuracy = Math.round((correct / related.length) * 100);
            return renderBreakdownRow(subject.label, `${correct}/${related.length}`, accuracy);
          })
          .join("");
      }

      return data.sections
        .map((section) => {
          const related = answers.filter((answer) => answer.sectionId === section.id);
          if (!related.length) {
            return "";
          }

          const correct = related.filter((answer) => answer.isCorrect).length;
          const accuracy = Math.round((correct / related.length) * 100);
          return renderBreakdownRow(section.title, `${correct}/${related.length}`, accuracy);
        })
        .join("");
    }

    function renderBreakdownRow(label, value, accuracy) {
      return `
        <article class="breakdown-row">
          <div class="breakdown-head">
            <span>${escapeHtml(label)}</span>
            <span>${escapeHtml(value)} &middot; ${accuracy}%</span>
          </div>
          <div class="breakdown-progress"><span style="width:${accuracy}%"></span></div>
        </article>
      `;
    }

    return {
      renderResultsScreen,
      renderMetricCard,
      renderBreakdowns,
      renderSelectedTargetBreakdown,
      renderAlternateLensBreakdown,
      getAlternateBreakdownLensId,
      getBreakdownRowsForLens,
      renderBreakdownRow
    };
  }

  global.WSC_CREATE_RESULTS_RENDERER = createResultsRenderer;
})(window);

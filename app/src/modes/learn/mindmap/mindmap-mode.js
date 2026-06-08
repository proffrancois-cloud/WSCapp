(function () {
  function renderExperience(experience, helpers) {
    const maps = Array.isArray(experience.maps) && experience.maps.length
      ? experience.maps
      : [experience.map].filter(Boolean);

    return `
      ${helpers.renderPanelTitle("Mind Map", helpers.getTargetLabel(), null)}
      <div class="mindmap-shell">
        <div class="mindmap-gallery ${maps.length > 1 ? "has-multiple" : ""}" data-mindmap-gallery>
          ${maps.length > 1 ? `
            <button class="mindmap-gallery-nav mindmap-gallery-nav--previous" type="button" data-mindmap-gallery-nav="previous" aria-label="Previous mind map">
              <span aria-hidden="true">‹</span>
            </button>
            <button class="mindmap-gallery-nav mindmap-gallery-nav--next" type="button" data-mindmap-gallery-nav="next" aria-label="Next mind map">
              <span aria-hidden="true">›</span>
            </button>
          ` : ""}
          <div class="mindmap-radial-set mindmap-gallery-track" data-mindmap-gallery-viewport aria-label="Scrollable mind map gallery">
          ${maps.map((map) => {
            const radialMap = helpers.buildRadialMindMapLayout(map);
            return `
              <article class="mindmap-gallery-slide" data-mindmap-gallery-slide>
                ${radialMap.entries.length ? renderRadialMindMap(radialMap, helpers) : `
                  <div class="map-prompt">
                    <strong>${helpers.escapeHtml(map.centerTitle)}</strong>
                    <p>This guiding section does not have imported raw entries to branch from yet.</p>
                  </div>
                `}
              </article>
            `;
          }).join("")}
          </div>
        </div>
        ${renderEntryPopup(helpers)}
        ${renderGuidePopup(experience, helpers)}
        ${helpers.renderRawMediaLightbox()}
      </div>
      ${helpers.renderLearnCardFooterNav("mindmap")}
    `;
  }

  function renderRadialMindMap(layout, helpers) {
    return `
      <section class="mindmap-radial-map" aria-label="${helpers.escapeHtml(layout.title)}">
        <div class="mindmap-radial-scroll" aria-label="Adaptive radial mind map">
            <div
              class="mindmap-radial-stage mindmap-orbit-stage"
              data-mindmap-orbit-stage
              data-center-x="${layout.center.x}"
              data-center-y="${layout.center.y}"
              style="--map-size:${layout.size}px;"
            >
              ${(layout.rings || []).map((ring) => `
                <div
                  class="mindmap-orbit-path orbit-tone-${ring.tone}"
                  aria-hidden="true"
                  style="--orbit-radius:${ring.radius}px; --orbit-delay:${ring.delay}s;"
                ></div>
              `).join("")}
            <button
              class="mindmap-radial-center"
              type="button"
              style="left:${layout.center.x}px; top:${layout.center.y}px;"
              ${layout.center.sectionId ? `data-open-mindmap-guide="${helpers.escapeHtml(layout.center.sectionId)}"` : "disabled"}
              aria-label="Open guide for ${helpers.escapeHtml(layout.center.title)}"
            >
              <strong>${helpers.escapeHtml(layout.center.title)}</strong>
            </button>
            ${layout.entries.map((entry) => `
              <button
                class="mindmap-radial-entry mindmap-orbit-entry orbit-tone-${entry.orbitRing % 3}"
                type="button"
                style="left:${entry.x}px; top:${entry.y}px; --bubble-width:${entry.width}px; --bubble-height:${entry.height}px;"
                data-mindmap-orbit-entry
                data-orbit-radius="${entry.orbitRadius}"
                data-orbit-phase="${entry.orbitPhase}"
                data-orbit-speed="${entry.orbitSpeed}"
                data-open-mindmap-entry="${helpers.escapeHtml(entry.key)}"
              >
                <span>${helpers.escapeHtml(entry.title)}</span>
              </button>
            `).join("")}
          </div>
        </div>
      </section>
    `;
  }

  function renderEntryPopup(helpers) {
    const bundle = helpers.getActiveMindMapEntryBundle();
    if (!bundle) {
      return "";
    }

    const { entry, index } = bundle;

    return `
      <div class="auth-modal-overlay" data-close-mindmap-popup role="dialog" aria-modal="true" aria-label="${helpers.escapeHtml(entry.title)}">
        <div class="auth-modal-window mindmap-entry-window" data-mindmap-popup-window>
          <button class="popup-close-button" type="button" data-close-mindmap-popup aria-label="Close entry details">
            <span aria-hidden="true">×</span>
          </button>
          <div class="auth-modal-stack mindmap-entry-stack">
            <h3>${helpers.escapeHtml(entry.title)}</h3>
            ${helpers.renderRawMasteryToggle(entry)}
            ${(entry.rawOfficialText || (entry.rawOfficialBullets && entry.rawOfficialBullets.length)) ? `
              <div class="raw-block">
                <strong>Raw official text</strong>
                ${entry.rawOfficialText ? `<p>${helpers.renderTextWithBreaks(entry.rawOfficialText)}</p>` : ""}
                ${entry.rawOfficialBullets && entry.rawOfficialBullets.length ? helpers.renderAlpacaList(entry.rawOfficialBullets) : ""}
              </div>
            ` : ""}
            ${entry.studentExplanation ? `
              <div class="raw-block">
                <strong>Student explanation</strong>
                <p>${helpers.renderTextWithBreaks(entry.studentExplanation)}</p>
                ${helpers.renderRawStudentAssets(entry, index)}
              </div>
            ` : ""}
            ${entry.whyItMatters ? `
              <div class="raw-block">
                <strong>Why it matters</strong>
                <p>${helpers.renderTextWithBreaks(entry.whyItMatters)}</p>
              </div>
            ` : ""}
            ${helpers.renderRawQuizPager(entry, index)}
          </div>
        </div>
      </div>
    `;
  }

  function renderGuidePopup(experience, helpers) {
    const sectionId = experience?.activeGuideSectionId || "";
    if (!experience || experience.type !== "mindmap" || !sectionId) {
      return "";
    }

    const section = helpers.getApprovedRawContentSection(sectionId);
    const guide = helpers.getRegularGuideForSection(section);
    if (!guide) {
      return "";
    }

    return `
      <div class="auth-modal-overlay" data-close-mindmap-guide-popup role="dialog" aria-modal="true" aria-label="${helpers.escapeHtml(guide.sectionTitle || guide.title)} guide">
        <div class="auth-modal-window mindmap-entry-window mindmap-guide-window" data-mindmap-guide-popup-window>
          <button class="popup-close-button" type="button" data-close-mindmap-guide-popup aria-label="Close guide details">
            <span aria-hidden="true">×</span>
          </button>
          <div class="auth-modal-stack mindmap-entry-stack">
            <h3>${helpers.escapeHtml(guide.sectionTitle || guide.title)}</h3>
            ${helpers.renderRegularGuideDocument(guide)}
            ${helpers.renderRegularGuideQuestionBlock(section)}
          </div>
        </div>
      </div>
    `;
  }

  window.WSC_MINDMAP_MODE = Object.freeze({
    renderExperience,
    renderRadialMindMap,
    renderEntryPopup,
    renderGuidePopup
  });
}());

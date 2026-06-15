(function initLearnSlideshowController(global) {
  "use strict";

  function requireObject(value, name) {
    if (!value || typeof value !== "object") {
      throw new Error(`WSC learn slideshow controller requires ${name}.`);
    }
    return value;
  }

  function requireFunction(collection, name) {
    const value = collection?.[name];
    if (typeof value !== "function") {
      throw new Error(`WSC learn slideshow controller requires ${name}().`);
    }
    return value;
  }

  function createLearnSlideshowController(options = {}) {
    const state = requireObject(options.appState, "appState");
    const data = requireObject(options.data, "data");
    const helpers = options.helpers || {};
    const callbacks = options.callbacks || {};

    const bigIdeaRoutes = Array.isArray(data.bigIdeaRoutes) ? data.bigIdeaRoutes : [];
    const sectionById = data.sectionById || {};
    const theme = data.theme || {};
    const insights = Array.isArray(data.insights) ? data.insights : [];
    const sections = Array.isArray(data.sections) ? data.sections : [];
    const knowledgeBank = data.knowledgeBank || {};

    const escapeHtml = requireFunction(helpers, "escapeHtml");
    const getActiveSubjectCatalog = requireFunction(helpers, "getActiveSubjectCatalog");
    const getActiveSubjectKnowledgeMap = requireFunction(helpers, "getActiveSubjectKnowledgeMap");
    const getAssetValue = requireFunction(helpers, "getAssetValue");
    const getBigIdeaKnowledgeById = requireFunction(helpers, "getBigIdeaKnowledgeById");
    const getKnowledgeContext = requireFunction(helpers, "getKnowledgeContext");
    const getPrimaryTargetAssetPath = requireFunction(helpers, "getPrimaryTargetAssetPath");
    const getSectionKnowledgeById = requireFunction(helpers, "getSectionKnowledgeById");
    const getSelectionQuestions = requireFunction(helpers, "getSelectionQuestions");
    const getTargetLabel = requireFunction(helpers, "getTargetLabel");
    const normalizeKnowledgeKey = requireFunction(helpers, "normalizeKnowledgeKey");
    const renderAlpacaList = requireFunction(helpers, "renderAlpacaList");
    const renderConfiguredMascotAsset = requireFunction(helpers, "renderConfiguredMascotAsset");
    const renderPanelTitle = requireFunction(helpers, "renderPanelTitle");
    const usesGranularLearnSubjects = requireFunction(helpers, "usesGranularLearnSubjects");

    const render = requireFunction(callbacks, "render");
    const renderExperience = requireFunction(callbacks, "renderExperience");

    function buildExperience() {
      return {
        type: "slideshow",
        title: getTargetLabel(),
        deck: buildLearnDeck(),
        index: 0
      };
    }

    function renderExperienceMarkup() {
      const experience = state.experience;
      const slide = experience.deck[experience.index];

      return `
        ${renderPanelTitle(
          experience.title,
          null,
          null
        )}
        <div class="slide-shell">
          <aside class="slide-rail">
            ${renderConfiguredMascotAsset(getPrimaryTargetAssetPath(), "happy", "medium", {
              alt: `${getTargetLabel()} alpaca`,
              slotClass: "slide-rail-mascot-slot",
              imageClass: "slide-rail-mascot-image"
            })}
            <div class="slide-progress">Stop ${experience.index + 1} / ${experience.deck.length}</div>
            ${renderSecondaryContext(slide)}
          </aside>

          <article class="slide-card">
            <span class="slide-overline">${escapeHtml(slide.overline)}</span>
            <h2>${escapeHtml(slide.title)}</h2>
            <p>${escapeHtml(slide.body)}</p>
            ${renderAlpacaList(slide.bullets)}
            ${slide.chips && slide.chips.length ? `<div class="chip-row">${slide.chips.map((chip) => `<span>${escapeHtml(chip)}</span>`).join("")}</div>` : ""}
            <div class="slide-actions">
              <button class="button ghost" data-slide-nav="prev" ${experience.index === 0 ? "disabled" : ""}>Previous stop</button>
              <button class="button primary" data-slide-nav="next">${experience.index === experience.deck.length - 1 ? "Finish This Route" : "Next stop"}</button>
            </div>
          </article>
        </div>
      `;
    }

    function renderSecondaryContext(slide) {
      const context = getSecondaryContext(slide);
      if (!context) {
        return "";
      }

      return `
        <div class="slide-context-card">
          ${renderConfiguredMascotAsset(context.asset, context.mood, "medium", {
            alt: `${context.title} alpaca`,
            slotClass: "slide-rail-mascot-slot",
            imageClass: "slide-rail-mascot-image"
          })}
          <span>${escapeHtml(context.title)}</span>
        </div>
      `;
    }

    function getSecondaryContext(slide) {
      if (state.selection.lens === "subject") {
        const relatedSectionId = slide.relatedSectionId || null;
        if (!relatedSectionId) {
          return null;
        }

        return {
          title: sectionById[relatedSectionId]?.title || slide.relatedSectionTitle || "Guiding Section",
          asset: getAssetValue(["contexts", "targets", "section", relatedSectionId]),
          mood: "wise"
        };
      }

      const subjectLabel = slide.relatedSubjectLabel || getPrimaryOfficialSubjectLabel();
      if (!subjectLabel) {
        return null;
      }

      return {
        title: subjectLabel,
        asset: getBroadSubjectAssetPath(subjectLabel),
        mood: "wise"
      };
    }

    function getPrimaryOfficialSubjectLabel() {
      const knowledge = getKnowledgeContext();
      if (!knowledge || knowledge.type !== "section") {
        return null;
      }

      return knowledge.officialSubjects && knowledge.officialSubjects.length ? knowledge.officialSubjects[0] : null;
    }

    function inferRelatedSubjectLabel(atom, knowledge) {
      const officialSubjects = knowledge?.officialSubjects?.length
        ? knowledge.officialSubjects
        : (knowledgeBank?.meta?.official_subjects || []);

      if (!officialSubjects.length) {
        return null;
      }

      const haystack = [
        atom?.subtopic || "",
        atom?.coreIdea || "",
        ...(atom?.mustKnowPoints || []),
        ...(atom?.examples || []),
        ...(atom?.debateAngles || []),
        ...(atom?.keywords || []),
        ...(knowledge?.overlayCategories || [])
      ]
        .join(" ")
        .toLowerCase();

      const scoringRules = {
        "Science & Technology": [
          "science", "technology", "prototype", "beta", "interface", "device", "system",
          "ai", "artificial intelligence", "robot", "quantum", "fusion", "engineering"
        ],
        "Social Studies": [
          "social", "public", "politic", "government", "policy", "econom", "trade", "tourism",
          "hotel", "airport", "city", "urban", "mobility", "community", "society", "infrastructure"
        ],
        "History": [
          "history", "historical", "era", "legacy", "postwar", "war", "tradition",
          "past", "timeline", "industrial", "empire", "ceasefire", "reconstruction"
        ],
        "Art & Music": [
          "art", "artist", "paint", "visual", "aesthetic", "design", "architecture",
          "music", "song", "melody", "album", "demo", "sound", "performance"
        ],
        "Literature & Media": [
          "literature", "story", "narrative", "novel", "poem", "film", "cinema", "screen",
          "media", "character", "travel writing", "genre", "plot", "closure"
        ],
        "Special Area": [
          "philosophy", "philosophical", "psychology", "psychological", "liminal", "threshold",
          "journey", "destination", "waiting", "identity", "meaning", "purpose", "uncertainty",
          "almost", "growth", "adolescence", "emotion"
        ]
      };

      const scores = new Map(officialSubjects.map((subject, index) => [subject, index === 0 ? 1 : 0]));

      for (const subject of officialSubjects) {
        const rules = scoringRules[subject] || [];
        let score = scores.get(subject) || 0;
        for (const token of rules) {
          if (haystack.includes(token)) {
            score += 2;
          }
        }
        scores.set(subject, score);
      }

      const best = [...scores.entries()].sort((a, b) => b[1] - a[1])[0];
      return best && best[1] > 0 ? best[0] : officialSubjects[0];
    }

    function getBroadSubjectAssetPath(label) {
      const normalized = normalizeKnowledgeKey(label);

      if (normalized.includes("history")) {
        return getAssetValue(["contexts", "targets", "subject", "history"]);
      }

      if (normalized.includes("science") || normalized.includes("technology")) {
        return getAssetValue(["contexts", "targets", "subject", "computer-science-technology"]);
      }

      if (normalized.includes("social")) {
        return getAssetValue(["contexts", "targets", "subject", "politics-government-global-politics"]);
      }

      if (normalized.includes("art") || normalized.includes("music") || normalized.includes("theatre") || normalized.includes("performing")) {
        return getAssetValue(["contexts", "targets", "subject", "visual-arts"]);
      }

      if (normalized.includes("environmental") || normalized.includes("biology") || normalized.includes("physics") || normalized.includes("science")) {
        return getAssetValue(["contexts", "targets", "subject", "sciences"]);
      }

      if (normalized.includes("literature") || normalized.includes("media")) {
        return getAssetValue(["contexts", "targets", "subject", "media-film"]);
      }

      if (normalized.includes("special")) {
        return getAssetValue(["contexts", "targets", "subject", "philosophy"]);
      }

      return getAssetValue(["contexts", "targets", "subject", "history"]);
    }

    function navigate(direction) {
      if (!state.experience || state.experience.type !== "slideshow") {
        return;
      }

      if (direction === "prev") {
        state.experience.index = Math.max(0, state.experience.index - 1);
      } else {
        if (state.experience.index === state.experience.deck.length - 1) {
          state.experience = null;
          render();
          return;
        }
        state.experience.index += 1;
      }

      renderExperience();
    }

    function buildLearnDeck() {
      const knowledgeContext = getKnowledgeContext();
      if (!knowledgeContext) {
        const questions = getSelectionQuestions();
        return [
          {
            overline: "Fallback overview",
            title: getTargetLabel(),
            body: "The expanded bank is unavailable, so this route is using the basic local question bank only.",
            bullets: samplePrompts(questions, Math.min(20, questions.length)),
            chips: ["Fallback", `${questions.length} questions`]
          }
        ];
      }

      if (knowledgeContext.type === "whole-theme") {
        return buildWholeThemeDeck(knowledgeContext);
      }

      if (knowledgeContext.type === "subject") {
        return buildSubjectDeck(knowledgeContext);
      }

      if (knowledgeContext.type === "bigidea") {
        return buildBigIdeaDeck(knowledgeContext);
      }

      return buildSectionDeck(knowledgeContext);
    }

    function buildWholeThemeDeck(knowledge) {
      const sectionKnowledgeById = getSectionKnowledgeById();
      const bigIdeaKnowledgeById = getBigIdeaKnowledgeById();
      const architectureSource = state.selection.lens === "subject"
        ? getActiveSubjectCatalog()
        : state.selection.lens === "bigidea"
          ? bigIdeaRoutes
          : sections;
      const architectureBullets = architectureSource.map((item) => {
        if (state.selection.lens === "subject") {
          const subjectKnowledge = getActiveSubjectKnowledgeMap()[item.id];
          return `${item.label}: ${subjectKnowledge.sections.length} sections · ${subjectKnowledge.atoms.length} subtopics · ${subjectKnowledge.knowledgeItemCount} knowledge items`;
        }

        if (state.selection.lens === "bigidea") {
          const bigIdeaKnowledge = bigIdeaKnowledgeById[item.id];
          return `${item.label}: ${bigIdeaKnowledge.sections.length} sections · ${bigIdeaKnowledge.entries.length} raw entries · ${bigIdeaKnowledge.questionCount} questions`;
        }

        const sectionKnowledge = sectionKnowledgeById[item.id];
        return `${item.title}: ${sectionKnowledge.atoms.length} subtopics · ${sectionKnowledge.knowledgeItemCount} knowledge items`;
      });

      return [
        {
          overline: "Full route overview",
          title: theme.name,
          body: `${theme.summary} This full route now uses the expanded local knowledge bank.`,
          bullets: [
            `${knowledge.sections.length} official guiding sections are included.`,
            `${knowledge.atoms.length} explicit subtopics are included.`,
            `${knowledge.knowledgeItemCount} structured knowledge items are available across the bank.`,
            ...insights.map((insight) => `${insight.title}: ${insight.body}`)
          ],
          chips: ["Full route", "Expanded bank", `${knowledge.atoms.length} subtopics`]
        },
        {
          overline: "Complete architecture",
          title: state.selection.lens === "subject"
            ? (usesGranularLearnSubjects() ? "All study lanes in the bank" : "All subject routes in the bank")
            : state.selection.lens === "bigidea"
              ? "All big-idea routes in the bank"
              : "All guiding stops in the bank",
          body: "This route no longer samples a small subset. It lists every stop currently included in the imported bank.",
          bullets: architectureBullets,
          chips: [state.selection.lens === "subject" ? (usesGranularLearnSubjects() ? "Detailed subject lens" : "Subject lens") : state.selection.lens === "bigidea" ? "Big-idea lens" : "Section lens", `${knowledge.knowledgeItemCount} knowledge items`]
        }
      ];
    }

    function buildSubjectDeck(knowledge) {
      const routeLabel = usesGranularLearnSubjects() ? "study lane" : "subject route";
      return [
        {
          overline: usesGranularLearnSubjects() ? "Study-lane overview" : "Subject route overview",
          title: knowledge.label,
          body: `${knowledge.description} This ${routeLabel} now includes the full imported bank instead of a short sample.`,
          relatedSectionId: knowledge.sections[0] ? knowledge.sections[0].sectionId : null,
          bullets: [
            `${knowledge.sections.length} guiding sections contribute to this ${routeLabel}.`,
            `${knowledge.atoms.length} subtopics are available in this ${routeLabel}.`,
            `${knowledge.knowledgeItemCount} structured knowledge items are available for revision.`,
            `${knowledge.questionCount} quiz questions currently exist in the playable bank.`
          ],
          chips: [knowledge.label, "Expanded bank", `${knowledge.atoms.length} subtopics`]
        },
        ...knowledge.sections.map((section) => ({
          overline: "Section crossover",
          title: `${knowledge.label} in ${section.title}`,
          body: section.summary,
          relatedSectionId: section.sectionId,
          bullets: [
            `${section.atoms.length} subtopics from this guiding section feed the ${knowledge.label} route.`,
            `Official subjects here: ${section.officialSubjects.join(", ")}.`,
            ...(section.overlayCategories.length ? section.overlayCategories.map((category) => `Overlay category: ${category}`) : [])
          ],
          chips: [section.originalTitle, ...section.overlayCategories]
        })),
        ...knowledge.atoms.map((atom) =>
          buildAtomSlide(atom, atom.sourceSectionOriginalTitle, {
            relatedSectionId: atom.sectionId,
            relatedSubjectLabel: knowledge.label
          })
        )
      ];
    }

    function buildSectionDeck(knowledge) {
      return [
        {
          overline: "Guiding-section route overview",
          title: knowledge.title,
          body: `${knowledge.summary} This guiding-section route now includes the full imported bank instead of a short sample.`,
          relatedSubjectLabel: knowledge.officialSubjects[0] || null,
          bullets: [
            `${knowledge.atoms.length} subtopics are available in this section.`,
            `${knowledge.knowledgeItemCount} structured knowledge items are available for revision.`,
            `${knowledge.questionCount} playable quiz questions currently exist for this section.`,
            `Official subjects: ${knowledge.officialSubjects.join(", ")}.`,
            ...(knowledge.overlayCategories.length ? knowledge.overlayCategories.map((category) => `Overlay category: ${category}`) : [])
          ],
          chips: [knowledge.originalTitle, "Expanded bank", `${knowledge.atoms.length} subtopics`]
        },
        ...knowledge.atoms.map((atom) =>
          buildAtomSlide(atom, knowledge.originalTitle, {
            relatedSubjectLabel: inferRelatedSubjectLabel(atom, knowledge)
          })
        )
      ];
    }

    function buildBigIdeaDeck(knowledge) {
      return [
        {
          overline: "Big-idea route overview",
          title: knowledge.label,
          body: `${knowledge.description} This route gathers the section entries that most clearly feed this big idea across the imported bank.`,
          relatedSectionId: knowledge.sections[0] ? knowledge.sections[0].sectionId : null,
          relatedSubjectLabel: knowledge.entries[0] && knowledge.entries[0].subjects ? knowledge.entries[0].subjects[0] : null,
          bullets: [
            `${knowledge.entries.length} raw entries currently map to this big idea.`,
            `${knowledge.sections.length} guiding sections contribute to this route.`,
            `${knowledge.questionCount} playable questions currently sit inside those sections.`,
            `${knowledge.knowledgeItemCount} study signals are available across entries, examples, and subject links.`
          ],
          chips: [knowledge.label, `${knowledge.sections.length} sections`, `${knowledge.entries.length} entries`]
        },
        ...knowledge.entries.map((entry) => ({
          overline: entry.sectionOriginalTitle || "Guiding Section",
          title: entry.title,
          body: entry.studentExplanation || entry.whyItMatters || entry.rawOfficialText || entry.takeaway || knowledge.description,
          relatedSectionId: entry.sectionId || null,
          relatedSubjectLabel: entry.subjects && entry.subjects.length ? entry.subjects[0] : null,
          bullets: [
            ...(entry.takeaway ? [entry.takeaway] : []),
            ...(entry.examples || []).slice(0, 3).map((example) => `Example: ${example}`),
            ...(entry.whyItMatters ? [entry.whyItMatters] : [])
          ],
          chips: [knowledge.label, ...(entry.subjects || []).slice(0, 2)]
        }))
      ];
    }

    function buildAtomSlide(atom, overline, context = {}) {
      return {
        overline,
        title: atom.subtopic,
        body: atom.coreIdea,
        relatedSectionId: context.relatedSectionId || null,
        relatedSubjectLabel: context.relatedSubjectLabel || null,
        bullets: [
          ...atom.mustKnowPoints,
          ...atom.examples.map((example) => `Example: ${example}`),
          ...atom.debateAngles.map((angle) => `Debate: ${angle}`)
        ],
        chips: [atom.difficulty, ...atom.keywords]
      };
    }

    function samplePrompts(questions, count) {
      return questions.slice(0, count).map((question) => question.prompt);
    }

    return {
      buildAtomSlide,
      buildBigIdeaDeck,
      buildExperience,
      buildLearnDeck,
      buildSectionDeck,
      buildSubjectDeck,
      buildWholeThemeDeck,
      getBroadSubjectAssetPath,
      getPrimaryOfficialSubjectLabel,
      getSecondaryContext,
      inferRelatedSubjectLabel,
      navigate,
      renderExperience: renderExperienceMarkup,
      renderSecondaryContext,
      samplePrompts
    };
  }

  global.WSC_CREATE_LEARN_SLIDESHOW_CONTROLLER = createLearnSlideshowController;
})(window);

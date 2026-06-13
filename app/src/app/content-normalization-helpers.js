(function initContentNormalizationHelpers(global) {
  "use strict";

  function requiredFunction(collection, name) {
    const value = collection ? collection[name] : null;
    if (typeof value !== "function") {
      throw new Error("WSC content normalization helpers missing function dependency: " + name);
    }
    return value;
  }

  const FRENCH_TEXT_PATTERN = /[àâäéèêëîïôöùûüçÀÂÄÉÈÊËÎÏÔÖÙÛÜÇ]/;
  const FRENCH_STOPWORDS = new Set([
    "le", "la", "les", "un", "une", "des", "du", "de", "d", "au", "aux", "dans", "sur", "pour", "avec",
    "sans", "entre", "chez", "que", "qui", "quoi", "quand", "comment", "pourquoi", "est", "sont", "etaient",
    "était", "étaient", "cela", "ce", "cette", "ces", "point", "montre", "explique", "interroge", "invite",
    "utile", "débattre", "debattre", "question", "questions", "réponse", "reponse", "temps", "équipe",
    "equipe", "joueur", "joueuse", "choisit", "sélectionne", "selectionne", "meilleur", "meilleure",
    "voyage", "trajet", "arrivée", "arrivee", "attente", "progrès", "progres", "histoire", "toujours",
    "parfois", "aussi", "mais", "donc", "leur", "leurs", "plus", "moins", "comme", "peut", "peuvent"
  ]);

  const SUBJECT_LABEL_ALIASES = {
    "visual arts": "Art & Music",
    "visual and performing arts": "Art & Music",
    "music": "Art & Music",
    "theatre": "Art & Music",
    "language and literature": "Lit & Media",
    "literature and media": "Lit & Media",
    "media film": "Lit & Media",
    "media and film": "Lit & Media",
    "computer science technology": "Science & Tech",
    "computer science and technology": "Science & Tech",
    "science technology": "Science & Tech",
    "science and technology": "Science & Tech",
    "sciences": "Science & Tech",
    "environmental science": "Science & Tech",
    "biology human development": "Science & Tech",
    "physics": "Science & Tech",
    "psychology": "Special Area",
    "philosophy": "Special Area",
    "philosophy of progress": "Special Area",
    "sociology": "Social Studies",
    "economics trade": "Social Studies",
    "economics and trade": "Social Studies",
    "geography human geography": "Social Studies",
    "geography and human geography": "Social Studies",
    "politics government global politics": "Social Studies",
    "politics and government global politics": "Social Studies",
    "design architecture urbanism": "Social Studies",
    "design architecture and urbanism": "Social Studies"
  };

  const BIG_IDEA_LABEL_ALIASES = {
    "adulthood": "Thresholds & Irreversibility",
    "arrival": "Narrated Endings",
    "bright and dark future": "Managing Uncertainty",
    "collapse and apocalypse": "Narrated Endings",
    "delay": "Delayed Arrival",
    "destinations": "Movement Without Arrival",
    "drafts and prototypes": "Incompletion That Stays Active",
    "endings": "Narrated Endings",
    "home and wandering": "Movement Without Arrival",
    "journeys": "Movement Without Arrival",
    "liminality": "Thresholds & Irreversibility",
    "migration": "Movement Without Arrival",
    "navigation": "Infrastructure Shapes Behavior",
    "patience": "Delayed Arrival",
    "planning and projects": "Incompletion That Stays Active",
    "prediction": "Managing Uncertainty",
    "progress": "Performed Progress",
    "routes and roads": "Infrastructure Shapes Behavior",
    "routes roads and navigation": "Infrastructure Shapes Behavior",
    "the future": "Managing Uncertainty",
    "thresholds": "Thresholds & Irreversibility",
    "tourism": "Movement Without Arrival",
    "transition": "Thresholds & Irreversibility",
    "waiting": "Delayed Arrival"
  };

  const REMOVED_BIG_IDEA_KEYS = new Set();

  function createContentNormalizationHelpers(options = {}) {
    const {
      constants = {},
      callbacks = {}
    } = options;

    const RAW_SECTION_OVERRIDES = constants.rawSectionOverrides || constants.RAW_SECTION_OVERRIDES || {};
    const RAW_ENTRY_OVERRIDES = constants.rawEntryOverrides || constants.RAW_ENTRY_OVERRIDES || {};
    const compareOfficialSectionOrder = requiredFunction(callbacks, "compareOfficialSectionOrder");
    const normalizeKnowledgeKey = requiredFunction(callbacks, "normalizeKnowledgeKey");
    const normalizeSectionId = requiredFunction(callbacks, "normalizeSectionId");

    function rawEntryOverrideKey(sectionId, title) {
      return `${sectionId}::${normalizeKnowledgeKey(title)}`;
    }

    function normalizeRawContentSections(sections) {
      const normalizedSections = Object.entries(sections || {}).map(([sectionId, section]) => {
          const canonicalSectionId = normalizeSectionId(section?.id || sectionId);
          return [
            canonicalSectionId,
            normalizeRawContentSection(section, sectionId, canonicalSectionId)
          ];
        });

      normalizedSections.sort((left, right) => compareOfficialSectionOrder(left[1], right[1]));

      return Object.fromEntries(normalizedSections);
    }

    function normalizeRawContentSection(section, fallbackId, canonicalSectionId = null) {
      const rawSectionId = section?.id || fallbackId;
      const sectionId = canonicalSectionId || normalizeSectionId(rawSectionId);
      const sectionOverride = RAW_SECTION_OVERRIDES[rawSectionId] || RAW_SECTION_OVERRIDES[fallbackId] || RAW_SECTION_OVERRIDES[sectionId];
      const rawEntries = Array.isArray(section?.entries) ? section.entries : [];
      const sectionSource = sectionOverride
        ? {
            ...(section || {}),
            ...sectionOverride,
            entries: rawEntries.length ? rawEntries : (sectionOverride.entries || [])
          }
        : (section || {});
      const guidingLabel = stripMasterTemplateSuffix(sectionSource.guidingSection || sectionSource.title || "");
      const normalizedSectionTitle = guidingLabel || sectionSource.guidingSection || sectionSource.title || fallbackId || "Guiding Section";

      return {
        ...sectionSource,
        id: sectionId,
        title: normalizedSectionTitle,
        guidingSection: sectionSource.guidingSection || normalizedSectionTitle,
        entries: (sectionSource.entries || []).map((entry, index) =>
          normalizeRawContentEntry(entry, index, normalizedSectionTitle, sectionId)
        )
      };
    }

    function normalizeBigIdeaLabels(items) {
      return normalizeMappedLabels(expandBigIdeaLabels(items), BIG_IDEA_LABEL_ALIASES).filter(
        (item) => !REMOVED_BIG_IDEA_KEYS.has(normalizeKnowledgeKey(item))
      );
    }

    function expandBigIdeaLabels(items) {
      return (items || []).flatMap((item) => {
        const text = normalizeWhitespace(item);
        if (!text) {
          return [];
        }

        if (normalizeKnowledgeKey(text) === "adulthood transition") {
          return ["Adulthood", "Transition"];
        }

        return text
          .split(/\s*\/\s*/)
          .map((part) => normalizeWhitespace(part))
          .filter(Boolean);
      });
    }

    function getRawEntryOverride(sectionId, title) {
      return RAW_ENTRY_OVERRIDES[rawEntryOverrideKey(sectionId, title)] || null;
    }

    function normalizeRawContentEntry(entry, index, sectionTitle, sectionId) {
      const normalizedTitle = normalizeRawEntryTitle(entry, index);
      const override = getRawEntryOverride(sectionId, normalizedTitle);
      const finalTitle = override?.title || normalizedTitle;
      const sourceQuizQuestions = Array.isArray(entry.quizQuestions) ? entry.quizQuestions : [];
      const overrideQuizQuestions = Array.isArray(override?.quizQuestions) ? override.quizQuestions : [];
      const mergedEntry = override
        ? {
            ...entry,
            ...override,
            quizQuestions: sourceQuizQuestions.length ? sourceQuizQuestions : overrideQuizQuestions
          }
        : entry;
      const rawQuizQuestions = Array.isArray(mergedEntry.quizQuestions) ? mergedEntry.quizQuestions : [];
      const entryContext = {
        ...mergedEntry,
        title: finalTitle,
        guidingSection: sectionTitle
      };

      return {
        ...mergedEntry,
        title: finalTitle,
        entryIndex: index + 1,
        guidingSection: sectionTitle,
        studentExplanation: normalizeSupportField(mergedEntry.studentExplanation, "studentExplanation", entryContext),
        whyItMatters: normalizeSupportField(mergedEntry.whyItMatters, "whyItMatters", entryContext),
        takeaway: normalizeSupportField(mergedEntry.takeaway, "takeaway", entryContext),
        debateRelevance: normalizeSupportField(mergedEntry.debateRelevance, "debateRelevance", entryContext),
        counterargument: normalizeSupportField(mergedEntry.counterargument, "counterargument", entryContext),
        officialWscSubject: mergedEntry.officialWscSubject || (Array.isArray(mergedEntry.subjects) ? normalizeMappedLabels(mergedEntry.subjects, SUBJECT_LABEL_ALIASES)[0] : ""),
        subject: mergedEntry.officialWscSubject || mergedEntry.subject || (Array.isArray(mergedEntry.subjects) ? normalizeMappedLabels(mergedEntry.subjects, SUBJECT_LABEL_ALIASES)[0] : ""),
        subjects: mergedEntry.officialWscSubject ? [mergedEntry.officialWscSubject] : normalizeMappedLabels(mergedEntry.subjects, SUBJECT_LABEL_ALIASES).slice(0, 1),
        legacySubjectLabels: Array.isArray(mergedEntry.legacySubjectLabels) ? mergedEntry.legacySubjectLabels : [],
        subjectIconKey: mergedEntry.subjectIconKey || "",
        bigIdeas: normalizeBigIdeaLabels(mergedEntry.bigIdeas),
        examples: (mergedEntry.examples || [])
          .map((item) => normalizeEnglishOnlyShortField(item, ""))
          .filter(Boolean),
        links: (mergedEntry.links || [])
          .map((link) => ({
            ...link,
            label: normalizeEnglishOnlyShortField(link.label, link.url || "Source")
          }))
          .filter((link) => link.url),
        quizQuestions: rawQuizQuestions.map((question, questionIndex) => normalizeRawQuizQuestion(question, questionIndex))
      };
    }

    function normalizeMappedLabels(items, aliasMap) {
      const seen = new Set();
      return (items || [])
        .map((item) => mapAliasLabel(item, aliasMap))
        .filter((item) => {
          if (!item) {
            return false;
          }
          const key = normalizeKnowledgeKey(item);
          if (seen.has(key)) {
            return false;
          }
          seen.add(key);
          return true;
        });
    }

    function mapAliasLabel(label, aliasMap) {
      const text = String(label || "").trim();
      if (!text) {
        return "";
      }
      return aliasMap[normalizeKnowledgeKey(text)] || text;
    }

    function normalizeRawQuizQuestion(question) {
      const correctAnswer = normalizeWhitespace(question.correctAnswer);
      return {
        ...question,
        prompt: normalizeWhitespace(question.prompt),
        correctAnswer,
        wrongAnswers: normalizeRawWrongAnswers(question, correctAnswer),
        visibleCorrectExplanation: normalizeWhitespace(question.visibleCorrectExplanation),
        visibleConnection: normalizeWhitespace(question.visibleConnection),
        visibleTakeaway: normalizeWhitespace(question.visibleTakeaway)
      };
    }

    function normalizeFullVoyageQuestions(questions) {
      return (questions || [])
        .map((question) => normalizeRawQuizQuestion(question))
        .filter((question) => {
          const level = Number(question.level);
          return [4, 5].includes(level) && question.id && question.prompt && question.correctAnswer;
        });
    }

    function normalizeRawWrongAnswers(question, correctAnswer) {
      const seen = new Set([normalizeKnowledgeKey(correctAnswer)]);
      const wrongAnswers = [];
      const addAnswer = (answer) => {
        const text = normalizeWhitespace(answer);
        const key = normalizeKnowledgeKey(text);
        if (!text || seen.has(key)) {
          return;
        }
        seen.add(key);
        wrongAnswers.push(text);
      };

      (question.wrongAnswers || []).forEach(addAnswer);

      [
        "It treats the example as unrelated to the route.",
        "It says the destination matters and the journey never does.",
        "It removes the need to compare evidence, context, or meaning.",
        "It turns the source into a decorative detail instead of a useful checkpoint."
      ].forEach((answer) => {
        if (wrongAnswers.length < 3) {
          addAnswer(answer);
        }
      });

      return wrongAnswers.slice(0, 3);
    }

    function normalizeSupportField(value, field, entry) {
      const text = normalizeWhitespace(value);
      if (!text) {
        return "";
      }

      if (!looksFrenchText(text)) {
        return text;
      }

      const translated = translateFrenchSupportText(text);
      if (translated && !looksFrenchText(translated)) {
        return translated;
      }

      return generateEnglishSupportText(field, entry);
    }

    function generateEnglishSupportText(field, entry) {
      const title = entry.title || "this entry";
      const titleLower = lowerFirst(title);
      const bigIdeas = joinHumanList(entry.bigIdeas || []);
      const subjects = joinHumanList(entry.subjects || []);
      const examples = joinHumanList((entry.examples || []).slice(0, 4));
      const officialLead = deriveEnglishLead(entry.rawOfficialText);

      if (field === "studentExplanation") {
        return officialLead
          ? `${title} focuses on ${officialLead}. It uses this example to clarify the route through ${entry.guidingSection || "the selected section"}.`
          : `${title} gives students a clearer way into the official source text and connects the point to ${entry.guidingSection || "the selected route"}.`;
      }

      if (field === "whyItMatters") {
        if (bigIdeas && subjects) {
          return `It matters because it links ${subjects} to ${bigIdeas}, showing why ${titleLower} belongs in this route.`;
        }

        if (bigIdeas) {
          return `It matters because it helps explain how ${bigIdeas} shape this route through ${titleLower}.`;
        }

        if (subjects) {
          return `It matters because it gives ${subjects} a concrete way into the larger route question.`;
        }

        return `It matters because ${titleLower} turns the official source into a usable checkpoint for the route.`;
      }

      if (field === "takeaway") {
        if (bigIdeas) {
          return `Key takeaway: ${title} helps show how ${bigIdeas} operate in this route.`;
        }

        return `Key takeaway: ${title} is meant to sharpen the route’s main question, not just add another example.`;
      }

      if (field === "debateRelevance") {
        if (examples && bigIdeas) {
          return `Useful for debate when weighing ${examples} against bigger questions about ${bigIdeas}.`;
        }

        if (bigIdeas) {
          return `Useful for debate because it gives a concrete entry point into larger questions about ${bigIdeas}.`;
        }

        return `Useful for debate because it turns the source text into a claim that can be defended, challenged, or reframed.`;
      }

      if (field === "counterargument") {
        if (examples) {
          return `A counterargument is that ${examples} may not always support the same conclusion once the context, definition, or evidence changes.`;
        }

        return `A counterargument is that this point may look very different once its definitions, evidence, or historical context are widened.`;
      }

      return "";
    }

    function translateFrenchSupportText(value) {
      let text = normalizeWhitespace(value)
        .replaceAll("’", "'")
        .replaceAll("“", "\"")
        .replaceAll("”", "\"")
        .replaceAll("«", "\"")
        .replaceAll("»", "\"");

      const phraseReplacements = [
        [/^Ce point s'intéresse aux /i, "This point looks at "],
        [/^Ce point s'intéresse à la /i, "This point looks at the "],
        [/^Ce point s'intéresse au /i, "This point looks at the "],
        [/^Ce point s'intéresse à l'/i, "This point looks at "],
        [/^Ce point s'intéresse à /i, "This point looks at "],
        [/^Ce point explique que /i, "This point explains that "],
        [/^Ce point montre comment /i, "This point shows how "],
        [/^Ce point montre que /i, "This point shows that "],
        [/^Ce point oppose /i, "This point contrasts "],
        [/^Ce point pose une question difficile ?: /i, "This point raises a difficult question: "],
        [/^Ce point pose la question de /i, "This point raises the question of "],
        [/^Ce point pose la question /i, "This point raises the question "],
        [/^Ce point demande si /i, "This point asks whether "],
        [/^Ce point demande /i, "This point asks "],
        [/^Ce point étudie /i, "This point examines "],
        [/^Ce point compare /i, "This point compares "],
        [/^Ce point présente /i, "This point presents "],
        [/^Ce point rassemble /i, "This point brings together "],
        [/^Ce point observe /i, "This point observes "],
        [/^Ce point interroge /i, "This point questions "],
        [/^Ce point revient sur /i, "This point returns to "],
        [/^Ce point revient à /i, "This point returns to "],
        [/^Cette dernière ligne ferme le thème en rappelant que /i, "This final line closes the theme by reminding us that "],
        [/^Il montre que /i, "It shows that "],
        [/^Il relie /i, "It connects "],
        [/^Il élargit /i, "It broadens "],
        [/^Il rappelle que /i, "It reminds us that "],
        [/^Il rappelle /i, "It reminds us of "],
        [/^Il renverse l'idée que /i, "It overturns the idea that "],
        [/^Il reprend /i, "It returns to "],
        [/^Il pousse /i, "It pushes "],
        [/^Il fait passer /i, "It moves "],
        [/^Il met au centre /i, "It places at the center "],
        [/^Elle termine /i, "It ends "],
        [/^Utile pour débattre de /i, "Useful for debating "],
        [/^Utile pour discuter de /i, "Useful for discussing "],
        [/^On peut dire que /i, "One could argue that "],
        [/^Parfois, /i, "Sometimes, "],
        [/^Le paradoxe de Zénon suggère que /i, "Zeno's paradox suggests that "],
        [/^La patience est l'un des grands fils émotionnels du thème\./i, "Patience is one of the theme's strongest emotional threads."],
        [/^Les hôtels sont des lieux de pause qui rendent les voyages possibles\./i, "Hotels are places of pause that make travel possible."],
        [/^Le tourisme moderne vient aussi d'une tradition où voyager servait à se former et à se distinguer\./i, "Modern tourism also grows out of a tradition in which travel was meant to educate and distinguish the traveler."],
        [/^Le tourisme de masse est le produit des transports modernes et d'un accès élargi au loisir\./i, "Mass tourism is the product of modern transport and broader access to leisure."],
        [/^Abandonner n'est pas toujours un échec ; cela peut aussi être une forme de lucidité\./i, "Giving up is not always a failure; it can also be a form of lucidity."],
        [/^Savoir combien de temps il reste peut aider, mais aussi parfois rendre l'attente pire\./i, "Knowing how much time is left can help, but it can also make waiting feel worse."],
        [/^Avec l'infini, même un trajet simple devient mystérieux\./i, "Once infinity enters the picture, even a simple journey becomes mysterious."],
        [/^La patience aide à supporter l'attente, mais elle peut aussi devenir passivité\./i, "Patience helps people endure waiting, but it can also turn into passivity."],
        [/^Certaines des plus grandes idées humaines sont des rêves d'arrivée finale\./i, "Some of humanity's biggest ideas are dreams of a final arrival."],
        [/^Atteindre la fin, c'est souvent se retrouver au début de quelque chose d'autre\./i, "Reaching the end often means finding yourself at the start of something else."],
        [/^Les animaux savent souvent "arriver" sans cartes humaines, grâce à des systèmes biologiques remarquables\./i, "Animals often know how to 'arrive' without human maps, thanks to remarkable biological systems."],
        [/^Naviguer sans technologie moderne demande plus qu'un outil : cela demande une relation intime au monde\./i, "Navigating without modern technology takes more than a tool: it requires an intimate relationship with the world."],
        [/^Ne pas tout savoir à l'avance peut parfois rendre le monde plus riche à découvrir\./i, "Not knowing everything in advance can sometimes make the world richer to discover."],
        [/^La poésie de l'immigration transforme le passage entre deux mondes en expérience intérieure\./i, "Immigration poetry turns the passage between two worlds into an inner experience."],
        [/^L'art du migrant rend visible ce que signifie vivre entre plusieurs appartenances\./i, "Migrant art makes visible what it means to live between multiple forms of belonging."]
      ];

      phraseReplacements.forEach(([pattern, replacement]) => {
        text = text.replace(pattern, replacement);
      });

      const genericReplacements = [
        [/\bà la fois\b/gi, "at the same time"],
        [/\bpas seulement\b/gi, "not only"],
        [/\bmais aussi\b/gi, "but also"],
        [/\bainsi que\b/gi, "as well as"],
        [/\bc'est-à-dire\b/gi, "that is to say"],
        [/\bc'est aussi\b/gi, "it is also"],
        [/\bc'est\b/gi, "it is"],
        [/\bn'est pas seulement\b/gi, "is not only"],
        [/\bn'est pas\b/gi, "is not"],
        [/\bpeut aussi\b/gi, "can also"],
        [/\bparce que\b/gi, "because"],
        [/\btoujours\b/gi, "always"],
        [/\bparfois\b/gi, "sometimes"],
        [/\bjamais\b/gi, "never"],
        [/\bencore\b/gi, "still"],
        [/\bplutôt que\b/gi, "rather than"],
        [/\bau lieu de\b/gi, "instead of"],
        [/\bgrâce à\b/gi, "thanks to"],
        [/\baujourd'hui\b/gi, "today"],
        [/\bhier\b/gi, "yesterday"],
        [/\bdemain\b/gi, "tomorrow"],
        [/\bquestion de savoir si\b/gi, "question of whether"],
        [/\bde la manière dont\b/gi, "the way"],
        [/\bla manière dont\b/gi, "the way"],
        [/\bde plus en plus\b/gi, "more and more"],
        [/\bd'une partie de la population\b/gi, "for part of the population"],
        [/\bdu niveau de vie\b/gi, "the standard of living"],
        [/\bniveau de vie\b/gi, "standard of living"],
        [/\btrajet\b/gi, "journey"],
        [/\btrajets\b/gi, "journeys"],
        [/\bvoyage\b/gi, "travel"],
        [/\bvoyages\b/gi, "travels"],
        [/\bvoyageur\b/gi, "traveler"],
        [/\bvoyageurs\b/gi, "travelers"],
        [/\barrivée\b/gi, "arrival"],
        [/\barriver\b/gi, "arrive"],
        [/\battente\b/gi, "waiting"],
        [/\bprogrès\b/gi, "progress"],
        [/\bseuil\b/gi, "threshold"],
        [/\bseuils\b/gi, "thresholds"],
        [/\bmonde\b/gi, "world"],
        [/\bmondes\b/gi, "worlds"],
        [/\bsociété\b/gi, "society"],
        [/\bsociétés\b/gi, "societies"],
        [/\broute\b/gi, "route"],
        [/\broutes\b/gi, "routes"],
        [/\bdestination\b/gi, "destination"],
        [/\bdestinations\b/gi, "destinations"],
        [/\bpaix définitive\b/gi, "lasting peace"],
        [/\bvictoire finale\b/gi, "final victory"],
        [/\bgrands projets\b/gi, "major projects"],
        [/\bretards\b/gi, "delays"],
        [/\bfrontières\b/gi, "borders"],
        [/\baccueil\b/gi, "reception"],
        [/\basile\b/gi, "asylum"],
        [/\bimmigration\b/gi, "immigration"],
        [/\bmigration\b/gi, "migration"],
        [/\bpoésie\b/gi, "poetry"],
        [/\bpatience\b/gi, "patience"],
        [/\bimpatience\b/gi, "impatience"],
        [/\bambiguïté\b/gi, "ambiguity"],
        [/\bclôture\b/gi, "closure"],
        [/\binjustice\b/gi, "injustice"],
        [/\bimmobilisme\b/gi, "stagnation"],
        [/\bautocontrôle\b/gi, "self-control"],
        [/\bexpérience vécue\b/gi, "lived experience"],
        [/\brôle\b/gi, "role"],
        [/\bvaleur\b/gi, "value"],
        [/\bhumain\b/gi, "human"],
        [/\bhumains\b/gi, "human beings"],
        [/\bvivant\b/gi, "living world"],
        [/\bespèces\b/gi, "species"],
        [/\btechnologie\b/gi, "technology"],
        [/\btechnologies\b/gi, "technologies"],
        [/\boutils\b/gi, "tools"],
        [/\boutils de navigation\b/gi, "navigation tools"],
        [/\bnavigation\b/gi, "navigation"],
        [/\bcolonial\b/gi, "colonial"],
        [/\bcolonialisme\b/gi, "colonialism"],
        [/\bdomination\b/gi, "domination"],
        [/\bpolitique\b/gi, "political"],
        [/\bpolitiques\b/gi, "policies"],
        [/\bjuridique\b/gi, "legal"],
        [/\bidentité\b/gi, "identity"],
        [/\bidentités\b/gi, "identities"],
        [/\bappartenance\b/gi, "belonging"],
        [/\bappartenances\b/gi, "belongings"],
        [/\bœuvres\b/gi, "works"],
        [/\bart\b/gi, "art"],
        [/\bmusique\b/gi, "music"],
        [/\broute la plus directe\b/gi, "the most direct route"],
        [/\bchemin le plus court\b/gi, "the shortest path"],
        [/\bmeilleur chemin\b/gi, "best route"],
        [/\bchez-soi\b/gi, "home"],
        [/\bquitter\b/gi, "quit"],
        [/\bpersévérer\b/gi, "keep going"],
        [/\bdurée\b/gi, "duration"],
        [/\bpeut être\b/gi, "may be"],
        [/\btrop vite\b/gi, "too quickly"],
        [/\bpeut rendre\b/gi, "can make"],
        [/\bsécuriser\b/gi, "make safer"],
        [/\benrichir\b/gi, "enrich"],
        [/\bdécouvrir\b/gi, "discover"],
        [/\bfaire partie de\b/gi, "be part of"],
        [/\bmettre au centre\b/gi, "place at the center of"],
        [/\bfaire visible\b/gi, "make visible"],
        [/\bdeux mondes\b/gi, "two worlds"],
        [/\bplus puissan(te|t)\b/gi, "more powerful"],
        [/\bfinale\b/gi, "final"],
        [/\bfinale\b/gi, "final"]
      ];

      genericReplacements.forEach(([pattern, replacement]) => {
        text = text.replace(pattern, replacement);
      });

      text = text
        .replace(/\bdu thème\b/gi, "of the theme")
        .replace(/\bdu trajet\b/gi, "of the journey")
        .replace(/\bde l'arrivée\b/gi, "of arrival")
        .replace(/\bdu voyage\b/gi, "of travel")
        .replace(/\bde la route\b/gi, "of the route")
        .replace(/\bd'une manière\b/gi, "in a way")
        .replace(/\bet de la question de savoir si\b/gi, "and the question of whether")
        .replace(/\bet de la manière dont\b/gi, "and the way")
        .replace(/\bet du fait que\b/gi, "and the fact that")
        .replace(/\bne peut pas\b/gi, "cannot")
        .replace(/\bne peuvent pas\b/gi, "cannot")
        .replace(/\bdevenir\b/gi, "become")
        .replace(/\bdevenu\b/gi, "become")
        .replace(/\best devenu\b/gi, "has become")
        .replace(/\bpose\b/gi, "raises")
        .replace(/\bmontre\b/gi, "shows")
        .replace(/\bexplique\b/gi, "explains")
        .replace(/\boppose\b/gi, "contrasts")
        .replace(/\bcompare\b/gi, "compares")
        .replace(/\binterroge\b/gi, "questions")
        .replace(/\brappelle\b/gi, "reminds us")
        .replace(/\bélargit\b/gi, "broadens")
        .replace(/\brelie\b/gi, "connects")
        .replace(/\btermine\b/gi, "ends")
        .replace(/\bouvre\b/gi, "opens")
        .replace(/\bdoit\b/gi, "must")
        .replace(/\bpeut\b/gi, "can")
        .replace(/\bpeuvent\b/gi, "can")
        .replace(/\bsert\b/gi, "serves")
        .replace(/\bservent\b/gi, "serve")
        .replace(/\best aussi\b/gi, "is also")
        .replace(/\bcela\b/gi, "that")
        .replace(/\bquelque part\b/gi, "somewhere")
        .replace(/\btout à fait\b/gi, "entirely")
        .replace(/\bbien plus que\b/gi, "much more than")
        .replace(/\bde plus\b/gi, "moreover")
        .replace(/\bde même\b/gi, "likewise");

      text = text
        .replace(/\s+([,.;:!?])/g, "$1")
        .replace(/\(\s+/g, "(")
        .replace(/\s+\)/g, ")")
        .replace(/\s{2,}/g, " ")
        .trim();

      if (text && !/[.!?]$/.test(text)) {
        text += ".";
      }

      return text;
    }

    function normalizeRawEntryTitle(entry, index) {
      const candidate = stripMasterTemplateSuffix(entry?.title || "");
      if (candidate && !looksFrenchText(candidate)) {
        return candidate;
      }

      const derived = deriveEnglishTitleFromRawText(entry?.rawOfficialText);
      return derived || `Entry ${index + 1}`;
    }

    function deriveEnglishTitleFromRawText(value) {
      const text = normalizeWhitespace(value);
      if (!text) {
        return "";
      }

      const firstSentence = text.split(/[.?!]/)[0].trim();
      if (!firstSentence) {
        return "";
      }

      return firstSentence.length > 88
        ? `${firstSentence.slice(0, 85).trim()}...`
        : firstSentence;
    }

    function normalizeEnglishOnlyField(value, fallback) {
      const text = normalizeWhitespace(value);
      if (!text) {
        return "";
      }

      return looksFrenchText(text) ? fallback : text;
    }

    function normalizeEnglishOnlyShortField(value, fallback) {
      const text = normalizeWhitespace(value);
      if (!text) {
        return "";
      }

      return looksFrenchText(text) ? fallback : text;
    }

    function stripMasterTemplateSuffix(value) {
      return String(value || "")
        .replace(/\s+[—-]\s+MASTER TEMPLATE APPLIQU[ÉE]/gi, "")
        .trim();
    }

    function normalizeWhitespace(value) {
      return String(value || "")
        .replace(/\s+/g, " ")
        .trim();
    }

    function lowerFirst(value) {
      const text = normalizeWhitespace(value);
      return text ? text.charAt(0).toLowerCase() + text.slice(1) : "";
    }

    function joinHumanList(items = []) {
      const clean = items.map((item) => normalizeWhitespace(item)).filter(Boolean);
      if (!clean.length) {
        return "";
      }
      if (clean.length === 1) {
        return clean[0];
      }
      if (clean.length === 2) {
        return `${clean[0]} and ${clean[1]}`;
      }
      return `${clean.slice(0, -1).join(", ")}, and ${clean[clean.length - 1]}`;
    }

    function deriveEnglishLead(value) {
      const sentence = deriveEnglishTitleFromRawText(value);
      if (!sentence) {
        return "";
      }

      return sentence.endsWith("...") ? `${sentence.slice(0, -3).trim()}...` : sentence;
    }

    function looksFrenchText(value) {
      const text = normalizeWhitespace(value);
      if (!text) {
        return false;
      }

      if (FRENCH_TEXT_PATTERN.test(text)) {
        return true;
      }

      const words = text
        .toLowerCase()
        .replace(/[^a-z'\- ]/g, " ")
        .split(/\s+/)
        .filter(Boolean);

      if (words.length < 5) {
        return false;
      }

      let hits = 0;
      words.forEach((word) => {
        if (FRENCH_STOPWORDS.has(word)) {
          hits += 1;
        }
      });

      return hits >= 2 && hits / words.length >= 0.15;
    }



    return {
      normalizeRawContentSections,
      normalizeRawContentSection,
      normalizeBigIdeaLabels,
      expandBigIdeaLabels,
      normalizeRawContentEntry,
      normalizeMappedLabels,
      mapAliasLabel,
      normalizeRawQuizQuestion,
      normalizeFullVoyageQuestions,
      normalizeRawWrongAnswers,
      normalizeSupportField,
      generateEnglishSupportText,
      translateFrenchSupportText,
      normalizeRawEntryTitle,
      deriveEnglishTitleFromRawText,
      normalizeEnglishOnlyField,
      normalizeEnglishOnlyShortField,
      stripMasterTemplateSuffix,
      normalizeWhitespace,
      lowerFirst,
      joinHumanList,
      deriveEnglishLead,
      looksFrenchText
    };
  }

  global.WSC_CREATE_CONTENT_NORMALIZATION_HELPERS = createContentNormalizationHelpers;
})(window);

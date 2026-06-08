(function () {
  const FLOW_STEPS = [
    "Media stimulus",
    "Connection logic",
    "Syllabus target",
    "Question",
    "Answer"
  ];

  const STIMULUS_PATH = "./assets/scholars-bowl/stimuli";
  const ORIGINAL_STIMULUS_CREDIT = "Original WSC app classroom stimulus";
  const ORIGINAL_STIMULUS_NOTE = "Created locally for Scholar's Bowl use; it is a teaching stimulus, not an exact source reproduction.";

  const STIMULUS_ARCHETYPES = [
    {
      id: "airport-limbo",
      mediaKind: "generated image",
      role: "bridge",
      keywords: ["liminality", "liminal", "waiting", "delay", "arrival", "migration", "border", "terminal", "journey"],
      title: "Endless airport corridor",
      description: "A slow shot down a nearly empty airport corridor where every sign points onward but nobody arrives.",
      cue: "Movement becomes suspension: the media feels like travel, but the emotional fact is waiting.",
      hooks: ["airport limbo", "The Terminal", "migrant waiting", "journeys without arrival", "bureaucratic borders"],
      resource: {
        decision: "generated-stimulus",
        type: "generated-image",
        localPath: `${STIMULUS_PATH}/airport-limbo.svg`,
        credit: ORIGINAL_STIMULUS_CREDIT,
        licenseOrUseNote: ORIGINAL_STIMULUS_NOTE,
        altText: "An endless airport corridor with signs for gates, arrivals, and border checks, but no visible destination.",
        mediaMattersCheck: "The corridor makes the answer depend on liminal movement: students must explain waiting, borders, and non-arrival rather than naming an airport."
      }
    },
    {
      id: "apocalypse-lyric",
      mediaKind: "audio/text parody",
      role: "emotional setup",
      keywords: ["apocalypse", "collapse", "endings", "doom", "doomsday", "prediction", "future", "climate", "nearish"],
      title: "Fake song lyric about the world ending",
      description: "A dramatic chorus keeps announcing that tomorrow is cancelled, then undercuts itself with a nervous joke.",
      cue: "The stimulus turns catastrophe into performance, warning, rhythm, and cultural mood.",
      hooks: ["The End Is Nearish", "Doomsday Clock", "apocalyptic music", "R.E.M.", "Black Sabbath", "climate anxiety"],
      resource: {
        decision: "generated-stimulus",
        type: "generated-image",
        localPath: `${STIMULUS_PATH}/apocalypse-lyric.svg`,
        credit: ORIGINAL_STIMULUS_CREDIT,
        licenseOrUseNote: "Original short parody lyric written for the app; it does not quote protected song lyrics.",
        altText: "A fake apocalyptic chorus sheet beside a doom-themed audio display and countdown clock.",
        mediaMattersCheck: "The lyric sheet makes catastrophe feel performed and catchy, which is the bridge to apocalyptic culture rather than simple prediction.",
        sourceLinks: [
          {
            label: "Doomsday Clock official page",
            url: "https://thebulletin.org/doomsday-clock/"
          }
        ]
      }
    },
    {
      id: "ranking-storm",
      mediaKind: "montage",
      role: "visual trap",
      keywords: ["progress", "measure", "measurement", "index", "rank", "ranking", "gdp", "comparison", "number"],
      title: "Rankings, maps, graphs, and angry comments",
      description: "A fast montage of global scoreboards, colored maps, line graphs, and comment threads arguing about who is really winning.",
      cue: "The media invites comparison, then makes comparison feel unstable and socially costly.",
      hooks: ["Progress Not Regress", "global indexes", "GDP", "Big Mac Index", "measurement", "discontent"],
      resource: {
        decision: "data-built",
        type: "montage",
        localPath: `${STIMULUS_PATH}/ranking-storm.svg`,
        credit: ORIGINAL_STIMULUS_CREDIT,
        licenseOrUseNote: "Composite classroom graphic inspired by public data dashboards; not a screenshot of any one source.",
        altText: "A dashboard of rankings, a map, a rising GDP line, and angry comments about whether progress feels real.",
        mediaMattersCheck: "The montage forces students to notice the tension between measured progress and lived dissatisfaction.",
        sourceLinks: [
          {
            label: "World Bank GDP data",
            url: "https://data.worldbank.org/indicator/NY.GDP.MKTP.CD"
          },
          {
            label: "OECD Better Life Index",
            url: "https://www.oecdbetterlifeindex.org/"
          }
        ]
      }
    },
    {
      id: "prototype-demo",
      mediaKind: "generated image",
      role: "source analogy",
      keywords: ["prototype", "draft", "unfinished", "incompletion", "model", "simulation", "design"],
      title: "Demo reel where the rough draft keeps showing through",
      description: "A polished product demo glitches into wireframes, cardboard mockups, test notes, and half-finished versions.",
      cue: "The stimulus makes the hidden middle stage visible instead of treating the final product as the whole story.",
      hooks: ["Monkey See, Monkey Prototype", "drafts and prototypes", "hidden labor", "readiness vs performance"],
      resource: {
        decision: "generated-stimulus",
        type: "generated-image",
        localPath: `${STIMULUS_PATH}/prototype-demo.svg`,
        credit: ORIGINAL_STIMULUS_CREDIT,
        licenseOrUseNote: ORIGINAL_STIMULUS_NOTE,
        altText: "A polished demo screen reveals wireframes, cardboard mockups, and test notes underneath.",
        mediaMattersCheck: "The visual makes incompletion visible, so the question can ask why drafts and prototypes are part of the meaning rather than failed final products.",
        sourceLinks: [
          {
            label: "Sagrada Familia official site",
            url: "https://sagradafamilia.org/en/"
          }
        ]
      }
    },
    {
      id: "home-split-screen",
      mediaKind: "image pair",
      role: "emotional setup",
      keywords: ["home", "wandering", "migration", "tourism", "belonging", "exile", "place"],
      title: "Two homes on one split screen",
      description: "One half shows a packed suitcase by a doorway; the other shows a map pin blinking over a place that still feels distant.",
      cue: "The media makes home feel less like one location and more like an argument between memory, movement, and belonging.",
      hooks: ["Home and Wandering", "migration poems", "tourism", "belonging", "living between places"],
      resource: {
        decision: "generated-stimulus",
        type: "generated-image",
        localPath: `${STIMULUS_PATH}/home-split-screen.svg`,
        credit: ORIGINAL_STIMULUS_CREDIT,
        licenseOrUseNote: ORIGINAL_STIMULUS_NOTE,
        altText: "A split screen shows a suitcase beside a doorway and a blinking map pin over a distant place.",
        mediaMattersCheck: "The split screen prevents home from being reduced to one coordinate; it cues memory, departure, and multiple belonging."
      }
    },
    {
      id: "recalculating-map",
      mediaKind: "generated image",
      role: "clue",
      keywords: ["route", "road", "navigation", "wayfinding", "map", "infrastructure", "journey"],
      title: "Map app endlessly recalculating",
      description: "A navigation app keeps drawing a route, erasing it, and drawing another route while the destination stays fixed.",
      cue: "The stimulus points to routes as systems that shape behavior, not neutral background lines.",
      hooks: ["routes", "roads", "navigation", "wayfinding", "infrastructure", "Are We There Yet?"],
      resource: {
        decision: "generated-stimulus",
        type: "generated-image",
        localPath: `${STIMULUS_PATH}/recalculating-map.svg`,
        credit: ORIGINAL_STIMULUS_CREDIT,
        licenseOrUseNote: ORIGINAL_STIMULUS_NOTE,
        altText: "A navigation map redraws two competing routes toward the same destination under a recalculating label.",
        mediaMattersCheck: "The changing route makes students reason about infrastructure and wayfinding systems, not just a destination.",
        sourceLinks: [
          {
            label: "Route 66 NPS overview",
            url: "https://www.nps.gov/subjects/travelroute66/index.htm"
          }
        ]
      }
    },
    {
      id: "threshold-line",
      mediaKind: "generated image",
      role: "analogy",
      keywords: ["threshold", "transition", "adulthood", "rite", "passage", "irreversible"],
      title: "A line painted across a doorway",
      description: "Someone stands with one foot on each side of a doorway line while forms, ID cards, and ceremonial objects sit nearby.",
      cue: "The media makes a gradual change look like a visible crossing, then asks whether the crossing is really that simple.",
      hooks: ["Going Pains", "rites of passage", "adolescence", "thresholds", "irreversibility"],
      resource: {
        decision: "generated-stimulus",
        type: "generated-image",
        localPath: `${STIMULUS_PATH}/threshold-line.svg`,
        credit: ORIGINAL_STIMULUS_CREDIT,
        licenseOrUseNote: ORIGINAL_STIMULUS_NOTE,
        altText: "A person stands across a painted doorway line near an ID card and permission form.",
        mediaMattersCheck: "The line tempts students to treat transition as a single crossing, which sets up the better answer about gradual change and social recognition."
      }
    },
    {
      id: "default-connection-board",
      mediaKind: "visual prompt",
      role: "bridge",
      keywords: [],
      title: "Connection board with one missing link",
      description: "A board of screenshots, article snippets, maps, and lyrics has one empty label at the center.",
      cue: "The media tells teams that the task is not identification; it is finding the pattern that makes the pieces belong together.",
      hooks: ["cross-section link", "big idea", "theme pattern", "Are We There Yet?"],
      resource: {
        decision: "generated-stimulus",
        type: "generated-image",
        localPath: `${STIMULUS_PATH}/connection-board.svg`,
        credit: ORIGINAL_STIMULUS_CREDIT,
        licenseOrUseNote: ORIGINAL_STIMULUS_NOTE,
        altText: "A connection board links a map, lyric, graph, and doorway to a blank center label.",
        mediaMattersCheck: "The blank center makes the Bowl task explicit: infer the pattern that connects fragments from several syllabus areas."
      }
    }
  ];

  const QUESTION_MODES = [
    "best-connection",
    "target-group",
    "media-purpose",
    "tempting-wrong"
  ];

  const ARCHETYPE_FORCE_RULES = [
    { id: "ranking-storm", keywords: ["progress", "ranking", "rankings", "index", "gdp", "measurement"] },
    { id: "prototype-demo", keywords: ["prototype", "draft", "wireframe", "mockup", "unfinished"] },
    { id: "apocalypse-lyric", keywords: ["apocalypse", "doomsday", "doom", "nearish", "collapse"] },
    { id: "recalculating-map", keywords: ["infrastructure", "road", "roads", "route", "routes", "navigation", "wayfinding", "map"] },
    { id: "airport-limbo", keywords: ["airport", "terminal", "limbo", "liminal", "liminality", "waiting"] },
    { id: "threshold-line", keywords: ["threshold", "rite", "adolescence", "adulting", "irreversible"] },
    { id: "home-split-screen", keywords: ["home", "wandering", "migration", "belonging", "exile"] }
  ];

  function normalizeKey(value) {
    return String(value || "")
      .toLowerCase()
      .replace(/&/g, " and ")
      .replace(/[^a-z0-9]+/g, " ")
      .trim();
  }

  function compact(value) {
    return String(value || "").replace(/\s+/g, " ").trim();
  }

  function unique(values) {
    const seen = new Set();
    return (values || []).filter((value) => {
      const key = normalizeKey(value);
      if (!key || seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  function truncate(value, maxLength = 230) {
    const text = compact(value);
    if (text.length <= maxLength) {
      return text;
    }
    return `${text.slice(0, maxLength - 1).trim()}...`;
  }

  function joinTitles(titles) {
    const clean = unique(titles).slice(0, 3);
    if (clean.length <= 1) {
      return clean[0] || "the selected syllabus material";
    }
    if (clean.length === 2) {
      return `${clean[0]} and ${clean[1]}`;
    }
    return `${clean[0]}, ${clean[1]}, and ${clean[2]}`;
  }

  function getEntryTitle(entry, index = 0) {
    return compact(entry?.title || entry?.subtopic || entry?.sectionTitle || `Syllabus entry ${index + 1}`);
  }

  function getSectionLabel(entry, helpers = {}) {
    const direct = compact(entry?.sectionTitle || entry?.guidingSection || entry?.sectionLabel);
    if (direct) {
      return direct;
    }

    const section = helpers.sectionById && entry?.sectionId ? helpers.sectionById[entry.sectionId] : null;
    return compact(section?.title || "Guiding Section");
  }

  function getEntryBigIdeas(entry) {
    return unique(Array.isArray(entry?.bigIdeas) ? entry.bigIdeas : []);
  }

  function getEntrySubjects(entry) {
    return unique(Array.isArray(entry?.subjects) ? entry.subjects : []);
  }

  function getEntryExamples(entry) {
    return unique(Array.isArray(entry?.examples) ? entry.examples : []);
  }

  function getEntryFocus(entry) {
    return compact(
      entry?.takeaway ||
      entry?.whyItMatters ||
      entry?.studentExplanation ||
      entry?.rawOfficialText ||
      ""
    );
  }

  function getGroupLabel(group) {
    return compact(group.bigIdea || group.subject || group.sectionLabel || "theme connection");
  }

  function pickArchetype(group) {
    const haystack = normalizeKey([
      group.bigIdea,
      group.subject,
      group.sectionLabel,
      group.entries.map((entry) => [
        entry.title,
        entry.studentExplanation,
        entry.whyItMatters,
        entry.takeaway,
        (entry.examples || []).join(" "),
        (entry.bigIdeas || []).join(" ")
      ].join(" ")).join(" ")
    ].join(" "));

    const forcedRule = ARCHETYPE_FORCE_RULES.find((rule) =>
      rule.keywords.some((keyword) => haystack.includes(normalizeKey(keyword)))
    );
    if (forcedRule) {
      const forcedArchetype = STIMULUS_ARCHETYPES.find((archetype) => archetype.id === forcedRule.id);
      if (forcedArchetype) {
        return forcedArchetype;
      }
    }

    let best = STIMULUS_ARCHETYPES[STIMULUS_ARCHETYPES.length - 1];
    let bestScore = 0;

    STIMULUS_ARCHETYPES.slice(0, -1).forEach((archetype) => {
      const score = archetype.keywords.reduce((sum, keyword) => (
        haystack.includes(normalizeKey(keyword)) ? sum + 1 : sum
      ), 0);
      if (score > bestScore) {
        best = archetype;
        bestScore = score;
      }
    });

    return best;
  }

  function buildGroups(entries, helpers = {}) {
    const groupsByKey = new Map();

    entries.forEach((entry, entryIndex) => {
      const bigIdeas = getEntryBigIdeas(entry);
      const subjects = getEntrySubjects(entry);
      const sectionLabel = getSectionLabel(entry, helpers);
      const primaryLabels = bigIdeas.length ? bigIdeas : subjects.length ? subjects.slice(0, 2) : [sectionLabel];

      primaryLabels.forEach((label) => {
        const key = normalizeKey(label);
        if (!key) {
          return;
        }
        if (!groupsByKey.has(key)) {
          groupsByKey.set(key, {
            key,
            bigIdea: bigIdeas.includes(label) ? label : "",
            subject: subjects.includes(label) ? label : "",
            sectionLabel,
            entries: []
          });
        }
        groupsByKey.get(key).entries.push({ ...entry, __bowlIndex: entryIndex });
      });
    });

    const groups = Array.from(groupsByKey.values())
      .map((group) => ({
        ...group,
        entries: uniqueEntries(group.entries).slice(0, 4)
      }))
      .filter((group) => group.entries.length)
      .sort((left, right) => {
        const entryDelta = right.entries.length - left.entries.length;
        if (entryDelta !== 0) {
          return entryDelta;
        }
        return getGroupLabel(left).localeCompare(getGroupLabel(right));
      });

    const sectionGroups = buildSectionGroups(entries, helpers);
    return uniqueGroups(groups.concat(sectionGroups));
  }

  function uniqueEntries(entries) {
    const seen = new Set();
    return (entries || []).filter((entry) => {
      const key = normalizeKey(`${entry.sectionId || entry.guidingSection}|${getEntryTitle(entry, entry.__bowlIndex)}`);
      if (!key || seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  function buildSectionGroups(entries, helpers = {}) {
    const bySection = new Map();
    entries.forEach((entry, entryIndex) => {
      const sectionLabel = getSectionLabel(entry, helpers);
      const key = normalizeKey(sectionLabel);
      if (!key) {
        return;
      }
      if (!bySection.has(key)) {
        bySection.set(key, {
          key: `section-${key}`,
          bigIdea: "",
          subject: "",
          sectionLabel,
          entries: []
        });
      }
      bySection.get(key).entries.push({ ...entry, __bowlIndex: entryIndex });
    });

    return Array.from(bySection.values())
      .map((group) => ({ ...group, entries: uniqueEntries(group.entries).slice(0, 4) }))
      .filter((group) => group.entries.length >= 2);
  }

  function uniqueGroups(groups) {
    const seen = new Set();
    return groups.filter((group) => {
      const titles = group.entries.map((entry) => getEntryTitle(entry, entry.__bowlIndex)).join("|");
      const key = normalizeKey(`${getGroupLabel(group)}|${titles}`);
      if (!key || seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  function buildTargets(group, helpers = {}) {
    return group.entries.map((entry, index) => ({
      title: getEntryTitle(entry, index),
      sectionId: entry.sectionId || "",
      sectionLabel: getSectionLabel(entry, helpers),
      subjectLabels: getEntrySubjects(entry).slice(0, 3),
      bigIdeaLabels: getEntryBigIdeas(entry).slice(0, 3),
      examples: getEntryExamples(entry).slice(0, 4),
      focus: truncate(getEntryFocus(entry), 280)
    }));
  }

  function rotateOptions(options, index) {
    const offset = index % options.length;
    return options.slice(offset).concat(options.slice(0, offset));
  }

  function buildQuestion(group, archetype, targets, index, routeTitle) {
    const mode = QUESTION_MODES[index % QUESTION_MODES.length];
    const label = getGroupLabel(group);
    const targetTitles = joinTitles(targets.map((target) => target.title));
    const visibleHook = archetype.title.toLowerCase();
    const route = compact(routeTitle || "the selected route");

    const bestConnection = `It reads the ${visibleHook} as an outside concrete detail, then connects ${targetTitles} through ${label} because the same pressure appears in the syllabus.`;
    const targetGroup = `${targetTitles} is the strongest target group because the media gives one shared clue about ${label}, not a one-entry identification clue.`;
    const mediaPurpose = `The stimulus changes the reasoning task: without it, teams would lose the visible pressure that turns ${route} into a connection question.`;
    const temptingWrong = `The tempting but wrong move is to name or describe the media, then answer a separate recall question; Bowl answers must explain why the media and syllabus illuminate each other.`;

    const questionByMode = {
      "best-connection": {
        prompt: `A Scholar's Bowl round opens with this ${archetype.mediaKind}: ${archetype.description} Which answer best explains why this media belongs in the round?`,
        correct: bestConnection,
        wrongs: [
          `It is mainly decorative, so the same question would work if the media were removed.`,
          `It points only to one isolated fact from ${targets[0]?.title || route}, not to a wider connection.`,
          `It asks teams to identify the clip or image before moving on to an unrelated recall question.`
        ]
      },
      "target-group": {
        prompt: `The stimulus appears before the question, and teams are told it may point to more than one syllabus entry. Which target group is the strongest fit?`,
        correct: targetGroup,
        wrongs: [
          `Only ${targets[0]?.title || route}, because Bowl media should point to exactly one answer every time.`,
          `Any entry with a famous image, because recognition is more important than connection logic.`,
          `No syllabus target is needed; the media can stand alone as entertainment between questions.`
        ]
      },
      "media-purpose": {
        prompt: `Why would this stimulus be shown before or during the question instead of being left out?`,
        correct: mediaPurpose,
        wrongs: [
          `It makes the card look richer, but it does not change the reasoning task.`,
          `It lets teams ignore the syllabus and answer from general vibes.`,
          `It narrows the question to the literal object shown on screen.`
        ]
      },
      "tempting-wrong": {
        prompt: `Which interpretation of the stimulus is tempting but wrong for a Scholar's Bowl question?`,
        correct: temptingWrong,
        wrongs: [
          bestConnection,
          `The stimulus can act as a bridge from a concrete scene to ${label}.`,
          `The best answer should explain why the media and the syllabus target illuminate each other.`
        ]
      }
    };

    const spec = questionByMode[mode] || questionByMode["best-connection"];
    const options = rotateOptions([spec.correct, ...spec.wrongs], index + 1);
    return {
      mode,
      prompt: spec.prompt,
      options,
      answerIndex: options.indexOf(spec.correct),
      correctAnswer: spec.correct,
      visibleCorrectExplanation: buildExplanation(group, archetype, targets, routeTitle),
      visibleConnection: buildVisibleConnection(group, archetype, targets),
      optionFeedback: options.map((option) =>
        option === spec.correct
          ? "This matches the level 400/500 move: concrete stimulus, similar pressure, best connection."
          : "This either makes the media decorative, too literal, too isolated, or separate from the answer logic."
      )
    };
  }

  function buildExplanation(group, archetype, targets, routeTitle) {
    const label = getGroupLabel(group);
    const targetTitles = joinTitles(targets.map((target) => target.title));
    const route = compact(routeTitle || "this route");

    return `The question starts from a concrete detail in ${archetype.title}: ${archetype.cue} It is really asking which answer handles a similar pressure. ${targetTitles} is the best connection because the media turns ${label} into something students can see before they name it inside ${route}.`;
  }

  function buildVisibleConnection(group, archetype, targets) {
    const label = getGroupLabel(group);
    const targetTitles = joinTitles(targets.map((target) => target.title));
    return `The media matters because it makes ${label} visible first, then asks teams to connect that pressure to ${targetTitles}. Removing the media would remove the clue, not just the decoration.`;
  }

  function buildRound(group, index, routeTitle, helpers = {}) {
    const archetype = pickArchetype(group);
    const targets = buildTargets(group, helpers);
    const question = buildQuestion(group, archetype, targets, index, routeTitle);
    const resource = archetype.resource || {};
    const connectionLabel = getGroupLabel(group);
    const sectionIds = unique(targets.map((target) => target.sectionId).filter(Boolean));
    const subjectLabels = unique(targets.flatMap((target) => target.subjectLabels));
    const bigIdeaLabels = unique([
      connectionLabel,
      ...targets.flatMap((target) => target.bigIdeaLabels)
    ]);

    return {
      id: `bowl-${index + 1}-${archetype.id}-${normalizeKey(connectionLabel).replace(/\s+/g, "-")}`,
      sourceType: "scholars-bowl-production",
      rawLevel: 4,
      sectionId: sectionIds[0] || "",
      sectionIds,
      subjectIds: [],
      bigIdeaIds: [],
      subjectLabels,
      bigIdeaLabels,
      connectionLabel,
      media: {
        kind: archetype.mediaKind,
        role: archetype.role,
        title: archetype.title,
        description: archetype.description,
        cue: archetype.cue,
        hooks: unique(archetype.hooks.concat(targets.flatMap((target) => target.examples))).slice(0, 8),
        resourceDecision: resource.decision || "question-rewrite",
        type: resource.type || archetype.mediaKind,
        localPath: resource.localPath || "",
        sourceUrl: resource.sourceUrl || "",
        sourceLinks: Array.isArray(resource.sourceLinks) ? resource.sourceLinks.slice(0, 4) : [],
        credit: resource.credit || "",
        licenseOrUseNote: resource.licenseOrUseNote || "",
        altText: resource.altText || archetype.description,
        mediaMattersCheck: resource.mediaMattersCheck || ""
      },
      targets,
      connectionLogic: buildConnectionLogic(group, archetype, targets),
      qualityGate: buildQualityGate(group, archetype, targets),
      prompt: question.prompt,
      options: question.options,
      answerIndex: question.answerIndex,
      correctAnswer: question.correctAnswer,
      visibleCorrectExplanation: question.visibleCorrectExplanation,
      visibleConnection: question.visibleConnection,
      optionFeedback: question.optionFeedback
    };
  }

  function buildConnectionLogic(group, archetype, targets) {
    const label = getGroupLabel(group);
    const targetTitles = joinTitles(targets.map((target) => target.title));
    return `The stimulus creates a bridge from ${archetype.title.toLowerCase()} to ${targetTitles}: it asks teams to notice ${label} in the media, then use that same pressure to interpret several official syllabus targets at once.`;
  }

  function buildQualityGate(group, archetype, targets) {
    const label = getGroupLabel(group);
    const resource = archetype.resource || {};
    return [
      `Media role: ${archetype.role}.`,
      `Resource route: ${resource.decision || "question-rewrite"}.`,
      `If removed, teams lose the concrete clue that turns the question toward ${label}.`,
      `The target is allowed to be plural: ${targets.length} syllabus ${targets.length === 1 ? "entry" : "entries"} are connected here.`,
      resource.mediaMattersCheck || "The wrong path is simple identification; the right path is explaining the relationship."
    ];
  }

  function buildProductionSet(entries, options = {}, helpers = {}) {
    const routeTitle = compact(options.routeTitle || "Selected route");
    const usableEntries = uniqueEntries((entries || []).filter(Boolean));
    if (!usableEntries.length) {
      return [];
    }

    const groups = buildGroups(usableEntries, helpers);
    const rounds = groups.map((group, index) => buildRound(group, index, routeTitle, helpers));

    return rounds.slice(0, options.limit || 12);
  }

  window.WSC_SCHOLARS_BOWL_SERVICE = Object.freeze({
    flowSteps: FLOW_STEPS,
    buildProductionSet,
    buildGroups,
    buildRound
  });
}());

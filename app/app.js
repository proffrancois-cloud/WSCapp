const data = window.WSC_DATA;
const knowledgeBank = window.WSC_KNOWLEDGE_BANK || { sections: [] };
const alpacaChannelCatalog = window.WSC_ALPACA_CHANNEL || { videos: [] };
const assetConfig = window.WSC_ASSETS || {};
const debateLabData = window.WSC_DEBATE_LAB_DATA || { topics: [], judgePrep: [], howToUse: [] };
const OFFICIAL_WSC_GUIDING_URL = "https://www.scholarscup.org/subjects/2026/guiding-2026/";
const supabaseConfig = window.WSC_SUPABASE_CONFIG || {};
const SUPABASE_URL = supabaseConfig.url || "https://bwogymstqrrmoxlwlhio.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = supabaseConfig.publishableKey || "";
const ASSET_CACHE_VERSION = "20260524coop2";
const appAuthService = window.WSC_AUTH_SERVICE || null;
const appEntryService = window.WSC_APP_ENTRY_SERVICE;
const createOnlineModeController = window.WSC_CREATE_ONLINE_MODE_CONTROLLER;
const appBootstrapService = window.WSC_APP_BOOTSTRAP_SERVICE;
const appStateService = window.WSC_APP_STATE_SERVICE;
const appDomService = window.WSC_APP_DOM_SERVICE;
const modalFocusService = window.WSC_MODAL_FOCUS_SERVICE || null;
const routeBuilderController = window.WSC_ROUTE_BUILDER_CONTROLLER;
const createAuthController = window.WSC_CREATE_AUTH_CONTROLLER;
const createProgressStorageController = window.WSC_CREATE_PROGRESS_STORAGE_CONTROLLER;
const createGameLaunchController = window.WSC_CREATE_GAME_LAUNCH_CONTROLLER;
const DISCORD_INVITE_URL = "https://discord.gg/5m6tCSBy";
const CONTACT_EMAIL_URL = "mailto:frenchease.admin@gmail.com";
const CAMPUS_PREVIEW_PUBLIC_ENABLED = true;
const LEGACY_LIVE_ROOMS_PUBLIC_ENABLED = false;
const UNAVAILABLE_MODE_REASONS = Object.freeze({
  writing: "Collaborative Writing is available soon. We are keeping it closed for this public build.",
  buildcase: "Debate Lab is available soon. We are keeping it closed for this public build.",
  bowl: "Scholar's Bowl is available soon. We are keeping it closed for this public build."
});
const ALPACA_NAME_PATTERN = appAuthService?.alpacaNamePattern || /^[a-z0-9][a-z0-9_-]{2,31}$/;
const MULTIPLAYER_ALLOWED_EMAILS = new Set([
  "moretfrancoisea@gmail.com",
  "francois.moret@ilg-ks.org",
  "frenchease.admin@gmail.com",
  "ballingballer6969@gmail.com"
]);
const MULTIPLAYER_ALLOWED_EMAIL_DOMAINS = new Set([
  "ilg-ks.org",
  "hcas.com.tw",
  "ykc.edu.mk"
]);
const WSC_ROUND_OPTIONS = [
  { value: "none_yet", label: "None yet" },
  { value: "regional_round", label: "Regional Round" },
  { value: "global_round", label: "Global Round" },
  { value: "tournament_of_champions", label: "Tournament of Champions" }
];

const sectionById = Object.fromEntries(data.sections.map((section) => [section.id, section]));
const subjectById = Object.fromEntries(data.subjects.map((subject) => [subject.id, subject]));
let sectionKnowledgeById = {};
let subjectKnowledgeById = {};
let learnSubjectKnowledgeById = {};
let bigIdeaKnowledgeById = {};
let wholeThemeKnowledge = null;
let jeopardyTimerId = null;
let runTimerId = null;
let raceTimerId = null;
let relayAnswerTimerId = null;
let jumpAnimationId = null;
let mindMapOrbitAnimationId = null;
let relayBuzzAudio = null;
let relayBuzzAudioSrc = null;
let liveLaunchCountdownTimerId = null;
let debateSpinTimerId = null;
let debateRevealTimerId = null;

const GAME_CONFIG = {
  raceLives: 3,
  raceQuestionTime: 20,
  raceMinQuestionCount: 1,
  raceMaxQuestionCount: 15,
  raceDefaultQuestionCount: 15,
  jeopardyMaxGroups: 5,
  jeopardyMinGroups: 4,
  jeopardyValues: [100, 200, 300, 400, 500],
  jeopardyAnswerTime: 30,
  jeopardyDefaultTeams: 2,
  jeopardyMinTeams: 2,
  jeopardyMaxTeams: 4,
  runRegionalLevelOneCount: 10,
  runRegionalLevelTwoCount: 5,
  runGlobalLevelThreeCount: 3,
  runGlobalLevelFourCount: 2,
  runMapVerticalOffsetPercent: 0,
  runYaleLevelFiveCount: 3,
  runTotalTime: 240,
  jumpLives: 3,
  jumpQuestionCount: 10,
  jumpObstacleSpeed: 0.036,
  jumpObstacleSpeedGain: 0.0045,
  jumpMaxObstacleSpeed: 0.078,
  jumpGravity: 0.0029,
  jumpImpulse: 1.05,
  buildCaseRoundCount: 5,
  relayDefaultQuestionCount: 20,
  relayQuestionOptions: [20],
  relayAnswerTime: 20,
  relayCorrectPoints: 100,
  relayWrongPenalty: 50,
  relayDefaultTeams: 2,
  relayMinTeams: 2,
  relayMaxTeams: 4
};
const LIVE_GAME_TYPES = Object.freeze({
  alpacapardy: {
    gameType: "alpacapardy",
    modeId: "jeopardy",
    label: "Alpacapardy",
    status: "Ready now",
    minPlayers: 2,
    maxPlayers: 4
  },
  run: {
    gameType: "run",
    modeId: "run",
    label: "Alpaca Run",
    status: "2 alpacas",
    minPlayers: 2,
    maxPlayers: 2
  },
  quiz: {
    gameType: "quiz",
    modeId: "quiz",
    label: "Quiz",
    status: "Kahoot style",
    minPlayers: 2,
    maxPlayers: 4,
    questionCount: 10,
    timerSeconds: 20
  },
  race: {
    gameType: "race",
    modeId: "race",
    label: "Survivalpaca",
    status: "Sudden death",
    minPlayers: 2,
    maxPlayers: 2,
    lives: 3
  },
  alpaquiz: {
    gameType: "alpaquiz",
    modeId: "relay",
    label: "Alpaquiz",
    status: "Buzz first",
    minPlayers: 2,
    maxPlayers: 4,
    questionCount: 20,
    timerSeconds: 20,
    answerSeconds: 4
  }
});
const LIVE_GAME_ORDER = ["alpacapardy", "run", "quiz", "race", "alpaquiz"];
const LIVE_SYNC_INTERVAL_MS = 900;
const LIVE_ALPACA_COLORS = Object.freeze([
  { id: "cream", label: "Cream", hex: "#f7ead0", filter: "sepia(0.08) saturate(0.95)" },
  { id: "gold", label: "Gold", hex: "#f2bf4d", filter: "sepia(0.45) saturate(1.55) hue-rotate(348deg)" },
  { id: "rose", label: "Rose", hex: "#f18d9b", filter: "sepia(0.22) saturate(1.9) hue-rotate(300deg)" },
  { id: "mint", label: "Mint", hex: "#7ccfb1", filter: "sepia(0.18) saturate(1.65) hue-rotate(96deg)" },
  { id: "sky", label: "Sky", hex: "#73addf", filter: "sepia(0.12) saturate(1.85) hue-rotate(168deg)" },
  { id: "cocoa", label: "Cocoa", hex: "#9a6a42", filter: "sepia(0.65) saturate(1.35) hue-rotate(352deg) brightness(0.86)" }
]);
const WIZARD_TOTAL_STEPS = 2;
const DEFAULT_LENS_ID = "section";
const JUMP_OBSTACLE_PATTERN = [
  "ground",
  "ground",
  "flying",
  "ground",
  "ground",
  "ground",
  "flying",
  "ground",
  "flying",
  "flying",
  "ground",
  "flying",
  "ground",
  "ground",
  "flying",
  "flying",
  "ground",
  "ground",
  "ground",
  "flying",
  "ground",
  "flying",
  "ground",
  "ground"
];

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

const DEEP_STRUCTURE_BIG_IDEAS = [
  "Visible vs Real",
  "Delayed Arrival",
  "Thresholds & Irreversibility",
  "Infrastructure Shapes Behavior",
  "Managing Uncertainty",
  "Performed Progress",
  "Incompletion That Stays Active",
  "Narrated Endings",
  "Measuring Human Worth",
  "Movement Without Arrival"
];

const sectionIdService = window.WSC_SECTION_IDS || {};
const appAssetService = window.WSC_ASSET_SERVICE || null;
const appStorageService = window.WSC_STORAGE_SERVICE || null;
const appProgressService = window.WSC_PROGRESS_SERVICE || null;
const appVideoService = window.WSC_VIDEO_SERVICE || null;
const gameQuestionService = window.WSC_GAME_QUESTION_SERVICE || null;
const scholarsBowlService = window.WSC_SCHOLARS_BOWL_SERVICE || null;
const supabaseProfileService = window.WSC_SUPABASE_PROFILE_SERVICE || null;
const alpacardsMode = window.WSC_ALPACARDS_MODE || null;
const alpacaChannelMode = window.WSC_ALPACA_CHANNEL_MODE || null;
const rawContentMode = window.WSC_RAW_CONTENT_MODE || null;
const rawContentEntryRenderer = window.WSC_RAW_CONTENT_ENTRY_RENDERER || null;
const rawContentQuizRenderer = window.WSC_RAW_CONTENT_QUIZ_RENDERER || null;
const rawContentMediaLightbox = window.WSC_RAW_CONTENT_MEDIA_LIGHTBOX || null;
const rawContentVisualAssets = window.WSC_RAW_CONTENT_VISUAL_ASSETS || null;
const rawContentTransferTable = window.WSC_RAW_CONTENT_TRANSFER_TABLE || null;
const rawContentMastery = window.WSC_RAW_CONTENT_MASTERY || null;
const regularGuideMode = window.WSC_REGULAR_GUIDE_MODE || null;
const mindMapMode = window.WSC_MINDMAP_MODE || null;
const authModalRenderer = window.WSC_AUTH_MODAL_RENDERER || null;
const wizardRenderer = window.WSC_WIZARD_RENDERER || null;
const alpaquizEngine = window.WSC_ALPAQUIZ_ENGINE || null;
const alpaquizRenderer = window.WSC_ALPAQUIZ_RENDERER || null;
const alpacapardyEngine = window.WSC_ALPACAPARDY_ENGINE || null;
const alpacapardyRenderer = window.WSC_ALPACAPARDY_RENDERER || null;
const alpacapardyLive = window.WSC_ALPACAPARDY_LIVE || null;
const alpacapardyLiveSupabaseService = window.WSC_ALPACAPARDY_LIVE_SUPABASE_SERVICE || null;

function normalizeSectionId(sectionId) {
  return sectionIdService.toRuntimeId
    ? sectionIdService.toRuntimeId(sectionId)
    : String(sectionId || "").trim();
}

const OFFICIAL_SECTION_ORDER_IDS = data.sections.map((section) => section.id);
const OFFICIAL_SECTION_ORDER_BY_ID = Object.fromEntries(
  OFFICIAL_SECTION_ORDER_IDS.map((sectionId, index) => [sectionId, index])
);

// The WSC site sequence is the source of truth. Raw imports may arrive alphabetized.
function getOfficialSectionOrder(sectionOrId) {
  const sectionId = typeof sectionOrId === "string"
    ? normalizeSectionId(sectionOrId)
    : normalizeSectionId(
        sectionOrId?.sectionId ||
        sectionOrId?.id ||
        getSectionIdFromGuidingTitle(sectionOrId?.guidingSection || sectionOrId?.sectionTitle || sectionOrId?.title || "")
      );

  return Number.isInteger(OFFICIAL_SECTION_ORDER_BY_ID[sectionId])
    ? OFFICIAL_SECTION_ORDER_BY_ID[sectionId]
    : Number.MAX_SAFE_INTEGER;
}

function compareOfficialSectionOrder(left, right) {
  const orderDelta = getOfficialSectionOrder(left) - getOfficialSectionOrder(right);
  if (orderDelta !== 0) {
    return orderDelta;
  }

  const leftLabel = left?.sectionTitle || left?.guidingSection || left?.title || "";
  const rightLabel = right?.sectionTitle || right?.guidingSection || right?.title || "";
  return leftLabel.localeCompare(rightLabel);
}

function compareRawEntriesByOfficialOrder(left, right) {
  const sectionDelta = compareOfficialSectionOrder(left, right);
  if (sectionDelta !== 0) {
    return sectionDelta;
  }

  const leftIndex = Number.isFinite(left?.entryIndex) ? left.entryIndex : Number.MAX_SAFE_INTEGER;
  const rightIndex = Number.isFinite(right?.entryIndex) ? right.entryIndex : Number.MAX_SAFE_INTEGER;
  if (leftIndex !== rightIndex) {
    return leftIndex - rightIndex;
  }

  return String(left?.title || "").localeCompare(String(right?.title || ""));
}

function q(level, prompt, correctAnswer, wrongA, wrongB, wrongC) {
  return {
    level,
    prompt,
    correctAnswer,
    wrongAnswers: [wrongA, wrongB, wrongC]
  };
}

function linkSource(label, url) {
  return { label, url };
}

function textSlide(title, note, source = null) {
  const item = { kind: "text-slide", title, note };
  if (typeof source === "string" && source) {
    item.url = source;
    item.previewLabel = "LINK";
  } else if (Array.isArray(source) && source.length) {
    item.links = source;
    item.previewLabel = "LINK";
  }
  return item;
}

function textGroup(title, items) {
  return { title, items };
}

function getRawBankEntry(sectionId, entryIndex) {
  return window.WSC_RAW_CONTENT_BANK?.sections?.[sectionId]?.entries?.[entryIndex] || {};
}

function getRawBankLinks(sectionId, entryIndex) {
  const links = getRawBankEntry(sectionId, entryIndex).links;
  return Array.isArray(links) ? links : [];
}

function getRawBankLinkArray(sectionId, entryIndex, label) {
  const link = getRawBankLinks(sectionId, entryIndex).find((item) => item.label === label);
  return link ? [link] : null;
}

function rawEntryOverrideKey(sectionId, title) {
  return `${sectionId}::${normalizeKnowledgeKey(title)}`;
}

const RAW_ENTRY_OVERRIDES = Object.freeze(Object.fromEntries([
  [
    rawEntryOverrideKey("home-and-wandering", "Navigation at Sea: Measuring the Unknown"),
    {
      title: "Finding the Sea: Tools That Made the Ocean Measurable",
      quizQuestions: [
        q(1, "What did the magnetic compass make easier for sailors?", "Finding direction at sea", "Predicting every storm perfectly", "Repairing damaged ships", "Avoiding all danger forever"),
        q(2, "What was one major benefit of latitude and longitude?", "They helped sailors describe position more precisely on Earth", "They replaced the need for ships", "They made oceans smaller", "They worked only near Europe"),
        q(3, "Why were tools like the astrolabe, sextant, and chronometer so important for long voyages?", "They helped sailors estimate position and navigate more accurately over long distances", "They replaced maps completely", "They made ships move faster than wind", "They were mainly decorative objects for captains"),
        q(4, "How did navigation tools help change the relationship between humans and the ocean?", "They turned open water from something frightening and uncertain into something measurable and trackable", "They made the ocean completely safe", "They removed the need for skilled sailors", "They proved that all voyages were successful"),
        q(5, "Why do navigation tools matter historically beyond sailing itself?", "Because they helped turn unknown space into something humans could control, which also supported exploration, trade, and empire", "Because they mattered only to scientists", "Because they ended all conflict at sea", "Because they were invented only for maps")
      ]
    }
  ],
  [
    rawEntryOverrideKey("home-and-wandering", "How Animals Find Their Way"),
    {
      quizQuestions: [
        q(1, "What is magnetoreception?", "The ability to sense Earth's magnetic field", "The ability to see only at night", "A way of measuring wind speed", "A machine humans put inside animals"),
        q(2, "What does olfactory navigation use?", "Smell", "Only sight", "Heat from the ground", "Human-made maps"),
        q(3, "Why do scientists study both instinct and navigation in animals?", "Because animal movement may be automatic in some ways and still involve complex orientation skills", "Because only humans can really navigate", "Because migration is mostly random", "Because instinct and navigation can never overlap"),
        q(4, "Why might human activity make migration harder for animals?", "It can disrupt the natural signals they use, such as light, sound, smell, landmarks, or magnetic cues", "It teaches animals to stop moving forever", "It makes every route shorter", "It gives animals too many options"),
        q(5, "What is the most important idea behind animal navigation?", "Many animals do far more than simply wander, using complex systems to move through the world and sometimes return with astonishing accuracy", "Animal migration is mostly accidental", "Navigation becomes real only when humans use technology", "Animals follow paths only because people trained them")
      ]
    }
  ],
  [
    rawEntryOverrideKey("home-and-wandering", "Navigating Without Instruments"),
    {
      title: "Wayfinding Without Screens",
      quizQuestions: [
        q(1, "What is one main idea behind traditional wayfinding?", "People can navigate by reading the world around them, not only by using instruments", "Maps are useless in every case", "Only sailors can learn directions", "Traditional navigation is mostly imaginary"),
        q(2, "What did Polynesian navigators use to help find their way?", "Stars, ocean swells, winds, and observations of the natural world", "Satellites and radar", "Highways and road signs", "Only written maps"),
        q(3, "What makes Polynesian wayfinding especially impressive?", "It used careful observation and memory instead of modern instruments", "It worked only in calm weather", "It depended on airplane routes", "It was mainly a ceremonial performance"),
        q(4, "How is traditional navigation different from relying on GPS?", "It depends more on memory, attention, and reading the environment directly", "It removes all uncertainty", "It works only in the past", "It is always faster than digital tools"),
        q(5, "What is the strongest idea behind non-instrument navigation?", "A map does not always need to exist on paper or a screen; it can live in memory, skill, and close attention to the world", "Phones make all older knowledge worthless", "Traditional knowledge matters only as legend", "Without GPS, people cannot really know where they are")
      ]
    }
  ],
  [
    rawEntryOverrideKey("home-and-wandering", "What If the World Stayed Foggy?"),
    {
      title: "Should Some Parts of the World Stay Foggy?",
      quizQuestions: [
        q(1, "What does Fog of World try to recreate?", "The feeling of discovering places gradually instead of seeing everything at once", "A weather forecast system", "A driving test simulator", "A social media map of restaurants"),
        q(2, "What is one possible benefit of not knowing everything before a journey?", "Surprise and discovery may feel more real", "It guarantees safety", "It removes all need for planning", "It makes every trip shorter"),
        q(3, "Why might some people enjoy keeping parts of the world 'foggy'?", "Because uncertainty and discovery can make travel feel more meaningful", "Because getting lost is always safe", "Because maps are bad for the brain", "Because people should never prepare"),
        q(4, "What bigger question does an app like Fog of World raise?", "Whether too much easy access to information can reduce the feeling of exploration", "Whether maps should be banned", "Whether travel is better without destinations", "Whether games are more important than geography"),
        q(5, "What is the strongest idea behind the appeal of keeping some places 'foggy'?", "Sometimes having less immediate knowledge can make exploration feel deeper, more active, and more memorable", "All information should be hidden from travelers", "Technology always ruins experience", "The best journeys are always unplanned")
      ]
    }
  ],
  [
    rawEntryOverrideKey("home-and-wandering", "Airport Limbo"),
    {
      title: "Stuck in Transit",
      quizQuestions: [
        q(1, "Why is the airport in The Terminal such a powerful setting?", "Because it is a place built for movement that becomes a place of suspension", "Because airports are always homes", "Because airports have no laws", "Because the movie is mostly about tourism"),
        q(2, "What made Mehran Karimi Nasser's case so unusual?", "He became stuck in an airport transit zone with no clear way to enter or return home", "He chose to live at the airport for fun", "He was the first person ever to miss a flight", "He owned the airport where he stayed"),
        q(3, "What makes someone in airport limbo especially vulnerable?", "They may be stuck between legal systems, with unclear status and nowhere they are fully allowed to go", "They automatically become citizens of the airport", "They are safe because airports solve political problems", "They can simply choose any country"),
        q(4, "Why can an airport become a liminal space in a political sense?", "Because it can trap someone between departure and arrival, legality and illegality, entry and refusal", "Because airports exist outside geography", "Because planes erase national borders", "Because customs officers are optional"),
        q(5, "What is the strongest overall idea shown by cases like The Terminal, Nasseri, and Snowden?", "A transit space can become a place where identity, belonging, and movement all break down at once", "Airports are the best place to live long-term", "Governments should always follow movie plots", "The main problem with airports is boredom")
      ]
    }
  ],
  [
    rawEntryOverrideKey("home-and-wandering", "Reaching the Border and Being Refused"),
    {
      title: "Reaching the Border Is Not the Same as Being Accepted",
      quizQuestions: [
        q(1, "What does the case of the St. Louis show?", "Reaching a destination does not always mean being allowed to enter", "Ships always find safe harbor", "Refugees were welcomed everywhere in 1939", "Borders are only symbolic"),
        q(2, "Why is the St. Louis remembered as such a tragic case?", "Because many of the refugees who were denied entry later died in the Holocaust", "Because the ship got lost at sea forever", "Because the passengers refused rescue", "Because no country knew the ship existed"),
        q(3, "What makes border policy morally difficult in refugee situations?", "Governments weigh security, law, resources, and human need at the same time", "Borders have no effect on human lives", "Refugee decisions are always simple", "Every country has the same obligations and the same capacity"),
        q(4, "What is one major difference between a map border and a real border?", "A map border is just a line, but a real border involves political choices with human consequences", "A real border exists only at airports", "A map border is always more powerful", "There is no real difference"),
        q(5, "What is the strongest idea behind refugee refusal cases like the St. Louis?", "A border is not just a place of arrival; it is a moral and political test of who is allowed through and why", "Countries should never make migration policy", "Destinations matter more than human lives", "A closed border is always the fairest border")
      ]
    }
  ],
  [
    rawEntryOverrideKey("home-and-wandering", "Poems of the Immigrant Experience"),
    {
      title: "Poems of Migration and In-Between Lives",
      quizQuestions: [
        q(1, "What do these migration poems mainly explore?", "The emotional experience of migration, belonging, and living between places", "How to fill out immigration forms", "The history of ships only", "Tourism marketing"),
        q(2, "What is one reason poetry works well for migration?", "It can express feelings like hope, fear, memory, and loss in a concentrated way", "It avoids all emotion", "It gives exact policy answers", "It makes migration simpler than it is"),
        q(3, "Why does poetry work especially well for the immigrant experience?", "Because it can hold uncertainty, identity, longing, and contradiction all at once", "Because poems are always easier than history", "Because poetry avoids politics completely", "Because migration is mainly a literary invention"),
        q(4, "What does a poem like 'The New Colossus' show about migration?", "That a poem can shape the symbolic meaning of a nation's welcome to newcomers", "That poems matter only in classrooms", "That migration is only an economic issue", "That all immigrants are seen the same way"),
        q(5, "What is the strongest overall idea behind migration poetry?", "The immigrant experience can be tied to one place and still speak to broader human feelings of exile, hope, and becoming", "Migration poems matter only in the United States", "Poetry gives exact border solutions", "All immigrants experience movement in exactly the same way")
      ]
    }
  ],
  [
    rawEntryOverrideKey("home-and-wandering", "Artists of the In-Between"),
    {
      title: "Art, Music, and the Migrant In-Between",
      quizQuestions: [
        q(1, "What do these works mainly share?", "They explore what it feels like to live between homes, places, or identities", "They are all travel advertisements", "They are all about tourism success", "They all avoid the idea of migration"),
        q(2, "Why can music and visual art be powerful for representing migration?", "They can show feelings of distance, displacement, longing, and identity in ways that facts alone cannot", "They are more objective than history", "They remove politics from the topic", "They matter only if they are realistic"),
        q(3, "Why is Jacob Lawrence's Migration series especially relevant to this topic?", "Because it turns movement and displacement into a visual story about collective experience", "Because it is a road map", "Because it explains customs law", "Because it shows tourists on holiday"),
        q(4, "What makes a song like 'Somos Mas Americanos' or 'Immigrant Song' different from a policy debate on migration?", "It expresses identity, emotion, tension, or protest through voice, rhythm, and performance rather than through law or statistics", "It gives more exact legal definitions", "It avoids all meaning beyond entertainment", "It proves migration is only a musical topic"),
        q(5, "What is the strongest overall idea behind artistic works about migration?", "Art can make the migrant's in-between condition visible in ways that facts, borders, and policies alone cannot", "Music and painting are less useful than history", "Migration is mainly a legal issue, not a human one", "The only migrant story worth telling is a successful one")
      ]
    }
  ],
  [
    rawEntryOverrideKey("going-pains", "Adolescence Is Old. Teenagers Are New."),
    {
      quizQuestions: [
        q(1, "What is the main difference between adolescence and the idea of a teenager?", "Adolescence is a developmental stage, while 'teenager' is a more recent social category", "Adolescence exists only in humans, while teenagers exist in many animals", "Teenagers are biological, but adolescence was invented by schools", "There is no real difference between the two"),
        q(2, "What does the prefrontal cortex help with?", "Planning, self-control, and thinking ahead", "Digestion and breathing only", "Remembering every dream perfectly", "Choosing eye color"),
        q(3, "Why is the modern idea of the teenager considered relatively new?", "Because modern schooling, youth culture, spending money, and greater independence made young people more visible as a separate group", "Because no one under 20 existed before the 1900s", "Because hormones were discovered only recently", "Because earlier societies forgot to count ages properly"),
        q(4, "Why is the sentence 'the brain fully develops at 25' too simple?", "Because brain development is gradual and does not suddenly stop at one exact age", "Because the brain is fully finished by 13", "Because only memory changes after childhood", "Because the frontal lobes are not part of the brain"),
        q(5, "What is the strongest idea behind the history of teenagers?", "Humans have always gone through adolescence, but modern societies turned that stage into a distinct social identity called the teenager", "Teenagers are a purely biological invention of the 20th century", "Adolescence only became possible once schools were built", "Teen culture matters only because of pop music")
      ]
    }
  ],
  [
    rawEntryOverrideKey("going-pains", "Growing Up Has Different Names"),
    {
      quizQuestions: [
        q(1, "What idea is built into the word 'adolescent'?", "Growing toward adulthood", "Being exactly the same as an adult", "Refusing all responsibility forever", "Turning into a number"),
        q(2, "Why is the word 'teenager' especially tied to English?", "Because it depends on the English number pattern from thir-teen to nine-teen", "Because only English-speaking countries have young people", "Because Latin created the word 'teenager'", "Because English invented adolescence itself"),
        q(4, "What is one important difference between the words 'adolescent' and 'teenager'?", "'Adolescent' sounds more developmental, while 'teenager' sounds more social and cultural", "One is true and the other is false", "One describes children and the other describes old people", "They always mean exactly the same thing in every language"),
        q(5, "What does comparing these words across languages help show?", "That life stages are shaped not only by biology, but also by language and culture", "That all languages divide the teenage years in exactly the same way", "That translation makes adolescence disappear", "That age categories are purely random")
      ]
    }
  ],
  [
    rawEntryOverrideKey("going-pains", "Rites, Rules, and the Moment You “Become” an Adult"),
    {
      quizQuestions: [
        q(1, "What is the main purpose of a rite of passage?", "To mark an important change in status or stage of life", "To make birthdays last longer", "To replace all school exams", "To prove that adults enjoy formal clothing"),
        q(2, "What is one key difference between a cultural rite and a secular rite?", "A cultural rite usually carries tradition or shared identity, while a secular rite is often tied to modern institutions or everyday life", "Cultural rites are serious, but secular rites are fake", "Secular rites only exist in one country", "Cultural rites always happen before age 10"),
        q(3, "Why can a driver's license or a first paycheck feel like a rite of passage even without a formal ceremony?", "Because they signal new independence, rights, or responsibilities", "Because they are older than religion", "Because they automatically make someone wise", "Because paperwork is the purest form of adulthood"),
        q(4, "Why do many societies create special ceremonies for growing up?", "Because they turn a slow and messy change into a clear public moment people can recognize", "Because adulthood happens instantly everywhere", "Because teenagers cannot understand change without costumes", "Because every culture uses the same ritual system"),
        q(5, "What is the strongest idea behind rites of passage?", "They help communities give a visible shape to a transition that is often gradual and uncertain in real life", "They create adulthood instantly and completely", "They prove that all cultures define adulthood in exactly the same way", "They matter only if expensive gifts are involved")
      ]
    }
  ],
  [
    rawEntryOverrideKey("going-pains", "Growing Up Is Messy"),
    {
      quizQuestions: [
        q(1, "What do many works about adolescence have in common?", "They show growing up as confusing, uneven, and emotionally complicated", "They all celebrate adulthood as easy and complete", "They are all about school grades only", "They all prove that growing up is a bad idea"),
        q(2, "Why can poetry, stories, and songs be especially powerful for showing adolescence?", "Because they can express mixed feelings and identity struggles more vividly than a simple definition can", "Because art is always more factual than science", "Because music removes emotion from a topic", "Because adulthood can only be explained by artists"),
        q(3, "What does a phrase like 'not a girl, not yet a woman' suggest about adolescence?", "It is an in-between state where someone is no longer a child but not fully settled into adulthood", "It is a stage where nothing changes", "It means adulthood starts the moment someone turns 13", "It proves identity is always clear during youth"),
        q(4, "Why do so many artistic works focus on the middle years instead of a clean 'before' and 'after'?", "Because growing up often happens through uncertainty, conflict, and partial change rather than one neat transformation", "Because artists dislike endings", "Because adolescence has no emotional intensity", "Because adulthood is too simple to write about"),
        q(5, "What is the strongest idea behind artistic works about growing up?", "Adulthood often feels less like reaching a destination and more like trying on roles, making mistakes, and slowly changing", "Becoming an adult happens in one exact moment for everyone", "Teenagers grow only when adults force them to", "The best way to grow up is to avoid all confusion")
      ]
    }
  ],
  [
    rawEntryOverrideKey("going-pains", "“Adulting”: Acting Like a Grown-Up"),
    {
      quizQuestions: [
        q(1, "What does the word 'adulting' usually mean?", "Doing everyday grown-up tasks in a way that often feels effortful or awkward", "Becoming old overnight", "Refusing all responsibility", "Turning school into a full-time job"),
        q(2, "Which of these is a typical example of 'adulting'?", "Scheduling a dentist appointment or paying bills", "Playing hide-and-seek", "Forgetting all your homework forever", "Sleeping through every obligation"),
        q(3, "Why do people often use the word 'adulting' jokingly?", "Because it lets them talk about adult responsibilities while showing they still feel a bit unsure or distant from 'real adulthood'", "Because adult life is always easy and funny", "Because only children are allowed to make jokes", "Because rent and paperwork are naturally hilarious"),
        q(4, "What does the popularity of the word 'adulting' suggest about adulthood today?", "Many people experience adulthood less as a fixed identity and more as a set of tasks they are learning to manage", "No one wants responsibility anymore", "Adulthood has disappeared completely", "Only millennials ever felt uncertain"),
        q(5, "What is the strongest idea behind the word 'adulting'?", "Adulthood may feel less like a sudden identity and more like a collection of habits, duties, and repeated performances", "A person becomes an adult only when they say they are", "Adulting means the same thing in every culture and generation", "Being an adult is mostly about buying appliances")
      ]
    }
  ],
  [
    rawEntryOverrideKey("going-pains", "The Last Threshold"),
    {
      quizQuestions: [
        q(1, "What do the works in this part mainly have in common?", "They explore ways of thinking about death as a final threshold or transition", "They all say death should be ignored", "They are all written from the exact same religious point of view", "They all describe airports and ships literally"),
        q(2, "Which poem turns death into a calm carriage ride?", "Emily Dickinson's 'Because I could not stop for Death'", "'Ulysses'", "'In the End'", "'We Real Cool'"),
        q(3, "What does it mean to describe death as a threshold?", "It suggests death can be seen as a crossing or transition, not only as a stopping point", "It means death is not serious", "It proves every writer agrees about the afterlife", "It turns death into a scientific experiment"),
        q(4, "Why do artists return so often to the subject of death?", "Because art helps people imagine, question, and emotionally face what is hardest to explain directly", "Because death is easier to understand than everyday life", "Because all art must be tragic", "Because audiences dislike hopeful themes"),
        q(5, "What is the strongest overall idea behind works about the approach of death?", "Human beings use art to imagine death not only as an ending, but also as a passage, transformation, or final form of meaning", "All great art agrees completely about what death is", "Death matters only when it is dramatic or violent", "The best response to death is always silence")
      ]
    }
  ]
]));

const RAW_SECTION_OVERRIDES = Object.freeze({
  "the-end-is-nearish": {
    title: "The End is Nearish",
    guidingSection: "The End is Nearish",
    sourceFile: "The_End_Is_Nearish_Complete_Working_Draft.docx",
    entries: [
      {
        title: "When Power Is Supposed to Be Temporary",
        guidingSection: "The End is Nearish",
        rawOfficialText: getRawBankEntry("the-end-is-nearish", 0).rawOfficialText || "",
        links: [
          linkSource(
            "Caretaker government - Australian Parliamentary Education Office",
            "https://peo.gov.au/understand-our-parliament/your-questions-on-notice/questions/do-the-prime-minister-and-ministers-keep-their-positions-during-an-election-period"
          )
        ],
        studentExplanation: "A caretaker government runs a country during an election period or another temporary transition, but it is supposed to keep the system stable rather than launch major new changes. This entry helps students understand what these governments usually do, who staffs them, and why they are meant to stay limited, neutral, and temporary.",
        whyItMatters: "At the entry level, this explains a political system designed for the in-between period before a new government takes full control. At the section level, it introduces The End Is Nearish by showing that even before the end of a government, power can already become transitional. At the year-theme level, it connects strongly to thresholds, endings, and transition because caretaker governments exist between one stable administration and the next.",
        takeaway: "A political system may need an officially limited form of power to guide the country safely through an in-between moment.",
        subjects: [
          "Politics & Government / Global Politics",
          "History",
          "Sociology"
        ],
        bigIdeas: [
          "Transition",
          "Thresholds",
          "Endings"
        ],
        examples: [
          "caretaker government",
          "election period",
          "temporary transition",
          "neutral management"
        ],
        debateRelevance: "Useful when debating whether short-term neutral governments can reduce mistrust during elections and fragile transfers of power.",
        counterargument: "Someone could argue that caretaker governments may still become political actors themselves and are not automatically neutral just because they are temporary.",
        visualSections: [
          textGroup("Caretaker government", [
            textSlide(
              "Keeping the state stable during a transition",
              "A caretaker government manages the country during an election period or another temporary transfer of power. Its job is usually to keep the system running smoothly while avoiding major new decisions that should belong to the next fully empowered administration.",
              [
                linkSource(
                  "Parliamentary explainer",
                  "https://peo.gov.au/understand-our-parliament/your-questions-on-notice/questions/do-the-prime-minister-and-ministers-keep-their-positions-during-an-election-period"
                )
              ]
            )
          ])
        ],
        quizQuestions: [
          q(1, "What is the main job of a caretaker government?", "To keep government running during a temporary transition without making major new decisions", "To rewrite the constitution before the election", "To replace parliament permanently", "To cancel elections"),
          q(2, "Why are caretaker governments usually expected to avoid big new policies?", "Because they are meant to preserve stability until a fully empowered government takes office", "Because they are always unelected monarchies", "Because they have no ministers at all", "Because they exist only during war"),
          q(3, "What makes a caretaker government different from an ordinary long-term government?", "It is temporary and is expected to act with restraint during a political transition", "It has unlimited power for a short time", "It rules without laws", "It exists only in presidential systems"),
          q(4, "Why might some countries choose to use caretaker governments more often?", "Because temporary neutral management can reduce mistrust during elections or fragile transfers of power", "Because voters dislike all permanent governments", "Because short governments are always more efficient", "Because elections work best without rules"),
          q(5, "What is the strongest idea behind caretaker governments?", "A political system may need an officially limited form of power to guide the country safely through an in-between moment", "The best government is one that never changes", "Temporary governments should always stay forever", "Transitions matter less than stability")
        ]
      },
      {
        title: "Lame Ducks and Fading Power",
        guidingSection: "The End is Nearish",
        rawOfficialText: getRawBankEntry("the-end-is-nearish", 1).rawOfficialText || "",
        links: [],
        studentExplanation: "A lame duck leader is still officially in charge but is already losing influence because everyone knows the end is coming. This often happens when a term limit is near, when a successor is expected, or when allies start planning for the future without that leader. This entry asks whether term limits weaken leadership too early - or whether the real danger is letting leaders stay forever.",
        whyItMatters: "At the entry level, this helps students understand how power can shrink before it formally ends. At the section level, it expands the idea of political endings from caretaker systems to leaders whose authority fades in public view. At the year-theme level, it connects to endings and transition because it shows that decline often begins before the official finish line.",
        takeaway: "The end of formal power and the end of real influence are often not the same thing.",
        subjects: [
          "Politics & Government / Global Politics",
          "Sociology",
          "Philosophy"
        ],
        bigIdeas: [
          "Endings",
          "Transition",
          "Thresholds"
        ],
        examples: [
          "lame duck",
          "term limits",
          "fading influence",
          "visible succession"
        ],
        debateRelevance: "Useful when debating whether term limits protect democracy enough to justify the weaker authority that often appears near the end of a leader's last term.",
        counterargument: "Someone could argue that a weaker ending phase is still better than allowing leaders to accumulate too much long-term power.",
        visualSections: [
          textGroup("Fading authority", [
            textSlide(
              "Why power can weaken before office officially ends",
              "A lame duck leader is still in office, but public attention has already started moving toward the future. When succession becomes visible, allies, rivals, and institutions may begin adjusting long before the formal ending arrives."
            )
          ])
        ],
        quizQuestions: [
          q(1, "What is a lame duck leader?", "A leader who is still in office but is losing power because the end of their term is near", "A leader who cannot pass any laws at all", "A leader chosen by the military", "A leader who governs only during emergencies"),
          q(2, "Why do lame duck periods often happen near the end of a final term?", "Because attention shifts toward the next possible leader", "Because the constitution stops working", "Because voters are not allowed to care anymore", "Because leaders lose their title immediately"),
          q(3, "What is one argument in favor of term limits even if they create lame ducks?", "They can reduce the risk of one person holding power for too long", "They guarantee perfect successors", "They make politics less competitive", "They remove all corruption"),
          q(4, "What is one argument against removing term limits just to avoid lame ducks?", "A stronger ending phase may not be worth the long-term risk of power becoming too permanent", "Every long-serving leader becomes better automatically", "Democracy works best when one person stays forever", "Succession plans are unnecessary"),
          q(5, "What is the strongest idea behind the lame duck problem?", "The end of formal power and the end of real influence are often not the same thing", "Term limits always destroy democracy", "Leaders should never know when they will leave", "Political systems cannot survive transitions")
        ]
      },
      {
        title: "If No One Knew Who Was Next",
        guidingSection: "The End is Nearish",
        rawOfficialText: getRawBankEntry("the-end-is-nearish", 2).rawOfficialText || "",
        links: [],
        studentExplanation: "Elizabeth I delayed naming a successor because she feared that once people focused on the next ruler, loyalty to the current one would weaken. This entry asks a smart political question: does naming the next leader too early stabilize a system - or start the transfer of power before the old leader is gone? It is really about when a transition begins: at departure, or much earlier in people's minds.",
        whyItMatters: "At the entry level, this explores the political risk of succession becoming visible too soon. At the section level, it continues the section's interest in what happens when endings are expected before they happen. At the year-theme level, it connects to thresholds and transition because succession creates an in-between moment where the future leader may already shape the present.",
        takeaway: "Knowing who comes next can both stabilize a system and quietly weaken the person still in charge.",
        subjects: [
          "History",
          "Politics & Government / Global Politics",
          "Philosophy"
        ],
        bigIdeas: [
          "Transition",
          "Thresholds",
          "Endings"
        ],
        examples: [
          "Elizabeth I",
          "delayed succession",
          "loyalty",
          "visible transition"
        ],
        debateRelevance: "Useful when debating whether clear succession plans strengthen stability or start moving loyalty away from the current leader too early.",
        counterargument: "Someone could argue that keeping succession unclear may preserve authority in the short term but increase instability once the real transition finally arrives.",
        visualSections: [
          textGroup("Succession and attention", [
            textSlide(
              "Why delaying a successor can preserve authority",
              "Elizabeth I's logic was simple: once the next ruler becomes visible, the present ruler may begin to fade in importance. This card helps students think about whether succession begins officially - or psychologically."
            )
          ])
        ],
        quizQuestions: [
          q(1, "Why might a leader delay naming a successor?", "Because public attention might shift away from the current leader too early", "Because succession never matters in politics", "Because people dislike continuity", "Because it makes laws disappear"),
          q(2, "What is one possible advantage of keeping the next leader unknown for longer?", "It may preserve the authority of the current leader while they remain in office", "It guarantees a better successor", "It ends all power struggles", "It removes the need for succession rules"),
          q(3, "What is one possible downside of hiding succession too long?", "It can create uncertainty and competition when the transition finally arrives", "It makes politics too calm", "It ensures the public feels safer", "It prevents all rivalries"),
          q(4, "What political idea sits underneath this problem?", "Power may begin transferring in people's minds before it transfers officially", "A leader's authority never depends on public attention", "Succession matters only in monarchies", "Future leaders should always campaign secretly"),
          q(5, "What is the strongest idea behind delayed succession?", "Knowing who comes next can both stabilize a system and quietly weaken the person still in charge", "The best system is one with no succession at all", "Mystery always improves leadership", "Transitions should never be discussed")
        ]
      },
      {
        title: "The Clock That Measures Doom",
        guidingSection: "The End is Nearish",
        rawOfficialText: getRawBankEntry("the-end-is-nearish", 3).rawOfficialText || "",
        links: [
          linkSource(
            "Why the Doomsday Clock matters - Business Insider",
            "https://www.businessinsider.com/why-the-doomsday-clock-is-3-minutes-to-midnight-2016-1"
          )
        ],
        studentExplanation: "The Doomsday Clock is not a scientific machine that predicts the exact end of the world. It is a symbolic warning device created to show how close humanity may be to catastrophic danger, especially through war, nuclear risk, and other global threats. This entry asks whether a dramatic symbol can still be useful even when it is not literally precise. The section's word 'nearish' also matters: it jokes with the old phrase 'the end is nigh' while admitting that modern danger often feels close, disputed, and hard to time exactly. This is an end-zone: a period when people behave differently because the ending feels close even though it has not fully arrived.",
        whyItMatters: "At the entry level, this helps students distinguish between a symbolic warning and a real predictive instrument. At the section level, it introduces global apocalypse as something people try to imagine, measure, and communicate. At the year-theme level, it connects to prediction, endings, and thresholds because the clock dramatizes the idea of being near a point of no return. The clock is powerful because it turns a vague threshold into a public image, even while reminding students that symbolic nearness is not the same as a forecast.",
        takeaway: "An ending often begins before it happens, when people start acting as if the end is already in the room.",
        subjects: [
          "Politics & Government / Global Politics",
          "History",
          "Philosophy",
          "Media / Film"
        ],
        bigIdeas: [
          "Prediction",
          "Endings",
          "Thresholds"
        ],
        examples: [
          "Doomsday Clock",
          "symbolic warning",
          "catastrophic risk",
          "point of no return",
          "the end is nigh",
          "nearish as uncertain warning"
        ],
        debateRelevance: "Useful in debates about political transitions, climate warnings, apocalypse culture, and who controls the story of an ending.",
        counterargument: "Some endings really are simple and final; the useful distinction is between the final moment and the approach to that moment.",
        visualSections: [
          textGroup("Symbolic warning", [
            textSlide(
              "The Doomsday Clock",
              "The Doomsday Clock is best understood as a dramatic warning symbol, not a literal scientific countdown. Its power comes from making catastrophic risk feel urgent and discussable.",
              [
                linkSource(
                  "Business Insider explainer",
                  "https://www.businessinsider.com/why-the-doomsday-clock-is-3-minutes-to-midnight-2016-1"
                )
              ]
            )
          ]),
          textGroup("Nearish endings", [
            textSlide(
              "The end-zone",
              "The section is interested in the period when an ending is visible but not yet complete: a leader leaving office, a clock near midnight, a school year closing, a disaster predicted but not arrived."
            )
          ])
        ],
        quizQuestions: [
          q(1, "What is the Doomsday Clock mainly meant to do?", "Warn people symbolically about global danger", "Predict the exact date of the end of the world", "Track earthquakes in real time", "Measure only nuclear explosions"),
          q(2, "Why is the Doomsday Clock called symbolic rather than literal?", "Because it represents danger dramatically instead of measuring exact scientific countdowns", "Because it has no connection to real concerns", "Because it changes every hour", "Because it was built as a museum toy"),
          q(3, "Why might a symbol like the Doomsday Clock still be useful?", "Because a powerful image can focus public attention on threats people might otherwise ignore", "Because symbols are more accurate than science", "Because fear always solves political problems", "Because every warning needs a deadline"),
          q(4, "What is one weakness of the Doomsday Clock?", "It can seem more exact than it really is, even though it is only a symbolic judgment", "It never changes over time", "It deals only with weather", "It is understood in exactly the same way by everyone"),
          q(5, "What is the strongest idea behind the Doomsday Clock?", "A dramatic symbol can be helpful if it makes people think seriously about catastrophic risks without pretending to be a literal forecast", "The best warning is always the most precise clock", "Symbolic tools are useless in politics", "Humanity should ignore imagined thresholds")
        ]
      },
      {
        title: "Why People Keep Predicting the End",
        guidingSection: "The End is Nearish",
        rawOfficialText: getRawBankEntry("the-end-is-nearish", 4).rawOfficialText || "",
        links: [
          linkSource("Londoners in 1666 - Wellcome Collection", "https://wellcomecollection.org/stories/devilry-and-doom-in-1666"),
          linkSource("List of predicted apocalyptic dates - Wikipedia", "https://en.wikipedia.org/wiki/List_of_dates_predicted_for_apocalyptic_events"),
          linkSource("10 failed doomsday predictions - Britannica", "https://www.britannica.com/list/10-failed-doomsday-predictions"),
          linkSource("Ten notable apocalypses that didn't happen - Smithsonian", "https://www.smithsonianmag.com/history/ten-notable-apocalypses-that-obviously-didnt-happen-9126331/"),
          linkSource("Street-corner prophecy clip - YouTube", "https://www.youtube.com/watch?v=FcaHsbfkHA8")
        ],
        studentExplanation: "People have predicted the end of the world again and again: through religion, astronomy, technology, calendars, and rumors. Most of these predictions fail, but they often spread quickly because they give people a simple explanation for fear, uncertainty, or rapid change. This entry is about the emotional, social, and media patterns behind doomsday belief - not just the dates themselves. The pattern is not only fear of destruction; it is also the comfort of plot. A dated apocalypse gives history a shape, even when the prediction itself collapses.",
        whyItMatters: "At the entry level, this helps students compare different failed apocalypses and see what they have in common. At the section level, it broadens the section from official warnings to mass belief and viral fear. At the year-theme level, it connects to prediction and endings because humans are strongly drawn to stories that place them near the final threshold.",
        takeaway: "People are drawn not only to the fear of the end, but also to stories that make chaos feel meaningful and understandable.",
        subjects: [
          "History",
          "Sociology",
          "Psychology",
          "Media / Film"
        ],
        bigIdeas: [
          "Prediction",
          "Endings",
          "Bright and Dark Future"
        ],
        examples: [
          "Millerites",
          "Y2K",
          "Mayan Apocalypse",
          "viral fear"
        ],
        debateRelevance: "Useful when debating why apocalyptic stories spread so easily and whether the deepest driver is fear, meaning-making, media amplification, or all three at once.",
        counterargument: "Someone could argue that repeated failed prophecies should not make people dismiss every warning, because some future dangers may still be evidence-based and real.",
        visualSections: [
          textGroup("Historical and religious apocalyptic movements", [
            textSlide(
              "The Millerites and Hon-Ming Chen",
              "This group shows how prophecy, charismatic belief, and social anxiety can turn uncertainty into a dateable ending. The pattern matters as much as the failed prediction itself.",
              [
                linkSource("1666 panic", "https://wellcomecollection.org/stories/devilry-and-doom-in-1666"),
                linkSource("Predicted dates list", "https://en.wikipedia.org/wiki/List_of_dates_predicted_for_apocalyptic_events"),
                linkSource("Britannica overview", "https://www.britannica.com/list/10-failed-doomsday-predictions")
              ]
            )
          ]),
          textGroup("Scientific and technological panic events", [
            textSlide(
              "From Halley's Comet to Y2K and the Mayan Apocalypse",
              "These cases show that modern fear does not need religion to become apocalyptic. Astronomy, computing, and media rumor can all create the same powerful feeling that humanity is nearing a final threshold.",
              [
                linkSource("Smithsonian overview", "https://www.smithsonianmag.com/history/ten-notable-apocalypses-that-obviously-didnt-happen-9126331/"),
                linkSource("Street-corner prophecy clip", "https://www.youtube.com/watch?v=FcaHsbfkHA8")
              ]
            )
          ])
        ],
        quizQuestions: [
          q(1, "What do many failed doomsday predictions have in common?", "They often grow during times of fear, uncertainty, or rapid change", "They are always based on one religion only", "They succeed when repeated often enough", "They depend only on science"),
          q(2, "Why do apocalyptic predictions spread so easily?", "Because dramatic stories about danger are emotionally powerful and easy to share", "Because people always verify them carefully first", "Because the future is easy to know", "Because all frightening claims are true"),
          q(3, "Why can both religious movements and technological scares produce doomsday beliefs?", "Because very different causes can trigger the same human need to explain danger and uncertainty", "Because science and religion are exactly the same", "Because technology always proves prophecy right", "Because fear exists only in modern societies"),
          q(4, "What does the Y2K panic show about modern apocalyptic fear?", "A technological problem can become a culture-wide symbol of collapse", "Computers always cause civilizational endings", "The internet invented doomsday thinking", "Digital fears are less emotional than older ones"),
          q(5, "What is the strongest idea behind recurring doomsday predictions?", "People are drawn not only to the fear of the end, but also to stories that make chaos feel meaningful and understandable", "The end of the world is usually predicted correctly on the second try", "Social media created apocalyptic thinking from nothing", "Every false prophecy makes future prophecies impossible")
        ]
      },
      {
        title: "Renaissance Visions of the End",
        guidingSection: "The End is Nearish",
        rawOfficialText: getRawBankEntry("the-end-is-nearish", 5).rawOfficialText || "",
        links: [
          linkSource("Apocalypse art context - Hyperallergic", "https://hyperallergic.com/apocalypse-art-has-never-been-more-relevant-bibliotheque-nationale-de-france/"),
          linkSource("The Four Horsemen of the Apocalypse - Met Museum", "https://www.metmuseum.org/art/collection/search/336215"),
          linkSource("The Mystical Nativity - National Gallery", "https://www.nationalgallery.org.uk/paintings/sandro-botticelli-mystic-nativity"),
          linkSource("The Last Judgment - Vatican Museums", "https://www.museivaticani.va/content/museivaticani/en/collezioni/musei/cappella-sistina/giudizio-universale.html"),
          linkSource("The Triumph of Death - AF Prado Museum", "https://www.afpradomuseum.org/the-triumph-of-death-brueghel-the-elder")
        ],
        studentExplanation: "For Renaissance artists, the apocalypse was often religious, moral, and full of judgment. These images separate the saved from the damned, but they do not all feel the same: some are full of terror, while others contain order, symbolism, or even a kind of strange calm. This entry asks students to compare how artists make doom visible and how they imagine what lies beyond the final division.",
        whyItMatters: "At the entry level, this helps students read apocalypse not just as destruction, but as visual storytelling about justice, fear, and destiny. At the section level, it adds an art-history dimension to the section's idea of endings. At the year-theme level, it connects to thresholds and endings because apocalyptic art often shows the most extreme threshold of all: final separation.",
        takeaway: "The end of the world is shown not only as catastrophe, but as a final threshold where moral order is revealed.",
        subjects: [
          "Visual and Performing Arts",
          "History",
          "Philosophy",
          "Language and Literature"
        ],
        bigIdeas: [
          "Endings",
          "Thresholds",
          "Liminality"
        ],
        examples: [
          "Book of Revelation",
          "Durer",
          "Botticelli",
          "Michelangelo",
          "Bruegel"
        ],
        debateRelevance: "Useful when debating whether apocalyptic art mainly frightens viewers or whether it also offers moral structure, symbolism, and a larger idea of justice.",
        counterargument: "Someone could argue that these works are rooted in a specific religious tradition and may not represent a universal way of imagining endings.",
        visualSections: [
          textGroup("Renaissance works slideshow", [
            textSlide(
              "Albrecht Durer - The Four Horsemen of the Apocalypse (1498)",
              "Durer turns Revelation into compressed visual force, making the apocalypse feel immediate, crowded, and unstoppable.",
              [
                linkSource("Work link", "https://www.metmuseum.org/art/collection/search/336215")
              ]
            ),
            textSlide(
              "Sandro Botticelli - The Mystical Nativity (1500)",
              "Botticelli mixes fear, hope, and symbolic order, reminding students that apocalypse can also point toward spiritual meaning beyond destruction.",
              [
                linkSource("Work link", "https://www.nationalgallery.org.uk/paintings/sandro-botticelli-mystic-nativity")
              ]
            ),
            textSlide(
              "Michelangelo - The Last Judgment (1536-1541)",
              "Michelangelo imagines the final division of souls as a moment of overwhelming movement, power, and moral reckoning.",
              [
                linkSource("Work link", "https://www.museivaticani.va/content/museivaticani/en/collezioni/musei/cappella-sistina/giudizio-universale.html")
              ]
            ),
            textSlide(
              "Pieter Bruegel the Elder - The Triumph of Death (c. 1562)",
              "Bruegel turns apocalypse into a landscape-scale social collapse where death moves through ordinary human life with chilling inevitability.",
              [
                linkSource("Work link", "https://www.afpradomuseum.org/the-triumph-of-death-brueghel-the-elder")
              ]
            ),
            textSlide(
              "Extra context",
              "This overview gives broader historical context for why apocalypse imagery remained so compelling across European visual culture.",
              [
                linkSource("Hyperallergic article", "https://hyperallergic.com/apocalypse-art-has-never-been-more-relevant-bibliotheque-nationale-de-france/")
              ]
            )
          ])
        ],
        quizQuestions: [
          q(1, "What is one common feature of many Renaissance apocalypse images?", "They divide people sharply between salvation and doom", "They avoid religious ideas completely", "They focus only on peaceful landscapes", "They reject symbolism"),
          q(2, "What makes apocalyptic art from this period more than just a picture of destruction?", "It also imagines judgment, morality, and the fate of souls", "It functions only as decoration", "It ignores human emotion", "It rejects all stories about the future"),
          q(3, "Why might two artists depict the apocalypse with very different tones?", "Because the end can be imagined as terror, warning, order, justice, or even acceptance", "Because Renaissance artists were not allowed to choose style", "Because all religious art had one exact mood", "Because tone matters only in music"),
          q(4, "What does a work like The Last Judgment encourage viewers to think about?", "What kind of moral order lies behind the final separation of the saved and the damned", "Whether painting is more realistic than sculpture", "How to predict next year's politics", "Whether all endings are beautiful"),
          q(5, "What is the strongest idea behind Renaissance apocalypse art?", "The end of the world is shown not only as catastrophe, but as a final threshold where moral order is revealed", "Apocalypse art is only about fear", "Renaissance painters cared more about crowds than meaning", "The end matters only if it is violent")
        ]
      },
      {
        title: "Modern Apocalypses and New Fears",
        guidingSection: "The End is Nearish",
        rawOfficialText: getRawBankEntry("the-end-is-nearish", 6).rawOfficialText || "",
        links: [
          linkSource("The Course of Empire: Destruction - Google Arts & Culture", "https://artsandculture.google.com/asset/the-course-of-empire-destruction-thomas-cole/tQFLZqWBxVAINQ?hl=en"),
          linkSource("The Great Day of His Wrath - Tate", "https://www.tate.org.uk/art/artworks/martin-the-great-day-of-his-wrath-n05613"),
          linkSource("World War I prints - The Guardian", "https://www.theguardian.com/artanddesign/gallery/2014/may/14/art-apocalypse-otto-dix-first-world-war-der-krieg-in-pictures"),
          linkSource("Apocalypse '42 - Smithsonian American Art Museum", "https://americanart.si.edu/artwork/apocalypse-42-21944"),
          linkSource("Four Horsemen of the Apocalypse - Nelson-Atkins", "https://art.nelson-atkins.org/objects/19638/four-horsemen-of-the-apocalypse"),
          linkSource("The Last of Us: Season 1 Concept Art", "https://www.menyhei.com/projects/WB6O42?album_id=14910"),
          linkSource("Where Are We Going? - YouTube", "https://www.youtube.com/watch?v=SR6_J1IVvlg")
        ],
        studentExplanation: "More recent apocalyptic art often shifts away from pure religious judgment and toward industrial collapse, war, disease, technology, ruined cities, and human-made disaster. These works ask what modern people fear most: mechanized destruction, total war, social breakdown, environmental collapse, digital dread, or the feeling that civilization may destroy itself. Keep the work links directly in the display area so students can move between painting, print, concept art, and music-video style storytelling without invented visuals.",
        whyItMatters: "At the entry level, this helps students compare how apocalyptic imagery evolves as history changes. At the section level, it extends the guiding section from classical and religious endings to modern fears shaped by industry, war, media, and digital anxiety. At the year-theme level, it connects to endings, prediction, and the future by showing that every era imagines doom in the image of its own deepest worries.",
        takeaway: "The end of the world increasingly appears as something tied to human systems, choices, and fears rather than only divine fate.",
        subjects: [
          "Visual and Performing Arts",
          "History",
          "Politics & Government / Global Politics",
          "Media / Film"
        ],
        bigIdeas: [
          "Endings",
          "Bright and Dark Future",
          "Prediction"
        ],
        examples: [
          "Thomas Cole",
          "John Martin",
          "Otto Dix",
          "The Last of Us",
          "industrial anxiety"
        ],
        debateRelevance: "Useful when debating whether modern apocalyptic art mostly reflects public fear - or actively shapes how societies imagine collapse and the future.",
        counterargument: "Someone could argue that even modern apocalypse art still reuses older fears of judgment, destruction, and chaos rather than inventing an entirely new language of endings.",
        visualSections: [
          textGroup("Modern apocalypse works slideshow", [
            textSlide(
              "Thomas Cole - The Course of Empire: Destruction (1836)",
              "Cole turns imperial grandeur into self-destruction, suggesting that civilizations can build the very forces that undo them.",
              [
                linkSource("Work link", "https://artsandculture.google.com/asset/the-course-of-empire-destruction-thomas-cole/tQFLZqWBxVAINQ?hl=en")
              ]
            ),
            textSlide(
              "John Martin - The Great Day of His Wrath (1851-1853)",
              "Martin keeps the cosmic scale of apocalypse but makes catastrophe feel overwhelming, theatrical, and physically unavoidable.",
              [
                linkSource("Work link", "https://www.tate.org.uk/art/artworks/martin-the-great-day-of-his-wrath-n05613")
              ]
            ),
            textSlide(
              "Otto Dix - World War I prints (1924)",
              "Dix makes modern war itself look apocalyptic, where industrial violence turns real history into a vision of ruin.",
              [
                linkSource("Work link", "https://www.theguardian.com/artanddesign/gallery/2014/may/14/art-apocalypse-otto-dix-first-world-war-der-krieg-in-pictures")
              ]
            ),
            textSlide(
              "Viktor Schreckengost - Apocalypse '42 (1942)",
              "This wartime work translates twentieth-century conflict into a direct visual language of anxiety, destruction, and mass fear.",
              [
                linkSource("Work link", "https://americanart.si.edu/artwork/apocalypse-42-21944")
              ]
            ),
            textSlide(
              "Harry Louis Freund - Four Horsemen of the Apocalypse (1946)",
              "Freund reimagines a classical apocalyptic motif after global war, showing how older symbols survive inside modern dread.",
              [
                linkSource("Work link", "https://art.nelson-atkins.org/objects/19638/four-horsemen-of-the-apocalypse")
              ]
            ),
            textSlide(
              "Saby Menyhei - The Last of Us: Season 1 Concept Art (2025)",
              "The work turns post-collapse atmosphere into contemporary visual media, where fear is shaped by survival, emptiness, and damaged systems.",
              [
                linkSource("Work link", "https://www.menyhei.com/projects/WB6O42?album_id=14910")
              ]
            ),
            textSlide(
              "Kevin Sherwood & James McCawley - Where Are We Going? (2013)",
              "This piece extends apocalyptic mood into game-linked sound and atmosphere, showing that doom can also be built through media form and tone.",
              [
                linkSource("Work link", "https://www.youtube.com/watch?v=SR6_J1IVvlg")
              ]
            )
          ])
        ],
        quizQuestions: [
          q(1, "What is one major difference between many modern apocalyptic works and older religious ones?", "Modern works often focus more on war, industry, technology, or human-made collapse", "Modern works avoid fear completely", "Older works were never symbolic", "Modern works are always hopeful"),
          q(2, "Why does industrial or digital anxiety fit modern apocalypse so well?", "Because people increasingly fear systems they built but may no longer fully control", "Because technology removed all uncertainty", "Because only ancient societies imagined endings", "Because modern art cannot show nature"),
          q(3, "What can war imagery add to apocalyptic art?", "It makes the end feel historically real and human-caused instead of distant and mythical", "It turns apocalypse into comedy", "It removes all moral meaning", "It guarantees political agreement"),
          q(4, "Why might a work like The Last of Us concept art still count as apocalyptic imagery?", "Because it imagines social breakdown, fear, and survival in a damaged world", "Because anything recent is automatically apocalyptic", "Because concept art is more factual than painting", "Because apocalypse requires zombies"),
          q(5, "What is the strongest idea behind modern apocalypse art?", "The end of the world increasingly appears as something tied to human systems, choices, and fears rather than only divine fate", "Modern society no longer believes in endings", "Technology makes apocalyptic thinking obsolete", "All modern apocalypse art is just entertainment")
        ]
      },
      {
        title: "A Soundtrack for the End",
        guidingSection: "The End is Nearish",
        rawOfficialText: getRawBankEntry("the-end-is-nearish", 7).rawOfficialText || "",
        links: [
          linkSource("Abyss of the Birds - YouTube", "https://www.youtube.com/watch?v=-tPqTqpLG5M"),
          linkSource("Electric Funeral - YouTube", "https://www.youtube.com/watch?v=4aJT2p2_pDk"),
          linkSource("It's the End of the World as We Know It - YouTube", "https://www.youtube.com/watch?v=Z0GFRcFm-aY")
        ],
        studentExplanation: "Apocalypse is not only something artists paint; it is also something composers and musicians can make us hear. These works turn endings into sound in very different ways: Messiaen uses stillness, space, and spiritual intensity; Black Sabbath turns doom into heavy, crushing power; and R.E.M. makes catastrophe feel frantic, crowded, and strangely catchy. This entry helps students notice that mood, instrumentation, tempo, repetition, and silence can all shape what an ending feels like.",
        whyItMatters: "At the entry level, this helps students understand how music creates apocalyptic atmosphere. At the section level, it broadens the guiding section beyond visual art and prophecy into sound and emotional tone. At the year-theme level, it connects to endings and the future by showing that fear of collapse can be expressed not just through images and stories, but through rhythm, texture, and musical form.",
        takeaway: "The end of the world can be heard through very different musical strategies, each shaping a different emotional version of catastrophe.",
        subjects: [
          "Visual and Performing Arts",
          "History",
          "Language and Literature"
        ],
        bigIdeas: [
          "Endings",
          "Bright and Dark Future",
          "Liminality"
        ],
        examples: [
          "Messiaen",
          "Black Sabbath",
          "R.E.M.",
          "tempo",
          "silence"
        ],
        debateRelevance: "Useful when debating whether music communicates crisis more effectively through mood and texture than essays or images can do alone.",
        counterargument: "Someone could argue that apocalyptic music is too subjective without historical context, because listeners may hear very different meanings in the same sounds.",
        visualSections: [
          textGroup("Music display", [
            textSlide(
              "Olivier Messiaen - Abyss of the Birds (1940)",
              "Messiaen uses stillness, suspended time, and spiritual intensity to make catastrophe feel quiet, vast, and almost outside ordinary history.",
              [
                linkSource("Track link", "https://www.youtube.com/watch?v=-tPqTqpLG5M")
              ]
            ),
            textSlide(
              "Black Sabbath - Electric Funeral (1970)",
              "Heavy riffs, slow drive, and dark tone make apocalypse sound industrial, crushing, and physically oppressive.",
              [
                linkSource("Track link", "https://www.youtube.com/watch?v=4aJT2p2_pDk")
              ]
            ),
            textSlide(
              "R.E.M. - It's the End of the World as We Know It (1987)",
              "Speed, overload, and catchiness turn collapse into breathless cultural anxiety rather than solemn doom.",
              [
                linkSource("Track link", "https://www.youtube.com/watch?v=Z0GFRcFm-aY")
              ]
            )
          ])
        ],
        quizQuestions: [
          q(1, "What can music add to apocalyptic storytelling?", "A strong emotional atmosphere created through sound, rhythm, silence, and texture", "A precise scientific forecast", "A visual map of destruction", "A guarantee that the message will be optimistic"),
          q(2, "Why might very different kinds of music all fit an apocalyptic theme?", "Because endings can feel spiritual, terrifying, chaotic, heavy, or strangely calm", "Because all apocalypse music sounds the same", "Because only sad music can discuss disaster", "Because lyrics matter but sound never does"),
          q(3, "What makes a piece like Abyss of the Birds especially unsettling?", "Its slowness, space, and suspended feeling can make time itself feel fragile", "It uses only loud percussion", "It sounds like dance music", "It avoids mood completely"),
          q(4, "Why can a song like It's the End of the World as We Know It sound energetic and anxious at the same time?", "Because speed and overload can make collapse feel breathless rather than solemn", "Because fast songs cannot express fear", "Because catchy music removes serious meaning", "Because apocalypse works only in classical music"),
          q(5, "What is the strongest idea behind apocalyptic music?", "The end of the world can be heard through very different musical strategies, each shaping a different emotional version of catastrophe", "Only lyrics determine apocalyptic meaning", "Music is less powerful than visual art for endings", "Apocalyptic music must always be slow and dark")
        ]
      },
      {
        title: "The Point of No Return",
        guidingSection: "The End is Nearish",
        rawOfficialText: getRawBankEntry("the-end-is-nearish", 8).rawOfficialText || "",
        links: [
          linkSource("Predicting ecosystem collapse - Cary Institute", "https://www.caryinstitute.org/news-insights/feature/predicting-environmental-collapse"),
          linkSource("Climate volatility research - Nature", "https://www.nature.com/articles/s41558-025-02486-9"),
          linkSource("Turbulence and climate connection - BBC", "https://www.bbc.com/news/articles/ckgy7jx082ro"),
          linkSource("Point of no return debate - The Ecologist", "https://theecologist.org/2025/oct/13/point-no-return-climate")
        ],
        studentExplanation: "Researchers studying ecosystems have found that collapse is often preceded by instability: instead of staying steady, systems start swinging more wildly. Climate change may be producing similar warning signs, from more extreme weather to rougher flights and deeper environmental stress. This entry asks what people should do when a danger no longer feels far away. The hardest question is not only whether a point of no return exists, but how humans should respond if they think they are approaching it.",
        whyItMatters: "At the entry level, this helps students connect environmental science to the idea of collapse. At the section level, it turns apocalyptic thinking away from fantasy and toward measurable real-world danger. At the year-theme level, it connects to endings, prediction, and the future by asking what responsibility looks like when a system may already be close to irreversible change.",
        takeaway: "Even when full prevention seems uncertain, warning signs of instability matter because they shape how urgently people should act.",
        subjects: [
          "Sciences",
          "Politics & Government / Global Politics",
          "Economics & Trade",
          "Philosophy"
        ],
        bigIdeas: [
          "Endings",
          "Prediction",
          "Bright and Dark Future"
        ],
        examples: [
          "ecosystem collapse",
          "volatility",
          "climate threshold",
          "point of no return"
        ],
        debateRelevance: "Useful when debating whether societies should keep acting aggressively even when some damage may already be irreversible.",
        counterargument: "Someone could argue that calling a situation a point of no return too early can become an excuse for surrender when meaningful reduction of harm is still possible.",
        visualSections: [
          textGroup("Evidence display", [
            textSlide(
              "Predicting ecosystem collapse",
              "Researchers study volatility and instability because systems often become more erratic before they break down.",
              [
                linkSource("Source", "https://www.caryinstitute.org/news-insights/feature/predicting-environmental-collapse")
              ]
            ),
            textSlide(
              "Climate volatility research",
              "Climate change can look chaotic before it looks final, with stronger swings and more unstable patterns across systems.",
              [
                linkSource("Source", "https://www.nature.com/articles/s41558-025-02486-9")
              ]
            ),
            textSlide(
              "Turbulence and climate connection",
              "Even everyday experiences like flying can become reminders that environmental instability is already affecting human systems.",
              [
                linkSource("Source", "https://www.bbc.com/news/articles/ckgy7jx082ro")
              ]
            ),
            textSlide(
              "Point of no return debate",
              "The moral question is not only whether a threshold exists, but what people owe one another if they believe they are nearing it.",
              [
                linkSource("Source", "https://theecologist.org/2025/oct/13/point-no-return-climate")
              ]
            )
          ])
        ],
        quizQuestions: [
          q(1, "What is one warning sign that an ecosystem may be close to collapse?", "Its behavior can become more volatile and unstable", "It always becomes perfectly calm first", "It stops changing completely", "It becomes easier to control"),
          q(2, "Why does the phrase point of no return sound so powerful in climate discussions?", "Because it suggests there may be a threshold after which damage becomes much harder or impossible to undo", "Because it proves the future is already fixed", "Because science has ended", "Because it applies only to lakes"),
          q(3, "Why might climate change be described as chaotic before catastrophic?", "Because systems often become more unstable and extreme before they fully break down", "Because catastrophe always arrives without warning", "Because chaos and climate are unrelated", "Because only politics creates instability"),
          q(4, "What ethical question appears if people believe the climate fight may already be partly lost?", "Whether reducing damage still matters even if total prevention may no longer be possible", "Whether science should stop measuring change", "Whether weather should be left alone", "Whether only rich countries should respond"),
          q(5, "What is the strongest idea behind this climate-collapse entry?", "Even when full prevention seems uncertain, warning signs of instability matter because they shape how urgently people should act", "A point of no return means action becomes meaningless", "Environmental collapse is only symbolic", "Climate anxiety matters more than evidence")
        ]
      },
      {
        title: "Profiting from Disaster",
        guidingSection: "The End is Nearish",
        rawOfficialText: getRawBankEntry("the-end-is-nearish", 9).rawOfficialText || "",
        links: [
          linkSource(
            "Betting on climate failure - Politico",
            "https://www.politico.com/news/2025/12/26/betting-on-climate-failure-investors-could-earn-billions-00677281"
          )
        ],
        studentExplanation: "Some people do not only fear climate breakdown - they look for ways to profit from it. That raises a difficult question: when does preparing for crisis become benefiting from crisis? This entry is not just about investment. It is about ethics, incentives, and what happens when money begins to reward the expectation of harm. A company or government does not need to say 'we want disaster' to create a system that quietly benefits when disaster grows worse.",
        whyItMatters: "At the entry level, this helps students think about the moral problem of profit during crisis. At the section level, it gives the guiding section a sharp contemporary ending by showing how apocalypse can become an economic opportunity. At the year-theme level, it connects to endings and the future by asking whether some systems may become invested in decline instead of prevention.",
        takeaway: "If disaster becomes profitable, society risks creating incentives that normalize or even deepen the very dangers it should resist.",
        subjects: [
          "Economics & Trade",
          "Politics & Government / Global Politics",
          "Philosophy",
          "Sociology"
        ],
        bigIdeas: [
          "Endings",
          "Bright and Dark Future",
          "Prediction"
        ],
        examples: [
          "climate profit",
          "investment",
          "incentives",
          "disaster capitalism"
        ],
        debateRelevance: "Useful when debating where the line sits between responsible preparation for crisis and a system that starts rewarding the expectation of harm.",
        counterargument: "Someone could argue that some investment during crisis can still be ethical if it reduces damage, improves resilience, or funds adaptation rather than exploiting suffering.",
        visualSections: [
          textGroup("Ethics and investment", [
            textSlide(
              "When crisis becomes profitable",
              "This entry asks whether preparing for disaster can slide into quietly benefiting from disaster. The ethical pressure comes from incentives: once harm becomes profitable, prevention may no longer be everyone's goal.",
              [
                linkSource(
                  "Politico article",
                  "https://www.politico.com/news/2025/12/26/betting-on-climate-failure-investors-could-earn-billions-00677281"
                )
              ]
            )
          ])
        ],
        quizQuestions: [
          q(1, "What is the core ethical problem in profiting from climate failure?", "Someone may gain financially from worsening conditions that harm others", "Profit is always unethical", "Climate change has no economic side", "All investors cause disasters directly"),
          q(2, "Why is there a difference between preparing for disaster and profiting from it?", "Preparation can reduce harm, while profit-seeking may create incentives to accept or exploit harm", "There is no difference at all", "Preparation matters only for governments", "Profit automatically solves crisis"),
          q(3, "What makes climate-profit opportunities politically troubling?", "They may reward people for adapting to collapse instead of preventing it", "They always lower temperatures", "They remove all inequality", "They make long-term planning unnecessary"),
          q(4, "Why might a government or company be tempted to benefit from crisis rather than stop it?", "Because systems can be shaped by incentives that reward short-term gain over long-term safety", "Because disasters are easier to predict than profits", "Because ethics plays no role in policy", "Because prevention is always impossible"),
          q(5, "What is the strongest idea behind this final entry?", "If disaster becomes profitable, society risks creating incentives that normalize or even deepen the very dangers it should resist", "All economic activity during crisis is exploitation", "Markets cannot respond ethically to danger", "Climate change matters only when investors notice it")
        ]
      }
    ]
  },

});

const rawContentSections = normalizeRawContentSections(window.WSC_RAW_CONTENT_BANK?.sections || {});
const fullVoyageQuestions = normalizeFullVoyageQuestions(window.WSC_RAW_CONTENT_BANK?.fullVoyageQuestions || []);

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

const ALPACA_RUN_ROUTE = [
  { id: "pristina", label: "Pristina, Kosovo", phase: "Regional Round", x: 52, y: 40 },
  { id: "budapest", label: "Budapest, Hungary", phase: "Regional Round", x: 50, y: 37 },
  { id: "baku", label: "Baku, Azerbaijan", phase: "Regional Round", x: 59, y: 41 },
  { id: "Rio", label: "Rio de Janeiro, Brazil", phase: "Regional Round", x: 35, y: 67 },
  { id: "nouakchott", label: "Nouakchott, Mauritania", phase: "Regional Round", x: 41, y: 50 },
  { id: "cape-town", label: "Cape Town, South Africa", phase: "Regional Round", x: 52, y: 75 },
  { id: "mumbai", label: "Mumbai, India", phase: "Regional Round", x: 69, y: 52 },
  { id: "ulaanbaatar", label: "UlaanBaatar, Mongolia", phase: "Regional Round", x: 69, y: 35 },
  { id: "sydney", label: "Sydney, Australia", phase: "Regional Round", x: 90, y: 75 },
  { id: "Oslo", label: "Oslo, Norway", phase: "Regional Round", x: 48, y: 31 },
  { id: "hsinchu", label: "Hsinchu, Taiwan", phase: "Regional Round", x: 81, y: 50 },
  { id: "Seattle", label: "Seattle, Washington", phase: "Regional Round", x: 12, y: 38 },
  { id: "tokyo", label: "Tokyo, Japan", phase: "Regional Round", x: 85, y: 44 },
  { id: "london", label: "London, United Kingdom", phase: "Regional Round", x: 45, y: 34 },
  { id: "krakow", label: "Krakow, Poland", phase: "Regional Round", x: 49, y: 37 },
  { id: "dubai", label: "Dubai, United Arab Emirates", phase: "Global Round", x: 61, y: 48 },
  { id: "kuala-lumpur", label: "Kuala Lumpur, Malaysia", phase: "Global Round", x: 74, y: 60 },
  { id: "seoul", label: "Seoul, South Korea", phase: "Global Round", x: 82, y: 47 },
  { id: "nairobi", label: "Nairobi, Kenya", phase: "Global Round", x: 55, y: 55 },
  { id: "paris", label: "Paris, France", phase: "Global Round", x: 45, y: 38 },
  { id: "yale", label: "Yale University", phase: "Final Destination", x: 24, y: 36, final: true }
];

const RELAY_KEY_LAYOUTS = {
  2: [
    { key: "s", label: "S" },
    { key: "l", label: "L" }
  ],
  3: [
    { key: "s", label: "S" },
    { key: "f", label: "F" },
    { key: "l", label: "L" }
  ],
  4: [
    { key: "s", label: "S" },
    { key: "h", label: "H" },
    { key: "l", label: "L" },
    { key: "f", label: "F" }
  ]
};

const ALPACA_REVIEW_MODE = false;
const ALPACA_PENDING_REVIEW = new Set();

const ALPACA_REVIEW_BADGES = {
  paths: {
    learn: "1",
    play: "2"
  },
  lenses: {
    subject: "3",
    section: "4"
  },
  modes: {
    slideshow: "5",
    mindmap: "6",
    rawcontent: "7",
    channel: "7A",
    jeopardy: "8",
    run: "9",
    relay: "10",
    race: "11",
    jump: "12"
  },
  targets: {
    all: "12",
    subject: {
      history: "13",
      "geography-human-geography": "14",
      psychology: "15",
      sociology: "16",
      "politics-government-global-politics": "17",
      "economics-trade": "18",
      "language-literature": "19",
      "visual-arts": "20",
      "media-film": "23",
      philosophy: "24",
      "computer-science-technology": "28",
      "design-architecture-urbanism": "29"
    },
    section: {
      "introductory-questions": "33",
      "progress-not-regress": "34",
      "more-to-do": "35",
      "the-end-is-nearish": "36",
      "theres-a-draft": "37",
      "were-all-in-this": "38",
      "where-the-sidewalk-starts": "39",
      "monkey-see": "40",
      "the-lovely-and-the-liminal": "41",
      "going-pains": "42",
      "home-and-wandering": "43",
      "roads-and-futures": "44",
      "call-of-duty-free": "45",
      "next-year-in-futurism": "46",
      "concluding-questions": "47"
    }
  },
  gameplay: {
    question: {
      jeopardy: "48",
      relay: "49",
      race: "50",
      jump: "51"
    }
  }
};

const BIG_IDEA_ROUTE_PRESETS = {
  "visible-vs-real": {
    description: "Routes where visible movement, labels, symbols, or appearances stand in for the real state of things.",
    mood: "determined"
  },
  "delayed-arrival": {
    description: "Routes where arrival is postponed, stretched, slowed down, or kept just out of reach.",
    mood: "neutral"
  },
  "thresholds-and-irreversibility": {
    description: "Routes about crossing points where choices become harder to undo and consequences become more serious.",
    mood: "thinking"
  },
  "infrastructure-shapes-behavior": {
    description: "Routes where systems, interfaces, roads, lists, buildings, or rules quietly guide what people do.",
    mood: "wise"
  },
  "managing-uncertainty": {
    description: "Routes where people give uncertainty a shape so waiting, risk, or confusion becomes easier to tolerate.",
    mood: "thinking"
  },
  "performed-progress": {
    description: "Routes where progress is staged, signaled, or socially displayed before completion is fully real.",
    mood: "determined"
  },
  "incompletion-that-stays-active": {
    description: "Routes where unfinished states continue shaping attention, memory, identity, or future choices.",
    mood: "neutral"
  },
  "narrated-endings": {
    description: "Routes where endings are declared, staged, ritualized, visualized, or turned into a story.",
    mood: "wise"
  },
  "measuring-human-worth": {
    description: "Routes where numbers, lists, rankings, scores, or categories begin to define what counts as value.",
    mood: "determined"
  },
  "movement-without-arrival": {
    description: "Routes where motion continues without clean closure, final arrival, or a single settled destination.",
    mood: "happy"
  }
};

const PATH_OPTIONS = [
  {
    id: "learn",
    label: "Learn",
    title: "Learn",
    description: "Follow this path if you're not there yet with this year's theme.",
    mood: "wise"
  },
  {
    id: "play",
    label: "Play",
    title: "Play",
    description: "Take this route to see how far you can go with this year's theme.",
    mood: "determined"
  },
  {
    id: "train",
    label: "Train",
    title: "Train",
    description: "Practice the four World Scholar's Cup tournament events.",
    mood: "excited"
  }
];

const LENS_OPTIONS = [
  {
    id: "subject",
    title: "Subject",
    description: "Follow this direction if you want to travel through the theme by academic area."
  },
  {
    id: "section",
    title: "Guiding Section",
    description: "Follow this direction if you want to travel through the theme by guiding section."
  },
  {
    id: "bigidea",
    title: "Big Ideas",
    description: "Follow this direction if you want to travel through the theme through its major big ideas."
  }
];

const MODE_OPTIONS = {
  learn: [
    {
      id: "slideshow",
      title: "Slideshow Lesson",
      description: "Choose this track if you want to move through the theme one stop at a time.",
      meta: "",
      mood: "wise"
    },
    {
      id: "mindmap",
      title: "Mind Map",
      description: "Choose this track if you want one clickable bubble map centered on your selected route.",
      meta: "",
      mood: "wise"
    },
    {
      id: "rawcontent",
      title: "Raw Content",
      description: "Choose this track if you want direct access to this year's theme content.",
      meta: "",
      mood: "neutral"
    },
    {
      id: "regularguide",
      title: "Guide",
      description: "Read the section study guide built from the updated source-of-truth document.",
      meta: "",
      mood: "wise"
    },
    {
      id: "channel",
      title: "Alpaca Channel",
      description: "Choose this track if you want the route as a focused video playlist.",
      meta: "",
      mood: "excited"
    },
    {
      id: "alpacard",
      title: "Alpacard",
      description: "Recognition flashcards for artwork, architecture, places, films, and games.",
      meta: "Thank you Scholae2",
      mood: "wise"
    }
  ],
  play: [
    {
      id: "jeopardy",
      title: "Alpacapardy",
      description: "Choose this way to play a Jeopardy-style game with the categories you choose.",
      meta: "",
      mood: "wise"
    },
    {
      id: "run",
      title: "Alpaca Run",
      description: "Choose this way if you can make it through the Regional and Global Rounds and reach the Tournament of Champions.",
      meta: "",
      mood: "determined"
    },
    {
      id: "jump",
      title: "Alpaca Jump",
      description: "Choose this way if you can leap, duck, and answer your way across the desert.",
      meta: "",
      mood: "excited"
    },
    {
      id: "relay",
      title: "Alpaquiz",
      description: "Choose this way if you can buzz first and leave everyone else in the backrooms.",
      meta: "",
      mood: "excited"
    },
    {
      id: "race",
      title: "Survivalpaca",
      description: "Choose this way if you can outrun the clock and make it to the threshold.",
      meta: "",
      mood: "determined"
    }
  ],
  train: [
    {
      id: "writing",
      title: "Collaborative Writing",
      description: "Plan, draft, and review a response with the same clarity, content, style, and originality judges expect.",
      meta: "",
      mood: "wise"
    },
    {
      id: "buildcase",
      title: "Debate Lab",
      description: "Draw a random WSC motion, spin for PRO or CON, then prep from full arguments, rebuttals, and judge notes.",
      meta: "",
      mood: "wise"
    },
    {
      id: "bowl",
      title: "Scholar's Bowl",
      description: "Produce and practice stimulus-first Bowl questions that connect media to several syllabus targets.",
      meta: "",
      mood: "excited"
    },
    {
      id: "quiz",
      title: "Scholar's Challenge",
      description: "Answer a fixed 15-question route with Challenge-style pacing and elimination habits.",
      meta: "",
      mood: "thinking"
    }
  ]
};

const TRAIN_TIPS = {
  writing: {
    title: "Collaborative Writing",
    label: "Writing tip",
    intro: "Use the team prep to choose a strong angle, then write one clear, memorable piece that keeps the prompt at the center.",
    judged: ["Clarity", "Content", "Style", "Originality"],
    tips: [
      "Outline the thesis, structure, curriculum links, and ending before you draft.",
      "Make the prompt easy to recognize in every paragraph or scene.",
      "Use the final peer-review window for big fixes: clarity, logic, voice, and the final landing."
    ]
  },
  buildcase: {
    title: "Debate Lab",
    label: "Debate tip",
    intro: "A strong debate starts with a clean motion, a clear side, useful evidence, live rebuttal, and respectful feedback.",
    judged: ["Presentation", "Strategy", "Content", "Teamwork", "Feedback"],
    tips: [
      "Prep the case first: definitions, side burden, two or three main clashes, then evidence hooks.",
      "Speaker 1 frames, Speaker 2 develops and rebuts, Speaker 3 weighs impact and closes the route.",
      "Use the rebuttal and rebuild rows to answer the other team directly instead of repeating your own case."
    ]
  },
  bowl: {
    title: "Scholar's Bowl",
    label: "Bowl tip",
    intro: "Strong Bowl questions begin with media that actually changes the reasoning task: stimulus, connection, syllabus target, question, answer.",
    judged: ["Media clue", "Connection", "Breadth", "Trap control"],
    tips: [
      "Start from a clip, image, lyric, graph, object, or sound that creates a bridge to the syllabus.",
      "Let one stimulus point to several entries, sections, or a bigger WSC idea when that creates the better question.",
      "Reject questions where the media could be removed without changing the answer."
    ]
  },
  quiz: {
    title: "Scholar's Challenge",
    label: "Challenge tip",
    intro: "Challenge is a solo 120-question test with five answer choices and partial credit when more than one bubble is filled.",
    judged: ["Knowledge", "Connections", "Pacing", "Elimination"],
    tips: [
      "Study from your own notes, flashcards, mocks, and cross-subject links, not summaries alone.",
      "Use one bubble when confident, two or three when narrowed, and all five only when you truly have no clue.",
      "Watch the clock: regional pacing is about 30 seconds per question, globals and ToC about 37 seconds."
    ]
  }
};

const WRITING_PRACTICE_FORMATS = ["Essay", "Story", "Letter", "Reflection"];
const WRITING_PHASES = [
  { id: "prep", title: "Team prep", time: "20 min", body: "Pick the prompt, angle, structure, and curriculum evidence." },
  { id: "draft", title: "Solo draft", time: "40-45 min", body: "Write clearly, keep the prompt visible, and land the ending." },
  { id: "review", title: "Peer review", time: "15 min", body: "Trade feedback on clarity, content, style, and originality." }
];
const BOWL_ROUND_TYPES = [
  { title: "Connection", time: "stimulus first", body: "Explain what the media reveals, not just what it shows." },
  { title: "Target cluster", time: "multi-entry", body: "Let one stimulus point to several official syllabus targets." },
  { title: "Media purpose", time: "quality gate", body: "Check that the question would weaken if the media disappeared." },
  { title: "Tempting trap", time: "avoid ID-only", body: "Name the attractive but wrong interpretation before locking in." }
];

const LEARN_SUBJECT_ROUTES = [
  {
    id: "history",
    label: "History",
    description: "Political transitions, historical endings, legacy systems, roads over time, and the long memory of movement.",
    keywords: ["history", "historical", "rubicon", "grand tour", "postwar", "diaspora", "legacy", "timeline", "past"],
    mood: "wise"
  },
  {
    id: "geography-human-geography",
    label: "Geography / Human Geography",
    description: "Maps, wayfinding, migration routes, belonging, and how people move through places and landscapes.",
    keywords: ["map", "maps", "compass", "navigation", "wayfinding", "migration", "landmarks", "routes", "place", "space", "geography"],
    mood: "determined"
  },
  {
    id: "psychology",
    label: "Psychology",
    description: "Waiting, anticipation, unfinished-task memory, homesickness, uncertainty, and the emotions of almost-there.",
    keywords: ["psychology", "waiting", "anticipation", "homesickness", "doorway effect", "memory", "uncertainty", "boredom", "stress", "goal satisfaction"],
    overlayCategories: ["Psychology"],
    mood: "thinking"
  },
  {
    id: "sociology",
    label: "Sociology",
    description: "Belonging, public space, social roles, exclusion, inequality, rites of passage, and collective life on the move.",
    keywords: ["belonging", "identity", "public space", "social roles", "inequality", "rites of passage", "roles", "exclusion", "community", "society"],
    mood: "wise"
  },
  {
    id: "politics-government-global-politics",
    label: "Politics & Government / Global Politics",
    description: "Governments in transition, public legitimacy, policy choices, and large systems that organize collective motion.",
    keywords: ["government", "policy", "political", "term limits", "caretaker", "legitimacy", "participation", "public policy", "global politics"],
    mood: "determined"
  },
  {
    id: "economics-trade",
    label: "Economics & Trade",
    description: "Goods in motion, tourism markets, hotels, rents, consumption, and the economics of movement.",
    keywords: ["trade", "goods", "duty-free", "hotel", "tourism", "consumption", "cost", "market", "lodging", "economics"],
    mood: "neutral"
  },
  {
    id: "language-literature",
    label: "Language and Literature",
    description: "Narratives of wandering, homecoming, unfinished stories, and how language shapes journeys and endings.",
    keywords: ["literature", "language", "novel", "poem", "travel writing", "narrative", "story", "closure", "ending"],
    mood: "wise"
  },
  {
    id: "visual-arts",
    label: "Visual and Performing Arts",
    description: "Visual art, music, and theatre as ways of staging endings, rehearsal, atmosphere, and performance in motion.",
    keywords: ["painting", "visual art", "artist", "palette", "canvas", "landscape", "sketch", "design", "music", "song", "songs", "demo culture", "album", "sound", "melody", "theatre", "theater", "performance", "stage", "actor", "dramatic", "play", "scene"],
    mood: "excited"
  },
  {
    id: "media-film",
    label: "Media / Film",
    description: "Screen storytelling, film imagery, long takes, and how media frames the feeling of almost-there.",
    keywords: ["film", "cinema", "screen", "media", "storyboard", "long take", "visual genre", "camera"],
    mood: "excited"
  },
  {
    id: "philosophy",
    label: "Philosophy",
    description: "Journey versus destination, progress versus regress, quitting, patience, thresholds, and what arrival really means.",
    keywords: ["philosophy", "journey", "destination", "arrival", "progress", "regress", "zeno", "meaning", "purpose", "patience"],
    overlayCategories: ["Philosophy of Progress"],
    mood: "wise"
  },
  {
    id: "sciences",
    label: "Sciences",
    description: "Environmental science, biology, human development, and physics together as routes through growth, systems, motion, and change.",
    keywords: ["environment", "climate", "ecosystem", "sustainability", "overtourism", "landscape", "ecology", "environmental science", "biology", "human development", "adolescence", "growing pains", "coming of age", "developing brain", "growth", "body", "physics", "motion", "energy", "force", "threshold", "mechanics", "velocity", "systems"],
    mood: "determined"
  },
  {
    id: "computer-science-technology",
    label: "Computer Science / Technology",
    description: "Interfaces, prototypes, AI, testing, progress indicators, and the systems that measure movement.",
    keywords: ["computer science", "technology", "prototype", "wireframe", "mvp", "testing", "interface", "progress bar", "ai", "robot"],
    mood: "determined"
  },
  {
    id: "design-architecture-urbanism",
    label: "Design / Architecture / Urbanism",
    description: "Liminal spaces, sidewalks, hostile architecture, public design, and the built systems that make motion possible.",
    keywords: ["design", "architecture", "urbanism", "hostile architecture", "sidewalk", "stroad", "bridge", "built environment", "public design"],
    mood: "determined"
  }
];

const BIG_IDEA_ROUTES = buildBigIdeaRoutes(rawContentSections);
const bigIdeaRouteById = Object.fromEntries(BIG_IDEA_ROUTES.map((route) => [route.id, route]));

const learnSubjectRouteById = Object.fromEntries(LEARN_SUBJECT_ROUTES.map((route) => [route.id, route]));

const IMPORTED_RAW_CONTENT_BANK = rawContentSections;
const rawContentService = window.WSC_CREATE_RAW_CONTENT_SERVICE
  ? window.WSC_CREATE_RAW_CONTENT_SERVICE({
      rawContentSections: IMPORTED_RAW_CONTENT_BANK,
      sectionById,
      subjectById,
      bigIdeaRouteById,
      learnSubjectRouteById,
      normalizeKnowledgeKey,
      getSectionIdFromGuidingTitle,
      compareOfficialSectionOrder,
      compareRawEntriesByOfficialOrder,
      entryMatchesLearnSubjectRoute
    })
  : null;

const onlineModeController = createOnlineModeController({
  entryService: appEntryService
});

const progressStorageController = createProgressStorageController({
  storageService: appStorageService,
  progressService: appProgressService,
  entryService: appEntryService
});

const state = appStateService.createInitialState({
  defaultLensId: DEFAULT_LENS_ID,
  pendingRunColor: LIVE_ALPACA_COLORS[0]?.id || "cream",
  guestName: progressStorageController.loadGuestAlpacaName(),
  stats: progressStorageController.loadStats(),
  rawMastery: progressStorageController.loadRawMastery()
});

const refs = appDomService.getAppRefs(document);
const authController = createAuthController({
  appState: state,
  config: { url: SUPABASE_URL, publishableKey: SUPABASE_PUBLISHABLE_KEY },
  authService: appAuthService,
  profileService: supabaseProfileService,
  supabaseGlobal: window.supabase,
  alpacaNamePattern: ALPACA_NAME_PATTERN,
  locationObject: window.location,
  callbacks: {
    syncAuthChrome,
    normalizeStats,
    normalizeRawMastery,
    saveProgressLocally,
    saveRemoteProgress: saveAlpacaProgress,
    renderStats,
    renderExperience,
    resetLiveState: resetAlpacapardyLiveState
  }
});

const experienceFactories = Object.freeze({
  slideshow: buildSlideshowExperience,
  mindmap: buildMindMapExperience,
  rawcontent: buildRawContentExperience,
  regularguide: buildRegularGuideExperience,
  channel: buildAlpacaChannelExperience,
  alpacard: buildAlpacardExperience,
  writing: buildWritingExperience,
  quiz: buildQuizExperience,
  bowl: buildBowlExperience,
  race: buildRaceExperience,
  jump: buildJumpExperience,
  jeopardy: buildJeopardyExperience,
  run: buildRunExperience,
  relay: buildRelayExperience,
  buildcase: buildBuildCaseExperience
});

const gameLaunchController = createGameLaunchController({
  appState: state,
  experienceFactories,
  unavailableFactory: buildUnavailableModeExperience,
  cleanupCallbacks: [
    clearJeopardyTimer,
    clearDebateSpinTimer,
    clearDebateRevealTimer
  ]
});

const RESOURCE_LINKS = [
  {
    label: "Official website",
    url: "https://www.scholarscup.org/"
  },
  {
    label: "PwaaPwaa Revolution!",
    url: "https://pwaapwaarevolution.pwaaapwaarevolution.workers.dev/#"
  },
  {
    label: "PwaaPwaa Discord",
    url: "https://discord.gg/CK93VwNST8"
  },
  {
    label: "Pwaalpaca",
    url: "https://discord.gg/gRhgxKd7Q"
  },
  {
    label: "WSC reddit",
    url: "https://www.reddit.com/r/WorldScholars/"
  },
  {
    label: "ReadyScholarOne Discord",
    url: "https://discord.gg/93nMSrMG"
  },
  {
    label: "HongKong regional round slides",
    url: "https://docs.google.com/presentation/d/1xzByNi68oPn36sQyyJQt8cv4rnuTCacyLrNet8VXnDU/edit?slide=id.g3d1146daefb_0_4#slide=id.g3d1146daefb_0_4"
  },
  {
    label: "Pwaaprep",
    url: "https://pwaaprep.com/Are-We-There-Yet.html"
  }
];

init();

function clearRunTimer() {
  if (runTimerId) {
    window.clearInterval(runTimerId);
    runTimerId = null;
  }
}

function clearRaceTimer() {
  if (raceTimerId) {
    window.clearInterval(raceTimerId);
    raceTimerId = null;
  }
}

function clearRelayAnswerTimer() {
  if (relayAnswerTimerId) {
    window.clearInterval(relayAnswerTimerId);
    relayAnswerTimerId = null;
  }
}

function clearJumpAnimation() {
  if (jumpAnimationId) {
    window.cancelAnimationFrame(jumpAnimationId);
    jumpAnimationId = null;
  }
}

function clearJeopardyTimer() {
  if (jeopardyTimerId) {
    window.clearInterval(jeopardyTimerId);
    jeopardyTimerId = null;
  }
  clearRunTimer();
  clearRaceTimer();
  clearRelayAnswerTimer();
  clearJumpAnimation();
}

function clearDebateSpinTimer() {
  if (debateSpinTimerId) {
    window.clearTimeout(debateSpinTimerId);
    debateSpinTimerId = null;
  }
}

function clearDebateRevealTimer() {
  if (debateRevealTimerId) {
    window.clearTimeout(debateRevealTimerId);
    debateRevealTimerId = null;
  }
}

function clearAlpacapardyLiveHeartbeat() {
  if (state.live.heartbeatId) {
    window.clearInterval(state.live.heartbeatId);
    state.live.heartbeatId = null;
  }
}

function clearAlpacapardyLiveSync() {
  if (state.live.syncId) {
    window.clearInterval(state.live.syncId);
    state.live.syncId = null;
  }
  state.live.syncBusy = false;
}

function clearLiveLaunchCountdown() {
  if (liveLaunchCountdownTimerId) {
    window.clearTimeout(liveLaunchCountdownTimerId);
    liveLaunchCountdownTimerId = null;
  }
}

function clearAlpacapardyLiveSubscriptions() {
  const client = getSupabaseClient();
  if (state.live.sessionChannel) {
    alpacapardyLiveSupabaseService?.removeChannel(client, state.live.sessionChannel);
    state.live.sessionChannel = null;
  }
  if (state.live.lobbyChannel) {
    alpacapardyLiveSupabaseService?.removeChannel(client, state.live.lobbyChannel);
    state.live.lobbyChannel = null;
  }
}

function resetAlpacapardyLiveState({ keepGuestName = true } = {}) {
  clearAlpacapardyLiveHeartbeat();
  clearAlpacapardyLiveSync();
  clearAlpacapardyLiveSubscriptions();
  clearLiveLaunchCountdown();
  state.live.openSessions = [];
  state.live.currentSession = null;
  state.live.currentPlayer = null;
  state.live.players = [];
  state.live.revision = 0;
  state.live.status = "idle";
  state.live.message = "";
  state.live.error = "";
  state.live.selectedGameType = "alpacapardy";
  state.live.onlineView = "hub";
  state.live.arcadeState = null;
  state.live.syncBusy = false;
  state.live.joinCodeDraft = "";
  state.live.autoStartBusy = false;
  state.live.launchCountdownText = "";
  state.live.launchCountdownSessionId = null;
  state.live.waitingVideoSessionId = null;
  state.live.waitingVideos = [];
  state.live.waitingVideoIndex = 0;
  if (!keepGuestName) {
    state.live.guestName = loadGuestAlpacaName();
  }
}

function init() {
  const startupTasks = [
    hydrateKnowledgeBank,
    preloadExperienceAudio,
    setupSupabaseAuth,
    () => {
      if (refs.heroMascot) {
        appDomService.setHtml(refs.heroMascot, renderHeroVisual());
      }
    },
    renderInsights,
    render
  ];
  const eventBindings = [
    { target: document, type: "click", handler: handleClick },
    { target: document, type: "input", handler: handleInput },
    { target: document, type: "submit", handler: handleSubmit },
    { target: document, type: "keydown", handler: handleKeyDown },
    { target: document, type: "wheel", handler: handleMindMapGalleryWheel, options: { passive: false } },
    { target: document, type: "touchstart", handler: handleTouchStart, options: { passive: true } },
    { target: document, type: "touchend", handler: handleTouchEnd, options: { passive: true } },
    { target: window, type: "resize", handler: syncRadialMindMapScroll }
  ];

  appBootstrapService.runStartupTasks(startupTasks);
  appBootstrapService.markAppReady({
    windowTarget: window,
    flagName: "WSC_APP_READY",
    eventName: "wsc:app-ready"
  });
  appBootstrapService.registerEventListeners(eventBindings);
}

function handleClick(event) {
  const backToTop = event.target.closest("[data-back-to-top]");
  if (backToTop) {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: prefersReducedMotion ? "auto" : "smooth" });
    return;
  }

  const openAuth = event.target.closest("[data-open-auth]");
  if (openAuth) {
    closeHeroMenu();
    if (state.ui.appEntryGateOpen) {
      state.ui.authMode = "login";
      syncAuthChrome();
      return;
    }
    state.ui.authOpen = true;
    syncPopupScrollLock();
    renderAuthModal();
    return;
  }

  const authModeButton = event.target.closest("[data-auth-mode]");
  if (authModeButton) {
    state.ui.authMode = authModeButton.dataset.authMode;
    clearAuthNotice();
    syncAuthChrome();
    return;
  }

  const signOutButton = event.target.closest("[data-auth-signout]");
  if (signOutButton) {
    signOutOfAlpaccount();
    return;
  }

  const openAlpacaOnlineCampusButton = event.target.closest("[data-open-alpaca-online-campus]");
  if (openAlpacaOnlineCampusButton) {
    openAlpacaOnlineCampus();
    return;
  }

  const openAppEntryGate = event.target.closest("[data-open-app-entry-gate]");
  if (openAppEntryGate) {
    state.ui.appEntryGateOpen = true;
    state.ui.authOpen = false;
    state.ui.authMode = "login";
    syncAuthChrome();
    return;
  }

  const appEntryChoice = event.target.closest("[data-app-entry-choice]");
  if (appEntryChoice) {
    chooseAppEntryMode(appEntryChoice.dataset.appEntryChoice);
    return;
  }

  const closeCooperation = event.target.closest("[data-close-cooperation]");
  if (closeCooperation) {
    state.ui.cooperationOpen = false;
    syncPopupScrollLock();
    renderCooperationModal();
    return;
  }

  const appEntryLogin = event.target.closest("[data-app-entry-login]");
  if (appEntryLogin) {
    state.ui.authMode = "login";
    syncAuthChrome();
    return;
  }

  const onlineBackLocal = event.target.closest("[data-online-back-local]");
  if (onlineBackLocal) {
    switchToLocalMode();
    return;
  }

  const onlineRefresh = event.target.closest("[data-online-refresh]");
  if (onlineRefresh) {
    refreshAlpacapardyLiveLobby();
    return;
  }

  const onlineReturnHub = event.target.closest("[data-online-return-hub]");
  if (onlineReturnHub) {
    returnToAlpacaOnlineHub();
    return;
  }

  const onlineGameChoice = event.target.closest("[data-online-game-choice]");
  if (onlineGameChoice) {
    chooseOnlineGameType(onlineGameChoice.dataset.onlineGameChoice);
    return;
  }

  const liveCreateGame = event.target.closest("[data-live-create-game]");
  if (liveCreateGame) {
    createSelectedLiveGameRoom();
    return;
  }

  const liveRunSetupColor = event.target.closest("[data-live-run-setup-color]");
  if (liveRunSetupColor) {
    selectLiveRunSetupColor(liveRunSetupColor.dataset.liveRunSetupColor);
    return;
  }

  const liveStartGame = event.target.closest("[data-live-start-game]");
  if (liveStartGame) {
    startSelectedLiveGame();
    return;
  }

  const liveColorSelect = event.target.closest("[data-live-color-select]");
  if (liveColorSelect) {
    selectLiveAlpacaColor(liveColorSelect.dataset.liveColorSelect);
    return;
  }

  const liveAnswer = event.target.closest("[data-live-answer]");
  if (liveAnswer) {
    answerSelectedLiveGame(Number(liveAnswer.dataset.liveAnswer));
    return;
  }

  const liveNext = event.target.closest("[data-live-next]");
  if (liveNext) {
    advanceSelectedLiveGame();
    return;
  }

  const liveBuzz = event.target.closest("[data-live-buzz]");
  if (liveBuzz) {
    buzzSelectedLiveGame();
    return;
  }

  const liveWaitingVideoNav = event.target.closest("[data-live-waiting-video-nav]");
  if (liveWaitingVideoNav) {
    navigateLiveWaitingVideo(liveWaitingVideoNav.dataset.liveWaitingVideoNav);
    return;
  }

  const openResources = event.target.closest("[data-open-resources]");
  if (openResources) {
    state.ui.resourcesOpen = true;
    closeHeroMenu();
    syncPopupScrollLock();
    renderResourcesModal();
    return;
  }

  const heroMenuButton = event.target.closest("[data-toggle-hero-menu]");
  if (heroMenuButton) {
    toggleHeroMenu(heroMenuButton);
    return;
  }

  const closeAuth = event.target.closest("[data-close-auth]");
  if (closeAuth) {
    if (!canDismissAuthModal()) {
      return;
    }
    state.ui.authOpen = false;
    syncPopupScrollLock();
    renderAuthModal();
    return;
  }

  const closeResources = event.target.closest("[data-close-resources]");
  if (closeResources && (!event.target.closest("[data-resources-window]") || event.target.closest(".popup-close-button"))) {
    state.ui.resourcesOpen = false;
    syncPopupScrollLock();
    renderResourcesModal();
    return;
  }

  const scrollButton = event.target.closest("[data-scroll-route-builder]");
  if (scrollButton) {
    refs.routeBuilder && refs.routeBuilder.scrollIntoView({ behavior: "smooth", block: "start" });
    return;
  }

  const pathButton = event.target.closest("[data-pick-path]");
  if (pathButton) {
    choosePath(pathButton.dataset.pickPath);
    return;
  }

  const lensButton = event.target.closest("[data-pick-lens]");
  if (lensButton) {
    chooseLens(lensButton.dataset.pickLens);
    return;
  }

  const targetButton = event.target.closest("[data-pick-target]");
  if (targetButton) {
    chooseTarget(targetButton.dataset.pickTarget);
    return;
  }

  const modeSectionButton = event.target.closest("[data-toggle-mode-section]");
  if (modeSectionButton) {
    toggleModeChoiceSection(modeSectionButton.dataset.toggleModeSection);
    return;
  }

  const modeMenuButton = event.target.closest("[data-toggle-mode-menu]");
  if (modeMenuButton) {
    toggleModeChoiceMenu(modeMenuButton);
    return;
  }

  const targetNextButton = event.target.closest("[data-target-next]");
  if (targetNextButton) {
    continueTargetSelection();
    return;
  }

  const modeButton = event.target.closest("[data-pick-mode]");
  if (modeButton) {
    chooseMode(modeButton.dataset.pickMode, modeButton.dataset.pickModePath || null);
    return;
  }

  const trainTipClose = event.target.closest("[data-train-tip-close]");
  if (trainTipClose) {
    closeTrainTip();
    return;
  }

  const clearButton = event.target.closest("[data-clear-from]");
  if (clearButton) {
    clearFrom(clearButton.dataset.clearFrom);
    return;
  }

  const goStepButton = event.target.closest("[data-go-step]");
  if (goStepButton) {
    goToWizardStep(Number(goStepButton.dataset.goStep));
    return;
  }

  const rawConnectionButton = event.target.closest("[data-open-raw-connection]");
  if (rawConnectionButton) {
    openRawConnection(
      rawConnectionButton.dataset.openRawConnectionLens,
      rawConnectionButton.dataset.openRawConnectionTarget
    );
    return;
  }

  const guideSectionButton = event.target.closest("[data-open-guide-section]");
  if (guideSectionButton) {
    openGuideSection(guideSectionButton.dataset.openGuideSection);
    return;
  }

  const sectionChannelButton = event.target.closest("[data-open-section-channel]");
  if (sectionChannelButton) {
    openSectionChannel(sectionChannelButton.dataset.openSectionChannel);
    return;
  }

  const rawQuizOptionButton = event.target.closest("[data-raw-quiz-option]");
  if (rawQuizOptionButton) {
    rememberRawQuestionGallerySlide(rawQuizOptionButton);
    selectRawQuizOption(
      rawQuizOptionButton.dataset.rawQuizKey,
      Number(rawQuizOptionButton.dataset.rawQuizOption)
    );
    return;
  }

  const rawQuizPageButton = event.target.closest("[data-raw-quiz-page]");
  if (rawQuizPageButton) {
    shiftRawQuizPage(
      rawQuizPageButton.dataset.rawQuizPage,
      Number(rawQuizPageButton.dataset.rawQuizDirection),
      Number(rawQuizPageButton.dataset.rawQuizTotal)
    );
    return;
  }

  const rawMasteryToggle = event.target.closest("[data-raw-mastery-toggle]");
  if (rawMasteryToggle) {
    toggleRawMastery(rawMasteryToggle.dataset.rawMasteryToggle);
    return;
  }

  const rawAssetPointButton = event.target.closest("[data-raw-asset-point]");
  if (rawAssetPointButton) {
    selectRawAssetPoint(
      Number(rawAssetPointButton.dataset.rawAssetEntryIndex),
      Number(rawAssetPointButton.dataset.rawAssetIndex),
      Number(rawAssetPointButton.dataset.rawAssetPoint)
    );
    return;
  }

  const rawMediaTrigger = event.target.closest("[data-open-raw-media]");
  if (rawMediaTrigger) {
    openRawMediaLightboxFromTrigger(rawMediaTrigger);
    return;
  }

  const rawMediaNav = event.target.closest("[data-raw-media-nav]");
  if (rawMediaNav) {
    shiftRawMediaLightbox(rawMediaNav.dataset.rawMediaNav === "next" ? 1 : -1);
    return;
  }

  const closeRawMedia = event.target.closest("[data-close-raw-media]");
  if (closeRawMedia && (!event.target.closest("[data-raw-media-window]") || event.target.closest(".popup-close-button"))) {
    closeRawMediaLightbox();
    return;
  }

  const openMindMapEntryButton = event.target.closest("[data-open-mindmap-entry]");
  if (openMindMapEntryButton) {
    openMindMapEntry(openMindMapEntryButton.dataset.openMindmapEntry);
    return;
  }

  const mindMapGalleryNavButton = event.target.closest("[data-mindmap-gallery-nav]");
  if (mindMapGalleryNavButton) {
    navigateMindMapGallery(mindMapGalleryNavButton.dataset.mindmapGalleryNav);
    return;
  }

  const openMindMapGuideButton = event.target.closest("[data-open-mindmap-guide]");
  if (openMindMapGuideButton) {
    openMindMapGuide(openMindMapGuideButton.dataset.openMindmapGuide);
    return;
  }

  const closeMindMapPopup = event.target.closest("[data-close-mindmap-popup]");
  if (closeMindMapPopup && (!event.target.closest("[data-mindmap-popup-window]") || closeMindMapPopup.tagName === "BUTTON")) {
    closeMindMapEntry();
    return;
  }

  const closeMindMapGuidePopup = event.target.closest("[data-close-mindmap-guide-popup]");
  if (closeMindMapGuidePopup && (!event.target.closest("[data-mindmap-guide-popup-window]") || closeMindMapGuidePopup.tagName === "BUTTON")) {
    closeMindMapGuide();
    return;
  }

  const launchButton = event.target.closest("[data-launch-experience]");
  if (launchButton) {
    launchExperience();
    return;
  }

  const slideNavButton = event.target.closest("[data-slide-nav]");
  if (slideNavButton) {
    navigateSlide(slideNavButton.dataset.slideNav);
    return;
  }

  const channelNavButton = event.target.closest("[data-channel-nav]");
  if (channelNavButton) {
    navigateAlpacaChannel(channelNavButton.dataset.channelNav);
    return;
  }

  const alpacardNavButton = event.target.closest("[data-alpacard-nav]");
  if (alpacardNavButton) {
    navigateAlpacard(alpacardNavButton.dataset.alpacardNav);
    return;
  }

  const alpacardThumbButton = event.target.closest("[data-alpacard-index]");
  if (alpacardThumbButton) {
    setAlpacardIndex(Number(alpacardThumbButton.dataset.alpacardIndex));
    return;
  }

  const alpacardFlipButton = event.target.closest("[data-alpacard-flip]");
  if (alpacardFlipButton) {
    flipAlpacard();
    return;
  }

  const alpacardShuffleButton = event.target.closest("[data-alpacard-shuffle]");
  if (alpacardShuffleButton) {
    shuffleAlpacard();
    return;
  }

  const quizToggleSection = event.target.closest("[data-quiz-toggle-section]");
  if (quizToggleSection) {
    toggleQuizSection(quizToggleSection.dataset.quizToggleSection);
    return;
  }

  const quizSelectAll = event.target.closest("[data-quiz-select-all]");
  if (quizSelectAll) {
    selectAllQuizSections();
    return;
  }

  const quizSetCount = event.target.closest("[data-quiz-set-count]");
  if (quizSetCount) {
    setQuizQuestionCount(Number(quizSetCount.dataset.quizSetCount));
    return;
  }

  const quizToggleDifficulty = event.target.closest("[data-quiz-toggle-difficulty]");
  if (quizToggleDifficulty) {
    toggleQuizDifficulty(Number(quizToggleDifficulty.dataset.quizToggleDifficulty));
    return;
  }

  const quizStart = event.target.closest("[data-quiz-start]");
  if (quizStart) {
    startQuizRoute();
    return;
  }

  const quizOption = event.target.closest("[data-quiz-option]");
  if (quizOption) {
    answerQuizQuestion(
      Number(quizOption.dataset.quizQuestion),
      Number(quizOption.dataset.quizOption)
    );
    return;
  }

  const quizSubmit = event.target.closest("[data-quiz-submit]");
  if (quizSubmit) {
    submitQuizRoute();
    return;
  }

  const quizReset = event.target.closest("[data-quiz-reset]");
  if (quizReset) {
    resetQuizRoute();
    return;
  }

  const writingPromptButton = event.target.closest("[data-writing-next-prompt]");
  if (writingPromptButton) {
    nextWritingPrompt();
    return;
  }

  const writingPhaseButton = event.target.closest("[data-writing-phase]");
  if (writingPhaseButton) {
    setWritingPhase(writingPhaseButton.dataset.writingPhase);
    return;
  }

  const bowlStart = event.target.closest("[data-bowl-start]");
  if (bowlStart) {
    startBowlPractice();
    return;
  }

  const bowlOption = event.target.closest("[data-bowl-option]");
  if (bowlOption) {
    answerBowlQuestion(Number(bowlOption.dataset.bowlOption));
    return;
  }

  const bowlNext = event.target.closest("[data-bowl-next]");
  if (bowlNext) {
    advanceBowlQuestion();
    return;
  }

  const bowlReset = event.target.closest("[data-bowl-reset]");
  if (bowlReset) {
    resetBowlPractice();
    return;
  }

  const raceOptionButton = event.target.closest("[data-race-option]");
  if (raceOptionButton) {
    answerRaceQuestion(Number(raceOptionButton.dataset.raceOption));
    return;
  }

  const raceStartButton = event.target.closest("[data-race-start]");
  if (raceStartButton) {
    startRaceRoute();
    return;
  }

  const raceToggleCategory = event.target.closest("[data-race-toggle-category]");
  if (raceToggleCategory) {
    toggleRaceSetupCategory(raceToggleCategory.dataset.raceToggleCategory);
    return;
  }

  const raceAdvanceButton = event.target.closest("[data-race-advance]");
  if (raceAdvanceButton) {
    advanceRace();
    return;
  }

  const jumpStartButton = event.target.closest("[data-jump-start]");
  if (jumpStartButton) {
    startJumpRoute();
    return;
  }

  const jumpToggleCategory = event.target.closest("[data-jump-toggle-category]");
  if (jumpToggleCategory) {
    toggleJumpSetupCategory(jumpToggleCategory.dataset.jumpToggleCategory);
    return;
  }

  const jumpActionButton = event.target.closest("[data-jump-action]");
  if (jumpActionButton) {
    performJumpAction(jumpActionButton.dataset.jumpAction);
    return;
  }

  const jumpOptionButton = event.target.closest("[data-jump-option]");
  if (jumpOptionButton) {
    answerJumpQuestion(Number(jumpOptionButton.dataset.jumpOption));
    return;
  }

  const jumpContinueButton = event.target.closest("[data-jump-continue]");
  if (jumpContinueButton) {
    continueJumpRoute();
    return;
  }

  const buildCaseStart = event.target.closest("[data-buildcase-start]");
  if (buildCaseStart) {
    startBuildCaseRoute();
    return;
  }

  const buildCaseNextTopic = event.target.closest("[data-buildcase-next-topic]");
  if (buildCaseNextTopic) {
    showNextDebateTopic();
    return;
  }

  const buildCaseLetsDebate = event.target.closest("[data-buildcase-lets-debate]");
  if (buildCaseLetsDebate) {
    startDebateConversation();
    return;
  }

  const buildCaseSpinToggle = event.target.closest("[data-buildcase-spin-toggle]");
  if (buildCaseSpinToggle) {
    toggleDebateSideSpin();
    return;
  }

  const buildCaseBackTopic = event.target.closest("[data-buildcase-back-topic]");
  if (buildCaseBackTopic) {
    returnToDebateTopic();
    return;
  }

  const buildCaseSpinAgain = event.target.closest("[data-buildcase-spin-again]");
  if (buildCaseSpinAgain) {
    resetDebateSpinForCurrentTopic();
    renderExperience();
    return;
  }

  const debateSuggestion = event.target.closest("[data-debate-suggestion]");
  if (debateSuggestion) {
    toggleDebateSuggestion(debateSuggestion.dataset.debateSuggestion);
    return;
  }

  const debateSubmitRound = event.target.closest("[data-debate-submit-round]");
  if (debateSubmitRound) {
    submitDebateRound();
    return;
  }

  const debateNextRound = event.target.closest("[data-debate-next-round]");
  if (debateNextRound) {
    advanceDebateRound();
    return;
  }

  const buildCaseCamp = event.target.closest("[data-buildcase-camp]");
  if (buildCaseCamp) {
    chooseBuildCaseCamp(buildCaseCamp.dataset.buildcaseCamp);
    return;
  }

  const buildCaseSupport = event.target.closest("[data-buildcase-support]");
  if (buildCaseSupport) {
    toggleBuildCaseSupport(Number(buildCaseSupport.dataset.buildcaseSupport));
    return;
  }

  const buildCaseSupportSubmit = event.target.closest("[data-buildcase-support-submit]");
  if (buildCaseSupportSubmit) {
    confirmBuildCaseSupports();
    return;
  }

  const buildCaseRebuttal = event.target.closest("[data-buildcase-rebuttal]");
  if (buildCaseRebuttal) {
    chooseBuildCaseRebuttal(Number(buildCaseRebuttal.dataset.buildcaseRebuttal));
    return;
  }

  const buildCaseNext = event.target.closest("[data-buildcase-next]");
  if (buildCaseNext) {
    advanceBuildCaseRound();
    return;
  }

  const jeopardyPlayMode = event.target.closest("[data-jeopardy-play-mode]");
  if (jeopardyPlayMode) {
    setJeopardyPlayMode(jeopardyPlayMode.dataset.jeopardyPlayMode);
    return;
  }

  const liveRefresh = event.target.closest("[data-jeopardy-live-refresh]");
  if (liveRefresh) {
    refreshAlpacapardyLiveLobby();
    return;
  }

  const liveCreate = event.target.closest("[data-jeopardy-live-create]");
  if (liveCreate) {
    createAlpacapardyLiveRoom();
    return;
  }

  const liveJoin = event.target.closest("[data-jeopardy-live-join]");
  if (liveJoin) {
    joinAlpacapardyLiveRoom(liveJoin.dataset.jeopardyLiveJoin);
    return;
  }

  const liveLeave = event.target.closest("[data-jeopardy-live-leave]");
  if (liveLeave) {
    leaveAlpacapardyLiveRoom();
    return;
  }

  const liveStart = event.target.closest("[data-jeopardy-live-start]");
  if (liveStart) {
    startAlpacapardyLiveGame();
    return;
  }

  const jeopardyTile = event.target.closest("[data-jeopardy-open]");
  if (jeopardyTile) {
    const [groupIndex, tileIndex] = jeopardyTile.dataset.jeopardyOpen.split(":").map(Number);
    openJeopardyTile(groupIndex, tileIndex);
    return;
  }

  const jeopardyOption = event.target.closest("[data-jeopardy-option]");
  if (jeopardyOption) {
    answerJeopardyQuestion(Number(jeopardyOption.dataset.jeopardyOption));
    return;
  }

  const jeopardySetTeams = event.target.closest("[data-jeopardy-set-teams]");
  if (jeopardySetTeams) {
    setJeopardyTeamCount(Number(jeopardySetTeams.dataset.jeopardySetTeams));
    return;
  }

  const jeopardyToggleCategory = event.target.closest("[data-jeopardy-toggle-category]");
  if (jeopardyToggleCategory) {
    toggleJeopardySetupCategory(jeopardyToggleCategory.dataset.jeopardyToggleCategory);
    return;
  }

  const jeopardyStart = event.target.closest("[data-jeopardy-start]");
  if (jeopardyStart) {
    startJeopardyGame();
    return;
  }

  const jeopardyBack = event.target.closest("[data-jeopardy-back]");
  if (jeopardyBack) {
    closeJeopardyFocus();
    return;
  }

  const jeopardyTeam = event.target.closest("[data-jeopardy-team]");
  if (jeopardyTeam) {
    chooseJeopardyTeam(Number(jeopardyTeam.dataset.jeopardyTeam));
    return;
  }

  const jeopardyAddTeam = event.target.closest("[data-jeopardy-add-team]");
  if (jeopardyAddTeam) {
    addJeopardyTeam();
    return;
  }

  const jeopardyRemoveTeam = event.target.closest("[data-jeopardy-remove-team]");
  if (jeopardyRemoveTeam) {
    removeJeopardyTeam();
    return;
  }

  const jeopardyNextTurn = event.target.closest("[data-jeopardy-next-turn]");
  if (jeopardyNextTurn) {
    advanceJeopardyTeam();
    return;
  }

  const relayOption = event.target.closest("[data-relay-option]");
  if (relayOption) {
    answerRelayQuestion(Number(relayOption.dataset.relayOption));
    return;
  }

  const relayStart = event.target.closest("[data-relay-start]");
  if (relayStart) {
    startRelayRoute();
    return;
  }

  const relayToggleCategory = event.target.closest("[data-relay-toggle-category]");
  if (relayToggleCategory) {
    toggleRelaySetupCategory(relayToggleCategory.dataset.relayToggleCategory);
    return;
  }

  const relaySetTeams = event.target.closest("[data-relay-set-teams]");
  if (relaySetTeams) {
    setRelayTeamCount(Number(relaySetTeams.dataset.relaySetTeams));
    return;
  }

  const relaySetQuestionCount = event.target.closest("[data-relay-set-question-count]");
  if (relaySetQuestionCount) {
    setRelayQuestionCount(Number(relaySetQuestionCount.dataset.relaySetQuestionCount));
    return;
  }

  const relayContinue = event.target.closest("[data-relay-continue]");
  if (relayContinue) {
    advanceRelayQuestion();
    return;
  }

  const relayAddTeam = event.target.closest("[data-relay-add-team]");
  if (relayAddTeam) {
    addRelayTeam();
    return;
  }

  const relayRemoveTeam = event.target.closest("[data-relay-remove-team]");
  if (relayRemoveTeam) {
    removeRelayTeam();
    return;
  }

  const relayBuzz = event.target.closest("[data-relay-buzz]");
  if (relayBuzz) {
    buzzRelayTeam(Number(relayBuzz.dataset.relayBuzz));
    return;
  }

  const runOption = event.target.closest("[data-run-option]");
  if (runOption) {
    answerRunQuestion(Number(runOption.dataset.runOption));
    return;
  }

  const runToggleCategory = event.target.closest("[data-run-toggle-category]");
  if (runToggleCategory) {
    toggleRunSetupCategory(runToggleCategory.dataset.runToggleCategory);
    return;
  }

  const runStart = event.target.closest("[data-run-start]");
  if (runStart) {
    startRunRoute();
    return;
  }

  const runContinue = event.target.closest("[data-run-continue]");
  if (runContinue) {
    continueRun();
    return;
  }

  const replayButton = event.target.closest("[data-replay-current]");
  if (replayButton) {
    resetCurrentRouteAttempts();
    document.body.classList.remove("with-popup");
    launchExperience();
    return;
  }

  const changeSectionsButton = event.target.closest("[data-change-sections]");
  if (changeSectionsButton) {
    changeGuidingSections();
    return;
  }

  const changeModeButton = event.target.closest("[data-change-mode]");
  if (changeModeButton) {
    changeModeSelection();
    return;
  }

  const closeExperience = event.target.closest("[data-close-experience]");
  if (closeExperience) {
    closeCurrentExperience();
    return;
  }
}

function handleInput(event) {
  const joinCodeInput = event.target.closest("[data-online-room-code-input]");
  if (joinCodeInput) {
    state.live.joinCodeDraft = alpacapardyLiveSupabaseService?.normalizeRoomCode
      ? alpacapardyLiveSupabaseService.normalizeRoomCode(joinCodeInput.value)
      : String(joinCodeInput.value || "").trim().toUpperCase();
    joinCodeInput.value = state.live.joinCodeDraft;
  }
}

function handleSubmit(event) {
  const onlineJoinCodeForm = event.target.closest("[data-online-join-code-form]");
  if (onlineJoinCodeForm) {
    event.preventDefault();
    joinAlpacapardyLiveRoomByCode(new FormData(onlineJoinCodeForm));
    return;
  }

  const liveChatForm = event.target.closest("[data-jeopardy-live-chat-form]");
  if (liveChatForm) {
    event.preventDefault();
    sendAlpacapardyLiveChat(new FormData(liveChatForm));
    liveChatForm.reset();
    return;
  }

  const authForm = event.target.closest("[data-auth-form]");
  if (!authForm) {
    return;
  }

  event.preventDefault();
  submitAuthForm(authForm);
}

function handleKeyDown(event) {
  if (state.ui.rawMediaLightbox) {
    if (event.key === "Escape") {
      event.preventDefault();
      closeRawMediaLightbox();
      return;
    }

    if (event.key === "ArrowLeft") {
      event.preventDefault();
      shiftRawMediaLightbox(-1);
      return;
    }

    if (event.key === "ArrowRight") {
      event.preventDefault();
      shiftRawMediaLightbox(1);
      return;
    }
  }

  if (getActiveMindMapEntryBundle() && event.key === "Escape") {
    event.preventDefault();
    closeMindMapEntry();
    return;
  }

  if (state.ui.resourcesOpen && event.key === "Escape") {
    event.preventDefault();
    state.ui.resourcesOpen = false;
    syncPopupScrollLock();
    renderResourcesModal();
    return;
  }

  if (state.ui.cooperationOpen && event.key === "Escape") {
    event.preventDefault();
    state.ui.cooperationOpen = false;
    syncPopupScrollLock();
    renderCooperationModal();
    return;
  }

  if (state.ui.authOpen && event.key === "Escape" && canDismissAuthModal()) {
    event.preventDefault();
    state.ui.authOpen = false;
    syncPopupScrollLock();
    renderAuthModal();
    return;
  }

  const targetTag = event.target && event.target.tagName ? event.target.tagName.toLowerCase() : "";
  if (targetTag === "input" || targetTag === "textarea" || targetTag === "select") {
    return;
  }

  if (
    state.ui.appShellMode === "online" &&
    state.live.currentSession?.game_type === "alpaquiz" &&
    event.key === " " &&
    !event.repeat
  ) {
    event.preventDefault();
    buzzSelectedLiveGame();
    return;
  }

  if (state.experience && state.experience.type === "jump") {
    if (event.key === "ArrowUp" || event.key === " " || event.key.toLowerCase() === "w") {
      event.preventDefault();
      performJumpAction("jump");
      return;
    }

    if (event.key === "ArrowDown" || event.key.toLowerCase() === "s") {
      event.preventDefault();
      performJumpAction("duck");
      return;
    }
  }

  if (state.experience && state.experience.type === "alpacard") {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      navigateAlpacard("previous");
      return;
    }

    if (event.key === "ArrowRight") {
      event.preventDefault();
      navigateAlpacard("next");
      return;
    }

    if (event.key === " " || event.key.toLowerCase() === "f") {
      event.preventDefault();
      flipAlpacard();
      return;
    }
  }

  if (event.repeat || !state.experience || state.experience.type !== "relay") {
    return;
  }

  const experience = state.experience;
  if (!experience.started || experience.revealed || experience.buzzedTeamIndex !== null) {
    return;
  }

  const normalizedKey = event.key.toLowerCase();
  const teamIndex = experience.teams.findIndex((team) => team.key.toLowerCase() === normalizedKey);
  if (teamIndex === -1) {
    return;
  }

  event.preventDefault();
  buzzRelayTeam(teamIndex);
}

function handleTouchStart(event) {
  if (!state.ui.rawMediaLightbox) {
    return;
  }

  const touch = event.changedTouches && event.changedTouches[0];
  if (!touch || !event.target.closest(".raw-media-lightbox-window")) {
    state.ui.rawMediaSwipeStartX = null;
    return;
  }

  state.ui.rawMediaSwipeStartX = touch.clientX;
}

function handleTouchEnd(event) {
  if (!state.ui.rawMediaLightbox || !Number.isFinite(state.ui.rawMediaSwipeStartX)) {
    return;
  }

  const touch = event.changedTouches && event.changedTouches[0];
  if (!touch) {
    state.ui.rawMediaSwipeStartX = null;
    return;
  }

  const deltaX = touch.clientX - state.ui.rawMediaSwipeStartX;
  state.ui.rawMediaSwipeStartX = null;

  if (Math.abs(deltaX) < 40) {
    return;
  }

  shiftRawMediaLightbox(deltaX < 0 ? 1 : -1);
}

function choosePath(pathId) {
  clearJeopardyTimer();
  clearDebateSpinTimer();
  routeBuilderController.choosePath(state, pathId, { defaultLensId: DEFAULT_LENS_ID });
  render();
  keepRouteBuilderInView();
}

function chooseLens(lensId) {
  clearJeopardyTimer();
  routeBuilderController.chooseLens(state, lensId);
  render();
  keepRouteBuilderInView();
}

function chooseTarget(targetId) {
  clearJeopardyTimer();
  routeBuilderController.chooseTarget(state, targetId, {
    getSelectedSectionIds,
    getOrderedSectionIds
  });
  render();
  keepRouteBuilderInView();
}

function toggleModeChoiceSection(targetId) {
  clearJeopardyTimer();
  routeBuilderController.toggleModeChoiceSection(state, targetId, {
    visibleOpenPath: getVisibleModeChoicePath(),
    getSelectedSectionIds,
    getOrderedSectionIds
  });
  render();
  keepRouteBuilderInView();
}

function getVisibleModeChoicePath() {
  return state.ui.openModeChoicePath
    || document.querySelector(".mode-choice-board")?.dataset.activePath
    || document.querySelector(".mode-choice-column.is-open")?.dataset.modeChoicePath
    || null;
}

function toggleHeroMenu(button) {
  const links = button.closest(".hero-links");
  if (!links) {
    return;
  }

  const isOpen = links.classList.toggle("is-open");
  button.setAttribute("aria-expanded", isOpen ? "true" : "false");
  button.setAttribute("aria-label", isOpen ? "Close header menu" : "Open header menu");
}

function closeHeroMenu() {
  const links = document.querySelector(".hero-links.is-open");
  if (!links) {
    return;
  }
  links.classList.remove("is-open");
  links.querySelector("[data-toggle-hero-menu]")?.setAttribute("aria-expanded", "false");
}

function primeModeChoiceCardSpread(column) {
  column.querySelectorAll(".mode-choice-card-grid .wizard-choice-card").forEach((card, index) => {
    card.style.setProperty("opacity", "0", "important");
    card.style.setProperty("filter", "blur(2px)", "important");
    card.style.setProperty("transform", "translate(-50%, -50%) scale(0.18)", "important");
    card.style.setProperty("transition", "none", "important");
    card.style.setProperty("transition-delay", `${index * 36}ms`, "important");
  });
}

function scheduleModeChoiceCardSpread(column, board) {
  primeModeChoiceCardSpread(column);
  column.classList.remove("is-open");
  column.querySelector(".mode-choice-card-grid")?.getBoundingClientRect();
  column.classList.add("is-open");
  column.classList.remove("is-closing");
  column.querySelector(".mode-choice-card-grid")?.getBoundingClientRect();

  board._modeChoiceOpenFrame = window.requestAnimationFrame(() => {
    board._modeChoiceOpenFrame = window.requestAnimationFrame(() => {
      animateModeChoiceCardSpread(column, board);
      board._modeChoiceOpenFrame = null;
    });
  });
}

function getModeChoiceCardTarget(card) {
  const computedStyle = window.getComputedStyle(card);
  const parsePercent = (value, fallback) => {
    const parsed = Number.parseFloat(String(value || "").replace("%", ""));
    return Number.isFinite(parsed) ? parsed : fallback;
  };
  return {
    x: parsePercent(computedStyle.getPropertyValue("--menu-x"), 50),
    y: parsePercent(computedStyle.getPropertyValue("--menu-y"), 0)
  };
}

function easeModeChoiceSpread(progress) {
  return progress < 0.5
    ? 4 * progress * progress * progress
    : 1 - Math.pow(-2 * progress + 2, 3) / 2;
}

function setModeChoiceCardSpreadFrame(card, target, progress) {
  const eased = easeModeChoiceSpread(Math.min(1, Math.max(0, progress)));
  const x = -50 + (target.x + 50) * eased;
  const y = -50 + (target.y + 50) * eased;
  const scale = 0.18 + 0.82 * eased;
  const opacity = Math.min(1, Math.max(0, progress * 1.45));
  const blur = Math.max(0, 2 * (1 - eased));
  card.style.setProperty("opacity", String(opacity), "important");
  card.style.setProperty("filter", `blur(${blur.toFixed(2)}px)`, "important");
  card.style.setProperty("transform", `translate(${x.toFixed(2)}%, ${y.toFixed(2)}%) scale(${scale.toFixed(3)})`, "important");
}

function animateModeChoiceCardSpread(column, board) {
  const duration = 980;
  const cards = Array.from(column.querySelectorAll(".mode-choice-card-grid .wizard-choice-card")).map((card, index) => ({
    card,
    index,
    target: getModeChoiceCardTarget(card)
  }));
  const startedAt = window.performance.now();

  const step = (now) => {
    let isRunning = false;
    cards.forEach(({ card, index, target }) => {
      const progress = (now - startedAt - index * 36) / duration;
      if (progress < 1) {
        isRunning = true;
      }
      setModeChoiceCardSpreadFrame(card, target, progress);
    });

    if (isRunning) {
      board._modeChoiceSpreadAnimationId = window.requestAnimationFrame(step);
      return;
    }

    cards.forEach(({ card, target }) => {
      card.style.setProperty("opacity", "1", "important");
      card.style.setProperty("filter", "blur(0)", "important");
      card.style.setProperty("transform", `translate(${target.x}%, ${target.y}%) scale(1)`, "important");
    });
    board._modeChoiceSpreadAnimationId = null;
  };

  board._modeChoiceSpreadAnimationId = window.requestAnimationFrame(step);
}

function clearModeChoiceCardSpread(column) {
  column.querySelectorAll(".mode-choice-card-grid .wizard-choice-card").forEach((card) => {
    card.style.removeProperty("opacity");
    card.style.removeProperty("filter");
    card.style.removeProperty("transform");
    card.style.removeProperty("transition");
    card.style.removeProperty("transition-delay");
  });
}

function freezeModeChoiceColumnAtCurrentPosition(column, board) {
  const boardRect = board.getBoundingClientRect();
  const columnRect = column.getBoundingClientRect();
  column.style.setProperty("left", `${columnRect.left - boardRect.left}px`, "important");
  column.style.setProperty("top", `${columnRect.top - boardRect.top}px`, "important");
  column.style.setProperty("width", `${columnRect.width}px`, "important");
  column.style.setProperty("height", `${columnRect.height}px`, "important");
  column.style.setProperty("transform", "none", "important");
  column.style.setProperty("opacity", "1", "important");
  column.getBoundingClientRect();
}

function getModeChoiceCollapsedSlot(column) {
  const pathId = column.dataset.modeChoicePath || "";
  const left = Math.min(16, Math.max(4, window.innerWidth * 0.011));
  const topByPath = {
    learn: 40,
    play: 174,
    train: 308
  };
  return {
    left,
    top: topByPath[pathId] || 40,
    width: 112,
    height: 112
  };
}

function moveModeChoiceColumnToCollapsedSlot(column) {
  const slot = getModeChoiceCollapsedSlot(column);
  column.style.setProperty("left", `${slot.left}px`, "important");
  column.style.setProperty("top", `${slot.top}px`, "important");
  column.style.setProperty("width", `${slot.width}px`, "important");
  column.style.setProperty("height", `${slot.height}px`, "important");
  column.style.setProperty("transform", "none", "important");
  column.style.setProperty("opacity", "0.68", "important");
}

function clearModeChoiceColumnPosition(column) {
  ["left", "top", "width", "height", "transform", "opacity"].forEach((property) => {
    column.style.removeProperty(property);
  });
}

function toggleModeChoiceMenu(button) {
  const column = button.closest(".mode-choice-column");
  if (!column) {
    return;
  }

  if (!getSelectedSectionIds().length) {
    const board = column.closest(".mode-choice-board");
    board?.classList.add("needs-section-selection");
    window.setTimeout(() => board?.classList.remove("needs-section-selection"), 560);
    return;
  }

  const board = column.closest(".mode-choice-board");
  if (!board) {
    return;
  }

  const pathId = column.dataset.modeChoicePath || button.dataset.toggleModeMenu || "";
  const isOpen = column.classList.contains("is-open");
  const openColumn = board.querySelector(".mode-choice-column.is-open");
  const isSwitching = Boolean(openColumn && openColumn !== column);
  const animationMs = 1240;

  if (board._modeChoiceTimer) {
    window.clearTimeout(board._modeChoiceTimer);
  }
  if (board._modeChoiceFinishTimer) {
    window.clearTimeout(board._modeChoiceFinishTimer);
  }
  if (board._modeChoiceOpenTimer) {
    window.clearTimeout(board._modeChoiceOpenTimer);
  }
  if (board._modeChoiceOpenFrame) {
    window.cancelAnimationFrame(board._modeChoiceOpenFrame);
    board._modeChoiceOpenFrame = null;
  }
  if (board._modeChoiceSpreadAnimationId) {
    window.cancelAnimationFrame(board._modeChoiceSpreadAnimationId);
    board._modeChoiceSpreadAnimationId = null;
  }
  board.querySelectorAll(".mode-choice-column").forEach((item) => {
    if (item !== column) {
      clearModeChoiceCardSpread(item);
      clearModeChoiceColumnPosition(item);
    }
  });

  if (isOpen) {
    state.ui.openModeChoicePath = null;
    clearModeChoiceCardSpread(column);
    clearModeChoiceColumnPosition(column);
    column.classList.add("is-closing");
    board.classList.add("is-menu-closing");
    board.removeAttribute("data-active-path");
    button.setAttribute("aria-expanded", "false");
    board._modeChoiceTimer = window.setTimeout(() => {
      clearModeChoiceCardSpread(column);
      clearModeChoiceColumnPosition(column);
      column.classList.remove("is-open", "is-closing", "is-opening", "is-targeting");
      board.classList.remove("is-menu-closing", "is-menu-switching");
      board._modeChoiceTimer = null;
    }, animationMs);
    return;
  }

  if (isSwitching && openColumn) {
    freezeModeChoiceColumnAtCurrentPosition(openColumn, board);
  }
  state.ui.openModeChoicePath = pathId;
  board.dataset.activePath = pathId;
  board.classList.toggle("is-menu-switching", isSwitching);
  board.querySelectorAll("[data-toggle-mode-menu]").forEach((menuButton) => {
    menuButton.setAttribute("aria-expanded", menuButton === button ? "true" : "false");
  });
  board.querySelectorAll(".mode-choice-column").forEach((item) => {
    item.classList.toggle("is-targeting", item === column);
    if (item === column) {
      item.classList.remove("is-closing");
      item.classList.add("is-opening");
      return;
    }
    item.classList.remove("is-opening", "is-targeting");
    if (item !== openColumn) {
      item.classList.remove("is-open", "is-closing");
    }
  });
  if (openColumn && openColumn !== column) {
    openColumn.classList.add("is-closing");
    openColumn.classList.remove("is-open", "is-opening", "is-targeting");
    moveModeChoiceColumnToCollapsedSlot(openColumn);
  }
  button.setAttribute("aria-expanded", "true");

  clearModeChoiceColumnPosition(column);
  scheduleModeChoiceCardSpread(column, board);

  board._modeChoiceTimer = window.setTimeout(() => {
    board.querySelectorAll(".mode-choice-column").forEach((item) => {
      if (item === column) {
        item.classList.remove("is-opening", "is-targeting");
        clearModeChoiceCardSpread(item);
        clearModeChoiceColumnPosition(item);
        return;
      }
      clearModeChoiceCardSpread(item);
      clearModeChoiceColumnPosition(item);
      item.classList.remove("is-open", "is-closing", "is-opening", "is-targeting");
    });
    board._modeChoiceTimer = null;
    board.classList.remove("is-menu-switching", "is-menu-closing");
  }, animationMs);
}

function continueTargetSelection() {
  const selectedIds = getSelectedSectionIds();
  if (!selectedIds.length) {
    return;
  }

  clearJeopardyTimer();
  routeBuilderController.continueTargetSelection(state, {
    defaultLensId: DEFAULT_LENS_ID,
    selectedIds
  });
  render();
  keepRouteBuilderInView();
}

function chooseMode(modeId, pathId = null) {
  clearJeopardyTimer();
  closeHeroMenu();
  const result = routeBuilderController.chooseMode(state, modeId, {
    pathId,
    defaultLensId: DEFAULT_LENS_ID,
    selectedIds: getSelectedSectionIds(),
    getModePath,
    isModeUnavailable
  });
  if (!result.selected) {
    render();
    keepRouteBuilderInView();
    return;
  }

  if (result.unavailable) {
    gameLaunchController.openUnavailableExperience(modeId);
    render();
    refs.experiencePanel.scrollIntoView({ behavior: "smooth", block: "start" });
    return;
  }
  launchExperience();
}

function changeGuidingSections() {
  clearJeopardyTimer();
  routeBuilderController.changeGuidingSections(state, { defaultLensId: DEFAULT_LENS_ID });
  document.body.classList.remove("with-popup");
  render();
  keepRouteBuilderInView();
}

function changeModeSelection() {
  clearJeopardyTimer();
  const selectedIds = getSelectedSectionIds();
  routeBuilderController.changeModeSelection(state, {
    defaultLensId: DEFAULT_LENS_ID,
    selectedIds
  });
  document.body.classList.remove("with-popup");
  render();
  keepRouteBuilderInView();
}

function clearFrom(step) {
  clearJeopardyTimer();
  routeBuilderController.clearFrom(state, step, { defaultLensId: DEFAULT_LENS_ID });
  render();
  keepRouteBuilderInView();
}

function openRawConnection(lensId, targetId) {
  if (!lensId || !targetId) {
    return;
  }

  clearJeopardyTimer();
  routeBuilderController.openRawConnection(state, lensId, targetId);
  launchExperience();
}

function openGuideSection(sectionId) {
  if (!sectionId || !IMPORTED_RAW_CONTENT_BANK[sectionId]?.regularGuide) {
    return;
  }

  clearJeopardyTimer();
  routeBuilderController.openGuideSection(state, sectionId);
  launchExperience();
}

function openSectionChannel(sectionId) {
  if (!sectionId || !getAlpacaChannelVideosForSection(sectionId).length) {
    return;
  }

  clearJeopardyTimer();
  routeBuilderController.openSectionChannel(state, sectionId, { normalizeSectionId });
  launchExperience();
}

function render() {
  document.body.classList.toggle("is-online-mode", appStateService.isOnlineMode(state));
  document.body.classList.toggle("is-local-mode", appStateService.isLocalMode(state));
  renderStats();
  renderSessionControls();
  renderAppEntryGate();
  renderSummary();
  renderWizard();
  renderLiveOverlayMount();
  renderExperience();
  renderCooperationModal();
  renderResourcesModal();
  renderAuthModal();
  syncPopupScrollLock();
  syncActiveModalFocus();
}

function syncActiveModalFocus() {
  modalFocusService?.syncActiveDialog({ documentRef: document });
}

function renderInsights() {
  if (!refs.insightGrid) {
    return;
  }
  appDomService.setHtml(
    refs.insightGrid,
    data.insights
      .map(
        (insight) => `
        <article class="insight-card">
          <strong>${escapeHtml(insight.title)}</strong>
          <span>${escapeHtml(insight.body)}</span>
        </article>
      `
      )
      .join("")
  );
}

function renderStats() {
  if (!refs.statsStrip) {
    return;
  }

  if (appStateService.isOnlineMode(state)) {
    appDomService.setHtml(refs.statsStrip, renderOnlineScoreStrip());
    return;
  }

  const totalAnswered = Number(state.stats.totalAnswered) || 0;
  const totalCorrect = Number(state.stats.totalCorrect) || 0;
  const accuracy = totalAnswered ? Math.round((totalCorrect / totalAnswered) * 100) : 0;
  const totalMasterable = getTotalRawMasterableEntries();
  const mastered = getMasteredRawEntryCount();
  const masteredPercent = totalMasterable ? Math.round((mastered / totalMasterable) * 100) : 0;

  appDomService.setHtml(refs.statsStrip, `
    <div class="hero-progress-circles" aria-label="Progress circles">
      ${renderProgressCircleStatCard(
        "Questions answered",
        `${totalAnswered} answered`,
        `${accuracy}% accuracy`,
        accuracy
      )}
      ${renderProgressCircleStatCard(
        "Knowledge mastered",
        `${mastered}/${totalMasterable} entries`,
        `${masteredPercent}% mastered`,
        masteredPercent
      )}
    </div>
    ${renderBestScoreStrip()}
  `);
}

function renderSessionControls() {
  if (!refs.sessionControls) {
    return;
  }

  const isOnline = appStateService.isOnlineMode(state);
  const shellLabel = isOnline
    ? appEntryService.getLocalStudyActionLabel()
    : appEntryService.getCampusPreviewActionLabel();
  const shellIcon = isOnline
    ? "./app-icons/icon-local-transparent.png?v=20260520train"
    : "./assets/mascot/library/final-pack/Multiplayer.png?v=20260520train";
  const modeSwitchAction = appEntryService.getModeSwitchAction(isOnline);
  const soonLabel = appEntryService.getModeSwitchTitle(isOnline);
  const modeButton = `
    <button
      class="session-mode-button session-mode-icon-button hero-online-button ${isOnline ? "switch-local" : "switch-online"}"
      type="button"
      ${modeSwitchAction}
      aria-label="${escapeHtml(shellLabel)}. Open Local or 3D Campus Preview menu"
      title="${escapeHtml(soonLabel)}"
    >
      <img src="${shellIcon}" alt="" aria-hidden="true" />
      <span>${escapeHtml(shellLabel)}</span>
    </button>
  `;
  if (refs.heroOnlineMount) {
    appDomService.setHtml(refs.heroOnlineMount, modeButton);
  }

  if (!isSignedIn()) {
    refs.sessionControls.classList.remove("hidden");
    appDomService.setHtml(refs.sessionControls, `
      <div class="session-control-stack">
        <button
          class="hero-link-icon session-signout-button"
          type="button"
          data-open-auth
          aria-label="Open Alpaccount login"
          title="Alpaccount"
        >
          <img src="./assets/icons/ui/signin.png?v=20260509t" alt="Alpaccount icon" />
        </button>
      </div>
    `);
    return;
  }

  refs.sessionControls.classList.remove("hidden");
  appDomService.setHtml(refs.sessionControls, `
    <div class="session-control-stack">
      <button
        class="hero-link-icon session-signout-button"
        type="button"
        data-auth-signout
        aria-label="Log out of your Alpaccount"
        title="Log out"
      >
        <img src="./assets/footer/logout-icon.png?v=20260429b" alt="Log out icon" />
      </button>
    </div>
  `);
}

function renderAppEntryGate() {
  if (!refs.appEntryGateMount) {
    return;
  }

  if (!state.ui.appEntryGateOpen) {
    appDomService.clearHtml(refs.appEntryGateMount);
    syncActiveModalFocus();
    return;
  }

  const onlineAllowed = canAccessCampusPreview();
  const productSummary = appEntryService.getAppEntryProductSummary();
  const localActionLabel = appEntryService.getLocalStudyActionLabel();
  const campusPreviewLabel = onlineModeController.getCampusMultiplayerLabel();
  const campusPreviewActionLabel = onlineModeController.getCampusPreviewActionLabel();
  const campusPreviewStatus = onlineModeController.getCampusPreviewStatus();
  const defaultCampusAlpacaName = onlineModeController.getDefaultCampusAlpacaName();

  appDomService.setHtml(refs.appEntryGateMount, `
    <div class="app-entry-gate-overlay" role="dialog" aria-modal="true" aria-label="App mode">
      <article class="app-entry-gate-window">
        <section class="app-entry-intro">
          <p>${escapeHtml(productSummary)}</p>
        </section>
        ${renderAppEntryAuthPanel()}
        <div class="app-entry-choice-grid">
          <button class="app-entry-choice-card primary-choice" type="button" data-app-entry-choice="local">
            <span>LOCAL</span>
            <img
              class="app-entry-choice-logo"
              src="./app-icons/icon-local-transparent.png?v=20260520train"
              alt=""
              aria-hidden="true"
            />
            <strong>${escapeHtml(localActionLabel)}</strong>
          </button>
          <button class="app-entry-choice-card online-choice" type="button" data-app-entry-choice="online" ${onlineAllowed ? "" : "disabled"}>
            <span>${escapeHtml(campusPreviewLabel)}</span>
            <img
              class="app-entry-choice-logo"
              src="./assets/mascot/library/final-pack/Multiplayer.png?v=20260520train"
              alt=""
              aria-hidden="true"
            />
            <strong>${escapeHtml(campusPreviewActionLabel)}</strong>
            ${onlineAllowed
              ? `<small>${escapeHtml(campusPreviewStatus)} Default alpaca: ${escapeHtml(defaultCampusAlpacaName)}.</small>`
              : "<small>Preview unavailable</small>"}
          </button>
        </div>
      </article>
    </div>
  `);
  syncActiveModalFocus();
}

function renderAppEntryAuthPanel() {
  const context = getAuthRenderContext();
  const mode = context.mode || "login";
  const title = context.signedIn
    ? "Alpaccount"
    : mode === "signup"
      ? "Create Alpaccount"
      : mode === "forgot"
        ? "Recover Alpaccount"
        : mode === "reset"
          ? "New password"
          : "Connect Alpaccount";

  if (context.signedIn) {
    const profile = context.profile || {};
    return `
      <section class="app-entry-auth-panel signed-in">
        <div>
          <p class="challenge-label">Alpaccount</p>
          <h3>${escapeHtml(profile.alpaca_name || "Connected")}</h3>
          <p>${escapeHtml([profile.school_name, profile.country].filter(Boolean).join(" · ") || getCurrentUserEmail() || "Ready")}</p>
        </div>
      </section>
    `;
  }

  return `
    <section class="app-entry-auth-panel">
      <div class="app-entry-auth-heading">
        <p class="challenge-label">Alpaccount</p>
        <h3>${escapeHtml(title)}</h3>
      </div>
      ${state.ui.localProgressSaveError ? `<p class="auth-notice error">${escapeHtml(state.ui.localProgressSaveError)}</p>` : ""}
      ${authModalRenderer.renderNotice(context, { escapeHtml })}
      ${authModalRenderer.renderBody(context, { escapeHtml })}
    </section>
  `;
}

function chooseAppEntryMode(mode) {
  if (mode === "online") {
    openAlpacaOnlineCampus();
    return;
  }

  switchToLocalMode();
}

function openAlpacaOnlineCampus() {
  state.ui.appEntryGateOpen = false;
  onlineModeController.openCampusMultiplayer();
}

function switchToLocalMode() {
  state.ui.appEntryGateOpen = false;
  state.ui.appShellMode = "local";
  state.ui.cooperationOpen = true;
  resetAlpacapardyLiveState();
  state.experience = null;
  state.selection.path = null;
  state.selection.lens = DEFAULT_LENS_ID;
  state.selection.targetIds = [];
  state.selection.targetId = null;
  state.selection.mode = null;
  render();
  refs.routeBuilder && refs.routeBuilder.scrollIntoView({ behavior: "smooth", block: "start" });
}

function openAlpacaOnlineHub() {
  if (!canAccessLegacyLiveRooms()) {
    state.ui.appEntryGateOpen = true;
    state.live.error = getLegacyLiveRoomsDisabledMessage();
    render();
    return;
  }

  state.ui.appEntryGateOpen = false;
  state.ui.appShellMode = "online";
  state.ui.cooperationOpen = false;
  state.ui.wizardTransition = "forward";
  state.live.onlineView = "hub";
  state.selection.path = "play";
  state.selection.lens = DEFAULT_LENS_ID;
  state.selection.targetIds = [];
  state.selection.targetId = null;
  state.selection.mode = "jeopardy";
  state.experience = buildJeopardyExperience();
  state.experience.playMode = "multiplayer";
  render();
  refreshAlpacapardyLiveLobby();
  refs.routeBuilder && refs.routeBuilder.scrollIntoView({ behavior: "smooth", block: "start" });
}

function returnToAlpacaOnlineHub() {
  if (state.live.currentSession) {
    return;
  }
  state.live.onlineView = "hub";
  state.live.selectedGameType = "alpacapardy";
  state.live.arcadeState = null;
  state.live.error = "";
  if (!state.experience || state.experience.type !== "jeopardy") {
    state.experience = buildJeopardyExperience();
    state.experience.playMode = "multiplayer";
  }
  renderLiveSurfaces();
}

function renderProgressCircleStatCard(label, primary, secondary, percent) {
  const safePercent = Math.max(0, Math.min(100, Number(percent) || 0));
  return `
    <div class="stat-card progress-circle-card">
      <div
        class="stat-progress-ring"
        style="--percent:${safePercent};"
        aria-label="${escapeHtml(label)}: ${escapeHtml(primary)}, ${escapeHtml(secondary)}"
      >
        <div class="stat-progress-ring-inner">
          <strong>${safePercent}%</strong>
        </div>
      </div>
      <div class="stat-progress-circle-copy">
        <span>${escapeHtml(label)}</span>
        <strong>${escapeHtml(primary)}</strong>
        <em>${escapeHtml(secondary)}</em>
      </div>
    </div>
  `;
}

function renderBestScoreStrip() {
  const stats = state.stats || getDefaultStats();
  const cards = [
    {
      label: "Alpacapardy",
      value: formatBestNumberStat(stats.bestAlpacapardyScore),
      note: "Best team score"
    },
    {
      label: "Alpaca Run",
      value: getBestRunDestinationLabel(stats.bestRunStage),
      note: "Best destination"
    },
    {
      label: "Alpaca Jump",
      value: `${Math.round(Number(stats.bestJumpDistance) || 0)}m`,
      note: "Longest distance"
    },
    {
      label: "Alpaquiz",
      value: formatBestNumberStat(stats.bestRelayScore),
      note: "Best team score"
    },
    {
      label: "Survivalpaca",
      value: formatBestNumberStat(stats.bestRaceScore),
      note: "Best score"
    }
  ];

  return `
    <div class="hero-best-strip" aria-label="Best game scores">
      ${cards.map((card) => renderBestScoreCard(card)).join("")}
    </div>
  `;
}

function renderBestScoreCard(card) {
  return `
    <article class="hero-best-card">
      <span>${escapeHtml(card.label)}</span>
      <strong>${escapeHtml(card.value)}</strong>
      <em>${escapeHtml(card.note)}</em>
    </article>
  `;
}

function renderOnlineScoreStrip() {
  const cards = LIVE_GAME_ORDER.map((gameType) => {
    const record = getOnlineGameRecord(gameType);
    return {
      label: getLiveGameLabel(gameType),
      value: `${record.wins}/${record.games} games`,
      note: record.bestGames >= 5 && record.bestName
        ? `${record.bestName} · ${record.bestWinPercent}% wins`
        : "Best alpaca unlocks after 5 games"
    };
  });

  return `
    <div class="hero-best-strip hero-best-strip-online" aria-label="Online game records">
      ${cards.map((card) => renderBestScoreCard(card)).join("")}
    </div>
  `;
}

function getOnlineGameRecord(gameType) {
  const liveRecords = state.stats.liveRecords || {};
  const record = liveRecords[normalizeLiveGameType(gameType)] || {};
  const games = Math.max(0, Number(record.games) || 0);
  const wins = Math.max(0, Number(record.wins) || 0);
  const bestGames = Math.max(0, Number(record.bestGames) || 0);
  const bestWins = Math.max(0, Number(record.bestWins) || 0);
  const bestWinPercent = bestGames ? Math.round((bestWins / bestGames) * 100) : 0;
  return {
    games,
    wins,
    bestGames,
    bestName: record.bestName || "",
    bestWinPercent
  };
}

function formatBestNumberStat(value) {
  return String(Math.max(0, Number(value) || 0));
}

function getBestRunDestinationLabel(stageValue) {
  const stage = Number(stageValue);
  if (!Number.isFinite(stage) || stage < 0) {
    return "Not started";
  }

  const stop = ALPACA_RUN_ROUTE[Math.min(Math.max(0, Math.round(stage)), ALPACA_RUN_ROUTE.length - 1)];
  return stop ? stop.label : "Not started";
}

function renderSummary() {
  if (!refs.choiceSummary) {
    return;
  }

  if (state.ui.appShellMode === "online") {
    appDomService.clearHtml(refs.choiceSummary);
    refs.choiceSummary.classList.add("hidden");
    return;
  }

  const chips = [];
  const { path, mode } = state.selection;
  const selectedIds = getSelectedSectionIds();

  if (path) {
    chips.push(renderSummaryChip("Route", getPathOption(path).label));
  }
  if (selectedIds.length) {
    chips.push(renderSummaryChip("Guiding Sections", getTargetLabel()));
  }
  if (mode) {
    chips.push(renderSummaryChip("Next Stop", getModeOption(mode).title));
  }

  appDomService.setHtml(refs.choiceSummary, chips.join(""));
  refs.choiceSummary.classList.toggle("hidden", chips.length === 0);
}

function renderSummaryChip(label, value) {
  return `
    <div class="summary-chip">
      <span>${escapeHtml(label)}:</span>
      <strong>${escapeHtml(value)}</strong>
    </div>
  `;
}

function renderWizard() {
  if (state.ui.appShellMode === "online") {
    if (refs.routeBuilderTitle) {
      refs.routeBuilderTitle.textContent = "";
    }
    if (refs.wizardRailMount) {
      appDomService.clearHtml(refs.wizardRailMount);
    }
    appDomService.setHtml(refs.wizardSteps, renderAlpacaOnlineHub());
    return;
  }

  const renderedWizard = wizardRenderer.renderWizard(getWizardRenderContext(), getWizardRenderHelpers());

  if (refs.routeBuilderTitle) {
    refs.routeBuilderTitle.textContent = renderedWizard.title;
  }

  if (refs.wizardRailMount) {
    appDomService.setHtml(refs.wizardRailMount, renderedWizard.railHtml);
  }

  appDomService.setHtml(refs.wizardSteps, renderedWizard.stepsHtml);
}

function renderAlpacaOnlineHub() {
  if (!canAccessLegacyLiveRooms()) {
    return renderLegacyLiveRoomsDisabled();
  }

  const busy = ["loading", "joining", "creating", "starting"].includes(state.live.status);
  const currentSession = state.live.currentSession;
  const roster = getAlpacaOnlineRoster();
  const roomPlayers = state.live.players || [];
  const isHost = getAlpacapardyLiveIdentityContext().isHost;
  const canStart = getAlpacapardyLiveRenderContext().canStart;
  const onGamePage = Boolean(currentSession || state.live.onlineView === "game");

  return `
    <section class="online-hub-shell ${onGamePage ? "online-hub-shell-game" : "online-hub-shell-home"}">
      <aside class="online-hub-column online-hub-left">
        ${renderOnlineLiveSidebar({ busy, currentSession, roomPlayers, roster })}
      </aside>

      <main class="online-hub-main ${onGamePage ? "" : "online-hub-main-wide"}">
        ${onGamePage
          ? renderOnlineCreateGamePanel({ currentSession, roomPlayers, isHost, canStart, busy })
          : renderOnlineHomeGameGrid()}
      </main>
    </section>
  `;
}

function renderLegacyLiveRoomsDisabled() {
  return `
    <section class="online-hub-shell online-hub-shell-home">
      <main class="online-hub-main online-hub-main-wide">
        <article class="online-hub-card online-feature-card online-create-game-panel">
          <div class="online-create-heading">
            <div class="online-create-title-copy">
              <p class="challenge-label">Legacy live game rooms</p>
              <h2>Disabled for public review</h2>
            </div>
          </div>
          <p class="setup-helper">${escapeHtml(getLegacyLiveRoomsDisabledMessage())}</p>
          <p class="setup-helper">Use 3D Campus Preview for the public online path. Live rooms need separate RPC, RLS, persistence, and moderation review before they are reopened.</p>
          <div class="panel-actions">
            <button class="button primary" type="button" data-open-alpaca-online-campus>${escapeHtml(onlineModeController.getCampusPreviewActionLabel())}</button>
            <button class="button secondary" type="button" data-online-back-local>Study solo</button>
          </div>
        </article>
      </main>
    </section>
  `;
}

function getLiveOverlayRenderContext() {
  const busy = ["loading", "joining", "creating", "starting"].includes(state.live.status);
  const currentSession = state.live.currentSession;
  const roomPlayers = state.live.players || [];
  const isHost = getAlpacapardyLiveIdentityContext().isHost;
  const canStart = getAlpacapardyLiveRenderContext().canStart;
  return { currentSession, roomPlayers, isHost, canStart, busy };
}

function getLiveOverlayMount() {
  return appDomService.ensureBodyMount({ documentRef: document, id: "liveOverlayMount" });
}

function renderLiveOverlayMount() {
  const mount = getLiveOverlayMount();
  const html = state.ui.appShellMode === "online"
    ? renderLiveOverlayLayer(getLiveOverlayRenderContext())
    : "";

  if (!html) {
    appDomService.clearHtml(mount);
    syncActiveModalFocus();
    return;
  }

  const nextOverlay = appDomService.parseFirstElement(html, document);
  if (!nextOverlay) {
    appDomService.clearHtml(mount);
    syncActiveModalFocus();
    return;
  }

  const currentOverlay = mount.firstElementChild;
  if (canPatchLiveWaitingOverlay(currentOverlay, nextOverlay)) {
    patchLiveWaitingOverlay(currentOverlay, nextOverlay);
    syncActiveModalFocus();
    return;
  }

  appDomService.replaceChildren(mount, nextOverlay);
  syncActiveModalFocus();
}

function canPatchLiveWaitingOverlay(currentOverlay, nextOverlay) {
  if (!currentOverlay || !nextOverlay) {
    return false;
  }
  if (!currentOverlay.classList.contains("live-waiting-overlay") || !nextOverlay.classList.contains("live-waiting-overlay")) {
    return false;
  }
  if (currentOverlay.dataset.liveWaitingSessionId !== nextOverlay.dataset.liveWaitingSessionId) {
    return false;
  }
  const currentVideoKey = currentOverlay.querySelector("[data-live-waiting-video-card]")?.dataset.liveWaitingVideoKey || "";
  const nextVideoKey = nextOverlay.querySelector("[data-live-waiting-video-card]")?.dataset.liveWaitingVideoKey || "";
  return Boolean(currentVideoKey && currentVideoKey === nextVideoKey);
}

function patchLiveWaitingOverlay(currentOverlay, nextOverlay) {
  const overlayScrollTop = currentOverlay.scrollTop;
  replaceLiveWaitingPart(currentOverlay, nextOverlay, ".live-waiting-top");
  replaceLiveWaitingPart(currentOverlay, nextOverlay, ".live-player-grid");
  replaceLiveWaitingPart(currentOverlay, nextOverlay, ".live-color-picker", ".live-waiting-channel");
  replaceLiveWaitingPart(currentOverlay, nextOverlay, ".live-waiting-actions");
  currentOverlay.scrollTop = overlayScrollTop;
  window.requestAnimationFrame(() => {
    currentOverlay.scrollTop = overlayScrollTop;
  });
}

function replaceLiveWaitingPart(currentOverlay, nextOverlay, selector, beforeSelector = null) {
  const currentPart = currentOverlay.querySelector(selector);
  const nextPart = nextOverlay.querySelector(selector);
  if (currentPart && nextPart) {
    currentPart.replaceWith(nextPart);
    return;
  }
  if (currentPart && !nextPart) {
    currentPart.remove();
    return;
  }
  if (!currentPart && nextPart) {
    const waitingWindow = currentOverlay.querySelector(".live-waiting-window");
    const beforeNode = beforeSelector ? currentOverlay.querySelector(beforeSelector) : null;
    if (waitingWindow) {
      waitingWindow.insertBefore(nextPart, beforeNode || null);
    }
  }
}

function renderOnlineLiveSidebar({ busy, currentSession, roomPlayers, roster }) {
  const connectedCount = getAlpacaOnlineConnectedCount(roster);
  return `
    <div class="online-hub-card online-live-sidebar-card">
      <p class="online-connected-count">Alpacas connected: ${connectedCount}</p>
      <p class="challenge-label">Live game</p>
      ${renderOnlineJoinForm(busy || Boolean(currentSession))}
      ${currentSession ? renderOnlineCurrentGameSummary(currentSession, roomPlayers) : ""}
      ${renderOnlineOpenRoomsList(busy || Boolean(currentSession))}
    </div>
  `;
}

function renderOnlineCurrentGameSummary(currentSession, roomPlayers) {
  const gameType = normalizeLiveGameType(currentSession.game_type);
  const game = LIVE_GAME_TYPES[gameType] || LIVE_GAME_TYPES.alpacapardy;
  const players = getLivePlayablePlayers(roomPlayers);
  return `
    <article class="online-current-room">
      <div>
        <strong>${escapeHtml(game.label)}</strong>
        <span>${escapeHtml(currentSession.status || "lobby")} session</span>
        <small>Room ${escapeHtml(currentSession.room_code || "ROOM")} · ${players.length}/${Number(currentSession.max_players) || game.maxPlayers} alpacas</small>
      </div>
    </article>
  `;
}

function getAlpacaOnlineConnectedCount(roster) {
  return Array.isArray(roster) ? roster.length : 0;
}

function renderOnlineJoinForm(busy) {
  return `
    <form class="online-join-form compact" data-online-join-code-form>
      <input
        name="room_code"
        type="text"
        maxlength="12"
        autocomplete="off"
        placeholder="Room code"
        value="${escapeHtml(state.live.joinCodeDraft || "")}"
        data-online-room-code-input
        ${busy ? "disabled" : ""}
      />
      <button class="button secondary" type="submit" ${busy ? "disabled" : ""}>Join</button>
    </form>
  `;
}

function renderOnlineOpenRoomsList(busy) {
  const roomsByGame = getOpenLiveRoomsByGame(state.live.openSessions || []);
  const roomCount = Object.values(roomsByGame).reduce((sum, rooms) => sum + rooms.length, 0);

  if (!roomCount) {
    return `<p class="online-room-empty">No open rooms yet.</p>`;
  }

  return `
    <div class="online-room-list-compact">
      ${LIVE_GAME_ORDER.map((gameType) => {
        const rooms = roomsByGame[gameType] || [];
        if (!rooms.length) {
          return "";
        }
        return `
          <section class="online-room-game-group">
            <h4>${escapeHtml(getLiveGameLabel(gameType))}</h4>
            ${rooms.map((room) => renderOnlineRoomListItem(room, busy)).join("")}
          </section>
        `;
      }).join("")}
    </div>
  `;
}

function renderOnlineCreateGamePanel({ currentSession, roomPlayers, isHost, canStart, busy }) {
  const currentGameType = getCurrentLiveGameType();
  return `
    <article class="online-hub-card online-feature-card online-create-game-panel">
      <div class="online-create-heading">
        <div class="online-create-title-copy">
          <p class="challenge-label">${currentSession ? "Live room" : "Create a game"}</p>
          <h2>${escapeHtml(getLiveGameLabel(currentGameType))}</h2>
        </div>
        ${currentSession ? "" : `<button class="button secondary small online-return-hub-button" type="button" data-online-return-hub>Return to hub</button>`}
      </div>
      ${state.live.error ? `<p class="live-lobby-error">${escapeHtml(state.live.error)}</p>` : ""}
      ${renderSelectedOnlineGameBody({ currentSession, roomPlayers, isHost, canStart, busy })}
    </article>
  `;
}

function renderOnlineHomeGameGrid() {
  return `
    <section class="online-home-game-board">
      <div class="online-home-heading">
        <p class="challenge-label">Choose a live game</p>
        <h2>Alpaca Online</h2>
      </div>
      <div class="online-home-game-grid">
        ${LIVE_GAME_ORDER.map((gameType) => renderOnlineHomeGameCard(gameType)).join("")}
      </div>
    </section>
  `;
}

function renderOnlineHomeGameCard(gameType) {
  const game = LIVE_GAME_TYPES[gameType];
  const asset = getAssetValue(["contexts", "modes", game.modeId]);
  const openRoomCount = getOpenRoomsForGame(gameType).length;
  return `
    <button class="online-mode-card online-glow-card" type="button" data-online-game-choice="${escapeHtml(gameType)}">
      <span class="online-card-container noselect">
        <span class="online-card-canvas">
          ${Array.from({ length: 9 }, (_, index) => `<span class="tracker tr-${index + 1}" aria-hidden="true"></span>`).join("")}
          <span class="online-card-frame">
            <span class="card-content">
              <span class="card-glare" aria-hidden="true"></span>
              <span class="cyber-lines" aria-hidden="true">
                <span></span><span></span><span></span><span></span>
              </span>
              <span class="online-card-prompt">LIVE ROUTE</span>
              <span class="online-card-art">
                ${renderConfiguredMascotAsset(
                  getWizardCardAsset(asset),
                  gameType === "quiz" || gameType === "alpaquiz" ? "excited" : "determined",
                  "small",
                  {
                    alt: `${game.label} alpaca`,
                    slotClass: "online-card-image-slot",
                    imageClass: "online-card-image"
                  }
                )}
              </span>
              <span class="title">${escapeHtml(game.label)}</span>
              <span class="glowing-elements" aria-hidden="true">
                <span class="glow-1"></span>
                <span class="glow-2"></span>
                <span class="glow-3"></span>
              </span>
              <span class="subtitle">
                <span>${escapeHtml(getOnlineGameCardDescription(gameType))}</span>
                <span class="highlight">${openRoomCount} open ${openRoomCount === 1 ? "room" : "rooms"}</span>
              </span>
              <span class="card-particles" aria-hidden="true">
                <span></span><span></span><span></span><span></span><span></span><span></span>
              </span>
              <span class="corner-elements" aria-hidden="true">
                <span></span><span></span><span></span><span></span>
              </span>
              <span class="scan-line" aria-hidden="true"></span>
            </span>
          </span>
        </span>
      </span>
    </button>
  `;
}

function getOnlineGameCardDescription(gameType) {
  const descriptions = {
    alpacapardy: "Shared clue board, team strategy, and quick answers.",
    run: "Two alpacas race across the map toward Yale.",
    quiz: "Timed live questions with a fast leaderboard.",
    race: "Sudden-death survival with lives on the line.",
    alpaquiz: "Buzz first, answer fast, and control the turn."
  };

  return descriptions[gameType] || "Create a live alpaca game room.";
}

function renderSelectedOnlineGameBody({ currentSession, roomPlayers, isHost, canStart, busy }) {
  const gameType = getCurrentLiveGameType();
  if (gameType === "alpacapardy") {
    if (!currentSession) {
      return renderOnlineAlpacapardySetup();
    }
    if (currentSession.status === "playing" || state.experience?.started) {
      return renderOnlineAlpacapardyLiveGame();
    }
    return renderOnlineWaitingPopup({ currentSession, roomPlayers, isHost, canStart, busy });
  }

  if (!currentSession) {
    return renderOnlineArcadeSetup(gameType, busy);
  }

  if (currentSession.status === "lobby") {
    return renderOnlineArcadeWaitingRoom({ currentSession, roomPlayers, isHost, busy });
  }

  return renderOnlineArcadeGame({ currentSession, roomPlayers, isHost, busy });
}

function renderOnlineAlpacapardyLiveGame() {
  if (!state.experience?.started) {
    return `
      <div class="online-waiting-popup" role="status">
        <h3>Loading Alpacapardy board</h3>
        <p>The live room has started. Syncing the board now.</p>
      </div>
    `;
  }

  return `<div class="online-alpacapardy-live-board">${renderJeopardyExperience()}</div>`;
}

function renderOnlineArcadeSetup(gameType, busy) {
  const game = LIVE_GAME_TYPES[gameType] || LIVE_GAME_TYPES.run;
  const rules = {
    run: "2 players. Each alpaca gets different all-theme questions and races across the shared progress map.",
    quiz: "2-4 players. Kahoot-style shared questions, timed answers, and a leaderboard after every question.",
    race: "2 players. Sudden death, 3 lives each, one alpaca answers per turn.",
    alpaquiz: "2-4 players. Everyone sees the same all-theme question. First buzz controls the answer."
  };

  return `
    <section class="online-arcade-setup">
      <p>${escapeHtml(rules[gameType] || "Create a live game room.")}</p>
      <div class="race-launch-pills">
        <span>${game.minPlayers}-${game.maxPlayers} alpacas</span>
        <span>All themes</span>
        <span>Live room code</span>
      </div>
      ${gameType === "run" ? renderLiveRunSetupColorPicker() : ""}
      <div class="panel-actions">
        <button class="button primary" type="button" data-live-create-game ${busy ? "disabled" : ""}>Create ${escapeHtml(game.label)}</button>
      </div>
    </section>
  `;
}

function renderOnlineAlpacapardySetup() {
  if (!state.experience || state.experience.type !== "jeopardy") {
    return `<p class="online-muted">Alpacapardy setup is loading.</p>`;
  }

  return `
    <div class="online-alpacapardy-setup">
      ${renderJeopardySetup(state.experience)}
    </div>
  `;
}

function renderOnlineWaitingPopup({ currentSession, roomPlayers, isHost, canStart, busy }) {
  return `
    <div class="online-waiting-popup" role="status">
      <div>
        <p class="challenge-label">Room ${escapeHtml(currentSession.room_code || "ROOM")}</p>
        <h3>Waiting for alpacas to join</h3>
        <p>${escapeHtml(isHost ? "You are hosting. Share the room code, then start when enough alpacas arrive." : "Waiting for the host to start the game.")}</p>
      </div>
      <div class="panel-actions">
        <button class="button primary" type="button" data-jeopardy-live-start ${!canStart || busy ? "disabled" : ""}>Start Alpacapardy</button>
        <button class="button secondary" type="button" data-jeopardy-live-leave>Cancel the game</button>
      </div>
    </div>
  `;
}

function renderOnlineArcadeWaitingRoom({ currentSession, roomPlayers, isHost, busy }) {
  const gameType = getCurrentLiveGameType();
  const game = LIVE_GAME_TYPES[gameType] || LIVE_GAME_TYPES.run;
  const canStart = canStartSelectedLiveGame();

  return `
    <div class="online-waiting-popup" role="status">
      <div>
        <p class="challenge-label">Room ${escapeHtml(currentSession.room_code || "ROOM")}</p>
        <h3>Waiting for alpacas to join</h3>
        <p>${escapeHtml(isHost ? `You are hosting ${game.label}. Share the room code, then start when enough alpacas arrive.` : `Waiting for the host to start ${game.label}.`)}</p>
      </div>
      <div class="panel-actions">
        ${isHost ? `<button class="button primary" type="button" data-live-start-game ${!canStart || busy ? "disabled" : ""}>Start ${escapeHtml(game.label)}</button>` : ""}
        <button class="button secondary" type="button" data-jeopardy-live-leave>Cancel the game</button>
      </div>
    </div>
  `;
}

function renderLiveOverlayLayer({ currentSession, roomPlayers, isHost, canStart, busy }) {
  if (state.live.launchCountdownText) {
    return renderLiveLaunchCountdownOverlay();
  }

  if (!currentSession || currentSession.status !== "lobby") {
    return "";
  }

  return renderLiveWaitingOverlay({ currentSession, roomPlayers, isHost, canStart, busy });
}

function renderLiveLaunchCountdownOverlay() {
  return `
    <div class="live-launch-overlay" role="status" aria-live="assertive">
      <div class="live-launch-number">${escapeHtml(state.live.launchCountdownText)}</div>
    </div>
  `;
}

function renderLiveWaitingOverlay({ currentSession, roomPlayers, isHost, canStart, busy }) {
  const gameType = normalizeLiveGameType(currentSession.game_type);
  const game = LIVE_GAME_TYPES[gameType] || LIVE_GAME_TYPES.alpacapardy;
  const players = getLivePlayablePlayers(roomPlayers);
  const waitingVideos = getLiveWaitingVideos(currentSession.id);
  const launchCopy = canStart
    ? "Enough alpacas are here. Launching automatically..."
    : `Waiting for ${Math.max(0, game.minPlayers - players.length)} more alpaca${game.minPlayers - players.length === 1 ? "" : "s"}.`;

  return `
    <div
      class="live-waiting-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Waiting for alpacas"
      data-live-waiting-session-id="${escapeHtml(currentSession.id || "")}"
    >
      <article class="live-waiting-window">
        <div class="live-waiting-top">
          <p class="challenge-label">Room ${escapeHtml(currentSession.room_code || "ROOM")}</p>
          <h2>Waiting for alpacas to join</h2>
          <p>${escapeHtml(`${game.label} · ${players.length}/${Number(currentSession.max_players) || game.maxPlayers} alpacas connected. ${launchCopy}`)}</p>
        </div>
        ${renderLiveWaitingVideoRail(waitingVideos)}
        <div class="panel-actions live-waiting-actions">
          ${isHost && gameType === "alpacapardy" ? `<button class="button primary" type="button" data-jeopardy-live-start ${!canStart || busy ? "disabled" : ""}>Start now</button>` : ""}
          ${isHost && gameType !== "alpacapardy" ? `<button class="button primary" type="button" data-live-start-game ${!canStart || busy ? "disabled" : ""}>Start now</button>` : ""}
          <button class="button secondary" type="button" data-jeopardy-live-leave>Cancel the game</button>
        </div>
      </article>
    </div>
  `;
}

function renderLiveWaitingVideoRail(videos) {
  if (!videos.length) {
    return "";
  }

  const currentIndex = getLiveWaitingVideoIndex(videos);
  const current = videos[currentIndex];
  const previous = videos[(currentIndex - 1 + videos.length) % videos.length];
  const next = videos[(currentIndex + 1) % videos.length];
  const embeddedVideo = getEmbeddableVideo(current.url);
  const videoPreview = getVideoPreview(current.url);
  const canEmbedVideo = Boolean(embeddedVideo) && !window.WSC_DESKTOP_APP;
  const singleVideo = videos.length <= 1;
  const channelDomain = getAlpacaChannelDomain(current.sectionTitle || current.sectionTitles?.[0] || getLiveGameLabel());
  const description = current.description || current.verdict || current.channel || "Short Alpaca Channel video while the room fills.";
  const videoKey = normalizeVideoUrl(current.url);

  return `
    <section class="live-waiting-channel channel-shell">
      <article
        class="channel-browser live-waiting-channel-browser"
        aria-label="Alpaca Channel while you wait"
        data-live-waiting-video-card
        data-live-waiting-video-key="${escapeHtml(videoKey)}"
      >
        <div class="channel-browser-bar">
          <div class="channel-window-dots" aria-hidden="true">
            <span></span><span></span><span></span>
          </div>
          <div class="channel-address-pill">
            <span>${escapeHtml(channelDomain)}</span>
          </div>
        </div>
        <div class="channel-youtube-copy">
          <div class="channel-brand-row">
            ${renderConfiguredMascotAsset(getModeAssetPath("channel"), "excited", "small", {
              alt: "Alpaca Channel logo",
              slotClass: "channel-brand-icon-slot",
              imageClass: "channel-brand-icon"
            })}
            <span>Alpaca Channel while you wait</span>
          </div>
          <h2>${escapeHtml(current.title || "Alpaca Channel video")}</h2>
        </div>
        <div class="channel-video-frame">
          ${canEmbedVideo ? `
            <iframe
              class="channel-video-iframe"
              src="${escapeHtml(embeddedVideo.embedUrl)}"
              title="${escapeHtml(current.title || "Alpaca Channel video")}"
              loading="lazy"
              referrerpolicy="strict-origin-when-cross-origin"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowfullscreen
            ></iframe>
            <a class="channel-open-link" href="${escapeHtml(current.url)}" target="_blank" rel="noreferrer">Open on YouTube</a>
          ` : videoPreview ? `
            <a class="channel-video-fallback" href="${escapeHtml(current.url)}" target="_blank" rel="noreferrer">
              <img src="${escapeHtml(videoPreview.thumbnailUrl)}" alt="${escapeHtml(current.title || "Alpaca Channel video")}" loading="lazy" referrerpolicy="no-referrer" />
              <span>Open video</span>
            </a>
          ` : `
            <a class="channel-video-fallback no-thumb" href="${escapeHtml(current.url)}" target="_blank" rel="noreferrer">
              <span>Open video</span>
            </a>
          `}
        </div>
        <div class="channel-description">
          <h3>Description</h3>
          <p>${escapeHtml(description)}</p>
        </div>
        <div class="channel-video-count">${currentIndex + 1} / ${videos.length}</div>
      </article>
      <div class="channel-actions live-waiting-channel-actions">
        <button class="button secondary" type="button" data-live-waiting-video-nav="prev" ${singleVideo ? "disabled" : ""}>
          <span>Previous</span>
          <small>${escapeHtml(previous.title || "Video")}</small>
        </button>
        <button class="button primary" type="button" data-live-waiting-video-nav="next" ${singleVideo ? "disabled" : ""}>
          <span>Next</span>
          <small>${escapeHtml(next.title || "Video")}</small>
        </button>
      </div>
    </section>
  `;
}

function getLiveWaitingVideoIndex(videos) {
  if (!videos.length) {
    return 0;
  }

  if (!Number.isInteger(state.live.waitingVideoIndex)) {
    state.live.waitingVideoIndex = 0;
  }
  state.live.waitingVideoIndex = (state.live.waitingVideoIndex + videos.length) % videos.length;
  return state.live.waitingVideoIndex;
}

function navigateLiveWaitingVideo(direction) {
  if (!state.live.currentSession) {
    return;
  }

  const videos = getLiveWaitingVideos(state.live.currentSession.id);
  if (videos.length <= 1) {
    return;
  }

  const currentIndex = getLiveWaitingVideoIndex(videos);
  state.live.waitingVideoIndex = direction === "prev"
    ? (currentIndex - 1 + videos.length) % videos.length
    : (currentIndex + 1) % videos.length;
  renderLiveSurfaces();
}

function getLiveWaitingVideos(sessionId) {
  if (state.live.waitingVideoSessionId !== sessionId || !state.live.waitingVideos.length) {
    const videos = (alpacaChannelCatalog.videos || [])
      .filter(isShortLiveWaitingVideo)
      .map((video) => createStandaloneAlpacaChannelVideo(video));
    state.live.waitingVideoSessionId = sessionId;
    state.live.waitingVideos = shuffle(videos).slice();
    state.live.waitingVideoIndex = 0;
  }

  return state.live.waitingVideos;
}

function isShortLiveWaitingVideo(video) {
  return Boolean(video?.url && getVideoDurationSeconds(video.duration) < 120 && getEmbeddableVideo(video.url));
}

function getVideoDurationSeconds(duration) {
  const text = String(duration || "").trim();
  if (!text) {
    return Infinity;
  }

  const parts = text.split(":").map((part) => Number(part));
  if (!parts.length || parts.some((part) => !Number.isFinite(part))) {
    return Infinity;
  }

  return parts.reduce((total, part) => total * 60 + part, 0);
}

function renderOnlineArcadeGame({ currentSession, roomPlayers, isHost }) {
  const gameType = getCurrentLiveGameType();
  const arcadeState = getArcadeState(gameType);
  if (!arcadeState.started) {
    return renderOnlineArcadeWaitingRoom({ currentSession, roomPlayers, isHost, busy: false });
  }

  if (gameType === "run") {
    return renderLiveRunGame(arcadeState, roomPlayers);
  }
  if (gameType === "quiz") {
    return renderLiveQuizGame(arcadeState, roomPlayers, isHost);
  }
  if (gameType === "race") {
    return renderLiveRaceGame(arcadeState, roomPlayers);
  }
  if (gameType === "alpaquiz") {
    return renderLiveAlpaquizGame(arcadeState, roomPlayers, isHost);
  }

  return `<p class="online-muted">This live game is loading.</p>`;
}

function renderLivePlayerCard(player) {
  return `
    <article class="live-player-card ${player.user_id === state.auth.session?.user?.id ? "self" : ""}">
      <span>${escapeHtml(player.role === "host" ? "Host" : `Team ${Number(player.team_index) + 1}`)}</span>
      <strong>${escapeHtml(player.display_name)}</strong>
      <small>${escapeHtml(player.is_guest ? "Guest" : "Alpaccount")} · ${escapeHtml(player.connection_status || "online")}</small>
    </article>
  `;
}

function getLiveRunSetupColorId() {
  const requested = state.live.pendingRunColor;
  return LIVE_ALPACA_COLORS.some((color) => color.id === requested)
    ? requested
    : LIVE_ALPACA_COLORS[0]?.id || "cream";
}

function renderLiveRunSetupColorPicker() {
  const selectedColor = getLiveRunSetupColorId();

  return `
    <section class="live-color-picker live-run-setup-color-picker" aria-label="Choose your Alpaca Run color">
      <strong>Choose your alpaca color</strong>
      <div class="live-color-grid">
        ${LIVE_ALPACA_COLORS.map((color) => {
          const selected = color.id === selectedColor;
          return `
            <button
              class="live-color-chip ${selected ? "active" : ""}"
              type="button"
              data-live-run-setup-color="${escapeHtml(color.id)}"
              aria-pressed="${selected ? "true" : "false"}"
              title="${escapeHtml(color.label)}"
            >
              ${renderLiveRunAlpacaToken(color.id, "small")}
              <span>${escapeHtml(color.label)}</span>
            </button>
          `;
        }).join("")}
      </div>
    </section>
  `;
}

function selectLiveRunSetupColor(colorId) {
  if (!LIVE_ALPACA_COLORS.some((color) => color.id === colorId)) {
    return;
  }
  state.live.pendingRunColor = colorId;
  renderLiveSurfaces();
}

function renderLiveRunColorPicker(roomPlayers) {
  const arcadeState = getArcadeState("run");
  const colorsByUserId = arcadeState.colorsByUserId || {};
  const usedColors = new Set(Object.values(colorsByUserId));
  const userId = state.auth.session?.user?.id || "";

  return `
    <section class="live-color-picker">
      <strong>Choose your alpaca color</strong>
      <div class="live-color-grid">
        ${LIVE_ALPACA_COLORS.map((color) => {
          const owner = roomPlayers.find((player) => colorsByUserId[player.user_id] === color.id);
          const selected = colorsByUserId[userId] === color.id;
          const disabled = Boolean(owner && owner.user_id !== userId);
          return `
            <button
              class="live-color-chip ${selected ? "active" : ""}"
              type="button"
              data-live-color-select="${escapeHtml(color.id)}"
              ${disabled ? "disabled" : ""}
              title="${escapeHtml(disabled ? `${owner.display_name} chose ${color.label}` : color.label)}"
            >
              ${renderLiveRunAlpacaToken(color.id, "small")}
              <span>${escapeHtml(color.label)}</span>
            </button>
          `;
        }).join("")}
      </div>
    </section>
  `;
}

function renderLiveRunGame(arcadeState, roomPlayers) {
  const userId = state.auth.session?.user?.id || "";
  const players = getLivePlayablePlayers(roomPlayers).slice(0, 2);
  const selfPlayer = players.find((player) => player.user_id === userId) || players[0] || null;

  return `
    <section class="live-run-shell">
      ${renderLiveRunMap(arcadeState, players)}
      <div class="live-run-player-area">
        ${selfPlayer ? renderLiveRunPlayerPanel(selfPlayer, arcadeState) : `<p class="online-muted">Waiting for your alpaca profile.</p>`}
        <div class="live-run-opponent-status">
          ${players.filter((player) => player.user_id !== userId).map((player) => {
            const playerProgress = arcadeState.progress?.[player.user_id] || {};
            const colorId = arcadeState.colorsByUserId?.[player.user_id] || "cream";
            return `
              <article>
                ${renderLiveRunAlpacaToken(colorId, "small")}
                <div>
                  <strong>${escapeHtml(player.display_name)}</strong>
                  <span>${getLiveRunRouteIndex(playerProgress)} / ${ALPACA_RUN_ROUTE.length - 1} stops</span>
                </div>
              </article>
            `;
          }).join("") || `<p class="online-muted">Waiting for the other alpaca.</p>`}
        </div>
      </div>
    </section>
  `;
}

function renderLiveRunMap(arcadeState, players) {
  const progress = arcadeState.progress || {};
  const routeIndexes = players.map((player) => getLiveRunRouteIndex(progress[player.user_id] || {}));
  const currentIndex = Math.max(0, ...routeIndexes);

  return `
    <div class="run-map-stage live-run-map-stage">
      ${renderRunMapBackground()}
      ${ALPACA_RUN_ROUTE.map((stop, index) => renderRunMapStop(stop, index, currentIndex)).join("")}
      ${players.map((player, index) => {
        const playerProgress = progress[player.user_id] || {};
        const routeIndex = getLiveRunRouteIndex(playerProgress);
        const stop = ALPACA_RUN_ROUTE[routeIndex] || ALPACA_RUN_ROUTE[0];
        const colorId = arcadeState.colorsByUserId?.[player.user_id] || "cream";
        const offset = index === 0 ? -18 : 18;
        return `
          <div
            class="run-travel-marker live-run-player-marker"
            style="left:${stop.x}%; top:${getRunMapTop(stop)}; --live-run-offset:${offset}px;"
          >
            ${renderLiveRunAlpacaToken(colorId, "map")}
            <span>${escapeHtml(player.display_name)}</span>
          </div>
        `;
      }).join("")}
    </div>
  `;
}

function getLiveRunRouteIndex(playerProgress) {
  const stage = Math.max(0, Number(playerProgress.stage) || 0);
  const maxLiveStage = Math.max(1, GAME_CONFIG.runRegionalLevelOneCount);
  const maxRouteIndex = Math.max(0, ALPACA_RUN_ROUTE.length - 1);
  return Math.min(maxRouteIndex, Math.round((stage / maxLiveStage) * maxRouteIndex));
}

function renderLiveRunPlayerPanel(player, arcadeState) {
  const playerProgress = arcadeState.progress?.[player.user_id] || {};
  const questions = arcadeState.questionsByUserId?.[player.user_id] || [];
  const index = Number(playerProgress.index) || 0;
  const question = questions[index] || null;
  const answered = Boolean(playerProgress.revealed);
  const selectedIndex = playerProgress.selectedIndex;

  return `
    <article class="live-question-panel self">
      <div class="live-question-head">
        <strong>${escapeHtml(player.display_name)}</strong>
        <span>${getLiveRunRouteIndex(playerProgress)} stops cleared</span>
      </div>
      ${question ? `
        <h3>${escapeHtml(question.prompt)}</h3>
        <div class="raw-quiz-options">
          ${question.options.map((option, optionIndex) => {
            let classes = "raw-quiz-option option-button";
            if (answered) {
              if (optionIndex === question.answerIndex) {
                classes += " correct";
              } else if (optionIndex === selectedIndex) {
                classes += " wrong";
              }
              classes += " disabled";
            }
            return `
              <button class="${classes}" type="button" data-live-answer="${optionIndex}" ${answered || arcadeState.finished ? "disabled" : ""}>
                ${renderOptionToken(optionIndex)}
                <span>${escapeHtml(option)}</span>
              </button>
            `;
          }).join("")}
        </div>
        ${answered ? `<button class="button primary small" type="button" data-live-next>Continue</button>` : ""}
      ` : `<p class="online-muted">${arcadeState.finished ? "Finished." : "Waiting for the next question."}</p>`}
    </article>
  `;
}

function renderLiveQuizGame(arcadeState, roomPlayers, isHost) {
  const players = getLivePlayablePlayers(roomPlayers);
  const question = arcadeState.questions?.[arcadeState.questionIndex] || null;
  const revealed = arcadeState.revealed || arcadeState.finished;
  const answers = arcadeState.answers?.[arcadeState.questionIndex] || {};
  const userAnswer = answers[state.auth.session?.user?.id || ""];
  const leaderboard = getArcadeLeaderboard(arcadeState, players);
  const remaining = Math.max(0, Number(arcadeState.revealAt || 0) - Date.now());
  const secondsLeft = Math.ceil(remaining / 1000);

  return `
    <section class="live-kahoot-shell">
      <div class="live-kahoot-question">
        <p class="challenge-label">Question ${arcadeState.questionIndex + 1}/${arcadeState.questions.length}</p>
        <h3>${escapeHtml(question?.prompt || "Loading question...")}</h3>
        <strong class="live-timer-pill">${revealed ? "Answers locked" : `${secondsLeft}s`}</strong>
      </div>
      ${question ? `
        <div class="live-kahoot-options">
          ${question.options.map((option, optionIndex) => `
            <button
              class="live-kahoot-option ${userAnswer?.optionIndex === optionIndex ? "active" : ""} ${revealed && optionIndex === question.answerIndex ? "correct" : ""}"
              type="button"
              data-live-answer="${optionIndex}"
              ${revealed || userAnswer ? "disabled" : ""}
            >
              ${renderOptionToken(optionIndex)}
              <span>${escapeHtml(option)}</span>
            </button>
          `).join("")}
        </div>
      ` : ""}
      ${revealed ? renderLiveQuizRoundResults(arcadeState, players, question, answers, leaderboard) : renderLiveAnswerStatus(players, answers)}
      ${isHost && (revealed || secondsLeft <= 0 || Object.keys(answers).length >= players.length) ? `
        <div class="panel-actions">
          <button class="button primary" type="button" data-live-next>${arcadeState.questionIndex >= arcadeState.questions.length - 1 ? "Final leaderboard" : "Next question"}</button>
        </div>
      ` : ""}
    </section>
  `;
}

function renderLiveRaceGame(arcadeState, roomPlayers) {
  const players = getLivePlayablePlayers(roomPlayers).slice(0, 2);
  const activeUserId = arcadeState.activeUserId;
  const question = arcadeState.questions?.[arcadeState.questionIndex] || null;
  const userId = state.auth.session?.user?.id || "";
  const canAnswer = userId === activeUserId && !arcadeState.revealed && !arcadeState.finished;

  return `
    <section class="live-race-shell">
      <div class="live-race-lives">
        ${players.map((player) => `
          <article class="${player.user_id === activeUserId ? "active" : ""}">
            <strong>${escapeHtml(player.display_name)}</strong>
            <div class="race-lives-row">${renderLiveRaceLives(arcadeState.livesByUserId?.[player.user_id] ?? 3)}</div>
          </article>
        `).join("")}
      </div>
      ${arcadeState.finished ? renderLiveWinnerCard(arcadeState, players) : `
        <article class="live-question-panel self">
          <p class="challenge-label">${escapeHtml(players.find((player) => player.user_id === activeUserId)?.display_name || "Next alpaca")} answers now</p>
          <h3>${escapeHtml(question?.prompt || "Loading question...")}</h3>
          <div class="raw-quiz-options">
            ${(question?.options || []).map((option, optionIndex) => `
              <button class="raw-quiz-option option-button ${arcadeState.revealed && optionIndex === question.answerIndex ? "correct" : ""}" type="button" data-live-answer="${optionIndex}" ${canAnswer ? "" : "disabled"}>
                ${renderOptionToken(optionIndex)}
                <span>${escapeHtml(option)}</span>
              </button>
            `).join("")}
          </div>
          ${arcadeState.revealed ? `<button class="button primary small" type="button" data-live-next>Next turn</button>` : ""}
        </article>
      `}
    </section>
  `;
}

function renderLiveAlpaquizGame(arcadeState, roomPlayers, isHost) {
  const players = getLivePlayablePlayers(roomPlayers);
  const question = arcadeState.questions?.[arcadeState.questionIndex] || null;
  const buzzedPlayer = players.find((player) => player.user_id === arcadeState.buzzedUserId);
  const userId = state.auth.session?.user?.id || "";
  const canBuzz = !arcadeState.buzzedUserId && !arcadeState.revealed && !arcadeState.finished;
  const answerPending = Number.isInteger(arcadeState.selectedIndex) && !arcadeState.revealed;
  const answerSecondsLeft = arcadeState.buzzedUserId && arcadeState.answerDeadlineAt
    ? Math.max(0, Math.ceil((Number(arcadeState.answerDeadlineAt) - Date.now()) / 1000))
    : 0;
  const canAnswer = arcadeState.buzzedUserId === userId &&
    !arcadeState.revealed &&
    !answerPending &&
    (!arcadeState.answerDeadlineAt || answerSecondsLeft > 0);
  const timerLabel = answerPending
    ? "Checking..."
    : buzzedPlayer
      ? `${buzzedPlayer.display_name} · ${answerSecondsLeft}s`
      : "Press space or Buzz";

  return `
    <section class="live-alpaquiz-shell">
      <div class="live-kahoot-question">
        <p class="challenge-label">Alpaquiz · Question ${arcadeState.questionIndex + 1}/${arcadeState.questions.length}</p>
        <h3>${escapeHtml(question?.prompt || "Loading question...")}</h3>
        <strong class="live-timer-pill">${escapeHtml(timerLabel)}</strong>
      </div>
      <button class="button primary live-buzz-button" type="button" data-live-buzz ${canBuzz ? "" : "disabled"}>Buzz</button>
      <div class="raw-quiz-options">
        ${(question?.options || []).map((option, optionIndex) => {
          let classes = "raw-quiz-option option-button";
          if (optionIndex === arcadeState.selectedIndex) {
            classes += " active";
          }
          if (arcadeState.revealed && optionIndex === question.answerIndex) {
            classes += " correct";
          } else if (arcadeState.revealed && optionIndex === arcadeState.selectedIndex) {
            classes += " wrong";
          }
          return `
            <button class="${classes}" type="button" data-live-answer="${optionIndex}" ${canAnswer ? "" : "disabled"}>
              ${renderOptionToken(optionIndex)}
              <span>${escapeHtml(option)}</span>
            </button>
          `;
        }).join("")}
      </div>
      ${answerPending ? `<p class="online-muted">Answer locked. Revealing in 2 seconds...</p>` : ""}
      ${arcadeState.revealed && Number.isInteger(arcadeState.selectedIndex) ? `
        <p class="live-answer-feedback ${arcadeState.lastCorrect ? "correct" : "wrong"}">
          ${escapeHtml(arcadeState.lastCorrect ? "Correct answer!" : "Wrong turn. The green answer was correct.")}
        </p>
      ` : ""}
      ${renderLiveLeaderboard(getArcadeLeaderboard(arcadeState, players))}
      ${isHost && arcadeState.revealed ? `
        <div class="panel-actions">
          <button class="button primary" type="button" data-live-next>${arcadeState.questionIndex >= arcadeState.questions.length - 1 ? "Final leaderboard" : "Next question"}</button>
        </div>
      ` : ""}
    </section>
  `;
}

function renderLiveRunAlpacaToken(colorId, size = "small") {
  const color = LIVE_ALPACA_COLORS.find((entry) => entry.id === colorId) || LIVE_ALPACA_COLORS[0];
  const asset = getAssetValue(["run", "travelMarker"]) || "./app-icons/icon-192.png";
  return `
    <span class="live-alpaca-token ${escapeHtml(size)}" style="--alpaca-color:${escapeHtml(color.hex)}; --alpaca-filter:${escapeHtml(color.filter)};">
      <img src="${escapeHtml(asset)}" alt="" aria-hidden="true" />
    </span>
  `;
}

function renderLiveRaceLives(lives) {
  return Array.from({ length: 3 }, (_, index) => {
    const state = index < lives ? (lives === 1 ? "warning" : "full") : "empty";
    return `<span class="race-life ${state}">${renderRaceLivesIcon(state)}</span>`;
  }).join("");
}

function renderLiveAnswerStatus(players, answers) {
  return `
    <div class="live-answer-status-grid">
      ${players.map((player) => `
        <article class="${answers[player.user_id] ? "answered" : ""}">
          <strong>${escapeHtml(player.display_name)}</strong>
          <span>${answers[player.user_id] ? "Locked" : "Thinking"}</span>
        </article>
      `).join("")}
    </div>
  `;
}

function renderLiveQuizRoundResults(arcadeState, players, question, answers, leaderboard) {
  return `
    <section class="live-round-results">
      ${players.map((player) => {
        const answer = answers[player.user_id];
        const label = Number.isInteger(answer?.optionIndex) ? question.options[answer.optionIndex] : "No answer";
        return `
          <article class="${answer?.correct ? "correct" : "wrong"}">
            <strong>${escapeHtml(player.display_name)}</strong>
            <span>${escapeHtml(label)}</span>
          </article>
        `;
      }).join("")}
      ${renderLiveLeaderboard(leaderboard)}
    </section>
  `;
}

function renderLiveLeaderboard(leaderboard) {
  return `
    <div class="live-leaderboard">
      ${leaderboard.map((row, index) => `
        <article class="${index === 0 ? "leader" : ""}">
          <span>${index + 1}</span>
          <strong>${escapeHtml(row.name)}</strong>
          <em>${row.score} pts</em>
        </article>
      `).join("")}
    </div>
  `;
}

function renderLiveWinnerCard(arcadeState, players) {
  const winner = players.find((player) => player.user_id === arcadeState.winnerUserId);
  return `
    <article class="live-winner-card">
      <p class="challenge-label">Winner</p>
      <h3>${escapeHtml(winner?.display_name || "Winning alpaca")}</h3>
      <p>The other alpaca ran out of lives.</p>
    </article>
  `;
}

function renderOnlineRoomListItem(room, busy) {
  const players = room.players || [];
  const playerCount = players.filter((player) => ["host", "player"].includes(player.role)).length;
  const maxPlayers = Number(room.max_players) || 2;
  const gameType = normalizeLiveGameType(room.game_type);

  return `
    <article class="online-room-mini">
      <div>
        <strong>${escapeHtml(room.room_code || "ROOM")}</strong>
        <span>${escapeHtml(getLiveGameLabel(gameType))} · ${playerCount}/${maxPlayers} alpacas waiting</span>
      </div>
      <button class="button secondary" type="button" data-jeopardy-live-join="${escapeHtml(room.id)}" ${busy || playerCount >= maxPlayers ? "disabled" : ""}>Join</button>
    </article>
  `;
}

function getAlpacaOnlineRoster() {
  const byId = new Map();
  const addPlayer = (player, detail) => {
    if (!player?.display_name) {
      return;
    }
    byId.set(player.user_id || player.id || player.display_name, {
      name: player.display_name,
      detail
    });
  };

  (state.live.players || []).forEach((player) => addPlayer(player, player.role === "host" ? "Hosting room" : "In your room"));
  (state.live.openSessions || []).forEach((room) => {
    (room.players || []).forEach((player) => addPlayer(player, `Waiting in ${room.room_code || "room"}`));
  });

  return Array.from(byId.values());
}

function getOpenLiveRoomsByGame(rooms = []) {
  return rooms.reduce((groups, room) => {
    const gameType = normalizeLiveGameType(room.game_type);
    groups[gameType] = groups[gameType] || [];
    groups[gameType].push(room);
    return groups;
  }, {});
}

function getOpenRoomsForGame(gameType) {
  const normalized = normalizeLiveGameType(gameType);
  return (state.live.openSessions || []).filter((room) => normalizeLiveGameType(room.game_type) === normalized);
}

function normalizeLiveGameType(gameType) {
  const normalized = String(gameType || "").trim().toLowerCase();
  return LIVE_GAME_TYPES[normalized] ? normalized : "alpacapardy";
}

function getCurrentLiveGameType() {
  return normalizeLiveGameType(appStateService.getSelectedLiveGameType(state, "alpacapardy"));
}

function getLiveGameLabel(gameType = getCurrentLiveGameType()) {
  return LIVE_GAME_TYPES[normalizeLiveGameType(gameType)]?.label || "Live game";
}

function getLivePlayablePlayers(players = state.live.players) {
  return (players || []).filter((player) => ["host", "player"].includes(player.role)).sort(compareLivePlayers);
}

function getArcadeState(gameType = getCurrentLiveGameType()) {
  if (!state.live.arcadeState || state.live.arcadeState.gameType !== gameType) {
    state.live.arcadeState = createEmptyArcadeState(gameType);
  }
  return state.live.arcadeState;
}

function createEmptyArcadeState(gameType) {
  return {
    gameType,
    started: false,
    finished: false,
    colorsByUserId: {},
    scoresByUserId: {},
    answers: {}
  };
}

function chooseOnlineGameType(gameType) {
  const normalized = normalizeLiveGameType(gameType);
  if (state.live.currentSession) {
    return;
  }
  state.live.selectedGameType = normalized;
  state.live.onlineView = "game";
  state.live.arcadeState = normalized === "alpacapardy" ? null : createEmptyArcadeState(normalized);
  if (normalized === "alpacapardy" && (!state.experience || state.experience.type !== "jeopardy")) {
    state.experience = buildJeopardyExperience();
    state.experience.playMode = "multiplayer";
  }
  renderLiveSurfaces();
}

function renderStepPanel(index, title, helper, content, gridClass) {
  return wizardRenderer.renderStepPanel(index, title, helper, content, gridClass, getWizardRenderContext(), getWizardRenderHelpers());
}

function getCurrentWizardStepNumber() {
  return wizardRenderer.getCurrentStepNumber(getWizardRenderContext());
}

function getWizardStepDefinition(stepNumber) {
  return wizardRenderer.getStepDefinition(stepNumber, getWizardRenderContext(), getWizardRenderHelpers());
}

function renderWizardRail(currentStep) {
  return wizardRenderer.renderWizardRail(currentStep, getWizardRenderContext(), getWizardRenderHelpers());
}

function renderWizardRailItem(item, currentStep) {
  return wizardRenderer.renderWizardRailItem(item, currentStep, getWizardRenderContext(), getWizardRenderHelpers());
}

function getWizardRailItems() {
  return wizardRenderer.getRailItems(getWizardRenderContext(), getWizardRenderHelpers());
}

function getWizardCompletionDepth() {
  return wizardRenderer.getCompletionDepth(getWizardRenderContext());
}

function goToWizardStep(stepNumber) {
  if (stepNumber <= 1) {
    clearFrom("target");
    return;
  }

  if (stepNumber === 2) {
    clearFrom("mode");
  }
}

function renderPathCards() {
  return wizardRenderer.renderPathCards(getWizardRenderContext(), getWizardRenderHelpers());
}

function renderLensCards() {
  return wizardRenderer.renderLensCards(getWizardRenderContext(), getWizardRenderHelpers());
}

function renderTargetCards() {
  return wizardRenderer.renderTargetCards(getWizardRenderContext(), getWizardRenderHelpers());
}

function renderModeCards() {
  return wizardRenderer.renderModeCards(getWizardRenderContext(), getWizardRenderHelpers());
}

function renderModeChoiceBoard() {
  return wizardRenderer.renderModeChoiceBoard(getWizardRenderContext(), getWizardRenderHelpers());
}

function renderModeChoiceColumn(pathId, title, asset, options) {
  return wizardRenderer.renderModeChoiceColumn(pathId, title, asset, options, getWizardRenderContext(), getWizardRenderHelpers());
}

function renderModeChoiceCard(option, pathId) {
  return wizardRenderer.renderModeChoiceCard(option, pathId, getWizardRenderContext(), getWizardRenderHelpers());
}

function getWizardRenderContext() {
  return {
    selection: state.selection,
    ui: state.ui,
    wizardTotalSteps: WIZARD_TOTAL_STEPS,
    defaultLensId: DEFAULT_LENS_ID,
    pathOptions: PATH_OPTIONS,
    lensOptions: LENS_OPTIONS
  };
}

function getWizardRenderHelpers() {
  return {
    escapeHtml,
    renderConfiguredMascotAsset,
    getAssetValue,
    getWizardCardAsset,
    getTargetAssetPath,
    getModeAssetPath,
    getPathReviewBadge,
    getLensReviewBadge,
    getTargetReviewBadge,
    getModeReviewBadge,
    getTargetLabel,
    getModeOption,
    getSelectedSectionIds,
    getTargetOptions,
    getVisibleModeOptions,
    getVisibleModeOptionsForPath,
    getModePath,
    getAppModeSwitchIcon
  };
}

function getAppModeSwitchIcon() {
  return appStateService.isOnlineMode(state)
    ? "./app-icons/icon-local-transparent.png?v=20260520train"
    : "./assets/mascot/library/final-pack/Multiplayer.png?v=20260520train";
}

function getVisibleModeOptions() {
  return getVisibleModeOptionsForPath(state.selection.path || "learn");
}

function getVisibleModeOptionsForPath(pathId) {
  const options = MODE_OPTIONS[pathId] || [];
  const visibleOptions = options.map((option) => getDecoratedModeOption(option));
  if (pathId === "learn") {
    return visibleOptions.filter((option) => (
      option.id !== "slideshow"
      && (option.id !== "regularguide" || state.selection.lens === DEFAULT_LENS_ID)
    ));
  }

  return visibleOptions;
}

function getModeUnavailableReason(modeId) {
  return UNAVAILABLE_MODE_REASONS[modeId] || "";
}

function isModeUnavailable(modeId) {
  return Boolean(getModeUnavailableReason(modeId));
}

function getDecoratedModeOption(option) {
  if (!option || !isModeUnavailable(option.id)) {
    return option;
  }

  return {
    ...option,
    meta: "Available soon",
    unavailableReason: getModeUnavailableReason(option.id)
  };
}

function getModePath(modeId) {
  if (!modeId) {
    return null;
  }

  const pathId = Object.keys(MODE_OPTIONS).find((key) =>
    (MODE_OPTIONS[key] || []).some((option) => option.id === modeId)
  );
  if (pathId) {
    return pathId;
  }

  return null;
}

function usesGranularLearnSubjects() {
  return false;
}

function getActiveSubjectCatalog() {
  return usesGranularLearnSubjects() ? LEARN_SUBJECT_ROUTES : data.subjects;
}

function getActiveSubjectKnowledgeMap() {
  return usesGranularLearnSubjects() ? learnSubjectKnowledgeById : subjectKnowledgeById;
}

function getTargetOptions() {
  const totalQuestions = getQuestionsForRouteSelection(null, "all").length;
  const totalKnowledgeItems = wholeThemeKnowledge ? wholeThemeKnowledge.knowledgeItemCount : 0;

  if (state.selection.lens === "subject") {
    const subjectCatalog = getActiveSubjectCatalog();
    const subjectKnowledgeMap = getActiveSubjectKnowledgeMap();
    const options = [
      {
        id: "all",
        title: "All subjects",
        description: "Review the whole theme across every subject lane.",
        meta: `${totalQuestions} questions · ${totalKnowledgeItems} knowledge items · ${data.subjects.length} subjects`,
        kicker: "Complete subject route",
        mood: "happy"
      }
    ];

    subjectCatalog.forEach((subject) => {
      const subjectKnowledge = subjectKnowledgeMap[subject.id];
      const questions = getQuestionsForRouteSelection("subject", subject.id);
      const sectionCount = subjectKnowledge ? subjectKnowledge.sections.length : new Set(questions.map((question) => question.sectionId)).size;
      const knowledgeCount = subjectKnowledge ? subjectKnowledge.knowledgeItemCount : 0;
      const atomCount = subjectKnowledge ? subjectKnowledge.atoms.length : 0;
      options.push({
        id: subject.id,
        title: subject.label,
        description: subject.description,
        meta: usesGranularLearnSubjects()
          ? `${atomCount} subtopics · ${knowledgeCount} knowledge items · ${sectionCount} sections`
          : `${questions.length} questions · ${knowledgeCount} knowledge items · ${sectionCount} sections`,
        kicker: usesGranularLearnSubjects() ? "Study lane" : "Subject route",
        mood: subject.mood || "wise"
      });
    });

    return options;
  }

  if (state.selection.lens === "bigidea") {
    const options = [
      {
        id: "all",
        title: "All big ideas",
        description: "Review the whole theme across every big idea route.",
        meta: `${totalQuestions} questions · ${totalKnowledgeItems} knowledge items · ${BIG_IDEA_ROUTES.length} big ideas`,
        kicker: "Complete big idea route",
        mood: "happy"
      }
    ];

    BIG_IDEA_ROUTES.forEach((route) => {
      const knowledge = bigIdeaKnowledgeById[route.id];
      options.push({
        id: route.id,
        title: route.label,
        description: route.description,
        meta: `${knowledge ? knowledge.entries.length : 0} raw entries · ${knowledge ? knowledge.sections.length : 0} sections · ${knowledge ? knowledge.questionCount : 0} questions`,
        kicker: "Big idea route",
        mood: route.mood || "wise"
      });
    });

    return options;
  }

  const options = [];

  data.sections.forEach((section) => {
    const questions = getQuestionsForRouteSelection("section", section.id);
    const subjectCount = new Set(questions.flatMap((question) => question.subjectIds)).size;
    const knowledgeCount = sectionKnowledgeById[section.id] ? sectionKnowledgeById[section.id].knowledgeItemCount : 0;
    options.push({
      id: section.id,
      title: section.title,
      description: section.blurb,
      meta: `${questions.length} questions · ${knowledgeCount} knowledge items · ${subjectCount} subjects`,
      kicker: section.originalTitle,
      mood: "determined"
    });
  });

  return options;
}

function resetCurrentRouteAttempts() {
  gameLaunchController.resetCurrentRouteAttempts();
}

function launchExperience() {
  const result = gameLaunchController.launchSelectedExperience();
  if (!result.launched) {
    return;
  }

  render();
  refs.experiencePanel.scrollIntoView({ behavior: "smooth", block: "start" });
}

function closeCurrentExperience() {
  if (isAlpacapardyLiveActive()) {
    leaveAlpacapardyLiveRoom();
    return false;
  }

  gameLaunchController.closeExperience();
  render();
  return true;
}

function renderExperience() {
  if (state.ui.appShellMode === "online") {
    state.ui.rawMediaLightbox = null;
    state.ui.rawMediaSwipeStartX = null;
    refs.experiencePanel.classList.add("hidden");
    refs.experiencePanel.classList.remove("experience-panel--mindmap");
    appDomService.clearHtml(refs.experiencePanel);
    stopMindMapOrbitAnimation();
    syncPopupScrollLock();
    syncActiveModalFocus();
    return;
  }

  if (!state.experience) {
    state.ui.rawMediaLightbox = null;
    state.ui.rawMediaSwipeStartX = null;
    refs.experiencePanel.classList.add("hidden");
    refs.experiencePanel.classList.remove("experience-panel--mindmap");
    appDomService.clearHtml(refs.experiencePanel);
    stopMindMapOrbitAnimation();
    syncPopupScrollLock();
    syncActiveModalFocus();
    return;
  }

  refs.experiencePanel.classList.remove("hidden");
  refs.experiencePanel.classList.toggle("experience-panel--mindmap", state.experience.type === "mindmap");

  if (!["rawcontent", "mindmap"].includes(state.experience.type) && state.ui.rawMediaLightbox) {
    state.ui.rawMediaLightbox = null;
    state.ui.rawMediaSwipeStartX = null;
  }

  if (state.experience.type === "slideshow") {
    appDomService.setHtml(refs.experiencePanel, renderSlideshowExperience());
  } else if (state.experience.type === "mindmap") {
    appDomService.setHtml(refs.experiencePanel, renderMindMapExperience());
  } else if (state.experience.type === "rawcontent") {
    appDomService.setHtml(refs.experiencePanel, renderRawContentExperience());
  } else if (state.experience.type === "regularguide") {
    appDomService.setHtml(refs.experiencePanel, renderRegularGuideExperience());
  } else if (state.experience.type === "channel") {
    appDomService.setHtml(refs.experiencePanel, renderAlpacaChannelExperience());
  } else if (state.experience.type === "alpacard") {
    appDomService.setHtml(refs.experiencePanel, renderAlpacardExperience());
  } else if (state.experience.type === "writing") {
    appDomService.setHtml(refs.experiencePanel, renderWritingExperience());
  } else if (state.experience.type === "quiz") {
    appDomService.setHtml(refs.experiencePanel, renderQuizExperience());
  } else if (state.experience.type === "bowl") {
    appDomService.setHtml(refs.experiencePanel, renderBowlExperience());
  } else if (state.experience.type === "race") {
    appDomService.setHtml(refs.experiencePanel, renderRaceExperience());
  } else if (state.experience.type === "jump") {
    appDomService.setHtml(refs.experiencePanel, renderJumpExperience());
  } else if (state.experience.type === "jeopardy") {
    appDomService.setHtml(refs.experiencePanel, renderJeopardyExperience());
  } else if (state.experience.type === "run") {
    appDomService.setHtml(refs.experiencePanel, renderRunExperience());
  } else if (state.experience.type === "relay") {
    appDomService.setHtml(refs.experiencePanel, renderRelayExperience());
  } else if (state.experience.type === "buildcase") {
    appDomService.setHtml(refs.experiencePanel, renderBuildCaseExperience());
  } else if (state.experience.type === "unavailable") {
    appDomService.setHtml(refs.experiencePanel, renderUnavailableModeExperience());
  }

  syncExperienceTimers();
  syncPopupScrollLock();
  syncRadialMindMapScroll();
  syncMindMapOrbitAnimation();
  syncRawQuestionGalleries();
  syncActiveModalFocus();
}

function renderExperiencePreservingScroll() {
  renderPreservingScroll(renderExperience);
}

function renderPreservingScroll(renderCallback) {
  const scrollContainer = document.scrollingElement || document.documentElement || document.body;
  const scrollTop = scrollContainer ? scrollContainer.scrollTop : window.scrollY || 0;
  const scrollLeft = scrollContainer ? scrollContainer.scrollLeft : window.scrollX || 0;
  const waitingOverlay = document.querySelector(".live-waiting-overlay");
  const waitingOverlayScrollTop = waitingOverlay ? waitingOverlay.scrollTop : null;
  const waitingOverlayScrollLeft = waitingOverlay ? waitingOverlay.scrollLeft : null;
  const previousHtmlBehavior = document.documentElement ? document.documentElement.style.scrollBehavior : "";
  const previousBodyBehavior = document.body ? document.body.style.scrollBehavior : "";

  if (document.documentElement) {
    document.documentElement.style.scrollBehavior = "auto";
  }
  if (document.body) {
    document.body.style.scrollBehavior = "auto";
  }

  renderCallback();

  const restoreScroll = () => {
    const target = document.scrollingElement || document.documentElement || document.body;
    if (target) {
      target.scrollTop = scrollTop;
      target.scrollLeft = scrollLeft;
    }
    const currentWaitingOverlay = document.querySelector(".live-waiting-overlay");
    if (currentWaitingOverlay && waitingOverlayScrollTop !== null) {
      currentWaitingOverlay.scrollTop = waitingOverlayScrollTop;
      currentWaitingOverlay.scrollLeft = waitingOverlayScrollLeft || 0;
    }
    window.scrollTo({ left: scrollLeft, top: scrollTop, behavior: "auto" });
    if (document.documentElement) {
      document.documentElement.style.scrollBehavior = previousHtmlBehavior;
    }
    if (document.body) {
      document.body.style.scrollBehavior = previousBodyBehavior;
    }
  };

  window.requestAnimationFrame(() => {
    window.requestAnimationFrame(restoreScroll);
  });
}

function renderLiveSurfaces() {
  if (state.ui.appShellMode === "online") {
    renderPreservingScroll(render);
    return;
  }

  renderExperiencePreservingScroll();
}

function buildAlpacardExperience() {
  const cards = getAlpacardsForSelection();
  return alpacardsMode?.buildExperience
    ? alpacardsMode.buildExperience(cards, getTargetLabel())
    : {
        type: "alpacard",
        routeTitle: getTargetLabel(),
        cards,
        index: 0,
        flipped: false
      };
}

function getAlpacardsForSelection() {
  const cards = Array.isArray(window.WSC_ALPACARDS) ? window.WSC_ALPACARDS : [];
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
  const cards = experience.cards || [];
  const total = cards.length;
  const current = total ? cards[Math.min(experience.index, total - 1)] : null;
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
        ${experience.flipped ? renderAlpacardBack(current) : renderAlpacardFront(current)}
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

function renderAlpacardFront(card) {
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

function renderAlpacardBack(card) {
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
  const connections = getAlpacardConnectionChips(card);

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

function getAlpacardConnectionChips(card) {
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

function navigateAlpacard(direction) {
  const didNavigate = alpacardsMode?.navigate
    ? alpacardsMode.navigate(state.experience, direction)
    : false;
  if (didNavigate) {
    if (!syncAlpacardCarouselState({ scrollThumbnail: true })) {
      renderExperience();
    }
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
  if (!syncAlpacardCarouselState({ scrollThumbnail: true })) {
    renderExperience();
  }
}

function setAlpacardIndex(index) {
  const didSetIndex = alpacardsMode?.setIndex
    ? alpacardsMode.setIndex(state.experience, index)
    : false;
  if (didSetIndex) {
    if (!syncAlpacardCarouselState({ scrollThumbnail: true })) {
      renderExperience();
    }
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
  if (!syncAlpacardCarouselState({ scrollThumbnail: true })) {
    renderExperience();
  }
}

function flipAlpacard() {
  const didFlip = alpacardsMode?.flip
    ? alpacardsMode.flip(state.experience)
    : false;
  if (didFlip) {
    if (!syncAlpacardCarouselState({ scrollThumbnail: false })) {
      renderExperience();
    }
    return;
  }

  if (!state.experience || state.experience.type !== "alpacard") {
    return;
  }

  state.experience.flipped = !state.experience.flipped;
  if (!syncAlpacardCarouselState({ scrollThumbnail: false })) {
    renderExperience();
  }
}

function syncAlpacardCarouselState(options = {}) {
  if (!refs.experiencePanel || !state.experience || state.experience.type !== "alpacard") {
    return false;
  }

  const cards = Array.isArray(state.experience.cards) ? state.experience.cards : [];
  if (!cards.length) {
    return false;
  }

  const total = cards.length;
  const index = Math.max(0, Math.min(total - 1, Math.trunc(Number(state.experience.index) || 0)));
  state.experience.index = index;

  const current = cards[index] || {};
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

function shuffleAlpacard() {
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

function syncRadialMindMapScroll() {
  if (!refs.experiencePanel || state.experience?.type !== "mindmap") {
    return;
  }

  window.requestAnimationFrame(() => {
    const maps = refs.experiencePanel.querySelectorAll(".mindmap-radial-scroll");
    maps.forEach((map) => {
      const stage = map.querySelector(".mindmap-radial-stage");
      if (!stage) {
        return;
      }

      stage.style.removeProperty("--mindmap-stage-scale");
    });
  });
}

function stopMindMapOrbitAnimation() {
  if (mindMapOrbitAnimationId) {
    window.cancelAnimationFrame(mindMapOrbitAnimationId);
    mindMapOrbitAnimationId = null;
  }
}

function syncMindMapOrbitAnimation() {
  stopMindMapOrbitAnimation();

  if (!refs.experiencePanel || state.experience?.type !== "mindmap") {
    return;
  }

  if (window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches) {
    return;
  }

  const stages = [...refs.experiencePanel.querySelectorAll("[data-mindmap-orbit-stage]")];
  if (!stages.length) {
    return;
  }

  let orbitTime = 0;
  let lastFrameTime = null;

  const animate = (frameTime) => {
    if (!refs.experiencePanel || state.experience?.type !== "mindmap") {
      stopMindMapOrbitAnimation();
      return;
    }

    const activeStages = stages.filter((stage) => document.body.contains(stage));
    if (!activeStages.length) {
      stopMindMapOrbitAnimation();
      return;
    }

    if (lastFrameTime === null) {
      lastFrameTime = frameTime;
    }

    const deltaSeconds = Math.min(0.05, Math.max(0, (frameTime - lastFrameTime) / 1000));
    lastFrameTime = frameTime;

    const isPaused = activeStages.some((stage) => stage.matches(":hover") || stage.dataset.orbitPaused === "true");
    if (!isPaused) {
      orbitTime += deltaSeconds;
    }

    activeStages.forEach((stage) => {
      const centerX = Number(stage.dataset.centerX) || stage.offsetWidth / 2;
      const centerY = Number(stage.dataset.centerY) || stage.offsetHeight / 2;
      const nodes = stage.querySelectorAll("[data-mindmap-orbit-entry]");

      nodes.forEach((node) => {
        const radius = Number(node.dataset.orbitRadius) || 0;
        const phase = Number(node.dataset.orbitPhase) || 0;
        const speed = Number(node.dataset.orbitSpeed) || 0;
        const angle = phase + orbitTime * speed;

        node.style.left = `${Math.round(centerX + Math.cos(angle) * radius)}px`;
        node.style.top = `${Math.round(centerY + Math.sin(angle) * radius)}px`;
      });
    });

    mindMapOrbitAnimationId = window.requestAnimationFrame(animate);
  };

  mindMapOrbitAnimationId = window.requestAnimationFrame(animate);
}

function navigateMindMapGallery(direction) {
  if (!refs.experiencePanel || state.experience?.type !== "mindmap") {
    return;
  }

  const viewport = refs.experiencePanel.querySelector("[data-mindmap-gallery-viewport]");
  const slides = [...refs.experiencePanel.querySelectorAll("[data-mindmap-gallery-slide]")];
  if (!viewport || slides.length < 2) {
    return;
  }

  const viewportCenter = viewport.scrollLeft + viewport.clientWidth / 2;
  const currentIndex = slides.reduce((nearestIndex, slide, slideIndex) => {
    const slideCenter = slide.offsetLeft + slide.offsetWidth / 2;
    const nearestSlide = slides[nearestIndex];
    const nearestCenter = nearestSlide.offsetLeft + nearestSlide.offsetWidth / 2;
    return Math.abs(slideCenter - viewportCenter) < Math.abs(nearestCenter - viewportCenter)
      ? slideIndex
      : nearestIndex;
  }, 0);
  const step = direction === "previous" ? -1 : 1;
  const targetIndex = (currentIndex + step + slides.length) % slides.length;

  slides[targetIndex].scrollIntoView({
    behavior: "smooth",
    block: "nearest",
    inline: "center"
  });
}

function handleMindMapGalleryWheel(event) {
  if (state.experience?.type !== "mindmap") {
    return;
  }

  const viewport = event.target.closest?.("[data-mindmap-gallery-viewport]");
  if (!viewport || viewport.querySelectorAll("[data-mindmap-gallery-slide]").length < 2) {
    return;
  }

  const delta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
  if (!delta) {
    return;
  }

  event.preventDefault();
  viewport.scrollBy({ left: delta * 1.2, behavior: "auto" });
}

function replaceMarkup(target, markup) {
  return appDomService.replaceWithMarkup(target, markup, document);
}

function refreshRunTimerDisplay(experience) {
  if (!refs.experiencePanel || !experience || experience.type !== "run") {
    return false;
  }

  const timerCard = refs.experiencePanel.querySelector(".run-inline-footer .compact-race-timer-card.run");
  if (!timerCard) {
    return false;
  }

  const timerClass = getTimerVisualState(experience.timeRemaining, GAME_CONFIG.runTotalTime, {
    warningAt: 80,
    dangerAt: 35
  });

  return Boolean(replaceMarkup(
    timerCard,
    renderCompactRaceTimerCard("Time Left", experience.timeRemaining, GAME_CONFIG.runTotalTime, timerClass, "run")
  ));
}

function keepRouteBuilderInView() {
  window.requestAnimationFrame(() => {
    if (refs.routeBuilder) {
      refs.routeBuilder.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  });
}

function hasActiveQuestionPopup() {
  if (state.ui.appEntryGateOpen) {
    return true;
  }

  if (state.ui.resourcesOpen) {
    return true;
  }

  if (state.ui.cooperationOpen) {
    return true;
  }

  if (state.ui.authOpen) {
    return true;
  }

  if (state.ui.rawMediaLightbox) {
    return true;
  }

  const experience = state.experience;
  if (!experience || experience.finished) {
    return false;
  }

  if (experience.type === "jeopardy") {
    if (state.ui.appShellMode === "online" && !experience.started) {
      return false;
    }
    return !experience.started || Boolean(experience.active);
  }

  if (experience.type === "relay") {
    return Boolean(experience.started);
  }

  if (experience.type === "buildcase") {
    return experience.phase === "topic";
  }

  if (experience.type === "mindmap") {
    return Boolean(experience.activeEntryKey || experience.activeGuideSectionId);
  }

  if (experience.type === "race") {
    return Boolean(experience.started);
  }

  if (experience.type === "jump") {
    return experience.phase === "question" || experience.phase === "feedback";
  }

  return false;
}

function syncPopupScrollLock() {
  const shouldLock = appStateService.isPopupBlocking(state, {
    hasActiveQuestionPopup: hasActiveQuestionPopup()
  });
  document.body.classList.toggle("with-popup", shouldLock);
}

function hasSupabaseConfig() {
  return authController.hasSupabaseConfig();
}

function isSignedIn() {
  return authController.isSignedIn();
}

function hasAuthSession() {
  return authController.hasAuthSession();
}

function isAnonymousUser(user) {
  return authController.isAnonymousUser(user);
}

function getCurrentUserEmail() {
  return authController.getCurrentUserEmail();
}

function canAccessCampusPreview() {
  return Boolean(CAMPUS_PREVIEW_PUBLIC_ENABLED);
}

function canAccessLegacyLiveRooms() {
  if (!LEGACY_LIVE_ROOMS_PUBLIC_ENABLED) {
    return false;
  }

  const email = getCurrentUserEmail();
  const domain = email.includes("@") ? email.split("@").pop() : "";
  return Boolean(MULTIPLAYER_ALLOWED_EMAILS.has(email) || MULTIPLAYER_ALLOWED_EMAIL_DOMAINS.has(domain));
}

function getLegacyLiveRoomsDisabledMessage() {
  return LEGACY_LIVE_ROOMS_PUBLIC_ENABLED
    ? "Legacy live game rooms are limited to approved internal test accounts."
    : "Legacy live game rooms are disabled in this public build until the Supabase RPC/RLS path is reviewed.";
}

function canAccessMultiplayer() {
  return canAccessLegacyLiveRooms();
}

function canDismissAuthModal() {
  return authController.canDismissAuthModal();
}

function syncAuthChrome() {
  renderSessionControls();
  renderAppEntryGate();
  renderAuthModal();
  if (state.experience?.type === "jeopardy") {
    renderExperience();
  }
  syncPopupScrollLock();
}

function clearAuthNotice() {
  authController.clearNotice();
}

function normalizeAlpacaName(value) {
  return authController.normalizeAlpacaName(value);
}

function getCurrentRedirectUrl() {
  return authController.getCurrentRedirectUrl();
}

function getSupabaseClient() {
  return authController.getSupabaseClient();
}

function setupSupabaseAuth() {
  authController.setupSupabaseAuth();
}

async function loadAlpacaProfile() {
  await authController.loadProfile();
}

async function loadAlpacaProgress() {
  await authController.loadProgress();
}

async function submitAuthForm(form) {
  await authController.submitForm(form);
}

async function createAlpaccount(formData, client) {
  await authController.createAccount(formData, client);
}

async function resolveLoginIdentifier(identifier, client) {
  return authController.resolveLoginIdentifier(identifier, client);
}

async function connectToAlpaccount(formData, client) {
  await authController.connect(formData, client);
}

async function sendPasswordReset(formData, client) {
  await authController.sendPasswordReset(formData, client);
}

async function updateRecoveredPassword(formData, client) {
  await authController.updateRecoveredPassword(formData, client);
}

async function signOutOfAlpaccount() {
  await authController.signOut();
}

async function ensureLiveAuthSession() {
  return authController.ensureLiveAuthSession();
}

function getLiveDisplayName() {
  if (state.auth.profile?.alpaca_name && !isAnonymousUser()) {
    return state.auth.profile.alpaca_name;
  }
  return state.live.guestName || "Guest";
}

function renderAuthModal() {
  if (!refs.authModalMount) {
    return;
  }

  appDomService.setHtml(refs.authModalMount, authModalRenderer.renderModal(getAuthRenderContext(), { escapeHtml }));
  syncActiveModalFocus();
}

function renderAuthGate() {
  return authModalRenderer.renderGate(getAuthRenderContext(), { escapeHtml });
}

function renderAuthIntro(mode, signedIn) {
  return authModalRenderer.renderIntro({
    ...getAuthRenderContext(),
    mode,
    signedIn
  });
}

function getAccountAlpacaName() {
  const profileName = state.auth.profile && state.auth.profile.alpaca_name;
  return profileName ? String(profileName).trim() : "Alpaca";
}

function getThemedTeamLabel(index) {
  const name = getAccountAlpacaName();
  const labels = [
    `Team ${name}`,
    `anti-${name}`,
    `Dark ${name}`,
    `Not ${name}`
  ];

  return labels[index] || `Team ${index + 1}`;
}

function renderAuthNotice() {
  return authModalRenderer.renderNotice(getAuthRenderContext(), { escapeHtml });
}

function renderAuthBody(mode, busy) {
  return authModalRenderer.renderBody({
    ...getAuthRenderContext(),
    mode,
    busy
  }, { escapeHtml });
}

function renderConnectedAlpaccount(busy) {
  return authModalRenderer.renderConnectedAlpaccount({
    ...getAuthRenderContext(),
    busy
  }, { escapeHtml });
}

function renderLoginForm(busy) {
  return authModalRenderer.renderLoginForm({ ...getAuthRenderContext(), busy });
}

function renderSignupForm(busy) {
  return authModalRenderer.renderSignupForm({ ...getAuthRenderContext(), busy }, { escapeHtml });
}

function renderForgotPasswordForm(busy) {
  return authModalRenderer.renderForgotPasswordForm({ ...getAuthRenderContext(), busy });
}

function renderResetPasswordForm(busy) {
  return authModalRenderer.renderResetPasswordForm({ ...getAuthRenderContext(), busy });
}

function getAuthRenderContext() {
  return {
    isOpen: state.ui.authOpen,
    mode: state.ui.authMode || "login",
    signedIn: isSignedIn(),
    busy: state.auth.status === "checking" || state.auth.status === "submitting",
    status: state.auth.status,
    error: state.auth.error,
    message: state.auth.message,
    profile: state.auth.profile,
    roundOptions: WSC_ROUND_OPTIONS,
    canDismiss: canDismissAuthModal()
  };
}

function renderResourcesModal() {
  if (!refs.resourcesModalMount) {
    return;
  }

  appDomService.setHtml(refs.resourcesModalMount, state.ui.resourcesOpen ? `
    <div class="auth-modal-overlay" data-close-resources role="dialog" aria-modal="true" aria-label="Route resources">
      <div class="auth-modal-window resources-modal-window" data-resources-window>
        <button class="popup-close-button" type="button" data-close-resources aria-label="Close route resources">
          <span aria-hidden="true">×</span>
        </button>
        <div class="auth-modal-stack resources-modal-stack">
          <div class="resources-modal-hero" aria-hidden="true">
            <img src="./assets/footer/link-icon.png?v=${ASSET_CACHE_VERSION}" alt="" />
          </div>
          <div class="resource-link-list">
            ${RESOURCE_LINKS.map((item) => `
              <a class="resource-link-item" href="${escapeHtml(item.url)}" target="_blank" rel="noreferrer">
                <span class="resource-link-label">${escapeHtml(item.label)}</span>
                <span class="resource-link-url">${escapeHtml(item.url)}</span>
              </a>
            `).join("")}
          </div>
          <div class="panel-actions">
            <button class="button primary" type="button" data-close-resources>Close</button>
          </div>
        </div>
      </div>
    </div>
  ` : "");
  syncActiveModalFocus();
}

function renderCooperationModal() {
  if (!refs.cooperationModalMount) {
    return;
  }

  appDomService.setHtml(refs.cooperationModalMount, state.ui.cooperationOpen ? `
    <div class="auth-modal-overlay cooperation-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="cooperationModalTitle">
      <div class="auth-modal-window cooperation-modal-window">
        <button class="popup-close-button" type="button" data-close-cooperation aria-label="Close call to cooperation">
          <span aria-hidden="true">×</span>
        </button>
        <div class="auth-modal-stack cooperation-modal-stack">
          <h3 id="cooperationModalTitle">Call to cooperation</h3>
          <div class="cooperation-copy">
            <p>
              Since we released the app a little over a month ago, more than <strong>850 people</strong> from over <strong>35 countries</strong> have visited it.
              Many alpacas have contacted us with suggestions, corrections, and ideas for improvement. We have also heard from people who wanted to build similar tools or create their own WSC resources.
            </p>

            <p>
              That is exactly the spirit we want to encourage.
            </p>

            <p>
              We want Alpacapp to become a useful space for everyone: a place where alpacas can train, learn while having fun, share resources, and stay connected beyond their own school club.
            </p>

            <p>
              Our ultimate goal is for this app to become <strong>one central place</strong> for everything connected to WSC: useful information, guides, mocks, contests, questions, events, weekly challenges, forums, and anything else the community can imagine.
            </p>

            <p>
              WSC should not only be something we think about during ASA, during our school club, or one month before a round. When we started preparing, we had to join more than eight Discord servers, find documents scattered around the internet, and answer Google Forms pretending to be Scholar’s Challenge rounds.
            </p>

            <p class="big-question">
              Why not bring everything together in <strong>ONE PLACE</strong>?
            </p>

            <p>
              We encourage everyone to create their own resources and share them with the community. But we also believe those resources should be easier to find, easier to use, and easier to improve together.
            </p>

            <p class="promise">
              <strong>Our promise is to always keep this app free. We do not want it to become a business, and we do not want to make money from it. We simply want to help WSC reach as many alpacas as possible.</strong>
            </p>

            <div class="community-call">
              <p><strong>Cornucopia</strong>, let us use your incredible guides and questionnaires!</p>
              <p><strong>Ignition</strong> and <strong>Kumqwatt</strong>, use the app to organize events!</p>
              <p><strong>Pwaa Pwaa Revolution</strong>, come improve the app with your IT skills!</p>
              <p><strong>Beijing Alpacas</strong>, <strong>Pwaaparation</strong>, <strong>Pwaprep</strong>, <strong>Pwapwa Revolution</strong>: share your knowledge here!</p>
            </div>

            <p class="final-call">
              <strong>Join the team.</strong>
            </p>
          </div>
          <div class="panel-actions cooperation-actions">
            <a class="cooperation-action-card" href="${escapeHtml(DISCORD_INVITE_URL)}" target="_blank" rel="noopener noreferrer" aria-label="Join on discord">
              <img src="./assets/mascot/library/final-pack/Discordlogo.png?v=${ASSET_CACHE_VERSION}" alt="" aria-hidden="true" />
              <strong>Join on discord</strong>
            </a>
            <a class="cooperation-action-card" href="${escapeHtml(CONTACT_EMAIL_URL)}" aria-label="Send an email">
              <img src="./assets/footer/contact-icon.png?v=${ASSET_CACHE_VERSION}" alt="" aria-hidden="true" />
              <strong>Send an email</strong>
            </a>
          </div>
        </div>
      </div>
    </div>
  ` : "");
  syncActiveModalFocus();
}

function buildSlideshowExperience() {
  return {
    type: "slideshow",
    title: getTargetLabel(),
    deck: buildLearnDeck(),
    index: 0
  };
}

function buildMindMapExperience() {
  const selectedSectionIds = getSelectedSectionIds();
  const entries = getRawEntriesForSelection();
  let offset = 0;
  const maps = selectedSectionIds.length
    ? selectedSectionIds.map((sectionId) => {
        const sectionEntries = getRawEntriesForRouteSelection("section", sectionId);
        const map = buildMindMap(sectionId, sectionEntries, offset);
        offset += sectionEntries.length;
        return map;
      })
    : [buildMindMap(null, entries, 0)];

  return {
    type: "mindmap",
    title: "Idea Map",
    map: maps[0],
    maps,
    activeEntryKey: null,
    activeGuideSectionId: null
  };
}

function buildRawContentExperience() {
  return rawContentMode?.buildExperience
    ? rawContentMode.buildExperience(getKnowledgeContext())
    : {
        type: "rawcontent",
        title: "Raw Content",
        section: getKnowledgeContext()
      };
}

function buildUnavailableModeExperience(modeId) {
  const option = getModeOption(modeId) || { id: modeId, title: "Available soon", mood: "thinking" };
  return {
    type: "unavailable",
    modeId,
    title: option.title,
    mood: option.mood || "thinking",
    reason: getModeUnavailableReason(modeId) || "This section is available soon."
  };
}

function renderUnavailableModeExperience() {
  const experience = state.experience || {};
  return `
    ${renderPanelTitle(experience.title || "Available soon", null, "", { showReplay: false })}
    <div class="mode-shell">
      <article class="setup-card">
        <div class="setup-card-header">
          ${renderConfiguredMascotAsset(getModeAssetPath(experience.modeId), experience.mood || "thinking", "medium", {
            alt: `${experience.title || "Available soon"} alpaca`,
            slotClass: "mascot-slot mascot-slot-medium",
            imageClass: "mascot-asset mascot-asset-medium"
          })}
          <div>
            <p class="challenge-label">Available soon</p>
            <h3>${escapeHtml(experience.reason || "This section is available soon.")}</h3>
          </div>
        </div>
      </article>
    </div>
  `;
}

function buildAlpacaChannelExperience() {
  const videos = buildAlpacaChannelPlaylist();

  return alpacaChannelMode?.buildExperience
    ? alpacaChannelMode.buildExperience(videos, getTargetLabel())
    : {
        type: "channel",
        title: "Alpaca Channel",
        routeTitle: getTargetLabel(),
        videos,
        index: 0
      };
}

function getApprovedRawContentSection(targetId = state.selection.targetId) {
  if (rawContentService?.getApprovedSection) {
    return rawContentService.getApprovedSection(targetId);
  }

  if (!targetId || targetId === "all") {
    return null;
  }

  if (IMPORTED_RAW_CONTENT_BANK[targetId]) {
    return IMPORTED_RAW_CONTENT_BANK[targetId];
  }

  const selectedSection = sectionById[targetId];
  if (!selectedSection) {
    return null;
  }

  const normalizedTarget = normalizeKnowledgeKey(selectedSection.originalTitle);
  return Object.values(IMPORTED_RAW_CONTENT_BANK).find((section) => {
    return normalizeKnowledgeKey(section.guidingSection || section.title) === normalizedTarget;
  }) || null;
}

function getBroadSubjectIdsFromLabels(labels = []) {
  const ids = new Set();

  labels.forEach((label) => {
    const normalized = normalizeKnowledgeKey(label);

    if (normalized === "special area") {
      ids.add("special-area");
      return;
    }

    if (normalized.includes("history")) {
      ids.add("history");
      return;
    }

    if (normalized === "social studies") {
      ids.add("social-studies");
      return;
    }

    if (
      normalized.includes("geography") ||
      normalized.includes("sociology") ||
      normalized.includes("politics") ||
      normalized.includes("government") ||
      normalized.includes("economics") ||
      normalized.includes("trade") ||
      normalized.includes("migration") ||
      normalized.includes("tourism") ||
      normalized.includes("architecture") ||
      normalized.includes("urbanism")
    ) {
      ids.add("social-studies");
      return;
    }

    if (normalized === "science and tech" || normalized === "science tech") {
      ids.add("science-technology");
      return;
    }

    if (
      normalized.includes("computer science") ||
      normalized.includes("technology") ||
      normalized.includes("tech") ||
      normalized.includes("biology") ||
      normalized.includes("physics") ||
      normalized.includes("environmental science")
    ) {
      ids.add("science-technology");
      return;
    }

    if (normalized === "art and music" || normalized === "art music") {
      ids.add("art-music");
      return;
    }

    if (
      normalized.includes("visual arts") ||
      normalized.includes("performing arts") ||
      normalized.includes("music") ||
      normalized.includes("theatre")
    ) {
      ids.add("art-music");
      return;
    }

    if (normalized === "lit and media" || normalized === "lit media") {
      ids.add("literature-media");
      return;
    }

    if (
      normalized.includes("literature") ||
      normalized.includes("language") ||
      normalized.includes("media") ||
      normalized.includes("film")
    ) {
      ids.add("literature-media");
      return;
    }

    if (
      normalized.includes("psychology") ||
      normalized.includes("philosophy")
    ) {
      ids.add("special-area");
      return;
    }
  });

  return Array.from(ids);
}

function getQuestionSubjectLabels(question) {
  if (question && Array.isArray(question.subjectLabels) && question.subjectLabels.length) {
    return question.subjectLabels;
  }

  if (question && Array.isArray(question.subjectIds) && question.subjectIds.length) {
    return question.subjectIds
      .map((subjectId) => subjectById[subjectId])
      .filter(Boolean)
      .map((subject) => subject.label);
  }

  return [];
}

function getBigIdeaIdsFromLabels(labels = []) {
  return labels
    .map((label) => findBigIdeaRouteIdByLabel(label))
    .filter(Boolean);
}

function renderQuestionSubjectPills(question) {
  return getQuestionSubjectLabels(question).map((label) => `
    <span class="meta-pill subject">${escapeHtml(label)}</span>
  `).join("");
}

function getQuestionVisibleWrongExplanationByAnswer(question, answerText) {
  const selectedKey = normalizeKnowledgeKey(answerText);
  return (question.visibleWrongExplanations || []).find((item) => (
    normalizeKnowledgeKey(item.answer) === selectedKey ||
    normalizeKnowledgeKey(item.text) === selectedKey
  ))?.explanation || "";
}

function buildGameQuestionOptions(rawQuestion) {
  const correctAnswer = rawQuestion.correctAnswer;
  const options = shuffle([correctAnswer, ...(rawQuestion.wrongAnswers || [])]);
  const answerIndex = options.indexOf(correctAnswer);
  const correctFeedback = rawQuestion.visibleCorrectExplanation || rawQuestion.explanation || "";

  return {
    options,
    answerIndex,
    optionFeedback: options.map((option, index) => (
      index === answerIndex
        ? correctFeedback
        : getQuestionVisibleWrongExplanationByAnswer(rawQuestion, option)
    ))
  };
}

function createRawGameQuestion(entry, rawQuestion, entryIndex, questionIndex) {
  const optionPayload = buildGameQuestionOptions(rawQuestion);
  const subjectLabels = Array.isArray(entry.subjects) ? entry.subjects.slice() : [];
  const bigIdeaLabels = Array.isArray(entry.bigIdeas) ? entry.bigIdeas.slice() : [];
  const sectionId = entry.sectionId || getSectionIdFromGuidingTitle(entry.guidingSection || entry.sectionTitle);

  return {
    id: rawQuestion.id || `${sectionId || "raw"}-${slugifyBigIdea(entry.title || `entry-${entryIndex}`)}-level-${rawQuestion.level}-${questionIndex + 1}`,
    prompt: rawQuestion.prompt,
    options: optionPayload.options,
    answerIndex: optionPayload.answerIndex,
    optionFeedback: optionPayload.optionFeedback,
    explanation: rawQuestion.explanation || entry.studentExplanation || entry.whyItMatters || entry.takeaway || "",
    visibleCorrectExplanation: rawQuestion.visibleCorrectExplanation || rawQuestion.explanation || "",
    visibleConnection: rawQuestion.visibleConnection || "",
    visibleTakeaway: rawQuestion.visibleTakeaway || "",
    sectionId,
    sectionIds: [sectionId].filter(Boolean),
    subjectIds: getBroadSubjectIdsFromLabels(subjectLabels),
    subjectLabels,
    bigIdeaIds: getBigIdeaIdsFromLabels(bigIdeaLabels),
    bigIdeaLabels,
    sourceSubtopic: entry.title,
    sourceType: "point",
    anchors: [entry.takeaway].filter(Boolean),
    cueMood: rawQuestion.level >= 4 ? "determined" : "thinking",
    rawLevel: Number(rawQuestion.level),
    displayLevel: rawQuestion.displayLevel || Number(rawQuestion.level) * 100,
    entryTitle: entry.title,
    guidingSection: entry.guidingSection
  };
}

function createGuideGameQuestion(section, guideQuestion, questionIndex) {
  const optionPayload = buildGameQuestionOptions(guideQuestion);
  const sectionId = section.id || getSectionIdFromGuidingTitle(section.guidingSection || section.title);
  const sectionRecord = sectionId ? sectionById[sectionId] : null;
  const sectionTitle = sectionRecord ? sectionRecord.title : section.guidingSection || section.title;

  return {
    id: guideQuestion.id || `${sectionId || "section"}-guide-level-3-${questionIndex + 1}`,
    prompt: guideQuestion.prompt,
    options: optionPayload.options,
    answerIndex: optionPayload.answerIndex,
    optionFeedback: optionPayload.optionFeedback,
    explanation: guideQuestion.explanation || "",
    visibleCorrectExplanation: guideQuestion.visibleCorrectExplanation || guideQuestion.explanation || "",
    visibleConnection: guideQuestion.visibleConnection || "",
    visibleTakeaway: guideQuestion.visibleTakeaway || "",
    sectionId,
    sectionIds: [sectionId].filter(Boolean),
    subjectIds: [],
    subjectLabels: [],
    bigIdeaIds: [],
    bigIdeaLabels: [],
    sourceSubtopic: "Section Guide",
    sourceType: "guide",
    anchors: [guideQuestion.anchorEntry, guideQuestion.targetEntry].filter(Boolean),
    cueMood: "thinking",
    rawLevel: 3,
    displayLevel: guideQuestion.displayLevel || 300,
    entryTitle: guideQuestion.anchorEntry || "Section Guide",
    guidingSection: sectionTitle
  };
}

function createFullVoyageGameQuestion(rawQuestion) {
  const optionPayload = buildGameQuestionOptions(rawQuestion);
  const sectionIds = Array.isArray(rawQuestion.sectionIds) && rawQuestion.sectionIds.length
    ? rawQuestion.sectionIds
    : [rawQuestion.sectionId].filter(Boolean);
  const sectionId = rawQuestion.sectionId || sectionIds[0] || "introductory-questions";
  const sectionRecord = sectionById[sectionId] || null;

  return {
    id: rawQuestion.id,
    prompt: rawQuestion.prompt,
    options: optionPayload.options,
    answerIndex: optionPayload.answerIndex,
    optionFeedback: optionPayload.optionFeedback,
    explanation: rawQuestion.explanation || rawQuestion.visibleConnection || rawQuestion.visibleCorrectExplanation || "",
    visibleCorrectExplanation: rawQuestion.visibleCorrectExplanation || rawQuestion.explanation || "",
    visibleConnection: rawQuestion.visibleConnection || "",
    visibleTakeaway: rawQuestion.visibleTakeaway || "",
    sectionId,
    sectionIds,
    secondarySectionId: rawQuestion.secondarySectionId || null,
    subjectIds: [],
    subjectLabels: [],
    bigIdeaIds: [],
    bigIdeaLabels: [],
    sourceSubtopic: rawQuestion.targetReference || rawQuestion.anchorReference || "Full Voyage",
    sourceType: "full-voyage",
    anchors: [rawQuestion.anchorReference, rawQuestion.targetReference].filter(Boolean),
    cueMood: rawQuestion.level >= 5 ? "determined" : "thinking",
    rawLevel: Number(rawQuestion.level),
    displayLevel: rawQuestion.displayLevel || Number(rawQuestion.level) * 100,
    entryTitle: rawQuestion.targetReference || "Full Voyage",
    guidingSection: sectionRecord?.title || rawQuestion.guidingSectionPrimary || "",
    guidingSectionPrimary: rawQuestion.guidingSectionPrimary || "",
    guidingSectionSecondary: rawQuestion.guidingSectionSecondary || "",
    sourceUrl: rawQuestion.sourceUrl || "",
    sourceNote: rawQuestion.sourceNote || ""
  };
}

function getSectionIdsForEntries(entries) {
  const seen = new Set();
  return (entries || [])
    .map((entry) => entry.sectionId || getSectionIdFromGuidingTitle(entry.guidingSection || entry.sectionTitle))
    .filter(Boolean)
    .filter((sectionId) => {
      if (seen.has(sectionId)) {
        return false;
      }
      seen.add(sectionId);
      return true;
    });
}

function getGuideQuestionsForEntries(entries) {
  const sectionIds = getSectionIdsForEntries(entries);

  return sectionIds.flatMap((sectionId) => {
    const section = IMPORTED_RAW_CONTENT_BANK[sectionId] || getApprovedRawContentSection(sectionId);
    return getSectionGuideQuestions(section).map((question, questionIndex) =>
      createGuideGameQuestion(section, question, questionIndex)
    );
  });
}

function getFullVoyageQuestionsForEntries(entries) {
  const sectionIds = new Set(getSectionIdsForEntries(entries));
  const seen = new Set();
  return fullVoyageQuestions
    .filter((question) => (question.sectionIds || [question.sectionId]).some((sectionId) => sectionIds.has(sectionId)))
    .filter((question) => {
      if (seen.has(question.id)) {
        return false;
      }
      seen.add(question.id);
      return true;
    })
    .map((question) => createFullVoyageGameQuestion(question));
}

function buildRawQuestionPoolsFromEntries(entries) {
  return gameQuestionService.buildPoolsFromEntries(entries, {
    createRawGameQuestion,
    getGuideQuestionsForEntries,
    getFullVoyageQuestionsForEntries
  });
}

function buildRawQuestionPoolsForSelection() {
  return buildRawQuestionPoolsFromEntries(getRawEntriesForSelection());
}

function hasRequiredRawLevels(pools, levels = [1, 2, 3, 4, 5]) {
  return gameQuestionService.hasRequiredLevels(pools, levels);
}

function buildPatternQuestionSequence(pattern, pools, allowReuse = true) {
  return gameQuestionService.buildPatternSequence(pattern, pools, shuffle, allowReuse);
}

function getUnavailableRawGameReason() {
  return gameQuestionService.getUnavailableReason(getTargetLabel());
}

function buildAlpacaRunQuestionPlan(entries = null) {
  const pools = Array.isArray(entries)
    ? buildRawQuestionPoolsFromEntries(entries)
    : buildRawQuestionPoolsForSelection();
  if (!hasRequiredRawLevels(pools)) {
    return { unavailableReason: getUnavailableRawGameReason() };
  }

  const mainPattern = [
    ...Array.from({ length: GAME_CONFIG.runRegionalLevelOneCount }, () => 1),
    ...Array.from({ length: GAME_CONFIG.runRegionalLevelTwoCount }, () => 2),
    ...Array.from({ length: GAME_CONFIG.runGlobalLevelThreeCount }, () => 3),
    ...Array.from({ length: GAME_CONFIG.runGlobalLevelFourCount }, () => 4)
  ];
  const yalePattern = Array.from({ length: GAME_CONFIG.runYaleLevelFiveCount }, () => 5);

  const mainQuestions = buildPatternQuestionSequence(mainPattern, pools, true);
  const yaleQuestions = buildPatternQuestionSequence(yalePattern, pools, true);

  if (mainQuestions.length !== mainPattern.length || yaleQuestions.length !== yalePattern.length) {
    return { unavailableReason: getUnavailableRawGameReason() };
  }

  return {
    mainQuestions,
    yaleQuestions
  };
}

function buildRelayQuestionSequence(questionCount, entries = null) {
  const pools = Array.isArray(entries)
    ? buildRawQuestionPoolsFromEntries(entries)
    : buildRawQuestionPoolsForSelection();
  if (!hasRequiredRawLevels(pools)) {
    return { unavailableReason: getUnavailableRawGameReason(), questions: [] };
  }

  const pattern = Array.from({ length: questionCount }, (_, index) => (index % 5) + 1);
  return {
    unavailableReason: null,
    questions: buildPatternQuestionSequence(pattern, pools, true)
  };
}

function buildJumpQuestionPlan(entries = null) {
  const pools = Array.isArray(entries)
    ? buildRawQuestionPoolsFromEntries(entries)
    : buildRawQuestionPoolsForSelection();
  if (!hasRequiredRawLevels(pools)) {
    return { unavailableReason: getUnavailableRawGameReason(), questions: [] };
  }

  const questionsPerLevel = Math.max(1, Math.ceil(GAME_CONFIG.jumpQuestionCount / 5));
  const pattern = [1, 2, 3, 4, 5]
    .flatMap((level) => Array.from({ length: questionsPerLevel }, () => level))
    .slice(0, GAME_CONFIG.jumpQuestionCount);
  const questions = buildPatternQuestionSequence(pattern, pools, true);

  return {
    unavailableReason: questions.length === pattern.length ? null : getUnavailableRawGameReason(),
    questions
  };
}

function buildRaceLevelQueues(entries = null) {
  const pools = Array.isArray(entries)
    ? buildRawQuestionPoolsFromEntries(entries)
    : buildRawQuestionPoolsForSelection();
  if (!hasRequiredRawLevels(pools)) {
    return { unavailableReason: getUnavailableRawGameReason(), levels: [] };
  }

  const levels = [1, 2, 3, 4, 5].map((level) => {
    const questions = shuffle((pools[level] || []).slice());
    return {
      level,
      questions,
      pendingIds: new Set(questions.map((question) => question.id)),
      cycleQueue: questions.slice(),
      cycleIndex: 0
    };
  });

  return {
    unavailableReason: null,
    levels
  };
}

function getRaceActiveLevelState(experience) {
  return experience.levels[experience.currentLevelIndex] || null;
}

function getCurrentRaceQuestion(experience) {
  const levelState = getRaceActiveLevelState(experience);
  if (!levelState || !levelState.cycleQueue.length) {
    return null;
  }

  return levelState.cycleQueue[levelState.cycleIndex] || levelState.cycleQueue[0] || null;
}

function queueNextRaceQuestion(experience) {
  let movedToNewLevel = false;

  while (experience.currentLevelIndex < experience.levels.length) {
    const levelState = experience.levels[experience.currentLevelIndex];
    if (!levelState.questions.length) {
      experience.currentLevelIndex += 1;
      movedToNewLevel = true;
      continue;
    }

    if (levelState.pendingIds.size === 0) {
      experience.currentLevelIndex += 1;
      movedToNewLevel = true;
      continue;
    }

    if (movedToNewLevel || !experience.currentQuestion) {
      levelState.cycleQueue = shuffle(levelState.questions.filter((question) => levelState.pendingIds.has(question.id)));
      levelState.cycleIndex = 0;
    } else if (levelState.cycleIndex >= levelState.cycleQueue.length - 1) {
      levelState.cycleQueue = shuffle(levelState.questions.filter((question) => levelState.pendingIds.has(question.id)));
      levelState.cycleIndex = 0;
    } else {
      levelState.cycleIndex += 1;
    }

    experience.currentQuestion = getCurrentRaceQuestion(experience);
    return Boolean(experience.currentQuestion);
  }

  experience.currentQuestion = null;
  return false;
}

function buildRaceExperience() {
  return {
    type: "race",
    title: "Survivalpaca",
    levels: [],
    totalQuestions: 0,
    availableQuestionCount: 0,
    setupCategoryIds: getDefaultTargetSetupCategoryIds(),
    currentLevelIndex: 0,
    currentQuestion: null,
    started: false,
    index: 0,
    score: 0,
    streak: 0,
    bestStreak: 0,
    lives: GAME_CONFIG.raceLives,
    timeRemaining: GAME_CONFIG.raceQuestionTime,
    questionTime: GAME_CONFIG.raceQuestionTime,
    timeouts: 0,
    elapsedTime: 0,
    revealed: false,
    lastCorrect: null,
    lastTimedOut: false,
    answers: [],
    failed: false,
    finished: false,
    unavailableReason: null
  };
}

function buildJeopardyExperience() {
  const teamCount = GAME_CONFIG.jeopardyDefaultTeams;
  return {
    type: "jeopardy",
    title: "Alpacapardy",
    playMode: "solo",
    board: [],
    active: null,
    teams: createJeopardyTeams(teamCount),
    activeTeamIndex: 0,
    started: false,
    setupTeamCount: teamCount,
    setupCategoryIds: getDefaultJeopardySetupCategoryIds(),
    answers: [],
    chat: [],
    finished: false
  };
}

function buildRunExperience() {
  return {
    type: "run",
    title: "Alpaca Run",
    route: ALPACA_RUN_ROUTE,
    mainQuestions: [],
    yaleQuestions: [],
    stage: 0,
    yaleProgress: 0,
    currentQuestion: null,
    started: false,
    setupCategoryIds: getDefaultTargetSetupCategoryIds(),
    timeRemaining: GAME_CONFIG.runTotalTime,
    correctCount: 0,
    answeredCount: 0,
    revealed: false,
    lastCorrect: null,
    pendingStage: null,
    pendingYaleProgress: null,
    failed: false,
    answers: [],
    finished: false,
    unavailableReason: null
  };
}

function createJumpObstacle(cursor = 0) {
  return {
    kind: JUMP_OBSTACLE_PATTERN[cursor % JUMP_OBSTACLE_PATTERN.length],
    x: 106,
    passed: false
  };
}

function createJumpCheckpointObstacle() {
  return {
    kind: "checkpoint",
    x: 106,
    passed: false
  };
}

function buildJumpExperience() {
  return {
    type: "jump",
    title: "Alpaca Jump",
    questions: [],
    index: 0,
    currentQuestion: null,
    phase: "setup",
    started: false,
    setupCategoryIds: getDefaultTargetSetupCategoryIds(),
    lives: GAME_CONFIG.jumpLives,
    score: 0,
    distance: 0,
    runnerY: 0,
    runnerVelocity: 0,
    ducking: false,
    obstacleCursor: 0,
    obstaclesCleared: 0,
    obstacle: createJumpObstacle(0),
    runnerState: "running",
    lastFrameAt: null,
    selectedIndex: null,
    lastCorrect: null,
    answers: [],
    failed: false,
    finished: false,
    unavailableReason: null
  };
}

function buildRelayExperience() {
  return {
    type: "relay",
    title: "Alpaquiz",
    questions: [],
    index: 0,
    teams: createRelayTeams(),
    started: false,
    setupCategoryIds: getDefaultTargetSetupCategoryIds(),
    setupQuestionCount: GAME_CONFIG.relayDefaultQuestionCount,
    buzzedTeamIndex: null,
    answerTimeRemaining: GAME_CONFIG.relayAnswerTime,
    revealed: false,
    lastCorrect: null,
    lastTimedOut: false,
    lastAwardedTeamLabels: [],
    selectedIndex: null,
    answers: [],
    finished: false,
    unavailableReason: null
  };
}

function splitArgumentFragments(...texts) {
  const fragments = [];

  texts.forEach((text) => {
    if (!text) {
      return;
    }

    String(text)
      .replace(/\s+/g, " ")
      .split(/(?<=[.!?])\s+/)
      .map((fragment) => fragment.trim())
      .filter(Boolean)
      .forEach((fragment) => {
        const normalized = fragment.replace(/^[-*]\s*/, "").trim();
        if (!normalized) {
          return;
        }

        const shortened = normalized.length > 168
          ? `${normalized.slice(0, 165).trimEnd()}...`
          : normalized;

        if (!fragments.includes(shortened)) {
          fragments.push(shortened);
        }
      });
  });

  return fragments;
}

function buildChoiceSet(correctTexts, distractorTexts, fallbackCorrect, fallbackDistractor, correctCount = 2, totalOptions = 4) {
  const correct = splitArgumentFragments(...correctTexts).slice(0, correctCount);
  const distractors = splitArgumentFragments(...distractorTexts)
    .filter((text) => !correct.includes(text))
    .slice(0, Math.max(0, totalOptions - correctCount));

  while (correct.length < correctCount) {
    const fallback = fallbackCorrect[correct.length] || fallbackCorrect[fallbackCorrect.length - 1];
    if (fallback && !correct.includes(fallback)) {
      correct.push(fallback);
    } else {
      break;
    }
  }

  while (distractors.length < Math.max(0, totalOptions - correctCount)) {
    const fallback = fallbackDistractor[distractors.length] || fallbackDistractor[fallbackDistractor.length - 1];
    if (fallback && !correct.includes(fallback) && !distractors.includes(fallback)) {
      distractors.push(fallback);
    } else {
      break;
    }
  }

  return shuffle([
    ...correct.map((text) => ({ text, correct: true })),
    ...distractors.map((text) => ({ text, correct: false }))
  ]).slice(0, totalOptions);
}

function buildSingleChoiceSet(correctText, distractorTexts, fallbackCorrect, fallbackDistractor, totalOptions = 3) {
  const correct = splitArgumentFragments(correctText)[0] || fallbackCorrect;
  const distractors = splitArgumentFragments(...distractorTexts)
    .filter((text) => text !== correct)
    .slice(0, Math.max(0, totalOptions - 1));

  while (distractors.length < Math.max(0, totalOptions - 1)) {
    const fallback = fallbackDistractor[distractors.length] || fallbackDistractor[fallbackDistractor.length - 1];
    if (fallback && fallback !== correct && !distractors.includes(fallback)) {
      distractors.push(fallback);
    } else {
      break;
    }
  }

  return shuffle([
    { text: correct, correct: true },
    ...distractors.map((text) => ({ text, correct: false }))
  ]).slice(0, totalOptions);
}

function buildBuildCasePrompt(entry) {
  const officialQuestion = splitArgumentFragments(entry.rawOfficialText)
    .find((fragment) => fragment.includes("?"));

  if (officialQuestion) {
    return officialQuestion;
  }

  return `Build a case around this stop: ${entry.title}.`;
}

function buildBuildCaseRounds() {
  const entries = shuffle(
    getRawEntriesForSelection().filter((entry) => entry.debateRelevance && entry.counterargument)
  ).slice(0, GAME_CONFIG.buildCaseRoundCount);

  if (!entries.length) {
    return {
      unavailableReason: `This route does not yet have enough debate-ready raw content for ${getTargetLabel()}.`,
      rounds: []
    };
  }

  const rounds = entries.map((entry, index) => {
    const proFallbacks = [
      "The strongest support should show why this point matters for the theme as a whole.",
      "A good case should connect the stop to a wider question, not just repeat the title."
    ];
    const conFallbacks = [
      "The strongest objection should point to trade-offs, limits, or missing context.",
      "A good counter-case should show why the claim sounds too absolute or incomplete."
    ];

    const proSupports = buildChoiceSet(
      [entry.debateRelevance, entry.whyItMatters, entry.takeaway, entry.studentExplanation],
      [entry.counterargument],
      proFallbacks,
      [
        "It matters only because the example is famous.",
        "It proves the issue has the same answer in every context."
      ]
    );

    const conSupports = buildChoiceSet(
      [entry.counterargument],
      [entry.debateRelevance, entry.whyItMatters, entry.takeaway],
      conFallbacks,
      [
        "It clearly solves the whole issue with no trade-offs at all.",
        "The example should be accepted without asking any harder question."
      ]
    );

    const proRebuttals = buildSingleChoiceSet(
      entry.debateRelevance || entry.whyItMatters || entry.takeaway,
      [entry.counterargument],
      "The better rebuttal is to show why the point still matters even after the objection is raised.",
      [
        "The best reply is simply to repeat the other side's concern.",
        "The best reply is to claim there are never any trade-offs."
      ]
    );

    const conRebuttals = buildSingleChoiceSet(
      entry.counterargument,
      [entry.debateRelevance, entry.whyItMatters, entry.takeaway],
      "The better rebuttal is to insist on limits, context, and unintended consequences.",
      [
        "The best reply is to pretend the objection disappeared on its own.",
        "The best reply is to say the point is always right because it sounds inspiring."
      ]
    );

    return {
      id: `buildcase-${index + 1}-${slugifyBigIdea(entry.title || `entry-${index + 1}`)}`,
      title: entry.title,
      prompt: buildBuildCasePrompt(entry),
      sectionId: entry.sectionId || getSectionIdFromGuidingTitle(entry.guidingSection || entry.sectionTitle),
      sectionLabel: entry.sectionTitle || entry.guidingSection || getTargetLabel(),
      subjectLabels: Array.isArray(entry.subjects) ? entry.subjects.slice() : [],
      entry,
      proSupports,
      conSupports,
      proOpponentResponse: entry.counterargument,
      conOpponentResponse: entry.debateRelevance || entry.whyItMatters || entry.takeaway || entry.studentExplanation,
      proRebuttals,
      conRebuttals
    };
  });

  return {
    unavailableReason: null,
    rounds
  };
}

function getDebateLabTopicsForSelection() {
  const allTopics = Array.isArray(debateLabData.topics) ? debateLabData.topics : [];
  const selectedIds = getSelectedSectionIds();

  if (!selectedIds.length || selectedIds.length === getOrderedSectionIds().length) {
    return allTopics.slice();
  }

  const selected = new Set(selectedIds);
  const filtered = allTopics.filter((topic) => selected.has(topic.sectionId));
  return filtered.length ? filtered : allTopics.slice();
}

function buildDebateTopicOrder(topics, previousTopicId = null) {
  const order = shuffle(topics.map((topic) => topic.id));
  if (order.length > 1 && previousTopicId && order[0] === previousTopicId) {
    const swapIndex = order.findIndex((id) => id !== previousTopicId);
    if (swapIndex > 0) {
      [order[0], order[swapIndex]] = [order[swapIndex], order[0]];
    }
  }
  return order;
}

function buildBuildCaseExperience() {
  const topics = getDebateLabTopicsForSelection();
  const unavailableReason = topics.length
    ? null
    : "The Debate Lab workbook did not load any motions yet.";

  return {
    type: "buildcase",
    title: "Debate Lab",
    topics,
    topicOrder: buildDebateTopicOrder(topics),
    index: 0,
    phase: "topic",
    selectedSide: null,
    spinStatus: "idle",
    spinOutcome: null,
    spinTargetAngle: 0,
    debateRound: 0,
    debateRounds: [],
    winner: null,
    feedback: null,
    finished: false,
    tipDismissed: false,
    unavailableReason
  };
}

function closeTrainTip() {
  if (!state.experience) {
    return;
  }
  state.experience.tipDismissed = true;
  renderExperience();
}

function renderTrainTipSummary(modeId) {
  const tip = TRAIN_TIPS[modeId];
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

function renderTrainTipPopup(modeId) {
  const tip = TRAIN_TIPS[modeId];
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
            ${renderTrainTipSummary(modeId)}
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
    .map((sectionId) => sectionById[sectionId])
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
    const format = WRITING_PRACTICE_FORMATS[index % WRITING_PRACTICE_FORMATS.length];
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

function nextWritingPrompt() {
  const experience = state.experience;
  if (!experience || experience.type !== "writing" || !experience.prompts.length) {
    return;
  }
  experience.promptIndex = (experience.promptIndex + 1) % experience.prompts.length;
  renderExperiencePreservingScroll();
}

function setWritingPhase(phaseId) {
  const experience = state.experience;
  if (!experience || experience.type !== "writing" || !WRITING_PHASES.some((phase) => phase.id === phaseId)) {
    return;
  }
  experience.phase = phaseId;
  renderExperiencePreservingScroll();
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
      sectionById
    });
  }

  return [];
}

function getBowlRoundType(index) {
  return BOWL_ROUND_TYPES[index % BOWL_ROUND_TYPES.length];
}

function getCurrentBowlQuestion(experience = state.experience) {
  if (!experience || !Array.isArray(experience.questions) || !experience.questions.length) {
    return null;
  }
  return experience.questions[Math.min(experience.index, experience.questions.length - 1)];
}

function startBowlPractice() {
  const experience = state.experience;
  if (!experience || experience.type !== "bowl" || experience.unavailableReason) {
    return;
  }
  experience.started = true;
  experience.tipDismissed = true;
  renderExperience();
}

function answerBowlQuestion(optionIndex) {
  const experience = state.experience;
  const question = getCurrentBowlQuestion(experience);
  if (!experience || experience.type !== "bowl" || !experience.started || experience.revealed || !question) {
    return;
  }

  const isCorrect = optionIndex === question.answerIndex;
  const points = isCorrect ? 1 : 0;
  experience.selectedIndex = optionIndex;
  experience.revealed = true;
  experience.score += points;
  experience.streak = isCorrect ? experience.streak + 1 : 0;
  experience.bestStreak = Math.max(experience.bestStreak, experience.streak);
  experience.answers.push({
    questionId: question.id,
    sectionId: question.sectionId,
    subjectIds: question.subjectIds || [],
    bigIdeaIds: question.bigIdeaIds || [],
    isCorrect
  });
  renderExperience();
}

function advanceBowlQuestion() {
  const experience = state.experience;
  if (!experience || experience.type !== "bowl" || !experience.revealed) {
    return;
  }

  if (experience.index >= experience.questions.length - 1) {
    experience.finished = true;
    finalizeSessionStats(experience.answers, experience.bestStreak, {
      type: "bowl",
      score: experience.score
    });
  } else {
    experience.index += 1;
    experience.selectedIndex = null;
    experience.revealed = false;
  }
  renderExperience();
}

function resetBowlPractice() {
  const nextExperience = buildBowlExperience();
  nextExperience.tipDismissed = true;
  nextExperience.started = !nextExperience.unavailableReason;
  state.experience = nextExperience;
  renderExperience();
}

function syncExperienceTimers() {
  if (
    !state.experience ||
    state.experience.type !== "run" ||
    state.experience.unavailableReason ||
    !state.experience.currentQuestion ||
    state.experience.finished ||
    state.experience.revealed
  ) {
    clearRunTimer();
  } else if (!runTimerId) {
    startRunTimer();
  }

  if (
    !state.experience ||
    state.experience.type !== "race" ||
    state.experience.unavailableReason ||
    !state.experience.currentQuestion ||
    !state.experience.started ||
    state.experience.finished ||
    state.experience.revealed
  ) {
    clearRaceTimer();
  } else if (!raceTimerId) {
    startRaceTimer();
  }

  if (
    !state.experience ||
    state.experience.type !== "relay" ||
    !state.experience.started ||
    state.experience.revealed ||
    !Number.isInteger(state.experience.buzzedTeamIndex)
  ) {
    clearRelayAnswerTimer();
  } else if (!relayAnswerTimerId) {
    startRelayAnswerTimer();
  }

  if (
    !state.experience ||
    state.experience.type !== "jump" ||
    state.experience.phase !== "running" ||
    state.experience.finished
  ) {
    clearJumpAnimation();
  } else if (!jumpAnimationId) {
    startJumpAnimation();
  }
}

function renderAlpacaChannelExperience() {
  if (alpacaChannelMode?.renderExperience) {
    return alpacaChannelMode.renderExperience(state.experience, {
      escapeHtml,
      renderPanelTitle,
      renderConfiguredMascotAsset,
      renderLearnCardFooterNav,
      getModeAssetPath,
      getTargetLabel,
      getSelectedSectionLabels,
      getEmbeddableVideo,
      getVideoPreview,
      isDesktopApp: window.WSC_DESKTOP_APP === true
    });
  }

  const experience = state.experience;
  const videos = experience.videos || [];
  const current = videos[experience.index] || null;
  const routeLabel = getAlpacaChannelRouteTitleLabel(experience.routeTitle || getTargetLabel());

  if (!current) {
    return `
      ${renderPanelTitle("Alpaca Channel", null, null, { titleHtml: renderAlpacaChannelTitleMarkup(routeLabel), showSectionSpans: false })}
      <div class="channel-empty">
        ${renderConfiguredMascotAsset(getModeAssetPath("channel"), "thinking", "medium", {
          alt: "Alpaca Channel alpaca",
          slotClass: "channel-empty-icon-slot",
          imageClass: "channel-empty-icon"
        })}
        <div>
          <h3>No videos on this route yet</h3>
          <p>Alpaca Channel is ready, but this selected route does not currently include YouTube video links in its app-visible raw entries.</p>
        </div>
      </div>
      ${renderLearnCardFooterNav("channel")}
    `;
  }

  const previous = videos[(experience.index - 1 + videos.length) % videos.length];
  const next = videos[(experience.index + 1) % videos.length];
  const embeddedVideo = getEmbeddableVideo(current.url);
  const videoPreview = getVideoPreview(current.url);
  const canEmbedVideo = Boolean(embeddedVideo) && !window.WSC_DESKTOP_APP;
  const singleVideo = videos.length <= 1;
  const channelDomain = getAlpacaChannelDomain(routeLabel);
  const description = current.description || `Video from ${current.sectionTitle || experience.routeTitle || getTargetLabel()}.`;

  return `
    ${renderPanelTitle("Alpaca Channel", null, null, { titleHtml: renderAlpacaChannelTitleMarkup(routeLabel), showSectionSpans: false })}
    <div class="channel-shell">
      <article class="channel-browser" aria-label="Alpaca Channel video player">
        <div class="channel-browser-bar">
          <div class="channel-window-dots" aria-hidden="true">
            <span></span><span></span><span></span>
          </div>
          <div class="channel-address-pill">
            <span>${escapeHtml(channelDomain)}</span>
          </div>
        </div>
        <div class="channel-youtube-copy">
          <h2>${escapeHtml(current.title)}</h2>
        </div>
        <div class="channel-video-frame">
          ${canEmbedVideo ? `
            <iframe
              class="channel-video-iframe"
              src="${escapeHtml(embeddedVideo.embedUrl)}"
              title="${escapeHtml(current.title)}"
              loading="lazy"
              referrerpolicy="strict-origin-when-cross-origin"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowfullscreen
            ></iframe>
            <a class="channel-open-link" href="${escapeHtml(current.url)}" target="_blank" rel="noreferrer">Open on YouTube</a>
          ` : videoPreview ? `
            <a class="channel-video-fallback" href="${escapeHtml(current.url)}" target="_blank" rel="noreferrer">
              <img src="${escapeHtml(videoPreview.thumbnailUrl)}" alt="${escapeHtml(current.title)}" loading="lazy" referrerpolicy="no-referrer" />
              <span>Open video</span>
            </a>
          ` : `
            <a class="channel-video-fallback no-thumb" href="${escapeHtml(current.url)}" target="_blank" rel="noreferrer">
              <span>Open video</span>
            </a>
          `}
        </div>
        <div class="channel-description">
          <h3>Description</h3>
          <p>${escapeHtml(description)}</p>
        </div>
        <div class="channel-browser-footer">
          <button class="button secondary channel-nav-button" type="button" data-channel-nav="prev" ${singleVideo ? "disabled" : ""}>
            <span class="channel-nav-label">Last video</span>
            <span class="channel-nav-title">${escapeHtml(previous.title)}</span>
          </button>
          <div class="channel-video-count">${experience.index + 1} / ${videos.length}</div>
          <button class="button primary channel-nav-button" type="button" data-channel-nav="next" ${singleVideo ? "disabled" : ""}>
            <span class="channel-nav-label">Next video</span>
            <span class="channel-nav-title">${escapeHtml(next.title)}</span>
          </button>
        </div>
      </article>
    </div>
    ${renderLearnCardFooterNav("channel")}
  `;
}

function renderAlpacaChannelTitleMarkup(routeLabel = getAlpacaChannelRouteTitleLabel()) {
  return `
    <span class="channel-panel-title-brand">
      ${renderConfiguredMascotAsset(getModeAssetPath("channel"), "excited", "small", {
        alt: "Alpaca Channel logo",
        slotClass: "channel-panel-title-icon-slot",
        imageClass: "channel-panel-title-icon"
      })}
      <span>Alpaca Channel</span>
      ${routeLabel ? `<span class="channel-panel-section-chip">${escapeHtml(routeLabel)}</span>` : ""}
    </span>
  `;
}

function getAlpacaChannelRouteTitleLabel(fallbackLabel = getTargetLabel()) {
  const labels = getSelectedSectionLabels();
  return labels.length ? labels.join(" · ") : fallbackLabel;
}

function renderSlideshowExperience() {
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
        ${renderConfiguredMascotAsset(getTargetAssetPath(state.selection.targetId), "happy", "medium", {
          alt: `${getTargetLabel()} alpaca`,
          slotClass: "slide-rail-mascot-slot",
          imageClass: "slide-rail-mascot-image"
        })}
        <div class="slide-progress">Stop ${experience.index + 1} / ${experience.deck.length}</div>
        ${renderSlideSecondaryContext(slide)}
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

function renderSlideSecondaryContext(slide) {
  const context = getSlideSecondaryContext(slide);
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

function getSlideSecondaryContext(slide) {
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
    : (window.WSC_KNOWLEDGE_BANK?.meta?.official_subjects || []);

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

function navigateSlide(direction) {
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

function navigateAlpacaChannel(direction) {
  const experience = state.experience;
  const didNavigate = alpacaChannelMode?.navigate
    ? alpacaChannelMode.navigate(experience, direction)
    : false;
  if (didNavigate) {
    renderExperience();
    return;
  }

  if (!experience || experience.type !== "channel" || !experience.videos?.length) {
    return;
  }

  const total = experience.videos.length;
  experience.index = direction === "prev"
    ? (experience.index - 1 + total) % total
    : (experience.index + 1) % total;
  renderExperience();
}

function buildAlpacaChannelPlaylist() {
  return dedupeAlpacaChannelVideos([
    ...getRawEntriesForSelection().flatMap((entry) => getEmbeddedAlpacaChannelVideosForEntry(entry)),
    ...getStandaloneAlpacaChannelVideosForSelection()
  ]);
}

function dedupeAlpacaChannelVideos(videos) {
  const seen = new Set();
  const output = [];

  (videos || []).forEach((video) => {
    const key = normalizeVideoUrl(video.url);
    if (!key || seen.has(key)) {
      return;
    }
    seen.add(key);
    output.push(video);
  });

  return output;
}

function getAlpacaChannelVideosForEntry(entry) {
  return dedupeAlpacaChannelVideos([
    ...getEmbeddedAlpacaChannelVideosForEntry(entry),
    ...getStandaloneAlpacaChannelVideosForEntry(entry)
  ]);
}

function getEmbeddedAlpacaChannelVideosForEntry(entry) {
  if (!entry) {
    return [];
  }

  return collectAlpacaChannelVideos(entry, entry.title || "Video", "", entry).map((video) => ({
    ...video,
    entryTitle: entry.title,
    sectionTitle: entry.sectionTitle || entry.guidingSection || ""
  }));
}

function getStandaloneAlpacaChannelVideosForEntry(entry) {
  if (!entry?.title) {
    return [];
  }

  return getAlpacaChannelCatalogVideos()
    .filter((video) => standaloneVideoMatchesEntry(video, entry))
    .map((video) => createStandaloneAlpacaChannelVideo(video, entry.sectionId));
}

function standaloneVideoMatchesEntry(video, entry) {
  if (!video?.url || !entry?.title) {
    return false;
  }

  const entryTitleKey = normalizeKnowledgeKey(entry.title);
  const videoEntryTitles = normalizeLabelList(video.entryTitles);
  if (!videoEntryTitles.includes(entryTitleKey)) {
    return false;
  }

  const entrySectionId = normalizeSectionId(entry.sectionId || getSectionIdFromGuidingTitle(entry.sectionTitle || entry.guidingSection || ""));
  const videoSectionIds = normalizeIdList(video.sectionIds);

  return !entrySectionId || !videoSectionIds.length || videoSectionIds.includes(entrySectionId);
}

function getAlpacaChannelVideosForSection(sectionId) {
  const canonicalSectionId = normalizeSectionId(sectionId);
  if (!canonicalSectionId) {
    return [];
  }

  const section = getApprovedRawContentSection(canonicalSectionId);
  const embeddedVideos = section
    ? mapRawEntriesWithSection(section, section.entries || []).flatMap((entry) => getEmbeddedAlpacaChannelVideosForEntry(entry))
    : [];
  const standaloneVideos = getAlpacaChannelCatalogVideos()
    .filter((video) => normalizeIdList(video.sectionIds).includes(canonicalSectionId))
    .map((video) => createStandaloneAlpacaChannelVideo(video, canonicalSectionId));

  return dedupeAlpacaChannelVideos([...embeddedVideos, ...standaloneVideos]);
}

function getAlpacaChannelCatalogVideos() {
  return Array.isArray(alpacaChannelCatalog.videos)
    ? alpacaChannelCatalog.videos
    : [];
}

function getStandaloneAlpacaChannelVideosForSelection() {
  return getAlpacaChannelCatalogVideos()
    .filter(videoMatchesAlpacaChannelSelection)
    .map((video) => createStandaloneAlpacaChannelVideo(video));
}

function createStandaloneAlpacaChannelVideo(video, fallbackSectionId = null) {
  const sectionId = fallbackSectionId || getPrimaryStandaloneVideoSectionId(video);
  const sectionTitle = sectionId && sectionById[sectionId]
    ? sectionById[sectionId].title
    : (video.sectionTitles || [])[0] || getTargetLabel();

  return {
    title: cleanChannelVideoTitle(video.title || "Alpaca Channel video"),
    url: video.url,
    description: cleanChannelDescription(video.description || video.verdict || ""),
    location: "alpaca-channel",
    entryTitle: (video.entryTitles || [])[0] || "",
    sectionTitle,
    source: "alpaca-channel",
    channel: video.channel || "",
    duration: video.duration || "",
    score: video.score || null,
    bigIdeaLabels: Array.isArray(video.bigIdeaLabels) ? video.bigIdeaLabels.slice() : [],
    subjectLabels: Array.isArray(video.subjectLabels) ? video.subjectLabels.slice() : []
  };
}

function videoMatchesAlpacaChannelSelection(video) {
  if (!video || !video.url) {
    return false;
  }

  const selectedSectionIds = getSelectedSectionIds();
  if (state.selection.lens === "section" && selectedSectionIds.length) {
    const selected = new Set(selectedSectionIds);
    return normalizeIdList(video.sectionIds).some((sectionId) => selected.has(sectionId));
  }

  if (state.selection.targetId === "all") {
    return true;
  }

  if (state.selection.lens === "section") {
    return normalizeIdList(video.sectionIds).includes(state.selection.targetId);
  }

  if (state.selection.lens === "bigidea") {
    const route = bigIdeaRouteById[state.selection.targetId];
    const labels = normalizeLabelList(video.bigIdeaLabels);
    const ids = normalizeIdList(video.bigIdeaIds);
    return ids.includes(state.selection.targetId) || (route && labels.includes(normalizeKnowledgeKey(route.label)));
  }

  if (state.selection.lens === "subject") {
    const route = learnSubjectRouteById[state.selection.targetId] || subjectById[state.selection.targetId];
    const labels = normalizeLabelList(video.subjectLabels);
    const ids = normalizeIdList(video.subjectIds);
    return ids.includes(state.selection.targetId) || (route && labels.includes(normalizeKnowledgeKey(route.label)));
  }

  return false;
}

function getPrimaryStandaloneVideoSectionId(video) {
  const sectionIds = normalizeIdList(video.sectionIds);
  const selectedSectionIds = getSelectedSectionIds();

  if (state.selection.lens === "section" && selectedSectionIds.length) {
    return selectedSectionIds.find((sectionId) => sectionIds.includes(sectionId)) || sectionIds[0] || null;
  }

  return sectionIds[0] || null;
}

function normalizeIdList(values = []) {
  return (Array.isArray(values) ? values : [])
    .map((value) => normalizeSectionId(String(value || "").trim()))
    .filter(Boolean);
}

function normalizeLabelList(values = []) {
  return (Array.isArray(values) ? values : [])
    .map((value) => normalizeKnowledgeKey(value))
    .filter(Boolean);
}

function collectAlpacaChannelVideos(value, fallbackTitle, trail = "", entry = null) {
  if (appVideoService?.collectVideos) {
    return appVideoService.collectVideos(value, fallbackTitle, trail, entry);
  }

  const videos = [];

  function visit(node, localTitle, localTrail) {
    if (!node) {
      return;
    }

    if (Array.isArray(node)) {
      node.forEach((item, index) => visit(item, localTitle, `${localTrail}[${index}]`));
      return;
    }

    if (typeof node !== "object") {
      return;
    }

    const nodeTitle = cleanChannelVideoTitle(node.sourceTitle || node.title || node.label || node.previewLabel || localTitle || fallbackTitle);
    if (typeof node.url === "string" && isAlpacaChannelVideoUrl(node.url)) {
      videos.push({
        title: nodeTitle,
        url: node.url,
        description: getChannelVideoDescription(node, entry),
        location: localTrail || trail || "entry"
      });
    }

    Object.entries(node).forEach(([key, child]) => {
      visit(child, nodeTitle, localTrail ? `${localTrail}.${key}` : key);
    });
  }

  visit(value, fallbackTitle, trail);
  return videos;
}

function getChannelVideoDescription(node, entry = null) {
  if (appVideoService?.getChannelDescription) {
    return appVideoService.getChannelDescription(node, entry);
  }

  return cleanChannelDescription(
    node.note ||
    node.description ||
    node.caption ||
    entry?.takeaway ||
    entry?.whyItMatters ||
    entry?.studentExplanation ||
    ""
  );
}

function cleanChannelDescription(description) {
  if (appVideoService?.cleanDescription) {
    return appVideoService.cleanDescription(description);
  }

  return String(description || "")
    .replace(/\s+/g, " ")
    .trim();
}

function isAlpacaChannelVideoUrl(url) {
  if (appVideoService?.isSupportedVideoUrl) {
    return appVideoService.isSupportedVideoUrl(url);
  }

  return Boolean(getEmbeddableVideo(url) || getVideoPreview(url));
}

function normalizeVideoUrl(url) {
  if (appVideoService?.normalizeUrl) {
    return appVideoService.normalizeUrl(url);
  }

  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, "");
    if (host === "youtu.be") {
      const videoId = parsed.pathname.split("/").filter(Boolean)[0];
      return videoId ? `youtube:${videoId}` : url;
    }
    if (host === "youtube.com" || host === "m.youtube.com") {
      const videoId = parsed.searchParams.get("v");
      const playlistId = parsed.searchParams.get("list");
      if (videoId) {
        return `youtube:${videoId}`;
      }
      if (playlistId) {
        return `youtube-playlist:${playlistId}`;
      }
    }
  } catch (_error) {
    return url;
  }

  return url;
}

function cleanChannelVideoTitle(title) {
  if (appVideoService?.cleanTitle) {
    return appVideoService.cleanTitle(title);
  }

  return String(title || "Video")
    .replace(/\s+-\s+YouTube$/i, "")
    .replace(/\s+video$/i, "")
    .trim() || "Video";
}

function getAlpacaChannelDomain(label) {
  if (alpacaChannelMode?.getDomain) {
    return alpacaChannelMode.getDomain(label);
  }

  const slug = String(label || "route")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[’']/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
    .trim() || "route";

  return `www.alpacachannel.${slug}.com`;
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

function renderMindMapExperience() {
  return mindMapMode.renderExperience(state.experience, getMindMapRenderHelpers());
}

function renderRadialMindMap(layout) {
  return mindMapMode.renderRadialMindMap(layout, getMindMapRenderHelpers());
}

function buildRadialMindMapLayout(map) {
  const entries = (map.entries || []).slice();
  const entryCount = entries.length;
  const ringPlan = getMindMapRingPlan(entryCount);
  const ringCount = ringPlan.length;
  const firstEntryRadius = entryCount > 80 ? 230 : entryCount > 36 ? 220 : 190;
  const ringGap = entryCount > 80 ? 104 : 116;
  const outerRadius = firstEntryRadius + Math.max(0, ringCount - 1) * ringGap;
  const size = Math.ceil(Math.max(640, outerRadius * 2 + 250));
  const center = {
    x: Math.round(size / 2),
    y: Math.round(size / 2),
    title: map.centerTitle,
    sectionId: map.sectionId || null
  };
  const entryBubble = {
    width: entryCount > 96 ? 112 : entryCount > 64 ? 124 : entryCount > 36 ? 134 : 150,
    height: entryCount > 64 ? 54 : 60
  };
  const entryPaths = [];
  const rings = Array.from({ length: ringCount }, (_, ringIndex) => ({
    radius: Math.round(firstEntryRadius + ringIndex * ringGap),
    tone: ringIndex % 3,
    delay: ringIndex * 1.35
  }));

  const positionedEntries = entries.map((entry, entryIndex) => {
    const ring = getMindMapRingIndexForEntry(entryIndex, ringPlan);
    const ringStartIndex = ringPlan.slice(0, ring).reduce((total, count) => total + count, 0);
    const ringIndex = entryIndex - ringStartIndex;
    const ringEntryCount = ringPlan[ring] || 1;
    const offset = ringEntryCount > 1 && ring % 2 ? Math.PI / ringEntryCount : 0;
    const angle = (2 * Math.PI * ringIndex / Math.max(1, ringEntryCount)) - Math.PI / 2 + offset;
    const entryRadius = firstEntryRadius + ring * ringGap;
    const entryX = center.x + Math.cos(angle) * entryRadius;
    const entryY = center.y + Math.sin(angle) * entryRadius;
    const orbitDuration = 68 + ring * 18 + Math.min(42, entryCount * 0.24);
    const orbitDirection = ring % 2 === 0 ? 1 : -1;
    const orbitSpeed = orbitDirection * (2 * Math.PI / orbitDuration);

    entryPaths.push(getMindMapCurvePath(center.x, center.y, entryX, entryY, entryIndex));

    return {
      ...entry,
      x: Math.round(entryX),
      y: Math.round(entryY),
      orbitRadius: Math.round(entryRadius),
      orbitPhase: Number(angle.toFixed(5)),
      orbitSpeed: Number(orbitSpeed.toFixed(5)),
      orbitRing: ring,
      width: entryBubble.width,
      height: entryBubble.height
    };
  });

  return {
    size,
    kicker: "",
    title: map.centerTitle || "Mind Map",
    center,
    rings,
    entryPaths,
    entries: positionedEntries
  };
}

function getMindMapRingPlan(entryCount) {
  if (entryCount <= 0) {
    return [];
  }

  if (entryCount <= 3) {
    return [entryCount];
  }

  const firstRingCount = Math.floor(entryCount / 2);
  return [firstRingCount, entryCount - firstRingCount];
}

function getMindMapRingIndexForEntry(entryIndex, ringPlan) {
  let remainingIndex = entryIndex;

  for (let ringIndex = 0; ringIndex < ringPlan.length; ringIndex += 1) {
    const ringEntryCount = ringPlan[ringIndex] || 0;
    if (remainingIndex < ringEntryCount) {
      return ringIndex;
    }
    remainingIndex -= ringEntryCount;
  }

  return Math.max(0, ringPlan.length - 1);
}

function getRadialMindMapEntries(diagram) {
  const entriesByKey = new Map();

  (diagram?.groups || []).forEach((group) => {
    group.entries.forEach((entry) => {
      if (!entriesByKey.has(entry.key)) {
        entriesByKey.set(entry.key, {
          ...entry,
          lensLabels: []
        });
      }

      const item = entriesByKey.get(entry.key);
      if (group.label && !item.lensLabels.includes(group.label)) {
        item.lensLabels.push(group.label);
      }
    });
  });

  return [...entriesByKey.values()]
    .map((entry) => ({
      ...entry,
      meta: formatMindMapEntryMeta(entry.lensLabels, entry.meta)
    }))
    .sort(compareRawEntriesByOfficialOrder);
}

function formatMindMapEntryMeta(labels, fallback = "") {
  const uniqueLabels = [...new Set((labels || []).filter(Boolean))];
  if (!uniqueLabels.length) {
    return fallback;
  }

  if (uniqueLabels.length <= 2) {
    return uniqueLabels.join(" / ");
  }

  return `${uniqueLabels.slice(0, 2).join(" / ")} +${uniqueLabels.length - 2}`;
}

function getMindMapCurvePath(startX, startY, endX, endY, seed = 0) {
  const deltaX = endX - startX;
  const deltaY = endY - startY;
  const length = Math.max(1, Math.hypot(deltaX, deltaY));
  const midpointX = (startX + endX) / 2;
  const midpointY = (startY + endY) / 2;
  const bend = Math.min(72, length * 0.14) * (seed % 2 === 0 ? 1 : -1);
  const controlX = midpointX + (-deltaY / length) * bend;
  const controlY = midpointY + (deltaX / length) * bend;

  return `M ${Math.round(startX)} ${Math.round(startY)} Q ${Math.round(controlX)} ${Math.round(controlY)} ${Math.round(endX)} ${Math.round(endY)}`;
}

function renderMindMapEntryPopup() {
  return mindMapMode.renderEntryPopup(getMindMapRenderHelpers());
}

function buildRegularGuideExperience() {
  return regularGuideMode.buildExperience(getTargetLabel(), getRegularGuidesForSelection());
}

function getRegularGuideForSection(section) {
  if (!section) {
    return null;
  }
  const sectionId = section.id || getSectionIdFromGuidingTitle(section.guidingSection || section.title);
  const guide = section.regularGuide || IMPORTED_RAW_CONTENT_BANK[sectionId]?.regularGuide || null;
  return guide
    ? {
        ...guide,
        sectionId,
        sectionTitle: section.guidingSection || section.title || guide.title
      }
    : null;
}

function getRegularGuidesForSelection() {
  if (state.selection.lens !== "section") {
    return [];
  }

  const sections = getOrderedRawContentSections();
  const selectedSectionIds = getSelectedSectionIds();

  if (selectedSectionIds.length) {
    const selected = new Set(selectedSectionIds);
    return sections
      .filter((section) => selected.has(section.id))
      .map(getRegularGuideForSection)
      .filter(Boolean);
  }

  if (state.selection.targetId === "all") {
    return sections.map(getRegularGuideForSection).filter(Boolean);
  }

  if (state.selection.lens === "section") {
    const section = getApprovedRawContentSection(state.selection.targetId);
    return [getRegularGuideForSection(section)].filter(Boolean);
  }

  const sectionIds = new Set(getRawEntriesForSelection().map((entry) => entry.sectionId).filter(Boolean));
  return sections
    .filter((section) => sectionIds.has(section.id))
    .map(getRegularGuideForSection)
    .filter(Boolean);
}

function renderRegularGuideExperience() {
  return regularGuideMode.renderExperience(state.experience, getRegularGuideRenderContext(), getRegularGuideRenderHelpers());
}

function renderRegularGuideDocument(guide) {
  return regularGuideMode.renderDocument(guide, getRegularGuideRenderHelpers());
}

function renderRegularGuideQuestionBlock(section) {
  return regularGuideMode.renderQuestionBlock(section, getRegularGuideRenderContext(), getRegularGuideRenderHelpers());
}

function renderRegularGuideNavigation(section) {
  return regularGuideMode.renderNavigation(section, getRegularGuideRenderContext(), getRegularGuideRenderHelpers());
}

function renderGuideSectionChannelButton(sectionId) {
  return regularGuideMode.renderSectionChannelButton(sectionId, getRegularGuideRenderContext(), getRegularGuideRenderHelpers());
}

function getRegularGuideRenderContext() {
  return {
    importedRawContentBank: IMPORTED_RAW_CONTENT_BANK,
    sectionById
  };
}

function getRegularGuideRenderHelpers() {
  return {
    escapeHtml,
    renderPanelTitle,
    renderLearnCardFooterNav,
    renderSectionTransferTable,
    renderGuideQuizQuestion,
    getRawQuizPageIndex,
    renderRawBackToTopButton,
    getRawContentScopeLabel,
    getTargetLabel,
    getSectionGuideQuestions,
    getOrderedRawContentSections,
    getRegularGuideForSection,
    getAlpacaChannelVideosForSection,
    getModeAssetPath
  };
}

function getRawVisibleQuizQuestionItems(entry) {
  return (entry.quizQuestions || [])
    .map((question, questionIndex) => ({ question, questionIndex }))
    .filter(({ question }) => [1, 2].includes(Number(question.level)));
}

function getSectionGuideQuestions(section) {
  return Array.isArray(section?.guideQuestions) ? section.guideQuestions : [];
}

function renderSectionTransferTable(sectionOrEntry, options = {}) {
  return rawContentTransferTable?.renderSectionTransferTable
    ? rawContentTransferTable.renderSectionTransferTable(sectionOrEntry, options, { escapeHtml })
    : "";
}

function getVisibleWrongExplanation(question, selectedOption) {
  if (!question || !selectedOption || selectedOption.correct) {
    return "";
  }

  const selectedKey = normalizeKnowledgeKey(selectedOption.text);
  const visibleWrongExplanations = Array.isArray(question.visibleWrongExplanations)
    ? question.visibleWrongExplanations
    : [];
  const matchingExplanation = visibleWrongExplanations.find((item) => (
    normalizeKnowledgeKey(item.answer) === selectedKey
    || normalizeKnowledgeKey(item.text) === selectedKey
  ));

  return matchingExplanation?.explanation || "";
}

function getVisibleQuizFeedbackParts(question, selectedOption) {
  if (!question || !selectedOption) {
    return null;
  }

  const wrongExplanation = getVisibleWrongExplanation(question, selectedOption);
  const correctExplanation = question.visibleCorrectExplanation || question.explanation || "";
  const paragraphs = [];

  if (!selectedOption.correct && wrongExplanation) {
    paragraphs.push(wrongExplanation);
  }

  if (question.visibleConnection) {
    paragraphs.push(question.visibleConnection);
  }

  if (correctExplanation && (selectedOption.correct || correctExplanation !== wrongExplanation)) {
    paragraphs.push(correctExplanation);
  }

  if (!paragraphs.length && question.explanation) {
    paragraphs.push(question.explanation);
  }

  return {
    heading: selectedOption.correct ? "Exactly" : "Not quite",
    paragraphs,
    takeaway: question.visibleTakeaway || ""
  };
}

function renderRawQuizFeedback(question, selectedOption) {
  const feedback = getVisibleQuizFeedbackParts(question, selectedOption);
  if (!feedback || (!feedback.paragraphs.length && !feedback.takeaway)) {
    return "";
  }

  return `
    <div class="raw-quiz-feedback ${selectedOption.correct ? "correct" : "incorrect"}">
      <strong>${feedback.heading}</strong>
      ${feedback.paragraphs.map((paragraph) => `<p>${renderTextWithBreaks(paragraph)}</p>`).join("")}
      ${feedback.takeaway ? `<p class="raw-quiz-takeaway"><span>Takeaway:</span> ${renderTextWithBreaks(feedback.takeaway)}</p>` : ""}
    </div>
  `;
}

function renderGuideQuizQuestion(question, section, questionIndex) {
  const quizKey = getRawQuizQuestionKey(question);
  const selectedIndex = state.ui.rawQuizSelections[quizKey];
  const options = stableShuffleByKey([
    {
      text: question.correctAnswer,
      correct: true
    },
    ...(question.wrongAnswers || []).map((answer) => ({
      text: answer,
      correct: false
    }))
  ].filter((option) => option.text), `${question.level}|${section.id}|${question.prompt}|${question.correctAnswer}`);
  const selectedOption = Number.isInteger(selectedIndex) ? options[selectedIndex] : null;

  return `
    <article class="raw-quiz-card">
      <p class="raw-quiz-prompt">${escapeHtml(question.prompt)}</p>
      <div class="raw-quiz-options">
        ${options.map((option, index) => `
          <button
            class="raw-quiz-option ${renderRawQuizOptionStateClass(option, index, selectedIndex)}"
            type="button"
            data-raw-quiz-option="${index}"
            data-raw-quiz-key="${escapeHtml(quizKey)}"
            aria-pressed="${selectedIndex === index ? "true" : "false"}"
          >
            ${renderOptionToken(index)}
            <span>${escapeHtml(option.text)}</span>
          </button>
        `).join("")}
      </div>
      ${renderRawQuizFeedback(question, selectedOption)}
    </article>
  `;
}

function renderRawContentExperience() {
  const payload = getRawContentPayload();
  if (rawContentMode?.renderExperience) {
    return rawContentMode.renderExperience({
      experience: state.experience,
      payload,
      scopeLabel: getRawContentScopeLabel(),
      targetLabel: getTargetLabel()
    }, {
      escapeHtml,
      renderPanelTitle,
      renderEntryGroups: renderRawContentEntryGroups,
      renderMediaLightbox: renderRawMediaLightbox,
      renderLearnCardFooterNav
    });
  }

  if (!payload) {
    return `
      ${renderPanelTitle(
        "Raw Content",
        "",
        ""
      )}
      <div class="raw-content-shell">
        <article class="raw-source-card">
          <div class="raw-source-top">
            <div>
              <p class="challenge-label">${escapeHtml(getRawContentScopeLabel())}</p>
              <h3>${escapeHtml(getTargetLabel())}</h3>
            </div>
          </div>
          <p>Waiting for updates until you receive the ones.</p>
          <div class="chip-row">
            <span>${escapeHtml(getTargetLabel())}</span>
            <span>Raw Content update pending</span>
          </div>
        </article>
      </div>
    `;
  }

  return `
    ${renderPanelTitle(
      "Raw Content",
      "",
      `${payload.entries.length} raw entries`
    )}
    <div class="raw-content-shell">
      ${renderRawContentEntryGroups(payload.entries)}
      ${renderRawMediaLightbox()}
    </div>
    ${renderLearnCardFooterNav("rawcontent")}
  `;
}

function renderRawContentEntryGroups(entries) {
  const selectedSectionIds = getSelectedSectionIds();
  if (rawContentMode?.renderEntryGroups) {
    return rawContentMode.renderEntryGroups(entries, {
      selectedSectionIds,
      sectionById
    }, {
      escapeHtml,
      getSectionIdFromGuidingTitle,
      renderEntryCard: renderRawContentEntryCard
    });
  }

  if (selectedSectionIds.length <= 1) {
    return entries.map((entry, entryIndex) => renderRawContentEntryCard(entry, entryIndex)).join("");
  }

  const entriesBySection = new Map();
  entries.forEach((entry, entryIndex) => {
    const sectionId = entry.sectionId || getSectionIdFromGuidingTitle(entry.guidingSection || entry.sectionTitle || "");
    if (!entriesBySection.has(sectionId)) {
      entriesBySection.set(sectionId, []);
    }
    entriesBySection.get(sectionId).push({ entry, entryIndex });
  });

  return selectedSectionIds.map((sectionId) => {
    const sectionEntries = entriesBySection.get(sectionId) || [];
    if (!sectionEntries.length) {
      return "";
    }

    return `
      <article class="raw-source-card raw-section-group-card">
        <div class="raw-source-top raw-section-group-top">
          <div>
            <h3>${escapeHtml(sectionById[sectionId]?.title || sectionEntries[0].entry.sectionTitle || sectionId)}</h3>
          </div>
        </div>
        <div class="raw-section-entry-list">
          ${sectionEntries.map(({ entry, entryIndex }) => renderRawContentEntryCard(entry, entryIndex)).join("")}
        </div>
      </article>
    `;
  }).join("");
}

function renderRawContentEntryCard(entry, entryIndex) {
  if (rawContentEntryRenderer?.renderEntryCard) {
    return rawContentEntryRenderer.renderEntryCard(entry, entryIndex, {
      escapeHtml,
      renderTextWithBreaks,
      renderAlpacaList,
      renderRawStudentAssets,
      renderRawConnectionGroups,
      renderSectionTransferTable,
      renderRawQuizPager,
      renderRawMasteryToggle,
      getRawOfficialDisplayText
    });
  }

  const rawOfficialText = getRawOfficialDisplayText(entry);

  return `
    <article class="raw-atom-card raw-entry-card">
      <div class="raw-atom-top">
        <div>
          <h3>${escapeHtml(entry.title)}</h3>
        </div>
        ${entry.links && entry.links.length ? `
          <div class="raw-link-list raw-link-list-inline">
            ${entry.links.map((link) => `
              <a class="raw-link-pill raw-link-pill-inline" href="${escapeHtml(link.url)}" target="_blank" rel="noreferrer">
                ${escapeHtml(link.label || link.url)}
              </a>
            `).join("")}
          </div>
        ` : ""}
      </div>
      ${(rawOfficialText || (entry.rawOfficialBullets && entry.rawOfficialBullets.length)) ? `
        <div class="raw-block">
          <strong>Raw official text</strong>
          ${rawOfficialText ? `<p>${renderTextWithBreaks(rawOfficialText)}</p>` : ""}
          ${entry.rawOfficialBullets && entry.rawOfficialBullets.length
            ? renderAlpacaList(entry.rawOfficialBullets)
            : ""}
        </div>
      ` : ""}
      ${entry.studentExplanation ? `
        <div class="raw-block">
          <strong>Student explanation</strong>
          <p>${renderTextWithBreaks(entry.studentExplanation)}</p>
          ${renderRawStudentAssets(entry, entryIndex)}
        </div>
      ` : ""}
      ${entry.whyItMatters ? `
        <div class="raw-block">
          <strong>Why it matters</strong>
          <p>${renderTextWithBreaks(entry.whyItMatters)}</p>
        </div>
      ` : ""}
      ${renderRawConnectionGroups(entry)}
      ${renderSectionTransferTable(entry, { collapsed: true, context: "raw" })}
      ${renderRawQuizPager(entry, entryIndex)}
      ${renderRawMasteryToggle(entry, { includeBackToTop: true, entryIndex })}
    </article>
  `;
}

function getRawContentScopeLabel() {
  if (rawContentService?.getScopeLabel) {
    return rawContentService.getScopeLabel(state.selection);
  }

  if (state.selection.lens === "subject") {
    return "Subject Route";
  }

  if (state.selection.lens === "bigidea") {
    return "Big Idea Route";
  }

  return "Guiding Section";
}

function getRawContentPayload() {
  if (rawContentService?.getPayload) {
    return rawContentService.getPayload(state.selection, getSelectedSectionIds(), getTargetLabel());
  }

  const entries = getRawEntriesForSelection();
  if (!entries.length) {
    return null;
  }

  return {
    scopeLabel: getRawContentScopeLabel(),
    title: getTargetLabel(),
    entries
  };
}

function getRawEntriesForSelection() {
  const selectedSectionIds = getSelectedSectionIds();
  if (rawContentService?.getEntriesForSelection) {
    return rawContentService.getEntriesForSelection(state.selection, selectedSectionIds);
  }

  if (state.selection.lens === "section" && selectedSectionIds.length) {
    return selectedSectionIds.flatMap((sectionId) => getRawEntriesForRouteSelection("section", sectionId));
  }

  return getRawEntriesForRouteSelection(state.selection.lens, state.selection.targetId);
}

function getRawEntriesForRouteSelection(lensId, targetId) {
  if (rawContentService?.getEntriesForRouteSelection) {
    return rawContentService.getEntriesForRouteSelection(lensId, targetId);
  }

  const sections = getOrderedRawContentSections();

  if (targetId === "all") {
    return sections.flatMap((section) => mapRawEntriesWithSection(section, section.entries || []));
  }

  if (lensId === "section") {
    const approved = getApprovedRawContentSection(targetId);
    if (!approved) {
      return [];
    }
    return mapRawEntriesWithSection(approved, approved.entries || []);
  }

  if (lensId === "bigidea") {
    const route = bigIdeaRouteById[targetId];
    if (!route) {
      return [];
    }

    return sections.flatMap((section) => {
      const entries = (section.entries || []).filter((entry) => (entry.bigIdeas || []).includes(route.label));
      return mapRawEntriesWithSection(section, entries);
    }).sort(compareRawEntriesByOfficialOrder);
  }

  if (lensId === "subject") {
    if (usesGranularLearnSubjects()) {
      const route = learnSubjectRouteById[targetId];
      if (!route) {
        return [];
      }

      return sections.flatMap((section) => {
        const sectionId = section.id || getSectionIdFromGuidingTitle(section.guidingSection || section.title);
        const entries = (section.entries || []).filter((entry) => entryMatchesLearnSubjectRoute(entry, sectionId, route));
        return mapRawEntriesWithSection(section, entries);
      }).sort(compareRawEntriesByOfficialOrder);
    }

    const subject = subjectById[targetId];
    if (!subject) {
      return [];
    }

    const normalizedSubject = normalizeKnowledgeKey(subject.label);
    return sections.flatMap((section) => {
      const entries = (section.entries || []).filter((entry) => {
        const entrySubjects = entry.officialWscSubject ? [entry.officialWscSubject] : (entry.subjects || []);
        return entrySubjects.some((label) => normalizeKnowledgeKey(label) === normalizedSubject);
      });
      return mapRawEntriesWithSection(section, entries);
    }).sort(compareRawEntriesByOfficialOrder);
  }

  return [];
}

function getRawEntriesForRunSetupCategoryIds(categoryIds) {
  if (rawContentService?.getEntriesForCategoryIds) {
    return rawContentService.getEntriesForCategoryIds(categoryIds, state.selection);
  }

  const seen = new Set();
  return (categoryIds || []).flatMap((categoryId) =>
    getRawEntriesForRouteSelection(state.selection.lens, categoryId)
  ).filter((entry) => {
    const key = `${entry.sectionId || entry.guidingSection}|${entry.title}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

function countRawQuizQuestions(entries) {
  return (entries || []).reduce((sum, entry) => {
    return sum + (Array.isArray(entry.quizQuestions) ? entry.quizQuestions.length : 0);
  }, 0);
}

function getOrderedRawContentSections() {
  if (rawContentService?.getOrderedSections) {
    return rawContentService.getOrderedSections();
  }

  return Object.values(IMPORTED_RAW_CONTENT_BANK || {}).sort(compareOfficialSectionOrder);
}

function mapRawEntriesWithSection(section, entries) {
  if (rawContentService?.mapEntriesWithSection) {
    return rawContentService.mapEntriesWithSection(section, entries);
  }

  const sectionId = section.id || getSectionIdFromGuidingTitle(section.guidingSection || section.title);
  const sectionLabel = sectionId && sectionById[sectionId]
    ? sectionById[sectionId].title
    : section.guidingSection || section.title;

  return entries.map((entry, index) => ({
    ...entry,
    sectionId,
    entryIndex: Number.isFinite(entry.entryIndex) ? entry.entryIndex : index + 1,
    sectionTitle: sectionLabel,
    sectionTransferTable: section.transferTable || null,
    sourceFile: section.sourceFile || section.title
  }));
}

function getRawEntryMasteryKey(entry) {
  if (rawContentService?.getEntryMasteryKey) {
    return rawContentService.getEntryMasteryKey(entry);
  }

  return [
    entry.sectionId || getSectionIdFromGuidingTitle(entry.guidingSection || entry.sectionTitle || ""),
    entry.title || "",
    entry.sourceFile || ""
  ].map((part) => normalizeKnowledgeKey(part || "entry")).join("::");
}

function isRawEntryMastered(entry) {
  return Boolean(state.rawMastery[getRawEntryMasteryKey(entry)]);
}

function getRawMasteryHelpers() {
  return {
    escapeHtml,
    getEntryMasteryKey: getRawEntryMasteryKey,
    isEntryMastered: isRawEntryMastered,
    getAssetValue,
    getModeAssetPath,
    getAlpacaChannelVideosForEntry
  };
}

function renderRawMasteryToggle(entry, options = {}) {
  return rawContentMastery?.renderToggle
    ? rawContentMastery.renderToggle(entry, options, getRawMasteryHelpers())
    : "";
}

function renderRawEntryQuickActions(entry, entryIndex) {
  return rawContentMastery?.renderQuickActions
    ? rawContentMastery.renderQuickActions(entry, entryIndex, getRawMasteryHelpers())
    : "";
}

function renderRawBackToTopButton() {
  return rawContentMastery?.renderBackToTopButton
    ? rawContentMastery.renderBackToTopButton(getRawMasteryHelpers())
    : "";
}

function renderRawEntryChannelLinks(entry, entryIndex) {
  return rawContentMastery?.renderEntryChannelLinks
    ? rawContentMastery.renderEntryChannelLinks(entry, entryIndex, getRawMasteryHelpers())
    : "";
}

function toggleRawMastery(key) {
  if (!key) {
    return;
  }

  state.rawMastery = {
    ...state.rawMastery,
    [key]: !state.rawMastery[key]
  };

  if (!state.rawMastery[key]) {
    delete state.rawMastery[key];
  }

  saveRawMastery();
  renderStats();
  renderExperience();
}

function getAllRawEntries() {
  if (rawContentService?.getAllEntries) {
    return rawContentService.getAllEntries();
  }

  return getOrderedRawContentSections().flatMap((section) =>
    mapRawEntriesWithSection(section, section.entries || [])
  ).sort(compareRawEntriesByOfficialOrder);
}

function getTotalRawMasterableEntries() {
  if (rawContentService?.getTotalMasterableEntries) {
    return rawContentService.getTotalMasterableEntries();
  }

  return new Set(getAllRawEntries().map((entry) => getRawEntryMasteryKey(entry))).size;
}

function getMasteredRawEntryCount() {
  if (rawContentService?.getMasteredEntryCount) {
    return rawContentService.getMasteredEntryCount(state.rawMastery);
  }

  const validKeys = new Set(getAllRawEntries().map((entry) => getRawEntryMasteryKey(entry)));
  return Object.keys(state.rawMastery).filter((key) => state.rawMastery[key] && validKeys.has(key)).length;
}

function findLearnSubjectRouteIdByLabel(label) {
  const normalized = normalizeKnowledgeKey(label);
  const route = LEARN_SUBJECT_ROUTES.find((item) => normalizeKnowledgeKey(item.label) === normalized);
  return route ? route.id : null;
}

function findBigIdeaRouteIdByLabel(label) {
  const normalized = normalizeKnowledgeKey(label);
  const route = BIG_IDEA_ROUTES.find((item) => normalizeKnowledgeKey(item.label) === normalized);
  return route ? route.id : null;
}

function getRawConnectionGroups(entry) {
  const groups = [];

  if (state.selection.lens !== "section" && entry.sectionId) {
    groups.push({
      label: "Guiding Section",
      items: [
        {
          lens: "section",
          targetId: entry.sectionId,
          label: entry.sectionTitle || getTargetLabelForLens("section", entry.sectionId)
        }
      ]
    });
  }

  if (state.selection.lens !== "subject" && entry.subjects && entry.subjects.length) {
    const subjectItems = entry.subjects
      .map((label) => {
        const targetId = findLearnSubjectRouteIdByLabel(label);
        return targetId ? { lens: "subject", targetId, label } : null;
      })
      .filter(Boolean);

    if (subjectItems.length) {
      groups.push({
        label: "Subjects",
        items: subjectItems
      });
    }
  }

  if (state.selection.lens !== "bigidea" && entry.bigIdeas && entry.bigIdeas.length) {
    const bigIdeaItems = entry.bigIdeas
      .map((label) => {
        const targetId = findBigIdeaRouteIdByLabel(label);
        return targetId ? { lens: "bigidea", targetId, label } : null;
      })
      .filter(Boolean);

    if (bigIdeaItems.length) {
      groups.push({
        label: "Big Ideas",
        items: bigIdeaItems
      });
    }
  }

  return groups.length ? `
    <div class="raw-block raw-connections-block">
      <strong>Connections</strong>
      <div class="raw-connection-groups">
        ${groups.map((group) => `
          <div class="raw-connection-group">
            <span class="raw-connection-group-label">${escapeHtml(group.label)}</span>
            <div class="raw-connection-list">
              ${group.items.map((item) => `
                <span class="raw-connection-pill raw-connection-pill-static">
                  ${escapeHtml(item.label)}
                </span>
              `).join("")}
            </div>
          </div>
        `).join("")}
      </div>
    </div>
  ` : "";
}

function renderRawConnectionGroups(entry) {
  return getRawConnectionGroups(entry);
}

function buildMindMap(sectionId = null, providedEntries = null, entryOffset = 0) {
  const entries = Array.isArray(providedEntries) ? providedEntries : getRawEntriesForSelection();
  const section = sectionId ? sectionById[sectionId] : null;
  const centerTitle = section ? section.title : getTargetLabel();

  if (!entries.length) {
    return {
      kicker: "Route map",
      centerTitle,
      centerBody: "The imported raw entry bank is unavailable for this route, so the map is showing the overview only.",
      sectionId,
      entries: [],
      entryLookup: {}
    };
  }

  const mapEntries = entries.map((entry, index) => ({
    key: getMindMapEntryKey(entry, entryOffset + index),
    title: entry.title,
    meta: getMindMapEntryMeta(entry, state.selection.lens)
  }));

  return {
    kicker: `${getLensLabel(state.selection.lens)} focus`,
    centerTitle,
    centerBody: "",
    sectionId,
    entries: mapEntries,
    entryLookup: Object.fromEntries(entries.map((entry, index) => [getMindMapEntryKey(entry, entryOffset + index), { entry, index: entryOffset + index }]))
  };
}

function getMindMapEntryKey(entry, index) {
  return `${getRawEntryMasteryKey(entry)}::mindmap-${index}`;
}

function buildMindMapDiagram(lensId, entries) {
  const groups = new Map();

  entries.forEach((entry) => {
    getMindMapTargetsForLens(entry, lensId).forEach((target) => {
      if (!groups.has(target.id)) {
        groups.set(target.id, {
          id: target.id,
          label: target.label,
          entries: []
        });
      }

      const group = groups.get(target.id);
      const key = getRawEntryMasteryKey(entry);
      if (group.entries.some((item) => item.key === key)) {
        return;
      }

      group.entries.push({
        key,
        sectionId: entry.sectionId,
        entryIndex: entry.entryIndex,
        title: entry.title,
        meta: getMindMapEntryMeta(entry, lensId)
      });
    });
  });

  const orderedGroups = getOrderedMindMapGroups(lensId, groups);

  return {
    lensId,
    kicker: "Entry map",
    title: `By ${getMindMapLensLabel(lensId)}`,
    body: `Each clickable entry keeps its ${getMindMapLensLabel(lensId).toLowerCase()} label without adding an extra branch level.`,
    groups: orderedGroups
  };
}

function getMindMapTargetsForLens(entry, lensId) {
  if (lensId === "section") {
    return entry.sectionId
      ? [{
          id: entry.sectionId,
          label: entry.sectionTitle || getTargetLabelForLens("section", entry.sectionId)
        }]
      : [];
  }

  if (lensId === "subject") {
    return (entry.subjects || [])
      .map((label) => {
        const targetId = findLearnSubjectRouteIdByLabel(label);
        return targetId ? { id: targetId, label } : null;
      })
      .filter(Boolean);
  }

  return (entry.bigIdeas || [])
    .map((label) => {
      const targetId = findBigIdeaRouteIdByLabel(label);
      return targetId ? { id: targetId, label } : null;
    })
    .filter(Boolean);
}

function getOrderedMindMapGroups(lensId, groups) {
  const sortEntries = (items) => items.sort(compareRawEntriesByOfficialOrder);

  if (lensId === "section") {
    return data.sections
      .map((section) => section.id)
      .filter((id) => groups.has(id))
      .map((id) => {
        const group = groups.get(id);
        return {
          ...group,
          entries: sortEntries(group.entries.slice())
        };
      });
  }

  if (lensId === "subject") {
    return getActiveSubjectCatalog()
      .map((subject) => subject.id)
      .filter((id) => groups.has(id))
      .map((id) => {
        const group = groups.get(id);
        return {
          ...group,
          entries: sortEntries(group.entries.slice())
        };
      });
  }

  return BIG_IDEA_ROUTES
    .map((route) => route.id)
    .filter((id) => groups.has(id))
    .map((id) => {
      const group = groups.get(id);
      return {
        ...group,
        entries: sortEntries(group.entries.slice())
      };
    });
}

function getMindMapEntryMeta(entry, lensId) {
  if (lensId === "section") {
    return (entry.subjects || [])[0] || (entry.bigIdeas || [])[0] || entry.takeaway || "";
  }

  if (lensId === "subject") {
    return entry.sectionTitle || (entry.bigIdeas || [])[0] || entry.takeaway || "";
  }

  return entry.sectionTitle || (entry.subjects || [])[0] || entry.takeaway || "";
}

function getMindMapLensLabel(lensId) {
  if (lensId === "bigidea") {
    return "Big Ideas";
  }

  if (lensId === "subject") {
    return usesGranularLearnSubjects() ? "Study Lanes" : "Subject Routes";
  }

  return "Guiding Sections";
}

function getActiveMindMapEntryBundle() {
  const experience = state.experience;
  if (!experience || experience.type !== "mindmap" || !experience.activeEntryKey) {
    return null;
  }

  const maps = Array.isArray(experience.maps) && experience.maps.length
    ? experience.maps
    : [experience.map].filter(Boolean);

  for (const map of maps) {
    const bundle = map.entryLookup?.[experience.activeEntryKey];
    if (bundle) {
      return bundle;
    }
  }

  return null;
}

function openMindMapEntry(entryKey) {
  const experience = state.experience;
  if (!experience || experience.type !== "mindmap" || !entryKey) {
    return;
  }

  const maps = Array.isArray(experience.maps) && experience.maps.length
    ? experience.maps
    : [experience.map].filter(Boolean);
  const hasEntry = maps.some((map) => Boolean(map.entryLookup?.[entryKey]));
  if (!hasEntry) {
    return;
  }

  experience.activeEntryKey = entryKey;
  experience.activeGuideSectionId = null;
  syncPopupScrollLock();
  renderExperience();
}

function closeMindMapEntry() {
  const experience = state.experience;
  if (!experience || experience.type !== "mindmap" || !experience.activeEntryKey) {
    return;
  }

  state.ui.rawQuizSelections = {};
  state.ui.rawQuizPages = {};
  experience.activeEntryKey = null;
  syncPopupScrollLock();
  renderExperience();
}

function openMindMapGuide(sectionId) {
  const experience = state.experience;
  const normalizedSectionId = normalizeSectionId(sectionId);
  if (!experience || experience.type !== "mindmap" || !normalizedSectionId) {
    return;
  }

  experience.activeEntryKey = null;
  experience.activeGuideSectionId = normalizedSectionId;
  syncPopupScrollLock();
  renderExperience();
}

function closeMindMapGuide() {
  const experience = state.experience;
  if (!experience || experience.type !== "mindmap" || !experience.activeGuideSectionId) {
    return;
  }

  state.ui.rawQuizSelections = {};
  state.ui.rawQuizPages = {};
  experience.activeGuideSectionId = null;
  syncPopupScrollLock();
  renderExperience();
}

function renderMindMapGuidePopup() {
  return mindMapMode.renderGuidePopup(state.experience, getMindMapRenderHelpers());
}

function getMindMapRenderHelpers() {
  return {
    escapeHtml,
    renderPanelTitle,
    renderLearnCardFooterNav,
    renderRawMediaLightbox,
    renderRawMasteryToggle,
    renderTextWithBreaks,
    renderAlpacaList,
    renderRawStudentAssets,
    renderRawQuizPager,
    renderRegularGuideDocument,
    renderRegularGuideQuestionBlock,
    getTargetLabel,
    buildRadialMindMapLayout,
    getActiveMindMapEntryBundle,
    getApprovedRawContentSection,
    getRegularGuideForSection
  };
}

function getBuildCaseRound(experience) {
  return getCurrentDebateTopic(experience);
}

function getCurrentDebateTopic(experience = state.experience) {
  if (!experience || experience.type !== "buildcase") {
    return null;
  }

  const currentId = Array.isArray(experience.topicOrder) ? experience.topicOrder[experience.index] : null;
  return (experience.topics || []).find((topic) => topic.id === currentId) || (experience.topics || [])[0] || null;
}

function resetDebateSpinState(experience) {
  if (!experience) {
    return;
  }

  clearDebateSpinTimer();
  clearDebateRevealTimer();
  experience.phase = "topic";
  experience.selectedSide = null;
  experience.spinStatus = "idle";
  experience.spinOutcome = null;
  experience.spinTargetAngle = 0;
  experience.debateRound = 0;
  experience.debateRounds = [];
  experience.winner = null;
  experience.feedback = null;
  experience.finished = false;
}

function showNextDebateTopic() {
  const experience = state.experience;
  if (!experience || experience.type !== "buildcase" || !experience.topics?.length) {
    return;
  }

  const previousTopic = getCurrentDebateTopic(experience);
  if (!experience.topicOrder?.length) {
    experience.topicOrder = buildDebateTopicOrder(experience.topics, previousTopic?.id);
    experience.index = 0;
  } else if (experience.index >= experience.topicOrder.length - 1) {
    experience.topicOrder = buildDebateTopicOrder(experience.topics, previousTopic?.id);
    experience.index = 0;
  } else {
    experience.index += 1;
  }

  resetDebateSpinState(experience);
  renderExperience();
}

function openDebateSideSpinner() {
  const experience = state.experience;
  if (!experience || experience.type !== "buildcase" || !getCurrentDebateTopic(experience)) {
    return;
  }

  resetDebateSpinForCurrentTopic();
  renderExperience();
}

function toggleDebateSideSpin() {
  const experience = state.experience;
  if (!experience || experience.type !== "buildcase" || experience.phase !== "topic") {
    return;
  }

  if (experience.spinStatus === "spinning") {
    stopDebateSideSpin();
    return;
  }

  if (experience.spinStatus === "idle" || experience.spinStatus === "stopped") {
    clearDebateSpinTimer();
    clearDebateRevealTimer();
    experience.selectedSide = null;
    experience.spinOutcome = null;
    experience.spinStatus = "spinning";
    experience.spinTargetAngle = 0;
    renderExperience();
  }
}

function stopDebateSideSpin() {
  const experience = state.experience;
  if (!experience || experience.type !== "buildcase" || experience.spinStatus !== "spinning") {
    return;
  }

  const outcome = Math.random() < 0.5 ? "pro" : "con";
  const stopIndex = outcome === "pro" ? 12 : 13;
  experience.selectedSide = outcome;
  experience.spinOutcome = outcome;
  experience.spinStatus = "stopping";
  experience.spinTargetAngle = stopIndex;
  clearDebateSpinTimer();
  debateSpinTimerId = window.setTimeout(() => {
    const current = state.experience;
    if (!current || current.type !== "buildcase" || current.phase !== "topic" || current.spinStatus !== "stopping") {
      return;
    }

    current.spinStatus = "stopped";
    debateSpinTimerId = null;
    renderExperience();
  }, 3200);
  renderExperience();
}

function returnToDebateTopic() {
  const experience = state.experience;
  if (!experience || experience.type !== "buildcase") {
    return;
  }

  resetDebateSpinState(experience);
  renderExperience();
}

function resetDebateSpinForCurrentTopic() {
  const experience = state.experience;
  if (!experience || experience.type !== "buildcase") {
    return;
  }

  clearDebateSpinTimer();
  clearDebateRevealTimer();
  experience.phase = "topic";
  experience.selectedSide = null;
  experience.spinStatus = "idle";
  experience.spinOutcome = null;
  experience.spinTargetAngle = 0;
  experience.debateRound = 0;
  experience.debateRounds = [];
  experience.winner = null;
  experience.feedback = null;
  experience.finished = false;
}

function startDebateConversation() {
  const experience = state.experience;
  if (!experience || experience.type !== "buildcase") {
    return;
  }

  if (!experience.selectedSide) {
    toggleDebateSideSpin();
    return;
  }

  clearDebateSpinTimer();
  clearDebateRevealTimer();
  experience.phase = "debate";
  experience.debateRound = 0;
  experience.debateRounds = [];
  experience.winner = null;
  experience.feedback = null;
  experience.finished = false;
  ensureDebateRoundState(experience);
  beginDebateNpcOpeningIfNeeded(experience);
  renderExperience();
}

function getDebateItemQualityScore(item) {
  if (!item) {
    return 0;
  }

  if (item.kind === "connection") {
    return 2;
  }

  if (item.qualityKey === "strong") {
    return 3;
  }

  if (item.qualityKey === "medium") {
    return 2;
  }

  return 1;
}

function getDebateItemQualityLabel(item) {
  if (!item) {
    return "Choice";
  }

  if (item.kind === "connection") {
    return "Workbook connection";
  }

  if (item.qualityKey === "strong") {
    return "Strong";
  }

  if (item.qualityKey === "medium") {
    return "Medium";
  }

  return "Other workbook row";
}

function toDebateArgumentItem(argument, side) {
  return {
    id: argument.id,
    kind: "argument",
    side,
    qualityKey: argument.qualityKey,
    label: getDebateItemQualityLabel(argument),
    title: argument.argument,
    body: argument.judgeScoringMove || argument.evidenceHook || argument.sameSideDefense || argument.useWarning || "",
    source: argument.suggestedSpeakerRole || "",
    score: getDebateItemQualityScore(argument)
  };
}

function toDebateConnectionItem(connection, topic, index) {
  return {
    id: `debate-${topic.id}-connection-${index}`,
    kind: "connection",
    side: "both",
    qualityKey: "connection",
    label: "Workbook connection",
    title: connection.entryOrAnchor || connection.unitCategory || "Workbook connection",
    body: connection.whyItConnects || connection.source || "",
    source: connection.type || "",
    score: 2
  };
}

function getDebateArgumentsByQuality(topic, side, qualityKey) {
  return (topic.arguments?.[side] || []).filter((item) => item.qualityKey === qualityKey);
}

function getDebateOtherArguments(topic, side) {
  return (topic.arguments?.[side] || []).filter((item) => !["strong", "medium"].includes(item.qualityKey));
}

function pickDebateItems(items, count, roundIndex, usedIds = new Set()) {
  const available = items.filter((item) => !usedIds.has(item.id));
  const source = available.length >= count ? available : items;
  const picked = [];

  for (let offset = 0; offset < source.length && picked.length < count; offset += 1) {
    const item = source[(roundIndex * count + offset) % source.length];
    if (item && !picked.some((pickedItem) => pickedItem.id === item.id)) {
      picked.push(item);
    }
  }

  return picked;
}

function getUsedDebateSuggestionIds(experience) {
  return new Set((experience.debateRounds || []).flatMap((round) => [
    ...(round.userSelections || []),
    ...(round.npcSelections || []),
    ...(round.suggestions || []).map((item) => item.id)
  ]));
}

function buildDebateSuggestions(topic, side, roundIndex, experience) {
  const usedIds = getUsedDebateSuggestionIds(experience);
  const strong = pickDebateItems(
    getDebateArgumentsByQuality(topic, side, "strong").map((item) => toDebateArgumentItem(item, side)),
    2,
    roundIndex,
    usedIds
  );
  strong.forEach((item) => usedIds.add(item.id));

  const medium = pickDebateItems(
    getDebateArgumentsByQuality(topic, side, "medium").map((item) => toDebateArgumentItem(item, side)),
    1,
    roundIndex,
    usedIds
  );
  medium.forEach((item) => usedIds.add(item.id));

  const other = pickDebateItems(
    getDebateOtherArguments(topic, side).map((item) => toDebateArgumentItem(item, side)),
    1,
    roundIndex,
    usedIds
  );
  other.forEach((item) => usedIds.add(item.id));

  const connections = pickDebateItems(
    (topic.connections || []).map((connection, index) => toDebateConnectionItem(connection, topic, index)),
    2,
    roundIndex,
    usedIds
  );

  return shuffle([...strong, ...medium, ...other, ...connections]).slice(0, 6);
}

function ensureDebateRoundState(experience = state.experience) {
  if (!experience || experience.type !== "buildcase") {
    return null;
  }

  const topic = getCurrentDebateTopic(experience);
  if (!topic) {
    return null;
  }

  const roundIndex = Math.min(Math.max(Number(experience.debateRound) || 0, 0), 2);
  experience.debateRound = roundIndex;
  if (!Array.isArray(experience.debateRounds)) {
    experience.debateRounds = [];
  }

  if (!experience.debateRounds[roundIndex]) {
    experience.debateRounds[roundIndex] = {
      index: roundIndex,
      suggestions: buildDebateSuggestions(topic, experience.selectedSide || "pro", roundIndex, experience),
      userSelections: [],
      npcSelections: [],
      revealedNpcCount: 0,
      submitted: false,
      complete: false
    };
  }

  return experience.debateRounds[roundIndex];
}

function getCurrentDebateSuggestions(experience = state.experience) {
  const round = ensureDebateRoundState(experience);
  return round ? round.suggestions || [] : [];
}

function getDebateRoundSpeakerLabel(roundIndex) {
  return ["First debater", "Second debater", "Third debater"][roundIndex] || `Debater ${roundIndex + 1}`;
}

function isDebateUserTurnOpen(round, experience) {
  if (!round || !experience || round.submitted || experience.finished) {
    return false;
  }

  if (experience.selectedSide === "con") {
    return Boolean(round.npcOpeningComplete);
  }

  return true;
}

function getDebateItemById(experience, itemId) {
  return (experience.debateRounds || [])
    .flatMap((round) => [...(round.suggestions || []), ...(round.npcItems || [])])
    .find((item) => item.id === itemId) || null;
}

function toggleDebateSuggestion(itemId) {
  const experience = state.experience;
  const round = ensureDebateRoundState(experience);
  if (!experience || !round || !isDebateUserTurnOpen(round, experience)) {
    return;
  }

  const selected = new Set(round.userSelections || []);
  if (selected.has(itemId)) {
    selected.delete(itemId);
  } else if (selected.size < 3) {
    selected.add(itemId);
  }

  round.userSelections = Array.from(selected);
  renderExperiencePreservingScroll();
}

function getNpcQualityTarget(item) {
  if (!item) {
    return "strong";
  }

  if (item.kind === "connection") {
    return "strong";
  }

  if (item.qualityKey === "strong") {
    return "strong";
  }

  if (item.qualityKey === "medium") {
    return "strong";
  }

  return "medium";
}

function buildNpcDebateSelections(topic, npcSide, userItems, experience) {
  const usedIds = new Set((experience.debateRounds || []).flatMap((round) => round.npcSelections || []));
  const selected = [];
  const fallbackOrder = ["strong", "medium", "other"];

  userItems.forEach((userItem) => {
    const target = getNpcQualityTarget(userItem);
    const candidateGroups = target === "other"
      ? ["other", ...fallbackOrder]
      : [target, ...fallbackOrder.filter((key) => key !== target)];

    for (const group of candidateGroups) {
      const rawItems = group === "other"
        ? getDebateOtherArguments(topic, npcSide)
        : getDebateArgumentsByQuality(topic, npcSide, group);
      const candidate = rawItems
        .map((item) => toDebateArgumentItem(item, npcSide))
        .find((item) => !usedIds.has(item.id) && !selected.some((selectedItem) => selectedItem.id === item.id));
      if (candidate) {
        selected.push(candidate);
        usedIds.add(candidate.id);
        break;
      }
    }
  });

  if (!selected.length) {
    selected.push(...pickDebateItems(
      getDebateArgumentsByQuality(topic, npcSide, "strong").map((item) => toDebateArgumentItem(item, npcSide)),
      1,
      Number(experience.debateRound) || 0,
      usedIds
    ));
  }

  return selected.slice(0, Math.max(1, userItems.length));
}

function buildNpcOpeningDebateSelections(topic, npcSide, experience) {
  const usedIds = new Set((experience.debateRounds || []).flatMap((round) => round.npcSelections || []));
  const roundIndex = Number(experience.debateRound) || 0;
  const strong = pickDebateItems(
    getDebateArgumentsByQuality(topic, npcSide, "strong").map((item) => toDebateArgumentItem(item, npcSide)),
    2,
    roundIndex,
    usedIds
  );
  strong.forEach((item) => usedIds.add(item.id));
  const medium = pickDebateItems(
    getDebateArgumentsByQuality(topic, npcSide, "medium").map((item) => toDebateArgumentItem(item, npcSide)),
    1,
    roundIndex,
    usedIds
  );
  const selected = [...strong, ...medium];
  if (selected.length < 3) {
    selected.push(...pickDebateItems(
      getDebateOtherArguments(topic, npcSide).map((item) => toDebateArgumentItem(item, npcSide)),
      3 - selected.length,
      roundIndex,
      usedIds
    ));
  }
  return selected.slice(0, 3);
}

function beginDebateNpcOpeningIfNeeded(experience = state.experience) {
  const round = ensureDebateRoundState(experience);
  const topic = getCurrentDebateTopic(experience);
  if (!experience || !round || !topic || experience.selectedSide !== "con" || round.npcOpeningStarted) {
    return;
  }

  const npcSide = "pro";
  const npcItems = buildNpcOpeningDebateSelections(topic, npcSide, experience);
  round.npcItems = npcItems;
  round.npcSelections = npcItems.map((item) => item.id);
  round.revealedNpcCount = 0;
  round.npcOpeningStarted = true;
  round.npcOpeningComplete = false;
  round.complete = false;
  scheduleNextNpcReveal();
}

function scheduleNextNpcReveal() {
  clearDebateRevealTimer();
  const experience = state.experience;
  const round = ensureDebateRoundState(experience);
  if (!experience || !round || round.complete || !(round.npcSelections || []).length) {
    return;
  }

  if (round.revealedNpcCount >= (round.npcSelections || []).length) {
    if (experience.selectedSide === "con" && !round.submitted) {
      round.npcOpeningComplete = true;
    } else {
      round.complete = true;
      if (experience.debateRound >= 2) {
        finalizeDebateConversation();
      }
    }
    renderExperiencePreservingScroll();
    return;
  }

  debateRevealTimerId = window.setTimeout(() => {
    const current = state.experience;
    const currentRound = ensureDebateRoundState(current);
    if (!current || !currentRound || current.phase !== "debate" || currentRound.complete) {
      return;
    }

    currentRound.revealedNpcCount += 1;
    debateRevealTimerId = null;
    renderExperiencePreservingScroll();
    scheduleNextNpcReveal();
  }, 2000);
}

function submitDebateRound() {
  const experience = state.experience;
  const round = ensureDebateRoundState(experience);
  const topic = getCurrentDebateTopic(experience);
  if (
    !experience ||
    !round ||
    !topic ||
    !isDebateUserTurnOpen(round, experience) ||
    !(round.userSelections || []).length
  ) {
    return;
  }

  const userItems = (round.userSelections || [])
    .map((id) => (round.suggestions || []).find((item) => item.id === id))
    .filter(Boolean);
  round.userItems = userItems;
  round.submitted = true;

  if (experience.selectedSide === "con") {
    round.complete = true;
    if (experience.debateRound >= 2) {
      finalizeDebateConversation();
    }
    renderExperiencePreservingScroll();
    return;
  }

  const npcSide = "con";
  const npcItems = buildNpcDebateSelections(topic, npcSide, userItems, experience);
  round.npcItems = npcItems;
  round.npcSelections = npcItems.map((item) => item.id);
  round.revealedNpcCount = 0;
  round.complete = false;
  renderExperiencePreservingScroll();
  scheduleNextNpcReveal();
}

function advanceDebateRound() {
  const experience = state.experience;
  const round = ensureDebateRoundState(experience);
  if (!experience || !round || !round.complete) {
    return;
  }

  if (experience.debateRound >= 2) {
    finalizeDebateConversation();
  } else {
    experience.debateRound += 1;
    ensureDebateRoundState(experience);
    beginDebateNpcOpeningIfNeeded(experience);
  }
  renderExperiencePreservingScroll();
}

function getDebateRoundScore(items = []) {
  return items.reduce((sum, item) => sum + getDebateItemQualityScore(item), 0);
}

function getDebateChoiceJustification(item) {
  if (!item) {
    return "";
  }

  if (item.kind === "connection") {
    return "Useful evidence hook, but it still needs a claim attached.";
  }

  if (item.qualityKey === "strong") {
    return "Clear clash and mechanism for the judge.";
  }

  if (item.qualityKey === "medium") {
    return "Useful starter, though it needs sharper weighing.";
  }

  return "Creative idea, but easier for the other side to attack.";
}

function getDebateDisplayTitle(item) {
  const rawTitle = String(item?.title || "");
  const badGoodMatch = rawTitle.match(/^Bad-good\s+(?:PRO|CON):\s*[“"]([^”"]+)[”"]\s*Why weak:\s*(.+)$/i);
  if (badGoodMatch) {
    return badGoodMatch[1];
  }

  return rawTitle.replace(/^Bad-good\s+(?:PRO|CON):\s*/i, "");
}

function getDebateDisplayBody(item) {
  if (!item) {
    return "";
  }

  if (String(item.qualityKey || "").startsWith("bad-good")) {
    return "Turn this into a sharper claim with evidence and weighing.";
  }

  return item.body || "";
}

function finalizeDebateConversation() {
  const experience = state.experience;
  if (!experience || experience.type !== "buildcase") {
    return;
  }

  clearDebateRevealTimer();
  const rounds = (experience.debateRounds || []).filter((round) => round?.submitted);
  const userScore = rounds.reduce((sum, round) => sum + getDebateRoundScore(round.userItems || []), 0);
  const npcScore = rounds.reduce((sum, round) => sum + getDebateRoundScore(round.npcItems || []), 0);
  const winner = userScore > npcScore ? "user" : "npg";
  const userSide = getDebateSideLabel(experience.selectedSide);
  const npcSide = getDebateSideLabel(getOpposingDebateSide(experience.selectedSide));
  const selectedWeakRows = rounds.flatMap((round) => round.userItems || []).filter((item) => getDebateItemQualityScore(item) < 3);

  experience.winner = winner;
  experience.feedback = {
    userScore,
    npcScore,
    winnerLabel: winner === "user" ? `${userSide} wins` : `NPG (${npcSide}) wins`,
    why: winner === "user"
      ? "Your side won because the selected arguments were stronger overall and created clearer judge-visible clash."
      : userScore === npcScore
        ? "It was tied on choice quality, so the win goes to NPG by rule."
        : "NPG won because it matched the levels you chose and upgraded where stronger workbook rows were available.",
    better: selectedWeakRows.length
      ? "It would have been better to replace the easier-to-attack rows with stronger mechanism or weighing rows."
      : "No major choice problem: the next improvement is tighter weighing between impacts."
  };
  experience.finished = true;
}

function renderBuildCaseCampOption(campId, title, assetPath, active) {
  return `
    <button
      class="setup-option-button ${active ? "active" : ""}"
      type="button"
      data-buildcase-camp="${campId}"
    >
      ${renderAssetImage(
        assetPath,
        `${title} camp alpaca`,
        "setup-option-mascot",
        "setup-option-mascot-image"
      )}
      <span>${escapeHtml(title)}</span>
    </button>
  `;
}

function renderBuildCaseSupportOption(option, index, selected) {
  return `
    <button
      class="option-button ${selected ? "active" : ""}"
      type="button"
      data-buildcase-support="${index}"
    >
      <span class="option-token text">${selected ? "✓" : "•"}</span>
      <span>${escapeHtml(option.text)}</span>
    </button>
  `;
}

function renderBuildCaseRebuttalOption(option, index) {
  return `
    <button class="option-button" type="button" data-buildcase-rebuttal="${index}">
      ${renderOptionToken(index)}
      <span>${escapeHtml(option.text)}</span>
    </button>
  `;
}

function shortenTrainText(value, maxLength = 260) {
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
      ${renderTrainTipPopup("writing")}
    `;
  }

  const currentPhase = WRITING_PHASES.find((phase) => phase.id === experience.phase) || WRITING_PHASES[0];
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
          <p>${escapeHtml(shortenTrainText(prompt.focus))}</p>
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
              ${WRITING_PHASES.map((phase) => renderWritingPhaseButton(phase, experience.phase)).join("")}
            </div>
          </section>
          <section class="train-side-section">
            <h3>Judge check</h3>
            <div class="train-criteria-grid compact">
              ${TRAIN_TIPS.writing.judged.map((item) => `<span>${escapeHtml(item)}</span>`).join("")}
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
    ${renderTrainTipPopup("writing")}
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
      ${target.focus ? `<p>${escapeHtml(shortenTrainText(target.focus, 170))}</p>` : ""}
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
      ${renderTrainTipPopup("bowl")}
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
    ${renderTrainTipPopup("bowl")}
  `;
}

function getDebateSideLabel(side) {
  return side === "con" ? "CON" : "PRO";
}

function getOpposingDebateSide(side) {
  return side === "con" ? "pro" : "con";
}

function getDebateTopicSectionLabel(topic) {
  return sectionById[topic.sectionId]?.title || topic.primaryUnit || "Debate Lab";
}

function renderDebateList(items, className = "debate-mini-list") {
  const values = (items || []).filter(Boolean);
  if (!values.length) {
    return `<p class="debate-muted">No workbook notes for this field.</p>`;
  }

  return `
    <ul class="${escapeHtml(className)}">
      ${values.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
    </ul>
  `;
}

function renderDebateSourceLinks(topic) {
  const urls = (topic.sourceUrls || []).filter(Boolean);
  if (!urls.length) {
    return `<p class="debate-muted">No source links listed for this motion.</p>`;
  }

  return `
    <div class="debate-source-links">
      ${urls.map((url, index) => `
        <a href="${escapeHtml(url)}" target="_blank" rel="noreferrer">
          Source ${index + 1}
        </a>
      `).join("")}
    </div>
  `;
}

function renderDebateTopicCard(topic, experience) {
  return `
    <article class="debate-topic-card debate-topic-card-clean">
      <header class="debate-topic-main">
        <h2>${escapeHtml(topic.motion)}</h2>
        <button class="button secondary" type="button" data-buildcase-next-topic ${experience.topicOrder.length <= 1 ? "disabled" : ""}>Change topic</button>
      </header>
      <div class="debate-topic-spin-zone">
        ${renderDebateSlotMachine(experience)}
      </div>
    </article>
  `;
}

function renderDebateSlotMachine(experience) {
  const status = experience.spinStatus || "idle";
  const isBusy = status === "stopping";
  const buttonLabel = status === "spinning"
    ? "Stop"
    : status === "stopping"
      ? "Slowing..."
      : status === "stopped"
        ? "Spin again"
        : "Spin";
  const sideSequence = Array.from({ length: 18 }, (_, index) => index % 2 === 0 ? "pro" : "con");

  return `
    <section class="debate-slot-card" aria-live="polite">
      <div class="debate-slot-window">
        <div
          class="debate-slot-reel ${status === "spinning" ? "is-spinning" : ""} ${status === "stopping" ? "is-stopping" : ""} ${status === "stopped" ? "is-locked" : ""}"
          style="--debate-slot-stop: ${Number(experience.spinTargetAngle || 12)}"
        >
          ${sideSequence.map((side) => `
            <div class="debate-slot-tile ${escapeHtml(side)}">
              ${renderAssetImage(getAssetValue(["debate", side]), `${getDebateSideLabel(side)} side`, "debate-slot-logo-slot", "debate-slot-logo")}
              <strong>${escapeHtml(getDebateSideLabel(side))}</strong>
            </div>
          `).join("")}
        </div>
      </div>
      <div class="debate-slot-controls">
        <button
          class="button ${status === "stopped" ? "secondary" : "primary"}"
          type="button"
          data-buildcase-spin-toggle
          ${isBusy ? "disabled" : ""}
        >
          ${escapeHtml(buttonLabel)}
        </button>
        ${status === "stopped" && experience.selectedSide ? `
          <button class="button primary" type="button" data-buildcase-lets-debate>Let's debate</button>
        ` : ""}
      </div>
    </section>
  `;
}

function renderDebateSideSpinner(topic, experience) {
  const status = experience.spinStatus || "idle";
  const rotorClass = status === "spinning"
    ? "is-spinning"
    : status === "stopping"
      ? "is-stopping"
      : "";
  const buttonLabel = status === "spinning"
    ? "Stop"
    : status === "stopping"
      ? "Slowing..."
      : "Spin";
  const buttonDisabled = status === "stopping" ? "disabled" : "";
  const outcome = experience.spinOutcome;

  return `
    <article class="debate-spinner-card">
      <div class="debate-spinner-copy">
        <div class="question-meta">
          <span class="meta-pill section">${escapeHtml(getDebateTopicSectionLabel(topic))}</span>
          <span class="meta-pill subject">${escapeHtml(topic.difficulty || "Debate")}</span>
        </div>
        <p class="challenge-label">Side draw</p>
        <h2>${escapeHtml(topic.motion)}</h2>
        <p>Click once to spin. Click again to stop; the selector slows down and lands on PRO or CON.</p>
      </div>

      <div class="debate-orbit-shell" aria-live="polite">
        <div class="debate-orbit-marker">
          <span></span>
          <strong>YOUR SIDE</strong>
        </div>
        <div
          class="debate-side-rotor ${rotorClass}"
          style="--debate-spin-target-angle: ${Number(experience.spinTargetAngle || 0)}deg"
        >
          <span class="debate-side-line" aria-hidden="true"></span>
          <span class="debate-side-node debate-side-node-pro">
            ${renderAssetImage(getAssetValue(["debate", "pro"]), "PRO side", "debate-side-icon-slot", "debate-side-icon")}
            <strong>PRO</strong>
          </span>
          <span class="debate-side-node debate-side-node-con">
            ${renderAssetImage(getAssetValue(["debate", "con"]), "CON side", "debate-side-icon-slot", "debate-side-icon")}
            <strong>CON</strong>
          </span>
        </div>
        <div class="debate-orbit-core">
          <span>${status === "idle" ? "Ready" : status === "spinning" ? "Spinning" : status === "stopping" ? "Stopping" : "Locked"}</span>
          <strong>${outcome ? getDebateSideLabel(outcome) : "?"}</strong>
        </div>
      </div>

      <div class="panel-actions debate-spinner-actions">
        <button class="button secondary" type="button" data-buildcase-back-topic>Back to topic</button>
        <button class="button primary" type="button" data-buildcase-spin-toggle ${buttonDisabled}>${escapeHtml(buttonLabel)}</button>
      </div>
    </article>
  `;
}

function renderDebateClashCard(topic, side) {
  const clash = topic.clashCard || {};
  const opponent = getOpposingDebateSide(side);
  const sidePath = side === "con" ? clash.strongestConPath : clash.strongestProPath;
  const opponentPath = opponent === "con" ? clash.strongestConPath : clash.strongestProPath;
  const sideMustProve = side === "con" ? clash.conMustProve : clash.proMustProve;
  const opponentMustProve = opponent === "con" ? clash.conMustProve : clash.proMustProve;

  return `
    <section class="debate-clash-card">
      <div>
        <h3>${escapeHtml(getDebateSideLabel(side))} must prove</h3>
        <p>${escapeHtml(sideMustProve || "Define the motion, prove the mechanism, and weigh why this side wins.")}</p>
      </div>
      <div>
        <h3>${escapeHtml(getDebateSideLabel(opponent))} must prove</h3>
        <p>${escapeHtml(opponentMustProve || "Attack the motion, show the trade-offs, and weigh why this side wins.")}</p>
      </div>
      <div>
        <h3>Definitions to lock</h3>
        <p>${escapeHtml(clash.definitionsToLock || "Lock the key terms, affected stakeholders, scope, and threshold.")}</p>
      </div>
      <div>
        <h3>Your strongest path</h3>
        ${renderDebateList(sidePath)}
      </div>
      <div>
        <h3>Opponent path to expect</h3>
        ${renderDebateList(opponentPath)}
      </div>
    </section>
  `;
}

function getDebateArgumentGroups(argumentsForSide) {
  const groups = [
    { key: "strong", title: "Strong arguments" },
    { key: "medium", title: "Medium starters" },
    { key: "bad-good", title: "Bad-good traps" }
  ];
  const grouped = groups.map((group) => ({
    ...group,
    items: argumentsForSide.filter((item) => item.qualityKey === group.key)
  }));
  const known = new Set(groups.map((group) => group.key));
  const otherItems = argumentsForSide.filter((item) => !known.has(item.qualityKey));
  if (otherItems.length) {
    grouped.push({ key: "other", title: "Other workbook rows", items: otherItems });
  }
  return grouped.filter((group) => group.items.length);
}

function renderDebateArgumentCard(argument) {
  return `
    <article class="debate-argument-card">
      <header>
        <span>${escapeHtml(argument.quality || "Argument")} ${escapeHtml(argument.number || "")}</span>
        <strong>${escapeHtml(argument.suggestedSpeakerRole || "Any speaker")}</strong>
      </header>
      <p class="debate-argument-main">${escapeHtml(argument.argument)}</p>
      <dl>
        <div>
          <dt>Use / warning</dt>
          <dd>${escapeHtml(argument.useWarning || "Use this row as a prep note.")}</dd>
        </div>
        <div>
          <dt>Opposing rebuttal</dt>
          <dd>${escapeHtml(argument.opposingRebuttal || "No opposing rebuttal listed.")}</dd>
        </div>
        <div>
          <dt>Same-side defense</dt>
          <dd>${escapeHtml(argument.sameSideDefense || "No same-side defense listed.")}</dd>
        </div>
        <div>
          <dt>Judge move</dt>
          <dd>${escapeHtml(argument.judgeScoringMove || "Make the scoring move obvious.")}</dd>
        </div>
        <div>
          <dt>Evidence hook</dt>
          <dd>${escapeHtml(argument.evidenceHook || "No evidence hook listed.")}</dd>
        </div>
        <div>
          <dt>Likely category</dt>
          <dd>${escapeHtml(argument.likelyJudgeCategory || "Content / Strategy")}</dd>
        </div>
      </dl>
    </article>
  `;
}

function renderDebateArgumentDeck(topic, side, open = false) {
  const argumentsForSide = topic.arguments?.[side] || [];
  const groups = getDebateArgumentGroups(argumentsForSide);

  return `
    <details class="debate-argument-deck" ${open ? "open" : ""}>
      <summary>
        <span>${escapeHtml(getDebateSideLabel(side))} full argument deck</span>
        <strong>${argumentsForSide.length} rows</strong>
      </summary>
      <div class="debate-argument-groups">
        ${groups.map((group, index) => `
          <details class="debate-argument-group" ${index === 0 ? "open" : ""}>
            <summary>
              <span>${escapeHtml(group.title)}</span>
              <strong>${group.items.length}</strong>
            </summary>
            <div class="debate-argument-grid">
              ${group.items.map(renderDebateArgumentCard).join("")}
            </div>
          </details>
        `).join("")}
      </div>
    </details>
  `;
}

function renderDebateConnections(topic) {
  const connections = topic.connections || [];
  if (!connections.length) {
    return `<p class="debate-muted">No connection rows loaded for this motion.</p>`;
  }

  return `
    <details class="debate-connection-deck">
      <summary>
        <span>Workbook connections</span>
        <strong>${connections.length}</strong>
      </summary>
      <div class="debate-connection-list">
        ${connections.map((connection) => `
          <article>
            <span>${escapeHtml(connection.type || "Connection")} | ${escapeHtml(connection.unitCategory || "")}</span>
            <strong>${escapeHtml(connection.entryOrAnchor || "Anchor")}</strong>
            <p>${escapeHtml(connection.whyItConnects || "")}</p>
            ${connection.source ? `<small>${escapeHtml(connection.source)}</small>` : ""}
          </article>
        `).join("")}
      </div>
    </details>
  `;
}

function renderDebateJudgePrep() {
  const rows = (Array.isArray(debateLabData.judgePrep) ? debateLabData.judgePrep : []).filter((row) => (
    row.Section ||
    row["Official guide idea"] ||
    row["What alpacas should do"] ||
    row["Where this workbook helps"]
  ));
  return `
    <details class="debate-judge-prep" open>
      <summary>
        <span>Judge-aligned prep</span>
        <strong>${rows.length} notes</strong>
      </summary>
      <div class="debate-judge-prep-list">
        ${rows.map((row) => `
          <article>
            <strong>${escapeHtml(row.Section || "Judge note")}</strong>
            ${row["Official guide idea"] ? `<p>${escapeHtml(row["Official guide idea"])}</p>` : ""}
            ${row["What alpacas should do"] ? `<p>${escapeHtml(row["What alpacas should do"])}</p>` : ""}
            ${row["Where this workbook helps"] ? `<small>${escapeHtml(row["Where this workbook helps"])}</small>` : ""}
          </article>
        `).join("")}
      </div>
    </details>
  `;
}

function renderDebateSpeakerJobs(topic) {
  const clash = topic.clashCard || {};
  const jobs = [clash.speaker1Job, clash.speaker2Job, clash.speaker3Job].filter(Boolean);
  return `
    <section class="debate-speaker-jobs">
      <h3>Speaker route</h3>
      ${jobs.length ? jobs.map((job, index) => `
        <article>
          <span>Speaker ${index + 1}</span>
          <p>${escapeHtml(job)}</p>
        </article>
      `).join("") : `<p class="debate-muted">No speaker jobs listed for this motion.</p>`}
    </section>
  `;
}

function renderDebateCase(topic, experience) {
  experience.phase = "debate";
  ensureDebateRoundState(experience);
  return renderWhatspwaapDebatePage(topic, experience);
}

function renderDebateSuggestionCard(item, round, disabled = false) {
  const selected = (round.userSelections || []).includes(item.id);
  const isDisabled = Boolean(disabled);

  return `
    <button
      class="debate-suggestion-card ${selected ? "selected" : ""}"
      type="button"
      data-debate-suggestion="${escapeHtml(item.id)}"
      aria-pressed="${selected ? "true" : "false"}"
      ${isDisabled ? "disabled" : ""}
    >
      <strong>${escapeHtml(getDebateDisplayTitle(item))}</strong>
      ${getDebateDisplayBody(item) ? `<p>${escapeHtml(shortenTrainText(getDebateDisplayBody(item), 170))}</p>` : ""}
    </button>
  `;
}

function renderDebateSuggestionPanel(topic, experience) {
  const round = ensureDebateRoundState(experience);
  if (!round) {
    return "";
  }

  const selectedCount = (round.userSelections || []).length;
  const sideLabel = getDebateSideLabel(experience.selectedSide);
  const isFinal = Number(experience.debateRound) >= 2;
  const isUserTurnOpen = isDebateUserTurnOpen(round, experience);

  return `
    <section class="whatspwaap-suggestions">
      <header>
        <p class="challenge-label">${escapeHtml(sideLabel)} suggestions</p>
        <h3>${escapeHtml(getDebateRoundSpeakerLabel(Number(experience.debateRound) || 0))}</h3>
      </header>
      <div class="debate-suggestion-grid">
        ${(round.suggestions || []).map((item) => renderDebateSuggestionCard(item, round, !isUserTurnOpen)).join("")}
      </div>
      <div class="panel-actions whatspwaap-actions">
        ${!round.submitted ? `
          <button class="button primary" type="button" data-debate-submit-round ${selectedCount && isUserTurnOpen ? "" : "disabled"}>Validate</button>
        ` : round.complete ? `
          <button class="button primary" type="button" data-debate-next-round>${isFinal ? "See winner" : "Next exchange"}</button>
        ` : ""}
      </div>
    </section>
  `;
}

function renderWhatspwaapBubble(item, side, owner, delayIndex = 0) {
  return `
    <article class="whatspwaap-bubble ${owner}" style="--bubble-delay: ${delayIndex * 90}ms">
      <span>${escapeHtml(owner === "user" ? `You | ${getDebateSideLabel(side)}` : `NPG | ${getDebateSideLabel(side)}`)}</span>
      <strong>${escapeHtml(getDebateDisplayTitle(item))}</strong>
      <p>${escapeHtml(getDebateChoiceJustification(item))}</p>
    </article>
  `;
}

function renderWhatspwaapMessages(experience) {
  const userSide = experience.selectedSide || "pro";
  const npcSide = getOpposingDebateSide(userSide);
  const rounds = (experience.debateRounds || []).slice(0, Number(experience.debateRound) + 1);
  const messages = [];

  rounds.forEach((round, roundIndex) => {
    if (!round) {
      return;
    }

    const proItems = userSide === "pro"
      ? round.submitted ? round.userItems || [] : []
      : (round.npcItems || []).slice(0, round.revealedNpcCount || 0);
    const conItems = userSide === "con"
      ? round.submitted ? round.userItems || [] : []
      : (round.npcItems || []).slice(0, round.revealedNpcCount || 0);

    if (!proItems.length && !conItems.length) {
      return;
    }

    messages.push(`
      <div class="whatspwaap-round-label">${escapeHtml(getDebateRoundSpeakerLabel(roundIndex))}</div>
    `);

    proItems.forEach((item, itemIndex) => {
      messages.push(renderWhatspwaapBubble(item, "pro", userSide === "pro" ? "user" : "npg", itemIndex));
    });

    conItems.forEach((item, itemIndex) => {
      messages.push(renderWhatspwaapBubble(item, "con", userSide === "con" ? "user" : "npg", itemIndex));
    });
  });

  return messages.join("");
}

function renderDebateFeedbackList(title, items) {
  if (!items.length) {
    return "";
  }

  return `
    <section>
      <h4>${escapeHtml(title)}</h4>
      ${items.map((item, index) => `
        <p><strong>${index + 1}. ${escapeHtml(shortenTrainText(getDebateDisplayTitle(item), 86))}</strong> ${escapeHtml(getDebateChoiceJustification(item))}</p>
      `).join("")}
    </section>
  `;
}

function renderDebateResultCard(experience) {
  const feedback = experience.feedback;
  if (!feedback) {
    return "";
  }

  const userItems = (experience.debateRounds || []).flatMap((round) => round?.userItems || []);
  const npcItems = (experience.debateRounds || []).flatMap((round) => round?.npcItems || []);

  return `
    <section class="whatspwaap-result">
      <p class="challenge-label">Result</p>
      <h3>${escapeHtml(feedback.winnerLabel)}</h3>
      <p>${escapeHtml(feedback.why)}</p>
      <p>${escapeHtml(feedback.better)}</p>
      <div class="whatspwaap-feedback-grid">
        ${renderDebateFeedbackList("Your choices", userItems)}
        ${renderDebateFeedbackList("NPG choices", npcItems)}
      </div>
    </section>
  `;
}

function getDebateNpcChoosingSide(experience = state.experience) {
  const round = ensureDebateRoundState(experience);
  if (!experience || !round || experience.finished) {
    return null;
  }

  if (experience.selectedSide === "con" && round.npcOpeningStarted && !round.npcOpeningComplete) {
    return "pro";
  }

  if (experience.selectedSide === "pro" && round.submitted && !round.complete) {
    return "con";
  }

  return null;
}

function renderWhatspwaapStatus(experience) {
  const choosingSide = getDebateNpcChoosingSide(experience);
  if (!choosingSide) {
    return `<footer class="whatspwaap-status empty" aria-hidden="true"></footer>`;
  }

  return `
    <footer class="whatspwaap-status" aria-live="polite">
      ${renderAssetImage(
        getAssetValue(["debate", choosingSide]),
        `${getDebateSideLabel(choosingSide)} side`,
        "whatspwaap-status-logo-slot",
        "whatspwaap-status-logo"
      )}
      <span>NPG is choosing...</span>
    </footer>
  `;
}

function renderWhatspwaapPanel(topic, experience) {
  return `
    <aside class="whatspwaap-chat" aria-live="polite">
      <header>
        <div>
          <strong>WhatsPwaap</strong>
          <p>${escapeHtml(topic.motion)}</p>
        </div>
      </header>
      <div class="whatspwaap-messages">
        ${renderWhatspwaapMessages(experience)}
      </div>
      ${renderWhatspwaapStatus(experience)}
    </aside>
  `;
}

function renderWhatspwaapDebatePage(topic, experience) {
  return `
    ${renderPanelTitle(
      "Debate Lab",
      null,
      "",
      { showSectionSpans: false }
    )}
    <div class="mode-shell whatspwaap-shell">
      <header class="whatspwaap-page-title">
        <div class="whatspwaap-motion-line">
          <h2>${escapeHtml(topic.motion)}</h2>
          <div class="debate-side-inline ${escapeHtml(experience.selectedSide)}">
            ${renderAssetImage(
              getAssetValue(["debate", experience.selectedSide]),
              `${getDebateSideLabel(experience.selectedSide)} side`,
              "debate-side-inline-slot",
              "debate-side-inline-icon"
            )}
            <strong>${escapeHtml(getDebateSideLabel(experience.selectedSide))}</strong>
          </div>
        </div>
      </header>
      <section class="whatspwaap-layout">
        ${experience.finished ? renderDebateResultCard(experience) : renderDebateSuggestionPanel(topic, experience)}
        ${renderWhatspwaapPanel(topic, experience)}
      </section>
      <div class="panel-actions debate-case-actions">
        <button class="button secondary" type="button" data-buildcase-back-topic>Back to topics</button>
        <button class="button secondary" type="button" data-buildcase-spin-again>Spin again</button>
        <button class="button primary" type="button" data-buildcase-next-topic ${experience.topicOrder.length <= 1 ? "disabled" : ""}>Change topic</button>
      </div>
    </div>
  `;
}

function renderBuildCaseExperience() {
  const experience = state.experience;

  if (experience.unavailableReason) {
    return `
      ${renderPanelTitle("Debate Lab", "Pick a motion, draw a side, and prep with judge-ready arguments.", "", { showSectionSpans: false })}
      <div class="mode-shell">
        <article class="setup-card">
          <div class="setup-card-header">
            ${renderAssetImage(
              getAssetValue(["debate", "lab"]),
              "Debate Lab unavailable alpaca",
              "mascot-slot mascot-slot-medium",
              "mascot-asset mascot-asset-medium"
            )}
            <div>
              <p class="challenge-label">Debate Lab</p>
              <h3>${escapeHtml(experience.unavailableReason)}</h3>
            </div>
          </div>
        </article>
      </div>
    `;
  }

  const topic = getCurrentDebateTopic(experience);
  if (!topic) {
    return "";
  }

  if (experience.phase === "debate" || experience.phase === "case") {
    experience.phase = "debate";
    ensureDebateRoundState(experience);
    return renderWhatspwaapDebatePage(topic, experience);
  }

  return `
    ${renderPanelTitle(
      "Debate Lab",
      "Random WSC motions with workbook arguments, rebuttals, and judge-style scoring.",
      `Motion ${experience.index + 1} of ${experience.topicOrder.length}`,
      { showSectionSpans: false }
    )}
    <div class="mode-shell debate-lab-shell">
      ${renderGameQuestionPopup(renderDebateTopicCard(topic, experience), "buildcase debate-lab")}
    </div>
  `;
}

function startBuildCaseRoute() {
  openDebateSideSpinner();
}

function chooseBuildCaseCamp(camp) {
  const experience = state.experience;
  if (!experience || experience.type !== "buildcase") {
    return;
  }

  if (!["pro", "con"].includes(camp)) {
    return;
  }

  experience.selectedSide = camp;
  experience.spinOutcome = camp;
  experience.spinStatus = "stopped";
  experience.phase = "debate";
  ensureDebateRoundState(experience);
  beginDebateNpcOpeningIfNeeded(experience);
  renderExperience();
}

function toggleBuildCaseSupport(index) {
  const experience = state.experience;
  if (!experience || experience.type !== "buildcase" || experience.phase !== "support") {
    return;
  }

  const selected = new Set(experience.selectedSupports);
  if (selected.has(index)) {
    selected.delete(index);
  } else if (selected.size < 2) {
    selected.add(index);
  }

  experience.selectedSupports = Array.from(selected).sort((left, right) => left - right);
  renderExperience();
}

function confirmBuildCaseSupports() {
  const experience = state.experience;
  if (
    !experience ||
    experience.type !== "buildcase" ||
    experience.phase !== "support" ||
    experience.selectedSupports.length !== 2
  ) {
    return;
  }

  const round = getBuildCaseRound(experience);
  const options = experience.selectedCamp === "con" ? round.conSupports : round.proSupports;
  experience.supportHits = experience.selectedSupports.reduce((sum, index) => sum + (options[index] && options[index].correct ? 1 : 0), 0);
  experience.phase = "rebuttal";
  renderExperience();
}

function chooseBuildCaseRebuttal(index) {
  const experience = state.experience;
  if (!experience || experience.type !== "buildcase" || experience.phase !== "rebuttal") {
    return;
  }

  const round = getBuildCaseRound(experience);
  const options = experience.selectedCamp === "con" ? round.conRebuttals : round.proRebuttals;
  const selected = options[index];
  if (!selected) {
    return;
  }

  experience.selectedRebuttal = index;
  experience.rebuttalCorrect = Boolean(selected.correct);
  const supportScore = experience.supportHits * 25 + (experience.supportHits === 2 ? 10 : 0);
  const rebuttalScore = experience.rebuttalCorrect ? 40 : 0;
  experience.roundScore = supportScore + rebuttalScore;
  experience.score += experience.roundScore;
  experience.bestRound = Math.max(experience.bestRound, experience.roundScore);
  experience.answers.push({
    questionId: round.id,
    sectionId: round.sectionId,
    subjectIds: getBroadSubjectIdsFromLabels(round.subjectLabels || []),
    bigIdeaIds: getBigIdeaIdsFromLabels(round.entry?.bigIdeas || []),
    isCorrect: experience.roundScore >= 60
  });
  experience.phase = "feedback";
  renderExperience();
}

function advanceBuildCaseRound() {
  const experience = state.experience;
  if (!experience || experience.type !== "buildcase" || experience.phase !== "feedback") {
    return;
  }

  if (experience.index === experience.rounds.length - 1) {
    experience.finished = true;
    finalizeSessionStats(experience.answers, getBestStreakFromAnswers(experience.answers));
  } else {
    experience.index += 1;
    experience.phase = "camp";
    experience.selectedCamp = null;
    experience.selectedSupports = [];
    experience.selectedRebuttal = null;
    experience.supportHits = 0;
    experience.rebuttalCorrect = false;
    experience.roundScore = 0;
  }

  renderExperience();
}

function buildQuizExperience() {
  const selectedSectionIds = getDefaultQuizSectionIds();
  const setupQuestionCount = 15;
  const plan = buildQuizQuestionPlan(selectedSectionIds, setupQuestionCount, [1, 2, 3, 4, 5]);

  return {
    type: "quiz",
    title: "Scholar's Challenge",
    selectedSectionIds,
    selectedDifficulties: [1, 2, 3, 4, 5],
    setupQuestionCount,
    questions: plan.questions,
    selectedAnswers: {},
    started: !plan.unavailableReason && plan.questions.length === setupQuestionCount,
    submitted: false,
    score: 0,
    answers: [],
    tipDismissed: false,
    unavailableReason: plan.unavailableReason
  };
}

function getDefaultQuizSectionIds() {
  const allIds = data.sections.map((section) => section.id);
  const selectedSectionIds = getSelectedSectionIds();
  if (selectedSectionIds.length) {
    return selectedSectionIds;
  }

  if (state.selection.lens === "section" && state.selection.targetId && state.selection.targetId !== "all") {
    const targetIndex = allIds.indexOf(state.selection.targetId);
    const ordered = targetIndex >= 0
      ? allIds.slice(targetIndex).concat(allIds.slice(0, targetIndex))
      : allIds;
    return ordered.slice(0, GAME_CONFIG.jeopardyMinGroups);
  }

  if (state.selection.targetId && state.selection.targetId !== "all") {
    const routeSectionIds = getSectionIdsForEntries(getRawEntriesForSelection());
    if (routeSectionIds.length >= GAME_CONFIG.jeopardyMinGroups) {
      return routeSectionIds;
    }
  }

  return allIds;
}

function getQuizQuestionPattern(questionCount, selectedDifficulties = [1, 2, 3, 4, 5]) {
  return alpaquizEngine.getQuestionPattern(questionCount, selectedDifficulties);
}

function normalizeQuizDifficultySelection(selectedDifficulties = []) {
  return alpaquizEngine.normalizeDifficultySelection(selectedDifficulties);
}

function getRawEntriesForQuizSectionIds(sectionIds) {
  const seen = new Set();
  return (sectionIds || []).flatMap((sectionId) =>
    getRawEntriesForRouteSelection("section", sectionId)
  ).filter((entry) => {
    const key = `${entry.sectionId || entry.guidingSection}|${entry.title}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

function buildQuizQuestionPlan(sectionIds, questionCount, selectedDifficulties = [1, 2, 3, 4, 5]) {
  return alpaquizEngine.buildQuestionPlan(sectionIds, questionCount, selectedDifficulties, {
    getEntriesForSectionIds: getRawEntriesForQuizSectionIds,
    buildQuestionPools: buildRawQuestionPoolsFromEntries,
    hasRequiredLevels: hasRequiredRawLevels,
    buildPatternQuestionSequence,
    getUnavailableReason: getUnavailableRawGameReason
  });
}

function renderQuizExperience() {
  return `
    ${alpaquizRenderer.renderExperience(state.experience, getAlpaquizRenderHelpers())}
    ${renderTrainTipPopup("quiz")}
  `;
}

function getAlpaquizRenderHelpers() {
  return {
    escapeHtml,
    renderPanelTitle,
    renderGameQuestionPopup,
    renderConfiguredMascotAsset,
    getModeAssetPath,
    renderLearnCardFooterNav,
    renderOptionToken,
    renderTextWithBreaks,
    getQuizRemainingNotice,
    getQuizDifficultyResults,
    getSectionTitle: (question) => sectionById[question.sectionId]?.title || ""
  };
}

function renderQuizSetup(experience) {
  return alpaquizRenderer.renderSetup(experience, getAlpaquizRenderHelpers());
}

function renderQuizQuestionPage(experience) {
  return alpaquizRenderer.renderQuestionPage(experience, getAlpaquizRenderHelpers());
}

function getQuizRemainingNotice(experience) {
  return alpaquizEngine.getRemainingNotice(experience);
}

function getQuizDifficultyResults(experience) {
  return alpaquizEngine.getDifficultyResults(experience);
}

function renderQuizResultsFooter(experience) {
  return alpaquizRenderer.renderResultsFooter(experience, getAlpaquizRenderHelpers());
}

function renderQuizQuestionCard(question, questionIndex, experience) {
  return alpaquizRenderer.renderQuestionCard(question, questionIndex, experience, getAlpaquizRenderHelpers());
}

function renderQuizQuestionFeedback(question, selectedIndex, isCorrect) {
  return alpaquizRenderer.renderQuestionFeedback(question, selectedIndex, isCorrect, getAlpaquizRenderHelpers());
}

function toggleQuizSection(sectionId) {
  const experience = state.experience;
  if (!experience || experience.type !== "quiz" || experience.started) {
    return;
  }

  const current = new Set(experience.selectedSectionIds);
  if (current.has(sectionId)) {
    current.delete(sectionId);
  } else {
    current.add(sectionId);
  }
  experience.selectedSectionIds = data.sections
    .map((section) => section.id)
    .filter((id) => current.has(id));
  experience.unavailableReason = null;
  renderExperience();
}

function selectAllQuizSections() {
  const experience = state.experience;
  if (!experience || experience.type !== "quiz" || experience.started) {
    return;
  }

  experience.selectedSectionIds = data.sections.map((section) => section.id);
  experience.unavailableReason = null;
  renderExperience();
}

function toggleQuizDifficulty(level) {
  const experience = state.experience;
  if (!experience || experience.type !== "quiz" || experience.started || ![1, 2, 3, 4, 5].includes(level)) {
    return;
  }

  experience.selectedDifficulties = alpaquizEngine.toggleDifficulty(experience.selectedDifficulties, level);
  experience.unavailableReason = null;
  renderExperience();
}

function setQuizQuestionCount(count) {
  const experience = state.experience;
  if (!experience || experience.type !== "quiz" || experience.started || ![10, 15, 20].includes(count)) {
    return;
  }

  experience.setupQuestionCount = alpaquizEngine.setQuestionCount(experience.setupQuestionCount, count);
  renderExperience();
}

function startQuizRoute() {
  const experience = state.experience;
  if (!experience || experience.type !== "quiz" || experience.started) {
    return;
  }

  if (experience.selectedSectionIds.length < GAME_CONFIG.jeopardyMinGroups) {
    return;
  }

  if (!normalizeQuizDifficultySelection(experience.selectedDifficulties).length) {
    experience.unavailableReason = "Choose at least one difficulty.";
    renderExperience();
    return;
  }

  const plan = buildQuizQuestionPlan(
    experience.selectedSectionIds,
    experience.setupQuestionCount,
    experience.selectedDifficulties
  );
  if (plan.unavailableReason || plan.questions.length !== experience.setupQuestionCount) {
    experience.unavailableReason = plan.unavailableReason || getUnavailableRawGameReason();
    renderExperience();
    return;
  }

  experience.questions = plan.questions;
  experience.selectedAnswers = {};
  experience.answers = [];
  experience.score = 0;
  experience.started = true;
  experience.submitted = false;
  renderExperience();
}

function answerQuizQuestion(questionIndex, optionIndex) {
  const experience = state.experience;
  if (!experience || experience.type !== "quiz" || experience.submitted || !experience.questions[questionIndex]) {
    return;
  }

  experience.selectedAnswers = alpaquizEngine.answerQuestion(experience, questionIndex, optionIndex);
  renderExperiencePreservingScroll();
}

function submitQuizRoute() {
  const experience = state.experience;
  if (!experience || experience.type !== "quiz" || experience.submitted) {
    return;
  }

  if (Object.keys(experience.selectedAnswers).length !== experience.questions.length) {
    return;
  }

  const result = alpaquizEngine.buildSubmittedAnswers(experience);
  experience.answers = result.answers;
  experience.score = result.score;
  experience.submitted = true;
  finalizeSessionStats(experience.answers, getBestStreakFromAnswers(experience.answers), {
    type: "quiz",
    score: experience.score
  });
  renderExperience();
}

function resetQuizRoute() {
  const experience = state.experience;
  if (!experience || experience.type !== "quiz") {
    return;
  }

  state.experience = buildQuizExperience();
  renderExperience();
}

function renderRaceExperience() {
  const experience = state.experience;

  if (experience.finished) {
    return renderResultsScreen({
      title: experience.failed ? "Run Ended" : "Journey Summary",
      subtitle: experience.failed ? "The threshold closed." : "A strong run.",
      answers: experience.answers,
      failed: experience.failed,
      resultState: experience.failed ? "fail" : "success",
      visualHtml: experience.failed ? renderRaceFailVisual() : null,
      showTopClose: false,
      showBottomReplay: false,
      showPerformanceMessage: false,
      metrics: [
        {
          label: "Stops Cleared",
          value: `${experience.score}/${experience.totalQuestions}`
        },
        {
          label: "Time Survived",
          value: formatCountdown(experience.elapsedTime)
        }
      ]
    });
  }

  if (experience.unavailableReason) {
    return `
      ${renderPanelTitle("Survivalpaca", "Stay on track as the timer tightens around every question.", "")}
      <div class="mode-shell">
        <article class="setup-card">
          <div class="setup-card-header">
            ${renderConfiguredMascotAsset(
              getGameplayAssetPath("launch", "race"),
              "determined",
              "medium",
              { alt: "Race unavailable alpaca" }
            )}
            <div>
              <p class="challenge-label">Route update pending</p>
              <h3>${escapeHtml(experience.unavailableReason)}</h3>
            </div>
          </div>
        </article>
      </div>
    `;
  }

  const question = experience.currentQuestion;
  const currentLevel = getRaceActiveLevelState(experience);
  const timePercent = Math.max(0, (experience.timeRemaining / experience.questionTime) * 100);
  const timerClass = getTimerVisualState(experience.timeRemaining, experience.questionTime, {
    warningAt: 10,
    dangerAt: 5
  });
  const timerPhaseLabel = timerClass === "danger" ? "Critical" : timerClass === "warning" ? "Warning" : "Normal";
  return `
    ${renderPanelTitle(
      "Survivalpaca",
      "Stay on track as the timer tightens around every question.",
    )}
    <div class="mode-shell">
      <div class="mode-stats">
        <span>Current Run · ${escapeHtml(getTargetLabel())}</span>
      </div>

      ${!experience.started ? `
        <article class="race-launch-panel card-panel">
          <p class="race-launch-kicker">Timed Survival Route</p>
          <div class="race-launch-pills">
            <span>The timer only starts once you begin and paused after your answer to review.</span>
            <span>Each stop gives you ${GAME_CONFIG.raceQuestionTime} seconds to answer.</span>
            <span>${GAME_CONFIG.raceLives} chances stand between you and a lost route.</span>
          </div>
          ${renderRaceTargetSelector(experience)}
          <div class="panel-actions">
            <button class="button primary" data-race-start>En route</button>
          </div>
        </article>
      ` : renderGameQuestionPopup(`
        <article class="challenge-card race-question-card">
          ${renderRaceQuestionPills(experience, currentLevel)}

          <div class="challenge-copy">
            ${renderPopupQuestionTimerPanel(question.prompt, experience.timeRemaining, experience.questionTime, timerClass)}
            <div class="options-grid answer-options-grid">
              ${question.options.map((option, index) => {
                let classes = "option-button";
                if (experience.revealed) {
                  if (index === question.answerIndex) {
                    classes += " correct";
                  } else if (index === experience.selectedIndex) {
                    classes += " wrong";
                  }
                  classes += " disabled";
                }
                return `
                  <button class="${classes}" data-race-option="${index}">
                    ${renderOptionToken(index)}
                    <span>${escapeHtml(option)}</span>
                  </button>
                `;
              }).join("")}
            </div>
          </div>
        </article>
        ${experience.revealed ? `
          <article class="feedback-card ${experience.lastCorrect ? "correct" : "wrong"}">
            ${renderCheckpointVisual(experience.lastCorrect ? "success" : "fail")}
            <div>
              <h3>${escapeHtml(experience.lastCorrect ? "Still on track." : (experience.lastTimedOut ? "Missed checkpoint. Time ran out." : "Wrong turn. The route narrows."))}</h3>
              <p>${escapeHtml(question.explanation)}</p>
              <div class="feedback-actions">
                <button class="button primary" data-race-advance>${experience.lives <= 0 ? "Journey Summary" : "Continue Forward"}</button>
              </div>
            </div>
          </article>
        ` : ""}
      `, "race", { showClose: false })}
    </div>
  `;
}

function renderRaceTargetSelector(experience) {
  return renderTargetSetupSelector(experience, "race-toggle-category", "race-target-selector", "race-target-grid", "race-target-button");
}

function renderTargetSetupSelector(experience, dataAttributeName, blockClass = "", gridClass = "", buttonClass = "") {
  const setupOptions = getTargetSetupOptions();
  const selectedCount = experience.setupCategoryIds.length;
  return `
    <div class="setup-block ${escapeHtml(blockClass)}">
      <strong>${escapeHtml(getSetupTargetHeading())}</strong>
      <p class="setup-helper">${escapeHtml(getSetupTargetHelper(selectedCount))}</p>
      <div class="setup-option-grid ${escapeHtml(gridClass)}">
        ${setupOptions.map((option) => {
          const active = experience.setupCategoryIds.includes(option.id);
          return `
            <button
              class="setup-option-button ${escapeHtml(buttonClass)} ${active ? "active" : ""}"
              type="button"
              data-${escapeHtml(dataAttributeName)}="${escapeHtml(option.id)}"
              aria-pressed="${active ? "true" : "false"}"
            >
              ${renderConfiguredMascotAsset(option.asset, option.mood, "small", {
                alt: `${option.title} alpaca`
              })}
              <span>${escapeHtml(option.title)}</span>
            </button>
          `;
        }).join("")}
      </div>
    </div>
  `;
}

function startRaceRoute() {
  const experience = state.experience;
  if (!experience || experience.type !== "race" || experience.started || experience.unavailableReason) {
    return;
  }

  if (experience.setupCategoryIds.length < GAME_CONFIG.jeopardyMinGroups) {
    return;
  }

  const racePlan = buildRaceLevelQueues(getRawEntriesForRunSetupCategoryIds(experience.setupCategoryIds));
  if (racePlan.unavailableReason || !racePlan.levels.length) {
    experience.unavailableReason = racePlan.unavailableReason || getUnavailableRawGameReason();
    renderExperience();
    return;
  }

  experience.levels = racePlan.levels;
  experience.availableQuestionCount = getRaceAvailableQuestionCount(experience.levels);
  experience.totalQuestions = experience.availableQuestionCount;
  const firstLevelIndex = experience.levels.findIndex((level) => level.questions.length);
  experience.currentLevelIndex = firstLevelIndex === -1 ? 0 : firstLevelIndex;
  experience.currentQuestion = getCurrentRaceQuestion(experience);
  if (!experience.currentQuestion) {
    experience.unavailableReason = getUnavailableRawGameReason();
    renderExperience();
    return;
  }
  experience.started = true;
  renderExperience();
}

function getRaceAvailableQuestionCount(levels) {
  return (levels || []).reduce((sum, level) => sum + level.questions.length, 0);
}

function toggleRaceSetupCategory(categoryId) {
  const experience = state.experience;
  if (!experience || experience.type !== "race" || experience.started) {
    return;
  }

  if (!toggleSetupCategorySelection(experience, categoryId)) {
    return;
  }

  renderExperience();
}

function answerRaceQuestion(optionIndex) {
  const experience = state.experience;
  if (!experience || experience.type !== "race" || experience.revealed || !experience.currentQuestion) {
    return;
  }

  resolveRaceQuestion(optionIndex, false);
}

function resolveRaceQuestion(optionIndex, timedOut) {
  const experience = state.experience;
  if (!experience || experience.type !== "race" || experience.revealed) {
    return;
  }

  clearRaceTimer();

  const question = experience.currentQuestion;
  const isCorrect = !timedOut && optionIndex === question.answerIndex;
  const levelState = getRaceActiveLevelState(experience);

  experience.revealed = true;
  experience.lastCorrect = isCorrect;
  experience.lastTimedOut = timedOut;
  experience.selectedIndex = Number.isInteger(optionIndex) ? optionIndex : null;

  if (isCorrect) {
    experience.score += 1;
    experience.streak += 1;
    experience.bestStreak = Math.max(experience.bestStreak, experience.streak);
    levelState && levelState.pendingIds.delete(question.id);
  } else {
    if (timedOut) {
      experience.timeouts += 1;
    }
    experience.lives = Math.max(0, experience.lives - 1);
    experience.streak = 0;
  }

  experience.answers.push({
    questionId: question.id,
    sectionId: question.sectionId,
    subjectIds: question.subjectIds,
    bigIdeaIds: question.bigIdeaIds || [],
    isCorrect,
    timedOut
  });

  renderExperience();
}

function renderRaceQuestionPills(experience, currentLevel) {
  const pills = [
    `Pressure stop ${experience.index + 1}`,
    `Current level: ${currentLevel ? currentLevel.level : 1}`,
    `Chances remaining: ${experience.lives}`,
    `${experience.timeRemaining}s on the clock`
  ];

  return `
    <div class="race-question-pills" aria-label="Race question status">
      ${pills.map((pill) => `<span>${escapeHtml(pill)}</span>`).join("")}
    </div>
  `;
}

function advanceRace() {
  const experience = state.experience;
  if (!experience || experience.type !== "race") {
    return;
  }

  if (experience.lives <= 0) {
    experience.failed = true;
    experience.finished = true;
    finalizeSessionStats(experience.answers, experience.bestStreak, {
      type: "race",
      score: experience.score
    });
  } else if (!queueNextRaceQuestion(experience)) {
    experience.finished = true;
    finalizeSessionStats(experience.answers, experience.bestStreak, {
      type: "race",
      score: experience.score
    });
  } else {
    experience.index += 1;
    experience.revealed = false;
    experience.lastCorrect = null;
    experience.lastTimedOut = false;
    experience.selectedIndex = null;
    experience.questionTime = GAME_CONFIG.raceQuestionTime;
    experience.timeRemaining = experience.questionTime;
  }

  render();
}

function renderJeopardyExperience() {
  return alpacapardyRenderer.renderExperience(state.experience, getAlpacapardyRenderHelpers());
}

function renderJeopardyFocus(experience) {
  return alpacapardyRenderer.renderFocus(experience, getAlpacapardyRenderHelpers());
}

function renderJeopardySetup(experience) {
  return alpacapardyRenderer.renderSetup(experience, getAlpacapardyRenderHelpers());
}

function getAlpacapardyRenderHelpers() {
  return {
    config: GAME_CONFIG,
    selectionLens: state.selection.lens,
    sectionById,
    subjectById,
    escapeHtml,
    renderPanelTitle,
    renderConfiguredMascotAsset,
    renderGameQuestionPopup,
    renderPopupQuestionTimerPanel,
    renderCheckpointVisual,
    renderGameNotes,
    renderOptionToken,
    renderJeopardyDecoration,
    renderAssetImage,
    renderExperienceCloseButton,
    renderMetricCard,
    renderBreakdowns,
    getAssetValue,
    getGameplayAssetPath,
    getGameplayReviewBadge,
    getGamePromptLabel,
    getLensCardPluralLabel,
    getTargetLabel,
    getResultAssetPath,
    getSetupOptions: getJeopardySetupOptions,
    getStandings: getJeopardyStandings,
    showInlinePlayMode: false,
    setupPanelTitleOptions: state.ui.appShellMode === "online" ? { showReplay: false, hideSetupTitle: true } : {},
    setupStartAttribute: state.ui.appShellMode === "online" ? "data-jeopardy-live-create" : "data-jeopardy-start",
    setupStartLabel: state.ui.appShellMode === "online" ? "Create game" : "En route",
    getTimerVisualState,
    countTiles: countJeopardyTiles,
    countDoneTiles: countJeopardyDoneTiles,
    allTilesDone: allJeopardyTilesDone,
    isActiveTile: isActiveJeopardyTile,
    live: getAlpacapardyLiveRenderContext()
  };
}

function getAlpacapardyLiveRenderContext() {
  const experience = state.experience;
  const enabled = Boolean(experience?.playMode === "multiplayer" && state.live.currentSession);
  const user = state.auth.session?.user || null;
  const isHost = Boolean(state.live.currentSession && user && state.live.currentSession.host_user_id === user.id);
  const playerCount = state.live.players.filter((player) => ["host", "player"].includes(player.role)).length;
  const maxPlayers = Number(state.live.currentSession?.max_players || experience?.setupTeamCount || GAME_CONFIG.jeopardyDefaultTeams);

  return {
    available: Boolean(hasSupabaseConfig() && alpacapardyLiveSupabaseService && alpacapardyLive),
    accessAllowed: canAccessMultiplayer(),
    enabled,
    session: state.live.currentSession,
    player: state.live.currentPlayer,
    players: state.live.players,
    openSessions: state.live.openSessions,
    status: state.live.status,
    message: state.live.message,
    error: state.live.error,
    disabledReason: getLegacyLiveRoomsDisabledMessage(),
    userId: user?.id || null,
    isHost,
    isGuest: Boolean(user && isAnonymousUser(user)),
    canStart: Boolean(isHost && playerCount >= 2 && playerCount <= maxPlayers),
    canOpenTile: enabled ? canOpenAlpacapardyLiveTile() : true,
    canAnswerFocus: enabled ? canAnswerAlpacapardyLiveFocus() : true,
    canCloseFocus: enabled ? canCloseAlpacapardyLiveFocus() : true,
    canChat: Boolean(enabled && state.live.currentPlayer)
  };
}

function isAlpacapardyLiveActive() {
  return Boolean(
    state.experience?.type === "jeopardy" &&
    state.experience.playMode === "multiplayer" &&
    state.live.currentSession &&
    normalizeLiveGameType(state.live.currentSession.game_type) === "alpacapardy"
  );
}

function guardMultiplayerAccess() {
  if (canAccessMultiplayer()) {
    return true;
  }
  state.live.error = getLegacyLiveRoomsDisabledMessage();
  renderLiveSurfaces();
  return false;
}

function canOpenAlpacapardyLiveTile() {
  return alpacapardyLive?.canOpenTile
    ? alpacapardyLive.canOpenTile(state.experience, getAlpacapardyLiveIdentityContext())
    : false;
}

function canAnswerAlpacapardyLiveFocus() {
  return alpacapardyLive?.canAnswerFocus
    ? alpacapardyLive.canAnswerFocus(state.experience, getAlpacapardyLiveIdentityContext())
    : false;
}

function canCloseAlpacapardyLiveFocus() {
  return alpacapardyLive?.canCloseFocus
    ? alpacapardyLive.canCloseFocus(state.experience, getAlpacapardyLiveIdentityContext())
    : false;
}

function getAlpacapardyLiveIdentityContext() {
  const user = state.auth.session?.user || null;
  return {
    enabled: isAlpacapardyLiveActive(),
    userId: user?.id || null,
    playerId: state.live.currentPlayer?.id || null,
    isHost: Boolean(state.live.currentSession && user && state.live.currentSession.host_user_id === user.id)
  };
}

function setJeopardyPlayMode(playMode) {
  const experience = state.experience;
  if (!experience || experience.type !== "jeopardy" || experience.started || state.live.currentSession) {
    return;
  }

  if (playMode === "multiplayer" && !guardMultiplayerAccess()) {
    return;
  }

  experience.playMode = playMode === "multiplayer" ? "multiplayer" : "solo";
  if (experience.playMode === "multiplayer") {
    refreshAlpacapardyLiveLobby();
  } else {
    resetAlpacapardyLiveState();
    renderLiveSurfaces();
  }
}

async function refreshAlpacapardyLiveLobby() {
  if (!guardMultiplayerAccess() || !alpacapardyLiveSupabaseService) {
    return;
  }

  try {
    await ensureLiveAuthSession();
    const client = getSupabaseClient();
    state.live.status = "loading";
    state.live.error = "";
    renderLiveSurfaces();
    const { data: sessions, error } = await alpacapardyLiveSupabaseService.listOpenSessions(client);
    if (error) {
      throw error;
    }
    state.live.openSessions = sessions || [];
    state.live.status = "idle";
    subscribeAlpacapardyLobby();
    startAlpacapardyLiveSync();
  } catch (error) {
    state.live.status = "idle";
    state.live.error = error.message || "Unable to load live rooms.";
  }

  renderLiveSurfaces();
}

function subscribeAlpacapardyLobby() {
  const client = getSupabaseClient();
  if (!client || state.live.lobbyChannel || !alpacapardyLiveSupabaseService) {
    return;
  }

  state.live.lobbyChannel = alpacapardyLiveSupabaseService.subscribeToLobby(client, {
    onSessionsChanged: () => refreshAlpacapardyLiveLobbySilently(),
    onPlayersChanged: () => refreshAlpacapardyLiveLobbySilently()
  });
}

async function refreshAlpacapardyLiveLobbySilently() {
  if (!canAccessMultiplayer() || !alpacapardyLiveSupabaseService || !hasAuthSession()) {
    return;
  }

  const client = getSupabaseClient();
  const { data: sessions, error } = await alpacapardyLiveSupabaseService.listOpenSessions(client);
  if (!error) {
    state.live.openSessions = sessions || [];
    renderLiveSurfaces();
  }
}

function startAlpacapardyLiveSync() {
  if (state.live.syncId) {
    return;
  }

  const sync = () => {
    syncAlpacapardyLiveNow({ renderAfter: true });
  };
  sync();
  state.live.syncId = window.setInterval(sync, LIVE_SYNC_INTERVAL_MS);
}

async function syncAlpacapardyLiveNow({ renderAfter = false } = {}) {
  if (
    state.live.syncBusy ||
    !canAccessMultiplayer() ||
    !alpacapardyLiveSupabaseService ||
    !hasAuthSession()
  ) {
    return;
  }

  if (!state.live.currentSession && state.ui.appShellMode !== "online") {
    return;
  }

  state.live.syncBusy = true;
  try {
    if (state.live.currentSession) {
      await refreshAlpacapardyLiveSessionState({ renderAfter });
      await maybeAutoRevealTimedLiveGame();
      await maybeAutoResolveTimedAlpaquiz();
    } else {
      await refreshAlpacapardyLiveLobbySilently();
    }
  } finally {
    state.live.syncBusy = false;
  }
}

async function maybeAutoRevealTimedLiveGame() {
  if (!getAlpacapardyLiveIdentityContext().isHost || getCurrentLiveGameType() !== "quiz") {
    return;
  }
  const arcadeState = getArcadeState("quiz");
  if (!arcadeState.started || arcadeState.finished || arcadeState.revealed) {
    return;
  }
  if (Number(arcadeState.revealAt || 0) > Date.now()) {
    return;
  }
  await emitLiveEvent({ type: "quiz.revealed", payload: {} });
}

async function maybeAutoResolveTimedAlpaquiz() {
  if (!getAlpacapardyLiveIdentityContext().isHost || getCurrentLiveGameType() !== "alpaquiz") {
    return;
  }
  const arcadeState = getArcadeState("alpaquiz");
  if (!arcadeState.started || arcadeState.finished || arcadeState.revealed || !arcadeState.buzzedUserId) {
    return;
  }
  if (arcadeState.pendingRevealAt && Number(arcadeState.pendingRevealAt) <= Date.now()) {
    await emitLiveEvent({ type: "alpaquiz.revealed", payload: {} });
    return;
  }
  if (!Number.isInteger(arcadeState.selectedIndex) && Number(arcadeState.answerDeadlineAt || 0) > 0 && Number(arcadeState.answerDeadlineAt) <= Date.now()) {
    await emitLiveEvent({
      type: "alpaquiz.answered",
      payload: {
        userId: arcadeState.buzzedUserId,
        optionIndex: -1
      }
    });
  }
}

async function refreshAlpacapardyLiveSessionState({ renderAfter = false } = {}) {
  if (!state.live.currentSession || !alpacapardyLiveSupabaseService || !hasAuthSession()) {
    return;
  }

  const client = getSupabaseClient();
  const sessionId = state.live.currentSession.id;
  const [sessionResponse, playersResponse, eventsResponse] = await Promise.all([
    alpacapardyLiveSupabaseService.fetchSession(client, sessionId),
    alpacapardyLiveSupabaseService.fetchPlayers(client, sessionId),
    alpacapardyLiveSupabaseService.fetchEventsSince(client, sessionId, state.live.revision)
  ]);

  let shouldRender = false;
  if (!sessionResponse.error && sessionResponse.data) {
    const previousStatus = state.live.currentSession?.status;
    state.live.currentSession = sessionResponse.data;
    state.live.selectedGameType = normalizeLiveGameType(sessionResponse.data.game_type);
    if (state.live.selectedGameType === "alpacapardy" && sessionResponse.data.settings) {
      applyAlpacapardyLiveSettings(sessionResponse.data.settings);
    }
    maybeStartLiveLaunchCountdown(previousStatus, sessionResponse.data);
    shouldRender = true;
  }

  if (!playersResponse.error) {
    state.live.players = (playersResponse.data || []).sort(compareLivePlayers);
    state.live.currentPlayer =
      state.live.players.find((player) => player.user_id === state.auth.session?.user?.id) ||
      state.live.currentPlayer;
    maybeAutoStartReadyLiveGame();
    shouldRender = true;
  }

  if (!eventsResponse.error) {
    (eventsResponse.data || []).forEach((event) => applyLiveEvent(event));
  } else if (eventsResponse.error.message) {
    state.live.error = eventsResponse.error.message;
  }

  if (renderAfter && shouldRender) {
    renderLiveSurfaces();
  }
}

async function createSelectedLiveGameRoom() {
  const gameType = getCurrentLiveGameType();
  if (gameType === "alpacapardy") {
    createAlpacapardyLiveRoom();
    return;
  }
  await createArcadeLiveRoom(gameType);
}

async function createArcadeLiveRoom(gameType) {
  if (!guardMultiplayerAccess() || !alpacapardyLiveSupabaseService) {
    return;
  }

  const game = LIVE_GAME_TYPES[gameType] || LIVE_GAME_TYPES.run;
  const selectedRunColor = gameType === "run" ? getLiveRunSetupColorId() : "";
  try {
    const session = await ensureLiveAuthSession();
    const client = getSupabaseClient();
    const user = session.user;
    state.live.status = "creating";
    state.live.error = "";
    state.live.message = `Creating ${game.label} room...`;
    renderLiveSurfaces();

    const created = await alpacapardyLiveSupabaseService.createSession(client, {
      gameType,
      hostUserId: user.id,
      maxPlayers: game.maxPlayers,
      settings: {
        gameType,
        label: game.label,
        allThemes: true,
        ...(selectedRunColor ? { runHostColor: selectedRunColor } : {})
      }
    });
    if (created.error) {
      throw created.error;
    }

    const joined = await alpacapardyLiveSupabaseService.joinSession(client, {
      sessionId: created.data.id,
      userId: user.id,
      displayName: getLiveDisplayName(),
      role: "host",
      teamIndex: 0,
      isGuest: isAnonymousUser(user)
    });
    if (joined.error) {
      throw joined.error;
    }

    state.live.currentSession = created.data;
    state.live.currentPlayer = joined.data;
    state.live.selectedGameType = "alpacapardy";
    state.live.onlineView = "game";
    state.live.arcadeState = createEmptyArcadeState(gameType);
    if (gameType === "run") {
      state.live.arcadeState.colorsByUserId = {
        [user.id]: selectedRunColor || getLiveRunSetupColorId()
      };
    }
    state.live.players = [joined.data];
    state.live.selectedGameType = gameType;
    state.live.revision = 0;
    state.live.status = "idle";
    state.live.message = `Waiting for alpacas to join. Room ${created.data.room_code}.`;
    subscribeAlpacapardySession(created.data.id);
    startAlpacapardyLiveHeartbeat();
    startAlpacapardyLiveSync();
    if (gameType === "run" && selectedRunColor) {
      await emitLiveEvent({
        type: "run.color_selected",
        payload: {
          userId: user.id,
          colorId: selectedRunColor
        }
      });
    }
    await refreshAlpacapardyLiveSessionState({ renderAfter: true });
    refreshAlpacapardyLiveLobbySilently();
  } catch (error) {
    state.live.status = "idle";
    state.live.error = error.message || `Unable to create ${game.label} room.`;
  }

  renderLiveSurfaces();
}

async function createAlpacapardyLiveRoom() {
  const experience = state.experience;
  if (!experience || experience.type !== "jeopardy" || experience.started || !guardMultiplayerAccess()) {
    return;
  }

  try {
    const session = await ensureLiveAuthSession();
    const client = getSupabaseClient();
    const user = session.user;
    state.live.status = "creating";
    state.live.error = "";
    state.live.message = "Creating live room...";
    renderLiveSurfaces();

    const created = await alpacapardyLiveSupabaseService.createSession(client, {
      hostUserId: user.id,
      maxPlayers: experience.setupTeamCount,
      settings: buildAlpacapardyLiveSettings(experience)
    });
    if (created.error) {
      throw created.error;
    }

    const joined = await alpacapardyLiveSupabaseService.joinSession(client, {
      sessionId: created.data.id,
      userId: user.id,
      displayName: getLiveDisplayName(),
      role: "host",
      teamIndex: 0,
      isGuest: isAnonymousUser(user)
    });
    if (joined.error) {
      throw joined.error;
    }

    state.live.currentSession = created.data;
    state.live.currentPlayer = joined.data;
    state.live.players = [joined.data];
    state.live.selectedGameType = "alpacapardy";
    state.live.onlineView = "game";
    state.live.revision = 0;
    state.live.status = "idle";
    state.live.message = `Waiting for alpacas to join. Room ${created.data.room_code}.`;
    subscribeAlpacapardySession(created.data.id);
    startAlpacapardyLiveHeartbeat();
    startAlpacapardyLiveSync();
    await refreshAlpacapardyLiveSessionState({ renderAfter: true });
    refreshAlpacapardyLiveLobbySilently();
  } catch (error) {
    state.live.status = "idle";
    state.live.error = error.message || "Unable to create live room.";
  }

  renderLiveSurfaces();
}

async function joinAlpacapardyLiveRoom(sessionId) {
  const experience = state.experience;
  if (!guardMultiplayerAccess()) {
    return;
  }

  try {
    const authSession = await ensureLiveAuthSession();
    const client = getSupabaseClient();
    state.live.status = "joining";
    state.live.error = "";
    state.live.message = "Joining live room...";
    renderLiveSurfaces();

    const sessionResponse = await alpacapardyLiveSupabaseService.fetchSession(client, sessionId);
    if (sessionResponse.error) {
      throw sessionResponse.error;
    }
    const liveSession = sessionResponse.data;
    if (!liveSession || liveSession.status !== "lobby" || liveSession.is_open === false) {
      throw new Error("This room is no longer open.");
    }
    const gameType = normalizeLiveGameType(liveSession.game_type);
    if (gameType === "alpacapardy" && (!experience || experience.type !== "jeopardy" || experience.started)) {
      throw new Error("Alpacapardy setup is not ready.");
    }

    const players = liveSession.players || [];
    const teamIndex = alpacapardyLiveSupabaseService.findNextTeamIndex(players, liveSession.max_players);
    if (teamIndex < 0) {
      throw new Error("This room is already full.");
    }

    const joined = await alpacapardyLiveSupabaseService.joinSession(client, {
      sessionId: liveSession.id,
      userId: authSession.user.id,
      displayName: getLiveDisplayName(),
      role: "player",
      teamIndex,
      isGuest: isAnonymousUser(authSession.user)
    });
    if (joined.error) {
      throw joined.error;
    }

    state.live.currentSession = liveSession;
    state.live.currentPlayer = joined.data;
    state.live.selectedGameType = gameType;
    state.live.onlineView = "game";
    state.live.arcadeState = gameType === "alpacapardy" ? null : createEmptyArcadeState(gameType);
    state.live.players = players
      .filter((player) => player.user_id !== authSession.user.id)
      .concat(joined.data)
      .sort(compareLivePlayers);
    state.live.revision = 0;
    state.live.status = "idle";
    state.live.message = `Joined room ${liveSession.room_code}. Waiting for the host.`;
    if (gameType === "alpacapardy") {
      applyAlpacapardyLiveSettings(liveSession.settings || {});
    }
    subscribeAlpacapardySession(liveSession.id);
    startAlpacapardyLiveHeartbeat();
    startAlpacapardyLiveSync();
    await refreshAlpacapardyLiveSessionState({ renderAfter: true });
  } catch (error) {
    state.live.status = "idle";
    state.live.error = error.message || "Unable to join live room.";
  }

  renderLiveSurfaces();
}

async function joinAlpacapardyLiveRoomByCode(formData) {
  if (!guardMultiplayerAccess() || !alpacapardyLiveSupabaseService) {
    return;
  }

  const roomCode = alpacapardyLiveSupabaseService.normalizeRoomCode(formData.get("room_code"));
  state.live.joinCodeDraft = roomCode;
  if (!roomCode) {
    state.live.error = "Enter a room code.";
    render();
    return;
  }

  try {
    await ensureLiveAuthSession();
    const client = getSupabaseClient();
    state.live.status = "joining";
    state.live.error = "";
    state.live.message = `Looking for room ${roomCode}...`;
    render();

    const response = await alpacapardyLiveSupabaseService.findSessionByRoomCode(client, roomCode);
    if (response.error) {
      throw response.error;
    }
    if (!response.data) {
      throw new Error(`No open room found for ${roomCode}.`);
    }

    await joinAlpacapardyLiveRoom(response.data.id);
    state.live.joinCodeDraft = "";
  } catch (error) {
    state.live.status = "idle";
    state.live.error = error.message || "Unable to join that room.";
    render();
  }
}

function buildAlpacapardyLiveSettings(experience) {
  return {
    setupTeamCount: experience.setupTeamCount,
    setupCategoryIds: experience.setupCategoryIds || [],
    selectionLens: state.selection.lens,
    targetId: state.selection.targetId,
    targetIds: state.selection.targetIds || []
  };
}

function applyAlpacapardyLiveSettings(settings = {}) {
  const experience = state.experience;
  if (!experience || experience.type !== "jeopardy") {
    return;
  }

  if (Number.isInteger(settings.setupTeamCount)) {
    experience.setupTeamCount = settings.setupTeamCount;
  }
  if (Array.isArray(settings.setupCategoryIds) && settings.setupCategoryIds.length) {
    experience.setupCategoryIds = settings.setupCategoryIds.slice(0, GAME_CONFIG.jeopardyMinGroups);
  }
}

async function syncAlpacapardyLiveSettings() {
  if (!state.live.currentSession || !getAlpacapardyLiveIdentityContext().isHost) {
    return;
  }

  const client = getSupabaseClient();
  const response = await alpacapardyLiveSupabaseService.updateSession(client, state.live.currentSession.id, {
    max_players: state.experience.setupTeamCount,
    settings: buildAlpacapardyLiveSettings(state.experience)
  });
  if (!response.error) {
    state.live.currentSession = response.data;
  }
}

function subscribeAlpacapardySession(sessionId) {
  const client = getSupabaseClient();
  if (!client || !sessionId || !alpacapardyLiveSupabaseService) {
    return;
  }

  if (state.live.sessionChannel) {
    alpacapardyLiveSupabaseService.removeChannel(client, state.live.sessionChannel);
  }

  state.live.sessionChannel = alpacapardyLiveSupabaseService.subscribeToSession(client, sessionId, {
    onEvent: (event) => {
      applyLiveEvent(event);
      syncAlpacapardyLiveNow({ renderAfter: true });
    },
    onPlayersChanged: () => {
      refreshAlpacapardyLivePlayers();
      syncAlpacapardyLiveNow({ renderAfter: true });
    },
    onSessionChanged: (session) => {
      const previousStatus = state.live.currentSession?.status;
      state.live.currentSession = session;
      state.live.selectedGameType = normalizeLiveGameType(session.game_type);
      if (normalizeLiveGameType(session.game_type) === "alpacapardy" && session.settings) {
        applyAlpacapardyLiveSettings(session.settings);
      }
      maybeStartLiveLaunchCountdown(previousStatus, session);
      syncAlpacapardyLiveNow({ renderAfter: true });
      renderLiveSurfaces();
    }
  });
}

async function refreshAlpacapardyLivePlayers() {
  if (!state.live.currentSession || !alpacapardyLiveSupabaseService) {
    return;
  }

  const client = getSupabaseClient();
  const { data: players, error } = await alpacapardyLiveSupabaseService.fetchPlayers(client, state.live.currentSession.id);
  if (error) {
    return;
  }

  state.live.players = (players || []).sort(compareLivePlayers);
  state.live.currentPlayer = state.live.players.find((player) => player.user_id === state.auth.session?.user?.id) || state.live.currentPlayer;
  maybeAutoStartReadyLiveGame();
  renderLiveSurfaces();
}

function startAlpacapardyLiveHeartbeat() {
  clearAlpacapardyLiveHeartbeat();
  const beat = async () => {
    if (!state.live.currentSession || !state.live.currentPlayer || !alpacapardyLiveSupabaseService) {
      return;
    }

    const client = getSupabaseClient();
    await alpacapardyLiveSupabaseService.heartbeatPlayer(client, state.live.currentPlayer.id);
    if (getAlpacapardyLiveIdentityContext().isHost) {
      const response = await alpacapardyLiveSupabaseService.heartbeatHost(client, state.live.currentSession.id);
      if (!response.error && response.data) {
        state.live.currentSession = response.data;
      }
    }
  };

  beat();
  state.live.heartbeatId = window.setInterval(beat, 25000);
}

function maybeStartLiveLaunchCountdown(previousStatus, session) {
  if (
    !session ||
    session.status !== "playing" ||
    previousStatus === "playing" ||
    state.live.launchCountdownSessionId === session.id
  ) {
    return;
  }

  startLiveLaunchCountdown(session.id);
}

function startLiveLaunchCountdown(sessionId) {
  clearLiveLaunchCountdown();
  state.live.launchCountdownSessionId = sessionId;
  const steps = ["3", "2", "1", "Let's go"];
  let index = 0;

  const advance = () => {
    state.live.launchCountdownText = steps[index] || "";
    renderLiveSurfaces();
    index += 1;
    if (index <= steps.length) {
      liveLaunchCountdownTimerId = window.setTimeout(advance, index === steps.length ? 1000 : 850);
      return;
    }
    state.live.launchCountdownText = "";
    liveLaunchCountdownTimerId = null;
    renderLiveSurfaces();
  };

  advance();
}

function maybeAutoStartReadyLiveGame() {
  if (
    state.live.autoStartBusy ||
    !state.live.currentSession ||
    state.live.currentSession.status !== "lobby" ||
    !getAlpacapardyLiveIdentityContext().isHost
  ) {
    return;
  }

  const gameType = getCurrentLiveGameType();
  const canStart = gameType === "alpacapardy"
    ? getAlpacapardyLiveRenderContext().canStart
    : canStartSelectedLiveGame();
  if (!canStart) {
    return;
  }

  state.live.autoStartBusy = true;
  window.setTimeout(async () => {
    if (!state.live.currentSession || state.live.currentSession.status !== "lobby") {
      state.live.autoStartBusy = false;
      return;
    }
    if (getCurrentLiveGameType() === "alpacapardy") {
      await startAlpacapardyLiveGame();
    } else {
      await startSelectedLiveGame();
    }
    state.live.autoStartBusy = false;
  }, 900);
}

function compareLivePlayers(left, right) {
  return Number(left.team_index ?? 99) - Number(right.team_index ?? 99) ||
    String(left.display_name || "").localeCompare(String(right.display_name || ""));
}

async function syncAlpacapardyLiveEvents() {
  if (!state.live.currentSession || !alpacapardyLiveSupabaseService) {
    return;
  }

  const client = getSupabaseClient();
  const { data: events, error } = await alpacapardyLiveSupabaseService.fetchEventsSince(
    client,
    state.live.currentSession.id,
    state.live.revision
  );
  if (error) {
    state.live.error = error.message;
    return;
  }

  (events || []).forEach((event) => applyLiveEvent(event));
}

function applyLiveEvent(row) {
  if (!row || row.revision <= state.live.revision) {
    return;
  }

  if (String(row.event_type || "").startsWith("alpacapardy.")) {
    applyAlpacapardyLiveEvent(row);
    return;
  }

  applyArcadeLiveEvent(row);
}

function applyAlpacapardyLiveEvent(row) {
  if (!row || !alpacapardyLive || row.revision <= state.live.revision) {
    return;
  }

  const liveState = alpacapardyLive.reduce(extractAlpacapardyLiveState(state.experience), {
    type: row.event_type,
    payload: row.payload || {}
  }, {
    afterFinished: (nextState) => {
      finalizeSessionStats(nextState.answers, getBestStreakFromAnswers(nextState.answers), {
        type: "jeopardy",
        score: getHighestTeamScore(nextState.teams),
        teamOneScore: Number(nextState.teams[0]?.score) || 0
      });
    }
  });

  state.live.revision = row.revision;
  mergeAlpacapardyLiveState(liveState);
  render();
  if (state.experience?.active && !state.experience.active.revealed) {
    startJeopardyTimer();
  }
}

function extractAlpacapardyLiveState(experience) {
  return alpacapardyLive.createState({
    board: experience?.board || [],
    teams: experience?.teams || [],
    activeTeamIndex: experience?.activeTeamIndex || 0,
    active: experience?.active || null,
    answers: experience?.answers || [],
    chat: experience?.chat || [],
    finished: experience?.finished || false,
    forfeit: experience?.forfeit || null
  });
}

function mergeAlpacapardyLiveState(liveState) {
  const experience = state.experience;
  if (!experience || experience.type !== "jeopardy") {
    return;
  }

  experience.started = liveState.started;
  experience.finished = liveState.finished;
  experience.board = liveState.board || [];
  experience.teams = liveState.teams || [];
  experience.activeTeamIndex = liveState.activeTeamIndex || 0;
  experience.active = liveState.active || null;
  experience.answers = liveState.answers || [];
  experience.chat = liveState.chat || experience.chat || [];
  experience.forfeit = liveState.forfeit || null;
}

async function emitAlpacapardyLiveEvent(event) {
  return emitLiveEvent(event);
}

async function emitLiveEvent(event) {
  if (!state.live.currentSession || !state.live.currentPlayer || !event || !alpacapardyLiveSupabaseService) {
    return null;
  }

  const client = getSupabaseClient();
  const response = await alpacapardyLiveSupabaseService.appendEventWithNextRevision(client, {
    sessionId: state.live.currentSession.id,
    playerId: state.live.currentPlayer.id,
    type: event.type,
    payload: event.payload
  });

  if (response.error) {
    state.live.error = response.error.message;
    renderLiveSurfaces();
    return null;
  }

  applyLiveEvent(response.data);
  return response.data;
}

function applyArcadeLiveEvent(row) {
  const eventType = String(row.event_type || "");
  const gameType = normalizeLiveGameType(eventType.split(".")[0]);
  state.live.selectedGameType = gameType;
  state.live.arcadeState = reduceArcadeLiveState(getArcadeState(gameType), {
    type: eventType,
    payload: row.payload || {}
  });
  state.live.revision = row.revision;
  renderLiveSurfaces();
}

function reduceArcadeLiveState(currentState, event) {
  const next = clonePlain(currentState || createEmptyArcadeState(event.type.split(".")[0]));
  const payload = event.payload || {};
  const gameType = next.gameType;

  if (event.type.endsWith(".color_selected")) {
    next.colorsByUserId = {
      ...(next.colorsByUserId || {}),
      [payload.userId]: payload.colorId
    };
    return next;
  }

  if (event.type.endsWith(".started")) {
    return {
      ...createEmptyArcadeState(gameType),
      ...payload.state,
      gameType,
      started: true,
      finished: false
    };
  }

  if (gameType === "run") {
    return reduceLiveRunState(next, event);
  }
  if (gameType === "quiz") {
    return reduceLiveQuizState(next, event);
  }
  if (gameType === "race") {
    return reduceLiveRaceState(next, event);
  }
  if (gameType === "alpaquiz") {
    return reduceLiveAlpaquizState(next, event);
  }

  return next;
}

function reduceLiveRunState(stateValue, event) {
  const next = stateValue;
  const payload = event.payload || {};
  const userId = payload.userId;
  const progress = next.progress?.[userId] || { index: 0, stage: 0, score: 0 };
  const question = next.questionsByUserId?.[userId]?.[progress.index];

  if (event.type === "run.answered" && userId && question && !progress.revealed) {
    const correct = payload.optionIndex === question.answerIndex;
    next.progress = {
      ...(next.progress || {}),
      [userId]: {
        ...progress,
        selectedIndex: payload.optionIndex,
        revealed: true,
        lastCorrect: correct,
        stage: correct ? Math.min((progress.stage || 0) + 1, GAME_CONFIG.runRegionalLevelOneCount) : Math.max(0, (progress.stage || 0) - 1),
        score: (progress.score || 0) + (correct ? 1 : 0)
      }
    };
    return next;
  }

  if (event.type === "run.continued" && userId) {
    const updated = next.progress?.[userId] || progress;
    const nextIndex = (updated.index || 0) + 1;
    const finished = nextIndex >= (next.questionsByUserId?.[userId] || []).length ||
      (updated.stage || 0) >= GAME_CONFIG.runRegionalLevelOneCount;
    next.progress = {
      ...(next.progress || {}),
      [userId]: {
        ...updated,
        index: nextIndex,
        revealed: false,
        selectedIndex: null,
        lastCorrect: null,
        finished
      }
    };
    next.finished = Object.values(next.progress).some((entry) => entry.finished);
    next.winnerUserId = Object.entries(next.progress).sort((left, right) => (right[1].stage || 0) - (left[1].stage || 0))[0]?.[0] || null;
    return next;
  }

  return next;
}

function reduceLiveQuizState(stateValue, event) {
  const next = stateValue;
  const payload = event.payload || {};
  const question = next.questions?.[next.questionIndex];
  const answers = next.answers?.[next.questionIndex] || {};

  if (event.type === "quiz.answered" && payload.userId && question && !answers[payload.userId] && !next.revealed) {
    const correct = payload.optionIndex === question.answerIndex;
    next.answers = {
      ...(next.answers || {}),
      [next.questionIndex]: {
        ...answers,
        [payload.userId]: { optionIndex: payload.optionIndex, correct }
      }
    };
    next.scoresByUserId = {
      ...(next.scoresByUserId || {}),
      [payload.userId]: (next.scoresByUserId?.[payload.userId] || 0) + (correct ? 100 : 0)
    };
    return next;
  }

  if (event.type === "quiz.revealed") {
    next.revealed = true;
    return next;
  }

  if (event.type === "quiz.next_question") {
    if (next.questionIndex >= next.questions.length - 1) {
      next.finished = true;
      next.revealed = true;
      return next;
    }
    next.questionIndex += 1;
    next.revealed = false;
    next.revealAt = Number(payload.revealAt) || Date.now() + ((LIVE_GAME_TYPES.quiz.timerSeconds || 20) * 1000);
    return next;
  }

  return next;
}

function reduceLiveRaceState(stateValue, event) {
  const next = stateValue;
  const payload = event.payload || {};
  const question = next.questions?.[next.questionIndex];

  if (event.type === "race.answered" && payload.userId === next.activeUserId && question && !next.revealed && !next.finished) {
    const correct = payload.optionIndex === question.answerIndex;
    const lives = next.livesByUserId?.[payload.userId] ?? 3;
    const nextLives = correct ? lives : Math.max(0, lives - 1);
    next.selectedIndex = payload.optionIndex;
    next.lastCorrect = correct;
    next.revealed = true;
    next.livesByUserId = {
      ...(next.livesByUserId || {}),
      [payload.userId]: nextLives
    };
    if (nextLives <= 0) {
      next.finished = true;
      next.winnerUserId = (next.playerOrder || []).find((userId) => userId !== payload.userId) || null;
    }
    return next;
  }

  if (event.type === "race.next_turn" && !next.finished) {
    const order = next.playerOrder || [];
    const currentIndex = Math.max(0, order.indexOf(next.activeUserId));
    next.activeUserId = order[(currentIndex + 1) % Math.max(1, order.length)] || next.activeUserId;
    next.questionIndex = (next.questionIndex + 1) % Math.max(1, next.questions.length);
    next.revealed = false;
    next.selectedIndex = null;
    next.lastCorrect = null;
    return next;
  }

  return next;
}

function reduceLiveAlpaquizState(stateValue, event) {
  const next = stateValue;
  const payload = event.payload || {};
  const question = next.questions?.[next.questionIndex];

  if (event.type === "alpaquiz.buzzed" && payload.userId && !next.buzzedUserId && !next.revealed) {
    next.buzzedUserId = payload.userId;
    next.answerDeadlineAt = Date.now() + ((LIVE_GAME_TYPES.alpaquiz.answerSeconds || 4) * 1000);
    next.selectedIndex = null;
    next.pendingRevealAt = null;
    return next;
  }

  if (event.type === "alpaquiz.answered" && payload.userId === next.buzzedUserId && question && !next.revealed && !Number.isInteger(next.selectedIndex)) {
    const correct = payload.optionIndex === question.answerIndex;
    next.selectedIndex = payload.optionIndex;
    next.lastCorrect = correct;
    next.pendingRevealAt = Date.now() + 2000;
    next.answerDeadlineAt = null;
    const scores = { ...(next.scoresByUserId || {}) };
    if (correct) {
      scores[payload.userId] = (scores[payload.userId] || 0) + 100;
    } else {
      (next.playerOrder || []).filter((userId) => userId !== payload.userId).forEach((userId) => {
        scores[userId] = (scores[userId] || 0) + 100;
      });
    }
    next.scoresByUserId = scores;
    return next;
  }

  if (event.type === "alpaquiz.revealed" && Number.isInteger(next.selectedIndex)) {
    next.revealed = true;
    next.pendingRevealAt = null;
    next.answerDeadlineAt = null;
    return next;
  }

  if (event.type === "alpaquiz.next_question") {
    if (next.questionIndex >= next.questions.length - 1) {
      next.finished = true;
      next.revealed = true;
      return next;
    }
    next.questionIndex += 1;
    next.buzzedUserId = null;
    next.selectedIndex = null;
    next.lastCorrect = null;
    next.answerDeadlineAt = null;
    next.pendingRevealAt = null;
    next.revealed = false;
    return next;
  }

  return next;
}

function canStartSelectedLiveGame() {
  if (!state.live.currentSession || !getAlpacapardyLiveIdentityContext().isHost) {
    return false;
  }
  const gameType = getCurrentLiveGameType();
  const game = LIVE_GAME_TYPES[gameType] || LIVE_GAME_TYPES.run;
  const players = getLivePlayablePlayers();
  if (players.length < game.minPlayers || players.length > game.maxPlayers) {
    return false;
  }
  return true;
}

async function startSelectedLiveGame() {
  const gameType = getCurrentLiveGameType();
  if (gameType === "alpacapardy") {
    startAlpacapardyLiveGame();
    return;
  }
  if (!canStartSelectedLiveGame()) {
    state.live.error = `${getLiveGameLabel(gameType)} needs enough alpacas before starting.`;
    renderLiveSurfaces();
    return;
  }

  state.live.status = "starting";
  state.live.error = "";
  renderLiveSurfaces();

  const players = getLivePlayablePlayers();
  const statePayload = buildArcadeStartState(gameType, players);
  const event = await emitLiveEvent({
    type: `${gameType}.started`,
    payload: { state: statePayload }
  });

  if (!event) {
    state.live.status = "idle";
    renderLiveSurfaces();
    return;
  }

  const client = getSupabaseClient();
  const updated = await alpacapardyLiveSupabaseService.updateSession(client, state.live.currentSession.id, {
    status: "playing",
    is_open: false,
    current_state: statePayload,
    settings: {
      ...(state.live.currentSession.settings || {}),
      gameType,
      allThemes: true
    }
  });
  if (!updated.error) {
    const previousStatus = state.live.currentSession?.status;
    state.live.currentSession = updated.data;
    maybeStartLiveLaunchCountdown(previousStatus, updated.data);
  } else {
    state.live.error = updated.error.message || "Unable to start live game.";
  }
  await refreshAlpacapardyLiveSessionState({ renderAfter: true });
  state.live.status = "idle";
  renderLiveSurfaces();
}

function getLiveRunColorAssignments(players) {
  const existing = { ...(getArcadeState("run").colorsByUserId || {}) };
  const assignments = {};
  const used = new Set();
  const palette = LIVE_ALPACA_COLORS.map((color) => color.id);
  const fallbackColor = palette[0] || "cream";
  const currentUserId = state.auth.session?.user?.id || "";
  const hostUserId = state.live.currentSession?.host_user_id || currentUserId;
  const preferredByUserId = {
    ...(hostUserId ? { [hostUserId]: getLiveRunSetupColorId() } : {}),
    ...(currentUserId ? { [currentUserId]: getLiveRunSetupColorId() } : {})
  };

  players.forEach((player) => {
    const preferred = existing[player.user_id] || preferredByUserId[player.user_id] || "";
    const colorId = palette.includes(preferred) && !used.has(preferred)
      ? preferred
      : palette.find((candidate) => !used.has(candidate)) || fallbackColor;
    assignments[player.user_id] = colorId;
    used.add(colorId);
  });

  return assignments;
}

function buildArcadeStartState(gameType, players) {
  const playerOrder = players.map((player) => player.user_id);
  const scoresByUserId = Object.fromEntries(playerOrder.map((userId) => [userId, 0]));
  if (gameType === "run") {
    const questionsByUserId = Object.fromEntries(players.map((player, index) => [
      player.user_id,
      buildAllThemeQuestionSequence([1, 1, 2, 2, 3, 3, 4, 4, 5, 5], true, index)
    ]));
    return {
      ...getArcadeState("run"),
      gameType,
      started: true,
      colorsByUserId: getLiveRunColorAssignments(players),
      questionsByUserId,
      progress: Object.fromEntries(playerOrder.map((userId) => [userId, { index: 0, stage: 0, score: 0, revealed: false }])),
      playerOrder
    };
  }

  if (gameType === "quiz") {
    return {
      gameType,
      started: true,
      finished: false,
      questionIndex: 0,
      revealed: false,
      revealAt: Date.now() + ((LIVE_GAME_TYPES.quiz.timerSeconds || 20) * 1000),
      questions: buildAllThemeQuestionSequence([1, 2, 3, 4, 5, 1, 2, 3, 4, 5], true),
      answers: {},
      scoresByUserId,
      playerOrder
    };
  }

  if (gameType === "race") {
    return {
      gameType,
      started: true,
      finished: false,
      questionIndex: 0,
      activeUserId: playerOrder[0],
      playerOrder,
      questions: buildAllThemeQuestionSequence(Array.from({ length: 24 }, (_, index) => (index % 5) + 1), true),
      livesByUserId: Object.fromEntries(playerOrder.map((userId) => [userId, 3])),
      scoresByUserId
    };
  }

  return {
    gameType: "alpaquiz",
    started: true,
    finished: false,
    questionIndex: 0,
    questions: buildAllThemeQuestionSequence(Array.from({ length: LIVE_GAME_TYPES.alpaquiz.questionCount }, (_, index) => (index % 5) + 1), true),
    scoresByUserId,
    playerOrder,
    buzzedUserId: null,
    answerDeadlineAt: null,
    pendingRevealAt: null,
    selectedIndex: null,
    lastCorrect: null,
    revealed: false
  };
}

function buildAllThemeQuestionSequence(pattern, allowReuse = true, salt = 0) {
  const pools = buildRawQuestionPoolsFromEntries(getRawEntriesForRouteSelection("section", "all"));
  const rotatedPattern = pattern.slice(salt).concat(pattern.slice(0, salt));
  return buildPatternQuestionSequence(rotatedPattern, pools, allowReuse);
}

async function selectLiveAlpacaColor(colorId) {
  if (getCurrentLiveGameType() !== "run" || !state.live.currentPlayer) {
    return;
  }
  const color = LIVE_ALPACA_COLORS.find((entry) => entry.id === colorId);
  if (!color) {
    return;
  }
  const colors = getArcadeState("run").colorsByUserId || {};
  const usedByOther = Object.entries(colors).some(([userId, usedColor]) =>
    userId !== state.auth.session?.user?.id && usedColor === colorId
  );
  if (usedByOther) {
    return;
  }
  await emitLiveEvent({
    type: "run.color_selected",
    payload: {
      userId: state.auth.session?.user?.id || null,
      colorId
    }
  });
}

async function answerSelectedLiveGame(optionIndex) {
  const gameType = getCurrentLiveGameType();
  const userId = state.auth.session?.user?.id || null;
  if (!userId || !Number.isInteger(optionIndex)) {
    return;
  }

  const arcadeState = getArcadeState(gameType);
  if (gameType === "run") {
    const progress = arcadeState.progress?.[userId] || {};
    if (progress.revealed || progress.finished) {
      return;
    }
  }
  if (gameType === "quiz" && (arcadeState.revealed || arcadeState.answers?.[arcadeState.questionIndex]?.[userId])) {
    return;
  }
  if (gameType === "race" && (arcadeState.activeUserId !== userId || arcadeState.revealed || arcadeState.finished)) {
    return;
  }
  if (gameType === "alpaquiz" && (
    arcadeState.buzzedUserId !== userId ||
    arcadeState.revealed ||
    arcadeState.finished ||
    Number.isInteger(arcadeState.selectedIndex)
  )) {
    return;
  }

  await emitLiveEvent({
    type: `${gameType}.answered`,
    payload: {
      userId,
      optionIndex
    }
  });
}

async function advanceSelectedLiveGame() {
  const gameType = getCurrentLiveGameType();
  const arcadeState = getArcadeState(gameType);
  const userId = state.auth.session?.user?.id || null;
  if (gameType === "run") {
    await emitLiveEvent({ type: "run.continued", payload: { userId } });
    return;
  }
  if (gameType === "quiz") {
    await emitLiveEvent({
      type: arcadeState.revealed ? "quiz.next_question" : "quiz.revealed",
      payload: arcadeState.revealed ? { revealAt: Date.now() + ((LIVE_GAME_TYPES.quiz.timerSeconds || 20) * 1000) } : {}
    });
    return;
  }
  if (gameType === "race") {
    await emitLiveEvent({ type: "race.next_turn", payload: {} });
    return;
  }
  if (gameType === "alpaquiz") {
    await emitLiveEvent({ type: "alpaquiz.next_question", payload: {} });
  }
}

async function buzzSelectedLiveGame() {
  if (getCurrentLiveGameType() !== "alpaquiz") {
    return;
  }
  const userId = state.auth.session?.user?.id || null;
  const arcadeState = getArcadeState("alpaquiz");
  if (!userId || arcadeState.buzzedUserId || arcadeState.revealed || arcadeState.finished) {
    return;
  }
  await emitLiveEvent({ type: "alpaquiz.buzzed", payload: { userId } });
}

function getArcadeLeaderboard(arcadeState, players) {
  return players.map((player) => ({
    userId: player.user_id,
    name: player.display_name,
    score: Number(arcadeState.scoresByUserId?.[player.user_id]) || 0
  })).sort((left, right) => right.score - left.score || left.name.localeCompare(right.name));
}

function clonePlain(value) {
  return JSON.parse(JSON.stringify(value || {}));
}

async function startAlpacapardyLiveGame() {
  const experience = state.experience;
  if (!isAlpacapardyLiveActive() || !getAlpacapardyLiveIdentityContext().isHost || experience.started) {
    return;
  }

  try {
    state.live.status = "starting";
    state.live.error = "";
    renderLiveSurfaces();
    await refreshAlpacapardyLiveSessionState({ renderAfter: true });
    if (experience.started) {
      state.live.status = "idle";
      renderLiveSurfaces();
      return;
    }

    const players = state.live.players.filter((player) => ["host", "player"].includes(player.role)).sort(compareLivePlayers);
    if (players.length < 2 || players.length > GAME_CONFIG.jeopardyMaxTeams) {
      state.live.status = "idle";
      state.live.error = "Live Alpacapardy needs 2 to 4 players.";
      renderLiveSurfaces();
      return;
    }

    const board = buildConfiguredJeopardyBoard(experience.setupCategoryIds);
    const teams = alpacapardyEngine.createTeamsFromPlayers(players);
    const startedEvent = await emitAlpacapardyLiveEvent(alpacapardyLive.createBoardStartedEvent({ board, teams, activeTeamIndex: 0 }));
    if (!startedEvent) {
      state.live.status = "idle";
      renderLiveSurfaces();
      return;
    }

    const client = getSupabaseClient();
    const updated = await alpacapardyLiveSupabaseService.updateSession(client, state.live.currentSession.id, {
      status: "playing",
      is_open: false,
      board_state: { board },
      current_state: { activeTeamIndex: 0 },
      settings: buildAlpacapardyLiveSettings(experience)
    });
    if (!updated.error) {
      const previousStatus = state.live.currentSession?.status;
      state.live.currentSession = updated.data;
      state.live.selectedGameType = "alpacapardy";
      maybeStartLiveLaunchCountdown(previousStatus, updated.data);
    } else {
      state.live.error = updated.error.message || "Unable to mark the room as playing.";
    }
    await refreshAlpacapardyLiveSessionState({ renderAfter: true });
    state.live.status = "idle";
    renderLiveSurfaces();
  } catch (error) {
    state.live.status = "idle";
    state.live.error = error.message || "Unable to start Alpacapardy.";
    renderLiveSurfaces();
  }
}

async function sendAlpacapardyLiveChat(formData) {
  if (!isAlpacapardyLiveActive() || !state.live.currentPlayer) {
    return;
  }

  const message = String(formData.get("message") || "").trim();
  if (!message) {
    return;
  }

  await emitAlpacapardyLiveEvent(alpacapardyLive.createChatMessageEvent({
    playerId: state.live.currentPlayer.id,
    userId: state.auth.session?.user?.id || null,
    displayName: state.live.currentPlayer.display_name || getLiveDisplayName(),
    message
  }));
}

async function leaveAlpacapardyLiveRoom() {
  if (!state.live.currentSession || !state.live.currentPlayer || !alpacapardyLiveSupabaseService) {
    resetAlpacapardyLiveState();
    renderLiveSurfaces();
    return;
  }

  const client = getSupabaseClient();
  const userId = state.auth.session?.user?.id || null;
  const isHost = getAlpacapardyLiveIdentityContext().isHost;
  const gameType = getCurrentLiveGameType();
  const wasStarted = gameType === "alpacapardy"
    ? Boolean(state.experience?.started && !state.experience?.finished)
    : Boolean(state.live.currentSession?.status === "playing" && !state.live.arcadeState?.finished);

  try {
    if (isHost) {
      if (wasStarted) {
        const winner = state.live.players.find((player) => player.user_id !== userId && ["host", "player"].includes(player.role));
        if (winner && gameType === "alpacapardy") {
          await emitAlpacapardyLiveEvent(alpacapardyLive.createSessionForfeitedEvent({
            forfeitingUserId: userId,
            winnerUserId: winner.user_id,
            reason: "host_left"
          }));
        }
        await alpacapardyLiveSupabaseService.closeSession(client, state.live.currentSession.id, {
          status: "finished",
          reason: "host_left"
        });
      } else {
        await alpacapardyLiveSupabaseService.closeSession(client, state.live.currentSession.id, {
          status: "abandoned",
          reason: "host_left_lobby"
        });
      }
    } else {
      await alpacapardyLiveSupabaseService.leaveSession(client, state.live.currentPlayer.id);
    }
  } catch (error) {
    state.live.error = error.message || "Unable to leave room cleanly.";
  }

  resetAlpacapardyLiveState();
  if (state.experience?.type === "jeopardy") {
    const playMode = state.experience.playMode || "multiplayer";
    state.experience = buildJeopardyExperience();
    state.experience.playMode = playMode;
  }
  render();
}

function buildJeopardyBoard() {
  const selectionQuestions = getSelectionQuestions();
  const strategies = getJeopardyGroupingStrategies(selectionQuestions);

  for (const strategy of strategies) {
    const board = buildJeopardyBoardFromDefinitions(selectionQuestions, strategy.definitions, strategy.groupCount);
    if (board.length >= GAME_CONFIG.jeopardyMinGroups) {
      return board;
    }
  }

  return buildFallbackJeopardyBoard(selectionQuestions);
}

function getJeopardySetupOptions() {
  if (state.selection.lens === "subject") {
    return getActiveSubjectCatalog().map((subject) => ({
      id: subject.id,
      title: subject.label,
      mood: subject.mood || "wise",
      asset: getAssetValue(["contexts", "targets", "subject", subject.id])
    }));
  }

  if (state.selection.lens === "bigidea") {
    return BIG_IDEA_ROUTES.map((route) => ({
      id: route.id,
      title: route.label,
      mood: route.mood || "wise",
      asset: getAssetValue(["contexts", "targets", "bigidea", route.id])
    }));
  }

  return data.sections.map((section) => ({
    id: section.id,
    title: section.title,
    mood: "determined",
    asset: getAssetValue(["contexts", "targets", "section", section.id])
  }));
}

function getDefaultJeopardySetupCategoryIds() {
  const options = getJeopardySetupOptions();
  const selectedSectionIds = state.selection.lens === "section" ? getSelectedSectionIds() : [];
  if (selectedSectionIds.length) {
    const preferred = options.filter((option) => selectedSectionIds.includes(option.id));
    const fallback = options.filter((option) => !selectedSectionIds.includes(option.id));
    return preferred
      .concat(fallback)
      .slice(0, GAME_CONFIG.jeopardyMinGroups)
      .map((option) => option.id);
  }

  const preferred = state.selection.targetId && state.selection.targetId !== "all"
    ? options.filter((option) => option.id === state.selection.targetId)
    : [];
  const fallback = options.filter((option) => option.id !== state.selection.targetId);
  return preferred
    .concat(fallback)
    .slice(0, GAME_CONFIG.jeopardyMinGroups)
    .map((option) => option.id);
}

function getTargetSetupOptions() {
  return getJeopardySetupOptions();
}

function getDefaultTargetSetupCategoryIds() {
  return getDefaultJeopardySetupCategoryIds();
}

function getSetupTargetHeading() {
  return `Pick your targeted ${getLensCardPluralLabel(state.selection.lens)}`;
}

function getSetupTargetHelper(selectedCount) {
  const minimum = GAME_CONFIG.jeopardyMinGroups;
  return `${selectedCount} selected. Minimum ${minimum}.`;
}

function toggleSetupCategorySelection(experience, categoryId) {
  const current = new Set(experience.setupCategoryIds);
  if (current.has(categoryId)) {
    if (current.size <= GAME_CONFIG.jeopardyMinGroups) {
      return false;
    }
    current.delete(categoryId);
  } else {
    current.add(categoryId);
  }

  experience.setupCategoryIds = Array.from(current);
  return true;
}

function toggleRunSetupCategory(categoryId) {
  const experience = state.experience;
  if (!experience || experience.type !== "run" || experience.started) {
    return;
  }

  if (!toggleSetupCategorySelection(experience, categoryId)) {
    return;
  }

  renderExperience();
}

function startRunRoute() {
  const experience = state.experience;
  if (!experience || experience.type !== "run" || experience.started) {
    return;
  }

  if (experience.setupCategoryIds.length < GAME_CONFIG.jeopardyMinGroups) {
    return;
  }

  const runPlan = buildAlpacaRunQuestionPlan(getRawEntriesForRunSetupCategoryIds(experience.setupCategoryIds));
  if (runPlan.unavailableReason || !runPlan.mainQuestions?.length) {
    experience.unavailableReason = runPlan.unavailableReason || getUnavailableRawGameReason();
    renderExperience();
    return;
  }

  experience.mainQuestions = runPlan.mainQuestions || [];
  experience.yaleQuestions = runPlan.yaleQuestions || [];
  experience.currentQuestion = experience.mainQuestions[0] || null;
  experience.started = true;
  renderExperience();
}

function setJeopardyTeamCount(count) {
  const experience = state.experience;
  if (!experience || experience.type !== "jeopardy" || experience.started) {
    return;
  }

  if (
    experience.playMode === "multiplayer" &&
    state.live.currentSession &&
    (!getAlpacapardyLiveIdentityContext().isHost || state.live.players.length > 1)
  ) {
    return;
  }

  if (count < GAME_CONFIG.jeopardyMinTeams || count > GAME_CONFIG.jeopardyMaxTeams) {
    return;
  }

  experience.setupTeamCount = count;
  experience.teams = createJeopardyTeams(count);
  experience.activeTeamIndex = 0;
  if (experience.playMode === "multiplayer" && state.live.currentSession) {
    syncAlpacapardyLiveSettings();
  }
  renderLiveSurfaces();
}

function toggleJeopardySetupCategory(categoryId) {
  const experience = state.experience;
  if (!experience || experience.type !== "jeopardy" || experience.started) {
    return;
  }

  if (
    experience.playMode === "multiplayer" &&
    state.live.currentSession &&
    !getAlpacapardyLiveIdentityContext().isHost
  ) {
    return;
  }

  const current = new Set(experience.setupCategoryIds);
  if (current.has(categoryId)) {
    if (current.size === 1) {
      return;
    }
    current.delete(categoryId);
  } else if (current.size < GAME_CONFIG.jeopardyMinGroups) {
    current.add(categoryId);
  } else {
    return;
  }

  experience.setupCategoryIds = Array.from(current);
  if (experience.playMode === "multiplayer" && state.live.currentSession) {
    syncAlpacapardyLiveSettings();
  }
  renderLiveSurfaces();
}

function startJeopardyGame() {
  const experience = state.experience;
  if (!experience || experience.type !== "jeopardy" || experience.started) {
    return;
  }

  if (experience.playMode === "multiplayer") {
    return;
  }

  if (experience.setupCategoryIds.length !== GAME_CONFIG.jeopardyMinGroups) {
    return;
  }

  experience.started = true;
  experience.teams = createJeopardyTeams(experience.setupTeamCount);
  experience.board = buildConfiguredJeopardyBoard(experience.setupCategoryIds);
  experience.activeTeamIndex = 0;
  renderExperience();
}

function buildConfiguredJeopardyBoard(categoryIds) {
  return alpacapardyEngine.buildConfiguredBoard(categoryIds, {
    values: GAME_CONFIG.jeopardyValues,
    getQuestionsForCategory: (categoryId) => getQuestionsForRouteSelection(state.selection.lens, categoryId),
    getCategoryLabel: (categoryId) => getTargetLabelForLens(state.selection.lens, categoryId),
    selectionQuestions: getSelectionQuestions,
    shuffle
  });
}

function pickQuestionsForJeopardyCategory(pool, usedQuestionIds) {
  return alpacapardyEngine.pickQuestionsForCategory(pool, usedQuestionIds, {
    values: GAME_CONFIG.jeopardyValues,
    selectionQuestions: getSelectionQuestions,
    shuffle
  });
}

function getJeopardyGroupingStrategies(selectionQuestions) {
  const strategies = [];

  if (state.selection.lens === "section" && state.selection.targetId !== "all") {
    strategies.push({
      groupCount: GAME_CONFIG.jeopardyMinGroups,
      definitions: getJeopardySourceTypeDefinitions()
    });
  }

  if (state.selection.lens === "subject" && state.selection.targetId === "all") {
    strategies.push({
      groupCount: GAME_CONFIG.jeopardyMaxGroups,
      definitions: getSubjectCounts(selectionQuestions)
        .slice(0, GAME_CONFIG.jeopardyMaxGroups)
        .map((entry) => ({
          label: entry.label,
          match: (question) => question.subjectIds.includes(entry.id)
        }))
    });
  }

  strategies.push({
    groupCount: GAME_CONFIG.jeopardyMaxGroups,
    definitions: getSectionCounts(selectionQuestions)
      .slice(0, GAME_CONFIG.jeopardyMaxGroups)
      .map((entry) => ({
        label: entry.label,
        match: (question) => question.sectionId === entry.id
      }))
  });

  strategies.push({
    groupCount: GAME_CONFIG.jeopardyMinGroups,
    definitions: getJeopardySourceTypeDefinitions()
  });

  return strategies;
}

function getJeopardySourceTypeDefinitions() {
  return [
    {
      label: "Core Ideas",
      match: (question) => question.sourceType === "definition"
    },
    {
      label: "Examples",
      match: (question) => question.sourceType === "example"
    },
    {
      label: "Must-Know Points",
      match: (question) => question.sourceType === "point"
    },
    {
      label: "Keywords",
      match: (question) => question.sourceType === "keyword"
    }
  ];
}

function createJeopardyTile(question, index) {
  return alpacapardyEngine.createTile(question, index, GAME_CONFIG.jeopardyValues);
}

function buildJeopardyBoardFromDefinitions(selectionQuestions, definitions, groupCount) {
  return alpacapardyEngine.buildBoardFromDefinitions(selectionQuestions, definitions, groupCount, {
    values: GAME_CONFIG.jeopardyValues,
    shuffle
  });
}

function buildFallbackJeopardyBoard(selectionQuestions) {
  return alpacapardyEngine.buildFallbackBoard(selectionQuestions, {
    values: GAME_CONFIG.jeopardyValues,
    minGroups: GAME_CONFIG.jeopardyMinGroups,
    maxGroups: GAME_CONFIG.jeopardyMaxGroups,
    shuffle
  });
}

function openJeopardyTile(groupIndex, tileIndex) {
  const experience = state.experience;
  if (!experience || experience.type !== "jeopardy") {
    return;
  }

  if (isAlpacapardyLiveActive()) {
    if (!canOpenAlpacapardyLiveTile()) {
      return;
    }
    emitAlpacapardyLiveEvent(alpacapardyLive.createTileOpenedEvent({
      groupIndex,
      tileIndex,
      teamIndex: experience.activeTeamIndex,
      answerTime: GAME_CONFIG.jeopardyAnswerTime
    }));
    return;
  }

  if (experience.active) {
    return;
  }

  const tile = experience.board[groupIndex].tiles[tileIndex];
  if (!tile || tile.done) {
    return;
  }

  experience.active = {
    groupIndex,
    tileIndex,
    teamIndex: experience.activeTeamIndex,
    timeRemaining: GAME_CONFIG.jeopardyAnswerTime,
    revealed: false,
    selectedIndex: null,
    correct: false,
    timedOut: false
  };

  renderExperience();
  startJeopardyTimer();
}

function answerJeopardyQuestion(optionIndex) {
  const experience = state.experience;
  if (!experience || experience.type !== "jeopardy" || !experience.active || experience.active.revealed) {
    return;
  }

  if (isAlpacapardyLiveActive()) {
    if (!canAnswerAlpacapardyLiveFocus()) {
      return;
    }
    emitAlpacapardyLiveEvent(alpacapardyLive.createTileAnsweredEvent({ optionIndex, timedOut: false }));
    return;
  }

  resolveJeopardyQuestion(optionIndex, false);
}

function resolveJeopardyTimeout() {
  const experience = state.experience;
  if (!experience || experience.type !== "jeopardy" || !experience.active || experience.active.revealed) {
    clearJeopardyTimer();
    return;
  }

  if (isAlpacapardyLiveActive()) {
    clearJeopardyTimer();
    if (canAnswerAlpacapardyLiveFocus()) {
      emitAlpacapardyLiveEvent(alpacapardyLive.createTileAnsweredEvent({ optionIndex: null, timedOut: true }));
    }
    return;
  }

  resolveJeopardyQuestion(null, true);
}

function resolveJeopardyQuestion(optionIndex, timedOut) {
  const experience = state.experience;
  if (!experience || experience.type !== "jeopardy" || !experience.active || experience.active.revealed) {
    return;
  }

  clearJeopardyTimer();

  const active = experience.active;
  const tile = experience.board[active.groupIndex].tiles[active.tileIndex];
  const question = tile.question;
  const team = experience.teams[active.teamIndex];
  const isCorrect = !timedOut && optionIndex === question.answerIndex;

  active.revealed = true;
  active.selectedIndex = Number.isInteger(optionIndex) ? optionIndex : null;
  active.correct = isCorrect;
  active.timedOut = timedOut;
  tile.done = true;
  tile.teamIndex = active.teamIndex;
  tile.result = isCorrect ? "correct" : (timedOut ? "timeout" : "wrong");

  if (isCorrect) {
    team.score += tile.value;
    team.correct += 1;
  } else {
    team.wrong += 1;
  }

  experience.answers.push({
    questionId: question.id,
    sectionId: question.sectionId,
    subjectIds: question.subjectIds,
    bigIdeaIds: question.bigIdeaIds || [],
    isCorrect,
    teamId: team.id,
    teamLabel: team.label,
    timedOut
  });

  renderExperience();
}

function closeJeopardyFocus() {
  const experience = state.experience;
  if (!experience || experience.type !== "jeopardy") {
    return;
  }

  if (isAlpacapardyLiveActive()) {
    if (!canCloseAlpacapardyLiveFocus()) {
      return;
    }
    clearJeopardyTimer();
    emitAlpacapardyLiveEvent(alpacapardyLive.createFocusClosedEvent());
    return;
  }

  clearJeopardyTimer();
  const nextTeamIndex = experience.active ? (experience.active.teamIndex + 1) % experience.teams.length : experience.activeTeamIndex;
  experience.active = null;
  if (allJeopardyTilesDone(experience.board)) {
    experience.finished = true;
    finalizeSessionStats(experience.answers, getBestStreakFromAnswers(experience.answers), {
      type: "jeopardy",
      score: getHighestTeamScore(experience.teams),
      teamOneScore: Number(experience.teams[0]?.score) || 0
    });
  } else {
    experience.activeTeamIndex = nextTeamIndex;
  }

  render();
}

function createJeopardyTeams(count = GAME_CONFIG.jeopardyDefaultTeams) {
  return alpacapardyEngine.createTeams(count, getThemedTeamLabel);
}

function getJeopardyActiveTeam(experience) {
  return experience.teams[experience.activeTeamIndex] || experience.teams[0];
}

function getJeopardyStandings(teams) {
  return alpacapardyEngine.getStandings(teams);
}

function renderJeopardyTeams(experience) {
  return alpacapardyRenderer.renderTeams(experience, getAlpacapardyRenderHelpers());
}

function renderJeopardyCategoryHeader(label) {
  return alpacapardyRenderer.renderCategoryHeader(label, getAlpacapardyRenderHelpers());
}

function renderJeopardyTileFace(tile) {
  return alpacapardyRenderer.renderTileFace(tile, getAlpacapardyRenderHelpers());
}

function startJeopardyTimer() {
  clearJeopardyTimer();

  jeopardyTimerId = window.setInterval(() => {
    const experience = state.experience;
    if (!experience || experience.type !== "jeopardy" || !experience.active) {
      clearJeopardyTimer();
      return;
    }

    if (experience.active.revealed) {
      clearJeopardyTimer();
      return;
    }

    if (experience.active.timeRemaining <= 1) {
      resolveJeopardyTimeout();
      return;
    }

    experience.active.timeRemaining -= 1;
    renderExperiencePreservingScroll();
  }, 1000);
}

function chooseJeopardyTeam(teamIndex) {
  const experience = state.experience;
  if (!experience || experience.type !== "jeopardy" || experience.active) {
    return;
  }

  if (isAlpacapardyLiveActive()) {
    return;
  }

  if (teamIndex < 0 || teamIndex >= experience.teams.length) {
    return;
  }

  experience.activeTeamIndex = teamIndex;
  renderExperience();
}

function addJeopardyTeam() {
  const experience = state.experience;
  if (!experience || experience.type !== "jeopardy" || experience.active || experience.teams.length >= GAME_CONFIG.jeopardyMaxTeams) {
    return;
  }

  if (isAlpacapardyLiveActive()) {
    return;
  }

  const nextIndex = experience.teams.length;
  experience.teams.push({
    id: `team-${nextIndex + 1}`,
    label: getThemedTeamLabel(nextIndex),
    score: 0,
    correct: 0,
    wrong: 0
  });
  renderExperience();
}

function removeJeopardyTeam() {
  const experience = state.experience;
  if (!experience || experience.type !== "jeopardy" || experience.active || experience.teams.length <= GAME_CONFIG.jeopardyMinTeams) {
    return;
  }

  if (isAlpacapardyLiveActive()) {
    return;
  }

  experience.teams.pop();
  experience.activeTeamIndex = Math.min(experience.activeTeamIndex, experience.teams.length - 1);
  renderExperience();
}

function advanceJeopardyTeam() {
  const experience = state.experience;
  if (!experience || experience.type !== "jeopardy" || experience.active) {
    return;
  }

  if (isAlpacapardyLiveActive()) {
    return;
  }

  experience.activeTeamIndex = (experience.activeTeamIndex + 1) % experience.teams.length;
  renderExperience();
}

function renderJeopardyResults(experience) {
  return alpacapardyRenderer.renderResults(experience, getAlpacapardyRenderHelpers());
}

function createRelayTeams(count = GAME_CONFIG.relayDefaultTeams) {
  const bindings = RELAY_KEY_LAYOUTS[count];
  return bindings.map((binding, index) => ({
    id: `relay-team-${index + 1}`,
    label: getThemedTeamLabel(index),
    key: binding.key,
    keyLabel: binding.label,
    score: 0,
    correct: 0,
    wrong: 0
  }));
}

function syncRelayTeamBindings(experience) {
  const bindings = RELAY_KEY_LAYOUTS[experience.teams.length];
  experience.teams = experience.teams.map((team, index) => ({
    ...team,
    label: `Team ${index + 1}`,
    key: bindings[index].key,
    keyLabel: bindings[index].label
  }));
}

function getRelayStandings(teams) {
  return teams.slice().sort((left, right) =>
    right.score - left.score ||
    right.correct - left.correct ||
    left.wrong - right.wrong ||
    left.label.localeCompare(right.label)
  );
}

function renderRelayExperience() {
  const experience = state.experience;
  const question = experience.questions[experience.index];
  const questionSectionLabel = question && question.sectionId && sectionById[question.sectionId]
    ? sectionById[question.sectionId].originalTitle
    : (question ? (question.guidingSection || getTargetLabel()) : getTargetLabel());
  const buzzedTeam = Number.isInteger(experience.buzzedTeamIndex) ? experience.teams[experience.buzzedTeamIndex] : null;
  const leader = getRelayStandings(experience.teams)[0];
  const mascotMood = experience.revealed
    ? (experience.lastCorrect ? "excited" : "sad")
    : "thinking";

  if (experience.finished) {
    return renderRelayResults(experience);
  }

  if (experience.unavailableReason) {
    return `
      ${renderPanelTitle("Alpaquiz", "Buzz in first, claim the question, and move your team ahead.", "")}
      <div class="mode-shell">
        <article class="setup-card relay-setup-card">
          <div class="setup-card-header">
            ${renderConfiguredMascotAsset(
              getGameplayAssetPath("launch", "relay"),
              "thinking",
              "medium",
              { alt: "Relay unavailable alpaca" }
            )}
            <div>
              <p class="challenge-label">Route update pending</p>
              <h3>${escapeHtml(experience.unavailableReason)}</h3>
            </div>
          </div>
        </article>
      </div>
    `;
  }

  return `
    ${renderPanelTitle(
      "Alpaquiz",
      "Buzz first, claim the question, and move your team ahead.",
      experience.started
        ? `Route: ${getTargetLabel()} · Shared stop ${experience.index + 1} of ${experience.questions.length}`
        : `Route setup · ${getTargetLabel()}`
    )}
    <div class="mode-shell">
      <div class="mode-stats">
        <span>Correct answers score +${GAME_CONFIG.relayCorrectPoints}. Wrong turns or timeouts give +${GAME_CONFIG.relayCorrectPoints} to every other team.</span>
        <span>The first buzz takes control of the stop.</span>
        <span>The buzzing team has ${GAME_CONFIG.relayAnswerTime} seconds to answer.</span>
      </div>

      ${!experience.started ? `
        <section class="relay-team-shell">
          ${renderRelayOverlay()}
          <div class="relay-team-grid">
            ${experience.teams.map((team, index) => renderRelayTeamCard(team, index, experience, leader, {
              interactive: false,
              popup: false
            })).join("")}
          </div>
        </section>
        <article class="setup-card relay-setup-card relay-inline-setup-card">
          <div class="setup-card-header">
            ${renderConfiguredMascotAsset(
              getGameplayAssetPath("launch", "relay"),
              "excited",
              "medium",
              { alt: "Relay launch alpaca" }
            )}
            <div>
              <p class="challenge-label">Local multiplayer route</p>
              <h3>Choose the team count, read the rules, and launch the shared route.</h3>
            </div>
          </div>

          <div class="setup-block">
            <strong>How many teams are playing?</strong>
            <div class="setup-count-grid">
              ${Array.from({ length: GAME_CONFIG.relayMaxTeams - GAME_CONFIG.relayMinTeams + 1 }, (_, offset) => {
                const count = GAME_CONFIG.relayMinTeams + offset;
                return `
                  <button
                    class="setup-count-button ${experience.teams.length === count ? "active" : ""}"
                    type="button"
                    data-relay-set-teams="${count}"
                  >
                    ${count} teams
                  </button>
                `;
              }).join("")}
            </div>
          </div>

          <div class="setup-block">
            <strong>Team keys</strong>
            <div class="setup-rule-list">
              <p>${experience.teams.map((team) => `${team.label}: ${team.keyLabel}`).join(" · ")}</p>
            </div>
          </div>

          ${renderTargetSetupSelector(experience, "relay-toggle-category", "race-target-selector", "race-target-grid", "race-target-button")}

          <div class="panel-actions">
            <button class="button primary" data-relay-start ${experience.setupCategoryIds.length < GAME_CONFIG.jeopardyMinGroups ? "disabled" : ""}>En route</button>
          </div>
        </article>
      ` : renderGameQuestionPopup(`
        ${renderRelayPopupTeamSection(experience, leader)}
        <article class="challenge-card ${buzzedTeam || experience.revealed ? "relay-no-mascot" : ""}">
          ${!buzzedTeam && !experience.revealed ? `<aside class="challenge-mascot">
            ${renderConfiguredMascotAsset(
              getGameplayAssetPath("question", "relay"),
              mascotMood,
              "large",
              { alt: "Relay question alpaca", reviewBadge: getGameplayReviewBadge("question", "relay") }
            )}
            <span class="challenge-label">${escapeHtml(experience.revealed ? (experience.lastCorrect ? "shared checkpoint cleared" : "shared route interrupted") : getGamePromptLabel("relay", question))}</span>
            ${renderGameNotes(question, "relay", {
              index: experience.index,
              total: experience.questions.length,
              teamCount: experience.teams.length
            })}
          </aside>` : ""}

          <div class="challenge-copy">
            <div class="question-meta">
              <span class="meta-pill section">${escapeHtml(questionSectionLabel)}</span>
              ${renderQuestionSubjectPills(question)}
            </div>
            <h2>${escapeHtml(question.prompt)}</h2>

            ${!buzzedTeam && !experience.revealed ? `
              <div class="relay-buzz-banner">
                <strong>Buzz for this stop</strong>
                <p>The first team to hit its key takes control of this checkpoint.</p>
              </div>
            ` : ""}

            ${buzzedTeam || experience.revealed ? `
              <div class="relay-answer-status">
                ${renderRelayBuzzWinner("status")}
                <span>${buzzedTeam ? `${buzzedTeam.label} buzzed first and controls the stop.` : "Still in play."}</span>
              </div>
            ` : ""}

            ${buzzedTeam && !experience.revealed ? `
              <div class="relay-inline-timer">
                ${renderCompactRaceTimerCard(
                  "Answer timer",
                  experience.answerTimeRemaining,
                  GAME_CONFIG.relayAnswerTime,
                  getTimerVisualState(experience.answerTimeRemaining, GAME_CONFIG.relayAnswerTime, {
                    warningAt: 10,
                    dangerAt: 5
                  }),
                  "relay"
                )}
              </div>
            ` : ""}

            <div class="options-grid answer-options-grid">
              ${question.options.map((option, index) => {
                let classes = "option-button";
                const disabled = !buzzedTeam || experience.revealed;
                if (experience.revealed) {
                  if (index === question.answerIndex) {
                    classes += " correct";
                  } else if (index === experience.selectedIndex) {
                    classes += " wrong";
                  }
                  classes += " disabled";
                } else if (!buzzedTeam) {
                  classes += " disabled awaiting-buzz";
                }
                return `
                  <button class="${classes}" data-relay-option="${index}" ${disabled ? "disabled" : ""}>
                    ${renderOptionToken(index)}
                    <span>${escapeHtml(option)}</span>
                  </button>
                `;
              }).join("")}
            </div>
          </div>
        </article>
        ${experience.revealed ? `
          <article class="feedback-card relay-answer-popup ${experience.lastCorrect ? "correct" : "wrong"}">
            ${renderCheckpointVisual(experience.lastCorrect ? "success" : "fail")}
            <div>
              <h3>${escapeHtml(experience.lastCorrect
                ? `${buzzedTeam.label} clears the stop for ${GAME_CONFIG.relayCorrectPoints} points`
                : experience.lastAwardedTeamLabels?.length
                  ? `${formatRelayAwardedTeams(experience.lastAwardedTeamLabels)} ${experience.lastAwardedTeamLabels.length === 1 ? "takes" : "take"} the stop after ${buzzedTeam.label}'s ${experience.lastTimedOut ? "timeout" : "wrong turn"}`
                  : `${buzzedTeam.label} loses the stop`)}
              </h3>
              <p>${escapeHtml(question.explanation)}</p>
              <div class="feedback-actions">
                <button class="button primary" data-relay-continue>${experience.index === experience.questions.length - 1 ? "Final Standing" : "Next shared stop"}</button>
              </div>
            </div>
          </article>
        ` : ""}
      `, "relay", { showClose: false })}
    </div>
  `;
}

function renderRelayTeamCard(team, index, experience, leader, options = {}) {
  const active = index === experience.buzzedTeamIndex;
  const interactive = Boolean(options.interactive);
  const popup = Boolean(options.popup);
  const tag = interactive ? "button" : "div";
  const action = interactive ? `data-relay-buzz="${index}"` : "";

  return `
    <${tag}
      class="relay-team-card ${active ? "active" : ""} ${team.id === leader.id ? "leader" : ""} ${popup ? "popup" : ""}"
      ${action}
    >
      ${active ? renderRelayBuzzWinner("card") : ""}
      ${renderRelayTeamCardSkin()}
      ${renderRelayKeycap(team.keyLabel)}
      <span class="team-label">${escapeHtml(team.label)}</span>
      <strong class="relay-score">${team.score} pts</strong>
      <span class="relay-state">${team.correct} correct · ${team.wrong} wrong</span>
    </${tag}>
  `;
}

function renderRelayPopupTeamSection(experience, leader) {
  const buzzed = Number.isInteger(experience.buzzedTeamIndex);
  const visibleTeams = buzzed ? [experience.teams[experience.buzzedTeamIndex]] : experience.teams;

  if (buzzed) {
    return "";
  }

  return `
    <section class="relay-popup-team-shell">
      <div class="relay-popup-team-header">
        <div>
          <h3>Buzz in first to take the route</h3>
        </div>
        <button class="button secondary" type="button" data-replay-current>Take This Route Again</button>
      </div>
      <div class="relay-popup-team-grid">
        ${visibleTeams.map((team) => {
          const teamIndex = experience.teams.findIndex((entry) => entry.id === team.id);
          return renderRelayTeamCard(team, teamIndex, experience, leader, {
            interactive: !experience.revealed,
            popup: true
          });
        }).join("")}
      </div>
    </section>
  `;
}

function startRelayRoute() {
  const experience = state.experience;
  if (!experience || experience.type !== "relay" || experience.started || experience.unavailableReason) {
    return;
  }

  if (experience.setupCategoryIds.length < GAME_CONFIG.jeopardyMinGroups) {
    return;
  }

  const relayPlan = buildRelayQuestionSequence(
    experience.setupQuestionCount,
    getRawEntriesForRunSetupCategoryIds(experience.setupCategoryIds)
  );
  if (relayPlan.unavailableReason || !relayPlan.questions.length) {
    experience.unavailableReason = relayPlan.unavailableReason || getUnavailableRawGameReason();
    renderExperience();
    return;
  }

  experience.questions = relayPlan.questions;
  experience.index = 0;
  experience.started = true;
  experience.answerTimeRemaining = GAME_CONFIG.relayAnswerTime;
  renderExperience();
}

function toggleRelaySetupCategory(categoryId) {
  const experience = state.experience;
  if (!experience || experience.type !== "relay" || experience.started) {
    return;
  }

  if (!toggleSetupCategorySelection(experience, categoryId)) {
    return;
  }

  renderExperience();
}

function setRelayTeamCount(count) {
  const experience = state.experience;
  if (!experience || experience.type !== "relay" || experience.started) {
    return;
  }

  if (count < GAME_CONFIG.relayMinTeams || count > GAME_CONFIG.relayMaxTeams) {
    return;
  }

  experience.teams = createRelayTeams(count);
  renderExperience();
}

function setRelayQuestionCount(count) {
  const experience = state.experience;
  if (!experience || experience.type !== "relay" || experience.started) {
    return;
  }

  if (!GAME_CONFIG.relayQuestionOptions.includes(count)) {
    return;
  }

  experience.setupQuestionCount = count;
  renderExperience();
}

function buzzRelayTeam(teamIndex) {
  const experience = state.experience;
  if (
    !experience ||
    experience.type !== "relay" ||
    !experience.started ||
    experience.revealed ||
    experience.buzzedTeamIndex !== null ||
    teamIndex < 0 ||
    teamIndex >= experience.teams.length
  ) {
    return;
  }

  experience.buzzedTeamIndex = teamIndex;
  experience.answerTimeRemaining = GAME_CONFIG.relayAnswerTime;
  playRelayBuzzSound();
  renderExperience();
}

function answerRelayQuestion(optionIndex) {
  const experience = state.experience;
  if (
    !experience ||
    experience.type !== "relay" ||
    experience.revealed ||
    !Number.isInteger(experience.buzzedTeamIndex)
  ) {
    return;
  }

  const question = experience.questions[experience.index];
  const isCorrect = optionIndex === question.answerIndex;
  resolveRelayOutcome(optionIndex, isCorrect, false);
}

function getRelayAwardRecipients(experience, excludedIndex) {
  return experience.teams.filter((_, index) => index !== excludedIndex);
}

function formatRelayAwardedTeams(labels = []) {
  if (!labels.length) {
    return "";
  }

  if (labels.length === 1) {
    return labels[0];
  }

  if (labels.length === 2) {
    return `${labels[0]} and ${labels[1]}`;
  }

  return `${labels.slice(0, -1).join(", ")}, and ${labels[labels.length - 1]}`;
}

function resolveRelayOutcome(optionIndex, isCorrect, timedOut) {
  const experience = state.experience;
  if (!experience || experience.type !== "relay" || !Number.isInteger(experience.buzzedTeamIndex)) {
    return;
  }

  const team = experience.teams[experience.buzzedTeamIndex];
  const question = experience.questions[experience.index];
  const awardedTeams = isCorrect ? [team] : getRelayAwardRecipients(experience, experience.buzzedTeamIndex);
  const awardedTeamLabels = awardedTeams.map((entry) => entry.label);

  clearRelayAnswerTimer();
  experience.revealed = true;
  experience.lastCorrect = isCorrect;
  experience.lastTimedOut = timedOut;
  experience.lastAwardedTeamLabels = awardedTeamLabels;
  experience.selectedIndex = optionIndex;

  if (isCorrect) {
    team.score += GAME_CONFIG.relayCorrectPoints;
    team.correct += 1;
  } else {
    team.wrong += 1;
    awardedTeams.forEach((awardedTeam) => {
      awardedTeam.score += GAME_CONFIG.relayCorrectPoints;
    });
  }

  experience.answers.push({
    questionId: question.id,
    sectionId: question.sectionId,
    subjectIds: question.subjectIds,
    bigIdeaIds: question.bigIdeaIds || [],
    isCorrect,
    teamId: team.id,
    teamLabel: team.label,
    awardedTeamIds: awardedTeams.map((awardedTeam) => awardedTeam.id),
    awardedTeamLabels: awardedTeamLabels.slice(),
    timedOut
  });

  renderExperience();
}

function handleRelayTimeout() {
  const experience = state.experience;
  if (
    !experience ||
    experience.type !== "relay" ||
    experience.revealed ||
    !Number.isInteger(experience.buzzedTeamIndex)
  ) {
    return;
  }

  resolveRelayOutcome(null, false, true);
}

function advanceRelayQuestion() {
  const experience = state.experience;
  if (!experience || experience.type !== "relay") {
    return;
  }

  if (experience.index === experience.questions.length - 1) {
    experience.finished = true;
    finalizeSessionStats(experience.answers, getBestStreakFromAnswers(experience.answers), {
      type: "relay",
      score: getHighestTeamScore(experience.teams),
      teamOneScore: Number(experience.teams[0]?.score) || 0
    });
  } else {
    experience.index += 1;
    experience.buzzedTeamIndex = null;
    experience.answerTimeRemaining = GAME_CONFIG.relayAnswerTime;
    experience.revealed = false;
    experience.lastCorrect = null;
    experience.lastTimedOut = false;
    experience.lastAwardedTeamLabels = [];
    experience.selectedIndex = null;
  }

  render();
}

function addRelayTeam() {
  const experience = state.experience;
  if (
    !experience ||
    experience.type !== "relay" ||
    experience.revealed ||
    experience.buzzedTeamIndex !== null ||
    experience.teams.length >= GAME_CONFIG.relayMaxTeams
  ) {
    return;
  }

  experience.teams.push({
    id: `relay-team-${experience.teams.length + 1}`,
    label: getThemedTeamLabel(experience.teams.length),
    key: "",
    keyLabel: "",
    score: 0,
    correct: 0,
    wrong: 0
  });
  syncRelayTeamBindings(experience);
  renderExperience();
}

function removeRelayTeam() {
  const experience = state.experience;
  if (
    !experience ||
    experience.type !== "relay" ||
    experience.revealed ||
    experience.buzzedTeamIndex !== null ||
    experience.teams.length <= GAME_CONFIG.relayMinTeams
  ) {
    return;
  }

  experience.teams.pop();
  syncRelayTeamBindings(experience);
  renderExperience();
}

function renderRelayResults(experience) {
  const standings = getRelayStandings(experience.teams);
  const winner = standings[0];
  const resultVisual = renderConfiguredMascotAsset(
    getResultAssetPath("relay", "success"),
    "victory",
    "large",
    { alt: "Relay victory alpaca" }
  );

  return `
    ${renderPanelTitle("Final Standing", "Top team on the path.", `Route: ${getTargetLabel()} · ${experience.teams.length} teams`)}
    <article class="result-shell">
      <div class="result-banner">
        <div class="result-visual">${resultVisual}</div>
        <div>
          <p class="challenge-label">Leading team</p>
          <h2>${escapeHtml(winner.label)}</h2>
          <p>${escapeHtml(`${winner.score} points with ${winner.correct} cleared shared stops.`)}</p>
        </div>
      </div>

      <div class="result-metrics">
        ${renderMetricCard("Lead Team", winner.label)}
        ${renderMetricCard("Teams", String(experience.teams.length))}
        ${renderMetricCard("Final Score", String(winner.score))}
        ${renderMetricCard("Stops Played", String(experience.questions.length))}
      </div>

      <div class="jeopardy-standings">
        ${standings.map((team, index) => `
          <article class="jeopardy-standing-card ${index === 0 ? "winner" : ""}">
            <span class="team-label">${escapeHtml(team.label)}</span>
            <strong>${team.score}</strong>
            <span>${team.correct} correct · ${team.wrong} wrong</span>
          </article>
        `).join("")}
      </div>

      ${renderSelectedTargetBreakdown(experience.answers)}

      <div class="result-actions">
        <button class="button primary" data-replay-current>Take This Route Again</button>
      </div>
    </article>
  `;
}

function renderRelayOverlay() {
  const asset = getAssetValue(["multiplayer", "relayOverlay"]);
  return renderAssetImage(
    asset,
    "Relay mode decoration",
    "relay-overlay",
    "relay-overlay-image"
  );
}

function renderRelayTeamCardSkin() {
  const asset = getAssetValue(["multiplayer", "teamCardSkin"]);
  return renderAssetImage(
    asset,
    "Relay team card skin",
    "relay-team-card-skin",
    "relay-team-card-skin-image"
  );
}

function renderRelayKeycap(label) {
  const normalizedLabel = String(label || "").trim().toLowerCase();
  const asset = getAssetValue(["multiplayer", "keycaps", normalizedLabel]);

  if (!asset) {
    return `<span class="relay-keycap">${escapeHtml(String(label || ""))}</span>`;
  }

  return renderAssetImage(
    asset,
    `${String(label || "").toUpperCase()} keycap`,
    "relay-keycap",
    "relay-keycap-image"
  );
}

function renderRelayBuzzWinner(surface = "status") {
  const asset = getAssetValue(["multiplayer", "buzzWinner"]);
  return renderAssetImage(
    asset,
    "Buzz winner highlight",
    `relay-buzz-winner relay-buzz-winner-${surface}`,
    `relay-buzz-winner-image relay-buzz-winner-image-${surface}`
  );
}

function getRaceQuestionDuration(index) {
  return GAME_CONFIG.raceQuestionTime;
}

function startRelayAnswerTimer() {
  clearRelayAnswerTimer();

  relayAnswerTimerId = window.setInterval(() => {
    const experience = state.experience;
    if (
      !experience ||
      experience.type !== "relay" ||
      !experience.started ||
      experience.revealed ||
      !Number.isInteger(experience.buzzedTeamIndex)
    ) {
      clearRelayAnswerTimer();
      return;
    }

    if (experience.answerTimeRemaining <= 1) {
      experience.answerTimeRemaining = 0;
      handleRelayTimeout();
      return;
    }

    experience.answerTimeRemaining -= 1;
    renderExperiencePreservingScroll();
  }, 1000);
}

function startRaceTimer() {
  clearRaceTimer();

  raceTimerId = window.setInterval(() => {
    const experience = state.experience;
    if (!experience || experience.type !== "race" || experience.finished || experience.revealed) {
      clearRaceTimer();
      return;
    }

    if (experience.timeRemaining <= 1) {
      experience.elapsedTime += 1;
      experience.timeRemaining = 0;
      resolveRaceQuestion(null, true);
      return;
    }

    experience.elapsedTime += 1;
    experience.timeRemaining -= 1;
    renderExperiencePreservingScroll();
  }, 1000);
}

function startRunTimer() {
  clearRunTimer();

  runTimerId = window.setInterval(() => {
    const experience = state.experience;
    if (
      !experience ||
      experience.type !== "run" ||
      experience.unavailableReason ||
      !experience.currentQuestion ||
      experience.finished ||
      experience.revealed
    ) {
      clearRunTimer();
      return;
    }

    if (experience.timeRemaining <= 1) {
      experience.timeRemaining = 0;
      experience.failed = true;
      experience.finished = true;
      clearRunTimer();
      finalizeSessionStats(experience.answers, experience.correctCount, {
        type: "run",
        stage: getRunReachedStage(experience)
      });
      render();
      return;
    }

    experience.timeRemaining -= 1;
    if (!refreshRunTimerDisplay(experience)) {
      renderExperiencePreservingScroll();
    }
  }, 1000);
}

function formatCountdown(totalSeconds) {
  const seconds = Math.max(0, totalSeconds);
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${minutes}:${String(remainder).padStart(2, "0")}`;
}

function getRunCurrentStop(experience) {
  return experience.route[Math.min(experience.stage, experience.route.length - 1)];
}

function getRunNextStop(experience) {
  return experience.route[experience.stage + 1] || null;
}

function getRunRoundsBeforeYale(experience) {
  return Math.max(0, (experience.route.length - 1) - experience.stage);
}

function getRunPassedStopLabels(experience) {
  return experience.route
    .slice(0, Math.max(0, Math.min(experience.stage, experience.route.length - 1)))
    .map((stop) => stop.label);
}

function getRunStopRoundSuffix(stop) {
  if (!stop?.phase) {
    return "";
  }

  return ` - ${stop.phase}`;
}

function formatRunCurrentStopLabel(stop) {
  return `${stop.label}${getRunStopRoundSuffix(stop)}`;
}

function getRunMapTop(stop) {
  return `calc(${stop.y}% - var(--run-travel-marker-offset, 0px))`;
}

function renderRunMap(experience) {
  const route = experience.route;
  const currentStop = getRunCurrentStop(experience);

  return `
    <div class="run-map-stage">
      ${renderRunMapBackground()}
      ${route.map((stop, index) => renderRunMapStop(stop, index, experience.stage)).join("")}
      <div class="run-travel-marker" style="left:${currentStop.x}%; top:${getRunMapTop(currentStop)}">
        ${renderRunTravelMarker()}
      </div>
      ${renderRunStatusRow(experience)}
    </div>
  `;
}

function renderRunStatusRow(experience) {
  const goalStop = experience.route[experience.route.length - 1];
  const currentStop = getRunCurrentStop(experience);
  const nextStop = getRunNextStop(experience);

  return `
    <div class="run-status-row">
      <div class="run-status-card">
        <span>Current Stop</span>
        <strong>${escapeHtml(formatRunCurrentStopLabel(currentStop))}</strong>
      </div>
      <div class="run-status-card">
        <span>Next Destination</span>
        <strong>${escapeHtml(nextStop ? nextStop.label : goalStop.label)}</strong>
      </div>
      <div class="run-status-card">
        <span>Number of rounds before Yale</span>
        <strong>${getRunRoundsBeforeYale(experience)}</strong>
      </div>
    </div>
  `;
}

function renderRunMapBackground() {
  const asset = getAssetValue(["run", "mapBackground"]);
  if (asset) {
    return renderAssetImage(
      asset,
      "Alpaca Run world map background",
      "run-map-background",
      "run-map-background-image"
    );
  }

  return `<div class="run-map-placeholder" aria-hidden="true"></div>`;
}

function renderRunTravelMarker() {
  const asset = getAssetValue(["run", "travelMarker"]);
  if (asset) {
    return renderAssetImage(
      asset,
      "Alpaca Run travel marker",
      "run-travel-marker-slot",
      "run-travel-marker-image"
    );
  }

  return renderMascot("determined", "small", { alt: "Traveling alpaca" });
}

function renderRegionalStopMarkerSvg(state) {
  return `
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 96 96"
      width="96"
      height="96"
      fill="none"
      data-state="${escapeHtml(state)}"
      class="run-stop-svg run-stop-svg-regional"
      aria-hidden="true"
    >
      <defs>
        <style>
          .outer {
            fill: #fefaf2;
            stroke: #5a3726;
            stroke-width: 4;
          }

          .mid {
            fill: #802922;
          }

          .inner {
            fill: #fefaf2;
            stroke: #5a3726;
            stroke-width: 2.5;
          }

          .core {
            fill: #6d1f26;
          }

          .state-ring {
            fill: none;
            stroke: transparent;
            stroke-width: 3;
          }

          svg[data-state="current"] .state-ring {
            stroke: #fcd127;
          }

          svg[data-state="current"] .outer {
            stroke-width: 5;
          }

          svg[data-state="reached"] {
            opacity: 0.88;
          }

          svg[data-state="reached"] .core {
            fill: #802922;
          }
        </style>
      </defs>

      <circle class="state-ring" cx="48" cy="48" r="34"/>
      <circle class="outer" cx="48" cy="48" r="28"/>
      <circle class="mid" cx="48" cy="48" r="19"/>
      <circle class="inner" cx="48" cy="48" r="11"/>
      <circle class="core" cx="48" cy="48" r="4.5"/>
    </svg>
  `;
}

function renderGlobalRoundMarkerSvg() {
  return `
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 96 96"
      width="96"
      height="96"
      fill="none"
      class="run-stop-svg run-stop-svg-global"
      aria-hidden="true"
    >
      <defs>
        <style>
          .outer-gold { fill: #fefaf2; stroke: #fcd127; stroke-width: 5; }
          .outer-navy { fill: none; stroke: #5a3726; stroke-width: 2.5; opacity: 0.95; }
          .mid { fill: #6d1f26; }
          .inner { fill: #fefaf2; stroke: #802922; stroke-width: 2.5; }
          .core-gold { fill: #fcd127; }
          .tick { stroke: #fcd127; stroke-width: 2.5; stroke-linecap: round; }
        </style>
      </defs>

      <circle class="outer-gold" cx="48" cy="48" r="30"/>
      <circle class="outer-navy" cx="48" cy="48" r="24.5"/>
      <circle class="mid" cx="48" cy="48" r="18"/>
      <circle class="inner" cx="48" cy="48" r="10.5"/>
      <circle class="core-gold" cx="48" cy="48" r="4.5"/>
      <path class="tick" d="M48 11v6"/>
      <path class="tick" d="M48 79v6"/>
      <path class="tick" d="M11 48h6"/>
      <path class="tick" d="M79 48h6"/>
    </svg>
  `;
}

function renderYaleDestinationMarkerSvg() {
  return `
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 140 140"
      width="140"
      height="140"
      fill="none"
      class="run-stop-svg run-stop-svg-yale"
      aria-hidden="true"
    >
      <defs>
        <style>
          .gold-fill { fill: #fcd127; }
          .gold-stroke { stroke: #fcd127; }
          .navy-stroke { stroke: #5a3726; }
          .ring-outer {
            fill: #fefaf2;
            stroke: #fcd127;
            stroke-width: 6;
            vector-effect: non-scaling-stroke;
          }

          .ring-mid {
            fill: #6d1f26;
            stroke: #802922;
            stroke-width: 4;
            vector-effect: non-scaling-stroke;
          }

          .ring-inner {
            fill: #fefaf2;
            stroke: #5a3726;
            stroke-width: 3.5;
            vector-effect: non-scaling-stroke;
          }

          .crest-field {
            fill: #802922;
            stroke: #fcd127;
            stroke-width: 3;
            vector-effect: non-scaling-stroke;
          }

          .fine-line {
            stroke-width: 3;
            stroke-linecap: round;
            stroke-linejoin: round;
            fill: none;
            vector-effect: non-scaling-stroke;
          }

          .micro-line {
            stroke-width: 2.25;
            stroke-linecap: round;
            stroke-linejoin: round;
            fill: none;
            vector-effect: non-scaling-stroke;
          }
        </style>
      </defs>

      <circle class="ring-outer" cx="70" cy="70" r="46"/>
      <circle class="ring-mid" cx="70" cy="70" r="35"/>
      <circle class="ring-inner" cx="70" cy="70" r="24"/>

      <g class="gold-stroke fine-line" opacity="0.95">
        <path d="M70 9v10"/>
        <path d="M70 121v10"/>
        <path d="M9 70h10"/>
        <path d="M121 70h10"/>
      </g>

      <g class="gold-stroke micro-line" opacity="0.75">
        <path d="M28 28l6 6"/>
        <path d="M112 28l-6 6"/>
        <path d="M28 112l6-6"/>
        <path d="M112 112l-6-6"/>
      </g>

      <path
        class="crest-field"
        d="M70 45
           C77 45 83 47 87 51
           V66
           C87 79 78 88 70 93
           C62 88 53 79 53 66
           V51
           C57 47 63 45 70 45Z"
      />

      <g>
        <path
          fill="#fefaf2"
          d="M61 59
             C64 57 67 56 70 56
             C73 56 76 57 79 59
             V72
             C76 70.8 73 70 70 70
             C67 70 64 70.8 61 72V59Z"
        />
        <path class="navy-stroke micro-line" d="M70 57v13"/>
        <path class="navy-stroke micro-line" d="M61.5 60.5C64 59 66.8 58.3 70 58.3"/>
        <path class="navy-stroke micro-line" d="M78.5 60.5C76 59 73.2 58.3 70 58.3"/>
        <path class="gold-stroke micro-line" d="M62.5 75.5H77.5"/>
      </g>

      <circle class="gold-fill" cx="70" cy="100" r="5.5"/>
      <path class="gold-stroke fine-line" d="M70 88V94"/>

      <g fill="#fcd127" opacity="0.95">
        <circle cx="70" cy="24" r="2.8"/>
        <circle cx="24" cy="70" r="2.8"/>
        <circle cx="116" cy="70" r="2.8"/>
      </g>
    </svg>
  `;
}

function renderRunMapStop(stop, index, currentIndex) {
  const stateClass = index < currentIndex ? "done" : index === currentIndex ? "current" : "";
  const phaseClass = stop.final ? "goal" : stop.phase === "Global Round" ? "global" : "regional";

  return `
    <div class="run-map-stop ${stateClass} ${phaseClass}" style="left:${stop.x}%; top:${getRunMapTop(stop)}">
      <div class="run-map-stop-marker">
        ${renderRunStopMarker(stop, index, currentIndex)}
      </div>
    </div>
  `;
}

function renderRunStopMarker(stop, index, currentIndex) {
  if (stop.final) {
    return renderYaleDestinationMarkerSvg();
  }

  if (stop.phase === "Global Round") {
    return renderGlobalRoundMarkerSvg();
  }

  const state = index < currentIndex ? "reached" : index === currentIndex ? "current" : "default";
  return renderRegionalStopMarkerSvg(state);
}

function renderJumpExperience() {
  const experience = state.experience;
  const question = experience.currentQuestion;

  if (experience.finished) {
    return renderResultsScreen({
      title: "Alpaca Jump Summary",
      subtitle: experience.failed ? "" : "You crossed the desert route.",
      answers: experience.answers,
      failed: experience.failed,
      resultState: experience.failed ? "fail" : "success",
      showPanelTitle: false,
      showTopClose: false,
      showBanner: false,
      showPerformanceMessage: false,
      showTopReplay: false,
      showBreakdowns: !experience.failed,
      metrics: [
        {
          label: "Questions",
          value: `${Math.min(experience.index + 1, experience.questions.length)}/${experience.questions.length}`
        },
        {
          label: "Distance",
          value: `${Math.round(experience.distance)}m`
        }
      ]
    });
  }

  if (!experience.started && !experience.unavailableReason) {
    return `
      ${renderPanelTitle("Alpaca Jump", "Jump, duck, and answer checkpoints across the desert.", "")}
      <div class="jump-shell">
        <article class="race-launch-panel card-panel jump-setup-card">
          <p class="race-launch-kicker">Checkpoint Jump Route</p>
          <div class="race-launch-pills">
            <span>Pick at least ${GAME_CONFIG.jeopardyMinGroups} ${escapeHtml(getLensCardPluralLabel(state.selection.lens))} before launch.</span>
            <span>Jump or duck past obstacles, then answer checkpoint questions.</span>
            <span>${GAME_CONFIG.jumpLives} lives stand between you and the journey summary.</span>
          </div>
          ${renderTargetSetupSelector(experience, "jump-toggle-category", "race-target-selector", "race-target-grid", "race-target-button")}
          <div class="panel-actions">
            <button class="button primary" type="button" data-jump-start ${experience.setupCategoryIds.length < GAME_CONFIG.jeopardyMinGroups ? "disabled" : ""}>En route</button>
          </div>
        </article>
      </div>
    `;
  }

  if (experience.unavailableReason || !question) {
    return `
      ${renderPanelTitle("Alpaca Jump", "Jump, duck, and answer checkpoints across the desert.", "")}
      <div class="jump-shell">
        <article class="setup-card jump-setup-card">
          <div class="setup-card-header">
            ${renderConfiguredMascotAsset(
              getGameplayAssetPath("launch", "jump"),
              "excited",
              "medium",
              { alt: "Alpaca Jump unavailable alpaca" }
            )}
            <div>
              <p class="challenge-label">Route update pending</p>
              <h3>${escapeHtml(experience.unavailableReason || getUnavailableRawGameReason())}</h3>
            </div>
          </div>
        </article>
      </div>
    `;
  }

  const obstacle = experience.obstacle || createJumpObstacle(experience.obstacleCursor);
  const phaseClass = experience.phase;
  const runnerClass = getJumpRunnerClass(experience);
  const runnerTransform = `translateY(-${Math.max(0, experience.runnerY)}px)`;
  const questionValue = getJumpQuestionValue(question);
  const overlay = experience.phase === "question" || experience.phase === "feedback"
    ? renderJumpQuestionOverlay(experience, question)
    : "";

  return `
    ${renderPanelTitle("Alpaca Jump", "Jump, duck, and answer checkpoints across the desert.", "")}
    <div class="jump-shell">
      <section class="jump-stage ${escapeHtml(phaseClass)}" data-jump-stage>
        ${renderJumpBackground()}
        <div class="jump-hud">
          <div class="jump-hud-card">
            <span>Distance</span>
            <strong data-jump-distance>${Math.round(experience.distance)}m</strong>
          </div>
          <div class="jump-hud-card">
            <span>Lives</span>
            <div class="race-lives-row jump-lives" data-jump-lives>${renderJumpLives(experience.lives)}</div>
          </div>
        </div>
        <div class="jump-world">
          <div class="jump-runner ${escapeHtml(runnerClass)}" data-jump-runner data-jump-runner-state="${escapeHtml(getJumpRunnerState(experience))}" style="transform:${runnerTransform}">
            ${renderJumpRunner(experience)}
          </div>
          <div class="jump-obstacle ${escapeHtml(obstacle.kind)}" data-jump-obstacle data-jump-obstacle-kind="${escapeHtml(obstacle.kind)}" style="left:${obstacle.x}%">
            ${renderJumpObstacle(obstacle)}
          </div>
          <div class="jump-ground" aria-hidden="true"></div>
        </div>
        <div class="jump-controls">
          <button class="button secondary" type="button" data-jump-action="jump">Jump</button>
          <button class="button secondary" type="button" data-jump-action="duck">Duck</button>
          ${experience.phase === "ready" ? `<button class="button primary" type="button" data-jump-start>En route</button>` : ""}
        </div>
      </section>
      ${overlay}
    </div>
  `;
}

function renderJumpBackground() {
  const asset = getAssetValue(["jump", "background"]);
  if (!asset) {
    return `<div class="jump-background-placeholder" aria-hidden="true"></div>`;
  }

  return renderAssetImage(
    asset,
    "Alpaca Jump desert background",
    "jump-background",
    "jump-background-image",
    true
  );
}

function getJumpRunnerState(experience) {
  if (experience.runnerState === "hurting") {
    return "hurting";
  }

  if (experience.ducking) {
    return "ducking";
  }

  if (experience.runnerY > 1 || experience.runnerVelocity > 0) {
    return "jumping";
  }

  return "running";
}

function getJumpRunnerClass(experience) {
  return `state-${getJumpRunnerState(experience)}`;
}

function getJumpRunnerAssetConfig(stateName) {
  if (stateName === "ducking") {
    return {
      path: getAssetValue(["jump", "ducking"]) || getAssetValue(["jump", "runner"]),
      alt: "Ducking alpaca",
      aspect: "1.78 / 1"
    };
  }

  if (stateName === "hurting") {
    return {
      path: getAssetValue(["jump", "hurting"]) || getAssetValue(["jump", "runner"]),
      alt: "Hurt alpaca",
      aspect: "2.07 / 1"
    };
  }

  return {
    path: getAssetValue(["jump", "runner"]),
    alt: stateName === "jumping" ? "Jumping alpaca" : "Running alpaca",
    aspect: "1.48 / 1"
  };
}

function renderJumpRunner(experience) {
  const stateName = getJumpRunnerState(experience);
  const config = getJumpRunnerAssetConfig(stateName);
  if (!config.path) {
    return renderMascot("determined", "medium", { alt: "Running alpaca" });
  }

  return `
    <div
      class="jump-runner-viewport jump-runner-viewport-${escapeHtml(stateName)}"
      style="--jump-runner-aspect:${config.aspect};"
    >
      <img class="jump-runner-image" src="${escapeHtml(config.path)}" alt="${escapeHtml(config.alt)}" loading="eager" />
    </div>
  `;
}

function renderJumpObstacle(obstacle) {
  if (obstacle && obstacle.kind === "checkpoint") {
    const asset = getAssetValue(["jump", "questionGenie"]);
    if (asset) {
      return renderAssetImage(
        asset,
        "Question genie checkpoint",
        "jump-question-genie",
        "jump-question-genie-image",
        true
      );
    }

    return `<span class="jump-dark-alpaca-body" aria-hidden="true"></span>`;
  }

  const asset = obstacle && obstacle.kind === "flying"
    ? getAssetValue(["jump", "monsterToDuck"])
    : getAssetValue(["jump", "monsterToJump"]);
  if (!asset) {
    return `<span class="jump-dark-alpaca-body" aria-hidden="true"></span>`;
  }

  return renderAssetImage(
    asset,
    obstacle && obstacle.kind === "flying" ? "Flying monster to duck under" : "Ground monster to jump over",
    "jump-monster",
    "jump-monster-image",
    true
  );
}

function renderJumpLives(lives) {
  return Array.from({ length: Math.max(0, lives) }, (_, index) => {
    const state = lives === 1 && index === 0 ? "warning" : "full";
    return `<span class="race-life ${state}">${renderRaceLivesIcon(state)}</span>`;
  }).join("");
}

function getJumpQuestionLevel(question) {
  const level = Number(question && question.rawLevel);
  if (Number.isFinite(level) && level >= 1) {
    return Math.min(5, level);
  }

  return 1;
}

function getJumpQuestionValue(question) {
  return `${getJumpQuestionLevel(question) * 100}`;
}

function getJumpObstacleRequirement(experience) {
  return 2 + getJumpQuestionLevel(experience.currentQuestion);
}

function getJumpObstacleSpeed(experience) {
  const progression = experience.index + Math.floor(experience.distance / 120);
  return Math.min(
    GAME_CONFIG.jumpMaxObstacleSpeed,
    GAME_CONFIG.jumpObstacleSpeed + progression * GAME_CONFIG.jumpObstacleSpeedGain
  );
}

function queueNextJumpObstacle(experience) {
  const requiredObstacles = getJumpObstacleRequirement(experience);
  if (experience.obstaclesCleared >= requiredObstacles) {
    experience.obstacle = createJumpCheckpointObstacle();
    return;
  }

  experience.obstacleCursor += 1;
  experience.obstacle = createJumpObstacle(experience.obstacleCursor);
}

function renderJumpQuestionOverlay(experience, question) {
  const revealed = experience.phase === "feedback";
  const heading = revealed
    ? (experience.lastCorrect ? "Question cleared." : "Wrong answer. One life lost.")
    : "Question box";

  return renderGameQuestionPopup(`
    <article class="challenge-card jump-question-card">
      ${renderConfiguredMascotAsset(
        getAssetValue(["jump", "questionGenie"]),
        "thinking",
        "large",
        {
          alt: "Question genie",
          slotClass: "jump-question-genie-card",
          imageClass: "jump-question-genie-card-image",
          eager: true,
          reviewBadge: getGameplayReviewBadge("question", "jump")
        }
      )}
      <span class="challenge-label">${escapeHtml(getGamePromptLabel("jump", question))}</span>
      ${renderGameNotes(question, "jump", {
        index: experience.index,
        total: experience.questions.length,
        lives: experience.lives,
        distance: experience.distance,
        value: getJumpQuestionValue(question)
      })}
      <div class="popup-question-panel">
        <div class="popup-question-copy">
          <span class="question-meta">${escapeHtml(heading)}</span>
          <h2 class="popup-question-text">${escapeHtml(question.prompt)}</h2>
        </div>
      </div>
            <div class="options-grid answer-options-grid">
        ${question.options.map((option, index) => {
          let classes = "option-button";
          if (revealed) {
            if (index === question.answerIndex) {
              classes += " correct";
            } else if (index === experience.selectedIndex) {
              classes += " wrong";
            }
            classes += " disabled";
          }
          return `
            <button class="${classes}" data-jump-option="${index}" ${revealed ? "disabled" : ""}>
              ${renderOptionToken(index)}
              <span>${escapeHtml(option)}</span>
            </button>
          `;
        }).join("")}
      </div>
      ${revealed ? `
        <article class="feedback-card ${experience.lastCorrect ? "correct" : "wrong"}">
          ${renderCheckpointVisual(experience.lastCorrect ? "success" : "fail")}
          <div>
            <h3>${escapeHtml(experience.lastCorrect ? "The alpaca keeps running." : (experience.lives <= 0 ? "No lives left." : `${experience.lives} lives left.`))}</h3>
            <p>${escapeHtml(question.explanation)}</p>
            <div class="run-actions">
              <button class="button primary" type="button" data-jump-continue>${experience.lives <= 0 || experience.index >= experience.questions.length - 1 ? "Journey Summary" : "Continue Forward"}</button>
            </div>
          </div>
        </article>
      ` : ""}
    </article>
  `, "jump", { showClose: false });
}

function startJumpRoute() {
  const experience = state.experience;
  if (!experience || experience.type !== "jump" || experience.started || experience.unavailableReason) {
    return;
  }

  if (experience.setupCategoryIds.length < GAME_CONFIG.jeopardyMinGroups) {
    return;
  }

  const plan = buildJumpQuestionPlan(getRawEntriesForRunSetupCategoryIds(experience.setupCategoryIds));
  if (plan.unavailableReason || !plan.questions.length) {
    experience.unavailableReason = plan.unavailableReason || getUnavailableRawGameReason();
    renderExperience();
    return;
  }

  experience.questions = plan.questions || [];
  experience.index = 0;
  experience.currentQuestion = experience.questions[0] || null;
  experience.phase = "running";
  experience.started = true;
  experience.obstacleCursor = 0;
  experience.obstaclesCleared = 0;
  experience.obstacle = createJumpObstacle(experience.obstacleCursor);
  experience.runnerState = "running";
  experience.lastFrameAt = null;
  renderExperience();
}

function toggleJumpSetupCategory(categoryId) {
  const experience = state.experience;
  if (!experience || experience.type !== "jump" || experience.started) {
    return;
  }

  if (!toggleSetupCategorySelection(experience, categoryId)) {
    return;
  }

  renderExperience();
}

function performJumpAction(action) {
  const experience = state.experience;
  if (!experience || experience.type !== "jump" || experience.phase !== "running") {
    return;
  }

  if (action === "jump" && experience.runnerY <= 1) {
    experience.runnerVelocity = GAME_CONFIG.jumpImpulse;
    experience.runnerState = "jumping";
  }

  if (action === "duck") {
    experience.ducking = true;
    experience.runnerState = "ducking";
    window.setTimeout(() => {
      if (state.experience && state.experience.type === "jump") {
        state.experience.ducking = false;
        state.experience.runnerState = "running";
        updateJumpDom(state.experience);
      }
    }, 620);
  }

  updateJumpDom(experience);
}

function startJumpAnimation() {
  clearJumpAnimation();

  const tick = (timestamp) => {
    const experience = state.experience;
    if (!experience || experience.type !== "jump" || experience.phase !== "running" || experience.finished) {
      clearJumpAnimation();
      return;
    }

    updateJumpFrame(experience, timestamp);
    if (experience.phase === "running") {
      jumpAnimationId = window.requestAnimationFrame(tick);
    } else {
      clearJumpAnimation();
      renderExperience();
    }
  };

  jumpAnimationId = window.requestAnimationFrame(tick);
}

function updateJumpFrame(experience, timestamp) {
  const last = Number.isFinite(experience.lastFrameAt) ? experience.lastFrameAt : timestamp;
  const delta = Math.min(34, Math.max(0, timestamp - last));
  experience.lastFrameAt = timestamp;
  experience.distance += delta * 0.016;

  if (experience.runnerY > 0 || experience.runnerVelocity > 0) {
    experience.runnerY = Math.max(0, experience.runnerY + (experience.runnerVelocity * delta));
    experience.runnerVelocity -= GAME_CONFIG.jumpGravity * delta;
    if (experience.runnerY <= 0) {
      experience.runnerY = 0;
      experience.runnerVelocity = 0;
      if (experience.runnerState === "jumping") {
        experience.runnerState = "running";
      }
    }
  }

  experience.obstacle.x -= getJumpObstacleSpeed(experience) * delta;

  if (hasJumpCollision(experience)) {
    if (experience.obstacle.kind === "checkpoint") {
      openJumpCheckpoint(experience);
    } else {
      handleJumpObstacleHit(experience);
    }
    return;
  }

  if (experience.obstacle.x < 18 && !experience.obstacle.passed) {
    experience.obstacle.passed = true;
    if (experience.obstacle.kind !== "checkpoint") {
      experience.obstaclesCleared += 1;
    }
    return;
  }

  if (experience.obstacle.x < -12) {
    queueNextJumpObstacle(experience);
  }

  updateJumpDom(experience);
}

function hasJumpCollision(experience) {
  const obstacle = experience.obstacle;
  if (!obstacle || obstacle.x < 18 || obstacle.x > 29) {
    return false;
  }

  if (obstacle.kind === "checkpoint") {
    return true;
  }

  if (obstacle.kind === "ground") {
    return experience.runnerY < 52;
  }

  return !experience.ducking && experience.runnerY < 36;
}

function handleJumpObstacleHit(experience) {
  experience.lives = Math.max(0, experience.lives - 1);
  experience.ducking = false;
  experience.runnerY = 0;
  experience.runnerVelocity = 0;
  experience.runnerState = "hurting";
  experience.lastFrameAt = null;

  if (experience.lives <= 0) {
    experience.failed = true;
    experience.finished = true;
    finalizeSessionStats(experience.answers, getBestStreakFromAnswers(experience.answers), {
      type: "jump",
      score: experience.score,
      distance: experience.distance
    });
    clearJumpAnimation();
    render();
    return;
  }

  experience.obstacleCursor += 1;
  experience.obstacle = createJumpObstacle(experience.obstacleCursor);
  renderExperience();
  window.setTimeout(() => {
    if (state.experience && state.experience.type === "jump" && state.experience.phase === "running") {
      state.experience.runnerState = "running";
      updateJumpDom(state.experience);
    }
  }, 2000);
}

function openJumpCheckpoint(experience) {
  experience.phase = "question";
  experience.ducking = false;
  experience.runnerY = 0;
  experience.runnerVelocity = 0;
  experience.runnerState = "running";
  experience.lastFrameAt = null;
}

function updateJumpDom(experience) {
  if (!refs.experiencePanel || !experience || experience.type !== "jump") {
    return;
  }

  const runner = refs.experiencePanel.querySelector("[data-jump-runner]");
  if (runner) {
    const runnerState = getJumpRunnerState(experience);
    if (runner.dataset.jumpRunnerState !== runnerState) {
      runner.dataset.jumpRunnerState = runnerState;
      appDomService.setTrustedHtml(
        runner,
        appDomService.trustedHtml(renderJumpRunner(experience), "jump-runner")
      );
    }
    runner.style.transform = `translateY(-${Math.max(0, experience.runnerY)}px)`;
    runner.classList.toggle("state-ducking", runnerState === "ducking");
    runner.classList.toggle("state-jumping", runnerState === "jumping");
    runner.classList.toggle("state-hurting", runnerState === "hurting");
    runner.classList.toggle("state-running", runnerState === "running");
  }

  const obstacle = refs.experiencePanel.querySelector("[data-jump-obstacle]");
  if (obstacle && experience.obstacle) {
    const obstacleKind = experience.obstacle.kind;
    if (obstacle.dataset.jumpObstacleKind !== obstacleKind) {
      obstacle.dataset.jumpObstacleKind = obstacleKind;
      appDomService.setTrustedHtml(
        obstacle,
        appDomService.trustedHtml(renderJumpObstacle(experience.obstacle), "jump-obstacle")
      );
    }
    obstacle.style.left = `${experience.obstacle.x}%`;
    obstacle.classList.toggle("ground", obstacleKind === "ground");
    obstacle.classList.toggle("flying", obstacleKind === "flying");
    obstacle.classList.toggle("checkpoint", obstacleKind === "checkpoint");
  }

  const distance = refs.experiencePanel.querySelector("[data-jump-distance]");
  if (distance) {
    distance.textContent = `${Math.round(experience.distance)}m`;
  }

  const lives = refs.experiencePanel.querySelector("[data-jump-lives]");
  if (lives) {
    appDomService.setTrustedHtml(
      lives,
      appDomService.trustedHtml(renderJumpLives(experience.lives), "jump-lives")
    );
  }
}

function answerJumpQuestion(optionIndex) {
  const experience = state.experience;
  if (!experience || experience.type !== "jump" || experience.phase !== "question") {
    return;
  }

  const question = experience.currentQuestion;
  if (!question) {
    return;
  }

  const isCorrect = optionIndex === question.answerIndex;
  experience.selectedIndex = optionIndex;
  experience.lastCorrect = isCorrect;
  experience.phase = "feedback";
  experience.score += isCorrect ? 1 : 0;
  if (!isCorrect) {
    experience.lives = Math.max(0, experience.lives - 1);
    experience.runnerState = "hurting";
  } else {
    experience.runnerState = "running";
  }

  experience.answers.push({
    questionId: question.id,
    sectionId: question.sectionId,
    subjectIds: question.subjectIds,
    bigIdeaIds: question.bigIdeaIds || [],
    isCorrect
  });

  renderExperience();
}

function continueJumpRoute() {
  const experience = state.experience;
  if (!experience || experience.type !== "jump" || experience.phase !== "feedback") {
    return;
  }

  if (experience.lives <= 0 || experience.index >= experience.questions.length - 1) {
    experience.failed = experience.lives <= 0;
    experience.finished = true;
    finalizeSessionStats(experience.answers, getBestStreakFromAnswers(experience.answers), {
      type: "jump",
      score: experience.score,
      distance: experience.distance
    });
    render();
    return;
  }

  experience.index += 1;
  experience.currentQuestion = experience.questions[experience.index] || null;
  experience.phase = "running";
  experience.selectedIndex = null;
  experience.lastCorrect = null;
  experience.obstaclesCleared = 0;
  experience.runnerState = "running";
  queueNextJumpObstacle(experience);
  experience.lastFrameAt = null;
  renderExperience();
}

function renderRunExperience() {
  const experience = state.experience;
  const timerClass = getTimerVisualState(experience.timeRemaining, GAME_CONFIG.runTotalTime, {
    warningAt: 90,
    dangerAt: 30
  });

  if (experience.finished) {
    const reachedStop = getRunCurrentStop(experience);
    const passedStops = getRunPassedStopLabels(experience);
    return renderResultsScreen({
      title: "Journey Summary",
      subtitle: experience.failed ? "Not there yet — but closer than before." : "You made it to the final destination.",
      answers: experience.answers,
      failed: experience.failed,
      resultState: experience.failed ? "fail" : "success",
      showPerformanceMessage: false,
      showBreakdowns: false,
      breakdownHtml: renderAlternateLensBreakdown(experience.answers),
      metrics: [
        {
          label: "Distance Reached",
          value: `${experience.stage + 1}/${experience.route.length} · ${reachedStop.label}`
        },
        {
          label: "Stops Cleared",
          value: passedStops.length ? passedStops.join(" · ") : "No city cleared yet"
        }
      ]
    });
  }

  if (!experience.started && !experience.unavailableReason) {
    return `
      ${renderPanelTitle("Alpaca Run", "Race from stop to stop and see how close you can get to Yale.", "")}
      <div class="run-shell">
        <article class="race-launch-panel card-panel run-setup-card">
          <p class="race-launch-kicker">Road to Yale</p>
          <div class="race-launch-pills">
            <span>The goal is to get to Yale before the clock runs out.</span>
            <span>Questions get harder as you move from Regional stops to Global stops.</span>
            <span>A wrong answer sends you back to the last place you reached.</span>
          </div>

          ${renderTargetSetupSelector(experience, "run-toggle-category", "race-target-selector", "race-target-grid", "race-target-button")}

          <div class="panel-actions">
            <button class="button primary" data-run-start ${experience.setupCategoryIds.length < GAME_CONFIG.jeopardyMinGroups ? "disabled" : ""}>En route</button>
          </div>
        </article>
      </div>
    `;
  }

  if (experience.unavailableReason || !experience.currentQuestion) {
    return `
      ${renderPanelTitle("Alpaca Run", "Race from stop to stop and see how close you can get to Yale.", "")}
      <div class="run-shell">
        <article class="setup-card">
          <div class="setup-card-header">
            ${renderConfiguredMascotAsset(
              getGameplayAssetPath("launch", "run"),
              "determined",
              "medium",
              { alt: "Alpaca Run unavailable alpaca" }
            )}
            <div>
              <p class="challenge-label">Route update pending</p>
              <h3>${escapeHtml(experience.unavailableReason || getUnavailableRawGameReason())}</h3>
            </div>
          </div>
        </article>
      </div>
    `;
  }

  const question = experience.currentQuestion;
  const yaleMode = experience.stage >= experience.route.length - 1;
  const runFeedbackHeading = experience.lastCorrect
    ? (yaleMode
      ? (experience.yaleProgress === GAME_CONFIG.runYaleLevelFiveCount - 1
        ? "Yale reached."
        : "One Yale checkpoint cleared.")
      : "Next stop reached.")
    : (yaleMode
      ? "Wrong turn. Back to Question 20."
      : "Wrong turn. Back to the last destination reached.");
  return `
    ${renderPanelTitle(
      "Alpaca Run",
      "Race from stop to stop and see how close you can get to Yale.",
      ""
    )}
    <div class="run-shell">
      <section class="run-map-shell">
        ${renderRunMap(experience)}

        <section class="run-inline-shell">
          <article class="run-inline-card">
            <div class="run-inline-question">
              <h2>${escapeHtml(question.prompt)}</h2>
            </div>
            <div class="options-grid run-inline-options answer-options-grid">
              ${question.options.map((option, index) => {
                let classes = "option-button";
                if (experience.revealed) {
                  if (index === question.answerIndex) {
                    classes += " correct";
                  } else if (index === experience.selectedIndex) {
                    classes += " wrong";
                  }
                  classes += " disabled";
                }
                return `
                  <button class="${classes}" data-run-option="${index}">
                    ${renderOptionToken(index)}
                    <span>${escapeHtml(option)}</span>
                  </button>
                `;
              }).join("")}
            </div>
            <div class="run-inline-footer">
              ${renderCompactRaceTimerCard("Time Left", experience.timeRemaining, GAME_CONFIG.runTotalTime, timerClass, "run")}
              ${yaleMode ? `
                <div class="run-inline-timer ${timerClass}">
                  <span>Yale Questions</span>
                  <strong>${experience.yaleProgress + 1}/${GAME_CONFIG.runYaleLevelFiveCount}</strong>
                </div>
              ` : ""}
            </div>
          </article>

          ${experience.revealed ? `
            <article class="feedback-card ${experience.lastCorrect ? "correct" : "wrong"}">
              ${renderCheckpointVisual(experience.lastCorrect ? "success" : "fail")}
              <div>
                <h3>${escapeHtml(runFeedbackHeading)}</h3>
                <p>${escapeHtml(question.explanation)}</p>
                <div class="run-actions">
                  <button class="button primary" data-run-continue>${experience.lastCorrect && yaleMode && experience.yaleProgress === GAME_CONFIG.runYaleLevelFiveCount - 1 ? "Journey Summary" : "Continue Forward"}</button>
                </div>
              </div>
            </article>
          ` : ""}
        </section>

      </section>
    </div>
  `;
}

function renderGameQuestionPopup(content, modeClass = "", options = {}) {
  const showClose = options.showClose !== false;
  return `
    <div class="question-popup-overlay ${escapeHtml(modeClass)}" role="dialog" aria-modal="true">
      <div class="question-popup-window ${escapeHtml(modeClass)}">
        ${showClose ? renderExperienceCloseButton("popup-close-button") : ""}
        <div class="question-popup-stack">
          ${content}
        </div>
      </div>
    </div>
  `;
}

function renderExperienceCloseButton(className = "popup-close-button") {
  return `
    <button class="${escapeHtml(className)}" type="button" data-close-experience aria-label="Leave route">
      <span aria-hidden="true">×</span>
    </button>
  `;
}

function answerRunQuestion(optionIndex) {
  const experience = state.experience;
  if (!experience || experience.type !== "run" || experience.revealed) {
    return;
  }

  const question = experience.currentQuestion;
  if (!question) {
    return;
  }
  const isCorrect = optionIndex === question.answerIndex;
  const yaleStage = experience.stage >= experience.route.length - 1;

  experience.revealed = true;
  experience.lastCorrect = isCorrect;
  experience.selectedIndex = optionIndex;
  experience.answeredCount += 1;

  if (isCorrect) {
    experience.correctCount += 1;
    if (yaleStage) {
      experience.pendingStage = experience.stage;
      experience.pendingYaleProgress = experience.yaleProgress + 1;
    } else {
      experience.pendingStage = Math.min(experience.stage + 1, experience.route.length - 1);
      experience.pendingYaleProgress = 0;
    }
  } else {
    experience.pendingStage = yaleStage ? Math.max(experience.route.length - 2, 0) : Math.max(experience.stage - 1, 0);
    experience.pendingYaleProgress = 0;
  }

  experience.answers.push({
    questionId: question.id,
    sectionId: question.sectionId,
    subjectIds: question.subjectIds,
    bigIdeaIds: question.bigIdeaIds || [],
    isCorrect
  });

  renderExperience();
}

function continueRun() {
  const experience = state.experience;
  if (!experience || experience.type !== "run") {
    return;
  }

  if (experience.lastCorrect && experience.stage >= experience.route.length - 1 && experience.yaleProgress === GAME_CONFIG.runYaleLevelFiveCount - 1) {
    experience.finished = true;
    finalizeSessionStats(experience.answers, experience.correctCount, {
      type: "run",
      stage: getRunReachedStage(experience)
    });
    render();
    return;
  }

  if (experience.timeRemaining <= 0) {
    experience.failed = true;
    experience.finished = true;
    finalizeSessionStats(experience.answers, experience.correctCount, {
      type: "run",
      stage: getRunReachedStage(experience)
    });
    render();
    return;
  }

  experience.stage = Number.isInteger(experience.pendingStage) ? experience.pendingStage : experience.stage;
  experience.yaleProgress = Number.isInteger(experience.pendingYaleProgress) ? experience.pendingYaleProgress : experience.yaleProgress;
  if (experience.stage >= experience.route.length - 1) {
    experience.currentQuestion = experience.yaleQuestions[experience.yaleProgress] || null;
  } else {
    experience.currentQuestion = experience.mainQuestions[experience.stage] || null;
  }
  experience.revealed = false;
  experience.lastCorrect = null;
  experience.selectedIndex = null;
  experience.pendingStage = null;
  experience.pendingYaleProgress = null;

  renderExperience();
}

function renderResultsScreen(config) {
  const rating = getPerformanceRating(getAccuracy(config.answers));
  const mood = getPerformanceMood(getAccuracy(config.answers));
  const resultMascotSize = mood === "victory" ? "large" : "medium";
  const contextualResultAsset = getResultAssetPath(state.experience?.type, config.resultState || (config.failed ? "fail" : "success"));
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
    return BIG_IDEA_ROUTES
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
        <span>${escapeHtml(value)} · ${accuracy}%</span>
      </div>
      <div class="breakdown-progress"><span style="width:${accuracy}%"></span></div>
    </article>
  `;
}

function renderSelectedGuidingSectionSpans() {
  const labels = getSelectedSectionIds()
    .map((sectionId) => sectionById[sectionId]?.title || sectionId)
    .filter(Boolean);

  if (!labels.length) {
    return "";
  }

  return `
    <div class="panel-section-spans" aria-label="Selected guiding sections">
      ${labels.map((label) => `<span>${escapeHtml(label)}</span>`).join("")}
    </div>
  `;
}

function renderPanelTitle(title, subtitle, metaLine, options = {}) {
  const modesWithoutReplay = new Set(["mindmap", "rawcontent", "regularguide", "channel", "alpacard", "quiz", "writing", "bowl"]);
  const showReplay = options.showReplay !== false && !modesWithoutReplay.has(state.selection.mode);
  const isPlayMode = state.selection.path === "play";
  const isLearnMode = state.selection.path === "learn";
  const isTrainMode = state.selection.path === "train";
  const sectionSpans = options.showSectionSpans === false
    ? ""
    : isLearnMode || isTrainMode
      ? renderSelectedGuidingSectionSpans()
      : "";
  const showHubLink = isLearnMode || isPlayMode || isTrainMode;
  return `
    <div class="panel-title">
      <div>
        <h2>${options.titleHtml || escapeHtml(title)}</h2>
        ${sectionSpans || (subtitle ? `<p>${escapeHtml(subtitle)}</p>` : "")}
        ${metaLine ? `<p class="meta-line">${escapeHtml(metaLine)}</p>` : ""}
      </div>
      ${showReplay ? `
        <div class="panel-actions">
          <button class="button secondary" data-replay-current ${state.selection.mode ? "" : "disabled"}>Take This Route Again</button>
          ${showHubLink ? `<button class="panel-hub-link" type="button" data-change-mode>Back to hub</button>` : ""}
        </div>
      ` : showHubLink ? `
        <div class="panel-actions">
          <button class="panel-hub-link" type="button" data-change-mode>Back to hub</button>
        </div>
      ` : ""}
    </div>
  `;
}

function renderLearnCardFooterNav(currentModeId) {
  const pathId = getModePath(currentModeId) || state.selection.path || "learn";
  const modeIds = pathId === "train"
    ? ["writing", "buildcase", "bowl", "quiz"]
    : ["mindmap", "rawcontent", "regularguide", "channel", "alpacard"];
  const items = modeIds
    .filter((modeId) => modeId !== currentModeId)
    .map((modeId) => getModeOption(modeId))
    .filter(Boolean);

  if (!items.length) {
    return "";
  }

  return `
    <nav class="learn-card-footer-nav" aria-label="${escapeHtml(pathId === "train" ? "Train" : "Learn")} card navigation">
      ${items.map((option) => `
        <button
          class="learn-footer-card-button ${option.unavailableReason ? "disabled unavailable" : ""}"
          type="button"
          data-pick-mode="${escapeHtml(option.id)}"
          data-pick-mode-path="${escapeHtml(pathId)}"
          title="${escapeHtml(option.title)}"
          aria-label="Open ${escapeHtml(option.title)}"
          ${option.unavailableReason ? "disabled" : ""}
        >
          ${renderConfiguredMascotAsset(
            getWizardCardAsset(getModeAssetPath(option.id)),
            option.mood,
            "small",
            {
              alt: `${option.title} icon`,
              slotClass: "learn-footer-card-slot",
              imageClass: "learn-footer-card-image"
            }
          )}
          <span>${escapeHtml(option.title)}</span>
        </button>
      `).join("")}
    </nav>
  `;
}

function getSelectionQuestions() {
  return getQuestionsForRouteSelection(state.selection.lens, state.selection.targetId);
}

function getQuestionsForRouteSelection(lensId, targetId) {
  return buildRawGameQuestionsFromEntries(getRawEntriesForRouteSelection(lensId, targetId));
}

function buildRawGameQuestionsFromEntries(entries) {
  const entryQuestions = (entries || []).flatMap((entry, entryIndex) =>
    (entry.quizQuestions || [])
      .map((rawQuestion, questionIndex) => {
        const level = Number(rawQuestion.level);
        if (!level || !rawQuestion.prompt || !rawQuestion.correctAnswer || !Array.isArray(rawQuestion.wrongAnswers)) {
          return null;
        }
        return createRawGameQuestion(entry, rawQuestion, entryIndex, questionIndex);
      })
      .filter(Boolean)
  );

  return [
    ...entryQuestions,
    ...getGuideQuestionsForEntries(entries),
    ...getFullVoyageQuestionsForEntries(entries)
  ];
}

function getSectionCounts(questions) {
  const counts = {};
  questions.forEach((question) => {
    counts[question.sectionId] = (counts[question.sectionId] || 0) + 1;
  });

  return Object.keys(counts)
    .map((id) => ({
      id,
      label: sectionById[id].title,
      count: counts[id]
    }))
    .sort((left, right) => right.count - left.count);
}

function getSubjectCounts(questions) {
  const counts = {};
  questions.forEach((question) => {
    question.subjectIds.forEach((subjectId) => {
      counts[subjectId] = (counts[subjectId] || 0) + 1;
    });
  });

  return Object.keys(counts)
    .map((id) => ({
      id,
      label: subjectById[id].label,
      count: counts[id]
    }))
    .sort((left, right) => right.count - left.count);
}

function hydrateKnowledgeBank() {
  const sections = Array.isArray(knowledgeBank.sections) ? knowledgeBank.sections : [];
  sectionKnowledgeById = {};

  sections.forEach((bankSection) => {
    const sectionId = getSectionIdFromGuidingTitle(bankSection.guiding_section);
    if (!sectionId) {
      return;
    }
    sectionKnowledgeById[sectionId] = normalizeBankSection(bankSection, sectionId);
  });

  subjectKnowledgeById = Object.fromEntries(
    data.subjects.map((subject) => [subject.id, buildSubjectKnowledge(subject.id)])
  );
  learnSubjectKnowledgeById = Object.fromEntries(
    LEARN_SUBJECT_ROUTES.map((route) => [route.id, buildLearnSubjectRouteKnowledge(route)])
  );
  bigIdeaKnowledgeById = Object.fromEntries(
    BIG_IDEA_ROUTES.map((route) => [route.id, buildBigIdeaKnowledge(route)])
  );
  wholeThemeKnowledge = buildWholeThemeKnowledge();
}

function normalizeKnowledgeKey(value) {
  return String(value || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[’']/g, "")
    .replace(/&/g, "and")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function slugifyBigIdea(label) {
  return normalizeKnowledgeKey(label).replace(/\s+/g, "-");
}

function buildBigIdeaRoutes(rawSections) {
  const counts = new Map();

  Object.values(rawSections || {}).forEach((section) => {
    (section.entries || []).forEach((entry) => {
      (entry.bigIdeas || []).forEach((bigIdea) => {
        counts.set(bigIdea, (counts.get(bigIdea) || 0) + 1);
      });
    });
  });

  const orderedLabels = [
    ...DEEP_STRUCTURE_BIG_IDEAS.filter((label) => counts.has(label)),
    ...Array.from(counts.keys())
      .filter((label) => !DEEP_STRUCTURE_BIG_IDEAS.includes(label))
      .sort((left, right) => (counts.get(right) || 0) - (counts.get(left) || 0) || left.localeCompare(right))
  ];

  return orderedLabels
    .map((label) => {
      const id = slugifyBigIdea(label);
      const preset = BIG_IDEA_ROUTE_PRESETS[id] || {};
      return {
        id,
        label,
        description: preset.description || `${label} as a route through the 2026 theme.`,
        mood: preset.mood || "wise"
      };
    });
}

function getSectionIdFromGuidingTitle(title) {
  const normalizedTitle = normalizeKnowledgeKey(title);
  const matchingSection = data.sections.find((section) => normalizeKnowledgeKey(section.originalTitle) === normalizedTitle);
  return matchingSection ? matchingSection.id : null;
}

function normalizeBankSection(bankSection, sectionId) {
  const mappedSection = sectionById[sectionId];
  const atoms = (bankSection.content_atoms || []).map((atom, index) => ({
    id: `${sectionId}-atom-${index + 1}`,
    sectionId,
    sectionTitle: mappedSection.title,
    sectionOriginalTitle: mappedSection.originalTitle,
    subtopic: atom.subtopic,
    coreIdea: atom.core_idea,
    mustKnowPoints: atom.must_know_points || [],
    examples: atom.examples || [],
    debateAngles: atom.debate_angles || [],
    keywords: atom.keywords || [],
    possibleQuestionTypes: atom.possible_question_types || [],
    goodForModes: atom.good_for_modes || [],
    difficulty: atom.difficulty || "mixed"
  }));

  return {
    type: "section",
    sectionId,
    title: mappedSection.title,
    originalTitle: mappedSection.originalTitle,
    summary: bankSection.section_summary,
    officialSubjects: bankSection.official_subjects || [],
    overlayCategories: bankSection.overlay_categories || [],
    atoms,
    questionCount: countRawQuizQuestions(getRawEntriesForRouteSelection("section", sectionId)),
    knowledgeItemCount: countKnowledgeItems(atoms)
  };
}

function buildSubjectKnowledge(subjectId) {
  const subject = subjectById[subjectId];
  const normalizedSubject = normalizeKnowledgeKey(subject.label);
  const sections = data.sections
    .map((section) => sectionKnowledgeById[section.id])
    .filter(Boolean)
    .filter((section) => section.officialSubjects.some((label) => normalizeKnowledgeKey(label) === normalizedSubject));

  const atoms = sections.flatMap((section) =>
    section.atoms.map((atom) => ({
      ...atom,
      sourceSectionTitle: section.title,
      sourceSectionOriginalTitle: section.originalTitle,
      sourceSectionSummary: section.summary
    }))
  );

  return {
    type: "subject",
    subjectId,
    label: subject.label,
    description: subject.description,
    sections,
    atoms,
    questionCount: getQuestionsForRouteSelection("subject", subjectId).length,
    knowledgeItemCount: countKnowledgeItems(atoms)
  };
}

function buildLearnSubjectRouteKnowledge(route) {
  const sections = data.sections
    .map((section) => sectionKnowledgeById[section.id])
    .filter(Boolean)
    .map((section) => {
      const matchedAtoms = section.atoms.filter((atom) => atomMatchesLearnSubjectRoute(atom, section, route));
      if (!matchedAtoms.length) {
        return null;
      }

      return {
        ...section,
        atoms: matchedAtoms
      };
    })
    .filter(Boolean);

  const atoms = sections.flatMap((section) =>
    section.atoms.map((atom) => ({
      ...atom,
      sourceSectionTitle: section.title,
      sourceSectionOriginalTitle: section.originalTitle,
      sourceSectionSummary: section.summary
    }))
  );

  const matchedSectionIds = new Set(sections.map((section) => section.sectionId));
  const questionCount = countRawQuizQuestions(
    getOrderedRawContentSections().flatMap((rawSection) => {
      const sectionId = rawSection.id || getSectionIdFromGuidingTitle(rawSection.guidingSection || rawSection.title);
      if (!matchedSectionIds.has(sectionId)) {
        return [];
      }
      const entries = (rawSection.entries || []).filter((entry) => entryMatchesLearnSubjectRoute(entry, sectionId, route));
      return mapRawEntriesWithSection(rawSection, entries);
    })
  );

  return {
    type: "subject",
    subjectId: route.id,
    label: route.label,
    description: route.description,
    sections,
    atoms,
    questionCount,
    knowledgeItemCount: countKnowledgeItems(atoms)
  };
}

function buildBigIdeaKnowledge(route) {
  const matchingEntries = [];
  const sectionMap = new Map();

  getOrderedRawContentSections().forEach((rawSection) => {
    const matching = (rawSection.entries || []).filter((entry) => (entry.bigIdeas || []).includes(route.label));
    if (!matching.length) {
      return;
    }

    const sectionId = rawSection.id || getSectionIdFromGuidingTitle(rawSection.guidingSection || rawSection.title);
    const sectionRecord = sectionId ? sectionById[sectionId] : null;
    const knowledgeSection = sectionId ? sectionKnowledgeById[sectionId] : null;

    if (sectionId && !sectionMap.has(sectionId)) {
      sectionMap.set(sectionId, {
        sectionId,
        title: sectionRecord ? sectionRecord.title : rawSection.guidingSection || rawSection.title,
        originalTitle: sectionRecord ? sectionRecord.originalTitle : rawSection.guidingSection || rawSection.title,
        summary: knowledgeSection ? knowledgeSection.summary : "",
        entryCount: matching.length
      });
    }

    matching.forEach((entry) => {
      matchingEntries.push({
        ...entry,
        sectionId,
        sectionTitle: sectionRecord ? sectionRecord.title : rawSection.guidingSection || rawSection.title,
        sectionOriginalTitle: sectionRecord ? sectionRecord.originalTitle : rawSection.guidingSection || rawSection.title,
        sourceFile: rawSection.sourceFile || rawSection.title
      });
    });
  });

  const sections = Array.from(sectionMap.values()).sort(compareOfficialSectionOrder);
  matchingEntries.sort(compareRawEntriesByOfficialOrder);
  const questionCount = countRawQuizQuestions(matchingEntries);
  const knowledgeItemCount = matchingEntries.reduce((sum, entry) => {
    return sum + 1 + (entry.examples || []).length + (entry.subjects || []).length + (entry.bigIdeas || []).length;
  }, 0);

  return {
    type: "bigidea",
    bigIdeaId: route.id,
    label: route.label,
    description: route.description,
    sections,
    entries: matchingEntries,
    questionCount,
    knowledgeItemCount
  };
}

function atomMatchesLearnSubjectRoute(atom, section, route) {
  const haystack = normalizeKnowledgeKey(
    [
      atom.subtopic,
      atom.coreIdea,
      atom.mustKnowPoints.join(" "),
      atom.examples.join(" "),
      atom.debateAngles.join(" "),
      atom.keywords.join(" "),
      section.title,
      section.originalTitle,
      section.summary,
      section.officialSubjects.join(" "),
      section.overlayCategories.join(" ")
    ].join(" ")
  );

  const keywordMatch = (route.keywords || []).some((keyword) => haystack.includes(normalizeKnowledgeKey(keyword)));
  const overlayMatch = (route.overlayCategories || []).some((category) =>
    section.overlayCategories.some((label) => normalizeKnowledgeKey(label) === normalizeKnowledgeKey(category))
  );

  return keywordMatch || overlayMatch;
}

function entryMatchesLearnSubjectRoute(entry, sectionId, route) {
  const knowledgeSection = sectionId ? sectionKnowledgeById[sectionId] : null;
  const haystack = normalizeKnowledgeKey(
    [
      entry.title,
      entry.rawOfficialText,
      entry.studentExplanation,
      entry.whyItMatters,
      entry.takeaway,
      (entry.examples || []).join(" "),
      (entry.subjects || []).join(" "),
      (entry.bigIdeas || []).join(" "),
      knowledgeSection ? knowledgeSection.title : "",
      knowledgeSection ? knowledgeSection.originalTitle : "",
      knowledgeSection ? knowledgeSection.summary : "",
      knowledgeSection ? knowledgeSection.officialSubjects.join(" ") : "",
      knowledgeSection ? knowledgeSection.overlayCategories.join(" ") : ""
    ].join(" ")
  );

  const keywordMatch = (route.keywords || []).some((keyword) => haystack.includes(normalizeKnowledgeKey(keyword)));
  const overlayMatch = (route.overlayCategories || []).some((category) =>
    knowledgeSection && knowledgeSection.overlayCategories.some((label) => normalizeKnowledgeKey(label) === normalizeKnowledgeKey(category))
  );

  return keywordMatch || overlayMatch;
}

function buildWholeThemeKnowledge() {
  const sections = data.sections.map((section) => sectionKnowledgeById[section.id]).filter(Boolean);
  const atoms = sections.flatMap((section) =>
    section.atoms.map((atom) => ({
      ...atom,
      sourceSectionTitle: section.title,
      sourceSectionOriginalTitle: section.originalTitle,
      sourceSectionSummary: section.summary
    }))
  );

  return {
    type: "whole-theme",
    sections,
    atoms,
    questionCount: countRawQuizQuestions(getRawEntriesForRouteSelection(null, "all")),
    knowledgeItemCount: countKnowledgeItems(atoms)
  };
}

function getKnowledgeContext() {
  if (!knowledgeBank.sections || !knowledgeBank.sections.length) {
    return null;
  }

  if (state.selection.targetId === "all") {
    return wholeThemeKnowledge;
  }

  if (state.selection.lens === "subject") {
    return getActiveSubjectKnowledgeMap()[state.selection.targetId] || null;
  }

  if (state.selection.lens === "bigidea") {
    return bigIdeaKnowledgeById[state.selection.targetId] || null;
  }

  return sectionKnowledgeById[state.selection.targetId] || null;
}

function countKnowledgeItems(atoms) {
  return atoms.reduce(
    (sum, atom) =>
      sum +
      atom.mustKnowPoints.length +
      atom.examples.length +
      atom.debateAngles.length +
      atom.keywords.length,
    0
  );
}

function getQuestionCueMood(question, fallbackMood) {
  return question && question.cueMood ? question.cueMood : fallbackMood;
}

function getGameMascotMood(mode, question, context, fallbackMood) {
  const baseMood = getQuestionCueMood(question, fallbackMood);

  if (mode === "race") {
    if (context.index >= context.total - 3) {
      return "excited";
    }
    if (context.timeRemaining <= 5 || context.lives === 1) {
      return "determined";
    }
    if (context.streak >= 3) {
      return "happy";
    }
    return baseMood;
  }

  if (mode === "alpacapardy") {
    if (context.value >= 400) {
      return "determined";
    }
    return baseMood;
  }

  if (mode === "run") {
    if (context.stage >= context.total - 2) {
      return "excited";
    }
    if (context.timeRemaining <= 30) {
      return "determined";
    }
    return baseMood;
  }

  if (mode === "jump") {
    if (context.lives <= 1) {
      return "determined";
    }
    return baseMood;
  }

  if (mode === "relay") {
    if (context.teamCount >= 4) {
      return "excited";
    }
    if (context.index >= context.total - 3) {
      return "determined";
    }
    return baseMood;
  }

  return baseMood;
}

function getQuestionTypeLabel(question) {
  const labels = {
    definition: "core idea recall",
    example: "example match",
    point: "must-know point",
    keyword: "keyword recall"
  };

  return labels[question && question.sourceType] || "theme checkpoint";
}

function getGamePromptLabel(mode, question) {
  const prefix = {
    race: "This stop decides the run",
    alpacapardy: "Think before you move",
    run: "Answer to move forward",
    jump: "Answer to keep jumping",
    relay: "Buzz in when you know it"
  };

  return `${prefix[mode] || "theme prompt"} · ${getQuestionTypeLabel(question)}`;
}

function getQuestionAnchorLine(question) {
  if (!question || !Array.isArray(question.anchors)) {
    return null;
  }

  return question.anchors.find((anchor) => anchor && !anchor.startsWith("Focus:")) || null;
}

function getQuestionTypeHint(question) {
  const hints = {
    definition: "Look for the cleanest core idea, not just a nearby example.",
    example: "Match the subtopic to the clearest concrete example.",
    point: "Find the statement that sounds like a real WSC takeaway.",
    keyword: "Lock onto the exact vocabulary tied to this lane."
  };

  return hints[question && question.sourceType] || "Compare the four options for the tightest thematic fit.";
}

function pushUniqueNote(notes, note) {
  if (!note || notes.includes(note)) {
    return;
  }

  notes.push(note);
}

function renderGameNotes(question, mode, context) {
  const notes = [];
  const section = question ? sectionById[question.sectionId] : null;
  const subjectLabels = getQuestionSubjectLabels(question);

  if (mode === "race") {
    pushUniqueNote(notes, `Pressure stop ${context.index + 1}`);
    pushUniqueNote(notes, `Current level: ${context.level}`);
    pushUniqueNote(notes, `Chances remaining: ${context.lives} · ${context.timeRemaining}s on the clock`);
    if (context.index >= context.total - 3) {
      pushUniqueNote(notes, "Final stretch: every mistake can end the run.");
    } else if (context.streak >= 3) {
      pushUniqueNote(notes, `Pressure streak live: ${context.streak} correct in a row.`);
    } else {
      pushUniqueNote(notes, "Answer fast, but still choose the cleanest thematic match.");
    }
  } else if (mode === "alpacapardy") {
    pushUniqueNote(notes, `Board stop ${Math.min(context.cleared + 1, context.total)} of ${context.total} · ${context.value} points`);
    pushUniqueNote(
      notes,
      context.value >= 400
        ? "High-value clue: slow down and separate near-matches carefully."
        : "Lower-value clue: use it to lock the category pattern early."
    );
  } else if (mode === "run") {
    pushUniqueNote(notes, `Travel leg ${context.stage + 1} of ${context.total} · ${formatCountdown(context.timeRemaining)} left`);
    pushUniqueNote(notes, `You are here: ${context.currentStop}`);
    pushUniqueNote(notes, `Next stop: ${context.nextStop}`);
  } else if (mode === "jump") {
    pushUniqueNote(notes, `Desert question ${context.index + 1} of ${context.total} · ${context.value} level`);
    pushUniqueNote(notes, `${context.lives} lives left`);
    pushUniqueNote(notes, `Distance: ${Math.round(context.distance)}m`);
  } else if (mode === "relay") {
    pushUniqueNote(notes, `Shared stop ${context.index + 1} of ${context.total}`);
    pushUniqueNote(notes, `${context.teamCount} teams are live on the same keyboard.`);
    pushUniqueNote(notes, `Buzz first, then answer within ${GAME_CONFIG.relayAnswerTime} seconds.`);
    pushUniqueNote(notes, "A wrong turn or timeout gives the points to every other team.");
  }

  if (question && question.sourceSubtopic) {
    pushUniqueNote(notes, `Focus: ${question.sourceSubtopic}`);
  } else if (question) {
    pushUniqueNote(notes, `Focus: ${section.title}`);
  }

  const anchorLine = getQuestionAnchorLine(question);
  if (anchorLine) {
    pushUniqueNote(notes, anchorLine);
  } else if (section) {
    pushUniqueNote(notes, section.angle);
  }

  if (question) {
    pushUniqueNote(notes, getQuestionTypeHint(question));
  }

  if (question && !anchorLine) {
    pushUniqueNote(notes, subjectLabels.length ? `Subjects: ${subjectLabels.join(", ")}` : null);
  } else if (question) {
    pushUniqueNote(notes, section ? section.blurb : null);
  }

  return `
    <div class="game-note-list">
      ${notes.slice(0, 4).map((note) => `
        <div class="game-note-item">
          <span class="alpaca-bullet" aria-hidden="true"></span>
          <span>${escapeHtml(note)}</span>
        </div>
      `).join("")}
    </div>
  `;
}

function buildWholeThemeDeck(knowledge) {
  const architectureSource = state.selection.lens === "subject"
    ? getActiveSubjectCatalog()
    : state.selection.lens === "bigidea"
      ? BIG_IDEA_ROUTES
      : data.sections;
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
      title: data.theme.name,
      body: `${data.theme.summary} This full route now uses the expanded local knowledge bank.`,
      bullets: [
        `${knowledge.sections.length} official guiding sections are included.`,
        `${knowledge.atoms.length} explicit subtopics are included.`,
        `${knowledge.knowledgeItemCount} structured knowledge items are available across the bank.`,
        ...data.insights.map((insight) => `${insight.title}: ${insight.body}`)
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

function buildWholeThemeMindMap(knowledge) {
  return {
    kicker: "Main route map",
    centerTitle: data.theme.name,
    centerBody: `Full bank loaded: ${knowledge.sections.length} sections, ${knowledge.atoms.length} subtopics, and ${knowledge.knowledgeItemCount} structured knowledge items.`,
    nodes: knowledge.sections.map((section) => ({
      title: section.title,
      body: section.summary,
      tags: [`${section.atoms.length} subtopics`, ...section.officialSubjects]
    })),
    prompts: knowledge.atoms.map((atom) => ({
      title: `${atom.sourceSectionOriginalTitle} · ${atom.subtopic}`,
      body: atom.coreIdea
    }))
  };
}

function buildSubjectMindMap(knowledge) {
  return {
    kicker: usesGranularLearnSubjects() ? "Study lane map" : "Subject route map",
    centerTitle: knowledge.label,
    centerBody: `${knowledge.description} This ${usesGranularLearnSubjects() ? "study lane" : "subject route"} includes ${knowledge.sections.length} sections, ${knowledge.atoms.length} subtopics, and ${knowledge.knowledgeItemCount} knowledge items.`,
    nodes: knowledge.sections.map((section) => ({
      title: section.title,
      body: section.summary,
      tags: [`${section.atoms.length} subtopics`, ...section.overlayCategories]
    })),
    prompts: knowledge.atoms.map((atom) => ({
      title: `${atom.sourceSectionOriginalTitle} · ${atom.subtopic}`,
      body: atom.coreIdea
    }))
  };
}

function buildSectionMindMap(knowledge) {
  return {
    kicker: "Guiding-section route map",
    centerTitle: knowledge.title,
    centerBody: `${knowledge.summary} This route includes ${knowledge.atoms.length} subtopics and ${knowledge.knowledgeItemCount} explicit knowledge items.`,
    nodes: knowledge.atoms.map((atom) => ({
      title: atom.subtopic,
      body: atom.coreIdea,
      tags: [atom.difficulty, ...atom.keywords]
    })),
    prompts: knowledge.atoms.flatMap((atom) => atom.mustKnowPoints.map((point, index) => ({
      title: `${atom.subtopic} · Must know ${index + 1}`,
      body: point
    })))
  };
}

function samplePrompts(questions, count) {
  return questions.slice(0, count).map((question) => question.prompt);
}

function pickQuestions(questions, count) {
  const pool = shuffle(questions.slice());
  return pool.slice(0, Math.min(count, pool.length));
}

function countJeopardyTiles(board) {
  return alpacapardyEngine.countTiles(board);
}

function countJeopardyDoneTiles(board) {
  return alpacapardyEngine.countDoneTiles(board);
}

function allJeopardyTilesDone(board) {
  return alpacapardyEngine.allTilesDone(board);
}

function isActiveJeopardyTile(groupIndex, tileIndex) {
  return Boolean(
    state.experience &&
      state.experience.type === "jeopardy" &&
      state.experience.active &&
      state.experience.active.groupIndex === groupIndex &&
      state.experience.active.tileIndex === tileIndex
  );
}

function getAccuracy(answers) {
  if (!answers.length) {
    return 0;
  }
  const correct = answers.filter((answer) => answer.isCorrect).length;
  return Math.round((correct / answers.length) * 100);
}

function getBestStreakFromAnswers(answers) {
  let best = 0;
  let current = 0;

  answers.forEach((answer) => {
    if (answer.isCorrect) {
      current += 1;
      best = Math.max(best, current);
    } else {
      current = 0;
    }
  });

  return best;
}

function getHighestTeamScore(teams = []) {
  return alpacapardyEngine.getHighestTeamScore(teams);
}

function getRunReachedStage(experience) {
  if (!experience || !Array.isArray(experience.route) || !experience.route.length) {
    return -1;
  }

  return Math.min(
    experience.route.length - 1,
    Math.max(0, Number.isInteger(experience.stage) ? experience.stage : 0)
  );
}

function updateBestGameStats(result) {
  if (!result || typeof result !== "object") {
    return;
  }

  if (result.type === "jeopardy") {
    state.stats.bestAlpacapardyScore = Math.max(
      state.stats.bestAlpacapardyScore,
      Number(result.teamOneScore ?? result.score) || 0
    );
  } else if (result.type === "run") {
    const stage = Number(result.stage);
    state.stats.bestRunStage = Math.max(state.stats.bestRunStage, Number.isFinite(stage) ? stage : -1);
  } else if (result.type === "jump") {
    state.stats.bestJumpScore = Math.max(state.stats.bestJumpScore, Number(result.score) || 0);
    state.stats.bestJumpDistance = Math.max(state.stats.bestJumpDistance, Number(result.distance) || 0);
  } else if (result.type === "relay") {
    state.stats.bestRelayScore = Math.max(
      state.stats.bestRelayScore,
      Number(result.teamOneScore ?? result.score) || 0
    );
  } else if (result.type === "race") {
    state.stats.bestRaceScore = Math.max(state.stats.bestRaceScore, Number(result.score) || 0);
  }
}

function finalizeSessionStats(answers, bestStreak, gameResult = null) {
  const accuracy = getAccuracy(answers);
  const answered = answers.length;
  const correct = answers.filter((answer) => answer.isCorrect).length;
  state.stats.sessions += 1;
  state.stats.totalAnswered += answered;
  state.stats.totalCorrect += correct;
  state.stats.bestAccuracy = Math.max(state.stats.bestAccuracy, accuracy);
  state.stats.bestStreak = Math.max(state.stats.bestStreak, bestStreak);
  updateBestGameStats(gameResult);
  saveStats();
  renderStats();
}

function getPerformanceRating(accuracy) {
  if (accuracy >= 90) {
    return {
      title: "Tournament of Champions Alpaca",
      badge: "Brilliant arrival",
      body: "You already have a strong grip on the logic of the theme and the way it connects across subjects."
    };
  }

  if (accuracy >= 75) {
    return {
      title: "Strategist Alpaca",
      badge: "Almost at the summit",
      body: "Very strong foundation. A few foggy patches remain, but the structure of the theme is already clear."
    };
  }

  if (accuracy >= 55) {
    return {
      title: "In-Transit Alpaca",
      badge: "Good direction",
      body: "You have the major lanes in place. Another run should turn more of those near-misses into instant answers."
    };
  }

  return {
    title: "Explorer Alpaca",
    badge: "The journey begins",
    body: "This is a good starting point. Repeat exposure is exactly how this theme becomes natural and fast."
  };
}

function getPerformanceMood(accuracy) {
  if (accuracy >= 90) {
    return "victory";
  }
  if (accuracy >= 75) {
    return "happy";
  }
  if (accuracy >= 50) {
    return "wise";
  }
  return "sad";
}

function getPathOption(pathId) {
  return PATH_OPTIONS.find((option) => option.id === pathId);
}

function getLensLabel(lensId) {
  const match = LENS_OPTIONS.find((option) => option.id === lensId);
  return match ? match.title : lensId;
}

function getModeOption(modeId) {
  return getDecoratedModeOption(Object.values(MODE_OPTIONS).flat().find((option) => option.id === modeId));
}

function getLensCardPluralLabel(lensId) {
  if (lensId === "subject") {
    return "subject routes";
  }

  if (lensId === "bigidea") {
    return "big ideas";
  }

  return "guiding sections";
}

function getOrderedSectionIds() {
  return data.sections.map((section) => section.id);
}

function getSelectedSectionIds() {
  const orderedIds = getOrderedSectionIds();
  const selected = Array.isArray(state.selection.targetIds) ? state.selection.targetIds : [];
  const normalized = new Set(selected.map((id) => normalizeSectionId(id)).filter(Boolean));

  if (normalized.size) {
    return orderedIds.filter((id) => normalized.has(id));
  }

  if (state.selection.lens === "section" && state.selection.targetId && state.selection.targetId !== "all") {
    const targetId = normalizeSectionId(state.selection.targetId);
    return orderedIds.includes(targetId) ? [targetId] : [];
  }

  if (state.selection.targetId === "all") {
    return orderedIds;
  }

  return [];
}

function getSelectedSectionLabels() {
  return getSelectedSectionIds()
    .map((id) => sectionById[id] ? sectionById[id].title : id)
    .filter(Boolean);
}

function getSelectedSectionLabel() {
  const selectedIds = getSelectedSectionIds();
  if (!selectedIds.length) {
    return "Guiding Sections";
  }

  if (selectedIds.length === 1) {
    return sectionById[selectedIds[0]] ? sectionById[selectedIds[0]].title : selectedIds[0];
  }

  return `${selectedIds.length} guiding sections`;
}

function getTargetLabelForLens(lensId, targetId) {
  if (targetId === "all") {
    if (lensId === "subject") {
      return "All subjects";
    }

    if (lensId === "bigidea") {
      return "All big ideas";
    }

    return "All guiding sections";
  }

  if (lensId === "subject") {
    const subjectCatalog = getActiveSubjectCatalog();
    const match = subjectCatalog.find((subject) => subject.id === targetId);
    return match ? match.label : targetId;
  }

  if (lensId === "bigidea") {
    return bigIdeaRouteById[targetId] ? bigIdeaRouteById[targetId].label : targetId;
  }

  return sectionById[targetId] ? sectionById[targetId].title : targetId;
}

function getTargetLabel() {
  if (state.selection.lens === "section") {
    return getSelectedSectionLabel();
  }

  return getTargetLabelForLens(state.selection.lens, state.selection.targetId);
}

function getDefaultStats() {
  return progressStorageController.getDefaultStats();
}

function normalizeStats(value) {
  return progressStorageController.normalizeStats(value);
}

function normalizeRawMastery(value) {
  return progressStorageController.normalizeRawMastery(value);
}

function loadStats() {
  return progressStorageController.loadStats();
}

function loadRawMastery() {
  return progressStorageController.loadRawMastery();
}

function loadGuestAlpacaName() {
  return progressStorageController.loadGuestAlpacaName();
}

function saveStats() {
  saveProgressLocally();
  saveAlpacaProgress();
}

function saveRawMastery() {
  saveProgressLocally();
  saveAlpacaProgress();
}

function saveProgressLocally() {
  const result = progressStorageController.saveLocalProgress(state);
  state.ui.localProgressSaveError = result?.ok
    ? ""
    : "Local progress could not be saved in this browser. You can keep using WSCapp, but progress may reset after reload.";
  return result;
}

async function saveAlpacaProgress() {
  const client = getSupabaseClient();
  const user = state.auth.session && state.auth.session.user;
  if (!client || !user || isAnonymousUser(user)) {
    return;
  }

  try {
    if (supabaseProfileService?.upsertProgress) {
      await supabaseProfileService.upsertProgress(client, user.id, state.stats, state.rawMastery);
    } else {
      await client
        .from("alpaca_progress")
        .upsert({
          user_id: user.id,
          game_stats: state.stats,
          raw_mastered_entries: state.rawMastery,
          updated_at: new Date().toISOString()
        }, { onConflict: "user_id" });
    }
  } catch (_error) {
    // Local progress remains available if the Supabase progress table is not installed yet.
  }
}

function getAssetValue(path, fallback = null) {
  return appAssetService?.getValue
    ? appAssetService.getValue(path, fallback)
    : fallback;
}

function getWizardCardAsset(asset) {
  return appAssetService?.getWizardCardAsset
    ? appAssetService.getWizardCardAsset(asset)
    : asset;
}

function renderAssetImage(src, alt, slotClass = "", imageClass = "", eager = false) {
  if (!src) {
    return "";
  }
  const resolvedSrc = versionAssetSrc(src);

  return `
    <div class="${["asset-slot", slotClass].filter(Boolean).join(" ")}">
      <img
        class="${["asset-image", imageClass].filter(Boolean).join(" ")}"
        src="${escapeHtml(resolvedSrc)}"
        alt="${escapeHtml(alt)}"
        loading="${eager ? "eager" : "lazy"}"
        decoding="async"
      />
    </div>
  `;
}

function versionAssetSrc(src) {
  const value = String(src || "");
  if (
    !value ||
    /[?&]v=/.test(value) ||
    /^(?:https?:|data:|blob:)/i.test(value) ||
    !/^(?:\.\/)?(?:assets|app-icons)\//.test(value)
  ) {
    return value;
  }

  return `${value}${value.includes("?") ? "&" : "?"}v=${ASSET_CACHE_VERSION}`;
}

function renderOptionToken(index) {
  const letter = String.fromCharCode(65 + index);
  const src = index >= 0 && index < 26
    ? `./assets/icons/letters/${letter}.png`
    : null;

  if (src && index < 4) {
    return `
      <span class="option-token image" aria-hidden="true">
        <img class="option-token-image" src="${src}" alt="${escapeHtml(letter)} option token" loading="lazy" decoding="async" />
      </span>
    `;
  }

  return `<span class="option-token text">${escapeHtml(letter)}</span>`;
}

function preloadExperienceAudio() {
  const relayBuzzSrc = getAssetValue(["multiplayer", "buzzSound"]);
  if (!relayBuzzSrc) {
    return;
  }

  relayBuzzAudio = new Audio(relayBuzzSrc);
  relayBuzzAudioSrc = relayBuzzSrc;
  relayBuzzAudio.preload = "auto";
  relayBuzzAudio.volume = 0.8;
}

function playRelayBuzzSound() {
  const relayBuzzSrc = getAssetValue(["multiplayer", "buzzSound"]);
  if (!relayBuzzSrc) {
    return;
  }

  if (!relayBuzzAudio || relayBuzzAudioSrc !== relayBuzzSrc) {
    relayBuzzAudio = new Audio(relayBuzzSrc);
    relayBuzzAudioSrc = relayBuzzSrc;
    relayBuzzAudio.preload = "auto";
    relayBuzzAudio.volume = 0.8;
  }

  relayBuzzAudio.currentTime = 0;
  const playback = relayBuzzAudio.play();
  if (playback && typeof playback.catch === "function") {
    playback.catch(() => {});
  }
}

function renderReviewBadgeMarkup(label) {
  if (!ALPACA_REVIEW_MODE || !label || !ALPACA_PENDING_REVIEW.has(String(label))) {
    return "";
  }

  return `<span class="alpaca-review-badge" aria-label="Review marker ${escapeHtml(label)}">${escapeHtml(label)}</span>`;
}

function wrapWithReviewBadge(markup, label) {
  if (!ALPACA_REVIEW_MODE || !label) {
    return markup;
  }

  return `<span class="alpaca-review-shell">${markup}${renderReviewBadgeMarkup(label)}</span>`;
}

function getPathReviewBadge(pathId) {
  return ALPACA_REVIEW_MODE ? (ALPACA_REVIEW_BADGES.paths?.[pathId] || null) : null;
}

function getLensReviewBadge(lensId) {
  return ALPACA_REVIEW_MODE ? (ALPACA_REVIEW_BADGES.lenses?.[lensId] || null) : null;
}

function getModeReviewBadge(modeId) {
  return ALPACA_REVIEW_MODE ? (ALPACA_REVIEW_BADGES.modes?.[modeId] || null) : null;
}

function getTargetReviewBadge(targetId = state.selection.targetId) {
  if (!ALPACA_REVIEW_MODE || !targetId) {
    return null;
  }

  if (targetId === "all") {
    return ALPACA_REVIEW_BADGES.targets?.all || null;
  }

  if (state.selection.lens === "bigidea") {
    return null;
  }

  const branch = state.selection.lens === "subject" ? "subject" : "section";
  return ALPACA_REVIEW_BADGES.targets?.[branch]?.[targetId] || null;
}

function getGameplayReviewBadge(stage, modeId = state.experience?.type || state.selection.mode) {
  if (!ALPACA_REVIEW_MODE || !modeId) {
    return null;
  }

  return ALPACA_REVIEW_BADGES.gameplay?.[stage]?.[modeId] || null;
}

function renderConfiguredMascotAsset(asset, fallbackMood, size, options = {}) {
  const badge = options.reviewBadge || null;

  if (asset) {
    return wrapWithReviewBadge(renderAssetImage(
      asset,
      options.alt || `${fallbackMood} alpaca`,
      ["mascot-slot", `mascot-slot-${size}`, options.slotClass].filter(Boolean).join(" "),
      ["mascot-asset", `mascot-asset-${size}`, options.imageClass].filter(Boolean).join(" "),
      options.eager === true
    ), badge);
  }

  return wrapWithReviewBadge(renderMascot(fallbackMood, size, options), badge);
}

function getTargetAssetPath(targetId = state.selection.targetId) {
  return appAssetService?.getTargetPath
    ? appAssetService.getTargetPath(targetId, state.selection.lens)
    : null;
}

function getModeAssetPath(modeId = state.selection.mode) {
  return appAssetService?.getModePath
    ? appAssetService.getModePath(modeId)
    : null;
}

function getGameplayAssetPath(stage, modeId = state.experience?.type || state.selection.mode) {
  return appAssetService?.getGameplayPath
    ? appAssetService.getGameplayPath(stage, modeId)
    : null;
}

function getResultAssetPath(modeId = state.experience?.type, outcome = "success") {
  return appAssetService?.getResultPath
    ? appAssetService.getResultPath(modeId, outcome)
    : null;
}

function getFallbackMood(mood) {
  const moodFallbacks = {
    excited: "happy",
    victory: "happy",
    retry: "sad",
    neutral: "wise",
    thinking: "wise"
  };

  return moodFallbacks[mood] || mood;
}

function renderMascot(mood, size, options = {}) {
  const asset = getAssetValue(["mascot", "states", mood, size]) || getAssetValue(["mascot", "states", mood, "default"]);

  if (asset) {
    return renderAssetImage(
      asset,
      options.alt || `${mood} alpaca`,
      ["mascot-slot", `mascot-slot-${size}`, options.slotClass].filter(Boolean).join(" "),
      ["mascot-asset", `mascot-asset-${size}`, options.imageClass].filter(Boolean).join(" "),
      options.eager === true
    );
  }

  return alpacaAvatar(getFallbackMood(mood), size);
}

function renderHeroVisual() {
  const heroAsset = getAssetValue(["screens", "hero", "main"]);
  const content = heroAsset
    ? renderAssetImage(heroAsset, "WSC 2026 Study Routes hero illustration", "hero-visual-asset", "hero-visual-image", true)
    : renderMascot("happy", "hero", { alt: "Hero alpaca", eager: true });

  return `<div class="hero-visual-slot">${content}</div>`;
}

function renderLessonVisual(type) {
  const key = type === "slideshow" ? "slideshowIllustration" : "mindmapGuide";
  const label = type === "slideshow" ? "Slideshow lesson illustration" : "Mind map guide illustration";
  const lessonAsset = getAssetValue(["lessons", key]) || getTargetAssetPath() || getModeAssetPath(type);
  const reviewBadge = getTargetReviewBadge() || getModeReviewBadge(type);
  const content = lessonAsset
    ? renderAssetImage(
      lessonAsset,
      label,
      `lesson-visual-slot lesson-visual-slot-${type}`,
      `lesson-visual-image lesson-visual-image-${type}`
    )
    : renderMascot("wise", "large", { alt: label });

  return `<div class="lesson-visual-shell lesson-visual-shell-${type}">${wrapWithReviewBadge(content, reviewBadge)}</div>`;
}

function renderCheckpointVisual(kind) {
  const isSuccess = kind === "success";
  const asset = getAssetValue(["screens", "checkpoints", isSuccess ? "success" : "fail"]);
  const label = isSuccess ? "Checkpoint cleared visual" : "Checkpoint retry visual";
  const content = asset
    ? renderAssetImage(
      asset,
      label,
      `checkpoint-visual-slot checkpoint-visual-slot-${kind}`,
      `checkpoint-visual-image checkpoint-visual-image-${kind}`
    )
    : renderMascot(isSuccess ? "happy" : "sad", "medium", { alt: label });

  return `<div class="checkpoint-visual checkpoint-visual-${kind}">${content}</div>`;
}

function renderJeopardyDecoration() {
  const asset = getAssetValue(["boards", "alpacapardyOverlay"]) || getAssetValue(["boards", "jeopardyOverlay"]);
  return renderAssetImage(
    asset,
    "Alpacapardy board decoration",
    "board-decoration board-decoration-jeopardy",
    "board-decoration-image board-decoration-image-jeopardy"
  );
}

function renderRaceFrame() {
  const asset = getAssetValue(["race", "frame"]);
  return renderAssetImage(
    asset,
    "Race mode frame",
    "race-card-art race-card-art-frame",
    "race-card-art-image race-card-art-image-frame"
  );
}

function renderRaceTimerWidget(seconds, stateClass = "", totalSeconds = 12) {
  const normalizedState = stateClass === "danger"
    ? "critical"
    : stateClass === "warning"
      ? "warning"
      : "normal";
  const safeTotal = Math.max(1, Number(totalSeconds) || 1);
  const safeSeconds = Math.max(0, Number(seconds) || 0);
  const fractionLeft = Math.max(0, Math.min(1, safeSeconds / safeTotal));
  const progressCircumference = 439.82;
  const warningCircumference = 515.22;
  const progressOffset = (progressCircumference * (1 - fractionLeft)).toFixed(2);
  const warningFraction = normalizedState === "normal"
    ? 0
    : normalizedState === "warning"
      ? Math.max(0.22, Math.min(0.54, 0.22 + ((9 - safeSeconds) / 4) * 0.32))
      : Math.max(0.56, Math.min(0.82, 0.56 + ((5 - safeSeconds) / 5) * 0.26));
  const warningOffset = (warningCircumference * (1 - warningFraction)).toFixed(2);
  const timeLabel = String(safeSeconds);

  return `
    <div class="race-timer-widget ${stateClass || "normal"}" aria-hidden="true">
      <svg
        class="race-timer-widget-svg"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 240 240"
        width="240"
        height="240"
        fill="none"
        role="img"
        aria-label="Race countdown timer"
      >
        <defs>
          <style>
            .shadow-ring { fill: #4b2f21; opacity: 0.16; }
            .outer-frame { fill: #5a3726; }
            .main-body { fill: #ead8b7; stroke: #5a3726; stroke-width: 3; vector-effect: non-scaling-stroke; }
            .track-ring { fill: none; stroke: #c9b18d; stroke-width: 14; opacity: 0.95; vector-effect: non-scaling-stroke; }
            .progress-ring { fill: none; stroke: #6d1f26; stroke-width: 14; stroke-linecap: round; vector-effect: non-scaling-stroke; }
            .warning-ring { fill: none; stroke: #d8b13f; stroke-width: 6; stroke-linecap: round; opacity: 0; vector-effect: non-scaling-stroke; }
            .critical-ring { fill: none; stroke: #57171d; stroke-width: 4; stroke-linecap: round; opacity: 0; vector-effect: non-scaling-stroke; }
            .inner-disc { fill: #f2e5cb; stroke: #5a3726; stroke-width: 2.5; vector-effect: non-scaling-stroke; }
            .inner-line { fill: none; stroke: #d8b13f; stroke-width: 1.5; opacity: 0.9; vector-effect: non-scaling-stroke; }
            .tick-major { stroke: #5a3726; stroke-width: 3; stroke-linecap: round; opacity: 0.72; vector-effect: non-scaling-stroke; }
            .tick-minor { stroke: #b98d31; stroke-width: 2; stroke-linecap: round; opacity: 0.72; vector-effect: non-scaling-stroke; }
            .accent { fill: #d8b13f; opacity: 0.95; }
            .time-text { fill: #5a3726; font-family: Inter, Arial, sans-serif; font-size: 50px; font-weight: 800; text-anchor: middle; dominant-baseline: middle; letter-spacing: 1px; }
            .label-text { fill: #6d1f26; font-family: Inter, Arial, sans-serif; font-size: 11px; font-weight: 700; text-anchor: middle; letter-spacing: 2.6px; opacity: 0.88; }
            .state-normal .progress-ring { stroke: #6d1f26; }
            .state-normal .warning-ring { opacity: 0; }
            .state-normal .critical-ring { opacity: 0; }
            .state-warning .progress-ring { stroke: #b98d31; }
            .state-warning .warning-ring { opacity: 0.95; }
            .state-critical .progress-ring { stroke: #57171d; }
            .state-critical .warning-ring { opacity: 0.7; }
            .state-critical .critical-ring { opacity: 1; }
            .state-critical .time-text { fill: #57171d; }
          </style>
        </defs>
        <g id="timer-widget" class="state-${normalizedState}">
          <circle class="shadow-ring" cx="120" cy="124" r="102"/>
          <circle class="outer-frame" cx="120" cy="120" r="104"/>
          <circle class="main-body" cx="120" cy="120" r="98"/>
          <g id="timer-ticks">
            <path class="tick-major" d="M120 30V40"/>
            <path class="tick-major" d="M210 120H200"/>
            <path class="tick-major" d="M120 210V200"/>
            <path class="tick-major" d="M30 120H40"/>
            <path class="tick-minor" d="M165 42L161 50"/>
            <path class="tick-minor" d="M198 75L190 79"/>
            <path class="tick-minor" d="M198 165L190 161"/>
            <path class="tick-minor" d="M165 198L161 190"/>
            <path class="tick-minor" d="M75 198L79 190"/>
            <path class="tick-minor" d="M42 165L50 161"/>
            <path class="tick-minor" d="M42 75L50 79"/>
            <path class="tick-minor" d="M75 42L79 50"/>
          </g>
          <circle class="track-ring" cx="120" cy="120" r="70"/>
          <circle
            class="progress-ring"
            cx="120"
            cy="120"
            r="70"
            transform="rotate(-90 120 120)"
            stroke-dasharray="${progressCircumference}"
            stroke-dashoffset="${progressOffset}"
          />
          <circle
            class="warning-ring"
            cx="120"
            cy="120"
            r="82"
            transform="rotate(-90 120 120)"
            stroke-dasharray="${warningCircumference}"
            stroke-dashoffset="${warningOffset}"
          />
          <circle class="critical-ring" cx="120" cy="120" r="89"/>
          <circle class="inner-disc" cx="120" cy="120" r="48"/>
          <circle class="inner-line" cx="120" cy="120" r="40"/>
          <rect x="111" y="18" width="18" height="6" rx="3" class="accent"/>
          <path class="accent" d="M112 216H128L124 222H116L112 216Z"/>
          <text x="120" y="112" class="time-text">${escapeHtml(timeLabel)}</text>
          <text x="120" y="142" class="label-text">SECONDS</text>
        </g>
      </svg>
    </div>
  `;
}

function renderCompactRaceTimerCard(label, seconds, totalSeconds, stateClass = "normal", variant = "") {
  return `
    <div class="compact-race-timer-card ${escapeHtml(stateClass)} ${escapeHtml(variant)}">
      <span>${escapeHtml(label)}</span>
      ${renderRaceTimerWidget(seconds, stateClass, totalSeconds)}
      <strong>${escapeHtml(formatCountdown(seconds))}</strong>
    </div>
  `;
}

function getTimerVisualState(seconds, totalSeconds, options = {}) {
  const safeSeconds = Math.max(0, Number(seconds) || 0);
  const safeTotal = Math.max(1, Number(totalSeconds) || 1);
  const warningAt = Number.isFinite(options.warningAt) ? options.warningAt : Math.ceil(safeTotal * 0.36);
  const dangerAt = Number.isFinite(options.dangerAt) ? options.dangerAt : Math.ceil(safeTotal * 0.18);

  if (safeSeconds <= dangerAt) {
    return "danger";
  }

  if (safeSeconds <= warningAt) {
    return "warning";
  }

  return "normal";
}

function renderPopupQuestionTimerPanel(questionText, seconds, totalSeconds, stateClass = "normal") {
  return `
    <section class="popup-question-panel ${escapeHtml(stateClass)}">
      <div class="popup-question-copy">
        <h2 class="popup-question-text">${escapeHtml(questionText)}</h2>
      </div>
      <div class="popup-question-timer">
        ${renderRaceTimerWidget(seconds, stateClass, totalSeconds)}
      </div>
    </section>
  `;
}

function getRaceLifeState(index, livesRemaining) {
  if (index >= livesRemaining) {
    return "empty";
  }

  if (livesRemaining === 1 && index === 0) {
    return "warning";
  }

  return "full";
}

function renderRaceLivesIcon(state) {
  const normalizedState = state || "empty";
  const asset = getAssetValue(["race", "livesIcon", normalizedState]) || getAssetValue(["race", "livesIcon"]);
  return renderAssetImage(
    asset,
    normalizedState === "warning" ? "Last chance" : normalizedState === "full" ? "Life available" : "Life spent",
    `race-life-asset ${normalizedState}`,
    "race-life-asset-image"
  );
}

function hasRaceLivesIconAssets() {
  return Boolean(
    getAssetValue(["race", "livesIcon", "full"]) ||
    getAssetValue(["race", "livesIcon", "warning"]) ||
    getAssetValue(["race", "livesIcon", "empty"]) ||
    getAssetValue(["race", "livesIcon"])
  );
}

function renderRaceFailVisual() {
  const asset = getAssetValue(["race", "failState"]);
  if (asset) {
    return renderAssetImage(
      asset,
      "Race fail state visual",
      "race-fail-visual",
      "race-fail-visual-image"
    );
  }

  return renderMascot("sad", "medium", { alt: "Race fail state" });
}

function alpacaAvatar(mood, size) {
  return `
    <div class="alpaca-avatar ${escapeHtml(mood)} ${escapeHtml(size)}" aria-hidden="true">
      <span class="alpaca-ear left"></span>
      <span class="alpaca-ear right"></span>
      <span class="alpaca-fluff"></span>
      <span class="alpaca-face">
        <span class="alpaca-eye left"></span>
        <span class="alpaca-eye right"></span>
        <span class="alpaca-snout"></span>
        <span class="alpaca-mouth"></span>
        <span class="alpaca-tear"></span>
      </span>
    </div>
  `;
}

function renderAlpacaList(items) {
  return `
    <div class="alpaca-list">
      ${items.map((item) => `
        <div class="alpaca-li">
          <span class="alpaca-bullet" aria-hidden="true"></span>
          <span>${escapeHtml(item)}</span>
        </div>
      `).join("")}
    </div>
  `;
}

function getRawVisualAssetHelpers() {
  return {
    escapeHtml,
    getEmbeddableVideo
  };
}

function renderRawStudentAssets(entry, entryIndex) {
  return rawContentVisualAssets?.renderStudentAssets
    ? rawContentVisualAssets.renderStudentAssets(entry, entryIndex, state.ui.rawAssetSelections, getRawVisualAssetHelpers())
    : "";
}

function getRawAssetSelectionKey(entryIndex, assetIndex) {
  return rawContentVisualAssets?.getSelectionKey
    ? rawContentVisualAssets.getSelectionKey(entryIndex, assetIndex)
    : `${entryIndex}:${assetIndex}`;
}

function selectRawAssetPoint(entryIndex, assetIndex, pointIndex) {
  if (!Number.isFinite(entryIndex) || !Number.isFinite(assetIndex) || !Number.isFinite(pointIndex)) {
    return;
  }

  state.ui.rawAssetSelections = {
    ...state.ui.rawAssetSelections,
    [getRawAssetSelectionKey(entryIndex, assetIndex)]: pointIndex
  };
  renderExperience();
}

function renderRawSpecialAssets(assets, entryIndex) {
  return rawContentVisualAssets?.renderSpecialAssets
    ? rawContentVisualAssets.renderSpecialAssets(assets, entryIndex, state.ui.rawAssetSelections, getRawVisualAssetHelpers())
    : "";
}

function renderRawSpecialAsset(asset, entryIndex, assetIndex) {
  return rawContentVisualAssets?.renderSpecialAsset
    ? rawContentVisualAssets.renderSpecialAsset(asset, entryIndex, assetIndex, state.ui.rawAssetSelections, getRawVisualAssetHelpers())
    : "";
}

function renderRawTimelineAsset(asset, entryIndex, assetIndex) {
  return rawContentVisualAssets?.renderTimelineAsset
    ? rawContentVisualAssets.renderTimelineAsset(asset, entryIndex, assetIndex, state.ui.rawAssetSelections, getRawVisualAssetHelpers())
    : "";
}

function renderRawRouteMapAsset(asset, entryIndex, assetIndex) {
  return rawContentVisualAssets?.renderRouteMapAsset
    ? rawContentVisualAssets.renderRouteMapAsset(asset, entryIndex, assetIndex, state.ui.rawAssetSelections, getRawVisualAssetHelpers())
    : "";
}

function renderRawImageCardAsset(asset) {
  return rawContentVisualAssets?.renderImageCardAsset
    ? rawContentVisualAssets.renderImageCardAsset(asset, getRawVisualAssetHelpers())
    : "";
}

function renderRawVisualSections(sections, entryIndex) {
  return rawContentVisualAssets?.renderVisualSections
    ? rawContentVisualAssets.renderVisualSections(sections, entryIndex, getRawVisualAssetHelpers())
    : "";
}

function renderRawVisualFooterQuestion(footer) {
  return rawContentVisualAssets?.renderVisualFooterQuestion
    ? rawContentVisualAssets.renderVisualFooterQuestion(footer, getRawVisualAssetHelpers())
    : "";
}

function renderRawVisualGallery(items, entryIndex, sectionIndex = null) {
  return rawContentVisualAssets?.renderVisualGallery
    ? rawContentVisualAssets.renderVisualGallery(items, entryIndex, getRawVisualAssetHelpers(), sectionIndex)
    : "";
}

function renderRawVisualLinkPreview(item) {
  return rawContentVisualAssets?.renderVisualLinkPreview
    ? rawContentVisualAssets.renderVisualLinkPreview(item, getRawVisualAssetHelpers())
    : "";
}

function getRawMediaLinkItems(item) {
  if (rawContentMediaLightbox?.getLinkItems) {
    return rawContentMediaLightbox.getLinkItems(item);
  }

  const explicitLinks = Array.isArray(item.links)
    ? item.links.filter((link) => link && link.url)
    : [];

  if (explicitLinks.length) {
    return explicitLinks;
  }

  if (item.url) {
    return [
      {
        label: item.previewLabel || "Open source",
        url: item.url
      }
    ];
  }

  return [];
}

function renderRawMediaLinkButtons(item) {
  if (rawContentMediaLightbox?.renderLinkButtons) {
    return rawContentMediaLightbox.renderLinkButtons(item, escapeHtml);
  }

  const links = getRawMediaLinkItems(item);
  if (!links.length) {
    return "";
  }

  return `
    <div class="raw-media-lightbox-link-list">
      ${links.map((link) => `
        <a class="raw-media-lightbox-link-button" href="${escapeHtml(link.url)}" target="_blank" rel="noreferrer">
          ${escapeHtml(link.label || "Open source")}
        </a>
      `).join("")}
    </div>
  `;
}

function getEmbeddableVideo(url) {
  if (appVideoService?.getEmbeddableVideo) {
    return appVideoService.getEmbeddableVideo(url);
  }

  if (!url) {
    return null;
  }

  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, "");

    if (host === "youtu.be") {
      const videoId = parsed.pathname.split("/").filter(Boolean)[0];
      if (!videoId) {
        return null;
      }

      return {
        provider: "youtube",
        embedUrl: `https://www.youtube.com/embed/${encodeURIComponent(videoId)}?rel=0&playsinline=1`
      };
    }

    if (host === "youtube.com" || host === "m.youtube.com") {
      const videoId = parsed.searchParams.get("v");
      const playlistId = parsed.searchParams.get("list");

      if (videoId) {
        const params = new URLSearchParams({ rel: "0" });
        if (playlistId) {
          params.set("list", playlistId);
        }

        return {
          provider: "youtube",
          embedUrl: `https://www.youtube.com/embed/${encodeURIComponent(videoId)}?${params.toString()}&playsinline=1`
        };
      }

      if (playlistId) {
        return {
          provider: "youtube",
          embedUrl: `https://www.youtube.com/embed/videoseries?list=${encodeURIComponent(playlistId)}&rel=0&playsinline=1`
        };
      }
    }
  } catch (_error) {
    return null;
  }

  return null;
}

function getVideoPreview(url) {
  if (appVideoService?.getPreview) {
    return appVideoService.getPreview(url);
  }

  if (!url) {
    return null;
  }

  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, "");
    let videoId = null;

    if (host === "youtu.be") {
      videoId = parsed.pathname.split("/").filter(Boolean)[0] || null;
    } else if (host === "youtube.com" || host === "m.youtube.com") {
      videoId = parsed.searchParams.get("v");
    }

    if (!videoId) {
      return null;
    }

    return {
      provider: "youtube",
      videoId,
      thumbnailUrl: `https://img.youtube.com/vi/${encodeURIComponent(videoId)}/hqdefault.jpg`
    };
  } catch (_error) {
    return null;
  }
}

function renderRawVisualPreview(kind) {
  return rawContentVisualAssets?.renderVisualPreview
    ? rawContentVisualAssets.renderVisualPreview(kind, getRawVisualAssetHelpers())
    : "";
}

function renderTextWithBreaks(value) {
  return escapeHtml(value).replace(/\n/g, "<br />");
}

function getRawOfficialDisplayText(entry) {
  return stripRawOfficialReferenceAppendix(entry?.rawOfficialText || "");
}

function stripRawOfficialReferenceAppendix(value) {
  const paragraphs = String(value || "")
    .replace(/\r\n?/g, "\n")
    .trimEnd()
    .split(/\n\s*\n+/);

  if (paragraphs.length < 2) {
    return String(value || "").trimEnd();
  }

  const cleaned = paragraphs.slice();
  while (cleaned.length > 1 && isRawOfficialReferenceAppendix(cleaned[cleaned.length - 1])) {
    cleaned.pop();
  }

  return cleaned.join("\n\n").trimEnd();
}

function isRawOfficialReferenceAppendix(block) {
  const lines = String(block || "")
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (!lines.length) {
    return false;
  }

  if (lines.length === 1) {
    const pieces = lines[0].split(/\s*\|\s*/).filter(Boolean);
    return pieces.length >= 3 && pieces.every((piece) => piece.length <= 90);
  }

  const pipeLines = lines.filter((line) => line.includes("|")).length;
  const referenceLines = lines.filter((line) => isRawOfficialReferenceLine(line)).length;

  return pipeLines / lines.length >= 0.7 || (lines.length >= 4 && referenceLines / lines.length >= 0.7);
}

function isRawOfficialReferenceLine(line) {
  const value = String(line || "").trim();
  if (!value) {
    return false;
  }

  if (value.includes("|")) {
    const pieces = value.split(/\s*\|\s*/).filter(Boolean);
    return pieces.length >= 2 && pieces.every((piece) => piece.length <= 96);
  }

  return /^[A-Z0-9"“][^.!?]{0,120}\((?:c\.\s*)?(?:\d{3,4}|early|late|mid)[^)]+\)\s*$/i.test(value);
}

function getRawQuizPagerKey(entry, entryIndex) {
  if (rawContentQuizRenderer?.getPagerKey) {
    return rawContentQuizRenderer.getPagerKey(entry, entryIndex, getSectionIdFromGuidingTitle);
  }

  return [
    "raw",
    entry?.sectionId || getSectionIdFromGuidingTitle(entry?.guidingSection || entry?.sectionTitle || "") || "section",
    entry?.id || entry?.title || "entry",
    entryIndex
  ].join("|");
}

function getRawQuizPageIndex(pagerKey, total) {
  if (rawContentQuizRenderer?.getPageIndex) {
    return rawContentQuizRenderer.getPageIndex(state.ui.rawQuizPages, pagerKey, total);
  }

  const index = Number(state.ui.rawQuizPages?.[pagerKey]);
  if (!Number.isFinite(index) || total < 1) {
    return 0;
  }
  return Math.max(0, Math.min(total - 1, index));
}

function renderRawQuizPager(entry, entryIndex) {
  if (rawContentQuizRenderer?.renderPager) {
    return rawContentQuizRenderer.renderPager(entry, entryIndex, {
      pages: state.ui.rawQuizPages,
      selections: state.ui.rawQuizSelections
    }, {
      escapeHtml,
      getVisibleQuizQuestionItems: getRawVisibleQuizQuestionItems,
      getSectionIdFromGuidingTitle,
      renderOptionToken,
      renderFeedback: renderRawQuizFeedback
    });
  }

  const items = getRawVisibleQuizQuestionItems(entry);
  if (!items.length) {
    return "";
  }

  const pagerKey = getRawQuizPagerKey(entry, entryIndex);
  const currentIndex = getRawQuizPageIndex(pagerKey, items.length);
  const current = items[currentIndex];

  return `
    <div class="raw-block raw-quiz-pager">
      <div class="raw-quiz-pager-head">
        <strong>Questions</strong>
        <span>Question ${currentIndex + 1} / ${items.length}</span>
      </div>
      ${renderRawQuizQuestion(current.question, entryIndex, current.questionIndex)}
      ${items.length > 1 ? `
        <div class="raw-quiz-pager-actions">
          <button
            class="button secondary small"
            type="button"
            data-raw-quiz-page="${escapeHtml(pagerKey)}"
            data-raw-quiz-direction="-1"
            data-raw-quiz-total="${items.length}"
            ${currentIndex === 0 ? "disabled" : ""}
          >Previous</button>
          <button
            class="button primary small"
            type="button"
            data-raw-quiz-page="${escapeHtml(pagerKey)}"
            data-raw-quiz-direction="1"
            data-raw-quiz-total="${items.length}"
            ${currentIndex === items.length - 1 ? "disabled" : ""}
          >Next</button>
        </div>
      ` : ""}
    </div>
  `;
}

function renderRawQuizQuestion(question, entryIndex, questionIndex) {
  if (rawContentQuizRenderer?.renderQuestion) {
    return rawContentQuizRenderer.renderQuestion(question, entryIndex, questionIndex, {
      selections: state.ui.rawQuizSelections
    }, {
      escapeHtml,
      renderOptionToken,
      renderFeedback: renderRawQuizFeedback
    });
  }

  const quizKey = getRawQuizQuestionKey(question);
  const selectedIndex = state.ui.rawQuizSelections[quizKey];
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
            class="raw-quiz-option ${renderRawQuizOptionStateClass(option, index, selectedIndex)}"
            type="button"
            data-raw-quiz-option="${index}"
            data-raw-quiz-key="${escapeHtml(quizKey)}"
            aria-pressed="${selectedIndex === index ? "true" : "false"}"
          >
            ${renderOptionToken(index)}
            <span>${escapeHtml(option.text)}</span>
          </button>
        `).join("")}
      </div>
      ${renderRawQuizFeedback(question, selectedOption)}
    </article>
  `;
}

function openRawMediaLightboxFromTrigger(trigger) {
  const payload = getRawContentPayload();
  if (!payload) {
    return;
  }

  const anchor = getRawMediaLightboxAnchor(trigger);
  const kind = trigger.dataset.openRawMedia;
  if (kind === "gallery") {
    const entry = payload.entries[Number(trigger.dataset.rawMediaEntryIndex)];
    const sectionIndex = Number(trigger.dataset.rawMediaSectionIndex);
    const sourceItems = Number.isFinite(sectionIndex)
      ? entry?.visualSections?.[sectionIndex]?.items || []
      : entry?.visualGallery || [];
    const items = sourceItems.filter((item) => {
      return item && (
        item.src ||
        item.url ||
        (Array.isArray(item.links) && item.links.length) ||
        item.note
      );
    });
    if (!items.length) {
      return;
    }

    state.ui.rawMediaLightbox = {
      items,
      index: Math.max(0, Math.min(items.length - 1, Number(trigger.dataset.rawMediaItemIndex) || 0)),
      anchor
    };
    syncPopupScrollLock();
    renderExperience();
    return;
  }

  if (kind === "entry-channel") {
    const entry = payload.entries[Number(trigger.dataset.rawMediaEntryIndex)];
    const items = getAlpacaChannelVideosForEntry(entry).map((video) => ({
      title: video.title || "Alpaca Channel video",
      url: video.url,
      previewLabel: "Play video",
      note: video.description || video.channel || "",
      links: [
        {
          label: "Open video",
          url: video.url
        }
      ]
    }));

    if (!items.length) {
      return;
    }

    state.ui.rawMediaLightbox = {
      items,
      index: Math.max(0, Math.min(items.length - 1, Number(trigger.dataset.rawMediaItemIndex) || 0)),
      anchor
    };
    syncPopupScrollLock();
    renderExperience();
    return;
  }

  if (kind === "question") {
    const entry = payload.entries[Number(trigger.dataset.rawMediaEntryIndex)];
    const question = entry?.quizQuestions?.[Number(trigger.dataset.rawMediaQuestionIndex)];
    if (!question?.media?.src) {
      return;
    }

    state.ui.rawMediaLightbox = {
      items: [
        {
          src: question.media.src,
          title: question.media.alt || question.prompt || "Question visual"
        }
      ],
      index: 0,
      anchor
    };
    syncPopupScrollLock();
    renderExperience();
  }
}

function getRawMediaLightboxAnchor(trigger) {
  if (!trigger || !trigger.getBoundingClientRect) {
    return null;
  }

  const rect = trigger.getBoundingClientRect();
  const shell = trigger.closest(".raw-content-shell") || refs.experiencePanel || document.body;
  const shellRect = shell.getBoundingClientRect();
  const viewportWidth = window.innerWidth || document.documentElement.clientWidth || 1280;
  const viewportHeight = window.innerHeight || document.documentElement.clientHeight || 800;
  const shellHeight = shell.scrollHeight || shellRect.height || viewportHeight;
  const estimatedWidth = Math.min(860, Math.max(320, Math.min(viewportWidth, shellRect.width || viewportWidth) - 32));
  const estimatedHeight = Math.min(720, Math.max(320, viewportHeight - 32));
  const centerX = rect.left - shellRect.left + rect.width / 2;
  const centerY = rect.top - shellRect.top + rect.height / 2;
  const minLeft = Math.max(16, -shellRect.left + 16);
  const maxLeft = Math.max(minLeft, -shellRect.left + viewportWidth - estimatedWidth - 16);
  const minTop = Math.max(16, -shellRect.top + 16);
  const maxTop = Math.max(
    minTop,
    Math.min(
      shellHeight - estimatedHeight - 16,
      -shellRect.top + viewportHeight - estimatedHeight - 16
    )
  );
  const left = Math.min(
    Math.max(minLeft, centerX - estimatedWidth / 2),
    maxLeft
  );
  const top = Math.min(
    Math.max(minTop, centerY - estimatedHeight / 2),
    maxTop
  );

  return {
    left: Math.round(left),
    top: Math.round(top)
  };
}

function closeRawMediaLightbox() {
  state.ui.rawMediaLightbox = null;
  state.ui.rawMediaSwipeStartX = null;
  syncPopupScrollLock();
  renderExperience();
}

function shiftRawMediaLightbox(direction) {
  const lightbox = state.ui.rawMediaLightbox;
  if (!lightbox || !lightbox.items?.length) {
    return;
  }

  const total = lightbox.items.length;
  lightbox.index = (lightbox.index + direction + total) % total;
  renderExperience();
}

function renderRawMediaLightbox() {
  if (rawContentMediaLightbox?.renderLightbox) {
    return rawContentMediaLightbox.renderLightbox(state.ui.rawMediaLightbox, {
      escapeHtml,
      getEmbeddableVideo,
      getVideoPreview,
      isDesktopApp: window.WSC_DESKTOP_APP === true
    });
  }

  const lightbox = state.ui.rawMediaLightbox;
  if (!lightbox || !lightbox.items?.length) {
    return "";
  }

  const current = lightbox.items[lightbox.index];
  const multi = lightbox.items.length > 1;
  const hasImage = Boolean(current.src);
  const hasLink = getRawMediaLinkItems(current).length > 0;
  const embeddedVideo = !hasImage ? getEmbeddableVideo(current.url) : null;
  const videoPreview = !hasImage ? getVideoPreview(current.url) : null;
  const canEmbedVideo = Boolean(embeddedVideo) && !window.WSC_DESKTOP_APP;
  const hasVideoPreview = Boolean(videoPreview);
  const anchor = lightbox.anchor || null;
  const anchorStyle = anchor
    ? ` style="--raw-media-anchor-left: ${Math.max(0, Math.round(Number(anchor.left) || 0))}px; --raw-media-anchor-top: ${Math.max(0, Math.round(Number(anchor.top) || 0))}px;"`
    : "";
  const anchorClass = anchor ? " raw-media-lightbox-overlay--anchored" : "";

  return `
    <div class="raw-media-lightbox-overlay${anchorClass}" data-close-raw-media role="dialog" aria-modal="true" aria-label="Raw content media viewer"${anchorStyle}>
      <div class="raw-media-lightbox-window" data-raw-media-window>
        <button class="popup-close-button" type="button" data-close-raw-media aria-label="Close media viewer">
          <span aria-hidden="true">×</span>
        </button>
        <div class="raw-media-lightbox-stack">
          <div class="raw-media-lightbox-top">
            <p class="challenge-label">Raw Content visual</p>
            <h3>${escapeHtml(current.title || "Visual")}</h3>
          </div>
          <div class="raw-media-lightbox-frame">
            ${multi ? `<button class="raw-media-lightbox-nav prev" type="button" data-raw-media-nav="prev" aria-label="Previous visual">‹</button>` : ""}
            <div class="raw-media-lightbox-asset ${hasImage ? "" : canEmbedVideo ? "video-slide" : hasVideoPreview ? "video-preview-slide" : "link-slide"}">
              ${hasImage ? `
                <img class="raw-media-lightbox-image${current.preserveOriginalColor ? " original-color" : ""}" src="${escapeHtml(current.src)}" alt="${escapeHtml(current.title || "Raw content visual")}" />
              ` : canEmbedVideo ? `
                <div class="raw-media-lightbox-video-wrap">
                  <iframe
                    class="raw-media-lightbox-iframe"
                    src="${escapeHtml(embeddedVideo.embedUrl)}"
                    title="${escapeHtml(current.title || "Embedded video")}"
                    loading="lazy"
                    referrerpolicy="strict-origin-when-cross-origin"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowfullscreen
                  ></iframe>
                </div>
              ` : hasVideoPreview ? `
                <div class="raw-media-lightbox-video-preview">
                  <img class="raw-media-lightbox-video-thumb" src="${escapeHtml(videoPreview.thumbnailUrl)}" alt="${escapeHtml(current.title || "Video preview")}" loading="lazy" referrerpolicy="no-referrer" />
                  <div class="raw-media-lightbox-video-copy">
                    <span class="challenge-label">Video preview</span>
                    <p class="raw-media-lightbox-note">YouTube blocks direct playback inside the local Mac app, so this slide opens the original video reliably in your browser.</p>
                    ${renderRawMediaLinkButtons(current)}
                  </div>
                </div>
              ` : `
                <div class="raw-media-lightbox-link-slide">
                  <span class="challenge-label">Reference slide</span>
                  <h4>${escapeHtml(current.title || "Reference")}</h4>
                  ${current.note ? `<p class="raw-media-lightbox-note">${escapeHtml(current.note)}</p>` : ""}
                  ${renderRawMediaLinkButtons(current)}
                </div>
              `}
            </div>
            ${multi ? `<button class="raw-media-lightbox-nav next" type="button" data-raw-media-nav="next" aria-label="Next visual">›</button>` : ""}
          </div>
          ${((hasImage || canEmbedVideo) && (current.note || hasLink)) ? `
            <div class="raw-media-lightbox-meta">
              ${current.note ? `<p class="raw-media-lightbox-note">${escapeHtml(current.note)}</p>` : ""}
              ${renderRawMediaLinkButtons(current)}
            </div>
          ` : ""}
          ${multi ? `
            <div class="raw-media-lightbox-footer">
              <span>${lightbox.index + 1} / ${lightbox.items.length}</span>
              <span>Swipe or use the arrows to move through the set.</span>
            </div>
          ` : ""}
        </div>
      </div>
    </div>
  `;
}

function getRawQuizQuestionKey(question) {
  if (rawContentQuizRenderer?.getQuestionKey) {
    return rawContentQuizRenderer.getQuestionKey(question);
  }

  return `${question.level}|${question.prompt}|${question.correctAnswer}`;
}

function selectRawQuizOption(quizKey, optionIndex) {
  if (!quizKey || !Number.isFinite(optionIndex)) {
    return;
  }

  state.ui.rawQuizSelections = {
    ...state.ui.rawQuizSelections,
    [quizKey]: optionIndex
  };

  renderExperience();
}

function rememberRawQuestionGallerySlide(target) {
  const gallery = target?.closest?.("[data-raw-question-gallery]");
  const slide = target?.closest?.("[data-raw-question-gallery-slide]");
  if (!gallery || !slide) {
    return;
  }

  setRawQuizPageIndex(
    gallery.dataset.rawQuestionPager,
    Number(slide.dataset.rawQuestionIndex),
    Number(gallery.dataset.rawQuestionTotal),
    false
  );
}

function setRawQuizPageIndex(pagerKey, index, total, sync = true) {
  if (!pagerKey || !Number.isFinite(index) || !Number.isFinite(total) || total < 1) {
    return null;
  }

  const nextIndex = Math.max(0, Math.min(total - 1, Math.round(index)));
  state.ui.rawQuizPages = {
    ...state.ui.rawQuizPages,
    [pagerKey]: nextIndex
  };

  if (sync) {
    const gallery = getRawQuestionGalleryByPagerKey(pagerKey);
    if (gallery) {
      syncRawQuestionGallery(gallery, { behavior: "smooth" });
    }
  }

  return nextIndex;
}

function shiftRawQuizPage(pagerKey, direction, total) {
  if (!pagerKey || !Number.isFinite(direction) || !Number.isFinite(total) || total < 1) {
    return;
  }

  const currentIndex = getRawQuizPageIndex(pagerKey, total);
  const nextIndex = setRawQuizPageIndex(pagerKey, currentIndex + direction, total, true);
  if (nextIndex === null || !getRawQuestionGalleryByPagerKey(pagerKey)) {
    renderExperience();
  }
}

function getRawQuestionGalleryByPagerKey(pagerKey) {
  if (!refs.experiencePanel || !pagerKey) {
    return null;
  }

  return [...refs.experiencePanel.querySelectorAll("[data-raw-question-gallery]")]
    .find((gallery) => gallery.dataset.rawQuestionPager === pagerKey) || null;
}

function syncRawQuestionGalleries(options = {}) {
  if (!refs.experiencePanel) {
    return;
  }

  refs.experiencePanel.querySelectorAll("[data-raw-question-gallery]").forEach((gallery) => {
    syncRawQuestionGallery(gallery, options);
  });
}

function syncRawQuestionGallery(gallery, options = {}) {
  if (!gallery) {
    return false;
  }

  const pagerKey = gallery.dataset.rawQuestionPager || "";
  const total = Number(gallery.dataset.rawQuestionTotal);
  const viewport = gallery.querySelector("[data-raw-question-gallery-viewport]");
  const slides = [...gallery.querySelectorAll("[data-raw-question-gallery-slide]")];
  if (!pagerKey || !viewport || !slides.length || !Number.isFinite(total)) {
    return false;
  }

  const currentIndex = getRawQuizPageIndex(pagerKey, Math.max(total, slides.length));
  const safeIndex = Math.max(0, Math.min(slides.length - 1, currentIndex));
  const targetSlide = slides[safeIndex];

  slides.forEach((slide, index) => {
    slide.classList.toggle("active", index === safeIndex);
    slide.setAttribute("aria-hidden", index === safeIndex ? "false" : "true");
  });

  const currentLabel = gallery.closest(".raw-quiz-pager, .regular-guide-question-block")
    ?.querySelector("[data-raw-question-current]");
  if (currentLabel) {
    currentLabel.textContent = `Question ${safeIndex + 1} / ${slides.length}`;
  }

  gallery.querySelectorAll("[data-raw-quiz-page]").forEach((button) => {
    const direction = Number(button.dataset.rawQuizDirection);
    button.disabled = direction < 0 ? safeIndex === 0 : safeIndex === slides.length - 1;
  });

  window.requestAnimationFrame(() => {
    const targetLeft = targetSlide.offsetLeft - Math.max(0, (viewport.clientWidth - targetSlide.offsetWidth) / 2);
    viewport.scrollTo({
      left: Math.max(0, targetLeft),
      behavior: options.behavior || "auto"
    });
  });

  return true;
}

function renderRawQuizOptionStateClass(option, index, selectedIndex) {
  if (rawContentQuizRenderer?.getOptionStateClass) {
    return rawContentQuizRenderer.getOptionStateClass(option, index, selectedIndex);
  }

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
  if (rawContentQuizRenderer?.stableShuffleByKey) {
    return rawContentQuizRenderer.stableShuffleByKey(items, key);
  }

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

function shuffle(items) {
  for (let index = items.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [items[index], items[swapIndex]] = [items[swapIndex], items[index]];
  }
  return items;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

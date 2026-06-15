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
const createContentNormalizationHelpers = window.WSC_CREATE_CONTENT_NORMALIZATION_HELPERS;
const routeBuilderController = window.WSC_ROUTE_BUILDER_CONTROLLER;
const createRouteBuilderViewController = window.WSC_CREATE_ROUTE_BUILDER_VIEW_CONTROLLER;
const createRouteOrchestrationController = window.WSC_CREATE_ROUTE_ORCHESTRATION_CONTROLLER;
const createAppShellRenderer = window.WSC_CREATE_APP_SHELL_RENDERER;
const createAppShellController = window.WSC_CREATE_APP_SHELL_CONTROLLER;
const createAuthController = window.WSC_CREATE_AUTH_CONTROLLER;
const createProgressStorageController = window.WSC_CREATE_PROGRESS_STORAGE_CONTROLLER;
const createGameLaunchController = window.WSC_CREATE_GAME_LAUNCH_CONTROLLER;
const createModeRuntimeController = window.WSC_CREATE_MODE_RUNTIME_CONTROLLER;
const createLegacyLiveRoomController = window.WSC_CREATE_LEGACY_LIVE_ROOM_CONTROLLER;
const createLegacyLiveRoomRenderer = window.WSC_CREATE_LEGACY_LIVE_ROOM_RENDERER;
const createRawContentController = window.WSC_CREATE_RAW_CONTENT_CONTROLLER;
const createStudyGameController = window.WSC_CREATE_STUDY_GAME_CONTROLLER;
const createArcadeGameController = window.WSC_CREATE_ARCADE_GAME_CONTROLLER;
const createArcadeRenderController = window.WSC_CREATE_ARCADE_RENDER_CONTROLLER;
const createArcadeRuntimeTimerController = window.WSC_CREATE_ARCADE_RUNTIME_TIMER_CONTROLLER;
const createArcadeJumpAnimationController = window.WSC_CREATE_ARCADE_JUMP_ANIMATION_CONTROLLER;
const createResultsRenderer = window.WSC_CREATE_RESULTS_RENDERER;
const createAlpacapardyBoardController = window.WSC_CREATE_ALPACAPARDY_BOARD_CONTROLLER;
const createAlpacapardyController = window.WSC_CREATE_ALPACAPARDY_CONTROLLER;
const createAlpacardsController = window.WSC_CREATE_ALPACARDS_CONTROLLER;
const createAlpacaChannelController = window.WSC_CREATE_ALPACA_CHANNEL_CONTROLLER;
const createBuildCaseController = window.WSC_CREATE_BUILD_CASE_CONTROLLER;
const createMindMapOrbitController = window.WSC_CREATE_MIND_MAP_ORBIT_CONTROLLER;
const createAppEventRouter = window.WSC_CREATE_APP_EVENT_ROUTER;
const createAlpaquizRenderController = window.WSC_CREATE_ALPAQUIZ_RENDER_CONTROLLER;
const arcadeJumpHelpers = window.WSC_ARCADE_JUMP_HELPERS;
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
let relayBuzzAudio = null;
let relayBuzzAudioSrc = null;

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
const alpaquizRelayRenderer = window.WSC_ALPAQUIZ_RELAY_RENDERER || null;
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

const rawContentOverrides = window.WSC_RAW_CONTENT_OVERRIDES || {};

const contentNormalizationHelpers = createContentNormalizationHelpers({
  constants: {
    rawSectionOverrides: rawContentOverrides.sectionOverrides || {},
    rawEntryOverrides: rawContentOverrides.entryOverrides || {}
  },
  callbacks: {
    compareOfficialSectionOrder,
    normalizeKnowledgeKey,
    normalizeSectionId
  }
});

const rawContentSections = contentNormalizationHelpers.normalizeRawContentSections(window.WSC_RAW_CONTENT_BANK?.sections || {});
const fullVoyageQuestions = contentNormalizationHelpers.normalizeFullVoyageQuestions(window.WSC_RAW_CONTENT_BANK?.fullVoyageQuestions || []);

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
let arcadeJumpAnimationController = null;
let mindMapOrbitController = null;
let resultsRenderer = null;
let alpacapardyBoardController = null;
let alpacapardyController = null;

mindMapOrbitController = createMindMapOrbitController({
  appState: state,
  refs,
  windowRef: window,
  documentRef: document
});

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

const alpacardsController = createAlpacardsController({
  appState: state,
  refs,
  data: {
    getCards: () => window.WSC_ALPACARDS
  },
  renderers: {
    alpacardsMode
  },
  helpers: {
    escapeHtml,
    getSelectedSectionIds,
    getSelectionQuestions,
    getTargetLabel,
    normalizeSectionId,
    renderLearnCardFooterNav,
    renderPanelTitle,
    shuffle
  },
  callbacks: {
    renderExperience
  }
});

const alpacaChannelController = createAlpacaChannelController({
  appState: state,
  data: {
    alpacaChannelCatalog,
    sectionById,
    subjectById,
    bigIdeaRouteById,
    learnSubjectRouteById
  },
  services: {
    videoService: appVideoService
  },
  renderers: {
    alpacaChannelMode
  },
  helpers: {
    escapeHtml,
    getApprovedRawContentSection,
    getModeAssetPath,
    getRawEntriesForSelection,
    getSectionIdFromGuidingTitle,
    getSelectedSectionIds,
    getSelectedSectionLabels,
    getTargetLabel,
    mapRawEntriesWithSection,
    normalizeKnowledgeKey,
    normalizeSectionId,
    renderConfiguredMascotAsset,
    renderLearnCardFooterNav,
    renderPanelTitle
  },
  callbacks: {
    renderExperience
  }
});

const buildCaseController = createBuildCaseController({
  appState: state,
  windowRef: window,
  data: {
    debateLabData,
    sectionById
  },
  constants: {
    buildCaseRoundCount: GAME_CONFIG.buildCaseRoundCount
  },
  helpers: {
    buildChoiceSet,
    buildSingleChoiceSet,
    escapeHtml,
    getAssetValue,
    getBestStreakFromAnswers,
    getBigIdeaIdsFromLabels,
    getBroadSubjectIdsFromLabels,
    getOrderedSectionIds,
    getRawEntriesForSelection,
    getSectionIdFromGuidingTitle,
    getSelectedSectionIds,
    getTargetLabel,
    renderAssetImage,
    renderGameQuestionPopup,
    renderPanelTitle,
    shortenTrainText,
    shuffle,
    slugifyBigIdea,
    splitArgumentFragments
  },
  callbacks: {
    finalizeSessionStats,
    renderExperience,
    renderExperiencePreservingScroll
  }
});

const arcadeRenderController = createArcadeRenderController({
  appState: state,
  constants: {
    GAME_CONFIG
  },
  helpers: {
    createJumpObstacle,
    escapeHtml,
    getAssetValue,
    getGamePromptLabel,
    getGameplayAssetPath,
    getGameplayReviewBadge,
    getLensCardPluralLabel,
    getRaceActiveLevelState,
    getSetupTargetHeading,
    getSetupTargetHelper,
    getTargetLabel,
    getTargetSetupOptions,
    getUnavailableRawGameReason,
    renderAlternateLensBreakdown,
    renderAssetImage,
    renderCheckpointVisual,
    renderConfiguredMascotAsset,
    renderGameNotes,
    renderGameQuestionPopup,
    renderMascot,
    renderOptionToken,
    renderPanelTitle,
    renderRaceFailVisual,
    renderRaceLivesIcon,
    renderResultsScreen
  }
});

alpacapardyBoardController = createAlpacapardyBoardController({
  appState: state,
  data,
  sectionById,
  subjectById,
  bigIdeaRoutes: BIG_IDEA_ROUTES,
  constants: {
    GAME_CONFIG
  },
  engines: {
    alpacapardyEngine
  },
  renderers: {
    alpacapardyRenderer
  },
  callbacks: {
    escapeHtml,
    getActiveSubjectCatalog,
    getAlpacapardyLiveRenderContext,
    getAssetValue,
    getGamePromptLabel,
    getGameplayAssetPath,
    getGameplayReviewBadge,
    getLensCardPluralLabel,
    getQuestionsForRouteSelection,
    getResultAssetPath,
    getSectionCounts,
    getSelectedSectionIds,
    getSelectionQuestions,
    getSubjectCounts,
    getTargetLabel,
    getTargetLabelForLens,
    getThemedTeamLabel,
    getTimerVisualState,
    renderAssetImage,
    renderBreakdowns,
    renderCheckpointVisual,
    renderConfiguredMascotAsset,
    renderExperienceCloseButton,
    renderGameNotes,
    renderGameQuestionPopup,
    renderJeopardyDecoration,
    renderMetricCard,
    renderOptionToken,
    renderPanelTitle,
    renderPopupQuestionTimerPanel,
    shuffle
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

const rawContentController = createRawContentController({
  appState: state,
  refs,
  documentRef: document,
  windowRef: window,
  services: {
    rawContentService,
    appVideoService
  },
  renderers: {
    rawContentMode,
    rawContentEntryRenderer,
    rawContentQuizRenderer,
    rawContentMediaLightbox,
    rawContentVisualAssets,
    rawContentTransferTable,
    rawContentMastery
  },
  data: {
    IMPORTED_RAW_CONTENT_BANK,
    sectionById,
    subjectById,
    bigIdeaRouteById,
    learnSubjectRouteById,
    BIG_IDEA_ROUTES,
    LEARN_SUBJECT_ROUTES
  },
  helpers: {
    escapeHtml,
    compareOfficialSectionOrder,
    compareRawEntriesByOfficialOrder,
    entryMatchesLearnSubjectRoute,
    getAlpacaChannelVideosForEntry,
    getAssetValue,
    getEmbeddableVideo,
    getModeAssetPath,
    getSectionIdFromGuidingTitle,
    getSelectedSectionIds,
    getTargetLabel,
    getTargetLabelForLens,
    getVideoPreview,
    normalizeKnowledgeKey,
    renderAlpacaList,
    renderLearnCardFooterNav,
    renderOptionToken,
    renderPanelTitle,
    usesGranularLearnSubjects
  },
  callbacks: {
    renderExperience,
    renderStats,
    saveRawMastery,
    syncPopupScrollLock
  }
});

const studyGameController = createStudyGameController({
  appState: state,
  appData: {
    data
  },
  alpaquizEngine,
  constants: {
    GAME_CONFIG,
    WRITING_PHASES
  },
  callbacks: {
    buildBowlExperience,
    buildQuizExperience,
    buildQuizQuestionPlan,
    finalizeSessionStats,
    getBestStreakFromAnswers,
    getCurrentBowlQuestion,
    getUnavailableRawGameReason,
    normalizeQuizDifficultySelection,
    renderExperience,
    renderExperiencePreservingScroll
  }
});

const arcadeGameController = createArcadeGameController({
  appState: state,
  windowRef: window,
  constants: {
    GAME_CONFIG
  },
  callbacks: {
    buildAlpacaRunQuestionPlan,
    buildJumpQuestionPlan,
    buildRaceLevelQueues,
    buildRelayQuestionSequence,
    clearRaceTimer,
    clearRelayAnswerTimer,
    createJumpObstacle,
    createRelayTeams,
    finalizeSessionStats,
    getBestStreakFromAnswers,
    getCurrentRaceQuestion,
    getHighestTeamScore,
    getRaceActiveLevelState,
    getRawEntriesForRunSetupCategoryIds,
    getRunReachedStage,
    getThemedTeamLabel,
    getUnavailableRawGameReason,
    playRelayBuzzSound,
    queueNextJumpObstacle,
    queueNextRaceQuestion,
    render,
    renderExperience,
    syncRelayTeamBindings,
    updateJumpDom
  }
});

const arcadeRuntimeTimerController = createArcadeRuntimeTimerController({
  appState: state,
  windowRef: window,
  callbacks: {
    finalizeSessionStats,
    getRunReachedStage,
    handleRelayTimeout,
    refreshRunTimerDisplay,
    render,
    renderExperiencePreservingScroll,
    resolveRaceQuestion
  }
});

arcadeJumpAnimationController = createArcadeJumpAnimationController({
  windowRef: window,
  constants: {
    GAME_CONFIG
  },
  callbacks: {
    getExperience: () => state.experience,
    getJumpObstacleSpeed,
    handleJumpObstacleHit,
    hasJumpCollision,
    openJumpCheckpoint,
    queueNextJumpObstacle,
    renderExperience,
    updateJumpDom
  }
});

const alpaquizRenderController = createAlpaquizRenderController({
  appState: state,
  renderers: {
    quizRenderer: alpaquizRenderer,
    relayRenderer: alpaquizRelayRenderer
  },
  callbacks: {
    getQuizRenderHelpers: getAlpaquizRenderHelpers,
    getRelayRenderHelpers,
    renderTrainTipPopup
  }
});

const legacyLiveRoomController = createLegacyLiveRoomController({
  appState: state,
  appStateService,
  authController,
  alpacaChannelCatalog,
  alpacapardyLive,
  alpacapardyLiveSupabaseService,
  alpacapardyEngine,
  windowRef: window,
  constants: {
    LEGACY_LIVE_ROOMS_PUBLIC_ENABLED,
    MULTIPLAYER_ALLOWED_EMAILS,
    MULTIPLAYER_ALLOWED_EMAIL_DOMAINS,
    LIVE_GAME_TYPES,
    LIVE_ALPACA_COLORS,
    LIVE_SYNC_INTERVAL_MS,
    GAME_CONFIG
  },
  callbacks: {
    buildConfiguredJeopardyBoard,
    buildJeopardyExperience,
    buildPatternQuestionSequence,
    buildRawQuestionPoolsFromEntries,
    createStandaloneAlpacaChannelVideo,
    finalizeSessionStats,
    getBestStreakFromAnswers,
    getEmbeddableVideo,
    getHighestTeamScore,
    getRawEntriesForRouteSelection,
    loadGuestAlpacaName,
    render,
    renderLiveSurfaces,
    shuffle,
    startJeopardyTimer
  }
});

alpacapardyController = createAlpacapardyController({
  appState: state,
  windowRef: window,
  alpacapardyLive,
  constants: {
    GAME_CONFIG
  },
  callbacks: {
    allJeopardyTilesDone,
    buildConfiguredJeopardyBoard,
    canAnswerAlpacapardyLiveFocus,
    canCloseAlpacapardyLiveFocus,
    canOpenAlpacapardyLiveTile,
    clearJumpAnimation,
    clearRaceTimer,
    clearRelayAnswerTimer,
    clearRunTimer,
    createJeopardyTeams,
    emitAlpacapardyLiveEvent,
    finalizeSessionStats,
    getAlpacapardyLiveIdentityContext,
    getBestStreakFromAnswers,
    getHighestTeamScore,
    getThemedTeamLabel,
    isAlpacapardyLiveActive,
    render,
    renderExperience,
    renderExperiencePreservingScroll,
    renderLiveSurfaces,
    syncAlpacapardyLiveSettings
  }
});

const modeRuntimeController = createModeRuntimeController({
  appState: state,
  refs,
  domService: appDomService,
  renderers: {
    slideshow: renderSlideshowExperience,
    mindmap: renderMindMapExperience,
    rawcontent: renderRawContentExperience,
    regularguide: renderRegularGuideExperience,
    channel: renderAlpacaChannelExperience,
    alpacard: renderAlpacardExperience,
    writing: renderWritingExperience,
    quiz: renderQuizExperience,
    bowl: renderBowlExperience,
    race: renderRaceExperience,
    jump: renderJumpExperience,
    jeopardy: renderJeopardyExperience,
    run: renderRunExperience,
    relay: renderRelayExperience,
    buildcase: renderBuildCaseExperience,
    unavailable: renderUnavailableModeExperience
  },
  callbacks: {
    stopMindMapOrbitAnimation,
    syncExperienceTimers,
    syncPopupScrollLock,
    syncRadialMindMapScroll,
    syncMindMapOrbitAnimation,
    syncRawQuestionGalleries,
    syncActiveModalFocus
  }
});

const legacyLiveRoomRenderer = createLegacyLiveRoomRenderer({
  appState: state,
  appDomService,
  onlineModeController,
  documentRef: document,
  windowRef: window,
  constants: {
    LIVE_GAME_TYPES,
    LIVE_GAME_ORDER,
    LIVE_ALPACA_COLORS,
    GAME_CONFIG,
    ALPACA_RUN_ROUTE
  },
  helpers: {
    escapeHtml,
    canAccessLegacyLiveRooms,
    getLegacyLiveRoomsDisabledMessage,
    getAlpacapardyLiveIdentityContext,
    getAlpacapardyLiveRenderContext,
    normalizeLiveGameType,
    getCurrentLiveGameType,
    getLiveGameLabel,
    getLivePlayablePlayers,
    getAssetValue,
    getWizardCardAsset,
    renderConfiguredMascotAsset,
    renderJeopardyExperience,
    renderJeopardySetup,
    canStartSelectedLiveGame,
    getLiveWaitingVideos,
    getLiveWaitingVideoIndex,
    getEmbeddableVideo,
    getVideoPreview,
    getAlpacaChannelDomain,
    normalizeVideoUrl,
    getModeAssetPath,
    getArcadeState,
    getLiveRunSetupColorId,
    renderRunMapBackground,
    renderRunMapStop,
    getRunMapTop,
    renderOptionToken,
    getArcadeLeaderboard,
    renderRaceLivesIcon
  },
  callbacks: {
    syncActiveModalFocus
  }
});

const routeBuilderViewController = createRouteBuilderViewController({
  appState: state,
  refs,
  appDomService,
  wizardRenderer,
  documentRef: document,
  windowRef: window,
  constants: {
    WIZARD_TOTAL_STEPS,
    DEFAULT_LENS_ID,
    PATH_OPTIONS,
    LENS_OPTIONS
  },
  helpers: {
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
  },
  callbacks: {
    renderAlpacaOnlineHub
  }
});


const routeOrchestrationController = createRouteOrchestrationController({
  appState: state,
  refs,
  routeBuilderController,
  routeBuilderViewController,
  gameLaunchController,
  documentRef: document,
  windowRef: window,
  constants: {
    DEFAULT_LENS_ID
  },
  helpers: {
    getSelectedSectionIds,
    getOrderedSectionIds,
    getModePath,
    isModeUnavailable,
    getAlpacaChannelVideosForSection,
    hasRegularGuideForSection: (sectionId) => Boolean(IMPORTED_RAW_CONTENT_BANK[sectionId]?.regularGuide),
    normalizeSectionId
  },
  callbacks: {
    clearJeopardyTimer,
    clearDebateSpinTimer,
    closeHeroMenu,
    render,
    renderCurrentExperience: () => modeRuntimeController.renderCurrentExperience(),
    isAlpacapardyLiveActive,
    leaveAlpacapardyLiveRoom
  }
});

const appEventRouter = createAppEventRouter({
  appState: state,
  refs,
  alpacapardyLiveSupabaseService,
  windowRef: window,
  documentRef: document,
  actions: {
    closeHeroMenu,
    syncAuthChrome,
    syncPopupScrollLock,
    renderAuthModal,
    clearAuthNotice,
    signOutOfAlpaccount,
    openAlpacaOnlineCampus,
    chooseAppEntryMode,
    renderCooperationModal,
    switchToLocalMode,
    refreshAlpacapardyLiveLobby,
    returnToAlpacaOnlineHub,
    chooseOnlineGameType,
    createSelectedLiveGameRoom,
    selectLiveRunSetupColor,
    startSelectedLiveGame,
    selectLiveAlpacaColor,
    answerSelectedLiveGame,
    advanceSelectedLiveGame,
    buzzSelectedLiveGame,
    navigateLiveWaitingVideo,
    renderResourcesModal,
    toggleHeroMenu,
    canDismissAuthModal,
    choosePath,
    chooseLens,
    chooseTarget,
    toggleModeChoiceSection,
    toggleModeChoiceMenu,
    continueTargetSelection,
    chooseMode,
    closeTrainTip,
    clearFrom,
    goToWizardStep,
    openRawConnection,
    openGuideSection,
    openSectionChannel,
    rememberRawQuestionGallerySlide,
    selectRawQuizOption,
    shiftRawQuizPage,
    toggleRawMastery,
    selectRawAssetPoint,
    openRawMediaLightboxFromTrigger,
    shiftRawMediaLightbox,
    closeRawMediaLightbox,
    openMindMapEntry,
    navigateMindMapGallery,
    openMindMapGuide,
    closeMindMapEntry,
    closeMindMapGuide,
    launchExperience,
    navigateSlide,
    navigateAlpacaChannel,
    navigateAlpacard,
    setAlpacardIndex,
    flipAlpacard,
    shuffleAlpacard,
    toggleQuizSection,
    selectAllQuizSections,
    setQuizQuestionCount,
    toggleQuizDifficulty,
    startQuizRoute,
    answerQuizQuestion,
    submitQuizRoute,
    resetQuizRoute,
    nextWritingPrompt,
    setWritingPhase,
    startBowlPractice,
    answerBowlQuestion,
    advanceBowlQuestion,
    resetBowlPractice,
    answerRaceQuestion,
    startRaceRoute,
    toggleRaceSetupCategory,
    advanceRace,
    startJumpRoute,
    toggleJumpSetupCategory,
    performJumpAction,
    answerJumpQuestion,
    continueJumpRoute,
    startBuildCaseRoute,
    showNextDebateTopic,
    startDebateConversation,
    toggleDebateSideSpin,
    returnToDebateTopic,
    resetDebateSpinForCurrentTopic,
    renderExperience,
    toggleDebateSuggestion,
    submitDebateRound,
    advanceDebateRound,
    chooseBuildCaseCamp,
    toggleBuildCaseSupport,
    confirmBuildCaseSupports,
    chooseBuildCaseRebuttal,
    advanceBuildCaseRound,
    setJeopardyPlayMode,
    createAlpacapardyLiveRoom,
    joinAlpacapardyLiveRoom,
    leaveAlpacapardyLiveRoom,
    startAlpacapardyLiveGame,
    openJeopardyTile,
    answerJeopardyQuestion,
    setJeopardyTeamCount,
    toggleJeopardySetupCategory,
    startJeopardyGame,
    closeJeopardyFocus,
    chooseJeopardyTeam,
    addJeopardyTeam,
    removeJeopardyTeam,
    advanceJeopardyTeam,
    answerRelayQuestion,
    startRelayRoute,
    toggleRelaySetupCategory,
    setRelayTeamCount,
    setRelayQuestionCount,
    advanceRelayQuestion,
    addRelayTeam,
    removeRelayTeam,
    buzzRelayTeam,
    answerRunQuestion,
    toggleRunSetupCategory,
    startRunRoute,
    continueRun,
    resetCurrentRouteAttempts,
    changeGuidingSections,
    changeModeSelection,
    closeCurrentExperience,
    joinAlpacapardyLiveRoomByCode,
    sendAlpacapardyLiveChat,
    submitAuthForm,
    getActiveMindMapEntryBundle
  }
});

const RESOURCE_LINKS = window.WSC_APP_SHELL_RESOURCE_LINKS || [];

const appShellRenderer = createAppShellRenderer({
  appState: state,
  refs,
  appDomService,
  appStateService,
  appEntryService,
  onlineModeController,
  authModalRenderer,
  constants: {
    ASSET_CACHE_VERSION,
    DISCORD_INVITE_URL,
    CONTACT_EMAIL_URL,
    WSC_ROUND_OPTIONS,
    LIVE_GAME_ORDER,
    ALPACA_RUN_ROUTE,
    RESOURCE_LINKS,
    insights: data.insights
  },
  helpers: {
    escapeHtml,
    getPathOption,
    getModePath,
    getModeAssetPath,
    getModeOption,
    getWizardCardAsset,
    normalizeLiveGameType,
    renderConfiguredMascotAsset
  },
  callbacks: {
    syncActiveModalFocus,
    isSignedIn,
    canDismissAuthModal,
    canAccessCampusPreview,
    getCurrentUserEmail,
    getTotalRawMasterableEntries,
    getMasteredRawEntryCount,
    getDefaultStats,
    getLiveGameLabel,
    getSelectedSectionIds,
    getSelectedSectionLabels,
    getTargetLabel
  }
});

resultsRenderer = createResultsRenderer({
  appState: state,
  data,
  bigIdeaRoutes: BIG_IDEA_ROUTES,
  helpers: {
    escapeHtml,
    getAccuracy,
    getMindMapLensLabel,
    getPerformanceMood,
    getPerformanceRating,
    getResultAssetPath,
    getTargetLabel,
    renderConfiguredMascotAsset,
    renderExperienceCloseButton,
    renderPanelTitle
  }
});

const appShellController = createAppShellController({
  appState: state,
  refs,
  appStateService,
  appShellRenderer,
  onlineModeController,
  modalFocusService,
  documentRef: document,
  constants: {
    DEFAULT_LENS_ID
  },
  callbacks: {
    renderSummary,
    renderWizard,
    renderLiveOverlayMount,
    renderExperience,
    resetAlpacapardyLiveState,
    canAccessLegacyLiveRooms,
    getLegacyLiveRoomsDisabledMessage,
    buildJeopardyExperience,
    refreshAlpacapardyLiveLobby
  }
});

init();

function clearRunTimer() {
  return arcadeRuntimeTimerController.clearRunTimer();
}

function clearRaceTimer() {
  return arcadeRuntimeTimerController.clearRaceTimer();
}

function clearRelayAnswerTimer() {
  return arcadeRuntimeTimerController.clearRelayAnswerTimer();
}

function clearJumpAnimation() {
  return arcadeJumpAnimationController.clearJumpAnimation();
}

function clearJeopardyTimer() {
  return alpacapardyController.clearJeopardyTimer();
}

function clearDebateSpinTimer() {
  return buildCaseController.clearSpinTimer();
}

function clearDebateRevealTimer() {
  return buildCaseController.clearRevealTimer();
}

function clearAlpacapardyLiveHeartbeat(...args) {
  return legacyLiveRoomController.clearAlpacapardyLiveHeartbeat(...args);
}

function clearAlpacapardyLiveSync(...args) {
  return legacyLiveRoomController.clearAlpacapardyLiveSync(...args);
}

function clearLiveLaunchCountdown(...args) {
  return legacyLiveRoomController.clearLiveLaunchCountdown(...args);
}

function clearAlpacapardyLiveSubscriptions(...args) {
  return legacyLiveRoomController.clearAlpacapardyLiveSubscriptions(...args);
}

function resetAlpacapardyLiveState({ keepGuestName = true } = {}) {
  return legacyLiveRoomController.resetAlpacapardyLiveState({ keepGuestName });
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

function handleClick(...args) { return appEventRouter.handleClick(...args); }

function handleInput(...args) { return appEventRouter.handleInput(...args); }

function handleSubmit(...args) { return appEventRouter.handleSubmit(...args); }

function handleKeyDown(...args) { return appEventRouter.handleKeyDown(...args); }

function handleTouchStart(...args) { return appEventRouter.handleTouchStart(...args); }

function handleTouchEnd(...args) { return appEventRouter.handleTouchEnd(...args); }

function choosePath(pathId) {
  return routeOrchestrationController.choosePath(pathId);
}

function chooseLens(lensId) {
  return routeOrchestrationController.chooseLens(lensId);
}

function chooseTarget(targetId) {
  return routeOrchestrationController.chooseTarget(targetId);
}

function toggleModeChoiceSection(targetId) {
  return routeOrchestrationController.toggleModeChoiceSection(targetId);
}

function getVisibleModeChoicePath() {
  return routeOrchestrationController.getVisibleModeChoicePath();
}

function toggleHeroMenu(button) {
  return appShellController.toggleHeroMenu(button);
}

function closeHeroMenu() {
  return appShellController.closeHeroMenu();
}

function primeModeChoiceCardSpread(column) {
  return routeBuilderViewController.primeModeChoiceCardSpread(column);
}

function scheduleModeChoiceCardSpread(column, board) {
  return routeBuilderViewController.scheduleModeChoiceCardSpread(column, board);
}

function getModeChoiceCardTarget(card) {
  return routeBuilderViewController.getModeChoiceCardTarget(card);
}

function easeModeChoiceSpread(progress) {
  return routeBuilderViewController.easeModeChoiceSpread(progress);
}

function setModeChoiceCardSpreadFrame(card, target, progress) {
  return routeBuilderViewController.setModeChoiceCardSpreadFrame(card, target, progress);
}

function animateModeChoiceCardSpread(column, board) {
  return routeBuilderViewController.animateModeChoiceCardSpread(column, board);
}

function clearModeChoiceCardSpread(column) {
  return routeBuilderViewController.clearModeChoiceCardSpread(column);
}

function freezeModeChoiceColumnAtCurrentPosition(column, board) {
  return routeBuilderViewController.freezeModeChoiceColumnAtCurrentPosition(column, board);
}

function getModeChoiceCollapsedSlot(column) {
  return routeBuilderViewController.getModeChoiceCollapsedSlot(column);
}

function moveModeChoiceColumnToCollapsedSlot(column) {
  return routeBuilderViewController.moveModeChoiceColumnToCollapsedSlot(column);
}

function clearModeChoiceColumnPosition(column) {
  return routeBuilderViewController.clearModeChoiceColumnPosition(column);
}

function toggleModeChoiceMenu(button) {
  return routeBuilderViewController.toggleModeChoiceMenu(button);
}

function continueTargetSelection() {
  return routeOrchestrationController.continueTargetSelection();
}

function chooseMode(modeId, pathId = null) {
  return routeOrchestrationController.chooseMode(modeId, pathId);
}

function changeGuidingSections() {
  return routeOrchestrationController.changeGuidingSections();
}

function changeModeSelection() {
  return routeOrchestrationController.changeModeSelection();
}

function clearFrom(step) {
  return routeOrchestrationController.clearFrom(step);
}

function openRawConnection(lensId, targetId) {
  return routeOrchestrationController.openRawConnection(lensId, targetId);
}

function openGuideSection(sectionId) {
  return routeOrchestrationController.openGuideSection(sectionId);
}

function openSectionChannel(sectionId) {
  return routeOrchestrationController.openSectionChannel(sectionId);
}

function render() {
  return appShellController.render();
}

function syncActiveModalFocus() {
  return appShellController.syncActiveModalFocus();
}

function renderInsights() {
  return appShellController.renderInsights();
}

function renderStats() {
  return appShellController.renderStats();
}

function renderSessionControls() {
  return appShellController.renderSessionControls();
}

function renderAppEntryGate() {
  return appShellController.renderAppEntryGate();
}

function renderAppEntryAuthPanel() {
  return appShellController.renderAppEntryAuthPanel();
}

function chooseAppEntryMode(mode) {
  return appShellController.chooseAppEntryMode(mode);
}

function openAlpacaOnlineCampus() {
  return appShellController.openAlpacaOnlineCampus();
}

function switchToLocalMode() {
  return appShellController.switchToLocalMode();
}

function openAlpacaOnlineHub() {
  return appShellController.openAlpacaOnlineHub();
}

function returnToAlpacaOnlineHub() {
  return legacyLiveRoomController.returnToAlpacaOnlineHub();
}

function renderProgressCircleStatCard(label, primary, secondary, percent) {
  return appShellRenderer.renderProgressCircleStatCard(label, primary, secondary, percent);
}

function renderBestScoreStrip() {
  return appShellRenderer.renderBestScoreStrip();
}

function renderBestScoreCard(card) {
  return appShellRenderer.renderBestScoreCard(card);
}

function renderOnlineScoreStrip() {
  return appShellRenderer.renderOnlineScoreStrip();
}

function getOnlineGameRecord(gameType) {
  return appShellRenderer.getOnlineGameRecord(gameType);
}

function formatBestNumberStat(value) {
  return appShellRenderer.formatBestNumberStat(value);
}

function getBestRunDestinationLabel(stageValue) {
  return appShellRenderer.getBestRunDestinationLabel(stageValue);
}

function renderSummary() {
  return appShellRenderer.renderSummary();
}

function renderSummaryChip(label, value) {
  return appShellRenderer.renderSummaryChip(label, value);
}

function renderWizard() {
  return routeBuilderViewController.renderWizard();
}

function renderAlpacaOnlineHub(...args) { return legacyLiveRoomRenderer.renderAlpacaOnlineHub(...args); }

function renderLegacyLiveRoomsDisabled(...args) { return legacyLiveRoomRenderer.renderLegacyLiveRoomsDisabled(...args); }

function getLiveOverlayRenderContext(...args) { return legacyLiveRoomRenderer.getLiveOverlayRenderContext(...args); }

function getLiveOverlayMount(...args) { return legacyLiveRoomRenderer.getLiveOverlayMount(...args); }

function renderLiveOverlayMount(...args) { return legacyLiveRoomRenderer.renderLiveOverlayMount(...args); }

function canPatchLiveWaitingOverlay(...args) { return legacyLiveRoomRenderer.canPatchLiveWaitingOverlay(...args); }

function patchLiveWaitingOverlay(...args) { return legacyLiveRoomRenderer.patchLiveWaitingOverlay(...args); }

function replaceLiveWaitingPart(...args) { return legacyLiveRoomRenderer.replaceLiveWaitingPart(...args); }

function renderOnlineLiveSidebar(...args) { return legacyLiveRoomRenderer.renderOnlineLiveSidebar(...args); }

function renderOnlineCurrentGameSummary(...args) { return legacyLiveRoomRenderer.renderOnlineCurrentGameSummary(...args); }

function getAlpacaOnlineConnectedCount(...args) { return legacyLiveRoomRenderer.getAlpacaOnlineConnectedCount(...args); }

function renderOnlineJoinForm(...args) { return legacyLiveRoomRenderer.renderOnlineJoinForm(...args); }

function renderOnlineOpenRoomsList(...args) { return legacyLiveRoomRenderer.renderOnlineOpenRoomsList(...args); }

function renderOnlineCreateGamePanel(...args) { return legacyLiveRoomRenderer.renderOnlineCreateGamePanel(...args); }

function renderOnlineHomeGameGrid(...args) { return legacyLiveRoomRenderer.renderOnlineHomeGameGrid(...args); }

function renderOnlineHomeGameCard(...args) { return legacyLiveRoomRenderer.renderOnlineHomeGameCard(...args); }

function getOnlineGameCardDescription(...args) { return legacyLiveRoomRenderer.getOnlineGameCardDescription(...args); }

function renderSelectedOnlineGameBody(...args) { return legacyLiveRoomRenderer.renderSelectedOnlineGameBody(...args); }

function renderOnlineAlpacapardyLiveGame(...args) { return legacyLiveRoomRenderer.renderOnlineAlpacapardyLiveGame(...args); }

function renderOnlineArcadeSetup(...args) { return legacyLiveRoomRenderer.renderOnlineArcadeSetup(...args); }

function renderOnlineAlpacapardySetup(...args) { return legacyLiveRoomRenderer.renderOnlineAlpacapardySetup(...args); }

function renderOnlineWaitingPopup(...args) { return legacyLiveRoomRenderer.renderOnlineWaitingPopup(...args); }

function renderOnlineArcadeWaitingRoom(...args) { return legacyLiveRoomRenderer.renderOnlineArcadeWaitingRoom(...args); }

function renderLiveOverlayLayer(...args) { return legacyLiveRoomRenderer.renderLiveOverlayLayer(...args); }

function renderLiveLaunchCountdownOverlay(...args) { return legacyLiveRoomRenderer.renderLiveLaunchCountdownOverlay(...args); }

function renderLiveWaitingOverlay(...args) { return legacyLiveRoomRenderer.renderLiveWaitingOverlay(...args); }

function renderLiveWaitingVideoRail(...args) { return legacyLiveRoomRenderer.renderLiveWaitingVideoRail(...args); }

function getLiveWaitingVideoIndex(videos) {
  return legacyLiveRoomController.getLiveWaitingVideoIndex(videos);
}

function navigateLiveWaitingVideo(direction) {
  return legacyLiveRoomController.navigateLiveWaitingVideo(direction);
}

function getLiveWaitingVideos(sessionId) {
  return legacyLiveRoomController.getLiveWaitingVideos(sessionId);
}

function isShortLiveWaitingVideo(video) {
  return legacyLiveRoomController.isShortLiveWaitingVideo(video);
}

function getVideoDurationSeconds(duration) {
  return legacyLiveRoomController.getVideoDurationSeconds(duration);
}

function renderOnlineArcadeGame(...args) { return legacyLiveRoomRenderer.renderOnlineArcadeGame(...args); }

function renderLivePlayerCard(...args) { return legacyLiveRoomRenderer.renderLivePlayerCard(...args); }

function getLiveRunSetupColorId() {
  return legacyLiveRoomController.getLiveRunSetupColorId();
}

function renderLiveRunSetupColorPicker(...args) { return legacyLiveRoomRenderer.renderLiveRunSetupColorPicker(...args); }

function selectLiveRunSetupColor(colorId) {
  return legacyLiveRoomController.selectLiveRunSetupColor(colorId);
}

function renderLiveRunColorPicker(...args) { return legacyLiveRoomRenderer.renderLiveRunColorPicker(...args); }

function renderLiveRunGame(...args) { return legacyLiveRoomRenderer.renderLiveRunGame(...args); }

function renderLiveRunMap(...args) { return legacyLiveRoomRenderer.renderLiveRunMap(...args); }

function getLiveRunRouteIndex(...args) { return legacyLiveRoomRenderer.getLiveRunRouteIndex(...args); }

function renderLiveRunPlayerPanel(...args) { return legacyLiveRoomRenderer.renderLiveRunPlayerPanel(...args); }

function renderLiveQuizGame(...args) { return legacyLiveRoomRenderer.renderLiveQuizGame(...args); }

function renderLiveRaceGame(...args) { return legacyLiveRoomRenderer.renderLiveRaceGame(...args); }

function renderLiveAlpaquizGame(...args) { return legacyLiveRoomRenderer.renderLiveAlpaquizGame(...args); }

function renderLiveRunAlpacaToken(...args) { return legacyLiveRoomRenderer.renderLiveRunAlpacaToken(...args); }

function renderLiveRaceLives(...args) { return legacyLiveRoomRenderer.renderLiveRaceLives(...args); }

function renderLiveAnswerStatus(...args) { return legacyLiveRoomRenderer.renderLiveAnswerStatus(...args); }

function renderLiveQuizRoundResults(...args) { return legacyLiveRoomRenderer.renderLiveQuizRoundResults(...args); }

function renderLiveLeaderboard(...args) { return legacyLiveRoomRenderer.renderLiveLeaderboard(...args); }

function renderLiveWinnerCard(...args) { return legacyLiveRoomRenderer.renderLiveWinnerCard(...args); }

function renderOnlineRoomListItem(...args) { return legacyLiveRoomRenderer.renderOnlineRoomListItem(...args); }

function getAlpacaOnlineRoster(...args) { return legacyLiveRoomRenderer.getAlpacaOnlineRoster(...args); }

function getOpenLiveRoomsByGame(...args) { return legacyLiveRoomRenderer.getOpenLiveRoomsByGame(...args); }

function getOpenRoomsForGame(...args) { return legacyLiveRoomRenderer.getOpenRoomsForGame(...args); }

function normalizeLiveGameType(gameType) {
  return legacyLiveRoomController.normalizeLiveGameType(gameType);
}

function getCurrentLiveGameType() {
  return legacyLiveRoomController.getCurrentLiveGameType();
}

function getLiveGameLabel(gameType = getCurrentLiveGameType()) {
  return legacyLiveRoomController.getLiveGameLabel(gameType);
}

function getLivePlayablePlayers(players = state.live.players) {
  return legacyLiveRoomController.getLivePlayablePlayers(players);
}

function getArcadeState(gameType = getCurrentLiveGameType()) {
  return legacyLiveRoomController.getArcadeState(gameType);
}

function createEmptyArcadeState(gameType) {
  return legacyLiveRoomController.createEmptyArcadeState(gameType);
}

function chooseOnlineGameType(gameType) {
  return legacyLiveRoomController.chooseOnlineGameType(gameType);
}

function renderStepPanel(index, title, helper, content, gridClass) {
  return routeBuilderViewController.renderStepPanel(index, title, helper, content, gridClass);
}

function getCurrentWizardStepNumber() {
  return routeBuilderViewController.getCurrentWizardStepNumber();
}

function getWizardStepDefinition(stepNumber) {
  return routeBuilderViewController.getWizardStepDefinition(stepNumber);
}

function renderWizardRail(currentStep) {
  return routeBuilderViewController.renderWizardRail(currentStep);
}

function renderWizardRailItem(item, currentStep) {
  return routeBuilderViewController.renderWizardRailItem(item, currentStep);
}

function getWizardRailItems() {
  return routeBuilderViewController.getWizardRailItems();
}

function getWizardCompletionDepth() {
  return routeBuilderViewController.getWizardCompletionDepth();
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
  return routeBuilderViewController.renderPathCards();
}

function renderLensCards() {
  return routeBuilderViewController.renderLensCards();
}

function renderTargetCards() {
  return routeBuilderViewController.renderTargetCards();
}

function renderModeCards() {
  return routeBuilderViewController.renderModeCards();
}

function renderModeChoiceBoard() {
  return routeBuilderViewController.renderModeChoiceBoard();
}

function renderModeChoiceColumn(pathId, title, asset, options) {
  return routeBuilderViewController.renderModeChoiceColumn(pathId, title, asset, options);
}

function renderModeChoiceCard(option, pathId) {
  return routeBuilderViewController.renderModeChoiceCard(option, pathId);
}

function getWizardRenderContext() {
  return routeBuilderViewController.getWizardRenderContext();
}

function getWizardRenderHelpers() {
  return routeBuilderViewController.getWizardRenderHelpers();
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
  return routeOrchestrationController.launchExperience();
}

function closeCurrentExperience() {
  return routeOrchestrationController.closeCurrentExperience();
}

function renderExperience() {
  return routeOrchestrationController.renderExperience();
}

function renderExperiencePreservingScroll() {
  return routeOrchestrationController.renderExperiencePreservingScroll();
}

function renderPreservingScroll(renderCallback) {
  return routeOrchestrationController.renderPreservingScroll(renderCallback);
}

function renderLiveSurfaces() {
  return routeOrchestrationController.renderLiveSurfaces();
}

function buildAlpacardExperience() {
  return alpacardsController.buildExperience();
}

function getAlpacardsForSelection() {
  return alpacardsController.getCardsForSelection();
}

function renderAlpacardExperience() {
  return alpacardsController.renderExperience();
}

function renderAlpacardFront(card) {
  return alpacardsController.renderFront(card);
}

function renderAlpacardBack(card) {
  return alpacardsController.renderBack(card);
}

function getAlpacardConnectionChips(card) {
  return alpacardsController.getConnectionChips(card);
}

function navigateAlpacard(direction) {
  return alpacardsController.navigate(direction);
}

function setAlpacardIndex(index) {
  return alpacardsController.setIndex(index);
}

function flipAlpacard() {
  return alpacardsController.flip();
}

function syncAlpacardCarouselState(options = {}) {
  return alpacardsController.syncCarouselState(options);
}

function shuffleAlpacard() {
  return alpacardsController.shuffleDeck();
}

function syncRadialMindMapScroll() {
  return mindMapOrbitController.syncRadialMindMapScroll();
}

function stopMindMapOrbitAnimation() {
  return mindMapOrbitController.stopMindMapOrbitAnimation();
}

function syncMindMapOrbitAnimation() {
  return mindMapOrbitController.syncMindMapOrbitAnimation();
}

function navigateMindMapGallery(direction) {
  return mindMapOrbitController.navigateMindMapGallery(direction);
}

function handleMindMapGalleryWheel(...args) { return appEventRouter.handleMindMapGalleryWheel(...args); }

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
  return routeOrchestrationController.keepRouteBuilderInView();
}

function hasActiveQuestionPopup() {
  return appShellController.hasActiveQuestionPopup();
}

function syncPopupScrollLock() {
  return appShellController.syncPopupScrollLock();
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
  return legacyLiveRoomController.canAccessLegacyLiveRooms();
}

function getLegacyLiveRoomsDisabledMessage() {
  return legacyLiveRoomController.getLegacyLiveRoomsDisabledMessage();
}

function canAccessMultiplayer() {
  return legacyLiveRoomController.canAccessMultiplayer();
}

function canDismissAuthModal() {
  return authController.canDismissAuthModal();
}

function syncAuthChrome() {
  return appShellController.syncAuthChrome();
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
  return legacyLiveRoomController.ensureLiveAuthSession();
}

function getLiveDisplayName() {
  return legacyLiveRoomController.getLiveDisplayName();
}

function renderAuthModal() {
  return appShellController.renderAuthModal();
}

function renderAuthGate() {
  return appShellRenderer.renderAuthGate();
}

function renderAuthIntro(mode, signedIn) {
  return appShellRenderer.renderAuthIntro(mode, signedIn);
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
  return appShellRenderer.renderAuthNotice();
}

function renderAuthBody(mode, busy) {
  return appShellRenderer.renderAuthBody(mode, busy);
}

function renderConnectedAlpaccount(busy) {
  return appShellRenderer.renderConnectedAlpaccount(busy);
}

function renderLoginForm(busy) {
  return appShellRenderer.renderLoginForm(busy);
}

function renderSignupForm(busy) {
  return appShellRenderer.renderSignupForm(busy);
}

function renderForgotPasswordForm(busy) {
  return appShellRenderer.renderForgotPasswordForm(busy);
}

function renderResetPasswordForm(busy) {
  return appShellRenderer.renderResetPasswordForm(busy);
}

function getAuthRenderContext() {
  return appShellRenderer.getAuthRenderContext();
}

function renderResourcesModal() {
  return appShellController.renderResourcesModal();
}

function renderCooperationModal() {
  return appShellController.renderCooperationModal();
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
  return alpacaChannelController.buildExperience();
}

function getApprovedRawContentSection(...args) {
  return rawContentController.getApprovedRawContentSection(...args);
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
  return alpacapardyBoardController.buildJeopardyExperience();
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
  return arcadeJumpHelpers.createJumpObstacle(cursor);
}

function createJumpCheckpointObstacle() {
  return arcadeJumpHelpers.createJumpCheckpointObstacle();
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

function buildBuildCaseExperience() {
  return buildCaseController.buildExperience();
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

function nextWritingPrompt(...args) {
  return studyGameController.nextWritingPrompt(...args);
}

function setWritingPhase(...args) {
  return studyGameController.setWritingPhase(...args);
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

function startBowlPractice(...args) {
  return studyGameController.startBowlPractice(...args);
}

function answerBowlQuestion(...args) {
  return studyGameController.answerBowlQuestion(...args);
}

function advanceBowlQuestion(...args) {
  return studyGameController.advanceBowlQuestion(...args);
}

function resetBowlPractice(...args) {
  return studyGameController.resetBowlPractice(...args);
}

function syncExperienceTimers() {
  arcadeRuntimeTimerController.syncExperienceTimers();

  if (
    !state.experience ||
    state.experience.type !== "jump" ||
    state.experience.phase !== "running" ||
    state.experience.finished
  ) {
    clearJumpAnimation();
  } else if (!arcadeJumpAnimationController.hasActiveJumpAnimation()) {
    startJumpAnimation();
  }
}

function renderAlpacaChannelExperience() {
  return alpacaChannelController.renderExperience();
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
  return alpacaChannelController.navigate(direction);
}

function getAlpacaChannelVideosForEntry(entry) {
  return alpacaChannelController.getVideosForEntry(entry);
}

function getAlpacaChannelVideosForSection(sectionId) {
  return alpacaChannelController.getVideosForSection(sectionId);
}

function createStandaloneAlpacaChannelVideo(video, fallbackSectionId = null) {
  return alpacaChannelController.createStandaloneVideo(video, fallbackSectionId);
}

function normalizeVideoUrl(url) {
  return alpacaChannelController.normalizeVideoUrl(url);
}

function getAlpacaChannelDomain(label) {
  return alpacaChannelController.getDomain(label);
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

function getRawVisibleQuizQuestionItems(...args) {
  return rawContentController.getRawVisibleQuizQuestionItems(...args);
}

function getSectionGuideQuestions(section) {
  return Array.isArray(section?.guideQuestions) ? section.guideQuestions : [];
}

function renderSectionTransferTable(...args) {
  return rawContentController.renderSectionTransferTable(...args);
}

function getVisibleWrongExplanation(...args) {
  return rawContentController.getVisibleWrongExplanation(...args);
}

function getVisibleQuizFeedbackParts(...args) {
  return rawContentController.getVisibleQuizFeedbackParts(...args);
}

function renderRawQuizFeedback(...args) {
  return rawContentController.renderRawQuizFeedback(...args);
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

function renderRawContentExperience(...args) {
  return rawContentController.renderRawContentExperience(...args);
}

function renderRawContentEntryGroups(...args) {
  return rawContentController.renderRawContentEntryGroups(...args);
}

function renderRawContentEntryCard(...args) {
  return rawContentController.renderRawContentEntryCard(...args);
}

function getRawContentScopeLabel(...args) {
  return rawContentController.getRawContentScopeLabel(...args);
}

function getRawContentPayload(...args) {
  return rawContentController.getRawContentPayload(...args);
}

function getRawEntriesForSelection(...args) {
  return rawContentController.getRawEntriesForSelection(...args);
}

function getRawEntriesForRouteSelection(...args) {
  return rawContentController.getRawEntriesForRouteSelection(...args);
}

function getRawEntriesForRunSetupCategoryIds(...args) {
  return rawContentController.getRawEntriesForRunSetupCategoryIds(...args);
}

function countRawQuizQuestions(...args) {
  return rawContentController.countRawQuizQuestions(...args);
}

function getOrderedRawContentSections(...args) {
  return rawContentController.getOrderedRawContentSections(...args);
}

function mapRawEntriesWithSection(...args) {
  return rawContentController.mapRawEntriesWithSection(...args);
}

function getRawEntryMasteryKey(...args) {
  return rawContentController.getRawEntryMasteryKey(...args);
}

function isRawEntryMastered(...args) {
  return rawContentController.isRawEntryMastered(...args);
}

function getRawMasteryHelpers(...args) {
  return rawContentController.getRawMasteryHelpers(...args);
}

function renderRawMasteryToggle(...args) {
  return rawContentController.renderRawMasteryToggle(...args);
}

function renderRawEntryQuickActions(...args) {
  return rawContentController.renderRawEntryQuickActions(...args);
}

function renderRawBackToTopButton(...args) {
  return rawContentController.renderRawBackToTopButton(...args);
}

function renderRawEntryChannelLinks(...args) {
  return rawContentController.renderRawEntryChannelLinks(...args);
}

function toggleRawMastery(...args) {
  return rawContentController.toggleRawMastery(...args);
}

function getAllRawEntries(...args) {
  return rawContentController.getAllRawEntries(...args);
}

function getTotalRawMasterableEntries(...args) {
  return rawContentController.getTotalRawMasterableEntries(...args);
}

function getMasteredRawEntryCount(...args) {
  return rawContentController.getMasteredRawEntryCount(...args);
}

function findLearnSubjectRouteIdByLabel(...args) {
  return rawContentController.findLearnSubjectRouteIdByLabel(...args);
}

function findBigIdeaRouteIdByLabel(...args) {
  return rawContentController.findBigIdeaRouteIdByLabel(...args);
}

function getRawConnectionGroups(...args) {
  return rawContentController.getRawConnectionGroups(...args);
}

function renderRawConnectionGroups(...args) {
  return rawContentController.renderRawConnectionGroups(...args);
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

function showNextDebateTopic() {
  return buildCaseController.showNextTopic();
}

function startDebateConversation() {
  return buildCaseController.startConversation();
}

function toggleDebateSideSpin() {
  return buildCaseController.toggleSideSpin();
}

function returnToDebateTopic() {
  return buildCaseController.returnToTopic();
}

function resetDebateSpinForCurrentTopic() {
  return buildCaseController.resetSpinForCurrentTopic();
}

function toggleDebateSuggestion(itemId) {
  return buildCaseController.toggleSuggestion(itemId);
}

function submitDebateRound() {
  return buildCaseController.submitRound();
}

function advanceDebateRound() {
  return buildCaseController.advanceRound();
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

function renderBuildCaseExperience() {
  return buildCaseController.renderExperience();
}

function startBuildCaseRoute() {
  return buildCaseController.startRoute();
}

function chooseBuildCaseCamp(camp) {
  return buildCaseController.chooseCamp(camp);
}

function toggleBuildCaseSupport(index) {
  return buildCaseController.toggleSupport(index);
}

function confirmBuildCaseSupports() {
  return buildCaseController.confirmSupports();
}

function chooseBuildCaseRebuttal(index) {
  return buildCaseController.chooseRebuttal(index);
}

function advanceBuildCaseRound() {
  return buildCaseController.advanceLegacyRound();
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
  return alpaquizRenderController.renderQuizExperience();
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

function getRelayRenderHelpers() {
  return {
    GAME_CONFIG,
    escapeHtml,
    getTargetLabel,
    getQuestionSectionLabel: (question) => {
      if (!question) {
        return getTargetLabel();
      }
      return question.sectionId && sectionById[question.sectionId]
        ? sectionById[question.sectionId].originalTitle
        : (question.guidingSection || getTargetLabel());
    },
    renderPanelTitle,
    renderConfiguredMascotAsset,
    getGameplayAssetPath,
    getGameplayReviewBadge,
    getGamePromptLabel,
    renderGameNotes,
    renderQuestionSubjectPills,
    renderGameQuestionPopup,
    renderTargetSetupSelector,
    renderCompactRaceTimerCard,
    getTimerVisualState,
    renderOptionToken,
    renderCheckpointVisual,
    formatRelayAwardedTeams,
    renderMetricCard,
    renderSelectedTargetBreakdown,
    getResultAssetPath,
    getAssetValue,
    renderAssetImage
  };
}

function renderQuizSetup(experience) {
  return alpaquizRenderController.renderQuizSetup(experience);
}

function renderQuizQuestionPage(experience) {
  return alpaquizRenderController.renderQuizQuestionPage(experience);
}

function getQuizRemainingNotice(experience) {
  return alpaquizEngine.getRemainingNotice(experience);
}

function getQuizDifficultyResults(experience) {
  return alpaquizEngine.getDifficultyResults(experience);
}

function renderQuizResultsFooter(experience) {
  return alpaquizRenderController.renderQuizResultsFooter(experience);
}

function renderQuizQuestionCard(question, questionIndex, experience) {
  return alpaquizRenderController.renderQuizQuestionCard(question, questionIndex, experience);
}

function renderQuizQuestionFeedback(question, selectedIndex, isCorrect) {
  return alpaquizRenderController.renderQuizQuestionFeedback(question, selectedIndex, isCorrect);
}

function toggleQuizSection(...args) {
  return studyGameController.toggleQuizSection(...args);
}

function selectAllQuizSections(...args) {
  return studyGameController.selectAllQuizSections(...args);
}

function toggleQuizDifficulty(...args) {
  return studyGameController.toggleQuizDifficulty(...args);
}

function setQuizQuestionCount(...args) {
  return studyGameController.setQuizQuestionCount(...args);
}

function startQuizRoute(...args) {
  return studyGameController.startQuizRoute(...args);
}

function answerQuizQuestion(...args) {
  return studyGameController.answerQuizQuestion(...args);
}

function submitQuizRoute(...args) {
  return studyGameController.submitQuizRoute(...args);
}

function resetQuizRoute(...args) {
  return studyGameController.resetQuizRoute(...args);
}

function renderRaceExperience() {
  return arcadeRenderController.renderRaceExperience();
}

function renderRaceTargetSelector(...args) {
  return arcadeRenderController.renderRaceTargetSelector(...args);
}

function renderTargetSetupSelector(...args) {
  return arcadeRenderController.renderTargetSetupSelector(...args);
}

function renderRaceQuestionPills(...args) {
  return arcadeRenderController.renderRaceQuestionPills(...args);
}

function startRaceRoute(...args) {
  return arcadeGameController.startRaceRoute(...args);
}

function getRaceAvailableQuestionCount(...args) {
  return arcadeGameController.getRaceAvailableQuestionCount(...args);
}

function toggleRaceSetupCategory(...args) {
  return arcadeGameController.toggleRaceSetupCategory(...args);
}

function answerRaceQuestion(...args) {
  return arcadeGameController.answerRaceQuestion(...args);
}

function resolveRaceQuestion(...args) {
  return arcadeGameController.resolveRaceQuestion(...args);
}

function advanceRace(...args) {
  return arcadeGameController.advanceRace(...args);
}

function renderJeopardyExperience() {
  return alpacapardyBoardController.renderJeopardyExperience();
}

function renderJeopardyFocus(experience) {
  return alpacapardyBoardController.renderJeopardyFocus(experience);
}

function renderJeopardySetup(experience) {
  return alpacapardyBoardController.renderJeopardySetup(experience);
}

function getAlpacapardyRenderHelpers() {
  return alpacapardyBoardController.getAlpacapardyRenderHelpers();
}

function getAlpacapardyLiveRenderContext() {
  return legacyLiveRoomController.getAlpacapardyLiveRenderContext();
}

function isAlpacapardyLiveActive() {
  return legacyLiveRoomController.isAlpacapardyLiveActive();
}

function guardMultiplayerAccess() {
  return legacyLiveRoomController.guardMultiplayerAccess();
}

function canOpenAlpacapardyLiveTile() {
  return legacyLiveRoomController.canOpenAlpacapardyLiveTile();
}

function canAnswerAlpacapardyLiveFocus() {
  return legacyLiveRoomController.canAnswerAlpacapardyLiveFocus();
}

function canCloseAlpacapardyLiveFocus() {
  return legacyLiveRoomController.canCloseAlpacapardyLiveFocus();
}

function getAlpacapardyLiveIdentityContext() {
  return legacyLiveRoomController.getAlpacapardyLiveIdentityContext();
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

async function refreshAlpacapardyLiveLobby(...args) {
  return legacyLiveRoomController.refreshAlpacapardyLiveLobby(...args);
}

function subscribeAlpacapardyLobby(...args) {
  return legacyLiveRoomController.subscribeAlpacapardyLobby(...args);
}

async function refreshAlpacapardyLiveLobbySilently(...args) {
  return legacyLiveRoomController.refreshAlpacapardyLiveLobbySilently(...args);
}

function startAlpacapardyLiveSync(...args) {
  return legacyLiveRoomController.startAlpacapardyLiveSync(...args);
}

async function syncAlpacapardyLiveNow(...args) {
  return legacyLiveRoomController.syncAlpacapardyLiveNow(...args);
}

async function maybeAutoRevealTimedLiveGame(...args) {
  return legacyLiveRoomController.maybeAutoRevealTimedLiveGame(...args);
}

async function maybeAutoResolveTimedAlpaquiz(...args) {
  return legacyLiveRoomController.maybeAutoResolveTimedAlpaquiz(...args);
}

async function refreshAlpacapardyLiveSessionState(...args) {
  return legacyLiveRoomController.refreshAlpacapardyLiveSessionState(...args);
}

async function createSelectedLiveGameRoom(...args) {
  return legacyLiveRoomController.createSelectedLiveGameRoom(...args);
}

async function createArcadeLiveRoom(...args) {
  return legacyLiveRoomController.createArcadeLiveRoom(...args);
}

async function createAlpacapardyLiveRoom(...args) {
  return legacyLiveRoomController.createAlpacapardyLiveRoom(...args);
}

async function joinAlpacapardyLiveRoom(...args) {
  return legacyLiveRoomController.joinAlpacapardyLiveRoom(...args);
}

async function joinAlpacapardyLiveRoomByCode(...args) {
  return legacyLiveRoomController.joinAlpacapardyLiveRoomByCode(...args);
}

function buildAlpacapardyLiveSettings(...args) {
  return legacyLiveRoomController.buildAlpacapardyLiveSettings(...args);
}

function applyAlpacapardyLiveSettings(...args) {
  return legacyLiveRoomController.applyAlpacapardyLiveSettings(...args);
}

async function syncAlpacapardyLiveSettings(...args) {
  return legacyLiveRoomController.syncAlpacapardyLiveSettings(...args);
}

function subscribeAlpacapardySession(...args) {
  return legacyLiveRoomController.subscribeAlpacapardySession(...args);
}

async function refreshAlpacapardyLivePlayers(...args) {
  return legacyLiveRoomController.refreshAlpacapardyLivePlayers(...args);
}

function startAlpacapardyLiveHeartbeat(...args) {
  return legacyLiveRoomController.startAlpacapardyLiveHeartbeat(...args);
}

function maybeStartLiveLaunchCountdown(...args) {
  return legacyLiveRoomController.maybeStartLiveLaunchCountdown(...args);
}

function startLiveLaunchCountdown(...args) {
  return legacyLiveRoomController.startLiveLaunchCountdown(...args);
}

function maybeAutoStartReadyLiveGame(...args) {
  return legacyLiveRoomController.maybeAutoStartReadyLiveGame(...args);
}

function compareLivePlayers(left, right) {
  return legacyLiveRoomController.compareLivePlayers(left, right);
}

async function syncAlpacapardyLiveEvents(...args) {
  return legacyLiveRoomController.syncAlpacapardyLiveEvents(...args);
}

function applyLiveEvent(...args) {
  return legacyLiveRoomController.applyLiveEvent(...args);
}

function applyAlpacapardyLiveEvent(...args) {
  return legacyLiveRoomController.applyAlpacapardyLiveEvent(...args);
}

function extractAlpacapardyLiveState(...args) {
  return legacyLiveRoomController.extractAlpacapardyLiveState(...args);
}

function mergeAlpacapardyLiveState(...args) {
  return legacyLiveRoomController.mergeAlpacapardyLiveState(...args);
}

async function emitAlpacapardyLiveEvent(...args) {
  return legacyLiveRoomController.emitAlpacapardyLiveEvent(...args);
}

async function emitLiveEvent(...args) {
  return legacyLiveRoomController.emitLiveEvent(...args);
}

function applyArcadeLiveEvent(...args) {
  return legacyLiveRoomController.applyArcadeLiveEvent(...args);
}

function reduceArcadeLiveState(...args) {
  return legacyLiveRoomController.reduceArcadeLiveState(...args);
}

function reduceLiveRunState(...args) {
  return legacyLiveRoomController.reduceLiveRunState(...args);
}

function reduceLiveQuizState(...args) {
  return legacyLiveRoomController.reduceLiveQuizState(...args);
}

function reduceLiveRaceState(...args) {
  return legacyLiveRoomController.reduceLiveRaceState(...args);
}

function reduceLiveAlpaquizState(...args) {
  return legacyLiveRoomController.reduceLiveAlpaquizState(...args);
}

function canStartSelectedLiveGame(...args) {
  return legacyLiveRoomController.canStartSelectedLiveGame(...args);
}

async function startSelectedLiveGame(...args) {
  return legacyLiveRoomController.startSelectedLiveGame(...args);
}

function getLiveRunColorAssignments(...args) {
  return legacyLiveRoomController.getLiveRunColorAssignments(...args);
}

function buildArcadeStartState(...args) {
  return legacyLiveRoomController.buildArcadeStartState(...args);
}

function buildAllThemeQuestionSequence(...args) {
  return legacyLiveRoomController.buildAllThemeQuestionSequence(...args);
}

async function selectLiveAlpacaColor(...args) {
  return legacyLiveRoomController.selectLiveAlpacaColor(...args);
}

async function answerSelectedLiveGame(...args) {
  return legacyLiveRoomController.answerSelectedLiveGame(...args);
}

async function advanceSelectedLiveGame(...args) {
  return legacyLiveRoomController.advanceSelectedLiveGame(...args);
}

async function buzzSelectedLiveGame(...args) {
  return legacyLiveRoomController.buzzSelectedLiveGame(...args);
}

function getArcadeLeaderboard(...args) {
  return legacyLiveRoomController.getArcadeLeaderboard(...args);
}

function clonePlain(...args) {
  return legacyLiveRoomController.clonePlain(...args);
}

async function startAlpacapardyLiveGame(...args) {
  return legacyLiveRoomController.startAlpacapardyLiveGame(...args);
}

async function sendAlpacapardyLiveChat(...args) {
  return legacyLiveRoomController.sendAlpacapardyLiveChat(...args);
}

async function leaveAlpacapardyLiveRoom(...args) {
  return legacyLiveRoomController.leaveAlpacapardyLiveRoom(...args);
}

function buildJeopardyBoard() {
  return alpacapardyBoardController.buildJeopardyBoard();
}

function getJeopardySetupOptions() {
  return alpacapardyBoardController.getJeopardySetupOptions();
}

function getDefaultJeopardySetupCategoryIds() {
  return alpacapardyBoardController.getDefaultJeopardySetupCategoryIds();
}

function getTargetSetupOptions() {
  return alpacapardyBoardController.getTargetSetupOptions();
}

function getDefaultTargetSetupCategoryIds() {
  return alpacapardyBoardController.getDefaultTargetSetupCategoryIds();
}

function getSetupTargetHeading() {
  return alpacapardyBoardController.getSetupTargetHeading();
}

function getSetupTargetHelper(selectedCount) {
  return alpacapardyBoardController.getSetupTargetHelper(selectedCount);
}

function toggleSetupCategorySelection(...args) {
  return arcadeGameController.toggleSetupCategorySelection(...args);
}

function toggleRunSetupCategory(...args) {
  return arcadeGameController.toggleRunSetupCategory(...args);
}

function startRunRoute(...args) {
  return arcadeGameController.startRunRoute(...args);
}

function setJeopardyTeamCount(count) {
  return alpacapardyController.setJeopardyTeamCount(count);
}

function toggleJeopardySetupCategory(categoryId) {
  return alpacapardyController.toggleJeopardySetupCategory(categoryId);
}

function startJeopardyGame() {
  return alpacapardyController.startJeopardyGame();
}

function buildConfiguredJeopardyBoard(categoryIds) {
  return alpacapardyBoardController.buildConfiguredJeopardyBoard(categoryIds);
}

function pickQuestionsForJeopardyCategory(pool, usedQuestionIds) {
  return alpacapardyBoardController.pickQuestionsForJeopardyCategory(pool, usedQuestionIds);
}

function getJeopardyGroupingStrategies(selectionQuestions) {
  return alpacapardyBoardController.getJeopardyGroupingStrategies(selectionQuestions);
}

function getJeopardySourceTypeDefinitions() {
  return alpacapardyBoardController.getJeopardySourceTypeDefinitions();
}

function createJeopardyTile(question, index) {
  return alpacapardyBoardController.createJeopardyTile(question, index);
}

function buildJeopardyBoardFromDefinitions(selectionQuestions, definitions, groupCount) {
  return alpacapardyBoardController.buildJeopardyBoardFromDefinitions(selectionQuestions, definitions, groupCount);
}

function buildFallbackJeopardyBoard(selectionQuestions) {
  return alpacapardyBoardController.buildFallbackJeopardyBoard(selectionQuestions);
}

function openJeopardyTile(groupIndex, tileIndex) {
  return alpacapardyController.openJeopardyTile(groupIndex, tileIndex);
}

function answerJeopardyQuestion(optionIndex) {
  return alpacapardyController.answerJeopardyQuestion(optionIndex);
}

function resolveJeopardyTimeout() {
  return alpacapardyController.resolveJeopardyTimeout();
}

function resolveJeopardyQuestion(optionIndex, timedOut) {
  return alpacapardyController.resolveJeopardyQuestion(optionIndex, timedOut);
}

function closeJeopardyFocus() {
  return alpacapardyController.closeJeopardyFocus();
}

function createJeopardyTeams(count = GAME_CONFIG.jeopardyDefaultTeams) {
  return alpacapardyBoardController.createJeopardyTeams(count);
}

function getJeopardyActiveTeam(experience) {
  return alpacapardyBoardController.getJeopardyActiveTeam(experience);
}

function getJeopardyStandings(teams) {
  return alpacapardyBoardController.getJeopardyStandings(teams);
}

function renderJeopardyTeams(experience) {
  return alpacapardyBoardController.renderJeopardyTeams(experience);
}

function renderJeopardyCategoryHeader(label) {
  return alpacapardyBoardController.renderJeopardyCategoryHeader(label);
}

function renderJeopardyTileFace(tile) {
  return alpacapardyBoardController.renderJeopardyTileFace(tile);
}

function startJeopardyTimer() {
  return alpacapardyController.startJeopardyTimer();
}

function chooseJeopardyTeam(teamIndex) {
  return alpacapardyController.chooseJeopardyTeam(teamIndex);
}

function addJeopardyTeam() {
  return alpacapardyController.addJeopardyTeam();
}

function removeJeopardyTeam() {
  return alpacapardyController.removeJeopardyTeam();
}

function advanceJeopardyTeam() {
  return alpacapardyController.advanceJeopardyTeam();
}

function renderJeopardyResults(experience) {
  return alpacapardyBoardController.renderJeopardyResults(experience);
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

function getRelayStandings(...args) {
  return alpaquizRenderController.getRelayStandings(...args);
}

function renderRelayExperience() {
  return alpaquizRenderController.renderRelayExperience();
}

function startRelayRoute(...args) {
  return arcadeGameController.startRelayRoute(...args);
}

function toggleRelaySetupCategory(...args) {
  return arcadeGameController.toggleRelaySetupCategory(...args);
}

function setRelayTeamCount(...args) {
  return arcadeGameController.setRelayTeamCount(...args);
}

function setRelayQuestionCount(...args) {
  return arcadeGameController.setRelayQuestionCount(...args);
}

function buzzRelayTeam(...args) {
  return arcadeGameController.buzzRelayTeam(...args);
}

function answerRelayQuestion(...args) {
  return arcadeGameController.answerRelayQuestion(...args);
}

function getRelayAwardRecipients(...args) {
  return arcadeGameController.getRelayAwardRecipients(...args);
}

function formatRelayAwardedTeams(...args) {
  return arcadeGameController.formatRelayAwardedTeams(...args);
}

function resolveRelayOutcome(...args) {
  return arcadeGameController.resolveRelayOutcome(...args);
}

function handleRelayTimeout(...args) {
  return arcadeGameController.handleRelayTimeout(...args);
}

function advanceRelayQuestion(...args) {
  return arcadeGameController.advanceRelayQuestion(...args);
}

function addRelayTeam(...args) {
  return arcadeGameController.addRelayTeam(...args);
}

function removeRelayTeam(...args) {
  return arcadeGameController.removeRelayTeam(...args);
}

function renderRelayResults(experience) {
  return alpaquizRenderController.renderRelayResults(experience);
}

function getRaceQuestionDuration(index) {
  return GAME_CONFIG.raceQuestionTime;
}

function startRelayAnswerTimer() {
  return arcadeRuntimeTimerController.startRelayAnswerTimer();
}

function startRaceTimer() {
  return arcadeRuntimeTimerController.startRaceTimer();
}

function startRunTimer() {
  return arcadeRuntimeTimerController.startRunTimer();
}

function formatCountdown(...args) {
  return arcadeRenderController.formatCountdown(...args);
}

function getRunCurrentStop(...args) {
  return arcadeRenderController.getRunCurrentStop(...args);
}

function getRunNextStop(...args) {
  return arcadeRenderController.getRunNextStop(...args);
}

function getRunRoundsBeforeYale(...args) {
  return arcadeRenderController.getRunRoundsBeforeYale(...args);
}

function getRunPassedStopLabels(...args) {
  return arcadeRenderController.getRunPassedStopLabels(...args);
}

function getRunStopRoundSuffix(...args) {
  return arcadeRenderController.getRunStopRoundSuffix(...args);
}

function formatRunCurrentStopLabel(...args) {
  return arcadeRenderController.formatRunCurrentStopLabel(...args);
}

function getRunMapTop(...args) {
  return arcadeRenderController.getRunMapTop(...args);
}

function renderRunMap(...args) {
  return arcadeRenderController.renderRunMap(...args);
}

function renderRunStatusRow(...args) {
  return arcadeRenderController.renderRunStatusRow(...args);
}

function renderRunMapBackground(...args) {
  return arcadeRenderController.renderRunMapBackground(...args);
}

function renderRunTravelMarker(...args) {
  return arcadeRenderController.renderRunTravelMarker(...args);
}

function renderRegionalStopMarkerSvg(...args) {
  return arcadeRenderController.renderRegionalStopMarkerSvg(...args);
}

function renderGlobalRoundMarkerSvg(...args) {
  return arcadeRenderController.renderGlobalRoundMarkerSvg(...args);
}

function renderYaleDestinationMarkerSvg(...args) {
  return arcadeRenderController.renderYaleDestinationMarkerSvg(...args);
}

function renderRunMapStop(...args) {
  return arcadeRenderController.renderRunMapStop(...args);
}

function renderRunStopMarker(...args) {
  return arcadeRenderController.renderRunStopMarker(...args);
}

function renderJumpExperience() {
  return arcadeRenderController.renderJumpExperience();
}

function renderJumpBackground(...args) {
  return arcadeRenderController.renderJumpBackground(...args);
}

function getJumpRunnerState(...args) {
  return arcadeRenderController.getJumpRunnerState(...args);
}

function getJumpRunnerClass(...args) {
  return arcadeRenderController.getJumpRunnerClass(...args);
}

function getJumpRunnerAssetConfig(...args) {
  return arcadeRenderController.getJumpRunnerAssetConfig(...args);
}

function renderJumpRunner(...args) {
  return arcadeRenderController.renderJumpRunner(...args);
}

function renderJumpObstacle(...args) {
  return arcadeRenderController.renderJumpObstacle(...args);
}

function renderJumpLives(...args) {
  return arcadeRenderController.renderJumpLives(...args);
}

function getJumpQuestionLevel(...args) {
  return arcadeRenderController.getJumpQuestionLevel(...args);
}

function getJumpQuestionValue(...args) {
  return arcadeRenderController.getJumpQuestionValue(...args);
}

function getJumpObstacleRequirement(experience) {
  return arcadeJumpHelpers.getJumpObstacleRequirement(experience.currentQuestion, getJumpQuestionLevel);
}

function getJumpObstacleSpeed(experience) {
  return arcadeJumpHelpers.getJumpObstacleSpeed(experience, GAME_CONFIG);
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

function renderJumpQuestionOverlay(...args) {
  return arcadeRenderController.renderJumpQuestionOverlay(...args);
}

function startJumpRoute(...args) {
  return arcadeGameController.startJumpRoute(...args);
}

function toggleJumpSetupCategory(...args) {
  return arcadeGameController.toggleJumpSetupCategory(...args);
}

function performJumpAction(...args) {
  return arcadeGameController.performJumpAction(...args);
}

function startJumpAnimation() {
  return arcadeJumpAnimationController.startJumpAnimation();
}

function updateJumpFrame(experience, timestamp) {
  return arcadeJumpAnimationController.updateJumpFrame(experience, timestamp);
}

function hasJumpCollision(experience) {
  return arcadeJumpHelpers.hasJumpCollision(experience);
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

function answerJumpQuestion(...args) {
  return arcadeGameController.answerJumpQuestion(...args);
}

function continueJumpRoute(...args) {
  return arcadeGameController.continueJumpRoute(...args);
}

function renderRunExperience() {
  return arcadeRenderController.renderRunExperience();
}

function renderGameQuestionPopup(...args) {
  return appShellRenderer.renderGameQuestionPopup(...args);
}

function renderExperienceCloseButton(...args) {
  return appShellRenderer.renderExperienceCloseButton(...args);
}

function answerRunQuestion(...args) {
  return arcadeGameController.answerRunQuestion(...args);
}

function continueRun(...args) {
  return arcadeGameController.continueRun(...args);
}

function renderResultsScreen(config) {
  return resultsRenderer.renderResultsScreen(config);
}

function renderMetricCard(label, value) {
  return resultsRenderer.renderMetricCard(label, value);
}

function renderBreakdowns(answers) {
  return resultsRenderer.renderBreakdowns(answers);
}

function renderSelectedTargetBreakdown(answers) {
  return resultsRenderer.renderSelectedTargetBreakdown(answers);
}

function renderAlternateLensBreakdown(answers) {
  return resultsRenderer.renderAlternateLensBreakdown(answers);
}

function getAlternateBreakdownLensId() {
  return resultsRenderer.getAlternateBreakdownLensId();
}

function getBreakdownRowsForLens(answers, lensId) {
  return resultsRenderer.getBreakdownRowsForLens(answers, lensId);
}

function renderBreakdownRow(label, value, accuracy) {
  return resultsRenderer.renderBreakdownRow(label, value, accuracy);
}

function renderSelectedGuidingSectionSpans(...args) {
  return appShellRenderer.renderSelectedGuidingSectionSpans(...args);
}

function renderPanelTitle(...args) {
  return appShellRenderer.renderPanelTitle(...args);
}

function renderLearnCardFooterNav(...args) {
  return appShellRenderer.renderLearnCardFooterNav(...args);
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
  return alpacapardyBoardController.countJeopardyTiles(board);
}

function countJeopardyDoneTiles(board) {
  return alpacapardyBoardController.countJeopardyDoneTiles(board);
}

function allJeopardyTilesDone(board) {
  return alpacapardyBoardController.allJeopardyTilesDone(board);
}

function isActiveJeopardyTile(groupIndex, tileIndex) {
  return alpacapardyBoardController.isActiveJeopardyTile(groupIndex, tileIndex);
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

function renderRaceTimerWidget(...args) {
  return arcadeRenderController.renderRaceTimerWidget(...args);
}

function renderCompactRaceTimerCard(...args) {
  return arcadeRenderController.renderCompactRaceTimerCard(...args);
}

function getTimerVisualState(...args) {
  return arcadeRenderController.getTimerVisualState(...args);
}

function renderPopupQuestionTimerPanel(...args) {
  return arcadeRenderController.renderPopupQuestionTimerPanel(...args);
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

function getRawVisualAssetHelpers(...args) {
  return rawContentController.getRawVisualAssetHelpers(...args);
}

function renderRawStudentAssets(...args) {
  return rawContentController.renderRawStudentAssets(...args);
}

function getRawAssetSelectionKey(...args) {
  return rawContentController.getRawAssetSelectionKey(...args);
}

function selectRawAssetPoint(...args) {
  return rawContentController.selectRawAssetPoint(...args);
}

function renderRawSpecialAssets(...args) {
  return rawContentController.renderRawSpecialAssets(...args);
}

function renderRawSpecialAsset(...args) {
  return rawContentController.renderRawSpecialAsset(...args);
}

function renderRawTimelineAsset(...args) {
  return rawContentController.renderRawTimelineAsset(...args);
}

function renderRawRouteMapAsset(...args) {
  return rawContentController.renderRawRouteMapAsset(...args);
}

function renderRawImageCardAsset(...args) {
  return rawContentController.renderRawImageCardAsset(...args);
}

function renderRawVisualSections(...args) {
  return rawContentController.renderRawVisualSections(...args);
}

function renderRawVisualFooterQuestion(...args) {
  return rawContentController.renderRawVisualFooterQuestion(...args);
}

function renderRawVisualGallery(...args) {
  return rawContentController.renderRawVisualGallery(...args);
}

function renderRawVisualLinkPreview(...args) {
  return rawContentController.renderRawVisualLinkPreview(...args);
}

function getRawMediaLinkItems(...args) {
  return rawContentController.getRawMediaLinkItems(...args);
}

function renderRawMediaLinkButtons(...args) {
  return rawContentController.renderRawMediaLinkButtons(...args);
}

function getEmbeddableVideo(url) {
  return alpacaChannelController.getEmbeddableVideo(url);
}

function getVideoPreview(url) {
  return alpacaChannelController.getVideoPreview(url);
}

function renderRawVisualPreview(...args) {
  return rawContentController.renderRawVisualPreview(...args);
}

function renderTextWithBreaks(...args) {
  return rawContentController.renderTextWithBreaks(...args);
}

function getRawOfficialDisplayText(...args) {
  return rawContentController.getRawOfficialDisplayText(...args);
}

function stripRawOfficialReferenceAppendix(...args) {
  return rawContentController.stripRawOfficialReferenceAppendix(...args);
}

function isRawOfficialReferenceAppendix(...args) {
  return rawContentController.isRawOfficialReferenceAppendix(...args);
}

function isRawOfficialReferenceLine(...args) {
  return rawContentController.isRawOfficialReferenceLine(...args);
}

function getRawQuizPagerKey(...args) {
  return rawContentController.getRawQuizPagerKey(...args);
}

function getRawQuizPageIndex(...args) {
  return rawContentController.getRawQuizPageIndex(...args);
}

function renderRawQuizPager(...args) {
  return rawContentController.renderRawQuizPager(...args);
}

function renderRawQuizQuestion(...args) {
  return rawContentController.renderRawQuizQuestion(...args);
}

function openRawMediaLightboxFromTrigger(...args) {
  return rawContentController.openRawMediaLightboxFromTrigger(...args);
}

function getRawMediaLightboxAnchor(...args) {
  return rawContentController.getRawMediaLightboxAnchor(...args);
}

function closeRawMediaLightbox(...args) {
  return rawContentController.closeRawMediaLightbox(...args);
}

function shiftRawMediaLightbox(...args) {
  return rawContentController.shiftRawMediaLightbox(...args);
}

function renderRawMediaLightbox(...args) {
  return rawContentController.renderRawMediaLightbox(...args);
}

function getRawQuizQuestionKey(...args) {
  return rawContentController.getRawQuizQuestionKey(...args);
}

function selectRawQuizOption(...args) {
  return rawContentController.selectRawQuizOption(...args);
}

function rememberRawQuestionGallerySlide(...args) {
  return rawContentController.rememberRawQuestionGallerySlide(...args);
}

function setRawQuizPageIndex(...args) {
  return rawContentController.setRawQuizPageIndex(...args);
}

function shiftRawQuizPage(...args) {
  return rawContentController.shiftRawQuizPage(...args);
}

function getRawQuestionGalleryByPagerKey(...args) {
  return rawContentController.getRawQuestionGalleryByPagerKey(...args);
}

function syncRawQuestionGalleries(...args) {
  return rawContentController.syncRawQuestionGalleries(...args);
}

function syncRawQuestionGallery(...args) {
  return rawContentController.syncRawQuestionGallery(...args);
}

function renderRawQuizOptionStateClass(...args) {
  return rawContentController.renderRawQuizOptionStateClass(...args);
}

function stableShuffleByKey(...args) {
  return rawContentController.stableShuffleByKey(...args);
}

function hashString(...args) {
  return rawContentController.hashString(...args);
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

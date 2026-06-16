(function () {
  const DISCORD_INVITE_URL = "https://discord.gg/5m6tCSBy";
  const CONTACT_EMAIL_URL = "mailto:frenchease.admin@gmail.com";
  const CAMPUS_PREVIEW_PUBLIC_ENABLED = true;
  const LEGACY_LIVE_ROOMS_PUBLIC_ENABLED = false;
  const UNAVAILABLE_MODE_REASONS = Object.freeze({
    writing: "Collaborative Writing is available soon. We are keeping it closed for this public build.",
    buildcase: "Debate Lab is available soon. We are keeping it closed for this public build.",
    bowl: "Scholar's Bowl is available soon. We are keeping it closed for this public build."
  });

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

  window.WSC_APP_CONFIG = Object.freeze({
    DISCORD_INVITE_URL,
    CONTACT_EMAIL_URL,
    CAMPUS_PREVIEW_PUBLIC_ENABLED,
    LEGACY_LIVE_ROOMS_PUBLIC_ENABLED,
    UNAVAILABLE_MODE_REASONS,
    MULTIPLAYER_ALLOWED_EMAILS,
    MULTIPLAYER_ALLOWED_EMAIL_DOMAINS,
    WSC_ROUND_OPTIONS,
    GAME_CONFIG,
    LIVE_GAME_TYPES,
    LIVE_GAME_ORDER,
    LIVE_SYNC_INTERVAL_MS,
    LIVE_ALPACA_COLORS,
    WIZARD_TOTAL_STEPS,
    DEFAULT_LENS_ID,
    DEEP_STRUCTURE_BIG_IDEAS,
    ALPACA_RUN_ROUTE,
    RELAY_KEY_LAYOUTS,
    ALPACA_REVIEW_MODE,
    ALPACA_PENDING_REVIEW,
    ALPACA_REVIEW_BADGES,
    BIG_IDEA_ROUTE_PRESETS,
    PATH_OPTIONS,
    LENS_OPTIONS,
    MODE_OPTIONS,
    TRAIN_TIPS,
    WRITING_PRACTICE_FORMATS,
    WRITING_PHASES,
    BOWL_ROUND_TYPES,
    LEARN_SUBJECT_ROUTES
  });
}());

(function () {
  const pathDefinitions = {
    learn: {
      title: "Learn Path",
      subtitle: "Learning experiences",
      summary: "The campus learning wing hosts Slideshow Lesson, Mind Map, Raw Content, Guide, Alpaca Channel, and Alpacard experiences from the current WSC app.",
      modes: ["slideshow", "mindmap", "rawcontent", "regularguide", "channel", "alpacard"]
    },
    play: {
      title: "Play Path",
      subtitle: "Practice games",
      summary: "The Games Hall hosts the current play modes: Alpacapardy, Alpaca Run, Alpaca Jump, Alpaquiz, and Survivalpaca.",
      modes: ["jeopardy", "run", "jump", "relay", "race"]
    },
    train: {
      title: "Train Path",
      subtitle: "Tournament event training",
      summary: "The Training Center hosts the four WSC event preparation modes: Collaborative Writing, Debate Lab, Scholar's Bowl, and Scholar's Challenge.",
      modes: ["writing", "buildcase", "bowl", "quiz"]
    }
  };

  const modeDefinitions = {
    slideshow: {
      title: "Slideshow Lesson",
      pathId: "learn",
      roomRole: "Lesson projector room",
      summary: "Move through a selected WSC route one stop at a time with lesson-style progression.",
      appReference: "Current app: Learn path, Slideshow Lesson mode.",
      status: "Campus shell connected to the app mode definition."
    },
    mindmap: {
      title: "Mind Map",
      pathId: "learn",
      roomRole: "Concept mapping lab",
      summary: "Explore the theme as a clickable web of subjects, guiding sections, and big ideas.",
      appReference: "Current app: Learn path, Mind Map mode.",
      status: "Campus shell connected to the app mode definition."
    },
    rawcontent: {
      title: "Raw Content",
      pathId: "learn",
      roomRole: "Raw Content Classroom",
      summary: "Read and inspect the direct source content, visual assets, mastery checks, and transfer tables.",
      appReference: "Current app: Learn path, Raw Content mode.",
      status: "Live content bridge active."
    },
    regularguide: {
      title: "Guide",
      pathId: "learn",
      roomRole: "Guiding Library Lounge",
      summary: "Study the generated section guides built from the source-of-truth documents.",
      appReference: "Current app: Learn path, Guide mode.",
      status: "Live guide bridge active."
    },
    channel: {
      title: "Alpaca Channel",
      pathId: "learn",
      roomRole: "Campus cinema",
      summary: "Watch and organize the WSC video/media catalog as a shared theater experience.",
      appReference: "Current app: Learn path, Alpaca Channel mode.",
      status: "Live video catalog bridge active."
    },
    alpacard: {
      title: "Alpacard",
      pathId: "learn",
      roomRole: "Flashcard Museum",
      summary: "Recognize artworks, architecture, places, films, games, and named examples from visual cards.",
      appReference: "Current app: Learn path, Alpacard mode.",
      status: "Live image-card bridge active."
    },
    jeopardy: {
      title: "Alpacapardy",
      pathId: "play",
      roomRole: "Board game hall",
      summary: "A Jeopardy-style team game using chosen WSC categories.",
      appReference: "Current app: Play path, Alpacapardy mode.",
      status: "Room shell ready for launch bridge."
    },
    run: {
      title: "Alpaca Run",
      pathId: "play",
      roomRole: "Road to the Cup track",
      summary: "A route game through Regional, Global, and Tournament of Champions checkpoints.",
      appReference: "Current app: Play path, Alpaca Run mode.",
      status: "Room shell ready for launch bridge."
    },
    jump: {
      title: "Alpaca Jump",
      pathId: "play",
      roomRole: "Obstacle gym",
      summary: "Leap, duck, and answer through an obstacle practice challenge.",
      appReference: "Current app: Play path, Alpaca Jump mode.",
      status: "Room shell ready for launch bridge."
    },
    relay: {
      title: "Alpaquiz",
      pathId: "play",
      roomRole: "Buzz-first relay room",
      summary: "A team quiz mode built around buzzing first and answering under pressure.",
      appReference: "Current app: Play path, Alpaquiz mode.",
      status: "Room shell ready for launch bridge."
    },
    race: {
      title: "Survivalpaca",
      pathId: "play",
      roomRole: "Sudden-death arena",
      summary: "Outrun the clock and survive question pressure with limited lives.",
      appReference: "Current app: Play path, Survivalpaca mode.",
      status: "Room shell ready for launch bridge."
    },
    writing: {
      title: "Collaborative Writing",
      pathId: "train",
      roomRole: "Writing Studio",
      summary: "Plan, draft, and review a team response around clarity, content, style, and originality.",
      appReference: "Current app: Train path, Collaborative Writing mode.",
      status: "Room shell ready for future event engine."
    },
    buildcase: {
      title: "Debate Lab",
      pathId: "train",
      roomRole: "Case prep lab",
      summary: "Draw a motion, prep PRO or CON, build arguments, rebuttals, and judge notes.",
      appReference: "Current app: Train path, Debate Lab mode.",
      status: "Room shell connected to debate rooms."
    },
    bowl: {
      title: "Scholar's Bowl",
      pathId: "train",
      roomRole: "Stimulus-first media studio",
      summary: "Practice media-first Bowl questions that connect a stimulus to syllabus targets.",
      appReference: "Current app: Train path, Scholar's Bowl mode.",
      status: "Room shell ready for media clue engine."
    },
    quiz: {
      title: "Scholar's Challenge",
      pathId: "train",
      roomRole: "Solo challenge room",
      summary: "Practice Challenge-style pacing, elimination, and multi-bubble strategy.",
      appReference: "Current app: Train path, Scholar's Challenge mode.",
      status: "Room shell ready for Challenge bridge."
    }
  };

  function stripHtml(value) {
    const raw = String(value || "");
    if (!raw) {
      return "";
    }
    if (typeof document === "undefined") {
      return raw.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    }
    const element = document.createElement("div");
    element.innerHTML = raw;
    return element.textContent.replace(/\s+/g, " ").trim();
  }

  function sentenceClip(value, maxLength = 220) {
    const text = String(value || "").replace(/\s+/g, " ").trim();
    if (text.length <= maxLength) {
      return text;
    }
    const clipped = text.slice(0, maxLength);
    const sentenceEnd = Math.max(clipped.lastIndexOf("."), clipped.lastIndexOf("?"), clipped.lastIndexOf("!"));
    return `${clipped.slice(0, sentenceEnd > 80 ? sentenceEnd + 1 : maxLength).trim()}...`;
  }

  function getRuntimeData() {
    return window.WSC_DATA || {};
  }

  function getKnowledgeBank() {
    return window.WSC_KNOWLEDGE_BANK || {};
  }

  function getRawContentBank() {
    return window.WSC_RAW_CONTENT_BANK || {};
  }

  function getSubjects() {
    return Array.isArray(getRuntimeData().subjects) ? getRuntimeData().subjects : [];
  }

  function getSections() {
    return Array.isArray(getRuntimeData().sections) ? getRuntimeData().sections : [];
  }

  function getKnowledgeSections() {
    return Array.isArray(getKnowledgeBank().sections) ? getKnowledgeBank().sections : [];
  }

  function getRegularGuides() {
    return Array.isArray(getRawContentBank().regularGuides) ? getRawContentBank().regularGuides : [];
  }

  function getFirstKnowledgeAtom() {
    const firstSection = getKnowledgeSections()[0];
    return Array.isArray(firstSection?.content_atoms) ? firstSection.content_atoms[0] : null;
  }

  function getFirstGuide() {
    return getRegularGuides()[0] || null;
  }

  function getAlpacards() {
    return Array.isArray(window.WSC_ALPACARDS) ? window.WSC_ALPACARDS : [];
  }

  function getAlpacaChannelVideos() {
    return Array.isArray(window.WSC_ALPACA_CHANNEL?.videos) ? window.WSC_ALPACA_CHANNEL.videos : [];
  }

  function toCampusAssetUrl(path) {
    const value = String(path || "").trim();
    if (!value) {
      return "";
    }
    if (/^(https?:|data:|blob:|file:)/i.test(value)) {
      return value;
    }
    if (value.startsWith("../") || value.startsWith("./")) {
      return value;
    }
    return `../${value.replace(/^\/+/, "")}`;
  }

  function getYoutubeId(url) {
    const value = String(url || "");
    const watch = value.match(/[?&]v=([^&]+)/);
    if (watch?.[1]) {
      return watch[1];
    }
    const short = value.match(/youtu\.be\/([^?&/]+)/);
    if (short?.[1]) {
      return short[1];
    }
    const embed = value.match(/embed\/([^?&/]+)/);
    return embed?.[1] || "";
  }

  function getYoutubeThumbnail(url) {
    const id = getYoutubeId(url);
    return id ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : "";
  }

  function getYoutubeEmbedUrl(url) {
    const id = getYoutubeId(url);
    return id ? `https://www.youtube.com/embed/${id}` : "";
  }

  function getRawSectionsMap() {
    const sections = getRawContentBank().sections;
    return sections && typeof sections === "object" && !Array.isArray(sections) ? sections : {};
  }

  function collectMediaCards(value, list = []) {
    if (!value || typeof value !== "object") {
      return list;
    }
    if (value.src) {
      list.push({
        title: value.title || value.label || "WSC visual",
        summary: sentenceClip(value.note || value.caption || value.imageGuidance || "", 150),
        imageSrc: toCampusAssetUrl(value.src),
        rawSrc: value.src
      });
    }
    if (Array.isArray(value)) {
      value.forEach((item) => collectMediaCards(item, list));
      return list;
    }
    Object.keys(value).forEach((key) => collectMediaCards(value[key], list));
    return list;
  }

  function getRawSectionForGuide(index) {
    const guide = getRegularGuides()[index];
    const sections = getRawSectionsMap();
    return sections[guide?.id] || sections[guide?.sectionId] || Object.values(sections)[index] || null;
  }

  function getRawMediaCards(limit = 12) {
    const sections = Object.values(getRawSectionsMap());
    const cards = [];
    sections.forEach((section) => {
      (section.entries || []).forEach((entry) => collectMediaCards(entry, cards));
    });
    return cards.slice(0, limit);
  }

  function getRawEntries() {
    return Object.values(getRawSectionsMap()).flatMap((section) => (
      (section.entries || []).map((entry, index) => ({
        ...entry,
        sectionTitle: entry.sectionTitle || section.title || section.guidingSection || "",
        sectionId: entry.sectionId || section.id || "",
        entryIndex: index
      }))
    ));
  }

  function getQuestionSamples(limit = 5, options = {}) {
    const sectionId = options.sectionId || "";
    const entries = getRawEntries().filter((entry) => !sectionId || entry.sectionId === sectionId);
    const entryQuestions = entries.flatMap((entry) => (
      (entry.quizQuestions || []).map((question) => ({
        title: `Level ${question.displayLevel || (Number(question.level) || 1) * 100}: ${entry.title || entry.sectionTitle}`,
        body: `${question.prompt} Correct answer: ${question.correctAnswer}`,
        level: Number(question.level) || 1
      }))
    ));
    const voyageQuestions = (getRawContentBank().fullVoyageQuestions || []).map((question) => ({
      title: `Full Voyage ${question.displayLevel || 400}`,
      body: `${question.prompt} Correct answer: ${question.correctAnswer}`,
      level: Number(question.level) || 4
    }));
    return entryQuestions.concat(voyageQuestions)
      .sort((left, right) => left.level - right.level)
      .slice(0, limit);
  }

  function getWritingPrompts(limit = 4) {
    return getRawEntries()
      .filter((entry) => entry.debateRelevance || entry.whyItMatters || entry.takeaway)
      .slice(0, limit)
      .map((entry) => ({
        title: entry.title || entry.sectionTitle || "Writing prompt",
        body: sentenceClip(entry.debateRelevance || entry.whyItMatters || entry.takeaway, 210)
      }));
  }

  function getDebateMotions(limit = 5) {
    const topics = Array.isArray(window.WSC_DEBATE_LAB_DATA?.topics) ? window.WSC_DEBATE_LAB_DATA.topics : [];
    return topics.slice(0, limit).map((topic) => ({
      title: topic.motion,
      body: sentenceClip([
        topic.coreIssue,
        topic.clashCard?.proMustProve,
        topic.clashCard?.conMustProve
      ].filter(Boolean).join(" "), 260)
    }));
  }

  function getBowlStimuli(limit = 6) {
    return [
      {
        title: "Endless airport corridor",
        summary: "A Bowl stimulus about liminal movement, waiting, borders, and non-arrival.",
        imageSrc: toCampusAssetUrl("assets/scholars-bowl/stimuli/airport-limbo.svg")
      },
      {
        title: "Rankings, maps, graphs, and comments",
        summary: "A stimulus that turns progress measurement into a visible argument.",
        imageSrc: toCampusAssetUrl("assets/scholars-bowl/stimuli/ranking-storm.svg")
      },
      {
        title: "Prototype demo",
        summary: "A stimulus about drafts, hidden labor, and unfinished futures.",
        imageSrc: toCampusAssetUrl("assets/scholars-bowl/stimuli/prototype-demo.svg")
      },
      {
        title: "Two homes on one split screen",
        summary: "A stimulus about home, migration, memory, and belonging.",
        imageSrc: toCampusAssetUrl("assets/scholars-bowl/stimuli/home-split-screen.svg")
      },
      {
        title: "Threshold line",
        summary: "A stimulus for point-of-no-return and irreversible decisions.",
        imageSrc: toCampusAssetUrl("assets/scholars-bowl/stimuli/threshold-line.svg")
      },
      {
        title: "Recalculating map",
        summary: "A stimulus about detours, route changes, and whether destination still matters.",
        imageSrc: toCampusAssetUrl("assets/scholars-bowl/stimuli/recalculating-map.svg")
      }
    ].slice(0, limit);
  }

  function getAlpacardWorldCard(index = 0) {
    const card = getAlpacards()[index];
    if (!card) {
      return null;
    }
    return {
      kind: "alpacard",
      title: card.title,
      subtitle: [card.creator, card.year].filter(Boolean).join(" · "),
      summary: sentenceClip(card.notice || card.wscConnection || card.entryTitle, 150),
      imageSrc: toCampusAssetUrl(card.imagePath),
      sourceHref: card.sourceUrl || "",
      data: card
    };
  }

  function getVideoWorldCard(index = 0) {
    const video = getAlpacaChannelVideos()[index];
    if (!video) {
      return null;
    }
    return {
      kind: "video",
      title: video.title,
      subtitle: [video.channel, video.duration].filter(Boolean).join(" · "),
      summary: sentenceClip(video.description || video.contentType || video.verdict, 150),
      imageSrc: getYoutubeThumbnail(video.url || video.videoUrl),
      embedUrl: getYoutubeEmbedUrl(video.url || video.videoUrl),
      sourceHref: video.url || video.videoUrl || "",
      data: video
    };
  }

  function getGuideWorldCard(index = 0) {
    const guide = getRegularGuides()[index];
    const knowledge = getKnowledgeSections()[index];
    const rawSection = getRawSectionForGuide(index);
    const media = collectMediaCards(rawSection || {}).find((item) => item.imageSrc);
    if (!guide && !knowledge) {
      return null;
    }
    return {
      kind: "guide",
      title: guide?.title || knowledge?.guiding_section || `Guide ${index + 1}`,
      subtitle: "Guiding section",
      summary: sentenceClip(knowledge?.section_summary || stripHtml(guide?.htmlContent), 150),
      imageSrc: media?.imageSrc || "",
      data: { guide, knowledge, rawSection }
    };
  }

  function getRawWorldCard(index = 0) {
    const media = getRawMediaCards(index + 1)[index] || getRawMediaCards(1)[0];
    if (!media) {
      return null;
    }
    return {
      kind: "raw-content",
      title: media.title,
      subtitle: "Raw content",
      summary: media.summary,
      imageSrc: media.imageSrc,
      data: media
    };
  }

  function getWorldContentForObject(item = {}) {
    if (item.panel?.startsWith?.("mode-")) {
      const mode = modeDefinitions[item.modeId] || modeDefinitions[item.panel.replace("mode-", "")];
      return mode ? {
        kind: "mode",
        title: mode.title,
        subtitle: `${pathDefinitions[mode.pathId]?.title || "Campus"} · ${mode.roomRole}`,
        summary: mode.summary
      } : null;
    }
    if (item.panel?.startsWith?.("path-")) {
      const pathId = item.pathId || item.panel.replace("path-", "");
      const path = pathDefinitions[pathId];
      return path ? {
        kind: "path",
        title: path.title,
        subtitle: path.subtitle,
        summary: path.summary
      } : null;
    }
    if (item.panel === "flashcards") {
      return getAlpacardWorldCard(Number(item.contentId) || 0);
    }
    if (item.panel === "alpaca-channel") {
      return getVideoWorldCard(Number(item.contentId) || 0);
    }
    if (item.panel === "guide-section") {
      return getGuideWorldCard(Number(item.sectionIndex) || 0);
    }
    if (item.panel === "raw-content") {
      return getRawWorldCard(Number(item.contentId) || 0);
    }
    if (item.panel === "library") {
      return getGuideWorldCard(0);
    }
    return null;
  }

  function getPathPanel(pathId) {
    const path = pathDefinitions[pathId] || pathDefinitions.learn;
    return {
      id: `path-${pathId}`,
      eyebrow: "Campus Wing",
      title: path.title,
      summary: path.summary,
      notes: path.modes.map((modeId) => {
        const mode = modeDefinitions[modeId];
        return `${mode.title}: ${mode.roomRole}`;
      })
    };
  }

  function getModePanelExtras(modeId) {
    if (modeId === "slideshow") {
      return {
        guides: getRegularGuides().slice(0, 4).map((guide) => ({
          id: guide.id,
          title: guide.title,
          href: guide.href || guide.pdfHref || "",
          summary: sentenceClip(stripHtml(guide.htmlContent), 170)
        }))
      };
    }
    if (modeId === "mindmap") {
      return {
        subjects: getSubjects().slice(0, 6).map((subject) => ({
          id: subject.id,
          label: subject.label,
          description: sentenceClip(subject.description, 130),
          color: subject.color
        }))
      };
    }
    if (modeId === "rawcontent") {
      return { mediaCards: getRawMediaCards(6) };
    }
    if (modeId === "regularguide") {
      return {
        guides: getRegularGuides().slice(0, 6).map((guide) => ({
          id: guide.id,
          title: guide.title,
          href: guide.href || guide.pdfHref || "",
          summary: sentenceClip(stripHtml(guide.htmlContent), 170)
        }))
      };
    }
    if (modeId === "channel") {
      const panel = getChannelPanel({ contentId: 0 });
      return {
        featuredVideo: panel.featuredVideo,
        videos: panel.videos
      };
    }
    if (modeId === "alpacard") {
      const panel = getFlashcardsPanel({ contentId: 0 });
      return {
        featuredImage: panel.featuredImage,
        featuredMeta: panel.featuredMeta,
        alpacards: panel.alpacards
      };
    }
    if (["jeopardy", "jump", "relay", "race", "quiz"].includes(modeId)) {
      return { insights: getQuestionSamples(modeId === "quiz" ? 8 : 5) };
    }
    if (modeId === "run") {
      return {
        insights: [
          { title: "Regional checkpoint", body: "Early route questions can use level 100 and 200 raw-content checks." },
          { title: "Global checkpoint", body: "Middle route questions can use level 300 guide and section-journey checks." },
          { title: "Tournament of Champions checkpoint", body: "Final route questions can use Full Voyage and cross-section prompts." }
        ]
      };
    }
    if (modeId === "writing") {
      return { insights: getWritingPrompts(5) };
    }
    if (modeId === "buildcase") {
      return { insights: getDebateMotions(5) };
    }
    if (modeId === "bowl") {
      return {
        mediaCards: getBowlStimuli(6),
        insights: getQuestionSamples(3)
      };
    }
    return {};
  }

  function getModePanel(modeId) {
    const mode = modeDefinitions[modeId] || modeDefinitions.slideshow;
    const extras = getModePanelExtras(modeId);
    const notes = [
      mode.roomRole,
      mode.appReference,
      mode.status,
      "Next bridge: launch or embed the existing app mode from this room without replacing the production route."
    ];
    return {
      id: `mode-${modeId}`,
      eyebrow: pathDefinitions[mode.pathId]?.title || "Campus Mode",
      title: mode.title,
      summary: mode.summary,
      ...extras,
      notes: notes.concat(extras.notes || []),
      links: [
        { title: "Open current WSC app", href: "../", summary: "Use the current app path selector for the production version of this mode." }
      ]
    };
  }

  function getSyllabusPanel() {
    const sections = getSections();
    const guides = getRegularGuides();
    return {
      id: "syllabus",
      eyebrow: "School Club",
      title: "Syllabus Board",
      summary: "A quick campus view of the WSC 2026 theme, subjects, and guiding sections.",
      subjects: getSubjects().map((subject) => ({
        id: subject.id,
        label: subject.label,
        description: sentenceClip(subject.description, 120),
        color: subject.color
      })),
      sections: sections.slice(0, 8).map((section, index) => ({
        id: section.id || guides[index]?.id || `section-${index + 1}`,
        title: section.title || section.label || guides[index]?.title || `Section ${index + 1}`,
        summary: sentenceClip(section.summary || section.description || guides[index]?.htmlContent && stripHtml(guides[index].htmlContent), 150)
      })),
      guides: guides.slice(0, 6).map((guide) => ({
        id: guide.id,
        title: guide.title,
        href: guide.href || guide.pdfHref || "",
        summary: sentenceClip(stripHtml(guide.htmlContent), 150)
      }))
    };
  }

  function getBigIdeasPanel() {
    const atom = getFirstKnowledgeAtom();
    return {
      id: "big-ideas",
      eyebrow: "Quest Board",
      title: "First Big Ideas",
      summary: "Big ideas connect WSC examples across subjects instead of treating them as isolated facts.",
      insights: (getRuntimeData().insights || []).slice(0, 5).map((insight) => ({
        title: insight.title,
        body: sentenceClip(insight.body, 160)
      })),
      firstAtom: atom ? {
        title: atom.subtopic,
        body: sentenceClip(atom.core_idea, 180),
        keywords: Array.isArray(atom.keywords) ? atom.keywords.slice(0, 8) : [],
        examples: Array.isArray(atom.examples) ? atom.examples.slice(0, 4) : []
      } : null
    };
  }

  function getLibraryPanel() {
    const guides = getRegularGuides();
    const knowledge = getKnowledgeSections();
    return {
      id: "library",
      eyebrow: "School Club",
      title: "Library Wall",
      summary: "Existing Learn content is the foundation for future campus missions.",
      guides: guides.slice(0, 7).map((guide) => ({
        id: guide.id,
        title: guide.title,
        href: guide.href || guide.pdfHref || "",
        summary: sentenceClip(stripHtml(guide.htmlContent), 180)
      })),
      atoms: knowledge.slice(0, 4).map((section) => ({
        title: section.guiding_section,
        summary: sentenceClip(section.section_summary, 170),
        subjects: Array.isArray(section.official_subjects) ? section.official_subjects.slice(0, 4) : []
      }))
    };
  }

  function getMapPanel() {
    const roomApi = window.WSC_ALPACA_CAMPUS_ROOMS;
    const rooms = roomApi?.rooms || [];
    const roomById = Object.fromEntries(rooms.map((room) => [room.id, room]));
    const describeRoom = (room) => {
      const doorLabels = (room?.portals || []).map((portal) => portal.label).filter(Boolean);
      return doorLabels.length ? `Doors: ${doorLabels.join(", ")}` : (room?.subtitle || "Campus room");
    };
    const toRoomItem = (roomId) => {
      const room = roomById[roomId];
      if (!room) return null;
      return {
        id: room.id,
        title: room.title,
        status: room.id === "grand-amphitheater" ? "Shell" : "Open",
        description: describeRoom(room)
      };
    };
    const groups = [
      {
        title: "Lobby Landmarks",
        summary: "Public rooms connected directly to the School Lobby.",
        roomIds: ["campus-courtyard", "school-lobby", "guiding-library-lounge", "alpaca-channel-cinema", "grand-amphitheater"]
      },
      {
        title: "Learn Wing",
        summary: "Learning Commons connects to the internal Learn rooms, with side doors between learning spaces.",
        roomIds: ["learning-commons", "slideshow-studio", "mind-map-lab", "flashcard-museum", "raw-content-classroom"]
      },
      {
        title: "Play Wing",
        summary: "Games Hall connects to all Play rooms, with extra side doors between game spaces.",
        roomIds: ["games-hall", "alpacapardy-hall", "alpaca-run-track", "alpaca-jump-gym", "alpaquiz-relay-room", "survivalpaca-arena"]
      },
      {
        title: "Training Bridge",
        summary: "Training Center sits between Learn and Play and connects to the Train rooms.",
        roomIds: ["training-center", "writing-studio", "scholars-bowl-studio", "scholars-challenge-room", "debate-lab", "debate-room-1", "debate-room-2", "debate-room-3"]
      }
    ].map((group) => ({
      ...group,
      rooms: group.roomIds.map(toRoomItem).filter(Boolean)
    }));

    return {
      id: "map",
      eyebrow: "Campus Map",
      title: "Campus Doors",
      summary: "Doors are grouped by campus wing. Live presence and chat stay scoped to the room you are in.",
      roomGroups: groups
    };
  }

  function getInfoPanel() {
    return {
      id: "info",
      eyebrow: "Information Desk",
      title: "Campus Updates",
      summary: "The Information Alpaca keeps campus notices and useful WSC links.",
      notes: [
        "Alpaca Campus is open for live room testing.",
        "Rooms are being connected to existing Learn content step by step.",
        "Official WSC link area is ready for final links and announcements."
      ],
      links: [
        { title: "World Scholar's Cup", href: "https://www.scholarscup.org/", summary: "Official website" }
      ]
    };
  }

  function getFlashcardsPanel(context = {}) {
    const start = Number(context.contentId) || 0;
    const featured = getAlpacardWorldCard(start);
    const cards = getAlpacards().slice(start, start + 1);
    return {
      id: "flashcards",
      eyebrow: "Flashcard Museum",
      title: featured?.title || `Alpacard Exhibit ${start + 1}`,
      summary: featured?.summary || (cards.length ? "Existing alpacard connected to this library frame." : "Flashcard exhibit placeholder ready for existing alpacard data."),
      featuredImage: featured?.imageSrc || "",
      featuredMeta: featured?.subtitle || "",
      sourceHref: featured?.sourceHref || "",
      alpacards: cards.map((card) => ({
        id: card.id,
        title: card.title,
        summary: sentenceClip(card.notice || card.wscConnection || card.entryTitle, 170),
        meta: [card.creator, card.year, card.category].filter(Boolean).join(" · "),
        imageSrc: toCampusAssetUrl(card.imagePath),
        href: card.sourceUrl || ""
      }))
    };
  }

  function getChannelPanel(context = {}) {
    const start = Number(context.contentId) || 0;
    const featured = getVideoWorldCard(start);
    const videos = getAlpacaChannelVideos().slice(0, 6);
    return {
      id: "alpaca-channel",
      eyebrow: "Cinema",
      title: featured?.title || "Alpaca Channel",
      summary: featured?.summary || "Video/media learning room shell, ready for deeper video selection and Bowl-style media clues.",
      featuredVideo: featured || null,
      videos: videos.map((video, index) => ({
        id: video.id,
        contentId: index,
        title: video.title,
        summary: sentenceClip(video.description || video.wscConnection || video.contentType, 160),
        imageSrc: getYoutubeThumbnail(video.url || video.videoUrl),
        embedUrl: getYoutubeEmbedUrl(video.url || video.videoUrl),
        href: video.url || video.videoUrl || ""
      }))
    };
  }

  function getRawContentPanel() {
    const guides = getRegularGuides().slice(0, 5);
    const mediaCards = getRawMediaCards(8);
    return {
      id: "raw-content",
      eyebrow: "Classroom",
      title: "Raw Content Reader",
      summary: "A classroom reader bridge to existing raw content and guide documents.",
      mediaCards,
      guides: guides.map((guide) => ({
        id: guide.id,
        title: guide.title,
        href: guide.href || guide.pdfHref || "",
        summary: sentenceClip(stripHtml(guide.htmlContent), 180)
      }))
    };
  }

  function getGuideSectionPanel(context = {}) {
    const index = Number.isFinite(Number(context.sectionIndex)) ? Number(context.sectionIndex) : 0;
    const guide = getRegularGuides()[index];
    const knowledge = getKnowledgeSections()[index];
    const worldCard = getGuideWorldCard(index);
    return {
      id: "guide-section",
      eyebrow: "Library",
      title: guide?.title || knowledge?.guiding_section || `Guide ${index + 1}`,
      summary: sentenceClip(knowledge?.section_summary || stripHtml(guide?.htmlContent), 220),
      featuredImage: worldCard?.imageSrc || "",
      featuredMeta: worldCard?.subtitle || "",
      htmlContent: guide?.htmlContent || "",
      guides: guide ? [{
        id: guide.id,
        title: guide.title,
        href: guide.href || guide.pdfHref || "",
        summary: sentenceClip(stripHtml(guide.htmlContent), 180)
      }] : [],
      atoms: knowledge?.content_atoms?.slice(0, 4).map((atom) => ({
        title: atom.subtopic,
        summary: sentenceClip(atom.core_idea, 160),
        subjects: atom.keywords || []
      })) || []
    };
  }

  function getCourtyardPanel() {
    return {
      id: "courtyard",
      eyebrow: "Courtyard",
      title: "Gathering Area",
      summary: "A social arrival space for chatting, meeting, kicking the ball, and heading into the school.",
      notes: [
        "The school entrance leads to the main lobby.",
        "The court ball is a simple live social object.",
        "The six swings support visible sitting and swinging."
      ]
    };
  }

  function getAmphitheaterPanel() {
    return {
      id: "amphitheater",
      eyebrow: "Grand Amphitheater",
      title: "Coming Soon",
      summary: "The amphitheater shell is ready for Scholar's Ball, major events, and tournament content.",
      notes: ["Stage, screen, and seating are live as a room shell.", "Event programming is reserved for a later pass."]
    };
  }

  function getDebatePanel() {
    return {
      id: "debate",
      eyebrow: "Debate Room",
      title: "Judge Desk",
      summary: "Debate room shell ready for future topics, pro/con prep, rebuttals, and judge feedback.",
      notes: ["Six debate seats are available.", "Seat occupancy is visible to users in the same room.", "The judge is fixed for now."]
    };
  }

  function getCoachPanel() {
    return {
      id: "coach",
      eyebrow: "Coach Alpaca",
      title: "Welcome to School Club",
      summary: "School Club is the first live stop on the Road to the Cup.",
      notes: [
        "Coach, Syllabus Board, and Big Ideas Board are ready.",
        "Challenge, Bowl, Debate, and Writing are marked as future rooms.",
        "Your look, XP, and quest progress follow your alpaca."
      ]
    };
  }

  function getPanel(panelId, context = {}) {
    if (panelId === "syllabus") return getSyllabusPanel();
    if (panelId === "big-ideas") return getBigIdeasPanel();
    if (panelId === "library") return getLibraryPanel();
    if (panelId === "map") return getMapPanel();
    if (panelId?.startsWith?.("path-")) return getPathPanel(panelId.replace("path-", ""));
    if (panelId?.startsWith?.("mode-")) return getModePanel(panelId.replace("mode-", ""));
    if (panelId === "info") return getInfoPanel();
    if (panelId === "flashcards") return getFlashcardsPanel(context);
    if (panelId === "alpaca-channel") return getChannelPanel(context);
    if (panelId === "raw-content") return getRawContentPanel();
    if (panelId === "guide-section") return getGuideSectionPanel(context);
    if (panelId === "courtyard") return getCourtyardPanel();
    if (panelId === "amphitheater") return getAmphitheaterPanel();
    if (panelId === "debate") return getDebatePanel();
    if (panelId === "challenge-door") {
      return {
        ...getMapPanel(),
        id: "challenge-door",
        eyebrow: "Future Room",
        title: "Challenge Room",
        summary: "The Challenge Room is locked for now. The door is already placed for the next campus expansion."
      };
    }
    return getInfoPanel();
  }

  window.WSC_ALPACA_CAMPUS_CONTENT = Object.freeze({
    stripHtml,
    sentenceClip,
    getSubjects,
    getSections,
    getRegularGuides,
    getKnowledgeSections,
    getAlpacards,
    getAlpacaChannelVideos,
    toCampusAssetUrl,
    getYoutubeId,
    getYoutubeThumbnail,
    getYoutubeEmbedUrl,
    getRawMediaCards,
    getQuestionSamples,
    getDebateMotions,
    getBowlStimuli,
    getWorldContentForObject,
    pathDefinitions,
    modeDefinitions,
    getPanel
  });
}());

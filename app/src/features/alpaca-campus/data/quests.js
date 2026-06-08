(function () {
  const questStates = Object.freeze({
    locked: "locked",
    available: "available",
    inProgress: "in_progress",
    completed: "completed"
  });

  const quests = [
    {
      id: "meet-the-coach",
      roomId: "school-lobby",
      title: "Meet the Coach",
      giverId: "coach-alpaca",
      markerObjectIds: ["coach-alpaca"],
      requirements: [],
      rewards: {
        xp: 50,
        unlocks: ["syllabus-board"],
        titleId: "school-club-alpaca"
      },
      prompt: "What is the main purpose of Alpaca Campus?",
      options: [
        {
          id: "train-live",
          text: "To turn WSC preparation into a live training journey.",
          correct: true
        },
        {
          id: "replace-study",
          text: "To replace studying with random games.",
          correct: false
        },
        {
          id: "easy-questions",
          text: "To make every question easier.",
          correct: false
        }
      ],
      dialogue: [
        "Welcome to School Club. You are not here to memorize everything.",
        "You are here to learn how scholars connect examples, sections, subjects, and ideas."
      ]
    },
    {
      id: "explore-the-syllabus-board",
      roomId: "school-lobby",
      title: "Explore the Syllabus Board",
      giverId: "syllabus-board",
      markerObjectIds: ["syllabus-board"],
      requirements: ["meet-the-coach"],
      rewards: {
        xp: 75,
        unlocks: ["library-wall"],
        titleId: "knowledge-explorer"
      },
      prompt: "What should the Syllabus Board help you notice first?",
      options: [
        {
          id: "subjects-and-sections",
          text: "How subjects and guiding sections connect across the theme.",
          correct: true
        },
        {
          id: "one-page-only",
          text: "Only one page of content at a time.",
          correct: false
        },
        {
          id: "scores-only",
          text: "Only your final score.",
          correct: false
        }
      ],
      dialogue: [
        "The board is the campus map for knowledge.",
        "Every room should eventually point back to the real WSC material you already have."
      ]
    },
    {
      id: "find-the-first-big-idea",
      roomId: "school-lobby",
      title: "Find the First Big Idea",
      giverId: "big-ideas-board",
      markerObjectIds: ["big-ideas-board"],
      requirements: ["explore-the-syllabus-board"],
      rewards: {
        xp: 100,
        unlocks: ["challenge-door-almost"],
        titleId: "big-idea-hunter"
      },
      prompt: "Which shared logic fits many early WSC examples?",
      options: [
        {
          id: "arrival-is-contested",
          text: "Arrival is not only a place; it can be measured, felt, delayed, or declared.",
          correct: true
        },
        {
          id: "travel-is-simple",
          text: "Travel is always a simple line from start to finish.",
          correct: false
        },
        {
          id: "endings-are-obvious",
          text: "Endings are always obvious once they happen.",
          correct: false
        }
      ],
      dialogue: [
        "Big ideas are bridges. They help one example explain another.",
        "This is where WSC gets interesting: the same pressure can appear in art, history, science, media, and debate."
      ]
    }
  ];

  const questById = Object.fromEntries(quests.map((quest) => [quest.id, quest]));

  function getQuest(questId) {
    return questById[questId] || null;
  }

  function getQuestState(questId, savedProgress = {}) {
    const quest = getQuest(questId);
    if (!quest) {
      return questStates.locked;
    }

    const saved = savedProgress[questId]?.status;
    if (saved === questStates.completed || saved === questStates.inProgress) {
      return saved;
    }

    const unlocked = (quest.requirements || []).every((requiredId) => (
      savedProgress[requiredId]?.status === questStates.completed
    ));

    return unlocked ? questStates.available : questStates.locked;
  }

  function getQuestListWithState(savedProgress = {}) {
    return quests.map((quest) => ({
      ...quest,
      state: getQuestState(quest.id, savedProgress)
    }));
  }

  function getCompletedQuestIds(savedProgress = {}) {
    return quests
      .filter((quest) => savedProgress[quest.id]?.status === questStates.completed)
      .map((quest) => quest.id);
  }

  window.WSC_ALPACA_CAMPUS_QUESTS = Object.freeze({
    questStates,
    quests,
    questById,
    getQuest,
    getQuestState,
    getQuestListWithState,
    getCompletedQuestIds
  });
}());

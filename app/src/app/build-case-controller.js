(function initBuildCaseController(global) {
  "use strict";

  function requiredFunction(collection, name) {
    const value = collection ? collection[name] : null;
    if (typeof value !== "function") {
      throw new Error("WSC Build Case controller missing function dependency: " + name);
    }
    return value;
  }

  function createBuildCaseController(options = {}) {
    const {
      appState: state,
      windowRef = global,
      data = {},
      constants = {},
      helpers = {},
      callbacks = {}
    } = options;

    if (!state) {
      throw new Error("WSC Build Case controller missing app state.");
    }

    const debateLabData = data.debateLabData || { topics: [], judgePrep: [], howToUse: [] };
    const sectionById = data.sectionById || {};
    const buildCaseRoundCount = Number(constants.buildCaseRoundCount) || 5;

    const escapeHtml = requiredFunction(helpers, "escapeHtml");
    const getAssetValue = requiredFunction(helpers, "getAssetValue");
    const getBestStreakFromAnswers = requiredFunction(helpers, "getBestStreakFromAnswers");
    const getBigIdeaIdsFromLabels = requiredFunction(helpers, "getBigIdeaIdsFromLabels");
    const getBroadSubjectIdsFromLabels = requiredFunction(helpers, "getBroadSubjectIdsFromLabels");
    const getOrderedSectionIds = requiredFunction(helpers, "getOrderedSectionIds");
    const getRawEntriesForSelection = requiredFunction(helpers, "getRawEntriesForSelection");
    const getSectionIdFromGuidingTitle = requiredFunction(helpers, "getSectionIdFromGuidingTitle");
    const getSelectedSectionIds = requiredFunction(helpers, "getSelectedSectionIds");
    const getTargetLabel = requiredFunction(helpers, "getTargetLabel");
    const renderAssetImage = requiredFunction(helpers, "renderAssetImage");
    const renderGameQuestionPopup = requiredFunction(helpers, "renderGameQuestionPopup");
    const renderPanelTitle = requiredFunction(helpers, "renderPanelTitle");
    const shortenTrainText = requiredFunction(helpers, "shortenTrainText");
    const shuffle = requiredFunction(helpers, "shuffle");
    const slugifyBigIdea = requiredFunction(helpers, "slugifyBigIdea");

    const finalizeSessionStats = requiredFunction(callbacks, "finalizeSessionStats");
    const renderExperience = requiredFunction(callbacks, "renderExperience");
    const renderExperiencePreservingScroll = requiredFunction(callbacks, "renderExperiencePreservingScroll");

    let debateSpinTimerId = null;
    let debateRevealTimerId = null;

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

    function clearSpinTimer() {
      if (debateSpinTimerId) {
        windowRef.clearTimeout(debateSpinTimerId);
        debateSpinTimerId = null;
      }
    }

    function clearRevealTimer() {
      if (debateRevealTimerId) {
        windowRef.clearTimeout(debateRevealTimerId);
        debateRevealTimerId = null;
      }
    }

    function buildLegacyPrompt(entry) {
      const officialQuestion = splitArgumentFragments(entry.rawOfficialText)
        .find((fragment) => fragment.includes("?"));

      if (officialQuestion) {
        return officialQuestion;
      }

      return `Build a case around this stop: ${entry.title}.`;
    }

    function buildLegacyRounds() {
      const entries = shuffle(
        getRawEntriesForSelection().filter((entry) => entry.debateRelevance && entry.counterargument)
      ).slice(0, buildCaseRoundCount);

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
          prompt: buildLegacyPrompt(entry),
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

    function getTopicsForSelection() {
      const allTopics = Array.isArray(debateLabData.topics) ? debateLabData.topics : [];
      const selectedIds = getSelectedSectionIds();

      if (!selectedIds.length || selectedIds.length === getOrderedSectionIds().length) {
        return allTopics.slice();
      }

      const selected = new Set(selectedIds);
      const filtered = allTopics.filter((topic) => selected.has(topic.sectionId));
      return filtered.length ? filtered : allTopics.slice();
    }

    function buildTopicOrder(topics, previousTopicId = null) {
      const order = shuffle(topics.map((topic) => topic.id));
      if (order.length > 1 && previousTopicId && order[0] === previousTopicId) {
        const swapIndex = order.findIndex((id) => id !== previousTopicId);
        if (swapIndex > 0) {
          [order[0], order[swapIndex]] = [order[swapIndex], order[0]];
        }
      }
      return order;
    }

    function buildExperience() {
      const topics = getTopicsForSelection();
      const unavailableReason = topics.length
        ? null
        : "The Debate Lab workbook did not load any motions yet.";

      return {
        type: "buildcase",
        title: "Debate Lab",
        topics,
        topicOrder: buildTopicOrder(topics),
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

    function getLegacyRound(experience) {
      return getCurrentTopic(experience);
    }

    function getCurrentTopic(experience = state.experience) {
      if (!experience || experience.type !== "buildcase") {
        return null;
      }

      const currentId = Array.isArray(experience.topicOrder) ? experience.topicOrder[experience.index] : null;
      return (experience.topics || []).find((topic) => topic.id === currentId) || (experience.topics || [])[0] || null;
    }

    function resetSpinState(experience) {
      if (!experience) {
        return;
      }

      clearSpinTimer();
      clearRevealTimer();
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

    function showNextTopic() {
      const experience = state.experience;
      if (!experience || experience.type !== "buildcase" || !experience.topics?.length) {
        return;
      }

      const previousTopic = getCurrentTopic(experience);
      if (!experience.topicOrder?.length) {
        experience.topicOrder = buildTopicOrder(experience.topics, previousTopic?.id);
        experience.index = 0;
      } else if (experience.index >= experience.topicOrder.length - 1) {
        experience.topicOrder = buildTopicOrder(experience.topics, previousTopic?.id);
        experience.index = 0;
      } else {
        experience.index += 1;
      }

      resetSpinState(experience);
      renderExperience();
    }

    function openSideSpinner() {
      const experience = state.experience;
      if (!experience || experience.type !== "buildcase" || !getCurrentTopic(experience)) {
        return;
      }

      resetSpinForCurrentTopic();
      renderExperience();
    }

    function toggleSideSpin() {
      const experience = state.experience;
      if (!experience || experience.type !== "buildcase" || experience.phase !== "topic") {
        return;
      }

      if (experience.spinStatus === "spinning") {
        stopSideSpin();
        return;
      }

      if (experience.spinStatus === "idle" || experience.spinStatus === "stopped") {
        clearSpinTimer();
        clearRevealTimer();
        experience.selectedSide = null;
        experience.spinOutcome = null;
        experience.spinStatus = "spinning";
        experience.spinTargetAngle = 0;
        renderExperience();
      }
    }

    function stopSideSpin() {
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
      clearSpinTimer();
      debateSpinTimerId = windowRef.setTimeout(() => {
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

    function returnToTopic() {
      const experience = state.experience;
      if (!experience || experience.type !== "buildcase") {
        return;
      }

      resetSpinState(experience);
      renderExperience();
    }

    function resetSpinForCurrentTopic() {
      const experience = state.experience;
      if (!experience || experience.type !== "buildcase") {
        return;
      }

      clearSpinTimer();
      clearRevealTimer();
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

    function startConversation() {
      const experience = state.experience;
      if (!experience || experience.type !== "buildcase") {
        return;
      }

      if (!experience.selectedSide) {
        toggleSideSpin();
        return;
      }

      clearSpinTimer();
      clearRevealTimer();
      experience.phase = "debate";
      experience.debateRound = 0;
      experience.debateRounds = [];
      experience.winner = null;
      experience.feedback = null;
      experience.finished = false;
      ensureRoundState(experience);
      beginNpcOpeningIfNeeded(experience);
      renderExperience();
    }

    function getItemQualityScore(item) {
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

    function getItemQualityLabel(item) {
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

    function toArgumentItem(argument, side) {
      return {
        id: argument.id,
        kind: "argument",
        side,
        qualityKey: argument.qualityKey,
        label: getItemQualityLabel(argument),
        title: argument.argument,
        body: argument.judgeScoringMove || argument.evidenceHook || argument.sameSideDefense || argument.useWarning || "",
        source: argument.suggestedSpeakerRole || "",
        score: getItemQualityScore(argument)
      };
    }

    function toConnectionItem(connection, topic, index) {
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

    function getArgumentsByQuality(topic, side, qualityKey) {
      return (topic.arguments?.[side] || []).filter((item) => item.qualityKey === qualityKey);
    }

    function getOtherArguments(topic, side) {
      return (topic.arguments?.[side] || []).filter((item) => !["strong", "medium"].includes(item.qualityKey));
    }

    function pickItems(items, count, roundIndex, usedIds = new Set()) {
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

    function getUsedSuggestionIds(experience) {
      return new Set((experience.debateRounds || []).flatMap((round) => [
        ...(round.userSelections || []),
        ...(round.npcSelections || []),
        ...(round.suggestions || []).map((item) => item.id)
      ]));
    }

    function buildSuggestions(topic, side, roundIndex, experience) {
      const usedIds = getUsedSuggestionIds(experience);
      const strong = pickItems(
        getArgumentsByQuality(topic, side, "strong").map((item) => toArgumentItem(item, side)),
        2,
        roundIndex,
        usedIds
      );
      strong.forEach((item) => usedIds.add(item.id));

      const medium = pickItems(
        getArgumentsByQuality(topic, side, "medium").map((item) => toArgumentItem(item, side)),
        1,
        roundIndex,
        usedIds
      );
      medium.forEach((item) => usedIds.add(item.id));

      const other = pickItems(
        getOtherArguments(topic, side).map((item) => toArgumentItem(item, side)),
        1,
        roundIndex,
        usedIds
      );
      other.forEach((item) => usedIds.add(item.id));

      const connections = pickItems(
        (topic.connections || []).map((connection, index) => toConnectionItem(connection, topic, index)),
        2,
        roundIndex,
        usedIds
      );

      return shuffle([...strong, ...medium, ...other, ...connections]).slice(0, 6);
    }

    function ensureRoundState(experience = state.experience) {
      if (!experience || experience.type !== "buildcase") {
        return null;
      }

      const topic = getCurrentTopic(experience);
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
          suggestions: buildSuggestions(topic, experience.selectedSide || "pro", roundIndex, experience),
          userSelections: [],
          npcSelections: [],
          revealedNpcCount: 0,
          submitted: false,
          complete: false
        };
      }

      return experience.debateRounds[roundIndex];
    }

    function isUserTurnOpen(round, experience) {
      if (!round || !experience || round.submitted || experience.finished) {
        return false;
      }

      if (experience.selectedSide === "con") {
        return Boolean(round.npcOpeningComplete);
      }

      return true;
    }

    function toggleSuggestion(itemId) {
      const experience = state.experience;
      const round = ensureRoundState(experience);
      if (!experience || !round || !isUserTurnOpen(round, experience)) {
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

    function buildNpcSelections(topic, npcSide, userItems, experience) {
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
            ? getOtherArguments(topic, npcSide)
            : getArgumentsByQuality(topic, npcSide, group);
          const candidate = rawItems
            .map((item) => toArgumentItem(item, npcSide))
            .find((item) => !usedIds.has(item.id) && !selected.some((selectedItem) => selectedItem.id === item.id));
          if (candidate) {
            selected.push(candidate);
            usedIds.add(candidate.id);
            break;
          }
        }
      });

      if (!selected.length) {
        selected.push(...pickItems(
          getArgumentsByQuality(topic, npcSide, "strong").map((item) => toArgumentItem(item, npcSide)),
          1,
          Number(experience.debateRound) || 0,
          usedIds
        ));
      }

      return selected.slice(0, Math.max(1, userItems.length));
    }

    function buildNpcOpeningSelections(topic, npcSide, experience) {
      const usedIds = new Set((experience.debateRounds || []).flatMap((round) => round.npcSelections || []));
      const roundIndex = Number(experience.debateRound) || 0;
      const strong = pickItems(
        getArgumentsByQuality(topic, npcSide, "strong").map((item) => toArgumentItem(item, npcSide)),
        2,
        roundIndex,
        usedIds
      );
      strong.forEach((item) => usedIds.add(item.id));
      const medium = pickItems(
        getArgumentsByQuality(topic, npcSide, "medium").map((item) => toArgumentItem(item, npcSide)),
        1,
        roundIndex,
        usedIds
      );
      const selected = [...strong, ...medium];
      if (selected.length < 3) {
        selected.push(...pickItems(
          getOtherArguments(topic, npcSide).map((item) => toArgumentItem(item, npcSide)),
          3 - selected.length,
          roundIndex,
          usedIds
        ));
      }
      return selected.slice(0, 3);
    }

    function beginNpcOpeningIfNeeded(experience = state.experience) {
      const round = ensureRoundState(experience);
      const topic = getCurrentTopic(experience);
      if (!experience || !round || !topic || experience.selectedSide !== "con" || round.npcOpeningStarted) {
        return;
      }

      const npcSide = "pro";
      const npcItems = buildNpcOpeningSelections(topic, npcSide, experience);
      round.npcItems = npcItems;
      round.npcSelections = npcItems.map((item) => item.id);
      round.revealedNpcCount = 0;
      round.npcOpeningStarted = true;
      round.npcOpeningComplete = false;
      round.complete = false;
      scheduleNextNpcReveal();
    }

    function scheduleNextNpcReveal() {
      clearRevealTimer();
      const experience = state.experience;
      const round = ensureRoundState(experience);
      if (!experience || !round || round.complete || !(round.npcSelections || []).length) {
        return;
      }

      if (round.revealedNpcCount >= (round.npcSelections || []).length) {
        if (experience.selectedSide === "con" && !round.submitted) {
          round.npcOpeningComplete = true;
        } else {
          round.complete = true;
          if (experience.debateRound >= 2) {
            finalizeConversation();
          }
        }
        renderExperiencePreservingScroll();
        return;
      }

      debateRevealTimerId = windowRef.setTimeout(() => {
        const current = state.experience;
        const currentRound = ensureRoundState(current);
        if (!current || !currentRound || current.phase !== "debate" || currentRound.complete) {
          return;
        }

        currentRound.revealedNpcCount += 1;
        debateRevealTimerId = null;
        renderExperiencePreservingScroll();
        scheduleNextNpcReveal();
      }, 2000);
    }

    function submitRound() {
      const experience = state.experience;
      const round = ensureRoundState(experience);
      const topic = getCurrentTopic(experience);
      if (
        !experience ||
        !round ||
        !topic ||
        !isUserTurnOpen(round, experience) ||
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
          finalizeConversation();
        }
        renderExperiencePreservingScroll();
        return;
      }

      const npcSide = "con";
      const npcItems = buildNpcSelections(topic, npcSide, userItems, experience);
      round.npcItems = npcItems;
      round.npcSelections = npcItems.map((item) => item.id);
      round.revealedNpcCount = 0;
      round.complete = false;
      renderExperiencePreservingScroll();
      scheduleNextNpcReveal();
    }

    function advanceRound() {
      const experience = state.experience;
      const round = ensureRoundState(experience);
      if (!experience || !round || !round.complete) {
        return;
      }

      if (experience.debateRound >= 2) {
        finalizeConversation();
      } else {
        experience.debateRound += 1;
        ensureRoundState(experience);
        beginNpcOpeningIfNeeded(experience);
      }
      renderExperiencePreservingScroll();
    }

    function getRoundScore(items = []) {
      return items.reduce((sum, item) => sum + getItemQualityScore(item), 0);
    }

    function getChoiceJustification(item) {
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

    function getDisplayTitle(item) {
      const rawTitle = String(item?.title || "");
      const badGoodMatch = rawTitle.match(/^Bad-good\s+(?:PRO|CON):\s*[\u201c"]([^\u201d"]+)[\u201d"]\s*Why weak:\s*(.+)$/i);
      if (badGoodMatch) {
        return badGoodMatch[1];
      }

      return rawTitle.replace(/^Bad-good\s+(?:PRO|CON):\s*/i, "");
    }

    function getDisplayBody(item) {
      if (!item) {
        return "";
      }

      if (String(item.qualityKey || "").startsWith("bad-good")) {
        return "Turn this into a sharper claim with evidence and weighing.";
      }

      return item.body || "";
    }

    function getSideLabel(side) {
      return side === "con" ? "CON" : "PRO";
    }

    function getOpposingSide(side) {
      return side === "con" ? "pro" : "con";
    }

    function finalizeConversation() {
      const experience = state.experience;
      if (!experience || experience.type !== "buildcase") {
        return;
      }

      clearRevealTimer();
      const rounds = (experience.debateRounds || []).filter((round) => round?.submitted);
      const userScore = rounds.reduce((sum, round) => sum + getRoundScore(round.userItems || []), 0);
      const npcScore = rounds.reduce((sum, round) => sum + getRoundScore(round.npcItems || []), 0);
      const winner = userScore > npcScore ? "user" : "npg";
      const userSide = getSideLabel(experience.selectedSide);
      const npcSide = getSideLabel(getOpposingSide(experience.selectedSide));
      const selectedWeakRows = rounds.flatMap((round) => round.userItems || []).filter((item) => getItemQualityScore(item) < 3);

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

    function getTopicSectionLabel(topic) {
      return sectionById[topic.sectionId]?.title || topic.primaryUnit || "Debate Lab";
    }

    function renderList(items, className = "debate-mini-list") {
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

    function renderSourceLinks(topic) {
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

    function renderTopicCard(topic, experience) {
      return `
    <article class="debate-topic-card debate-topic-card-clean">
      <header class="debate-topic-main">
        <h2>${escapeHtml(topic.motion)}</h2>
        <button class="button secondary" type="button" data-buildcase-next-topic ${experience.topicOrder.length <= 1 ? "disabled" : ""}>Change topic</button>
      </header>
      <div class="debate-topic-spin-zone">
        ${renderSlotMachine(experience)}
      </div>
    </article>
  `;
    }

    function renderSlotMachine(experience) {
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
              ${renderAssetImage(getAssetValue(["debate", side]), `${getSideLabel(side)} side`, "debate-slot-logo-slot", "debate-slot-logo")}
              <strong>${escapeHtml(getSideLabel(side))}</strong>
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

    function renderSideSpinner(topic, experience) {
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
          <span class="meta-pill section">${escapeHtml(getTopicSectionLabel(topic))}</span>
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
          <strong>${outcome ? getSideLabel(outcome) : "?"}</strong>
        </div>
      </div>

      <div class="panel-actions debate-spinner-actions">
        <button class="button secondary" type="button" data-buildcase-back-topic>Back to topic</button>
        <button class="button primary" type="button" data-buildcase-spin-toggle ${buttonDisabled}>${escapeHtml(buttonLabel)}</button>
      </div>
    </article>
  `;
    }

    function renderClashCard(topic, side) {
      const clash = topic.clashCard || {};
      const opponent = getOpposingSide(side);
      const sidePath = side === "con" ? clash.strongestConPath : clash.strongestProPath;
      const opponentPath = opponent === "con" ? clash.strongestConPath : clash.strongestProPath;
      const sideMustProve = side === "con" ? clash.conMustProve : clash.proMustProve;
      const opponentMustProve = opponent === "con" ? clash.conMustProve : clash.proMustProve;

      return `
    <section class="debate-clash-card">
      <div>
        <h3>${escapeHtml(getSideLabel(side))} must prove</h3>
        <p>${escapeHtml(sideMustProve || "Define the motion, prove the mechanism, and weigh why this side wins.")}</p>
      </div>
      <div>
        <h3>${escapeHtml(getSideLabel(opponent))} must prove</h3>
        <p>${escapeHtml(opponentMustProve || "Attack the motion, show the trade-offs, and weigh why this side wins.")}</p>
      </div>
      <div>
        <h3>Definitions to lock</h3>
        <p>${escapeHtml(clash.definitionsToLock || "Lock the key terms, affected stakeholders, scope, and threshold.")}</p>
      </div>
      <div>
        <h3>Your strongest path</h3>
        ${renderList(sidePath)}
      </div>
      <div>
        <h3>Opponent path to expect</h3>
        ${renderList(opponentPath)}
      </div>
    </section>
  `;
    }

    function getArgumentGroups(argumentsForSide) {
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

    function renderArgumentCard(argument) {
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

    function renderArgumentDeck(topic, side, open = false) {
      const argumentsForSide = topic.arguments?.[side] || [];
      const groups = getArgumentGroups(argumentsForSide);

      return `
    <details class="debate-argument-deck" ${open ? "open" : ""}>
      <summary>
        <span>${escapeHtml(getSideLabel(side))} full argument deck</span>
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
              ${group.items.map(renderArgumentCard).join("")}
            </div>
          </details>
        `).join("")}
      </div>
    </details>
  `;
    }

    function renderConnections(topic) {
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

    function renderJudgePrep() {
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

    function renderSpeakerJobs(topic) {
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

    function renderCase(topic, experience) {
      experience.phase = "debate";
      ensureRoundState(experience);
      return renderDebatePage(topic, experience);
    }

    function renderSuggestionCard(item, round, disabled = false) {
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
      <strong>${escapeHtml(getDisplayTitle(item))}</strong>
      ${getDisplayBody(item) ? `<p>${escapeHtml(shortenTrainText(getDisplayBody(item), 170))}</p>` : ""}
    </button>
  `;
    }

    function getRoundSpeakerLabel(roundIndex) {
      return ["First debater", "Second debater", "Third debater"][roundIndex] || `Debater ${roundIndex + 1}`;
    }

    function renderSuggestionPanel(topic, experience) {
      const round = ensureRoundState(experience);
      if (!round) {
        return "";
      }

      const selectedCount = (round.userSelections || []).length;
      const sideLabel = getSideLabel(experience.selectedSide);
      const isFinal = Number(experience.debateRound) >= 2;
      const isUserTurnOpen = isUserTurnOpenForRender(round, experience);

      return `
    <section class="whatspwaap-suggestions">
      <header>
        <p class="challenge-label">${escapeHtml(sideLabel)} suggestions</p>
        <h3>${escapeHtml(getRoundSpeakerLabel(Number(experience.debateRound) || 0))}</h3>
      </header>
      <div class="debate-suggestion-grid">
        ${(round.suggestions || []).map((item) => renderSuggestionCard(item, round, !isUserTurnOpen)).join("")}
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

    function isUserTurnOpenForRender(round, experience) {
      return isUserTurnOpen(round, experience);
    }

    function renderBubble(item, side, owner, delayIndex = 0) {
      return `
    <article class="whatspwaap-bubble ${owner}" style="--bubble-delay: ${delayIndex * 90}ms">
      <span>${escapeHtml(owner === "user" ? `You | ${getSideLabel(side)}` : `NPG | ${getSideLabel(side)}`)}</span>
      <strong>${escapeHtml(getDisplayTitle(item))}</strong>
      <p>${escapeHtml(getChoiceJustification(item))}</p>
    </article>
  `;
    }

    function renderMessages(experience) {
      const userSide = experience.selectedSide || "pro";
      const npcSide = getOpposingSide(userSide);
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
      <div class="whatspwaap-round-label">${escapeHtml(getRoundSpeakerLabel(roundIndex))}</div>
    `);

        proItems.forEach((item, itemIndex) => {
          messages.push(renderBubble(item, "pro", userSide === "pro" ? "user" : "npg", itemIndex));
        });

        conItems.forEach((item, itemIndex) => {
          messages.push(renderBubble(item, "con", userSide === "con" ? "user" : "npg", itemIndex));
        });
      });

      return messages.join("");
    }

    function renderFeedbackList(title, items) {
      if (!items.length) {
        return "";
      }

      return `
    <section>
      <h4>${escapeHtml(title)}</h4>
      ${items.map((item, index) => `
        <p><strong>${index + 1}. ${escapeHtml(shortenTrainText(getDisplayTitle(item), 86))}</strong> ${escapeHtml(getChoiceJustification(item))}</p>
      `).join("")}
    </section>
  `;
    }

    function renderResultCard(experience) {
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
        ${renderFeedbackList("Your choices", userItems)}
        ${renderFeedbackList("NPG choices", npcItems)}
      </div>
    </section>
  `;
    }

    function getNpcChoosingSide(experience = state.experience) {
      const round = ensureRoundState(experience);
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

    function renderStatus(experience) {
      const choosingSide = getNpcChoosingSide(experience);
      if (!choosingSide) {
        return `<footer class="whatspwaap-status empty" aria-hidden="true"></footer>`;
      }

      return `
    <footer class="whatspwaap-status" aria-live="polite">
      ${renderAssetImage(
        getAssetValue(["debate", choosingSide]),
        `${getSideLabel(choosingSide)} side`,
        "whatspwaap-status-logo-slot",
        "whatspwaap-status-logo"
      )}
      <span>NPG is choosing...</span>
    </footer>
  `;
    }

    function renderPanel(topic, experience) {
      return `
    <aside class="whatspwaap-chat" aria-live="polite">
      <header>
        <div>
          <strong>WhatsPwaap</strong>
          <p>${escapeHtml(topic.motion)}</p>
        </div>
      </header>
      <div class="whatspwaap-messages">
        ${renderMessages(experience)}
      </div>
      ${renderStatus(experience)}
    </aside>
  `;
    }

    function renderDebatePage(topic, experience) {
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
              `${getSideLabel(experience.selectedSide)} side`,
              "debate-side-inline-slot",
              "debate-side-inline-icon"
            )}
            <strong>${escapeHtml(getSideLabel(experience.selectedSide))}</strong>
          </div>
        </div>
      </header>
      <section class="whatspwaap-layout">
        ${experience.finished ? renderResultCard(experience) : renderSuggestionPanel(topic, experience)}
        ${renderPanel(topic, experience)}
      </section>
      <div class="panel-actions debate-case-actions">
        <button class="button secondary" type="button" data-buildcase-back-topic>Back to topics</button>
        <button class="button secondary" type="button" data-buildcase-spin-again>Spin again</button>
        <button class="button primary" type="button" data-buildcase-next-topic ${experience.topicOrder.length <= 1 ? "disabled" : ""}>Change topic</button>
      </div>
    </div>
  `;
    }

    function renderExperienceView() {
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

      const topic = getCurrentTopic(experience);
      if (!topic) {
        return "";
      }

      if (experience.phase === "debate" || experience.phase === "case") {
        experience.phase = "debate";
        ensureRoundState(experience);
        return renderDebatePage(topic, experience);
      }

      return `
    ${renderPanelTitle(
      "Debate Lab",
      "Random WSC motions with workbook arguments, rebuttals, and judge-style scoring.",
      `Motion ${experience.index + 1} of ${experience.topicOrder.length}`,
      { showSectionSpans: false }
    )}
    <div class="mode-shell debate-lab-shell">
      ${renderGameQuestionPopup(renderTopicCard(topic, experience), "buildcase debate-lab")}
    </div>
  `;
    }

    function startRoute() {
      openSideSpinner();
    }

    function chooseCamp(camp) {
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
      ensureRoundState(experience);
      beginNpcOpeningIfNeeded(experience);
      renderExperience();
    }

    function toggleSupport(index) {
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

    function confirmSupports() {
      const experience = state.experience;
      if (
        !experience ||
        experience.type !== "buildcase" ||
        experience.phase !== "support" ||
        experience.selectedSupports.length !== 2
      ) {
        return;
      }

      const round = getLegacyRound(experience);
      const options = experience.selectedCamp === "con" ? round.conSupports : round.proSupports;
      experience.supportHits = experience.selectedSupports.reduce((sum, index) => sum + (options[index] && options[index].correct ? 1 : 0), 0);
      experience.phase = "rebuttal";
      renderExperience();
    }

    function chooseRebuttal(index) {
      const experience = state.experience;
      if (!experience || experience.type !== "buildcase" || experience.phase !== "rebuttal") {
        return;
      }

      const round = getLegacyRound(experience);
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

    function advanceLegacyRound() {
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

    return Object.freeze({
      clearSpinTimer,
      clearRevealTimer,
      buildExperience,
      buildLegacyRounds,
      showNextTopic,
      startConversation,
      toggleSideSpin,
      returnToTopic,
      resetSpinForCurrentTopic,
      toggleSuggestion,
      submitRound,
      advanceRound,
      renderExperience: renderExperienceView,
      startRoute,
      chooseCamp,
      toggleSupport,
      confirmSupports,
      chooseRebuttal,
      advanceLegacyRound
    });
  }

  global.WSC_CREATE_BUILD_CASE_CONTROLLER = createBuildCaseController;
}(window));

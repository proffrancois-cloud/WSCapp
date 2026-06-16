(function () {
  function createGamePromptPresenter(options = {}) {
    const sectionById = options.sectionById || {};
    const subjectById = options.subjectById || {};
    const constants = options.constants || {};
    const helpers = options.helpers || {};
    const escapeHtml = helpers.escapeHtml || ((value) => String(value ?? ""));
    const formatCountdown = helpers.formatCountdown || ((value) => `${value}s`);
    const getQuestionSubjectLabels = helpers.getQuestionSubjectLabels || (() => []);

    const gameConfig = constants.GAME_CONFIG || {};

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
        pushUniqueNote(notes, `Buzz first, then answer within ${gameConfig.relayAnswerTime} seconds.`);
        pushUniqueNote(notes, "A wrong turn or timeout gives the points to every other team.");
      }

      if (question && question.sourceSubtopic) {
        pushUniqueNote(notes, `Focus: ${question.sourceSubtopic}`);
      } else if (question && section) {
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

    return {
      getQuestionCueMood,
      getGameMascotMood,
      getQuestionTypeLabel,
      getGamePromptLabel,
      getQuestionAnchorLine,
      getQuestionTypeHint,
      pushUniqueNote,
      renderGameNotes,
      getSectionCounts,
      getSubjectCounts
    };
  }

  window.WSC_CREATE_GAME_PROMPT_PRESENTER = createGamePromptPresenter;
}());

(function initAlpaquizRenderController(global) {
  "use strict";

  function requiredFunction(collection, name) {
    const value = collection ? collection[name] : null;
    if (typeof value !== "function") {
      throw new Error("WSC Alpaquiz render controller missing function dependency: " + name);
    }
    return value;
  }

  function requiredObject(collection, name) {
    const value = collection ? collection[name] : null;
    if (!value) {
      throw new Error("WSC Alpaquiz render controller missing object dependency: " + name);
    }
    return value;
  }

  function createAlpaquizRenderController(options = {}) {
    const {
      appState: state,
      renderers = {},
      callbacks = {}
    } = options;

    if (!state) {
      throw new Error("WSC Alpaquiz render controller missing app state.");
    }

    const quizRenderer = requiredObject(renderers, "quizRenderer");
    const relayRenderer = requiredObject(renderers, "relayRenderer");
    const getQuizRenderHelpers = requiredFunction(callbacks, "getQuizRenderHelpers");
    const getRelayRenderHelpers = requiredFunction(callbacks, "getRelayRenderHelpers");
    const renderTrainTipPopup = requiredFunction(callbacks, "renderTrainTipPopup");

    function renderQuizExperience() {
      return `
        ${quizRenderer.renderExperience(state.experience, getQuizRenderHelpers())}
        ${renderTrainTipPopup("quiz")}
      `;
    }

    function renderQuizSetup(experience) {
      return quizRenderer.renderSetup(experience, getQuizRenderHelpers());
    }

    function renderQuizQuestionPage(experience) {
      return quizRenderer.renderQuestionPage(experience, getQuizRenderHelpers());
    }

    function renderQuizResultsFooter(experience) {
      return quizRenderer.renderResultsFooter(experience, getQuizRenderHelpers());
    }

    function renderQuizQuestionCard(question, questionIndex, experience) {
      return quizRenderer.renderQuestionCard(question, questionIndex, experience, getQuizRenderHelpers());
    }

    function renderQuizQuestionFeedback(question, selectedIndex, isCorrect) {
      return quizRenderer.renderQuestionFeedback(question, selectedIndex, isCorrect, getQuizRenderHelpers());
    }

    function getRelayStandings(teams) {
      return relayRenderer.getStandings(teams);
    }

    function renderRelayExperience() {
      return relayRenderer.renderExperience(state.experience, getRelayRenderHelpers());
    }

    function renderRelayResults(experience) {
      return relayRenderer.renderResults(experience, getRelayRenderHelpers());
    }

    return Object.freeze({
      renderQuizExperience,
      renderQuizSetup,
      renderQuizQuestionPage,
      renderQuizResultsFooter,
      renderQuizQuestionCard,
      renderQuizQuestionFeedback,
      getRelayStandings,
      renderRelayExperience,
      renderRelayResults
    });
  }

  global.WSC_CREATE_ALPAQUIZ_RENDER_CONTROLLER = createAlpaquizRenderController;
}(window));

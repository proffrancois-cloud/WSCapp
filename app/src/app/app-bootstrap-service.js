(function () {
  function runStartupTasks(tasks = []) {
    tasks.forEach((task) => task());
  }

  function markAppReady({
    windowTarget = window,
    flagName = "WSC_APP_READY",
    eventName = "wsc:app-ready"
  } = {}) {
    windowTarget[flagName] = true;
    const ReadyEvent = windowTarget.Event || Event;
    windowTarget.dispatchEvent(new ReadyEvent(eventName));
  }

  function registerEventListeners(bindings = []) {
    bindings.forEach(({ target, type, handler, options }) => {
      target.addEventListener(type, handler, options);
    });

    return function cleanupEventListeners() {
      [...bindings].reverse().forEach(({ target, type, handler, options }) => {
        target.removeEventListener(type, handler, options);
      });
    };
  }

  window.WSC_APP_BOOTSTRAP_SERVICE = Object.freeze({
    runStartupTasks,
    markAppReady,
    registerEventListeners
  });
}());

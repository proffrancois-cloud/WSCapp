(function () {
  const APP_REF_IDS = Object.freeze({
    heroMascot: "heroMascot",
    statsStrip: "statsStrip",
    sessionControls: "sessionControls",
    heroOnlineMount: "heroOnlineMount",
    appEntryGateMount: "appEntryGateMount",
    cooperationModalMount: "cooperationModalMount",
    insightGrid: "insightGrid",
    routeBuilder: "routeBuilder",
    routeBuilderTitle: "routeBuilderTitle",
    choiceSummary: "choiceSummary",
    wizardRailMount: "wizardRailMount",
    wizardSteps: "wizardSteps",
    experiencePanel: "experiencePanel",
    resourcesModalMount: "resourcesModalMount",
    authModalMount: "authModalMount"
  });

  function getAppRefs(documentRef = document, refIds = APP_REF_IDS) {
    return Object.fromEntries(
      Object.entries(refIds).map(([name, id]) => [name, documentRef.getElementById(id)])
    );
  }

  function setHtml(target, html = "") {
    if (!target) {
      return false;
    }

    target.innerHTML = html;
    return true;
  }

  function clearHtml(target) {
    return setHtml(target, "");
  }

  function parseFirstElement(markup, documentRef = document) {
    const template = documentRef.createElement("template");
    template.innerHTML = String(markup || "").trim();
    return template.content.firstElementChild;
  }

  function replaceWithMarkup(target, markup, documentRef = document) {
    if (!target) {
      return null;
    }

    const nextNode = parseFirstElement(markup, documentRef);
    if (!nextNode) {
      return null;
    }

    target.replaceWith(nextNode);
    return nextNode;
  }

  function replaceChildrenWithMarkup(target, markup, documentRef = document) {
    if (!target) {
      return null;
    }

    const nextNode = parseFirstElement(markup, documentRef);
    if (!nextNode) {
      clearHtml(target);
      return null;
    }

    target.replaceChildren(nextNode);
    return nextNode;
  }

  function replaceChildren(target, ...nodes) {
    if (!target) {
      return false;
    }

    target.replaceChildren(...nodes);
    return true;
  }

  function ensureBodyMount({ documentRef = document, id, tagName = "div" } = {}) {
    if (!id) {
      return null;
    }

    let mount = documentRef.getElementById(id);
    if (mount) {
      return mount;
    }

    mount = documentRef.createElement(tagName);
    mount.id = id;
    documentRef.body.appendChild(mount);
    return mount;
  }

  window.WSC_APP_DOM_SERVICE = Object.freeze({
    APP_REF_IDS,
    getAppRefs,
    setHtml,
    clearHtml,
    parseFirstElement,
    replaceWithMarkup,
    replaceChildrenWithMarkup,
    replaceChildren,
    ensureBodyMount
  });
}());

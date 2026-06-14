(function () {
  const TRUSTED_HTML_BRAND = Symbol("WSC_TRUSTED_HTML");

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

  // Provenance label for renderer-owned markup; this does not sanitize input.
  function trustedHtml(markup = "", source = "runtime") {
    return Object.freeze({
      [TRUSTED_HTML_BRAND]: true,
      markup: String(markup || ""),
      source: String(source || "runtime")
    });
  }

  function isTrustedHtml(value) {
    return Boolean(value && value[TRUSTED_HTML_BRAND] === true);
  }

  function unwrapTrustedHtml(value) {
    return isTrustedHtml(value) ? value.markup : String(value || "");
  }

  function escapeHtml(value = "") {
    return String(value || "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  function setTrustedHtml(target, html = trustedHtml("")) {
    if (!target) {
      return false;
    }

    target.innerHTML = unwrapTrustedHtml(html);
    return true;
  }

  function setHtml(target, html = "") {
    return setTrustedHtml(target, trustedHtml(html, "legacy-set-html"));
  }

  function clearHtml(target) {
    return setTrustedHtml(target, trustedHtml("", "clear-html"));
  }

  function parseTrustedFirstElement(markup, documentRef = document) {
    const template = documentRef.createElement("template");
    template.innerHTML = unwrapTrustedHtml(markup).trim();
    return template.content.firstElementChild;
  }

  function parseFirstElement(markup, documentRef = document) {
    return parseTrustedFirstElement(trustedHtml(markup, "legacy-parse-first-element"), documentRef);
  }

  function htmlToText(markup, documentRef = document) {
    const raw = unwrapTrustedHtml(markup);
    if (!raw) {
      return "";
    }

    const template = documentRef.createElement("template");
    template.innerHTML = raw;
    return template.content.textContent.replace(/\s+/g, " ").trim();
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
    trustedHtml,
    isTrustedHtml,
    escapeHtml,
    setTrustedHtml,
    setHtml,
    clearHtml,
    parseTrustedFirstElement,
    parseFirstElement,
    htmlToText,
    replaceWithMarkup,
    replaceChildrenWithMarkup,
    replaceChildren,
    ensureBodyMount
  });
}());

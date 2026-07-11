(function () {
  const TRUSTED_HTML_BRAND = Symbol("WSC_TRUSTED_HTML");

  function trustedHtml(markup, source = "unknown") {
    return Object.freeze({
      [TRUSTED_HTML_BRAND]: true,
      markup: String(markup || ""),
      source: String(source || "unknown")
    });
  }

  function isTrustedHtml(value) {
    return Boolean(value && value[TRUSTED_HTML_BRAND] === true);
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function getMarkup(value) {
    return isTrustedHtml(value) ? value.markup : String(value || "");
  }

  function setTrustedHtml(target, value) {
    if (!target) {
      return;
    }
    if (!isTrustedHtml(value)) {
      throw new TypeError("setTrustedHtml requires trustedHtml output.");
    }
    target.innerHTML = value.markup;
  }

  function setHtml(target, markup, source = "legacy-renderer") {
    setTrustedHtml(target, trustedHtml(markup, source));
  }

  function clearHtml(target) {
    if (!target) {
      return;
    }
    target.replaceChildren();
  }

  function parseTrustedFirstElement(value, doc = document) {
    const template = doc.createElement("template");
    template.innerHTML = getMarkup(value).trim();
    return template.content.firstElementChild;
  }

  function htmlToText(value, doc = document) {
    const template = doc.createElement("template");
    template.innerHTML = getMarkup(value);
    return template.content.textContent.replace(/\s+/g, " ").trim();
  }

  window.WSC_APP_DOM_SERVICE = Object.freeze({
    trustedHtml,
    isTrustedHtml,
    escapeHtml,
    setTrustedHtml,
    setHtml,
    clearHtml,
    parseTrustedFirstElement,
    htmlToText
  });
}());

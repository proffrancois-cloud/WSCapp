import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import vm from "node:vm";

const repoRoot = resolve(import.meta.dirname, "../..");
const servicePath = resolve(repoRoot, "app/src/app/app-dom-service.js");
const source = readFileSync(servicePath, "utf8");

function createTemplate() {
  let html = "";
  const content = {
    firstElementChild: null,
    get textContent() {
      return html.replace(/<[^>]+>/g, " ");
    }
  };

  return {
    content,
    set innerHTML(value) {
      html = String(value || "");
      content.firstElementChild = html.trim() ? { nodeType: 1, trustedFixtureHtml: html } : null;
    },
    get innerHTML() {
      return html;
    }
  };
}

const fakeDocument = {
  createElement(tagName) {
    if (tagName !== "template") {
      throw new Error(`Unexpected fake DOM element request: ${tagName}`);
    }

    return createTemplate();
  },
  getElementById() {
    return null;
  }
};

const sandbox = {
  document: fakeDocument,
  window: {}
};

vm.createContext(sandbox);
vm.runInContext(source, sandbox, { filename: servicePath });

const service = sandbox.window.WSC_APP_DOM_SERVICE;
const failures = [];

if (!service) {
  failures.push("WSC_APP_DOM_SERVICE was not registered.");
}

const requiredExports = [
  "trustedHtml",
  "isTrustedHtml",
  "escapeHtml",
  "setTrustedHtml",
  "setHtml",
  "parseTrustedFirstElement",
  "htmlToText"
];

for (const exportName of requiredExports) {
  if (typeof service?.[exportName] !== "function") {
    failures.push(`Missing app-dom-service export: ${exportName}`);
  }
}

const xssFixture = `<img src=x onerror=alert(1)>`;
const escapedFixture = service?.escapeHtml?.(xssFixture);
if (escapedFixture?.includes("<img") || !escapedFixture?.includes("&lt;img")) {
  failures.push("escapeHtml should escape untrusted HTML-looking text.");
}

const trustedFixture = service?.trustedHtml?.("<p>Trusted fixture</p>", "html-boundary-test");
if (!Object.isFrozen(trustedFixture)) {
  failures.push("trustedHtml should return an immutable wrapper.");
}
if (!service?.isTrustedHtml?.(trustedFixture) || service?.isTrustedHtml?.({ markup: "<p>spoof</p>" })) {
  failures.push("isTrustedHtml should only accept wrappers created by app-dom-service.");
}

const target = { innerHTML: "" };
service?.setTrustedHtml?.(target, trustedFixture);
if (target.innerHTML !== "<p>Trusted fixture</p>") {
  failures.push("setTrustedHtml should write approved trusted markup.");
}

service?.setHtml?.(target, "<p>Legacy renderer fixture</p>");
if (target.innerHTML !== "<p>Legacy renderer fixture</p>") {
  failures.push("setHtml should preserve legacy renderer compatibility through the approved boundary.");
}

const text = service?.htmlToText?.(
  service.trustedHtml("<p>Hello <strong>world</strong></p>", "html-boundary-test"),
  fakeDocument
);
if (text !== "Hello world") {
  failures.push(`htmlToText should decode trusted markup to text. Received: ${text}`);
}

if (failures.length) {
  console.error(`HTML boundary test failed:\n- ${failures.join("\n- ")}`);
  process.exit(1);
}

console.log(JSON.stringify({
  requiredExports,
  escapedFixture,
  text
}, null, 2));

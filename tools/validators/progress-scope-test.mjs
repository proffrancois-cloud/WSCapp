import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const source = fs.readFileSync(path.join(repoRoot, "app/src/app/progress-storage-controller.js"), "utf8");
const values = new Map([
  ["wsc-alpaca-stats", JSON.stringify({ sessions: 7 })],
  ["wsc-alpaca-raw-mastery", JSON.stringify({ legacyEntry: true })]
]);
const localStorage = {
  getItem(key) {
    return values.has(key) ? values.get(key) : null;
  },
  setItem(key, value) {
    values.set(key, String(value));
  },
  removeItem(key) {
    values.delete(key);
  }
};
const sandbox = { window: { localStorage } };
vm.createContext(sandbox);
vm.runInContext(source, sandbox);

const controller = sandbox.window.WSC_CREATE_PROGRESS_STORAGE_CONTROLLER({
  progressService: {
    getDefaultStats: () => ({ sessions: 0 }),
    normalizeStats: (value) => ({ sessions: Number(value?.sessions) || 0 }),
    normalizeRawMastery: (value) => value && typeof value === "object" ? value : {}
  }
});

const guest = controller.loadLocalProgress();
if (guest.scope !== "guest" || guest.stats.sessions !== 7 || guest.rawMastery.legacyEntry !== true) {
  throw new Error("Legacy progress should migrate once into the isolated guest scope.");
}

controller.setScope("user:alpha");
const firstAccount = controller.loadLocalProgress();
if (firstAccount.hasStoredProgress || firstAccount.stats.sessions !== 0 || firstAccount.rawMastery.legacyEntry) {
  throw new Error("A signed-in account must not inherit guest or legacy progress.");
}
controller.saveLocalProgress({ stats: { sessions: 3 }, rawMastery: { alphaEntry: true } });

controller.setScope("user:beta");
const secondAccount = controller.loadLocalProgress();
if (secondAccount.hasStoredProgress || secondAccount.stats.sessions !== 0 || secondAccount.rawMastery.alphaEntry) {
  throw new Error("Different Alpaccounts must use different local progress namespaces.");
}
controller.saveLocalProgress({ stats: { sessions: 11 }, rawMastery: { betaEntry: true } });

controller.setScope("user:alpha");
const restoredFirstAccount = controller.loadLocalProgress();
if (restoredFirstAccount.stats.sessions !== 3 || restoredFirstAccount.rawMastery.alphaEntry !== true || restoredFirstAccount.rawMastery.betaEntry) {
  throw new Error("Returning to an Alpaccount should restore only that account's local progress.");
}

controller.setScope("guest");
const restoredGuest = controller.loadLocalProgress();
if (restoredGuest.stats.sessions !== 7 || restoredGuest.rawMastery.legacyEntry !== true) {
  throw new Error("Signing out should restore the guest progress namespace.");
}

console.log(JSON.stringify({
  guestScope: restoredGuest.scope,
  accountScopesIsolated: true,
  legacyMigratedToGuestOnly: true
}, null, 2));

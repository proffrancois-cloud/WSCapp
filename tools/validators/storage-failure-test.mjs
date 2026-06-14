import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), "utf8");
}

function createFailingStorage() {
  return {
    getItem() {
      throw new Error("storage read blocked");
    },
    setItem() {
      throw new Error("storage write blocked");
    },
    removeItem() {
      throw new Error("storage remove blocked");
    }
  };
}

const sandbox = {
  window: {
    localStorage: createFailingStorage()
  }
};
vm.createContext(sandbox);
vm.runInContext(read("app/src/services/storage-service.js"), sandbox);
vm.runInContext(read("app/src/app/progress-storage-controller.js"), sandbox);

const storageService = sandbox.window.WSC_STORAGE_SERVICE;
const storageSetResult = storageService.setJson("blocked", { value: true });
const storageGetResult = storageService.getJson("blocked", { fallback: true });
const progressController = sandbox.window.WSC_CREATE_PROGRESS_STORAGE_CONTROLLER({
  storageService,
  progressService: null,
  entryService: { getOnlineAlpacaName: () => "Devalpacca" }
});
const progressSaveResult = progressController.saveLocalProgress({
  stats: { sessions: 1 },
  rawMastery: { entry: true }
});

const failures = [];
if (storageSetResult.ok !== false || storageSetResult.key !== "blocked") {
  failures.push("storageService.setJson should report a failed write without throwing");
}
if (storageGetResult?.fallback !== true) {
  failures.push("storageService.getJson should return fallback when reads fail");
}
if (progressSaveResult.ok !== false || progressSaveResult.failedKeys.length !== 2) {
  failures.push("progress storage should report both failed local progress writes");
}

if (failures.length) {
  console.error(`Storage failure test failed:\n- ${failures.join("\n- ")}`);
  process.exit(1);
}

console.log(JSON.stringify({
  storageWriteOk: storageSetResult.ok,
  progressWriteOk: progressSaveResult.ok,
  failedKeys: progressSaveResult.failedKeys
}, null, 2));

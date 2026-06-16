import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const repoRoot = resolve(import.meta.dirname, "../..");
const compositionRootPath = resolve(repoRoot, "app/src/app/wsc-app-composition-root.js");
const maxLines = 2500;
const lineCount = readFileSync(compositionRootPath, "utf8").split(/\r?\n/).length;

const report = {
  file: "app/src/app/wsc-app-composition-root.js",
  lineCount,
  maxLines
};

console.log(JSON.stringify(report, null, 2));

if (lineCount > maxLines) {
  console.error(
    `composition root budget exceeded: ${lineCount} lines > ${maxLines}. ` +
      "Move controller construction or runtime wiring into bounded app modules."
  );
  process.exitCode = 1;
}

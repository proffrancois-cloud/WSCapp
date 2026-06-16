import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const repoRoot = resolve(import.meta.dirname, "../..");
const appJsPath = resolve(repoRoot, "app/app.js");
const maxLines = 1000;
const lineCount = readFileSync(appJsPath, "utf8").split(/\r?\n/).length;

const report = {
  file: "app/app.js",
  lineCount,
  maxLines
};

console.log(JSON.stringify(report, null, 2));

if (lineCount > maxLines) {
  console.error(`app.js budget exceeded: ${lineCount} lines > ${maxLines}. Keep app.js as a bootstrap-only file.`);
  process.exitCode = 1;
}

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve("src");
const ALLOWED = new Set([
  path.normalize("src/components/studio/mentor/CreatorJourneyEngine.js"),
  path.normalize("src/components/studio/mentor/JourneyProgressionExecutionRuntime.js"),
]);

const RAW_MUTATORS = [
  "setCurrentPosition",
  "completeTask",
  "completeStage",
  "revisitStage",
  "pauseJourney",
];

function walk(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) return walk(fullPath);
    if (!/\.(?:js|jsx|mjs|cjs|ts|tsx)$/.test(entry.name)) return [];
    return [fullPath];
  });
}

function stripCommentsAndStrings(source) {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/(^|[^:])\/\/.*$/gm, "$1 ")
    .replace(/`(?:\\.|[^`\\])*`/gs, "``")
    .replace(/"(?:\\.|[^"\\])*"/g, '""')
    .replace(/'(?:\\.|[^'\\])*'/g, "''");
}

const violations = [];

for (const absolutePath of walk(ROOT)) {
  const relativePath = path.normalize(path.relative(process.cwd(), absolutePath));
  if (ALLOWED.has(relativePath)) continue;

  const source = stripCommentsAndStrings(fs.readFileSync(absolutePath, "utf8"));

  for (const mutator of RAW_MUTATORS) {
    const memberCall = new RegExp(`\\.\\s*${mutator}\\s*\\(`, "g");
    const directCall = new RegExp(`(^|[^.$\\w])${mutator}\\s*\\(`, "gm");

    if (memberCall.test(source) || directCall.test(source)) {
      violations.push({ file: relativePath, mutator });
    }
  }
}

assert.deepEqual(
  violations,
  [],
  `Raw Journey progression mutators must remain quarantined behind JourneyProgressionExecutionRuntime. Violations: ${JSON.stringify(violations)}`
);

console.log(
  "Movie Mentor Journey Mutator Quarantine: PASS — production code cannot call raw Journey progression mutators outside CreatorJourneyEngine and JourneyProgressionExecutionRuntime."
);

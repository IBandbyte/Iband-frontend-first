import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";

const root = process.cwd();
const src = join(root, "src");
const storePath = "src/components/studio/mentor/JourneyDurableAuthorityStore.js";
const allowedUnderLockCallers = new Set([
  "src/components/studio/mentor/JourneyProgressionAuthorityAdapter.js",
  "src/components/studio/mentor/JourneyAuthorityAtomicTransition.js",
  "src/components/studio/mentor/JourneyCreatorTruthProjectionExecutionRuntime.js",
]);
const inspectedLockRoutes = new Set([
  "src/components/studio/mentor/JourneyProgressionExecutionRuntime.js",
  "src/components/studio/mentor/JourneyRecommendationAcceptanceExecutionRuntime.js",
  "src/components/studio/mentor/JourneyCreatorTruthProjectionExecutionRuntime.js",
]);
const files = [];
function walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (/\.(?:js|jsx|ts|tsx)$/.test(entry.name)) files.push(full);
  }
}
walk(src);
assert.ok(files.length >= 90, "Source inventory unexpectedly small; audit cannot certify a partial tree.");
const issues = [];
const findings = [];
for (const file of files) {
  const path = relative(root, file).split(/\\/).join("/");
  const source = readFileSync(file, "utf8");
  const lines = source.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (path !== storePath && /iband:movie-mentor:journey-authority(?::|["'`])/.test(line)) {
      issues.push(`${path}:${i + 1} unexpected direct Journey Authority key reference`);
    }
    if (/\.(?:bootstrapUnderLock|compareAndCommitUnderLock)\s*\(/.test(line)) {
      findings.push(`${path}:${i + 1} under-lock authority call`);
      if (path !== storePath && !allowedUnderLockCallers.has(path)) {
        issues.push(`${path}:${i + 1} unreviewed under-lock authority caller`);
      }
    }
    if (path !== storePath && /(?:authorityStorageKey|JOURNEY_AUTHORITY_STORAGE_PREFIX)/.test(line)) {
      issues.push(`${path}:${i + 1} unexpected authority key construction/import`);
    }
  }
  if (inspectedLockRoutes.has(path) && !source.includes("withJourneyProgressionProjectLock")) {
    issues.push(`${path} lost required project lock reference`);
  }
}
const store = readFileSync(join(root, storePath), "utf8");
assert.match(store, /storage\.setItem\(key, serialized\)/, "Expected canonical authority write location changed; re-audit required.");
assert.match(store, /callback: async \(lockProof\) => compareAndCommitUnderLock/, "Public commit no longer delegates under lock.");
assert.match(store, /callback: async \(lockProof\) => bootstrapUnderLock/, "Public bootstrap no longer delegates under lock.");
console.log(`Scanned ${files.length} source files at exact checkout HEAD.`);
for (const finding of findings) console.log(`INVENTORY ${finding}`);
if (issues.length) {
  for (const issue of issues) console.error(`RED ${issue}`);
  process.exitCode = 1;
} else {
  console.log("GREEN: no unreviewed direct authority-key references or under-lock calls in source inventory.");
  console.log("LIMITATION: static inventory cannot rule out computed/dynamic writes or prove runtime reachability.");
}

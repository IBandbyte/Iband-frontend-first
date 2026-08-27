import fs from "node:fs";
import path from "node:path";

const recoveryFile = fs.readFileSync(path.join(process.cwd(), "src/components/studio/mentor/JourneyRecommendationLifecycleRecovery.js"), "utf8");
const conflictFile = fs.readFileSync(path.join(process.cwd(), "src/components/studio/mentor/JourneyRecommendationRecoveryConflictQuarantine.js"), "utf8");
const files = [
  { name: "lifecycle recovery", content: recoveryFile },
  { name: "proof-conflict quarantine", content: conflictFile },
];
const failures = [];

function forbidEverywhere(needle, reason) {
  for (const file of files) {
    if (file.content.includes(needle)) failures.push(`${file.name}: ${reason}`);
  }
}

forbidEverywhere("CreatorJourneyEngine", "Recovery must not import or invoke CreatorJourneyEngine.");
forbidEverywhere("JourneyPositionAuthorityControl", "Recovery must not import Position Authority.");
forbidEverywhere("JourneyProgressionExecutionRuntime", "Recovery must not invoke progression execution.");
forbidEverywhere("issueJourneyPositionAuthority", "Recovery must never mint Journey Position Authority.");
forbidEverywhere("setCurrentPosition", "Recovery must never set Journey position.");
forbidEverywhere("completeTask(", "Recovery must never complete Journey tasks.");
forbidEverywhere("completeStage(", "Recovery must never complete Journey stages.");
forbidEverywhere("persistJourney(", "Recovery must never rewrite Journey through ordinary persistence.");

if (!recoveryFile.includes("JOURNEY_RECOMMENDATION_RECOVERY_AUTHORITY_VIOLATION")) failures.push("Lifecycle recovery must contain an explicit Journey-mutation authority violation guard.");
if (!recoveryFile.includes("journeyMutated: false")) failures.push("Lifecycle recovery results must explicitly report that Journey authority was untouched.");
if (!recoveryFile.includes("JSON.stringify(persistedJourney) !== beforeJourney")) failures.push("Lifecycle recovery post-write verification must prove Journey bytes remained unchanged.");
if (!recoveryFile.includes("JOURNEY_RECOMMENDATION_RECOVERY_PROOF_CONFLICT")) failures.push("Contradictory durable proof must fail closed before classification repair.");

if (!conflictFile.includes("JOURNEY_RECOMMENDATION_CONFLICT_QUARANTINE_AUTHORITY_VIOLATION")) failures.push("Proof-conflict quarantine must contain its own explicit Journey-mutation authority violation guard.");
if (!conflictFile.includes("journeyMutated: false")) failures.push("Proof-conflict quarantine results must explicitly report that Journey authority was untouched.");
if (!conflictFile.includes("persistedJourney !== beforeJourney")) failures.push("Proof-conflict quarantine post-write verification must prove Journey bytes remained unchanged.");
if (!conflictFile.includes('terminalReason: "proof-conflict-quarantined"')) failures.push("Contradictory proof must retain a distinct historical quarantine state.");

if (failures.length) {
  console.error("Journey recommendation recovery authority quarantine failed:\n");
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log("Journey recommendation recovery authority quarantine passed.");
console.log("- lifecycle recovery and proof-conflict quarantine own recommendation metadata only");
console.log("- neither boundary can mint Position Authority or invoke Journey mutators");
console.log("- both boundaries guard and verify byte-identical Journey reality");
console.log("- contradictory proof is preserved as historical quarantine, never invented history");

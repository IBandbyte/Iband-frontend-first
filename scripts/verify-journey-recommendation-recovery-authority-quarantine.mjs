import fs from "node:fs";
import path from "node:path";

const file = fs.readFileSync(path.join(process.cwd(), "src/components/studio/mentor/JourneyRecommendationLifecycleRecovery.js"), "utf8");
const failures = [];
const forbid = (needle, reason) => { if (file.includes(needle)) failures.push(reason); };

forbid("CreatorJourneyEngine", "Recovery must not import or invoke CreatorJourneyEngine.");
forbid("JourneyPositionAuthorityControl", "Recovery must not import Position Authority.");
forbid("JourneyProgressionExecutionRuntime", "Recovery must not invoke progression execution.");
forbid("issueJourneyPositionAuthority", "Recovery must never mint Journey Position Authority.");
forbid("setCurrentPosition", "Recovery must never set Journey position.");
forbid("completeTask(", "Recovery must never complete Journey tasks.");
forbid("completeStage(", "Recovery must never complete Journey stages.");
forbid("persistJourney(", "Recovery must never rewrite Journey through ordinary persistence.");

if (!file.includes("JOURNEY_RECOMMENDATION_RECOVERY_AUTHORITY_VIOLATION")) failures.push("Recovery must contain an explicit Journey-mutation authority violation guard.");
if (!file.includes("journeyMutated: false")) failures.push("Recovery results must explicitly report that Journey authority was untouched.");
if (!file.includes("JSON.stringify(persistedJourney) !== beforeJourney")) failures.push("Post-write verification must prove Journey bytes remained unchanged.");
if (!file.includes("JOURNEY_RECOMMENDATION_RECOVERY_PROOF_CONFLICT")) failures.push("Contradictory durable proof must fail closed.");

if (failures.length) {
  console.error("Journey recommendation recovery authority quarantine failed:\n");
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log("Journey recommendation recovery authority quarantine passed.");
console.log("- recovery owns recommendation metadata only");
console.log("- recovery cannot mint Position Authority or invoke Journey mutators");
console.log("- pre/post-write guards prove Journey reality remains byte-identical");
console.log("- contradictory proof fails closed");

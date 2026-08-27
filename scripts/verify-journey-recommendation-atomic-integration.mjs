import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const progression = fs.readFileSync(path.join(ROOT, "src/components/studio/mentor/JourneyProgressionExecutionRuntime.js"), "utf8");
const acceptance = fs.readFileSync(path.join(ROOT, "src/components/studio/mentor/JourneyRecommendationAcceptanceExecutionRuntime.js"), "utf8");
const persistence = fs.readFileSync(path.join(ROOT, "src/components/studio/mentor/JourneyRecommendationLifecyclePersistence.js"), "utf8");
const failures = [];
const check = (value, message) => { if (!value) failures.push(message); };

check(progression.includes('from "./JourneyRecommendationLifecyclePersistence.js"'), "Progression runtime must import atomic recommendation lifecycle persistence.");
check(progression.includes("persistJourneyAndRecommendationLifecycle({"), "Progression runtime must attempt one coherent Journey + recommendation lifecycle commit.");
check(progression.includes("acceptedRecommendationId: cleanString(input?.recommendationId) || null"), "Accepted recommendation identity must reach the atomic persistence boundary.");
check(progression.includes('disposition: "consumed"'), "Progression receipt must carry first-class recommendation disposition.");
check(progression.includes("issuedAgainstProgressionRevision: fromRevision"), "Progression receipt must bind recommendation lineage to exact source revision.");
check(progression.includes("recommendation: recommendationId ? Object.freeze"), "Ordinary progression receipts must not fabricate recommendation lineage.");
check(progression.includes("return identityRuntime.persistJourney(projectId, candidateJourney"), "Legacy/non-CreatorMemory runtimes must retain the existing persistence fallback.");

check(acceptance.includes("consumeRecommendationWithoutMovement({"), "No-op acceptance must persist lifecycle consumption durably.");
check(acceptance.includes("createRecommendationNoOpOperationId"), "No-op acceptance must have deterministic durable operation identity.");
check(acceptance.includes("expectedProgressionRevision: durableJourney?.progression?.revision ?? 0"), "No-op lifecycle commit must CAS against exact durable Journey revision.");
check(!acceptance.includes("operationId: null,\n        receipt: null"), "No-op acceptance must no longer return an unpersisted transient success shape.");

check(persistence.includes('terminalReason: "consumed"'), "Atomic lifecycle primitive must persist consumed state.");
check(persistence.includes('terminalReason: "invalidated-by-progression"'), "Atomic lifecycle primitive must persist invalidation by unrelated progression.");
check(persistence.includes("memory.replaceState(nextState)"), "Journey and lifecycle must be written through one whole-memory replacement.");
check(persistence.includes("JSON.stringify(persistedProject?.identity || null) !== JSON.stringify(originalIdentity)"), "Whole-state persistence must verify immutable project identity survived.");
check(persistence.includes('status: "repair-consumed"'), "Crash recovery must recognise exact consumed receipt lineage.");
check(persistence.includes('status: "repair-invalidated"'), "Crash recovery must distinguish unrelated progression invalidation.");

if (failures.length) {
  console.error("Journey recommendation atomic integration verification failed:\n");
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log("Journey recommendation atomic integration verification passed.");
console.log("- recommendation movement and lifecycle share one persistence transition");
console.log("- accepted recommendation identity is first-class receipt lineage");
console.log("- ordinary progression invalidates stale recommendations without claiming consumption");
console.log("- no-op acceptance is durable and CAS-bound without fake progression");
console.log("- existing persistence fallback remains available for non-CreatorMemory runtimes");
console.log("- crash repair can distinguish consumed from invalidated reality");

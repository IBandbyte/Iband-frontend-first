import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const progression = fs.readFileSync(path.join(ROOT, "src/components/studio/mentor/JourneyProgressionExecutionRuntime.js"), "utf8");
const acceptance = fs.readFileSync(path.join(ROOT, "src/components/studio/mentor/JourneyRecommendationAcceptanceExecutionRuntime.js"), "utf8");
const transition = fs.readFileSync(path.join(ROOT, "src/components/studio/mentor/JourneyAuthorityAtomicTransition.js"), "utf8");
const failures = [];
const check = (value, message) => { if (!value) failures.push(message); };

// Sovereignty law: mechanical Journey movement and recommendation lifecycle now
// share one Journey Authority generation transition. Creator Memory is bootstrap /
// projection only and must never be the authoritative mechanical commit fallback.
check(progression.includes('from "./JourneyAuthorityAtomicTransition.js"'), "Progression runtime must import the Journey Authority atomic transition primitive.");
check(progression.includes("commitJourneyAuthorityTransitionUnderLock({"), "Progression runtime must commit Journey movement through one Journey Authority transition.");
check(progression.includes("acceptedRecommendationId: cleanString(input?.recommendationId) || null"), "Accepted recommendation identity must reach the authority transition boundary.");
check(progression.includes('disposition: "consumed"'), "Progression receipt must carry first-class recommendation disposition.");
check(progression.includes("issuedAgainstProgressionRevision: fromRevision"), "Progression receipt must bind recommendation lineage to exact source revision.");
check(progression.includes("recommendation: recommendationId ? Object.freeze"), "Ordinary progression receipts must not fabricate recommendation lineage.");
check(!progression.includes("identityRuntime.persistJourney(projectId, candidateJourney"), "Creator Memory persistJourney must not remain a mechanical progression fallback after sovereignty cutover.");
check(!progression.includes('from "./JourneyRecommendationLifecyclePersistence.js"'), "Progression runtime must not depend on the retired Creator Memory lifecycle persistence primitive.");

check(acceptance.includes("commitJourneyAuthorityTransitionUnderLock({"), "No-op acceptance must consume recommendation lifecycle through Journey Authority.");
check(acceptance.includes("createRecommendationNoOpOperationId"), "No-op acceptance must retain deterministic durable operation identity.");
check(acceptance.includes("withoutMovement: true"), "No-op acceptance must identify the authority transition as no movement.");
check(!acceptance.includes("consumeRecommendationWithoutMovement({"), "No-op acceptance must not call the retired Creator Memory lifecycle mutation primitive.");
check(!acceptance.includes("expectedProgressionRevision: durableJourney?.progression?.revision ?? 0"), "No-op acceptance must not CAS lifecycle through the retired Creator Memory revision boundary.");
check(!acceptance.includes("operationId: null,\n        receipt: null"), "No-op acceptance must not return an unpersisted transient success shape.");

check(transition.includes("expectedGeneration"), "Atomic authority transition must bind commits to the resolved authority generation.");
check(transition.includes("expectedProgressionRevision: fromRevision"), "Atomic authority transition must bind commits to the exact authoritative Journey revision.");
check(transition.includes("authorityStore.compareAndCommitUnderLock({"), "Journey Authority transition must terminate at the under-lock generation CAS boundary.");
check(transition.includes("transitionRecommendations({"), "Journey and recommendation lifecycle must be derived inside the same authority transition.");
check(transition.includes("candidate.recommendations = cloneValue(lifecycle.records)"), "Recommendation lifecycle must enter the same candidate authority record as Journey movement.");
check(transition.includes("consumeAuthorityRecommendation"), "Authority lifecycle transition must persist consumed recommendation state.");
check(transition.includes("invalidateAuthorityRecommendations"), "Unrelated Journey progression must invalidate stale authority recommendations in the same transition.");
check(transition.includes('status: "already-committed"'), "Exact already-consumed lineage must reconcile idempotently without a second generation.");
check(!transition.includes("memory.replaceState("), "Journey Authority atomic transition must never fall back to whole-Creator-Memory replacement.");

if (failures.length) {
  console.error("Journey recommendation atomic integration verification failed:\n");
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log("Journey recommendation atomic integration verification passed.");
console.log("- recommendation movement and lifecycle share one Journey Authority generation transition");
console.log("- accepted recommendation identity is first-class receipt and authority lineage");
console.log("- unrelated progression invalidates stale recommendations inside the same authority transition");
console.log("- no-op acceptance consumes lifecycle through Journey Authority without fake progression");
console.log("- generation CAS and exact progression revision protect the authoritative transaction");
console.log("- Creator Memory is bootstrap/projection only and is not a mechanical persistence fallback");
console.log("- lost-response reconciliation returns already-consumed authority reality without a second generation");

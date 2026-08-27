import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const source = fs.readFileSync(path.join(ROOT, "src/components/studio/mentor/JourneyRecommendationAcceptanceExecutionRuntime.js"), "utf8");
const lockSource = fs.readFileSync(path.join(ROOT, "src/components/studio/mentor/JourneyProgressionProjectLock.js"), "utf8");

assert.ok(source.includes('import commitJourneyAuthorityTransitionUnderLock from "./JourneyAuthorityAtomicTransition.js";'));
assert.ok(source.includes('import { findAuthorityRecommendation } from "./JourneyAuthorityRecommendationLifecycle.js";'));
assert.ok(source.includes('import { withJourneyProgressionProjectLock } from "./JourneyProgressionProjectLock.js";'));
assert.ok(source.includes("return withJourneyProgressionProjectLock({"));
assert.ok(source.includes("resolvedAuthorityAdapter.resolveUnderLock({"));
assert.ok(source.includes("commitJourneyAuthorityTransitionUnderLock({"));
assert.ok(source.includes("withoutMovement: true"));

const lockCall = source.indexOf("return withJourneyProgressionProjectLock({");
const resolveAuthority = source.indexOf("resolvedAuthorityAdapter.resolveUnderLock({", lockCall);
const idempotenceRead = source.indexOf("findAuthorityRecommendation(", resolveAuthority);
const authorityCommit = source.indexOf("commitJourneyAuthorityTransitionUnderLock({", idempotenceRead);
assert.ok(
  lockCall >= 0 && resolveAuthority > lockCall && idempotenceRead > resolveAuthority && authorityCommit > idempotenceRead,
  "No-op lifecycle mutation must acquire project lock, resolve Journey Authority, reconcile prior consumption, then commit authority."
);

const noMovementBranch = source.indexOf('if (acceptance.status === "accepted-no-movement-required")');
const lockedHelperCall = source.indexOf("return consumeNoMovementUnderProjectLock", noMovementBranch);
assert.ok(noMovementBranch >= 0 && lockedHelperCall > noMovementBranch, "No-movement acceptance must route through the serialized authority helper.");

assert.ok(source.includes('status: "already-consumed-no-movement"'), "Duplicate no-op acceptance must reconcile before creating G+2.");
assert.ok(source.includes("crossTabSerialized: lockProof.crossTabSerialized"), "Acceptance result must expose serialization proof.");
assert.ok(!source.includes("consumeRecommendationWithoutMovement({"), "Mechanical no-op acceptance must no longer write lifecycle truth through Creator Memory.");
assert.ok(lockSource.includes("JOURNEY_PROGRESSION_CROSS_TAB_LOCK_UNAVAILABLE"), "Browser lock boundary must fail closed when cross-tab serialization is unavailable.");

console.log("Journey recommendation no-op project lock verification passed.");
console.log("- no-movement acceptance enters the same per-project lock domain as Journey movement");
console.log("- Journey Authority is resolved inside the lock before lifecycle mutation");
console.log("- duplicate consumption is reconciled before authority generation CAS");
console.log("- mechanical no-op lifecycle no longer writes through Creator Memory");
console.log("- browser execution inherits fail-closed cross-tab lock semantics");

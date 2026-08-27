import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const source = fs.readFileSync(path.join(ROOT, "src/components/studio/mentor/JourneyRecommendationAcceptanceExecutionRuntime.js"), "utf8");
const lockSource = fs.readFileSync(path.join(ROOT, "src/components/studio/mentor/JourneyProgressionProjectLock.js"), "utf8");

assert.ok(source.includes('import { withJourneyProgressionProjectLock } from "./JourneyProgressionProjectLock.js";'));
assert.ok(source.includes("return withJourneyProgressionProjectLock({"));
assert.ok(source.includes("const lockedJourney = getDurableJourney(identityRuntime, pid);"));
assert.ok(source.includes("consumeRecommendationWithoutMovement({"));

const lockCall = source.indexOf("return withJourneyProgressionProjectLock({");
const lockedRead = source.indexOf("const lockedJourney = getDurableJourney(identityRuntime, pid);", lockCall);
const consume = source.indexOf("consumeRecommendationWithoutMovement({", lockedRead);
assert.ok(lockCall >= 0 && lockedRead > lockCall && consume > lockedRead, "No-op lifecycle mutation must occur after lock acquisition and fresh durable read.");

const noMovementBranch = source.indexOf('if (acceptance.status === "accepted-no-movement-required")');
const lockedHelperCall = source.indexOf("return consumeNoMovementUnderProjectLock", noMovementBranch);
assert.ok(noMovementBranch >= 0 && lockedHelperCall > noMovementBranch, "No-movement acceptance must route through the serialized helper.");

assert.ok(source.includes("crossTabSerialized: lockProof.crossTabSerialized"), "Acceptance result must expose serialization proof.");
assert.ok(lockSource.includes("JOURNEY_PROGRESSION_CROSS_TAB_LOCK_UNAVAILABLE"), "Browser lock boundary must fail closed when cross-tab serialization is unavailable.");

console.log("Journey recommendation no-op project lock verification passed.");
console.log("- no-movement acceptance enters the same per-project lock boundary as Journey movement");
console.log("- durable Journey reality is reread inside the lock");
console.log("- lifecycle mutation occurs only after serialized fresh-state acquisition");
console.log("- browser execution inherits fail-closed cross-tab lock semantics");

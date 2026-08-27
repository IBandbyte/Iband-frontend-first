import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { withJourneyProgressionProjectLock, lockNameForProject } from "../src/components/studio/mentor/JourneyProgressionProjectLock.js";

const ROOT = process.cwd();
const progressionSource = fs.readFileSync(path.join(ROOT, "src/components/studio/mentor/JourneyProgressionExecutionRuntime.js"), "utf8");
const acceptanceSource = fs.readFileSync(path.join(ROOT, "src/components/studio/mentor/JourneyRecommendationAcceptanceExecutionRuntime.js"), "utf8");

function createFakeWebLocks() {
  const tails = new Map();
  return {
    async request(name, _options, callback) {
      const previous = tails.get(name) || Promise.resolve();
      let release;
      const current = new Promise((resolve) => { release = resolve; });
      tails.set(name, previous.catch(() => undefined).then(() => current));
      await previous.catch(() => undefined);
      try {
        return await callback({ name });
      } finally {
        release();
      }
    },
  };
}

const projectId = "movie-project-mixed-lock";
const fakeLocks = createFakeWebLocks();
const shared = {
  revision: 0,
  movementCommitted: false,
  noopConsumed: false,
  events: [],
};

// Universe A: movement wins first. No-op acceptance must wait, reread N+1,
// and refuse to consume lifecycle state issued against N.
const movementFirst = withJourneyProgressionProjectLock({
  projectId,
  locksApi: fakeLocks,
  browserRuntime: true,
  callback: async () => {
    const seen = shared.revision;
    shared.events.push(`move-read-${seen}`);
    assert.equal(seen, 0);
    await new Promise((resolve) => setTimeout(resolve, 15));
    shared.revision = 1;
    shared.movementCommitted = true;
    shared.events.push("move-commit-1");
    return "movement-committed";
  },
});

const noopSecond = withJourneyProgressionProjectLock({
  projectId,
  locksApi: fakeLocks,
  browserRuntime: true,
  callback: async () => {
    const seen = shared.revision;
    shared.events.push(`noop-read-${seen}`);
    if (seen !== 0) {
      const error = new Error("stale no-op recommendation");
      error.code = "MOVIE_MENTOR_JOURNEY_PROGRESSION_STALE";
      throw error;
    }
    shared.noopConsumed = true;
    return "noop-consumed";
  },
});

const [movementResult, noopResult] = await Promise.allSettled([movementFirst, noopSecond]);
assert.equal(movementResult.status, "fulfilled");
assert.equal(movementResult.value, "movement-committed");
assert.equal(noopResult.status, "rejected");
assert.equal(noopResult.reason?.code, "MOVIE_MENTOR_JOURNEY_PROGRESSION_STALE");
assert.equal(shared.revision, 1);
assert.equal(shared.movementCommitted, true);
assert.equal(shared.noopConsumed, false, "Stale no-op lifecycle state must not survive a winning movement commit.");
assert.deepEqual(shared.events, ["move-read-0", "move-commit-1", "noop-read-1"]);

// Universe B: no-op consumption wins first. Movement waits. The Journey revision
// remains N, but durable recommendation lifecycle truth is now consumed, so the
// waiting movement acceptance must refuse to proceed with that recommendation.
shared.revision = 0;
shared.movementCommitted = false;
shared.noopConsumed = false;
shared.events = [];

const noopFirst = withJourneyProgressionProjectLock({
  projectId,
  locksApi: fakeLocks,
  browserRuntime: true,
  callback: async () => {
    const seen = shared.revision;
    shared.events.push(`noop-read-${seen}`);
    assert.equal(seen, 0);
    await new Promise((resolve) => setTimeout(resolve, 15));
    shared.noopConsumed = true;
    shared.events.push("noop-consume");
    return "noop-consumed";
  },
});

const movementSecond = withJourneyProgressionProjectLock({
  projectId,
  locksApi: fakeLocks,
  browserRuntime: true,
  callback: async () => {
    const seen = shared.revision;
    shared.events.push(`move-read-${seen}`);
    if (shared.noopConsumed) {
      const error = new Error("recommendation no longer current");
      error.code = "JOURNEY_RECOMMENDATION_NOT_CURRENT";
      throw error;
    }
    shared.revision = seen + 1;
    shared.movementCommitted = true;
    return "movement-committed";
  },
});

const [noopFirstResult, movementSecondResult] = await Promise.allSettled([noopFirst, movementSecond]);
assert.equal(noopFirstResult.status, "fulfilled");
assert.equal(movementSecondResult.status, "rejected");
assert.equal(movementSecondResult.reason?.code, "JOURNEY_RECOMMENDATION_NOT_CURRENT");
assert.equal(shared.revision, 0, "No-op-first universe must not manufacture Journey movement.");
assert.equal(shared.noopConsumed, true);
assert.equal(shared.movementCommitted, false);
assert.deepEqual(shared.events, ["noop-read-0", "noop-consume", "move-read-0"]);

// Structural law: both production paths import the same lock module and use the
// exact same projectId-derived lock namespace.
assert.ok(progressionSource.includes('from "./JourneyProgressionProjectLock.js"'));
assert.ok(acceptanceSource.includes('from "./JourneyProgressionProjectLock.js"'));
assert.ok(progressionSource.includes("projectId: pid"));
assert.ok(acceptanceSource.includes("projectId: pid"));
assert.equal(lockNameForProject(projectId), `iband:movie-mentor:journey-progression:${projectId}`);

console.log("Journey mixed-operation project lock verification passed.");
console.log("- movement-first forces waiting no-op acceptance to observe stale N+1 reality");
console.log("- no-op-first forces waiting movement acceptance to observe consumed lifecycle reality");
console.log("- mixed operations share one exact per-project browser lock domain");
console.log("- Frankenstein Journey/lifecycle combinations are rejected");

import assert from "node:assert/strict";
import createJourneyDurableAuthorityStore from "../src/components/studio/mentor/JourneyDurableAuthorityStore.js";
import {
  createAuthorityRecommendationRecord,
} from "../src/components/studio/mentor/JourneyAuthorityRecommendationLifecycle.js";
import {
  commitJourneyAuthorityTransitionUnderLock,
} from "../src/components/studio/mentor/JourneyAuthorityAtomicTransition.js";

function storageAdapter() {
  const map = new Map();
  return {
    getItem(key) { return map.has(key) ? map.get(key) : null; },
    setItem(key, value) { map.set(key, String(value)); },
    removeItem(key) { map.delete(key); },
  };
}

function journey(revision, stageId = "idea", taskId = "capture-core-idea") {
  const receipts = [];
  for (let index = 1; index <= revision; index += 1) {
    receipts.push({
      operationId: `op-${index}`,
      authorityId: `authority-${index}`,
      fromRevision: index - 1,
      toRevision: index,
    });
  }
  return {
    currentStageId: stageId,
    currentTaskId: taskId,
    progression: {
      schemaVersion: 1,
      revision,
      lastCommittedOperation: receipts.at(-1) || null,
      committedOperations: receipts,
    },
  };
}

function reference(id, projectId, revision, taskId) {
  return {
    recommendationId: id,
    recommendationFingerprint: `fp-${id}`,
    projectId,
    issuedAgainst: { progressionRevision: revision },
    target: { stageId: "idea", taskId },
    lifecycle: { current: true, terminalReason: null },
  };
}

const project = {
  id: "movie-project-atomic-001",
  identity: {
    domain: "iband.movie-mentor.project",
    schema: 1,
    issuance: "secure-web-crypto",
    legacy: false,
  },
};
const storage = storageAdapter();
const store = createJourneyDurableAuthorityStore({ storage, browserRuntime: false });

// Birth authority at N=0.
await store.bootstrap({ project, nativeJourney: journey(0) });
let authority = store.read(project.id, { project });

// Seed two current transaction-critical recommendations against N=0 through
// authority generation CAS. Journey stays at N=0 while G becomes 1.
const recA = createAuthorityRecommendationRecord(reference("R-A", project.id, 0, "identify-known-context"));
const recB = createAuthorityRecommendationRecord(reference("R-B", project.id, 0, "identify-open-threads"));
await store.compareAndCommit({
  project,
  expectedGeneration: authority.authority.generation,
  expectedProgressionRevision: 0,
  nextJourney: authority.journey,
  mutateRecord(candidate) {
    candidate.recommendations = [recA, recB];
    return candidate;
  },
});
authority = store.read(project.id, { project });
assert.equal(authority.authority.generation, 1);
assert.equal(authority.journey.progression.revision, 0);

// Acceptance with movement: one authority write must produce N+1/G+1,
// consume exact R-A and invalidate the other old-N current recommendation.
const movementJourney = journey(1, "idea", "identify-known-context");
const moveResult = commitJourneyAuthorityTransitionUnderLock({
  authorityStore: store,
  resolvedAuthority: {
    project,
    projectId: project.id,
    authorityGeneration: 1,
    progressionRevision: 0,
  },
  nextJourney: movementJourney,
  operationId: "accept-R-A",
  acceptedRecommendationId: "R-A",
  recommendationFingerprint: "fp-R-A",
  creatorActId: "creator-act-A",
  withoutMovement: false,
  serialization: { mode: "test-under-lock", lockName: "test", crossTabSerialized: true },
});
assert.equal(moveResult.authorityGeneration, 2);
assert.equal(moveResult.progressionRevision, 1);
authority = store.read(project.id, { project });
assert.equal(authority.journey.progression.revision, 1);
assert.equal(authority.authority.generation, 2);
const afterA = authority.recommendations.find((item) => item.recommendationId === "R-A");
const afterB = authority.recommendations.find((item) => item.recommendationId === "R-B");
assert.equal(afterA.lifecycle.current, false);
assert.equal(afterA.lifecycle.terminalReason, "consumed");
assert.equal(afterA.lifecycle.operationId, "accept-R-A");
assert.equal(afterA.lifecycle.creatorActId, "creator-act-A");
assert.equal(afterA.lifecycle.terminalProgressionRevision, 1);
assert.equal(afterB.lifecycle.current, false);
assert.equal(afterB.lifecycle.terminalReason, "invalidated-by-progression");
assert.equal(afterB.lifecycle.operationId, "accept-R-A");
assert.equal(afterB.lifecycle.terminalProgressionRevision, 1);
assert.equal(authority.lastTransition.fromProgressionRevision, 0);
assert.equal(authority.lastTransition.toProgressionRevision, 1);

// Seed a new recommendation against N=1 without progressing Journey.
const recC = createAuthorityRecommendationRecord(reference("R-C", project.id, 1, "identify-open-threads"));
await store.compareAndCommit({
  project,
  expectedGeneration: 2,
  expectedProgressionRevision: 1,
  nextJourney: authority.journey,
  mutateRecord(candidate) {
    candidate.recommendations = [...candidate.recommendations, recC];
    return candidate;
  },
});
authority = store.read(project.id, { project });
assert.equal(authority.authority.generation, 3);
assert.equal(authority.journey.progression.revision, 1);

// No-op acceptance: Journey N must stay exactly 1 while authority generation
// advances to 4 and R-C becomes consumed in that same record replacement.
const noOpResult = commitJourneyAuthorityTransitionUnderLock({
  authorityStore: store,
  resolvedAuthority: {
    project,
    projectId: project.id,
    authorityGeneration: 3,
    progressionRevision: 1,
  },
  nextJourney: authority.journey,
  operationId: "noop-R-C",
  acceptedRecommendationId: "R-C",
  recommendationFingerprint: "fp-R-C",
  creatorActId: "creator-act-C",
  withoutMovement: true,
  serialization: { mode: "test-under-lock", lockName: "test", crossTabSerialized: true },
});
assert.equal(noOpResult.authorityGeneration, 4);
assert.equal(noOpResult.progressionRevision, 1);
authority = store.read(project.id, { project });
assert.equal(authority.journey.progression.revision, 1);
assert.equal(authority.authority.generation, 4);
const afterC = authority.recommendations.find((item) => item.recommendationId === "R-C");
assert.equal(afterC.lifecycle.terminalReason, "consumed");
assert.equal(afterC.lifecycle.consumedWithoutMovement, true);
assert.equal(afterC.lifecycle.terminalProgressionRevision, 1);
assert.equal(authority.lastTransition.withoutMovement, true);

// Stale authority generation cannot write either Journey or lifecycle.
const beforeStale = JSON.stringify(authority);
assert.throws(() => commitJourneyAuthorityTransitionUnderLock({
  authorityStore: store,
  resolvedAuthority: {
    project,
    projectId: project.id,
    authorityGeneration: 3,
    progressionRevision: 1,
  },
  nextJourney: journey(2, "story-direction", "story-foundation"),
  operationId: "stale-op",
  withoutMovement: false,
  serialization: { mode: "test-under-lock", lockName: "test", crossTabSerialized: true },
}), (error) => error?.code === "JOURNEY_AUTHORITY_GENERATION_STALE");
assert.equal(JSON.stringify(store.read(project.id, { project })), beforeStale);

console.log("Journey authority atomic transition verification passed.");
console.log("- acceptance movement commits Journey + consumption + invalidation in one authority generation");
console.log("- ordinary authority generation is distinct from Journey progression revision");
console.log("- no-op acceptance consumes recommendation while Journey revision remains unchanged");
console.log("- stale generation performs zero authoritative mutation");

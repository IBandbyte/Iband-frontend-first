import assert from "node:assert/strict";
import createJourneyDurableAuthorityStore from "../src/components/studio/mentor/JourneyDurableAuthorityStore.js";
import { commitJourneyAuthorityTransitionUnderLock } from "../src/components/studio/mentor/JourneyAuthorityAtomicTransition.js";

function storageAdapter() {
  const map = new Map();
  return {
    getItem(key) { return map.has(key) ? map.get(key) : null; },
    setItem(key, value) { map.set(key, String(value)); },
    removeItem(key) { map.delete(key); },
  };
}

function journey(revision, taskId = "capture-core-idea") {
  const receipts = [];
  for (let index = 1; index <= revision; index += 1) {
    receipts.push({ operationId: `op-${index}`, authorityId: `authority-${index}`, fromRevision: index - 1, toRevision: index });
  }
  return {
    currentStageId: "idea",
    currentTaskId: taskId,
    progression: {
      schemaVersion: 1,
      revision,
      lastCommittedOperation: receipts.at(-1) || null,
      committedOperations: receipts,
    },
  };
}

function reference({ id, projectId, revision, fingerprint = `fp-${id}`, current = true } = {}) {
  return {
    recommendationId: id,
    recommendationFingerprint: fingerprint,
    projectId,
    issuedAgainst: { progressionRevision: revision },
    target: { stageId: "idea", taskId: "identify-known-context" },
    lifecycle: { current, terminalReason: current ? null : "consumed" },
  };
}

const project = {
  id: "movie-project-materialize-001",
  identity: { domain: "iband.movie-mentor.project", schema: 1, issuance: "secure-web-crypto", legacy: false },
};
const store = createJourneyDurableAuthorityStore({ storage: storageAdapter(), browserRuntime: false });
await store.bootstrap({ project, nativeJourney: journey(0) });

// Exact certified evidence may enter authority only at the creator's mechanical
// acceptance boundary and must be consumed in the same authority generation.
let authority = store.read(project.id, { project });
const materialized = commitJourneyAuthorityTransitionUnderLock({
  authorityStore: store,
  resolvedAuthority: {
    project,
    projectId: project.id,
    authorityGeneration: authority.authority.generation,
    progressionRevision: 0,
  },
  nextJourney: journey(1, "identify-known-context"),
  operationId: "accept-R-new",
  acceptedRecommendationId: "R-new",
  recommendationFingerprint: "fp-R-new",
  acceptedRecommendationReference: reference({ id: "R-new", projectId: project.id, revision: 0 }),
  creatorActId: "creator-act-new",
  withoutMovement: false,
  serialization: { mode: "test-under-lock", lockName: "test", crossTabSerialized: true },
});
assert.equal(materialized.authorityGeneration, 1);
authority = store.read(project.id, { project });
const rNew = authority.recommendations.find((item) => item.recommendationId === "R-new");
assert.ok(rNew);
assert.equal(rNew.lifecycle.current, false);
assert.equal(rNew.lifecycle.terminalReason, "consumed");
assert.equal(rNew.lifecycle.operationId, "accept-R-new");

// Malformed/mismatched caller evidence cannot be materialised and must produce zero write.
const beforeMismatch = JSON.stringify(authority);
assert.throws(() => commitJourneyAuthorityTransitionUnderLock({
  authorityStore: store,
  resolvedAuthority: {
    project,
    projectId: project.id,
    authorityGeneration: 1,
    progressionRevision: 1,
  },
  nextJourney: journey(1, "identify-known-context"),
  operationId: "noop-R-bad",
  acceptedRecommendationId: "R-bad",
  recommendationFingerprint: "fp-R-bad",
  acceptedRecommendationReference: reference({ id: "R-bad", projectId: project.id, revision: 0 }),
  creatorActId: "creator-act-bad",
  withoutMovement: true,
  serialization: { mode: "test-under-lock", lockName: "test", crossTabSerialized: true },
}), (error) => error?.code === "JOURNEY_AUTHORITY_RECOMMENDATION_MATERIALIZATION_CONFLICT");
assert.equal(JSON.stringify(store.read(project.id, { project })), beforeMismatch);

// Existing durable terminal truth can never be resurrected by supplying a fresh-looking
// caller reference for the same recommendation ID.
assert.throws(() => commitJourneyAuthorityTransitionUnderLock({
  authorityStore: store,
  resolvedAuthority: {
    project,
    projectId: project.id,
    authorityGeneration: 1,
    progressionRevision: 1,
  },
  nextJourney: journey(1, "identify-known-context"),
  operationId: "second-accept-R-new",
  acceptedRecommendationId: "R-new",
  recommendationFingerprint: "fp-R-new",
  acceptedRecommendationReference: reference({ id: "R-new", projectId: project.id, revision: 1 }),
  creatorActId: "creator-act-resurrection",
  withoutMovement: true,
  serialization: { mode: "test-under-lock", lockName: "test", crossTabSerialized: true },
}), (error) => ["JOURNEY_AUTHORITY_RECOMMENDATION_STALE", "JOURNEY_AUTHORITY_RECOMMENDATION_NOT_CURRENT"].includes(error?.code));
assert.equal(JSON.stringify(store.read(project.id, { project })), beforeMismatch);

console.log("Journey authority acceptance materialization verification passed.");
console.log("- absent certified recommendation may be materialised and consumed atomically");
console.log("- mismatched materialization evidence performs zero write");
console.log("- existing terminal authority lifecycle cannot be resurrected by caller evidence");

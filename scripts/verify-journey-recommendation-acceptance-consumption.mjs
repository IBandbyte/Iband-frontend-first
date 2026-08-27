import assert from "node:assert/strict";
import createJourneyDurableAuthorityStore from "../src/components/studio/mentor/JourneyDurableAuthorityStore.js";
import createJourneyProgressionExecutionRuntime from "../src/components/studio/mentor/JourneyProgressionExecutionRuntime.js";
import createJourneyRecommendationEnvelope from "../src/components/studio/mentor/JourneyRecommendationEnvelope.js";
import createJourneyRecommendationAcceptanceExecutionRuntime from "../src/components/studio/mentor/JourneyRecommendationAcceptanceExecutionRuntime.js";

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function storageAdapter() {
  const map = new Map();
  return {
    getItem(key) { return map.has(key) ? map.get(key) : null; },
    setItem(key, value) { map.set(key, String(value)); },
    removeItem(key) { map.delete(key); },
  };
}

const projectId = "movie-project-recommendation-consumption";
const initialJourney = {
  projectId,
  status: "active",
  currentStageId: "story-direction",
  currentTaskId: "premise",
  resumePoint: { stageId: "story-direction", taskId: "premise" },
  progression: {
    schemaVersion: 1,
    revision: 0,
    lastCommittedOperation: null,
    committedOperations: [],
  },
  stages: [
    { id: "story-direction", status: "active", tasks: [{ id: "premise", status: "active" }] },
    { id: "character-foundations", status: "not-started", tasks: [{ id: "protagonist", status: "not-started" }] },
  ],
};

const project = {
  id: projectId,
  creatorType: "video",
  identity: { domain: "iband.movie-mentor.project", schema: 1, issuance: "secure-web-crypto", legacy: false },
  metadata: { creatorMode: "ai-movie", projectJourney: clone(initialJourney) },
};
const authorityStore = createJourneyDurableAuthorityStore({ storage: storageAdapter(), browserRuntime: false });
const identityRuntime = {
  memory: {
    getProject(id) { return id === projectId ? clone(project) : null; },
    getPersistedProject(id) { return id === projectId ? clone(project) : null; },
  },
  getPreferredJourney(id) {
    if (id !== projectId) return null;
    const authority = authorityStore.read(projectId, { project });
    return authority
      ? { status: "authority", projectJourney: clone(authority.journey), progressionRevision: authority.journey.progression?.revision ?? 0 }
      : { status: "legacy-unbootstrapped", projectJourney: clone(initialJourney), progressionRevision: 0 };
  },
};

const journeyEngine = {
  getStage(journey, stageId) {
    return journey.stages.find((stage) => stage.id === stageId) || null;
  },
  setCurrentPosition(journey, { stageId, taskId = null, sceneId = null, note = null } = {}) {
    const next = clone(journey);
    next.currentStageId = stageId;
    const stage = next.stages.find((item) => item.id === stageId);
    next.currentTaskId = taskId || stage?.tasks?.[0]?.id || null;
    next.resumePoint = { stageId, taskId: next.currentTaskId, sceneId, note };
    return next;
  },
};

const progressionRuntime = createJourneyProgressionExecutionRuntime({ journeyEngine, identityRuntime, authorityStore });
const acceptanceRuntime = createJourneyRecommendationAcceptanceExecutionRuntime({ identityRuntime, progressionRuntime, authorityStore });

const planningEvidence = {
  contractVersion: "1.1.0",
  currentStageId: "story-direction",
  currentTaskId: "premise",
  creatorAuthorityRevision: 71,
  recommendation: {
    recommendedStageId: "character-foundations",
    recommendedTaskId: "protagonist",
  },
  clarification: { required: false, reasons: [] },
  provenance: { turnRevision: 70, bridgeVersion: "1.5.0" },
};

const recommendation = createJourneyRecommendationEnvelope({
  projectId,
  projectJourney: initialJourney,
  planningEvidence,
  issuedAt: "2026-08-27T22:00:00.000Z",
});

const expectedOperationId = acceptanceRuntime.createOperationId(recommendation.recommendationId);
assert.ok(expectedOperationId.includes(recommendation.recommendationId), "Durable operation identity must bind the immutable recommendation ID.");

const first = await acceptanceRuntime.execute({
  recommendationEnvelope: recommendation,
  projectId,
  creatorActId: "creator-acceptance-original",
  creatorGesture: true,
  creatorAuthorityRevision: 71,
  turnRevision: 70,
  issuedAt: "2026-08-27T22:01:00.000Z",
});

assert.equal(first.status, "committed");
assert.equal(first.operationId, expectedOperationId);
assert.equal(first.receipt.operationId, expectedOperationId);
assert.equal(first.receipt.creatorActId, "creator-acceptance-original");
assert.equal(first.progressionRevision, 1);
assert.equal(first.authorityCommitted, true);

let durableJourney = authorityStore.read(projectId, { project }).journey;
assert.equal(durableJourney.progression.revision, 1);
assert.equal(durableJourney.progression.committedOperations.length, 1);
assert.equal(durableJourney.currentStageId, "character-foundations");
assert.equal(durableJourney.currentTaskId, "protagonist");
assert.equal(project.metadata.projectJourney.progression.revision, 0, "Creator Memory projection must remain demoted.");

// Lost ACK universe: retry the same immutable recommendation with deliberately stale/new
// caller metadata. Authority receipt identity must win before freshness can mint anything new.
const retry = await acceptanceRuntime.execute({
  recommendationEnvelope: recommendation,
  projectId,
  creatorActId: "creator-acceptance-accidental-retry",
  creatorGesture: true,
  creatorAuthorityRevision: 999,
  turnRevision: 999,
  clarificationRequired: true,
  issuedAt: "2026-08-27T22:02:00.000Z",
});

assert.equal(retry.status, "already-committed");
assert.equal(retry.operationId, expectedOperationId);
assert.equal(retry.newCreatorAuthorityIssued, false);
assert.equal(retry.receipt.creatorActId, "creator-acceptance-original", "Retry must return original committed creator act.");

durableJourney = authorityStore.read(projectId, { project }).journey;
assert.equal(durableJourney.progression.revision, 1, "Retry must not create revision 2.");
assert.equal(durableJourney.progression.committedOperations.length, 1, "Retry must not create a second receipt.");

const storedReceipt = acceptanceRuntime.findCommittedReceipt(durableJourney, expectedOperationId);
assert.equal(storedReceipt.operationId, expectedOperationId);
assert.equal(storedReceipt.creatorActId, "creator-acceptance-original");
assert.equal(storedReceipt.fromRevision, 0);
assert.equal(storedReceipt.toRevision, 1);

console.log("Journey recommendation acceptance consumption verification passed.");
console.log("- immutable recommendationId binds the Journey Authority operationId");
console.log("- original creatorActId survives in the authoritative receipt");
console.log("- lost-response retry returns the original authority receipt");
console.log("- retry mints no second creator authority or progression revision");
console.log("- Creator Memory projection is not required to advance");
console.log("- duplicate lookup occurs against authority before freshness re-evaluation");

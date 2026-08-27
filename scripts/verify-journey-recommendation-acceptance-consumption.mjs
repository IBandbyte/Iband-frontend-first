import assert from "node:assert/strict";
import createJourneyProgressionExecutionRuntime from "../src/components/studio/mentor/JourneyProgressionExecutionRuntime.js";
import createJourneyRecommendationEnvelope from "../src/components/studio/mentor/JourneyRecommendationEnvelope.js";
import createJourneyRecommendationAcceptanceExecutionRuntime from "../src/components/studio/mentor/JourneyRecommendationAcceptanceExecutionRuntime.js";

function clone(value) {
  return JSON.parse(JSON.stringify(value));
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

let durableJourney = clone(initialJourney);
const identityRuntime = {
  memory: {
    getProject(id) {
      if (id !== projectId) return null;
      return { id: projectId, metadata: { projectJourney: clone(durableJourney) } };
    },
  },
  async persistJourney(id, nextJourney, { expectedProgressionRevision } = {}) {
    assert.equal(id, projectId);
    assert.equal(durableJourney.progression.revision, expectedProgressionRevision, "CAS must match durable revision.");
    durableJourney = clone(nextJourney);
    return { id: projectId, metadata: { projectJourney: clone(durableJourney) } };
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

const progressionRuntime = createJourneyProgressionExecutionRuntime({ journeyEngine, identityRuntime });
const acceptanceRuntime = createJourneyRecommendationAcceptanceExecutionRuntime({ identityRuntime, progressionRuntime });

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
assert.equal(durableJourney.progression.revision, 1);
assert.equal(durableJourney.progression.committedOperations.length, 1);
assert.equal(durableJourney.currentStageId, "character-foundations");
assert.equal(durableJourney.currentTaskId, "protagonist");

// Lost ACK universe: the UI retries the same immutable recommendation but has
// accidentally minted a new creatorActId. Durable recommendation operation
// identity must win before a second authority is minted.
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
assert.equal(retry.receipt.creatorActId, "creator-acceptance-original", "Retry must return the original committed creator act.");
assert.equal(durableJourney.progression.revision, 1, "Retry must not create revision 2.");
assert.equal(durableJourney.progression.committedOperations.length, 1, "Retry must not create a second receipt.");

const storedReceipt = acceptanceRuntime.findCommittedReceipt(durableJourney, expectedOperationId);
assert.equal(storedReceipt.operationId, expectedOperationId);
assert.equal(storedReceipt.creatorActId, "creator-acceptance-original");
assert.equal(storedReceipt.fromRevision, 0);
assert.equal(storedReceipt.toRevision, 1);

console.log("Journey recommendation acceptance consumption verification passed.");
console.log("- immutable recommendationId binds the durable operationId");
console.log("- original creatorActId survives in the committed receipt");
console.log("- lost-response retry returns the original receipt");
console.log("- retry mints no second creator authority");
console.log("- retry creates no second progression revision");
console.log("- duplicate lookup occurs before freshness re-evaluation");

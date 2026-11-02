import assert from "node:assert/strict";
import certifyJourneyRecommendationResume from "../src/components/studio/mentor/JourneyRecommendationResumeRecovery.js";

// Algorithm-level adversarial fixture, not a Studio-injected memory authority.
// A second read observes externally completed terminal evidence; the recovery
// coordinator must converge in exactly one bounded retry without rewriting it.
const projectId = "movie-project-bounded-retry";
const recommendationId = "journey-recommendation:bounded-retry";
const fingerprint = "bounded-retry-fingerprint";
const operationId = `journey-recommendation-acceptance:${recommendationId}`;
const clone = value => JSON.parse(JSON.stringify(value));
const operation = {
  operationId, authorityId: "authority-1", creatorActId: "creator-act-1",
  fromRevision: 0, toRevision: 1,
  recommendation: { recommendationId, fingerprint, disposition: "consumed", issuedAgainstProgressionRevision: 0 },
};
const journey = {
  projectId, currentStageId: "character-foundations", currentTaskId: "protagonist",
  progression: { schemaVersion: 1, revision: 1, lastCommittedOperation: operation, committedOperations: [clone(operation)] },
};
let state = {
  projects: [{ id: projectId, creatorType: "video", metadata: { creatorMode: "ai-movie", projectJourney: journey } }],
  projectMemories: [{
    id: `memory:${recommendationId}`, projectId,
    metadata: { recommendationReference: {
      domain: "iband.movie-mentor.journey-recommendation-reference", schema: 2,
      recommendationId, recommendationFingerprint: fingerprint, projectId,
      issuedAgainst: { progressionRevision: 0, currentStageId: "story-direction", currentTaskId: "premise", creatorAuthorityRevision: 9, turnRevision: 8 },
      target: { stageId: "character-foundations", taskId: "protagonist" },
      lifecycle: { current: true, terminalReason: null },
    } },
  }],
  conversations: [], sessionHandoffs: [],
};
let reads = 0;
let externallyConverged = false;
let writes = 0;
const memory = {
  getState() {
    reads += 1;
    if (reads === 2 && !externallyConverged) {
      externallyConverged = true;
      state = clone(state);
      state.projectMemories[0].metadata.recommendationReference.lifecycle = {
        current: false, terminalReason: "consumed",
        consumedByOperationId: operationId, consumedByCreatorActId: "creator-act-1",
        consumedAtProgressionRevision: 1,
      };
    }
    return clone(state);
  },
  getProject(id) { return clone(state.projects.find(project => project.id === id) || null); },
  replaceState(next) { writes += 1; state = clone(next); return clone(state); },
};
const result = certifyJourneyRecommendationResume({ identityRuntime: { memory }, projectId });
assert.equal(externallyConverged, true, "Fixture must change evidence between first and second recovery reads.");
assert.equal(result.status, "certified", "Bounded retry must certify the externally consumed recommendation.");
assert.equal(result.recoveryAttempts, 2, "Exactly one retry is permitted.");
assert.equal(result.recommendationActionsBlocked, false);
assert.equal(writes, 0, "Recovery must not overwrite independently completed terminal evidence.");
assert.equal(state.projectMemories[0].metadata.recommendationReference.lifecycle.terminalReason, "consumed");
assert.deepEqual(state.projects[0].metadata.projectJourney, journey, "Recovery cannot rewrite Journey authority.");
console.log("GREEN: original adversarial mid-read convergence semantics preserved at recovery algorithm boundary with exactly one retry and zero recovery writes.");

import assert from "node:assert/strict";
import {
  createAuthorityMaterializationReference,
  createJourneyRecommendationAcceptanceExecutionRuntime,
} from "../src/components/studio/mentor/JourneyRecommendationAcceptanceExecutionRuntime.js";

const projectId = "movie-project-materialization-handoff";
const recommendationEnvelope = {
  recommendationId: "journey-recommendation:materialization-handoff",
  fingerprint: "fingerprint-materialization-handoff",
  issuedAgainst: {
    progressionRevision: 2,
    currentStageId: "idea",
    currentTaskId: "premise",
    creatorAuthorityRevision: 7,
    turnRevision: 6,
  },
  target: { stageId: "characters", taskId: "protagonist" },
  authority: { class: "mentor-advisory", mayAdvanceJourney: false },
};

const materialized = createAuthorityMaterializationReference(recommendationEnvelope, projectId);
assert.equal(materialized.recommendationId, recommendationEnvelope.recommendationId);
assert.equal(materialized.recommendationFingerprint, recommendationEnvelope.fingerprint);
assert.equal(materialized.projectId, projectId);
assert.equal(materialized.issuedAgainst.progressionRevision, 2);
assert.deepEqual(materialized.target, recommendationEnvelope.target);
assert.deepEqual(materialized.lifecycle, { current: true, terminalReason: null });

const durableJourney = {
  currentStageId: "idea",
  currentTaskId: "premise",
  progression: { schemaVersion: 1, revision: 2, lastCommittedOperation: null, committedOperations: [] },
  stages: [
    { id: "idea", tasks: [{ id: "premise" }] },
    { id: "characters", tasks: [{ id: "protagonist" }] },
  ],
};

let progressionInput = null;
const identityRuntime = {
  memory: { getProject() { return { metadata: { projectJourney: durableJourney } }; } },
  getPreferredJourney() { return { status: "authority", projectJourney: durableJourney }; },
};
const progressionRuntime = {
  async execute(input) {
    progressionInput = input;
    return {
      status: "committed",
      projectJourney: { ...durableJourney, currentStageId: "characters", currentTaskId: "protagonist" },
      progressionRevision: 3,
    };
  },
};

const runtime = createJourneyRecommendationAcceptanceExecutionRuntime({ identityRuntime, progressionRuntime });
await runtime.execute({
  recommendationEnvelope,
  projectId,
  creatorActId: "creator-act-materialization",
  creatorGesture: true,
  creatorAuthorityRevision: 7,
  turnRevision: 6,
  clarificationRequired: false,
});

assert.ok(progressionInput, "Acceptance must call progression runtime.");
assert.equal(progressionInput.input.recommendationId, recommendationEnvelope.recommendationId);
assert.equal(progressionInput.input.recommendationFingerprint, recommendationEnvelope.fingerprint);
assert.deepEqual(progressionInput.input.acceptedRecommendationReference, materialized);

assert.throws(
  () => createAuthorityMaterializationReference({ recommendationId: "x", fingerprint: "" }, projectId),
  (error) => error?.code === "JOURNEY_RECOMMENDATION_ACCEPTANCE_MATERIALIZATION_INVALID"
);

console.log("Journey acceptance authority materialization handoff verification passed.");
console.log("- canonical acceptance envelope becomes exact authority lifecycle materialization evidence");
console.log("- movement acceptance carries that evidence into progression transaction input");
console.log("- incomplete recommendation identity fails closed before authority materialization");

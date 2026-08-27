import assert from "node:assert/strict";
import createCanonicalJourneyRecommendationIdentity from "../src/components/studio/mentor/JourneyRecommendationIdentity.js";
import createJourneyRecommendationEnvelope from "../src/components/studio/mentor/JourneyRecommendationEnvelope.js";
import { buildRecommendationReferenceEvidence } from "../src/components/studio/mentor/MovieMentorStudioIdentityRuntime.js";
import { createRecommendationAcceptanceOperationId } from "../src/components/studio/mentor/JourneyRecommendationAcceptanceExecutionRuntime.js";

const projectId = "movie-project-canonical-recommendation";
const projectJourney = {
  projectId,
  currentStageId: "story-direction",
  currentTaskId: "premise",
  progression: { schemaVersion: 1, revision: 21, committedOperations: [], lastCommittedOperation: null },
  stages: [
    { id: "story-direction", tasks: [{ id: "premise" }] },
    { id: "character-foundations", tasks: [{ id: "protagonist" }] },
  ],
};
const planningEvidence = {
  contractVersion: "1.1.0",
  authority: "advisory-only",
  creatorConfirmed: false,
  mayCreateCanon: false,
  mayAdvanceJourney: false,
  currentStageId: "story-direction",
  currentTaskId: "premise",
  creatorAuthorityRevision: 66,
  semanticDirection: { nextAction: { label: "Develop the protagonist" } },
  recommendation: {
    recommendedStageId: "character-foundations",
    recommendedTaskId: "protagonist",
    reasonCodes: ["story-advice-considered"],
    alternatives: [],
    confidence: 0.9,
  },
  clarification: { required: false, reasons: [] },
  provenance: { turnRevision: 65, authorityRevision: 66, bridgeVersion: "1.5.0" },
};

const identity = createCanonicalJourneyRecommendationIdentity({ projectId, projectJourney, planningEvidence });
assert.ok(identity, "Canonical recommendation identity must be minted for valid advisory planning evidence.");

const envelope = createJourneyRecommendationEnvelope({ projectId, projectJourney, planningEvidence });
assert.equal(envelope.recommendationId, identity.recommendationId, "Envelope must reuse canonical recommendationId.");
assert.equal(envelope.fingerprint, identity.fingerprint, "Envelope must reuse canonical fingerprint.");
assert.deepEqual(envelope.recommendationIdentity, identity, "Envelope must carry canonical identity intact.");

const memoryReference = buildRecommendationReferenceEvidence({
  projectId,
  creatorSessionId: "movie-session-canonical",
  projectJourney,
  planningEvidence,
  turnRevision: 66,
});
assert.ok(memoryReference, "Durable recommendation reference must be created.");
assert.equal(memoryReference.recommendationId, identity.recommendationId, "Creator Memory reference must reuse canonical recommendationId.");
assert.equal(memoryReference.recommendationFingerprint, identity.fingerprint, "Creator Memory reference must reuse canonical fingerprint.");
assert.equal(memoryReference.issuedAgainst.progressionRevision, 21, "Memory reference must retain exact issued progression revision.");
assert.equal(memoryReference.target.stageId, identity.target.stageId);
assert.equal(memoryReference.target.taskId, identity.target.taskId);

const operationId = createRecommendationAcceptanceOperationId(identity.recommendationId);
assert.equal(operationId, `journey-recommendation-acceptance:${identity.recommendationId}`, "Acceptance operation must be derived from the exact canonical recommendationId.");

const changedJourneyIdentity = createCanonicalJourneyRecommendationIdentity({
  projectId,
  projectJourney: { ...projectJourney, progression: { ...projectJourney.progression, revision: 22 } },
  planningEvidence,
});
assert.notEqual(changedJourneyIdentity.recommendationId, identity.recommendationId, "A different durable progression reality must mint a different recommendation identity.");

const changedTargetIdentity = createCanonicalJourneyRecommendationIdentity({
  projectId,
  projectJourney,
  planningEvidence: {
    ...planningEvidence,
    recommendation: { ...planningEvidence.recommendation, recommendedTaskId: null },
  },
});
assert.notEqual(changedTargetIdentity.recommendationId, identity.recommendationId, "A different target must mint a different recommendation identity.");

console.log("Journey recommendation canonical identity verification passed.");
console.log("- one canonical identity binds durable recommendation reality");
console.log("- envelope reuses the canonical recommendationId/fingerprint");
console.log("- Creator Memory reference reuses the same identity and progression binding");
console.log("- acceptance operation identity derives from the same recommendationId");
console.log("- changed durable reality or target produces a different recommendation identity");

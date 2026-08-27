import assert from "node:assert/strict";
import { createJourneyRecommendationEnvelope } from "../src/components/studio/mentor/JourneyRecommendationEnvelope.js";
import { createRecommendationAcceptanceAuthority } from "../src/components/studio/mentor/JourneyRecommendationAcceptanceAuthority.js";
import { validateJourneyPositionAuthority } from "../src/components/studio/mentor/JourneyPositionAuthorityControl.js";

const projectId = "movie-project-acceptance";
const journey = {
  projectId,
  currentStageId: "story-direction",
  currentTaskId: "premise",
  progression: { revision: 12, committedOperations: [] },
  stages: [
    { id: "story-direction", tasks: [{ id: "premise" }, { id: "stakes" }] },
    { id: "character-foundations", tasks: [{ id: "protagonist" }] },
  ],
};
const planningEvidence = {
  contractVersion: "1.1.0",
  currentStageId: "story-direction",
  currentTaskId: "premise",
  creatorAuthorityRevision: 51,
  recommendation: { recommendedStageId: "character-foundations", recommendedTaskId: "protagonist" },
  clarification: { required: false, reasons: [] },
  provenance: { turnRevision: 50, bridgeVersion: "1.5.0" },
};
const recommendation = createJourneyRecommendationEnvelope({ projectId, projectJourney: journey, planningEvidence, issuedAt: "2026-08-27T21:00:00.000Z" });

const accepted = createRecommendationAcceptanceAuthority({
  recommendationEnvelope: recommendation,
  projectId,
  projectJourney: journey,
  creatorActId: "creator-accept-recommendation-1",
  creatorGesture: true,
  creatorAuthorityRevision: 51,
  turnRevision: 50,
  clarificationRequired: false,
  issuedAt: "2026-08-27T21:01:00.000Z",
});

assert.equal(accepted.status, "creator-authority-issued");
assert.equal(accepted.recommendationPromotedToAuthority, false);
assert.equal(accepted.positionAuthority.source, "creator-explicit-intent");
assert.equal(accepted.positionAuthority.authorityClass, "creator-authorised");
assert.equal(accepted.positionAuthority.action, "set-position");
assert.equal(accepted.positionAuthority.evidence.acceptedRecommendationId, recommendation.recommendationId);
assert.equal(accepted.positionAuthority.evidence.recommendationAuthorityClass, "advisory-only");
assert.equal(accepted.positionAuthority.evidence.recommendationMayAdvanceJourney, false);
assert.ok(validateJourneyPositionAuthority(accepted.positionAuthority, { projectId, positionRevision: 12, consumedAuthorityIds: [] }).valid);

function expectFailure(code, overrides = {}) {
  assert.throws(() => createRecommendationAcceptanceAuthority({
    recommendationEnvelope: recommendation,
    projectId,
    projectJourney: journey,
    creatorActId: "creator-accept-recommendation-x",
    creatorGesture: true,
    creatorAuthorityRevision: 51,
    turnRevision: 50,
    clarificationRequired: false,
    issuedAt: "2026-08-27T21:02:00.000Z",
    ...overrides,
  }), (error) => error?.code === code);
}

expectFailure("JOURNEY_RECOMMENDATION_CREATOR_ACT_REQUIRED", { creatorGesture: false });
expectFailure("JOURNEY_RECOMMENDATION_CREATOR_ACT_REQUIRED", { creatorActId: "" });
expectFailure("JOURNEY_RECOMMENDATION_NOT_FRESH", { projectJourney: { ...journey, progression: { revision: 13 } } });
expectFailure("JOURNEY_RECOMMENDATION_NOT_FRESH", { creatorAuthorityRevision: 52 });
expectFailure("JOURNEY_RECOMMENDATION_NOT_FRESH", { turnRevision: 51 });
expectFailure("JOURNEY_RECOMMENDATION_NOT_FRESH", { clarificationRequired: true });

const noOpEvidence = {
  ...planningEvidence,
  recommendation: { recommendedStageId: "story-direction", recommendedTaskId: "premise" },
};
const noOpRecommendation = createJourneyRecommendationEnvelope({ projectId, projectJourney: journey, planningEvidence: noOpEvidence });
const noOp = createRecommendationAcceptanceAuthority({
  recommendationEnvelope: noOpRecommendation,
  projectId,
  projectJourney: journey,
  creatorActId: "creator-accept-current-position",
  creatorGesture: true,
  creatorAuthorityRevision: 51,
  turnRevision: 50,
  issuedAt: "2026-08-27T21:03:00.000Z",
});
assert.equal(noOp.status, "accepted-no-movement-required");
assert.equal(noOp.positionAuthority, null);
assert.equal(noOp.movementAuthorised, false);

console.log("Journey recommendation acceptance authority verification passed.");
console.log("- recommendation remains advisory forever");
console.log("- acceptance requires a fresh creator gesture");
console.log("- stale recommendations cannot mint position authority");
console.log("- acceptance creates new creator-explicit position authority");
console.log("- no-op acceptance creates no progression authority");

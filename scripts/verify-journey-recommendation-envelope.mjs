import assert from "node:assert/strict";
import {
  RECOMMENDATION_FRESHNESS,
  createJourneyRecommendationEnvelope,
  validateJourneyRecommendationFreshness,
} from "../src/components/studio/mentor/JourneyRecommendationEnvelope.js";

const projectId = "movie-project-11e4b4";
const baseJourney = {
  projectId,
  currentStageId: "story-direction",
  currentTaskId: "premise",
  progression: { revision: 8 },
  stages: [
    { id: "story-direction", tasks: [{ id: "premise" }, { id: "stakes" }] },
    { id: "character-foundations", tasks: [{ id: "protagonist" }] },
  ],
};
const planningEvidence = {
  contractVersion: "1.1.0",
  currentStageId: "story-direction",
  currentTaskId: "premise",
  creatorAuthorityRevision: 41,
  recommendation: {
    recommendedStageId: "character-foundations",
    recommendedTaskId: "protagonist",
  },
  clarification: { required: false, reasons: [] },
  provenance: { turnRevision: 40, bridgeVersion: "1.5.0" },
};

const envelope = createJourneyRecommendationEnvelope({ projectId, projectJourney: baseJourney, planningEvidence, issuedAt: "2026-08-27T20:00:00.000Z" });
assert.ok(envelope, "A valid advisory recommendation must produce an envelope.");
assert.equal(envelope.authority.class, "advisory-only");
assert.equal(envelope.authority.mayAdvanceJourney, false);
assert.equal(envelope.authority.creatorChoiceRequired, true);

function validate(overrides = {}) {
  return validateJourneyRecommendationFreshness(envelope, {
    projectId,
    projectJourney: baseJourney,
    creatorAuthorityRevision: 41,
    turnRevision: 40,
    clarificationRequired: false,
    ...overrides,
  });
}

assert.equal(validate().status, RECOMMENDATION_FRESHNESS.FRESH, "Exact reality must remain fresh.");
assert.equal(validate({ projectId: "other-project" }).status, RECOMMENDATION_FRESHNESS.STALE, "Project change must stale the proposal.");
assert.equal(validate({ projectJourney: { ...baseJourney, progression: { revision: 9 } } }).status, RECOMMENDATION_FRESHNESS.STALE, "Progression revision change must stale the proposal.");
assert.equal(validate({ projectJourney: { ...baseJourney, currentStageId: "character-foundations", currentTaskId: "protagonist" } }).status, RECOMMENDATION_FRESHNESS.STALE, "Position change must stale the proposal.");
assert.equal(validate({ creatorAuthorityRevision: 42 }).status, RECOMMENDATION_FRESHNESS.STALE, "Creator authority change must stale the proposal.");
assert.equal(validate({ turnRevision: 41 }).status, RECOMMENDATION_FRESHNESS.STALE, "New authoritative turn must stale the proposal.");
assert.equal(validate({ clarificationRequired: true }).status, RECOMMENDATION_FRESHNESS.STALE, "Clarification must stale the proposal.");
assert.equal(validate({ projectJourney: { ...baseJourney, stages: baseJourney.stages.filter((stage) => stage.id !== "character-foundations") } }).status, RECOMMENDATION_FRESHNESS.STALE, "Missing canonical target must stale the proposal.");

const tampered = structuredClone(envelope);
tampered.target.stageId = "story-direction";
assert.equal(validateJourneyRecommendationFreshness(tampered, { projectId, projectJourney: baseJourney, creatorAuthorityRevision: 41, turnRevision: 40 }).status, RECOMMENDATION_FRESHNESS.INVALID, "Target tampering must invalidate identity.");

const replayAfterMovement = validateJourneyRecommendationFreshness(envelope, {
  projectId,
  projectJourney: { ...baseJourney, currentStageId: "character-foundations", currentTaskId: "protagonist", progression: { revision: 9 } },
  creatorAuthorityRevision: 41,
  turnRevision: 40,
});
assert.equal(replayAfterMovement.fresh, false, "Old recommendation replay must die after movement.");
assert.ok(replayAfterMovement.reasons.includes("progression-revision-changed"));

const clarificationEvidence = { ...planningEvidence, clarification: { required: true, reasons: [{ type: "semantic" }] } };
assert.equal(createJourneyRecommendationEnvelope({ projectId, projectJourney: baseJourney, planningEvidence: clarificationEvidence }), null, "Clarification state must not mint an actionable envelope.");

console.log("Journey recommendation envelope verification passed.");
console.log("- exact recommendation identity is immutable");
console.log("- project/revision/position/authority/turn changes stale it");
console.log("- clarification and missing targets stale it");
console.log("- tampering invalidates it");
console.log("- recommendation remains advisory and non-executable");

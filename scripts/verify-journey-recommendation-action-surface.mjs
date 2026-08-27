import assert from "node:assert/strict";
import {
  createJourneyRecommendationActionSurface,
  acceptCurrentJourneyRecommendation,
  dismissCurrentJourneyRecommendation,
} from "../src/components/studio/mentor/JourneyRecommendationActionSurface.js";

const projectId = "movie-project-action-surface";
const projectJourney = {
  projectId,
  currentStageId: "story-direction",
  currentTaskId: "premise",
  progression: { revision: 22 },
  stages: [
    {
      id: "story-direction",
      label: "Story & Direction",
      tasks: [{ id: "premise", label: "Premise" }],
    },
    {
      id: "character-foundations",
      label: "Characters",
      shortLabel: "Characters",
      tasks: [{ id: "protagonist", label: "Protagonist" }],
    },
  ],
};
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

const surface = createJourneyRecommendationActionSurface({ projectId, projectJourney, planningEvidence });
assert.ok(surface, "Fresh planning evidence must produce an action surface.");
assert.equal(surface.authority, "presentation-only");
assert.equal(surface.mayAdvanceJourney, false);
assert.equal(surface.creatorChoiceRequired, true);
assert.equal(surface.label, "Go to Protagonist");
assert.equal(surface.dismissLabel, "Stay here");
assert.equal(surface.recommendationId, surface.envelope.recommendationId);

const hidden = createJourneyRecommendationActionSurface({
  projectId,
  projectJourney,
  planningEvidence,
  dismissedRecommendationId: surface.recommendationId,
});
assert.equal(hidden, null, "Dismissed recommendation must remain hidden for that immutable identity.");

let executionInput = null;
const fakeAcceptanceRuntime = {
  async execute(input) {
    executionInput = input;
    return { status: "committed", projectJourney: { ...projectJourney, progression: { revision: 23 } } };
  },
};

const forgedEnvelope = { recommendationId: "forged", target: { stageId: "publish" } };
const accepted = await acceptCurrentJourneyRecommendation({
  actionSurface: surface,
  acceptanceExecutionRuntime: fakeAcceptanceRuntime,
  projectId,
  creatorActId: "creator-action-surface-accept-1",
  creatorAuthorityRevision: 71,
  turnRevision: 70,
  clarificationRequired: false,
  forgedEnvelope,
});
assert.equal(accepted.status, "committed");
assert.equal(executionInput.recommendationEnvelope.recommendationId, surface.recommendationId, "Acceptance must consume the Workspace-owned envelope.");
assert.notEqual(executionInput.recommendationEnvelope.recommendationId, forgedEnvelope.recommendationId, "Caller-supplied forged envelope must have no effect.");
assert.equal(executionInput.creatorGesture, true, "Action surface acceptance must bind to an explicit creator gesture.");
assert.equal(executionInput.creatorActId, "creator-action-surface-accept-1");

const dismissed = dismissCurrentJourneyRecommendation(surface);
assert.equal(dismissed.status, "dismissed-locally");
assert.equal(dismissed.recommendationId, surface.recommendationId);
assert.equal(dismissed.journeyMutationPerformed, false);
assert.equal(dismissed.progressionRevisionChanged, false);
assert.equal(dismissed.creatorAuthorityIssued, false);

const clarificationEvidence = {
  ...planningEvidence,
  clarification: { required: true, reasons: [{ type: "semantic" }] },
};
assert.equal(
  createJourneyRecommendationActionSurface({ projectId, projectJourney, planningEvidence: clarificationEvidence }),
  null,
  "Clarification must produce no actionable recommendation surface."
);

console.log("Journey recommendation action surface verification passed.");
console.log("- Workspace owns the immutable actionable envelope");
console.log("- UI label names the exact canonical target");
console.log("- caller-supplied forged envelopes are ignored");
console.log("- dismissal is local and creates no Journey authority");
console.log("- clarification creates no actionable surface");

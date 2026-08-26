import assert from "node:assert/strict";
import createMovieJourneyIntelligenceBridge from "../src/components/studio/mentor/MovieJourneyIntelligenceBridge.js";

const journey = {
  projectId: "movie-project-11c",
  currentStageId: "story",
  initialIdea: { readyToAdvance: true },
  decisions: [
    { key: "character.maya.location", value: "train-platform", authority: "creator", status: "active", stageId: "story" },
  ],
};

const engine = {
  createSnapshot(value) {
    return { projectId: value.projectId, currentStageId: value.currentStageId, decisions: JSON.parse(JSON.stringify(value.decisions || [])) };
  },
  getOrientation(value) {
    return { present: { stage: { id: value.currentStageId }, task: { id: "next-story-beat" }, clarificationRequired: false, clarifications: [] } };
  },
};

const bridge = createMovieJourneyIntelligenceBridge({ journeyEngine: engine });
const before = JSON.parse(JSON.stringify(journey));

function contribution(agentId, provisionalSuggestions = [], risksAndConflicts = [], confidence = 0.8) {
  return {
    agentId,
    authority: "mentor-provisional",
    creatorFacing: false,
    mayAdvanceJourney: false,
    mayOverwriteCreatorTruth: false,
    observations: [],
    provisionalSuggestions,
    risksAndConflicts,
    creatorConfirmedDependencies: [],
    confidence,
  };
}

const baseTurn = {
  status: "mentor-response-ready",
  turnContextProof: { revision: 42 },
  semanticIntelligence: {
    readyToAdvance: true,
    recommendedStageId: "story",
    recommendedTaskId: "define-next-beat",
    clarificationNeeded: [],
  },
  specialistResult: {
    contributions: [
      contribution("story", [
        { key: "character.maya.location", value: "airport", reason: "raise stakes", confidence: 0.7 },
        { key: "story.nextBeat", value: "escape-through-tunnel", reason: "keeps momentum", confidence: 0.9 },
      ]),
      contribution("character", [
        { key: "character.maya.location", value: "train-platform", reason: "matches creator choice", confidence: 0.9 },
        { key: "character.maya.objective", value: "protect-eli", reason: "character motive", confidence: 0.85 },
      ]),
    ],
  },
  continuityConsequenceEnvelope: {
    status: "consistent",
    authority: "derived-continuity",
    creatorConfirmed: false,
    mayCreateCanon: false,
    requiresClarification: false,
    derivedConstraints: [
      { key: "story.nextBeat", value: "escape-through-tunnel", creatorConfirmed: false, mayCreateCanon: false },
    ],
    conflicts: [],
    unresolvedQuestions: [],
  },
};

const result = bridge.consumeTurnForJourneyPlanning(journey, baseTurn, { source: "verification" });
const evidence = result.journeyPlanningEvidence;

assert.deepEqual(journey, before, "planning must not mutate canonical journey state");
assert.equal(result.journeyMutated, false);
assert.equal(result.creatorCanonChanged, false);
assert.equal(result.stageChanged, false);
assert.equal(evidence.authority, "advisory-only");
assert.equal(evidence.creatorConfirmed, false);
assert.equal(evidence.mayCreateCanon, false);
assert.equal(evidence.mayAdvanceJourney, false);
assert.equal(evidence.recommendation.recommendedTaskId, "define-next-beat");
assert.equal(evidence.filteredEvidence.overriddenByCreator.length, 1, "creator truth must override conflicting specialist advice");
assert.equal(evidence.filteredEvidence.overriddenByCreator[0].value, "airport");
assert.equal(evidence.filteredEvidence.viableSuggestions.some((item) => item.value === "escape-through-tunnel"), true);

const continuityFilterTurn = JSON.parse(JSON.stringify(baseTurn));
continuityFilterTurn.specialistResult.contributions[0].provisionalSuggestions.push({
  key: "story.nextBeat", value: "return-to-station", reason: "alternate beat", confidence: 0.7,
});
const continuityFiltered = bridge.consumeTurnForJourneyPlanning(journey, continuityFilterTurn);
assert.equal(
  continuityFiltered.journeyPlanningEvidence.filteredEvidence.rejectedByContinuity.some((item) => item.value === "return-to-station"),
  true,
  "validated Continuity must filter incompatible provisional advice without becoming canon"
);

const conflictTurn = JSON.parse(JSON.stringify(baseTurn));
conflictTurn.specialistResult.contributions = [
  contribution("story", [{ key: "story.tone", value: "hopeful", confidence: 0.7 }]),
  contribution("character", [{ key: "story.tone", value: "bleak", confidence: 0.8 }]),
];
conflictTurn.continuityConsequenceEnvelope.derivedConstraints = [];
const conflict = bridge.consumeTurnForJourneyPlanning(journey, conflictTurn);
assert.equal(conflict.journeyPlanningEvidence.clarification.required, true, "unresolved Story/Character disagreement must clarify");
assert.equal(conflict.journeyPlanningEvidence.recommendation, null, "clarification must block a Journey recommendation");

const missingEvidenceTurn = {
  status: "mentor-response-ready",
  turnContextProof: { revision: 43 },
  semanticIntelligence: { readyToAdvance: true, recommendedStageId: "story", recommendedTaskId: "outline-scene", clarificationNeeded: [] },
  specialistResult: { contributions: [] },
  continuityConsequenceEnvelope: null,
};
const missing = bridge.consumeTurnForJourneyPlanning(journey, missingEvidenceTurn);
assert.equal(missing.journeyPlanningEvidence.evidenceStatus, "partial");
assert.equal(missing.journeyPlanningEvidence.recommendation.recommendedTaskId, "outline-scene");
assert.equal(missing.journeyPlanningEvidence.mayAdvanceJourney, false);

const semanticClarificationTurn = JSON.parse(JSON.stringify(baseTurn));
semanticClarificationTurn.semanticIntelligence.clarificationNeeded = [{ question: "Which version do you mean?", material: true }];
const semanticClarification = bridge.consumeTurnForJourneyPlanning(journey, semanticClarificationTurn);
assert.equal(semanticClarification.journeyPlanningEvidence.clarification.required, true);
assert.equal(semanticClarification.journeyPlanningEvidence.recommendation, null);

console.log("Movie Mentor Journey planning evidence verification: PASS — creator override, Continuity filtering, missing evidence and unresolved specialist disagreement all preserve advisory-only Journey authority.");

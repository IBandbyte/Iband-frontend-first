import assert from "node:assert/strict";
import fs from "node:fs";
import createMovieJourneyIntelligenceBridge from "../src/components/studio/mentor/MovieJourneyIntelligenceBridge.js";

const journey = {
  projectId: "movie-project-11b",
  currentStageId: "story",
  initialIdea: { readyToAdvance: true },
  decisions: [
    {
      key: "character.maya.location",
      value: "train-platform",
      authority: "creator",
      status: "active",
      stageId: "story",
    },
  ],
};

const engine = {
  createSnapshot(value) {
    return {
      projectId: value.projectId,
      currentStageId: value.currentStageId,
      decisions: JSON.parse(JSON.stringify(value.decisions || [])),
    };
  },
  getOrientation(value) {
    return {
      present: {
        stage: { id: value.currentStageId },
        task: { id: "next-story-beat" },
        clarificationRequired: false,
        clarifications: [],
      },
    };
  },
};

const bridge = createMovieJourneyIntelligenceBridge({ journeyEngine: engine });
const before = JSON.parse(JSON.stringify(journey));
const envelope = {
  status: "consistent",
  authority: "derived-continuity",
  creatorConfirmed: false,
  mayCreateCanon: false,
  requiresClarification: false,
  derivedConstraints: [
    {
      constraintId: "continuity-11b",
      key: "character.maya.location",
      value: "hidden-tunnel",
      creatorConfirmed: false,
      mayCreateCanon: false,
    },
  ],
  conflicts: [],
  unresolvedQuestions: [],
};

const planning = bridge.consumeContinuityConsequenceForPlanning(journey, envelope, {
  turnStatus: "mentor-response-ready",
  turnRevision: 12,
  source: "verification",
});

assert.strictEqual(planning.journey, journey, "planning consumption must retain the exact canonical journey object");
assert.deepEqual(journey, before, "derived Continuity must not mutate canonical journey state");
assert.equal(planning.stageChanged, false);
assert.equal(planning.creatorCanonChanged, false);
assert.equal(planning.journeyMutated, false);
assert.equal(planning.continuityPlanningAdvice.authority, "advisory-only");
assert.equal(planning.continuityPlanningAdvice.creatorConfirmed, false);
assert.equal(planning.continuityPlanningAdvice.mayCreateCanon, false);
assert.equal(planning.continuityPlanningAdvice.mayAdvanceJourney, false);
assert.equal(planning.continuityPlanningAdvice.derivedConstraints[0].value, "hidden-tunnel");
assert.equal(journey.decisions[0].value, "train-platform", "creator-confirmed truth must remain untouched");

const noEnvelope = bridge.consumeContinuityConsequenceForPlanning(journey, null, { source: "verification" });
assert.equal(noEnvelope.continuityPlanningAdvice, null, "missing backend Continuity must not be manufactured");
assert.deepEqual(journey, before);

const conversationSource = fs.readFileSync(
  "src/components/studio/mentor/MovieMentorConversation.jsx",
  "utf8"
);
assert.match(conversationSource, /onMentorTurnResult/);
assert.match(conversationSource, /continuityConsequenceEnvelope/);
assert.match(conversationSource, /onMentorTurnResult\?\.\(turnResult\)/);

const workspaceSource = fs.readFileSync("src/components/studio/CreatorWorkspace.jsx", "utf8");
assert.match(workspaceSource, /handleMovieMentorTurnResult/);
assert.match(workspaceSource, /consumeContinuityConsequenceForPlanning/);
assert.match(workspaceSource, /onMentorTurnResult=\{handleMovieMentorTurnResult\}/);
assert.doesNotMatch(
  workspaceSource,
  /<MovieMentorConversation[^>]*onJourneyChange=\{handleCreatorJourneyChange\}/,
  "Movie Mentor live turns must not reuse the creator working-mode callback as a stage mutation channel"
);

console.log(
  "Movie Mentor Journey continuity advisory verification: PASS — live turn result is bridged upward, derived Continuity is preserved as advisory planning evidence, creator canon is unchanged, and no silent stage movement occurs."
);

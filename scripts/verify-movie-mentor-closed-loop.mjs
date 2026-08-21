import assert from "node:assert/strict";

import createCreatorJourneyEngine, {
  DECISION_AUTHORITIES,
} from "../src/components/studio/mentor/CreatorJourneyEngine.js";
import createMovieJourneyIntelligenceBridge from "../src/components/studio/mentor/MovieJourneyIntelligenceBridge.js";
import {
  createSafeMovieJourneyIntelligence,
} from "../src/components/studio/mentor/MovieMentorResponseService.js";

const journeyEngine = createCreatorJourneyEngine();
const bridge = createMovieJourneyIntelligenceBridge({ journeyEngine });

function createMovieJourney() {
  return journeyEngine.createMovieJourney({
    creatorType: "video",
    creatorMode: "ai-movie",
    creatorJourney: "guide",
  });
}

function assertOriginalIdeaPreserved(journey, originalIdea) {
  assert.equal(journey.initialIdea?.originalText, originalIdea);

  const decision = journeyEngine.getActiveDecision(
    journey,
    "movie.idea.original"
  );

  assert.equal(decision?.value, originalIdea);
  assert.equal(decision?.authority, DECISION_AUTHORITIES.CREATOR);
}

function runClearIdeaScenario() {
  const originalIdea =
    "A retired astronaut discovers that the lighthouse in her coastal town is sending messages from her missing daughter.";

  const result = {
    response: {
      structured: {
        movieJourneyIntelligence: {
          understoodContext: [
            {
              key: "movie.idea.protagonist",
              value: "retired astronaut",
              authority: DECISION_AUTHORITIES.CREATOR,
            },
          ],
          provisionalContext: [],
          unresolvedContext: [],
          clarificationNeeded: [],
          readyToAdvance: true,
          recommendedStageId: "story-direction",
        },
      },
    },
  };

  const intelligence = createSafeMovieJourneyIntelligence(result, {
    idea: originalIdea,
  });

  const applied = bridge.captureInitialIdea(createMovieJourney(), {
    originalIdea,
    intelligence,
    source: "behaviour-verifier-clear-idea",
  });

  assertOriginalIdeaPreserved(applied.journey, originalIdea);
  assert.equal(applied.clarificationRequired, false);
  assert.equal(applied.journey.currentStageId, "story-direction");
  assert.equal(applied.journey.initialIdea?.readyToAdvance, true);
}

function runVagueIdeaScenario() {
  const originalIdea = "Something happens in a town.";

  const result = {
    adaptivePlan: {
      primaryAction: { action: "listen-and-invite" },
      behaviour: {
        questionPolicy: { policy: "optional" },
      },
    },
    diagnostics: {
      contextSnapshot: {
        creatorAppearsConfused: false,
      },
    },
  };

  const intelligence = createSafeMovieJourneyIntelligence(result, {
    idea: originalIdea,
  });

  assert.equal(intelligence.readyToAdvance, false);

  const applied = bridge.captureInitialIdea(createMovieJourney(), {
    originalIdea,
    intelligence,
    source: "behaviour-verifier-vague-idea",
  });

  assertOriginalIdeaPreserved(applied.journey, originalIdea);
  assert.equal(applied.journey.currentStageId, "idea");
  assert.equal(applied.journey.initialIdea?.readyToAdvance, false);
  assert.equal(applied.clarificationRequired, false);
}

function runUnfamiliarTerminologyScenario() {
  const originalIdea =
    "The final scene needs to feel proper glorp-coded when the beat drops.";

  const result = {
    response: {
      structured: {
        movieJourneyIntelligence: {
          understoodContext: [],
          provisionalContext: [],
          unresolvedContext: [],
          clarificationNeeded: [
            {
              key: "movie.idea.expression.glorp-coded",
              expression: "glorp-coded",
              question:
                "I’m sorry, I lost you at ‘glorp-coded’. Can you explain what you mean by that?",
              reason:
                "The expression is not understood well enough to guide the movie safely.",
              material: true,
            },
          ],
          // Deliberately contradictory input: the Journey Engine must let
          // material clarification override attempted advancement.
          readyToAdvance: true,
          recommendedStageId: "story-direction",
        },
      },
    },
  };

  const intelligence = createSafeMovieJourneyIntelligence(result, {
    idea: originalIdea,
  });

  const applied = bridge.captureInitialIdea(createMovieJourney(), {
    originalIdea,
    intelligence,
    source: "behaviour-verifier-unfamiliar-terminology",
  });

  assertOriginalIdeaPreserved(applied.journey, originalIdea);
  assert.equal(applied.clarificationRequired, true);
  assert.equal(applied.journey.currentStageId, "idea");
  assert.equal(applied.journey.initialIdea?.readyToAdvance, false);
  assert.match(applied.clarificationMessage, /glorp-coded/i);
}

function runExplicitAdvanceScenario() {
  const originalIdea =
    "A mother and son cross Europe to return a stolen violin before its final concert.";

  const result = {
    adaptivePlan: {
      primaryAction: { action: "move-to-next-task" },
      behaviour: {
        questionPolicy: { policy: "none" },
      },
    },
    diagnostics: {
      contextSnapshot: {
        creatorAppearsConfused: false,
      },
    },
  };

  const intelligence = createSafeMovieJourneyIntelligence(result, {
    idea: originalIdea,
  });

  assert.equal(intelligence.readyToAdvance, true);

  const serviceResult = {
    id: "verification-generation",
    status: "completed",
    movieJourneyIntelligence: intelligence,
  };

  const applied = bridge.applyGenerationResult(
    bridge.captureInitialIdea(createMovieJourney(), {
      originalIdea,
      source: "behaviour-verifier-pre-capture",
    }).journey,
    serviceResult,
    {
      originalIdea,
      source: "behaviour-verifier-explicit-advance",
    }
  );

  assertOriginalIdeaPreserved(applied.journey, originalIdea);
  assert.equal(applied.clarificationRequired, false);
  assert.equal(applied.journey.currentStageId, "story-direction");
  assert.equal(applied.journey.initialIdea?.readyToAdvance, true);
}

function runRequiredQuestionBlocksAdvanceScenario() {
  const originalIdea =
    "A detective wakes up in a city where everyone remembers a crime that never happened.";

  const result = {
    adaptivePlan: {
      primaryAction: { action: "move-to-next-task" },
      behaviour: {
        questionPolicy: { policy: "one-required" },
      },
    },
    diagnostics: {
      contextSnapshot: {
        creatorAppearsConfused: false,
      },
    },
  };

  const intelligence = createSafeMovieJourneyIntelligence(result, {
    idea: originalIdea,
  });

  assert.equal(intelligence.readyToAdvance, false);

  const applied = bridge.captureInitialIdea(createMovieJourney(), {
    originalIdea,
    intelligence,
    source: "behaviour-verifier-required-question",
  });

  assert.equal(applied.journey.currentStageId, "idea");
  assert.equal(applied.journey.initialIdea?.readyToAdvance, false);
}

function runProvisionalAuthorityScenario() {
  const originalIdea =
    "Two sisters inherit a cinema that only screens films from their future.";

  const intelligence = {
    understoodContext: [],
    provisionalContext: [
      {
        key: "movie.idea.provisional.tone",
        value: "melancholic mystery",
      },
    ],
    unresolvedContext: [],
    clarificationNeeded: [],
    readyToAdvance: false,
  };

  const applied = bridge.captureInitialIdea(createMovieJourney(), {
    originalIdea,
    intelligence,
    source: "behaviour-verifier-provisional-authority",
  });

  const decision = journeyEngine.getActiveDecision(
    applied.journey,
    "movie.idea.provisional.tone"
  );

  assert.equal(decision?.authority, DECISION_AUTHORITIES.MENTOR_PROVISIONAL);
  assert.notEqual(decision?.authority, DECISION_AUTHORITIES.CREATOR);
}

const scenarios = [
  ["clear idea advances safely", runClearIdeaScenario],
  ["vague idea stays in Idea", runVagueIdeaScenario],
  ["unfamiliar terminology requires clarification", runUnfamiliarTerminologyScenario],
  ["explicit Adaptive Mentor advance closes the loop", runExplicitAdvanceScenario],
  ["required question blocks progression", runRequiredQuestionBlocksAdvanceScenario],
  ["provisional interpretation never becomes creator truth", runProvisionalAuthorityScenario],
];

for (const [name, run] of scenarios) {
  run();
  console.log(`✓ ${name}`);
}

console.log(`\nMovie Mentor closed-loop verification passed: ${scenarios.length}/${scenarios.length} scenarios.`);

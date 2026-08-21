import assert from "node:assert/strict";
import {
  createMovieMentorAgentPlan,
  MOVIE_SPECIALIST_AGENTS,
} from "../src/components/studio/mentor/MovieMentorAgentOrchestrator.js";

function semantic(overrides = {}) {
  return {
    understoodContext: [],
    provisionalContext: [],
    unresolvedContext: [],
    clarificationNeeded: [],
    readyToAdvance: true,
    ...overrides,
  };
}

function assertAdvisoryOnly(plan) {
  assert.equal(plan.authority.specialistsMayAdvanceJourney, false);
  assert.equal(plan.authority.specialistsMaySpeakDirectlyToCreator, false);
  assert.equal(plan.authority.mentorMustSynthesize, true);
  for (const order of plan.workOrders) {
    assert.equal(order.authority, "mentor-provisional");
    assert.equal(order.creatorFacing, false);
    assert.equal(order.mayAdvanceJourney, false);
    assert.equal(order.mayOverwriteCreatorTruth, false);
    assert.equal(order.requiresMentorSynthesis, true);
  }
}

const early = createMovieMentorAgentPlan({
  stageId: "story-direction",
  creatorMessage: "A mother searches for her missing daughter.",
  semanticIntelligence: semantic({
    understoodContext: [
      { key: "movie.character.protagonist", value: "mother" },
      { key: "movie.story.premise", value: "search for missing daughter" },
    ],
  }),
});
assert.ok(early.selectedAgents.includes(MOVIE_SPECIALIST_AGENTS.STORY));
assert.ok(early.selectedAgents.includes(MOVIE_SPECIALIST_AGENTS.CHARACTER));
assertAdvisoryOnly(early);
console.log("✓ early development routes story/character specialists without creator-facing voices");

const scene = createMovieMentorAgentPlan({
  stageId: "scene",
  semanticIntelligence: semantic({
    understoodContext: [
      { key: "movie.scene.camera", value: "handheld" },
      { key: "movie.scene.score", value: "low pulse" },
    ],
  }),
});
assert.ok(scene.selectedAgents.includes(MOVIE_SPECIALIST_AGENTS.SCENE));
assert.ok(scene.selectedAgents.includes(MOVIE_SPECIALIST_AGENTS.CINEMATOGRAPHY));
assert.ok(scene.selectedAgents.includes(MOVIE_SPECIALIST_AGENTS.SOUND_MUSIC));
assertAdvisoryOnly(scene);
console.log("✓ scene work can coordinate scene/cinematography/sound under one Mentor");

const production = createMovieMentorAgentPlan({
  stageId: "production",
  semanticIntelligence: semantic({
    understoodContext: [{ key: "movie.production.assets", value: "three locations" }],
  }),
});
assert.ok(production.selectedAgents.includes(MOVIE_SPECIALIST_AGENTS.PRODUCTION));
assert.ok(production.selectedAgents.includes(MOVIE_SPECIALIST_AGENTS.CONTINUITY));
assertAdvisoryOnly(production);
console.log("✓ production stage coordinates production and continuity intelligence");

const blocked = createMovieMentorAgentPlan({
  stageId: "story-direction",
  semanticIntelligence: semantic({
    readyToAdvance: false,
    clarificationNeeded: [
      {
        expression: "glorp-coded",
        question: "What does glorp-coded mean here?",
        reason: "Unknown creator terminology",
        material: true,
      },
    ],
  }),
});
assert.equal(blocked.status, "blocked-by-clarification");
assert.deepEqual(blocked.selectedAgents, []);
assert.deepEqual(blocked.workOrders, []);
assertAdvisoryOnly(blocked);
console.log("✓ material semantic ambiguity blocks all specialist routing");

const creatorTruth = [{ key: "movie.character.relationship", value: "siblings", authority: "creator" }];
const withTruth = createMovieMentorAgentPlan({
  stageId: "story-direction",
  creatorConfirmedContext: creatorTruth,
  semanticIntelligence: semantic({ understoodContext: [{ key: "movie.character.relationship", value: "siblings" }] }),
});
assert.ok(withTruth.workOrders.length > 0);
for (const order of withTruth.workOrders) {
  assert.deepEqual(order.input.creatorConfirmedContext, creatorTruth);
}
assertAdvisoryOnly(withTruth);
console.log("✓ creator-confirmed truth is forwarded into every specialist work order");

assert.equal(withTruth.routing.vendorNeutral, true);
assert.equal(withTruth.routing.providerExecutionOwnedByBackend, true);
assert.equal(withTruth.routing.semanticUnderstandingOwnedBySemanticInterpreter, true);
console.log("✓ orchestration boundary stays vendor-neutral and semantically subordinate");

console.log("\nMovie Mentor specialist-agent orchestration verification passed: 6/6 contracts.");

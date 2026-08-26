import assert from "node:assert/strict";
import {
  generateMovieMentorLiveResponse,
  resolveWorkspaceIdentity,
  toCreatorWorkspaceResult,
} from "../src/components/studio/mentor/MovieMentorLiveGatewayService.js";

const storageMap = new Map();
const storage = {
  getItem: (key) => storageMap.get(key) ?? null,
  setItem: (key, value) => storageMap.set(key, String(value)),
};

const identity = resolveWorkspaceIdentity({ request: {}, storage });
assert.equal(identity.projectId, null);
assert.match(identity.creatorSessionId, /^movie-workspace-/);
assert.equal(
  resolveWorkspaceIdentity({ request: {}, storage }).creatorSessionId,
  identity.creatorSessionId
);

const continuityConsequenceEnvelope = {
  status: "consistent",
  authority: "derived-continuity",
  creatorConfirmed: false,
  mayCreateCanon: false,
  requiresClarification: false,
  derivedConstraints: [
    {
      constraintId: "continuity-1",
      key: "character.maya.location",
      value: "hidden-tunnel",
      creatorConfirmed: false,
      mayCreateCanon: false,
    },
  ],
  conflicts: [],
  unresolvedQuestions: [],
};

const calls = [];
const fetchImpl = async (url, options = {}) => {
  const body = JSON.parse(options.body || "{}");
  calls.push({ url, body });

  if (url.endsWith("/api/movie-mentor/state/sync")) {
    assert.equal(body.source, "creator-workspace");
    assert.equal(body.expectedRevision, 0);
    assert.equal(body.creatorSessionId, identity.creatorSessionId);
    assert.equal(body.state.projectJourney.stageId, "idea");
    assert.equal("revision" in body.state, false);
    assert.equal("creatorStateFingerprint" in body.state, false);
    return {
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        state: { revision: 1 },
      }),
    };
  }

  if (url.endsWith("/api/movie-mentor/turn")) {
    assert.deepEqual(Object.keys(body).sort(), [
      "creatorSessionId",
      "message",
      "projectId",
    ]);
    assert.equal(body.message, "A detective finds a red door that should not exist.");
    assert.equal(body.creatorSessionId, identity.creatorSessionId);
    return {
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        status: "mentor-response-ready",
        text: "That red door gives us a strong mystery engine. Let’s decide what makes opening it dangerous.",
        semanticIntelligence: {
          understoodContext: [{ key: "premise", value: "mysterious red door" }],
          clarificationNeeded: [],
          readyToAdvance: true,
          recommendedStageId: "story-direction",
        },
        specialistPlan: { workOrders: [{ agentId: "story" }, { agentId: "character" }, { agentId: "continuity" }] },
        specialistResult: { contributions: [{ agentId: "story" }, { agentId: "continuity" }] },
        synthesisResult: { success: true, text: "That red door gives us a strong mystery engine. Let’s decide what makes opening it dangerous." },
        continuityConsequenceEnvelope,
        turnContextProof: { verified: true, revision: 1 },
        authority: { singleCreatorFacingMentor: true, derivedContinuityIsNotCanon: true },
        mayAdvanceJourney: false,
      }),
    };
  }

  throw new Error(`Unexpected URL: ${url}`);
};

const result = await generateMovieMentorLiveResponse(
  {
    creatorType: "video",
    creatorMode: "ai-movie",
    creatorJourney: "guide",
    idea: "A detective finds a red door that should not exist.",
    projectJourneySnapshot: { stageId: "idea", taskId: "premise" },
  },
  { fetchImpl, storage }
);

assert.equal(calls.length, 2);
assert.ok(calls[0].url.endsWith("/api/movie-mentor/state/sync"));
assert.ok(calls[1].url.endsWith("/api/movie-mentor/turn"));
assert.equal(result.response.text, result.preview);
assert.equal(result.movieJourneyIntelligence.readyToAdvance, true);
assert.equal(result.metadata.liveBackendTurn, true);
assert.equal(result.metadata.localResponseGeneratorUsed, false);
assert.equal(result.turnContextProof.verified, true);
assert.equal(result.authority.singleCreatorFacingMentor, true);

assert.deepEqual(
  result.continuityConsequenceEnvelope,
  continuityConsequenceEnvelope,
  "live gateway must preserve the backend continuity consequence envelope exactly"
);
assert.deepEqual(
  result.response.structured.continuityConsequenceEnvelope,
  continuityConsequenceEnvelope,
  "structured creator-workspace result must retain the same continuity consequence envelope"
);
assert.notStrictEqual(
  result.continuityConsequenceEnvelope,
  continuityConsequenceEnvelope,
  "gateway must clone backend continuity data rather than expose the backend object by reference"
);
assert.equal(result.continuityConsequenceEnvelope.creatorConfirmed, false);
assert.equal(result.continuityConsequenceEnvelope.mayCreateCanon, false);
assert.equal(result.mayAdvanceJourney, false, "transport must not silently advance the Creator Journey");

const missingEnvelopeResult = toCreatorWorkspaceResult({
  status: "mentor-response-ready",
  text: "No continuity envelope on this turn.",
  semanticIntelligence: { readyToAdvance: true },
});
assert.equal(
  missingEnvelopeResult.continuityConsequenceEnvelope,
  null,
  "frontend must not manufacture continuity consequences when the backend omitted them"
);
assert.equal(
  missingEnvelopeResult.response.structured.continuityConsequenceEnvelope,
  null
);

const clarificationEnvelope = {
  status: "conflict",
  authority: "derived-continuity",
  creatorConfirmed: false,
  mayCreateCanon: false,
  requiresClarification: true,
  derivedConstraints: [],
  conflicts: [{ key: "location", reason: "Two incompatible current locations." }],
  unresolvedQuestions: [{ question: "Which location should remain current?" }],
};
const clarificationResult = toCreatorWorkspaceResult({
  status: "continuity-clarification-required",
  text: "Which location should remain current?",
  semanticIntelligence: { readyToAdvance: true },
  continuityConsequenceEnvelope: clarificationEnvelope,
  mayAdvanceJourney: false,
});
assert.deepEqual(
  clarificationResult.continuityConsequenceEnvelope,
  clarificationEnvelope,
  "continuity clarification envelopes must survive the same gateway unchanged"
);
assert.equal(clarificationResult.mayAdvanceJourney, false);

console.log("Movie Mentor live backend turn gateway verification: PASS — continuity consequence envelope survives transport without becoming creator truth or Journey authority.");

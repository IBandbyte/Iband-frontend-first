import assert from "node:assert/strict";
import {
  generateMovieMentorLiveResponse,
  resolveWorkspaceIdentity,
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
        specialistPlan: { workOrders: [{ agentId: "story" }, { agentId: "character" }] },
        specialistResult: { contributions: [{ agentId: "story" }] },
        synthesisResult: { success: true, text: "That red door gives us a strong mystery engine. Let’s decide what makes opening it dangerous." },
        turnContextProof: { verified: true, revision: 1 },
        authority: { singleCreatorFacingMentor: true },
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

console.log("Movie Mentor live backend turn gateway verification: PASS");

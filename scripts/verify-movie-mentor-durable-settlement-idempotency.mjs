import assert from "node:assert/strict";
import createCreatorMemory from "../src/components/studio/mentor/CreatorMemoryCore.js";
import createMovieMentorStudioIdentityRuntime from "../src/components/studio/mentor/MovieMentorStudioIdentityRuntime.js";

function sharedStorage() {
  const values = new Map();
  return {
    getItem(key) {
      return values.has(key) ? values.get(key) : null;
    },
    setItem(key, value) {
      values.set(key, value);
    },
    removeItem(key) {
      values.delete(key);
    },
  };
}

const storageAdapter = sharedStorage();
const options = {
  storageKey: "movie-mentor-durable-settlement-idempotency",
  storageAdapter,
  creatorId: "creator-38",
};

// Construct both runtimes before either writes. This models two browser tabs
// that share durable storage but hold independent stale working snapshots.
const tabA = createCreatorMemory(options);
const tabB = createCreatorMemory(options);

const settlement = {
  summary: "Mentor settlement",
  creatorMessage: "Build the next scene.",
  mentorResponse: "Here is the next scene.",
  relatedProjectIds: ["project-38"],
  metadata: {
    projectId: "project-38",
    creatorTurnId: "turn-38-x",
    source: "movie-mentor-conversation",
  },
};

const first = tabA.rememberConversation(settlement);
assert.ok(first?.id, "Precondition failed: first durable settlement did not commit.");

// The stale runtime now receives the same canonical settlement identity.
const replay = tabB.rememberConversation(settlement);
assert.ok(replay?.id, "Precondition failed: replay did not return a durable settlement result.");

const afterReplay = createCreatorMemory(options).getState();
const matchingReplay = afterReplay.conversations.filter(
  (entry) =>
    entry?.metadata?.projectId === "project-38" &&
    entry?.metadata?.creatorTurnId === "turn-38-x"
);

assert.equal(
  matchingReplay.length,
  1,
  "RED: stale runtimes created more than one durable conversation for the same {projectId, creatorTurnId}."
);
assert.equal(
  replay.id,
  first.id,
  "RED: same {projectId, creatorTurnId} replay did not converge to the original durable conversation identity."
);
assert.equal(
  matchingReplay[0]?.id,
  first.id,
  "RED: stale replay replaced the canonical durable conversation instead of converging to it."
);

// Content is deliberately identical. A different creatorTurnId is a distinct
// paid turn and must remain distinct; text must never become the identity key.
const freshWriter = createCreatorMemory(options);
const distinctTurn = freshWriter.rememberConversation({
  ...settlement,
  metadata: {
    ...settlement.metadata,
    creatorTurnId: "turn-38-y",
  },
});
assert.ok(distinctTurn?.id, "Distinct creatorTurnId was not durably recorded.");

const finalState = createCreatorMemory(options).getState();
const projectTurns = finalState.conversations.filter(
  (entry) => entry?.metadata?.projectId === "project-38"
);
assert.equal(
  projectTurns.filter((entry) => entry?.metadata?.creatorTurnId === "turn-38-x").length,
  1,
  "Exact settlement identity must remain singular."
);
assert.equal(
  projectTurns.filter((entry) => entry?.metadata?.creatorTurnId === "turn-38-y").length,
  1,
  "Different creatorTurnIds with identical text must remain distinct durable turns."
);

// Failure ordering: the pending creator message must survive a failed durable
// mentor settlement. A retry after the failure must still pair with that creator
// message; retirement is allowed only after durable success/convergence.
let failNextSettlement = true;
let successfulSettlementInput = null;
const runtimeMemory = {
  rememberConversation(input) {
    if (failNextSettlement) {
      failNextSettlement = false;
      throw new Error("simulated durable settlement failure");
    }
    successfulSettlementInput = input;
    return { id: "conversation-canonical", ...input };
  },
  saveSessionHandoff(input) {
    return { id: "handoff-1", ...input };
  },
};
const runtime = createMovieMentorStudioIdentityRuntime({
  memory: runtimeMemory,
  cryptoImpl: { randomUUID: () => "runtime-38" },
});
runtime.recordConversationMessage(
  "project-38",
  { role: "creator", text: "Keep this pending through failure." }
);
assert.throws(
  () => runtime.recordConversationMessage(
    "project-38",
    {
      role: "mentor",
      text: "First settlement attempt.",
      metadata: { backendMetadata: { creatorTurnId: "turn-38-failure" } },
    }
  ),
  /simulated durable settlement failure/,
  "Precondition failed: simulated persistence failure did not propagate."
);
const retried = runtime.recordConversationMessage(
  "project-38",
  {
    role: "mentor",
    text: "Second settlement attempt.",
    metadata: { backendMetadata: { creatorTurnId: "turn-38-failure" } },
  }
);
assert.equal(retried?.conversation?.id, "conversation-canonical");
assert.equal(
  successfulSettlementInput?.creatorMessage,
  "Keep this pending through failure.",
  "RED: failed durable settlement retired the pending creator message before success."
);
assert.equal(
  retried?.handoff?.value?.conversationId,
  "conversation-canonical",
  "RED: session handoff did not bind to the canonical durable conversation identity."
);

console.log("PASS: durable Movie Mentor settlement converges by exact {projectId, creatorTurnId}, preserves pending state through failure, and binds handoff to the canonical conversation identity.");

import assert from "node:assert/strict";
import createCreatorMemory from "../src/components/studio/mentor/CreatorMemoryCore.js";

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

console.log("PASS: durable Movie Mentor settlement append converges by exact {projectId, creatorTurnId}, never by text.");

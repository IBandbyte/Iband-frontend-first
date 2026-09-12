import assert from "node:assert/strict";
import createCreatorMemory from "../src/components/studio/mentor/CreatorMemory.js";
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

function createSerialLockManager() {
  const tails = new Map();
  return {
    request(name, operation) {
      const previous = tails.get(name) || Promise.resolve();
      let release;
      const next = new Promise((resolve) => { release = resolve; });
      tails.set(name, previous.then(() => next));
      return previous.then(operation).finally(() => release());
    },
  };
}

function createFailOnceLockManager() {
  let failed = false;
  const serial = createSerialLockManager();
  return {
    request(name, operation) {
      if (!failed) {
        failed = true;
        return Promise.reject(new Error("simulated settlement authority failure"));
      }
      return serial.request(name, operation);
    },
  };
}

function mentorMessage(creatorTurnId, text = "Here is the next scene.") {
  return {
    role: "mentor",
    text,
    metadata: {
      backendMetadata: { creatorTurnId },
    },
  };
}

const storageAdapter = sharedStorage();
const options = {
  storageKey: "movie-mentor-durable-settlement-idempotency",
  storageAdapter,
  creatorId: "creator-38",
};
const lockManager = createSerialLockManager();

const runtimeA = createMovieMentorStudioIdentityRuntime({
  memory: createCreatorMemory(options),
  cryptoImpl: { randomUUID: () => "runtime-a" },
  settlementLockManager: lockManager,
});
const runtimeB = createMovieMentorStudioIdentityRuntime({
  memory: createCreatorMemory(options),
  cryptoImpl: { randomUUID: () => "runtime-b" },
  settlementLockManager: lockManager,
});

assert.equal(
  typeof runtimeA.settleConversationMessage,
  "function",
  "RED: Movie Mentor has no durable settlement authority API for serialized exact-turn publication."
);

runtimeA.recordConversationMessage("project-38", { role: "creator", text: "Build the next scene." });
runtimeB.recordConversationMessage("project-38", { role: "creator", text: "Build the next scene." });

const [first, replay] = await Promise.all([
  runtimeA.settleConversationMessage("project-38", mentorMessage("turn-38-x")),
  runtimeB.settleConversationMessage("project-38", mentorMessage("turn-38-x")),
]);

assert.ok(first?.conversation?.id, "First durable settlement did not commit.");
assert.equal(
  replay?.conversation?.id,
  first.conversation.id,
  "RED: simultaneous same {projectId, creatorTurnId} settlement did not converge to one canonical conversation identity."
);

const afterReplay = createCreatorMemory(options).readPersistedState();
const matchingReplay = (afterReplay.conversations || []).filter(
  (entry) =>
    entry?.metadata?.projectId === "project-38" &&
    entry?.metadata?.creatorTurnId === "turn-38-x"
);
assert.equal(
  matchingReplay.length,
  1,
  "RED: simultaneous runtimes created more than one durable conversation for the same {projectId, creatorTurnId}."
);
assert.equal(
  matchingReplay[0]?.id,
  first.conversation.id,
  "RED: simultaneous settlement replaced the canonical durable conversation instead of converging to it."
);
assert.equal(
  replay?.handoff?.value?.conversationId,
  first.conversation.id,
  "RED: replay handoff did not bind to the canonical durable conversation identity."
);

const runtimeC = createMovieMentorStudioIdentityRuntime({
  memory: createCreatorMemory(options),
  cryptoImpl: { randomUUID: () => "runtime-c" },
  settlementLockManager: lockManager,
});
runtimeC.recordConversationMessage("project-38", { role: "creator", text: "Build the next scene." });
const distinct = await runtimeC.settleConversationMessage("project-38", mentorMessage("turn-38-y"));
assert.ok(distinct?.conversation?.id, "Distinct creatorTurnId was not durably recorded.");
assert.notEqual(
  distinct.conversation.id,
  first.conversation.id,
  "RED: different creatorTurnIds with identical text were incorrectly deduplicated."
);

const finalState = createCreatorMemory(options).readPersistedState();
const projectTurns = (finalState.conversations || []).filter(
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

const failureStorage = sharedStorage();
const failureOptions = {
  storageKey: "movie-mentor-durable-settlement-failure-ordering",
  storageAdapter: failureStorage,
  creatorId: "creator-38-failure",
};
const failureRuntime = createMovieMentorStudioIdentityRuntime({
  memory: createCreatorMemory(failureOptions),
  cryptoImpl: { randomUUID: () => "runtime-failure" },
  settlementLockManager: createFailOnceLockManager(),
});
failureRuntime.recordConversationMessage(
  "project-38",
  { role: "creator", text: "Keep this pending through failure." }
);
await assert.rejects(
  failureRuntime.settleConversationMessage(
    "project-38",
    mentorMessage("turn-38-failure", "First settlement attempt.")
  ),
  /simulated settlement authority failure/,
  "Precondition failed: simulated settlement authority failure did not propagate."
);
const retried = await failureRuntime.settleConversationMessage(
  "project-38",
  mentorMessage("turn-38-failure", "Second settlement attempt.")
);
assert.equal(
  retried?.conversation?.creatorMessage,
  "Keep this pending through failure.",
  "RED: failed durable settlement retired the pending creator message before success."
);
assert.equal(
  retried?.handoff?.value?.conversationId,
  retried?.conversation?.id,
  "RED: session handoff did not bind to the canonical durable conversation identity."
);

console.log("PASS: durable Movie Mentor settlement serializes simultaneous exact-turn publication, converges canonical identity, preserves pending state through failure, and never deduplicates by text.");

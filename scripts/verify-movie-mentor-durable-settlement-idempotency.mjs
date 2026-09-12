import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import createCreatorMemory from "../src/components/studio/mentor/CreatorMemory.js";
import createMovieMentorStudioIdentityRuntime from "../src/components/studio/mentor/MovieMentorStudioIdentityRuntime.js";

function sharedStorage() {
  const values = new Map();
  let writes = 0;
  return {
    getItem(key) {
      return values.has(key) ? values.get(key) : null;
    },
    setItem(key, value) {
      writes += 1;
      values.set(key, value);
    },
    removeItem(key) {
      values.delete(key);
    },
    getWriteCount() {
      return writes;
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

// Production reachability is part of the court. A correct authority API that the
// live CreatorWorkspace never invokes is not a repair. Creator messages may stay
// on the synchronous pending path, but mentor publication must route through the
// durable settlement authority path.
const workspaceSource = await readFile(
  new URL("../src/components/studio/CreatorWorkspace.jsx", import.meta.url),
  "utf8"
);
assert.match(
  workspaceSource,
  /message\?\.role\s*===\s*["']mentor["'][\s\S]{0,500}settleConversationMessage\s*\(/,
  "RED: CreatorWorkspace mentor publication does not reach durable settlement authority."
);

// The facade convergence primitive runs only while the runtime owns serialization.
// It may fresh-read durable state and refresh its working cache, but that refresh
// itself must never become a second whole-memory write. First publication owns one
// conversation commit; exact replay owns zero conversation rewrites.
const convergenceStorage = sharedStorage();
const convergenceMemory = createCreatorMemory({
  storageKey: "movie-mentor-durable-settlement-refresh-proof",
  storageAdapter: convergenceStorage,
  creatorId: "creator-38-refresh",
});
const directSettlement = {
  summary: "Mentor settlement",
  creatorMessage: "Build the next scene.",
  mentorResponse: "Here is the next scene.",
  relatedProjectIds: ["project-38-refresh"],
  metadata: {
    projectId: "project-38-refresh",
    creatorTurnId: "turn-38-refresh",
    source: "movie-mentor-conversation",
  },
};
const beforeDirectCommitWrites = convergenceStorage.getWriteCount();
const directCommit = convergenceMemory.convergeConversationSettlement(directSettlement);
assert.ok(directCommit?.conversation?.id, "Precondition failed: direct durable settlement did not commit.");
const afterDirectCommitWrites = convergenceStorage.getWriteCount();
assert.equal(
  afterDirectCommitWrites - beforeDirectCommitWrites,
  1,
  "RED: first exact-turn settlement performed a redundant whole-memory refresh write after its durable conversation commit."
);
const directReplay = convergenceMemory.convergeConversationSettlement(directSettlement);
assert.equal(directReplay?.conversation?.id, directCommit.conversation.id);
assert.equal(
  convergenceStorage.getWriteCount(),
  afterDirectCommitWrites,
  "RED: already-settled exact-turn replay rewrote durable Creator Memory merely to refresh working state."
);

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

console.log("PASS: live Movie Mentor mentor publication reaches durable settlement authority, settlement cache refresh is write-free, simultaneous exact-turn publication converges canonical identity, pending state survives failure, and text is never the identity key.");

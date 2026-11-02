import assert from "node:assert/strict";
import createCreatorMemory, { createMemoryStorageAdapter, PROJECT_STATUSES } from "../src/components/studio/mentor/CreatorMemory.js";
import createMovieMentorStudioIdentityRuntime from "../src/components/studio/mentor/MovieMentorStudioIdentityRuntime.js";
import { projectMemoryContext } from "../src/components/studio/mentor/MovieMentorDurableStateSync.js";

const storage = createMemoryStorageAdapter();
let uuidIndex = 0;
const uuids = [
  "11111111-1111-4111-8111-111111111111",
  "22222222-2222-4222-8222-222222222222",
  "33333333-3333-4333-8333-333333333333",
];
const cryptoImpl = { randomUUID: () => uuids[uuidIndex++] };

const lockCalls = [];
const locks = {
  async request(name, optionsOrCallback, maybeCallback) {
    const callback = typeof optionsOrCallback === "function" ? optionsOrCallback : maybeCallback;
    lockCalls.push(name);
    return callback({ name, mode: "exclusive" });
  },
};

const memoryA = createCreatorMemory({ storageAdapter: storage, projectIdentityCrypto: cryptoImpl, requireSharedWriteAuthority: true });
const runtimeA = createMovieMentorStudioIdentityRuntime({ memory: memoryA, cryptoImpl, settlementLockManager: locks });
const created = await runtimeA.ensureProjectWithSharedAuthority({
  title: "Midnight Door",
  projectJourney: { currentStageId: "story" },
});
assert.equal(created.acquired, true, "Initial movie project must be created under shared authority.");
const project = runtimeA.getActiveProject();
assert.ok(project?.id);

runtimeA.recordConversationMessage(project.id, { role: "creator", text: "The red door should appear at midnight." }, { projectJourney: { currentStageId: "story" } });
const persisted = await runtimeA.settleConversationMessage(project.id, { role: "mentor", text: "Good. We'll make midnight the repeating trigger.", metadata: { backendMetadata: { creatorTurnId: "midnight-door-turn-1" } } }, { projectJourney: { currentStageId: "story" } });
assert.ok(lockCalls.length >= 2, "Conversation settlement must acquire shared recovery and idempotency locks.");
assert.equal(persisted.status, "conversation-persisted");
assert.equal(persisted.conversation.relatedProjectIds[0], project.id);
assert.equal(persisted.handoff.projectId, project.id);
assert.equal(persisted.handoff.sessionId, runtimeA.creatorSessionId);

const memoryB = createCreatorMemory({ storageAdapter: storage, projectIdentityCrypto: cryptoImpl, requireSharedWriteAuthority: true });
const runtimeB = createMovieMentorStudioIdentityRuntime({ memory: memoryB, cryptoImpl, settlementLockManager: locks });
const resumed = runtimeB.getResumeSnapshot();
assert.equal(resumed.projectId, project.id);
assert.notEqual(runtimeB.creatorSessionId, runtimeA.creatorSessionId);
assert.equal(resumed.conversationMessages.length, 2);
assert.equal(resumed.conversationMessages[0].role, "creator");
assert.equal(resumed.conversationMessages[0].text, "The red door should appear at midnight.");
assert.equal(resumed.conversationMessages[1].role, "mentor");
assert.equal(resumed.conversationMessages[1].text, "Good. We'll make midnight the repeating trigger.");
assert.equal(resumed.sessionHandoff.value.lastCreatorMessage, "The red door should appear at midnight.");
assert.equal(resumed.sessionHandoff.value.lastMentorResponse, "Good. We'll make midnight the repeating trigger.");

const durableContext = projectMemoryContext(memoryB.getState(), project.id);
assert.equal(durableContext.conversations.length, 1);
assert.equal(durableContext.conversations[0].relatedProjectIds[0], project.id);
assert.equal(durableContext.sessionHandoffs.length, 1);
assert.equal(durableContext.sessionHandoffs[0].projectId, project.id);

// The Studio ensure operation intentionally resumes an existing active movie.
// Explicitly switch the active selection under the same shared lock before
// establishing the second independent movie project.
const cleared = await memoryB.replaceStateWithSharedAuthority({
  locks,
  transform: state => {
    state.journey = { ...(state.journey || {}), activeProjectId: null };
    return state;
  },
});
assert.equal(cleared.acquired, true);
const otherCreated = await runtimeB.ensureProjectWithSharedAuthority({
  title: "Other Movie",
  projectJourney: { currentStageId: "idea" },
  locks,
});
assert.equal(otherCreated.acquired, true);
const other = runtimeB.getActiveProject();
assert.ok(other?.id && other.id !== project.id, "Second movie must have a distinct durable identity.");
assert.equal(runtimeB.getProjectConversationMessages(other.id).length, 0, "Conversation history must not leak across projects.");

console.log("Movie Mentor conversation continuity verification: PASS");

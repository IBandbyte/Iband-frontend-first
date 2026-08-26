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

const memoryA = createCreatorMemory({ storageAdapter: storage, projectIdentityCrypto: cryptoImpl });
const runtimeA = createMovieMentorStudioIdentityRuntime({ memory: memoryA, cryptoImpl });
const project = memoryA.saveProject({
  title: "Midnight Door",
  creatorType: "video",
  status: PROJECT_STATUSES.CREATING,
  metadata: { creatorMode: "ai-movie", projectJourney: { currentStageId: "story" } },
});

runtimeA.recordConversationMessage(project.id, { role: "creator", text: "The red door should appear at midnight." }, { projectJourney: { currentStageId: "story" } });
const persisted = runtimeA.recordConversationMessage(project.id, { role: "mentor", text: "Good. We'll make midnight the repeating trigger." }, { projectJourney: { currentStageId: "story" } });
assert.equal(persisted.status, "conversation-persisted");
assert.equal(persisted.conversation.relatedProjectIds[0], project.id);
assert.equal(persisted.handoff.projectId, project.id);
assert.equal(persisted.handoff.sessionId, runtimeA.creatorSessionId);

const memoryB = createCreatorMemory({ storageAdapter: storage, projectIdentityCrypto: cryptoImpl });
const runtimeB = createMovieMentorStudioIdentityRuntime({ memory: memoryB, cryptoImpl });
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

const other = memoryB.saveProject({ title: "Other Movie", creatorType: "video", status: PROJECT_STATUSES.CREATING, metadata: { creatorMode: "ai-movie" } });
assert.equal(runtimeB.getProjectConversationMessages(other.id).length, 0, "Conversation history must not leak across projects.");

console.log("Movie Mentor conversation continuity verification: PASS");

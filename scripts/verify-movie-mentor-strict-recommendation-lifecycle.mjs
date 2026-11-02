import assert from "node:assert/strict";
import createCreatorMemory, { createMemoryStorageAdapter } from "../src/components/studio/mentor/CreatorMemory.js";
import { requireVerifiedMemoryAuthority } from "../src/components/studio/mentor/VerifiedMemoryAuthority.js";

// Independent strict physical court: recommendation replacement must be part of
// the same shared-authority transaction as conversation and handoff settlement.
// The original legacy Studio caller remains untouched until this court is GREEN.
const storage = createMemoryStorageAdapter();
const locks = {
  async request(name, optionsOrCallback, maybeCallback) {
    const callback = typeof optionsOrCallback === "function" ? optionsOrCallback : maybeCallback;
    assert.equal(typeof callback, "function");
    return callback({ name, mode: "exclusive" });
  },
};
const options = { storageAdapter: storage, storageKey: "movie-mentor-strict-recommendation-lifecycle", requireSharedWriteAuthority: true };
const memory = createCreatorMemory(options);
assert.equal(requireVerifiedMemoryAuthority(memory), memory);
const projectId = "movie-project-strict-recommendation";
const ids = ["strict-recommendation-1", "strict-recommendation-2", "strict-recommendation-3"];
for (let index = 0; index < ids.length; index += 1) {
  const recommendationId = ids[index];
  const creatorTurnId = `strict-turn-${index + 1}`;
  const result = await memory.settleConversationWithSharedAuthority({
    locks, projectId, creatorTurnId, settlementLockName: "iband.movie-mentor.creator-memory-settlement",
    conversation: {
      summary: `Creator turn ${index + 1}`,
      creatorMessage: `Continue scene ${index + 1}`,
      mentorResponse: `Recommendation ${index + 1}`,
      relatedProjectIds: [projectId],
      metadata: { projectId, creatorTurnId, source: "movie-mentor-conversation" },
    },
    handoff: {
      projectId, sessionId: "strict-session",
      title: "Strict recommendation continuation",
      content: `Continue after turn ${index + 1}`,
      value: { lastCreatorMessage: `Continue scene ${index + 1}`, lastMentorResponse: `Recommendation ${index + 1}` },
      metadata: { projectId, creatorTurnId },
    },
    recommendation: {
      projectId,
      memoryKey: `journey-recommendation:${recommendationId}`,
      content: `Recommendation ${index + 1}`,
      source: "mentor", certainty: "observed", confidence: 1,
      metadata: {
        projectId,
        recommendationReference: {
          domain: "iband.movie-mentor.journey-recommendation-reference",
          schema: 2, projectId, recommendationId,
          lifecycle: { current: true, terminalReason: null },
        },
      },
    },
  });
  assert.equal(result.acquired, true, "Every recommendation settlement requires shared authority.");
  assert.ok(result.value?.conversation?.id, "Conversation must settle atomically.");
  assert.ok(result.value?.handoff?.id, "Handoff must settle atomically.");
  assert.ok(result.value?.recommendation?.id, "Recommendation must settle atomically.");
  assert.deepEqual(result.value.retiredRecommendationIds || [], index === 0 ? [] : [ids[index - 1]]);
}
const reloaded = createCreatorMemory(options);
const state = reloaded.readPersistedState();
const references = (state.projectMemories || []).map(entry => entry?.metadata?.recommendationReference)
  .filter(reference => reference?.domain === "iband.movie-mentor.journey-recommendation-reference" && reference?.projectId === projectId);
assert.equal(references.length, 3, "All three recommendation records must survive reload.");
assert.deepEqual(references.filter(reference => reference.lifecycle?.current === true).map(reference => reference.recommendationId), [ids[2]]);
for (let index = 0; index < 2; index += 1) {
  const previous = references.find(reference => reference.recommendationId === ids[index]);
  assert.equal(previous?.lifecycle?.current, false);
  assert.equal(previous?.lifecycle?.terminalReason, "superseded");
  assert.equal(previous?.lifecycle?.supersededByRecommendationId, ids[index + 1]);
}
assert.equal((state.conversations || []).filter(entry => entry?.metadata?.projectId === projectId).length, 3);
assert.equal((state.sessionHandoffs || []).filter(entry => entry?.metadata?.projectId === projectId).length, 3);
console.log("GREEN: strict shared-authority settlement retains exactly one current recommendation, two retired references, and all conversations and handoffs after reload.");

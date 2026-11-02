import assert from "node:assert/strict";
import createCreatorMemory, { createMemoryStorageAdapter } from "../src/components/studio/mentor/CreatorMemory.js";
import createCreatorJourneyEngine from "../src/components/studio/mentor/CreatorJourneyEngine.js";
import createMovieMentorStudioIdentityRuntime, { RECOMMENDATION_REFERENCE_DOMAIN } from "../src/components/studio/mentor/MovieMentorStudioIdentityRuntime.js";
import { syncMovieMentorDurableState } from "../src/components/studio/mentor/MovieMentorDurableStateSync.js";

const cryptoImpl = { randomUUID: () => "22222222-3333-4444-8555-666666666666" };
const storageAdapter = createMemoryStorageAdapter();
const options = { storageAdapter, projectIdentityCrypto: cryptoImpl, requireSharedWriteAuthority: true };
const locks = { async request(name, optionsOrCallback, maybeCallback) {
  const callback = typeof optionsOrCallback === "function" ? optionsOrCallback : maybeCallback;
  assert.equal(typeof callback, "function");
  return callback({ name, mode: "exclusive" });
} };
const memory = createCreatorMemory(options);
const projectJourney = createCreatorJourneyEngine().createMovieJourney({ creatorType: "video", creatorMode: "ai-movie", creatorJourney: "guide" });
const runtime = createMovieMentorStudioIdentityRuntime({ memory, cryptoImpl, settlementLockManager: locks });
const created = await runtime.ensureProjectWithSharedAuthority({ title: "The Hidden Tunnel", projectJourney });
assert.equal(created.acquired, true);
const project = runtime.getActiveProject();
assert.ok(project?.id, "Strict shared-authority project creation must establish canonical project identity.");

const tasks = ["escape-through-tunnel", "objective-after-escape", "lighthouse-discovery"];
const revisions = [7, 8, 9];
const ids = [];
for (let index = 0; index < tasks.length; index += 1) {
  const task = tasks[index];
  const revision = revisions[index];
  runtime.recordConversationMessage(project.id, { role: "creator", text: index === 2 ? "Yes, do that." : `Please consider ${task}.` }, { projectJourney });
  const live = await runtime.settleConversationMessage(project.id, {
    role: "mentor",
    text: index === 2 ? "Now let's explore what Maya finds at the lighthouse." : `Consider ${task} next.`,
    metadata: {
      liveBackendTurn: true,
      turnContextProof: { revision: revision - 1 },
      semanticIntelligence: { readyToAdvance: true, recommendedStageId: "story", recommendedTaskId: task, clarificationNeeded: [], nextAction: { label: task } },
      specialistResult: { contributions: [] },
      continuityConsequenceEnvelope: null,
      authority: { creatorTruthDominates: true },
      mayAdvanceJourney: false,
      backendMetadata: {
        creatorTurnId: `recommendation-reference-turn-${index + 1}`,
        postCommitCreatorAuthority: { revision, creatorConfirmedContext: [{ key: "character.maya.location", value: "lighthouse", authority: "creator" }] },
      },
    },
  }, { projectJourney });
  assert.ok(live?.conversation?.id, "Every mentor turn must settle a conversation atomically.");
  assert.ok(live?.handoff?.id, "Every mentor turn must settle a handoff atomically.");
  const record = live?.recommendationReference;
  assert.ok(record?.id, "Live backend planning must produce an advisory recommendation.");
  const evidence = record.metadata.recommendationReference;
  assert.equal(evidence.domain, RECOMMENDATION_REFERENCE_DOMAIN);
  assert.equal(evidence.provenance.turnRevision, revision, "Post-commit creator authority revision must be preserved.");
  assert.equal(evidence.recommendation.recommendedTaskId, task);
  assert.equal(evidence.lifecycle.current, true);
  assert.ok(!ids.includes(evidence.recommendationId), "Each new planning recommendation must have a distinct identity.");
  assert.deepEqual(record.retiredRecommendationIds || [], index === 0 ? [] : [ids[index - 1]]);
  ids.push(evidence.recommendationId);
  const current = runtime.getCurrentRecommendationReferences(project.id);
  assert.equal(current.length, 1, "Exactly one advisory recommendation must remain current.");
  assert.equal(current[0].metadata.recommendationReference.recommendationId, ids[index]);
}
const refs = memory.getProjectMemories({ projectId: project.id }).filter(entry => entry?.metadata?.recommendationReference?.domain === RECOMMENDATION_REFERENCE_DOMAIN);
assert.equal(refs.length, 3);
for (let index = 0; index < 2; index += 1) {
  const retired = refs.find(entry => entry.metadata.recommendationReference.recommendationId === ids[index]);
  assert.equal(retired.metadata.recommendationReference.lifecycle.current, false);
  assert.equal(retired.metadata.recommendationReference.lifecycle.terminalReason, "superseded");
  assert.equal(retired.metadata.recommendationReference.lifecycle.supersededByRecommendationId, ids[index + 1]);
}

const reloadedMemory = createCreatorMemory(options);
const reloadedRuntime = createMovieMentorStudioIdentityRuntime({ memory: reloadedMemory, cryptoImpl, settlementLockManager: locks });
const reloadedAll = reloadedMemory.getProjectMemories({ projectId: project.id }).filter(entry => entry?.metadata?.recommendationReference?.domain === RECOMMENDATION_REFERENCE_DOMAIN);
const reloadedCurrent = reloadedRuntime.getCurrentRecommendationReferences(project.id);
assert.equal(reloadedAll.length, 3);
assert.equal(reloadedCurrent.length, 1);
assert.equal(reloadedCurrent[0].metadata.recommendationReference.recommendationId, ids[2]);
assert.equal(reloadedCurrent[0].metadata.recommendationReference.provenance.turnRevision, 9);
for (let index = 0; index < 2; index += 1) {
  const retired = reloadedAll.find(entry => entry.metadata.recommendationReference.recommendationId === ids[index]);
  assert.equal(retired.metadata.recommendationReference.lifecycle.current, false);
  assert.equal(retired.metadata.recommendationReference.lifecycle.supersededByRecommendationId, ids[index + 1]);
}

let syncBody = null;
let syncAuthorization = null;
await syncMovieMentorDurableState({
  projectId: project.id,
  creatorSessionId: runtime.creatorSessionId,
  memoryState: reloadedMemory.getState(),
  storage: { getItem: () => null, setItem() {} },
  getAuthToken: async () => "recommendation-reference-test-token",
  fetchImpl: async (_url, request) => {
    syncAuthorization = request.headers?.Authorization || null;
    syncBody = JSON.parse(request.body);
    return { ok: true, status: 200, json: async () => ({ success: true, state: { revision: 1 } }) };
  },
});
assert.equal(syncAuthorization, "Bearer recommendation-reference-test-token");
const synced = syncBody.state.memoryContext.projectMemories.filter(entry => entry?.metadata?.recommendationReference?.domain === RECOMMENDATION_REFERENCE_DOMAIN);
assert.equal(synced.length, 3);
assert.equal(synced.filter(entry => entry.metadata.recommendationReference.lifecycle.current === true).length, 1);
assert.equal(synced.find(entry => entry.metadata.recommendationReference.lifecycle.current === true).metadata.recommendationReference.recommendationId, ids[2]);
for (let index = 0; index < 2; index += 1) {
  const retired = synced.find(entry => entry.metadata.recommendationReference.recommendationId === ids[index]);
  assert.equal(retired.metadata.recommendationReference.lifecycle.current, false);
  assert.equal(retired.metadata.recommendationReference.lifecycle.supersededByRecommendationId, ids[index + 1]);
}
console.log("GREEN: three real live Studio planning turns settle atomically, retire prior recommendations, preserve revision 9 and reload, and retain lifecycle evidence through authenticated durable sync.");

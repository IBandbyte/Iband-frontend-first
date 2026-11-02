import assert from "node:assert/strict";
import createCreatorMemory, { createMemoryStorageAdapter } from "../src/components/studio/mentor/CreatorMemory.js";
import createCreatorJourneyEngine from "../src/components/studio/mentor/CreatorJourneyEngine.js";
import createMovieMentorStudioIdentityRuntime, { RECOMMENDATION_REFERENCE_DOMAIN } from "../src/components/studio/mentor/MovieMentorStudioIdentityRuntime.js";

const storageAdapter = createMemoryStorageAdapter();
const cryptoImpl = { randomUUID: () => "22222222-3333-4444-8555-666666666666" };
const locks = { async request(name, optionsOrCallback, maybeCallback) {
  const callback = typeof optionsOrCallback === "function" ? optionsOrCallback : maybeCallback;
  assert.equal(typeof callback, "function");
  return callback({ name, mode: "exclusive" });
} };
const options = { storageAdapter, projectIdentityCrypto: cryptoImpl, requireSharedWriteAuthority: true };
const memory = createCreatorMemory(options);
const runtime = createMovieMentorStudioIdentityRuntime({ memory, cryptoImpl, settlementLockManager: locks });
const projectJourney = createCreatorJourneyEngine().createMovieJourney({ creatorType: "video", creatorMode: "ai-movie", creatorJourney: "guide" });
const creation = await runtime.ensureProjectWithSharedAuthority({ title: "The Hidden Tunnel", projectJourney });
assert.equal(creation.acquired, true);
const project = runtime.getActiveProject();
assert.ok(project?.id);
runtime.recordConversationMessage(project.id, { role: "creator", text: "Yes, do that." }, { projectJourney });
const live = await runtime.settleConversationMessage(project.id, {
  role: "mentor",
  text: "Now let's explore what Maya finds at the lighthouse.",
  metadata: {
    liveBackendTurn: true,
    turnContextProof: { revision: 8 },
    semanticIntelligence: { readyToAdvance: true, recommendedStageId: "story", recommendedTaskId: "lighthouse-discovery", clarificationNeeded: [], nextAction: { label: "lighthouse-discovery" } },
    specialistResult: { contributions: [] },
    continuityConsequenceEnvelope: null,
    authority: { creatorTruthDominates: true },
    mayAdvanceJourney: false,
    backendMetadata: {
      creatorTurnId: "strict-live-provenance-turn",
      postCommitCreatorAuthority: { revision: 9, creatorConfirmedContext: [{ key: "character.maya.location", value: "lighthouse", authority: "creator" }] },
    },
  },
}, { projectJourney });
assert.ok(live?.conversation?.id, "Strict live turn must commit a conversation.");
assert.ok(live?.recommendationReference?.id, "Strict live turn must generate an advisory recommendation.");
const evidence = live.recommendationReference.metadata.recommendationReference;
assert.equal(evidence.domain, RECOMMENDATION_REFERENCE_DOMAIN);
assert.equal(evidence.provenance.turnRevision, 9, "Post-commit creator authority must determine provenance revision.");
assert.equal(evidence.recommendation.recommendedTaskId, "lighthouse-discovery");
assert.equal(evidence.lifecycle.current, true);
const reloaded = createCreatorMemory(options);
const persisted = reloaded.readPersistedState();
const saved = (persisted.projectMemories || []).filter(entry => entry?.metadata?.recommendationReference?.domain === RECOMMENDATION_REFERENCE_DOMAIN);
assert.equal(saved.length, 1);
assert.equal(saved[0].metadata.recommendationReference.provenance.turnRevision, 9);
assert.equal((persisted.conversations || []).filter(entry => entry?.metadata?.projectId === project.id).length, 1);
console.log("GREEN: strict Studio live backend turn preserves post-commit creator authority revision 9, advisory task and durable recommendation evidence.");

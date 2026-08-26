import assert from "node:assert/strict";
import createCreatorMemory, {
  createMemoryStorageAdapter,
  PROJECT_STATUSES,
} from "../src/components/studio/mentor/CreatorMemory.js";
import createMovieMentorStudioIdentityRuntime, {
  RECOMMENDATION_REFERENCE_DOMAIN,
  RECOMMENDATION_REFERENCE_SCHEMA,
  buildRecommendationReferenceEvidence,
} from "../src/components/studio/mentor/MovieMentorStudioIdentityRuntime.js";
import { syncMovieMentorDurableState } from "../src/components/studio/mentor/MovieMentorDurableStateSync.js";

const deterministicCrypto = { randomUUID: () => "22222222-3333-4444-8555-666666666666" };
const storageAdapter = createMemoryStorageAdapter();
const memory = createCreatorMemory({ storageAdapter, projectIdentityCrypto: deterministicCrypto });
const project = memory.saveProject({
  title: "The Hidden Tunnel",
  creatorType: "video",
  status: PROJECT_STATUSES.CREATING,
  metadata: { creatorMode: "ai-movie", creatorModeLabel: "AI Movie Making" },
});

const runtime = createMovieMentorStudioIdentityRuntime({ memory, cryptoImpl: deterministicCrypto });
const planningEvidence = {
  contractVersion: "1.0.0",
  authority: "advisory-only",
  creatorConfirmed: false,
  mayCreateCanon: false,
  mayAdvanceJourney: false,
  semanticDirection: {
    nextAction: { label: "Develop Maya's objective after the escape" },
  },
  recommendation: {
    recommendedStageId: "story",
    recommendedTaskId: "objective-after-escape",
    reasonCodes: ["story-advice-considered", "character-advice-considered", "continuity-advice-considered"],
    confidence: 0.91,
    alternatives: [{ label: "Stay on the escape beat" }],
  },
  clarification: { required: false, reasons: [] },
  provenance: { bridgeVersion: "1.3.0", turnRevision: 7, sourceAgents: ["story", "character", "continuity"] },
};

const evidence = buildRecommendationReferenceEvidence({
  projectId: project.id,
  creatorSessionId: runtime.creatorSessionId,
  planningEvidence,
  turnRevision: 7,
});
assert.equal(evidence.domain, RECOMMENDATION_REFERENCE_DOMAIN);
assert.equal(evidence.schema, RECOMMENDATION_REFERENCE_SCHEMA);
assert.equal(evidence.authority, "mentor-advisory");
assert.equal(evidence.creatorConfirmed, false);
assert.equal(evidence.mayCreateCanon, false);
assert.equal(evidence.mayAdvanceJourney, false);
assert.equal(evidence.provenance.turnRevision, 7);
assert.match(evidence.recommendation.recommendedNextStep, /Maya's objective/i);

const saved = runtime.recordRecommendationReference(project.id, planningEvidence, { turnRevision: 7 });
assert.ok(saved?.id);
assert.equal(saved.projectId, project.id);
assert.equal(saved.metadata.recommendationReference.recommendationId, evidence.recommendationId);
assert.equal(saved.metadata.recommendationReference.creatorConfirmed, false);

const reloadedMemory = createCreatorMemory({ storageAdapter, projectIdentityCrypto: deterministicCrypto });
const reloadedReferences = reloadedMemory
  .getProjectMemories({ projectId: project.id })
  .filter((item) => item?.metadata?.recommendationReference?.domain === RECOMMENDATION_REFERENCE_DOMAIN);
assert.equal(reloadedReferences.length, 1);
assert.equal(reloadedReferences[0].metadata.recommendationReference.recommendationId, evidence.recommendationId);
assert.equal(reloadedReferences[0].metadata.recommendationReference.provenance.turnRevision, 7);

let syncBody = null;
await syncMovieMentorDurableState({
  projectId: project.id,
  creatorSessionId: runtime.creatorSessionId,
  memoryState: reloadedMemory.getState(),
  storage: { getItem: () => null, setItem() {} },
  fetchImpl: async (_url, options) => {
    syncBody = JSON.parse(options.body);
    return { ok: true, status: 200, json: async () => ({ success: true, state: { revision: 8 } }) };
  },
});
const syncedReference = syncBody.state.memoryContext.projectMemories.find(
  (item) => item?.metadata?.recommendationReference?.domain === RECOMMENDATION_REFERENCE_DOMAIN
);
assert.ok(syncedReference);
assert.equal(syncedReference.metadata.recommendationReference.recommendationId, evidence.recommendationId);
assert.equal(syncedReference.metadata.recommendationReference.creatorConfirmed, false);
assert.equal(syncedReference.metadata.recommendationReference.mayCreateCanon, false);
assert.equal(syncedReference.metadata.recommendationReference.mayAdvanceJourney, false);

const clarification = buildRecommendationReferenceEvidence({
  projectId: project.id,
  creatorSessionId: runtime.creatorSessionId,
  planningEvidence: { ...planningEvidence, clarification: { required: true, reasons: ["ambiguous"] } },
  turnRevision: 8,
});
assert.equal(clarification, null);

console.log("Movie Mentor Journey recommendation reference evidence verification: PASS");

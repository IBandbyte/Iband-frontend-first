import assert from "node:assert/strict";
import createCreatorMemory, {
  createMemoryStorageAdapter,
  PROJECT_STATUSES,
} from "../src/components/studio/mentor/CreatorMemory.js";
import createCreatorJourneyEngine from "../src/components/studio/mentor/CreatorJourneyEngine.js";
import createMovieMentorStudioIdentityRuntime, {
  RECOMMENDATION_REFERENCE_DOMAIN,
  RECOMMENDATION_REFERENCE_SCHEMA,
  buildRecommendationReferenceEvidence,
} from "../src/components/studio/mentor/MovieMentorStudioIdentityRuntime.js";
import { syncMovieMentorDurableState } from "../src/components/studio/mentor/MovieMentorDurableStateSync.js";

const deterministicCrypto = { randomUUID: () => "22222222-3333-4444-8555-666666666666" };
const storageAdapter = createMemoryStorageAdapter();
const memory = createCreatorMemory({ storageAdapter, projectIdentityCrypto: deterministicCrypto });
const journeyEngine = createCreatorJourneyEngine();
const projectJourney = journeyEngine.createMovieJourney({
  creatorType: "video",
  creatorMode: "ai-movie",
  creatorJourney: "guide",
});
const project = memory.saveProject({
  title: "The Hidden Tunnel",
  creatorType: "video",
  status: PROJECT_STATUSES.CREATING,
  metadata: { creatorMode: "ai-movie", creatorModeLabel: "AI Movie Making", projectJourney },
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
  provenance: { bridgeVersion: "1.4.0", turnRevision: 7, sourceAgents: ["story", "character", "continuity"] },
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

runtime.recordConversationMessage(project.id, {
  role: "creator",
  text: "Maya escapes through the hidden tunnel.",
}, { projectJourney });
const liveResult = runtime.recordConversationMessage(project.id, {
  role: "mentor",
  text: "Let's work out what Maya wants immediately after the escape.",
  metadata: {
    liveBackendTurn: true,
    turnContextProof: { revision: 8 },
    semanticIntelligence: {
      understoodContext: [],
      provisionalContext: [],
      unresolvedContext: [],
      clarificationNeeded: [],
      readyToAdvance: true,
      recommendedStageId: "story-direction",
      recommendedTaskId: "objective-after-escape",
      nextAction: { label: "Develop Maya's objective after the escape" },
      resumeNote: null,
    },
    specialistResult: {
      contributions: [
        {
          agentId: "story",
          authority: "mentor-provisional",
          creatorFacing: false,
          mayAdvanceJourney: false,
          mayOverwriteCreatorTruth: false,
          observations: [],
          provisionalSuggestions: [{ key: "story.next-focus", value: "objective-after-escape" }],
          risksAndConflicts: [],
          creatorConfirmedDependencies: [],
          confidence: 0.9,
        },
        {
          agentId: "character",
          authority: "mentor-provisional",
          creatorFacing: false,
          mayAdvanceJourney: false,
          mayOverwriteCreatorTruth: false,
          observations: [],
          provisionalSuggestions: [{ key: "character.next-focus", value: "Maya-objective" }],
          risksAndConflicts: [],
          creatorConfirmedDependencies: [],
          confidence: 0.88,
        },
      ],
    },
    continuityConsequenceEnvelope: {
      status: "consistent",
      authority: "derived-continuity",
      creatorConfirmed: false,
      mayCreateCanon: false,
      requiresClarification: false,
      derivedConstraints: [],
      conflicts: [],
      unresolvedQuestions: [],
    },
    authority: { creatorTruthDominates: true },
    mayAdvanceJourney: false,
    backendMetadata: {},
  },
}, { projectJourney });
assert.equal(liveResult.status, "conversation-persisted");
assert.ok(liveResult.recommendationReference?.id);
assert.equal(liveResult.recommendationReference.metadata.recommendationReference.provenance.turnRevision, 8);
assert.equal(liveResult.recommendationReference.metadata.recommendationReference.creatorConfirmed, false);
assert.equal(liveResult.recommendationReference.metadata.recommendationReference.mayCreateCanon, false);

const reloadedMemory = createCreatorMemory({ storageAdapter, projectIdentityCrypto: deterministicCrypto });
const reloadedReferences = reloadedMemory
  .getProjectMemories({ projectId: project.id })
  .filter((item) => item?.metadata?.recommendationReference?.domain === RECOMMENDATION_REFERENCE_DOMAIN);
assert.equal(reloadedReferences.length, 2);
assert.ok(reloadedReferences.some((item) => item.metadata.recommendationReference.provenance.turnRevision === 8));

let syncBody = null;
await syncMovieMentorDurableState({
  projectId: project.id,
  creatorSessionId: runtime.creatorSessionId,
  memoryState: reloadedMemory.getState(),
  storage: { getItem: () => null, setItem() {} },
  fetchImpl: async (_url, options) => {
    syncBody = JSON.parse(options.body);
    return { ok: true, status: 200, json: async () => ({ success: true, state: { revision: 9 } }) };
  },
});
const syncedReferences = syncBody.state.memoryContext.projectMemories.filter(
  (item) => item?.metadata?.recommendationReference?.domain === RECOMMENDATION_REFERENCE_DOMAIN
);
assert.equal(syncedReferences.length, 2);
assert.ok(syncedReferences.some((item) => item.metadata.recommendationReference.provenance.turnRevision === 8));
assert.ok(syncedReferences.every((item) => item.metadata.recommendationReference.creatorConfirmed === false));
assert.ok(syncedReferences.every((item) => item.metadata.recommendationReference.mayCreateCanon === false));
assert.ok(syncedReferences.every((item) => item.metadata.recommendationReference.mayAdvanceJourney === false));

const clarification = buildRecommendationReferenceEvidence({
  projectId: project.id,
  creatorSessionId: runtime.creatorSessionId,
  planningEvidence: { ...planningEvidence, clarification: { required: true, reasons: ["ambiguous"] } },
  turnRevision: 9,
});
assert.equal(clarification, null);

console.log("Movie Mentor Journey recommendation reference evidence verification: PASS");

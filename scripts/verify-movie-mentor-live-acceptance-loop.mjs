import assert from "node:assert/strict";
import createCreatorMemory, {
  createMemoryStorageAdapter,
  PROJECT_STATUSES,
} from "../src/components/studio/mentor/CreatorMemory.js";
import createCreatorJourneyEngine from "../src/components/studio/mentor/CreatorJourneyEngine.js";
import createMovieJourneyIntelligenceBridge from "../src/components/studio/mentor/MovieJourneyIntelligenceBridge.js";
import createMovieMentorStudioIdentityRuntime, {
  RECOMMENDATION_REFERENCE_DOMAIN,
} from "../src/components/studio/mentor/MovieMentorStudioIdentityRuntime.js";
import { normalisePostCommitCreatorAuthority } from "../src/components/studio/mentor/MovieMentorTurnClient.js";

import { resolveContinuationReferences } from "../iband-backend/ai/MovieMentorContinuationReferenceControl.js";
import {
  buildCreatorDecisionCandidate,
  commitCreatorDecision,
} from "../iband-backend/ai/MovieMentorCreatorDecisionAuthority.js";
import { selectCurrentRecommendationReference } from "../iband-backend/ai/MovieMentorRecommendationReferenceControl.js";

const cryptoImpl = { randomUUID: () => "11111111-2222-4333-8444-555555555555" };
const storageAdapter = createMemoryStorageAdapter();
const memory = createCreatorMemory({ storageAdapter, projectIdentityCrypto: cryptoImpl });
const journeyEngine = createCreatorJourneyEngine();
const journeyBridge = createMovieJourneyIntelligenceBridge({ journeyEngine });
const projectJourney = journeyEngine.createMovieJourney({ creatorType: "video", creatorMode: "ai-movie", creatorJourney: "guide" });
const project = memory.saveProject({
  title: "Door 11D4 Acceptance Loop",
  creatorType: "video",
  status: PROJECT_STATUSES.CREATING,
  metadata: { creatorMode: "ai-movie", creatorModeLabel: "AI Movie Making", projectJourney },
});
const runtime = createMovieMentorStudioIdentityRuntime({ memory, cryptoImpl });

function planningEvidence(task, revision) {
  return {
    contractVersion: "1.1.0",
    authority: "advisory-only",
    creatorConfirmed: false,
    mayCreateCanon: false,
    mayAdvanceJourney: false,
    semanticDirection: { nextAction: { label: task }, readyToAdvance: true, recommendedStageId: "story", recommendedTaskId: task },
    recommendation: { recommendedStageId: "story", recommendedTaskId: task, reasonCodes: ["semantic-direction-ready"], confidence: 0.9, alternatives: [] },
    clarification: { required: false, reasons: [] },
    provenance: { bridgeVersion: "1.5.0", turnRevision: revision, authorityRevision: revision },
  };
}

function memoryContextFrom(mem) {
  const state = mem.getState();
  return {
    projectMemories: structuredClone(state.projectMemories || []),
    conversations: structuredClone(state.conversations || []),
    sessionHandoffs: structuredClone(state.sessionHandoffs || []),
  };
}

// 1. Recommendation A is advisory and current.
const savedA = runtime.recordRecommendationReference(project.id, planningEvidence("escape-through-tunnel", 20), { turnRevision: 20 });
assert.ok(savedA?.id);
const recommendationA = savedA.metadata.recommendationReference.recommendationId;
let memoryContext = memoryContextFrom(memory);
let selected = selectCurrentRecommendationReference({ memoryContext, projectId: project.id });
assert.equal(selected.status, "resolved");
assert.equal(selected.recommendationId, recommendationA);

// 2. The creator uses the real continuation phrase. It must resolve exactly A.
let resolution = resolveContinuationReferences({
  creatorMessage: "Yes, do that.",
  projectId: project.id,
  memoryContext,
  creatorConfirmedContext: [],
});
assert.equal(resolution.hasMaterialAmbiguity, false);
assert.equal(resolution.references.length, 1);
assert.equal(resolution.references[0].type, "journey-recommendation");
assert.equal(resolution.references[0].resolvedValue.recommendationId, recommendationA);

let decision = buildCreatorDecisionCandidate({
  creatorMessage: "Yes, do that.",
  semanticIntelligence: { understoodContext: [], continuationReferences: resolution.references },
  projectId: project.id,
  actorRole: "creator",
});
assert.equal(decision.status, "candidate");
assert.equal(decision.candidate.value.recommendationId, recommendationA);

// 3. Commit A against durable creator reality N and prove post-commit N+1 readback.
let durableState = {
  projectId: project.id,
  creatorSessionId: runtime.creatorSessionId,
  revision: 20,
  revisionAuthorityReference: "revision-20",
  creatorStateGeneration: 4,
  creatorStateFingerprint: "fingerprint-20",
  creatorAuthorityReference: "authority-20",
  snapshotReference: "snapshot-20",
  capturedAt: "2026-08-26T21:40:00.000Z",
  creatorConfirmedContext: [],
};
const read = async () => structuredClone(durableState);
const transition = async (request) => {
  assert.equal(request.expectedRevision, durableState.revision);
  durableState = {
    ...durableState,
    revision: durableState.revision + 1,
    revisionAuthorityReference: `revision-${durableState.revision + 1}`,
    creatorStateGeneration: durableState.creatorStateGeneration + 1,
    creatorStateFingerprint: `fingerprint-${durableState.revision + 1}`,
    creatorAuthorityReference: `authority-${durableState.revision + 1}`,
    snapshotReference: `snapshot-${durableState.revision + 1}`,
    capturedAt: "2026-08-26T21:41:00.000Z",
    creatorConfirmedContext: structuredClone(request.state.creatorConfirmedContext),
  };
  return structuredClone(durableState);
};
const committed = await commitCreatorDecision({
  candidate: decision.candidate,
  expectedRevision: 20,
  projectId: project.id,
  creatorSessionId: runtime.creatorSessionId,
}, {
  readAuthoritativeTurnSource: read,
  applyMovieMentorCreatorStateTransition: transition,
});
assert.equal(committed.status, "committed");
assert.equal(committed.revision, 21);
assert.equal(committed.postCommitCreatorAuthority.revision, 21);
assert.equal(committed.postCommitCreatorAuthority.currentCreatorTruth.at(-1).value.recommendationId, recommendationA);

// 4. Transport the real backend N+1 envelope through the frontend normalizer.
const transportedAuthority = normalisePostCommitCreatorAuthority(
  committed.postCommitCreatorAuthority,
  { revision: 20 }
);
assert.equal(transportedAuthority.revision, 21);
assert.equal(transportedAuthority.creatorConfirmedContext.at(-1).value.recommendationId, recommendationA);

// 5. Journey re-reasons from N+1 while its local Journey object is still N.
const refreshedPlanning = journeyBridge.consumeTurnForJourneyPlanning(projectJourney, {
  status: "mentor-response-ready",
  turnContextProof: { revision: 20 },
  postCommitCreatorAuthority: transportedAuthority,
  semanticIntelligence: {
    readyToAdvance: true,
    recommendedStageId: "story",
    recommendedTaskId: "objective-after-escape",
    nextAction: { label: "objective-after-escape" },
    clarificationNeeded: [],
  },
  specialistResult: { contributions: [] },
  continuityConsequenceEnvelope: null,
});
const evidenceB = refreshedPlanning.journeyPlanningEvidence;
assert.equal(evidenceB.creatorAuthoritySource, "post-commit-authority");
assert.equal(evidenceB.creatorAuthorityRevision, 21);
assert.equal(evidenceB.localJourneyStale, true);
assert.equal(evidenceB.recommendation.recommendedTaskId, "objective-after-escape");
assert.ok(evidenceB.recommendation.reasonCodes.includes("post-commit-creator-authority-applied"));

// 6. Persist B. A must become historical immediately.
const savedB = runtime.recordRecommendationReference(project.id, evidenceB, { turnRevision: 21 });
assert.ok(savedB?.id);
const recommendationB = savedB.metadata.recommendationReference.recommendationId;
assert.notEqual(recommendationB, recommendationA);
assert.ok(savedB.retiredRecommendationIds.includes(recommendationA));
memoryContext = memoryContextFrom(memory);
const refsBeforeRestart = memoryContext.projectMemories
  .map((item) => item?.metadata?.recommendationReference)
  .filter((item) => item?.domain === RECOMMENDATION_REFERENCE_DOMAIN);
assert.equal(refsBeforeRestart.filter((item) => item.lifecycle?.current === true).length, 1);
assert.equal(refsBeforeRestart.find((item) => item.recommendationId === recommendationA).lifecycle.current, false);
assert.equal(refsBeforeRestart.find((item) => item.recommendationId === recommendationB).lifecycle.current, true);

// 7. Kill/reload. The exact same phrase must now resolve B and never A.
const reloadedMemory = createCreatorMemory({ storageAdapter, projectIdentityCrypto: cryptoImpl });
const reloadedRuntime = createMovieMentorStudioIdentityRuntime({ memory: reloadedMemory, cryptoImpl });
const reloadedContext = memoryContextFrom(reloadedMemory);
selected = selectCurrentRecommendationReference({ memoryContext: reloadedContext, projectId: project.id });
assert.equal(selected.status, "resolved");
assert.equal(selected.recommendationId, recommendationB);
assert.notEqual(selected.recommendationId, recommendationA);
assert.equal(reloadedRuntime.getCurrentRecommendationReferences(project.id).length, 1);

resolution = resolveContinuationReferences({
  creatorMessage: "Yes, do that.",
  projectId: project.id,
  memoryContext: reloadedContext,
  creatorConfirmedContext: transportedAuthority.creatorConfirmedContext,
});
assert.equal(resolution.hasMaterialAmbiguity, false);
assert.equal(resolution.references.length, 1);
assert.equal(resolution.references[0].type, "journey-recommendation");
assert.equal(resolution.references[0].resolvedValue.recommendationId, recommendationB);
assert.notEqual(resolution.references[0].resolvedValue.recommendationId, recommendationA);

decision = buildCreatorDecisionCandidate({
  creatorMessage: "Yes, do that.",
  semanticIntelligence: { understoodContext: [], continuationReferences: resolution.references },
  projectId: project.id,
  actorRole: "creator",
});
assert.equal(decision.status, "candidate");
assert.equal(decision.candidate.value.recommendationId, recommendationB);
assert.notEqual(decision.candidate.value.recommendationId, recommendationA);

console.log("Movie Mentor Door 11D4 live acceptance loop: PASS — A resolves and commits at N, N+1 refreshes Journey, B replaces A, reload preserves retirement, and the next ‘Yes, do that’ resolves B only.");

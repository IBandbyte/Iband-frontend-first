import assert from "node:assert/strict";
import createCreatorMemory, {
  PROJECT_STATUSES,
  MEMORY_SOURCES,
  MEMORY_CERTAINTY,
  createMemoryStorageAdapter,
} from "../src/components/studio/mentor/CreatorMemory.js";
import createJourneyDurableAuthorityStore from "../src/components/studio/mentor/JourneyDurableAuthorityStore.js";
import createJourneyAuthorityReadFacade from "../src/components/studio/mentor/JourneyAuthorityReadFacade.js";
import { createAuthorityRecommendationRecord } from "../src/components/studio/mentor/JourneyAuthorityRecommendationLifecycle.js";

function journey(revision = 0) {
  return {
    creatorJourney: "guide",
    currentStageId: "idea",
    currentTaskId: "premise",
    progression: { schemaVersion: 1, revision, lastCommittedOperation: null, committedOperations: [] },
  };
}

function recommendationReference(projectId, id, fingerprint) {
  return {
    domain: "iband.movie-mentor.journey-recommendation-reference",
    schema: 2,
    recommendationId: id,
    recommendationFingerprint: fingerprint,
    projectId,
    issuedAgainst: { progressionRevision: 0 },
    target: { stageId: "idea", taskId: "premise" },
    lifecycle: { current: true, terminalReason: null },
  };
}

const memoryStorage = createMemoryStorageAdapter();
const authorityStorage = createMemoryStorageAdapter();
const authorityStore = createJourneyDurableAuthorityStore({ storage: authorityStorage, browserRuntime: false });
const readFacade = createJourneyAuthorityReadFacade({ authorityStore });
const memory = createCreatorMemory({
  storageAdapter: memoryStorage,
  projectIdentityCrypto: { randomUUID: () => "12121212-3434-4567-8abc-909090909090" },
  journeyAuthorityReadFacade: readFacade,
});

const project = memory.saveProject({
  title: "Recommendation Overlay Movie",
  creatorType: "video",
  status: PROJECT_STATUSES.CREATING,
  metadata: { creatorMode: "ai-movie", creatorModeLabel: "AI Movie Making", projectJourney: journey(0) },
});
const recommendationId = "journey-recommendation:overlay-R";
const fingerprint = "fp-overlay-R";
const reference = recommendationReference(project.id, recommendationId, fingerprint);
memory.saveProjectMemory({
  projectId: project.id,
  memoryKey: `journey-recommendation:${recommendationId}`,
  content: "Move to the next useful task",
  source: MEMORY_SOURCES.MENTOR,
  certainty: MEMORY_CERTAINTY.OBSERVED,
  metadata: { projectId: project.id, recommendationReference: reference },
});

// Before authority birth, advisory Creator Memory lifecycle is unchanged.
let visible = memory.getProjectMemories({ projectId: project.id });
assert.equal(visible.length, 1);
assert.equal(visible[0].metadata.recommendationReference.lifecycle.current, true);

await authorityStore.bootstrap({ project, nativeJourney: journey(0) });
let authority = authorityStore.read(project.id, { project });
const currentAuthorityRecommendation = createAuthorityRecommendationRecord(reference);
const authoritativeRecommendation = Object.freeze({
  ...currentAuthorityRecommendation,
  lifecycle: Object.freeze({
    current: false,
    terminalReason: "consumed",
    operationId: "journey-recommendation-noop:overlay-R",
    creatorActId: "creator-act-overlay-R",
    terminalProgressionRevision: 0,
    consumedWithoutMovement: true,
  }),
});
await authorityStore.compareAndCommit({
  project,
  expectedGeneration: authority.authority.generation,
  expectedProgressionRevision: 0,
  nextJourney: authority.journey,
  mutateRecord(candidate) {
    candidate.recommendations = [authoritativeRecommendation];
    return candidate;
  },
});

// Authority terminal lifecycle must overlay the returned Creator Memory clone.
visible = memory.getProjectMemories({ projectId: project.id });
const visibleLifecycle = visible[0].metadata.recommendationReference.lifecycle;
assert.equal(visibleLifecycle.current, false);
assert.equal(visibleLifecycle.terminalReason, "consumed");
assert.equal(visibleLifecycle.consumedByOperationId, "journey-recommendation-noop:overlay-R");
assert.equal(visibleLifecycle.consumedByCreatorActId, "creator-act-overlay-R");
assert.equal(visibleLifecycle.consumedAtProgressionRevision, 0);
assert.equal(visibleLifecycle.consumedWithoutMovement, true);

// Overlay is read-only: underlying Creator Memory advisory history remains untouched.
const rawState = memory.getState();
assert.equal(rawState.projectMemories[0].metadata.recommendationReference.lifecycle.current, true);
assert.equal(rawState.projectMemories[0].metadata.recommendationReference.lifecycle.terminalReason, null);

// Same recommendation ID with a different fingerprint is a proof conflict, not
// permission to expose stale Creator Memory advice as current.
assert.throws(
  () => readFacade.overlayRecommendationReferences({
    project,
    entries: [{
      projectId: project.id,
      metadata: { recommendationReference: recommendationReference(project.id, recommendationId, "wrong-fingerprint") },
    }],
  }),
  (error) => error?.code === "JOURNEY_AUTHORITY_RECOMMENDATION_IDENTITY_CONFLICT"
);

console.log("Journey Authority recommendation read overlay verification passed.");
console.log("- advisory references remain unchanged before authority has lifecycle knowledge");
console.log("- authority terminal lifecycle suppresses stale Creator Memory current=true on reads");
console.log("- overlay is read-only and preserves rich Creator Memory history");
console.log("- recommendation identity conflict fails closed");

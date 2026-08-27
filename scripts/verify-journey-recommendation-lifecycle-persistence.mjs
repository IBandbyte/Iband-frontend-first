import assert from "node:assert/strict";
import {
  persistJourneyAndRecommendationLifecycle,
  consumeRecommendationWithoutMovement,
  classifyRecommendationLifecycleRecovery,
} from "../src/components/studio/mentor/JourneyRecommendationLifecyclePersistence.js";

const projectId = "movie-project-lifecycle";
const recommendationId = "journey-recommendation:abc123";
const fingerprint = "abc123";

function journey(revision = 4) {
  return {
    projectId,
    currentStageId: revision >= 5 ? "character-foundations" : "story-direction",
    currentTaskId: revision >= 5 ? "protagonist" : "premise",
    progression: {
      schemaVersion: 1,
      revision,
      lastCommittedOperation: revision > 0 ? { operationId: `op-${revision}`, authorityId: `auth-${revision}`, fromRevision: revision - 1, toRevision: revision } : null,
      committedOperations: revision > 0 ? [{ operationId: `op-${revision}`, authorityId: `auth-${revision}`, fromRevision: revision - 1, toRevision: revision }] : [],
    },
  };
}

function recommendationReference(id = recommendationId, issuedRevision = 4) {
  return {
    domain: "iband.movie-mentor.journey-recommendation-reference",
    schema: 2,
    recommendationId: id,
    recommendationFingerprint: fingerprint,
    projectId,
    issuedAgainst: { progressionRevision: issuedRevision, currentStageId: "story-direction", currentTaskId: "premise" },
    target: { stageId: "character-foundations", taskId: "protagonist" },
    lifecycle: { current: true, terminalReason: null },
  };
}

function createMemory({ references = [recommendationReference()], projectJourney = journey(4) } = {}) {
  let state = {
    projects: [{ id: projectId, identity: { immutable: "identity-proof" }, metadata: { creatorMode: "ai-movie", projectJourney } }],
    projectMemories: references.map((reference, index) => ({ id: `memory-${index}`, projectId, metadata: { recommendationReference: structuredClone(reference) } })),
  };
  return {
    getState: () => structuredClone(state),
    replaceState: (next) => { state = structuredClone(next); },
    getProject: (id) => structuredClone(state.projects.find((project) => project.id === id) || null),
    snapshot: () => structuredClone(state),
  };
}

function runtime(memory) { return { memory }; }

// Acceptance + movement: Journey and exact R change in one state replacement.
{
  const memory = createMemory();
  const candidate = journey(5);
  candidate.progression.lastCommittedOperation = {
    operationId: `journey-recommendation-acceptance:${recommendationId}`,
    authorityId: "auth-accept",
    fromRevision: 4,
    toRevision: 5,
    recommendation: { recommendationId, fingerprint, disposition: "consumed", issuedAgainstProgressionRevision: 4 },
  };
  candidate.progression.committedOperations = [candidate.progression.lastCommittedOperation];
  const persisted = persistJourneyAndRecommendationLifecycle({
    identityRuntime: runtime(memory), projectId, candidateJourney: candidate,
    expectedProgressionRevision: 4, acceptedRecommendationId: recommendationId,
    recommendationFingerprint: fingerprint, operationId: candidate.progression.lastCommittedOperation.operationId,
    creatorActId: "creator-act-accept",
  });
  assert.equal(persisted.metadata.projectJourney.progression.revision, 5);
  const state = memory.snapshot();
  const ref = state.projectMemories[0].metadata.recommendationReference;
  assert.equal(ref.lifecycle.current, false);
  assert.equal(ref.lifecycle.terminalReason, "consumed");
  assert.equal(ref.lifecycle.consumedAtProgressionRevision, 5);
  assert.equal(ref.lifecycle.consumedWithoutMovement, false);
  assert.deepEqual(state.projects[0].identity, { immutable: "identity-proof" });
}

// Unrelated progression invalidates current recommendations issued against N.
{
  const memory = createMemory();
  persistJourneyAndRecommendationLifecycle({
    identityRuntime: runtime(memory), projectId, candidateJourney: journey(5), expectedProgressionRevision: 4,
    operationId: "manual-stage-click", creatorActId: "creator-manual",
  });
  const ref = memory.snapshot().projectMemories[0].metadata.recommendationReference;
  assert.equal(ref.lifecycle.current, false);
  assert.equal(ref.lifecycle.terminalReason, "invalidated-by-progression");
  assert.equal(ref.lifecycle.invalidatedAtProgressionRevision, 5);
}

// Stale revision must perform zero write.
{
  const memory = createMemory({ projectJourney: journey(5) });
  const before = memory.snapshot();
  assert.throws(() => persistJourneyAndRecommendationLifecycle({
    identityRuntime: runtime(memory), projectId, candidateJourney: journey(5), expectedProgressionRevision: 4,
    acceptedRecommendationId: recommendationId, recommendationFingerprint: fingerprint,
  }), (error) => error?.code === "MOVIE_MENTOR_JOURNEY_PROGRESSION_STALE");
  assert.deepEqual(memory.snapshot(), before);
}

// Missing/duplicate recommendation must perform zero write.
for (const references of [[], [recommendationReference(), recommendationReference()]]) {
  const memory = createMemory({ references });
  const before = memory.snapshot();
  assert.throws(() => persistJourneyAndRecommendationLifecycle({
    identityRuntime: runtime(memory), projectId, candidateJourney: journey(5), expectedProgressionRevision: 4,
    acceptedRecommendationId: recommendationId, recommendationFingerprint: fingerprint,
  }));
  assert.deepEqual(memory.snapshot(), before);
}

// No-op acceptance consumes R without moving revision and retry returns original lifecycle proof.
{
  const memory = createMemory();
  const first = consumeRecommendationWithoutMovement({
    identityRuntime: runtime(memory), projectId, recommendationId, recommendationFingerprint: fingerprint,
    expectedProgressionRevision: 4, operationId: `journey-recommendation-noop:${recommendationId}`,
    creatorActId: "creator-noop-original",
  });
  assert.equal(first.progressionRevision, 4);
  assert.equal(memory.getProject(projectId).metadata.projectJourney.progression.revision, 4);
  const second = consumeRecommendationWithoutMovement({
    identityRuntime: runtime(memory), projectId, recommendationId, recommendationFingerprint: fingerprint,
    expectedProgressionRevision: 4, operationId: `journey-recommendation-noop:${recommendationId}`,
    creatorActId: "creator-noop-retry",
  });
  assert.equal(second.status, "already-consumed-no-movement");
  assert.equal(second.creatorActId, "creator-noop-original");
}

// Crash repair: exact first-class receipt lineage proves consumed; no lineage means invalidated.
{
  const reference = recommendationReference();
  const consumedJourney = journey(5);
  consumedJourney.progression.committedOperations = [{
    operationId: "accept-op", authorityId: "auth", fromRevision: 4, toRevision: 5,
    recommendation: { recommendationId, fingerprint, disposition: "consumed", issuedAgainstProgressionRevision: 4 },
  }];
  assert.equal(classifyRecommendationLifecycleRecovery({ projectJourney: consumedJourney, recommendationReference: reference }).status, "repair-consumed");

  const unrelatedJourney = journey(5);
  assert.equal(classifyRecommendationLifecycleRecovery({ projectJourney: unrelatedJourney, recommendationReference: reference }).status, "repair-invalidated");
  assert.equal(classifyRecommendationLifecycleRecovery({ projectJourney: journey(4), recommendationReference: reference }).status, "potentially-current");

  const legacy = { ...reference, issuedAgainst: {} };
  assert.equal(classifyRecommendationLifecycleRecovery({ projectJourney: journey(5), recommendationReference: legacy }).status, "historical-only");
}

console.log("Journey recommendation lifecycle persistence verification passed.");
console.log("- acceptance movement commits Journey + consumed lifecycle coherently");
console.log("- unrelated movement invalidates prior recommendation reality");
console.log("- stale/missing/duplicate recommendation universes perform zero write");
console.log("- no-op acceptance is durable and idempotent without fake progression");
console.log("- immutable project identity survives whole-state replacement");
console.log("- crash repair distinguishes consumed from invalidated using exact receipt lineage");

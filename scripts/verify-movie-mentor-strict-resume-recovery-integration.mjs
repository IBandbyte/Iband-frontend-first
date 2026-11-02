import assert from "node:assert/strict";
import createCreatorMemory, { createDefaultMemoryState, createMemoryStorageAdapter } from "../src/components/studio/mentor/CreatorMemory.js";
import createMovieMentorStudioIdentityRuntime from "../src/components/studio/mentor/MovieMentorStudioIdentityRuntime.js";
import { requireVerifiedMemoryAuthority } from "../src/components/studio/mentor/VerifiedMemoryAuthority.js";

const projectId = "movie-project-strict-resume-recovery";
const recommendationId = "journey-recommendation:strict-resume-proof";
const fingerprint = "strict-resume-proof-fingerprint";
const clone = value => JSON.parse(JSON.stringify(value));
const locks = {
  requests: [],
  async request(name, options, callback) {
    assert.equal(options?.mode, "exclusive");
    this.requests.push(name);
    return callback({ name, mode: "exclusive" });
  },
};

function seed({ receiptFingerprint = fingerprint } = {}) {
  const state = createDefaultMemoryState();
  const journey = {
    projectId,
    currentStageId: "character-foundations",
    currentTaskId: "protagonist",
    progression: {
      schemaVersion: 1,
      revision: 1,
      lastCommittedOperation: {
        operationId: `journey-recommendation-acceptance:${recommendationId}`,
        authorityId: "authority-1",
        creatorActId: "creator-act-1",
        fromRevision: 0,
        toRevision: 1,
        recommendation: {
          recommendationId,
          fingerprint: receiptFingerprint,
          disposition: "consumed",
          issuedAgainstProgressionRevision: 0,
        },
      },
      committedOperations: [],
    },
  };
  journey.progression.committedOperations = [clone(journey.progression.lastCommittedOperation)];
  const reference = {
    domain: "iband.movie-mentor.journey-recommendation-reference",
    schema: 2,
    recommendationId,
    recommendationFingerprint: fingerprint,
    projectId,
    issuedAgainst: {
      progressionRevision: 0,
      currentStageId: "story-direction",
      currentTaskId: "premise",
      creatorAuthorityRevision: 9,
      turnRevision: 8,
    },
    target: { stageId: "character-foundations", taskId: "protagonist" },
    lifecycle: { current: true, terminalReason: null },
  };
  state.projects = [{
    id: projectId,
    creatorType: "video",
    metadata: { creatorMode: "ai-movie", creatorModeLabel: "AI Movie Making", projectJourney: journey },
  }];
  state.journey.activeProjectId = projectId;
  state.projectMemories = [{
    id: `memory:${recommendationId}`,
    projectId,
    metadata: { recommendationReference: reference },
  }];
  const storage = createMemoryStorageAdapter(state);
  const memory = createCreatorMemory({ storageAdapter: storage, requireSharedWriteAuthority: true });
  assert.equal(requireVerifiedMemoryAuthority(memory), memory, "Only branded strict Creator Memory may enter Studio.");
  const runtime = createMovieMentorStudioIdentityRuntime({
    memory,
    cryptoImpl: { randomUUID: () => "strict-resume-recovery-session" },
    settlementLockManager: locks,
  });
  return { memory, runtime, journey, storage };
}

for (const [receiptFingerprint, expectedStatus, expectedReason] of [
  [fingerprint, "repaired", "consumed"],
  ["forged-fingerprint", "proof-conflict-quarantined", "proof-conflict-quarantined"],
]) {
  const { runtime, memory, journey } = seed({ receiptFingerprint });
  const before = runtime.getResumeSnapshot();
  assert.equal(before.recommendationActionsBlocked, true, "Render must fail closed before recovery.");
  const previousLockCount = locks.requests.length;
  const transaction = await runtime.recoverResumeRecommendationsWithSharedAuthority();
  assert.equal(transaction.acquired, true, "Strict recovery must acquire exclusive shared authority.");
  assert.ok(locks.requests.length > previousLockCount, "Recovery must actually request the shared lock.");
  assert.equal(transaction.value.status, expectedStatus);
  assert.equal(transaction.value.recommendationActionsBlocked, false);
  const after = runtime.getResumeSnapshot();
  assert.deepEqual(after.currentRecommendationReferences, []);
  assert.deepEqual(after.projectJourney, journey, "Recovery cannot rewrite Journey progression.");
  const persisted = memory.readPersistedState();
  const persistedReference = persisted.projectMemories[0].metadata.recommendationReference;
  assert.equal(persistedReference.lifecycle.current, false);
  assert.equal(persistedReference.lifecycle.terminalReason, expectedReason);
  if (expectedStatus === "proof-conflict-quarantined") {
    assert.equal(transaction.value.recoveryAttempts, 2);
    assert.equal(persistedReference.lifecycle.recoveryConflict.proof.reason, "fingerprint-mismatch");
  }
}
console.log("Strict Creator Memory resume recovery: valid receipt and proof conflict PASS");

{
  // An independent context commits the valid terminal lifecycle immediately
  // BEFORE the exclusive recovery lock is granted. The recovery transaction
  // must hydrate that durable state rather than reuse its stale render snapshot.
  const { runtime, memory, journey, storage } = seed();
  const initial = runtime.getResumeSnapshot();
  assert.equal(initial.recommendationActionsBlocked, true);
  let externalRepairCount = 0;
  const raceLocks = {
    async request(name, options, callback) {
      assert.equal(name, "movie-mentor-creator-memory-recovery");
      assert.equal(options?.mode, "exclusive");
      const persisted = memory.readPersistedState();
      const reference = persisted.projectMemories[0].metadata.recommendationReference;
      assert.equal(reference.lifecycle.current, true);
      reference.lifecycle = {
        ...reference.lifecycle,
        current: false,
        terminalReason: "consumed",
        consumedByOperationId: `journey-recommendation-acceptance:${recommendationId}`,
        consumedByCreatorActId: "creator-act-1",
        consumedAtProgressionRevision: 1,
      };
      storage.setItem("iband.creator-memory", JSON.stringify(persisted));
      externalRepairCount += 1;
      return callback({ name, mode: "exclusive" });
    },
  };
  const transaction = await runtime.recoverResumeRecommendationsWithSharedAuthority({ locks: raceLocks });
  assert.equal(externalRepairCount, 1, "External repair must commit exactly once before lock acquisition.");
  assert.equal(transaction.acquired, true);
  assert.equal(transaction.value.status, "certified", "Fresh locked recovery must recognize preexisting terminal proof.");
  assert.equal(transaction.value.recommendationActionsBlocked, false);
  const snapshot = runtime.getResumeSnapshot();
  assert.deepEqual(snapshot.currentRecommendationReferences, []);
  assert.deepEqual(snapshot.projectJourney, journey);
  const persisted = memory.readPersistedState();
  assert.equal(persisted.projectMemories[0].metadata.recommendationReference.lifecycle.terminalReason, "consumed");
  assert.equal(persisted.projects[0].metadata.projectJourney.progression.revision, 1);
}
console.log("Strict Creator Memory recovery: pre-lock external convergence PASS");


import assert from "node:assert/strict";
import createJourneyDurableAuthorityStore from "../src/components/studio/mentor/JourneyDurableAuthorityStore.js";
import {
  inspectJourneyAuthorityRecoveryEnvelope,
  mintJourneyAuthorityRecoveryEnvelope,
  compareJourneyAuthorityRecoveryEnvelopes,
} from "../src/components/studio/mentor/JourneyAuthorityRecoveryEnvelope.js";

function clone(value) { return JSON.parse(JSON.stringify(value)); }
function storageAdapter() {
  const values = new Map();
  return {
    getItem(key) { return values.has(key) ? values.get(key) : null; },
    setItem(key, value) { values.set(key, String(value)); },
    removeItem(key) { values.delete(key); },
  };
}
function project(id = "movie-project-recovery-envelope") {
  return {
    id,
    identity: { domain: "iband.movie-mentor.project", schema: 1, issuance: "secure-web-crypto", legacy: false },
  };
}
function journey(revision = 0, stageId = "idea") {
  return {
    projectId: "movie-project-recovery-envelope",
    currentStageId: stageId,
    currentTaskId: stageId === "idea" ? "seed" : "premise",
    progression: { schemaVersion: 1, revision, lastCommittedOperation: null, committedOperations: [] },
  };
}

function establish(store, p) {
  store.bootstrapUnderLock({ project: p, nativeJourney: journey(0, "idea") });
  store.compareAndCommitUnderLock({
    project: p,
    expectedGeneration: 0,
    expectedProgressionRevision: 0,
    nextJourney: journey(1, "story"),
    mutateRecord(record) {
      record.recommendations = [{ recommendationId: "rec-1", lifecycle: "active", revision: 1 }];
      record.projection = {
        lastProjectedAuthorityGeneration: 1,
        projectedAt: "2026-08-27T20:00:00.000Z",
        creatorTruth: [{ key: "genre", value: "mystery", certainty: "confirmed" }],
      };
      return record;
    },
  });
  return {
    authority: store.read(p.id, { project: p }),
    lineage: store.readSovereigntyLineage(p.id, { project: p }),
  };
}

// Exact sovereign authority + established lineage can mint a self-verifying recovery envelope.
const storage = storageAdapter();
const store = createJourneyDurableAuthorityStore({ storage, browserRuntime: false });
const p = project();
const { authority, lineage } = establish(store, p);
const envelope = mintJourneyAuthorityRecoveryEnvelope({ project: p, authorityRecord: authority, lineageRecord: lineage });
const inspection = inspectJourneyAuthorityRecoveryEnvelope(envelope, { project: p, lineageRecord: lineage });
assert.equal(inspection.valid, true);
assert.equal(inspection.status, "eligible-evidence");
assert.equal(inspection.authorityGeneration, 1);
assert.equal(inspection.progressionRevision, 1);
assert.equal(envelope.authorityRecord.recommendations[0].recommendationId, "rec-1");
assert.equal(envelope.authorityRecord.projection.creatorTruth[0].value, "mystery");

// Creator Memory or another projection cannot manufacture recovery evidence.
assert.throws(
  () => mintJourneyAuthorityRecoveryEnvelope({
    project: p,
    authorityRecord: {
      projectJourney: journey(1, "story"),
      metadata: { recommendations: authority.recommendations, projection: authority.projection },
    },
    lineageRecord: lineage,
  }),
  (error) => error?.code === "JOURNEY_AUTHORITY_RECOVERY_ENVELOPE_AUTHORITY_INVALID"
);

// Omitting recommendation lifecycle or non-position creator-truth projection invalidates eligibility.
const noRecommendations = clone(authority);
delete noRecommendations.recommendations;
assert.throws(
  () => mintJourneyAuthorityRecoveryEnvelope({ project: p, authorityRecord: noRecommendations, lineageRecord: lineage }),
  (error) => error?.code === "JOURNEY_AUTHORITY_RECOVERY_ENVELOPE_LIFECYCLE_REQUIRED"
);
const noProjection = clone(authority);
delete noProjection.projection;
assert.throws(
  () => mintJourneyAuthorityRecoveryEnvelope({ project: p, authorityRecord: noProjection, lineageRecord: lineage }),
  (error) => error?.code === "JOURNEY_AUTHORITY_RECOVERY_ENVELOPE_PROJECTION_REQUIRED"
);

// Authority must be exactly caught up to the established lineage checkpoint before minting.
const staleAuthority = clone(authority);
staleAuthority.authority.generation = 0;
assert.throws(
  () => mintJourneyAuthorityRecoveryEnvelope({ project: p, authorityRecord: staleAuthority, lineageRecord: lineage }),
  (error) => error?.code === "JOURNEY_AUTHORITY_RECOVERY_ENVELOPE_AUTHORITY_INVALID" || error?.code === "JOURNEY_AUTHORITY_RECOVERY_ENVELOPE_NOT_CHECKPOINT_ELIGIBLE"
);
const aheadLineage = clone(lineage);
aheadLineage.highestKnownGeneration = 2;
assert.throws(
  () => mintJourneyAuthorityRecoveryEnvelope({ project: p, authorityRecord: authority, lineageRecord: aheadLineage }),
  (error) => error?.code === "JOURNEY_AUTHORITY_RECOVERY_ENVELOPE_NOT_CHECKPOINT_ELIGIBLE"
);

// Tampering with Journey, recommendation lifecycle, projection, or project identity breaks the envelope fingerprint/authority proof.
for (const mutate of [
  (candidate) => { candidate.authorityRecord.journey.currentStageId = "tampered-stage"; },
  (candidate) => { candidate.authorityRecord.recommendations[0].lifecycle = "retired"; },
  (candidate) => { candidate.authorityRecord.projection.creatorTruth[0].value = "comedy"; },
  (candidate) => { candidate.project.projectId = "zorg-project"; },
]) {
  const candidate = clone(envelope);
  mutate(candidate);
  assert.equal(inspectJourneyAuthorityRecoveryEnvelope(candidate, { project: p, lineageRecord: lineage }).valid, false);
}

// A different project's envelope is never eligible against this project's identity/lineage.
const pB = project("movie-project-recovery-envelope-B");
const storageB = storageAdapter();
const storeB = createJourneyDurableAuthorityStore({ storage: storageB, browserRuntime: false });
const journeyB = (revision = 0) => ({
  projectId: pB.id,
  currentStageId: "idea",
  currentTaskId: "seed",
  progression: { schemaVersion: 1, revision, lastCommittedOperation: null, committedOperations: [] },
});
storeB.bootstrapUnderLock({ project: pB, nativeJourney: journeyB(0) });
const authorityB = storeB.read(pB.id, { project: pB });
const lineageB = storeB.readSovereigntyLineage(pB.id, { project: pB });
const envelopeB = mintJourneyAuthorityRecoveryEnvelope({ project: pB, authorityRecord: authorityB, lineageRecord: lineageB });
assert.equal(inspectJourneyAuthorityRecoveryEnvelope(envelopeB, { project: p, lineageRecord: lineage }).valid, false);

// Replay law: an older checkpoint cannot replace a newer stored recovery checkpoint.
const birthStorage = storageAdapter();
const replayStore = createJourneyDurableAuthorityStore({ storage: birthStorage, browserRuntime: false });
const replayProject = project("movie-project-replay-law");
const replayJourney = (revision, stageId) => ({
  projectId: replayProject.id,
  currentStageId: stageId,
  currentTaskId: stageId,
  progression: { schemaVersion: 1, revision, lastCommittedOperation: null, committedOperations: [] },
});
replayStore.bootstrapUnderLock({ project: replayProject, nativeJourney: replayJourney(0, "n0") });
const oldAuthority = replayStore.read(replayProject.id, { project: replayProject });
const oldLineage = replayStore.readSovereigntyLineage(replayProject.id, { project: replayProject });
const oldEnvelope = mintJourneyAuthorityRecoveryEnvelope({ project: replayProject, authorityRecord: oldAuthority, lineageRecord: oldLineage });
replayStore.compareAndCommitUnderLock({ project: replayProject, expectedGeneration: 0, expectedProgressionRevision: 0, nextJourney: replayJourney(1, "n1") });
const newAuthority = replayStore.read(replayProject.id, { project: replayProject });
const newLineage = replayStore.readSovereigntyLineage(replayProject.id, { project: replayProject });
const newEnvelope = mintJourneyAuthorityRecoveryEnvelope({ project: replayProject, authorityRecord: newAuthority, lineageRecord: newLineage });
assert.equal(compareJourneyAuthorityRecoveryEnvelopes(oldEnvelope, newEnvelope, { project: replayProject }).status, "advance-eligible");
assert.equal(compareJourneyAuthorityRecoveryEnvelopes(newEnvelope, oldEnvelope, { project: replayProject }).status, "rollback-rejected");
assert.equal(compareJourneyAuthorityRecoveryEnvelopes(newEnvelope, clone(newEnvelope), { project: replayProject }).status, "idempotent");

// Same project identity born in a separate sovereignty universe has a different lineage and cannot merge by larger counters.
const splitStorage = storageAdapter();
const splitStore = createJourneyDurableAuthorityStore({ storage: splitStorage, browserRuntime: false });
splitStore.bootstrapUnderLock({ project: replayProject, nativeJourney: replayJourney(0, "split") });
const splitEnvelope = mintJourneyAuthorityRecoveryEnvelope({
  project: replayProject,
  authorityRecord: splitStore.read(replayProject.id, { project: replayProject }),
  lineageRecord: splitStore.readSovereigntyLineage(replayProject.id, { project: replayProject }),
});
assert.throws(
  () => compareJourneyAuthorityRecoveryEnvelopes(newEnvelope, splitEnvelope, { project: replayProject }),
  (error) => error?.code === "JOURNEY_AUTHORITY_RECOVERY_ENVELOPE_LINEAGE_CONFLICT"
);

console.log("Journey Authority recovery envelope torture passed.");
console.log("- only structurally validated sovereign authority exactly certified by established lineage can mint recovery evidence");
console.log("- the whole authority snapshot binds Journey, recommendation lifecycle, projection and project identity");
console.log("- Creator Memory-shaped projections cannot mint recovery evidence");
console.log("- tampering and cross-project/cross-lineage substitution fail closed");
console.log("- older recovery checkpoints are rollback-rejected and exact retries are idempotent");
console.log("- recovery envelopes remain evidence; this primitive does not restore or promote authority");

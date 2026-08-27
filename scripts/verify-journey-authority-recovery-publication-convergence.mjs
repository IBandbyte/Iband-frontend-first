import assert from "node:assert/strict";
import createJourneyDurableAuthorityStore from "../src/components/studio/mentor/JourneyDurableAuthorityStore.js";
import { mintJourneyAuthorityRecoveryEnvelope } from "../src/components/studio/mentor/JourneyAuthorityRecoveryEnvelope.js";
import createJourneyAuthorityRecoveryPublicationRuntime from "../src/components/studio/mentor/JourneyAuthorityRecoveryPublicationRuntime.js";

function clone(value) { return value == null ? value : JSON.parse(JSON.stringify(value)); }
function storageAdapter() {
  const map = new Map();
  return {
    getItem(key) { return map.has(key) ? map.get(key) : null; },
    setItem(key, value) { map.set(key, String(value)); },
    removeItem(key) { map.delete(key); },
  };
}
function project() {
  return {
    id: "recovery-publication-project",
    identity: { domain: "iband.movie-mentor.project", schema: 1, issuance: "secure-web-crypto", legacy: false },
  };
}
function journey(revision, label) {
  return {
    projectId: "recovery-publication-project",
    currentStageId: "story",
    currentTaskId: label,
    progression: { schemaVersion: 1, revision, lastCommittedOperation: null, committedOperations: [] },
    decisions: [],
  };
}
function remoteRecord(envelope, recoveryRevision = 1, recoveryGeneration = recoveryRevision) {
  return {
    projectId: envelope.project.projectId,
    lineageId: envelope.lineageId,
    recoveryRevision,
    recoveryGeneration,
    authorityGeneration: envelope.authorityGeneration,
    progressionRevision: envelope.progressionRevision,
    envelopeFingerprint: envelope.envelopeFingerprint,
    envelope: clone(envelope),
  };
}
function notFound() {
  const error = new Error("missing recovery checkpoint");
  error.code = "MOVIE_MENTOR_JOURNEY_RECOVERY_NOT_FOUND";
  return error;
}
function recoveryTransport(initial = null) {
  let remote = clone(initial);
  let unavailableRead = false;
  let unavailableWrite = false;
  let ackLoss = false;
  return {
    async readRecovery({ projectId }) {
      if (unavailableRead) throw new Error("backend offline");
      if (!remote || remote.projectId !== projectId) throw notFound();
      return clone(remote);
    },
    async publishRecovery({ projectId, expectedRecoveryRevision, envelope }) {
      if (unavailableWrite) throw new Error("backend offline");
      const currentRevision = remote?.recoveryRevision ?? 0;
      if (currentRevision !== expectedRecoveryRevision) {
        const error = new Error("recovery CAS conflict");
        error.code = "MOVIE_MENTOR_JOURNEY_RECOVERY_REVISION_CONFLICT";
        throw error;
      }
      remote = remoteRecord(envelope, currentRevision + 1, (remote?.recoveryGeneration ?? 0) + 1);
      if (ackLoss) {
        ackLoss = false;
        throw new Error("simulated ACK loss");
      }
      return clone(remote);
    },
    setRemote(value) { remote = clone(value); },
    getRemote() { return clone(remote); },
    setReadUnavailable(value) { unavailableRead = value; },
    setWriteUnavailable(value) { unavailableWrite = value; },
    loseNextAck() { ackLoss = true; },
  };
}

const canonicalProject = project();
const authorityStore = createJourneyDurableAuthorityStore({ storage: storageAdapter(), browserRuntime: false });

const boot = await authorityStore.bootstrap({ project: canonicalProject, nativeJourney: journey(0, "n0") });
const lineage0 = authorityStore.readSovereigntyLineage(canonicalProject.id, { project: canonicalProject });
const envelope0 = mintJourneyAuthorityRecoveryEnvelope({ project: canonicalProject, authorityRecord: boot.record, lineageRecord: lineage0 });

const one = await authorityStore.compareAndCommit({
  project: canonicalProject,
  expectedGeneration: 0,
  expectedProgressionRevision: 0,
  nextJourney: journey(1, "n1"),
});
const lineage1 = authorityStore.readSovereigntyLineage(canonicalProject.id, { project: canonicalProject });
const envelope1 = mintJourneyAuthorityRecoveryEnvelope({ project: canonicalProject, authorityRecord: one.record, lineageRecord: lineage1 });

const two = await authorityStore.compareAndCommit({
  project: canonicalProject,
  expectedGeneration: 1,
  expectedProgressionRevision: 1,
  nextJourney: journey(2, "n2"),
});
const lineage2 = authorityStore.readSovereigntyLineage(canonicalProject.id, { project: canonicalProject });
const envelope2 = mintJourneyAuthorityRecoveryEnvelope({ project: canonicalProject, authorityRecord: two.record, lineageRecord: lineage2 });

// First checkpoint publication.
{
  const transport = recoveryTransport();
  const runtime = createJourneyAuthorityRecoveryPublicationRuntime({ transport });
  const result = await runtime.publishCheckpoint({ project: canonicalProject, authorityRecord: one.record, lineageRecord: lineage1 });
  assert.equal(result.status, "published");
  assert.equal(result.recoveryDurability, "converged");
  assert.equal(result.creatorJourneyCommitted, true);
  assert.equal(transport.getRemote().authorityGeneration, 1);
}

// Exact retry is already converged and performs no write.
{
  const transport = recoveryTransport(remoteRecord(envelope1, 7, 7));
  let writes = 0;
  const original = transport.publishRecovery.bind(transport);
  transport.publishRecovery = async (args) => { writes += 1; return original(args); };
  const runtime = createJourneyAuthorityRecoveryPublicationRuntime({ transport });
  const result = await runtime.publishCheckpoint({ project: canonicalProject, authorityRecord: one.record, lineageRecord: lineage1 });
  assert.equal(result.status, "converged-exact");
  assert.equal(writes, 0);
}

// Backend older: current checkpoint advances directly to current authority.
{
  const transport = recoveryTransport(remoteRecord(envelope0, 3, 3));
  const runtime = createJourneyAuthorityRecoveryPublicationRuntime({ transport });
  const result = await runtime.publishCheckpoint({ project: canonicalProject, authorityRecord: two.record, lineageRecord: lineage2 });
  assert.equal(result.status, "published");
  assert.equal(transport.getRemote().authorityGeneration, 2);
  assert.equal(transport.getRemote().progressionRevision, 2);
  assert.equal(transport.getRemote().recoveryRevision, 4);
}

// Backend read outage produces explicit lag and never invalidates creator truth.
{
  const transport = recoveryTransport();
  transport.setReadUnavailable(true);
  const runtime = createJourneyAuthorityRecoveryPublicationRuntime({ transport });
  const result = await runtime.publishCheckpoint({ project: canonicalProject, authorityRecord: one.record, lineageRecord: lineage1 });
  assert.equal(result.status, "lagging-retryable");
  assert.equal(result.recoveryDurability, "lagging");
  assert.equal(result.creatorJourneyCommitted, true);
  assert.equal(result.retryable, true);
}

// Backend write outage leaves recovery lagging, but local Journey remains committed.
{
  const transport = recoveryTransport(remoteRecord(envelope0, 1, 1));
  transport.setWriteUnavailable(true);
  const runtime = createJourneyAuthorityRecoveryPublicationRuntime({ transport });
  const result = await runtime.publishCheckpoint({ project: canonicalProject, authorityRecord: one.record, lineageRecord: lineage1 });
  assert.equal(result.status, "lagging-retryable");
  assert.equal(result.creatorJourneyCommitted, true);
  assert.equal(transport.getRemote().authorityGeneration, 0);
}

// Lost backend acknowledgement is reconciled by rereading exact committed recovery reality.
{
  const transport = recoveryTransport(remoteRecord(envelope0, 1, 1));
  transport.loseNextAck();
  const runtime = createJourneyAuthorityRecoveryPublicationRuntime({ transport });
  const result = await runtime.publishCheckpoint({ project: canonicalProject, authorityRecord: one.record, lineageRecord: lineage1 });
  assert.equal(result.status, "converged-exact");
  assert.equal(result.reconciledAfterError, true);
  assert.equal(transport.getRemote().authorityGeneration, 1);
}

// G15 wins while delayed/stale G14 publisher loses CAS: stale publisher converges to newer reality.
{
  let remote = remoteRecord(envelope0, 1, 1);
  let publishEntered;
  const entered = new Promise((resolve) => { publishEntered = resolve; });
  let release;
  const blocked = new Promise((resolve) => { release = resolve; });
  const transport = {
    async readRecovery() { return clone(remote); },
    async publishRecovery({ expectedRecoveryRevision, envelope }) {
      publishEntered();
      await blocked;
      if (remote.recoveryRevision !== expectedRecoveryRevision) {
        const error = new Error("CAS lost to newer checkpoint");
        error.code = "MOVIE_MENTOR_JOURNEY_RECOVERY_REVISION_CONFLICT";
        throw error;
      }
      remote = remoteRecord(envelope, expectedRecoveryRevision + 1, 2);
      return clone(remote);
    },
  };
  const runtime = createJourneyAuthorityRecoveryPublicationRuntime({ transport });
  const stalePublisher = runtime.publishCheckpoint({ project: canonicalProject, authorityRecord: one.record, lineageRecord: lineage1 });
  await entered;
  remote = remoteRecord(envelope2, 2, 2);
  release();
  const result = await stalePublisher;
  assert.equal(result.status, "converged-newer");
  assert.equal(result.reconciledAfterError, true);
  assert.equal(remote.authorityGeneration, 2);
}

// Backend already newer same lineage: no write is needed.
{
  const transport = recoveryTransport(remoteRecord(envelope2, 9, 9));
  let writes = 0;
  const original = transport.publishRecovery.bind(transport);
  transport.publishRecovery = async (args) => { writes += 1; return original(args); };
  const runtime = createJourneyAuthorityRecoveryPublicationRuntime({ transport });
  const result = await runtime.publishCheckpoint({ project: canonicalProject, authorityRecord: one.record, lineageRecord: lineage1 });
  assert.equal(result.status, "converged-newer");
  assert.equal(writes, 0);
}

// Same coordinates with different fingerprint are split-brain, not "close enough".
{
  const conflicted = remoteRecord(envelope1, 4, 4);
  conflicted.envelopeFingerprint = "fnv1a32:zorg0000";
  const runtime = createJourneyAuthorityRecoveryPublicationRuntime({ transport: recoveryTransport(conflicted) });
  const result = await runtime.publishCheckpoint({ project: canonicalProject, authorityRecord: one.record, lineageRecord: lineage1 });
  assert.equal(result.status, "split-brain");
  assert.equal(result.retryable, false);
}

// Bigger counters from a foreign lineage are never accepted as newer truth.
{
  const foreign = remoteRecord(envelope2, 5, 5);
  foreign.lineageId = "journey-authority-lineage:zorg-foreign";
  foreign.authorityGeneration = 999;
  foreign.progressionRevision = 999;
  const runtime = createJourneyAuthorityRecoveryPublicationRuntime({ transport: recoveryTransport(foreign) });
  const result = await runtime.publishCheckpoint({ project: canonicalProject, authorityRecord: two.record, lineageRecord: lineage2 });
  assert.equal(result.status, "lineage-conflict");
  assert.equal(result.retryable, false);
}

// Offline local advances may checkpoint only the current certified envelope; intermediates are not invented.
{
  const transport = recoveryTransport(remoteRecord(envelope0, 10, 10));
  const runtime = createJourneyAuthorityRecoveryPublicationRuntime({ transport });
  const result = await runtime.publishCheckpoint({ project: canonicalProject, authorityRecord: two.record, lineageRecord: lineage2 });
  assert.equal(result.status, "published");
  assert.equal(transport.getRemote().authorityGeneration, 2);
  assert.equal(transport.getRemote().progressionRevision, 2);
  assert.equal(transport.getRemote().recoveryRevision, 11);
}

// Invalid local authority cannot be exported, but does not retroactively uncommit creator truth.
{
  const invalid = clone(two.record);
  invalid.journeyFingerprint = "fnv1a32:tampered";
  const runtime = createJourneyAuthorityRecoveryPublicationRuntime({ transport: recoveryTransport() });
  const result = await runtime.publishCheckpoint({ project: canonicalProject, authorityRecord: invalid, lineageRecord: lineage2 });
  assert.equal(result.status, "invalid-local-authority");
  assert.equal(result.creatorJourneyCommitted, true);
  assert.equal(result.retryable, false);
}

console.log("Journey Authority recovery publication convergence torture passed.");
console.log("- backend publication is post-commit disaster-recovery durability, never Journey sovereignty");
console.log("- backend outage produces explicit lag without invalidating creator truth");
console.log("- exact retry, ACK loss and stale-CAS races reconcile by rereading backend reality");
console.log("- newer same-lineage recovery reality satisfies an older delayed publisher without overwrite");
console.log("- offline multi-generation advances publish only current certified authority evidence");
console.log("- same-coordinate conflict and foreign lineage fail closed");

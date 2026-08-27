import assert from "node:assert/strict";
import createJourneyDurableAuthorityStore from "../src/components/studio/mentor/JourneyDurableAuthorityStore.js";
import createJourneyAuthoritySovereigntyLineage from "../src/components/studio/mentor/JourneyAuthoritySovereigntyLineage.js";

function clone(value) { return value == null ? value : JSON.parse(JSON.stringify(value)); }
function storageAdapter() {
  const values = new Map();
  return {
    getItem(key) { return values.has(key) ? values.get(key) : null; },
    setItem(key, value) { values.set(key, String(value)); },
    removeItem(key) { values.delete(key); },
  };
}
function project(id = "movie-project-destruction-detection") {
  return {
    id,
    identity: { domain: "iband.movie-mentor.project", schema: 1, issuance: "secure-web-crypto", legacy: false },
    metadata: {},
  };
}
function journey(revision = 0, taskId = "seed") {
  return {
    creatorJourney: "guide",
    currentStageId: "idea",
    currentTaskId: taskId,
    progression: { schemaVersion: 1, revision, lastCommittedOperation: null, committedOperations: [] },
  };
}

// First birth establishes lineage before sovereignty can later be mistaken for virgin state.
{
  const storage = storageAdapter();
  const store = createJourneyDurableAuthorityStore({ storage, browserRuntime: false });
  const p = project();
  const first = store.bootstrapUnderLock({ project: p, legacyJourney: journey(0) });
  assert.equal(first.status, "bootstrapped");
  const lineage = store.readSovereigntyLineage(p.id, { project: p });
  assert.equal(lineage.phase, "established");
  assert.equal(lineage.highestKnownGeneration, 0);
  assert.equal(lineage.highestKnownProgressionRevision, 0);
}

// Murdered authority cannot be silently re-born from stale Creator Memory.
{
  const storage = storageAdapter();
  const store = createJourneyDurableAuthorityStore({ storage, browserRuntime: false });
  const p = project();
  const staleLegacyJourney = journey(0, "stale-memory");
  store.bootstrapUnderLock({ project: p, legacyJourney: staleLegacyJourney });
  const committed = store.compareAndCommitUnderLock({
    project: p,
    expectedGeneration: 0,
    expectedProgressionRevision: 0,
    nextJourney: journey(1, "authority-n1"),
  });
  assert.equal(committed.authorityGeneration, 1);
  assert.equal(store.readSovereigntyLineage(p.id, { project: p }).highestKnownGeneration, 1);

  storage.removeItem(store.storageKey(p.id));

  assert.throws(
    () => store.read(p.id, { project: p }),
    (error) => error?.code === "JOURNEY_AUTHORITY_RECOVERY_REQUIRED" && error?.reason === "authority-missing-after-established-lineage"
  );
  assert.throws(
    () => store.bootstrapUnderLock({ project: p, legacyJourney: staleLegacyJourney }),
    (error) => error?.code === "JOURNEY_AUTHORITY_RECOVERY_REQUIRED"
  );
  const absence = store.classifySovereigntyAbsence({ project: p });
  assert.equal(absence.status, "authority-destroyed-or-missing");
  assert.equal(absence.bootstrapAllowed, false);
}

// Existing pre-5G valid authority is adopted under lock without changing sovereign reality.
{
  const storage = storageAdapter();
  const p = project("movie-project-pre-lineage-adoption");
  const firstStore = createJourneyDurableAuthorityStore({ storage, browserRuntime: false });
  firstStore.bootstrapUnderLock({ project: p, legacyJourney: journey(2, "pre-lineage") });
  const authorityRaw = storage.getItem(firstStore.storageKey(p.id));
  const lineageKey = createJourneyAuthoritySovereigntyLineage({ storage }).storageKey(p.id);
  storage.removeItem(lineageKey);
  assert.ok(authorityRaw && !storage.getItem(lineageKey));

  const migratedStore = createJourneyDurableAuthorityStore({ storage, browserRuntime: false });
  const before = migratedStore.read(p.id, { project: p });
  assert.equal(before.authority.generation, 0);
  assert.equal(before.journey.progression.revision, 2);
  assert.equal(migratedStore.readSovereigntyLineage(p.id, { project: p }), null);

  const adopted = migratedStore.bootstrapUnderLock({ project: p, legacyJourney: journey(999, "must-not-replace") });
  assert.equal(adopted.status, "already-bootstrapped");
  assert.equal(adopted.record.authority.generation, 0);
  assert.equal(adopted.record.journey.progression.revision, 2);
  const lineage = migratedStore.readSovereigntyLineage(p.id, { project: p });
  assert.equal(lineage.phase, "established");
  assert.equal(lineage.highestKnownGeneration, 0);
  assert.equal(lineage.highestKnownProgressionRevision, 2);
}

// Interrupted birth marker may resume only the same exact birth source.
{
  const storage = storageAdapter();
  const p = project("movie-project-interrupted-birth");
  const store = createJourneyDurableAuthorityStore({ storage, browserRuntime: false });
  const source = journey(3, "birth-source");
  const temporaryStore = createJourneyDurableAuthorityStore({ storage: storageAdapter(), browserRuntime: false });
  const built = temporaryStore.bootstrapUnderLock({ project: p, legacyJourney: source }).record;
  const lineage = createJourneyAuthoritySovereigntyLineage({ storage, randomUUID: () => "interrupted-birth" });
  lineage.beginBirthUnderLock({
    project: p,
    birthJourneyFingerprint: built.journeyFingerprint,
    birthProgressionRevision: 3,
  });
  assert.equal(store.classifySovereigntyAbsence({ project: p }).status, "interrupted-birth");
  const resumed = store.bootstrapUnderLock({ project: p, legacyJourney: source });
  assert.equal(resumed.status, "bootstrapped");
  assert.equal(store.readSovereigntyLineage(p.id, { project: p }).phase, "established");
}

// Rollback below the established generation/revision floor fails even when the authority blob is structurally valid.
{
  const storage = storageAdapter();
  const store = createJourneyDurableAuthorityStore({ storage, browserRuntime: false });
  const p = project("movie-project-rollback-floor");
  const birth = store.bootstrapUnderLock({ project: p, legacyJourney: journey(0, "n0") });
  const oldRaw = storage.getItem(store.storageKey(p.id));
  store.compareAndCommitUnderLock({
    project: p,
    expectedGeneration: 0,
    expectedProgressionRevision: 0,
    nextJourney: journey(1, "n1"),
  });
  assert.equal(store.readSovereigntyLineage(p.id, { project: p }).highestKnownGeneration, 1);
  storage.setItem(store.storageKey(p.id), oldRaw);
  assert.throws(
    () => store.read(p.id, { project: p }),
    (error) => error?.code === "JOURNEY_AUTHORITY_ROLLBACK_DETECTED" && error?.highestKnownGeneration === 1
  );
  assert.equal(birth.record.journey.progression.revision, 0);
}

// Lost lineage acknowledgement is reconciled from durable bytes, just like authority ACK loss.
{
  const base = storageAdapter();
  let throwAfterLineageWrite = true;
  const p = project("movie-project-lineage-ack-loss");
  const lineagePrefix = "iband:movie-mentor:journey-authority-lineage:";
  const storage = {
    getItem: base.getItem,
    removeItem: base.removeItem,
    setItem(key, value) {
      base.setItem(key, value);
      if (throwAfterLineageWrite && key.startsWith(lineagePrefix)) {
        throwAfterLineageWrite = false;
        throw new Error("simulated lineage acknowledgement loss");
      }
    },
  };
  const store = createJourneyDurableAuthorityStore({ storage, browserRuntime: false });
  const result = store.bootstrapUnderLock({ project: p, legacyJourney: journey(4, "ack-loss-birth") });
  assert.equal(result.status, "bootstrapped");
  assert.equal(result.record.journey.progression.revision, 4);
  assert.equal(store.readSovereigntyLineage(p.id, { project: p }).phase, "established");
  assert.equal(store.classifySovereigntyAbsence({ project: p }).status, "authority-destroyed-or-missing");
}

console.log("Journey Authority destruction detection torture passed.");
console.log("- first sovereignty birth establishes a durable lineage marker");
console.log("- deleting authority while lineage survives cannot resurrect stale Creator Memory");
console.log("- valid pre-5G authority is adopted under lock without changing sovereign truth");
console.log("- interrupted first birth resumes only the same birth source");
console.log("- structurally valid rollback below lineage floors is rejected");
console.log("- lost lineage acknowledgement is reconciled from durable bytes");

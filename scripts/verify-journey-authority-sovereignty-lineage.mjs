import assert from "node:assert/strict";
import createJourneyAuthoritySovereigntyLineage from "../src/components/studio/mentor/JourneyAuthoritySovereigntyLineage.js";

function storageAdapter() {
  const values = new Map();
  return {
    getItem(key) { return values.has(key) ? values.get(key) : null; },
    setItem(key, value) { values.set(key, String(value)); },
    removeItem(key) { values.delete(key); },
  };
}

function project(id = "movie-project-lineage") {
  return {
    id,
    identity: {
      domain: "iband.movie-mentor.project",
      schema: 1,
      issuance: "secure-web-crypto",
      legacy: false,
    },
  };
}

function authorityRecord({ generation = 0, revision = 0, journeyFingerprint = "journey-fp-0" } = {}) {
  return {
    authority: { generation },
    journey: { progression: { revision } },
    journeyFingerprint,
  };
}

// Virgin project may begin first sovereignty birth.
{
  const storage = storageAdapter();
  const lineage = createJourneyAuthoritySovereigntyLineage({ storage, randomUUID: () => "lineage-virgin" });
  const p = project();
  assert.deepEqual(lineage.classifyAbsence({ project: p }), { status: "virgin", bootstrapAllowed: true, lineage: null });
  const birth = lineage.beginBirthUnderLock({ project: p, birthJourneyFingerprint: "birth-fp", birthProgressionRevision: 0 });
  assert.equal(birth.status, "birth-started");
  assert.equal(birth.record.phase, "establishing");
  assert.equal(birth.record.lineageId, "journey-authority-lineage:lineage-virgin");
}

// Interrupted first birth may resume only from the exact original source.
{
  const storage = storageAdapter();
  const lineage = createJourneyAuthoritySovereigntyLineage({ storage, randomUUID: () => "lineage-resume" });
  const p = project();
  lineage.beginBirthUnderLock({ project: p, birthJourneyFingerprint: "birth-fp", birthProgressionRevision: 3 });
  const classification = lineage.classifyAbsence({ project: p });
  assert.equal(classification.status, "interrupted-birth");
  assert.equal(classification.bootstrapAllowed, true);
  const resumed = lineage.beginBirthUnderLock({ project: p, birthJourneyFingerprint: "birth-fp", birthProgressionRevision: 3 });
  assert.equal(resumed.status, "birth-resumed");
  assert.throws(
    () => lineage.beginBirthUnderLock({ project: p, birthJourneyFingerprint: "different-fp", birthProgressionRevision: 3 }),
    (error) => error?.code === "JOURNEY_AUTHORITY_RECOVERY_REQUIRED" && error?.reason === "interrupted-birth-source-mismatch"
  );
}

// Establishing lineage becomes established only by observing the matching validated authority.
{
  const storage = storageAdapter();
  const lineage = createJourneyAuthoritySovereigntyLineage({ storage, randomUUID: () => "lineage-finalize" });
  const p = project();
  lineage.beginBirthUnderLock({ project: p, birthJourneyFingerprint: "authority-fp", birthProgressionRevision: 0 });
  const observed = lineage.observeAuthorityUnderLock({
    project: p,
    authorityRecord: authorityRecord({ generation: 0, revision: 0, journeyFingerprint: "authority-fp" }),
  });
  assert.equal(observed.status, "birth-established");
  assert.equal(observed.record.phase, "established");
  assert.equal(observed.record.highestKnownGeneration, 0);
  assert.equal(observed.record.highestKnownProgressionRevision, 0);
  const murdered = lineage.classifyAbsence({ project: p });
  assert.equal(murdered.status, "authority-destroyed-or-missing");
  assert.equal(murdered.bootstrapAllowed, false);
  assert.throws(
    () => lineage.beginBirthUnderLock({ project: p, birthJourneyFingerprint: "authority-fp", birthProgressionRevision: 0 }),
    (error) => error?.code === "JOURNEY_AUTHORITY_RECOVERY_REQUIRED"
  );
}

// Pre-lineage valid authority needs explicit adoption, never silent adoption.
{
  const storage = storageAdapter();
  const lineage = createJourneyAuthoritySovereigntyLineage({ storage, randomUUID: () => "lineage-adopt" });
  const p = project();
  const authority = authorityRecord({ generation: 7, revision: 4, journeyFingerprint: "legacy-sovereign-fp" });
  assert.throws(
    () => lineage.observeAuthorityUnderLock({ project: p, authorityRecord: authority }),
    (error) => error?.code === "JOURNEY_AUTHORITY_LINEAGE_ADOPTION_REQUIRED"
  );
  const adopted = lineage.observeAuthorityUnderLock({ project: p, authorityRecord: authority, allowAdoption: true });
  assert.equal(adopted.status, "authority-adopted");
  assert.equal(adopted.record.highestKnownGeneration, 7);
  assert.equal(adopted.record.highestKnownProgressionRevision, 4);
}

// Anti-rollback floors reject generation or Journey revision retreat.
{
  const storage = storageAdapter();
  const lineage = createJourneyAuthoritySovereigntyLineage({ storage, randomUUID: () => "lineage-floor" });
  const p = project();
  lineage.observeAuthorityUnderLock({
    project: p,
    authorityRecord: authorityRecord({ generation: 9, revision: 6, journeyFingerprint: "fp-g9-n6" }),
    allowAdoption: true,
  });
  assert.throws(
    () => lineage.observeAuthorityUnderLock({ project: p, authorityRecord: authorityRecord({ generation: 8, revision: 6, journeyFingerprint: "fp-g8-n6" }) }),
    (error) => error?.code === "JOURNEY_AUTHORITY_ROLLBACK_DETECTED" && error?.highestKnownGeneration === 9
  );
  assert.throws(
    () => lineage.observeAuthorityUnderLock({ project: p, authorityRecord: authorityRecord({ generation: 10, revision: 5, journeyFingerprint: "fp-g10-n5" }) }),
    (error) => error?.code === "JOURNEY_AUTHORITY_ROLLBACK_DETECTED" && error?.highestKnownProgressionRevision === 6
  );
}

// Authority ahead of the lineage safely advances the floor after an interrupted floor update.
{
  const storage = storageAdapter();
  const lineage = createJourneyAuthoritySovereigntyLineage({ storage, randomUUID: () => "lineage-converge" });
  const p = project();
  lineage.observeAuthorityUnderLock({
    project: p,
    authorityRecord: authorityRecord({ generation: 3, revision: 2, journeyFingerprint: "fp-g3-n2" }),
    allowAdoption: true,
  });
  const advanced = lineage.observeAuthorityUnderLock({
    project: p,
    authorityRecord: authorityRecord({ generation: 4, revision: 3, journeyFingerprint: "fp-g4-n3" }),
  });
  assert.equal(advanced.status, "lineage-advanced");
  assert.equal(advanced.record.highestKnownGeneration, 4);
  assert.equal(advanced.record.highestKnownProgressionRevision, 3);
  assert.equal(advanced.record.lastAuthorityJourneyFingerprint, "fp-g4-n3");
  const repeated = lineage.observeAuthorityUnderLock({
    project: p,
    authorityRecord: authorityRecord({ generation: 4, revision: 3, journeyFingerprint: "fp-g4-n3" }),
  });
  assert.equal(repeated.status, "lineage-current");
}

console.log("Journey Authority sovereignty lineage torture passed.");
console.log("- virgin first birth is distinguishable from destroyed authority");
console.log("- interrupted first birth resumes only from the exact original source")
console.log("- established sovereignty forbids silent legacy re-bootstrap after authority loss")
console.log("- pre-lineage authority requires explicit adoption")
console.log("- generation and Journey-revision rollback floors fail closed")
console.log("- valid authority ahead of lineage safely advances the floor after interrupted observation")

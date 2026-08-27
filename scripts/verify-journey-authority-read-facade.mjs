import assert from "node:assert/strict";
import createJourneyDurableAuthorityStore, { authorityStorageKey } from "../src/components/studio/mentor/JourneyDurableAuthorityStore.js";
import createJourneyAuthorityReadFacade from "../src/components/studio/mentor/JourneyAuthorityReadFacade.js";

function storageAdapter() {
  const map = new Map();
  return {
    getItem(key) { return map.has(key) ? map.get(key) : null; },
    setItem(key, value) { map.set(key, String(value)); },
    removeItem(key) { map.delete(key); },
  };
}

function journey(revision, taskId) {
  const receipts = [];
  for (let index = 1; index <= revision; index += 1) {
    receipts.push({ operationId: `op-${index}`, authorityId: `authority-${index}`, fromRevision: index - 1, toRevision: index });
  }
  return {
    currentStageId: "idea",
    currentTaskId: taskId,
    progression: { schemaVersion: 1, revision, lastCommittedOperation: receipts.at(-1) || null, committedOperations: receipts },
  };
}

const project = {
  id: "movie-project-read-facade-001",
  identity: { domain: "iband.movie-mentor.project", schema: 1, issuance: "secure-web-crypto", legacy: false },
};
const storage = storageAdapter();
const store = createJourneyDurableAuthorityStore({ storage, browserRuntime: false });
const facade = createJourneyAuthorityReadFacade({ authorityStore: store });

// Before authority birth, projection may be shown but can never claim mechanical authority.
const legacy = journey(2, "identify-known-context");
let result = facade.readPreferred({ project, projectedJourney: legacy });
assert.equal(result.status, "legacy-unbootstrapped");
assert.equal(result.mechanicalAuthority, false);
assert.equal(result.bootstrapRequiredBeforeMechanicalWrite, true);
assert.equal(result.progressionRevision, 2);

// Once authority exists, it wins even when Creator Memory projection is stale.
await store.bootstrap({ project, legacyJourney: legacy });
let authority = store.read(project.id, { project });
await store.compareAndCommit({
  project,
  expectedGeneration: authority.authority.generation,
  expectedProgressionRevision: 2,
  nextJourney: journey(3, "identify-open-threads"),
});
result = facade.readPreferred({ project, projectedJourney: legacy });
assert.equal(result.status, "authority");
assert.equal(result.mechanicalAuthority, true);
assert.equal(result.progressionRevision, 3);
assert.equal(result.projectJourney.currentTaskId, "identify-open-threads");
assert.equal(result.projectionStatus, "projection-stale");

// Projection ahead remains untrusted; authority still wins.
result = facade.readPreferred({ project, projectedJourney: journey(4, "story-foundation") });
assert.equal(result.status, "authority");
assert.equal(result.progressionRevision, 3);
assert.equal(result.projectionStatus, "projection-ahead-untrusted");

// Malformed authority must never downgrade itself by falling back to projection.
storage.setItem(authorityStorageKey(project.id), "{not-json");
assert.throws(
  () => facade.readPreferred({ project, projectedJourney: journey(99, "zorg") }),
  (error) => error?.code === "JOURNEY_AUTHORITY_RECOVERY_REQUIRED"
);

console.log("Journey authority read facade verification passed.");
console.log("- legacy projection is presentation-only before bootstrap");
console.log("- authority wins over stale or ahead projections");
console.log("- malformed authority fails closed and never falls back to projection");

import assert from "node:assert/strict";
import createJourneyDurableAuthorityStore, {
  authorityStorageKey,
} from "../src/components/studio/mentor/JourneyDurableAuthorityStore.js";

function clone(value) { return JSON.parse(JSON.stringify(value)); }

function project(id = "movie-project-authority") {
  return {
    id,
    creatorType: "video",
    identity: {
      domain: "iband.movie-mentor.project",
      schema: 1,
      issuance: "secure-web-crypto",
      legacy: false,
    },
  };
}

function journey(projectId, revision = 0, stageId = "idea") {
  return {
    projectId,
    currentStageId: stageId,
    currentTaskId: stageId === "idea" ? "seed" : "premise",
    status: "creating",
    stages: [
      { id: "idea", tasks: [{ id: "seed", status: stageId === "idea" ? "in-progress" : "completed-for-now" }] },
      { id: "story", tasks: [{ id: "premise", status: stageId === "story" ? "in-progress" : "not-started" }] },
    ],
    progression: {
      schemaVersion: 1,
      revision,
      lastCommittedOperation: null,
      committedOperations: [],
    },
  };
}

function createSharedStorage() {
  const values = new Map();
  return {
    getItem(key) { return values.has(key) ? values.get(key) : null; },
    setItem(key, value) { values.set(key, String(value)); },
    removeItem(key) { values.delete(key); },
    dump() { return new Map(values); },
  };
}

function createFakeWebLocks() {
  const tails = new Map();
  return {
    async request(name, _options, callback) {
      const previous = tails.get(name) || Promise.resolve();
      let release;
      const current = new Promise((resolve) => { release = resolve; });
      tails.set(name, previous.catch(() => undefined).then(() => current));
      await previous.catch(() => undefined);
      try { return await callback({ name }); }
      finally { release(); }
    },
  };
}

const locksApi = createFakeWebLocks();
const sharedStorage = createSharedStorage();
const p = project();
const legacy = journey(p.id, 7, "story");
const tabA = createJourneyDurableAuthorityStore({ storage: sharedStorage, locksApi, browserRuntime: true });
const tabB = createJourneyDurableAuthorityStore({ storage: sharedStorage, locksApi, browserRuntime: true });

// Simultaneous legacy bootstrap: exactly one birth, second caller adopts authority.
const bootstrapResults = await Promise.all([
  tabA.bootstrap({ project: p, legacyJourney: legacy }),
  tabB.bootstrap({ project: p, legacyJourney: legacy }),
]);
assert.equal(bootstrapResults.filter((result) => result.status === "bootstrapped").length, 1);
assert.equal(bootstrapResults.filter((result) => result.status === "already-bootstrapped").length, 1);
const bootstrapped = tabA.read(p.id, { project: p });
assert.equal(bootstrapped.bootstrap.status, "bootstrapped-from-legacy");
assert.equal(bootstrapped.bootstrap.sourceJourneyRevision, 7);
assert.equal(bootstrapped.authority.generation, 0);
assert.deepEqual(bootstrapped.journey, legacy, "Bootstrap must preserve exact Journey semantic reality.");

// Split-brain projection law.
assert.equal(tabA.compareProjection({ project: p, projectedJourney: legacy }).status, "in-sync");
const sameRevisionDifferentJourney = journey(p.id, 7, "idea");
assert.equal(tabA.compareProjection({ project: p, projectedJourney: sameRevisionDifferentJourney }).status, "split-brain-same-revision");
const behindProjection = journey(p.id, 6, "idea");
assert.equal(tabA.compareProjection({ project: p, projectedJourney: behindProjection }).status, "projection-stale");
const aheadProjection = journey(p.id, 8, "story");
assert.equal(tabA.compareProjection({ project: p, projectedJourney: aheadProjection }).status, "projection-ahead-untrusted");

// Generation CAS: one writer advances G0 -> G1; stale G0 writer is rejected.
const next = journey(p.id, 8, "story");
const commit = await tabA.compareAndCommit({
  project: p,
  expectedGeneration: 0,
  expectedProgressionRevision: 7,
  nextJourney: next,
});
assert.equal(commit.status, "committed");
assert.equal(commit.authorityGeneration, 1);
assert.equal(commit.progressionRevision, 8);
await assert.rejects(
  tabB.compareAndCommit({
    project: p,
    expectedGeneration: 0,
    expectedProgressionRevision: 7,
    nextJourney: journey(p.id, 8, "idea"),
  }),
  (error) => error?.code === "JOURNEY_AUTHORITY_GENERATION_STALE"
);
assert.equal(tabB.read(p.id, { project: p }).journey.currentStageId, "story");

// Project isolation: project B's authority lives under a different physical key.
const pB = project("movie-project-authority-B");
const bJourney = journey(pB.id, 2, "idea");
await tabA.bootstrap({ project: pB, legacyJourney: bJourney });
const aBytesBeforeBCommit = sharedStorage.getItem(authorityStorageKey(p.id));
await tabA.compareAndCommit({
  project: pB,
  expectedGeneration: 0,
  expectedProgressionRevision: 2,
  nextJourney: journey(pB.id, 3, "story"),
});
assert.equal(sharedStorage.getItem(authorityStorageKey(p.id)), aBytesBeforeBCommit, "Project B commit must not rewrite Project A authority bytes.");

// Non-Journey writer clobber attack: arbitrary Creator Memory blob write cannot touch authority key.
const authorityBytesBeforeMemoryWrite = sharedStorage.getItem(authorityStorageKey(p.id));
sharedStorage.setItem("iband:creator-memory", JSON.stringify({
  projects: [{ id: p.id, metadata: { projectJourney: journey(p.id, 0, "idea") } }],
  conversations: [{ id: "zorg-conversation", text: "I was only saving a conversation." }],
}));
assert.equal(sharedStorage.getItem(authorityStorageKey(p.id)), authorityBytesBeforeMemoryWrite, "Creator Memory writes must be physically incapable of overwriting Journey authority.");
assert.equal(tabA.read(p.id, { project: p }).journey.progression.revision, 8);

// Identity mismatch must fail closed.
const impostor = {
  ...p,
  identity: { ...p.identity, issuance: "legacy-preserved", legacy: true },
};
assert.throws(
  () => tabA.read(p.id, { project: impostor }),
  (error) => error?.code === "JOURNEY_AUTHORITY_IDENTITY_CONFLICT"
);

// Malformed authority must never fall back to legacy projection.
const malformedProject = project("movie-project-malformed-authority");
sharedStorage.setItem(authorityStorageKey(malformedProject.id), "{not-json");
assert.throws(
  () => tabA.read(malformedProject.id, { project: malformedProject }),
  (error) => error?.code === "JOURNEY_AUTHORITY_RECOVERY_REQUIRED"
);
await assert.rejects(
  tabA.bootstrap({ project: malformedProject, legacyJourney: journey(malformedProject.id, 4, "story") }),
  (error) => error?.code === "JOURNEY_AUTHORITY_RECOVERY_REQUIRED"
);

// Malformed legacy bootstrap source cannot establish authority.
const badLegacyProject = project("movie-project-bad-legacy");
await assert.rejects(
  tabA.bootstrap({ project: badLegacyProject, legacyJourney: { progression: { revision: "zorg" } } }),
  (error) => error?.code === "JOURNEY_AUTHORITY_BOOTSTRAP_SOURCE_INVALID"
);
assert.equal(sharedStorage.getItem(authorityStorageKey(badLegacyProject.id)), null);

// Legacy identity is preserved rather than rewritten.
const legacyProject = {
  id: "project-1699999999999-abcd1234",
  identity: {
    domain: "iband.movie-mentor.project",
    schema: 1,
    issuance: "legacy-preserved",
    legacy: true,
  },
};
const legacyIdentityResult = await tabA.bootstrap({
  project: legacyProject,
  legacyJourney: journey(legacyProject.id, 1, "idea"),
});
assert.equal(legacyIdentityResult.record.project.identityIssuance, "legacy-preserved");
assert.equal(legacyIdentityResult.record.project.legacy, true);

// Lost ACK on authority bootstrap write: lineage writes succeed; authority storage commits then throws; authority reread proves success.
const ackStorageBase = createSharedStorage();
const ackProject = project("movie-project-ack-loss");
let throwAfterAuthorityWrite = true;
const ackStorage = {
  getItem: ackStorageBase.getItem,
  removeItem: ackStorageBase.removeItem,
  setItem(key, value) {
    ackStorageBase.setItem(key, value);
    if (throwAfterAuthorityWrite && key === authorityStorageKey(ackProject.id)) {
      throwAfterAuthorityWrite = false;
      throw new Error("simulated authority acknowledgement loss");
    }
  },
};
const ackStore = createJourneyDurableAuthorityStore({ storage: ackStorage, locksApi, browserRuntime: true });
const ackResult = await ackStore.bootstrap({ project: ackProject, legacyJourney: journey(ackProject.id, 3, "story") });
assert.equal(ackResult.status, "bootstrapped-after-ack-loss");
assert.equal(ackStore.read(ackProject.id, { project: ackProject }).journey.progression.revision, 3);
const ackRetry = await ackStore.bootstrap({ project: ackProject, legacyJourney: journey(ackProject.id, 3, "story") });
assert.equal(ackRetry.status, "already-bootstrapped");
assert.equal(ackRetry.authorityGeneration, 0);

console.log("Journey durable authority store isolation verification passed.");
console.log("- simultaneous bootstrap converges on one authority birth");
console.log("- legacy bootstrap preserves exact Journey reality and identity");
console.log("- generation CAS rejects stale authority writers");
console.log("- split-brain projections never outrank authority");
console.log("- malformed authority fails closed and never falls back to legacy");
console.log("- project authority records are physically isolated by key");
console.log("- unrelated Creator Memory writes cannot overwrite Journey authority");
console.log("- lost bootstrap acknowledgement reconciles committed authority reality");

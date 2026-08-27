import assert from "node:assert/strict";
import { createJourneyDurableAuthorityStore } from "../src/components/studio/mentor/JourneyDurableAuthorityStore.js";
import { createJourneyProgressionAuthorityAdapter } from "../src/components/studio/mentor/JourneyProgressionAuthorityAdapter.js";

function createStorage() {
  const values = new Map();
  return {
    getItem(key) { return values.has(key) ? values.get(key) : null; },
    setItem(key, value) { values.set(key, String(value)); },
    removeItem(key) { values.delete(key); },
  };
}

function journey(revision, stageId = "idea") {
  return {
    currentStageId: stageId,
    currentTaskId: null,
    stages: [{ id: "idea", tasks: [] }, { id: "story-direction", tasks: [] }],
    progression: {
      schemaVersion: 1,
      revision,
      lastCommittedOperation: revision ? { operationId: `op-${revision}`, authorityId: `auth-${revision}`, fromRevision: revision - 1, toRevision: revision } : null,
      committedOperations: revision ? [{ operationId: `op-${revision}`, authorityId: `auth-${revision}`, fromRevision: revision - 1, toRevision: revision }] : [],
    },
  };
}

const projectId = "movie-project-authority-adapter";
const projectIdentity = {
  domain: "iband.movie-mentor.project",
  schema: 1,
  issuance: "secure-web-crypto",
  legacy: false,
};
let projected = journey(4, "idea");
const memory = {
  getPersistedProject(id) {
    if (id !== projectId) return null;
    return { id: projectId, identity: projectIdentity, metadata: { projectJourney: structuredClone(projected) } };
  },
  getProject(id) { return this.getPersistedProject(id); },
};

const storage = createStorage();
const authorityStore = createJourneyDurableAuthorityStore({ storage, browserRuntime: false, locksApi: null });
const adapter = createJourneyProgressionAuthorityAdapter({ identityRuntime: { memory }, authorityStore });
const lockProof = { mode: "test-existing-project-lock", lockName: `iband:movie-mentor:journey-progression:${projectId}`, crossTabSerialized: true };

const first = adapter.resolveUnderLock({ projectId, serialization: lockProof });
assert.equal(first.bootstrapStatus, "bootstrapped");
assert.equal(first.progressionRevision, 4);
assert.equal(first.projectionStatus, "in-sync");
assert.equal(first.authorityGeneration, 0);

// Creator Memory projection falls behind. Authority must continue to win.
projected = journey(3, "idea");
const staleProjection = adapter.resolveUnderLock({ projectId, serialization: lockProof });
assert.equal(staleProjection.bootstrapStatus, "authority-present");
assert.equal(staleProjection.progressionRevision, 4);
assert.equal(staleProjection.projectJourney.progression.revision, 4);
assert.equal(staleProjection.projectionStatus, "projection-stale");

// Projection claims to be ahead. It must never promote itself into authority.
projected = journey(5, "story-direction");
const aheadProjection = adapter.resolveUnderLock({ projectId, serialization: lockProof });
assert.equal(aheadProjection.projectJourney.progression.revision, 4);
assert.equal(aheadProjection.projectionStatus, "projection-ahead-untrusted");

// Same revision, different payload is explicit split brain; authority still wins.
projected = journey(4, "story-direction");
const splitBrain = adapter.resolveUnderLock({ projectId, serialization: lockProof });
assert.equal(splitBrain.projectJourney.currentStageId, "idea");
assert.equal(splitBrain.projectionStatus, "split-brain-same-revision");

// An existing authority must never be bootstrapped again from a later projection.
assert.equal(authorityStore.read(projectId, { project: memory.getPersistedProject(projectId) }).bootstrap.sourceJourneyRevision, 4);

console.log("Journey progression authority adapter verification passed.");
console.log("- legacy Journey bootstraps authority exactly once under the existing project lock");
console.log("- stale Creator Memory projection cannot regress authority");
console.log("- projection ahead of authority cannot promote itself");
console.log("- same-revision divergent projection is classified split brain");
console.log("- progression can consume authority truth without nested Web Locks");

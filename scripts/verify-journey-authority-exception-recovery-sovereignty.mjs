import assert from "node:assert/strict";
import createCreatorMemory from "../src/components/studio/mentor/CreatorMemory.js";
import createJourneyDurableAuthorityStore from "../src/components/studio/mentor/JourneyDurableAuthorityStore.js";
import createJourneyAuthorityReadFacade from "../src/components/studio/mentor/JourneyAuthorityReadFacade.js";

function clone(value) { return value == null ? value : JSON.parse(JSON.stringify(value)); }
function storageAdapter() {
  const map = new Map();
  return {
    getItem(key) { return map.has(key) ? map.get(key) : null; },
    setItem(key, value) { map.set(key, String(value)); },
    removeItem(key) { map.delete(key); },
  };
}
function legacyJourney(projectId) {
  return {
    projectId,
    currentStageId: "idea",
    currentTaskId: "seed",
    status: "creating",
    stages: [
      { id: "idea", tasks: [{ id: "seed", status: "in-progress" }] },
      { id: "story", tasks: [{ id: "premise", status: "not-started" }] },
    ],
    progression: { schemaVersion: 1, revision: 0, lastCommittedOperation: null, committedOperations: [] },
  };
}

const projectId = "movie-project-exception-recovery-sovereignty";
const memoryStorage = storageAdapter();
const authorityStorage = storageAdapter();
const authorityStore = createJourneyDurableAuthorityStore({ storage: authorityStorage, browserRuntime: false });
const authorityReadFacade = createJourneyAuthorityReadFacade({ authorityStore });
const memory = createCreatorMemory({
  storageAdapter: memoryStorage,
  storageKey: "creator-memory-exception-recovery",
  journeyAuthorityReadFacade: authorityReadFacade,
  projectIdentityCrypto: { randomUUID: () => "exception-recovery-project-uuid" },
});

const projectionN = legacyJourney(projectId);
const project = memory.saveProject({
  title: "Exception Recovery Movie",
  creatorType: "video",
  status: "creating",
  metadata: {
    creatorMode: "ai-movie",
    creatorModeLabel: "AI Movie Making",
    projectJourney: clone(projectionN),
  },
});
assert.ok(project?.id);
const actualProjectId = project.id;
const rawProject = memory.getPersistedProject(actualProjectId);
assert.equal(rawProject.metadata.projectJourney.progression.revision, 0);

const bootstrapped = await authorityStore.bootstrap({
  project: rawProject,
  legacyJourney: rawProject.metadata.projectJourney,
});
assert.equal(bootstrapped.record.journey.progression.revision, 0);

const authorityN1 = clone(bootstrapped.record.journey);
authorityN1.currentStageId = "story";
authorityN1.currentTaskId = "premise";
authorityN1.progression.revision = 1;
const committed = await authorityStore.compareAndCommit({
  project: rawProject,
  expectedGeneration: 0,
  expectedProgressionRevision: 0,
  nextJourney: authorityN1,
  nextRecommendations: [],
  transition: {
    operationId: "operation-exception-recovery-authority",
    creatorActId: "creator-act-exception-recovery-authority",
    kind: "progression",
  },
});
assert.equal(committed.record.journey.progression.revision, 1);
assert.equal(committed.record.authority.generation, 1);

// The physical Creator Memory projection deliberately remains N.
const persistedProjection = memory.getPersistedProject(actualProjectId);
assert.equal(persistedProjection.metadata.projectJourney.progression.revision, 0);
assert.equal(persistedProjection.metadata.projectJourney.currentStageId, "idea");

// Workspace-style exception recovery calls getProject(). That public read must
// overlay authority N+1 and must never resurrect stale projection N.
const recoveryView = memory.getProject(actualProjectId);
assert.equal(recoveryView.metadata.projectJourney.progression.revision, 1);
assert.equal(recoveryView.metadata.projectJourney.currentStageId, "story");
assert.equal(recoveryView.metadata.projectJourney.currentTaskId, "premise");

// Raw persisted projection remains intentionally visible through the dedicated
// persisted read for bootstrap, comparison and diagnostics.
const rawAfterRecoveryRead = memory.getPersistedProject(actualProjectId);
assert.equal(rawAfterRecoveryRead.metadata.projectJourney.progression.revision, 0);
assert.equal(rawAfterRecoveryRead.metadata.projectJourney.currentStageId, "idea");

// The authority read is a pure compatibility overlay: it must not mutate either store.
const authorityAfterRecoveryRead = authorityStore.read(actualProjectId, { project: rawAfterRecoveryRead });
assert.equal(authorityAfterRecoveryRead.authority.generation, 1);
assert.equal(authorityAfterRecoveryRead.journey.progression.revision, 1);
assert.equal(memory.getPersistedProject(actualProjectId).metadata.projectJourney.progression.revision, 0);

console.log("Journey Authority exception recovery sovereignty verification passed.");
console.log("- public Creator Memory getProject() returns authority-selected Journey truth");
console.log("- raw getPersistedProject() remains the stale Creator Memory projection for diagnostics/bootstrap");
console.log("- exception recovery cannot resurrect projection N over authoritative N+1");
console.log("- compatibility reads mutate neither Journey Authority nor Creator Memory persistence");

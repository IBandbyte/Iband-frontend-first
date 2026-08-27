import assert from "node:assert/strict";
import createCreatorMemory, {
  PROJECT_STATUSES,
  createMemoryStorageAdapter,
} from "../src/components/studio/mentor/CreatorMemory.js";

function journey(revision, taskId) {
  return {
    creatorJourney: "guide",
    currentStageId: "idea",
    currentTaskId: taskId,
    progression: {
      schemaVersion: 1,
      revision,
      lastCommittedOperation: null,
      committedOperations: [],
    },
  };
}

const storage = createMemoryStorageAdapter();
const projectedJourney = journey(4, "stale-projection");
const authorityJourney = journey(5, "authority-wins");
let facadeCalls = 0;

const memory = createCreatorMemory({
  storageAdapter: storage,
  projectIdentityCrypto: { randomUUID: () => "11111111-2222-4333-8444-555555555555" },
  journeyAuthorityReadFacade: {
    readPreferred({ project, projectedJourney: suppliedProjection }) {
      facadeCalls += 1;
      assert.equal(project.creatorType, "video");
      assert.equal(project.metadata.creatorMode, "ai-movie");
      assert.equal(suppliedProjection.currentTaskId, "stale-projection");
      return {
        status: "authority",
        source: "journey-authority-store",
        projectId: project.id,
        projectJourney: authorityJourney,
        authorityGeneration: 9,
        progressionRevision: 5,
        projectionStatus: "projection-stale",
        mechanicalAuthority: true,
      };
    },
  },
});

const project = memory.saveProject({
  title: "Authority Overlay Movie",
  creatorType: "video",
  status: PROJECT_STATUSES.CREATING,
  metadata: {
    creatorMode: "ai-movie",
    creatorModeLabel: "AI Movie Making",
    projectJourney: projectedJourney,
  },
});

const active = memory.getActiveProject();
assert.equal(facadeCalls, 1);
assert.equal(active.id, project.id);
assert.equal(active.metadata.projectJourney.progression.revision, 5);
assert.equal(active.metadata.projectJourney.currentTaskId, "authority-wins");

// Authority overlay is read-only. Creator Memory's stored projection must remain N.
const persistedProjection = memory.getProject(project.id);
assert.equal(persistedProjection.metadata.projectJourney.progression.revision, 4);
assert.equal(persistedProjection.metadata.projectJourney.currentTaskId, "stale-projection");

// Non-Movie-Mentor active projects must retain generic Creator Memory behavior and
// must not consult Journey Authority at all.
const genericStorage = createMemoryStorageAdapter();
let genericFacadeCalls = 0;
const genericMemory = createCreatorMemory({
  storageAdapter: genericStorage,
  projectIdentityCrypto: { randomUUID: () => "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee" },
  journeyAuthorityReadFacade: {
    readPreferred() {
      genericFacadeCalls += 1;
      throw new Error("Generic Creator Memory project must not consult Journey Authority.");
    },
  },
});
const genericProject = genericMemory.saveProject({
  title: "Ordinary Video",
  creatorType: "video",
  status: PROJECT_STATUSES.CREATING,
  metadata: { creatorMode: "movie-scene", projectJourney: journey(1, "generic") },
});
assert.equal(genericMemory.getActiveProject().id, genericProject.id);
assert.equal(genericFacadeCalls, 0);

// Malformed authority is fail-closed: never silently fall back to stale projection.
const failureStorage = createMemoryStorageAdapter();
const failureMemory = createCreatorMemory({
  storageAdapter: failureStorage,
  projectIdentityCrypto: { randomUUID: () => "ffffffff-eeee-4ddd-8ccc-bbbbbbbbbbbb" },
  journeyAuthorityReadFacade: {
    readPreferred() {
      const error = new Error("Malformed Journey Authority.");
      error.code = "JOURNEY_AUTHORITY_RECOVERY_REQUIRED";
      throw error;
    },
  },
});
failureMemory.saveProject({
  title: "Fail Closed Movie",
  creatorType: "video",
  status: PROJECT_STATUSES.CREATING,
  metadata: { creatorMode: "ai-movie", projectJourney: journey(99, "zorg-fallback") },
});
assert.throws(
  () => failureMemory.getActiveProject(),
  (error) => error?.code === "JOURNEY_AUTHORITY_RECOVERY_REQUIRED"
);

console.log("Journey authority active-project overlay verification passed.");
console.log("- Movie Mentor active-project reads expose authority Journey over stale projection");
console.log("- overlay is read-only and does not mutate Creator Memory projection");
console.log("- generic Creator Memory projects remain unchanged");
console.log("- malformed authority fails closed instead of falling back to stale Journey");

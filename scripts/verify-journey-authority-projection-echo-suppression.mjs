import assert from "node:assert/strict";
import createCreatorMemory, { PROJECT_STATUSES } from "../src/components/studio/mentor/CreatorMemory.js";

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

function countingStorage() {
  const map = new Map();
  let writes = 0;
  return {
    getItem(key) { return map.has(key) ? map.get(key) : null; },
    setItem(key, value) { writes += 1; map.set(key, String(value)); },
    removeItem(key) { map.delete(key); },
    getWriteCount() { return writes; },
  };
}

const projectedJourney = journey(4, "stale-projection");
const authorityJourney = journey(5, "authority-wins");

// Exact authority echo must perform zero whole-memory writes.
{
  const storage = countingStorage();
  const memory = createCreatorMemory({
    storageAdapter: storage,
    projectIdentityCrypto: { randomUUID: () => "11111111-2222-4333-8444-555555555555" },
    journeyAuthorityReadFacade: {
      readPreferred({ project }) {
        return {
          status: "authority",
          source: "journey-authority-store",
          projectId: project.id,
          projectJourney: authorityJourney,
          authorityGeneration: 12,
          progressionRevision: 5,
          projectionStatus: "projection-stale",
          mechanicalAuthority: true,
        };
      },
    },
  });

  const project = memory.saveProject({
    title: "Authority Echo Movie",
    creatorType: "video",
    status: PROJECT_STATUSES.CREATING,
    metadata: {
      creatorMode: "ai-movie",
      creatorModeLabel: "AI Movie Making",
      createdFrom: "CreatorWorkspace",
      projectJourney: projectedJourney,
    },
  });
  const beforeWrites = storage.getWriteCount();
  const result = memory.updateProject(project.id, {
    metadata: {
      ...project.metadata,
      projectJourney: authorityJourney,
    },
  });

  assert.equal(storage.getWriteCount(), beforeWrites, "Exact authority projection echo must not call storage.setItem().");
  assert.equal(result.metadata.projectJourney.progression.revision, 4, "No-op result reflects unchanged Creator Memory projection, not a fake persisted authority copy.");
  assert.equal(memory.getProject(project.id).metadata.projectJourney.progression.revision, 4);
}

// Before authority birth, legacy projection writes must still work normally.
{
  const storage = countingStorage();
  const memory = createCreatorMemory({
    storageAdapter: storage,
    projectIdentityCrypto: { randomUUID: () => "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee" },
    journeyAuthorityReadFacade: {
      readPreferred({ project, projectedJourney: legacy }) {
        return {
          status: "legacy-unbootstrapped",
          source: "creator-memory-projection",
          projectId: project.id,
          projectJourney: legacy,
          authorityGeneration: null,
          progressionRevision: legacy?.progression?.revision ?? 0,
          projectionStatus: "authority-absent",
          mechanicalAuthority: false,
        };
      },
    },
  });

  const project = memory.saveProject({
    title: "Legacy Movie",
    creatorType: "video",
    status: PROJECT_STATUSES.CREATING,
    metadata: {
      creatorMode: "ai-movie",
      creatorModeLabel: "AI Movie Making",
      projectJourney: projectedJourney,
    },
  });
  const beforeWrites = storage.getWriteCount();
  const nextLegacyJourney = journey(5, "legacy-write-still-allowed");
  memory.updateProject(project.id, {
    metadata: {
      ...project.metadata,
      projectJourney: nextLegacyJourney,
    },
  });
  assert.ok(storage.getWriteCount() > beforeWrites, "Legacy/unbootstrapped Journey update must still persist.");
  assert.equal(memory.getProject(project.id).metadata.projectJourney.currentTaskId, "legacy-write-still-allowed");
}

// Authority must not suppress a genuine non-Journey project update just because
// that update also carries the authoritative Journey value.
{
  const storage = countingStorage();
  const memory = createCreatorMemory({
    storageAdapter: storage,
    projectIdentityCrypto: { randomUUID: () => "99999999-8888-4777-8666-555555555555" },
    journeyAuthorityReadFacade: {
      readPreferred({ project }) {
        return {
          status: "authority",
          projectId: project.id,
          projectJourney: authorityJourney,
          authorityGeneration: 13,
          progressionRevision: 5,
          projectionStatus: "projection-stale",
          mechanicalAuthority: true,
        };
      },
    },
  });
  const project = memory.saveProject({
    title: "Meaningful Update Movie",
    creatorType: "video",
    status: PROJECT_STATUSES.CREATING,
    metadata: {
      creatorMode: "ai-movie",
      creatorModeLabel: "AI Movie Making",
      projectJourney: projectedJourney,
    },
  });
  const beforeWrites = storage.getWriteCount();
  memory.updateProject(project.id, {
    title: "Meaningfully Renamed Movie",
    metadata: {
      ...project.metadata,
      projectJourney: authorityJourney,
    },
  });
  assert.ok(storage.getWriteCount() > beforeWrites, "Meaningful non-Journey changes must not be swallowed by projection-echo suppression.");
  assert.equal(memory.getProject(project.id).title, "Meaningfully Renamed Movie");
}

console.log("Journey Authority projection echo suppression verification passed.");
console.log("- exact authority echo causes zero whole-memory writes");
console.log("- legacy/unbootstrapped Journey writes remain operational");
console.log("- meaningful non-Journey project changes are never suppressed");

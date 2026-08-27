import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import createCreatorMemory, { createMemoryStorageAdapter } from "../src/components/studio/mentor/CreatorMemory.js";
import createJourneyProgressionExecutionRuntime from "../src/components/studio/mentor/JourneyProgressionExecutionRuntime.js";
import {
  POSITION_ACTIONS,
  POSITION_AUTHORITY_SOURCES,
  issueJourneyPositionAuthority,
} from "../src/components/studio/mentor/JourneyPositionAuthorityControl.js";

const ROOT = process.cwd();
const memorySource = fs.readFileSync(path.join(ROOT, "src/components/studio/mentor/CreatorMemory.js"), "utf8");
const runtimeSource = fs.readFileSync(path.join(ROOT, "src/components/studio/mentor/JourneyProgressionExecutionRuntime.js"), "utf8");
const persistenceSource = fs.readFileSync(path.join(ROOT, "src/components/studio/mentor/JourneyRecommendationLifecyclePersistence.js"), "utf8");

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function createJourney(projectId) {
  return {
    projectId,
    currentStageId: "idea",
    currentTaskId: "seed",
    status: "creating",
    stages: [
      { id: "idea", tasks: [{ id: "seed", status: "in-progress" }] },
      { id: "story", tasks: [{ id: "premise", status: "not-started" }] },
      { id: "character", tasks: [{ id: "protagonist", status: "not-started" }] },
    ],
    progression: {
      schemaVersion: 1,
      revision: 0,
      lastCommittedOperation: null,
      committedOperations: [],
    },
  };
}

function createJourneyEngine() {
  return {
    getStage(journey, stageId) {
      return (journey.stages || []).find((stage) => stage.id === stageId) || null;
    },
    setCurrentPosition(journey, { stageId, taskId = null } = {}) {
      const next = clone(journey);
      next.currentStageId = stageId;
      next.currentTaskId = taskId || next.stages.find((stage) => stage.id === stageId)?.tasks?.[0]?.id || null;
      return next;
    },
    completeTask(journey) { return clone(journey); },
    revisitStage(journey, { stageId } = {}) { const next = clone(journey); next.currentStageId = stageId; return next; },
    pauseJourney(journey) { return clone(journey); },
    constants: {},
  };
}

function createIdentityRuntime(memory) {
  return {
    memory,
    persistJourney(projectId, projectJourney, { expectedProgressionRevision = null } = {}) {
      const project = memory.getPersistedProject(projectId);
      if (!project) return null;
      const currentRevision = Number(project?.metadata?.projectJourney?.progression?.revision ?? 0);
      if (expectedProgressionRevision !== null && currentRevision !== expectedProgressionRevision) {
        const error = new Error("stale");
        error.code = "MOVIE_MENTOR_JOURNEY_PROGRESSION_STALE";
        throw error;
      }
      const state = memory.readPersistedState();
      const index = state.projects.findIndex((item) => item.id === projectId);
      state.projects[index].metadata.projectJourney = clone(projectJourney);
      memory.replaceState(state);
      return memory.getPersistedProject(projectId);
    },
  };
}

function issueStageClick(projectId, stageId, creatorActId, revision) {
  return issueJourneyPositionAuthority({
    projectId,
    source: POSITION_AUTHORITY_SOURCES.STAGE_CLICK_UI,
    action: POSITION_ACTIONS.SET_POSITION,
    target: { stageId },
    expectedPositionRevision: revision,
    issuedAt: "2026-08-27T18:00:00.000Z",
    evidence: { creatorGesture: true, creatorActId },
  });
}

function createFakeWebLocks() {
  const tails = new Map();
  return {
    async request(name, _options, callback) {
      const previous = tails.get(name) || Promise.resolve();
      let release;
      const current = new Promise((resolve) => { release = resolve; });
      const tail = previous.catch(() => undefined).then(() => current);
      tails.set(name, tail);
      await previous.catch(() => undefined);
      try {
        return await callback({ name });
      } finally {
        release();
        if (tails.get(name) === tail) tails.delete(name);
      }
    },
  };
}

const projectId = "movie-project-real-cross-tab";
const initialJourney = createJourney(projectId);
const initialState = {
  projects: [{
    id: projectId,
    creatorType: "video",
    status: "creating",
    identity: { domain: "test-project-identity", immutable: true },
    metadata: { creatorMode: "ai-movie", creatorModeLabel: "AI Movie Making", projectJourney: clone(initialJourney) },
  }],
  projectMemories: [],
  journey: { activeProjectId: projectId },
};

// One shared storage device, two independent CreatorMemory working caches.
const sharedStorage = createMemoryStorageAdapter(initialState);
const memoryA = createCreatorMemory({ storageAdapter: sharedStorage });
const memoryB = createCreatorMemory({ storageAdapter: sharedStorage });
assert.equal(memoryA.getProject(projectId).metadata.projectJourney.progression.revision, 0);
assert.equal(memoryB.getProject(projectId).metadata.projectJourney.progression.revision, 0);

const originalNavigator = globalThis.navigator;
Object.defineProperty(globalThis, "navigator", { configurable: true, value: { locks: createFakeWebLocks() } });

try {
  const runtimeA = createJourneyProgressionExecutionRuntime({ journeyEngine: createJourneyEngine(), identityRuntime: createIdentityRuntime(memoryA) });
  const runtimeB = createJourneyProgressionExecutionRuntime({ journeyEngine: createJourneyEngine(), identityRuntime: createIdentityRuntime(memoryB) });

  const authorityA = issueStageClick(projectId, "story", "tab-A-act", 0);
  const authorityB = issueStageClick(projectId, "character", "tab-B-act", 0);

  const resultA = await runtimeA.execute({
    projectId,
    projectJourney: initialJourney,
    authorityEnvelope: authorityA,
    operationId: "tab-A-operation",
  });
  assert.equal(resultA.status, "committed");
  assert.equal(resultA.progressionRevision, 1);

  // Prove Tab B's ordinary working cache is genuinely still stale.
  assert.equal(memoryB.getProject(projectId).metadata.projectJourney.progression.revision, 0, "Tab B test precondition: cached working state must remain stale at N.");
  assert.equal(memoryB.getPersistedProject(projectId).metadata.projectJourney.progression.revision, 1, "Fresh storage view must see Tab A's N+1 commit.");

  await assert.rejects(
    runtimeB.execute({
      projectId,
      projectJourney: initialJourney,
      authorityEnvelope: authorityB,
      operationId: "tab-B-operation",
    }),
    (error) => error?.code === "JOURNEY_POSITION_AUTHORITY_STALE",
    "Tab B must validate against persisted N+1 after lock acquisition, not its cached N."
  );

  const persistedAfterRace = memoryB.getPersistedProject(projectId).metadata.projectJourney;
  assert.equal(persistedAfterRace.progression.revision, 1);
  assert.equal(persistedAfterRace.currentStageId, "story");
  assert.equal(persistedAfterRace.progression.committedOperations.length, 1);
  assert.equal(persistedAfterRace.progression.committedOperations[0].operationId, "tab-A-operation");

  // Now simulate Tab B receiving fresh UI authority at N+1 while its internal cache is still N.
  // The persistence primitive itself must also build from fresh persisted state, or this valid N+2
  // operation would either fail against cached N or overwrite unrelated newer memory.
  const authorityB2 = issueStageClick(projectId, "character", "tab-B-fresh-act", 1);
  const resultB2 = await runtimeB.execute({
    projectId,
    projectJourney: persistedAfterRace,
    authorityEnvelope: authorityB2,
    operationId: "tab-B-fresh-operation",
  });
  assert.equal(resultB2.status, "committed");
  assert.equal(resultB2.progressionRevision, 2);

  const finalPersisted = memoryA.getPersistedProject(projectId).metadata.projectJourney;
  assert.equal(finalPersisted.progression.revision, 2);
  assert.equal(finalPersisted.currentStageId, "character");
  assert.deepEqual(finalPersisted.progression.committedOperations.map((receipt) => receipt.operationId), ["tab-A-operation", "tab-B-fresh-operation"]);

  assert.ok(memorySource.includes("function readPersistedState()"), "CreatorMemory must expose a fresh persisted-state read.");
  assert.ok(memorySource.includes("const freshReader = createCreatorMemoryCore(coreOptions)"), "Persisted reads must construct a fresh Core view against the same storage configuration.");
  assert.ok(runtimeSource.includes('typeof memory?.getPersistedProject === "function"'), "Progression durable read must prefer persisted project reality.");
  assert.ok(persistenceSource.includes("const state = readLatestState(memory)"), "Atomic lifecycle persistence must construct writes from fresh persisted state.");
  assert.ok(persistenceSource.includes("const persistedProject = readLatestProject(memory, pid)"), "Post-write verification must verify persisted project reality, not cached state.");

  console.log("Journey progression cross-tab storage freshness verification passed.");
  console.log("- separate tab caches can remain stale without becoming authority");
  console.log("- lock-protected progression rereads actual persisted Journey reality");
  console.log("- stale creator authority dies instead of overwriting another tab's commit");
  console.log("- a later valid operation builds its whole-memory write from fresh persisted state");
  console.log("- committed receipt lineage survives across two independent CreatorMemory runtimes");
} finally {
  if (originalNavigator === undefined) delete globalThis.navigator;
  else Object.defineProperty(globalThis, "navigator", { configurable: true, value: originalNavigator });
}

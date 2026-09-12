import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import createCreatorMemory, { createMemoryStorageAdapter } from "../src/components/studio/mentor/CreatorMemory.js";
import createJourneyProgressionExecutionRuntime from "../src/components/studio/mentor/JourneyProgressionExecutionRuntime.js";
import createJourneyDurableAuthorityStore from "../src/components/studio/mentor/JourneyDurableAuthorityStore.js";
import {
  POSITION_ACTIONS,
  POSITION_AUTHORITY_SOURCES,
  issueJourneyPositionAuthority,
} from "../src/components/studio/mentor/JourneyPositionAuthorityControl.js";

const ROOT = process.cwd();
const memorySource = fs.readFileSync(path.join(ROOT, "src/components/studio/mentor/CreatorMemory.js"), "utf8");
const runtimeSource = fs.readFileSync(path.join(ROOT, "src/components/studio/mentor/JourneyProgressionExecutionRuntime.js"), "utf8");
const adapterSource = fs.readFileSync(path.join(ROOT, "src/components/studio/mentor/JourneyProgressionAuthorityAdapter.js"), "utf8");

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function keyedStorage() {
  const values = new Map();
  return {
    getItem(key) { return values.has(key) ? values.get(key) : null; },
    setItem(key, value) { values.set(key, String(value)); },
    removeItem(key) { values.delete(key); },
  };
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
  return { memory };
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
    async request(name, optionsOrCallback, maybeCallback) {
      const callback = typeof optionsOrCallback === "function" ? optionsOrCallback : maybeCallback;
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
    identity: { domain: "test-project-identity", schema: 1, issuance: "test", immutable: true },
    metadata: { creatorMode: "ai-movie", creatorModeLabel: "AI Movie Making", projectJourney: clone(initialJourney) },
  }],
  projectMemories: [],
  journey: { activeProjectId: projectId },
};

// One shared Creator Memory storage device, two independent working caches.
const sharedMemoryStorage = createMemoryStorageAdapter(initialState);
const memoryA = createCreatorMemory({ storageAdapter: sharedMemoryStorage });
const memoryB = createCreatorMemory({ storageAdapter: sharedMemoryStorage });
assert.equal(memoryA.getProject(projectId).metadata.projectJourney.progression.revision, 0);
assert.equal(memoryB.getProject(projectId).metadata.projectJourney.progression.revision, 0);

// Journey Authority owns its own multi-key durable storage, including sovereignty lineage.
const authorityStorage = keyedStorage();
const authorityStore = createJourneyDurableAuthorityStore({ storage: authorityStorage, browserRuntime: false });

const originalNavigator = globalThis.navigator;
Object.defineProperty(globalThis, "navigator", { configurable: true, value: { locks: createFakeWebLocks() } });

try {
  const runtimeA = createJourneyProgressionExecutionRuntime({
    journeyEngine: createJourneyEngine(),
    identityRuntime: createIdentityRuntime(memoryA),
    authorityStore,
  });
  const runtimeB = createJourneyProgressionExecutionRuntime({
    journeyEngine: createJourneyEngine(),
    identityRuntime: createIdentityRuntime(memoryB),
    authorityStore,
  });

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
  assert.equal(resultA.projectJourney.currentStageId, "story");

  // Creator Memory may remain stale after authority birth. That is now intentional:
  // it is a legacy bootstrap/projection source, not the mechanical commit target.
  assert.equal(memoryB.getProject(projectId).metadata.projectJourney.progression.revision, 0);
  assert.equal(memoryB.getPersistedProject(projectId).metadata.projectJourney.progression.revision, 0);

  const canonicalProject = memoryA.getPersistedProject(projectId);
  const afterA = authorityStore.read(projectId, { project: canonicalProject });
  assert.equal(afterA.journey.progression.revision, 1, "Journey Authority must expose Tab A's N+1 commit.");
  assert.equal(afterA.journey.currentStageId, "story");
  assert.equal(afterA.journey.progression.committedOperations[0].operationId, "tab-A-operation");

  await assert.rejects(
    runtimeB.execute({
      projectId,
      projectJourney: initialJourney,
      authorityEnvelope: authorityB,
      operationId: "tab-B-operation",
    }),
    (error) => error?.code === "JOURNEY_POSITION_AUTHORITY_STALE",
    "Tab B must validate against Journey Authority N+1 after lock acquisition, not cached Creator Memory N."
  );

  // A fresh UI act issued against N+1 may commit N+2 even while Tab B's Creator
  // Memory cache and persisted projection remain N.
  const authorityB2 = issueStageClick(projectId, "character", "tab-B-fresh-act", 1);
  const resultB2 = await runtimeB.execute({
    projectId,
    projectJourney: afterA.journey,
    authorityEnvelope: authorityB2,
    operationId: "tab-B-fresh-operation",
  });
  assert.equal(resultB2.status, "committed");
  assert.equal(resultB2.progressionRevision, 2);

  const finalAuthority = authorityStore.read(projectId, { project: canonicalProject });
  assert.equal(finalAuthority.journey.progression.revision, 2);
  assert.equal(finalAuthority.journey.currentStageId, "character");
  assert.deepEqual(
    finalAuthority.journey.progression.committedOperations.map((receipt) => receipt.operationId),
    ["tab-A-operation", "tab-B-fresh-operation"]
  );
  assert.equal(memoryA.getPersistedProject(projectId).metadata.projectJourney.progression.revision, 0, "Authority commits must not be mistaken for Creator Memory projection writes.");

  assert.ok(memorySource.includes("function readPersistedState()"), "CreatorMemory must expose a fresh persisted-state read for authority bootstrap identity/projection reads.");
  assert.match(
    memorySource,
    /function readPersistedState\(\)[\s\S]{0,400}createCreatorMemoryCore\((?:resolvedCoreOptions|coreOptions)\)/,
    "Persisted Creator Memory reads must construct a fresh Core view."
  );
  assert.ok(adapterSource.includes('typeof memory.getPersistedProject === "function"'), "Journey Authority bootstrap must prefer fresh persisted project reality.");
  assert.ok(runtimeSource.includes("use only its Journey for mechanical validation and mutation"), "Progression runtime must mechanically obey Journey Authority after lock acquisition.");
  assert.ok(runtimeSource.includes("Creator Memory is") && runtimeSource.includes("never the commit target"), "Progression runtime must not write mechanical authority back into Creator Memory.");

  console.log("Journey progression cross-tab authority freshness verification passed.");
  console.log("- separate Creator Memory tab caches may remain stale without becoming authority");
  console.log("- lock-protected progression resolves fresh Journey Authority reality");
  console.log("- stale creator authority dies instead of overwriting another tab's authority commit");
  console.log("- a later valid operation builds N+2 from authority N+1, not Creator Memory N");
  console.log("- committed receipt lineage survives across two independent CreatorMemory runtimes");
} finally {
  if (originalNavigator === undefined) delete globalThis.navigator;
  else Object.defineProperty(globalThis, "navigator", { configurable: true, value: originalNavigator });
}

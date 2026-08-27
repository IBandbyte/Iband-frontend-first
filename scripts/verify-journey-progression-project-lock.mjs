import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import createJourneyProgressionExecutionRuntime from "../src/components/studio/mentor/JourneyProgressionExecutionRuntime.js";
import {
  POSITION_ACTIONS,
  POSITION_AUTHORITY_SOURCES,
  issueJourneyPositionAuthority,
} from "../src/components/studio/mentor/JourneyPositionAuthorityControl.js";
import { withJourneyProgressionProjectLock } from "../src/components/studio/mentor/JourneyProgressionProjectLock.js";

const ROOT = process.cwd();
const runtimeSource = fs.readFileSync(path.join(ROOT, "src/components/studio/mentor/JourneyProgressionExecutionRuntime.js"), "utf8");
const lockSource = fs.readFileSync(path.join(ROOT, "src/components/studio/mentor/JourneyProgressionProjectLock.js"), "utf8");

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function createJourney(projectId = "movie-project-lock") {
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

function createMemory(projectJourney) {
  let state = {
    projects: [{
      id: projectJourney.projectId,
      creatorType: "video",
      identity: { immutable: true },
      metadata: { creatorMode: "ai-movie", projectJourney: clone(projectJourney) },
    }],
    projectMemories: [],
  };
  return {
    getProject(projectId) {
      return clone(state.projects.find((project) => project.id === projectId) || null);
    },
    getState() {
      return clone(state);
    },
    replaceState(nextState) {
      state = clone(nextState);
      return clone(state);
    },
    inspect() {
      return clone(state);
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
    revisitStage(journey, { stageId } = {}) {
      const next = clone(journey);
      next.currentStageId = stageId;
      return next;
    },
    pauseJourney(journey) { return clone(journey); },
    constants: {},
  };
}

function createIdentityRuntime(memory) {
  return {
    memory,
    persistJourney(projectId, projectJourney) {
      const state = memory.getState();
      const index = state.projects.findIndex((project) => project.id === projectId);
      state.projects[index].metadata.projectJourney = clone(projectJourney);
      memory.replaceState(state);
      return memory.getProject(projectId);
    },
  };
}

function issueStageClick(projectId, stageId, creatorActId, revision = 0) {
  return issueJourneyPositionAuthority({
    projectId,
    source: POSITION_AUTHORITY_SOURCES.STAGE_CLICK_UI,
    action: POSITION_ACTIONS.SET_POSITION,
    target: { stageId },
    expectedPositionRevision: revision,
    issuedAt: "2026-08-27T17:30:00.000Z",
    evidence: { creatorGesture: true, creatorActId },
  });
}

function createFakeWebLocks() {
  const tails = new Map();
  const active = new Set();
  let maxConcurrentSameName = 0;
  return {
    async request(name, _options, callback) {
      const previous = tails.get(name) || Promise.resolve();
      let release;
      const current = new Promise((resolve) => { release = resolve; });
      tails.set(name, previous.catch(() => undefined).then(() => current));
      await previous.catch(() => undefined);
      active.add(name);
      maxConcurrentSameName = Math.max(maxConcurrentSameName, active.has(name) ? 1 : 0);
      try {
        return await callback({ name });
      } finally {
        active.delete(name);
        release();
      }
    },
    get maxConcurrentSameName() { return maxConcurrentSameName; },
  };
}

const originalNavigator = globalThis.navigator;
const fakeLocks = createFakeWebLocks();
Object.defineProperty(globalThis, "navigator", {
  configurable: true,
  value: { locks: fakeLocks },
});

try {
  const projectId = "movie-project-lock";
  const journey = createJourney(projectId);
  const memory = createMemory(journey);
  const runtime = createJourneyProgressionExecutionRuntime({
    journeyEngine: createJourneyEngine(),
    identityRuntime: createIdentityRuntime(memory),
  });

  const authorityA = issueStageClick(projectId, "story", "creator-act-A", 0);
  const authorityB = issueStageClick(projectId, "character", "creator-act-B", 0);

  const [resultA, resultB] = await Promise.allSettled([
    runtime.execute({ projectId, projectJourney: journey, authorityEnvelope: authorityA, operationId: "operation-A" }),
    runtime.execute({ projectId, projectJourney: journey, authorityEnvelope: authorityB, operationId: "operation-B" }),
  ]);

  assert.equal(resultA.status, "fulfilled", "First creator act must commit.");
  assert.equal(resultA.value.status, "committed");
  assert.equal(resultA.value.progressionRevision, 1);
  assert.equal(resultA.value.serialization.mode, "web-locks");
  assert.equal(resultA.value.serialization.crossTabSerialized, true);

  assert.equal(resultB.status, "rejected", "Second creator act issued against stale N must not overwrite N+1.");
  assert.equal(resultB.reason?.code, "JOURNEY_POSITION_AUTHORITY_STALE");

  const durableAfterRace = memory.getProject(projectId).metadata.projectJourney;
  assert.equal(durableAfterRace.progression.revision, 1, "Concurrent different acts must produce exactly one N to N+1 commit.");
  assert.equal(durableAfterRace.currentStageId, "story", "First committed creator act must remain durable; last-writer-wins overwrite is forbidden.");
  assert.equal(durableAfterRace.progression.committedOperations.length, 1);
  assert.equal(durableAfterRace.progression.committedOperations[0].operationId, "operation-A");

  // Same operation in two callers: second caller must reconcile the original receipt,
  // not fail stale or create revision N+2.
  const journey2 = createJourney("movie-project-lock-duplicate");
  const memory2 = createMemory(journey2);
  const runtime2 = createJourneyProgressionExecutionRuntime({
    journeyEngine: createJourneyEngine(),
    identityRuntime: createIdentityRuntime(memory2),
  });
  const sameAuthority = issueStageClick(journey2.projectId, "story", "creator-act-same", 0);
  const duplicateResults = await Promise.all([
    runtime2.execute({ projectId: journey2.projectId, projectJourney: journey2, authorityEnvelope: sameAuthority, operationId: "operation-same" }),
    runtime2.execute({ projectId: journey2.projectId, projectJourney: journey2, authorityEnvelope: sameAuthority, operationId: "operation-same" }),
  ]);
  assert.equal(duplicateResults[0].status, "committed");
  assert.equal(duplicateResults[1].status, "already-committed");
  assert.equal(memory2.getProject(journey2.projectId).metadata.projectJourney.progression.revision, 1);

  // Lock release after callback failure.
  const lockEvents = [];
  await assert.rejects(
    withJourneyProgressionProjectLock({ projectId: "release-test", callback: async () => { lockEvents.push("first"); throw new Error("boom"); } }),
    /boom/
  );
  await withJourneyProgressionProjectLock({ projectId: "release-test", callback: async () => { lockEvents.push("second"); } });
  assert.deepEqual(lockEvents, ["first", "second"], "A failed transaction must release the project lock.");

  // Structural law: public execute acquires lock before private transaction body performs durable read.
  const publicExecute = runtimeSource.indexOf("async function executeJourneyProgression(input = {})");
  const lockCall = runtimeSource.indexOf("withJourneyProgressionProjectLock({", publicExecute);
  const unlockedCall = runtimeSource.indexOf("executeJourneyProgressionUnlocked(input)", lockCall);
  const privateBody = runtimeSource.indexOf("async function executeJourneyProgressionUnlocked");
  const durableRead = runtimeSource.indexOf("const durableJourney = getDurableJourney", privateBody);
  assert.ok(publicExecute >= 0 && lockCall > publicExecute && unlockedCall > lockCall, "Public progression execution must enter the project lock before invoking transaction logic.");
  assert.ok(privateBody >= 0 && durableRead > privateBody, "Durable Journey read must live inside the locked transaction body.");
  assert.ok(lockSource.includes('locksApi = globalThis?.navigator?.locks || null'), "Browser Web Locks must be the primary same-origin cross-tab serializer.");
  assert.ok(lockSource.includes('mode: "in-process-fallback"'), "A single-runtime fallback mutex must remain available for tests/non-Web-Locks environments.");

  console.log("Journey progression project lock verification passed.");
  console.log("- different concurrent creator acts cannot overwrite one another from the same N");
  console.log("- same-operation concurrency reconciles the original durable receipt");
  console.log("- lock release survives transaction failure");
  console.log("- durable Journey read occurs inside the project serialization boundary");
  console.log("- browser Web Locks provide same-origin cross-tab serialization");
} finally {
  if (originalNavigator === undefined) {
    delete globalThis.navigator;
  } else {
    Object.defineProperty(globalThis, "navigator", { configurable: true, value: originalNavigator });
  }
}

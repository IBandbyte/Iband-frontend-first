import assert from "node:assert/strict";
import createCreatorJourneyEngine from "../src/components/studio/mentor/CreatorJourneyEngine.js";
import {
  POSITION_ACTIONS,
  POSITION_AUTHORITY_SOURCES,
  issueJourneyPositionAuthority,
} from "../src/components/studio/mentor/JourneyPositionAuthorityControl.js";
import {
  executeJourneyProgression,
  inspectJourneyProgression,
} from "../src/components/studio/mentor/JourneyProgressionExecutionRuntime.js";

const projectId = "movie-project-creator-completion-torture";
const engine = createCreatorJourneyEngine();

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function createHarness(initialJourney) {
  let durableJourney = clone(initialJourney);
  let failNextPersistence = false;

  const identityRuntime = {
    memory: {
      getProject(id) {
        return id === projectId ? { id, metadata: { projectJourney: clone(durableJourney) } } : null;
      },
    },
    async persistJourney(id, nextJourney, { expectedProgressionRevision = null } = {}) {
      assert.equal(id, projectId);
      const currentRevision = durableJourney?.progression?.revision ?? 0;
      if (currentRevision !== expectedProgressionRevision) {
        const error = new Error("stale persisted Journey");
        error.code = "MOVIE_MENTOR_JOURNEY_PROGRESSION_STALE";
        throw error;
      }
      if (failNextPersistence) {
        failNextPersistence = false;
        const error = new Error("simulated persistence failure");
        error.code = "SIMULATED_PERSISTENCE_FAILURE";
        throw error;
      }
      durableJourney = clone(nextJourney);
      return { id, metadata: { projectJourney: clone(durableJourney) } };
    },
  };

  return {
    identityRuntime,
    getJourney: () => clone(durableJourney),
    failNext: () => { failNextPersistence = true; },
  };
}

function completionAuthority({ source, action, target, revision, actId }) {
  return issueJourneyPositionAuthority({
    projectId,
    source,
    action,
    target,
    expectedPositionRevision: revision,
    issuedAt: `2026-08-27T13:${String(revision % 60).padStart(2, "0")}:00.000Z`,
    evidence: {
      creatorGesture: true,
      creatorActId: actId,
    },
  });
}

async function expectCode(fn, code) {
  let thrown = null;
  try {
    await fn();
  } catch (error) {
    thrown = error;
  }
  assert.ok(thrown, `Expected ${code} to throw`);
  assert.equal(thrown.code, code);
  return thrown;
}

// 1. Explicit creator task completion commits exactly one task and leaves position unchanged.
const taskJourney = engine.createMovieJourney({ projectId });
taskJourney.currentStageId = "story-direction";
taskJourney.currentTaskId = "story-foundation";
taskJourney.resumePoint = { stageId: "story-direction", taskId: "story-foundation", sceneId: null, note: null, savedAt: taskJourney.updatedAt };
const taskHarness = createHarness(taskJourney);
const taskAuthority = completionAuthority({
  source: POSITION_AUTHORITY_SOURCES.TASK_COMPLETION_UI,
  action: POSITION_ACTIONS.COMPLETE_TASK,
  target: { stageId: "story-direction", taskId: "story-foundation" },
  revision: 0,
  actId: "ui-task-complete-0",
});
const taskResult = await executeJourneyProgression({
  journeyEngine: engine,
  identityRuntime: taskHarness.identityRuntime,
  projectId,
  projectJourney: taskJourney,
  authorityEnvelope: taskAuthority,
  operationId: "ui-task-op-0",
});
assert.equal(taskResult.status, "committed");
assert.equal(taskResult.progressionRevision, 1);
assert.equal(taskResult.projectJourney.currentStageId, "story-direction");
assert.equal(taskResult.projectJourney.currentTaskId, "story-foundation");
assert.equal(
  engine.getStage(taskResult.projectJourney, "story-direction").tasks.find((task) => task.id === "story-foundation").status,
  engine.constants.TASK_STATUSES.COMPLETED_FOR_NOW
);

// 2. Lost-response retry of the same creator task gesture returns the original committed receipt.
const duplicateTask = await executeJourneyProgression({
  journeyEngine: engine,
  identityRuntime: taskHarness.identityRuntime,
  projectId,
  projectJourney: taskJourney,
  authorityEnvelope: taskAuthority,
  operationId: "ui-task-op-0",
});
assert.equal(duplicateTask.status, "already-committed");
assert.equal(duplicateTask.progressionRevision, 1);
assert.equal(duplicateTask.receipt.operationId, taskResult.receipt.operationId);
assert.equal(taskHarness.getJourney().progression.revision, 1);

// 3. A second distinct gesture issued against the stale pre-completion revision cannot complete again.
const staleTaskAuthority = completionAuthority({
  source: POSITION_AUTHORITY_SOURCES.TASK_COMPLETION_UI,
  action: POSITION_ACTIONS.COMPLETE_TASK,
  target: { stageId: "story-direction", taskId: "story-foundation" },
  revision: 0,
  actId: "ui-task-complete-stale",
});
await expectCode(() => executeJourneyProgression({
  journeyEngine: engine,
  identityRuntime: taskHarness.identityRuntime,
  projectId,
  projectJourney: taskJourney,
  authorityEnvelope: staleTaskAuthority,
  operationId: "ui-task-op-stale",
}), "JOURNEY_POSITION_AUTHORITY_STALE");
assert.equal(taskHarness.getJourney().progression.revision, 1);

// 4. Wrong task and wrong stage targets fail without consuming a revision.
const wrongTaskJourney = engine.createMovieJourney({ projectId });
wrongTaskJourney.currentStageId = "story-direction";
wrongTaskJourney.currentTaskId = "story-foundation";
const wrongHarness = createHarness(wrongTaskJourney);
const wrongTaskAuthority = completionAuthority({
  source: POSITION_AUTHORITY_SOURCES.TASK_COMPLETION_UI,
  action: POSITION_ACTIONS.COMPLETE_TASK,
  target: { stageId: "story-direction", taskId: "not-a-real-task" },
  revision: 0,
  actId: "ui-wrong-task",
});
await expectCode(() => executeJourneyProgression({
  journeyEngine: engine,
  identityRuntime: wrongHarness.identityRuntime,
  projectId,
  projectJourney: wrongTaskJourney,
  authorityEnvelope: wrongTaskAuthority,
}), "JOURNEY_PROGRESSION_TARGET_TASK_NOT_FOUND");
assert.equal(inspectJourneyProgression(wrongHarness.getJourney()).revision, 0);

const wrongStageAuthority = completionAuthority({
  source: POSITION_AUTHORITY_SOURCES.STAGE_COMPLETION_UI,
  action: POSITION_ACTIONS.COMPLETE_STAGE,
  target: { stageId: "not-a-real-stage" },
  revision: 0,
  actId: "ui-wrong-stage",
});
await expectCode(() => executeJourneyProgression({
  journeyEngine: engine,
  identityRuntime: wrongHarness.identityRuntime,
  projectId,
  projectJourney: wrongTaskJourney,
  authorityEnvelope: wrongStageAuthority,
}), "JOURNEY_PROGRESSION_TARGET_STAGE_NOT_FOUND");
assert.equal(inspectJourneyProgression(wrongHarness.getJourney()).revision, 0);

// 5. Creator stage completion is position-preserving and does not activate the next stage.
const stageJourney = engine.createMovieJourney({ projectId });
stageJourney.currentStageId = "story-direction";
stageJourney.currentTaskId = "story-foundation";
stageJourney.resumePoint = { stageId: "story-direction", taskId: "story-foundation", sceneId: null, note: "stay-here", savedAt: stageJourney.updatedAt };
const stageHarness = createHarness(stageJourney);
const beforeStage = stageHarness.getJourney();
const stageAuthority = completionAuthority({
  source: POSITION_AUTHORITY_SOURCES.STAGE_COMPLETION_UI,
  action: POSITION_ACTIONS.COMPLETE_STAGE,
  target: { stageId: "story-direction" },
  revision: 0,
  actId: "ui-stage-complete-0",
});
const stageResult = await executeJourneyProgression({
  journeyEngine: engine,
  identityRuntime: stageHarness.identityRuntime,
  projectId,
  projectJourney: beforeStage,
  authorityEnvelope: stageAuthority,
  operationId: "ui-stage-op-0",
});
assert.equal(stageResult.progressionRevision, 1);
assert.equal(stageResult.projectJourney.currentStageId, beforeStage.currentStageId);
assert.equal(stageResult.projectJourney.currentTaskId, beforeStage.currentTaskId);
assert.deepEqual(stageResult.projectJourney.resumePoint, beforeStage.resumePoint);
assert.equal(engine.getStage(stageResult.projectJourney, "story-direction").status, engine.constants.STAGE_STATUSES.COMPLETED_FOR_NOW);
assert.equal(engine.getStage(stageResult.projectJourney, "characters").status, engine.constants.STAGE_STATUSES.NOT_STARTED);

// 6. A stage completion source cannot be broadened into movement, and a task source cannot be broadened into stage completion.
await expectCode(async () => issueJourneyPositionAuthority({
  projectId,
  source: POSITION_AUTHORITY_SOURCES.STAGE_COMPLETION_UI,
  action: POSITION_ACTIONS.SET_POSITION,
  target: { stageId: "characters" },
  expectedPositionRevision: 1,
  issuedAt: "2026-08-27T13:10:00.000Z",
  evidence: { creatorGesture: true, creatorActId: "ui-stage-broaden" },
}), "JOURNEY_POSITION_STAGE_COMPLETION_UI_INVALID");
await expectCode(async () => issueJourneyPositionAuthority({
  projectId,
  source: POSITION_AUTHORITY_SOURCES.TASK_COMPLETION_UI,
  action: POSITION_ACTIONS.COMPLETE_STAGE,
  target: { stageId: "story-direction" },
  expectedPositionRevision: 1,
  issuedAt: "2026-08-27T13:11:00.000Z",
  evidence: { creatorGesture: true, creatorActId: "ui-task-broaden" },
}), "JOURNEY_POSITION_TASK_COMPLETION_UI_INVALID");

// 7. Completion UI authority cannot be issued without a real creator gesture identity.
await expectCode(async () => issueJourneyPositionAuthority({
  projectId,
  source: POSITION_AUTHORITY_SOURCES.TASK_COMPLETION_UI,
  action: POSITION_ACTIONS.COMPLETE_TASK,
  target: { stageId: "story-direction", taskId: "story-foundation" },
  expectedPositionRevision: 0,
  issuedAt: "2026-08-27T13:12:00.000Z",
  evidence: { creatorGesture: false, creatorActId: "" },
}), "JOURNEY_POSITION_TASK_COMPLETION_UI_INVALID");

// 8. Failed persistence does not complete or consume; the exact creator operation may retry successfully.
const failureJourney = engine.createMovieJourney({ projectId });
failureJourney.currentStageId = "story-direction";
failureJourney.currentTaskId = "story-foundation";
const failureHarness = createHarness(failureJourney);
const failureAuthority = completionAuthority({
  source: POSITION_AUTHORITY_SOURCES.TASK_COMPLETION_UI,
  action: POSITION_ACTIONS.COMPLETE_TASK,
  target: { stageId: "story-direction", taskId: "story-foundation" },
  revision: 0,
  actId: "ui-task-persist-failure",
});
failureHarness.failNext();
await expectCode(() => executeJourneyProgression({
  journeyEngine: engine,
  identityRuntime: failureHarness.identityRuntime,
  projectId,
  projectJourney: failureJourney,
  authorityEnvelope: failureAuthority,
  operationId: "ui-task-persist-failure-op",
}), "SIMULATED_PERSISTENCE_FAILURE");
assert.equal(failureHarness.getJourney().progression, undefined);
assert.notEqual(
  engine.getStage(failureHarness.getJourney(), "story-direction").tasks.find((task) => task.id === "story-foundation").status,
  engine.constants.TASK_STATUSES.COMPLETED_FOR_NOW
);
const retryResult = await executeJourneyProgression({
  journeyEngine: engine,
  identityRuntime: failureHarness.identityRuntime,
  projectId,
  projectJourney: failureHarness.getJourney(),
  authorityEnvelope: failureAuthority,
  operationId: "ui-task-persist-failure-op",
});
assert.equal(retryResult.status, "committed");
assert.equal(retryResult.progressionRevision, 1);

// 9. Mentor recommendation and backend readiness still cannot impersonate creator completion.
await expectCode(async () => issueJourneyPositionAuthority({
  projectId,
  source: POSITION_AUTHORITY_SOURCES.MENTOR_RECOMMENDATION,
  action: POSITION_ACTIONS.COMPLETE_STAGE,
  target: { stageId: "story-direction" },
  expectedPositionRevision: 0,
  issuedAt: "2026-08-27T13:13:00.000Z",
  evidence: { creatorGesture: true, creatorActId: "mentor-not-creator" },
}), "JOURNEY_POSITION_ADVISORY_CANNOT_AUTHORISE");
await expectCode(async () => issueJourneyPositionAuthority({
  projectId,
  source: POSITION_AUTHORITY_SOURCES.BACKEND_MAY_ADVANCE_JOURNEY,
  action: POSITION_ACTIONS.COMPLETE_TASK,
  target: { stageId: "story-direction", taskId: "story-foundation" },
  expectedPositionRevision: 0,
  issuedAt: "2026-08-27T13:14:00.000Z",
  evidence: { creatorGesture: true, creatorActId: "backend-not-creator", mayAdvanceJourney: true },
}), "JOURNEY_POSITION_SOURCE_UNAUTHORISED");

console.log("Movie Mentor creator completion torture: PASS");
console.log("- task completion is exact, idempotent and position-preserving");
console.log("- stage completion is exact and cannot auto-move the Journey");
console.log("- stale/wrong targets/persistence failures do not create completion reality");
console.log("- completion UI authority cannot broaden its action");
console.log("- Mentor/backend readiness cannot impersonate the creator");

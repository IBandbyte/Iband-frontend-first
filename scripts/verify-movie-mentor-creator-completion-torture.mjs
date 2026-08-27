import assert from "node:assert/strict";
import createCreatorJourneyEngine from "../src/components/studio/mentor/CreatorJourneyEngine.js";
import createJourneyDurableAuthorityStore from "../src/components/studio/mentor/JourneyDurableAuthorityStore.js";
import {
  POSITION_ACTIONS,
  POSITION_AUTHORITY_SOURCES,
  issueJourneyPositionAuthority,
} from "../src/components/studio/mentor/JourneyPositionAuthorityControl.js";
import { executeJourneyProgression, inspectJourneyProgression } from "../src/components/studio/mentor/JourneyProgressionExecutionRuntime.js";

const projectId = "movie-project-creator-completion-torture";
const engine = createCreatorJourneyEngine();
const clone = (value) => JSON.parse(JSON.stringify(value));

function createHarness(initialJourney) {
  const projectedJourney = clone(initialJourney);
  const map = new Map();
  let failNextAuthorityWrite = false;
  const storage = {
    getItem(key) { return map.has(key) ? map.get(key) : null; },
    setItem(key, value) {
      if (failNextAuthorityWrite) {
        failNextAuthorityWrite = false;
        const error = new Error("simulated authority persistence failure");
        error.code = "SIMULATED_PERSISTENCE_FAILURE";
        throw error;
      }
      map.set(key, String(value));
    },
    removeItem(key) { map.delete(key); },
  };
  const authorityStore = createJourneyDurableAuthorityStore({ storage, browserRuntime: false });
  const memory = {
    getProject(id) { return id === projectId ? { id, metadata: { projectJourney: clone(projectedJourney) } } : null; },
    getPersistedProject(id) { return this.getProject(id); },
  };
  const identityRuntime = { memory };
  return {
    identityRuntime,
    authorityStore,
    getJourney() {
      const record = authorityStore.read(projectId, { project: memory.getProject(projectId) });
      return clone(record?.journey || projectedJourney);
    },
    getProjection: () => clone(projectedJourney),
    failNext: () => { failNextAuthorityWrite = true; },
  };
}

function execute(harness, input) {
  return executeJourneyProgression({
    journeyEngine: engine,
    identityRuntime: harness.identityRuntime,
    authorityStore: harness.authorityStore,
    projectId,
    ...input,
  });
}

function completionAuthority({ source, action, target, revision, actId }) {
  return issueJourneyPositionAuthority({
    projectId,
    source,
    action,
    target,
    expectedPositionRevision: revision,
    issuedAt: `2026-08-27T13:${String(revision % 60).padStart(2, "0")}:00.000Z`,
    evidence: { creatorGesture: true, creatorActId: actId },
  });
}

async function expectCode(fn, code) {
  let thrown = null;
  try { await fn(); } catch (error) { thrown = error; }
  assert.ok(thrown, `Expected ${code} to throw`);
  assert.equal(thrown.code, code);
}

// 1. Task completion commits exactly once, preserves position, and leaves Creator Memory stale.
const taskJourney = engine.createMovieJourney({ projectId });
taskJourney.currentStageId = "story-direction";
taskJourney.currentTaskId = "story-foundation";
taskJourney.resumePoint = { stageId: "story-direction", taskId: "story-foundation", sceneId: null, note: null, savedAt: taskJourney.updatedAt };
const taskHarness = createHarness(taskJourney);
const taskAuthority = completionAuthority({ source: POSITION_AUTHORITY_SOURCES.TASK_COMPLETION_UI, action: POSITION_ACTIONS.COMPLETE_TASK, target: { stageId: "story-direction", taskId: "story-foundation" }, revision: 0, actId: "ui-task-complete-0" });
const taskResult = await execute(taskHarness, { projectJourney: taskJourney, authorityEnvelope: taskAuthority, operationId: "ui-task-op-0" });
assert.equal(taskResult.status, "committed");
assert.equal(taskResult.progressionRevision, 1);
assert.equal(taskResult.authorityGeneration, 1);
assert.equal(taskResult.projectJourney.currentStageId, "story-direction");
assert.equal(taskResult.projectJourney.currentTaskId, "story-foundation");
assert.equal(engine.getStage(taskResult.projectJourney, "story-direction").tasks.find((task) => task.id === "story-foundation").status, engine.constants.TASK_STATUSES.COMPLETED_FOR_NOW);
assert.equal(taskHarness.getProjection().progression, undefined, "Creator Memory projection must remain legacy/stale.");

// 2. Lost-response retry returns the original authority receipt without G+2.
const duplicateTask = await execute(taskHarness, { projectJourney: taskJourney, authorityEnvelope: taskAuthority, operationId: "ui-task-op-0" });
assert.equal(duplicateTask.status, "already-committed");
assert.equal(duplicateTask.progressionRevision, 1);
assert.equal(duplicateTask.authorityGeneration, 1);
assert.equal(duplicateTask.receipt.operationId, taskResult.receipt.operationId);

// 3. A distinct stale-N gesture cannot complete again.
const staleTaskAuthority = completionAuthority({ source: POSITION_AUTHORITY_SOURCES.TASK_COMPLETION_UI, action: POSITION_ACTIONS.COMPLETE_TASK, target: { stageId: "story-direction", taskId: "story-foundation" }, revision: 0, actId: "ui-task-complete-stale" });
await expectCode(() => execute(taskHarness, { projectJourney: taskJourney, authorityEnvelope: staleTaskAuthority, operationId: "ui-task-op-stale" }), "JOURNEY_POSITION_AUTHORITY_STALE");
assert.equal(taskHarness.getJourney().progression.revision, 1);

// 4. Wrong targets fail without consuming authority generation/revision.
const wrongJourney = engine.createMovieJourney({ projectId });
wrongJourney.currentStageId = "story-direction";
wrongJourney.currentTaskId = "story-foundation";
const wrongHarness = createHarness(wrongJourney);
const wrongTaskAuthority = completionAuthority({ source: POSITION_AUTHORITY_SOURCES.TASK_COMPLETION_UI, action: POSITION_ACTIONS.COMPLETE_TASK, target: { stageId: "story-direction", taskId: "not-a-real-task" }, revision: 0, actId: "ui-wrong-task" });
await expectCode(() => execute(wrongHarness, { projectJourney: wrongJourney, authorityEnvelope: wrongTaskAuthority }), "JOURNEY_PROGRESSION_TARGET_TASK_NOT_FOUND");
assert.equal(inspectJourneyProgression(wrongHarness.getJourney()).revision, 0);
const wrongStageAuthority = completionAuthority({ source: POSITION_AUTHORITY_SOURCES.STAGE_COMPLETION_UI, action: POSITION_ACTIONS.COMPLETE_STAGE, target: { stageId: "not-a-real-stage" }, revision: 0, actId: "ui-wrong-stage" });
await expectCode(() => execute(wrongHarness, { projectJourney: wrongJourney, authorityEnvelope: wrongStageAuthority }), "JOURNEY_PROGRESSION_TARGET_STAGE_NOT_FOUND");
assert.equal(inspectJourneyProgression(wrongHarness.getJourney()).revision, 0);

// 5. Stage completion is position-preserving and does not activate the next stage.
const stageJourney = engine.createMovieJourney({ projectId });
stageJourney.currentStageId = "story-direction";
stageJourney.currentTaskId = "story-foundation";
stageJourney.resumePoint = { stageId: "story-direction", taskId: "story-foundation", sceneId: null, note: "stay-here", savedAt: stageJourney.updatedAt };
const stageHarness = createHarness(stageJourney);
const stageAuthority = completionAuthority({ source: POSITION_AUTHORITY_SOURCES.STAGE_COMPLETION_UI, action: POSITION_ACTIONS.COMPLETE_STAGE, target: { stageId: "story-direction" }, revision: 0, actId: "ui-stage-complete-0" });
const stageResult = await execute(stageHarness, { projectJourney: stageJourney, authorityEnvelope: stageAuthority, operationId: "ui-stage-op-0" });
assert.equal(stageResult.progressionRevision, 1);
assert.equal(stageResult.projectJourney.currentStageId, stageJourney.currentStageId);
assert.equal(stageResult.projectJourney.currentTaskId, stageJourney.currentTaskId);
assert.deepEqual(stageResult.projectJourney.resumePoint, stageJourney.resumePoint);
assert.equal(engine.getStage(stageResult.projectJourney, "story-direction").status, engine.constants.STAGE_STATUSES.COMPLETED_FOR_NOW);
assert.equal(engine.getStage(stageResult.projectJourney, "characters").status, engine.constants.STAGE_STATUSES.NOT_STARTED);

// 6. Completion authority sources cannot broaden into movement/other completion classes.
await expectCode(async () => issueJourneyPositionAuthority({ projectId, source: POSITION_AUTHORITY_SOURCES.STAGE_COMPLETION_UI, action: POSITION_ACTIONS.SET_POSITION, target: { stageId: "characters" }, expectedPositionRevision: 1, issuedAt: "2026-08-27T13:10:00.000Z", evidence: { creatorGesture: true, creatorActId: "ui-stage-broaden" } }), "JOURNEY_POSITION_STAGE_COMPLETION_UI_INVALID");
await expectCode(async () => issueJourneyPositionAuthority({ projectId, source: POSITION_AUTHORITY_SOURCES.TASK_COMPLETION_UI, action: POSITION_ACTIONS.COMPLETE_STAGE, target: { stageId: "story-direction" }, expectedPositionRevision: 1, issuedAt: "2026-08-27T13:11:00.000Z", evidence: { creatorGesture: true, creatorActId: "ui-task-broaden" } }), "JOURNEY_POSITION_TASK_COMPLETION_UI_INVALID");

// 7. Completion UI authority requires a genuine creator gesture identity.
await expectCode(async () => issueJourneyPositionAuthority({ projectId, source: POSITION_AUTHORITY_SOURCES.TASK_COMPLETION_UI, action: POSITION_ACTIONS.COMPLETE_TASK, target: { stageId: "story-direction", taskId: "story-foundation" }, expectedPositionRevision: 0, issuedAt: "2026-08-27T13:12:00.000Z", evidence: { creatorGesture: false, creatorActId: "" } }), "JOURNEY_POSITION_TASK_COMPLETION_UI_INVALID");

// 8. Failed Journey Authority persistence creates no completion reality; exact retry may commit.
const failureJourney = engine.createMovieJourney({ projectId });
failureJourney.currentStageId = "story-direction";
failureJourney.currentTaskId = "story-foundation";
const failureHarness = createHarness(failureJourney);
const failureAuthority = completionAuthority({ source: POSITION_AUTHORITY_SOURCES.TASK_COMPLETION_UI, action: POSITION_ACTIONS.COMPLETE_TASK, target: { stageId: "story-direction", taskId: "story-foundation" }, revision: 0, actId: "ui-task-persist-failure" });
failureHarness.failNext();
await expectCode(() => execute(failureHarness, { projectJourney: failureJourney, authorityEnvelope: failureAuthority, operationId: "ui-task-persist-failure-op" }), "SIMULATED_PERSISTENCE_FAILURE");
assert.equal(failureHarness.getProjection().progression, undefined);
assert.notEqual(engine.getStage(failureHarness.getProjection(), "story-direction").tasks.find((task) => task.id === "story-foundation").status, engine.constants.TASK_STATUSES.COMPLETED_FOR_NOW);
const retryResult = await execute(failureHarness, { projectJourney: failureJourney, authorityEnvelope: failureAuthority, operationId: "ui-task-persist-failure-op" });
assert.equal(retryResult.status, "committed");
assert.equal(retryResult.progressionRevision, 1);

// 9. Mentor/backend evidence still cannot impersonate creator completion.
await expectCode(async () => issueJourneyPositionAuthority({ projectId, source: POSITION_AUTHORITY_SOURCES.MENTOR_RECOMMENDATION, action: POSITION_ACTIONS.COMPLETE_STAGE, target: { stageId: "story-direction" }, expectedPositionRevision: 0, issuedAt: "2026-08-27T13:13:00.000Z", evidence: { creatorGesture: true, creatorActId: "mentor-not-creator" } }), "JOURNEY_POSITION_ADVISORY_CANNOT_AUTHORISE");
await expectCode(async () => issueJourneyPositionAuthority({ projectId, source: POSITION_AUTHORITY_SOURCES.BACKEND_MAY_ADVANCE_JOURNEY, action: POSITION_ACTIONS.COMPLETE_TASK, target: { stageId: "story-direction", taskId: "story-foundation" }, expectedPositionRevision: 0, issuedAt: "2026-08-27T13:14:00.000Z", evidence: { creatorGesture: true, creatorActId: "backend-not-creator", mayAdvanceJourney: true } }), "JOURNEY_POSITION_SOURCE_UNAUTHORISED");

console.log("Movie Mentor creator completion torture: PASS");
console.log("- task/stage completion is exact, idempotent and position-preserving in Journey Authority");
console.log("- Creator Memory may remain stale without becoming completion truth");
console.log("- failed authority persistence creates zero completion reality and exact retry is safe");
console.log("- Mentor/backend readiness cannot impersonate the creator");

import assert from "node:assert/strict";
import createCreatorJourneyEngine from "../src/components/studio/mentor/CreatorJourneyEngine.js";
import createJourneyDurableAuthorityStore from "../src/components/studio/mentor/JourneyDurableAuthorityStore.js";
import {
  POSITION_ACTIONS,
  POSITION_AUTHORITY_SOURCES,
  issueJourneyPositionAuthority,
} from "../src/components/studio/mentor/JourneyPositionAuthorityControl.js";
import {
  MAX_COMMITTED_PROGRESSION_OPERATIONS,
  PROGRESSION_HEALTH,
  inspectJourneyProgression,
  executeJourneyProgression,
} from "../src/components/studio/mentor/JourneyProgressionExecutionRuntime.js";

const projectId = "movie-project-11e4";
const engine = createCreatorJourneyEngine();

function clone(value) { return JSON.parse(JSON.stringify(value)); }

function createStorage() {
  const values = new Map();
  let failNextSet = false;
  return {
    getItem(key) { return values.has(key) ? values.get(key) : null; },
    setItem(key, value) {
      if (failNextSet) {
        failNextSet = false;
        const error = new Error("simulated authority persistence failure");
        error.code = "SIMULATED_PERSISTENCE_FAILURE";
        throw error;
      }
      values.set(key, String(value));
    },
    removeItem(key) { values.delete(key); },
    failNext() { failNextSet = true; },
  };
}

function createHarness(initialJourney) {
  const projectedJourney = clone(initialJourney);
  const project = {
    id: projectId,
    creatorType: "video",
    identity: { domain: "iband.movie-mentor.project", schema: 1, issuance: "secure-web-crypto", legacy: false },
    metadata: { creatorMode: "ai-movie", projectJourney: projectedJourney },
  };
  const storage = createStorage();
  const authorityStore = createJourneyDurableAuthorityStore({ storage, browserRuntime: false });
  const identityRuntime = {
    memory: {
      getProject(id) { return id === projectId ? clone(project) : null; },
      getPersistedProject(id) { return id === projectId ? clone(project) : null; },
    },
  };
  return {
    identityRuntime,
    authorityStore,
    project,
    getJourney() {
      return clone(authorityStore.read(projectId, { project })?.journey || projectedJourney);
    },
    getProjection() { return clone(projectedJourney); },
    failNext() { storage.failNext(); },
    async bootstrap() {
      return authorityStore.bootstrap({ project, legacyJourney: projectedJourney });
    },
  };
}

function creatorAuthority({ action, target = {}, revision, actId }) {
  return issueJourneyPositionAuthority({
    projectId,
    source: POSITION_AUTHORITY_SOURCES.CREATOR_EXPLICIT_INTENT,
    action,
    target,
    expectedPositionRevision: revision,
    issuedAt: `2026-08-27T01:${String(revision % 60).padStart(2, "0")}:00.000Z`,
    evidence: { creatorExplicit: true, creatorActId: actId },
  });
}

async function execute(harness, args = {}) {
  return executeJourneyProgression({
    journeyEngine: engine,
    identityRuntime: harness.identityRuntime,
    authorityStore: harness.authorityStore,
    projectId,
    ...args,
  });
}

async function expectCode(fn, code) {
  let thrown = null;
  try { await fn(); } catch (error) { thrown = error; }
  assert.ok(thrown, `Expected ${code} to throw`);
  assert.equal(thrown.code, code);
  return thrown;
}

// 1. Legacy Journey is a safe effective revision-0 baseline and inspection does not mutate it.
const legacyJourney = engine.createMovieJourney({ projectId });
assert.equal(legacyJourney.progression, undefined);
const legacyInspection = inspectJourneyProgression(legacyJourney);
assert.equal(legacyInspection.status, PROGRESSION_HEALTH.LEGACY_BASELINE);
assert.equal(legacyInspection.revision, 0);
assert.equal(legacyJourney.progression, undefined);

// 2. Exact 0 -> 1 position movement commits one authoritative receipt.
const harness = createHarness(legacyJourney);
const moveAuthority = creatorAuthority({
  action: POSITION_ACTIONS.SET_POSITION,
  target: { stageId: "story-direction", taskId: "story-foundation" },
  revision: 0,
  actId: "creator-act-move-0",
});
const moveResult = await execute(harness, {
  projectJourney: legacyJourney,
  authorityEnvelope: moveAuthority,
});
assert.equal(moveResult.status, "committed");
assert.equal(moveResult.authorityCommitted, true);
assert.equal(moveResult.projected, false);
assert.equal(moveResult.progressionRevision, 1);
assert.equal(moveResult.projectJourney.currentStageId, "story-direction");
assert.equal(moveResult.projectJourney.currentTaskId, "story-foundation");
assert.equal(moveResult.projectJourney.progression.committedOperations.length, 1);
assert.equal(moveResult.receipt.fromRevision, 0);
assert.equal(moveResult.receipt.toRevision, 1);
assert.equal(harness.getProjection().progression, undefined, "Creator Memory projection must remain demoted after authority commit.");

// 3. Lost-response retry using stale pre-commit Journey returns original authority receipt.
const duplicateResult = await execute(harness, {
  projectJourney: legacyJourney,
  authorityEnvelope: moveAuthority,
});
assert.equal(duplicateResult.status, "already-committed");
assert.equal(duplicateResult.progressionRevision, 1);
assert.equal(duplicateResult.receipt.operationId, moveResult.receipt.operationId);
assert.equal(harness.getJourney().progression.revision, 1);

// 4. Task completion increments once and cannot move the map.
const beforeTask = harness.getJourney();
const taskAuthority = creatorAuthority({
  action: POSITION_ACTIONS.COMPLETE_TASK,
  target: { stageId: "story-direction", taskId: "story-foundation" },
  revision: 1,
  actId: "creator-act-task-1",
});
const taskResult = await execute(harness, { projectJourney: beforeTask, authorityEnvelope: taskAuthority });
assert.equal(taskResult.progressionRevision, 2);
assert.equal(taskResult.projectJourney.currentStageId, beforeTask.currentStageId);
assert.equal(taskResult.projectJourney.currentTaskId, beforeTask.currentTaskId);
assert.equal(
  engine.getStage(taskResult.projectJourney, "story-direction").tasks.find((task) => task.id === "story-foundation").status,
  engine.constants.TASK_STATUSES.COMPLETED_FOR_NOW
);

// 5. Stage completion is completion-only and does not select the next stage.
const beforeStage = harness.getJourney();
const stageAuthority = creatorAuthority({
  action: POSITION_ACTIONS.COMPLETE_STAGE,
  target: { stageId: "story-direction" },
  revision: 2,
  actId: "creator-act-stage-2",
});
const stageResult = await execute(harness, {
  projectJourney: beforeStage,
  authorityEnvelope: stageAuthority,
  input: { milestoneMessage: "Story direction completed for now." },
});
assert.equal(stageResult.progressionRevision, 3);
assert.equal(stageResult.projectJourney.currentStageId, beforeStage.currentStageId);
assert.equal(stageResult.projectJourney.currentTaskId, beforeStage.currentTaskId);
assert.deepEqual(stageResult.projectJourney.resumePoint, beforeStage.resumePoint);
assert.equal(engine.getStage(stageResult.projectJourney, "story-direction").status, engine.constants.STAGE_STATUSES.COMPLETED_FOR_NOW);
assert.equal(engine.getStage(stageResult.projectJourney, "characters").status, engine.constants.STAGE_STATUSES.NOT_STARTED);

// 6. Movement after completion is a separate revision.
const moveAfterCompletion = creatorAuthority({
  action: POSITION_ACTIONS.SET_POSITION,
  target: { stageId: "characters", taskId: "main-characters" },
  revision: 3,
  actId: "creator-act-move-3",
});
const movedAfterCompletion = await execute(harness, {
  projectJourney: harness.getJourney(),
  authorityEnvelope: moveAfterCompletion,
});
assert.equal(movedAfterCompletion.progressionRevision, 4);
assert.equal(movedAfterCompletion.projectJourney.currentStageId, "characters");

// 7. Revisit and pause are explicit atomic operations.
const revisitAuthority = creatorAuthority({
  action: POSITION_ACTIONS.REVISIT_STAGE,
  target: { stageId: "story-direction" },
  revision: 4,
  actId: "creator-act-revisit-4",
});
const revisitResult = await execute(harness, {
  projectJourney: harness.getJourney(),
  authorityEnvelope: revisitAuthority,
  input: { reason: "I want to rethink the direction." },
});
assert.equal(revisitResult.progressionRevision, 5);
assert.equal(revisitResult.projectJourney.currentStageId, "story-direction");
assert.equal(revisitResult.projectJourney.status, engine.constants.JOURNEY_STATUSES.REVISITING);

const pauseAuthority = creatorAuthority({
  action: POSITION_ACTIONS.PAUSE_JOURNEY,
  revision: 5,
  actId: "creator-act-pause-5",
});
const pauseResult = await execute(harness, {
  projectJourney: harness.getJourney(),
  authorityEnvelope: pauseAuthority,
  input: { note: "Pause here." },
});
assert.equal(pauseResult.progressionRevision, 6);
assert.equal(pauseResult.projectJourney.status, engine.constants.JOURNEY_STATUSES.PAUSED);
assert.equal(pauseResult.projectJourney.currentStageId, revisitResult.projectJourney.currentStageId);

// 8. Failed authority-store persistence does not consume authority; retry may commit normally.
const failureHarness = createHarness(engine.createMovieJourney({ projectId }));
await failureHarness.bootstrap();
const retryAuthority = creatorAuthority({
  action: POSITION_ACTIONS.SET_POSITION,
  target: { stageId: "characters" },
  revision: 0,
  actId: "creator-act-persist-retry",
});
failureHarness.failNext();
await expectCode(() => execute(failureHarness, {
  projectJourney: failureHarness.getJourney(),
  authorityEnvelope: retryAuthority,
}), "SIMULATED_PERSISTENCE_FAILURE");
assert.equal(failureHarness.getJourney().progression, undefined);
const retrySuccess = await execute(failureHarness, {
  projectJourney: failureHarness.getJourney(),
  authorityEnvelope: retryAuthority,
});
assert.equal(retrySuccess.status, "committed");
assert.equal(retrySuccess.progressionRevision, 1);

// 9. Two operations issued against same revision cannot both become authority reality.
const raceHarness = createHarness(engine.createMovieJourney({ projectId }));
const raceA = creatorAuthority({ action: POSITION_ACTIONS.SET_POSITION, target: { stageId: "story-direction" }, revision: 0, actId: "race-a" });
const raceB = creatorAuthority({ action: POSITION_ACTIONS.SET_POSITION, target: { stageId: "characters" }, revision: 0, actId: "race-b" });
await execute(raceHarness, { projectJourney: raceHarness.getJourney(), authorityEnvelope: raceA });
await expectCode(() => execute(raceHarness, { projectJourney: legacyJourney, authorityEnvelope: raceB }), "JOURNEY_POSITION_AUTHORITY_STALE");
assert.equal(raceHarness.getJourney().progression.revision, 1);
assert.equal(raceHarness.getJourney().currentStageId, "story-direction");

// 10. Malformed progression metadata freezes progression without damaging creative content.
const malformed = engine.createMovieJourney({ projectId });
malformed.scenes.push({ id: "scene-preserve-me", title: "Creator Work" });
malformed.progression = {
  schemaVersion: 1,
  revision: 7,
  lastCommittedOperation: { operationId: "bad", authorityId: "bad", fromRevision: 4, toRevision: 5 },
  committedOperations: [],
};
const malformedInspection = inspectJourneyProgression(malformed);
assert.equal(malformedInspection.status, PROGRESSION_HEALTH.RECOVERY_REQUIRED);
const malformedAuthority = creatorAuthority({ action: POSITION_ACTIONS.SET_POSITION, target: { stageId: "characters" }, revision: 7, actId: "malformed-act" });
await expectCode(() => execute(createHarness(malformed), {
  projectJourney: malformed,
  authorityEnvelope: malformedAuthority,
}), "JOURNEY_PROGRESSION_RECOVERY_REQUIRED");
assert.equal(malformed.scenes[0].title, "Creator Work");
assert.equal(malformed.currentStageId, "idea");

// 11. Final-stage completion can complete Journey but must not invent a new position.
const finalJourney = engine.createMovieJourney({ projectId });
finalJourney.stages.forEach((stage) => {
  if (stage.id !== "publish") {
    stage.status = engine.constants.STAGE_STATUSES.COMPLETED_FOR_NOW;
    stage.tasks.forEach((task) => { task.status = engine.constants.TASK_STATUSES.COMPLETED_FOR_NOW; });
  }
});
finalJourney.currentStageId = "publish";
finalJourney.currentTaskId = "final-check";
finalJourney.resumePoint = { stageId: "publish", taskId: "final-check", sceneId: null, note: null, savedAt: finalJourney.updatedAt };
const finalHarness = createHarness(finalJourney);
const finalAuthority = creatorAuthority({ action: POSITION_ACTIONS.COMPLETE_STAGE, target: { stageId: "publish" }, revision: 0, actId: "final-stage" });
const finalResult = await execute(finalHarness, { projectJourney: finalJourney, authorityEnvelope: finalAuthority });
assert.equal(finalResult.projectJourney.status, engine.constants.JOURNEY_STATUSES.COMPLETED_FOR_NOW);
assert.equal(finalResult.projectJourney.currentStageId, "publish");
assert.equal(finalResult.projectJourney.currentTaskId, "final-check");

// 12. Receipt history remains bounded while revision continues monotonically.
const boundedHarness = createHarness(engine.createMovieJourney({ projectId }));
for (let revision = 0; revision < MAX_COMMITTED_PROGRESSION_OPERATIONS + 3; revision += 1) {
  const stageId = revision % 2 === 0 ? "story-direction" : "idea";
  const authority = creatorAuthority({
    action: POSITION_ACTIONS.SET_POSITION,
    target: { stageId },
    revision,
    actId: `bounded-${revision}`,
  });
  await execute(boundedHarness, {
    projectJourney: boundedHarness.getJourney(),
    authorityEnvelope: authority,
  });
}
const bounded = boundedHarness.getJourney();
assert.equal(bounded.progression.revision, MAX_COMMITTED_PROGRESSION_OPERATIONS + 3);
assert.equal(bounded.progression.committedOperations.length, MAX_COMMITTED_PROGRESSION_OPERATIONS);
assert.equal(bounded.progression.lastCommittedOperation.toRevision, bounded.progression.revision);

// 13. Advisory/backend signals still cannot issue executable progression authority.
await expectCode(async () => issueJourneyPositionAuthority({
  projectId,
  source: POSITION_AUTHORITY_SOURCES.MENTOR_RECOMMENDATION,
  action: POSITION_ACTIONS.SET_POSITION,
  target: { stageId: "characters" },
  expectedPositionRevision: 0,
  issuedAt: "2026-08-27T01:59:00.000Z",
  evidence: { recommendationId: "rec-do-not-execute" },
}), "JOURNEY_POSITION_ADVISORY_CANNOT_AUTHORISE");
await expectCode(async () => issueJourneyPositionAuthority({
  projectId,
  source: POSITION_AUTHORITY_SOURCES.BACKEND_MAY_ADVANCE_JOURNEY,
  action: POSITION_ACTIONS.SET_POSITION,
  target: { stageId: "characters" },
  expectedPositionRevision: 0,
  issuedAt: "2026-08-27T01:59:01.000Z",
  evidence: { mayAdvanceJourney: true },
}), "JOURNEY_POSITION_SOURCE_UNAUTHORISED");

console.log("Movie Mentor Journey Progression Execution torture: PASS");
console.log("- Journey Authority is the durable progression source and commit destination");
console.log("- movement/completion/revisit/pause preserve exact creator-authority semantics");
console.log("- duplicate retry, stale races, persistence failure and malformed progression fail safely");
console.log("- receipt history remains bounded while revision advances monotonically");
console.log("- Creator Memory projection is no longer required to advance with mechanical truth");

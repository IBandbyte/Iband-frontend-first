import assert from "node:assert/strict";
import createJourneyDurableAuthorityStore from "../src/components/studio/mentor/JourneyDurableAuthorityStore.js";
import createJourneyProgressionExecutionRuntime from "../src/components/studio/mentor/JourneyProgressionExecutionRuntime.js";
import {
  POSITION_ACTIONS,
  POSITION_AUTHORITY_SOURCES,
  issueJourneyPositionAuthority,
} from "../src/components/studio/mentor/JourneyPositionAuthorityControl.js";

function clone(value) { return JSON.parse(JSON.stringify(value)); }
function storageAdapter() {
  const map = new Map();
  return {
    getItem(key) { return map.has(key) ? map.get(key) : null; },
    setItem(key, value) { map.set(key, String(value)); },
    removeItem(key) { map.delete(key); },
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
    ],
    progression: { schemaVersion: 1, revision: 0, lastCommittedOperation: null, committedOperations: [] },
  };
}
function createMemory(projectJourney) {
  const project = {
    id: projectJourney.projectId,
    creatorType: "video",
    identity: { domain: "iband.movie-mentor.project", schema: 1, issuance: "secure-web-crypto", legacy: false },
    metadata: { creatorMode: "ai-movie", projectJourney: clone(projectJourney) },
  };
  let writeCount = 0;
  return {
    getProject: () => clone(project),
    getPersistedProject: () => clone(project),
    getProjection: () => clone(project.metadata.projectJourney),
    getWriteCount: () => writeCount,
    updateProject() { writeCount += 1; throw new Error("Creator Memory must not be the Journey authority commit destination."); },
    replaceState() { writeCount += 1; throw new Error("Creator Memory whole-state replacement must not commit Journey progression."); },
  };
}
function createJourneyEngine() {
  return {
    getStage(journey, stageId) { return journey.stages.find((stage) => stage.id === stageId) || null; },
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
function creatorAuthority(projectId, revision, actId) {
  return issueJourneyPositionAuthority({
    projectId,
    source: POSITION_AUTHORITY_SOURCES.STAGE_CLICK_UI,
    action: POSITION_ACTIONS.SET_POSITION,
    target: { stageId: "story", taskId: "premise" },
    expectedPositionRevision: revision,
    issuedAt: "2026-08-27T18:20:00.000Z",
    evidence: { creatorGesture: true, creatorActId: actId },
  });
}

const projectId = "movie-project-live-authority-write";
const legacyJourney = createJourney(projectId);
const memory = createMemory(legacyJourney);
const identityRuntime = { memory };
const storage = storageAdapter();
const authorityStore = createJourneyDurableAuthorityStore({ storage, browserRuntime: false });
const runtime = createJourneyProgressionExecutionRuntime({
  journeyEngine: createJourneyEngine(),
  identityRuntime,
  authorityStore,
});

const authority = creatorAuthority(projectId, 0, "creator-act-authority-write");
const result = await runtime.execute({
  projectId,
  projectJourney: legacyJourney,
  authorityEnvelope: authority,
  operationId: "operation-authority-write",
});
assert.equal(result.status, "committed");
assert.equal(result.authorityCommitted, true);
assert.equal(result.projected, false);
assert.equal(result.progressionRevision, 1);
assert.equal(result.authorityGeneration, 1);
assert.equal(result.projectJourney.currentStageId, "story");
assert.equal(result.projectJourney.currentTaskId, "premise");

const authorityRecord = authorityStore.read(projectId, { project: memory.getProject(projectId) });
assert.equal(authorityRecord.journey.progression.revision, 1);
assert.equal(authorityRecord.journey.currentStageId, "story");
assert.equal(authorityRecord.authority.generation, 1);
assert.equal(authorityRecord.journey.progression.committedOperations.length, 1);
assert.equal(authorityRecord.journey.progression.committedOperations[0].operationId, "operation-authority-write");

// Creator Memory projection deliberately remains N. Its staleness cannot affect authority truth.
assert.equal(memory.getProjection().progression.revision, 0);
assert.equal(memory.getProjection().currentStageId, "idea");
assert.equal(memory.getWriteCount(), 0);

// Lost-response / duplicate retry must reconcile from Journey Authority, not stale projection.
const duplicate = await runtime.execute({
  projectId,
  projectJourney: legacyJourney,
  authorityEnvelope: authority,
  operationId: "operation-authority-write",
});
assert.equal(duplicate.status, "already-committed");
assert.equal(duplicate.progressionRevision, 1);
assert.equal(duplicate.authorityGeneration, 1);
assert.equal(memory.getWriteCount(), 0);

// A different creator authority issued against stale N must die after rereading authority N+1.
const staleAuthority = creatorAuthority(projectId, 0, "creator-act-stale-after-authority");
await assert.rejects(
  runtime.execute({
    projectId,
    projectJourney: legacyJourney,
    authorityEnvelope: staleAuthority,
    operationId: "operation-stale-after-authority",
  }),
  (error) => error?.code === "JOURNEY_POSITION_AUTHORITY_STALE"
);
assert.equal(authorityStore.read(projectId, { project: memory.getProject(projectId) }).journey.progression.revision, 1);
assert.equal(memory.getProjection().progression.revision, 0);

console.log("Journey Authority live write cutover verification passed.");
console.log("- mechanical progression bootstraps legacy Journey once and commits to Journey Authority");
console.log("- Creator Memory projection is not written by the authoritative transaction");
console.log("- duplicate retry reconciles from authority receipt history");
console.log("- stale N authority cannot overwrite authoritative N+1 even while projection remains N");

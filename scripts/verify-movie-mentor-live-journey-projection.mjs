import assert from "node:assert/strict";
import createJourneyDurableAuthorityStore from "../src/components/studio/mentor/JourneyDurableAuthorityStore.js";
import createJourneyCreatorTruthProjectionExecutionRuntime from "../src/components/studio/mentor/JourneyCreatorTruthProjectionExecutionRuntime.js";
import { projectCommittedCreatorAuthorityIntoJourney } from "../src/components/studio/mentor/MovieMentorJourneyProjectionRuntime.js";

function clone(value) { return value == null ? value : JSON.parse(JSON.stringify(value)); }
function storageAdapter() {
  const map = new Map();
  return {
    getItem(key) { return map.has(key) ? map.get(key) : null; },
    setItem(key, value) { map.set(key, String(value)); },
    removeItem(key) { map.delete(key); },
  };
}
function memoryHarness(projectJourney) {
  const project = {
    id: projectJourney.projectId,
    creatorType: "video",
    identity: { domain: "iband.movie-mentor.project", schema: 1, issuance: "secure-web-crypto", legacy: false },
    metadata: { creatorMode: "ai-movie", creatorModeLabel: "AI Movie Making", projectJourney: clone(projectJourney) },
  };
  let writes = 0;
  return {
    getProject: () => clone(project),
    getPersistedProject: () => clone(project),
    getWriteCount: () => writes,
    updateProject() { writes += 1; throw new Error("Creator Memory write forbidden in live authority torture."); },
    replaceState() { writes += 1; throw new Error("Creator Memory replaceState forbidden in live authority torture."); },
  };
}

const projectId = "p-11e2-live-authority";
const position = {
  currentStageId: "story-direction",
  currentTaskId: "story-foundation",
  resumePoint: {
    stageId: "story-direction",
    taskId: "story-foundation",
    sceneId: null,
    note: "frozen",
    savedAt: "2026-08-27T00:00:00.000Z",
  },
};
const journey = {
  projectId,
  ...clone(position),
  stages: [
    { id: "story-direction", status: "active", tasks: [{ id: "story-foundation", status: "active" }] },
    { id: "characters", status: "not-started", tasks: [{ id: "main-characters", status: "not-started" }] },
  ],
  decisions: [],
  progression: { schemaVersion: 1, revision: 7, lastCommittedOperation: null, committedOperations: [] },
  metadata: {},
};
const memory = memoryHarness(journey);
const identityRuntime = { memory };
const storage = storageAdapter();
const authorityStore = createJourneyDurableAuthorityStore({ storage, browserRuntime: false });
const projectionRuntime = createJourneyCreatorTruthProjectionExecutionRuntime({ identityRuntime, authorityStore });

const authority = {
  revision: 12,
  currentCreatorTruth: [{
    authority: "creator",
    current: true,
    decisionId: "decision-route-12",
    decisionKey: "semantic.story.route",
    semanticKey: "story.route",
    value: "Zorgachu's tunnel",
    evidence: "Use Zorgachu's tunnel",
    evidenceSource: "creator-message",
    decisionIntent: "confirm",
    createdAt: "2026-08-27T00:01:00.000Z",
  }],
};

const beforeMemory = clone(memory.getProject(projectId));
const result = await projectCommittedCreatorAuthorityIntoJourney({
  identityRuntime,
  projectJourney: journey,
  projectId,
  turnResult: { postCommitCreatorAuthority: authority, mayAdvanceJourney: false },
  creatorTruthProjectionRuntime: projectionRuntime,
});
assert.equal(result.authorityCommitted, true);
assert.equal(result.authorityRevision, 12);
assert.equal(result.progressionRevision, 7);
assert.equal(result.projectJourney.metadata.authoritativeCreatorProjectionRevision, 12);
assert.equal(result.projectJourney.decisions.find((decision) => decision.id === "decision-route-12")?.value, "Zorgachu's tunnel");
assert.deepEqual({ currentStageId: result.projectJourney.currentStageId, currentTaskId: result.projectJourney.currentTaskId, resumePoint: result.projectJourney.resumePoint }, position);
assert.deepEqual(result.projectJourney.stages, journey.stages);
assert.equal(memory.getWriteCount(), 0);
assert.deepEqual(memory.getProject(projectId), beforeMemory);

const retry = await projectCommittedCreatorAuthorityIntoJourney({
  identityRuntime,
  projectJourney: result.projectJourney,
  projectId,
  turnResult: { postCommitCreatorAuthority: authority, mayAdvanceJourney: false },
  creatorTruthProjectionRuntime: projectionRuntime,
});
assert.equal(retry.status, "already-projected");
assert.equal(retry.authorityGeneration, result.authorityGeneration);
assert.equal(memory.getWriteCount(), 0);

const reloaded = createJourneyCreatorTruthProjectionExecutionRuntime({ identityRuntime, authorityStore });
const restartRetry = await reloaded.execute({ projectId, postCommitCreatorAuthority: authority });
assert.equal(restartRetry.status, "already-projected");
assert.equal(restartRetry.projectJourney.decisions.find((decision) => decision.id === "decision-route-12")?.value, "Zorgachu's tunnel");
assert.deepEqual({ currentStageId: restartRetry.projectJourney.currentStageId, currentTaskId: restartRetry.projectJourney.currentTaskId, resumePoint: restartRetry.projectJourney.resumePoint }, position);
assert.equal(memory.getWriteCount(), 0);
assert.deepEqual(memory.getProject(projectId), beforeMemory);

const noAuthority = await projectCommittedCreatorAuthorityIntoJourney({
  identityRuntime,
  projectJourney: restartRetry.projectJourney,
  projectId,
  turnResult: { postCommitCreatorAuthority: null, mayAdvanceJourney: true },
  creatorTruthProjectionRuntime: reloaded,
});
assert.equal(noAuthority.status, "no-post-commit-authority");
assert.deepEqual(noAuthority.projectJourney, restartRetry.projectJourney);
assert.equal(memory.getWriteCount(), 0);

console.log("Movie Mentor live Journey Authority projection furnace: PASS — committed creator truth projects through Journey Authority, survives authority-runtime restart, retries idempotently, preserves progression/position, and Creator Memory receives zero authoritative Journey writes.");

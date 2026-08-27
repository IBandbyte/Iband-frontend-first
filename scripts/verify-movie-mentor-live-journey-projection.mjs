import assert from "node:assert/strict";
import createCreatorMemoryEngine from "../src/components/studio/mentor/CreatorMemoryEngine.js";
import createMovieMentorStudioIdentityRuntime from "../src/components/studio/mentor/MovieMentorStudioIdentityRuntime.js";
import createJourneyDurableAuthorityStore from "../src/components/studio/mentor/JourneyDurableAuthorityStore.js";
import createJourneyCreatorTruthProjectionExecutionRuntime from "../src/components/studio/mentor/JourneyCreatorTruthProjectionExecutionRuntime.js";
import { projectCommittedCreatorAuthorityIntoJourney } from "../src/components/studio/mentor/MovieMentorJourneyProjectionRuntime.js";

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
  ...structuredClone(position),
  stages: [
    { id: "story-direction", status: "active", tasks: [{ id: "story-foundation", status: "active" }] },
    { id: "characters", status: "not-started", tasks: [{ id: "main-characters", status: "not-started" }] },
  ],
  decisions: [],
  progression: { revision: 7 },
  metadata: {},
};

const memory = createCreatorMemoryEngine({
  initialState: {
    projects: [{ id: projectId, metadata: { projectJourney: structuredClone(journey) } }],
  },
});
const identityRuntime = createMovieMentorStudioIdentityRuntime({ memory });
const authorityStore = createJourneyDurableAuthorityStore();
const projectionRuntime = createJourneyCreatorTruthProjectionExecutionRuntime({
  identityRuntime,
  authorityStore,
});

const authority = {
  revision: 12,
  currentCreatorTruth: [{
    key: "creatorDecision.semantic.story.route",
    value: "Zorgachu's tunnel",
    authority: "creator",
    confidenceSource: "creator-confirmed",
    decisionKey: "semantic.story.route",
    decisionId: "decision-route-12",
    decisionFingerprint: "fp-12",
    decisionIntent: "adoption",
    evidence: "Use Zorgachu's tunnel",
    evidenceSource: "creator-explicit-semantic",
    current: true,
    createdAt: "2026-08-27T00:01:00.000Z",
  }],
};

const beforeMemory = structuredClone(memory.getProject(projectId));
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
assert.equal(
  result.projectJourney.decisions.find((decision) => decision.metadata?.durableDecisionId === "decision-route-12")?.value,
  "Zorgachu's tunnel"
);
assert.deepEqual(
  {
    currentStageId: result.projectJourney.currentStageId,
    currentTaskId: result.projectJourney.currentTaskId,
    resumePoint: result.projectJourney.resumePoint,
  },
  position,
  "live authority projection must not move Journey position"
);
assert.deepEqual(result.projectJourney.stages, journey.stages, "live authority projection must not alter stage/task statuses");
assert.deepEqual(memory.getProject(projectId), beforeMemory, "Creator Memory must receive zero authoritative Journey writes");

const retry = await projectCommittedCreatorAuthorityIntoJourney({
  identityRuntime,
  projectJourney: result.projectJourney,
  projectId,
  turnResult: { postCommitCreatorAuthority: authority, mayAdvanceJourney: false },
  creatorTruthProjectionRuntime: projectionRuntime,
});
assert.equal(retry.status, "already-projected", "same creator-authority revision retry must be idempotent");
assert.equal(retry.authorityGeneration, result.authorityGeneration, "idempotent retry must not advance authority generation");
assert.deepEqual(memory.getProject(projectId), beforeMemory, "retry must not write authoritative Journey state into Creator Memory");

const reloaded = createJourneyCreatorTruthProjectionExecutionRuntime({ identityRuntime, authorityStore });
const restartRetry = await reloaded.execute({ projectId, postCommitCreatorAuthority: authority });
assert.equal(restartRetry.status, "already-projected", "restart must resolve committed creator truth from Journey Authority");
assert.equal(
  restartRetry.projectJourney.decisions.find((decision) => decision.metadata?.durableDecisionId === "decision-route-12")?.value,
  "Zorgachu's tunnel",
  "restart must expose durable N+1 creator truth from Journey Authority"
);
assert.deepEqual(
  {
    currentStageId: restartRetry.projectJourney.currentStageId,
    currentTaskId: restartRetry.projectJourney.currentTaskId,
    resumePoint: restartRetry.projectJourney.resumePoint,
  },
  position,
  "restart must retain frozen Journey position"
);
assert.deepEqual(memory.getProject(projectId), beforeMemory, "restart authority resolution must not restore Creator Memory sovereignty");

const noAuthority = await projectCommittedCreatorAuthorityIntoJourney({
  identityRuntime,
  projectJourney: restartRetry.projectJourney,
  projectId,
  turnResult: { postCommitCreatorAuthority: null, mayAdvanceJourney: true },
  creatorTruthProjectionRuntime: reloaded,
});
assert.equal(noAuthority.status, "no-post-commit-authority");
assert.deepEqual(noAuthority.projectJourney, restartRetry.projectJourney, "mayAdvanceJourney alone must never mutate Journey truth or position");
assert.deepEqual(memory.getProject(projectId), beforeMemory, "no-authority path must leave Creator Memory untouched");

console.log("Movie Mentor live Journey Authority projection furnace: PASS — N+1 committed creator truth projects through Journey Authority, survives authority-runtime restart, retries idempotently, preserves progression/position, and Creator Memory receives zero authoritative Journey writes.");

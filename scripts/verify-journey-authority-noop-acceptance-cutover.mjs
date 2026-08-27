import assert from "node:assert/strict";
import createJourneyDurableAuthorityStore from "../src/components/studio/mentor/JourneyDurableAuthorityStore.js";
import createJourneyRecommendationEnvelope from "../src/components/studio/mentor/JourneyRecommendationEnvelope.js";
import createJourneyRecommendationAcceptanceExecutionRuntime from "../src/components/studio/mentor/JourneyRecommendationAcceptanceExecutionRuntime.js";

function clone(value) { return JSON.parse(JSON.stringify(value)); }
function storageAdapter() {
  const map = new Map();
  return {
    getItem(key) { return map.has(key) ? map.get(key) : null; },
    setItem(key, value) { map.set(key, String(value)); },
    removeItem(key) { map.delete(key); },
  };
}
function journey(projectId) {
  return {
    projectId,
    currentStageId: "idea",
    currentTaskId: "seed",
    status: "creating",
    stages: [{ id: "idea", tasks: [{ id: "seed", status: "in-progress" }] }],
    progression: { schemaVersion: 1, revision: 0, lastCommittedOperation: null, committedOperations: [] },
  };
}
function memoryHarness(projectJourney) {
  const project = {
    id: projectJourney.projectId,
    creatorType: "video",
    identity: { domain: "iband.movie-mentor.project", schema: 1, issuance: "secure-web-crypto", legacy: false },
    metadata: { creatorMode: "ai-movie", projectJourney: clone(projectJourney) },
  };
  let writes = 0;
  return {
    getProject: () => clone(project),
    getPersistedProject: () => clone(project),
    getActiveProject: () => clone(project),
    getProjectMemories: () => [],
    getRecentConversations: () => [],
    getLatestSessionHandoff: () => null,
    getWriteCount: () => writes,
    updateProject() { writes += 1; throw new Error("Creator Memory write forbidden in no-op authority cutover torture."); },
    replaceState() { writes += 1; throw new Error("Creator Memory replaceState forbidden in no-op authority cutover torture."); },
  };
}
function fakeProgressionRuntime() {
  return { async execute() { throw new Error("No-op acceptance must not invoke Journey movement runtime."); } };
}

const projectId = "movie-project-noop-authority-cutover";
const currentJourney = journey(projectId);
const memory = memoryHarness(currentJourney);
const identityRuntime = {
  memory,
  getPreferredJourney() {
    const record = authorityStore.read(projectId, { project: memory.getProject(projectId) });
    return record
      ? { status: "authority", projectJourney: clone(record.journey), progressionRevision: record.journey.progression.revision }
      : { status: "legacy-unbootstrapped", projectJourney: clone(currentJourney), progressionRevision: 0 };
  },
};
const storage = storageAdapter();
const authorityStore = createJourneyDurableAuthorityStore({ storage, browserRuntime: false });
const runtime = createJourneyRecommendationAcceptanceExecutionRuntime({
  identityRuntime,
  progressionRuntime: fakeProgressionRuntime(),
  authorityStore,
});

const planningEvidence = {
  contractVersion: "1.1.0",
  currentStageId: "idea",
  currentTaskId: "seed",
  creatorAuthorityRevision: 7,
  recommendation: {
    recommendedStageId: "idea",
    recommendedTaskId: "seed",
  },
  clarification: { required: false, reasons: [] },
  provenance: { turnRevision: 11, bridgeVersion: "1.5.0" },
};
const recommendationEnvelope = createJourneyRecommendationEnvelope({
  projectId,
  projectJourney: currentJourney,
  planningEvidence,
  issuedAt: "2026-08-27T18:29:00.000Z",
});
assert.ok(recommendationEnvelope, "Canonical recommendation envelope must be created for no-op torture.");

const first = await runtime.execute({
  recommendationEnvelope,
  projectId,
  creatorActId: "creator-act-noop-authority",
  creatorGesture: true,
  creatorAuthorityRevision: 7,
  turnRevision: 11,
  clarificationRequired: false,
  issuedAt: "2026-08-27T18:30:00.000Z",
});
assert.equal(first.status, "accepted-no-movement-required");
assert.equal(first.progressionRevision, 0, "No-op acceptance must not move Journey revision.");
assert.equal(first.authorityGeneration, 1, "No-op acceptance must advance authority generation exactly once.");
assert.equal(first.authorityCommitted, true);
assert.equal(memory.getWriteCount(), 0, "Creator Memory must receive zero mechanical writes.");

let record = authorityStore.read(projectId, { project: memory.getProject(projectId) });
assert.equal(record.journey.progression.revision, 0);
assert.equal(record.authority.generation, 1);
assert.equal(record.recommendations.length, 1);
assert.equal(record.recommendations[0].recommendationId, recommendationEnvelope.recommendationId);
assert.equal(record.recommendations[0].lifecycle.current, false);
assert.equal(record.recommendations[0].lifecycle.terminalReason, "consumed");
assert.equal(record.recommendations[0].lifecycle.consumedWithoutMovement, true);

// Lost-response retry must reconcile from authority before freshness can mint anything new.
const retry = await runtime.execute({
  recommendationEnvelope,
  projectId,
  creatorActId: "creator-act-noop-authority",
  creatorGesture: true,
  creatorAuthorityRevision: 7,
  turnRevision: 11,
  clarificationRequired: false,
  issuedAt: "2026-08-27T18:30:01.000Z",
});
assert.equal(retry.status, "already-consumed-no-movement");
assert.equal(retry.authorityGeneration, 1);
record = authorityStore.read(projectId, { project: memory.getProject(projectId) });
assert.equal(record.authority.generation, 1, "Retry must not advance authority generation again.");
assert.equal(record.journey.progression.revision, 0);
assert.equal(memory.getWriteCount(), 0);

console.log("Journey Authority no-op acceptance cutover verification passed.");
console.log("- no-op acceptance commits N/G -> N/G+1 in Journey Authority");
console.log("- canonical recommendation is materialized and consumed atomically");
console.log("- Creator Memory receives zero mechanical lifecycle writes");
console.log("- duplicate retry returns original consumption without G+2");

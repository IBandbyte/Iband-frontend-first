import assert from "node:assert/strict";
import createJourneyDurableAuthorityStore from "../src/components/studio/mentor/JourneyDurableAuthorityStore.js";
import createJourneyCreatorTruthProjectionExecutionRuntime from "../src/components/studio/mentor/JourneyCreatorTruthProjectionExecutionRuntime.js";

function clone(value) { return value == null ? value : JSON.parse(JSON.stringify(value)); }
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
    stages: [
      { id: "idea", status: "in-progress", tasks: [{ id: "seed", status: "in-progress" }] },
      { id: "story", status: "not-started", tasks: [{ id: "premise", status: "not-started" }] },
    ],
    decisions: [],
    metadata: {},
    progression: { schemaVersion: 1, revision: 3, lastCommittedOperation: null, committedOperations: [] },
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
    updateProject() { writes += 1; throw new Error("Creator Memory write forbidden in creator-truth authority torture."); },
    replaceState() { writes += 1; throw new Error("Creator Memory replaceState forbidden in creator-truth authority torture."); },
  };
}
function authority(revision, decisionId, value) {
  return {
    revision,
    currentCreatorTruth: [{
      authority: "creator",
      current: true,
      decisionId,
      decisionKey: "semantic.movie.genre",
      semanticKey: "movie.genre",
      value,
      evidence: `Creator confirmed ${value}`,
      evidenceSource: "creator-message",
      decisionIntent: "confirm",
      createdAt: `2026-08-27T20:0${revision}:00.000Z`,
    }],
  };
}

const projectId = "movie-project-creator-truth-authority";
const legacyJourney = journey(projectId);
const memory = memoryHarness(legacyJourney);
const storage = storageAdapter();
const authorityStore = createJourneyDurableAuthorityStore({ storage, browserRuntime: false });
const identityRuntime = { memory };
const runtime = createJourneyCreatorTruthProjectionExecutionRuntime({ identityRuntime, authorityStore });

const first = await runtime.execute({
  projectId,
  postCommitCreatorAuthority: authority(1, "decision-genre-drama", "drama"),
});
assert.equal(first.progressionRevision, 3, "Creator-truth projection must not move Journey revision.");
assert.equal(first.authorityGeneration, 1, "First creator-truth projection must advance authority generation once.");
assert.equal(first.creatorAuthorityRevision, 1);
assert.equal(first.projectJourney.currentStageId, "idea");
assert.equal(first.projectJourney.currentTaskId, "seed");
assert.equal(first.projectJourney.stages[0].status, "in-progress");
assert.equal(first.projectJourney.stages[0].tasks[0].status, "in-progress");
assert.equal(first.projectJourney.metadata.authoritativeCreatorProjectionRevision, 1);
assert.equal(first.projectJourney.decisions.length, 1);
assert.equal(first.projectJourney.decisions[0].value, "drama");
assert.equal(first.projectJourney.decisions[0].status, "active");
assert.equal(memory.getWriteCount(), 0, "Creator Memory must receive zero authoritative projection writes.");

let record = authorityStore.read(projectId, { project: memory.getProject(projectId) });
assert.equal(record.authority.generation, 1);
assert.equal(record.journey.progression.revision, 3);
assert.equal(record.journey.metadata.authoritativeCreatorProjectionRevision, 1);

const retry = await runtime.execute({
  projectId,
  postCommitCreatorAuthority: authority(1, "decision-genre-drama", "drama"),
});
assert.equal(retry.status, "already-projected");
assert.equal(retry.authorityGeneration, 1, "Same creator-authority revision retry must not create G+2.");
assert.equal(memory.getWriteCount(), 0);

const second = await runtime.execute({
  projectId,
  postCommitCreatorAuthority: authority(2, "decision-genre-thriller", "thriller"),
});
assert.equal(second.progressionRevision, 3);
assert.equal(second.authorityGeneration, 2);
assert.equal(second.projectJourney.metadata.authoritativeCreatorProjectionRevision, 2);
const oldDecision = second.projectJourney.decisions.find((item) => item.id === "decision-genre-drama");
const newDecision = second.projectJourney.decisions.find((item) => item.id === "decision-genre-thriller");
assert.equal(oldDecision.status, "superseded");
assert.equal(newDecision.status, "active");
assert.equal(newDecision.value, "thriller");
assert.equal(second.projectJourney.currentStageId, "idea");
assert.equal(second.projectJourney.currentTaskId, "seed");
assert.equal(memory.getWriteCount(), 0);

await assert.rejects(
  runtime.execute({
    projectId,
    postCommitCreatorAuthority: authority(1, "decision-genre-drama", "drama"),
  }),
  (error) => error?.code === "JOURNEY_CREATOR_TRUTH_PROJECTION_STALE"
);
record = authorityStore.read(projectId, { project: memory.getProject(projectId) });
assert.equal(record.authority.generation, 2, "Stale creator authority must not mutate authority generation.");
assert.equal(record.journey.progression.revision, 3);
assert.equal(record.journey.metadata.authoritativeCreatorProjectionRevision, 2);
assert.equal(memory.getWriteCount(), 0);

console.log("Journey creator-truth authority projection verification passed.");
console.log("- committed creator truth changes canonical Journey decisions through Journey Authority");
console.log("- Journey progression revision and position/completion remain unchanged");
console.log("- authority generation advances once per new creator-authority revision");
console.log("- same revision retry is idempotent and stale older authority fails closed");
console.log("- Creator Memory receives zero authoritative Journey projection writes");

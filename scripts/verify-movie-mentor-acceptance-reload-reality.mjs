import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import createJourneyDurableAuthorityStore from "../src/components/studio/mentor/JourneyDurableAuthorityStore.js";
import createJourneyAuthorityReadFacade from "../src/components/studio/mentor/JourneyAuthorityReadFacade.js";
import createJourneyProgressionExecutionRuntime from "../src/components/studio/mentor/JourneyProgressionExecutionRuntime.js";
import createMovieMentorStudioIdentityRuntime from "../src/components/studio/mentor/MovieMentorStudioIdentityRuntime.js";
import {
  POSITION_ACTIONS,
  POSITION_AUTHORITY_SOURCES,
  issueJourneyPositionAuthority,
} from "../src/components/studio/mentor/JourneyPositionAuthorityControl.js";

const ROOT = process.cwd();
const read = (relativePath) => fs.readFileSync(path.join(ROOT, relativePath), "utf8");
const workspace = read("src/components/studio/CreatorWorkspace.jsx");
const actionSurface = read("src/components/studio/mentor/JourneyRecommendationActionSurface.js");
const acceptanceSource = read("src/components/studio/mentor/JourneyRecommendationAcceptanceExecutionRuntime.js");

function clone(value) { return value == null ? value : JSON.parse(JSON.stringify(value)); }
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
    metadata: { creatorMode: "ai-movie", creatorModeLabel: "AI Movie Making", projectJourney: clone(projectJourney) },
  };
  return {
    getActiveProject: () => clone(project),
    getPersistedProject: () => clone(project),
    getProject: () => clone(project),
    getProjectMemories: () => [],
    getRecentConversations: () => [],
    getLatestSessionHandoff: () => null,
    markSessionHandoffResumed: () => null,
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
    issuedAt: "2026-08-27T19:10:00.000Z",
    evidence: { creatorGesture: true, creatorActId: actId },
  });
}

const projectId = "movie-project-reload-authority-reality";
const staleProjection = createJourney(projectId);
const memory = createMemory(staleProjection);
const storage = storageAdapter();
const authorityStore = createJourneyDurableAuthorityStore({ storage, browserRuntime: false });

// Runtime A commits N -> N+1 exclusively to Journey Authority. Creator Memory stays N.
const progressionRuntimeA = createJourneyProgressionExecutionRuntime({
  journeyEngine: createJourneyEngine(),
  identityRuntime: { memory },
  authorityStore,
});
const operationId = "operation-reload-authority-reality";
const first = await progressionRuntimeA.execute({
  projectId,
  projectJourney: staleProjection,
  authorityEnvelope: creatorAuthority(projectId, 0, "creator-act-reload-reality"),
  operationId,
});
assert.equal(first.status, "committed");
assert.equal(first.progressionRevision, 1);
assert.equal(first.authorityGeneration, 1);
assert.equal(first.projectJourney.currentStageId, "story");
assert.equal(memory.getProject(projectId).metadata.projectJourney.progression.revision, 0, "Creator Memory must deliberately remain N before reload.");
assert.equal(memory.getProject(projectId).metadata.projectJourney.currentStageId, "idea");

// Destroy Runtime A. Runtime B is a fresh identity/read universe sharing only durable storage.
const readFacadeB = createJourneyAuthorityReadFacade({ authorityStore });
const identityRuntimeB = createMovieMentorStudioIdentityRuntime({
  memory,
  cryptoImpl: { randomUUID: () => "reload-runtime-b" },
  journeyAuthorityReadFacade: readFacadeB,
});
const activeAfterReload = identityRuntimeB.getActiveProject();
assert.equal(activeAfterReload.metadata.projectJourney.progression.revision, 1, "Fresh runtime must reconstruct authoritative N+1.");
assert.equal(activeAfterReload.metadata.projectJourney.currentStageId, "story");
assert.equal(memory.getProject(projectId).metadata.projectJourney.progression.revision, 0, "Authority read must not rewrite stale Creator Memory projection.");

const resumeAfterReload = identityRuntimeB.getResumeSnapshot();
assert.equal(resumeAfterReload.projectJourney.progression.revision, 1, "Resume must expose Journey Authority after runtime destruction.");
assert.equal(resumeAfterReload.projectJourney.currentStageId, "story");
assert.equal(resumeAfterReload.journeyAuthorityRead.status, "authority");
assert.equal(resumeAfterReload.journeyAuthorityRead.authorityGeneration, 1);
assert.equal(resumeAfterReload.journeyAuthorityRead.projectionStatus, "projection-stale");
assert.equal(resumeAfterReload.recommendationActionsBlocked, true, "Stale legacy recommendation projection must fail closed after reload.");
assert.deepEqual(resumeAfterReload.currentRecommendationReferences, []);

// Runtime C proves a duplicate creator operation cannot execute N again after another restart.
const progressionRuntimeC = createJourneyProgressionExecutionRuntime({
  journeyEngine: createJourneyEngine(),
  identityRuntime: { memory },
  authorityStore,
});
const duplicate = await progressionRuntimeC.execute({
  projectId,
  projectJourney: staleProjection,
  authorityEnvelope: creatorAuthority(projectId, 0, "creator-act-reload-reality"),
  operationId,
});
assert.equal(duplicate.status, "already-committed");
assert.equal(duplicate.progressionRevision, 1);
assert.equal(duplicate.authorityGeneration, 1);
assert.equal(duplicate.projectJourney.currentStageId, "story");
assert.equal(authorityStore.read(projectId, { project: memory.getProject(projectId) }).authority.generation, 1, "Reload retry must not create G+2.");
assert.equal(memory.getProject(projectId).metadata.projectJourney.progression.revision, 0);

// A different creator act still issued against stale N must be rejected after restart.
await assert.rejects(
  progressionRuntimeC.execute({
    projectId,
    projectJourney: staleProjection,
    authorityEnvelope: creatorAuthority(projectId, 0, "creator-act-reload-stale"),
    operationId: "operation-reload-stale-authority",
  }),
  (error) => error?.code === "JOURNEY_POSITION_AUTHORITY_STALE"
);

// UI actionability remains ephemeral: archival references never become fresh creator authority.
assert.ok(workspace.includes("const [movieJourneyPlanningEvidence, setMovieJourneyPlanningEvidence] = useState(null)"));
assert.ok(!workspace.includes("resumeSnapshot?.currentRecommendationReferences"));
assert.ok(actionSurface.includes("planningEvidence"));
assert.ok(actionSurface.includes("createJourneyRecommendationEnvelope"));
assert.ok(!actionSurface.includes("currentRecommendationReferences"));

// Lost-ACK acceptance recovery must still reconcile receipt before minting fresh creator authority.
const receiptLookup = acceptanceSource.indexOf("const existingReceipt = findCommittedAcceptanceReceipt");
const authorityMint = acceptanceSource.indexOf("const acceptance = createRecommendationAcceptanceAuthority");
assert.ok(receiptLookup >= 0 && authorityMint > receiptLookup);
assert.ok(acceptanceSource.includes('status: "already-committed"'));
assert.ok(acceptanceSource.includes("newCreatorAuthorityIssued: false"));
assert.ok(acceptanceSource.includes('return `journey-recommendation-acceptance:${id}`'));

console.log("Movie Mentor acceptance reload reality verification passed.");
console.log("- Runtime A commits N -> N+1 to Journey Authority while Creator Memory remains N");
console.log("- fresh Runtime B reconstructs authoritative N+1 from durable authority storage");
console.log("- resume/cockpit exposes authority N+1 and blocks stale legacy recommendation projection");
console.log("- fresh Runtime C reconciles duplicate operation from authority receipt without G+2");
console.log("- a different stale-N creator authority cannot execute after restart");
console.log("- archival recommendation references remain non-actionable across reload");

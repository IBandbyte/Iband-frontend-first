import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import createMovieMentorStudioIdentityRuntime from "../src/components/studio/mentor/MovieMentorStudioIdentityRuntime.js";
import createJourneyRecommendationAcceptanceExecutionRuntime from "../src/components/studio/mentor/JourneyRecommendationAcceptanceExecutionRuntime.js";

const ROOT = process.cwd();
const identitySource = fs.readFileSync(path.join(ROOT, "src/components/studio/mentor/MovieMentorStudioIdentityRuntime.js"), "utf8");
const acceptanceSource = fs.readFileSync(path.join(ROOT, "src/components/studio/mentor/JourneyRecommendationAcceptanceExecutionRuntime.js"), "utf8");

function journey(revision, { operationId = null } = {}) {
  const receipt = operationId ? {
    operationId,
    authorityId: `authority-${revision}`,
    creatorActId: `creator-act-${revision}`,
    fromRevision: Math.max(0, revision - 1),
    toRevision: revision,
  } : null;
  return {
    currentStageId: "idea",
    currentTaskId: revision >= 2 ? "authority-task" : "stale-projection-task",
    progression: {
      schemaVersion: 1,
      revision,
      lastCommittedOperation: receipt,
      committedOperations: receipt ? [receipt] : [],
    },
  };
}

const projectId = "movie-project-live-authority-read";
const staleJourney = journey(1);
const authorityJourney = journey(2);
const project = {
  id: projectId,
  creatorType: "video",
  status: "creating",
  identity: {
    domain: "iband.movie-mentor.project",
    schema: 1,
    issuance: "secure-web-crypto",
    legacy: false,
  },
  metadata: {
    creatorMode: "ai-movie",
    projectJourney: staleJourney,
  },
};
const recommendationEntry = {
  id: "memory-old-R",
  metadata: {
    recommendationReference: {
      domain: "iband.movie-mentor.journey-recommendation-reference",
      projectId,
      recommendationId: "old-R",
      lifecycle: { current: true },
    },
  },
};

const memory = {
  getActiveProject: () => structuredClone(project),
  getProject: () => structuredClone(project),
  getPersistedProject: () => structuredClone(project),
  getRecentConversations: () => [],
  getLatestSessionHandoff: () => null,
  getProjectMemories: () => [structuredClone(recommendationEntry)],
  markSessionHandoffResumed: () => null,
};
const readFacade = {
  readPreferred({ project: suppliedProject }) {
    assert.equal(suppliedProject.id, projectId);
    return Object.freeze({
      status: "authority",
      source: "journey-authority-store",
      projectId,
      projectJourney: structuredClone(authorityJourney),
      authorityGeneration: 7,
      progressionRevision: 2,
      projectionStatus: "projection-stale",
      mechanicalAuthority: true,
      bootstrapRequiredBeforeMechanicalWrite: false,
    });
  },
};
const cryptoImpl = { randomUUID: () => "00000000-0000-4000-8000-000000000001" };
const identityRuntime = createMovieMentorStudioIdentityRuntime({
  memory,
  cryptoImpl,
  journeyAuthorityReadFacade: readFacade,
});

const snapshot = identityRuntime.getResumeSnapshot();
assert.equal(snapshot.projectJourney.progression.revision, 2, "Resume must restore authority revision, not stale Creator Memory projection.");
assert.equal(snapshot.projectJourney.currentTaskId, "authority-task");
assert.equal(snapshot.journeyAuthorityRead.source, "journey-authority-store");
assert.equal(snapshot.journeyAuthorityRead.projectionStatus, "projection-stale");
assert.equal(snapshot.recommendationActionsBlocked, true, "Legacy recommendation actions must be blocked while projection diverges from authority.");
assert.deepEqual(snapshot.currentRecommendationReferences, [], "Stale recommendation references must not be exposed during divergent authority resume.");
assert.equal(snapshot.recommendationRecovery.status, "authority-projection-divergence");

// Acceptance retry must also prefer authority. Creator Memory projection has no
// receipt, while authority contains the exact already-committed acceptance receipt.
const recommendationId = "R-authority-committed";
const operationId = `journey-recommendation-acceptance:${recommendationId}`;
const acceptedAuthorityJourney = journey(2, { operationId });
let progressionCalls = 0;
const acceptanceIdentityRuntime = {
  memory: {
    getProject: () => ({ ...structuredClone(project), metadata: { ...project.metadata, projectJourney: staleJourney } }),
  },
  getPreferredJourney: () => ({
    status: "authority",
    source: "journey-authority-store",
    projectJourney: structuredClone(acceptedAuthorityJourney),
    progressionRevision: 2,
    mechanicalAuthority: true,
  }),
};
const acceptanceRuntime = createJourneyRecommendationAcceptanceExecutionRuntime({
  identityRuntime: acceptanceIdentityRuntime,
  progressionRuntime: {
    async execute() {
      progressionCalls += 1;
      throw new Error("Progression must not run for an authority-proven duplicate acceptance.");
    },
  },
});
const acceptanceResult = await acceptanceRuntime.execute({
  recommendationEnvelope: { recommendationId },
  projectId,
  creatorActId: "retry-act",
  creatorGesture: true,
});
assert.equal(acceptanceResult.status, "already-committed");
assert.equal(acceptanceResult.operationId, operationId);
assert.equal(acceptanceResult.projectJourney.progression.revision, 2);
assert.equal(progressionCalls, 0);

assert.ok(identitySource.includes('import createJourneyAuthorityReadFacade from "./JourneyAuthorityReadFacade.js";'));
assert.ok(identitySource.includes("function getPreferredJourney(projectId"));
assert.ok(identitySource.includes('status: "authority-projection-divergence"'));
assert.ok(acceptanceSource.includes('typeof identityRuntime?.getPreferredJourney === "function"'));

console.log("Live Journey authority read cutover verification passed.");
console.log("- Studio resume restores authority Journey over stale Creator Memory projection");
console.log("- divergent legacy recommendation references are hidden and recovery is blocked fail-closed");
console.log("- recommendation acceptance duplicate recovery reads authority receipt first");
console.log("- stale projection cannot trigger duplicate progression");

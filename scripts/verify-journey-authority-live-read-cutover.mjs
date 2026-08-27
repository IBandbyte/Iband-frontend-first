import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import createMovieMentorStudioIdentityRuntime from "../src/components/studio/mentor/MovieMentorStudioIdentityRuntime.js";

const ROOT = process.cwd();
const identitySource = fs.readFileSync(path.join(ROOT, "src/components/studio/mentor/MovieMentorStudioIdentityRuntime.js"), "utf8");
const acceptanceSource = fs.readFileSync(path.join(ROOT, "src/components/studio/mentor/JourneyRecommendationAcceptanceExecutionRuntime.js"), "utf8");
const workspaceSource = fs.readFileSync(path.join(ROOT, "src/components/studio/CreatorWorkspace.jsx"), "utf8");

function clone(value) { return value == null ? value : JSON.parse(JSON.stringify(value)); }
function journey(revision, taskId) {
  return {
    creatorJourney: "guide",
    currentStageId: "idea",
    currentTaskId: taskId,
    progression: { schemaVersion: 1, revision, lastCommittedOperation: null, committedOperations: [] },
  };
}

function createMemory(projectedJourney) {
  const project = {
    id: "movie-project-live-read-cutover",
    creatorType: "video",
    identity: { domain: "iband.movie-mentor.project", schema: 1, issuance: "secure-web-crypto", legacy: false },
    metadata: { creatorMode: "ai-movie", creatorModeLabel: "AI Movie Making", projectJourney: clone(projectedJourney) },
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

function authorityFacade(authorityJourney, projectionStatus) {
  return {
    readPreferred({ project }) {
      return Object.freeze({
        status: "authority",
        source: "journey-authority-store",
        projectId: project.id,
        projectJourney: clone(authorityJourney),
        authorityGeneration: 8,
        progressionRevision: authorityJourney.progression.revision,
        projectionStatus,
        mechanicalAuthority: true,
        bootstrapRequiredBeforeMechanicalWrite: false,
      });
    },
  };
}

// Authority N+1 / Creator Memory N: cockpit restores authority and legacy recommendation actions fail closed.
{
  const projected = journey(4, "stale-projection");
  const authoritative = journey(5, "authority-wins");
  const runtime = createMovieMentorStudioIdentityRuntime({
    memory: createMemory(projected),
    cryptoImpl: { randomUUID: () => "live-read-session-a" },
    journeyAuthorityReadFacade: authorityFacade(authoritative, "projection-stale"),
  });
  const snapshot = runtime.getResumeSnapshot();
  assert.equal(snapshot.projectJourney.currentTaskId, "authority-wins");
  assert.equal(snapshot.projectJourney.progression.revision, 5);
  assert.equal(snapshot.recommendationActionsBlocked, true);
  assert.equal(snapshot.recommendationRecovery.status, "authority-projection-divergence");
  assert.deepEqual(snapshot.currentRecommendationReferences, []);
}

// Authority N / projection N+1: apparently newer projection remains untrusted.
{
  const projected = journey(6, "projection-claims-future");
  const authoritative = journey(5, "authority-still-wins");
  const runtime = createMovieMentorStudioIdentityRuntime({
    memory: createMemory(projected),
    cryptoImpl: { randomUUID: () => "live-read-session-b" },
    journeyAuthorityReadFacade: authorityFacade(authoritative, "projection-ahead-untrusted"),
  });
  const snapshot = runtime.getResumeSnapshot();
  assert.equal(snapshot.projectJourney.currentTaskId, "authority-still-wins");
  assert.equal(snapshot.projectJourney.progression.revision, 5);
  assert.equal(snapshot.recommendationActionsBlocked, true);
}

// Same revision/different payload is still divergence, never equality-by-number.
{
  const projected = journey(5, "zorg-version");
  const authoritative = journey(5, "canonical-version");
  const runtime = createMovieMentorStudioIdentityRuntime({
    memory: createMemory(projected),
    cryptoImpl: { randomUUID: () => "live-read-session-c" },
    journeyAuthorityReadFacade: authorityFacade(authoritative, "split-brain-same-revision"),
  });
  const snapshot = runtime.getResumeSnapshot();
  assert.equal(snapshot.projectJourney.currentTaskId, "canonical-version");
  assert.equal(snapshot.recommendationActionsBlocked, true);
}

assert.ok(identitySource.includes("getPreferredJourney"), "Identity runtime must expose authority-first Journey reads.");
assert.ok(identitySource.includes("preferredBeforeRecovery"), "Resume must resolve authority before legacy recommendation recovery.");
assert.ok(identitySource.includes("authority-projection-divergence"), "Divergent projection must block legacy recommendation recovery.");
assert.ok(identitySource.includes("projectJourney: preferredAfterRecovery?.projectJourney"), "Resume snapshot must expose preferred authority Journey.");
assert.ok(acceptanceSource.includes('typeof identityRuntime?.getPreferredJourney === "function"'), "Recommendation acceptance must prefer authority Journey.");
assert.ok(!workspaceSource.includes("const nextJourney = existing?.metadata?.projectJourney || createMovieJourney"), "AI Movie re-entry must not directly restore Creator Memory Journey projection.");
assert.ok(workspaceSource.includes("identityRuntime.getPreferredJourney(existing.id)"), "AI Movie re-entry must route Journey restoration through authority-first read facade.");

console.log("Journey authority live read cutover verification passed.");
console.log("- resume restores authority over stale, ahead, or split-brain Creator Memory projection");
console.log("- divergent legacy recommendation recovery fails closed without authority writes");
console.log("- recommendation acceptance prefers authority Journey");
console.log("- AI Movie re-entry no longer directly restores project.metadata.projectJourney");

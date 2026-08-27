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
  let updateCount = 0;
  return {
    getActiveProject: () => clone(project),
    getPersistedProject: () => clone(project),
    getProject: () => clone(project),
    updateProject: () => { updateCount += 1; return clone(project); },
    getUpdateCount: () => updateCount,
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

for (const [projected, authoritative, projectionStatus, expectedTask] of [
  [journey(4, "stale-projection"), journey(5, "authority-wins"), "projection-stale", "authority-wins"],
  [journey(6, "projection-claims-future"), journey(5, "authority-still-wins"), "projection-ahead-untrusted", "authority-still-wins"],
  [journey(5, "zorg-version"), journey(5, "canonical-version"), "split-brain-same-revision", "canonical-version"],
]) {
  const memory = createMemory(projected);
  const runtime = createMovieMentorStudioIdentityRuntime({
    memory,
    cryptoImpl: { randomUUID: () => `live-read-${expectedTask}` },
    journeyAuthorityReadFacade: authorityFacade(authoritative, projectionStatus),
  });

  // Resume must expose Journey Authority regardless of projection revision claims.
  const snapshot = runtime.getResumeSnapshot();
  assert.equal(snapshot.projectJourney.currentTaskId, expectedTask);
  assert.equal(snapshot.projectJourney.progression.revision, authoritative.progression.revision);
  assert.equal(snapshot.recommendationActionsBlocked, true);
  assert.equal(snapshot.recommendationRecovery.status, "authority-projection-divergence");
  assert.deepEqual(snapshot.currentRecommendationReferences, []);

  // Manual Workspace re-entry already consumes getActiveProject(). That runtime API
  // must therefore present a canonical read view whose projectJourney is authority-
  // selected without mutating the underlying Creator Memory project.
  const activeView = runtime.getActiveProject();
  assert.equal(activeView.metadata.projectJourney.currentTaskId, expectedTask);
  assert.equal(activeView.metadata.projectJourney.progression.revision, authoritative.progression.revision);

  // Workspace currently mirrors nextJourney through persistJourney() on re-entry.
  // If nextJourney is already the exact authoritative Journey, that redundant mirror
  // must be a no-op so a stale Creator Memory whole-state write cannot be triggered.
  runtime.persistJourney(activeView.id, activeView.metadata.projectJourney);
  assert.equal(memory.getUpdateCount(), 0, "Authority-identical re-entry mirror must not write Creator Memory.");
}

assert.ok(identitySource.includes("getActiveMemoryProject"), "Raw Creator Memory project access must remain distinct from the canonical active-project read view.");
assert.ok(identitySource.includes("preferredProjectJourney"), "Active project view must overlay only the authority-selected Journey.");
assert.ok(identitySource.includes('preferred?.status === "authority" && sameSemanticValue'), "Authority-identical legacy projection writes must be suppressed.");
assert.ok(identitySource.includes("getPreferredJourney"), "Identity runtime must expose authority-first Journey reads.");
assert.ok(identitySource.includes("preferredBeforeRecovery"), "Resume must resolve authority before legacy recommendation recovery.");
assert.ok(identitySource.includes("authority-projection-divergence"), "Divergent projection must block legacy recommendation recovery.");
assert.ok(identitySource.includes("projectJourney: preferredAfterRecovery?.projectJourney"), "Resume snapshot must expose preferred authority Journey.");
assert.ok(acceptanceSource.includes('typeof identityRuntime?.getPreferredJourney === "function"'), "Recommendation acceptance must prefer authority Journey.");
assert.ok(workspaceSource.includes("const existing = identityRuntime.getActiveProject();"), "Workspace re-entry must consume the certified identity-runtime active-project view.");
assert.ok(workspaceSource.includes("const nextJourney = existing?.metadata?.projectJourney || createMovieJourney"), "Existing Workspace shape remains stable while identity runtime removes the stale projection tunnel.");

console.log("Journey authority live read cutover verification passed.");
console.log("- resume restores authority over stale, ahead, or split-brain Creator Memory projection");
console.log("- divergent legacy recommendation recovery fails closed without authority writes");
console.log("- recommendation acceptance prefers authority Journey");
console.log("- manual AI Movie re-entry receives authority Journey through the identity-runtime compatibility view");
console.log("- authority-identical re-entry mirror writes are suppressed before Creator Memory persistence");

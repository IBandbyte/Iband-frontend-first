import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import createMovieMentorStudioIdentityRuntime from "../src/components/studio/mentor/MovieMentorStudioIdentityRuntime.js";

const ROOT = process.cwd();
const identitySource = fs.readFileSync(path.join(ROOT, "src/components/studio/mentor/MovieMentorStudioIdentityRuntime.js"), "utf8");
const acceptanceSource = fs.readFileSync(path.join(ROOT, "src/components/studio/mentor/JourneyRecommendationAcceptanceExecutionRuntime.js"), "utf8");

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

for (const [projected, authoritative, projectionStatus, expectedTask] of [
  [journey(4, "stale-projection"), journey(5, "authority-wins"), "projection-stale", "authority-wins"],
  [journey(6, "projection-claims-future"), journey(5, "authority-still-wins"), "projection-ahead-untrusted", "authority-still-wins"],
  [journey(5, "zorg-version"), journey(5, "canonical-version"), "split-brain-same-revision", "canonical-version"],
]) {
  const runtime = createMovieMentorStudioIdentityRuntime({
    memory: createMemory(projected),
    cryptoImpl: { randomUUID: () => `live-read-${expectedTask}` },
    journeyAuthorityReadFacade: authorityFacade(authoritative, projectionStatus),
  });
  const snapshot = runtime.getResumeSnapshot();
  assert.equal(snapshot.projectJourney.currentTaskId, expectedTask);
  assert.equal(snapshot.projectJourney.progression.revision, authoritative.progression.revision);
  assert.equal(snapshot.recommendationActionsBlocked, true);
  assert.equal(snapshot.recommendationRecovery.status, "authority-projection-divergence");
  assert.deepEqual(snapshot.currentRecommendationReferences, []);
}

assert.ok(identitySource.includes("getPreferredJourney"), "Identity runtime must expose authority-first Journey reads.");
assert.ok(identitySource.includes("preferredBeforeRecovery"), "Resume must resolve authority before legacy recommendation recovery.");
assert.ok(identitySource.includes("authority-projection-divergence"), "Divergent projection must block legacy recommendation recovery.");
assert.ok(identitySource.includes("projectJourney: preferredAfterRecovery?.projectJourney"), "Resume snapshot must expose preferred authority Journey.");
assert.ok(acceptanceSource.includes('typeof identityRuntime?.getPreferredJourney === "function"'), "Recommendation acceptance must prefer authority Journey.");

console.log("Journey authority live read cutover verification passed.");
console.log("- resume restores authority over stale, ahead, or split-brain Creator Memory projection");
console.log("- divergent legacy recommendation recovery fails closed without authority writes");
console.log("- recommendation acceptance prefers authority Journey");
console.log("- CreatorWorkspace direct re-entry restoration remains quarantined for the next cutover strike");

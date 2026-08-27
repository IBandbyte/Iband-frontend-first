import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import createMovieMentorStudioIdentityRuntime from "../src/components/studio/mentor/MovieMentorStudioIdentityRuntime.js";

const ROOT = process.cwd();
const identitySource = fs.readFileSync(path.join(ROOT, "src/components/studio/mentor/MovieMentorStudioIdentityRuntime.js"), "utf8");
const resumeSource = fs.readFileSync(path.join(ROOT, "src/components/studio/mentor/JourneyRecommendationResumeRecovery.js"), "utf8");
const quarantineSource = fs.readFileSync(path.join(ROOT, "src/components/studio/mentor/JourneyRecommendationRecoveryConflictQuarantine.js"), "utf8");
const failures = [];
const check = (condition, message) => { if (!condition) failures.push(message); };

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function recommendationEntry(reference) {
  return {
    id: `memory:${reference.recommendationId}`,
    projectId: reference.projectId,
    metadata: { recommendationReference: clone(reference) },
  };
}

function createJourney({ recommendationId, fingerprint, receiptFingerprint = fingerprint } = {}) {
  return {
    projectId: "movie-project-resume-recovery",
    currentStageId: "character-foundations",
    currentTaskId: "protagonist",
    progression: {
      schemaVersion: 1,
      revision: 1,
      lastCommittedOperation: {
        operationId: `journey-recommendation-acceptance:${recommendationId}`,
        authorityId: "authority-1",
        creatorActId: "creator-act-1",
        fromRevision: 0,
        toRevision: 1,
        recommendation: {
          recommendationId,
          fingerprint: receiptFingerprint,
          disposition: "consumed",
          issuedAgainstProgressionRevision: 0,
        },
      },
      committedOperations: [{
        operationId: `journey-recommendation-acceptance:${recommendationId}`,
        authorityId: "authority-1",
        creatorActId: "creator-act-1",
        fromRevision: 0,
        toRevision: 1,
        recommendation: {
          recommendationId,
          fingerprint: receiptFingerprint,
          disposition: "consumed",
          issuedAgainstProgressionRevision: 0,
        },
      }],
    },
  };
}

function createReference({ recommendationId, fingerprint } = {}) {
  return {
    domain: "iband.movie-mentor.journey-recommendation-reference",
    schema: 2,
    recommendationId,
    recommendationFingerprint: fingerprint,
    projectId: "movie-project-resume-recovery",
    issuedAgainst: {
      progressionRevision: 0,
      currentStageId: "story-direction",
      currentTaskId: "premise",
      creatorAuthorityRevision: 9,
      turnRevision: 8,
    },
    target: { stageId: "character-foundations", taskId: "protagonist" },
    lifecycle: { current: true, terminalReason: null },
  };
}

function createMemory({ journey, reference, beforeLatestRead = null } = {}) {
  let state = {
    projects: [{
      id: "movie-project-resume-recovery",
      creatorType: "video",
      metadata: { creatorMode: "ai-movie", creatorModeLabel: "AI Movie Making", projectJourney: clone(journey) },
    }],
    projectMemories: [recommendationEntry(reference)],
    conversations: [],
    sessionHandoffs: [],
  };
  let getStateCalls = 0;

  const memory = {
    getActiveProject() { return clone(state.projects[0] || null); },
    getProject(projectId) { return clone(state.projects.find((project) => project.id === projectId) || null); },
    getState() {
      getStateCalls += 1;
      if (typeof beforeLatestRead === "function") {
        const next = beforeLatestRead({ state: clone(state), getStateCalls });
        if (next) state = clone(next);
      }
      return clone(state);
    },
    replaceState(nextState) { state = clone(nextState); return clone(state); },
    getProjectMemories({ projectId } = {}) { return clone(state.projectMemories.filter((entry) => entry.projectId === projectId)); },
    getRecentConversations() { return []; },
    getLatestSessionHandoff() { return null; },
    markSessionHandoffResumed() { return null; },
    saveProject() { throw new Error("not expected"); },
    updateProject() { throw new Error("not expected"); },
    saveProjectMemory() { throw new Error("not expected"); },
    rememberConversation() { throw new Error("not expected"); },
    saveSessionHandoff() { throw new Error("not expected"); },
  };

  return { memory, inspect: () => clone(state) };
}

function createRuntime(memory) {
  return createMovieMentorStudioIdentityRuntime({
    memory,
    cryptoImpl: { randomUUID: () => "resume-recovery-session" },
  });
}

const recommendationId = "journey-recommendation:resume-proof";
const fingerprint = "resume-proof-fingerprint";

{
  const journey = createJourney({ recommendationId, fingerprint });
  const reference = createReference({ recommendationId, fingerprint });
  const { memory, inspect } = createMemory({ journey, reference });
  const runtime = createRuntime(memory);
  const snapshot = runtime.getResumeSnapshot();
  const persisted = inspect();
  const persistedReference = persisted.projectMemories[0].metadata.recommendationReference;

  assert.equal(snapshot.recommendationActionsBlocked, false);
  assert.equal(snapshot.recommendationRecovery.status, "repaired");
  assert.equal(snapshot.currentRecommendationReferences.length, 0);
  assert.equal(persistedReference.lifecycle.current, false);
  assert.equal(persistedReference.lifecycle.terminalReason, "consumed");
  assert.deepEqual(snapshot.projectJourney, journey, "Recovery must not alter durable Journey reality.");
}

{
  const journey = createJourney({ recommendationId, fingerprint, receiptFingerprint: "forged-fingerprint" });
  const reference = createReference({ recommendationId, fingerprint });
  const { memory, inspect } = createMemory({ journey, reference });
  const runtime = createRuntime(memory);
  const snapshot = runtime.getResumeSnapshot();
  const persisted = inspect();
  const persistedReference = persisted.projectMemories[0].metadata.recommendationReference;

  assert.equal(snapshot.recommendationActionsBlocked, false);
  assert.equal(snapshot.recommendationRecovery.status, "proof-conflict-quarantined");
  assert.equal(snapshot.recommendationRecovery.recoveryAttempts, 2);
  assert.deepEqual(snapshot.currentRecommendationReferences, []);
  assert.equal(persistedReference.lifecycle.current, false);
  assert.equal(persistedReference.lifecycle.terminalReason, "proof-conflict-quarantined");
  assert.equal(persistedReference.lifecycle.recoveryConflict.proof.reason, "fingerprint-mismatch");
  assert.deepEqual(snapshot.projectJourney, journey, "Proof-conflict quarantine must preserve authoritative Journey reality.");
}

{
  const journey = createJourney({ recommendationId, fingerprint });
  const reference = createReference({ recommendationId, fingerprint });
  let externalRepairApplied = false;
  const { memory } = createMemory({
    journey,
    reference,
    beforeLatestRead: ({ state, getStateCalls }) => {
      if (!externalRepairApplied && getStateCalls === 2) {
        externalRepairApplied = true;
        const next = clone(state);
        const lifecycle = next.projectMemories[0].metadata.recommendationReference.lifecycle;
        next.projectMemories[0].metadata.recommendationReference.lifecycle = {
          ...lifecycle,
          current: false,
          terminalReason: "consumed",
          consumedByOperationId: `journey-recommendation-acceptance:${recommendationId}`,
          consumedByCreatorActId: "creator-act-1",
          consumedAtProgressionRevision: 1,
        };
        return next;
      }
      return null;
    },
  });
  const runtime = createRuntime(memory);
  const snapshot = runtime.getResumeSnapshot();

  assert.equal(snapshot.recommendationActionsBlocked, false);
  assert.equal(snapshot.recommendationRecovery.status, "certified");
  assert.equal(snapshot.recommendationRecovery.recoveryAttempts, 2);
  assert.deepEqual(snapshot.currentRecommendationReferences, []);
}

const recoveryCall = identitySource.indexOf("certifyJourneyRecommendationResume({");
const recommendationExposure = identitySource.indexOf("currentRecommendationReferences:", recoveryCall);
check(recoveryCall >= 0, "Studio identity resume must invoke recommendation lifecycle recovery.");
check(recommendationExposure > recoveryCall, "Recommendation references must only be exposed after recovery invocation.");
check(identitySource.includes("const project = memory.getProject?.(initiallyActiveProject.id)"), "Resume must re-read the durable project after recovery.");
check(identitySource.includes("recommendationActionsBlocked ? [] : getCurrentRecommendationReferences(project.id)"), "Blocked recovery must expose zero current recommendation references.");
check(resumeSource.includes("quarantineJourneyRecommendationRecoveryConflicts"), "Proof conflicts must route through dedicated metadata-only quarantine.");
check(resumeSource.includes("executeJourneyRecommendationLifecycleRecovery({ identityRuntime, projectId: pid })") && resumeSource.includes("successResult(") && resumeSource.includes("      2\n    );"), "Resume recovery must permit at most one bounded convergence retry.");
check(!quarantineSource.includes("CreatorJourneyEngine"), "Proof-conflict quarantine must not import CreatorJourneyEngine.");
check(!quarantineSource.includes("JourneyPositionAuthorityControl"), "Proof-conflict quarantine must not import Position Authority.");
check(!quarantineSource.includes("JourneyProgressionExecutionRuntime"), "Proof-conflict quarantine must not import progression execution.");
check(quarantineSource.includes("terminalReason: \"proof-conflict-quarantined\""), "Proof conflicts must preserve a distinct durable terminal lifecycle reason.");
check(quarantineSource.includes("JOURNEY_RECOMMENDATION_CONFLICT_QUARANTINE_AUTHORITY_VIOLATION"), "Quarantine must explicitly guard against Journey mutation.");

if (failures.length) {
  console.error("Movie Mentor resume recovery integration verification failed:\n");
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log("Movie Mentor resume recovery integration verification passed.");
console.log("- recovery runs before recommendation exposure");
console.log("- exact receipt lineage is repaired before resume snapshot creation");
console.log("- contradictory proof is quarantined without invented history");
console.log("- simultaneous recovery converges with one bounded retry");
console.log("- resume rereads durable project reality after recovery");

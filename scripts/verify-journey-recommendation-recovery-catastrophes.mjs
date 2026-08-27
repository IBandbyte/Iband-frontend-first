import assert from "node:assert/strict";
import {
  validateConsumptionReceiptProof,
  executeJourneyRecommendationLifecycleRecovery,
} from "../src/components/studio/mentor/JourneyRecommendationLifecycleRecovery.js";

const DOMAIN = "iband.movie-mentor.journey-recommendation-reference";
const clone = (value) => JSON.parse(JSON.stringify(value));
const reference = {
  domain: DOMAIN, projectId: "p", recommendationId: "r", recommendationFingerprint: "fp-r",
  issuedAgainst: { progressionRevision: 9, currentStageId: "s1", currentTaskId: "t1" },
  target: { stageId: "s2", taskId: "t2" }, lifecycle: { current: true },
};
const receipt = {
  operationId: "op", authorityId: "auth", creatorActId: "act", fromRevision: 9, toRevision: 10,
  recommendation: { recommendationId: "r", fingerprint: "fp-r", disposition: "consumed", issuedAgainstProgressionRevision: 9 },
};

assert.equal(validateConsumptionReceiptProof(reference, receipt).valid, true);
for (const mutate of [
  (r) => { r.recommendation.disposition = "invalidated"; },
  (r) => { r.recommendation.fingerprint = "forged"; },
  (r) => { r.recommendation.issuedAgainstProgressionRevision = 8; },
  (r) => { r.fromRevision = 8; },
  (r) => { r.toRevision = 11; },
  (r) => { r.creatorActId = ""; },
]) {
  const bad = clone(receipt); mutate(bad);
  assert.equal(validateConsumptionReceiptProof(reference, bad).valid, false);
}

function createMemory(receipts) {
  let state = {
    projects: [{ id: "p", identity: { id: "immutable" }, metadata: { projectJourney: {
      projectId: "p", currentStageId: "s2", currentTaskId: "t2",
      progression: { schemaVersion: 1, revision: 10, lastCommittedOperation: receipts.at(-1) || null, committedOperations: receipts },
    } } }],
    projectMemories: [{ id: "m", metadata: { recommendationReference: clone(reference) } }],
  };
  return {
    getState: () => clone(state),
    replaceState: (next) => { state = clone(next); },
    getProject: (id) => clone(state.projects.find((p) => p.id === id) || null),
    inspect: () => clone(state),
  };
}

// A receipt that merely names R but contradicts its fingerprint is not permission to guess.
{
  const forged = clone(receipt); forged.recommendation.fingerprint = "wrong";
  const memory = createMemory([forged]);
  const before = memory.inspect();
  assert.throws(() => executeJourneyRecommendationLifecycleRecovery({ identityRuntime: { memory }, projectId: "p" }),
    (error) => error.code === "JOURNEY_RECOMMENDATION_RECOVERY_PROOF_CONFLICT");
  assert.deepEqual(memory.inspect(), before);
}

// Truncated receipt history cannot prove consumption. Conservative repair is invalidated, not consumed.
{
  const memory = createMemory([]);
  const result = executeJourneyRecommendationLifecycleRecovery({ identityRuntime: { memory }, projectId: "p" });
  assert.equal(result.status, "repaired");
  assert.equal(memory.inspect().projectMemories[0].metadata.recommendationReference.lifecycle.terminalReason, "invalidated-by-progression");
}

// Commit-then-ACK-loss: first call throws after the state replacement; retry must observe terminal history and write nothing new.
{
  const base = createMemory([receipt]);
  let state = base.inspect();
  let firstWrite = true;
  const memory = {
    getState: () => clone(state),
    replaceState: (next) => {
      state = clone(next);
      if (firstWrite) { firstWrite = false; throw Object.assign(new Error("ack-lost"), { code: "SIMULATED_ACK_LOSS" }); }
    },
    getProject: (id) => clone(state.projects.find((p) => p.id === id) || null),
  };
  assert.throws(() => executeJourneyRecommendationLifecycleRecovery({ identityRuntime: { memory }, projectId: "p" }), /ack-lost/);
  assert.equal(state.projectMemories[0].metadata.recommendationReference.lifecycle.terminalReason, "consumed");
  const snapshot = clone(state);
  const retry = executeJourneyRecommendationLifecycleRecovery({ identityRuntime: { memory }, projectId: "p" });
  assert.equal(retry.status, "no-repair-required");
  assert.deepEqual(state, snapshot);
}

console.log("Journey recommendation recovery catastrophe verification passed.");
console.log("- forged receipt lineage cannot prove consumption");
console.log("- truncated history degrades conservatively to invalidated");
console.log("- commit-then-ACK-loss retry is idempotent");
console.log("- recovery remains metadata-only and fail-closed");

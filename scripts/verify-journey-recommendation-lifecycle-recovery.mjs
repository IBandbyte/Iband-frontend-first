import assert from "node:assert/strict";
import { executeJourneyRecommendationLifecycleRecovery } from "../src/components/studio/mentor/JourneyRecommendationLifecycleRecovery.js";

const DOMAIN = "iband.movie-mentor.journey-recommendation-reference";
const clone = (value) => JSON.parse(JSON.stringify(value));

function ref({ id, issued = 4, current = true, domain = DOMAIN }) {
  return {
    domain,
    projectId: "p1",
    recommendationId: id,
    recommendationFingerprint: `fp-${id}`,
    issuedAgainst: { progressionRevision: issued, currentStageId: "s1", currentTaskId: "t1" },
    target: { stageId: "s2", taskId: "t2" },
    lifecycle: { current },
  };
}

function memoryFor({ revision = 5, references = [], receipts = [] } = {}) {
  let state = {
    projects: [{ id: "p1", identity: { projectId: "p1", immutable: true }, metadata: { projectJourney: {
      projectId: "p1", currentStageId: "s2", currentTaskId: "t2",
      progression: { revision, committedOperations: receipts },
    } } }],
    projectMemories: references.map((reference, index) => ({ id: `m${index}`, metadata: { recommendationReference: reference } })),
  };
  return {
    getState: () => clone(state),
    replaceState: (next) => { state = clone(next); },
    getProject: (id) => clone(state.projects.find((project) => project.id === id) || null),
    inspect: () => clone(state),
  };
}

const receipt = {
  operationId: "op-r1", creatorActId: "act-r1", previousProgressionRevision: 4, nextProgressionRevision: 5,
  recommendation: { recommendationId: "r1", fingerprint: "fp-r1", disposition: "consumed", issuedAgainstProgressionRevision: 4 },
};

// Exact receipt lineage repairs consumed.
{
  const memory = memoryFor({ references: [ref({ id: "r1" })], receipts: [receipt] });
  const beforeJourney = memory.inspect().projects[0].metadata.projectJourney;
  const result = executeJourneyRecommendationLifecycleRecovery({ identityRuntime: { memory }, projectId: "p1" });
  assert.equal(result.status, "repaired");
  assert.equal(result.journeyMutated, false);
  const after = memory.inspect();
  assert.deepEqual(after.projects[0].metadata.projectJourney, beforeJourney);
  const lifecycle = after.projectMemories[0].metadata.recommendationReference.lifecycle;
  assert.equal(lifecycle.terminalReason, "consumed");
  assert.equal(lifecycle.consumedByOperationId, "op-r1");
  assert.equal(lifecycle.consumedByCreatorActId, "act-r1");
}

// Journey advanced without exact receipt lineage => invalidated, never guessed consumed.
{
  const memory = memoryFor({ references: [ref({ id: "r2" })], receipts: [receipt] });
  executeJourneyRecommendationLifecycleRecovery({ identityRuntime: { memory }, projectId: "p1" });
  assert.equal(memory.inspect().projectMemories[0].metadata.recommendationReference.lifecycle.terminalReason, "invalidated-by-progression");
}

// Repeated recovery is idempotent.
{
  const memory = memoryFor({ references: [ref({ id: "r1" })], receipts: [receipt] });
  executeJourneyRecommendationLifecycleRecovery({ identityRuntime: { memory }, projectId: "p1" });
  const once = memory.inspect();
  const twice = executeJourneyRecommendationLifecycleRecovery({ identityRuntime: { memory }, projectId: "p1" });
  assert.equal(twice.status, "no-repair-required");
  assert.deepEqual(memory.inspect(), once);
}

// Current reference against unchanged Journey remains current.
{
  const memory = memoryFor({ revision: 4, references: [ref({ id: "r3", issued: 4 })] });
  const result = executeJourneyRecommendationLifecycleRecovery({ identityRuntime: { memory }, projectId: "p1" });
  assert.equal(result.status, "no-repair-required");
  assert.equal(memory.inspect().projectMemories[0].metadata.recommendationReference.lifecycle.current, true);
}

// Legacy/malformed current reference is conservatively quarantined and never actionable.
{
  const legacy = ref({ id: "legacy" });
  delete legacy.issuedAgainst.progressionRevision;
  const memory = memoryFor({ references: [legacy] });
  executeJourneyRecommendationLifecycleRecovery({ identityRuntime: { memory }, projectId: "p1" });
  const lifecycle = memory.inspect().projectMemories[0].metadata.recommendationReference.lifecycle;
  assert.equal(lifecycle.current, false);
  assert.equal(lifecycle.terminalReason, "legacy-quarantined");
}

// Non-canonical legacy domain is quarantined rather than promoted.
{
  const legacy = ref({ id: "old", domain: "old-domain" });
  const memory = memoryFor({ references: [legacy] });
  executeJourneyRecommendationLifecycleRecovery({ identityRuntime: { memory }, projectId: "p1" });
  assert.equal(memory.inspect().projectMemories[0].metadata.recommendationReference.lifecycle.terminalReason, "legacy-quarantined");
}

// Malformed Journey is fail-closed: zero write.
{
  const memory = memoryFor({ references: [ref({ id: "r1" })], receipts: [receipt] });
  const state = memory.inspect();
  state.projects[0].metadata.projectJourney.progression.revision = "broken";
  let mutable = clone(state);
  const brokenMemory = {
    getState: () => clone(mutable),
    replaceState: (next) => { mutable = clone(next); },
    getProject: (id) => clone(mutable.projects.find((p) => p.id === id) || null),
  };
  const before = clone(mutable);
  assert.throws(() => executeJourneyRecommendationLifecycleRecovery({ identityRuntime: { memory: brokenMemory }, projectId: "p1" }), (error) => error.code === "JOURNEY_RECOMMENDATION_RECOVERY_JOURNEY_MALFORMED");
  assert.deepEqual(mutable, before);
}

// Simulated concurrent change between plan read and commit read => zero recovery write.
{
  let calls = 0;
  const base = memoryFor({ references: [ref({ id: "r1" })], receipts: [receipt] }).inspect();
  let state = clone(base);
  const racingMemory = {
    getState: () => {
      calls += 1;
      if (calls === 2) state.projects[0].metadata.projectJourney.progression.revision = 6;
      return clone(state);
    },
    replaceState: (next) => { state = clone(next); },
    getProject: (id) => clone(state.projects.find((p) => p.id === id) || null),
  };
  assert.throws(() => executeJourneyRecommendationLifecycleRecovery({ identityRuntime: { memory: racingMemory }, projectId: "p1" }), (error) => error.code === "JOURNEY_RECOMMENDATION_RECOVERY_STALE");
  assert.equal(state.projectMemories[0].metadata.recommendationReference.lifecycle.current, true);
}

console.log("Journey recommendation lifecycle recovery verification passed.");
console.log("- exact receipt lineage repairs consumed state");
console.log("- unrelated progression repairs invalidated state");
console.log("- repeated recovery is idempotent");
console.log("- unchanged current reality is preserved");
console.log("- malformed/legacy current references are quarantined");
console.log("- malformed Journey and concurrent stale reality fail closed");
console.log("- recovery never mutates Journey authority");

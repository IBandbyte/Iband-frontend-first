import assert from "node:assert/strict";
import {
  recoverMovieMentorCreatorState,
  syncMovieMentorDurableState,
  enqueueMovieMentorDurableStateSync,
  flushMovieMentorDurableStateSync,
  installCreatorMemoryDurableSyncBridge,
} from "../src/components/studio/mentor/MovieMentorDurableStateSync.js";

// Denial matrix for a forged/mismatched authenticated recovery response.
// These are simulated transport acknowledgements, NOT a physical server court.
const scenarios = [
  { name: "wrong project", state: { projectId: "other-project", revision: 1, creatorStateGeneration: 1 }, code: "MOVIE_MENTOR_RECOVERY_INVALID_ACKNOWLEDGEMENT" },
  { name: "zero revision", state: { projectId: "owned-project", revision: 0, creatorStateGeneration: 1 }, code: "MOVIE_MENTOR_RECOVERY_INVALID_ACKNOWLEDGEMENT" },
  { name: "zero generation", state: { projectId: "owned-project", revision: 1, creatorStateGeneration: 0 }, code: "MOVIE_MENTOR_RECOVERY_INVALID_ACKNOWLEDGEMENT" },
  { name: "missing success", state: { projectId: "owned-project", revision: 1, creatorStateGeneration: 1 }, success: false, code: "MOVIE_MENTOR_RECOVERY_INVALID_ACKNOWLEDGEMENT" },
];
let totalRequests = 0;
for (const scenario of scenarios) {
  const fetchImpl = async (_url, options) => {
    totalRequests += 1;
    assert.equal(options?.method, "GET", "RED: recovery must be read-only");
    assert.equal(options?.headers?.Authorization, "Bearer test-token");
    return { ok: true, json: async () => ({
      success: scenario.success ?? true,
      state: { ...scenario.state, durablePublicationOutbox: [
        { id: "attacker-supplied", status: "pending", snapshotDigest: "a".repeat(32) },
      ] },
    }) };
  };
  await assert.rejects(
    recoverMovieMentorCreatorState({ projectId: "owned-project", fetchImpl, getAuthToken: async () => "test-token" }),
    (error) => error?.code === scenario.code,
    "RED: " + scenario.name + " must be rejected before recovery acceptance",
  );
  await assert.rejects(
    syncMovieMentorDurableState({ projectId: "owned-project", fetchImpl }),
    (error) => error?.code === "MOVIE_MENTOR_DURABLE_SYNC_WRITE_AUTHORITY_REQUIRED",
  );
  assert.equal(enqueueMovieMentorDurableStateSync({ projectId: "owned-project" }), null);
  assert.equal(installCreatorMemoryDurableSyncBridge(), false);
  await flushMovieMentorDurableStateSync({ projectId: "owned-project", fetchImpl });
}
assert.equal(totalRequests, scenarios.length, "RED: forged recovery must not trigger any publication network request");
let noTokenRequests = 0;
await assert.rejects(
  recoverMovieMentorCreatorState({
    projectId: "owned-project",
    fetchImpl: async () => { noTokenRequests += 1; throw Error("unexpected network"); },
    getAuthToken: async () => "",
  }),
  (error) => error?.code === "MOVIE_MENTOR_AUTH_CREDENTIAL_REQUIRED",
);
assert.equal(noTokenRequests, 0);
console.log("GREEN: wrong project, invalid revision/generation, missing success and missing token are denied without publication dispatch.");
console.log("LIMITATION: simulated recovery acknowledgements; signed server provenance issuance and real browser recovery remain uncertified.");

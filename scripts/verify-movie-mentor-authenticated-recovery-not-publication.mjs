import assert from "node:assert/strict";
import {
  recoverMovieMentorCreatorState,
  syncMovieMentorDurableState,
  enqueueMovieMentorDurableStateSync,
  flushMovieMentorDurableStateSync,
  installCreatorMemoryDurableSyncBridge,
} from "../src/components/studio/mentor/MovieMentorDurableStateSync.js";

// A valid-looking authenticated read response is NOT an independent issuance
// or publication authority. This is a transport-boundary negative court only.
let calls = [];
const fetchImpl = async (url, options) => {
  calls.push({ url: String(url), method: options?.method, authorization: options?.headers?.Authorization });
  assert.equal(options?.method, "GET");
  return {
    ok: true,
    json: async () => ({ success: true, state: {
      projectId: "owned-project",
      revision: 2,
      creatorStateGeneration: 3,
      durablePublicationOutbox: [{ id: "unverified-browser-outbox", status: "pending" }],
    } }),
  };
};
const recovered = await recoverMovieMentorCreatorState({
  projectId: "owned-project",
  fetchImpl,
  getAuthToken: async () => "test-only-auth-token",
});
assert.equal(recovered.projectId, "owned-project");
assert.equal(calls.length, 1);
assert.equal(calls[0].authorization, "Bearer test-only-auth-token");
await assert.rejects(
  () => syncMovieMentorDurableState({ projectId: "owned-project", memoryState: recovered, fetchImpl, getAuthToken: async () => "test-only-auth-token" }),
  (error) => error?.code === "MOVIE_MENTOR_DURABLE_SYNC_WRITE_AUTHORITY_REQUIRED",
  "RED: valid authenticated recovery must not authorize durable publication",
);
assert.equal(enqueueMovieMentorDurableStateSync({ projectId: "owned-project", memoryState: recovered }), null);
assert.equal(installCreatorMemoryDurableSyncBridge(), false);
await flushMovieMentorDurableStateSync({ projectId: "owned-project", fetchImpl, getAuthToken: async () => "test-only-auth-token" });
assert.equal(calls.length, 1, "RED: recovery, queue, flush and bridge must not dispatch publication");
assert.equal(calls.every((call) => call.method === "GET"), true);
console.log("GREEN: authenticated recovery read does not grant publication authority or dispatch sync through compatibility entry points.");
console.log("LIMITATION: response is simulated; no server-side provenance issuance, real browser tab or authenticated restart write is certified.");

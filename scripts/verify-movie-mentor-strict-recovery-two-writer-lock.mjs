import assert from "node:assert/strict";
import createCreatorMemory, { createDefaultMemoryState, createMemoryStorageAdapter } from "../src/components/studio/mentor/CreatorMemory.js";
import { MOVIE_MENTOR_SHARED_MEMORY_WRITE_COORDINATION } from "../src/components/studio/mentor/MovieMentorMemoryWriteAuthority.js";

const storageAdapter = createMemoryStorageAdapter(createDefaultMemoryState());
const options = { storageAdapter, requireSharedWriteAuthority: true };
const recoveryMemory = createCreatorMemory(options);
const writerMemory = createCreatorMemory(options);
let active = false;
const queue = [];
const requests = [];
function drain() {
  if (active || !queue.length) return;
  const next = queue.shift();
  active = true;
  Promise.resolve().then(async () => {
    try { next.resolve(await next.callback({ name: next.name, mode: "exclusive" })); }
    catch (error) { next.reject(error); }
    finally { active = false; drain(); }
  });
}
const locks = {
  request(name, options, callback) {
    assert.equal(name, MOVIE_MENTOR_SHARED_MEMORY_WRITE_COORDINATION);
    assert.equal(options?.mode, "exclusive");
    requests.push({ name, ifAvailable: options?.ifAvailable === true });
    if (options?.ifAvailable === true && active) return Promise.resolve(callback(null));
    return new Promise((resolve, reject) => { queue.push({ name, callback, resolve, reject }); drain(); });
  },
};
let overlappingWriter = null;
const recovery = await recoveryMemory.runRecoveryWithSharedAuthority({
  locks,
  operation: fresh => {
    assert.equal(fresh.getState().journey?.activeProjectId ?? null, null);
    overlappingWriter = writerMemory.replaceStateWithSharedAuthority({
      locks,
      transform: state => ({ ...state, journey: { ...state.journey, activeProjectId: "forbidden-overlap" } }),
    });
    return { status: "recovery-certified" };
  },
});
assert.equal(recovery.acquired, true);
assert.equal(recovery.value.status, "recovery-certified");
assert.ok(overlappingWriter, "Second context must attempt its ordinary write while recovery owns the lock.");
const denied = await overlappingWriter;
assert.equal(denied.acquired, false, "Ordinary writer must fail closed during recovery authority.");
assert.equal(denied.reason, "exclusive-lock-unavailable");
assert.equal(writerMemory.readPersistedState().journey.activeProjectId, null, "Denied ordinary writer cannot mutate durable state.");
const after = await writerMemory.replaceStateWithSharedAuthority({
  locks,
  transform: state => ({ ...state, journey: { ...state.journey, activeProjectId: "post-recovery-write" } }),
});
assert.equal(after.acquired, true, "Ordinary writer may commit after recovery releases exclusive authority.");
assert.equal(recoveryMemory.readPersistedState().journey.activeProjectId, "post-recovery-write");
assert.equal(requests.length, 3);
assert.equal(requests[0].ifAvailable, false);
assert.equal(requests[1].ifAvailable, true);
assert.equal(requests[2].ifAvailable, true);
console.log("GREEN: real strict ordinary writer is denied during recovery lock and succeeds only after release.");

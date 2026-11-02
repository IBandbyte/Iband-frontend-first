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
let releaseRecovery;
const recoveryBarrier = new Promise(resolve => { releaseRecovery = resolve; });
let recoveryEntered;
const entered = new Promise(resolve => { recoveryEntered = resolve; });
const recovery = recoveryMemory.runRecoveryWithSharedAuthority({
  locks,
  operation: fresh => {
    assert.equal(fresh.getState().journey?.activeProjectId ?? null, null);
    recoveryEntered();
    return { status: "recovery-certified" };
  },
});
// Recovery itself is synchronous inside the exclusive lock; use a second
// lock-holder as a real queued contention barrier before recovery begins.
const holding = locks.request(MOVIE_MENTOR_SHARED_MEMORY_WRITE_COORDINATION, { mode: "exclusive" }, async () => {
  await recoveryBarrier;
  return "holder-released";
});
// The recovery request was enqueued first, so it must finish before the holder.
// Await recovery and then assert that the second holder remains gated.
const recovered = await recovery;
assert.equal(recovered.acquired, true);
assert.equal(recovered.value.status, "recovery-certified");
await entered;
let holderFinished = false;
holding.then(() => { holderFinished = true; });
await Promise.resolve();
assert.equal(holderFinished, false, "Queued lock holder must not bypass exclusive recovery.");
releaseRecovery();
assert.equal(await holding, "holder-released");
assert.equal(holderFinished, true);
assert.equal(requests.length, 2);
assert.equal(requests[0].ifAvailable, false);
assert.equal(requests[1].ifAvailable, false);
console.log("GREEN: recovery and another exclusive lock holder are serialized under shared authority.");

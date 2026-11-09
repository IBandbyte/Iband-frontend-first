import assert from "node:assert/strict";
import createCreatorMemory from "../src/components/studio/mentor/CreatorMemory.js";

// Physical cross-facade and reload quarantine. Shared browser storage and lock
// are intentionally real in-process objects; no server authority is simulated.
const bytes = new Map();
let durableWrites = 0;
const storage = {
  getItem: (key) => bytes.get(key) ?? null,
  setItem: (key, value) => { durableWrites += 1; bytes.set(key, value); },
  removeItem: (key) => { durableWrites += 1; bytes.delete(key); },
};
const locks = { request: async (_name, _options, callback) => callback({ name: "exclusive" }) };
const createWriter = () => createCreatorMemory({ storageAdapter: storage, requireSharedWriteAuthority: true });
const writerA = createWriter();
const first = await writerA.replaceStateWithSharedAuthority({
  locks,
  transform: (state) => ({ ...state, creatorProfile: { id: "first-committed" } }),
});
assert.equal(first.acquired, true);
assert.equal(durableWrites, 1);
const original = [...bytes.entries()].map(([key, value]) => [key, value]);
assert.equal(first.value.durablePublicationOutbox.length, 1);
const writerB = createWriter();
let transformCalls = 0, notificationCalls = 0;
const denied = await writerB.replaceStateWithSharedAuthority({
  locks,
  transform: (state) => { transformCalls += 1; return { ...state, creatorProfile: { id: "unwitnessed" } }; },
  onCommittedSnapshot: () => { notificationCalls += 1; },
});
assert.equal(denied.acquired, false, "RED: new facade cannot assume stored outbox provenance");
assert.equal(denied.reason, "publication-outbox-provenance-unverified");
assert.equal(transformCalls, 0, "RED: denied writer must not execute transform");
assert.equal(notificationCalls, 0, "RED: denied writer must not notify publication");
assert.equal(durableWrites, 1, "RED: denied writer must not persist");
assert.deepEqual([...bytes.entries()], original, "RED: denied writer must not change durable bytes");
console.log("GREEN: fresh facade refuses unwitnessed outbox before transform, publication callback or durable write.");

const second = await writerA.replaceStateWithSharedAuthority({
  locks,
  transform: (state) => ({ ...state, creatorProfile: { id: "second-committed" } }),
});
assert.equal(second.acquired, true, "RED: original live witness must still allow its own next coordinated commit");
assert.equal(durableWrites, 2);
assert.equal(second.value.durablePublicationOutbox.length, 2);
console.log("GREEN: original live writer continues with two monotonic outbox entries.");

const writerAfterReload = createWriter();
const beforeReloadAttempt = [...bytes.entries()];
const reloadDenied = await writerAfterReload.replaceStateWithSharedAuthority({
  locks,
  transform: () => { throw new Error("DENIED RELOAD MUST NOT EXECUTE TRANSFORM"); },
});
assert.equal(reloadDenied.acquired, false);
assert.equal(reloadDenied.reason, "publication-outbox-provenance-unverified");
assert.equal(durableWrites, 2);
assert.deepEqual([...bytes.entries()], beforeReloadAttempt);
console.log("GREEN: reload refuses to treat durable pending outbox as provenance or publication authority.");
console.log("LIMITATION: cross-tab and restart-safe writer recovery remains unavailable; this is a fail-closed quarantine court, not release certification.");

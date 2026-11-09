import assert from "node:assert/strict";
import createCreatorMemory from "../src/components/studio/mentor/CreatorMemory.js";
import { MOVIE_MENTOR_SHARED_MEMORY_WRITE_COORDINATION } from "../src/components/studio/mentor/MovieMentorMemoryWriteAuthority.js";

// Two live facades, one storage and one exclusive lock manager. This verifies
// serialised contention does not confer provenance to a different facade.
const bytes = new Map();
let writes = 0, active = false, entries = 0;
const storage = {
  getItem: (key) => bytes.get(key) ?? null,
  setItem: (key, value) => { writes += 1; bytes.set(key, value); },
  removeItem: (key) => { writes += 1; bytes.delete(key); },
};
let releaseFirst, firstEntered;
const entered = new Promise((resolve) => { firstEntered = resolve; });
const gate = new Promise((resolve) => { releaseFirst = resolve; });
const locks = { request: async (name, options, callback) => {
  assert.equal(name, MOVIE_MENTOR_SHARED_MEMORY_WRITE_COORDINATION);
  assert.equal(options.mode, "exclusive");
  // Model the Web Locks ifAvailable contract: no overlapping ownership.
  if (active) return callback(null);
  active = true; entries += 1;
  try { return await callback({ name }); } finally { active = false; }
}};
const first = createCreatorMemory({ storageAdapter: storage, requireSharedWriteAuthority: true });
const second = createCreatorMemory({ storageAdapter: storage, requireSharedWriteAuthority: true });
let firstNotified = 0, secondNotified = 0, secondTransforms = 0;
const pendingFirst = first.replaceStateWithSharedAuthority({
  locks,
  transform: (state) => ({ ...state, creatorProfile: { id: "first" } }),
  onCommittedSnapshot: () => { firstNotified += 1; },
});
const firstResult = await pendingFirst;
assert.equal(firstResult.acquired, true);
assert.equal(writes, 1);
const secondResult = await second.replaceStateWithSharedAuthority({
  locks,
  transform: (state) => { secondTransforms += 1; return { ...state, creatorProfile: { id: "second" } }; },
  onCommittedSnapshot: () => { secondNotified += 1; },
});
assert.equal(secondResult.acquired, false);
assert.equal(secondResult.reason, "publication-outbox-provenance-unverified");
assert.equal(secondTransforms, 0);
assert.equal(secondNotified, 0);
assert.equal(firstNotified, 1);
assert.equal(writes, 1);
assert.equal(entries, 2);
assert.equal(first.readPersistedState().creatorProfile.id, "first");
console.log("GREEN: shared lock acquisition does not transfer outbox provenance across facades or permit a second write.");
console.log("LIMITATION: test models exclusive Web Lock calls in one Node process; real multi-tab browser scheduling and authenticated restart recovery remain uncertified.");

import assert from "node:assert/strict";
import createJourneyDurableAuthorityStore, { authorityStorageKey } from "../src/components/studio/mentor/JourneyDurableAuthorityStore.js";

// Adversarial physical court: a noncooperating writer commits inside setItem,
// after the authority generation/revision check and before the candidate write.
// This intentionally tests a guarantee NOT supplied by cooperative Web Locks.
const project = {
  id: "interleaving-film",
  creatorType: "video",
  identity: { domain: "iband.movie-mentor.project", schema: 1, issuance: "secure-web-crypto", legacy: false },
};
const journey = (revision, stage) => ({
  projectId: project.id, currentStageId: stage, currentTaskId: "seed", status: "creating",
  stages: [{ id: "idea", tasks: [{ id: "seed", status: "in-progress" }] }],
  progression: { schemaVersion: 1, revision, lastCommittedOperation: null, committedOperations: [] },
});
const values = new Map();
const key = authorityStorageKey(project.id);
let inject = false;
let injected = false;
let competingBytes = null;
const storage = {
  getItem(k) { return values.get(k) ?? null; },
  setItem(k, value) {
    if (inject && !injected && k === key) {
      injected = true;
      const competing = JSON.parse(String(value));
      competing.noncooperatingWriterMarker = "committed-inside-setItem";
      competingBytes = JSON.stringify(competing);
      values.set(k, competingBytes);
    }
    values.set(k, String(value));
  },
  removeItem(k) { values.delete(k); },
};
const locksApi = {
  async request(_name, _options, callback) {
    return callback({ name: "cooperative-exclusive-lock" });
  },
};
const store = createJourneyDurableAuthorityStore({ storage, locksApi, browserRuntime: true });
await store.bootstrap({ project, legacyJourney: journey(0, "idea") });
assert.equal(store.read(project.id, { project }).authority.generation, 0);
inject = true;
let refused = false;
try {
  await store.compareAndCommit({
    project, expectedGeneration: 0, expectedProgressionRevision: 0,
    nextJourney: journey(1, "story"),
  });
} catch {
  refused = true;
}
assert.equal(injected, true, "Fixture must physically inject a competing write inside setItem.");
assert.equal(refused, true, "RED: authority writer acknowledged a commit after a noncooperating interleaving.");
assert.equal(storage.getItem(key), competingBytes, "RED: competing durable bytes must survive the attempted stale commit.");
console.log("GREEN: interleaved noncooperating durable commit survived and stale authority writer was refused.");

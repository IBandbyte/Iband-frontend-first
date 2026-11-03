import assert from "node:assert/strict";
import createCreatorMemory, { createMemoryStorageAdapter } from "../src/components/studio/mentor/CreatorMemory.js";
import createMovieMentorStudioIdentityRuntime from "../src/components/studio/mentor/MovieMentorStudioIdentityRuntime.js";

// Physical exported-method court: a non-identical legacy Journey update must
// not bypass strict Studio memory authority. Preserve the coordinated route.
const storage = createMemoryStorageAdapter();
const memory = createCreatorMemory({
  storageAdapter: storage,
  projectIdentityCrypto: { randomUUID: () => "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee" },
  requireSharedWriteAuthority: true,
});
let acquisitions = 0;
const locks = {
  async request(name, optionsOrCallback, maybeCallback) {
    assert.ok(name, "Shared authority must name its lock");
    const callback = typeof optionsOrCallback === "function" ? optionsOrCallback : maybeCallback;
    acquisitions += 1;
    return callback({ name, mode: "exclusive" });
  },
};
const runtime = createMovieMentorStudioIdentityRuntime({ memory, settlementLockManager: locks });
const initialJourney = { id: "journey-1", creatorJourney: "guide", currentStageId: "idea" };
const creation = await runtime.ensureProjectWithSharedAuthority({
  projectJourney: initialJourney,
  title: "Journey authority denial court",
});
assert.equal(creation.acquired, true, "Project setup must acquire coordinated authority");
const project = runtime.getActiveProject();
assert.ok(project?.id, "Coordinated setup must establish the project");
const before = storage.getItem("iband.creator-memory");
assert.ok(before, "Court requires actual durable bytes before the attempted mutation");

const differentJourney = { ...initialJourney, currentStageId: "characters" };
let denied = false;
try {
  runtime.persistJourney(project.id, differentJourney);
} catch (error) {
  denied = error?.code === "CREATOR_MEMORY_WRITE_AUTHORITY_DENIED"
    || error?.cause?.code === "CREATOR_MEMORY_WRITE_AUTHORITY_DENIED";
}
assert.equal(denied, true,
  "RED: exported synchronous persistJourney must reject non-identical strict Studio writes");
assert.equal(storage.getItem("iband.creator-memory"), before,
  "Denied synchronous Journey update must preserve durable bytes exactly");

const coordinated = await runtime.persistJourneyWithSharedAuthority(project.id, differentJourney);
assert.equal(coordinated.acquired, true, "Coordinated Journey update must remain available");
assert.ok(acquisitions >= 2, "Project creation and Journey update must both acquire shared authority");
const reload = createCreatorMemory({ storageAdapter: storage, requireSharedWriteAuthority: true });
assert.equal(reload.getProject(project.id)?.metadata?.projectJourney?.currentStageId, "characters",
  "Coordinated Journey update must survive a fresh strict memory reload");
console.log("GREEN: exported synchronous Journey mutation is denied; coordinated Journey persists.");

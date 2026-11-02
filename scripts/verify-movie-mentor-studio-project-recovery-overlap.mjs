import assert from "node:assert/strict";
import createCreatorMemory, {createMemoryStorageAdapter} from "../src/components/studio/mentor/CreatorMemory.js";
import createMovieMentorStudioIdentityRuntime from "../src/components/studio/mentor/MovieMentorStudioIdentityRuntime.js";
import {commitMovieMentorRecoveryWithLock} from "../src/components/studio/mentor/MovieMentorRecoveryLockedCommit.js";

// Real studio project creation must not bypass recovery's shared authority.
// This is a separate caller-level court; the original overlap RED stays intact.
const storage = createMemoryStorageAdapter();
const memory = createCreatorMemory({storageAdapter: storage});
const runtime = createMovieMentorStudioIdentityRuntime({memory});
const original = memory.getState();
// Recovery adoption requires an eligible empty local workspace. A default
// hydrated journey is not empty and can reject before the collision callback.
const eligible = {
  ...original,
  journey: {activeProjectId: null, firstSeenAt: null, lastSeenAt: null},
  creatorProfile: {id: original.creatorProfile?.id ?? null},
};
let collisionEntered = false;
let creationDenied = false;
let created = null;
const locks = {request: async (_name, _options, callback) => callback({name:"shared-writer-lock"})};
const recovered = {project:{id:"film-a",creatorType:"video",metadata:{creatorMode:"ai-movie"}},revision:9,creatorStateGeneration:9};
const result = await commitMovieMentorRecoveryWithLock({
  projectId:"film-a", recovered, locks,
  readLocalState: () => JSON.parse(JSON.stringify(eligible)),
  beforeCommit: () => {
    collisionEntered = true;
    try { created = runtime.ensureProject({title:"Unauthorized overlapping film"}); }
    catch { creationDenied = true; }
  },
  commit: next => storage.setItem("iband.creator-memory",JSON.stringify(next)),
});
assert.equal(collisionEntered,true,`RED: Studio overlap collision was not reached (recovery reason: ${result.reason}).`);
assert.equal(creationDenied,true,"RED: real studio ensureProject bypassed recovery's exclusive writer authority.");
assert.equal(created,null,"RED: studio reported successful project creation while recovery owned authority.");
assert.equal(result.allowed,true,"Recovery must remain authorized.");
const persisted = JSON.parse(storage.getItem("iband.creator-memory"));
assert.equal((persisted.projects || []).some(project => project.title === "Unauthorized overlapping film"),false,
  "Overlapping studio project must not survive recovery.");
console.log("GREEN: real studio project creation is fenced during recovery.");

import assert from "node:assert/strict";
import createCreatorMemory, {createMemoryStorageAdapter} from "../src/components/studio/mentor/CreatorMemory.js";
import createMovieMentorStudioIdentityRuntime from "../src/components/studio/mentor/MovieMentorStudioIdentityRuntime.js";

// Legacy public API must never persist an uncoordinated mentor reply.
// Test method-level denial with strict memory independently of injection rejection.
// Keep creator messages pending for retry.
const storage=createMemoryStorageAdapter();
const memory=createCreatorMemory({storageAdapter:storage,requireSharedWriteAuthority:true});
const runtime=createMovieMentorStudioIdentityRuntime({memory});
const before=storage.getItem("iband.creator-memory");
const result=runtime.recordConversationMessage("film-a",{role:"creator",text:"Create a scene"});
assert.equal(result?.status,"creator-message-pending");
assert.equal(storage.getItem("iband.creator-memory"),before,"Pending creator turn must not write durable bytes.");
assert.throws(
  ()=>runtime.recordConversationMessage("film-a",{role:"mentor",text:"Here is your scene"}),
  error=>error?.code==="MOVIE_MENTOR_LEGACY_MENTOR_WRITE_DENIED",
  "RED: legacy synchronous mentor entrypoint must fail closed instead of writing outside shared authority."
);
assert.equal(storage.getItem("iband.creator-memory"),before,"Denied mentor write must preserve durable bytes.");
console.log("GREEN: legacy synchronous mentor writer is denied while creator pending state remains intact.");

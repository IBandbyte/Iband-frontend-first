import assert from "node:assert/strict";
import createCreatorMemory,{createMemoryStorageAdapter} from "../src/components/studio/mentor/CreatorMemory.js";
import createMovieMentorStudioIdentityRuntime from "../src/components/studio/mentor/MovieMentorStudioIdentityRuntime.js";

// The real UI uses ensureProjectWithSharedAuthority. Its public synchronous
// predecessor must not create a project outside the shared recovery lock.
const storage=createMemoryStorageAdapter();
// Use a verified strict facade so constructor injection and method-level
// denial remain independently testable.
const memory=createCreatorMemory({storageAdapter:storage,requireSharedWriteAuthority:true});
const runtime=createMovieMentorStudioIdentityRuntime({memory});
const before=storage.getItem("iband.creator-memory");
let denied=false;
try { runtime.ensureProject({title:"Uncoordinated legacy project"}); }
catch(error) { denied=error?.code==="MOVIE_MENTOR_LEGACY_PROJECT_WRITE_DENIED"; }
assert.equal(denied,true,"RED: synchronous ensureProject still bypasses shared recovery writer authority.");
assert.equal(storage.getItem("iband.creator-memory"),before,"Denied legacy creation must not change durable bytes.");
assert.equal((memory.getState().projects||[]).some(p=>p.title==="Uncoordinated legacy project"),false,
  "Denied legacy creation must not appear in the working snapshot.");
console.log("GREEN: legacy synchronous Studio project creation is denied without shared authority.");

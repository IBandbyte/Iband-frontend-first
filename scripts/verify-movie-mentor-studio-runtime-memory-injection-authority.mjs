import assert from "node:assert/strict";
import createCreatorMemory,{createMemoryStorageAdapter} from "../src/components/studio/mentor/CreatorMemory.js";
import createMovieMentorStudioIdentityRuntime from "../src/components/studio/mentor/MovieMentorStudioIdentityRuntime.js";

// The production Studio runtime accepts a memory dependency. A permissive
// Creator Memory facade must never enter through that constructor seam.
const legacy=createCreatorMemory({storageAdapter:createMemoryStorageAdapter()});
assert.throws(
  ()=>createMovieMentorStudioIdentityRuntime({memory:legacy}),
  error=>error?.code==="MOVIE_MENTOR_UNSAFE_MEMORY_AUTHORITY",
  "RED: Studio identity runtime accepted a permissive mutable memory injection.",
);
const strict=createCreatorMemory({storageAdapter:createMemoryStorageAdapter(),requireSharedWriteAuthority:true});
const runtime=createMovieMentorStudioIdentityRuntime({memory:strict});
assert.equal(typeof runtime.getActiveProject,"function");
console.log("GREEN: production Studio runtime rejects permissive injected memory while accepting branded strict memory.");

import assert from "node:assert/strict";
import createResponseGenerator from "../src/components/studio/mentor/ResponseGenerator.js";
import createCreatorMemory,{createMemoryStorageAdapter} from "../src/components/studio/mentor/CreatorMemory.js";

// Physical rejection must occur before an unsafe injected writer becomes active.
for(const [label,inject] of [
 ["constructor memory",memory=>createResponseGenerator({memory})],
 ["injected memoryFactory",memory=>createResponseGenerator({memoryFactory:()=>memory})],
 ["setMemory",memory=>createResponseGenerator().setMemory(memory)],
]) {
 const storage=createMemoryStorageAdapter();
 const unsafe=createCreatorMemory({storageAdapter:storage});
 const before=storage.getItem("iband.creator-memory");
 assert.throws(()=>inject(unsafe),error=>error?.code==="MOVIE_MENTOR_UNSAFE_MEMORY_AUTHORITY",`RED: ${label} accepted an unverified writable service`);
 assert.equal(storage.getItem("iband.creator-memory"),before,`${label}: rejected injection changed durable bytes`);
}
console.log("GREEN: all three unsafe injected writers are rejected without changing durable bytes.");

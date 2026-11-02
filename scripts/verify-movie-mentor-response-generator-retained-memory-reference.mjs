import assert from "node:assert/strict";
import createResponseGenerator from "../src/components/studio/mentor/ResponseGenerator.js";
import createCreatorMemory,{createMemoryStorageAdapter} from "../src/components/studio/mentor/CreatorMemory.js";

// A generator cannot revoke a caller-retained permissive reference. The
// enforceable boundary is refusing that reference BEFORE it enters the generator.
const storage=createMemoryStorageAdapter();
const retained=createCreatorMemory({storageAdapter:storage});
const before=storage.getItem("iband.creator-memory");
assert.throws(()=>createResponseGenerator({memory:retained}),error=>error?.code==="MOVIE_MENTOR_UNSAFE_MEMORY_AUTHORITY",
 "RED: caller-retained permissive writer entered the generator");
assert.equal(storage.getItem("iband.creator-memory"),before,"Rejected injection changed durable bytes");
// Do not claim that rejection retroactively disables the independent legacy
// object; its ordinary writes remain a separate migration boundary.
console.log("GREEN: caller-retained permissive writer is refused at generator boundary; legacy reference remains independently owned.");

import assert from "node:assert/strict";
import createCreatorMemory, {createMemoryStorageAdapter} from "../src/components/studio/mentor/CreatorMemory.js";

// RED-first: strict memory must hydrate legacy identities without a forbidden
// synchronous durable write during construction. Persisted bytes must remain
// unchanged until a coordinated transaction explicitly commits migration.
const storage=createMemoryStorageAdapter();
const legacy={version:1,projects:[{id:"legacy-film",title:"Legacy film",creatorType:"video",metadata:{creatorMode:"ai-movie"}}]};
storage.setItem("iband.creator-memory",JSON.stringify(legacy));
const before=storage.getItem("iband.creator-memory");
const memory=createCreatorMemory({storageAdapter:storage,requireSharedWriteAuthority:true});
assert.equal(storage.getItem("iband.creator-memory"),before,
  "RED: strict construction must not persist a legacy identity migration.");
assert.equal(memory.getProject("legacy-film")?.id,"legacy-film",
  "Legacy project must remain readable under strict mode.");
console.log("GREEN: strict Creator Memory hydrates legacy projects without an unauthorized constructor write.");

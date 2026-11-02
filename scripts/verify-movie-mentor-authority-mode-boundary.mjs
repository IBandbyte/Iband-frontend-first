import assert from "node:assert/strict";
import createCreatorMemory,{createMemoryStorageAdapter} from "../src/components/studio/mentor/CreatorMemory.js";

// Distinguish compatibility from certification. An idle legacy synchronous
// writer may remain functional; it cannot be represented as recovery-safe.
// Strict Studio writes must fail closed, even when no recovery currently holds
// a browser lock. Only the async coordinated API may commit.
const legacyStorage=createMemoryStorageAdapter();
const legacy=createCreatorMemory({storageAdapter:legacyStorage});
const old=legacy.getState();
old.metadata={...(old.metadata||{}),compatibility:"legacy-idle"};
legacy.replaceState(old);
assert.equal(createCreatorMemory({storageAdapter:legacyStorage}).getState().metadata.compatibility,"legacy-idle",
  "Legacy idle compatibility must remain explicit.");

const strictStorage=createMemoryStorageAdapter();
const strict=createCreatorMemory({storageAdapter:strictStorage,requireSharedWriteAuthority:true});
const before=strictStorage.getItem("iband.creator-memory");
const changed=strict.getState();
changed.metadata={...(changed.metadata||{}),forbidden:"synchronous"};
assert.throws(()=>strict.replaceState(changed),error=>
  error?.cause?.code==="CREATOR_MEMORY_WRITE_AUTHORITY_DENIED",
  "Strict ordinary writes must fail closed without claiming a synchronous lock.");
assert.equal(strictStorage.getItem("iband.creator-memory"),before,
  "Strict denied write must preserve durable bytes.");
let lockRequests=0;
const locks={request:async(name,options,callback)=>{
  lockRequests++;
  assert.equal(name,"movie-mentor-creator-memory-recovery");
  assert.equal(options.mode,"exclusive");
  return callback({name});
}};
const result=await strict.replaceStateWithSharedAuthority({
  locks,transform:state=>({...state,metadata:{...(state.metadata||{}),coordinated:"committed"}}),
});
assert.equal(result.acquired,true,"Explicit async authority must be acquired.");
assert.equal(lockRequests,1,"Only async authority may request the shared lock.");
assert.equal(createCreatorMemory({storageAdapter:strictStorage,requireSharedWriteAuthority:true}).getState().metadata.coordinated,"committed");
console.log("GREEN: legacy idle compatibility is distinct from strict coordinated authority.");

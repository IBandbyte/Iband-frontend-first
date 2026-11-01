import assert from "node:assert/strict";
import createCreatorMemory, {createMemoryStorageAdapter} from "../src/components/studio/mentor/CreatorMemory.js";

// A strict migration policy must not silently permit legacy synchronous
// whole-state persistence merely because no recovery is visibly running.
// Shared Web Locks are asynchronous: a preflight storage read cannot replace one.
const storage=createMemoryStorageAdapter();
const memory=createCreatorMemory({storageAdapter:storage,requireSharedWriteAuthority:true});
const original=storage.getItem("iband.creator-memory");
const next=memory.getState();
next.metadata={...(next.metadata||{}),unauthorisedLegacyWrite:"must-not-persist"};
assert.throws(
  ()=>memory.replaceState(next),
  error=>error?.cause?.code==="CREATOR_MEMORY_WRITE_AUTHORITY_DENIED",
  "RED: strict-mode synchronous whole-state writer must fail closed."
);
assert.equal(storage.getItem("iband.creator-memory"),original,
  "Strict-mode denial must preserve durable bytes.");
const locks={request:async(name,options,callback)=>{
  assert.equal(name,"movie-mentor-creator-memory-recovery");
  assert.deepEqual(options,{mode:"exclusive",ifAvailable:true});
  return callback({name});
}};
const result=await memory.replaceStateWithSharedAuthority({locks,transform:state=>{
  state.metadata={...(state.metadata||{}),coordinatedStrictWrite:"persisted"};
  return state;
}});
assert.equal(result.acquired,true,"Coordinated strict-mode write must acquire shared authority.");
assert.equal(createCreatorMemory({storageAdapter:storage}).getState().metadata.coordinatedStrictWrite,"persisted");
console.log("GREEN: strict legacy writes fail closed while coordinated writes persist under shared authority.");

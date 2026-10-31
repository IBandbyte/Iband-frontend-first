import assert from "node:assert/strict";
import createCreatorMemory,{createMemoryStorageAdapter} from "../src/components/studio/mentor/CreatorMemory.js";
const storage=createMemoryStorageAdapter();
const locks={request:async(name,options,callback)=>{
 assert.equal(name,"movie-mentor-creator-memory-recovery");
 assert.deepEqual(options,{mode:"exclusive",ifAvailable:true});
 return callback({name});
}};
const ordinary=createCreatorMemory({storageAdapter:storage});
assert.equal(typeof ordinary.replaceStateWithSharedAuthority,"function");
const result=await ordinary.replaceStateWithSharedAuthority({locks,transform:state=>{
 state.metadata={...(state.metadata||{}),coordinatedOrdinary:"durable"};
 return state;
}});
assert.equal(result.acquired,true);
assert.equal(createCreatorMemory({storageAdapter:storage}).getState().metadata.coordinatedOrdinary,"durable");
const denied=await ordinary.replaceStateWithSharedAuthority({transform:state=>state});
assert.equal(denied.acquired,false,"Missing lock must not allow ordinary mutation.");
assert.equal(createCreatorMemory({storageAdapter:storage}).getState().metadata.coordinatedOrdinary,"durable");
console.log("GREEN: opt-in ordinary writer uses recovery lock and durable fresh-state mutation.");

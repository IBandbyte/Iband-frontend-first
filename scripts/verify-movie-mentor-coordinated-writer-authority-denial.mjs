import assert from "node:assert/strict";
import createCreatorMemory,{createMemoryStorageAdapter} from "../src/components/studio/mentor/CreatorMemory.js";

// A denied or missing exclusive authority must not invoke the transform,
// mutate the strict facade, or alter durable storage.
for(const mode of ["missing","denied","throwing"]){
  const backing=createMemoryStorageAdapter();
  const strict=createCreatorMemory({storageAdapter:backing,requireSharedWriteAuthority:true});
  const before=backing.getItem("iband.creator-memory");
  const snapshot=strict.getState();
  let transforms=0,requests=0;
  const locks=mode==="missing"?undefined:{
    async request(name,options,callback){
      requests++;
      assert.equal(name,"movie-mentor-creator-memory-recovery");
      assert.equal(options.mode,"exclusive");
      if(mode==="throwing")throw new Error("lock service failed");
      return callback(null);
    },
  };
  const result=await strict.replaceStateWithSharedAuthority({locks,transform:state=>{
    transforms++;
    state.metadata={...(state.metadata||{}),unauthorised:mode};
    return state;
  }});
  assert.equal(result.acquired,false,`RED: ${mode} authority was treated as acquired.`);
  assert.equal(transforms,0,`RED: ${mode} authority ran an unapproved transform.`);
  assert.deepEqual(strict.getState(),snapshot,`RED: ${mode} authority mutated the working snapshot.`);
  assert.equal(backing.getItem("iband.creator-memory"),before,`RED: ${mode} authority altered durable storage.`);
  assert.equal(requests,mode==="missing"?0:1);
  console.log(JSON.stringify({mode,reason:result.reason,transforms,requests}));
}
console.log("GREEN: coordinated strict writer fails closed without exclusive authority; original permissive contention remains unproven.");

import assert from "node:assert/strict";
import createCreatorMemory,{createMemoryStorageAdapter} from "../src/components/studio/mentor/CreatorMemory.js";

// A bad transform must fail closed even after the exclusive lock is acquired.
// The underlying durable snapshot and facade working state must remain intact.
for(const mode of ["missing","null","promise","throw"]){
  const backing=createMemoryStorageAdapter();
  const strict=createCreatorMemory({storageAdapter:backing,requireSharedWriteAuthority:true});
  const before=backing.getItem("iband.creator-memory");
  const snapshot=strict.getState();
  let requests=0;
  const locks={async request(name,options,callback){
    requests++;
    assert.equal(name,"movie-mentor-creator-memory-recovery");
    assert.equal(options.mode,"exclusive");
    return callback({name});
  }};
  const transform=mode==="missing"?undefined:mode==="null"?()=>null:mode==="promise"?()=>Promise.resolve({}):()=>{throw new Error("transform failed");};
  const result=await strict.replaceStateWithSharedAuthority({locks,transform});
  assert.equal(result.acquired,false,`RED: invalid transform ${mode} was accepted.`);
  assert.equal(requests,mode==="missing"?0:1);
  assert.deepEqual(strict.getState(),snapshot,`RED: ${mode} changed the strict working state.`);
  assert.equal(backing.getItem("iband.creator-memory"),before,`RED: ${mode} changed durable bytes.`);
  console.log(JSON.stringify({mode,reason:result.reason,requests}));
}
console.log("GREEN: invalid coordinated transforms refuse without persistence or state adoption.");

import assert from "node:assert/strict";
import createCreatorMemory,{createMemoryStorageAdapter} from "../src/components/studio/mentor/CreatorMemory.js";
import {withMovieMentorMemoryWriteAuthority} from "../src/components/studio/mentor/MovieMentorMemoryWriteAuthority.js";

// A deterministic lock double reproduces recovery owning the authority while
// another strict writer requests a concurrent state transform.
const backing=createMemoryStorageAdapter();
const memory=createCreatorMemory({storageAdapter:backing,requireSharedWriteAuthority:true});
let held=false,requests=0,commits=0;
const locks={async request(_name,options,callback){
  requests++;
  if(held && options?.ifAvailable===true)return callback(null);
  if(held)throw new Error("fixture must not reenter an exclusive lock");
  held=true;
  try{return await callback({name:"shared-memory-authority"});}
  finally{held=false;}
}};
const result=await withMovieMentorMemoryWriteAuthority({locks,operation:async()=>{
  const contender=await memory.replaceStateWithSharedAuthority({locks,transform:state=>{
    commits++;
    state.metadata={...(state.metadata||{}),overlap:"unauthorised"};
    return state;
  }});
  assert.equal(contender.acquired,false,"Competing coordinated writer must not acquire held authority.");
  assert.equal(contender.reason,"exclusive-lock-unavailable");
  return "recovery-complete";
}});
assert.equal(result.acquired,true);
assert.equal(result.value,"recovery-complete");
assert.equal(requests,2,"Both operations must request the shared lock.");
assert.equal(commits,0,"Denied coordinated writer must not run its transform.");
assert.equal(backing.getItem("iband.creator-memory"),null,"Denied overlap must not commit durable bytes.");
console.log("GREEN: coordinated ordinary writer is denied while recovery holds shared exclusive authority; legacy synchronous overlap remains independently RED.");

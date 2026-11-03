import assert from "node:assert/strict";
import createCreatorMemory from "../src/components/studio/mentor/CreatorMemory.js";
import {MOVIE_MENTOR_SHARED_MEMORY_WRITE_COORDINATION} from "../src/components/studio/mentor/MovieMentorMemoryWriteAuthority.js";
const map=new Map();
const storage={getItem:key=>map.get(key)||null,setItem:(key,v)=>map.set(key,v),removeItem:key=>map.delete(key)};
let held=false,entered=0,release,called=0;
const locks={request:async(name,options,fn)=>{
 assert.equal(name,MOVIE_MENTOR_SHARED_MEMORY_WRITE_COORDINATION);
 assert.equal(options.mode,"exclusive");
 if(held)return fn(null);
 held=true;entered++;
 try{return await fn({name});}finally{held=false;}
}};
const memory=createCreatorMemory({storageAdapter:storage,requireSharedWriteAuthority:true});
const result=await memory.replaceStateWithSharedAuthority({locks,transform:state=>({...state,creatorProfile:{id:"verified-creator"}}),onCommittedSnapshot:snapshot=>{
 assert.equal(held,true,"Snapshot must be issued before shared lock is released");
 assert.equal(snapshot.creatorProfile.id,"verified-creator");
 called++;
}});
assert.equal(result.acquired,true);
assert.equal(called,1,"Successful coordinated commit must issue one snapshot");
assert.equal(entered,1);
assert.equal(memory.getState().creatorProfile.id,"verified-creator");
const rejected=await memory.replaceStateWithSharedAuthority({locks,transform:()=>{throw Error("abort");},onCommittedSnapshot:()=>called++});
assert.equal(rejected.acquired,false);
assert.equal(called,1,"Failed commit must not issue a snapshot");
// Publication notification must never turn a successfully persisted commit into
// an apparent failed write; otherwise callers may retry an already committed
// transaction and create duplicate or conflicting downstream effects.
const callbackFailure=await memory.replaceStateWithSharedAuthority({
 locks,transform:state=>({...state,creatorProfile:{id:"committed-despite-callback-failure"}}),
 onCommittedSnapshot:()=>{throw Error("simulated publication callback failure");}
});
assert.equal(callbackFailure.acquired,true,"Committed write must not be reported as aborted after publication notification fails");
assert.equal(memory.readPersistedState().creatorProfile.id,"committed-despite-callback-failure");
console.log("GREEN: real CreatorMemory coordinated writer issues exactly one committed snapshot inside shared authority, and none on abort.");

import assert from "node:assert/strict";
import createCreatorMemory, {createMemoryStorageAdapter} from "../src/components/studio/mentor/CreatorMemory.js";
import {commitMovieMentorRecoveryWithLock} from "../src/components/studio/mentor/MovieMentorRecoveryLockedCommit.js";

// Physical shared-authority court: an ordinary synchronous writer must not
// commit while an asynchronous recovery transaction owns the exclusive lock.
// Merely using a lock in the recovery path is insufficient.
const storage=createMemoryStorageAdapter();
const ordinary=createCreatorMemory({storageAdapter:storage});
const recovered={project:{id:"film-a",creatorType:"video",metadata:{creatorMode:"ai-movie"}},revision:9,creatorStateGeneration:9};
const initial=ordinary.getState();
let ordinaryRefused=false;
let ordinaryWriteCount=0;
const locks={request:async(_name,_options,callback)=>callback({name:"shared-writer-lock"})};
const result=await commitMovieMentorRecoveryWithLock({
  projectId:"film-a",recovered,locks,
  readLocalState:()=>JSON.parse(storage.getItem("iband.creator-memory")||JSON.stringify(initial)),
  beforeCommit:()=>{
    const changed=ordinary.getState();
    changed.metadata={...changed.metadata,ordinaryOverlap:"unauthorised"};
    try {ordinary.replaceState(changed);ordinaryWriteCount++;}
    catch {ordinaryRefused=true;}
  },
  commit:next=>storage.setItem("iband.creator-memory",JSON.stringify(next)),
});
assert.equal(ordinaryRefused,true,"RED: synchronous ordinary writer committed during exclusive recovery authority.");
assert.equal(ordinaryWriteCount,0,"RED: ordinary writer must not report a successful overlapping write.");
assert.equal(result.allowed,true,"Recovery should finish under its exclusive authority.");
const final=JSON.parse(storage.getItem("iband.creator-memory"));
assert.notEqual(final.metadata?.ordinaryOverlap,"unauthorised","Overlapping ordinary write must not leak into recovered state.");
console.log("GREEN: synchronous ordinary writer is fenced while recovery holds shared authority.");

import assert from "node:assert/strict";
import createCreatorMemory,{createMemoryStorageAdapter} from "../src/components/studio/mentor/CreatorMemory.js";
import {commitMovieMentorRecoveryWithLock} from "../src/components/studio/mentor/MovieMentorRecoveryLockedCommit.js";

// Witness the real recovery collision callback before attributing a RED to
// the competing writer. Do not replace or relax any existing overlap court.
const storage=createMemoryStorageAdapter();
const memory=createCreatorMemory({storageAdapter:storage});
const initial=memory.getState();
// A new Creator Memory contains nonempty journey counters. The recovery
// adoption fence correctly protects those values, so this isolated collision
// court supplies a truly empty, eligible local workspace instead.
const eligible={
  ...initial,
  journey:{activeProjectId:null,firstSeenAt:null,lastSeenAt:null},
  creatorProfile:{id:initial.creatorProfile?.id??null},
};
const recovered={project:{id:"film-a",creatorType:"video",metadata:{creatorMode:"ai-movie"}},revision:9,creatorStateGeneration:9};
let lockEntered=false;
let collisionEntered=false;
let commitEntered=false;
const locks={request:async(_name,_options,callback)=>{
  lockEntered=true;
  return callback({name:"shared-writer-lock"});
}};
const result=await commitMovieMentorRecoveryWithLock({
  projectId:"film-a",recovered,locks,
  readLocalState:()=>JSON.parse(JSON.stringify(eligible)),
  beforeCommit:()=>{collisionEntered=true;},
  commit:next=>{commitEntered=true;storage.setItem("iband.creator-memory",JSON.stringify(next));},
});
assert.equal(lockEntered,true,"Recovery must physically enter the exclusive lock callback.");
assert.equal(collisionEntered,true,`RED: recovery collision callback was never entered (reason: ${result.reason}).`);
assert.equal(commitEntered,true,"Recovery must reach its durable commit after the collision witness.");
assert.equal(result.allowed,true,"Empty local workspace must permit the recovered project.");
console.log("GREEN: recovery reached its collision callback and committed under exclusive authority.");

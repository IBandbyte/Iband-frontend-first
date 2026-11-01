import assert from "node:assert/strict";
import createCreatorMemory,{createMemoryStorageAdapter} from "../src/components/studio/mentor/CreatorMemory.js";
import {commitMovieMentorRecoveryWithLock} from "../src/components/studio/mentor/MovieMentorRecoveryLockedCommit.js";

// Physical strict-mode overlap court. Existing legacy-default REDs are retained.
const storage=createMemoryStorageAdapter();
const ordinary=createCreatorMemory({storageAdapter:storage,requireSharedWriteAuthority:true});
const initial=ordinary.getState();
const eligible={...initial,journey:{activeProjectId:null,firstSeenAt:null,lastSeenAt:null},creatorProfile:{id:initial.creatorProfile?.id??null}};
const recovered={project:{id:"film-a",creatorType:"video",metadata:{creatorMode:"ai-movie"}},revision:9,creatorStateGeneration:9};
let collisionEntered=false;
let refused=false;
let ordinaryCommitted=false;
const locks={request:async(_name,_options,callback)=>callback({name:"shared-writer-lock"})};
const result=await commitMovieMentorRecoveryWithLock({
 projectId:"film-a",recovered,locks,
 readLocalState:()=>JSON.parse(JSON.stringify(eligible)),
 beforeCommit:()=>{
   collisionEntered=true;
   const changed=ordinary.getState();
   changed.metadata={...changed.metadata,ordinaryOverlap:"unauthorised"};
   try{ordinary.replaceState(changed);ordinaryCommitted=true;}
   catch(error){
     refused=true;
     assert.equal(error.code,"CREATOR_MEMORY_WRITE_AUTHORITY_DENIED","Strict mode must reject with explicit authority-denial code.");
   }
 },
 commit:next=>storage.setItem("iband.creator-memory",JSON.stringify(next)),
});
assert.equal(collisionEntered,true,"Strict-mode collision must physically execute.");
assert.equal(refused,true,"Strict ordinary writer must refuse while recovery holds authority.");
assert.equal(ordinaryCommitted,false,"Ordinary writer must not report success.");
assert.equal(result.allowed,true,`Authorized recovery must finish (reason: ${result.reason}; writer refused: ${refused}; writer committed: ${ordinaryCommitted}).`);
const persisted=JSON.parse(storage.getItem("iband.creator-memory"));
assert.notEqual(persisted.metadata?.ordinaryOverlap,"unauthorised","Denied writer must not contaminate recovered state.");
console.log("GREEN: strict ordinary writer refused during physically witnessed recovery collision.");

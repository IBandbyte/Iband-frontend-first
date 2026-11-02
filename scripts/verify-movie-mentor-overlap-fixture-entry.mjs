import assert from "node:assert/strict";
import createCreatorMemory, {createMemoryStorageAdapter} from "../src/components/studio/mentor/CreatorMemory.js";
import createMovieMentorStudioIdentityRuntime from "../src/components/studio/mentor/MovieMentorStudioIdentityRuntime.js";
import {commitMovieMentorRecoveryWithLock} from "../src/components/studio/mentor/MovieMentorRecoveryLockedCommit.js";

// Independent reachability witness: preserve the original overlap courts.
const storage=createMemoryStorageAdapter();
const memory=createCreatorMemory({storageAdapter:storage,requireSharedWriteAuthority:true});
const runtime=createMovieMentorStudioIdentityRuntime({memory});
const initial=memory.getState();
const eligible={...initial,journey:{activeProjectId:null,firstSeenAt:null,lastSeenAt:null},creatorProfile:{id:initial.creatorProfile?.id??null}};
const recovered={project:{id:"film-a",creatorType:"video",metadata:{creatorMode:"ai-movie"}},revision:9,creatorStateGeneration:9};
let entered=false,denied=false,committed=false;
const locks={request:async(_name,_options,callback)=>callback({name:"shared-writer-lock"})};
const result=await commitMovieMentorRecoveryWithLock({
  projectId:"film-a",recovered,locks,
  readLocalState:()=>JSON.parse(JSON.stringify(eligible)),
  beforeCommit:()=>{
    entered=true;
    try{runtime.ensureProject({title:"Forbidden overlap"});}
    catch(error){denied=error?.code==="MOVIE_MENTOR_LEGACY_PROJECT_WRITE_DENIED";}
  },
  commit:()=>{committed=true;},
});
assert.equal(entered,true,`RED: collision callback unreachable: ${result.reason}`);
assert.equal(denied,true,"RED: legacy project creation not denied inside recovery.");
assert.equal(result.allowed,true,"Eligible recovery must be allowed.");
assert.equal(committed,true,"Recovery must reach commit.");
console.log("GREEN: eligible recovery enters collision callback and denies synchronous Studio creation.");

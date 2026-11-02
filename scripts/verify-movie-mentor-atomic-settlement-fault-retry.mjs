import assert from "node:assert/strict";
import createCreatorMemory,{createMemoryStorageAdapter} from "../src/components/studio/mentor/CreatorMemory.js";

// Physical RED-first fault injection: a failed multi-effect settlement must
// leave the durable blob byte-identical and a retry must commit only once.
const storage=createMemoryStorageAdapter();
const memory=createCreatorMemory({storageAdapter:storage,requireSharedWriteAuthority:true});
const locks={request:async(name,options,callback)=>{
 assert.equal(name,"movie-mentor-creator-memory-recovery");
 assert.deepEqual(options,{mode:"exclusive",ifAvailable:true});
 return callback({name});
}};
const before=storage.getItem("iband.creator-memory");
const request={locks,projectId:"atomic-film",creatorTurnId:"atomic-turn-01",
 conversation:{creatorMessage:"Create my film",mentorResponse:"Let's begin"},
 handoff:{title:"Movie Mentor continuation",content:"Continue this film"},
 recommendation:{content:"Plan the first scene"}};
assert.equal(typeof memory.settleConversationWithSharedAuthority,"function",
 "RED: no strict-compatible atomic settlement API exists.");
let rejected=false;
try{await memory.settleConversationWithSharedAuthority({...request,beforeCommit:()=>{throw new Error("injected-before-commit");}});}catch(error){rejected=error.message==="injected-before-commit";}
assert.equal(rejected,true,"Fault injection must stop the commit.");
assert.equal(storage.getItem("iband.creator-memory"),before,"Failed settlement must not persist partial effects.");
const first=await memory.settleConversationWithSharedAuthority(request);
assert.equal(first.acquired,true);
const committed=storage.getItem("iband.creator-memory");
const retry=await memory.settleConversationWithSharedAuthority(request);
assert.equal(retry.acquired,true);
assert.equal(storage.getItem("iband.creator-memory"),committed,"Retry must not write another settlement.");
const state=memory.readPersistedState();
assert.equal(state.conversations.filter(x=>x.metadata?.creatorTurnId==="atomic-turn-01").length,1);
console.log("GREEN: injected failure is atomic and retry is idempotent.");

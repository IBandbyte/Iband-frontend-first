import assert from "node:assert/strict";
import createCreatorMemory,{createMemoryStorageAdapter} from "../src/components/studio/mentor/CreatorMemory.js";

// Physical RED-first fault injection: a failed multi-effect settlement must
// leave the durable blob byte-identical and a retry must commit only once.
const storage=createMemoryStorageAdapter();
const memory=createCreatorMemory({storageAdapter:storage,requireSharedWriteAuthority:true});
const locks={request:async(name,options,callback)=>{
 assert.equal(name,"movie-mentor-creator-memory-recovery");
 assert.ok(options?.mode==="exclusive" && (options.ifAvailable===undefined || options.ifAvailable===true),"Lock mock accepts waiting atomic settlement and non-waiting ordinary writer.");
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
try{const result=await memory.settleConversationWithSharedAuthority({...request,beforeCommit:()=>{throw new Error("injected-before-commit");}});if(result?.cause){throw result.cause;}assert.fail(`Fault injection unexpectedly returned: ${JSON.stringify(result)}`);}catch(error){rejected=error.message==="injected-before-commit";if(!rejected)throw error;}
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
assert.equal(state.sessionHandoffs.filter(x=>x.metadata?.creatorTurnId==="atomic-turn-01").length,1,
 "Exactly one durable handoff must accompany the conversation.");
assert.equal(state.projectMemories.filter(x=>x.metadata?.creatorTurnId==="atomic-turn-01").length,1,
 "Exactly one durable recommendation must accompany the conversation.");
assert.equal(first.value?.status,"committed","First attempt must commit.");
assert.equal(retry.value?.status,"already-settled","Retry must reuse the existing turn.");
// Exercise replacement retirement and repeated turn identity against the same
// durable state. Old references must become terminal only when the new one
// commits, and retry must not retire or append again.
const oldReference={domain:"movie-mentor-journey-recommendation",projectId:"atomic-film",recommendationId:"rec-old",lifecycle:{current:true}};
const newReference={domain:oldReference.domain,projectId:"atomic-film",recommendationId:"rec-new",lifecycle:{current:true}};
const seed=await memory.replaceStateWithSharedAuthority({locks,transform:state=>{
 state.projectMemories.push({
  id:"old-rec-entry",projectId:"atomic-film",type:"project-memory",
  title:"Previous recommendation",content:"Old plan",metadata:{recommendationReference:oldReference}
 });
 return state;
}});
assert.equal(seed.acquired,true);
const replacement={...request,creatorTurnId:"atomic-turn-02",recommendation:{
 content:"New plan",metadata:{recommendationReference:newReference}
}};
const replacementResult=await memory.settleConversationWithSharedAuthority(replacement);
assert.equal(replacementResult.acquired,true);
assert.deepEqual(replacementResult.value.retiredRecommendationIds,["rec-old"]);
const afterReplacement=memory.readPersistedState();
const old=afterReplacement.projectMemories.find(x=>x.id==="old-rec-entry");
assert.equal(old.metadata.recommendationReference.lifecycle.current,false);
assert.equal(old.metadata.recommendationReference.lifecycle.supersededByRecommendationId,"rec-new");
const replacementBytes=storage.getItem("iband.creator-memory");
const replacementRetry=await memory.settleConversationWithSharedAuthority(replacement);
assert.equal(replacementRetry.value.status,"already-settled");
assert.equal(storage.getItem("iband.creator-memory"),replacementBytes);
// Physical nested-lock court: shared recovery lock must be acquired before
// the separate settlement lock, with no second shared-lock acquisition.
const lockTrace=[];
const orderedLocks={request:async(name,options,callback)=>{
 lockTrace.push(name);
 assert.equal(options?.mode,"exclusive");
 if(name==="movie-mentor-creator-memory-recovery"){
  assert.equal(options.ifAvailable,undefined);
  return callback({name});
 }
 assert.equal(name,"movie-mentor-durable-settlement-test");
 assert.equal(lockTrace.at(-2),"movie-mentor-creator-memory-recovery");
 return callback({name});
}};
const ordered=await memory.settleConversationWithSharedAuthority({
 ...request,locks:orderedLocks,creatorTurnId:"atomic-turn-03",
 settlementLockName:"movie-mentor-durable-settlement-test"
});
assert.equal(ordered.acquired,true);
assert.equal(ordered.value.status,"committed");
assert.deepEqual(lockTrace,[
 "movie-mentor-creator-memory-recovery",
 "movie-mentor-durable-settlement-test",
],"Atomic settlement must acquire exactly two locks in shared-first order.");
console.log("GREEN: injected failure is atomic and retry is idempotent.");

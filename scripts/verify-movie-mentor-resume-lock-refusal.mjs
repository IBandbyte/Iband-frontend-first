import assert from "node:assert/strict";
import createMovieMentorStudioIdentityRuntime from "../src/components/studio/mentor/MovieMentorStudioIdentityRuntime.js";

// Executable refusal court: an available lock manager that refuses the
// exclusive lock must never run the callback or modify recommendation state.
let requested=0, executed=0, writes=0;
const project={id:"movie-mentor-contended-lock",creatorType:"video",metadata:{creatorMode:"ai-movie",projectJourney:null}};
const locks={async request(name,options,callback){
  requested++;
  assert.equal(name,"movie-mentor-creator-memory-recovery");
  assert.equal(options.mode,"exclusive");
  return callback(null);
}};
const memory={
  getActiveProject:()=>project,
  getPersistedProject:()=>project,
  getProject:()=>project,
  getProjectMemories:()=>[],
  getRecentConversations:()=>[],
  getLatestSessionHandoff:()=>null,
  runRecoveryWithSharedAuthority:async ({locks:manager,operation})=>{
    return manager.request("movie-mentor-creator-memory-recovery",{mode:"exclusive"},async lock=>{
      if(!lock)return {acquired:false,reason:"exclusive-lock-unavailable"};
      executed++;
      return {acquired:true,value:operation(memory)};
    });
  },
  replaceState:()=>{writes++;throw Error("Refused lock must not write.");},
};
const runtime=createMovieMentorStudioIdentityRuntime({
  memory,settlementLockManager:locks,cryptoImpl:{randomUUID:()=>"contended-session"},
});
const before=runtime.getResumeSnapshot();
assert.equal(before.recommendationActionsBlocked,true);
const result=await runtime.recoverResumeRecommendationsWithSharedAuthority();
assert.equal(result.acquired,false);
assert.equal(requested,1);
assert.equal(executed,0);
assert.equal(writes,0);
assert.equal(runtime.getResumeSnapshot().recommendationActionsBlocked,true);
console.log("GREEN: exclusive-lock refusal never executes recommendation recovery and leaves resume blocked.");

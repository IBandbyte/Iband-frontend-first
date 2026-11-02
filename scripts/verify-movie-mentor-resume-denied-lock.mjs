import assert from "node:assert/strict";
import createMovieMentorStudioIdentityRuntime from "../src/components/studio/mentor/MovieMentorStudioIdentityRuntime.js";

// Executable denial court: no browser lock must never call the recovery
// operation or mutate the persisted recommendation evidence.
let writes=0, recoveries=0;
const project={id:"movie-mentor-denied-lock",creatorType:"video",metadata:{creatorMode:"ai-movie",projectJourney:null}};
const memory={
  getActiveProject:()=>project,
  getPersistedProject:()=>project,
  getProject:()=>project,
  getProjectMemories:()=>[],
  getRecentConversations:()=>[],
  getLatestSessionHandoff:()=>null,
  runRecoveryWithSharedAuthority:async ({locks,operation})=>{
    if(!locks || typeof locks.request!=="function")return {acquired:false,reason:"lock-or-operation-unavailable"};
    recoveries++;
    return {acquired:false,reason:"exclusive-lock-unavailable"};
  },
  replaceState:()=>{writes++;throw Error("Denied authority must never write.");},
};
const runtime=createMovieMentorStudioIdentityRuntime({
  memory,
  settlementLockManager:null,
  cryptoImpl:{randomUUID:()=> "denied-lock-session"},
});
const before=runtime.getResumeSnapshot();
assert.equal(before.recommendationActionsBlocked,true);
const result=await runtime.recoverResumeRecommendationsWithSharedAuthority({locks:null});
assert.equal(result.acquired,false);
assert.equal(recoveries,0);
assert.equal(writes,0);
const after=runtime.getResumeSnapshot();
assert.equal(after.recommendationActionsBlocked,true);
console.log("GREEN: denied browser authority keeps resume recommendation actions blocked with zero recovery operations and zero writes.");

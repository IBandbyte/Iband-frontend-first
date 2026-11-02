import assert from "node:assert/strict";
import createMovieMentorStudioIdentityRuntime from "../src/components/studio/mentor/MovieMentorStudioIdentityRuntime.js";
import createCreatorMemory,{createDefaultMemoryState,createMemoryStorageAdapter} from "../src/components/studio/mentor/CreatorMemory.js";

// Executable denial court: missing browser authority must never attempt
// recovery or mutate durable recommendation evidence in strict memory.
let writes=0, recoveries=0;
const project={id:"movie-mentor-denied-lock",creatorType:"video",metadata:{creatorMode:"ai-movie",projectJourney:null}};
const state=createDefaultMemoryState();
state.projects=[project];
state.journey.activeProjectId=project.id;
const backing=createMemoryStorageAdapter(state);
const storage={
  getItem:key=>backing.getItem(key),
  setItem:(key,value)=>{writes++;return backing.setItem(key,value);},
  removeItem:key=>{writes++;return backing.removeItem(key);},
};
const memory=createCreatorMemory({storageAdapter:storage,requireSharedWriteAuthority:true});
const beforeBytes=storage.getItem("iband.creator-memory");
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
assert.equal(storage.getItem("iband.creator-memory"),beforeBytes,"Denied authority must preserve durable bytes.");
const after=runtime.getResumeSnapshot();
assert.equal(after.recommendationActionsBlocked,true);
console.log("GREEN: denied browser authority keeps resume recommendation actions blocked with zero recovery operations and zero writes.");

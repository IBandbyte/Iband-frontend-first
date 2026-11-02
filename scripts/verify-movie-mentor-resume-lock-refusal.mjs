import assert from "node:assert/strict";
import createMovieMentorStudioIdentityRuntime from "../src/components/studio/mentor/MovieMentorStudioIdentityRuntime.js";
import createCreatorMemory,{createDefaultMemoryState,createMemoryStorageAdapter} from "../src/components/studio/mentor/CreatorMemory.js";

// Executable refusal court: a real strict Creator Memory facade with an
// eligible persisted movie project must not write when the exclusive lock is refused.
let requested=0, executed=0, writes=0;
const project={id:"movie-mentor-contended-lock",creatorType:"video",metadata:{creatorMode:"ai-movie",projectJourney:null}};
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
const locks={async request(name,options,callback){
  requested++;
  assert.equal(name,"movie-mentor-creator-memory-recovery");
  assert.equal(options.mode,"exclusive");
  return callback(null);
}};
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
assert.equal(storage.getItem("iband.creator-memory"),beforeBytes,"Refused lock must preserve durable bytes.");
assert.equal(runtime.getResumeSnapshot().recommendationActionsBlocked,true);
console.log("GREEN: exclusive-lock refusal never executes recommendation recovery and leaves resume blocked.");

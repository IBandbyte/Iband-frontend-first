import assert from "node:assert/strict";
import createCreatorMemory,{createMemoryStorageAdapter} from "../src/components/studio/mentor/CreatorMemory.js";

// Two facades start with the same snapshot. An external writer commits a newer
// state before the strict facade requests authority. The coordinated transform
// must hydrate fresh bytes inside the lock, not overwrite the older snapshot.
const backing=createMemoryStorageAdapter();
const strict=createCreatorMemory({storageAdapter:backing,requireSharedWriteAuthority:true});
const competing=createCreatorMemory({storageAdapter:backing});
const baseline=strict.getState();
const changed=competing.getState();
changed.metadata={...(changed.metadata||{}),externalCommit:"must-survive"};
competing.replaceState(changed);
let requests=0,transforms=0;
const locks={async request(_name,_options,callback){
  requests++;
  return callback({name:"shared-memory-authority"});
}};
const result=await strict.replaceStateWithSharedAuthority({locks,transform:state=>{
  transforms++;
  assert.equal(state.metadata?.externalCommit,"must-survive","RED: transform did not hydrate the competing durable commit.");
  state.metadata={...(state.metadata||{}),coordinatedCommit:"preserved"};
  return state;
}});
assert.equal(result.acquired,true);
assert.equal(requests,1);
assert.equal(transforms,1);
const persisted=JSON.parse(backing.getItem("iband.creator-memory"));
assert.equal(persisted.metadata?.externalCommit,"must-survive","RED: coordinated write clobbered competing state.");
assert.equal(persisted.metadata?.coordinatedCommit,"preserved");
assert.notDeepEqual(strict.getState(),baseline,"Strict facade should adopt committed state.");
console.log("GREEN: coordinated strict writer hydrates fresh durable state under authority and preserves a prior competing commit; permissive legacy race remains RED.");

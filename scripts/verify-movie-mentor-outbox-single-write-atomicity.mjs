import assert from "node:assert/strict";
import createCreatorMemory from "../src/components/studio/mentor/CreatorMemory.js";

const bytes=new Map();
let writes=0;
const storage={
  getItem:key=>bytes.get(key)||null,
  setItem:(key,value)=>{writes++;bytes.set(key,value);},
  removeItem:key=>bytes.delete(key)
};
const locks={request:async(_name,_options,operation)=>operation({name:"exclusive"})};
const memory=createCreatorMemory({storageAdapter:storage,requireSharedWriteAuthority:true});
const baseline=writes;
const outcome=await memory.replaceStateWithSharedAuthority({
  locks,
  transform:state=>({...state,creatorProfile:{...state.creatorProfile,id:"single-write-court"}})
});
assert.equal(outcome.acquired,true);
assert.equal(writes-baseline,1,"RED: coordinated commit must issue exactly one durable storage write; digest repair must not add a second commit");
assert.equal(outcome.value.durablePublicationOutbox.length,1);
console.log("GREEN: coordinated outbox transaction persists in exactly one durable storage write.");

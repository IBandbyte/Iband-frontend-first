import assert from "node:assert/strict";
import createCreatorMemory from "../src/components/studio/mentor/CreatorMemory.js";
const bytes=new Map(),storage={getItem:k=>bytes.get(k)||null,setItem:(k,v)=>bytes.set(k,v),removeItem:k=>bytes.delete(k)};
let locked=false;
const locks={request:async(_name,_options,fn)=>{locked=true;try{return await fn({name:"exclusive"});}finally{locked=false;}}};
const memory=createCreatorMemory({storageAdapter:storage,requireSharedWriteAuthority:true});
const result=await memory.replaceStateWithSharedAuthority({locks,
 transform:state=>({...state,creatorProfile:{id:"outbox-proof"}}),
 onCommittedSnapshot:()=>{throw Error("simulate tab termination before notification");}});
assert.equal(result.acquired,true,"Writer commit must remain acknowledged");
const persisted=memory.readPersistedState();
assert.equal(persisted.creatorProfile.id,"outbox-proof");
assert.ok(Array.isArray(persisted.durablePublicationOutbox)&&persisted.durablePublicationOutbox.length===1,
 "RED: committed Creator Memory write must persist an atomic publication outbox entry before callback delivery");
assert.equal(persisted.durablePublicationOutbox[0].status,"pending");
assert.equal(locked,false);
console.log("GREEN: committed write and pending publication outbox survived failed notification.");

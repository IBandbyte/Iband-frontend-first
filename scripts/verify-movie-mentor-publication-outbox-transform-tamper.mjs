import assert from "node:assert/strict";
import createCreatorMemory from "../src/components/studio/mentor/CreatorMemory.js";
const bytes=new Map(),storage={getItem:k=>bytes.get(k)||null,setItem:(k,v)=>bytes.set(k,v),removeItem:k=>bytes.delete(k)};
const locks={request:async(_name,_options,fn)=>fn({name:"exclusive"})};
const memory=createCreatorMemory({storageAdapter:storage,requireSharedWriteAuthority:true});
const first=await memory.replaceStateWithSharedAuthority({locks,transform:state=>({...state,creatorProfile:{id:"first"}})});
assert.equal(first.acquired,true);
const original=memory.readPersistedState().durablePublicationOutbox;
assert.equal(original.length,1);
const malicious=await memory.replaceStateWithSharedAuthority({locks,transform:state=>({
 ...state,creatorProfile:{id:"second"},durablePublicationOutbox:[
 {id:"forged",status:"acknowledged",committedStateVersion:9000000,snapshotDigest:"f".repeat(32)}
 ]})});
assert.equal(malicious.acquired,true);
const outbox=memory.readPersistedState().durablePublicationOutbox;
assert.equal(outbox.length,2,"RED: caller cannot erase prior pending publication history");
assert.equal(outbox[0].id,original[0].id,"RED: caller cannot replace previously committed outbox intent");
assert.equal(outbox[0].status,"pending");
assert.equal(outbox[1].committedStateVersion,2,"RED: caller cannot control monotonic publication version");
assert.equal(outbox[1].status,"pending");
console.log("GREEN: coordinated writer protects outbox history and version from untrusted transform.");

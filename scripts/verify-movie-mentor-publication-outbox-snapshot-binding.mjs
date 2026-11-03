import assert from "node:assert/strict";
import createCreatorMemory from "../src/components/studio/mentor/CreatorMemory.js";
const bytes=new Map(),storage={getItem:k=>bytes.get(k)||null,setItem:(k,v)=>bytes.set(k,v),removeItem:k=>bytes.delete(k)};
const locks={request:async(_name,_options,fn)=>fn({name:"exclusive"})};
const memory=createCreatorMemory({storageAdapter:storage,requireSharedWriteAuthority:true});
const result=await memory.replaceStateWithSharedAuthority({locks,transform:state=>({...state,creatorProfile:{id:"snapshot-binding-proof"}})});
assert.equal(result.acquired,true);
const saved=memory.readPersistedState(),entries=saved.durablePublicationOutbox||[];
assert.equal(entries.length,1);
const entry=entries[0];
assert.ok(typeof entry.snapshotDigest==="string"&&entry.snapshotDigest.length>=32,
 "RED: outbox intent must bind to a deterministic digest of the committed Creator Memory snapshot");
assert.ok(typeof entry.committedStateVersion==="number"&&entry.committedStateVersion>=1,
 "RED: outbox must record a monotonic committed state version");
assert.equal(entry.status,"pending");
console.log("GREEN: atomic publication intent binds to committed snapshot digest and monotonic state version; publishing remains disabled.");

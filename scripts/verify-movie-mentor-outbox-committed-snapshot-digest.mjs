import assert from "node:assert/strict";
import createCreatorMemory from "../src/components/studio/mentor/CreatorMemory.js";

function fingerprint(value){
  const canonical=v=>Array.isArray(v)?v.map(canonical):v&&typeof v==="object"?Object.fromEntries(Object.keys(v).sort().map(k=>[k,canonical(v[k])])):v;
  const payload=JSON.stringify(canonical(value));
  return [2166136261,2246822519,3266489917,668265263].map(seed=>{
    let hash=seed>>>0;
    for(let i=0;i<payload.length;i++)hash=Math.imul(hash^payload.charCodeAt(i),16777619)>>>0;
    return hash.toString(16).padStart(8,"0");
  }).join("");
}
const bytes=new Map(),storage={getItem:key=>bytes.get(key)||null,setItem:(key,value)=>bytes.set(key,value),removeItem:key=>bytes.delete(key)};
const locks={request:async(_name,_options,operation)=>operation({name:"exclusive"})};
const memory=createCreatorMemory({storageAdapter:storage,requireSharedWriteAuthority:true});
for(const marker of ["first","second"]){
  const result=await memory.replaceStateWithSharedAuthority({locks,transform:state=>({...state,creatorProfile:{id:marker},unrecognisedCallerField:"caller-only"})});
  assert.equal(result.acquired,true);
  const snapshot=result.value;
  const ledger=snapshot.durablePublicationOutbox;
  assert.equal(ledger.length,marker==="first"?1:2);
  const {durablePublicationOutbox:_outbox,...committedContents}=snapshot;
  assert.equal(ledger.at(-1).snapshotDigest,fingerprint(committedContents),"RED: outbox fingerprint must bind the actual committed and rehydrated snapshot, not a pre-normalisation proposal");
  const reloaded=createCreatorMemory({storageAdapter:storage,requireSharedWriteAuthority:true}).getState();
  const {durablePublicationOutbox:_reloadOutbox,...reloadedContents}=reloaded;
  assert.equal(reloaded.durablePublicationOutbox.at(-1).snapshotDigest,fingerprint(reloadedContents),"RED: persisted reload must preserve exact committed snapshot binding");
}
console.log("GREEN: latest outbox digest binds actual committed and rehydrated state.");

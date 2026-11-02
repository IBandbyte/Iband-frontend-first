import assert from "node:assert/strict";
import createCreatorMemory,{createMemoryStorageAdapter} from "../src/components/studio/mentor/CreatorMemory.js";

// RED/compatibility boundary: the legacy race fixture remains independently
// unresolved. The strict Studio authority must fail closed even if a competing
// tab commits during the attempted ordinary synchronous mutation.
const backing=createMemoryStorageAdapter();
let injected=false;
const storage={
 getItem:key=>backing.getItem(key),
 setItem(key,value){
  if(!injected && key==="iband.creator-memory"){
   injected=true;
   backing.setItem(key,JSON.stringify({version:1,metadata:{otherTab:"committed"}}));
  }
  backing.setItem(key,value);
 },
 removeItem:key=>backing.removeItem(key),
};
const strict=createCreatorMemory({storageAdapter:storage,requireSharedWriteAuthority:true});
const before=backing.getItem("iband.creator-memory");
const next=strict.getState();
next.metadata={...(next.metadata||{}),strictAttempt:"unauthorised"};
assert.throws(()=>strict.replaceState(next),error=>error?.code==="CREATOR_MEMORY_WRITE_AUTHORITY_DENIED" || error?.cause?.code==="CREATOR_MEMORY_WRITE_AUTHORITY_DENIED",
 "Strict Studio memory must reject ordinary sync mutation before any durable setItem");
assert.equal(injected,false,"Strict ordinary writer must never enter the durable commit callback");
assert.equal(backing.getItem("iband.creator-memory"),before,"Strict refusal must leave durable bytes unchanged");
console.log("GREEN: strict Studio ordinary sync writes fail closed without reaching the check-to-commit race.");

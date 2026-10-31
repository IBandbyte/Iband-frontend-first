import assert from "node:assert/strict";
import {createCreatorMemory,createMemoryStorageAdapter} from "../src/components/studio/mentor/CreatorMemory.js";

// Physical two-writer court: two independent creator-memory runtimes share
// the same durable adapter. A stale ordinary writer must not overwrite
// a newer recovered state, even if its own write reads back successfully.
const storage=createMemoryStorageAdapter();
const staleOrdinaryWriter=createCreatorMemory({storageAdapter:storage});
const recoveryWriter=createCreatorMemory({storageAdapter:storage});
const recovered=recoveryWriter.getState();
recovered.metadata={...recovered.metadata,sharedWriterCourt:"recovered"};
recoveryWriter.replaceState(recovered);
assert.equal(JSON.parse(storage.getItem("iband.creator-memory")).metadata.sharedWriterCourt,"recovered","Recovery fixture must be durable before contention.");
const stale=staleOrdinaryWriter.getState();
stale.metadata={...stale.metadata,sharedWriterCourt:"stale-ordinary-writer"};
let refused=false;
try {staleOrdinaryWriter.replaceState(stale);} catch {refused=true;}
const final=JSON.parse(storage.getItem("iband.creator-memory"));
assert.equal(final.metadata.sharedWriterCourt,"recovered","A stale ordinary writer must never overwrite the recovered durable snapshot.");
assert.equal(refused,true,"Stale ordinary write must fail closed rather than report success.");
console.log("GREEN: stale ordinary writer fenced from recovered durable state.");

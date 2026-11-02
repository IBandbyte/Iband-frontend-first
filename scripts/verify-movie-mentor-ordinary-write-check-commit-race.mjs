import assert from "node:assert/strict";
import createCreatorMemory, {createMemoryStorageAdapter} from "../src/components/studio/mentor/CreatorMemory.js";

// Model two independent browser contexts sharing one durable backing store.
// Context B races a write into the exact interval after context A's baseline
// comparison and before A's setItem. A preflight read is not a CAS.
const backing = createMemoryStorageAdapter();
let inject = false;
let injected = false;
let competingValue = null;
const storageA = {
  getItem(key) { return backing.getItem(key); },
  setItem(key, value) {
    if (inject && !injected && key === "iband.creator-memory") {
      injected = true;
      competingValue = JSON.stringify({version:1,projects:[{id:"other-tab-project",title:"Other tab committed"}]});
      backing.setItem(key,competingValue);
    }
    backing.setItem(key,value);
  },
  removeItem(key) { backing.removeItem(key); },
};
const memoryA = createCreatorMemory({storageAdapter:storageA});
const memoryB = createCreatorMemory({storageAdapter:backing});
assert.ok(memoryA.getState());
assert.ok(memoryB.getState());
inject = true;
let refused = false;
try {
  const next = memoryA.getState();
  next.metadata = {...next.metadata,localWriter:"should-not-overwrite-other-tab"};
  memoryA.replaceState(next);
} catch { refused = true; }
assert.equal(injected,true,"Race fixture must physically inject the other-context write.");
assert.equal(refused,true,"RED: stale writer overwrote a competing commit between baseline check and setItem.");
assert.equal(backing.getItem("iband.creator-memory"),competingValue,
  "RED: other-context durable commit must survive the stale writer's attempted commit.");
console.log("GREEN: ordinary writer cannot overwrite a competing commit in the check-to-commit window.");

import assert from "node:assert/strict";
import createCreatorMemory, {createMemoryStorageAdapter} from "../src/components/studio/mentor/CreatorMemory.js";

// Compatibility contract before migrating recovery-sensitive writes to an
// asynchronous shared authority. Legacy callers currently expect synchronous
// return values and durable bytes before the method returns.
const storage=createMemoryStorageAdapter();
const writer=createCreatorMemory({storageAdapter:storage});
const initial=writer.getState();
assert.ok(initial && typeof initial==="object","Initial state must be synchronously readable.");
const changed=JSON.parse(JSON.stringify(initial));
changed.metadata={...(changed.metadata||{}),syncCompatibilityProbe:"persisted"};
const returned=writer.replaceState(changed);
assert.ok(!(returned instanceof Promise),"replaceState must not silently become async.");
assert.equal(writer.getState().metadata.syncCompatibilityProbe,"persisted");
const reader=createCreatorMemory({storageAdapter:storage});
assert.equal(reader.getState().metadata.syncCompatibilityProbe,"persisted","Durable write must be visible to a fresh reader before return.");
console.log("GREEN: legacy synchronous replacement retains immediate durable readback.");

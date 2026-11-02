import assert from "node:assert/strict";
import createResponseGenerator from "../src/components/studio/mentor/ResponseGenerator.js";
import createCreatorMemory,{createMemoryStorageAdapter} from "../src/components/studio/mentor/CreatorMemory.js";

// An injected memory service remains owned by its caller. Merely wrapping or
// replacing generator.getMemory() cannot revoke the original writer reference.
// This court must RED until the authority contract is enforced at the actual
// durable writer or the unsafe injection is explicitly refused.
const storage=createMemoryStorageAdapter();
const retained=createCreatorMemory({storageAdapter:storage});
const generator=createResponseGenerator({memory:retained});
assert.ok(generator.getMemory(),"Generator must expose its active memory contract.");
const before=storage.getItem("iband.creator-memory");
const state=retained.getState();
state.metadata={...(state.metadata||{}),retainedReferenceBypass:"uncoordinated"};
let denied=false;
try{retained.replaceState(state);}catch{denied=true;}
assert.equal(denied,true,"RED: caller-retained injected memory reference can still write outside generator authority.");
assert.equal(storage.getItem("iband.creator-memory"),before,"RED: caller-retained reference changed durable bytes.");
console.log("GREEN: caller-retained injected memory reference cannot bypass shared authority.");

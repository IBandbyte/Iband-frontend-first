import assert from "node:assert/strict";
import createResponseGenerator from "../src/components/studio/mentor/ResponseGenerator.js";
import createCreatorMemory,{createMemoryStorageAdapter} from "../src/components/studio/mentor/CreatorMemory.js";

// RED-first: distinguish a genuine strict CreatorMemory from a permissive
// instance without trusting caller-supplied booleans or spoofable method names.
// A retained permissive reference must be rejected before it reaches the generator.
const strictStorage=createMemoryStorageAdapter();
const strict=createCreatorMemory({storageAdapter:strictStorage,requireSharedWriteAuthority:true});
assert.equal(createResponseGenerator({memory:strict}).getMemory(),strict,
  "Strict externally owned CreatorMemory must retain identity and read access.");
assert.equal(createResponseGenerator({memoryFactory:()=>strict}).getMemory(),strict,
  "Strict factory injection must retain identity.");
const generator=createResponseGenerator();
assert.equal(generator.setMemory(strict),strict,
  "Strict setMemory must retain identity.");

const legacy=createCreatorMemory({storageAdapter:createMemoryStorageAdapter()});
for(const [label,inject] of [
  ["constructor",()=>createResponseGenerator({memory:legacy})],
  ["factory",()=>createResponseGenerator({memoryFactory:()=>legacy})],
  ["setMemory",()=>createResponseGenerator().setMemory(legacy)],
]) assert.throws(inject,error=>error?.code==="MOVIE_MENTOR_UNSAFE_MEMORY_AUTHORITY",
  `RED: ${label} accepted a permissive durable writer`);

const readOnly=Object.freeze({getMemoryContext:()=>({}),getState:()=>({})});
assert.equal(createResponseGenerator({memory:readOnly}).getMemory(),readOnly,
  "Read-only external services must remain compatible.");
console.log("GREEN: strict external memory is retained, unsafe durable writers are refused, read-only services remain compatible.");

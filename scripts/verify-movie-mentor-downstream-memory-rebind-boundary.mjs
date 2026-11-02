import assert from "node:assert/strict";
import {createCreatorMemoryEngine} from "../src/components/studio/mentor/CreatorMemoryEngine.js";
import {createAdaptiveMentorEngine} from "../src/components/studio/mentor/AdaptiveMentorEngine.js";

// RED court: lower-level constructors and rebinders must not accept a mutable
// unverified memory service that can execute durable instructions. The public
// response generator's injection gate is not exercised by these direct paths.
let writes=0;
const unsafe={
  getMemoryContext(){return {};},
  getState(){return {};},
  applyMemoryInstructions(instructions){writes+=instructions.length;return {applied:instructions,skipped:[],errors:[]};},
};
const instruction={type:"memory-upsert",payload:{text:"unverified mutation"}};
for(const [label,make] of [
  ["CreatorMemoryEngine",()=>createCreatorMemoryEngine()],
  ["AdaptiveMentorEngine",()=>createAdaptiveMentorEngine()],
]){
  const engine=make();
  let refused=false;
  try{engine.setMemory(unsafe);}
  catch(error){refused=error?.code==="MOVIE_MENTOR_UNSAFE_MEMORY_AUTHORITY";}
  assert.equal(refused,true,`RED: ${label}.setMemory accepted an unverified mutable memory adapter.`);
}
const direct=createCreatorMemoryEngine();
const plan={instructions:[instruction]};
let refusedOverride=false;
try{direct.applyMemoryPlan({plan,memory:unsafe});}
catch(error){refusedOverride=error?.code==="MOVIE_MENTOR_UNSAFE_MEMORY_AUTHORITY";}
assert.equal(refusedOverride,true,"RED: per-call memory override bypassed verified authority.");
assert.equal(writes,0,"Unverified memory adapter must not receive a persistence instruction.");
console.log("GREEN: lower-level memory rebind and per-call override refuse unverified mutable adapters.");

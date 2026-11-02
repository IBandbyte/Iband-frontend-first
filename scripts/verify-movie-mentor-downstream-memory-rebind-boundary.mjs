import assert from "node:assert/strict";
import createCreatorMemory,{createMemoryStorageAdapter} from "../src/components/studio/mentor/CreatorMemory.js";
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
// Compatibility: a genuine strict facade and a constrained read-only service
// must still be accepted by both lower-level engines.
const strict=createCreatorMemory({storageAdapter:createMemoryStorageAdapter(),requireSharedWriteAuthority:true});
const readOnly={getMemoryContext(){return {};},getState(){return {};}};
for(const [label,make] of [
  ["CreatorMemoryEngine",()=>createCreatorMemoryEngine()],
  ["AdaptiveMentorEngine",()=>createAdaptiveMentorEngine()],
]){
  for(const [kind,memory] of [["strict",strict],["read-only",readOnly]]){
    const engine=make();
    assert.equal(engine.setMemory(memory),memory,`${label} must preserve ${kind} memory identity.`);
    assert.equal(engine.getMemory(),memory,`${label} must retain ${kind} memory service.`);
  }
}
assert.equal(createCreatorMemoryEngine({memory:strict}).getMemory(),strict);
assert.equal(createAdaptiveMentorEngine({memory:strict}).getMemory(),strict);
assert.equal(createCreatorMemoryEngine({memory:readOnly}).getMemory(),readOnly);
assert.equal(createAdaptiveMentorEngine({memory:readOnly}).getMemory(),readOnly);
const cases=[
  ["CreatorMemoryEngine.setMemory",()=>createCreatorMemoryEngine().setMemory(unsafe)],
  ["AdaptiveMentorEngine.setMemory",()=>createAdaptiveMentorEngine().setMemory(unsafe)],
  ["CreatorMemoryEngine.applyMemoryPlan override",()=>createCreatorMemoryEngine().applyMemoryPlan({plan:{instructions:[instruction]},memory:unsafe})],
];
const results=[];
for(const [label,invoke] of cases){
  const before=writes;
  let refused=false,thrown=null;
  try{invoke();}
  catch(error){thrown=error;refused=error?.code==="MOVIE_MENTOR_UNSAFE_MEMORY_AUTHORITY";}
  results.push({label,refused,writeDelta:writes-before,errorCode:thrown?.code??null});
}
for(const result of results){
  console.log(JSON.stringify(result));
}
assert.equal(results.length,3);
for(const result of results){
  assert.equal(result.refused,true,`RED: ${result.label} did not reject an unverified mutable memory adapter.`);
  assert.equal(result.writeDelta,0,`RED: ${result.label} executed an unverified persistence instruction.`);
}
assert.equal(writes,0,"Unverified memory adapter must not receive any persistence instruction.");
console.log("GREEN: lower-level memory rebind and per-call override refuse unverified mutable adapters.");

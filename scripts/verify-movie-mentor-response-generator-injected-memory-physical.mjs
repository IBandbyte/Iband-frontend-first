import assert from "node:assert/strict";
import createResponseGenerator from "../src/components/studio/mentor/ResponseGenerator.js";
import createCreatorMemory,{createMemoryStorageAdapter} from "../src/components/studio/mentor/CreatorMemory.js";

// Physical, not regex: inject an otherwise valid legacy memory facade through
// each public entry point and attempt a synchronous durable mutation.
function probe(memory,label) {
  const storage=memory.storage;
  const generator=memory.generator;
  const active=generator.getMemory();
  assert.ok(active, `${label}: injected memory must be reachable`);
  const before=storage.getItem("iband.creator-memory");
  const next=active.getState();
  next.metadata={...(next.metadata||{}),injectedBypass:label};
  let refused=false;
  try {active.replaceState(next);} catch {refused=true;}
  assert.equal(refused,true,`RED: ${label} permits an uncoordinated synchronous durable write`);
  assert.equal(storage.getItem("iband.creator-memory"),before,`${label}: denied write must preserve bytes`);
}
const firstStorage=createMemoryStorageAdapter();
const first=createCreatorMemory({storageAdapter:firstStorage});
probe({storage:firstStorage,generator:createResponseGenerator({memory:first})},"constructor memory");
const secondStorage=createMemoryStorageAdapter();
const second=createCreatorMemory({storageAdapter:secondStorage});
probe({storage:secondStorage,generator:createResponseGenerator({memoryFactory:()=>second})},"injected memoryFactory");
const thirdStorage=createMemoryStorageAdapter();
const third=createCreatorMemory({storageAdapter:thirdStorage});
const thirdGenerator=createResponseGenerator();
thirdGenerator.setMemory(third);
probe({storage:thirdStorage,generator:thirdGenerator},"setMemory");
console.log("GREEN: all three injected memory entry points physically deny uncoordinated writes.");

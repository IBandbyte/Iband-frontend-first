import assert from "node:assert/strict";
import createCreatorMemory, {createMemoryStorageAdapter} from "../src/components/studio/mentor/CreatorMemory.js";
import createMovieMentorStudioIdentityRuntime from "../src/components/studio/mentor/MovieMentorStudioIdentityRuntime.js";

// Caller migration contract: retain synchronous ensureProject compatibility,
// but expose an explicit coordinated asynchronous creation path. No implicit
// fallback to an uncoordinated ordinary write when authority is unavailable.
const storage = createMemoryStorageAdapter();
const memory = createCreatorMemory({storageAdapter:storage,requireSharedWriteAuthority:true});
const runtime = createMovieMentorStudioIdentityRuntime({memory});
assert.equal(typeof runtime.ensureProject,"function","Legacy sync caller contract must remain present.");
assert.equal(typeof runtime.ensureProjectWithSharedAuthority,"function",
  "RED: Studio must expose explicit coordinated project creation.");
const denied = await runtime.ensureProjectWithSharedAuthority({title:"Denied movie",locks:null});
assert.equal(denied.acquired,false,"Missing browser lock must fail closed.");
assert.equal((createCreatorMemory({storageAdapter:storage}).getState().projects||[]).some(p=>p.title==="Denied movie"),false,
  "Denied coordinated creation must not persist a project.");
let lockCalls = 0;
const locks = {request:async(name,options,callback)=>{
  lockCalls++;
  assert.equal(name,"movie-mentor-creator-memory-recovery");
  assert.equal(options.mode,"exclusive");
  return callback({name});
}};
const created = await runtime.ensureProjectWithSharedAuthority({title:"Coordinated movie",locks});
assert.equal(created.acquired,true,"Coordinated Studio creation must acquire authority.");
assert.equal(lockCalls,1,"Creation must use one shared exclusive authority transaction.");
const projects = createCreatorMemory({storageAdapter:storage}).getState().projects||[];
assert.equal(projects.filter(p=>p.title==="Coordinated movie").length,1,
  "Coordinated Studio creation must durably persist exactly one project.");
console.log("GREEN: Studio has explicit coordinated creation with fail-closed denial and durable commit.");

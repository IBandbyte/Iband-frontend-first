import assert from "node:assert/strict";
import {createMovieMentorStudioIdentityRuntime} from "../src/components/studio/mentor/MovieMentorStudioIdentityRuntime.js";
import {createCreatorMemory,createMemoryStorageAdapter} from "../src/components/studio/mentor/CreatorMemory.js";

const backing=createMemoryStorageAdapter();
const runtime=createMovieMentorStudioIdentityRuntime({
  memory:createCreatorMemory({storageAdapter:backing,requireSharedWriteAuthority:true}),
  cryptoImpl:{randomUUID:()=> "studio-strict-contract-session"},
  settlementLockManager:null,
});
assert.ok(runtime.memory.getState(),"Strict Studio must preserve memory reads.");
assert.equal(typeof runtime.getActiveProject,"function");
assert.equal(typeof runtime.getPreferredJourney,"function");
assert.equal(typeof runtime.ensureProjectWithSharedAuthority,"function");
assert.equal(typeof runtime.persistJourneyWithSharedAuthority,"function");
assert.throws(()=>runtime.ensureProject({title:"Blocked legacy project"}),
  error=>error?.code==="MOVIE_MENTOR_LEGACY_PROJECT_WRITE_DENIED");
const before=backing.getItem("iband.creator-memory");
const denied=await runtime.ensureProjectWithSharedAuthority({title:"No lock available",locks:null});
assert.equal(denied?.acquired,false,"Coordinated creation must fail closed without lock authority.");
assert.equal(backing.getItem("iband.creator-memory"),before,"Denied creation must not alter durable storage.");
console.log("GREEN: strict Studio reads and coordinated entry points remain available; uncoordinated creation denied.");

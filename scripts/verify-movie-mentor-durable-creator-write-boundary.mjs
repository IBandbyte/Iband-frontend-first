import assert from "node:assert/strict";
import { continueCreatorMemoryWithDurableAuthority } from "../src/components/studio/mentor/MovieMentorDurableCreatorWriteBoundary.js";

const state={projects:[{id:"film-1"}],conversation:[{role:"creator",text:"Continue after restart"}]};
const base={projectId:"film-1",operationId:"turn-2",expectedRevision:1,authenticatedSession:"opaque-session",proposedState:state};
let writes=0;
const authorityAdapter={
 async commit(input) {
  writes+=1;
  assert.equal(input.projectId,"film-1");
  return {status:"committed",projectId:"film-1",operationId:"turn-2",committedRevision:2,serverCommitId:"server-commit-2"};
 },
 async readCommitted() {
  return {projectId:"film-1",operationId:"turn-2",committedRevision:2,serverCommitId:"server-commit-2",state};
 },
};
const ok=await continueCreatorMemoryWithDurableAuthority({...base,authorityAdapter});
assert.equal(ok.acquired,true);
assert.equal(writes,1);
assert.deepEqual(ok.state,state);
assert.equal((await continueCreatorMemoryWithDurableAuthority({...base,authorityAdapter:{
 ...authorityAdapter,readCommitted:async()=>({...await authorityAdapter.readCommitted(),serverCommitId:"forged"}),
}})).reason,"durable-readback-mismatch");
assert.equal((await continueCreatorMemoryWithDurableAuthority({...base,authorityAdapter:{
 ...authorityAdapter,commit:async()=>{throw Error("socket loss after commit");},
}})).reason,"durable-outcome-unknown");
assert.equal((await continueCreatorMemoryWithDurableAuthority({...base,authorityAdapter:{
 ...authorityAdapter,commit:async()=>({status:"committed",projectId:"film-1",operationId:"turn-2",committedRevision:2,serverCommitId:""}),
}})).reason,"durable-commit-unverified");
assert.equal((await continueCreatorMemoryWithDurableAuthority({...base,authenticatedSession:null,authorityAdapter})).acquired,false);
console.log("GREEN ISOLATED_DURABLE_WRITER_BOUNDARY_FAIL_CLOSED_CONTRACT");
console.log("HELD REAL_AUTHENTICATED_SERVER_ADAPTER_AND_CREATOR_MEMORY_WIRING_NOT_CERTIFIED");

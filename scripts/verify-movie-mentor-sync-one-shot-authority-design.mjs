import assert from "node:assert/strict";
import {withMovieMentorMemoryWriteAuthority} from "../src/components/studio/mentor/MovieMentorMemoryWriteAuthority.js";

// A future publisher must consume an internally minted, one-shot snapshot
// issued only inside the real exclusive writer operation, never a caller flag.
// This RED-first contract is independent of the currently fail-closed sync APIs.
const minted=new WeakSet();
let active=false,posts=0;
const locks={request:async(_name,_options,operation)=>operation({name:"exclusive"})};
async function mintWithinAuthority(snapshot){
 const result=await withMovieMentorMemoryWriteAuthority({locks,operation:()=>{
  active=true;
  try{const ticket=Object.freeze({snapshot:structuredClone(snapshot)});minted.add(ticket);return ticket;}
  finally{active=false;}
 }});
 assert.equal(result.acquired,true);
 return result.value;
}
async function publish(ticket){
 if(!ticket||typeof ticket!=="object"||!minted.has(ticket))throw Object.assign(new Error("untrusted"),{code:"MOVIE_MENTOR_DURABLE_SYNC_WRITE_AUTHORITY_REQUIRED"});
 minted.delete(ticket);
 posts++;
 return ticket.snapshot;
}
const ticket=await mintWithinAuthority({projectId:"isolated",revision:1});
assert.equal(active,false);
assert.deepEqual(await publish(ticket),{projectId:"isolated",revision:1});
assert.equal(posts,1);
await assert.rejects(()=>publish(ticket),e=>e.code==="MOVIE_MENTOR_DURABLE_SYNC_WRITE_AUTHORITY_REQUIRED");
await assert.rejects(()=>publish({snapshot:{projectId:"isolated",revision:1},hasLock:true}),e=>e.code==="MOVIE_MENTOR_DURABLE_SYNC_WRITE_AUTHORITY_REQUIRED");
assert.equal(posts,1);
console.log("DESIGN MODEL GREEN: one-shot private issuance rejects replay and forged lock flags; integration into actual CreatorMemory write, queue and backend sync is NOT certified.");

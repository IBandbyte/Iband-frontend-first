import assert from "node:assert/strict";
import {MOVIE_MENTOR_SHARED_MEMORY_WRITE_COORDINATION as name,withMovieMentorMemoryWriteAuthority as withAuthority} from "../src/components/studio/mentor/MovieMentorMemoryWriteAuthority.js";
let occupied=false,invocations=0;
const locks={request:async(lockName,options,callback)=>{
 assert.equal(lockName,name);
 assert.deepEqual(options,{mode:"exclusive",ifAvailable:true});
 if(occupied)return callback(null);
 occupied=true;
 try{return await callback({name:lockName});}finally{occupied=false;}
}};
const result=await withAuthority({locks,operation:async()=>{
 const denied=await withAuthority({locks,operation:()=>{invocations++;}});
 assert.equal(denied.acquired,false);
 assert.equal(denied.reason,"exclusive-lock-unavailable");
 return "recovered";
}});
assert.equal(result.acquired,true);
assert.equal(result.value,"recovered");
assert.equal(invocations,0,"Contending async writer must never execute.");
assert.equal((await withAuthority({operation:()=>{invocations++;}})).acquired,false);
assert.equal(invocations,0,"Missing locks must fail closed.");
console.log("GREEN: asynchronous shared authority excludes contending writers and fails closed.");

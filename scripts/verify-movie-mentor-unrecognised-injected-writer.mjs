import assert from "node:assert/strict";
import createResponseGenerator from "../src/components/studio/mentor/ResponseGenerator.js";

// RED-first adversarial adapter: the generator's current method-name screen
// cannot prove read-only status merely because a writer has an unfamiliar name.
let durableWrites=0;
const unverified={
 getState:()=>({}),
 commitToStorage:()=>{durableWrites+=1;},
};
assert.throws(
 ()=>createResponseGenerator({memory:unverified}),
 error=>error?.code==="MOVIE_MENTOR_UNSAFE_MEMORY_AUTHORITY",
 "RED: writable adapter with an unrecognised mutation method entered the generator"
);
assert.equal(durableWrites,0,"Rejected adapter must not have been invoked.");
console.log("GREEN: unverified writable adapter cannot bypass authority through a novel method name.");

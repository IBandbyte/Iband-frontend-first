import assert from "node:assert/strict";
import {projectMemoryContext,creatorConfirmedContext,syncMovieMentorDurableState,getExpectedRevision} from "../src/components/studio/mentor/MovieMentorDurableStateSync.js";
const map=new Map();const storage={getItem:k=>map.get(k)||null,setItem:(k,v)=>map.set(k,v)};
const memoryState={creatorProfile:{id:"creator-1",preferredTone:"warm"},projects:[{id:"p1",title:"Mystery"},{id:"p2",title:"Other"}],projectMemories:[{id:"m1",projectId:"p1",content:"red door"},{id:"m2",projectId:"p2",content:"leak"}],journey:{activeProjectId:"p1",recentStage:"premise"}};
assert.equal(projectMemoryContext(memoryState,"p1").projectMemories.length,1);assert.equal(projectMemoryContext(memoryState,"p1").projectMemories[0].content,"red door");assert.equal(creatorConfirmedContext(memoryState,"p1")[1].value.title,"Mystery");
let body=null;const fetchImpl=async(_url,options)=>{body=JSON.parse(options.body);return{ok:true,status:200,json:async()=>({success:true,state:{revision:1}})}};
await syncMovieMentorDurableState({projectId:"p1",creatorSessionId:"s1",memoryState,fetchImpl,storage});assert.equal(body.expectedRevision,0);assert.equal(body.source,"creator-memory");assert.equal(body.state.memoryContext.projectMemories.length,1);assert.equal(getExpectedRevision({projectId:"p1",creatorSessionId:"s1",storage}),1);assert.equal("revision" in body.state,false);assert.equal("creatorStateFingerprint" in body.state,false);
console.log("Movie Mentor frontend durable state sync verification: PASS");

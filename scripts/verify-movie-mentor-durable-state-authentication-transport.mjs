import assert from "node:assert/strict";
import fs from "node:fs";
import { syncMovieMentorDurableState } from "../src/components/studio/mentor/MovieMentorDurableStateSync.js";

const source=fs.readFileSync(new URL("../src/components/studio/mentor/MovieMentorDurableStateSync.js",import.meta.url),"utf8");
assert.match(source,/getMovieMentorCreatorAuthToken/);
assert.match(source,/"Authorization":`Bearer \$\{token\}`/);
assert.match(source,/\/api\/movie-mentor\/state\/sync/);
assert.doesNotMatch(source,/principalId\s*:/);
assert.doesNotMatch(source,/userId\s*:/);
assert.doesNotMatch(source,/(localStorage|sessionStorage)\s*\.\s*setItem\s*\([^)]*(token|bearer)/i);

const memoryState={creatorProfile:{id:"creator-5a22"},projects:[{id:"project-5a22",title:"Authority"}],journey:{activeProjectId:"project-5a22",stageId:"idea"}};
const storageMap=new Map();const storage={getItem:k=>storageMap.get(k)||null,setItem:(k,v)=>storageMap.set(k,String(v))};
let fetchCalls=0;
await assert.rejects(()=>syncMovieMentorDurableState({projectId:"project-5a22",memoryState,storage,getAuthToken:async()=>"",fetchImpl:async()=>{fetchCalls+=1;throw new Error("must not fetch");}}),error=>error?.code==="MOVIE_MENTOR_DURABLE_STATE_SYNC_AUTH_REQUIRED");
assert.equal(fetchCalls,0,"state sync must not reach backend without authenticated bearer authority");

let captured=null;
await syncMovieMentorDurableState({projectId:"project-5a22",memoryState,storage,getAuthToken:async()=>"creator-5a22-token",fetchImpl:async(url,options)=>{fetchCalls+=1;captured={url,options,body:JSON.parse(options.body)};return{ok:true,status:200,json:async()=>({success:true,state:{revision:1}})}}});
assert.ok(captured.url.endsWith("/api/movie-mentor/state/sync"));
assert.equal(captured.options.headers.Authorization,"Bearer creator-5a22-token");
assert.equal(captured.body.projectId,"project-5a22");
assert.equal("principalId" in captured.body,false);
assert.equal("userId" in captured.body,false);
assert.equal(captured.body.expectedRevision,0);
assert.equal(captured.body.state.projectJourney.stageId,"idea");

console.log("PASS 5A.22: durable creator-state sync fails closed without auth and transports only the current certified bearer token; browser identity remains non-authoritative.");

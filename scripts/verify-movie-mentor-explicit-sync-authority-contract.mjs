import assert from "node:assert/strict";
import {enqueueMovieMentorDurableStateSync,flushMovieMentorDurableStateSync,syncMovieMentorDurableState} from "../src/components/studio/mentor/MovieMentorDurableStateSync.js";
// RED-first: explicit entry points are still callable without a shared-writer
// authority, and a bearer token alone must not be treated as that authority.
const projectId="isolated-explicit-sync-authority";
const state={creatorProfile:{id:"isolated-creator"},projects:[{id:projectId}],journey:{activeProjectId:projectId},
 projectMemories:[{id:"uncoordinated",projectId,metadata:{uncoordinatedWriteMarker:"direct-explicit-api"}}]};
const values=new Map(),storage={getItem:key=>values.get(key)||null,setItem:(key,value)=>values.set(key,value)};
let posts=0;
const fetchImpl=async(_url,options)=>{posts++;const body=JSON.parse(options.body);return{ok:true,status:200,json:async()=>({success:true,state:{revision:body.expectedRevision+1}})};};
const getAuthToken=async()=>"isolated-bearer-token";
await assert.rejects(()=>syncMovieMentorDurableState({projectId,memoryState:state,storage,fetchImpl,getAuthToken}),
 error=>error?.code==="MOVIE_MENTOR_DURABLE_SYNC_WRITE_AUTHORITY_REQUIRED");
assert.equal(posts,0,"Direct sync without coordinated writer authority must not POST");
const enqueued=enqueueMovieMentorDurableStateSync({memoryState:state,storage,fetchImpl,getAuthToken});
assert.equal(enqueued,null,"Explicit enqueue without writer authority must fail closed");
await flushMovieMentorDurableStateSync({projectId,storage,fetchImpl,getAuthToken});
assert.equal(posts,0,"Uncoordinated explicit enqueue must not reach backend");
console.log("GREEN: direct and queued explicit sync fail closed without coordinated writer authority.");

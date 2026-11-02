import assert from "node:assert/strict";
import {syncMovieMentorDurableState,getDurableSyncStatus,getExpectedRevision} from "../src/components/studio/mentor/MovieMentorDurableStateSync.js";

const memoryState={creatorProfile:{id:"creator-ack"},projects:[{id:"project-ack",title:"Revision Court"}],journey:{activeProjectId:"project-ack",stageId:"premise"}};
const cases=[
 {name:"missing revision",state:{}},
 {name:"null revision",state:{revision:null}},
 {name:"string revision",state:{revision:"green"}},
 {name:"stale revision",state:{revision:0}},
 {name:"skipped revision",state:{revision:47}}
];
for(const scenario of cases){
 const entries=new Map();
 const storage={getItem:key=>entries.has(key)?entries.get(key):null,setItem:(key,value)=>entries.set(key,String(value))};
 const fetchImpl=async()=>({ok:true,status:200,json:async()=>({success:true,state:scenario.state})});
 await assert.rejects(
  ()=>syncMovieMentorDurableState({projectId:"project-ack",memoryState,storage,fetchImpl,getAuthToken:async()=>"test-bearer"}),
  error=>error?.code==="MOVIE_MENTOR_DURABLE_STATE_SYNC_INVALID_ACKNOWLEDGEMENT",
  scenario.name+" must fail closed"
 );
 assert.notEqual(getDurableSyncStatus({projectId:"project-ack",storage})?.status,"acknowledged",scenario.name+" must not certify a save");
 assert.equal(getExpectedRevision({projectId:"project-ack",storage}),0,scenario.name+" must not advance revision");
}
{
 const entries=new Map();
 const storage={getItem:key=>entries.has(key)?entries.get(key):null,setItem:(key,value)=>entries.set(key,String(value))};
 const fetchImpl=async()=>({ok:true,status:200,json:async()=>({success:true,state:{revision:1}})});
 await syncMovieMentorDurableState({projectId:"project-ack",memoryState,storage,fetchImpl,getAuthToken:async()=>"test-bearer"});
 assert.equal(getDurableSyncStatus({projectId:"project-ack",storage})?.status,"acknowledged");
 assert.equal(getExpectedRevision({projectId:"project-ack",storage}),1);
}
console.log("PASS: invalid acknowledgements fail closed; valid increment acknowledges");

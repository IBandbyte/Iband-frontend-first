import assert from "node:assert/strict";
import createStore from "../src/components/studio/mentor/JourneyDurableAuthorityStore.js";
import createProgression from "../src/components/studio/mentor/JourneyProgressionExecutionRuntime.js";
import createAcceptance from "../src/components/studio/mentor/JourneyRecommendationAcceptanceExecutionRuntime.js";
import createEnvelope from "../src/components/studio/mentor/JourneyRecommendationEnvelope.js";

const clone = x => JSON.parse(JSON.stringify(x));
const defer = () => {let resolve; const promise=new Promise(r=>resolve=r);return {promise,resolve};};
const timeout = (p,label) => Promise.race([p,new Promise((_,reject)=>setTimeout(()=>reject(new Error("TIMEOUT "+label)),5000))]);
async function court(noMovement) {
 const pid="acceptance-physical-"+(noMovement?"noop":"movement");
 const journey={projectId:pid,status:"active",currentStageId:"idea",currentTaskId:"seed",resumePoint:{stageId:"idea",taskId:"seed"},progression:{schemaVersion:1,revision:0,lastCommittedOperation:null,committedOperations:[]},stages:[{id:"idea",tasks:[{id:"seed",status:"active"}]},{id:"story",tasks:[{id:"premise",status:"not-started"}]}]};
 const project={id:pid,creatorType:"video",identity:{domain:"iband.movie-mentor.project",schema:1,issuance:"secure-web-crypto",legacy:false},metadata:{creatorMode:"ai-movie",projectJourney:clone(journey)}};
 const map=new Map(),storage={getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,String(v)),removeItem:k=>map.delete(k)};
 const entered=defer(),attempted=defer(),release=defer(),events=[],tails=new Map();let entries=0;
 const locks={async request(name,opts,callback){
   assert.equal(opts.mode,"exclusive");
   if(tails.has(name))attempted.resolve();
   const previous=tails.get(name)||Promise.resolve(),done=defer();
   const tail=previous.catch(()=>{}).then(()=>done.promise);tails.set(name,tail);
   await previous.catch(()=>{});
   const n=++entries;events.push("enter-"+n);
   try{if(n===1){entered.resolve();await release.promise}return await callback({name})}
   finally{events.push("exit-"+n);done.resolve();if(tails.get(name)===tail)tails.delete(name)}
 }};
 const original=Object.getOwnPropertyDescriptor(globalThis,"navigator");
 Object.defineProperty(globalThis,"navigator",{configurable:true,value:{locks}});
 try{
  const engine={getStage:(j,id)=>j.stages.find(s=>s.id===id)||null,setCurrentPosition(j,{stageId,taskId=null}){const n=clone(j);n.currentStageId=stageId;n.currentTaskId=taskId||n.stages.find(s=>s.id===stageId)?.tasks?.[0]?.id||null;n.resumePoint={stageId,taskId:n.currentTaskId};return n}};
  const make=()=>{
   const store=createStore({storage,browserRuntime:false});
   const identity={memory:{getProject:id=>id===pid?clone(project):null,getPersistedProject:id=>id===pid?clone(project):null},getPreferredJourney(id){if(id!==pid)return null;const record=store.read(pid,{project});return {projectJourney:clone(record?.journey||journey)}}};
   const progression=createProgression({journeyEngine:engine,identityRuntime:identity,authorityStore:store});
   return {store,runtime:createAcceptance({identityRuntime:identity,progressionRuntime:progression,authorityStore:store})};
  };
  const a=make(),b=make();
  const envelope=createEnvelope({projectId:pid,projectJourney:journey,planningEvidence:{contractVersion:"1.1.0",currentStageId:"idea",currentTaskId:"seed",creatorAuthorityRevision:7,recommendation:{recommendedStageId:noMovement?"idea":"story",recommendedTaskId:noMovement?"seed":"premise"},clarification:{required:false,reasons:[]},provenance:{turnRevision:11,bridgeVersion:"1.5.0"}},issuedAt:"2026-11-03T12:00:00.000Z"});
  assert.ok(envelope);
  const args={recommendationEnvelope:envelope,projectId:pid,creatorGesture:true,creatorAuthorityRevision:7,turnRevision:11,issuedAt:"2026-11-03T12:01:00.000Z"};
  const first=a.runtime.execute({...args,creatorActId:"act-A"});
  await timeout(entered.promise,"first lock entry");
  const second=b.runtime.execute({...args,creatorActId:"act-B"});
  await timeout(attempted.promise,"second lock attempt");
  await Promise.resolve();assert.deepEqual(events,["enter-1"],"RED: second caller entered before release");
  release.resolve();
  const results=await timeout(Promise.allSettled([first,second]),"settlement");
  assert.equal(results[0].status,"fulfilled","RED: first acceptance failed");
  const record=a.store.read(pid,{project});assert.ok(record);
  if(noMovement){
    assert.equal(record.journey.progression.revision,0);
    assert.equal(record.authority.generation,1,"RED: duplicate no-op authority generation");
    assert.equal(record.recommendations.length,1);
    assert.equal(record.recommendations[0].lifecycle.terminalReason,"consumed");
    assert.ok(["already-consumed-no-movement","accepted-no-movement-required"].includes(results[1].status==="fulfilled"?results[1].value.status:""),"RED: second no-op acceptance did not reconcile");
  }else{
    assert.equal(record.journey.progression.revision,1,"RED: double movement");
    assert.equal(record.journey.progression.committedOperations.length,1,"RED: duplicate receipt");
    assert.equal(record.journey.currentStageId,"story");
    assert.ok(results[1].status==="fulfilled"&&results[1].value.status==="already-committed" || results[1].status==="rejected"&&results[1].reason?.code==="JOURNEY_POSITION_AUTHORITY_STALE","RED: second movement outcome unexpected");
  }
  assert.deepEqual(events,["enter-1","exit-1","enter-2","exit-2"]);
  console.log("GREEN: "+(noMovement?"no-movement":"movement")+" simultaneous acceptance serialized and durable authority verified; second="+(results[1].status==="fulfilled"?results[1].value.status:results[1].reason?.code));
 }finally{release.resolve();if(original)Object.defineProperty(globalThis,"navigator",original);else delete globalThis.navigator}
}
await court(false);
await court(true);
console.log("LIMITATION: simulated Web Locks in one Node process; no real multi-tab browser or mid-setItem interleaving.");

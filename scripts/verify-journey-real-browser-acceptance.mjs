import assert from "node:assert/strict";
import { chromium } from "playwright";
import { spawn } from "node:child_process";

const port = 4179;
const server = spawn("npx", ["vite", "--host", "127.0.0.1", "--port", String(port), "--strictPort"], { stdio: "pipe" });
let output = "";
server.stdout.on("data", chunk => { output += chunk.toString(); });
server.stderr.on("data", chunk => { output += chunk.toString(); });
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
async function waitForServer() {
  for (let i=0;i<100;i++) {
    if(server.exitCode !== null) throw new Error("Vite exited: "+output);
    try {const r=await fetch("http://127.0.0.1:"+port+"/");if(r.ok)return;}catch{}
    await sleep(100);
  }
  throw new Error("Vite did not start: "+output);
}
let browser;
try {
 await waitForServer();
 browser=await chromium.launch({headless:true});
 const context=await browser.newContext();
 async function court(noop) {
   const projectId="browser-real-lock-"+(noop?"noop":"movement");
   const first=await context.newPage(),second=await context.newPage();
   await Promise.all([first.goto("http://127.0.0.1:"+port+"/"),second.goto("http://127.0.0.1:"+port+"/")]);
   const setup=async(page)=>page.evaluate(async({projectId,noop})=>{
     const base="/src/components/studio/mentor/";
     const [{default:createStore},{default:createProgression},{default:createAcceptance},{default:createEnvelope}]=await Promise.all([
       import(base+"JourneyDurableAuthorityStore.js"),import(base+"JourneyProgressionExecutionRuntime.js"),
       import(base+"JourneyRecommendationAcceptanceExecutionRuntime.js"),import(base+"JourneyRecommendationEnvelope.js")
     ]);
     const clone=x=>JSON.parse(JSON.stringify(x));
     const journey={projectId,status:"active",currentStageId:"idea",currentTaskId:"seed",resumePoint:{stageId:"idea",taskId:"seed"},progression:{schemaVersion:1,revision:0,lastCommittedOperation:null,committedOperations:[]},stages:[{id:"idea",tasks:[{id:"seed",status:"active"}]},{id:"story",tasks:[{id:"premise",status:"not-started"}]}]};
     const project={id:projectId,creatorType:"video",identity:{domain:"iband.movie-mentor.project",schema:1,issuance:"secure-web-crypto",legacy:false},metadata:{creatorMode:"ai-movie",projectJourney:clone(journey)}};
     const store=createStore();
     const identity={memory:{getProject:id=>id===projectId?clone(project):null,getPersistedProject:id=>id===projectId?clone(project):null},getPreferredJourney(id){if(id!==projectId)return null;const record=store.read(projectId,{project});return {projectJourney:clone(record?.journey||journey)}}};
     const engine={getStage:(j,id)=>j.stages.find(s=>s.id===id)||null,setCurrentPosition(j,{stageId,taskId=null}){const n=clone(j);n.currentStageId=stageId;n.currentTaskId=taskId||n.stages.find(s=>s.id===stageId)?.tasks?.[0]?.id||null;n.resumePoint={stageId,taskId:n.currentTaskId};return n}};
     const progression=createProgression({journeyEngine:engine,identityRuntime:identity,authorityStore:store});
     const acceptance=createAcceptance({identityRuntime:identity,progressionRuntime:progression,authorityStore:store});
     const envelope=createEnvelope({projectId,projectJourney:journey,planningEvidence:{contractVersion:"1.1.0",currentStageId:"idea",currentTaskId:"seed",creatorAuthorityRevision:7,recommendation:{recommendedStageId:noop?"idea":"story",recommendedTaskId:noop?"seed":"premise"},clarification:{required:false,reasons:[]},provenance:{turnRevision:11,bridgeVersion:"1.5.0"}},issuedAt:"2026-11-03T12:00:00.000Z"});
     if(!envelope)throw new Error("Envelope missing");
     window.__court={project,store,acceptance,envelope};
     return true;
   },{projectId,noop});
   await Promise.all([setup(first),setup(second)]);
   const lockName="iband:movie-mentor:journey-progression:"+projectId;
   await first.evaluate(async lockName=>{
     window.__lockReady=new Promise(resolve=>window.__signalLockReady=resolve);
     window.__holdLock=navigator.locks.request(lockName,{mode:"exclusive"},async()=>{
       window.__signalLockReady();
       await new Promise(resolve=>window.__releaseLock=resolve);
     });
     await window.__lockReady;
   },lockName);
   const run=(page,act)=>page.evaluate(async({projectId,act})=>{
     try{
       const r=await window.__court.acceptance.execute({recommendationEnvelope:window.__court.envelope,projectId,creatorActId:act,creatorGesture:true,creatorAuthorityRevision:7,turnRevision:11,issuedAt:"2026-11-03T12:01:00.000Z"});
       return {status:r.status};
     }catch(e){return {error:e.code||e.message};}
   },{projectId,act});
   const pA=run(second,"browser-A");
   await sleep(100);
   const pB=run(first,"browser-B");
   await sleep(100);
   const held=await first.evaluate(async lockName=>navigator.locks.query().then(q=>({held:q.held.filter(x=>x.name===lockName).length,pending:q.pending.filter(x=>x.name===lockName).length})),lockName);
   assert.equal(held.held,1,"RED: no held browser Web Lock");
   assert.equal(held.pending,2,"RED: two acceptance callers were not queued in genuine browser Web Locks");
   await first.evaluate(()=>window.__releaseLock());
   const [a,b]=await Promise.all([pA,pB]);
   const record=await first.evaluate(({projectId})=>window.__court.store.read(projectId,{project:window.__court.project}),{projectId});
   assert.ok(record,"RED: missing durable authority");
   if(noop){
     assert.equal(record.journey.progression.revision,0);
     assert.equal(record.authority.generation,1,"RED: duplicate no-op generation");
     assert.equal(record.recommendations.length,1);
     assert.equal(record.recommendations[0].lifecycle.terminalReason,"consumed");
     assert.deepEqual([a.status,b.status],["accepted-no-movement-required","already-consumed-no-movement"]);
   }else{
     assert.equal(record.journey.progression.revision,1,"RED: double progression");
     assert.equal(record.journey.progression.committedOperations.length,1,"RED: duplicate receipt");
     assert.deepEqual([a.status,b.status],["committed","already-committed"]);
   }
   console.log("GREEN: real browser tabs "+(noop?"no-movement":"movement")+" queued under Web Locks; durable authority single commit; "+a.status+" / "+b.status);
   await Promise.all([first.close(),second.close()]);
 }
 await court(false);
 await court(true);
 console.log("LIMITATION: two same-origin tabs in one Chromium browser context; does not simulate noncooperating setItem injection or separate browser profiles.");
} finally {
 if(browser)await browser.close();
 server.kill("SIGTERM");
}

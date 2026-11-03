import assert from "node:assert/strict";
import {chromium} from "playwright";
import {spawn} from "node:child_process";
const port=4187,url="http://127.0.0.1:"+port+"/";
const server=spawn(process.execPath,["node_modules/vite/bin/vite.js","--host","127.0.0.1","--port",String(port),"--strictPort"],{stdio:"pipe"});
let output="";
server.stdout.on("data",b=>output+=b.toString());
server.stderr.on("data",b=>output+=b.toString());
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function ready(){for(let i=0;i<100;i++){if(server.exitCode!==null)throw Error(output);try{if((await fetch(url)).ok)return;}catch{}await sleep(100);}throw Error("Vite startup timeout: "+output);}
let browser;
try {
 await ready();
 browser=await chromium.launch({headless:true});
 const context=await browser.newContext();
 const a=await context.newPage(),b=await context.newPage();
 await Promise.all([a.goto(url),b.goto(url)]);
 const setup=async page=>page.evaluate(async()=>{
  const base="/src/components/studio/mentor/";
  const [{default:createMemory},{MOVIE_MENTOR_SHARED_MEMORY_WRITE_COORDINATION:lockName},{default:quarantine}]=await Promise.all([
   import(base+"CreatorMemory.js"),import(base+"MovieMentorMemoryWriteAuthority.js"),
   import(base+"JourneyRecommendationRecoveryConflictQuarantine.js")
  ]);
  window.__court={createMemory,lockName,quarantine};
  return lockName;
 });
 const [lockA,lockB]=await Promise.all([setup(a),setup(b)]);
 assert.equal(lockA,lockB);
 const projectId="browser-quarantine-contention";
 const seeded=await a.evaluate(({projectId})=>{
  const initial=window.__court.createMemory().getState();
  const journey={progression:{revision:1,committedOperations:[{
   operationId:"operation-court",creatorActId:"creator-act-court",fromRevision:0,toRevision:1,
   recommendation:{recommendationId:"rec-proof-conflict",fingerprint:"WRONG-FINGERPRINT",disposition:"consumed",issuedAgainstProgressionRevision:0}
  }]}};
  const reference={domain:"iband.movie-mentor.journey-recommendation-reference",
   projectId,recommendationId:"rec-proof-conflict",recommendationFingerprint:"fingerprint-proof-conflict",
   issuedAgainst:{progressionRevision:0},lifecycle:{current:true}};
  const state={...initial,
   projects:[...(initial.projects||[]),{id:projectId,identity:{id:projectId},metadata:{projectJourney:journey}}],
   projectMemories:[...(initial.projectMemories||[]),{id:"conflicted-reference",projectId,metadata:{recommendationReference:reference}}]};
  localStorage.setItem("iband.creator-memory",JSON.stringify(state));
  return localStorage.getItem("iband.creator-memory");
 },{projectId});
 assert.ok(seeded);
 await a.evaluate(async()=>{
  window.__lockReady=new Promise(resolve=>window.__signalLockReady=resolve);
  window.__hold=navigator.locks.request(window.__court.lockName,{mode:"exclusive"},async()=>{
   window.__signalLockReady();
   await new Promise(resolve=>window.__releaseLock=resolve);
  });
  await window.__lockReady;
 });
 const recovery=b.evaluate(async({projectId})=>{
  const memory=window.__court.createMemory({requireSharedWriteAuthority:true});
  const transaction=await memory.runRecoveryWithSharedAuthority({
   locks:navigator.locks,
   operation:fresh=>window.__court.quarantine({identityRuntime:{memory:fresh},projectId})
  });
  return {acquired:transaction.acquired,reason:transaction.reason||null,status:transaction.value?.status||null,
   error:transaction.cause?.code||transaction.cause?.message||null};
 },{projectId});
 await sleep(150);
 const held=await a.evaluate(async()=>{const q=await navigator.locks.query();return {
  held:q.held.filter(x=>x.name===window.__court.lockName).length,
  pending:q.pending.filter(x=>x.name===window.__court.lockName).length
 };});
 assert.equal(held.held,1,"RED: browser did not physically hold shared authority");
 assert.equal(held.pending,1,"RED: browser recovery did not queue behind held authority");
 const ordinary=await a.evaluate(async()=>{
  const memory=window.__court.createMemory({requireSharedWriteAuthority:true});
  return memory.replaceStateWithSharedAuthority({locks:navigator.locks,transform:state=>state});
 });
 assert.equal(ordinary.acquired,false,"RED: ordinary writer bypassed held browser lock");
 assert.equal(ordinary.reason,"exclusive-lock-unavailable");
 assert.equal(await a.evaluate(()=>localStorage.getItem("iband.creator-memory")),seeded,
  "RED: blocked ordinary writer modified durable bytes");
 await a.evaluate(()=>window.__releaseLock());
 const outcome=await recovery;
 assert.equal(outcome.acquired,true,"RED: recovery failed to acquire released authority: "+JSON.stringify(outcome));
 assert.equal(outcome.status,"proof-conflict-quarantined","RED: physical quarantine failed: "+JSON.stringify(outcome));
 const final=await a.evaluate(()=>JSON.parse(localStorage.getItem("iband.creator-memory")));
 const ref=final.projectMemories.find(x=>x.id==="conflicted-reference")?.metadata?.recommendationReference;
 assert.equal(ref?.lifecycle?.current,false);
 assert.equal(ref?.lifecycle?.terminalReason,"proof-conflict-quarantined");
 assert.equal(final.projects.find(x=>x.id===projectId)?.metadata?.projectJourney?.progression?.revision,1,
  "RED: quarantine changed authoritative Journey revision");
 console.log("GREEN: two real same-origin Chromium tabs contend for Creator Memory Web Lock; ordinary writer refused while held; queued quarantine commits once after release; Journey revision preserved.");
 // Independent adversarial characterization: a browser Web Lock cannot
 // prevent a same-origin actor from directly mutating localStorage.
 // This is a demonstrated boundary failure, not a security GREEN.
 await a.evaluate(async()=>{
  window.__bypassReady=new Promise(resolve=>window.__signalBypassReady=resolve);
  window.__bypassHold=navigator.locks.request(window.__court.lockName,{mode:"exclusive"},async()=>{
   window.__signalBypassReady();
   await new Promise(resolve=>window.__releaseBypass=resolve);
  });
  await window.__bypassReady;
 });
 const direct=await b.evaluate(()=>{
  const key="iband.creator-memory";
  const state=JSON.parse(localStorage.getItem(key));
  state.metadata={...(state.metadata||{}),noncooperatingBrowserWriter:"bypassed-web-lock"};
  localStorage.setItem(key,JSON.stringify(state));
  return localStorage.getItem(key);
 });
 const bypassHeld=await a.evaluate(async()=>{
  const q=await navigator.locks.query();
  return q.held.filter(x=>x.name===window.__court.lockName).length;
 });
 assert.equal(bypassHeld,1,"RED: bypass demonstration lost held browser lock");
 assert.equal(await a.evaluate(()=>localStorage.getItem("iband.creator-memory")),direct,
  "RED: direct storage bypass not physically observed across tabs");
 assert.equal(JSON.parse(direct).metadata.noncooperatingBrowserWriter,"bypassed-web-lock");
 await a.evaluate(()=>window.__releaseBypass());
 console.log("BOUNDARY RED PRESERVED: second real browser tab directly changed Creator Memory localStorage while first tab held exclusive Web Lock. Cooperative locking does not prevent noncooperating storage writes.");
 console.log("LIMITATION: one browser context and synthetic fixture; direct bypass characterized, not prevented; separate profiles and exact setItem-interleaving remain uncertified.");
} finally {
 if(browser)await browser.close();
 if(server.exitCode===null&&server.signalCode===null)server.kill("SIGTERM");
 await Promise.race([new Promise(r=>server.once("exit",r)),sleep(3000).then(()=>{if(server.exitCode===null&&server.signalCode===null)server.kill("SIGKILL");})]);
}

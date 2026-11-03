import assert from "node:assert/strict";
import {chromium} from "playwright";
import {spawn} from "node:child_process";
const port=4189,base="http://127.0.0.1:"+port;
const server=spawn(process.execPath,["node_modules/vite/bin/vite.js","--host","127.0.0.1","--port",String(port),"--strictPort"],{stdio:"pipe"});
let output="";
server.stdout.on("data",b=>output+=b.toString());
server.stderr.on("data",b=>output+=b.toString());
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function ready(){for(let i=0;i<100;i++){if(server.exitCode!==null)throw Error(output);try{if((await fetch(base+"/")).ok)return;}catch{}await sleep(100);}throw Error("Vite startup timeout: "+output);}
let browser;
try{
 await ready();
 browser=await chromium.launch({headless:true});
 const context=await browser.newContext();
 const a=await context.newPage(),b=await context.newPage();
 // Navigate to an isolated same-origin module document, not the app entry,
 // so the bridge can be installed once with an entirely mocked transport.
 await Promise.all([a.goto(base+"/src/main.jsx"),b.goto(base+"/src/main.jsx")]);
 const installed=await b.evaluate(async()=>{
  const [{installCreatorMemoryDurableSyncBridge,flushMovieMentorDurableStateSync},{MOVIE_MENTOR_SHARED_MEMORY_WRITE_COORDINATION:lockName}]=await Promise.all([
   import("/src/components/studio/mentor/MovieMentorDurableStateSync.js"),
   import("/src/components/studio/mentor/MovieMentorMemoryWriteAuthority.js")
  ]);
  window.__requests=[];
  window.__flush=flushMovieMentorDurableStateSync;
  window.__lockName=lockName;
  window.__mockFetch=async(url,options)=>{
   const body=JSON.parse(options.body);
   window.__requests.push({url,body,authorization:options.headers.Authorization});
   return {ok:true,json:async()=>({state:{revision:body.expectedRevision+1}})};
  };
  return installCreatorMemoryDurableSyncBridge({
   storage:localStorage,fetchImpl:window.__mockFetch,getAuthToken:async()=>"isolated-verifier-token"
  });
 });
 assert.equal(installed,true,"RED: mocked sync bridge was not installed in isolated browser tab");
 const lockName=await b.evaluate(()=>window.__lockName);
 await a.evaluate(async lockName=>{
  window.__ready=new Promise(resolve=>window.__signalReady=resolve);
  window.__hold=navigator.locks.request(lockName,{mode:"exclusive"},async()=>{
   window.__signalReady();
   await new Promise(resolve=>window.__release=resolve);
  });
  await window.__ready;
 },lockName);
 const result=await b.evaluate(async()=>{
  const projectId="browser-uncoordinated-sync-proof";
  const key="iband.creator-memory";
  const state={version:2,journey:{activeProjectId:projectId},creatorProfile:{id:"proof-creator"},
   projects:[{id:projectId,metadata:{creatorMode:"ai-movie"}}],
   projectMemories:[{id:"injected",projectId,metadata:{uncoordinatedWriteMarker:"forwarded-without-lock"}}]};
  localStorage.setItem(key,JSON.stringify(state));
  const sync=await window.__flush({projectId,fetchImpl:window.__mockFetch,storage:localStorage,
   getAuthToken:async()=>"isolated-verifier-token"});
  return {requests:window.__requests,sync};
 });
 const held=await a.evaluate(async lockName=>{
  const locks=await navigator.locks.query();
  return locks.held.filter(item=>item.name===lockName).length;
 },lockName);
 assert.equal(held,1,"RED: browser lock was not held during sync bridge forwarding");
 assert.ok(result.requests.length>=1,"RED: mock transport did not receive a Creator Memory sync request");
 const forwarded=result.requests.find(item=>item.body.projectId==="browser-uncoordinated-sync-proof");
 assert.ok(forwarded,"RED: noncooperating project did not reach mock backend transport");
 assert.equal(forwarded.body.state.memoryContext.projectMemories[0].metadata.uncoordinatedWriteMarker,
  "forwarded-without-lock","RED: intercepted noncooperating payload was not forwarded");
 assert.equal(forwarded.authorization,"Bearer isolated-verifier-token");
 assert.equal(result.sync?.status,"acknowledged");
 await a.evaluate(()=>window.__release());
 console.log("BOUNDARY RED CONFIRMED: a noncooperating Creator Memory localStorage write was forwarded through the startup sync bridge to an authenticated MOCK transport while another Chromium tab held the exclusive Creator Memory Web Lock.");
 console.log("LIMITATION: mock backend acknowledgement proves frontend forwarding only; no production endpoint or database touched, no real backend acceptance certified.");
}finally{
 if(browser)await browser.close();
 if(server.exitCode===null&&server.signalCode===null)server.kill("SIGTERM");
 await Promise.race([new Promise(r=>server.once("exit",r)),sleep(3000).then(()=>{if(server.exitCode===null&&server.signalCode===null)server.kill("SIGKILL");})]);
}

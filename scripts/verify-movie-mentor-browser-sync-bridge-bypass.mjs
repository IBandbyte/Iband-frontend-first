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
 assert.equal(installed,false,"Automatic untrusted storage publishing bridge must fail closed");
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
 assert.equal(result.requests.length,0,"Uncoordinated storage write must not reach mock backend transport");
 assert.equal(result.sync,null,"No automatic sync status may be acknowledged for uncoordinated state");
 await a.evaluate(()=>window.__release());
 console.log("GREEN: uncoordinated localStorage write was NOT forwarded by the disabled automatic sync bridge while another Chromium tab held the exclusive Web Lock.");
 console.log("LIMITATION: this verifies automatic-bridge removal only; direct explicit enqueue and authenticated publishing still require independent authority certification.");
}finally{
 if(browser)await browser.close();
 if(server.exitCode===null&&server.signalCode===null)server.kill("SIGTERM");
 await Promise.race([new Promise(r=>server.once("exit",r)),sleep(3000).then(()=>{if(server.exitCode===null&&server.signalCode===null)server.kill("SIGKILL");})]);
}

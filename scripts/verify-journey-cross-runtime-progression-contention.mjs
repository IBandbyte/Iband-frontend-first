import assert from 'node:assert/strict';
import createJourneyDurableAuthorityStore from '../src/components/studio/mentor/JourneyDurableAuthorityStore.js';
import createJourneyProgressionExecutionRuntime from '../src/components/studio/mentor/JourneyProgressionExecutionRuntime.js';
import { POSITION_ACTIONS, POSITION_AUTHORITY_SOURCES, issueJourneyPositionAuthority } from '../src/components/studio/mentor/JourneyPositionAuthorityControl.js';

const clone = value => JSON.parse(JSON.stringify(value));
const deferred = () => { let resolve; const promise = new Promise(r => {resolve=r}); return {promise,resolve}; };
async function bounded(promise, label) {
 let timer; try { return await Promise.race([promise,new Promise((_,reject)=>{timer=setTimeout(()=>reject(new Error('HARNESS_TIMEOUT: '+label)),5000)})]); }
 finally {clearTimeout(timer)}
}
const entered=deferred(), attempted=deferred(), release=deferred(), events=[], tails=new Map();
let count=0;
const locks={async request(name,options,callback){
 assert.equal(options.mode,'exclusive');
 if(tails.has(name)) attempted.resolve();
 const prior=tails.get(name)||Promise.resolve(), done=deferred();
 const tail=prior.catch(()=>{}).then(()=>done.promise);
 tails.set(name,tail);
 await prior.catch(()=>{});
 const n=++count; events.push('enter-'+n);
 try {if(n===1){entered.resolve();await release.promise} return await callback({name})}
 finally {events.push('exit-'+n);done.resolve();if(tails.get(name)===tail)tails.delete(name)}
}};
const originalNavigator=globalThis.navigator;
Object.defineProperty(globalThis,'navigator',{configurable:true,value:{locks}});
const projectId='physical-cross-runtime-progression-court';
const journey={projectId,currentStageId:'idea',currentTaskId:'seed',status:'creating',
 stages:[{id:'idea',tasks:[{id:'seed',status:'in-progress'}]},{id:'story',tasks:[{id:'premise',status:'not-started'}]},{id:'character',tasks:[{id:'protagonist',status:'not-started'}]}],
 progression:{schemaVersion:1,revision:0,lastCommittedOperation:null,committedOperations:[]}};
function memory(){
 const project={id:projectId,creatorType:'video',identity:{domain:'iband.movie-mentor.project',schema:1,issuance:'secure-web-crypto',legacy:false},metadata:{creatorMode:'ai-movie',projectJourney:clone(journey)}};
 return {getProject(id){return id===projectId?clone(project):null},getPersistedProject(id){return id===projectId?clone(project):null},getState(){return {projects:[clone(project)],projectMemories:[]}}}
}
function engine(){return {getStage(j,id){return j.stages.find(s=>s.id===id)||null},
 setCurrentPosition(j,{stageId,taskId=null}){const next=clone(j);next.currentStageId=stageId;next.currentTaskId=taskId||next.stages.find(s=>s.id===stageId)?.tasks?.[0]?.id||null;return next},
 completeTask:clone,revisitStage(j,{stageId}){return {...clone(j),currentStageId:stageId}},pauseJourney:clone,constants:{}}}
function authority(stageId,creatorActId){return issueJourneyPositionAuthority({projectId,source:POSITION_AUTHORITY_SOURCES.STAGE_CLICK_UI,action:POSITION_ACTIONS.SET_POSITION,target:{stageId},expectedPositionRevision:0,issuedAt:'2026-11-03T10:00:00.000Z',evidence:{creatorGesture:true,creatorActId}})}
const values=new Map(),storage={getItem(k){return values.has(k)?values.get(k):null},setItem(k,v){values.set(k,String(v))},removeItem(k){values.delete(k)}};
try{
 const storeA=createJourneyDurableAuthorityStore({storage,locksApi:locks,browserRuntime:false});
 const storeB=createJourneyDurableAuthorityStore({storage,locksApi:locks,browserRuntime:false});
 const runtimeA=createJourneyProgressionExecutionRuntime({journeyEngine:engine(),identityRuntime:{memory:memory()},authorityStore:storeA});
 const runtimeB=createJourneyProgressionExecutionRuntime({journeyEngine:engine(),identityRuntime:{memory:memory()},authorityStore:storeB});
 const a=runtimeA.execute({projectId,projectJourney:journey,authorityEnvelope:authority('story','act-A'),operationId:'operation-A'});
 await bounded(entered.promise,'caller A entry');
 const b=runtimeB.execute({projectId,projectJourney:journey,authorityEnvelope:authority('character','act-B'),operationId:'operation-B'});
 await bounded(attempted.promise,'caller B attempt');
 await Promise.resolve();
 assert.deepEqual(events,['enter-1'],'RED: competing runtime entered lock prematurely');
 release.resolve();
 const [ra,rb]=await bounded(Promise.allSettled([a,b]),'settlement');
 assert.equal(ra.status,'fulfilled');assert.equal(ra.value.status,'committed');assert.equal(ra.value.progressionRevision,1);
 assert.equal(rb.status,'rejected','RED: stale second creator act committed');
 assert.equal(rb.reason?.code,'JOURNEY_POSITION_AUTHORITY_STALE');
 assert.deepEqual(events,['enter-1','exit-1','enter-2','exit-2']);
 const persisted=storeB.read(projectId,{project:memory().getProject(projectId)});
 assert.equal(persisted.journey.currentStageId,'story');
 assert.equal(persisted.journey.progression.revision,1);
 assert.deepEqual(persisted.journey.progression.committedOperations.map(x=>x.operationId),['operation-A']);
 console.log('GREEN: cross-runtime lock entry serialized, stale competing act rejected, durable receipt preserved');
 console.log('LIMITATION: held before transaction callback, not a mid-commit race');
}finally{release.resolve();if(originalNavigator===undefined)delete globalThis.navigator;else Object.defineProperty(globalThis,'navigator',{configurable:true,value:originalNavigator})}

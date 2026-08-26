import assert from "node:assert/strict";
import createCreatorMemory,{createMemoryStorageAdapter,PROJECT_STATUSES} from "../src/components/studio/mentor/CreatorMemory.js";
import createCreatorJourneyEngine from "../src/components/studio/mentor/CreatorJourneyEngine.js";
import createMovieMentorStudioIdentityRuntime,{RECOMMENDATION_REFERENCE_DOMAIN} from "../src/components/studio/mentor/MovieMentorStudioIdentityRuntime.js";
import { syncMovieMentorDurableState } from "../src/components/studio/mentor/MovieMentorDurableStateSync.js";

const cryptoImpl={randomUUID:()=>"22222222-3333-4444-8555-666666666666"};
const storageAdapter=createMemoryStorageAdapter();
const memory=createCreatorMemory({storageAdapter,projectIdentityCrypto:cryptoImpl});
const journeyEngine=createCreatorJourneyEngine();
const projectJourney=journeyEngine.createMovieJourney({creatorType:"video",creatorMode:"ai-movie",creatorJourney:"guide"});
const project=memory.saveProject({title:"The Hidden Tunnel",creatorType:"video",status:PROJECT_STATUSES.CREATING,metadata:{creatorMode:"ai-movie",creatorModeLabel:"AI Movie Making",projectJourney}});
const runtime=createMovieMentorStudioIdentityRuntime({memory,cryptoImpl});

function planning(task,revision){return{contractVersion:"1.1.0",authority:"advisory-only",creatorConfirmed:false,mayCreateCanon:false,mayAdvanceJourney:false,semanticDirection:{nextAction:{label:task}},recommendation:{recommendedStageId:"story",recommendedTaskId:task,reasonCodes:["story-advice-considered"],confidence:.9,alternatives:[]},clarification:{required:false,reasons:[]},provenance:{bridgeVersion:"1.5.0",turnRevision:revision,authorityRevision:revision}};}

const first=runtime.recordRecommendationReference(project.id,planning("escape-through-tunnel",7),{turnRevision:7});
assert.ok(first?.id);const firstId=first.metadata.recommendationReference.recommendationId;
assert.equal(runtime.getCurrentRecommendationReferences(project.id).length,1);

const second=runtime.recordRecommendationReference(project.id,planning("objective-after-escape",8),{turnRevision:8});
assert.ok(second?.id);const secondId=second.metadata.recommendationReference.recommendationId;
assert.notEqual(firstId,secondId);assert.deepEqual(second.retiredRecommendationIds,[firstId]);
let refs=memory.getProjectMemories({projectId:project.id}).filter(x=>x?.metadata?.recommendationReference?.domain===RECOMMENDATION_REFERENCE_DOMAIN);
assert.equal(refs.length,2);const old=refs.find(x=>x.metadata.recommendationReference.recommendationId===firstId);const current=refs.find(x=>x.metadata.recommendationReference.recommendationId===secondId);
assert.equal(old.metadata.recommendationReference.lifecycle.current,false);assert.equal(old.metadata.recommendationReference.lifecycle.supersededByRecommendationId,secondId);assert.equal(current.metadata.recommendationReference.lifecycle.current,true);assert.equal(runtime.getCurrentRecommendationReferences(project.id).length,1);

// Real conversation shape: Conversation stores TurnClient metadata beneath backendMetadata.
runtime.recordConversationMessage(project.id,{role:"creator",text:"Yes, do that."},{projectJourney});
const live=runtime.recordConversationMessage(project.id,{role:"mentor",text:"Now let's explore what Maya finds at the lighthouse.",metadata:{liveBackendTurn:true,turnContextProof:{revision:8},semanticIntelligence:{readyToAdvance:true,recommendedStageId:"story",recommendedTaskId:"lighthouse-discovery",clarificationNeeded:[],nextAction:{label:"lighthouse-discovery"}},specialistResult:{contributions:[]},continuityConsequenceEnvelope:null,authority:{creatorTruthDominates:true},mayAdvanceJourney:false,backendMetadata:{postCommitCreatorAuthority:{revision:9,creatorConfirmedContext:[{key:"character.maya.location",value:"lighthouse",authority:"creator"}]}}}},{projectJourney});
assert.ok(live.recommendationReference?.id);const thirdId=live.recommendationReference.metadata.recommendationReference.recommendationId;assert.notEqual(thirdId,secondId);assert.equal(live.recommendationReference.metadata.recommendationReference.provenance.turnRevision,9);assert.ok(live.recommendationReference.retiredRecommendationIds.includes(secondId));
refs=memory.getProjectMemories({projectId:project.id}).filter(x=>x?.metadata?.recommendationReference?.domain===RECOMMENDATION_REFERENCE_DOMAIN);assert.equal(refs.filter(x=>x.metadata.recommendationReference.lifecycle.current===true).length,1);assert.equal(refs.find(x=>x.metadata.recommendationReference.lifecycle.current===true).metadata.recommendationReference.recommendationId,thirdId);

// Process death/reload: retired references stay retired and cannot become current again.
const reloadedMemory=createCreatorMemory({storageAdapter,projectIdentityCrypto:cryptoImpl});
const reloadedRuntime=createMovieMentorStudioIdentityRuntime({memory:reloadedMemory,cryptoImpl});
const reloadedAll=reloadedMemory.getProjectMemories({projectId:project.id}).filter(x=>x?.metadata?.recommendationReference?.domain===RECOMMENDATION_REFERENCE_DOMAIN);
const reloadedCurrent=reloadedRuntime.getCurrentRecommendationReferences(project.id);
assert.equal(reloadedAll.length,3);assert.equal(reloadedCurrent.length,1);assert.equal(reloadedCurrent[0].metadata.recommendationReference.recommendationId,thirdId);assert.equal(reloadedAll.find(x=>x.metadata.recommendationReference.recommendationId===firstId).metadata.recommendationReference.lifecycle.current,false);assert.equal(reloadedAll.find(x=>x.metadata.recommendationReference.recommendationId===secondId).metadata.recommendationReference.lifecycle.current,false);

let syncBody=null;await syncMovieMentorDurableState({projectId:project.id,creatorSessionId:runtime.creatorSessionId,memoryState:reloadedMemory.getState(),storage:{getItem:()=>null,setItem(){}},fetchImpl:async(_url,options)=>{syncBody=JSON.parse(options.body);return{ok:true,status:200,json:async()=>({success:true,state:{revision:10}})}}});
const synced=syncBody.state.memoryContext.projectMemories.filter(x=>x?.metadata?.recommendationReference?.domain===RECOMMENDATION_REFERENCE_DOMAIN);assert.equal(synced.filter(x=>x.metadata.recommendationReference.lifecycle.current===true).length,1);assert.equal(synced.find(x=>x.metadata.recommendationReference.lifecycle.current===true).metadata.recommendationReference.recommendationId,thirdId);
console.log("Movie Mentor recommendation lifecycle torture: PASS — each replacement retires the prior advisory reference, reload preserves retirement, and exactly one reference remains current.");

import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const uiSource=readFileSync(new URL("../src/components/studio/CreatorWorkspace.jsx",import.meta.url),"utf8");
for(const marker of ["Adopt recovered workspace","commitMovieMentorRecoveryWithLock","readLocalState","navigator.locks","setAdoptionResult"]) {
 assert.ok(uiSource.includes(marker),"Missing real UI adoption integration: "+marker);
}
console.log("GREEN CANDIDATE_REAL_CREATOR_WORKSPACE_SOURCE_WIRED");
import {commitMovieMentorRecoveryWithLock} from "../src/components/studio/mentor/MovieMentorRecoveryLockedCommit.js";
import {projectRecoveredCreatorWorkspace} from "../src/components/studio/mentor/MovieMentorRecoveredWorkspaceProjection.js";
const projectId="isolated-film";
const project={id:projectId,title:"Recovery court",creatorType:"video",metadata:{creatorMode:"ai-movie",projectJourney:{projectId,currentStageId:"story"}}};
const recovered={project,revision:2,creatorStateGeneration:2,conversationMessages:[{id:"c1",creatorMessage:"Opening scene"}],sessionHandoffs:[{id:"h1",type:"session-handoff",projectId,content:"Continue scene",scope:"project",status:"active"}]};
const empty=()=>({projects:[],conversations:[],journey:{activeProjectId:null}});
const locks={request:async(_name,_options,callback)=>callback({name:"isolated"})};
async function court({local=empty(),payload=recovered,beforeCommit}={}){
 let state=structuredClone(local),writes=0;
 const verdict=await commitMovieMentorRecoveryWithLock({projectId,recovered:payload,readLocalState:()=>structuredClone(state),commit:next=>{writes++;state=structuredClone(next);},locks,beforeCommit:beforeCommit?()=>beforeCommit(v=>{state=v}):undefined});
 return {verdict,state,writes};
}
const success=await court();
assert.equal(success.verdict.allowed,true,JSON.stringify(success.verdict));
assert.equal(success.writes,1);
assert.equal(success.state.conversations[0].creatorMessage,"Opening scene");
assert.equal(success.state.sessionHandoffs[0].content,"Continue scene");
console.log("GREEN CANDIDATE_VALID_ADOPTION_AND_HANDOFF");
const existing=empty();existing.projects=[{id:"existing",title:"Do not overwrite"}];
const blocked=await court({local:existing});
assert.equal(blocked.verdict.allowed,false);
assert.equal(blocked.writes,0);
assert.deepEqual(blocked.state,existing);
console.log("GREEN CANDIDATE_EXISTING_WORK_PRESERVED");
for(const [name,payload] of [
 ["missing-handoffs",{...recovered,sessionHandoffs:undefined}],
 ["duplicate-handoffs",{...recovered,sessionHandoffs:[recovered.sessionHandoffs[0],recovered.sessionHandoffs[0]]}],
 ["foreign-handoff",{...recovered,sessionHandoffs:[{...recovered.sessionHandoffs[0],projectId:"foreign"}]}],
 ["invalid-conversations",{...recovered,conversationMessages:null}]
]){
 const result=await court({payload});assert.equal(result.verdict.allowed,false,name);assert.equal(result.writes,0,name);
 console.log("GREEN CANDIDATE_DENIAL_"+name.toUpperCase().replaceAll("-","_"));
}
const changed=await court({beforeCommit:set=>{const next=empty();next.projects=[{id:"concurrent"}];set(next);}});
assert.equal(changed.verdict.allowed,false);
assert.equal(changed.writes,0);
assert.equal(changed.state.projects[0].id,"concurrent");
console.log("GREEN CANDIDATE_CONCURRENT_LOCAL_CHANGE_DENIED");
const projection=projectRecoveredCreatorWorkspace({projectId,state:{projectId,revision:2,creatorStateGeneration:2,projectJourney:{projectId,currentStageId:"story"},creatorConfirmedContext:[{key:"project",value:project}],memoryContext:{conversations:recovered.conversationMessages,sessionHandoffs:recovered.sessionHandoffs}}});
assert.equal(projection.sessionHandoffs[0].id,"h1");
console.log("GREEN CANDIDATE_PROJECTION_INCLUDES_HANDOFF");

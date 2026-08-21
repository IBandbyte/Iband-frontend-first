import assert from "node:assert/strict";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import createCreatorJourneyEngine from "../src/components/studio/mentor/CreatorJourneyEngine.js";
import createMovieJourneyIntelligenceBridge from "../src/components/studio/mentor/MovieJourneyIntelligenceBridge.js";
import createMovieMentorAgentPlan from "../src/components/studio/mentor/MovieMentorAgentOrchestrator.js";
import { resolveMovieMentorCreatorFacingMessage } from "../src/components/studio/mentor/MovieMentorCreatorFacingPresenter.js";

const BASE_URL=(process.env.IBAND_LIVE_BACKEND_URL||"https://iband-backend-first-1.onrender.com").replace(/\/$/,"");
const REPORT_PATH=process.env.IBAND_LIVE_REPORT_PATH||"verification-results/movie-mentor-creator-facing-live.json";
const report={generatedAt:new Date().toISOString(),baseUrl:BASE_URL,passed:false,cases:[],error:null};
function writeReport(){mkdirSync(dirname(REPORT_PATH),{recursive:true});writeFileSync(REPORT_PATH,`${JSON.stringify(report,null,2)}\n`,`utf8`);}
async function readJson(r){const text=await r.text();try{return text?JSON.parse(text):null;}catch{return {raw:text};}}
const sleep=(ms)=>new Promise(resolve=>setTimeout(resolve,ms));
async function post(path,body){let last=null;for(let attempt=1;attempt<=4;attempt+=1){const r=await fetch(`${BASE_URL}${path}`,{method:"POST",headers:{Accept:"application/json","Content-Type":"application/json"},body:JSON.stringify(body)});const json=await readJson(r);if(r.ok)return json;last={status:r.status,json};if(![502,503,504].includes(r.status)||attempt===4)break;await sleep(15000);}assert.equal(false,true,`${path} failed (${last?.status}): ${JSON.stringify(last?.json)}`);}

const engine=createCreatorJourneyEngine();
const bridge=createMovieJourneyIntelligenceBridge({journeyEngine:engine});
function newJourney(){return engine.createMovieJourney({creatorType:"video",creatorMode:"ai-movie",creatorJourney:"guide",metadata:{verification:true}});}
function confirmedContext(journey){return bridge.getCreatorConfirmedContext(journey);}
function semanticProviderRequest(message,journey){return {message,input:{message},context:{activeIdea:message,creatorConfirmedContext:confirmedContext(journey),projectJourney:engine.createSnapshot(journey),projectJourneyOrientation:engine.getOrientation(journey)},options:{metadata:{creatorMode:"ai-movie",creatorFacingIntegrationVerification:true}}};}
async function interpret(message,journey){const body=await post("/api/movie-mentor-semantic/interpret",semanticProviderRequest(message,journey));return body?.structured?.movieJourneyIntelligence;}
async function executeSpecialists(message,journey,intelligence){const plan=createMovieMentorAgentPlan({stageId:intelligence?.recommendedStageId||engine.getOrientation(journey)?.present?.stage?.id||"idea",taskId:intelligence?.recommendedTaskId||null,creatorMessage:message,semanticIntelligence:intelligence,creatorConfirmedContext:confirmedContext(journey),projectJourney:engine.createSnapshot(journey)});if(plan.status==="blocked-by-clarification"||plan.workOrders.length===0)return {plan,execution:{status:"blocked-by-clarification",contributions:[],failures:[],skipped:[]}};const execution=await post("/api/movie-mentor-specialists/execute",{plan});return {plan,execution};}
async function synthesize(message,journey,intelligence,execution){if((intelligence?.clarificationNeeded||[]).some(i=>i?.material!==false)||!(execution?.contributions||[]).length)return null;return post("/api/movie-mentor-synthesis/synthesize",{creatorMessage:message,creatorConfirmedContext:confirmedContext(journey),semanticIntelligence:intelligence,semanticMentorDraft:"",contributions:execution.contributions,responseBlueprint:null,communicationPlan:null});}
function applyTurn(message,journey,intelligence,synthesis){const fakeResult={response:{text:synthesis?.text||"",structured:{movieJourneyIntelligence:intelligence}},movieJourneyIntelligence:intelligence,mentorSynthesis:synthesis?{status:"completed"}:{status:"blocked-by-clarification"},content:synthesis?.text||"",prompt:synthesis?.text||"",preview:synthesis?.text||""};const applied=bridge.applyGenerationResult(journey,fakeResult,{originalIdea:message,source:"live-creator-facing-verifier"});const presentation=resolveMovieMentorCreatorFacingMessage({result:fakeResult,appliedJourney:applied});return {applied,presentation};}

async function runCase(name,message,{expectClarification=false,existingJourney=null,expectBothAgents=false,expectConflictHandling=false}={}){
 let journey=existingJourney||newJourney();
 const captured=bridge.captureInitialIdea(journey,{originalIdea:message,source:"live-creator-facing-verifier.capture"});journey=captured.journey;
 const intelligence=await interpret(message,journey);assert.ok(intelligence,"semantic intelligence missing");
 const {plan,execution}=await executeSpecialists(message,journey,intelligence);
 const synthesis=await synthesize(message,journey,intelligence,execution);
 const {applied,presentation}=applyTurn(message,journey,intelligence,synthesis);
 if(expectClarification){
   assert.equal(intelligence.readyToAdvance,false,`${name}: ambiguous language must not signal readiness`);
   assert.equal(applied.clarificationRequired,true,`${name}: expected clarification`);
   assert.equal(plan.status,"blocked-by-clarification",`${name}: specialists must be blocked`);
   assert.equal(synthesis,null,`${name}: synthesis must be bypassed`);
   assert.equal(presentation.type,"clarification",`${name}: creator must see clarification`);
   assert.equal(applied.orientation?.present?.stage?.id,"idea",`${name}: journey must stay in idea`);
 }else{
   assert.equal(intelligence.readyToAdvance,true,`${name}: clear understood language must provide validated progression readiness`);
   assert.equal((intelligence.unresolvedContext||[]).length,0,`${name}: clear language must not contain unresolved semantic meaning`);
   assert.equal(applied.clarificationRequired,false,`${name}: unexpected clarification`);
   assert.equal(applied.orientation?.present?.stage?.id,"story-direction",`${name}: validated semantic readiness did not reach canonical story-direction stage`);
   assert.equal(Boolean(synthesis?.text),true,`${name}: synthesis text missing`);
   assert.equal(presentation.source,"mentor-synthesis",`${name}: synthesized Mentor text not rendered`);
   assert.equal(/story agent|character agent|specialist agent|work order/i.test(presentation.text),false,`${name}: internal agent machinery leaked`);
   for(const c of execution.contributions||[]){assert.equal(c.authority,"mentor-provisional");assert.equal(c.creatorFacing,false);assert.equal(c.mayAdvanceJourney,false);assert.equal(c.mayOverwriteCreatorTruth,false);}
   if(expectBothAgents)assert.deepEqual(new Set((execution.contributions||[]).map(c=>c.agentId)),new Set(["story","character"]));
   if(expectConflictHandling)assert.equal((synthesis?.synthesisDecision?.conflictsHandled||[]).length>0,true,`${name}: expected tension handling evidence`);
   const activeCreatorKeys=(applied.journey?.decisions||[]).filter(d=>d.status==="active"&&d.authority==="creator").map(d=>d.key);
   const specialistKeys=(execution.contributions||[]).flatMap(c=>[...(c.observations||[]),...(c.provisionalSuggestions||[])].map(i=>i.key).filter(Boolean));
   for(const key of specialistKeys){if(key&&!intelligence.understoodContext?.some(i=>i.key===key))assert.equal(activeCreatorKeys.includes(key),false,`${name}: specialist key became creator truth: ${key}`);}
 }
 report.cases.push({name,semanticReadyToAdvance:intelligence.readyToAdvance,semanticUnresolvedCount:(intelligence.unresolvedContext||[]).length,clarificationRequired:applied.clarificationRequired,stageId:applied.orientation?.present?.stage?.id||null,selectedAgents:plan.selectedAgents||[],executedAgents:(execution.contributions||[]).map(c=>c.agentId),synthesisUsed:synthesis?.synthesisDecision?.usedContributionAgentIds||[],conflictsHandled:synthesis?.synthesisDecision?.conflictsHandled||[],presentationSource:presentation.source,presentationText:presentation.text});
 return applied.journey;
}

async function run(){
 await runCase("clear-language","A retired astronaut discovers that the lighthouse in her coastal town is receiving messages from her missing daughter.",{expectBothAgents:true});
 await runCase("uk-slang","A young courier is bare vexed because the estate is moving booky, then she clocks the rival crew following her.",{expectBothAgents:true});
 await runCase("invented-terminology","A detective realises the suspect is completely glorp-coded and changes the investigation.",{expectClarification:true});
 await runCase("material-ambiguity","Mia tells Lena that she is the killer, but I mean she is the killer.",{expectClarification:true});
 let correctionJourney=newJourney();
 correctionJourney=bridge.captureInitialIdea(correctionJourney,{originalIdea:"Mia and Lena are best friends.",intelligence:{understoodContext:[{key:"movie.character.relationship",value:"best friends",authority:"creator"}],readyToAdvance:false},source:"verification-seed"}).journey;
 const corrected=await runCase("creator-correction","Correction: Mia and Lena are brother and sister, not best friends.",{existingJourney:correctionJourney});
 const relationship=(corrected.decisions||[]).find(d=>d.status==="active"&&d.authority==="creator"&&d.key==="movie.character.relationship");assert.ok(relationship,"creator correction did not produce active creator relationship");assert.equal(String(relationship.value).toLowerCase().includes("brother")||String(relationship.value).toLowerCase().includes("sister"),true,"creator correction did not supersede old relationship");
 await runCase("story-character-tension","Two sisters discover their late mother's radio can receive messages from tomorrow. Keep the radio mystery as the main engine, but make their grief deepen the choices without turning the film into family drama.",{expectBothAgents:true,expectConflictHandling:true});
 report.passed=true;
}
try{await run();}catch(error){report.error={message:error instanceof Error?error.message:String(error),code:error?.code||null,stack:error?.stack||null};process.exitCode=1;}finally{writeReport();}

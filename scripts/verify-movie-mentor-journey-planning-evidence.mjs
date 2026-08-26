import assert from "node:assert/strict";
import createMovieJourneyIntelligenceBridge from "../src/components/studio/mentor/MovieJourneyIntelligenceBridge.js";

const journey={projectId:"movie-project-11d3b",currentStageId:"story",initialIdea:{readyToAdvance:true},decisions:[{key:"character.maya.location",value:"train-platform",authority:"creator",status:"active",stageId:"story"}]};
const engine={createSnapshot:value=>({projectId:value.projectId,currentStageId:value.currentStageId,decisions:JSON.parse(JSON.stringify(value.decisions||[]))}),getOrientation:value=>({present:{stage:{id:value.currentStageId},task:{id:"next-story-beat"},clarificationRequired:false,clarifications:[]}})};
const bridge=createMovieJourneyIntelligenceBridge({journeyEngine:engine});const before=JSON.parse(JSON.stringify(journey));
function contribution(agentId,provisionalSuggestions=[],confidence=.8){return{agentId,authority:"mentor-provisional",creatorFacing:false,mayAdvanceJourney:false,mayOverwriteCreatorTruth:false,observations:[],provisionalSuggestions,risksAndConflicts:[],creatorConfirmedDependencies:[],confidence};}
const baseTurn={status:"mentor-response-ready",turnContextProof:{revision:42},semanticIntelligence:{readyToAdvance:true,recommendedStageId:"story",recommendedTaskId:"define-next-beat",clarificationNeeded:[]},specialistResult:{contributions:[contribution("story",[{key:"character.maya.location",value:"airport"},{key:"story.nextBeat",value:"escape-through-tunnel"}],.9),contribution("character",[{key:"character.maya.location",value:"train-platform"},{key:"character.maya.objective",value:"protect-eli"}],.88)]},continuityConsequenceEnvelope:{status:"consistent",authority:"derived-continuity",creatorConfirmed:false,mayCreateCanon:false,requiresClarification:false,derivedConstraints:[{key:"story.nextBeat",value:"escape-through-tunnel"}],conflicts:[],unresolvedQuestions:[]}};
let result=bridge.consumeTurnForJourneyPlanning(journey,baseTurn,{source:"verification"});let evidence=result.journeyPlanningEvidence;
assert.deepEqual(journey,before);assert.equal(result.journeyMutated,false);assert.equal(evidence.creatorAuthoritySource,"local-journey");assert.equal(evidence.filteredEvidence.overriddenByCreator.some(item=>item.value==="airport"),true);

// Torture: local Journey N says train-platform, but the same creator turn committed N+1 = lighthouse.
// N+1 must dominate immediately without mutating the stale local Journey object.
const committedTurn=JSON.parse(JSON.stringify(baseTurn));
committedTurn.postCommitCreatorAuthority={revision:43,authorityReference:"merge-43",snapshotReference:"creator-snapshot-43",creatorConfirmedContext:[{key:"character.maya.location",value:"lighthouse",stageId:"story",authority:"creator"}]};
committedTurn.semanticIntelligence.recommendedTaskId="develop-lighthouse-consequence";
committedTurn.specialistResult.contributions=[contribution("story",[{key:"character.maya.location",value:"train-platform"},{key:"story.nextBeat",value:"search-lighthouse"}],.92),contribution("character",[{key:"character.maya.location",value:"lighthouse"}],.9)];
result=bridge.consumeTurnForJourneyPlanning(journey,committedTurn,{source:"post-commit-torture"});evidence=result.journeyPlanningEvidence;
assert.deepEqual(journey,before,"post-commit planning must not silently rewrite canonical local Journey");
assert.equal(evidence.creatorAuthoritySource,"post-commit-authority");assert.equal(evidence.creatorAuthorityRevision,43);assert.equal(evidence.localJourneyStale,true);assert.equal(evidence.creatorAuthority.find(item=>item.key==="character.maya.location").value,"lighthouse");assert.equal(evidence.filteredEvidence.overriddenByCreator.some(item=>item.value==="train-platform"),true,"stale N advice must lose to creator-authoritative N+1");assert.equal(evidence.recommendation.recommendedTaskId,"develop-lighthouse-consequence");assert.ok(evidence.recommendation.reasonCodes.includes("post-commit-creator-authority-applied"));

// A replay/restart carrying the N+1 authority must produce the same replacement recommendation even if local Journey is still N.
const restartedBridge=createMovieJourneyIntelligenceBridge({journeyEngine:engine});
const restartResult=restartedBridge.consumeTurnForJourneyPlanning(JSON.parse(JSON.stringify(journey)),JSON.parse(JSON.stringify(committedTurn)),{source:"restart-torture"});
assert.equal(restartResult.journeyPlanningEvidence.creatorAuthorityRevision,43);assert.equal(restartResult.journeyPlanningEvidence.creatorAuthority.find(item=>item.key==="character.maya.location").value,"lighthouse");assert.equal(restartResult.journeyPlanningEvidence.recommendation.recommendedTaskId,"develop-lighthouse-consequence");

// Malformed/non-newer post-commit authority is never allowed to outrank the current turn/local authority.
const staleAuthorityTurn=JSON.parse(JSON.stringify(baseTurn));staleAuthorityTurn.postCommitCreatorAuthority={revision:42,creatorConfirmedContext:[{key:"character.maya.location",value:"WRONG"}]};
const staleAuthorityResult=bridge.consumeTurnForJourneyPlanning(journey,staleAuthorityTurn);assert.equal(staleAuthorityResult.journeyPlanningEvidence.creatorAuthoritySource,"local-journey");assert.equal(staleAuthorityResult.journeyPlanningEvidence.creatorAuthority[0].value,"train-platform");

const conflictTurn=JSON.parse(JSON.stringify(baseTurn));conflictTurn.specialistResult.contributions=[contribution("story",[{key:"story.tone",value:"hopeful"}]),contribution("character",[{key:"story.tone",value:"bleak"}])];conflictTurn.continuityConsequenceEnvelope.derivedConstraints=[];const conflict=bridge.consumeTurnForJourneyPlanning(journey,conflictTurn);assert.equal(conflict.journeyPlanningEvidence.clarification.required,true);assert.equal(conflict.journeyPlanningEvidence.recommendation,null);
console.log("Movie Mentor Journey planning authority torture: PASS — authoritative N+1 creator truth defeats stale local Journey N, survives restart, and drives replacement recommendation without mutating canon.");

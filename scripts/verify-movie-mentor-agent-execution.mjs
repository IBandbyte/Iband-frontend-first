import assert from "node:assert/strict";
import createMovieSpecialistAgentProvider from "../src/components/studio/mentor/MovieSpecialistAgentProvider.js";

const contribution={agentId:"story",observations:[],provisionalSuggestions:[],risksAndConflicts:[],creatorConfirmedDependencies:[],confidence:0.8,provenance:{source:"movie-mentor-specialist-agent",model:"test",contractVersion:"1.0.0"},authority:"mentor-provisional",creatorFacing:false,mayAdvanceJourney:false,mayOverwriteCreatorTruth:false,requiresMentorSynthesis:true};
const calls=[];
const provider=createMovieSpecialistAgentProvider({baseUrl:"https://example.invalid",fetchImpl:async(url,options)=>{calls.push({url,options});return {ok:true,status:200,text:async()=>JSON.stringify({success:true,status:"completed",contributions:[contribution],failures:[],skipped:[]})};}});
const plan={status:"planned",workOrders:[{agentId:"story",authority:"mentor-provisional",creatorFacing:false,mayAdvanceJourney:false,mayOverwriteCreatorTruth:false,requiresMentorSynthesis:true}]};
const result=await provider.executePlan(plan);
assert.equal(calls.length,1,"provider should execute one gateway request");
assert.match(calls[0].url,/\/api\/movie-mentor-specialists\/execute$/);
assert.equal(result.contributions.length,1);
assert.equal(result.contributions[0].authority,"mentor-provisional");
assert.equal(result.contributions[0].creatorFacing,false);
assert.equal(result.contributions[0].mayAdvanceJourney,false);
assert.equal(result.contributions[0].mayOverwriteCreatorTruth,false);
assert.equal(result.contributions[0].requiresMentorSynthesis,true);

const skipped=await provider.executePlan({status:"planned",workOrders:[]});
assert.equal(skipped.status,"skipped");
assert.equal(skipped.contributions.length,0);
console.log("Movie Mentor specialist execution adapter verification passed.");

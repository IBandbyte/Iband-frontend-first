import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const read=path=>readFileSync(new URL(path,import.meta.url),"utf8");
const runtime=read("../src/components/studio/mentor/MovieMentorStudioIdentityRuntime.js");
const workspace=read("../src/components/studio/CreatorWorkspace.jsx");

// This court records the real caller graph before changing legacy synchronous
// compatibility. It intentionally stays RED for reachable uncoordinated writers.
const body=(start,end)=>{
 const a=runtime.indexOf(start);
 const b=runtime.indexOf(end,a+start.length);
 assert.ok(a>=0&&b>a,`Unable to inspect caller range: ${start}`);
 return runtime.slice(a,b);
};
const settlement=body("async function settleConversationMessage(","function resumeProjectConversation(");
const settlementAuthority=body("async function withDurableSettlementAuthority(","async function settleConversationMessage(");
const recommendation=body("function recordRecommendationForMessage(","function buildConversationInput(");
const recommendationReference=body("function recordRecommendationReference(","function recordRecommendationForMessage(");
const retirement=body("function retireSupersededRecommendationReferences(","function getCurrentRecommendationReferences(");
const resume=body("function getResumeSnapshot(","function ");
assert.match(settlement,/withDurableSettlementAuthority\(/,"Settlement must retain shared authority.");
assert.match(settlementAuthority,/withMovieMentorMemoryWriteAuthority\(/,"Settlement authority must use the recovery lock.");
assert.match(settlement,/recordRecommendationForMessage\(/,"Recommendation recording is reachable from settlement.");
assert.match(recommendation,/recordRecommendationReference\(/,"Recommendation recording must remain visible.");
assert.match(recommendationReference,/retireSupersededRecommendationReferences\(/,"Retirement is reachable through recommendation recording.");
assert.match(recommendationReference,/memory\.saveProjectMemory/,"Recommendation save is a synchronous whole-memory write.");
assert.match(retirement,/memory\.replaceState/,"Retirement is a synchronous whole-memory write.");
assert.match(workspace,/settleConversationMessage\(/,"Real workspace must call coordinated settlement.");
assert.match(resume,/certifyJourneyRecommendationResume\(/,"Resume calls recommendation repair outside settlement.");
assert.match(runtime,/function persistJourney\(/,"Legacy Journey persistence path must be audited.");
assert.match(runtime,/memory\.updateProject\(/,"Legacy Journey still uses synchronous persistence.");
console.log("GREEN: caller graph inventoried: recommendation writes inside shared settlement; resume recommendation repair and legacy Journey require independent authority audit.");

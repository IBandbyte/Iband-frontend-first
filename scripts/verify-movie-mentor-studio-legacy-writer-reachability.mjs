import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const read=path=>readFileSync(new URL(path,import.meta.url),"utf8");
const runtime=read("../src/components/studio/mentor/MovieMentorStudioIdentityRuntime.js");
const workspace=read("../src/components/studio/CreatorWorkspace.jsx");
const section=(source,start,end)=>{
  const a=source.indexOf(start),b=source.indexOf(end,a+start.length);
  assert.ok(a>=0&&b>a,`Missing caller graph boundary: ${start}`);
  return source.slice(a,b);
};
const settlement=section(runtime,"async function settleConversationMessage(","function resumeProjectConversation(");
const legacy=section(runtime,"function recordRecommendationForMessage(","function buildConversationInput(");
const syncJourney=section(runtime,"function persistJourney(","function getProjectConversationMessages(");
assert.match(workspace,/persistJourneyWithSharedAuthority\(/,"Workspace must use coordinated Journey writer.");
assert.match(workspace,/settleConversationMessage\(/,"Workspace must use atomic settlement.");
assert.doesNotMatch(workspace,/\.persistJourney\(/,"Workspace must not invoke synchronous Journey persistence.");
assert.doesNotMatch(workspace,/\.recordRecommendationReference\(/,"Workspace must not invoke synchronous recommendation persistence.");
assert.doesNotMatch(settlement,/recordRecommendationForMessage\(/,"Atomic settlement must not call legacy recommendation writer.");
assert.match(settlement,/settleConversationWithSharedAuthority\(/,"Settlement must retain atomic authority.");
assert.match(legacy,/recordRecommendationReference\(/,"Legacy writer must remain visible to independent reachability review.");
assert.match(syncJourney,/memory\.updateProject\(/,"Legacy synchronous Journey writer remains visible to independent audit.");
console.log("GREEN: inspected workspace calls coordinated Journey and atomic settlement; legacy writer paths remain separately identified.");

import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

// RED-first atomicity contract: a strict settlement must commit all durable
// effects as one fresh-state transaction, not a series of independently
// persisted conversation, handoff, recommendation and retirement writes.
const read=path=>readFileSync(new URL(path,import.meta.url),"utf8");
const runtime=read("../src/components/studio/mentor/MovieMentorStudioIdentityRuntime.js");
const facade=read("../src/components/studio/mentor/CreatorMemory.js");
const begin=runtime.indexOf("async function settleConversationMessage(");
const end=runtime.indexOf("function resumeProjectConversation(",begin);
assert.ok(begin>=0&&end>begin);
const settlement=runtime.slice(begin,end);
assert.match(settlement,/creatorTurnId/,"Durable turn identity must remain mandatory.");
assert.match(settlement,/withDurableSettlementAuthority\(/,"Existing lock ordering must remain.");
assert.match(facade,/replaceStateWithSharedAuthority/,"Fresh-state shared writer must remain available.");
assert.match(settlement,/settleConversationWithSharedAuthority\(/,
 "RED: settlement has not migrated to an atomic strict-compatible transaction.");
assert.doesNotMatch(settlement,/memory\.convergeConversationSettlement\(/,
 "RED: standalone conversation persistence still occurs outside atomic settlement.");
assert.doesNotMatch(settlement,/saveConversationHandoff\(/,
 "RED: standalone handoff persistence still occurs outside atomic settlement.");
assert.doesNotMatch(settlement,/recordRecommendationForMessage\(/,
 "RED: standalone recommendation persistence still occurs outside atomic settlement.");
assert.match(settlement,/retirePendingCreatorMessage\(/,
 "Pending creator message must only retire after successful durable commit.");
console.log("GREEN: mentor settlement uses one strict-compatible atomic commit boundary.");

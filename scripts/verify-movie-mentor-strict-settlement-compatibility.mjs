import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

// RED-first: strict default Studio must retain legitimate mentor settlement.
// The atomic shared-authority transaction owns fresh-state persistence and
// creator-turn locking; nesting the former outer lock is prohibited.
const source=readFileSync(new URL("../src/components/studio/mentor/MovieMentorStudioIdentityRuntime.js",import.meta.url),"utf8");
const section=(start,end)=>{
 const a=source.indexOf(start),b=source.indexOf(end,a+start.length);
 assert.ok(a>=0&&b>a,`Missing settlement section: ${start}`);
 return source.slice(a,b);
};
const settlement=section("async function settleConversationMessage(","function resumeProjectConversation(");
assert.match(settlement,/creatorTurnId/,"Durable creator-turn identity must remain mandatory.");
assert.doesNotMatch(settlement,/withDurableSettlementAuthority\(/,
 "Nested shared-lock acquisition must remain prohibited.");
assert.match(settlement,/settlementLockName:\s*DURABLE_SETTLEMENT_LOCK_NAME/,
 "Atomic settlement must retain creator-turn lock authority.");
assert.match(settlement,/settleConversationWithSharedAuthority\(/,
 "RED: settlement must use a strict-compatible atomic shared-authority transaction.");
assert.doesNotMatch(settlement,/memory\.convergeConversationSettlement\(/,
 "Standalone conversation persistence must not bypass atomic settlement.");
assert.doesNotMatch(settlement,/saveConversationHandoff\(/,
 "Standalone handoff persistence must not bypass atomic settlement.");
assert.doesNotMatch(settlement,/recordRecommendationForMessage\(/,
 "Standalone recommendation persistence must not bypass atomic settlement.");
assert.match(settlement,/retirePendingCreatorMessage\(/,
 "Pending creator turn must retire only after successful durable settlement.");
console.log("GREEN: mentor settlement is atomic strict-authority compatible.");

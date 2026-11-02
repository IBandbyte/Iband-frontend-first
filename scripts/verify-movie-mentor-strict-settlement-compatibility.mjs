import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

// RED-first: a strict default Studio must not lose legitimate mentor settlement.
// The current settlement uses synchronous facade writes while holding an async
// shared lock. Strict facade policy denies those writes even inside that lock.
const source=readFileSync(new URL("../src/components/studio/mentor/MovieMentorStudioIdentityRuntime.js",import.meta.url),"utf8");
const section=(start,end)=>{
 const a=source.indexOf(start),b=source.indexOf(end,a+start.length);
 assert.ok(a>=0&&b>a,`Missing settlement section: ${start}`);
 return source.slice(a,b);
};
const settlement=section("async function settleConversationMessage(","function resumeProjectConversation(");
assert.match(settlement,/withDurableSettlementAuthority\(/);
assert.match(settlement,/memory\.convergeConversationSettlement\(/);
assert.match(settlement,/saveConversationHandoff\(/);
assert.match(settlement,/recordRecommendationForMessage\(/);
// Explicit authority-owned settlement must use an async strict-compatible
// transaction rather than synchronous facade persistence.
assert.match(settlement,/settleConversationWithSharedAuthority\(/,
 "RED: settlement still invokes synchronous facade writers that strict mode denies.");
console.log("GREEN: mentor settlement is strict-authority compatible.");

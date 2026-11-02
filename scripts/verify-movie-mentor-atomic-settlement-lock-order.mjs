import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const source=readFileSync(new URL("../src/components/studio/mentor/MovieMentorStudioIdentityRuntime.js",import.meta.url),"utf8");
const begin=source.indexOf("async function withDurableSettlementAuthority(");
const end=source.indexOf("async function settleConversationMessage(",begin);
assert.ok(begin>=0&&end>begin);
const wrapper=source.slice(begin,end);
assert.match(wrapper,/withMovieMentorMemoryWriteAuthority\(/);
assert.match(wrapper,/DURABLE_SETTLEMENT_LOCK_NAME/);

// RED-first: a shared-authority operation must never reacquire the same
// non-reentrant browser lock from inside the settlement lock callback.
// The atomic memory API already acquires the shared lock itself. Migrating
// the caller without removing the outer shared acquisition would deadlock.
const settle=source.slice(end,source.indexOf("function resumeProjectConversation(",end));
assert.match(settle,/settleConversationWithSharedAuthority\(/,
 "RED: real Studio settlement has not been migrated to the atomic API.");
assert.doesNotMatch(settle,/withDurableSettlementAuthority\(/,
 "RED: nested shared-lock acquisition would deadlock during atomic settlement.");
console.log("GREEN: Studio settlement uses one shared-lock acquisition boundary.");

import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

// A reload/read-only resume must not write a whole Creator Memory snapshot.
// The existing synchronous resume marker is a separate live writer from
// creation, Journey mode, and conversation settlement.
const runtime=readFileSync(new URL("../src/components/studio/mentor/MovieMentorStudioIdentityRuntime.js",import.meta.url),"utf8");
const start=runtime.indexOf("function resumeProjectConversation(");
const end=runtime.indexOf("function blockedDivergentProjectionRecovery(",start);
assert.ok(start>=0&&end>start,"Studio resume path must exist.");
const resume=runtime.slice(start,end);
assert.doesNotMatch(resume,/memory\.markSessionHandoffResumed\s*\(/,
  "RED: synchronous resume path still performs a durable handoff marker write without shared authority.");
assert.match(resume,/getProjectHandoff\s*\(/,"Resume must still read the project handoff.");
assert.match(resume,/getProjectConversationMessages\s*\(/,"Resume must still read the project conversation.");
console.log("GREEN: Studio conversation resume is read-only and cannot bypass shared writer authority.");

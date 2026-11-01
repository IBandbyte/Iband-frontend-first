import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

// The real workspace must not route unkeyed mentor replies into the legacy
// synchronous whole-memory writer. Creator pending turns are not durable commits.
const workspace=readFileSync(new URL("../src/components/studio/CreatorWorkspace.jsx",import.meta.url),"utf8");
const runtime=readFileSync(new URL("../src/components/studio/mentor/MovieMentorStudioIdentityRuntime.js",import.meta.url),"utf8");
const start=workspace.indexOf("const handleMovieMessage =");
const end=workspace.indexOf("const handleMovieMentorTurnResult =",start);
assert.ok(start>=0&&end>start,"Movie conversation handler must exist.");
const handler=workspace.slice(start,end);
assert.doesNotMatch(handler,/identityRuntime\.recordConversationMessage\s*\(/,
  "RED: real workspace still routes unkeyed mentor replies through synchronous whole-memory writes.");
assert.match(handler,/identityRuntime\.settleConversationMessage\s*\(/,
  "RED: mentor replies must use coordinated settlement.");
assert.match(runtime,/async function settleConversationMessage\s*\(/,
  "RED: settlement runtime must expose an asynchronous shared-authority path.");
const settle=runtime.slice(runtime.indexOf("async function settleConversationMessage"),runtime.indexOf("function resumeProjectConversation"));
assert.doesNotMatch(settle,/if\s*\(!creatorTurnId\)\s*return\s+recordConversationMessage\s*\(/,
  "RED: unkeyed mentor settlement must not fall back to the synchronous writer.");
console.log("GREEN: workspace mentor replies avoid synchronous fallback and require coordinated settlement.");

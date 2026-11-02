import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=path=>readFileSync(new URL(`../${path}`,import.meta.url),"utf8");
const runtime=read("src/components/studio/mentor/MovieMentorStudioIdentityRuntime.js");
const workspace=read("src/components/studio/CreatorWorkspace.jsx");
const conversation=read("src/components/studio/mentor/MovieMentorConversation.jsx");
const response=read("src/components/studio/mentor/ResponseGenerator.js");
const facade=read("src/components/studio/mentor/CreatorMemory.js");

// Inventory concrete live entry points without claiming global repository
// exhaustiveness or treating test-only legacy fixtures as production callers.
assert.match(runtime,/memory\s*=\s*createCreatorMemory\(\{\s*requireSharedWriteAuthority:\s*true\s*\}\)/,
  "Studio runtime default must use strict memory.");
assert.match(workspace,/createMovieMentorStudioIdentityRuntime\(\)/,
  "Workspace must construct the strict-default runtime.");
assert.match(conversation,/createMovieMentorStudioIdentityRuntime\(\)/,
  "Conversation recovery must construct the strict-default runtime.");
assert.match(response,/requireSharedWriteAuthority:\s*true/,
  "ResponseGenerator default memory must be strict.");
assert.match(response,/memoryFactory\s*=\s*null/,
  "Injected memory factory remains an explicit compatibility boundary.");
assert.match(facade,/requireSharedWriteAuthority\s*=\s*false/,
  "Permissive legacy facade default remains an explicit, uncertified boundary.");
console.log("GREEN: audited Studio entry points are strict by default; injected and legacy permissive boundaries remain open.");

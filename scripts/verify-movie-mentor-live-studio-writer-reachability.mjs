import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=path=>readFileSync(new URL(`../${path}`,import.meta.url),"utf8");
const workspace=read("src/components/studio/CreatorWorkspace.jsx");
const runtime=read("src/components/studio/mentor/MovieMentorStudioIdentityRuntime.js");
const conversation=read("src/components/studio/mentor/MovieMentorConversation.jsx");
const generator=read("src/components/studio/mentor/ResponseGenerator.js");
const adaptive=read("src/components/studio/mentor/AdaptiveMentorEngine.js");
const engine=read("src/components/studio/mentor/CreatorMemoryEngine.js");

// Narrow reachability evidence for the concrete Studio components; this does
// not claim exhaustive application-wide absence of other entry points.
assert.match(workspace,/createMovieMentorStudioIdentityRuntime\(\)/);
assert.match(workspace,/identityRuntime\.ensureProjectWithSharedAuthority\(/);
assert.match(workspace,/identityRuntime\.persistJourneyWithSharedAuthority\(/);
assert.match(runtime,/memory\s*=\s*createCreatorMemory\(\{\s*requireSharedWriteAuthority:\s*true\s*\}\)/);
assert.match(runtime,/async function ensureProjectWithSharedAuthority\(/);
assert.match(runtime,/async function persistJourneyWithSharedAuthority\(/);
assert.match(conversation,/createMovieMentorStudioIdentityRuntime\(\)/);
assert.doesNotMatch(workspace,/\bcreateResponseGenerator\s*\(/,"Workspace must not directly construct legacy response generator.");
assert.doesNotMatch(conversation,/\bcreateResponseGenerator\s*\(/,"Movie conversation wrapper must not directly construct legacy response generator.");
assert.match(generator,/createAdaptiveMentorEngine\(\{/);
assert.match(adaptive,/createCreatorMemoryEngine\(\{/);
assert.match(adaptive,/\.applyMemoryInstructions\(/);
assert.match(engine,/\.applyMemoryInstructions\(/);
console.log("GREEN: audited live Studio project/Journey writes use strict coordinated runtime; separate response-engine mutation chain exists but direct Studio construction is not evidenced.");

import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=path=>readFileSync(new URL(`../${path}`,import.meta.url),"utf8");
const workspace=read("src/components/studio/CreatorWorkspace.jsx");
const runtime=read("src/components/studio/mentor/MovieMentorStudioIdentityRuntime.js");
const generator=read("src/components/studio/mentor/ResponseGenerator.js");
const adaptive=read("src/components/studio/mentor/AdaptiveMentorEngine.js");
const engine=read("src/components/studio/mentor/CreatorMemoryEngine.js");
const facade=read("src/components/studio/mentor/CreatorMemory.js");

// Live AI Movie workspace: project/Journey mutations must be coordinated.
assert.match(workspace,/identityRuntime\.ensureProjectWithSharedAuthority\(/);
assert.match(workspace,/identityRuntime\.persistJourneyWithSharedAuthority\(/);
assert.match(runtime,/memory\s*=\s*createCreatorMemory\(\{\s*requireSharedWriteAuthority:\s*true\s*\}\)/);

// Response generator defaults to strict memory, but externally injected
// read-only adapters and separately supplied specialists remain distinct paths.
assert.match(generator,/requireSharedWriteAuthority:\s*true/);
assert.match(generator,/requireSafeInjectedMemory\(memory\)/);
assert.match(generator,/createAdaptiveMentorEngine\(\{/);
assert.match(generator,/\.applyMemoryInstructions\(/);
assert.match(adaptive,/createCreatorMemoryEngine\(\{/);
assert.match(adaptive,/Compatibility execution exists only for older Creator Memory/);
assert.match(adaptive,/\.applyMemoryInstructions\(/);
assert.match(engine,/Preferred generic persistence bridge/);
assert.match(engine,/\.applyMemoryInstructions\(/);

// Legacy compatibility cannot be represented as universally coordinated.
assert.match(facade,/requireSharedWriteAuthority\s*=\s*false/);
assert.match(facade,/async function replaceStateWithSharedAuthority/);
console.log("GREEN: live Studio coordinated writers, default-strict response generator, and separately reachable compatibility mutation bridges classified; legacy cross-tab safety NOT certified.");

import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const read=path=>readFileSync(new URL(`../${path}`,import.meta.url),"utf8");
const studio=read("src/components/studio/CreatorWorkspace.jsx");
const runtime=read("src/components/studio/mentor/MovieMentorStudioIdentityRuntime.js");
const generator=read("src/components/studio/mentor/ResponseGenerator.js");
const facade=read("src/components/studio/mentor/CreatorMemory.js");
const adaptive=read("src/components/studio/mentor/AdaptiveMentorEngine.js");
const engine=read("src/components/studio/mentor/CreatorMemoryEngine.js");

// Source-level migration gate for known live Studio entry points. This is NOT
// a whole-repository reachability proof and does NOT certify legacy writers.
assert.match(studio,/identityRuntime\.ensureProjectWithSharedAuthority\(/);
assert.match(studio,/identityRuntime\.persistJourneyWithSharedAuthority\(/);
assert.match(runtime,/memory\s*=\s*createCreatorMemory\(\{\s*requireSharedWriteAuthority:\s*true\s*\}\)/);
assert.match(runtime,/memory\.replaceStateWithSharedAuthority\(/);
assert.match(generator,/requireSharedWriteAuthority:\s*true/);
assert.match(generator,/requireSafeInjectedMemory\(memory\)/);
assert.match(adaptive,/requireVerifiedMemoryAuthority\(memory\)/);
assert.match(engine,/requireVerifiedMemoryAuthority\(memory\)/);

// Explicit unresolved legacy boundary: no claim that sync writes are safe.
assert.match(facade,/requireSharedWriteAuthority\s*=\s*false/);
assert.match(facade,/async function replaceStateWithSharedAuthority/);
assert.match(facade,/requireSharedWriteAuthority === true\s*\? \(\) => false/);
console.log("GREEN: known live Studio writers use coordinated strict memory and lower-level injections are fenced; default legacy synchronous writers remain uncoordinated and NOT certified.");

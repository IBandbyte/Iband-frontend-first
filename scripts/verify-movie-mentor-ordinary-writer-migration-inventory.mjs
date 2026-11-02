import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

// Inventory executable migration surfaces; do not confuse the strict Studio
// default with migration of every legacy synchronous writer.
const read=path=>readFileSync(new URL(`../${path}`,import.meta.url),"utf8");
const facade=read("src/components/studio/mentor/CreatorMemory.js");
const generator=read("src/components/studio/mentor/ResponseGenerator.js");
const adaptive=read("src/components/studio/mentor/AdaptiveMentorEngine.js");
const engine=read("src/components/studio/mentor/CreatorMemoryEngine.js");
const authority=read("src/components/studio/mentor/MovieMentorMemoryWriteAuthority.js");
assert.match(facade,/requireSharedWriteAuthority\s*=\s*false/,"Legacy synchronous facade remains permissive by default.");
assert.match(facade,/async function replaceStateWithSharedAuthority/,"Coordinated ordinary writer exists.");
assert.match(authority,/locks\.request\(/,"Shared writer authority must use browser locks.");
assert.match(generator,/\.applyMemoryInstructions\(/,"Generator retains executable memory operation fallback.");
assert.match(adaptive,/\.applyMemoryInstructions\(/,"Adaptive engine retains memory mutation entry point.");
assert.match(engine,/\.applyMemoryInstructions\(/,"Memory engine retains memory mutation entry point.");
console.log("GREEN: synchronous legacy facade and three executable memory-operation callers inventoried; cross-tab migration is NOT certified.");

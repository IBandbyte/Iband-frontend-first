import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const source=readFileSync(new URL("../src/components/studio/mentor/ResponseGenerator.js",import.meta.url),"utf8");
// Verifier-first: expose the unresolved injected-factory authority bypass.
// A service-shape check alone cannot establish that injected CreatorMemory
// uses the strict shared-authority mode.
const constructor=source.slice(source.indexOf("function createResponseGenerator("),source.indexOf("let activeResponseProvider",source.indexOf("function createResponseGenerator(")));
assert.match(constructor,/memoryFactory\s*=\s*null/);
assert.match(constructor,/memory\s*=\s*null/);
assert.match(constructor,/requireSharedWriteAuthority:\s*true/);
assert.doesNotMatch(constructor,/typeof memoryFactory\s*===\s*"function"\s*\?\s*memoryFactory/,
 "RED: externally supplied factory bypasses strict default without an authority check.");
assert.doesNotMatch(constructor,/let activeMemory\s*=\s*memory\s*\|\|/,
 "RED: externally supplied memory bypasses strict default without an authority check.");
console.log("GREEN: ResponseGenerator injected memory cannot silently bypass strict authority.");

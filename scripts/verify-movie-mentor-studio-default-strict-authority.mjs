import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

// RED-first: the default Studio runtime must not silently instantiate a
// permissive Creator Memory writer. Injected test memories remain explicit.
const runtime = readFileSync(new URL("../src/components/studio/mentor/MovieMentorStudioIdentityRuntime.js", import.meta.url), "utf8");
assert.match(runtime, /memory\s*=\s*createCreatorMemory\(\{\s*requireSharedWriteAuthority:\s*true\s*\}\)/,
  "RED: default Studio runtime still creates permissive synchronous Creator Memory.");
assert.match(runtime, /async function ensureProjectWithSharedAuthority\(/,
  "Studio project creation must retain coordinated writer.");
assert.match(runtime, /async function persistJourneyWithSharedAuthority\(/,
  "Studio Journey persistence must retain coordinated writer.");
assert.match(runtime, /withDurableSettlementAuthority\(/,
  "Settlement lock ordering must remain explicit.");
console.log("GREEN: default Studio runtime denies legacy synchronous writes.");

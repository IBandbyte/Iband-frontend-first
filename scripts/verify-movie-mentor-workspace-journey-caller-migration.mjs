import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

// Caller-level migration contract. The real workspace must not retain an
// executable synchronous Journey writer, even as an unused convenience helper.
const read = path => readFileSync(new URL(path, import.meta.url), "utf8");
const workspace = read("../src/components/studio/CreatorWorkspace.jsx");
const runtime = read("../src/components/studio/mentor/MovieMentorStudioIdentityRuntime.js");
assert.match(runtime, /async function persistJourneyWithSharedAuthority\(/,
  "Coordinated Journey persistence must remain available.");
assert.match(workspace, /identityRuntime\.persistJourneyWithSharedAuthority\(/,
  "Workspace must use coordinated Journey persistence.");
assert.doesNotMatch(workspace, /identityRuntime\.persistJourney\(/,
  "RED: workspace retains a synchronous Journey persistence caller.");
assert.match(workspace, /ensureProjectWithSharedAuthority\(/,
  "Studio project creation must remain coordinated.");
console.log("GREEN: workspace Journey and project writers use coordinated async entry points.");

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = name => readFileSync(new URL(name, import.meta.url), "utf8");
const studio = read("../src/components/studio/mentor/MovieMentorStudioIdentityRuntime.js");
const resume = read("../src/components/studio/mentor/JourneyRecommendationResumeRecovery.js");
const lifecycle = read("../src/components/studio/mentor/JourneyRecommendationLifecycleRecovery.js");
const persistence = read("../src/components/studio/mentor/JourneyRecommendationLifecyclePersistence.js");
const workspace = read("../src/components/studio/CreatorWorkspace.jsx");

// Independent caller-boundary inventory. This does not certify every exported
// synchronous writer: it verifies that the live Studio recovery route uses the
// fresh-memory shared authority, and records the remaining direct-write seams.
const coordinated = studio.match(/async function recoverResumeRecommendationsWithSharedAuthority\([\s\S]*?\n  }/);
assert.ok(coordinated, "Studio coordinated recovery entry point must exist.");
assert.match(coordinated[0], /memory\.runRecoveryWithSharedAuthority\(/,
  "Studio resume recovery must acquire shared memory authority.");
assert.match(coordinated[0], /operation:\s*fresh\s*=>\s*certifyJourneyRecommendationResume\(/,
  "Recovery certification must receive the fresh locked memory instance.");
assert.match(coordinated[0], /memory:\s*fresh/,
  "Recovery must not pass the stale Studio facade to certification.");
assert.match(workspace, /recoverResumeRecommendationsWithSharedAuthority\(/,
  "Real workspace must invoke coordinated resume recovery.");
assert.match(resume, /executeJourneyRecommendationLifecycleRecovery\(/,
  "Certification must actually execute lifecycle recovery.");
assert.match(lifecycle, /memory\.replaceState\(nextState\)/,
  "Lifecycle recovery's synchronous persistence seam must remain visible.");
assert.match(persistence, /memory\.replaceState\(nextState\)/,
  "Lifecycle persistence's synchronous seam must remain visible.");
console.log("GREEN: live resume recovery routes through fresh shared authority; exported synchronous lifecycle seams remain identified, not certified.");

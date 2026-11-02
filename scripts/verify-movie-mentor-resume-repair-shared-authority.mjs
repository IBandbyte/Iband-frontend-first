import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

// RED-first contract: the synchronous resume path must not perform durable
// recommendation repair/quarantine outside the exclusive recovery lock.
// This is an architecture verifier, not a substitute for browser contention.
const read=path=>readFileSync(new URL(path,import.meta.url),"utf8");
const runtime=read("../src/components/studio/mentor/MovieMentorStudioIdentityRuntime.js");
const resume=read("../src/components/studio/mentor/JourneyRecommendationResumeRecovery.js");
const lifecycle=read("../src/components/studio/mentor/JourneyRecommendationLifecycleRecovery.js");
const quarantine=read("../src/components/studio/mentor/JourneyRecommendationRecoveryConflictQuarantine.js");
const snapshot=runtime.slice(runtime.indexOf("function getResumeSnapshot("));
assert.doesNotMatch(snapshot,/certifyJourneyRecommendationResume\(/,"Render-time resume must not invoke recovery.");
assert.match(runtime,/async function recoverResumeRecommendationsWithSharedAuthority\(/,"Recovery must have a distinct asynchronous entry point.");
assert.match(runtime,/runRecoveryWithSharedAuthority\(/,"Recovery must acquire fresh shared writer authority.");
assert.match(resume,/executeJourneyRecommendationLifecycleRecovery\(/,"Resume recovery may repair lifecycle.");
assert.match(resume,/quarantineJourneyRecommendationRecoveryConflicts\(/,"Resume recovery may quarantine conflicts.");
assert.match(lifecycle,/memory\.replaceState\(/,"Lifecycle repair writes whole Creator Memory state.");
assert.match(quarantine,/memory\.replaceState\(/,"Conflict quarantine writes whole Creator Memory state.");
const recovery=runtime.slice(runtime.indexOf("async function recoverResumeRecommendationsWithSharedAuthority("),runtime.indexOf("function getCertifiedResumeSnapshot("));
assert.match(recovery,/operation:\s*fresh\s*=>\s*certifyJourneyRecommendationResume\(/,"Recovery certification must execute against fresh state inside the lock.");
assert.match(runtime,/function getCertifiedResumeSnapshot\(/,"Post-lock certification must have a separate read boundary.");
console.log("GREEN: resume recommendation repair/quarantine is routed through explicit shared writer authority.");

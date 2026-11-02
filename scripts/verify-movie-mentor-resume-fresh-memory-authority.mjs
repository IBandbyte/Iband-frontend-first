import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

// RED-first: the repair/quarantine lifecycle must run against a fresh Creator
// Memory instance while the shared exclusive lock is held, not against the
// stale render-time facade or a partial hand-written state transform.
const read=p=>readFileSync(new URL(p,import.meta.url),"utf8");
const facade=read("../src/components/studio/mentor/CreatorMemory.js");
const runtime=read("../src/components/studio/mentor/MovieMentorStudioIdentityRuntime.js");
const resume=read("../src/components/studio/mentor/JourneyRecommendationResumeRecovery.js");
const lifecycle=read("../src/components/studio/mentor/JourneyRecommendationLifecycleRecovery.js");
const quarantine=read("../src/components/studio/mentor/JourneyRecommendationRecoveryConflictQuarantine.js");
assert.match(resume,/executeJourneyRecommendationLifecycleRecovery\(/);
assert.match(resume,/quarantineJourneyRecommendationRecoveryConflicts\(/);
assert.match(lifecycle,/memory\.replaceState\(/);
assert.match(quarantine,/memory\.replaceState\(/);
assert.match(facade,/withMovieMentorMemoryWriteAuthority\(/);
assert.match(facade,/createCreatorMemoryCore\(/);
assert.match(runtime,/settlementLockManager/);
assert.match(facade,/runRecoveryWithSharedAuthority/,"RED: fresh-memory shared-authority recovery primitive missing.");
assert.match(runtime,/async function recoverResumeRecommendationsWithSharedAuthority\(/,"RED: runtime async recovery entrypoint missing.");
assert.match(runtime,/recoverResumeRecommendationsWithSharedAuthority,/,"RED: async recovery entrypoint not exposed to workspace.");
console.log("GREEN: fresh-memory shared-lock recommendation recovery and quarantine route are registered.");

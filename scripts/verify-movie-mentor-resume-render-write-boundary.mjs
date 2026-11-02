import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

// RED-first render boundary: the synchronous React render path must not
// initiate any durable recommendation repair, quarantine, or retry.
const read=path=>readFileSync(new URL(path,import.meta.url),"utf8");
const workspace=read("../src/components/studio/CreatorWorkspace.jsx");
const runtime=read("../src/components/studio/mentor/MovieMentorStudioIdentityRuntime.js");
const resume=read("../src/components/studio/mentor/JourneyRecommendationResumeRecovery.js");
const lifecycle=read("../src/components/studio/mentor/JourneyRecommendationLifecycleRecovery.js");
const quarantine=read("../src/components/studio/mentor/JourneyRecommendationRecoveryConflictQuarantine.js");
assert.match(workspace,/useMemo\(\(\) => identityRuntime\.getResumeSnapshot\(\)/,"Workspace render calls the synchronous resume snapshot.");
assert.match(resume,/executeJourneyRecommendationLifecycleRecovery\(/,"Resume recovery can perform lifecycle repair.");
assert.match(resume,/quarantineJourneyRecommendationRecoveryConflicts\(/,"Resume recovery can quarantine proof conflicts.");
assert.match(lifecycle,/memory\.replaceState\(/,"Lifecycle repair persists whole state.");
assert.match(quarantine,/memory\.replaceState\(/,"Conflict quarantine persists whole state.");
const start=runtime.indexOf("function getResumeSnapshot(");
assert.ok(start>=0,"Resume snapshot entrypoint must be present.");
const snapshot=runtime.slice(start,runtime.indexOf("\n  return {\n    version:",start));
assert.doesNotMatch(snapshot,/certifyJourneyRecommendationResume\(/,"RED: synchronous render-time snapshot still invokes potentially durable recommendation repair.");
console.log("GREEN: synchronous render-time resume snapshot does not invoke durable repair or quarantine.");

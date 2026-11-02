import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

// Migration court for the actual UI journey-mode event. A React state updater
// must not perform a durable write, and no synchronous Creator Memory project
// update may be presented as safely committed.
const workspace=readFileSync(new URL("../src/components/studio/CreatorWorkspace.jsx",import.meta.url),"utf8");
const runtime=readFileSync(new URL("../src/components/studio/mentor/MovieMentorStudioIdentityRuntime.js",import.meta.url),"utf8");
const start=workspace.indexOf("const handleCreatorJourneyChange =");
const end=workspace.indexOf("const handleMovieMessage =",start);
assert.ok(start>=0&&end>start,"Journey mode event handler must exist.");
const handler=workspace.slice(start,end);
assert.doesNotMatch(handler,/setProjectJourney\s*\(\s*\(?\s*currentJourney\s*\)?\s*=>[\s\S]*persistMovieJourney\s*\(/,
  "RED: React state updater must not perform durable persistence.");
assert.match(handler,/await\s+identityRuntime\.persistJourneyWithSharedAuthority\s*\(/,
  "RED: journey mode event must await shared write authority.");
assert.match(handler,/\.acquired\s*!==?\s*true|!\s*\w+\.acquired/,
  "RED: denied journey persistence must be handled before success UI.");
assert.match(runtime,/async function persistJourneyWithSharedAuthority\s*\(/,
  "RED: Studio runtime must expose coordinated Journey persistence.");
console.log("GREEN: journey mode caller awaits coordinated durable persistence outside React state updater.");

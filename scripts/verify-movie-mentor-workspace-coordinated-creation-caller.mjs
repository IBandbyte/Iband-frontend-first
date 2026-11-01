import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

// The real CreatorWorkspace AI Movie selection handler is the first UI caller.
// This court forbids fallback to the synchronous uncoordinated project writer,
// and requires an awaited shared-authority result before presenting creation.
const source=readFileSync(new URL("../src/components/studio/CreatorWorkspace.jsx",import.meta.url),"utf8");
const start=source.indexOf("const handleCreatorModeSelect =");
const end=source.indexOf("const handleCreatorJourneyChange =",start);
assert.ok(start>=0&&end>start,"Real AI Movie selection handler must be located.");
const handler=source.slice(start,end);
assert.match(handler,/ensureProjectWithSharedAuthority\s*\(/,
  "RED: AI Movie selection must use the coordinated project creation entrypoint.");
assert.doesNotMatch(handler,/identityRuntime\.ensureProject\s*\(/,
  "RED: UI must not fall back to the unfenced synchronous creation path.");
assert.match(handler,/await\s+identityRuntime\.ensureProjectWithSharedAuthority\s*\(/,
  "RED: creation must await authority before updating the UI.");
assert.match(handler,/\.acquired\s*!==?\s*true|!\s*\w+\.acquired/,
  "RED: denied shared authority must be handled explicitly.");
console.log("GREEN: real AI Movie selection awaits coordinated project creation and handles denial.");

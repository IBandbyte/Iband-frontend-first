import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

// RED-first executable adoption contract. The UI may only publish a certified
// snapshot from the completed exclusive-lock transaction; a new synchronous
// render snapshot is intentionally fail-closed and cannot stand in for it.
const read=p=>readFileSync(new URL(p,import.meta.url),"utf8");
const runtime=read("../src/components/studio/mentor/MovieMentorStudioIdentityRuntime.js");
const workspace=read("../src/components/studio/CreatorWorkspace.jsx");
assert.match(runtime,/async function recoverResumeRecommendationsWithSharedAuthority\(/);
assert.match(runtime,/runRecoveryWithSharedAuthority\(/);
assert.match(workspace,/recoverResumeRecommendationsWithSharedAuthority\(/);
assert.match(workspace,/if \(cancelled\) return;/);
assert.match(workspace,/current\?\.projectId !== projectId/);
assert.match(runtime,/function getCertifiedResumeSnapshot\(/,"RED: certified post-transaction snapshot API missing.");
assert.match(workspace,/getCertifiedResumeSnapshot\(/,"RED: workspace does not adopt a certified post-lock snapshot.");
console.log("GREEN: post-lock resume adoption uses an explicit certified snapshot and stale-project fence.");

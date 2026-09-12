import assert from "node:assert/strict";
import fs from "node:fs";

const workspace = fs.readFileSync("src/components/studio/CreatorWorkspace.jsx", "utf8");
const conversation = fs.readFileSync("src/components/studio/mentor/MovieMentorConversation.jsx", "utf8");
const core = fs.readFileSync("src/components/studio/mentor/MovieMentorConversationCore.jsx", "utf8");
const turnClient = fs.readFileSync("src/components/studio/mentor/MovieMentorTurnClient.js", "utf8");
const gateway = fs.readFileSync("src/components/studio/mentor/MovieMentorLiveGatewayService.js", "utf8");
const establishment = fs.readFileSync("src/components/studio/mentor/MovieMentorProjectEstablishmentAuthority.js", "utf8");

assert.match(workspace, /<MovieMentorConversation\b/, "creator cockpit must mount MovieMentorConversation");
assert.match(workspace, /projectId=\{activeMovieProject\.id\}/, "creator cockpit must carry canonical project id");
assert.match(workspace, /projectIdentity=\{activeMovieProject\.identity\}/, "creator cockpit must carry canonical project identity into the live conversation road");
assert.match(conversation, /<MovieMentorConversationCore\s+\{\.\.\.props\}/, "live conversation wrapper must forward creator project inputs to the core");
assert.match(core, /projectIdentity\s*=\s*null/, "creator-facing core must receive canonical project identity");
assert.match(core, /requestMovieMentorTurn\(\{[^}]*projectIdentity/s, "creator-facing core must forward canonical project identity to the authoritative turn client");

assert.match(turnClient, /establishMovieMentorProject/, "authoritative turn client must own project establishment before durable sync");
assert.match(turnClient, /projectIdentity/, "authoritative turn client must receive canonical project identity");
const establishIndex = turnClient.indexOf("await establishMovieMentorProject(");
const preSyncIndex = turnClient.indexOf("if(beforeDurableSync)await beforeDurableSync(");
const syncIndex = turnClient.indexOf("await flushMovieMentorDurableStateSync(");
const turnIndex = turnClient.indexOf("/api/movie-mentor/turn");
assert.ok(establishIndex >= 0 && preSyncIndex > establishIndex && syncIndex > preSyncIndex && turnIndex > syncIndex, "actual creator turn road must establish project before optional gateway sync before durable sync before turn");

assert.match(establishment, /\/api\/movie-mentor\/projects/, "shared project-establishment authority must own the production project route");
assert.match(establishment, /JSON\.stringify\(\{ projectId: canonicalProjectId, identity: canonicalIdentity \}\)/, "shared establishment authority must send only canonical project id and identity");
assert.doesNotMatch(establishment, /principalId|ownerPrincipalId|authorityId|verified\s*:|establishmentAuthority|ownershipReference|ownershipRevision/, "client establishment authority must not mint backend ownership fields");

assert.doesNotMatch(gateway, /establishMovieMentorProject/, "workspace live gateway must not duplicate project establishment owned by the authoritative turn client");
assert.match(gateway, /beforeDurableSync:[\s\S]*syncWorkspaceReality/, "workspace live gateway must place workspace sync inside the established turn sequence");
assert.match(gateway, /projectIdentity:\s*request\?\.projectIdentity/, "workspace live gateway must carry canonical project identity into the authoritative turn client");

console.log("Movie Mentor creator project establishment path verification: PASS — canonical identity crosses the creator cockpit and one shared authority establishes project reality before every sync and turn boundary.");

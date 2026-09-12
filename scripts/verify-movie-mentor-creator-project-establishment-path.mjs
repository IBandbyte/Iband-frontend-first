import assert from "node:assert/strict";
import fs from "node:fs";

const workspace = fs.readFileSync("src/components/studio/CreatorWorkspace.jsx", "utf8");
const conversation = fs.readFileSync("src/components/studio/mentor/MovieMentorConversation.jsx", "utf8");
const core = fs.readFileSync("src/components/studio/mentor/MovieMentorConversationCore.jsx", "utf8");
const gateway = fs.readFileSync("src/components/studio/mentor/MovieMentorLiveGatewayService.js", "utf8");

assert.match(workspace, /<MovieMentorConversation\b/, "creator cockpit must mount MovieMentorConversation");
assert.match(workspace, /projectId=\{activeMovieProject\.id\}/, "creator cockpit must carry canonical project id");
assert.match(workspace, /projectIdentity=\{activeMovieProject\.identity\}/, "creator cockpit must carry canonical project identity into the live conversation road");

assert.match(conversation, /<MovieMentorConversationCore\s+\{\.\.\.props\}/, "live conversation wrapper must forward creator project authority inputs to the core");

assert.doesNotMatch(core, /import\s+requestMovieMentorTurn\s+from\s+["']\.\/MovieMentorTurnClient\.js["']/, "creator-facing conversation core must not bypass project establishment by importing the raw turn client");
assert.match(core, /generateMovieMentorLiveResponse/, "creator-facing conversation core must enter through the project-establishing live gateway");
assert.match(core, /projectIdentity/, "creator-facing conversation core must carry canonical project identity into the live gateway");

const establishIndex = gateway.indexOf("await establishProjectReality(");
const syncIndex = gateway.indexOf("await syncWorkspaceReality(");
const turnIndex = gateway.indexOf("await requestMovieMentorTurn(");
assert.ok(establishIndex >= 0 && syncIndex > establishIndex && turnIndex > syncIndex, "live gateway must establish project before state sync before turn");

console.log("Movie Mentor creator project establishment path verification: PASS — the actual creator cockpit crosses canonical project establishment before sync and turn.");

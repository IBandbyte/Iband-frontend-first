import assert from "node:assert/strict";
import fs from "node:fs";

const workspace = fs.readFileSync("src/components/studio/CreatorWorkspace.jsx", "utf8");
const conversation = fs.readFileSync("src/components/studio/mentor/MovieMentorConversation.jsx", "utf8");
const turnClient = fs.readFileSync("src/components/studio/mentor/MovieMentorTurnClient.js", "utf8");
const gateway = fs.readFileSync("src/components/studio/mentor/MovieMentorLiveGatewayService.js", "utf8");

assert.match(workspace, /<MovieMentorConversation\b/, "creator cockpit must mount MovieMentorConversation");
assert.match(workspace, /projectId=\{activeMovieProject\.id\}/, "creator cockpit must carry canonical project id");
assert.match(workspace, /projectIdentity=\{activeMovieProject\.identity\}/, "creator cockpit must carry canonical project identity into the live conversation road");

assert.match(conversation, /projectIdentity\s*=\s*null/, "live conversation must receive canonical project identity");
assert.match(conversation, /requestMovieMentorTurn\(\{[^}]*projectIdentity/s, "live conversation must forward canonical project identity to the authoritative turn client");

assert.match(turnClient, /establishMovieMentorProject/, "authoritative turn client must own project establishment before durable sync");
assert.match(turnClient, /projectIdentity/, "authoritative turn client must receive canonical project identity");
const establishIndex = turnClient.indexOf("await establishMovieMentorProject(");
const syncIndex = turnClient.indexOf("await flushMovieMentorDurableStateSync(");
const turnIndex = turnClient.indexOf("/api/movie-mentor/turn");
assert.ok(establishIndex >= 0 && syncIndex > establishIndex && turnIndex > syncIndex, "actual creator turn road must establish project before durable sync before turn");

assert.match(gateway, /establishMovieMentorProject/, "workspace live gateway must reuse the same project-establishment authority");
assert.doesNotMatch(gateway, /async function establishProjectReality\b/, "workspace live gateway must not maintain a competing project-establishment implementation");

console.log("Movie Mentor creator project establishment path verification: PASS — canonical identity crosses the creator cockpit and the authoritative turn road establishes project reality before sync and turn.");

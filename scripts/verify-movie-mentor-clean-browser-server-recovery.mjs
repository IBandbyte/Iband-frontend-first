import assert from "node:assert/strict";
import fs from "node:fs";

const root=new URL("../src/components/studio/mentor/",import.meta.url);
const source=fs.readFileSync(new URL("MovieMentorDurableStateSync.js",root),"utf8");
const memory=fs.readFileSync(new URL("CreatorMemory.js",root),"utf8");

// A new browser cannot inherit the prior browser's localStorage or CreatorMemory.
// Require an explicit authenticated server recovery boundary before claiming
// a creator's saved journey can be reconstructed after local storage loss.
assert.match(source,/\/state\/recovery\//,"durable sync must expose the backend recovery GET path");
assert.match(source,/getMovieMentorCreatorAuthToken/,"recovery must use creator authentication");
assert.match(source,/async function recoverMovieMentorCreatorState|async function recoverDurableCreatorState/,"recovery must have an explicit async entry point");
assert.match(source,/response\.ok|\.ok\)/,"recovery must check HTTP success");
assert.match(source,/projectId/,"recovery must bind to project identity");
assert.match(memory,/replaceState/,"CreatorMemory must support adopting recovered state");
console.log("GREEN: frontend declares authenticated server recovery boundary for clean-browser reconstruction.");

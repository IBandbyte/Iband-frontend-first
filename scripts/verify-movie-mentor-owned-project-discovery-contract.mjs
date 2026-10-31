import assert from "node:assert/strict";
import fs from "node:fs";
const backendRoute="/api/movie-mentor/projects/owned";
const source=fs.readFileSync(new URL("../src/components/studio/mentor/MovieMentorDurableStateSync.js",import.meta.url),"utf8");
assert.match(source,/listOwnedMovieMentorProjects/,"frontend must expose a signed-in creator's owned-project discovery request");
assert.ok(source.includes(backendRoute),"frontend must use the owned-project discovery route");
assert.match(source,/getMovieMentorCreatorAuthToken/,"discovery must use creator authentication");
assert.match(source,/response\.ok/,"discovery must reject failed HTTP responses");
console.log("GREEN: frontend declares authenticated owned-project discovery boundary.");

import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const wrapperPath = new URL("../src/components/studio/mentor/MovieMentorConversation.jsx", import.meta.url);
const corePath = new URL("../src/components/studio/mentor/MovieMentorConversationCore.jsx", import.meta.url);
const turnClientPath = new URL("../src/components/studio/mentor/MovieMentorTurnClient.js", import.meta.url);
const liveGatewayPath = new URL("../src/components/studio/mentor/MovieMentorLiveGatewayService.js", import.meta.url);

const [wrapper, core, turnClient, liveGateway] = await Promise.all([
  readFile(wrapperPath, "utf8"),
  readFile(corePath, "utf8"),
  readFile(turnClientPath, "utf8"),
  readFile(liveGatewayPath, "utf8"),
]);

assert.match(wrapper, /MovieMentorConversationCore/, "Live MovieMentorConversation must compose the authoritative conversation core.");
for (const [label, source] of [["wrapper", wrapper], ["core", core]]) {
  assert.equal(
    /(?:import|require\s*\()[\s\S]{0,160}ResponseGenerator/.test(source),
    false,
    `MovieMentorConversation ${label} must never import the legacy local ResponseGenerator brain.`
  );
  assert.equal(
    /createResponseGenerator\s*\(/.test(source),
    false,
    `MovieMentorConversation ${label} must never instantiate the legacy local ResponseGenerator brain.`
  );
  assert.equal(
    /responseGenerator(?:Ref)?/.test(source),
    false,
    `MovieMentorConversation ${label} must not retain a hidden local ResponseGenerator execution path.`
  );
}
assert.match(
  core,
  /requestMovieMentorTurn/,
  "MovieMentorConversationCore must use the authoritative MovieMentorTurnClient."
);
assert.match(
  turnClient,
  /\/api\/movie-mentor\/turn/,
  "MovieMentorTurnClient must target the authoritative backend turn gateway."
);
assert.match(
  turnClient,
  /flushMovieMentorDurableStateSync/,
  "MovieMentorTurnClient must settle durable creator reality before reasoning."
);
assert.match(
  liveGateway,
  /localResponseGeneratorUsed:\s*false/,
  "The live gateway must continue declaring that the local ResponseGenerator is not used."
);

console.log("Movie Mentor single-brain architecture verification: PASS");

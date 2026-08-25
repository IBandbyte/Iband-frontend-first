import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const conversationPath = new URL("../src/components/studio/mentor/MovieMentorConversation.jsx", import.meta.url);
const turnClientPath = new URL("../src/components/studio/mentor/MovieMentorTurnClient.js", import.meta.url);
const liveGatewayPath = new URL("../src/components/studio/mentor/MovieMentorLiveGatewayService.js", import.meta.url);

const [conversation, turnClient, liveGateway] = await Promise.all([
  readFile(conversationPath, "utf8"),
  readFile(turnClientPath, "utf8"),
  readFile(liveGatewayPath, "utf8"),
]);

assert.equal(
  /(?:import|require\s*\()[\s\S]{0,160}ResponseGenerator/.test(conversation),
  false,
  "MovieMentorConversation must never import the legacy local ResponseGenerator brain."
);
assert.equal(
  /createResponseGenerator\s*\(/.test(conversation),
  false,
  "MovieMentorConversation must never instantiate the legacy local ResponseGenerator brain."
);
assert.equal(
  /responseGenerator(?:Ref)?/.test(conversation),
  false,
  "MovieMentorConversation must not retain a hidden local ResponseGenerator execution path."
);
assert.match(
  conversation,
  /requestMovieMentorTurn/,
  "MovieMentorConversation must use the authoritative MovieMentorTurnClient."
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

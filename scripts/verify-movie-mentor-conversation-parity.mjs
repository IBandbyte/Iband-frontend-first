import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const wrapper = await readFile(new URL("../src/components/studio/mentor/MovieMentorConversation.jsx", import.meta.url), "utf8");
const core = await readFile(new URL("../src/components/studio/mentor/MovieMentorConversationCore.jsx", import.meta.url), "utf8");

assert.match(wrapper, /MovieMentorConversationCore/, "Live MovieMentorConversation must compose the authoritative conversation core.");

for (const token of [
  "DemonstrationCard",
  "LessonCard",
  "CREATOR_START_POINTS",
  "quickActions",
  "allowAttachments",
  "allowVoice",
  "onDemonstrate",
  "onTeach",
  "onContinue",
  "renderAboveConversation",
  "renderBelowConversation",
  "renderComposerExtra",
  "requestMovieMentorTurn",
  "clarification-required",
]) {
  assert.ok(core.includes(token), `Conversation UI parity lost required capability: ${token}`);
}

for (const [label, source] of [["wrapper", wrapper], ["core", core]]) {
  assert.equal(source.includes("createResponseGenerator"), false, `${label} UI parity must not resurrect the local ResponseGenerator brain.`);
  assert.equal(/from\s+["']\.\/mentor\/ResponseGenerator/.test(source), false, `${label} conversation UI must not import legacy local intelligence.`);
}
assert.match(core, /message\.type === "demonstration"/, "Demonstration messages must remain renderable.");
assert.match(core, /message\.type === "lesson"/, "Lesson messages must remain renderable.");
assert.match(core, /continue-after-lesson/, "Lesson continuation UI action must remain available.");
assert.match(core, /play-demo/, "Demonstration playback action must remain available.");

console.log("Movie Mentor conversation UI parity verification: PASS");

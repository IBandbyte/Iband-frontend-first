import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const source = await readFile(new URL("../src/components/studio/mentor/MovieMentorConversation.jsx", import.meta.url), "utf8");

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
  assert.ok(source.includes(token), `Conversation UI parity lost required capability: ${token}`);
}

assert.equal(source.includes("createResponseGenerator"), false, "UI parity must not resurrect the local ResponseGenerator brain.");
assert.equal(/from\s+["']\.\/mentor\/ResponseGenerator/.test(source), false, "Conversation UI must not import legacy local intelligence.");
assert.match(source, /message\.type === "demonstration"/, "Demonstration messages must remain renderable.");
assert.match(source, /message\.type === "lesson"/, "Lesson messages must remain renderable.");
assert.match(source, /continue-after-lesson/, "Lesson continuation UI action must remain available.");
assert.match(source, /play-demo/, "Demonstration playback action must remain available.");

console.log("Movie Mentor conversation UI parity verification: PASS");

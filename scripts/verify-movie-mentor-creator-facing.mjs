import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  resolveMovieMentorCreatorFacingMessage,
  resolveMovieMentorPreview,
} from "../src/components/studio/mentor/MovieMentorCreatorFacingPresenter.js";

const synthesisResult={
  response:{text:"One coherent Mentor response."},
  content:"One coherent Mentor response.",
  prompt:"One coherent Mentor response.",
  preview:"One coherent Mentor response.",
  mentorSynthesis:{status:"completed"},
  specialistExecution:{contributions:[{agentId:"story",authority:"mentor-provisional"},{agentId:"character",authority:"mentor-provisional"}]},
};
const visible=resolveMovieMentorCreatorFacingMessage({result:synthesisResult});
assert.equal(visible.type,"mentor-response");
assert.equal(visible.source,"mentor-synthesis");
assert.equal(visible.text,"One coherent Mentor response.");
assert.equal(resolveMovieMentorPreview({result:synthesisResult,creatorIdea:"fallback"}),"One coherent Mentor response.");

const clarification=resolveMovieMentorCreatorFacingMessage({
  result:synthesisResult,
  appliedJourney:{clarificationRequired:true,clarificationMessage:"What does glorp-coded mean here?"},
});
assert.equal(clarification.type,"clarification");
assert.equal(clarification.source,"canonical-journey-clarification");
assert.equal(clarification.text,"What does glorp-coded mean here?");

const workspace=readFileSync(new URL("../src/components/studio/CreatorWorkspace.jsx",import.meta.url),"utf8");
assert.match(workspace,/resolveMovieMentorCreatorFacingMessage/);
assert.match(workspace,/setMentorMessage\(presentation\.text\)/);
assert.match(workspace,/movieJourneyIntelligenceBridge\.applyGenerationResult/);
assert.doesNotMatch(workspace,/setMentorMessage\(\s*"Your first version is ready[^]*?\)\s*;\s*}\s*catch/);

console.log("Movie Mentor creator-facing integration regression passed.");

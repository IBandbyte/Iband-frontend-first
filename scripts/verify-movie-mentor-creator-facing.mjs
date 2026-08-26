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

// The presenter remains a valid pure creator-facing boundary, but the live
// AI-movie cockpit no longer routes authoritative Mentor turns through the
// legacy local Generate/applyGenerationResult path. MovieMentorConversation
// owns the live creator-facing turn surface and hands the authoritative turn
// result back to CreatorWorkspace for Journey projection/planning only.
assert.match(workspace,/resolveMovieMentorCreatorFacingMessage/);
assert.match(workspace,/MovieMentorConversation/);
assert.match(workspace,/onMentorTurnResult=\{handleMovieMentorTurnResult\}/);
assert.match(workspace,/projectCommittedCreatorAuthorityIntoJourney/);
assert.match(workspace,/setMovieJourneyPlanningEvidence\(planning\.journeyPlanningEvidence \|\| null\)/);
assert.match(workspace,/selectedCreatorMode !== "ai-movie"/);
assert.doesNotMatch(workspace,/movieJourneyIntelligenceBridge\.applyGenerationResult/);

console.log("Movie Mentor creator-facing integration regression passed.");

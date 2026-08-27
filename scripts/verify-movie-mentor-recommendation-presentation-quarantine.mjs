import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const aiMentor = fs.readFileSync(path.join(ROOT, "src/components/studio/AiMentor.jsx"), "utf8");
const failures = [];
const check = (condition, message) => { if (!condition) failures.push(message); };

check(aiMentor.includes("journeyRecommendationAction = null"), "AiMentor must receive a presentation-only recommendation action model.");
check(aiMentor.includes("onAcceptJourneyRecommendation"), "AiMentor must emit an accept callback only.");
check(aiMentor.includes("onDismissJourneyRecommendation"), "AiMentor must emit a dismiss callback only.");
check(aiMentor.includes("Your choice decides what happens next."), "Creator-choice language must remain visible.");
check(aiMentor.includes("journeyRecommendationAction?.mayAdvanceJourney === false"), "AiMentor must only render actions explicitly marked non-authoritative.");
check(aiMentor.includes("journeyRecommendationAction?.creatorChoiceRequired === true"), "AiMentor must require creator choice before showing recommendation actions.");
check(aiMentor.includes("onClick={() => onAcceptJourneyRecommendation?.()}"), "Accept click must carry no authority-bearing envelope payload back to Workspace.");
check(aiMentor.includes("onClick={() => onDismissJourneyRecommendation?.()}"), "Dismiss click must be a presentation callback only.");

for (const forbidden of [
  "JourneyRecommendationAcceptanceAuthority",
  "JourneyRecommendationAcceptanceExecutionRuntime",
  "JourneyProgressionExecutionRuntime",
  "JourneyPositionAuthorityControl",
  "issueJourneyPositionAuthority",
  "setCurrentPosition(",
  "completeTask(",
  "completeStage(",
]) {
  check(!aiMentor.includes(forbidden), `AiMentor must not contain execution authority reference: ${forbidden}`);
}

if (failures.length) {
  console.error("Movie Mentor recommendation presentation quarantine failed:\n");
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log("Movie Mentor recommendation presentation quarantine passed.");
console.log("- AiMentor is presentation-only");
console.log("- accept emits no envelope payload");
console.log("- dismiss emits no Journey mutation intent");
console.log("- no progression/authority runtime is imported or invoked");

import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const workspace = fs.readFileSync(path.join(ROOT, "src/components/studio/CreatorWorkspace.jsx"), "utf8");
const failures = [];
const check = (condition, message) => { if (!condition) failures.push(message); };

check(workspace.includes("createJourneyRecommendationAcceptanceExecutionRuntime"), "Workspace must own the certified recommendation acceptance execution runtime.");
check(workspace.includes("createJourneyRecommendationActionSurface"), "Workspace must mint the immutable recommendation action surface.");
check(workspace.includes("acceptCurrentJourneyRecommendation"), "Workspace must route acceptance through the action-surface boundary.");
check(workspace.includes("dismissCurrentJourneyRecommendation"), "Workspace must own local recommendation dismissal.");
check(workspace.includes("const [dismissedRecommendationId"), "Workspace must retain local dismissal identity without touching Journey progression.");
check(workspace.includes("journeyRecommendationAction={journeyRecommendationAction}"), "Workspace must pass only the presentation action model to AiMentor.");
check(workspace.includes("onAcceptJourneyRecommendation={handleAcceptJourneyRecommendation}"), "Workspace must own the accept callback.");
check(workspace.includes("onDismissJourneyRecommendation={handleDismissJourneyRecommendation}"), "Workspace must own the dismiss callback.");
check(workspace.includes('createCreatorActId("journey-recommendation-accept")'), "Acceptance must create a fresh identifiable creator act in Workspace.");
check(workspace.includes("creatorAuthorityRevision: movieJourneyPlanningEvidence?.creatorAuthorityRevision"), "Acceptance must bind to current creator-authority revision.");
check(workspace.includes("turnRevision: movieJourneyPlanningEvidence?.provenance?.turnRevision"), "Acceptance must bind to current Mentor-turn revision.");
check(workspace.includes("clarificationRequired: movieJourneyPlanningEvidence?.clarification?.required === true"), "Acceptance must re-check current clarification state.");
check(workspace.includes("setMovieJourneyPlanningEvidence(null)"), "Successful or stale acceptance must invalidate old planning evidence.");

const dismissStart = workspace.indexOf("const handleDismissJourneyRecommendation");
const dismissEnd = workspace.indexOf("const handleMovieStageSelect", dismissStart);
const dismissBlock = dismissStart >= 0 && dismissEnd > dismissStart ? workspace.slice(dismissStart, dismissEnd) : "";
check(Boolean(dismissBlock), "Recommendation dismissal handler could not be isolated.");
check(!dismissBlock.includes("journeyProgressionRuntime.execute"), "Dismissal must never execute Journey progression.");
check(!dismissBlock.includes("issueJourneyPositionAuthority"), "Dismissal must never mint Position Authority.");
check(!dismissBlock.includes("setProjectJourney("), "Dismissal must not mutate Journey state.");
check(dismissBlock.includes("setDismissedRecommendationId"), "Dismissal must be local presentation state only.");

const acceptStart = workspace.indexOf("const handleAcceptJourneyRecommendation");
const acceptEnd = workspace.indexOf("const handleDismissJourneyRecommendation", acceptStart);
const acceptBlock = acceptStart >= 0 && acceptEnd > acceptStart ? workspace.slice(acceptStart, acceptEnd) : "";
check(Boolean(acceptBlock), "Recommendation acceptance handler could not be isolated.");
check(!acceptBlock.includes("recommendationEnvelope:"), "Workspace accept handler must not accept or forward a caller-supplied envelope directly.");
check(!acceptBlock.includes("issueJourneyPositionAuthority"), "Workspace accept handler must not mint Position Authority itself.");
check(!acceptBlock.includes("journeyProgressionRuntime.execute"), "Workspace accept handler must not bypass the certified acceptance execution runtime.");
check(acceptBlock.includes("acceptCurrentJourneyRecommendation"), "Acceptance must consume the current Workspace-owned action surface.");

if (failures.length) {
  console.error("Movie Mentor recommendation Workspace binding verification failed:\n");
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log("Movie Mentor recommendation Workspace binding verification passed.");
console.log("- Workspace owns recommendation identity and execution runtime");
console.log("- AiMentor receives presentation model + callbacks only");
console.log("- acceptance creates a fresh creator act and rechecks freshness lineage");
console.log("- dismissal is local and creates no Journey revision");
console.log("- Workspace cannot bypass the acceptance execution boundary");

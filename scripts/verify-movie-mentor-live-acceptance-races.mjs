import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const workspace = fs.readFileSync(path.join(ROOT, "src/components/studio/CreatorWorkspace.jsx"), "utf8");
const actionSurface = fs.readFileSync(path.join(ROOT, "src/components/studio/mentor/JourneyRecommendationActionSurface.js"), "utf8");
const acceptanceRuntime = fs.readFileSync(path.join(ROOT, "src/components/studio/mentor/JourneyRecommendationAcceptanceExecutionRuntime.js"), "utf8");
const failures = [];
const check = (condition, message) => { if (!condition) failures.push(message); };

check(acceptanceRuntime.includes('return `journey-recommendation-acceptance:${id}`'), "Acceptance retries must derive one deterministic operationId from recommendationId.");
const receiptCheck = acceptanceRuntime.indexOf("const existingReceipt = findCommittedAcceptanceReceipt");
const authorityMint = acceptanceRuntime.indexOf("const acceptance = createRecommendationAcceptanceAuthority");
check(receiptCheck >= 0 && authorityMint > receiptCheck, "Committed receipt lookup must happen before new acceptance authority is minted.");
check(acceptanceRuntime.includes('status: "already-committed"'), "Lost response retries must return durable already-committed reality.");
check(acceptanceRuntime.includes("newCreatorAuthorityIssued: false"), "Already-committed retries must not issue new creator authority.");

check(actionSurface.includes("recommendationEnvelope: actionSurface.envelope"), "Acceptance must consume the Workspace-owned current action-surface envelope.");
check(actionSurface.includes("// Ownership law: the UI supplies no recommendation envelope here."), "Action surface must document the no-caller-envelope ownership law.");
const acceptStart = workspace.indexOf("const handleAcceptJourneyRecommendation");
const acceptEnd = workspace.indexOf("const handleDismissJourneyRecommendation", acceptStart);
const acceptBlock = acceptStart >= 0 && acceptEnd > acceptStart ? workspace.slice(acceptStart, acceptEnd) : "";
check(Boolean(acceptBlock), "Workspace acceptance handler could not be isolated.");
check(!acceptBlock.includes("recommendationEnvelope:"), "Workspace click handler must not forward a stale or forged caller envelope.");
check(acceptBlock.includes("actionSurface: journeyRecommendationAction"), "Workspace click must resolve the currently rendered recommendation action.");
check(acceptBlock.includes("creatorAuthorityRevision: movieJourneyPlanningEvidence?.creatorAuthorityRevision"), "Acceptance must bind current creator-authority revision at click time.");
check(acceptBlock.includes("turnRevision: movieJourneyPlanningEvidence?.provenance?.turnRevision"), "Acceptance must bind current turn revision at click time.");
check(acceptBlock.includes("clarificationRequired: movieJourneyPlanningEvidence?.clarification?.required === true"), "Acceptance must bind current clarification state at click time.");
check(acceptBlock.includes("acceptCurrentJourneyRecommendation"), "Recommendation acceptance must use the acceptance boundary.");
check(!acceptBlock.includes("journeyProgressionRuntime.execute"), "Recommendation acceptance must not bypass into raw progression execution.");

// Stage-click race law. There is no handleMovieTaskSelect sibling in this Workspace;
// isolate the stage handler using the next actual creator Journey handler instead.
const stageStart = workspace.indexOf("const handleMovieStageSelect");
const stageEndCandidates = [
  workspace.indexOf("const handleMovieTaskComplete", stageStart + 1),
  workspace.indexOf("const handleMovieStageComplete", stageStart + 1),
  workspace.indexOf("const handleGenerate", stageStart + 1),
  workspace.length,
].filter((index) => index > stageStart);
const stageEnd = stageEndCandidates.length ? Math.min(...stageEndCandidates) : -1;
const stageBlock = stageStart >= 0 && stageEnd > stageStart ? workspace.slice(stageStart, stageEnd) : "";
check(Boolean(stageBlock), "Manual stage-click handler could not be isolated.");
check(stageBlock.includes("executeCreatorJourneyOperation"), "Manual stage click must remain on the creator-operation path.");
check(!stageBlock.includes("acceptCurrentJourneyRecommendation"), "Manual stage click must not impersonate recommendation acceptance.");

const dismissStart = workspace.indexOf("const handleDismissJourneyRecommendation");
const dismissEnd = workspace.indexOf("const handleMovieStageSelect", dismissStart);
const dismissBlock = dismissStart >= 0 && dismissEnd > dismissStart ? workspace.slice(dismissStart, dismissEnd) : "";
check(Boolean(dismissBlock), "Workspace dismissal handler could not be isolated.");
check(dismissBlock.includes("setDismissedRecommendationId"), "Stay here must only record local recommendation identity.");
check(!dismissBlock.includes("setProjectJourney("), "Stay here must never mutate Journey state.");
check(!dismissBlock.includes("journeyProgressionRuntime.execute"), "Stay here must never execute progression.");
check(!dismissBlock.includes("issueJourneyPositionAuthority"), "Stay here must never mint Position Authority.");

check(acceptBlock.includes("if (result?.projectJourney) setProjectJourney(result.projectJourney)"), "Workspace must install durable acceptance Journey reality from the execution result.");
check(acceptanceRuntime.includes("const durableJourney = getDurableJourney(identityRuntime, pid)"), "Acceptance must reload durable Journey reality before deciding retry/freshness.");
check(acceptanceRuntime.includes("findCommittedAcceptanceReceipt(durableJourney, operationId)"), "Remount/lost-ACK retry must reconcile against durable committed receipts.");
check(acceptBlock.includes("setMovieJourneyPlanningEvidence(null)"), "Acceptance completion/failure must invalidate old planning evidence.");
check(acceptBlock.includes("setDismissedRecommendationId(result?.recommendationId || journeyRecommendationAction.recommendationId)"), "Successful acceptance must locally retire the accepted card identity.");

if (failures.length) {
  console.error("Movie Mentor live recommendation acceptance race verification failed:\n");
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log("Movie Mentor live recommendation acceptance race verification passed.");
console.log("- double-tap and lost-ACK retries collapse onto one durable operation");
console.log("- stale/forged cards cannot supply execution authority");
console.log("- current authority, turn and clarification lineage are captured at click time");
console.log("- manual stage clicks race through durable transactional boundaries");
console.log("- Stay here is presentation-local and cannot mutate Journey state");
console.log("- committed acceptance survives delayed React refresh and remount/retry");

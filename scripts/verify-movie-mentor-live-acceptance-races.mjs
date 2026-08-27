import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const workspace = fs.readFileSync(path.join(ROOT, "src/components/studio/CreatorWorkspace.jsx"), "utf8");
const actionSurface = fs.readFileSync(path.join(ROOT, "src/components/studio/mentor/JourneyRecommendationActionSurface.js"), "utf8");
const acceptanceRuntime = fs.readFileSync(path.join(ROOT, "src/components/studio/mentor/JourneyRecommendationAcceptanceExecutionRuntime.js"), "utf8");
const failures = [];
const check = (condition, message) => { if (!condition) failures.push(message); };

// Double-tap / lost-ACK law: immutable recommendation identity must collapse retries
// onto one deterministic durable operation before any new authority is issued.
check(acceptanceRuntime.includes('return `journey-recommendation-acceptance:${id}`'), "Acceptance retries must derive one deterministic operationId from recommendationId.");
const receiptCheck = acceptanceRuntime.indexOf("const existingReceipt = findCommittedAcceptanceReceipt");
const authorityMint = acceptanceRuntime.indexOf("const acceptance = createRecommendationAcceptanceAuthority");
check(receiptCheck >= 0 && authorityMint > receiptCheck, "Committed receipt lookup must happen before new acceptance authority is minted.");
check(acceptanceRuntime.includes('status: "already-committed"'), "Lost response retries must return durable already-committed reality.");
check(acceptanceRuntime.includes("newCreatorAuthorityIssued: false"), "Already-committed retries must not issue new creator authority.");

// Stale-card law: UI cannot submit a captured/forged envelope. The current Workspace
// action surface is the only envelope that may reach execution.
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

// Manual stage-click racing recommendation acceptance is resolved by durable CAS/freshness,
// never by presentation ordering. Workspace must route those paths through different certified boundaries.
check(acceptBlock.includes("acceptCurrentJourneyRecommendation"), "Recommendation acceptance must use the acceptance boundary.");
check(!acceptBlock.includes("journeyProgressionRuntime.execute"), "Recommendation acceptance must not bypass into raw progression execution.");
const stageStart = workspace.indexOf("const handleMovieStageSelect");
const stageEnd = workspace.indexOf("const handleMovieTaskSelect", stageStart);
const stageBlock = stageStart >= 0 && stageEnd > stageStart ? workspace.slice(stageStart, stageEnd) : "";
check(stageBlock.includes("executeCreatorJourneyOperation"), "Manual stage click must remain on the creator-operation path.");

// Stay-here vs Continue law: dismissal is presentation-local and cannot race a Journey mutation.
const dismissStart = workspace.indexOf("const handleDismissJourneyRecommendation");
const dismissEnd = workspace.indexOf("const handleMovieStageSelect", dismissStart);
const dismissBlock = dismissStart >= 0 && dismissEnd > dismissStart ? workspace.slice(dismissStart, dismissEnd) : "";
check(Boolean(dismissBlock), "Workspace dismissal handler could not be isolated.");
check(dismissBlock.includes("setDismissedRecommendationId"), "Stay here must only record local recommendation identity.");
check(!dismissBlock.includes("setProjectJourney("), "Stay here must never mutate Journey state.");
check(!dismissBlock.includes("journeyProgressionRuntime.execute"), "Stay here must never execute progression.");
check(!dismissBlock.includes("issueJourneyPositionAuthority"), "Stay here must never mint Position Authority.");

// Commit-before-React-refresh / remount law: acceptance returns durable Journey reality and
// Workspace installs it; retry after a lost response is reconstructed from durable receipt.
check(acceptBlock.includes("if (result?.projectJourney) setProjectJourney(result.projectJourney)"), "Workspace must install durable acceptance Journey reality from the execution result.");
check(acceptanceRuntime.includes("const durableJourney = getDurableJourney(identityRuntime, pid)"), "Acceptance must reload durable Journey reality before deciding retry/freshness.");
check(acceptanceRuntime.includes("findCommittedAcceptanceReceipt(durableJourney, operationId)"), "Remount/lost-ACK retry must reconcile against durable committed receipts.");

// Any completed/stale acceptance must invalidate the planning card so old UI cannot remain actionable.
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

import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const read = (relativePath) => fs.readFileSync(path.join(ROOT, relativePath), "utf8");

const identity = read("src/components/studio/mentor/MovieMentorStudioIdentityRuntime.js");
const acceptance = read("src/components/studio/mentor/JourneyRecommendationAcceptanceExecutionRuntime.js");
const workspace = read("src/components/studio/CreatorWorkspace.jsx");
const actionSurface = read("src/components/studio/mentor/JourneyRecommendationActionSurface.js");
const failures = [];
const check = (condition, message) => { if (!condition) failures.push(message); };

// Durable Journey reality must win reconstruction after reload.
check(identity.includes("projectJourney:project.metadata?.projectJourney||conversation.handoff?.value?.projectJourney||null"), "Resume snapshot must prefer the project's durable persisted Journey over handoff fallback state.");
check(identity.includes("currentRecommendationReferences:getCurrentRecommendationReferences(project.id)"), "Recommendation references may be restored only as advisory history alongside durable Journey reality.");

// A remount must not resurrect prior actionable planning state.
check(workspace.includes("const [movieJourneyPlanningEvidence, setMovieJourneyPlanningEvidence] = useState(null)"), "Workspace must start reload/remount with no actionable Journey planning evidence.");
check(workspace.includes("const [dismissedRecommendationId, setDismissedRecommendationId] = useState(null)"), "Dismissal UI identity may restart locally without becoming Journey authority.");
check(!workspace.includes("resumeSnapshot?.currentRecommendationReferences"), "Persisted recommendation references must not be promoted directly into actionable Workspace planning state on reload.");

// Actionability must require freshly supplied planning evidence, never archival reference memory.
check(actionSurface.includes("planningEvidence"), "Action surface must require current planning evidence.");
check(actionSurface.includes("createJourneyRecommendationEnvelope"), "Action surface must mint a fresh immutable envelope from current planning evidence and Journey reality.");
check(!actionSurface.includes("currentRecommendationReferences"), "Action surface must not consume archival recommendation references.");

// Lost ACK / reload recovery must reconcile against durable project Journey and committed receipt first.
check(acceptance.includes("const durableJourney = getDurableJourney(identityRuntime, pid)"), "Acceptance execution must reload durable Journey reality.");
const receiptLookup = acceptance.indexOf("const existingReceipt = findCommittedAcceptanceReceipt");
const authorityMint = acceptance.indexOf("const acceptance = createRecommendationAcceptanceAuthority");
check(receiptLookup >= 0 && authorityMint > receiptLookup, "Reload retry must find the committed receipt before attempting to mint new creator authority.");
check(acceptance.includes('status: "already-committed"'), "Reload retry must return already-committed reality when acceptance already succeeded.");
check(acceptance.includes("projectJourney: cloneValue(durableJourney)"), "Already-committed recovery must return the durable Journey for UI reconstruction.");
check(acceptance.includes("newCreatorAuthorityIssued: false"), "Reload recovery of an existing acceptance must issue no new creator authority.");

// The immutable recommendation identity must remain deterministic across vanished UI instances.
check(acceptance.includes('return `journey-recommendation-acceptance:${id}`'), "Recommendation acceptance operation identity must remain deterministic across reload/remount.");

if (failures.length) {
  console.error("Movie Mentor acceptance reload reality verification failed:\n");
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log("Movie Mentor acceptance reload reality verification passed.");
console.log("- durable persisted Journey wins after reload");
console.log("- archival recommendation references are never restored as actionable authority");
console.log("- actionable recommendations require fresh planning evidence");
console.log("- lost-ACK/remount retry reconciles durable committed receipt before new authority");
console.log("- one recommendation identity remains one durable acceptance operation across UI destruction");

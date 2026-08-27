import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const read = (relativePath) => fs.readFileSync(path.join(ROOT, relativePath), "utf8");

const workspace = read("src/components/studio/CreatorWorkspace.jsx");
const conversation = read("src/components/studio/mentor/MovieMentorConversation.jsx");
const authority = read("src/components/studio/mentor/JourneyPositionAuthorityControl.js");

const failures = [];
const pass = (condition, message) => {
  if (!condition) failures.push(message);
};

pass(authority.includes('TASK_COMPLETION_UI: "task-completion-ui"'), "Missing task-completion-ui authority source.");
pass(authority.includes('STAGE_COMPLETION_UI: "stage-completion-ui"'), "Missing stage-completion-ui authority source.");
pass(authority.includes('[POSITION_AUTHORITY_SOURCES.TASK_COMPLETION_UI]: POSITION_AUTHORITY_CLASSES.CREATOR_AUTHORISED'), "Task completion UI source must be creator-authorised.");
pass(authority.includes('[POSITION_AUTHORITY_SOURCES.STAGE_COMPLETION_UI]: POSITION_AUTHORITY_CLASSES.CREATOR_AUTHORISED'), "Stage completion UI source must be creator-authorised.");
pass(authority.includes('source === POSITION_AUTHORITY_SOURCES.TASK_COMPLETION_UI'), "Task completion UI issuance policy is missing.");
pass(authority.includes('action !== POSITION_ACTIONS.COMPLETE_TASK'), "Task completion UI must be bound to COMPLETE_TASK.");
pass(authority.includes('source === POSITION_AUTHORITY_SOURCES.STAGE_COMPLETION_UI'), "Stage completion UI issuance policy is missing.");
pass(authority.includes('action !== POSITION_ACTIONS.COMPLETE_STAGE'), "Stage completion UI must be bound to COMPLETE_STAGE.");

pass(workspace.includes("canonicalMovieCurrentStage"), "Workspace must derive the canonical current stage.");
pass(workspace.includes("canonicalMovieCurrentTask"), "Workspace must derive the canonical current task.");
pass(workspace.includes("POSITION_AUTHORITY_SOURCES.TASK_COMPLETION_UI"), "Workspace task completion must use TASK_COMPLETION_UI.");
pass(workspace.includes("POSITION_ACTIONS.COMPLETE_TASK"), "Workspace task completion must request COMPLETE_TASK.");
pass(workspace.includes("POSITION_AUTHORITY_SOURCES.STAGE_COMPLETION_UI"), "Workspace stage completion must use STAGE_COMPLETION_UI.");
pass(workspace.includes("POSITION_ACTIONS.COMPLETE_STAGE"), "Workspace stage completion must request COMPLETE_STAGE.");
pass(workspace.includes("creatorGesture: true"), "Completion authority must carry an explicit creator gesture.");
pass(workspace.includes("journeyProgressionRuntime.execute"), "Completion must execute through JourneyProgressionExecutionRuntime.");
pass(!workspace.includes("creatorJourneyEngine.completeTask("), "Workspace must not call raw completeTask directly.");
pass(!workspace.includes("creatorJourneyEngine.completeStage("), "Workspace must not call raw completeStage directly.");

const stageCompleteStart = workspace.indexOf("const handleMovieStageComplete");
const stageCompleteEnd = workspace.indexOf("const handleChangeCreator", stageCompleteStart);
const stageCompleteBlock = stageCompleteStart >= 0 && stageCompleteEnd > stageCompleteStart
  ? workspace.slice(stageCompleteStart, stageCompleteEnd)
  : "";
pass(Boolean(stageCompleteBlock), "Stage completion handler could not be located.");
pass(!stageCompleteBlock.includes("POSITION_ACTIONS.SET_POSITION"), "Stage completion must not include a position move.");
pass(!stageCompleteBlock.includes("STAGE_CLICK_UI"), "Stage completion must not masquerade as stage selection.");
pass(!stageCompleteBlock.includes("mayAdvanceJourney"), "Backend readiness must not appear in creator stage completion.");
pass(!stageCompleteBlock.includes("readyToAdvance"), "Semantic readiness must not appear in creator stage completion.");

const taskCompleteStart = workspace.indexOf("const handleMovieTaskComplete");
const taskCompleteEnd = workspace.indexOf("const handleMovieStageComplete", taskCompleteStart);
const taskCompleteBlock = taskCompleteStart >= 0 && taskCompleteEnd > taskCompleteStart
  ? workspace.slice(taskCompleteStart, taskCompleteEnd)
  : "";
pass(Boolean(taskCompleteBlock), "Task completion handler could not be located.");
pass(!taskCompleteBlock.includes("mayAdvanceJourney"), "Backend readiness must not appear in creator task completion.");
pass(!taskCompleteBlock.includes("readyToAdvance"), "Semantic readiness must not appear in creator task completion.");

pass(conversation.includes("currentStage = null"), "Cockpit must receive canonical current stage state.");
pass(conversation.includes("currentTask = null"), "Cockpit must receive canonical current task state.");
pass(conversation.includes("onCompleteTask"), "Cockpit must expose an explicit task completion callback.");
pass(conversation.includes("onCompleteStage"), "Cockpit must expose an explicit stage completion callback.");
pass(conversation.includes("Mark task complete"), "Cockpit must expose an explicit task completion control.");
pass(conversation.includes("Mark stage complete"), "Cockpit must expose an explicit stage completion control.");
pass(conversation.includes('disabled={currentTaskComplete}'), "Already-completed tasks must disable the completion control.");
pass(conversation.includes('disabled={currentStageComplete}'), "Already-completed stages must disable the completion control.");
pass(!conversation.includes("completeTask("), "Cockpit must never call raw completeTask.");
pass(!conversation.includes("completeStage("), "Cockpit must never call raw completeStage.");

if (failures.length) {
  console.error("Movie Mentor creator completion control verification failed:\n");
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log("Movie Mentor creator completion control verification passed.");
console.log("- explicit creator task completion: guarded");
console.log("- explicit creator stage completion: guarded");
console.log("- transactional execution only: guarded");
console.log("- stage completion remains position-preserving: guarded");
console.log("- Mentor/backend readiness cannot complete on the creator's behalf: guarded");

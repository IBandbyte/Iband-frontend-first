import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const read = (relativePath) => fs.readFileSync(path.join(ROOT, relativePath), "utf8");
const workspace = read("src/components/studio/CreatorWorkspace.jsx");
const wrapper = read("src/components/studio/mentor/MovieMentorConversation.jsx");
const conversation = read("src/components/studio/mentor/MovieMentorConversationCore.jsx");
const authority = read("src/components/studio/mentor/JourneyPositionAuthorityControl.js");
const failures = [];
const pass = (condition, message) => { if (!condition) failures.push(message); };

pass(wrapper.includes("MovieMentorConversationCore"), "Live conversation wrapper must compose the authoritative conversation core.");
pass(authority.includes('TASK_COMPLETION_UI: "task-completion-ui"'), "Missing task-completion-ui authority source.");
pass(authority.includes('STAGE_COMPLETION_UI: "stage-completion-ui"'), "Missing stage-completion-ui authority source.");
pass(authority.includes('[POSITION_AUTHORITY_SOURCES.TASK_COMPLETION_UI]: POSITION_AUTHORITY_CLASSES.CREATOR_AUTHORISED'), "Task completion UI source must be creator-authorised.");
pass(authority.includes('[POSITION_AUTHORITY_SOURCES.STAGE_COMPLETION_UI]: POSITION_AUTHORITY_CLASSES.CREATOR_AUTHORISED'), "Stage completion UI source must be creator-authorised.");
pass(authority.includes('action !== POSITION_ACTIONS.COMPLETE_TASK'), "Task completion UI must be bound to COMPLETE_TASK.");
pass(authority.includes('action !== POSITION_ACTIONS.COMPLETE_STAGE'), "Stage completion UI must be bound to COMPLETE_STAGE.");

pass(workspace.includes("canonicalMovieCurrentStage"), "Workspace must derive canonical current stage.");
pass(workspace.includes("canonicalMovieCurrentTask"), "Workspace must derive canonical current task.");
pass(workspace.includes("POSITION_AUTHORITY_SOURCES.TASK_COMPLETION_UI"), "Workspace task completion must use TASK_COMPLETION_UI.");
pass(workspace.includes("POSITION_ACTIONS.COMPLETE_TASK"), "Workspace task completion must request COMPLETE_TASK.");
pass(workspace.includes("POSITION_AUTHORITY_SOURCES.STAGE_COMPLETION_UI"), "Workspace stage completion must use STAGE_COMPLETION_UI.");
pass(workspace.includes("POSITION_ACTIONS.COMPLETE_STAGE"), "Workspace stage completion must request COMPLETE_STAGE.");
pass(workspace.includes("creatorGesture: true"), "Completion authority must carry explicit creator gesture.");
pass(workspace.includes("journeyProgressionRuntime.execute"), "Completion must execute transactionally.");
pass(!workspace.includes("creatorJourneyEngine.completeTask("), "Workspace must not call raw completeTask directly.");
pass(!workspace.includes("creatorJourneyEngine.completeStage("), "Workspace must not call raw completeStage directly.");

const stageStart = workspace.indexOf("const handleMovieStageComplete");
const stageEnd = workspace.indexOf("const handleMovieContinueTask", stageStart);
const stageBlock = stageStart >= 0 && stageEnd > stageStart ? workspace.slice(stageStart, stageEnd) : "";
pass(Boolean(stageBlock), "Stage completion handler could not be isolated.");
pass(stageBlock.includes("POSITION_ACTIONS.COMPLETE_STAGE"), "Stage completion must request COMPLETE_STAGE.");
pass(stageBlock.includes("POSITION_AUTHORITY_SOURCES.STAGE_COMPLETION_UI"), "Stage completion must use its dedicated creator authority source.");
pass(!stageBlock.includes("POSITION_ACTIONS.SET_POSITION"), "Stage completion must not include a position move.");
pass(!stageBlock.includes("STAGE_CLICK_UI"), "Stage completion must not masquerade as stage selection.");
pass(!stageBlock.includes("mayAdvanceJourney") && !stageBlock.includes("readyToAdvance"), "Backend/semantic readiness must not appear in creator stage completion.");

const taskStart = workspace.indexOf("const handleMovieTaskComplete");
const taskEnd = workspace.indexOf("const handleMovieStageComplete", taskStart);
const taskBlock = taskStart >= 0 && taskEnd > taskStart ? workspace.slice(taskStart, taskEnd) : "";
pass(Boolean(taskBlock), "Task completion handler could not be isolated.");
pass(taskBlock.includes("POSITION_ACTIONS.COMPLETE_TASK"), "Task completion must request COMPLETE_TASK.");
pass(!taskBlock.includes("mayAdvanceJourney") && !taskBlock.includes("readyToAdvance"), "Backend/semantic readiness must not appear in creator task completion.");

pass(conversation.includes("currentStage = null"), "Cockpit core must receive canonical current stage state.");
pass(conversation.includes("currentTask = null"), "Cockpit core must receive canonical current task state.");
pass(conversation.includes("onCompleteTask") && conversation.includes("Mark task complete"), "Cockpit core must expose explicit task completion.");
pass(conversation.includes("onCompleteStage") && conversation.includes("Mark stage complete"), "Cockpit core must expose explicit stage completion.");
pass(conversation.includes('disabled={currentTaskComplete}'), "Completed tasks must disable completion control.");
pass(conversation.includes('disabled={currentStageComplete}'), "Completed stages must disable completion control.");
pass(!conversation.includes("completeTask(") && !conversation.includes("completeStage("), "Cockpit core must never call raw completion mutators.");

if (failures.length) {
  console.error("Movie Mentor creator completion control verification failed:\n");
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}
console.log("Movie Mentor creator completion control verification passed.");
console.log("- live wrapper composes the authoritative conversation core");
console.log("- explicit creator task/stage completion remains transaction-only and position-preserving");
console.log("- structural gate isolates each handler instead of depending on unrelated later handlers");

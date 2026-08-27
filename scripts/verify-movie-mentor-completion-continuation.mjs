import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const read = (relativePath) => fs.readFileSync(path.join(ROOT, relativePath), "utf8");
const workspace = read("src/components/studio/CreatorWorkspace.jsx");
const conversation = read("src/components/studio/mentor/MovieMentorConversation.jsx");
const failures = [];
const pass = (condition, message) => { if (!condition) failures.push(message); };

pass(workspace.includes("canonicalMovieNextTask"), "Workspace must derive a canonical next task from the current stage.");
pass(workspace.includes("projectJourneyOrientation?.next?.nextStage"), "Workspace must derive next stage from canonical Journey orientation.");
pass(workspace.includes("const handleMovieContinueTask"), "Missing explicit creator task-continuation handler.");
pass(workspace.includes("const handleMovieContinueStage"), "Missing explicit creator stage-continuation handler.");
pass(workspace.includes('creatorActPrefix: "journey-continue-task"'), "Task continuation must create a distinct creator act.");
pass(workspace.includes('creatorActPrefix: "journey-continue-stage"'), "Stage continuation must create a distinct creator act.");
pass(workspace.includes("POSITION_AUTHORITY_SOURCES.STAGE_CLICK_UI"), "Continuation must use an existing explicit creator navigation authority source.");
pass(workspace.includes("POSITION_ACTIONS.SET_POSITION"), "Continuation must be a separate position transaction.");
pass(workspace.includes("onContinueTask={handleMovieContinueTask}"), "Cockpit task continuation must be wired to Workspace.");
pass(workspace.includes("onContinueStage={handleMovieContinueStage}"), "Cockpit stage continuation must be wired to Workspace.");

const stageCompletionStart = workspace.indexOf("const handleMovieStageComplete");
const stageCompletionEnd = workspace.indexOf("const handleMovieContinueTask", stageCompletionStart);
const stageCompletionBlock = stageCompletionStart >= 0 && stageCompletionEnd > stageCompletionStart ? workspace.slice(stageCompletionStart, stageCompletionEnd) : "";
pass(Boolean(stageCompletionBlock), "Stage completion handler could not be isolated.");
pass(!stageCompletionBlock.includes("SET_POSITION"), "Completing a stage must still not move position.");
pass(!stageCompletionBlock.includes("handleMovieContinueStage"), "Stage completion must not invoke continuation implicitly.");

const taskCompletionStart = workspace.indexOf("const handleMovieTaskComplete");
const taskCompletionEnd = workspace.indexOf("const handleMovieStageComplete", taskCompletionStart);
const taskCompletionBlock = taskCompletionStart >= 0 && taskCompletionEnd > taskCompletionStart ? workspace.slice(taskCompletionStart, taskCompletionEnd) : "";
pass(Boolean(taskCompletionBlock), "Task completion handler could not be isolated.");
pass(!taskCompletionBlock.includes("SET_POSITION"), "Completing a task must still not move position.");
pass(!taskCompletionBlock.includes("handleMovieContinueTask"), "Task completion must not invoke continuation implicitly.");

pass(conversation.includes("nextTask = null"), "Cockpit must receive the canonical next task as data.");
pass(conversation.includes("nextStage = null"), "Cockpit must receive the canonical next stage as data.");
pass(conversation.includes("onContinueTask"), "Cockpit must expose creator-owned task continuation.");
pass(conversation.includes("onContinueStage"), "Cockpit must expose creator-owned stage continuation.");
pass(conversation.includes("YOUR NEXT MOVE"), "Cockpit must visibly return the next move to the creator.");
pass(conversation.includes("Stay here or continue when you choose"), "Task completion must explicitly preserve the option to stay.");
pass(conversation.includes("You are still here until you choose to move"), "Stage completion must explicitly preserve position until creator choice.");
pass(conversation.includes("Suggested next task:"), "Task continuation must identify the suggested canonical next task.");
pass(conversation.includes("Suggested next stage:"), "Stage continuation must identify the suggested canonical next stage.");
pass(!conversation.includes("setCurrentPosition("), "Cockpit must never mutate Journey position directly.");
pass(!conversation.includes("completeTask("), "Cockpit must never complete tasks directly.");
pass(!conversation.includes("completeStage("), "Cockpit must never complete stages directly.");

if (failures.length) {
  console.error("Movie Mentor completion continuation verification failed:\n");
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log("Movie Mentor completion continuation verification passed.");
console.log("- completion and movement remain separate creator acts");
console.log("- task continuation is explicit and canonical");
console.log("- stage continuation is explicit and canonical");
console.log("- creator may stay after completion");
console.log("- cockpit remains presentation-only");

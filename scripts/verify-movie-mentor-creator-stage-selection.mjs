import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const workspacePath = path.join(root, "src/components/studio/CreatorWorkspace.jsx");
const wrapperPath = path.join(root, "src/components/studio/mentor/MovieMentorConversation.jsx");
const corePath = path.join(root, "src/components/studio/mentor/MovieMentorConversationCore.jsx");

const workspace = fs.readFileSync(workspacePath, "utf8");
const wrapper = fs.readFileSync(wrapperPath, "utf8");
const conversation = fs.readFileSync(corePath, "utf8");

const failures = [];

function requireText(source, text, label) {
  if (!source.includes(text)) failures.push(`missing:${label}`);
}

function forbidText(source, text, label) {
  if (source.includes(text)) failures.push(`forbidden:${label}`);
}

requireText(wrapper, 'MovieMentorConversationCore', 'live-wrapper-core-composition');
requireText(workspace, 'createJourneyProgressionExecutionRuntime', 'progression-runtime-import');
requireText(workspace, 'issueJourneyPositionAuthority', 'position-authority-issuer');
requireText(workspace, 'POSITION_AUTHORITY_SOURCES.STAGE_CLICK_UI', 'stage-click-source');
requireText(workspace, 'POSITION_ACTIONS.SET_POSITION', 'set-position-action');
requireText(workspace, 'creatorGesture: true', 'creator-gesture-proof');
requireText(workspace, 'creatorActId', 'creator-act-lineage');
requireText(workspace, 'journeyProgressionRuntime.inspect(projectJourney)', 'revision-inspection');
requireText(workspace, 'journeyProgressionRuntime.execute({', 'transactional-execution');
requireText(workspace, 'stageId === canonicalMovieActiveStage', 'active-stage-noop');
requireText(workspace, 'setProjectJourney(result.projectJourney)', 'durable-result-refresh');
requireText(workspace, 'onStageSelect={handleMovieStageSelect}', 'cockpit-stage-handler');
requireText(workspace, 'journeyStages={canonicalMovieJourneyStages}', 'canonical-stage-projection');
requireText(conversation, 'onClick={() => onStageSelect?.(stage.id)}', 'creator-stage-click-surface');
requireText(conversation, 'const canonicalStages = useMemo(() => normaliseJourneyStages(journeyStages)', 'canonical-stage-rendering');

const handlerStart = workspace.indexOf('const handleMovieStageSelect = async (stageId) => {');
const handlerEnd = handlerStart >= 0 ? workspace.indexOf('\n  const handleChangeCreator', handlerStart) : -1;
if (handlerStart < 0 || handlerEnd < 0) {
  failures.push('missing:stage-selection-handler-boundary');
} else {
  const handler = workspace.slice(handlerStart, handlerEnd);
  forbidText(handler, 'mayAdvanceJourney', 'backend-readiness-in-stage-handler');
  forbidText(handler, 'readyToAdvance', 'semantic-readiness-in-stage-handler');
  forbidText(handler, 'recommendedStageId', 'mentor-recommendation-in-stage-handler');
  forbidText(handler, '.setCurrentPosition(', 'raw-set-current-position');
  forbidText(handler, '.completeTask(', 'raw-complete-task');
  forbidText(handler, '.completeStage(', 'raw-complete-stage');
  forbidText(handler, '.revisitStage(', 'raw-revisit-stage');
}

if (failures.length) {
  console.error('Movie Mentor creator stage selection verification FAILED');
  failures.forEach((failure) => console.error(` - ${failure}`));
  process.exit(1);
}

console.log('Movie Mentor creator stage selection verification PASSED');
console.log(' - live wrapper composes the authoritative conversation core');
console.log(' - canonical Journey stages drive the cockpit');
console.log(' - active-stage clicks are no-ops');
console.log(' - explicit creator gestures issue stage-click position authority');
console.log(' - movement executes only through JourneyProgressionExecutionRuntime');
console.log(' - Mentor/backend readiness signals are absent from the stage-click path');
console.log(' - committed Journey reality refreshes the cockpit');
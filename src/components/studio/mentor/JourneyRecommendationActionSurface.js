import createJourneyRecommendationEnvelope from "./JourneyRecommendationEnvelope.js";

const JOURNEY_RECOMMENDATION_ACTION_SURFACE_VERSION = "1.0.0";

function cleanString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function cloneValue(value) {
  if (value === undefined) return undefined;
  try { return JSON.parse(JSON.stringify(value)); } catch { return value; }
}

function getStage(projectJourney, stageId) {
  const id = cleanString(stageId);
  return Array.isArray(projectJourney?.stages)
    ? projectJourney.stages.find((stage) => cleanString(stage?.id) === id) || null
    : null;
}

function getTask(stage, taskId) {
  const id = cleanString(taskId);
  return Array.isArray(stage?.tasks)
    ? stage.tasks.find((task) => cleanString(task?.id) === id) || null
    : null;
}

function resolveActionLabel(projectJourney, envelope) {
  const stage = getStage(projectJourney, envelope?.target?.stageId);
  const task = getTask(stage, envelope?.target?.taskId);
  if (task) return `Go to ${task.label || task.title || task.id}`;
  if (stage) return `Continue to ${stage.shortLabel || stage.label || stage.id}`;
  return "Continue to suggested next step";
}

function createJourneyRecommendationActionSurface({
  projectId,
  projectJourney,
  planningEvidence,
  dismissedRecommendationId = null,
} = {}) {
  const envelope = createJourneyRecommendationEnvelope({
    projectId,
    projectJourney,
    planningEvidence,
  });

  if (!envelope) return null;
  if (cleanString(dismissedRecommendationId) === envelope.recommendationId) return null;

  return Object.freeze({
    version: JOURNEY_RECOMMENDATION_ACTION_SURFACE_VERSION,
    recommendationId: envelope.recommendationId,
    envelope,
    label: resolveActionLabel(projectJourney, envelope),
    dismissLabel: "Stay here",
    authority: "presentation-only",
    creatorChoiceRequired: true,
    mayAdvanceJourney: false,
  });
}

async function acceptCurrentJourneyRecommendation({
  actionSurface,
  acceptanceExecutionRuntime,
  projectId,
  creatorActId,
  creatorAuthorityRevision = null,
  turnRevision = null,
  clarificationRequired = false,
  issuedAt = new Date().toISOString(),
} = {}) {
  if (!actionSurface?.envelope || !cleanString(actionSurface.recommendationId)) {
    const error = new Error("There is no current actionable Journey recommendation to accept.");
    error.code = "JOURNEY_RECOMMENDATION_ACTION_SURFACE_REQUIRED";
    throw error;
  }
  if (typeof acceptanceExecutionRuntime?.execute !== "function") {
    const error = new Error("Recommendation action surface requires the certified acceptance execution runtime.");
    error.code = "JOURNEY_RECOMMENDATION_ACCEPTANCE_RUNTIME_REQUIRED";
    throw error;
  }

  // Ownership law: the UI supplies no recommendation envelope here.
  // Acceptance always consumes the exact current Workspace-owned envelope.
  return acceptanceExecutionRuntime.execute({
    recommendationEnvelope: actionSurface.envelope,
    projectId,
    creatorActId,
    creatorGesture: true,
    creatorAuthorityRevision,
    turnRevision,
    clarificationRequired,
    issuedAt,
  });
}

function dismissCurrentJourneyRecommendation(actionSurface) {
  return Object.freeze({
    status: "dismissed-locally",
    recommendationId: cleanString(actionSurface?.recommendationId) || null,
    journeyMutationPerformed: false,
    progressionRevisionChanged: false,
    creatorAuthorityIssued: false,
  });
}

export {
  JOURNEY_RECOMMENDATION_ACTION_SURFACE_VERSION,
  createJourneyRecommendationActionSurface,
  acceptCurrentJourneyRecommendation,
  dismissCurrentJourneyRecommendation,
};

export default createJourneyRecommendationActionSurface;

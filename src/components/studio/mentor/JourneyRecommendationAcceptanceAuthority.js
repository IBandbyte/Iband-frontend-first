import {
  POSITION_ACTIONS,
  POSITION_AUTHORITY_SOURCES,
  issueJourneyPositionAuthority,
} from "./JourneyPositionAuthorityControl.js";
import {
  RECOMMENDATION_FRESHNESS,
  validateJourneyRecommendationFreshness,
} from "./JourneyRecommendationEnvelope.js";

const JOURNEY_RECOMMENDATION_ACCEPTANCE_VERSION = "1.0.0";

function cleanString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function safeRevision(value) {
  const number = Number(value);
  return Number.isSafeInteger(number) && number >= 0 ? number : null;
}

function fail(code, message, extras = {}) {
  const error = new Error(message);
  error.code = code;
  Object.assign(error, extras);
  throw error;
}

function resolveAcceptanceTarget(envelope, projectJourney) {
  const stageId = cleanString(envelope?.target?.stageId) || null;
  const taskId = cleanString(envelope?.target?.taskId) || null;
  const currentStageId = cleanString(projectJourney?.currentStageId) || null;
  const currentTaskId = cleanString(projectJourney?.currentTaskId) || null;

  if (!stageId) {
    fail("JOURNEY_RECOMMENDATION_ACCEPTANCE_TARGET_REQUIRED", "Recommendation acceptance requires an exact canonical target stage.");
  }

  if (stageId === currentStageId && (taskId || null) === currentTaskId) {
    return Object.freeze({ noOp: true, stageId, taskId });
  }

  return Object.freeze({ noOp: false, stageId, taskId });
}

function createRecommendationAcceptanceAuthority({
  recommendationEnvelope,
  projectId,
  projectJourney,
  creatorActId,
  creatorGesture = false,
  creatorAuthorityRevision = null,
  turnRevision = null,
  clarificationRequired = false,
  issuedAt,
} = {}) {
  const pid = cleanString(projectId);
  const actId = cleanString(creatorActId);
  const progressionRevision = safeRevision(projectJourney?.progression?.revision ?? 0);

  if (!pid) fail("JOURNEY_RECOMMENDATION_ACCEPTANCE_PROJECT_REQUIRED", "Recommendation acceptance requires a projectId.");
  if (!actId || creatorGesture !== true) {
    fail("JOURNEY_RECOMMENDATION_CREATOR_ACT_REQUIRED", "Recommendation acceptance requires a fresh, identifiable creator gesture.");
  }
  if (progressionRevision === null) {
    fail("JOURNEY_RECOMMENDATION_PROGRESSION_REVISION_REQUIRED", "Recommendation acceptance requires exact durable progression revision.");
  }

  const freshness = validateJourneyRecommendationFreshness(recommendationEnvelope, {
    projectId: pid,
    projectJourney,
    creatorAuthorityRevision,
    turnRevision,
    clarificationRequired,
  });

  if (freshness.status !== RECOMMENDATION_FRESHNESS.FRESH || freshness.fresh !== true) {
    fail("JOURNEY_RECOMMENDATION_NOT_FRESH", "Only an exactly fresh Journey recommendation may be accepted.", {
      freshnessStatus: freshness.status,
      freshnessReasons: freshness.reasons,
    });
  }

  const target = resolveAcceptanceTarget(recommendationEnvelope, projectJourney);
  if (target.noOp) {
    return Object.freeze({
      status: "accepted-no-movement-required",
      recommendationId: recommendationEnvelope.recommendationId,
      creatorActId: actId,
      projectId: pid,
      target: Object.freeze({ stageId: target.stageId, taskId: target.taskId }),
      positionAuthority: null,
      movementAuthorised: false,
      recommendationPromotedToAuthority: false,
    });
  }

  const positionAuthority = issueJourneyPositionAuthority({
    projectId: pid,
    source: POSITION_AUTHORITY_SOURCES.CREATOR_EXPLICIT_INTENT,
    action: POSITION_ACTIONS.SET_POSITION,
    target: { stageId: target.stageId, taskId: target.taskId },
    expectedPositionRevision: progressionRevision,
    issuedAt,
    evidence: {
      creatorExplicit: true,
      creatorGesture: true,
      creatorActId: actId,
      acceptedRecommendationId: recommendationEnvelope.recommendationId,
      acceptedRecommendationFingerprint: recommendationEnvelope.fingerprint,
      recommendationAuthorityClass: recommendationEnvelope?.authority?.class || null,
      recommendationMayAdvanceJourney: recommendationEnvelope?.authority?.mayAdvanceJourney === true,
      recommendationIssuedAgainstProgressionRevision: recommendationEnvelope?.issuedAgainst?.progressionRevision,
      recommendationAcceptanceBoundaryVersion: JOURNEY_RECOMMENDATION_ACCEPTANCE_VERSION,
    },
  });

  return Object.freeze({
    status: "creator-authority-issued",
    recommendationId: recommendationEnvelope.recommendationId,
    creatorActId: actId,
    projectId: pid,
    target: Object.freeze({ stageId: target.stageId, taskId: target.taskId }),
    positionAuthority,
    movementAuthorised: true,
    recommendationPromotedToAuthority: false,
  });
}

export {
  JOURNEY_RECOMMENDATION_ACCEPTANCE_VERSION,
  createRecommendationAcceptanceAuthority,
};

export default createRecommendationAcceptanceAuthority;

import executeJourneyRecommendationLifecycleRecovery from "./JourneyRecommendationLifecycleRecovery.js";

const JOURNEY_RECOMMENDATION_RESUME_RECOVERY_VERSION = "1.0.0";

function cleanString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function cloneValue(value) {
  if (value === undefined) return undefined;
  try { return JSON.parse(JSON.stringify(value)); } catch { return value; }
}

function certifyJourneyRecommendationResume({ identityRuntime, projectId } = {}) {
  const pid = cleanString(projectId);
  if (!pid) {
    return Object.freeze({
      status: "no-project",
      projectId: null,
      recommendationActionsBlocked: false,
      recoveryResult: null,
      errorCode: null,
    });
  }

  try {
    const recoveryResult = executeJourneyRecommendationLifecycleRecovery({ identityRuntime, projectId: pid });
    return Object.freeze({
      status: recoveryResult?.status === "repaired" ? "repaired" : "certified",
      projectId: pid,
      recommendationActionsBlocked: false,
      recoveryResult: cloneValue(recoveryResult),
      errorCode: null,
    });
  } catch (error) {
    return Object.freeze({
      status: "recommendation-recovery-blocked",
      projectId: pid,
      recommendationActionsBlocked: true,
      recoveryResult: null,
      errorCode: cleanString(error?.code) || "JOURNEY_RECOMMENDATION_RESUME_RECOVERY_FAILED",
      errorMessage: cleanString(error?.message) || "Recommendation lifecycle recovery could not certify durable state.",
    });
  }
}

export {
  JOURNEY_RECOMMENDATION_RESUME_RECOVERY_VERSION,
  certifyJourneyRecommendationResume,
};

export default certifyJourneyRecommendationResume;

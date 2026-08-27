import executeJourneyRecommendationLifecycleRecovery from "./JourneyRecommendationLifecycleRecovery.js";

const JOURNEY_RECOMMENDATION_RESUME_RECOVERY_VERSION = "1.1.0";

const NON_RETRYABLE_RECOVERY_CODES = new Set([
  "JOURNEY_RECOMMENDATION_RECOVERY_PROOF_CONFLICT",
  "JOURNEY_RECOMMENDATION_RECOVERY_JOURNEY_MALFORMED",
  "JOURNEY_RECOMMENDATION_RECOVERY_PROJECT_NOT_FOUND",
  "JOURNEY_RECOMMENDATION_RECOVERY_PERSISTENCE_REQUIRED",
]);

function cleanString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function cloneValue(value) {
  if (value === undefined) return undefined;
  try { return JSON.parse(JSON.stringify(value)); } catch { return value; }
}

function successResult(pid, recoveryResult, attempts) {
  return Object.freeze({
    status: recoveryResult?.status === "repaired" ? "repaired" : "certified",
    projectId: pid,
    recommendationActionsBlocked: false,
    recoveryResult: cloneValue(recoveryResult),
    recoveryAttempts: attempts,
    errorCode: null,
  });
}

function blockedResult(pid, error, attempts) {
  return Object.freeze({
    status: "recommendation-recovery-blocked",
    projectId: pid,
    recommendationActionsBlocked: true,
    recoveryResult: null,
    recoveryAttempts: attempts,
    errorCode: cleanString(error?.code) || "JOURNEY_RECOMMENDATION_RESUME_RECOVERY_FAILED",
    errorMessage: cleanString(error?.message) || "Recommendation lifecycle recovery could not certify durable state.",
  });
}

function certifyJourneyRecommendationResume({ identityRuntime, projectId } = {}) {
  const pid = cleanString(projectId);
  if (!pid) {
    return Object.freeze({
      status: "no-project",
      projectId: null,
      recommendationActionsBlocked: false,
      recoveryResult: null,
      recoveryAttempts: 0,
      errorCode: null,
    });
  }

  let firstError = null;
  try {
    return successResult(
      pid,
      executeJourneyRecommendationLifecycleRecovery({ identityRuntime, projectId: pid }),
      1
    );
  } catch (error) {
    firstError = error;
  }

  const firstCode = cleanString(firstError?.code);
  if (NON_RETRYABLE_RECOVERY_CODES.has(firstCode)) {
    return blockedResult(pid, firstError, 1);
  }

  // One convergence retry only. This handles another tab repairing the same durable
  // reference or an acknowledgement disappearing after a successful metadata write.
  // Recovery itself remains metadata-only and revalidates durable Journey reality.
  try {
    return successResult(
      pid,
      executeJourneyRecommendationLifecycleRecovery({ identityRuntime, projectId: pid }),
      2
    );
  } catch (secondError) {
    return blockedResult(pid, secondError || firstError, 2);
  }
}

export {
  JOURNEY_RECOMMENDATION_RESUME_RECOVERY_VERSION,
  certifyJourneyRecommendationResume,
};

export default certifyJourneyRecommendationResume;

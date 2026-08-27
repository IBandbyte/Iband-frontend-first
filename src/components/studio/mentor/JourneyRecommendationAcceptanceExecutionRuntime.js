import createRecommendationAcceptanceAuthority from "./JourneyRecommendationAcceptanceAuthority.js";
import { consumeRecommendationWithoutMovement } from "./JourneyRecommendationLifecyclePersistence.js";

const JOURNEY_RECOMMENDATION_ACCEPTANCE_EXECUTION_VERSION = "1.1.0";

function cleanString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function cloneValue(value) {
  if (value === undefined) return undefined;
  try { return JSON.parse(JSON.stringify(value)); } catch { return value; }
}

function fail(code, message, extras = {}) {
  const error = new Error(message);
  error.code = code;
  Object.assign(error, extras);
  throw error;
}

function createRecommendationAcceptanceOperationId(recommendationId) {
  const id = cleanString(recommendationId);
  if (!id) {
    fail(
      "JOURNEY_RECOMMENDATION_ACCEPTANCE_ID_REQUIRED",
      "Recommendation acceptance execution requires an immutable recommendationId."
    );
  }
  return `journey-recommendation-acceptance:${id}`;
}

function createRecommendationNoOpOperationId(recommendationId) {
  const id = cleanString(recommendationId);
  if (!id) {
    fail(
      "JOURNEY_RECOMMENDATION_ACCEPTANCE_ID_REQUIRED",
      "Recommendation no-op consumption requires an immutable recommendationId."
    );
  }
  return `journey-recommendation-noop:${id}`;
}

function getDurableJourney(identityRuntime, projectId) {
  const project = identityRuntime?.memory?.getProject?.(projectId) || null;
  return cloneValue(project?.metadata?.projectJourney || null);
}

function findCommittedAcceptanceReceipt(projectJourney, operationId) {
  const receipts = Array.isArray(projectJourney?.progression?.committedOperations)
    ? projectJourney.progression.committedOperations
    : [];
  return cloneValue(
    receipts.find((receipt) => cleanString(receipt?.operationId) === operationId) || null
  );
}

function createJourneyRecommendationAcceptanceExecutionRuntime({
  identityRuntime,
  progressionRuntime,
} = {}) {
  if (!identityRuntime?.memory?.getProject) {
    fail(
      "JOURNEY_RECOMMENDATION_ACCEPTANCE_DURABLE_RUNTIME_REQUIRED",
      "Recommendation acceptance execution requires durable Journey access."
    );
  }
  if (typeof progressionRuntime?.execute !== "function") {
    fail(
      "JOURNEY_RECOMMENDATION_ACCEPTANCE_PROGRESSION_RUNTIME_REQUIRED",
      "Recommendation acceptance execution requires the transactional Journey progression runtime."
    );
  }

  async function execute({
    recommendationEnvelope,
    projectId,
    creatorActId,
    creatorGesture = false,
    creatorAuthorityRevision = null,
    turnRevision = null,
    clarificationRequired = false,
    issuedAt = new Date().toISOString(),
  } = {}) {
    const pid = cleanString(projectId);
    const recommendationId = cleanString(recommendationEnvelope?.recommendationId);
    if (!pid) {
      fail(
        "JOURNEY_RECOMMENDATION_ACCEPTANCE_PROJECT_REQUIRED",
        "Recommendation acceptance execution requires a projectId."
      );
    }

    const operationId = createRecommendationAcceptanceOperationId(recommendationId);
    const durableJourney = getDurableJourney(identityRuntime, pid);
    if (!durableJourney) {
      fail(
        "JOURNEY_RECOMMENDATION_ACCEPTANCE_DURABLE_JOURNEY_REQUIRED",
        "Recommendation acceptance execution could not load durable Journey reality."
      );
    }

    const existingReceipt = findCommittedAcceptanceReceipt(durableJourney, operationId);
    if (existingReceipt) {
      return Object.freeze({
        status: "already-committed",
        recommendationId,
        operationId,
        receipt: existingReceipt,
        projectJourney: cloneValue(durableJourney),
        progressionRevision: durableJourney?.progression?.revision ?? null,
        newCreatorAuthorityIssued: false,
        recommendationPromotedToAuthority: false,
      });
    }

    const acceptance = createRecommendationAcceptanceAuthority({
      recommendationEnvelope,
      projectId: pid,
      projectJourney: durableJourney,
      creatorActId,
      creatorGesture,
      creatorAuthorityRevision,
      turnRevision,
      clarificationRequired,
      issuedAt,
    });

    if (acceptance.status === "accepted-no-movement-required") {
      const noOpResult = consumeRecommendationWithoutMovement({
        identityRuntime,
        projectId: pid,
        recommendationId,
        recommendationFingerprint: recommendationEnvelope?.fingerprint || null,
        expectedProgressionRevision: durableJourney?.progression?.revision ?? 0,
        operationId: createRecommendationNoOpOperationId(recommendationId),
        creatorActId,
      });
      return Object.freeze({
        ...cloneValue(noOpResult),
        recommendationPromotedToAuthority: false,
      });
    }

    const result = await progressionRuntime.execute({
      projectId: pid,
      projectJourney: durableJourney,
      authorityEnvelope: acceptance.positionAuthority,
      operationId,
      input: {
        recommendationId,
        recommendationFingerprint: recommendationEnvelope?.fingerprint || null,
      },
    });

    return Object.freeze({
      ...cloneValue(result),
      recommendationId,
      operationId,
      newCreatorAuthorityIssued: result?.status === "committed",
      recommendationPromotedToAuthority: false,
    });
  }

  return Object.freeze({
    version: JOURNEY_RECOMMENDATION_ACCEPTANCE_EXECUTION_VERSION,
    createOperationId: createRecommendationAcceptanceOperationId,
    createNoOpOperationId: createRecommendationNoOpOperationId,
    findCommittedReceipt: findCommittedAcceptanceReceipt,
    execute,
  });
}

export {
  JOURNEY_RECOMMENDATION_ACCEPTANCE_EXECUTION_VERSION,
  createRecommendationAcceptanceOperationId,
  createRecommendationNoOpOperationId,
  findCommittedAcceptanceReceipt,
  createJourneyRecommendationAcceptanceExecutionRuntime,
};

export default createJourneyRecommendationAcceptanceExecutionRuntime;

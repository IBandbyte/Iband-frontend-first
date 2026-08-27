import createRecommendationAcceptanceAuthority from "./JourneyRecommendationAcceptanceAuthority.js";
import createJourneyDurableAuthorityStore from "./JourneyDurableAuthorityStore.js";
import createJourneyProgressionAuthorityAdapter from "./JourneyProgressionAuthorityAdapter.js";
import commitJourneyAuthorityTransitionUnderLock from "./JourneyAuthorityAtomicTransition.js";
import { findAuthorityRecommendation } from "./JourneyAuthorityRecommendationLifecycle.js";
import { withJourneyProgressionProjectLock } from "./JourneyProgressionProjectLock.js";

const JOURNEY_RECOMMENDATION_ACCEPTANCE_EXECUTION_VERSION = "1.5.0";

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
    fail("JOURNEY_RECOMMENDATION_ACCEPTANCE_ID_REQUIRED", "Recommendation acceptance execution requires an immutable recommendationId.");
  }
  return `journey-recommendation-acceptance:${id}`;
}

function createRecommendationNoOpOperationId(recommendationId) {
  const id = cleanString(recommendationId);
  if (!id) {
    fail("JOURNEY_RECOMMENDATION_ACCEPTANCE_ID_REQUIRED", "Recommendation no-op consumption requires an immutable recommendationId.");
  }
  return `journey-recommendation-noop:${id}`;
}

function createAuthorityMaterializationReference(recommendationEnvelope, projectId) {
  const recommendationId = cleanString(recommendationEnvelope?.recommendationId);
  const fingerprint = cleanString(recommendationEnvelope?.fingerprint);
  const pid = cleanString(projectId);
  if (!recommendationId || !fingerprint || !pid) {
    fail(
      "JOURNEY_RECOMMENDATION_ACCEPTANCE_MATERIALIZATION_INVALID",
      "Recommendation acceptance requires canonical recommendation identity before authority materialization."
    );
  }
  return Object.freeze({
    recommendationId,
    recommendationFingerprint: fingerprint,
    projectId: pid,
    issuedAgainst: cloneValue(recommendationEnvelope?.issuedAgainst || null),
    target: cloneValue(recommendationEnvelope?.target || null),
    lifecycle: Object.freeze({ current: true, terminalReason: null }),
  });
}

function getDurableJourney(identityRuntime, projectId) {
  if (typeof identityRuntime?.getPreferredJourney === "function") {
    const preferred = identityRuntime.getPreferredJourney(projectId);
    if (preferred?.projectJourney) return cloneValue(preferred.projectJourney);
  }
  const memory = identityRuntime?.memory;
  const project = typeof memory?.getPersistedProject === "function"
    ? memory.getPersistedProject(projectId)
    : memory?.getProject?.(projectId) || null;
  return cloneValue(project?.metadata?.projectJourney || null);
}

function findCommittedAcceptanceReceipt(projectJourney, operationId) {
  const receipts = Array.isArray(projectJourney?.progression?.committedOperations)
    ? projectJourney.progression.committedOperations
    : [];
  return cloneValue(receipts.find((receipt) => cleanString(receipt?.operationId) === operationId) || null);
}

function createJourneyRecommendationAcceptanceExecutionRuntime({
  identityRuntime,
  progressionRuntime,
  authorityStore = createJourneyDurableAuthorityStore(),
  authorityAdapter = null,
} = {}) {
  if (!identityRuntime?.memory?.getProject) {
    fail("JOURNEY_RECOMMENDATION_ACCEPTANCE_DURABLE_RUNTIME_REQUIRED", "Recommendation acceptance execution requires durable Journey access.");
  }
  if (typeof progressionRuntime?.execute !== "function") {
    fail("JOURNEY_RECOMMENDATION_ACCEPTANCE_PROGRESSION_RUNTIME_REQUIRED", "Recommendation acceptance execution requires the transactional Journey progression runtime.");
  }
  const resolvedAuthorityAdapter = authorityAdapter || createJourneyProgressionAuthorityAdapter({
    identityRuntime,
    authorityStore,
  });

  async function consumeNoMovementUnderProjectLock({
    pid,
    recommendationEnvelope,
    recommendationId,
    creatorActId,
  }) {
    return withJourneyProgressionProjectLock({
      projectId: pid,
      callback: async (lockProof) => {
        const preferredJourney = getDurableJourney(identityRuntime, pid);
        if (!preferredJourney) {
          fail("JOURNEY_RECOMMENDATION_ACCEPTANCE_DURABLE_JOURNEY_REQUIRED", "Recommendation no-op acceptance could not load durable Journey reality inside the project lock.");
        }

        const resolvedAuthority = resolvedAuthorityAdapter.resolveUnderLock({
          projectId: pid,
          fallbackJourney: preferredJourney,
          serialization: lockProof,
        });
        const authoritativeJourney = cloneValue(resolvedAuthority.projectJourney);
        const operationId = createRecommendationNoOpOperationId(recommendationId);
        const existingAuthorityRecommendation = findAuthorityRecommendation(
          resolvedAuthority?.authorityRecord?.recommendations,
          recommendationId
        );

        if (
          existingAuthorityRecommendation?.lifecycle?.current === false &&
          existingAuthorityRecommendation?.lifecycle?.terminalReason === "consumed" &&
          cleanString(existingAuthorityRecommendation?.lifecycle?.operationId) === operationId
        ) {
          return Object.freeze({
            status: "already-consumed-no-movement",
            recommendationId,
            operationId,
            creatorActId: cleanString(existingAuthorityRecommendation?.lifecycle?.creatorActId) || null,
            projectJourney: authoritativeJourney,
            progressionRevision: authoritativeJourney?.progression?.revision ?? 0,
            authorityGeneration: resolvedAuthority.authorityGeneration,
            authorityCommitted: true,
            newCreatorAuthorityIssued: false,
            recommendationPromotedToAuthority: false,
            serialization: Object.freeze({
              mode: lockProof.mode,
              lockName: lockProof.lockName,
              crossTabSerialized: lockProof.crossTabSerialized,
            }),
          });
        }

        const authorityCommit = commitJourneyAuthorityTransitionUnderLock({
          authorityStore,
          resolvedAuthority,
          nextJourney: authoritativeJourney,
          operationId,
          acceptedRecommendationId: recommendationId,
          recommendationFingerprint: recommendationEnvelope?.fingerprint || null,
          acceptedRecommendationReference: createAuthorityMaterializationReference(recommendationEnvelope, pid),
          creatorActId,
          withoutMovement: true,
          serialization: lockProof,
        });
        const committedJourney = cloneValue(authorityCommit?.record?.journey || authoritativeJourney);

        return Object.freeze({
          status: "accepted-no-movement-required",
          recommendationId,
          operationId,
          creatorActId: cleanString(creatorActId) || null,
          projectJourney: committedJourney,
          progressionRevision: committedJourney?.progression?.revision ?? 0,
          authorityGeneration: authorityCommit?.authorityGeneration ?? null,
          authorityCommitStatus: authorityCommit?.status || null,
          authorityCommitted: true,
          newCreatorAuthorityIssued: false,
          recommendationPromotedToAuthority: false,
          serialization: Object.freeze({
            mode: lockProof.mode,
            lockName: lockProof.lockName,
            crossTabSerialized: lockProof.crossTabSerialized,
          }),
        });
      },
    });
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
      fail("JOURNEY_RECOMMENDATION_ACCEPTANCE_PROJECT_REQUIRED", "Recommendation acceptance execution requires a projectId.");
    }

    const operationId = createRecommendationAcceptanceOperationId(recommendationId);
    const durableJourney = getDurableJourney(identityRuntime, pid);
    if (!durableJourney) {
      fail("JOURNEY_RECOMMENDATION_ACCEPTANCE_DURABLE_JOURNEY_REQUIRED", "Recommendation acceptance execution could not load durable Journey reality.");
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
      return consumeNoMovementUnderProjectLock({ pid, recommendationEnvelope, recommendationId, creatorActId });
    }

    const result = await progressionRuntime.execute({
      projectId: pid,
      projectJourney: durableJourney,
      authorityEnvelope: acceptance.positionAuthority,
      operationId,
      input: {
        recommendationId,
        recommendationFingerprint: recommendationEnvelope?.fingerprint || null,
        acceptedRecommendationReference: createAuthorityMaterializationReference(recommendationEnvelope, pid),
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
    createAuthorityMaterializationReference,
    findCommittedReceipt: findCommittedAcceptanceReceipt,
    execute,
  });
}

export {
  JOURNEY_RECOMMENDATION_ACCEPTANCE_EXECUTION_VERSION,
  createRecommendationAcceptanceOperationId,
  createRecommendationNoOpOperationId,
  createAuthorityMaterializationReference,
  findCommittedAcceptanceReceipt,
  createJourneyRecommendationAcceptanceExecutionRuntime,
};

export default createJourneyRecommendationAcceptanceExecutionRuntime;
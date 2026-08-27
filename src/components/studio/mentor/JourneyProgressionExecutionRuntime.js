import {
  POSITION_ACTIONS,
  validateJourneyPositionAuthority,
} from "./JourneyPositionAuthorityControl.js";
import { persistJourneyAndRecommendationLifecycle } from "./JourneyRecommendationLifecyclePersistence.js";
import withJourneyProgressionProjectLock from "./JourneyProgressionProjectLock.js";

const JOURNEY_PROGRESSION_RUNTIME_VERSION = "1.3.0";
const JOURNEY_PROGRESSION_SCHEMA_VERSION = 1;
const MAX_COMMITTED_PROGRESSION_OPERATIONS = 64;

const PROGRESSION_HEALTH = Object.freeze({
  HEALTHY: "healthy",
  LEGACY_BASELINE: "legacy-baseline",
  RECOVERY_REQUIRED: "progression-recovery-required",
});

function cleanString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function clone(value) {
  if (value === undefined) return undefined;
  try { return JSON.parse(JSON.stringify(value)); } catch { return value; }
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

function createTimestamp() {
  return new Date().toISOString();
}

function createProgressionEnvelope() {
  return {
    schemaVersion: JOURNEY_PROGRESSION_SCHEMA_VERSION,
    revision: 0,
    lastCommittedOperation: null,
    committedOperations: [],
  };
}

function inspectJourneyProgression(journey) {
  const progression = journey?.progression;
  if (progression === undefined || progression === null) {
    return Object.freeze({
      status: PROGRESSION_HEALTH.LEGACY_BASELINE,
      revision: 0,
      progression: createProgressionEnvelope(),
      problems: Object.freeze([]),
    });
  }

  const problems = [];
  const revision = safeRevision(progression?.revision);
  const receipts = Array.isArray(progression?.committedOperations) ? progression.committedOperations : null;
  const last = progression?.lastCommittedOperation ?? null;

  if (progression?.schemaVersion !== JOURNEY_PROGRESSION_SCHEMA_VERSION) problems.push("schema-version-invalid");
  if (revision === null) problems.push("revision-invalid");
  if (!receipts) problems.push("committed-operations-invalid");

  const seenOperationIds = new Set();
  const seenAuthorityIds = new Set();
  (receipts || []).forEach((receipt) => {
    const operationId = cleanString(receipt?.operationId);
    const authorityId = cleanString(receipt?.authorityId);
    const fromRevision = safeRevision(receipt?.fromRevision);
    const toRevision = safeRevision(receipt?.toRevision);
    if (!operationId || !authorityId || fromRevision === null || toRevision === null || toRevision !== fromRevision + 1) {
      problems.push("receipt-invalid");
      return;
    }
    if (seenOperationIds.has(operationId)) problems.push("duplicate-operation-id");
    if (seenAuthorityIds.has(authorityId)) problems.push("duplicate-authority-id");
    seenOperationIds.add(operationId);
    seenAuthorityIds.add(authorityId);
    if (revision !== null && toRevision > revision) problems.push("receipt-ahead-of-revision");
  });

  if (revision === 0 && last !== null) problems.push("zero-revision-has-last-operation");
  if (revision !== null && revision > 0) {
    const lastTo = safeRevision(last?.toRevision);
    const lastFrom = safeRevision(last?.fromRevision);
    if (!last || lastTo !== revision || lastFrom !== revision - 1) problems.push("last-operation-revision-mismatch");
  }
  if (last) {
    const lastOperationId = cleanString(last.operationId);
    const matchingReceipt = (receipts || []).find((receipt) => cleanString(receipt?.operationId) === lastOperationId);
    if (!lastOperationId || !matchingReceipt) problems.push("last-operation-not-in-ledger");
  }

  if (problems.length) {
    return Object.freeze({
      status: PROGRESSION_HEALTH.RECOVERY_REQUIRED,
      revision,
      progression: clone(progression),
      problems: Object.freeze(Array.from(new Set(problems))),
    });
  }

  return Object.freeze({
    status: PROGRESSION_HEALTH.HEALTHY,
    revision,
    progression: clone(progression),
    problems: Object.freeze([]),
  });
}

function normaliseJourneyForProgression(journey) {
  const inspection = inspectJourneyProgression(journey);
  if (inspection.status === PROGRESSION_HEALTH.RECOVERY_REQUIRED) {
    fail(
      "JOURNEY_PROGRESSION_RECOVERY_REQUIRED",
      "Journey progression metadata is internally inconsistent and must be recovered before progression can continue.",
      { problems: inspection.problems }
    );
  }
  const next = clone(journey);
  if (inspection.status === PROGRESSION_HEALTH.LEGACY_BASELINE) next.progression = createProgressionEnvelope();
  return { journey: next, revision: inspection.revision, legacy: inspection.status === PROGRESSION_HEALTH.LEGACY_BASELINE };
}

function getCommittedReceipt(journey, operationId, authorityId) {
  const receipts = Array.isArray(journey?.progression?.committedOperations) ? journey.progression.committedOperations : [];
  const opId = cleanString(operationId);
  const authId = cleanString(authorityId);
  return clone(receipts.find((receipt) =>
    (opId && cleanString(receipt?.operationId) === opId) ||
    (authId && cleanString(receipt?.authorityId) === authId)
  ) || null);
}

function getDurableJourney(identityRuntime, projectId) {
  const memory = identityRuntime?.memory;
  const project = typeof memory?.getPersistedProject === "function"
    ? memory.getPersistedProject(projectId)
    : memory?.getProject?.(projectId) || null;
  return clone(project?.metadata?.projectJourney || null);
}

function assertExactTargetExists(journeyEngine, journey, action, target = {}) {
  if (!journeyEngine) fail("JOURNEY_PROGRESSION_ENGINE_REQUIRED", "Journey progression execution requires CreatorJourneyEngine.");
  const stageId = cleanString(target.stageId);
  const taskId = cleanString(target.taskId);
  const stage = stageId ? journeyEngine.getStage?.(journey, stageId) : null;

  if ([POSITION_ACTIONS.SET_POSITION, POSITION_ACTIONS.REVISIT_STAGE, POSITION_ACTIONS.COMPLETE_STAGE].includes(action) && !stage) {
    fail("JOURNEY_PROGRESSION_TARGET_STAGE_NOT_FOUND", "Journey progression target stage does not exist.", { stageId });
  }
  if (action === POSITION_ACTIONS.COMPLETE_TASK) {
    if (!stage) fail("JOURNEY_PROGRESSION_TARGET_STAGE_NOT_FOUND", "Journey task completion target stage does not exist.", { stageId });
    const task = Array.isArray(stage.tasks) ? stage.tasks.find((item) => item?.id === taskId) : null;
    if (!task) fail("JOURNEY_PROGRESSION_TARGET_TASK_NOT_FOUND", "Journey progression target task does not exist.", { stageId, taskId });
  }
}

function completeStageWithoutMovement(journeyEngine, journey, { stageId, milestoneMessage = null, operationId } = {}) {
  const next = clone(journey);
  const stage = journeyEngine.getStage?.(next, stageId);
  if (!stage) return next;
  const constants = journeyEngine.constants || {};
  const stageStatuses = constants.STAGE_STATUSES || {};
  const taskStatuses = constants.TASK_STATUSES || {};
  const journeyStatuses = constants.JOURNEY_STATUSES || {};
  const now = createTimestamp();

  stage.status = stageStatuses.COMPLETED_FOR_NOW || "completed-for-now";
  stage.completedAt = stage.completedAt || now;
  stage.tasks = (Array.isArray(stage.tasks) ? stage.tasks : []).map((task) => ({
    ...task,
    status: task.status === (taskStatuses.SKIPPED_FOR_NOW || "skipped-for-now")
      ? task.status
      : (taskStatuses.COMPLETED_FOR_NOW || "completed-for-now"),
    completedAt: task.completedAt || now,
  }));

  if (!Array.isArray(next.milestones)) next.milestones = [];
  const existingMilestone = next.milestones.find((milestone) => milestone?.stageId === stage.id);
  if (!existingMilestone) {
    next.milestones.push({
      id: `journey-progression-milestone:${cleanString(operationId) || stage.id}`,
      stageId: stage.id,
      label: stage.label,
      significance: stage.significance,
      message: cleanString(milestoneMessage) || null,
      reachedAt: now,
    });
  }

  const allStagesCompleted = (Array.isArray(next.stages) ? next.stages : []).every(
    (item) => item?.status === (stageStatuses.COMPLETED_FOR_NOW || "completed-for-now")
  );
  if (allStagesCompleted) {
    next.status = journeyStatuses.COMPLETED_FOR_NOW || "completed-for-now";
    next.completedAt = next.completedAt || now;
  }
  next.updatedAt = now;
  return next;
}

function applyAtomicJourneyOperation(journeyEngine, journey, validation, input = {}, operationId) {
  assertExactTargetExists(journeyEngine, journey, validation.action, validation.target);
  switch (validation.action) {
    case POSITION_ACTIONS.SET_POSITION:
      return journeyEngine.setCurrentPosition(journey, {
        stageId: validation.target.stageId,
        taskId: validation.target.taskId,
        sceneId: input.sceneId ?? null,
        note: input.note ?? null,
      });
    case POSITION_ACTIONS.COMPLETE_TASK:
      return journeyEngine.completeTask(journey, {
        stageId: validation.target.stageId,
        taskId: validation.target.taskId,
      });
    case POSITION_ACTIONS.COMPLETE_STAGE:
      return completeStageWithoutMovement(journeyEngine, journey, {
        stageId: validation.target.stageId,
        milestoneMessage: input.milestoneMessage ?? null,
        operationId,
      });
    case POSITION_ACTIONS.REVISIT_STAGE:
      return journeyEngine.revisitStage(journey, {
        stageId: validation.target.stageId,
        reason: input.reason ?? null,
      });
    case POSITION_ACTIONS.PAUSE_JOURNEY:
      return journeyEngine.pauseJourney(journey, {
        note: input.note ?? null,
        sceneId: input.sceneId ?? null,
      });
    default:
      fail("JOURNEY_PROGRESSION_ACTION_UNSUPPORTED", "Journey progression execution received an unsupported atomic action.", { action: validation.action });
  }
}

function buildCommittedReceipt({ operationId, authorityEnvelope, validation, fromRevision, toRevision, resultJourney, input = {} }) {
  const recommendationId = cleanString(input?.recommendationId);
  const recommendationFingerprint = cleanString(input?.recommendationFingerprint);
  return Object.freeze({
    operationId,
    authorityId: validation.authorityId,
    creatorActId: cleanString(authorityEnvelope?.creatorActId) || null,
    priorAuthorityId: cleanString(authorityEnvelope?.priorAuthorityId) || null,
    operationType: validation.action,
    source: validation.source,
    authorityClass: validation.authorityClass,
    fromRevision,
    toRevision,
    target: clone(validation.target),
    recommendation: recommendationId ? Object.freeze({
      recommendationId,
      fingerprint: recommendationFingerprint || null,
      disposition: "consumed",
      issuedAgainstProgressionRevision: fromRevision,
    }) : null,
    result: Object.freeze({
      currentStageId: resultJourney?.currentStageId || null,
      currentTaskId: resultJourney?.currentTaskId || null,
      journeyStatus: resultJourney?.status || null,
      resumePoint: clone(resultJourney?.resumePoint || null),
    }),
    committedAt: createTimestamp(),
  });
}

async function persistCandidateJourney({ identityRuntime, projectId, candidateJourney, currentRevision, receipt, input, authorityEnvelope }) {
  const atomicProject = persistJourneyAndRecommendationLifecycle({
    identityRuntime,
    projectId,
    candidateJourney,
    expectedProgressionRevision: currentRevision,
    acceptedRecommendationId: cleanString(input?.recommendationId) || null,
    recommendationFingerprint: cleanString(input?.recommendationFingerprint) || null,
    operationId: receipt?.operationId || null,
    creatorActId: cleanString(authorityEnvelope?.creatorActId) || null,
  });
  if (atomicProject) return atomicProject;
  return identityRuntime.persistJourney(projectId, candidateJourney, {
    expectedProgressionRevision: currentRevision,
  });
}

async function executeJourneyProgressionUnlocked({
  journeyEngine,
  identityRuntime,
  projectId,
  projectJourney,
  authorityEnvelope,
  operationId = null,
  input = {},
} = {}) {
  const pid = cleanString(projectId);
  if (!pid) fail("JOURNEY_PROGRESSION_PROJECT_REQUIRED", "Journey progression execution requires a projectId.");
  if (!projectJourney || typeof projectJourney !== "object") fail("JOURNEY_PROGRESSION_JOURNEY_REQUIRED", "Journey progression execution requires the current project Journey.");
  if (!identityRuntime || typeof identityRuntime.persistJourney !== "function") fail("JOURNEY_PROGRESSION_PERSISTENCE_REQUIRED", "Journey progression execution requires a Journey persistence runtime.");

  // Cross-tab law: this durable read occurs after project-lock acquisition and
  // prefers a fresh persisted storage view over this tab's cached memory state.
  const durableJourney = getDurableJourney(identityRuntime, pid);
  const sourceJourney = durableJourney || projectJourney;
  const normalised = normaliseJourneyForProgression(sourceJourney);
  const currentJourney = normalised.journey;
  const currentRevision = normalised.revision;
  const authorityId = cleanString(authorityEnvelope?.authorityId);
  const resolvedOperationId = cleanString(operationId) || (authorityId ? `journey-progression:${authorityId}` : "");
  if (!resolvedOperationId) fail("JOURNEY_PROGRESSION_OPERATION_ID_REQUIRED", "Journey progression execution requires an operation identity.");

  const existingReceipt = getCommittedReceipt(currentJourney, resolvedOperationId, authorityId);
  if (existingReceipt) {
    return Object.freeze({
      status: "already-committed",
      projected: false,
      operationId: existingReceipt.operationId,
      receipt: existingReceipt,
      projectJourney: clone(sourceJourney),
      progressionRevision: currentRevision,
    });
  }

  const consumedAuthorityIds = (currentJourney.progression.committedOperations || [])
    .map((receipt) => cleanString(receipt?.authorityId))
    .filter(Boolean);
  const validation = validateJourneyPositionAuthority(authorityEnvelope, {
    projectId: pid,
    positionRevision: currentRevision,
    consumedAuthorityIds,
  });

  const mutatedJourney = applyAtomicJourneyOperation(journeyEngine, currentJourney, validation, input, resolvedOperationId);
  const nextRevision = currentRevision + 1;
  const receipt = buildCommittedReceipt({
    operationId: resolvedOperationId,
    authorityEnvelope,
    validation,
    fromRevision: currentRevision,
    toRevision: nextRevision,
    resultJourney: mutatedJourney,
    input,
  });

  const nextReceipts = [
    ...(currentJourney.progression.committedOperations || []),
    receipt,
  ].slice(-MAX_COMMITTED_PROGRESSION_OPERATIONS);

  const candidateJourney = {
    ...clone(mutatedJourney),
    progression: {
      schemaVersion: JOURNEY_PROGRESSION_SCHEMA_VERSION,
      revision: nextRevision,
      lastCommittedOperation: clone(receipt),
      committedOperations: clone(nextReceipts),
    },
  };

  const persistedProject = await persistCandidateJourney({
    identityRuntime,
    projectId: pid,
    candidateJourney,
    currentRevision,
    receipt,
    input,
    authorityEnvelope,
  });
  const persistedJourney = persistedProject?.metadata?.projectJourney || null;
  if (!persistedJourney) fail("JOURNEY_PROGRESSION_PERSISTENCE_FAILED", "Journey progression persistence did not return the committed Journey.");

  const persistedInspection = inspectJourneyProgression(persistedJourney);
  if (persistedInspection.status !== PROGRESSION_HEALTH.HEALTHY || persistedInspection.revision !== nextRevision) {
    fail("JOURNEY_PROGRESSION_PERSISTENCE_VERIFICATION_FAILED", "Persisted Journey progression reality did not match the committed revision.", {
      expectedRevision: nextRevision,
      actualRevision: persistedInspection.revision,
      progressionStatus: persistedInspection.status,
    });
  }

  return Object.freeze({
    status: "committed",
    projected: true,
    operationId: resolvedOperationId,
    receipt: clone(receipt),
    projectJourney: clone(persistedJourney),
    progressionRevision: nextRevision,
  });
}

async function executeJourneyProgression(input = {}) {
  const pid = cleanString(input?.projectId);
  if (!pid) fail("JOURNEY_PROGRESSION_PROJECT_REQUIRED", "Journey progression execution requires a projectId.");

  return withJourneyProgressionProjectLock({
    projectId: pid,
    callback: async (lockProof) => {
      const result = await executeJourneyProgressionUnlocked(input);
      return Object.freeze({
        ...result,
        serialization: Object.freeze({
          mode: lockProof.mode,
          lockName: lockProof.lockName,
          crossTabSerialized: lockProof.crossTabSerialized,
        }),
      });
    },
  });
}

function createJourneyProgressionExecutionRuntime({ journeyEngine, identityRuntime } = {}) {
  return Object.freeze({
    version: JOURNEY_PROGRESSION_RUNTIME_VERSION,
    inspect: inspectJourneyProgression,
    execute(input = {}) {
      return executeJourneyProgression({ journeyEngine, identityRuntime, ...input });
    },
  });
}

export {
  JOURNEY_PROGRESSION_RUNTIME_VERSION,
  JOURNEY_PROGRESSION_SCHEMA_VERSION,
  MAX_COMMITTED_PROGRESSION_OPERATIONS,
  PROGRESSION_HEALTH,
  createProgressionEnvelope,
  inspectJourneyProgression,
  normaliseJourneyForProgression,
  executeJourneyProgression,
  createJourneyProgressionExecutionRuntime,
};

export default createJourneyProgressionExecutionRuntime;

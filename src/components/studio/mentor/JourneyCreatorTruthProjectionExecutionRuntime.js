import createJourneyDurableAuthorityStore from "./JourneyDurableAuthorityStore.js";
import createJourneyProgressionAuthorityAdapter from "./JourneyProgressionAuthorityAdapter.js";
import reconcileAuthoritativeCreatorTruth, {
  getProjectionRevision,
} from "./CreatorJourneyAuthoritativeProjection.js";
import { withJourneyProgressionProjectLock } from "./JourneyProgressionProjectLock.js";

const JOURNEY_CREATOR_TRUTH_PROJECTION_EXECUTION_VERSION = "1.0.0";

function cleanString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function cloneValue(value) {
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

function positionSignature(journey = {}) {
  return JSON.stringify({
    currentStageId: journey?.currentStageId ?? null,
    currentTaskId: journey?.currentTaskId ?? null,
    resumePoint: cloneValue(journey?.resumePoint ?? null),
    stageStatuses: Array.isArray(journey?.stages)
      ? journey.stages.map((stage) => ({
          id: stage?.id ?? null,
          status: stage?.status ?? null,
          tasks: Array.isArray(stage?.tasks)
            ? stage.tasks.map((task) => ({ id: task?.id ?? null, status: task?.status ?? null }))
            : [],
        }))
      : [],
  });
}

function projectionOperationId(projectId, authorityRevision) {
  const pid = cleanString(projectId);
  const revision = safeRevision(authorityRevision);
  if (!pid || revision === null) {
    fail(
      "JOURNEY_CREATOR_TRUTH_PROJECTION_IDENTITY_REQUIRED",
      "Creator-truth projection requires project identity and a valid creator-authority revision."
    );
  }
  return `journey-creator-truth-projection:${pid}:${revision}`;
}

function createJourneyCreatorTruthProjectionExecutionRuntime({
  identityRuntime,
  authorityStore = createJourneyDurableAuthorityStore(),
  authorityAdapter = null,
} = {}) {
  if (!identityRuntime?.memory?.getProject) {
    fail(
      "JOURNEY_CREATOR_TRUTH_PROJECTION_RUNTIME_REQUIRED",
      "Creator-truth projection requires canonical project access."
    );
  }

  const resolvedAuthorityAdapter = authorityAdapter || createJourneyProgressionAuthorityAdapter({
    identityRuntime,
    authorityStore,
  });

  async function execute({ projectId, postCommitCreatorAuthority } = {}) {
    const pid = cleanString(projectId);
    const authorityRevision = safeRevision(postCommitCreatorAuthority?.revision);
    if (!pid) fail("JOURNEY_CREATOR_TRUTH_PROJECTION_PROJECT_REQUIRED", "Creator-truth projection requires a projectId.");
    if (authorityRevision === null) {
      fail(
        "JOURNEY_CREATOR_TRUTH_PROJECTION_AUTHORITY_REQUIRED",
        "Creator-truth projection requires committed creator authority with a valid revision."
      );
    }

    return withJourneyProgressionProjectLock({
      projectId: pid,
      callback: async (lockProof) => {
        const fallbackJourney = typeof identityRuntime?.getPreferredJourney === "function"
          ? cloneValue(identityRuntime.getPreferredJourney(pid)?.projectJourney || null)
          : null;

        const resolved = resolvedAuthorityAdapter.resolveUnderLock({
          projectId: pid,
          fallbackJourney,
          serialization: lockProof,
        });
        const currentJourney = cloneValue(resolved.projectJourney);
        const currentProjectionRevision = getProjectionRevision(currentJourney);

        if (currentProjectionRevision !== null && currentProjectionRevision > authorityRevision) {
          fail(
            "JOURNEY_CREATOR_TRUTH_PROJECTION_STALE",
            "Older creator authority cannot regress authoritative Journey creator truth.",
            { currentProjectionRevision, authorityRevision }
          );
        }

        if (currentProjectionRevision !== null && currentProjectionRevision === authorityRevision) {
          return Object.freeze({
            status: "already-projected",
            operationId: projectionOperationId(pid, authorityRevision),
            projectId: pid,
            projectJourney: currentJourney,
            progressionRevision: resolved.progressionRevision,
            authorityGeneration: resolved.authorityGeneration,
            creatorAuthorityRevision: authorityRevision,
            authorityCommitted: true,
            serialization: cloneValue(lockProof),
          });
        }

        const beforePosition = positionSignature(currentJourney);
        const nextJourney = reconcileAuthoritativeCreatorTruth(
          currentJourney,
          postCommitCreatorAuthority
        );
        const afterPosition = positionSignature(nextJourney);
        if (beforePosition !== afterPosition) {
          fail(
            "JOURNEY_CREATOR_TRUTH_PROJECTION_MOVED_POSITION",
            "Creator-truth authority projection attempted to move Journey position or completion state."
          );
        }

        const commit = authorityStore.compareAndCommitUnderLock({
          project: resolved.project,
          expectedGeneration: resolved.authorityGeneration,
          expectedProgressionRevision: resolved.progressionRevision,
          nextJourney,
          serialization: lockProof,
        });

        const committedJourney = cloneValue(commit?.record?.journey || null);
        if (!committedJourney) {
          fail(
            "JOURNEY_CREATOR_TRUTH_PROJECTION_COMMIT_FAILED",
            "Creator-truth projection could not verify committed Journey Authority reality."
          );
        }
        if ((committedJourney?.progression?.revision ?? null) !== resolved.progressionRevision) {
          fail(
            "JOURNEY_CREATOR_TRUTH_PROJECTION_REVISION_VIOLATION",
            "Creator-truth projection changed Journey progression revision."
          );
        }
        if (getProjectionRevision(committedJourney) !== authorityRevision) {
          fail(
            "JOURNEY_CREATOR_TRUTH_PROJECTION_VERIFICATION_FAILED",
            "Creator-truth projection could not verify committed creator-authority revision."
          );
        }

        return Object.freeze({
          status: commit.status,
          operationId: projectionOperationId(pid, authorityRevision),
          projectId: pid,
          projectJourney: committedJourney,
          progressionRevision: commit.progressionRevision,
          authorityGeneration: commit.authorityGeneration,
          creatorAuthorityRevision: authorityRevision,
          authorityCommitted: true,
          serialization: cloneValue(lockProof),
        });
      },
    });
  }

  return Object.freeze({
    version: JOURNEY_CREATOR_TRUTH_PROJECTION_EXECUTION_VERSION,
    createOperationId: projectionOperationId,
    execute,
  });
}

export {
  JOURNEY_CREATOR_TRUTH_PROJECTION_EXECUTION_VERSION,
  positionSignature,
  projectionOperationId,
  createJourneyCreatorTruthProjectionExecutionRuntime,
};

export default createJourneyCreatorTruthProjectionExecutionRuntime;

import createCreatorMemory, {
  PROJECT_STATUSES,
  MEMORY_SOURCES,
  MEMORY_CERTAINTY,
} from "./CreatorMemory.js";
import createCreatorJourneyEngine from "./CreatorJourneyEngine.js";
import createMovieJourneyIntelligenceBridge from "./MovieJourneyIntelligenceBridge.js";
import createJourneyRecommendationEnvelope from "./JourneyRecommendationEnvelope.js";
import certifyJourneyRecommendationResume from "./JourneyRecommendationResumeRecovery.js";
import createJourneyAuthorityReadFacade from "./JourneyAuthorityReadFacade.js";
import { withMovieProjectIdentity } from "./MovieMentorProjectIdentity.js";
import { withMovieMentorMemoryWriteAuthority, MOVIE_MENTOR_SHARED_MEMORY_WRITE_COORDINATION } from "./MovieMentorMemoryWriteAuthority.js";

const MOVIE_MENTOR_STUDIO_IDENTITY_RUNTIME_VERSION = "1.10.0";
const RECOMMENDATION_REFERENCE_DOMAIN = "iband.movie-mentor.journey-recommendation-reference";
const RECOMMENDATION_REFERENCE_SCHEMA = 2;
const DURABLE_SETTLEMENT_LOCK_NAME = "iband.movie-mentor.creator-memory-settlement";

function clean(value) { return typeof value === "string" ? value.trim() : ""; }
function clone(value) { if (value === undefined) return undefined; try { return JSON.parse(JSON.stringify(value)); } catch { return value; } }
function safeRevision(value) { const number = Number(value); return Number.isSafeInteger(number) && number >= 0 ? number : null; }
function effectiveProgressionRevision(projectJourney) { const revision = safeRevision(projectJourney?.progression?.revision); return revision === null && (projectJourney?.progression === undefined || projectJourney?.progression === null) ? 0 : revision; }
function sameSemanticValue(a, b) {
  try { return JSON.stringify(a ?? null) === JSON.stringify(b ?? null); } catch { return a === b; }
}
function recommendationNextStep(planningEvidence = {}) {
  const action = planningEvidence?.semanticDirection?.nextAction;
  return clean(action?.label) || clean(action?.text) || clean(action?.description) || clean(planningEvidence?.recommendation?.recommendedTaskId) || clean(planningEvidence?.recommendation?.recommendedStageId) || null;
}

function buildRecommendationReferenceEvidence({ projectId, creatorSessionId, projectJourney, planningEvidence, turnRevision = null } = {}) {
  const pid = clean(projectId);
  const recommendation = planningEvidence?.recommendation;
  if (!pid || !projectJourney || !planningEvidence || typeof planningEvidence !== "object" || !recommendation || typeof recommendation !== "object") return null;
  if (planningEvidence?.clarification?.required === true || planningEvidence.authority !== "advisory-only" || planningEvidence.creatorConfirmed !== false || planningEvidence.mayCreateCanon !== false || planningEvidence.mayAdvanceJourney !== false) return null;

  const canonicalEnvelope = createJourneyRecommendationEnvelope({
    projectId: pid,
    projectJourney,
    planningEvidence,
  });
  if (!canonicalEnvelope) return null;

  const recommendedStageId = clean(recommendation.recommendedStageId) || null;
  const recommendedTaskId = clean(recommendation.recommendedTaskId) || null;
  const recommendedNextStep = recommendationNextStep(planningEvidence);
  const revision = safeRevision(turnRevision ?? planningEvidence?.provenance?.authorityRevision ?? planningEvidence?.provenance?.turnRevision);

  return {
    domain: RECOMMENDATION_REFERENCE_DOMAIN,
    schema: RECOMMENDATION_REFERENCE_SCHEMA,
    recommendationId: canonicalEnvelope.recommendationId,
    recommendationFingerprint: canonicalEnvelope.fingerprint,
    projectId: pid,
    creatorSessionId: clean(creatorSessionId) || null,
    authority: "mentor-advisory",
    creatorConfirmed: false,
    mayCreateCanon: false,
    mayAdvanceJourney: false,
    recommendation: {
      recommendedStageId,
      recommendedTaskId,
      recommendedNextStep,
      explanation: null,
      alternatives: clone(recommendation.alternatives || []),
      reasonCodes: clone(recommendation.reasonCodes || []),
      confidence: Number.isFinite(Number(recommendation.confidence)) ? Number(recommendation.confidence) : null,
    },
    issuedAgainst: clone(canonicalEnvelope.issuedAgainst),
    target: clone(canonicalEnvelope.target),
    planning: clone(canonicalEnvelope.planning),
    provenance: {
      turnRevision: revision,
      planningContractVersion: clean(planningEvidence.contractVersion) || null,
      bridgeVersion: clean(planningEvidence?.provenance?.bridgeVersion) || null,
      sourceEvidence: clone(planningEvidence.provenance || null),
    },
    lifecycle: {
      current: true,
      terminalReason: null,
      supersededByRecommendationId: null,
    },
    createdAt: new Date().toISOString(),
  };
}

function issueWorkingSessionId({ cryptoImpl = globalThis?.crypto } = {}) {
  if (!cryptoImpl || typeof cryptoImpl.randomUUID !== "function") {
    const error = new Error("Movie Mentor working-session identity requires crypto.randomUUID().");
    error.code = "MOVIE_MENTOR_WORKING_SESSION_CRYPTO_REQUIRED";
    throw error;
  }
  return `movie-session-${cryptoImpl.randomUUID()}`;
}
function isMovieMentorProject(project) { return Boolean(project && clean(project.id) && project.creatorType === "video" && project.metadata?.creatorMode === "ai-movie"); }
function conversationBelongsToProject(conversation, projectId) {
  const pid = clean(projectId);
  if (!pid || !conversation) return false;
  const related = Array.isArray(conversation.relatedProjectIds) ? conversation.relatedProjectIds.map(clean) : [];
  return related.includes(pid) || clean(conversation.metadata?.projectId) === pid;
}
function conversationToMessages(conversation) {
  const messages = [];
  const creatorText = clean(conversation?.creatorMessage);
  const mentorText = clean(conversation?.mentorResponse);
  const creatorTurnId = clean(conversation?.metadata?.creatorTurnId);
  const baseId = clean(conversation?.id) || `conversation-${Date.now()}`;
  if (creatorText) messages.push({ id: `${baseId}:creator`, role: "creator", type: "text", behaviour: "discuss", text: creatorText, createdAt: conversation?.createdAt || null, metadata: { restoredFromConversationId: baseId } });
  if (mentorText) messages.push({ id: `${baseId}:mentor`, role: "mentor", type: "text", behaviour: "discuss", text: mentorText, createdAt: conversation?.updatedAt || conversation?.createdAt || null, metadata: { restoredFromConversationId: baseId, ...(creatorTurnId ? { backendMetadata: { creatorTurnId } } : {}) } });
  return messages;
}

function createMovieMentorStudioIdentityRuntime({
  memory = createCreatorMemory(),
  cryptoImpl = globalThis?.crypto,
  journeyAuthorityReadFacade = createJourneyAuthorityReadFacade(),
  settlementLockManager = globalThis?.navigator?.locks,
} = {}) {
  const creatorSessionId = issueWorkingSessionId({ cryptoImpl });
  const pendingCreatorMessageByProject = new Map();
  const recommendationJourneyEngine = createCreatorJourneyEngine();
  const recommendationJourneyBridge = createMovieJourneyIntelligenceBridge({ journeyEngine: recommendationJourneyEngine });

  function getActiveMemoryProject() {
    const project = memory.getActiveProject?.() || null;
    return isMovieMentorProject(project) ? project : null;
  }

  function getPreferredJourney(projectId, { fallbackJourney = null } = {}) {
    const pid = clean(projectId);
    if (!pid) return null;
    const project = typeof memory.getPersistedProject === "function"
      ? memory.getPersistedProject(pid)
      : memory.getProject?.(pid) || null;
    if (!isMovieMentorProject(project)) return null;
    return journeyAuthorityReadFacade.readPreferred({
      project,
      projectedJourney: project?.metadata?.projectJourney || fallbackJourney || null,
    });
  }

  function getActiveProject() {
    const project = getActiveMemoryProject();
    if (!project) return null;
    const preferredJourney = getPreferredJourney(project.id, {
      fallbackJourney: project?.metadata?.projectJourney || null,
    });
    const preferredProjectJourney = preferredJourney?.projectJourney || project?.metadata?.projectJourney || null;
    return {
      ...clone(project),
      metadata: {
        ...(clone(project.metadata) || {}),
        projectJourney: clone(preferredProjectJourney),
      },
    };
  }

  function ensureProject({ projectJourney = null, title = "Untitled Movie" } = {}) {
    // The legacy synchronous path cannot acquire the shared recovery lock.
    // All Studio project creation must use ensureProjectWithSharedAuthority.
    const error = new Error("Legacy synchronous Studio project creation requires shared write authority.");
    error.code = "MOVIE_MENTOR_LEGACY_PROJECT_WRITE_DENIED";
    throw error;
  }

  async function ensureProjectWithSharedAuthority({ projectJourney = null, title = "Untitled Movie", locks = settlementLockManager } = {}) {
    if (typeof memory.replaceStateWithSharedAuthority !== "function") {
      return Object.freeze({ acquired: false, reason: "coordinated-memory-unavailable" });
    }
    const cleanTitle = clean(title);
    if (!cleanTitle) return Object.freeze({ acquired: false, reason: "project-title-unavailable" });
    return memory.replaceStateWithSharedAuthority({
      locks,
      transform: state => {
        const active = (state.projects || []).find(project =>
          project?.id === state.journey?.activeProjectId && isMovieMentorProject(project));
        if (active) return state;
        const timestamp = new Date().toISOString();
        const project = withMovieProjectIdentity({
          type: "project",
          title: cleanTitle,
          description: "",
          creatorType: "video",
          status: PROJECT_STATUSES.CREATING,
          relatedIdeaIds: [],
          tags: [],
          metadata: {
            creatorMode: "ai-movie",
            creatorModeLabel: "AI Movie Making",
            projectJourney,
            createdFrom: "CreatorWorkspace",
          },
          createdAt: timestamp,
          updatedAt: timestamp,
          publishedAt: null,
          completedAt: null,
        }, { cryptoImpl });
        state.projects = [...(state.projects || []), project];
        state.journey = { ...(state.journey || {}), activeProjectId: project.id };
        return state;
      },
    });
  }

  async function persistJourneyWithSharedAuthority(projectId, projectJourney, { locks = settlementLockManager } = {}) {
    const pid = clean(projectId);
    if (!pid || !projectJourney || typeof memory.replaceStateWithSharedAuthority !== "function") {
      return Object.freeze({ acquired: false, reason: "journey-or-coordinated-memory-unavailable" });
    }
    return memory.replaceStateWithSharedAuthority({
      locks,
      transform: state => {
        const index = (state.projects || []).findIndex(project => project?.id === pid && isMovieMentorProject(project));
        if (index < 0) throw new Error("Coordinated Journey project is missing.");
        const project = state.projects[index];
        const currentRevision = effectiveProgressionRevision(project?.metadata?.projectJourney);
        const proposedRevision = effectiveProgressionRevision(projectJourney);
        if (currentRevision === null || proposedRevision === null || currentRevision !== proposedRevision) {
          const error = new Error("Coordinated Journey progression changed before persistence.");
          error.code = "MOVIE_MENTOR_JOURNEY_PROGRESSION_STALE";
          throw error;
        }
        const nextProject = {
          ...project,
          updatedAt: new Date().toISOString(),
          metadata: {
            ...(project.metadata || {}),
            creatorMode: "ai-movie",
            creatorModeLabel: project.metadata?.creatorModeLabel || "AI Movie Making",
            projectJourney: clone(projectJourney),
          },
        };
        state.projects[index] = nextProject;
        return state;
      },
    });
  }

  function persistJourney(projectId, projectJourney, { expectedProgressionRevision = null } = {}) {
    const project = memory.getProject?.(projectId);
    if (!project) return null;

    // Once Journey Authority exists, callers may receive its canonical Journey via
    // getActiveProject(). Re-persisting that identical Journey through Creator Memory
    // would only perform a stale whole-memory projection write. Treat that redundant
    // mirror request as a no-op; authority remains the source of truth.
    const preferred = getPreferredJourney(projectId, { fallbackJourney: projectJourney });
    if (preferred?.status === "authority" && sameSemanticValue(preferred.projectJourney, projectJourney)) {
      return clone(project);
    }

    if (expectedProgressionRevision !== null && expectedProgressionRevision !== undefined) {
      const expected = safeRevision(expectedProgressionRevision);
      const current = effectiveProgressionRevision(project?.metadata?.projectJourney);
      if (expected === null) {
        const error = new Error("Journey persistence requires a valid expected progression revision.");
        error.code = "MOVIE_MENTOR_JOURNEY_EXPECTED_REVISION_INVALID";
        throw error;
      }
      if (current === null) {
        const error = new Error("Persisted Journey progression metadata is malformed.");
        error.code = "MOVIE_MENTOR_JOURNEY_PROGRESSION_RECOVERY_REQUIRED";
        throw error;
      }
      if (current !== expected) {
        const error = new Error("Persisted Journey changed before this progression operation could commit.");
        error.code = "MOVIE_MENTOR_JOURNEY_PROGRESSION_STALE";
        error.expectedProgressionRevision = expected;
        error.currentProgressionRevision = current;
        throw error;
      }
    }
    const updated = memory.updateProject(projectId, {
      metadata: {
        ...(project.metadata || {}),
        creatorMode: "ai-movie",
        creatorModeLabel: project.metadata?.creatorModeLabel || "AI Movie Making",
        projectJourney,
      },
    });
    if (!updated) {
      const error = new Error("Movie Mentor Journey persistence failed.");
      error.code = "MOVIE_MENTOR_JOURNEY_PERSIST_FAILED";
      throw error;
    }
    return updated;
  }

  function getProjectConversationMessages(projectId, { limit = 40 } = {}) {
    const pid = clean(projectId);
    if (!pid) return [];
    const conversations = (memory.getRecentConversations?.(Math.max(limit, 1) * 2) || [])
      .filter((conversation) => conversationBelongsToProject(conversation, pid))
      .slice(0, limit)
      .reverse();
    return conversations.flatMap(conversationToMessages);
  }

  function getProjectHandoff(projectId) {
    const pid = clean(projectId);
    return pid ? memory.getLatestSessionHandoff?.(pid) || null : null;
  }

  function retireSupersededRecommendationReferences(projectId, replacementEvidence) {
    const pid = clean(projectId);
    const replacementId = clean(replacementEvidence?.recommendationId);
    if (!pid || !replacementId) return [];
    const state = memory.getState?.();
    if (!state || !Array.isArray(state.projectMemories)) return [];
    const retired = [];
    const timestamp = new Date().toISOString();
    state.projectMemories = state.projectMemories.map((entry) => {
      const reference = entry?.metadata?.recommendationReference;
      if (!reference || reference.domain !== RECOMMENDATION_REFERENCE_DOMAIN || clean(reference.projectId) !== pid || reference.lifecycle?.current !== true || clean(reference.recommendationId) === replacementId) return entry;
      const updatedReference = clone(reference);
      updatedReference.lifecycle = {
        current: false,
        terminalReason: "superseded",
        supersededByRecommendationId: replacementId,
        supersededAt: timestamp,
      };
      retired.push(updatedReference.recommendationId);
      return { ...entry, updatedAt: timestamp, metadata: { ...(entry.metadata || {}), recommendationReference: updatedReference } };
    });
    if (retired.length) memory.replaceState?.(state);
    return retired;
  }

  function getCurrentRecommendationReferences(projectId) {
    const pid = clean(projectId);
    if (!pid) return [];
    return (memory.getProjectMemories?.({ projectId: pid }) || []).filter((entry) => {
      const reference = entry?.metadata?.recommendationReference;
      return reference?.domain === RECOMMENDATION_REFERENCE_DOMAIN && clean(reference.projectId) === pid && reference.lifecycle?.current === true;
    });
  }

  function recordRecommendationReference(projectId, planningEvidence, { turnRevision = null, projectJourney = null } = {}) {
    const evidence = buildRecommendationReferenceEvidence({
      projectId,
      creatorSessionId,
      projectJourney,
      planningEvidence,
      turnRevision,
    });
    if (!evidence) return null;
    const retiredRecommendationIds = retireSupersededRecommendationReferences(evidence.projectId, evidence);
    const saved = memory.saveProjectMemory?.({
      projectId: evidence.projectId,
      memoryKey: `journey-recommendation:${evidence.recommendationId}`,
      content: evidence.recommendation.recommendedNextStep || "Movie Mentor Journey recommendation",
      source: MEMORY_SOURCES.MENTOR,
      certainty: MEMORY_CERTAINTY.OBSERVED,
      confidence: evidence.recommendation.confidence ?? 1,
      metadata: {
        projectId: evidence.projectId,
        creatorSessionId,
        source: "movie-mentor-journey-recommendation",
        recommendationReference: clone(evidence),
      },
    }) || null;
    if (!saved) return null;
    return { ...saved, retiredRecommendationIds };
  }

  function recordRecommendationForMessage(pid, message, projectJourney) {
    if (message?.metadata?.liveBackendTurn !== true || !projectJourney) return null;
    const postCommitCreatorAuthority = clone(message?.metadata?.postCommitCreatorAuthority || message?.metadata?.backendMetadata?.postCommitCreatorAuthority || null);
    const planning = recommendationJourneyBridge.consumeTurnForJourneyPlanning(projectJourney, {
      status: message?.metadata?.backendMetadata?.status || null,
      turnContextProof: clone(message?.metadata?.turnContextProof || null),
      postCommitCreatorAuthority,
      semanticIntelligence: clone(message?.metadata?.semanticIntelligence || null),
      specialistResult: clone(message?.metadata?.specialistResult || null),
      continuityConsequenceEnvelope: clone(message?.metadata?.continuityConsequenceEnvelope || null),
      authority: clone(message?.metadata?.authority || null),
      mayAdvanceJourney: message?.metadata?.mayAdvanceJourney === true,
    }, {
      source: "MovieMentorStudioIdentityRuntime",
      turnRevision: message?.metadata?.turnContextProof?.revision ?? null,
    });
    const recommendationRevision = planning?.journeyPlanningEvidence?.provenance?.authorityRevision ?? message?.metadata?.turnContextProof?.revision ?? null;
    return recordRecommendationReference(pid, planning?.journeyPlanningEvidence || null, {
      turnRevision: recommendationRevision,
      projectJourney,
    });
  }

  function buildConversationInput(pid, creatorMessage, message, projectJourney) {
    const text = clean(message?.text);
    const creatorTurnId = clean(message?.metadata?.backendMetadata?.creatorTurnId);
    return {
      summary: creatorMessage ? `Creator: ${clean(creatorMessage.text)}\nMentor: ${text}` : `Mentor: ${text}`,
      creatorMessage: clean(creatorMessage?.text),
      mentorResponse: text,
      creatorStage: clean(projectJourney?.currentStageId || projectJourney?.stageId) || null,
      relatedProjectIds: [pid],
      metadata: { projectId: pid, creatorSessionId, source: "movie-mentor-conversation", ...(creatorTurnId ? { creatorTurnId } : {}) },
    };
  }

  function saveConversationHandoff(pid, conversation, projectJourney) {
    const canonicalCreatorMessage = clean(conversation?.creatorMessage);
    const canonicalMentorResponse = clean(conversation?.mentorResponse);
    return memory.saveSessionHandoff?.({
      projectId: pid,
      sessionId: creatorSessionId,
      title: "Movie Mentor conversation continuation",
      content: canonicalCreatorMessage ? `Continue after the creator said: ${canonicalCreatorMessage}` : "Continue from the latest Movie Mentor response.",
      value: {
        conversationId: conversation?.id || null,
        lastCreatorMessage: canonicalCreatorMessage || null,
        lastMentorResponse: canonicalMentorResponse || null,
        projectJourney: clone(projectJourney),
      },
      metadata: { projectId: pid, creatorSessionId, conversationId: conversation?.id || null, source: "movie-mentor-conversation" },
    }) || null;
  }

  function retirePendingCreatorMessage(pid, creatorMessage) {
    if (creatorMessage && pendingCreatorMessageByProject.get(pid) === creatorMessage) {
      pendingCreatorMessageByProject.delete(pid);
    }
  }

  function recordPendingCreatorMessage(projectId, message) {
    const pid = clean(projectId);
    if (!pid || clean(message?.role) !== "creator" || !clean(message?.text)) return null;
    pendingCreatorMessageByProject.set(pid, clone(message));
    return { status: "creator-message-pending", projectId: pid };
  }

  function recordConversationMessage(projectId, message, { projectJourney = null } = {}) {
    const pid = clean(projectId);
    const role = clean(message?.role);
    const text = clean(message?.text);
    if (!pid || !text || !["creator", "mentor"].includes(role)) return null;
    if (role === "creator") return recordPendingCreatorMessage(pid, message);

    // Legacy synchronous mentor persistence cannot acquire the asynchronous
    // recovery lock. Keep the pending creator turn intact for a safe retry.
    const error = new Error("Legacy synchronous mentor persistence requires shared write authority.");
    error.code = "MOVIE_MENTOR_LEGACY_MENTOR_WRITE_DENIED";
    throw error;
  }

  async function withDurableSettlementAuthority(operation) {
    if (!settlementLockManager || typeof settlementLockManager.request !== "function") {
      const error = new Error("Movie Mentor durable settlement authority requires a cross-context lock manager.");
      error.code = "MOVIE_MENTOR_DURABLE_SETTLEMENT_AUTHORITY_REQUIRED";
      throw error;
    }
    // Recovery and ordinary settlement must not write the same durable blob
    // concurrently. Acquire shared recovery authority first, then retain the
    // existing settlement lock for creator-turn idempotency.
    const shared = await withMovieMentorMemoryWriteAuthority({
      locks: settlementLockManager,
      waitForAuthority: true,
      operation: () => settlementLockManager.request(DURABLE_SETTLEMENT_LOCK_NAME, operation),
    });
    if (!shared.acquired) {
      const error = new Error("Movie Mentor settlement could not acquire shared recovery write authority.");
      error.code = "MOVIE_MENTOR_SHARED_WRITE_AUTHORITY_REQUIRED";
      if (shared.cause !== undefined) error.cause = shared.cause;
      throw error;
    }
    return shared.value;
  }

  async function settleConversationMessage(projectId, message, { projectJourney = null } = {}) {
    const pid = clean(projectId);
    const role = clean(message?.role);
    const text = clean(message?.text);
    if (!pid || role !== "mentor" || !text) return null;
    const creatorTurnId = clean(message?.metadata?.backendMetadata?.creatorTurnId);
    if (!creatorTurnId) {
      // Without a durable turn identity, settlement cannot prove exactly-once
      // recovery or safe retry. Refuse instead of bypassing shared authority.
      const error = new Error("Movie Mentor durable settlement requires a creator turn identity.");
      error.code = "MOVIE_MENTOR_DURABLE_SETTLEMENT_TURN_ID_REQUIRED";
      throw error;
    }
    const creatorMessage = pendingCreatorMessageByProject.get(pid) || null;

    return withDurableSettlementAuthority(() => {
      if (typeof memory.convergeConversationSettlement !== "function") {
        const error = new Error("Creator Memory does not expose durable settlement convergence.");
        error.code = "MOVIE_MENTOR_DURABLE_SETTLEMENT_CONVERGENCE_REQUIRED";
        throw error;
      }

      const settlement = memory.convergeConversationSettlement(
        buildConversationInput(pid, creatorMessage, message, projectJourney)
      );
      const conversation = settlement?.conversation || null;
      if (!conversation?.id) {
        const error = new Error("Movie Mentor durable conversation settlement failed.");
        error.code = "MOVIE_MENTOR_DURABLE_SETTLEMENT_FAILED";
        throw error;
      }

      const handoff = saveConversationHandoff(pid, conversation, projectJourney);
      if (!handoff?.id) {
        const error = new Error("Movie Mentor durable conversation handoff failed.");
        error.code = "MOVIE_MENTOR_DURABLE_HANDOFF_FAILED";
        throw error;
      }

      const recommendationReference = recordRecommendationForMessage(pid, message, projectJourney);
      retirePendingCreatorMessage(pid, creatorMessage);
      return {
        status: "conversation-persisted",
        settlementStatus: settlement?.status || null,
        projectId: pid,
        conversation,
        handoff,
        recommendationReference,
      };
    });
  }

  function resumeProjectConversation(projectId) {
    const pid = clean(projectId);
    if (!pid) return { messages: [], handoff: null };
    const handoff = getProjectHandoff(pid);
    const messages = getProjectConversationMessages(pid);
    // Reading a handoff must not mutate durable Creator Memory. A resumed
    // marker, if needed, requires a separate shared-authority transaction.
    return { messages, handoff };
  }

  function blockedDivergentProjectionRecovery(projectId, preferredJourney) {
    return Object.freeze({
      status: "authority-projection-divergence",
      projectId,
      recommendationActionsBlocked: true,
      recoveryResult: null,
      recoveryAttempts: 0,
      errorCode: "JOURNEY_RECOMMENDATION_LEGACY_PROJECTION_UNCERTIFIED",
      errorMessage: "Legacy recommendation recovery is blocked because Journey Authority and Creator Memory projection disagree.",
      journeySource: preferredJourney?.source || null,
      projectionStatus: preferredJourney?.projectionStatus || null,
    });
  }

  async function recoverResumeRecommendationsWithSharedAuthority({ locks = settlementLockManager } = {}) {
    const active = getActiveMemoryProject();
    if (!active) return Object.freeze({ acquired: false, reason: "no-active-project" });
    if (typeof memory.runRecoveryWithSharedAuthority !== "function") {
      return Object.freeze({ acquired: false, reason: "coordinated-recovery-unavailable" });
    }
    const preferred = getPreferredJourney(active.id);
    if (preferred?.status === "authority" && preferred?.projectionStatus !== "in-sync") {
      return Object.freeze({
        acquired: false,
        reason: "authority-projection-divergence",
        recommendationRecovery: blockedDivergentProjectionRecovery(active.id, preferred),
      });
    }
    return memory.runRecoveryWithSharedAuthority({
      locks,
      operation: fresh => certifyJourneyRecommendationResume({
        identityRuntime: { memory: fresh },
        projectId: active.id,
      }),
    });
  }

  function getResumeSnapshot() {
    const initiallyActiveProject = getActiveMemoryProject();
    if (!initiallyActiveProject) return null;

    const preferredBeforeRecovery = getPreferredJourney(initiallyActiveProject.id);
    const authorityProjectionDiverged = preferredBeforeRecovery?.status === "authority" &&
      preferredBeforeRecovery?.projectionStatus !== "in-sync";

    // This synchronous method is called during React render. Never perform
    // lifecycle repair or proof-conflict quarantine from a render-time read.
    // Recommendation actions remain blocked until a separate shared-authority
    // recovery transaction has certified the durable state.
    const recommendationRecovery = authorityProjectionDiverged
      ? blockedDivergentProjectionRecovery(initiallyActiveProject.id, preferredBeforeRecovery)
      : Object.freeze({
          status: "shared-authority-recovery-required",
          projectId: initiallyActiveProject.id,
          recommendationActionsBlocked: true,
          recoveryResult: null,
          recoveryAttempts: 0,
          errorCode: "JOURNEY_RECOMMENDATION_SHARED_AUTHORITY_REQUIRED",
        });

    // Recovery may change only recommendation metadata. Re-read both Creator Memory
    // and Journey Authority afterwards so the snapshot cannot expose pre-repair or
    // stale projected Journey reality.
    const project = typeof memory.getPersistedProject === "function"
      ? memory.getPersistedProject(initiallyActiveProject.id)
      : memory.getProject?.(initiallyActiveProject.id) || null;
    if (!isMovieMentorProject(project)) return null;
    const conversation = resumeProjectConversation(project.id);
    const preferredAfterRecovery = getPreferredJourney(project.id, {
      fallbackJourney: conversation.handoff?.value?.projectJourney || null,
    });
    const authorityStillDiverged = preferredAfterRecovery?.status === "authority" &&
      preferredAfterRecovery?.projectionStatus !== "in-sync";
    const recommendationActionsBlocked = recommendationRecovery?.recommendationActionsBlocked === true || authorityStillDiverged;

    return {
      project,
      projectId: project.id,
      creatorSessionId,
      projectJourney: preferredAfterRecovery?.projectJourney || conversation.handoff?.value?.projectJourney || null,
      journeyAuthorityRead: clone(preferredAfterRecovery),
      conversationMessages: conversation.messages,
      sessionHandoff: conversation.handoff,
      currentRecommendationReferences: recommendationActionsBlocked ? [] : getCurrentRecommendationReferences(project.id),
      recommendationRecovery,
      recommendationActionsBlocked,
    };
  }

  return {
    version: MOVIE_MENTOR_STUDIO_IDENTITY_RUNTIME_VERSION,
    memory,
    creatorSessionId,
    getActiveProject,
    getPreferredJourney,
    ensureProject,
    ensureProjectWithSharedAuthority,
    persistJourney,
    persistJourneyWithSharedAuthority,
    getProjectConversationMessages,
    getProjectHandoff,
    getCurrentRecommendationReferences,
    retireSupersededRecommendationReferences,
    recordRecommendationReference,
    recordConversationMessage,
    recordPendingCreatorMessage,
    settleConversationMessage,
    resumeProjectConversation,
    recoverResumeRecommendationsWithSharedAuthority,
    getResumeSnapshot,
  };
}

export {
  MOVIE_MENTOR_STUDIO_IDENTITY_RUNTIME_VERSION,
  RECOMMENDATION_REFERENCE_DOMAIN,
  RECOMMENDATION_REFERENCE_SCHEMA,
  DURABLE_SETTLEMENT_LOCK_NAME,
  buildRecommendationReferenceEvidence,
  issueWorkingSessionId,
  isMovieMentorProject,
  conversationBelongsToProject,
  conversationToMessages,
  createMovieMentorStudioIdentityRuntime,
};

export default createMovieMentorStudioIdentityRuntime;

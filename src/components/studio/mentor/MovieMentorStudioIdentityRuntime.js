import createCreatorMemory, {
  PROJECT_STATUSES,
  MEMORY_SOURCES,
  MEMORY_CERTAINTY,
} from "./CreatorMemory.js";
import createCreatorJourneyEngine from "./CreatorJourneyEngine.js";
import createMovieJourneyIntelligenceBridge from "./MovieJourneyIntelligenceBridge.js";

const MOVIE_MENTOR_STUDIO_IDENTITY_RUNTIME_VERSION = "1.2.0";
const RECOMMENDATION_REFERENCE_DOMAIN = "iband.movie-mentor.journey-recommendation-reference";
const RECOMMENDATION_REFERENCE_SCHEMA = 1;

function clean(value) {
  return typeof value === "string" ? value.trim() : "";
}

function clone(value) {
  if (value === undefined) return undefined;
  try {
    return JSON.parse(JSON.stringify(value));
  } catch {
    return value;
  }
}

function safeRevision(value) {
  const number = Number(value);
  return Number.isSafeInteger(number) && number >= 0 ? number : null;
}

function recommendationNextStep(planningEvidence = {}) {
  const action = planningEvidence?.semanticDirection?.nextAction;
  return (
    clean(action?.label) ||
    clean(action?.text) ||
    clean(action?.description) ||
    clean(planningEvidence?.recommendation?.recommendedTaskId) ||
    clean(planningEvidence?.recommendation?.recommendedStageId) ||
    null
  );
}

function recommendationIdentityPart(value) {
  return clean(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "none";
}

function buildRecommendationReferenceEvidence({
  projectId,
  creatorSessionId,
  planningEvidence,
  turnRevision = null,
} = {}) {
  const pid = clean(projectId);
  const recommendation = planningEvidence?.recommendation;
  if (!pid || !planningEvidence || typeof planningEvidence !== "object") return null;
  if (!recommendation || typeof recommendation !== "object") return null;
  if (planningEvidence?.clarification?.required === true) return null;
  if (planningEvidence.authority !== "advisory-only") return null;
  if (planningEvidence.creatorConfirmed !== false) return null;
  if (planningEvidence.mayCreateCanon !== false) return null;
  if (planningEvidence.mayAdvanceJourney !== false) return null;

  const recommendedStageId = clean(recommendation.recommendedStageId) || null;
  const recommendedTaskId = clean(recommendation.recommendedTaskId) || null;
  const recommendedNextStep = recommendationNextStep(planningEvidence);
  if (!recommendedStageId && !recommendedTaskId && !recommendedNextStep) return null;

  const revision = safeRevision(turnRevision ?? planningEvidence?.provenance?.turnRevision);
  const recommendationId = [
    "journey-recommendation",
    recommendationIdentityPart(pid),
    revision === null ? "revision-unknown" : `revision-${revision}`,
    recommendationIdentityPart(recommendedStageId),
    recommendationIdentityPart(recommendedTaskId),
    recommendationIdentityPart(recommendedNextStep),
  ].join(":");

  return {
    domain: RECOMMENDATION_REFERENCE_DOMAIN,
    schema: RECOMMENDATION_REFERENCE_SCHEMA,
    recommendationId,
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
      confidence: Number.isFinite(Number(recommendation.confidence))
        ? Number(recommendation.confidence)
        : null,
    },
    provenance: {
      turnRevision: revision,
      planningContractVersion: clean(planningEvidence.contractVersion) || null,
      bridgeVersion: clean(planningEvidence?.provenance?.bridgeVersion) || null,
      sourceEvidence: clone(planningEvidence.provenance || null),
    },
    lifecycle: {
      current: true,
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

function isMovieMentorProject(project) {
  return Boolean(
    project &&
    clean(project.id) &&
    project.creatorType === "video" &&
    project.metadata?.creatorMode === "ai-movie"
  );
}

function conversationBelongsToProject(conversation, projectId) {
  const pid = clean(projectId);
  if (!pid || !conversation) return false;
  const related = Array.isArray(conversation.relatedProjectIds)
    ? conversation.relatedProjectIds.map(clean)
    : [];
  return related.includes(pid) || clean(conversation.metadata?.projectId) === pid;
}

function conversationToMessages(conversation) {
  const messages = [];
  const creatorText = clean(conversation?.creatorMessage);
  const mentorText = clean(conversation?.mentorResponse);
  const baseId = clean(conversation?.id) || `conversation-${Date.now()}`;
  if (creatorText) {
    messages.push({
      id: `${baseId}:creator`,
      role: "creator",
      type: "text",
      behaviour: "discuss",
      text: creatorText,
      createdAt: conversation?.createdAt || null,
      metadata: { restoredFromConversationId: baseId },
    });
  }
  if (mentorText) {
    messages.push({
      id: `${baseId}:mentor`,
      role: "mentor",
      type: "text",
      behaviour: "discuss",
      text: mentorText,
      createdAt: conversation?.updatedAt || conversation?.createdAt || null,
      metadata: { restoredFromConversationId: baseId },
    });
  }
  return messages;
}

function createMovieMentorStudioIdentityRuntime({
  memory = createCreatorMemory(),
  cryptoImpl = globalThis?.crypto,
} = {}) {
  const creatorSessionId = issueWorkingSessionId({ cryptoImpl });
  const pendingCreatorMessageByProject = new Map();
  const recommendationJourneyEngine = createCreatorJourneyEngine();
  const recommendationJourneyBridge = createMovieJourneyIntelligenceBridge({
    journeyEngine: recommendationJourneyEngine,
  });

  function getActiveProject() {
    const project = memory.getActiveProject?.() || null;
    return isMovieMentorProject(project) ? project : null;
  }

  function ensureProject({ projectJourney = null, title = "Untitled Movie" } = {}) {
    const existing = getActiveProject();
    if (existing) return existing;
    return memory.saveProject({
      title,
      creatorType: "video",
      status: PROJECT_STATUSES.CREATING,
      metadata: {
        creatorMode: "ai-movie",
        creatorModeLabel: "AI Movie Making",
        projectJourney,
        createdFrom: "CreatorWorkspace",
      },
    });
  }

  function persistJourney(projectId, projectJourney) {
    const project = memory.getProject?.(projectId);
    if (!project) return null;
    return memory.updateProject(projectId, {
      metadata: {
        ...(project.metadata || {}),
        creatorMode: "ai-movie",
        creatorModeLabel: project.metadata?.creatorModeLabel || "AI Movie Making",
        projectJourney,
      },
    });
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

  function recordRecommendationReference(projectId, planningEvidence, { turnRevision = null } = {}) {
    const evidence = buildRecommendationReferenceEvidence({
      projectId,
      creatorSessionId,
      planningEvidence,
      turnRevision,
    });
    if (!evidence) return null;

    return memory.saveProjectMemory?.({
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
  }

  function recordConversationMessage(projectId, message, { projectJourney = null } = {}) {
    const pid = clean(projectId);
    const role = clean(message?.role);
    const text = clean(message?.text);
    if (!pid || !text || !["creator", "mentor"].includes(role)) return null;

    if (role === "creator") {
      pendingCreatorMessageByProject.set(pid, clone(message));
      return { status: "creator-message-pending", projectId: pid };
    }

    const creatorMessage = pendingCreatorMessageByProject.get(pid) || null;
    pendingCreatorMessageByProject.delete(pid);
    const conversation = memory.rememberConversation?.({
      summary: creatorMessage
        ? `Creator: ${clean(creatorMessage.text)}\nMentor: ${text}`
        : `Mentor: ${text}`,
      creatorMessage: clean(creatorMessage?.text),
      mentorResponse: text,
      creatorStage: clean(projectJourney?.currentStageId || projectJourney?.stageId) || null,
      relatedProjectIds: [pid],
      metadata: {
        projectId: pid,
        creatorSessionId,
        source: "movie-mentor-conversation",
      },
    }) || null;

    const handoff = memory.saveSessionHandoff?.({
      projectId: pid,
      sessionId: creatorSessionId,
      title: "Movie Mentor conversation continuation",
      content: creatorMessage
        ? `Continue after the creator said: ${clean(creatorMessage.text)}`
        : "Continue from the latest Movie Mentor response.",
      value: {
        conversationId: conversation?.id || null,
        lastCreatorMessage: clean(creatorMessage?.text) || null,
        lastMentorResponse: text,
        projectJourney: clone(projectJourney),
      },
      metadata: {
        projectId: pid,
        creatorSessionId,
        conversationId: conversation?.id || null,
        source: "movie-mentor-conversation",
      },
    }) || null;

    let recommendationReference = null;
    if (message?.metadata?.liveBackendTurn === true && projectJourney) {
      const planning = recommendationJourneyBridge.consumeTurnForJourneyPlanning(
        projectJourney,
        {
          status: message?.metadata?.backendMetadata?.status || null,
          semanticIntelligence: clone(message?.metadata?.semanticIntelligence || null),
          specialistResult: clone(message?.metadata?.specialistResult || null),
          continuityConsequenceEnvelope: clone(message?.metadata?.continuityConsequenceEnvelope || null),
          authority: clone(message?.metadata?.authority || null),
          mayAdvanceJourney: message?.metadata?.mayAdvanceJourney === true,
        },
        {
          source: "MovieMentorStudioIdentityRuntime",
          turnRevision: message?.metadata?.turnContextProof?.revision ?? null,
        }
      );
      recommendationReference = recordRecommendationReference(
        pid,
        planning?.journeyPlanningEvidence || null,
        { turnRevision: message?.metadata?.turnContextProof?.revision ?? null }
      );
    }

    return {
      status: "conversation-persisted",
      projectId: pid,
      conversation,
      handoff,
      recommendationReference,
    };
  }

  function resumeProjectConversation(projectId) {
    const pid = clean(projectId);
    if (!pid) return { messages: [], handoff: null };
    const handoff = getProjectHandoff(pid);
    const messages = getProjectConversationMessages(pid);
    if (handoff?.id) memory.markSessionHandoffResumed?.(handoff.id);
    return { messages, handoff };
  }

  function getResumeSnapshot() {
    const project = getActiveProject();
    if (!project) return null;
    const conversation = resumeProjectConversation(project.id);
    return {
      project,
      projectId: project.id,
      creatorSessionId,
      projectJourney: project.metadata?.projectJourney || conversation.handoff?.value?.projectJourney || null,
      conversationMessages: conversation.messages,
      sessionHandoff: conversation.handoff,
    };
  }

  return {
    version: MOVIE_MENTOR_STUDIO_IDENTITY_RUNTIME_VERSION,
    memory,
    creatorSessionId,
    getActiveProject,
    ensureProject,
    persistJourney,
    getProjectConversationMessages,
    getProjectHandoff,
    recordRecommendationReference,
    recordConversationMessage,
    resumeProjectConversation,
    getResumeSnapshot,
  };
}

export {
  MOVIE_MENTOR_STUDIO_IDENTITY_RUNTIME_VERSION,
  RECOMMENDATION_REFERENCE_DOMAIN,
  RECOMMENDATION_REFERENCE_SCHEMA,
  buildRecommendationReferenceEvidence,
  issueWorkingSessionId,
  isMovieMentorProject,
  conversationBelongsToProject,
  conversationToMessages,
  createMovieMentorStudioIdentityRuntime,
};

export default createMovieMentorStudioIdentityRuntime;

import createCreatorMemory, { PROJECT_STATUSES } from "./CreatorMemory.js";

const MOVIE_MENTOR_STUDIO_IDENTITY_RUNTIME_VERSION = "1.1.0";

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

    return { status: "conversation-persisted", projectId: pid, conversation, handoff };
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
    recordConversationMessage,
    resumeProjectConversation,
    getResumeSnapshot,
  };
}

export {
  MOVIE_MENTOR_STUDIO_IDENTITY_RUNTIME_VERSION,
  issueWorkingSessionId,
  isMovieMentorProject,
  conversationBelongsToProject,
  conversationToMessages,
  createMovieMentorStudioIdentityRuntime,
};

export default createMovieMentorStudioIdentityRuntime;

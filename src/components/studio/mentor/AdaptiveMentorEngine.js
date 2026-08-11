/**
 * Adaptive Mentor Engine
 * ------------------------------------------------------------
 * The final behavioural orchestration layer for iBand's
 * AI Mentor — The Creator.
 *
 * This engine combines specialist plans from:
 *
 * - ConversationPlanner
 * - ReflectionEngine
 * - ProgressionEngine
 * - CreatorMemoryEngine
 * - CreatorMemory
 *
 * It does not generate the final Mentor response.
 *
 * It decides:
 * - How the Mentor should behave now.
 * - Whether to lead, follow, listen, reflect or wait.
 * - How much information should be provided.
 * - Whether another question should be asked.
 * - Whether memory should be captured or recalled.
 * - Whether memory instructions are authorised for execution.
 * - Whether project context should be restored.
 * - Whether a session handoff should be preserved.
 * - Whether a stored session handoff should restore continuity.
 * - Whether a forget request requires clarification or execution.
 * - Whether conversation should continue or move into action.
 * - Which specialist-engine decision takes priority.
 * - How future specialist-agent memory signals may influence
 *   behaviour without taking authority away from the creator.
 *
 * CreatorMemory.js remains the persistence authority.
 * CreatorMemoryEngine interprets and plans memory behaviour.
 * AdaptiveMentorEngine orchestrates that intelligence with the
 * other Mentor systems.
 *
 * Version 2.4 aligns Adaptive Mentor with the modern v2.3
 * Conversation, Reflection, Progression and Creator Memory stack:
 *
 * - Supports ProgressionEngine v2.3 yield-to-execution.
 * - Supports ProgressionEngine v2.3 yield-to-memory-action.
 * - Supports wait-for-memory-clarification.
 * - Supports preserve-handoff as a first-class progression state.
 * - Supports acknowledge-detour as a first-class progression state.
 * - Explicit creator direction remains dominant.
 * - Current project identity remains authoritative.
 * - Stored project continuity cannot cross project boundaries.
 * - Memory planning and memory execution authorisation are separated.
 * - Memory-control operations suspend unrelated creative progression.
 * - Forget clarification cannot accidentally execute persistence.
 * - CreatorMemory execution receives project-boundary preflight.
 * - Build, flow and high-momentum execution cannot be made verbose by
 *   remembered response preferences.
 * - Reflection may yield cleanly to execution without being reintroduced
 *   by Adaptive conflict resolution.
 * - Session handoffs can be planned, preserved and restored without
 *   claiming persistence before CreatorMemory confirms it.
 * - Specialist-agent signals remain advisory evidence.
 * - Persistence results preserve full, partial, failed and no-op states.
 *
 * Core philosophy:
 * - Protect the creator.
 * - Present behaviour leads.
 * - Long-term memory informs.
 * - Project truth is shared, scoped and revisable.
 * - Creator-confirmed truth outranks inference.
 * - Conversation exists in service of creation.
 * - Match the creator's rhythm before attempting to guide it.
 * - Meet first. Lead second.
 * - Never interrupt flow merely because more help is available.
 * - The creator remains the authority on their own experience.
 * - Specialist agents may inform the Mentor, but do not own truth.
 * - Planning does not equal permission to persist.
 * - Complexity belongs behind the conversation.
 */

import createConversationPlanner from "./ConversationPlanner";
import createReflectionEngine from "./ReflectionEngine";
import createProgressionEngine from "./ProgressionEngine";
import createCreatorMemoryEngine from "./CreatorMemoryEngine";

const ADAPTIVE_MENTOR_ENGINE_VERSION =
  "2.4.0";

const MENTOR_ROLES = Object.freeze({
  LISTENER: "listener",

  GUIDE: "guide",

  COLLABORATOR:
    "collaborator",

  TEACHER: "teacher",

  REFLECTOR: "reflector",

  CREATIVE_DIRECTOR:
    "creative-director",

  FACILITATOR:
    "facilitator",

  QUIET_COMPANION:
    "quiet-companion",
});

const LEADERSHIP_STANCES =
  Object.freeze({
    LEAD: "lead",

    FOLLOW: "follow",

    WALK_BESIDE:
      "walk-beside",

    HOLD_POSITION:
      "hold-position",

    HAND_BACK_CONTROL:
      "hand-back-control",
  });

const INTERVENTION_LEVELS =
  Object.freeze({
    NONE: "none",

    MINIMAL: "minimal",

    LIGHT: "light",

    MODERATE: "moderate",

    DEEP: "deep",
  });

const RESPONSE_DEPTHS =
  Object.freeze({
    SILENT: "silent",

    ONE_LINE: "one-line",

    SHORT: "short",

    MEDIUM: "medium",

    DETAILED: "detailed",
  });

const QUESTION_POLICIES =
  Object.freeze({
    NONE: "none",

    ONE_OPTIONAL:
      "one-optional",

    ONE_REQUIRED:
      "one-required",

    CREATOR_LED:
      "creator-led",
  });

const MEMORY_POLICIES =
  Object.freeze({
    DO_NOT_USE:
      "do-not-use",

    INFORM_SILENTLY:
      "inform-silently",

    CAPTURE_ONLY:
      "capture-only",

    RECALL_WITH_PERMISSION:
      "recall-with-permission",

    CAPTURE_AND_RECALL:
      "capture-and-recall",

    RESTORE_CONTEXT:
      "restore-context",

    PRESERVE_HANDOFF:
      "preserve-handoff",

    FORGET_ONLY:
      "forget-only",

    FORGET_REQUIRES_CLARIFICATION:
      "forget-requires-clarification",

    MEMORY_ACTION_ONLY:
      "memory-action-only",
  });

const MEMORY_EXECUTION_POLICIES =
  Object.freeze({
    BLOCK:
      "block",

    ALLOW_CAPTURE:
      "allow-capture",

    ALLOW_FORGET:
      "allow-forget",

    ALLOW_HANDOFF:
      "allow-handoff",

    ALLOW_MEMORY_ACTION:
      "allow-memory-action",

    ALLOW_ALL_PLANNED:
      "allow-all-planned",
  });

const ACTION_PRIORITIES =
  Object.freeze({
    SAFETY: 100,

    CREATOR_EXPLICIT_DIRECTION:
      95,

    MEMORY_FORGET:
      92,

    MEMORY_FORGET_CLARIFICATION:
      91,

    MEMORY_CONTROL:
      90,

    HOLD_SPACE: 85,

    PROTECT_FLOW: 80,

    RELEASE_PRESSURE: 75,

    RESTORE_PROJECT_CONTEXT:
      72,

    MOVE_TO_ACTION: 70,

    MEMORY_RECALL: 55,

    REFLECTION: 50,

    EXPLORATION: 40,

    LEARNING: 35,

    GENERAL_LISTENING: 20,
  });

const ADAPTIVE_ACTIONS =
  Object.freeze({
    WAIT: "wait",

    ACKNOWLEDGE_BRIEFLY:
      "acknowledge-briefly",

    LISTEN_AND_INVITE:
      "listen-and-invite",

    REFLECT_GENTLY:
      "reflect-gently",

    RELEASE_PRESSURE:
      "release-pressure",

    RESTORE_CONTEXT:
      "restore-context",

    RESTORE_PROJECT_CONTEXT:
      "restore-project-context",

    CAPTURE_AND_CONTINUE:
      "capture-and-continue",

    RECALL_WITH_PERMISSION:
      "recall-with-permission",

    CLARIFY_FORGET_REQUEST:
      "clarify-forget-request",

    APPLY_FORGET_REQUEST:
      "apply-forget-request",

    EXECUTE_MEMORY_ACTION:
      "execute-memory-action",

    ASK_ONE_QUESTION:
      "ask-one-question",

    OFFER_ONE_RECOMMENDATION:
      "offer-one-recommendation",

    TEACH_ONE_CONCEPT:
      "teach-one-concept",

    CONTINUE_BRAINSTORMING:
      "continue-brainstorming",

    MOVE_TO_CREATION:
      "move-to-creation",

    MOVE_TO_NEXT_TASK:
      "move-to-next-task",

    MOVE_TO_REFINEMENT:
      "move-to-refinement",

    MOVE_TO_PUBLISHING:
      "move-to-publishing",

    YIELD_TO_EXECUTION:
      "yield-to-execution",

    SAVE_AND_PAUSE:
      "save-and-pause",

    PRESERVE_SESSION_HANDOFF:
      "preserve-session-handoff",

    END_POSITIVELY:
      "end-positively",
  });

const ADAPTATION_SIGNALS =
  Object.freeze({
    BUILD_MODE:
      "build-mode",

    FLOW_MODE:
      "flow-mode",

    EXPLORATION_MODE:
      "exploration-mode",

    LEARNING_MODE:
      "learning-mode",

    REFLECTION_MODE:
      "reflection-mode",

    RECOVERY_MODE:
      "recovery-mode",

    INCUBATION_MODE:
      "incubation-mode",

    HIGH_MOMENTUM:
      "high-momentum",

    LOW_ENERGY:
      "low-energy",

    INFORMATION_OVERLOAD:
      "information-overload",

    GUIDANCE_REQUESTED:
      "guidance-requested",

    GUIDANCE_NOT_WANTED:
      "guidance-not-wanted",

    BRIEF_DETOUR:
      "brief-detour",

    DEFERRED_TOPIC:
      "deferred-topic",

    RECALL_AVAILABLE:
      "recall-available",

    PROJECT_MEMORY_AVAILABLE:
      "project-memory-available",

    PROJECT_CONTEXT_AVAILABLE:
      "project-context-available",

    SESSION_HANDOFF_AVAILABLE:
      "session-handoff-available",

    STORED_SESSION_HANDOFF_AVAILABLE:
      "stored-session-handoff-available",

    MEMORY_CAPTURE_AVAILABLE:
      "memory-capture-available",

    MEMORY_ACTION_PENDING:
      "memory-action-pending",

    CREATOR_MEMORY_CONNECTED:
      "creator-memory-connected",

    CREATOR_MEMORY_CONTEXT_AVAILABLE:
      "creator-memory-context-available",

    FORGET_REQUEST:
      "forget-request",

    FORGET_REQUIRES_CLARIFICATION:
      "forget-requires-clarification",

    SPECIALIST_MEMORY_SIGNAL:
      "specialist-memory-signal",

    CREATOR_NOT_FINISHED:
      "creator-not-finished",

    PROGRESSION_YIELDS_TO_EXECUTION:
      "progression-yields-to-execution",

    PROGRESSION_YIELDS_TO_MEMORY:
      "progression-yields-to-memory",

    PROGRESSION_PRESERVES_HANDOFF:
      "progression-preserves-handoff",

    PROGRESSION_ACKNOWLEDGES_DETOUR:
      "progression-acknowledges-detour",

    MEMORY_CLARIFICATION_REQUIRED:
      "memory-clarification-required",

    PROJECT_CORRECTION_ACTIVE:
      "project-correction-active",
  });

const MEMORY_CONTROL_ACTIONS =
  Object.freeze([
    "forget-memory",

    "reinforce-memory",

    "supersede-memory",

    "archive-memory",

    "weaken-memory",

    "resolve-thread",
  ]);

const EXECUTION_ADAPTIVE_ACTIONS =
  Object.freeze([
    ADAPTIVE_ACTIONS
      .MOVE_TO_CREATION,

    ADAPTIVE_ACTIONS
      .MOVE_TO_NEXT_TASK,

    ADAPTIVE_ACTIONS
      .MOVE_TO_REFINEMENT,

    ADAPTIVE_ACTIONS
      .MOVE_TO_PUBLISHING,

    ADAPTIVE_ACTIONS
      .YIELD_TO_EXECUTION,
  ]);

const DEFAULT_ADAPTIVE_CONTEXT =
  Object.freeze({
    creatorId: null,

    creatorJourney:
      "guide",

    creatorType: null,

    creatorExperience:
      null,

    projectType: null,

    creatorProfile: null,

    creatorMemoryConnected:
      false,

    creatorMemoryContext:
      null,

    memoryContext: null,

    activeProject: null,

    activeProjectId: null,

    activeIdea: null,

    activeStage: null,

    activeScene: null,

    activeCharacter: null,

    activeAsset: null,

    sessionId: null,

    sessionStartedAt: null,

    thinkingMode: null,

    creatorEnergy: null,

    momentum: null,

    guidanceWindow: null,

    informationSaturation:
      null,

    creatorExplicitlyAskedForGuidance:
      false,

    creatorExplicitlyAskedForHelp:
      false,

    creatorExplicitlyAskedForExplanation:
      false,

    creatorExplicitlyAskedToContinue:
      false,

    creatorExplicitlyAskedForNextStep:
      false,

    creatorExplicitlyAskedToPause:
      false,

    creatorExplicitlyAskedToStop:
      false,

    creatorExplicitlyAskedToCreate:
      false,

    creatorExplicitlyAskedToRemember:
      false,

    creatorExplicitlyAskedNotToRemember:
      false,

    creatorExplicitlyAskedToRevisit:
      false,

    preferredResponseDepth:
      null,

    preferredGuidanceStyle:
      null,

    preferredMentorRole:
      null,

    preferredCommunicationPace:
      null,

    preferredVoiceProfile:
      null,

    preferredChannel: null,

    recentCreatorMessages:
      [],

    recentMentorMessages:
      [],

    recentConversations:
      [],

    existingMemories:
      [],

    existingProjectMemories:
      [],

    existingPatterns: [],

    existingObservations:
      [],

    deferredMemories:
      [],

    milestones: [],

    memorySignals: [],

    projectMemorySignals:
      [],

    captureSessionHandoff:
      false,

    sessionHandoff:
      null,

    sourceAgent: null,

    sourceSystem: null,

    targetMemoryIds:
      [],

    memoryAction: null,

    memoryActionPending:
      false,

    memoryPersistencePending:
      false,

    forgetRequested:
      false,

    forgetRequiresClarification:
      false,

    briefDetour: false,

    deferredTopic: false,

    correctionSignal:
      false,

    minimumCreationContextReady:
      false,

    requiredInformationComplete:
      false,

    projectReadyToGenerate:
      false,

    projectReadyToRefine:
      false,

    projectReadyToPublish:
      false,

    currentTimestamp:
      null,
  });

function createTimestamp() {
  return new Date()
    .toISOString();
}

function createAdaptivePlanId() {
  const randomValue =
    Math.random()
      .toString(36)
      .slice(2, 10);

  return (
    `adaptive-mentor-plan-` +
    `${Date.now()}-${randomValue}`
  );
}

function cloneValue(
  value
) {
  if (
    value === undefined
  ) {
    return undefined;
  }

  try {
    return JSON.parse(
      JSON.stringify(value)
    );
  } catch {
    return value;
  }
}

function cleanString(
  value
) {
  return typeof value ===
    "string"
    ? value.trim()
    : "";
}

function asArray(
  value
) {
  return Array.isArray(
    value
  )
    ? value
    : [];
}

function uniqueValues(
  values = []
) {
  return [
    ...new Set(
      asArray(values)
        .filter(
          (value) =>
            value !== null &&
            value !== undefined &&
            value !== ""
        )
    ),
  ];
}

function hasOwn(
  value,
  key
) {
  return Boolean(
    value &&
    Object.prototype
      .hasOwnProperty
      .call(
        value,
        key
      )
  );
}

function getNestedValue(
  value,
  path,
  fallback = null
) {
  const keys =
    path.split(".");

  let currentValue =
    value;

  for (
    const key
    of keys
  ) {
    if (
      currentValue ===
        null ||
      currentValue ===
        undefined ||
      typeof currentValue !==
        "object"
    ) {
      return fallback;
    }

    currentValue =
      currentValue[key];
  }

  return (
    currentValue ??
    fallback
  );
}

function includesValue(
  value,
  possibilities = []
) {
  return (
    possibilities
      .includes(
        value
      )
  );
}

function getProjectId(
  context = {}
) {
  const explicit =
    cleanString(
      context
        ?.activeProjectId
    );

  if (explicit) {
    return explicit;
  }

  if (
    typeof context
      ?.activeProject ===
      "string"
  ) {
    return (
      cleanString(
        context
          .activeProject
      ) ||
      null
    );
  }

  return (
    cleanString(
      context
        ?.activeProject
        ?.id
    ) ||
    cleanString(
      context
        ?.activeProject
        ?.projectId
    ) ||
    null
  );
}

function getExplicitProjectId(
  context = {}
) {
  if (
    hasOwn(
      context,
      "activeProjectId"
    )
  ) {
    return (
      cleanString(
        context
          .activeProjectId
      ) ||
      null
    );
  }

  if (
    hasOwn(
      context,
      "activeProject"
    )
  ) {
    if (
      context
        .activeProject ===
      null
    ) {
      return null;
    }

    if (
      typeof context
        .activeProject ===
        "string"
    ) {
      return (
        cleanString(
          context
            .activeProject
        ) ||
        null
      );
    }

    return (
      cleanString(
        context
          ?.activeProject
          ?.id
      ) ||
      cleanString(
        context
          ?.activeProject
          ?.projectId
      ) ||
      null
    );
  }

  return null;
}

function getMemoryEntryProjectIds(
  entry
) {
  return uniqueValues([
    cleanString(
      entry
        ?.projectId
    ),

    cleanString(
      entry
        ?.relatedProjectId
    ),

    cleanString(
      entry
        ?.metadata
        ?.projectId
    ),

    ...asArray(
      entry
        ?.relatedProjectIds
    ).map(
      cleanString
    ),
  ].filter(Boolean));
}

function isMemoryEntryRelevantToProject(
  entry,
  projectId
) {
  if (!entry) {
    return false;
  }

  const projectIds =
    getMemoryEntryProjectIds(
      entry
    );

  /**
   * Truly creator/global entries have no project identity
   * and remain available regardless of active project.
   */
  if (
    projectIds.length ===
      0
  ) {
    return true;
  }

  if (!projectId) {
    return false;
  }

  return (
    projectIds.includes(
      projectId
    )
  );
}

function filterMemoryEntriesForProject(
  entries,
  projectId
) {
  return asArray(
    entries
  ).filter(
    (entry) =>
      isMemoryEntryRelevantToProject(
        entry,
        projectId
      )
  );
}

function hasMeaningfulMemoryContext(
  memoryContext
) {
  if (
    !memoryContext ||
    typeof memoryContext !==
      "object"
  ) {
    return false;
  }

  return Boolean(
    memoryContext
      ?.activeProject ||
    memoryContext
      ?.creatorProfile ||
    memoryContext
      ?.journey ||
    memoryContext
      ?.relationship ||
    memoryContext
      ?.conversationCount >
      0 ||
    memoryContext
      ?.hasSharedIdea ||
    asArray(
      memoryContext
        ?.existingMemories
    ).length > 0 ||
    asArray(
      memoryContext
        ?.existingProjectMemories
    ).length > 0 ||
    asArray(
      memoryContext
        ?.existingPatterns
    ).length > 0 ||
    asArray(
      memoryContext
        ?.knownPatterns
    ).length > 0 ||
    asArray(
      memoryContext
        ?.existingObservations
    ).length > 0 ||
    asArray(
      memoryContext
        ?.recentConversations
    ).length > 0 ||
    Boolean(
      memoryContext
        ?.sessionHandoff
    )
  );
}

/**
 * Reads CreatorMemory's richest available context.
 *
 * Explicit current project identity is supplied before
 * persistence is read.
 */
function readCreatorMemoryContext(
  memory,
  {
    projectId = null,
  } = {}
) {
  if (!memory) {
    return null;
  }

  try {
    if (
      typeof memory
        .getMemoryContext ===
        "function"
    ) {
      const context =
        memory
          .getMemoryContext(
            projectId
              ? {
                  projectId,
                }
              : {}
          );

      if (
        context &&
        typeof context ===
          "object"
      ) {
        return cloneValue(
          context
        );
      }
    }

    if (
      typeof memory
        .createEngineContext ===
        "function"
    ) {
      return cloneValue(
        memory
          .createEngineContext()
      );
    }
  } catch (error) {
    console.warn(
      "AdaptiveMentorEngine memory context error:",
      error
    );
  }

  return null;
}

function readRecentMemoryConversations(
  memory,
  memoryContext,
  {
    projectId = null,
    limit = 10,
  } = {}
) {
  const contextConversations =
    filterMemoryEntriesForProject(
      memoryContext
        ?.recentConversations,
      projectId
    );

  if (
    contextConversations
      .length > 0
  ) {
    return cloneValue(
      contextConversations
        .slice(
          0,
          limit
        )
    );
  }

  if (
    !memory ||
    typeof memory
      .getRecentConversations !==
      "function"
  ) {
    return [];
  }

  try {
    return cloneValue(
      filterMemoryEntriesForProject(
        memory
          .getRecentConversations(
            limit
          ),
        projectId
      ).slice(
        0,
        limit
      )
    );
  } catch (error) {
    console.warn(
      "AdaptiveMentorEngine recent memory error:",
      error
    );

    return [];
  }
}

function resolveCommunicationPreferences(
  memoryContext
) {
  return (
    memoryContext
      ?.communicationPreferences ||
    memoryContext
      ?.creatorProfile
      ?.communicationPreferences ||
    {}
  );
}

function resolveExplicitOrRemembered({
  explicitContext,
  key,
  rememberedValue,
  fallback = null,
}) {
  if (
    hasOwn(
      explicitContext,
      key
    )
  ) {
    return cloneValue(
      explicitContext[
        key
      ]
    );
  }

  if (
    rememberedValue !==
      undefined
  ) {
    return cloneValue(
      rememberedValue
    );
  }

  return cloneValue(
    fallback
  );
}

/**
 * Builds one shared context for every specialist.
 *
 * Precedence:
 *
 * 1. Explicit present-turn context.
 * 2. Correctly scoped CreatorMemory context.
 * 3. Adaptive defaults.
 */
function createMemoryAwareContext({
  context = {},
  memory = null,
} = {}) {
  const explicitContext =
    cloneValue(
      context
    ) || {};

  const explicitProjectWasSupplied =
    hasOwn(
      explicitContext,
      "activeProjectId"
    ) ||
    hasOwn(
      explicitContext,
      "activeProject"
    );

  const explicitProjectId =
    getExplicitProjectId(
      explicitContext
    );

  const suppliedMemoryContext =
    explicitContext
      ?.creatorMemoryContext ||
    explicitContext
      ?.memoryContext ||
    null;

  const storedMemoryContext =
    readCreatorMemoryContext(
      memory,
      {
        projectId:
          explicitProjectWasSupplied
            ? explicitProjectId
            : null,
      }
    );

  const rawMemoryContext =
    storedMemoryContext ||
    suppliedMemoryContext ||
    null;

  const rememberedProjectId =
    cleanString(
      rawMemoryContext
        ?.activeProjectId
    ) ||
    cleanString(
      rawMemoryContext
        ?.activeProject
        ?.id
    ) ||
    cleanString(
      rawMemoryContext
        ?.activeProject
        ?.projectId
    ) ||
    cleanString(
      rawMemoryContext
        ?.journey
        ?.activeProjectId
    ) ||
    null;

  const resolvedProjectId =
    explicitProjectWasSupplied
      ? explicitProjectId
      : rememberedProjectId;

  const memoryContext =
    rawMemoryContext
      ? {
          ...cloneValue(
            rawMemoryContext
          ),

          activeProjectId:
            resolvedProjectId,

          existingMemories:
            filterMemoryEntriesForProject(
              rawMemoryContext
                ?.existingMemories,
              resolvedProjectId
            ),

          existingProjectMemories:
            filterMemoryEntriesForProject(
              rawMemoryContext
                ?.existingProjectMemories,
              resolvedProjectId
            ),

          existingPatterns:
            filterMemoryEntriesForProject(
              rawMemoryContext
                ?.existingPatterns ||
              rawMemoryContext
                ?.knownPatterns,
              resolvedProjectId
            ),

          existingObservations:
            filterMemoryEntriesForProject(
              rawMemoryContext
                ?.existingObservations,
              resolvedProjectId
            ),

          deferredMemories:
            filterMemoryEntriesForProject(
              rawMemoryContext
                ?.deferredMemories,
              resolvedProjectId
            ),

          milestones:
            filterMemoryEntriesForProject(
              rawMemoryContext
                ?.milestones,
              resolvedProjectId
            ),

          recentConversations:
            filterMemoryEntriesForProject(
              rawMemoryContext
                ?.recentConversations,
              resolvedProjectId
            ),

          sessionHandoff:
            rawMemoryContext
              ?.sessionHandoff &&
            isMemoryEntryRelevantToProject(
              rawMemoryContext
                .sessionHandoff,
              resolvedProjectId
            )
              ? cloneValue(
                  rawMemoryContext
                    .sessionHandoff
                )
              : null,
        }
      : null;

  const memoryProfile =
    hasOwn(
      explicitContext,
      "creatorProfile"
    )
      ? explicitContext
          .creatorProfile
      : memoryContext
          ?.creatorProfile ||
        null;

  const communicationPreferences =
    resolveCommunicationPreferences(
      memoryContext
    );

  const rememberedProject =
    memoryContext
      ?.activeProject ||
    null;

  const recentConversations =
    readRecentMemoryConversations(
      memory,
      memoryContext,
      {
        projectId:
          resolvedProjectId,

        limit: 10,
      }
    );

  const rememberedPatterns =
    filterMemoryEntriesForProject(
      memoryContext
        ?.existingPatterns ||
      memoryContext
        ?.knownPatterns,
      resolvedProjectId
    );

  const rememberedObservations =
    filterMemoryEntriesForProject(
      memoryContext
        ?.existingObservations,
      resolvedProjectId
    );

  const rememberedMemories =
    filterMemoryEntriesForProject(
      memoryContext
        ?.existingMemories,
      resolvedProjectId
    );

  const rememberedProjectMemories =
    filterMemoryEntriesForProject(
      memoryContext
        ?.existingProjectMemories,
      resolvedProjectId
    );

  const deferredMemories =
    filterMemoryEntriesForProject(
      memoryContext
        ?.deferredMemories,
      resolvedProjectId
    );

  const milestones =
    filterMemoryEntriesForProject(
      memoryContext
        ?.milestones,
      resolvedProjectId
    );

  const memoryDerivedContext = {
    creatorProfile:
      memoryProfile,

    creatorMemoryConnected:
      Boolean(memory),

    creatorMemoryContext:
      memoryContext,

    memoryContext,

    activeProject:
      rememberedProject,

    activeProjectId:
      resolvedProjectId,

    sessionHandoff:
      memoryContext
        ?.sessionHandoff ||
      null,

    recentConversations,

    existingMemories:
      rememberedMemories,

    existingProjectMemories:
      rememberedProjectMemories,

    existingPatterns:
      rememberedPatterns,

    existingObservations:
      rememberedObservations,

    deferredMemories,

    milestones,

    creatorType:
      asArray(
        memoryProfile
          ?.creatorTypes
      )[0] ||
      null,

    preferredResponseDepth:
      communicationPreferences
        ?.preferredResponseDepth ??
      null,

    preferredGuidanceStyle:
      communicationPreferences
        ?.preferredGuidanceStyle ??
      null,

    preferredMentorRole:
      communicationPreferences
        ?.preferredMentorRole ??
      null,

    preferredCommunicationPace:
      communicationPreferences
        ?.preferredCommunicationPace ??
      null,

    preferredVoiceProfile:
      communicationPreferences
        ?.preferredVoiceProfile ??
      null,

    preferredChannel:
      communicationPreferences
        ?.preferredChannel ??
      null,

    recentStage:
      memoryContext
        ?.journey
        ?.recentStage ??
      memoryContext
        ?.recentStage ??
      null,

    recentEmotionalState:
      memoryContext
        ?.journey
        ?.recentEmotionalState ??
      memoryContext
        ?.recentEmotionalState ??
      null,

    interactionCount:
      memoryContext
        ?.relationship
        ?.interactionCount ??
      memoryContext
        ?.counts
        ?.conversations ??
      memoryContext
        ?.conversationCount ??
      0,
  };

  const resolvedContext = {
    ...cloneValue(
      DEFAULT_ADAPTIVE_CONTEXT
    ),

    ...memoryDerivedContext,

    ...explicitContext,

    creatorProfile:
      resolveExplicitOrRemembered({
        explicitContext,

        key:
          "creatorProfile",

        rememberedValue:
          memoryDerivedContext
            .creatorProfile,

        fallback: null,
      }),

    creatorMemoryConnected:
      Boolean(memory),

    creatorMemoryContext:
      memoryContext,

    memoryContext,

    activeProject:
      resolveExplicitOrRemembered({
        explicitContext,

        key:
          "activeProject",

        rememberedValue:
          memoryDerivedContext
            .activeProject,

        fallback: null,
      }),

    activeProjectId:
      explicitProjectWasSupplied
        ? explicitProjectId
        : resolvedProjectId,

    sessionHandoff:
      resolveExplicitOrRemembered({
        explicitContext,

        key:
          "sessionHandoff",

        rememberedValue:
          memoryDerivedContext
            .sessionHandoff,

        fallback: null,
      }),

    recentConversations:
      resolveExplicitOrRemembered({
        explicitContext,

        key:
          "recentConversations",

        rememberedValue:
          recentConversations,

        fallback: [],
      }),

    existingMemories:
      resolveExplicitOrRemembered({
        explicitContext,

        key:
          "existingMemories",

        rememberedValue:
          rememberedMemories,

        fallback: [],
      }),

    existingProjectMemories:
      resolveExplicitOrRemembered({
        explicitContext,

        key:
          "existingProjectMemories",

        rememberedValue:
          rememberedProjectMemories,

        fallback: [],
      }),

    existingPatterns:
      resolveExplicitOrRemembered({
        explicitContext,

        key:
          "existingPatterns",

        rememberedValue:
          rememberedPatterns,

        fallback: [],
      }),

    existingObservations:
      resolveExplicitOrRemembered({
        explicitContext,

        key:
          "existingObservations",

        rememberedValue:
          rememberedObservations,

        fallback: [],
      }),

    deferredMemories:
      resolveExplicitOrRemembered({
        explicitContext,

        key:
          "deferredMemories",

        rememberedValue:
          deferredMemories,

        fallback: [],
      }),

    milestones:
      resolveExplicitOrRemembered({
        explicitContext,

        key:
          "milestones",

        rememberedValue:
          milestones,

        fallback: [],
      }),

    preferredResponseDepth:
      resolveExplicitOrRemembered({
        explicitContext,

        key:
          "preferredResponseDepth",

        rememberedValue:
          memoryDerivedContext
            .preferredResponseDepth,

        fallback: null,
      }),

    preferredGuidanceStyle:
      resolveExplicitOrRemembered({
        explicitContext,

        key:
          "preferredGuidanceStyle",

        rememberedValue:
          memoryDerivedContext
            .preferredGuidanceStyle,

        fallback: null,
      }),

    preferredMentorRole:
      resolveExplicitOrRemembered({
        explicitContext,

        key:
          "preferredMentorRole",

        rememberedValue:
          memoryDerivedContext
            .preferredMentorRole,

        fallback: null,
      }),

    preferredCommunicationPace:
      resolveExplicitOrRemembered({
        explicitContext,

        key:
          "preferredCommunicationPace",

        rememberedValue:
          memoryDerivedContext
            .preferredCommunicationPace,

        fallback: null,
      }),

    preferredVoiceProfile:
      resolveExplicitOrRemembered({
        explicitContext,

        key:
          "preferredVoiceProfile",

        rememberedValue:
          memoryDerivedContext
            .preferredVoiceProfile,

        fallback: null,
      }),

    preferredChannel:
      resolveExplicitOrRemembered({
        explicitContext,

        key:
          "preferredChannel",

        rememberedValue:
          memoryDerivedContext
            .preferredChannel,

        fallback: null,
      }),

    currentTimestamp:
      explicitContext
        .currentTimestamp ||
      createTimestamp(),
  };

  const finalProjectId =
    getProjectId(
      resolvedContext
    );

  resolvedContext
    .activeProjectId =
    finalProjectId;

  /**
   * Final isolation pass after present-turn context wins.
   */
  resolvedContext
    .existingMemories =
    filterMemoryEntriesForProject(
      resolvedContext
        .existingMemories,
      finalProjectId
    );

  resolvedContext
    .existingProjectMemories =
    filterMemoryEntriesForProject(
      resolvedContext
        .existingProjectMemories,
      finalProjectId
    );

  resolvedContext
    .existingPatterns =
    filterMemoryEntriesForProject(
      resolvedContext
        .existingPatterns,
      finalProjectId
    );

  resolvedContext
    .existingObservations =
    filterMemoryEntriesForProject(
      resolvedContext
        .existingObservations,
      finalProjectId
    );

  resolvedContext
    .deferredMemories =
    filterMemoryEntriesForProject(
      resolvedContext
        .deferredMemories,
      finalProjectId
    );

  resolvedContext
    .milestones =
    filterMemoryEntriesForProject(
      resolvedContext
        .milestones,
      finalProjectId
    );

  resolvedContext
    .recentConversations =
    filterMemoryEntriesForProject(
      resolvedContext
        .recentConversations,
      finalProjectId
    );

  if (
    resolvedContext
      .sessionHandoff &&
    !isMemoryEntryRelevantToProject(
      resolvedContext
        .sessionHandoff,
      finalProjectId
    )
  ) {
    resolvedContext
      .sessionHandoff =
      null;
  }

  return resolvedContext;
}

function addCandidateAction(
  candidates,
  {
    action,
    priority,
    reason,
    source,
    metadata = null,
  }
) {
  if (!action) {
    return;
  }

  candidates.push({
    action,

    priority,

    reason,

    source,

    metadata:
      cloneValue(
        metadata
      ),
  });
}

function memoryPlanHasCaptureInstructions(
  memoryPlan
) {
  return asArray(
    memoryPlan
      ?.instructions
  ).some(
    (instruction) => {
      const action =
        cleanString(
          instruction
            ?.action
        );

      return (
        action &&
        action !==
          "forget-memory"
      );
    }
  );
}

function memoryPlanHasForgetInstructions(
  memoryPlan
) {
  return asArray(
    memoryPlan
      ?.instructions
  ).some(
    (instruction) =>
      cleanString(
        instruction
          ?.action
      ) ===
      "forget-memory"
  );
}

function memoryPlanHasProjectMemory(
  memoryPlan
) {
  return asArray(
    memoryPlan
      ?.candidates
  ).some(
    (item) => {
      const candidate =
        item
          ?.candidate ||
        item;

      return Boolean(
        candidate
          ?.scope ===
          "project" ||
        candidate
          ?.projectId
      );
    }
  );
}

function memoryPlanHasSessionHandoff(
  memoryPlan
) {
  return asArray(
    memoryPlan
      ?.candidates
  ).some(
    (item) => {
      const candidate =
        item
          ?.candidate ||
        item;

      return (
        candidate
          ?.category ===
        "session-handoff"
      );
    }
  );
}

function contextHasStoredSessionHandoff(
  context
) {
  const handoff =
    context
      ?.sessionHandoff ||
    context
      ?.creatorMemoryContext
      ?.sessionHandoff ||
    null;

  if (!handoff) {
    return false;
  }

  const activeProjectId =
    getProjectId(
      context
    );

  return (
    isMemoryEntryRelevantToProject(
      handoff,
      activeProjectId
    )
  );
}

function contextHasSpecialistMemorySignals(
  context
) {
  return Boolean(
    context
      ?.sourceAgent ||
    asArray(
      context
        ?.memorySignals
    ).length > 0 ||
    asArray(
      context
        ?.projectMemorySignals
    ).length > 0
  );
}

function collectAdaptationSignals({
  context,
  conversationPlan,
  reflectionPlan,
  progressionPlan,
  memoryPlan,
}) {
  const signals = [];

  const thinkingMode =
    getNestedValue(
      reflectionPlan,
      "creatorState.thinkingMode.value",
      context
        ?.thinkingMode
    );

  const creatorEnergy =
    getNestedValue(
      progressionPlan,
      "creatorState.creatorEnergy.value",
      context
        ?.creatorEnergy
    );

  const momentum =
    getNestedValue(
      progressionPlan,
      "creatorState.momentum.value",
      context
        ?.momentum
    );

  const guidanceWindow =
    getNestedValue(
      progressionPlan,
      "creatorState.guidanceWindow.value",
      context
        ?.guidanceWindow
    );

  const informationSaturation =
    getNestedValue(
      progressionPlan,
      "creatorState.informationSaturation.value",
      context
        ?.informationSaturation
    );

  const appearsFinished =
    getNestedValue(
      reflectionPlan,
      "creatorState.appearsFinished.value",
      true
    );

  const progressionDecision =
    cleanString(
      progressionPlan
        ?.decision
    );

  const progressionCorrection =
    getNestedValue(
      progressionPlan,
      "creatorState.correctionState.value",
      false
    );

  if (
    thinkingMode ===
    "build"
  ) {
    signals.push(
      ADAPTATION_SIGNALS
        .BUILD_MODE
    );
  }

  if (
    thinkingMode ===
    "flow"
  ) {
    signals.push(
      ADAPTATION_SIGNALS
        .FLOW_MODE
    );
  }

  if (
    thinkingMode ===
    "exploration"
  ) {
    signals.push(
      ADAPTATION_SIGNALS
        .EXPLORATION_MODE
    );
  }

  if (
    thinkingMode ===
    "learning"
  ) {
    signals.push(
      ADAPTATION_SIGNALS
        .LEARNING_MODE
    );
  }

  if (
    thinkingMode ===
    "reflection"
  ) {
    signals.push(
      ADAPTATION_SIGNALS
        .REFLECTION_MODE
    );
  }

  if (
    thinkingMode ===
    "recovery"
  ) {
    signals.push(
      ADAPTATION_SIGNALS
        .RECOVERY_MODE
    );
  }

  if (
    thinkingMode ===
    "incubation"
  ) {
    signals.push(
      ADAPTATION_SIGNALS
        .INCUBATION_MODE
    );
  }

  if (
    includesValue(
      momentum,
      [
        "strong",
        "rising",
      ]
    )
  ) {
    signals.push(
      ADAPTATION_SIGNALS
        .HIGH_MOMENTUM
    );
  }

  if (
    includesValue(
      creatorEnergy,
      [
        "low",
        "depleted",
      ]
    )
  ) {
    signals.push(
      ADAPTATION_SIGNALS
        .LOW_ENERGY
    );
  }

  if (
    includesValue(
      informationSaturation,
      [
        "high",
        "overloaded",
      ]
    )
  ) {
    signals.push(
      ADAPTATION_SIGNALS
        .INFORMATION_OVERLOAD
    );
  }

  if (
    context
      ?.creatorExplicitlyAskedForGuidance ||
    context
      ?.creatorExplicitlyAskedForHelp ||
    guidanceWindow ===
      "wide-open"
  ) {
    signals.push(
      ADAPTATION_SIGNALS
        .GUIDANCE_REQUESTED
    );
  }

  if (
    guidanceWindow ===
      "closed-for-now"
  ) {
    signals.push(
      ADAPTATION_SIGNALS
        .GUIDANCE_NOT_WANTED
    );
  }

  if (
    getNestedValue(
      memoryPlan,
      "detections.briefDetour.value",
      false
    ) ||
    getNestedValue(
      progressionPlan,
      "creatorState.briefDetour.value",
      false
    ) ||
    progressionDecision ===
      "acknowledge-detour"
  ) {
    signals.push(
      ADAPTATION_SIGNALS
        .BRIEF_DETOUR
    );
  }

  if (
    getNestedValue(
      memoryPlan,
      "detections.deferredTopic.value",
      false
    )
  ) {
    signals.push(
      ADAPTATION_SIGNALS
        .DEFERRED_TOPIC
    );
  }

  if (
    getNestedValue(
      memoryPlan,
      "recall.shouldRecall",
      false
    )
  ) {
    signals.push(
      ADAPTATION_SIGNALS
        .RECALL_AVAILABLE
    );
  }

  if (
    memoryPlanHasCaptureInstructions(
      memoryPlan
    )
  ) {
    signals.push(
      ADAPTATION_SIGNALS
        .MEMORY_CAPTURE_AVAILABLE
    );
  }

  if (
    memoryPlanHasProjectMemory(
      memoryPlan
    ) ||
    asArray(
      context
        ?.existingProjectMemories
    ).length > 0
  ) {
    signals.push(
      ADAPTATION_SIGNALS
        .PROJECT_MEMORY_AVAILABLE
    );
  }

  if (
    getProjectId(
      context
    )
  ) {
    signals.push(
      ADAPTATION_SIGNALS
        .PROJECT_CONTEXT_AVAILABLE
    );
  }

  if (
    context
      ?.creatorMemoryConnected
  ) {
    signals.push(
      ADAPTATION_SIGNALS
        .CREATOR_MEMORY_CONNECTED
    );
  }

  if (
    hasMeaningfulMemoryContext(
      context
        ?.creatorMemoryContext
    )
  ) {
    signals.push(
      ADAPTATION_SIGNALS
        .CREATOR_MEMORY_CONTEXT_AVAILABLE
    );
  }

  if (
    memoryPlanHasSessionHandoff(
      memoryPlan
    )
  ) {
    signals.push(
      ADAPTATION_SIGNALS
        .SESSION_HANDOFF_AVAILABLE
    );
  }

  if (
    contextHasStoredSessionHandoff(
      context
    )
  ) {
    signals.push(
      ADAPTATION_SIGNALS
        .STORED_SESSION_HANDOFF_AVAILABLE
    );
  }

  if (
    memoryPlan
      ?.forget
      ?.requested
  ) {
    signals.push(
      ADAPTATION_SIGNALS
        .FORGET_REQUEST
    );
  }

  if (
    memoryPlan
      ?.forget
      ?.requiresClarification
  ) {
    signals.push(
      ADAPTATION_SIGNALS
        .FORGET_REQUIRES_CLARIFICATION
    );
  }

  if (
    contextHasSpecialistMemorySignals(
      context
    )
  ) {
    signals.push(
      ADAPTATION_SIGNALS
        .SPECIALIST_MEMORY_SIGNAL
    );
  }

  if (
    appearsFinished ===
      false
  ) {
    signals.push(
      ADAPTATION_SIGNALS
        .CREATOR_NOT_FINISHED
    );
  }

  if (
    progressionDecision ===
      "yield-to-execution"
  ) {
    signals.push(
      ADAPTATION_SIGNALS
        .PROGRESSION_YIELDS_TO_EXECUTION
    );
  }

  if (
    progressionDecision ===
      "yield-to-memory-action"
  ) {
    signals.push(
      ADAPTATION_SIGNALS
        .PROGRESSION_YIELDS_TO_MEMORY
    );
  }

  if (
    progressionDecision ===
      "preserve-handoff"
  ) {
    signals.push(
      ADAPTATION_SIGNALS
        .PROGRESSION_PRESERVES_HANDOFF
    );
  }

  if (
    progressionDecision ===
      "acknowledge-detour"
  ) {
    signals.push(
      ADAPTATION_SIGNALS
        .PROGRESSION_ACKNOWLEDGES_DETOUR
    );
  }

  if (
    progressionDecision ===
      "wait-for-memory-clarification"
  ) {
    signals.push(
      ADAPTATION_SIGNALS
        .MEMORY_CLARIFICATION_REQUIRED
    );
  }

  if (
    progressionCorrection ||
    context
      ?.correctionSignal
  ) {
    signals.push(
      ADAPTATION_SIGNALS
        .PROJECT_CORRECTION_ACTIVE
    );
  }

  const memoryControlState =
    getNestedValue(
      progressionPlan,
      "creatorState.memoryControlState.value",
      false
    );

  if (
    memoryControlState ||
    context
      ?.memoryActionPending ||
    context
      ?.memoryPersistencePending
  ) {
    signals.push(
      ADAPTATION_SIGNALS
        .MEMORY_ACTION_PENDING
    );
  }

  const conversationMode =
    getNestedValue(
      conversationPlan,
      "conversation.mode",
      null
    );

  if (
    conversationMode ===
      "learning" &&
    !signals.includes(
      ADAPTATION_SIGNALS
        .LEARNING_MODE
    )
  ) {
    signals.push(
      ADAPTATION_SIGNALS
        .LEARNING_MODE
    );
  }

  return uniqueValues(
    signals
  );
}

function collectCandidateActions({
  context,
  conversationPlan,
  reflectionPlan,
  progressionPlan,
  memoryPlan,
  signals,
}) {
  const candidates = [];

  const reflectionDecision =
    reflectionPlan
      ?.decision;

  const progressionDecision =
    progressionPlan
      ?.decision;

  const conversationAction =
    getNestedValue(
      conversationPlan,
      "conversation.primaryAction",
      null
    );

  /**
   * Explicit creator boundaries are highest.
   */
  if (
    context
      ?.creatorExplicitlyAskedToStop
  ) {
    addCandidateAction(
      candidates,
      {
        action:
          ADAPTIVE_ACTIONS
            .END_POSITIVELY,

        priority:
          ACTION_PRIORITIES
            .CREATOR_EXPLICIT_DIRECTION,

        reason:
          "The creator explicitly requested to stop.",

        source:
          "context",
      }
    );
  }

  if (
    context
      ?.creatorExplicitlyAskedToPause
  ) {
    addCandidateAction(
      candidates,
      {
        action:
          ADAPTIVE_ACTIONS
            .SAVE_AND_PAUSE,

        priority:
          ACTION_PRIORITIES
            .CREATOR_EXPLICIT_DIRECTION,

        reason:
          "The creator explicitly requested a pause.",

        source:
          "context",
      }
    );
  }

  /**
   * Forget operations outrank ordinary progression.
   */
  if (
    signals.includes(
      ADAPTATION_SIGNALS
        .FORGET_REQUIRES_CLARIFICATION
    ) ||
    signals.includes(
      ADAPTATION_SIGNALS
        .MEMORY_CLARIFICATION_REQUIRED
    )
  ) {
    addCandidateAction(
      candidates,
      {
        action:
          ADAPTIVE_ACTIONS
            .CLARIFY_FORGET_REQUEST,

        priority:
          ACTION_PRIORITIES
            .MEMORY_FORGET_CLARIFICATION,

        reason:
          "A memory-control request requires one unambiguous target before persistence may continue.",

        source:
          "memory-orchestration",

        metadata: {
          forgetPlan:
            memoryPlan
              ?.forget ||
            null,
        },
      }
    );
  } else if (
    signals.includes(
      ADAPTATION_SIGNALS
        .FORGET_REQUEST
    )
  ) {
    addCandidateAction(
      candidates,
      {
        action:
          ADAPTIVE_ACTIONS
            .APPLY_FORGET_REQUEST,

        priority:
          ACTION_PRIORITIES
            .MEMORY_FORGET,

        reason:
          "The creator made an explicit and sufficiently clear forget request.",

        source:
          "creator-memory-engine",

        metadata: {
          forgetPlan:
            memoryPlan
              ?.forget ||
            null,
        },
      }
    );
  }

  /**
   * Progression v2.3 may explicitly yield to a non-forget
   * memory action.
   */
  if (
    signals.includes(
      ADAPTATION_SIGNALS
        .PROGRESSION_YIELDS_TO_MEMORY
    ) &&
    !signals.includes(
      ADAPTATION_SIGNALS
        .FORGET_REQUIRES_CLARIFICATION
    )
  ) {
    addCandidateAction(
      candidates,
      {
        action:
          ADAPTIVE_ACTIONS
            .EXECUTE_MEMORY_ACTION,

        priority:
          ACTION_PRIORITIES
            .MEMORY_CONTROL,

        reason:
          "Progression has yielded to the active memory-control operation.",

        source:
          "progression-engine",
      }
    );
  }

  if (
    includesValue(
      reflectionDecision,
      [
        "hold-space",
        "stay-silent",
      ]
    )
  ) {
    addCandidateAction(
      candidates,
      {
        action:
          ADAPTIVE_ACTIONS
            .WAIT,

        priority:
          ACTION_PRIORITIES
            .HOLD_SPACE,

        reason:
          "The creator may still be thinking or speaking.",

        source:
          "reflection-engine",
      }
    );
  }

  if (
    reflectionDecision ===
      "release-pressure"
  ) {
    addCandidateAction(
      candidates,
      {
        action:
          ADAPTIVE_ACTIONS
            .RELEASE_PRESSURE,

        priority:
          ACTION_PRIORITIES
            .RELEASE_PRESSURE,

        reason:
          "Pressure should be removed before continuing.",

        source:
          "reflection-engine",
      }
    );
  }

  if (
    reflectionDecision ===
      "restore-context"
  ) {
    addCandidateAction(
      candidates,
      {
        action:
          ADAPTIVE_ACTIONS
            .RESTORE_CONTEXT,

        priority:
          ACTION_PRIORITIES
            .RELEASE_PRESSURE,

        reason:
          "The creator may benefit from returning to recent conversation landmarks.",

        source:
          "reflection-engine",
      }
    );
  }

  /**
   * Progression's execution yield is deliberate.
   * Adaptive must not reinsert reflection in front of it.
   */
  if (
    signals.includes(
      ADAPTATION_SIGNALS
        .PROGRESSION_YIELDS_TO_EXECUTION
    )
  ) {
    addCandidateAction(
      candidates,
      {
        action:
          ADAPTIVE_ACTIONS
            .YIELD_TO_EXECUTION,

        priority:
          ACTION_PRIORITIES
            .MOVE_TO_ACTION,

        reason:
          "Progression has explicitly cleared the orchestration path for execution.",

        source:
          "progression-engine",

        metadata: {
          progressionTarget:
            getNestedValue(
              progressionPlan,
              "progression.primaryAction",
              null
            ),

          conversationMentorMove:
            getNestedValue(
              conversationPlan,
              "conversation.mentorMove",
              null
            ),
        },
      }
    );
  }

  /**
   * Stored project handoff restoration.
   */
  if (
    signals.includes(
      ADAPTATION_SIGNALS
        .STORED_SESSION_HANDOFF_AVAILABLE
    ) &&
    (
      context
        ?.creatorExplicitlyAskedToContinue ||
      context
        ?.creatorExplicitlyAskedForNextStep ||
      context
        ?.creatorExplicitlyAskedForGuidance ||
      progressionDecision ===
        "restore-context"
    )
  ) {
    addCandidateAction(
      candidates,
      {
        action:
          ADAPTIVE_ACTIONS
            .RESTORE_PROJECT_CONTEXT,

        priority:
          ACTION_PRIORITIES
            .RESTORE_PROJECT_CONTEXT,

        reason:
          "A stored session handoff can restore the creator's project position without repeating earlier work.",

        source:
          "creator-memory",

        metadata: {
          handoff:
            cloneValue(
              context
                ?.sessionHandoff ||
              context
                ?.creatorMemoryContext
                ?.sessionHandoff ||
              null
            ),
        },
      }
    );
  }

  if (
    reflectionDecision ===
      "reflect" &&
    !signals.includes(
      ADAPTATION_SIGNALS
        .PROGRESSION_YIELDS_TO_EXECUTION
    )
  ) {
    addCandidateAction(
      candidates,
      {
        action:
          ADAPTIVE_ACTIONS
            .REFLECT_GENTLY,

        priority:
          ACTION_PRIORITIES
            .REFLECTION,

        reason:
          "An evidence-based reflection candidate is available.",

        source:
          "reflection-engine",
      }
    );
  }

  if (
    signals.includes(
      ADAPTATION_SIGNALS
        .BRIEF_DETOUR
    )
  ) {
    addCandidateAction(
      candidates,
      {
        action:
          ADAPTIVE_ACTIONS
            .CAPTURE_AND_CONTINUE,

        priority:
          ACTION_PRIORITIES
            .PROTECT_FLOW,

        reason:
          "The creator appears to want the thought captured without opening another workstream.",

        source:
          progressionDecision ===
            "acknowledge-detour"
            ? "progression-engine"
            : "creator-memory-engine",
      }
    );
  }

  if (
    signals.includes(
      ADAPTATION_SIGNALS
        .RECALL_AVAILABLE
    )
  ) {
    addCandidateAction(
      candidates,
      {
        action:
          ADAPTIVE_ACTIONS
            .RECALL_WITH_PERMISSION,

        priority:
          ACTION_PRIORITIES
            .MEMORY_RECALL,

        reason:
          "Stored context appears relevant enough to improve continuity or reduce repeated work.",

        source:
          "creator-memory-engine",

        metadata: {
          recall:
            memoryPlan
              ?.recall ||
            null,
        },
      }
    );
  }

  if (
    (
      signals.includes(
        ADAPTATION_SIGNALS
          .SESSION_HANDOFF_AVAILABLE
      ) ||
      signals.includes(
        ADAPTATION_SIGNALS
          .PROGRESSION_PRESERVES_HANDOFF
      )
    ) &&
    (
      context
        ?.creatorExplicitlyAskedToPause ||
      progressionDecision ===
        "save-and-return-later" ||
      progressionDecision ===
        "pause-session" ||
      progressionDecision ===
        "preserve-handoff"
    )
  ) {
    addCandidateAction(
      candidates,
      {
        action:
          ADAPTIVE_ACTIONS
            .PRESERVE_SESSION_HANDOFF,

        priority:
          ACTION_PRIORITIES
            .CREATOR_EXPLICIT_DIRECTION,

        reason:
          "The creator is leaving or pausing and the project position should be preserved for a clean return.",

        source:
          progressionDecision ===
            "preserve-handoff"
            ? "progression-engine"
            : "creator-memory-engine",
      }
    );
  }

  switch (
    progressionDecision
  ) {
    case "move-to-creation":
      addCandidateAction(
        candidates,
        {
          action:
            ADAPTIVE_ACTIONS
              .MOVE_TO_CREATION,

          priority:
            ACTION_PRIORITIES
              .MOVE_TO_ACTION,

          reason:
            "Enough information exists to begin creation.",

          source:
            "progression-engine",
        }
      );
      break;

    case "move-to-next-task":
      addCandidateAction(
        candidates,
        {
          action:
            ADAPTIVE_ACTIONS
              .MOVE_TO_NEXT_TASK,

          priority:
            ACTION_PRIORITIES
              .MOVE_TO_ACTION,

          reason:
            "The creator requested or is ready for the next task.",

          source:
            "progression-engine",
        }
      );
      break;

    case "move-to-refinement":
      addCandidateAction(
        candidates,
        {
          action:
            ADAPTIVE_ACTIONS
              .MOVE_TO_REFINEMENT,

          priority:
            ACTION_PRIORITIES
              .MOVE_TO_ACTION,

          reason:
            "The project is ready for refinement.",

          source:
            "progression-engine",
        }
      );
      break;

    case "move-to-publishing":
      addCandidateAction(
        candidates,
        {
          action:
            ADAPTIVE_ACTIONS
              .MOVE_TO_PUBLISHING,

          priority:
            ACTION_PRIORITIES
              .MOVE_TO_ACTION,

          reason:
            "The project is ready for publishing.",

          source:
            "progression-engine",
        }
      );
      break;

    case "continue-exploring":
      addCandidateAction(
        candidates,
        {
          action:
            ADAPTIVE_ACTIONS
              .CONTINUE_BRAINSTORMING,

          priority:
            ACTION_PRIORITIES
              .EXPLORATION,

          reason:
            "The creator remains in exploratory mode.",

          source:
            "progression-engine",
        }
      );
      break;

    case "continue-learning":
      addCandidateAction(
        candidates,
        {
          action:
            ADAPTIVE_ACTIONS
              .TEACH_ONE_CONCEPT,

          priority:
            ACTION_PRIORITIES
              .LEARNING,

          reason:
            "The creator remains in learning mode.",

          source:
            "progression-engine",
        }
      );
      break;

    case "offer-one-small-step":
    case "reduce-information":
      addCandidateAction(
        candidates,
        {
          action:
            ADAPTIVE_ACTIONS
              .OFFER_ONE_RECOMMENDATION,

          priority:
            ACTION_PRIORITIES
              .PROTECT_FLOW,

          reason:
            "The creator needs reduced cognitive load.",

          source:
            "progression-engine",
        }
      );
      break;

    case "save-and-return-later":
    case "pause-session":
      addCandidateAction(
        candidates,
        {
          action:
            ADAPTIVE_ACTIONS
              .SAVE_AND_PAUSE,

          priority:
            ACTION_PRIORITIES
              .CREATOR_EXPLICIT_DIRECTION,

          reason:
            "Progress should be preserved for a later return.",

          source:
            "progression-engine",
        }
      );
      break;

    case "preserve-handoff":
      addCandidateAction(
        candidates,
        {
          action:
            ADAPTIVE_ACTIONS
              .PRESERVE_SESSION_HANDOFF,

          priority:
            ACTION_PRIORITIES
              .CREATOR_EXPLICIT_DIRECTION,

          reason:
            "Progression explicitly requested preservation of the session handoff.",

          source:
            "progression-engine",
        }
      );
      break;

    case "acknowledge-detour":
      addCandidateAction(
        candidates,
        {
          action:
            ADAPTIVE_ACTIONS
              .CAPTURE_AND_CONTINUE,

          priority:
            ACTION_PRIORITIES
              .PROTECT_FLOW,

          reason:
            "The detour should be acknowledged without opening another workstream.",

          source:
            "progression-engine",
        }
      );
      break;

    case "yield-to-memory-action":
      addCandidateAction(
        candidates,
        {
          action:
            ADAPTIVE_ACTIONS
              .EXECUTE_MEMORY_ACTION,

          priority:
            ACTION_PRIORITIES
              .MEMORY_CONTROL,

          reason:
            "Progression explicitly yielded to the memory-control pipeline.",

          source:
            "progression-engine",
        }
      );
      break;

    case "wait-for-memory-clarification":
      addCandidateAction(
        candidates,
        {
          action:
            ADAPTIVE_ACTIONS
              .CLARIFY_FORGET_REQUEST,

          priority:
            ACTION_PRIORITIES
              .MEMORY_FORGET_CLARIFICATION,

          reason:
            "Progression blocked unrelated work until the memory target is clarified.",

          source:
            "progression-engine",
        }
      );
      break;

    case "end-session-positively":
      addCandidateAction(
        candidates,
        {
          action:
            ADAPTIVE_ACTIONS
              .END_POSITIVELY,

          priority:
            ACTION_PRIORITIES
              .CREATOR_EXPLICIT_DIRECTION,

          reason:
            "The current session should close without introducing another task.",

          source:
            "progression-engine",
        }
      );
      break;

    case "hold-space":
    case "wait-for-creator":
      addCandidateAction(
        candidates,
        {
          action:
            ADAPTIVE_ACTIONS
              .WAIT,

          priority:
            ACTION_PRIORITIES
              .HOLD_SPACE,

          reason:
            "The creator should be given room to continue.",

          source:
            "progression-engine",
        }
      );
      break;

    default:
      break;
  }

  if (
    conversationAction ===
      "ask-one-question"
  ) {
    addCandidateAction(
      candidates,
      {
        action:
          ADAPTIVE_ACTIONS
            .ASK_ONE_QUESTION,

        priority:
          ACTION_PRIORITIES
            .GENERAL_LISTENING,

        reason:
          "Conversation Planner recommends one meaningful question.",

        source:
          "conversation-planner",
      }
    );
  }

  if (
    conversationAction ===
      "listen"
  ) {
    addCandidateAction(
      candidates,
      {
        action:
          ADAPTIVE_ACTIONS
            .LISTEN_AND_INVITE,

        priority:
          ACTION_PRIORITIES
            .GENERAL_LISTENING,

        reason:
          "No stronger intervention is currently required.",

        source:
          "conversation-planner",
      }
    );
  }

  if (
    candidates.length ===
      0
  ) {
    addCandidateAction(
      candidates,
      {
        action:
          ADAPTIVE_ACTIONS
            .ACKNOWLEDGE_BRIEFLY,

        priority:
          ACTION_PRIORITIES
            .GENERAL_LISTENING,

        reason:
          "No specialist engine identified a stronger action.",

        source:
          "adaptive-mentor-engine",
      }
    );
  }

  return candidates.sort(
    (left, right) =>
      right.priority -
      left.priority
  );
}

function resolvePrimaryAction({
  candidates,
  signals,
  context,
}) {
  const firstCandidate =
    candidates[0];

  if (!firstCandidate) {
    return {
      action:
        ADAPTIVE_ACTIONS
          .ACKNOWLEDGE_BRIEFLY,

      priority:
        ACTION_PRIORITIES
          .GENERAL_LISTENING,

      reason:
        "No candidate actions were available.",

      source:
        "adaptive-mentor-engine",
    };
  }

  /**
   * Explicit stop remains absolute.
   */
  if (
    context
      ?.creatorExplicitlyAskedToStop
  ) {
    const stopCandidate =
      candidates.find(
        (candidate) =>
          candidate.action ===
          ADAPTIVE_ACTIONS
            .END_POSITIVELY
      );

    if (stopCandidate) {
      return stopCandidate;
    }
  }

  /**
   * Forget clarification must block all destructive work.
   */
  if (
    signals.includes(
      ADAPTATION_SIGNALS
        .FORGET_REQUIRES_CLARIFICATION
    ) ||
    signals.includes(
      ADAPTATION_SIGNALS
        .MEMORY_CLARIFICATION_REQUIRED
    )
  ) {
    const clarificationCandidate =
      candidates.find(
        (candidate) =>
          candidate.action ===
          ADAPTIVE_ACTIONS
            .CLARIFY_FORGET_REQUEST
      );

    if (
      clarificationCandidate
    ) {
      return (
        clarificationCandidate
      );
    }
  }

  if (
    signals.includes(
      ADAPTATION_SIGNALS
        .FORGET_REQUEST
    )
  ) {
    const forgetCandidate =
      candidates.find(
        (candidate) =>
          candidate.action ===
          ADAPTIVE_ACTIONS
            .APPLY_FORGET_REQUEST
      );

    if (
      forgetCandidate
    ) {
      return forgetCandidate;
    }
  }

  /**
   * Explicit pause prefers a real handoff when available.
   */
  if (
    context
      ?.creatorExplicitlyAskedToPause
  ) {
    const handoffCandidate =
      candidates.find(
        (candidate) =>
          candidate.action ===
          ADAPTIVE_ACTIONS
            .PRESERVE_SESSION_HANDOFF
      );

    if (
      handoffCandidate
    ) {
      return handoffCandidate;
    }

    const pauseCandidate =
      candidates.find(
        (candidate) =>
          candidate.action ===
          ADAPTIVE_ACTIONS
            .SAVE_AND_PAUSE
      );

    if (
      pauseCandidate
    ) {
      return pauseCandidate;
    }
  }

  /**
   * Active memory-control operations deliberately suspend
   * unrelated creative progression.
   */
  if (
    signals.includes(
      ADAPTATION_SIGNALS
        .PROGRESSION_YIELDS_TO_MEMORY
    ) ||
    signals.includes(
      ADAPTATION_SIGNALS
        .MEMORY_ACTION_PENDING
    )
  ) {
    const memoryCandidate =
      candidates.find(
        (candidate) =>
          candidate.action ===
          ADAPTIVE_ACTIONS
            .EXECUTE_MEMORY_ACTION
      );

    if (
      memoryCandidate
    ) {
      return memoryCandidate;
    }
  }

  /**
   * A creator who has not finished still gets the floor unless
   * a stronger explicit creator instruction already won.
   */
  if (
    signals.includes(
      ADAPTATION_SIGNALS
        .CREATOR_NOT_FINISHED
    ) &&
    !signals.includes(
      ADAPTATION_SIGNALS
        .PROGRESSION_YIELDS_TO_EXECUTION
    )
  ) {
    return {
      action:
        ADAPTIVE_ACTIONS
          .WAIT,

      priority:
        ACTION_PRIORITIES
          .HOLD_SPACE,

      reason:
        "The creator appears not to have finished their thought.",

      source:
        "adaptive-conflict-resolution",
    };
  }

  /**
   * Progression's explicit execution yield prevents lower
   * reflection/recall candidates from reclaiming the turn.
   */
  if (
    signals.includes(
      ADAPTATION_SIGNALS
        .PROGRESSION_YIELDS_TO_EXECUTION
    )
  ) {
    const executionCandidate =
      candidates.find(
        (candidate) =>
          candidate.action ===
          ADAPTIVE_ACTIONS
            .YIELD_TO_EXECUTION
      );

    if (
      executionCandidate
    ) {
      return executionCandidate;
    }
  }

  if (
    signals.includes(
      ADAPTATION_SIGNALS
        .BRIEF_DETOUR
    ) &&
    !context
      ?.creatorExplicitlyAskedToPause
  ) {
    return {
      action:
        ADAPTIVE_ACTIONS
          .CAPTURE_AND_CONTINUE,

      priority:
        ACTION_PRIORITIES
          .PROTECT_FLOW,

      reason:
        "Capture the brief thought and return to the previous task.",

      source:
        "adaptive-conflict-resolution",
    };
  }

  if (
    signals.includes(
      ADAPTATION_SIGNALS
        .FLOW_MODE
    ) &&
    firstCandidate.action ===
      ADAPTIVE_ACTIONS
        .RECALL_WITH_PERMISSION
  ) {
    const moveCandidate =
      candidates.find(
        (candidate) =>
          EXECUTION_ADAPTIVE_ACTIONS
            .includes(
              candidate.action
            )
      );

    if (
      moveCandidate
    ) {
      return moveCandidate;
    }

    return {
      action:
        ADAPTIVE_ACTIONS
          .ACKNOWLEDGE_BRIEFLY,

      priority:
        ACTION_PRIORITIES
          .PROTECT_FLOW,

      reason:
        "The memory may be relevant, but active flow should not be interrupted.",

      source:
        "adaptive-conflict-resolution",
    };
  }

  if (
    signals.includes(
      ADAPTATION_SIGNALS
        .INFORMATION_OVERLOAD
    ) &&
    !includesValue(
      firstCandidate.action,
      [
        ADAPTIVE_ACTIONS
          .WAIT,

        ADAPTIVE_ACTIONS
          .SAVE_AND_PAUSE,

        ADAPTIVE_ACTIONS
          .PRESERVE_SESSION_HANDOFF,

        ADAPTIVE_ACTIONS
          .END_POSITIVELY,

        ADAPTIVE_ACTIONS
          .CLARIFY_FORGET_REQUEST,

        ADAPTIVE_ACTIONS
          .APPLY_FORGET_REQUEST,

        ADAPTIVE_ACTIONS
          .EXECUTE_MEMORY_ACTION,

        ADAPTIVE_ACTIONS
          .YIELD_TO_EXECUTION,
      ]
    )
  ) {
    return {
      action:
        ADAPTIVE_ACTIONS
          .OFFER_ONE_RECOMMENDATION,

      priority:
        ACTION_PRIORITIES
          .PROTECT_FLOW,

      reason:
        "Information saturation requires one concise recommendation.",

      source:
        "adaptive-conflict-resolution",
    };
  }

  return firstCandidate;
}

function chooseMentorRole({
  primaryAction,
  signals,
  context,
}) {
  switch (
    primaryAction.action
  ) {
    case ADAPTIVE_ACTIONS
      .WAIT:
      return (
        MENTOR_ROLES
          .QUIET_COMPANION
      );

    case ADAPTIVE_ACTIONS
      .REFLECT_GENTLY:

    case ADAPTIVE_ACTIONS
      .RESTORE_CONTEXT:

    case ADAPTIVE_ACTIONS
      .RELEASE_PRESSURE:
      return (
        MENTOR_ROLES
          .REFLECTOR
      );

    case ADAPTIVE_ACTIONS
      .RESTORE_PROJECT_CONTEXT:
      return (
        MENTOR_ROLES
          .FACILITATOR
      );

    case ADAPTIVE_ACTIONS
      .TEACH_ONE_CONCEPT:
      return (
        MENTOR_ROLES
          .TEACHER
      );

    case ADAPTIVE_ACTIONS
      .MOVE_TO_CREATION:

    case ADAPTIVE_ACTIONS
      .MOVE_TO_NEXT_TASK:

    case ADAPTIVE_ACTIONS
      .MOVE_TO_REFINEMENT:

    case ADAPTIVE_ACTIONS
      .MOVE_TO_PUBLISHING:

    case ADAPTIVE_ACTIONS
      .YIELD_TO_EXECUTION:
      return (
        MENTOR_ROLES
          .CREATIVE_DIRECTOR
      );

    case ADAPTIVE_ACTIONS
      .CONTINUE_BRAINSTORMING:
      return (
        MENTOR_ROLES
          .COLLABORATOR
      );

    case ADAPTIVE_ACTIONS
      .CAPTURE_AND_CONTINUE:

    case ADAPTIVE_ACTIONS
      .RECALL_WITH_PERMISSION:

    case ADAPTIVE_ACTIONS
      .CLARIFY_FORGET_REQUEST:

    case ADAPTIVE_ACTIONS
      .APPLY_FORGET_REQUEST:

    case ADAPTIVE_ACTIONS
      .EXECUTE_MEMORY_ACTION:

    case ADAPTIVE_ACTIONS
      .PRESERVE_SESSION_HANDOFF:

    case ADAPTIVE_ACTIONS
      .SAVE_AND_PAUSE:
      return (
        MENTOR_ROLES
          .FACILITATOR
      );

    default:
      break;
  }

  if (
    signals.includes(
      ADAPTATION_SIGNALS
        .BUILD_MODE
    )
  ) {
    return (
      MENTOR_ROLES
        .GUIDE
    );
  }

  const preferredRole =
    cleanString(
      context
        ?.preferredMentorRole
    );

  if (
    Object.values(
      MENTOR_ROLES
    ).includes(
      preferredRole
    )
  ) {
    return preferredRole;
  }

  if (
    signals.includes(
      ADAPTATION_SIGNALS
        .GUIDANCE_REQUESTED
    )
  ) {
    return (
      MENTOR_ROLES
        .GUIDE
    );
  }

  return (
    MENTOR_ROLES
      .LISTENER
  );
}

function chooseLeadershipStance({
  role,
  primaryAction,
  signals,
  context,
}) {
  if (
    primaryAction.action ===
      ADAPTIVE_ACTIONS.WAIT
  ) {
    return (
      LEADERSHIP_STANCES
        .HOLD_POSITION
    );
  }

  if (
    includesValue(
      primaryAction.action,
      [
        ADAPTIVE_ACTIONS
          .CLARIFY_FORGET_REQUEST,

        ADAPTIVE_ACTIONS
          .APPLY_FORGET_REQUEST,

        ADAPTIVE_ACTIONS
          .EXECUTE_MEMORY_ACTION,

        ADAPTIVE_ACTIONS
          .END_POSITIVELY,
      ]
    )
  ) {
    return (
      LEADERSHIP_STANCES
        .HAND_BACK_CONTROL
    );
  }

  if (
    context
      ?.creatorExplicitlyAskedForGuidance ||
    context
      ?.creatorExplicitlyAskedForNextStep
  ) {
    return (
      LEADERSHIP_STANCES
        .LEAD
    );
  }

  if (
    EXECUTION_ADAPTIVE_ACTIONS
      .includes(
        primaryAction.action
      ) ||
    primaryAction.action ===
      ADAPTIVE_ACTIONS
        .TEACH_ONE_CONCEPT
  ) {
    return (
      LEADERSHIP_STANCES
        .LEAD
    );
  }

  if (
    signals.includes(
      ADAPTATION_SIGNALS
        .FLOW_MODE
    )
  ) {
    return (
      LEADERSHIP_STANCES
        .FOLLOW
    );
  }

  if (
    role ===
      MENTOR_ROLES
        .COLLABORATOR
  ) {
    return (
      LEADERSHIP_STANCES
        .WALK_BESIDE
    );
  }

  return (
    LEADERSHIP_STANCES
      .WALK_BESIDE
  );
}

function chooseInterventionLevel({
  primaryAction,
  signals,
}) {
  if (
    primaryAction.action ===
      ADAPTIVE_ACTIONS.WAIT
  ) {
    return (
      INTERVENTION_LEVELS
        .NONE
    );
  }

  if (
    includesValue(
      primaryAction.action,
      [
        ADAPTIVE_ACTIONS
          .ACKNOWLEDGE_BRIEFLY,

        ADAPTIVE_ACTIONS
          .CAPTURE_AND_CONTINUE,

        ADAPTIVE_ACTIONS
          .MOVE_TO_NEXT_TASK,

        ADAPTIVE_ACTIONS
          .YIELD_TO_EXECUTION,

        ADAPTIVE_ACTIONS
          .APPLY_FORGET_REQUEST,

        ADAPTIVE_ACTIONS
          .EXECUTE_MEMORY_ACTION,

        ADAPTIVE_ACTIONS
          .PRESERVE_SESSION_HANDOFF,

        ADAPTIVE_ACTIONS
          .SAVE_AND_PAUSE,

        ADAPTIVE_ACTIONS
          .END_POSITIVELY,
      ]
    )
  ) {
    return (
      INTERVENTION_LEVELS
        .MINIMAL
    );
  }

  if (
    signals.includes(
      ADAPTATION_SIGNALS
        .INFORMATION_OVERLOAD
    ) ||
    signals.includes(
      ADAPTATION_SIGNALS
        .HIGH_MOMENTUM
    ) ||
    signals.includes(
      ADAPTATION_SIGNALS
        .BUILD_MODE
    )
  ) {
    return (
      INTERVENTION_LEVELS
        .LIGHT
    );
  }

  if (
    includesValue(
      primaryAction.action,
      [
        ADAPTIVE_ACTIONS
          .REFLECT_GENTLY,

        ADAPTIVE_ACTIONS
          .RESTORE_CONTEXT,

        ADAPTIVE_ACTIONS
          .RESTORE_PROJECT_CONTEXT,

        ADAPTIVE_ACTIONS
          .CONTINUE_BRAINSTORMING,

        ADAPTIVE_ACTIONS
          .TEACH_ONE_CONCEPT,
      ]
    )
  ) {
    return (
      INTERVENTION_LEVELS
        .MODERATE
    );
  }

  return (
    INTERVENTION_LEVELS
      .LIGHT
  );
}

function chooseResponseDepth({
  primaryAction,
  interventionLevel,
  signals,
  context,
  progressionPlan,
}) {
  if (
    primaryAction.action ===
      ADAPTIVE_ACTIONS.WAIT
  ) {
    return (
      RESPONSE_DEPTHS
        .SILENT
    );
  }

  if (
    includesValue(
      primaryAction.action,
      [
        ADAPTIVE_ACTIONS
          .ACKNOWLEDGE_BRIEFLY,

        ADAPTIVE_ACTIONS
          .CAPTURE_AND_CONTINUE,

        ADAPTIVE_ACTIONS
          .MOVE_TO_NEXT_TASK,

        ADAPTIVE_ACTIONS
          .MOVE_TO_CREATION,

        ADAPTIVE_ACTIONS
          .MOVE_TO_REFINEMENT,

        ADAPTIVE_ACTIONS
          .MOVE_TO_PUBLISHING,

        ADAPTIVE_ACTIONS
          .YIELD_TO_EXECUTION,

        ADAPTIVE_ACTIONS
          .APPLY_FORGET_REQUEST,

        ADAPTIVE_ACTIONS
          .EXECUTE_MEMORY_ACTION,

        ADAPTIVE_ACTIONS
          .PRESERVE_SESSION_HANDOFF,

        ADAPTIVE_ACTIONS
          .SAVE_AND_PAUSE,

        ADAPTIVE_ACTIONS
          .END_POSITIVELY,
      ]
    )
  ) {
    return (
      RESPONSE_DEPTHS
        .ONE_LINE
    );
  }

  if (
    primaryAction.action ===
      ADAPTIVE_ACTIONS
        .CLARIFY_FORGET_REQUEST
  ) {
    return (
      RESPONSE_DEPTHS
        .SHORT
    );
  }

  /**
   * Current workload outranks remembered depth.
   */
  if (
    signals.includes(
      ADAPTATION_SIGNALS
        .BUILD_MODE
    ) ||
    signals.includes(
      ADAPTATION_SIGNALS
        .FLOW_MODE
    ) ||
    signals.includes(
      ADAPTATION_SIGNALS
        .HIGH_MOMENTUM
    ) ||
    signals.includes(
      ADAPTATION_SIGNALS
        .INFORMATION_OVERLOAD
    ) ||
    signals.includes(
      ADAPTATION_SIGNALS
        .LOW_ENERGY
    ) ||
    interventionLevel ===
      INTERVENTION_LEVELS
        .MINIMAL
  ) {
    return (
      RESPONSE_DEPTHS
        .SHORT
    );
  }

  const preferredDepth =
    cleanString(
      context
        ?.preferredResponseDepth
    );

  if (
    Object.values(
      RESPONSE_DEPTHS
    ).includes(
      preferredDepth
    )
  ) {
    return preferredDepth;
  }

  const progressionLength =
    getNestedValue(
      progressionPlan,
      "progression.responseLength",
      null
    );

  switch (
    progressionLength
  ) {
    case "silent":
      return (
        RESPONSE_DEPTHS
          .SILENT
      );

    case "detailed":
      return (
        RESPONSE_DEPTHS
          .DETAILED
      );

    case "medium":
      return (
        RESPONSE_DEPTHS
          .MEDIUM
      );

    case "minimal":
      return (
        RESPONSE_DEPTHS
          .ONE_LINE
      );

    case "short":
      return (
        RESPONSE_DEPTHS
          .SHORT
      );

    default:
      break;
  }

  if (
    signals.includes(
      ADAPTATION_SIGNALS
        .EXPLORATION_MODE
    ) ||
    signals.includes(
      ADAPTATION_SIGNALS
        .LEARNING_MODE
    ) ||
    signals.includes(
      ADAPTATION_SIGNALS
        .REFLECTION_MODE
    )
  ) {
    return (
      RESPONSE_DEPTHS
        .MEDIUM
    );
  }

  return (
    RESPONSE_DEPTHS
      .SHORT
  );
}

function chooseQuestionPolicy({
  primaryAction,
  signals,
  progressionPlan,
}) {
  if (
    primaryAction.action ===
      ADAPTIVE_ACTIONS
        .CLARIFY_FORGET_REQUEST
  ) {
    return {
      policy:
        QUESTION_POLICIES
          .ONE_REQUIRED,

      maximumQuestions: 1,
    };
  }

  if (
    includesValue(
      primaryAction.action,
      [
        ADAPTIVE_ACTIONS
          .WAIT,

        ADAPTIVE_ACTIONS
          .MOVE_TO_CREATION,

        ADAPTIVE_ACTIONS
          .MOVE_TO_NEXT_TASK,

        ADAPTIVE_ACTIONS
          .MOVE_TO_REFINEMENT,

        ADAPTIVE_ACTIONS
          .MOVE_TO_PUBLISHING,

        ADAPTIVE_ACTIONS
          .YIELD_TO_EXECUTION,

        ADAPTIVE_ACTIONS
          .SAVE_AND_PAUSE,

        ADAPTIVE_ACTIONS
          .PRESERVE_SESSION_HANDOFF,

        ADAPTIVE_ACTIONS
          .APPLY_FORGET_REQUEST,

        ADAPTIVE_ACTIONS
          .EXECUTE_MEMORY_ACTION,

        ADAPTIVE_ACTIONS
          .END_POSITIVELY,
      ]
    )
  ) {
    return {
      policy:
        QUESTION_POLICIES
          .NONE,

      maximumQuestions: 0,
    };
  }

  if (
    signals.includes(
      ADAPTATION_SIGNALS
        .GUIDANCE_NOT_WANTED
    ) ||
    signals.includes(
      ADAPTATION_SIGNALS
        .INFORMATION_OVERLOAD
    )
  ) {
    return {
      policy:
        QUESTION_POLICIES
          .NONE,

      maximumQuestions: 0,
    };
  }

  const plannedMaximum =
    Number(
      getNestedValue(
        progressionPlan,
        "progression.maximumQuestions",
        1
      )
    );

  const safeMaximum =
    Number.isFinite(
      plannedMaximum
    )
      ? Math.max(
          0,
          Math.min(
            plannedMaximum,
            1
          )
        )
      : 1;

  if (
    primaryAction.action ===
      ADAPTIVE_ACTIONS
        .ASK_ONE_QUESTION
  ) {
    return {
      policy:
        QUESTION_POLICIES
          .ONE_REQUIRED,

      maximumQuestions: 1,
    };
  }

  if (
    primaryAction.action ===
      ADAPTIVE_ACTIONS
        .CONTINUE_BRAINSTORMING
  ) {
    return {
      policy:
        QUESTION_POLICIES
          .ONE_OPTIONAL,

      maximumQuestions:
        safeMaximum,
    };
  }

  return {
    policy:
      QUESTION_POLICIES
        .CREATOR_LED,

    maximumQuestions:
      safeMaximum,
  };
}

function chooseMemoryPolicy({
  memoryPlan,
  signals,
  primaryAction,
}) {
  const hasInstructions =
    asArray(
      memoryPlan
        ?.instructions
    ).length > 0;

  const shouldRecall =
    Boolean(
      memoryPlan
        ?.recall
        ?.shouldRecall
    );

  const forgetRequested =
    Boolean(
      memoryPlan
        ?.forget
        ?.requested
    );

  const forgetRequiresClarification =
    Boolean(
      memoryPlan
        ?.forget
        ?.requiresClarification
    );

  if (
    forgetRequested &&
    forgetRequiresClarification
  ) {
    return (
      MEMORY_POLICIES
        .FORGET_REQUIRES_CLARIFICATION
    );
  }

  if (
    forgetRequested
  ) {
    return (
      MEMORY_POLICIES
        .FORGET_ONLY
    );
  }

  if (
    primaryAction.action ===
      ADAPTIVE_ACTIONS
        .EXECUTE_MEMORY_ACTION
  ) {
    return (
      MEMORY_POLICIES
        .MEMORY_ACTION_ONLY
    );
  }

  if (
    primaryAction.action ===
      ADAPTIVE_ACTIONS
        .PRESERVE_SESSION_HANDOFF ||
    (
      primaryAction.action ===
        ADAPTIVE_ACTIONS
          .SAVE_AND_PAUSE &&
      signals.includes(
        ADAPTATION_SIGNALS
          .SESSION_HANDOFF_AVAILABLE
      )
    )
  ) {
    return (
      MEMORY_POLICIES
        .PRESERVE_HANDOFF
    );
  }

  if (
    primaryAction.action ===
      ADAPTIVE_ACTIONS
        .RESTORE_PROJECT_CONTEXT
  ) {
    return (
      MEMORY_POLICIES
        .RESTORE_CONTEXT
    );
  }

  if (
    signals.includes(
      ADAPTATION_SIGNALS
        .FLOW_MODE
    ) &&
    !signals.includes(
      ADAPTATION_SIGNALS
        .BRIEF_DETOUR
    )
  ) {
    return hasInstructions
      ? MEMORY_POLICIES
          .CAPTURE_ONLY
      : MEMORY_POLICIES
          .INFORM_SILENTLY;
  }

  if (
    hasInstructions &&
    shouldRecall
  ) {
    return (
      MEMORY_POLICIES
        .CAPTURE_AND_RECALL
    );
  }

  if (
    shouldRecall
  ) {
    return (
      MEMORY_POLICIES
        .RECALL_WITH_PERMISSION
    );
  }

  if (
    hasInstructions
  ) {
    return (
      MEMORY_POLICIES
        .CAPTURE_ONLY
    );
  }

  return (
    MEMORY_POLICIES
      .INFORM_SILENTLY
  );
}

function chooseMemoryExecutionPolicy({
  memoryPolicy,
  primaryAction,
}) {
  switch (
    memoryPolicy
  ) {
    case MEMORY_POLICIES
      .FORGET_REQUIRES_CLARIFICATION:
      return (
        MEMORY_EXECUTION_POLICIES
          .BLOCK
      );

    case MEMORY_POLICIES
      .FORGET_ONLY:
      return (
        MEMORY_EXECUTION_POLICIES
          .ALLOW_FORGET
      );

    case MEMORY_POLICIES
      .PRESERVE_HANDOFF:
      return (
        MEMORY_EXECUTION_POLICIES
          .ALLOW_HANDOFF
      );

    case MEMORY_POLICIES
      .MEMORY_ACTION_ONLY:
      return (
        MEMORY_EXECUTION_POLICIES
          .ALLOW_MEMORY_ACTION
      );

    case MEMORY_POLICIES
      .CAPTURE_ONLY:

    case MEMORY_POLICIES
      .CAPTURE_AND_RECALL:
      return (
        MEMORY_EXECUTION_POLICIES
          .ALLOW_CAPTURE
      );

    default:
      break;
  }

  if (
    primaryAction.action ===
      ADAPTIVE_ACTIONS
        .CLARIFY_FORGET_REQUEST
  ) {
    return (
      MEMORY_EXECUTION_POLICIES
        .BLOCK
    );
  }

  return (
    MEMORY_EXECUTION_POLICIES
      .BLOCK
  );
}

function combineResponseGuidance({
  primaryAction,
  role,
  leadershipStance,
  interventionLevel,
  responseDepth,
  questionPolicy,
  memoryPolicy,
  memoryExecutionPolicy,
  conversationPlan,
  reflectionPlan,
  progressionPlan,
  memoryPlan,
  signals,
}) {
  const guidance = [
    ...asArray(
      conversationPlan
        ?.responseGuidance
    ),

    ...asArray(
      reflectionPlan
        ?.responseGuidance
    ),

    ...asArray(
      progressionPlan
        ?.responseGuidance
    ),

    ...asArray(
      memoryPlan
        ?.responseGuidance
    ),

    `Active Mentor role: ${role}.`,

    `Leadership stance: ${leadershipStance}.`,

    `Intervention level: ${interventionLevel}.`,

    `Response depth: ${responseDepth}.`,

    `Question policy: ${questionPolicy.policy}.`,

    `Maximum questions: ${questionPolicy.maximumQuestions}.`,

    `Memory policy: ${memoryPolicy}.`,

    `Memory execution policy: ${memoryExecutionPolicy}.`,

    `Primary adaptive action: ${primaryAction.action}.`,

    "Demonstrate understanding before introducing a new direction when the current action requires conversation.",

    "Prefer the creator's present state over historical assumptions.",

    "Use remembered preferences as guidance, not fixed rules.",

    "Treat project decisions as scoped truth until the creator changes them.",

    "Creator corrections override remembered or specialist assumptions.",

    "Planning a memory instruction does not by itself authorise persistence.",

    "Do not expose internal specialist-agent machinery in ordinary creator-facing conversation.",

    "Do not maximise response length.",

    "Do not compete with the creator for control of the conversation.",

    "Leave the creator with greater clarity, confidence or momentum.",
  ];

  if (
    signals.includes(
      ADAPTATION_SIGNALS
        .PROGRESSION_YIELDS_TO_EXECUTION
    )
  ) {
    guidance.push(
      "Progression has explicitly yielded to execution.",

      "Do not reinsert reflection, recall, teaching or another planning question before the requested action.",

      "Move directly into the execution path."
    );
  }

  if (
    signals.includes(
      ADAPTATION_SIGNALS
        .CREATOR_MEMORY_CONTEXT_AVAILABLE
    )
  ) {
    guidance.push(
      "Use long-term creator memory only when it improves continuity, reduces repetition or protects momentum.",

      "Present creator direction overrides remembered preferences and historical patterns.",

      "Do not mention remembered information merely to demonstrate that memory exists."
    );
  }

  if (
    signals.includes(
      ADAPTATION_SIGNALS
        .SPECIALIST_MEMORY_SIGNAL
    )
  ) {
    guidance.push(
      "Specialist-agent observations may inform the response, but should not be presented as unquestionable project truth.",

      "Creator corrections override specialist-agent assumptions."
    );
  }

  if (
    signals.includes(
      ADAPTATION_SIGNALS
        .PROJECT_MEMORY_AVAILABLE
    )
  ) {
    guidance.push(
      "Use project-scoped memory to reduce repeated questions.",

      "Do not allow information from another project to bleed into the active project."
    );
  }

  if (
    signals.includes(
      ADAPTATION_SIGNALS
        .PROJECT_CORRECTION_ACTIVE
    )
  ) {
    guidance.push(
      "A creator correction is active.",

      "Use the corrected current project truth rather than the superseded remembered assumption."
    );
  }

  if (
    primaryAction.action ===
      ADAPTIVE_ACTIONS
        .CAPTURE_AND_CONTINUE
  ) {
    guidance.push(
      "Acknowledge the thought without opening a long discussion.",

      "Preserve enough context to revisit it later.",

      "Return to the previous task smoothly.",

      "Do not make the memory capture itself the focus of the conversation."
    );
  }

  if (
    primaryAction.action ===
      ADAPTIVE_ACTIONS
        .RECALL_WITH_PERMISSION
  ) {
    guidance.push(
      "Recall only the minimum information needed for continuity.",

      "Explain briefly why remembered context is relevant when useful.",

      "Allow the creator to correct remembered project facts immediately.",

      "If the memory was previously deferred, let the creator decline and continue."
    );
  }

  if (
    primaryAction.action ===
      ADAPTIVE_ACTIONS
        .CLARIFY_FORGET_REQUEST
  ) {
    guidance.push(
      "Ask only the minimum clarification necessary to identify the memory to forget.",

      "Do not execute any destructive memory instruction while the target remains ambiguous.",

      "Do not turn the clarification into a wider discussion."
    );
  }

  if (
    primaryAction.action ===
      ADAPTIVE_ACTIONS
        .APPLY_FORGET_REQUEST
  ) {
    guidance.push(
      "Respect the creator's explicit forget request.",

      "Do not claim deletion succeeded until CreatorMemory confirms it.",

      "Do not recreate the deleted conclusion from inference alone."
    );
  }

  if (
    primaryAction.action ===
      ADAPTIVE_ACTIONS
        .EXECUTE_MEMORY_ACTION
  ) {
    guidance.push(
      "Complete the pending memory-control operation before unrelated creative progression.",

      "CreatorMemory remains the final persistence authority.",

      "Resume ordinary progression only after the operation resolves."
    );
  }

  if (
    primaryAction.action ===
      ADAPTIVE_ACTIONS
        .PRESERVE_SESSION_HANDOFF ||
    memoryPolicy ===
      MEMORY_POLICIES
        .PRESERVE_HANDOFF
  ) {
    guidance.push(
      "Preserve where the creator stopped, what was last completed and the most useful next step.",

      "Do not introduce another task while the creator is leaving.",

      "Make the future return feel easy rather than unfinished.",

      "Do not claim the return point was persisted unless CreatorMemory confirms it."
    );
  }

  if (
    primaryAction.action ===
      ADAPTIVE_ACTIONS
        .RESTORE_PROJECT_CONTEXT
  ) {
    guidance.push(
      "Restore only the landmarks needed to continue.",

      "Use the stored session handoff only when it belongs to the active project.",

      "Mention the last meaningful decision, current position and next useful step.",

      "Do not dump the full project history."
    );
  }

  if (
    primaryAction.action ===
      ADAPTIVE_ACTIONS
        .MOVE_TO_NEXT_TASK ||
    primaryAction.action ===
      ADAPTIVE_ACTIONS
        .YIELD_TO_EXECUTION
  ) {
    guidance.push(
      "Do not reopen completed philosophy or architecture discussions.",

      "Provide or execute the next concrete task immediately.",

      "Follow the creator's established working mode."
    );
  }

  if (
    primaryAction.action ===
      ADAPTIVE_ACTIONS
        .MOVE_TO_CREATION
  ) {
    guidance.push(
      "Treat the available context as sufficient for a first version.",

      "Allow discovery to continue through creation.",

      "Do not require perfect clarity before beginning."
    );
  }

  return uniqueValues(
    guidance
  );
}

function combineGuardRails({
  conversationPlan,
  reflectionPlan,
  progressionPlan,
  memoryPlan,
}) {
  return uniqueValues([
    ...asArray(
      conversationPlan
        ?.guardRails
    ),

    ...asArray(
      reflectionPlan
        ?.guardRails
    ),

    ...asArray(
      progressionPlan
        ?.guardRails
    ),

    ...asArray(
      memoryPlan
        ?.guardRails
    ),

    "Do not diagnose the creator.",

    "Do not claim certainty about the creator's internal state.",

    "Do not use personalisation to manipulate engagement.",

    "Do not surface memory merely to demonstrate recall.",

    "Do not interrupt active flow with optional information.",

    "Do not use historical behaviour to override explicit present direction.",

    "Do not let a remembered response preference override required present-moment behaviour.",

    "Do not let a remembered Mentor-role preference override a required present-moment role.",

    "Do not imitate the creator's language unnaturally.",

    "Do not produce multiple next steps when one is sufficient.",

    "Do not make the creator dependent on the Mentor.",

    "Do not treat agreement as the goal; useful alignment is the goal.",

    "Do not allow specialist agents to silently overwrite creator-approved project truth.",

    "Do not mix project-scoped memory across different projects.",

    "Do not restore a session handoff from another project.",

    "Do not execute an ambiguous forget request.",

    "Do not execute memory instructions merely because they were planned.",

    "Do not treat memory recall as permission to derail the creator's current task.",

    "Do not execute a project-scoped persistence instruction against a different active project.",

    "Do not let optional reflection reclaim the turn after Progression explicitly yields to execution.",

    "Do not allow unrelated creative progression while a blocking memory-control operation is unresolved.",

    "Do not claim memory persistence, deletion or session-handoff success unless CreatorMemory confirms it.",
  ]);
}

function createExecutionPlan({
  primaryAction,
  role,
  leadershipStance,
  interventionLevel,
  responseDepth,
  questionPolicy,
  memoryPolicy,
  memoryExecutionPolicy,
  reflectionPlan,
  progressionPlan,
  memoryPlan,
  context,
}) {
  const memoryInstructions =
    cloneValue(
      memoryPlan
        ?.instructions ||
      []
    );

  const forgetPlan =
    cloneValue(
      memoryPlan
        ?.forget ||
      null
    );

  const recallPlan =
    cloneValue(
      memoryPlan
        ?.recall ||
      null
    );

  const projectId =
    getProjectId(
      context
    );

  const storedSessionHandoff =
    context
      ?.sessionHandoff ||
    context
      ?.creatorMemoryContext
      ?.sessionHandoff ||
    null;

  const shouldCaptureMemory =
    includesValue(
      memoryPolicy,
      [
        MEMORY_POLICIES
          .CAPTURE_ONLY,

        MEMORY_POLICIES
          .CAPTURE_AND_RECALL,

        MEMORY_POLICIES
          .PRESERVE_HANDOFF,
      ]
    );

  const shouldRecallMemory =
    includesValue(
      memoryPolicy,
      [
        MEMORY_POLICIES
          .RECALL_WITH_PERMISSION,

        MEMORY_POLICIES
          .CAPTURE_AND_RECALL,

        MEMORY_POLICIES
          .RESTORE_CONTEXT,
      ]
    );

  const shouldApplyForget =
    memoryPolicy ===
      MEMORY_POLICIES
        .FORGET_ONLY &&
    Boolean(
      forgetPlan &&
      !forgetPlan
        .requiresClarification
    );

  const shouldClarifyForget =
    memoryPolicy ===
      MEMORY_POLICIES
        .FORGET_REQUIRES_CLARIFICATION;

  const shouldPreserveSessionHandoff =
    Boolean(
      primaryAction.action ===
        ADAPTIVE_ACTIONS
          .PRESERVE_SESSION_HANDOFF ||
      memoryPolicy ===
        MEMORY_POLICIES
          .PRESERVE_HANDOFF
    );

  const shouldRestoreProjectContext =
    primaryAction.action ===
      ADAPTIVE_ACTIONS
        .RESTORE_PROJECT_CONTEXT;

  const shouldExecuteMemoryInstructions =
    memoryExecutionPolicy !==
      MEMORY_EXECUTION_POLICIES
        .BLOCK &&
    memoryInstructions.length >
      0;

  const shouldYieldToExecution =
    primaryAction.action ===
      ADAPTIVE_ACTIONS
        .YIELD_TO_EXECUTION;

  const shouldExecuteMemoryAction =
    primaryAction.action ===
      ADAPTIVE_ACTIONS
        .EXECUTE_MEMORY_ACTION;

  return {
    action:
      primaryAction.action,

    MentorRole:
      role,

    leadershipStance,

    interventionLevel,

    responseDepth,

    questionPolicy,

    memoryPolicy,

    memoryExecutionPolicy,

    timing:
      cloneValue(
        reflectionPlan
          ?.timing ||
        {
          responseDelayMs: 0,

          silenceWindowMs: 0,

          allowCreatorToContinue:
            false,

          canCancelResponseIfCreatorContinues:
            true,
        }
      ),

    shouldGenerateResponse:
      primaryAction.action !==
      ADAPTIVE_ACTIONS
        .WAIT,

    shouldWait:
      primaryAction.action ===
      ADAPTIVE_ACTIONS
        .WAIT,

    shouldMoveForward:
      EXECUTION_ADAPTIVE_ACTIONS
        .includes(
          primaryAction
            .action
        ),

    shouldYieldToExecution,

    shouldCaptureMemory,

    shouldRecallMemory,

    shouldExecuteMemoryInstructions,

    shouldExecuteMemoryAction,

    shouldRestoreProjectContext,

    shouldPreserveSessionHandoff,

    shouldApplyForget,

    shouldClarifyForget,

    activeProjectId:
      projectId,

    memoryInstructions,

    recallPlan,

    forgetPlan,

    creatorMemoryContext:
      cloneValue(
        context
          ?.creatorMemoryContext ||
        null
      ),

    projectMemory: {
      activeProjectId:
        projectId,

      hasProjectMemory:
        memoryPlanHasProjectMemory(
          memoryPlan
        ) ||
        asArray(
          context
            ?.existingProjectMemories
        ).length > 0,

      hasSessionHandoff:
        memoryPlanHasSessionHandoff(
          memoryPlan
        ),

      storedSessionHandoff:
        cloneValue(
          storedSessionHandoff
        ),

      storedSessionHandoffAvailable:
        contextHasStoredSessionHandoff(
          context
        ),

      sourceAgent:
        context
          ?.sourceAgent ||
        null,

      specialistSignalsPresent:
        contextHasSpecialistMemorySignals(
          context
        ),
    },

    reflectionCandidate:
      cloneValue(
        reflectionPlan
          ?.reflection
          ?.candidate ||
        null
      ),

    progressionTarget:
      getNestedValue(
        progressionPlan,
        "progression.primaryAction",
        null
      ),

    progressionDecision:
      progressionPlan
        ?.decision ||
      null,
  };
}

function createDecisionSummary({
  primaryAction,
  role,
  leadershipStance,
  interventionLevel,
  responseDepth,
  memoryPolicy,
  memoryExecutionPolicy,
  signals,
}) {
  return (
    `Use ${primaryAction.action} as the primary action. ` +
    `The Mentor should act as ${role}, ` +
    `using a ${leadershipStance} stance with ` +
    `${interventionLevel} intervention and ` +
    `${responseDepth} response depth. ` +
    `Memory policy is ${memoryPolicy}; execution policy is ${memoryExecutionPolicy}. ` +
    `Active signals: ${
      signals.length > 0
        ? signals.join(", ")
        : "none"
    }.`
  );
}

function createMemoryExecutionResult({
  applied = [],
  skipped = [],
  errors = [],
  reason = null,
  status = null,
  executionPolicy = null,
} = {}) {
  const safeApplied =
    asArray(
      applied
    );

  const safeSkipped =
    asArray(
      skipped
    );

  const safeErrors =
    asArray(
      errors
    );

  const appliedCount =
    safeApplied.length;

  const skippedCount =
    safeSkipped.length;

  const errorCount =
    safeErrors.length;

  const attemptedCount =
    appliedCount +
    skippedCount +
    errorCount;

  const fullySuccessful =
    attemptedCount > 0 &&
    skippedCount === 0 &&
    errorCount === 0 &&
    appliedCount ===
      attemptedCount;

  const partiallySuccessful =
    appliedCount > 0 &&
    !fullySuccessful;

  const failed =
    appliedCount === 0 &&
    errorCount > 0;

  const allSkippedAreIntentional =
    skippedCount > 0 &&
    safeSkipped.every(
      (item) =>
        item?.intentionalNoOp ===
        true
    );

  const noOp =
    appliedCount === 0 &&
    errorCount === 0 &&
    skippedCount > 0 &&
    allSkippedAreIntentional;

  const notApplied =
    appliedCount === 0 &&
    errorCount === 0 &&
    skippedCount > 0 &&
    !allSkippedAreIntentional;

  let resolvedStatus =
    status;

  if (!resolvedStatus) {
    if (
      attemptedCount === 0
    ) {
      resolvedStatus =
        "empty";
    } else if (
      fullySuccessful
    ) {
      resolvedStatus =
        "fully-successful";
    } else if (
      partiallySuccessful
    ) {
      resolvedStatus =
        "partially-successful";
    } else if (
      failed
    ) {
      resolvedStatus =
        "failed";
    } else if (
      noOp
    ) {
      resolvedStatus =
        "no-op";
    } else if (
      notApplied
    ) {
      resolvedStatus =
        "not-applied";
    }
  }

  return {
    applied:
      cloneValue(
        safeApplied
      ),

    skipped:
      cloneValue(
        safeSkipped
      ),

    errors:
      cloneValue(
        safeErrors
      ),

    attemptedCount,

    appliedCount,

    skippedCount,

    errorCount,

    successful:
      fullySuccessful ||
      partiallySuccessful,

    fullySuccessful,

    partiallySuccessful,

    failed,

    noOp,

    notApplied,

    status:
      resolvedStatus,

    reason,

    executionPolicy,
  };
}
/**
 * Restricts instructions according to Adaptive's execution
 * authorisation.
 */
function filterInstructionsByExecutionPolicy({
  instructions,
  executionPolicy,
}) {
  const executable = [];

  const skipped = [];

  asArray(
    instructions
  ).forEach(
    (instruction) => {
      const action =
        cleanString(
          instruction
            ?.action
        );

      const category =
        cleanString(
          instruction
            ?.category
        );

      const allowed =
        (() => {
          switch (
            executionPolicy
          ) {
            case MEMORY_EXECUTION_POLICIES
              .ALLOW_ALL_PLANNED:
              return true;

            case MEMORY_EXECUTION_POLICIES
              .ALLOW_CAPTURE:
              return (
                action !==
                  "forget-memory" &&
                category !==
                  "forget-memory"
              );

            case MEMORY_EXECUTION_POLICIES
              .ALLOW_FORGET:
              return (
                action ===
                  "forget-memory"
              );

            case MEMORY_EXECUTION_POLICIES
              .ALLOW_HANDOFF:
              return (
                action ===
                  "save-session-handoff" ||
                category ===
                  "session-handoff"
              );

            case MEMORY_EXECUTION_POLICIES
              .ALLOW_MEMORY_ACTION:
              return (
                MEMORY_CONTROL_ACTIONS
                  .includes(
                    action
                  ) ||
                action ===
                  "capture-observation" ||
                action ===
                  "reinforce-memory" ||
                action ===
                  "supersede-memory"
              );

            default:
              return false;
          }
        })();

      if (allowed) {
        executable.push(
          instruction
        );

        return;
      }

      skipped.push({
        instruction:
          cloneValue(
            instruction
          ),

        reason:
          "adaptive-memory-execution-not-authorised",

        executionPolicy,
      });
    }
  );

  return {
    executable,

    skipped,
  };
}

/**
 * Adaptive project-boundary preflight.
 *
 * CreatorMemory remains final persistence authority.
 */
function preflightMemoryInstructions({
  instructions,
  activeProjectId,
}) {
  const executable = [];

  const skipped = [];

  asArray(
    instructions
  ).forEach(
    (instruction) => {
      const scope =
        cleanString(
          instruction
            ?.scope ||
          instruction
            ?.payload
            ?.scope
        );

      const instructionProjectId =
        cleanString(
          instruction
            ?.projectId ||
          instruction
            ?.payload
            ?.projectId ||
          instruction
            ?.payload
            ?.metadata
            ?.projectId
        );

      const relatedProjectIds =
        asArray(
          instruction
            ?.payload
            ?.relatedProjectIds
        )
          .map(
            cleanString
          )
          .filter(
            Boolean
          );

      const isProjectScoped =
        scope ===
          "project" ||
        Boolean(
          instructionProjectId
        ) ||
        relatedProjectIds
          .length > 0;

      if (
        !isProjectScoped
      ) {
        executable.push(
          instruction
        );

        return;
      }

      if (
        !activeProjectId
      ) {
        skipped.push({
          instruction:
            cloneValue(
              instruction
            ),

          reason:
            "adaptive-project-boundary-required",
        });

        return;
      }

      const matchesDirect =
        !instructionProjectId ||
        instructionProjectId ===
          activeProjectId;

      const matchesRelated =
        relatedProjectIds
          .length === 0 ||
        relatedProjectIds
          .includes(
            activeProjectId
          );

      if (
        !matchesDirect ||
        !matchesRelated
      ) {
        skipped.push({
          instruction:
            cloneValue(
              instruction
            ),

          reason:
            "adaptive-cross-project-memory-blocked",

          activeProjectId,

          instructionProjectId:
            instructionProjectId ||
            null,
        });

        return;
      }

      executable.push(
        instruction
      );
    }
  );

  return {
    executable,

    skipped,
  };
}

function createFallbackAdaptivePlan({
  message,
  context,
  error = null,
}) {
  return {
    id:
      createAdaptivePlanId(),

    engine:
      "adaptive-mentor-engine",

    version:
      ADAPTIVE_MENTOR_ENGINE_VERSION,

    input: {
      message:
        cleanString(
          message
        ),
    },

    primaryAction: {
      action:
        ADAPTIVE_ACTIONS
          .ACKNOWLEDGE_BRIEFLY,

      priority:
        ACTION_PRIORITIES
          .GENERAL_LISTENING,

      reason:
        "Adaptive planning was unavailable.",

      source:
        "fallback",
    },

    candidateActions: [],

    behaviour: {
      role:
        MENTOR_ROLES
          .LISTENER,

      leadershipStance:
        LEADERSHIP_STANCES
          .WALK_BESIDE,

      interventionLevel:
        INTERVENTION_LEVELS
          .MINIMAL,

      responseDepth:
        RESPONSE_DEPTHS
          .SHORT,

      questionPolicy: {
        policy:
          QUESTION_POLICIES
            .ONE_OPTIONAL,

        maximumQuestions: 1,
      },

      memoryPolicy:
        MEMORY_POLICIES
          .DO_NOT_USE,

      memoryExecutionPolicy:
        MEMORY_EXECUTION_POLICIES
          .BLOCK,
    },

    execution: {
      action:
        ADAPTIVE_ACTIONS
          .ACKNOWLEDGE_BRIEFLY,

      MentorRole:
        MENTOR_ROLES
          .LISTENER,

      leadershipStance:
        LEADERSHIP_STANCES
          .WALK_BESIDE,

      interventionLevel:
        INTERVENTION_LEVELS
          .MINIMAL,

      responseDepth:
        RESPONSE_DEPTHS
          .SHORT,

      questionPolicy: {
        policy:
          QUESTION_POLICIES
            .ONE_OPTIONAL,

        maximumQuestions: 1,
      },

      memoryPolicy:
        MEMORY_POLICIES
          .DO_NOT_USE,

      memoryExecutionPolicy:
        MEMORY_EXECUTION_POLICIES
          .BLOCK,

      shouldGenerateResponse:
        true,

      shouldWait:
        false,

      shouldMoveForward:
        false,

      shouldYieldToExecution:
        false,

      shouldCaptureMemory:
        false,

      shouldRecallMemory:
        false,

      shouldExecuteMemoryInstructions:
        false,

      shouldExecuteMemoryAction:
        false,

      shouldRestoreProjectContext:
        false,

      shouldPreserveSessionHandoff:
        false,

      shouldApplyForget:
        false,

      shouldClarifyForget:
        false,

      activeProjectId:
        getProjectId(
          context
        ),

      timing: {
        responseDelayMs: 600,

        silenceWindowMs: 0,

        allowCreatorToContinue:
          false,

        canCancelResponseIfCreatorContinues:
          true,
      },

      memoryInstructions:
        [],

      recallPlan: null,

      forgetPlan: null,

      creatorMemoryContext:
        null,

      projectMemory: {
        activeProjectId:
          getProjectId(
            context
          ),

        hasProjectMemory:
          false,

        hasSessionHandoff:
          false,

        storedSessionHandoff:
          null,

        storedSessionHandoffAvailable:
          false,

        sourceAgent:
          null,

        specialistSignalsPresent:
          false,
      },

      reflectionCandidate:
        null,

      progressionTarget:
        null,

      progressionDecision:
        null,
    },

    signals: [],

    responseGuidance: [
      "Use a short, warm acknowledgement.",

      "Do not introduce multiple new directions.",

      "Ask no more than one question.",

      "Keep the creator in ownership.",

      "Do not execute memory instructions from fallback state.",
    ],

    guardRails: [
      "Do not diagnose.",

      "Do not make assumptions from unavailable context.",

      "Do not overwhelm the creator.",

      "Do not execute memory deletion from fallback state.",

      "Do not execute project-scoped memory without an active project boundary.",

      "Do not claim persistence success from fallback state.",
    ],

    creatorProtocol: {
      protectTheCreator:
        true,

      creatorOwnsTheIdea:
        true,

      presentBehaviourLeads:
        true,

      memoryMustProtectAutonomy:
        true,

      planningDoesNotAuthorisePersistence:
        true,
    },

    specialistPlans: {
      conversation: null,

      reflection: null,

      progression: null,

      memory: null,
    },

    contextSnapshot:
      cloneValue(
        context
      ),

    decisionSummary:
      "Adaptive planning failed. Use minimal listening behaviour.",

    status:
      "fallback",

    error:
      error
        ? {
            message:
              error instanceof Error
                ? error.message
                : String(error),
          }
        : null,

    createdAt:
      createTimestamp(),
  };
}

function createAdaptiveMentorEngine({
  conversationPlanner = null,
  reflectionEngine = null,
  progressionEngine = null,
  creatorMemoryEngine = null,
  memory = null,
} = {}) {
  let activeMemory =
    memory ||
    null;

  const resolvedConversationPlanner =
    conversationPlanner ||
    createConversationPlanner({
      memory:
        activeMemory,
    });

  const resolvedReflectionEngine =
    reflectionEngine ||
    createReflectionEngine();

  const resolvedProgressionEngine =
    progressionEngine ||
    createProgressionEngine();

  const resolvedCreatorMemoryEngine =
    creatorMemoryEngine ||
    createCreatorMemoryEngine({
      memory:
        activeMemory,
    });

  /**
   * Supplied specialists must share the same memory authority.
   */
  if (
    typeof resolvedConversationPlanner
      .setMemory ===
      "function"
  ) {
    resolvedConversationPlanner
      .setMemory(
        activeMemory
      );
  }

  if (
    typeof resolvedCreatorMemoryEngine
      .setMemory ===
      "function"
  ) {
    resolvedCreatorMemoryEngine
      .setMemory(
        activeMemory
      );
  }

  function planMentorBehaviour({
    message = "",
    context = {},
    conversationPlan = null,
    reflectionPlan = null,
    progressionPlan = null,
    memoryPlan = null,
  } = {}) {
    try {
      const combinedContext =
        createMemoryAwareContext({
          context,

          memory:
            activeMemory,
        });

      const resolvedConversationPlan =
        conversationPlan ||
        resolvedConversationPlanner
          .planConversation({
            message,

            context:
              combinedContext,
          });

      const resolvedReflectionPlan =
        reflectionPlan ||
        resolvedReflectionEngine
          .planReflection({
            message,

            context:
              combinedContext,

            conversationPlan:
              resolvedConversationPlan,
          });

      const resolvedProgressionPlan =
        progressionPlan ||
        resolvedProgressionEngine
          .planProgression({
            message,

            context:
              combinedContext,

            conversationPlan:
              resolvedConversationPlan,

            reflectionPlan:
              resolvedReflectionPlan,
          });

      const resolvedMemoryPlan =
        memoryPlan ||
        resolvedCreatorMemoryEngine
          .planMemory({
            message,

            context:
              combinedContext,
          });

      const signals =
        collectAdaptationSignals({
          context:
            combinedContext,

          conversationPlan:
            resolvedConversationPlan,

          reflectionPlan:
            resolvedReflectionPlan,

          progressionPlan:
            resolvedProgressionPlan,

          memoryPlan:
            resolvedMemoryPlan,
        });

      const candidateActions =
        collectCandidateActions({
          context:
            combinedContext,

          conversationPlan:
            resolvedConversationPlan,

          reflectionPlan:
            resolvedReflectionPlan,

          progressionPlan:
            resolvedProgressionPlan,

          memoryPlan:
            resolvedMemoryPlan,

          signals,
        });

      const primaryAction =
        resolvePrimaryAction({
          candidates:
            candidateActions,

          signals,

          context:
            combinedContext,
        });

      const role =
        chooseMentorRole({
          primaryAction,

          signals,

          context:
            combinedContext,
        });

      const leadershipStance =
        chooseLeadershipStance({
          role,

          primaryAction,

          signals,

          context:
            combinedContext,
        });

      const interventionLevel =
        chooseInterventionLevel({
          primaryAction,

          signals,
        });

      const responseDepth =
        chooseResponseDepth({
          primaryAction,

          interventionLevel,

          signals,

          context:
            combinedContext,

          progressionPlan:
            resolvedProgressionPlan,
        });

      const questionPolicy =
        chooseQuestionPolicy({
          primaryAction,

          signals,

          progressionPlan:
            resolvedProgressionPlan,
        });

      const memoryPolicy =
        chooseMemoryPolicy({
          memoryPlan:
            resolvedMemoryPlan,

          signals,

          primaryAction,
        });

      const memoryExecutionPolicy =
        chooseMemoryExecutionPolicy({
          memoryPolicy,

          primaryAction,
        });

      const responseGuidance =
        combineResponseGuidance({
          primaryAction,

          role,

          leadershipStance,

          interventionLevel,

          responseDepth,

          questionPolicy,

          memoryPolicy,

          memoryExecutionPolicy,

          conversationPlan:
            resolvedConversationPlan,

          reflectionPlan:
            resolvedReflectionPlan,

          progressionPlan:
            resolvedProgressionPlan,

          memoryPlan:
            resolvedMemoryPlan,

          signals,
        });

      const guardRails =
        combineGuardRails({
          conversationPlan:
            resolvedConversationPlan,

          reflectionPlan:
            resolvedReflectionPlan,

          progressionPlan:
            resolvedProgressionPlan,

          memoryPlan:
            resolvedMemoryPlan,
        });

      const execution =
        createExecutionPlan({
          primaryAction,

          role,

          leadershipStance,

          interventionLevel,

          responseDepth,

          questionPolicy,

          memoryPolicy,

          memoryExecutionPolicy,

          reflectionPlan:
            resolvedReflectionPlan,

          progressionPlan:
            resolvedProgressionPlan,

          memoryPlan:
            resolvedMemoryPlan,

          context:
            combinedContext,
        });

      return {
        id:
          createAdaptivePlanId(),

        engine:
          "adaptive-mentor-engine",

        version:
          ADAPTIVE_MENTOR_ENGINE_VERSION,

        input: {
          message:
            cleanString(
              message
            ),
        },

        primaryAction,

        candidateActions:
          cloneValue(
            candidateActions
          ),

        behaviour: {
          role,

          leadershipStance,

          interventionLevel,

          responseDepth,

          questionPolicy,

          memoryPolicy,

          memoryExecutionPolicy,
        },

        execution,

        signals,

        responseGuidance,

        guardRails,

        creatorProtocol: {
          protectTheCreator:
            true,

          understandBeforeGuiding:
            true,

          meetBeforeLeading:
            true,

          presentBehaviourLeads:
            true,

          explicitCurrentContextOutranksMemory:
            true,

          longTermMemoryInforms:
            true,

          projectMemoryIsScoped:
            true,

          currentProjectIdentityIsAuthoritative:
            true,

          projectTruthMayEvolve:
            true,

          creatorConfirmedTruthOutranksInference:
            true,

          creatorCorrectionsOverrideMemory:
            true,

          rememberedPreferencesDoNotOverridePresentBehaviour:
            true,

          specialistAgentsMayInform:
            true,

          specialistAgentsDoNotOwnTruth:
            true,

          sessionHandoffProtectsMomentum:
            true,

          storedSessionHandoffMayRestoreContinuity:
            true,

          explicitForgetRequestsAreRespected:
            true,

          ambiguousForgetRequestsRequireClarification:
            true,

          memoryControlBlocksUnrelatedProgression:
            true,

          planningDoesNotAuthorisePersistence:
            true,

          persistenceClaimsRequireVerification:
            true,

          adaptivePersistenceUsesProjectPreflight:
            true,

          reflectionMayYieldToExecution:
            true,

          progressionIsFinalTrafficController:
            true,

          conversationServesCreation:
            true,

          protectMomentum:
            true,

          protectEmergence:
            true,

          protectThinkingTime:
            true,

          matchTempoBeforeChangingTempo:
            true,

          guidanceMustBeTimely:
            true,

          oneUsefulStepAtATime:
            true,

          creatorOwnsTheIdea:
            true,

          creatorMayRejectReflection:
            true,

          memoryMustProtectAutonomy:
            true,

          complexityShouldRemainBehindConversation:
            true,

          MentorShouldReduceDependence:
            true,
        },

        specialistPlans: {
          conversation:
            cloneValue(
              resolvedConversationPlan
            ),

          reflection:
            cloneValue(
              resolvedReflectionPlan
            ),

          progression:
            cloneValue(
              resolvedProgressionPlan
            ),

          memory:
            cloneValue(
              resolvedMemoryPlan
            ),
        },

        projectState: {
          activeProjectId:
            getProjectId(
              combinedContext
            ),

          activeProject:
            cloneValue(
              combinedContext
                ?.activeProject ||
              null
            ),

          activeStage:
            cloneValue(
              combinedContext
                ?.activeStage
            ),

          activeScene:
            cloneValue(
              combinedContext
                ?.activeScene
            ),

          activeCharacter:
            cloneValue(
              combinedContext
                ?.activeCharacter
            ),

          activeAsset:
            cloneValue(
              combinedContext
                ?.activeAsset
            ),

          memoryAvailable:
            memoryPlanHasProjectMemory(
              resolvedMemoryPlan
            ) ||
            asArray(
              combinedContext
                ?.existingProjectMemories
            ).length > 0,

          longTermMemoryAvailable:
            hasMeaningfulMemoryContext(
              combinedContext
                ?.creatorMemoryContext
            ),

          sessionHandoffAvailable:
            memoryPlanHasSessionHandoff(
              resolvedMemoryPlan
            ),

          storedSessionHandoffAvailable:
            contextHasStoredSessionHandoff(
              combinedContext
            ),

          specialistMemorySignalsPresent:
            contextHasSpecialistMemorySignals(
              combinedContext
            ),

          correctionActive:
            signals.includes(
              ADAPTATION_SIGNALS
                .PROJECT_CORRECTION_ACTIVE
            ),
        },

        contextSnapshot:
          cloneValue(
            combinedContext
          ),

        decisionSummary:
          createDecisionSummary({
            primaryAction,

            role,

            leadershipStance,

            interventionLevel,

            responseDepth,

            memoryPolicy,

            memoryExecutionPolicy,

            signals,
          }),

        status:
          "planned",

        createdAt:
          createTimestamp(),
      };
    } catch (error) {
      console.error(
        "AdaptiveMentorEngine planning error:",
        error
      );

      return (
        createFallbackAdaptivePlan({
          message,

          context,

          error,
        })
      );
    }
  }

  /**
   * Applies only memory instructions authorised by the
   * Adaptive execution plan.
   *
   * Pipeline:
   *
   * Adaptive plan
   * → execution authorisation
   * → project-boundary preflight
   * → CreatorMemory persistence validation
   */
  function applyMemoryPlan(
  plan
) {
  const instructions =
    asArray(
      plan
        ?.execution
        ?.memoryInstructions
    );

  const executionPolicy =
    cleanString(
      plan
        ?.execution
        ?.memoryExecutionPolicy
    ) ||
    MEMORY_EXECUTION_POLICIES
      .BLOCK;

  if (
    !activeMemory
  ) {
    return (
      createMemoryExecutionResult({
        skipped:
          instructions.map(
            (instruction) => ({
              instruction:
                cloneValue(
                  instruction
                ),

              reason:
                "No Creator Memory service is connected.",
            })
          ),

        reason:
          "No Creator Memory service is connected.",

        executionPolicy,
      })
    );
  }

  if (
    executionPolicy ===
      MEMORY_EXECUTION_POLICIES
        .BLOCK
  ) {
    return (
      createMemoryExecutionResult({
        skipped:
          instructions.map(
            (instruction) => ({
              instruction:
                cloneValue(
                  instruction
                ),

              reason:
                "Adaptive plan did not authorise memory execution.",

              intentionalNoOp:
                true,
            })
          ),

        reason:
          "Adaptive memory execution policy blocked persistence.",

        status:
          "no-op",

        executionPolicy,
      })
    );
  }

  if (
    instructions.length ===
      0
  ) {
    return (
      createMemoryExecutionResult({
        reason:
          "No memory instructions required execution.",

        status:
          "empty",

        executionPolicy,
      })
    );
  }

  const policyFilter =
    filterInstructionsByExecutionPolicy({
      instructions,

      executionPolicy,
    });

  const authorisedInstructions =
    policyFilter
      .executable;

  const policySkipped =
    policyFilter
      .skipped;

  if (
    authorisedInstructions
      .length === 0
  ) {
    return (
      createMemoryExecutionResult({
        skipped:
          policySkipped,

        reason:
          "No memory instructions were authorised by the Adaptive execution policy.",

        executionPolicy,
      })
    );
  }

  const activeProjectId =
    cleanString(
      plan
        ?.execution
        ?.activeProjectId
    ) ||
    null;

  const preflight =
    preflightMemoryInstructions({
      instructions:
        authorisedInstructions,

      activeProjectId,
    });

  const executableInstructions =
    preflight
      .executable;

  const preflightSkipped = [
    ...policySkipped,

    ...preflight
      .skipped,
  ];

  if (
    executableInstructions
      .length === 0
  ) {
    return (
      createMemoryExecutionResult({
        skipped:
          preflightSkipped,

        reason:
          "Adaptive memory preflight blocked all persistence instructions.",

        executionPolicy,
      })
    );
  }

  /**
   * CreatorMemory is the persistence authority.
   *
   * The modern batch executor is always preferred.
   */
  if (
    typeof activeMemory
      .applyMemoryInstructions ===
      "function"
  ) {
    try {
      const result =
        activeMemory
          .applyMemoryInstructions(
            executableInstructions
          );

      return (
        createMemoryExecutionResult({
          applied:
            result
              ?.applied ||
            [],

          skipped: [
            ...preflightSkipped,

            ...asArray(
              result
                ?.skipped
            ),
          ],

          errors:
            result
              ?.errors ||
            [],

          reason:
            result
              ?.reason ||
            null,

          status:
            result
              ?.status ||
            null,

          executionPolicy,
        })
      );
    } catch (error) {
      return (
        createMemoryExecutionResult({
          skipped:
            preflightSkipped,

          errors: [
            {
              instruction:
                null,

              error:
                error instanceof Error
                  ? error.message
                  : String(error),
            },
          ],

          reason:
            "Creator Memory instruction execution failed.",

          status:
            "failed",

          executionPolicy,
        })
      );
    }
  }

  /**
   * Compatibility execution exists only for older Creator Memory
   * integrations that have not yet adopted applyMemoryInstructions().
   */
  const memoryPlan =
    plan
      ?.specialistPlans
      ?.memory;

  if (
    !memoryPlan
  ) {
    return (
      createMemoryExecutionResult({
        skipped: [
          ...preflightSkipped,

          ...executableInstructions
            .map(
              (instruction) => ({
                instruction:
                  cloneValue(
                    instruction
                  ),

                reason:
                  "No Creator Memory plan was available for compatibility execution.",
              })
            ),
        ],

        reason:
          "No Creator Memory plan was available.",

        executionPolicy,
      })
    );
  }

  if (
    typeof resolvedCreatorMemoryEngine
      .applyMemoryPlan ===
      "function"
  ) {
    try {
      const compatibilityPlan = {
        ...cloneValue(
          memoryPlan
        ),

        instructions:
          cloneValue(
            executableInstructions
          ),
      };

      const result =
        resolvedCreatorMemoryEngine
          .applyMemoryPlan({
            plan:
              compatibilityPlan,

            memory:
              activeMemory,
          });

      return (
        createMemoryExecutionResult({
          applied:
            result
              ?.applied ||
            [],

          skipped: [
            ...preflightSkipped,

            ...asArray(
              result
                ?.skipped
            ),
          ],

          errors:
            result
              ?.errors ||
            [],

          reason:
            result
              ?.reason ||
            null,

          status:
            result
              ?.status ||
            null,

          executionPolicy,
        })
      );
    } catch (error) {
      return (
        createMemoryExecutionResult({
          skipped:
            preflightSkipped,

          errors: [
            {
              instruction:
                null,

              error:
                error instanceof Error
                  ? error.message
                  : String(error),
            },
          ],

          reason:
            "Creator Memory compatibility execution failed.",

          status:
            "failed",

          executionPolicy,
        })
      );
    }
  }

  return (
    createMemoryExecutionResult({
      skipped: [
        ...preflightSkipped,

        ...executableInstructions
          .map(
            (instruction) => ({
              instruction:
                cloneValue(
                  instruction
                ),

              reason:
                "No compatible Creator Memory execution method is available.",
            })
          ),
      ],

      reason:
        "Memory execution is unavailable.",

      executionPolicy,
    })
  );
}

  function planMemoryRecall({
    message = "",
    context = {},
  } = {}) {
    if (
      typeof resolvedCreatorMemoryEngine
        .planRecall !==
        "function"
    ) {
      return {
        shouldRecall:
          false,

        priority:
          "none",

        timing:
          "not-now",

        memory: null,

        memories: [],

        reason:
          "Creator Memory recall planning is unavailable.",
      };
    }

    const combinedContext =
      createMemoryAwareContext({
        context,

        memory:
          activeMemory,
      });

    return (
      resolvedCreatorMemoryEngine
        .planRecall({
          message,

          context:
            combinedContext,
        })
    );
  }

  function planSessionHandoff({
    handoff = {},
    context = {},
  } = {}) {
    if (
      typeof resolvedCreatorMemoryEngine
        .planSessionHandoff !==
        "function"
    ) {
      return {
        candidates: [],

        instructions: [],

        status:
          "unavailable",
      };
    }

    const combinedContext =
      createMemoryAwareContext({
        context,

        memory:
          activeMemory,
      });

    return (
      resolvedCreatorMemoryEngine
        .planSessionHandoff({
          handoff,

          context:
            combinedContext,
        })
    );
  }

  function getMemoryContext({
    projectId = null,
  } = {}) {
    return (
      readCreatorMemoryContext(
        activeMemory,
        {
          projectId:
            cleanString(
              projectId
            ) ||
            null,
        }
      )
    );
  }

  /**
   * Replaces the persistence authority for every memory-aware
   * specialist.
   */
  function setMemory(
    nextMemory
  ) {
    activeMemory =
      nextMemory ||
      null;

    if (
      typeof resolvedConversationPlanner
        .setMemory ===
        "function"
    ) {
      resolvedConversationPlanner
        .setMemory(
          activeMemory
        );
    }

    if (
      typeof resolvedCreatorMemoryEngine
        .setMemory ===
        "function"
    ) {
      resolvedCreatorMemoryEngine
        .setMemory(
          activeMemory
        );
    }

    return activeMemory;
  }

  function getMemory() {
    return activeMemory;
  }

  function shouldWait(
    plan
  ) {
    return Boolean(
      plan
        ?.execution
        ?.shouldWait
    );
  }

  function shouldMoveForward(
    plan
  ) {
    return Boolean(
      plan
        ?.execution
        ?.shouldMoveForward
    );
  }

  function shouldYieldToExecution(
    plan
  ) {
    return Boolean(
      plan
        ?.execution
        ?.shouldYieldToExecution
    );
  }

  function shouldCaptureMemory(
    plan
  ) {
    return Boolean(
      plan
        ?.execution
        ?.shouldCaptureMemory
    );
  }

  function shouldRecallMemory(
    plan
  ) {
    return Boolean(
      plan
        ?.execution
        ?.shouldRecallMemory
    );
  }

  function shouldExecuteMemoryInstructions(
    plan
  ) {
    return Boolean(
      plan
        ?.execution
        ?.shouldExecuteMemoryInstructions
    );
  }

  function shouldExecuteMemoryAction(
    plan
  ) {
    return Boolean(
      plan
        ?.execution
        ?.shouldExecuteMemoryAction
    );
  }

  function shouldRestoreProjectContext(
    plan
  ) {
    return Boolean(
      plan
        ?.execution
        ?.shouldRestoreProjectContext
    );
  }

  function shouldPreserveSessionHandoff(
    plan
  ) {
    return Boolean(
      plan
        ?.execution
        ?.shouldPreserveSessionHandoff
    );
  }

  function shouldApplyForget(
    plan
  ) {
    return Boolean(
      plan
        ?.execution
        ?.shouldApplyForget
    );
  }

  function shouldClarifyForget(
    plan
  ) {
    return Boolean(
      plan
        ?.execution
        ?.shouldClarifyForget
    );
  }

  return {
    planMentorBehaviour,

    applyMemoryPlan,

    planMemoryRecall,

    planSessionHandoff,

    setMemory,

    getMemory,

    getMemoryContext,

    shouldWait,

    shouldMoveForward,

    shouldYieldToExecution,

    shouldCaptureMemory,

    shouldRecallMemory,

    shouldExecuteMemoryInstructions,

    shouldExecuteMemoryAction,

    shouldRestoreProjectContext,

    shouldPreserveSessionHandoff,

    shouldApplyForget,

    shouldClarifyForget,
  };
}

function planMentorBehaviour({
  message = "",
  context = {},
  conversationPlan = null,
  reflectionPlan = null,
  progressionPlan = null,
  memoryPlan = null,
  memory = null,
} = {}) {
  const engine =
    createAdaptiveMentorEngine({
      memory,
    });

  return (
    engine
      .planMentorBehaviour({
        message,

        context,

        conversationPlan,

        reflectionPlan,

        progressionPlan,

        memoryPlan,
      })
  );
}

export {
  ADAPTIVE_MENTOR_ENGINE_VERSION,

  MENTOR_ROLES,

  LEADERSHIP_STANCES,

  INTERVENTION_LEVELS,

  RESPONSE_DEPTHS,

  QUESTION_POLICIES,

  MEMORY_POLICIES,

  MEMORY_EXECUTION_POLICIES,

  ACTION_PRIORITIES,

  ADAPTIVE_ACTIONS,

  ADAPTATION_SIGNALS,

  createAdaptiveMentorEngine,

  planMentorBehaviour,
};

export default createAdaptiveMentorEngine;
/**
 * Conversation Planner
 * ------------------------------------------------------------
 * iBand AI Mentor — The Creator
 *
 * Version 2.3.0
 *
 * The Conversation Planner is the conversational orchestration
 * layer between creator understanding and adaptive response
 * behaviour.
 *
 * Responsibilities:
 * - Analyse the creator's latest message.
 * - Read relevant Creator Memory context.
 * - Preserve current project continuity.
 * - Understand creator, project and session context.
 * - Respect explicit current-turn creator direction.
 * - Detect remember, forget, correction and revisit intent.
 * - Protect creator-approved truth from inferred memory.
 * - Keep project-scoped memory inside the correct project.
 * - Recognise quick detours without losing the main task.
 * - Restore useful context when a creator returns.
 * - Preserve session position when a creator pauses.
 * - Choose the appropriate conversation mode.
 * - Choose the Mentor's next conversational move.
 * - Select tone, strategy and conversational limits.
 * - Identify which forms of memory may help.
 * - Support future specialist-agent memory signals.
 * - Apply The Creator Protocol.
 * - Return a structured plan for AdaptiveMentorEngine.
 *
 * This file does NOT:
 * - Persist memory.
 * - Decide final memory truth.
 * - Execute remember requests.
 * - Execute forget requests.
 * - Mutate Creator Memory.
 * - Generate final Mentor wording.
 * - Replace AdaptiveMentorEngine.
 * - Replace CreatorMemoryEngine.
 * - Expose specialist-agent machinery to the creator.
 *
 * Architecture:
 *
 * Creator message
 *      ↓
 * TheCreatorEngine
 *      ↓
 * ConversationPlanner
 *      ↓
 * ReflectionEngine
 *      ↓
 * ProgressionEngine
 *      ↓
 * CreatorMemoryEngine
 *      ↓
 * AdaptiveMentorEngine
 *      ↓
 * ResponseComposer
 *      ↓
 * CommunicationVoiceEngine
 *      ↓
 * ResponseGenerator
 *
 * Core principles:
 * - Protect the Creator.
 * - Present behaviour leads.
 * - Explicit creator direction outranks historical memory.
 * - Creator-approved truth outranks inference.
 * - Long-term memory informs; it does not control.
 * - Project memory is scoped.
 * - Project truth may evolve.
 * - Corrections must be respected immediately.
 * - Forget requests must never be ignored.
 * - Conversation exists in service of creation.
 * - Do not make the creator repeat known information.
 * - Do not interrogate when enough is already known.
 * - Demonstrate before teaching when useful.
 * - Experienced creators must be allowed to work.
 * - Quick detours should not destroy project momentum.
 * - Session handoff should preserve the creator's place.
 * - Complexity belongs behind the conversation.
 */

import analyseCreatorMessage from "./TheCreatorEngine.js";

const CONVERSATION_PLANNER_VERSION = "2.3.0";

/**
 * Broad conversational situations.
 *
 * A conversation mode describes what kind of moment the
 * creator is currently in.
 */
const CONVERSATION_MODES = Object.freeze({
  WELCOME: "welcome",
  LISTENING: "listening",

  IMAGINATION: "imagination",
  DISCOVERY: "discovery",
  REFLECTION: "reflection",

  CONFIDENCE: "confidence",
  RECOVERY: "recovery",

  PROJECT_CONTINUITY: "project-continuity",

  CREATION: "creation",
  REFINEMENT: "refinement",
  PUBLISHING: "publishing",

  LEARNING: "learning",
  PROBLEM_SOLVING: "problem-solving",

  MEMORY: "memory",
  CORRECTION: "correction",

  DETOUR: "detour",

  CELEBRATION: "celebration",

  PAUSING: "pausing",
  RETURNING: "returning",
});

/**
 * Conversation mode describes the situation.
 *
 * Mentor move describes what the Mentor should actually DO.
 */
const MENTOR_MOVES = Object.freeze({
  LISTEN: "listen",
  ASK: "ask",
  DISCUSS: "discuss",
  SUGGEST: "suggest",

  DEMONSTRATE: "demonstrate",
  SHOW: "show",
  TEACH: "teach",

  CREATE: "create",
  REFINE: "refine",
  PREPARE: "prepare",

  REFLECT: "reflect",
  RECALL: "recall",

  ACKNOWLEDGE: "acknowledge",

  RESTORE_CONTEXT: "restore-context",

  CAPTURE_AND_CONTINUE: "capture-and-continue",

  CELEBRATE: "celebrate",

  PAUSE: "pause",
  CONTINUE: "continue",
});

/**
 * Planner-level emotional delivery guidance.
 *
 * CommunicationVoiceEngine remains responsible for the richer
 * final communication performance.
 */
const MENTOR_TONES = Object.freeze({
  WARM: "warm",
  CALM: "calm",
  ENCOURAGING: "encouraging",
  CURIOUS: "curious",
  REFLECTIVE: "reflective",
  CELEBRATORY: "celebratory",
  PRACTICAL: "practical",
  REASSURING: "reassuring",
  COLLABORATIVE: "collaborative",

  QUIETLY_CONFIDENT: "quietly-confident",
});

/**
 * Planner-level actions.
 *
 * These describe the principal conversational outcome the
 * Adaptive Mentor should support.
 */
const PLAN_ACTIONS = Object.freeze({
  LISTEN: "listen",

  ASK_ONE_QUESTION: "ask-one-question",

  INVITE_IMAGINATION: "invite-imagination",
  INVITE_REFLECTION: "invite-reflection",

  EXPLORE_IDEA: "explore-idea",
  PROTECT_IDEA: "protect-idea",

  OFFER_SMALL_STEP: "offer-small-step",
  OFFER_PERSPECTIVE: "offer-perspective",

  RECALL_MEMORY: "recall-memory",

  ACKNOWLEDGE_MEMORY_REQUEST:
    "acknowledge-memory-request",

  ACKNOWLEDGE_FORGET_REQUEST:
    "acknowledge-forget-request",

  ACKNOWLEDGE_CORRECTION:
    "acknowledge-correction",

  RESTORE_PROJECT_CONTEXT:
    "restore-project-context",

  CAPTURE_AND_CONTINUE:
    "capture-and-continue",

  CAPTURE_DETOUR:
    "capture-detour",

  RETURN_FROM_DETOUR:
    "return-from-detour",

  REFLECT_PATTERN:
    "reflect-pattern",

  BEGIN_CREATION:
    "begin-creation",

  REVIEW_CREATION:
    "review-creation",

  PREPARE_PUBLISHING:
    "prepare-publishing",

  CELEBRATE_PROGRESS:
    "celebrate-progress",

  PRESERVE_SESSION_HANDOFF:
    "preserve-session-handoff",

  OFFER_INSPIRATION_DRAWER:
    "offer-inspiration-drawer",
});

/**
 * Memory categories that may be useful to the conversation.
 *
 * These are requests for context only.
 *
 * They do NOT mean that memory should be written, changed or
 * deleted.
 */
const MEMORY_REQUEST_TYPES = Object.freeze({
  NONE: "none",

  CREATOR_PROFILE: "creator-profile",

  FULL_MEMORY_CONTEXT:
    "full-memory-context",

  RECENT_CONVERSATIONS:
    "recent-conversations",

  ACTIVE_PROJECT:
    "active-project",

  PROJECT_MEMORY:
    "project-memory",

  RELEVANT_IDEAS:
    "relevant-ideas",

  INSPIRATION_DRAWER:
    "inspiration-drawer",

  CREATIVE_PATTERNS:
    "creative-patterns",

  OBSERVATIONS:
    "observations",

  DEFERRED_MEMORIES:
    "deferred-memories",

  MILESTONES:
    "milestones",

  SESSION_HANDOFF:
    "session-handoff",
});

/**
 * Memory-direction signals.
 *
 * These signals describe creator intent around memory.
 * ConversationPlanner never executes the underlying mutation.
 */
const MEMORY_DIRECTIONS = Object.freeze({
  NONE: "none",
  REMEMBER: "remember",
  FORGET: "forget",
  CORRECT: "correct",
  REVISIT: "revisit",
});

/**
 * The Creator Protocol.
 *
 * These principles are returned with every successful plan so
 * downstream layers can preserve creator-first behaviour.
 */
const CREATOR_PROTOCOL = Object.freeze({
  protectTheCreator: true,

  curiosityBeforeCriticism: true,

  confidenceBeforeCorrection: true,

  oneMeaningfulQuestionAtATime: true,

  creatorOwnsTheIdea: true,

  permissionBeforePerspective: true,

  exploreBeforeEvaluating: true,

  doNotRepeatKnownQuestions: true,

  technologyServesTheCreator: true,

  leaveCreatorStronger: true,

  demonstrateWhenUseful: true,

  teachWithoutTakingOver: true,

  respectCreatorExperience: true,

  actionBeforeExplanationWhenAppropriate: true,

  creatorCanOverrideMentorDirection: true,

  presentBehaviourLeads: true,

  memoryInformsWithoutControlling: true,

  creatorCorrectionsOverrideMemory: true,

  explicitForgetRequestsMustBeRespected: true,

  projectMemoryIsScoped: true,

  projectTruthMayEvolve: true,

  specialistAgentsMayInform: true,

  specialistAgentsDoNotOwnTruth: true,

  sessionHandoffProtectsMomentum: true,

  detoursShouldPreserveMainTask: true,

  complexityStaysBehindConversation: true,
});

const DEFAULT_PLANNER_CONTEXT = Object.freeze({
  creatorId: null,

  creatorJourney: "guide",
  creatorType: null,
  creatorExperience: null,

  creatorProfile: null,
  creatorMemoryContext: null,

  projectType: null,
  projectTitle: null,

  genre: null,
  style: null,
  mood: null,
  audience: null,

  activeProject: null,
  activeProjectId: null,

  activeIdea: null,
  activeStage: null,
  activeScene: null,
  activeCharacter: null,
  activeAsset: null,

  sessionId: null,
  sessionStartedAt: null,

  creatorIsReturning: false,

  conversationMode: null,
  thinkingMode: null,

  creatorEnergy: null,
  momentum: null,
  guidanceWindow: null,
  informationSaturation: null,

  knownPatterns: [],
  existingPatterns: [],
  existingObservations: [],
  existingMemories: [],
  existingProjectMemories: [],

  deferredMemories: [],
  milestones: [],
  inspirationDrawer: [],

  recentConversations: [],
  recentCreatorMessages: [],
  recentMentorMessages: [],

  conversationCount: 0,
  completedProjectCount: 0,
  publishedProjectCount: 0,
  savedIdeaCount: 0,
  inspirationDrawerCount: 0,
  deferredMemoryCount: 0,

  recentStage: null,
  recentEmotionalState: null,

  hasSharedIdea: false,

  /**
   * Legacy interaction signals.
   *
   * Retained for compatibility with existing Studio
   * experiences.
   */
  requestedHelp: false,
  requestedExplanation: false,
  requestedExample: false,
  requestedDemonstration: false,
  requestedCreation: false,
  requestedChange: false,

  /**
   * Modern explicit creator-direction signals.
   */
  creatorExplicitlyAskedForGuidance: false,

  creatorExplicitlyAskedForHelp: false,

  creatorExplicitlyAskedForExplanation: false,

  creatorExplicitlyAskedToContinue: false,

  creatorExplicitlyAskedForNextStep: false,

  creatorExplicitlyAskedToPause: false,

  creatorExplicitlyAskedToStop: false,

  creatorExplicitlyAskedToCreate: false,

  creatorExplicitlyAskedToRemember: false,

  creatorExplicitlyAskedNotToRemember: false,

  creatorExplicitlyAskedToForget: false,

  creatorExplicitlyCorrectedMemory: false,

  creatorExplicitlyAskedToRevisit: false,

  /**
   * Optional current-turn memory payloads.
   *
   * These are descriptive signals only. Persistence remains
   * outside this planner.
   */
  rememberCandidate: null,
  forgetCandidate: null,
  correctionCandidate: null,
  revisitCandidate: null,

  /**
   * Project readiness.
   */
  minimumCreationContextReady: false,

  requiredInformationComplete: false,

  projectReadyToGenerate: false,

  projectReadyToRefine: false,

  projectReadyToPublish: false,

  /**
   * Future specialist-agent contribution.
   */
  memorySignals: [],
  projectMemorySignals: [],

  sourceAgent: null,
  sourceSystem: null,

  /**
   * Session continuity.
   */
  captureSessionHandoff: false,

  sessionHandoff: null,

  previousTask: null,
  currentTask: null,
  nextTask: null,
  returnPoint: null,

  /**
   * Detour continuity.
   */
  detourActive: false,
  detourRequested: false,
  detourCompleted: false,

  detourTopic: null,
  detourReturnPoint: null,

  /**
   * Creator preferences.
   */
  preferredResponseDepth: null,

  preferredGuidanceStyle: null,

  preferredMentorRole: null,

  preferredCommunicationPace: null,

  /**
   * Allows experienced creators to work independently while
   * keeping Mentor available.
   */
  mentorInvoked: true,

  currentTimestamp: null,
});

function createTimestamp() {
  return new Date().toISOString();
}

function createPlanId() {
  const randomValue = Math.random()
    .toString(36)
    .slice(2, 10);

  return (
    `conversation-plan-` +
    `${Date.now()}-${randomValue}`
  );
}

function cloneValue(value) {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return null;
  }

  try {
    return JSON.parse(
      JSON.stringify(value)
    );
  } catch (error) {
    console.warn(
      "ConversationPlanner cloneValue failed:",
      error
    );

    return value;
  }
}

function normaliseString(value) {
  return typeof value === "string"
    ? value.trim()
    : "";
}

function normaliseText(value) {
  return normaliseString(value)
    .toLowerCase()
    .replace(/[’‘]/g, "'")
    .replace(/\s+/g, " ");
}

function asArray(value) {
  return Array.isArray(value)
    ? value
    : [];
}

function asNumber(
  value,
  fallback = 0
) {
  const numericValue =
    Number(value);

  return Number.isFinite(
    numericValue
  )
    ? numericValue
    : fallback;
}

function uniqueValues(
  values = []
) {
  return [
    ...new Set(
      values.filter(
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
  propertyName
) {
  return Boolean(
    value &&
    Object.prototype.hasOwnProperty.call(
      value,
      propertyName
    )
  );
}

function isObject(value) {
  return Boolean(
    value &&
    typeof value === "object" &&
    !Array.isArray(value)
  );
}

function includesAny(
  text,
  phrases = []
) {
  return phrases.some(
    (phrase) =>
      text.includes(phrase)
  );
}

function safelyCallMemoryMethod(
  memory,
  methodName,
  fallbackValue,
  ...args
) {
  try {
    if (
      memory &&
      typeof memory[
        methodName
      ] === "function"
    ) {
      const result =
        memory[
          methodName
        ](...args);

      /**
       * ConversationPlanner currently operates synchronously.
       *
       * If a future memory adapter becomes asynchronous, the
       * orchestration layer should provide resolved memoryContext
       * rather than allowing a Promise to leak into planning.
       */
      if (
        result &&
        typeof result.then ===
          "function"
      ) {
        console.warn(
          `ConversationPlanner received an asynchronous result from ${methodName}. ` +
          "Provide resolved memoryContext to the planner instead."
        );

        return fallbackValue;
      }

      return (
        result ??
        fallbackValue
      );
    }
  } catch (error) {
    console.warn(
      `ConversationPlanner memory method failed: ${methodName}`,
      error
    );
  }

  return fallbackValue;
}

function getProjectId(
  context = {}
) {
  const explicitProjectId =
    normaliseString(
      context?.activeProjectId
    );

  if (explicitProjectId) {
    return explicitProjectId;
  }

  if (
    typeof context
      ?.activeProject ===
      "string"
  ) {
    return (
      normaliseString(
        context.activeProject
      ) ||
      null
    );
  }

  return (
    normaliseString(
      context
        ?.activeProject
        ?.id
    ) ||
    normaliseString(
      context
        ?.activeProject
        ?.projectId
    ) ||
    null
  );
}

function getMemoryProjectId(
  memory
) {
  return (
    normaliseString(
      memory?.projectId
    ) ||
    normaliseString(
      memory
        ?.relatedProjectId
    ) ||
    normaliseString(
      memory
        ?.metadata
        ?.projectId
    ) ||
    null
  );
}

function memoryBelongsToProject(
  memory,
  projectId
) {
  if (!projectId) {
    return false;
  }

  return (
    getMemoryProjectId(
      memory
    ) === projectId
  );
}

/**
 * Reads the richer modern memory context.
 */
function retrieveRichMemoryContext(
  memory
) {
  return safelyCallMemoryMethod(
    memory,
    "getMemoryContext",
    null,
    {
      conversationLimit: 10,
      observationLimit: 10,
      patternLimit: 10,
      deferredLimit: 10,
      milestoneLimit: 10,
    }
  );
}

/**
 * Reads the compact legacy engine context.
 *
 * Retained because older environments may still expose only
 * createEngineContext().
 */
function retrieveCompactMemoryContext(
  memory
) {
  return safelyCallMemoryMethod(
    memory,
    "createEngineContext",
    {}
  );
}

/**
 * Retrieves supporting memory individually.
 *
 * This gives the planner graceful compatibility with memory
 * services implementing only part of the modern contract.
 */
function retrieveSupportingMemory(
  memory
) {
  return {
    creatorProfile:
      safelyCallMemoryMethod(
        memory,
        "getCreatorProfile",
        null
      ),

    activeProject:
      safelyCallMemoryMethod(
        memory,
        "getActiveProject",
        null
      ),

    recentConversations:
      safelyCallMemoryMethod(
        memory,
        "getRecentConversations",
        [],
        10
      ),

    inspirationDrawer:
      safelyCallMemoryMethod(
        memory,
        "getInspirationDrawer",
        [],
        {
          limit: 10,
        }
      ),

    knownPatterns:
      safelyCallMemoryMethod(
        memory,
        "getPatterns",
        [],
        {
          minimumConfidence: 0.5,
          limit: 10,
        }
      ),

    observations:
      safelyCallMemoryMethod(
        memory,
        "getObservations",
        [],
        {
          minimumConfidence: 0.35,
          limit: 10,
        }
      ),

    deferredMemories:
      safelyCallMemoryMethod(
        memory,
        "getDeferredMemories",
        [],
        {
          minimumConfidence: 0.35,
          limit: 10,
        }
      ),

    milestones:
      safelyCallMemoryMethod(
        memory,
        "getMilestones",
        [],
        10
      ),

    ideas:
      safelyCallMemoryMethod(
        memory,
        "getIdeas",
        [],
        {
          limit: 20,
        }
      ),

    sessionHandoff:
      safelyCallMemoryMethod(
        memory,
        "getSessionHandoff",
        null
      ),
  };
}

/**
 * Creates one normalised Creator Memory bundle.
 */
function retrieveMemoryBundle(
  memory
) {
  const richContext =
    retrieveRichMemoryContext(
      memory
    );

  const compactContext =
    retrieveCompactMemoryContext(
      memory
    );

  const supportingMemory =
    retrieveSupportingMemory(
      memory
    );

  return {
    connected:
      Boolean(memory),

    richContext:
      cloneValue(
        richContext
      ),

    compactContext:
      cloneValue(
        compactContext
      ),

    supportingMemory:
      cloneValue(
        supportingMemory
      ),
  };
}

function resolveContextValue({
  explicitContext,
  propertyName,
  fallbacks = [],
  defaultValue = null,
}) {
  if (
    hasOwn(
      explicitContext,
      propertyName
    )
  ) {
    return cloneValue(
      explicitContext[
        propertyName
      ]
    );
  }

  for (
    const fallback
    of fallbacks
  ) {
    if (
      fallback !==
        undefined &&
      fallback !== null
    ) {
      return cloneValue(
        fallback
      );
    }
  }

  return cloneValue(
    defaultValue
  );
}

/**
 * Combines current Studio state with Creator Memory.
 *
 * Precedence:
 *
 * 1. Explicit current-turn / workspace context.
 * 2. Explicit supplied memoryContext.
 * 3. Rich CreatorMemory context.
 * 4. Compact legacy memory context.
 * 5. Individual supporting memory calls.
 * 6. Planner defaults.
 *
 * Explicit current context may intentionally contain an empty
 * array, false, empty string or null. Therefore property
 * ownership is checked rather than simple truthy fallback.
 */
function buildCombinedContext({
  context = {},
  memoryBundle,
}) {
  const explicitContext =
    cloneValue(context) ||
    {};

  const rich =
    memoryBundle
      ?.richContext ||
    {};

  const compact =
    memoryBundle
      ?.compactContext ||
    {};

  const supporting =
    memoryBundle
      ?.supportingMemory ||
    {};

  const richJourney =
    rich?.journey ||
    {};

  const richCounts =
    rich?.counts ||
    {};

  const creatorProfile =
    resolveContextValue({
      explicitContext,
      propertyName:
        "creatorProfile",

      fallbacks: [
        rich?.creatorProfile,
        compact
          ?.creatorProfile,
        supporting
          ?.creatorProfile,
      ],

      defaultValue: null,
    });

  const activeProject =
    resolveContextValue({
      explicitContext,
      propertyName:
        "activeProject",

      fallbacks: [
        rich?.activeProject,
        compact
          ?.activeProject,
        supporting
          ?.activeProject,
      ],

      defaultValue: null,
    });

  const inferredCreatorType =
    asArray(
      creatorProfile
        ?.creatorTypes
    )[0] ||
    null;

  const activeProjectId =
    hasOwn(
      explicitContext,
      "activeProjectId"
    )
      ? explicitContext
          .activeProjectId
      : (
          normaliseString(
            activeProject?.id
          ) ||
          normaliseString(
            activeProject
              ?.projectId
          ) ||
          null
        );

  const combined = {
    ...cloneValue(
      DEFAULT_PLANNER_CONTEXT
    ),

    ...explicitContext,

    creatorProfile,

    creatorMemoryContext:
      rich &&
      Object.keys(rich)
        .length > 0
        ? cloneValue(rich)
        : (
            compact &&
            Object.keys(compact)
              .length > 0
              ? cloneValue(
                  compact
                )
              : null
          ),

    activeProject,

    activeProjectId,

    creatorType:
      resolveContextValue({
        explicitContext,
        propertyName:
          "creatorType",

        fallbacks: [
          activeProject
            ?.creatorType,
          inferredCreatorType,
        ],

        defaultValue: null,
      }),

    recentConversations:
      resolveContextValue({
        explicitContext,
        propertyName:
          "recentConversations",

        fallbacks: [
          rich
            ?.recentConversations,
          supporting
            ?.recentConversations,
        ],

        defaultValue: [],
      }),

    knownPatterns:
      resolveContextValue({
        explicitContext,
        propertyName:
          "knownPatterns",

        fallbacks: [
          rich
            ?.existingPatterns,
          compact
            ?.knownPatterns,
          supporting
            ?.knownPatterns,
        ],

        defaultValue: [],
      }),

    existingPatterns:
      resolveContextValue({
        explicitContext,
        propertyName:
          "existingPatterns",

        fallbacks: [
          rich
            ?.existingPatterns,
          compact
            ?.knownPatterns,
          supporting
            ?.knownPatterns,
        ],

        defaultValue: [],
      }),

    existingObservations:
      resolveContextValue({
        explicitContext,
        propertyName:
          "existingObservations",

        fallbacks: [
          rich
            ?.existingObservations,
          supporting
            ?.observations,
        ],

        defaultValue: [],
      }),

    existingMemories:
      resolveContextValue({
        explicitContext,
        propertyName:
          "existingMemories",

        fallbacks: [
          rich
            ?.existingMemories,
        ],

        defaultValue: [],
      }),

    existingProjectMemories:
      resolveContextValue({
        explicitContext,
        propertyName:
          "existingProjectMemories",

        fallbacks: [
          rich
            ?.existingProjectMemories,
          rich
            ?.projectMemories,
        ],

        defaultValue: [],
      }),

    deferredMemories:
      resolveContextValue({
        explicitContext,
        propertyName:
          "deferredMemories",

        fallbacks: [
          rich
            ?.deferredMemories,
          supporting
            ?.deferredMemories,
        ],

        defaultValue: [],
      }),

    inspirationDrawer:
      resolveContextValue({
        explicitContext,
        propertyName:
          "inspirationDrawer",

        fallbacks: [
          rich
            ?.inspirationDrawer,
          supporting
            ?.inspirationDrawer,
        ],

        defaultValue: [],
      }),

    milestones:
      resolveContextValue({
        explicitContext,
        propertyName:
          "milestones",

        fallbacks: [
          rich?.milestones,
          supporting
            ?.milestones,
        ],

        defaultValue: [],
      }),

    sessionHandoff:
      resolveContextValue({
        explicitContext,
        propertyName:
          "sessionHandoff",

        fallbacks: [
          rich
            ?.sessionHandoff,
          compact
            ?.sessionHandoff,
          supporting
            ?.sessionHandoff,
        ],

        defaultValue: null,
      }),

    conversationCount:
      resolveContextValue({
        explicitContext,
        propertyName:
          "conversationCount",

        fallbacks: [
          richCounts
            ?.conversations,
          richJourney
            ?.conversationCount,
          compact
            ?.conversationCount,
        ],

        defaultValue: 0,
      }),

    completedProjectCount:
      resolveContextValue({
        explicitContext,
        propertyName:
          "completedProjectCount",

        fallbacks: [
          richCounts
            ?.completedProjects,
          richJourney
            ?.completedProjectCount,
          compact
            ?.completedProjectCount,
        ],

        defaultValue: 0,
      }),

    publishedProjectCount:
      resolveContextValue({
        explicitContext,
        propertyName:
          "publishedProjectCount",

        fallbacks: [
          richCounts
            ?.publishedProjects,
          richJourney
            ?.publishedProjectCount,
          compact
            ?.publishedProjectCount,
        ],

        defaultValue: 0,
      }),

    savedIdeaCount:
      resolveContextValue({
        explicitContext,
        propertyName:
          "savedIdeaCount",

        fallbacks: [
          richCounts?.ideas,
          richJourney
            ?.savedIdeaCount,
          compact
            ?.savedIdeaCount,
        ],

        defaultValue: 0,
      }),

    inspirationDrawerCount:
      resolveContextValue({
        explicitContext,
        propertyName:
          "inspirationDrawerCount",

        fallbacks: [
          richCounts
            ?.inspirationDrawer,
          richJourney
            ?.inspirationDrawerCount,
          compact
            ?.inspirationDrawerCount,
          supporting
            ?.inspirationDrawer
            ?.length,
        ],

        defaultValue: 0,
      }),

    deferredMemoryCount:
      resolveContextValue({
        explicitContext,
        propertyName:
          "deferredMemoryCount",

        fallbacks: [
          richCounts
            ?.deferredMemories,
          richJourney
            ?.deferredMemoryCount,
          supporting
            ?.deferredMemories
            ?.length,
        ],

        defaultValue: 0,
      }),

    recentStage:
      resolveContextValue({
        explicitContext,
        propertyName:
          "recentStage",

        fallbacks: [
          richJourney
            ?.recentStage,
          compact
            ?.recentStage,
        ],

        defaultValue: null,
      }),

    recentEmotionalState:
      resolveContextValue({
        explicitContext,
        propertyName:
          "recentEmotionalState",

        fallbacks: [
          richJourney
            ?.recentEmotionalState,
          compact
            ?.recentEmotionalState,
        ],

        defaultValue: null,
      }),

    hasSharedIdea:
      resolveContextValue({
        explicitContext,
        propertyName:
          "hasSharedIdea",

        fallbacks: [
          compact
            ?.hasSharedIdea,
          (
            asNumber(
              richCounts?.ideas
            ) > 0
          ),
          (
            supporting
              ?.ideas
              ?.length > 0
          ),
        ],

        defaultValue: false,
      }),

    returnPoint:
      resolveContextValue({
        explicitContext,
        propertyName:
          "returnPoint",

        fallbacks: [
          rich
            ?.sessionHandoff
            ?.returnPoint,
          compact
            ?.sessionHandoff
            ?.returnPoint,
          supporting
            ?.sessionHandoff
            ?.returnPoint,
        ],

        defaultValue: null,
      }),

    previousTask:
      resolveContextValue({
        explicitContext,
        propertyName:
          "previousTask",

        fallbacks: [
          rich
            ?.sessionHandoff
            ?.previousTask,
          supporting
            ?.sessionHandoff
            ?.previousTask,
        ],

        defaultValue: null,
      }),

    nextTask:
      resolveContextValue({
        explicitContext,
        propertyName:
          "nextTask",

        fallbacks: [
          rich
            ?.sessionHandoff
            ?.nextTask,
          supporting
            ?.sessionHandoff
            ?.nextTask,
        ],

        defaultValue: null,
      }),

    currentTimestamp:
      explicitContext
        .currentTimestamp ||
      createTimestamp(),
  };

  /**
   * Communication preferences stored in the creator profile
   * may inform active defaults, but explicit current context
   * always wins.
   */
  const communicationPreferences =
    creatorProfile
      ?.communicationPreferences ||
    rich
      ?.communicationPreferences ||
    {};

  if (
    !hasOwn(
      explicitContext,
      "preferredResponseDepth"
    )
  ) {
    combined
      .preferredResponseDepth =
      communicationPreferences
        ?.preferredResponseDepth ??
      combined
        .preferredResponseDepth;
  }

  if (
    !hasOwn(
      explicitContext,
      "preferredGuidanceStyle"
    )
  ) {
    combined
      .preferredGuidanceStyle =
      communicationPreferences
        ?.preferredGuidanceStyle ??
      combined
        .preferredGuidanceStyle;
  }

  if (
    !hasOwn(
      explicitContext,
      "preferredMentorRole"
    )
  ) {
    combined
      .preferredMentorRole =
      communicationPreferences
        ?.preferredMentorRole ??
      combined
        .preferredMentorRole;
  }

  if (
    !hasOwn(
      explicitContext,
      "preferredCommunicationPace"
    )
  ) {
    combined
      .preferredCommunicationPace =
      communicationPreferences
        ?.preferredCommunicationPace ??
      combined
        .preferredCommunicationPace;
  }

  return combined;
}

/**
 * Detects explicit conversation direction.
 *
 * This does not replace TheCreatorEngine.
 *
 * Its purpose is to ensure direct creator instructions can
 * influence orchestration immediately, before historical memory
 * or inferred behaviour is allowed to lead.
 */
function detectExplicitDirection({
  message,
  context,
}) {
  const text =
    normaliseText(message);

  const pausePhrases = [
    "pause here",
    "stop here",
    "anchor here",
    "anchor it here",
    "i'll come back",
    "ill come back",
    "i'll be back",
    "ill be back",
    "come back tomorrow",
    "tomorrow",
    "need a break",
    "need to sleep",
    "going to bed",
  ];

  const continuePhrases = [
    "continue",
    "carry on",
    "keep going",
    "next",
    "next file",
    "next task",
    "fire away",
    "you lead",
    "captain you lead",
    "warp 40",
  ];

  const creationPhrases = [
    "let's build",
    "lets build",
    "let's create",
    "lets create",
    "generate it",
    "make it",
    "write it",
    "code please",
    "give me the code",
    "complete replacement",
    "replacement file",
  ];

  const guidancePhrases = [
    "you lead",
    "captain you lead",
    "guide me",
    "what do you recommend",
    "what's next",
    "whats next",
    "next step",
  ];

  const rememberPhrases = [
    "remember this",
    "remember that",
    "remember this for",
    "save this to memory",
    "store this in memory",
    "keep this in memory",
    "add this to memory",
  ];

  const forgetPhrases = [
    "forget this",
    "forget that",
    "forget what i said",
    "remove this from memory",
    "delete this from memory",
    "don't remember this",
    "dont remember this",
    "do not remember this",
  ];

  const revisitPhrases = [
    "revisit this",
    "come back to this",
    "come back to that",
    "we'll revisit",
    "we will revisit",
    "save this for later",
    "park this for later",
  ];

  const correctionPhrases = [
    "that's not right",
    "thats not right",
    "that's wrong",
    "thats wrong",
    "not anymore",
    "that changed",
    "this changed",
    "correction",
    "actually,",
    "actually ",
    "i meant",
  ];

  const detourPhrases = [
    "quick detour",
    "small detour",
    "side question",
    "quick question",
    "before we continue",
    "before we carry on",
    "one thing before",
  ];

  const returnFromDetourPhrases = [
    "back to",
    "back to where we were",
    "back to the project",
    "back to what we were doing",
    "return to",
    "now continue",
    "now carry on",
  ];

  const pause =
    Boolean(
      context
        ?.creatorExplicitlyAskedToPause ||
      context
        ?.creatorExplicitlyAskedToStop
    ) ||
    includesAny(
      text,
      pausePhrases
    );

  const continueDirection =
    Boolean(
      context
        ?.creatorExplicitlyAskedToContinue ||
      context
        ?.creatorExplicitlyAskedForNextStep
    ) ||
    includesAny(
      text,
      continuePhrases
    );

  const create =
    Boolean(
      context
        ?.creatorExplicitlyAskedToCreate ||
      context
        ?.requestedCreation
    ) ||
    includesAny(
      text,
      creationPhrases
    );

  const guidance =
    Boolean(
      context
        ?.creatorExplicitlyAskedForGuidance ||
      context
        ?.creatorExplicitlyAskedForHelp ||
      context
        ?.requestedHelp
    ) ||
    includesAny(
      text,
      guidancePhrases
    );

  const forget =
    Boolean(
      context
        ?.creatorExplicitlyAskedToForget ||
      context
        ?.creatorExplicitlyAskedNotToRemember
    ) ||
    includesAny(
      text,
      forgetPhrases
    );

  const remember =
    !forget &&
    (
      Boolean(
        context
          ?.creatorExplicitlyAskedToRemember
      ) ||
      includesAny(
        text,
        rememberPhrases
      )
    );

  const correction =
    Boolean(
      context
        ?.creatorExplicitlyCorrectedMemory
    ) ||
    includesAny(
      text,
      correctionPhrases
    );

  const revisit =
    Boolean(
      context
        ?.creatorExplicitlyAskedToRevisit
    ) ||
    includesAny(
      text,
      revisitPhrases
    );

  const detour =
    Boolean(
      context
        ?.detourRequested
    ) ||
    includesAny(
      text,
      detourPhrases
    );

  const returnFromDetour =
    Boolean(
      context
        ?.detourCompleted
    ) ||
    includesAny(
      text,
      returnFromDetourPhrases
    );

  return {
    pause,

    continue:
      continueDirection,

    create,

    guidance,

    remember,

    forget,

    correction,

    revisit,

    detour,

    returnFromDetour,

    memoryDirection:
      forget
        ? MEMORY_DIRECTIONS.FORGET
        : correction
          ? MEMORY_DIRECTIONS.CORRECT
          : remember
            ? MEMORY_DIRECTIONS.REMEMBER
            : revisit
              ? MEMORY_DIRECTIONS.REVISIT
              : MEMORY_DIRECTIONS.NONE,

    presentDirectionAvailable:
      Boolean(
        pause ||
        continueDirection ||
        create ||
        guidance ||
        remember ||
        forget ||
        correction ||
        revisit ||
        detour ||
        returnFromDetour
      ),
  };
}

function hasProjectContext(
  context
) {
  return Boolean(
    getProjectId(context) ||
    context
      ?.activeProject ||
    context
      ?.projectTitle ||
    context
      ?.activeStage ||
    context
      ?.activeScene ||
    context
      ?.activeIdea
  );
}

function getProjectScopedMemories(
  context
) {
  const activeProjectId =
    getProjectId(
      context
    );

  const explicitlyScoped =
    asArray(
      context
        ?.existingProjectMemories
    );

  if (
    explicitlyScoped.length > 0
  ) {
    if (!activeProjectId) {
      return explicitlyScoped;
    }

    return explicitlyScoped.filter(
      (memory) => {
        const memoryProjectId =
          getMemoryProjectId(
            memory
          );

        /**
         * A collection explicitly supplied as
         * existingProjectMemories is already scoped by the
         * orchestration layer unless the item itself declares a
         * conflicting project.
         */
        return (
          !memoryProjectId ||
          memoryProjectId ===
            activeProjectId
        );
      }
    );
  }

  if (!activeProjectId) {
    return [];
  }

  return asArray(
    context
      ?.existingMemories
  ).filter(
    (memory) =>
      memoryBelongsToProject(
        memory,
        activeProjectId
      )
  );
}

function hasProjectMemory(
  context
) {
  return (
    getProjectScopedMemories(
      context
    ).length > 0
  );
}

function hasSpecialistMemorySignals(
  context
) {
  return Boolean(
    context?.sourceAgent ||
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

function hasSessionHandoff(
  context
) {
  return Boolean(
    context
      ?.sessionHandoff ||
    context
      ?.returnPoint ||
    context
      ?.previousTask ||
    context
      ?.nextTask
  );
}

function hasReliableContinuity(
  context
) {
  return Boolean(
    hasProjectContext(
      context
    ) ||
    hasProjectMemory(
      context
    ) ||
    hasSessionHandoff(
      context
    )
  );
}

function isBuildMode(
  context
) {
  const thinkingMode =
    normaliseText(
      context
        ?.thinkingMode
    );

  return (
    thinkingMode === "build" ||
    thinkingMode ===
      "build mode" ||
    thinkingMode ===
      "build-mode"
  );
}

/**
 * Creates a descriptive memory-intent object.
 *
 * This can be consumed by CreatorMemoryEngine or another
 * orchestration layer later.
 *
 * No persistence operation happens here.
 */
function createMemoryIntent({
  explicitDirection,
  context,
}) {
  const direction =
    explicitDirection
      ?.memoryDirection ||
    MEMORY_DIRECTIONS.NONE;

  return {
    direction,

    explicit:
      direction !==
      MEMORY_DIRECTIONS.NONE,

    rememberRequested:
      direction ===
      MEMORY_DIRECTIONS.REMEMBER,

    forgetRequested:
      direction ===
      MEMORY_DIRECTIONS.FORGET,

    correctionRequested:
      direction ===
      MEMORY_DIRECTIONS.CORRECT,

    revisitRequested:
      direction ===
      MEMORY_DIRECTIONS.REVISIT,

    rememberCandidate:
      cloneValue(
        context
          ?.rememberCandidate ||
        null
      ),

    forgetCandidate:
      cloneValue(
        context
          ?.forgetCandidate ||
        null
      ),

    correctionCandidate:
      cloneValue(
        context
          ?.correctionCandidate ||
        null
      ),

    revisitCandidate:
      cloneValue(
        context
          ?.revisitCandidate ||
        null
      ),

    activeProjectId:
      getProjectId(
        context
      ),

    projectScoped:
      Boolean(
        getProjectId(
          context
        )
      ),

    executionRequired:
      direction !==
      MEMORY_DIRECTIONS.NONE,

    executed: false,

    plannerMayClaimCompletion:
      false,
  };
}

/**
 * Chooses the broad conversation experience.
 */
function chooseConversationMode({
  analysis,
  context,
  explicitDirection,
}) {
  const emotionalState =
    analysis
      ?.analysis
      ?.emotionalState
      ?.value;

  const intent =
    analysis
      ?.analysis
      ?.intent
      ?.value;

  const creatorStage =
    analysis
      ?.analysis
      ?.creatorStage
      ?.value;

  const fragileIdea =
    analysis
      ?.analysis
      ?.fragileIdea
      ?.value;

  /**
   * Explicit current-turn directions lead.
   */
  if (
    explicitDirection.pause
  ) {
    return (
      CONVERSATION_MODES
        .PAUSING
    );
  }

  if (
    explicitDirection.correction
  ) {
    return (
      CONVERSATION_MODES
        .CORRECTION
    );
  }

  if (
    explicitDirection.remember ||
    explicitDirection.forget ||
    explicitDirection.revisit
  ) {
    return (
      CONVERSATION_MODES
        .MEMORY
    );
  }

  if (
    explicitDirection
      .returnFromDetour &&
    (
      context?.detourActive ||
      context
        ?.detourReturnPoint ||
      context?.returnPoint
    )
  ) {
    return (
      CONVERSATION_MODES
        .PROJECT_CONTINUITY
    );
  }

  if (
    explicitDirection.detour
  ) {
    return (
      CONVERSATION_MODES
        .DETOUR
    );
  }

  /**
   * Direct creator execution requests should not be blocked by
   * a historical emotional or project state.
   */
  if (
    explicitDirection.create
  ) {
    return (
      CONVERSATION_MODES
        .CREATION
    );
  }

  if (
    context
      ?.creatorIsReturning &&
    hasReliableContinuity(
      context
    )
  ) {
    return (
      CONVERSATION_MODES
        .RETURNING
    );
  }

  if (fragileIdea) {
    return (
      CONVERSATION_MODES
        .CONFIDENCE
    );
  }

  if (
    emotionalState ===
    "celebrating"
  ) {
    return (
      CONVERSATION_MODES
        .CELEBRATION
    );
  }

  if (
    emotionalState ===
      "disappointed" ||
    emotionalState ===
      "doubting"
  ) {
    return (
      CONVERSATION_MODES
        .RECOVERY
    );
  }

  if (
    emotionalState ===
      "stuck" ||
    emotionalState ===
      "overwhelmed"
  ) {
    return (
      CONVERSATION_MODES
        .CONFIDENCE
    );
  }

  if (
    context
      ?.projectReadyToPublish ||
    intent === "publish" ||
    creatorStage ===
      "publishing"
  ) {
    return (
      CONVERSATION_MODES
        .PUBLISHING
    );
  }

  if (
    context
      ?.projectReadyToRefine ||
    intent === "refine" ||
    creatorStage ===
      "refining"
  ) {
    return (
      CONVERSATION_MODES
        .REFINEMENT
    );
  }

  if (
    context
      ?.projectReadyToGenerate ||
    intent === "generate" ||
    intent === "share-idea" ||
    creatorStage ===
      "creating"
  ) {
    return (
      CONVERSATION_MODES
        .CREATION
    );
  }

  if (
    context
      ?.creatorIsReturning &&
    (
      hasProjectMemory(
        context
      ) ||
      context?.returnPoint
    )
  ) {
    return (
      CONVERSATION_MODES
        .PROJECT_CONTINUITY
    );
  }

  if (
    intent === "imagine"
  ) {
    return (
      CONVERSATION_MODES
        .IMAGINATION
    );
  }

  if (
    intent === "remember"
  ) {
    return (
      CONVERSATION_MODES
        .MEMORY
    );
  }

  if (
    intent === "discover"
  ) {
    return (
      CONVERSATION_MODES
        .DISCOVERY
    );
  }

  if (
    intent === "reflect"
  ) {
    return (
      CONVERSATION_MODES
        .REFLECTION
    );
  }

  if (
    intent === "learn"
  ) {
    return (
      CONVERSATION_MODES
        .LEARNING
    );
  }

  if (
    intent === "solve"
  ) {
    return (
      CONVERSATION_MODES
        .PROBLEM_SOLVING
    );
  }

  if (
    creatorStage === "new"
  ) {
    return (
      CONVERSATION_MODES
        .WELCOME
    );
  }

  return (
    CONVERSATION_MODES
      .LISTENING
  );
}

/**
 * Chooses the Mentor's emotional delivery style.
 */
function chooseMentorTone({
  mode,
  analysis,
  context,
}) {
  const emotionalState =
    analysis
      ?.analysis
      ?.emotionalState
      ?.value;

  const creatorJourney =
    context
      ?.creatorJourney ||
    "guide";

  if (
    mode ===
    CONVERSATION_MODES
      .CELEBRATION
  ) {
    return (
      MENTOR_TONES
        .CELEBRATORY
    );
  }

  if (
    mode ===
      CONVERSATION_MODES
        .RECOVERY ||
    mode ===
      CONVERSATION_MODES
        .CONFIDENCE
  ) {
    return (
      MENTOR_TONES
        .REASSURING
    );
  }

  if (
    mode ===
      CONVERSATION_MODES
        .PAUSING
  ) {
    return (
      MENTOR_TONES.CALM
    );
  }

  if (
    mode ===
      CONVERSATION_MODES
        .RETURNING ||
    mode ===
      CONVERSATION_MODES
        .PROJECT_CONTINUITY
  ) {
    return (
      MENTOR_TONES
        .QUIETLY_CONFIDENT
    );
  }

  if (
    mode ===
      CONVERSATION_MODES
        .CORRECTION
  ) {
    return (
      MENTOR_TONES.CALM
    );
  }

  if (
    mode ===
      CONVERSATION_MODES
        .MEMORY
  ) {
    return (
      MENTOR_TONES
        .QUIETLY_CONFIDENT
    );
  }

  if (
    mode ===
      CONVERSATION_MODES
        .DETOUR
  ) {
    return (
      MENTOR_TONES
        .COLLABORATIVE
    );
  }

  if (
    mode ===
      CONVERSATION_MODES
        .REFLECTION ||
    mode ===
      CONVERSATION_MODES
        .DISCOVERY
  ) {
    return (
      MENTOR_TONES
        .REFLECTIVE
    );
  }

  if (
    mode ===
    CONVERSATION_MODES
      .IMAGINATION
  ) {
    return (
      MENTOR_TONES.CURIOUS
    );
  }

  if (
    mode ===
      CONVERSATION_MODES
        .LEARNING ||
    mode ===
      CONVERSATION_MODES
        .PROBLEM_SOLVING
  ) {
    return (
      MENTOR_TONES.PRACTICAL
    );
  }

  if (
    creatorJourney ===
    "expert"
  ) {
    return (
      MENTOR_TONES
        .QUIETLY_CONFIDENT
    );
  }

  if (
    creatorJourney ===
    "together"
  ) {
    return (
      MENTOR_TONES
        .COLLABORATIVE
    );
  }

  if (
    creatorJourney ===
    "surprise"
  ) {
    return (
      MENTOR_TONES.CURIOUS
    );
  }

  if (
    emotionalState ===
      "excited" ||
    emotionalState ===
      "confident"
  ) {
    return (
      MENTOR_TONES
        .ENCOURAGING
    );
  }

  return (
    MENTOR_TONES.WARM
  );
}

/**
 * Chooses the planner-level primary conversational action.
 */
function choosePrimaryAction({
  mode,
  analysis,
  context,
  explicitDirection,
}) {
  const nextAction =
    analysis
      ?.strategy
      ?.nextAction;

  const fragileIdea =
    analysis
      ?.analysis
      ?.fragileIdea
      ?.value;

  if (
    mode ===
    CONVERSATION_MODES
      .PAUSING
  ) {
    return (
      PLAN_ACTIONS
        .PRESERVE_SESSION_HANDOFF
    );
  }

  if (
    mode ===
    CONVERSATION_MODES
      .CORRECTION
  ) {
    return (
      PLAN_ACTIONS
        .ACKNOWLEDGE_CORRECTION
    );
  }

  if (
    mode ===
    CONVERSATION_MODES
      .MEMORY
  ) {
    if (
      explicitDirection.forget
    ) {
      return (
        PLAN_ACTIONS
          .ACKNOWLEDGE_FORGET_REQUEST
      );
    }

    if (
      explicitDirection.remember
    ) {
      return (
        PLAN_ACTIONS
          .ACKNOWLEDGE_MEMORY_REQUEST
      );
    }

    if (
      explicitDirection.revisit
    ) {
      return (
        PLAN_ACTIONS
          .RECALL_MEMORY
      );
    }
  }

  if (
    mode ===
    CONVERSATION_MODES
      .DETOUR
  ) {
    return (
      PLAN_ACTIONS
        .CAPTURE_DETOUR
    );
  }

  if (
    explicitDirection
      .returnFromDetour
  ) {
    return (
      PLAN_ACTIONS
        .RETURN_FROM_DETOUR
    );
  }

  if (
    mode ===
      CONVERSATION_MODES
        .RETURNING ||
    mode ===
      CONVERSATION_MODES
        .PROJECT_CONTINUITY
  ) {
    return (
      PLAN_ACTIONS
        .RESTORE_PROJECT_CONTEXT
    );
  }

  if (fragileIdea) {
    return (
      PLAN_ACTIONS
        .PROTECT_IDEA
    );
  }

  switch (mode) {
    case CONVERSATION_MODES
      .WELCOME:
      return (
        PLAN_ACTIONS
          .ASK_ONE_QUESTION
      );

    case CONVERSATION_MODES
      .IMAGINATION:
      return (
        PLAN_ACTIONS
          .INVITE_IMAGINATION
      );

    case CONVERSATION_MODES
      .DISCOVERY:
      return (
        PLAN_ACTIONS
          .INVITE_REFLECTION
      );

    case CONVERSATION_MODES
      .REFLECTION:
      return (
        PLAN_ACTIONS
          .REFLECT_PATTERN
      );

    case CONVERSATION_MODES
      .CONFIDENCE:
      return (
        PLAN_ACTIONS
          .OFFER_SMALL_STEP
      );

    case CONVERSATION_MODES
      .RECOVERY:
      return (
        PLAN_ACTIONS
          .PROTECT_IDEA
      );

    case CONVERSATION_MODES
      .CREATION:
      if (
        explicitDirection.create ||
        context
          ?.projectReadyToGenerate ||
        context
          ?.minimumCreationContextReady ||
        context
          ?.requiredInformationComplete
      ) {
        return (
          PLAN_ACTIONS
            .BEGIN_CREATION
        );
      }

      return (
        PLAN_ACTIONS
          .EXPLORE_IDEA
      );

    case CONVERSATION_MODES
      .REFINEMENT:
      return (
        PLAN_ACTIONS
          .REVIEW_CREATION
      );

    case CONVERSATION_MODES
      .PUBLISHING:
      return (
        PLAN_ACTIONS
          .PREPARE_PUBLISHING
      );

    case CONVERSATION_MODES
      .CELEBRATION:
      return (
        PLAN_ACTIONS
          .CELEBRATE_PROGRESS
      );

    case CONVERSATION_MODES
      .LEARNING:

    case CONVERSATION_MODES
      .PROBLEM_SOLVING:
      return (
        PLAN_ACTIONS
          .OFFER_SMALL_STEP
      );

    default:
      break;
  }

  if (
    nextAction ===
    "begin-creation"
  ) {
    return (
      PLAN_ACTIONS
        .BEGIN_CREATION
    );
  }

  if (
    nextAction ===
    "offer-perspective-with-permission"
  ) {
    return (
      PLAN_ACTIONS
        .OFFER_PERSPECTIVE
    );
  }

  return (
    PLAN_ACTIONS.LISTEN
  );
}

/**
 * Chooses what the Mentor should actually do next.
 */
function chooseMentorMove({
  mode,
  primaryAction,
  analysis,
  context,
  explicitDirection,
}) {
  const intent =
    analysis
      ?.analysis
      ?.intent
      ?.value;

  const creatorJourney =
    context
      ?.creatorJourney ||
    "guide";

  const creatorExperience =
    context
      ?.creatorExperience;

  /**
   * Explicit current creator requests outrank history.
   */
  if (
    context
      ?.requestedDemonstration
  ) {
    return (
      MENTOR_MOVES
        .DEMONSTRATE
    );
  }

  if (
    context
      ?.requestedExample
  ) {
    return (
      MENTOR_MOVES.SHOW
    );
  }

  if (
    context
      ?.requestedExplanation ||
    context
      ?.creatorExplicitlyAskedForExplanation
  ) {
    return (
      MENTOR_MOVES.TEACH
    );
  }

  if (
    context
      ?.requestedChange
  ) {
    return (
      MENTOR_MOVES.REFINE
    );
  }

  if (
    explicitDirection.create
  ) {
    return (
      MENTOR_MOVES.CREATE
    );
  }

  if (
    mode ===
    CONVERSATION_MODES
      .PAUSING
  ) {
    return (
      MENTOR_MOVES.PAUSE
    );
  }

  if (
    mode ===
    CONVERSATION_MODES
      .CORRECTION
  ) {
    return (
      MENTOR_MOVES
        .ACKNOWLEDGE
    );
  }

  if (
    mode ===
    CONVERSATION_MODES
      .MEMORY
  ) {
    if (
      explicitDirection.revisit
    ) {
      return (
        MENTOR_MOVES.RECALL
      );
    }

    return (
      MENTOR_MOVES
        .ACKNOWLEDGE
    );
  }

  if (
    mode ===
    CONVERSATION_MODES
      .DETOUR
  ) {
    return (
      MENTOR_MOVES
        .CAPTURE_AND_CONTINUE
    );
  }

  if (
    explicitDirection
      .returnFromDetour
  ) {
    return (
      MENTOR_MOVES
        .RESTORE_CONTEXT
    );
  }

  if (
    mode ===
      CONVERSATION_MODES
        .RETURNING ||
    mode ===
      CONVERSATION_MODES
        .PROJECT_CONTINUITY
  ) {
    return (
      MENTOR_MOVES
        .RESTORE_CONTEXT
    );
  }

  /**
   * Experienced creators may work independently.
   */
  if (
    creatorJourney ===
      "expert" &&
    !context
      ?.requestedHelp &&
    !context
      ?.creatorExplicitlyAskedForGuidance &&
    context
      ?.mentorInvoked ===
      false
  ) {
    return (
      MENTOR_MOVES.CONTINUE
    );
  }

  if (
    creatorExperience ===
      "experienced" &&
    !context
      ?.requestedHelp &&
    !context
      ?.creatorExplicitlyAskedForGuidance &&
    context
      ?.mentorInvoked ===
      false
  ) {
    return (
      MENTOR_MOVES.CONTINUE
    );
  }

  if (
    mode ===
    CONVERSATION_MODES
      .CELEBRATION
  ) {
    return (
      MENTOR_MOVES
        .CELEBRATE
    );
  }

  if (
    mode ===
    CONVERSATION_MODES
      .REFLECTION
  ) {
    return (
      MENTOR_MOVES.REFLECT
    );
  }

  if (
    mode ===
    CONVERSATION_MODES
      .DISCOVERY
  ) {
    return (
      MENTOR_MOVES.RECALL
    );
  }

  if (
    mode ===
    CONVERSATION_MODES
      .LEARNING
  ) {
    return (
      MENTOR_MOVES.TEACH
    );
  }

  if (
    mode ===
    CONVERSATION_MODES
      .PROBLEM_SOLVING
  ) {
    return (
      MENTOR_MOVES.SUGGEST
    );
  }

  if (
    mode ===
    CONVERSATION_MODES
      .PUBLISHING
  ) {
    return (
      MENTOR_MOVES.PREPARE
    );
  }

  if (
    mode ===
    CONVERSATION_MODES
      .REFINEMENT
  ) {
    return (
      MENTOR_MOVES.REFINE
    );
  }

  if (
    mode ===
      CONVERSATION_MODES
        .CREATION &&
    (
      intent ===
        "generate" ||
      primaryAction ===
        PLAN_ACTIONS
          .BEGIN_CREATION
    )
  ) {
    return (
      MENTOR_MOVES.CREATE
    );
  }

  if (
    mode ===
    CONVERSATION_MODES
      .CREATION
  ) {
    return (
      MENTOR_MOVES.DISCUSS
    );
  }

  if (
    mode ===
    CONVERSATION_MODES
      .IMAGINATION
  ) {
    return (
      MENTOR_MOVES.DISCUSS
    );
  }

  if (
    mode ===
    CONVERSATION_MODES
      .WELCOME
  ) {
    return (
      MENTOR_MOVES.ASK
    );
  }

  if (
    mode ===
      CONVERSATION_MODES
        .CONFIDENCE ||
    mode ===
      CONVERSATION_MODES
        .RECOVERY
  ) {
    return (
      MENTOR_MOVES.SUGGEST
    );
  }

  if (
    primaryAction ===
    PLAN_ACTIONS
      .ASK_ONE_QUESTION
  ) {
    return (
      MENTOR_MOVES.ASK
    );
  }

  if (
    primaryAction ===
    PLAN_ACTIONS
      .OFFER_PERSPECTIVE
  ) {
    return (
      MENTOR_MOVES.SUGGEST
    );
  }

  return (
    MENTOR_MOVES.LISTEN
  );
}

/**
 * Chooses secondary actions that may support the main move.
 */
function chooseSupportingActions({
  mode,
  analysis,
  context,
  explicitDirection,
}) {
  const actions = [];

  const fragileIdea =
    analysis
      ?.analysis
      ?.fragileIdea
      ?.value;

  const knownPatterns =
    asArray(
      context?.knownPatterns
    );

  const inspirationDrawerCount =
    asNumber(
      context
        ?.inspirationDrawerCount
    ) ||
    asArray(
      context
        ?.inspirationDrawer
    ).length ||
    0;

  if (fragileIdea) {
    actions.push(
      PLAN_ACTIONS
        .OFFER_INSPIRATION_DRAWER
    );
  }

  if (
    mode ===
      CONVERSATION_MODES
        .REFLECTION &&
    knownPatterns.length > 0
  ) {
    actions.push(
      PLAN_ACTIONS
        .RECALL_MEMORY
    );
  }

  if (
    mode ===
      CONVERSATION_MODES
        .DISCOVERY &&
    asNumber(
      context
        ?.conversationCount
    ) > 0
  ) {
    actions.push(
      PLAN_ACTIONS
        .RECALL_MEMORY
    );
  }

  if (
    mode ===
      CONVERSATION_MODES
        .RECOVERY &&
    inspirationDrawerCount > 0
  ) {
    actions.push(
      PLAN_ACTIONS
        .OFFER_INSPIRATION_DRAWER
    );
  }

  if (
    (
      mode ===
        CONVERSATION_MODES
          .RETURNING ||
      mode ===
        CONVERSATION_MODES
          .PROJECT_CONTINUITY
    ) &&
    hasProjectContext(
      context
    )
  ) {
    actions.push(
      PLAN_ACTIONS
        .RESTORE_PROJECT_CONTEXT
    );
  }

  if (
    mode ===
      CONVERSATION_MODES
        .DETOUR &&
    hasReliableContinuity(
      context
    )
  ) {
    actions.push(
      PLAN_ACTIONS
        .CAPTURE_AND_CONTINUE
    );
  }

  if (
    explicitDirection
      .returnFromDetour
  ) {
    actions.push(
      PLAN_ACTIONS
        .RESTORE_PROJECT_CONTEXT
    );
  }

  if (
    mode ===
      CONVERSATION_MODES
        .CORRECTION &&
    hasProjectContext(
      context
    )
  ) {
    actions.push(
      PLAN_ACTIONS
        .RESTORE_PROJECT_CONTEXT
    );
  }

  return uniqueValues(
    actions
  );
}

/**
 * Chooses which forms of memory may help this conversation.
 *
 * A request means:
 *
 * "This context may be useful."
 *
 * It does not force recall, persistence, mutation or deletion.
 */
function chooseMemoryRequests({
  mode,
  primaryAction,
  context,
  explicitDirection,
}) {
  const requests = [];

  if (
    !context
      ?.creatorProfile
  ) {
    requests.push(
      MEMORY_REQUEST_TYPES
        .CREATOR_PROFILE
    );
  }

  if (
    context
      ?.creatorMemoryContext
  ) {
    requests.push(
      MEMORY_REQUEST_TYPES
        .FULL_MEMORY_CONTEXT
    );
  }

  if (
    mode ===
    CONVERSATION_MODES
      .WELCOME
  ) {
    requests.push(
      MEMORY_REQUEST_TYPES
        .CREATOR_PROFILE
    );
  }

  if (
    [
      CONVERSATION_MODES
        .CREATION,

      CONVERSATION_MODES
        .REFINEMENT,

      CONVERSATION_MODES
        .PUBLISHING,

      CONVERSATION_MODES
        .RETURNING,

      CONVERSATION_MODES
        .PROJECT_CONTINUITY,

      CONVERSATION_MODES
        .CORRECTION,

      CONVERSATION_MODES
        .DETOUR,
    ].includes(mode)
  ) {
    requests.push(
      MEMORY_REQUEST_TYPES
        .ACTIVE_PROJECT,

      MEMORY_REQUEST_TYPES
        .PROJECT_MEMORY
    );
  }

  if (
    mode ===
      CONVERSATION_MODES
        .DISCOVERY ||
    mode ===
      CONVERSATION_MODES
        .REFLECTION
  ) {
    requests.push(
      MEMORY_REQUEST_TYPES
        .RECENT_CONVERSATIONS,

      MEMORY_REQUEST_TYPES
        .CREATIVE_PATTERNS,

      MEMORY_REQUEST_TYPES
        .OBSERVATIONS
    );
  }

  if (
    mode ===
      CONVERSATION_MODES
        .RECOVERY ||
    primaryAction ===
      PLAN_ACTIONS
        .PROTECT_IDEA
  ) {
    requests.push(
      MEMORY_REQUEST_TYPES
        .RELEVANT_IDEAS,

      MEMORY_REQUEST_TYPES
        .INSPIRATION_DRAWER
    );
  }

  if (
    mode ===
    CONVERSATION_MODES
      .CELEBRATION
  ) {
    requests.push(
      MEMORY_REQUEST_TYPES
        .MILESTONES,

      MEMORY_REQUEST_TYPES
        .ACTIVE_PROJECT
    );
  }

  if (
    mode ===
      CONVERSATION_MODES
        .MEMORY
  ) {
    requests.push(
      MEMORY_REQUEST_TYPES
        .FULL_MEMORY_CONTEXT
    );

    if (
      hasProjectContext(
        context
      )
    ) {
      requests.push(
        MEMORY_REQUEST_TYPES
          .ACTIVE_PROJECT,

        MEMORY_REQUEST_TYPES
          .PROJECT_MEMORY
      );
    }
  }

  if (
    asArray(
      context
        ?.deferredMemories
    ).length > 0 ||
    explicitDirection.revisit
  ) {
    requests.push(
      MEMORY_REQUEST_TYPES
        .DEFERRED_MEMORIES
    );
  }

  if (
    mode ===
      CONVERSATION_MODES
        .PAUSING ||
    context
      ?.captureSessionHandoff ||
    context
      ?.sessionHandoff ||
    explicitDirection.detour ||
    explicitDirection
      .returnFromDetour
  ) {
    requests.push(
      MEMORY_REQUEST_TYPES
        .SESSION_HANDOFF,

      MEMORY_REQUEST_TYPES
        .ACTIVE_PROJECT,

      MEMORY_REQUEST_TYPES
        .PROJECT_MEMORY
    );
  }

  if (
    requests.length === 0
  ) {
    requests.push(
      MEMORY_REQUEST_TYPES.NONE
    );
  }

  return uniqueValues(
    requests
  );
}

/**
 * Creates richer metadata around the existing string-based
 * memory request contract.
 *
 * Existing consumers may continue reading memory.requests.
 * Newer consumers may inspect memory.requestDetails.
 */
function createMemoryRequestDetails({
  requests,
  context,
  explicitDirection,
}) {
  const projectId =
    getProjectId(
      context
    );

  return requests.map(
    (requestType) => ({
      type: requestType,

      projectId:
        requestType ===
          MEMORY_REQUEST_TYPES
            .PROJECT_MEMORY ||
        requestType ===
          MEMORY_REQUEST_TYPES
            .ACTIVE_PROJECT
          ? projectId
          : null,

      projectScoped:
        requestType ===
          MEMORY_REQUEST_TYPES
            .PROJECT_MEMORY,

      creatorExplicitlyRequested:
        Boolean(
          explicitDirection
            ?.remember ||
          explicitDirection
            ?.forget ||
          explicitDirection
            ?.revisit ||
          explicitDirection
            ?.correction
        ),

      mutationAllowed: false,

      informationalOnly: true,
    })
  );
}

/**
 * Determines how much the Mentor should speak or ask.
 */
function createConversationLimits({
  mode,
  mentorMove,
  context,
  explicitDirection,
}) {
  const creatorJourney =
    context
      ?.creatorJourney ||
    "guide";

  const limits = {
    maximumQuestions: 1,
    maximumSuggestions: 2,

    shouldExplainReasoning: true,

    shouldWaitForCreatorReply: true,

    responseLength: "medium",
  };

  if (
    context
      ?.preferredResponseDepth
  ) {
    limits.responseLength =
      context
        .preferredResponseDepth;
  }

  /**
   * Explicit build / next-step direction should stay fast.
   */
  if (
    explicitDirection.continue &&
    (
      isBuildMode(
        context
      ) ||
      context
        ?.creatorExplicitlyAskedForNextStep
    )
  ) {
    return {
      ...limits,

      maximumQuestions: 0,
      maximumSuggestions: 1,

      shouldExplainReasoning: false,

      shouldWaitForCreatorReply: false,

      responseLength: "short",
    };
  }

  /**
   * Direct execution moves should not end with another
   * unnecessary question.
   */
  if (
    [
      MENTOR_MOVES.CREATE,
      MENTOR_MOVES.REFINE,
      MENTOR_MOVES.DEMONSTRATE,
      MENTOR_MOVES.SHOW,
      MENTOR_MOVES.PREPARE,
      MENTOR_MOVES.RESTORE_CONTEXT,
    ].includes(
      mentorMove
    )
  ) {
    return {
      ...limits,

      maximumQuestions: 0,
      maximumSuggestions: 1,

      shouldExplainReasoning: false,

      shouldWaitForCreatorReply: false,

      responseLength: "short",
    };
  }

  if (
    mentorMove ===
      MENTOR_MOVES
        .ACKNOWLEDGE
  ) {
    return {
      ...limits,

      maximumQuestions: 0,
      maximumSuggestions: 0,

      shouldExplainReasoning: false,

      shouldWaitForCreatorReply: false,

      responseLength: "short",
    };
  }

  if (
    mentorMove ===
      MENTOR_MOVES
        .CAPTURE_AND_CONTINUE
  ) {
    return {
      ...limits,

      maximumQuestions: 0,
      maximumSuggestions: 1,

      shouldExplainReasoning: false,

      shouldWaitForCreatorReply: false,

      responseLength: "short",
    };
  }

  if (
    mentorMove ===
    MENTOR_MOVES.PAUSE
  ) {
    return {
      ...limits,

      maximumQuestions: 0,
      maximumSuggestions: 0,

      shouldExplainReasoning: false,

      shouldWaitForCreatorReply: false,

      responseLength: "short",
    };
  }

  if (
    mentorMove ===
    MENTOR_MOVES.CONTINUE
  ) {
    return {
      ...limits,

      maximumQuestions: 0,
      maximumSuggestions: 0,

      shouldExplainReasoning: false,

      shouldWaitForCreatorReply: false,

      responseLength: "short",
    };
  }

  if (
    context
      ?.informationSaturation ===
      "overloaded" ||
    context
      ?.informationSaturation ===
      "high"
  ) {
    return {
      ...limits,

      maximumQuestions: 0,
      maximumSuggestions: 1,

      shouldExplainReasoning: false,

      responseLength: "short",
    };
  }

  if (
    context
      ?.guidanceWindow ===
      "closed-for-now"
  ) {
    return {
      ...limits,

      maximumQuestions: 0,
      maximumSuggestions: 0,

      shouldExplainReasoning: false,

      responseLength: "short",
    };
  }

  if (
    creatorJourney ===
    "expert"
  ) {
    return {
      ...limits,

      maximumQuestions: 0,
      maximumSuggestions: 1,

      shouldExplainReasoning: false,

      responseLength: "short",
    };
  }

  if (
    creatorJourney ===
    "surprise"
  ) {
    return {
      ...limits,

      maximumQuestions: 1,
      maximumSuggestions: 3,

      responseLength: "medium",
    };
  }

  if (
    mode ===
      CONVERSATION_MODES
        .CONFIDENCE ||
    mode ===
      CONVERSATION_MODES
        .RECOVERY
  ) {
    return {
      ...limits,

      maximumQuestions: 1,
      maximumSuggestions: 1,

      responseLength: "short",
    };
  }

  if (
    mode ===
    CONVERSATION_MODES
      .LEARNING
  ) {
    return {
      ...limits,

      maximumQuestions: 1,
      maximumSuggestions: 1,

      shouldExplainReasoning: true,

      responseLength: "medium",
    };
  }

  return limits;
}

function createGuardRails(
  analysis
) {
  const avoid = [
    ...asArray(
      analysis?.avoid
    ),

    "Do not diagnose the creator.",

    "Do not pretend to know the creator better than they know themselves.",

    "Do not repeat questions already answered in current context or reliable memory.",

    "Do not overwhelm the creator with a questionnaire.",

    "Do not claim ownership of the creator's work.",

    "Do not make success guarantees.",

    "Do not use empty praise without evidence.",

    "Do not pressure the creator to publish unfinished work.",

    "Do not force teaching when the creator wants to create.",

    "Do not explain something the creator has asked you simply to do.",

    "Do not interrupt an experienced creator with unnecessary questions.",

    "Do not replace the creator's creative decision with the Mentor's preference.",

    "Do not treat stored inference as creator-confirmed truth.",

    "Do not let historical memory override explicit current direction.",

    "Do not let a historical emotional state override the creator's clear present behaviour.",

    "Do not mix project-scoped memory between projects.",

    "Do not treat specialist-agent signals as creator-approved truth.",

    "Do not expose specialist-agent machinery in normal creator conversation.",

    "Do not claim that memory was saved merely because the planner detected a remember request.",

    "Do not claim that memory was deleted merely because the planner detected a forget request.",

    "Do not ignore an explicit creator correction because older memory disagrees.",

    "Do not continue using a corrected memory as though it remains authoritative.",

    "Do not automatically reopen every deferred topic.",

    "Do not turn a brief detour into a long new conversation.",

    "Do not lose the creator's previous task when handling a quick detour.",

    "Do not make the creator rediscover project context already available to the Mentor.",

    "Do not restore an entire project history when only a small continuation landmark is needed.",

    "Do not create unnecessary friction between creator intent and execution.",

    "Do not add a closing question when the selected action is already complete.",
  ];

  return uniqueValues(
    avoid
  );
}

function createProtocol({
  analysis,
  context,
  explicitDirection,
}) {
  return {
    ...CREATOR_PROTOCOL,

    confidenceProtectionRequired:
      Boolean(
        analysis
          ?.analysis
          ?.fragileIdea
          ?.value
      ) ||
      analysis
        ?.analysis
        ?.emotionalState
        ?.value ===
        "doubting",

    memoryShouldInformResponse:
      Boolean(
        context
          ?.creatorMemoryContext ||
        context
          ?.conversationCount ||
        context
          ?.activeProject ||
        asArray(
          context
            ?.knownPatterns
        ).length > 0
      ),

    explicitPresentDirectionAvailable:
      Boolean(
        explicitDirection
          ?.presentDirectionAvailable
      ),

    explicitMemoryDirection:
      explicitDirection
        ?.memoryDirection ||
      MEMORY_DIRECTIONS.NONE,

    projectContinuityAvailable:
      hasProjectContext(
        context
      ),

    projectMemoryAvailable:
      hasProjectMemory(
        context
      ),

    sessionHandoffAvailable:
      hasSessionHandoff(
        context
      ),

    specialistMemorySignalsPresent:
      hasSpecialistMemorySignals(
        context
      ),

    creatorJourney:
      context
        ?.creatorJourney ||
      "guide",

    creatorExperience:
      context
        ?.creatorExperience ||
      null,
  };
}

function createProjectState(
  context
) {
  const projectMemories =
    getProjectScopedMemories(
      context
    );

  return {
    activeProjectId:
      getProjectId(
        context
      ),

    activeProject:
      cloneValue(
        context
          ?.activeProject ||
        null
      ),

    projectType:
      context
        ?.projectType ||
      context
        ?.activeProject
        ?.projectType ||
      context
        ?.activeProject
        ?.type ||
      null,

    projectTitle:
      context
        ?.projectTitle ||
      context
        ?.activeProject
        ?.title ||
      context
        ?.activeProject
        ?.name ||
      null,

    activeIdea:
      cloneValue(
        context
          ?.activeIdea ||
        null
      ),

    activeStage:
      cloneValue(
        context
          ?.activeStage ||
        null
      ),

    activeScene:
      cloneValue(
        context
          ?.activeScene ||
        null
      ),

    activeCharacter:
      cloneValue(
        context
          ?.activeCharacter ||
        null
      ),

    activeAsset:
      cloneValue(
        context
          ?.activeAsset ||
        null
      ),

    previousTask:
      cloneValue(
        context
          ?.previousTask ||
        null
      ),

    currentTask:
      cloneValue(
        context
          ?.currentTask ||
        null
      ),

    returnPoint:
      cloneValue(
        context
          ?.returnPoint ||
        null
      ),

    nextTask:
      cloneValue(
        context
          ?.nextTask ||
        null
      ),

    minimumCreationContextReady:
      Boolean(
        context
          ?.minimumCreationContextReady
      ),

    requiredInformationComplete:
      Boolean(
        context
          ?.requiredInformationComplete
      ),

    readyToGenerate:
      Boolean(
        context
          ?.projectReadyToGenerate
      ),

    readyToRefine:
      Boolean(
        context
          ?.projectReadyToRefine
      ),

    readyToPublish:
      Boolean(
        context
          ?.projectReadyToPublish
      ),

    memoryAvailable:
      projectMemories.length >
      0,

    projectMemoryCount:
      projectMemories.length,

    specialistSignalsPresent:
      hasSpecialistMemorySignals(
        context
      ),
  };
}

function createSessionState(
  context,
  explicitDirection
) {
  return {
    sessionId:
      context
        ?.sessionId ||
      null,

    sessionStartedAt:
      context
        ?.sessionStartedAt ||
      null,

    creatorIsReturning:
      Boolean(
        context
          ?.creatorIsReturning
      ),

    handoffAvailable:
      hasSessionHandoff(
        context
      ),

    handoff:
      cloneValue(
        context
          ?.sessionHandoff ||
        null
      ),

    shouldCaptureHandoff:
      Boolean(
        context
          ?.captureSessionHandoff ||
        explicitDirection
          ?.pause
      ),

    previousTask:
      cloneValue(
        context
          ?.previousTask ||
        null
      ),

    currentTask:
      cloneValue(
        context
          ?.currentTask ||
        null
      ),

    nextTask:
      cloneValue(
        context
          ?.nextTask ||
        null
      ),

    returnPoint:
      cloneValue(
        context
          ?.returnPoint ||
        null
      ),

    detour: {
      active:
        Boolean(
          context
            ?.detourActive ||
          explicitDirection
            ?.detour
        ),

      requested:
        Boolean(
          explicitDirection
            ?.detour
        ),

      completed:
        Boolean(
          context
            ?.detourCompleted ||
          explicitDirection
            ?.returnFromDetour
        ),

      topic:
        cloneValue(
          context
            ?.detourTopic ||
          null
        ),

      returnPoint:
        cloneValue(
          context
            ?.detourReturnPoint ||
          context
            ?.returnPoint ||
          null
        ),
    },
  };
}

function createMemoryState(
  context,
  memoryRequests,
  memoryBundle,
  memoryIntent,
  requestDetails
) {
  return {
    connected:
      Boolean(
        memoryBundle
          ?.connected
      ),

    richContextAvailable:
      Boolean(
        memoryBundle
          ?.richContext &&
        Object.keys(
          memoryBundle
            .richContext
        ).length > 0
      ),

    compactContextAvailable:
      Boolean(
        memoryBundle
          ?.compactContext &&
        Object.keys(
          memoryBundle
            .compactContext
        ).length > 0
      ),

    requests:
      cloneValue(
        memoryRequests
      ),

    requestDetails:
      cloneValue(
        requestDetails
      ),

    intent:
      cloneValue(
        memoryIntent
      ),

    shouldRecallMemory:
      !memoryRequests.includes(
        MEMORY_REQUEST_TYPES.NONE
      ),

    creatorProfileAvailable:
      Boolean(
        context
          ?.creatorProfile
      ),

    projectMemoryAvailable:
      hasProjectMemory(
        context
      ),

    projectMemoryCount:
      getProjectScopedMemories(
        context
      ).length,

    deferredMemoryAvailable:
      asArray(
        context
          ?.deferredMemories
      ).length > 0,

    patternMemoryAvailable:
      asArray(
        context
          ?.knownPatterns
      ).length > 0,

    observationMemoryAvailable:
      asArray(
        context
          ?.existingObservations
      ).length > 0,

    milestoneMemoryAvailable:
      asArray(
        context
          ?.milestones
      ).length > 0,

    sessionHandoffAvailable:
      hasSessionHandoff(
        context
      ),

    specialistSignalsPresent:
      hasSpecialistMemorySignals(
        context
      ),

    /**
     * The planner may describe memory state but cannot claim a
     * write/delete/correction was executed.
     */
    mutationExecuted: false,

    context:
      cloneValue(
        context
      ),
  };
}

function createContinuityState(
  context,
  explicitDirection
) {
  return {
    available:
      hasReliableContinuity(
        context
      ),

    projectAvailable:
      hasProjectContext(
        context
      ),

    projectMemoryAvailable:
      hasProjectMemory(
        context
      ),

    sessionHandoffAvailable:
      hasSessionHandoff(
        context
      ),

    returning:
      Boolean(
        context
          ?.creatorIsReturning
      ),

    detourActive:
      Boolean(
        context
          ?.detourActive
      ),

    returningFromDetour:
      Boolean(
        explicitDirection
          ?.returnFromDetour
      ),

    returnPoint:
      cloneValue(
        context
          ?.detourReturnPoint ||
        context
          ?.returnPoint ||
        null
      ),

    nextTask:
      cloneValue(
        context
          ?.nextTask ||
        null
      ),

    restorationPolicy:
      "restore-minimum-useful-context",
  };
}

function createPlannerSummary({
  mode,
  mentorMove,
  tone,
  primaryAction,
  memoryRequests,
  memoryIntent,
  analysis,
  context,
}) {
  const emotionalState =
    analysis
      ?.analysis
      ?.emotionalState
      ?.value ||
    "neutral";

  const intent =
    analysis
      ?.analysis
      ?.intent
      ?.value ||
    "unknown";

  const projectId =
    getProjectId(
      context
    );

  const memoryDirection =
    memoryIntent
      ?.direction ||
    MEMORY_DIRECTIONS.NONE;

  return (
    `Use ${mode} mode with a ${tone} tone. ` +
    `The Mentor's next move is ${mentorMove}. ` +
    `The creator appears ${emotionalState} ` +
    `and their likely intent is ${intent}. ` +
    `The primary action is ${primaryAction}. ` +
    `Active project: ${
      projectId || "none"
    }. ` +
    `Memory direction: ${memoryDirection}. ` +
    `Memory requested: ${memoryRequests.join(
      ", "
    )}.`
  );
}

function createFallbackPlan({
  message,
  context,
  error = null,
}) {
  const safeContext = {
    ...cloneValue(
      DEFAULT_PLANNER_CONTEXT
    ),

    ...cloneValue(
      context
    ),
  };

  const explicitDirection =
    detectExplicitDirection({
      message,

      context:
        safeContext,
    });

  const memoryIntent =
    createMemoryIntent({
      explicitDirection,

      context:
        safeContext,
    });

  return {
    id:
      createPlanId(),

    planner:
      "conversation-planner",

    version:
      CONVERSATION_PLANNER_VERSION,

    input: {
      message:
        normaliseString(
          message
        ),
    },

    conversation: {
      mode:
        CONVERSATION_MODES
          .LISTENING,

      mentorMove:
        MENTOR_MOVES.LISTEN,

      tone:
        MENTOR_TONES.WARM,

      primaryAction:
        PLAN_ACTIONS.LISTEN,

      supportingActions: [],

      mentorStrategy: null,
      supportingStrategies: [],
      nextAction: null,

      limits: {
        maximumQuestions: 1,
        maximumSuggestions: 1,

        shouldExplainReasoning:
          false,

        shouldWaitForCreatorReply:
          true,

        responseLength:
          "short",
      },
    },

    explicitDirection:
      cloneValue(
        explicitDirection
      ),

    projectState:
      createProjectState(
        safeContext
      ),

    sessionState:
      createSessionState(
        safeContext,
        explicitDirection
      ),

    continuity:
      createContinuityState(
        safeContext,
        explicitDirection
      ),

    memory: {
      connected: false,

      richContextAvailable:
        false,

      compactContextAvailable:
        false,

      requests: [
        MEMORY_REQUEST_TYPES.NONE,
      ],

      requestDetails: [
        {
          type:
            MEMORY_REQUEST_TYPES.NONE,

          projectId: null,

          projectScoped: false,

          creatorExplicitlyRequested:
            false,

          mutationAllowed: false,

          informationalOnly: true,
        },
      ],

      intent:
        memoryIntent,

      shouldRecallMemory:
        false,

      creatorProfileAvailable:
        false,

      projectMemoryAvailable:
        false,

      projectMemoryCount: 0,

      deferredMemoryAvailable:
        false,

      patternMemoryAvailable:
        false,

      observationMemoryAvailable:
        false,

      milestoneMemoryAvailable:
        false,

      sessionHandoffAvailable:
        hasSessionHandoff(
          safeContext
        ),

      specialistSignalsPresent:
        false,

      mutationExecuted: false,

      context:
        cloneValue(
          safeContext
        ),
    },

    creatorProtocol: {
      ...CREATOR_PROTOCOL,

      explicitPresentDirectionAvailable:
        Boolean(
          explicitDirection
            ?.presentDirectionAvailable
        ),

      explicitMemoryDirection:
        explicitDirection
          ?.memoryDirection ||
        MEMORY_DIRECTIONS.NONE,
    },

    responseGuidance: [
      "Listen carefully.",

      "Use warm, natural language.",

      "Ask no more than one question.",

      "Keep the creator in ownership.",

      "Respect explicit current-turn creator direction.",

      "Do not make new memory assumptions while planning is unavailable.",

      "Do not claim that memory was saved, changed or deleted.",

      "Preserve available project continuity.",
    ],

    guardRails:
      createGuardRails(
        null
      ),

    analysis: null,

    contextSnapshot:
      cloneValue(
        safeContext
      ),

    plannerSummary:
      "Analysis was unavailable. Use safe listening mode while preserving explicit creator direction and available continuity.",

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

function createConversationPlanner({
  creatorEngine =
    analyseCreatorMessage,

  memory = null,
} = {}) {
  if (
    typeof creatorEngine !==
    "function"
  ) {
    throw new TypeError(
      "ConversationPlanner requires a valid creatorEngine function."
    );
  }

  let activeMemory =
    memory ||
    null;

  function planConversation({
    message = "",
    context = {},
    memoryContext = null,
  } = {}) {
    try {
      const memoryBundle =
        retrieveMemoryBundle(
          activeMemory
        );

      /**
       * A caller may explicitly supply memoryContext.
       *
       * This takes precedence over retrieved memory because it
       * represents the current orchestration state.
       */
      if (
        memoryContext &&
        typeof memoryContext ===
          "object"
      ) {
        memoryBundle.richContext =
          cloneValue(
            memoryContext
          );
      }

      const combinedContext =
        buildCombinedContext({
          context,
          memoryBundle,
        });

      const explicitDirection =
        detectExplicitDirection({
          message,

          context:
            combinedContext,
        });

      const analysis =
        creatorEngine({
          message,

          context:
            combinedContext,
        });

      /**
       * ConversationPlanner remains synchronous.
       *
       * TheCreatorEngine is expected to return a resolved
       * analysis object.
       */
      if (
        analysis &&
        typeof analysis.then ===
          "function"
      ) {
        throw new TypeError(
          "ConversationPlanner received an asynchronous creatorEngine result. Provide a synchronous resolved analysis contract."
        );
      }

      const mode =
        chooseConversationMode({
          analysis,

          context:
            combinedContext,

          explicitDirection,
        });

      const tone =
        chooseMentorTone({
          mode,
          analysis,

          context:
            combinedContext,
        });

      const primaryAction =
        choosePrimaryAction({
          mode,
          analysis,

          context:
            combinedContext,

          explicitDirection,
        });

      const mentorMove =
        chooseMentorMove({
          mode,
          primaryAction,
          analysis,

          context:
            combinedContext,

          explicitDirection,
        });

      const supportingActions =
        chooseSupportingActions({
          mode,
          analysis,

          context:
            combinedContext,

          explicitDirection,
        });

      const memoryRequests =
        chooseMemoryRequests({
          mode,
          primaryAction,

          context:
            combinedContext,

          explicitDirection,
        });

      const memoryIntent =
        createMemoryIntent({
          explicitDirection,

          context:
            combinedContext,
        });

      const memoryRequestDetails =
        createMemoryRequestDetails({
          requests:
            memoryRequests,

          context:
            combinedContext,

          explicitDirection,
        });

      const limits =
        createConversationLimits({
          mode,
          mentorMove,

          context:
            combinedContext,

          explicitDirection,
        });

      const creatorProtocol =
        createProtocol({
          analysis,

          context:
            combinedContext,

          explicitDirection,
        });

      const projectState =
        createProjectState(
          combinedContext
        );

      const sessionState =
        createSessionState(
          combinedContext,
          explicitDirection
        );

      const continuity =
        createContinuityState(
          combinedContext,
          explicitDirection
        );

      const memoryState =
        createMemoryState(
          combinedContext,
          memoryRequests,
          memoryBundle,
          memoryIntent,
          memoryRequestDetails
        );

      const responseGuidance =
        uniqueValues([
          ...asArray(
            analysis
              ?.responseGuidance
          ),

          "Follow the selected conversation mode.",

          `Execute the selected Mentor move: ${mentorMove}.`,

          "Use the selected Mentor tone naturally.",

          "Do not generate more questions than the conversation limits allow.",

          "Explicit current-turn creator direction outranks historical memory.",

          "Present creator behaviour should lead when it conflicts with an older inferred state.",

          "Use remembered context only when relevant to the creator's current direction.",

          "Creator-approved project facts outrank inferred observations.",

          "Creator corrections immediately outrank conflicting historical memory.",

          "A forget request must be respected by the conversation even though persistence execution happens elsewhere.",

          "Do not make the creator repeat information already available in reliable project context.",

          "Give the creator room to disagree with or correct remembered observations.",

          "If the creator asks for an action, prefer performing the action over explaining how to perform it.",

          "If demonstrating, show a useful example before teaching theory.",

          "Do not interrupt experienced creators unnecessarily.",

          "Do not expose specialist-agent machinery in ordinary conversation.",

          "Do not claim that memory was stored, changed or deleted; persistence truth belongs to the memory execution layer.",

          "Use project memory to preserve continuity, not to display recall ability.",

          "Keep project-scoped memory inside the active project.",

          "If a topic was intentionally deferred, do not automatically reopen it.",

          "When the creator explicitly asks to revisit something, retrieve only the relevant deferred or remembered context.",

          "When the creator is returning to a project, restore only the landmarks needed to continue.",

          "When the creator is pausing, preserve position without introducing new work.",

          "When handling a quick detour, preserve the previous task and return point.",

          "When the detour ends, return naturally to the creator's previous task without making them reconstruct the context.",

          isBuildMode(
            combinedContext
          )
            ? "Build Mode is active: minimise discussion, avoid unnecessary questions and favour direct implementation."
            : null,

          explicitDirection
            .create
            ? "The creator has explicitly requested execution: do not delay the requested work with avoidable discovery."
            : null,

          explicitDirection
            .correction
            ? "Acknowledge the correction without defending or privileging the older memory."
            : null,

          explicitDirection
            .remember
            ? "Treat the remember request as explicit creator direction, but do not claim persistence until the memory execution layer confirms it."
            : null,

          explicitDirection
            .forget
            ? "Stop relying on the targeted information conversationally and pass the forget intent downstream without claiming deletion has completed."
            : null,

          explicitDirection
            .revisit
            ? "Revisit the relevant remembered or deferred context without reopening unrelated history."
            : null,

          limits
            .shouldWaitForCreatorReply
            ? "End with one clear conversational opening when a reply is genuinely required."
            : "Do not add an unnecessary closing question.",
        ]);

      const plannerSummary =
        createPlannerSummary({
          mode,
          mentorMove,
          tone,
          primaryAction,
          memoryRequests,
          memoryIntent,
          analysis,

          context:
            combinedContext,
        });

      return {
        id:
          createPlanId(),

        planner:
          "conversation-planner",

        version:
          CONVERSATION_PLANNER_VERSION,

        input: {
          message:
            normaliseString(
              message
            ),
        },

        conversation: {
          mode,

          mentorMove,

          tone,

          primaryAction,

          supportingActions,

          mentorStrategy:
            analysis
              ?.strategy
              ?.primary ||
            null,

          supportingStrategies:
            cloneValue(
              analysis
                ?.strategy
                ?.supporting ||
              []
            ),

          nextAction:
            analysis
              ?.strategy
              ?.nextAction ||
            null,

          limits,
        },

        explicitDirection:
          cloneValue(
            explicitDirection
          ),

        projectState,

        sessionState,

        continuity,

        memory:
          memoryState,

        creatorProtocol,

        responseGuidance,

        guardRails:
          createGuardRails(
            analysis
          ),

        analysis:
          cloneValue(
            analysis
          ),

        contextSnapshot:
          cloneValue(
            combinedContext
          ),

        plannerSummary,

        status:
          "planned",

        createdAt:
          createTimestamp(),
      };
    } catch (error) {
      console.error(
        "ConversationPlanner planning error:",
        error
      );

      return (
        createFallbackPlan({
          message,
          context,
          error,
        })
      );
    }
  }

  function setMemory(
    nextMemory
  ) {
    activeMemory =
      nextMemory ||
      null;

    return activeMemory;
  }

  function getMemory() {
    return activeMemory;
  }

  function getMemoryContext() {
    const memoryBundle =
      retrieveMemoryBundle(
        activeMemory
      );

    return (
      memoryBundle
        ?.richContext ||
      memoryBundle
        ?.compactContext ||
      null
    );
  }

  function getPlannerVersion() {
    return (
      CONVERSATION_PLANNER_VERSION
    );
  }

  return {
    planConversation,

    setMemory,
    getMemory,
    getMemoryContext,

    getPlannerVersion,
  };
}

/**
 * Convenience method for one-off planning.
 */
function planConversation({
  message = "",
  context = {},
  memoryContext = null,
  memory = null,
  creatorEngine =
    analyseCreatorMessage,
} = {}) {
  const planner =
    createConversationPlanner({
      creatorEngine,
      memory,
    });

  return (
    planner
      .planConversation({
        message,
        context,
        memoryContext,
      })
  );
}

export {
  CONVERSATION_PLANNER_VERSION,

  CONVERSATION_MODES,
  MENTOR_MOVES,
  MENTOR_TONES,

  PLAN_ACTIONS,

  MEMORY_REQUEST_TYPES,
  MEMORY_DIRECTIONS,

  CREATOR_PROTOCOL,

  createConversationPlanner,
  planConversation,
};

export default createConversationPlanner;
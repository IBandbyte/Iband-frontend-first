/**
 * Conversation Planner
 * ------------------------------------------------------------
 * The conversational orchestration layer for iBand's
 * AI Mentor — The Creator.
 *
 * Responsibilities:
 * - Analyse the creator's latest message.
 * - Read relevant Creator Memory context.
 * - Preserve current project continuity.
 * - Understand creator, project and session context.
 * - Choose the appropriate conversation mode.
 * - Choose the Mentor's next conversational move.
 * - Select tone, strategy and conversational limits.
 * - Identify which forms of memory may help.
 * - Respect explicit creator direction.
 * - Support future specialist-agent memory signals.
 * - Apply The Creator Protocol.
 * - Return a structured plan for the Adaptive Mentor layer.
 *
 * This file does NOT:
 * - Persist memory.
 * - Decide final memory truth.
 * - Execute forget requests.
 * - Generate final Mentor wording.
 * - Replace AdaptiveMentorEngine.
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
 * - Long-term memory informs.
 * - Project memory is scoped.
 * - Creator-approved truth outranks inference.
 * - Conversation exists in service of creation.
 * - Do not make the creator repeat known information.
 * - Do not interrogate when enough is already known.
 * - Demonstrate before teaching when useful.
 * - Experienced creators must be allowed to work.
 * - Complexity belongs behind the conversation.
 */

import analyseCreatorMessage from "./TheCreatorEngine";

const CONVERSATION_PLANNER_VERSION = "2.0.0";

const CONVERSATION_MODES = Object.freeze({
  WELCOME: "welcome",
  LISTENING: "listening",
  IMAGINATION: "imagination",
  DISCOVERY: "discovery",
  REFLECTION: "reflection",
  CONFIDENCE: "confidence",
  RECOVERY: "recovery",

  PROJECT_CONTINUITY:
    "project-continuity",

  CREATION: "creation",
  REFINEMENT: "refinement",
  PUBLISHING: "publishing",

  LEARNING: "learning",
  PROBLEM_SOLVING:
    "problem-solving",

  CELEBRATION: "celebration",

  PAUSING: "pausing",
  RETURNING: "returning",
});

/**
 * Conversation mode describes the current situation.
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

  RESTORE_CONTEXT:
    "restore-context",

  CAPTURE_AND_CONTINUE:
    "capture-and-continue",

  CELEBRATE: "celebrate",

  PAUSE: "pause",
  CONTINUE: "continue",
});

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

  QUIETLY_CONFIDENT:
    "quietly-confident",
});

const PLAN_ACTIONS = Object.freeze({
  LISTEN: "listen",

  ASK_ONE_QUESTION:
    "ask-one-question",

  INVITE_IMAGINATION:
    "invite-imagination",

  INVITE_REFLECTION:
    "invite-reflection",

  EXPLORE_IDEA:
    "explore-idea",

  PROTECT_IDEA:
    "protect-idea",

  OFFER_SMALL_STEP:
    "offer-small-step",

  OFFER_PERSPECTIVE:
    "offer-perspective",

  RECALL_MEMORY:
    "recall-memory",

  RESTORE_PROJECT_CONTEXT:
    "restore-project-context",

  CAPTURE_AND_CONTINUE:
    "capture-and-continue",

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

const MEMORY_REQUEST_TYPES = Object.freeze({
  NONE: "none",

  CREATOR_PROFILE:
    "creator-profile",

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

const CREATOR_PROTOCOL = Object.freeze({
  protectTheCreator: true,

  curiosityBeforeCriticism:
    true,

  confidenceBeforeCorrection:
    true,

  oneMeaningfulQuestionAtATime:
    true,

  creatorOwnsTheIdea: true,

  permissionBeforePerspective:
    true,

  exploreBeforeEvaluating:
    true,

  doNotRepeatKnownQuestions:
    true,

  technologyServesTheCreator:
    true,

  leaveCreatorStronger: true,

  demonstrateWhenUseful: true,

  teachWithoutTakingOver: true,

  respectCreatorExperience:
    true,

  actionBeforeExplanationWhenAppropriate:
    true,

  creatorCanOverrideMentorDirection:
    true,

  presentBehaviourLeads:
    true,

  memoryInformsWithoutControlling:
    true,

  creatorCorrectionsOverrideMemory:
    true,

  projectMemoryIsScoped:
    true,

  projectTruthMayEvolve:
    true,

  specialistAgentsMayInform:
    true,

  specialistAgentsDoNotOwnTruth:
    true,

  sessionHandoffProtectsMomentum:
    true,

  complexityStaysBehindConversation:
    true,
});

const DEFAULT_PLANNER_CONTEXT =
  Object.freeze({
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

    /**
     * Project readiness.
     */
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
    captureSessionHandoff:
      false,

    sessionHandoff: null,

    previousTask: null,
    nextTask: null,
    returnPoint: null,

    /**
     * Creator preferences.
     */
    preferredResponseDepth:
      null,

    preferredGuidanceStyle:
      null,

    preferredMentorRole:
      null,

    preferredCommunicationPace:
      null,

    /**
     * Allows experienced creators to work independently
     * while keeping Mentor available.
     */
    mentorInvoked: true,

    currentTimestamp: null,
  });

function createTimestamp() {
  return new Date().toISOString();
}

function createPlanId() {
  const randomValue =
    Math.random()
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

  return JSON.parse(
    JSON.stringify(value)
  );
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
    Object.prototype
      .hasOwnProperty
      .call(
        value,
        propertyName
      )
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
 * services that implement only part of the modern contract.
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
          minimumConfidence:
            0.5,

          limit: 10,
        }
      ),

    observations:
      safelyCallMemoryMethod(
        memory,
        "getObservations",
        [],
        {
          minimumConfidence:
            0.35,

          limit: 10,
        }
      ),

    deferredMemories:
      safelyCallMemoryMethod(
        memory,
        "getDeferredMemories",
        [],
        {
          minimumConfidence:
            0.35,

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
 * 1. Explicit current-turn / workspace context.
 * 2. Rich CreatorMemory context.
 * 3. Compact legacy memory context.
 * 4. Individual supporting memory calls.
 * 5. Planner defaults.
 *
 * Explicit current context may intentionally contain an empty
 * array or null. Therefore we check property ownership rather
 * than using simple truthy fallbacks.
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
            richCounts
              ?.ideas > 0
          ),
          (
            supporting
              ?.ideas
              ?.length > 0
          ),
        ],

        defaultValue: false,
      }),

    currentTimestamp:
      explicitContext
        .currentTimestamp ||
      createTimestamp(),
  };

  /**
   * Communication preferences stored in the creator
   * profile may inform active defaults, but explicit current
   * context still wins.
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
 * Detects simple explicit conversation direction.
 *
 * This does not replace TheCreatorEngine.
 * It exists so direct creator instructions can influence
 * conversational behaviour immediately.
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
    "i'll come back",
    "ill come back",
    "i'll be back",
    "ill be back",
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

  return {
    pause:
      Boolean(
        context
          ?.creatorExplicitlyAskedToPause
      ) ||
      includesAny(
        text,
        pausePhrases
      ),

    continue:
      Boolean(
        context
          ?.creatorExplicitlyAskedToContinue ||
        context
          ?.creatorExplicitlyAskedForNextStep
      ) ||
      includesAny(
        text,
        continuePhrases
      ),

    create:
      Boolean(
        context
          ?.creatorExplicitlyAskedToCreate ||
        context
          ?.requestedCreation
      ) ||
      includesAny(
        text,
        creationPhrases
      ),

    guidance:
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
      ?.activeScene
  );
}

function hasProjectMemory(
  context
) {
  const activeProjectId =
    getProjectId(
      context
    );

  if (
    asArray(
      context
        ?.existingProjectMemories
    ).length > 0
  ) {
    return true;
  }

  if (
    !activeProjectId
  ) {
    return false;
  }

  return asArray(
    context
      ?.existingMemories
  ).some(
    (memory) =>
      memory
        ?.projectId ===
        activeProjectId ||
      memory
        ?.relatedProjectId ===
        activeProjectId ||
      memory
        ?.metadata
        ?.projectId ===
        activeProjectId
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

  if (
    explicitDirection.pause
  ) {
    return (
      CONVERSATION_MODES
        .PAUSING
    );
  }

  if (
    context
      ?.creatorIsReturning &&
    hasProjectContext(
      context
    )
  ) {
    return (
      CONVERSATION_MODES
        .RETURNING
    );
  }

  if (
    fragileIdea
  ) {
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
    explicitDirection.create ||
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
    intent === "remember" ||
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

  if (
    fragileIdea
  ) {
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
    Number(
      context
        ?.inspirationDrawerCount
    ) ||
    asArray(
      context
        ?.inspirationDrawer
    ).length ||
    0;

  if (
    fragileIdea
  ) {
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
    Number(
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

  return uniqueValues(
    actions
  );
}

/**
 * Chooses which forms of memory may help this conversation.
 *
 * A request means "this context may be useful".
 * It does not force recall or persistence.
 */
function chooseMemoryRequests({
  mode,
  primaryAction,
  context,
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
    asArray(
      context
        ?.deferredMemories
    ).length > 0 ||
    context
      ?.creatorExplicitlyAskedToRevisit
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
      ?.sessionHandoff
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

    shouldExplainReasoning:
      true,

    shouldWaitForCreatorReply:
      true,

    responseLength:
      "medium",
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
      context
        ?.thinkingMode ===
        "build" ||
      context
        ?.creatorExplicitlyAskedForNextStep
    )
  ) {
    return {
      ...limits,

      maximumQuestions: 0,
      maximumSuggestions: 1,

      shouldExplainReasoning:
        false,

      shouldWaitForCreatorReply:
        false,

      responseLength:
        "short",
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

      shouldExplainReasoning:
        false,

      shouldWaitForCreatorReply:
        false,

      responseLength:
        "short",
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

      shouldExplainReasoning:
        false,

      shouldWaitForCreatorReply:
        false,

      responseLength:
        "short",
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

      shouldExplainReasoning:
        false,

      shouldWaitForCreatorReply:
        false,

      responseLength:
        "short",
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

      shouldExplainReasoning:
        false,

      responseLength:
        "short",
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

      shouldExplainReasoning:
        false,

      responseLength:
        "short",
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

      shouldExplainReasoning:
        false,

      responseLength:
        "short",
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

      responseLength:
        "medium",
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

      responseLength:
        "short",
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

      shouldExplainReasoning:
        true,

      responseLength:
        "medium",
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

    "Do not mix project-scoped memory between projects.",

    "Do not expose specialist-agent machinery in normal creator conversation.",

    "Do not claim that memory was saved merely because the planner requested it.",

    "Do not claim that memory was deleted; deletion belongs to the persistence pipeline.",

    "Do not automatically reopen every deferred topic.",

    "Do not turn a brief detour into a long new conversation.",

    "Do not make the creator rediscover project context already available to the Mentor.",
  ];

  return uniqueValues(
    avoid
  );
}

function createProtocol({
  analysis,
  context,
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

    projectContinuityAvailable:
      hasProjectContext(
        context
      ),

    projectMemoryAvailable:
      hasProjectMemory(
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

    returnPoint:
      context
        ?.returnPoint ||
      null,

    nextTask:
      context
        ?.nextTask ||
      null,

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
      hasProjectMemory(
        context
      ),

    specialistSignalsPresent:
      hasSpecialistMemorySignals(
        context
      ),
  };
}

function createMemoryState(
  context,
  memoryRequests,
  memoryBundle
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
          ?.richContext
      ),

    requests:
      cloneValue(
        memoryRequests
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

    specialistSignalsPresent:
      hasSpecialistMemorySignals(
        context
      ),

    context:
      cloneValue(
        context
      ),
  };
}

function createPlannerSummary({
  mode,
  mentorMove,
  tone,
  primaryAction,
  memoryRequests,
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

  return (
    `Use ${mode} mode with a ${tone} tone. ` +
    `The Mentor's next move is ${mentorMove}. ` +
    `The creator appears ${emotionalState} ` +
    `and their likely intent is ${intent}. ` +
    `The primary action is ${primaryAction}. ` +
    `Active project: ${
      projectId || "none"
    }. ` +
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

    projectState:
      createProjectState(
        context
      ),

    memory: {
      connected: false,
      richContextAvailable:
        false,

      requests: [
        MEMORY_REQUEST_TYPES.NONE,
      ],

      shouldRecallMemory:
        false,

      creatorProfileAvailable:
        false,

      projectMemoryAvailable:
        false,

      deferredMemoryAvailable:
        false,

      patternMemoryAvailable:
        false,

      observationMemoryAvailable:
        false,

      milestoneMemoryAvailable:
        false,

      specialistSignalsPresent:
        false,

      context:
        cloneValue(
          context
        ),
    },

    creatorProtocol: {
      ...CREATOR_PROTOCOL,
    },

    responseGuidance: [
      "Listen carefully.",
      "Use warm, natural language.",
      "Ask no more than one question.",
      "Keep the creator in ownership.",
      "Do not make new memory assumptions while planning is unavailable.",
    ],

    guardRails:
      createGuardRails(
        null
      ),

    analysis: null,

    plannerSummary:
      "Analysis was unavailable. Use safe listening mode.",

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
       * This takes precedence over retrieved memory because
       * it represents current orchestration state.
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
        });

      const memoryRequests =
        chooseMemoryRequests({
          mode,
          primaryAction,

          context:
            combinedContext,
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
        });

      const projectState =
        createProjectState(
          combinedContext
        );

      const memoryState =
        createMemoryState(
          combinedContext,
          memoryRequests,
          memoryBundle
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

          "Use remembered context only when relevant to the creator's current direction.",

          "Present behaviour and explicit creator direction override historical memory.",

          "Creator-approved project facts outrank inferred observations.",

          "Do not make the creator repeat information already available in reliable project context.",

          "Give the creator room to disagree with or correct remembered observations.",

          "If the creator asks for an action, prefer performing the action over explaining how to perform it.",

          "If demonstrating, show a useful example before teaching theory.",

          "Do not interrupt experienced creators unnecessarily.",

          "Do not expose specialist-agent machinery in ordinary conversation.",

          "Do not claim that memory was stored or deleted; persistence truth belongs to the memory execution layer.",

          "Use project memory to preserve continuity, not to display recall ability.",

          "If a topic was intentionally deferred, do not automatically reopen it.",

          "When the creator is returning to a project, restore only the landmarks needed to continue.",

          "When the creator is pausing, preserve position without introducing new work.",

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

  return {
    planConversation,

    setMemory,
    getMemory,
    getMemoryContext,
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

  CREATOR_PROTOCOL,

  createConversationPlanner,
  planConversation,
};

export default createConversationPlanner;
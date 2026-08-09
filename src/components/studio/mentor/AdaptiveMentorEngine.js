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
 * - Whether project context should be restored.
 * - Whether a session handoff should be preserved.
 * - Whether a forget request requires clarification or execution.
 * - Whether conversation should continue or move into action.
 * - Which specialist-engine decision takes priority.
 * - How future specialist-agent memory signals may influence
 *   behaviour without taking authority away from the creator.
 *
 * Core philosophy:
 * - Protect the creator.
 * - Present behaviour leads.
 * - Long-term memory informs.
 * - Project truth is shared, scoped and revisable.
 * - Conversation exists in service of creation.
 * - Match the creator's rhythm before attempting to guide it.
 * - Meet first. Lead second.
 * - Never interrupt flow merely because more help is available.
 * - The creator remains the authority on their own experience.
 * - Specialist agents may inform the Mentor, but do not own truth.
 * - Complexity belongs behind the conversation.
 */

import createConversationPlanner from "./ConversationPlanner";
import createReflectionEngine from "./ReflectionEngine";
import createProgressionEngine from "./ProgressionEngine";
import createCreatorMemoryEngine from "./CreatorMemoryEngine";

const ADAPTIVE_MENTOR_ENGINE_VERSION = "2.1.0";

const MENTOR_ROLES = Object.freeze({
  LISTENER: "listener",
  GUIDE: "guide",
  COLLABORATOR: "collaborator",
  TEACHER: "teacher",
  REFLECTOR: "reflector",
  CREATIVE_DIRECTOR: "creative-director",
  FACILITATOR: "facilitator",
  QUIET_COMPANION: "quiet-companion",
});

const LEADERSHIP_STANCES = Object.freeze({
  LEAD: "lead",
  FOLLOW: "follow",
  WALK_BESIDE: "walk-beside",
  HOLD_POSITION: "hold-position",
  HAND_BACK_CONTROL: "hand-back-control",
});

const INTERVENTION_LEVELS = Object.freeze({
  NONE: "none",
  MINIMAL: "minimal",
  LIGHT: "light",
  MODERATE: "moderate",
  DEEP: "deep",
});

const RESPONSE_DEPTHS = Object.freeze({
  SILENT: "silent",
  ONE_LINE: "one-line",
  SHORT: "short",
  MEDIUM: "medium",
  DETAILED: "detailed",
});

const QUESTION_POLICIES = Object.freeze({
  NONE: "none",
  ONE_OPTIONAL: "one-optional",
  ONE_REQUIRED: "one-required",
  CREATOR_LED: "creator-led",
});

const MEMORY_POLICIES = Object.freeze({
  DO_NOT_USE: "do-not-use",
  INFORM_SILENTLY: "inform-silently",
  CAPTURE_ONLY: "capture-only",
  RECALL_WITH_PERMISSION: "recall-with-permission",
  CAPTURE_AND_RECALL: "capture-and-recall",
  RESTORE_CONTEXT: "restore-context",
  PRESERVE_HANDOFF: "preserve-handoff",
  FORGET_ONLY: "forget-only",
  FORGET_REQUIRES_CLARIFICATION:
    "forget-requires-clarification",
});

const ACTION_PRIORITIES = Object.freeze({
  SAFETY: 100,
  CREATOR_EXPLICIT_DIRECTION: 90,
  MEMORY_FORGET: 88,
  MEMORY_FORGET_CLARIFICATION: 87,
  HOLD_SPACE: 80,
  PROTECT_FLOW: 75,
  RELEASE_PRESSURE: 70,
  RESTORE_PROJECT_CONTEXT: 68,
  MOVE_TO_ACTION: 65,
  MEMORY_RECALL: 55,
  REFLECTION: 50,
  EXPLORATION: 40,
  LEARNING: 35,
  GENERAL_LISTENING: 20,
});

const ADAPTIVE_ACTIONS = Object.freeze({
  WAIT: "wait",
  ACKNOWLEDGE_BRIEFLY: "acknowledge-briefly",
  LISTEN_AND_INVITE: "listen-and-invite",
  REFLECT_GENTLY: "reflect-gently",
  RELEASE_PRESSURE: "release-pressure",

  RESTORE_CONTEXT: "restore-context",
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

  ASK_ONE_QUESTION: "ask-one-question",

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

  SAVE_AND_PAUSE:
    "save-and-pause",

  PRESERVE_SESSION_HANDOFF:
    "preserve-session-handoff",

  END_POSITIVELY:
    "end-positively",
});

const ADAPTATION_SIGNALS = Object.freeze({
  BUILD_MODE: "build-mode",
  FLOW_MODE: "flow-mode",
  EXPLORATION_MODE: "exploration-mode",
  LEARNING_MODE: "learning-mode",
  REFLECTION_MODE: "reflection-mode",
  RECOVERY_MODE: "recovery-mode",
  INCUBATION_MODE: "incubation-mode",

  HIGH_MOMENTUM: "high-momentum",
  LOW_ENERGY: "low-energy",
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

  MEMORY_CAPTURE_AVAILABLE:
    "memory-capture-available",

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
});

const DEFAULT_ADAPTIVE_CONTEXT = Object.freeze({
  creatorId: null,
  creatorJourney: "guide",
  creatorType: null,
  projectType: null,

  creatorProfile: null,
  creatorMemoryContext: null,

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
  informationSaturation: null,

  creatorExplicitlyAskedForGuidance: false,
  creatorExplicitlyAskedToContinue: false,
  creatorExplicitlyAskedForNextStep: false,
  creatorExplicitlyAskedToPause: false,
  creatorExplicitlyAskedToStop: false,
  creatorExplicitlyAskedToCreate: false,

  creatorExplicitlyAskedToRemember: false,
  creatorExplicitlyAskedNotToRemember: false,
  creatorExplicitlyAskedToRevisit: false,

  preferredResponseDepth: null,
  preferredGuidanceStyle: null,
  preferredMentorRole: null,

  recentCreatorMessages: [],
  recentMentorMessages: [],
  recentConversations: [],

  existingMemories: [],
  existingProjectMemories: [],
  existingPatterns: [],
  existingObservations: [],

  memorySignals: [],
  projectMemorySignals: [],

  captureSessionHandoff: false,
  sessionHandoff: null,

  sourceAgent: null,
  sourceSystem: null,

  targetMemoryIds: [],

  minimumCreationContextReady: false,
  requiredInformationComplete: false,
  projectReadyToGenerate: false,
  projectReadyToRefine: false,
  projectReadyToPublish: false,

  currentTimestamp: null,
});

/**
 * Returns the current ISO timestamp.
 */
function createTimestamp() {
  return new Date().toISOString();
}

/**
 * Creates a lightweight unique identifier.
 */
function createAdaptivePlanId() {
  const randomValue = Math.random()
    .toString(36)
    .slice(2, 10);

  return (
    `adaptive-mentor-plan-` +
    `${Date.now()}-${randomValue}`
  );
}

/**
 * Safely clones plain data.
 */
function cloneValue(value) {
  if (value === undefined) {
    return undefined;
  }

  return JSON.parse(
    JSON.stringify(value)
  );
}

/**
 * Produces a clean string.
 */
function cleanString(value) {
  return typeof value === "string"
    ? value.trim()
    : "";
}

/**
 * Converts an optional value to an array.
 */
function asArray(value) {
  return Array.isArray(value)
    ? value
    : [];
}

/**
 * Returns unique meaningful values.
 */
function uniqueValues(values = []) {
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

/**
 * Safely reads nested values.
 */
function getNestedValue(
  value,
  path,
  fallback = null
) {
  const keys = path.split(".");

  let currentValue = value;

  for (const key of keys) {
    if (
      currentValue === null ||
      currentValue === undefined ||
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

/**
 * Determines whether one of the supplied values is present.
 */
function includesValue(
  value,
  possibilities = []
) {
  return possibilities.includes(
    value
  );
}

/**
 * Returns the active project id where available.
 */
function getProjectId(
  context = {}
) {
  if (
    cleanString(
      context?.activeProjectId
    )
  ) {
    return cleanString(
      context.activeProjectId
    );
  }

  if (
    typeof context?.activeProject ===
    "string"
  ) {
    return (
      cleanString(
        context.activeProject
      ) ||
      null
    );
  }

  return (
    cleanString(
      context?.activeProject?.id
    ) ||
    cleanString(
      context
        ?.activeProject
        ?.projectId
    ) ||
    null
  );
}

/**
 * Safely reads the compact engine context exposed by
 * CreatorMemory.js.
 *
 * Memory failure must never prevent the Mentor from
 * continuing the current conversation.
 */
function readCreatorMemoryContext(
  memory
) {
  if (
    !memory ||
    typeof memory.createEngineContext !==
      "function"
  ) {
    return null;
  }

  try {
    return cloneValue(
      memory.createEngineContext()
    );
  } catch (error) {
    console.warn(
      "AdaptiveMentorEngine memory context error:",
      error
    );

    return null;
  }
}

/**
 * Safely reads recent conversations from CreatorMemory.js.
 */
function readRecentMemoryConversations(
  memory,
  limit = 10
) {
  if (
    !memory ||
    typeof memory.getRecentConversations !==
      "function"
  ) {
    return [];
  }

  try {
    return asArray(
      memory.getRecentConversations(
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

/**
 * Builds the context used by all specialist engines.
 *
 * Precedence:
 * 1. Explicit current-turn context.
 * 2. CreatorMemory compact engine context.
 * 3. Adaptive defaults.
 *
 * This ensures present creator direction always overrides
 * historical memory.
 */
function createMemoryAwareContext({
  context = {},
  memory = null,
} = {}) {
  const explicitContext =
    cloneValue(context) || {};

  const memoryContext =
    readCreatorMemoryContext(
      memory
    );

  const memoryProfile =
    memoryContext
      ?.creatorProfile ||
    null;

  const rememberedProject =
    memoryContext
      ?.activeProject ||
    null;

  const rememberedProjectId =
    cleanString(
      rememberedProject?.id
    ) ||
    cleanString(
      rememberedProject?.projectId
    ) ||
    null;

  const recentConversations =
    readRecentMemoryConversations(
      memory,
      10
    );

  const rememberedPatterns =
    asArray(
      memoryContext
        ?.knownPatterns
    );

  const memoryDerivedContext = {
    creatorProfile:
      memoryProfile,

    creatorMemoryContext:
      memoryContext,

    activeProject:
      rememberedProject,

    activeProjectId:
      rememberedProjectId,

    recentConversations,

    existingPatterns:
      rememberedPatterns,

    creatorType:
      asArray(
        memoryProfile
          ?.creatorTypes
      )[0] ||
      null,

    recentStage:
      memoryContext
        ?.recentStage ||
      null,

    recentEmotionalState:
      memoryContext
        ?.recentEmotionalState ||
      null,
  };

  return {
    ...cloneValue(
      DEFAULT_ADAPTIVE_CONTEXT
    ),

    ...memoryDerivedContext,

    ...explicitContext,

    creatorProfile:
      explicitContext
        .creatorProfile ??
      memoryDerivedContext
        .creatorProfile ??
      null,

    creatorMemoryContext:
      memoryContext,

    activeProject:
      explicitContext
        .activeProject ??
      memoryDerivedContext
        .activeProject ??
      null,

    activeProjectId:
      explicitContext
        .activeProjectId ??
      memoryDerivedContext
        .activeProjectId ??
      null,

    recentConversations:
      asArray(
        explicitContext
          .recentConversations
      ).length > 0
        ? cloneValue(
            explicitContext
              .recentConversations
          )
        : cloneValue(
            recentConversations
          ),

    existingPatterns:
      asArray(
        explicitContext
          .existingPatterns
      ).length > 0
        ? cloneValue(
            explicitContext
              .existingPatterns
          )
        : cloneValue(
            rememberedPatterns
          ),

    currentTimestamp:
      explicitContext
        .currentTimestamp ||
      createTimestamp(),
  };
}

/**
 * Adds a scored candidate action.
 */
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
      cloneValue(metadata),
  });
}

/**
 * Determines whether a memory plan contains
 * instructions that may preserve new information.
 */
function memoryPlanHasCaptureInstructions(
  memoryPlan
) {
  return asArray(
    memoryPlan?.instructions
  ).some(
    (instruction) =>
      instruction?.action !==
        "forget-memory"
  );
}

/**
 * Determines whether the memory plan contains
 * project-scoped candidates.
 */
function memoryPlanHasProjectMemory(
  memoryPlan
) {
  return asArray(
    memoryPlan?.candidates
  ).some((item) => {
    const candidate =
      item?.candidate ||
      item;

    return (
      candidate?.scope ===
        "project" ||
      candidate?.projectId
    );
  });
}

/**
 * Determines whether the memory plan contains
 * session handoff information.
 */
function memoryPlanHasSessionHandoff(
  memoryPlan
) {
  return asArray(
    memoryPlan?.candidates
  ).some((item) => {
    const candidate =
      item?.candidate ||
      item;

    return (
      candidate?.category ===
      "session-handoff"
    );
  });
}

/**
 * Determines whether future specialist agents
 * supplied structured memory signals.
 */
function contextHasSpecialistMemorySignals(
  context
) {
  return Boolean(
    context?.sourceAgent ||
      asArray(
        context?.memorySignals
      ).length >
        0 ||
      asArray(
        context
          ?.projectMemorySignals
      ).length >
        0
  );
}

/**
 * Extracts adaptation signals from all specialist plans.
 */
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
      context?.thinkingMode
    );

  const creatorEnergy =
    getNestedValue(
      progressionPlan,
      "creatorState.creatorEnergy.value",
      context?.creatorEnergy
    );

  const momentum =
    getNestedValue(
      progressionPlan,
      "creatorState.momentum.value",
      context?.momentum
    );

  const guidanceWindow =
    getNestedValue(
      progressionPlan,
      "creatorState.guidanceWindow.value",
      context?.guidanceWindow
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

  if (
    thinkingMode === "build"
  ) {
    signals.push(
      ADAPTATION_SIGNALS
        .BUILD_MODE
    );
  }

  if (
    thinkingMode === "flow"
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
    )
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
    )
  ) {
    signals.push(
      ADAPTATION_SIGNALS
        .PROJECT_MEMORY_AVAILABLE
    );
  }

  if (
    getProjectId(context)
  ) {
    signals.push(
      ADAPTATION_SIGNALS
        .PROJECT_CONTEXT_AVAILABLE
    );
  }

  if (
    context
      ?.creatorMemoryContext
  ) {
    signals.push(
      ADAPTATION_SIGNALS
        .CREATOR_MEMORY_CONNECTED
    );
  }

  if (
    context
      ?.creatorMemoryContext &&
    (
      context
        .creatorMemoryContext
        .hasSharedIdea ||
      context
        .creatorMemoryContext
        .activeProject ||
      asArray(
        context
          .creatorMemoryContext
          .knownPatterns
      ).length > 0 ||
      context
        .creatorMemoryContext
        .conversationCount > 0
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
    appearsFinished === false
  ) {
    signals.push(
      ADAPTATION_SIGNALS
        .CREATOR_NOT_FINISHED
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

/**
 * Produces candidate actions from specialist-engine decisions.
 */
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
    reflectionPlan?.decision;

  const progressionDecision =
    progressionPlan?.decision;

  const conversationAction =
    getNestedValue(
      conversationPlan,
      "conversation.primaryAction",
      null
    );

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
    signals.includes(
      ADAPTATION_SIGNALS
        .FORGET_REQUIRES_CLARIFICATION
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
          "The creator asked to forget something, but the intended memory is not unambiguous.",

        source:
          "creator-memory-engine",

        metadata: {
          forgetPlan:
            memoryPlan?.forget ||
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
            memoryPlan?.forget ||
            null,
        },
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
          ADAPTIVE_ACTIONS.WAIT,

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

  if (
    reflectionDecision ===
    "reflect"
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
          "The creator appears to want the thought captured without opening a long discussion.",

        source:
          "creator-memory-engine",
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
            memoryPlan?.recall ||
            null,
        },
      }
    );
  }

  if (
    signals.includes(
      ADAPTATION_SIGNALS
        .SESSION_HANDOFF_AVAILABLE
    ) &&
    (
      context
        ?.creatorExplicitlyAskedToPause ||
      progressionDecision ===
        "save-and-return-later" ||
      progressionDecision ===
        "pause-session"
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
          "The creator is pausing and the current project position can be preserved for a clean return.",

        source:
          "creator-memory-engine",
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
          "The conversation planner recommends one meaningful question.",

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
    candidates.length === 0
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
    (a, b) =>
      b.priority -
      a.priority
  );
}

/**
 * Applies conflict-resolution rules to candidate actions.
 */
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

  if (
    signals.includes(
      ADAPTATION_SIGNALS
        .FORGET_REQUIRES_CLARIFICATION
    )
  ) {
    const forgetCandidate =
      candidates.find(
        (candidate) =>
          candidate.action ===
          ADAPTIVE_ACTIONS
            .CLARIFY_FORGET_REQUEST
      );

    if (forgetCandidate) {
      return forgetCandidate;
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

    if (forgetCandidate) {
      return forgetCandidate;
    }
  }

  if (
    signals.includes(
      ADAPTATION_SIGNALS
        .CREATOR_NOT_FINISHED
    )
  ) {
    return {
      action:
        ADAPTIVE_ACTIONS.WAIT,

      priority:
        ACTION_PRIORITIES
          .HOLD_SPACE,

      reason:
        "The creator appears not to have finished their thought.",

      source:
        "adaptive-conflict-resolution",
    };
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
          includesValue(
            candidate.action,
            [
              ADAPTIVE_ACTIONS
                .MOVE_TO_CREATION,

              ADAPTIVE_ACTIONS
                .MOVE_TO_NEXT_TASK,

              ADAPTIVE_ACTIONS
                .MOVE_TO_REFINEMENT,
            ]
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

/**
 * Chooses the Mentor's active role.
 */
function chooseMentorRole({
  primaryAction,
  signals,
  context,
}) {
  if (
    context
      ?.preferredMentorRole
  ) {
    return (
      context
        .preferredMentorRole
    );
  }

  switch (
    primaryAction.action
  ) {
    case ADAPTIVE_ACTIONS.WAIT:
      return (
        MENTOR_ROLES
          .QUIET_COMPANION
      );

    case ADAPTIVE_ACTIONS
      .REFLECT_GENTLY:

    case ADAPTIVE_ACTIONS
      .RESTORE_CONTEXT:

    case ADAPTIVE_ACTIONS
      .RESTORE_PROJECT_CONTEXT:

    case ADAPTIVE_ACTIONS
      .RELEASE_PRESSURE:
      return (
        MENTOR_ROLES
          .REFLECTOR
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
      .PRESERVE_SESSION_HANDOFF:
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
        .GUIDANCE_REQUESTED
    )
  ) {
    return (
      MENTOR_ROLES.GUIDE
    );
  }

  return (
    MENTOR_ROLES.LISTENER
  );
}

/**
 * Chooses the current leadership stance.
 */
function chooseLeadershipStance({
  role,
  primaryAction,
  signals,
  context,
}) {
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
    primaryAction.action ===
    ADAPTIVE_ACTIONS.WAIT
  ) {
    return (
      LEADERSHIP_STANCES
        .HOLD_POSITION
    );
  }

  if (
    primaryAction.action ===
      ADAPTIVE_ACTIONS
        .CLARIFY_FORGET_REQUEST ||
    primaryAction.action ===
      ADAPTIVE_ACTIONS
        .APPLY_FORGET_REQUEST
  ) {
    return (
      LEADERSHIP_STANCES
        .HAND_BACK_CONTROL
    );
  }

  if (
    includesValue(
      primaryAction.action,
      [
        ADAPTIVE_ACTIONS
          .MOVE_TO_CREATION,

        ADAPTIVE_ACTIONS
          .MOVE_TO_NEXT_TASK,

        ADAPTIVE_ACTIONS
          .MOVE_TO_REFINEMENT,

        ADAPTIVE_ACTIONS
          .MOVE_TO_PUBLISHING,

        ADAPTIVE_ACTIONS
          .TEACH_ONE_CONCEPT,
      ]
    )
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

  if (
    primaryAction.action ===
      ADAPTIVE_ACTIONS
        .END_POSITIVELY
  ) {
    return (
      LEADERSHIP_STANCES
        .HAND_BACK_CONTROL
    );
  }

  return (
    LEADERSHIP_STANCES
      .WALK_BESIDE
  );
}

/**
 * Chooses the amount of Mentor intervention.
 */
function chooseInterventionLevel({
  primaryAction,
  signals,
}) {
  if (
    primaryAction.action ===
    ADAPTIVE_ACTIONS.WAIT
  ) {
    return (
      INTERVENTION_LEVELS.NONE
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
          .APPLY_FORGET_REQUEST,

        ADAPTIVE_ACTIONS
          .PRESERVE_SESSION_HANDOFF,
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

/**
 * Chooses final response depth.
 */
function chooseResponseDepth({
  primaryAction,
  interventionLevel,
  signals,
  context,
  progressionPlan,
}) {
  if (
    context
      ?.preferredResponseDepth
  ) {
    return (
      context
        .preferredResponseDepth
    );
  }

  if (
    primaryAction.action ===
    ADAPTIVE_ACTIONS.WAIT
  ) {
    return (
      RESPONSE_DEPTHS.SILENT
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
          .APPLY_FORGET_REQUEST,

        ADAPTIVE_ACTIONS
          .PRESERVE_SESSION_HANDOFF,
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
      RESPONSE_DEPTHS.SHORT
    );
  }

  if (
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
      RESPONSE_DEPTHS.SHORT
    );
  }

  const progressionLength =
    getNestedValue(
      progressionPlan,
      "progression.responseLength",
      null
    );

  if (
    progressionLength ===
    "detailed"
  ) {
    return (
      RESPONSE_DEPTHS
        .DETAILED
    );
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
      RESPONSE_DEPTHS.MEDIUM
    );
  }

  return (
    RESPONSE_DEPTHS.SHORT
  );
}

/**
 * Chooses final question behaviour.
 */
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
          .SAVE_AND_PAUSE,

        ADAPTIVE_ACTIONS
          .PRESERVE_SESSION_HANDOFF,

        ADAPTIVE_ACTIONS
          .APPLY_FORGET_REQUEST,

        ADAPTIVE_ACTIONS
          .END_POSITIVELY,
      ]
    )
  ) {
    return {
      policy:
        QUESTION_POLICIES.NONE,

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
        QUESTION_POLICIES.NONE,

      maximumQuestions: 0,
    };
  }

  const plannedMaximum =
    getNestedValue(
      progressionPlan,
      "progression.maximumQuestions",
      1
    );

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
        Math.min(
          plannedMaximum,
          1
        ),
    };
  }

  return {
    policy:
      QUESTION_POLICIES
        .CREATOR_LED,

    maximumQuestions:
      Math.min(
        plannedMaximum,
        1
      ),
  };
}

/**
 * Chooses how memory may influence the response.
 */
function chooseMemoryPolicy({
  memoryPlan,
  signals,
  primaryAction,
}) {
  const hasInstructions =
    asArray(
      memoryPlan?.instructions
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
        .PRESERVE_SESSION_HANDOFF ||
    signals.includes(
      ADAPTATION_SIGNALS
        .SESSION_HANDOFF_AVAILABLE
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

/**
 * Combines response guidance from all specialist engines.
 */
function combineResponseGuidance({
  primaryAction,
  role,
  leadershipStance,
  interventionLevel,
  responseDepth,
  questionPolicy,
  memoryPolicy,
  conversationPlan,
  reflectionPlan,
  progressionPlan,
  memoryPlan,
  signals,
}) {
  const guidance = [
    ...(
      conversationPlan
        ?.responseGuidance ||
      []
    ),

    ...(
      reflectionPlan
        ?.responseGuidance ||
      []
    ),

    ...(
      progressionPlan
        ?.responseGuidance ||
      []
    ),

    ...(
      memoryPlan
        ?.responseGuidance ||
      []
    ),

    `Active Mentor role: ${role}.`,
    `Leadership stance: ${leadershipStance}.`,
    `Intervention level: ${interventionLevel}.`,
    `Response depth: ${responseDepth}.`,
    `Question policy: ${questionPolicy.policy}.`,
    `Maximum questions: ${questionPolicy.maximumQuestions}.`,
    `Memory policy: ${memoryPolicy}.`,
    `Primary adaptive action: ${primaryAction.action}.`,

    "Demonstrate understanding before introducing a new direction.",
    "Prefer the creator's present state over historical assumptions.",
    "Use remembered preferences as guidance, not fixed rules.",
    "Treat project decisions as scoped truth until the creator changes them.",
    "Do not expose internal specialist-agent machinery unless it helps the creator.",
    "Do not maximise response length.",
    "Do not compete with the creator for control of the conversation.",
    "Leave the creator with greater clarity, confidence or momentum.",
  ];

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
      "Do not delete or alter memory until the target is unambiguous.",
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
      "Acknowledge completion briefly after the persistence layer confirms it.",
      "Do not recreate the deleted conclusion from inference alone."
    );
  }

  if (
    primaryAction.action ===
    ADAPTIVE_ACTIONS
      .PRESERVE_SESSION_HANDOFF
  ) {
    guidance.push(
      "Preserve where the creator stopped, what was last completed and the most useful next step.",
      "Do not introduce another task while the creator is leaving.",
      "Make the future return feel easy rather than unfinished."
    );
  }

  if (
    primaryAction.action ===
    ADAPTIVE_ACTIONS
      .RESTORE_PROJECT_CONTEXT
  ) {
    guidance.push(
      "Restore only the landmarks needed to continue.",
      "Mention the last meaningful decision, current position and next useful step.",
      "Do not dump the full project history."
    );
  }

  if (
    primaryAction.action ===
    ADAPTIVE_ACTIONS
      .MOVE_TO_NEXT_TASK
  ) {
    guidance.push(
      "Do not reopen completed philosophy or architecture discussions.",
      "Provide the next concrete task immediately.",
      "Follow the creator's established build workflow."
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

/**
 * Combines guard rails from all specialist engines.
 */
function combineGuardRails({
  conversationPlan,
  reflectionPlan,
  progressionPlan,
  memoryPlan,
}) {
  return uniqueValues([
    ...(
      conversationPlan
        ?.guardRails ||
      []
    ),

    ...(
      reflectionPlan
        ?.guardRails ||
      []
    ),

    ...(
      progressionPlan
        ?.guardRails ||
      []
    ),

    ...(
      memoryPlan
        ?.guardRails ||
      []
    ),

    "Do not diagnose the creator.",
    "Do not claim certainty about the creator's internal state.",
    "Do not use personalisation to manipulate engagement.",
    "Do not surface memory merely to demonstrate recall.",
    "Do not interrupt active flow with optional information.",
    "Do not use historical behaviour to override explicit present direction.",
    "Do not imitate the creator's language unnaturally.",
    "Do not produce multiple next steps when one is sufficient.",
    "Do not make the creator dependent on the Mentor.",
    "Do not treat agreement as the goal; useful alignment is the goal.",
    "Do not allow specialist agents to silently overwrite creator-approved project truth.",
    "Do not mix project-scoped memory across different projects.",
    "Do not execute an ambiguous forget request.",
    "Do not treat memory recall as permission to derail the creator's current task.",
  ]);
}

/**
 * Builds execution instructions for the future response layer.
 */
function createExecutionPlan({
  primaryAction,
  role,
  leadershipStance,
  interventionLevel,
  responseDepth,
  questionPolicy,
  memoryPolicy,
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
      ADAPTIVE_ACTIONS.WAIT,

    shouldWait:
      primaryAction.action ===
      ADAPTIVE_ACTIONS.WAIT,

    shouldMoveForward:
      includesValue(
        primaryAction.action,
        [
          ADAPTIVE_ACTIONS
            .MOVE_TO_CREATION,

          ADAPTIVE_ACTIONS
            .MOVE_TO_NEXT_TASK,

          ADAPTIVE_ACTIONS
            .MOVE_TO_REFINEMENT,

          ADAPTIVE_ACTIONS
            .MOVE_TO_PUBLISHING,
        ]
      ),

    shouldCaptureMemory,

    shouldRecallMemory,

    shouldPreserveSessionHandoff:
      primaryAction.action ===
        ADAPTIVE_ACTIONS
          .PRESERVE_SESSION_HANDOFF ||
      memoryPolicy ===
        MEMORY_POLICIES
          .PRESERVE_HANDOFF,

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
        ),

      hasSessionHandoff:
        memoryPlanHasSessionHandoff(
          memoryPlan
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
  };
}

/**
 * Produces a concise adaptive decision summary.
 */
function createDecisionSummary({
  primaryAction,
  role,
  leadershipStance,
  interventionLevel,
  responseDepth,
  signals,
}) {
  return (
    `Use ${primaryAction.action} as the primary action. ` +
    `The Mentor should act as ${role}, ` +
    `using a ${leadershipStance} stance with ` +
    `${interventionLevel} intervention and ` +
    `${responseDepth} response depth. ` +
    `Active signals: ${
      signals.length > 0
        ? signals.join(", ")
        : "none"
    }.`
  );
}

/**
 * Creates a safe fallback adaptive plan.
 */
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
        cleanString(message),
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
        MENTOR_ROLES.LISTENER,

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
    },

    execution: {
      action:
        ADAPTIVE_ACTIONS
          .ACKNOWLEDGE_BRIEFLY,

      MentorRole:
        MENTOR_ROLES.LISTENER,

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

      shouldGenerateResponse:
        true,

      shouldWait:
        false,

      shouldMoveForward:
        false,

      shouldCaptureMemory:
        false,

      shouldRecallMemory:
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

      memoryInstructions: [],
      recallPlan: null,
      forgetPlan: null,

      creatorMemoryContext: null,

      projectMemory: {
        activeProjectId:
          getProjectId(
            context
          ),

        hasProjectMemory:
          false,

        hasSessionHandoff:
          false,

        sourceAgent: null,

        specialistSignalsPresent:
          false,
      },

      reflectionCandidate:
        null,

      progressionTarget:
        null,
    },

    signals: [],

    responseGuidance: [
      "Use a short, warm acknowledgement.",
      "Do not introduce multiple new directions.",
      "Ask no more than one question.",
      "Keep the creator in ownership.",
      "Do not make new memory assumptions while adaptive planning is unavailable.",
    ],

    guardRails: [
      "Do not diagnose.",
      "Do not make assumptions from unavailable context.",
      "Do not overwhelm the creator.",
      "Do not execute memory deletion from fallback state.",
    ],

    creatorProtocol: {
      protectTheCreator: true,
      creatorOwnsTheIdea: true,
      presentBehaviourLeads: true,
      memoryMustProtectAutonomy: true,
    },

    specialistPlans: {
      conversation: null,
      reflection: null,
      progression: null,
      memory: null,
    },

    contextSnapshot:
      cloneValue(context),

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

/**
 * Creates the Adaptive Mentor Engine service.
 */
function createAdaptiveMentorEngine({
  conversationPlanner = null,
  reflectionEngine = null,
  progressionEngine = null,
  creatorMemoryEngine = null,
  memory = null,
} = {}) {
  let activeMemory =
    memory;

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
    createCreatorMemoryEngine();

  /**
   * Produces one unified Mentor behaviour plan.
   */
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

      const responseGuidance =
        combineResponseGuidance({
          primaryAction,
          role,
          leadershipStance,
          interventionLevel,
          responseDepth,
          questionPolicy,
          memoryPolicy,

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

          longTermMemoryInforms:
            true,

          projectMemoryIsScoped:
            true,

          projectTruthMayEvolve:
            true,

          creatorCorrectionsOverrideMemory:
            true,

          specialistAgentsMayInform:
            true,

          specialistAgentsDoNotOwnTruth:
            true,

          sessionHandoffProtectsMomentum:
            true,

          explicitForgetRequestsAreRespected:
            true,

          ambiguousForgetRequestsRequireClarification:
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

          memoryAvailable:
            memoryPlanHasProjectMemory(
              resolvedMemoryPlan
            ),

          longTermMemoryAvailable:
            Boolean(
              combinedContext
                ?.creatorMemoryContext
            ),

          sessionHandoffAvailable:
            memoryPlanHasSessionHandoff(
              resolvedMemoryPlan
            ),

          specialistMemorySignalsPresent:
            contextHasSpecialistMemorySignals(
              combinedContext
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
   * Applies memory instructions using CreatorMemory.js.
   *
   * CreatorMemoryEngine remains responsible for deciding
   * which instructions are immediately executable and which
   * require a future project-memory adapter.
   */
  function applyMemoryPlan(
    plan
  ) {
    if (
      !activeMemory
    ) {
      return {
        applied: [],

        skipped:
          plan
            ?.execution
            ?.memoryInstructions ||
          [],

        errors: [],

        reason:
          "No Creator Memory service is connected.",
      };
    }

    const memoryPlan =
      plan
        ?.specialistPlans
        ?.memory;

    if (
      !memoryPlan
    ) {
      return {
        applied: [],
        skipped: [],
        errors: [],
        reason:
          "No Creator Memory plan was available.",
      };
    }

    return (
      resolvedCreatorMemoryEngine
        .applyMemoryPlan({
          plan:
            memoryPlan,

          memory:
            activeMemory,
        })
    );
  }

  /**
   * Creates a standalone recall plan using the
   * richer CreatorMemoryEngine recall architecture.
   */
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
        shouldRecall: false,
        priority: "none",
        timing: "not-now",
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

  /**
   * Creates a session-handoff memory plan.
   */
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

  /**
   * Returns the compact long-term memory context currently
   * available to the Adaptive Mentor.
   */
  function getMemoryContext() {
    return readCreatorMemoryContext(
      activeMemory
    );
  }

  /**
   * Replaces the connected Creator Memory service.
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
    shouldCaptureMemory,
    shouldRecallMemory,
    shouldPreserveSessionHandoff,
    shouldApplyForget,
    shouldClarifyForget,
  };
}

/**
 * Convenience method for one-off adaptive planning.
 */
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
  ACTION_PRIORITIES,
  ADAPTIVE_ACTIONS,
  ADAPTATION_SIGNALS,
  createAdaptiveMentorEngine,
  planMentorBehaviour,
};

export default createAdaptiveMentorEngine;
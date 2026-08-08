/**
 * Conversation Planner
 * ------------------------------------------------------------
 * The orchestration layer for iBand's AI Mentor.
 *
 * Responsibilities:
 * - Analyse the creator's latest message.
 * - Retrieve relevant Creator Memory context.
 * - Choose the appropriate conversation mode.
 * - Choose the Mentor's next conversational move.
 * - Select the Mentor's tone and strategy.
 * - Apply The Creator Protocol.
 * - Return a structured plan for the AI response layer.
 *
 * Important:
 * This file does NOT generate the final Mentor response.
 * It generates decisions that another layer can execute.
 */

import analyseCreatorMessage from "./TheCreatorEngine";

const CONVERSATION_PLANNER_VERSION = "1.1.0";

const CONVERSATION_MODES = Object.freeze({
  WELCOME: "welcome",
  LISTENING: "listening",
  IMAGINATION: "imagination",
  DISCOVERY: "discovery",
  REFLECTION: "reflection",
  CONFIDENCE: "confidence",
  RECOVERY: "recovery",
  CREATION: "creation",
  REFINEMENT: "refinement",
  PUBLISHING: "publishing",
  CELEBRATION: "celebration",
  LEARNING: "learning",
  PROBLEM_SOLVING: "problem-solving",
});

/**
 * The Mentor Move describes the kind of interaction the Mentor
 * should make next.
 *
 * Conversation mode describes the situation.
 * Mentor move describes what the Mentor should DO about it.
 *
 * Example:
 *
 * mode: refinement
 * move: demonstrate
 *
 * The response layer can then demonstrate an improved version
 * instead of merely explaining one.
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
  REFLECT: "reflect",
  RECALL: "recall",
  CELEBRATE: "celebrate",
  PREPARE: "prepare",
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
  QUIETLY_CONFIDENT: "quietly-confident",
});

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
  REFLECT_PATTERN: "reflect-pattern",
  BEGIN_CREATION: "begin-creation",
  REVIEW_CREATION: "review-creation",
  PREPARE_PUBLISHING: "prepare-publishing",
  CELEBRATE_PROGRESS: "celebrate-progress",
  OFFER_INSPIRATION_DRAWER:
    "offer-inspiration-drawer",
});

const MEMORY_REQUEST_TYPES = Object.freeze({
  NONE: "none",
  CREATOR_PROFILE: "creator-profile",
  RECENT_CONVERSATIONS: "recent-conversations",
  ACTIVE_PROJECT: "active-project",
  RELEVANT_IDEAS: "relevant-ideas",
  INSPIRATION_DRAWER: "inspiration-drawer",
  CREATIVE_PATTERNS: "creative-patterns",
  MILESTONES: "milestones",
  FULL_ENGINE_CONTEXT: "full-engine-context",
});

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

  /**
   * New v1.1 principles.
   *
   * Movie Mentor should not turn every interaction into
   * a questionnaire or tutorial.
   */
  demonstrateWhenUseful: true,
  teachWithoutTakingOver: true,
  respectCreatorExperience: true,
  actionBeforeExplanationWhenAppropriate: true,
  creatorCanOverrideMentorDirection: true,
});

const DEFAULT_PLANNER_CONTEXT = Object.freeze({
  creatorJourney: "guide",
  creatorType: null,
  creatorExperience: null,

  projectType: null,
  projectTitle: null,
  genre: null,
  style: null,
  mood: null,
  audience: null,

  activeProject: null,

  knownPatterns: [],
  recentConversations: [],
  creatorProfile: null,

  conversationCount: 0,
  completedProjectCount: 0,
  publishedProjectCount: 0,
  savedIdeaCount: 0,
  inspirationDrawerCount: 0,

  recentStage: null,
  recentEmotionalState: null,

  hasSharedIdea: false,

  /**
   * Optional interaction signals supplied by specialist
   * Studio experiences such as Movie Mentor.
   */
  requestedHelp: false,
  requestedExplanation: false,
  requestedExample: false,
  requestedDemonstration: false,
  requestedCreation: false,
  requestedChange: false,

  /**
   * Allows an experienced creator to work independently
   * while keeping Mentor available on demand.
   */
  mentorInvoked: true,
});

/**
 * Returns a current ISO timestamp.
 */
function createTimestamp() {
  return new Date().toISOString();
}

/**
 * Creates a lightweight plan identifier.
 */
function createPlanId() {
  const randomValue = Math.random()
    .toString(36)
    .slice(2, 10);

  return `conversation-plan-${Date.now()}-${randomValue}`;
}

/**
 * Safely clones plain data objects.
 */
function cloneValue(value) {
  if (value === undefined) {
    return undefined;
  }

  return JSON.parse(JSON.stringify(value));
}

/**
 * Normalises unknown values into clean strings.
 */
function normaliseString(value) {
  return typeof value === "string"
    ? value.trim()
    : "";
}

/**
 * Returns a unique array containing only useful values.
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
 * Safely calls a memory method.
 */
function safelyCallMemoryMethod(
  memory,
  methodName,
  fallbackValue,
  ...args
) {
  try {
    if (
      memory &&
      typeof memory[methodName] === "function"
    ) {
      const result = memory[methodName](...args);

      return result ?? fallbackValue;
    }
  } catch (error) {
    console.warn(
      `ConversationPlanner memory method failed: ${methodName}`,
      error
    );
  }

  return fallbackValue;
}

/**
 * Reads the main engine context from Creator Memory.
 */
function retrieveEngineContext(memory) {
  return safelyCallMemoryMethod(
    memory,
    "createEngineContext",
    {}
  );
}

/**
 * Retrieves supporting memory without requiring every
 * Creator Memory method to be available.
 */
function retrieveSupportingMemory(memory) {
  return {
    creatorProfile: safelyCallMemoryMethod(
      memory,
      "getCreatorProfile",
      null
    ),

    activeProject: safelyCallMemoryMethod(
      memory,
      "getActiveProject",
      null
    ),

    recentConversations:
      safelyCallMemoryMethod(
        memory,
        "getRecentConversations",
        [],
        5
      ),

    inspirationDrawer:
      safelyCallMemoryMethod(
        memory,
        "getInspirationDrawer",
        [],
        {
          limit: 5,
        }
      ),

    knownPatterns: safelyCallMemoryMethod(
      memory,
      "getPatterns",
      [],
      {
        minimumConfidence: 0.65,
        limit: 10,
      }
    ),

    milestones: safelyCallMemoryMethod(
      memory,
      "getMilestones",
      [],
      5
    ),
  };
}

/**
 * Combines supplied Studio context with Creator Memory.
 *
 * Explicit context supplied by the active workspace takes
 * priority over older stored memory.
 */
function buildCombinedContext({
  context = {},
  memoryContext = {},
  supportingMemory = {},
}) {
  const safeContext = {
    ...cloneValue(DEFAULT_PLANNER_CONTEXT),
    ...cloneValue(memoryContext),
    ...cloneValue(context),
  };

  return {
    ...safeContext,

    creatorProfile:
      context.creatorProfile ||
      memoryContext.creatorProfile ||
      supportingMemory.creatorProfile ||
      null,

    activeProject:
      context.activeProject ||
      memoryContext.activeProject ||
      supportingMemory.activeProject ||
      null,

    recentConversations:
      context.recentConversations ||
      supportingMemory.recentConversations ||
      [],

    knownPatterns:
      context.knownPatterns ||
      memoryContext.knownPatterns ||
      supportingMemory.knownPatterns ||
      [],

    inspirationDrawer:
      context.inspirationDrawer ||
      supportingMemory.inspirationDrawer ||
      [],

    milestones:
      context.milestones ||
      supportingMemory.milestones ||
      [],
  };
}

/**
 * Chooses the broad conversation experience.
 */
function chooseConversationMode(analysis) {
  const emotionalState =
    analysis?.analysis?.emotionalState?.value;

  const intent =
    analysis?.analysis?.intent?.value;

  const creatorStage =
    analysis?.analysis?.creatorStage?.value;

  const fragileIdea =
    analysis?.analysis?.fragileIdea?.value;

  if (fragileIdea) {
    return CONVERSATION_MODES.CONFIDENCE;
  }

  if (emotionalState === "celebrating") {
    return CONVERSATION_MODES.CELEBRATION;
  }

  if (
    emotionalState === "disappointed" ||
    emotionalState === "doubting"
  ) {
    return CONVERSATION_MODES.RECOVERY;
  }

  if (
    emotionalState === "stuck" ||
    emotionalState === "overwhelmed"
  ) {
    return CONVERSATION_MODES.CONFIDENCE;
  }

  if (intent === "imagine") {
    return CONVERSATION_MODES.IMAGINATION;
  }

  if (
    intent === "remember" ||
    intent === "discover"
  ) {
    return CONVERSATION_MODES.DISCOVERY;
  }

  if (intent === "reflect") {
    return CONVERSATION_MODES.REFLECTION;
  }

  if (intent === "learn") {
    return CONVERSATION_MODES.LEARNING;
  }

  if (intent === "solve") {
    return CONVERSATION_MODES.PROBLEM_SOLVING;
  }

  if (
    intent === "publish" ||
    creatorStage === "publishing"
  ) {
    return CONVERSATION_MODES.PUBLISHING;
  }

  if (
    intent === "refine" ||
    creatorStage === "refining"
  ) {
    return CONVERSATION_MODES.REFINEMENT;
  }

  if (
    intent === "generate" ||
    intent === "share-idea" ||
    creatorStage === "creating"
  ) {
    return CONVERSATION_MODES.CREATION;
  }

  if (creatorStage === "new") {
    return CONVERSATION_MODES.WELCOME;
  }

  return CONVERSATION_MODES.LISTENING;
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
    analysis?.analysis?.emotionalState?.value;

  const creatorJourney =
    context?.creatorJourney || "guide";

  if (mode === CONVERSATION_MODES.CELEBRATION) {
    return MENTOR_TONES.CELEBRATORY;
  }

  if (
    mode === CONVERSATION_MODES.RECOVERY ||
    mode === CONVERSATION_MODES.CONFIDENCE
  ) {
    return MENTOR_TONES.REASSURING;
  }

  if (
    mode === CONVERSATION_MODES.REFLECTION ||
    mode === CONVERSATION_MODES.DISCOVERY
  ) {
    return MENTOR_TONES.REFLECTIVE;
  }

  if (mode === CONVERSATION_MODES.IMAGINATION) {
    return MENTOR_TONES.CURIOUS;
  }

  if (
    mode === CONVERSATION_MODES.LEARNING ||
    mode === CONVERSATION_MODES.PROBLEM_SOLVING
  ) {
    return MENTOR_TONES.PRACTICAL;
  }

  if (creatorJourney === "expert") {
    return MENTOR_TONES.QUIETLY_CONFIDENT;
  }

  if (creatorJourney === "together") {
    return MENTOR_TONES.COLLABORATIVE;
  }

  if (creatorJourney === "surprise") {
    return MENTOR_TONES.CURIOUS;
  }

  if (
    emotionalState === "excited" ||
    emotionalState === "confident"
  ) {
    return MENTOR_TONES.ENCOURAGING;
  }

  return MENTOR_TONES.WARM;
}

/**
 * Selects the practical action the response layer should take.
 */
function choosePrimaryAction({
  mode,
  analysis,
}) {
  const nextAction =
    analysis?.strategy?.nextAction;

  const fragileIdea =
    analysis?.analysis?.fragileIdea?.value;

  if (fragileIdea) {
    return PLAN_ACTIONS.PROTECT_IDEA;
  }

  switch (mode) {
    case CONVERSATION_MODES.WELCOME:
      return PLAN_ACTIONS.ASK_ONE_QUESTION;

    case CONVERSATION_MODES.IMAGINATION:
      return PLAN_ACTIONS.INVITE_IMAGINATION;

    case CONVERSATION_MODES.DISCOVERY:
      return PLAN_ACTIONS.INVITE_REFLECTION;

    case CONVERSATION_MODES.REFLECTION:
      return PLAN_ACTIONS.REFLECT_PATTERN;

    case CONVERSATION_MODES.CONFIDENCE:
      return PLAN_ACTIONS.OFFER_SMALL_STEP;

    case CONVERSATION_MODES.RECOVERY:
      return PLAN_ACTIONS.PROTECT_IDEA;

    case CONVERSATION_MODES.CREATION:
      return PLAN_ACTIONS.EXPLORE_IDEA;

    case CONVERSATION_MODES.REFINEMENT:
      return PLAN_ACTIONS.REVIEW_CREATION;

    case CONVERSATION_MODES.PUBLISHING:
      return PLAN_ACTIONS.PREPARE_PUBLISHING;

    case CONVERSATION_MODES.CELEBRATION:
      return PLAN_ACTIONS.CELEBRATE_PROGRESS;

    case CONVERSATION_MODES.LEARNING:
    case CONVERSATION_MODES.PROBLEM_SOLVING:
      return PLAN_ACTIONS.OFFER_SMALL_STEP;

    default:
      break;
  }

  if (nextAction === "begin-creation") {
    return PLAN_ACTIONS.BEGIN_CREATION;
  }

  if (
    nextAction ===
    "offer-perspective-with-permission"
  ) {
    return PLAN_ACTIONS.OFFER_PERSPECTIVE;
  }

  return PLAN_ACTIONS.LISTEN;
}

/**
 * Chooses the Mentor's next interaction move.
 *
 * This sits between broad conversation mode and the final
 * response layer.
 *
 * It allows specialist Mentors to behave differently without
 * changing the underlying Creator Protocol.
 */
function chooseMentorMove({
  mode,
  primaryAction,
  analysis,
  context,
}) {
  const intent =
    analysis?.analysis?.intent?.value;

  const creatorJourney =
    context?.creatorJourney || "guide";

  const creatorExperience =
    context?.creatorExperience;

  /**
   * Explicit creator requests always take priority.
   */
  if (context?.requestedDemonstration) {
    return MENTOR_MOVES.DEMONSTRATE;
  }

  if (context?.requestedExample) {
    return MENTOR_MOVES.SHOW;
  }

  if (context?.requestedExplanation) {
    return MENTOR_MOVES.TEACH;
  }

  if (context?.requestedCreation) {
    return MENTOR_MOVES.CREATE;
  }

  if (context?.requestedChange) {
    return MENTOR_MOVES.REFINE;
  }

  /**
   * An experienced creator should be allowed to work.
   *
   * Mentor remains available but does not unnecessarily
   * interrupt the creative process.
   */
  if (
    creatorJourney === "expert" &&
    !context?.requestedHelp &&
    context?.mentorInvoked === false
  ) {
    return MENTOR_MOVES.CONTINUE;
  }

  if (
    creatorExperience === "experienced" &&
    !context?.requestedHelp &&
    context?.mentorInvoked === false
  ) {
    return MENTOR_MOVES.CONTINUE;
  }

  if (
    mode === CONVERSATION_MODES.CELEBRATION
  ) {
    return MENTOR_MOVES.CELEBRATE;
  }

  if (
    mode === CONVERSATION_MODES.REFLECTION
  ) {
    return MENTOR_MOVES.REFLECT;
  }

  if (
    mode === CONVERSATION_MODES.DISCOVERY
  ) {
    return MENTOR_MOVES.RECALL;
  }

  if (
    mode === CONVERSATION_MODES.LEARNING
  ) {
    return MENTOR_MOVES.TEACH;
  }

  if (
    mode === CONVERSATION_MODES.PROBLEM_SOLVING
  ) {
    return MENTOR_MOVES.SUGGEST;
  }

  if (
    mode === CONVERSATION_MODES.PUBLISHING
  ) {
    return MENTOR_MOVES.PREPARE;
  }

  if (
    mode === CONVERSATION_MODES.REFINEMENT
  ) {
    return MENTOR_MOVES.REFINE;
  }

  if (
    mode === CONVERSATION_MODES.CREATION &&
    (
      intent === "generate" ||
      primaryAction === PLAN_ACTIONS.BEGIN_CREATION
    )
  ) {
    return MENTOR_MOVES.CREATE;
  }

  if (
    mode === CONVERSATION_MODES.CREATION
  ) {
    return MENTOR_MOVES.DISCUSS;
  }

  if (
    mode === CONVERSATION_MODES.IMAGINATION
  ) {
    return MENTOR_MOVES.DISCUSS;
  }

  if (
    mode === CONVERSATION_MODES.WELCOME
  ) {
    return MENTOR_MOVES.ASK;
  }

  if (
    mode === CONVERSATION_MODES.CONFIDENCE ||
    mode === CONVERSATION_MODES.RECOVERY
  ) {
    return MENTOR_MOVES.SUGGEST;
  }

  if (
    primaryAction ===
    PLAN_ACTIONS.ASK_ONE_QUESTION
  ) {
    return MENTOR_MOVES.ASK;
  }

  if (
    primaryAction ===
    PLAN_ACTIONS.OFFER_PERSPECTIVE
  ) {
    return MENTOR_MOVES.SUGGEST;
  }

  return MENTOR_MOVES.LISTEN;
}

/**
 * Chooses secondary actions that may support the primary one.
 */
function chooseSupportingActions({
  mode,
  analysis,
  context,
}) {
  const actions = [];

  const fragileIdea =
    analysis?.analysis?.fragileIdea?.value;

  const knownPatterns =
    context?.knownPatterns || [];

  const inspirationDrawerCount =
    Number(context?.inspirationDrawerCount) ||
    context?.inspirationDrawer?.length ||
    0;

  if (fragileIdea) {
    actions.push(
      PLAN_ACTIONS.OFFER_INSPIRATION_DRAWER
    );
  }

  if (
    mode === CONVERSATION_MODES.REFLECTION &&
    knownPatterns.length > 0
  ) {
    actions.push(
      PLAN_ACTIONS.RECALL_MEMORY
    );
  }

  if (
    mode === CONVERSATION_MODES.DISCOVERY &&
    context?.conversationCount > 0
  ) {
    actions.push(
      PLAN_ACTIONS.RECALL_MEMORY
    );
  }

  if (
    mode === CONVERSATION_MODES.RECOVERY &&
    inspirationDrawerCount > 0
  ) {
    actions.push(
      PLAN_ACTIONS.OFFER_INSPIRATION_DRAWER
    );
  }

  return uniqueValues(actions);
}

/**
 * Chooses which forms of memory the Mentor may require.
 */
function chooseMemoryRequests({
  mode,
  primaryAction,
  context,
}) {
  const requests = [];

  if (!context?.creatorProfile) {
    requests.push(
      MEMORY_REQUEST_TYPES.CREATOR_PROFILE
    );
  }

  if (mode === CONVERSATION_MODES.WELCOME) {
    requests.push(
      MEMORY_REQUEST_TYPES.CREATOR_PROFILE
    );
  }

  if (
    mode === CONVERSATION_MODES.CREATION ||
    mode === CONVERSATION_MODES.REFINEMENT ||
    mode === CONVERSATION_MODES.PUBLISHING
  ) {
    requests.push(
      MEMORY_REQUEST_TYPES.ACTIVE_PROJECT
    );
  }

  if (
    mode === CONVERSATION_MODES.DISCOVERY ||
    mode === CONVERSATION_MODES.REFLECTION
  ) {
    requests.push(
      MEMORY_REQUEST_TYPES.RECENT_CONVERSATIONS,
      MEMORY_REQUEST_TYPES.CREATIVE_PATTERNS
    );
  }

  if (
    mode === CONVERSATION_MODES.RECOVERY ||
    primaryAction ===
      PLAN_ACTIONS.PROTECT_IDEA
  ) {
    requests.push(
      MEMORY_REQUEST_TYPES.RELEVANT_IDEAS,
      MEMORY_REQUEST_TYPES.INSPIRATION_DRAWER
    );
  }

  if (
    mode === CONVERSATION_MODES.CELEBRATION
  ) {
    requests.push(
      MEMORY_REQUEST_TYPES.MILESTONES,
      MEMORY_REQUEST_TYPES.ACTIVE_PROJECT
    );
  }

  if (requests.length === 0) {
    requests.push(MEMORY_REQUEST_TYPES.NONE);
  }

  return uniqueValues(requests);
}

/**
 * Determines how much the Mentor should speak or ask.
 */
function createConversationLimits({
  mode,
  mentorMove,
  context,
}) {
  const creatorJourney =
    context?.creatorJourney || "guide";

  const limits = {
    maximumQuestions: 1,
    maximumSuggestions: 2,
    shouldExplainReasoning: true,
    shouldWaitForCreatorReply: true,
    responseLength: "medium",
  };

  /**
   * Direct execution moves should not unnecessarily finish
   * with another question.
   */
  if (
    mentorMove === MENTOR_MOVES.CREATE ||
    mentorMove === MENTOR_MOVES.REFINE ||
    mentorMove === MENTOR_MOVES.DEMONSTRATE ||
    mentorMove === MENTOR_MOVES.SHOW
  ) {
    return {
      ...limits,
      maximumQuestions: 0,
      maximumSuggestions: 1,
      shouldExplainReasoning: false,
      shouldWaitForCreatorReply: false,
      responseLength: "medium",
    };
  }

  if (mentorMove === MENTOR_MOVES.CONTINUE) {
    return {
      ...limits,
      maximumQuestions: 0,
      maximumSuggestions: 0,
      shouldExplainReasoning: false,
      shouldWaitForCreatorReply: false,
      responseLength: "short",
    };
  }

  if (creatorJourney === "expert") {
    return {
      ...limits,
      maximumQuestions: 0,
      maximumSuggestions: 1,
      shouldExplainReasoning: false,
      responseLength: "short",
    };
  }

  if (creatorJourney === "surprise") {
    return {
      ...limits,
      maximumQuestions: 1,
      maximumSuggestions: 3,
      responseLength: "medium",
    };
  }

  if (
    mode === CONVERSATION_MODES.CONFIDENCE ||
    mode === CONVERSATION_MODES.RECOVERY
  ) {
    return {
      ...limits,
      maximumQuestions: 1,
      maximumSuggestions: 1,
      responseLength: "short",
    };
  }

  if (mode === CONVERSATION_MODES.LEARNING) {
    return {
      ...limits,
      maximumQuestions: 1,
      maximumSuggestions: 3,
      shouldExplainReasoning: true,
      responseLength: "medium",
    };
  }

  return limits;
}

/**
 * Builds phrases and behaviours that the AI response layer
 * must not use.
 */
function createGuardRails(analysis) {
  const avoid = [
    ...(analysis?.avoid || []),

    "Do not diagnose the creator.",
    "Do not pretend to know the creator better than they know themselves.",
    "Do not repeat questions already answered in the supplied context.",
    "Do not overwhelm the creator with a large questionnaire.",
    "Do not claim ownership of the creator's work.",
    "Do not make success guarantees.",
    "Do not use empty praise without evidence.",
    "Do not pressure the creator to publish unfinished work.",

    /**
     * Mentor should never become an obstacle between an
     * experienced creator and their tools.
     */
    "Do not force teaching when the creator wants to create.",
    "Do not explain something the creator has asked you simply to do.",
    "Do not interrupt an experienced creator with unnecessary questions.",
    "Do not replace the creator's creative decision with the Mentor's preference.",
  ];

  return uniqueValues(avoid);
}

/**
 * Builds the active version of The Creator Protocol.
 */
function createProtocol({
  analysis,
  context,
}) {
  const protocol = {
    ...CREATOR_PROTOCOL,

    confidenceProtectionRequired:
      Boolean(
        analysis?.analysis?.fragileIdea?.value
      ) ||
      analysis?.analysis?.emotionalState
        ?.value === "doubting",

    memoryShouldInformResponse:
      Boolean(
        context?.conversationCount ||
        context?.activeProject ||
        context?.knownPatterns?.length
      ),

    creatorJourney:
      context?.creatorJourney || "guide",

    creatorExperience:
      context?.creatorExperience || null,
  };

  return protocol;
}

/**
 * Produces a concise explanation for debugging and future
 * Mentor transparency tools.
 */
function createPlannerSummary({
  mode,
  mentorMove,
  tone,
  primaryAction,
  memoryRequests,
  analysis,
}) {
  const emotionalState =
    analysis?.analysis?.emotionalState?.value ||
    "neutral";

  const intent =
    analysis?.analysis?.intent?.value ||
    "unknown";

  return (
    `Use ${mode} mode with a ${tone} tone. ` +
    `The Mentor's next move is ${mentorMove}. ` +
    `The creator appears ${emotionalState} ` +
    `and their likely intent is ${intent}. ` +
    `The primary action is ${primaryAction}. ` +
    `Memory requested: ${memoryRequests.join(
      ", "
    )}.`
  );
}

/**
 * Creates a safe fallback plan if analysis unexpectedly fails.
 */
function createFallbackPlan({
  message,
  context,
  error = null,
}) {
  return {
    id: createPlanId(),
    planner: "conversation-planner",
    version: CONVERSATION_PLANNER_VERSION,

    input: {
      message: normaliseString(message),
    },

    conversation: {
      mode: CONVERSATION_MODES.LISTENING,
      mentorMove: MENTOR_MOVES.LISTEN,
      tone: MENTOR_TONES.WARM,
      primaryAction: PLAN_ACTIONS.LISTEN,
      supportingActions: [],

      limits: {
        maximumQuestions: 1,
        maximumSuggestions: 1,
        shouldExplainReasoning: false,
        shouldWaitForCreatorReply: true,
        responseLength: "short",
      },
    },

    memory: {
      requests: [MEMORY_REQUEST_TYPES.NONE],
      context: cloneValue(context),
    },

    creatorProtocol: {
      ...CREATOR_PROTOCOL,
    },

    responseGuidance: [
      "Listen carefully.",
      "Use warm, natural language.",
      "Ask no more than one question.",
      "Keep the creator in ownership.",
    ],

    guardRails: createGuardRails(null),

    analysis: null,

    plannerSummary:
      "Analysis was unavailable. Use safe listening mode.",

    status: "fallback",

    error: error
      ? {
          message:
            error instanceof Error
              ? error.message
              : String(error),
        }
      : null,

    createdAt: createTimestamp(),
  };
}

/**
 * Creates the Conversation Planner service.
 *
 * @param {Object} dependencies
 * @param {Function} dependencies.creatorEngine
 * @param {Object|null} dependencies.memory
 */
function createConversationPlanner({
  creatorEngine = analyseCreatorMessage,
  memory = null,
} = {}) {
  if (typeof creatorEngine !== "function") {
    throw new TypeError(
      "ConversationPlanner requires a valid creatorEngine function."
    );
  }

  function planConversation({
    message = "",
    context = {},
    memoryContext = null,
  } = {}) {
    try {
      const storedEngineContext =
        memoryContext ||
        retrieveEngineContext(memory);

      const supportingMemory =
        retrieveSupportingMemory(memory);

      const combinedContext =
        buildCombinedContext({
          context,
          memoryContext:
            storedEngineContext,
          supportingMemory,
        });

      const analysis = creatorEngine({
        message,
        context: combinedContext,
      });

      const mode =
        chooseConversationMode(analysis);

      const tone = chooseMentorTone({
        mode,
        analysis,
        context: combinedContext,
      });

      const primaryAction =
        choosePrimaryAction({
          mode,
          analysis,
        });

      /**
       * v1.1:
       * Determine the Mentor's actual conversational move.
       */
      const mentorMove =
        chooseMentorMove({
          mode,
          primaryAction,
          analysis,
          context: combinedContext,
        });

      const supportingActions =
        chooseSupportingActions({
          mode,
          analysis,
          context: combinedContext,
        });

      const memoryRequests =
        chooseMemoryRequests({
          mode,
          primaryAction,
          context: combinedContext,
        });

      const limits =
        createConversationLimits({
          mode,
          mentorMove,
          context: combinedContext,
        });

      const creatorProtocol =
        createProtocol({
          analysis,
          context: combinedContext,
        });

      const responseGuidance =
        uniqueValues([
          ...(analysis?.responseGuidance ||
            []),

          "Follow the selected conversation mode.",

          `Execute the selected Mentor move: ${mentorMove}.`,

          "Use the selected Mentor tone naturally.",

          "Do not generate more questions than the plan allows.",

          "Use remembered context only when it is relevant.",

          "Give the creator room to disagree or correct remembered observations.",

          "If the creator asks for an action, prefer performing the action over explaining how to perform it.",

          "If demonstrating, show a useful example before teaching the theory.",

          "Do not interrupt experienced creators unnecessarily.",

          "End with one clear next conversational step when a reply is required.",
        ]);

      const plannerSummary =
        createPlannerSummary({
          mode,
          mentorMove,
          tone,
          primaryAction,
          memoryRequests,
          analysis,
        });

      return {
        id: createPlanId(),
        planner: "conversation-planner",
        version:
          CONVERSATION_PLANNER_VERSION,

        input: {
          message:
            normaliseString(message),
        },

        conversation: {
          mode,

          /**
           * NEW:
           * What Movie Mentor should actually do next.
           */
          mentorMove,

          tone,
          primaryAction,
          supportingActions,

          mentorStrategy:
            analysis?.strategy?.primary ||
            null,

          supportingStrategies:
            analysis?.strategy?.supporting ||
            [],

          nextAction:
            analysis?.strategy?.nextAction ||
            null,

          limits,
        },

        memory: {
          requests: memoryRequests,

          shouldRecallMemory:
            !memoryRequests.includes(
              MEMORY_REQUEST_TYPES.NONE
            ),

          context: cloneValue(
            combinedContext
          ),
        },

        creatorProtocol,

        responseGuidance,

        guardRails:
          createGuardRails(analysis),

        analysis: cloneValue(analysis),

        plannerSummary,

        status: "planned",

        createdAt: createTimestamp(),
      };
    } catch (error) {
      console.error(
        "ConversationPlanner planning error:",
        error
      );

      return createFallbackPlan({
        message,
        context,
        error,
      });
    }
  }

  function setMemory(nextMemory) {
    memory = nextMemory || null;

    return memory;
  }

  function getMemory() {
    return memory;
  }

  return {
    planConversation,
    setMemory,
    getMemory,
  };
}

/**
 * Convenience method for one-off planning without manually
 * creating a planner service.
 */
function planConversation({
  message = "",
  context = {},
  memoryContext = null,
  memory = null,
  creatorEngine = analyseCreatorMessage,
} = {}) {
  const planner =
    createConversationPlanner({
      creatorEngine,
      memory,
    });

  return planner.planConversation({
    message,
    context,
    memoryContext,
  });
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
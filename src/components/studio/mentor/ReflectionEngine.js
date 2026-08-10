/**
 * Reflection Engine
 * ------------------------------------------------------------
 * The reflective listening, timing and creator-understanding layer
 * for iBand's AI Mentor — The Creator.
 *
 * Responsibilities:
 * - Understand whether the creator is still thinking or speaking.
 * - Protect creative flow, momentum and emerging ideas.
 * - Decide whether to reflect, encourage, clarify, wait or step aside.
 * - Respect execution decisions made by ConversationPlanner.
 * - Respect explicit creator direction before historical behaviour.
 * - Restore conversational and project context when a thought is lost.
 * - Release pressure when forcing an idea would be counterproductive.
 * - Surface evidence-based observations without defining the creator.
 * - Keep project-scoped reflection inside the active project.
 * - Respect creator corrections and evolving project truth.
 * - Recognise brief detours without opening unnecessary discussion.
 * - Preserve clean session exits and handoffs.
 * - Avoid reflective interference during explicit forget operations.
 * - Allow specialist-agent observations to inform reflection without
 *   granting them authority over creator-approved truth.
 *
 * This engine does NOT:
 * - Persist memory.
 * - Delete memory.
 * - Decide final memory truth.
 * - Generate final Mentor wording.
 * - Replace ConversationPlanner.
 * - Replace CreatorMemoryEngine.
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
 * Version 2.3 hardens Reflection for the live memory-aware Mentor:
 *
 * - Present creator direction outranks remembered behaviour.
 * - Execution moves outrank optional reflection.
 * - Pausing, stopping and forgetting cannot be obstructed by reflection.
 * - Project-scoped observations cannot leak across projects.
 * - Historical, superseded, rejected and archived memories do not
 *   become active reflections by accident.
 * - Creator-confirmed evidence outranks inferred and specialist-agent
 *   observations.
 * - Specialist observations remain suggestions, not truth.
 * - Session handoffs can provide restoration landmarks.
 * - Brief detours are acknowledged without opening rabbit holes.
 * - Creator corrections suppress stale contradictory reflection.
 * - Stored response-depth preferences cannot override silence, flow,
 *   execution or other immediate behavioural requirements.
 * - Reflection candidates are ranked by relevance, authority,
 *   confidence, evidence, permission and recency.
 * - Reflection remains optional when creation can continue.
 *
 * Core principles:
 * - Reflect before clarifying.
 * - Seek understanding before guidance.
 * - Never make the creator regret sharing.
 * - Protect confidence, momentum and emerging ideas.
 * - Do not interrupt creativity simply because the Mentor has
 *   something useful to add.
 * - Silence can be an intentional response.
 * - Reflections are possibilities, not verdicts.
 * - The creator remains the authority on their own experience.
 * - Present behaviour leads; memory informs.
 * - Project truth is scoped and revisable.
 * - Creator corrections override remembered assumptions.
 * - Specialist agents may contribute evidence but do not own truth.
 * - When the creator wants action, reflection must not become an
 *   obstacle between the creator and creation.
 * - Complexity belongs behind the conversation.
 */

const REFLECTION_ENGINE_VERSION = "2.3.0";

const REFLECTION_DECISIONS = Object.freeze({
  REFLECT: "reflect",
  ECHO: "echo",
  ENCOURAGE: "encourage",

  CLARIFY_GENTLY:
    "clarify-gently",

  HOLD_SPACE: "hold-space",

  RESTORE_CONTEXT:
    "restore-context",

  RELEASE_PRESSURE:
    "release-pressure",

  MOVE_FORWARD:
    "move-forward",

  CELEBRATE_GROWTH:
    "celebrate-growth",

  STAY_SILENT:
    "stay-silent",

  ACKNOWLEDGE_DETOUR:
    "acknowledge-detour",

  YIELD_TO_EXECUTION:
    "yield-to-execution",

  YIELD_TO_MEMORY_ACTION:
    "yield-to-memory-action",

  PRESERVE_HANDOFF:
    "preserve-handoff",

  NONE: "none",
});

const REFLECTION_TYPES = Object.freeze({
  UNDERSTANDING:
    "understanding",

  STRENGTH: "strength",
  PATTERN: "pattern",
  PROGRESS: "progress",
  EMOTION: "emotion",
  INTENTION: "intention",

  CREATIVE_IDENTITY:
    "creative-identity",

  MOMENTUM: "momentum",
  RESILIENCE: "resilience",
  POSSIBILITY: "possibility",
  CONTEXT: "context",

  PROJECT_CONTEXT:
    "project-context",

  PROJECT_TRUTH:
    "project-truth",

  SESSION_HANDOFF:
    "session-handoff",

  NONE: "none",
});

const CREATOR_THINKING_MODES =
  Object.freeze({
    FLOW: "flow",

    EXPLORATION:
      "exploration",

    LEARNING: "learning",
    BUILD: "build",

    REFLECTION:
      "reflection",

    RECOVERY: "recovery",
    DECISION: "decision",

    INCUBATION:
      "incubation",

    PAUSING: "pausing",

    RETURNING:
      "returning",

    UNKNOWN: "unknown",
  });

const GUIDANCE_RECEPTIVITY =
  Object.freeze({
    OPEN: "open",

    PARTIALLY_OPEN:
      "partially-open",

    LOW: "low",

    CLOSED_FOR_NOW:
      "closed-for-now",

    UNKNOWN: "unknown",
  });

const RESPONSE_DEPTH =
  Object.freeze({
    SILENT: "silent",
    MINIMAL: "minimal",
    SHORT: "short",
    MEDIUM: "medium",
    DEEP: "deep",
  });

const SILENCE_REASONS =
  Object.freeze({
    CREATOR_MAY_BE_THINKING:
      "creator-may-be-thinking",

    IDEA_MAY_BE_EMERGING:
      "idea-may-be-emerging",

    CREATOR_HAS_NOT_FINISHED:
      "creator-has-not-finished",

    PRESSURE_SHOULD_BE_RELEASED:
      "pressure-should-be-released",

    FLOW_SHOULD_NOT_BE_INTERRUPTED:
      "flow-should-not-be-interrupted",

    EXECUTION_SHOULD_CONTINUE:
      "execution-should-continue",

    CREATOR_IS_PAUSING:
      "creator-is-pausing",

    MEMORY_ACTION_HAS_PRIORITY:
      "memory-action-has-priority",

    NO_REFLECTION_NEEDED:
      "no-reflection-needed",
  });

const REFLECTION_SOURCES =
  Object.freeze({
    CREATOR:
      "creator",

    PROJECT_STATE:
      "project-state",

    CREATOR_MEMORY:
      "creator-memory",

    CONVERSATION:
      "conversation",

    MENTOR:
      "mentor",

    SPECIALIST_AGENT:
      "specialist-agent",

    INFERRED:
      "inferred",

    UNKNOWN:
      "unknown",
  });

const REFLECTION_CERTAINTY =
  Object.freeze({
    CONFIRMED:
      "confirmed",

    EXPLICIT:
      "explicit",

    OBSERVED:
      "observed",

    INFERRED:
      "inferred",

    UNKNOWN:
      "unknown",
  });

const REFLECTION_SCOPES =
  Object.freeze({
    CREATOR:
      "creator",

    PROJECT:
      "project",

    SESSION:
      "session",

    RELATIONSHIP:
      "relationship",

    ENTITY:
      "entity",

    GLOBAL:
      "global",
  });

const REFLECTION_AUTHORITY =
  Object.freeze({
    CREATOR_CONFIRMED:
      100,

    CREATOR_EXPLICIT:
      95,

    PROJECT_CONFIRMED:
      85,

    SYSTEM_CONFIRMED:
      80,

    CREATOR_OBSERVED:
      75,

    IMPORTED:
      65,

    SPECIALIST_AGENT:
      55,

    MENTOR_OBSERVED:
      50,

    INFERRED:
      35,

    UNKNOWN:
      20,
  });

const EXECUTION_MENTOR_MOVES =
  Object.freeze([
    "create",
    "refine",
    "demonstrate",
    "show",
    "prepare",
    "continue",
  ]);

const MEMORY_PRIORITY_ACTIONS =
  Object.freeze([
    "forget-memory",

    "apply-forget-request",

    "clarify-forget-request",
  ]);

const HISTORICAL_STATUSES =
  Object.freeze([
    "superseded",
    "historical",
    "archived",
    "rejected",
    "dismissed",
  ]);

const DEFAULT_REFLECTION_CONTEXT =
  Object.freeze({
    creatorId: null,

    creatorJourney:
      "guide",

    creatorType: null,

    creatorExperience:
      null,

    projectType: null,

    conversationMode:
      null,

    mentorMove: null,

    mentorTone: "warm",

    creatorMessageCount:
      0,

    mentorMessageCount:
      0,

    consecutiveCreatorMessages:
      0,

    consecutiveMentorMessages:
      0,

    recentCreatorMessages:
      [],

    recentMentorMessages:
      [],

    recentQuestionsFromCreator:
      0,

    recentQuestionsFromMentor:
      0,

    creatorResponseLength:
      "medium",

    mentorResponseLength:
      "medium",

    creatorAppearsFinished:
      true,

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

    requestedHelp: false,

    requestedExplanation:
      false,

    requestedExample:
      false,

    requestedDemonstration:
      false,

    requestedCreation:
      false,

    requestedChange:
      false,

    mentorInvoked: true,

    creatorEnergy:
      "unknown",

    momentum: null,

    guidanceWindow:
      null,

    informationSaturation:
      "low",

    thinkingMode:
      null,

    knownPatterns: [],

    existingPatterns:
      [],

    observations: [],

    existingObservations:
      [],

    existingMemories:
      [],

    existingProjectMemories:
      [],

    deferredMemories:
      [],

    milestones: [],

    recentConversations:
      [],

    activeProject: null,

    activeProjectId:
      null,

    activeIdea: null,

    activeStage: null,

    activeScene: null,

    activeCharacter:
      null,

    activeAsset: null,

    sessionId: null,

    sessionHandoff:
      null,

    captureSessionHandoff:
      false,

    returnPoint: null,

    previousTask: null,

    nextTask: null,

    sourceAgent: null,

    sourceSystem: null,

    memorySignals: [],

    projectMemorySignals:
      [],

    memoryAction: null,

    forgetRequested:
      false,

    forgetRequiresClarification:
      false,

    briefDetour:
      false,

    deferredTopic:
      false,

    correctionSignal:
      false,

    lastReflectionAt:
      null,

    lastReflectionType:
      null,

    preferredResponseDepth:
      null,

    preferredVisualStyle:
      null,

    preferredGuidanceStyle:
      null,

    preferredMentorRole:
      null,

    preferredCommunicationPace:
      null,

    currentTimestamp:
      null,
  });

function createTimestamp() {
  return new Date()
    .toISOString();
}

function createReflectionId() {
  const randomValue =
    Math.random()
      .toString(36)
      .slice(2, 10);

  return (
    `reflection-plan-` +
    `${Date.now()}-${randomValue}`
  );
}

function cloneValue(value) {
  if (
    value === undefined
  ) {
    return undefined;
  }

  return JSON.parse(
    JSON.stringify(value)
  );
}

function cleanString(value) {
  return typeof value ===
    "string"
    ? value.trim()
    : "";
}

function normaliseText(
  value
) {
  return cleanString(value)
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

function clampConfidence(
  value
) {
  const numericValue =
    Number(value);

  if (
    !Number.isFinite(
      numericValue
    )
  ) {
    return 0;
  }

  return Math.max(
    0,
    Math.min(
      1,
      numericValue
    )
  );
}

function createDetection({
  value,
  confidence = 0.5,
  evidence = [],
  metadata = {},
}) {
  return {
    value,

    confidence:
      clampConfidence(
        confidence
      ),

    evidence:
      uniqueValues(
        evidence
      ),

    metadata:
      cloneValue(
        metadata
      ),
  };
}

function includesAny(
  text,
  phrases = []
) {
  return phrases.some(
    (phrase) =>
      text.includes(
        phrase
      )
  );
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

function getProjectId(
  context = {}
) {
  const explicitProjectId =
    cleanString(
      context
        ?.activeProjectId
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
      cleanString(
        context.activeProject
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

function getEntryProjectIds(
  entry
) {
  return uniqueValues([
    cleanString(
      entry?.projectId
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
  ]);
}

function inferEntryScope(
  entry
) {
  const explicitScope =
    cleanString(
      entry?.scope
    ) ||
    cleanString(
      entry
        ?.metadata
        ?.scope
    );

  if (
    Object.values(
      REFLECTION_SCOPES
    ).includes(
      explicitScope
    )
  ) {
    return explicitScope;
  }

  if (
    getEntryProjectIds(
      entry
    ).length > 0 ||
    entry?.type ===
      "project-memory" ||
    entry?.type ===
      "session-handoff"
  ) {
    return (
      REFLECTION_SCOPES
        .PROJECT
    );
  }

  return (
    REFLECTION_SCOPES
      .CREATOR
  );
}

function isEntryActive(
  entry
) {
  if (!entry) {
    return false;
  }

  const status =
    cleanString(
      entry.status
    );

  const lifecycleStatus =
    cleanString(
      entry
        .lifecycleStatus
    );

  return !(
    HISTORICAL_STATUSES
      .includes(status) ||
    HISTORICAL_STATUSES
      .includes(
        lifecycleStatus
      )
  );
}

function isEntryRelevantToProject(
  entry,
  activeProjectId
) {
  if (!entry) {
    return false;
  }

  const scope =
    inferEntryScope(
      entry
    );

  if (
    scope !==
    REFLECTION_SCOPES
      .PROJECT
  ) {
    return true;
  }

  if (!activeProjectId) {
    return false;
  }

  const projectIds =
    getEntryProjectIds(
      entry
    );

  return (
    projectIds.length > 0 &&
    projectIds.includes(
      activeProjectId
    )
  );
}

function normaliseSource(
  value
) {
  const source =
    cleanString(value);

  if (
    Object.values(
      REFLECTION_SOURCES
    ).includes(source)
  ) {
    return source;
  }

  if (
    source === "project"
  ) {
    return (
      REFLECTION_SOURCES
        .PROJECT_STATE
    );
  }

  return (
    REFLECTION_SOURCES
      .UNKNOWN
  );
}

function normaliseCertainty(
  value
) {
  const certainty =
    cleanString(value);

  if (
    Object.values(
      REFLECTION_CERTAINTY
    ).includes(certainty)
  ) {
    return certainty;
  }

  return (
    REFLECTION_CERTAINTY
      .UNKNOWN
  );
}

function getReflectionAuthority(
  entry
) {
  const source =
    normaliseSource(
      entry?.source
    );

  const certainty =
    normaliseCertainty(
      entry?.certainty
    );

  if (
    source ===
      REFLECTION_SOURCES
        .CREATOR &&
    certainty ===
      REFLECTION_CERTAINTY
        .CONFIRMED
  ) {
    return (
      REFLECTION_AUTHORITY
        .CREATOR_CONFIRMED
    );
  }

  if (
    source ===
      REFLECTION_SOURCES
        .CREATOR &&
    certainty ===
      REFLECTION_CERTAINTY
        .EXPLICIT
  ) {
    return (
      REFLECTION_AUTHORITY
        .CREATOR_EXPLICIT
    );
  }

  if (
    source ===
      REFLECTION_SOURCES
        .PROJECT_STATE &&
    certainty ===
      REFLECTION_CERTAINTY
        .CONFIRMED
  ) {
    return (
      REFLECTION_AUTHORITY
        .PROJECT_CONFIRMED
    );
  }

  if (
    source ===
    REFLECTION_SOURCES
      .CREATOR
  ) {
    return (
      REFLECTION_AUTHORITY
        .CREATOR_OBSERVED
    );
  }

  if (
    source ===
    REFLECTION_SOURCES
      .SPECIALIST_AGENT
  ) {
    return (
      REFLECTION_AUTHORITY
        .SPECIALIST_AGENT
    );
  }

  if (
    source ===
    REFLECTION_SOURCES
      .MENTOR
  ) {
    return (
      REFLECTION_AUTHORITY
        .MENTOR_OBSERVED
    );
  }

  if (
    source ===
    REFLECTION_SOURCES
      .INFERRED
  ) {
    return (
      REFLECTION_AUTHORITY
        .INFERRED
    );
  }

  return (
    REFLECTION_AUTHORITY
      .UNKNOWN
  );
}

function getPlannerMentorMove(
  conversationPlan,
  context
) {
  return (
    conversationPlan
      ?.conversation
      ?.mentorMove ||
    context?.mentorMove ||
    null
  );
}

function getPlannerMode(
  conversationPlan,
  context
) {
  return (
    conversationPlan
      ?.conversation
      ?.mode ||
    context
      ?.conversationMode ||
    null
  );
}

function getPlannerPrimaryAction(
  conversationPlan
) {
  return (
    conversationPlan
      ?.conversation
      ?.primaryAction ||
    null
  );
}

function isExecutionMove(
  conversationPlan,
  context
) {
  const mentorMove =
    getPlannerMentorMove(
      conversationPlan,
      context
    );

  return (
    EXECUTION_MENTOR_MOVES
      .includes(
        mentorMove
      )
  );
}

function isPauseMove(
  conversationPlan,
  context
) {
  return (
    getPlannerMentorMove(
      conversationPlan,
      context
    ) === "pause" ||
    getPlannerMode(
      conversationPlan,
      context
    ) === "pausing" ||
    Boolean(
      context
        ?.creatorExplicitlyAskedToPause
    )
  );
}

function isStopRequested(
  context
) {
  return Boolean(
    context
      ?.creatorExplicitlyAskedToStop
  );
}

function isForgetPriorityActive(
  conversationPlan,
  context
) {
  const primaryAction =
    cleanString(
      context
        ?.memoryAction
    ) ||
    cleanString(
      getPlannerPrimaryAction(
        conversationPlan
      )
    );

  return Boolean(
    context
      ?.forgetRequested ||
    context
      ?.forgetRequiresClarification ||
    MEMORY_PRIORITY_ACTIONS
      .includes(
        primaryAction
      )
  );
}

function hasSpecialistSignals(
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

function detectCreatorCompletion({
  message,
  context,
  conversationPlan,
}) {
  const text =
    normaliseText(
      message
    );

  const unfinishedEndings = [
    "but",
    "and",
    "because",
    "although",
    "then",
    "so",
    "or",
    "i think",
    "maybe",
    "perhaps",
    "wait",
    "hold on",
    "one second",
    "let me think",
  ];

  const thinkingPhrases = [
    "it's on the tip of my tongue",
    "its on the tip of my tongue",
    "i just had it",
    "i can picture it",
    "i nearly have it",
    "i've nearly got it",
    "ive nearly got it",
    "wait",
    "hold on",
    "let me think",
    "no...",
    "actually...",
    "maybe...",
    "i'm trying to remember",
    "im trying to remember",
  ];

  const explicitCompletionPhrases = [
    "that's it",
    "thats it",
    "that's all",
    "thats all",
    "i'm finished",
    "im finished",
    "that's what i mean",
    "thats what i mean",
    "what do you think",
    "your turn",
    "you lead",
    "please continue",
    "next step",
    "next file",
    "next task",
    "go ahead",
    "fire away",
    "do it",
    "ready",
  ];

  if (
    context
      ?.creatorAppearsFinished ===
      false
  ) {
    return createDetection({
      value: false,

      confidence: 0.96,

      evidence: [
        "workspace indicates creator has not finished",
      ],
    });
  }

  if (
    isPauseMove(
      conversationPlan,
      context
    ) ||
    isStopRequested(
      context
    )
  ) {
    return createDetection({
      value: true,

      confidence: 0.98,

      evidence: [
        "creator issued an explicit session-control instruction",
      ],
    });
  }

  if (
    isExecutionMove(
      conversationPlan,
      context
    )
  ) {
    return createDetection({
      value: true,

      confidence: 0.95,

      evidence: [
        `conversation planner selected ${getPlannerMentorMove(
          conversationPlan,
          context
        )}`,
      ],
    });
  }

  if (
    includesAny(
      text,
      explicitCompletionPhrases
    )
  ) {
    return createDetection({
      value: true,

      confidence: 0.9,

      evidence:
        explicitCompletionPhrases
          .filter(
            (phrase) =>
              text.includes(
                phrase
              )
          ),
    });
  }

  if (
    includesAny(
      text,
      thinkingPhrases
    )
  ) {
    return createDetection({
      value: false,

      confidence: 0.86,

      evidence:
        thinkingPhrases
          .filter(
            (phrase) =>
              text.includes(
                phrase
              )
          ),
    });
  }

  const finalWord =
    text
      .split(" ")
      .filter(Boolean)
      .slice(-1)[0];

  if (
    text.endsWith("...") ||
    unfinishedEndings
      .includes(
        finalWord
      )
  ) {
    return createDetection({
      value: false,

      confidence: 0.7,

      evidence: [
        "unfinished language",
      ],
    });
  }

  return createDetection({
    value: true,

    confidence: 0.58,

    evidence: [],
  });
}

function detectThinkingMode({
  message,
  context,
  conversationPlan,
}) {
  const text =
    normaliseText(
      message
    );

  const mentorMove =
    getPlannerMentorMove(
      conversationPlan,
      context
    );

  const plannerMode =
    getPlannerMode(
      conversationPlan,
      context
    );

  if (
    context
      ?.thinkingMode &&
    Object.values(
      CREATOR_THINKING_MODES
    ).includes(
      context.thinkingMode
    )
  ) {
    return createDetection({
      value:
        context.thinkingMode,

      confidence: 0.9,

      evidence: [
        "current orchestration context supplied thinking mode",
      ],
    });
  }

  if (
    isPauseMove(
      conversationPlan,
      context
    ) ||
    isStopRequested(
      context
    )
  ) {
    return createDetection({
      value:
        CREATOR_THINKING_MODES
          .PAUSING,

      confidence: 0.98,

      evidence: [
        "creator is pausing or ending the current session",
      ],
    });
  }

  if (
    plannerMode ===
      "returning" ||
    plannerMode ===
      "project-continuity"
  ) {
    return createDetection({
      value:
        CREATOR_THINKING_MODES
          .RETURNING,

      confidence: 0.92,

      evidence: [
        `conversation planner selected ${plannerMode}`,
      ],
    });
  }

  const buildPhrases = [
    "next file",
    "next task",
    "commit",
    "let's build",
    "lets build",
    "fire away",
    "give me the code",
    "full replacement",
    "continue",
    "done",
    "ready",
    "go ahead",
    "do it",
    "warp 20",
    "warp 40",
  ];

  const explorationPhrases = [
    "imagine",
    "what if",
    "could we",
    "i wonder",
    "maybe",
    "perhaps",
    "let's explore",
    "lets explore",
    "what about",
  ];

  const learningPhrases = [
    "why",
    "how does",
    "how do",
    "explain",
    "teach me",
    "help me understand",
    "what does that mean",
  ];

  const reflectionPhrases = [
    "i feel",
    "i felt",
    "remember",
    "when i was",
    "what have you noticed",
    "tell me about myself",
    "that reminds me",
    "i realise",
    "i realized",
  ];

  const recoveryPhrases = [
    "i hate it",
    "throw it away",
    "not good enough",
    "i've lost it",
    "ive lost it",
    "i can't remember",
    "i cant remember",
    "it's gone",
    "its gone",
    "give up",
  ];

  const flowPhrases = [
    "keep going",
    "carry on",
    "don't stop",
    "dont stop",
    "we're running",
    "were running",
    "i'm in the flow",
    "im in the flow",
    "let's go",
    "lets go",
  ];

  const incubationPhrases = [
    "let me think",
    "give me a moment",
    "it's on the tip of my tongue",
    "its on the tip of my tongue",
    "i nearly have it",
    "no...",
    "actually...",
    "wait...",
  ];

  if (
    EXECUTION_MENTOR_MOVES
      .includes(
        mentorMove
      )
  ) {
    return createDetection({
      value:
        CREATOR_THINKING_MODES
          .BUILD,

      confidence: 0.94,

      evidence: [
        `conversation planner selected ${mentorMove}`,
      ],
    });
  }

  if (
    context
      ?.creatorExplicitlyAskedForGuidance ||
    context
      ?.creatorExplicitlyAskedForNextStep
  ) {
    return createDetection({
      value:
        CREATOR_THINKING_MODES
          .DECISION,

      confidence: 0.84,

      evidence: [
        "creator explicitly requested guidance or the next step",
      ],
    });
  }

  if (
    includesAny(
      text,
      incubationPhrases
    )
  ) {
    return createDetection({
      value:
        CREATOR_THINKING_MODES
          .INCUBATION,

      confidence: 0.89,

      evidence:
        incubationPhrases
          .filter(
            (phrase) =>
              text.includes(
                phrase
              )
          ),
    });
  }

  if (
    includesAny(
      text,
      recoveryPhrases
    )
  ) {
    return createDetection({
      value:
        CREATOR_THINKING_MODES
          .RECOVERY,

      confidence: 0.84,

      evidence:
        recoveryPhrases
          .filter(
            (phrase) =>
              text.includes(
                phrase
              )
          ),
    });
  }

  if (
    includesAny(
      text,
      buildPhrases
    )
  ) {
    return createDetection({
      value:
        CREATOR_THINKING_MODES
          .BUILD,

      confidence: 0.86,

      evidence:
        buildPhrases
          .filter(
            (phrase) =>
              text.includes(
                phrase
              )
          ),
    });
  }

  if (
    includesAny(
      text,
      flowPhrases
    ) ||
    context
      ?.creatorEnergy ===
      "high" ||
    context
      ?.momentum ===
      "strong"
  ) {
    return createDetection({
      value:
        CREATOR_THINKING_MODES
          .FLOW,

      confidence: 0.82,

      evidence:
        uniqueValues([
          ...flowPhrases
            .filter(
              (phrase) =>
                text.includes(
                  phrase
                )
            ),

          context
            ?.creatorEnergy ===
            "high"
            ? "high creator energy"
            : null,

          context
            ?.momentum ===
            "strong"
            ? "strong creator momentum"
            : null,
        ]),
    });
  }

  if (
    includesAny(
      text,
      learningPhrases
    ) ||
    plannerMode ===
      "learning"
  ) {
    return createDetection({
      value:
        CREATOR_THINKING_MODES
          .LEARNING,

      confidence: 0.78,

      evidence:
        uniqueValues([
          ...learningPhrases
            .filter(
              (phrase) =>
                text.includes(
                  phrase
                )
            ),

          plannerMode ===
            "learning"
            ? "conversation planner selected learning mode"
            : null,
        ]),
    });
  }

  if (
    includesAny(
      text,
      reflectionPhrases
    ) ||
    plannerMode ===
      "reflection"
  ) {
    return createDetection({
      value:
        CREATOR_THINKING_MODES
          .REFLECTION,

      confidence: 0.78,

      evidence:
        uniqueValues([
          ...reflectionPhrases
            .filter(
              (phrase) =>
                text.includes(
                  phrase
                )
            ),

          plannerMode ===
            "reflection"
            ? "conversation planner selected reflection mode"
            : null,
        ]),
    });
  }

  if (
    includesAny(
      text,
      explorationPhrases
    ) ||
    context
      ?.recentQuestionsFromCreator >=
      2
  ) {
    return createDetection({
      value:
        CREATOR_THINKING_MODES
          .EXPLORATION,

      confidence: 0.76,

      evidence:
        uniqueValues([
          ...explorationPhrases
            .filter(
              (phrase) =>
                text.includes(
                  phrase
                )
            ),

          context
            ?.recentQuestionsFromCreator >=
            2
            ? "multiple recent creator questions"
            : null,
        ]),
    });
  }

  return createDetection({
    value:
      CREATOR_THINKING_MODES
        .UNKNOWN,

    confidence: 0.42,

    evidence: [],
  });
}

function detectGuidanceReceptivity({
  message,
  context,
  thinkingMode,
  conversationPlan,
}) {
  const text =
    normaliseText(
      message
    );

  const mentorMove =
    getPlannerMentorMove(
      conversationPlan,
      context
    );

  const openPhrases = [
    "you lead",
    "please guide me",
    "what do you recommend",
    "what should i do",
    "show me",
    "teach me",
    "next step",
    "what's next",
    "whats next",
    "help me",
  ];

  const lowPhrases = [
    "let me finish",
    "one second",
    "hold on",
    "i've got this",
    "ive got this",
    "don't interrupt",
    "dont interrupt",
    "let me think",
  ];

  if (
    context
      ?.guidanceWindow ===
      "closed-for-now"
  ) {
    return createDetection({
      value:
        GUIDANCE_RECEPTIVITY
          .CLOSED_FOR_NOW,

      confidence: 0.95,

      evidence: [
        "current guidance window is closed",
      ],
    });
  }

  if (
    context
      ?.creatorExplicitlyAskedForGuidance ||
    context
      ?.creatorExplicitlyAskedForHelp ||
    context
      ?.requestedHelp ||
    includesAny(
      text,
      openPhrases
    )
  ) {
    return createDetection({
      value:
        GUIDANCE_RECEPTIVITY
          .OPEN,

      confidence: 0.92,

      evidence:
        uniqueValues([
          ...openPhrases
            .filter(
              (phrase) =>
                text.includes(
                  phrase
                )
            ),

          context
            ?.requestedHelp
            ? "creator requested help"
            : null,

          context
            ?.creatorExplicitlyAskedForGuidance
            ? "creator explicitly requested guidance"
            : null,
        ]),
    });
  }

  if (
    isPauseMove(
      conversationPlan,
      context
    ) ||
    isStopRequested(
      context
    ) ||
    includesAny(
      text,
      lowPhrases
    )
  ) {
    return createDetection({
      value:
        GUIDANCE_RECEPTIVITY
          .CLOSED_FOR_NOW,

      confidence: 0.92,

      evidence:
        uniqueValues([
          ...lowPhrases
            .filter(
              (phrase) =>
                text.includes(
                  phrase
                )
            ),

          isPauseMove(
            conversationPlan,
            context
          )
            ? "creator is pausing"
            : null,

          isStopRequested(
            context
          )
            ? "creator requested stop"
            : null,
        ]),
    });
  }

  if (
    EXECUTION_MENTOR_MOVES
      .includes(
        mentorMove
      )
  ) {
    return createDetection({
      value:
        GUIDANCE_RECEPTIVITY
          .OPEN,

      confidence: 0.9,

      evidence: [
        `creator is ready for ${mentorMove}`,
      ],

      metadata: {
        executionGuidanceOnly:
          true,
      },
    });
  }

  if (
    thinkingMode?.value ===
      CREATOR_THINKING_MODES
        .FLOW ||
    thinkingMode?.value ===
      CREATOR_THINKING_MODES
        .INCUBATION
  ) {
    return createDetection({
      value:
        GUIDANCE_RECEPTIVITY
          .LOW,

      confidence: 0.78,

      evidence: [
        `creator appears to be in ${thinkingMode.value} mode`,
      ],
    });
  }

  if (
    thinkingMode?.value ===
    CREATOR_THINKING_MODES
      .BUILD
  ) {
    return createDetection({
      value:
        GUIDANCE_RECEPTIVITY
          .PARTIALLY_OPEN,

      confidence: 0.8,

      evidence: [
        "creator appears ready for practical action",
      ],
    });
  }

  if (
    [
      CREATOR_THINKING_MODES
        .LEARNING,

      CREATOR_THINKING_MODES
        .EXPLORATION,

      CREATOR_THINKING_MODES
        .REFLECTION,

      CREATOR_THINKING_MODES
        .DECISION,

      CREATOR_THINKING_MODES
        .RETURNING,
    ].includes(
      thinkingMode?.value
    )
  ) {
    return createDetection({
      value:
        GUIDANCE_RECEPTIVITY
          .PARTIALLY_OPEN,

      confidence: 0.72,

      evidence: [
        `creator appears to be in ${thinkingMode.value} mode`,
      ],
    });
  }

  return createDetection({
    value:
      GUIDANCE_RECEPTIVITY
        .UNKNOWN,

    confidence: 0.44,

    evidence: [],
  });
}

function detectBriefDetour({
  message,
  context,
}) {
  if (
    context
      ?.briefDetour ===
      true
  ) {
    return createDetection({
      value: true,

      confidence: 0.96,

      evidence: [
        "brief detour supplied by orchestration context",
      ],
    });
  }

  const text =
    normaliseText(
      message
    );

  const phrases = [
    "one quick thing",
    "just quickly",
    "before we continue",
    "one last thing",
    "i don't want to spend long",
    "i dont want to spend long",
    "not to go into it",
    "without going into it",
    "just wanted to say",
    "we don't need to discuss it",
    "we dont need to discuss it",
  ];

  const matches =
    phrases.filter(
      (phrase) =>
        text.includes(
          phrase
        )
    );

  return createDetection({
    value:
      matches.length > 0,

    confidence:
      matches.length > 0
        ? 0.88
        : 0.3,

    evidence:
      matches,
  });
}

function detectCorrection({
  message,
  context,
}) {
  if (
    context
      ?.correctionSignal ===
      true
  ) {
    return createDetection({
      value: true,

      confidence: 0.97,

      evidence: [
        "correction signal supplied by orchestration context",
      ],
    });
  }

  const text =
    normaliseText(
      message
    );

  const phrases = [
    "actually change that",
    "change that",
    "that's no longer",
    "thats no longer",
    "not anymore",
    "instead we're",
    "instead were",
    "replace that with",
    "we changed our mind",
    "i changed my mind",
    "correction",
  ];

  const matches =
    phrases.filter(
      (phrase) =>
        text.includes(
          phrase
        )
    );

  return createDetection({
    value:
      matches.length > 0,

    confidence:
      matches.length > 0
        ? 0.92
        : 0.28,

    evidence:
      matches,
  });
}

function detectHoldSpaceNeed({
  message,
  context,
  creatorCompletion,
  thinkingMode,
  guidanceReceptivity,
  conversationPlan,
  briefDetour,
}) {
  const text =
    normaliseText(
      message
    );

  if (
    isForgetPriorityActive(
      conversationPlan,
      context
    )
  ) {
    return createDetection({
      value: false,

      confidence: 0.98,

      evidence: [
        SILENCE_REASONS
          .MEMORY_ACTION_HAS_PRIORITY,
      ],
    });
  }

  if (
    isPauseMove(
      conversationPlan,
      context
    ) ||
    isStopRequested(
      context
    )
  ) {
    return createDetection({
      value: false,

      confidence: 0.98,

      evidence: [
        SILENCE_REASONS
          .CREATOR_IS_PAUSING,
      ],
    });
  }

  if (
    isExecutionMove(
      conversationPlan,
      context
    )
  ) {
    return createDetection({
      value: false,

      confidence: 0.96,

      evidence: [
        SILENCE_REASONS
          .EXECUTION_SHOULD_CONTINUE,
      ],
    });
  }

  if (
    briefDetour.value
  ) {
    return createDetection({
      value: false,

      confidence: 0.9,

      evidence: [
        "brief detour should be acknowledged and closed rather than held open",
      ],
    });
  }

  const shortThinkingResponses = [
    "no",
    "no...",
    "maybe",
    "maybe...",
    "wait",
    "hold on",
    "hmm",
    "erm",
    "um",
    "actually",
    "actually...",
  ];

  const creatorMayContinue =
    creatorCompletion.value ===
      false ||
    context
      ?.consecutiveCreatorMessages >=
      2 ||
    includesAny(
      text,
      shortThinkingResponses
    );

  const flowNeedsProtection =
    thinkingMode.value ===
      CREATOR_THINKING_MODES
        .FLOW ||
    thinkingMode.value ===
      CREATOR_THINKING_MODES
        .INCUBATION;

  const guidanceIsClosed =
    guidanceReceptivity.value ===
      GUIDANCE_RECEPTIVITY
        .CLOSED_FOR_NOW;

  const shouldHoldSpace =
    creatorMayContinue ||
    flowNeedsProtection ||
    guidanceIsClosed;

  const reasons = [];

  if (
    creatorCompletion.value ===
    false
  ) {
    reasons.push(
      SILENCE_REASONS
        .CREATOR_HAS_NOT_FINISHED
    );
  }

  if (
    thinkingMode.value ===
    CREATOR_THINKING_MODES
      .INCUBATION
  ) {
    reasons.push(
      SILENCE_REASONS
        .IDEA_MAY_BE_EMERGING
    );
  }

  if (
    thinkingMode.value ===
    CREATOR_THINKING_MODES
      .FLOW
  ) {
    reasons.push(
      SILENCE_REASONS
        .FLOW_SHOULD_NOT_BE_INTERRUPTED
    );
  }

  if (
    guidanceIsClosed
  ) {
    reasons.push(
      SILENCE_REASONS
        .PRESSURE_SHOULD_BE_RELEASED
    );
  }

  if (
    includesAny(
      text,
      shortThinkingResponses
    )
  ) {
    reasons.push(
      SILENCE_REASONS
        .CREATOR_MAY_BE_THINKING
    );
  }

  return createDetection({
    value:
      shouldHoldSpace,

    confidence:
      shouldHoldSpace
        ? 0.84
        : 0.46,

    evidence:
      reasons,
  });
}

function detectContextRestorationNeed({
  message,
  context,
  conversationPlan,
}) {
  const text =
    normaliseText(
      message
    );

  const plannerMode =
    getPlannerMode(
      conversationPlan,
      context
    );

  if (
    plannerMode ===
      "returning" ||
    plannerMode ===
      "project-continuity"
  ) {
    return createDetection({
      value: true,

      confidence: 0.96,

      evidence: [
        `conversation planner selected ${plannerMode}`,
      ],

      metadata: {
        projectContinuation:
          true,
      },
    });
  }

  const lostThoughtPhrases = [
    "i've lost it",
    "ive lost it",
    "it's gone",
    "its gone",
    "i can't remember",
    "i cant remember",
    "i forgot",
    "what was i saying",
    "where was i",
    "i just had it",
    "it was on the tip of my tongue",
  ];

  const hasContext =
    asArray(
      context
        ?.recentCreatorMessages
    ).length > 0 ||
    asArray(
      context
        ?.recentConversations
    ).length > 0 ||
    asArray(
      context
        ?.existingProjectMemories
    ).length > 0 ||
    Boolean(
      context?.activeIdea
    ) ||
    Boolean(
      context
        ?.activeProject
    ) ||
    Boolean(
      context
        ?.sessionHandoff
    ) ||
    Boolean(
      context
        ?.returnPoint
    );

  const need =
    includesAny(
      text,
      lostThoughtPhrases
    ) &&
    hasContext;

  return createDetection({
    value: need,

    confidence:
      need
        ? 0.9
        : 0.42,

    evidence:
      lostThoughtPhrases
        .filter(
          (phrase) =>
            text.includes(
              phrase
            )
        ),
  });
}

function detectPressureReleaseNeed({
  message,
  thinkingMode,
  contextRestorationNeeded,
  conversationPlan,
  context,
}) {
  if (
    isExecutionMove(
      conversationPlan,
      context
    ) ||
    isPauseMove(
      conversationPlan,
      context
    ) ||
    isForgetPriorityActive(
      conversationPlan,
      context
    )
  ) {
    return createDetection({
      value: false,

      confidence: 0.94,

      evidence: [],
    });
  }

  const text =
    normaliseText(
      message
    );

  const pressurePhrases = [
    "i still can't remember",
    "i still cant remember",
    "it's not coming back",
    "its not coming back",
    "no it's gone",
    "no its gone",
    "forget it",
    "never mind",
    "i'm forcing it",
    "im forcing it",
  ];

  const need =
    includesAny(
      text,
      pressurePhrases
    ) ||
    (
      thinkingMode.value ===
        CREATOR_THINKING_MODES
          .RECOVERY &&
      contextRestorationNeeded
        .value ===
        false
    );

  return createDetection({
    value: need,

    confidence:
      need
        ? 0.8
        : 0.4,

    evidence:
      pressurePhrases
        .filter(
          (phrase) =>
            text.includes(
              phrase
            )
        ),
  });
}

function collectReflectionCandidates(
  context
) {
  const observations =
    asArray(
      context
        ?.existingObservations
    ).length > 0
      ? asArray(
          context
            .existingObservations
        )
      : asArray(
          context
            ?.observations
        );

  const patterns =
    asArray(
      context
        ?.existingPatterns
    ).length > 0
      ? asArray(
          context
            .existingPatterns
        )
      : asArray(
          context
            ?.knownPatterns
        );

  const projectMemories =
    asArray(
      context
        ?.existingProjectMemories
    );

  return [
    ...observations.map(
      (item) => ({
        ...cloneValue(item),

        reflectionSourceType:
          "observation",
      })
    ),

    ...patterns.map(
      (pattern) => ({
        ...cloneValue(pattern),

        text:
          pattern.text ||
          pattern.description ||
          pattern
            .positiveReflection ||
          pattern.name,

        category:
          pattern.category ||
          "pattern",

        permissionToReflect:
          pattern
            .permissionToReflect !==
          false,

        reflectionSourceType:
          "pattern",
      })
    ),

    ...projectMemories.map(
      (memory) => ({
        ...cloneValue(memory),

        text:
          memory.content ||
          (
            typeof memory
              .value ===
              "string"
              ? memory.value
              : ""
          ) ||
          memory.title,

        permissionToReflect:
          memory
            .permissionToReflect !==
          false,

        reflectionSourceType:
          "project-memory",
      })
    ),
  ];
}

function scoreObservation(
  observation,
  context,
  {
    correctionSignal =
      false,
  } = {}
) {
  if (
    !observation ||
    !isEntryActive(
      observation
    )
  ) {
    return -1;
  }

  const activeProjectId =
    getProjectId(
      context
    );

  if (
    !isEntryRelevantToProject(
      observation,
      activeProjectId
    )
  ) {
    return -1;
  }

  const confidence =
    clampConfidence(
      observation
        .confidence ??
      0.5
    );

  const evidenceCount =
    asArray(
      observation
        .evidence
    ).length;

  const authority =
    getReflectionAuthority(
      observation
    );

  const authorityScore =
    authority / 100;

  const permissionBonus =
    observation
      .permissionToReflect ===
      true
      ? 0.18
      : 0;

  const explicitPermissionPenalty =
    observation
      .permissionToReflect ===
      false
      ? 0.35
      : 0;

  const confirmedBonus =
    [
      "confirmed",
      "established",
    ].includes(
      observation.status
    )
      ? 0.18
      : observation.status ===
          "repeated" ||
        observation.status ===
          "reinforced"
        ? 0.1
        : 0;

  const repetitionPenalty =
    observation
      .lastReflectedAt &&
    Number(
      observation
        .reflectionCount
    ) > 1
      ? 0.2
      : 0;

  const projectBonus =
    activeProjectId &&
    getEntryProjectIds(
      observation
    ).includes(
      activeProjectId
    )
      ? 0.16
      : 0;

  const specialistPenalty =
    normaliseSource(
      observation.source
    ) ===
      REFLECTION_SOURCES
        .SPECIALIST_AGENT
      ? 0.08
      : 0;

  const inferencePenalty =
    normaliseCertainty(
      observation.certainty
    ) ===
      REFLECTION_CERTAINTY
        .INFERRED
      ? 0.1
      : 0;

  const correctionPenalty =
    correctionSignal &&
    authority <
      REFLECTION_AUTHORITY
        .CREATOR_EXPLICIT
      ? 0.3
      : 0;

  return (
    confidence *
      0.45 +
    authorityScore *
      0.25 +
    Math.min(
      evidenceCount *
        0.04,
      0.16
    ) +
    permissionBonus +
    confirmedBonus +
    projectBonus -
    explicitPermissionPenalty -
    repetitionPenalty -
    specialistPenalty -
    inferencePenalty -
    correctionPenalty
  );
}

function selectReflectionCandidate(
  context,
  {
    correctionSignal =
      false,

    allowProjectMemory =
      true,
  } = {}
) {
  const candidates =
    collectReflectionCandidates(
      context
    )
      .filter(
        (candidate) =>
          allowProjectMemory ||
          candidate
            .reflectionSourceType !==
            "project-memory"
      );

  const ranked =
    candidates
      .map(
        (candidate) => ({
          candidate,

          score:
            scoreObservation(
              candidate,
              context,
              {
                correctionSignal,
              }
            ),
        })
      )
      .filter(
        (item) =>
          item.score >=
          0.58
      )
      .sort(
        (a, b) =>
          b.score -
          a.score
      );

  if (
    ranked.length === 0
  ) {
    return null;
  }

  return cloneValue(
    ranked[0].candidate
  );
}

function chooseReflectionType({
  conversationPlan,
  thinkingMode,
  candidate,
  contextRestorationNeeded,
  pressureReleaseNeeded,
  context,
}) {
  if (
    contextRestorationNeeded
      .value
  ) {
    if (
      context
        ?.sessionHandoff
    ) {
      return (
        REFLECTION_TYPES
          .SESSION_HANDOFF
      );
    }

    if (
      getProjectId(
        context
      )
    ) {
      return (
        REFLECTION_TYPES
          .PROJECT_CONTEXT
      );
    }

    return (
      REFLECTION_TYPES
        .CONTEXT
    );
  }

  if (
    pressureReleaseNeeded
      .value
  ) {
    return (
      REFLECTION_TYPES
        .MOMENTUM
    );
  }

  const category =
    cleanString(
      candidate?.category
    );

  if (
    category ===
    "strength"
  ) {
    return (
      REFLECTION_TYPES
        .STRENGTH
    );
  }

  if (
    category ===
      "progress" ||
    category ===
      "growth-signal" ||
    getPlannerMode(
      conversationPlan,
      context
    ) ===
      "celebration"
  ) {
    return (
      REFLECTION_TYPES
        .PROGRESS
    );
  }

  if (
    category ===
    "resilience"
  ) {
    return (
      REFLECTION_TYPES
        .RESILIENCE
    );
  }

  if (
    category ===
      "emotion" ||
    thinkingMode.value ===
      CREATOR_THINKING_MODES
        .REFLECTION
  ) {
    return (
      REFLECTION_TYPES
        .EMOTION
    );
  }

  if (
    category ===
    "intention"
  ) {
    return (
      REFLECTION_TYPES
        .INTENTION
    );
  }

  if (
    category ===
      "creative-identity"
  ) {
    return (
      REFLECTION_TYPES
        .CREATIVE_IDENTITY
    );
  }

  if (
    candidate
      ?.reflectionSourceType ===
      "project-memory"
  ) {
    return (
      REFLECTION_TYPES
        .PROJECT_TRUTH
    );
  }

  if (candidate) {
    return (
      REFLECTION_TYPES
        .PATTERN
    );
  }

  return (
    REFLECTION_TYPES
      .UNDERSTANDING
  );
}

function chooseResponseDepth({
  thinkingMode,
  guidanceReceptivity,
  context,
  conversationPlan,
  creatorCompletion,
  briefDetour,
}) {
  /**
   * Immediate behavioural requirements outrank
   * remembered response preferences.
   */
  if (
    creatorCompletion.value ===
      false &&
    (
      thinkingMode.value ===
        CREATOR_THINKING_MODES
          .INCUBATION ||
      guidanceReceptivity
        .value ===
        GUIDANCE_RECEPTIVITY
          .CLOSED_FOR_NOW
    )
  ) {
    return (
      RESPONSE_DEPTH.SILENT
    );
  }

  if (
    isPauseMove(
      conversationPlan,
      context
    ) ||
    isStopRequested(
      context
    ) ||
    isForgetPriorityActive(
      conversationPlan,
      context
    ) ||
    briefDetour.value
  ) {
    return (
      RESPONSE_DEPTH
        .MINIMAL
    );
  }

  if (
    isExecutionMove(
      conversationPlan,
      context
    )
  ) {
    return (
      RESPONSE_DEPTH
        .MINIMAL
    );
  }

  if (
    [
      CREATOR_THINKING_MODES
        .BUILD,

      CREATOR_THINKING_MODES
        .FLOW,

      CREATOR_THINKING_MODES
        .INCUBATION,
    ].includes(
      thinkingMode.value
    )
  ) {
    return (
      RESPONSE_DEPTH
        .MINIMAL
    );
  }

  if (
    context
      ?.informationSaturation ===
      "high" ||
    context
      ?.informationSaturation ===
      "overloaded" ||
    guidanceReceptivity
      .value ===
      GUIDANCE_RECEPTIVITY
        .LOW
  ) {
    return (
      RESPONSE_DEPTH.SHORT
    );
  }

  const preferredDepth =
    cleanString(
      context
        ?.preferredResponseDepth
    );

  if (
    Object.values(
      RESPONSE_DEPTH
    ).includes(
      preferredDepth
    )
  ) {
    return preferredDepth;
  }

  if (
    [
      CREATOR_THINKING_MODES
        .EXPLORATION,

      CREATOR_THINKING_MODES
        .LEARNING,

      CREATOR_THINKING_MODES
        .REFLECTION,
    ].includes(
      thinkingMode.value
    )
  ) {
    return (
      RESPONSE_DEPTH.DEEP
    );
  }

  return (
    RESPONSE_DEPTH.MEDIUM
  );
}

function chooseDecision({
  holdSpaceNeeded,
  contextRestorationNeeded,
  pressureReleaseNeeded,
  creatorCompletion,
  thinkingMode,
  candidate,
  conversationPlan,
  context,
  briefDetour,
}) {
  if (
    isForgetPriorityActive(
      conversationPlan,
      context
    )
  ) {
    return (
      REFLECTION_DECISIONS
        .YIELD_TO_MEMORY_ACTION
    );
  }

  if (
    isStopRequested(
      context
    )
  ) {
    return (
      REFLECTION_DECISIONS
        .MOVE_FORWARD
    );
  }

  if (
    isPauseMove(
      conversationPlan,
      context
    )
  ) {
    return (
      REFLECTION_DECISIONS
        .PRESERVE_HANDOFF
    );
  }

  if (
    isExecutionMove(
      conversationPlan,
      context
    )
  ) {
    return (
      REFLECTION_DECISIONS
        .YIELD_TO_EXECUTION
    );
  }

  if (
    briefDetour.value
  ) {
    return (
      REFLECTION_DECISIONS
        .ACKNOWLEDGE_DETOUR
    );
  }

  if (
    contextRestorationNeeded
      .value
  ) {
    return (
      REFLECTION_DECISIONS
        .RESTORE_CONTEXT
    );
  }

  if (
    pressureReleaseNeeded
      .value
  ) {
    return (
      REFLECTION_DECISIONS
        .RELEASE_PRESSURE
    );
  }

  if (
    creatorCompletion.value ===
      false &&
    thinkingMode.value ===
      CREATOR_THINKING_MODES
        .INCUBATION
  ) {
    return (
      REFLECTION_DECISIONS
        .STAY_SILENT
    );
  }

  if (
    holdSpaceNeeded.value
  ) {
    return (
      REFLECTION_DECISIONS
        .HOLD_SPACE
    );
  }

  if (
    creatorCompletion.value ===
      false
  ) {
    return (
      REFLECTION_DECISIONS
        .STAY_SILENT
    );
  }

  if (
    getPlannerMode(
      conversationPlan,
      context
    ) ===
      "celebration"
  ) {
    return (
      REFLECTION_DECISIONS
        .CELEBRATE_GROWTH
    );
  }

  if (
    [
      CREATOR_THINKING_MODES
        .BUILD,

      CREATOR_THINKING_MODES
        .FLOW,

      CREATOR_THINKING_MODES
        .RETURNING,
    ].includes(
      thinkingMode.value
    )
  ) {
    return (
      REFLECTION_DECISIONS
        .MOVE_FORWARD
    );
  }

  if (candidate) {
    return (
      REFLECTION_DECISIONS
        .REFLECT
    );
  }

  if (
    thinkingMode.value ===
    CREATOR_THINKING_MODES
      .RECOVERY
  ) {
    return (
      REFLECTION_DECISIONS
        .ENCOURAGE
    );
  }

  if (
    [
      CREATOR_THINKING_MODES
        .EXPLORATION,

      CREATOR_THINKING_MODES
        .REFLECTION,
    ].includes(
      thinkingMode.value
    )
  ) {
    return (
      REFLECTION_DECISIONS
        .ECHO
    );
  }

  return (
    REFLECTION_DECISIONS.NONE
  );
}

function chooseTiming({
  decision,
  thinkingMode,
  context,
  conversationPlan,
}) {
  if (
    [
      REFLECTION_DECISIONS
        .YIELD_TO_EXECUTION,

      REFLECTION_DECISIONS
        .YIELD_TO_MEMORY_ACTION,

      REFLECTION_DECISIONS
        .MOVE_FORWARD,

      REFLECTION_DECISIONS
        .PRESERVE_HANDOFF,

      REFLECTION_DECISIONS
        .ACKNOWLEDGE_DETOUR,
    ].includes(
      decision
    ) ||
    isExecutionMove(
      conversationPlan,
      context
    )
  ) {
    return {
      responseDelayMs: 0,

      silenceWindowMs: 0,

      allowCreatorToContinue:
        false,

      canCancelResponseIfCreatorContinues:
        true,
    };
  }

  if (
    decision ===
    REFLECTION_DECISIONS
      .STAY_SILENT
  ) {
    return {
      responseDelayMs: 3000,

      silenceWindowMs: 6000,

      allowCreatorToContinue:
        true,

      canCancelResponseIfCreatorContinues:
        true,
    };
  }

  if (
    decision ===
    REFLECTION_DECISIONS
      .HOLD_SPACE
  ) {
    return {
      responseDelayMs: 2000,

      silenceWindowMs: 4500,

      allowCreatorToContinue:
        true,

      canCancelResponseIfCreatorContinues:
        true,
    };
  }

  if (
    thinkingMode.value ===
    CREATOR_THINKING_MODES
      .INCUBATION
  ) {
    return {
      responseDelayMs: 3000,

      silenceWindowMs: 6000,

      allowCreatorToContinue:
        true,

      canCancelResponseIfCreatorContinues:
        true,
    };
  }

  if (
    context
      ?.creatorEnergy ===
      "high" ||
    context
      ?.momentum ===
      "strong"
  ) {
    return {
      responseDelayMs: 250,

      silenceWindowMs: 0,

      allowCreatorToContinue:
        false,

      canCancelResponseIfCreatorContinues:
        true,
    };
  }

  return {
    responseDelayMs: 600,

    silenceWindowMs: 0,

    allowCreatorToContinue:
      false,

    canCancelResponseIfCreatorContinues:
      true,
  };
}

function createContextLandmarks(
  context
) {
  const creatorMessages =
    asArray(
      context
        ?.recentCreatorMessages
    );

  const conversations =
    asArray(
      context
        ?.recentConversations
    );

  const projectMemories =
    asArray(
      context
        ?.existingProjectMemories
    )
      .filter(
        isEntryActive
      )
      .filter(
        (memory) =>
          isEntryRelevantToProject(
            memory,
            getProjectId(
              context
            )
          )
      );

  const landmarks = [];

  if (
    context
      ?.sessionHandoff
  ) {
    const handoff =
      context
        .sessionHandoff;

    const handoffText =
      cleanString(
        handoff.content
      ) ||
      cleanString(
        handoff.summary
      ) ||
      cleanString(
        handoff
          ?.value
          ?.summary
      );

    if (handoffText) {
      landmarks.push({
        source:
          "session-handoff",

        text:
          handoffText,
      });
    }

    const lastCompleted =
      cleanString(
        handoff
          ?.value
          ?.lastCompleted
      );

    if (lastCompleted) {
      landmarks.push({
        source:
          "session-handoff-last-completed",

        text:
          lastCompleted,
      });
    }

    const nextStep =
      cleanString(
        handoff
          ?.value
          ?.nextStep
      );

    if (nextStep) {
      landmarks.push({
        source:
          "session-handoff-next-step",

        text:
          nextStep,
      });
    }
  }

  if (
    cleanString(
      context
        ?.returnPoint
    )
  ) {
    landmarks.push({
      source:
        "return-point",

      text:
        cleanString(
          context.returnPoint
        ),
    });
  }

  projectMemories
    .slice(0, 3)
    .forEach(
      (memory) => {
        const text =
          cleanString(
            memory.content
          ) ||
          (
            typeof memory
              .value ===
              "string"
              ? cleanString(
                  memory.value
                )
              : ""
          ) ||
          cleanString(
            memory.title
          );

        if (text) {
          landmarks.push({
            source:
              "project-memory",

            text,

            memoryId:
              memory.id ||
              null,
          });
        }
      }
    );

  creatorMessages
    .slice(-3)
    .forEach(
      (message) => {
        const text =
          typeof message ===
            "string"
            ? message
            : (
                message?.content ||
                message?.text ||
                message?.summary
              );

        if (
          cleanString(
            text
          )
        ) {
          landmarks.push({
            source:
              "creator-message",

            text:
              cleanString(
                text
              ),
          });
        }
      }
    );

  conversations
    .slice(0, 3)
    .forEach(
      (conversation) => {
        const text =
          conversation?.summary ||
          conversation
            ?.creatorMessage;

        if (
          cleanString(
            text
          )
        ) {
          landmarks.push({
            source:
              "conversation-memory",

            text:
              cleanString(
                text
              ),
          });
        }
      }
    );

  if (
    context?.activeIdea
  ) {
    const activeIdeaText =
      typeof context
        .activeIdea ===
        "string"
        ? context.activeIdea
        : (
            context
              .activeIdea
              ?.summary ||
            context
              .activeIdea
              ?.description ||
            context
              .activeIdea
              ?.title
          );

    if (
      cleanString(
        activeIdeaText
      )
    ) {
      landmarks.push({
        source:
          "active-idea",

        text:
          cleanString(
            activeIdeaText
          ),
      });
    }
  }

  if (
    context
      ?.activeProject
  ) {
    const activeProjectText =
      typeof context
        .activeProject ===
        "string"
        ? context.activeProject
        : (
            context
              .activeProject
              ?.summary ||
            context
              .activeProject
              ?.title ||
            context
              .activeProject
              ?.name
          );

    if (
      cleanString(
        activeProjectText
      )
    ) {
      landmarks.push({
        source:
          "active-project",

        text:
          cleanString(
            activeProjectText
          ),
      });
    }
  }

  if (
    cleanString(
      context
        ?.nextTask
    )
  ) {
    landmarks.push({
      source:
        "next-task",

      text:
        cleanString(
          context.nextTask
        ),
    });
  }

  const seen =
    new Set();

  return landmarks
    .filter(
      (landmark) => {
        const key =
          normaliseText(
            landmark.text
          );

        if (!key) {
          return false;
        }

        if (
          seen.has(key)
        ) {
          return false;
        }

        seen.add(key);

        return true;
      }
    )
    .slice(0, 6);
}

function createResponseGuidance({
  decision,
  reflectionType,
  responseDepth,
  creatorCompletion,
  thinkingMode,
  guidanceReceptivity,
  candidate,
  conversationPlan,
  context,
  briefDetour,
  correctionSignal,
}) {
  const guidance = [
    "Demonstrate that the creator has been heard before adding anything new.",

    "Reflect only what is supported by the supplied conversation, project context or reliable memory.",

    "Present observations as possibilities rather than fixed truths.",

    "Keep the creator in ownership of their experience and idea.",

    "Present behaviour and explicit creator direction outrank remembered behaviour.",

    "Creator-approved project truth outranks inferred observations.",

    "Creator corrections override historical assumptions.",

    "Specialist-agent observations may inform reflection but do not own truth.",

    "Keep project-scoped reflections inside the active project.",

    "Do not diagnose, label or define the creator.",

    "Do not use empty praise.",

    "Do not make the creator repeat information already available in reliable context.",

    "Do not expose internal memory or specialist-agent machinery.",

    "Reflection exists in service of creation, not as a requirement before creation.",
  ];

  if (
    isForgetPriorityActive(
      conversationPlan,
      context
    )
  ) {
    guidance.push(
      "A memory forget operation has priority.",

      "Do not introduce unrelated reflection before the forget request is resolved.",

      "If clarification is required, allow only the minimum clarification necessary.",

      "Do not claim deletion until CreatorMemory confirms persistence."
    );
  }

  if (
    isExecutionMove(
      conversationPlan,
      context
    )
  ) {
    guidance.push(
      "ConversationPlanner has selected an execution move.",

      "Do not insert unnecessary reflection before the requested action.",

      "Move directly into the requested creation, refinement, demonstration, preparation or continuation.",

      "Reflection may support the action but must not delay it."
    );
  }

  if (
    decision ===
    REFLECTION_DECISIONS
      .YIELD_TO_EXECUTION
  ) {
    guidance.push(
      "Yield immediately to the execution layer.",

      "Do not add a reflective preamble unless it materially improves the requested action.",

      "Do not end with another question."
    );
  }

  if (
    decision ===
    REFLECTION_DECISIONS
      .YIELD_TO_MEMORY_ACTION
  ) {
    guidance.push(
      "Yield to the required memory action.",

      "Do not distract from an explicit forget or memory-control request."
    );
  }

  if (
    decision ===
    REFLECTION_DECISIONS
      .PRESERVE_HANDOFF
  ) {
    guidance.push(
      "Allow the creator to leave cleanly.",

      "Preserve the last completed point, current position and next useful step when that information is available.",

      "Do not introduce another task.",

      "Do not make the creator feel obligated to continue."
    );
  }

  if (
    decision ===
    REFLECTION_DECISIONS
      .ACKNOWLEDGE_DETOUR ||
    briefDetour.value
  ) {
    guidance.push(
      "Acknowledge the brief detour without opening a long discussion.",

      "Preserve the creator's previous task and conversational momentum.",

      "Return smoothly to the previous direction.",

      "Do not turn the detour into a new reflective exercise."
    );
  }

  if (
    decision ===
    REFLECTION_DECISIONS
      .HOLD_SPACE
  ) {
    guidance.push(
      "Do not provide a full response yet.",

      "Allow a brief silence so the creator can continue.",

      "Use no more than a very short acknowledgement if one is needed.",

      "Do not introduce a new idea, question or direction."
    );
  }

  if (
    decision ===
    REFLECTION_DECISIONS
      .STAY_SILENT
  ) {
    guidance.push(
      "Return no conversational content unless the interface requires an acknowledgement.",

      "Treat silence as active listening rather than inactivity."
    );
  }

  if (
    decision ===
    REFLECTION_DECISIONS
      .RESTORE_CONTEXT
  ) {
    guidance.push(
      "Restore only the minimum landmarks needed to reconnect the creator.",

      "Use project-scoped context only for the active project.",

      "Do not dump the entire project history.",

      "Do not supply or invent the creator's missing thought.",

      "Prefer the last meaningful decision, current position and next useful step."
    );
  }

  if (
    decision ===
    REFLECTION_DECISIONS
      .RELEASE_PRESSURE
  ) {
    guidance.push(
      "Confirm that enough useful material has already been captured.",

      "Remove any expectation that the creator must remember immediately.",

      "Leave the door open for the missing thought to return later.",

      "Offer to continue with what is already known."
    );
  }

  if (
    decision ===
    REFLECTION_DECISIONS
      .CLARIFY_GENTLY
  ) {
    guidance.push(
      "Reflect what has already been understood before asking for clarification.",

      "Identify only the smallest missing piece.",

      "Do not begin with 'I don't understand' or 'What do you mean?'.",

      "Invite the creator to add to the picture rather than repeat themselves."
    );
  }

  if (
    decision ===
    REFLECTION_DECISIONS
      .REFLECT
  ) {
    guidance.push(
      "Ask permission before sharing a personal observation when appropriate.",

      "Explain the evidence behind the reflection briefly.",

      "Invite the creator to confirm, reject or refine the reflection.",

      "Do not make the reflection longer than the creator's current mode requires.",

      "Treat specialist-agent reflection candidates as tentative unless creator-confirmed."
    );
  }

  if (
    correctionSignal.value
  ) {
    guidance.push(
      "The creator appears to be correcting earlier context.",

      "Prefer the creator's current correction over stale observations.",

      "Do not reflect an older contradictory conclusion back as though it remains current truth."
    );
  }

  if (
    decision ===
    REFLECTION_DECISIONS
      .MOVE_FORWARD
  ) {
    guidance.push(
      "Keep the reply practical and brief.",

      "Do not interrupt active creation with theory.",

      "Move directly to the next useful task or creative action."
    );
  }

  if (
    decision ===
    REFLECTION_DECISIONS
      .ECHO
  ) {
    guidance.push(
      "Use a short echo that shows understanding without taking over.",

      "Do not complete the creator's idea for them.",

      "Leave conversational space after the echo."
    );
  }

  if (
    decision ===
    REFLECTION_DECISIONS
      .ENCOURAGE
  ) {
    guidance.push(
      "Encourage using evidence from the creator's actions or progress.",

      "Avoid exaggerated or generic praise.",

      "Protect confidence before offering practical adjustments."
    );
  }

  if (
    creatorCompletion.value ===
    false
  ) {
    guidance.push(
      "Assume the creator may still be forming the thought.",

      "Do not ask a new question yet."
    );
  }

  if (
    [
      CREATOR_THINKING_MODES
        .FLOW,

      CREATOR_THINKING_MODES
        .BUILD,
    ].includes(
      thinkingMode.value
    )
  ) {
    guidance.push(
      "Protect momentum.",

      "Prefer action over explanation.",

      "Do not turn the creator from creating into reading."
    );
  }

  if (
    guidanceReceptivity.value ===
    GUIDANCE_RECEPTIVITY
      .CLOSED_FOR_NOW
  ) {
    guidance.push(
      "Do not provide optional guidance.",

      "Let the creator continue at their own pace."
    );
  }

  if (candidate) {
    guidance.push(
      `Potential evidence-based reflection: ${
        candidate.text ||
        candidate.content ||
        candidate.description ||
        candidate.name ||
        candidate.title ||
        "available observation"
      }`
    );
  }

  guidance.push(
    `Preferred response depth: ${responseDepth}.`
  );

  return uniqueValues(
    guidance
  );
}

function createGuardRails() {
  return [
    "Do not say: I do not understand.",

    "Do not say: What do you mean?",

    "Do not say: Explain that again.",

    "Do not imply the creator communicated poorly.",

    "Do not rush to fill silence.",

    "Do not interrupt an emerging thought with multiple suggestions.",

    "Do not provide five alternatives when the creator may still be thinking.",

    "Do not pretend certainty about the creator's feelings or identity.",

    "Do not make a personal observation without evidence.",

    "Do not treat inferred memory as creator-confirmed truth.",

    "Do not treat specialist-agent observations as unquestionable truth.",

    "Do not reflect historical or superseded memory as though it is still current.",

    "Do not mix project-scoped memory across different projects.",

    "Do not allow remembered preferences to override explicit present creator direction.",

    "Do not let a stored response-depth preference turn a required short execution response into a long reflection.",

    "Do not turn reflection into a lecture.",

    "Do not compete with the creator for control of the conversation.",

    "Do not claim credit for an idea that emerged from the creator.",

    "Do not repeat a reflection merely because it previously worked.",

    "Do not pressure the creator to respond immediately.",

    "Do not let reflection block an explicit request to create, refine, demonstrate, prepare or continue.",

    "Do not let reflection obstruct a pause, stop or session handoff.",

    "Do not let reflection obstruct an explicit forget request.",

    "Do not mistake an experienced creator's independence for disengagement.",

    "Do not reopen a brief detour merely because a related reflection exists.",

    "Do not reopen a deferred topic unless the timing is appropriate.",

    "Do not expose internal specialist-agent or memory machinery in creator-facing conversation.",

    "Do not claim memory persistence, deletion or handoff success from ReflectionEngine.",
  ];
}

function createDecisionSummary({
  decision,
  reflectionType,
  thinkingMode,
  guidanceReceptivity,
  responseDepth,
  conversationPlan,
  context,
}) {
  const mentorMove =
    getPlannerMentorMove(
      conversationPlan,
      context
    );

  const moveSummary =
    mentorMove
      ? (
          ` ConversationPlanner selected ${mentorMove}.`
        )
      : "";

  return (
    `Use the ${decision} decision with a ` +
    `${reflectionType} reflection. ` +
    `The creator appears to be in ` +
    `${thinkingMode.value} mode, with ` +
    `${guidanceReceptivity.value} guidance receptivity. ` +
    `Use ${responseDepth} response depth.` +
    moveSummary
  );
}

function createFallbackReflectionPlan({
  message,
  context,
  error = null,
}) {
  return {
    id:
      createReflectionId(),

    engine:
      "reflection-engine",

    version:
      REFLECTION_ENGINE_VERSION,

    input: {
      message:
        cleanString(
          message
        ),
    },

    decision:
      REFLECTION_DECISIONS
        .HOLD_SPACE,

    reflection: {
      type:
        REFLECTION_TYPES
          .UNDERSTANDING,

      candidate: null,

      contextLandmarks:
        [],
    },

    creatorState: {
      thinkingMode:
        createDetection({
          value:
            CREATOR_THINKING_MODES
              .UNKNOWN,

          confidence: 0.2,
        }),

      guidanceReceptivity:
        createDetection({
          value:
            GUIDANCE_RECEPTIVITY
              .UNKNOWN,

          confidence: 0.2,
        }),

      appearsFinished:
        createDetection({
          value: true,

          confidence: 0.2,
        }),

      holdSpaceNeeded:
        createDetection({
          value: true,

          confidence: 0.4,
        }),

      contextRestorationNeeded:
        createDetection({
          value: false,

          confidence: 0.2,
        }),

      pressureReleaseNeeded:
        createDetection({
          value: false,

          confidence: 0.2,
        }),

      briefDetour:
        createDetection({
          value: false,

          confidence: 0.2,
        }),

      correctionSignal:
        createDetection({
          value: false,

          confidence: 0.2,
        }),
    },

    timing: {
      responseDelayMs: 1200,

      silenceWindowMs: 2000,

      allowCreatorToContinue:
        true,

      canCancelResponseIfCreatorContinues:
        true,
    },

    responseDepth:
      RESPONSE_DEPTH.SHORT,

    responseGuidance: [
      "Listen carefully.",

      "Use a short acknowledgement.",

      "Do not introduce a new direction.",

      "Ask no more than one question.",

      "Do not make new memory assumptions while reflection planning is unavailable.",
    ],

    guardRails:
      createGuardRails(),

    creatorProtocol: {
      protectTheCreator:
        true,

      presentBehaviourLeads:
        true,

      reflectionMustNotBlockCreation:
        true,

      creatorOwnsTheirExperience:
        true,
    },

    contextSnapshot:
      cloneValue(
        context
      ),

    conversationPlanSnapshot:
      null,

    decisionSummary:
      "Reflection analysis failed. Hold space and use safe listening behaviour.",

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

function createReflectionEngine() {
  function planReflection({
    message = "",
    context = {},
    conversationPlan = null,
  } = {}) {
    try {
      const plannerSnapshot =
        cloneValue(
          conversationPlan
        );

      const plannerContext =
        conversationPlan
          ?.contextSnapshot ||
        {};

      /**
       * Precedence:
       * 1. Reflection defaults.
       * 2. ConversationPlanner resolved context.
       * 3. Explicit current orchestration context.
       *
       * Current context therefore always wins.
       */
      const combinedContext = {
        ...cloneValue(
          DEFAULT_REFLECTION_CONTEXT
        ),

        ...cloneValue(
          plannerContext
        ),

        ...cloneValue(
          context
        ),

        conversationMode:
          hasOwn(
            context,
            "conversationMode"
          )
            ? context
                .conversationMode
            : (
                conversationPlan
                  ?.conversation
                  ?.mode ||
                plannerContext
                  ?.conversationMode ||
                null
              ),

        mentorMove:
          hasOwn(
            context,
            "mentorMove"
          )
            ? context
                .mentorMove
            : (
                conversationPlan
                  ?.conversation
                  ?.mentorMove ||
                plannerContext
                  ?.mentorMove ||
                null
              ),

        mentorTone:
          hasOwn(
            context,
            "mentorTone"
          )
            ? context
                .mentorTone
            : (
                conversationPlan
                  ?.conversation
                  ?.tone ||
                plannerContext
                  ?.mentorTone ||
                "warm"
              ),

        currentTimestamp:
          context
            ?.currentTimestamp ||
          plannerContext
            ?.currentTimestamp ||
          createTimestamp(),
      };

      /**
       * Pull modern planner explicit-direction signals forward
       * when the caller has not supplied a stronger value.
       */
      const explicitDirection =
        conversationPlan
          ?.explicitDirection ||
        {};

      if (
        !hasOwn(
          context,
          "creatorExplicitlyAskedToPause"
        ) &&
        explicitDirection.pause
      ) {
        combinedContext
          .creatorExplicitlyAskedToPause =
          true;
      }

      if (
        !hasOwn(
          context,
          "creatorExplicitlyAskedToContinue"
        ) &&
        explicitDirection.continue
      ) {
        combinedContext
          .creatorExplicitlyAskedToContinue =
          true;
      }

      if (
        !hasOwn(
          context,
          "creatorExplicitlyAskedToCreate"
        ) &&
        explicitDirection.create
      ) {
        combinedContext
          .creatorExplicitlyAskedToCreate =
          true;
      }

      if (
        !hasOwn(
          context,
          "creatorExplicitlyAskedForGuidance"
        ) &&
        explicitDirection.guidance
      ) {
        combinedContext
          .creatorExplicitlyAskedForGuidance =
          true;
      }

      const creatorCompletion =
        detectCreatorCompletion({
          message,

          context:
            combinedContext,

          conversationPlan,
        });

      const thinkingMode =
        detectThinkingMode({
          message,

          context:
            combinedContext,

          conversationPlan,
        });

      const guidanceReceptivity =
        detectGuidanceReceptivity({
          message,

          context:
            combinedContext,

          thinkingMode,

          conversationPlan,
        });

      const briefDetour =
        detectBriefDetour({
          message,

          context:
            combinedContext,
        });

      const correctionSignal =
        detectCorrection({
          message,

          context:
            combinedContext,
        });

      const holdSpaceNeeded =
        detectHoldSpaceNeed({
          message,

          context:
            combinedContext,

          creatorCompletion,

          thinkingMode,

          guidanceReceptivity,

          conversationPlan,

          briefDetour,
        });

      const contextRestorationNeeded =
        detectContextRestorationNeed({
          message,

          context:
            combinedContext,

          conversationPlan,
        });

      const pressureReleaseNeeded =
        detectPressureReleaseNeed({
          message,

          thinkingMode,

          contextRestorationNeeded,

          conversationPlan,

          context:
            combinedContext,
        });

      const allowOptionalReflection =
        !isExecutionMove(
          conversationPlan,
          combinedContext
        ) &&
        !isPauseMove(
          conversationPlan,
          combinedContext
        ) &&
        !isStopRequested(
          combinedContext
        ) &&
        !isForgetPriorityActive(
          conversationPlan,
          combinedContext
        ) &&
        !briefDetour.value;

      const candidate =
        allowOptionalReflection
          ? selectReflectionCandidate(
              combinedContext,
              {
                correctionSignal:
                  correctionSignal.value,

                allowProjectMemory:
                  Boolean(
                    getProjectId(
                      combinedContext
                    )
                  ),
              }
            )
          : null;

      const reflectionType =
        chooseReflectionType({
          conversationPlan,

          thinkingMode,

          candidate,

          contextRestorationNeeded,

          pressureReleaseNeeded,

          context:
            combinedContext,
        });

      const responseDepth =
        chooseResponseDepth({
          thinkingMode,

          guidanceReceptivity,

          context:
            combinedContext,

          conversationPlan,

          creatorCompletion,

          briefDetour,
        });

      const decision =
        chooseDecision({
          holdSpaceNeeded,

          contextRestorationNeeded,

          pressureReleaseNeeded,

          creatorCompletion,

          thinkingMode,

          candidate,

          conversationPlan,

          context:
            combinedContext,

          briefDetour,
        });

      const timing =
        chooseTiming({
          decision,

          thinkingMode,

          context:
            combinedContext,

          conversationPlan,
        });

      const contextLandmarks =
        contextRestorationNeeded
          .value ||
        decision ===
          REFLECTION_DECISIONS
            .PRESERVE_HANDOFF
          ? createContextLandmarks(
              combinedContext
            )
          : [];

      const responseGuidance =
        createResponseGuidance({
          decision,

          reflectionType,

          responseDepth,

          creatorCompletion,

          thinkingMode,

          guidanceReceptivity,

          candidate,

          conversationPlan,

          context:
            combinedContext,

          briefDetour,

          correctionSignal,
        });

      const specialistSignalsPresent =
        hasSpecialistSignals(
          combinedContext
        );

      return {
        id:
          createReflectionId(),

        engine:
          "reflection-engine",

        version:
          REFLECTION_ENGINE_VERSION,

        input: {
          message:
            cleanString(
              message
            ),
        },

        decision,

        reflection: {
          type:
            reflectionType,

          candidate,

          contextLandmarks,

          shouldAskPermission:
            decision ===
              REFLECTION_DECISIONS
                .REFLECT &&
            Boolean(candidate),

          shouldInviteCorrection:
            decision ===
              REFLECTION_DECISIONS
                .REFLECT,

          shouldDemonstrateUnderstanding:
            ![
              REFLECTION_DECISIONS
                .YIELD_TO_EXECUTION,

              REFLECTION_DECISIONS
                .YIELD_TO_MEMORY_ACTION,
            ].includes(
              decision
            ),

          shouldClarify:
            decision ===
              REFLECTION_DECISIONS
                .CLARIFY_GENTLY,

          shouldReleasePressure:
            pressureReleaseNeeded
              .value,

          shouldRestoreContext:
            contextRestorationNeeded
              .value,

          shouldYieldToExecution:
            decision ===
              REFLECTION_DECISIONS
                .YIELD_TO_EXECUTION ||
            isExecutionMove(
              conversationPlan,
              combinedContext
            ),

          shouldYieldToMemoryAction:
            decision ===
              REFLECTION_DECISIONS
                .YIELD_TO_MEMORY_ACTION,

          shouldPreserveHandoff:
            decision ===
              REFLECTION_DECISIONS
                .PRESERVE_HANDOFF,

          shouldAcknowledgeDetour:
            decision ===
              REFLECTION_DECISIONS
                .ACKNOWLEDGE_DETOUR,

          specialistSignalsPresent,

          activeProjectId:
            getProjectId(
              combinedContext
            ),
        },

        creatorState: {
          thinkingMode,

          guidanceReceptivity,

          appearsFinished:
            creatorCompletion,

          holdSpaceNeeded,

          contextRestorationNeeded,

          pressureReleaseNeeded,

          briefDetour,

          correctionSignal,
        },

        timing,

        responseDepth,

        responseGuidance,

        guardRails:
          createGuardRails(),

        creatorProtocol: {
          protectTheCreator:
            true,

          reflectBeforeClarifying:
            true,

          seekUnderstandingBeforeGuidance:
            true,

          presentBehaviourLeads:
            true,

          memoryInforms:
            true,

          creatorConfirmedTruthOutranksInference:
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

          protectMomentum:
            true,

          protectEmergence:
            true,

          protectThinkingTime:
            true,

          silenceCanBeAResponse:
            true,

          evidenceBeforeReflection:
            true,

          creatorOwnsTheirExperience:
            true,

          oneMeaningfulQuestionAtATime:
            true,

          conversationServesCreation:
            true,

          actionBeforeReflectionWhenRequested:
            true,

          reflectionMustNotBlockCreation:
            true,

          reflectionMustNotBlockMemoryControl:
            true,

          reflectionMustNotBlockSessionExit:
            true,

          briefDetoursStayBrief:
            true,

          sessionHandoffProtectsMomentum:
            true,

          rememberedPreferencesDoNotOverridePresentBehaviour:
            true,

          respectCreatorExperience:
            true,

          creatorCanOverrideMentorDirection:
            true,

          complexityRemainsBehindConversation:
            true,
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
                ?.activeStage ||
              null
            ),

          activeScene:
            cloneValue(
              combinedContext
                ?.activeScene ||
              null
            ),

          activeCharacter:
            cloneValue(
              combinedContext
                ?.activeCharacter ||
              null
            ),

          activeAsset:
            cloneValue(
              combinedContext
                ?.activeAsset ||
              null
            ),

          projectMemoryAvailable:
            asArray(
              combinedContext
                ?.existingProjectMemories
            ).some(
              (memory) =>
                isEntryActive(
                  memory
                ) &&
                isEntryRelevantToProject(
                  memory,
                  getProjectId(
                    combinedContext
                  )
                )
            ),

          sessionHandoffAvailable:
            Boolean(
              combinedContext
                ?.sessionHandoff
            ),

          returnPoint:
            combinedContext
              ?.returnPoint ||
            null,

          nextTask:
            combinedContext
              ?.nextTask ||
            null,

          specialistSignalsPresent,
        },

        contextSnapshot:
          cloneValue(
            combinedContext
          ),

        conversationPlanSnapshot:
          plannerSnapshot,

        decisionSummary:
          createDecisionSummary({
            decision,

            reflectionType,

            thinkingMode,

            guidanceReceptivity,

            responseDepth,

            conversationPlan,

            context:
              combinedContext,
          }),

        status:
          "planned",

        createdAt:
          createTimestamp(),
      };
    } catch (error) {
      console.error(
        "ReflectionEngine planning error:",
        error
      );

      return (
        createFallbackReflectionPlan({
          message,
          context,
          error,
        })
      );
    }
  }

  function shouldHoldSpace(
    plan
  ) {
    return Boolean(
      plan?.decision ===
        REFLECTION_DECISIONS
          .HOLD_SPACE ||
      plan?.decision ===
        REFLECTION_DECISIONS
          .STAY_SILENT ||
      plan
        ?.creatorState
        ?.holdSpaceNeeded
        ?.value
    );
  }

  function shouldRestoreContext(
    plan
  ) {
    return Boolean(
      plan?.decision ===
        REFLECTION_DECISIONS
          .RESTORE_CONTEXT ||
      plan
        ?.reflection
        ?.shouldRestoreContext
    );
  }

  function shouldReleasePressure(
    plan
  ) {
    return Boolean(
      plan?.decision ===
        REFLECTION_DECISIONS
          .RELEASE_PRESSURE ||
      plan
        ?.reflection
        ?.shouldReleasePressure
    );
  }

  function shouldYieldToExecution(
    plan
  ) {
    return Boolean(
      plan
        ?.reflection
        ?.shouldYieldToExecution ||
      plan?.decision ===
        REFLECTION_DECISIONS
          .YIELD_TO_EXECUTION ||
      plan?.decision ===
        REFLECTION_DECISIONS
          .MOVE_FORWARD
    );
  }

  function shouldYieldToMemoryAction(
    plan
  ) {
    return Boolean(
      plan
        ?.reflection
        ?.shouldYieldToMemoryAction ||
      plan?.decision ===
        REFLECTION_DECISIONS
          .YIELD_TO_MEMORY_ACTION
    );
  }

  function shouldPreserveHandoff(
    plan
  ) {
    return Boolean(
      plan
        ?.reflection
        ?.shouldPreserveHandoff ||
      plan?.decision ===
        REFLECTION_DECISIONS
          .PRESERVE_HANDOFF
    );
  }

  function isBriefDetour(
    plan
  ) {
    return Boolean(
      plan
        ?.creatorState
        ?.briefDetour
        ?.value
    );
  }

  return {
    planReflection,

    shouldHoldSpace,

    shouldRestoreContext,

    shouldReleasePressure,

    shouldYieldToExecution,

    shouldYieldToMemoryAction,

    shouldPreserveHandoff,

    isBriefDetour,
  };
}

function planReflection({
  message = "",
  context = {},
  conversationPlan = null,
} = {}) {
  const engine =
    createReflectionEngine();

  return (
    engine.planReflection({
      message,
      context,
      conversationPlan,
    })
  );
}

export {
  REFLECTION_ENGINE_VERSION,

  REFLECTION_DECISIONS,

  REFLECTION_TYPES,

  CREATOR_THINKING_MODES,

  GUIDANCE_RECEPTIVITY,

  RESPONSE_DEPTH,

  SILENCE_REASONS,

  REFLECTION_SOURCES,

  REFLECTION_CERTAINTY,

  REFLECTION_SCOPES,

  REFLECTION_AUTHORITY,

  createReflectionEngine,

  planReflection,
};

export default createReflectionEngine;
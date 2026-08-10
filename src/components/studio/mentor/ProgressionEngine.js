/**
 * Progression Engine
 * ------------------------------------------------------------
 * The pacing, momentum, continuity and next-step decision layer
 * for iBand's AI Mentor — The Creator.
 *
 * The Progression Engine does not generate the final Mentor
 * response. It decides what should happen next.
 *
 * It combines:
 *
 * - The creator's current message.
 * - Current conversation state.
 * - Conversation Planner signals.
 * - Reflection Engine signals.
 * - Creator Memory signals.
 * - Current project identity and project continuity.
 * - Current energy and momentum.
 * - Information saturation.
 * - Guidance receptiveness.
 * - Project readiness.
 * - Explicit creator direction.
 * - Memory-control operations.
 * - Previous progression state.
 *
 * Version 2.3 hardens Progression as the final orchestration
 * traffic controller before memory execution and adaptive response.
 *
 * v2.3 guarantees:
 *
 * - Explicit current creator direction outranks remembered preference.
 * - Explicit current project identity outranks stale remembered project state.
 * - ReflectionEngine v2.3 execution/yield decisions are respected.
 * - Explicit forget and memory-control operations suspend unrelated
 *   progression until resolved.
 * - Project continuity remains isolated to the active project.
 * - Session handoffs preserve position without introducing new work.
 * - Temporary energy, saturation and guidance state remain temporary.
 * - Stored preferences influence pacing but never control present behaviour.
 * - Specialist-agent signals may inform progression but never own truth.
 * - Creator corrections invalidate stale continuity assumptions.
 * - Build and flow modes remain action-first.
 * - High information saturation reduces rather than expands responses.
 * - Progression never fabricates persistence success.
 * - Pausing and stopping remain creator-controlled.
 *
 * Core philosophy:
 *
 * - Conversation exists in service of creation.
 * - Current creator intent has priority over remembered preference.
 * - Memory should improve continuity, never trap the creator.
 * - Durable preferences and temporary states are different things.
 * - Project memory belongs to its project.
 * - Creator-confirmed truth outranks inference.
 * - Specialist agents may contribute evidence but do not own truth.
 * - Do not interrupt creative flow with unnecessary teaching.
 * - Do not keep talking merely because more information exists.
 * - Adapt the amount of guidance to the individual creator.
 * - Protect momentum, energy and attention.
 * - Move forward when enough has been discovered.
 * - Allow unfinished ideas to return later without pressure.
 * - Restore context without forcing the creator to repeat themselves.
 * - One useful next step is often better than a roadmap.
 * - Complexity belongs behind the conversation.
 */

const PROGRESSION_ENGINE_VERSION = "2.3.0";

const PROGRESSION_DECISIONS = Object.freeze({
  CONTINUE_LISTENING:
    "continue-listening",

  CONTINUE_EXPLORING:
    "continue-exploring",

  CONTINUE_LEARNING:
    "continue-learning",

  HOLD_SPACE:
    "hold-space",

  REDUCE_INFORMATION:
    "reduce-information",

  OFFER_ONE_SMALL_STEP:
    "offer-one-small-step",

  MOVE_TO_CREATION:
    "move-to-creation",

  MOVE_TO_NEXT_TASK:
    "move-to-next-task",

  MOVE_TO_REFINEMENT:
    "move-to-refinement",

  MOVE_TO_PUBLISHING:
    "move-to-publishing",

  RESTORE_CONTEXT:
    "restore-context",

  RELEASE_PRESSURE:
    "release-pressure",

  SAVE_AND_RETURN_LATER:
    "save-and-return-later",

  PAUSE_SESSION:
    "pause-session",

  END_SESSION_POSITIVELY:
    "end-session-positively",

  WAIT_FOR_CREATOR:
    "wait-for-creator",

  PRESERVE_HANDOFF:
    "preserve-handoff",

  ACKNOWLEDGE_DETOUR:
    "acknowledge-detour",

  YIELD_TO_EXECUTION:
    "yield-to-execution",

  YIELD_TO_MEMORY_ACTION:
    "yield-to-memory-action",

  WAIT_FOR_MEMORY_CLARIFICATION:
    "wait-for-memory-clarification",

  NONE: "none",
});

const MOMENTUM_STATES = Object.freeze({
  RISING: "rising",
  STRONG: "strong",
  STABLE: "stable",
  SLOWING: "slowing",
  STALLED: "stalled",
  RECOVERING: "recovering",
  UNKNOWN: "unknown",
});

const CREATOR_ENERGY_STATES = Object.freeze({
  HIGH: "high",
  MEDIUM: "medium",
  LOW: "low",
  DEPLETED: "depleted",
  RECOVERING: "recovering",
  UNKNOWN: "unknown",
});

const INFORMATION_SATURATION = Object.freeze({
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high",
  OVERLOADED: "overloaded",
  UNKNOWN: "unknown",
});

const GUIDANCE_WINDOWS = Object.freeze({
  WIDE_OPEN: "wide-open",
  PARTIALLY_OPEN: "partially-open",
  NARROW: "narrow",
  CLOSED_FOR_NOW: "closed-for-now",
  UNKNOWN: "unknown",
});

const SESSION_PHASES = Object.freeze({
  OPENING: "opening",
  DISCOVERING: "discovering",
  BRAINSTORMING: "brainstorming",
  LEARNING: "learning",
  BUILDING: "building",
  CREATING: "creating",
  REFINING: "refining",
  PUBLISHING: "publishing",
  REFLECTING: "reflecting",
  RECOVERING: "recovering",
  PAUSING: "pausing",
  CLOSING: "closing",
  RETURNING: "returning",

  MEMORY_CONTROL:
    "memory-control",

  UNKNOWN: "unknown",
});

const PROGRESSION_ACTIONS = Object.freeze({
  ASK_ONE_MORE_QUESTION:
    "ask-one-more-question",

  INVITE_CREATOR_TO_CONTINUE:
    "invite-creator-to-continue",

  GIVE_SHORT_ACKNOWLEDGEMENT:
    "give-short-acknowledgement",

  WAIT_WITHOUT_NEW_DIRECTION:
    "wait-without-new-direction",

  SUMMARISE_WHAT_IS_READY:
    "summarise-what-is-ready",

  REDUCE_TO_ONE_RECOMMENDATION:
    "reduce-to-one-recommendation",

  BEGIN_NEXT_CREATIVE_STEP:
    "begin-next-creative-step",

  BEGIN_GENERATION:
    "begin-generation",

  BEGIN_REFINEMENT:
    "begin-refinement",

  BEGIN_PUBLISHING:
    "begin-publishing",

  SAVE_CURRENT_PROGRESS:
    "save-current-progress",

  OFFER_INSPIRATION_DRAWER:
    "offer-inspiration-drawer",

  RECAP_CONTEXT:
    "recap-context",

  RELEASE_EXPECTATION:
    "release-expectation",

  SUGGEST_SHORT_BREAK:
    "suggest-short-break",

  CLOSE_WITH_OPEN_DOOR:
    "close-with-open-door",

  DO_NOT_ADD_MORE_INFORMATION:
    "do-not-add-more-information",

  RESTORE_CREATOR_WORKING_MODE:
    "restore-creator-working-mode",

  PRESERVE_SESSION_HANDOFF:
    "preserve-session-handoff",

  ACKNOWLEDGE_AND_RETURN:
    "acknowledge-and-return",

  YIELD_TO_EXECUTION:
    "yield-to-execution",

  YIELD_TO_MEMORY_ACTION:
    "yield-to-memory-action",

  REQUEST_MEMORY_CLARIFICATION:
    "request-memory-clarification",
});

const RESPONSE_LENGTHS = Object.freeze({
  SILENT: "silent",
  MINIMAL: "minimal",
  SHORT: "short",
  MEDIUM: "medium",
  DETAILED: "detailed",
});

const MEMORY_CONTROL_ACTIONS = Object.freeze([
  "forget-memory",
  "archive-memory",
  "resolve-thread",
  "supersede-memory",
  "reinforce-memory",
  "weaken-memory",
]);

const REFLECTION_EXECUTION_DECISIONS =
  Object.freeze([
    "yield-to-execution",
    "move-forward",
  ]);

const REFLECTION_MEMORY_DECISIONS =
  Object.freeze([
    "yield-to-memory-action",
  ]);

const REFLECTION_HOLD_DECISIONS =
  Object.freeze([
    "stay-silent",
    "hold-space",
  ]);

const DEFAULT_PROGRESSION_CONTEXT =
  Object.freeze({
    creatorId: null,

    creatorJourney: "guide",

    creatorType: null,

    creatorExperience: null,

    projectType: null,

    activeProject: null,

    activeProjectId: null,

    activeIdea: null,

    activeStage: null,

    activeScene: null,

    activeCharacter: null,

    activeAsset: null,

    sessionId: null,

    sessionStartedAt: null,

    sessionDurationMinutes: 0,

    creatorMessageCount: 0,

    mentorMessageCount: 0,

    recentCreatorMessages: [],

    recentMentorMessages: [],

    recentCreatorQuestions: 0,

    recentMentorQuestions: 0,

    consecutiveShortCreatorReplies: 0,

    consecutiveLongCreatorReplies: 0,

    consecutiveMentorMessages: 0,

    creatorExplicitlyAskedToContinue:
      false,

    creatorExplicitlyAskedToStop:
      false,

    creatorExplicitlyAskedToPause:
      false,

    creatorExplicitlyAskedForNextStep:
      false,

    creatorExplicitlyAskedForGuidance:
      false,

    creatorExplicitlyAskedForHelp:
      false,

    creatorExplicitlyAskedForExplanation:
      false,

    creatorExplicitlyAskedToCreate:
      false,

    creatorExplicitlyAskedToRemember:
      false,

    creatorExplicitlyAskedNotToRemember:
      false,

    creatorExplicitlyAskedToRevisit:
      false,

    creatorEnergy: null,

    informationSaturation: null,

    guidanceWindow: null,

    thinkingMode: null,

    momentum: null,

    activeProjectStatus: null,

    requiredInformationComplete:
      false,

    minimumCreationContextReady:
      false,

    projectReadyToGenerate:
      false,

    projectReadyToRefine:
      false,

    projectReadyToPublish:
      false,

    unresolvedQuestions: [],

    completedSteps: [],

    remainingSteps: [],

    preferredResponseDepth: null,

    preferredGuidanceStyle: null,

    preferredMentorRole: null,

    preferredCommunicationPace:
      null,

    creatorMemory: null,

    creatorMemoryProfile: null,

    creatorMemorySignals: null,

    memoryContext: null,

    creatorMemoryContext: null,

    existingProjectMemories: [],

    existingMemories: [],

    existingPatterns: [],

    existingObservations: [],

    deferredMemories: [],

    milestones: [],

    memorySignals: [],

    projectMemorySignals: [],

    sourceAgent: null,

    sourceSystem: null,

    memoryAction: null,

    memoryActionPending: false,

    forgetRequested: false,

    forgetRequiresClarification:
      false,

    memoryPersistencePending:
      false,

    returningCreator: false,

    returningToProject: false,

    creatorIsReturning: false,

    previousSessionSummary:
      null,

    previousReturnPoint: null,

    previousNextStep: null,

    returnPoint: null,

    nextTask: null,

    previousTask: null,

    captureSessionHandoff:
      false,

    sessionHandoff: null,

    briefDetour: false,

    deferredTopic: false,

    correctionSignal: false,

    lastProgressionDecision:
      null,

    lastProgressionAt: null,

    currentTimestamp: null,
  });

function createTimestamp() {
  return new Date()
    .toISOString();
}

function createProgressionId() {
  const randomValue =
    Math.random()
      .toString(36)
      .slice(2, 10);

  return (
    `progression-plan-` +
    `${Date.now()}-${randomValue}`
  );
}

function cloneValue(value) {
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

function normaliseText(value) {
  if (
    typeof value !==
    "string"
  ) {
    return "";
  }

  return value
    .trim()
    .toLowerCase()
    .replace(/[’‘]/g, "'")
    .replace(/\s+/g, " ");
}

function cleanString(value) {
  return typeof value ===
    "string"
    ? value.trim()
    : "";
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

function safeNumber(
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

function getRecentCreatorText(
  context
) {
  return asArray(
    context
      ?.recentCreatorMessages
  )
    .slice(-5)
    .map(
      (message) => {
        if (
          typeof message ===
          "string"
        ) {
          return message;
        }

        return (
          message?.content ||
          message?.text ||
          message?.summary ||
          ""
        );
      }
    )
    .filter(Boolean)
    .join(" ");
}

function getRecentMentorText(
  context
) {
  return asArray(
    context
      ?.recentMentorMessages
  )
    .slice(-5)
    .map(
      (message) => {
        if (
          typeof message ===
          "string"
        ) {
          return message;
        }

        return (
          message?.content ||
          message?.text ||
          message?.summary ||
          ""
        );
      }
    )
    .filter(Boolean)
    .join(" ");
}

function resolveCreatorMemory(
  context = {}
) {
  const candidates = [
    context
      .creatorMemorySignals,

    context
      .creatorMemoryProfile,

    context
      .creatorMemory,

    context
      .memoryContext,

    context
      .creatorMemoryContext,
  ]
    .filter(
      (candidate) =>
        candidate &&
        typeof candidate ===
          "object"
    );

  return candidates.reduce(
    (
      memory,
      candidate
    ) => ({
      ...memory,
      ...cloneValue(
        candidate
      ),
    }),
    {}
  );
}

function readMemoryValue(
  memory,
  paths = []
) {
  for (
    const path
    of paths
  ) {
    const parts =
      path.split(".");

    let current =
      memory;

    for (
      const part
      of parts
    ) {
      if (
        current === null ||
        current === undefined ||
        typeof current !==
          "object"
      ) {
        current =
          undefined;

        break;
      }

      current =
        current[part];
    }

    if (
      current !==
        undefined &&
      current !==
        null &&
      current !==
        ""
    ) {
      return current;
    }
  }

  return null;
}

function normalisePreference(
  value
) {
  if (
    typeof value ===
    "string"
  ) {
    return (
      normaliseText(
        value
      )
    );
  }

  if (
    value &&
    typeof value ===
      "object"
  ) {
    return (
      normaliseText(
        value.value ||
        value.preference ||
        value.style ||
        value.mode ||
        value.label ||
        ""
      )
    );
  }

  return "";
}

function getMemoryProjectId(
  memory
) {
  return (
    cleanString(
      memory
        ?.activeProjectId
    ) ||
    cleanString(
      memory
        ?.requestedProjectId
    ) ||
    cleanString(
      memory
        ?.activeProject
        ?.id
    ) ||
    cleanString(
      memory
        ?.activeProject
        ?.projectId
    ) ||
    null
  );
}

function deriveMemorySignals(
  context = {}
) {
  const memory =
    resolveCreatorMemory(
      context
    );

  const activeProjectId =
    getProjectId(
      context
    );

  const memoryProjectId =
    getMemoryProjectId(
      memory
    );

  const memoryProjectCompatible =
    !activeProjectId ||
    !memoryProjectId ||
    activeProjectId ===
      memoryProjectId;

  const responseDepth =
    normalisePreference(
      readMemoryValue(
        memory,
        [
          "preferredResponseDepth",

          "responseDepth",

          "preferences.responseDepth",

          "communication.responseDepth",

          "communication.preferredResponseDepth",

          "communicationPreferences.preferredResponseDepth",

          "creatorProfile.communicationPreferences.preferredResponseDepth",
        ]
      )
    );

  const guidanceStyle =
    normalisePreference(
      readMemoryValue(
        memory,
        [
          "preferredGuidanceStyle",

          "guidanceStyle",

          "preferences.guidanceStyle",

          "mentoring.guidanceStyle",

          "workingStyle.guidanceStyle",

          "communicationPreferences.preferredGuidanceStyle",

          "creatorProfile.communicationPreferences.preferredGuidanceStyle",
        ]
      )
    );

  const learningStyle =
    normalisePreference(
      readMemoryValue(
        memory,
        [
          "preferredLearningStyle",

          "learningStyle",

          "preferences.learningStyle",

          "learning.preferredStyle",
        ]
      )
    );

  const pacingPreference =
    normalisePreference(
      readMemoryValue(
        memory,
        [
          "preferredPacing",

          "pacingPreference",

          "preferences.pacing",

          "workingStyle.pacing",

          "pace",

          "communicationPreferences.preferredCommunicationPace",

          "creatorProfile.communicationPreferences.preferredCommunicationPace",
        ]
      )
    );

  const autonomyPreference =
    normalisePreference(
      readMemoryValue(
        memory,
        [
          "autonomyPreference",

          "preferredAutonomy",

          "preferences.autonomy",

          "workingStyle.autonomy",
        ]
      )
    );

  const overloadSensitivity =
    normalisePreference(
      readMemoryValue(
        memory,
        [
          "overloadSensitivity",

          "informationTolerance",

          "preferences.informationTolerance",

          "communication.informationTolerance",
        ]
      )
    );

  const buildModePreference =
    normalisePreference(
      readMemoryValue(
        memory,
        [
          "buildMode",

          "workingMode",

          "preferredWorkingMode",

          "preferences.workingMode",

          "workingStyle.mode",
        ]
      )
    );

  const memoryReturnPoint =
    memoryProjectCompatible
      ? (
          readMemoryValue(
            memory,
            [
              "returnPoint",

              "continuity.returnPoint",

              "session.returnPoint",

              "lastReturnPoint",

              "nextStep",

              "continuity.nextStep",

              "sessionHandoff.value.nextStep",

              "sessionHandoff.content",
            ]
          ) ||
          null
        )
      : null;

  const explicitReturnPoint =
    context.returnPoint ||
    context.previousReturnPoint ||
    context.previousNextStep ||
    context.nextTask ||
    null;

  const returnPoint =
    explicitReturnPoint ||
    memoryReturnPoint ||
    null;

  const memorySummary =
    memoryProjectCompatible
      ? (
          readMemoryValue(
            memory,
            [
              "previousSessionSummary",

              "continuity.previousSessionSummary",

              "lastSessionSummary",

              "sessionSummary",

              "sessionHandoff.value.summary",

              "sessionHandoff.content",
            ]
          ) ||
          null
        )
      : null;

  const previousSummary =
    context
      .previousSessionSummary ||
    memorySummary ||
    null;

  const returning =
    Boolean(
      context.returningCreator ||
      context.returningToProject ||
      context.creatorIsReturning
    );

  const hasContinuity =
    Boolean(
      memoryProjectCompatible &&
      (
        returnPoint ||
        previousSummary ||
        returning ||
        context.sessionHandoff
      )
    );

  const prefersConcise =
    includesAny(
      responseDepth,
      [
        "minimal",
        "short",
        "concise",
        "brief",
        "direct",
      ]
    );

  const prefersDetail =
    includesAny(
      responseDepth,
      [
        "detailed",
        "deep",
        "thorough",
        "comprehensive",
      ]
    );

  const prefersOneStep =
    includesAny(
      (
        `${guidanceStyle} ` +
        `${pacingPreference}`
      ),
      [
        "one step",
        "one-step",
        "step by step",
        "step-by-step",
        "single step",
        "small step",
      ]
    );

  const prefersLeadership =
    includesAny(
      (
        `${guidanceStyle} ` +
        `${autonomyPreference}`
      ),
      [
        "lead",
        "guided",
        "guide me",
        "recommend",
        "mentor-led",
      ]
    );

  const prefersAutonomy =
    includesAny(
      (
        `${guidanceStyle} ` +
        `${autonomyPreference}`
      ),
      [
        "independent",
        "autonomous",
        "creator-led",
        "i'll do it",
        "ill do it",
        "options",
      ]
    );

  const prefersAction =
    includesAny(
      (
        `${guidanceStyle} ` +
        `${buildModePreference}`
      ),
      [
        "build",
        "action",
        "implementation",
        "direct",
        "doing",
        "create",
      ]
    );

  const learnsByExample =
    includesAny(
      learningStyle,
      [
        "example",
        "demonstration",
        "show me",
        "visual",
        "learn by doing",
        "doing",
      ]
    );

  const sensitiveToOverload =
    includesAny(
      overloadSensitivity,
      [
        "low",
        "sensitive",
        "easily overloaded",
        "one thing",
        "concise",
        "short",
      ]
    );

  return {
    available:
      Object.keys(
        memory
      ).length > 0,

    raw:
      memory,

    responseDepth,

    guidanceStyle,

    learningStyle,

    pacingPreference,

    autonomyPreference,

    overloadSensitivity,

    buildModePreference,

    prefersConcise,

    prefersDetail,

    prefersOneStep,

    prefersLeadership,

    prefersAutonomy,

    prefersAction,

    learnsByExample,

    sensitiveToOverload,

    hasContinuity,

    returnPoint,

    previousSummary,

    activeProjectId,

    memoryProjectId,

    memoryProjectCompatible,
  };
}

function detectExplicitDirection({
  message,
  context,
}) {
  const text =
    normaliseText(
      message
    );

  const continuePhrases = [
    "continue",
    "carry on",
    "keep going",
    "go on",
    "fire away",
    "next",
    "next task",
    "next file",
    "let's go",
    "lets go",
    "you lead",
    "warp 20",
    "warp 40",
  ];

  const createPhrases = [
    "let's build",
    "lets build",
    "let's create",
    "lets create",
    "generate it",
    "make it",
    "write it",
    "code please",
    "give me the code",
    "start creating",
  ];

  const pausePhrases = [
    "let's stop",
    "lets stop",
    "pause here",
    "anchor here",
    "i'll come back",
    "ill come back",
    "i'll be back",
    "ill be back",
    "later",
    "tomorrow",
    "need a break",
    "need to sleep",
    "going to bed",
    "goodnight",
  ];

  const stopPhrases = [
    "that's enough",
    "thats enough",
    "stop",
    "not now",
    "leave it there",
    "end here",
  ];

  if (
    context
      ?.creatorExplicitlyAskedToPause ||
    includesAny(
      text,
      pausePhrases
    )
  ) {
    return createDetection({
      value: "pause",

      confidence: 0.96,

      evidence:
        uniqueValues([
          ...pausePhrases
            .filter(
              (phrase) =>
                text.includes(
                  phrase
                )
            ),

          context
            ?.creatorExplicitlyAskedToPause
            ? "explicit pause signal"
            : null,
        ]),
    });
  }

  if (
    context
      ?.creatorExplicitlyAskedToStop ||
    includesAny(
      text,
      stopPhrases
    )
  ) {
    return createDetection({
      value: "stop",

      confidence: 0.96,

      evidence:
        uniqueValues([
          ...stopPhrases
            .filter(
              (phrase) =>
                text.includes(
                  phrase
                )
            ),

          context
            ?.creatorExplicitlyAskedToStop
            ? "explicit stop signal"
            : null,
        ]),
    });
  }

  if (
    context
      ?.creatorExplicitlyAskedToCreate ||
    includesAny(
      text,
      createPhrases
    )
  ) {
    return createDetection({
      value: "create",

      confidence: 0.94,

      evidence:
        uniqueValues([
          ...createPhrases
            .filter(
              (phrase) =>
                text.includes(
                  phrase
                )
            ),

          context
            ?.creatorExplicitlyAskedToCreate
            ? "explicit creation signal"
            : null,
        ]),
    });
  }

  if (
    context
      ?.creatorExplicitlyAskedToContinue ||
    context
      ?.creatorExplicitlyAskedForNextStep ||
    includesAny(
      text,
      continuePhrases
    )
  ) {
    return createDetection({
      value: "continue",

      confidence: 0.9,

      evidence:
        uniqueValues([
          ...continuePhrases
            .filter(
              (phrase) =>
                text.includes(
                  phrase
                )
            ),

          context
            ?.creatorExplicitlyAskedForNextStep
            ? "explicit next-step signal"
            : null,
        ]),
    });
  }

  return createDetection({
    value: "none",

    confidence: 0.4,

    evidence: [],
  });
}

function detectMemoryControlState({
  context,
  reflectionPlan,
}) {
  const reflectionDecision =
    cleanString(
      reflectionPlan
        ?.decision
    );

  const memoryAction =
    cleanString(
      context
        ?.memoryAction
    );

  const forgetRequested =
    Boolean(
      context
        ?.forgetRequested
    );

  const requiresClarification =
    Boolean(
      context
        ?.forgetRequiresClarification
    );

  const persistencePending =
    Boolean(
      context
        ?.memoryPersistencePending ||
      context
        ?.memoryActionPending
    );

  const reflectionYield =
    REFLECTION_MEMORY_DECISIONS
      .includes(
        reflectionDecision
      );

  const recognisedAction =
    MEMORY_CONTROL_ACTIONS
      .includes(
        memoryAction
      );

  const active =
    forgetRequested ||
    requiresClarification ||
    persistencePending ||
    reflectionYield ||
    recognisedAction;

  return createDetection({
    value: active,

    confidence:
      active
        ? 0.98
        : 0.3,

    evidence:
      uniqueValues([
        forgetRequested
          ? "forget request active"
          : null,

        requiresClarification
          ? "forget request requires clarification"
          : null,

        persistencePending
          ? "memory persistence operation pending"
          : null,

        reflectionYield
          ? "ReflectionEngine yielded to memory action"
          : null,

        recognisedAction
          ? `memory action: ${memoryAction}`
          : null,
      ]),

    metadata: {
      memoryAction:
        memoryAction ||
        null,

      forgetRequested,

      requiresClarification,

      persistencePending,
    },
  });
}

function detectSessionPhase({
  message,
  context,
  conversationPlan,
  reflectionPlan,
  memorySignals,
  explicitDirection,
  memoryControlState,
}) {
  const text =
    normaliseText(
      message
    );

  const conversationMode =
    conversationPlan
      ?.conversation
      ?.mode;

  const reflectionDecision =
    reflectionPlan
      ?.decision;

  if (
    memoryControlState
      .value
  ) {
    return createDetection({
      value:
        SESSION_PHASES
          .MEMORY_CONTROL,

      confidence: 0.98,

      evidence:
        memoryControlState
          .evidence,
    });
  }

  if (
    explicitDirection.value ===
      "pause" ||
    context
      ?.creatorExplicitlyAskedToPause
  ) {
    return createDetection({
      value:
        SESSION_PHASES
          .PAUSING,

      confidence: 0.96,

      evidence: [
        "creator explicitly requested pause",
      ],
    });
  }

  if (
    explicitDirection.value ===
      "stop"
  ) {
    return createDetection({
      value:
        SESSION_PHASES
          .CLOSING,

      confidence: 0.96,

      evidence: [
        "creator explicitly requested stop",
      ],
    });
  }

  if (
    conversationMode ===
      "returning" ||
    conversationMode ===
      "project-continuity" ||
    context
      ?.returningCreator ||
    context
      ?.returningToProject ||
    context
      ?.creatorIsReturning ||
    (
      memorySignals
        ?.hasContinuity &&
      context
        ?.creatorMessageCount <=
        1
    )
  ) {
    return createDetection({
      value:
        SESSION_PHASES
          .RETURNING,

      confidence: 0.88,

      evidence: [
        "creator continuity context detected",
      ],
    });
  }

  if (
    conversationMode ===
      "publishing" ||
    context
      ?.projectReadyToPublish
  ) {
    return createDetection({
      value:
        SESSION_PHASES
          .PUBLISHING,

      confidence: 0.88,

      evidence: [
        "publishing state detected",
      ],
    });
  }

  if (
    conversationMode ===
      "refinement" ||
    context
      ?.projectReadyToRefine
  ) {
    return createDetection({
      value:
        SESSION_PHASES
          .REFINING,

      confidence: 0.86,

      evidence: [
        "refinement state detected",
      ],
    });
  }

  if (
    context
      ?.thinkingMode ===
      "build" ||
    includesAny(
      text,
      [
        "next file",
        "next task",
        "full replacement",
        "commit",
        "warp 20",
        "warp 40",
      ]
    )
  ) {
    return createDetection({
      value:
        SESSION_PHASES
          .BUILDING,

      confidence: 0.88,

      evidence: [
        "build mode detected",
      ],
    });
  }

  if (
    conversationMode ===
      "creation" ||
    context
      ?.projectReadyToGenerate ||
    includesAny(
      text,
      [
        "let's build",
        "lets build",
        "create it",
        "generate it",
        "make it",
        "write it",
      ]
    )
  ) {
    return createDetection({
      value:
        SESSION_PHASES
          .CREATING,

      confidence: 0.84,

      evidence: [
        "creation state detected",
      ],
    });
  }

  if (
    conversationMode ===
      "learning"
  ) {
    return createDetection({
      value:
        SESSION_PHASES
          .LEARNING,

      confidence: 0.82,

      evidence: [
        "learning mode detected",
      ],
    });
  }

  if (
    conversationMode ===
      "reflection" ||
    reflectionDecision ===
      "reflect"
  ) {
    return createDetection({
      value:
        SESSION_PHASES
          .REFLECTING,

      confidence: 0.82,

      evidence: [
        "reflection state detected",
      ],
    });
  }

  if (
    conversationMode ===
      "recovery" ||
    reflectionDecision ===
      "release-pressure"
  ) {
    return createDetection({
      value:
        SESSION_PHASES
          .RECOVERING,

      confidence: 0.84,

      evidence: [
        "recovery state detected",
      ],
    });
  }

  if (
    conversationMode ===
      "imagination" ||
    conversationMode ===
      "discovery" ||
    includesAny(
      text,
      [
        "what if",
        "imagine",
        "could we",
        "i wonder",
        "maybe",
        "perhaps",
      ]
    )
  ) {
    return createDetection({
      value:
        SESSION_PHASES
          .BRAINSTORMING,

      confidence: 0.78,

      evidence: [
        "exploratory language detected",
      ],
    });
  }

  if (
    context
      ?.creatorMessageCount <=
      1 &&
    context
      ?.mentorMessageCount <=
      1
  ) {
    return createDetection({
      value:
        SESSION_PHASES
          .OPENING,

      confidence: 0.72,

      evidence: [
        "early conversation",
      ],
    });
  }

  return createDetection({
    value:
      SESSION_PHASES
        .DISCOVERING,

    confidence: 0.58,

    evidence: [],
  });
}

function detectCreatorEnergy({
  message,
  context,
  reflectionPlan,
}) {
  if (
    context
      ?.creatorEnergy &&
    Object.values(
      CREATOR_ENERGY_STATES
    ).includes(
      context
        .creatorEnergy
    )
  ) {
    return createDetection({
      value:
        context
          .creatorEnergy,

      confidence: 0.92,

      evidence: [
        "supplied current creator energy",
      ],
    });
  }

  const text =
    normaliseText(
      message
    );

  const highEnergyPhrases = [
    "let's go",
    "lets go",
    "fire away",
    "amazing",
    "brilliant",
    "excited",
    "can't wait",
    "cannot wait",
    "i have an idea",
    "keep going",
    "next",
    "warp 20",
    "warp 40",
  ];

  const lowEnergyPhrases = [
    "tired",
    "exhausted",
    "drained",
    "can't concentrate",
    "cant concentrate",
    "need a break",
    "need to sleep",
    "going to bed",
    "head is full",
    "too much",
  ];

  const depletedPhrases = [
    "i can't continue",
    "i cant continue",
    "completely exhausted",
    "done for tonight",
    "i need to stop",
  ];

  if (
    includesAny(
      text,
      depletedPhrases
    )
  ) {
    return createDetection({
      value:
        CREATOR_ENERGY_STATES
          .DEPLETED,

      confidence: 0.92,

      evidence:
        depletedPhrases
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
      lowEnergyPhrases
    )
  ) {
    return createDetection({
      value:
        CREATOR_ENERGY_STATES
          .LOW,

      confidence: 0.86,

      evidence:
        lowEnergyPhrases
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
      highEnergyPhrases
    )
  ) {
    return createDetection({
      value:
        CREATOR_ENERGY_STATES
          .HIGH,

      confidence: 0.84,

      evidence:
        highEnergyPhrases
          .filter(
            (phrase) =>
              text.includes(
                phrase
              )
          ),
    });
  }

  if (
    reflectionPlan
      ?.creatorState
      ?.thinkingMode
      ?.value ===
      "recovery"
  ) {
    return createDetection({
      value:
        CREATOR_ENERGY_STATES
          .RECOVERING,

      confidence: 0.7,

      evidence: [
        "recovery mode detected",
      ],
    });
  }

  const messageLength =
    cleanString(
      message
    ).length;

  if (
    messageLength >
      350 ||
    safeNumber(
      context
        ?.consecutiveLongCreatorReplies
    ) >= 2
  ) {
    return createDetection({
      value:
        CREATOR_ENERGY_STATES
          .MEDIUM,

      confidence: 0.58,

      evidence: [
        "sustained creator engagement",
      ],
    });
  }

  return createDetection({
    value:
      CREATOR_ENERGY_STATES
        .UNKNOWN,

    confidence: 0.4,

    evidence: [],
  });
}

function detectInformationSaturation({
  message,
  context,
  memorySignals,
}) {
  if (
    context
      ?.informationSaturation &&
    Object.values(
      INFORMATION_SATURATION
    ).includes(
      context
        .informationSaturation
    )
  ) {
    return createDetection({
      value:
        context
          .informationSaturation,

      confidence: 0.92,

      evidence: [
        "supplied current information saturation",
      ],
    });
  }

  const text =
    normaliseText(
      message
    );

  const recentMentorText =
    normaliseText(
      getRecentMentorText(
        context
      )
    );

  const overloadPhrases = [
    "too much information",
    "that's a lot",
    "thats a lot",
    "slow down",
    "one thing at a time",
    "my head is full",
    "i'm lost",
    "im lost",
    "too many options",
    "just give me the next step",
    "just the facts",
  ];

  const saturationPhrases = [
    "okay",
    "right",
    "got it",
    "makes sense",
    "i understand",
    "let's move on",
    "lets move on",
    "next",
  ];

  if (
    includesAny(
      text,
      overloadPhrases
    )
  ) {
    return createDetection({
      value:
        INFORMATION_SATURATION
          .OVERLOADED,

      confidence: 0.92,

      evidence:
        overloadPhrases
          .filter(
            (phrase) =>
              text.includes(
                phrase
              )
          ),
    });
  }

  const mentorWordCount =
    recentMentorText
      .split(" ")
      .filter(Boolean)
      .length;

  if (
    mentorWordCount >
      900 ||
    safeNumber(
      context
        ?.consecutiveMentorMessages
    ) >= 3
  ) {
    return createDetection({
      value:
        INFORMATION_SATURATION
          .HIGH,

      confidence: 0.76,

      evidence: [
        "large volume of recent Mentor information",
      ],
    });
  }

  if (
    memorySignals
      ?.sensitiveToOverload &&
    mentorWordCount >
      300
  ) {
    return createDetection({
      value:
        INFORMATION_SATURATION
          .MEDIUM,

      confidence: 0.68,

      evidence: [
        "creator preference suggests lower information tolerance",
      ],
    });
  }

  if (
    mentorWordCount >
      450 ||
    includesAny(
      text,
      saturationPhrases
    )
  ) {
    return createDetection({
      value:
        INFORMATION_SATURATION
          .MEDIUM,

      confidence: 0.64,

      evidence:
        saturationPhrases
          .filter(
            (phrase) =>
              text.includes(
                phrase
              )
          ),
    });
  }

  return createDetection({
    value:
      INFORMATION_SATURATION
        .LOW,

    confidence: 0.58,

    evidence: [],
  });
}

function detectGuidanceWindow({
  message,
  context,
  reflectionPlan,
  creatorEnergy,
  informationSaturation,
  memorySignals,
  explicitDirection,
}) {
  if (
    context
      ?.guidanceWindow &&
    Object.values(
      GUIDANCE_WINDOWS
    ).includes(
      context
        .guidanceWindow
    )
  ) {
    return createDetection({
      value:
        context
          .guidanceWindow,

      confidence: 0.94,

      evidence: [
        "supplied current guidance window",
      ],
    });
  }

  const text =
    normaliseText(
      message
    );

  const openPhrases = [
    "you lead",
    "guide me",
    "what do you recommend",
    "what's next",
    "whats next",
    "show me",
    "teach me",
    "help me",
    "next step",
  ];

  const closedPhrases = [
    "let me think",
    "let me finish",
    "one second",
    "hold on",
    "i've got this",
    "ive got this",
    "don't interrupt",
    "dont interrupt",
  ];

  if (
    context
      ?.creatorExplicitlyAskedForGuidance ||
    context
      ?.creatorExplicitlyAskedForHelp ||
    includesAny(
      text,
      openPhrases
    )
  ) {
    return createDetection({
      value:
        GUIDANCE_WINDOWS
          .WIDE_OPEN,

      confidence: 0.94,

      evidence:
        openPhrases
          .filter(
            (phrase) =>
              text.includes(
                phrase
              )
          ),
    });
  }

  if (
    explicitDirection.value ===
      "pause" ||
    explicitDirection.value ===
      "stop" ||
    includesAny(
      text,
      closedPhrases
    ) ||
    REFLECTION_HOLD_DECISIONS
      .includes(
        reflectionPlan
          ?.decision
      )
  ) {
    return createDetection({
      value:
        GUIDANCE_WINDOWS
          .CLOSED_FOR_NOW,

      confidence: 0.92,

      evidence:
        uniqueValues([
          ...closedPhrases
            .filter(
              (phrase) =>
                text.includes(
                  phrase
                )
            ),

          reflectionPlan
            ?.decision ||
            null,

          explicitDirection
            .value ===
            "pause"
            ? "creator pausing"
            : null,

          explicitDirection
            .value ===
            "stop"
            ? "creator stopping"
            : null,
        ]),
    });
  }

  if (
    informationSaturation
      .value ===
      INFORMATION_SATURATION
        .HIGH ||
    informationSaturation
      .value ===
      INFORMATION_SATURATION
        .OVERLOADED
  ) {
    return createDetection({
      value:
        GUIDANCE_WINDOWS
          .NARROW,

      confidence: 0.84,

      evidence: [
        "information saturation is high",
      ],
    });
  }

  if (
    explicitDirection.value ===
      "create" ||
    explicitDirection.value ===
      "continue"
  ) {
    return createDetection({
      value:
        GUIDANCE_WINDOWS
          .PARTIALLY_OPEN,

      confidence: 0.86,

      evidence: [
        "creator requested forward movement",
      ],

      metadata: {
        practicalGuidanceOnly:
          true,
      },
    });
  }

  if (
    memorySignals
      ?.prefersLeadership &&
    creatorEnergy.value !==
      CREATOR_ENERGY_STATES
        .LOW &&
    creatorEnergy.value !==
      CREATOR_ENERGY_STATES
        .DEPLETED
  ) {
    return createDetection({
      value:
        GUIDANCE_WINDOWS
          .WIDE_OPEN,

      confidence: 0.64,

      evidence: [
        "creator preference supports Mentor leadership",
      ],
    });
  }

  if (
    memorySignals
      ?.prefersAutonomy
  ) {
    return createDetection({
      value:
        GUIDANCE_WINDOWS
          .PARTIALLY_OPEN,

      confidence: 0.64,

      evidence: [
        "creator preference supports creator-led work",
      ],
    });
  }

  if (
    creatorEnergy.value ===
      CREATOR_ENERGY_STATES
        .HIGH
  ) {
    return createDetection({
      value:
        GUIDANCE_WINDOWS
          .PARTIALLY_OPEN,

      confidence: 0.68,

      evidence: [
        "creator has strong active energy",
      ],
    });
  }

  return createDetection({
    value:
      GUIDANCE_WINDOWS
        .PARTIALLY_OPEN,

    confidence: 0.54,

    evidence: [],
  });
}

function detectMomentum({
  message,
  context,
  creatorEnergy,
  sessionPhase,
  explicitDirection,
}) {
  if (
    context
      ?.momentum &&
    Object.values(
      MOMENTUM_STATES
    ).includes(
      context.momentum
    )
  ) {
    return createDetection({
      value:
        context.momentum,

      confidence: 0.9,

      evidence: [
        "supplied current momentum",
      ],
    });
  }

  const text =
    normaliseText(
      message
    );

  const risingPhrases = [
    "i have an idea",
    "i've got it",
    "ive got it",
    "yes",
    "exactly",
    "that's it",
    "thats it",
    "let's go",
    "lets go",
    "next",
    "keep going",
    "warp 20",
    "warp 40",
  ];

  const slowingPhrases = [
    "not sure",
    "maybe",
    "i don't know",
    "i dont know",
    "hmm",
    "need to think",
    "getting tired",
  ];

  const stalledPhrases = [
    "stuck",
    "blocked",
    "nothing is coming",
    "i've lost it",
    "ive lost it",
    "can't continue",
    "cant continue",
  ];

  if (
    explicitDirection.value ===
      "pause" ||
    explicitDirection.value ===
      "stop"
  ) {
    return createDetection({
      value:
        MOMENTUM_STATES
          .SLOWING,

      confidence: 0.84,

      evidence: [
        "creator is ending or pausing the current work period",
      ],
    });
  }

  if (
    includesAny(
      text,
      stalledPhrases
    )
  ) {
    return createDetection({
      value:
        MOMENTUM_STATES
          .STALLED,

      confidence: 0.88,

      evidence:
        stalledPhrases
          .filter(
            (phrase) =>
              text.includes(
                phrase
              )
          ),
    });
  }

  if (
    creatorEnergy.value ===
      CREATOR_ENERGY_STATES
        .RECOVERING ||
    sessionPhase.value ===
      SESSION_PHASES
        .RECOVERING
  ) {
    return createDetection({
      value:
        MOMENTUM_STATES
          .RECOVERING,

      confidence: 0.74,

      evidence: [
        "recovery state detected",
      ],
    });
  }

  if (
    explicitDirection.value ===
      "continue" ||
    explicitDirection.value ===
      "create" ||
    includesAny(
      text,
      risingPhrases
    )
  ) {
    return createDetection({
      value:
        MOMENTUM_STATES
          .RISING,

      confidence: 0.84,

      evidence:
        uniqueValues([
          ...risingPhrases
            .filter(
              (phrase) =>
                text.includes(
                  phrase
                )
            ),

          explicitDirection
            .value !==
            "none"
            ? `creator requested ${explicitDirection.value}`
            : null,
        ]),
    });
  }

  if (
    creatorEnergy.value ===
      CREATOR_ENERGY_STATES
        .HIGH &&
    [
      SESSION_PHASES
        .CREATING,

      SESSION_PHASES
        .BUILDING,

      SESSION_PHASES
        .BRAINSTORMING,
    ].includes(
      sessionPhase.value
    )
  ) {
    return createDetection({
      value:
        MOMENTUM_STATES
          .STRONG,

      confidence: 0.8,

      evidence: [
        "high energy during active creative phase",
      ],
    });
  }

  if (
    includesAny(
      text,
      slowingPhrases
    ) ||
    creatorEnergy.value ===
      CREATOR_ENERGY_STATES
        .LOW
  ) {
    return createDetection({
      value:
        MOMENTUM_STATES
          .SLOWING,

      confidence: 0.7,

      evidence:
        slowingPhrases
          .filter(
            (phrase) =>
              text.includes(
                phrase
              )
          ),
    });
  }

  return createDetection({
    value:
      MOMENTUM_STATES
        .STABLE,

    confidence: 0.54,

    evidence: [],
  });
}

function detectReadiness({
  context,
  conversationPlan,
}) {
  const unresolvedQuestions =
    asArray(
      context
        ?.unresolvedQuestions
    );

  const plannerMode =
    conversationPlan
      ?.conversation
      ?.mode;

  const readyToCreate =
    Boolean(
      context
        ?.projectReadyToGenerate ||
      context
        ?.minimumCreationContextReady ||
      context
        ?.requiredInformationComplete
    ) &&
    unresolvedQuestions.length <=
      1;

  const readyToRefine =
    Boolean(
      context
        ?.projectReadyToRefine ||
      plannerMode ===
        "refinement"
    );

  const readyToPublish =
    Boolean(
      context
        ?.projectReadyToPublish ||
      plannerMode ===
        "publishing"
    );

  return {
    readyToCreate,

    readyToRefine,

    readyToPublish,

    unresolvedQuestionCount:
      unresolvedQuestions.length,

    enoughKnownToAdvance:
      Boolean(
        readyToCreate ||
        readyToRefine ||
        readyToPublish ||
        context
          ?.requiredInformationComplete
      ),
  };
}

function detectBriefDetour(
  context,
  reflectionPlan
) {
  return Boolean(
    context
      ?.briefDetour ||
    reflectionPlan
      ?.creatorState
      ?.briefDetour
      ?.value ||
    reflectionPlan
      ?.decision ===
      "acknowledge-detour"
  );
}

function detectCorrectionState(
  context,
  reflectionPlan
) {
  return Boolean(
    context
      ?.correctionSignal ||
    reflectionPlan
      ?.creatorState
      ?.correctionSignal
      ?.value
  );
}

function chooseProgressionDecision({
  explicitDirection,
  sessionPhase,
  creatorEnergy,
  informationSaturation,
  guidanceWindow,
  momentum,
  readiness,
  reflectionPlan,
  context,
  memorySignals,
  memoryControlState,
  briefDetour,
}) {
  const reflectionDecision =
    reflectionPlan
      ?.decision;

  /**
   * Explicit memory control suspends unrelated progression.
   */
  if (
    memoryControlState.value
  ) {
    if (
      memoryControlState
        .metadata
        ?.requiresClarification
    ) {
      return (
        PROGRESSION_DECISIONS
          .WAIT_FOR_MEMORY_CLARIFICATION
      );
    }

    return (
      PROGRESSION_DECISIONS
        .YIELD_TO_MEMORY_ACTION
    );
  }

  /**
   * Creator-controlled session boundaries outrank everything.
   */
  if (
    explicitDirection.value ===
      "pause"
  ) {
    return (
      PROGRESSION_DECISIONS
        .PAUSE_SESSION
    );
  }

  if (
    explicitDirection.value ===
      "stop"
  ) {
    return (
      PROGRESSION_DECISIONS
        .END_SESSION_POSITIVELY
    );
  }

  if (
    reflectionDecision ===
      "preserve-handoff"
  ) {
    return (
      PROGRESSION_DECISIONS
        .PRESERVE_HANDOFF
    );
  }

  /**
   * ReflectionEngine may deliberately step aside.
   */
  if (
    REFLECTION_EXECUTION_DECISIONS
      .includes(
        reflectionDecision
      )
  ) {
    if (
      explicitDirection.value ===
        "create" ||
      sessionPhase.value ===
        SESSION_PHASES
          .CREATING
    ) {
      return (
        PROGRESSION_DECISIONS
          .MOVE_TO_CREATION
      );
    }

    if (
      sessionPhase.value ===
        SESSION_PHASES
          .REFINING
    ) {
      return (
        PROGRESSION_DECISIONS
          .MOVE_TO_REFINEMENT
      );
    }

    if (
      sessionPhase.value ===
        SESSION_PHASES
          .PUBLISHING
    ) {
      return (
        PROGRESSION_DECISIONS
          .MOVE_TO_PUBLISHING
      );
    }

    return (
      PROGRESSION_DECISIONS
        .YIELD_TO_EXECUTION
    );
  }

  if (
    briefDetour
  ) {
    return (
      PROGRESSION_DECISIONS
        .ACKNOWLEDGE_DETOUR
    );
  }

  if (
    creatorEnergy.value ===
      CREATOR_ENERGY_STATES
        .DEPLETED
  ) {
    return (
      PROGRESSION_DECISIONS
        .END_SESSION_POSITIVELY
    );
  }

  if (
    REFLECTION_HOLD_DECISIONS
      .includes(
        reflectionDecision
      )
  ) {
    return (
      PROGRESSION_DECISIONS
        .HOLD_SPACE
    );
  }

  if (
    reflectionDecision ===
      "restore-context"
  ) {
    return (
      PROGRESSION_DECISIONS
        .RESTORE_CONTEXT
    );
  }

  if (
    sessionPhase.value ===
      SESSION_PHASES
        .RETURNING &&
    memorySignals
      ?.hasContinuity &&
    explicitDirection.value ===
      "none"
  ) {
    return (
      PROGRESSION_DECISIONS
        .RESTORE_CONTEXT
    );
  }

  if (
    reflectionDecision ===
      "release-pressure"
  ) {
    return (
      PROGRESSION_DECISIONS
        .RELEASE_PRESSURE
    );
  }

  if (
    informationSaturation
      .value ===
      INFORMATION_SATURATION
        .OVERLOADED
  ) {
    return (
      PROGRESSION_DECISIONS
        .REDUCE_INFORMATION
    );
  }

  if (
    explicitDirection.value ===
      "create"
  ) {
    if (
      readiness.readyToPublish
    ) {
      return (
        PROGRESSION_DECISIONS
          .MOVE_TO_PUBLISHING
      );
    }

    if (
      readiness.readyToRefine
    ) {
      return (
        PROGRESSION_DECISIONS
          .MOVE_TO_REFINEMENT
      );
    }

    return (
      PROGRESSION_DECISIONS
        .MOVE_TO_CREATION
    );
  }

  if (
    explicitDirection.value ===
      "continue" &&
    (
      sessionPhase.value ===
        SESSION_PHASES
          .BUILDING ||
      context
        ?.creatorExplicitlyAskedForNextStep ||
      memorySignals
        ?.prefersAction
    )
  ) {
    return (
      PROGRESSION_DECISIONS
        .MOVE_TO_NEXT_TASK
    );
  }

  if (
    readiness.readyToPublish &&
    guidanceWindow.value !==
      GUIDANCE_WINDOWS
        .CLOSED_FOR_NOW
  ) {
    return (
      PROGRESSION_DECISIONS
        .MOVE_TO_PUBLISHING
    );
  }

  if (
    readiness.readyToRefine &&
    sessionPhase.value ===
      SESSION_PHASES
        .REFINING
  ) {
    return (
      PROGRESSION_DECISIONS
        .MOVE_TO_REFINEMENT
    );
  }

  if (
    readiness.readyToCreate &&
    (
      momentum.value ===
        MOMENTUM_STATES
          .RISING ||
      momentum.value ===
        MOMENTUM_STATES
          .STRONG ||
      sessionPhase.value ===
        SESSION_PHASES
          .CREATING
    )
  ) {
    return (
      PROGRESSION_DECISIONS
        .MOVE_TO_CREATION
    );
  }

  if (
    informationSaturation
      .value ===
      INFORMATION_SATURATION
        .HIGH ||
    guidanceWindow.value ===
      GUIDANCE_WINDOWS
        .NARROW ||
    memorySignals
      ?.prefersOneStep
  ) {
    return (
      PROGRESSION_DECISIONS
        .OFFER_ONE_SMALL_STEP
    );
  }

  if (
    momentum.value ===
      MOMENTUM_STATES
        .STALLED
  ) {
    return (
      PROGRESSION_DECISIONS
        .OFFER_ONE_SMALL_STEP
    );
  }

  if (
    creatorEnergy.value ===
      CREATOR_ENERGY_STATES
        .LOW ||
    momentum.value ===
      MOMENTUM_STATES
        .SLOWING
  ) {
    return (
      PROGRESSION_DECISIONS
        .SAVE_AND_RETURN_LATER
    );
  }

  if (
    sessionPhase.value ===
      SESSION_PHASES
        .BRAINSTORMING &&
    guidanceWindow.value !==
      GUIDANCE_WINDOWS
        .CLOSED_FOR_NOW
  ) {
    return (
      PROGRESSION_DECISIONS
        .CONTINUE_EXPLORING
    );
  }

  if (
    sessionPhase.value ===
      SESSION_PHASES
        .LEARNING
  ) {
    return (
      PROGRESSION_DECISIONS
        .CONTINUE_LEARNING
    );
  }

  if (
    guidanceWindow.value ===
      GUIDANCE_WINDOWS
        .CLOSED_FOR_NOW
  ) {
    return (
      PROGRESSION_DECISIONS
        .WAIT_FOR_CREATOR
    );
  }

  return (
    PROGRESSION_DECISIONS
      .CONTINUE_LISTENING
  );
}

function choosePrimaryAction(
  decision
) {
  switch (decision) {
    case PROGRESSION_DECISIONS
      .CONTINUE_LISTENING:
      return (
        PROGRESSION_ACTIONS
          .INVITE_CREATOR_TO_CONTINUE
      );

    case PROGRESSION_DECISIONS
      .CONTINUE_EXPLORING:

    case PROGRESSION_DECISIONS
      .CONTINUE_LEARNING:
      return (
        PROGRESSION_ACTIONS
          .ASK_ONE_MORE_QUESTION
      );

    case PROGRESSION_DECISIONS
      .HOLD_SPACE:

    case PROGRESSION_DECISIONS
      .WAIT_FOR_CREATOR:
      return (
        PROGRESSION_ACTIONS
          .WAIT_WITHOUT_NEW_DIRECTION
      );

    case PROGRESSION_DECISIONS
      .REDUCE_INFORMATION:
      return (
        PROGRESSION_ACTIONS
          .DO_NOT_ADD_MORE_INFORMATION
      );

    case PROGRESSION_DECISIONS
      .OFFER_ONE_SMALL_STEP:
      return (
        PROGRESSION_ACTIONS
          .REDUCE_TO_ONE_RECOMMENDATION
      );

    case PROGRESSION_DECISIONS
      .MOVE_TO_CREATION:
      return (
        PROGRESSION_ACTIONS
          .BEGIN_GENERATION
      );

    case PROGRESSION_DECISIONS
      .MOVE_TO_NEXT_TASK:
      return (
        PROGRESSION_ACTIONS
          .BEGIN_NEXT_CREATIVE_STEP
      );

    case PROGRESSION_DECISIONS
      .MOVE_TO_REFINEMENT:
      return (
        PROGRESSION_ACTIONS
          .BEGIN_REFINEMENT
      );

    case PROGRESSION_DECISIONS
      .MOVE_TO_PUBLISHING:
      return (
        PROGRESSION_ACTIONS
          .BEGIN_PUBLISHING
      );

    case PROGRESSION_DECISIONS
      .RESTORE_CONTEXT:
      return (
        PROGRESSION_ACTIONS
          .RECAP_CONTEXT
      );

    case PROGRESSION_DECISIONS
      .RELEASE_PRESSURE:
      return (
        PROGRESSION_ACTIONS
          .RELEASE_EXPECTATION
      );

    case PROGRESSION_DECISIONS
      .SAVE_AND_RETURN_LATER:

    case PROGRESSION_DECISIONS
      .PAUSE_SESSION:
      return (
        PROGRESSION_ACTIONS
          .SAVE_CURRENT_PROGRESS
      );

    case PROGRESSION_DECISIONS
      .PRESERVE_HANDOFF:
      return (
        PROGRESSION_ACTIONS
          .PRESERVE_SESSION_HANDOFF
      );

    case PROGRESSION_DECISIONS
      .END_SESSION_POSITIVELY:
      return (
        PROGRESSION_ACTIONS
          .CLOSE_WITH_OPEN_DOOR
      );

    case PROGRESSION_DECISIONS
      .ACKNOWLEDGE_DETOUR:
      return (
        PROGRESSION_ACTIONS
          .ACKNOWLEDGE_AND_RETURN
      );

    case PROGRESSION_DECISIONS
      .YIELD_TO_EXECUTION:
      return (
        PROGRESSION_ACTIONS
          .YIELD_TO_EXECUTION
      );

    case PROGRESSION_DECISIONS
      .YIELD_TO_MEMORY_ACTION:
      return (
        PROGRESSION_ACTIONS
          .YIELD_TO_MEMORY_ACTION
      );

    case PROGRESSION_DECISIONS
      .WAIT_FOR_MEMORY_CLARIFICATION:
      return (
        PROGRESSION_ACTIONS
          .REQUEST_MEMORY_CLARIFICATION
      );

    default:
      return (
        PROGRESSION_ACTIONS
          .GIVE_SHORT_ACKNOWLEDGEMENT
      );
  }
}

function chooseSupportingActions({
  decision,
  context,
  memorySignals,
}) {
  const actions = [];

  if (
    [
      PROGRESSION_DECISIONS
        .SAVE_AND_RETURN_LATER,

      PROGRESSION_DECISIONS
        .PAUSE_SESSION,

      PROGRESSION_DECISIONS
        .PRESERVE_HANDOFF,
    ].includes(
      decision
    )
  ) {
    actions.push(
      PROGRESSION_ACTIONS
        .SUMMARISE_WHAT_IS_READY
    );
  }

  if (
    decision ===
      PROGRESSION_DECISIONS
        .RELEASE_PRESSURE &&
    context
      ?.activeIdea
  ) {
    actions.push(
      PROGRESSION_ACTIONS
        .OFFER_INSPIRATION_DRAWER
    );
  }

  if (
    decision ===
      PROGRESSION_DECISIONS
        .RESTORE_CONTEXT &&
    memorySignals
      ?.hasContinuity
  ) {
    actions.push(
      PROGRESSION_ACTIONS
        .RESTORE_CREATOR_WORKING_MODE
    );
  }

  if (
    [
      PROGRESSION_DECISIONS
        .END_SESSION_POSITIVELY,

      PROGRESSION_DECISIONS
        .PAUSE_SESSION,

      PROGRESSION_DECISIONS
        .PRESERVE_HANDOFF,
    ].includes(
      decision
    )
  ) {
    actions.push(
      PROGRESSION_ACTIONS
        .CLOSE_WITH_OPEN_DOOR
    );
  }

  return uniqueValues(
    actions
  );
}

function normaliseResponseLengthPreference(
  value
) {
  const preference =
    normalisePreference(
      value
    );

  if (
    includesAny(
      preference,
      [
        "silent",
      ]
    )
  ) {
    return (
      RESPONSE_LENGTHS
        .SILENT
    );
  }

  if (
    includesAny(
      preference,
      [
        "minimal",
        "very short",
      ]
    )
  ) {
    return (
      RESPONSE_LENGTHS
        .MINIMAL
    );
  }

  if (
    includesAny(
      preference,
      [
        "short",
        "concise",
        "brief",
        "direct",
      ]
    )
  ) {
    return (
      RESPONSE_LENGTHS
        .SHORT
    );
  }

  if (
    includesAny(
      preference,
      [
        "medium",
        "balanced",
        "normal",
      ]
    )
  ) {
    return (
      RESPONSE_LENGTHS
        .MEDIUM
    );
  }

  if (
    includesAny(
      preference,
      [
        "detailed",
        "deep",
        "thorough",
        "comprehensive",
      ]
    )
  ) {
    return (
      RESPONSE_LENGTHS
        .DETAILED
    );
  }

  return null;
}

function chooseResponseLength({
  decision,
  creatorEnergy,
  informationSaturation,
  context,
  memorySignals,
}) {
  /**
   * Present behaviour outranks stored response preference.
   */
  if (
    [
      PROGRESSION_DECISIONS
        .HOLD_SPACE,

      PROGRESSION_DECISIONS
        .WAIT_FOR_CREATOR,
    ].includes(
      decision
    )
  ) {
    return (
      RESPONSE_LENGTHS
        .SILENT
    );
  }

  if (
    [
      PROGRESSION_DECISIONS
        .MOVE_TO_NEXT_TASK,

      PROGRESSION_DECISIONS
        .MOVE_TO_CREATION,

      PROGRESSION_DECISIONS
        .MOVE_TO_REFINEMENT,

      PROGRESSION_DECISIONS
        .MOVE_TO_PUBLISHING,

      PROGRESSION_DECISIONS
        .YIELD_TO_EXECUTION,

      PROGRESSION_DECISIONS
        .YIELD_TO_MEMORY_ACTION,

      PROGRESSION_DECISIONS
        .WAIT_FOR_MEMORY_CLARIFICATION,

      PROGRESSION_DECISIONS
        .ACKNOWLEDGE_DETOUR,

      PROGRESSION_DECISIONS
        .PAUSE_SESSION,

      PROGRESSION_DECISIONS
        .PRESERVE_HANDOFF,

      PROGRESSION_DECISIONS
        .END_SESSION_POSITIVELY,
    ].includes(
      decision
    )
  ) {
    return (
      RESPONSE_LENGTHS
        .MINIMAL
    );
  }

  if (
    creatorEnergy.value ===
      CREATOR_ENERGY_STATES
        .LOW ||
    creatorEnergy.value ===
      CREATOR_ENERGY_STATES
        .DEPLETED ||
    informationSaturation
      .value ===
      INFORMATION_SATURATION
        .HIGH ||
    informationSaturation
      .value ===
      INFORMATION_SATURATION
        .OVERLOADED
  ) {
    return (
      RESPONSE_LENGTHS
        .SHORT
    );
  }

  const currentPreference =
    normaliseResponseLengthPreference(
      context
        ?.preferredResponseDepth
    );

  if (
    currentPreference
  ) {
    return currentPreference;
  }

  const rememberedPreference =
    normaliseResponseLengthPreference(
      memorySignals
        ?.responseDepth
    );

  if (
    rememberedPreference
  ) {
    return rememberedPreference;
  }

  if (
    [
      PROGRESSION_DECISIONS
        .CONTINUE_LEARNING,

      PROGRESSION_DECISIONS
        .CONTINUE_EXPLORING,
    ].includes(
      decision
    )
  ) {
    return (
      RESPONSE_LENGTHS
        .MEDIUM
    );
  }

  return (
    RESPONSE_LENGTHS.SHORT
  );
}

function chooseQuestionAllowance({
  decision,
  guidanceWindow,
  informationSaturation,
  memorySignals,
}) {
  if (
    [
      PROGRESSION_DECISIONS
        .HOLD_SPACE,

      PROGRESSION_DECISIONS
        .WAIT_FOR_CREATOR,

      PROGRESSION_DECISIONS
        .MOVE_TO_NEXT_TASK,

      PROGRESSION_DECISIONS
        .MOVE_TO_CREATION,

      PROGRESSION_DECISIONS
        .MOVE_TO_REFINEMENT,

      PROGRESSION_DECISIONS
        .MOVE_TO_PUBLISHING,

      PROGRESSION_DECISIONS
        .YIELD_TO_EXECUTION,

      PROGRESSION_DECISIONS
        .YIELD_TO_MEMORY_ACTION,

      PROGRESSION_DECISIONS
        .ACKNOWLEDGE_DETOUR,

      PROGRESSION_DECISIONS
        .PAUSE_SESSION,

      PROGRESSION_DECISIONS
        .PRESERVE_HANDOFF,

      PROGRESSION_DECISIONS
        .END_SESSION_POSITIVELY,
    ].includes(
      decision
    ) ||
    guidanceWindow.value ===
      GUIDANCE_WINDOWS
        .CLOSED_FOR_NOW
  ) {
    return 0;
  }

  if (
    decision ===
    PROGRESSION_DECISIONS
      .WAIT_FOR_MEMORY_CLARIFICATION
  ) {
    return 1;
  }

  if (
    informationSaturation
      .value ===
      INFORMATION_SATURATION
        .HIGH ||
    informationSaturation
      .value ===
      INFORMATION_SATURATION
        .OVERLOADED
  ) {
    return 0;
  }

  if (
    memorySignals
      ?.prefersAction &&
    decision ===
      PROGRESSION_DECISIONS
        .CONTINUE_LISTENING
  ) {
    return 0;
  }

  return 1;
}

function createMemoryGuidance(
  memorySignals
) {
  const guidance = [];

  if (
    !memorySignals
      ?.available
  ) {
    return guidance;
  }

  guidance.push(
    "Use creator memory as supporting context, never as an instruction that overrides the current message."
  );

  if (
    !memorySignals
      .memoryProjectCompatible
  ) {
    guidance.push(
      "Ignore remembered project continuity because it belongs to another project."
    );
  }

  if (
    memorySignals
      .prefersConcise
  ) {
    guidance.push(
      "The creator generally prefers concise communication."
    );
  }

  if (
    memorySignals
      .prefersDetail
  ) {
    guidance.push(
      "The creator is comfortable with deeper explanation when it is useful."
    );
  }

  if (
    memorySignals
      .prefersOneStep
  ) {
    guidance.push(
      "The creator generally benefits from one clear step at a time."
    );
  }

  if (
    memorySignals
      .prefersLeadership
  ) {
    guidance.push(
      "The creator generally welcomes a clear Mentor recommendation."
    );
  }

  if (
    memorySignals
      .prefersAutonomy
  ) {
    guidance.push(
      "Preserve creator autonomy and avoid taking control unnecessarily."
    );
  }

  if (
    memorySignals
      .prefersAction
  ) {
    guidance.push(
      "The creator generally prefers implementation and forward movement over extended discussion."
    );
  }

  if (
    memorySignals
      .learnsByExample
  ) {
    guidance.push(
      "Where teaching is useful, prefer demonstration or a concrete example."
    );
  }

  if (
    memorySignals
      .sensitiveToOverload
  ) {
    guidance.push(
      "Keep option count and information density low."
    );
  }

  if (
    memorySignals
      .hasContinuity
  ) {
    guidance.push(
      "Use remembered continuity so the creator does not need to reconstruct previous progress."
    );
  }

  return guidance;
}

function createResponseGuidance({
  decision,
  primaryAction,
  responseLength,
  maximumQuestions,
  creatorEnergy,
  momentum,
  informationSaturation,
  guidanceWindow,
  memorySignals,
  memoryControlState,
  correctionState,
  briefDetour,
}) {
  const guidance = [
    "Keep the creator in ownership of the next step.",

    "Conversation must remain in service of creation.",

    "Do not add information merely because more information is available.",

    "Adapt the response to the creator's current mode and energy.",

    "Do not overwhelm the creator with multiple next steps.",

    "Use no more questions than the plan allows.",

    "Current explicit creator intent has priority over remembered preference.",

    "Explicit current project identity outranks stale remembered project continuity.",

    "Do not convert a temporary state into a permanent creator preference.",

    "Creator-confirmed project truth outranks inference.",

    "Specialist-agent signals may inform progression but do not own project truth.",

    "Do not claim that progress, memory, handoff or deletion was persisted unless the persistence layer confirms it.",

    `Preferred response length: ${responseLength}.`,

    `Maximum questions: ${maximumQuestions}.`,

    ...createMemoryGuidance(
      memorySignals
    ),
  ];

  if (
    memoryControlState.value
  ) {
    guidance.push(
      "A memory-control operation currently has priority.",

      "Suspend unrelated creative progression until the memory operation is resolved.",

      "Do not advance the project merely because it is otherwise ready."
    );

    if (
      memoryControlState
        .metadata
        ?.requiresClarification
    ) {
      guidance.push(
        "Ask only the minimum clarification needed to identify the memory target."
      );
    }
  }

  if (
    correctionState
  ) {
    guidance.push(
      "The creator has supplied a correction.",

      "Treat the current correction as more authoritative than stale remembered continuity.",

      "Do not progress from a superseded assumption."
    );
  }

  if (
    briefDetour
  ) {
    guidance.push(
      "Keep the detour brief.",

      "Acknowledge it without opening another workstream.",

      "Return to the previous task or working mode."
    );
  }

  if (
    decision ===
      PROGRESSION_DECISIONS
        .RESTORE_CONTEXT
  ) {
    guidance.push(
      "Restore only the context needed to continue.",

      "Do not make the creator repeat information already known.",

      "Use only continuity belonging to the current project.",

      "Recap the previous position briefly.",

      "Return the creator to a clear next step."
    );

    if (
      memorySignals
        ?.returnPoint
    ) {
      guidance.push(
        `Known return point: ${String(
          memorySignals
            .returnPoint
        )}.`
      );
    }
  }

  if (
    decision ===
      PROGRESSION_DECISIONS
        .MOVE_TO_NEXT_TASK
  ) {
    guidance.push(
      "Move directly to the next task.",

      "Do not reopen the previous discussion.",

      "Give only the facts required to continue.",

      "Protect build momentum."
    );
  }

  if (
    decision ===
      PROGRESSION_DECISIONS
        .YIELD_TO_EXECUTION
  ) {
    guidance.push(
      "Yield immediately to the selected execution path.",

      "Do not add another planning or reflective layer before execution.",

      "Do not end with an unnecessary question."
    );
  }

  if (
    decision ===
      PROGRESSION_DECISIONS
        .MOVE_TO_CREATION
  ) {
    guidance.push(
      "Stop gathering unnecessary information.",

      "Confirm that enough is known to begin.",

      "Move directly into creation or generation.",

      "Additional refinements can happen after the first version exists."
    );
  }

  if (
    decision ===
      PROGRESSION_DECISIONS
        .CONTINUE_EXPLORING
  ) {
    guidance.push(
      "Continue the brainstorming conversation.",

      "Ask only one meaningful question.",

      "Do not force a conclusion while the creator is still discovering."
    );
  }

  if (
    decision ===
      PROGRESSION_DECISIONS
        .CONTINUE_LEARNING
  ) {
    guidance.push(
      "Explain only the concept currently requested.",

      "Use the creator's preferred learning style where known.",

      "Pause before introducing another concept."
    );
  }

  if (
    decision ===
      PROGRESSION_DECISIONS
        .REDUCE_INFORMATION
  ) {
    guidance.push(
      "Do not add another explanation.",

      "Reduce the current situation to one recommendation.",

      "Offer one next action only.",

      "Allow the creator to request more detail later."
    );
  }

  if (
    decision ===
      PROGRESSION_DECISIONS
        .OFFER_ONE_SMALL_STEP
  ) {
    guidance.push(
      "Offer the smallest useful next step.",

      "Do not provide a full roadmap.",

      "Help the creator regain movement before adding complexity."
    );
  }

  if (
    [
      PROGRESSION_DECISIONS
        .HOLD_SPACE,

      PROGRESSION_DECISIONS
        .WAIT_FOR_CREATOR,
    ].includes(
      decision
    )
  ) {
    guidance.push(
      "Do not introduce a new question or idea.",

      "Allow the creator's thought to continue emerging.",

      "Use silence or a minimal acknowledgement.",

      "Cancel any delayed response if the creator continues speaking."
    );
  }

  if (
    decision ===
      PROGRESSION_DECISIONS
        .RELEASE_PRESSURE
  ) {
    guidance.push(
      "Confirm that enough useful material already exists.",

      "Remove pressure to remember or decide immediately.",

      "Leave the door open for the thought to return later.",

      "Continue with what is already known."
    );
  }

  if (
    [
      PROGRESSION_DECISIONS
        .SAVE_AND_RETURN_LATER,

      PROGRESSION_DECISIONS
        .PAUSE_SESSION,

      PROGRESSION_DECISIONS
        .PRESERVE_HANDOFF,
    ].includes(
      decision
    )
  ) {
    guidance.push(
      "Preserve the creator's current progress.",

      "Give a short recap of where the journey paused.",

      "Name the next step clearly for the creator's return.",

      "Do not introduce new work.",

      "End without guilt or pressure."
    );
  }

  if (
    decision ===
      PROGRESSION_DECISIONS
        .END_SESSION_POSITIVELY
  ) {
    guidance.push(
      "Acknowledge the work completed.",

      "Do not introduce another task.",

      "End with an open door for the creator's return."
    );
  }

  if (
    creatorEnergy.value ===
      CREATOR_ENERGY_STATES
        .HIGH ||
    momentum.value ===
      MOMENTUM_STATES
        .STRONG ||
    momentum.value ===
      MOMENTUM_STATES
        .RISING
  ) {
    guidance.push(
      "Protect active momentum.",

      "Prefer action over explanation.",

      "Do not turn the creator from creating into reading."
    );
  }

  if (
    informationSaturation
      .value ===
      INFORMATION_SATURATION
        .HIGH ||
    informationSaturation
      .value ===
      INFORMATION_SATURATION
        .OVERLOADED
  ) {
    guidance.push(
      "The creator may already have enough information.",

      "Do not add secondary options.",

      "Use one recommendation and one action."
    );
  }

  if (
    guidanceWindow.value ===
      GUIDANCE_WINDOWS
        .NARROW
  ) {
    guidance.push(
      "Offer guidance only where it unlocks the next step."
    );
  }

  guidance.push(
    `Primary progression action: ${primaryAction}.`
  );

  return uniqueValues(
    guidance
  );
}

function createGuardRails() {
  return [
    "Do not keep the creator talking simply to prolong the session.",

    "Do not interrupt strong creative flow with theory.",

    "Do not provide multiple tasks when one task is enough.",

    "Do not reopen a completed discussion without a clear reason.",

    "Do not mistake silence for disengagement.",

    "Do not mistake short replies for lack of interest.",

    "Do not pressure a tired creator to continue.",

    "Do not introduce new concepts during session closure.",

    "Do not provide an essay when the creator has asked for the next task.",

    "Do not turn build mode into exploration mode without permission.",

    "Do not turn exploration mode into build mode before the creator is ready.",

    "Do not force a decision merely to create artificial progress.",

    "Do not leave the creator without a clear return point when pausing.",

    "Do not treat every creator as having the same reading tolerance.",

    "Do not let remembered preferences override an explicit current request.",

    "Do not infer a permanent preference from one temporary emotional, energy, saturation or guidance state.",

    "Do not make the creator repeat context that reliable memory already contains.",

    "Do not restore project continuity from another project.",

    "Do not progress from stale project context after a creator correction.",

    "Do not allow specialist-agent assumptions to silently replace creator-approved project truth.",

    "Do not advance unrelated work while an explicit memory-control operation is unresolved.",

    "Do not claim a forget request succeeded until persistence confirms deletion.",

    "Do not claim session handoff persistence until CreatorMemory confirms it.",

    "Do not reopen a brief detour merely because related information exists.",

    "Do not reopen deferred topics automatically.",

    "Do not expose internal memory or specialist-agent machinery unnecessarily to the creator.",

    "Do not manufacture momentum by forcing the creator forward.",
  ];
}

function createDecisionSummary({
  decision,
  sessionPhase,
  creatorEnergy,
  informationSaturation,
  guidanceWindow,
  momentum,
  memorySignals,
  memoryControlState,
}) {
  const memorySummary =
    memorySignals
      ?.available
      ? (
          " Creator memory was available as supporting context."
        )
      : "";

  const memoryControlSummary =
    memoryControlState
      ?.value
      ? (
          " A memory-control operation currently has priority."
        )
      : "";

  return (
    `Use the ${decision} progression decision. ` +
    `The session is in the ${sessionPhase.value} phase. ` +
    `Creator energy is ${creatorEnergy.value}, ` +
    `momentum is ${momentum.value}, ` +
    `information saturation is ${informationSaturation.value}, ` +
    `and the guidance window is ${guidanceWindow.value}.` +
    memorySummary +
    memoryControlSummary
  );
}

function createFallbackProgressionPlan({
  message,
  context,
  error = null,
}) {
  return {
    id:
      createProgressionId(),

    engine:
      "progression-engine",

    version:
      PROGRESSION_ENGINE_VERSION,

    input: {
      message:
        cleanString(
          message
        ),
    },

    decision:
      PROGRESSION_DECISIONS
        .CONTINUE_LISTENING,

    progression: {
      primaryAction:
        PROGRESSION_ACTIONS
          .GIVE_SHORT_ACKNOWLEDGEMENT,

      supportingActions: [],

      responseLength:
        RESPONSE_LENGTHS
          .SHORT,

      maximumQuestions: 1,

      shouldMoveForward:
        false,

      shouldPause:
        false,

      shouldEndSession:
        false,

      shouldHoldSpace:
        false,

      shouldReduceInformation:
        false,

      shouldSaveProgress:
        false,

      shouldContinueExploring:
        false,

      shouldContinueLearning:
        false,

      shouldRestoreContext:
        false,

      shouldYieldToExecution:
        false,

      shouldYieldToMemoryAction:
        false,

      shouldPreserveHandoff:
        false,

      shouldAcknowledgeDetour:
        false,

      requiresMemoryClarification:
        false,
    },

    creatorState: {
      sessionPhase:
        createDetection({
          value:
            SESSION_PHASES
              .UNKNOWN,

          confidence: 0.2,
        }),

      creatorEnergy:
        createDetection({
          value:
            CREATOR_ENERGY_STATES
              .UNKNOWN,

          confidence: 0.2,
        }),

      informationSaturation:
        createDetection({
          value:
            INFORMATION_SATURATION
              .UNKNOWN,

          confidence: 0.2,
        }),

      guidanceWindow:
        createDetection({
          value:
            GUIDANCE_WINDOWS
              .UNKNOWN,

          confidence: 0.2,
        }),

      momentum:
        createDetection({
          value:
            MOMENTUM_STATES
              .UNKNOWN,

          confidence: 0.2,
        }),

      memoryControlState:
        createDetection({
          value: false,

          confidence: 0.2,
        }),

      memorySignals: {
        available: false,
      },
    },

    responseGuidance: [
      "Use a short acknowledgement.",

      "Ask no more than one question.",

      "Do not introduce multiple new directions.",

      "Keep the creator in ownership.",

      "Do not make new progression assumptions while planning is unavailable.",
    ],

    guardRails:
      createGuardRails(),

    creatorProtocol: {
      conversationServesCreation:
        true,

      protectMomentum:
        true,

      currentIntentOverridesMemory:
        true,
    },

    contextSnapshot:
      cloneValue(
        context
      ),

    conversationPlanSnapshot:
      null,

    reflectionPlanSnapshot:
      null,

    memorySnapshot: {},

    decisionSummary:
      "Progression analysis failed. Continue listening with minimal intervention.",

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

function createProgressionEngine() {
  function planProgression({
    message = "",
    context = {},
    conversationPlan = null,
    reflectionPlan = null,
  } = {}) {
    try {
      /**
       * ConversationPlanner already contains a resolved context
       * snapshot. Reflection may contain an even newer one.
       *
       * Precedence:
       *
       * 1. Defaults.
       * 2. ConversationPlanner context.
       * 3. Reflection context.
       * 4. Explicit current progression context.
       *
       * Current orchestration state always wins.
       */
      const plannerContext =
        conversationPlan
          ?.contextSnapshot ||
        {};

      const reflectionContext =
        reflectionPlan
          ?.contextSnapshot ||
        {};

      const combinedContext = {
        ...cloneValue(
          DEFAULT_PROGRESSION_CONTEXT
        ),

        ...cloneValue(
          plannerContext
        ),

        ...cloneValue(
          reflectionContext
        ),

        ...cloneValue(
          context
        ),

        currentTimestamp:
          context
            ?.currentTimestamp ||
          reflectionContext
            ?.currentTimestamp ||
          plannerContext
            ?.currentTimestamp ||
          createTimestamp(),
      };

      /**
       * Pull modern ConversationPlanner direction into the
       * progression context when the caller has not explicitly
       * supplied stronger state.
       */
      const plannerDirection =
        conversationPlan
          ?.explicitDirection ||
        {};

      if (
        !hasOwn(
          context,
          "creatorExplicitlyAskedToPause"
        ) &&
        plannerDirection.pause
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
        plannerDirection.continue
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
        plannerDirection.create
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
        plannerDirection.guidance
      ) {
        combinedContext
          .creatorExplicitlyAskedForGuidance =
          true;
      }

      const activeProjectId =
        getProjectId(
          combinedContext
        );

      combinedContext
        .activeProjectId =
        activeProjectId;

      const memorySignals =
        deriveMemorySignals(
          combinedContext
        );

      const explicitDirection =
        detectExplicitDirection({
          message,

          context:
            combinedContext,
        });

      const memoryControlState =
        detectMemoryControlState({
          context:
            combinedContext,

          reflectionPlan,
        });

      const briefDetour =
        detectBriefDetour(
          combinedContext,
          reflectionPlan
        );

      const correctionState =
        detectCorrectionState(
          combinedContext,
          reflectionPlan
        );

      const sessionPhase =
        detectSessionPhase({
          message,

          context:
            combinedContext,

          conversationPlan,

          reflectionPlan,

          memorySignals,

          explicitDirection,

          memoryControlState,
        });

      const creatorEnergy =
        detectCreatorEnergy({
          message,

          context:
            combinedContext,

          reflectionPlan,
        });

      const informationSaturation =
        detectInformationSaturation({
          message,

          context:
            combinedContext,

          memorySignals,
        });

      const guidanceWindow =
        detectGuidanceWindow({
          message,

          context:
            combinedContext,

          reflectionPlan,

          creatorEnergy,

          informationSaturation,

          memorySignals,

          explicitDirection,
        });

      const momentum =
        detectMomentum({
          message,

          context:
            combinedContext,

          creatorEnergy,

          sessionPhase,

          explicitDirection,
        });

      const readiness =
        detectReadiness({
          context:
            combinedContext,

          conversationPlan,
        });

      const decision =
        chooseProgressionDecision({
          explicitDirection,

          sessionPhase,

          creatorEnergy,

          informationSaturation,

          guidanceWindow,

          momentum,

          readiness,

          reflectionPlan,

          context:
            combinedContext,

          memorySignals,

          memoryControlState,

          briefDetour,
        });

      const primaryAction =
        choosePrimaryAction(
          decision
        );

      const supportingActions =
        chooseSupportingActions({
          decision,

          context:
            combinedContext,

          memorySignals,
        });

      const responseLength =
        chooseResponseLength({
          decision,

          creatorEnergy,

          informationSaturation,

          context:
            combinedContext,

          memorySignals,
        });

      const maximumQuestions =
        chooseQuestionAllowance({
          decision,

          guidanceWindow,

          informationSaturation,

          memorySignals,
        });

      const responseGuidance =
        createResponseGuidance({
          decision,

          primaryAction,

          responseLength,

          maximumQuestions,

          creatorEnergy,

          momentum,

          informationSaturation,

          guidanceWindow,

          memorySignals,

          memoryControlState,

          correctionState,

          briefDetour,
        });

      const shouldMoveForward = [
        PROGRESSION_DECISIONS
          .MOVE_TO_CREATION,

        PROGRESSION_DECISIONS
          .MOVE_TO_NEXT_TASK,

        PROGRESSION_DECISIONS
          .MOVE_TO_REFINEMENT,

        PROGRESSION_DECISIONS
          .MOVE_TO_PUBLISHING,

        PROGRESSION_DECISIONS
          .YIELD_TO_EXECUTION,
      ].includes(
        decision
      );

      const shouldPause = [
        PROGRESSION_DECISIONS
          .PAUSE_SESSION,

        PROGRESSION_DECISIONS
          .SAVE_AND_RETURN_LATER,

        PROGRESSION_DECISIONS
          .PRESERVE_HANDOFF,
      ].includes(
        decision
      );

      const shouldEndSession =
        decision ===
        PROGRESSION_DECISIONS
          .END_SESSION_POSITIVELY;

      const shouldHoldSpace = [
        PROGRESSION_DECISIONS
          .HOLD_SPACE,

        PROGRESSION_DECISIONS
          .WAIT_FOR_CREATOR,
      ].includes(
        decision
      );

      const shouldReduceInformation = [
        PROGRESSION_DECISIONS
          .REDUCE_INFORMATION,

        PROGRESSION_DECISIONS
          .OFFER_ONE_SMALL_STEP,
      ].includes(
        decision
      );

      const shouldSaveProgress = [
        PROGRESSION_DECISIONS
          .SAVE_AND_RETURN_LATER,

        PROGRESSION_DECISIONS
          .PAUSE_SESSION,

        PROGRESSION_DECISIONS
          .PRESERVE_HANDOFF,

        PROGRESSION_DECISIONS
          .END_SESSION_POSITIVELY,
      ].includes(
        decision
      );

      return {
        id:
          createProgressionId(),

        engine:
          "progression-engine",

        version:
          PROGRESSION_ENGINE_VERSION,

        input: {
          message:
            cleanString(
              message
            ),
        },

        decision,

        progression: {
          primaryAction,

          supportingActions,

          responseLength,

          maximumQuestions,

          shouldMoveForward,

          shouldPause,

          shouldEndSession,

          shouldHoldSpace,

          shouldReduceInformation,

          shouldSaveProgress,

          shouldContinueExploring:
            decision ===
            PROGRESSION_DECISIONS
              .CONTINUE_EXPLORING,

          shouldContinueLearning:
            decision ===
            PROGRESSION_DECISIONS
              .CONTINUE_LEARNING,

          shouldRestoreContext:
            decision ===
            PROGRESSION_DECISIONS
              .RESTORE_CONTEXT,

          shouldYieldToExecution:
            decision ===
            PROGRESSION_DECISIONS
              .YIELD_TO_EXECUTION,

          shouldYieldToMemoryAction:
            decision ===
            PROGRESSION_DECISIONS
              .YIELD_TO_MEMORY_ACTION,

          shouldPreserveHandoff:
            decision ===
            PROGRESSION_DECISIONS
              .PRESERVE_HANDOFF,

          shouldAcknowledgeDetour:
            decision ===
            PROGRESSION_DECISIONS
              .ACKNOWLEDGE_DETOUR,

          requiresMemoryClarification:
            decision ===
            PROGRESSION_DECISIONS
              .WAIT_FOR_MEMORY_CLARIFICATION,

          activeProjectId,

          progressionBlockedByMemoryControl:
            memoryControlState
              .value,
        },

        creatorState: {
          explicitDirection,

          sessionPhase,

          creatorEnergy,

          informationSaturation,

          guidanceWindow,

          momentum,

          readiness,

          memoryControlState,

          briefDetour:
            createDetection({
              value:
                briefDetour,

              confidence:
                briefDetour
                  ? 0.94
                  : 0.3,
            }),

          correctionState:
            createDetection({
              value:
                correctionState,

              confidence:
                correctionState
                  ? 0.94
                  : 0.3,
            }),

          memorySignals: {
            available:
              memorySignals
                .available,

            responseDepth:
              memorySignals
                .responseDepth,

            guidanceStyle:
              memorySignals
                .guidanceStyle,

            learningStyle:
              memorySignals
                .learningStyle,

            pacingPreference:
              memorySignals
                .pacingPreference,

            autonomyPreference:
              memorySignals
                .autonomyPreference,

            buildModePreference:
              memorySignals
                .buildModePreference,

            prefersConcise:
              memorySignals
                .prefersConcise,

            prefersDetail:
              memorySignals
                .prefersDetail,

            prefersOneStep:
              memorySignals
                .prefersOneStep,

            prefersLeadership:
              memorySignals
                .prefersLeadership,

            prefersAutonomy:
              memorySignals
                .prefersAutonomy,

            prefersAction:
              memorySignals
                .prefersAction,

            learnsByExample:
              memorySignals
                .learnsByExample,

            sensitiveToOverload:
              memorySignals
                .sensitiveToOverload,

            hasContinuity:
              memorySignals
                .hasContinuity,

            returnPoint:
              cloneValue(
                memorySignals
                  .returnPoint
              ),

            activeProjectId:
              memorySignals
                .activeProjectId,

            memoryProjectId:
              memorySignals
                .memoryProjectId,

            memoryProjectCompatible:
              memorySignals
                .memoryProjectCompatible,
          },
        },

        responseGuidance,

        guardRails:
          createGuardRails(),

        creatorProtocol: {
          protectTheCreator:
            true,

          conversationServesCreation:
            true,

          protectMomentum:
            true,

          protectCreatorEnergy:
            true,

          protectAttention:
            true,

          adaptInformationDepth:
            true,

          oneUsefulStepAtATime:
            true,

          guidanceMustArriveAtRightTime:
            true,

          creatorMayPauseWithoutLosingProgress:
            true,

          doNotMaximiseConversationLength:
            true,

          moveForwardWhenEnoughIsKnown:
            true,

          memorySupportsContinuity:
            true,

          currentIntentOverridesMemory:
            true,

          currentProjectOverridesStoredProject:
            true,

          projectMemoryIsScoped:
            true,

          creatorConfirmedTruthOutranksInference:
            true,

          creatorCorrectionsOverrideMemory:
            true,

          specialistAgentsMayInform:
            true,

          specialistAgentsDoNotOwnTruth:
            true,

          temporaryStateDoesNotBecomePreference:
            true,

          creatorShouldNotRepeatKnownContext:
            true,

          memoryControlBlocksUnrelatedProgression:
            true,

          progressionDoesNotClaimPersistence:
            true,

          sessionHandoffProtectsMomentum:
            true,

          briefDetoursStayBrief:
            true,

          complexityRemainsBehindConversation:
            true,
        },

        projectState: {
          activeProjectId,

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

          readiness:
            cloneValue(
              readiness
            ),

          returnPoint:
            cloneValue(
              memorySignals
                .returnPoint ||
              combinedContext
                ?.returnPoint ||
              null
            ),

          nextTask:
            cloneValue(
              combinedContext
                ?.nextTask ||
              null
            ),

          projectMemoryCompatible:
            memorySignals
              .memoryProjectCompatible,

          correctionActive:
            correctionState,
        },

        contextSnapshot:
          cloneValue(
            combinedContext
          ),

        conversationPlanSnapshot:
          cloneValue(
            conversationPlan
          ),

        reflectionPlanSnapshot:
          cloneValue(
            reflectionPlan
          ),

        memorySnapshot:
          cloneValue(
            memorySignals.raw
          ),

        decisionSummary:
          createDecisionSummary({
            decision,

            sessionPhase,

            creatorEnergy,

            informationSaturation,

            guidanceWindow,

            momentum,

            memorySignals,

            memoryControlState,
          }),

        status:
          "planned",

        createdAt:
          createTimestamp(),
      };
    } catch (error) {
      console.error(
        "ProgressionEngine planning error:",
        error
      );

      return (
        createFallbackProgressionPlan({
          message,

          context,

          error,
        })
      );
    }
  }

  function shouldMoveForward(
    plan
  ) {
    return Boolean(
      plan
        ?.progression
        ?.shouldMoveForward
    );
  }

  function shouldReduceInformation(
    plan
  ) {
    return Boolean(
      plan
        ?.progression
        ?.shouldReduceInformation
    );
  }

  function shouldHoldSpace(
    plan
  ) {
    return Boolean(
      plan
        ?.progression
        ?.shouldHoldSpace
    );
  }

  function shouldSaveProgress(
    plan
  ) {
    return Boolean(
      plan
        ?.progression
        ?.shouldSaveProgress
    );
  }

  function shouldEndSession(
    plan
  ) {
    return Boolean(
      plan
        ?.progression
        ?.shouldEndSession
    );
  }

  function shouldRestoreContext(
    plan
  ) {
    return Boolean(
      plan
        ?.progression
        ?.shouldRestoreContext
    );
  }

  function shouldYieldToExecution(
    plan
  ) {
    return Boolean(
      plan
        ?.progression
        ?.shouldYieldToExecution
    );
  }

  function shouldYieldToMemoryAction(
    plan
  ) {
    return Boolean(
      plan
        ?.progression
        ?.shouldYieldToMemoryAction
    );
  }

  function shouldPreserveHandoff(
    plan
  ) {
    return Boolean(
      plan
        ?.progression
        ?.shouldPreserveHandoff
    );
  }

  function requiresMemoryClarification(
    plan
  ) {
    return Boolean(
      plan
        ?.progression
        ?.requiresMemoryClarification
    );
  }

  return {
    planProgression,

    shouldMoveForward,

    shouldReduceInformation,

    shouldHoldSpace,

    shouldSaveProgress,

    shouldEndSession,

    shouldRestoreContext,

    shouldYieldToExecution,

    shouldYieldToMemoryAction,

    shouldPreserveHandoff,

    requiresMemoryClarification,
  };
}

function planProgression({
  message = "",
  context = {},
  conversationPlan = null,
  reflectionPlan = null,
} = {}) {
  const engine =
    createProgressionEngine();

  return (
    engine.planProgression({
      message,

      context,

      conversationPlan,

      reflectionPlan,
    })
  );
}

export {
  PROGRESSION_ENGINE_VERSION,

  PROGRESSION_DECISIONS,

  MOMENTUM_STATES,

  CREATOR_ENERGY_STATES,

  INFORMATION_SATURATION,

  GUIDANCE_WINDOWS,

  SESSION_PHASES,

  PROGRESSION_ACTIONS,

  RESPONSE_LENGTHS,

  MEMORY_CONTROL_ACTIONS,

  createProgressionEngine,

  planProgression,
};

export default createProgressionEngine;
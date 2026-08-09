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
 * - Current energy and momentum.
 * - Information saturation.
 * - Guidance receptiveness.
 * - Project readiness.
 * - Previous progression state.
 *
 * Core philosophy:
 *
 * - Conversation exists in service of creation.
 * - Current creator intent has priority over remembered preference.
 * - Memory should improve continuity, never trap the creator.
 * - Durable preferences and temporary states are different things.
 * - Do not interrupt creative flow with unnecessary teaching.
 * - Do not keep talking merely because more information exists.
 * - Adapt the amount of guidance to the individual creator.
 * - Protect momentum, energy and attention.
 * - Move forward when enough has been discovered.
 * - Allow unfinished ideas to return later without pressure.
 * - Restore context without forcing the creator to repeat themselves.
 * - One useful next step is often better than a roadmap.
 */

const PROGRESSION_ENGINE_VERSION = "2.0.0";

const PROGRESSION_DECISIONS = Object.freeze({
  CONTINUE_LISTENING: "continue-listening",
  CONTINUE_EXPLORING: "continue-exploring",
  CONTINUE_LEARNING: "continue-learning",
  HOLD_SPACE: "hold-space",
  REDUCE_INFORMATION: "reduce-information",
  OFFER_ONE_SMALL_STEP: "offer-one-small-step",
  MOVE_TO_CREATION: "move-to-creation",
  MOVE_TO_NEXT_TASK: "move-to-next-task",
  MOVE_TO_REFINEMENT: "move-to-refinement",
  MOVE_TO_PUBLISHING: "move-to-publishing",
  RESTORE_CONTEXT: "restore-context",
  RELEASE_PRESSURE: "release-pressure",
  SAVE_AND_RETURN_LATER: "save-and-return-later",
  PAUSE_SESSION: "pause-session",
  END_SESSION_POSITIVELY: "end-session-positively",
  WAIT_FOR_CREATOR: "wait-for-creator",
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
  UNKNOWN: "unknown",
});

const PROGRESSION_ACTIONS = Object.freeze({
  ASK_ONE_MORE_QUESTION: "ask-one-more-question",
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
  BEGIN_GENERATION: "begin-generation",
  BEGIN_REFINEMENT: "begin-refinement",
  BEGIN_PUBLISHING: "begin-publishing",
  SAVE_CURRENT_PROGRESS:
    "save-current-progress",
  OFFER_INSPIRATION_DRAWER:
    "offer-inspiration-drawer",
  RECAP_CONTEXT: "recap-context",
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
});

const RESPONSE_LENGTHS = Object.freeze({
  SILENT: "silent",
  MINIMAL: "minimal",
  SHORT: "short",
  MEDIUM: "medium",
  DETAILED: "detailed",
});

const DEFAULT_PROGRESSION_CONTEXT = Object.freeze({
  creatorJourney: "guide",
  creatorType: null,
  projectType: null,

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

  creatorExplicitlyAskedToContinue: false,
  creatorExplicitlyAskedToStop: false,
  creatorExplicitlyAskedToPause: false,
  creatorExplicitlyAskedForNextStep: false,
  creatorExplicitlyAskedForGuidance: false,
  creatorExplicitlyAskedToCreate: false,

  creatorEnergy: null,
  informationSaturation: null,
  guidanceWindow: null,
  thinkingMode: null,

  activeProject: null,
  activeIdea: null,

  requiredInformationComplete: false,
  minimumCreationContextReady: false,
  projectReadyToGenerate: false,
  projectReadyToRefine: false,
  projectReadyToPublish: false,

  unresolvedQuestions: [],
  completedSteps: [],
  remainingSteps: [],

  preferredResponseDepth: null,
  preferredGuidanceStyle: null,

  creatorMemory: null,
  creatorMemoryProfile: null,
  creatorMemorySignals: null,
  memoryContext: null,

  returningCreator: false,
  returningToProject: false,
  previousSessionSummary: null,
  previousReturnPoint: null,
  previousNextStep: null,

  lastProgressionDecision: null,
  lastProgressionAt: null,
});

function createTimestamp() {
  return new Date().toISOString();
}

function createProgressionId() {
  const randomValue = Math.random()
    .toString(36)
    .slice(2, 10);

  return `progression-plan-${Date.now()}-${randomValue}`;
}

function cloneValue(value) {
  if (value === undefined) {
    return undefined;
  }

  try {
    return JSON.parse(JSON.stringify(value));
  } catch {
    return value;
  }
}

function normaliseText(value) {
  if (typeof value !== "string") {
    return "";
  }

  return value
    .trim()
    .toLowerCase()
    .replace(/[’‘]/g, "'")
    .replace(/\s+/g, " ");
}

function cleanString(value) {
  return typeof value === "string"
    ? value.trim()
    : "";
}

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

function clampConfidence(value) {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return 0;
  }

  return Math.max(0, Math.min(1, numericValue));
}

function createDetection({
  value,
  confidence = 0.5,
  evidence = [],
}) {
  return {
    value,
    confidence: clampConfidence(confidence),
    evidence: uniqueValues(evidence),
  };
}

function includesAny(text, phrases = []) {
  return phrases.some((phrase) =>
    text.includes(phrase)
  );
}

function safeNumber(value, fallback = 0) {
  const numericValue = Number(value);

  return Number.isFinite(numericValue)
    ? numericValue
    : fallback;
}

function getRecentCreatorText(context) {
  const messages = Array.isArray(
    context?.recentCreatorMessages
  )
    ? context.recentCreatorMessages
    : [];

  return messages
    .slice(-5)
    .map((message) => {
      if (typeof message === "string") {
        return message;
      }

      return (
        message?.content ||
        message?.text ||
        message?.summary ||
        ""
      );
    })
    .filter(Boolean)
    .join(" ");
}

function getRecentMentorText(context) {
  const messages = Array.isArray(
    context?.recentMentorMessages
  )
    ? context.recentMentorMessages
    : [];

  return messages
    .slice(-5)
    .map((message) => {
      if (typeof message === "string") {
        return message;
      }

      return (
        message?.content ||
        message?.text ||
        message?.summary ||
        ""
      );
    })
    .filter(Boolean)
    .join(" ");
}

/**
 * Creator Memory may arrive from different parts of the Mentor
 * architecture while the wider system evolves.
 *
 * This helper creates one safe memory view without forcing the
 * Progression Engine to own the memory architecture.
 */
function resolveCreatorMemory(context = {}) {
  const candidates = [
    context.creatorMemorySignals,
    context.creatorMemoryProfile,
    context.creatorMemory,
    context.memoryContext,
  ].filter(
    (candidate) =>
      candidate &&
      typeof candidate === "object"
  );

  return candidates.reduce(
    (memory, candidate) => ({
      ...memory,
      ...cloneValue(candidate),
    }),
    {}
  );
}

function readMemoryValue(memory, paths = []) {
  for (const path of paths) {
    const parts = path.split(".");
    let current = memory;

    for (const part of parts) {
      if (
        current === null ||
        current === undefined ||
        typeof current !== "object"
      ) {
        current = undefined;
        break;
      }

      current = current[part];
    }

    if (
      current !== undefined &&
      current !== null &&
      current !== ""
    ) {
      return current;
    }
  }

  return null;
}

function normalisePreference(value) {
  if (typeof value === "string") {
    return normaliseText(value);
  }

  if (
    value &&
    typeof value === "object"
  ) {
    return normaliseText(
      value.value ||
        value.preference ||
        value.style ||
        value.mode ||
        value.label ||
        ""
    );
  }

  return "";
}

/**
 * Extracts only progression-relevant memory.
 *
 * Memory is advisory. Current explicit creator direction always
 * has higher priority.
 */
function deriveMemorySignals(context = {}) {
  const memory = resolveCreatorMemory(context);

  const responseDepth = normalisePreference(
    readMemoryValue(memory, [
      "preferredResponseDepth",
      "responseDepth",
      "preferences.responseDepth",
      "communication.responseDepth",
      "communication.preferredResponseDepth",
    ])
  );

  const guidanceStyle = normalisePreference(
    readMemoryValue(memory, [
      "preferredGuidanceStyle",
      "guidanceStyle",
      "preferences.guidanceStyle",
      "mentoring.guidanceStyle",
      "workingStyle.guidanceStyle",
    ])
  );

  const learningStyle = normalisePreference(
    readMemoryValue(memory, [
      "preferredLearningStyle",
      "learningStyle",
      "preferences.learningStyle",
      "learning.preferredStyle",
    ])
  );

  const pacingPreference = normalisePreference(
    readMemoryValue(memory, [
      "preferredPacing",
      "pacingPreference",
      "preferences.pacing",
      "workingStyle.pacing",
      "pace",
    ])
  );

  const autonomyPreference = normalisePreference(
    readMemoryValue(memory, [
      "autonomyPreference",
      "preferredAutonomy",
      "preferences.autonomy",
      "workingStyle.autonomy",
    ])
  );

  const overloadSensitivity = normalisePreference(
    readMemoryValue(memory, [
      "overloadSensitivity",
      "informationTolerance",
      "preferences.informationTolerance",
      "communication.informationTolerance",
    ])
  );

  const buildModePreference = normalisePreference(
    readMemoryValue(memory, [
      "buildMode",
      "workingMode",
      "preferredWorkingMode",
      "preferences.workingMode",
      "workingStyle.mode",
    ])
  );

  const returnPoint =
    readMemoryValue(memory, [
      "returnPoint",
      "continuity.returnPoint",
      "session.returnPoint",
      "lastReturnPoint",
      "nextStep",
      "continuity.nextStep",
    ]) ||
    context.previousReturnPoint ||
    context.previousNextStep ||
    null;

  const previousSummary =
    readMemoryValue(memory, [
      "previousSessionSummary",
      "continuity.previousSessionSummary",
      "lastSessionSummary",
      "sessionSummary",
    ]) ||
    context.previousSessionSummary ||
    null;

  const hasContinuity =
    Boolean(
      returnPoint ||
      previousSummary ||
      context.returningCreator ||
      context.returningToProject
    );

  const prefersConcise = includesAny(
    responseDepth,
    [
      "minimal",
      "short",
      "concise",
      "brief",
      "direct",
    ]
  );

  const prefersDetail = includesAny(
    responseDepth,
    [
      "detailed",
      "deep",
      "thorough",
      "comprehensive",
    ]
  );

  const prefersOneStep = includesAny(
    `${guidanceStyle} ${pacingPreference}`,
    [
      "one step",
      "one-step",
      "step by step",
      "step-by-step",
      "single step",
      "small step",
    ]
  );

  const prefersLeadership = includesAny(
    `${guidanceStyle} ${autonomyPreference}`,
    [
      "lead",
      "guided",
      "guide me",
      "recommend",
      "mentor-led",
    ]
  );

  const prefersAutonomy = includesAny(
    `${guidanceStyle} ${autonomyPreference}`,
    [
      "independent",
      "autonomous",
      "creator-led",
      "i'll do it",
      "ill do it",
      "options",
    ]
  );

  const prefersAction = includesAny(
    `${guidanceStyle} ${buildModePreference}`,
    [
      "build",
      "action",
      "implementation",
      "direct",
      "doing",
      "create",
    ]
  );

  const learnsByExample = includesAny(
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

  const sensitiveToOverload = includesAny(
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
      Object.keys(memory).length > 0,

    raw: memory,

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
  };
}

function detectExplicitDirection({
  message,
  context,
}) {
  const text = normaliseText(message);

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
    context?.creatorExplicitlyAskedToPause ||
    includesAny(text, pausePhrases)
  ) {
    return createDetection({
      value: "pause",
      confidence: 0.94,
      evidence: pausePhrases.filter(
        (phrase) => text.includes(phrase)
      ),
    });
  }

  if (
    context?.creatorExplicitlyAskedToStop ||
    includesAny(text, stopPhrases)
  ) {
    return createDetection({
      value: "stop",
      confidence: 0.94,
      evidence: stopPhrases.filter(
        (phrase) => text.includes(phrase)
      ),
    });
  }

  if (
    context?.creatorExplicitlyAskedToCreate ||
    includesAny(text, createPhrases)
  ) {
    return createDetection({
      value: "create",
      confidence: 0.92,
      evidence: createPhrases.filter(
        (phrase) => text.includes(phrase)
      ),
    });
  }

  if (
    context?.creatorExplicitlyAskedToContinue ||
    context?.creatorExplicitlyAskedForNextStep ||
    includesAny(text, continuePhrases)
  ) {
    return createDetection({
      value: "continue",
      confidence: 0.88,
      evidence: continuePhrases.filter(
        (phrase) => text.includes(phrase)
      ),
    });
  }

  return createDetection({
    value: "none",
    confidence: 0.4,
    evidence: [],
  });
}

function detectSessionPhase({
  message,
  context,
  conversationPlan,
  reflectionPlan,
  memorySignals,
}) {
  const text = normaliseText(message);

  const conversationMode =
    conversationPlan?.conversation?.mode;

  const reflectionDecision =
    reflectionPlan?.decision;

  if (
    context?.returningCreator ||
    context?.returningToProject ||
    (
      memorySignals?.hasContinuity &&
      context?.creatorMessageCount <= 1
    )
  ) {
    return createDetection({
      value: SESSION_PHASES.RETURNING,
      confidence: 0.82,
      evidence: [
        "creator continuity context detected",
      ],
    });
  }

  if (
    context?.creatorExplicitlyAskedToPause
  ) {
    return createDetection({
      value: SESSION_PHASES.PAUSING,
      confidence: 0.9,
      evidence: [
        "creator explicitly requested pause",
      ],
    });
  }

  if (
    conversationMode === "publishing" ||
    context?.projectReadyToPublish
  ) {
    return createDetection({
      value: SESSION_PHASES.PUBLISHING,
      confidence: 0.86,
      evidence: ["publishing state detected"],
    });
  }

  if (
    conversationMode === "refinement" ||
    context?.projectReadyToRefine
  ) {
    return createDetection({
      value: SESSION_PHASES.REFINING,
      confidence: 0.84,
      evidence: ["refinement state detected"],
    });
  }

  if (
    conversationMode === "building"
  ) {
    return createDetection({
      value: SESSION_PHASES.BUILDING,
      confidence: 0.84,
      evidence: ["building mode detected"],
    });
  }

  if (
    conversationMode === "creation" ||
    context?.projectReadyToGenerate ||
    includesAny(text, [
      "let's build",
      "lets build",
      "create it",
      "generate it",
      "make it",
      "write it",
    ])
  ) {
    return createDetection({
      value: SESSION_PHASES.CREATING,
      confidence: 0.82,
      evidence: ["creation state detected"],
    });
  }

  if (
    conversationMode === "learning"
  ) {
    return createDetection({
      value: SESSION_PHASES.LEARNING,
      confidence: 0.8,
      evidence: ["learning mode detected"],
    });
  }

  if (
    conversationMode === "reflection" ||
    reflectionDecision === "reflect"
  ) {
    return createDetection({
      value: SESSION_PHASES.REFLECTING,
      confidence: 0.8,
      evidence: ["reflection state detected"],
    });
  }

  if (
    conversationMode === "recovery" ||
    reflectionDecision ===
      "release-pressure"
  ) {
    return createDetection({
      value: SESSION_PHASES.RECOVERING,
      confidence: 0.82,
      evidence: ["recovery state detected"],
    });
  }

  if (
    conversationMode === "imagination" ||
    conversationMode === "discovery" ||
    includesAny(text, [
      "what if",
      "imagine",
      "could we",
      "i wonder",
      "maybe",
      "perhaps",
    ])
  ) {
    return createDetection({
      value: SESSION_PHASES.BRAINSTORMING,
      confidence: 0.76,
      evidence: ["exploratory language detected"],
    });
  }

  if (
    context?.creatorMessageCount <= 1 &&
    context?.mentorMessageCount <= 1
  ) {
    return createDetection({
      value: SESSION_PHASES.OPENING,
      confidence: 0.7,
      evidence: ["early conversation"],
    });
  }

  return createDetection({
    value: SESSION_PHASES.DISCOVERING,
    confidence: 0.56,
    evidence: [],
  });
}

function detectCreatorEnergy({
  message,
  context,
  reflectionPlan,
}) {
  if (context?.creatorEnergy) {
    return createDetection({
      value: context.creatorEnergy,
      confidence: 0.9,
      evidence: ["supplied creator energy"],
    });
  }

  const text = normaliseText(message);

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
    includesAny(text, depletedPhrases)
  ) {
    return createDetection({
      value: CREATOR_ENERGY_STATES.DEPLETED,
      confidence: 0.9,
      evidence: depletedPhrases.filter(
        (phrase) => text.includes(phrase)
      ),
    });
  }

  if (includesAny(text, lowEnergyPhrases)) {
    return createDetection({
      value: CREATOR_ENERGY_STATES.LOW,
      confidence: 0.84,
      evidence: lowEnergyPhrases.filter(
        (phrase) => text.includes(phrase)
      ),
    });
  }

  if (
    includesAny(text, highEnergyPhrases)
  ) {
    return createDetection({
      value: CREATOR_ENERGY_STATES.HIGH,
      confidence: 0.82,
      evidence: highEnergyPhrases.filter(
        (phrase) => text.includes(phrase)
      ),
    });
  }

  if (
    reflectionPlan?.creatorState
      ?.thinkingMode?.value === "recovery"
  ) {
    return createDetection({
      value:
        CREATOR_ENERGY_STATES.RECOVERING,
      confidence: 0.68,
      evidence: ["recovery mode detected"],
    });
  }

  const messageLength =
    cleanString(message).length;

  if (
    messageLength > 350 ||
    safeNumber(
      context?.consecutiveLongCreatorReplies
    ) >= 2
  ) {
    return createDetection({
      value: CREATOR_ENERGY_STATES.MEDIUM,
      confidence: 0.56,
      evidence: ["sustained creator engagement"],
    });
  }

  return createDetection({
    value: CREATOR_ENERGY_STATES.UNKNOWN,
    confidence: 0.4,
    evidence: [],
  });
}

function detectInformationSaturation({
  message,
  context,
  memorySignals,
}) {
  if (context?.informationSaturation) {
    return createDetection({
      value: context.informationSaturation,
      confidence: 0.9,
      evidence: [
        "supplied information saturation",
      ],
    });
  }

  const text = normaliseText(message);

  const recentMentorText =
    normaliseText(
      getRecentMentorText(context)
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
    includesAny(text, overloadPhrases)
  ) {
    return createDetection({
      value:
        INFORMATION_SATURATION.OVERLOADED,
      confidence: 0.9,
      evidence: overloadPhrases.filter(
        (phrase) => text.includes(phrase)
      ),
    });
  }

  const mentorWordCount =
    recentMentorText
      .split(" ")
      .filter(Boolean).length;

  if (
    mentorWordCount > 900 ||
    safeNumber(
      context?.consecutiveMentorMessages
    ) >= 3
  ) {
    return createDetection({
      value: INFORMATION_SATURATION.HIGH,
      confidence: 0.74,
      evidence: [
        "large volume of recent Mentor information",
      ],
    });
  }

  if (
    memorySignals?.sensitiveToOverload &&
    mentorWordCount > 300
  ) {
    return createDetection({
      value: INFORMATION_SATURATION.MEDIUM,
      confidence: 0.68,
      evidence: [
        "creator memory indicates lower information tolerance",
      ],
    });
  }

  if (
    mentorWordCount > 450 ||
    includesAny(text, saturationPhrases)
  ) {
    return createDetection({
      value: INFORMATION_SATURATION.MEDIUM,
      confidence: 0.62,
      evidence: saturationPhrases.filter(
        (phrase) => text.includes(phrase)
      ),
    });
  }

  return createDetection({
    value: INFORMATION_SATURATION.LOW,
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
}) {
  if (context?.guidanceWindow) {
    return createDetection({
      value: context.guidanceWindow,
      confidence: 0.9,
      evidence: ["supplied guidance window"],
    });
  }

  const text = normaliseText(message);

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
    context?.creatorExplicitlyAskedForGuidance ||
    includesAny(text, openPhrases)
  ) {
    return createDetection({
      value: GUIDANCE_WINDOWS.WIDE_OPEN,
      confidence: 0.92,
      evidence: openPhrases.filter(
        (phrase) => text.includes(phrase)
      ),
    });
  }

  if (
    includesAny(text, closedPhrases) ||
    reflectionPlan?.decision ===
      "hold-space" ||
    reflectionPlan?.decision ===
      "stay-silent"
  ) {
    return createDetection({
      value:
        GUIDANCE_WINDOWS.CLOSED_FOR_NOW,
      confidence: 0.88,
      evidence: [
        ...closedPhrases.filter(
          (phrase) => text.includes(phrase)
        ),
        reflectionPlan?.decision,
      ],
    });
  }

  if (
    informationSaturation.value ===
      INFORMATION_SATURATION.HIGH ||
    informationSaturation.value ===
      INFORMATION_SATURATION.OVERLOADED
  ) {
    return createDetection({
      value: GUIDANCE_WINDOWS.NARROW,
      confidence: 0.82,
      evidence: [
        "information saturation is high",
      ],
    });
  }

  if (
    memorySignals?.prefersLeadership &&
    creatorEnergy.value !==
      CREATOR_ENERGY_STATES.LOW &&
    creatorEnergy.value !==
      CREATOR_ENERGY_STATES.DEPLETED
  ) {
    return createDetection({
      value: GUIDANCE_WINDOWS.WIDE_OPEN,
      confidence: 0.64,
      evidence: [
        "creator memory indicates preference for Mentor leadership",
      ],
    });
  }

  if (
    memorySignals?.prefersAutonomy
  ) {
    return createDetection({
      value:
        GUIDANCE_WINDOWS.PARTIALLY_OPEN,
      confidence: 0.62,
      evidence: [
        "creator memory indicates preference for creator-led work",
      ],
    });
  }

  if (
    creatorEnergy.value ===
      CREATOR_ENERGY_STATES.HIGH
  ) {
    return createDetection({
      value:
        GUIDANCE_WINDOWS.PARTIALLY_OPEN,
      confidence: 0.66,
      evidence: [
        "creator has strong active energy",
      ],
    });
  }

  return createDetection({
    value:
      GUIDANCE_WINDOWS.PARTIALLY_OPEN,
    confidence: 0.52,
    evidence: [],
  });
}

function detectMomentum({
  message,
  context,
  creatorEnergy,
  sessionPhase,
}) {
  const text = normaliseText(message);

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

  if (includesAny(text, stalledPhrases)) {
    return createDetection({
      value: MOMENTUM_STATES.STALLED,
      confidence: 0.86,
      evidence: stalledPhrases.filter(
        (phrase) => text.includes(phrase)
      ),
    });
  }

  if (
    creatorEnergy.value ===
      CREATOR_ENERGY_STATES.RECOVERING ||
    sessionPhase.value ===
      SESSION_PHASES.RECOVERING
  ) {
    return createDetection({
      value: MOMENTUM_STATES.RECOVERING,
      confidence: 0.72,
      evidence: ["recovery state detected"],
    });
  }

  if (
    includesAny(text, risingPhrases)
  ) {
    return createDetection({
      value: MOMENTUM_STATES.RISING,
      confidence: 0.82,
      evidence: risingPhrases.filter(
        (phrase) => text.includes(phrase)
      ),
    });
  }

  if (
    creatorEnergy.value ===
      CREATOR_ENERGY_STATES.HIGH &&
    (
      sessionPhase.value ===
        SESSION_PHASES.CREATING ||
      sessionPhase.value ===
        SESSION_PHASES.BUILDING ||
      sessionPhase.value ===
        SESSION_PHASES.BRAINSTORMING
    )
  ) {
    return createDetection({
      value: MOMENTUM_STATES.STRONG,
      confidence: 0.78,
      evidence: [
        "high energy during active creative phase",
      ],
    });
  }

  if (
    includesAny(text, slowingPhrases) ||
    creatorEnergy.value ===
      CREATOR_ENERGY_STATES.LOW
  ) {
    return createDetection({
      value: MOMENTUM_STATES.SLOWING,
      confidence: 0.68,
      evidence: slowingPhrases.filter(
        (phrase) => text.includes(phrase)
      ),
    });
  }

  return createDetection({
    value: MOMENTUM_STATES.STABLE,
    confidence: 0.52,
    evidence: [],
  });
}

function detectReadiness({
  context,
  conversationPlan,
}) {
  const unresolvedQuestions = Array.isArray(
    context?.unresolvedQuestions
  )
    ? context.unresolvedQuestions
    : [];

  const plannerMode =
    conversationPlan?.conversation?.mode;

  const readyToCreate =
    Boolean(
      context?.projectReadyToGenerate ||
      context?.minimumCreationContextReady ||
      context?.requiredInformationComplete
    ) &&
    unresolvedQuestions.length <= 1;

  const readyToRefine = Boolean(
    context?.projectReadyToRefine ||
    plannerMode === "refinement"
  );

  const readyToPublish = Boolean(
    context?.projectReadyToPublish ||
    plannerMode === "publishing"
  );

  return {
    readyToCreate,
    readyToRefine,
    readyToPublish,
    unresolvedQuestionCount:
      unresolvedQuestions.length,
  };
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
}) {
  if (
    explicitDirection.value === "pause"
  ) {
    return PROGRESSION_DECISIONS.PAUSE_SESSION;
  }

  if (
    explicitDirection.value === "stop"
  ) {
    return PROGRESSION_DECISIONS.END_SESSION_POSITIVELY;
  }

  if (
    creatorEnergy.value ===
      CREATOR_ENERGY_STATES.DEPLETED
  ) {
    return PROGRESSION_DECISIONS.END_SESSION_POSITIVELY;
  }

  if (
    reflectionPlan?.decision ===
      "stay-silent" ||
    reflectionPlan?.decision ===
      "hold-space"
  ) {
    return PROGRESSION_DECISIONS.HOLD_SPACE;
  }

  if (
    reflectionPlan?.decision ===
      "restore-context"
  ) {
    return PROGRESSION_DECISIONS.RESTORE_CONTEXT;
  }

  if (
    sessionPhase.value ===
      SESSION_PHASES.RETURNING &&
    memorySignals?.hasContinuity &&
    explicitDirection.value === "none"
  ) {
    return PROGRESSION_DECISIONS.RESTORE_CONTEXT;
  }

  if (
    reflectionPlan?.decision ===
      "release-pressure"
  ) {
    return PROGRESSION_DECISIONS.RELEASE_PRESSURE;
  }

  if (
    informationSaturation.value ===
      INFORMATION_SATURATION.OVERLOADED
  ) {
    return PROGRESSION_DECISIONS.REDUCE_INFORMATION;
  }

  if (
    explicitDirection.value === "create"
  ) {
    if (readiness.readyToPublish) {
      return PROGRESSION_DECISIONS.MOVE_TO_PUBLISHING;
    }

    if (readiness.readyToRefine) {
      return PROGRESSION_DECISIONS.MOVE_TO_REFINEMENT;
    }

    return PROGRESSION_DECISIONS.MOVE_TO_CREATION;
  }

  if (
    explicitDirection.value === "continue" &&
    (
      sessionPhase.value ===
        SESSION_PHASES.BUILDING ||
      context?.creatorExplicitlyAskedForNextStep ||
      memorySignals?.prefersAction
    )
  ) {
    return PROGRESSION_DECISIONS.MOVE_TO_NEXT_TASK;
  }

  if (
    readiness.readyToPublish &&
    guidanceWindow.value !==
      GUIDANCE_WINDOWS.CLOSED_FOR_NOW
  ) {
    return PROGRESSION_DECISIONS.MOVE_TO_PUBLISHING;
  }

  if (
    readiness.readyToRefine &&
    sessionPhase.value ===
      SESSION_PHASES.REFINING
  ) {
    return PROGRESSION_DECISIONS.MOVE_TO_REFINEMENT;
  }

  if (
    readiness.readyToCreate &&
    (
      momentum.value ===
        MOMENTUM_STATES.RISING ||
      momentum.value ===
        MOMENTUM_STATES.STRONG ||
      sessionPhase.value ===
        SESSION_PHASES.CREATING
    )
  ) {
    return PROGRESSION_DECISIONS.MOVE_TO_CREATION;
  }

  if (
    informationSaturation.value ===
      INFORMATION_SATURATION.HIGH ||
    guidanceWindow.value ===
      GUIDANCE_WINDOWS.NARROW ||
    memorySignals?.prefersOneStep
  ) {
    return PROGRESSION_DECISIONS.OFFER_ONE_SMALL_STEP;
  }

  if (
    momentum.value ===
      MOMENTUM_STATES.STALLED
  ) {
    return PROGRESSION_DECISIONS.OFFER_ONE_SMALL_STEP;
  }

  if (
    creatorEnergy.value ===
      CREATOR_ENERGY_STATES.LOW ||
    momentum.value ===
      MOMENTUM_STATES.SLOWING
  ) {
    return PROGRESSION_DECISIONS.SAVE_AND_RETURN_LATER;
  }

  if (
    sessionPhase.value ===
      SESSION_PHASES.BRAINSTORMING &&
    guidanceWindow.value !==
      GUIDANCE_WINDOWS.CLOSED_FOR_NOW
  ) {
    return PROGRESSION_DECISIONS.CONTINUE_EXPLORING;
  }

  if (
    sessionPhase.value ===
      SESSION_PHASES.LEARNING
  ) {
    return PROGRESSION_DECISIONS.CONTINUE_LEARNING;
  }

  if (
    guidanceWindow.value ===
      GUIDANCE_WINDOWS.CLOSED_FOR_NOW
  ) {
    return PROGRESSION_DECISIONS.WAIT_FOR_CREATOR;
  }

  return PROGRESSION_DECISIONS.CONTINUE_LISTENING;
}

function choosePrimaryAction(decision) {
  switch (decision) {
    case PROGRESSION_DECISIONS.CONTINUE_LISTENING:
      return PROGRESSION_ACTIONS
        .INVITE_CREATOR_TO_CONTINUE;

    case PROGRESSION_DECISIONS.CONTINUE_EXPLORING:
    case PROGRESSION_DECISIONS.CONTINUE_LEARNING:
      return PROGRESSION_ACTIONS
        .ASK_ONE_MORE_QUESTION;

    case PROGRESSION_DECISIONS.HOLD_SPACE:
    case PROGRESSION_DECISIONS.WAIT_FOR_CREATOR:
      return PROGRESSION_ACTIONS
        .WAIT_WITHOUT_NEW_DIRECTION;

    case PROGRESSION_DECISIONS.REDUCE_INFORMATION:
      return PROGRESSION_ACTIONS
        .DO_NOT_ADD_MORE_INFORMATION;

    case PROGRESSION_DECISIONS.OFFER_ONE_SMALL_STEP:
      return PROGRESSION_ACTIONS
        .REDUCE_TO_ONE_RECOMMENDATION;

    case PROGRESSION_DECISIONS.MOVE_TO_CREATION:
      return PROGRESSION_ACTIONS
        .BEGIN_GENERATION;

    case PROGRESSION_DECISIONS.MOVE_TO_NEXT_TASK:
      return PROGRESSION_ACTIONS
        .BEGIN_NEXT_CREATIVE_STEP;

    case PROGRESSION_DECISIONS.MOVE_TO_REFINEMENT:
      return PROGRESSION_ACTIONS
        .BEGIN_REFINEMENT;

    case PROGRESSION_DECISIONS.MOVE_TO_PUBLISHING:
      return PROGRESSION_ACTIONS
        .BEGIN_PUBLISHING;

    case PROGRESSION_DECISIONS.RESTORE_CONTEXT:
      return PROGRESSION_ACTIONS.RECAP_CONTEXT;

    case PROGRESSION_DECISIONS.RELEASE_PRESSURE:
      return PROGRESSION_ACTIONS
        .RELEASE_EXPECTATION;

    case PROGRESSION_DECISIONS.SAVE_AND_RETURN_LATER:
    case PROGRESSION_DECISIONS.PAUSE_SESSION:
      return PROGRESSION_ACTIONS
        .SAVE_CURRENT_PROGRESS;

    case PROGRESSION_DECISIONS.END_SESSION_POSITIVELY:
      return PROGRESSION_ACTIONS
        .CLOSE_WITH_OPEN_DOOR;

    default:
      return PROGRESSION_ACTIONS
        .GIVE_SHORT_ACKNOWLEDGEMENT;
  }
}

function chooseSupportingActions({
  decision,
  context,
  memorySignals,
}) {
  const actions = [];

  if (
    decision ===
      PROGRESSION_DECISIONS.SAVE_AND_RETURN_LATER ||
    decision ===
      PROGRESSION_DECISIONS.PAUSE_SESSION
  ) {
    actions.push(
      PROGRESSION_ACTIONS
        .SUMMARISE_WHAT_IS_READY
    );
  }

  if (
    decision ===
      PROGRESSION_DECISIONS.RELEASE_PRESSURE &&
    context?.activeIdea
  ) {
    actions.push(
      PROGRESSION_ACTIONS
        .OFFER_INSPIRATION_DRAWER
    );
  }

  if (
    decision ===
      PROGRESSION_DECISIONS.RESTORE_CONTEXT &&
    memorySignals?.hasContinuity
  ) {
    actions.push(
      PROGRESSION_ACTIONS
        .RESTORE_CREATOR_WORKING_MODE
    );
  }

  if (
    decision ===
      PROGRESSION_DECISIONS.END_SESSION_POSITIVELY ||
    decision ===
      PROGRESSION_DECISIONS.PAUSE_SESSION
  ) {
    actions.push(
      PROGRESSION_ACTIONS
        .CLOSE_WITH_OPEN_DOOR
    );
  }

  return uniqueValues(actions);
}

function normaliseResponseLengthPreference(
  value
) {
  const preference =
    normalisePreference(value);

  if (
    includesAny(preference, [
      "minimal",
      "very short",
    ])
  ) {
    return RESPONSE_LENGTHS.MINIMAL;
  }

  if (
    includesAny(preference, [
      "short",
      "concise",
      "brief",
      "direct",
    ])
  ) {
    return RESPONSE_LENGTHS.SHORT;
  }

  if (
    includesAny(preference, [
      "medium",
      "balanced",
      "normal",
    ])
  ) {
    return RESPONSE_LENGTHS.MEDIUM;
  }

  if (
    includesAny(preference, [
      "detailed",
      "deep",
      "thorough",
      "comprehensive",
    ])
  ) {
    return RESPONSE_LENGTHS.DETAILED;
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
  const currentPreference =
    normaliseResponseLengthPreference(
      context?.preferredResponseDepth
    );

  const rememberedPreference =
    normaliseResponseLengthPreference(
      memorySignals?.responseDepth
    );

  if (
    decision ===
      PROGRESSION_DECISIONS.HOLD_SPACE ||
    decision ===
      PROGRESSION_DECISIONS.WAIT_FOR_CREATOR
  ) {
    return RESPONSE_LENGTHS.SILENT;
  }

  if (
    decision ===
      PROGRESSION_DECISIONS.MOVE_TO_NEXT_TASK ||
    decision ===
      PROGRESSION_DECISIONS.MOVE_TO_CREATION ||
    decision ===
      PROGRESSION_DECISIONS.MOVE_TO_REFINEMENT ||
    decision ===
      PROGRESSION_DECISIONS.MOVE_TO_PUBLISHING
  ) {
    return RESPONSE_LENGTHS.MINIMAL;
  }

  if (
    creatorEnergy.value ===
      CREATOR_ENERGY_STATES.LOW ||
    creatorEnergy.value ===
      CREATOR_ENERGY_STATES.DEPLETED ||
    informationSaturation.value ===
      INFORMATION_SATURATION.HIGH ||
    informationSaturation.value ===
      INFORMATION_SATURATION.OVERLOADED
  ) {
    return RESPONSE_LENGTHS.SHORT;
  }

  if (currentPreference) {
    return currentPreference;
  }

  if (rememberedPreference) {
    return rememberedPreference;
  }

  if (
    decision ===
      PROGRESSION_DECISIONS.CONTINUE_LEARNING ||
    decision ===
      PROGRESSION_DECISIONS.CONTINUE_EXPLORING
  ) {
    return RESPONSE_LENGTHS.MEDIUM;
  }

  return RESPONSE_LENGTHS.SHORT;
}

function chooseQuestionAllowance({
  decision,
  guidanceWindow,
  informationSaturation,
  memorySignals,
}) {
  if (
    decision ===
      PROGRESSION_DECISIONS.HOLD_SPACE ||
    decision ===
      PROGRESSION_DECISIONS.WAIT_FOR_CREATOR ||
    decision ===
      PROGRESSION_DECISIONS.MOVE_TO_NEXT_TASK ||
    decision ===
      PROGRESSION_DECISIONS.MOVE_TO_CREATION ||
    decision ===
      PROGRESSION_DECISIONS.MOVE_TO_REFINEMENT ||
    decision ===
      PROGRESSION_DECISIONS.MOVE_TO_PUBLISHING ||
    guidanceWindow.value ===
      GUIDANCE_WINDOWS.CLOSED_FOR_NOW
  ) {
    return 0;
  }

  if (
    informationSaturation.value ===
      INFORMATION_SATURATION.HIGH ||
    informationSaturation.value ===
      INFORMATION_SATURATION.OVERLOADED
  ) {
    return 0;
  }

  if (
    memorySignals?.prefersAction &&
    decision ===
      PROGRESSION_DECISIONS.CONTINUE_LISTENING
  ) {
    return 0;
  }

  return 1;
}

function createMemoryGuidance(
  memorySignals
) {
  const guidance = [];

  if (!memorySignals?.available) {
    return guidance;
  }

  guidance.push(
    "Use creator memory as supporting context, not as an instruction that overrides the current message."
  );

  if (memorySignals.prefersConcise) {
    guidance.push(
      "The creator generally prefers concise communication."
    );
  }

  if (memorySignals.prefersDetail) {
    guidance.push(
      "The creator is comfortable with deeper explanation when it is useful."
    );
  }

  if (memorySignals.prefersOneStep) {
    guidance.push(
      "The creator benefits from one clear step at a time."
    );
  }

  if (memorySignals.prefersLeadership) {
    guidance.push(
      "The creator generally welcomes a clear Mentor recommendation."
    );
  }

  if (memorySignals.prefersAutonomy) {
    guidance.push(
      "Preserve creator autonomy and avoid taking control unnecessarily."
    );
  }

  if (memorySignals.prefersAction) {
    guidance.push(
      "The creator generally prefers implementation and forward movement over extended discussion."
    );
  }

  if (memorySignals.learnsByExample) {
    guidance.push(
      "Where teaching is useful, prefer demonstration or a concrete example."
    );
  }

  if (memorySignals.sensitiveToOverload) {
    guidance.push(
      "Keep option count and information density low."
    );
  }

  if (memorySignals.hasContinuity) {
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
}) {
  const guidance = [
    "Keep the creator in ownership of the next step.",
    "Do not add information merely because more information is available.",
    "Conversation must remain in service of creation.",
    "Adapt the response to the creator's current mode and energy.",
    "Do not overwhelm the creator with multiple next steps.",
    "Use no more questions than the plan allows.",
    "Current explicit creator intent has priority over remembered preference.",
    "Do not convert a temporary state into a permanent creator preference.",
    `Preferred response length: ${responseLength}.`,
    `Maximum questions: ${maximumQuestions}.`,
    ...createMemoryGuidance(memorySignals),
  ];

  if (
    decision ===
      PROGRESSION_DECISIONS.RESTORE_CONTEXT
  ) {
    guidance.push(
      "Restore only the context needed to continue.",
      "Do not make the creator repeat information already known.",
      "Recap the previous position briefly.",
      "Return the creator to a clear next step."
    );

    if (memorySignals?.returnPoint) {
      guidance.push(
        `Known return point: ${String(
          memorySignals.returnPoint
        )}.`
      );
    }
  }

  if (
    decision ===
      PROGRESSION_DECISIONS.MOVE_TO_NEXT_TASK
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
      PROGRESSION_DECISIONS.MOVE_TO_CREATION
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
      PROGRESSION_DECISIONS.CONTINUE_EXPLORING
  ) {
    guidance.push(
      "Continue the brainstorming conversation.",
      "Ask only one meaningful question.",
      "Do not force a conclusion while the creator is still discovering."
    );
  }

  if (
    decision ===
      PROGRESSION_DECISIONS.CONTINUE_LEARNING
  ) {
    guidance.push(
      "Explain only the concept currently requested.",
      "Use the creator's preferred learning style where known.",
      "Pause before introducing another concept."
    );
  }

  if (
    decision ===
      PROGRESSION_DECISIONS.REDUCE_INFORMATION
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
      PROGRESSION_DECISIONS.OFFER_ONE_SMALL_STEP
  ) {
    guidance.push(
      "Offer the smallest useful next step.",
      "Do not provide a full roadmap.",
      "Help the creator regain movement before adding complexity."
    );
  }

  if (
    decision ===
      PROGRESSION_DECISIONS.HOLD_SPACE ||
    decision ===
      PROGRESSION_DECISIONS.WAIT_FOR_CREATOR
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
      PROGRESSION_DECISIONS.RELEASE_PRESSURE
  ) {
    guidance.push(
      "Confirm that enough useful material already exists.",
      "Remove pressure to remember or decide immediately.",
      "Leave the door open for the thought to return later.",
      "Continue with what is already known."
    );
  }

  if (
    decision ===
      PROGRESSION_DECISIONS.SAVE_AND_RETURN_LATER ||
    decision ===
      PROGRESSION_DECISIONS.PAUSE_SESSION
  ) {
    guidance.push(
      "Preserve the creator's current progress.",
      "Give a short recap of where the journey paused.",
      "Name the next step clearly for the creator's return.",
      "End without guilt or pressure."
    );
  }

  if (
    decision ===
      PROGRESSION_DECISIONS.END_SESSION_POSITIVELY
  ) {
    guidance.push(
      "Acknowledge the work completed.",
      "Do not introduce another task.",
      "End with an open door for the creator's return."
    );
  }

  if (
    creatorEnergy.value ===
      CREATOR_ENERGY_STATES.HIGH ||
    momentum.value ===
      MOMENTUM_STATES.STRONG ||
    momentum.value ===
      MOMENTUM_STATES.RISING
  ) {
    guidance.push(
      "Protect active momentum.",
      "Prefer action over explanation.",
      "Do not turn the creator from creating into reading."
    );
  }

  if (
    informationSaturation.value ===
      INFORMATION_SATURATION.HIGH ||
    informationSaturation.value ===
      INFORMATION_SATURATION.OVERLOADED
  ) {
    guidance.push(
      "The creator may have received enough information.",
      "Do not add secondary options.",
      "Use one recommendation and one action."
    );
  }

  if (
    guidanceWindow.value ===
      GUIDANCE_WINDOWS.NARROW
  ) {
    guidance.push(
      "Offer guidance only where it unlocks the next step."
    );
  }

  guidance.push(
    `Primary progression action: ${primaryAction}.`
  );

  return uniqueValues(guidance);
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
    "Do not infer a permanent preference from one temporary emotional or energy state.",
    "Do not make the creator repeat context that reliable memory already contains.",
    "Do not expose internal memory machinery unnecessarily to the creator.",
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
}) {
  const memorySummary =
    memorySignals?.available
      ? " Creator memory was available as supporting context."
      : "";

  return (
    `Use the ${decision} progression decision. ` +
    `The session is in the ${sessionPhase.value} phase. ` +
    `Creator energy is ${creatorEnergy.value}, ` +
    `momentum is ${momentum.value}, ` +
    `information saturation is ${informationSaturation.value}, ` +
    `and the guidance window is ${guidanceWindow.value}.` +
    memorySummary
  );
}

function createFallbackProgressionPlan({
  message,
  context,
  error = null,
}) {
  return {
    id: createProgressionId(),
    engine: "progression-engine",
    version: PROGRESSION_ENGINE_VERSION,

    input: {
      message: cleanString(message),
    },

    decision:
      PROGRESSION_DECISIONS.CONTINUE_LISTENING,

    progression: {
      primaryAction:
        PROGRESSION_ACTIONS
          .GIVE_SHORT_ACKNOWLEDGEMENT,

      supportingActions: [],

      responseLength:
        RESPONSE_LENGTHS.SHORT,

      maximumQuestions: 1,

      shouldMoveForward: false,
      shouldPause: false,
      shouldEndSession: false,
      shouldHoldSpace: false,
      shouldReduceInformation: false,
      shouldSaveProgress: false,
      shouldContinueExploring: false,
      shouldContinueLearning: false,
      shouldRestoreContext: false,
    },

    creatorState: {
      sessionPhase: createDetection({
        value: SESSION_PHASES.UNKNOWN,
        confidence: 0.2,
      }),

      creatorEnergy: createDetection({
        value:
          CREATOR_ENERGY_STATES.UNKNOWN,
        confidence: 0.2,
      }),

      informationSaturation:
        createDetection({
          value:
            INFORMATION_SATURATION.UNKNOWN,
          confidence: 0.2,
        }),

      guidanceWindow: createDetection({
        value: GUIDANCE_WINDOWS.UNKNOWN,
        confidence: 0.2,
      }),

      momentum: createDetection({
        value: MOMENTUM_STATES.UNKNOWN,
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
    ],

    guardRails: createGuardRails(),

    contextSnapshot: cloneValue(context),

    decisionSummary:
      "Progression analysis failed. Continue listening with minimal intervention.",

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

function createProgressionEngine() {
  function planProgression({
    message = "",
    context = {},
    conversationPlan = null,
    reflectionPlan = null,
  } = {}) {
    try {
      const combinedContext = {
        ...cloneValue(
          DEFAULT_PROGRESSION_CONTEXT
        ),
        ...cloneValue(context),
      };

      const memorySignals =
        deriveMemorySignals(
          combinedContext
        );

      const explicitDirection =
        detectExplicitDirection({
          message,
          context: combinedContext,
        });

      const sessionPhase =
        detectSessionPhase({
          message,
          context: combinedContext,
          conversationPlan,
          reflectionPlan,
          memorySignals,
        });

      const creatorEnergy =
        detectCreatorEnergy({
          message,
          context: combinedContext,
          reflectionPlan,
        });

      const informationSaturation =
        detectInformationSaturation({
          message,
          context: combinedContext,
          memorySignals,
        });

      const guidanceWindow =
        detectGuidanceWindow({
          message,
          context: combinedContext,
          reflectionPlan,
          creatorEnergy,
          informationSaturation,
          memorySignals,
        });

      const momentum =
        detectMomentum({
          message,
          context: combinedContext,
          creatorEnergy,
          sessionPhase,
        });

      const readiness = detectReadiness({
        context: combinedContext,
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
          context: combinedContext,
          memorySignals,
        });

      const primaryAction =
        choosePrimaryAction(decision);

      const supportingActions =
        chooseSupportingActions({
          decision,
          context: combinedContext,
          memorySignals,
        });

      const responseLength =
        chooseResponseLength({
          decision,
          creatorEnergy,
          informationSaturation,
          context: combinedContext,
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
        });

      return {
        id: createProgressionId(),
        engine: "progression-engine",
        version:
          PROGRESSION_ENGINE_VERSION,

        input: {
          message: cleanString(message),
        },

        decision,

        progression: {
          primaryAction,
          supportingActions,

          responseLength,
          maximumQuestions,

          shouldMoveForward: [
            PROGRESSION_DECISIONS
              .MOVE_TO_CREATION,
            PROGRESSION_DECISIONS
              .MOVE_TO_NEXT_TASK,
            PROGRESSION_DECISIONS
              .MOVE_TO_REFINEMENT,
            PROGRESSION_DECISIONS
              .MOVE_TO_PUBLISHING,
          ].includes(decision),

          shouldPause: [
            PROGRESSION_DECISIONS
              .PAUSE_SESSION,
            PROGRESSION_DECISIONS
              .SAVE_AND_RETURN_LATER,
          ].includes(decision),

          shouldEndSession:
            decision ===
            PROGRESSION_DECISIONS
              .END_SESSION_POSITIVELY,

          shouldHoldSpace: [
            PROGRESSION_DECISIONS
              .HOLD_SPACE,
            PROGRESSION_DECISIONS
              .WAIT_FOR_CREATOR,
          ].includes(decision),

          shouldReduceInformation: [
            PROGRESSION_DECISIONS
              .REDUCE_INFORMATION,
            PROGRESSION_DECISIONS
              .OFFER_ONE_SMALL_STEP,
          ].includes(decision),

          shouldSaveProgress: [
            PROGRESSION_DECISIONS
              .SAVE_AND_RETURN_LATER,
            PROGRESSION_DECISIONS
              .PAUSE_SESSION,
            PROGRESSION_DECISIONS
              .END_SESSION_POSITIVELY,
          ].includes(decision),

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
        },

        creatorState: {
          explicitDirection,
          sessionPhase,
          creatorEnergy,
          informationSaturation,
          guidanceWindow,
          momentum,
          readiness,

          memorySignals: {
            available:
              memorySignals.available,

            responseDepth:
              memorySignals.responseDepth,

            guidanceStyle:
              memorySignals.guidanceStyle,

            learningStyle:
              memorySignals.learningStyle,

            pacingPreference:
              memorySignals.pacingPreference,

            autonomyPreference:
              memorySignals.autonomyPreference,

            buildModePreference:
              memorySignals.buildModePreference,

            prefersConcise:
              memorySignals.prefersConcise,

            prefersDetail:
              memorySignals.prefersDetail,

            prefersOneStep:
              memorySignals.prefersOneStep,

            prefersLeadership:
              memorySignals.prefersLeadership,

            prefersAutonomy:
              memorySignals.prefersAutonomy,

            prefersAction:
              memorySignals.prefersAction,

            learnsByExample:
              memorySignals.learnsByExample,

            sensitiveToOverload:
              memorySignals.sensitiveToOverload,

            hasContinuity:
              memorySignals.hasContinuity,

            returnPoint:
              cloneValue(
                memorySignals.returnPoint
              ),
          },
        },

        responseGuidance,

        guardRails: createGuardRails(),

        creatorProtocol: {
          conversationServesCreation: true,
          protectMomentum: true,
          protectCreatorEnergy: true,
          protectAttention: true,
          adaptInformationDepth: true,
          oneUsefulStepAtATime: true,
          guidanceMustArriveAtRightTime: true,
          creatorMayPauseWithoutLosingProgress:
            true,
          doNotMaximiseConversationLength: true,
          moveForwardWhenEnoughIsKnown: true,

          memorySupportsContinuity: true,
          currentIntentOverridesMemory: true,
          temporaryStateDoesNotBecomePreference:
            true,
          creatorShouldNotRepeatKnownContext:
            true,
        },

        contextSnapshot:
          cloneValue(combinedContext),

        conversationPlanSnapshot:
          cloneValue(conversationPlan),

        reflectionPlanSnapshot:
          cloneValue(reflectionPlan),

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
          }),

        status: "planned",

        createdAt: createTimestamp(),
      };
    } catch (error) {
      console.error(
        "ProgressionEngine planning error:",
        error
      );

      return createFallbackProgressionPlan({
        message,
        context,
        error,
      });
    }
  }

  function shouldMoveForward(plan) {
    return Boolean(
      plan?.progression?.shouldMoveForward
    );
  }

  function shouldReduceInformation(plan) {
    return Boolean(
      plan?.progression
        ?.shouldReduceInformation
    );
  }

  function shouldHoldSpace(plan) {
    return Boolean(
      plan?.progression?.shouldHoldSpace
    );
  }

  function shouldSaveProgress(plan) {
    return Boolean(
      plan?.progression?.shouldSaveProgress
    );
  }

  function shouldEndSession(plan) {
    return Boolean(
      plan?.progression?.shouldEndSession
    );
  }

  function shouldRestoreContext(plan) {
    return Boolean(
      plan?.progression?.shouldRestoreContext
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
  };
}

function planProgression({
  message = "",
  context = {},
  conversationPlan = null,
  reflectionPlan = null,
} = {}) {
  const engine = createProgressionEngine();

  return engine.planProgression({
    message,
    context,
    conversationPlan,
    reflectionPlan,
  });
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
  createProgressionEngine,
  planProgression,
};

export default createProgressionEngine;
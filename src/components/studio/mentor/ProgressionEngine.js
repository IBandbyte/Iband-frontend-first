/**
 * Progression Engine
 * ------------------------------------------------------------
 * The pacing, momentum and next-step decision layer for
 * iBand's AI Mentor — The Creator.
 *
 * This engine does not generate the final Mentor response.
 * It decides whether the experience should:
 *
 * - Continue exploring.
 * - Continue listening.
 * - Hold space.
 * - Reduce information.
 * - Move into creation.
 * - Move to the next task.
 * - Offer one small step.
 * - Pause and return later.
 * - End the current session positively.
 *
 * Core philosophy:
 * - Conversation exists in service of creation.
 * - Do not interrupt creative flow with unnecessary teaching.
 * - Do not keep talking merely because more information exists.
 * - Adapt the amount of guidance to the individual creator.
 * - Protect momentum, energy and attention.
 * - Move forward when enough has been discovered.
 * - Allow unfinished ideas to return later without pressure.
 */

const PROGRESSION_ENGINE_VERSION = "1.0.0";

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

  lastProgressionDecision: null,
  lastProgressionAt: null,
});

/**
 * Returns the current ISO timestamp.
 */
function createTimestamp() {
  return new Date().toISOString();
}

/**
 * Creates a lightweight unique plan id.
 */
function createProgressionId() {
  const randomValue = Math.random()
    .toString(36)
    .slice(2, 10);

  return `progression-plan-${Date.now()}-${randomValue}`;
}

/**
 * Safely clones plain data.
 */
function cloneValue(value) {
  if (value === undefined) {
    return undefined;
  }

  return JSON.parse(JSON.stringify(value));
}

/**
 * Converts unknown values into clean text.
 */
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

/**
 * Returns a clean string.
 */
function cleanString(value) {
  return typeof value === "string"
    ? value.trim()
    : "";
}

/**
 * Returns unique useful values.
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
 * Restricts confidence values to 0–1.
 */
function clampConfidence(value) {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return 0;
  }

  return Math.max(0, Math.min(1, numericValue));
}

/**
 * Creates a consistent detection result.
 */
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

/**
 * Returns true when text contains one or more phrases.
 */
function includesAny(text, phrases = []) {
  return phrases.some((phrase) =>
    text.includes(phrase)
  );
}

/**
 * Counts matching phrases.
 */
function countMatches(text, phrases = []) {
  return phrases.reduce((total, phrase) => {
    return text.includes(phrase)
      ? total + 1
      : total;
  }, 0);
}

/**
 * Converts a supplied numeric value into a safe number.
 */
function safeNumber(value, fallback = 0) {
  const numericValue = Number(value);

  return Number.isFinite(numericValue)
    ? numericValue
    : fallback;
}

/**
 * Returns the latest creator messages as plain text.
 */
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

/**
 * Returns the latest Mentor messages as plain text.
 */
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
 * Detects explicit creator direction.
 */
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

/**
 * Detects the current session phase.
 */
function detectSessionPhase({
  message,
  context,
  conversationPlan,
  reflectionPlan,
}) {
  const text = normaliseText(message);

  const conversationMode =
    conversationPlan?.conversation?.mode;

  const reflectionDecision =
    reflectionPlan?.decision;

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

/**
 * Detects the creator's current energy.
 */
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
    context?.consecutiveLongCreatorReplies >= 2
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

/**
 * Detects whether information is becoming excessive.
 */
function detectInformationSaturation({
  message,
  context,
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
    context?.consecutiveMentorMessages >= 3
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

/**
 * Detects whether guidance is welcome at this moment.
 */
function detectGuidanceWindow({
  message,
  context,
  reflectionPlan,
  creatorEnergy,
  informationSaturation,
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

/**
 * Detects current creative momentum.
 */
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

/**
 * Determines whether enough information exists to act.
 */
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

/**
 * Determines the main progression decision.
 */
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
      context?.creatorExplicitlyAskedForNextStep
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
      GUIDANCE_WINDOWS.NARROW
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

/**
 * Chooses the practical action associated with the decision.
 */
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
      return PROGRESSION_ACTIONS
        .SAVE_CURRENT_PROGRESS;

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

/**
 * Chooses supporting actions.
 */
function chooseSupportingActions({
  decision,
  context,
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

/**
 * Chooses the ideal response length.
 */
function chooseResponseLength({
  decision,
  creatorEnergy,
  informationSaturation,
  context,
}) {
  if (context?.preferredResponseDepth) {
    return context.preferredResponseDepth;
  }

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

/**
 * Determines whether the Mentor should ask another question.
 */
function chooseQuestionAllowance({
  decision,
  guidanceWindow,
  informationSaturation,
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

  return 1;
}

/**
 * Creates response-generation guidance.
 */
function createResponseGuidance({
  decision,
  primaryAction,
  responseLength,
  maximumQuestions,
  creatorEnergy,
  momentum,
  informationSaturation,
  guidanceWindow,
}) {
  const guidance = [
    "Keep the creator in ownership of the next step.",
    "Do not add information merely because more information is available.",
    "Conversation must remain in service of creation.",
    "Adapt the response to the creator's current mode and energy.",
    "Do not overwhelm the creator with multiple next steps.",
    "Use no more questions than the plan allows.",
    `Preferred response length: ${responseLength}.`,
    `Maximum questions: ${maximumQuestions}.`,
  ];

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

/**
 * Creates guard rails for the response layer.
 */
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
  ];
}

/**
 * Produces a concise explanation of the progression decision.
 */
function createDecisionSummary({
  decision,
  sessionPhase,
  creatorEnergy,
  informationSaturation,
  guidanceWindow,
  momentum,
}) {
  return (
    `Use the ${decision} progression decision. ` +
    `The session is in the ${sessionPhase.value} phase. ` +
    `Creator energy is ${creatorEnergy.value}, ` +
    `momentum is ${momentum.value}, ` +
    `information saturation is ${informationSaturation.value}, ` +
    `and the guidance window is ${guidanceWindow.value}.`
  );
}

/**
 * Creates a safe fallback plan.
 */
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

/**
 * Creates the Progression Engine service.
 */
function createProgressionEngine() {
  /**
   * Produces a structured progression plan.
   *
   * @param {Object} input
   * @param {string} input.message
   * @param {Object} [input.context]
   * @param {Object|null} [input.conversationPlan]
   * @param {Object|null} [input.reflectionPlan]
   */
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
        });

      const guidanceWindow =
        detectGuidanceWindow({
          message,
          context: combinedContext,
          reflectionPlan,
          creatorEnergy,
          informationSaturation,
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
        });

      const primaryAction =
        choosePrimaryAction(decision);

      const supportingActions =
        chooseSupportingActions({
          decision,
          context: combinedContext,
        });

      const responseLength =
        chooseResponseLength({
          decision,
          creatorEnergy,
          informationSaturation,
          context: combinedContext,
        });

      const maximumQuestions =
        chooseQuestionAllowance({
          decision,
          guidanceWindow,
          informationSaturation,
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
        },

        creatorState: {
          explicitDirection,
          sessionPhase,
          creatorEnergy,
          informationSaturation,
          guidanceWindow,
          momentum,
          readiness,
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
        },

        contextSnapshot:
          cloneValue(combinedContext),

        conversationPlanSnapshot:
          cloneValue(conversationPlan),

        reflectionPlanSnapshot:
          cloneValue(reflectionPlan),

        decisionSummary:
          createDecisionSummary({
            decision,
            sessionPhase,
            creatorEnergy,
            informationSaturation,
            guidanceWindow,
            momentum,
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

  /**
   * Checks whether the experience should move into action.
   */
  function shouldMoveForward(plan) {
    return Boolean(
      plan?.progression?.shouldMoveForward
    );
  }

  /**
   * Checks whether the Mentor should stop adding information.
   */
  function shouldReduceInformation(plan) {
    return Boolean(
      plan?.progression
        ?.shouldReduceInformation
    );
  }

  /**
   * Checks whether the Mentor should hold space.
   */
  function shouldHoldSpace(plan) {
    return Boolean(
      plan?.progression?.shouldHoldSpace
    );
  }

  /**
   * Checks whether progress should be saved for later.
   */
  function shouldSaveProgress(plan) {
    return Boolean(
      plan?.progression?.shouldSaveProgress
    );
  }

  /**
   * Checks whether the current session should end.
   */
  function shouldEndSession(plan) {
    return Boolean(
      plan?.progression?.shouldEndSession
    );
  }

  return {
    planProgression,
    shouldMoveForward,
    shouldReduceInformation,
    shouldHoldSpace,
    shouldSaveProgress,
    shouldEndSession,
  };
}

/**
 * Convenience method for one-off progression planning.
 */
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
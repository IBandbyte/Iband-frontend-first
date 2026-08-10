/**
 * Reflection Engine
 * ------------------------------------------------------------
 * The reflective listening and creator-understanding layer for
 * iBand's AI Mentor — The Creator.
 *
 * Responsibilities:
 * - Understand whether the creator is still thinking or speaking.
 * - Protect creative flow and emerging ideas.
 * - Decide whether to reflect, encourage, clarify or stay quiet.
 * - Restore conversational context when a thought is lost.
 * - Release pressure when forcing an idea would be harmful.
 * - Surface evidence-based observations without defining the creator.
 * - Respect execution decisions made by Conversation Planner.
 *
 * This engine does NOT write the final Mentor response.
 *
 * Core principles:
 * - Reflect before clarifying.
 * - Seek understanding before guidance.
 * - Never make the creator regret sharing.
 * - Protect confidence, momentum and emerging ideas.
 * - Do not interrupt creativity simply because the Mentor
 *   has something useful to add.
 * - Silence can be an intentional response.
 * - Reflections are possibilities, not verdicts.
 * - The creator remains the authority on their own experience.
 * - When the creator wants action, reflection must not become
 *   an obstacle between the creator and creation.
 */

const REFLECTION_ENGINE_VERSION = "1.1.0";

const REFLECTION_DECISIONS = Object.freeze({
  REFLECT: "reflect",
  ECHO: "echo",
  ENCOURAGE: "encourage",
  CLARIFY_GENTLY: "clarify-gently",
  HOLD_SPACE: "hold-space",
  RESTORE_CONTEXT: "restore-context",
  RELEASE_PRESSURE: "release-pressure",
  MOVE_FORWARD: "move-forward",
  CELEBRATE_GROWTH: "celebrate-growth",
  STAY_SILENT: "stay-silent",
  NONE: "none",
});

const REFLECTION_TYPES = Object.freeze({
  UNDERSTANDING: "understanding",
  STRENGTH: "strength",
  PATTERN: "pattern",
  PROGRESS: "progress",
  EMOTION: "emotion",
  INTENTION: "intention",
  CREATIVE_IDENTITY: "creative-identity",
  MOMENTUM: "momentum",
  RESILIENCE: "resilience",
  POSSIBILITY: "possibility",
  CONTEXT: "context",
  NONE: "none",
});

const CREATOR_THINKING_MODES = Object.freeze({
  FLOW: "flow",
  EXPLORATION: "exploration",
  LEARNING: "learning",
  BUILD: "build",
  REFLECTION: "reflection",
  RECOVERY: "recovery",
  DECISION: "decision",
  INCUBATION: "incubation",
  UNKNOWN: "unknown",
});

const GUIDANCE_RECEPTIVITY = Object.freeze({
  OPEN: "open",
  PARTIALLY_OPEN: "partially-open",
  LOW: "low",
  CLOSED_FOR_NOW: "closed-for-now",
  UNKNOWN: "unknown",
});

const RESPONSE_DEPTH = Object.freeze({
  MINIMAL: "minimal",
  SHORT: "short",
  MEDIUM: "medium",
  DEEP: "deep",
});

const SILENCE_REASONS = Object.freeze({
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

  NO_REFLECTION_NEEDED:
    "no-reflection-needed",
});

const EXECUTION_MENTOR_MOVES = Object.freeze([
  "create",
  "refine",
  "demonstrate",
  "show",
  "continue",
]);

const DEFAULT_REFLECTION_CONTEXT = Object.freeze({
  creatorJourney: "guide",
  creatorType: null,
  creatorExperience: null,
  projectType: null,

  conversationMode: null,
  mentorMove: null,
  mentorTone: "warm",

  creatorMessageCount: 0,
  mentorMessageCount: 0,

  consecutiveCreatorMessages: 0,
  consecutiveMentorMessages: 0,

  recentCreatorMessages: [],
  recentMentorMessages: [],

  recentQuestionsFromCreator: 0,
  recentQuestionsFromMentor: 0,

  creatorResponseLength: "medium",
  mentorResponseLength: "medium",

  creatorAppearsFinished: true,
  creatorExplicitlyAskedForGuidance: false,
  creatorExplicitlyAskedToContinue: false,
  creatorExplicitlyAskedToPause: false,

  requestedHelp: false,
  requestedExplanation: false,
  requestedExample: false,
  requestedDemonstration: false,
  requestedCreation: false,
  requestedChange: false,

  mentorInvoked: true,

  creatorEnergy: "unknown",
  informationSaturation: "low",

  knownPatterns: [],
  observations: [],
  milestones: [],
  recentConversations: [],

  activeProject: null,
  activeIdea: null,

  lastReflectionAt: null,
  lastReflectionType: null,

  preferredResponseDepth: null,
  preferredVisualStyle: null,
  preferredGuidanceStyle: null,

  currentTimestamp: null,
});

/**
 * Returns the current timestamp.
 */
function createTimestamp() {
  return new Date().toISOString();
}

/**
 * Creates a lightweight unique identifier.
 */
function createReflectionId() {
  const randomValue = Math.random()
    .toString(36)
    .slice(2, 10);

  return `reflection-plan-${Date.now()}-${randomValue}`;
}

/**
 * Safely clones plain values.
 */
function cloneValue(value) {
  if (value === undefined) {
    return undefined;
  }

  return JSON.parse(JSON.stringify(value));
}

/**
 * Converts unknown values into searchable text.
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
 * Ensures a clean string.
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
 * Returns the active Conversation Planner Mentor move.
 */
function getPlannerMentorMove(
  conversationPlan,
  context
) {
  return (
    conversationPlan?.conversation?.mentorMove ||
    context?.mentorMove ||
    null
  );
}

/**
 * Returns true when Conversation Planner has already decided
 * that the Mentor should execute rather than interrupt.
 */
function isExecutionMove(
  conversationPlan,
  context
) {
  const mentorMove = getPlannerMentorMove(
    conversationPlan,
    context
  );

  return EXECUTION_MENTOR_MOVES.includes(
    mentorMove
  );
}

/**
 * Estimates whether the creator may still be speaking,
 * thinking or discovering their idea.
 */
function detectCreatorCompletion({
  message,
  context,
}) {
  const text = normaliseText(message);

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
    "go ahead",
    "fire away",
  ];

  if (
    context?.creatorAppearsFinished === false
  ) {
    return createDetection({
      value: false,
      confidence: 0.9,
      evidence: [
        "workspace indicates creator has not finished",
      ],
    });
  }

  if (
    includesAny(text, explicitCompletionPhrases)
  ) {
    return createDetection({
      value: true,
      confidence: 0.88,
      evidence:
        explicitCompletionPhrases.filter(
          (phrase) => text.includes(phrase)
        ),
    });
  }

  if (includesAny(text, thinkingPhrases)) {
    return createDetection({
      value: false,
      confidence: 0.84,
      evidence: thinkingPhrases.filter(
        (phrase) => text.includes(phrase)
      ),
    });
  }

  const finalWord = text
    .split(" ")
    .filter(Boolean)
    .slice(-1)[0];

  if (
    text.endsWith("...") ||
    unfinishedEndings.includes(finalWord)
  ) {
    return createDetection({
      value: false,
      confidence: 0.68,
      evidence: ["unfinished language"],
    });
  }

  return createDetection({
    value: true,
    confidence: 0.56,
    evidence: [],
  });
}

/**
 * Detects the creator's current thinking mode.
 *
 * This is not a diagnosis.
 * It is a temporary creative-context estimate used to adjust
 * response timing, depth and interruption behaviour.
 */
function detectThinkingMode({
  message,
  context,
  conversationPlan,
}) {
  const text = normaliseText(message);

  const mentorMove = getPlannerMentorMove(
    conversationPlan,
    context
  );

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
    "delete it",
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

  /**
   * Planner execution decisions are strong evidence that
   * the creator is currently in build/action mode.
   */
  if (
    EXECUTION_MENTOR_MOVES.includes(
      mentorMove
    )
  ) {
    return createDetection({
      value: CREATOR_THINKING_MODES.BUILD,
      confidence: 0.92,
      evidence: [
        `conversation planner selected ${mentorMove}`,
      ],
    });
  }

  if (
    context?.creatorExplicitlyAskedForGuidance
  ) {
    return createDetection({
      value: CREATOR_THINKING_MODES.DECISION,
      confidence: 0.82,
      evidence: [
        "creator explicitly requested guidance",
      ],
    });
  }

  if (
    includesAny(text, incubationPhrases)
  ) {
    return createDetection({
      value: CREATOR_THINKING_MODES.INCUBATION,
      confidence: 0.88,
      evidence: incubationPhrases.filter(
        (phrase) => text.includes(phrase)
      ),
    });
  }

  if (
    includesAny(text, recoveryPhrases)
  ) {
    return createDetection({
      value: CREATOR_THINKING_MODES.RECOVERY,
      confidence: 0.83,
      evidence: recoveryPhrases.filter(
        (phrase) => text.includes(phrase)
      ),
    });
  }

  if (
    includesAny(text, buildPhrases)
  ) {
    return createDetection({
      value: CREATOR_THINKING_MODES.BUILD,
      confidence: 0.84,
      evidence: buildPhrases.filter(
        (phrase) => text.includes(phrase)
      ),
    });
  }

  if (
    includesAny(text, flowPhrases) ||
    context?.creatorEnergy === "high"
  ) {
    return createDetection({
      value: CREATOR_THINKING_MODES.FLOW,
      confidence: 0.8,
      evidence: [
        ...flowPhrases.filter((phrase) =>
          text.includes(phrase)
        ),
        context?.creatorEnergy === "high"
          ? "high creator energy"
          : null,
      ],
    });
  }

  if (
    includesAny(text, learningPhrases) ||
    conversationPlan?.conversation?.mode ===
      "learning"
  ) {
    return createDetection({
      value: CREATOR_THINKING_MODES.LEARNING,
      confidence: 0.76,
      evidence: learningPhrases.filter(
        (phrase) => text.includes(phrase)
      ),
    });
  }

  if (
    includesAny(text, reflectionPhrases) ||
    conversationPlan?.conversation?.mode ===
      "reflection"
  ) {
    return createDetection({
      value: CREATOR_THINKING_MODES.REFLECTION,
      confidence: 0.76,
      evidence: reflectionPhrases.filter(
        (phrase) => text.includes(phrase)
      ),
    });
  }

  if (
    includesAny(text, explorationPhrases) ||
    context?.recentQuestionsFromCreator >= 2
  ) {
    return createDetection({
      value: CREATOR_THINKING_MODES.EXPLORATION,
      confidence: 0.74,
      evidence: [
        ...explorationPhrases.filter(
          (phrase) => text.includes(phrase)
        ),
        context?.recentQuestionsFromCreator >= 2
          ? "multiple recent creator questions"
          : null,
      ],
    });
  }

  return createDetection({
    value: CREATOR_THINKING_MODES.UNKNOWN,
    confidence: 0.4,
    evidence: [],
  });
}

/**
 * Estimates how receptive the creator is to guidance now.
 *
 * thinkingMode is always the complete detection object.
 */
function detectGuidanceReceptivity({
  message,
  context,
  thinkingMode,
  conversationPlan,
}) {
  const text = normaliseText(message);

  const mentorMove = getPlannerMentorMove(
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
    context?.creatorExplicitlyAskedForGuidance ||
    context?.requestedHelp ||
    includesAny(text, openPhrases)
  ) {
    return createDetection({
      value: GUIDANCE_RECEPTIVITY.OPEN,
      confidence: 0.9,
      evidence: [
        ...openPhrases.filter(
          (phrase) => text.includes(phrase)
        ),
        context?.requestedHelp
          ? "creator requested help"
          : null,
      ],
    });
  }

  if (
    context?.creatorExplicitlyAskedToPause ||
    includesAny(text, lowPhrases)
  ) {
    return createDetection({
      value:
        GUIDANCE_RECEPTIVITY.CLOSED_FOR_NOW,
      confidence: 0.9,
      evidence: lowPhrases.filter(
        (phrase) => text.includes(phrase)
      ),
    });
  }

  /**
   * Creation/refinement requests do not mean the creator is
   * closed to the Mentor. They mean they want execution rather
   * than extra teaching.
   */
  if (
    EXECUTION_MENTOR_MOVES.includes(
      mentorMove
    )
  ) {
    return createDetection({
      value: GUIDANCE_RECEPTIVITY.OPEN,
      confidence: 0.88,
      evidence: [
        `creator is ready for ${mentorMove}`,
      ],
    });
  }

  if (
    thinkingMode?.value ===
      CREATOR_THINKING_MODES.FLOW ||
    thinkingMode?.value ===
      CREATOR_THINKING_MODES.INCUBATION
  ) {
    return createDetection({
      value: GUIDANCE_RECEPTIVITY.LOW,
      confidence: 0.76,
      evidence: [
        `creator appears to be in ${thinkingMode.value} mode`,
      ],
    });
  }

  if (
    thinkingMode?.value ===
    CREATOR_THINKING_MODES.BUILD
  ) {
    return createDetection({
      value:
        GUIDANCE_RECEPTIVITY.PARTIALLY_OPEN,
      confidence: 0.78,
      evidence: [
        "creator appears ready for practical action",
      ],
    });
  }

  if (
    thinkingMode?.value ===
      CREATOR_THINKING_MODES.LEARNING ||
    thinkingMode?.value ===
      CREATOR_THINKING_MODES.EXPLORATION ||
    thinkingMode?.value ===
      CREATOR_THINKING_MODES.REFLECTION ||
    thinkingMode?.value ===
      CREATOR_THINKING_MODES.DECISION
  ) {
    return createDetection({
      value:
        GUIDANCE_RECEPTIVITY.PARTIALLY_OPEN,
      confidence: 0.7,
      evidence: [
        `creator appears to be in ${thinkingMode.value} mode`,
      ],
    });
  }

  return createDetection({
    value: GUIDANCE_RECEPTIVITY.UNKNOWN,
    confidence: 0.42,
    evidence: [],
  });
}

/**
 * Determines whether the Mentor should intentionally wait.
 */
function detectHoldSpaceNeed({
  message,
  context,
  creatorCompletion,
  thinkingMode,
  guidanceReceptivity,
  conversationPlan,
}) {
  const text = normaliseText(message);

  /**
   * Explicit execution should not be blocked by reflective
   * silence unless the creator has explicitly asked to pause.
   */
  if (
    isExecutionMove(
      conversationPlan,
      context
    ) &&
    !context?.creatorExplicitlyAskedToPause
  ) {
    return createDetection({
      value: false,
      confidence: 0.94,
      evidence: [
        "conversation planner selected an execution move",
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
    creatorCompletion.value === false ||
    context?.consecutiveCreatorMessages >= 2 ||
    includesAny(text, shortThinkingResponses);

  const flowNeedsProtection =
    thinkingMode.value ===
      CREATOR_THINKING_MODES.FLOW ||
    thinkingMode.value ===
      CREATOR_THINKING_MODES.INCUBATION;

  const guidanceIsClosed =
    guidanceReceptivity.value ===
      GUIDANCE_RECEPTIVITY.CLOSED_FOR_NOW;

  const shouldHoldSpace =
    creatorMayContinue ||
    flowNeedsProtection ||
    guidanceIsClosed;

  const reasons = [];

  if (creatorCompletion.value === false) {
    reasons.push(
      SILENCE_REASONS.CREATOR_HAS_NOT_FINISHED
    );
  }

  if (
    thinkingMode.value ===
    CREATOR_THINKING_MODES.INCUBATION
  ) {
    reasons.push(
      SILENCE_REASONS.IDEA_MAY_BE_EMERGING
    );
  }

  if (
    thinkingMode.value ===
    CREATOR_THINKING_MODES.FLOW
  ) {
    reasons.push(
      SILENCE_REASONS.FLOW_SHOULD_NOT_BE_INTERRUPTED
    );
  }

  if (guidanceIsClosed) {
    reasons.push(
      SILENCE_REASONS.PRESSURE_SHOULD_BE_RELEASED
    );
  }

  if (
    includesAny(text, shortThinkingResponses)
  ) {
    reasons.push(
      SILENCE_REASONS.CREATOR_MAY_BE_THINKING
    );
  }

  return createDetection({
    value: shouldHoldSpace,
    confidence: shouldHoldSpace
      ? 0.82
      : 0.45,
    evidence: reasons,
  });
}

/**
 * Detects whether context restoration may help recover a
 * lost thought without replacing it.
 */
function detectContextRestorationNeed({
  message,
  context,
}) {
  const text = normaliseText(message);

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
    context?.recentCreatorMessages?.length >
      0 ||
    context?.recentConversations?.length >
      0 ||
    Boolean(context?.activeIdea) ||
    Boolean(context?.activeProject);

  const need =
    includesAny(text, lostThoughtPhrases) &&
    hasContext;

  return createDetection({
    value: need,
    confidence: need ? 0.88 : 0.42,
    evidence: lostThoughtPhrases.filter(
      (phrase) => text.includes(phrase)
    ),
  });
}

/**
 * Detects whether the pressure to remember or produce should
 * be explicitly released.
 */
function detectPressureReleaseNeed({
  message,
  thinkingMode,
  contextRestorationNeeded,
}) {
  const text = normaliseText(message);

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
    includesAny(text, pressurePhrases) ||
    (
      thinkingMode.value ===
        CREATOR_THINKING_MODES.RECOVERY &&
      contextRestorationNeeded.value === false
    );

  return createDetection({
    value: need,
    confidence: need ? 0.78 : 0.4,
    evidence: pressurePhrases.filter(
      (phrase) => text.includes(phrase)
    ),
  });
}

/**
 * Scores an observation for safe reflective use.
 */
function scoreObservation(
  observation,
  context
) {
  if (!observation) {
    return -1;
  }

  const confidence =
    clampConfidence(
      observation.confidence ?? 0.5
    );

  const evidenceCount = Array.isArray(
    observation.evidence
  )
    ? observation.evidence.length
    : 0;

  const permissionBonus =
    observation.permissionToReflect === true
      ? 0.2
      : 0;

  const confirmedBonus =
    observation.status === "confirmed"
      ? 0.18
      : observation.status === "repeated"
        ? 0.1
        : 0;

  const repetitionPenalty =
    observation.lastReflectedAt &&
    Number(observation.reflectionCount) > 1
      ? 0.2
      : 0;

  const relevanceBonus =
    context?.creatorType &&
    observation.category ===
      context.creatorType
      ? 0.1
      : 0;

  return (
    confidence +
    Math.min(evidenceCount * 0.05, 0.2) +
    permissionBonus +
    confirmedBonus +
    relevanceBonus -
    repetitionPenalty
  );
}

/**
 * Selects the strongest evidence-based observation.
 */
function selectReflectionCandidate(context) {
  const observations =
    Array.isArray(context?.observations)
      ? context.observations
      : [];

  const patterns =
    Array.isArray(context?.knownPatterns)
      ? context.knownPatterns
      : [];

  const candidates = [
    ...observations,

    ...patterns.map((pattern) => ({
      ...pattern,

      text:
        pattern.description ||
        pattern.positiveReflection ||
        pattern.name,

      category:
        pattern.category || "pattern",

      status:
        pattern.status || "confirmed",

      permissionToReflect:
        pattern.permissionToReflect !==
        false,
    })),
  ];

  const ranked = candidates
    .map((candidate) => ({
      candidate,
      score: scoreObservation(
        candidate,
        context
      ),
    }))
    .filter((item) => item.score >= 0.65)
    .sort((a, b) => b.score - a.score);

  if (ranked.length === 0) {
    return null;
  }

  return cloneValue(ranked[0].candidate);
}

/**
 * Chooses the most appropriate reflection type.
 */
function chooseReflectionType({
  conversationPlan,
  thinkingMode,
  candidate,
  contextRestorationNeeded,
  pressureReleaseNeeded,
}) {
  if (contextRestorationNeeded.value) {
    return REFLECTION_TYPES.CONTEXT;
  }

  if (pressureReleaseNeeded.value) {
    return REFLECTION_TYPES.MOMENTUM;
  }

  if (candidate?.category === "strength") {
    return REFLECTION_TYPES.STRENGTH;
  }

  if (
    candidate?.category === "progress" ||
    conversationPlan?.conversation?.mode ===
      "celebration"
  ) {
    return REFLECTION_TYPES.PROGRESS;
  }

  if (
    candidate?.category === "resilience"
  ) {
    return REFLECTION_TYPES.RESILIENCE;
  }

  if (
    candidate?.category === "emotion" ||
    thinkingMode.value ===
      CREATOR_THINKING_MODES.REFLECTION
  ) {
    return REFLECTION_TYPES.EMOTION;
  }

  if (
    candidate?.category === "intention"
  ) {
    return REFLECTION_TYPES.INTENTION;
  }

  if (
    candidate?.category ===
    "creative-identity"
  ) {
    return REFLECTION_TYPES.CREATIVE_IDENTITY;
  }

  if (candidate) {
    return REFLECTION_TYPES.PATTERN;
  }

  return REFLECTION_TYPES.UNDERSTANDING;
}

/**
 * Determines the ideal amount of reflective detail.
 */
function chooseResponseDepth({
  thinkingMode,
  guidanceReceptivity,
  context,
  conversationPlan,
}) {
  if (context?.preferredResponseDepth) {
    return context.preferredResponseDepth;
  }

  if (
    isExecutionMove(
      conversationPlan,
      context
    )
  ) {
    return RESPONSE_DEPTH.MINIMAL;
  }

  if (
    thinkingMode.value ===
      CREATOR_THINKING_MODES.BUILD ||
    thinkingMode.value ===
      CREATOR_THINKING_MODES.FLOW ||
    thinkingMode.value ===
      CREATOR_THINKING_MODES.INCUBATION
  ) {
    return RESPONSE_DEPTH.MINIMAL;
  }

  if (
    context?.informationSaturation ===
      "high" ||
    guidanceReceptivity.value ===
      GUIDANCE_RECEPTIVITY.LOW
  ) {
    return RESPONSE_DEPTH.SHORT;
  }

  if (
    thinkingMode.value ===
      CREATOR_THINKING_MODES.EXPLORATION ||
    thinkingMode.value ===
      CREATOR_THINKING_MODES.LEARNING ||
    thinkingMode.value ===
      CREATOR_THINKING_MODES.REFLECTION
  ) {
    return RESPONSE_DEPTH.DEEP;
  }

  return RESPONSE_DEPTH.MEDIUM;
}

/**
 * Selects the primary reflective decision.
 */
function chooseDecision({
  holdSpaceNeeded,
  contextRestorationNeeded,
  pressureReleaseNeeded,
  creatorCompletion,
  thinkingMode,
  candidate,
  conversationPlan,
  context,
}) {
  /**
   * Execution decisions from Conversation Planner take
   * precedence over optional reflection.
   */
  if (
    isExecutionMove(
      conversationPlan,
      context
    ) &&
    !context?.creatorExplicitlyAskedToPause
  ) {
    return REFLECTION_DECISIONS.MOVE_FORWARD;
  }

  if (contextRestorationNeeded.value) {
    return REFLECTION_DECISIONS.RESTORE_CONTEXT;
  }

  if (pressureReleaseNeeded.value) {
    return REFLECTION_DECISIONS.RELEASE_PRESSURE;
  }

  if (
    creatorCompletion.value === false &&
    thinkingMode.value ===
      CREATOR_THINKING_MODES.INCUBATION
  ) {
    return REFLECTION_DECISIONS.STAY_SILENT;
  }

  if (holdSpaceNeeded.value) {
    return REFLECTION_DECISIONS.HOLD_SPACE;
  }

  if (
    creatorCompletion.value === false
  ) {
    return REFLECTION_DECISIONS.STAY_SILENT;
  }

  if (
    conversationPlan?.conversation?.mode ===
      "celebration"
  ) {
    return REFLECTION_DECISIONS.CELEBRATE_GROWTH;
  }

  if (
    thinkingMode.value ===
      CREATOR_THINKING_MODES.BUILD ||
    thinkingMode.value ===
      CREATOR_THINKING_MODES.FLOW
  ) {
    return REFLECTION_DECISIONS.MOVE_FORWARD;
  }

  if (candidate) {
    return REFLECTION_DECISIONS.REFLECT;
  }

  if (
    thinkingMode.value ===
      CREATOR_THINKING_MODES.RECOVERY
  ) {
    return REFLECTION_DECISIONS.ENCOURAGE;
  }

  if (
    thinkingMode.value ===
      CREATOR_THINKING_MODES.EXPLORATION ||
    thinkingMode.value ===
      CREATOR_THINKING_MODES.REFLECTION
  ) {
    return REFLECTION_DECISIONS.ECHO;
  }

  return REFLECTION_DECISIONS.NONE;
}

/**
 * Chooses how long the interface should wait before showing
 * a Mentor acknowledgement.
 *
 * The response layer remains responsible for actual timing.
 */
function chooseTiming({
  decision,
  thinkingMode,
  context,
  conversationPlan,
}) {
  if (
    isExecutionMove(
      conversationPlan,
      context
    )
  ) {
    return {
      responseDelayMs: 0,
      silenceWindowMs: 0,
      allowCreatorToContinue: false,
      canCancelResponseIfCreatorContinues: true,
    };
  }

  if (
    decision ===
    REFLECTION_DECISIONS.STAY_SILENT
  ) {
    return {
      responseDelayMs: 3000,
      silenceWindowMs: 6000,
      allowCreatorToContinue: true,
      canCancelResponseIfCreatorContinues: true,
    };
  }

  if (
    decision ===
    REFLECTION_DECISIONS.HOLD_SPACE
  ) {
    return {
      responseDelayMs: 2000,
      silenceWindowMs: 4500,
      allowCreatorToContinue: true,
      canCancelResponseIfCreatorContinues: true,
    };
  }

  if (
    thinkingMode.value ===
    CREATOR_THINKING_MODES.INCUBATION
  ) {
    return {
      responseDelayMs: 3000,
      silenceWindowMs: 6000,
      allowCreatorToContinue: true,
      canCancelResponseIfCreatorContinues: true,
    };
  }

  if (
    context?.creatorEnergy === "high"
  ) {
    return {
      responseDelayMs: 250,
      silenceWindowMs: 0,
      allowCreatorToContinue: false,
      canCancelResponseIfCreatorContinues: true,
    };
  }

  return {
    responseDelayMs: 600,
    silenceWindowMs: 0,
    allowCreatorToContinue: false,
    canCancelResponseIfCreatorContinues: true,
  };
}

/**
 * Builds instructions for the future response-generation layer.
 */
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
}) {
  const guidance = [
    "Demonstrate that the creator has been heard before adding anything new.",
    "Reflect only what is supported by the supplied conversation or memory.",
    "Present observations as possibilities rather than fixed truths.",
    "Keep the creator in ownership of their experience and idea.",
    "Do not diagnose, label or define the creator.",
    "Do not use empty praise.",
    "Do not make the creator repeat everything they have already explained.",
  ];

  if (
    isExecutionMove(
      conversationPlan,
      context
    )
  ) {
    guidance.push(
      "Conversation Planner has selected an execution move.",
      "Do not insert unnecessary reflection before the requested action.",
      "Move directly into the requested creation, refinement, demonstration or continuation.",
      "Reflection may support the action but must not delay it."
    );
  }

  if (
    decision ===
    REFLECTION_DECISIONS.HOLD_SPACE
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
    REFLECTION_DECISIONS.STAY_SILENT
  ) {
    guidance.push(
      "Return no conversational content unless the interface requires an acknowledgement.",
      "Treat silence as active listening rather than inactivity."
    );
  }

  if (
    decision ===
    REFLECTION_DECISIONS.RESTORE_CONTEXT
  ) {
    guidance.push(
      "Briefly reconstruct the last meaningful conversation landmarks.",
      "Do not supply or invent the missing thought.",
      "Ask whether returning to that context reconnects the creator with their idea.",
      "Use the creator's own words where possible."
    );
  }

  if (
    decision ===
    REFLECTION_DECISIONS.RELEASE_PRESSURE
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
    REFLECTION_DECISIONS.CLARIFY_GENTLY
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
    REFLECTION_DECISIONS.REFLECT
  ) {
    guidance.push(
      "Ask permission before sharing a personal observation when appropriate.",
      "Explain the evidence behind the reflection briefly.",
      "Invite the creator to confirm, reject or refine the reflection.",
      "Do not make the reflection longer than the creator's current mode requires."
    );
  }

  if (
    decision ===
    REFLECTION_DECISIONS.MOVE_FORWARD
  ) {
    guidance.push(
      "Keep the reply practical and brief.",
      "Do not interrupt active creation with theory.",
      "Move directly to the next useful task or creative action."
    );
  }

  if (
    decision ===
    REFLECTION_DECISIONS.ECHO
  ) {
    guidance.push(
      "Use a short echo that shows understanding without taking over.",
      "Do not complete the creator's idea for them.",
      "Leave conversational space after the echo."
    );
  }

  if (
    decision ===
    REFLECTION_DECISIONS.ENCOURAGE
  ) {
    guidance.push(
      "Encourage using evidence from the creator's actions or progress.",
      "Avoid exaggerated or generic praise.",
      "Protect confidence before offering practical adjustments."
    );
  }

  if (
    creatorCompletion.value === false
  ) {
    guidance.push(
      "Assume the creator may still be forming the thought.",
      "Do not ask a new question yet."
    );
  }

  if (
    thinkingMode.value ===
      CREATOR_THINKING_MODES.FLOW ||
    thinkingMode.value ===
      CREATOR_THINKING_MODES.BUILD
  ) {
    guidance.push(
      "Protect momentum.",
      "Prefer action over explanation.",
      "Do not turn the creator from creating into reading."
    );
  }

  if (
    guidanceReceptivity.value ===
    GUIDANCE_RECEPTIVITY.CLOSED_FOR_NOW
  ) {
    guidance.push(
      "Do not provide guidance unless required for safety.",
      "Let the creator continue at their own pace."
    );
  }

  if (candidate) {
    guidance.push(
      `Potential evidence-based reflection: ${
        candidate.text ||
        candidate.description ||
        candidate.name ||
        "available observation"
      }`
    );
  }

  guidance.push(
    `Preferred response depth: ${responseDepth}.`
  );

  return uniqueValues(guidance);
}

/**
 * Creates phrases and behaviours the response layer should avoid.
 */
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
    "Do not turn reflection into a lecture.",
    "Do not compete with the creator for control of the conversation.",
    "Do not claim credit for an idea that emerged from the creator.",
    "Do not repeat a reflection merely because it previously worked.",
    "Do not pressure the creator to respond immediately.",
    "Do not let reflection block an explicit request to create, refine, demonstrate or continue.",
    "Do not mistake an experienced creator's independence for disengagement.",
  ];
}

/**
 * Builds context-restoration landmarks from recent messages.
 */
function createContextLandmarks(context) {
  const creatorMessages = Array.isArray(
    context?.recentCreatorMessages
  )
    ? context.recentCreatorMessages
    : [];

  const conversations = Array.isArray(
    context?.recentConversations
  )
    ? context.recentConversations
    : [];

  const landmarks = [];

  creatorMessages
    .slice(-3)
    .forEach((message) => {
      const text =
        typeof message === "string"
          ? message
          : message?.content ||
            message?.text ||
            message?.summary;

      if (cleanString(text)) {
        landmarks.push({
          source: "creator-message",
          text: cleanString(text),
        });
      }
    });

  conversations
    .slice(0, 3)
    .forEach((conversation) => {
      const text =
        conversation?.summary ||
        conversation?.creatorMessage;

      if (cleanString(text)) {
        landmarks.push({
          source: "conversation-memory",
          text: cleanString(text),
        });
      }
    });

  if (context?.activeIdea) {
    const activeIdeaText =
      typeof context.activeIdea === "string"
        ? context.activeIdea
        : context.activeIdea?.summary ||
          context.activeIdea?.description ||
          context.activeIdea?.title;

    if (cleanString(activeIdeaText)) {
      landmarks.push({
        source: "active-idea",
        text: cleanString(activeIdeaText),
      });
    }
  }

  if (context?.activeProject) {
    const activeProjectText =
      typeof context.activeProject ===
      "string"
        ? context.activeProject
        : context.activeProject?.summary ||
          context.activeProject?.title ||
          context.activeProject?.name;

    if (cleanString(activeProjectText)) {
      landmarks.push({
        source: "active-project",
        text: cleanString(activeProjectText),
      });
    }
  }

  return landmarks.slice(0, 5);
}

/**
 * Produces a concise explanation of the engine's decision.
 */
function createDecisionSummary({
  decision,
  reflectionType,
  thinkingMode,
  guidanceReceptivity,
  responseDepth,
  conversationPlan,
  context,
}) {
  const mentorMove = getPlannerMentorMove(
    conversationPlan,
    context
  );

  const moveSummary = mentorMove
    ? ` Conversation Planner selected ${mentorMove}.`
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

/**
 * Creates a safe fallback plan.
 */
function createFallbackReflectionPlan({
  message,
  context,
  error = null,
}) {
  return {
    id: createReflectionId(),
    engine: "reflection-engine",
    version: REFLECTION_ENGINE_VERSION,

    input: {
      message: cleanString(message),
    },

    decision:
      REFLECTION_DECISIONS.HOLD_SPACE,

    reflection: {
      type:
        REFLECTION_TYPES.UNDERSTANDING,
      candidate: null,
      contextLandmarks: [],
    },

    creatorState: {
      thinkingMode: createDetection({
        value:
          CREATOR_THINKING_MODES.UNKNOWN,
        confidence: 0.2,
      }),

      guidanceReceptivity:
        createDetection({
          value:
            GUIDANCE_RECEPTIVITY.UNKNOWN,
          confidence: 0.2,
        }),

      appearsFinished: createDetection({
        value: true,
        confidence: 0.2,
      }),
    },

    timing: {
      responseDelayMs: 1200,
      silenceWindowMs: 2000,
      allowCreatorToContinue: true,
      canCancelResponseIfCreatorContinues:
        true,
    },

    responseDepth: RESPONSE_DEPTH.SHORT,

    responseGuidance: [
      "Listen carefully.",
      "Use a short acknowledgement.",
      "Do not introduce a new direction.",
      "Ask no more than one question.",
    ],

    guardRails: createGuardRails(),

    contextSnapshot: cloneValue(context),

    decisionSummary:
      "Reflection analysis failed. Hold space and use safe listening behaviour.",

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
 * Creates the Reflection Engine service.
 */
function createReflectionEngine() {
  /**
   * Produces a structured reflection plan.
   *
   * @param {Object} input
   * @param {string} input.message
   * @param {Object} [input.context]
   * @param {Object|null} [input.conversationPlan]
   */
  function planReflection({
    message = "",
    context = {},
    conversationPlan = null,
  } = {}) {
    try {
      const combinedContext = {
        ...cloneValue(
          DEFAULT_REFLECTION_CONTEXT
        ),
        ...cloneValue(context),

        conversationMode:
          context?.conversationMode ||
          conversationPlan?.conversation
            ?.mode ||
          null,

        mentorMove:
          context?.mentorMove ||
          conversationPlan?.conversation
            ?.mentorMove ||
          null,

        mentorTone:
          context?.mentorTone ||
          conversationPlan?.conversation
            ?.tone ||
          "warm",

        currentTimestamp:
          context?.currentTimestamp ||
          createTimestamp(),
      };

      const creatorCompletion =
        detectCreatorCompletion({
          message,
          context: combinedContext,
        });

      const thinkingMode =
        detectThinkingMode({
          message,
          context: combinedContext,
          conversationPlan,
        });

      /**
       * v1.1:
       * Pass the complete detection object consistently.
       */
      const guidanceReceptivity =
        detectGuidanceReceptivity({
          message,
          context: combinedContext,
          thinkingMode,
          conversationPlan,
        });

      const holdSpaceNeeded =
        detectHoldSpaceNeed({
          message,
          context: combinedContext,
          creatorCompletion,
          thinkingMode,
          guidanceReceptivity,
          conversationPlan,
        });

      const contextRestorationNeeded =
        detectContextRestorationNeed({
          message,
          context: combinedContext,
        });

      const pressureReleaseNeeded =
        detectPressureReleaseNeed({
          message,
          thinkingMode,
          contextRestorationNeeded,
        });

      const candidate =
        selectReflectionCandidate(
          combinedContext
        );

      const reflectionType =
        chooseReflectionType({
          conversationPlan,
          thinkingMode,
          candidate,
          contextRestorationNeeded,
          pressureReleaseNeeded,
        });

      const responseDepth =
        chooseResponseDepth({
          thinkingMode,
          guidanceReceptivity,
          context: combinedContext,
          conversationPlan,
        });

      const decision = chooseDecision({
        holdSpaceNeeded,
        contextRestorationNeeded,
        pressureReleaseNeeded,
        creatorCompletion,
        thinkingMode,
        candidate,
        conversationPlan,
        context: combinedContext,
      });

      const timing = chooseTiming({
        decision,
        thinkingMode,
        context: combinedContext,
        conversationPlan,
      });

      const contextLandmarks =
        contextRestorationNeeded.value
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
          context: combinedContext,
        });

      return {
        id: createReflectionId(),
        engine: "reflection-engine",
        version:
          REFLECTION_ENGINE_VERSION,

        input: {
          message: cleanString(message),
        },

        decision,

        reflection: {
          type: reflectionType,
          candidate,
          contextLandmarks,

          shouldAskPermission:
            decision ===
              REFLECTION_DECISIONS.REFLECT &&
            Boolean(candidate),

          shouldInviteCorrection:
            decision ===
              REFLECTION_DECISIONS.REFLECT,

          shouldDemonstrateUnderstanding:
            !isExecutionMove(
              conversationPlan,
              combinedContext
            ),

          shouldClarify:
            decision ===
              REFLECTION_DECISIONS.CLARIFY_GENTLY,

          shouldReleasePressure:
            pressureReleaseNeeded.value,

          shouldRestoreContext:
            contextRestorationNeeded.value,

          shouldYieldToExecution:
            isExecutionMove(
              conversationPlan,
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
        },

        timing,

        responseDepth,

        responseGuidance,

        guardRails: createGuardRails(),

        creatorProtocol: {
          reflectBeforeClarifying: true,
          seekUnderstandingBeforeGuidance:
            true,
          protectMomentum: true,
          protectEmergence: true,
          protectThinkingTime: true,
          silenceCanBeAResponse: true,
          evidenceBeforeReflection: true,
          creatorOwnsTheirExperience: true,
          oneMeaningfulQuestionAtATime:
            true,
          conversationServesCreation: true,

          /**
           * v1.1:
           * Reflection serves the creative process.
           * It does not control it.
           */
          actionBeforeReflectionWhenRequested:
            true,
          reflectionMustNotBlockCreation:
            true,
          respectCreatorExperience: true,
          creatorCanOverrideMentorDirection:
            true,
        },

        contextSnapshot:
          cloneValue(combinedContext),

        conversationPlanSnapshot:
          cloneValue(conversationPlan),

        decisionSummary:
          createDecisionSummary({
            decision,
            reflectionType,
            thinkingMode,
            guidanceReceptivity,
            responseDepth,
            conversationPlan,
            context: combinedContext,
          }),

        status: "planned",

        createdAt: createTimestamp(),
      };
    } catch (error) {
      console.error(
        "ReflectionEngine planning error:",
        error
      );

      return createFallbackReflectionPlan({
        message,
        context,
        error,
      });
    }
  }

  /**
   * Convenience check for whether the response layer should
   * pause before replying.
   */
  function shouldHoldSpace(plan) {
    return Boolean(
      plan?.decision ===
        REFLECTION_DECISIONS.HOLD_SPACE ||
      plan?.decision ===
        REFLECTION_DECISIONS.STAY_SILENT ||
      plan?.creatorState?.holdSpaceNeeded
        ?.value
    );
  }

  /**
   * Convenience check for whether context restoration should
   * be attempted before new ideas are introduced.
   */
  function shouldRestoreContext(plan) {
    return Boolean(
      plan?.decision ===
        REFLECTION_DECISIONS.RESTORE_CONTEXT ||
      plan?.reflection
        ?.shouldRestoreContext
    );
  }

  /**
   * Convenience check for whether pressure should be released.
   */
  function shouldReleasePressure(plan) {
    return Boolean(
      plan?.decision ===
        REFLECTION_DECISIONS.RELEASE_PRESSURE ||
      plan?.reflection
        ?.shouldReleasePressure
    );
  }

  /**
   * Convenience check for whether Reflection should step aside
   * and allow an execution move to continue immediately.
   */
  function shouldYieldToExecution(plan) {
    return Boolean(
      plan?.reflection
        ?.shouldYieldToExecution ||
      plan?.decision ===
        REFLECTION_DECISIONS.MOVE_FORWARD
    );
  }

  return {
    planReflection,
    shouldHoldSpace,
    shouldRestoreContext,
    shouldReleasePressure,
    shouldYieldToExecution,
  };
}

/**
 * Convenience method for one-off reflection planning.
 */
function planReflection({
  message = "",
  context = {},
  conversationPlan = null,
} = {}) {
  const engine = createReflectionEngine();

  return engine.planReflection({
    message,
    context,
    conversationPlan,
  });
}

export {
  REFLECTION_ENGINE_VERSION,
  REFLECTION_DECISIONS,
  REFLECTION_TYPES,
  CREATOR_THINKING_MODES,
  GUIDANCE_RECEPTIVITY,
  RESPONSE_DEPTH,
  SILENCE_REASONS,
  createReflectionEngine,
  planReflection,
};

export default createReflectionEngine;
/**
 * Communication Voice Engine
 * ------------------------------------------------------------
 * The communication-intelligence layer for iBand's AI Mentor —
 * The Creator.
 *
 * This engine receives:
 *
 * - An AdaptiveMentorEngine behaviour plan.
 * - A ResponseComposer blueprint.
 * - Current creator and relationship context.
 *
 * It produces:
 *
 * - A communication voice plan.
 * - Relationship and familiarity calibration.
 * - Text-expression guidance.
 * - Spoken-performance guidance.
 * - Emotional cadence.
 * - Pace, emphasis, pause and transition instructions.
 * - Humour, analogy, storytelling and shared-language policies.
 * - Conversation-opening, continuation and landing behaviour.
 * - Evidence and uncertainty controls.
 * - Solo and multi-creator participation guidance.
 *
 * It does not:
 *
 * - Generate final response wording.
 * - Perform speech synthesis.
 * - Persist memory directly.
 * - Diagnose the creator.
 * - Infer private traits without evidence.
 * - Replace the Mentor's permanent identity or principles.
 *
 * Core philosophy:
 *
 * - Communicate with the creator who is present now.
 * - Respond to evidence rather than imagined problems.
 * - Read the trajectory of the conversation, not only the last message.
 * - Educational, helpful and well paced does not mean long.
 * - Do not reassure someone who has not shown uncertainty.
 * - Do not explain what the relationship already understands.
 * - Earn the right to use fewer words.
 * - Silence and pauses are meaningful forms of communication.
 * - Text and speech should express the same underlying Mentor.
 * - Creator choice should tune the performance without changing
 *   the Mentor's principles.
 */

const COMMUNICATION_VOICE_ENGINE_VERSION = "1.0.0";

const COMMUNICATION_MODES = Object.freeze({
  BUILD: "build",
  FLOW: "flow",
  EXPLORATION: "exploration",
  LEARNING: "learning",
  REFLECTION: "reflection",
  RECOVERY: "recovery",
  INCUBATION: "incubation",
  CELEBRATION: "celebration",
  COLLABORATION: "collaboration",
  CONVERSATION_LANDING: "conversation-landing",
  GENERAL: "general",
});

const RELATIONSHIP_STAGES = Object.freeze({
  NEW: "new",
  DEVELOPING: "developing",
  ESTABLISHED: "established",
  TRUSTED: "trusted",
  LONG_TERM: "long-term",
});

const FAMILIARITY_LEVELS = Object.freeze({
  FORMAL: "formal",
  POLITE: "polite",
  NATURAL: "natural",
  FAMILIAR: "familiar",
  SHARED_SHORTHAND: "shared-shorthand",
});

const COMMUNICATION_PACES = Object.freeze({
  VERY_SLOW: "very-slow",
  SLOW: "slow",
  MEASURED: "measured",
  NATURAL: "natural",
  BRISK: "brisk",
  FAST: "fast",
});

const COMMUNICATION_DEPTHS = Object.freeze({
  MINIMAL: "minimal",
  CONCISE: "concise",
  BALANCED: "balanced",
  EXPLANATORY: "explanatory",
  DEEP: "deep",
});

const COMMUNICATION_TONES = Object.freeze({
  QUIET: "quiet",
  CALM: "calm",
  WARM: "warm",
  FOCUSED: "focused",
  CONFIDENT: "confident",
  ENERGETIC: "energetic",
  PLAYFUL: "playful",
  REFLECTIVE: "reflective",
  REASSURING: "reassuring",
  CELEBRATORY: "celebratory",
});

const COMMUNICATION_ENERGY = Object.freeze({
  VERY_LOW: "very-low",
  LOW: "low",
  MATCHED: "matched",
  LIFTING: "lifting",
  HIGH: "high",
});

const DIRECTNESS_LEVELS = Object.freeze({
  VERY_GENTLE: "very-gentle",
  GENTLE: "gentle",
  BALANCED: "balanced",
  DIRECT: "direct",
  VERY_DIRECT: "very-direct",
});

const HUMOUR_LEVELS = Object.freeze({
  NONE: "none",
  TRACE: "trace",
  LIGHT: "light",
  NATURAL: "natural",
  PLAYFUL: "playful",
});

const STORYTELLING_LEVELS = Object.freeze({
  NONE: "none",
  MICRO: "micro",
  LIGHT: "light",
  MODERATE: "moderate",
  FEATURED: "featured",
});

const ANALOGY_LEVELS = Object.freeze({
  NONE: "none",
  OPTIONAL: "optional",
  USEFUL: "useful",
  PREFERRED: "preferred",
});

const PAUSE_STYLES = Object.freeze({
  NONE: "none",
  MICRO: "micro",
  NATURAL: "natural",
  REFLECTIVE: "reflective",
  HOLD_SPACE: "hold-space",
});

const EMPHASIS_STYLES = Object.freeze({
  FLAT: "flat",
  LIGHT: "light",
  NATURAL: "natural",
  SELECTIVE: "selective",
  STRONG: "strong",
});

const CONVERSATION_PHASES = Object.freeze({
  OPENING: "opening",
  DEVELOPING: "developing",
  DEEPENING: "deepening",
  TRANSITIONING: "transitioning",
  RETURNING: "returning",
  LANDING: "landing",
  CLOSED: "closed",
});

const CREATOR_SIGNAL_CONFIDENCE = Object.freeze({
  VERY_LOW: "very-low",
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high",
  VERY_HIGH: "very-high",
});

const SHORT_REPLY_INTERPRETATIONS = Object.freeze({
  UNDERSTOOD: "understood",
  AGREES: "agrees",
  PROCESSING: "processing",
  BUSY: "busy",
  WANTS_TO_CONTINUE: "wants-to-continue",
  WANTS_TO_MOVE_ON: "wants-to-move-on",
  UNCERTAIN: "uncertain",
  OVERWHELMED: "overwhelmed",
  FILLER: "filler",
  UNKNOWN: "unknown",
});

const CHECK_IN_POLICIES = Object.freeze({
  NONE: "none",
  OPTIONAL: "optional",
  RECOMMENDED: "recommended",
  REQUIRED_BEFORE_PROGRESSING:
    "required-before-progressing",
});

const CHECK_IN_TYPES = Object.freeze({
  EXPERIENCE: "experience",
  PACE: "pace",
  ALIGNMENT: "alignment",
  UNDERSTANDING: "understanding",
  DIRECTION: "direction",
  COMPLETENESS: "completeness",
  READINESS: "readiness",
});

const RESPONSE_EFFECTS = Object.freeze({
  CLARITY: "clarity",
  CONFIDENCE: "confidence",
  CURIOSITY: "curiosity",
  MOMENTUM: "momentum",
  CALM: "calm",
  CONNECTION: "connection",
  UNDERSTANDING: "understanding",
  READINESS: "readiness",
  CELEBRATION: "celebration",
});

const COMMUNICATION_CHANNELS = Object.freeze({
  TEXT: "text",
  SPEECH: "speech",
  TEXT_AND_SPEECH: "text-and-speech",
  FUTURE_AVATAR: "future-avatar",
});

const PARTICIPATION_MODES = Object.freeze({
  SOLO: "solo",
  PRIMARY_WITH_GUEST: "primary-with-guest",
  COLLABORATIVE: "collaborative",
  GROUP: "group",
});

const PARTICIPANT_ROLES = Object.freeze({
  PRIMARY_CREATOR: "primary-creator",
  COLLABORATOR: "collaborator",
  GUEST: "guest",
  OBSERVER: "observer",
  PRODUCER: "producer",
  MENTOR: "mentor",
  UNKNOWN: "unknown",
});

const COMMUNICATION_ACTIONS = Object.freeze({
  MATCH_AND_CONTINUE: "match-and-continue",
  ANSWER_CONCISELY: "answer-concisely",
  EXPLAIN_ONE_CONCEPT: "explain-one-concept",
  ASK_LOW_PRESSURE_CHECK_IN:
    "ask-low-pressure-check-in",
  HOLD_SPACE: "hold-space",
  REDUCE_PRESSURE: "reduce-pressure",
  USE_SHARED_SHORTHAND:
    "use-shared-shorthand",
  USE_LIGHT_HUMOUR: "use-light-humour",
  USE_ANALOGY: "use-analogy",
  USE_MICRO_STORY: "use-micro-story",
  WELCOME_RETURN: "welcome-return",
  WELCOME_PARTICIPANT:
    "welcome-participant",
  FACILITATE_COLLABORATION:
    "facilitate-collaboration",
  LAND_CONVERSATION:
    "land-conversation",
  MOVE_TO_ACTION: "move-to-action",
});

const DEFAULT_VOICE_PROFILE = Object.freeze({
  id: "balanced-default",
  label: "Balanced Mentor",

  language: "en",
  locale: "en-GB",

  apparentAge: "neutral-adult",
  genderPresentation: "creator-choice",
  accent: "neutral",

  warmth: 0.72,
  calmness: 0.68,
  confidence: 0.76,
  energy: 0.56,
  curiosity: 0.62,
  humour: 0.42,
  storytelling: 0.38,
  directness: 0.58,
  formality: 0.34,

  speechRate: 1,
  pitch: 1,
  volume: 1,

  creatorCustomised: false,
});

const DEFAULT_COMMUNICATION_CONTEXT = Object.freeze({
  creatorId: null,
  creatorName: null,
  creatorJourney: "guide",

  message: "",
  recentCreatorMessages: [],
  recentMentorMessages: [],
  recentConversations: [],

  activeProject: null,
  activeIdea: null,
  previousTask: null,
  nextTask: null,

  conversationMode: null,
  thinkingMode: null,
  creatorEnergy: null,
  momentum: null,
  guidanceWindow: null,
  informationSaturation: null,

  relationshipStage: null,
  interactionCount: 0,
  knownDurationDays: 0,

  creatorConfidence: null,
  creatorAppearsConfused: false,
  creatorExplicitlyAskedForHelp: false,
  creatorExplicitlyAskedForExplanation: false,
  creatorExplicitlyAskedToContinue: false,
  creatorExplicitlyAskedForNextStep: false,
  creatorExplicitlyAskedToPause: false,
  creatorExplicitlyAskedToStop: false,

  creatorIsReturning: false,
  elapsedSinceLastMessageMs: null,

  establishedVocabulary: [],
  sharedMeanings: [],
  sharedRituals: [],
  sharedJokes: [],

  preferredResponseDepth: null,
  preferredCommunicationPace: null,
  preferredVoiceProfile: null,
  preferredChannel: null,

  participants: [],
  primaryCreatorId: null,
  currentSpeakerId: null,
  participationMode: null,

  language: "en",
  locale: "en-GB",

  currentTimestamp: null,
});

/**
 * Returns the current ISO timestamp.
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

  return `communication-voice-plan-${Date.now()}-${randomValue}`;
}

/**
 * Safely clones plain JSON-compatible values.
 */
function cloneValue(value) {
  if (value === undefined) {
    return undefined;
  }

  return JSON.parse(JSON.stringify(value));
}

/**
 * Creates a clean string.
 */
function cleanString(value) {
  return typeof value === "string"
    ? value.trim()
    : "";
}

/**
 * Normalises text for lightweight detection.
 */
function normaliseText(value) {
  return cleanString(value)
    .toLowerCase()
    .replace(/[’‘]/g, "'")
    .replace(/\s+/g, " ");
}

/**
 * Restricts a numeric value to a range.
 */
function clampNumber(
  value,
  minimum = 0,
  maximum = 1,
  fallback = minimum
) {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return fallback;
  }

  return Math.max(
    minimum,
    Math.min(maximum, numericValue)
  );
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
 * Safely reads a nested property.
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
      typeof currentValue !== "object"
    ) {
      return fallback;
    }

    currentValue = currentValue[key];
  }

  return currentValue ?? fallback;
}

/**
 * Checks whether text contains one of the supplied phrases.
 */
function includesAny(text, phrases = []) {
  return phrases.some((phrase) =>
    text.includes(phrase)
  );
}

/**
 * Converts a list of messages into searchable text.
 */
function extractMessageText(messages = []) {
  if (!Array.isArray(messages)) {
    return "";
  }

  return messages
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
 * Creates a consistent evidence object.
 */
function createEvidence({
  signal,
  confidence = 0.5,
  source = "current-message",
  details = null,
}) {
  return {
    signal,
    confidence: clampNumber(confidence),
    source,
    details: cloneValue(details),
  };
}

/**
 * Resolves the current relationship stage.
 *
 * Explicit context always takes priority. Otherwise, the engine uses
 * conservative thresholds and never treats message count alone as
 * proof of trust.
 */
function resolveRelationshipStage(context) {
  if (
    Object.values(
      RELATIONSHIP_STAGES
    ).includes(context?.relationshipStage)
  ) {
    return context.relationshipStage;
  }

  const interactionCount =
    Number(context?.interactionCount) || 0;

  const knownDurationDays =
    Number(context?.knownDurationDays) || 0;

  const sharedHistoryCount =
    (
      context?.sharedMeanings?.length || 0
    ) +
    (
      context?.sharedRituals?.length || 0
    ) +
    (
      context?.sharedJokes?.length || 0
    );

  if (
    interactionCount >= 500 ||
    knownDurationDays >= 365
  ) {
    return RELATIONSHIP_STAGES.LONG_TERM;
  }

  if (
    interactionCount >= 150 ||
    sharedHistoryCount >= 8
  ) {
    return RELATIONSHIP_STAGES.TRUSTED;
  }

  if (
    interactionCount >= 30 ||
    sharedHistoryCount >= 3
  ) {
    return RELATIONSHIP_STAGES.ESTABLISHED;
  }

  if (interactionCount >= 5) {
    return RELATIONSHIP_STAGES.DEVELOPING;
  }

  return RELATIONSHIP_STAGES.NEW;
}

/**
 * Resolves the permitted level of familiarity.
 */
function resolveFamiliarityLevel({
  relationshipStage,
  context,
}) {
  const hasSharedShorthand =
    (
      context?.sharedMeanings?.length || 0
    ) > 0 ||
    (
      context?.sharedRituals?.length || 0
    ) > 0;

  if (
    relationshipStage ===
      RELATIONSHIP_STAGES.LONG_TERM &&
    hasSharedShorthand
  ) {
    return FAMILIARITY_LEVELS
      .SHARED_SHORTHAND;
  }

  if (
    relationshipStage ===
      RELATIONSHIP_STAGES.TRUSTED ||
    relationshipStage ===
      RELATIONSHIP_STAGES.LONG_TERM
  ) {
    return FAMILIARITY_LEVELS.FAMILIAR;
  }

  if (
    relationshipStage ===
      RELATIONSHIP_STAGES.ESTABLISHED
  ) {
    return FAMILIARITY_LEVELS.NATURAL;
  }

  if (
    relationshipStage ===
      RELATIONSHIP_STAGES.DEVELOPING
  ) {
    return FAMILIARITY_LEVELS.POLITE;
  }

  return FAMILIARITY_LEVELS.FORMAL;
}

/**
 * Resolves the broad communication mode from context and plans.
 */
function resolveCommunicationMode({
  adaptivePlan,
  context,
}) {
  const signals =
    adaptivePlan?.signals || [];

  if (
    context?.participationMode ===
      PARTICIPATION_MODES.COLLABORATIVE ||
    context?.participationMode ===
      PARTICIPATION_MODES.GROUP ||
    signals.includes("collaboration-mode")
  ) {
    return COMMUNICATION_MODES.COLLABORATION;
  }

  if (
    signals.includes("build-mode") ||
    context?.thinkingMode === "build"
  ) {
    return COMMUNICATION_MODES.BUILD;
  }

  if (
    signals.includes("flow-mode") ||
    context?.thinkingMode === "flow"
  ) {
    return COMMUNICATION_MODES.FLOW;
  }

  if (
    signals.includes("learning-mode") ||
    context?.thinkingMode === "learning"
  ) {
    return COMMUNICATION_MODES.LEARNING;
  }

  if (
    signals.includes("reflection-mode") ||
    context?.thinkingMode === "reflection"
  ) {
    return COMMUNICATION_MODES.REFLECTION;
  }

  if (
    signals.includes("recovery-mode") ||
    context?.thinkingMode === "recovery"
  ) {
    return COMMUNICATION_MODES.RECOVERY;
  }

  if (
    signals.includes("incubation-mode") ||
    context?.thinkingMode === "incubation"
  ) {
    return COMMUNICATION_MODES.INCUBATION;
  }

  if (
    signals.includes("exploration-mode") ||
    context?.thinkingMode === "exploration"
  ) {
    return COMMUNICATION_MODES.EXPLORATION;
  }

  if (
    getNestedValue(
      adaptivePlan,
      "primaryAction.action",
      null
    ) === "end-positively"
  ) {
    return COMMUNICATION_MODES
      .CONVERSATION_LANDING;
  }

  return COMMUNICATION_MODES.GENERAL;
}

/**
 * Detects the current conversation phase.
 */
function resolveConversationPhase({
  message,
  adaptivePlan,
  context,
}) {
  const text = normaliseText(message);

  const landingPhrases = [
    "anyway",
    "oh well",
    "i'll get back to you",
    "ill get back to you",
    "i'd better go",
    "id better go",
    "catch you later",
    "speak soon",
    "goodnight",
    "good night",
    "bye for now",
    "i'll be back later",
    "ill be back later",
  ];

  if (
    context?.creatorExplicitlyAskedToStop ||
    getNestedValue(
      adaptivePlan,
      "primaryAction.action",
      null
    ) === "end-positively"
  ) {
    return CONVERSATION_PHASES.CLOSED;
  }

  if (
    includesAny(text, landingPhrases)
  ) {
    return CONVERSATION_PHASES.LANDING;
  }

  if (context?.creatorIsReturning) {
    return CONVERSATION_PHASES.RETURNING;
  }

  const creatorMessageCount =
    context?.recentCreatorMessages?.length || 0;

  if (creatorMessageCount <= 1) {
    return CONVERSATION_PHASES.OPENING;
  }

  if (
    getNestedValue(
      adaptivePlan,
      "execution.shouldMoveForward",
      false
    )
  ) {
    return CONVERSATION_PHASES.TRANSITIONING;
  }

  if (
    [
      COMMUNICATION_MODES.REFLECTION,
      COMMUNICATION_MODES.EXPLORATION,
      COMMUNICATION_MODES.LEARNING,
    ].includes(
      resolveCommunicationMode({
        adaptivePlan,
        context,
      })
    )
  ) {
    return CONVERSATION_PHASES.DEEPENING;
  }

  return CONVERSATION_PHASES.DEVELOPING;
}

/**
 * Detects whether the current message is a short reply.
 */
function detectShortReply(message) {
  const cleanedMessage =
    cleanString(message);

  if (!cleanedMessage) {
    return {
      isShortReply: false,
      wordCount: 0,
      text: "",
    };
  }

  const wordCount =
    cleanedMessage.split(/\s+/).length;

  return {
    isShortReply:
      wordCount <= 3 &&
      cleanedMessage.length <= 24,

    wordCount,
    text: cleanedMessage,
  };
}

/**
 * Interprets a short reply conservatively.
 *
 * It intentionally returns several possibilities rather than
 * pretending that words such as "cool", "okay" or "yeah" have one
 * reliable meaning.
 */
function interpretShortReply({
  message,
  context,
  adaptivePlan,
}) {
  const detection =
    detectShortReply(message);

  if (!detection.isShortReply) {
    return {
      detected: false,
      possibilities: [],
      confidence:
        CREATOR_SIGNAL_CONFIDENCE.HIGH,
      recommendedAssumption: null,
    };
  }

  const text =
    normaliseText(detection.text);

  const possibilities = [];

  const addPossibility = (
    interpretation,
    confidence,
    evidence
  ) => {
    possibilities.push({
      interpretation,
      confidence: clampNumber(confidence),
      evidence,
    });
  };

  if (
    includesAny(text, [
      "cool",
      "great",
      "perfect",
      "nice",
      "excellent",
    ])
  ) {
    addPossibility(
      SHORT_REPLY_INTERPRETATIONS
        .UNDERSTOOD,
      0.48,
      "positive acknowledgement"
    );

    addPossibility(
      SHORT_REPLY_INTERPRETATIONS
        .AGREES,
      0.46,
      "positive acknowledgement"
    );

    addPossibility(
      SHORT_REPLY_INTERPRETATIONS
        .WANTS_TO_CONTINUE,
      0.38,
      "brief forward-moving reply"
    );

    addPossibility(
      SHORT_REPLY_INTERPRETATIONS
        .FILLER,
      0.28,
      "brief reply may preserve conversation"
    );
  }

  if (
    includesAny(text, [
      "ok",
      "okay",
      "yeah",
      "yep",
      "right",
      "sure",
    ])
  ) {
    addPossibility(
      SHORT_REPLY_INTERPRETATIONS
        .UNDERSTOOD,
      0.38,
      "general acknowledgement"
    );

    addPossibility(
      SHORT_REPLY_INTERPRETATIONS
        .PROCESSING,
      0.36,
      "general acknowledgement"
    );

    addPossibility(
      SHORT_REPLY_INTERPRETATIONS
        .WANTS_TO_MOVE_ON,
      0.3,
      "general acknowledgement"
    );

    addPossibility(
      SHORT_REPLY_INTERPRETATIONS
        .FILLER,
      0.28,
      "general acknowledgement"
    );
  }

  if (
    context?.creatorExplicitlyAskedToContinue ||
    context?.creatorExplicitlyAskedForNextStep ||
    getNestedValue(
      adaptivePlan,
      "execution.shouldMoveForward",
      false
    )
  ) {
    addPossibility(
      SHORT_REPLY_INTERPRETATIONS
        .WANTS_TO_CONTINUE,
      0.78,
      "explicit forward direction in context"
    );
  }

  if (
    context?.creatorAppearsConfused ||
    context?.creatorExplicitlyAskedForExplanation
  ) {
    addPossibility(
      SHORT_REPLY_INTERPRETATIONS
        .UNCERTAIN,
      0.7,
      "confusion or explanation request in context"
    );
  }

  if (
    context?.informationSaturation === "high" ||
    context?.informationSaturation ===
      "overloaded"
  ) {
    addPossibility(
      SHORT_REPLY_INTERPRETATIONS
        .OVERWHELMED,
      0.68,
      "high information saturation"
    );
  }

  if (
    context?.creatorEnergy === "low" ||
    context?.creatorEnergy === "depleted"
  ) {
    addPossibility(
      SHORT_REPLY_INTERPRETATIONS.BUSY,
      0.36,
      "limited-response context"
    );

    addPossibility(
      SHORT_REPLY_INTERPRETATIONS
        .PROCESSING,
      0.45,
      "low-energy context"
    );
  }

  if (possibilities.length === 0) {
    possibilities.push({
      interpretation:
        SHORT_REPLY_INTERPRETATIONS.UNKNOWN,
      confidence: 0.25,
      evidence:
        "short reply has insufficient context",
    });
  }

  const rankedPossibilities =
    possibilities.sort(
      (a, b) =>
        b.confidence - a.confidence
    );

  const strongest =
    rankedPossibilities[0];

  const secondStrongest =
    rankedPossibilities[1];

  const separation =
    strongest &&
    secondStrongest
      ? strongest.confidence -
        secondStrongest.confidence
      : strongest?.confidence || 0;

  let confidence =
    CREATOR_SIGNAL_CONFIDENCE.LOW;

  if (
    strongest?.confidence >= 0.75 &&
    separation >= 0.2
  ) {
    confidence =
      CREATOR_SIGNAL_CONFIDENCE.HIGH;
  } else if (
    strongest?.confidence >= 0.55 &&
    separation >= 0.1
  ) {
    confidence =
      CREATOR_SIGNAL_CONFIDENCE.MEDIUM;
  }

  return {
    detected: true,
    possibilities:
      cloneValue(rankedPossibilities),
    confidence,
    recommendedAssumption:
      confidence ===
        CREATOR_SIGNAL_CONFIDENCE.HIGH
        ? strongest.interpretation
        : null,
  };
}

/**
 * Detects evidence of uncertainty or reduced confidence.
 *
 * The engine does not treat phrases such as "silly idea" as proof
 * of insecurity without supporting evidence.
 */
function detectCreatorUncertainty({
  message,
  context,
}) {
  const text = normaliseText(message);

  const explicitUncertaintyPhrases = [
    "i'm not sure",
    "im not sure",
    "i don't know",
    "i dont know",
    "i'm struggling",
    "im struggling",
    "i'm confused",
    "im confused",
    "does this make sense",
    "i may be wrong",
    "this might be wrong",
    "i can't explain",
    "i cant explain",
    "i'm lost",
    "im lost",
  ];

  const softeningPhrases = [
    "silly idea",
    "stupid idea",
    "random idea",
    "just a thought",
    "maybe",
    "perhaps",
  ];

  const explicitMatches =
    explicitUncertaintyPhrases.filter(
      (phrase) => text.includes(phrase)
    );

  const softeningMatches =
    softeningPhrases.filter(
      (phrase) => text.includes(phrase)
    );

  const evidence = [];

  explicitMatches.forEach((phrase) => {
    evidence.push(
      createEvidence({
        signal:
          "explicit-creator-uncertainty",
        confidence: 0.9,
        details: phrase,
      })
    );
  });

  if (
    context?.creatorAppearsConfused
  ) {
    evidence.push(
      createEvidence({
        signal:
          "context-reports-confusion",
        confidence: 0.82,
        source: "context",
      })
    );
  }

  if (
    context?.creatorExplicitlyAskedForHelp ||
    context?.creatorExplicitlyAskedForExplanation
  ) {
    evidence.push(
      createEvidence({
        signal:
          "creator-requested-support",
        confidence: 0.85,
        source: "context",
      })
    );
  }

  softeningMatches.forEach((phrase) => {
    evidence.push(
      createEvidence({
        signal:
          "possible-language-softening",
        confidence: 0.35,
        details: phrase,
      })
    );
  });

  const strongestConfidence =
    evidence.reduce(
      (maximum, item) =>
        Math.max(
          maximum,
          item.confidence
        ),
      0
    );

  return {
    detected:
      strongestConfidence >= 0.6,
    possible:
      strongestConfidence > 0,
    confidence:
      strongestConfidence,
    evidence,
    shouldReassure:
      strongestConfidence >= 0.72,
  };
}

/**
 * Detects whether the creator is asking many questions.
 */
function analyseQuestionPattern({
  message,
  context,
}) {
  const recentText = normaliseText(
    [
      extractMessageText(
        context?.recentCreatorMessages
      ),
      message,
    ].join(" ")
  );

  const questionCount =
    (
      recentText.match(/\?/g) || []
    ).length;

  const buildingPhrases = [
    "what about",
    "could it",
    "could we",
    "how would",
    "what if",
    "can it also",
  ];

  const reassurancePhrases = [
    "will it work",
    "do you think",
    "am i doing",
    "is this right",
    "what if i get it wrong",
  ];

  const learningPhrases = [
    "why",
    "how does",
    "can you explain",
    "what does",
  ];

  const buildingScore =
    buildingPhrases.filter(
      (phrase) =>
        recentText.includes(phrase)
    ).length;

  const reassuranceScore =
    reassurancePhrases.filter(
      (phrase) =>
        recentText.includes(phrase)
    ).length;

  const learningScore =
    learningPhrases.filter(
      (phrase) =>
        recentText.includes(phrase)
    ).length;

  let likelyPurpose = "unknown";

  if (
    buildingScore >
      reassuranceScore &&
    buildingScore >= learningScore
  ) {
    likelyPurpose =
      "creative-expansion";
  } else if (
    reassuranceScore >
      buildingScore &&
    reassuranceScore >= learningScore
  ) {
    likelyPurpose =
      "seeking-reassurance";
  } else if (learningScore > 0) {
    likelyPurpose = "learning";
  }

  return {
    questionCount,
    manyQuestions: questionCount >= 4,
    likelyPurpose,
    scores: {
      building: buildingScore,
      reassurance: reassuranceScore,
      learning: learningScore,
    },
  };
}

/**
 * Resolves participation mode and speaker information.
 */
function resolveParticipation({
  context,
}) {
  const participants =
    Array.isArray(context?.participants)
      ? context.participants
      : [];

  let participationMode =
    context?.participationMode;

  if (!participationMode) {
    if (participants.length <= 1) {
      participationMode =
        PARTICIPATION_MODES.SOLO;
    } else if (
      participants.length === 2 &&
      context?.primaryCreatorId
    ) {
      participationMode =
        PARTICIPATION_MODES
          .PRIMARY_WITH_GUEST;
    } else if (
      participants.length > 1
    ) {
      participationMode =
        PARTICIPATION_MODES.COLLABORATIVE;
    } else {
      participationMode =
        PARTICIPATION_MODES.SOLO;
    }
  }

  const currentSpeaker =
    participants.find(
      (participant) =>
        participant?.id ===
        context?.currentSpeakerId
    ) || null;

  const primaryCreator =
    participants.find(
      (participant) =>
        participant?.id ===
        context?.primaryCreatorId
    ) || null;

  const unknownSpeaker =
    Boolean(
      context?.currentSpeakerId &&
      !currentSpeaker
    );

  return {
    mode: participationMode,
    participants:
      cloneValue(participants),
    currentSpeaker:
      cloneValue(currentSpeaker),
    primaryCreator:
      cloneValue(primaryCreator),
    unknownSpeaker,
    requiresIntroduction:
      unknownSpeaker ||
      Boolean(
        currentSpeaker &&
        currentSpeaker?.known === false
      ),
  };
}

/**
 * Resolves the communication channel.
 *
 * Text remains the canonical content representation. Speech performs
 * the same communication plan rather than inventing a new one.
 */
function resolveCommunicationChannel({
  context,
}) {
  const preferredChannel =
    context?.preferredChannel;

  if (
    Object.values(
      COMMUNICATION_CHANNELS
    ).includes(preferredChannel)
  ) {
    return preferredChannel;
  }

  return COMMUNICATION_CHANNELS.TEXT;
}

/**
 * Resolves communication pace.
 */
function resolveCommunicationPace({
  mode,
  adaptivePlan,
  context,
  uncertainty,
}) {
  if (
    Object.values(
      COMMUNICATION_PACES
    ).includes(
      context?.preferredCommunicationPace
    )
  ) {
    return context
      .preferredCommunicationPace;
  }

  if (
    uncertainty.shouldReassure ||
    context?.creatorAppearsConfused
  ) {
    return COMMUNICATION_PACES.MEASURED;
  }

  if (
    context?.informationSaturation ===
      "high" ||
    context?.informationSaturation ===
      "overloaded"
  ) {
    return COMMUNICATION_PACES.SLOW;
  }

  if (
    mode === COMMUNICATION_MODES.BUILD ||
    mode === COMMUNICATION_MODES.FLOW
  ) {
    return COMMUNICATION_PACES.FAST;
  }

  if (
    mode ===
      COMMUNICATION_MODES.REFLECTION ||
    mode ===
      COMMUNICATION_MODES.RECOVERY
  ) {
    return COMMUNICATION_PACES.MEASURED;
  }

  if (
    getNestedValue(
      adaptivePlan,
      "behaviour.responseDepth",
      null
    ) === "one-line"
  ) {
    return COMMUNICATION_PACES.BRISK;
  }

  return COMMUNICATION_PACES.NATURAL;
}

/**
 * Resolves response depth.
 */
function resolveCommunicationDepth({
  mode,
  adaptivePlan,
  context,
  questionPattern,
}) {
  if (
    Object.values(
      COMMUNICATION_DEPTHS
    ).includes(
      context?.preferredResponseDepth
    )
  ) {
    return context.preferredResponseDepth;
  }

  const adaptiveDepth =
    getNestedValue(
      adaptivePlan,
      "behaviour.responseDepth",
      "short"
    );

  if (
    mode === COMMUNICATION_MODES.BUILD ||
    mode === COMMUNICATION_MODES.FLOW
  ) {
    return COMMUNICATION_DEPTHS.CONCISE;
  }

  if (
    context?.informationSaturation ===
      "high" ||
    context?.informationSaturation ===
      "overloaded"
  ) {
    return COMMUNICATION_DEPTHS.CONCISE;
  }

  if (
    questionPattern.likelyPurpose ===
      "learning" ||
    adaptiveDepth === "detailed"
  ) {
    return COMMUNICATION_DEPTHS
      .EXPLANATORY;
  }

  if (
    mode ===
      COMMUNICATION_MODES.REFLECTION ||
    mode ===
      COMMUNICATION_MODES.EXPLORATION
  ) {
    return COMMUNICATION_DEPTHS.BALANCED;
  }

  if (adaptiveDepth === "one-line") {
    return COMMUNICATION_DEPTHS.MINIMAL;
  }

  return COMMUNICATION_DEPTHS.BALANCED;
}

/**
 * Resolves tone.
 */
function resolveCommunicationTone({
  mode,
  uncertainty,
  context,
}) {
  if (
    uncertainty.shouldReassure
  ) {
    return COMMUNICATION_TONES
      .REASSURING;
  }

  if (
    context?.creatorEnergy === "low" ||
    context?.creatorEnergy === "depleted"
  ) {
    return COMMUNICATION_TONES.CALM;
  }

  switch (mode) {
    case COMMUNICATION_MODES.BUILD:
      return COMMUNICATION_TONES.FOCUSED;

    case COMMUNICATION_MODES.FLOW:
      return COMMUNICATION_TONES.ENERGETIC;

    case COMMUNICATION_MODES.LEARNING:
      return COMMUNICATION_TONES.WARM;

    case COMMUNICATION_MODES.REFLECTION:
      return COMMUNICATION_TONES.REFLECTIVE;

    case COMMUNICATION_MODES.RECOVERY:
      return COMMUNICATION_TONES.CALM;

    case COMMUNICATION_MODES.CELEBRATION:
      return COMMUNICATION_TONES
        .CELEBRATORY;

    case COMMUNICATION_MODES.COLLABORATION:
      return COMMUNICATION_TONES.WARM;

    case COMMUNICATION_MODES
      .CONVERSATION_LANDING:
      return COMMUNICATION_TONES.QUIET;

    default:
      return COMMUNICATION_TONES.WARM;
  }
}

/**
 * Resolves directness.
 */
function resolveDirectness({
  mode,
  adaptivePlan,
  uncertainty,
}) {
  if (uncertainty.shouldReassure) {
    return DIRECTNESS_LEVELS.GENTLE;
  }

  const stance =
    getNestedValue(
      adaptivePlan,
      "behaviour.leadershipStance",
      "walk-beside"
    );

  if (
    mode === COMMUNICATION_MODES.BUILD ||
    stance === "lead"
  ) {
    return DIRECTNESS_LEVELS.DIRECT;
  }

  if (
    mode ===
      COMMUNICATION_MODES.REFLECTION ||
    mode ===
      COMMUNICATION_MODES.RECOVERY
  ) {
    return DIRECTNESS_LEVELS.GENTLE;
  }

  return DIRECTNESS_LEVELS.BALANCED;
}

/**
 * Resolves energy.
 */
function resolveCommunicationEnergy({
  mode,
  context,
}) {
  if (
    context?.creatorEnergy === "low" ||
    context?.creatorEnergy === "depleted"
  ) {
    return COMMUNICATION_ENERGY.LOW;
  }

  if (
    mode === COMMUNICATION_MODES.FLOW ||
    mode === COMMUNICATION_MODES.BUILD ||
    context?.momentum === "strong"
  ) {
    return COMMUNICATION_ENERGY.HIGH;
  }

  if (
    mode ===
      COMMUNICATION_MODES.RECOVERY ||
    mode ===
      COMMUNICATION_MODES.REFLECTION ||
    mode ===
      COMMUNICATION_MODES
        .CONVERSATION_LANDING
  ) {
    return COMMUNICATION_ENERGY.LOW;
  }

  return COMMUNICATION_ENERGY.MATCHED;
}

/**
 * Resolves humour policy.
 *
 * Humour is earned through relationship and context. A new
 * relationship should not be forced into false familiarity.
 */
function resolveHumourPolicy({
  relationshipStage,
  familiarity,
  mode,
  context,
  uncertainty,
}) {
  if (
    uncertainty.shouldReassure ||
    context?.humourAllowed === false
  ) {
    return {
      level: HUMOUR_LEVELS.NONE,
      mayUseCallback: false,
      mayUseSharedJoke: false,
      reason:
        "Humour may distract from the creator's current need.",
    };
  }

  if (
    mode ===
      COMMUNICATION_MODES.RECOVERY ||
    mode ===
      COMMUNICATION_MODES.REFLECTION
  ) {
    return {
      level: HUMOUR_LEVELS.TRACE,
      mayUseCallback: false,
      mayUseSharedJoke: false,
      reason:
        "Use humour only if it emerges naturally and protects the moment.",
    };
  }

  if (
    familiarity ===
      FAMILIARITY_LEVELS
        .SHARED_SHORTHAND
  ) {
    return {
      level: HUMOUR_LEVELS.NATURAL,
      mayUseCallback: true,
      mayUseSharedJoke:
        (
          context?.sharedJokes?.length || 0
        ) > 0,
      reason:
        "The relationship has earned contextual humour and callbacks.",
    };
  }

  if (
    relationshipStage ===
      RELATIONSHIP_STAGES.TRUSTED ||
    relationshipStage ===
      RELATIONSHIP_STAGES.LONG_TERM
  ) {
    return {
      level: HUMOUR_LEVELS.LIGHT,
      mayUseCallback: true,
      mayUseSharedJoke: false,
      reason:
        "Light humour may support an established relationship.",
    };
  }

  if (
    relationshipStage ===
      RELATIONSHIP_STAGES.ESTABLISHED
  ) {
    return {
      level: HUMOUR_LEVELS.TRACE,
      mayUseCallback: false,
      mayUseSharedJoke: false,
      reason:
        "Use only naturally emerging humour.",
    };
  }

  return {
    level: HUMOUR_LEVELS.NONE,
    mayUseCallback: false,
    mayUseSharedJoke: false,
    reason:
      "Do not manufacture familiarity in a new relationship.",
  };
}

/**
 * Resolves analogy and storytelling use.
 */
function resolveCreativeExpression({
  mode,
  context,
  relationshipStage,
}) {
  const creatorUsesAnalogies =
    (
      context?.establishedVocabulary || []
    ).some((value) =>
      [
        "analogy",
        "simile",
        "metaphor",
        "story",
      ].includes(
        normaliseText(value)
      )
    );

  let analogy =
    ANALOGY_LEVELS.OPTIONAL;

  let storytelling =
    STORYTELLING_LEVELS.NONE;

  if (
    mode === COMMUNICATION_MODES.LEARNING
  ) {
    analogy = creatorUsesAnalogies
      ? ANALOGY_LEVELS.PREFERRED
      : ANALOGY_LEVELS.USEFUL;

    storytelling =
      STORYTELLING_LEVELS.LIGHT;
  }

  if (
    mode ===
      COMMUNICATION_MODES.EXPLORATION ||
    mode ===
      COMMUNICATION_MODES.REFLECTION
  ) {
    analogy =
      ANALOGY_LEVELS.USEFUL;

    storytelling =
      relationshipStage ===
        RELATIONSHIP_STAGES.NEW
        ? STORYTELLING_LEVELS.MICRO
        : STORYTELLING_LEVELS.LIGHT;
  }

  if (
    mode === COMMUNICATION_MODES.BUILD ||
    mode === COMMUNICATION_MODES.FLOW
  ) {
    analogy = ANALOGY_LEVELS.NONE;
    storytelling =
      STORYTELLING_LEVELS.NONE;
  }

  return {
    analogy,
    storytelling,
  };
}

/**
 * Resolves pause and emphasis guidance.
 */
function resolvePerformance({
  mode,
  channel,
  uncertainty,
  conversationPhase,
}) {
  let pauseStyle =
    PAUSE_STYLES.NATURAL;

  let emphasis =
    EMPHASIS_STYLES.NATURAL;

  if (
    mode === COMMUNICATION_MODES.BUILD ||
    mode === COMMUNICATION_MODES.FLOW
  ) {
    pauseStyle = PAUSE_STYLES.MICRO;
    emphasis =
      EMPHASIS_STYLES.SELECTIVE;
  }

  if (
    mode ===
      COMMUNICATION_MODES.REFLECTION ||
    mode ===
      COMMUNICATION_MODES.RECOVERY
  ) {
    pauseStyle =
      PAUSE_STYLES.REFLECTIVE;
    emphasis =
      EMPHASIS_STYLES.LIGHT;
  }

  if (
    uncertainty.shouldReassure
  ) {
    pauseStyle =
      PAUSE_STYLES.NATURAL;
    emphasis =
      EMPHASIS_STYLES.LIGHT;
  }

  if (
    conversationPhase ===
      CONVERSATION_PHASES.LANDING
  ) {
    pauseStyle =
      PAUSE_STYLES.REFLECTIVE;
    emphasis =
      EMPHASIS_STYLES.LIGHT;
  }

  return {
    channel,

    text: {
      paragraphSpacing:
        pauseStyle ===
          PAUSE_STYLES.REFLECTIVE
          ? "generous"
          : pauseStyle ===
              PAUSE_STYLES.MICRO
            ? "compact"
            : "natural",

      sentenceLength:
        mode ===
          COMMUNICATION_MODES.BUILD
          ? "short"
          : mode ===
              COMMUNICATION_MODES.REFLECTION
            ? "varied"
            : "natural",

      punctuation:
        "Use punctuation to support natural rhythm without theatrical overuse.",

      lineBreaks:
        "Use line breaks only where they create genuine cadence or clarity.",
    },

    speech: {
      pauseStyle,

      openingPauseMs:
        pauseStyle ===
          PAUSE_STYLES.REFLECTIVE
          ? 450
          : pauseStyle ===
              PAUSE_STYLES.MICRO
            ? 80
            : 180,

      interSentencePauseMs:
        pauseStyle ===
          PAUSE_STYLES.REFLECTIVE
          ? 420
          : pauseStyle ===
              PAUSE_STYLES.MICRO
            ? 100
            : 220,

      emphasis,

      avoidEqualStress: true,

      guidance: [
        "Do not stress every word equally.",
        "Emphasise only the words carrying the sentence's meaning.",
        "Avoid exaggerated performance unless the content genuinely calls for it.",
        "Allow pitch, volume and speed to vary naturally.",
        "Do not force a youthful or fashionable vocal mannerism.",
      ],
    },
  };
}

/**
 * Determines whether a low-pressure check-in would help.
 */
function resolveCheckInPolicy({
  shortReply,
  uncertainty,
  questionPattern,
  conversationPhase,
  context,
}) {
  if (
    conversationPhase ===
      CONVERSATION_PHASES.CLOSED ||
    conversationPhase ===
      CONVERSATION_PHASES.LANDING
  ) {
    return {
      policy: CHECK_IN_POLICIES.NONE,
      type: null,
      reason:
        "Do not restart a conversation that is naturally landing.",
    };
  }

  if (
    context?.creatorExplicitlyAskedToContinue ||
    context?.creatorExplicitlyAskedForNextStep
  ) {
    return {
      policy: CHECK_IN_POLICIES.NONE,
      type: null,
      reason:
        "The creator has already given clear forward direction.",
    };
  }

  if (
    uncertainty.shouldReassure ||
    context?.creatorAppearsConfused
  ) {
    return {
      policy:
        CHECK_IN_POLICIES.RECOMMENDED,
      type: CHECK_IN_TYPES.PACE,
      reason:
        "There is evidence that the creator may benefit from a gentle check-in.",
    };
  }

  if (
    shortReply.detected &&
    shortReply.confidence ===
      CREATOR_SIGNAL_CONFIDENCE.LOW
  ) {
    return {
      policy:
        CHECK_IN_POLICIES.OPTIONAL,
      type:
        CHECK_IN_TYPES.EXPERIENCE,
      reason:
        "The short reply has several plausible meanings.",
    };
  }

  if (
    questionPattern.manyQuestions &&
    questionPattern.likelyPurpose ===
      "unknown"
  ) {
    return {
      policy:
        CHECK_IN_POLICIES.OPTIONAL,
      type:
        CHECK_IN_TYPES.COMPLETENESS,
      reason:
        "The creator has explored several angles and may want to decide whether to continue.",
    };
  }

  return {
    policy: CHECK_IN_POLICIES.NONE,
    type: null,
    reason:
      "No check-in is currently necessary.",
  };
}

/**
 * Creates natural check-in wording guidance.
 */
function createCheckInGuidance(checkIn) {
  if (
    checkIn.policy ===
      CHECK_IN_POLICIES.NONE
  ) {
    return [];
  }

  switch (checkIn.type) {
    case CHECK_IN_TYPES.PACE:
      return [
        "Prefer: 'Is the pace working for you?'",
        "Or: 'Would it help if I explained any part differently?'",
        "Do not ask whether the creator understood as though testing them.",
      ];

    case CHECK_IN_TYPES.ALIGNMENT:
      return [
        "Prefer: 'Are you happy with the direction so far?'",
        "Allow the creator to disagree without framing it as failure.",
      ];

    case CHECK_IN_TYPES.COMPLETENESS:
      return [
        "Prefer: 'Does anything still feel unfinished, or are you happy with where we've got to?'",
        "Do not use a formal lecture-style 'Any questions?' unless the context calls for it.",
      ];

    case CHECK_IN_TYPES.READINESS:
      return [
        "Prefer: 'Are you happy to move forward from here?'",
      ];

    case CHECK_IN_TYPES.EXPERIENCE:
      return [
        "Prefer a broad, low-pressure check-in such as: 'Are you happy so far?'",
        "Do not assume the creator is confused merely because their reply was brief.",
      ];

    case CHECK_IN_TYPES.UNDERSTANDING:
      return [
        "Prefer: 'Would it help if I explained any of that differently?'",
        "Offer a different angle rather than merely repeating the same words.",
      ];

    case CHECK_IN_TYPES.DIRECTION:
      return [
        "Prefer: 'Does this still feel like the right approach?'",
      ];

    default:
      return [];
  }
}

/**
 * Resolves the desired effect of the next response.
 */
function resolvePrimaryResponseEffect({
  mode,
  uncertainty,
  adaptivePlan,
}) {
  if (uncertainty.shouldReassure) {
    return RESPONSE_EFFECTS.CONFIDENCE;
  }

  if (
    getNestedValue(
      adaptivePlan,
      "execution.shouldMoveForward",
      false
    )
  ) {
    return RESPONSE_EFFECTS.MOMENTUM;
  }

  switch (mode) {
    case COMMUNICATION_MODES.LEARNING:
      return RESPONSE_EFFECTS.UNDERSTANDING;

    case COMMUNICATION_MODES.REFLECTION:
      return RESPONSE_EFFECTS.CLARITY;

    case COMMUNICATION_MODES.EXPLORATION:
      return RESPONSE_EFFECTS.CURIOSITY;

    case COMMUNICATION_MODES.RECOVERY:
      return RESPONSE_EFFECTS.CALM;

    case COMMUNICATION_MODES.CELEBRATION:
      return RESPONSE_EFFECTS.CELEBRATION;

    case COMMUNICATION_MODES.COLLABORATION:
      return RESPONSE_EFFECTS.CONNECTION;

    case COMMUNICATION_MODES.BUILD:
    case COMMUNICATION_MODES.FLOW:
      return RESPONSE_EFFECTS.MOMENTUM;

    default:
      return RESPONSE_EFFECTS.CLARITY;
  }
}

/**
 * Creates communication actions from the resolved state.
 */
function createCommunicationActions({
  mode,
  relationshipStage,
  familiarity,
  humour,
  creativeExpression,
  conversationPhase,
  participation,
  context,
}) {
  const actions = [];

  if (context?.creatorIsReturning) {
    actions.push(
      COMMUNICATION_ACTIONS
        .WELCOME_RETURN
    );
  }

  if (participation.requiresIntroduction) {
    actions.push(
      COMMUNICATION_ACTIONS
        .WELCOME_PARTICIPANT
    );
  }

  if (
    [
      PARTICIPATION_MODES.COLLABORATIVE,
      PARTICIPATION_MODES.GROUP,
      PARTICIPATION_MODES
        .PRIMARY_WITH_GUEST,
    ].includes(participation.mode)
  ) {
    actions.push(
      COMMUNICATION_ACTIONS
        .FACILITATE_COLLABORATION
    );
  }

  if (
    mode === COMMUNICATION_MODES.BUILD ||
    mode === COMMUNICATION_MODES.FLOW
  ) {
    actions.push(
      COMMUNICATION_ACTIONS
        .MOVE_TO_ACTION
    );

    actions.push(
      COMMUNICATION_ACTIONS
        .ANSWER_CONCISELY
    );
  } else if (
    mode === COMMUNICATION_MODES.LEARNING
  ) {
    actions.push(
      COMMUNICATION_ACTIONS
        .EXPLAIN_ONE_CONCEPT
    );
  } else {
    actions.push(
      COMMUNICATION_ACTIONS
        .MATCH_AND_CONTINUE
    );
  }

  if (
    humour.level ===
      HUMOUR_LEVELS.LIGHT ||
    humour.level ===
      HUMOUR_LEVELS.NATURAL ||
    humour.level ===
      HUMOUR_LEVELS.PLAYFUL
  ) {
    actions.push(
      COMMUNICATION_ACTIONS
        .USE_LIGHT_HUMOUR
    );
  }

  if (
    familiarity ===
      FAMILIARITY_LEVELS
        .SHARED_SHORTHAND &&
    relationshipStage !==
      RELATIONSHIP_STAGES.NEW
  ) {
    actions.push(
      COMMUNICATION_ACTIONS
        .USE_SHARED_SHORTHAND
    );
  }

  if (
    creativeExpression.analogy ===
      ANALOGY_LEVELS.USEFUL ||
    creativeExpression.analogy ===
      ANALOGY_LEVELS.PREFERRED
  ) {
    actions.push(
      COMMUNICATION_ACTIONS
        .USE_ANALOGY
    );
  }

  if (
    creativeExpression.storytelling ===
      STORYTELLING_LEVELS.MICRO ||
    creativeExpression.storytelling ===
      STORYTELLING_LEVELS.LIGHT ||
    creativeExpression.storytelling ===
      STORYTELLING_LEVELS.MODERATE ||
    creativeExpression.storytelling ===
      STORYTELLING_LEVELS.FEATURED
  ) {
    actions.push(
      COMMUNICATION_ACTIONS
        .USE_MICRO_STORY
    );
  }

  if (
    conversationPhase ===
      CONVERSATION_PHASES.LANDING ||
    conversationPhase ===
      CONVERSATION_PHASES.CLOSED
  ) {
    actions.push(
      COMMUNICATION_ACTIONS
        .LAND_CONVERSATION
    );
  }

  return uniqueValues(actions);
}

/**
 * Creates text-expression guidance.
 */
function createTextGuidance({
  mode,
  depth,
  pace,
  tone,
  directness,
  humour,
  familiarity,
  checkIn,
  context,
}) {
  const guidance = [
    `Use ${depth} communication depth.`,
    `Use a ${pace} reading pace.`,
    `Use a ${tone} tone.`,
    `Use ${directness} directness.`,

    "Answer the creator's actual question before adding broader context.",

    "Add one useful educational insight when it helps the creator understand why.",

    "Do not turn every answer into a lesson.",

    "Prefer one useful idea over several loosely related ideas.",

    "Do not reassure unless the creator has shown evidence of uncertainty or asks for reassurance.",

    "Do not solve an emotional problem the creator has not shown they have.",

    "Do not interpret a brief reply as proof of either understanding or confusion.",

    "Read the trajectory of the conversation rather than responding to one sentence in isolation.",

    "Do not repeatedly ask whether the creator understands.",

    "Avoid formal lecture closings such as 'Do you have any questions?' unless the situation genuinely resembles a lesson.",

    "Use natural spoken language while preserving clarity in written form.",

    "Let the creator read at their own pace.",

    "Avoid unnecessary repetition.",

    "Avoid artificial enthusiasm.",

    "Do not stress every idea equally.",

    "Use headings only when structure helps; ordinary conversation should not feel like a report.",
  ];

  if (
    mode === COMMUNICATION_MODES.BUILD ||
    mode === COMMUNICATION_MODES.FLOW
  ) {
    guidance.push(
      "Lead with the answer, recommendation, task or code.",
      "Keep explanation brief unless the creator requests teaching.",
      "Do not interrupt momentum with optional philosophy.",
      "Do not end with an unnecessary question."
    );
  }

  if (
    mode === COMMUNICATION_MODES.LEARNING
  ) {
    guidance.push(
      "Explain one concept at a time.",
      "Use a concrete example where possible.",
      "Teach enough to equip the creator, then return to application."
    );
  }

  if (
    mode ===
      COMMUNICATION_MODES.REFLECTION
  ) {
    guidance.push(
      "Use tentative, evidence-based language.",
      "Leave room for the creator to confirm, reject or refine the reflection.",
      "Allow more breathing space between ideas."
    );
  }

  if (
    humour.level !== HUMOUR_LEVELS.NONE
  ) {
    guidance.push(
      "Let humour emerge from the situation rather than inserting a generic joke.",
      "Do not use humour to dismiss vulnerability or uncertainty.",
      "The punchline may become stronger when fewer words are used."
    );
  }

  if (
    familiarity ===
      FAMILIARITY_LEVELS
        .SHARED_SHORTHAND
  ) {
    guidance.push(
      "Shared shorthand may replace a longer explanation when the meaning is genuinely established.",
      "Do not use private shorthand around unfamiliar participants without enough context."
    );
  }

  if (
    checkIn.policy !==
      CHECK_IN_POLICIES.NONE
  ) {
    guidance.push(
      ...createCheckInGuidance(
        checkIn
      )
    );
  }

  if (
    context?.creatorIsReturning
  ) {
    guidance.push(
      "Welcome the creator back without criticising the absence.",
      "Continue from the preserved thread without forcing a full recap.",
      "Do not imply that silence meant abandonment."
    );
  }

  return uniqueValues(guidance);
}

/**
 * Creates collaborative communication guidance.
 */
function createCollaborationGuidance({
  participation,
}) {
  if (
    participation.mode ===
      PARTICIPATION_MODES.SOLO
  ) {
    return [
      "Communicate directly with the individual creator.",
    ];
  }

  const guidance = [
    "Treat participants as individuals within one shared conversation.",

    "Identify the current speaker before attaching preferences, memories or meaning to their words.",

    "Preserve each participant's identity and role.",

    "Do not merge personal memories across participants.",

    "Address a newly introduced participant naturally and without excessive ceremony.",

    "Protect the primary creator's ownership when one primary creator is defined.",

    "In equal collaboration, protect the collaboration rather than choosing a favourite.",

    "Do not interpret disagreement as conflict automatically.",

    "Help the group compare ideas instead of deciding whose idea wins.",

    "Allow quieter participants space without forcing them into the spotlight.",

    "Do not expose one participant's private memory to another participant without permission.",
  ];

  if (participation.requiresIntroduction) {
    guidance.push(
      "A natural response may be: 'Hi — I don't think we've met yet. What's your name?'",
      "After introduction, confirm whether the person is joining the collaboration or observing."
    );
  }

  return guidance;
}

/**
 * Creates conversation-landing guidance.
 */
function createLandingGuidance({
  conversationPhase,
}) {
  if (
    ![
      CONVERSATION_PHASES.LANDING,
      CONVERSATION_PHASES.CLOSED,
    ].includes(conversationPhase)
  ) {
    return [];
  }

  return [
    "Recognise that the creator is winding the conversation down.",

    "Do not introduce a major new subject.",

    "Allow the conversation to descend naturally rather than ending like a switch.",

    "A brief acknowledgement, preserved return point and gentle goodbye are usually enough.",

    "Do not require the creator to announce every temporary absence.",

    "Do not make the creator feel guilty for leaving.",

    "Leave continuity open without manufacturing another question.",
  ];
}

/**
 * Creates immutable communication principles.
 */
function createCommunicationPrinciples() {
  return {
    respondToEvidenceNotAssumptions: true,
    presentCreatorLeadsInterpretation: true,
    readConversationTrajectory: true,
    educationalDoesNotMeanLong: true,
    protectCreatorConfidence: true,
    protectCreatorMomentum: true,
    protectCreatorComfort: true,
    respectNaturalInterruptions: true,
    silenceMayBeMeaningful: true,
    pausesMayCarryMeaning: true,
    relationshipMustEarnFamiliarity: true,
    shorthandMustBeEarned: true,
    humourMustFitTheMoment: true,
    creatorChoiceTunesPerformance: true,
    textAndSpeechShareIntent: true,
    personalMemoryMustRemainPersonal: true,
    collaborationMustProtectParticipants: true,
    checkAlignmentNotOnlyUnderstanding: true,
    avoidUnnecessaryReassurance: true,
    avoidArtificialEnthusiasm: true,
    earnTheRightToUseFewerWords: true,
    conversationShouldServeCreation: true,
  };
}

/**
 * Creates communication guard rails.
 */
function createGuardRails() {
  return [
    "Do not diagnose personality, confidence, emotion or mental state.",

    "Do not infer age, gender, nationality, culture or language ability from voice or writing style alone.",

    "Do not automatically choose a voice based on demographic characteristics.",

    "Do not mimic slang, accent or culture performatively.",

    "Do not manufacture intimacy with a new creator.",

    "Do not use nicknames before they are invited or established.",

    "Do not treat short replies as reliable proof of understanding.",

    "Do not reassure without evidence of uncertainty.",

    "Do not ask repeated comprehension-check questions.",

    "Do not interrupt build or flow mode with optional commentary.",

    "Do not use humour at the expense of the creator or another participant.",

    "Do not expose private memories during collaborative sessions.",

    "Do not merge two participants into one identity.",

    "Do not let global patterns override the individual creator's present behaviour.",

    "Do not claim that memory was stored unless persistence confirms success.",

    "Do not let speech performance alter the meaning of the text.",

    "Do not apply equal emphasis to every spoken word.",

    "Do not make conversation longer merely to appear caring.",

    "Do not abruptly end a naturally landing conversation.",

    "Do not restart a conversation that the creator is trying to close.",
  ];
}

/**
 * Creates a concise communication summary.
 */
function createPlanSummary({
  mode,
  tone,
  pace,
  depth,
  relationshipStage,
  primaryEffect,
  participation,
}) {
  return (
    `Communicate in ${mode} mode with a ${tone} tone, ` +
    `${pace} pace and ${depth} depth. ` +
    `Relationship stage: ${relationshipStage}. ` +
    `Primary intended effect: ${primaryEffect}. ` +
    `Participation mode: ${participation.mode}.`
  );
}

/**
 * Creates a safe fallback communication plan.
 */
function createFallbackPlan({
  message,
  context,
  adaptivePlan,
  responseBlueprint,
  error = null,
}) {
  return {
    id: createPlanId(),
    engine: "communication-voice-engine",
    version:
      COMMUNICATION_VOICE_ENGINE_VERSION,

    input: {
      message: cleanString(message),
    },

    mode: COMMUNICATION_MODES.GENERAL,

    relationship: {
      stage: RELATIONSHIP_STAGES.NEW,
      familiarity:
        FAMILIARITY_LEVELS.POLITE,
    },

    style: {
      pace: COMMUNICATION_PACES.NATURAL,
      depth:
        COMMUNICATION_DEPTHS.CONCISE,
      tone: COMMUNICATION_TONES.WARM,
      energy:
        COMMUNICATION_ENERGY.MATCHED,
      directness:
        DIRECTNESS_LEVELS.BALANCED,
    },

    humour: {
      level: HUMOUR_LEVELS.NONE,
      mayUseCallback: false,
      mayUseSharedJoke: false,
    },

    creativeExpression: {
      analogy: ANALOGY_LEVELS.NONE,
      storytelling:
        STORYTELLING_LEVELS.NONE,
    },

    performance: {
      channel:
        COMMUNICATION_CHANNELS.TEXT,

      text: {
        paragraphSpacing: "natural",
        sentenceLength: "natural",
      },

      speech: {
        pauseStyle:
          PAUSE_STYLES.NATURAL,
        emphasis:
          EMPHASIS_STYLES.NATURAL,
        avoidEqualStress: true,
      },
    },

    checkIn: {
      policy: CHECK_IN_POLICIES.NONE,
      type: null,
    },

    primaryEffect:
      RESPONSE_EFFECTS.CLARITY,

    actions: [
      COMMUNICATION_ACTIONS
        .MATCH_AND_CONTINUE,
    ],

    textGuidance: [
      "Answer clearly and briefly.",
      "Do not make assumptions about the creator's internal state.",
      "Do not introduce unnecessary new directions.",
    ],

    collaborationGuidance: [],

    landingGuidance: [],

    principles:
      createCommunicationPrinciples(),

    guardRails: createGuardRails(),

    adaptivePlanSnapshot:
      cloneValue(adaptivePlan),

    responseBlueprintSnapshot:
      cloneValue(responseBlueprint),

    contextSnapshot:
      cloneValue(context),

    status: "fallback",

    summary:
      "Use a concise, warm and assumption-safe communication style.",

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
 * Creates the Communication Voice Engine.
 */
function createCommunicationVoiceEngine({
  defaultVoiceProfile = null,
} = {}) {
  let activeDefaultVoiceProfile = {
    ...cloneValue(DEFAULT_VOICE_PROFILE),
    ...cloneValue(
      defaultVoiceProfile || {}
    ),
  };

  /**
   * Creates one complete communication voice plan.
   */
  function planCommunication({
    message = "",
    context = {},
    adaptivePlan = null,
    responseBlueprint = null,
    voiceProfile = null,
  } = {}) {
    try {
      const combinedContext = {
        ...cloneValue(
          DEFAULT_COMMUNICATION_CONTEXT
        ),
        ...cloneValue(context),

        message:
          cleanString(message),

        currentTimestamp:
          context?.currentTimestamp ||
          createTimestamp(),
      };

      const activeVoiceProfile = {
        ...cloneValue(
          activeDefaultVoiceProfile
        ),
        ...cloneValue(
          combinedContext
            .preferredVoiceProfile || {}
        ),
        ...cloneValue(
          voiceProfile || {}
        ),
      };

      const relationshipStage =
        resolveRelationshipStage(
          combinedContext
        );

      const familiarity =
        resolveFamiliarityLevel({
          relationshipStage,
          context: combinedContext,
        });

      const mode =
        resolveCommunicationMode({
          adaptivePlan,
          context: combinedContext,
        });

      const conversationPhase =
        resolveConversationPhase({
          message,
          adaptivePlan,
          context: combinedContext,
        });

      const shortReply =
        interpretShortReply({
          message,
          context: combinedContext,
          adaptivePlan,
        });

      const uncertainty =
        detectCreatorUncertainty({
          message,
          context: combinedContext,
        });

      const questionPattern =
        analyseQuestionPattern({
          message,
          context: combinedContext,
        });

      const participation =
        resolveParticipation({
          context: combinedContext,
        });

      const channel =
        resolveCommunicationChannel({
          context: combinedContext,
        });

      const pace =
        resolveCommunicationPace({
          mode,
          adaptivePlan,
          context: combinedContext,
          uncertainty,
        });

      const depth =
        resolveCommunicationDepth({
          mode,
          adaptivePlan,
          context: combinedContext,
          questionPattern,
        });

      const tone =
        resolveCommunicationTone({
          mode,
          uncertainty,
          context: combinedContext,
        });

      const directness =
        resolveDirectness({
          mode,
          adaptivePlan,
          uncertainty,
        });

      const energy =
        resolveCommunicationEnergy({
          mode,
          context: combinedContext,
        });

      const humour =
        resolveHumourPolicy({
          relationshipStage,
          familiarity,
          mode,
          context: combinedContext,
          uncertainty,
        });

      const creativeExpression =
        resolveCreativeExpression({
          mode,
          context: combinedContext,
          relationshipStage,
        });

      const performance =
        resolvePerformance({
          mode,
          channel,
          uncertainty,
          conversationPhase,
        });

      const checkIn =
        resolveCheckInPolicy({
          shortReply,
          uncertainty,
          questionPattern,
          conversationPhase,
          context: combinedContext,
        });

      const primaryEffect =
        resolvePrimaryResponseEffect({
          mode,
          uncertainty,
          adaptivePlan,
        });

      const actions =
        createCommunicationActions({
          mode,
          relationshipStage,
          familiarity,
          humour,
          creativeExpression,
          conversationPhase,
          participation,
          context: combinedContext,
        });

      const textGuidance =
        createTextGuidance({
          mode,
          depth,
          pace,
          tone,
          directness,
          humour,
          familiarity,
          checkIn,
          context: combinedContext,
        });

      const collaborationGuidance =
        createCollaborationGuidance({
          participation,
        });

      const landingGuidance =
        createLandingGuidance({
          conversationPhase,
        });

      return {
        id: createPlanId(),
        engine:
          "communication-voice-engine",
        version:
          COMMUNICATION_VOICE_ENGINE_VERSION,

        input: {
          message: cleanString(message),
        },

        mode,
        conversationPhase,

        relationship: {
          stage: relationshipStage,
          familiarity,

          sharedLanguageAvailable:
            (
              combinedContext
                .sharedMeanings?.length || 0
            ) > 0,

          sharedRitualsAvailable:
            (
              combinedContext
                .sharedRituals?.length || 0
            ) > 0,

          sharedJokesAvailable:
            (
              combinedContext
                .sharedJokes?.length || 0
            ) > 0,
        },

        interpretation: {
          shortReply,
          uncertainty,
          questionPattern,

          interpretationRule:
            "Treat ambiguous signals as possibilities rather than conclusions.",
        },

        participation,

        voiceProfile:
          cloneValue(activeVoiceProfile),

        style: {
          pace,
          depth,
          tone,
          energy,
          directness,
        },

        humour,

        creativeExpression,

        performance,

        checkIn: {
          ...checkIn,
          guidance:
            createCheckInGuidance(
              checkIn
            ),
        },

        primaryEffect,

        actions,

        textGuidance,

        collaborationGuidance,

        landingGuidance,

        outputAgreement: {
          canonicalContent:
            COMMUNICATION_CHANNELS.TEXT,

          textAndSpeechShareMeaning: true,

          speechPerformsCommunicationPlan:
            true,

          textMustReadLikeTheSpokenMentor:
            true,

          creatorMayChooseVoice: true,

          creatorMayChooseLanguage: true,

          creatorMayTunePerformance: true,

          tuningMustNotChangePrinciples:
            true,
        },

        communicationPrinciples:
          createCommunicationPrinciples(),

        guardRails:
          createGuardRails(),

        adaptivePlanSnapshot:
          cloneValue(adaptivePlan),

        responseBlueprintSnapshot:
          cloneValue(
            responseBlueprint
          ),

        contextSnapshot:
          cloneValue(combinedContext),

        summary:
          createPlanSummary({
            mode,
            tone,
            pace,
            depth,
            relationshipStage,
            primaryEffect,
            participation,
          }),

        status: "planned",

        createdAt: createTimestamp(),
      };
    } catch (error) {
      console.error(
        "CommunicationVoiceEngine planning error:",
        error
      );

      return createFallbackPlan({
        message,
        context,
        adaptivePlan,
        responseBlueprint,
        error,
      });
    }
  }

  /**
   * Applies a communication plan to a provider request.
   *
   * This does not generate text. It adds enforceable expression
   * guidance for ResponseGenerator or a future provider adapter.
   */
  function applyToProviderRequest({
    providerRequest,
    communicationPlan,
  } = {}) {
    if (
      !providerRequest ||
      typeof providerRequest !== "object"
    ) {
      throw new TypeError(
        "A valid providerRequest is required."
      );
    }

    if (
      !communicationPlan ||
      typeof communicationPlan !== "object"
    ) {
      throw new TypeError(
        "A valid communicationPlan is required."
      );
    }

    return {
      ...cloneValue(providerRequest),

      communicationVoice:
        cloneValue({
          mode:
            communicationPlan.mode,

          conversationPhase:
            communicationPlan
              .conversationPhase,

          relationship:
            communicationPlan
              .relationship,

          style:
            communicationPlan.style,

          humour:
            communicationPlan.humour,

          creativeExpression:
            communicationPlan
              .creativeExpression,

          performance:
            communicationPlan
              .performance,

          checkIn:
            communicationPlan.checkIn,

          primaryEffect:
            communicationPlan
              .primaryEffect,

          actions:
            communicationPlan.actions,

          textGuidance:
            communicationPlan
              .textGuidance,

          collaborationGuidance:
            communicationPlan
              .collaborationGuidance,

          landingGuidance:
            communicationPlan
              .landingGuidance,

          guardRails:
            communicationPlan
              .guardRails,
        }),

      constraints: {
        ...cloneValue(
          providerRequest.constraints ||
          {}
        ),

        respondToEvidenceNotAssumptions:
          true,

        avoidUnrequestedReassurance:
          true,

        preserveParticipantIdentity:
          true,

        preserveTextSpeechMeaning:
          true,

        doNotManufactureFamiliarity:
          true,

        doNotOverExplain:
          true,
      },
    };
  }

  /**
   * Replaces the engine's default voice profile.
   */
  function setDefaultVoiceProfile(
    nextProfile = {}
  ) {
    activeDefaultVoiceProfile = {
      ...cloneValue(
        DEFAULT_VOICE_PROFILE
      ),
      ...cloneValue(nextProfile),
    };

    return cloneValue(
      activeDefaultVoiceProfile
    );
  }

  /**
   * Returns the active default voice profile.
   */
  function getDefaultVoiceProfile() {
    return cloneValue(
      activeDefaultVoiceProfile
    );
  }

  /**
   * Returns true when the plan allows shared shorthand.
   */
  function mayUseSharedShorthand(plan) {
    return Boolean(
      plan?.relationship
        ?.familiarity ===
        FAMILIARITY_LEVELS
          .SHARED_SHORTHAND &&
      plan?.actions?.includes?.(
        COMMUNICATION_ACTIONS
          .USE_SHARED_SHORTHAND
      )
    );
  }

  /**
   * Returns true when a check-in is recommended.
   */
  function shouldCheckIn(plan) {
    return Boolean(
      [
        CHECK_IN_POLICIES.RECOMMENDED,
        CHECK_IN_POLICIES
          .REQUIRED_BEFORE_PROGRESSING,
      ].includes(
        plan?.checkIn?.policy
      )
    );
  }

  /**
   * Returns true when the conversation is landing.
   */
  function isConversationLanding(plan) {
    return Boolean(
      [
        CONVERSATION_PHASES.LANDING,
        CONVERSATION_PHASES.CLOSED,
      ].includes(
        plan?.conversationPhase
      )
    );
  }

  /**
   * Returns true when multiple participants are active.
   */
  function isCollaborative(plan) {
    return Boolean(
      plan?.participation?.mode &&
      plan.participation.mode !==
        PARTICIPATION_MODES.SOLO
    );
  }

  return {
    planCommunication,
    applyToProviderRequest,

    setDefaultVoiceProfile,
    getDefaultVoiceProfile,

    mayUseSharedShorthand,
    shouldCheckIn,
    isConversationLanding,
    isCollaborative,
  };
}

/**
 * Convenience method for one-off communication planning.
 */
function planCommunication({
  message = "",
  context = {},
  adaptivePlan = null,
  responseBlueprint = null,
  voiceProfile = null,
} = {}) {
  const engine =
    createCommunicationVoiceEngine();

  return engine.planCommunication({
    message,
    context,
    adaptivePlan,
    responseBlueprint,
    voiceProfile,
  });
}

export {
  COMMUNICATION_VOICE_ENGINE_VERSION,

  COMMUNICATION_MODES,
  RELATIONSHIP_STAGES,
  FAMILIARITY_LEVELS,

  COMMUNICATION_PACES,
  COMMUNICATION_DEPTHS,
  COMMUNICATION_TONES,
  COMMUNICATION_ENERGY,
  DIRECTNESS_LEVELS,

  HUMOUR_LEVELS,
  STORYTELLING_LEVELS,
  ANALOGY_LEVELS,

  PAUSE_STYLES,
  EMPHASIS_STYLES,

  CONVERSATION_PHASES,
  CREATOR_SIGNAL_CONFIDENCE,
  SHORT_REPLY_INTERPRETATIONS,

  CHECK_IN_POLICIES,
  CHECK_IN_TYPES,
  RESPONSE_EFFECTS,

  COMMUNICATION_CHANNELS,
  PARTICIPATION_MODES,
  PARTICIPANT_ROLES,

  COMMUNICATION_ACTIONS,
  DEFAULT_VOICE_PROFILE,

  createCommunicationVoiceEngine,
  planCommunication,
};

export default createCommunicationVoiceEngine;
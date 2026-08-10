/**
 * Communication Voice Engine
 * ------------------------------------------------------------
 * The communication-intelligence and performance layer for
 * iBand's AI Mentor — The Creator.
 *
 * This engine receives:
 *
 * - An AdaptiveMentorEngine behaviour plan.
 * - A ResponseComposer blueprint.
 * - Current creator, project, session and relationship context.
 *
 * It produces:
 *
 * - A unified communication voice plan.
 * - Relationship and familiarity calibration.
 * - Text-expression guidance.
 * - Spoken-performance guidance.
 * - Future-avatar performance guidance.
 * - Emotional cadence.
 * - Pace, emphasis, pause and transition instructions.
 * - Humour, analogy, storytelling and shared-language policies.
 * - Conversation-opening, continuation, return and landing behaviour.
 * - Project-context and session-handoff expression guidance.
 * - Memory-recall and forget-request expression guidance.
 * - Evidence and uncertainty controls.
 * - Solo and multi-creator participation guidance.
 * - Provider-facing communication constraints.
 *
 * It does not:
 *
 * - Generate final response wording.
 * - Perform speech synthesis.
 * - Persist memory directly.
 * - Decide project truth.
 * - Decide which specialist agent should run.
 * - Diagnose the creator.
 * - Infer private traits without evidence.
 * - Override AdaptiveMentorEngine behaviour.
 * - Override ResponseComposer structure.
 * - Replace the Mentor's permanent identity or principles.
 *
 * Architecture:
 *
 * CreatorEngine
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
 * Core philosophy:
 *
 * - Communicate with the creator who is present now.
 * - Respond to evidence rather than imagined problems.
 * - Present behaviour leads; memory informs.
 * - The response blueprint controls what may be said.
 * - Communication controls how permitted content should feel.
 * - Never use communication style to reopen an upstream decision.
 * - Read the trajectory of the conversation, not only the last message.
 * - Educational, helpful and well paced does not mean long.
 * - Do not reassure someone who has not shown uncertainty.
 * - Do not explain what the relationship already understands.
 * - Earn the right to use fewer words.
 * - Silence and pauses are meaningful forms of communication.
 * - Text, speech and future avatar output express the same Mentor.
 * - Creator choice may tune performance without changing principles.
 * - Project memory protects continuity rather than demonstrating recall.
 * - Specialist agents contribute intelligence, not additional voices.
 * - Many intelligences may contribute underneath.
 *   The creator experiences one relationship.
 * - Complexity belongs behind the conversation.
 */

const COMMUNICATION_VOICE_ENGINE_VERSION = "3.0.0";

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

  CREATION_HANDOFF:
    "creation-handoff",

  REFINEMENT_HANDOFF:
    "refinement-handoff",

  PUBLISHING_HANDOFF:
    "publishing-handoff",

  NEXT_TASK:
    "next-task",

  PROJECT_RESTORATION:
    "project-restoration",

  MEMORY_RECALL:
    "memory-recall",

  MEMORY_CAPTURE:
    "memory-capture",

  MEMORY_FORGET:
    "memory-forget",

  SESSION_HANDOFF:
    "session-handoff",

  RETURNING:
    "returning",

  CONVERSATION_LANDING:
    "conversation-landing",

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
  SHARED_SHORTHAND:
    "shared-shorthand",
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
  CONTINUOUS: "continuous",
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

const LANDING_STYLES = Object.freeze({
  NONE: "none",

  CONTINUE_FORWARD:
    "continue-forward",

  SOFT_STOP: "soft-stop",

  PRESERVE_AND_LEAVE:
    "preserve-and-leave",

  CLOSE_SESSION:
    "close-session",
});

const CREATOR_SIGNAL_CONFIDENCE = Object.freeze({
  VERY_LOW: "very-low",
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high",
  VERY_HIGH: "very-high",
});

const SHORT_REPLY_INTERPRETATIONS =
  Object.freeze({
    UNDERSTOOD: "understood",
    AGREES: "agrees",
    PROCESSING: "processing",
    BUSY: "busy",

    WANTS_TO_CONTINUE:
      "wants-to-continue",

    WANTS_TO_MOVE_ON:
      "wants-to-move-on",

    UNCERTAIN: "uncertain",
    OVERWHELMED: "overwhelmed",
    FILLER: "filler",

    BUILD_CONFIRMATION:
      "build-confirmation",

    READY_FOR_NEXT:
      "ready-for-next",

    PAUSING: "pausing",
    CLOSING: "closing",

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
  CONTINUITY: "continuity",
  CLOSURE: "closure",
});

const COMMUNICATION_CHANNELS = Object.freeze({
  TEXT: "text",
  SPEECH: "speech",

  TEXT_AND_SPEECH:
    "text-and-speech",

  FUTURE_AVATAR:
    "future-avatar",
});

const PARTICIPATION_MODES = Object.freeze({
  SOLO: "solo",

  PRIMARY_WITH_GUEST:
    "primary-with-guest",

  COLLABORATIVE:
    "collaborative",

  GROUP: "group",
});

const PARTICIPANT_ROLES = Object.freeze({
  PRIMARY_CREATOR:
    "primary-creator",

  COLLABORATOR:
    "collaborator",

  GUEST: "guest",
  OBSERVER: "observer",
  PRODUCER: "producer",
  MENTOR: "mentor",
  UNKNOWN: "unknown",
});

const COMMUNICATION_ACTIONS = Object.freeze({
  MATCH_AND_CONTINUE:
    "match-and-continue",

  ANSWER_CONCISELY:
    "answer-concisely",

  EXPLAIN_ONE_CONCEPT:
    "explain-one-concept",

  ASK_LOW_PRESSURE_CHECK_IN:
    "ask-low-pressure-check-in",

  HOLD_SPACE:
    "hold-space",

  REDUCE_PRESSURE:
    "reduce-pressure",

  USE_SHARED_SHORTHAND:
    "use-shared-shorthand",

  USE_LIGHT_HUMOUR:
    "use-light-humour",

  USE_ANALOGY:
    "use-analogy",

  USE_MICRO_STORY:
    "use-micro-story",

  WELCOME_RETURN:
    "welcome-return",

  RESTORE_PROJECT_CONTINUITY:
    "restore-project-continuity",

  EXPRESS_MEMORY_NATURALLY:
    "express-memory-naturally",

  EXPRESS_MEMORY_CAPTURE_MINIMALLY:
    "express-memory-capture-minimally",

  CLARIFY_FORGET_REQUEST:
    "clarify-forget-request",

  CONFIRM_FORGET_RESULT:
    "confirm-forget-result",

  PRESERVE_SESSION_HANDOFF:
    "preserve-session-handoff",

  WELCOME_PARTICIPANT:
    "welcome-participant",

  FACILITATE_COLLABORATION:
    "facilitate-collaboration",

  LAND_CONVERSATION:
    "land-conversation",

  MOVE_TO_ACTION:
    "move-to-action",

  HIDE_SPECIALIST_MACHINERY:
    "hide-specialist-machinery",

  OBEY_BLUEPRINT_QUESTION_LIMIT:
    "obey-blueprint-question-limit",

  OBEY_BLUEPRINT_SILENCE:
    "obey-blueprint-silence",
});

const DEFAULT_VOICE_PROFILE = Object.freeze({
  id: "balanced-default",
  label: "Balanced Mentor",

  language: "en",
  locale: "en-GB",

  apparentAge: "neutral-adult",

  genderPresentation:
    "creator-choice",

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

const DEFAULT_COMMUNICATION_CONTEXT =
  Object.freeze({
    creatorId: null,
    creatorName: null,
    creatorJourney: "guide",
    creatorType: null,

    creatorProfile: null,
    creatorMemoryContext: null,

    message: "",

    recentCreatorMessages: [],
    recentMentorMessages: [],
    recentConversations: [],

    projectType: null,

    activeProject: null,
    activeProjectId: null,

    activeIdea: null,
    activeStage: null,
    activeScene: null,
    activeCharacter: null,
    activeAsset: null,

    sessionId: null,

    previousTask: null,
    nextTask: null,
    returnPoint: null,

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
    creatorAppearsFinished: true,

    creatorExplicitlyAskedForHelp:
      false,

    creatorExplicitlyAskedForExplanation:
      false,

    creatorExplicitlyAskedForGuidance:
      false,

    creatorExplicitlyAskedToContinue:
      false,

    creatorExplicitlyAskedForNextStep:
      false,

    creatorExplicitlyAskedToCreate:
      false,

    creatorExplicitlyAskedToPause:
      false,

    creatorExplicitlyAskedToStop:
      false,

    creatorExplicitlyAskedToRemember:
      false,

    creatorExplicitlyAskedNotToRemember:
      false,

    creatorExplicitlyAskedToRevisit:
      false,

    creatorIsReturning: false,

    elapsedSinceLastMessageMs:
      null,

    establishedVocabulary: [],
    sharedMeanings: [],
    sharedRituals: [],
    sharedJokes: [],

    preferredResponseDepth: null,

    preferredCommunicationPace:
      null,

    preferredVoiceProfile: null,
    preferredChannel: null,

    humourAllowed: true,
    emojisAllowed: true,

    participants: [],

    primaryCreatorId: null,
    currentSpeakerId: null,

    participationMode: null,

    language: "en",
    locale: "en-GB",

    sourceAgent: null,
    sourceSystem: null,

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
    `communication-voice-plan-` +
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

function cleanString(value) {
  return typeof value === "string"
    ? value.trim()
    : "";
}

function normaliseText(value) {
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

function clampNumber(
  value,
  minimum = 0,
  maximum = 1,
  fallback = minimum
) {
  const numericValue =
    Number(value);

  if (
    !Number.isFinite(
      numericValue
    )
  ) {
    return fallback;
  }

  return Math.max(
    minimum,
    Math.min(
      maximum,
      numericValue
    )
  );
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

function extractMessageText(
  messages = []
) {
  if (
    !Array.isArray(
      messages
    )
  ) {
    return "";
  }

  return messages
    .map((message) => {
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
    })
    .filter(Boolean)
    .join(" ");
}

function createEvidence({
  signal,
  confidence = 0.5,
  source = "current-message",
  details = null,
}) {
  return {
    signal,

    confidence:
      clampNumber(
        confidence
      ),

    source,

    details:
      cloneValue(
        details
      ),
  };
}

function getComposerAction(
  responseBlueprint
) {
  return cleanString(
    responseBlueprint
      ?.action
  );
}

function getAdaptiveAction(
  adaptivePlan
) {
  return cleanString(
    getNestedValue(
      adaptivePlan,
      "primaryAction.action",
      ""
    )
  );
}

function getConversationPlannerMode(
  adaptivePlan
) {
  return cleanString(
    getNestedValue(
      adaptivePlan,
      "specialistPlans.conversation.conversation.mode",
      ""
    )
  );
}

function getConversationPlannerMove(
  adaptivePlan
) {
  return cleanString(
    getNestedValue(
      adaptivePlan,
      "specialistPlans.conversation.conversation.mentorMove",
      ""
    )
  );
}

function getProjectId({
  adaptivePlan,
  responseBlueprint,
  context,
}) {
  const candidates = [
    context
      ?.activeProjectId,

    getNestedValue(
      responseBlueprint,
      "project.activeProjectId",
      null
    ),

    getNestedValue(
      adaptivePlan,
      "execution.activeProjectId",
      null
    ),

    getNestedValue(
      adaptivePlan,
      "projectState.activeProjectId",
      null
    ),

    context
      ?.activeProject
      ?.id,

    context
      ?.activeProject
      ?.projectId,
  ];

  for (
    const candidate
    of candidates
  ) {
    const cleaned =
      cleanString(
        candidate
      );

    if (cleaned) {
      return cleaned;
    }
  }

  return null;
}

function getBlueprintMaximumQuestions(
  responseBlueprint
) {
  const value =
    Number(
      responseBlueprint
        ?.constraints
        ?.maximumQuestions
    );

  if (
    !Number.isFinite(
      value
    )
  ) {
    return 0;
  }

  return Math.max(
    0,
    Math.floor(value)
  );
}

function blueprintAllowsQuestions(
  responseBlueprint
) {
  return (
    getBlueprintMaximumQuestions(
      responseBlueprint
    ) > 0
  );
}

function blueprintRequestsSilence(
  responseBlueprint
) {
  return Boolean(
    responseBlueprint
      ?.length ===
      "silent" ||
    responseBlueprint
      ?.action ===
      "return-silence" ||
    responseBlueprint
      ?.constraints
      ?.shouldGenerateText ===
      false
  );
}

function blueprintUsesMemory(
  responseBlueprint
) {
  return Boolean(
    responseBlueprint
      ?.memory
      ?.shouldRecall ||
    responseBlueprint
      ?.constraints
      ?.shouldUseMemory
  );
}

function blueprintCapturesMemory(
  responseBlueprint
) {
  return Boolean(
    responseBlueprint
      ?.memory
      ?.shouldCapture ||
    responseBlueprint
      ?.executionIntent
      ?.shouldCaptureMemory ||
    responseBlueprint
      ?.constraints
      ?.shouldMentionMemoryCapture ||
    responseBlueprint
      ?.action ===
      "compose-capture-and-continue"
  );
}

function blueprintRestoresProjectContext(
  responseBlueprint
) {
  return Boolean(
    responseBlueprint
      ?.executionIntent
      ?.shouldRestoreProjectContext ||
    responseBlueprint
      ?.constraints
      ?.shouldRestoreProjectContext ||
    responseBlueprint
      ?.action ===
      "compose-project-context-restoration"
  );
}

function blueprintPreservesSessionHandoff(
  responseBlueprint
) {
  return Boolean(
    responseBlueprint
      ?.executionIntent
      ?.shouldPreserveSessionHandoff ||
    responseBlueprint
      ?.memory
      ?.shouldPreserveSessionHandoff ||
    responseBlueprint
      ?.action ===
      "compose-session-handoff" ||
    responseBlueprint
      ?.action ===
      "compose-session-pause"
  );
}

function blueprintClarifiesForget(
  responseBlueprint
) {
  return Boolean(
    responseBlueprint
      ?.executionIntent
      ?.shouldClarifyForget ||
    responseBlueprint
      ?.memory
      ?.shouldClarifyForget ||
    responseBlueprint
      ?.action ===
      "compose-forget-clarification"
  );
}

function blueprintAppliesForget(
  responseBlueprint
) {
  return Boolean(
    responseBlueprint
      ?.executionIntent
      ?.shouldApplyForget ||
    responseBlueprint
      ?.memory
      ?.shouldApplyForget ||
    responseBlueprint
      ?.action ===
      "compose-forget-confirmation"
  );
}

function hasSpecialistMachinery({
  adaptivePlan,
  responseBlueprint,
  context,
}) {
  return Boolean(
    context?.sourceAgent ||
    context?.sourceSystem ||
    getNestedValue(
      adaptivePlan,
      "projectState.specialistMemorySignalsPresent",
      false
    ) ||
    getNestedValue(
      responseBlueprint,
      "project.specialistMemorySignalsPresent",
      false
    )
  );
}

function normaliseRelationshipStage(
  value
) {
  if (
    Object.values(
      RELATIONSHIP_STAGES
    ).includes(value)
  ) {
    return value;
  }

  return null;
}

function resolveRelationshipStage(
  context
) {
  const explicitStage =
    normaliseRelationshipStage(
      context
        ?.relationshipStage
    );

  if (explicitStage) {
    return explicitStage;
  }

  const rememberedStage =
    normaliseRelationshipStage(
      context
        ?.creatorMemoryContext
        ?.relationshipStage
    );

  if (rememberedStage) {
    return rememberedStage;
  }

  const interactionCount =
    Number(
      context
        ?.interactionCount ||
      context
        ?.creatorMemoryContext
        ?.interactionCount ||
      context
        ?.creatorMemoryContext
        ?.conversationCount ||
      0
    );

  const knownDurationDays =
    Number(
      context
        ?.knownDurationDays ||
      context
        ?.creatorMemoryContext
        ?.knownDurationDays ||
      0
    );

  const sharedHistoryCount =
    asArray(
      context
        ?.sharedMeanings
    ).length +
    asArray(
      context
        ?.sharedRituals
    ).length +
    asArray(
      context
        ?.sharedJokes
    ).length;

  if (
    interactionCount >= 500 ||
    knownDurationDays >= 365
  ) {
    return (
      RELATIONSHIP_STAGES
        .LONG_TERM
    );
  }

  if (
    interactionCount >= 150 ||
    sharedHistoryCount >= 8
  ) {
    return (
      RELATIONSHIP_STAGES
        .TRUSTED
    );
  }

  if (
    interactionCount >= 30 ||
    sharedHistoryCount >= 3
  ) {
    return (
      RELATIONSHIP_STAGES
        .ESTABLISHED
    );
  }

  if (
    interactionCount >= 5
  ) {
    return (
      RELATIONSHIP_STAGES
        .DEVELOPING
    );
  }

  return (
    RELATIONSHIP_STAGES.NEW
  );
}

function resolveFamiliarityLevel({
  relationshipStage,
  context,
}) {
  const hasSharedShorthand =
    asArray(
      context
        ?.sharedMeanings
    ).length > 0 ||
    asArray(
      context
        ?.sharedRituals
    ).length > 0;

  if (
    relationshipStage ===
      RELATIONSHIP_STAGES
        .LONG_TERM &&
    hasSharedShorthand
  ) {
    return (
      FAMILIARITY_LEVELS
        .SHARED_SHORTHAND
    );
  }

  if (
    relationshipStage ===
      RELATIONSHIP_STAGES
        .TRUSTED ||
    relationshipStage ===
      RELATIONSHIP_STAGES
        .LONG_TERM
  ) {
    return (
      FAMILIARITY_LEVELS
        .FAMILIAR
    );
  }

  if (
    relationshipStage ===
    RELATIONSHIP_STAGES
      .ESTABLISHED
  ) {
    return (
      FAMILIARITY_LEVELS
        .NATURAL
    );
  }

  if (
    relationshipStage ===
    RELATIONSHIP_STAGES
      .DEVELOPING
  ) {
    return (
      FAMILIARITY_LEVELS
        .POLITE
    );
  }

  return (
    FAMILIARITY_LEVELS
      .FORMAL
  );
}

function resolveCommunicationMode({
  adaptivePlan,
  responseBlueprint,
  context,
}) {
  const signals =
    asArray(
      adaptivePlan?.signals
    );

  const composerAction =
    getComposerAction(
      responseBlueprint
    );

  const adaptiveAction =
    getAdaptiveAction(
      adaptivePlan
    );

  const conversationMode =
    getConversationPlannerMode(
      adaptivePlan
    );

  if (
    blueprintRequestsSilence(
      responseBlueprint
    ) ||
    adaptiveAction ===
      "wait"
  ) {
    return (
      COMMUNICATION_MODES
        .INCUBATION
    );
  }

  if (
    blueprintClarifiesForget(
      responseBlueprint
    ) ||
    blueprintAppliesForget(
      responseBlueprint
    )
  ) {
    return (
      COMMUNICATION_MODES
        .MEMORY_FORGET
    );
  }

  if (
    blueprintPreservesSessionHandoff(
      responseBlueprint
    )
  ) {
    return (
      COMMUNICATION_MODES
        .SESSION_HANDOFF
    );
  }

  if (
    blueprintRestoresProjectContext(
      responseBlueprint
    )
  ) {
    return (
      COMMUNICATION_MODES
        .PROJECT_RESTORATION
    );
  }

  if (
    composerAction ===
      "compose-creation-handoff"
  ) {
    return (
      COMMUNICATION_MODES
        .CREATION_HANDOFF
    );
  }

  if (
    composerAction ===
      "compose-next-task"
  ) {
    return (
      COMMUNICATION_MODES
        .NEXT_TASK
    );
  }

  if (
    composerAction ===
      "compose-refinement-handoff"
  ) {
    return (
      COMMUNICATION_MODES
        .REFINEMENT_HANDOFF
    );
  }

  if (
    composerAction ===
      "compose-publishing-handoff"
  ) {
    return (
      COMMUNICATION_MODES
        .PUBLISHING_HANDOFF
    );
  }

  if (
    blueprintUsesMemory(
      responseBlueprint
    ) ||
    composerAction ===
      "compose-memory-recall"
  ) {
    return (
      COMMUNICATION_MODES
        .MEMORY_RECALL
    );
  }

  if (
    blueprintCapturesMemory(
      responseBlueprint
    )
  ) {
    return (
      COMMUNICATION_MODES
        .MEMORY_CAPTURE
    );
  }

  if (
    context
      ?.creatorIsReturning
  ) {
    return (
      COMMUNICATION_MODES
        .RETURNING
    );
  }

  if (
    context
      ?.participationMode ===
      PARTICIPATION_MODES
        .COLLABORATIVE ||
    context
      ?.participationMode ===
      PARTICIPATION_MODES
        .GROUP ||
    signals.includes(
      "collaboration-mode"
    )
  ) {
    return (
      COMMUNICATION_MODES
        .COLLABORATION
    );
  }

  if (
    signals.includes(
      "build-mode"
    ) ||
    context
      ?.thinkingMode ===
      "build"
  ) {
    return (
      COMMUNICATION_MODES.BUILD
    );
  }

  if (
    signals.includes(
      "flow-mode"
    ) ||
    context
      ?.thinkingMode ===
      "flow"
  ) {
    return (
      COMMUNICATION_MODES.FLOW
    );
  }

  if (
    conversationMode ===
      "celebration"
  ) {
    return (
      COMMUNICATION_MODES
        .CELEBRATION
    );
  }

  if (
    signals.includes(
      "learning-mode"
    ) ||
    context
      ?.thinkingMode ===
      "learning" ||
    conversationMode ===
      "learning"
  ) {
    return (
      COMMUNICATION_MODES
        .LEARNING
    );
  }

  if (
    signals.includes(
      "reflection-mode"
    ) ||
    context
      ?.thinkingMode ===
      "reflection" ||
    conversationMode ===
      "reflection"
  ) {
    return (
      COMMUNICATION_MODES
        .REFLECTION
    );
  }

  if (
    signals.includes(
      "recovery-mode"
    ) ||
    context
      ?.thinkingMode ===
      "recovery" ||
    conversationMode ===
      "recovery" ||
    conversationMode ===
      "confidence"
  ) {
    return (
      COMMUNICATION_MODES
        .RECOVERY
    );
  }

  if (
    signals.includes(
      "incubation-mode"
    ) ||
    context
      ?.thinkingMode ===
      "incubation"
  ) {
    return (
      COMMUNICATION_MODES
        .INCUBATION
    );
  }

  if (
    signals.includes(
      "exploration-mode"
    ) ||
    context
      ?.thinkingMode ===
      "exploration" ||
    conversationMode ===
      "imagination" ||
    conversationMode ===
      "discovery"
  ) {
    return (
      COMMUNICATION_MODES
        .EXPLORATION
    );
  }

  if (
    adaptiveAction ===
      "end-positively"
  ) {
    return (
      COMMUNICATION_MODES
        .CONVERSATION_LANDING
    );
  }

  return (
    COMMUNICATION_MODES
      .GENERAL
  );
}

function resolveConversationPhase({
  message,
  adaptivePlan,
  responseBlueprint,
  context,
}) {
  const text =
    normaliseText(
      message
    );

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
    "i'll be back",
    "ill be back",
    "that's me done",
    "thats me done",
    "done for tonight",
  ];

  const adaptiveAction =
    getAdaptiveAction(
      adaptivePlan
    );

  if (
    context
      ?.creatorExplicitlyAskedToStop ||
    adaptiveAction ===
      "end-positively"
  ) {
    return (
      CONVERSATION_PHASES
        .CLOSED
    );
  }

  if (
    blueprintPreservesSessionHandoff(
      responseBlueprint
    ) ||
    context
      ?.creatorExplicitlyAskedToPause ||
    includesAny(
      text,
      landingPhrases
    )
  ) {
    return (
      CONVERSATION_PHASES
        .LANDING
    );
  }

  if (
    context
      ?.creatorIsReturning ||
    blueprintRestoresProjectContext(
      responseBlueprint
    )
  ) {
    return (
      CONVERSATION_PHASES
        .RETURNING
    );
  }

  const creatorMessageCount =
    asArray(
      context
        ?.recentCreatorMessages
    ).length;

  const interactionCount =
    Number(
      context
        ?.interactionCount ||
      0
    );

  if (
    creatorMessageCount <= 1 &&
    interactionCount <= 1
  ) {
    return (
      CONVERSATION_PHASES
        .OPENING
    );
  }

  if (
    getNestedValue(
      adaptivePlan,
      "execution.shouldMoveForward",
      false
    )
  ) {
    return (
      CONVERSATION_PHASES
        .TRANSITIONING
    );
  }

  const mode =
    resolveCommunicationMode({
      adaptivePlan,
      responseBlueprint,
      context,
    });

  if (
    [
      COMMUNICATION_MODES
        .REFLECTION,

      COMMUNICATION_MODES
        .EXPLORATION,

      COMMUNICATION_MODES
        .LEARNING,
    ].includes(mode)
  ) {
    return (
      CONVERSATION_PHASES
        .DEEPENING
    );
  }

  return (
    CONVERSATION_PHASES
      .DEVELOPING
  );
}

function detectShortReply(
  message
) {
  const cleanedMessage =
    cleanString(
      message
    );

  if (!cleanedMessage) {
    return {
      isShortReply: false,
      wordCount: 0,
      text: "",
    };
  }

  const wordCount =
    cleanedMessage
      .split(/\s+/)
      .length;

  return {
    isShortReply:
      wordCount <= 4 &&
      cleanedMessage.length <=
        32,

    wordCount,

    text:
      cleanedMessage,
  };
}

function interpretShortReply({
  message,
  context,
  adaptivePlan,
  responseBlueprint,
}) {
  const detection =
    detectShortReply(
      message
    );

  if (
    !detection.isShortReply
  ) {
    return {
      detected: false,
      possibilities: [],
      confidence:
        CREATOR_SIGNAL_CONFIDENCE
          .HIGH,
      recommendedAssumption:
        null,
    };
  }

  const text =
    normaliseText(
      detection.text
    );

  const possibilities = [];

  const addPossibility = (
    interpretation,
    confidence,
    evidence
  ) => {
    possibilities.push({
      interpretation,

      confidence:
        clampNumber(
          confidence
        ),

      evidence,
    });
  };

  const buildMode =
    context
      ?.thinkingMode ===
      "build" ||
    asArray(
      adaptivePlan?.signals
    ).includes(
      "build-mode"
    ) ||
    [
      "compose-next-task",
      "compose-creation-handoff",
      "compose-refinement-handoff",
      "compose-publishing-handoff",
    ].includes(
      getComposerAction(
        responseBlueprint
      )
    );

  const forwardPhrases = [
    "ready",
    "next",
    "done",
    "go",
    "go on",
    "continue",
    "fire away",
    "let's go",
    "lets go",
  ];

  const pausePhrases = [
    "later",
    "tomorrow",
    "pause",
    "stop here",
    "not now",
    "goodnight",
    "good night",
  ];

  if (
    includesAny(
      text,
      pausePhrases
    )
  ) {
    addPossibility(
      SHORT_REPLY_INTERPRETATIONS
        .PAUSING,

      0.94,

      "explicit short pause language"
    );
  }

  if (
    buildMode &&
    includesAny(
      text,
      forwardPhrases
    )
  ) {
    addPossibility(
      SHORT_REPLY_INTERPRETATIONS
        .READY_FOR_NEXT,

      0.95,

      "explicit short forward-moving build reply"
    );

    addPossibility(
      SHORT_REPLY_INTERPRETATIONS
        .WANTS_TO_CONTINUE,

      0.92,

      "build context supports continuation"
    );
  }

  if (
    buildMode &&
    includesAny(
      text,
      [
        "done",
        "perfect",
        "good",
        "great",
        "sorted",
        "cool",
      ]
    )
  ) {
    addPossibility(
      SHORT_REPLY_INTERPRETATIONS
        .BUILD_CONFIRMATION,

      0.86,

      "short confirmation during build mode"
    );
  }

  if (
    includesAny(
      text,
      [
        "cool",
        "great",
        "perfect",
        "nice",
        "excellent",
      ]
    )
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
  }

  if (
    includesAny(
      text,
      [
        "ok",
        "okay",
        "yeah",
        "yep",
        "right",
        "sure",
      ]
    )
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
    context
      ?.creatorExplicitlyAskedToContinue ||
    context
      ?.creatorExplicitlyAskedForNextStep ||
    getNestedValue(
      adaptivePlan,
      "execution.shouldMoveForward",
      false
    )
  ) {
    addPossibility(
      SHORT_REPLY_INTERPRETATIONS
        .WANTS_TO_CONTINUE,

      0.84,

      "explicit forward direction in context"
    );
  }

  if (
    context
      ?.creatorExplicitlyAskedToPause
  ) {
    addPossibility(
      SHORT_REPLY_INTERPRETATIONS
        .PAUSING,

      0.96,

      "explicit pause direction in context"
    );
  }

  if (
    context
      ?.creatorExplicitlyAskedToStop
  ) {
    addPossibility(
      SHORT_REPLY_INTERPRETATIONS
        .CLOSING,

      0.98,

      "explicit stop direction in context"
    );
  }

  if (
    context
      ?.creatorAppearsConfused ||
    context
      ?.creatorExplicitlyAskedForExplanation
  ) {
    addPossibility(
      SHORT_REPLY_INTERPRETATIONS
        .UNCERTAIN,

      0.7,

      "confusion or explanation request in context"
    );
  }

  if (
    context
      ?.informationSaturation ===
      "high" ||
    context
      ?.informationSaturation ===
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
    context
      ?.creatorEnergy ===
      "low" ||
    context
      ?.creatorEnergy ===
      "depleted"
  ) {
    addPossibility(
      SHORT_REPLY_INTERPRETATIONS
        .PROCESSING,

      0.45,

      "low-energy context"
    );

    addPossibility(
      SHORT_REPLY_INTERPRETATIONS
        .BUSY,

      0.34,

      "limited-response context"
    );
  }

  if (
    possibilities.length === 0
  ) {
    possibilities.push({
      interpretation:
        SHORT_REPLY_INTERPRETATIONS
          .UNKNOWN,

      confidence: 0.25,

      evidence:
        "short reply has insufficient context",
    });
  }

  const rankedPossibilities =
    possibilities.sort(
      (a, b) =>
        b.confidence -
        a.confidence
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
      : strongest
        ?.confidence ||
        0;

  let confidence =
    CREATOR_SIGNAL_CONFIDENCE
      .LOW;

  if (
    strongest
      ?.confidence >=
      0.9
  ) {
    confidence =
      CREATOR_SIGNAL_CONFIDENCE
        .VERY_HIGH;
  } else if (
    strongest
      ?.confidence >=
      0.78 &&
    separation >= 0.05
  ) {
    confidence =
      CREATOR_SIGNAL_CONFIDENCE
        .HIGH;
  } else if (
    strongest
      ?.confidence >=
      0.55 &&
    separation >= 0.08
  ) {
    confidence =
      CREATOR_SIGNAL_CONFIDENCE
        .MEDIUM;
  }

  return {
    detected: true,

    possibilities:
      cloneValue(
        rankedPossibilities
      ),

    confidence,

    recommendedAssumption:
      [
        CREATOR_SIGNAL_CONFIDENCE
          .HIGH,

        CREATOR_SIGNAL_CONFIDENCE
          .VERY_HIGH,
      ].includes(
        confidence
      )
        ? strongest
            .interpretation
        : null,
  };
}

function detectCreatorUncertainty({
  message,
  context,
}) {
  const text =
    normaliseText(
      message
    );

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
    explicitUncertaintyPhrases
      .filter(
        (phrase) =>
          text.includes(
            phrase
          )
      );

  const softeningMatches =
    softeningPhrases
      .filter(
        (phrase) =>
          text.includes(
            phrase
          )
      );

  const evidence = [];

  explicitMatches
    .forEach(
      (phrase) => {
        evidence.push(
          createEvidence({
            signal:
              "explicit-creator-uncertainty",

            confidence:
              0.9,

            details:
              phrase,
          })
        );
      }
    );

  if (
    context
      ?.creatorAppearsConfused
  ) {
    evidence.push(
      createEvidence({
        signal:
          "context-reports-confusion",

        confidence:
          0.82,

        source:
          "context",
      })
    );
  }

  if (
    context
      ?.creatorExplicitlyAskedForHelp ||
    context
      ?.creatorExplicitlyAskedForExplanation
  ) {
    evidence.push(
      createEvidence({
        signal:
          "creator-requested-support",

        confidence:
          0.85,

        source:
          "context",
      })
    );
  }

  softeningMatches
    .forEach(
      (phrase) => {
        evidence.push(
          createEvidence({
            signal:
              "possible-language-softening",

            confidence:
              0.35,

            details:
              phrase,
          })
        );
      }
    );

  const strongestConfidence =
    evidence.reduce(
      (
        maximum,
        item
      ) =>
        Math.max(
          maximum,
          item.confidence
        ),

      0
    );

  return {
    detected:
      strongestConfidence >=
      0.6,

    possible:
      strongestConfidence > 0,

    confidence:
      strongestConfidence,

    evidence,

    shouldReassure:
      strongestConfidence >=
      0.72,
  };
}

function analyseQuestionPattern({
  message,
  context,
}) {
  const recentText =
    normaliseText(
      [
        extractMessageText(
          asArray(
            context
              ?.recentCreatorMessages
          ).slice(-5)
        ),

        message,
      ].join(" ")
    );

  const questionCount =
    (
      recentText
        .match(/\?/g) ||
      []
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
    buildingPhrases
      .filter(
        (phrase) =>
          recentText.includes(
            phrase
          )
      ).length;

  const reassuranceScore =
    reassurancePhrases
      .filter(
        (phrase) =>
          recentText.includes(
            phrase
          )
      ).length;

  const learningScore =
    learningPhrases
      .filter(
        (phrase) =>
          recentText.includes(
            phrase
          )
      ).length;

  let likelyPurpose =
    "unknown";

  if (
    buildingScore >
      reassuranceScore &&
    buildingScore >=
      learningScore
  ) {
    likelyPurpose =
      "creative-expansion";
  } else if (
    reassuranceScore >
      buildingScore &&
    reassuranceScore >=
      learningScore
  ) {
    likelyPurpose =
      "seeking-reassurance";
  } else if (
    learningScore > 0
  ) {
    likelyPurpose =
      "learning";
  }

  return {
    questionCount,

    manyQuestions:
      questionCount >= 4,

    likelyPurpose,

    scores: {
      building:
        buildingScore,

      reassurance:
        reassuranceScore,

      learning:
        learningScore,
    },
  };
}

function resolveParticipation({
  context,
}) {
  const participants =
    asArray(
      context
        ?.participants
    );

  let participationMode =
    context
      ?.participationMode;

  if (
    !Object.values(
      PARTICIPATION_MODES
    ).includes(
      participationMode
    )
  ) {
    if (
      participants.length <=
      1
    ) {
      participationMode =
        PARTICIPATION_MODES
          .SOLO;
    } else if (
      participants.length ===
        2 &&
      context
        ?.primaryCreatorId
    ) {
      participationMode =
        PARTICIPATION_MODES
          .PRIMARY_WITH_GUEST;
    } else if (
      participants.length >
      1
    ) {
      participationMode =
        PARTICIPATION_MODES
          .COLLABORATIVE;
    } else {
      participationMode =
        PARTICIPATION_MODES
          .SOLO;
    }
  }

  const currentSpeaker =
    participants.find(
      (participant) =>
        participant?.id ===
        context
          ?.currentSpeakerId
    ) || null;

  const primaryCreator =
    participants.find(
      (participant) =>
        participant?.id ===
        context
          ?.primaryCreatorId
    ) || null;

  const unknownSpeaker =
    Boolean(
      context
        ?.currentSpeakerId &&
      !currentSpeaker
    );

  return {
    mode:
      participationMode,

    participants:
      cloneValue(
        participants
      ),

    currentSpeaker:
      cloneValue(
        currentSpeaker
      ),

    primaryCreator:
      cloneValue(
        primaryCreator
      ),

    unknownSpeaker,

    requiresIntroduction:
      unknownSpeaker ||
      Boolean(
        currentSpeaker &&
        currentSpeaker
          ?.known ===
          false
      ),

    personalMemoryMustRemainScoped:
      participants.length > 1,

    projectMemoryMayBeShared:
      participants.length > 1,
  };
}

function resolveCommunicationChannel({
  context,
}) {
  const preferredChannel =
    context
      ?.preferredChannel;

  if (
    Object.values(
      COMMUNICATION_CHANNELS
    ).includes(
      preferredChannel
    )
  ) {
    return preferredChannel;
  }

  return (
    COMMUNICATION_CHANNELS
      .TEXT
  );
}

function resolvePreferredDepth(
  preferredDepth
) {
  if (
    Object.values(
      COMMUNICATION_DEPTHS
    ).includes(
      preferredDepth
    )
  ) {
    return preferredDepth;
  }

  switch (
    preferredDepth
  ) {
    case "silent":
    case "one-line":
    case "minimal":
      return (
        COMMUNICATION_DEPTHS
          .MINIMAL
      );

    case "short":
    case "concise":
      return (
        COMMUNICATION_DEPTHS
          .CONCISE
      );

    case "medium":
    case "balanced":
      return (
        COMMUNICATION_DEPTHS
          .BALANCED
      );

    case "detailed":
    case "explanatory":
      return (
        COMMUNICATION_DEPTHS
          .EXPLANATORY
      );

    case "deep":
      return (
        COMMUNICATION_DEPTHS
          .DEEP
      );

    default:
      return null;
  }
}

function resolveCommunicationPace({
  mode,
  adaptivePlan,
  responseBlueprint,
  context,
  uncertainty,
}) {
  if (
    Object.values(
      COMMUNICATION_PACES
    ).includes(
      context
        ?.preferredCommunicationPace
    )
  ) {
    return (
      context
        .preferredCommunicationPace
    );
  }

  if (
    blueprintRequestsSilence(
      responseBlueprint
    )
  ) {
    return (
      COMMUNICATION_PACES
        .VERY_SLOW
    );
  }

  if (
    mode ===
      COMMUNICATION_MODES
        .MEMORY_FORGET
  ) {
    return (
      COMMUNICATION_PACES
        .BRISK
    );
  }

  if (
    [
      COMMUNICATION_MODES
        .CREATION_HANDOFF,

      COMMUNICATION_MODES
        .REFINEMENT_HANDOFF,

      COMMUNICATION_MODES
        .PUBLISHING_HANDOFF,

      COMMUNICATION_MODES
        .NEXT_TASK,
    ].includes(mode)
  ) {
    return (
      COMMUNICATION_PACES
        .FAST
    );
  }

  if (
    mode ===
      COMMUNICATION_MODES
        .SESSION_HANDOFF ||
    mode ===
      COMMUNICATION_MODES
        .PROJECT_RESTORATION ||
    mode ===
      COMMUNICATION_MODES
        .RETURNING
  ) {
    return (
      COMMUNICATION_PACES
        .NATURAL
    );
  }

  if (
    uncertainty
      .shouldReassure ||
    context
      ?.creatorAppearsConfused
  ) {
    return (
      COMMUNICATION_PACES
        .MEASURED
    );
  }

  if (
    context
      ?.informationSaturation ===
      "high" ||
    context
      ?.informationSaturation ===
      "overloaded"
  ) {
    return (
      COMMUNICATION_PACES
        .SLOW
    );
  }

  if (
    mode ===
      COMMUNICATION_MODES
        .BUILD ||
    mode ===
      COMMUNICATION_MODES
        .FLOW
  ) {
    return (
      COMMUNICATION_PACES
        .FAST
    );
  }

  if (
    mode ===
      COMMUNICATION_MODES
        .REFLECTION ||
    mode ===
      COMMUNICATION_MODES
        .RECOVERY
  ) {
    return (
      COMMUNICATION_PACES
        .MEASURED
    );
  }

  if (
    getNestedValue(
      adaptivePlan,
      "behaviour.responseDepth",
      null
    ) ===
      "one-line"
  ) {
    return (
      COMMUNICATION_PACES
        .BRISK
    );
  }

  return (
    COMMUNICATION_PACES
      .NATURAL
  );
}

function resolveCommunicationDepth({
  mode,
  adaptivePlan,
  responseBlueprint,
  context,
  questionPattern,
}) {
  const preferredDepth =
    resolvePreferredDepth(
      context
        ?.preferredResponseDepth
    );

  if (preferredDepth) {
    return preferredDepth;
  }

  const adaptiveDepth =
    getNestedValue(
      adaptivePlan,
      "behaviour.responseDepth",
      "short"
    );

  const blueprintLength =
    responseBlueprint
      ?.length;

  if (
    blueprintLength ===
      "silent" ||
    blueprintLength ===
      "one-line"
  ) {
    return (
      COMMUNICATION_DEPTHS
        .MINIMAL
    );
  }

  if (
    mode ===
      COMMUNICATION_MODES
        .MEMORY_FORGET
  ) {
    return (
      COMMUNICATION_DEPTHS
        .MINIMAL
    );
  }

  if (
    [
      COMMUNICATION_MODES
        .CREATION_HANDOFF,

      COMMUNICATION_MODES
        .REFINEMENT_HANDOFF,

      COMMUNICATION_MODES
        .PUBLISHING_HANDOFF,

      COMMUNICATION_MODES
        .NEXT_TASK,

      COMMUNICATION_MODES
        .SESSION_HANDOFF,

      COMMUNICATION_MODES
        .PROJECT_RESTORATION,

      COMMUNICATION_MODES
        .RETURNING,

      COMMUNICATION_MODES
        .MEMORY_CAPTURE,
    ].includes(mode)
  ) {
    return (
      COMMUNICATION_DEPTHS
        .CONCISE
    );
  }

  if (
    mode ===
      COMMUNICATION_MODES
        .BUILD ||
    mode ===
      COMMUNICATION_MODES
        .FLOW
  ) {
    return (
      COMMUNICATION_DEPTHS
        .CONCISE
    );
  }

  if (
    context
      ?.informationSaturation ===
      "high" ||
    context
      ?.informationSaturation ===
      "overloaded"
  ) {
    return (
      COMMUNICATION_DEPTHS
        .CONCISE
    );
  }

  if (
    questionPattern
      .likelyPurpose ===
      "learning" ||
    adaptiveDepth ===
      "detailed"
  ) {
    return (
      COMMUNICATION_DEPTHS
        .EXPLANATORY
    );
  }

  if (
    adaptiveDepth ===
      "medium"
  ) {
    return (
      COMMUNICATION_DEPTHS
        .BALANCED
    );
  }

  if (
    mode ===
      COMMUNICATION_MODES
        .REFLECTION ||
    mode ===
      COMMUNICATION_MODES
        .EXPLORATION
  ) {
    return (
      COMMUNICATION_DEPTHS
        .BALANCED
    );
  }

  return (
    COMMUNICATION_DEPTHS
      .BALANCED
  );
}

function resolveCommunicationTone({
  mode,
  uncertainty,
  context,
  responseBlueprint,
}) {
  if (
    uncertainty
      .shouldReassure
  ) {
    return (
      COMMUNICATION_TONES
        .REASSURING
    );
  }

  if (
    context
      ?.creatorEnergy ===
      "low" ||
    context
      ?.creatorEnergy ===
      "depleted"
  ) {
    return (
      COMMUNICATION_TONES
        .CALM
    );
  }

  const blueprintWarmth =
    responseBlueprint
      ?.style
      ?.warmth;

  if (
    blueprintWarmth ===
      "deeply-warm" &&
    ![
      COMMUNICATION_MODES
        .BUILD,

      COMMUNICATION_MODES
        .NEXT_TASK,
    ].includes(mode)
  ) {
    return (
      COMMUNICATION_TONES
        .WARM
    );
  }

  switch (mode) {
    case COMMUNICATION_MODES
      .BUILD:

    case COMMUNICATION_MODES
      .NEXT_TASK:
      return (
        COMMUNICATION_TONES
          .FOCUSED
      );

    case COMMUNICATION_MODES
      .CREATION_HANDOFF:

    case COMMUNICATION_MODES
      .REFINEMENT_HANDOFF:

    case COMMUNICATION_MODES
      .PUBLISHING_HANDOFF:
      return (
        COMMUNICATION_TONES
          .CONFIDENT
      );

    case COMMUNICATION_MODES
      .FLOW:
      return (
        COMMUNICATION_TONES
          .ENERGETIC
      );

    case COMMUNICATION_MODES
      .LEARNING:
      return (
        COMMUNICATION_TONES
          .WARM
      );

    case COMMUNICATION_MODES
      .REFLECTION:
      return (
        COMMUNICATION_TONES
          .REFLECTIVE
      );

    case COMMUNICATION_MODES
      .RECOVERY:
      return (
        COMMUNICATION_TONES
          .CALM
      );

    case COMMUNICATION_MODES
      .CELEBRATION:
      return (
        COMMUNICATION_TONES
          .CELEBRATORY
      );

    case COMMUNICATION_MODES
      .COLLABORATION:
      return (
        COMMUNICATION_TONES
          .WARM
      );

    case COMMUNICATION_MODES
      .PROJECT_RESTORATION:

    case COMMUNICATION_MODES
      .RETURNING:
      return (
        COMMUNICATION_TONES
          .CONTINUOUS
      );

    case COMMUNICATION_MODES
      .MEMORY_RECALL:

    case COMMUNICATION_MODES
      .MEMORY_CAPTURE:
      return (
        COMMUNICATION_TONES
          .WARM
      );

    case COMMUNICATION_MODES
      .MEMORY_FORGET:
      return (
        COMMUNICATION_TONES
          .CALM
      );

    case COMMUNICATION_MODES
      .SESSION_HANDOFF:

    case COMMUNICATION_MODES
      .CONVERSATION_LANDING:

    case COMMUNICATION_MODES
      .INCUBATION:
      return (
        COMMUNICATION_TONES
          .QUIET
      );

    default:
      return (
        COMMUNICATION_TONES
          .WARM
      );
  }
}

function resolveDirectness({
  mode,
  adaptivePlan,
  responseBlueprint,
  uncertainty,
}) {
  if (
    uncertainty
      .shouldReassure
  ) {
    return (
      DIRECTNESS_LEVELS
        .GENTLE
    );
  }

  const stance =
    getNestedValue(
      adaptivePlan,
      "behaviour.leadershipStance",
      "walk-beside"
    );

  const blueprintDirectness =
    responseBlueprint
      ?.style
      ?.directness;

  if (
    blueprintDirectness ===
      "very-direct"
  ) {
    return (
      DIRECTNESS_LEVELS
        .VERY_DIRECT
    );
  }

  if (
    blueprintDirectness ===
      "direct"
  ) {
    return (
      DIRECTNESS_LEVELS
        .DIRECT
    );
  }

  if (
    blueprintDirectness ===
      "gentle"
  ) {
    return (
      DIRECTNESS_LEVELS
        .GENTLE
    );
  }

  if (
    mode ===
      COMMUNICATION_MODES
        .MEMORY_FORGET
  ) {
    return (
      DIRECTNESS_LEVELS
        .DIRECT
    );
  }

  if (
    [
      COMMUNICATION_MODES
        .BUILD,

      COMMUNICATION_MODES
        .NEXT_TASK,

      COMMUNICATION_MODES
        .CREATION_HANDOFF,

      COMMUNICATION_MODES
        .REFINEMENT_HANDOFF,

      COMMUNICATION_MODES
        .PUBLISHING_HANDOFF,
    ].includes(mode) ||
    stance ===
      "lead"
  ) {
    return (
      DIRECTNESS_LEVELS
        .DIRECT
    );
  }

  if (
    mode ===
      COMMUNICATION_MODES
        .REFLECTION ||
    mode ===
      COMMUNICATION_MODES
        .RECOVERY ||
    mode ===
      COMMUNICATION_MODES
        .MEMORY_RECALL
  ) {
    return (
      DIRECTNESS_LEVELS
        .GENTLE
    );
  }

  return (
    DIRECTNESS_LEVELS
      .BALANCED
  );
}

function resolveCommunicationEnergy({
  mode,
  context,
  responseBlueprint,
}) {
  if (
    blueprintRequestsSilence(
      responseBlueprint
    )
  ) {
    return (
      COMMUNICATION_ENERGY
        .VERY_LOW
    );
  }

  if (
    context
      ?.creatorEnergy ===
      "low" ||
    context
      ?.creatorEnergy ===
      "depleted"
  ) {
    return (
      COMMUNICATION_ENERGY
        .LOW
    );
  }

  if (
    mode ===
      COMMUNICATION_MODES
        .MEMORY_FORGET ||
    mode ===
      COMMUNICATION_MODES
        .SESSION_HANDOFF ||
    mode ===
      COMMUNICATION_MODES
        .CONVERSATION_LANDING ||
    mode ===
      COMMUNICATION_MODES
        .INCUBATION
  ) {
    return (
      COMMUNICATION_ENERGY
        .LOW
    );
  }

  if (
    [
      COMMUNICATION_MODES
        .FLOW,

      COMMUNICATION_MODES
        .BUILD,

      COMMUNICATION_MODES
        .NEXT_TASK,

      COMMUNICATION_MODES
        .CREATION_HANDOFF,
    ].includes(mode) ||
    context
      ?.momentum ===
      "strong" ||
    context
      ?.momentum ===
      "rising"
  ) {
    return (
      COMMUNICATION_ENERGY
        .HIGH
    );
  }

  if (
    mode ===
      COMMUNICATION_MODES
        .CELEBRATION
  ) {
    return (
      COMMUNICATION_ENERGY
        .LIFTING
    );
  }

  if (
    mode ===
      COMMUNICATION_MODES
        .RECOVERY ||
    mode ===
      COMMUNICATION_MODES
        .REFLECTION
  ) {
    return (
      COMMUNICATION_ENERGY
        .LOW
    );
  }

  return (
    COMMUNICATION_ENERGY
      .MATCHED
  );
}

function resolveHumourPolicy({
  relationshipStage,
  familiarity,
  mode,
  context,
  uncertainty,
}) {
  if (
    uncertainty
      .shouldReassure ||
    context
      ?.humourAllowed ===
      false
  ) {
    return {
      level:
        HUMOUR_LEVELS.NONE,

      mayUseCallback:
        false,

      mayUseSharedJoke:
        false,

      reason:
        "Humour may distract from the creator's current need.",
    };
  }

  if (
    [
      COMMUNICATION_MODES
        .MEMORY_FORGET,

      COMMUNICATION_MODES
        .REFLECTION,

      COMMUNICATION_MODES
        .RECOVERY,

      COMMUNICATION_MODES
        .INCUBATION,
    ].includes(mode)
  ) {
    return {
      level:
        HUMOUR_LEVELS.TRACE,

      mayUseCallback:
        false,

      mayUseSharedJoke:
        false,

      reason:
        "Humour should not compete with the current communication need.",
    };
  }

  if (
    mode ===
      COMMUNICATION_MODES
        .SESSION_HANDOFF
  ) {
    return {
      level:
        familiarity ===
        FAMILIARITY_LEVELS
          .SHARED_SHORTHAND
          ? HUMOUR_LEVELS
              .LIGHT
          : HUMOUR_LEVELS
              .TRACE,

      mayUseCallback:
        familiarity ===
        FAMILIARITY_LEVELS
          .SHARED_SHORTHAND,

      mayUseSharedJoke:
        familiarity ===
          FAMILIARITY_LEVELS
            .SHARED_SHORTHAND &&
        asArray(
          context
            ?.sharedJokes
        ).length > 0,

      reason:
        "A familiar handoff may contain a light relationship callback, but leaving remains the priority.",
    };
  }

  if (
    familiarity ===
      FAMILIARITY_LEVELS
        .SHARED_SHORTHAND
  ) {
    return {
      level:
        HUMOUR_LEVELS
          .NATURAL,

      mayUseCallback:
        true,

      mayUseSharedJoke:
        asArray(
          context
            ?.sharedJokes
        ).length > 0,

      reason:
        "The relationship has earned contextual humour and callbacks.",
    };
  }

  if (
    relationshipStage ===
      RELATIONSHIP_STAGES
        .TRUSTED ||
    relationshipStage ===
      RELATIONSHIP_STAGES
        .LONG_TERM
  ) {
    return {
      level:
        HUMOUR_LEVELS
          .LIGHT,

      mayUseCallback:
        true,

      mayUseSharedJoke:
        false,

      reason:
        "Light humour may support an established relationship.",
    };
  }

  if (
    relationshipStage ===
      RELATIONSHIP_STAGES
        .ESTABLISHED
  ) {
    return {
      level:
        HUMOUR_LEVELS
          .TRACE,

      mayUseCallback:
        false,

      mayUseSharedJoke:
        false,

      reason:
        "Use only naturally emerging humour.",
    };
  }

  return {
    level:
      HUMOUR_LEVELS.NONE,

    mayUseCallback:
      false,

    mayUseSharedJoke:
      false,

    reason:
      "Do not manufacture familiarity in a new relationship.",
  };
}

function resolveCreativeExpression({
  mode,
  context,
  relationshipStage,
}) {
  const creatorUsesAnalogies =
    asArray(
      context
        ?.establishedVocabulary
    ).some(
      (value) =>
        [
          "analogy",
          "simile",
          "metaphor",
          "story",
        ].includes(
          normaliseText(
            value
          )
        )
    );

  let analogy =
    ANALOGY_LEVELS
      .OPTIONAL;

  let storytelling =
    STORYTELLING_LEVELS
      .NONE;

  if (
    mode ===
    COMMUNICATION_MODES
      .LEARNING
  ) {
    analogy =
      creatorUsesAnalogies
        ? ANALOGY_LEVELS
            .PREFERRED
        : ANALOGY_LEVELS
            .USEFUL;

    storytelling =
      STORYTELLING_LEVELS
        .LIGHT;
  }

  if (
    mode ===
      COMMUNICATION_MODES
        .EXPLORATION ||
    mode ===
      COMMUNICATION_MODES
        .REFLECTION
  ) {
    analogy =
      ANALOGY_LEVELS
        .USEFUL;

    storytelling =
      relationshipStage ===
        RELATIONSHIP_STAGES
          .NEW
        ? STORYTELLING_LEVELS
            .MICRO
        : STORYTELLING_LEVELS
            .LIGHT;
  }

  if (
    [
      COMMUNICATION_MODES
        .BUILD,

      COMMUNICATION_MODES
        .FLOW,

      COMMUNICATION_MODES
        .NEXT_TASK,

      COMMUNICATION_MODES
        .CREATION_HANDOFF,

      COMMUNICATION_MODES
        .REFINEMENT_HANDOFF,

      COMMUNICATION_MODES
        .PUBLISHING_HANDOFF,

      COMMUNICATION_MODES
        .MEMORY_FORGET,

      COMMUNICATION_MODES
        .PROJECT_RESTORATION,

      COMMUNICATION_MODES
        .SESSION_HANDOFF,

      COMMUNICATION_MODES
        .MEMORY_CAPTURE,

      COMMUNICATION_MODES
        .INCUBATION,
    ].includes(mode)
  ) {
    analogy =
      ANALOGY_LEVELS.NONE;

    storytelling =
      STORYTELLING_LEVELS
        .NONE;
  }

  return {
    analogy,
    storytelling,
  };
}

function resolvePerformance({
  mode,
  channel,
  uncertainty,
  conversationPhase,
  responseBlueprint,
}) {
  let pauseStyle =
    PAUSE_STYLES.NATURAL;

  let emphasis =
    EMPHASIS_STYLES.NATURAL;

  if (
    blueprintRequestsSilence(
      responseBlueprint
    )
  ) {
    pauseStyle =
      PAUSE_STYLES
        .HOLD_SPACE;

    emphasis =
      EMPHASIS_STYLES.FLAT;
  } else if (
    [
      COMMUNICATION_MODES
        .BUILD,

      COMMUNICATION_MODES
        .FLOW,

      COMMUNICATION_MODES
        .NEXT_TASK,

      COMMUNICATION_MODES
        .CREATION_HANDOFF,

      COMMUNICATION_MODES
        .REFINEMENT_HANDOFF,

      COMMUNICATION_MODES
        .PUBLISHING_HANDOFF,

      COMMUNICATION_MODES
        .MEMORY_FORGET,
    ].includes(mode)
  ) {
    pauseStyle =
      PAUSE_STYLES.MICRO;

    emphasis =
      EMPHASIS_STYLES
        .SELECTIVE;
  } else if (
    mode ===
      COMMUNICATION_MODES
        .REFLECTION ||
    mode ===
      COMMUNICATION_MODES
        .RECOVERY
  ) {
    pauseStyle =
      PAUSE_STYLES
        .REFLECTIVE;

    emphasis =
      EMPHASIS_STYLES
        .LIGHT;
  }

  if (
    mode ===
      COMMUNICATION_MODES
        .SESSION_HANDOFF ||
    conversationPhase ===
      CONVERSATION_PHASES
        .LANDING
  ) {
    pauseStyle =
      PAUSE_STYLES
        .REFLECTIVE;

    emphasis =
      EMPHASIS_STYLES
        .LIGHT;
  }

  if (
    uncertainty
      .shouldReassure
  ) {
    pauseStyle =
      PAUSE_STYLES.NATURAL;

    emphasis =
      EMPHASIS_STYLES
        .LIGHT;
  }

  const openingPauseMs =
    pauseStyle ===
      PAUSE_STYLES
        .HOLD_SPACE
      ? 1000
      : pauseStyle ===
          PAUSE_STYLES
            .REFLECTIVE
        ? 450
        : pauseStyle ===
            PAUSE_STYLES
              .MICRO
          ? 80
          : 180;

  const interSentencePauseMs =
    pauseStyle ===
      PAUSE_STYLES
        .HOLD_SPACE
      ? 700
      : pauseStyle ===
          PAUSE_STYLES
            .REFLECTIVE
        ? 420
        : pauseStyle ===
            PAUSE_STYLES
              .MICRO
          ? 100
          : 220;

  return {
    channel,

    text: {
      paragraphSpacing:
        pauseStyle ===
          PAUSE_STYLES
            .REFLECTIVE ||
        pauseStyle ===
          PAUSE_STYLES
            .HOLD_SPACE
          ? "generous"
          : pauseStyle ===
              PAUSE_STYLES
                .MICRO
            ? "compact"
            : "natural",

      sentenceLength:
        [
          COMMUNICATION_MODES
            .BUILD,

          COMMUNICATION_MODES
            .NEXT_TASK,

          COMMUNICATION_MODES
            .MEMORY_FORGET,
        ].includes(mode)
          ? "short"
          : mode ===
              COMMUNICATION_MODES
                .REFLECTION
            ? "varied"
            : "natural",

      punctuation:
        "Use punctuation to support natural rhythm without theatrical overuse.",

      lineBreaks:
        "Use line breaks only where they create genuine cadence or clarity.",
    },

    speech: {
      pauseStyle,

      openingPauseMs,

      interSentencePauseMs,

      emphasis,

      avoidEqualStress:
        true,

      guidance: [
        "Do not stress every word equally.",

        "Emphasise only the words carrying the sentence's meaning.",

        "Avoid exaggerated performance unless the content genuinely calls for it.",

        "Allow pitch, volume and speed to vary naturally.",

        "Do not force a youthful, fashionable or culturally coded vocal mannerism.",

        "Do not change semantic meaning through vocal emphasis.",

        blueprintRequestsSilence(
          responseBlueprint
        )
          ? "If silence is the response, do not manufacture spoken filler."
          : null,
      ].filter(Boolean),
    },

    avatar: {
      enabled:
        channel ===
          COMMUNICATION_CHANNELS
            .FUTURE_AVATAR,

      expressionIntensity:
        mode ===
          COMMUNICATION_MODES
            .CELEBRATION
          ? "moderate"
          : mode ===
              COMMUNICATION_MODES
                .REFLECTION ||
            mode ===
              COMMUNICATION_MODES
                .RECOVERY ||
            mode ===
              COMMUNICATION_MODES
                .INCUBATION
            ? "subtle"
            : "natural",

      gestureDensity:
        [
          COMMUNICATION_MODES
            .BUILD,

          COMMUNICATION_MODES
            .NEXT_TASK,

          COMMUNICATION_MODES
            .INCUBATION,
        ].includes(mode)
          ? "low"
          : "natural",

      guidance: [
        "Facial expression and gesture must support rather than exaggerate the meaning.",

        "Do not perform emotional certainty the Mentor does not have.",

        "Do not allow avatar animation to create false urgency.",

        "Maintain one continuous Mentor identity across text, speech and avatar presentation.",

        blueprintRequestsSilence(
          responseBlueprint
        )
          ? "During intentional silence, use only quiet presence rather than animated prompting."
          : null,
      ].filter(Boolean),
    },
  };
}

function resolveCheckInPolicy({
  shortReply,
  uncertainty,
  questionPattern,
  conversationPhase,
  mode,
  context,
  responseBlueprint,
}) {
  const maximumQuestions =
    getBlueprintMaximumQuestions(
      responseBlueprint
    );

  if (
    blueprintRequestsSilence(
      responseBlueprint
    )
  ) {
    return {
      policy:
        CHECK_IN_POLICIES.NONE,

      type: null,

      reason:
        "The response blueprint requires silence.",
    };
  }

  if (
    blueprintClarifiesForget(
      responseBlueprint
    )
  ) {
    return {
      policy:
        maximumQuestions > 0
          ? CHECK_IN_POLICIES
              .REQUIRED_BEFORE_PROGRESSING
          : CHECK_IN_POLICIES.NONE,

      type:
        maximumQuestions > 0
          ? CHECK_IN_TYPES
              .DIRECTION
          : null,

      reason:
        maximumQuestions > 0
          ? "The forget target must be clarified before memory can be changed."
          : "The response blueprint does not permit a question.",
    };
  }

  /**
   * CommunicationVoiceEngine must never create a new question
   * after ResponseComposer has already prohibited questions.
   */
  if (
    maximumQuestions <= 0
  ) {
    return {
      policy:
        CHECK_IN_POLICIES.NONE,

      type: null,

      reason:
        "The response blueprint allows no questions.",
    };
  }

  if (
    [
      COMMUNICATION_MODES
        .BUILD,

      COMMUNICATION_MODES
        .FLOW,

      COMMUNICATION_MODES
        .NEXT_TASK,

      COMMUNICATION_MODES
        .CREATION_HANDOFF,

      COMMUNICATION_MODES
        .REFINEMENT_HANDOFF,

      COMMUNICATION_MODES
        .PUBLISHING_HANDOFF,

      COMMUNICATION_MODES
        .SESSION_HANDOFF,

      COMMUNICATION_MODES
        .MEMORY_FORGET,

      COMMUNICATION_MODES
        .INCUBATION,
    ].includes(mode) &&
    !uncertainty
      .shouldReassure
  ) {
    return {
      policy:
        CHECK_IN_POLICIES.NONE,

      type: null,

      reason:
        "The current mode benefits from forward movement or quiet space rather than an optional check-in.",
    };
  }

  if (
    conversationPhase ===
      CONVERSATION_PHASES
        .CLOSED ||
    conversationPhase ===
      CONVERSATION_PHASES
        .LANDING
  ) {
    return {
      policy:
        CHECK_IN_POLICIES.NONE,

      type: null,

      reason:
        "Do not restart a conversation that is naturally landing.",
    };
  }

  if (
    context
      ?.creatorExplicitlyAskedToContinue ||
    context
      ?.creatorExplicitlyAskedForNextStep ||
    context
      ?.creatorExplicitlyAskedToCreate
  ) {
    return {
      policy:
        CHECK_IN_POLICIES.NONE,

      type: null,

      reason:
        "The creator has already given clear forward direction.",
    };
  }

  if (
    uncertainty
      .shouldReassure ||
    context
      ?.creatorAppearsConfused
  ) {
    return {
      policy:
        CHECK_IN_POLICIES
          .RECOMMENDED,

      type:
        CHECK_IN_TYPES
          .PACE,

      reason:
        "There is evidence that the creator may benefit from a gentle check-in.",
    };
  }

  if (
    shortReply.detected &&
    shortReply.confidence ===
      CREATOR_SIGNAL_CONFIDENCE
        .LOW
  ) {
    return {
      policy:
        CHECK_IN_POLICIES
          .OPTIONAL,

      type:
        CHECK_IN_TYPES
          .EXPERIENCE,

      reason:
        "The short reply has several plausible meanings.",
    };
  }

  if (
    questionPattern
      .manyQuestions &&
    questionPattern
      .likelyPurpose ===
      "unknown"
  ) {
    return {
      policy:
        CHECK_IN_POLICIES
          .OPTIONAL,

      type:
        CHECK_IN_TYPES
          .COMPLETENESS,

      reason:
        "The creator has explored several angles and may want to decide whether to continue.",
    };
  }

  return {
    policy:
      CHECK_IN_POLICIES.NONE,

    type: null,

    reason:
      "No check-in is currently necessary.",
  };
}

function createCheckInGuidance(
  checkIn
) {
  if (
    checkIn.policy ===
    CHECK_IN_POLICIES.NONE
  ) {
    return [];
  }

  switch (
    checkIn.type
  ) {
    case CHECK_IN_TYPES.PACE:
      return [
        "Prefer a low-pressure pace check rather than testing comprehension.",
        "Offer to explain one part differently when useful.",
      ];

    case CHECK_IN_TYPES.ALIGNMENT:
      return [
        "Check whether the direction still feels right.",
        "Allow disagreement without framing it as failure.",
      ];

    case CHECK_IN_TYPES.COMPLETENESS:
      return [
        "Check whether anything still feels unfinished or whether the creator is ready to move on.",
        "Do not default to a formal 'Any questions?' ending.",
      ];

    case CHECK_IN_TYPES.READINESS:
      return [
        "Check readiness to move forward using one natural sentence.",
      ];

    case CHECK_IN_TYPES.EXPERIENCE:
      return [
        "Use a broad, low-pressure check-in.",
        "Do not assume confusion merely because the reply was brief.",
      ];

    case CHECK_IN_TYPES.UNDERSTANDING:
      return [
        "Offer a different explanation or angle rather than repeating the same wording.",
      ];

    case CHECK_IN_TYPES.DIRECTION:
      return [
        "Ask one direct clarification question and nothing more.",
      ];

    default:
      return [];
  }
}

function resolvePrimaryResponseEffect({
  mode,
  uncertainty,
  adaptivePlan,
}) {
  if (
    uncertainty
      .shouldReassure
  ) {
    return (
      RESPONSE_EFFECTS
        .CONFIDENCE
    );
  }

  if (
    mode ===
      COMMUNICATION_MODES
        .PROJECT_RESTORATION ||
    mode ===
      COMMUNICATION_MODES
        .RETURNING ||
    mode ===
      COMMUNICATION_MODES
        .MEMORY_RECALL
  ) {
    return (
      RESPONSE_EFFECTS
        .CONTINUITY
    );
  }

  if (
    mode ===
      COMMUNICATION_MODES
        .SESSION_HANDOFF ||
    mode ===
      COMMUNICATION_MODES
        .CONVERSATION_LANDING
  ) {
    return (
      RESPONSE_EFFECTS
        .CLOSURE
    );
  }

  if (
    [
      COMMUNICATION_MODES
        .CREATION_HANDOFF,

      COMMUNICATION_MODES
        .REFINEMENT_HANDOFF,

      COMMUNICATION_MODES
        .PUBLISHING_HANDOFF,

      COMMUNICATION_MODES
        .NEXT_TASK,
    ].includes(mode)
  ) {
    return (
      RESPONSE_EFFECTS
        .READINESS
    );
  }

  if (
    getNestedValue(
      adaptivePlan,
      "execution.shouldMoveForward",
      false
    )
  ) {
    return (
      RESPONSE_EFFECTS
        .MOMENTUM
    );
  }

  switch (mode) {
    case COMMUNICATION_MODES
      .LEARNING:
      return (
        RESPONSE_EFFECTS
          .UNDERSTANDING
      );

    case COMMUNICATION_MODES
      .REFLECTION:
      return (
        RESPONSE_EFFECTS
          .CLARITY
      );

    case COMMUNICATION_MODES
      .EXPLORATION:
      return (
        RESPONSE_EFFECTS
          .CURIOSITY
      );

    case COMMUNICATION_MODES
      .RECOVERY:
      return (
        RESPONSE_EFFECTS
          .CALM
      );

    case COMMUNICATION_MODES
      .CELEBRATION:
      return (
        RESPONSE_EFFECTS
          .CELEBRATION
      );

    case COMMUNICATION_MODES
      .COLLABORATION:
      return (
        RESPONSE_EFFECTS
          .CONNECTION
      );

    case COMMUNICATION_MODES
      .BUILD:

    case COMMUNICATION_MODES
      .FLOW:
      return (
        RESPONSE_EFFECTS
          .MOMENTUM
      );

    default:
      return (
        RESPONSE_EFFECTS
          .CLARITY
      );
  }
}

function resolveLandingStyle({
  mode,
  conversationPhase,
  responseBlueprint,
}) {
  if (
    blueprintPreservesSessionHandoff(
      responseBlueprint
    ) ||
    mode ===
      COMMUNICATION_MODES
        .SESSION_HANDOFF
  ) {
    return (
      LANDING_STYLES
        .PRESERVE_AND_LEAVE
    );
  }

  if (
    conversationPhase ===
      CONVERSATION_PHASES
        .CLOSED
  ) {
    return (
      LANDING_STYLES
        .CLOSE_SESSION
    );
  }

  if (
    conversationPhase ===
      CONVERSATION_PHASES
        .LANDING
  ) {
    return (
      LANDING_STYLES
        .SOFT_STOP
    );
  }

  if (
    [
      COMMUNICATION_MODES
        .BUILD,

      COMMUNICATION_MODES
        .FLOW,

      COMMUNICATION_MODES
        .NEXT_TASK,

      COMMUNICATION_MODES
        .CREATION_HANDOFF,

      COMMUNICATION_MODES
        .REFINEMENT_HANDOFF,

      COMMUNICATION_MODES
        .PUBLISHING_HANDOFF,
    ].includes(mode)
  ) {
    return (
      LANDING_STYLES
        .CONTINUE_FORWARD
    );
  }

  return (
    LANDING_STYLES.NONE
  );
}

function createCommunicationActions({
  mode,
  relationshipStage,
  familiarity,
  humour,
  creativeExpression,
  conversationPhase,
  participation,
  checkIn,
  context,
  adaptivePlan,
  responseBlueprint,
}) {
  const actions = [];

  if (
    blueprintRequestsSilence(
      responseBlueprint
    )
  ) {
    actions.push(
      COMMUNICATION_ACTIONS
        .OBEY_BLUEPRINT_SILENCE,

      COMMUNICATION_ACTIONS
        .HOLD_SPACE
    );
  }

  actions.push(
    COMMUNICATION_ACTIONS
      .OBEY_BLUEPRINT_QUESTION_LIMIT
  );

  if (
    hasSpecialistMachinery({
      adaptivePlan,
      responseBlueprint,
      context,
    })
  ) {
    actions.push(
      COMMUNICATION_ACTIONS
        .HIDE_SPECIALIST_MACHINERY
    );
  }

  if (
    context
      ?.creatorIsReturning ||
    mode ===
      COMMUNICATION_MODES
        .RETURNING
  ) {
    actions.push(
      COMMUNICATION_ACTIONS
        .WELCOME_RETURN
    );
  }

  if (
    mode ===
      COMMUNICATION_MODES
        .PROJECT_RESTORATION
  ) {
    actions.push(
      COMMUNICATION_ACTIONS
        .RESTORE_PROJECT_CONTINUITY
    );
  }

  if (
    mode ===
      COMMUNICATION_MODES
        .MEMORY_RECALL
  ) {
    actions.push(
      COMMUNICATION_ACTIONS
        .EXPRESS_MEMORY_NATURALLY
    );
  }

  if (
    mode ===
      COMMUNICATION_MODES
        .MEMORY_CAPTURE
  ) {
    actions.push(
      COMMUNICATION_ACTIONS
        .EXPRESS_MEMORY_CAPTURE_MINIMALLY
    );
  }

  if (
    blueprintClarifiesForget(
      responseBlueprint
    )
  ) {
    actions.push(
      COMMUNICATION_ACTIONS
        .CLARIFY_FORGET_REQUEST
    );
  }

  if (
    blueprintAppliesForget(
      responseBlueprint
    )
  ) {
    actions.push(
      COMMUNICATION_ACTIONS
        .CONFIRM_FORGET_RESULT
    );
  }

  if (
    blueprintPreservesSessionHandoff(
      responseBlueprint
    )
  ) {
    actions.push(
      COMMUNICATION_ACTIONS
        .PRESERVE_SESSION_HANDOFF
    );
  }

  if (
    participation
      .requiresIntroduction
  ) {
    actions.push(
      COMMUNICATION_ACTIONS
        .WELCOME_PARTICIPANT
    );
  }

  if (
    [
      PARTICIPATION_MODES
        .COLLABORATIVE,

      PARTICIPATION_MODES
        .GROUP,

      PARTICIPATION_MODES
        .PRIMARY_WITH_GUEST,
    ].includes(
      participation.mode
    )
  ) {
    actions.push(
      COMMUNICATION_ACTIONS
        .FACILITATE_COLLABORATION
    );
  }

  if (
    [
      COMMUNICATION_MODES
        .BUILD,

      COMMUNICATION_MODES
        .FLOW,

      COMMUNICATION_MODES
        .NEXT_TASK,

      COMMUNICATION_MODES
        .CREATION_HANDOFF,

      COMMUNICATION_MODES
        .REFINEMENT_HANDOFF,

      COMMUNICATION_MODES
        .PUBLISHING_HANDOFF,
    ].includes(mode)
  ) {
    actions.push(
      COMMUNICATION_ACTIONS
        .MOVE_TO_ACTION,

      COMMUNICATION_ACTIONS
        .ANSWER_CONCISELY
    );
  } else if (
    mode ===
    COMMUNICATION_MODES
      .LEARNING
  ) {
    actions.push(
      COMMUNICATION_ACTIONS
        .EXPLAIN_ONE_CONCEPT
    );
  } else if (
    !blueprintRequestsSilence(
      responseBlueprint
    )
  ) {
    actions.push(
      COMMUNICATION_ACTIONS
        .MATCH_AND_CONTINUE
    );
  }

  if (
    checkIn.policy !==
      CHECK_IN_POLICIES.NONE
  ) {
    actions.push(
      COMMUNICATION_ACTIONS
        .ASK_LOW_PRESSURE_CHECK_IN
    );
  }

  if (
    [
      HUMOUR_LEVELS.LIGHT,
      HUMOUR_LEVELS.NATURAL,
      HUMOUR_LEVELS.PLAYFUL,
    ].includes(
      humour.level
    )
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
      RELATIONSHIP_STAGES
        .NEW
  ) {
    actions.push(
      COMMUNICATION_ACTIONS
        .USE_SHARED_SHORTHAND
    );
  }

  if (
    [
      ANALOGY_LEVELS.USEFUL,
      ANALOGY_LEVELS.PREFERRED,
    ].includes(
      creativeExpression
        .analogy
    )
  ) {
    actions.push(
      COMMUNICATION_ACTIONS
        .USE_ANALOGY
    );
  }

  if (
    [
      STORYTELLING_LEVELS
        .MICRO,

      STORYTELLING_LEVELS
        .LIGHT,

      STORYTELLING_LEVELS
        .MODERATE,

      STORYTELLING_LEVELS
        .FEATURED,
    ].includes(
      creativeExpression
        .storytelling
    )
  ) {
    actions.push(
      COMMUNICATION_ACTIONS
        .USE_MICRO_STORY
    );
  }

  if (
    conversationPhase ===
      CONVERSATION_PHASES
        .LANDING ||
    conversationPhase ===
      CONVERSATION_PHASES
        .CLOSED
  ) {
    actions.push(
      COMMUNICATION_ACTIONS
        .LAND_CONVERSATION
    );
  }

  return uniqueValues(
    actions
  );
}

function createProjectContinuityGuidance({
  mode,
  adaptivePlan,
  responseBlueprint,
  context,
}) {
  const guidance = [];

  const projectId =
    getProjectId({
      adaptivePlan,
      responseBlueprint,
      context,
    });

  if (
    !projectId &&
    mode !==
      COMMUNICATION_MODES
        .PROJECT_RESTORATION
  ) {
    return guidance;
  }

  guidance.push(
    "Treat remembered project context as continuity support, not as a memory demonstration.",

    "Do not narrate the retrieval process.",

    "Do not say 'according to my memory' when the information can simply be used naturally.",

    "Prefer the creator's latest explicit project decision over older project context.",

    "If remembered project information conflicts with the creator's present correction, accept the correction without defensiveness.",

    "Do not mix memories from different projects.",

    "Use only the minimum project context needed for orientation or the next action."
  );

  if (
    mode ===
      COMMUNICATION_MODES
        .PROJECT_RESTORATION ||
    mode ===
      COMMUNICATION_MODES
        .RETURNING
  ) {
    guidance.push(
      "Restore the last meaningful landmark, current position and next useful step when known.",

      "Do not force the creator through a full recap before continuing.",

      "The ideal return feels like picking up a conversation rather than reopening a case file."
    );
  }

  if (
    mode ===
      COMMUNICATION_MODES
        .MEMORY_RECALL
  ) {
    guidance.push(
      "Recall harmless continuity facts directly when they simply prevent repetition.",

      "Ask permission only when reopening a previously deferred or personally significant subject."
    );
  }

  return uniqueValues(
    guidance
  );
}

function createMemoryCaptureGuidance({
  mode,
  responseBlueprint,
}) {
  if (
    mode !==
      COMMUNICATION_MODES
        .MEMORY_CAPTURE &&
    !blueprintCapturesMemory(
      responseBlueprint
    )
  ) {
    return [];
  }

  return [
    "Keep memory capture conversationally small.",

    "Do not turn preservation into the subject unless the creator asks.",

    "Do not claim something was saved until persistence confirms it.",

    "If capture is part of a brief detour, return to the previous task immediately after acknowledging the thought.",

    "Do not reopen a deferred topic merely because it has been captured.",
  ];
}

function createForgetGuidance({
  responseBlueprint,
}) {
  if (
    blueprintClarifiesForget(
      responseBlueprint
    )
  ) {
    return [
      "Ask exactly one concise clarification question.",

      "Do not guess which stored item the creator means.",

      "Do not repeat unnecessary details from candidate memories.",

      "Do not claim that anything has been deleted yet.",

      "Once the target is clear, let the persistence layer perform the actual forget operation.",
    ];
  }

  if (
    blueprintAppliesForget(
      responseBlueprint
    )
  ) {
    return [
      "Keep the acknowledgement of a forget request brief.",

      "Do not say that memory was deleted until execution confirms the deletion.",

      "Do not unnecessarily restate the information being forgotten.",

      "Do not recreate the deleted conclusion through immediate inference.",
    ];
  }

  return [];
}

function createSessionHandoffGuidance({
  mode,
  responseBlueprint,
  context,
}) {
  if (
    mode !==
      COMMUNICATION_MODES
        .SESSION_HANDOFF &&
    !blueprintPreservesSessionHandoff(
      responseBlueprint
    )
  ) {
    return [];
  }

  return [
    "Preserve what was completed, where the creator stopped and the next useful return point when known.",

    "Do not add new creative work while the creator is leaving.",

    "Do not turn the handoff into a long summary.",

    "Do not claim that the handoff is safely stored until persistence confirms it.",

    context?.returnPoint
      ? `Known return point: ${context.returnPoint}.`
      : null,

    "Let the creator leave without requiring another response.",

    "The future return should feel easy, familiar and immediately actionable.",
  ].filter(Boolean);
}

function createSpecialistMachineryGuidance({
  adaptivePlan,
  responseBlueprint,
  context,
}) {
  if (
    !hasSpecialistMachinery({
      adaptivePlan,
      responseBlueprint,
      context,
    })
  ) {
    return [];
  }

  return [
    "Present specialist intelligence through one coherent Mentor voice.",

    "Do not say 'the Story Agent says', 'the Continuity Agent found', 'the Character Agent thinks', or equivalent internal-routing language.",

    "Specialist observations may inform wording but do not become project truth merely because an agent produced them.",

    "Creator-approved decisions outrank specialist-agent assumptions.",

    "Internal disagreement between specialist systems should be resolved before the response reaches the creator whenever possible.",

    "Do not make the creator manage the internal team.",
  ];
}

function createBlueprintAuthorityGuidance({
  responseBlueprint,
}) {
  const maximumQuestions =
    getBlueprintMaximumQuestions(
      responseBlueprint
    );

  const guidance = [
    "ResponseComposer controls the permitted response structure.",

    "Do not introduce a response section that is absent from the blueprint.",

    `Do not exceed ${maximumQuestions} question${
      maximumQuestions === 1
        ? ""
        : "s"
    }.`,

    "Communication style may shape delivery but must not override the blueprint's meaning, section order or constraints.",

    "Do not convert an optional conversational check-in into a required question unless the blueprint permits it.",
  ];

  if (
    blueprintRequestsSilence(
      responseBlueprint
    )
  ) {
    guidance.push(
      "Generate no conversational text because the blueprint requires intentional silence.",

      "Do not use reassurance, check-ins, humour or filler to break intentional silence."
    );
  }

  return guidance;
}

function createTextGuidance({
  mode,
  depth,
  pace,
  tone,
  directness,
  humour,
  familiarity,
  checkIn,
  conversationPhase,
  adaptivePlan,
  responseBlueprint,
  context,
}) {
  const guidance = [
    `Use ${depth} communication depth.`,

    `Use a ${pace} reading pace.`,

    `Use a ${tone} tone.`,

    `Use ${directness} directness.`,

    "Answer the creator's actual question before adding broader context.",

    "Add one useful educational insight only when it helps the creator understand why.",

    "Do not turn every answer into a lesson.",

    "Prefer one useful idea over several loosely related ideas.",

    "Do not reassure unless the creator has shown evidence of uncertainty or asks for reassurance.",

    "Do not solve an emotional problem the creator has not shown they have.",

    "Do not interpret a brief reply as proof of either understanding or confusion.",

    "Read the trajectory of the conversation rather than responding to one sentence in isolation.",

    "Do not repeatedly ask whether the creator understands.",

    "Avoid formal lecture closings unless the situation genuinely resembles a lesson.",

    "Use natural spoken language while preserving clarity in written form.",

    "Let the creator read at their own pace.",

    "Avoid unnecessary repetition.",

    "Avoid artificial enthusiasm.",

    "Do not stress every idea equally.",

    "Use headings only when structure genuinely helps.",

    "Do not expose internal planning, memory structures, scores or specialist routing.",

    "Many internal capabilities may contribute; the final response must sound like one continuous Mentor relationship.",

    ...createBlueprintAuthorityGuidance({
      responseBlueprint,
    }),
  ];

  if (
    [
      COMMUNICATION_MODES
        .BUILD,

      COMMUNICATION_MODES
        .FLOW,

      COMMUNICATION_MODES
        .NEXT_TASK,

      COMMUNICATION_MODES
        .CREATION_HANDOFF,

      COMMUNICATION_MODES
        .REFINEMENT_HANDOFF,

      COMMUNICATION_MODES
        .PUBLISHING_HANDOFF,
    ].includes(mode)
  ) {
    guidance.push(
      "Lead with the answer, recommendation, task, action or code.",

      "Keep explanation brief unless the creator requests teaching.",

      "Do not interrupt momentum with optional philosophy.",

      "Do not end with an unnecessary question.",

      "Treat short confirmations such as 'done', 'ready' or 'next' as forward-moving when build context strongly supports that interpretation."
    );
  }

  if (
    mode ===
      COMMUNICATION_MODES
        .LEARNING
  ) {
    guidance.push(
      "Explain one concept at a time.",

      "Use a concrete example where possible.",

      "Teach enough to equip the creator, then return to application.",

      "When useful, demonstrate first and explain why afterward."
    );
  }

  if (
    mode ===
      COMMUNICATION_MODES
        .REFLECTION
  ) {
    guidance.push(
      "Use tentative, evidence-based language.",

      "Leave room for the creator to confirm, reject or refine the reflection.",

      "Allow more breathing space between ideas."
    );
  }

  if (
    mode ===
      COMMUNICATION_MODES
        .RETURNING
  ) {
    guidance.push(
      "Welcome the creator back naturally without making the absence the subject.",

      "Continue from preserved context rather than asking the creator to reconstruct everything.",

      "Acknowledge only the amount of history needed to restore orientation."
    );
  }

  if (
    mode ===
      COMMUNICATION_MODES
        .INCUBATION
  ) {
    guidance.push(
      "Do not fill the silence merely because a response could be generated.",

      "Allow the creator's thought to continue emerging.",

      "If the blueprint requests silence, silence is the complete response."
    );
  }

  if (
    humour.level !==
    HUMOUR_LEVELS.NONE
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
    context
      ?.creatorIsReturning
  ) {
    guidance.push(
      "Do not criticise the creator's absence.",

      "Do not imply that silence meant abandonment."
    );
  }

  guidance.push(
    ...createProjectContinuityGuidance({
      mode,
      adaptivePlan,
      responseBlueprint,
      context,
    }),

    ...createMemoryCaptureGuidance({
      mode,
      responseBlueprint,
    }),

    ...createForgetGuidance({
      responseBlueprint,
    }),

    ...createSessionHandoffGuidance({
      mode,
      responseBlueprint,
      context,
    }),

    ...createSpecialistMachineryGuidance({
      adaptivePlan,
      responseBlueprint,
      context,
    })
  );

  if (
    conversationPhase ===
      CONVERSATION_PHASES
        .LANDING ||
    conversationPhase ===
      CONVERSATION_PHASES
        .CLOSED
  ) {
    guidance.push(
      "Do not create conversational hooks merely to keep the exchange going."
    );
  }

  return uniqueValues(
    guidance
  );
}

function createCollaborationGuidance({
  participation,
}) {
  if (
    participation.mode ===
      PARTICIPATION_MODES
        .SOLO
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

    "Project-level facts may be shared when they genuinely belong to the shared project.",

    "Personal creator preferences must remain attached to the correct individual.",

    "Address a newly introduced participant naturally and without excessive ceremony.",

    "Protect the primary creator's ownership when one primary creator is defined.",

    "In equal collaboration, protect the collaboration rather than choosing a favourite.",

    "Do not interpret disagreement as conflict automatically.",

    "Help the group compare ideas instead of deciding whose idea wins.",

    "Allow quieter participants space without forcing them into the spotlight.",

    "Do not expose one participant's private memory to another participant without permission.",
  ];

  if (
    participation
      .requiresIntroduction
  ) {
    guidance.push(
      "Welcome the unfamiliar participant briefly.",

      "Clarify their role only when knowing the role matters to the collaboration."
    );
  }

  return guidance;
}

function createLandingGuidance({
  conversationPhase,
  landingStyle,
}) {
  if (
    landingStyle ===
      LANDING_STYLES
        .CONTINUE_FORWARD
  ) {
    return [
      "End on the next action rather than adding conversational padding.",
    ];
  }

  if (
    ![
      CONVERSATION_PHASES
        .LANDING,

      CONVERSATION_PHASES
        .CLOSED,
    ].includes(
      conversationPhase
    )
  ) {
    return [];
  }

  const guidance = [
    "Recognise that the creator is winding the conversation down.",

    "Do not introduce a major new subject.",

    "Allow the conversation to descend naturally rather than ending like a switch.",

    "Do not require the creator to announce every temporary absence.",

    "Do not make the creator feel guilty for leaving.",

    "Leave continuity open without manufacturing another question.",
  ];

  if (
    landingStyle ===
      LANDING_STYLES
        .PRESERVE_AND_LEAVE
  ) {
    guidance.push(
      "Preserve the return point, then let the creator go.",

      "Do not introduce one more task after the handoff."
    );
  }

  if (
    landingStyle ===
      LANDING_STYLES
        .CLOSE_SESSION
  ) {
    guidance.push(
      "Close warmly without demanding a reply."
    );
  }

  return guidance;
}

function createCommunicationPrinciples() {
  return {
    respondToEvidenceNotAssumptions:
      true,

    presentCreatorLeadsInterpretation:
      true,

    presentBehaviourLeadsMemory:
      true,

    blueprintControlsResponseStructure:
      true,

    communicationDoesNotOverrideBlueprint:
      true,

    readConversationTrajectory:
      true,

    educationalDoesNotMeanLong:
      true,

    protectCreatorConfidence:
      true,

    protectCreatorMomentum:
      true,

    protectCreatorComfort:
      true,

    protectCreatorThinkingTime:
      true,

    respectNaturalInterruptions:
      true,

    silenceMayBeMeaningful:
      true,

    pausesMayCarryMeaning:
      true,

    relationshipMustEarnFamiliarity:
      true,

    shorthandMustBeEarned:
      true,

    humourMustFitTheMoment:
      true,

    creatorChoiceTunesPerformance:
      true,

    textSpeechAndAvatarShareIntent:
      true,

    personalMemoryMustRemainPersonal:
      true,

    projectMemoryProtectsContinuity:
      true,

    projectTruthMayEvolve:
      true,

    creatorCorrectionsOverrideMemory:
      true,

    specialistAgentsRemainBehindMentor:
      true,

    specialistAgentsDoNotOwnTruth:
      true,

    manyIntelligencesOneRelationship:
      true,

    collaborationMustProtectParticipants:
      true,

    checkAlignmentNotOnlyUnderstanding:
      true,

    checkInsMustRespectQuestionLimits:
      true,

    avoidUnnecessaryReassurance:
      true,

    avoidArtificialEnthusiasm:
      true,

    earnTheRightToUseFewerWords:
      true,

    conversationShouldServeCreation:
      true,

    complexityBelongsBehindConversation:
      true,
  };
}

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

    "Do not ask more questions than ResponseComposer permits.",

    "Do not create a check-in when the response blueprint allows zero questions.",

    "Do not break intentional silence with filler, reassurance or a check-in.",

    "Do not interrupt build or flow mode with optional commentary.",

    "Do not use humour at the expense of the creator or another participant.",

    "Do not expose private personal memories during collaborative sessions.",

    "Do not merge two participants into one identity.",

    "Do not let global patterns override the individual creator's present behaviour.",

    "Do not claim that memory was stored unless persistence confirms success.",

    "Do not claim that memory was deleted unless persistence confirms success.",

    "Do not claim that a session handoff was persisted unless persistence confirms success.",

    "Do not recreate an explicitly deleted conclusion through immediate inference.",

    "Do not expose specialist-agent names, routing or internal disagreements in ordinary creator-facing conversation.",

    "Do not allow specialist-agent observations to silently overwrite creator-approved project truth.",

    "Do not mix project memories between different projects.",

    "Do not let speech or avatar performance alter semantic meaning.",

    "Do not apply equal emphasis to every spoken word.",

    "Do not make conversation longer merely to appear caring.",

    "Do not abruptly end a naturally landing conversation.",

    "Do not restart a conversation that the creator is trying to close.",

    "Do not use communication style to reopen a decision already made by AdaptiveMentorEngine or ResponseComposer.",
  ];
}

function createPlanSummary({
  mode,
  tone,
  pace,
  depth,
  relationshipStage,
  primaryEffect,
  participation,
  landingStyle,
  maximumQuestions,
}) {
  return (
    `Communicate in ${mode} mode with a ${tone} tone, ` +
    `${pace} pace and ${depth} depth. ` +
    `Relationship stage: ${relationshipStage}. ` +
    `Primary intended effect: ${primaryEffect}. ` +
    `Participation mode: ${participation.mode}. ` +
    `Landing style: ${landingStyle}. ` +
    `Maximum permitted questions: ${maximumQuestions}.`
  );
}

function createFallbackPlan({
  message,
  context,
  adaptivePlan,
  responseBlueprint,
  error = null,
}) {
  const maximumQuestions =
    getBlueprintMaximumQuestions(
      responseBlueprint
    );

  const shouldGenerateText =
    !blueprintRequestsSilence(
      responseBlueprint
    );

  return {
    id:
      createPlanId(),

    engine:
      "communication-voice-engine",

    version:
      COMMUNICATION_VOICE_ENGINE_VERSION,

    input: {
      message:
        cleanString(
          message
        ),
    },

    mode:
      shouldGenerateText
        ? COMMUNICATION_MODES
            .GENERAL
        : COMMUNICATION_MODES
            .INCUBATION,

    conversationPhase:
      CONVERSATION_PHASES
        .DEVELOPING,

    landingStyle:
      LANDING_STYLES.NONE,

    relationship: {
      stage:
        RELATIONSHIP_STAGES.NEW,

      familiarity:
        FAMILIARITY_LEVELS
          .POLITE,
    },

    style: {
      pace:
        shouldGenerateText
          ? COMMUNICATION_PACES
              .NATURAL
          : COMMUNICATION_PACES
              .VERY_SLOW,

      depth:
        shouldGenerateText
          ? COMMUNICATION_DEPTHS
              .CONCISE
          : COMMUNICATION_DEPTHS
              .MINIMAL,

      tone:
        COMMUNICATION_TONES
          .WARM,

      energy:
        shouldGenerateText
          ? COMMUNICATION_ENERGY
              .MATCHED
          : COMMUNICATION_ENERGY
              .VERY_LOW,

      directness:
        DIRECTNESS_LEVELS
          .BALANCED,
    },

    humour: {
      level:
        HUMOUR_LEVELS.NONE,

      mayUseCallback:
        false,

      mayUseSharedJoke:
        false,
    },

    creativeExpression: {
      analogy:
        ANALOGY_LEVELS.NONE,

      storytelling:
        STORYTELLING_LEVELS
          .NONE,
    },

    performance: {
      channel:
        COMMUNICATION_CHANNELS
          .TEXT,

      text: {
        paragraphSpacing:
          "natural",

        sentenceLength:
          "natural",
      },

      speech: {
        pauseStyle:
          shouldGenerateText
            ? PAUSE_STYLES
                .NATURAL
            : PAUSE_STYLES
                .HOLD_SPACE,

        emphasis:
          EMPHASIS_STYLES
            .NATURAL,

        avoidEqualStress:
          true,
      },

      avatar: {
        enabled: false,

        expressionIntensity:
          "natural",

        gestureDensity:
          "natural",

        guidance: [],
      },
    },

    checkIn: {
      policy:
        CHECK_IN_POLICIES.NONE,

      type: null,

      guidance: [],

      maximumQuestions,
    },

    primaryEffect:
      RESPONSE_EFFECTS
        .CLARITY,

    actions:
      shouldGenerateText
        ? [
            COMMUNICATION_ACTIONS
              .MATCH_AND_CONTINUE,

            COMMUNICATION_ACTIONS
              .OBEY_BLUEPRINT_QUESTION_LIMIT,
          ]
        : [
            COMMUNICATION_ACTIONS
              .OBEY_BLUEPRINT_SILENCE,

            COMMUNICATION_ACTIONS
              .HOLD_SPACE,
          ],

    projectContinuity: {
      activeProjectId:
        null,

      shouldRestore:
        false,

      shouldUseMemory:
        false,

      shouldPreserveHandoff:
        false,
    },

    memoryExpression: {
      shouldCapture:
        false,

      shouldRecall:
        false,

      shouldClarifyForget:
        false,

      shouldApplyForget:
        false,

      mayClaimStorage:
        false,

      mayClaimDeletion:
        false,

      mayClaimHandoff:
        false,
    },

    specialistPresentation: {
      presentAsOneMentor:
        true,

      exposeAgentNames:
        false,

      exposeRouting:
        false,
    },

    blueprintAuthority: {
      shouldGenerateText,

      maximumQuestions,

      communicationMayOverrideStructure:
        false,
    },

    textGuidance:
      shouldGenerateText
        ? [
            "Answer clearly and briefly.",

            "Do not make assumptions about the creator's internal state.",

            "Do not introduce unnecessary new directions.",

            "Do not make unverified memory claims.",

            "Do not expose internal system machinery.",

            `Do not exceed ${maximumQuestions} question${
              maximumQuestions === 1
                ? ""
                : "s"
            }.`,
          ]
        : [
            "Return intentional silence.",

            "Do not create conversational filler.",
          ],

    collaborationGuidance:
      [],

    landingGuidance:
      [],

    communicationPrinciples:
      createCommunicationPrinciples(),

    guardRails:
      createGuardRails(),

    adaptivePlanSnapshot:
      cloneValue(
        adaptivePlan
      ),

    responseBlueprintSnapshot:
      cloneValue(
        responseBlueprint
      ),

    contextSnapshot:
      cloneValue(
        context
      ),

    status:
      "fallback",

    summary:
      shouldGenerateText
        ? "Use a concise, warm and blueprint-safe communication style."
        : "Preserve intentional silence.",

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

function createMemoryAwareCommunicationContext({
  context,
  adaptivePlan,
  responseBlueprint,
}) {
  const adaptiveContext =
    getNestedValue(
      adaptivePlan,
      "contextSnapshot",
      {}
    ) || {};

  const blueprintContext =
    getNestedValue(
      responseBlueprint,
      "contextSnapshot",
      {}
    ) || {};

  const creatorMemoryContext =
    context
      ?.creatorMemoryContext ||
    adaptiveContext
      ?.creatorMemoryContext ||
    null;

  const creatorProfile =
    context
      ?.creatorProfile ||
    adaptiveContext
      ?.creatorProfile ||
    creatorMemoryContext
      ?.creatorProfile ||
    null;

  const rememberedSharedMeanings =
    asArray(
      creatorMemoryContext
        ?.sharedMeanings
    );

  const rememberedSharedRituals =
    asArray(
      creatorMemoryContext
        ?.sharedRituals
    );

  const rememberedSharedJokes =
    asArray(
      creatorMemoryContext
        ?.sharedJokes
    );

  const rememberedVocabulary =
    asArray(
      creatorMemoryContext
        ?.establishedVocabulary
    );

  return {
    ...cloneValue(
      DEFAULT_COMMUNICATION_CONTEXT
    ),

    ...cloneValue(
      adaptiveContext
    ),

    ...cloneValue(
      blueprintContext
    ),

    ...cloneValue(
      context
    ),

    creatorProfile,

    creatorMemoryContext,

    establishedVocabulary:
      asArray(
        context
          ?.establishedVocabulary
      ).length > 0
        ? cloneValue(
            context
              .establishedVocabulary
          )
        : cloneValue(
            rememberedVocabulary
          ),

    sharedMeanings:
      asArray(
        context
          ?.sharedMeanings
      ).length > 0
        ? cloneValue(
            context
              .sharedMeanings
          )
        : cloneValue(
            rememberedSharedMeanings
          ),

    sharedRituals:
      asArray(
        context
          ?.sharedRituals
      ).length > 0
        ? cloneValue(
            context
              .sharedRituals
          )
        : cloneValue(
            rememberedSharedRituals
          ),

    sharedJokes:
      asArray(
        context
          ?.sharedJokes
      ).length > 0
        ? cloneValue(
            context
              .sharedJokes
          )
        : cloneValue(
            rememberedSharedJokes
          ),

    interactionCount:
      Number(
        context
          ?.interactionCount ??
        adaptiveContext
          ?.interactionCount ??
        creatorMemoryContext
          ?.interactionCount ??
        creatorMemoryContext
          ?.conversationCount ??
        0
      ),

    knownDurationDays:
      Number(
        context
          ?.knownDurationDays ??
        adaptiveContext
          ?.knownDurationDays ??
        creatorMemoryContext
          ?.knownDurationDays ??
        0
      ),

    relationshipStage:
      context
        ?.relationshipStage ||
      adaptiveContext
        ?.relationshipStage ||
      creatorMemoryContext
        ?.relationshipStage ||
      null,

    projectType:
      context
        ?.projectType ||
      blueprintContext
        ?.projectType ||
      adaptiveContext
        ?.projectType ||
      null,

    activeProject:
      context
        ?.activeProject ||
      getNestedValue(
        responseBlueprint,
        "project.activeProject",
        null
      ) ||
      adaptiveContext
        ?.activeProject ||
      null,

    activeProjectId:
      context
        ?.activeProjectId ||
      getNestedValue(
        responseBlueprint,
        "project.activeProjectId",
        null
      ) ||
      getNestedValue(
        adaptivePlan,
        "execution.activeProjectId",
        null
      ) ||
      null,

    activeIdea:
      context
        ?.activeIdea ||
      adaptiveContext
        ?.activeIdea ||
      null,

    activeStage:
      context
        ?.activeStage ||
      getNestedValue(
        responseBlueprint,
        "project.activeStage",
        null
      ) ||
      getNestedValue(
        adaptivePlan,
        "projectState.activeStage",
        null
      ) ||
      null,

    activeScene:
      context
        ?.activeScene ||
      getNestedValue(
        responseBlueprint,
        "project.activeScene",
        null
      ) ||
      getNestedValue(
        adaptivePlan,
        "projectState.activeScene",
        null
      ) ||
      null,

    activeCharacter:
      context
        ?.activeCharacter ||
      getNestedValue(
        responseBlueprint,
        "project.activeCharacter",
        null
      ) ||
      getNestedValue(
        adaptivePlan,
        "projectState.activeCharacter",
        null
      ) ||
      null,

    sessionId:
      context
        ?.sessionId ||
      adaptiveContext
        ?.sessionId ||
      null,

    currentTimestamp:
      context
        ?.currentTimestamp ||
      createTimestamp(),
  };
}

function createCommunicationVoiceEngine({
  defaultVoiceProfile = null,
} = {}) {
  let activeDefaultVoiceProfile = {
    ...cloneValue(
      DEFAULT_VOICE_PROFILE
    ),

    ...cloneValue(
      defaultVoiceProfile ||
      {}
    ),
  };

  function planCommunication({
    message = "",
    context = {},
    adaptivePlan = null,
    responseBlueprint = null,
    voiceProfile = null,
  } = {}) {
    try {
      if (
        !adaptivePlan ||
        typeof adaptivePlan !==
          "object"
      ) {
        throw new TypeError(
          "CommunicationVoiceEngine requires a valid adaptivePlan."
        );
      }

      if (
        !responseBlueprint ||
        typeof responseBlueprint !==
          "object"
      ) {
        throw new TypeError(
          "CommunicationVoiceEngine requires a valid responseBlueprint."
        );
      }

      const combinedContext =
        createMemoryAwareCommunicationContext({
          context,
          adaptivePlan,
          responseBlueprint,
        });

      combinedContext.message =
        cleanString(
          message
        );

      const activeVoiceProfile = {
        ...cloneValue(
          activeDefaultVoiceProfile
        ),

        ...cloneValue(
          combinedContext
            .preferredVoiceProfile ||
          {}
        ),

        ...cloneValue(
          voiceProfile ||
          {}
        ),
      };

      const relationshipStage =
        resolveRelationshipStage(
          combinedContext
        );

      const familiarity =
        resolveFamiliarityLevel({
          relationshipStage,

          context:
            combinedContext,
        });

      const mode =
        resolveCommunicationMode({
          adaptivePlan,
          responseBlueprint,

          context:
            combinedContext,
        });

      const conversationPhase =
        resolveConversationPhase({
          message,
          adaptivePlan,
          responseBlueprint,

          context:
            combinedContext,
        });

      const shortReply =
        interpretShortReply({
          message,

          context:
            combinedContext,

          adaptivePlan,

          responseBlueprint,
        });

      const uncertainty =
        detectCreatorUncertainty({
          message,

          context:
            combinedContext,
        });

      const questionPattern =
        analyseQuestionPattern({
          message,

          context:
            combinedContext,
        });

      const participation =
        resolveParticipation({
          context:
            combinedContext,
        });

      const channel =
        resolveCommunicationChannel({
          context:
            combinedContext,
        });

      const pace =
        resolveCommunicationPace({
          mode,
          adaptivePlan,
          responseBlueprint,

          context:
            combinedContext,

          uncertainty,
        });

      const depth =
        resolveCommunicationDepth({
          mode,
          adaptivePlan,
          responseBlueprint,

          context:
            combinedContext,

          questionPattern,
        });

      const tone =
        resolveCommunicationTone({
          mode,
          uncertainty,

          context:
            combinedContext,

          responseBlueprint,
        });

      const directness =
        resolveDirectness({
          mode,
          adaptivePlan,
          responseBlueprint,
          uncertainty,
        });

      const energy =
        resolveCommunicationEnergy({
          mode,

          context:
            combinedContext,

          responseBlueprint,
        });

      const humour =
        resolveHumourPolicy({
          relationshipStage,
          familiarity,
          mode,

          context:
            combinedContext,

          uncertainty,
        });

      const creativeExpression =
        resolveCreativeExpression({
          mode,

          context:
            combinedContext,

          relationshipStage,
        });

      const performance =
        resolvePerformance({
          mode,
          channel,
          uncertainty,
          conversationPhase,
          responseBlueprint,
        });

      const checkIn =
        resolveCheckInPolicy({
          shortReply,
          uncertainty,
          questionPattern,
          conversationPhase,
          mode,

          context:
            combinedContext,

          responseBlueprint,
        });

      const primaryEffect =
        resolvePrimaryResponseEffect({
          mode,
          uncertainty,
          adaptivePlan,
        });

      const landingStyle =
        resolveLandingStyle({
          mode,
          conversationPhase,
          responseBlueprint,
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
          checkIn,

          context:
            combinedContext,

          adaptivePlan,
          responseBlueprint,
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
          conversationPhase,
          adaptivePlan,
          responseBlueprint,

          context:
            combinedContext,
        });

      const collaborationGuidance =
        createCollaborationGuidance({
          participation,
        });

      const landingGuidance =
        createLandingGuidance({
          conversationPhase,
          landingStyle,
        });

      const activeProjectId =
        getProjectId({
          adaptivePlan,
          responseBlueprint,

          context:
            combinedContext,
        });

      const maximumQuestions =
        getBlueprintMaximumQuestions(
          responseBlueprint
        );

      const shouldGenerateText =
        !blueprintRequestsSilence(
          responseBlueprint
        );

      return {
        id:
          createPlanId(),

        engine:
          "communication-voice-engine",

        version:
          COMMUNICATION_VOICE_ENGINE_VERSION,

        input: {
          message:
            cleanString(
              message
            ),
        },

        mode,
        conversationPhase,
        landingStyle,

        relationship: {
          stage:
            relationshipStage,

          familiarity,

          sharedLanguageAvailable:
            asArray(
              combinedContext
                .sharedMeanings
            ).length > 0,

          sharedRitualsAvailable:
            asArray(
              combinedContext
                .sharedRituals
            ).length > 0,

          sharedJokesAvailable:
            asArray(
              combinedContext
                .sharedJokes
            ).length > 0,

          relationshipContextFromMemory:
            Boolean(
              combinedContext
                .creatorMemoryContext
            ),
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
          cloneValue(
            activeVoiceProfile
          ),

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

          maximumQuestions,

          guidance:
            createCheckInGuidance(
              checkIn
            ),
        },

        primaryEffect,

        actions,

        blueprintAuthority: {
          shouldGenerateText,

          maximumQuestions,

          allowsQuestions:
            maximumQuestions > 0,

          sectionOrder:
            asArray(
              responseBlueprint
                ?.sections
            ).map(
              (section) =>
                section?.type
            ).filter(Boolean),

          communicationMayOverrideStructure:
            false,

          communicationMayAddSections:
            false,

          communicationMayBreakSilence:
            false,

          communicationMayIncreaseQuestionCount:
            false,
        },

        projectContinuity: {
          activeProjectId,

          activeProject:
            cloneValue(
              combinedContext
                .activeProject
            ),

          activeStage:
            cloneValue(
              combinedContext
                .activeStage
            ),

          activeScene:
            cloneValue(
              combinedContext
                .activeScene
            ),

          activeCharacter:
            cloneValue(
              combinedContext
                .activeCharacter
            ),

          shouldRestore:
            blueprintRestoresProjectContext(
              responseBlueprint
            ),

          shouldUseMemory:
            blueprintUsesMemory(
              responseBlueprint
            ),

          shouldPreserveHandoff:
            blueprintPreservesSessionHandoff(
              responseBlueprint
            ),

          returnPoint:
            combinedContext
              .returnPoint ||
            null,
        },

        memoryExpression: {
          policy:
            getNestedValue(
              responseBlueprint,
              "memory.policy",
              getNestedValue(
                adaptivePlan,
                "behaviour.memoryPolicy",
                "inform-silently"
              )
            ),

          shouldCapture:
            blueprintCapturesMemory(
              responseBlueprint
            ),

          shouldRecall:
            blueprintUsesMemory(
              responseBlueprint
            ),

          shouldClarifyForget:
            blueprintClarifiesForget(
              responseBlueprint
            ),

          shouldApplyForget:
            blueprintAppliesForget(
              responseBlueprint
            ),

          /**
           * Persistence truth is injected later by
           * ResponseGenerator after memory execution.
           *
           * CommunicationVoiceEngine must never infer it.
           */
          mayClaimStorage:
            false,

          mayClaimDeletion:
            false,

          mayClaimHandoff:
            false,

          expressionRule:
            "Use remembered information naturally when useful; do not announce the memory system merely to prove recall.",
        },

        specialistPresentation: {
          specialistSignalsPresent:
            hasSpecialistMachinery({
              adaptivePlan,
              responseBlueprint,

              context:
                combinedContext,
            }),

          presentAsOneMentor:
            true,

          exposeAgentNames:
            false,

          exposeRouting:
            false,

          exposeInternalDisagreement:
            false,

          creatorCorrectionsOverrideAgentAssumptions:
            true,
        },

        upstreamAgreement: {
          adaptiveAction:
            getAdaptiveAction(
              adaptivePlan
            ),

          composerAction:
            getComposerAction(
              responseBlueprint
            ),

          conversationPlannerMode:
            getConversationPlannerMode(
              adaptivePlan
            ),

          conversationPlannerMove:
            getConversationPlannerMove(
              adaptivePlan
            ),

          obeyAdaptiveBehaviour:
            true,

          obeyResponseBlueprint:
            true,

          preserveMemoryTruth:
            true,

          preserveCreatorDirection:
            true,
        },

        textGuidance,

        collaborationGuidance,

        landingGuidance,

        outputAgreement: {
          canonicalContent:
            COMMUNICATION_CHANNELS
              .TEXT,

          textSpeechAndAvatarShareMeaning:
            true,

          speechPerformsCommunicationPlan:
            true,

          avatarPerformsCommunicationPlan:
            true,

          textMustReadLikeTheSpokenMentor:
            true,

          manyInternalCapabilitiesOneMentorVoice:
            true,

          creatorMayChooseVoice:
            true,

          creatorMayChooseLanguage:
            true,

          creatorMayTunePerformance:
            true,

          tuningMustNotChangePrinciples:
            true,

          performanceMustNotChangeMeaning:
            true,

          performanceMustNotAddContent:
            true,

          performanceMustNotCreateQuestions:
            true,
        },

        communicationPrinciples:
          createCommunicationPrinciples(),

        guardRails:
          createGuardRails(),

        adaptivePlanSnapshot:
          cloneValue(
            adaptivePlan
          ),

        responseBlueprintSnapshot:
          cloneValue(
            responseBlueprint
          ),

        contextSnapshot:
          cloneValue(
            combinedContext
          ),

        summary:
          createPlanSummary({
            mode,
            tone,
            pace,
            depth,
            relationshipStage,
            primaryEffect,
            participation,
            landingStyle,
            maximumQuestions,
          }),

        status:
          "planned",

        createdAt:
          createTimestamp(),
      };
    } catch (error) {
      console.error(
        "CommunicationVoiceEngine planning error:",
        error
      );

      return (
        createFallbackPlan({
          message,
          context,
          adaptivePlan,
          responseBlueprint,
          error,
        })
      );
    }
  }

  function applyToProviderRequest({
    providerRequest,
    communicationPlan,
  } = {}) {
    if (
      !providerRequest ||
      typeof providerRequest !==
        "object"
    ) {
      throw new TypeError(
        "A valid providerRequest is required."
      );
    }

    if (
      !communicationPlan ||
      typeof communicationPlan !==
        "object"
    ) {
      throw new TypeError(
        "A valid communicationPlan is required."
      );
    }

    const blueprintMaximumQuestions =
      Number(
        providerRequest
          ?.constraints
          ?.maximumQuestions ??
        communicationPlan
          ?.blueprintAuthority
          ?.maximumQuestions ??
        0
      );

    const maximumQuestions =
      Number.isFinite(
        blueprintMaximumQuestions
      )
        ? Math.max(
            0,
            Math.floor(
              blueprintMaximumQuestions
            )
          )
        : 0;

    const shouldGenerateText =
      providerRequest
        ?.constraints
        ?.shouldGenerateText !==
        false &&
      communicationPlan
        ?.blueprintAuthority
        ?.shouldGenerateText !==
        false;

    return {
      ...cloneValue(
        providerRequest
      ),

      communicationVoice:
        cloneValue({
          mode:
            communicationPlan.mode,

          conversationPhase:
            communicationPlan
              .conversationPhase,

          landingStyle:
            communicationPlan
              .landingStyle,

          relationship:
            communicationPlan
              .relationship,

          interpretation:
            communicationPlan
              .interpretation,

          participation:
            communicationPlan
              .participation,

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

          blueprintAuthority:
            communicationPlan
              .blueprintAuthority,

          projectContinuity:
            communicationPlan
              .projectContinuity,

          memoryExpression:
            communicationPlan
              .memoryExpression,

          specialistPresentation:
            communicationPlan
              .specialistPresentation,

          upstreamAgreement:
            communicationPlan
              .upstreamAgreement,

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
          providerRequest
            .constraints ||
          {}
        ),

        maximumQuestions,

        shouldGenerateText,

        respondToEvidenceNotAssumptions:
          true,

        avoidUnrequestedReassurance:
          true,

        preserveParticipantIdentity:
          true,

        preserveProjectScope:
          true,

        preserveTextSpeechAvatarMeaning:
          true,

        doNotManufactureFamiliarity:
          true,

        doNotOverExplain:
          true,

        hideSpecialistMachinery:
          true,

        doNotExposeAgentNames:
          true,

        creatorCorrectionsOverrideAgentAssumptions:
          true,

        doNotClaimMemoryPersistenceWithoutConfirmation:
          true,

        doNotClaimMemoryDeletionWithoutConfirmation:
          true,

        doNotClaimSessionHandoffWithoutConfirmation:
          true,

        communicationCannotOverrideBlueprint:
          true,

        communicationCannotAddSections:
          true,

        communicationCannotIncreaseQuestionCount:
          true,

        communicationCannotBreakSilence:
          true,
      },
    };
  }

  function setDefaultVoiceProfile(
    nextProfile = {}
  ) {
    activeDefaultVoiceProfile = {
      ...cloneValue(
        DEFAULT_VOICE_PROFILE
      ),

      ...cloneValue(
        nextProfile
      ),
    };

    return cloneValue(
      activeDefaultVoiceProfile
    );
  }

  function getDefaultVoiceProfile() {
    return cloneValue(
      activeDefaultVoiceProfile
    );
  }

  function mayUseSharedShorthand(
    plan
  ) {
    return Boolean(
      plan
        ?.relationship
        ?.familiarity ===
        FAMILIARITY_LEVELS
          .SHARED_SHORTHAND &&
      plan
        ?.actions
        ?.includes?.(
          COMMUNICATION_ACTIONS
            .USE_SHARED_SHORTHAND
        )
    );
  }

  function shouldCheckIn(
    plan
  ) {
    return Boolean(
      plan
        ?.blueprintAuthority
        ?.allowsQuestions &&
      [
        CHECK_IN_POLICIES
          .RECOMMENDED,

        CHECK_IN_POLICIES
          .REQUIRED_BEFORE_PROGRESSING,
      ].includes(
        plan
          ?.checkIn
          ?.policy
      )
    );
  }

  function isConversationLanding(
    plan
  ) {
    return Boolean(
      [
        CONVERSATION_PHASES
          .LANDING,

        CONVERSATION_PHASES
          .CLOSED,
      ].includes(
        plan
          ?.conversationPhase
      )
    );
  }

  function isCollaborative(
    plan
  ) {
    return Boolean(
      plan
        ?.participation
        ?.mode &&
      plan
        .participation
        .mode !==
        PARTICIPATION_MODES
          .SOLO
    );
  }

  function shouldRestoreProjectContext(
    plan
  ) {
    return Boolean(
      plan
        ?.projectContinuity
        ?.shouldRestore
    );
  }

  function shouldPreserveSessionHandoff(
    plan
  ) {
    return Boolean(
      plan
        ?.projectContinuity
        ?.shouldPreserveHandoff
    );
  }

  function shouldClarifyForget(
    plan
  ) {
    return Boolean(
      plan
        ?.memoryExpression
        ?.shouldClarifyForget
    );
  }

  function shouldApplyForget(
    plan
  ) {
    return Boolean(
      plan
        ?.memoryExpression
        ?.shouldApplyForget
    );
  }

  function shouldHideSpecialistMachinery(
    plan
  ) {
    return Boolean(
      plan
        ?.specialistPresentation
        ?.presentAsOneMentor
    );
  }

  function shouldRemainSilent(
    plan
  ) {
    return Boolean(
      plan
        ?.blueprintAuthority
        ?.shouldGenerateText ===
        false ||
      plan
        ?.actions
        ?.includes?.(
          COMMUNICATION_ACTIONS
            .OBEY_BLUEPRINT_SILENCE
        )
    );
  }

  function getMaximumQuestions(
    plan
  ) {
    const value =
      Number(
        plan
          ?.blueprintAuthority
          ?.maximumQuestions
      );

    return Number.isFinite(
      value
    )
      ? Math.max(
          0,
          Math.floor(value)
        )
      : 0;
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

    shouldRestoreProjectContext,
    shouldPreserveSessionHandoff,
    shouldClarifyForget,
    shouldApplyForget,
    shouldHideSpecialistMachinery,

    shouldRemainSilent,
    getMaximumQuestions,
  };
}

function planCommunication({
  message = "",
  context = {},
  adaptivePlan = null,
  responseBlueprint = null,
  voiceProfile = null,
} = {}) {
  const engine =
    createCommunicationVoiceEngine();

  return (
    engine.planCommunication({
      message,
      context,
      adaptivePlan,
      responseBlueprint,
      voiceProfile,
    })
  );
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
  LANDING_STYLES,

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
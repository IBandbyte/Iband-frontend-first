/**
 * Response Composer
 * ------------------------------------------------------------
 * The response-blueprint layer for iBand's AI Mentor —
 * The Creator.
 *
 * This module does not generate the final Mentor wording.
 *
 * It receives an AdaptiveMentorEngine plan and converts it into
 * an ordered, validated response blueprint that a future response
 * generator or language model can execute.
 *
 * Responsibilities:
 * - Choose which response sections are required.
 * - Put those sections in the correct order.
 * - Control response length, rhythm, warmth and directness.
 * - Translate adaptive and progression actions into compositional instructions.
 * - Respect silence, flow, information saturation and question limits.
 * - Express creator and project memory naturally.
 * - Restore project context without dumping project history.
 * - Preserve session handoffs without introducing new work.
 * - Handle forget requests safely and minimally.
 * - Prevent persistence intentions from becoming false persistence claims.
 * - Hide specialist-agent machinery behind one Mentor relationship.
 * - Validate the final blueprint before response generation.
 * - Preserve creator ownership and autonomy.
 *
 * Core principles:
 * - Intelligence and expression are separate systems.
 * - Demonstrate understanding before introducing direction.
 * - Conversation exists in service of creation.
 * - Say only what is useful now.
 * - Never make the creator repeat what has already been understood.
 * - Memory recall is an invitation, not an interruption.
 * - Project memory exists to protect continuity, not to display recall.
 * - Specialist agents contribute intelligence, not additional voices.
 * - Complexity belongs behind the conversation.
 * - Silence is a valid response and must win when required.
 * - Persistence intent is not persistence success.
 * - The response must leave the creator clearer, stronger or moving.
 */

const RESPONSE_COMPOSER_VERSION = "2.1.0";

const RESPONSE_SECTIONS = Object.freeze({
  OPENING: "opening",
  ACKNOWLEDGEMENT: "acknowledgement",
  UNDERSTANDING: "understanding",
  REFLECTION: "reflection",
  REASSURANCE: "reassurance",

  MEMORY_CAPTURE: "memory-capture",
  MEMORY_RECALL: "memory-recall",
  MEMORY_FORGET: "memory-forget",
  MEMORY_FORGET_CLARIFICATION:
    "memory-forget-clarification",

  CONTEXT_RESTORATION:
    "context-restoration",

  PROJECT_CONTEXT:
    "project-context",

  SESSION_HANDOFF:
    "session-handoff",

  TEACHING: "teaching",
  RECOMMENDATION: "recommendation",
  CREATIVE_DIRECTION:
    "creative-direction",
  NEXT_STEP: "next-step",
  QUESTION: "question",
  PAUSE: "pause",
  SESSION_RECAP: "session-recap",
  OPEN_DOOR: "open-door",
  CLOSING: "closing",
});

const SECTION_PURPOSES = Object.freeze({
  CONNECT: "connect",
  PROVE_LISTENING: "prove-listening",
  PROTECT_CONFIDENCE:
    "protect-confidence",
  REDUCE_PRESSURE: "reduce-pressure",
  RESTORE_CONTEXT: "restore-context",
  PRESERVE_CONTINUITY:
    "preserve-continuity",
  INFORM: "inform",
  GUIDE: "guide",
  MOVE: "move",
  CAPTURE: "capture",
  RECALL: "recall",
  FORGET: "forget",
  CLARIFY: "clarify",
  HANDOFF: "handoff",
  INVITE: "invite",
  CLOSE: "close",
});

const RESPONSE_RHYTHMS = Object.freeze({
  SILENT: "silent",
  CRISP: "crisp",
  FAST: "fast",
  STEADY: "steady",
  REFLECTIVE: "reflective",
  GENTLE: "gentle",
  ENERGETIC: "energetic",
  CINEMATIC: "cinematic",
});

const RESPONSE_WARMTH = Object.freeze({
  NEUTRAL: "neutral",
  LIGHT: "light",
  WARM: "warm",
  DEEPLY_WARM: "deeply-warm",
});

const RESPONSE_DIRECTNESS =
  Object.freeze({
    VERY_DIRECT: "very-direct",
    DIRECT: "direct",
    BALANCED: "balanced",
    GENTLE: "gentle",
    INDIRECT: "indirect",
  });

const RESPONSE_ENERGY =
  Object.freeze({
    QUIET: "quiet",
    LOW: "low",
    MATCHED: "matched",
    LIFTING: "lifting",
    HIGH: "high",
  });

const BLUEPRINT_LENGTHS =
  Object.freeze({
    SILENT: "silent",
    ONE_LINE: "one-line",
    SHORT: "short",
    MEDIUM: "medium",
    DETAILED: "detailed",
  });

const SECTION_LENGTHS =
  Object.freeze({
    NONE: "none",
    PHRASE: "phrase",
    ONE_SENTENCE: "one-sentence",
    TWO_SENTENCES: "two-sentences",
    SHORT_PARAGRAPH:
      "short-paragraph",
    MEDIUM_PARAGRAPH:
      "medium-paragraph",
  });

const TRANSITION_STYLES =
  Object.freeze({
    NONE: "none",
    IMMEDIATE: "immediate",
    NATURAL: "natural",
    GENTLE: "gentle",
    ENERGETIC: "energetic",
    REFLECTIVE: "reflective",
  });

const COMPOSER_ACTIONS =
  Object.freeze({
    RETURN_SILENCE:
      "return-silence",

    COMPOSE_ACKNOWLEDGEMENT:
      "compose-acknowledgement",

    COMPOSE_REFLECTION:
      "compose-reflection",

    COMPOSE_PRESSURE_RELEASE:
      "compose-pressure-release",

    COMPOSE_CONTEXT_RESTORATION:
      "compose-context-restoration",

    COMPOSE_PROJECT_CONTEXT_RESTORATION:
      "compose-project-context-restoration",

    COMPOSE_CAPTURE_AND_CONTINUE:
      "compose-capture-and-continue",

    COMPOSE_MEMORY_RECALL:
      "compose-memory-recall",

    COMPOSE_FORGET_CLARIFICATION:
      "compose-forget-clarification",

    COMPOSE_FORGET_CONFIRMATION:
      "compose-forget-confirmation",

    COMPOSE_ONE_RECOMMENDATION:
      "compose-one-recommendation",

    COMPOSE_ONE_CONCEPT:
      "compose-one-concept",

    COMPOSE_BRAINSTORMING_TURN:
      "compose-brainstorming-turn",

    COMPOSE_CREATION_HANDOFF:
      "compose-creation-handoff",

    COMPOSE_NEXT_TASK:
      "compose-next-task",

    COMPOSE_REFINEMENT_HANDOFF:
      "compose-refinement-handoff",

    COMPOSE_PUBLISHING_HANDOFF:
      "compose-publishing-handoff",

    COMPOSE_SESSION_HANDOFF:
      "compose-session-handoff",

    COMPOSE_SESSION_PAUSE:
      "compose-session-pause",

    COMPOSE_SESSION_CLOSE:
      "compose-session-close",
  });

const DEFAULT_COMPOSER_CONTEXT =
  Object.freeze({
    creatorName: null,
    creatorId: null,
    creatorType: null,

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

    useCreatorName: false,
    humourAllowed: true,
    emojisAllowed: true,

    establishedVocabulary: [],
    sharedMeanings: [],
    sharedRituals: [],

    currentTimestamp: null,
  });

function createTimestamp() {
  return new Date().toISOString();
}

function createBlueprintId() {
  const randomValue = Math.random()
    .toString(36)
    .slice(2, 10);

  return (
    `response-blueprint-` +
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

function asArray(value) {
  return Array.isArray(value)
    ? value
    : [];
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

function includesValue(
  value,
  values = []
) {
  return values.includes(value);
}

function getProjectId(
  adaptivePlan,
  context
) {
  const contextProjectId =
    cleanString(
      context?.activeProjectId
    );

  if (contextProjectId) {
    return contextProjectId;
  }

  const adaptiveProjectId =
    cleanString(
      getNestedValue(
        adaptivePlan,
        "execution.activeProjectId",
        ""
      )
    );

  if (adaptiveProjectId) {
    return adaptiveProjectId;
  }

  return (
    cleanString(
      getNestedValue(
        adaptivePlan,
        "projectState.activeProjectId",
        ""
      )
    ) ||
    null
  );
}

function getProgressionDecision(
  adaptivePlan
) {
  return (
    cleanString(
      getNestedValue(
        adaptivePlan,
        "progressionPlan.decision",
        ""
      )
    ) ||
    cleanString(
      getNestedValue(
        adaptivePlan,
        "specialistPlans.progression.decision",
        ""
      )
    ) ||
    cleanString(
      getNestedValue(
        adaptivePlan,
        "progression.decision",
        ""
      )
    ) ||
    cleanString(
      getNestedValue(
        adaptivePlan,
        "progressionDecision",
        ""
      )
    ) ||
    null
  );
}

function getProgressionPrimaryAction(
  adaptivePlan
) {
  return (
    cleanString(
      getNestedValue(
        adaptivePlan,
        "progressionPlan.progression.primaryAction",
        ""
      )
    ) ||
    cleanString(
      getNestedValue(
        adaptivePlan,
        "specialistPlans.progression.progression.primaryAction",
        ""
      )
    ) ||
    cleanString(
      getNestedValue(
        adaptivePlan,
        "progression.primaryAction",
        ""
      )
    ) ||
    null
  );
}

function progressionRequiresSilence(
  adaptivePlan
) {
  const decision =
    getProgressionDecision(
      adaptivePlan
    );

  const action =
    getProgressionPrimaryAction(
      adaptivePlan
    );

  const shouldHoldSpace =
    Boolean(
      getNestedValue(
        adaptivePlan,
        "progressionPlan.progression.shouldHoldSpace",
        false
      )
    ) ||
    Boolean(
      getNestedValue(
        adaptivePlan,
        "specialistPlans.progression.progression.shouldHoldSpace",
        false
      )
    ) ||
    Boolean(
      getNestedValue(
        adaptivePlan,
        "progression.shouldHoldSpace",
        false
      )
    );

  return Boolean(
    shouldHoldSpace ||
    includesValue(
      decision,
      [
        "hold-space",
        "wait-for-creator",
      ]
    ) ||
    action ===
      "wait-without-new-direction"
  );
}

function adaptivePlanRequiresSilence(
  adaptivePlan
) {
  const adaptiveAction =
    cleanString(
      getNestedValue(
        adaptivePlan,
        "primaryAction.action",
        ""
      )
    );

  const responseDepth =
    cleanString(
      getNestedValue(
        adaptivePlan,
        "behaviour.responseDepth",
        ""
      )
    );

  const shouldGenerateText =
    getNestedValue(
      adaptivePlan,
      "execution.shouldGenerateText",
      null
    );

  return Boolean(
    adaptiveAction === "wait" ||
    responseDepth === "silent" ||
    shouldGenerateText === false ||
    progressionRequiresSilence(
      adaptivePlan
    )
  );
}

function createSection({
  type,
  purpose,
  required = true,
  length =
    SECTION_LENGTHS.ONE_SENTENCE,
  transition =
    TRANSITION_STYLES.NATURAL,
  instructions = [],
  sourceData = null,
  optional = false,
}) {
  return {
    id:
      `${type}-${Math.random()
        .toString(36)
        .slice(2, 8)}`,

    type,
    purpose,
    required,
    optional,
    length,
    transition,

    instructions:
      uniqueValues(
        instructions
      ),

    sourceData:
      cloneValue(
        sourceData
      ),
  };
}

function resolveBlueprintLength(
  adaptivePlan,
  action
) {
  if (
    action ===
      COMPOSER_ACTIONS
        .RETURN_SILENCE ||
    adaptivePlanRequiresSilence(
      adaptivePlan
    )
  ) {
    return (
      BLUEPRINT_LENGTHS.SILENT
    );
  }

  const adaptiveDepth =
    getNestedValue(
      adaptivePlan,
      "behaviour.responseDepth",
      "short"
    );

  switch (adaptiveDepth) {
    case "silent":
      return (
        BLUEPRINT_LENGTHS.SILENT
      );

    case "one-line":
      return (
        BLUEPRINT_LENGTHS.ONE_LINE
      );

    case "medium":
      return (
        BLUEPRINT_LENGTHS.MEDIUM
      );

    case "detailed":
      return (
        BLUEPRINT_LENGTHS.DETAILED
      );

    case "short":
    default:
      return (
        BLUEPRINT_LENGTHS.SHORT
      );
  }
}

function chooseResponseRhythm({
  adaptivePlan,
  action,
}) {
  const signals =
    asArray(
      adaptivePlan?.signals
    );

  if (
    action ===
      COMPOSER_ACTIONS
        .RETURN_SILENCE ||
    adaptivePlanRequiresSilence(
      adaptivePlan
    )
  ) {
    return RESPONSE_RHYTHMS.SILENT;
  }

  if (
    action ===
      COMPOSER_ACTIONS
        .COMPOSE_FORGET_CLARIFICATION ||
    action ===
      COMPOSER_ACTIONS
        .COMPOSE_FORGET_CONFIRMATION
  ) {
    return RESPONSE_RHYTHMS.CRISP;
  }

  if (
    signals.includes(
      "build-mode"
    ) ||
    action ===
      COMPOSER_ACTIONS
        .COMPOSE_NEXT_TASK
  ) {
    return RESPONSE_RHYTHMS.FAST;
  }

  if (
    signals.includes(
      "flow-mode"
    ) ||
    signals.includes(
      "high-momentum"
    )
  ) {
    return RESPONSE_RHYTHMS.CRISP;
  }

  if (
    signals.includes(
      "reflection-mode"
    ) ||
    action ===
      COMPOSER_ACTIONS
        .COMPOSE_REFLECTION
  ) {
    return (
      RESPONSE_RHYTHMS.REFLECTIVE
    );
  }

  if (
    signals.includes(
      "recovery-mode"
    ) ||
    action ===
      COMPOSER_ACTIONS
        .COMPOSE_PRESSURE_RELEASE
  ) {
    return RESPONSE_RHYTHMS.GENTLE;
  }

  if (
    action ===
      COMPOSER_ACTIONS
        .COMPOSE_SESSION_HANDOFF ||
    action ===
      COMPOSER_ACTIONS
        .COMPOSE_SESSION_PAUSE
  ) {
    return RESPONSE_RHYTHMS.GENTLE;
  }

  if (
    signals.includes(
      "exploration-mode"
    )
  ) {
    return RESPONSE_RHYTHMS.STEADY;
  }

  if (
    getNestedValue(
      adaptivePlan,
      "behaviour.role",
      null
    ) === "creative-director"
  ) {
    return (
      RESPONSE_RHYTHMS.ENERGETIC
    );
  }

  return RESPONSE_RHYTHMS.STEADY;
}

function chooseResponseWarmth({
  adaptivePlan,
  action,
}) {
  const role =
    getNestedValue(
      adaptivePlan,
      "behaviour.role",
      "listener"
    );

  if (
    includesValue(
      action,
      [
        COMPOSER_ACTIONS
          .COMPOSE_REFLECTION,

        COMPOSER_ACTIONS
          .COMPOSE_PRESSURE_RELEASE,

        COMPOSER_ACTIONS
          .COMPOSE_CONTEXT_RESTORATION,

        COMPOSER_ACTIONS
          .COMPOSE_PROJECT_CONTEXT_RESTORATION,

        COMPOSER_ACTIONS
          .COMPOSE_SESSION_HANDOFF,

        COMPOSER_ACTIONS
          .COMPOSE_SESSION_PAUSE,

        COMPOSER_ACTIONS
          .COMPOSE_SESSION_CLOSE,
      ]
    )
  ) {
    return (
      RESPONSE_WARMTH.DEEPLY_WARM
    );
  }

  if (
    includesValue(
      action,
      [
        COMPOSER_ACTIONS
          .COMPOSE_FORGET_CLARIFICATION,

        COMPOSER_ACTIONS
          .COMPOSE_FORGET_CONFIRMATION,
      ]
    )
  ) {
    return RESPONSE_WARMTH.WARM;
  }

  if (
    includesValue(
      role,
      [
        "listener",
        "reflector",
        "quiet-companion",
        "collaborator",
      ]
    )
  ) {
    return RESPONSE_WARMTH.WARM;
  }

  if (
    role ===
      "creative-director"
  ) {
    return RESPONSE_WARMTH.LIGHT;
  }

  return RESPONSE_WARMTH.WARM;
}

function chooseResponseDirectness({
  adaptivePlan,
  action,
}) {
  const stance =
    getNestedValue(
      adaptivePlan,
      "behaviour.leadershipStance",
      "walk-beside"
    );

  if (
    includesValue(
      action,
      [
        COMPOSER_ACTIONS
          .COMPOSE_NEXT_TASK,

        COMPOSER_ACTIONS
          .COMPOSE_CREATION_HANDOFF,

        COMPOSER_ACTIONS
          .COMPOSE_REFINEMENT_HANDOFF,

        COMPOSER_ACTIONS
          .COMPOSE_PUBLISHING_HANDOFF,

        COMPOSER_ACTIONS
          .COMPOSE_FORGET_CONFIRMATION,
      ]
    )
  ) {
    return (
      RESPONSE_DIRECTNESS
        .VERY_DIRECT
    );
  }

  if (
    action ===
      COMPOSER_ACTIONS
        .COMPOSE_FORGET_CLARIFICATION
  ) {
    return RESPONSE_DIRECTNESS.DIRECT;
  }

  if (
    stance === "lead"
  ) {
    return RESPONSE_DIRECTNESS.DIRECT;
  }

  if (
    includesValue(
      action,
      [
        COMPOSER_ACTIONS
          .COMPOSE_REFLECTION,

        COMPOSER_ACTIONS
          .COMPOSE_MEMORY_RECALL,

        COMPOSER_ACTIONS
          .COMPOSE_CONTEXT_RESTORATION,

        COMPOSER_ACTIONS
          .COMPOSE_PROJECT_CONTEXT_RESTORATION,
      ]
    )
  ) {
    return RESPONSE_DIRECTNESS.GENTLE;
  }

  return (
    RESPONSE_DIRECTNESS.BALANCED
  );
}

function chooseResponseEnergy({
  adaptivePlan,
  action,
}) {
  const signals =
    asArray(
      adaptivePlan?.signals
    );

  if (
    action ===
      COMPOSER_ACTIONS
        .RETURN_SILENCE ||
    adaptivePlanRequiresSilence(
      adaptivePlan
    )
  ) {
    return RESPONSE_ENERGY.QUIET;
  }

  if (
    signals.includes(
      "low-energy"
    ) ||
    signals.includes(
      "recovery-mode"
    )
  ) {
    return RESPONSE_ENERGY.LOW;
  }

  if (
    action ===
      COMPOSER_ACTIONS
        .COMPOSE_FORGET_CLARIFICATION ||
    action ===
      COMPOSER_ACTIONS
        .COMPOSE_FORGET_CONFIRMATION
  ) {
    return RESPONSE_ENERGY.QUIET;
  }

  if (
    signals.includes(
      "high-momentum"
    ) ||
    signals.includes(
      "build-mode"
    )
  ) {
    return RESPONSE_ENERGY.HIGH;
  }

  if (
    action ===
      COMPOSER_ACTIONS
        .COMPOSE_PRESSURE_RELEASE
  ) {
    return RESPONSE_ENERGY.QUIET;
  }

  if (
    action ===
      COMPOSER_ACTIONS
        .COMPOSE_CREATION_HANDOFF
  ) {
    return RESPONSE_ENERGY.LIFTING;
  }

  return RESPONSE_ENERGY.MATCHED;
}

function resolveProgressionComposerAction(
  adaptivePlan
) {
  const decision =
    getProgressionDecision(
      adaptivePlan
    );

  const primaryAction =
    getProgressionPrimaryAction(
      adaptivePlan
    );

  if (
    progressionRequiresSilence(
      adaptivePlan
    )
  ) {
    return (
      COMPOSER_ACTIONS
        .RETURN_SILENCE
    );
  }

  switch (decision) {
    case "continue-exploring":
      return (
        COMPOSER_ACTIONS
          .COMPOSE_BRAINSTORMING_TURN
      );

    case "continue-learning":
      return (
        COMPOSER_ACTIONS
          .COMPOSE_ONE_CONCEPT
      );

    case "reduce-information":
    case "offer-one-small-step":
      return (
        COMPOSER_ACTIONS
          .COMPOSE_ONE_RECOMMENDATION
      );

    case "move-to-creation":
      return (
        COMPOSER_ACTIONS
          .COMPOSE_CREATION_HANDOFF
      );

    case "move-to-next-task":
      return (
        COMPOSER_ACTIONS
          .COMPOSE_NEXT_TASK
      );

    case "move-to-refinement":
      return (
        COMPOSER_ACTIONS
          .COMPOSE_REFINEMENT_HANDOFF
      );

    case "move-to-publishing":
      return (
        COMPOSER_ACTIONS
          .COMPOSE_PUBLISHING_HANDOFF
      );

    case "restore-context":
      return (
        COMPOSER_ACTIONS
          .COMPOSE_CONTEXT_RESTORATION
      );

    case "release-pressure":
      return (
        COMPOSER_ACTIONS
          .COMPOSE_PRESSURE_RELEASE
      );

    case "save-and-return-later":
    case "pause-session":
      return (
        COMPOSER_ACTIONS
          .COMPOSE_SESSION_PAUSE
      );

    case "end-session-positively":
      return (
        COMPOSER_ACTIONS
          .COMPOSE_SESSION_CLOSE
      );

    default:
      break;
  }

  switch (primaryAction) {
    case "ask-one-more-question":
      return (
        COMPOSER_ACTIONS
          .COMPOSE_BRAINSTORMING_TURN
      );

    case "reduce-to-one-recommendation":
      return (
        COMPOSER_ACTIONS
          .COMPOSE_ONE_RECOMMENDATION
      );

    case "begin-generation":
      return (
        COMPOSER_ACTIONS
          .COMPOSE_CREATION_HANDOFF
      );

    case "begin-next-creative-step":
      return (
        COMPOSER_ACTIONS
          .COMPOSE_NEXT_TASK
      );

    case "begin-refinement":
      return (
        COMPOSER_ACTIONS
          .COMPOSE_REFINEMENT_HANDOFF
      );

    case "begin-publishing":
      return (
        COMPOSER_ACTIONS
          .COMPOSE_PUBLISHING_HANDOFF
      );

    case "recap-context":
      return (
        COMPOSER_ACTIONS
          .COMPOSE_CONTEXT_RESTORATION
      );

    case "release-expectation":
      return (
        COMPOSER_ACTIONS
          .COMPOSE_PRESSURE_RELEASE
      );

    case "save-current-progress":
      return (
        COMPOSER_ACTIONS
          .COMPOSE_SESSION_PAUSE
      );

    case "close-with-open-door":
      return (
        COMPOSER_ACTIONS
          .COMPOSE_SESSION_CLOSE
      );

    case "wait-without-new-direction":
      return (
        COMPOSER_ACTIONS
          .RETURN_SILENCE
      );

    default:
      return null;
  }
}

function resolveComposerAction(
  adaptivePlan
) {
  if (
    adaptivePlanRequiresSilence(
      adaptivePlan
    )
  ) {
    return (
      COMPOSER_ACTIONS
        .RETURN_SILENCE
    );
  }

  const adaptiveAction =
    getNestedValue(
      adaptivePlan,
      "primaryAction.action",
      null
    );

  if (adaptiveAction) {
    switch (adaptiveAction) {
      case "wait":
        return (
          COMPOSER_ACTIONS
            .RETURN_SILENCE
        );

      case "reflect-gently":
        return (
          COMPOSER_ACTIONS
            .COMPOSE_REFLECTION
        );

      case "release-pressure":
        return (
          COMPOSER_ACTIONS
            .COMPOSE_PRESSURE_RELEASE
        );

      case "restore-context":
        return (
          COMPOSER_ACTIONS
            .COMPOSE_CONTEXT_RESTORATION
        );

      case "restore-project-context":
        return (
          COMPOSER_ACTIONS
            .COMPOSE_PROJECT_CONTEXT_RESTORATION
        );

      case "capture-and-continue":
        return (
          COMPOSER_ACTIONS
            .COMPOSE_CAPTURE_AND_CONTINUE
        );

      case "recall-with-permission":
        return (
          COMPOSER_ACTIONS
            .COMPOSE_MEMORY_RECALL
        );

      case "clarify-forget-request":
        return (
          COMPOSER_ACTIONS
            .COMPOSE_FORGET_CLARIFICATION
        );

      case "apply-forget-request":
        return (
          COMPOSER_ACTIONS
            .COMPOSE_FORGET_CONFIRMATION
        );

      case "offer-one-recommendation":
        return (
          COMPOSER_ACTIONS
            .COMPOSE_ONE_RECOMMENDATION
        );

      case "teach-one-concept":
        return (
          COMPOSER_ACTIONS
            .COMPOSE_ONE_CONCEPT
        );

      case "continue-brainstorming":
        return (
          COMPOSER_ACTIONS
            .COMPOSE_BRAINSTORMING_TURN
        );

      case "move-to-creation":
        return (
          COMPOSER_ACTIONS
            .COMPOSE_CREATION_HANDOFF
        );

      case "move-to-next-task":
        return (
          COMPOSER_ACTIONS
            .COMPOSE_NEXT_TASK
        );

      case "move-to-refinement":
        return (
          COMPOSER_ACTIONS
            .COMPOSE_REFINEMENT_HANDOFF
        );

      case "move-to-publishing":
        return (
          COMPOSER_ACTIONS
            .COMPOSE_PUBLISHING_HANDOFF
        );

      case "preserve-session-handoff":
        return (
          COMPOSER_ACTIONS
            .COMPOSE_SESSION_HANDOFF
        );

      case "save-and-pause":
        return (
          COMPOSER_ACTIONS
            .COMPOSE_SESSION_PAUSE
        );

      case "end-positively":
        return (
          COMPOSER_ACTIONS
            .COMPOSE_SESSION_CLOSE
        );

      case "listen-and-invite":
      case "ask-one-question":
      case "acknowledge-briefly":
        return (
          COMPOSER_ACTIONS
            .COMPOSE_ACKNOWLEDGEMENT
        );

      default:
        break;
    }
  }

  return (
    resolveProgressionComposerAction(
      adaptivePlan
    ) ||
    COMPOSER_ACTIONS
      .COMPOSE_ACKNOWLEDGEMENT
  );
}

function buildAcknowledgementSections({
  adaptivePlan,
}) {
  const sections = [
    createSection({
      type:
        RESPONSE_SECTIONS
          .ACKNOWLEDGEMENT,

      purpose:
        SECTION_PURPOSES.CONNECT,

      length:
        SECTION_LENGTHS
          .ONE_SENTENCE,

      transition:
        TRANSITION_STYLES.NONE,

      instructions: [
        "Acknowledge the creator's latest contribution naturally.",
        "Demonstrate attention without repeating the entire message.",
        "Do not introduce unnecessary new information.",
      ],
    }),
  ];

  const maximumQuestions =
    getNestedValue(
      adaptivePlan,
      "behaviour.questionPolicy.maximumQuestions",
      0
    );

  if (
    maximumQuestions > 0
  ) {
    sections.push(
      createSection({
        type:
          RESPONSE_SECTIONS
            .QUESTION,

        purpose:
          SECTION_PURPOSES.INVITE,

        length:
          SECTION_LENGTHS
            .ONE_SENTENCE,

        transition:
          TRANSITION_STYLES
            .NATURAL,

        optional: true,

        instructions: [
          "Ask no more than one meaningful question.",
          "The question must help the creator continue their own thought.",
          "Do not redirect the conversation unnecessarily.",
        ],
      })
    );
  }

  return sections;
}

function buildReflectionSections({
  adaptivePlan,
}) {
  const candidate =
    getNestedValue(
      adaptivePlan,
      "execution.reflectionCandidate",
      null
    );

  return [
    createSection({
      type:
        RESPONSE_SECTIONS
          .UNDERSTANDING,

      purpose:
        SECTION_PURPOSES
          .PROVE_LISTENING,

      length:
        SECTION_LENGTHS
          .ONE_SENTENCE,

      transition:
        TRANSITION_STYLES.NONE,

      instructions: [
        "Reflect what has genuinely been understood.",
        "Do not begin by saying that the Mentor does not understand.",
        "Use evidence from the creator's own words or actions.",
      ],
    }),

    createSection({
      type:
        RESPONSE_SECTIONS
          .REFLECTION,

      purpose:
        SECTION_PURPOSES
          .PROTECT_CONFIDENCE,

      length:
        SECTION_LENGTHS
          .SHORT_PARAGRAPH,

      transition:
        TRANSITION_STYLES
          .REFLECTIVE,

      instructions: [
        "Present the observation as a possibility, not a verdict.",
        "Ask permission first when the reflection is personal.",
        "Explain the evidence briefly.",
        "Allow the creator to confirm, reject or refine it.",
      ],

      sourceData:
        candidate,
    }),

    createSection({
      type:
        RESPONSE_SECTIONS
          .QUESTION,

      purpose:
        SECTION_PURPOSES.INVITE,

      length:
        SECTION_LENGTHS
          .ONE_SENTENCE,

      transition:
        TRANSITION_STYLES.GENTLE,

      optional: true,

      instructions: [
        "Invite the creator to say whether the reflection feels accurate.",
        "Do not pressure them to agree.",
      ],
    }),
  ];
}

function buildPressureReleaseSections() {
  return [
    createSection({
      type:
        RESPONSE_SECTIONS
          .ACKNOWLEDGEMENT,

      purpose:
        SECTION_PURPOSES.CONNECT,

      length:
        SECTION_LENGTHS
          .ONE_SENTENCE,

      transition:
        TRANSITION_STYLES.NONE,

      instructions: [
        "Acknowledge the difficulty without dramatizing it.",
        "Use calm and natural language.",
      ],
    }),

    createSection({
      type:
        RESPONSE_SECTIONS
          .REASSURANCE,

      purpose:
        SECTION_PURPOSES
          .REDUCE_PRESSURE,

      length:
        SECTION_LENGTHS
          .TWO_SENTENCES,

      transition:
        TRANSITION_STYLES.GENTLE,

      instructions: [
        "Confirm that enough useful material already exists.",
        "Remove any expectation that the missing idea must return immediately.",
        "Trust the creator's mind to continue working in its own time.",
      ],
    }),

    createSection({
      type:
        RESPONSE_SECTIONS
          .NEXT_STEP,

      purpose:
        SECTION_PURPOSES.MOVE,

      length:
        SECTION_LENGTHS
          .ONE_SENTENCE,

      transition:
        TRANSITION_STYLES.NATURAL,

      instructions: [
        "Offer to continue using what is already known.",
        "Give one simple next action only.",
      ],
    }),

    createSection({
      type:
        RESPONSE_SECTIONS
          .OPEN_DOOR,

      purpose:
        SECTION_PURPOSES.INVITE,

      length:
        SECTION_LENGTHS
          .ONE_SENTENCE,

      transition:
        TRANSITION_STYLES.GENTLE,

      instructions: [
        "Leave the door open for the missing thought to return later.",
        "Use relationship shorthand only when it already feels natural.",
      ],
    }),
  ];
}

function buildContextRestorationSections({
  adaptivePlan,
}) {
  const landmarks =
    getNestedValue(
      adaptivePlan,
      "specialistPlans.reflection.reflection.contextLandmarks",
      []
    );

  return [
    createSection({
      type:
        RESPONSE_SECTIONS
          .CONTEXT_RESTORATION,

      purpose:
        SECTION_PURPOSES
          .RESTORE_CONTEXT,

      length:
        SECTION_LENGTHS
          .SHORT_PARAGRAPH,

      transition:
        TRANSITION_STYLES.GENTLE,

      instructions: [
        "Briefly reconstruct the most relevant recent conversation landmarks.",
        "Use the creator's own language where possible.",
        "Do not invent or replace the missing thought.",
        "Keep the recap short enough to avoid increasing pressure.",
      ],

      sourceData:
        landmarks,
    }),

    createSection({
      type:
        RESPONSE_SECTIONS
          .QUESTION,

      purpose:
        SECTION_PURPOSES.INVITE,

      length:
        SECTION_LENGTHS
          .ONE_SENTENCE,

      transition:
        TRANSITION_STYLES.GENTLE,

      instructions: [
        "Ask whether returning to that context helps only when a question is genuinely useful.",
        "Make clear that continuing without further reflection is also fine.",
      ],

      optional: true,
    }),
  ];
}

function buildProjectContextRestorationSections({
  adaptivePlan,
  context,
}) {
  const recallPlan =
    getNestedValue(
      adaptivePlan,
      "execution.recallPlan",
      null
    );

  const projectState =
    adaptivePlan
      ?.projectState ||
    null;

  return [
    createSection({
      type:
        RESPONSE_SECTIONS
          .PROJECT_CONTEXT,

      purpose:
        SECTION_PURPOSES
          .PRESERVE_CONTINUITY,

      length:
        SECTION_LENGTHS
          .SHORT_PARAGRAPH,

      transition:
        TRANSITION_STYLES.NONE,

      instructions: [
        "Restore only the project landmarks needed to continue.",
        "Prefer creator-approved decisions, current position and unresolved work.",
        "Mention the last meaningful decision when it helps orientation.",
        "Do not dump the full project history.",
        "Do not describe internal memory retrieval.",
        "Do not mix information from another project.",
      ],

      sourceData: {
        recallPlan,
        projectState,
        activeProject:
          context?.activeProject ||
          null,
        activeStage:
          context?.activeStage ||
          null,
        activeScene:
          context?.activeScene ||
          null,
      },
    }),

    createSection({
      type:
        RESPONSE_SECTIONS
          .NEXT_STEP,

      purpose:
        SECTION_PURPOSES.MOVE,

      length:
        SECTION_LENGTHS
          .ONE_SENTENCE,

      transition:
        TRANSITION_STYLES.NATURAL,

      instructions: [
        "State the next useful point in the project.",
        "Do not make the creator rediscover where they stopped.",
        context?.returnPoint
          ? `Return point: ${context.returnPoint}.`
          : "Use remembered project position when reliable.",
      ],

      sourceData: {
        returnPoint:
          context?.returnPoint ||
          null,
      },
    }),
  ];
}

function buildCaptureAndContinueSections({
  adaptivePlan,
  context,
}) {
  const memoryPlan =
    getNestedValue(
      adaptivePlan,
      "specialistPlans.memory",
      null
    );

  return [
    createSection({
      type:
        RESPONSE_SECTIONS
          .MEMORY_CAPTURE,

      purpose:
        SECTION_PURPOSES.CAPTURE,

      length:
        SECTION_LENGTHS
          .ONE_SENTENCE,

      transition:
        TRANSITION_STYLES.NONE,

      instructions: [
        "Acknowledge that the thought is worth preserving when useful.",
        "State that something was saved only when persistence has actually succeeded or execution explicitly guarantees persistence success.",
        "Never falsely claim that memory storage occurred.",
        "If persistence success is unknown, describe only the intention to preserve the thought.",
        "Do not make memory mechanics the focus of the response.",
      ],

      sourceData:
        memoryPlan?.instructions ||
        [],
    }),

    createSection({
      type:
        RESPONSE_SECTIONS
          .UNDERSTANDING,

      purpose:
        SECTION_PURPOSES
          .PROVE_LISTENING,

      length:
        SECTION_LENGTHS
          .TWO_SENTENCES,

      transition:
        TRANSITION_STYLES.GENTLE,

      instructions: [
        "Reflect that the creator appears to have wanted to get the thought out without opening the whole subject.",
        "Use tentative language rather than claiming certainty.",
        "Do not turn the detour into another discussion.",
      ],
    }),

    createSection({
      type:
        RESPONSE_SECTIONS
          .NEXT_STEP,

      purpose:
        SECTION_PURPOSES.MOVE,

      length:
        SECTION_LENGTHS
          .ONE_SENTENCE,

      transition:
        TRANSITION_STYLES.NATURAL,

      instructions: [
        "Return smoothly to the task that was active before the detour.",

        context?.previousTask
          ? `Return to: ${context.previousTask}.`
          : "Refer naturally to the previous task.",
      ],

      sourceData: {
        previousTask:
          context?.previousTask ||
          null,
      },
    }),

    createSection({
      type:
        RESPONSE_SECTIONS
          .OPEN_DOOR,

      purpose:
        SECTION_PURPOSES.INVITE,

      length:
        SECTION_LENGTHS
          .ONE_SENTENCE,

      transition:
        TRANSITION_STYLES.GENTLE,

      optional: true,

      instructions: [
        "Leave the subject available for later without setting an artificial deadline.",
      ],
    }),
  ];
}

function buildMemoryRecallSections({
  adaptivePlan,
}) {
  const recall =
    getNestedValue(
      adaptivePlan,
      "execution.recallPlan",
      null
    );

  return [
    createSection({
      type:
        RESPONSE_SECTIONS
          .MEMORY_RECALL,

      purpose:
        SECTION_PURPOSES.RECALL,

      length:
        SECTION_LENGTHS
          .SHORT_PARAGRAPH,

      transition:
        TRANSITION_STYLES.GENTLE,

      instructions: [
        "Use only the minimum remembered context needed now.",
        "Introduce remembered information naturally rather than announcing a memory system.",
        "Prefer project continuity and creator-approved facts over incidental historical detail.",
        "Explain why the remembered information matters only when useful.",
        "Never imply that the creator should have remembered it themselves.",
        "Never expose internal memory scores, IDs or specialist sources.",
      ],

      sourceData:
        recall,
    }),

    createSection({
      type:
        RESPONSE_SECTIONS
          .QUESTION,

      purpose:
        SECTION_PURPOSES.INVITE,

      length:
        SECTION_LENGTHS
          .ONE_SENTENCE,

      transition:
        TRANSITION_STYLES.GENTLE,

      optional: true,

      instructions: [
        "Ask permission only when opening the remembered subject would materially change the creator's current direction.",
        "Do not ask permission merely to use a harmless continuity fact.",
        "If the subject was intentionally deferred, offer a natural option to leave it deferred.",
      ],
    }),
  ];
}

function buildForgetClarificationSections({
  adaptivePlan,
}) {
  const forgetPlan =
    getNestedValue(
      adaptivePlan,
      "execution.forgetPlan",
      null
    );

  return [
    createSection({
      type:
        RESPONSE_SECTIONS
          .MEMORY_FORGET_CLARIFICATION,

      purpose:
        SECTION_PURPOSES.CLARIFY,

      length:
        SECTION_LENGTHS
          .ONE_SENTENCE,

      transition:
        TRANSITION_STYLES.NONE,

      instructions: [
        "Ask only for the minimum clarification needed to identify what should be forgotten.",
        "Do not guess which memory the creator means.",
        "Do not delete anything yet.",
        "Do not claim that anything has been deleted.",
        "Do not discuss the wider memory system unless asked.",
      ],

      sourceData:
        forgetPlan,
    }),

    createSection({
      type:
        RESPONSE_SECTIONS
          .QUESTION,

      purpose:
        SECTION_PURPOSES.CLARIFY,

      length:
        SECTION_LENGTHS
          .ONE_SENTENCE,

      transition:
        TRANSITION_STYLES.IMMEDIATE,

      instructions: [
        "Ask exactly one direct clarification question.",
        "Where possible, distinguish between the small number of candidate memories without exposing internal IDs.",
      ],

      sourceData:
        forgetPlan?.matchedMemories ||
        [],
    }),
  ];
}

function buildForgetConfirmationSections({
  adaptivePlan,
}) {
  const forgetPlan =
    getNestedValue(
      adaptivePlan,
      "execution.forgetPlan",
      null
    );

  return [
    createSection({
      type:
        RESPONSE_SECTIONS
          .MEMORY_FORGET,

      purpose:
        SECTION_PURPOSES.FORGET,

      length:
        SECTION_LENGTHS
          .ONE_SENTENCE,

      transition:
        TRANSITION_STYLES.NONE,

      instructions: [
        "Confirm the forget request briefly only after persistence confirms deletion or forgetting.",
        "Do not claim deletion if the persistence layer has not executed it.",
        "If execution is still pending, describe only the requested action and do not imply completion.",
        "Do not repeat the forgotten information unnecessarily.",
        "Do not recreate the deleted conclusion from inference.",
        "Do not introduce another question unless required by execution failure.",
      ],

      sourceData:
        forgetPlan,
    }),
  ];
}

function buildOneRecommendationSections({
  context,
}) {
  return [
    createSection({
      type:
        RESPONSE_SECTIONS
          .RECOMMENDATION,

      purpose:
        SECTION_PURPOSES.GUIDE,

      length:
        SECTION_LENGTHS
          .ONE_SENTENCE,

      transition:
        TRANSITION_STYLES.NONE,

      instructions: [
        "Give one clear recommendation.",
        "Do not provide multiple alternatives.",
        "Lead with the recommendation rather than background explanation.",
      ],
    }),

    createSection({
      type:
        RESPONSE_SECTIONS
          .NEXT_STEP,

      purpose:
        SECTION_PURPOSES.MOVE,

      length:
        SECTION_LENGTHS
          .ONE_SENTENCE,

      transition:
        TRANSITION_STYLES.IMMEDIATE,

      instructions: [
        "Give one executable next action.",

        context?.nextTask
          ? `Use this next task: ${context.nextTask}.`
          : "Choose the smallest useful action.",
      ],

      sourceData: {
        nextTask:
          context?.nextTask ||
          null,
      },
    }),
  ];
}

function buildTeachingSections({
  adaptivePlan,
}) {
  const maximumQuestions =
    getNestedValue(
      adaptivePlan,
      "behaviour.questionPolicy.maximumQuestions",
      1
    );

  const sections = [
    createSection({
      type:
        RESPONSE_SECTIONS
          .UNDERSTANDING,

      purpose:
        SECTION_PURPOSES
          .PROVE_LISTENING,

      length:
        SECTION_LENGTHS
          .ONE_SENTENCE,

      transition:
        TRANSITION_STYLES.NONE,

      instructions: [
        "Identify the exact concept the creator wants to understand.",
        "Do not teach beyond the requested scope.",
      ],
    }),

    createSection({
      type:
        RESPONSE_SECTIONS
          .TEACHING,

      purpose:
        SECTION_PURPOSES.INFORM,

      length:
        SECTION_LENGTHS
          .MEDIUM_PARAGRAPH,

      transition:
        TRANSITION_STYLES.NATURAL,

      instructions: [
        "Explain one concept only.",
        "Use the creator's known learning preferences where available.",
        "Prefer a concrete example or demonstration over abstract jargon.",
        "Do not turn the response into a full course.",
        "When practical, let experience come before explanation.",
      ],
    }),

    createSection({
      type:
        RESPONSE_SECTIONS
          .NEXT_STEP,

      purpose:
        SECTION_PURPOSES.MOVE,

      length:
        SECTION_LENGTHS
          .ONE_SENTENCE,

      transition:
        TRANSITION_STYLES.NATURAL,

      instructions: [
        "Offer a small way to apply the concept immediately.",
        "Learning should return the creator to doing.",
      ],
    }),
  ];

  if (
    maximumQuestions > 0
  ) {
    sections.push(
      createSection({
        type:
          RESPONSE_SECTIONS
            .QUESTION,

        purpose:
          SECTION_PURPOSES.INVITE,

        length:
          SECTION_LENGTHS
            .ONE_SENTENCE,

        transition:
          TRANSITION_STYLES.GENTLE,

        optional: true,

        instructions: [
          "Ask whether one part needs another example only when clarification would be useful.",
          "Do not introduce a second concept.",
        ],
      })
    );
  }

  return sections;
}

function buildBrainstormingSections() {
  return [
    createSection({
      type:
        RESPONSE_SECTIONS
          .ACKNOWLEDGEMENT,

      purpose:
        SECTION_PURPOSES.CONNECT,

      length:
        SECTION_LENGTHS
          .ONE_SENTENCE,

      transition:
        TRANSITION_STYLES.NONE,

      instructions: [
        "Respond to the creator's latest idea with genuine curiosity.",
        "Do not evaluate the idea too early.",
      ],
    }),

    createSection({
      type:
        RESPONSE_SECTIONS
          .REFLECTION,

      purpose:
        SECTION_PURPOSES
          .PROVE_LISTENING,

      length:
        SECTION_LENGTHS
          .ONE_SENTENCE,

      transition:
        TRANSITION_STYLES.NATURAL,

      instructions: [
        "Echo the most interesting direction without taking ownership.",
        "Do not complete the creator's idea for them.",
      ],
    }),

    createSection({
      type:
        RESPONSE_SECTIONS
          .QUESTION,

      purpose:
        SECTION_PURPOSES.INVITE,

      length:
        SECTION_LENGTHS
          .ONE_SENTENCE,

      transition:
        TRANSITION_STYLES
          .REFLECTIVE,

      instructions: [
        "Ask one question that helps the creator discover the next part.",
        "Prefer imagination, feeling, recognition or possibility language.",
      ],
    }),
  ];
}

function buildActionHandoffSections({
  action,
  context,
}) {
  const actionInstructions = {
    [COMPOSER_ACTIONS
      .COMPOSE_CREATION_HANDOFF]: [
      "Confirm that enough is known to begin a first version.",
      "Move directly into creation.",
      "Do not request perfect clarity.",
      "Allow the work to evolve during creation.",
    ],

    [COMPOSER_ACTIONS
      .COMPOSE_NEXT_TASK]: [
      "State the next task immediately.",
      "Do not reopen the previous discussion.",
      "Provide only the information needed to continue.",
      "Protect build momentum.",
    ],

    [COMPOSER_ACTIONS
      .COMPOSE_REFINEMENT_HANDOFF]: [
      "Move directly into refinement.",
      "Identify the single highest-value improvement first.",
      "Do not redesign the entire project unless requested.",
    ],

    [COMPOSER_ACTIONS
      .COMPOSE_PUBLISHING_HANDOFF]: [
      "Confirm that the creation is ready for the publishing stage.",
      "Give the next publishing action clearly.",
      "Do not introduce unrelated creative changes.",
    ],
  };

  return [
    createSection({
      type:
        RESPONSE_SECTIONS
          .CREATIVE_DIRECTION,

      purpose:
        SECTION_PURPOSES.GUIDE,

      length:
        SECTION_LENGTHS
          .ONE_SENTENCE,

      transition:
        TRANSITION_STYLES.NONE,

      instructions:
        actionInstructions[
          action
        ] || [
          "Move directly into the next creative stage.",
        ],
    }),

    createSection({
      type:
        RESPONSE_SECTIONS
          .NEXT_STEP,

      purpose:
        SECTION_PURPOSES.MOVE,

      length:
        SECTION_LENGTHS
          .ONE_SENTENCE,

      transition:
        TRANSITION_STYLES.IMMEDIATE,

      instructions: [
        context?.nextTask
          ? `Execute this next task: ${context.nextTask}.`
          : "State one concrete next action.",

        "Do not add an unnecessary closing question.",
      ],

      sourceData: {
        nextTask:
          context?.nextTask ||
          null,

        activeProject:
          context?.activeProject ||
          null,

        activeStage:
          context?.activeStage ||
          null,

        activeScene:
          context?.activeScene ||
          null,
      },
    }),
  ];
}

function buildSessionHandoffSections({
  adaptivePlan,
  context,
}) {
  const memoryPlan =
    getNestedValue(
      adaptivePlan,
      "specialistPlans.memory",
      null
    );

  const handoffCandidates =
    asArray(
      memoryPlan?.candidates
    )
      .map(
        (item) =>
          item?.candidate ||
          item
      )
      .filter(
        (candidate) =>
          candidate?.category ===
          "session-handoff"
      );

  return [
    createSection({
      type:
        RESPONSE_SECTIONS
          .SESSION_HANDOFF,

      purpose:
        SECTION_PURPOSES.HANDOFF,

      length:
        SECTION_LENGTHS
          .SHORT_PARAGRAPH,

      transition:
        TRANSITION_STYLES.NONE,

      instructions: [
        "Preserve the creator's exact working position without creating new work.",
        "Capture what was last completed, the current stage and the next useful step when known.",
        "Mention unresolved work only when it matters for returning.",
        "Do not dump the entire session history.",
        "Do not falsely claim the handoff was persisted unless storage succeeded.",
      ],

      sourceData: {
        handoffCandidates,
        activeProject:
          context?.activeProject ||
          null,
        activeStage:
          context?.activeStage ||
          null,
        activeScene:
          context?.activeScene ||
          null,
        returnPoint:
          context?.returnPoint ||
          null,
      },
    }),

    createSection({
      type:
        RESPONSE_SECTIONS
          .CLOSING,

      purpose:
        SECTION_PURPOSES.CLOSE,

      length:
        SECTION_LENGTHS
          .ONE_SENTENCE,

      transition:
        TRANSITION_STYLES.GENTLE,

      instructions: [
        "Let the creator leave without another task or question.",
        "Make the future return feel easy.",
      ],
    }),
  ];
}

function buildSessionPauseSections({
  adaptivePlan,
  context,
}) {
  const execution =
    adaptivePlan?.execution ||
    {};

  return [
    createSection({
      type:
        RESPONSE_SECTIONS
          .SESSION_RECAP,

      purpose:
        SECTION_PURPOSES.CAPTURE,

      length:
        SECTION_LENGTHS
          .SHORT_PARAGRAPH,

      transition:
        TRANSITION_STYLES.NONE,

      instructions: [
        "Briefly state what was completed.",
        "Preserve the creator's place without adding new work.",
        "Use known project state rather than inventing a recap.",
        "Keep the recap concise.",
      ],

      sourceData: {
        projectMemory:
          execution
            ?.projectMemory ||
          null,

        activeProject:
          context?.activeProject ||
          null,

        activeStage:
          context?.activeStage ||
          null,

        activeScene:
          context?.activeScene ||
          null,
      },
    }),

    createSection({
      type:
        RESPONSE_SECTIONS
          .NEXT_STEP,

      purpose:
        SECTION_PURPOSES.MOVE,

      length:
        SECTION_LENGTHS
          .ONE_SENTENCE,

      transition:
        TRANSITION_STYLES.GENTLE,

      instructions: [
        "Name the exact return point when known.",

        context?.returnPoint
          ? `Return point: ${context.returnPoint}.`
          : "Identify the next unfinished task only when reliable.",
      ],

      sourceData: {
        returnPoint:
          context?.returnPoint ||
          null,
      },
    }),

    createSection({
      type:
        RESPONSE_SECTIONS
          .CLOSING,

      purpose:
        SECTION_PURPOSES.CLOSE,

      length:
        SECTION_LENGTHS
          .ONE_SENTENCE,

      transition:
        TRANSITION_STYLES.GENTLE,

      instructions: [
        "End without guilt, urgency or pressure.",
        "Do not introduce another question or task.",
      ],
    }),
  ];
}

function buildSessionCloseSections() {
  return [
    createSection({
      type:
        RESPONSE_SECTIONS
          .ACKNOWLEDGEMENT,

      purpose:
        SECTION_PURPOSES.CONNECT,

      length:
        SECTION_LENGTHS
          .ONE_SENTENCE,

      transition:
        TRANSITION_STYLES.NONE,

      instructions: [
        "Acknowledge genuine progress made in the session.",
        "Use evidence rather than exaggerated praise.",
      ],
    }),

    createSection({
      type:
        RESPONSE_SECTIONS
          .OPEN_DOOR,

      purpose:
        SECTION_PURPOSES.INVITE,

      length:
        SECTION_LENGTHS
          .ONE_SENTENCE,

      transition:
        TRANSITION_STYLES.GENTLE,

      instructions: [
        "Leave the return path open.",
        "Do not require a response.",
      ],
    }),

    createSection({
      type:
        RESPONSE_SECTIONS
          .CLOSING,

      purpose:
        SECTION_PURPOSES.CLOSE,

      length:
        SECTION_LENGTHS
          .ONE_SENTENCE,

      transition:
        TRANSITION_STYLES.GENTLE,

      instructions: [
        "Close warmly and naturally.",
        "Do not add another topic.",
      ],
    }),
  ];
}

function buildSections({
  action,
  adaptivePlan,
  context,
}) {
  switch (action) {
    case COMPOSER_ACTIONS
      .RETURN_SILENCE:
      return [];

    case COMPOSER_ACTIONS
      .COMPOSE_REFLECTION:
      return (
        buildReflectionSections({
          adaptivePlan,
        })
      );

    case COMPOSER_ACTIONS
      .COMPOSE_PRESSURE_RELEASE:
      return (
        buildPressureReleaseSections()
      );

    case COMPOSER_ACTIONS
      .COMPOSE_CONTEXT_RESTORATION:
      return (
        buildContextRestorationSections({
          adaptivePlan,
        })
      );

    case COMPOSER_ACTIONS
      .COMPOSE_PROJECT_CONTEXT_RESTORATION:
      return (
        buildProjectContextRestorationSections({
          adaptivePlan,
          context,
        })
      );

    case COMPOSER_ACTIONS
      .COMPOSE_CAPTURE_AND_CONTINUE:
      return (
        buildCaptureAndContinueSections({
          adaptivePlan,
          context,
        })
      );

    case COMPOSER_ACTIONS
      .COMPOSE_MEMORY_RECALL:
      return (
        buildMemoryRecallSections({
          adaptivePlan,
        })
      );

    case COMPOSER_ACTIONS
      .COMPOSE_FORGET_CLARIFICATION:
      return (
        buildForgetClarificationSections({
          adaptivePlan,
        })
      );

    case COMPOSER_ACTIONS
      .COMPOSE_FORGET_CONFIRMATION:
      return (
        buildForgetConfirmationSections({
          adaptivePlan,
        })
      );

    case COMPOSER_ACTIONS
      .COMPOSE_ONE_RECOMMENDATION:
      return (
        buildOneRecommendationSections({
          context,
        })
      );

    case COMPOSER_ACTIONS
      .COMPOSE_ONE_CONCEPT:
      return (
        buildTeachingSections({
          adaptivePlan,
        })
      );

    case COMPOSER_ACTIONS
      .COMPOSE_BRAINSTORMING_TURN:
      return (
        buildBrainstormingSections()
      );

    case COMPOSER_ACTIONS
      .COMPOSE_CREATION_HANDOFF:

    case COMPOSER_ACTIONS
      .COMPOSE_NEXT_TASK:

    case COMPOSER_ACTIONS
      .COMPOSE_REFINEMENT_HANDOFF:

    case COMPOSER_ACTIONS
      .COMPOSE_PUBLISHING_HANDOFF:
      return (
        buildActionHandoffSections({
          action,
          context,
        })
      );

    case COMPOSER_ACTIONS
      .COMPOSE_SESSION_HANDOFF:
      return (
        buildSessionHandoffSections({
          adaptivePlan,
          context,
        })
      );

    case COMPOSER_ACTIONS
      .COMPOSE_SESSION_PAUSE:
      return (
        buildSessionPauseSections({
          adaptivePlan,
          context,
        })
      );

    case COMPOSER_ACTIONS
      .COMPOSE_SESSION_CLOSE:
      return (
        buildSessionCloseSections()
      );

    case COMPOSER_ACTIONS
      .COMPOSE_ACKNOWLEDGEMENT:

    default:
      return (
        buildAcknowledgementSections({
          adaptivePlan,
        })
      );
  }
}

function getMaximumQuestions(
  adaptivePlan
) {
  const adaptiveMaximum =
    safeNumber(
      getNestedValue(
        adaptivePlan,
        "behaviour.questionPolicy.maximumQuestions",
        0
      ),
      0
    );

  const progressionMaximum =
    getNestedValue(
      adaptivePlan,
      "progressionPlan.progression.maximumQuestions",
      null
    );

  const specialistProgressionMaximum =
    getNestedValue(
      adaptivePlan,
      "specialistPlans.progression.progression.maximumQuestions",
      null
    );

  const directProgressionMaximum =
    getNestedValue(
      adaptivePlan,
      "progression.maximumQuestions",
      null
    );

  const progressionValues = [
    progressionMaximum,
    specialistProgressionMaximum,
    directProgressionMaximum,
  ]
    .filter(
      (value) =>
        value !== null &&
        value !== undefined
    )
    .map(
      (value) =>
        Math.max(
          0,
          safeNumber(
            value,
            0
          )
        )
    );

  if (
    progressionValues.length === 0
  ) {
    return Math.max(
      0,
      adaptiveMaximum
    );
  }

  return Math.min(
    Math.max(
      0,
      adaptiveMaximum
    ),
    ...progressionValues
  );
}

function enforceQuestionLimit({
  sections,
  maximumQuestions,
}) {
  let questionCount = 0;

  return sections.filter(
    (section) => {
      if (
        section.type !==
        RESPONSE_SECTIONS.QUESTION
      ) {
        return true;
      }

      if (
        questionCount >=
        maximumQuestions
      ) {
        return false;
      }

      questionCount += 1;
      return true;
    }
  );
}

function getOneLinePreferredSection(
  sections
) {
  const preferredTypes = [
    RESPONSE_SECTIONS
      .MEMORY_FORGET,

    RESPONSE_SECTIONS
      .MEMORY_FORGET_CLARIFICATION,

    RESPONSE_SECTIONS
      .NEXT_STEP,

    RESPONSE_SECTIONS
      .CREATIVE_DIRECTION,

    RESPONSE_SECTIONS
      .PROJECT_CONTEXT,

    RESPONSE_SECTIONS
      .SESSION_HANDOFF,

    RESPONSE_SECTIONS
      .SESSION_RECAP,

    RESPONSE_SECTIONS
      .RECOMMENDATION,

    RESPONSE_SECTIONS
      .MEMORY_CAPTURE,

    RESPONSE_SECTIONS
      .ACKNOWLEDGEMENT,
  ];

  for (
    const type
    of preferredTypes
  ) {
    const section =
      sections.find(
        (item) =>
          item.type === type
      );

    if (section) {
      return section;
    }
  }

  return sections[0] || null;
}

function constrainSections({
  sections,
  blueprintLength,
  action,
  maximumQuestions,
}) {
  if (
    blueprintLength ===
      BLUEPRINT_LENGTHS.SILENT ||
    action ===
      COMPOSER_ACTIONS
        .RETURN_SILENCE
  ) {
    return [];
  }

  let constrainedSections =
    enforceQuestionLimit({
      sections,
      maximumQuestions,
    });

  /**
   * Forget clarification requires the
   * clarification instruction and the question
   * itself when one question is permitted.
   */
  if (
    action ===
      COMPOSER_ACTIONS
        .COMPOSE_FORGET_CLARIFICATION
  ) {
    constrainedSections =
      constrainedSections
        .filter(
          (section) =>
            includesValue(
              section.type,
              [
                RESPONSE_SECTIONS
                  .MEMORY_FORGET_CLARIFICATION,

                RESPONSE_SECTIONS
                  .QUESTION,
              ]
            )
        )
        .slice(
          0,
          maximumQuestions > 0
            ? 2
            : 1
        );

    return constrainedSections;
  }

  if (
    blueprintLength ===
      BLUEPRINT_LENGTHS.ONE_LINE
  ) {
    const preferred =
      getOneLinePreferredSection(
        constrainedSections
      );

    if (!preferred) {
      return [];
    }

    return [
      {
        ...preferred,

        length:
          SECTION_LENGTHS
            .ONE_SENTENCE,
      },
    ];
  }

  if (
    blueprintLength ===
      BLUEPRINT_LENGTHS.SHORT
  ) {
    constrainedSections =
      constrainedSections
        .filter(
          (section) =>
            !section.optional
        )
        .slice(0, 3)
        .map((section) => ({
          ...section,

          length:
            section.length ===
            SECTION_LENGTHS
              .MEDIUM_PARAGRAPH
              ? SECTION_LENGTHS
                  .SHORT_PARAGRAPH
              : section.length,
        }));
  } else if (
    blueprintLength ===
      BLUEPRINT_LENGTHS.MEDIUM
  ) {
    constrainedSections =
      constrainedSections.slice(
        0,
        5
      );
  }

  return enforceQuestionLimit({
    sections:
      constrainedSections,
    maximumQuestions,
  });
}

function createLanguageGuidance({
  adaptivePlan,
  rhythm,
  warmth,
  directness,
  energy,
  context,
}) {
  const role =
    getNestedValue(
      adaptivePlan,
      "behaviour.role",
      "listener"
    );

  return uniqueValues([
    `Write with a ${rhythm} rhythm.`,

    `Use ${warmth} warmth.`,

    `Use ${directness} directness.`,

    `Use ${energy} energy.`,

    `Speak from the ${role} Mentor role.`,

    "Use natural spoken language rather than corporate language.",

    "Avoid unnecessary headings in ordinary conversation.",

    "Do not narrate internal engine decisions.",

    "Do not mention confidence scores, classifications, memory IDs, agent names or system rules.",

    "Information from specialist agents should sound like one coherent Mentor understanding, not multiple assistants reporting separately.",

    "Do not say 'the Continuity Agent says', 'the Story Agent found', or similar unless the creator specifically asks about system internals.",

    "Match established creator vocabulary only when it feels natural.",

    asArray(
      context
        ?.establishedVocabulary
    ).length
      ? `Relevant creator vocabulary: ${context.establishedVocabulary.join(
          ", "
        )}.`
      : null,

    asArray(
      context
        ?.sharedMeanings
    ).length
      ? "Respect established shared meanings and relationship shorthand."
      : null,

    asArray(
      context
        ?.sharedRituals
    ).length
      ? "Recognise established creative rituals without forcing them."
      : null,

    context?.humourAllowed
      ? "Light humour may be used when it supports the relationship and does not interrupt the moment."
      : "Do not use humour.",

    context?.emojisAllowed
      ? "Use emojis only where they are already natural within the relationship."
      : "Do not use emojis.",

    "Do not imitate a cultural or genre identity performatively.",

    "Do not praise automatically. Ground encouragement in evidence.",

    "Do not use more words than the blueprint requires.",

    "Never claim that memory was saved, updated or deleted merely because the plan requested it.",

    "Persistence language must reflect confirmed execution state.",

    "Complexity belongs behind the conversation, not in the creator's head.",
  ]);
}

function createPersistenceTruth({
  adaptivePlan,
}) {
  const captureSucceeded =
    Boolean(
      getNestedValue(
        adaptivePlan,
        "execution.memoryPersistenceSucceeded",
        false
      )
    ) ||
    Boolean(
      getNestedValue(
        adaptivePlan,
        "execution.captureSucceeded",
        false
      )
    );

  const forgetSucceeded =
    Boolean(
      getNestedValue(
        adaptivePlan,
        "execution.forgetPersistenceSucceeded",
        false
      )
    ) ||
    Boolean(
      getNestedValue(
        adaptivePlan,
        "execution.forgetSucceeded",
        false
      )
    );

  const handoffSucceeded =
    Boolean(
      getNestedValue(
        adaptivePlan,
        "execution.sessionHandoffPersistenceSucceeded",
        false
      )
    ) ||
    Boolean(
      getNestedValue(
        adaptivePlan,
        "execution.handoffSucceeded",
        false
      )
    );

  return {
    captureSucceeded,
    forgetSucceeded,
    handoffSucceeded,

    mayClaimMemorySaved:
      captureSucceeded,

    mayClaimMemoryForgotten:
      forgetSucceeded,

    mayClaimSessionHandoffSaved:
      handoffSucceeded,
  };
}

function createResponseConstraints({
  adaptivePlan,
  blueprintLength,
  sections,
  action,
  maximumQuestions,
  persistenceTruth,
}) {
  const memoryPolicy =
    getNestedValue(
      adaptivePlan,
      "behaviour.memoryPolicy",
      "inform-silently"
    );

  const shouldApplyForget =
    Boolean(
      getNestedValue(
        adaptivePlan,
        "execution.shouldApplyForget",
        false
      )
    );

  const shouldClarifyForget =
    Boolean(
      getNestedValue(
        adaptivePlan,
        "execution.shouldClarifyForget",
        false
      )
    );

  const shouldPreserveSessionHandoff =
    Boolean(
      getNestedValue(
        adaptivePlan,
        "execution.shouldPreserveSessionHandoff",
        false
      )
    );

  const shouldGenerateText =
    blueprintLength !==
      BLUEPRINT_LENGTHS.SILENT &&
    action !==
      COMPOSER_ACTIONS
        .RETURN_SILENCE;

  return {
    blueprintLength,

    maximumQuestions,

    maximumRecommendations:
      blueprintLength ===
        BLUEPRINT_LENGTHS.DETAILED
        ? 3
        : 1,

    maximumPrimarySections:
      sections.length,

    shouldEndWithQuestion:
      shouldGenerateText &&
      sections.some(
        (section) =>
          section.type ===
          RESPONSE_SECTIONS
            .QUESTION
      ),

    shouldGenerateText,

    shouldUseMemory:
      includesValue(
        memoryPolicy,
        [
          "recall-with-permission",
          "capture-and-recall",
          "restore-context",
        ]
      ),

    shouldMentionMemoryCapture:
      shouldGenerateText &&
      sections.some(
        (section) =>
          section.type ===
          RESPONSE_SECTIONS
            .MEMORY_CAPTURE
      ),

    shouldRestoreProjectContext:
      shouldGenerateText &&
      action ===
        COMPOSER_ACTIONS
          .COMPOSE_PROJECT_CONTEXT_RESTORATION,

    shouldPreserveSessionHandoff,

    shouldApplyForget,

    shouldClarifyForget,

    mayClaimMemorySaved:
      persistenceTruth
        .mayClaimMemorySaved,

    mayClaimMemoryForgotten:
      persistenceTruth
        .mayClaimMemoryForgotten,

    mayClaimSessionHandoffSaved:
      persistenceTruth
        .mayClaimSessionHandoffSaved,

    shouldHideSpecialistMachinery:
      true,

    forbiddenPatterns: [
      "I don't understand.",
      "What do you mean?",
      "Explain that again.",
      "As an AI language model",
      "Here are five options",
      "You always",
      "You never",
      "I know exactly how you feel",
      "The Story Agent says",
      "The Continuity Agent says",
      "The Character Agent says",
      "According to my memory score",
    ],

    forbiddenUnverifiedClaims: [
      "I saved that.",
      "I've saved that.",
      "I have saved that.",
      "That's saved.",
      "It has been saved.",
      "I've remembered that.",
      "I deleted that.",
      "I've deleted that.",
      "I forgot that.",
      "I've forgotten that.",
      "That's been removed.",
      "Your return point is saved.",
    ],
  };
}

function collectSourceGuidance(
  adaptivePlan
) {
  return uniqueValues([
    ...asArray(
      adaptivePlan
        ?.responseGuidance
    ),

    ...asArray(
      getNestedValue(
        adaptivePlan,
        "progressionPlan.responseGuidance",
        []
      )
    ),

    ...asArray(
      getNestedValue(
        adaptivePlan,
        "specialistPlans.progression.responseGuidance",
        []
      )
    ),

    "Follow the response sections in their supplied order.",

    "Do not add sections that are absent from the blueprint.",

    "Do not turn an optional section into a required section.",

    "Do not expose internal planning, memory structures or specialist-agent routing.",

    "Use project memory to reduce repetition, not to demonstrate memory capability.",

    "The final wording should sound like one coherent response, not assembled modules.",

    "When creator-approved project truth conflicts with a specialist observation, creator-approved truth wins.",

    "Present state and explicit creator direction override historical assumptions.",

    "Progression guidance controls pacing and movement; do not re-open exploration after progression has moved the creator into action.",

    "Never convert a requested persistence operation into a statement that persistence succeeded.",
  ]);
}

function createBlueprintSummary({
  action,
  sections,
  blueprintLength,
  rhythm,
}) {
  const sectionNames =
    sections.length > 0
      ? sections
          .map(
            (section) =>
              section.type
          )
          .join(" → ")
      : "silence";

  return (
    `Compose ${action} using ${blueprintLength} length ` +
    `and ${rhythm} rhythm. ` +
    `Section order: ${sectionNames}.`
  );
}

function createMemoryBlueprintData({
  adaptivePlan,
  persistenceTruth,
}) {
  return {
    policy:
      getNestedValue(
        adaptivePlan,
        "behaviour.memoryPolicy",
        "inform-silently"
      ),

    instructions:
      cloneValue(
        getNestedValue(
          adaptivePlan,
          "execution.memoryInstructions",
          []
        )
      ),

    recallPlan:
      cloneValue(
        getNestedValue(
          adaptivePlan,
          "execution.recallPlan",
          null
        )
      ),

    forgetPlan:
      cloneValue(
        getNestedValue(
          adaptivePlan,
          "execution.forgetPlan",
          null
        )
      ),

    projectMemory:
      cloneValue(
        getNestedValue(
          adaptivePlan,
          "execution.projectMemory",
          null
        )
      ),

    shouldCapture:
      Boolean(
        getNestedValue(
          adaptivePlan,
          "execution.shouldCaptureMemory",
          false
        )
      ),

    shouldRecall:
      Boolean(
        getNestedValue(
          adaptivePlan,
          "execution.shouldRecallMemory",
          false
        )
      ),

    shouldPreserveSessionHandoff:
      Boolean(
        getNestedValue(
          adaptivePlan,
          "execution.shouldPreserveSessionHandoff",
          false
        )
      ),

    shouldApplyForget:
      Boolean(
        getNestedValue(
          adaptivePlan,
          "execution.shouldApplyForget",
          false
        )
      ),

    shouldClarifyForget:
      Boolean(
        getNestedValue(
          adaptivePlan,
          "execution.shouldClarifyForget",
          false
        )
      ),

    persistence: {
      captureSucceeded:
        persistenceTruth
          .captureSucceeded,

      forgetSucceeded:
        persistenceTruth
          .forgetSucceeded,

      handoffSucceeded:
        persistenceTruth
          .handoffSucceeded,

      mayClaimMemorySaved:
        persistenceTruth
          .mayClaimMemorySaved,

      mayClaimMemoryForgotten:
        persistenceTruth
          .mayClaimMemoryForgotten,

      mayClaimSessionHandoffSaved:
        persistenceTruth
          .mayClaimSessionHandoffSaved,
    },
  };
}

function createProjectBlueprintData({
  adaptivePlan,
  context,
}) {
  return {
    activeProjectId:
      getProjectId(
        adaptivePlan,
        context
      ),

    activeProject:
      cloneValue(
        context?.activeProject ||
        getNestedValue(
          adaptivePlan,
          "contextSnapshot.activeProject",
          null
        )
      ),

    activeStage:
      cloneValue(
        context?.activeStage ||
        getNestedValue(
          adaptivePlan,
          "projectState.activeStage",
          null
        )
      ),

    activeScene:
      cloneValue(
        context?.activeScene ||
        getNestedValue(
          adaptivePlan,
          "projectState.activeScene",
          null
        )
      ),

    activeCharacter:
      cloneValue(
        context?.activeCharacter ||
        getNestedValue(
          adaptivePlan,
          "projectState.activeCharacter",
          null
        )
      ),

    memoryAvailable:
      Boolean(
        getNestedValue(
          adaptivePlan,
          "projectState.memoryAvailable",
          false
        )
      ),

    sessionHandoffAvailable:
      Boolean(
        getNestedValue(
          adaptivePlan,
          "projectState.sessionHandoffAvailable",
          false
        )
      ),

    specialistMemorySignalsPresent:
      Boolean(
        getNestedValue(
          adaptivePlan,
          "projectState.specialistMemorySignalsPresent",
          false
        )
      ),
  };
}

function validateBlueprint({
  blueprint,
  adaptivePlan,
}) {
  const issues = [];
  let sections =
    asArray(
      blueprint?.sections
    );

  const action =
    blueprint?.action;

  const maximumQuestions =
    Math.max(
      0,
      safeNumber(
        blueprint
          ?.constraints
          ?.maximumQuestions,
        0
      )
    );

  const silenceRequired =
    action ===
      COMPOSER_ACTIONS
        .RETURN_SILENCE ||
    blueprint?.length ===
      BLUEPRINT_LENGTHS.SILENT ||
    adaptivePlanRequiresSilence(
      adaptivePlan
    );

  if (silenceRequired) {
    if (sections.length > 0) {
      issues.push(
        "Removed sections because silence has precedence."
      );
    }

    sections = [];
  } else {
    const originalQuestionCount =
      sections.filter(
        (section) =>
          section?.type ===
          RESPONSE_SECTIONS
            .QUESTION
      ).length;

    sections =
      enforceQuestionLimit({
        sections,
        maximumQuestions,
      });

    if (
      originalQuestionCount >
      maximumQuestions
    ) {
      issues.push(
        "Question sections exceeded the allowed maximum and were reduced."
      );
    }
  }

  const shouldGenerateText =
    !silenceRequired;

  const constraints = {
    ...blueprint.constraints,

    maximumQuestions,

    maximumPrimarySections:
      sections.length,

    shouldGenerateText,

    shouldEndWithQuestion:
      shouldGenerateText &&
      sections.some(
        (section) =>
          section?.type ===
          RESPONSE_SECTIONS
            .QUESTION
      ),
  };

  if (
    action ===
      COMPOSER_ACTIONS
        .COMPOSE_FORGET_CONFIRMATION &&
    !constraints
      .mayClaimMemoryForgotten
  ) {
    issues.push(
      "Forget confirmation may describe intent only because deletion success is unverified."
    );
  }

  if (
    sections.some(
      (section) =>
        section?.type ===
        RESPONSE_SECTIONS
          .MEMORY_CAPTURE
    ) &&
    !constraints
      .mayClaimMemorySaved
  ) {
    issues.push(
      "Memory capture wording may not claim persistence success."
    );
  }

  if (
    sections.some(
      (section) =>
        section?.type ===
        RESPONSE_SECTIONS
          .SESSION_HANDOFF
    ) &&
    !constraints
      .mayClaimSessionHandoffSaved
  ) {
    issues.push(
      "Session handoff wording may not claim persistence success."
    );
  }

  return {
    blueprint: {
      ...blueprint,

      length:
        silenceRequired
          ? BLUEPRINT_LENGTHS
              .SILENT
          : blueprint.length,

      style: {
        ...blueprint.style,

        rhythm:
          silenceRequired
            ? RESPONSE_RHYTHMS
                .SILENT
            : blueprint
                ?.style
                ?.rhythm,

        energy:
          silenceRequired
            ? RESPONSE_ENERGY
                .QUIET
            : blueprint
                ?.style
                ?.energy,
      },

      sections,

      constraints,

      executionIntent: {
        ...blueprint
          .executionIntent,

        shouldGenerateText,

        shouldHideSpecialistMachinery:
          true,
      },
    },

    validation: {
      valid: true,
      repaired:
        issues.length > 0,
      issues,
      checkedAt:
        createTimestamp(),
    },
  };
}

function createFallbackBlueprint({
  message,
  adaptivePlan,
  context,
  error = null,
}) {
  return {
    id:
      createBlueprintId(),

    composer:
      "response-composer",

    version:
      RESPONSE_COMPOSER_VERSION,

    input: {
      message:
        cleanString(
          message
        ),
    },

    action:
      COMPOSER_ACTIONS
        .COMPOSE_ACKNOWLEDGEMENT,

    style: {
      rhythm:
        RESPONSE_RHYTHMS.STEADY,

      warmth:
        RESPONSE_WARMTH.WARM,

      directness:
        RESPONSE_DIRECTNESS
          .BALANCED,

      energy:
        RESPONSE_ENERGY.MATCHED,
    },

    length:
      BLUEPRINT_LENGTHS.SHORT,

    sections: [
      createSection({
        type:
          RESPONSE_SECTIONS
            .ACKNOWLEDGEMENT,

        purpose:
          SECTION_PURPOSES.CONNECT,

        length:
          SECTION_LENGTHS
            .ONE_SENTENCE,

        transition:
          TRANSITION_STYLES.NONE,

        instructions: [
          "Use a brief, warm acknowledgement.",
          "Do not introduce multiple new directions.",
        ],
      }),
    ],

    languageGuidance: [
      "Use natural, warm language.",
      "Keep the response brief.",
      "Do not ask more than one question.",
      "Do not make new memory claims.",
      "Do not expose internal system machinery.",
    ],

    sourceGuidance: [],

    constraints: {
      blueprintLength:
        BLUEPRINT_LENGTHS.SHORT,

      maximumQuestions: 1,

      maximumRecommendations: 1,

      maximumPrimarySections: 1,

      shouldEndWithQuestion:
        false,

      shouldGenerateText:
        true,

      shouldUseMemory:
        false,

      shouldMentionMemoryCapture:
        false,

      shouldRestoreProjectContext:
        false,

      shouldPreserveSessionHandoff:
        false,

      shouldApplyForget:
        false,

      shouldClarifyForget:
        false,

      mayClaimMemorySaved:
        false,

      mayClaimMemoryForgotten:
        false,

      mayClaimSessionHandoffSaved:
        false,

      shouldHideSpecialistMachinery:
        true,

      forbiddenPatterns: [
        "I don't understand.",
        "What do you mean?",
      ],

      forbiddenUnverifiedClaims: [
        "I saved that.",
        "I've saved that.",
        "I deleted that.",
        "I've deleted that.",
      ],
    },

    timing: {
      responseDelayMs: 0,
      silenceWindowMs: 0,
      allowCreatorToContinue:
        false,
      canCancelResponseIfCreatorContinues:
        true,
    },

    memory: {
      policy:
        "do-not-use",

      instructions: [],

      recallPlan: null,
      forgetPlan: null,
      projectMemory: null,

      shouldCapture: false,
      shouldRecall: false,

      shouldPreserveSessionHandoff:
        false,

      shouldApplyForget:
        false,

      shouldClarifyForget:
        false,

      persistence: {
        captureSucceeded:
          false,

        forgetSucceeded:
          false,

        handoffSucceeded:
          false,

        mayClaimMemorySaved:
          false,

        mayClaimMemoryForgotten:
          false,

        mayClaimSessionHandoffSaved:
          false,
      },
    },

    project: {
      activeProjectId: null,
      activeProject: null,
      activeStage: null,
      activeScene: null,
      activeCharacter: null,
      memoryAvailable: false,
      sessionHandoffAvailable:
        false,
      specialistMemorySignalsPresent:
        false,
    },

    creatorProtocol: {
      demonstrateUnderstandingFirst:
        true,

      creatorOwnsMeaning:
        true,

      creatorOwnsDirection:
        true,

      presentBehaviourLeads:
        true,

      memoryInformsWithoutControlling:
        true,

      conversationServesCreation:
        true,

      complexityStaysBehindConversation:
        true,
    },

    validation: {
      valid: true,
      repaired: false,
      issues: [],
      checkedAt:
        createTimestamp(),
    },

    adaptivePlanSnapshot:
      cloneValue(
        adaptivePlan
      ),

    contextSnapshot:
      cloneValue(
        context
      ),

    blueprintSummary:
      "Compose one short acknowledgement.",

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

function createResponseComposer() {
  function composeResponseBlueprint({
    message = "",
    adaptivePlan = null,
    context = {},
  } = {}) {
    try {
      if (
        !adaptivePlan ||
        typeof adaptivePlan !==
          "object"
      ) {
        throw new TypeError(
          "ResponseComposer requires a valid adaptivePlan."
        );
      }

      const combinedContext = {
        ...cloneValue(
          DEFAULT_COMPOSER_CONTEXT
        ),

        ...cloneValue(
          context
        ),

        creatorId:
          context?.creatorId ||
          getNestedValue(
            adaptivePlan,
            "contextSnapshot.creatorId",
            null
          ),

        activeProject:
          context?.activeProject ||
          getNestedValue(
            adaptivePlan,
            "contextSnapshot.activeProject",
            null
          ),

        activeProjectId:
          context?.activeProjectId ||
          getNestedValue(
            adaptivePlan,
            "execution.activeProjectId",
            null
          ),

        activeIdea:
          context?.activeIdea ||
          getNestedValue(
            adaptivePlan,
            "contextSnapshot.activeIdea",
            null
          ),

        activeStage:
          context?.activeStage ||
          getNestedValue(
            adaptivePlan,
            "projectState.activeStage",
            null
          ),

        activeScene:
          context?.activeScene ||
          getNestedValue(
            adaptivePlan,
            "projectState.activeScene",
            null
          ),

        activeCharacter:
          context?.activeCharacter ||
          getNestedValue(
            adaptivePlan,
            "projectState.activeCharacter",
            null
          ),

        sessionId:
          context?.sessionId ||
          getNestedValue(
            adaptivePlan,
            "contextSnapshot.sessionId",
            null
          ),

        currentTimestamp:
          context?.currentTimestamp ||
          createTimestamp(),
      };

      const action =
        resolveComposerAction(
          adaptivePlan
        );

      const blueprintLength =
        resolveBlueprintLength(
          adaptivePlan,
          action
        );

      const rhythm =
        chooseResponseRhythm({
          adaptivePlan,
          action,
        });

      const warmth =
        chooseResponseWarmth({
          adaptivePlan,
          action,
        });

      const directness =
        chooseResponseDirectness({
          adaptivePlan,
          action,
        });

      const energy =
        chooseResponseEnergy({
          adaptivePlan,
          action,
        });

      const maximumQuestions =
        getMaximumQuestions(
          adaptivePlan
        );

      const rawSections =
        buildSections({
          action,
          adaptivePlan,
          context:
            combinedContext,
        });

      const sections =
        constrainSections({
          sections:
            rawSections,

          blueprintLength,

          action,

          maximumQuestions,
        });

      const persistenceTruth =
        createPersistenceTruth({
          adaptivePlan,
        });

      const languageGuidance =
        createLanguageGuidance({
          adaptivePlan,
          rhythm,
          warmth,
          directness,
          energy,

          context:
            combinedContext,
        });

      const sourceGuidance =
        collectSourceGuidance(
          adaptivePlan
        );

      const constraints =
        createResponseConstraints({
          adaptivePlan,
          blueprintLength,
          sections,
          action,
          maximumQuestions,
          persistenceTruth,
        });

      const memory =
        createMemoryBlueprintData({
          adaptivePlan,
          persistenceTruth,
        });

      const project =
        createProjectBlueprintData({
          adaptivePlan,

          context:
            combinedContext,
        });

      const progression = {
        decision:
          getProgressionDecision(
            adaptivePlan
          ),

        primaryAction:
          getProgressionPrimaryAction(
            adaptivePlan
          ),

        requiresSilence:
          progressionRequiresSilence(
            adaptivePlan
          ),
      };

      const unvalidatedBlueprint = {
        id:
          createBlueprintId(),

        composer:
          "response-composer",

        version:
          RESPONSE_COMPOSER_VERSION,

        input: {
          message:
            cleanString(
              message
            ),
        },

        action,

        progression,

        style: {
          rhythm,
          warmth,
          directness,
          energy,

          MentorRole:
            getNestedValue(
              adaptivePlan,
              "behaviour.role",
              "listener"
            ),

          leadershipStance:
            getNestedValue(
              adaptivePlan,
              "behaviour.leadershipStance",
              "walk-beside"
            ),
        },

        length:
          blueprintLength,

        sections,

        languageGuidance,

        sourceGuidance,

        constraints,

        timing:
          cloneValue(
            getNestedValue(
              adaptivePlan,
              "execution.timing",
              {
                responseDelayMs: 0,
                silenceWindowMs: 0,
                allowCreatorToContinue:
                  false,
                canCancelResponseIfCreatorContinues:
                  true,
              }
            )
          ),

        memory,

        project,

        executionIntent: {
          shouldGenerateText:
            constraints
              .shouldGenerateText,

          shouldCaptureMemory:
            memory.shouldCapture,

          shouldRecallMemory:
            memory.shouldRecall,

          shouldPreserveSessionHandoff:
            memory
              .shouldPreserveSessionHandoff,

          shouldApplyForget:
            memory
              .shouldApplyForget,

          shouldClarifyForget:
            memory
              .shouldClarifyForget,

          shouldRestoreProjectContext:
            constraints
              .shouldRestoreProjectContext,

          mayClaimMemorySaved:
            persistenceTruth
              .mayClaimMemorySaved,

          mayClaimMemoryForgotten:
            persistenceTruth
              .mayClaimMemoryForgotten,

          mayClaimSessionHandoffSaved:
            persistenceTruth
              .mayClaimSessionHandoffSaved,

          shouldHideSpecialistMachinery:
            true,
        },

        creatorProtocol: {
          demonstrateUnderstandingFirst:
            true,

          creatorOwnsMeaning:
            true,

          creatorOwnsDirection:
            true,

          presentBehaviourLeads:
            true,

          memoryInformsWithoutControlling:
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

          conversationServesCreation:
            true,

          protectMomentum:
            true,

          protectThinkingTime:
            true,

          oneUsefulStepAtATime:
            true,

          conciseWhenBuilding:
            true,

          depthWhenInvited:
            true,

          silenceCanBeTheResponse:
            true,

          silenceHasPrecedence:
            true,

          sessionHandoffProtectsReturn:
            true,

          forgetRequestsRequireAccuracy:
            true,

          persistenceIntentIsNotPersistenceSuccess:
            true,

          responseBlueprintMustBeValidated:
            true,

          complexityStaysBehindConversation:
            true,
        },

        adaptivePlanSnapshot:
          cloneValue(
            adaptivePlan
          ),

        contextSnapshot:
          cloneValue(
            combinedContext
          ),

        blueprintSummary:
          createBlueprintSummary({
            action,
            sections,
            blueprintLength,
            rhythm,
          }),

        status:
          "composed",

        createdAt:
          createTimestamp(),
      };

      const validationResult =
        validateBlueprint({
          blueprint:
            unvalidatedBlueprint,

          adaptivePlan,
        });

      const validatedBlueprint =
        validationResult.blueprint;

      return {
        ...validatedBlueprint,

        validation:
          validationResult
            .validation,

        blueprintSummary:
          createBlueprintSummary({
            action:
              validatedBlueprint
                .action,

            sections:
              validatedBlueprint
                .sections,

            blueprintLength:
              validatedBlueprint
                .length,

            rhythm:
              validatedBlueprint
                ?.style
                ?.rhythm,
          }),

        status:
          validationResult
            .validation
            .repaired
            ? "composed-and-repaired"
            : "composed",
      };
    } catch (error) {
      console.error(
        "ResponseComposer composition error:",
        error
      );

      return (
        createFallbackBlueprint({
          message,
          adaptivePlan,
          context,
          error,
        })
      );
    }
  }

  function shouldRemainSilent(
    blueprint
  ) {
    return Boolean(
      blueprint?.length ===
        BLUEPRINT_LENGTHS
          .SILENT ||
      blueprint?.action ===
        COMPOSER_ACTIONS
          .RETURN_SILENCE ||
      blueprint
        ?.constraints
        ?.shouldGenerateText ===
        false
    );
  }

  function getSectionOrder(
    blueprint
  ) {
    return Array.isArray(
      blueprint?.sections
    )
      ? blueprint.sections.map(
          (section) =>
            section.type
        )
      : [];
  }

  function shouldMentionMemory(
    blueprint
  ) {
    return Boolean(
      blueprint
        ?.constraints
        ?.shouldUseMemory ||
      blueprint
        ?.constraints
        ?.shouldMentionMemoryCapture
    );
  }

  function mayAskQuestion(
    blueprint
  ) {
    return Boolean(
      blueprint
        ?.constraints
        ?.maximumQuestions > 0
    );
  }

  function shouldRestoreProjectContext(
    blueprint
  ) {
    return Boolean(
      blueprint
        ?.executionIntent
        ?.shouldRestoreProjectContext
    );
  }

  function shouldPreserveSessionHandoff(
    blueprint
  ) {
    return Boolean(
      blueprint
        ?.executionIntent
        ?.shouldPreserveSessionHandoff
    );
  }

  function shouldApplyForget(
    blueprint
  ) {
    return Boolean(
      blueprint
        ?.executionIntent
        ?.shouldApplyForget
    );
  }

  function shouldClarifyForget(
    blueprint
  ) {
    return Boolean(
      blueprint
        ?.executionIntent
        ?.shouldClarifyForget
    );
  }

  function mayClaimMemorySaved(
    blueprint
  ) {
    return Boolean(
      blueprint
        ?.executionIntent
        ?.mayClaimMemorySaved
    );
  }

  function mayClaimMemoryForgotten(
    blueprint
  ) {
    return Boolean(
      blueprint
        ?.executionIntent
        ?.mayClaimMemoryForgotten
    );
  }

  function mayClaimSessionHandoffSaved(
    blueprint
  ) {
    return Boolean(
      blueprint
        ?.executionIntent
        ?.mayClaimSessionHandoffSaved
    );
  }

  return {
    composeResponseBlueprint,

    shouldRemainSilent,
    getSectionOrder,
    shouldMentionMemory,
    mayAskQuestion,

    shouldRestoreProjectContext,
    shouldPreserveSessionHandoff,
    shouldApplyForget,
    shouldClarifyForget,

    mayClaimMemorySaved,
    mayClaimMemoryForgotten,
    mayClaimSessionHandoffSaved,
  };
}

function composeResponseBlueprint({
  message = "",
  adaptivePlan = null,
  context = {},
} = {}) {
  const composer =
    createResponseComposer();

  return (
    composer
      .composeResponseBlueprint({
        message,
        adaptivePlan,
        context,
      })
  );
}

export {
  RESPONSE_COMPOSER_VERSION,
  RESPONSE_SECTIONS,
  SECTION_PURPOSES,
  RESPONSE_RHYTHMS,
  RESPONSE_WARMTH,
  RESPONSE_DIRECTNESS,
  RESPONSE_ENERGY,
  BLUEPRINT_LENGTHS,
  SECTION_LENGTHS,
  TRANSITION_STYLES,
  COMPOSER_ACTIONS,
  createResponseComposer,
  composeResponseBlueprint,
};

export default createResponseComposer;
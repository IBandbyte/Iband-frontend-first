/**
 * Response Composer
 * ------------------------------------------------------------
 * The response-blueprint layer for iBand's AI Mentor —
 * The Creator.
 *
 * This module does not generate the final Mentor wording.
 *
 * It receives an AdaptiveMentorEngine plan and converts it into
 * an ordered response blueprint that a future response generator
 * or language model can execute.
 *
 * Responsibilities:
 * - Choose which response sections are required.
 * - Put those sections in the correct order.
 * - Control response length, rhythm, warmth and directness.
 * - Translate adaptive actions into compositional instructions.
 * - Respect silence, flow, information saturation and question limits.
 * - Preserve creator ownership and autonomy.
 *
 * Core principles:
 * - Intelligence and expression are separate systems.
 * - Demonstrate understanding before introducing direction.
 * - Conversation exists in service of creation.
 * - Say only what is useful now.
 * - Never make the creator repeat what has already been understood.
 * - Memory recall is an invitation, not an interruption.
 * - The response must leave the creator clearer, stronger or moving.
 */

const RESPONSE_COMPOSER_VERSION = "1.0.0";

const RESPONSE_SECTIONS = Object.freeze({
  OPENING: "opening",
  ACKNOWLEDGEMENT: "acknowledgement",
  UNDERSTANDING: "understanding",
  REFLECTION: "reflection",
  REASSURANCE: "reassurance",
  MEMORY_CAPTURE: "memory-capture",
  MEMORY_RECALL: "memory-recall",
  CONTEXT_RESTORATION: "context-restoration",
  TEACHING: "teaching",
  RECOMMENDATION: "recommendation",
  CREATIVE_DIRECTION: "creative-direction",
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
  PROTECT_CONFIDENCE: "protect-confidence",
  REDUCE_PRESSURE: "reduce-pressure",
  RESTORE_CONTEXT: "restore-context",
  INFORM: "inform",
  GUIDE: "guide",
  MOVE: "move",
  CAPTURE: "capture",
  RECALL: "recall",
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

const RESPONSE_DIRECTNESS = Object.freeze({
  VERY_DIRECT: "very-direct",
  DIRECT: "direct",
  BALANCED: "balanced",
  GENTLE: "gentle",
  INDIRECT: "indirect",
});

const RESPONSE_ENERGY = Object.freeze({
  QUIET: "quiet",
  LOW: "low",
  MATCHED: "matched",
  LIFTING: "lifting",
  HIGH: "high",
});

const BLUEPRINT_LENGTHS = Object.freeze({
  SILENT: "silent",
  ONE_LINE: "one-line",
  SHORT: "short",
  MEDIUM: "medium",
  DETAILED: "detailed",
});

const SECTION_LENGTHS = Object.freeze({
  NONE: "none",
  PHRASE: "phrase",
  ONE_SENTENCE: "one-sentence",
  TWO_SENTENCES: "two-sentences",
  SHORT_PARAGRAPH: "short-paragraph",
  MEDIUM_PARAGRAPH: "medium-paragraph",
});

const TRANSITION_STYLES = Object.freeze({
  NONE: "none",
  IMMEDIATE: "immediate",
  NATURAL: "natural",
  GENTLE: "gentle",
  ENERGETIC: "energetic",
  REFLECTIVE: "reflective",
});

const COMPOSER_ACTIONS = Object.freeze({
  RETURN_SILENCE: "return-silence",
  COMPOSE_ACKNOWLEDGEMENT:
    "compose-acknowledgement",
  COMPOSE_REFLECTION: "compose-reflection",
  COMPOSE_PRESSURE_RELEASE:
    "compose-pressure-release",
  COMPOSE_CONTEXT_RESTORATION:
    "compose-context-restoration",
  COMPOSE_CAPTURE_AND_CONTINUE:
    "compose-capture-and-continue",
  COMPOSE_DEFERRED_RECALL:
    "compose-deferred-recall",
  COMPOSE_ONE_RECOMMENDATION:
    "compose-one-recommendation",
  COMPOSE_ONE_CONCEPT:
    "compose-one-concept",
  COMPOSE_BRAINSTORMING_TURN:
    "compose-brainstorming-turn",
  COMPOSE_CREATION_HANDOFF:
    "compose-creation-handoff",
  COMPOSE_NEXT_TASK: "compose-next-task",
  COMPOSE_REFINEMENT_HANDOFF:
    "compose-refinement-handoff",
  COMPOSE_PUBLISHING_HANDOFF:
    "compose-publishing-handoff",
  COMPOSE_SESSION_PAUSE:
    "compose-session-pause",
  COMPOSE_SESSION_CLOSE:
    "compose-session-close",
});

const DEFAULT_COMPOSER_CONTEXT = Object.freeze({
  creatorName: null,
  creatorType: null,
  projectType: null,
  activeProject: null,
  activeIdea: null,

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

/**
 * Returns a current ISO timestamp.
 */
function createTimestamp() {
  return new Date().toISOString();
}

/**
 * Creates a lightweight unique id.
 */
function createBlueprintId() {
  const randomValue = Math.random()
    .toString(36)
    .slice(2, 10);

  return `response-blueprint-${Date.now()}-${randomValue}`;
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
 * Produces a clean string.
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
 * Reads a nested value safely.
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
 * Checks whether a value appears in a supplied collection.
 */
function includesValue(value, values = []) {
  return values.includes(value);
}

/**
 * Creates one ordered blueprint section.
 */
function createSection({
  type,
  purpose,
  required = true,
  length = SECTION_LENGTHS.ONE_SENTENCE,
  transition = TRANSITION_STYLES.NATURAL,
  instructions = [],
  sourceData = null,
  optional = false,
}) {
  return {
    id: `${type}-${Math.random()
      .toString(36)
      .slice(2, 8)}`,

    type,
    purpose,
    required,
    optional,
    length,
    transition,
    instructions: uniqueValues(instructions),
    sourceData: cloneValue(sourceData),
  };
}

/**
 * Maps the Adaptive Mentor response depth to the Composer's
 * supported blueprint lengths.
 */
function resolveBlueprintLength(adaptivePlan) {
  const adaptiveDepth =
    getNestedValue(
      adaptivePlan,
      "behaviour.responseDepth",
      "short"
    );

  switch (adaptiveDepth) {
    case "silent":
      return BLUEPRINT_LENGTHS.SILENT;

    case "one-line":
      return BLUEPRINT_LENGTHS.ONE_LINE;

    case "medium":
      return BLUEPRINT_LENGTHS.MEDIUM;

    case "detailed":
      return BLUEPRINT_LENGTHS.DETAILED;

    case "short":
    default:
      return BLUEPRINT_LENGTHS.SHORT;
  }
}

/**
 * Selects an overall response rhythm.
 */
function chooseResponseRhythm({
  adaptivePlan,
  action,
}) {
  const signals =
    adaptivePlan?.signals || [];

  if (
    action === COMPOSER_ACTIONS.RETURN_SILENCE
  ) {
    return RESPONSE_RHYTHMS.SILENT;
  }

  if (
    signals.includes("build-mode") ||
    action === COMPOSER_ACTIONS.COMPOSE_NEXT_TASK
  ) {
    return RESPONSE_RHYTHMS.FAST;
  }

  if (
    signals.includes("flow-mode") ||
    signals.includes("high-momentum")
  ) {
    return RESPONSE_RHYTHMS.CRISP;
  }

  if (
    signals.includes("reflection-mode") ||
    action ===
      COMPOSER_ACTIONS.COMPOSE_REFLECTION
  ) {
    return RESPONSE_RHYTHMS.REFLECTIVE;
  }

  if (
    signals.includes("recovery-mode") ||
    action ===
      COMPOSER_ACTIONS.COMPOSE_PRESSURE_RELEASE
  ) {
    return RESPONSE_RHYTHMS.GENTLE;
  }

  if (
    signals.includes("exploration-mode")
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
    return RESPONSE_RHYTHMS.ENERGETIC;
  }

  return RESPONSE_RHYTHMS.STEADY;
}

/**
 * Selects warmth based on role, action and creator state.
 */
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
    includesValue(action, [
      COMPOSER_ACTIONS.COMPOSE_REFLECTION,
      COMPOSER_ACTIONS.COMPOSE_PRESSURE_RELEASE,
      COMPOSER_ACTIONS
        .COMPOSE_CONTEXT_RESTORATION,
      COMPOSER_ACTIONS.COMPOSE_SESSION_CLOSE,
    ])
  ) {
    return RESPONSE_WARMTH.DEEPLY_WARM;
  }

  if (
    includesValue(role, [
      "listener",
      "reflector",
      "quiet-companion",
      "collaborator",
    ])
  ) {
    return RESPONSE_WARMTH.WARM;
  }

  if (role === "creative-director") {
    return RESPONSE_WARMTH.LIGHT;
  }

  return RESPONSE_WARMTH.WARM;
}

/**
 * Selects directness.
 */
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
    includesValue(action, [
      COMPOSER_ACTIONS.COMPOSE_NEXT_TASK,
      COMPOSER_ACTIONS
        .COMPOSE_CREATION_HANDOFF,
      COMPOSER_ACTIONS
        .COMPOSE_REFINEMENT_HANDOFF,
      COMPOSER_ACTIONS
        .COMPOSE_PUBLISHING_HANDOFF,
    ])
  ) {
    return RESPONSE_DIRECTNESS.VERY_DIRECT;
  }

  if (stance === "lead") {
    return RESPONSE_DIRECTNESS.DIRECT;
  }

  if (
    includesValue(action, [
      COMPOSER_ACTIONS.COMPOSE_REFLECTION,
      COMPOSER_ACTIONS.COMPOSE_DEFERRED_RECALL,
      COMPOSER_ACTIONS
        .COMPOSE_CONTEXT_RESTORATION,
    ])
  ) {
    return RESPONSE_DIRECTNESS.GENTLE;
  }

  return RESPONSE_DIRECTNESS.BALANCED;
}

/**
 * Selects response energy.
 */
function chooseResponseEnergy({
  adaptivePlan,
  action,
}) {
  const signals =
    adaptivePlan?.signals || [];

  if (
    action === COMPOSER_ACTIONS.RETURN_SILENCE
  ) {
    return RESPONSE_ENERGY.QUIET;
  }

  if (
    signals.includes("low-energy") ||
    signals.includes("recovery-mode")
  ) {
    return RESPONSE_ENERGY.LOW;
  }

  if (
    signals.includes("high-momentum") ||
    signals.includes("build-mode")
  ) {
    return RESPONSE_ENERGY.HIGH;
  }

  if (
    action ===
      COMPOSER_ACTIONS.COMPOSE_PRESSURE_RELEASE
  ) {
    return RESPONSE_ENERGY.QUIET;
  }

  if (
    action ===
      COMPOSER_ACTIONS.COMPOSE_CREATION_HANDOFF
  ) {
    return RESPONSE_ENERGY.LIFTING;
  }

  return RESPONSE_ENERGY.MATCHED;
}

/**
 * Maps the Adaptive Mentor action to a Composer action.
 */
function resolveComposerAction(adaptivePlan) {
  const adaptiveAction =
    getNestedValue(
      adaptivePlan,
      "primaryAction.action",
      "acknowledge-briefly"
    );

  switch (adaptiveAction) {
    case "wait":
      return COMPOSER_ACTIONS.RETURN_SILENCE;

    case "reflect-gently":
      return COMPOSER_ACTIONS.COMPOSE_REFLECTION;

    case "release-pressure":
      return COMPOSER_ACTIONS
        .COMPOSE_PRESSURE_RELEASE;

    case "restore-context":
      return COMPOSER_ACTIONS
        .COMPOSE_CONTEXT_RESTORATION;

    case "capture-and-continue":
      return COMPOSER_ACTIONS
        .COMPOSE_CAPTURE_AND_CONTINUE;

    case "recall-with-permission":
      return COMPOSER_ACTIONS
        .COMPOSE_DEFERRED_RECALL;

    case "offer-one-recommendation":
      return COMPOSER_ACTIONS
        .COMPOSE_ONE_RECOMMENDATION;

    case "teach-one-concept":
      return COMPOSER_ACTIONS
        .COMPOSE_ONE_CONCEPT;

    case "continue-brainstorming":
      return COMPOSER_ACTIONS
        .COMPOSE_BRAINSTORMING_TURN;

    case "move-to-creation":
      return COMPOSER_ACTIONS
        .COMPOSE_CREATION_HANDOFF;

    case "move-to-next-task":
      return COMPOSER_ACTIONS
        .COMPOSE_NEXT_TASK;

    case "move-to-refinement":
      return COMPOSER_ACTIONS
        .COMPOSE_REFINEMENT_HANDOFF;

    case "move-to-publishing":
      return COMPOSER_ACTIONS
        .COMPOSE_PUBLISHING_HANDOFF;

    case "save-and-pause":
      return COMPOSER_ACTIONS
        .COMPOSE_SESSION_PAUSE;

    case "end-positively":
      return COMPOSER_ACTIONS
        .COMPOSE_SESSION_CLOSE;

    case "listen-and-invite":
    case "ask-one-question":
    case "acknowledge-briefly":
    default:
      return COMPOSER_ACTIONS
        .COMPOSE_ACKNOWLEDGEMENT;
  }
}

/**
 * Creates the short acknowledgement blueprint.
 */
function buildAcknowledgementSections({
  adaptivePlan,
}) {
  const sections = [
    createSection({
      type: RESPONSE_SECTIONS.ACKNOWLEDGEMENT,
      purpose: SECTION_PURPOSES.CONNECT,
      length: SECTION_LENGTHS.ONE_SENTENCE,
      transition: TRANSITION_STYLES.NONE,
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

  if (maximumQuestions > 0) {
    sections.push(
      createSection({
        type: RESPONSE_SECTIONS.QUESTION,
        purpose: SECTION_PURPOSES.INVITE,
        length: SECTION_LENGTHS.ONE_SENTENCE,
        transition: TRANSITION_STYLES.NATURAL,
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

/**
 * Creates a reflection blueprint.
 */
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
      type: RESPONSE_SECTIONS.UNDERSTANDING,
      purpose:
        SECTION_PURPOSES.PROVE_LISTENING,
      length: SECTION_LENGTHS.ONE_SENTENCE,
      transition: TRANSITION_STYLES.NONE,
      instructions: [
        "Reflect what has genuinely been understood.",
        "Do not begin by saying that the Mentor does not understand.",
        "Use evidence from the creator's own words or actions.",
      ],
    }),

    createSection({
      type: RESPONSE_SECTIONS.REFLECTION,
      purpose:
        SECTION_PURPOSES.PROTECT_CONFIDENCE,
      length:
        SECTION_LENGTHS.SHORT_PARAGRAPH,
      transition:
        TRANSITION_STYLES.REFLECTIVE,
      instructions: [
        "Present the observation as a possibility, not a verdict.",
        "Ask permission first when the reflection is personal.",
        "Explain the evidence briefly.",
        "Allow the creator to confirm, reject or refine it.",
      ],
      sourceData: candidate,
    }),

    createSection({
      type: RESPONSE_SECTIONS.QUESTION,
      purpose: SECTION_PURPOSES.INVITE,
      length: SECTION_LENGTHS.ONE_SENTENCE,
      transition: TRANSITION_STYLES.GENTLE,
      optional: true,
      instructions: [
        "Invite the creator to say whether the reflection feels accurate.",
        "Do not pressure them to agree.",
      ],
    }),
  ];
}

/**
 * Creates a pressure-release blueprint.
 */
function buildPressureReleaseSections() {
  return [
    createSection({
      type: RESPONSE_SECTIONS.ACKNOWLEDGEMENT,
      purpose: SECTION_PURPOSES.CONNECT,
      length: SECTION_LENGTHS.ONE_SENTENCE,
      transition: TRANSITION_STYLES.NONE,
      instructions: [
        "Acknowledge the difficulty without dramatizing it.",
        "Use calm and natural language.",
      ],
    }),

    createSection({
      type: RESPONSE_SECTIONS.REASSURANCE,
      purpose:
        SECTION_PURPOSES.REDUCE_PRESSURE,
      length: SECTION_LENGTHS.TWO_SENTENCES,
      transition: TRANSITION_STYLES.GENTLE,
      instructions: [
        "Confirm that enough useful material already exists.",
        "Remove any expectation that the missing idea must return immediately.",
        "Trust the creator's mind to continue working in its own time.",
      ],
    }),

    createSection({
      type: RESPONSE_SECTIONS.NEXT_STEP,
      purpose: SECTION_PURPOSES.MOVE,
      length: SECTION_LENGTHS.ONE_SENTENCE,
      transition: TRANSITION_STYLES.NATURAL,
      instructions: [
        "Offer to continue using what is already known.",
        "Give one simple next action only.",
      ],
    }),

    createSection({
      type: RESPONSE_SECTIONS.OPEN_DOOR,
      purpose: SECTION_PURPOSES.INVITE,
      length: SECTION_LENGTHS.ONE_SENTENCE,
      transition: TRANSITION_STYLES.GENTLE,
      instructions: [
        "Leave the door open for the missing thought to return later.",
        "Use language such as 'I'm all ears' only when it fits the established relationship.",
      ],
    }),
  ];
}

/**
 * Creates a context-restoration blueprint.
 */
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
        RESPONSE_SECTIONS.CONTEXT_RESTORATION,
      purpose:
        SECTION_PURPOSES.RESTORE_CONTEXT,
      length:
        SECTION_LENGTHS.SHORT_PARAGRAPH,
      transition: TRANSITION_STYLES.GENTLE,
      instructions: [
        "Briefly reconstruct the most relevant recent conversation landmarks.",
        "Use the creator's own language where possible.",
        "Do not invent or replace the missing thought.",
        "Keep the recap short enough to avoid increasing pressure.",
      ],
      sourceData: landmarks,
    }),

    createSection({
      type: RESPONSE_SECTIONS.QUESTION,
      purpose: SECTION_PURPOSES.INVITE,
      length: SECTION_LENGTHS.ONE_SENTENCE,
      transition: TRANSITION_STYLES.GENTLE,
      instructions: [
        "Ask whether returning to that context reconnects the creator with the thought.",
        "Make clear that it is fine if nothing returns yet.",
      ],
    }),
  ];
}

/**
 * Creates Capture → Reassure → Continue.
 */
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
        RESPONSE_SECTIONS.MEMORY_CAPTURE,
      purpose: SECTION_PURPOSES.CAPTURE,
      length: SECTION_LENGTHS.ONE_SENTENCE,
      transition: TRANSITION_STYLES.NONE,
      instructions: [
        "Confirm that the thought is worth capturing.",
        "State that it has been added to memory only when the memory action has actually succeeded or is guaranteed.",
        "Do not falsely claim storage.",
      ],
      sourceData:
        memoryPlan?.instructions || [],
    }),

    createSection({
      type: RESPONSE_SECTIONS.UNDERSTANDING,
      purpose:
        SECTION_PURPOSES.PROVE_LISTENING,
      length: SECTION_LENGTHS.TWO_SENTENCES,
      transition: TRANSITION_STYLES.GENTLE,
      instructions: [
        "Reflect that the creator appears to have wanted to get the thought out without opening the whole subject.",
        "Use tentative language such as 'It sounds like' rather than claiming certainty.",
        "Confirm that this is perfectly acceptable.",
      ],
    }),

    createSection({
      type: RESPONSE_SECTIONS.NEXT_STEP,
      purpose: SECTION_PURPOSES.MOVE,
      length: SECTION_LENGTHS.ONE_SENTENCE,
      transition: TRANSITION_STYLES.NATURAL,
      instructions: [
        "Return smoothly to the task that was active before the detour.",
        context?.previousTask
          ? `Return to: ${context.previousTask}.`
          : "Refer naturally to the previous task.",
      ],
      sourceData: {
        previousTask:
          context?.previousTask || null,
      },
    }),

    createSection({
      type: RESPONSE_SECTIONS.OPEN_DOOR,
      purpose: SECTION_PURPOSES.INVITE,
      length: SECTION_LENGTHS.ONE_SENTENCE,
      transition: TRANSITION_STYLES.GENTLE,
      instructions: [
        "Remind the creator that the subject can be revisited whenever they are ready.",
        "Do not set an artificial deadline.",
      ],
    }),
  ];
}

/**
 * Creates a deferred-memory recall blueprint.
 */
function buildDeferredRecallSections({
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
      type: RESPONSE_SECTIONS.MEMORY_RECALL,
      purpose: SECTION_PURPOSES.RECALL,
      length:
        SECTION_LENGTHS.SHORT_PARAGRAPH,
      transition: TRANSITION_STYLES.GENTLE,
      instructions: [
        "Introduce the memory naturally.",
        "State approximately when it was mentioned only if known.",
        "Explain briefly why it appears relevant now.",
        "When appropriate, mention that it was previously captured rather than explored to protect the creator's flow.",
        "Do not imply that the creator forgot.",
      ],
      sourceData: recall,
    }),

    createSection({
      type: RESPONSE_SECTIONS.QUESTION,
      purpose: SECTION_PURPOSES.INVITE,
      length: SECTION_LENGTHS.ONE_SENTENCE,
      transition: TRANSITION_STYLES.GENTLE,
      instructions: [
        "Ask whether the creator would like to revisit the subject.",
        "Also provide a natural option to keep moving.",
        "The memory remains optional.",
      ],
    }),
  ];
}

/**
 * Creates a one-recommendation blueprint.
 */
function buildOneRecommendationSections({
  context,
}) {
  return [
    createSection({
      type: RESPONSE_SECTIONS.RECOMMENDATION,
      purpose: SECTION_PURPOSES.GUIDE,
      length: SECTION_LENGTHS.ONE_SENTENCE,
      transition: TRANSITION_STYLES.NONE,
      instructions: [
        "Give one clear recommendation.",
        "Do not provide multiple alternatives.",
        "Lead with the recommendation rather than background explanation.",
      ],
    }),

    createSection({
      type: RESPONSE_SECTIONS.NEXT_STEP,
      purpose: SECTION_PURPOSES.MOVE,
      length: SECTION_LENGTHS.ONE_SENTENCE,
      transition: TRANSITION_STYLES.IMMEDIATE,
      instructions: [
        "Give one executable next action.",
        context?.nextTask
          ? `Use this next task: ${context.nextTask}.`
          : "Choose the smallest useful action.",
      ],
      sourceData: {
        nextTask: context?.nextTask || null,
      },
    }),
  ];
}

/**
 * Creates a teaching blueprint.
 */
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
      type: RESPONSE_SECTIONS.UNDERSTANDING,
      purpose:
        SECTION_PURPOSES.PROVE_LISTENING,
      length: SECTION_LENGTHS.ONE_SENTENCE,
      transition: TRANSITION_STYLES.NONE,
      instructions: [
        "Identify the exact concept the creator wants to understand.",
        "Do not teach beyond the requested scope.",
      ],
    }),

    createSection({
      type: RESPONSE_SECTIONS.TEACHING,
      purpose: SECTION_PURPOSES.INFORM,
      length:
        SECTION_LENGTHS.MEDIUM_PARAGRAPH,
      transition: TRANSITION_STYLES.NATURAL,
      instructions: [
        "Explain one concept only.",
        "Use the creator's known learning preferences where available.",
        "Prefer a concrete example or analogy over abstract jargon.",
        "Do not turn the response into a full course.",
      ],
    }),

    createSection({
      type: RESPONSE_SECTIONS.NEXT_STEP,
      purpose: SECTION_PURPOSES.MOVE,
      length: SECTION_LENGTHS.ONE_SENTENCE,
      transition: TRANSITION_STYLES.NATURAL,
      instructions: [
        "Offer a small way to apply the concept immediately.",
        "Learning should return the creator to doing.",
      ],
    }),
  ];

  if (maximumQuestions > 0) {
    sections.push(
      createSection({
        type: RESPONSE_SECTIONS.QUESTION,
        purpose: SECTION_PURPOSES.INVITE,
        length: SECTION_LENGTHS.ONE_SENTENCE,
        transition: TRANSITION_STYLES.GENTLE,
        optional: true,
        instructions: [
          "Ask whether the concept now makes sense or whether one part needs another example.",
          "Do not introduce a second concept.",
        ],
      })
    );
  }

  return sections;
}

/**
 * Creates a brainstorming-turn blueprint.
 */
function buildBrainstormingSections() {
  return [
    createSection({
      type: RESPONSE_SECTIONS.ACKNOWLEDGEMENT,
      purpose: SECTION_PURPOSES.CONNECT,
      length: SECTION_LENGTHS.ONE_SENTENCE,
      transition: TRANSITION_STYLES.NONE,
      instructions: [
        "Respond to the creator's latest idea with genuine curiosity.",
        "Do not evaluate the idea too early.",
      ],
    }),

    createSection({
      type: RESPONSE_SECTIONS.REFLECTION,
      purpose:
        SECTION_PURPOSES.PROVE_LISTENING,
      length: SECTION_LENGTHS.ONE_SENTENCE,
      transition: TRANSITION_STYLES.NATURAL,
      instructions: [
        "Echo the most interesting direction without taking ownership.",
        "Do not complete the creator's idea for them.",
      ],
    }),

    createSection({
      type: RESPONSE_SECTIONS.QUESTION,
      purpose: SECTION_PURPOSES.INVITE,
      length: SECTION_LENGTHS.ONE_SENTENCE,
      transition:
        TRANSITION_STYLES.REFLECTIVE,
      instructions: [
        "Ask one question that helps the creator discover the next part.",
        "Prefer imagination, feeling, recognition or possibility language.",
      ],
    }),
  ];
}

/**
 * Creates an action handoff blueprint.
 */
function buildActionHandoffSections({
  action,
  context,
}) {
  const actionInstructions = {
    [COMPOSER_ACTIONS.COMPOSE_CREATION_HANDOFF]: [
      "Confirm that enough is known to begin a first version.",
      "Move directly into creation.",
      "Do not request perfect clarity.",
      "Allow the work to evolve during creation.",
    ],

    [COMPOSER_ACTIONS.COMPOSE_NEXT_TASK]: [
      "State the next task immediately.",
      "Do not reopen the previous discussion.",
      "Provide only the information needed to continue.",
      "Protect build momentum.",
    ],

    [COMPOSER_ACTIONS.COMPOSE_REFINEMENT_HANDOFF]: [
      "Move directly into refinement.",
      "Identify the single highest-value improvement first.",
      "Do not redesign the entire project unless requested.",
    ],

    [COMPOSER_ACTIONS.COMPOSE_PUBLISHING_HANDOFF]: [
      "Confirm that the creation is ready for the publishing stage.",
      "Give the next publishing action clearly.",
      "Do not introduce unrelated creative changes.",
    ],
  };

  return [
    createSection({
      type:
        RESPONSE_SECTIONS.CREATIVE_DIRECTION,
      purpose: SECTION_PURPOSES.GUIDE,
      length: SECTION_LENGTHS.ONE_SENTENCE,
      transition: TRANSITION_STYLES.NONE,
      instructions:
        actionInstructions[action] || [
          "Move directly into the next creative stage.",
        ],
    }),

    createSection({
      type: RESPONSE_SECTIONS.NEXT_STEP,
      purpose: SECTION_PURPOSES.MOVE,
      length: SECTION_LENGTHS.ONE_SENTENCE,
      transition: TRANSITION_STYLES.IMMEDIATE,
      instructions: [
        context?.nextTask
          ? `Execute this next task: ${context.nextTask}.`
          : "State one concrete next action.",
        "Do not add an unnecessary closing question.",
      ],
      sourceData: {
        nextTask: context?.nextTask || null,
        activeProject:
          context?.activeProject || null,
      },
    }),
  ];
}

/**
 * Creates a session-pause blueprint.
 */
function buildSessionPauseSections({
  context,
}) {
  return [
    createSection({
      type: RESPONSE_SECTIONS.SESSION_RECAP,
      purpose: SECTION_PURPOSES.CAPTURE,
      length:
        SECTION_LENGTHS.SHORT_PARAGRAPH,
      transition: TRANSITION_STYLES.NONE,
      instructions: [
        "Briefly state what was completed.",
        "Preserve the creator's place without adding new work.",
        "Keep the recap concise.",
      ],
    }),

    createSection({
      type: RESPONSE_SECTIONS.NEXT_STEP,
      purpose: SECTION_PURPOSES.MOVE,
      length: SECTION_LENGTHS.ONE_SENTENCE,
      transition: TRANSITION_STYLES.GENTLE,
      instructions: [
        "Name the exact return point.",
        context?.returnPoint
          ? `Return point: ${context.returnPoint}.`
          : "Identify the next unfinished task.",
      ],
      sourceData: {
        returnPoint:
          context?.returnPoint || null,
      },
    }),

    createSection({
      type: RESPONSE_SECTIONS.CLOSING,
      purpose: SECTION_PURPOSES.CLOSE,
      length: SECTION_LENGTHS.ONE_SENTENCE,
      transition: TRANSITION_STYLES.GENTLE,
      instructions: [
        "End without guilt, urgency or pressure.",
        "Do not introduce another question or task.",
      ],
    }),
  ];
}

/**
 * Creates a positive session-close blueprint.
 */
function buildSessionCloseSections() {
  return [
    createSection({
      type: RESPONSE_SECTIONS.ACKNOWLEDGEMENT,
      purpose: SECTION_PURPOSES.CONNECT,
      length: SECTION_LENGTHS.ONE_SENTENCE,
      transition: TRANSITION_STYLES.NONE,
      instructions: [
        "Acknowledge the progress made in the session.",
        "Use evidence rather than exaggerated praise.",
      ],
    }),

    createSection({
      type: RESPONSE_SECTIONS.OPEN_DOOR,
      purpose: SECTION_PURPOSES.INVITE,
      length: SECTION_LENGTHS.ONE_SENTENCE,
      transition: TRANSITION_STYLES.GENTLE,
      instructions: [
        "Leave the return path open.",
        "Do not require a response.",
      ],
    }),

    createSection({
      type: RESPONSE_SECTIONS.CLOSING,
      purpose: SECTION_PURPOSES.CLOSE,
      length: SECTION_LENGTHS.ONE_SENTENCE,
      transition: TRANSITION_STYLES.GENTLE,
      instructions: [
        "Close warmly and naturally.",
        "Do not add another topic.",
      ],
    }),
  ];
}

/**
 * Builds sections for the selected Composer action.
 */
function buildSections({
  action,
  adaptivePlan,
  context,
}) {
  switch (action) {
    case COMPOSER_ACTIONS.RETURN_SILENCE:
      return [];

    case COMPOSER_ACTIONS.COMPOSE_REFLECTION:
      return buildReflectionSections({
        adaptivePlan,
      });

    case COMPOSER_ACTIONS
      .COMPOSE_PRESSURE_RELEASE:
      return buildPressureReleaseSections();

    case COMPOSER_ACTIONS
      .COMPOSE_CONTEXT_RESTORATION:
      return buildContextRestorationSections({
        adaptivePlan,
      });

    case COMPOSER_ACTIONS
      .COMPOSE_CAPTURE_AND_CONTINUE:
      return buildCaptureAndContinueSections({
        adaptivePlan,
        context,
      });

    case COMPOSER_ACTIONS
      .COMPOSE_DEFERRED_RECALL:
      return buildDeferredRecallSections({
        adaptivePlan,
      });

    case COMPOSER_ACTIONS
      .COMPOSE_ONE_RECOMMENDATION:
      return buildOneRecommendationSections({
        context,
      });

    case COMPOSER_ACTIONS.COMPOSE_ONE_CONCEPT:
      return buildTeachingSections({
        adaptivePlan,
      });

    case COMPOSER_ACTIONS
      .COMPOSE_BRAINSTORMING_TURN:
      return buildBrainstormingSections();

    case COMPOSER_ACTIONS
      .COMPOSE_CREATION_HANDOFF:
    case COMPOSER_ACTIONS.COMPOSE_NEXT_TASK:
    case COMPOSER_ACTIONS
      .COMPOSE_REFINEMENT_HANDOFF:
    case COMPOSER_ACTIONS
      .COMPOSE_PUBLISHING_HANDOFF:
      return buildActionHandoffSections({
        action,
        context,
      });

    case COMPOSER_ACTIONS
      .COMPOSE_SESSION_PAUSE:
      return buildSessionPauseSections({
        context,
      });

    case COMPOSER_ACTIONS
      .COMPOSE_SESSION_CLOSE:
      return buildSessionCloseSections();

    case COMPOSER_ACTIONS
      .COMPOSE_ACKNOWLEDGEMENT:
    default:
      return buildAcknowledgementSections({
        adaptivePlan,
      });
  }
}

/**
 * Applies overall-length constraints to the section list.
 */
function constrainSections({
  sections,
  blueprintLength,
}) {
  if (
    blueprintLength ===
    BLUEPRINT_LENGTHS.SILENT
  ) {
    return [];
  }

  if (
    blueprintLength ===
    BLUEPRINT_LENGTHS.ONE_LINE
  ) {
    const preferred =
      sections.find((section) =>
        includesValue(section.type, [
          RESPONSE_SECTIONS.NEXT_STEP,
          RESPONSE_SECTIONS.RECOMMENDATION,
          RESPONSE_SECTIONS
            .CREATIVE_DIRECTION,
          RESPONSE_SECTIONS.ACKNOWLEDGEMENT,
        ])
      ) || sections[0];

    if (!preferred) {
      return [];
    }

    return [
      {
        ...preferred,
        length:
          SECTION_LENGTHS.ONE_SENTENCE,
      },
    ];
  }

  if (
    blueprintLength ===
    BLUEPRINT_LENGTHS.SHORT
  ) {
    return sections
      .filter((section) => !section.optional)
      .slice(0, 3)
      .map((section) => ({
        ...section,
        length:
          section.length ===
          SECTION_LENGTHS.MEDIUM_PARAGRAPH
            ? SECTION_LENGTHS.SHORT_PARAGRAPH
            : section.length,
      }));
  }

  if (
    blueprintLength ===
    BLUEPRINT_LENGTHS.MEDIUM
  ) {
    return sections.slice(0, 5);
  }

  return sections;
}

/**
 * Builds lexical and stylistic guidance.
 */
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

    "Do not narrate the internal engine decisions.",

    "Do not mention confidence scores, classifications or system rules.",

    "Match established creator vocabulary only when it feels natural.",

    context?.establishedVocabulary?.length
      ? `Relevant creator vocabulary: ${context.establishedVocabulary.join(
          ", "
        )}.`
      : null,

    context?.sharedMeanings?.length
      ? "Respect established shared meanings and relationship shorthand."
      : null,

    context?.sharedRituals?.length
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
  ]);
}

/**
 * Creates hard response constraints.
 */
function createResponseConstraints({
  adaptivePlan,
  blueprintLength,
  sections,
}) {
  const maximumQuestions =
    getNestedValue(
      adaptivePlan,
      "behaviour.questionPolicy.maximumQuestions",
      0
    );

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
      sections.some(
        (section) =>
          section.type ===
          RESPONSE_SECTIONS.QUESTION
      ),

    shouldGenerateText:
      blueprintLength !==
      BLUEPRINT_LENGTHS.SILENT,

    shouldUseMemory:
      includesValue(
        getNestedValue(
          adaptivePlan,
          "behaviour.memoryPolicy",
          "inform-silently"
        ),
        [
          "recall-with-permission",
          "capture-and-recall",
        ]
      ),

    shouldMentionMemoryCapture:
      sections.some(
        (section) =>
          section.type ===
          RESPONSE_SECTIONS.MEMORY_CAPTURE
      ),

    forbiddenPatterns: [
      "I don't understand.",
      "What do you mean?",
      "Explain that again.",
      "As an AI language model",
      "Here are five options",
      "You always",
      "You never",
      "I know exactly how you feel",
    ],
  };
}

/**
 * Combines source guidance from the Adaptive Mentor plan.
 */
function collectSourceGuidance(adaptivePlan) {
  return uniqueValues([
    ...(adaptivePlan?.responseGuidance || []),

    "Follow the response sections in their supplied order.",

    "Do not add sections that are absent from the blueprint.",

    "Do not turn an optional section into a required section.",

    "Do not expose internal planning or memory structures.",

    "The final wording should sound like one coherent response, not assembled modules.",
  ]);
}

/**
 * Creates a concise human-readable summary.
 */
function createBlueprintSummary({
  action,
  sections,
  blueprintLength,
  rhythm,
}) {
  const sectionNames =
    sections.length > 0
      ? sections
          .map((section) => section.type)
          .join(" → ")
      : "silence";

  return (
    `Compose ${action} using ${blueprintLength} length ` +
    `and ${rhythm} rhythm. ` +
    `Section order: ${sectionNames}.`
  );
}

/**
 * Creates a safe fallback response blueprint.
 */
function createFallbackBlueprint({
  message,
  adaptivePlan,
  context,
  error = null,
}) {
  return {
    id: createBlueprintId(),
    composer: "response-composer",
    version: RESPONSE_COMPOSER_VERSION,

    input: {
      message: cleanString(message),
    },

    action:
      COMPOSER_ACTIONS
        .COMPOSE_ACKNOWLEDGEMENT,

    style: {
      rhythm: RESPONSE_RHYTHMS.STEADY,
      warmth: RESPONSE_WARMTH.WARM,
      directness:
        RESPONSE_DIRECTNESS.BALANCED,
      energy: RESPONSE_ENERGY.MATCHED,
    },

    length: BLUEPRINT_LENGTHS.SHORT,

    sections: [
      createSection({
        type:
          RESPONSE_SECTIONS.ACKNOWLEDGEMENT,
        purpose: SECTION_PURPOSES.CONNECT,
        length:
          SECTION_LENGTHS.ONE_SENTENCE,
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
    ],

    sourceGuidance: [],

    constraints: {
      blueprintLength:
        BLUEPRINT_LENGTHS.SHORT,
      maximumQuestions: 1,
      maximumRecommendations: 1,
      maximumPrimarySections: 1,
      shouldEndWithQuestion: false,
      shouldGenerateText: true,
      shouldUseMemory: false,
      shouldMentionMemoryCapture: false,
      forbiddenPatterns: [
        "I don't understand.",
        "What do you mean?",
      ],
    },

    adaptivePlanSnapshot:
      cloneValue(adaptivePlan),

    contextSnapshot: cloneValue(context),

    blueprintSummary:
      "Compose one short acknowledgement.",

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
 * Creates the Response Composer service.
 */
function createResponseComposer() {
  /**
   * Produces a structured response blueprint.
   *
   * @param {Object} input
   * @param {string} input.message
   * @param {Object} input.adaptivePlan
   * @param {Object} [input.context]
   */
  function composeResponseBlueprint({
    message = "",
    adaptivePlan = null,
    context = {},
  } = {}) {
    try {
      if (
        !adaptivePlan ||
        typeof adaptivePlan !== "object"
      ) {
        throw new TypeError(
          "ResponseComposer requires a valid adaptivePlan."
        );
      }

      const combinedContext = {
        ...cloneValue(
          DEFAULT_COMPOSER_CONTEXT
        ),
        ...cloneValue(context),

        activeProject:
          context?.activeProject ||
          getNestedValue(
            adaptivePlan,
            "contextSnapshot.activeProject",
            null
          ),

        activeIdea:
          context?.activeIdea ||
          getNestedValue(
            adaptivePlan,
            "contextSnapshot.activeIdea",
            null
          ),

        currentTimestamp:
          context?.currentTimestamp ||
          createTimestamp(),
      };

      const action =
        resolveComposerAction(adaptivePlan);

      const blueprintLength =
        resolveBlueprintLength(adaptivePlan);

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

      const rawSections = buildSections({
        action,
        adaptivePlan,
        context: combinedContext,
      });

      const sections =
        constrainSections({
          sections: rawSections,
          blueprintLength,
        });

      const languageGuidance =
        createLanguageGuidance({
          adaptivePlan,
          rhythm,
          warmth,
          directness,
          energy,
          context: combinedContext,
        });

      const sourceGuidance =
        collectSourceGuidance(adaptivePlan);

      const constraints =
        createResponseConstraints({
          adaptivePlan,
          blueprintLength,
          sections,
        });

      return {
        id: createBlueprintId(),
        composer: "response-composer",
        version:
          RESPONSE_COMPOSER_VERSION,

        input: {
          message: cleanString(message),
        },

        action,

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

        length: blueprintLength,

        sections,

        languageGuidance,

        sourceGuidance,

        constraints,

        timing: cloneValue(
          getNestedValue(
            adaptivePlan,
            "execution.timing",
            {
              responseDelayMs: 0,
              silenceWindowMs: 0,
              allowCreatorToContinue: false,
              canCancelResponseIfCreatorContinues:
                true,
            }
          )
        ),

        memory: {
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
        },

        creatorProtocol: {
          demonstrateUnderstandingFirst: true,
          creatorOwnsMeaning: true,
          creatorOwnsDirection: true,
          presentBehaviourLeads: true,
          memoryInformsWithoutControlling:
            true,
          conversationServesCreation: true,
          protectMomentum: true,
          protectThinkingTime: true,
          oneUsefulStepAtATime: true,
          conciseWhenBuilding: true,
          depthWhenInvited: true,
          silenceCanBeTheResponse: true,
        },

        adaptivePlanSnapshot:
          cloneValue(adaptivePlan),

        contextSnapshot:
          cloneValue(combinedContext),

        blueprintSummary:
          createBlueprintSummary({
            action,
            sections,
            blueprintLength,
            rhythm,
          }),

        status: "composed",

        createdAt: createTimestamp(),
      };
    } catch (error) {
      console.error(
        "ResponseComposer composition error:",
        error
      );

      return createFallbackBlueprint({
        message,
        adaptivePlan,
        context,
        error,
      });
    }
  }

  /**
   * Checks whether the blueprint intentionally requests silence.
   */
  function shouldRemainSilent(blueprint) {
    return Boolean(
      blueprint?.length ===
        BLUEPRINT_LENGTHS.SILENT ||
      blueprint?.action ===
        COMPOSER_ACTIONS.RETURN_SILENCE ||
      blueprint?.constraints
        ?.shouldGenerateText === false
    );
  }

  /**
   * Returns the ordered response section types.
   */
  function getSectionOrder(blueprint) {
    return Array.isArray(blueprint?.sections)
      ? blueprint.sections.map(
          (section) => section.type
        )
      : [];
  }

  /**
   * Checks whether memory should be mentioned explicitly.
   */
  function shouldMentionMemory(
    blueprint
  ) {
    return Boolean(
      blueprint?.constraints
        ?.shouldUseMemory ||
      blueprint?.constraints
        ?.shouldMentionMemoryCapture
    );
  }

  /**
   * Checks whether the final response may ask a question.
   */
  function mayAskQuestion(blueprint) {
    return Boolean(
      blueprint?.constraints
        ?.maximumQuestions > 0
    );
  }

  return {
    composeResponseBlueprint,
    shouldRemainSilent,
    getSectionOrder,
    shouldMentionMemory,
    mayAskQuestion,
  };
}

/**
 * Convenience method for one-off response composition.
 */
function composeResponseBlueprint({
  message = "",
  adaptivePlan = null,
  context = {},
} = {}) {
  const composer =
    createResponseComposer();

  return composer.composeResponseBlueprint({
    message,
    adaptivePlan,
    context,
  });
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
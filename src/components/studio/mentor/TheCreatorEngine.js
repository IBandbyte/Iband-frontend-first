/**
 * The Creator Engine
 * ------------------------------------------------------------
 * The decision-making foundation for iBand's AI Mentor.
 *
 * The engine does not generate the final mentor message.
 * It analyses the creator's input and returns a structured
 * conversation plan for the UI or AI conversation layer.
 *
 * Core philosophy:
 * - Protect the Creator.
 * - Curiosity before criticism.
 * - The human is always the creator.
 * - Encourage ownership, confidence and discovery.
 * - Never make someone regret sharing an idea.
 */

const CREATOR_STAGES = Object.freeze({
  NEW: "new",
  EXPLORING: "exploring",
  BLOCKED: "blocked",
  BUILDING_CONFIDENCE: "building-confidence",
  CREATING: "creating",
  REFINING: "refining",
  PUBLISHING: "publishing",
  GROWING: "growing",
  MENTORING_OTHERS: "mentoring-others",
});

const CREATOR_INTENTS = Object.freeze({
  IMAGINE: "imagine",
  REMEMBER: "remember",
  DISCOVER: "discover",
  REFLECT: "reflect",
  LEARN: "learn",
  SOLVE: "solve",
  GENERATE: "generate",
  REFINE: "refine",
  PUBLISH: "publish",
  SHARE_IDEA: "share-idea",
  SEEK_REASSURANCE: "seek-reassurance",
  UNKNOWN: "unknown",
});

const EMOTIONAL_STATES = Object.freeze({
  EXCITED: "excited",
  CURIOUS: "curious",
  STUCK: "stuck",
  DOUBTING: "doubting",
  OVERWHELMED: "overwhelmed",
  CONFIDENT: "confident",
  CELEBRATING: "celebrating",
  DISAPPOINTED: "disappointed",
  CALM: "calm",
  UNCERTAIN: "uncertain",
  NEUTRAL: "neutral",
});

const MENTOR_STRATEGIES = Object.freeze({
  LISTEN: "listen",
  ENCOURAGE: "encourage",
  EXPLORE_IDEA: "explore-idea",
  ASK_IMAGINATIVE_QUESTION: "ask-imaginative-question",
  ASK_REFLECTIVE_QUESTION: "ask-reflective-question",
  OFFER_PERSPECTIVE: "offer-perspective",
  REFLECT_PATTERN: "reflect-pattern",
  BREAK_INTO_STEPS: "break-into-steps",
  GENTLE_CHALLENGE: "gentle-challenge",
  CELEBRATE_PROGRESS: "celebrate-progress",
  OPEN_INSPIRATION_DRAWER: "open-inspiration-drawer",
  PREPARE_TO_CREATE: "prepare-to-create",
  PREPARE_TO_PUBLISH: "prepare-to-publish",
  PROTECT_FRAGILE_IDEA: "protect-fragile-idea",
});

const NEXT_ACTIONS = Object.freeze({
  ASK_ONE_QUESTION: "ask-one-question",
  INVITE_EXPANSION: "invite-expansion",
  REASSURE_THEN_EXPLORE: "reassure-then-explore",
  REFLECT_THEN_CONFIRM: "reflect-then-confirm",
  OFFER_SMALL_NEXT_STEP: "offer-small-next-step",
  OFFER_PERSPECTIVE_WITH_PERMISSION:
    "offer-perspective-with-permission",
  SAVE_FOR_LATER: "save-for-later",
  BEGIN_CREATION: "begin-creation",
  REVIEW_AND_REFINE: "review-and-refine",
  PREPARE_PUBLISHING_CHECKLIST:
    "prepare-publishing-checklist",
  CELEBRATE_AND_CONTINUE: "celebrate-and-continue",
});

const KEYWORD_GROUPS = Object.freeze({
  excited: [
    "excited",
    "amazing",
    "brilliant",
    "love this",
    "can't wait",
    "cannot wait",
    "i have an idea",
    "ive got an idea",
    "i've got an idea",
    "this could work",
    "let's do it",
    "lets do it",
  ],

  curious: [
    "what if",
    "could we",
    "could i",
    "i wonder",
    "maybe",
    "perhaps",
    "imagine",
    "what about",
  ],

  stuck: [
    "stuck",
    "blocked",
    "nothing is coming",
    "no ideas",
    "can't think",
    "cannot think",
    "don't know where to start",
    "dont know where to start",
    "blank",
  ],

  doubting: [
    "not good enough",
    "this is rubbish",
    "this is terrible",
    "i hate it",
    "delete it",
    "throw it away",
    "give up",
    "nobody will like",
    "won't work",
    "will not work",
    "i can't do this",
    "i cannot do this",
    "maybe i'm not",
    "maybe im not",
  ],

  overwhelmed: [
    "too much",
    "overwhelmed",
    "don't know what to do",
    "dont know what to do",
    "so many things",
    "where do i begin",
    "where do we begin",
    "confused",
  ],

  confident: [
    "i know what i want",
    "i can do this",
    "i'm ready",
    "im ready",
    "this is the one",
    "i believe in this",
    "i'm confident",
    "im confident",
  ],

  celebrating: [
    "i did it",
    "finished",
    "published",
    "released",
    "launched",
    "completed",
    "it worked",
    "people loved it",
    "we did it",
  ],

  disappointed: [
    "failed",
    "didn't work",
    "did not work",
    "no one watched",
    "nobody watched",
    "bad response",
    "disappointed",
    "upset",
    "waste of time",
  ],

  remember: [
    "remember",
    "when i was younger",
    "when i was a child",
    "used to",
    "childhood",
    "years ago",
    "back then",
    "memory",
  ],

  discover: [
    "who am i",
    "find myself",
    "discover myself",
    "my voice",
    "my style",
    "what suits me",
    "what kind of creator",
    "what do i really want",
  ],

  learn: [
    "how do i",
    "teach me",
    "show me how",
    "help me understand",
    "explain",
    "learn",
    "tutorial",
  ],

  solve: [
    "problem",
    "fix",
    "not working",
    "how can we solve",
    "how do we fix",
    "issue",
    "difficulty",
  ],

  generate: [
    "create",
    "generate",
    "make",
    "write",
    "design",
    "produce",
    "build",
    "compose",
  ],

  refine: [
    "improve",
    "edit",
    "refine",
    "rewrite",
    "polish",
    "make it better",
    "change this",
    "adjust",
  ],

  publish: [
    "publish",
    "release",
    "post",
    "upload",
    "share with everyone",
    "go live",
    "launch",
  ],

  reflection: [
    "why do i",
    "why am i",
    "what have you noticed",
    "tell me about myself",
    "pattern",
    "habit",
    "strength",
    "how do i think",
  ],
});

const DEFAULT_CONTEXT = Object.freeze({
  conversationCount: 0,
  completedProjectCount: 0,
  publishedProjectCount: 0,
  savedIdeaCount: 0,
  recentStage: null,
  recentEmotionalState: null,
  knownPatterns: [],
  activeProject: null,
  hasSharedIdea: false,
});

/**
 * Normalises unknown values into safe searchable text.
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
 * Returns true when the supplied text includes at least one phrase.
 */
function includesAny(text, phrases = []) {
  return phrases.some((phrase) => text.includes(phrase));
}

/**
 * Returns the number of matching phrases.
 */
function countMatches(text, phrases = []) {
  return phrases.reduce((total, phrase) => {
    return text.includes(phrase) ? total + 1 : total;
  }, 0);
}

/**
 * Keeps confidence scores between 0 and 1.
 */
function clampConfidence(value) {
  return Math.max(0, Math.min(1, value));
}

/**
 * Creates a consistent confidence result.
 */
function createDetection(value, confidence, evidence = []) {
  return {
    value,
    confidence: clampConfidence(confidence),
    evidence,
  };
}

/**
 * Detects the creator's likely emotional state.
 *
 * This is creative context only.
 * It is not a medical or psychological diagnosis.
 */
function detectEmotionalState(message) {
  const text = normaliseText(message);

  if (!text) {
    return createDetection(
      EMOTIONAL_STATES.NEUTRAL,
      0.3,
      []
    );
  }

  const scoredStates = [
    {
      state: EMOTIONAL_STATES.DOUBTING,
      matches: countMatches(text, KEYWORD_GROUPS.doubting),
    },
    {
      state: EMOTIONAL_STATES.OVERWHELMED,
      matches: countMatches(text, KEYWORD_GROUPS.overwhelmed),
    },
    {
      state: EMOTIONAL_STATES.STUCK,
      matches: countMatches(text, KEYWORD_GROUPS.stuck),
    },
    {
      state: EMOTIONAL_STATES.DISAPPOINTED,
      matches: countMatches(text, KEYWORD_GROUPS.disappointed),
    },
    {
      state: EMOTIONAL_STATES.CELEBRATING,
      matches: countMatches(text, KEYWORD_GROUPS.celebrating),
    },
    {
      state: EMOTIONAL_STATES.EXCITED,
      matches: countMatches(text, KEYWORD_GROUPS.excited),
    },
    {
      state: EMOTIONAL_STATES.CONFIDENT,
      matches: countMatches(text, KEYWORD_GROUPS.confident),
    },
    {
      state: EMOTIONAL_STATES.CURIOUS,
      matches: countMatches(text, KEYWORD_GROUPS.curious),
    },
  ];

  const strongestMatch = scoredStates
    .filter((item) => item.matches > 0)
    .sort((a, b) => b.matches - a.matches)[0];

  if (strongestMatch) {
    const evidenceGroup = Object.entries(KEYWORD_GROUPS).find(
      ([groupName]) =>
        groupName === strongestMatch.state
    );

    const evidence = evidenceGroup
      ? evidenceGroup[1].filter((phrase) =>
          text.includes(phrase)
        )
      : [];

    return createDetection(
      strongestMatch.state,
      0.62 + strongestMatch.matches * 0.1,
      evidence
    );
  }

  if (
    text.includes("?") ||
    includesAny(text, ["maybe", "perhaps", "not sure"])
  ) {
    return createDetection(
      EMOTIONAL_STATES.UNCERTAIN,
      0.55,
      ["uncertain language"]
    );
  }

  return createDetection(
    EMOTIONAL_STATES.NEUTRAL,
    0.42,
    []
  );
}

/**
 * Detects what the creator appears to want from the conversation.
 */
function detectIntent(message) {
  const text = normaliseText(message);

  if (!text) {
    return createDetection(
      CREATOR_INTENTS.UNKNOWN,
      0.25,
      []
    );
  }

  const intentRules = [
    {
      intent: CREATOR_INTENTS.SEEK_REASSURANCE,
      phrases: KEYWORD_GROUPS.doubting,
    },
    {
      intent: CREATOR_INTENTS.REMEMBER,
      phrases: KEYWORD_GROUPS.remember,
    },
    {
      intent: CREATOR_INTENTS.DISCOVER,
      phrases: KEYWORD_GROUPS.discover,
    },
    {
      intent: CREATOR_INTENTS.REFLECT,
      phrases: KEYWORD_GROUPS.reflection,
    },
    {
      intent: CREATOR_INTENTS.PUBLISH,
      phrases: KEYWORD_GROUPS.publish,
    },
    {
      intent: CREATOR_INTENTS.REFINE,
      phrases: KEYWORD_GROUPS.refine,
    },
    {
      intent: CREATOR_INTENTS.LEARN,
      phrases: KEYWORD_GROUPS.learn,
    },
    {
      intent: CREATOR_INTENTS.SOLVE,
      phrases: KEYWORD_GROUPS.solve,
    },
    {
      intent: CREATOR_INTENTS.IMAGINE,
      phrases: KEYWORD_GROUPS.curious,
    },
    {
      intent: CREATOR_INTENTS.GENERATE,
      phrases: KEYWORD_GROUPS.generate,
    },
  ];

  const matchingRule = intentRules.find((rule) =>
    includesAny(text, rule.phrases)
  );

  if (matchingRule) {
    return createDetection(
      matchingRule.intent,
      0.7,
      matchingRule.phrases.filter((phrase) =>
        text.includes(phrase)
      )
    );
  }

  const ideaIndicators = [
    "idea",
    "concept",
    "story",
    "song",
    "film",
    "video",
    "character",
    "scene",
    "project",
  ];

  if (includesAny(text, ideaIndicators)) {
    return createDetection(
      CREATOR_INTENTS.SHARE_IDEA,
      0.65,
      ideaIndicators.filter((phrase) =>
        text.includes(phrase)
      )
    );
  }

  return createDetection(
    CREATOR_INTENTS.UNKNOWN,
    0.38,
    []
  );
}

/**
 * Estimates the creator's current journey stage.
 */
function detectCreatorStage({
  message,
  emotionalState,
  intent,
  context,
}) {
  const text = normaliseText(message);
  const safeContext = {
    ...DEFAULT_CONTEXT,
    ...(context || {}),
  };

  if (emotionalState === EMOTIONAL_STATES.STUCK) {
    return createDetection(
      CREATOR_STAGES.BLOCKED,
      0.84,
      ["creator appears creatively blocked"]
    );
  }

  if (
    emotionalState === EMOTIONAL_STATES.DOUBTING ||
    intent === CREATOR_INTENTS.SEEK_REASSURANCE
  ) {
    return createDetection(
      CREATOR_STAGES.BUILDING_CONFIDENCE,
      0.86,
      ["creator appears to need confidence protection"]
    );
  }

  if (
    intent === CREATOR_INTENTS.PUBLISH ||
    includesAny(text, KEYWORD_GROUPS.publish)
  ) {
    return createDetection(
      CREATOR_STAGES.PUBLISHING,
      0.85,
      ["publishing language detected"]
    );
  }

  if (
    intent === CREATOR_INTENTS.REFINE ||
    safeContext.activeProject
  ) {
    return createDetection(
      CREATOR_STAGES.REFINING,
      0.72,
      ["active or refining project"]
    );
  }

  if (
    intent === CREATOR_INTENTS.GENERATE ||
    emotionalState === EMOTIONAL_STATES.EXCITED ||
    safeContext.hasSharedIdea
  ) {
    return createDetection(
      CREATOR_STAGES.CREATING,
      0.76,
      ["active creative momentum"]
    );
  }

  if (
    safeContext.publishedProjectCount > 0 ||
    safeContext.completedProjectCount >= 3
  ) {
    return createDetection(
      CREATOR_STAGES.GROWING,
      0.66,
      ["creator has completed previous work"]
    );
  }

  if (
    safeContext.conversationCount === 0 &&
    safeContext.completedProjectCount === 0
  ) {
    return createDetection(
      CREATOR_STAGES.NEW,
      0.74,
      ["new creator context"]
    );
  }

  return createDetection(
    CREATOR_STAGES.EXPLORING,
    0.62,
    ["creator is exploring possibilities"]
  );
}

/**
 * Determines whether an idea appears emotionally fragile.
 */
function detectFragileIdea({
  message,
  emotionalState,
  intent,
}) {
  const text = normaliseText(message);

  const rejectionLanguage = [
    "silly idea",
    "stupid idea",
    "ridiculous idea",
    "probably rubbish",
    "might sound crazy",
    "don't laugh",
    "dont laugh",
    "this won't work",
    "this will not work",
    "throw it away",
    "delete it",
  ];

  const isFragile =
    emotionalState === EMOTIONAL_STATES.DOUBTING ||
    intent === CREATOR_INTENTS.SEEK_REASSURANCE ||
    includesAny(text, rejectionLanguage);

  return {
    value: isFragile,
    confidence: isFragile ? 0.86 : 0.4,
    evidence: rejectionLanguage.filter((phrase) =>
      text.includes(phrase)
    ),
  };
}

/**
 * Selects the primary mentoring strategy.
 */
function choosePrimaryStrategy({
  emotionalState,
  intent,
  stage,
  fragileIdea,
}) {
  if (fragileIdea) {
    return MENTOR_STRATEGIES.PROTECT_FRAGILE_IDEA;
  }

  if (emotionalState === EMOTIONAL_STATES.CELEBRATING) {
    return MENTOR_STRATEGIES.CELEBRATE_PROGRESS;
  }

  if (
    emotionalState === EMOTIONAL_STATES.DOUBTING ||
    stage === CREATOR_STAGES.BUILDING_CONFIDENCE
  ) {
    return MENTOR_STRATEGIES.ENCOURAGE;
  }

  if (
    emotionalState === EMOTIONAL_STATES.OVERWHELMED ||
    emotionalState === EMOTIONAL_STATES.STUCK
  ) {
    return MENTOR_STRATEGIES.BREAK_INTO_STEPS;
  }

  if (intent === CREATOR_INTENTS.REMEMBER) {
    return MENTOR_STRATEGIES.ASK_REFLECTIVE_QUESTION;
  }

  if (
    intent === CREATOR_INTENTS.IMAGINE ||
    intent === CREATOR_INTENTS.DISCOVER
  ) {
    return MENTOR_STRATEGIES.ASK_IMAGINATIVE_QUESTION;
  }

  if (intent === CREATOR_INTENTS.REFLECT) {
    return MENTOR_STRATEGIES.REFLECT_PATTERN;
  }

  if (intent === CREATOR_INTENTS.SHARE_IDEA) {
    return MENTOR_STRATEGIES.EXPLORE_IDEA;
  }

  if (intent === CREATOR_INTENTS.GENERATE) {
    return MENTOR_STRATEGIES.PREPARE_TO_CREATE;
  }

  if (intent === CREATOR_INTENTS.PUBLISH) {
    return MENTOR_STRATEGIES.PREPARE_TO_PUBLISH;
  }

  if (intent === CREATOR_INTENTS.REFINE) {
    return MENTOR_STRATEGIES.GENTLE_CHALLENGE;
  }

  return MENTOR_STRATEGIES.LISTEN;
}

/**
 * Selects supporting strategies that may shape the final response.
 */
function chooseSupportingStrategies({
  emotionalState,
  intent,
  primaryStrategy,
  context,
}) {
  const strategies = [];
  const safeContext = {
    ...DEFAULT_CONTEXT,
    ...(context || {}),
  };

  if (
    emotionalState === EMOTIONAL_STATES.DOUBTING &&
    primaryStrategy !==
      MENTOR_STRATEGIES.PROTECT_FRAGILE_IDEA
  ) {
    strategies.push(
      MENTOR_STRATEGIES.PROTECT_FRAGILE_IDEA
    );
  }

  if (
    intent === CREATOR_INTENTS.DISCOVER ||
    intent === CREATOR_INTENTS.REMEMBER
  ) {
    strategies.push(
      MENTOR_STRATEGIES.ASK_REFLECTIVE_QUESTION
    );
  }

  if (
    safeContext.knownPatterns.length > 0 &&
    intent === CREATOR_INTENTS.REFLECT
  ) {
    strategies.push(
      MENTOR_STRATEGIES.REFLECT_PATTERN
    );
  }

  if (
    emotionalState === EMOTIONAL_STATES.UNCERTAIN
  ) {
    strategies.push(
      MENTOR_STRATEGIES.OFFER_PERSPECTIVE
    );
  }

  return [...new Set(strategies)].filter(
    (strategy) => strategy !== primaryStrategy
  );
}

/**
 * Decides the next conversational action.
 */
function chooseNextAction({
  emotionalState,
  intent,
  stage,
  primaryStrategy,
  fragileIdea,
}) {
  if (fragileIdea) {
    return NEXT_ACTIONS.REASSURE_THEN_EXPLORE;
  }

  if (emotionalState === EMOTIONAL_STATES.CELEBRATING) {
    return NEXT_ACTIONS.CELEBRATE_AND_CONTINUE;
  }

  if (
    emotionalState === EMOTIONAL_STATES.STUCK ||
    emotionalState === EMOTIONAL_STATES.OVERWHELMED
  ) {
    return NEXT_ACTIONS.OFFER_SMALL_NEXT_STEP;
  }

  if (
    primaryStrategy === MENTOR_STRATEGIES.OFFER_PERSPECTIVE
  ) {
    return NEXT_ACTIONS.OFFER_PERSPECTIVE_WITH_PERMISSION;
  }

  if (
    intent === CREATOR_INTENTS.SHARE_IDEA ||
    intent === CREATOR_INTENTS.IMAGINE ||
    intent === CREATOR_INTENTS.DISCOVER
  ) {
    return NEXT_ACTIONS.INVITE_EXPANSION;
  }

  if (intent === CREATOR_INTENTS.REFLECT) {
    return NEXT_ACTIONS.REFLECT_THEN_CONFIRM;
  }

  if (
    intent === CREATOR_INTENTS.GENERATE ||
    stage === CREATOR_STAGES.CREATING
  ) {
    return NEXT_ACTIONS.BEGIN_CREATION;
  }

  if (
    intent === CREATOR_INTENTS.REFINE ||
    stage === CREATOR_STAGES.REFINING
  ) {
    return NEXT_ACTIONS.REVIEW_AND_REFINE;
  }

  if (
    intent === CREATOR_INTENTS.PUBLISH ||
    stage === CREATOR_STAGES.PUBLISHING
  ) {
    return NEXT_ACTIONS.PREPARE_PUBLISHING_CHECKLIST;
  }

  return NEXT_ACTIONS.ASK_ONE_QUESTION;
}

/**
 * Provides behavioural instructions for the final conversation layer.
 */
function createResponseGuidance({
  emotionalState,
  intent,
  primaryStrategy,
  fragileIdea,
}) {
  const guidance = [
    "Keep the creator in ownership of the idea.",
    "Use warm, natural and collaborative language.",
    "Ask no more than one meaningful question at a time.",
    "Do not overwhelm the creator with too many options.",
    "Prefer curiosity before evaluation.",
    "Do not claim credit for the creator's idea.",
  ];

  if (fragileIdea) {
    guidance.push(
      "Acknowledge the courage required to share the idea.",
      "Do not evaluate the idea too early.",
      "Explore the intended feeling or experience first.",
      "Never use blunt rejection language.",
      "Offer the Inspiration Drawer before deletion."
    );
  }

  if (emotionalState === EMOTIONAL_STATES.DOUBTING) {
    guidance.push(
      "Protect confidence before offering practical criticism.",
      "Separate the creator's identity from the unfinished work.",
      "Frame the current idea as a draft, bridge or possibility."
    );
  }

  if (emotionalState === EMOTIONAL_STATES.STUCK) {
    guidance.push(
      "Reduce the size of the next step.",
      "Invite imagination without demanding a finished answer.",
      "Allow silence and incubation rather than forcing output."
    );
  }

  if (
    intent === CREATOR_INTENTS.REMEMBER ||
    intent === CREATOR_INTENTS.DISCOVER
  ) {
    guidance.push(
      "Use Imagine, Remember and Feel language naturally.",
      "Avoid telling the creator who they are.",
      "Help them uncover their own answer."
    );
  }

  if (primaryStrategy === MENTOR_STRATEGIES.REFLECT_PATTERN) {
    guidance.push(
      "Present observations as possibilities, not verdicts.",
      "Use evidence from previous creator behaviour.",
      "Ask the creator whether the reflection feels accurate."
    );
  }

  if (emotionalState === EMOTIONAL_STATES.CELEBRATING) {
    guidance.push(
      "Celebrate specifically rather than using empty praise.",
      "Reflect the progress that made the achievement possible.",
      "Invite the creator to recognise their own growth."
    );
  }

  return guidance;
}

/**
 * Provides phrases that the final conversation layer must avoid.
 */
function createAvoidanceRules() {
  return [
    "That is a bad idea.",
    "That will never work.",
    "No.",
    "You should give up.",
    "You are not creative.",
    "This is pointless.",
    "Everyone else is better.",
    "I created this for you.",
    "You need to be more realistic.",
    "That idea is stupid.",
  ];
}

/**
 * Produces a compact explanation of the engine's decision.
 */
function createDecisionSummary({
  emotionalState,
  intent,
  stage,
  primaryStrategy,
  nextAction,
  fragileIdea,
}) {
  if (fragileIdea) {
    return (
      "The creator may be sharing a fragile idea. " +
      "Protect confidence, explore the intended experience, " +
      "and avoid premature judgement."
    );
  }

  return (
    `The creator appears ${emotionalState}, ` +
    `with a likely intent to ${intent}. ` +
    `They are currently in the ${stage} stage. ` +
    `Use the ${primaryStrategy} strategy and ` +
    `continue with ${nextAction}.`
  );
}

/**
 * Main public engine method.
 *
 * @param {Object} input
 * @param {string} input.message
 * @param {Object} [input.context]
 * @returns {Object} structured mentoring plan
 */
function analyseCreatorMessage({
  message = "",
  context = {},
} = {}) {
  const safeContext = {
    ...DEFAULT_CONTEXT,
    ...(context || {}),
  };

  const emotionalStateResult =
    detectEmotionalState(message);

  const intentResult = detectIntent(message);

  const stageResult = detectCreatorStage({
    message,
    emotionalState: emotionalStateResult.value,
    intent: intentResult.value,
    context: safeContext,
  });

  const fragileIdeaResult = detectFragileIdea({
    message,
    emotionalState: emotionalStateResult.value,
    intent: intentResult.value,
  });

  const primaryStrategy = choosePrimaryStrategy({
    emotionalState: emotionalStateResult.value,
    intent: intentResult.value,
    stage: stageResult.value,
    fragileIdea: fragileIdeaResult.value,
  });

  const supportingStrategies =
    chooseSupportingStrategies({
      emotionalState: emotionalStateResult.value,
      intent: intentResult.value,
      primaryStrategy,
      context: safeContext,
    });

  const nextAction = chooseNextAction({
    emotionalState: emotionalStateResult.value,
    intent: intentResult.value,
    stage: stageResult.value,
    primaryStrategy,
    fragileIdea: fragileIdeaResult.value,
  });

  const responseGuidance = createResponseGuidance({
    emotionalState: emotionalStateResult.value,
    intent: intentResult.value,
    primaryStrategy,
    fragileIdea: fragileIdeaResult.value,
  });

  const plan = {
    engine: "the-creator-engine",
    version: "1.0.0",

    analysis: {
      emotionalState: emotionalStateResult,
      intent: intentResult,
      creatorStage: stageResult,
      fragileIdea: fragileIdeaResult,
    },

    strategy: {
      primary: primaryStrategy,
      supporting: supportingStrategies,
      nextAction,
    },

    responseGuidance,

    avoid: createAvoidanceRules(),

    decisionSummary: createDecisionSummary({
      emotionalState: emotionalStateResult.value,
      intent: intentResult.value,
      stage: stageResult.value,
      primaryStrategy,
      nextAction,
      fragileIdea: fragileIdeaResult.value,
    }),

    contextSnapshot: safeContext,

    principles: {
      protectTheCreator: true,
      curiosityBeforeCriticism: true,
      creatorOwnsTheIdea: true,
      oneQuestionAtATime: true,
      confidenceBeforeCorrection: true,
    },

    createdAt: new Date().toISOString(),
  };

  return plan;
}

/**
 * Convenience method for checking whether the Mentor should
 * protect confidence before giving practical feedback.
 */
function shouldProtectCreator(plan) {
  return Boolean(
    plan?.principles?.protectTheCreator &&
      (
        plan?.analysis?.fragileIdea?.value ||
        plan?.analysis?.emotionalState?.value ===
          EMOTIONAL_STATES.DOUBTING ||
        plan?.analysis?.creatorStage?.value ===
          CREATOR_STAGES.BUILDING_CONFIDENCE
      )
  );
}

/**
 * Convenience method for checking whether an idea should be
 * offered a place in the future Inspiration Drawer.
 */
function shouldOfferInspirationDrawer(plan) {
  return Boolean(
    plan?.analysis?.fragileIdea?.value ||
      (
        plan?.analysis?.emotionalState?.value ===
          EMOTIONAL_STATES.DOUBTING &&
        plan?.strategy?.nextAction ===
          NEXT_ACTIONS.REASSURE_THEN_EXPLORE
      )
  );
}

export {
  CREATOR_STAGES,
  CREATOR_INTENTS,
  EMOTIONAL_STATES,
  MENTOR_STRATEGIES,
  NEXT_ACTIONS,
  analyseCreatorMessage,
  shouldProtectCreator,
  shouldOfferInspirationDrawer,
};

export default analyseCreatorMessage;
/**
 * The Creator Engine
 * ------------------------------------------------------------
 * The behavioural interpretation foundation for iBand's
 * AI Mentor — The Creator.
 *
 * This engine does not generate the final Mentor response.
 * It interprets the creator's latest message and returns
 * structured evidence for the orchestration layers above it.
 *
 * It helps downstream systems understand:
 * - What the creator appears to want.
 * - How explicit that request is.
 * - The creator's current creative stage.
 * - The creator's apparent conversational rhythm.
 * - Whether confidence protection may be useful.
 * - Whether the creator appears to be thinking, building,
 *   learning, reflecting, recovering or incubating.
 * - Whether the creator wants guidance, action, explanation,
 *   demonstration, continuation, pause or space.
 * - Whether an idea may be fragile.
 * - Whether the creator appears finished speaking.
 *
 * Core philosophy:
 * - Protect the creator.
 * - Curiosity before criticism.
 * - Present behaviour leads.
 * - Context informs but does not dictate.
 * - The human is always the creator.
 * - Encourage ownership, confidence and discovery.
 * - Never make someone regret sharing an idea.
 * - Meet first. Lead second.
 * - Do not interrupt useful creative flow.
 * - Do not mistake uncertainty for inability.
 * - Do not mistake experience for a need to teach.
 * - Conversation exists in service of creation.
 */

const CREATOR_ENGINE_VERSION = "2.0.0";

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

  ASK_GUIDANCE: "ask-guidance",
  ASK_NEXT_STEP: "ask-next-step",
  ASK_EXPLANATION: "ask-explanation",
  ASK_EXAMPLE: "ask-example",
  ASK_DEMONSTRATION: "ask-demonstration",

  CONTINUE: "continue",
  PAUSE: "pause",
  STOP: "stop",
  THINK_ALOUD: "think-aloud",

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

const THINKING_MODES = Object.freeze({
  BUILD: "build",
  FLOW: "flow",
  EXPLORATION: "exploration",
  LEARNING: "learning",
  REFLECTION: "reflection",
  RECOVERY: "recovery",
  INCUBATION: "incubation",
  CONVERSATION: "conversation",
});

const CREATOR_ENERGY_LEVELS = Object.freeze({
  HIGH: "high",
  STEADY: "steady",
  LOW: "low",
  DEPLETED: "depleted",
  UNKNOWN: "unknown",
});

const MOMENTUM_LEVELS = Object.freeze({
  STRONG: "strong",
  RISING: "rising",
  STEADY: "steady",
  FRAGILE: "fragile",
  STALLED: "stalled",
  UNKNOWN: "unknown",
});

const GUIDANCE_WINDOWS = Object.freeze({
  WIDE_OPEN: "wide-open",
  OPEN: "open",
  LIMITED: "limited",
  CLOSED_FOR_NOW: "closed-for-now",
});

const INFORMATION_SATURATION_LEVELS = Object.freeze({
  LOW: "low",
  MODERATE: "moderate",
  HIGH: "high",
  OVERLOADED: "overloaded",
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

  FOLLOW_CREATOR: "follow-creator",
  HOLD_SPACE: "hold-space",
  REDUCE_PRESSURE: "reduce-pressure",
  DEMONSTRATE: "demonstrate",
  TEACH_BRIEFLY: "teach-briefly",
  MOVE_TO_NEXT_STEP: "move-to-next-step",
  PRESERVE_PROGRESS: "preserve-progress",
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

  CONTINUE_WITHOUT_INTERRUPTION:
    "continue-without-interruption",

  WAIT_FOR_CREATOR:
    "wait-for-creator",

  EXPLAIN_ONE_CONCEPT:
    "explain-one-concept",

  SHOW_EXAMPLE:
    "show-example",

  DEMONSTRATE:
    "demonstrate",

  MOVE_TO_NEXT_TASK:
    "move-to-next-task",

  PAUSE_AND_PRESERVE:
    "pause-and-preserve",

  END_CURRENT_DIRECTION:
    "end-current-direction",
});

const EXPLICIT_REQUESTS = Object.freeze({
  GUIDANCE: "guidance",
  NEXT_STEP: "next-step",
  EXPLANATION: "explanation",
  EXAMPLE: "example",
  DEMONSTRATION: "demonstration",
  CREATION: "creation",
  REFINEMENT: "refinement",
  PUBLISHING: "publishing",
  CONTINUE: "continue",
  PAUSE: "pause",
  STOP: "stop",
  SPACE: "space",
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
    "i'm stuck",
    "im stuck",
    "i am stuck",
    "blocked",
    "nothing is coming",
    "no ideas",
    "can't think",
    "cannot think",
    "don't know where to start",
    "dont know where to start",
    "drawing a blank",
  ],

  doubting: [
    "not good enough",
    "this is rubbish",
    "this is terrible",
    "i hate it",
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
    "too many options",
    "too much information",
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
    "we did it",
    "it's finished",
    "its finished",
    "i finished it",
    "we finished it",
    "it's published",
    "its published",
    "i published it",
    "it's released",
    "its released",
    "i released it",
    "it's launched",
    "its launched",
    "i launched it",
    "it worked",
    "people loved it",
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
    "help me understand",
    "explain this",
    "explain how",
    "walk me through",
    "tutorial",
  ],

  solve: [
    "problem",
    "fix this",
    "not working",
    "how can we solve",
    "how do we fix",
    "issue",
    "difficulty",
    "error",
  ],

  generate: [
    "create this",
    "generate this",
    "make this",
    "write this",
    "design this",
    "produce this",
    "build this",
    "compose this",
    "create it",
    "generate it",
    "make it",
    "write it",
    "build it",
    "do it",
  ],

  refine: [
    "improve this",
    "edit this",
    "refine this",
    "rewrite this",
    "polish this",
    "make it better",
    "change this",
    "adjust this",
    "update this",
  ],

  publish: [
    "publish this",
    "release this",
    "post this",
    "upload this",
    "share with everyone",
    "go live",
    "launch this",
    "ready to publish",
  ],

  reflection: [
    "why do i",
    "why am i",
    "what have you noticed",
    "tell me about myself",
    "what pattern",
    "my pattern",
    "my habit",
    "my strength",
    "how do i think",
  ],

  guidance: [
    "what do you recommend",
    "what would you recommend",
    "your recommendation",
    "please lead",
    "you lead",
    "lead me",
    "guide me",
    "what should i do",
    "what should we do",
    "which would you choose",
    "what do you think we should",
  ],

  nextStep: [
    "what's next",
    "whats next",
    "what next",
    "next step",
    "next file",
    "what do we do next",
    "where do we go next",
    "move on",
  ],

  explanation: [
    "explain it",
    "explain this",
    "explain why",
    "why does",
    "why is",
    "help me understand",
    "teach me",
  ],

  example: [
    "give me an example",
    "show me an example",
    "example please",
    "for example",
  ],

  demonstration: [
    "show me",
    "demonstrate",
    "show me how",
    "do one for me",
    "show me what you mean",
  ],

  continue: [
    "continue",
    "carry on",
    "keep going",
    "go ahead",
    "proceed",
    "move forward",
    "let's continue",
    "lets continue",
  ],

  pause: [
    "pause here",
    "stop here for now",
    "come back later",
    "continue later",
    "save this for later",
    "i'll be back",
    "ill be back",
    "back tomorrow",
    "do this tomorrow",
  ],

  stop: [
    "stop",
    "don't continue",
    "dont continue",
    "leave it",
    "end this",
    "cancel this",
  ],

  thinking: [
    "i'm thinking",
    "im thinking",
    "i am thinking",
    "thinking out loud",
    "just thinking",
    "let me think",
    "give me a moment",
    "one second",
    "hang on",
    "wait a second",
  ],

  notFinished: [
    "i'm not finished",
    "im not finished",
    "i am not finished",
    "not finished yet",
    "let me finish",
    "there's more",
    "theres more",
    "one more thing",
    "also",
  ],

  noGuidance: [
    "don't guide me",
    "dont guide me",
    "no advice",
    "don't advise me",
    "dont advise me",
    "just listen",
    "let me work",
    "i know what i want",
  ],

  concise: [
    "just quickly",
    "quickly",
    "short answer",
    "keep it short",
    "briefly",
    "one line",
    "no explanation",
    "don't explain",
    "dont explain",
    "just do it",
  ],

  overloaded: [
    "too much information",
    "information overload",
    "too many options",
    "too much at once",
    "one thing at a time",
    "slow down",
  ],

  lowEnergy: [
    "tired",
    "exhausted",
    "drained",
    "no energy",
    "worn out",
    "need a break",
  ],

  highMomentum: [
    "keep going",
    "let's keep going",
    "lets keep going",
    "on a roll",
    "great pace",
    "move fast",
    "next one",
    "next file",
    "go go go",
  ],
});

const NEGATION_PREFIXES = Object.freeze([
  "not ",
  "don't ",
  "dont ",
  "do not ",
  "didn't ",
  "didnt ",
  "did not ",
  "haven't ",
  "havent ",
  "have not ",
  "hasn't ",
  "hasnt ",
  "has not ",
  "isn't ",
  "isnt ",
  "is not ",
  "wasn't ",
  "wasnt ",
  "was not ",
  "won't ",
  "wont ",
  "will not ",
  "can't ",
  "cant ",
  "cannot ",
]);

const DEFAULT_CONTEXT = Object.freeze({
  creatorJourney: "guide",
  creatorType: null,
  creatorExperience: null,

  conversationCount: 0,
  completedProjectCount: 0,
  publishedProjectCount: 0,
  savedIdeaCount: 0,

  recentStage: null,
  recentEmotionalState: null,

  knownPatterns: [],
  activeProject: null,
  activeProjectId: null,
  hasSharedIdea: false,

  thinkingMode: null,
  creatorEnergy: null,
  momentum: null,
  guidanceWindow: null,
  informationSaturation: null,

  requestedHelp: false,
  requestedExplanation: false,
  requestedExample: false,
  requestedDemonstration: false,
  requestedCreation: false,
  requestedChange: false,

  creatorExplicitlyAskedForGuidance: false,
  creatorExplicitlyAskedToContinue: false,
  creatorExplicitlyAskedForNextStep: false,
  creatorExplicitlyAskedToPause: false,
  creatorExplicitlyAskedToStop: false,
  creatorExplicitlyAskedToCreate: false,

  mentorInvoked: true,

  minimumCreationContextReady: false,
  requiredInformationComplete: false,
  projectReadyToGenerate: false,
  projectReadyToRefine: false,
  projectReadyToPublish: false,
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
    .replace(/[“”]/g, '"')
    .replace(/\s+/g, " ");
}

/**
 * Safely clones plain data.
 */
function cloneValue(value) {
  if (value === undefined) {
    return undefined;
  }

  return JSON.parse(
    JSON.stringify(value)
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
 * Keeps confidence scores between 0 and 1.
 */
function clampConfidence(value) {
  return Math.max(
    0,
    Math.min(1, value)
  );
}

/**
 * Creates a consistent confidence result.
 */
function createDetection(
  value,
  confidence,
  evidence = []
) {
  return {
    value,
    confidence:
      clampConfidence(
        confidence
      ),
    evidence:
      uniqueValues(evidence),
  };
}

/**
 * Returns true when a phrase appears to be negated
 * immediately before the match.
 */
function isNegatedPhrase(
  text,
  phrase
) {
  const phraseIndex =
    text.indexOf(phrase);

  if (phraseIndex < 0) {
    return false;
  }

  const precedingText =
    text
      .slice(
        Math.max(
          0,
          phraseIndex - 24
        ),
        phraseIndex
      )
      .trimStart();

  return NEGATION_PREFIXES.some(
    (prefix) =>
      precedingText.endsWith(
        prefix.trim()
      )
  );
}

/**
 * Returns true when the supplied text includes at least
 * one non-negated phrase.
 */
function includesAny(
  text,
  phrases = []
) {
  return phrases.some(
    (phrase) =>
      text.includes(phrase) &&
      !isNegatedPhrase(
        text,
        phrase
      )
  );
}

/**
 * Returns all matching non-negated phrases.
 */
function getMatches(
  text,
  phrases = []
) {
  return phrases.filter(
    (phrase) =>
      text.includes(phrase) &&
      !isNegatedPhrase(
        text,
        phrase
      )
  );
}

/**
 * Returns the number of matching phrases.
 */
function countMatches(
  text,
  phrases = []
) {
  return getMatches(
    text,
    phrases
  ).length;
}

/**
 * Detects explicit creator requests.
 *
 * Explicit requests are intentionally separated from inferred
 * intent because downstream orchestration should give them
 * greater authority.
 */
function detectExplicitRequests({
  message,
  context,
}) {
  const text =
    normaliseText(message);

  const requests = [];

  if (
    includesAny(
      text,
      KEYWORD_GROUPS.guidance
    ) ||
    context
      ?.creatorExplicitlyAskedForGuidance ||
    context?.requestedHelp
  ) {
    requests.push(
      EXPLICIT_REQUESTS.GUIDANCE
    );
  }

  if (
    includesAny(
      text,
      KEYWORD_GROUPS.nextStep
    ) ||
    context
      ?.creatorExplicitlyAskedForNextStep
  ) {
    requests.push(
      EXPLICIT_REQUESTS.NEXT_STEP
    );
  }

  if (
    includesAny(
      text,
      KEYWORD_GROUPS.explanation
    ) ||
    context
      ?.requestedExplanation
  ) {
    requests.push(
      EXPLICIT_REQUESTS.EXPLANATION
    );
  }

  if (
    includesAny(
      text,
      KEYWORD_GROUPS.example
    ) ||
    context?.requestedExample
  ) {
    requests.push(
      EXPLICIT_REQUESTS.EXAMPLE
    );
  }

  if (
    includesAny(
      text,
      KEYWORD_GROUPS.demonstration
    ) ||
    context
      ?.requestedDemonstration
  ) {
    requests.push(
      EXPLICIT_REQUESTS
        .DEMONSTRATION
    );
  }

  if (
    includesAny(
      text,
      KEYWORD_GROUPS.generate
    ) ||
    context
      ?.creatorExplicitlyAskedToCreate ||
    context?.requestedCreation
  ) {
    requests.push(
      EXPLICIT_REQUESTS.CREATION
    );
  }

  if (
    includesAny(
      text,
      KEYWORD_GROUPS.refine
    ) ||
    context?.requestedChange
  ) {
    requests.push(
      EXPLICIT_REQUESTS.REFINEMENT
    );
  }

  if (
    includesAny(
      text,
      KEYWORD_GROUPS.publish
    )
  ) {
    requests.push(
      EXPLICIT_REQUESTS.PUBLISHING
    );
  }

  if (
    includesAny(
      text,
      KEYWORD_GROUPS.continue
    ) ||
    context
      ?.creatorExplicitlyAskedToContinue
  ) {
    requests.push(
      EXPLICIT_REQUESTS.CONTINUE
    );
  }

  if (
    includesAny(
      text,
      KEYWORD_GROUPS.pause
    ) ||
    context
      ?.creatorExplicitlyAskedToPause
  ) {
    requests.push(
      EXPLICIT_REQUESTS.PAUSE
    );
  }

  if (
    includesAny(
      text,
      KEYWORD_GROUPS.stop
    ) ||
    context
      ?.creatorExplicitlyAskedToStop
  ) {
    requests.push(
      EXPLICIT_REQUESTS.STOP
    );
  }

  if (
    includesAny(
      text,
      KEYWORD_GROUPS.thinking
    ) ||
    includesAny(
      text,
      KEYWORD_GROUPS.notFinished
    )
  ) {
    requests.push(
      EXPLICIT_REQUESTS.SPACE
    );
  }

  return uniqueValues(
    requests
  );
}

/**
 * Detects whether the creator appears to have finished
 * their current thought.
 */
function detectAppearsFinished(
  message
) {
  const text =
    normaliseText(message);

  if (!text) {
    return createDetection(
      true,
      0.4,
      []
    );
  }

  const evidence = [
    ...getMatches(
      text,
      KEYWORD_GROUPS.thinking
    ),

    ...getMatches(
      text,
      KEYWORD_GROUPS.notFinished
    ),
  ];

  if (evidence.length > 0) {
    return createDetection(
      false,
      0.88,
      evidence
    );
  }

  if (
    /\.\.\.$/.test(text) ||
    /[,;:]$/.test(text)
  ) {
    return createDetection(
      false,
      0.58,
      ["unfinished punctuation"]
    );
  }

  return createDetection(
    true,
    0.64,
    []
  );
}

/**
 * Detects the creator's likely emotional state.
 *
 * This is creative conversation context only.
 * It is not a medical or psychological diagnosis.
 */
function detectEmotionalState(
  message
) {
  const text =
    normaliseText(message);

  if (!text) {
    return createDetection(
      EMOTIONAL_STATES.NEUTRAL,
      0.3,
      []
    );
  }

  const scoredStates = [
    {
      state:
        EMOTIONAL_STATES.DOUBTING,
      group:
        KEYWORD_GROUPS.doubting,
    },
    {
      state:
        EMOTIONAL_STATES.OVERWHELMED,
      group:
        KEYWORD_GROUPS.overwhelmed,
    },
    {
      state:
        EMOTIONAL_STATES.STUCK,
      group:
        KEYWORD_GROUPS.stuck,
    },
    {
      state:
        EMOTIONAL_STATES.DISAPPOINTED,
      group:
        KEYWORD_GROUPS.disappointed,
    },
    {
      state:
        EMOTIONAL_STATES.CELEBRATING,
      group:
        KEYWORD_GROUPS.celebrating,
    },
    {
      state:
        EMOTIONAL_STATES.EXCITED,
      group:
        KEYWORD_GROUPS.excited,
    },
    {
      state:
        EMOTIONAL_STATES.CONFIDENT,
      group:
        KEYWORD_GROUPS.confident,
    },
    {
      state:
        EMOTIONAL_STATES.CURIOUS,
      group:
        KEYWORD_GROUPS.curious,
    },
  ].map((item) => ({
    ...item,
    matches:
      countMatches(
        text,
        item.group
      ),
  }));

  const strongestMatch =
    scoredStates
      .filter(
        (item) =>
          item.matches > 0
      )
      .sort(
        (a, b) =>
          b.matches -
          a.matches
      )[0];

  if (strongestMatch) {
    return createDetection(
      strongestMatch.state,

      0.62 +
        strongestMatch.matches *
          0.1,

      getMatches(
        text,
        strongestMatch.group
      )
    );
  }

  if (
    text.includes("?") ||
    includesAny(
      text,
      [
        "maybe",
        "perhaps",
        "not sure",
      ]
    )
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
 * Detects what the creator appears to want from the
 * conversation.
 */
function detectIntent({
  message,
  explicitRequests,
}) {
  const text =
    normaliseText(message);

  if (!text) {
    return createDetection(
      CREATOR_INTENTS.UNKNOWN,
      0.25,
      []
    );
  }

  if (
    explicitRequests.includes(
      EXPLICIT_REQUESTS.STOP
    )
  ) {
    return createDetection(
      CREATOR_INTENTS.STOP,
      0.96,
      getMatches(
        text,
        KEYWORD_GROUPS.stop
      )
    );
  }

  if (
    explicitRequests.includes(
      EXPLICIT_REQUESTS.PAUSE
    )
  ) {
    return createDetection(
      CREATOR_INTENTS.PAUSE,
      0.94,
      getMatches(
        text,
        KEYWORD_GROUPS.pause
      )
    );
  }

  if (
    explicitRequests.includes(
      EXPLICIT_REQUESTS.NEXT_STEP
    )
  ) {
    return createDetection(
      CREATOR_INTENTS.ASK_NEXT_STEP,
      0.94,
      getMatches(
        text,
        KEYWORD_GROUPS.nextStep
      )
    );
  }

  if (
    explicitRequests.includes(
      EXPLICIT_REQUESTS.DEMONSTRATION
    )
  ) {
    return createDetection(
      CREATOR_INTENTS
        .ASK_DEMONSTRATION,
      0.92,
      getMatches(
        text,
        KEYWORD_GROUPS.demonstration
      )
    );
  }

  if (
    explicitRequests.includes(
      EXPLICIT_REQUESTS.EXAMPLE
    )
  ) {
    return createDetection(
      CREATOR_INTENTS.ASK_EXAMPLE,
      0.92,
      getMatches(
        text,
        KEYWORD_GROUPS.example
      )
    );
  }

  if (
    explicitRequests.includes(
      EXPLICIT_REQUESTS.EXPLANATION
    )
  ) {
    return createDetection(
      CREATOR_INTENTS
        .ASK_EXPLANATION,
      0.92,
      getMatches(
        text,
        KEYWORD_GROUPS.explanation
      )
    );
  }

  if (
    explicitRequests.includes(
      EXPLICIT_REQUESTS.GUIDANCE
    )
  ) {
    return createDetection(
      CREATOR_INTENTS.ASK_GUIDANCE,
      0.94,
      getMatches(
        text,
        KEYWORD_GROUPS.guidance
      )
    );
  }

  if (
    explicitRequests.includes(
      EXPLICIT_REQUESTS.CONTINUE
    )
  ) {
    return createDetection(
      CREATOR_INTENTS.CONTINUE,
      0.9,
      getMatches(
        text,
        KEYWORD_GROUPS.continue
      )
    );
  }

  if (
    explicitRequests.includes(
      EXPLICIT_REQUESTS.REFINEMENT
    )
  ) {
    return createDetection(
      CREATOR_INTENTS.REFINE,
      0.9,
      getMatches(
        text,
        KEYWORD_GROUPS.refine
      )
    );
  }

  if (
    explicitRequests.includes(
      EXPLICIT_REQUESTS.PUBLISHING
    )
  ) {
    return createDetection(
      CREATOR_INTENTS.PUBLISH,
      0.9,
      getMatches(
        text,
        KEYWORD_GROUPS.publish
      )
    );
  }

  if (
    explicitRequests.includes(
      EXPLICIT_REQUESTS.CREATION
    )
  ) {
    return createDetection(
      CREATOR_INTENTS.GENERATE,
      0.88,
      getMatches(
        text,
        KEYWORD_GROUPS.generate
      )
    );
  }

  if (
    explicitRequests.includes(
      EXPLICIT_REQUESTS.SPACE
    )
  ) {
    return createDetection(
      CREATOR_INTENTS.THINK_ALOUD,
      0.88,
      [
        ...getMatches(
          text,
          KEYWORD_GROUPS.thinking
        ),

        ...getMatches(
          text,
          KEYWORD_GROUPS.notFinished
        ),
      ]
    );
  }

  const intentRules = [
    {
      intent:
        CREATOR_INTENTS
          .SEEK_REASSURANCE,
      phrases:
        KEYWORD_GROUPS.doubting,
    },
    {
      intent:
        CREATOR_INTENTS.REMEMBER,
      phrases:
        KEYWORD_GROUPS.remember,
    },
    {
      intent:
        CREATOR_INTENTS.DISCOVER,
      phrases:
        KEYWORD_GROUPS.discover,
    },
    {
      intent:
        CREATOR_INTENTS.REFLECT,
      phrases:
        KEYWORD_GROUPS.reflection,
    },
    {
      intent:
        CREATOR_INTENTS.LEARN,
      phrases:
        KEYWORD_GROUPS.learn,
    },
    {
      intent:
        CREATOR_INTENTS.SOLVE,
      phrases:
        KEYWORD_GROUPS.solve,
    },
    {
      intent:
        CREATOR_INTENTS.IMAGINE,
      phrases:
        KEYWORD_GROUPS.curious,
    },
  ];

  const scoredRules =
    intentRules
      .map((rule) => ({
        ...rule,
        matches:
          getMatches(
            text,
            rule.phrases
          ),
      }))
      .filter(
        (rule) =>
          rule.matches.length > 0
      )
      .sort(
        (a, b) =>
          b.matches.length -
          a.matches.length
      );

  if (scoredRules.length > 0) {
    const strongestRule =
      scoredRules[0];

    return createDetection(
      strongestRule.intent,
      0.68 +
        Math.min(
          0.2,
          strongestRule
            .matches
            .length *
            0.06
        ),
      strongestRule.matches
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
    "advert",
    "cartoon",
    "podcast",
    "image",
  ];

  const ideaEvidence =
    getMatches(
      text,
      ideaIndicators
    );

  if (
    ideaEvidence.length > 0
  ) {
    return createDetection(
      CREATOR_INTENTS.SHARE_IDEA,
      0.65,
      ideaEvidence
    );
  }

  return createDetection(
    CREATOR_INTENTS.UNKNOWN,
    0.38,
    []
  );
}

/**
 * Detects whether an idea appears emotionally fragile.
 */
function detectFragileIdea({
  message,
  emotionalState,
  intent,
}) {
  const text =
    normaliseText(message);

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

  const evidence =
    getMatches(
      text,
      rejectionLanguage
    );

  const isFragile =
    emotionalState ===
      EMOTIONAL_STATES.DOUBTING ||
    intent ===
      CREATOR_INTENTS
        .SEEK_REASSURANCE ||
    evidence.length > 0;

  return createDetection(
    isFragile,
    isFragile ? 0.86 : 0.4,
    evidence
  );
}

/**
 * Detects the creator's current thinking mode.
 */
function detectThinkingMode({
  message,
  emotionalState,
  intent,
  explicitRequests,
  context,
}) {
  const text =
    normaliseText(message);

  if (
    context?.thinkingMode &&
    !includesAny(
      text,
      [
        ...KEYWORD_GROUPS.thinking,
        ...KEYWORD_GROUPS.continue,
        ...KEYWORD_GROUPS.nextStep,
      ]
    )
  ) {
    return createDetection(
      context.thinkingMode,
      0.62,
      ["supplied context"]
    );
  }

  if (
    intent ===
      CREATOR_INTENTS.THINK_ALOUD ||
    explicitRequests.includes(
      EXPLICIT_REQUESTS.SPACE
    )
  ) {
    return createDetection(
      THINKING_MODES.INCUBATION,
      0.9,
      [
        ...getMatches(
          text,
          KEYWORD_GROUPS.thinking
        ),

        ...getMatches(
          text,
          KEYWORD_GROUPS.notFinished
        ),
      ]
    );
  }

  if (
    emotionalState ===
      EMOTIONAL_STATES.STUCK ||
    emotionalState ===
      EMOTIONAL_STATES.OVERWHELMED ||
    emotionalState ===
      EMOTIONAL_STATES.DOUBTING ||
    emotionalState ===
      EMOTIONAL_STATES.DISAPPOINTED
  ) {
    return createDetection(
      THINKING_MODES.RECOVERY,
      0.78,
      ["creator state suggests recovery"]
    );
  }

  if (
    intent ===
      CREATOR_INTENTS.LEARN ||
    intent ===
      CREATOR_INTENTS
        .ASK_EXPLANATION ||
    intent ===
      CREATOR_INTENTS.ASK_EXAMPLE ||
    intent ===
      CREATOR_INTENTS
        .ASK_DEMONSTRATION
  ) {
    return createDetection(
      THINKING_MODES.LEARNING,
      0.84,
      ["learning request detected"]
    );
  }

  if (
    intent ===
      CREATOR_INTENTS.REFLECT ||
    intent ===
      CREATOR_INTENTS.REMEMBER ||
    intent ===
      CREATOR_INTENTS.DISCOVER
  ) {
    return createDetection(
      THINKING_MODES.REFLECTION,
      0.82,
      ["reflective intent detected"]
    );
  }

  if (
    intent ===
      CREATOR_INTENTS.IMAGINE ||
    intent ===
      CREATOR_INTENTS.SHARE_IDEA
  ) {
    return createDetection(
      THINKING_MODES.EXPLORATION,
      0.8,
      ["exploratory intent detected"]
    );
  }

  if (
    intent ===
      CREATOR_INTENTS.GENERATE ||
    intent ===
      CREATOR_INTENTS.REFINE ||
    intent ===
      CREATOR_INTENTS.PUBLISH ||
    intent ===
      CREATOR_INTENTS
        .ASK_NEXT_STEP ||
    explicitRequests.includes(
      EXPLICIT_REQUESTS.CREATION
    ) ||
    explicitRequests.includes(
      EXPLICIT_REQUESTS.REFINEMENT
    )
  ) {
    return createDetection(
      THINKING_MODES.BUILD,
      0.86,
      ["execution intent detected"]
    );
  }

  if (
    explicitRequests.includes(
      EXPLICIT_REQUESTS.CONTINUE
    ) ||
    includesAny(
      text,
      KEYWORD_GROUPS.highMomentum
    )
  ) {
    return createDetection(
      THINKING_MODES.FLOW,
      0.84,
      ["continuation momentum detected"]
    );
  }

  return createDetection(
    THINKING_MODES.CONVERSATION,
    0.5,
    []
  );
}

/**
 * Detects apparent creator energy.
 *
 * This is intentionally conservative and should never be
 * treated as a psychological assessment.
 */
function detectCreatorEnergy({
  message,
  emotionalState,
  context,
}) {
  const text =
    normaliseText(message);

  const lowEvidence =
    getMatches(
      text,
      KEYWORD_GROUPS.lowEnergy
    );

  if (
    lowEvidence.length > 0
  ) {
    const depleted =
      includesAny(
        text,
        [
          "exhausted",
          "drained",
          "no energy",
        ]
      );

    return createDetection(
      depleted
        ? CREATOR_ENERGY_LEVELS
            .DEPLETED
        : CREATOR_ENERGY_LEVELS.LOW,
      depleted ? 0.88 : 0.78,
      lowEvidence
    );
  }

  if (
    emotionalState ===
      EMOTIONAL_STATES.EXCITED ||
    includesAny(
      text,
      KEYWORD_GROUPS.highMomentum
    )
  ) {
    return createDetection(
      CREATOR_ENERGY_LEVELS.HIGH,
      0.72,
      getMatches(
        text,
        KEYWORD_GROUPS.highMomentum
      )
    );
  }

  if (context?.creatorEnergy) {
    return createDetection(
      context.creatorEnergy,
      0.58,
      ["supplied context"]
    );
  }

  return createDetection(
    CREATOR_ENERGY_LEVELS.STEADY,
    0.48,
    []
  );
}

/**
 * Detects current creative momentum.
 */
function detectMomentum({
  message,
  emotionalState,
  intent,
  context,
}) {
  const text =
    normaliseText(message);

  const momentumEvidence =
    getMatches(
      text,
      KEYWORD_GROUPS.highMomentum
    );

  if (
    momentumEvidence.length > 0
  ) {
    return createDetection(
      MOMENTUM_LEVELS.STRONG,
      0.84,
      momentumEvidence
    );
  }

  if (
    intent ===
      CREATOR_INTENTS.CONTINUE ||
    intent ===
      CREATOR_INTENTS
        .ASK_NEXT_STEP ||
    emotionalState ===
      EMOTIONAL_STATES.EXCITED
  ) {
    return createDetection(
      MOMENTUM_LEVELS.RISING,
      0.72,
      ["forward movement detected"]
    );
  }

  if (
    emotionalState ===
      EMOTIONAL_STATES.STUCK ||
    emotionalState ===
      EMOTIONAL_STATES.OVERWHELMED
  ) {
    return createDetection(
      MOMENTUM_LEVELS.STALLED,
      0.82,
      ["creative movement appears interrupted"]
    );
  }

  if (
    emotionalState ===
      EMOTIONAL_STATES.DOUBTING ||
    emotionalState ===
      EMOTIONAL_STATES.DISAPPOINTED
  ) {
    return createDetection(
      MOMENTUM_LEVELS.FRAGILE,
      0.78,
      ["momentum may need protection"]
    );
  }

  if (context?.momentum) {
    return createDetection(
      context.momentum,
      0.58,
      ["supplied context"]
    );
  }

  return createDetection(
    MOMENTUM_LEVELS.STEADY,
    0.48,
    []
  );
}

/**
 * Detects how open the creator currently appears to guidance.
 */
function detectGuidanceWindow({
  message,
  explicitRequests,
  emotionalState,
  context,
}) {
  const text =
    normaliseText(message);

  const noGuidanceEvidence =
    getMatches(
      text,
      KEYWORD_GROUPS.noGuidance
    );

  if (
    noGuidanceEvidence.length > 0
  ) {
    return createDetection(
      GUIDANCE_WINDOWS.CLOSED_FOR_NOW,
      0.94,
      noGuidanceEvidence
    );
  }

  if (
    explicitRequests.includes(
      EXPLICIT_REQUESTS.GUIDANCE
    ) ||
    explicitRequests.includes(
      EXPLICIT_REQUESTS.NEXT_STEP
    )
  ) {
    return createDetection(
      GUIDANCE_WINDOWS.WIDE_OPEN,
      0.94,
      [
        ...getMatches(
          text,
          KEYWORD_GROUPS.guidance
        ),

        ...getMatches(
          text,
          KEYWORD_GROUPS.nextStep
        ),
      ]
    );
  }

  if (
    explicitRequests.includes(
      EXPLICIT_REQUESTS.SPACE
    )
  ) {
    return createDetection(
      GUIDANCE_WINDOWS.CLOSED_FOR_NOW,
      0.9,
      ["creator requested thinking space"]
    );
  }

  if (
    emotionalState ===
      EMOTIONAL_STATES.OVERWHELMED
  ) {
    return createDetection(
      GUIDANCE_WINDOWS.LIMITED,
      0.76,
      ["creator appears overloaded"]
    );
  }

  if (context?.guidanceWindow) {
    return createDetection(
      context.guidanceWindow,
      0.58,
      ["supplied context"]
    );
  }

  return createDetection(
    GUIDANCE_WINDOWS.OPEN,
    0.5,
    []
  );
}

/**
 * Detects likely information saturation.
 */
function detectInformationSaturation({
  message,
  emotionalState,
  context,
}) {
  const text =
    normaliseText(message);

  const overloadEvidence =
    getMatches(
      text,
      KEYWORD_GROUPS.overloaded
    );

  if (
    overloadEvidence.length > 0
  ) {
    const severe =
      includesAny(
        text,
        [
          "information overload",
          "too much information",
          "too much at once",
        ]
      );

    return createDetection(
      severe
        ? INFORMATION_SATURATION_LEVELS
            .OVERLOADED
        : INFORMATION_SATURATION_LEVELS
            .HIGH,
      severe ? 0.9 : 0.8,
      overloadEvidence
    );
  }

  if (
    emotionalState ===
      EMOTIONAL_STATES.OVERWHELMED
  ) {
    return createDetection(
      INFORMATION_SATURATION_LEVELS.HIGH,
      0.72,
      ["overwhelmed language detected"]
    );
  }

  if (
    context?.informationSaturation
  ) {
    return createDetection(
      context.informationSaturation,
      0.58,
      ["supplied context"]
    );
  }

  return createDetection(
    INFORMATION_SATURATION_LEVELS.LOW,
    0.48,
    []
  );
}

/**
 * Estimates the creator's current journey stage.
 *
 * Active project context alone does not imply refinement.
 */
function detectCreatorStage({
  message,
  emotionalState,
  intent,
  context,
}) {
  const text =
    normaliseText(message);

  const safeContext = {
    ...DEFAULT_CONTEXT,
    ...(context || {}),
  };

  if (
    emotionalState ===
      EMOTIONAL_STATES.STUCK
  ) {
    return createDetection(
      CREATOR_STAGES.BLOCKED,
      0.84,
      ["creator appears creatively blocked"]
    );
  }

  if (
    emotionalState ===
      EMOTIONAL_STATES.DOUBTING ||
    intent ===
      CREATOR_INTENTS
        .SEEK_REASSURANCE
  ) {
    return createDetection(
      CREATOR_STAGES
        .BUILDING_CONFIDENCE,
      0.86,
      ["creator appears to need confidence protection"]
    );
  }

  if (
    intent ===
      CREATOR_INTENTS.PUBLISH ||
    safeContext
      .projectReadyToPublish
  ) {
    return createDetection(
      CREATOR_STAGES.PUBLISHING,
      0.86,
      ["publishing context detected"]
    );
  }

  if (
    intent ===
      CREATOR_INTENTS.REFINE ||
    safeContext
      .projectReadyToRefine
  ) {
    return createDetection(
      CREATOR_STAGES.REFINING,
      0.82,
      ["refinement context detected"]
    );
  }

  if (
    intent ===
      CREATOR_INTENTS.GENERATE ||
    safeContext
      .projectReadyToGenerate ||
    safeContext
      .minimumCreationContextReady
  ) {
    return createDetection(
      CREATOR_STAGES.CREATING,
      0.8,
      ["creation context detected"]
    );
  }

  if (
    intent ===
      CREATOR_INTENTS.SHARE_IDEA ||
    intent ===
      CREATOR_INTENTS.IMAGINE ||
    safeContext.hasSharedIdea
  ) {
    return createDetection(
      CREATOR_STAGES.EXPLORING,
      0.74,
      ["idea exploration detected"]
    );
  }

  if (
    safeContext.publishedProjectCount >
      0 ||
    safeContext.completedProjectCount >=
      3
  ) {
    return createDetection(
      CREATOR_STAGES.GROWING,
      0.66,
      ["creator has completed previous work"]
    );
  }

  if (
    safeContext.conversationCount ===
      0 &&
    safeContext.completedProjectCount ===
      0 &&
    !safeContext.activeProject
  ) {
    return createDetection(
      CREATOR_STAGES.NEW,
      0.74,
      ["new creator context"]
    );
  }

  if (
    safeContext.recentStage &&
    !includesAny(
      text,
      [
        ...KEYWORD_GROUPS.generate,
        ...KEYWORD_GROUPS.refine,
        ...KEYWORD_GROUPS.publish,
      ]
    )
  ) {
    return createDetection(
      safeContext.recentStage,
      0.56,
      ["recent stage context"]
    );
  }

  return createDetection(
    CREATOR_STAGES.EXPLORING,
    0.62,
    ["creator is exploring possibilities"]
  );
}

/**
 * Selects the primary mentoring strategy.
 */
function choosePrimaryStrategy({
  emotionalState,
  intent,
  stage,
  fragileIdea,
  appearsFinished,
  explicitRequests,
  informationSaturation,
}) {
  if (!appearsFinished) {
    return MENTOR_STRATEGIES.HOLD_SPACE;
  }

  if (
    explicitRequests.includes(
      EXPLICIT_REQUESTS.STOP
    )
  ) {
    return MENTOR_STRATEGIES.FOLLOW_CREATOR;
  }

  if (
    explicitRequests.includes(
      EXPLICIT_REQUESTS.PAUSE
    )
  ) {
    return MENTOR_STRATEGIES.PRESERVE_PROGRESS;
  }

  if (
    explicitRequests.includes(
      EXPLICIT_REQUESTS.DEMONSTRATION
    ) ||
    explicitRequests.includes(
      EXPLICIT_REQUESTS.EXAMPLE
    )
  ) {
    return MENTOR_STRATEGIES.DEMONSTRATE;
  }

  if (
    explicitRequests.includes(
      EXPLICIT_REQUESTS.EXPLANATION
    )
  ) {
    return MENTOR_STRATEGIES.TEACH_BRIEFLY;
  }

  if (
    explicitRequests.includes(
      EXPLICIT_REQUESTS.NEXT_STEP
    )
  ) {
    return MENTOR_STRATEGIES.MOVE_TO_NEXT_STEP;
  }

  if (fragileIdea) {
    return MENTOR_STRATEGIES.PROTECT_FRAGILE_IDEA;
  }

  if (
    informationSaturation ===
      INFORMATION_SATURATION_LEVELS.HIGH ||
    informationSaturation ===
      INFORMATION_SATURATION_LEVELS.OVERLOADED
  ) {
    return MENTOR_STRATEGIES.REDUCE_PRESSURE;
  }

  if (
    emotionalState ===
      EMOTIONAL_STATES.CELEBRATING
  ) {
    return MENTOR_STRATEGIES.CELEBRATE_PROGRESS;
  }

  if (
    emotionalState ===
      EMOTIONAL_STATES.DOUBTING ||
    stage ===
      CREATOR_STAGES.BUILDING_CONFIDENCE
  ) {
    return MENTOR_STRATEGIES.ENCOURAGE;
  }

  if (
    emotionalState ===
      EMOTIONAL_STATES.OVERWHELMED ||
    emotionalState ===
      EMOTIONAL_STATES.STUCK
  ) {
    return MENTOR_STRATEGIES.BREAK_INTO_STEPS;
  }

  if (
    intent ===
      CREATOR_INTENTS.REMEMBER
  ) {
    return MENTOR_STRATEGIES.ASK_REFLECTIVE_QUESTION;
  }

  if (
    intent ===
      CREATOR_INTENTS.IMAGINE ||
    intent ===
      CREATOR_INTENTS.DISCOVER
  ) {
    return MENTOR_STRATEGIES.ASK_IMAGINATIVE_QUESTION;
  }

  if (
    intent ===
      CREATOR_INTENTS.REFLECT
  ) {
    return MENTOR_STRATEGIES.REFLECT_PATTERN;
  }

  if (
    intent ===
      CREATOR_INTENTS.SHARE_IDEA
  ) {
    return MENTOR_STRATEGIES.EXPLORE_IDEA;
  }

  if (
    intent ===
      CREATOR_INTENTS.GENERATE
  ) {
    return MENTOR_STRATEGIES.PREPARE_TO_CREATE;
  }

  if (
    intent ===
      CREATOR_INTENTS.PUBLISH
  ) {
    return MENTOR_STRATEGIES.PREPARE_TO_PUBLISH;
  }

  if (
    intent ===
      CREATOR_INTENTS.REFINE
  ) {
    return MENTOR_STRATEGIES.GENTLE_CHALLENGE;
  }

  if (
    intent ===
      CREATOR_INTENTS.CONTINUE
  ) {
    return MENTOR_STRATEGIES.FOLLOW_CREATOR;
  }

  return MENTOR_STRATEGIES.LISTEN;
}

/**
 * Selects supporting strategies that may shape the final
 * response.
 */
function chooseSupportingStrategies({
  emotionalState,
  intent,
  primaryStrategy,
  context,
  guidanceWindow,
}) {
  const strategies = [];

  const safeContext = {
    ...DEFAULT_CONTEXT,
    ...(context || {}),
  };

  if (
    emotionalState ===
      EMOTIONAL_STATES.DOUBTING &&
    primaryStrategy !==
      MENTOR_STRATEGIES
        .PROTECT_FRAGILE_IDEA
  ) {
    strategies.push(
      MENTOR_STRATEGIES
        .PROTECT_FRAGILE_IDEA
    );
  }

  if (
    (
      intent ===
        CREATOR_INTENTS.DISCOVER ||
      intent ===
        CREATOR_INTENTS.REMEMBER
    ) &&
    guidanceWindow !==
      GUIDANCE_WINDOWS.CLOSED_FOR_NOW
  ) {
    strategies.push(
      MENTOR_STRATEGIES
        .ASK_REFLECTIVE_QUESTION
    );
  }

  if (
    safeContext.knownPatterns.length >
      0 &&
    intent ===
      CREATOR_INTENTS.REFLECT
  ) {
    strategies.push(
      MENTOR_STRATEGIES.REFLECT_PATTERN
    );
  }

  if (
    emotionalState ===
      EMOTIONAL_STATES.UNCERTAIN &&
    guidanceWindow !==
      GUIDANCE_WINDOWS.CLOSED_FOR_NOW
  ) {
    strategies.push(
      MENTOR_STRATEGIES.OFFER_PERSPECTIVE
    );
  }

  return uniqueValues(
    strategies
  ).filter(
    (strategy) =>
      strategy !== primaryStrategy
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
  appearsFinished,
  explicitRequests,
}) {
  if (!appearsFinished) {
    return NEXT_ACTIONS.WAIT_FOR_CREATOR;
  }

  if (
    explicitRequests.includes(
      EXPLICIT_REQUESTS.STOP
    )
  ) {
    return NEXT_ACTIONS.END_CURRENT_DIRECTION;
  }

  if (
    explicitRequests.includes(
      EXPLICIT_REQUESTS.PAUSE
    )
  ) {
    return NEXT_ACTIONS.PAUSE_AND_PRESERVE;
  }

  if (
    explicitRequests.includes(
      EXPLICIT_REQUESTS.DEMONSTRATION
    )
  ) {
    return NEXT_ACTIONS.DEMONSTRATE;
  }

  if (
    explicitRequests.includes(
      EXPLICIT_REQUESTS.EXAMPLE
    )
  ) {
    return NEXT_ACTIONS.SHOW_EXAMPLE;
  }

  if (
    explicitRequests.includes(
      EXPLICIT_REQUESTS.EXPLANATION
    )
  ) {
    return NEXT_ACTIONS.EXPLAIN_ONE_CONCEPT;
  }

  if (
    explicitRequests.includes(
      EXPLICIT_REQUESTS.NEXT_STEP
    )
  ) {
    return NEXT_ACTIONS.MOVE_TO_NEXT_TASK;
  }

  if (
    explicitRequests.includes(
      EXPLICIT_REQUESTS.CONTINUE
    ) &&
    intent ===
      CREATOR_INTENTS.CONTINUE
  ) {
    return NEXT_ACTIONS
      .CONTINUE_WITHOUT_INTERRUPTION;
  }

  if (fragileIdea) {
    return NEXT_ACTIONS.REASSURE_THEN_EXPLORE;
  }

  if (
    emotionalState ===
      EMOTIONAL_STATES.CELEBRATING
  ) {
    return NEXT_ACTIONS.CELEBRATE_AND_CONTINUE;
  }

  if (
    emotionalState ===
      EMOTIONAL_STATES.STUCK ||
    emotionalState ===
      EMOTIONAL_STATES.OVERWHELMED
  ) {
    return NEXT_ACTIONS.OFFER_SMALL_NEXT_STEP;
  }

  if (
    primaryStrategy ===
      MENTOR_STRATEGIES.OFFER_PERSPECTIVE
  ) {
    return NEXT_ACTIONS
      .OFFER_PERSPECTIVE_WITH_PERMISSION;
  }

  if (
    intent ===
      CREATOR_INTENTS.SHARE_IDEA ||
    intent ===
      CREATOR_INTENTS.IMAGINE ||
    intent ===
      CREATOR_INTENTS.DISCOVER
  ) {
    return NEXT_ACTIONS.INVITE_EXPANSION;
  }

  if (
    intent ===
      CREATOR_INTENTS.REFLECT
  ) {
    return NEXT_ACTIONS.REFLECT_THEN_CONFIRM;
  }

  if (
    intent ===
      CREATOR_INTENTS.GENERATE ||
    stage ===
      CREATOR_STAGES.CREATING
  ) {
    return NEXT_ACTIONS.BEGIN_CREATION;
  }

  if (
    intent ===
      CREATOR_INTENTS.REFINE ||
    stage ===
      CREATOR_STAGES.REFINING
  ) {
    return NEXT_ACTIONS.REVIEW_AND_REFINE;
  }

  if (
    intent ===
      CREATOR_INTENTS.PUBLISH ||
    stage ===
      CREATOR_STAGES.PUBLISHING
  ) {
    return NEXT_ACTIONS
      .PREPARE_PUBLISHING_CHECKLIST;
  }

  return NEXT_ACTIONS.ASK_ONE_QUESTION;
}

/**
 * Provides behavioural instructions for the final
 * conversation layer.
 */
function createResponseGuidance({
  emotionalState,
  intent,
  primaryStrategy,
  fragileIdea,
  appearsFinished,
  explicitRequests,
  thinkingMode,
  guidanceWindow,
  informationSaturation,
}) {
  const guidance = [
    "Keep the creator in ownership of the idea.",
    "Use warm, natural and collaborative language.",
    "Ask no more than one meaningful question at a time.",
    "Do not overwhelm the creator with too many options.",
    "Prefer curiosity before evaluation.",
    "Do not claim credit for the creator's idea.",
    "Present creator direction overrides inferred historical patterns.",
    "Do not explain when the creator has clearly asked for execution.",
    "Do not interrupt useful creative momentum merely because more help is available.",
  ];

  if (!appearsFinished) {
    guidance.push(
      "The creator may still be thinking or speaking.",
      "Hold space instead of introducing a new direction.",
      "Do not interpret an unfinished thought as a request for guidance."
    );
  }

  if (
    explicitRequests.includes(
      EXPLICIT_REQUESTS.GUIDANCE
    )
  ) {
    guidance.push(
      "The creator explicitly invited guidance.",
      "Lead clearly while preserving creator ownership."
    );
  }

  if (
    explicitRequests.includes(
      EXPLICIT_REQUESTS.NEXT_STEP
    )
  ) {
    guidance.push(
      "Give the next concrete step immediately.",
      "Do not reopen settled decisions unless required."
    );
  }

  if (
    explicitRequests.includes(
      EXPLICIT_REQUESTS.DEMONSTRATION
    ) ||
    explicitRequests.includes(
      EXPLICIT_REQUESTS.EXAMPLE
    )
  ) {
    guidance.push(
      "Show before explaining.",
      "Use the demonstration to reduce abstraction."
    );
  }

  if (
    explicitRequests.includes(
      EXPLICIT_REQUESTS.EXPLANATION
    )
  ) {
    guidance.push(
      "Explain only the concept needed for the creator's current goal.",
      "Connect explanation to immediate creative use."
    );
  }

  if (
    explicitRequests.includes(
      EXPLICIT_REQUESTS.PAUSE
    )
  ) {
    guidance.push(
      "Do not introduce another task.",
      "Preserve the current position for an easy return."
    );
  }

  if (
    explicitRequests.includes(
      EXPLICIT_REQUESTS.STOP
    )
  ) {
    guidance.push(
      "Respect the creator's decision to stop the current direction.",
      "Do not persuade the creator to continue."
    );
  }

  if (fragileIdea) {
    guidance.push(
      "Do not evaluate the idea too early.",
      "Explore the intended feeling or experience first.",
      "Never use blunt rejection language.",
      "Treat unfinished work as revisable rather than final."
    );
  }

  if (
    emotionalState ===
      EMOTIONAL_STATES.DOUBTING
  ) {
    guidance.push(
      "Protect confidence before offering practical criticism.",
      "Separate the creator's identity from the unfinished work.",
      "Frame the current idea as a draft, bridge or possibility."
    );
  }

  if (
    emotionalState ===
      EMOTIONAL_STATES.STUCK
  ) {
    guidance.push(
      "Reduce the size of the next step.",
      "Invite imagination without demanding a finished answer.",
      "Allow incubation rather than forcing output."
    );
  }

  if (
    intent ===
      CREATOR_INTENTS.REMEMBER ||
    intent ===
      CREATOR_INTENTS.DISCOVER
  ) {
    guidance.push(
      "Use Imagine, Remember and Feel language naturally.",
      "Avoid telling the creator who they are.",
      "Help them uncover their own answer."
    );
  }

  if (
    primaryStrategy ===
      MENTOR_STRATEGIES.REFLECT_PATTERN
  ) {
    guidance.push(
      "Present observations as possibilities, not verdicts.",
      "Use evidence from previous creator behaviour when available.",
      "Allow the creator to correct the reflection."
    );
  }

  if (
    emotionalState ===
      EMOTIONAL_STATES.CELEBRATING
  ) {
    guidance.push(
      "Celebrate specifically rather than using empty praise.",
      "Reflect the progress that made the achievement possible."
    );
  }

  if (
    thinkingMode ===
      THINKING_MODES.FLOW
  ) {
    guidance.push(
      "Protect momentum.",
      "Prefer continuation over optional teaching."
    );
  }

  if (
    thinkingMode ===
      THINKING_MODES.BUILD
  ) {
    guidance.push(
      "Prefer concrete execution over extended discussion.",
      "Keep architecture and explanation proportional to the task."
    );
  }

  if (
    guidanceWindow ===
      GUIDANCE_WINDOWS.CLOSED_FOR_NOW
  ) {
    guidance.push(
      "Do not introduce unsolicited advice.",
      "Follow the creator's current direction."
    );
  }

  if (
    informationSaturation ===
      INFORMATION_SATURATION_LEVELS.HIGH ||
    informationSaturation ===
      INFORMATION_SATURATION_LEVELS.OVERLOADED
  ) {
    guidance.push(
      "Reduce cognitive load.",
      "Offer one useful step rather than several alternatives."
    );
  }

  return uniqueValues(
    guidance
  );
}

/**
 * Provides phrases and behaviours that the final
 * conversation layer must avoid.
 */
function createAvoidanceRules() {
  return [
    "That is a bad idea.",
    "That will never work.",
    "You should give up.",
    "You are not creative.",
    "This is pointless.",
    "Everyone else is better.",
    "I created this for you.",
    "You need to be more realistic.",
    "That idea is stupid.",

    "Do not diagnose the creator.",
    "Do not claim certainty about the creator's internal state.",
    "Do not confuse uncertainty with inability.",
    "Do not mistake an active project for a request to refine it.",
    "Do not mistake the word finished inside a negative statement for celebration.",
    "Do not force teaching when the creator wants execution.",
    "Do not ask another question when the creator has asked to continue.",
    "Do not interrupt the creator when they appear not to have finished speaking.",
    "Do not use historical context to override explicit present direction.",
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
  thinkingMode,
  appearsFinished,
}) {
  if (!appearsFinished) {
    return (
      "The creator may not have finished their thought. " +
      "Hold space and avoid introducing a new direction."
    );
  }

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
    `They are currently in the ${stage} stage ` +
    `and ${thinkingMode} thinking mode. ` +
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
 * @returns {Object} structured mentoring analysis
 */
function analyseCreatorMessage({
  message = "",
  context = {},
} = {}) {
  const safeContext = {
    ...cloneValue(
      DEFAULT_CONTEXT
    ),
    ...(cloneValue(context) || {}),
  };

  const explicitRequests =
    detectExplicitRequests({
      message,
      context: safeContext,
    });

  const appearsFinishedResult =
    detectAppearsFinished(
      message
    );

  const emotionalStateResult =
    detectEmotionalState(
      message
    );

  const intentResult =
    detectIntent({
      message,
      explicitRequests,
    });

  const fragileIdeaResult =
    detectFragileIdea({
      message,
      emotionalState:
        emotionalStateResult.value,
      intent:
        intentResult.value,
    });

  const thinkingModeResult =
    detectThinkingMode({
      message,
      emotionalState:
        emotionalStateResult.value,
      intent:
        intentResult.value,
      explicitRequests,
      context: safeContext,
    });

  const creatorEnergyResult =
    detectCreatorEnergy({
      message,
      emotionalState:
        emotionalStateResult.value,
      context: safeContext,
    });

  const momentumResult =
    detectMomentum({
      message,
      emotionalState:
        emotionalStateResult.value,
      intent:
        intentResult.value,
      context: safeContext,
    });

  const guidanceWindowResult =
    detectGuidanceWindow({
      message,
      explicitRequests,
      emotionalState:
        emotionalStateResult.value,
      context: safeContext,
    });

  const informationSaturationResult =
    detectInformationSaturation({
      message,
      emotionalState:
        emotionalStateResult.value,
      context: safeContext,
    });

  const stageResult =
    detectCreatorStage({
      message,
      emotionalState:
        emotionalStateResult.value,
      intent:
        intentResult.value,
      context: safeContext,
    });

  const primaryStrategy =
    choosePrimaryStrategy({
      emotionalState:
        emotionalStateResult.value,
      intent:
        intentResult.value,
      stage:
        stageResult.value,
      fragileIdea:
        fragileIdeaResult.value,
      appearsFinished:
        appearsFinishedResult.value,
      explicitRequests,
      informationSaturation:
        informationSaturationResult.value,
    });

  const supportingStrategies =
    chooseSupportingStrategies({
      emotionalState:
        emotionalStateResult.value,
      intent:
        intentResult.value,
      primaryStrategy,
      context: safeContext,
      guidanceWindow:
        guidanceWindowResult.value,
    });

  const nextAction =
    chooseNextAction({
      emotionalState:
        emotionalStateResult.value,
      intent:
        intentResult.value,
      stage:
        stageResult.value,
      primaryStrategy,
      fragileIdea:
        fragileIdeaResult.value,
      appearsFinished:
        appearsFinishedResult.value,
      explicitRequests,
    });

  const responseGuidance =
    createResponseGuidance({
      emotionalState:
        emotionalStateResult.value,
      intent:
        intentResult.value,
      primaryStrategy,
      fragileIdea:
        fragileIdeaResult.value,
      appearsFinished:
        appearsFinishedResult.value,
      explicitRequests,
      thinkingMode:
        thinkingModeResult.value,
      guidanceWindow:
        guidanceWindowResult.value,
      informationSaturation:
        informationSaturationResult.value,
    });

  return {
    engine:
      "the-creator-engine",

    version:
      CREATOR_ENGINE_VERSION,

    input: {
      message:
        normaliseText(
          message
        ),
    },

    analysis: {
      emotionalState:
        emotionalStateResult,

      intent:
        intentResult,

      creatorStage:
        stageResult,

      fragileIdea:
        fragileIdeaResult,

      thinkingMode:
        thinkingModeResult,

      creatorEnergy:
        creatorEnergyResult,

      momentum:
        momentumResult,

      guidanceWindow:
        guidanceWindowResult,

      informationSaturation:
        informationSaturationResult,

      appearsFinished:
        appearsFinishedResult,

      explicitRequests: {
        values:
          cloneValue(
            explicitRequests
          ),

        hasExplicitRequest:
          explicitRequests.length >
          0,

        guidance:
          explicitRequests.includes(
            EXPLICIT_REQUESTS.GUIDANCE
          ),

        nextStep:
          explicitRequests.includes(
            EXPLICIT_REQUESTS.NEXT_STEP
          ),

        explanation:
          explicitRequests.includes(
            EXPLICIT_REQUESTS.EXPLANATION
          ),

        example:
          explicitRequests.includes(
            EXPLICIT_REQUESTS.EXAMPLE
          ),

        demonstration:
          explicitRequests.includes(
            EXPLICIT_REQUESTS.DEMONSTRATION
          ),

        creation:
          explicitRequests.includes(
            EXPLICIT_REQUESTS.CREATION
          ),

        refinement:
          explicitRequests.includes(
            EXPLICIT_REQUESTS.REFINEMENT
          ),

        publishing:
          explicitRequests.includes(
            EXPLICIT_REQUESTS.PUBLISHING
          ),

        continue:
          explicitRequests.includes(
            EXPLICIT_REQUESTS.CONTINUE
          ),

        pause:
          explicitRequests.includes(
            EXPLICIT_REQUESTS.PAUSE
          ),

        stop:
          explicitRequests.includes(
            EXPLICIT_REQUESTS.STOP
          ),

        space:
          explicitRequests.includes(
            EXPLICIT_REQUESTS.SPACE
          ),
      },
    },

    strategy: {
      primary:
        primaryStrategy,

      supporting:
        supportingStrategies,

      nextAction,
    },

    responseGuidance,

    avoid:
      createAvoidanceRules(),

    decisionSummary:
      createDecisionSummary({
        emotionalState:
          emotionalStateResult.value,

        intent:
          intentResult.value,

        stage:
          stageResult.value,

        primaryStrategy,

        nextAction,

        fragileIdea:
          fragileIdeaResult.value,

        thinkingMode:
          thinkingModeResult.value,

        appearsFinished:
          appearsFinishedResult.value,
      }),

    contextSnapshot:
      cloneValue(
        safeContext
      ),

    principles: {
      protectTheCreator:
        true,

      curiosityBeforeCriticism:
        true,

      creatorOwnsTheIdea:
        true,

      oneQuestionAtATime:
        true,

      confidenceBeforeCorrection:
        true,

      presentBehaviourLeads:
        true,

      contextInforms:
        true,

      creatorMayOverrideMentor:
        true,

      creatorMayRejectReflection:
        true,

      protectMomentum:
        true,

      protectThinkingTime:
        true,

      meetBeforeLeading:
        true,

      actionBeforeExplanationWhenAppropriate:
        true,

      doNotInterruptFlow:
        true,

      conversationServesCreation:
        true,

      doNotDiagnose:
        true,
    },

    createdAt:
      new Date().toISOString(),
  };
}

/**
 * Convenience method for checking whether the Mentor should
 * protect confidence before giving practical feedback.
 */
function shouldProtectCreator(
  plan
) {
  return Boolean(
    plan
      ?.principles
      ?.protectTheCreator &&
      (
        plan
          ?.analysis
          ?.fragileIdea
          ?.value ||
        plan
          ?.analysis
          ?.emotionalState
          ?.value ===
          EMOTIONAL_STATES.DOUBTING ||
        plan
          ?.analysis
          ?.creatorStage
          ?.value ===
          CREATOR_STAGES
            .BUILDING_CONFIDENCE
      )
  );
}

/**
 * Convenience method for checking whether an idea may
 * benefit from being preserved for later inspiration.
 */
function shouldOfferInspirationDrawer(
  plan
) {
  return Boolean(
    plan
      ?.analysis
      ?.fragileIdea
      ?.value ||
      (
        plan
          ?.analysis
          ?.emotionalState
          ?.value ===
          EMOTIONAL_STATES.DOUBTING &&
        plan
          ?.strategy
          ?.nextAction ===
          NEXT_ACTIONS
            .REASSURE_THEN_EXPLORE
      )
  );
}

/**
 * Convenience method for checking whether the creator
 * appears to still be thinking or speaking.
 */
function shouldHoldSpace(
  plan
) {
  return Boolean(
    plan
      ?.analysis
      ?.appearsFinished
      ?.value === false ||
    plan
      ?.strategy
      ?.primary ===
      MENTOR_STRATEGIES.HOLD_SPACE ||
    plan
      ?.strategy
      ?.nextAction ===
      NEXT_ACTIONS.WAIT_FOR_CREATOR
  );
}

/**
 * Convenience method for checking whether the creator
 * explicitly invited Mentor guidance.
 */
function creatorRequestedGuidance(
  plan
) {
  return Boolean(
    plan
      ?.analysis
      ?.explicitRequests
      ?.guidance ||
    plan
      ?.analysis
      ?.explicitRequests
      ?.nextStep
  );
}

/**
 * Convenience method for checking whether the creator
 * explicitly requested direct execution.
 */
function creatorRequestedAction(
  plan
) {
  const requests =
    plan
      ?.analysis
      ?.explicitRequests;

  return Boolean(
    requests?.creation ||
    requests?.refinement ||
    requests?.publishing ||
    requests?.demonstration ||
    requests?.nextStep
  );
}

export {
  CREATOR_ENGINE_VERSION,
  CREATOR_STAGES,
  CREATOR_INTENTS,
  EMOTIONAL_STATES,
  THINKING_MODES,
  CREATOR_ENERGY_LEVELS,
  MOMENTUM_LEVELS,
  GUIDANCE_WINDOWS,
  INFORMATION_SATURATION_LEVELS,
  MENTOR_STRATEGIES,
  NEXT_ACTIONS,
  EXPLICIT_REQUESTS,
  analyseCreatorMessage,
  shouldProtectCreator,
  shouldOfferInspirationDrawer,
  shouldHoldSpace,
  creatorRequestedGuidance,
  creatorRequestedAction,
};

export default analyseCreatorMessage;
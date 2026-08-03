/**
 * Creator Memory Engine
 * ------------------------------------------------------------
 * The interpretation, learning and recall-planning layer for
 * iBand's AI Mentor — The Creator.
 *
 * This engine does not persist memory directly.
 * CreatorMemory.js remains responsible for storage.
 *
 * This engine decides:
 * - What may be worth remembering.
 * - What kind of memory it may be.
 * - Whether it is temporary or long-term.
 * - How confident the Mentor should be.
 * - Whether a previous memory is being reinforced.
 * - Whether a contradiction may indicate growth or change.
 * - Whether a topic should be deferred rather than explored now.
 * - When a deferred memory may be useful to revisit.
 *
 * Core principles:
 * - Memory helps the Mentor better serve the creator.
 * - Present behaviour leads; long-term memory informs.
 * - Remember growth without trapping creators in old identities.
 * - Store possibilities, not psychological verdicts.
 * - Never diagnose or manipulate.
 * - Memory must protect confidence, momentum and autonomy.
 * - Recall is an invitation, never an interruption.
 */

const CREATOR_MEMORY_ENGINE_VERSION = "1.0.0";

const MEMORY_CATEGORIES = Object.freeze({
  CREATIVE_IDENTITY: "creative-identity",
  CREATIVE_PREFERENCE: "creative-preference",
  THINKING_PREFERENCE: "thinking-preference",
  GUIDANCE_PREFERENCE: "guidance-preference",
  LEARNING_PREFERENCE: "learning-preference",
  COMMUNICATION_PREFERENCE: "communication-preference",
  RESPONSE_DEPTH_PREFERENCE: "response-depth-preference",
  CREATIVE_PROCESS: "creative-process",
  CREATIVE_ENTRY_POINT: "creative-entry-point",
  CREATIVE_NAVIGATION_STYLE: "creative-navigation-style",
  CREATIVE_TEMPO: "creative-tempo",
  CREATIVE_VOCABULARY: "creative-vocabulary",
  CREATIVE_RITUAL: "creative-ritual",
  SHARED_MEANING: "shared-meaning",
  SWEET_SPOT: "sweet-spot",
  STRETCH_ZONE: "stretch-zone",
  CONFIDENCE_SIGNAL: "confidence-signal",
  MOMENTUM_SIGNAL: "momentum-signal",
  COGNITIVE_LOAD_SIGNAL: "cognitive-load-signal",
  AUTOMATIC_SKILL: "automatic-skill",
  DEVELOPING_SKILL: "developing-skill",
  GROWTH_SIGNAL: "growth-signal",
  HISTORICAL_IDENTITY: "historical-identity",
  CURRENT_STATE: "current-state",
  BRIEF_DETOUR: "brief-detour",
  DEFERRED_TOPIC: "deferred-topic",
  INSPIRATION_SOURCE: "inspiration-source",
  CREATIVE_SPARK: "creative-spark",
  PROJECT_CONTEXT: "project-context",
  RELATIONSHIP_CONTEXT: "relationship-context",
  UNKNOWN: "unknown",
});

const MEMORY_HORIZONS = Object.freeze({
  MOMENT: "moment",
  SESSION: "session",
  SHORT_TERM: "short-term",
  LONG_TERM: "long-term",
  HISTORICAL: "historical",
  UNDECIDED: "undecided",
});

const MEMORY_STATUSES = Object.freeze({
  CANDIDATE: "candidate",
  EMERGING: "emerging",
  REINFORCED: "reinforced",
  ESTABLISHED: "established",
  SUPERSEDED: "superseded",
  HISTORICAL: "historical",
  ARCHIVED: "archived",
  REJECTED: "rejected",
});

const MEMORY_ACTIONS = Object.freeze({
  IGNORE: "ignore",
  CAPTURE_OBSERVATION: "capture-observation",
  SAVE_PATTERN: "save-pattern",
  UPDATE_PROFILE: "update-profile",
  REINFORCE_MEMORY: "reinforce-memory",
  WEAKEN_MEMORY: "weaken-memory",
  SUPERSEDE_MEMORY: "supersede-memory",
  ARCHIVE_AS_HISTORY: "archive-as-history",
  SAVE_DEFERRED_TOPIC: "save-deferred-topic",
  REVISIT_DEFERRED_TOPIC: "revisit-deferred-topic",
  HOLD_FOR_MORE_EVIDENCE: "hold-for-more-evidence",
});

const RECALL_PRIORITIES = Object.freeze({
  NONE: "none",
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high",
  IMMEDIATE: "immediate",
});

const RECALL_TIMINGS = Object.freeze({
  NOT_NOW: "not-now",
  LATER_THIS_SESSION: "later-this-session",
  NEXT_RELEVANT_MOMENT: "next-relevant-moment",
  NEXT_SESSION: "next-session",
  WHEN_CREATOR_IS_READY: "when-creator-is-ready",
  WHEN_TOPIC_RECURS: "when-topic-recurs",
  NEVER_AUTOMATICALLY: "never-automatically",
});

const EVIDENCE_TYPES = Object.freeze({
  EXPLICIT_STATEMENT: "explicit-statement",
  REPEATED_LANGUAGE: "repeated-language",
  REPEATED_BEHAVIOUR: "repeated-behaviour",
  SESSION_PATTERN: "session-pattern",
  CORRECTION_FROM_CREATOR: "correction-from-creator",
  CREATOR_CONFIRMATION: "creator-confirmation",
  CREATOR_REJECTION: "creator-rejection",
  PROJECT_OUTCOME: "project-outcome",
  TEMPORARY_STATE: "temporary-state",
  UNKNOWN: "unknown",
});

const DEFAULT_MEMORY_CONTEXT = Object.freeze({
  creatorId: null,
  creatorJourney: "guide",
  creatorType: null,
  projectType: null,
  activeProject: null,
  activeIdea: null,

  conversationMode: null,
  thinkingMode: null,
  creatorEnergy: null,
  momentum: null,
  guidanceWindow: null,
  informationSaturation: null,

  creatorMessageCount: 0,
  mentorMessageCount: 0,

  recentCreatorMessages: [],
  recentMentorMessages: [],
  recentConversations: [],

  existingMemories: [],
  existingPatterns: [],
  existingObservations: [],
  creatorProfile: null,

  creatorExplicitlyAskedToRemember: false,
  creatorExplicitlyAskedNotToRemember: false,
  creatorExplicitlyAskedToRevisit: false,

  currentTimestamp: null,
});

/**
 * Creates a timestamp.
 */
function createTimestamp() {
  return new Date().toISOString();
}

/**
 * Creates a lightweight unique id.
 */
function createMemoryPlanId(prefix = "memory-plan") {
  const randomValue = Math.random()
    .toString(36)
    .slice(2, 10);

  return `${prefix}-${Date.now()}-${randomValue}`;
}

/**
 * Safely clones plain objects.
 */
function cloneValue(value) {
  if (value === undefined) {
    return undefined;
  }

  return JSON.parse(JSON.stringify(value));
}

/**
 * Normalises text for matching.
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
 * Produces a clean string.
 */
function cleanString(value) {
  return typeof value === "string"
    ? value.trim()
    : "";
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
 * Restricts numbers to 0–1.
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
 * Returns true when text includes one of the phrases.
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
 * Converts recent messages into plain searchable text.
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
 * Detects whether the creator wants the current thought
 * remembered explicitly.
 */
function detectExplicitMemoryIntent({
  message,
  context,
}) {
  const text = normaliseText(message);

  const rememberPhrases = [
    "remember this",
    "remember that",
    "add this to memory",
    "save this",
    "keep this in mind",
    "don't forget this",
    "dont forget this",
    "lock this in",
    "anchor this",
  ];

  const forgetPhrases = [
    "don't remember this",
    "dont remember this",
    "forget that",
    "remove that from memory",
    "delete that memory",
  ];

  if (
    context?.creatorExplicitlyAskedNotToRemember ||
    includesAny(text, forgetPhrases)
  ) {
    return createDetection({
      value: "do-not-store",
      confidence: 0.98,
      evidence: forgetPhrases.filter(
        (phrase) => text.includes(phrase)
      ),
    });
  }

  if (
    context?.creatorExplicitlyAskedToRemember ||
    includesAny(text, rememberPhrases)
  ) {
    return createDetection({
      value: "store",
      confidence: 0.98,
      evidence: rememberPhrases.filter(
        (phrase) => text.includes(phrase)
      ),
    });
  }

  return createDetection({
    value: "implicit",
    confidence: 0.45,
    evidence: [],
  });
}

/**
 * Detects a brief detour.
 *
 * A brief detour is a thought the creator wants acknowledged
 * or captured without opening a long discussion.
 */
function detectBriefDetour(message) {
  const text = normaliseText(message);

  const phrases = [
    "one quick thing",
    "just quickly",
    "before we continue",
    "one last thing",
    "i don't want to spend long",
    "i dont want to spend long",
    "not to go into it",
    "without going into it",
    "just wanted to say",
    "just wanted to get that out",
    "we don't need to discuss it",
    "we dont need to discuss it",
  ];

  const matches = phrases.filter((phrase) =>
    text.includes(phrase)
  );

  return createDetection({
    value: matches.length > 0,
    confidence:
      matches.length > 0 ? 0.9 : 0.36,
    evidence: matches,
  });
}

/**
 * Detects whether the thought should be deferred.
 */
function detectDeferredTopic({
  message,
  context,
  briefDetour,
}) {
  const text = normaliseText(message);

  const deferPhrases = [
    "we can come back to that",
    "save that for later",
    "another time",
    "not right now",
    "maybe later",
    "we'll discuss that later",
    "well discuss that later",
    "don't open that now",
    "dont open that now",
  ];

  const explicitDefer =
    includesAny(text, deferPhrases);

  const flowDefer =
    briefDetour.value &&
    [
      "flow",
      "build",
      "creation",
    ].includes(context?.thinkingMode);

  const shouldDefer =
    explicitDefer || flowDefer;

  return createDetection({
    value: shouldDefer,
    confidence: shouldDefer ? 0.88 : 0.4,
    evidence: [
      ...deferPhrases.filter((phrase) =>
        text.includes(phrase)
      ),
      flowDefer
        ? "brief detour during active creative mode"
        : null,
    ],
  });
}

/**
 * Detects temporary present-state information.
 */
function detectTemporaryState({
  message,
  context,
}) {
  const text = normaliseText(message);

  const temporaryPhrases = [
    "today",
    "tonight",
    "right now",
    "this morning",
    "this evening",
    "at the moment",
    "for now",
    "currently",
    "today i just want",
    "right now i want",
  ];

  const dynamicContextPresent = Boolean(
    context?.thinkingMode ||
      context?.creatorEnergy ||
      context?.momentum ||
      context?.guidanceWindow
  );

  const matches = temporaryPhrases.filter(
    (phrase) => text.includes(phrase)
  );

  const isTemporary =
    matches.length > 0 ||
    dynamicContextPresent;

  return createDetection({
    value: isTemporary,
    confidence: isTemporary ? 0.76 : 0.42,
    evidence: [
      ...matches,
      dynamicContextPresent
        ? "dynamic session context present"
        : null,
    ],
  });
}

/**
 * Detects creator communication and guidance preferences.
 */
function detectGuidancePreference(message) {
  const text = normaliseText(message);

  const preferenceRules = [
    {
      value: "concise-during-build",
      phrases: [
        "when i'm building",
        "when im building",
        "just give me the facts",
        "no philosophy",
        "just the next step",
        "path code commit",
        "keep it concise",
        "don't slow me down",
        "dont slow me down",
      ],
    },
    {
      value: "detailed-during-exploration",
      phrases: [
        "i want to dissect",
        "go deeper",
        "talk it through",
        "let's explore",
        "lets explore",
        "explain everything",
        "i want the detail",
      ],
    },
    {
      value: "one-step-at-a-time",
      phrases: [
        "one step at a time",
        "one task at a time",
        "one commit at a time",
        "slow it down",
        "baby steps",
      ],
    },
    {
      value: "lead-when-requested",
      phrases: [
        "you lead",
        "captain you lead",
        "guide me",
        "take me through it",
        "what's next",
        "whats next",
      ],
    },
    {
      value: "space-before-response",
      phrases: [
        "give me a moment",
        "let me think",
        "don't jump in",
        "dont jump in",
        "wait a few seconds",
        "i need silence",
      ],
    },
  ];

  for (const rule of preferenceRules) {
    const matches = rule.phrases.filter(
      (phrase) => text.includes(phrase)
    );

    if (matches.length > 0) {
      return createDetection({
        value: rule.value,
        confidence:
          0.72 + Math.min(matches.length * 0.08, 0.2),
        evidence: matches,
      });
    }
  }

  return createDetection({
    value: null,
    confidence: 0.3,
    evidence: [],
  });
}

/**
 * Detects creator vocabulary and shared shorthand.
 */
function detectCreativeVocabulary({
  message,
  context,
}) {
  const originalText = cleanString(message);
  const text = normaliseText(message);

  const knownTerms = [
    "vibe",
    "resonating",
    "resonate",
    "hits",
    "slaps",
    "groove",
    "drive",
    "warm",
    "warmer",
    "colder",
    "cinematic",
    "raw",
    "grit",
    "bite",
    "heart",
    "energy",
    "flow",
    "spark",
    "alignment",
    "sweet spot",
    "warp drive",
    "warp drives",
    "rabbit hole",
    "let's build",
    "lets build",
    "captain's protocol",
    "captains protocol",
  ];

  const foundTerms = knownTerms.filter(
    (term) => text.includes(term)
  );

  const possibleQuotedPhrases =
    originalText.match(
      /["“”']([^"“”']{2,60})["“”']/g
    ) || [];

  return {
    terms: uniqueValues(foundTerms),
    quotedPhrases: uniqueValues(
      possibleQuotedPhrases.map((phrase) =>
        phrase.replace(/["“”']/g, "").trim()
      )
    ),
    likelySharedLanguage:
      foundTerms.some((term) =>
        [
          "warp drive",
          "warp drives",
          "rabbit hole",
          "let's build",
          "lets build",
          "captain's protocol",
          "captains protocol",
        ].includes(term)
      ) ||
      Boolean(context?.relationshipContext),
  };
}

/**
 * Detects creative process signals.
 */
function detectCreativeProcess(message) {
  const text = normaliseText(message);

  const rules = [
    {
      value: "blank-canvas",
      phrases: [
        "blank canvas",
        "start from nothing",
        "first line",
        "just start",
      ],
    },
    {
      value: "transform",
      phrases: [
        "transform",
        "reinterpret",
        "my own version",
        "change it into",
        "turn it into",
      ],
    },
    {
      value: "remix",
      phrases: [
        "remix",
        "mix together",
        "add a beat",
        "dj",
        "sample",
        "layer it",
      ],
    },
    {
      value: "combine",
      phrases: [
        "combine",
        "put these together",
        "mix the ideas",
        "blend",
      ],
    },
    {
      value: "discover-through-making",
      phrases: [
        "discover it as i go",
        "create during the journey",
        "see where it goes",
        "start in the middle",
        "build around it",
        "keeps sketching",
      ],
    },
    {
      value: "react-and-refine",
      phrases: [
        "warmer",
        "colder",
        "more",
        "less",
        "closer",
        "that's it",
        "thats it",
        "give me another one",
      ],
    },
    {
      value: "problem-led-invention",
      phrases: [
        "there has to be a better way",
        "solve the problem",
        "prevent this",
        "invent",
        "news report",
      ],
    },
  ];

  const matches = rules
    .map((rule) => ({
      process: rule.value,
      evidence: rule.phrases.filter(
        (phrase) => text.includes(phrase)
      ),
    }))
    .filter((item) => item.evidence.length > 0);

  if (matches.length === 0) {
    return createDetection({
      value: null,
      confidence: 0.3,
      evidence: [],
    });
  }

  const strongest = matches.sort(
    (a, b) =>
      b.evidence.length - a.evidence.length
  )[0];

  return createDetection({
    value: strongest.process,
    confidence:
      0.65 +
      Math.min(
        strongest.evidence.length * 0.08,
        0.24
      ),
    evidence: strongest.evidence,
  });
}

/**
 * Detects creative tempo preference.
 */
function detectCreativeTempo({
  message,
  context,
}) {
  const text = normaliseText(message);

  const fastPhrases = [
    "next",
    "fire away",
    "code please",
    "let's build",
    "lets build",
    "keep going",
    "don't stop",
    "dont stop",
    "we're running",
    "were running",
  ];

  const reflectivePhrases = [
    "let me think",
    "sit with it",
    "talk it through",
    "dissect this",
    "go deeper",
    "let's explore",
    "lets explore",
  ];

  if (
    includesAny(text, fastPhrases) ||
    context?.thinkingMode === "build" ||
    context?.momentum === "strong"
  ) {
    return createDetection({
      value: "fast-action",
      confidence: 0.82,
      evidence: [
        ...fastPhrases.filter((phrase) =>
          text.includes(phrase)
        ),
        context?.thinkingMode === "build"
          ? "build mode"
          : null,
      ],
    });
  }

  if (
    includesAny(text, reflectivePhrases) ||
    context?.thinkingMode === "reflection" ||
    context?.thinkingMode === "exploration"
  ) {
    return createDetection({
      value: "slow-reflective",
      confidence: 0.78,
      evidence: [
        ...reflectivePhrases.filter(
          (phrase) => text.includes(phrase)
        ),
        context?.thinkingMode,
      ],
    });
  }

  return createDetection({
    value: "adaptive",
    confidence: 0.46,
    evidence: [],
  });
}

/**
 * Detects signs of skill automaticity.
 */
function detectAutomaticSkill(message) {
  const text = normaliseText(message);

  const phrases = [
    "now i do it instinctively",
    "i don't have to think about it",
    "i dont have to think about it",
    "it's automatic now",
    "its automatic now",
    "second nature",
    "muscle memory",
    "i just do it",
    "without thinking",
  ];

  const matches = phrases.filter((phrase) =>
    text.includes(phrase)
  );

  return createDetection({
    value: matches.length > 0,
    confidence:
      matches.length > 0 ? 0.88 : 0.34,
    evidence: matches,
  });
}

/**
 * Detects growth language.
 */
function detectGrowthSignal(message) {
  const text = normaliseText(message);

  const phrases = [
    "i've progressed",
    "ive progressed",
    "i'm better at",
    "im better at",
    "now i can",
    "used to struggle",
    "don't need help with",
    "dont need help with",
    "more confident now",
    "i've changed",
    "ive changed",
    "who i've become",
    "who ive become",
  ];

  const matches = phrases.filter((phrase) =>
    text.includes(phrase)
  );

  return createDetection({
    value: matches.length > 0,
    confidence:
      matches.length > 0 ? 0.84 : 0.36,
    evidence: matches,
  });
}

/**
 * Finds potentially related existing memories.
 */
function findRelatedMemories({
  candidate,
  existingMemories,
}) {
  if (
    !candidate ||
    !Array.isArray(existingMemories)
  ) {
    return [];
  }

  const candidateText = normaliseText(
    [
      candidate.title,
      candidate.content,
      candidate.value,
      candidate.category,
    ]
      .filter(Boolean)
      .join(" ")
  );

  if (!candidateText) {
    return [];
  }

  const candidateWords = new Set(
    candidateText
      .split(" ")
      .filter((word) => word.length >= 4)
  );

  return existingMemories
    .map((memory) => {
      const memoryText = normaliseText(
        [
          memory.title,
          memory.content,
          memory.text,
          memory.value,
          memory.category,
          memory.name,
          memory.description,
        ]
          .filter(Boolean)
          .join(" ")
      );

      const memoryWords = memoryText
        .split(" ")
        .filter((word) => word.length >= 4);

      const overlap = memoryWords.filter(
        (word) => candidateWords.has(word)
      ).length;

      const denominator = Math.max(
        candidateWords.size,
        1
      );

      return {
        memory,
        similarity: overlap / denominator,
      };
    })
    .filter((item) => item.similarity >= 0.28)
    .sort(
      (a, b) => b.similarity - a.similarity
    );
}

/**
 * Detects contradiction or evolution.
 */
function detectMemoryRelationship({
  candidate,
  relatedMemories,
  temporaryState,
}) {
  if (!candidate || relatedMemories.length === 0) {
    return {
      relationship: "new",
      relatedMemory: null,
      confidence: 0.6,
    };
  }

  const strongest = relatedMemories[0];
  const oldValue =
    strongest.memory?.value ||
    strongest.memory?.content ||
    strongest.memory?.text ||
    "";

  const newValue =
    candidate.value ||
    candidate.content ||
    "";

  if (
    normaliseText(oldValue) ===
    normaliseText(newValue)
  ) {
    return {
      relationship: "reinforcement",
      relatedMemory: strongest.memory,
      confidence: Math.min(
        0.95,
        0.65 + strongest.similarity
      ),
    };
  }

  if (temporaryState.value) {
    return {
      relationship: "temporary-override",
      relatedMemory: strongest.memory,
      confidence: 0.76,
    };
  }

  return {
    relationship: "possible-evolution",
    relatedMemory: strongest.memory,
    confidence: Math.min(
      0.88,
      0.55 + strongest.similarity
    ),
  };
}

/**
 * Calculates a safe initial confidence.
 */
function calculateCandidateConfidence({
  explicitMemoryIntent,
  categoryDetection,
  temporaryState,
  evidenceCount,
}) {
  let confidence = 0.46;

  if (explicitMemoryIntent.value === "store") {
    confidence += 0.32;
  }

  if (categoryDetection?.confidence) {
    confidence +=
      categoryDetection.confidence * 0.18;
  }

  confidence += Math.min(
    evidenceCount * 0.04,
    0.16
  );

  if (temporaryState.value) {
    confidence -= 0.08;
  }

  return clampConfidence(confidence);
}

/**
 * Creates a memory candidate.
 */
function createMemoryCandidate({
  category,
  title,
  content,
  value = null,
  horizon = MEMORY_HORIZONS.UNDECIDED,
  confidence = 0.5,
  evidence = [],
  metadata = {},
}) {
  return {
    id: createMemoryPlanId("candidate"),
    category,
    title: cleanString(title),
    content: cleanString(content),
    value,
    horizon,
    status: MEMORY_STATUSES.CANDIDATE,
    confidence: clampConfidence(confidence),
    evidence: uniqueValues(evidence),
    metadata: cloneValue(metadata),
    createdAt: createTimestamp(),
  };
}

/**
 * Builds candidate memories from the current message.
 */
function buildMemoryCandidates({
  message,
  context,
  detections,
}) {
  const candidates = [];
  const cleanMessage = cleanString(message);

  const {
    explicitMemoryIntent,
    briefDetour,
    deferredTopic,
    temporaryState,
    guidancePreference,
    creativeProcess,
    creativeTempo,
    automaticSkill,
    growthSignal,
    vocabulary,
  } = detections;

  if (explicitMemoryIntent.value === "do-not-store") {
    return [];
  }

  if (guidancePreference.value) {
    candidates.push(
      createMemoryCandidate({
        category:
          MEMORY_CATEGORIES.GUIDANCE_PREFERENCE,
        title: "Guidance preference",
        content: cleanMessage,
        value: guidancePreference.value,
        horizon: temporaryState.value
          ? MEMORY_HORIZONS.SESSION
          : MEMORY_HORIZONS.LONG_TERM,
        confidence:
          calculateCandidateConfidence({
            explicitMemoryIntent,
            categoryDetection:
              guidancePreference,
            temporaryState,
            evidenceCount:
              guidancePreference.evidence.length,
          }),
        evidence:
          guidancePreference.evidence,
        metadata: {
          thinkingMode:
            context?.thinkingMode || null,
        },
      })
    );
  }

  if (creativeProcess.value) {
    candidates.push(
      createMemoryCandidate({
        category:
          MEMORY_CATEGORIES.CREATIVE_PROCESS,
        title: "Creative process signal",
        content: cleanMessage,
        value: creativeProcess.value,
        horizon: MEMORY_HORIZONS.LONG_TERM,
        confidence:
          calculateCandidateConfidence({
            explicitMemoryIntent,
            categoryDetection: creativeProcess,
            temporaryState,
            evidenceCount:
              creativeProcess.evidence.length,
          }),
        evidence: creativeProcess.evidence,
      })
    );
  }

  if (creativeTempo.value !== "adaptive") {
    candidates.push(
      createMemoryCandidate({
        category:
          MEMORY_CATEGORIES.CREATIVE_TEMPO,
        title: "Creative tempo signal",
        content: cleanMessage,
        value: creativeTempo.value,
        horizon: temporaryState.value
          ? MEMORY_HORIZONS.SESSION
          : MEMORY_HORIZONS.SHORT_TERM,
        confidence:
          calculateCandidateConfidence({
            explicitMemoryIntent,
            categoryDetection: creativeTempo,
            temporaryState,
            evidenceCount:
              creativeTempo.evidence.length,
          }),
        evidence: creativeTempo.evidence,
        metadata: {
          sessionSpecific:
            temporaryState.value,
        },
      })
    );
  }

  if (automaticSkill.value) {
    candidates.push(
      createMemoryCandidate({
        category:
          MEMORY_CATEGORIES.AUTOMATIC_SKILL,
        title: "Skill becoming automatic",
        content: cleanMessage,
        value: "automaticity-detected",
        horizon: MEMORY_HORIZONS.LONG_TERM,
        confidence: 0.84,
        evidence: automaticSkill.evidence,
      })
    );
  }

  if (growthSignal.value) {
    candidates.push(
      createMemoryCandidate({
        category:
          MEMORY_CATEGORIES.GROWTH_SIGNAL,
        title: "Creator growth signal",
        content: cleanMessage,
        value: "creator-reports-growth",
        horizon: MEMORY_HORIZONS.HISTORICAL,
        confidence: 0.82,
        evidence: growthSignal.evidence,
      })
    );
  }

  vocabulary.terms.forEach((term) => {
    candidates.push(
      createMemoryCandidate({
        category:
          vocabulary.likelySharedLanguage
            ? MEMORY_CATEGORIES.SHARED_MEANING
            : MEMORY_CATEGORIES
                .CREATIVE_VOCABULARY,
        title: vocabulary.likelySharedLanguage
          ? "Shared creative phrase"
          : "Creator vocabulary",
        content: term,
        value: term,
        horizon: MEMORY_HORIZONS.LONG_TERM,
        confidence:
          vocabulary.likelySharedLanguage
            ? 0.72
            : 0.58,
        evidence: [term],
      })
    );
  });

  if (briefDetour.value) {
    candidates.push(
      createMemoryCandidate({
        category:
          deferredTopic.value
            ? MEMORY_CATEGORIES.DEFERRED_TOPIC
            : MEMORY_CATEGORIES.BRIEF_DETOUR,
        title: deferredTopic.value
          ? "Deferred creator topic"
          : "Brief creator detour",
        content: cleanMessage,
        value: cleanMessage,
        horizon: deferredTopic.value
          ? MEMORY_HORIZONS.SHORT_TERM
          : MEMORY_HORIZONS.SESSION,
        confidence: 0.86,
        evidence: [
          ...briefDetour.evidence,
          ...deferredTopic.evidence,
        ],
        metadata: {
          originalThinkingMode:
            context?.thinkingMode || null,
          originalProject:
            context?.activeProject || null,
          returnWithoutOpeningRabbitHole:
            true,
        },
      })
    );
  }

  if (
    explicitMemoryIntent.value === "store" &&
    candidates.length === 0
  ) {
    candidates.push(
      createMemoryCandidate({
        category:
          MEMORY_CATEGORIES.RELATIONSHIP_CONTEXT,
        title: "Creator-requested memory",
        content: cleanMessage,
        value: cleanMessage,
        horizon: MEMORY_HORIZONS.LONG_TERM,
        confidence: 0.88,
        evidence:
          explicitMemoryIntent.evidence,
      })
    );
  }

  return candidates;
}

/**
 * Chooses the storage action for a candidate.
 */
function chooseMemoryAction({
  candidate,
  relationship,
}) {
  if (!candidate) {
    return MEMORY_ACTIONS.IGNORE;
  }

  if (
    candidate.category ===
    MEMORY_CATEGORIES.DEFERRED_TOPIC
  ) {
    return MEMORY_ACTIONS.SAVE_DEFERRED_TOPIC;
  }

  if (
    relationship.relationship ===
    "reinforcement"
  ) {
    return MEMORY_ACTIONS.REINFORCE_MEMORY;
  }

  if (
    relationship.relationship ===
    "possible-evolution"
  ) {
    return MEMORY_ACTIONS.SUPERSEDE_MEMORY;
  }

  if (
    relationship.relationship ===
    "temporary-override"
  ) {
    return MEMORY_ACTIONS.CAPTURE_OBSERVATION;
  }

  if (candidate.confidence >= 0.82) {
    if (
      [
        MEMORY_CATEGORIES
          .GUIDANCE_PREFERENCE,
        MEMORY_CATEGORIES
          .LEARNING_PREFERENCE,
        MEMORY_CATEGORIES
          .COMMUNICATION_PREFERENCE,
        MEMORY_CATEGORIES
          .RESPONSE_DEPTH_PREFERENCE,
      ].includes(candidate.category)
    ) {
      return MEMORY_ACTIONS.UPDATE_PROFILE;
    }

    return MEMORY_ACTIONS.SAVE_PATTERN;
  }

  if (candidate.confidence >= 0.58) {
    return MEMORY_ACTIONS.CAPTURE_OBSERVATION;
  }

  return MEMORY_ACTIONS.HOLD_FOR_MORE_EVIDENCE;
}

/**
 * Creates storage instructions compatible with CreatorMemory.js.
 */
function createStorageInstruction({
  candidate,
  action,
  relationship,
}) {
  const common = {
    candidateId: candidate.id,
    action,
    category: candidate.category,
    confidence: candidate.confidence,
    horizon: candidate.horizon,
    relatedMemoryId:
      relationship.relatedMemory?.id || null,
  };

  if (
    action ===
    MEMORY_ACTIONS.UPDATE_PROFILE
  ) {
    return {
      ...common,
      targetMethod: "updateCreatorProfile",
      payload: {
        mentorLearning: {
          category: candidate.category,
          value: candidate.value,
          confidence: candidate.confidence,
          evidence: candidate.evidence,
          updatedAt: createTimestamp(),
        },
      },
    };
  }

  if (
    action ===
    MEMORY_ACTIONS.SAVE_PATTERN
  ) {
    return {
      ...common,
      targetMethod: "savePattern",
      payload: {
        name: candidate.title,
        description: candidate.content,
        category: candidate.category,
        evidence: candidate.evidence,
        confidence: candidate.confidence,
        status:
          candidate.confidence >= 0.88
            ? "confirmed"
            : "emerging",
        positiveReflection: "",
        metadata: {
          horizon: candidate.horizon,
          value: candidate.value,
        },
      },
    };
  }

  if (
    action ===
      MEMORY_ACTIONS.CAPTURE_OBSERVATION ||
    action ===
      MEMORY_ACTIONS.HOLD_FOR_MORE_EVIDENCE
  ) {
    return {
      ...common,
      targetMethod: "addObservation",
      payload: {
        text: candidate.content,
        category: candidate.category,
        evidence: candidate.evidence,
        confidence: candidate.confidence,
        status: "emerging",
        permissionToReflect: false,
        metadata: {
          horizon: candidate.horizon,
          value: candidate.value,
          holdForMoreEvidence:
            action ===
            MEMORY_ACTIONS.HOLD_FOR_MORE_EVIDENCE,
        },
      },
    };
  }

  if (
    action ===
    MEMORY_ACTIONS.SAVE_DEFERRED_TOPIC
  ) {
    return {
      ...common,
      targetMethod: "saveIdea",
      payload: {
        title: candidate.title,
        content: candidate.content,
        creatorType: "",
        status: "paused",
        source: "creator",
        tags: [
          "deferred-topic",
          candidate.category,
        ],
        importance: "medium",
        emotionalContext: null,
        relatedProjectId:
          candidate.metadata?.originalProject?.id ||
          null,
        metadata: {
          ...candidate.metadata,
          recallTiming:
            RECALL_TIMINGS.NEXT_RELEVANT_MOMENT,
          capturedAt: createTimestamp(),
        },
      },
    };
  }

  if (
    action ===
      MEMORY_ACTIONS.REINFORCE_MEMORY ||
    action ===
      MEMORY_ACTIONS.SUPERSEDE_MEMORY
  ) {
    return {
      ...common,
      targetMethod: null,
      payload: {
        existingMemory:
          relationship.relatedMemory,
        candidate,
        relationship:
          relationship.relationship,
      },
      requiresMemoryAdapterResolution: true,
    };
  }

  return {
    ...common,
    targetMethod: null,
    payload: null,
  };
}

/**
 * Scores whether a deferred topic is relevant now.
 */
function scoreDeferredRecall({
  memory,
  message,
  context,
}) {
  const currentText = normaliseText(
    [
      message,
      context?.conversationMode,
      context?.thinkingMode,
      context?.projectType,
      context?.activeProject?.title,
    ]
      .filter(Boolean)
      .join(" ")
  );

  const memoryText = normaliseText(
    [
      memory?.title,
      memory?.content,
      memory?.description,
      memory?.metadata?.value,
      memory?.metadata?.originalProject?.title,
    ]
      .filter(Boolean)
      .join(" ")
  );

  const currentWords = new Set(
    currentText
      .split(" ")
      .filter((word) => word.length >= 4)
  );

  const memoryWords = memoryText
    .split(" ")
    .filter((word) => word.length >= 4);

  const overlap = memoryWords.filter((word) =>
    currentWords.has(word)
  ).length;

  let score =
    overlap /
    Math.max(memoryWords.length, 1);

  if (
    context?.thinkingMode === "flow" ||
    context?.thinkingMode === "build"
  ) {
    score -= 0.22;
  }

  if (
    context?.guidanceWindow ===
    "closed-for-now"
  ) {
    score -= 0.3;
  }

  if (
    context?.creatorExplicitlyAskedToRevisit
  ) {
    score += 0.5;
  }

  return Math.max(0, Math.min(1, score));
}

/**
 * Creates recall recommendations.
 */
function planDeferredRecall({
  message,
  context,
}) {
  const memories = Array.isArray(
    context?.existingMemories
  )
    ? context.existingMemories
    : [];

  const deferredMemories = memories.filter(
    (memory) =>
      memory.category ===
        MEMORY_CATEGORIES.DEFERRED_TOPIC ||
      memory.tags?.includes?.("deferred-topic") ||
      memory.metadata?.recallTiming ===
        RECALL_TIMINGS.NEXT_RELEVANT_MOMENT
  );

  const ranked = deferredMemories
    .map((memory) => ({
      memory,
      relevance: scoreDeferredRecall({
        memory,
        message,
        context,
      }),
    }))
    .sort(
      (a, b) => b.relevance - a.relevance
    );

  const strongest = ranked[0];

  if (!strongest || strongest.relevance < 0.45) {
    return {
      shouldRecall: false,
      priority: RECALL_PRIORITIES.NONE,
      timing: RECALL_TIMINGS.NOT_NOW,
      memory: null,
      reason:
        "No deferred memory is sufficiently relevant.",
    };
  }

  if (
    context?.thinkingMode === "flow" ||
    context?.thinkingMode === "build" ||
    context?.guidanceWindow ===
      "closed-for-now"
  ) {
    return {
      shouldRecall: false,
      priority: RECALL_PRIORITIES.MEDIUM,
      timing:
        RECALL_TIMINGS.NEXT_RELEVANT_MOMENT,
      memory: cloneValue(strongest.memory),
      reason:
        "The memory is relevant, but current creative flow should not be interrupted.",
    };
  }

  return {
    shouldRecall: true,
    priority:
      strongest.relevance >= 0.75
        ? RECALL_PRIORITIES.HIGH
        : RECALL_PRIORITIES.MEDIUM,
    timing:
      RECALL_TIMINGS.WHEN_CREATOR_IS_READY,
    memory: cloneValue(strongest.memory),
    reason:
      "A previously deferred topic is relevant to the current conversation.",
  };
}

/**
 * Creates guidance for future response generation.
 */
function createResponseGuidance({
  briefDetour,
  deferredTopic,
  recallPlan,
}) {
  const guidance = [
    "Memory should help the Mentor serve the creator more effectively.",
    "Treat stored conclusions as possibilities, not permanent definitions.",
    "Present behaviour should override historical preference when they conflict.",
    "Never diagnose the creator.",
    "Never use memory to pressure, manipulate or shame.",
    "Do not surface a memory merely to demonstrate that it was remembered.",
    "Only recall information when it is relevant and useful.",
  ];

  if (briefDetour.value) {
    guidance.push(
      "Acknowledge the brief thought without opening a long discussion.",
      "Confirm that the thought can be captured safely.",
      "Return smoothly to the previous task.",
      "Leave the door open to revisit the subject later."
    );
  }

  if (deferredTopic.value) {
    guidance.push(
      "Do not explore the deferred topic now.",
      "Store enough context to revisit it meaningfully.",
      "Remember why the subject was deferred.",
      "Do not frame deferral as avoidance or failure."
    );
  }

  if (recallPlan.shouldRecall) {
    guidance.push(
      "Introduce the memory gently and with permission.",
      "Explain why it seems relevant now.",
      "Mention that it was previously deferred to protect flow when appropriate.",
      "Allow the creator to decline and continue."
    );
  }

  return uniqueValues(guidance);
}

/**
 * Creates safety guard rails.
 */
function createGuardRails() {
  return [
    "Do not create psychological diagnoses.",
    "Do not infer protected or deeply sensitive traits from creative behaviour.",
    "Do not treat one message as a permanent preference.",
    "Do not trap the creator inside an outdated identity.",
    "Do not surface private memories without contextual relevance.",
    "Do not interpret synchronisation as consent or agreement.",
    "Do not imitate vocabulary in a way that feels forced or culturally performative.",
    "Do not automatically revisit every deferred topic.",
    "Do not interrupt build or flow mode simply because a memory is relevant.",
    "Do not claim certainty about the creator's internal state.",
    "Do not store trivial details merely because storage is available.",
    "Do not weaken creator autonomy through excessive personalisation.",
  ];
}

/**
 * Creates a safe fallback result.
 */
function createFallbackMemoryPlan({
  message,
  context,
  error = null,
}) {
  return {
    id: createMemoryPlanId(),
    engine: "creator-memory-engine",
    version:
      CREATOR_MEMORY_ENGINE_VERSION,

    input: {
      message: cleanString(message),
    },

    candidates: [],
    instructions: [],

    recall: {
      shouldRecall: false,
      priority: RECALL_PRIORITIES.NONE,
      timing: RECALL_TIMINGS.NOT_NOW,
      memory: null,
      reason:
        "Memory analysis was unavailable.",
    },

    responseGuidance: [
      "Do not store new conclusions.",
      "Use present conversation context only.",
      "Ask for explicit confirmation before remembering anything important.",
    ],

    guardRails: createGuardRails(),

    contextSnapshot: cloneValue(context),

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
 * Creates the Creator Memory Engine service.
 */
function createCreatorMemoryEngine() {
  /**
   * Analyses a creator message and produces structured
   * memory and recall instructions.
   */
  function planMemory({
    message = "",
    context = {},
  } = {}) {
    try {
      const combinedContext = {
        ...cloneValue(
          DEFAULT_MEMORY_CONTEXT
        ),
        ...cloneValue(context),
        currentTimestamp:
          context?.currentTimestamp ||
          createTimestamp(),
      };

      const explicitMemoryIntent =
        detectExplicitMemoryIntent({
          message,
          context: combinedContext,
        });

      const briefDetour =
        detectBriefDetour(message);

      const deferredTopic =
        detectDeferredTopic({
          message,
          context: combinedContext,
          briefDetour,
        });

      const temporaryState =
        detectTemporaryState({
          message,
          context: combinedContext,
        });

      const guidancePreference =
        detectGuidancePreference(message);

      const creativeProcess =
        detectCreativeProcess(message);

      const creativeTempo =
        detectCreativeTempo({
          message,
          context: combinedContext,
        });

      const automaticSkill =
        detectAutomaticSkill(message);

      const growthSignal =
        detectGrowthSignal(message);

      const vocabulary =
        detectCreativeVocabulary({
          message,
          context: combinedContext,
        });

      const detections = {
        explicitMemoryIntent,
        briefDetour,
        deferredTopic,
        temporaryState,
        guidancePreference,
        creativeProcess,
        creativeTempo,
        automaticSkill,
        growthSignal,
        vocabulary,
      };

      const candidates =
        buildMemoryCandidates({
          message,
          context: combinedContext,
          detections,
        });

      const existingMemories = [
        ...(Array.isArray(
          combinedContext.existingMemories
        )
          ? combinedContext.existingMemories
          : []),

        ...(Array.isArray(
          combinedContext.existingPatterns
        )
          ? combinedContext.existingPatterns
          : []),

        ...(Array.isArray(
          combinedContext.existingObservations
        )
          ? combinedContext.existingObservations
          : []),
      ];

      const analysedCandidates =
        candidates.map((candidate) => {
          const relatedMemories =
            findRelatedMemories({
              candidate,
              existingMemories,
            });

          const relationship =
            detectMemoryRelationship({
              candidate,
              relatedMemories,
              temporaryState,
            });

          const action = chooseMemoryAction({
            candidate,
            relationship,
          });

          const instruction =
            createStorageInstruction({
              candidate,
              action,
              relationship,
            });

          return {
            candidate,
            relatedMemories:
              cloneValue(relatedMemories),
            relationship,
            action,
            instruction,
          };
        });

      const recallPlan =
        planDeferredRecall({
          message,
          context: combinedContext,
        });

      const instructions =
        analysedCandidates
          .map((item) => item.instruction)
          .filter(Boolean);

      return {
        id: createMemoryPlanId(),
        engine: "creator-memory-engine",
        version:
          CREATOR_MEMORY_ENGINE_VERSION,

        input: {
          message: cleanString(message),
        },

        detections,

        candidates:
          cloneValue(analysedCandidates),

        instructions,

        recall: recallPlan,

        memoryPrinciples: {
          memoryServesCreatorAndMentor: true,
          presentBehaviourLeads: true,
          longTermMemoryInforms: true,
          identityMayEvolve: true,
          growthShouldBeRemembered: true,
          historicalMemoryShouldNotDefinePresent:
            true,
          recallMustBeRelevant: true,
          recallRequiresGoodTiming: true,
          deferredTopicsRemainOptional: true,
          memoryMustProtectAutonomy: true,
        },

        responseGuidance:
          createResponseGuidance({
            briefDetour,
            deferredTopic,
            recallPlan,
          }),

        guardRails: createGuardRails(),

        contextSnapshot:
          cloneValue(combinedContext),

        status: "planned",

        createdAt: createTimestamp(),
      };
    } catch (error) {
      console.error(
        "CreatorMemoryEngine planning error:",
        error
      );

      return createFallbackMemoryPlan({
        message,
        context,
        error,
      });
    }
  }

  /**
   * Executes compatible storage instructions using
   * a CreatorMemory.js service instance.
   *
   * More complex reinforcement and supersession actions are
   * returned for a future adapter rather than guessed here.
   */
  function applyMemoryPlan({
    plan,
    memory,
  } = {}) {
    if (!plan || !memory) {
      return {
        applied: [],
        skipped: [],
        errors: [],
      };
    }

    const applied = [];
    const skipped = [];
    const errors = [];

    for (const instruction of plan.instructions || []) {
      const {
        targetMethod,
        payload,
        requiresMemoryAdapterResolution,
      } = instruction;

      if (
        requiresMemoryAdapterResolution ||
        !targetMethod
      ) {
        skipped.push({
          instruction,
          reason:
            "Requires future memory adapter resolution.",
        });

        continue;
      }

      if (
        typeof memory[targetMethod] !==
        "function"
      ) {
        skipped.push({
          instruction,
          reason: `Memory method unavailable: ${targetMethod}`,
        });

        continue;
      }

      try {
        const result =
          memory[targetMethod](payload);

        applied.push({
          instruction,
          result,
        });
      } catch (error) {
        errors.push({
          instruction,
          error:
            error instanceof Error
              ? error.message
              : String(error),
        });
      }
    }

    return {
      applied,
      skipped,
      errors,
    };
  }

  /**
   * Returns true when the current thought should be captured
   * without opening a deeper conversation.
   */
  function isBriefDetour(plan) {
    return Boolean(
      plan?.detections?.briefDetour?.value
    );
  }

  /**
   * Returns true when a topic should be safely deferred.
   */
  function shouldDeferTopic(plan) {
    return Boolean(
      plan?.detections?.deferredTopic?.value
    );
  }

  /**
   * Returns true when an earlier memory may be worth
   * revisiting now.
   */
  function shouldRecallMemory(plan) {
    return Boolean(
      plan?.recall?.shouldRecall
    );
  }

  return {
    planMemory,
    applyMemoryPlan,
    isBriefDetour,
    shouldDeferTopic,
    shouldRecallMemory,
  };
}

/**
 * Convenience method for one-off memory planning.
 */
function planMemory({
  message = "",
  context = {},
} = {}) {
  const engine =
    createCreatorMemoryEngine();

  return engine.planMemory({
    message,
    context,
  });
}

export {
  CREATOR_MEMORY_ENGINE_VERSION,
  MEMORY_CATEGORIES,
  MEMORY_HORIZONS,
  MEMORY_STATUSES,
  MEMORY_ACTIONS,
  RECALL_PRIORITIES,
  RECALL_TIMINGS,
  EVIDENCE_TYPES,
  createCreatorMemoryEngine,
  planMemory,
};

export default createCreatorMemoryEngine;
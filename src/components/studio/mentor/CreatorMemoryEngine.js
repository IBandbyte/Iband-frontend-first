/**
 * Creator Memory Engine
 * ------------------------------------------------------------
 * The interpretation, learning, project-memory and recall-planning
 * layer for iBand's AI Mentor — The Creator.
 *
 * This engine does not persist memory directly.
 * CreatorMemory.js remains responsible for storage.
 *
 * This engine decides:
 * - What may be worth remembering.
 * - What kind of memory it may be.
 * - Which scope it belongs to: creator, project, entity or session.
 * - Whether it is temporary, long-term or historical.
 * - How confident the Mentor should be.
 * - Whether a previous memory is being reinforced.
 * - Whether a contradiction represents a temporary override,
 *   a possible conflict or a genuine correction/evolution.
 * - Whether a topic should be deferred rather than explored now.
 * - When a deferred or relevant memory may be useful to revisit.
 * - How project decisions, continuity facts, unresolved threads and
 *   session handoffs can be represented for future specialist agents.
 * - How explicit forget requests should be handled without guessing.
 *
 * Core principles:
 * - Memory helps the Mentor better serve the creator.
 * - Present behaviour leads; long-term memory informs.
 * - Project memory must have a clear scope and source of truth.
 * - Remember growth without trapping creators in old identities.
 * - Store possibilities, not psychological verdicts.
 * - Never diagnose or manipulate.
 * - Memory must protect confidence, momentum and autonomy.
 * - Recall is an invitation, never an interruption.
 * - Agents may contribute memory signals, but they do not own truth.
 * - Persistence remains replaceable and external to this engine.
 */

const CREATOR_MEMORY_ENGINE_VERSION = "2.0.0";

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
  PROJECT_IDENTITY: "project-identity",
  PROJECT_DECISION: "project-decision",
  PROJECT_PREFERENCE: "project-preference",
  PROJECT_CONSTRAINT: "project-constraint",
  STORY_FACT: "story-fact",
  CHARACTER_FACT: "character-fact",
  SCENE_FACT: "scene-fact",
  WORLD_FACT: "world-fact",
  CONTINUITY_FACT: "continuity-fact",
  ASSET_FACT: "asset-fact",
  UNRESOLVED_THREAD: "unresolved-thread",
  PROJECT_MILESTONE: "project-milestone",
  CURRENT_POSITION: "current-position",
  SESSION_HANDOFF: "session-handoff",

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
  RESOLVED: "resolved",
});

const MEMORY_SCOPES = Object.freeze({
  CREATOR: "creator",
  PROJECT: "project",
  ENTITY: "entity",
  SESSION: "session",
  RELATIONSHIP: "relationship",
  GLOBAL: "global",
});

const MEMORY_IMPORTANCE = Object.freeze({
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high",
  CRITICAL: "critical",
});

const MEMORY_SOURCES = Object.freeze({
  CREATOR: "creator",
  MENTOR: "mentor",
  PROJECT_STATE: "project-state",
  SPECIALIST_AGENT: "specialist-agent",
  SYSTEM: "system",
  IMPORTED: "imported",
  UNKNOWN: "unknown",
});

const MEMORY_ACTIONS = Object.freeze({
  IGNORE: "ignore",
  CAPTURE_OBSERVATION: "capture-observation",
  SAVE_PATTERN: "save-pattern",
  UPDATE_PROFILE: "update-profile",
  SAVE_PROJECT_MEMORY: "save-project-memory",
  SAVE_SESSION_HANDOFF: "save-session-handoff",
  REINFORCE_MEMORY: "reinforce-memory",
  WEAKEN_MEMORY: "weaken-memory",
  SUPERSEDE_MEMORY: "supersede-memory",
  ARCHIVE_AS_HISTORY: "archive-as-history",
  SAVE_DEFERRED_TOPIC: "save-deferred-topic",
  REVISIT_DEFERRED_TOPIC: "revisit-deferred-topic",
  RESOLVE_THREAD: "resolve-thread",
  FORGET_MEMORY: "forget-memory",
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
  PROJECT_STATE: "project-state",
  AGENT_OBSERVATION: "agent-observation",
  TEMPORARY_STATE: "temporary-state",
  UNKNOWN: "unknown",
});

const PROJECT_MEMORY_CATEGORIES = Object.freeze([
  MEMORY_CATEGORIES.PROJECT_CONTEXT,
  MEMORY_CATEGORIES.PROJECT_IDENTITY,
  MEMORY_CATEGORIES.PROJECT_DECISION,
  MEMORY_CATEGORIES.PROJECT_PREFERENCE,
  MEMORY_CATEGORIES.PROJECT_CONSTRAINT,
  MEMORY_CATEGORIES.STORY_FACT,
  MEMORY_CATEGORIES.CHARACTER_FACT,
  MEMORY_CATEGORIES.SCENE_FACT,
  MEMORY_CATEGORIES.WORLD_FACT,
  MEMORY_CATEGORIES.CONTINUITY_FACT,
  MEMORY_CATEGORIES.ASSET_FACT,
  MEMORY_CATEGORIES.UNRESOLVED_THREAD,
  MEMORY_CATEGORIES.PROJECT_MILESTONE,
  MEMORY_CATEGORIES.CURRENT_POSITION,
  MEMORY_CATEGORIES.SESSION_HANDOFF,
]);

const PROFILE_MEMORY_CATEGORIES = Object.freeze([
  MEMORY_CATEGORIES.GUIDANCE_PREFERENCE,
  MEMORY_CATEGORIES.LEARNING_PREFERENCE,
  MEMORY_CATEGORIES.COMMUNICATION_PREFERENCE,
  MEMORY_CATEGORIES.RESPONSE_DEPTH_PREFERENCE,
]);

const DEFAULT_MEMORY_CONTEXT = Object.freeze({
  creatorId: null,
  creatorJourney: "guide",
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
  sessionStartedAt: null,

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
  existingProjectMemories: [],
  existingPatterns: [],
  existingObservations: [],
  creatorProfile: null,

  memorySignals: [],
  projectMemorySignals: [],
  sessionHandoff: null,
  captureSessionHandoff: false,

  sourceAgent: null,
  sourceSystem: null,

  targetMemoryIds: [],
  includeHistoricalRecall: false,

  creatorExplicitlyAskedToRemember: false,
  creatorExplicitlyAskedNotToRemember: false,
  creatorExplicitlyAskedToRevisit: false,

  currentTimestamp: null,
});

function createTimestamp() {
  return new Date().toISOString();
}

function createMemoryPlanId(prefix = "memory-plan") {
  const randomValue = Math.random()
    .toString(36)
    .slice(2, 10);

  return `${prefix}-${Date.now()}-${randomValue}`;
}

function cloneValue(value) {
  if (value === undefined) {
    return undefined;
  }

  return JSON.parse(JSON.stringify(value));
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

function asArray(value) {
  return Array.isArray(value)
    ? value
    : [];
}

function clampConfidence(value) {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return 0;
  }

  return Math.max(
    0,
    Math.min(1, numericValue)
  );
}

function createDetection({
  value,
  confidence = 0.5,
  evidence = [],
  metadata = {},
}) {
  return {
    value,
    confidence:
      clampConfidence(confidence),
    evidence:
      uniqueValues(evidence),
    metadata:
      cloneValue(metadata),
  };
}

function includesAny(
  text,
  phrases = []
) {
  return phrases.some((phrase) =>
    text.includes(phrase)
  );
}

function extractMessageText(
  messages = []
) {
  if (!Array.isArray(messages)) {
    return "";
  }

  return messages
    .map((message) => {
      if (
        typeof message === "string"
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

function getProjectId(
  context = {}
) {
  if (
    cleanString(
      context?.activeProjectId
    )
  ) {
    return cleanString(
      context.activeProjectId
    );
  }

  if (
    typeof context?.activeProject ===
    "string"
  ) {
    return cleanString(
      context.activeProject
    );
  }

  return (
    cleanString(
      context?.activeProject?.id
    ) ||
    cleanString(
      context?.activeProject
        ?.projectId
    ) ||
    null
  );
}

function getEntityIdentity(
  value,
  fallbackType = null
) {
  if (!value) {
    return {
      entityType: fallbackType,
      entityId: null,
      entityName: null,
    };
  }

  if (typeof value === "string") {
    return {
      entityType: fallbackType,
      entityId: null,
      entityName:
        cleanString(value) ||
        null,
    };
  }

  return {
    entityType:
      cleanString(value?.type) ||
      cleanString(
        value?.entityType
      ) ||
      fallbackType,

    entityId:
      cleanString(value?.id) ||
      cleanString(
        value?.entityId
      ) ||
      null,

    entityName:
      cleanString(value?.name) ||
      cleanString(value?.title) ||
      cleanString(value?.label) ||
      null,
  };
}

function tokenise(value) {
  return normaliseText(value)
    .split(/[^a-z0-9'-]+/i)
    .map((word) => word.trim())
    .filter(
      (word) => word.length >= 4
    );
}

function calculateTextSimilarity(
  left,
  right
) {
  const leftWords =
    new Set(tokenise(left));

  const rightWords =
    new Set(tokenise(right));

  if (
    leftWords.size === 0 ||
    rightWords.size === 0
  ) {
    return 0;
  }

  let overlap = 0;

  leftWords.forEach((word) => {
    if (rightWords.has(word)) {
      overlap += 1;
    }
  });

  return (
    overlap /
    Math.max(
      leftWords.size,
      rightWords.size,
      1
    )
  );
}

function isKnownCategory(category) {
  return Object.values(
    MEMORY_CATEGORIES
  ).includes(category);
}

function isKnownHorizon(horizon) {
  return Object.values(
    MEMORY_HORIZONS
  ).includes(horizon);
}

function isKnownScope(scope) {
  return Object.values(
    MEMORY_SCOPES
  ).includes(scope);
}

function isKnownImportance(
  importance
) {
  return Object.values(
    MEMORY_IMPORTANCE
  ).includes(importance);
}

function resolveSignalCategory(
  signal = {}
) {
  if (
    isKnownCategory(signal.category)
  ) {
    return signal.category;
  }

  const kind = normaliseText(
    signal.kind ||
      signal.type ||
      signal.memoryType ||
      ""
  );

  const map = {
    decision:
      MEMORY_CATEGORIES.PROJECT_DECISION,

    preference:
      MEMORY_CATEGORIES.PROJECT_PREFERENCE,

    constraint:
      MEMORY_CATEGORIES.PROJECT_CONSTRAINT,

    story:
      MEMORY_CATEGORIES.STORY_FACT,

    character:
      MEMORY_CATEGORIES.CHARACTER_FACT,

    scene:
      MEMORY_CATEGORIES.SCENE_FACT,

    world:
      MEMORY_CATEGORIES.WORLD_FACT,

    continuity:
      MEMORY_CATEGORIES.CONTINUITY_FACT,

    asset:
      MEMORY_CATEGORIES.ASSET_FACT,

    "unresolved-thread":
      MEMORY_CATEGORIES.UNRESOLVED_THREAD,

    unresolved:
      MEMORY_CATEGORIES.UNRESOLVED_THREAD,

    milestone:
      MEMORY_CATEGORIES.PROJECT_MILESTONE,

    position:
      MEMORY_CATEGORIES.CURRENT_POSITION,

    handoff:
      MEMORY_CATEGORIES.SESSION_HANDOFF,

    context:
      MEMORY_CATEGORIES.PROJECT_CONTEXT,
  };

  return (
    map[kind] ||
    MEMORY_CATEGORIES.UNKNOWN
  );
}

function resolveDefaultScope(
  category
) {
  if (
    category ===
    MEMORY_CATEGORIES.SESSION_HANDOFF
  ) {
    return MEMORY_SCOPES.SESSION;
  }

  if (
    PROJECT_MEMORY_CATEGORIES.includes(
      category
    )
  ) {
    return MEMORY_SCOPES.PROJECT;
  }

  if (
    category ===
      MEMORY_CATEGORIES
        .RELATIONSHIP_CONTEXT ||
    category ===
      MEMORY_CATEGORIES.SHARED_MEANING
  ) {
    return MEMORY_SCOPES.RELATIONSHIP;
  }

  return MEMORY_SCOPES.CREATOR;
}

function resolveDefaultHorizon(
  category
) {
  if (
    [
      MEMORY_CATEGORIES.CURRENT_STATE,
      MEMORY_CATEGORIES.BRIEF_DETOUR,
    ].includes(category)
  ) {
    return MEMORY_HORIZONS.SESSION;
  }

  if (
    [
      MEMORY_CATEGORIES
        .SESSION_HANDOFF,
      MEMORY_CATEGORIES
        .CURRENT_POSITION,
      MEMORY_CATEGORIES
        .UNRESOLVED_THREAD,
      MEMORY_CATEGORIES
        .DEFERRED_TOPIC,
    ].includes(category)
  ) {
    return MEMORY_HORIZONS.SHORT_TERM;
  }

  if (
    [
      MEMORY_CATEGORIES.GROWTH_SIGNAL,
      MEMORY_CATEGORIES
        .HISTORICAL_IDENTITY,
      MEMORY_CATEGORIES
        .PROJECT_MILESTONE,
    ].includes(category)
  ) {
    return MEMORY_HORIZONS.HISTORICAL;
  }

  return MEMORY_HORIZONS.LONG_TERM;
}

function resolveDefaultImportance(
  category
) {
  if (
    [
      MEMORY_CATEGORIES
        .PROJECT_DECISION,
      MEMORY_CATEGORIES
        .PROJECT_CONSTRAINT,
      MEMORY_CATEGORIES
        .CONTINUITY_FACT,
      MEMORY_CATEGORIES
        .SESSION_HANDOFF,
      MEMORY_CATEGORIES
        .CURRENT_POSITION,
    ].includes(category)
  ) {
    return MEMORY_IMPORTANCE.HIGH;
  }

  if (
    [
      MEMORY_CATEGORIES
        .UNRESOLVED_THREAD,
      MEMORY_CATEGORIES
        .PROJECT_MILESTONE,
      MEMORY_CATEGORIES
        .GUIDANCE_PREFERENCE,
    ].includes(category)
  ) {
    return MEMORY_IMPORTANCE.MEDIUM;
  }

  return MEMORY_IMPORTANCE.LOW;
}

function buildMemoryKey({
  category,
  scope,
  creatorId,
  projectId,
  entityType,
  entityId,
  value,
  content,
}) {
  const valueText =
    normaliseText(
      typeof value === "string"
        ? value
        : content
    )
      .split(" ")
      .slice(0, 14)
      .join("-");

  return [
    scope || "unknown-scope",
    category ||
      MEMORY_CATEGORIES.UNKNOWN,
    creatorId || "no-creator",
    projectId || "no-project",
    entityType || "no-entity-type",
    entityId || "no-entity-id",
    valueText || "no-value",
  ].join("::");
}

function detectExplicitMemoryIntent({
  message,
  context,
}) {
  const text =
    normaliseText(message);

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

  const doNotStorePhrases = [
    "don't remember this",
    "dont remember this",
    "don't save this",
    "dont save this",
    "don't store this",
    "dont store this",
    "this is temporary",
  ];

  const forgetExistingPhrases = [
    "forget that",
    "forget this memory",
    "remove that from memory",
    "remove this from memory",
    "delete that memory",
    "delete this memory",
    "erase that memory",
  ];

  if (
    includesAny(
      text,
      forgetExistingPhrases
    )
  ) {
    return createDetection({
      value: "forget-existing",
      confidence: 0.99,
      evidence:
        forgetExistingPhrases.filter(
          (phrase) =>
            text.includes(phrase)
        ),
    });
  }

  if (
    context
      ?.creatorExplicitlyAskedNotToRemember ||
    includesAny(
      text,
      doNotStorePhrases
    )
  ) {
    return createDetection({
      value: "do-not-store",
      confidence: 0.99,
      evidence:
        doNotStorePhrases.filter(
          (phrase) =>
            text.includes(phrase)
        ),
    });
  }

  if (
    context
      ?.creatorExplicitlyAskedToRemember ||
    includesAny(
      text,
      rememberPhrases
    )
  ) {
    return createDetection({
      value: "store",
      confidence: 0.98,
      evidence:
        rememberPhrases.filter(
          (phrase) =>
            text.includes(phrase)
        ),
    });
  }

  return createDetection({
    value: "implicit",
    confidence: 0.45,
    evidence: [],
  });
}

function detectBriefDetour(
  message
) {
  const text =
    normaliseText(message);

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

  const matches =
    phrases.filter((phrase) =>
      text.includes(phrase)
    );

  return createDetection({
    value: matches.length > 0,
    confidence:
      matches.length > 0
        ? 0.9
        : 0.36,
    evidence: matches,
  });
}

function detectDeferredTopic({
  message,
  context,
  briefDetour,
}) {
  const text =
    normaliseText(message);

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
    includesAny(
      text,
      deferPhrases
    );

  const flowDefer =
    briefDetour.value &&
    [
      "flow",
      "build",
      "creation",
    ].includes(
      context?.thinkingMode
    );

  const shouldDefer =
    explicitDefer ||
    flowDefer;

  return createDetection({
    value: shouldDefer,
    confidence:
      shouldDefer
        ? 0.88
        : 0.4,

    evidence: [
      ...deferPhrases.filter(
        (phrase) =>
          text.includes(phrase)
      ),

      flowDefer
        ? "brief detour during active creative mode"
        : null,
    ],
  });
}

function detectTemporaryState({
  message,
  context,
}) {
  const text =
    normaliseText(message);

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

  const dynamicContextPresent =
    Boolean(
      context?.thinkingMode ||
      context?.creatorEnergy ||
      context?.momentum ||
      context?.guidanceWindow
    );

  const matches =
    temporaryPhrases.filter(
      (phrase) =>
        text.includes(phrase)
    );

  const isTemporary =
    matches.length > 0 ||
    dynamicContextPresent;

  return createDetection({
    value: isTemporary,
    confidence:
      isTemporary
        ? 0.76
        : 0.42,

    evidence: [
      ...matches,

      dynamicContextPresent
        ? "dynamic session context present"
        : null,
    ],
  });
}

function detectGuidancePreference(
  message
) {
  const text =
    normaliseText(message);

  const preferenceRules = [
    {
      value:
        "concise-during-build",

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
      value:
        "detailed-during-exploration",

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
      value:
        "one-step-at-a-time",

      phrases: [
        "one step at a time",
        "one task at a time",
        "one commit at a time",
        "slow it down",
        "baby steps",
      ],
    },

    {
      value:
        "lead-when-requested",

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
      value:
        "space-before-response",

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

  for (
    const rule
    of preferenceRules
  ) {
    const matches =
      rule.phrases.filter(
        (phrase) =>
          text.includes(phrase)
      );

    if (matches.length > 0) {
      return createDetection({
        value: rule.value,

        confidence:
          0.72 +
          Math.min(
            matches.length *
              0.08,
            0.2
          ),

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

function detectCreativeVocabulary({
  message,
  context,
}) {
  const originalText =
    cleanString(message);

  const text =
    normaliseText(message);

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
    "warp 20",
    "rabbit hole",
    "let's build",
    "lets build",
    "captain's protocol",
    "captains protocol",
  ];

  const foundTerms =
    knownTerms.filter(
      (term) =>
        text.includes(term)
    );

  const possibleQuotedPhrases =
    originalText.match(
      /["“”']([^"“”']{2,60})["“”']/g
    ) || [];

  return {
    terms:
      uniqueValues(
        foundTerms
      ),

    quotedPhrases:
      uniqueValues(
        possibleQuotedPhrases.map(
          (phrase) =>
            phrase
              .replace(
                /["“”']/g,
                ""
              )
              .trim()
        )
      ),

    likelySharedLanguage:
      foundTerms.some(
        (term) =>
          [
            "warp drive",
            "warp drives",
            "warp 20",
            "rabbit hole",
            "let's build",
            "lets build",
            "captain's protocol",
            "captains protocol",
          ].includes(term)
      ) ||
      Boolean(
        context
          ?.relationshipContext
      ),
  };
}

function detectCreativeProcess(
  message
) {
  const text =
    normaliseText(message);

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
      value:
        "discover-through-making",

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
      value:
        "react-and-refine",

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
      value:
        "problem-led-invention",

      phrases: [
        "there has to be a better way",
        "solve the problem",
        "prevent this",
        "invent",
        "news report",
      ],
    },
  ];

  const matches =
    rules
      .map((rule) => ({
        process: rule.value,

        evidence:
          rule.phrases.filter(
            (phrase) =>
              text.includes(
                phrase
              )
          ),
      }))
      .filter(
        (item) =>
          item.evidence.length >
          0
      );

  if (
    matches.length === 0
  ) {
    return createDetection({
      value: null,
      confidence: 0.3,
      evidence: [],
    });
  }

  const strongest =
    matches.sort(
      (a, b) =>
        b.evidence.length -
        a.evidence.length
    )[0];

  return createDetection({
    value:
      strongest.process,

    confidence:
      0.65 +
      Math.min(
        strongest
          .evidence
          .length *
          0.08,

        0.24
      ),

    evidence:
      strongest.evidence,
  });
}

function detectCreativeTempo({
  message,
  context,
}) {
  const text =
    normaliseText(message);

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
    "warp 20",
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
    includesAny(
      text,
      fastPhrases
    ) ||
    context?.thinkingMode ===
      "build" ||
    context?.momentum ===
      "strong"
  ) {
    return createDetection({
      value: "fast-action",
      confidence: 0.82,

      evidence: [
        ...fastPhrases.filter(
          (phrase) =>
            text.includes(
              phrase
            )
        ),

        context
          ?.thinkingMode ===
        "build"
          ? "build mode"
          : null,
      ],
    });
  }

  if (
    includesAny(
      text,
      reflectivePhrases
    ) ||
    context?.thinkingMode ===
      "reflection" ||
    context?.thinkingMode ===
      "exploration"
  ) {
    return createDetection({
      value:
        "slow-reflective",

      confidence: 0.78,

      evidence: [
        ...reflectivePhrases
          .filter(
            (phrase) =>
              text.includes(
                phrase
              )
          ),

        context
          ?.thinkingMode,
      ],
    });
  }

  return createDetection({
    value: "adaptive",
    confidence: 0.46,
    evidence: [],
  });
}

function detectAutomaticSkill(
  message
) {
  const text =
    normaliseText(message);

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

  const matches =
    phrases.filter(
      (phrase) =>
        text.includes(phrase)
    );

  return createDetection({
    value:
      matches.length > 0,

    confidence:
      matches.length > 0
        ? 0.88
        : 0.34,

    evidence: matches,
  });
}

function detectGrowthSignal(
  message
) {
  const text =
    normaliseText(message);

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

  const matches =
    phrases.filter(
      (phrase) =>
        text.includes(phrase)
    );

  return createDetection({
    value:
      matches.length > 0,

    confidence:
      matches.length > 0
        ? 0.84
        : 0.36,

    evidence: matches,
  });
}

function detectProjectMemorySignal({
  message,
  context,
}) {
  const text =
    normaliseText(message);

  const projectId =
    getProjectId(context);

  if (
    !projectId &&
    !context?.activeProject
  ) {
    return createDetection({
      value: null,
      confidence: 0.2,
      evidence: [],
    });
  }

  const rules = [
    {
      category:
        MEMORY_CATEGORIES
          .PROJECT_DECISION,

      title:
        "Project decision",

      phrases: [
        "we decided",
        "we've decided",
        "weve decided",
        "let's keep",
        "lets keep",
        "keep the original",
        "we're keeping",
        "were keeping",
        "we moved this scene",
        "move this scene",
        "now appears in",
        "change it to",
        "we changed",
      ],
    },

    {
      category:
        MEMORY_CATEGORIES
          .UNRESOLVED_THREAD,

      title:
        "Unresolved project thread",

      phrases: [
        "still need to",
        "we still need",
        "not finished",
        "unfinished",
        "come back to this",
        "need to revisit",
        "missing asset",
        "still missing",
      ],
    },

    {
      category:
        MEMORY_CATEGORIES
          .CURRENT_POSITION,

      title:
        "Current project position",

      phrases: [
        "we stopped at",
        "we're on scene",
        "were on scene",
        "next scene",
        "we finished scene",
        "last thing we completed",
        "next we were going to",
      ],
    },

    {
      category:
        MEMORY_CATEGORIES
          .CONTINUITY_FACT,

      title:
        "Continuity fact",

      phrases: [
        "continuity",
        "same as the previous scene",
        "still wearing",
        "still has the",
        "matches the previous",
        "keep consistent",
      ],
    },
  ];

  for (
    const rule
    of rules
  ) {
    const matches =
      rule.phrases.filter(
        (phrase) =>
          text.includes(phrase)
      );

    if (
      matches.length > 0
    ) {
      return createDetection({
        value: {
          category:
            rule.category,

          title:
            rule.title,
        },

        confidence:
          0.72 +
          Math.min(
            matches.length *
              0.07,
            0.18
          ),

        evidence:
          matches,
      });
    }
  }

  return createDetection({
    value: null,
    confidence: 0.25,
    evidence: [],
  });
}

function detectCorrectionSignal(
  message
) {
  const text =
    normaliseText(message);

  const phrases = [
    "actually change that",
    "change that",
    "that's no longer",
    "thats no longer",
    "not anymore",
    "instead we're",
    "instead were",
    "replace that with",
    "forget the old",
    "we changed our mind",
    "i changed my mind",
    "correction",
  ];

  const matches =
    phrases.filter(
      (phrase) =>
        text.includes(phrase)
    );

  return createDetection({
    value:
      matches.length > 0,

    confidence:
      matches.length > 0
        ? 0.9
        : 0.28,

    evidence:
      matches,
  });
}

function calculateCandidateConfidence({
  explicitMemoryIntent,
  categoryDetection,
  temporaryState,
  evidenceCount,
  structuredSignal = false,
}) {
  let confidence =
    structuredSignal
      ? 0.7
      : 0.46;

  if (
    explicitMemoryIntent.value ===
    "store"
  ) {
    confidence += 0.22;
  }

  if (
    categoryDetection?.confidence
  ) {
    confidence +=
      categoryDetection
        .confidence *
      0.16;
  }

  confidence += Math.min(
    evidenceCount *
      0.04,
    0.16
  );

  if (
    temporaryState.value
  ) {
    confidence -= 0.08;
  }

  return clampConfidence(
    confidence
  );
}

function createMemoryCandidate({
  category,
  title,
  content,
  value = null,
  horizon = null,
  scope = null,
  importance = null,
  confidence = 0.5,
  evidence = [],
  source =
    MEMORY_SOURCES.CREATOR,
  creatorId = null,
  projectId = null,
  sessionId = null,
  entityType = null,
  entityId = null,
  entityName = null,
  tags = [],
  recallPolicy = null,
  metadata = {},
}) {
  const resolvedCategory =
    isKnownCategory(category)
      ? category
      : MEMORY_CATEGORIES.UNKNOWN;

  const resolvedScope =
    isKnownScope(scope)
      ? scope
      : resolveDefaultScope(
          resolvedCategory
        );

  const resolvedHorizon =
    isKnownHorizon(horizon)
      ? horizon
      : resolveDefaultHorizon(
          resolvedCategory
        );

  const resolvedImportance =
    isKnownImportance(
      importance
    )
      ? importance
      : resolveDefaultImportance(
          resolvedCategory
        );

  const candidate = {
    id:
      createMemoryPlanId(
        "candidate"
      ),

    memoryKey: null,

    category:
      resolvedCategory,

    title:
      cleanString(title),

    content:
      cleanString(content),

    value:
      cloneValue(value),

    horizon:
      resolvedHorizon,

    scope:
      resolvedScope,

    importance:
      resolvedImportance,

    status:
      MEMORY_STATUSES.CANDIDATE,

    confidence:
      clampConfidence(
        confidence
      ),

    evidence:
      uniqueValues(
        evidence
      ),

    source:
      Object.values(
        MEMORY_SOURCES
      ).includes(source)
        ? source
        : MEMORY_SOURCES.UNKNOWN,

    creatorId:
      creatorId ||
      null,

    projectId:
      projectId ||
      null,

    sessionId:
      sessionId ||
      null,

    entityType:
      entityType ||
      null,

    entityId:
      entityId ||
      null,

    entityName:
      entityName ||
      null,

    tags:
      uniqueValues(
        tags
      ),

    recallPolicy:
      recallPolicy || {
        automatic: true,
        timing:
          RECALL_TIMINGS
            .NEXT_RELEVANT_MOMENT,
      },

    metadata:
      cloneValue(
        metadata
      ),

    createdAt:
      createTimestamp(),
  };

  candidate.memoryKey =
    buildMemoryKey(
      candidate
    );

  return candidate;
}

function createStructuredSignalCandidate({
  signal,
  context,
}) {
  if (
    !signal ||
    typeof signal !== "object"
  ) {
    return null;
  }

  const category =
    resolveSignalCategory(
      signal
    );

  const projectId =
    cleanString(
      signal.projectId
    ) ||
    getProjectId(
      context
    );

  const entity =
    getEntityIdentity(
      signal.entity ||
        signal.character ||
        signal.scene ||
        signal.asset,

      cleanString(
        signal.entityType
      ) ||
        null
    );

  const content =
    cleanString(
      signal.content ||
        signal.text ||
        signal.description ||
        signal.summary ||
        (
          typeof signal.value ===
          "string"
            ? signal.value
            : ""
        )
    );

  if (
    !content &&
    signal.value == null
  ) {
    return null;
  }

  const source =
    signal.source ||
    (
      context?.sourceAgent
        ? MEMORY_SOURCES
            .SPECIALIST_AGENT
        : MEMORY_SOURCES
            .PROJECT_STATE
    );

  const evidence =
    uniqueValues([
      ...asArray(
        signal.evidence
      ),

      signal.evidenceType,

      context?.sourceAgent
        ? `${EVIDENCE_TYPES.AGENT_OBSERVATION}:${context.sourceAgent}`
        : null,
    ]);

  return createMemoryCandidate({
    category,

    title:
      cleanString(
        signal.title
      ) ||
      "Project memory",

    content,

    value:
      signal.value !==
      undefined
        ? signal.value
        : content,

    horizon:
      signal.horizon,

    scope:
      signal.scope,

    importance:
      signal.importance,

    confidence:
      signal.confidence !==
      undefined
        ? signal.confidence
        : 0.82,

    evidence,

    source,

    creatorId:
      signal.creatorId ||
      context?.creatorId ||
      null,

    projectId,

    sessionId:
      signal.sessionId ||
      context?.sessionId ||
      null,

    entityType:
      cleanString(
        signal.entityType
      ) ||
      entity.entityType,

    entityId:
      cleanString(
        signal.entityId
      ) ||
      entity.entityId,

    entityName:
      cleanString(
        signal.entityName
      ) ||
      entity.entityName,

    tags:
      asArray(
        signal.tags
      ),

    recallPolicy:
      signal.recallPolicy ||
      null,

    metadata: {
      ...cloneValue(
        signal.metadata ||
        {}
      ),

      sourceAgent:
        signal.sourceAgent ||
        context?.sourceAgent ||
        null,

      sourceSystem:
        signal.sourceSystem ||
        context?.sourceSystem ||
        null,

      structuredSignal:
        true,
    },
  });
}

function createSessionHandoffCandidate({
  handoff,
  context,
}) {
  if (
    !handoff ||
    typeof handoff !==
      "object"
  ) {
    return null;
  }

  const projectId =
    getProjectId(
      context
    );

  const summary =
    cleanString(
      handoff.summary ||
      handoff.whereWeStopped
    );

  const nextStep =
    cleanString(
      handoff.nextStep ||
      handoff.next
    );

  const lastCompleted =
    cleanString(
      handoff.lastCompleted ||
      handoff.completed
    );

  const activeStage =
    cleanString(
      handoff.activeStage ||
      context?.activeStage
    );

  const unresolved =
    asArray(
      handoff.unresolved ||
      handoff.openThreads
    );

  const parts =
    uniqueValues([
      summary,

      lastCompleted
        ? `Last completed: ${lastCompleted}`
        : null,

      nextStep
        ? `Next step: ${nextStep}`
        : null,

      activeStage
        ? `Active stage: ${activeStage}`
        : null,

      unresolved.length > 0
        ? `Open threads: ${unresolved.join("; ")}`
        : null,
    ]);

  if (
    parts.length === 0
  ) {
    return null;
  }

  return createMemoryCandidate({
    category:
      MEMORY_CATEGORIES
        .SESSION_HANDOFF,

    title:
      "Creative session handoff",

    content:
      parts.join(" | "),

    value: {
      summary:
        summary ||
        null,

      lastCompleted:
        lastCompleted ||
        null,

      nextStep:
        nextStep ||
        null,

      activeStage:
        activeStage ||
        null,

      unresolved:
        cloneValue(
          unresolved
        ),

      activeScene:
        cloneValue(
          handoff.activeScene
        ) ||
        cloneValue(
          context?.activeScene
        ) ||
        null,
    },

    horizon:
      MEMORY_HORIZONS
        .SHORT_TERM,

    scope:
      MEMORY_SCOPES
        .PROJECT,

    importance:
      MEMORY_IMPORTANCE.HIGH,

    confidence: 0.96,

    evidence: [
      EVIDENCE_TYPES
        .PROJECT_STATE,

      "session handoff requested",
    ],

    source:
      MEMORY_SOURCES
        .PROJECT_STATE,

    creatorId:
      context?.creatorId ||
      null,

    projectId,

    sessionId:
      context?.sessionId ||
      null,

    tags: [
      "session-handoff",
      "resume-context",
    ],

    recallPolicy: {
      automatic: true,

      timing:
        RECALL_TIMINGS
          .NEXT_SESSION,
    },

    metadata: {
      replacePreviousHandoff:
        true,

      sourceAgent:
        context?.sourceAgent ||
        null,
    },
  });
}

function buildMemoryCandidates({
  message,
  context,
  detections,
}) {
  const candidates = [];

  const cleanMessage =
    cleanString(message);

  const projectId =
    getProjectId(
      context
    );

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
    projectMemorySignal,
  } = detections;

  if (
    explicitMemoryIntent.value ===
      "do-not-store" ||
    explicitMemoryIntent.value ===
      "forget-existing"
  ) {
    return [];
  }

  if (
    guidancePreference.value
  ) {
    candidates.push(
      createMemoryCandidate({
        category:
          MEMORY_CATEGORIES
            .GUIDANCE_PREFERENCE,

        title:
          "Guidance preference",

        content:
          cleanMessage,

        value:
          guidancePreference.value,

        horizon:
          temporaryState.value
            ? MEMORY_HORIZONS
                .SESSION
            : MEMORY_HORIZONS
                .LONG_TERM,

        scope:
          MEMORY_SCOPES
            .CREATOR,

        importance:
          MEMORY_IMPORTANCE
            .MEDIUM,

        confidence:
          calculateCandidateConfidence({
            explicitMemoryIntent,

            categoryDetection:
              guidancePreference,

            temporaryState,

            evidenceCount:
              guidancePreference
                .evidence
                .length,
          }),

        evidence:
          guidancePreference
            .evidence,

        creatorId:
          context?.creatorId ||
          null,

        metadata: {
          thinkingMode:
            context
              ?.thinkingMode ||
            null,
        },
      })
    );
  }

  if (
    creativeProcess.value
  ) {
    candidates.push(
      createMemoryCandidate({
        category:
          MEMORY_CATEGORIES
            .CREATIVE_PROCESS,

        title:
          "Creative process signal",

        content:
          cleanMessage,

        value:
          creativeProcess.value,

        horizon:
          MEMORY_HORIZONS
            .LONG_TERM,

        scope:
          MEMORY_SCOPES
            .CREATOR,

        confidence:
          calculateCandidateConfidence({
            explicitMemoryIntent,

            categoryDetection:
              creativeProcess,

            temporaryState,

            evidenceCount:
              creativeProcess
                .evidence
                .length,
          }),

        evidence:
          creativeProcess
            .evidence,

        creatorId:
          context?.creatorId ||
          null,
      })
    );
  }

  if (
    creativeTempo.value !==
    "adaptive"
  ) {
    candidates.push(
      createMemoryCandidate({
        category:
          MEMORY_CATEGORIES
            .CREATIVE_TEMPO,

        title:
          "Creative tempo signal",

        content:
          cleanMessage,

        value:
          creativeTempo.value,

        horizon:
          temporaryState.value
            ? MEMORY_HORIZONS
                .SESSION
            : MEMORY_HORIZONS
                .SHORT_TERM,

        scope:
          temporaryState.value
            ? MEMORY_SCOPES
                .SESSION
            : MEMORY_SCOPES
                .CREATOR,

        confidence:
          calculateCandidateConfidence({
            explicitMemoryIntent,

            categoryDetection:
              creativeTempo,

            temporaryState,

            evidenceCount:
              creativeTempo
                .evidence
                .length,
          }),

        evidence:
          creativeTempo
            .evidence,

        creatorId:
          context?.creatorId ||
          null,

        sessionId:
          context?.sessionId ||
          null,

        metadata: {
          sessionSpecific:
            temporaryState.value,
        },
      })
    );
  }

  if (
    automaticSkill.value
  ) {
    candidates.push(
      createMemoryCandidate({
        category:
          MEMORY_CATEGORIES
            .AUTOMATIC_SKILL,

        title:
          "Skill becoming automatic",

        content:
          cleanMessage,

        value:
          "automaticity-detected",

        horizon:
          MEMORY_HORIZONS
            .LONG_TERM,

        scope:
          MEMORY_SCOPES
            .CREATOR,

        confidence:
          0.84,

        evidence:
          automaticSkill
            .evidence,

        creatorId:
          context?.creatorId ||
          null,
      })
    );
  }

  if (
    growthSignal.value
  ) {
    candidates.push(
      createMemoryCandidate({
        category:
          MEMORY_CATEGORIES
            .GROWTH_SIGNAL,

        title:
          "Creator growth signal",

        content:
          cleanMessage,

        value:
          "creator-reports-growth",

        horizon:
          MEMORY_HORIZONS
            .HISTORICAL,

        scope:
          MEMORY_SCOPES
            .CREATOR,

        importance:
          MEMORY_IMPORTANCE
            .MEDIUM,

        confidence:
          0.82,

        evidence:
          growthSignal
            .evidence,

        creatorId:
          context?.creatorId ||
          null,
      })
    );
  }

  vocabulary
    .terms
    .forEach((term) => {
      candidates.push(
        createMemoryCandidate({
          category:
            vocabulary
              .likelySharedLanguage
              ? MEMORY_CATEGORIES
                  .SHARED_MEANING
              : MEMORY_CATEGORIES
                  .CREATIVE_VOCABULARY,

          title:
            vocabulary
              .likelySharedLanguage
              ? "Shared creative phrase"
              : "Creator vocabulary",

          content:
            term,

          value:
            term,

          horizon:
            MEMORY_HORIZONS
              .LONG_TERM,

          scope:
            vocabulary
              .likelySharedLanguage
              ? MEMORY_SCOPES
                  .RELATIONSHIP
              : MEMORY_SCOPES
                  .CREATOR,

          confidence:
            vocabulary
              .likelySharedLanguage
              ? 0.72
              : 0.58,

          evidence: [
            term,
          ],

          creatorId:
            context?.creatorId ||
            null,
        })
      );
    });

  if (
    briefDetour.value
  ) {
    candidates.push(
      createMemoryCandidate({
        category:
          deferredTopic.value
            ? MEMORY_CATEGORIES
                .DEFERRED_TOPIC
            : MEMORY_CATEGORIES
                .BRIEF_DETOUR,

        title:
          deferredTopic.value
            ? "Deferred creator topic"
            : "Brief creator detour",

        content:
          cleanMessage,

        value:
          cleanMessage,

        horizon:
          deferredTopic.value
            ? MEMORY_HORIZONS
                .SHORT_TERM
            : MEMORY_HORIZONS
                .SESSION,

        scope:
          projectId
            ? MEMORY_SCOPES
                .PROJECT
            : MEMORY_SCOPES
                .SESSION,

        importance:
          MEMORY_IMPORTANCE
            .MEDIUM,

        confidence:
          0.86,

        evidence: [
          ...briefDetour
            .evidence,

          ...deferredTopic
            .evidence,
        ],

        creatorId:
          context?.creatorId ||
          null,

        projectId,

        sessionId:
          context?.sessionId ||
          null,

        metadata: {
          originalThinkingMode:
            context
              ?.thinkingMode ||
            null,

          originalProject:
            cloneValue(
              context
                ?.activeProject
            ) ||
            null,

          returnWithoutOpeningRabbitHole:
            true,
        },
      })
    );
  }

  if (
    projectMemorySignal.value &&
    cleanMessage
  ) {
    candidates.push(
      createMemoryCandidate({
        category:
          projectMemorySignal
            .value
            .category,

        title:
          projectMemorySignal
            .value
            .title,

        content:
          cleanMessage,

        value:
          cleanMessage,

        horizon:
          resolveDefaultHorizon(
            projectMemorySignal
              .value
              .category
          ),

        scope:
          MEMORY_SCOPES
            .PROJECT,

        importance:
          resolveDefaultImportance(
            projectMemorySignal
              .value
              .category
          ),

        confidence:
          calculateCandidateConfidence({
            explicitMemoryIntent,

            categoryDetection:
              projectMemorySignal,

            temporaryState,

            evidenceCount:
              projectMemorySignal
                .evidence
                .length,
          }),

        evidence:
          projectMemorySignal
            .evidence,

        creatorId:
          context?.creatorId ||
          null,

        projectId,

        sessionId:
          context?.sessionId ||
          null,

        metadata: {
          inferredFromConversation:
            true,
        },
      })
    );
  }

  const structuredSignals = [
    ...asArray(
      context?.memorySignals
    ),

    ...asArray(
      context
        ?.projectMemorySignals
    ),
  ];

  structuredSignals.forEach(
    (signal) => {
      const candidate =
        createStructuredSignalCandidate({
          signal,
          context,
        });

      if (candidate) {
        candidates.push(
          candidate
        );
      }
    }
  );

  if (
    context
      ?.captureSessionHandoff &&
    context
      ?.sessionHandoff
  ) {
    const handoffCandidate =
      createSessionHandoffCandidate({
        handoff:
          context
            .sessionHandoff,

        context,
      });

    if (
      handoffCandidate
    ) {
      candidates.push(
        handoffCandidate
      );
    }
  }

  if (
    explicitMemoryIntent.value ===
      "store" &&
    candidates.length === 0 &&
    cleanMessage
  ) {
    candidates.push(
      createMemoryCandidate({
        category:
          projectId
            ? MEMORY_CATEGORIES
                .PROJECT_CONTEXT
            : MEMORY_CATEGORIES
                .RELATIONSHIP_CONTEXT,

        title:
          "Creator-requested memory",

        content:
          cleanMessage,

        value:
          cleanMessage,

        horizon:
          MEMORY_HORIZONS
            .LONG_TERM,

        scope:
          projectId
            ? MEMORY_SCOPES
                .PROJECT
            : MEMORY_SCOPES
                .RELATIONSHIP,

        importance:
          MEMORY_IMPORTANCE
            .MEDIUM,

        confidence:
          0.9,

        evidence:
          explicitMemoryIntent
            .evidence,

        creatorId:
          context?.creatorId ||
          null,

        projectId,

        sessionId:
          context?.sessionId ||
          null,
      })
    );
  }

  return deduplicateCandidates(
    candidates
  );
}

function deduplicateCandidates(
  candidates = []
) {
  const byKey =
    new Map();

  candidates.forEach(
    (candidate) => {
      if (
        !candidate?.memoryKey
      ) {
        return;
      }

      const existing =
        byKey.get(
          candidate.memoryKey
        );

      if (
        !existing ||
        candidate.confidence >
          existing.confidence
      ) {
        byKey.set(
          candidate.memoryKey,
          candidate
        );
      }
    }
  );

  return [
    ...byKey.values(),
  ];
}

function memoryScopeCompatible(
  candidate,
  memory
) {
  const candidateProjectId =
    candidate?.projectId ||
    null;

  const memoryProjectId =
    memory?.projectId ||
    memory?.metadata
      ?.projectId ||
    memory?.relatedProjectId ||
    null;

  if (
    candidateProjectId &&
    memoryProjectId &&
    candidateProjectId !==
      memoryProjectId
  ) {
    return false;
  }

  const candidateEntityId =
    candidate?.entityId ||
    null;

  const memoryEntityId =
    memory?.entityId ||
    memory?.metadata
      ?.entityId ||
    null;

  if (
    candidateEntityId &&
    memoryEntityId &&
    candidateEntityId !==
      memoryEntityId
  ) {
    return false;
  }

  return true;
}

function findRelatedMemories({
  candidate,
  existingMemories,
}) {
  if (
    !candidate ||
    !Array.isArray(
      existingMemories
    )
  ) {
    return [];
  }

  const candidateText = [
    candidate.title,
    candidate.content,

    typeof candidate.value ===
    "string"
      ? candidate.value
      : "",

    candidate.category,
    candidate.entityName,
  ]
    .filter(Boolean)
    .join(" ");

  if (
    !normaliseText(
      candidateText
    )
  ) {
    return [];
  }

  return existingMemories
    .filter((memory) =>
      memoryScopeCompatible(
        candidate,
        memory
      )
    )
    .map((memory) => {
      const memoryText = [
        memory.title,
        memory.content,
        memory.text,

        typeof memory.value ===
        "string"
          ? memory.value
          : "",

        memory.category,
        memory.name,
        memory.description,
        memory.entityName,
      ]
        .filter(Boolean)
        .join(" ");

      let similarity =
        calculateTextSimilarity(
          candidateText,
          memoryText
        );

      if (
        candidate.category &&
        memory.category ===
          candidate.category
      ) {
        similarity +=
          0.18;
      }

      if (
        candidate.memoryKey &&
        memory.memoryKey ===
          candidate.memoryKey
      ) {
        similarity = 1;
      }

      return {
        memory,

        similarity:
          Math.min(
            1,
            similarity
          ),
      };
    })
    .filter(
      (item) =>
        item.similarity >=
        0.3
    )
    .sort(
      (a, b) =>
        b.similarity -
        a.similarity
    );
}

function detectMemoryRelationship({
  candidate,
  relatedMemories,
  temporaryState,
  correctionSignal,
}) {
  if (
    !candidate ||
    relatedMemories.length ===
      0
  ) {
    return {
      relationship: "new",
      relatedMemory: null,
      confidence: 0.6,
    };
  }

  const strongest =
    relatedMemories[0];

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
    typeof oldValue ===
      "string" &&
    typeof newValue ===
      "string" &&
    normaliseText(oldValue) ===
      normaliseText(newValue)
  ) {
    return {
      relationship:
        "reinforcement",

      relatedMemory:
        strongest.memory,

      confidence:
        Math.min(
          0.97,

          0.7 +
            strongest
              .similarity *
            0.25
        ),
    };
  }

  if (
    temporaryState.value
  ) {
    return {
      relationship:
        "temporary-override",

      relatedMemory:
        strongest.memory,

      confidence:
        0.76,
    };
  }

  if (
    correctionSignal.value &&
    strongest.similarity >=
      0.45
  ) {
    return {
      relationship:
        "confirmed-evolution",

      relatedMemory:
        strongest.memory,

      confidence:
        Math.min(
          0.96,

          0.78 +
            strongest
              .similarity *
            0.18
        ),
    };
  }

  if (
    strongest.similarity >=
    0.62
  ) {
    return {
      relationship:
        "possible-conflict",

      relatedMemory:
        strongest.memory,

      confidence:
        Math.min(
          0.88,

          0.56 +
            strongest
              .similarity *
            0.28
        ),
    };
  }

  return {
    relationship:
      "related",

    relatedMemory:
      strongest.memory,

    confidence:
      Math.min(
        0.8,

        0.48 +
          strongest.similarity *
          0.24
      ),
  };
}

function chooseMemoryAction({
  candidate,
  relationship,
}) {
  if (!candidate) {
    return MEMORY_ACTIONS.IGNORE;
  }

  if (
    candidate.category ===
    MEMORY_CATEGORIES
      .DEFERRED_TOPIC
  ) {
    return MEMORY_ACTIONS
      .SAVE_DEFERRED_TOPIC;
  }

  if (
    candidate.category ===
    MEMORY_CATEGORIES
      .SESSION_HANDOFF
  ) {
    return MEMORY_ACTIONS
      .SAVE_SESSION_HANDOFF;
  }

  if (
    relationship.relationship ===
    "reinforcement"
  ) {
    return MEMORY_ACTIONS
      .REINFORCE_MEMORY;
  }

  if (
    relationship.relationship ===
    "confirmed-evolution"
  ) {
    return MEMORY_ACTIONS
      .SUPERSEDE_MEMORY;
  }

  if (
    relationship.relationship ===
      "possible-conflict" ||
    relationship.relationship ===
      "temporary-override"
  ) {
    return MEMORY_ACTIONS
      .CAPTURE_OBSERVATION;
  }

  if (
    PROFILE_MEMORY_CATEGORIES
      .includes(
        candidate.category
      )
  ) {
    if (
      candidate.confidence >=
      0.78
    ) {
      return MEMORY_ACTIONS
        .UPDATE_PROFILE;
    }

    return MEMORY_ACTIONS
      .CAPTURE_OBSERVATION;
  }

  if (
    PROJECT_MEMORY_CATEGORIES
      .includes(
        candidate.category
      )
  ) {
    if (
      candidate.confidence >=
      0.6
    ) {
      return MEMORY_ACTIONS
        .SAVE_PROJECT_MEMORY;
    }

    return MEMORY_ACTIONS
      .HOLD_FOR_MORE_EVIDENCE;
  }

  if (
    candidate.confidence >=
    0.82
  ) {
    return MEMORY_ACTIONS
      .SAVE_PATTERN;
  }

  if (
    candidate.confidence >=
    0.58
  ) {
    return MEMORY_ACTIONS
      .CAPTURE_OBSERVATION;
  }

  return MEMORY_ACTIONS
    .HOLD_FOR_MORE_EVIDENCE;
}

function createStorageInstruction({
  candidate,
  action,
  relationship,
}) {
  const common = {
    candidateId:
      candidate.id,

    memoryKey:
      candidate.memoryKey,

    action,

    category:
      candidate.category,

    confidence:
      candidate.confidence,

    horizon:
      candidate.horizon,

    scope:
      candidate.scope,

    importance:
      candidate.importance,

    creatorId:
      candidate.creatorId,

    projectId:
      candidate.projectId,

    sessionId:
      candidate.sessionId,

    entityType:
      candidate.entityType,

    entityId:
      candidate.entityId,

    relatedMemoryId:
      relationship
        .relatedMemory
        ?.id ||
      null,
  };

  if (
    action ===
    MEMORY_ACTIONS
      .UPDATE_PROFILE
  ) {
    return {
      ...common,

      targetMethod:
        "updateCreatorProfile",

      payload: {
        mentorLearning: {
          category:
            candidate.category,

          value:
            candidate.value,

          confidence:
            candidate.confidence,

          evidence:
            candidate.evidence,

          memoryKey:
            candidate.memoryKey,

          updatedAt:
            createTimestamp(),
        },
      },
    };
  }

  if (
    action ===
    MEMORY_ACTIONS
      .SAVE_PATTERN
  ) {
    return {
      ...common,

      targetMethod:
        "savePattern",

      payload: {
        name:
          candidate.title,

        description:
          candidate.content,

        category:
          candidate.category,

        evidence:
          candidate.evidence,

        confidence:
          candidate.confidence,

        status:
          candidate.confidence >=
          0.88
            ? "confirmed"
            : "emerging",

        positiveReflection:
          "",

        metadata: {
          horizon:
            candidate.horizon,

          scope:
            candidate.scope,

          importance:
            candidate.importance,

          value:
            candidate.value,

          memoryKey:
            candidate.memoryKey,

          source:
            candidate.source,
        },
      },
    };
  }

  if (
    action ===
      MEMORY_ACTIONS
        .CAPTURE_OBSERVATION ||
    action ===
      MEMORY_ACTIONS
        .HOLD_FOR_MORE_EVIDENCE
  ) {
    return {
      ...common,

      targetMethod:
        "addObservation",

      payload: {
        text:
          candidate.content,

        category:
          candidate.category,

        evidence:
          candidate.evidence,

        confidence:
          candidate.confidence,

        status:
          "emerging",

        permissionToReflect:
          false,

        metadata: {
          horizon:
            candidate.horizon,

          scope:
            candidate.scope,

          importance:
            candidate.importance,

          value:
            candidate.value,

          memoryKey:
            candidate.memoryKey,

          projectId:
            candidate.projectId,

          sessionId:
            candidate.sessionId,

          entityType:
            candidate.entityType,

          entityId:
            candidate.entityId,

          source:
            candidate.source,

          holdForMoreEvidence:
            action ===
            MEMORY_ACTIONS
              .HOLD_FOR_MORE_EVIDENCE,
        },
      },
    };
  }

  if (
    action ===
    MEMORY_ACTIONS
      .SAVE_DEFERRED_TOPIC
  ) {
    return {
      ...common,

      targetMethod:
        "saveIdea",

      payload: {
        title:
          candidate.title,

        content:
          candidate.content,

        creatorType: "",

        status: "paused",

        source: "creator",

        tags:
          uniqueValues([
            "deferred-topic",
            candidate.category,
            ...candidate.tags,
          ]),

        importance:
          candidate.importance,

        emotionalContext:
          null,

        relatedProjectId:
          candidate.projectId,

        metadata: {
          ...candidate.metadata,

          memoryKey:
            candidate.memoryKey,

          scope:
            candidate.scope,

          recallTiming:
            RECALL_TIMINGS
              .NEXT_RELEVANT_MOMENT,

          capturedAt:
            createTimestamp(),
        },
      },
    };
  }

  if (
    action ===
    MEMORY_ACTIONS
      .SAVE_PROJECT_MEMORY
  ) {
    return {
      ...common,

      targetMethod:
        null,

      preferredTargetMethod:
        "saveProjectMemory",

      payload: {
        ...cloneValue(
          candidate
        ),

        status:
          candidate.confidence >=
          0.86
            ? MEMORY_STATUSES
                .ESTABLISHED
            : MEMORY_STATUSES
                .EMERGING,
      },

      requiresMemoryAdapterResolution:
        true,

      adapterReason:
        "CreatorMemory.js does not yet expose the project-memory persistence contract.",
    };
  }

  if (
    action ===
    MEMORY_ACTIONS
      .SAVE_SESSION_HANDOFF
  ) {
    return {
      ...common,

      targetMethod:
        null,

      preferredTargetMethod:
        "saveSessionHandoff",

      payload:
        cloneValue(
          candidate
        ),

      requiresMemoryAdapterResolution:
        true,

      adapterReason:
        "Session handoff persistence belongs to the future project-memory adapter.",
    };
  }

  if (
    action ===
      MEMORY_ACTIONS
        .REINFORCE_MEMORY ||
    action ===
      MEMORY_ACTIONS
        .SUPERSEDE_MEMORY
  ) {
    return {
      ...common,

      targetMethod:
        null,

      preferredTargetMethod:
        action ===
        MEMORY_ACTIONS
          .REINFORCE_MEMORY
          ? "reinforceMemory"
          : "supersedeMemory",

      payload: {
        existingMemory:
          cloneValue(
            relationship
              .relatedMemory
          ),

        candidate:
          cloneValue(
            candidate
          ),

        relationship:
          relationship.relationship,
      },

      requiresMemoryAdapterResolution:
        true,

      adapterReason:
        "Reinforcement and supersession require a persistence adapter that can update existing memory records safely.",
    };
  }

  return {
    ...common,
    targetMethod: null,
    payload: null,
  };
}

function extractForgetTarget(
  message
) {
  const text =
    cleanString(message);

  const patterns = [
    /forget\s+(?:that|this memory)\s*[:,-]?\s*(.*)$/i,
    /remove\s+(?:that|this)\s+from\s+memory\s*[:,-]?\s*(.*)$/i,
    /delete\s+(?:that|this)\s+memory\s*[:,-]?\s*(.*)$/i,
    /erase\s+(?:that|this)\s+memory\s*[:,-]?\s*(.*)$/i,
  ];

  for (
    const pattern
    of patterns
  ) {
    const match =
      text.match(
        pattern
      );

    if (match) {
      return cleanString(
        match[1]
      );
    }
  }

  return "";
}

function planForgetRequest({
  message,
  context,
  existingMemories,
  explicitMemoryIntent,
}) {
  if (
    explicitMemoryIntent.value !==
    "forget-existing"
  ) {
    return {
      requested: false,
      targetText: "",
      matchedMemories: [],
      requiresClarification:
        false,
      instructions: [],
    };
  }

  const explicitIds =
    uniqueValues(
      asArray(
        context
          ?.targetMemoryIds
      )
    );

  const targetText =
    extractForgetTarget(
      message
    );

  let matchedMemories =
    [];

  if (
    explicitIds.length > 0
  ) {
    matchedMemories =
      existingMemories.filter(
        (memory) =>
          explicitIds.includes(
            memory?.id
          )
      );
  } else if (
    targetText
  ) {
    matchedMemories =
      existingMemories
        .map((memory) => ({
          memory,

          similarity:
            calculateTextSimilarity(
              targetText,

              [
                memory?.title,
                memory?.content,
                memory?.text,
                memory?.description,

                typeof memory?.value ===
                "string"
                  ? memory.value
                  : "",
              ]
                .filter(Boolean)
                .join(" ")
            ),
        }))
        .filter(
          (item) =>
            item.similarity >=
            0.38
        )
        .sort(
          (a, b) =>
            b.similarity -
            a.similarity
        )
        .slice(0, 5)
        .map(
          (item) =>
            item.memory
        );
  }

  const requiresClarification =
    explicitIds.length === 0 &&
    (
      !targetText ||
      matchedMemories.length !==
        1
    );

  const instructions =
    requiresClarification
      ? []
      : matchedMemories.map(
          (memory) => ({
            action:
              MEMORY_ACTIONS
                .FORGET_MEMORY,

            targetMethod:
              null,

            preferredTargetMethod:
              "forgetMemory",

            memoryId:
              memory?.id ||
              null,

            payload: {
              memoryId:
                memory?.id ||
                null,

              memoryKey:
                memory?.memoryKey ||
                null,
            },

            requiresMemoryAdapterResolution:
              true,

            requiresExplicitExecutionApproval:
              true,

            adapterReason:
              "Deletion must be executed by the persistence layer against an unambiguous memory record.",
          })
        );

  return {
    requested: true,
    targetText,

    matchedMemories:
      cloneValue(
        matchedMemories
      ),

    requiresClarification,
    instructions,
  };
}

function getMemoryText(
  memory
) {
  return [
    memory?.title,
    memory?.content,
    memory?.text,
    memory?.description,
    memory?.name,

    typeof memory?.value ===
    "string"
      ? memory.value
      : "",

    memory?.category,
    memory?.entityName,
    memory?.metadata?.value,
  ]
    .filter(Boolean)
    .join(" ");
}

function isRecallEligible(
  memory,
  context
) {
  if (!memory) {
    return false;
  }

  const status =
    memory?.status;

  if (
    [
      MEMORY_STATUSES.REJECTED,
      MEMORY_STATUSES.ARCHIVED,
    ].includes(status)
  ) {
    return false;
  }

  if (
    [
      MEMORY_STATUSES.SUPERSEDED,
      MEMORY_STATUSES.HISTORICAL,
    ].includes(status) &&
    !context
      ?.includeHistoricalRecall
  ) {
    return false;
  }

  if (
    memory?.recallPolicy
      ?.automatic === false ||
    memory?.metadata
      ?.recallTiming ===
      RECALL_TIMINGS
        .NEVER_AUTOMATICALLY
  ) {
    return false;
  }

  const activeProjectId =
    getProjectId(
      context
    );

  const memoryProjectId =
    memory?.projectId ||
    memory?.metadata
      ?.projectId ||
    memory?.relatedProjectId ||
    null;

  if (
    activeProjectId &&
    memoryProjectId &&
    activeProjectId !==
      memoryProjectId
  ) {
    return false;
  }

  return true;
}

function scoreMemoryRecall({
  memory,
  message,
  context,
}) {
  if (
    !isRecallEligible(
      memory,
      context
    )
  ) {
    return 0;
  }

  const currentText = [
    message,
    context?.conversationMode,
    context?.thinkingMode,
    context?.projectType,
    context?.activeStage,
    context
      ?.activeProject
      ?.title,
    context
      ?.activeScene
      ?.title,
    context
      ?.activeCharacter
      ?.name,
  ]
    .filter(Boolean)
    .join(" ");

  const memoryText =
    getMemoryText(
      memory
    );

  let score =
    calculateTextSimilarity(
      currentText,
      memoryText
    );

  const activeProjectId =
    getProjectId(
      context
    );

  const memoryProjectId =
    memory?.projectId ||
    memory?.metadata
      ?.projectId ||
    memory?.relatedProjectId ||
    null;

  if (
    activeProjectId &&
    memoryProjectId ===
      activeProjectId
  ) {
    score += 0.25;
  }

  if (
    memory?.category ===
      MEMORY_CATEGORIES
        .SESSION_HANDOFF &&
    context
      ?.creatorMessageCount <=
      2
  ) {
    score += 0.3;
  }

  if (
    memory?.category ===
    MEMORY_CATEGORIES
      .CURRENT_POSITION
  ) {
    score += 0.12;
  }

  if (
    memory?.importance ===
      MEMORY_IMPORTANCE.HIGH ||
    memory?.importance ===
      MEMORY_IMPORTANCE.CRITICAL
  ) {
    score += 0.12;
  }

  if (
    context?.thinkingMode ===
      "flow" ||
    context?.thinkingMode ===
      "build"
  ) {
    score -= 0.08;
  }

  if (
    context?.guidanceWindow ===
    "closed-for-now"
  ) {
    score -= 0.22;
  }

  if (
    context
      ?.creatorExplicitlyAskedToRevisit
  ) {
    score += 0.35;
  }

  return Math.max(
    0,
    Math.min(
      1,
      score
    )
  );
}

function planRelevantRecall({
  message,
  context,
  existingMemories,
}) {
  const ranked =
    existingMemories
      .map((memory) => ({
        memory,

        relevance:
          scoreMemoryRecall({
            memory,
            message,
            context,
          }),
      }))
      .filter(
        (item) =>
          item.relevance >=
          0.42
      )
      .sort(
        (a, b) =>
          b.relevance -
          a.relevance
      )
      .slice(0, 3);

  if (
    ranked.length === 0
  ) {
    return {
      shouldRecall: false,

      priority:
        RECALL_PRIORITIES.NONE,

      timing:
        RECALL_TIMINGS.NOT_NOW,

      memories: [],

      reason:
        "No stored memory is relevant enough to improve the current response.",
    };
  }

  const strongest =
    ranked[0];

  if (
    context?.guidanceWindow ===
      "closed-for-now" ||
    (
      context?.thinkingMode ===
        "flow" &&
      strongest.relevance <
        0.78
    )
  ) {
    return {
      shouldRecall: false,

      priority:
        RECALL_PRIORITIES
          .MEDIUM,

      timing:
        RECALL_TIMINGS
          .NEXT_RELEVANT_MOMENT,

      memories:
        cloneValue(
          ranked
        ),

      reason:
        "Relevant memory exists, but current flow should not be interrupted.",
    };
  }

  return {
    shouldRecall: true,

    priority:
      strongest.relevance >=
      0.8
        ? RECALL_PRIORITIES
            .HIGH
        : RECALL_PRIORITIES
            .MEDIUM,

    timing:
      RECALL_TIMINGS
        .WHEN_CREATOR_IS_READY,

    memories:
      cloneValue(
        ranked
      ),

    reason:
      "Stored context is relevant enough to improve continuity or reduce repeated work.",
  };
}

function scoreDeferredRecall({
  memory,
  message,
  context,
}) {
  const baseScore =
    scoreMemoryRecall({
      memory,
      message,
      context,
    });

  let score =
    baseScore;

  if (
    context?.thinkingMode ===
      "flow" ||
    context?.thinkingMode ===
      "build"
  ) {
    score -= 0.14;
  }

  if (
    context
      ?.creatorExplicitlyAskedToRevisit
  ) {
    score += 0.25;
  }

  return Math.max(
    0,
    Math.min(
      1,
      score
    )
  );
}

function planDeferredRecall({
  message,
  context,
  existingMemories,
}) {
  const deferredMemories =
    existingMemories.filter(
      (memory) =>
        memory.category ===
          MEMORY_CATEGORIES
            .DEFERRED_TOPIC ||
        memory.tags?.includes?.(
          "deferred-topic"
        ) ||
        memory.metadata
          ?.recallTiming ===
          RECALL_TIMINGS
            .NEXT_RELEVANT_MOMENT
    );

  const ranked =
    deferredMemories
      .map((memory) => ({
        memory,

        relevance:
          scoreDeferredRecall({
            memory,
            message,
            context,
          }),
      }))
      .sort(
        (a, b) =>
          b.relevance -
          a.relevance
      );

  const strongest =
    ranked[0];

  if (
    !strongest ||
    strongest.relevance <
      0.45
  ) {
    return {
      shouldRecall: false,

      priority:
        RECALL_PRIORITIES.NONE,

      timing:
        RECALL_TIMINGS.NOT_NOW,

      memory: null,

      reason:
        "No deferred memory is sufficiently relevant.",
    };
  }

  if (
    context?.thinkingMode ===
      "flow" ||
    context?.thinkingMode ===
      "build" ||
    context?.guidanceWindow ===
      "closed-for-now"
  ) {
    return {
      shouldRecall: false,

      priority:
        RECALL_PRIORITIES
          .MEDIUM,

      timing:
        RECALL_TIMINGS
          .NEXT_RELEVANT_MOMENT,

      memory:
        cloneValue(
          strongest.memory
        ),

      reason:
        "The memory is relevant, but current creative flow should not be interrupted.",
    };
  }

  return {
    shouldRecall: true,

    priority:
      strongest.relevance >=
      0.75
        ? RECALL_PRIORITIES
            .HIGH
        : RECALL_PRIORITIES
            .MEDIUM,

    timing:
      RECALL_TIMINGS
        .WHEN_CREATOR_IS_READY,

    memory:
      cloneValue(
        strongest.memory
      ),

    reason:
      "A previously deferred topic is relevant to the current conversation.",
  };
}

function createCombinedRecallPlan({
  deferredRecall,
  relevantRecall,
}) {
  const deferredWins =
    deferredRecall
      .shouldRecall &&
    [
      RECALL_PRIORITIES.HIGH,
      RECALL_PRIORITIES
        .IMMEDIATE,
    ].includes(
      deferredRecall.priority
    );

  const shouldRecall =
    Boolean(
      deferredRecall
        .shouldRecall ||
      relevantRecall
        .shouldRecall
    );

  return {
    shouldRecall,

    priority:
      deferredWins
        ? deferredRecall.priority
        : relevantRecall
            .priority !==
          RECALL_PRIORITIES.NONE
          ? relevantRecall
              .priority
          : deferredRecall
              .priority,

    timing:
      deferredWins
        ? deferredRecall.timing
        : relevantRecall
            .timing !==
          RECALL_TIMINGS.NOT_NOW
          ? relevantRecall
              .timing
          : deferredRecall
              .timing,

    memory:
      deferredRecall.memory ||
      null,

    memories:
      relevantRecall.memories ||
      [],

    deferred:
      deferredRecall,

    relevant:
      relevantRecall,

    reason:
      shouldRecall
        ? "One or more memories may improve continuity without taking control away from the creator."
        : "No memory needs to be surfaced now.",
  };
}

function createResponseGuidance({
  briefDetour,
  deferredTopic,
  recallPlan,
  forgetPlan,
}) {
  const guidance = [
    "Memory should help the Mentor serve the creator more effectively.",
    "Treat stored conclusions as possibilities, not permanent definitions.",
    "Present behaviour should override historical preference when they conflict.",
    "Project decisions should be treated as scoped project truth until the creator changes them.",
    "Never diagnose the creator.",
    "Never use memory to pressure, manipulate or shame.",
    "Do not surface a memory merely to demonstrate that it was remembered.",
    "Only recall information when it is relevant and useful.",
    "When several memories are relevant, surface only the minimum needed for continuity.",
  ];

  if (
    briefDetour.value
  ) {
    guidance.push(
      "Acknowledge the brief thought without opening a long discussion.",
      "Confirm that the thought can be captured safely.",
      "Return smoothly to the previous task.",
      "Leave the door open to revisit the subject later."
    );
  }

  if (
    deferredTopic.value
  ) {
    guidance.push(
      "Do not explore the deferred topic now.",
      "Store enough context to revisit it meaningfully.",
      "Remember why the subject was deferred.",
      "Do not frame deferral as avoidance or failure."
    );
  }

  if (
    recallPlan.shouldRecall
  ) {
    guidance.push(
      "Introduce remembered context naturally rather than announcing the memory system.",
      "Explain why a recalled item matters only when that explanation is useful.",
      "Allow the creator to correct remembered project facts immediately.",
      "Allow the creator to decline a deferred topic and continue."
    );
  }

  if (
    forgetPlan.requested
  ) {
    if (
      forgetPlan
        .requiresClarification
    ) {
      guidance.push(
        "The creator asked to forget something, but the target is not unambiguous.",
        "Ask only for the minimum clarification needed before deleting stored memory."
      );
    } else {
      guidance.push(
        "Respect the creator's explicit forget request and do not recreate the deleted conclusion from inference alone."
      );
    }
  }

  return uniqueValues(
    guidance
  );
}

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
    "Do not let one specialist agent silently overwrite another source of project truth.",
    "Do not automatically supersede an existing memory merely because a related new statement differs.",
    "Do not delete stored memory when a forget request is ambiguous.",
    "Do not persist raw secrets, credentials or access tokens as creative memory.",
  ];
}

function createFallbackMemoryPlan({
  message,
  context,
  error = null,
}) {
  return {
    id:
      createMemoryPlanId(),

    engine:
      "creator-memory-engine",

    version:
      CREATOR_MEMORY_ENGINE_VERSION,

    input: {
      message:
        cleanString(message),
    },

    detections: {},

    candidates: [],

    instructions: [],

    forget: {
      requested: false,
      targetText: "",
      matchedMemories: [],
      requiresClarification:
        false,
      instructions: [],
    },

    recall: {
      shouldRecall: false,

      priority:
        RECALL_PRIORITIES.NONE,

      timing:
        RECALL_TIMINGS.NOT_NOW,

      memory: null,

      memories: [],

      deferred: null,

      relevant: null,

      reason:
        "Memory analysis was unavailable.",
    },

    responseGuidance: [
      "Do not store new conclusions.",
      "Use present conversation context only.",
      "Ask for explicit confirmation before remembering anything important.",
    ],

    guardRails:
      createGuardRails(),

    contextSnapshot:
      cloneValue(
        context
      ),

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

function createCreatorMemoryEngine() {
  function planMemory({
    message = "",
    context = {},
  } = {}) {
    try {
      const combinedContext = {
        ...cloneValue(
          DEFAULT_MEMORY_CONTEXT
        ),

        ...cloneValue(
          context
        ),

        currentTimestamp:
          context
            ?.currentTimestamp ||
          createTimestamp(),
      };

      const explicitMemoryIntent =
        detectExplicitMemoryIntent({
          message,
          context:
            combinedContext,
        });

      const briefDetour =
        detectBriefDetour(
          message
        );

      const deferredTopic =
        detectDeferredTopic({
          message,
          context:
            combinedContext,
          briefDetour,
        });

      const temporaryState =
        detectTemporaryState({
          message,
          context:
            combinedContext,
        });

      const guidancePreference =
        detectGuidancePreference(
          message
        );

      const creativeProcess =
        detectCreativeProcess(
          message
        );

      const creativeTempo =
        detectCreativeTempo({
          message,
          context:
            combinedContext,
        });

      const automaticSkill =
        detectAutomaticSkill(
          message
        );

      const growthSignal =
        detectGrowthSignal(
          message
        );

      const vocabulary =
        detectCreativeVocabulary({
          message,
          context:
            combinedContext,
        });

      const projectMemorySignal =
        detectProjectMemorySignal({
          message,
          context:
            combinedContext,
        });

      const correctionSignal =
        detectCorrectionSignal(
          message
        );

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
        projectMemorySignal,
        correctionSignal,
      };

      const existingMemories = [
        ...asArray(
          combinedContext
            .existingMemories
        ),

        ...asArray(
          combinedContext
            .existingProjectMemories
        ),

        ...asArray(
          combinedContext
            .existingPatterns
        ),

        ...asArray(
          combinedContext
            .existingObservations
        ),
      ];

      const forgetPlan =
        planForgetRequest({
          message,
          context:
            combinedContext,
          existingMemories,
          explicitMemoryIntent,
        });

      const candidates =
        buildMemoryCandidates({
          message,
          context:
            combinedContext,
          detections,
        });

      const analysedCandidates =
        candidates.map(
          (candidate) => {
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
                correctionSignal,
              });

            const action =
              chooseMemoryAction({
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
                cloneValue(
                  relatedMemories
                ),

              relationship,
              action,
              instruction,
            };
          }
        );

      const deferredRecall =
        planDeferredRecall({
          message,
          context:
            combinedContext,
          existingMemories,
        });

      const relevantRecall =
        planRelevantRecall({
          message,
          context:
            combinedContext,
          existingMemories,
        });

      const recallPlan =
        createCombinedRecallPlan({
          deferredRecall,
          relevantRecall,
        });

      const instructions = [
        ...analysedCandidates
          .map(
            (item) =>
              item.instruction
          )
          .filter(Boolean),

        ...forgetPlan
          .instructions,
      ];

      return {
        id:
          createMemoryPlanId(),

        engine:
          "creator-memory-engine",

        version:
          CREATOR_MEMORY_ENGINE_VERSION,

        input: {
          message:
            cleanString(
              message
            ),
        },

        detections,

        candidates:
          cloneValue(
            analysedCandidates
          ),

        instructions,

        forget:
          forgetPlan,

        recall:
          recallPlan,

        memoryPrinciples: {
          memoryServesCreatorAndMentor:
            true,

          presentBehaviourLeads:
            true,

          longTermMemoryInforms:
            true,

          projectMemoryIsScoped:
            true,

          projectTruthMayEvolve:
            true,

          specialistAgentsShareMemory:
            true,

          specialistAgentsDoNotOwnTruth:
            true,

          sessionHandoffPreservesMomentum:
            true,

          identityMayEvolve:
            true,

          growthShouldBeRemembered:
            true,

          historicalMemoryShouldNotDefinePresent:
            true,

          recallMustBeRelevant:
            true,

          recallRequiresGoodTiming:
            true,

          deferredTopicsRemainOptional:
            true,

          explicitForgetRequestsAreRespected:
            true,

          ambiguousDeletionRequiresClarification:
            true,

          memoryMustProtectAutonomy:
            true,
        },

        responseGuidance:
          createResponseGuidance({
            briefDetour,
            deferredTopic,
            recallPlan,
            forgetPlan,
          }),

        guardRails:
          createGuardRails(),

        contextSnapshot:
          cloneValue(
            combinedContext
          ),

        status:
          "planned",

        createdAt:
          createTimestamp(),
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

  function planRecall({
    message = "",
    context = {},
  } = {}) {
    const combinedContext = {
      ...cloneValue(
        DEFAULT_MEMORY_CONTEXT
      ),

      ...cloneValue(
        context
      ),
    };

    const existingMemories = [
      ...asArray(
        combinedContext
          .existingMemories
      ),

      ...asArray(
        combinedContext
          .existingProjectMemories
      ),

      ...asArray(
        combinedContext
          .existingPatterns
      ),

      ...asArray(
        combinedContext
          .existingObservations
      ),
    ];

    const deferredRecall =
      planDeferredRecall({
        message,
        context:
          combinedContext,
        existingMemories,
      });

    const relevantRecall =
      planRelevantRecall({
        message,
        context:
          combinedContext,
        existingMemories,
      });

    return createCombinedRecallPlan({
      deferredRecall,
      relevantRecall,
    });
  }

  function planSessionHandoff({
    handoff = {},
    context = {},
  } = {}) {
    try {
      const combinedContext = {
        ...cloneValue(
          DEFAULT_MEMORY_CONTEXT
        ),

        ...cloneValue(
          context
        ),

        captureSessionHandoff:
          true,

        sessionHandoff:
          cloneValue(
            handoff
          ),
      };

      const candidate =
        createSessionHandoffCandidate({
          handoff,
          context:
            combinedContext,
        });

      if (!candidate) {
        return {
          id:
            createMemoryPlanId(
              "handoff-plan"
            ),

          engine:
            "creator-memory-engine",

          version:
            CREATOR_MEMORY_ENGINE_VERSION,

          candidates: [],

          instructions: [],

          status:
            "empty",

          createdAt:
            createTimestamp(),
        };
      }

      const relationship = {
        relationship: "new",
        relatedMemory: null,
        confidence: 0.96,
      };

      const instruction =
        createStorageInstruction({
          candidate,

          action:
            MEMORY_ACTIONS
              .SAVE_SESSION_HANDOFF,

          relationship,
        });

      return {
        id:
          createMemoryPlanId(
            "handoff-plan"
          ),

        engine:
          "creator-memory-engine",

        version:
          CREATOR_MEMORY_ENGINE_VERSION,

        candidates: [
          {
            candidate,
            relationship,

            action:
              MEMORY_ACTIONS
                .SAVE_SESSION_HANDOFF,

            instruction,
          },
        ],

        instructions: [
          instruction,
        ],

        status:
          "planned",

        createdAt:
          createTimestamp(),
      };
    } catch (error) {
      return createFallbackMemoryPlan({
        message: "",
        context,
        error,
      });
    }
  }

  function applyMemoryPlan({
    plan,
    memory,
  } = {}) {
    if (
      !plan ||
      !memory
    ) {
      return {
        applied: [],
        skipped: [],
        errors: [],
      };
    }

    const applied = [];
    const skipped = [];
    const errors = [];

    for (
      const instruction
      of plan.instructions ||
      []
    ) {
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
            instruction
              .adapterReason ||
            "Requires future memory adapter resolution.",
        });

        continue;
      }

      if (
        typeof memory[
          targetMethod
        ] !== "function"
      ) {
        skipped.push({
          instruction,

          reason:
            `Memory method unavailable: ${targetMethod}`,
        });

        continue;
      }

      try {
        const result =
          memory[
            targetMethod
          ](
            payload
          );

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

  function isBriefDetour(
    plan
  ) {
    return Boolean(
      plan
        ?.detections
        ?.briefDetour
        ?.value
    );
  }

  function shouldDeferTopic(
    plan
  ) {
    return Boolean(
      plan
        ?.detections
        ?.deferredTopic
        ?.value
    );
  }

  function shouldRecallMemory(
    plan
  ) {
    return Boolean(
      plan
        ?.recall
        ?.shouldRecall
    );
  }

  function hasForgetRequest(
    plan
  ) {
    return Boolean(
      plan
        ?.forget
        ?.requested
    );
  }

  return {
    planMemory,
    planRecall,
    planSessionHandoff,
    applyMemoryPlan,
    isBriefDetour,
    shouldDeferTopic,
    shouldRecallMemory,
    hasForgetRequest,
  };
}

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

function planRecall({
  message = "",
  context = {},
} = {}) {
  const engine =
    createCreatorMemoryEngine();

  return engine.planRecall({
    message,
    context,
  });
}

export {
  CREATOR_MEMORY_ENGINE_VERSION,
  MEMORY_CATEGORIES,
  MEMORY_HORIZONS,
  MEMORY_STATUSES,
  MEMORY_SCOPES,
  MEMORY_IMPORTANCE,
  MEMORY_SOURCES,
  MEMORY_ACTIONS,
  RECALL_PRIORITIES,
  RECALL_TIMINGS,
  EVIDENCE_TYPES,
  createCreatorMemoryEngine,
  planMemory,
  planRecall,
};

export default createCreatorMemoryEngine;
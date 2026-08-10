/**
 * Creator Memory Engine
 * ------------------------------------------------------------
 * The interpretation, learning, project-memory and recall-planning
 * layer for iBand's AI Mentor — The Creator.
 *
 * This engine sits between:
 * - The creator's present conversation.
 * - AdaptiveMentorEngine.
 * - Specialist creator agents.
 * - CreatorMemory.js.
 *
 * Version 2.3 hardens the live memory contract:
 *
 * - Present creator and project identity are resolved before
 *   persistent context is accepted.
 * - Project, creator, entity and session boundaries are enforced
 *   before persistence instructions are created.
 * - Creator corrections outrank specialist-agent assumptions.
 * - Unknown specialist signals remain evidence until classified.
 * - Temporary guidance cannot silently become a permanent profile
 *   preference.
 * - Recall respects lifecycle, project and creator boundaries.
 * - Resolved, archived, rejected and superseded memory is excluded
 *   from automatic recall unless explicitly permitted.
 * - Explicit forgetting requires safe, unambiguous resolution.
 * - Destructive persistence receives stricter result verification.
 * - Secrets and credentials are blocked from creative memory.
 * - Empty persistence plans are treated as successful no-ops.
 * - Every attempted persistence instruction must be accounted for
 *   as applied, skipped or errored.
 * - Partial adapter responses cannot masquerade as full success.
 * - Generic and direct persistence bridges now report the same
 *   execution contract.
 * - Session handoffs remain project-bound and replaceable.
 * - Persistence capability reporting exposes the real bridge.
 * - Existing CreatorMemory v2.x contracts remain compatible.
 *
 * Core principles:
 * - Protect the Creator.
 * - Memory exists to serve creation.
 * - Present behaviour leads; long-term memory informs.
 * - Creator-confirmed truth outranks inference.
 * - Project memory must remain project-scoped.
 * - Remember growth without trapping creators in old identities.
 * - Store possibilities, not psychological verdicts.
 * - Recall is an invitation, never an interruption.
 * - Specialist agents may contribute evidence, but do not own truth.
 * - Creator corrections override remembered assumptions.
 * - Explicit forget requests must be respected.
 * - Ambiguous deletion must never be guessed.
 * - Never claim persistence succeeded without evidence.
 * - Complexity belongs behind the conversation.
 */

const CREATOR_MEMORY_ENGINE_VERSION = "2.3.0";

const MEMORY_CATEGORIES = Object.freeze({
  CREATIVE_IDENTITY:
    "creative-identity",

  CREATIVE_PREFERENCE:
    "creative-preference",

  THINKING_PREFERENCE:
    "thinking-preference",

  GUIDANCE_PREFERENCE:
    "guidance-preference",

  LEARNING_PREFERENCE:
    "learning-preference",

  COMMUNICATION_PREFERENCE:
    "communication-preference",

  RESPONSE_DEPTH_PREFERENCE:
    "response-depth-preference",

  CREATIVE_PROCESS:
    "creative-process",

  CREATIVE_ENTRY_POINT:
    "creative-entry-point",

  CREATIVE_NAVIGATION_STYLE:
    "creative-navigation-style",

  CREATIVE_TEMPO:
    "creative-tempo",

  CREATIVE_VOCABULARY:
    "creative-vocabulary",

  CREATIVE_RITUAL:
    "creative-ritual",

  SHARED_MEANING:
    "shared-meaning",

  SWEET_SPOT:
    "sweet-spot",

  STRETCH_ZONE:
    "stretch-zone",

  CONFIDENCE_SIGNAL:
    "confidence-signal",

  MOMENTUM_SIGNAL:
    "momentum-signal",

  COGNITIVE_LOAD_SIGNAL:
    "cognitive-load-signal",

  AUTOMATIC_SKILL:
    "automatic-skill",

  DEVELOPING_SKILL:
    "developing-skill",

  GROWTH_SIGNAL:
    "growth-signal",

  HISTORICAL_IDENTITY:
    "historical-identity",

  CURRENT_STATE:
    "current-state",

  BRIEF_DETOUR:
    "brief-detour",

  DEFERRED_TOPIC:
    "deferred-topic",

  INSPIRATION_SOURCE:
    "inspiration-source",

  CREATIVE_SPARK:
    "creative-spark",

  PROJECT_CONTEXT:
    "project-context",

  PROJECT_IDENTITY:
    "project-identity",

  PROJECT_DECISION:
    "project-decision",

  PROJECT_PREFERENCE:
    "project-preference",

  PROJECT_CONSTRAINT:
    "project-constraint",

  STORY_FACT:
    "story-fact",

  CHARACTER_FACT:
    "character-fact",

  SCENE_FACT:
    "scene-fact",

  WORLD_FACT:
    "world-fact",

  CONTINUITY_FACT:
    "continuity-fact",

  ASSET_FACT:
    "asset-fact",

  UNRESOLVED_THREAD:
    "unresolved-thread",

  PROJECT_MILESTONE:
    "project-milestone",

  CURRENT_POSITION:
    "current-position",

  SESSION_HANDOFF:
    "session-handoff",

  RELATIONSHIP_CONTEXT:
    "relationship-context",

  UNKNOWN:
    "unknown",
});

const MEMORY_HORIZONS =
  Object.freeze({
    MOMENT:
      "moment",

    SESSION:
      "session",

    SHORT_TERM:
      "short-term",

    LONG_TERM:
      "long-term",

    HISTORICAL:
      "historical",

    UNDECIDED:
      "undecided",
  });

const MEMORY_STATUSES =
  Object.freeze({
    ACTIVE:
      "active",

    DEFERRED:
      "deferred",

    CONFIRMED:
      "confirmed",

    DISMISSED:
      "dismissed",

    CANDIDATE:
      "candidate",

    EMERGING:
      "emerging",

    REINFORCED:
      "reinforced",

    ESTABLISHED:
      "established",

    SUPERSEDED:
      "superseded",

    HISTORICAL:
      "historical",

    ARCHIVED:
      "archived",

    REJECTED:
      "rejected",

    RESOLVED:
      "resolved",
  });

const MEMORY_SCOPES =
  Object.freeze({
    CREATOR:
      "creator",

    PROJECT:
      "project",

    ENTITY:
      "entity",

    SESSION:
      "session",

    RELATIONSHIP:
      "relationship",

    GLOBAL:
      "global",
  });

const MEMORY_IMPORTANCE =
  Object.freeze({
    LOW:
      "low",

    MEDIUM:
      "medium",

    HIGH:
      "high",

    CORE:
      "core",

    CRITICAL:
      "critical",
  });

const MEMORY_SOURCES =
  Object.freeze({
    CREATOR:
      "creator",

    MENTOR:
      "mentor",

    SYSTEM:
      "system",

    INFERRED:
      "inferred",

    IMPORTED:
      "imported",

    PROJECT_STATE:
      "project-state",

    SPECIALIST_AGENT:
      "specialist-agent",

    UNKNOWN:
      "unknown",
  });

const MEMORY_CERTAINTY =
  Object.freeze({
    EXPLICIT:
      "explicit",

    CONFIRMED:
      "confirmed",

    OBSERVED:
      "observed",

    INFERRED:
      "inferred",

    UNKNOWN:
      "unknown",
  });

const MEMORY_ACTIONS =
  Object.freeze({
    IGNORE:
      "ignore",

    CAPTURE_OBSERVATION:
      "capture-observation",

    SAVE_PATTERN:
      "save-pattern",

    UPDATE_PROFILE:
      "update-profile",

    SAVE_PROJECT_MEMORY:
      "save-project-memory",

    SAVE_SESSION_HANDOFF:
      "save-session-handoff",

    REINFORCE_MEMORY:
      "reinforce-memory",

    WEAKEN_MEMORY:
      "weaken-memory",

    SUPERSEDE_MEMORY:
      "supersede-memory",

    ARCHIVE_AS_HISTORY:
      "archive-as-history",

    SAVE_DEFERRED_TOPIC:
      "save-deferred-memory",

    REVISIT_DEFERRED_TOPIC:
      "revisit-deferred-topic",

    RESOLVE_THREAD:
      "resolve-thread",

    FORGET_MEMORY:
      "forget-memory",

    HOLD_FOR_MORE_EVIDENCE:
      "hold-for-more-evidence",
  });

const RECALL_PRIORITIES =
  Object.freeze({
    NONE:
      "none",

    LOW:
      "low",

    MEDIUM:
      "medium",

    HIGH:
      "high",

    IMMEDIATE:
      "immediate",
  });

const RECALL_TIMINGS =
  Object.freeze({
    NOT_NOW:
      "not-now",

    LATER_THIS_SESSION:
      "later-this-session",

    NEXT_RELEVANT_MOMENT:
      "next-relevant-moment",

    NEXT_SESSION:
      "next-session",

    WHEN_CREATOR_IS_READY:
      "when-creator-is-ready",

    WHEN_TOPIC_RECURS:
      "when-topic-recurs",

    NEVER_AUTOMATICALLY:
      "never-automatically",
  });

const EVIDENCE_TYPES =
  Object.freeze({
    EXPLICIT_STATEMENT:
      "explicit-statement",

    REPEATED_LANGUAGE:
      "repeated-language",

    REPEATED_BEHAVIOUR:
      "repeated-behaviour",

    SESSION_PATTERN:
      "session-pattern",

    CORRECTION_FROM_CREATOR:
      "correction-from-creator",

    CREATOR_CONFIRMATION:
      "creator-confirmation",

    CREATOR_REJECTION:
      "creator-rejection",

    PROJECT_OUTCOME:
      "project-outcome",

    PROJECT_STATE:
      "project-state",

    AGENT_OBSERVATION:
      "agent-observation",

    TEMPORARY_STATE:
      "temporary-state",

    UNKNOWN:
      "unknown",
  });

const PERSISTENCE_STATUSES =
  Object.freeze({
    EMPTY:
      "empty",

    FULLY_SUCCESSFUL:
      "fully-successful",

    PARTIALLY_SUCCESSFUL:
      "partially-successful",

    FAILED:
      "failed",

    NO_OP:
      "no-op",
  });

const PROJECT_MEMORY_CATEGORIES =
  Object.freeze([
    MEMORY_CATEGORIES
      .PROJECT_CONTEXT,

    MEMORY_CATEGORIES
      .PROJECT_IDENTITY,

    MEMORY_CATEGORIES
      .PROJECT_DECISION,

    MEMORY_CATEGORIES
      .PROJECT_PREFERENCE,

    MEMORY_CATEGORIES
      .PROJECT_CONSTRAINT,

    MEMORY_CATEGORIES
      .STORY_FACT,

    MEMORY_CATEGORIES
      .CHARACTER_FACT,

    MEMORY_CATEGORIES
      .SCENE_FACT,

    MEMORY_CATEGORIES
      .WORLD_FACT,

    MEMORY_CATEGORIES
      .CONTINUITY_FACT,

    MEMORY_CATEGORIES
      .ASSET_FACT,

    MEMORY_CATEGORIES
      .UNRESOLVED_THREAD,

    MEMORY_CATEGORIES
      .PROJECT_MILESTONE,

    MEMORY_CATEGORIES
      .CURRENT_POSITION,

    MEMORY_CATEGORIES
      .SESSION_HANDOFF,
  ]);

const PROFILE_MEMORY_CATEGORIES =
  Object.freeze([
    MEMORY_CATEGORIES
      .GUIDANCE_PREFERENCE,

    MEMORY_CATEGORIES
      .LEARNING_PREFERENCE,

    MEMORY_CATEGORIES
      .COMMUNICATION_PREFERENCE,

    MEMORY_CATEGORIES
      .RESPONSE_DEPTH_PREFERENCE,
  ]);

const DESTRUCTIVE_MEMORY_ACTIONS =
  Object.freeze([
    MEMORY_ACTIONS
      .FORGET_MEMORY,
  ]);

const DEFAULT_MEMORY_CONTEXT =
  Object.freeze({
    creatorId:
      null,

    creatorJourney:
      "guide",

    creatorType:
      null,

    projectType:
      null,

    activeProject:
      null,

    activeProjectId:
      null,

    activeIdea:
      null,

    activeStage:
      null,

    activeScene:
      null,

    activeCharacter:
      null,

    activeAsset:
      null,

    sessionId:
      null,

    sessionStartedAt:
      null,

    conversationMode:
      null,

    thinkingMode:
      null,

    creatorEnergy:
      null,

    momentum:
      null,

    guidanceWindow:
      null,

    informationSaturation:
      null,

    creatorMessageCount:
      0,

    mentorMessageCount:
      0,

    recentCreatorMessages:
      [],

    recentMentorMessages:
      [],

    recentConversations:
      [],

    existingMemories:
      [],

    existingProjectMemories:
      [],

    existingPatterns:
      [],

    existingObservations:
      [],

    deferredMemories:
      [],

    milestones:
      [],

    creatorProfile:
      null,

    memorySignals:
      [],

    projectMemorySignals:
      [],

    sessionHandoff:
      null,

    captureSessionHandoff:
      false,

    sourceAgent:
      null,

    sourceSystem:
      null,

    targetMemoryIds:
      [],

    includeHistoricalRecall:
      false,

    creatorExplicitlyAskedToRemember:
      false,

    creatorExplicitlyAskedNotToRemember:
      false,

    creatorExplicitlyAskedToRevisit:
      false,

    currentTimestamp:
      null,
  });

/**
 * ------------------------------------------------------------
 * Core utilities
 * ------------------------------------------------------------
 */

function createTimestamp() {
  return new Date()
    .toISOString();
}

function createMemoryPlanId(
  prefix = "memory-plan"
) {
  const randomValue =
    Math.random()
      .toString(36)
      .slice(2, 10);

  return (
    `${prefix}-` +
    `${Date.now()}-` +
    `${randomValue}`
  );
}

function cloneValue(
  value
) {
  if (
    value === undefined
  ) {
    return undefined;
  }

  return JSON.parse(
    JSON.stringify(
      value
    )
  );
}

function cleanString(
  value
) {
  return (
    typeof value ===
    "string"
      ? value.trim()
      : ""
  );
}

function normaliseText(
  value
) {
  return cleanString(
    value
  )
    .toLowerCase()
    .replace(
      /[’‘]/g,
      "'"
    )
    .replace(
      /\s+/g,
      " "
    );
}

function asArray(
  value
) {
  return (
    Array.isArray(
      value
    )
      ? value
      : []
  );
}

function uniqueValues(
  values = []
) {
  return [
    ...new Set(
      asArray(
        values
      ).filter(
        (value) =>
          value !==
            null &&
          value !==
            undefined &&
          value !==
            ""
      )
    ),
  ];
}

function clampConfidence(
  value
) {
  const numericValue =
    Number(value);

  if (
    !Number.isFinite(
      numericValue
    )
  ) {
    return 0;
  }

  return Math.max(
    0,
    Math.min(
      1,
      numericValue
    )
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
      clampConfidence(
        confidence
      ),

    evidence:
      uniqueValues(
        evidence
      ),

    metadata:
      cloneValue(
        metadata
      ),
  };
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

function getProjectId(
  context = {}
) {
  const explicit =
    cleanString(
      context
        ?.activeProjectId
    );

  if (explicit) {
    return explicit;
  }

  if (
    typeof context
      ?.activeProject ===
      "string"
  ) {
    return (
      cleanString(
        context
          .activeProject
      ) ||
      null
    );
  }

  return (
    cleanString(
      context
        ?.activeProject
        ?.id
    ) ||
    cleanString(
      context
        ?.activeProject
        ?.projectId
    ) ||
    null
  );
}

function getCreatorId(
  context = {}
) {
  return (
    cleanString(
      context
        ?.creatorId
    ) ||
    cleanString(
      context
        ?.creatorProfile
        ?.id
    ) ||
    cleanString(
      context
        ?.memoryContext
        ?.creatorId
    ) ||
    cleanString(
      context
        ?.creatorMemoryContext
        ?.creatorId
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
      entityType:
        fallbackType,

      entityId:
        null,

      entityName:
        null,
    };
  }

  if (
    typeof value ===
      "string"
  ) {
    return {
      entityType:
        fallbackType,

      entityId:
        null,

      entityName:
        cleanString(
          value
        ) ||
        null,
    };
  }

  return {
    entityType:
      cleanString(
        value?.type
      ) ||
      cleanString(
        value?.entityType
      ) ||
      fallbackType,

    entityId:
      cleanString(
        value?.id
      ) ||
      cleanString(
        value?.entityId
      ) ||
      null,

    entityName:
      cleanString(
        value?.name
      ) ||
      cleanString(
        value?.title
      ) ||
      cleanString(
        value?.label
      ) ||
      null,
  };
}

function tokenise(
  value
) {
  return normaliseText(
    value
  )
    .split(
      /[^a-z0-9'-]+/i
    )
    .map(
      (word) =>
        word.trim()
    )
    .filter(
      (word) =>
        word.length >=
        4
    );
}

function calculateTextSimilarity(
  left,
  right
) {
  const leftWords =
    new Set(
      tokenise(
        left
      )
    );

  const rightWords =
    new Set(
      tokenise(
        right
      )
    );

  if (
    leftWords.size ===
      0 ||
    rightWords.size ===
      0
  ) {
    return 0;
  }

  let overlap = 0;

  leftWords.forEach(
    (word) => {
      if (
        rightWords.has(
          word
        )
      ) {
        overlap += 1;
      }
    }
  );

  return (
    overlap /
    Math.max(
      leftWords.size,
      rightWords.size,
      1
    )
  );
}

function isKnownCategory(
  value
) {
  return Object.values(
    MEMORY_CATEGORIES
  ).includes(
    value
  );
}

function isKnownHorizon(
  value
) {
  return Object.values(
    MEMORY_HORIZONS
  ).includes(
    value
  );
}

function isKnownScope(
  value
) {
  return Object.values(
    MEMORY_SCOPES
  ).includes(
    value
  );
}

function isKnownImportance(
  value
) {
  return Object.values(
    MEMORY_IMPORTANCE
  ).includes(
    value
  );
}

function isKnownSource(
  value
) {
  return Object.values(
    MEMORY_SOURCES
  ).includes(
    value
  );
}

function isKnownCertainty(
  value
) {
  return Object.values(
    MEMORY_CERTAINTY
  ).includes(
    value
  );
}

function isProjectMemoryCategory(
  category
) {
  return (
    PROJECT_MEMORY_CATEGORIES
      .includes(
        category
      )
  );
}

function resolveSignalCategory(
  signal = {}
) {
  if (
    isKnownCategory(
      signal.category
    )
  ) {
    return signal.category;
  }

  const kind =
    normaliseText(
      signal.kind ||
      signal.type ||
      signal.memoryType ||
      ""
    );

  const categoryMap = {
    decision:
      MEMORY_CATEGORIES
        .PROJECT_DECISION,

    preference:
      MEMORY_CATEGORIES
        .PROJECT_PREFERENCE,

    constraint:
      MEMORY_CATEGORIES
        .PROJECT_CONSTRAINT,

    story:
      MEMORY_CATEGORIES
        .STORY_FACT,

    character:
      MEMORY_CATEGORIES
        .CHARACTER_FACT,

    scene:
      MEMORY_CATEGORIES
        .SCENE_FACT,

    world:
      MEMORY_CATEGORIES
        .WORLD_FACT,

    continuity:
      MEMORY_CATEGORIES
        .CONTINUITY_FACT,

    asset:
      MEMORY_CATEGORIES
        .ASSET_FACT,

    unresolved:
      MEMORY_CATEGORIES
        .UNRESOLVED_THREAD,

    "unresolved-thread":
      MEMORY_CATEGORIES
        .UNRESOLVED_THREAD,

    milestone:
      MEMORY_CATEGORIES
        .PROJECT_MILESTONE,

    position:
      MEMORY_CATEGORIES
        .CURRENT_POSITION,

    handoff:
      MEMORY_CATEGORIES
        .SESSION_HANDOFF,

    context:
      MEMORY_CATEGORIES
        .PROJECT_CONTEXT,
  };

  return (
    categoryMap[
      kind
    ] ||
    MEMORY_CATEGORIES
      .UNKNOWN
  );
}

function resolveDefaultScope(
  category
) {
  if (
    isProjectMemoryCategory(
      category
    )
  ) {
    return (
      MEMORY_SCOPES
        .PROJECT
    );
  }

  if (
    [
      MEMORY_CATEGORIES
        .RELATIONSHIP_CONTEXT,

      MEMORY_CATEGORIES
        .SHARED_MEANING,
    ].includes(
      category
    )
  ) {
    return (
      MEMORY_SCOPES
        .RELATIONSHIP
    );
  }

  return (
    MEMORY_SCOPES
      .CREATOR
  );
}

function resolveDefaultHorizon(
  category
) {
  if (
    [
      MEMORY_CATEGORIES
        .CURRENT_STATE,

      MEMORY_CATEGORIES
        .BRIEF_DETOUR,
    ].includes(
      category
    )
  ) {
    return (
      MEMORY_HORIZONS
        .SESSION
    );
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
    ].includes(
      category
    )
  ) {
    return (
      MEMORY_HORIZONS
        .SHORT_TERM
    );
  }

  if (
    [
      MEMORY_CATEGORIES
        .GROWTH_SIGNAL,

      MEMORY_CATEGORIES
        .HISTORICAL_IDENTITY,

      MEMORY_CATEGORIES
        .PROJECT_MILESTONE,
    ].includes(
      category
    )
  ) {
    return (
      MEMORY_HORIZONS
        .HISTORICAL
    );
  }

  return (
    MEMORY_HORIZONS
      .LONG_TERM
  );
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
    ].includes(
      category
    )
  ) {
    return (
      MEMORY_IMPORTANCE
        .HIGH
    );
  }

  if (
    [
      MEMORY_CATEGORIES
        .UNRESOLVED_THREAD,

      MEMORY_CATEGORIES
        .PROJECT_MILESTONE,

      MEMORY_CATEGORIES
        .GUIDANCE_PREFERENCE,
    ].includes(
      category
    )
  ) {
    return (
      MEMORY_IMPORTANCE
        .MEDIUM
    );
  }

  return (
    MEMORY_IMPORTANCE
      .LOW
  );
}

function serialiseMemoryValue(
  value,
  fallback = ""
) {
  if (
    typeof value ===
      "string"
  ) {
    return normaliseText(
      value
    );
  }

  if (
    value === null ||
    value === undefined
  ) {
    return normaliseText(
      fallback
    );
  }

  if (
    [
      "number",
      "boolean",
    ].includes(
      typeof value
    )
  ) {
    return String(
      value
    );
  }

  try {
    return normaliseText(
      JSON.stringify(
        value
      )
    );
  } catch {
    return normaliseText(
      fallback
    );
  }
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
  metadata = {},
}) {
  const suppliedKey =
    cleanString(
      metadata
        ?.semanticKey ||
      metadata
        ?.memoryKey
    );

  if (
    suppliedKey
  ) {
    return suppliedKey;
  }

  const semanticText =
    serialiseMemoryValue(
      value,
      content
    )
      .split(" ")
      .slice(
        0,
        14
      )
      .join("-");

  return [
    scope ||
      "unknown-scope",

    category ||
      MEMORY_CATEGORIES
        .UNKNOWN,

    creatorId ||
      "no-creator",

    projectId ||
      "no-project",

    entityType ||
      "no-entity-type",

    entityId ||
      "no-entity-id",

    semanticText ||
      "no-value",
  ].join("::");
}

function mergePreferredArray(
  currentValue,
  memoryValue
) {
  return (
    asArray(
      currentValue
    ).length > 0
      ? cloneValue(
          currentValue
        )
      : cloneValue(
          asArray(
            memoryValue
          )
        )
  );
}

/**
 * ------------------------------------------------------------
 * Context boundary resolution
 * ------------------------------------------------------------
 */

function mergeMemoryContext({
  context = {},
  memoryContext = null,
}) {
  const base =
    cloneValue(
      DEFAULT_MEMORY_CONTEXT
    );

  const persistent =
    (
      memoryContext &&
      typeof memoryContext ===
        "object"
    )
      ? cloneValue(
          memoryContext
        )
      : {};

  const present =
    cloneValue(
      context ||
      {}
    );

  const memoryPreferences =
    persistent
      ?.communicationPreferences ||
    {};

  const creatorProfile =
    present
      ?.creatorProfile ||
    persistent
      ?.creatorProfile ||
    null;

  const persistentCreatorId =
    cleanString(
      persistent
        ?.creatorId
    ) ||
    cleanString(
      persistent
        ?.creatorProfile
        ?.id
    ) ||
    null;

  const presentCreatorId =
    cleanString(
      present
        ?.creatorId
    ) ||
    cleanString(
      present
        ?.creatorProfile
        ?.id
    ) ||
    null;

  /**
   * Present creator identity wins.
   *
   * If a persistent adapter somehow returns context belonging to
   * another creator, do not inherit its arrays into this turn.
   */
  const creatorIdentityConflict =
    Boolean(
      presentCreatorId &&
      persistentCreatorId &&
      presentCreatorId !==
        persistentCreatorId
    );

  const safePersistent =
    creatorIdentityConflict
      ? {}
      : persistent;

  const safeMemoryPreferences =
    safePersistent
      ?.communicationPreferences ||
    {};

  const activeProject =
    present
      ?.activeProject ||
    safePersistent
      ?.activeProject ||
    null;

  const presentProjectId =
    cleanString(
      present
        ?.activeProjectId
    ) ||
    getProjectId({
      activeProject:
        present
          ?.activeProject,
    });

  const resolvedProjectId =
    presentProjectId ||
    cleanString(
      safePersistent
        ?.activeProjectId
    ) ||
    getProjectId({
      activeProject:
        safePersistent
          ?.activeProject,
    }) ||
    null;

  return {
    ...base,

    ...safePersistent,

    ...present,

    creatorId:
      presentCreatorId ||
      persistentCreatorId ||
      null,

    creatorProfile:
      creatorIdentityConflict
        ? (
            present
              ?.creatorProfile ||
            null
          )
        : creatorProfile,

    activeProject,

    activeProjectId:
      resolvedProjectId,

    creatorIdentityConflict,

    persistentCreatorId:
      persistentCreatorId ||
      null,

    presentCreatorId:
      presentCreatorId ||
      null,

    projectContextWasExplicit:
      Boolean(
        presentProjectId
      ),

    recentConversations:
      mergePreferredArray(
        present
          ?.recentConversations,

        safePersistent
          ?.recentConversations
      ),

    existingMemories:
      mergePreferredArray(
        present
          ?.existingMemories,

        safePersistent
          ?.existingMemories
      ),

    existingProjectMemories:
      mergePreferredArray(
        present
          ?.existingProjectMemories,

        safePersistent
          ?.existingProjectMemories
      ),

    existingPatterns:
      mergePreferredArray(
        present
          ?.existingPatterns,

        safePersistent
          ?.existingPatterns
      ),

    existingObservations:
      mergePreferredArray(
        present
          ?.existingObservations,

        safePersistent
          ?.existingObservations
      ),

    deferredMemories:
      mergePreferredArray(
        present
          ?.deferredMemories,

        safePersistent
          ?.deferredMemories
      ),

    milestones:
      mergePreferredArray(
        present
          ?.milestones,

        safePersistent
          ?.milestones
      ),

    preferredResponseDepth:
      present
        ?.preferredResponseDepth ??
      safeMemoryPreferences
        ?.preferredResponseDepth ??
      memoryPreferences
        ?.preferredResponseDepth ??
      null,

    preferredGuidanceStyle:
      present
        ?.preferredGuidanceStyle ??
      safeMemoryPreferences
        ?.preferredGuidanceStyle ??
      memoryPreferences
        ?.preferredGuidanceStyle ??
      null,

    preferredMentorRole:
      present
        ?.preferredMentorRole ??
      safeMemoryPreferences
        ?.preferredMentorRole ??
      memoryPreferences
        ?.preferredMentorRole ??
      null,

    preferredCommunicationPace:
      present
        ?.preferredCommunicationPace ??
      safeMemoryPreferences
        ?.preferredCommunicationPace ??
      memoryPreferences
        ?.preferredCommunicationPace ??
      null,

    preferredVoiceProfile:
      present
        ?.preferredVoiceProfile ??
      safeMemoryPreferences
        ?.preferredVoiceProfile ??
      memoryPreferences
        ?.preferredVoiceProfile ??
      null,

    preferredChannel:
      present
        ?.preferredChannel ??
      safeMemoryPreferences
        ?.preferredChannel ??
      memoryPreferences
        ?.preferredChannel ??
      null,

    currentTimestamp:
      present
        ?.currentTimestamp ||
      createTimestamp(),
  };
}

/**
 * ------------------------------------------------------------
 * Intent and state detection
 * ------------------------------------------------------------
 */

function detectExplicitMemoryIntent({
  message,
  context,
}) {
  const text =
    normaliseText(
      message
    );

  const rememberPhrases = [
    "remember this",
    "remember that",
    "add this to memory",
    "save this to memory",
    "store this in memory",
    "keep this in memory",
    "lock this in",
    "anchor this",
  ];

  const doNotStorePhrases = [
    "don't remember this",
    "dont remember this",
    "don't save this to memory",
    "dont save this to memory",
    "don't store this",
    "dont store this",
    "this is temporary",
  ];

  const forgetPhrases = [
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
      forgetPhrases
    )
  ) {
    return createDetection({
      value:
        "forget-existing",

      confidence:
        0.99,

      evidence:
        forgetPhrases
          .filter(
            (phrase) =>
              text.includes(
                phrase
              )
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
      value:
        "do-not-store",

      confidence:
        0.99,

      evidence:
        doNotStorePhrases
          .filter(
            (phrase) =>
              text.includes(
                phrase
              )
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
      value:
        "store",

      confidence:
        0.98,

      evidence:
        rememberPhrases
          .filter(
            (phrase) =>
              text.includes(
                phrase
              )
          ),
    });
  }

  return createDetection({
    value:
      "implicit",

    confidence:
      0.45,

    evidence:
      [],
  });
}

function detectSensitiveMemoryContent(
  message
) {
  const text =
    cleanString(
      message
    );

  const normalised =
    normaliseText(
      message
    );

  const labels = [
    "password",
    "passcode",
    "pin number",
    "api key",
    "apikey",
    "access token",
    "auth token",
    "secret key",
    "private key",
    "recovery phrase",
    "seed phrase",
  ];

  const labelMatches =
    labels.filter(
      (label) =>
        normalised.includes(
          label
        )
    );

  const credentialAssignment =
    /(password|passcode|api[_ -]?key|access[_ -]?token|auth[_ -]?token|secret[_ -]?key|private[_ -]?key)\s*(?:is|=|:|-)\s*\S+/i
      .test(
        text
      );

  const privateKeyBlock =
    /-----BEGIN [A-Z ]*PRIVATE KEY-----/i
      .test(
        text
      );

  const openAiStyleSecret =
    /\bsk-[A-Za-z0-9_-]{16,}\b/
      .test(
        text
      );

  const bearerToken =
    /\bBearer\s+[A-Za-z0-9._~+/-]{12,}=*\b/i
      .test(
        text
      );

  const looksSensitive =
    privateKeyBlock ||
    openAiStyleSecret ||
    bearerToken ||
    (
      labelMatches.length >
        0 &&
      (
        credentialAssignment ||
        normalised.includes(
          "remember"
        ) ||
        normalised.includes(
          "store"
        ) ||
        normalised.includes(
          "save"
        )
      )
    );

  return createDetection({
    value:
      looksSensitive,

    confidence:
      looksSensitive
        ? 0.99
        : 0.2,

    evidence:
      uniqueValues([
        ...labelMatches,

        credentialAssignment
          ? "credential-like assignment"
          : null,

        privateKeyBlock
          ? "private-key block"
          : null,

        openAiStyleSecret
          ? "secret-token-shape"
          : null,

        bearerToken
          ? "bearer-token-shape"
          : null,
      ]),
  });
}

function detectBriefDetour(
  message
) {
  const text =
    normaliseText(
      message
    );

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
    phrases.filter(
      (phrase) =>
        text.includes(
          phrase
        )
    );

  return createDetection({
    value:
      matches.length > 0,

    confidence:
      matches.length > 0
        ? 0.9
        : 0.36,

    evidence:
      matches,
  });
}

function detectDeferredTopic({
  message,
  context,
  briefDetour,
}) {
  const text =
    normaliseText(
      message
    );

  const phrases = [
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
      phrases
    );

  const flowDefer =
    briefDetour.value &&
    [
      "flow",
      "build",
      "creation",
    ].includes(
      context
        ?.thinkingMode
    );

  const shouldDefer =
    explicitDefer ||
    flowDefer;

  return createDetection({
    value:
      shouldDefer,

    confidence:
      shouldDefer
        ? 0.88
        : 0.4,

    evidence:
      uniqueValues([
        ...phrases.filter(
          (phrase) =>
            text.includes(
              phrase
            )
        ),

        flowDefer
          ? "brief detour during active creative mode"
          : null,
      ]),
  });
}

function detectTemporaryState({
  message,
  context,
}) {
  const text =
    normaliseText(
      message
    );

  const phrases = [
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

  const matches =
    phrases.filter(
      (phrase) =>
        text.includes(
          phrase
        )
    );

  const structuredTemporary =
    [
      ...asArray(
        context
          ?.memorySignals
      ),

      ...asArray(
        context
          ?.projectMemorySignals
      ),
    ].some(
      (signal) =>
        signal
          ?.evidenceType ===
          EVIDENCE_TYPES
            .TEMPORARY_STATE ||
        signal
          ?.temporary ===
          true
    );

  const isTemporary =
    matches.length >
      0 ||
    structuredTemporary;

  return createDetection({
    value:
      isTemporary,

    confidence:
      isTemporary
        ? 0.84
        : 0.36,

    evidence:
      uniqueValues([
        ...matches,

        structuredTemporary
          ? EVIDENCE_TYPES
              .TEMPORARY_STATE
          : null,
      ]),
  });
}

function detectGuidancePreference(
  message
) {
  const text =
    normaliseText(
      message
    );

  const rules = [
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
    of rules
  ) {
    const matches =
      rule.phrases
        .filter(
          (phrase) =>
            text.includes(
              phrase
            )
        );

    if (
      matches.length >
      0
    ) {
      return createDetection({
        value:
          rule.value,

        confidence:
          0.72 +
          Math.min(
            matches.length *
              0.08,
            0.2
          ),

        evidence:
          matches,
      });
    }
  }

  return createDetection({
    value:
      null,

    confidence:
      0.3,

    evidence:
      [],
  });
}

function detectCreativeVocabulary({
  message,
  context,
}) {
  const originalText =
    cleanString(
      message
    );

  const text =
    normaliseText(
      message
    );

  const sharedTerms = [
    "warp drive",
    "warp drives",
    "warp 20",
    "warp 40",
    "rabbit hole",
    "let's build",
    "lets build",
    "captain's protocol",
    "captains protocol",
  ];

  const foundSharedTerms =
    sharedTerms.filter(
      (term) =>
        text.includes(
          term
        )
    );

  const quotedPhrases =
    originalText.match(
      /["“][^"”]{2,60}["”]/g
    ) ||
    [];

  return {
    terms:
      uniqueValues(
        foundSharedTerms
      ),

    quotedPhrases:
      uniqueValues(
        quotedPhrases.map(
          (phrase) =>
            phrase
              .replace(
                /["“”]/g,
                ""
              )
              .trim()
        )
      ),

    likelySharedLanguage:
      foundSharedTerms
        .length >
        0 ||
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
    normaliseText(
      message
    );

  const rules = [
    {
      value:
        "blank-canvas",

      phrases: [
        "blank canvas",
        "start from nothing",
        "first line",
        "just start",
      ],
    },

    {
      value:
        "transform",

      phrases: [
        "transform",
        "reinterpret",
        "my own version",
        "change it into",
        "turn it into",
      ],
    },

    {
      value:
        "remix",

      phrases: [
        "remix",
        "mix together",
        "add a beat",
        "sample",
        "layer it",
      ],
    },

    {
      value:
        "combine",

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
      ],
    },

    {
      value:
        "react-and-refine",

      phrases: [
        "warmer",
        "colder",
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
      ],
    },
  ];

  const matches =
    rules
      .map(
        (rule) => ({
          process:
            rule.value,

          evidence:
            rule.phrases
              .filter(
                (phrase) =>
                  text.includes(
                    phrase
                  )
              ),
        })
      )
      .filter(
        (item) =>
          item
            .evidence
            .length >
          0
      );

  if (
    matches.length ===
    0
  ) {
    return createDetection({
      value:
        null,

      confidence:
        0.3,

      evidence:
        [],
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
    normaliseText(
      message
    );

  const fastPhrases = [
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
    "warp 40",
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
    context
      ?.thinkingMode ===
      "build" ||
    context
      ?.momentum ===
      "strong"
  ) {
    return createDetection({
      value:
        "fast-action",

      confidence:
        0.82,

      evidence:
        uniqueValues([
          ...fastPhrases
            .filter(
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

          context
            ?.momentum ===
            "strong"
            ? "strong momentum"
            : null,
        ]),
    });
  }

  if (
    includesAny(
      text,
      reflectivePhrases
    ) ||
    [
      "reflection",
      "exploration",
    ].includes(
      context
        ?.thinkingMode
    )
  ) {
    return createDetection({
      value:
        "slow-reflective",

      confidence:
        0.78,

      evidence:
        uniqueValues([
          ...reflectivePhrases
            .filter(
              (phrase) =>
                text.includes(
                  phrase
                )
            ),

          context
            ?.thinkingMode,
        ]),
    });
  }

  return createDetection({
    value:
      "adaptive",

    confidence:
      0.46,

    evidence:
      [],
  });
}

function detectAutomaticSkill(
  message
) {
  const text =
    normaliseText(
      message
    );

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
        text.includes(
          phrase
        )
    );

  return createDetection({
    value:
      matches.length >
      0,

    confidence:
      matches.length >
      0
        ? 0.88
        : 0.34,

    evidence:
      matches,
  });
}

function detectGrowthSignal(
  message
) {
  const text =
    normaliseText(
      message
    );

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
        text.includes(
          phrase
        )
    );

  return createDetection({
    value:
      matches.length >
      0,

    confidence:
      matches.length >
      0
        ? 0.84
        : 0.36,

    evidence:
      matches,
  });
}

function detectProjectMemorySignal({
  message,
  context,
}) {
  const text =
    normaliseText(
      message
    );

  const projectId =
    getProjectId(
      context
    );

  if (
    !projectId
  ) {
    return createDetection({
      value:
        null,

      confidence:
        0.2,

      evidence:
        [],
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
      rule.phrases
        .filter(
          (phrase) =>
            text.includes(
              phrase
            )
        );

    if (
      matches.length >
      0
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
    value:
      null,

    confidence:
      0.25,

    evidence:
      [],
  });
}

function detectCorrectionSignal(
  message
) {
  const text =
    normaliseText(
      message
    );

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
        text.includes(
          phrase
        )
    );

  return createDetection({
    value:
      matches.length >
      0,

    confidence:
      matches.length >
      0
        ? 0.9
        : 0.28,

    evidence:
      matches,
  });
}

/**
 * ------------------------------------------------------------
 * Candidate construction
 * ------------------------------------------------------------
 */

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
    explicitMemoryIntent
      .value ===
      "store"
  ) {
    confidence +=
      0.22;
  }

  if (
    categoryDetection
      ?.confidence
  ) {
    confidence +=
      categoryDetection
        .confidence *
      0.16;
  }

  confidence +=
    Math.min(
      evidenceCount *
        0.04,
      0.16
    );

  if (
    temporaryState
      .value
  ) {
    confidence -=
      0.08;
  }

  return clampConfidence(
    confidence
  );
}

function resolveCandidateCertainty({
  source,
  certainty = null,
  explicitMemoryIntent = null,
}) {
  if (
    isKnownCertainty(
      certainty
    )
  ) {
    return certainty;
  }

  if (
    source ===
      MEMORY_SOURCES
        .CREATOR &&
    explicitMemoryIntent
      ?.value ===
      "store"
  ) {
    return (
      MEMORY_CERTAINTY
        .EXPLICIT
    );
  }

  if (
    source ===
      MEMORY_SOURCES
        .CREATOR
  ) {
    return (
      MEMORY_CERTAINTY
        .OBSERVED
    );
  }

  if (
    source ===
      MEMORY_SOURCES
        .PROJECT_STATE
  ) {
    return (
      MEMORY_CERTAINTY
        .CONFIRMED
    );
  }

  if (
    source ===
      MEMORY_SOURCES
        .SPECIALIST_AGENT
  ) {
    return (
      MEMORY_CERTAINTY
        .OBSERVED
    );
  }

  if (
    source ===
      MEMORY_SOURCES
        .INFERRED
  ) {
    return (
      MEMORY_CERTAINTY
        .INFERRED
    );
  }

  return (
    MEMORY_CERTAINTY
      .UNKNOWN
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
    MEMORY_SOURCES
      .CREATOR,

  certainty = null,

  creatorId = null,
  projectId = null,
  sessionId = null,

  entityType = null,
  entityId = null,
  entityName = null,

  tags = [],

  recallPolicy = null,

  metadata = {},

  explicitMemoryIntent =
    null,
}) {
  const resolvedCategory =
    isKnownCategory(
      category
    )
      ? category
      : MEMORY_CATEGORIES
          .UNKNOWN;

  const resolvedScope =
    isKnownScope(
      scope
    )
      ? scope
      : resolveDefaultScope(
          resolvedCategory
        );

  const resolvedHorizon =
    isKnownHorizon(
      horizon
    )
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

  const resolvedSource =
    isKnownSource(
      source
    )
      ? source
      : MEMORY_SOURCES
          .UNKNOWN;

  const candidate = {
    id:
      createMemoryPlanId(
        "candidate"
      ),

    memoryKey:
      null,

    category:
      resolvedCategory,

    title:
      cleanString(
        title
      ),

    content:
      cleanString(
        content
      ),

    value:
      cloneValue(
        value
      ),

    horizon:
      resolvedHorizon,

    scope:
      resolvedScope,

    importance:
      resolvedImportance,

    status:
      MEMORY_STATUSES
        .CANDIDATE,

    confidence:
      clampConfidence(
        confidence
      ),

    evidence:
      uniqueValues(
        evidence
      ),

    source:
      resolvedSource,

    certainty:
      resolveCandidateCertainty({
        source:
          resolvedSource,

        certainty,

        explicitMemoryIntent,
      }),

    creatorId:
      cleanString(
        creatorId
      ) ||
      null,

    projectId:
      cleanString(
        projectId
      ) ||
      null,

    sessionId:
      cleanString(
        sessionId
      ) ||
      null,

    entityType:
      cleanString(
        entityType
      ) ||
      null,

    entityId:
      cleanString(
        entityId
      ) ||
      null,

    entityName:
      cleanString(
        entityName
      ) ||
      null,

    tags:
      uniqueValues(
        tags
      ),

    recallPolicy:
      recallPolicy || {
        automatic:
          true,

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
    cleanString(
      metadata
        ?.memoryKey ||
      metadata
        ?.semanticKey
    ) ||
    buildMemoryKey(
      candidate
    );

  return candidate;
}

function validateCandidateBoundary({
  candidate,
  context,
}) {
  if (
    !candidate
  ) {
    return {
      valid:
        false,

      reason:
        "candidate-required",
    };
  }

  const currentCreatorId =
    getCreatorId(
      context
    );

  const candidateCreatorId =
    cleanString(
      candidate
        ?.creatorId
    );

  if (
    currentCreatorId &&
    candidateCreatorId &&
    currentCreatorId !==
      candidateCreatorId
  ) {
    return {
      valid:
        false,

      reason:
        "creator-boundary-mismatch",
    };
  }

  if (
    candidate.scope ===
      MEMORY_SCOPES
        .PROJECT ||
    isProjectMemoryCategory(
      candidate.category
    )
  ) {
    const projectId =
      cleanString(
        candidate
          ?.projectId
      );

    if (
      !projectId
    ) {
      return {
        valid:
          false,

        reason:
          "project-boundary-required",
      };
    }

    const activeProjectId =
      getProjectId(
        context
      );

    if (
      activeProjectId &&
      activeProjectId !==
        projectId
    ) {
      return {
        valid:
          false,

        reason:
          "project-boundary-mismatch",
      };
    }
  }

  if (
    candidate.scope ===
      MEMORY_SCOPES
        .SESSION &&
    !cleanString(
      candidate
        ?.sessionId
    )
  ) {
    return {
      valid:
        false,

      reason:
        "session-boundary-required",
    };
  }

  if (
    candidate.scope ===
      MEMORY_SCOPES
        .ENTITY &&
    !(
      cleanString(
        candidate
          ?.entityId
      ) ||
      cleanString(
        candidate
          ?.entityName
      )
    )
  ) {
    return {
      valid:
        false,

      reason:
        "entity-boundary-required",
    };
  }

  return {
    valid:
      true,

    reason:
      null,
  };
}

function createStructuredSignalCandidate({
  signal,
  context,
  explicitMemoryIntent = null,
}) {
  if (
    !signal ||
    typeof signal !==
      "object"
  ) {
    return null;
  }

  const category =
    resolveSignalCategory(
      signal
    );

  const activeProjectId =
    getProjectId(
      context
    );

  const suppliedProjectId =
    cleanString(
      signal.projectId
    );

  /**
   * A specialist signal naming another project cannot silently
   * enter the active project's memory plan.
   */
  if (
    activeProjectId &&
    suppliedProjectId &&
    activeProjectId !==
      suppliedProjectId
  ) {
    return null;
  }

  const projectId =
    suppliedProjectId ||
    activeProjectId;

  if (
    isProjectMemoryCategory(
      category
    ) &&
    !projectId
  ) {
    return null;
  }

  const activeCreatorId =
    getCreatorId(
      context
    );

  const suppliedCreatorId =
    cleanString(
      signal.creatorId
    );

  if (
    activeCreatorId &&
    suppliedCreatorId &&
    activeCreatorId !==
      suppliedCreatorId
  ) {
    return null;
  }

  const entity =
    getEntityIdentity(
      signal.entity ||
      signal.character ||
      signal.scene ||
      signal.asset,

      cleanString(
        signal
          .entityType
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
        typeof signal
          .value ===
          "string"
          ? signal.value
          : ""
      )
    );

  if (
    !content &&
    signal.value ==
      null
  ) {
    return null;
  }

  const source =
    isKnownSource(
      signal.source
    )
      ? signal.source
      : context
          ?.sourceAgent
        ? MEMORY_SOURCES
            .SPECIALIST_AGENT
        : MEMORY_SOURCES
            .PROJECT_STATE;

  const evidence =
    uniqueValues([
      ...asArray(
        signal.evidence
      ),

      signal
        .evidenceType,

      context
        ?.sourceAgent
        ? (
            `${EVIDENCE_TYPES.AGENT_OBSERVATION}:` +
            `${context.sourceAgent}`
          )
        : null,
    ]);

  const candidate =
    createMemoryCandidate({
      category,

      title:
        cleanString(
          signal.title
        ) ||
        (
          category ===
            MEMORY_CATEGORIES
              .UNKNOWN
            ? "Memory signal"
            : "Project memory"
        ),

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
          : category ===
              MEMORY_CATEGORIES
                .UNKNOWN
            ? 0.55
            : 0.82,

      evidence,

      source,

      certainty:
        signal.certainty,

      creatorId:
        suppliedCreatorId ||
        activeCreatorId ||
        null,

      projectId,

      sessionId:
        signal.sessionId ||
        context
          ?.sessionId ||
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
        signal
          .recallPolicy ||
        null,

      metadata: {
        ...cloneValue(
          signal.metadata ||
          {}
        ),

        memoryKey:
          cleanString(
            signal
              .memoryKey
          ) ||
          cleanString(
            signal
              .semanticKey
          ) ||
          cleanString(
            signal
              .metadata
              ?.memoryKey
          ) ||
          null,

        sourceAgent:
          signal
            .sourceAgent ||
          context
            ?.sourceAgent ||
          null,

        sourceSystem:
          signal
            .sourceSystem ||
          context
            ?.sourceSystem ||
          null,

        structuredSignal:
          true,
      },

      explicitMemoryIntent,
    });

  const boundary =
    validateCandidateBoundary({
      candidate,

      context,
    });

  return (
    boundary.valid
      ? candidate
      : null
  );
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

  if (
    !projectId
  ) {
    return null;
  }

  const handoffProjectId =
    cleanString(
      handoff
        ?.projectId
    );

  if (
    handoffProjectId &&
    handoffProjectId !==
      projectId
  ) {
    return null;
  }

  const summary =
    cleanString(
      handoff.summary ||
      handoff
        .whereWeStopped
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
      context
        ?.activeStage
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
        ? (
            `Last completed: ` +
            `${lastCompleted}`
          )
        : null,

      nextStep
        ? (
            `Next step: ` +
            `${nextStep}`
          )
        : null,

      activeStage
        ? (
            `Active stage: ` +
            `${activeStage}`
          )
        : null,

      unresolved.length >
        0
        ? (
            `Open threads: ` +
            `${unresolved.join(
              "; "
            )}`
          )
        : null,
    ]);

  if (
    parts.length ===
    0
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
      parts.join(
        " | "
      ),

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
          handoff
            .activeScene
        ) ||
        cloneValue(
          context
            ?.activeScene
        ) ||
        null,

      activeCharacter:
        cloneValue(
          handoff
            .activeCharacter
        ) ||
        cloneValue(
          context
            ?.activeCharacter
        ) ||
        null,

      activeAsset:
        cloneValue(
          handoff
            .activeAsset
        ) ||
        cloneValue(
          context
            ?.activeAsset
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
      MEMORY_IMPORTANCE
        .HIGH,

    confidence:
      0.96,

    evidence: [
      EVIDENCE_TYPES
        .PROJECT_STATE,

      "session handoff requested",
    ],

    source:
      MEMORY_SOURCES
        .PROJECT_STATE,

    certainty:
      MEMORY_CERTAINTY
        .CONFIRMED,

    creatorId:
      getCreatorId(
        context
      ),

    projectId,

    sessionId:
      context
        ?.sessionId ||
      null,

    tags: [
      "session-handoff",
      "resume-context",
    ],

    recallPolicy: {
      automatic:
        true,

      timing:
        RECALL_TIMINGS
          .NEXT_SESSION,
    },

    metadata: {
      semanticKey:
        (
          `project::` +
          `session-handoff::` +
          `${projectId}`
        ),

      replacePreviousHandoff:
        true,

      sourceAgent:
        context
          ?.sourceAgent ||
        null,
    },
  });
}

function buildMemoryCandidates({
  message,
  context,
  detections,
}) {
  const candidates =
    [];

  const cleanMessage =
    cleanString(
      message
    );

  const projectId =
    getProjectId(
      context
    );

  const creatorId =
    getCreatorId(
      context
    );

  const {
    explicitMemoryIntent,
    sensitiveMemoryContent,
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
    [
      "do-not-store",
      "forget-existing",
    ].includes(
      explicitMemoryIntent
        .value
    ) ||
    sensitiveMemoryContent
      .value
  ) {
    return [];
  }

  if (
    guidancePreference
      .value
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
          guidancePreference
            .value,

        horizon:
          temporaryState
            .value
            ? MEMORY_HORIZONS
                .SESSION
            : MEMORY_HORIZONS
                .LONG_TERM,

        scope:
          temporaryState
            .value
            ? MEMORY_SCOPES
                .SESSION
            : MEMORY_SCOPES
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

        creatorId,

        sessionId:
          temporaryState
            .value
            ? context
                ?.sessionId ||
              null
            : null,

        certainty:
          explicitMemoryIntent
            .value ===
            "store"
            ? MEMORY_CERTAINTY
                .EXPLICIT
            : MEMORY_CERTAINTY
                .OBSERVED,

        metadata: {
          thinkingMode:
            context
              ?.thinkingMode ||
            null,

          sessionSpecific:
            temporaryState
              .value,
        },

        explicitMemoryIntent,
      })
    );
  }

  if (
    creativeProcess
      .value
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
          creativeProcess
            .value,

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

        creatorId,

        certainty:
          MEMORY_CERTAINTY
            .OBSERVED,

        explicitMemoryIntent,
      })
    );
  }

  if (
    creativeTempo
      .value !==
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
          creativeTempo
            .value,

        horizon:
          temporaryState
            .value
            ? MEMORY_HORIZONS
                .SESSION
            : MEMORY_HORIZONS
                .SHORT_TERM,

        scope:
          temporaryState
            .value
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

        creatorId,

        sessionId:
          temporaryState
            .value
            ? context
                ?.sessionId ||
              null
            : null,

        certainty:
          MEMORY_CERTAINTY
            .OBSERVED,

        metadata: {
          sessionSpecific:
            temporaryState
              .value,
        },

        explicitMemoryIntent,
      })
    );
  }

  if (
    automaticSkill
      .value
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

        creatorId,

        certainty:
          MEMORY_CERTAINTY
            .EXPLICIT,

        explicitMemoryIntent,
      })
    );
  }

  if (
    growthSignal
      .value
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

        creatorId,

        certainty:
          MEMORY_CERTAINTY
            .EXPLICIT,

        explicitMemoryIntent,
      })
    );
  }

  vocabulary
    .terms
    .forEach(
      (term) => {
        candidates.push(
          createMemoryCandidate({
            category:
              MEMORY_CATEGORIES
                .SHARED_MEANING,

            title:
              "Shared creative phrase",

            content:
              term,

            value:
              term,

            horizon:
              MEMORY_HORIZONS
                .LONG_TERM,

            scope:
              MEMORY_SCOPES
                .RELATIONSHIP,

            confidence:
              0.72,

            evidence: [
              term,
            ],

            creatorId,

            certainty:
              MEMORY_CERTAINTY
                .OBSERVED,

            metadata: {
              semanticKey:
                (
                  `relationship::` +
                  `shared-meaning::` +
                  `${normaliseText(
                    term
                  )}`
                ),
            },

            explicitMemoryIntent,
          })
        );
      }
    );

  if (
    explicitMemoryIntent
      .value ===
      "store"
  ) {
    vocabulary
      .quotedPhrases
      .forEach(
        (phrase) => {
          candidates.push(
            createMemoryCandidate({
              category:
                MEMORY_CATEGORIES
                  .CREATIVE_VOCABULARY,

              title:
                "Creator vocabulary",

              content:
                phrase,

              value:
                phrase,

              horizon:
                MEMORY_HORIZONS
                  .LONG_TERM,

              scope:
                MEMORY_SCOPES
                  .CREATOR,

              confidence:
                0.78,

              evidence: [
                EVIDENCE_TYPES
                  .EXPLICIT_STATEMENT,
              ],

              creatorId,

              certainty:
                MEMORY_CERTAINTY
                  .EXPLICIT,

              explicitMemoryIntent,
            })
          );
        }
      );
  }

  if (
    briefDetour
      .value
  ) {
    const detourScope =
      projectId
        ? MEMORY_SCOPES
            .PROJECT
        : MEMORY_SCOPES
            .SESSION;

    const detourSessionId =
      context
        ?.sessionId ||
      null;

    /**
     * Session-scoped memory requires a real session boundary.
     * Without one, hold the thought out of persistence rather than
     * silently inventing a session identity.
     */
    if (
      detourScope !==
        MEMORY_SCOPES
          .SESSION ||
      detourSessionId
    ) {
      candidates.push(
        createMemoryCandidate({
          category:
            deferredTopic
              .value
              ? MEMORY_CATEGORIES
                  .DEFERRED_TOPIC
              : MEMORY_CATEGORIES
                  .BRIEF_DETOUR,

          title:
            deferredTopic
              .value
              ? "Deferred creator topic"
              : "Brief creator detour",

          content:
            cleanMessage,

          value:
            cleanMessage,

          horizon:
            deferredTopic
              .value
              ? MEMORY_HORIZONS
                  .SHORT_TERM
              : MEMORY_HORIZONS
                  .SESSION,

          scope:
            detourScope,

          importance:
            MEMORY_IMPORTANCE
              .MEDIUM,

          confidence:
            0.86,

          evidence:
            uniqueValues([
              ...briefDetour
                .evidence,

              ...deferredTopic
                .evidence,
            ]),

          creatorId,

          projectId,

          sessionId:
            detourSessionId,

          certainty:
            MEMORY_CERTAINTY
              .OBSERVED,

          tags: [
            deferredTopic
              .value
              ? "deferred-topic"
              : "brief-detour",
          ],

          recallPolicy: {
            automatic:
              deferredTopic
                .value,

            timing:
              deferredTopic
                .value
                ? RECALL_TIMINGS
                    .NEXT_RELEVANT_MOMENT
                : RECALL_TIMINGS
                    .LATER_THIS_SESSION,
          },

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

          explicitMemoryIntent,
        })
      );
    }
  }

  if (
    projectMemorySignal
      .value &&
    cleanMessage &&
    projectId
  ) {
    const category =
      projectMemorySignal
        .value
        .category;

    candidates.push(
      createMemoryCandidate({
        category,

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
            category
          ),

        scope:
          MEMORY_SCOPES
            .PROJECT,

        importance:
          resolveDefaultImportance(
            category
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

        creatorId,

        projectId,

        sessionId:
          context
            ?.sessionId ||
          null,

        certainty:
          MEMORY_CERTAINTY
            .OBSERVED,

        metadata: {
          inferredFromConversation:
            true,
        },

        explicitMemoryIntent,
      })
    );
  }

  const structuredSignals = [
    ...asArray(
      context
        ?.memorySignals
    ),

    ...asArray(
      context
        ?.projectMemorySignals
    ),
  ];

  structuredSignals
    .forEach(
      (signal) => {
        const candidate =
          createStructuredSignalCandidate({
            signal,

            context,

            explicitMemoryIntent,
          });

        if (
          candidate
        ) {
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
    explicitMemoryIntent
      .value ===
      "store" &&
    candidates.length ===
      0 &&
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

        creatorId,

        projectId,

        sessionId:
          context
            ?.sessionId ||
          null,

        certainty:
          MEMORY_CERTAINTY
            .EXPLICIT,

        explicitMemoryIntent,
      })
    );
  }

  return deduplicateCandidates(
    candidates
      .filter(
        (candidate) =>
          validateCandidateBoundary({
            candidate,

            context,
          }).valid
      )
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
        !candidate
          ?.memoryKey
      ) {
        return;
      }

      const existing =
        byKey.get(
          candidate
            .memoryKey
        );

      if (
        !existing ||
        candidate
          .confidence >
          existing
            .confidence
      ) {
        byKey.set(
          candidate
            .memoryKey,
          candidate
        );
      }
    }
  );

  return [
    ...byKey.values(),
  ];
}

/**
 * ------------------------------------------------------------
 * Existing memory scope and relationship analysis
 * ------------------------------------------------------------
 */

function getMemoryProjectIds(
  memory
) {
  return uniqueValues([
    cleanString(
      memory
        ?.projectId
    ),

    cleanString(
      memory
        ?.metadata
        ?.projectId
    ),

    cleanString(
      memory
        ?.relatedProjectId
    ),

    ...asArray(
      memory
        ?.relatedProjectIds
    ).map(
      cleanString
    ),
  ].filter(
    Boolean
  ));
}

function getMemoryCreatorId(
  memory
) {
  return (
    cleanString(
      memory
        ?.creatorId
    ) ||
    cleanString(
      memory
        ?.metadata
        ?.creatorId
    ) ||
    null
  );
}

function inferMemoryScope(
  memory
) {
  const explicitScope =
    cleanString(
      memory
        ?.scope
    ) ||
    cleanString(
      memory
        ?.metadata
        ?.scope
    );

  if (
    isKnownScope(
      explicitScope
    )
  ) {
    return explicitScope;
  }

  if (
    getMemoryProjectIds(
      memory
    ).length >
      0 ||
    memory?.type ===
      "project-memory" ||
    memory?.type ===
      "session-handoff"
  ) {
    return (
      MEMORY_SCOPES
        .PROJECT
    );
  }

  return (
    MEMORY_SCOPES
      .CREATOR
  );
}

function memoryScopeCompatible(
  candidate,
  memory
) {
  const candidateScope =
    candidate
      ?.scope ||
    resolveDefaultScope(
      candidate
        ?.category
    );

  const memoryScope =
    inferMemoryScope(
      memory
    );

  const candidateCreatorId =
    cleanString(
      candidate
        ?.creatorId
    );

  const memoryCreatorId =
    getMemoryCreatorId(
      memory
    );

  if (
    candidateCreatorId &&
    memoryCreatorId &&
    candidateCreatorId !==
      memoryCreatorId
  ) {
    return false;
  }

  const candidateProjectId =
    cleanString(
      candidate
        ?.projectId
    );

  const memoryProjectIds =
    getMemoryProjectIds(
      memory
    );

  if (
    candidateScope ===
      MEMORY_SCOPES
        .PROJECT
  ) {
    if (
      !candidateProjectId
    ) {
      return false;
    }

    if (
      memoryScope !==
        MEMORY_SCOPES
          .PROJECT
    ) {
      return false;
    }

    if (
      !memoryProjectIds
        .includes(
          candidateProjectId
        )
    ) {
      return false;
    }
  } else if (
    memoryScope ===
      MEMORY_SCOPES
        .PROJECT
  ) {
    return false;
  }

  if (
    candidateScope ===
      MEMORY_SCOPES
        .SESSION
  ) {
    const candidateSessionId =
      cleanString(
        candidate
          ?.sessionId
      );

    const memorySessionId =
      cleanString(
        memory
          ?.sessionId
      ) ||
      cleanString(
        memory
          ?.metadata
          ?.sessionId
      );

    if (
      !candidateSessionId
    ) {
      return false;
    }

    if (
      memorySessionId &&
      memorySessionId !==
        candidateSessionId
    ) {
      return false;
    }
  }

  const candidateEntityId =
    cleanString(
      candidate
        ?.entityId
    );

  const memoryEntityId =
    cleanString(
      memory
        ?.entityId
    ) ||
    cleanString(
      memory
        ?.metadata
        ?.entityId
    );

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
    .filter(
      Boolean
    )
    .join(" ");

  if (
    !normaliseText(
      candidateText
    )
  ) {
    return [];
  }

  return existingMemories
    .filter(
      (memory) =>
        memoryScopeCompatible(
          candidate,
          memory
        )
    )
    .map(
      (memory) => {
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
          .filter(
            Boolean
          )
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
          (
            memory
              .memoryKey ===
              candidate
                .memoryKey ||
            memory
              .metadata
              ?.memoryKey ===
              candidate
                .memoryKey
          )
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
      }
    )
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
    relatedMemories
      .length ===
      0
  ) {
    return {
      relationship:
        "new",

      relatedMemory:
        null,

      confidence:
        0.6,
    };
  }

  const strongest =
    relatedMemories[0];

  const oldValue =
    strongest
      .memory
      ?.value ??
    strongest
      .memory
      ?.metadata
      ?.value ??
    strongest
      .memory
      ?.content ??
    strongest
      .memory
      ?.text ??
    "";

  const newValue =
    candidate
      .value ??
    candidate
      .content ??
    "";

  const oldSerialised =
    serialiseMemoryValue(
      oldValue
    );

  const newSerialised =
    serialiseMemoryValue(
      newValue
    );

  if (
    oldSerialised &&
    oldSerialised ===
      newSerialised
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
    temporaryState
      .value
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

  /**
   * Automatic supersession remains creator-only.
   *
   * Specialist agents may detect contradiction but cannot declare
   * the creator's approved truth obsolete.
   */
  if (
    correctionSignal
      .value &&
    candidate.source ===
      MEMORY_SOURCES
        .CREATOR &&
    strongest
      .similarity >=
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
    strongest
      .similarity >=
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
          strongest
            .similarity *
          0.24
      ),
  };
}

function chooseMemoryAction({
  candidate,
  relationship,
}) {
  if (
    !candidate
  ) {
    return (
      MEMORY_ACTIONS
        .IGNORE
    );
  }

  if (
    candidate.category ===
      MEMORY_CATEGORIES
        .UNKNOWN
  ) {
    return (
      MEMORY_ACTIONS
        .HOLD_FOR_MORE_EVIDENCE
    );
  }

  if (
    candidate.category ===
      MEMORY_CATEGORIES
        .DEFERRED_TOPIC
  ) {
    return (
      MEMORY_ACTIONS
        .SAVE_DEFERRED_TOPIC
    );
  }

  if (
    candidate.category ===
      MEMORY_CATEGORIES
        .SESSION_HANDOFF
  ) {
    return (
      candidate.projectId
        ? MEMORY_ACTIONS
            .SAVE_SESSION_HANDOFF
        : MEMORY_ACTIONS
            .IGNORE
    );
  }

  if (
    relationship
      .relationship ===
      "reinforcement"
  ) {
    return (
      MEMORY_ACTIONS
        .REINFORCE_MEMORY
    );
  }

  if (
    relationship
      .relationship ===
      "confirmed-evolution"
  ) {
    return (
      MEMORY_ACTIONS
        .SUPERSEDE_MEMORY
    );
  }

  if (
    [
      "possible-conflict",
      "temporary-override",
    ].includes(
      relationship
        .relationship
    )
  ) {
    return (
      MEMORY_ACTIONS
        .CAPTURE_OBSERVATION
    );
  }

  if (
    PROFILE_MEMORY_CATEGORIES
      .includes(
        candidate.category
      )
  ) {
    if (
      candidate.scope ===
        MEMORY_SCOPES
          .CREATOR &&
      candidate.horizon ===
        MEMORY_HORIZONS
          .LONG_TERM &&
      candidate.confidence >=
        0.78
    ) {
      return (
        MEMORY_ACTIONS
          .UPDATE_PROFILE
      );
    }

    return (
      MEMORY_ACTIONS
        .CAPTURE_OBSERVATION
    );
  }

  if (
    PROJECT_MEMORY_CATEGORIES
      .includes(
        candidate.category
      )
  ) {
    if (
      !candidate.projectId
    ) {
      return (
        MEMORY_ACTIONS
          .IGNORE
      );
    }

    return (
      candidate.confidence >=
        0.6
        ? MEMORY_ACTIONS
            .SAVE_PROJECT_MEMORY
        : MEMORY_ACTIONS
            .HOLD_FOR_MORE_EVIDENCE
    );
  }

  if (
    candidate.confidence >=
    0.82
  ) {
    return (
      MEMORY_ACTIONS
        .SAVE_PATTERN
    );
  }

  if (
    candidate.confidence >=
    0.58
  ) {
    return (
      MEMORY_ACTIONS
        .CAPTURE_OBSERVATION
    );
  }

  return (
    MEMORY_ACTIONS
      .HOLD_FOR_MORE_EVIDENCE
  );
}

/**
 * ------------------------------------------------------------
 * Persistence instruction creation
 * ------------------------------------------------------------
 */

function createProfileUpdatePayload(
  candidate
) {
  const learningRecord = {
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

    horizon:
      candidate.horizon,

    scope:
      candidate.scope,

    updatedAt:
      createTimestamp(),
  };

  const communicationPreferences =
    {};

  switch (
    candidate.value
  ) {
    case "concise-during-build":
      communicationPreferences
        .conciseGuidance =
        true;
      break;

    case "one-step-at-a-time":
      communicationPreferences
        .oneQuestionAtATime =
        true;
      break;

    case "lead-when-requested":
      communicationPreferences
        .preferredGuidanceStyle =
        "lead-when-requested";
      break;

    case "space-before-response":
      communicationPreferences
        .preferredCommunicationPace =
        "measured";
      break;

    case "detailed-during-exploration":
      communicationPreferences
        .preferredResponseDepth =
        "detailed";
      break;

    default:
      break;
  }

  return {
    communicationPreferences,

    mentorLearning:
      learningRecord,
  };
}

function createStorageInstruction({
  candidate,
  action,
  relationship,
}) {
  if (
    !candidate ||
    action ===
      MEMORY_ACTIONS
        .IGNORE
  ) {
    return null;
  }

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

    entityName:
      candidate.entityName,

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

      action:
        "update-creator-profile",

      targetMethod:
        "updateCreatorProfile",

      payload:
        createProfileUpdatePayload(
          candidate
        ),

      persistenceContract:
        "creator-profile-v2",
    };
  }

  if (
    action ===
      MEMORY_ACTIONS
        .SAVE_PATTERN
  ) {
    return {
      ...common,

      action:
        "save-pattern",

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

        source:
          candidate.source,

        certainty:
          candidate.certainty,

        memoryKey:
          candidate.memoryKey,

        projectId:
          candidate.projectId,

        scope:
          candidate.scope,

        metadata: {
          horizon:
            candidate.horizon,

          importance:
            candidate.importance,

          value:
            candidate.value,

          memoryKey:
            candidate.memoryKey,

          creatorId:
            candidate.creatorId,

          projectId:
            candidate.projectId,

          sessionId:
            candidate.sessionId,

          source:
            candidate.source,
        },
      },

      persistenceContract:
        "memory-pattern-v2",
    };
  }

  if (
    [
      MEMORY_ACTIONS
        .CAPTURE_OBSERVATION,

      MEMORY_ACTIONS
        .HOLD_FOR_MORE_EVIDENCE,
    ].includes(
      action
    )
  ) {
    return {
      ...common,

      action:
        "capture-observation",

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

        importance:
          candidate.importance,

        status:
          "emerging",

        permissionToReflect:
          false,

        source:
          candidate.source,

        certainty:
          candidate.certainty,

        memoryKey:
          candidate.memoryKey,

        projectId:
          candidate.projectId,

        scope:
          candidate.scope,

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

          entityName:
            candidate.entityName,

          source:
            candidate.source,

          holdForMoreEvidence:
            action ===
            MEMORY_ACTIONS
              .HOLD_FOR_MORE_EVIDENCE,
        },
      },

      persistenceContract:
        "memory-observation-v2",
    };
  }

  if (
    action ===
      MEMORY_ACTIONS
        .SAVE_DEFERRED_TOPIC
  ) {
    return {
      ...common,

      action:
        "save-deferred-memory",

      targetMethod:
        "saveDeferredMemory",

      payload: {
        title:
          candidate.title,

        content:
          candidate.content,

        category:
          candidate.category,

        reason:
          "Deferred to protect the creator's current flow.",

        source:
          candidate.source,

        certainty:
          candidate.certainty,

        confidence:
          candidate.confidence,

        importance:
          candidate.importance,

        relatedProjectIds:
          candidate.projectId
            ? [
                candidate.projectId,
              ]
            : [],

        relatedIdeaIds:
          [],

        triggerTerms:
          uniqueValues([
            ...candidate.tags,

            candidate.entityName,

            candidate.category,
          ]),

        tags:
          uniqueValues([
            "deferred-topic",

            candidate.category,

            ...candidate.tags,
          ]),

        memoryKey:
          candidate.memoryKey,

        metadata: {
          ...cloneValue(
            candidate.metadata ||
            {}
          ),

          memoryKey:
            candidate.memoryKey,

          creatorId:
            candidate.creatorId,

          scope:
            candidate.scope,

          horizon:
            candidate.horizon,

          projectId:
            candidate.projectId,

          sessionId:
            candidate.sessionId,

          recallTiming:
            RECALL_TIMINGS
              .NEXT_RELEVANT_MOMENT,

          capturedAt:
            createTimestamp(),
        },
      },

      persistenceContract:
        "deferred-memory-v2",
    };
  }

  if (
    action ===
      MEMORY_ACTIONS
        .SAVE_PROJECT_MEMORY
  ) {
    return {
      ...common,

      action:
        "save-project-memory",

      targetMethod:
        "saveProjectMemory",

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

        metadata: {
          ...cloneValue(
            candidate.metadata ||
            {}
          ),

          creatorId:
            candidate.creatorId,

          relationship:
            relationship
              .relationship,

          relatedMemoryId:
            relationship
              .relatedMemory
              ?.id ||
            null,
        },
      },

      persistenceContract:
        "project-memory-v2",
    };
  }

  if (
    action ===
      MEMORY_ACTIONS
        .SAVE_SESSION_HANDOFF
  ) {
    return {
      ...common,

      action:
        "save-session-handoff",

      targetMethod:
        "saveSessionHandoff",

      preferredTargetMethod:
        "saveSessionHandoff",

      payload:
        cloneValue(
          candidate
        ),

      persistenceContract:
        "session-handoff-v2",
    };
  }

  if (
    action ===
      MEMORY_ACTIONS
        .REINFORCE_MEMORY
  ) {
    return {
      ...common,

      action:
        "reinforce-memory",

      targetMethod:
        "reinforceMemory",

      preferredTargetMethod:
        "reinforceMemory",

      payload: {
        memoryId:
          relationship
            .relatedMemory
            ?.id ||
          null,

        memoryKey:
          relationship
            .relatedMemory
            ?.memoryKey ||
          relationship
            .relatedMemory
            ?.metadata
            ?.memoryKey ||
          candidate
            .memoryKey,

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
          relationship
            .relationship,
      },

      persistenceContract:
        "memory-reinforcement-v2",
    };
  }

  if (
    action ===
      MEMORY_ACTIONS
        .SUPERSEDE_MEMORY
  ) {
    return {
      ...common,

      action:
        "supersede-memory",

      targetMethod:
        "supersedeMemory",

      preferredTargetMethod:
        "supersedeMemory",

      payload: {
        memoryId:
          relationship
            .relatedMemory
            ?.id ||
          null,

        memoryKey:
          relationship
            .relatedMemory
            ?.memoryKey ||
          relationship
            .relatedMemory
            ?.metadata
            ?.memoryKey ||
          null,

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
          relationship
            .relationship,
      },

      persistenceContract:
        "memory-supersession-v2",
    };
  }

  return null;
}

function validateStorageInstruction({
  instruction,
  context,
}) {
  if (
    !instruction ||
    typeof instruction !==
      "object"
  ) {
    return {
      valid:
        false,

      reason:
        "invalid-instruction",
    };
  }

  const creatorId =
    cleanString(
      instruction
        ?.creatorId ||
      instruction
        ?.payload
        ?.creatorId ||
      instruction
        ?.payload
        ?.metadata
        ?.creatorId
    );

  const activeCreatorId =
    getCreatorId(
      context
    );

  if (
    activeCreatorId &&
    creatorId &&
    activeCreatorId !==
      creatorId
  ) {
    return {
      valid:
        false,

      reason:
        "creator-boundary-mismatch",
    };
  }

  const scope =
    cleanString(
      instruction
        ?.scope ||
      instruction
        ?.payload
        ?.scope
    );

  const projectId =
    cleanString(
      instruction
        ?.projectId ||
      instruction
        ?.payload
        ?.projectId ||
      instruction
        ?.payload
        ?.metadata
        ?.projectId
    );

  const activeProjectId =
    getProjectId(
      context
    );

  if (
    scope ===
      MEMORY_SCOPES
        .PROJECT
  ) {
    if (
      !projectId
    ) {
      return {
        valid:
          false,

        reason:
          "project-boundary-required",
      };
    }

    if (
      activeProjectId &&
      activeProjectId !==
        projectId
    ) {
      return {
        valid:
          false,

        reason:
          "project-boundary-mismatch",
      };
    }
  }

  if (
    scope ===
      MEMORY_SCOPES
        .SESSION
  ) {
    const sessionId =
      cleanString(
        instruction
          ?.sessionId ||
        instruction
          ?.payload
          ?.sessionId ||
        instruction
          ?.payload
          ?.metadata
          ?.sessionId
      );

    if (
      !sessionId
    ) {
      return {
        valid:
          false,

        reason:
          "session-boundary-required",
      };
    }
  }

  return {
    valid:
      true,

    reason:
      null,
  };
}

/**
 * ------------------------------------------------------------
 * Forget planning
 * ------------------------------------------------------------
 */

function extractForgetTarget(
  message
) {
  const text =
    cleanString(
      message
    );

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

    if (
      match
    ) {
      return cleanString(
        match[1]
      );
    }
  }

  return "";
}

function getMemoryText(
  memory
) {
  const metadataValue =
    typeof memory
      ?.metadata
      ?.value ===
      "string"
      ? memory
          .metadata
          .value
      : "";

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
    metadataValue,
  ]
    .filter(
      Boolean
    )
    .join(" ");
}

function findForgetMatches(
  targetText,
  existingMemories
) {
  const normalisedTarget =
    normaliseText(
      targetText
    );

  if (
    !normalisedTarget
  ) {
    return [];
  }

  return existingMemories
    .map(
      (memory) => {
        const memoryText =
          normaliseText(
            getMemoryText(
              memory
            )
          );

        const exactish =
          memoryText ===
            normalisedTarget ||
          memoryText.includes(
            normalisedTarget
          ) ||
          normalisedTarget.includes(
            memoryText
          );

        const similarity =
          calculateTextSimilarity(
            targetText,
            memoryText
          );

        return {
          memory,

          similarity:
            exactish
              ? Math.max(
                  0.95,
                  similarity
                )
              : similarity,

          exactish,
        };
      }
    )
    .filter(
      (item) =>
        item.exactish ||
        item.similarity >=
          0.72
    )
    .sort(
      (a, b) =>
        b.similarity -
        a.similarity
    );
}

function planForgetRequest({
  message,
  context,
  existingMemories,
  explicitMemoryIntent,
}) {
  if (
    explicitMemoryIntent
      .value !==
      "forget-existing"
  ) {
    return {
      requested:
        false,

      targetText:
        "",

      matchedMemories:
        [],

      unresolvedTargetIds:
        [],

      requiresClarification:
        false,

      instructions:
        [],
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

  let unresolvedTargetIds =
    [];

  if (
    explicitIds.length >
    0
  ) {
    matchedMemories =
      existingMemories
        .filter(
          (memory) =>
            explicitIds.includes(
              memory?.id
            )
        );

    unresolvedTargetIds =
      explicitIds
        .filter(
          (id) =>
            !matchedMemories
              .some(
                (memory) =>
                  memory?.id ===
                  id
              )
        );
  } else if (
    targetText
  ) {
    matchedMemories =
      findForgetMatches(
        targetText,
        existingMemories
      ).map(
        (item) =>
          item.memory
      );
  }

  const requiresClarification =
    explicitIds.length >
      0
      ? (
          matchedMemories
            .length ===
            0 ||
          unresolvedTargetIds
            .length >
            0
        )
      : (
          !targetText ||
          matchedMemories
            .length !==
            1
        );

  const instructions =
    requiresClarification
      ? []
      : matchedMemories
          .map(
            (memory) => ({
              action:
                "forget-memory",

              category:
                MEMORY_ACTIONS
                  .FORGET_MEMORY,

              targetMethod:
                "forgetMemory",

              preferredTargetMethod:
                "forgetMemory",

              memoryId:
                memory
                  ?.id ||
                null,

              creatorId:
                getMemoryCreatorId(
                  memory
                ),

              projectId:
                getMemoryProjectIds(
                  memory
                )[0] ||
                null,

              scope:
                inferMemoryScope(
                  memory
                ),

              payload: {
                memoryId:
                  memory
                    ?.id ||
                  null,

                memoryKey:
                  memory
                    ?.memoryKey ||
                  memory
                    ?.metadata
                    ?.memoryKey ||
                  null,
              },

              destructive:
                true,

              explicitCreatorRequest:
                true,

              persistenceContract:
                "memory-forget-v2",
            })
          );

  return {
    requested:
      true,

    targetText,

    matchedMemories:
      cloneValue(
        matchedMemories
      ),

    unresolvedTargetIds,

    requiresClarification,

    instructions,
  };
}

/**
 * ------------------------------------------------------------
 * Recall planning
 * ------------------------------------------------------------
 */

function isRecallEligible(
  memory,
  context
) {
  if (
    !memory
  ) {
    return false;
  }

  const status =
    memory
      ?.status;

  const lifecycleStatus =
    memory
      ?.lifecycleStatus;

  const blockedStatuses = [
    MEMORY_STATUSES
      .REJECTED,

    MEMORY_STATUSES
      .ARCHIVED,

    MEMORY_STATUSES
      .DISMISSED,

    MEMORY_STATUSES
      .RESOLVED,

    "dismissed",
    "archived",
    "rejected",
    "resolved",
    "resumed",
  ];

  if (
    blockedStatuses
      .includes(
        status
      ) ||
    blockedStatuses
      .includes(
        lifecycleStatus
      )
  ) {
    return false;
  }

  const historicalStatuses = [
    MEMORY_STATUSES
      .SUPERSEDED,

    MEMORY_STATUSES
      .HISTORICAL,
  ];

  if (
    (
      historicalStatuses
        .includes(
          status
        ) ||
      historicalStatuses
        .includes(
          lifecycleStatus
        )
    ) &&
    !context
      ?.includeHistoricalRecall
  ) {
    return false;
  }

  if (
    memory
      ?.recallPolicy
      ?.automatic ===
      false ||
    memory
      ?.metadata
      ?.recallTiming ===
      RECALL_TIMINGS
        .NEVER_AUTOMATICALLY
  ) {
    return false;
  }

  const currentCreatorId =
    getCreatorId(
      context
    );

  const memoryCreatorId =
    getMemoryCreatorId(
      memory
    );

  if (
    currentCreatorId &&
    memoryCreatorId &&
    currentCreatorId !==
      memoryCreatorId
  ) {
    return false;
  }

  const activeProjectId =
    getProjectId(
      context
    );

  const projectIds =
    getMemoryProjectIds(
      memory
    );

  const memoryScope =
    inferMemoryScope(
      memory
    );

  if (
    memoryScope ===
      MEMORY_SCOPES
        .PROJECT
  ) {
    if (
      !activeProjectId
    ) {
      return false;
    }

    if (
      projectIds.length ===
        0 ||
      !projectIds.includes(
        activeProjectId
      )
    ) {
      return false;
    }
  }

  if (
    memoryScope ===
      MEMORY_SCOPES
        .SESSION
  ) {
    const currentSessionId =
      cleanString(
        context
          ?.sessionId
      );

    const memorySessionId =
      cleanString(
        memory
          ?.sessionId
      ) ||
      cleanString(
        memory
          ?.metadata
          ?.sessionId
      );

    if (
      !currentSessionId
    ) {
      return false;
    }

    if (
      memorySessionId &&
      memorySessionId !==
        currentSessionId
    ) {
      return false;
    }
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

    context
      ?.conversationMode,

    context
      ?.thinkingMode,

    context
      ?.projectType,

    context
      ?.activeStage,

    context
      ?.activeProject
      ?.title,

    context
      ?.activeScene
      ?.title,

    context
      ?.activeCharacter
      ?.name,

    context
      ?.activeAsset
      ?.name,
  ]
    .filter(
      Boolean
    )
    .join(" ");

  let score =
    calculateTextSimilarity(
      currentText,
      getMemoryText(
        memory
      )
    );

  const activeProjectId =
    getProjectId(
      context
    );

  if (
    activeProjectId &&
    getMemoryProjectIds(
      memory
    ).includes(
      activeProjectId
    )
  ) {
    score +=
      0.25;
  }

  if (
    (
      memory
        ?.category ===
        MEMORY_CATEGORIES
          .SESSION_HANDOFF ||
      memory
        ?.type ===
        "session-handoff"
    ) &&
    context
      ?.creatorMessageCount <=
      2
  ) {
    score +=
      0.3;
  }

  if (
    memory
      ?.category ===
      MEMORY_CATEGORIES
        .CURRENT_POSITION
  ) {
    score +=
      0.12;
  }

  if (
    [
      MEMORY_IMPORTANCE
        .HIGH,

      MEMORY_IMPORTANCE
        .CORE,

      MEMORY_IMPORTANCE
        .CRITICAL,
    ].includes(
      memory
        ?.importance
    )
  ) {
    score +=
      0.12;
  }

  if (
    [
      "flow",
      "build",
    ].includes(
      context
        ?.thinkingMode
    )
  ) {
    score -=
      0.08;
  }

  if (
    context
      ?.guidanceWindow ===
      "closed-for-now"
  ) {
    score -=
      0.22;
  }

  if (
    context
      ?.creatorExplicitlyAskedToRevisit
  ) {
    score +=
      0.35;
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
      .map(
        (memory) => ({
          memory,

          relevance:
            scoreMemoryRecall({
              memory,

              message,

              context,
            }),
        })
      )
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
      .slice(
        0,
        3
      );

  if (
    ranked.length ===
    0
  ) {
    return {
      shouldRecall:
        false,

      priority:
        RECALL_PRIORITIES
          .NONE,

      timing:
        RECALL_TIMINGS
          .NOT_NOW,

      memories:
        [],

      reason:
        "No stored memory is relevant enough to improve the current response.",
    };
  }

  const strongest =
    ranked[0];

  if (
    context
      ?.guidanceWindow ===
      "closed-for-now" ||
    (
      context
        ?.thinkingMode ===
        "flow" &&
      strongest
        .relevance <
        0.78
    )
  ) {
    return {
      shouldRecall:
        false,

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
    shouldRecall:
      true,

    priority:
      strongest
        .relevance >=
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
  let score =
    scoreMemoryRecall({
      memory,

      message,

      context,
    });

  if (
    [
      "flow",
      "build",
    ].includes(
      context
        ?.thinkingMode
    )
  ) {
    score -=
      0.14;
  }

  if (
    context
      ?.creatorExplicitlyAskedToRevisit
  ) {
    score +=
      0.25;
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
    existingMemories
      .filter(
        (memory) =>
          memory
            .category ===
            MEMORY_CATEGORIES
              .DEFERRED_TOPIC ||

          memory
            .type ===
            "deferred" ||

          memory
            .tags
            ?.includes?.(
              "deferred-topic"
            ) ||

          memory
            .metadata
            ?.recallTiming ===
            RECALL_TIMINGS
              .NEXT_RELEVANT_MOMENT
      );

  const ranked =
    deferredMemories
      .map(
        (memory) => ({
          memory,

          relevance:
            scoreDeferredRecall({
              memory,

              message,

              context,
            }),
        })
      )
      .filter(
        (item) =>
          item.relevance >
          0
      )
      .sort(
        (a, b) =>
          b.relevance -
          a.relevance
      );

  const strongest =
    ranked[0];

  if (
    !strongest ||
    strongest
      .relevance <
      0.45
  ) {
    return {
      shouldRecall:
        false,

      priority:
        RECALL_PRIORITIES
          .NONE,

      timing:
        RECALL_TIMINGS
          .NOT_NOW,

      memory:
        null,

      reason:
        "No deferred memory is sufficiently relevant.",
    };
  }

  if (
    [
      "flow",
      "build",
    ].includes(
      context
        ?.thinkingMode
    ) ||
    context
      ?.guidanceWindow ===
      "closed-for-now"
  ) {
    return {
      shouldRecall:
        false,

      priority:
        RECALL_PRIORITIES
          .MEDIUM,

      timing:
        RECALL_TIMINGS
          .NEXT_RELEVANT_MOMENT,

      memory:
        cloneValue(
          strongest
            .memory
        ),

      reason:
        "The memory is relevant, but current creative flow should not be interrupted.",
    };
  }

  return {
    shouldRecall:
      true,

    priority:
      strongest
        .relevance >=
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
        strongest
          .memory
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
      RECALL_PRIORITIES
        .HIGH,

      RECALL_PRIORITIES
        .IMMEDIATE,
    ].includes(
      deferredRecall
        .priority
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
        ? deferredRecall
            .priority
        : relevantRecall
            .priority !==
            RECALL_PRIORITIES
              .NONE
          ? relevantRecall
              .priority
          : deferredRecall
              .priority,

    timing:
      deferredWins
        ? deferredRecall
            .timing
        : relevantRecall
            .timing !==
            RECALL_TIMINGS
              .NOT_NOW
          ? relevantRecall
              .timing
          : deferredRecall
              .timing,

    memory:
      deferredRecall
        .shouldRecall
        ? deferredRecall
            .memory ||
          null
        : null,

    memories:
      relevantRecall
        .shouldRecall
        ? relevantRecall
            .memories ||
          []
        : [],

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

/**
 * ------------------------------------------------------------
 * Guidance and guard rails
 * ------------------------------------------------------------
 */

function createResponseGuidance({
  briefDetour,
  deferredTopic,
  recallPlan,
  forgetPlan,
  sensitiveMemoryContent,
  creatorIdentityConflict =
    false,
}) {
  const guidance = [
    "Memory should help the Mentor serve the creator more effectively.",

    "Treat stored conclusions as possibilities, not permanent definitions.",

    "Creator-confirmed information outranks inference.",

    "Present behaviour should override historical preference when they conflict.",

    "Project decisions should be treated as scoped project truth until the creator changes them.",

    "Never diagnose the creator.",

    "Never use memory to pressure, manipulate or shame.",

    "Do not surface a memory merely to demonstrate that it was remembered.",

    "Only recall information when it is relevant and useful.",

    "When several memories are relevant, surface only the minimum needed for continuity.",
  ];

  if (
    creatorIdentityConflict
  ) {
    guidance.push(
      "Persistent memory returned a different creator identity from the present context.",

      "Use present creator context only and do not inherit the conflicting persistent memory."
    );
  }

  if (
    sensitiveMemoryContent
      .value
  ) {
    guidance.push(
      "Do not persist the detected credential, secret, token or password as Creator Memory.",

      "Continue helping with the creator's task without echoing sensitive material unnecessarily."
    );
  }

  if (
    briefDetour
      .value
  ) {
    guidance.push(
      "Acknowledge the brief thought without opening a long discussion.",

      "Capture only what is useful.",

      "Return smoothly to the previous task.",

      "Leave the door open to revisit the subject later."
    );
  }

  if (
    deferredTopic
      .value
  ) {
    guidance.push(
      "Do not explore the deferred topic now.",

      "Store enough context to revisit it meaningfully.",

      "Remember why the subject was deferred.",

      "Do not frame deferral as avoidance or failure."
    );
  }

  if (
    recallPlan
      .shouldRecall
  ) {
    guidance.push(
      "Introduce remembered context naturally rather than announcing the memory system.",

      "Allow the creator to correct remembered project facts immediately.",

      "Allow the creator to decline a deferred topic and continue."
    );
  }

  if (
    forgetPlan
      .requested
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
        "Respect the creator's explicit forget request.",

        "Only acknowledge deletion after persistence confirms the exact target was removed.",

        "After deletion succeeds, do not recreate the deleted conclusion from inference alone."
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

    "Do not automatically supersede existing project truth merely because a related new statement differs.",

    "Creator corrections take priority over specialist-agent assumptions.",

    "Do not mix project-scoped memory across different projects.",

    "Do not mix memory across creator identities.",

    "Do not create session-scoped memory without a real session boundary.",

    "Do not delete stored memory when a forget request is ambiguous.",

    "Do not treat an adapter response as successful when one or more attempted instructions are unaccounted for.",

    "Do not claim a destructive memory action succeeded unless its result confirms the requested action.",

    "Do not claim a memory was stored unless persistence confirms success.",

    "Do not persist raw secrets, credentials, tokens, passwords, private keys or recovery phrases as creative memory.",
  ];
}

/**
 * ------------------------------------------------------------
 * Existing memory collection
 * ------------------------------------------------------------
 */

function collectExistingMemories(
  context
) {
  const combined = [
    ...asArray(
      context
        ?.existingMemories
    ),

    ...asArray(
      context
        ?.existingProjectMemories
    ),

    ...asArray(
      context
        ?.existingPatterns
    ),

    ...asArray(
      context
        ?.existingObservations
    ),

    ...asArray(
      context
        ?.deferredMemories
    ),

    ...asArray(
      context
        ?.milestones
    ),
  ];

  const currentCreatorId =
    getCreatorId(
      context
    );

  const activeProjectId =
    getProjectId(
      context
    );

  const seen =
    new Set();

  return combined
    .filter(
      (memory) => {
        const memoryCreatorId =
          getMemoryCreatorId(
            memory
          );

        if (
          currentCreatorId &&
          memoryCreatorId &&
          currentCreatorId !==
            memoryCreatorId
        ) {
          return false;
        }

        const scope =
          inferMemoryScope(
            memory
          );

        if (
          scope ===
            MEMORY_SCOPES
              .PROJECT
        ) {
          const projectIds =
            getMemoryProjectIds(
              memory
            );

          if (
            !activeProjectId ||
            !projectIds.includes(
              activeProjectId
            )
          ) {
            return false;
          }
        }

        return true;
      }
    )
    .filter(
      (memory) => {
        const key =
          memory
            ?.id ||
          memory
            ?.memoryKey ||
          memory
            ?.metadata
            ?.memoryKey;

        if (
          !key
        ) {
          return true;
        }

        if (
          seen.has(
            key
          )
        ) {
          return false;
        }

        seen.add(
          key
        );

        return true;
      }
    );
}

/**
 * ------------------------------------------------------------
 * CreatorMemory service capabilities
 * ------------------------------------------------------------
 */

function describeMemoryService(
  memory
) {
  if (
    !memory ||
    typeof memory !==
      "object"
  ) {
    return {
      connected:
        false,

      canReadContext:
        false,

      canReadState:
        false,

      canApplyInstruction:
        false,

      canApplyInstructions:
        false,

      canPersistProjectMemory:
        false,

      canPersistSessionHandoff:
        false,

      canReinforceMemory:
        false,

      canSupersedeMemory:
        false,

      canArchiveMemory:
        false,

      canResolveThread:
        false,

      canForgetMemory:
        false,

      preferredExecutionPath:
        null,
    };
  }

  const canApplyInstructions =
    typeof memory
      .applyMemoryInstructions ===
      "function";

  const canApplyInstruction =
    typeof memory
      .applyMemoryInstruction ===
      "function";

  return {
    connected:
      true,

    canReadContext:
      typeof memory
        .getMemoryContext ===
        "function",

    canReadState:
      typeof memory
        .getState ===
        "function",

    canApplyInstruction,

    canApplyInstructions,

    canPersistProjectMemory:
      typeof memory
        .saveProjectMemory ===
        "function",

    canPersistSessionHandoff:
      typeof memory
        .saveSessionHandoff ===
        "function",

    canReinforceMemory:
      typeof memory
        .reinforceMemory ===
        "function",

    canSupersedeMemory:
      typeof memory
        .supersedeMemory ===
        "function",

    canArchiveMemory:
      typeof memory
        .archiveMemory ===
        "function",

    canResolveThread:
      typeof memory
        .resolveThread ===
        "function",

    canForgetMemory:
      typeof memory
        .forgetMemory ===
        "function",

    preferredExecutionPath:
      canApplyInstructions
        ? "applyMemoryInstructions"
        : canApplyInstruction
          ? "applyMemoryInstruction"
          : "direct-method-fallback",
  };
}

function readConnectedMemoryContext(
  memory,
  context = {}
) {
  if (
    !memory ||
    typeof memory
      .getMemoryContext !==
      "function"
  ) {
    return null;
  }

  const projectId =
    getProjectId(
      context
    );

  try {
    return memory
      .getMemoryContext(
        projectId
          ? {
              projectId,
            }
          : {}
      );
  } catch (error) {
    console.warn(
      "CreatorMemoryEngine could not read CreatorMemory context:",
      error
    );

    return null;
  }
}

/**
 * ------------------------------------------------------------
 * Persistence execution contract
 * ------------------------------------------------------------
 */

function getInstructionFingerprint(
  instruction
) {
  if (
    !instruction
  ) {
    return "";
  }

  return [
    cleanString(
      instruction
        ?.candidateId
    ),

    cleanString(
      instruction
        ?.action
    ),

    cleanString(
      instruction
        ?.targetMethod
    ),

    cleanString(
      instruction
        ?.memoryId ||
      instruction
        ?.payload
        ?.memoryId
    ),

    cleanString(
      instruction
        ?.memoryKey ||
      instruction
        ?.payload
        ?.memoryKey
    ),

    cleanString(
      instruction
        ?.projectId ||
      instruction
        ?.payload
        ?.projectId
    ),
  ].join(
    "::"
  );
}

function createEmptyPersistenceResult({
  executionPath =
    null,

  reason =
    "No memory instructions required execution.",
} = {}) {
  return {
    applied:
      [],

    skipped:
      [],

    errors:
      [],

    attemptedCount:
      0,

    appliedCount:
      0,

    skippedCount:
      0,

    errorCount:
      0,

    accountedCount:
      0,

    unaccountedCount:
      0,

    successful:
      true,

    fullySuccessful:
      true,

    partiallySuccessful:
      false,

    failed:
      false,

    noOp:
      true,

    status:
      PERSISTENCE_STATUSES
        .EMPTY,

    executionPath,

    reason,
  };
}

function createUnavailablePersistenceResult({
  instructions = [],
  reason,
  executionPath = null,
}) {
  const safeInstructions =
    asArray(
      instructions
    );

  const skipped =
    safeInstructions
      .map(
        (instruction) => ({
          instruction:
            cloneValue(
              instruction
            ),

          reason,
        })
      );

  return {
    applied:
      [],

    skipped,

    errors:
      [],

    attemptedCount:
      safeInstructions
        .length,

    appliedCount:
      0,

    skippedCount:
      skipped.length,

    errorCount:
      0,

    accountedCount:
      skipped.length,

    unaccountedCount:
      0,

    successful:
      false,

    fullySuccessful:
      false,

    partiallySuccessful:
      false,

    failed:
      false,

    noOp:
      safeInstructions
        .length >
        0,

    status:
      safeInstructions
        .length ===
        0
        ? PERSISTENCE_STATUSES
            .EMPTY
        : PERSISTENCE_STATUSES
            .NO_OP,

    executionPath,

    reason,
  };
}

function getReportedInstruction(
  record
) {
  return (
    record
      ?.instruction ||
    null
  );
}

function reconcilePersistenceResult({
  instructions,
  applied = [],
  skipped = [],
  errors = [],
  executionPath = null,
  adapterStatus = null,
  adapterReason = null,
}) {
  const safeInstructions =
    asArray(
      instructions
    );

  if (
    safeInstructions
      .length ===
      0
  ) {
    return createEmptyPersistenceResult({
      executionPath,

      reason:
        adapterReason ||
        "No memory instructions required execution.",
    });
  }

  const resolvedApplied =
    cloneValue(
      asArray(
        applied
      )
    );

  const resolvedSkipped =
    cloneValue(
      asArray(
        skipped
      )
    );

  const resolvedErrors =
    cloneValue(
      asArray(
        errors
      )
    );

  /**
   * Build a multiset of reported instructions.
   *
   * This prevents duplicate-looking instructions from allowing an
   * adapter to under-report execution while still appearing complete.
   */
  const reportedCounts =
    new Map();

  [
    ...resolvedApplied,
    ...resolvedSkipped,
    ...resolvedErrors,
  ].forEach(
    (record) => {
      const instruction =
        getReportedInstruction(
          record
        );

      const fingerprint =
        getInstructionFingerprint(
          instruction
        );

      if (
        !fingerprint
      ) {
        return;
      }

      reportedCounts.set(
        fingerprint,
        (
          reportedCounts.get(
            fingerprint
          ) ||
          0
        ) + 1
      );
    }
  );

  safeInstructions
    .forEach(
      (instruction) => {
        const fingerprint =
          getInstructionFingerprint(
            instruction
          );

        const availableCount =
          reportedCounts.get(
            fingerprint
          ) ||
          0;

        if (
          availableCount >
          0
        ) {
          reportedCounts.set(
            fingerprint,
            availableCount -
              1
          );

          return;
        }

        resolvedSkipped.push({
          instruction:
            cloneValue(
              instruction
            ),

          reason:
            "Persistence adapter did not report an outcome for this instruction.",

          unreportedByAdapter:
            true,
        });
      }
    );

  const attemptedCount =
    safeInstructions
      .length;

  const appliedCount =
    resolvedApplied
      .length;

  const skippedCount =
    resolvedSkipped
      .length;

  const errorCount =
    resolvedErrors
      .length;

  const accountedCount =
    Math.min(
      attemptedCount,
      appliedCount +
        skippedCount +
        errorCount
    );

  const unaccountedCount =
    Math.max(
      0,
      attemptedCount -
        accountedCount
    );

  const fullySuccessful =
    attemptedCount >
      0 &&
    appliedCount ===
      attemptedCount &&
    skippedCount ===
      0 &&
    errorCount ===
      0 &&
    unaccountedCount ===
      0;

  const partiallySuccessful =
    appliedCount >
      0 &&
    !fullySuccessful;

  const failed =
    appliedCount ===
      0 &&
    errorCount >
      0;

  const noOp =
    appliedCount ===
      0 &&
    errorCount ===
      0;

  const successful =
    fullySuccessful ||
    partiallySuccessful;

  let status =
    PERSISTENCE_STATUSES
      .NO_OP;

  if (
    fullySuccessful
  ) {
    status =
      PERSISTENCE_STATUSES
        .FULLY_SUCCESSFUL;
  } else if (
    partiallySuccessful
  ) {
    status =
      PERSISTENCE_STATUSES
        .PARTIALLY_SUCCESSFUL;
  } else if (
    failed
  ) {
    status =
      PERSISTENCE_STATUSES
        .FAILED;
  }

  return {
    applied:
      resolvedApplied,

    skipped:
      resolvedSkipped,

    errors:
      resolvedErrors,

    attemptedCount,

    appliedCount,

    skippedCount,

    errorCount,

    accountedCount,

    unaccountedCount,

    successful,

    fullySuccessful,

    partiallySuccessful,

    failed,

    noOp,

    status,

    adapterStatus:
      adapterStatus ||
      null,

    executionPath,

    reason:
      adapterReason ||
      null,
  };
}

function didPersistenceMethodApply(
  instruction,
  result
) {
  if (
    result ===
      null ||
    result ===
      false ||
    result ===
      undefined
  ) {
    return false;
  }

  const isForget =
    instruction
      ?.targetMethod ===
      "forgetMemory" ||
    instruction
      ?.action ===
      "forget-memory";

  if (
    isForget
  ) {
    if (
      result
        ?.forgotten !==
        true
    ) {
      return false;
    }

    const requestedId =
      cleanString(
        instruction
          ?.memoryId ||
        instruction
          ?.payload
          ?.memoryId
      );

    const returnedId =
      cleanString(
        result
          ?.memoryId
      );

    if (
      requestedId &&
      returnedId &&
      requestedId !==
        returnedId
    ) {
      return false;
    }

    return true;
  }

  if (
    instruction
      ?.targetMethod ===
      "supersedeMemory" ||
    instruction
      ?.action ===
      "supersede-memory"
  ) {
    if (
      result
        ?.reason ===
        "existing-truth-has-higher-authority"
    ) {
      return false;
    }

    if (
      result
        ?.replacement &&
      result
        ?.superseded
    ) {
      return true;
    }
  }

  if (
    typeof result
      ?.applied ===
      "boolean"
  ) {
    return result
      .applied;
  }

  return true;
}

/**
 * ------------------------------------------------------------
 * Fallback plan
 * ------------------------------------------------------------
 */

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
        cleanString(
          message
        ),
    },

    detections:
      {},

    candidates:
      [],

    instructions:
      [],

    forget: {
      requested:
        false,

      targetText:
        "",

      matchedMemories:
        [],

      unresolvedTargetIds:
        [],

      requiresClarification:
        false,

      instructions:
        [],
    },

    recall: {
      shouldRecall:
        false,

      priority:
        RECALL_PRIORITIES
          .NONE,

      timing:
        RECALL_TIMINGS
          .NOT_NOW,

      memory:
        null,

      memories:
        [],

      deferred:
        null,

      relevant:
        null,

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

    persistence:
      describeMemoryService(
        null
      ),

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
              error instanceof
                Error
                ? error.message
                : String(
                    error
                  ),
          }
        : null,

    createdAt:
      createTimestamp(),
  };
}

/**
 * ------------------------------------------------------------
 * Creator Memory Engine
 * ------------------------------------------------------------
 */

function createCreatorMemoryEngine({
  memory = null,
} = {}) {
  let activeMemory =
    memory ||
    null;

  function resolvePlanningContext(
    context = {}
  ) {
    const memoryContext =
      readConnectedMemoryContext(
        activeMemory,
        context
      );

    return mergeMemoryContext({
      context,

      memoryContext,
    });
  }

  function planMemory({
    message = "",
    context = {},
  } = {}) {
    try {
      const combinedContext =
        resolvePlanningContext(
          context
        );

      const explicitMemoryIntent =
        detectExplicitMemoryIntent({
          message,

          context:
            combinedContext,
        });

      const sensitiveMemoryContent =
        detectSensitiveMemoryContent(
          message
        );

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
        sensitiveMemoryContent,
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

      const existingMemories =
        collectExistingMemories(
          combinedContext
        );

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
        candidates
          .map(
            (candidate) => {
              const boundary =
                validateCandidateBoundary({
                  candidate,

                  context:
                    combinedContext,
                });

              if (
                !boundary.valid
              ) {
                return {
                  candidate,

                  relatedMemories:
                    [],

                  relationship: {
                    relationship:
                      "invalid-boundary",

                    relatedMemory:
                      null,

                    confidence:
                      1,
                  },

                  action:
                    MEMORY_ACTIONS
                      .IGNORE,

                  instruction:
                    null,

                  boundary,
                };
              }

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

                boundary,
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

      const candidateInstructions =
        analysedCandidates
          .map(
            (item) =>
              item.instruction
          )
          .filter(
            Boolean
          );

      const allInstructions = [
        ...candidateInstructions,

        ...forgetPlan
          .instructions,
      ];

      const validatedInstructions =
        [];

      const rejectedInstructions =
        [];

      allInstructions
        .forEach(
          (instruction) => {
            const validation =
              validateStorageInstruction({
                instruction,

                context:
                  combinedContext,
              });

            if (
              validation.valid
            ) {
              validatedInstructions
                .push(
                  instruction
                );
            } else {
              rejectedInstructions
                .push({
                  instruction:
                    cloneValue(
                      instruction
                    ),

                  reason:
                    validation
                      .reason,
                });
            }
          }
        );

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

        instructions:
          cloneValue(
            validatedInstructions
          ),

        rejectedInstructions:
          cloneValue(
            rejectedInstructions
          ),

        forget:
          cloneValue(
            forgetPlan
          ),

        recall:
          cloneValue(
            recallPlan
          ),

        persistence:
          describeMemoryService(
            activeMemory
          ),

        memoryPrinciples: {
          protectTheCreator:
            true,

          memoryServesCreation:
            true,

          memoryServesCreatorAndMentor:
            true,

          presentBehaviourLeads:
            true,

          longTermMemoryInforms:
            true,

          creatorConfirmedTruthOutranksInference:
            true,

          creatorIdentityIsScoped:
            true,

          projectMemoryIsScoped:
            true,

          sessionMemoryIsScoped:
            true,

          entityMemoryIsScoped:
            true,

          projectTruthMayEvolve:
            true,

          creatorCorrectionsOverrideMemory:
            true,

          specialistAgentsShareMemory:
            true,

          specialistAgentsDoNotOwnTruth:
            true,

          unknownAgentSignalsRemainEvidence:
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

          resolvedMemoryShouldNotAutomaticallyRecall:
            true,

          deferredTopicsRemainOptional:
            true,

          explicitForgetRequestsAreRespected:
            true,

          ambiguousDeletionRequiresClarification:
            true,

          destructivePersistenceRequiresVerification:
            true,

          persistenceMustAccountForEveryInstruction:
            true,

          emptyPersistencePlanIsValid:
            true,

          memoryMustProtectAutonomy:
            true,

          secretsAreNeverCreativeMemory:
            true,

          complexityRemainsBehindConversation:
            true,
        },

        responseGuidance:
          createResponseGuidance({
            briefDetour,

            deferredTopic,

            recallPlan,

            forgetPlan,

            sensitiveMemoryContent,

            creatorIdentityConflict:
              Boolean(
                combinedContext
                  ?.creatorIdentityConflict
              ),
          }),

        guardRails:
          createGuardRails(),

        contextSnapshot:
          cloneValue(
            combinedContext
          ),

        status:
          rejectedInstructions
            .length >
            0 &&
          validatedInstructions
            .length ===
            0
            ? "planned-with-boundary-rejections"
            : "planned",

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
    try {
      const combinedContext =
        resolvePlanningContext(
          context
        );

      const existingMemories =
        collectExistingMemories(
          combinedContext
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

      return createCombinedRecallPlan({
        deferredRecall,

        relevantRecall,
      });
    } catch (error) {
      return {
        shouldRecall:
          false,

        priority:
          RECALL_PRIORITIES
            .NONE,

        timing:
          RECALL_TIMINGS
            .NOT_NOW,

        memory:
          null,

        memories:
          [],

        deferred:
          null,

        relevant:
          null,

        reason:
          "Memory recall planning was unavailable.",

        error:
          error instanceof
            Error
            ? error.message
            : String(
                error
              ),
      };
    }
  }

  function planSessionHandoff({
    handoff = {},
    context = {},
  } = {}) {
    try {
      const combinedContext =
        resolvePlanningContext({
          ...cloneValue(
            context
          ),

          captureSessionHandoff:
            true,

          sessionHandoff:
            cloneValue(
              handoff
            ),
        });

      const candidate =
        createSessionHandoffCandidate({
          handoff,

          context:
            combinedContext,
        });

      if (
        !candidate
      ) {
        return {
          id:
            createMemoryPlanId(
              "handoff-plan"
            ),

          engine:
            "creator-memory-engine",

          version:
            CREATOR_MEMORY_ENGINE_VERSION,

          candidates:
            [],

          instructions:
            [],

          persistence:
            describeMemoryService(
              activeMemory
            ),

          status:
            "empty",

          reason:
            getProjectId(
              combinedContext
            )
              ? "No valid handoff content was supplied."
              : "A project id is required for a session handoff.",

          createdAt:
            createTimestamp(),
        };
      }

      const boundary =
        validateCandidateBoundary({
          candidate,

          context:
            combinedContext,
        });

      if (
        !boundary.valid
      ) {
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

              boundary,

              action:
                MEMORY_ACTIONS
                  .IGNORE,

              instruction:
                null,
            },
          ],

          instructions:
            [],

          persistence:
            describeMemoryService(
              activeMemory
            ),

          status:
            "rejected",

          reason:
            boundary.reason,

          createdAt:
            createTimestamp(),
        };
      }

      const relationship = {
        relationship:
          "new",

        relatedMemory:
          null,

        confidence:
          0.96,
      };

      const instruction =
        createStorageInstruction({
          candidate,

          action:
            MEMORY_ACTIONS
              .SAVE_SESSION_HANDOFF,

          relationship,
        });

      const validation =
        instruction
          ? validateStorageInstruction({
              instruction,

              context:
                combinedContext,
            })
          : {
              valid:
                false,

              reason:
                "instruction-not-created",
            };

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

            instruction:
              validation.valid
                ? instruction
                : null,

            boundary,
          },
        ],

        instructions:
          validation.valid &&
          instruction
            ? [
                instruction,
              ]
            : [],

        persistence:
          describeMemoryService(
            activeMemory
          ),

        status:
          validation.valid &&
          instruction
            ? "planned"
            : "rejected",

        reason:
          validation.valid
            ? null
            : validation.reason,

        createdAt:
          createTimestamp(),
      };
    } catch (error) {
      return createFallbackMemoryPlan({
        message:
          "",

        context,

        error,
      });
    }
  }

  /**
   * Executes a memory plan.
   *
   * Every instruction must finish in exactly one reported bucket:
   *
   * - applied
   * - skipped
   * - errors
   *
   * Missing adapter outcomes are converted into explicit skips.
   */
  function applyMemoryPlan({
    plan,
    memory: suppliedMemory = null,
  } = {}) {
    const resolvedMemory =
      suppliedMemory ||
      activeMemory;

    const instructions =
      asArray(
        plan
          ?.instructions
      );

    if (
      instructions.length ===
      0
    ) {
      return createEmptyPersistenceResult({
        executionPath:
          resolvedMemory
            ? "nothing-to-apply"
            : null,
      });
    }

    if (
      !plan
    ) {
      return createUnavailablePersistenceResult({
        instructions,

        reason:
          "No Creator Memory plan was supplied.",
      });
    }

    if (
      !resolvedMemory
    ) {
      return createUnavailablePersistenceResult({
        instructions,

        reason:
          "No Creator Memory service is connected.",
      });
    }

    /**
     * Preferred generic persistence bridge.
     */
    if (
      typeof resolvedMemory
        .applyMemoryInstructions ===
      "function"
    ) {
      try {
        const result =
          resolvedMemory
            .applyMemoryInstructions(
              instructions
            );

        return reconcilePersistenceResult({
          instructions,

          applied:
            result
              ?.applied ||
            [],

          skipped:
            result
              ?.skipped ||
            [],

          errors:
            result
              ?.errors ||
            [],

          executionPath:
            "applyMemoryInstructions",

          adapterStatus:
            result
              ?.status ||
            null,

          adapterReason:
            result
              ?.reason ||
            null,
        });
      } catch (error) {
        console.warn(
          "CreatorMemoryEngine generic memory bridge failed. Falling back to direct execution:",
          error
        );
      }
    }

    /**
     * Secondary single-instruction bridge.
     */
    if (
      typeof resolvedMemory
        .applyMemoryInstruction ===
      "function"
    ) {
      const applied =
        [];

      const skipped =
        [];

      const errors =
        [];

      for (
        const instruction
        of instructions
      ) {
        try {
          const result =
            resolvedMemory
              .applyMemoryInstruction(
                instruction
              );

          if (
            result
              ?.applied ===
              true
          ) {
            applied.push({
              instruction:
                cloneValue(
                  instruction
                ),

              result:
                cloneValue(
                  result.result
                ),
            });

            continue;
          }

          skipped.push({
            instruction:
              cloneValue(
                instruction
              ),

            reason:
              result
                ?.reason ||
              "Persistence instruction was not applied.",

            result:
              cloneValue(
                result
                  ?.result
              ),
          });
        } catch (error) {
          errors.push({
            instruction:
              cloneValue(
                instruction
              ),

            error:
              error instanceof
                Error
                ? error.message
                : String(
                    error
                  ),
          });
        }
      }

      return reconcilePersistenceResult({
        instructions,

        applied,

        skipped,

        errors,

        executionPath:
          "applyMemoryInstruction",
      });
    }

    /**
     * Compatibility path for older adapters.
     */
    const applied =
      [];

    const skipped =
      [];

    const errors =
      [];

    for (
      const instruction
      of instructions
    ) {
      const targetMethod =
        instruction
          ?.targetMethod;

      const payload =
        instruction
          ?.payload;

      if (
        !targetMethod
      ) {
        skipped.push({
          instruction:
            cloneValue(
              instruction
            ),

          reason:
            "No persistence target method was supplied.",
        });

        continue;
      }

      if (
        typeof resolvedMemory[
          targetMethod
        ] !==
        "function"
      ) {
        skipped.push({
          instruction:
            cloneValue(
              instruction
            ),

          reason:
            (
              `Memory method unavailable: ` +
              `${targetMethod}`
            ),

          requiresMemoryAdapterResolution:
            true,
        });

        continue;
      }

      try {
        const result =
          resolvedMemory[
            targetMethod
          ](
            payload
          );

        if (
          !didPersistenceMethodApply(
            instruction,
            result
          )
        ) {
          skipped.push({
            instruction:
              cloneValue(
                instruction
              ),

            reason:
              (
                instruction
                  ?.destructive
                  ? "Destructive persistence result did not confirm the requested operation."
                  : "Persistence method did not apply the instruction."
              ),

            result:
              cloneValue(
                result
              ),
          });

          continue;
        }

        applied.push({
          instruction:
            cloneValue(
              instruction
            ),

          result:
            cloneValue(
              result
            ),
        });
      } catch (error) {
        errors.push({
          instruction:
            cloneValue(
              instruction
            ),

          error:
            error instanceof
              Error
              ? error.message
              : String(
                  error
                ),
        });
      }
    }

    return reconcilePersistenceResult({
      instructions,

      applied,

      skipped,

      errors,

      executionPath:
        "direct-method-fallback",
    });
  }

  function applyMemoryInstruction({
    instruction,
    memory: suppliedMemory = null,
  } = {}) {
    const resolvedMemory =
      suppliedMemory ||
      activeMemory;

    if (
      !instruction
    ) {
      return {
        applied:
          false,

        reason:
          "No memory instruction was supplied.",

        result:
          null,
      };
    }

    if (
      !resolvedMemory
    ) {
      return {
        applied:
          false,

        reason:
          "No Creator Memory service is connected.",

        result:
          null,
      };
    }

    if (
      typeof resolvedMemory
        .applyMemoryInstruction ===
      "function"
    ) {
      try {
        const result =
          resolvedMemory
            .applyMemoryInstruction(
              instruction
            );

        if (
          result
            ?.applied !==
            true
        ) {
          return {
            applied:
              false,

            reason:
              result
                ?.reason ||
              "Persistence instruction was not applied.",

            result:
              cloneValue(
                result
                  ?.result
              ),
          };
        }

        return {
          applied:
            true,

          reason:
            null,

          result:
            cloneValue(
              result
                ?.result
            ),
        };
      } catch (error) {
        return {
          applied:
            false,

          reason:
            error instanceof
              Error
              ? error.message
              : String(
                  error
                ),

          result:
            null,
        };
      }
    }

    const targetMethod =
      instruction
        ?.targetMethod;

    if (
      !targetMethod ||
      typeof resolvedMemory[
        targetMethod
      ] !==
        "function"
    ) {
      return {
        applied:
          false,

        reason:
          targetMethod
            ? (
                `Memory method unavailable: ` +
                `${targetMethod}`
              )
            : "No target method supplied.",

        result:
          null,
      };
    }

    try {
      const result =
        resolvedMemory[
          targetMethod
        ](
          instruction
            .payload
        );

      const applied =
        didPersistenceMethodApply(
          instruction,
          result
        );

      return {
        applied,

        reason:
          applied
            ? null
            : (
                instruction
                  ?.destructive
                  ? "Destructive persistence result did not confirm the requested operation."
                  : "Persistence method did not apply the instruction."
              ),

        result:
          cloneValue(
            result
          ),
      };
    } catch (error) {
      return {
        applied:
          false,

        reason:
          error instanceof
            Error
            ? error.message
            : String(
                error
              ),

        result:
          null,
      };
    }
  }

  function setMemory(
    nextMemory
  ) {
    activeMemory =
      nextMemory ||
      null;

    return activeMemory;
  }

  function getMemory() {
    return activeMemory;
  }

  function getMemoryServiceInfo() {
    return describeMemoryService(
      activeMemory
    );
  }

  function getConnectedMemoryContext(
    context = {}
  ) {
    return readConnectedMemoryContext(
      activeMemory,
      context
    );
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

  function forgetRequiresClarification(
    plan
  ) {
    return Boolean(
      plan
        ?.forget
        ?.requiresClarification
    );
  }

  function hasProjectMemoryCandidates(
    plan
  ) {
    return asArray(
      plan
        ?.candidates
    ).some(
      (item) => {
        const candidate =
          item
            ?.candidate ||
          item;

        return (
          candidate
            ?.scope ===
            MEMORY_SCOPES
              .PROJECT ||
          Boolean(
            candidate
              ?.projectId
          )
        );
      }
    );
  }

  function hasSessionHandoff(
    plan
  ) {
    return asArray(
      plan
        ?.candidates
    ).some(
      (item) => {
        const candidate =
          item
            ?.candidate ||
          item;

        return (
          candidate
            ?.category ===
          MEMORY_CATEGORIES
            .SESSION_HANDOFF
        );
      }
    );
  }

  return {
    planMemory,
    planRecall,
    planSessionHandoff,

    applyMemoryPlan,
    applyMemoryInstruction,

    setMemory,
    getMemory,
    getMemoryServiceInfo,
    getConnectedMemoryContext,

    isBriefDetour,
    shouldDeferTopic,
    shouldRecallMemory,

    hasForgetRequest,
    forgetRequiresClarification,

    hasProjectMemoryCandidates,
    hasSessionHandoff,
  };
}

/**
 * ------------------------------------------------------------
 * Convenience methods
 * ------------------------------------------------------------
 */

function planMemory({
  message = "",
  context = {},
  memory = null,
} = {}) {
  return createCreatorMemoryEngine({
    memory,
  }).planMemory({
    message,

    context,
  });
}

function planRecall({
  message = "",
  context = {},
  memory = null,
} = {}) {
  return createCreatorMemoryEngine({
    memory,
  }).planRecall({
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
  MEMORY_CERTAINTY,
  MEMORY_ACTIONS,

  RECALL_PRIORITIES,
  RECALL_TIMINGS,

  EVIDENCE_TYPES,

  PERSISTENCE_STATUSES,

  PROJECT_MEMORY_CATEGORIES,
  PROFILE_MEMORY_CATEGORIES,
  DESTRUCTIVE_MEMORY_ACTIONS,

  createCreatorMemoryEngine,
  planMemory,
  planRecall,
};

export default createCreatorMemoryEngine;
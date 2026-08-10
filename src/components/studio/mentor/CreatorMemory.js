/**
 * Creator Memory
 * ------------------------------------------------------------
 * The persistent memory foundation for iBand's AI Mentor —
 * The Creator.
 *
 * Responsibilities:
 * - Remember creator preferences and identity.
 * - Preserve ideas and unfinished possibilities.
 * - Record projects, milestones and conversation summaries.
 * - Store evidence-based observations and creative patterns.
 * - Support the Inspiration Drawer.
 * - Support deferred memories that may become useful later.
 * - Persist project-scoped memory safely.
 * - Preserve session handoffs for clean creative continuation.
 * - Reinforce existing memories without unnecessary duplication.
 * - Preserve historical truth when newer truth supersedes it.
 * - Resolve project threads.
 * - Respect explicit forget requests.
 * - Distinguish creator-confirmed knowledge from inference.
 * - Provide safe context to the Adaptive Mentor pipeline.
 * - Apply approved memory instructions from CreatorMemoryEngine.
 *
 * Version 2.2 hardens the live persistence contract:
 *
 * - Explicit current project identity outranks previously active
 *   persistent project state.
 * - Creator, project, entity and session boundaries are enforced.
 * - Creator-confirmed truth cannot be silently overwritten by a
 *   weaker specialist-agent or inferred signal.
 * - Conflicting lower-authority evidence may reinforce evidence
 *   without replacing established truth.
 * - Temporary guidance cannot silently become a permanent profile
 *   preference.
 * - Project memory and recall remain isolated to their project.
 * - Session handoffs require a real project boundary.
 * - Ambiguous destructive forgetting is refused.
 * - Raw secrets, credentials, tokens and passwords are rejected
 *   from creative memory.
 * - Persistence reports full, partial, failed and empty execution
 *   states accurately.
 * - Existing v2.1 memory migrates additively without data loss.
 *
 * Version 2 continues to use browser localStorage.
 *
 * The public persistence contract is intentionally storage-agnostic.
 * localStorage can later be replaced by the iBand API without
 * requiring the Mentor intelligence layers to understand storage.
 *
 * Core principles:
 * - Protect the Creator.
 * - Memory serves creation.
 * - Present behaviour leads; memory informs.
 * - Creator-confirmed information outranks inference.
 * - Project memory remains inside its project.
 * - Specialist agents may contribute evidence but do not own truth.
 * - Memory may evolve without erasing useful history.
 * - Forget requests must be explicit and unambiguous.
 * - Never fabricate successful memory persistence.
 * - Never persist raw credentials as creative memory.
 */

const CREATOR_MEMORY_VERSION = "2.2.0";

const DEFAULT_STORAGE_KEY =
  "iband.creator-memory";

const MEMORY_ENTRY_TYPES = Object.freeze({
  IDEA: "idea",
  INSPIRATION: "inspiration",
  PROJECT: "project",
  PROJECT_MEMORY: "project-memory",
  SESSION_HANDOFF: "session-handoff",
  CONVERSATION: "conversation",
  OBSERVATION: "observation",
  PATTERN: "pattern",
  STRENGTH: "strength",
  PREFERENCE: "preference",
  MILESTONE: "milestone",
  REFLECTION: "reflection",
  DEFERRED: "deferred",
});

const IDEA_STATUSES = Object.freeze({
  ACTIVE: "active",
  DEVELOPING: "developing",
  PAUSED: "paused",
  INSPIRATION_DRAWER:
    "inspiration-drawer",
  COMPLETED: "completed",
  ARCHIVED: "archived",
});

const PROJECT_STATUSES =
  Object.freeze({
    IDEA: "idea",
    PLANNING: "planning",
    CREATING: "creating",
    REFINING: "refining",
    SAVED: "saved",
    PUBLISHED: "published",
    PAUSED: "paused",
    COMPLETED: "completed",
    ARCHIVED: "archived",
  });

const PATTERN_STATUSES =
  Object.freeze({
    EMERGING: "emerging",
    REPEATED: "repeated",
    CONFIRMED: "confirmed",
    REJECTED: "rejected",
  });

const MEMORY_IMPORTANCE =
  Object.freeze({
    LOW: "low",
    MEDIUM: "medium",
    HIGH: "high",
    CORE: "core",
    CRITICAL: "critical",
  });

const MEMORY_STATUSES = Object.freeze({
  ACTIVE: "active",
  DEFERRED: "deferred",
  CONFIRMED: "confirmed",
  DISMISSED: "dismissed",

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

const MEMORY_HORIZONS =
  Object.freeze({
    MOMENT: "moment",
    SESSION: "session",
    SHORT_TERM: "short-term",
    LONG_TERM: "long-term",
    HISTORICAL: "historical",
    UNDECIDED: "undecided",
  });

const MEMORY_SOURCES = Object.freeze({
  CREATOR: "creator",
  MENTOR: "mentor",
  SYSTEM: "system",
  INFERRED: "inferred",
  IMPORTED: "imported",
  PROJECT_STATE: "project-state",
  SPECIALIST_AGENT:
    "specialist-agent",
  UNKNOWN: "unknown",
});

const MEMORY_CERTAINTY =
  Object.freeze({
    EXPLICIT: "explicit",
    CONFIRMED: "confirmed",
    OBSERVED: "observed",
    INFERRED: "inferred",
    UNKNOWN: "unknown",
  });

const DEFERRED_MEMORY_STATUSES =
  Object.freeze({
    WAITING: "waiting",
    READY: "ready",
    RECALLED: "recalled",
    DISMISSED: "dismissed",
    ARCHIVED: "archived",
  });

const SESSION_HANDOFF_STATUSES =
  Object.freeze({
    ACTIVE: "active",
    RESUMED: "resumed",
    SUPERSEDED: "superseded",
    ARCHIVED: "archived",
  });

/**
 * Higher values represent stronger authority.
 *
 * Creator confirmation must outrank project-state assumptions,
 * specialist agents and inferred observations.
 */
const MEMORY_AUTHORITY = Object.freeze({
  CREATOR_CONFIRMED: 100,
  CREATOR_EXPLICIT: 95,
  PROJECT_CONFIRMED: 85,
  SYSTEM_CONFIRMED: 80,
  CREATOR_OBSERVED: 75,
  IMPORTED: 65,
  SPECIALIST_AGENT: 55,
  MENTOR_OBSERVED: 50,
  INFERRED: 35,
  UNKNOWN: 20,
});

const DEFAULT_CREATOR_PROFILE =
  Object.freeze({
    id: null,

    displayName: "",
    creatorName: "",

    preferredMentorName:
      "The Creator",

    preferredTone: "warm",

    creatorTypes: [],
    interests: [],
    goals: [],
    values: [],
    creativeStrengths: [],
    confidenceNotes: [],

    communicationPreferences: {
      oneQuestionAtATime: true,
      conciseGuidance: false,
      permissionBeforePerspective:
        true,
      encouragementBeforeCorrection:
        true,

      preferredResponseDepth: null,
      preferredGuidanceStyle: null,
      preferredMentorRole: null,
      preferredCommunicationPace:
        null,
      preferredVoiceProfile: null,
      preferredChannel: null,
    },

    mentorLearning: {},
  });

const DEFAULT_MEMORY_STATE =
  Object.freeze({
    version:
      CREATOR_MEMORY_VERSION,

    creatorProfile:
      DEFAULT_CREATOR_PROFILE,

    ideas: [],
    projects: [],
    projectMemories: [],
    sessionHandoffs: [],
    conversations: [],
    observations: [],
    patterns: [],
    milestones: [],
    reflections: [],
    deferredMemories: [],

    journey: {
      conversationCount: 0,

      completedProjectCount: 0,
      publishedProjectCount: 0,

      savedIdeaCount: 0,
      inspirationDrawerCount: 0,

      deferredMemoryCount: 0,
      projectMemoryCount: 0,
      sessionHandoffCount: 0,

      firstSeenAt: null,
      lastSeenAt: null,

      recentStage: null,
      recentEmotionalState: null,

      activeProjectId: null,
    },

    metadata: {
      createdAt: null,
      updatedAt: null,

      migratedFromVersion: null,
    },
  });

/**
 * ------------------------------------------------------------
 * Core utilities
 * ------------------------------------------------------------
 */

function createTimestamp() {
  return new Date().toISOString();
}

function createMemoryId(
  prefix = "memory"
) {
  const randomValue = Math.random()
    .toString(36)
    .slice(2, 10);

  return (
    `${prefix}-` +
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

function normaliseString(value) {
  return typeof value === "string"
    ? value.trim()
    : "";
}

function normaliseComparableText(
  value
) {
  return normaliseString(value)
    .toLowerCase()
    .replace(/[’‘]/g, "'")
    .replace(/\s+/g, " ");
}

function normaliseStringArray(
  value
) {
  if (!Array.isArray(value)) {
    return [];
  }

  return [
    ...new Set(
      value
        .map((item) =>
          typeof item === "string"
            ? item.trim()
            : ""
        )
        .filter(Boolean)
    ),
  ];
}

function normaliseArray(value) {
  return Array.isArray(value)
    ? value
    : [];
}

function normaliseConfidence(
  value,
  fallback = 0.5
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
    0,
    Math.min(
      1,
      numericValue
    )
  );
}

function normaliseCount(
  value,
  fallback = 0
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
    0,
    Math.floor(
      numericValue
    )
  );
}

function normaliseEnumValue(
  value,
  enumObject,
  fallback
) {
  return Object.values(
    enumObject
  ).includes(value)
    ? value
    : fallback;
}

function memoryValueToText(
  value
) {
  if (
    value === null ||
    value === undefined
  ) {
    return "";
  }

  if (
    typeof value ===
    "string"
  ) {
    return normaliseString(
      value
    );
  }

  if (
    typeof value ===
      "number" ||
    typeof value ===
      "boolean"
  ) {
    return String(value);
  }

  try {
    return JSON.stringify(
      value
    );
  } catch {
    return "";
  }
}

function valuesEquivalent(
  left,
  right
) {
  const leftText =
    normaliseComparableText(
      memoryValueToText(left)
    );

  const rightText =
    normaliseComparableText(
      memoryValueToText(right)
    );

  return (
    Boolean(leftText) &&
    leftText === rightText
  );
}

function canUseLocalStorage() {
  try {
    return (
      typeof window !==
        "undefined" &&
      Boolean(
        window.localStorage
      )
    );
  } catch {
    return false;
  }
}

/**
 * ------------------------------------------------------------
 * Secret / credential protection
 * ------------------------------------------------------------
 *
 * Persistence receives a second defence even when an upstream
 * intelligence layer fails to block sensitive content.
 *
 * The detector deliberately looks for credential-shaped material
 * rather than merely rejecting any discussion containing the word
 * "password".
 */

function detectSensitiveSecret(
  value
) {
  const text =
    memoryValueToText(value);

  if (!text) {
    return {
      detected: false,
      evidence: [],
    };
  }

  const evidence = [];

  const patterns = [
    {
      name:
        "private-key-block",

      pattern:
        /-----BEGIN [A-Z ]*PRIVATE KEY-----/,
    },

    {
      name:
        "openai-style-secret",

      pattern:
        /\bsk-[A-Za-z0-9_-]{16,}\b/,
    },

    {
      name:
        "bearer-token",

      pattern:
        /\bBearer\s+[A-Za-z0-9._~+/-]{12,}=*\b/i,
    },

    {
      name:
        "api-key-assignment",

      pattern:
        /\b(?:api[_ -]?key|secret[_ -]?key|client[_ -]?secret)\s*[:=]\s*["']?[A-Za-z0-9._~+/-]{8,}/i,
    },

    {
      name:
        "password-assignment",

      pattern:
        /\b(?:password|passcode|pin)\s*[:=]\s*["']?[^\s"'`;]{4,}/i,
    },

    {
      name:
        "access-token-assignment",

      pattern:
        /\b(?:access[_ -]?token|refresh[_ -]?token|auth[_ -]?token)\s*[:=]\s*["']?[A-Za-z0-9._~+/-]{8,}=*/i,
    },

    {
      name:
        "seed-phrase",

      pattern:
        /\b(?:seed phrase|recovery phrase|mnemonic phrase)\s*[:=]\s*["']?[A-Za-z]+(?:\s+[A-Za-z]+){5,}/i,
    },
  ];

  patterns.forEach(
    ({ name, pattern }) => {
      if (pattern.test(text)) {
        evidence.push(name);
      }
    }
  );

  return {
    detected:
      evidence.length > 0,

    evidence,
  };
}

function containsSensitiveSecret(
  ...values
) {
  return values.some(
    (value) =>
      detectSensitiveSecret(
        value
      ).detected
  );
}

/**
 * ------------------------------------------------------------
 * Provenance and authority
 * ------------------------------------------------------------
 */

function createMemoryProvenance({
  source =
    MEMORY_SOURCES.CREATOR,

  certainty =
    MEMORY_CERTAINTY.EXPLICIT,

  confidence = 1,
} = {}) {
  return {
    source:
      normaliseEnumValue(
        source,
        MEMORY_SOURCES,
        MEMORY_SOURCES.UNKNOWN
      ),

    certainty:
      normaliseEnumValue(
        certainty,
        MEMORY_CERTAINTY,
        MEMORY_CERTAINTY.UNKNOWN
      ),

    confidence:
      normaliseConfidence(
        confidence,
        1
      ),
  };
}

function getMemoryAuthority({
  source,
  certainty,
} = {}) {
  if (
    source ===
      MEMORY_SOURCES.CREATOR &&
    certainty ===
      MEMORY_CERTAINTY.CONFIRMED
  ) {
    return (
      MEMORY_AUTHORITY
        .CREATOR_CONFIRMED
    );
  }

  if (
    source ===
      MEMORY_SOURCES.CREATOR &&
    certainty ===
      MEMORY_CERTAINTY.EXPLICIT
  ) {
    return (
      MEMORY_AUTHORITY
        .CREATOR_EXPLICIT
    );
  }

  if (
    source ===
      MEMORY_SOURCES.PROJECT_STATE &&
    certainty ===
      MEMORY_CERTAINTY.CONFIRMED
  ) {
    return (
      MEMORY_AUTHORITY
        .PROJECT_CONFIRMED
    );
  }

  if (
    source ===
      MEMORY_SOURCES.SYSTEM &&
    certainty ===
      MEMORY_CERTAINTY.CONFIRMED
  ) {
    return (
      MEMORY_AUTHORITY
        .SYSTEM_CONFIRMED
    );
  }

  if (
    source ===
    MEMORY_SOURCES.CREATOR
  ) {
    return (
      MEMORY_AUTHORITY
        .CREATOR_OBSERVED
    );
  }

  if (
    source ===
    MEMORY_SOURCES.IMPORTED
  ) {
    return (
      MEMORY_AUTHORITY.IMPORTED
    );
  }

  if (
    source ===
    MEMORY_SOURCES
      .SPECIALIST_AGENT
  ) {
    return (
      MEMORY_AUTHORITY
        .SPECIALIST_AGENT
    );
  }

  if (
    source ===
    MEMORY_SOURCES.MENTOR
  ) {
    return (
      MEMORY_AUTHORITY
        .MENTOR_OBSERVED
    );
  }

  if (
    source ===
    MEMORY_SOURCES.INFERRED
  ) {
    return (
      MEMORY_AUTHORITY.INFERRED
    );
  }

  return (
    MEMORY_AUTHORITY.UNKNOWN
  );
}

function getEntryAuthority(
  entry
) {
  return getMemoryAuthority({
    source:
      entry?.source,

    certainty:
      entry?.certainty,
  });
}

/**
 * Returns true when an incoming record is not allowed to
 * silently replace existing truth.
 */
function shouldProtectExistingTruth({
  existing,
  incoming,
}) {
  if (
    !existing ||
    !incoming
  ) {
    return false;
  }

  const existingAuthority =
    getEntryAuthority(existing);

  const incomingAuthority =
    getMemoryAuthority({
      source:
        incoming?.source,

      certainty:
        incoming?.certainty,
    });

  return (
    incomingAuthority <
    existingAuthority
  );
}

/**
 * ------------------------------------------------------------
 * State creation / migration
 * ------------------------------------------------------------
 */

function createDefaultMemoryState() {
  const timestamp =
    createTimestamp();

  return {
    ...cloneValue(
      DEFAULT_MEMORY_STATE
    ),

    creatorProfile:
      cloneValue(
        DEFAULT_CREATOR_PROFILE
      ),

    journey: {
      ...cloneValue(
        DEFAULT_MEMORY_STATE
          .journey
      ),

      firstSeenAt:
        timestamp,

      lastSeenAt:
        timestamp,
    },

    metadata: {
      ...cloneValue(
        DEFAULT_MEMORY_STATE
          .metadata
      ),

      createdAt:
        timestamp,

      updatedAt:
        timestamp,
    },
  };
}

function hydrateMemoryState(
  value
) {
  const fallback =
    createDefaultMemoryState();

  if (
    !value ||
    typeof value !==
      "object"
  ) {
    return fallback;
  }

  const previousVersion =
    normaliseString(
      value.version
    );

  return {
    ...fallback,
    ...cloneValue(value),

    version:
      CREATOR_MEMORY_VERSION,

    creatorProfile: {
      ...fallback.creatorProfile,
      ...(value.creatorProfile ||
        {}),

      communicationPreferences: {
        ...fallback
          .creatorProfile
          .communicationPreferences,

        ...(value.creatorProfile
          ?.communicationPreferences ||
          {}),
      },

      mentorLearning: {
        ...fallback
          .creatorProfile
          .mentorLearning,

        ...(value.creatorProfile
          ?.mentorLearning ||
          {}),
      },

      creatorTypes:
        normaliseStringArray(
          value.creatorProfile
            ?.creatorTypes
        ),

      interests:
        normaliseStringArray(
          value.creatorProfile
            ?.interests
        ),

      goals:
        normaliseStringArray(
          value.creatorProfile
            ?.goals
        ),

      values:
        normaliseStringArray(
          value.creatorProfile
            ?.values
        ),

      creativeStrengths:
        normaliseStringArray(
          value.creatorProfile
            ?.creativeStrengths
        ),

      confidenceNotes:
        normaliseStringArray(
          value.creatorProfile
            ?.confidenceNotes
        ),
    },

    ideas:
      normaliseArray(
        value.ideas
      ),

    projects:
      normaliseArray(
        value.projects
      ),

    projectMemories:
      normaliseArray(
        value.projectMemories
      ),

    sessionHandoffs:
      normaliseArray(
        value.sessionHandoffs
      ),

    conversations:
      normaliseArray(
        value.conversations
      ),

    observations:
      normaliseArray(
        value.observations
      ),

    patterns:
      normaliseArray(
        value.patterns
      ),

    milestones:
      normaliseArray(
        value.milestones
      ),

    reflections:
      normaliseArray(
        value.reflections
      ),

    deferredMemories:
      normaliseArray(
        value.deferredMemories
      ),

    journey: {
      ...fallback.journey,
      ...(value.journey || {}),
    },

    metadata: {
      ...fallback.metadata,
      ...(value.metadata || {}),

      migratedFromVersion:
        previousVersion &&
        previousVersion !==
          CREATOR_MEMORY_VERSION
          ? previousVersion
          : value.metadata
              ?.migratedFromVersion ||
            null,

      updatedAt:
        createTimestamp(),
    },
  };
}

function parseMemoryState(
  serialisedValue
) {
  if (!serialisedValue) {
    return (
      createDefaultMemoryState()
    );
  }

  try {
    return hydrateMemoryState(
      JSON.parse(
        serialisedValue
      )
    );
  } catch {
    return (
      createDefaultMemoryState()
    );
  }
}

function createMemoryStorageAdapter(
  initialState = null
) {
  let storedValue =
    initialState
      ? JSON.stringify(
          hydrateMemoryState(
            initialState
          )
        )
      : null;

  return {
    getItem() {
      return storedValue;
    },

    setItem(
      _key,
      value
    ) {
      storedValue = value;
    },

    removeItem() {
      storedValue = null;
    },
  };
}

function resolveStorageAdapter(
  storageAdapter
) {
  if (storageAdapter) {
    return storageAdapter;
  }

  if (canUseLocalStorage()) {
    return window.localStorage;
  }

  return (
    createMemoryStorageAdapter()
  );
}

function sortNewestFirst(
  entries = []
) {
  return [
    ...entries,
  ].sort(
    (a, b) => {
      const timeA =
        new Date(
          a.updatedAt ||
            a.createdAt ||
            0
        ).getTime();

      const timeB =
        new Date(
          b.updatedAt ||
            b.createdAt ||
            0
        ).getTime();

      return timeB - timeA;
    }
  );
}

function findById(
  entries,
  id
) {
  return normaliseArray(
    entries
  ).find(
    (entry) =>
      entry?.id === id
  );
}

function isHistoricalLifecycleStatus(
  status
) {
  return [
    MEMORY_STATUSES.SUPERSEDED,
    MEMORY_STATUSES.HISTORICAL,
    MEMORY_STATUSES.ARCHIVED,
    MEMORY_STATUSES.REJECTED,
  ].includes(status);
}

function isMemoryContextActive(
  entry
) {
  if (!entry) {
    return false;
  }

  if (
    isHistoricalLifecycleStatus(
      entry.lifecycleStatus
    )
  ) {
    return false;
  }

  if (
    [
      IDEA_STATUSES.ARCHIVED,
      PROJECT_STATUSES.ARCHIVED,

      DEFERRED_MEMORY_STATUSES
        .DISMISSED,

      DEFERRED_MEMORY_STATUSES
        .ARCHIVED,

      SESSION_HANDOFF_STATUSES
        .SUPERSEDED,

      SESSION_HANDOFF_STATUSES
        .ARCHIVED,

      PATTERN_STATUSES.REJECTED,

      MEMORY_STATUSES.SUPERSEDED,
      MEMORY_STATUSES.HISTORICAL,
      MEMORY_STATUSES.ARCHIVED,
      MEMORY_STATUSES.REJECTED,
    ].includes(
      entry.status
    )
  ) {
    return false;
  }

  return true;
}

function findByMemoryKey(
  entries,
  memoryKey,
  predicate = null
) {
  const cleanKey =
    normaliseString(
      memoryKey
    );

  if (!cleanKey) {
    return null;
  }

  const matches =
    normaliseArray(entries)
      .filter(
        (entry) =>
          (
            entry?.memoryKey ===
              cleanKey ||
            entry?.metadata
              ?.memoryKey ===
              cleanKey
          ) &&
          (
            typeof predicate !==
              "function" ||
            predicate(entry)
          )
      );

  if (
    matches.length === 0
  ) {
    return null;
  }

  const activeMatches =
    matches.filter(
      isMemoryContextActive
    );

  return (
    sortNewestFirst(
      activeMatches.length > 0
        ? activeMatches
        : matches
    )[0] ||
    null
  );
}

function getEntryProjectId(
  entry
) {
  return (
    normaliseString(
      entry?.projectId
    ) ||
    normaliseString(
      entry
        ?.relatedProjectId
    ) ||
    normaliseString(
      entry?.metadata
        ?.projectId
    ) ||
    null
  );
}

function getProjectId(
  project
) {
  if (!project) {
    return null;
  }

  if (
    typeof project ===
    "string"
  ) {
    return (
      normaliseString(
        project
      ) ||
      null
    );
  }

  return (
    normaliseString(
      project.id
    ) ||
    normaliseString(
      project.projectId
    ) ||
    null
  );
}

function isRelevantToProject(
  entry,
  projectId
) {
  if (!entry) {
    return false;
  }

  const directProjectId =
    getEntryProjectId(
      entry
    );

  if (directProjectId) {
    return Boolean(
      projectId &&
      directProjectId ===
        projectId
    );
  }

  const relatedProjectIds =
    normaliseStringArray(
      entry.relatedProjectIds
    );

  if (
    relatedProjectIds.length >
    0
  ) {
    return Boolean(
      projectId &&
      relatedProjectIds.includes(
        projectId
      )
    );
  }

  return true;
}

/**
 * Validates that an explicit project-scoped memory has a
 * real project boundary.
 */
function hasValidProjectBoundary({
  scope = null,
  projectId = null,
  relatedProjectIds = [],
} = {}) {
  const cleanProjectId =
    normaliseString(
      projectId
    );

  const cleanRelatedIds =
    normaliseStringArray(
      relatedProjectIds
    );

  if (
    scope !==
      MEMORY_SCOPES.PROJECT &&
    !cleanProjectId &&
    cleanRelatedIds.length === 0
  ) {
    return true;
  }

  return Boolean(
    cleanProjectId ||
    cleanRelatedIds.length > 0
  );
}

/**
 * ------------------------------------------------------------
 * Creator Memory service
 * ------------------------------------------------------------
 */

function createCreatorMemory({
  storageKey =
    DEFAULT_STORAGE_KEY,

  storageAdapter = null,

  creatorId = null,
} = {}) {
  const storage =
    resolveStorageAdapter(
      storageAdapter
    );

  const cleanCreatorId =
    normaliseString(
      creatorId
    ) ||
    null;

  const resolvedStorageKey =
    cleanCreatorId
      ? (
          `${storageKey}.` +
          `${cleanCreatorId}`
        )
      : storageKey;

  let storedValue = null;

  try {
    storedValue =
      storage.getItem(
        resolvedStorageKey
      );
  } catch (error) {
    throw new Error(
      "Creator Memory could not read persisted storage.",
      {
        cause: error,
      }
    );
  }

  let memoryState =
    parseMemoryState(
      storedValue
    );

  if (cleanCreatorId) {
    memoryState
      .creatorProfile
      .id =
      cleanCreatorId;
  }

  let lastPersistedSnapshot =
    cloneValue(
      memoryState
    );

  function getMemoryCollections() {
    return [
      {
        name: "ideas",
        entries:
          memoryState.ideas,
      },

      {
        name:
          "projectMemories",

        entries:
          memoryState
            .projectMemories,
      },

      {
        name:
          "sessionHandoffs",

        entries:
          memoryState
            .sessionHandoffs,
      },

      {
        name:
          "observations",

        entries:
          memoryState
            .observations,
      },

      {
        name: "patterns",

        entries:
          memoryState.patterns,
      },

      {
        name: "milestones",

        entries:
          memoryState
            .milestones,
      },

      {
        name: "reflections",

        entries:
          memoryState
            .reflections,
      },

      {
        name:
          "deferredMemories",

        entries:
          memoryState
            .deferredMemories,
      },

      {
        name:
          "conversations",

        entries:
          memoryState
            .conversations,
      },
    ];
  }

  /**
   * Returns every exact record matching an id or memory key.
   *
   * This is intentionally different from findByMemoryKey().
   * Destructive operations need to know whether a key is
   * ambiguous rather than silently choosing one match.
   */
  function findMemoryRecords({
    memoryId = null,
    memoryKey = null,
  } = {}) {
    const cleanId =
      normaliseString(
        memoryId
      );

    const cleanKey =
      normaliseString(
        memoryKey
      );

    const records = [];

    getMemoryCollections()
      .forEach(
        (collection) => {
          collection.entries
            .forEach(
              (
                entry,
                index
              ) => {
                const idMatches =
                  cleanId &&
                  entry?.id ===
                    cleanId;

                const keyMatches =
                  cleanKey &&
                  (
                    entry
                      ?.memoryKey ===
                      cleanKey ||
                    entry
                      ?.metadata
                      ?.memoryKey ===
                      cleanKey
                  );

                if (
                  idMatches ||
                  (
                    !cleanId &&
                    keyMatches
                  )
                ) {
                  records.push({
                    collectionName:
                      collection.name,

                    collection:
                      collection.entries,

                    index,

                    entry,
                  });
                }
              }
            );
        }
      );

    return records;
  }

  function findMemoryRecord({
    memoryId = null,
    memoryKey = null,
  } = {}) {
    const records =
      findMemoryRecords({
        memoryId,
        memoryKey,
      });

    if (
      records.length === 0
    ) {
      return null;
    }

    if (
      normaliseString(
        memoryId
      )
    ) {
      return records[0];
    }

    const activeRecords =
      records.filter(
        (record) =>
          isMemoryContextActive(
            record.entry
          )
      );

    return (
      sortNewestFirst(
        (
          activeRecords.length >
          0
            ? activeRecords
            : records
        ).map(
          (record) => ({
            ...record,
            updatedAt:
              record.entry
                ?.updatedAt,

            createdAt:
              record.entry
                ?.createdAt,
          })
        )
      )[0] ||
      null
    );
  }

  function recalculateJourneyCounts() {
    memoryState
      .journey
      .savedIdeaCount =
      memoryState.ideas
        .filter(
          (idea) =>
            idea.status !==
              IDEA_STATUSES
                .ARCHIVED &&
            idea.lifecycleStatus !==
              MEMORY_STATUSES
                .ARCHIVED &&
            idea.lifecycleStatus !==
              MEMORY_STATUSES
                .SUPERSEDED
        )
        .length;

    memoryState
      .journey
      .inspirationDrawerCount =
      memoryState.ideas
        .filter(
          (idea) =>
            idea.status ===
              IDEA_STATUSES
                .INSPIRATION_DRAWER &&
            isMemoryContextActive(
              idea
            )
        )
        .length;

    memoryState
      .journey
      .completedProjectCount =
      memoryState.projects
        .filter(
          (project) =>
            project.status ===
              PROJECT_STATUSES
                .COMPLETED ||
            project.status ===
              PROJECT_STATUSES
                .PUBLISHED
        )
        .length;

    memoryState
      .journey
      .publishedProjectCount =
      memoryState.projects
        .filter(
          (project) =>
            project.status ===
            PROJECT_STATUSES
              .PUBLISHED
        )
        .length;

    memoryState
      .journey
      .conversationCount =
      memoryState
        .conversations
        .filter(
          isMemoryContextActive
        )
        .length;

    memoryState
      .journey
      .deferredMemoryCount =
      memoryState
        .deferredMemories
        .filter(
          (memory) =>
            ![
              DEFERRED_MEMORY_STATUSES
                .DISMISSED,

              DEFERRED_MEMORY_STATUSES
                .ARCHIVED,
            ].includes(
              memory.status
            ) &&
            isMemoryContextActive(
              memory
            )
        )
        .length;

    memoryState
      .journey
      .projectMemoryCount =
      memoryState
        .projectMemories
        .filter(
          isMemoryContextActive
        )
        .length;

    memoryState
      .journey
      .sessionHandoffCount =
      memoryState
        .sessionHandoffs
        .filter(
          (handoff) =>
            handoff.status ===
            SESSION_HANDOFF_STATUSES
              .ACTIVE
        )
        .length;
  }

  /**
   * Persistence is write-and-read verified.
   */
  function persist() {
    const previousSnapshot =
      cloneValue(
        lastPersistedSnapshot
      );

    try {
      recalculateJourneyCounts();

      const timestamp =
        createTimestamp();

      memoryState.version =
        CREATOR_MEMORY_VERSION;

      memoryState
        .metadata
        .updatedAt =
        timestamp;

      memoryState
        .journey
        .lastSeenAt =
        timestamp;

      if (cleanCreatorId) {
        memoryState
          .creatorProfile
          .id =
          cleanCreatorId;
      }

      const serialisedState =
        JSON.stringify(
          memoryState
        );

      storage.setItem(
        resolvedStorageKey,
        serialisedState
      );

      const verifiedValue =
        storage.getItem(
          resolvedStorageKey
        );

      if (
        verifiedValue !==
        serialisedState
      ) {
        throw new Error(
          "Persisted memory verification failed."
        );
      }

      lastPersistedSnapshot =
        cloneValue(
          memoryState
        );

      return getState();
    } catch (error) {
      memoryState =
        previousSnapshot;

      throw new Error(
        "Creator Memory persistence failed. In-memory changes were rolled back.",
        {
          cause: error,
        }
      );
    }
  }

  function getState() {
    return cloneValue(
      memoryState
    );
  }

  function replaceState(
    nextState
  ) {
    if (
      containsSensitiveSecret(
        nextState
      )
    ) {
      throw new Error(
        "Creator Memory refused to import raw credentials or secrets."
      );
    }

    const previousState =
      cloneValue(
        memoryState
      );

    memoryState =
      hydrateMemoryState(
        nextState
      );

    if (cleanCreatorId) {
      memoryState
        .creatorProfile
        .id =
        cleanCreatorId;
    }

    try {
      return persist();
    } catch (error) {
      memoryState =
        previousState;

      throw error;
    }
  }

  function resetMemory() {
    const previousState =
      cloneValue(
        memoryState
      );

    memoryState =
      createDefaultMemoryState();

    if (cleanCreatorId) {
      memoryState
        .creatorProfile
        .id =
        cleanCreatorId;
    }

    try {
      return persist();
    } catch (error) {
      memoryState =
        previousState;

      throw error;
    }
  }

  function clearPersistedMemory() {
    try {
      storage.removeItem(
        resolvedStorageKey
      );
    } catch (error) {
      throw new Error(
        "Creator Memory could not clear persisted storage.",
        {
          cause: error,
        }
      );
    }

    memoryState =
      createDefaultMemoryState();

    if (cleanCreatorId) {
      memoryState
        .creatorProfile
        .id =
        cleanCreatorId;
    }

    lastPersistedSnapshot =
      cloneValue(
        memoryState
      );

    return getState();
  }

  /**
   * ----------------------------------------------------------
   * Creator Profile
   * ----------------------------------------------------------
   */

  function getCreatorProfile() {
    return cloneValue(
      memoryState
        .creatorProfile
    );
  }

  /**
   * Detects an update that represents only the current session.
   *
   * A temporary preference may guide the active response but must
   * not silently become durable creator identity.
   */
  function isTemporaryProfileUpdate(
    updates = {}
  ) {
    const learning =
      updates
        ?.mentorLearning ||
      updates
        ?.communicationPreferences
        ?.mentorLearning ||
      {};

    return Boolean(
      learning?.horizon ===
        MEMORY_HORIZONS
          .SESSION ||
      learning?.scope ===
        MEMORY_SCOPES
          .SESSION ||
      learning?.sessionSpecific ===
        true ||
      learning?.metadata
        ?.sessionSpecific ===
        true ||
      updates?.metadata
        ?.sessionSpecific ===
        true
    );
  }

  function updateCreatorProfile(
    updates = {}
  ) {
    if (
      !updates ||
      typeof updates !==
        "object"
    ) {
      return getCreatorProfile();
    }

    if (
      containsSensitiveSecret(
        updates
      )
    ) {
      return null;
    }

    /**
     * Temporary session intelligence must not become permanent
     * profile state.
     */
    if (
      isTemporaryProfileUpdate(
        updates
      )
    ) {
      return null;
    }

    memoryState.creatorProfile = {
      ...memoryState
        .creatorProfile,

      ...cloneValue(
        updates
      ),

      id:
        cleanCreatorId ||
        updates.id ||
        memoryState
          .creatorProfile
          .id ||
        null,

      communicationPreferences: {
        ...memoryState
          .creatorProfile
          .communicationPreferences,

        ...(updates
          .communicationPreferences ||
          {}),
      },

      mentorLearning: {
        ...memoryState
          .creatorProfile
          .mentorLearning,

        ...(updates
          .mentorLearning ||
          {}),
      },
    };

    const arrayFields = [
      "creatorTypes",
      "interests",
      "goals",
      "values",
      "creativeStrengths",
      "confidenceNotes",
    ];

    arrayFields.forEach(
      (fieldName) => {
        if (
          fieldName in updates
        ) {
          memoryState
            .creatorProfile[
              fieldName
            ] =
            normaliseStringArray(
              updates[
                fieldName
              ]
            );
        }
      }
    );

    return persist()
      .creatorProfile;
  }

  function addProfileListItem(
    fieldName,
    value
  ) {
    const allowedFields = [
      "creatorTypes",
      "interests",
      "goals",
      "values",
      "creativeStrengths",
      "confidenceNotes",
    ];

    if (
      !allowedFields.includes(
        fieldName
      )
    ) {
      return getCreatorProfile();
    }

    const cleanValue =
      normaliseString(
        value
      );

    if (
      !cleanValue ||
      containsSensitiveSecret(
        cleanValue
      )
    ) {
      return getCreatorProfile();
    }

    const currentValues =
      memoryState
        .creatorProfile[
          fieldName
        ] ||
      [];

    memoryState
      .creatorProfile[
        fieldName
      ] =
      normaliseStringArray([
        ...currentValues,
        cleanValue,
      ]);

    return persist()
      .creatorProfile;
  }

  /**
   * ----------------------------------------------------------
   * Ideas and Inspiration Drawer
   * ----------------------------------------------------------
   */

  function saveIdea({
    title = "",
    content = "",
    creatorType = "",

    status =
      IDEA_STATUSES.ACTIVE,

    source =
      MEMORY_SOURCES.CREATOR,

    certainty =
      MEMORY_CERTAINTY.EXPLICIT,

    confidence = 1,

    tags = [],

    importance =
      MEMORY_IMPORTANCE.MEDIUM,

    emotionalContext = null,

    relatedProjectId = null,

    memoryKey = null,

    metadata = {},
  } = {}) {
    const cleanTitle =
      normaliseString(
        title
      );

    const cleanContent =
      normaliseString(
        content
      );

    if (
      !cleanTitle &&
      !cleanContent
    ) {
      return null;
    }

    if (
      containsSensitiveSecret(
        cleanTitle,
        cleanContent,
        metadata
      )
    ) {
      return null;
    }

    const cleanProjectId =
      normaliseString(
        relatedProjectId
      ) ||
      null;

    const timestamp =
      createTimestamp();

    const resolvedMemoryKey =
      normaliseString(
        memoryKey
      ) ||
      normaliseString(
        metadata?.memoryKey
      ) ||
      null;

    if (resolvedMemoryKey) {
      const existing =
        findByMemoryKey(
          memoryState.ideas,
          resolvedMemoryKey,
          (entry) =>
            getEntryProjectId(
              entry
            ) ===
            cleanProjectId
        );

      if (
        existing &&
        isMemoryContextActive(
          existing
        )
      ) {
        existing.title =
          cleanTitle ||
          existing.title;

        existing.content =
          cleanContent ||
          existing.content;

        existing.creatorType =
          normaliseString(
            creatorType
          ) ||
          existing.creatorType;

        existing.status =
          normaliseEnumValue(
            status,
            IDEA_STATUSES,
            existing.status ||
              IDEA_STATUSES
                .ACTIVE
          );

        existing.tags =
          normaliseStringArray([
            ...normaliseArray(
              existing.tags
            ),

            ...normaliseArray(
              tags
            ),
          ]);

        existing.importance =
          normaliseEnumValue(
            importance,
            MEMORY_IMPORTANCE,
            existing.importance ||
              MEMORY_IMPORTANCE
                .MEDIUM
          );

        existing.relatedProjectId =
          cleanProjectId ||
          existing
            .relatedProjectId ||
          null;

        existing.emotionalContext =
          emotionalContext ??
          existing
            .emotionalContext ??
          null;

        existing.confidence =
          Math.max(
            normaliseConfidence(
              existing.confidence,
              0
            ),

            normaliseConfidence(
              confidence,
              0
            )
          );

        existing
          .reinforcementCount =
          normaliseCount(
            existing
              .reinforcementCount
          ) + 1;

        existing
          .lastReinforcedAt =
          timestamp;

        existing.lifecycleStatus =
          MEMORY_STATUSES
            .REINFORCED;

        existing.updatedAt =
          timestamp;

        existing.metadata = {
          ...(existing.metadata ||
            {}),

          ...cloneValue(
            metadata
          ),

          memoryKey:
            resolvedMemoryKey,
        };

        persist();

        return cloneValue(
          existing
        );
      }
    }

    const idea = {
      id:
        createMemoryId(
          "idea"
        ),

      memoryKey:
        resolvedMemoryKey,

      type:
        MEMORY_ENTRY_TYPES
          .IDEA,

      title:
        cleanTitle ||
        "Untitled idea",

      content:
        cleanContent,

      creatorType:
        normaliseString(
          creatorType
        ),

      status:
        normaliseEnumValue(
          status,
          IDEA_STATUSES,
          IDEA_STATUSES.ACTIVE
        ),

      lifecycleStatus:
        MEMORY_STATUSES.ACTIVE,

      ...createMemoryProvenance({
        source,
        certainty,
        confidence,
      }),

      tags:
        normaliseStringArray(
          tags
        ),

      importance:
        normaliseEnumValue(
          importance,
          MEMORY_IMPORTANCE,
          MEMORY_IMPORTANCE
            .MEDIUM
        ),

      emotionalContext,

      relatedProjectId:
        cleanProjectId,

      reinforcementCount: 0,
      lastReinforcedAt: null,

      metadata: {
        ...cloneValue(
          metadata
        ),

        memoryKey:
          resolvedMemoryKey,
      },

      createdAt:
        timestamp,

      updatedAt:
        timestamp,
    };

    memoryState.ideas.push(
      idea
    );

    persist();

    return cloneValue(
      idea
    );
  }

  function getIdeas({
    status = null,
    creatorType = null,
    tag = null,
    includeHistorical = false,
    limit = null,
  } = {}) {
    let ideas =
      sortNewestFirst(
        memoryState.ideas
      );

    if (!includeHistorical) {
      ideas =
        ideas.filter(
          isMemoryContextActive
        );
    }

    if (status) {
      ideas =
        ideas.filter(
          (idea) =>
            idea.status ===
            status
        );
    }

    if (creatorType) {
      ideas =
        ideas.filter(
          (idea) =>
            idea.creatorType ===
            creatorType
        );
    }

    if (tag) {
      ideas =
        ideas.filter(
          (idea) =>
            normaliseArray(
              idea.tags
            ).includes(tag)
        );
    }

    if (
      Number.isInteger(
        limit
      ) &&
      limit >= 0
    ) {
      ideas =
        ideas.slice(
          0,
          limit
        );
    }

    return cloneValue(
      ideas
    );
  }

  function getIdea(
    ideaId
  ) {
    return cloneValue(
      findById(
        memoryState.ideas,
        ideaId
      ) ||
      null
    );
  }

  function updateIdea(
    ideaId,
    updates = {}
  ) {
    const idea =
      findById(
        memoryState.ideas,
        ideaId
      );

    if (!idea) {
      return null;
    }

    if (
      containsSensitiveSecret(
        updates
      )
    ) {
      return null;
    }

    const safeUpdates =
      cloneValue(
        updates
      );

    delete safeUpdates.id;
    delete safeUpdates.type;
    delete safeUpdates.createdAt;

    Object.assign(
      idea,
      safeUpdates,
      {
        id:
          idea.id,

        type:
          MEMORY_ENTRY_TYPES
            .IDEA,

        updatedAt:
          createTimestamp(),
      }
    );

    if (
      "tags" in updates
    ) {
      idea.tags =
        normaliseStringArray(
          updates.tags
        );
    }

    if (
      "confidence" in
      updates
    ) {
      idea.confidence =
        normaliseConfidence(
          updates.confidence,
          idea.confidence ?? 1
        );
    }

    if (
      "status" in updates
    ) {
      idea.status =
        normaliseEnumValue(
          updates.status,
          IDEA_STATUSES,
          idea.status ||
            IDEA_STATUSES
              .ACTIVE
        );
    }

    persist();

    return cloneValue(
      idea
    );
  }

  function moveIdeaToInspirationDrawer(
    ideaId,
    reason = ""
  ) {
    const idea =
      findById(
        memoryState.ideas,
        ideaId
      );

    if (!idea) {
      return null;
    }

    const drawerHistory =
      Array.isArray(
        idea.metadata
          ?.drawerHistory
      )
        ? idea.metadata
            .drawerHistory
        : [];

    return updateIdea(
      ideaId,
      {
        status:
          IDEA_STATUSES
            .INSPIRATION_DRAWER,

        metadata: {
          ...(idea.metadata ||
            {}),

          drawerHistory: [
            ...drawerHistory,

            {
              reason:
                normaliseString(
                  reason
                ),

              movedAt:
                createTimestamp(),
            },
          ],
        },
      }
    );
  }

  function restoreIdeaFromInspirationDrawer(
    ideaId
  ) {
    return updateIdea(
      ideaId,
      {
        status:
          IDEA_STATUSES
            .ACTIVE,

        lifecycleStatus:
          MEMORY_STATUSES
            .ACTIVE,
      }
    );
  }

  function getInspirationDrawer({
    creatorType = null,
    limit = null,
  } = {}) {
    return getIdeas({
      status:
        IDEA_STATUSES
          .INSPIRATION_DRAWER,

      creatorType,
      limit,
    });
  }

  /**
   * ----------------------------------------------------------
   * Projects
   * ----------------------------------------------------------
   */

  function saveProject({
    title = "",
    description = "",
    creatorType = "",

    status =
      PROJECT_STATUSES.IDEA,

    relatedIdeaIds = [],
    tags = [],
    metadata = {},
  } = {}) {
    const cleanTitle =
      normaliseString(
        title
      );

    if (
      !cleanTitle ||
      containsSensitiveSecret(
        title,
        description,
        metadata
      )
    ) {
      return null;
    }

    const timestamp =
      createTimestamp();

    const resolvedStatus =
      normaliseEnumValue(
        status,
        PROJECT_STATUSES,
        PROJECT_STATUSES.IDEA
      );

    const project = {
      id:
        createMemoryId(
          "project"
        ),

      type:
        MEMORY_ENTRY_TYPES
          .PROJECT,

      title:
        cleanTitle,

      description:
        normaliseString(
          description
        ),

      creatorType:
        normaliseString(
          creatorType
        ),

      status:
        resolvedStatus,

      relatedIdeaIds:
        normaliseStringArray(
          relatedIdeaIds
        ),

      tags:
        normaliseStringArray(
          tags
        ),

      metadata:
        cloneValue(
          metadata
        ),

      createdAt:
        timestamp,

      updatedAt:
        timestamp,

      publishedAt:
        resolvedStatus ===
          PROJECT_STATUSES
            .PUBLISHED
          ? timestamp
          : null,

      completedAt:
        resolvedStatus ===
          PROJECT_STATUSES
            .COMPLETED
          ? timestamp
          : null,
    };

    memoryState
      .projects
      .push(project);

    if (
      resolvedStatus ===
        PROJECT_STATUSES
          .CREATING ||
      resolvedStatus ===
        PROJECT_STATUSES
          .REFINING
    ) {
      memoryState
        .journey
        .activeProjectId =
        project.id;
    }

    persist();

    return cloneValue(
      project
    );
  }

  function getProjects({
    status = null,
    creatorType = null,
    limit = null,
  } = {}) {
    let projects =
      sortNewestFirst(
        memoryState.projects
      );

    if (status) {
      projects =
        projects.filter(
          (project) =>
            project.status ===
            status
        );
    }

    if (creatorType) {
      projects =
        projects.filter(
          (project) =>
            project.creatorType ===
            creatorType
        );
    }

    if (
      Number.isInteger(
        limit
      ) &&
      limit >= 0
    ) {
      projects =
        projects.slice(
          0,
          limit
        );
    }

    return cloneValue(
      projects
    );
  }

  function getProject(
    projectId
  ) {
    return cloneValue(
      findById(
        memoryState.projects,
        projectId
      ) ||
      null
    );
  }

  function updateProject(
    projectId,
    updates = {}
  ) {
    const project =
      findById(
        memoryState.projects,
        projectId
      );

    if (!project) {
      return null;
    }

    if (
      containsSensitiveSecret(
        updates
      )
    ) {
      return null;
    }

    const safeUpdates =
      cloneValue(
        updates
      );

    delete safeUpdates.id;
    delete safeUpdates.type;
    delete safeUpdates.createdAt;

    Object.assign(
      project,
      safeUpdates,
      {
        id:
          project.id,

        type:
          MEMORY_ENTRY_TYPES
            .PROJECT,

        updatedAt:
          createTimestamp(),
      }
    );

    if (
      "tags" in updates
    ) {
      project.tags =
        normaliseStringArray(
          updates.tags
        );
    }

    if (
      "relatedIdeaIds" in
      updates
    ) {
      project.relatedIdeaIds =
        normaliseStringArray(
          updates.relatedIdeaIds
        );
    }

    if (
      "status" in updates
    ) {
      project.status =
        normaliseEnumValue(
          updates.status,
          PROJECT_STATUSES,
          project.status ||
            PROJECT_STATUSES
              .IDEA
        );
    }

    if (
      project.status ===
        PROJECT_STATUSES
          .PUBLISHED &&
      !project.publishedAt
    ) {
      project.publishedAt =
        createTimestamp();
    }

    if (
      project.status ===
        PROJECT_STATUSES
          .COMPLETED &&
      !project.completedAt
    ) {
      project.completedAt =
        createTimestamp();
    }

    if (
      project.status ===
        PROJECT_STATUSES
          .CREATING ||
      project.status ===
        PROJECT_STATUSES
          .REFINING
    ) {
      memoryState
        .journey
        .activeProjectId =
        project.id;
    }

    if (
      memoryState
        .journey
        .activeProjectId ===
        project.id &&
      [
        PROJECT_STATUSES
          .PUBLISHED,

        PROJECT_STATUSES
          .COMPLETED,

        PROJECT_STATUSES
          .ARCHIVED,
      ].includes(
        project.status
      )
    ) {
      memoryState
        .journey
        .activeProjectId =
        null;
    }

    persist();

    return cloneValue(
      project
    );
  }

  function getActiveProject() {
    const activeProjectId =
      memoryState
        .journey
        .activeProjectId;

    if (!activeProjectId) {
      return null;
    }

    return getProject(
      activeProjectId
    );
  }

  function setActiveProject(
    projectId
  ) {
    const project =
      findById(
        memoryState.projects,
        projectId
      );

    if (
      !project ||
      project.status ===
        PROJECT_STATUSES
          .ARCHIVED
    ) {
      return null;
    }

    memoryState
      .journey
      .activeProjectId =
      project.id;

    persist();

    return cloneValue(
      project
    );
  }

  /**
   * ----------------------------------------------------------
   * Project Memory
   * ----------------------------------------------------------
   */

  function saveProjectMemory(
    candidate = {}
  ) {
    if (
      !candidate ||
      typeof candidate !==
        "object"
    ) {
      return null;
    }

    if (
      containsSensitiveSecret(
        candidate
      )
    ) {
      return null;
    }

    const projectId =
      normaliseString(
        candidate.projectId
      );

    const content =
      normaliseString(
        candidate.content
      );

    const title =
      normaliseString(
        candidate.title
      );

    if (
      !projectId ||
      (
        !content &&
        candidate.value ==
          null
      )
    ) {
      return null;
    }

    /**
     * Project memory may never be persisted outside a real
     * project boundary.
     */
    if (
      !hasValidProjectBoundary({
        scope:
          MEMORY_SCOPES.PROJECT,

        projectId,
      })
    ) {
      return null;
    }

    const memoryKey =
      normaliseString(
        candidate.memoryKey
      ) ||
      normaliseString(
        candidate.metadata
          ?.memoryKey
      ) ||
      null;

    if (memoryKey) {
      const existing =
        findByMemoryKey(
          memoryState
            .projectMemories,

          memoryKey,

          (memory) =>
            memory.projectId ===
            projectId
        );

      if (
        existing &&
        isMemoryContextActive(
          existing
        ) &&
        existing.status !==
          MEMORY_STATUSES
            .RESOLVED
      ) {
        const timestamp =
          createTimestamp();

        const incoming = {
          source:
            normaliseEnumValue(
              candidate.source,
              MEMORY_SOURCES,
              MEMORY_SOURCES
                .UNKNOWN
            ),

          certainty:
            normaliseEnumValue(
              candidate.certainty,
              MEMORY_CERTAINTY,
              MEMORY_CERTAINTY
                .UNKNOWN
            ),

          value:
            candidate.value,

          content,
        };

        const existingValue =
          existing.value !==
          undefined
            ? existing.value
            : existing.content;

        const incomingValue =
          candidate.value !==
          undefined
            ? candidate.value
            : content;

        const sameTruth =
          valuesEquivalent(
            existingValue,
            incomingValue
          );

        const protectsTruth =
          !sameTruth &&
          shouldProtectExistingTruth({
            existing,
            incoming,
          });

        /**
         * A weaker signal can contribute evidence but may not
         * replace stronger project truth.
         */
        if (protectsTruth) {
          existing.evidence =
            normaliseStringArray([
              ...normaliseArray(
                existing.evidence
              ),

              ...normaliseArray(
                candidate.evidence
              ),
            ]);

          existing.metadata = {
            ...(existing.metadata ||
              {}),

            weakerConflictingSignals: [
              ...normaliseArray(
                existing.metadata
                  ?.weakerConflictingSignals
              ),

              {
                candidateId:
                  candidate.id ||
                  null,

                content:
                  content ||
                  null,

                value:
                  cloneValue(
                    candidate.value
                  ),

                source:
                  incoming.source,

                certainty:
                  incoming.certainty,

                confidence:
                  normaliseConfidence(
                    candidate.confidence,
                    0.5
                  ),

                observedAt:
                  timestamp,
              },
            ],

            lastProtectedAt:
              timestamp,
          };

          existing.updatedAt =
            timestamp;

          persist();

          return cloneValue(
            existing
          );
        }

        /**
         * saveProjectMemory is reinforcement, not silent
         * supersession. A genuine changed truth should travel
         * through supersedeMemory so historical truth survives.
         */
        if (!sameTruth) {
          existing.evidence =
            normaliseStringArray([
              ...normaliseArray(
                existing.evidence
              ),

              ...normaliseArray(
                candidate.evidence
              ),
            ]);

          existing.metadata = {
            ...(existing.metadata ||
              {}),

            pendingConflict: {
              candidateId:
                candidate.id ||
                null,

              content:
                content ||
                null,

              value:
                cloneValue(
                  candidate.value
                ),

              source:
                incoming.source,

              certainty:
                incoming.certainty,

              detectedAt:
                timestamp,

              requiresSupersession:
                true,
            },
          };

          existing.updatedAt =
            timestamp;

          persist();

          return cloneValue(
            existing
          );
        }

        existing.title =
          title ||
          existing.title;

        existing.content =
          content ||
          existing.content;

        existing.value =
          candidate.value !==
          undefined
            ? cloneValue(
                candidate.value
              )
            : existing.value;

        existing.confidence =
          Math.max(
            normaliseConfidence(
              existing.confidence,
              0
            ),

            normaliseConfidence(
              candidate.confidence,
              0
            )
          );

        existing.evidence =
          normaliseStringArray([
            ...normaliseArray(
              existing.evidence
            ),

            ...normaliseArray(
              candidate.evidence
            ),
          ]);

        existing.tags =
          normaliseStringArray([
            ...normaliseArray(
              existing.tags
            ),

            ...normaliseArray(
              candidate.tags
            ),
          ]);

        existing
          .reinforcementCount =
          normaliseCount(
            existing
              .reinforcementCount
          ) + 1;

        existing
          .lastReinforcedAt =
          timestamp;

        existing.lifecycleStatus =
          MEMORY_STATUSES
            .REINFORCED;

        if (
          existing.status !==
            MEMORY_STATUSES
              .CONFIRMED &&
          existing.status !==
            MEMORY_STATUSES
              .ESTABLISHED
        ) {
          existing.status =
            MEMORY_STATUSES
              .REINFORCED;
        }

        existing.updatedAt =
          timestamp;

        existing.metadata = {
          ...(existing.metadata ||
            {}),

          ...cloneValue(
            candidate.metadata ||
              {}
          ),

          memoryKey,
        };

        persist();

        return cloneValue(
          existing
        );
      }
    }

    const timestamp =
      createTimestamp();

    const memory = {
      id:
        createMemoryId(
          "project-memory"
        ),

      type:
        MEMORY_ENTRY_TYPES
          .PROJECT_MEMORY,

      memoryKey,

      category:
        normaliseString(
          candidate.category
        ) ||
        "project-context",

      title:
        title ||
        "Project memory",

      content,

      value:
        cloneValue(
          candidate.value
        ),

      horizon:
        normaliseEnumValue(
          candidate.horizon,
          MEMORY_HORIZONS,
          MEMORY_HORIZONS
            .LONG_TERM
        ),

      scope:
        MEMORY_SCOPES.PROJECT,

      importance:
        normaliseEnumValue(
          candidate.importance,
          MEMORY_IMPORTANCE,
          MEMORY_IMPORTANCE
            .MEDIUM
        ),

      status:
        normaliseEnumValue(
          candidate.status,
          MEMORY_STATUSES,
          MEMORY_STATUSES
            .EMERGING
        ),

      lifecycleStatus:
        MEMORY_STATUSES.ACTIVE,

      confidence:
        normaliseConfidence(
          candidate.confidence,
          0.5
        ),

      evidence:
        normaliseStringArray(
          candidate.evidence
        ),

      source:
        normaliseEnumValue(
          candidate.source,
          MEMORY_SOURCES,
          MEMORY_SOURCES.UNKNOWN
        ),

      certainty:
        normaliseEnumValue(
          candidate.certainty,
          MEMORY_CERTAINTY,
          MEMORY_CERTAINTY.UNKNOWN
        ),

      creatorId:
        normaliseString(
          candidate.creatorId
        ) ||
        cleanCreatorId ||
        null,

      projectId,

      sessionId:
        normaliseString(
          candidate.sessionId
        ) ||
        null,

      entityType:
        normaliseString(
          candidate.entityType
        ) ||
        null,

      entityId:
        normaliseString(
          candidate.entityId
        ) ||
        null,

      entityName:
        normaliseString(
          candidate.entityName
        ) ||
        null,

      tags:
        normaliseStringArray(
          candidate.tags
        ),

      recallPolicy:
        cloneValue(
          candidate.recallPolicy ||
            {
              automatic: true,

              timing:
                "next-relevant-moment",
            }
        ),

      reinforcementCount: 0,
      lastReinforcedAt: null,

      supersedesMemoryId:
        normaliseString(
          candidate
            .supersedesMemoryId
        ) ||
        normaliseString(
          candidate.metadata
            ?.supersedesMemoryId
        ) ||
        null,

      supersededByMemoryId:
        null,

      history:
        normaliseArray(
          candidate.history
        ),

      metadata: {
        ...cloneValue(
          candidate.metadata ||
            {}
        ),

        memoryKey,
        projectId,
      },

      createdAt:
        candidate.createdAt ||
        timestamp,

      updatedAt:
        timestamp,
    };

    memoryState
      .projectMemories
      .push(memory);

    persist();

    return cloneValue(
      memory
    );
  }

  function getProjectMemories({
    projectId = null,
    category = null,
    status = null,
    entityType = null,
    entityId = null,
    includeHistorical = false,
    limit = null,
  } = {}) {
    let memories =
      sortNewestFirst(
        memoryState
          .projectMemories
      );

    if (projectId) {
      memories =
        memories.filter(
          (memory) =>
            memory.projectId ===
            projectId
        );
    }

    if (category) {
      memories =
        memories.filter(
          (memory) =>
            memory.category ===
            category
        );
    }

    if (status) {
      memories =
        memories.filter(
          (memory) =>
            memory.status ===
            status
        );
    } else if (
      !includeHistorical
    ) {
      memories =
        memories.filter(
          isMemoryContextActive
        );
    }

    if (entityType) {
      memories =
        memories.filter(
          (memory) =>
            memory.entityType ===
            entityType
        );
    }

    if (entityId) {
      memories =
        memories.filter(
          (memory) =>
            memory.entityId ===
            entityId
        );
    }

    if (
      Number.isInteger(
        limit
      ) &&
      limit >= 0
    ) {
      memories =
        memories.slice(
          0,
          limit
        );
    }

    return cloneValue(
      memories
    );
  }

  function getProjectMemory(
    memoryId
  ) {
    return cloneValue(
      findById(
        memoryState
          .projectMemories,

        memoryId
      ) ||
      null
    );
  }

  function updateProjectMemory(
    memoryId,
    updates = {}
  ) {
    const memory =
      findById(
        memoryState
          .projectMemories,

        memoryId
      );

    if (!memory) {
      return null;
    }

    if (
      containsSensitiveSecret(
        updates
      )
    ) {
      return null;
    }

    const safeUpdates =
      cloneValue(
        updates
      );

    delete safeUpdates.id;
    delete safeUpdates.type;
    delete safeUpdates.projectId;
    delete safeUpdates.createdAt;

    Object.assign(
      memory,
      safeUpdates,
      {
        id:
          memory.id,

        type:
          MEMORY_ENTRY_TYPES
            .PROJECT_MEMORY,

        projectId:
          memory.projectId,

        createdAt:
          memory.createdAt,

        updatedAt:
          createTimestamp(),
      }
    );

    if (
      "confidence" in
      updates
    ) {
      memory.confidence =
        normaliseConfidence(
          updates.confidence,
          memory.confidence ??
            0.5
        );
    }

    if (
      "evidence" in
      updates
    ) {
      memory.evidence =
        normaliseStringArray(
          updates.evidence
        );
    }

    if (
      "tags" in updates
    ) {
      memory.tags =
        normaliseStringArray(
          updates.tags
        );
    }

    if (
      "status" in updates
    ) {
      memory.status =
        normaliseEnumValue(
          updates.status,
          MEMORY_STATUSES,
          memory.status ||
            MEMORY_STATUSES
              .EMERGING
        );
    }

    persist();

    return cloneValue(
      memory
    );
  }

  /**
   * ----------------------------------------------------------
   * Session Handoffs
   * ----------------------------------------------------------
   */

  function saveSessionHandoff(
    candidate = {}
  ) {
    if (
      !candidate ||
      typeof candidate !==
        "object"
    ) {
      return null;
    }

    if (
      containsSensitiveSecret(
        candidate
      )
    ) {
      return null;
    }

    const projectId =
      normaliseString(
        candidate.projectId
      );

    /**
     * Handoffs without projects are ambiguous and are refused.
     */
    if (!projectId) {
      return null;
    }

    const timestamp =
      createTimestamp();

    memoryState
      .sessionHandoffs
      .forEach(
        (handoff) => {
          if (
            handoff.projectId ===
              projectId &&
            handoff.status ===
              SESSION_HANDOFF_STATUSES
                .ACTIVE
          ) {
            handoff.status =
              SESSION_HANDOFF_STATUSES
                .SUPERSEDED;

            handoff.lifecycleStatus =
              MEMORY_STATUSES
                .SUPERSEDED;

            handoff.supersededAt =
              timestamp;

            handoff.updatedAt =
              timestamp;
          }
        }
      );

    const handoff = {
      id:
        createMemoryId(
          "session-handoff"
        ),

      type:
        MEMORY_ENTRY_TYPES
          .SESSION_HANDOFF,

      memoryKey:
        normaliseString(
          candidate.memoryKey
        ) ||
        normaliseString(
          candidate.metadata
            ?.memoryKey
        ) ||
        (
          `project::` +
          `session-handoff::` +
          `${projectId}`
        ),

      category:
        normaliseString(
          candidate.category
        ) ||
        "session-handoff",

      title:
        normaliseString(
          candidate.title
        ) ||
        "Creative session handoff",

      content:
        normaliseString(
          candidate.content
        ),

      value:
        cloneValue(
          candidate.value
        ),

      horizon:
        normaliseEnumValue(
          candidate.horizon,
          MEMORY_HORIZONS,
          MEMORY_HORIZONS
            .SHORT_TERM
        ),

      scope:
        MEMORY_SCOPES.PROJECT,

      importance:
        normaliseEnumValue(
          candidate.importance,
          MEMORY_IMPORTANCE,
          MEMORY_IMPORTANCE
            .HIGH
        ),

      status:
        SESSION_HANDOFF_STATUSES
          .ACTIVE,

      lifecycleStatus:
        MEMORY_STATUSES.ACTIVE,

      confidence:
        normaliseConfidence(
          candidate.confidence,
          0.96
        ),

      evidence:
        normaliseStringArray(
          candidate.evidence
        ),

      source:
        normaliseEnumValue(
          candidate.source,
          MEMORY_SOURCES,
          MEMORY_SOURCES
            .PROJECT_STATE
        ),

      certainty:
        normaliseEnumValue(
          candidate.certainty,
          MEMORY_CERTAINTY,
          MEMORY_CERTAINTY
            .CONFIRMED
        ),

      creatorId:
        normaliseString(
          candidate.creatorId
        ) ||
        cleanCreatorId ||
        null,

      projectId,

      sessionId:
        normaliseString(
          candidate.sessionId
        ) ||
        null,

      tags:
        normaliseStringArray([
          "session-handoff",
          "resume-context",

          ...normaliseArray(
            candidate.tags
          ),
        ]),

      recallPolicy:
        cloneValue(
          candidate.recallPolicy ||
            {
              automatic: true,

              timing:
                "next-session",
            }
        ),

      resumedAt: null,
      supersededAt: null,

      reinforcementCount: 0,
      lastReinforcedAt: null,

      metadata: {
        ...cloneValue(
          candidate.metadata ||
            {}
        ),

        projectId,
      },

      createdAt:
        timestamp,

      updatedAt:
        timestamp,
    };

    memoryState
      .sessionHandoffs
      .push(handoff);

    persist();

    return cloneValue(
      handoff
    );
  }

  function getSessionHandoffs({
    projectId = null,
    status = null,
    includeHistorical = false,
    limit = null,
  } = {}) {
    let handoffs =
      sortNewestFirst(
        memoryState
          .sessionHandoffs
      );

    if (projectId) {
      handoffs =
        handoffs.filter(
          (handoff) =>
            handoff.projectId ===
            projectId
        );
    }

    if (status) {
      handoffs =
        handoffs.filter(
          (handoff) =>
            handoff.status ===
            status
        );
    } else if (
      !includeHistorical
    ) {
      handoffs =
        handoffs.filter(
          (handoff) =>
            handoff.status ===
              SESSION_HANDOFF_STATUSES
                .ACTIVE &&
            isMemoryContextActive(
              handoff
            )
        );
    }

    if (
      Number.isInteger(
        limit
      ) &&
      limit >= 0
    ) {
      handoffs =
        handoffs.slice(
          0,
          limit
        );
    }

    return cloneValue(
      handoffs
    );
  }

  function getLatestSessionHandoff(
    projectId
  ) {
    const cleanProjectId =
      normaliseString(
        projectId
      );

    if (!cleanProjectId) {
      return null;
    }

    const handoffs =
      getSessionHandoffs({
        projectId:
          cleanProjectId,

        status:
          SESSION_HANDOFF_STATUSES
            .ACTIVE,

        limit: 1,
      });

    return (
      handoffs[0] ||
      null
    );
  }

  function markSessionHandoffResumed(
    handoffId
  ) {
    const handoff =
      findById(
        memoryState
          .sessionHandoffs,

        handoffId
      );

    if (!handoff) {
      return null;
    }

    const timestamp =
      createTimestamp();

    handoff.status =
      SESSION_HANDOFF_STATUSES
        .RESUMED;

    handoff.lifecycleStatus =
      MEMORY_STATUSES
        .RESOLVED;

    handoff.resumedAt =
      timestamp;

    handoff.updatedAt =
      timestamp;

    persist();

    return cloneValue(
      handoff
    );
  }

  /**
   * ----------------------------------------------------------
   * Conversations
   * ----------------------------------------------------------
   */

  function rememberConversation({
    summary = "",
    creatorMessage = "",
    mentorResponse = "",
    intent = null,
    emotionalState = null,
    creatorStage = null,
    strategies = [],
    relatedIdeaIds = [],
    relatedProjectIds = [],
    memorableMoments = [],
    metadata = {},
  } = {}) {
    const cleanSummary =
      normaliseString(
        summary
      );

    const cleanCreatorMessage =
      normaliseString(
        creatorMessage
      );

    const cleanMentorResponse =
      normaliseString(
        mentorResponse
      );

    if (
      !cleanSummary &&
      !cleanCreatorMessage &&
      !cleanMentorResponse
    ) {
      return null;
    }

    if (
      containsSensitiveSecret(
        cleanSummary,
        cleanCreatorMessage,
        cleanMentorResponse,
        metadata
      )
    ) {
      return null;
    }

    const timestamp =
      createTimestamp();

    const conversation = {
      id:
        createMemoryId(
          "conversation"
        ),

      type:
        MEMORY_ENTRY_TYPES
          .CONVERSATION,

      lifecycleStatus:
        MEMORY_STATUSES.ACTIVE,

      summary:
        cleanSummary,

      creatorMessage:
        cleanCreatorMessage,

      mentorResponse:
        cleanMentorResponse,

      intent,
      emotionalState,
      creatorStage,

      strategies:
        normaliseStringArray(
          strategies
        ),

      relatedIdeaIds:
        normaliseStringArray(
          relatedIdeaIds
        ),

      relatedProjectIds:
        normaliseStringArray(
          relatedProjectIds
        ),

      memorableMoments:
        normaliseStringArray(
          memorableMoments
        ),

      reinforcementCount: 0,
      lastReinforcedAt: null,

      metadata:
        cloneValue(
          metadata
        ),

      createdAt:
        timestamp,

      updatedAt:
        timestamp,
    };

    memoryState
      .conversations
      .push(conversation);

    memoryState
      .journey
      .recentStage =
      creatorStage ||
      memoryState
        .journey
        .recentStage;

    memoryState
      .journey
      .recentEmotionalState =
      emotionalState ||
      memoryState
        .journey
        .recentEmotionalState;

    persist();

    return cloneValue(
      conversation
    );
  }

  function getRecentConversations(
    limit = 10
  ) {
    const safeLimit =
      Number.isInteger(
        limit
      ) &&
      limit >= 0
        ? limit
        : 10;

    return cloneValue(
      sortNewestFirst(
        memoryState
          .conversations
      )
        .filter(
          isMemoryContextActive
        )
        .slice(
          0,
          safeLimit
        )
    );
  }

  /**
   * ----------------------------------------------------------
   * Observations and Patterns
   * ----------------------------------------------------------
   */

  function addObservation({
    text = "",
    category = "general",
    evidence = [],
    confidence = 0.5,

    importance =
      MEMORY_IMPORTANCE.MEDIUM,

    status =
      PATTERN_STATUSES.EMERGING,

    permissionToReflect = false,

    source =
      MEMORY_SOURCES.INFERRED,

    certainty =
      MEMORY_CERTAINTY.OBSERVED,

    memoryKey = null,

    projectId = null,
    scope = null,

    metadata = {},
  } = {}) {
    const cleanText =
      normaliseString(
        text
      );

    if (
      !cleanText ||
      containsSensitiveSecret(
        cleanText,
        metadata
      )
    ) {
      return null;
    }

    const resolvedMemoryKey =
      normaliseString(
        memoryKey
      ) ||
      normaliseString(
        metadata?.memoryKey
      ) ||
      null;

    const cleanProjectId =
      normaliseString(
        projectId
      ) ||
      normaliseString(
        metadata?.projectId
      ) ||
      null;

    const resolvedScope =
      normaliseEnumValue(
        scope,
        MEMORY_SCOPES,
        cleanProjectId
          ? MEMORY_SCOPES
              .PROJECT
          : MEMORY_SCOPES
              .CREATOR
      );

    if (
      resolvedScope ===
        MEMORY_SCOPES
          .PROJECT &&
      !cleanProjectId
    ) {
      return null;
    }

    const timestamp =
      createTimestamp();

    if (resolvedMemoryKey) {
      const existing =
        findByMemoryKey(
          memoryState
            .observations,

          resolvedMemoryKey,

          (entry) =>
            getEntryProjectId(
              entry
            ) ===
            cleanProjectId
        );

      if (
        existing &&
        isMemoryContextActive(
          existing
        )
      ) {
        existing.text =
          cleanText;

        existing.category =
          normaliseString(
            category
          ) ||
          existing.category ||
          "general";

        existing.evidence =
          normaliseStringArray([
            ...normaliseArray(
              existing.evidence
            ),

            ...normaliseArray(
              evidence
            ),
          ]);

        existing.confidence =
          Math.max(
            normaliseConfidence(
              existing.confidence,
              0
            ),

            normaliseConfidence(
              confidence,
              0
            )
          );

        existing.importance =
          normaliseEnumValue(
            importance,
            MEMORY_IMPORTANCE,
            existing.importance ||
              MEMORY_IMPORTANCE
                .MEDIUM
          );

        existing
          .permissionToReflect =
          Boolean(
            existing
              .permissionToReflect ||
            permissionToReflect
          );

        existing
          .reinforcementCount =
          normaliseCount(
            existing
              .reinforcementCount
          ) + 1;

        existing
          .lastReinforcedAt =
          timestamp;

        existing.lifecycleStatus =
          MEMORY_STATUSES
            .REINFORCED;

        existing.updatedAt =
          timestamp;

        existing.metadata = {
          ...(existing.metadata ||
            {}),

          ...cloneValue(
            metadata
          ),

          memoryKey:
            resolvedMemoryKey,

          projectId:
            cleanProjectId,
        };

        persist();

        return cloneValue(
          existing
        );
      }
    }

    const observation = {
      id:
        createMemoryId(
          "observation"
        ),

      memoryKey:
        resolvedMemoryKey,

      type:
        MEMORY_ENTRY_TYPES
          .OBSERVATION,

      lifecycleStatus:
        MEMORY_STATUSES.ACTIVE,

      text:
        cleanText,

      category:
        normaliseString(
          category
        ) ||
        "general",

      evidence:
        normaliseStringArray(
          evidence
        ),

      confidence:
        normaliseConfidence(
          confidence
        ),

      importance:
        normaliseEnumValue(
          importance,
          MEMORY_IMPORTANCE,
          MEMORY_IMPORTANCE
            .MEDIUM
        ),

      status:
        normaliseEnumValue(
          status,
          PATTERN_STATUSES,
          PATTERN_STATUSES
            .EMERGING
        ),

      source:
        normaliseEnumValue(
          source,
          MEMORY_SOURCES,
          MEMORY_SOURCES.UNKNOWN
        ),

      certainty:
        normaliseEnumValue(
          certainty,
          MEMORY_CERTAINTY,
          MEMORY_CERTAINTY
            .UNKNOWN
        ),

      scope:
        resolvedScope,

      projectId:
        cleanProjectId,

      permissionToReflect:
        Boolean(
          permissionToReflect
        ),

      reflectionCount: 0,
      reinforcementCount: 0,

      lastReflectedAt: null,
      lastReinforcedAt: null,

      creatorResponse: null,

      metadata: {
        ...cloneValue(
          metadata
        ),

        memoryKey:
          resolvedMemoryKey,

        projectId:
          cleanProjectId,
      },

      createdAt:
        timestamp,

      updatedAt:
        timestamp,
    };

    memoryState
      .observations
      .push(observation);

    persist();

    return cloneValue(
      observation
    );
  }

  function getObservations({
    category = null,
    status = null,
    minimumConfidence = 0,
    reflectableOnly = false,
    includeHistorical = false,
    limit = null,
  } = {}) {
    let observations =
      sortNewestFirst(
        memoryState
          .observations
      ).filter(
        (observation) =>
          normaliseConfidence(
            observation
              .confidence,
            0
          ) >=
          normaliseConfidence(
            minimumConfidence,
            0
          )
      );

    if (!includeHistorical) {
      observations =
        observations.filter(
          isMemoryContextActive
        );
    }

    if (category) {
      observations =
        observations.filter(
          (observation) =>
            observation.category ===
            category
        );
    }

    if (status) {
      observations =
        observations.filter(
          (observation) =>
            observation.status ===
            status
        );
    }

    if (reflectableOnly) {
      observations =
        observations.filter(
          (observation) =>
            observation
              .permissionToReflect
        );
    }

    if (
      Number.isInteger(
        limit
      ) &&
      limit >= 0
    ) {
      observations =
        observations.slice(
          0,
          limit
        );
    }

    return cloneValue(
      observations
    );
  }

  function updateObservation(
    observationId,
    updates = {}
  ) {
    const observation =
      findById(
        memoryState
          .observations,

        observationId
      );

    if (!observation) {
      return null;
    }

    if (
      containsSensitiveSecret(
        updates
      )
    ) {
      return null;
    }

    const safeUpdates =
      cloneValue(
        updates
      );

    delete safeUpdates.id;
    delete safeUpdates.type;
    delete safeUpdates.createdAt;

    Object.assign(
      observation,
      safeUpdates,
      {
        id:
          observation.id,

        type:
          MEMORY_ENTRY_TYPES
            .OBSERVATION,

        updatedAt:
          createTimestamp(),
      }
    );

    if (
      "evidence" in
      updates
    ) {
      observation.evidence =
        normaliseStringArray(
          updates.evidence
        );
    }

    if (
      "confidence" in
      updates
    ) {
      observation.confidence =
        normaliseConfidence(
          updates.confidence
        );
    }

    if (
      "status" in updates
    ) {
      observation.status =
        normaliseEnumValue(
          updates.status,
          PATTERN_STATUSES,
          observation.status ||
            PATTERN_STATUSES
              .EMERGING
        );
    }

    persist();

    return cloneValue(
      observation
    );
  }

  function markObservationReflected(
    observationId,
    creatorResponse = null
  ) {
    const observation =
      findById(
        memoryState
          .observations,

        observationId
      );

    if (!observation) {
      return null;
    }

    if (
      creatorResponse !== null &&
      containsSensitiveSecret(
        creatorResponse
      )
    ) {
      return null;
    }

    observation
      .reflectionCount =
      normaliseCount(
        observation
          .reflectionCount
      ) + 1;

    observation
      .lastReflectedAt =
      createTimestamp();

    if (
      creatorResponse !==
      null
    ) {
      observation
        .creatorResponse =
        normaliseString(
          creatorResponse
        );
    }

    observation.updatedAt =
      createTimestamp();

    persist();

    return cloneValue(
      observation
    );
  }

  function savePattern({
    name = "",
    description = "",
    category = "creative",
    evidence = [],
    confidence = 0.5,

    status =
      PATTERN_STATUSES.EMERGING,

    positiveReflection = "",

    source =
      MEMORY_SOURCES.INFERRED,

    certainty =
      MEMORY_CERTAINTY.INFERRED,

    memoryKey = null,

    projectId = null,
    scope = null,

    metadata = {},
  } = {}) {
    const cleanName =
      normaliseString(
        name
      );

    if (
      !cleanName ||
      containsSensitiveSecret(
        cleanName,
        description,
        metadata
      )
    ) {
      return null;
    }

    const resolvedMemoryKey =
      normaliseString(
        memoryKey
      ) ||
      normaliseString(
        metadata?.memoryKey
      ) ||
      null;

    const cleanProjectId =
      normaliseString(
        projectId
      ) ||
      normaliseString(
        metadata?.projectId
      ) ||
      null;

    const resolvedScope =
      normaliseEnumValue(
        scope,
        MEMORY_SCOPES,
        cleanProjectId
          ? MEMORY_SCOPES
              .PROJECT
          : MEMORY_SCOPES
              .CREATOR
      );

    if (
      resolvedScope ===
        MEMORY_SCOPES
          .PROJECT &&
      !cleanProjectId
    ) {
      return null;
    }

    const timestamp =
      createTimestamp();

    if (resolvedMemoryKey) {
      const existing =
        findByMemoryKey(
          memoryState.patterns,

          resolvedMemoryKey,

          (entry) =>
            getEntryProjectId(
              entry
            ) ===
            cleanProjectId
        );

      if (
        existing &&
        isMemoryContextActive(
          existing
        )
      ) {
        existing.name =
          cleanName;

        existing.description =
          normaliseString(
            description
          ) ||
          existing.description;

        existing.category =
          normaliseString(
            category
          ) ||
          existing.category ||
          "creative";

        existing.evidence =
          normaliseStringArray([
            ...normaliseArray(
              existing.evidence
            ),

            ...normaliseArray(
              evidence
            ),
          ]);

        existing.confidence =
          Math.max(
            normaliseConfidence(
              existing.confidence,
              0
            ),

            normaliseConfidence(
              confidence,
              0
            )
          );

        existing
          .positiveReflection =
          normaliseString(
            positiveReflection
          ) ||
          existing
            .positiveReflection;

        existing
          .reinforcementCount =
          normaliseCount(
            existing
              .reinforcementCount
          ) + 1;

        existing
          .lastReinforcedAt =
          timestamp;

        existing.lifecycleStatus =
          MEMORY_STATUSES
            .REINFORCED;

        existing.updatedAt =
          timestamp;

        existing.metadata = {
          ...(existing.metadata ||
            {}),

          ...cloneValue(
            metadata
          ),

          memoryKey:
            resolvedMemoryKey,

          projectId:
            cleanProjectId,
        };

        persist();

        return cloneValue(
          existing
        );
      }
    }

    const pattern = {
      id:
        createMemoryId(
          "pattern"
        ),

      memoryKey:
        resolvedMemoryKey,

      type:
        MEMORY_ENTRY_TYPES
          .PATTERN,

      lifecycleStatus:
        MEMORY_STATUSES.ACTIVE,

      name:
        cleanName,

      description:
        normaliseString(
          description
        ),

      category:
        normaliseString(
          category
        ) ||
        "creative",

      evidence:
        normaliseStringArray(
          evidence
        ),

      confidence:
        normaliseConfidence(
          confidence
        ),

      status:
        normaliseEnumValue(
          status,
          PATTERN_STATUSES,
          PATTERN_STATUSES
            .EMERGING
        ),

      source:
        normaliseEnumValue(
          source,
          MEMORY_SOURCES,
          MEMORY_SOURCES.UNKNOWN
        ),

      certainty:
        normaliseEnumValue(
          certainty,
          MEMORY_CERTAINTY,
          MEMORY_CERTAINTY
            .UNKNOWN
        ),

      scope:
        resolvedScope,

      projectId:
        cleanProjectId,

      positiveReflection:
        normaliseString(
          positiveReflection
        ),

      reinforcementCount: 0,
      lastReinforcedAt: null,

      metadata: {
        ...cloneValue(
          metadata
        ),

        memoryKey:
          resolvedMemoryKey,

        projectId:
          cleanProjectId,
      },

      createdAt:
        timestamp,

      updatedAt:
        timestamp,
    };

    memoryState
      .patterns
      .push(pattern);

    persist();

    return cloneValue(
      pattern
    );
  }

  function getPatterns({
    status = null,
    minimumConfidence = 0,
    includeHistorical = false,
    limit = null,
  } = {}) {
    let patterns =
      sortNewestFirst(
        memoryState.patterns
      ).filter(
        (pattern) =>
          normaliseConfidence(
            pattern.confidence,
            0
          ) >=
          normaliseConfidence(
            minimumConfidence,
            0
          )
      );

    if (!includeHistorical) {
      patterns =
        patterns.filter(
          isMemoryContextActive
        );
    }

    if (status) {
      patterns =
        patterns.filter(
          (pattern) =>
            pattern.status ===
            status
        );
    }

    if (
      Number.isInteger(
        limit
      ) &&
      limit >= 0
    ) {
      patterns =
        patterns.slice(
          0,
          limit
        );
    }

    return cloneValue(
      patterns
    );
  }

  /**
   * ----------------------------------------------------------
   * Deferred Memory
   * ----------------------------------------------------------
   */

  function saveDeferredMemory({
    content = "",
    title = "",
    category = "general",
    reason = "",

    source =
      MEMORY_SOURCES.CREATOR,

    certainty =
      MEMORY_CERTAINTY.EXPLICIT,

    confidence = 1,

    importance =
      MEMORY_IMPORTANCE.MEDIUM,

    relatedProjectIds = [],
    relatedIdeaIds = [],
    triggerTerms = [],
    tags = [],

    memoryKey = null,

    metadata = {},
  } = {}) {
    const cleanContent =
      normaliseString(
        content
      );

    const cleanTitle =
      normaliseString(
        title
      );

    if (
      !cleanContent &&
      !cleanTitle
    ) {
      return null;
    }

    if (
      containsSensitiveSecret(
        cleanContent,
        cleanTitle,
        metadata
      )
    ) {
      return null;
    }

    const cleanRelatedProjectIds =
      normaliseStringArray(
        relatedProjectIds
      );

    const metadataScope =
      normaliseString(
        metadata?.scope
      );

    if (
      metadataScope ===
        MEMORY_SCOPES.PROJECT &&
      cleanRelatedProjectIds
        .length === 0 &&
      !normaliseString(
        metadata?.projectId
      )
    ) {
      return null;
    }

    const resolvedMemoryKey =
      normaliseString(
        memoryKey
      ) ||
      normaliseString(
        metadata?.memoryKey
      ) ||
      null;

    const timestamp =
      createTimestamp();

    if (resolvedMemoryKey) {
      const existing =
        findByMemoryKey(
          memoryState
            .deferredMemories,

          resolvedMemoryKey,

          (entry) => {
            const existingIds =
              normaliseStringArray(
                entry
                  .relatedProjectIds
              );

            if (
              cleanRelatedProjectIds
                .length === 0
            ) {
              return (
                existingIds.length ===
                0
              );
            }

            return (
              existingIds.some(
                (id) =>
                  cleanRelatedProjectIds
                    .includes(id)
              )
            );
          }
        );

      if (
        existing &&
        isMemoryContextActive(
          existing
        )
      ) {
        existing.title =
          cleanTitle ||
          existing.title;

        existing.content =
          cleanContent ||
          existing.content;

        existing.category =
          normaliseString(
            category
          ) ||
          existing.category ||
          "general";

        existing.reason =
          normaliseString(
            reason
          ) ||
          existing.reason;

        existing
          .relatedProjectIds =
          normaliseStringArray([
            ...normaliseArray(
              existing
                .relatedProjectIds
            ),

            ...cleanRelatedProjectIds,
          ]);

        existing.relatedIdeaIds =
          normaliseStringArray([
            ...normaliseArray(
              existing
                .relatedIdeaIds
            ),

            ...normaliseArray(
              relatedIdeaIds
            ),
          ]);

        existing.triggerTerms =
          normaliseStringArray([
            ...normaliseArray(
              existing
                .triggerTerms
            ),

            ...normaliseArray(
              triggerTerms
            ),
          ]);

        existing.tags =
          normaliseStringArray([
            ...normaliseArray(
              existing.tags
            ),

            ...normaliseArray(
              tags
            ),
          ]);

        existing.confidence =
          Math.max(
            normaliseConfidence(
              existing.confidence,
              0
            ),

            normaliseConfidence(
              confidence,
              0
            )
          );

        existing
          .reinforcementCount =
          normaliseCount(
            existing
              .reinforcementCount
          ) + 1;

        existing
          .lastReinforcedAt =
          timestamp;

        existing.lifecycleStatus =
          MEMORY_STATUSES
            .REINFORCED;

        existing.updatedAt =
          timestamp;

        existing.metadata = {
          ...(existing.metadata ||
            {}),

          ...cloneValue(
            metadata
          ),

          memoryKey:
            resolvedMemoryKey,
        };

        persist();

        return cloneValue(
          existing
        );
      }
    }

    const deferredMemory = {
      id:
        createMemoryId(
          "deferred"
        ),

      memoryKey:
        resolvedMemoryKey,

      type:
        MEMORY_ENTRY_TYPES
          .DEFERRED,

      lifecycleStatus:
        MEMORY_STATUSES.ACTIVE,

      title:
        cleanTitle,

      content:
        cleanContent,

      category:
        normaliseString(
          category
        ) ||
        "general",

      reason:
        normaliseString(
          reason
        ),

      status:
        DEFERRED_MEMORY_STATUSES
          .WAITING,

      ...createMemoryProvenance({
        source,
        certainty,
        confidence,
      }),

      importance:
        normaliseEnumValue(
          importance,
          MEMORY_IMPORTANCE,
          MEMORY_IMPORTANCE
            .MEDIUM
        ),

      relatedProjectIds:
        cleanRelatedProjectIds,

      relatedIdeaIds:
        normaliseStringArray(
          relatedIdeaIds
        ),

      triggerTerms:
        normaliseStringArray(
          triggerTerms
        ),

      tags:
        normaliseStringArray(
          tags
        ),

      recallCount: 0,
      reinforcementCount: 0,

      lastRecalledAt: null,
      lastReinforcedAt: null,
      recalledAt: null,
      dismissedAt: null,

      metadata: {
        ...cloneValue(
          metadata
        ),

        memoryKey:
          resolvedMemoryKey,
      },

      createdAt:
        timestamp,

      updatedAt:
        timestamp,
    };

    memoryState
      .deferredMemories
      .push(
        deferredMemory
      );

    persist();

    return cloneValue(
      deferredMemory
    );
  }

  function getDeferredMemories({
    status = null,
    category = null,
    minimumConfidence = 0,
    includeHistorical = false,
    limit = null,
  } = {}) {
    let memories =
      sortNewestFirst(
        memoryState
          .deferredMemories
      ).filter(
        (memory) =>
          normaliseConfidence(
            memory.confidence,
            0
          ) >=
          normaliseConfidence(
            minimumConfidence,
            0
          )
      );

    if (!includeHistorical) {
      memories =
        memories.filter(
          isMemoryContextActive
        );
    }

    if (status) {
      memories =
        memories.filter(
          (memory) =>
            memory.status ===
            status
        );
    }

    if (category) {
      memories =
        memories.filter(
          (memory) =>
            memory.category ===
            category
        );
    }

    if (
      Number.isInteger(
        limit
      ) &&
      limit >= 0
    ) {
      memories =
        memories.slice(
          0,
          limit
        );
    }

    return cloneValue(
      memories
    );
  }

  function getDeferredMemory(
    memoryId
  ) {
    return cloneValue(
      findById(
        memoryState
          .deferredMemories,

        memoryId
      ) ||
      null
    );
  }

  function updateDeferredMemory(
    memoryId,
    updates = {}
  ) {
    const deferredMemory =
      findById(
        memoryState
          .deferredMemories,

        memoryId
      );

    if (!deferredMemory) {
      return null;
    }

    if (
      containsSensitiveSecret(
        updates
      )
    ) {
      return null;
    }

    const safeUpdates =
      cloneValue(
        updates
      );

    delete safeUpdates.id;
    delete safeUpdates.type;
    delete safeUpdates.createdAt;

    Object.assign(
      deferredMemory,
      safeUpdates,
      {
        id:
          deferredMemory.id,

        type:
          MEMORY_ENTRY_TYPES
            .DEFERRED,

        updatedAt:
          createTimestamp(),
      }
    );

    [
      "relatedProjectIds",
      "relatedIdeaIds",
      "triggerTerms",
      "tags",
    ].forEach(
      (fieldName) => {
        if (
          fieldName in updates
        ) {
          deferredMemory[
            fieldName
          ] =
            normaliseStringArray(
              updates[
                fieldName
              ]
            );
        }
      }
    );

    if (
      "confidence" in
      updates
    ) {
      deferredMemory
        .confidence =
        normaliseConfidence(
          updates.confidence,
          deferredMemory
            .confidence ?? 1
        );
    }

    if (
      "status" in updates
    ) {
      deferredMemory.status =
        normaliseEnumValue(
          updates.status,
          DEFERRED_MEMORY_STATUSES,
          deferredMemory.status ||
            DEFERRED_MEMORY_STATUSES
              .WAITING
        );
    }

    persist();

    return cloneValue(
      deferredMemory
    );
  }

  function markDeferredMemoryReady(
    memoryId
  ) {
    return updateDeferredMemory(
      memoryId,
      {
        status:
          DEFERRED_MEMORY_STATUSES
            .READY,
      }
    );
  }

  function markDeferredMemoryRecalled(
    memoryId
  ) {
    const deferredMemory =
      findById(
        memoryState
          .deferredMemories,

        memoryId
      );

    if (!deferredMemory) {
      return null;
    }

    const timestamp =
      createTimestamp();

    deferredMemory.status =
      DEFERRED_MEMORY_STATUSES
        .RECALLED;

    deferredMemory.recallCount =
      normaliseCount(
        deferredMemory
          .recallCount
      ) + 1;

    deferredMemory.lastRecalledAt =
      timestamp;

    deferredMemory.recalledAt =
      deferredMemory
        .recalledAt ||
      timestamp;

    deferredMemory.updatedAt =
      timestamp;

    persist();

    return cloneValue(
      deferredMemory
    );
  }

  function dismissDeferredMemory(
    memoryId,
    reason = ""
  ) {
    const deferredMemory =
      findById(
        memoryState
          .deferredMemories,

        memoryId
      );

    if (!deferredMemory) {
      return null;
    }

    const timestamp =
      createTimestamp();

    deferredMemory.status =
      DEFERRED_MEMORY_STATUSES
        .DISMISSED;

    deferredMemory.lifecycleStatus =
      MEMORY_STATUSES
        .DISMISSED;

    deferredMemory.dismissedAt =
      timestamp;

    deferredMemory.metadata = {
      ...(deferredMemory.metadata ||
        {}),

      dismissalReason:
        normaliseString(
          reason
        ),
    };

    deferredMemory.updatedAt =
      timestamp;

    persist();

    return cloneValue(
      deferredMemory
    );
  }

  function findRelevantDeferredMemories({
    message = "",
    projectId = null,
    ideaId = null,
    tags = [],
    limit = 5,
  } = {}) {
    const cleanMessage =
      normaliseComparableText(
        message
      );

    const cleanProjectId =
      normaliseString(
        projectId
      ) ||
      null;

    const requestedTags =
      normaliseStringArray(
        tags
      ).map(
        normaliseComparableText
      );

    const candidates =
      memoryState
        .deferredMemories
        .filter(
          (memory) =>
            isMemoryContextActive(
              memory
            ) &&
            isRelevantToProject(
              memory,
              cleanProjectId
            )
        )
        .map(
          (memory) => {
            let relevanceScore =
              0;

            if (
              cleanProjectId &&
              normaliseArray(
                memory
                  .relatedProjectIds
              ).includes(
                cleanProjectId
              )
            ) {
              relevanceScore += 4;
            }

            if (
              ideaId &&
              normaliseArray(
                memory
                  .relatedIdeaIds
              ).includes(
                ideaId
              )
            ) {
              relevanceScore += 4;
            }

            const memoryTags =
              normaliseArray(
                memory.tags
              )
                .map(
                  normaliseComparableText
                )
                .filter(Boolean);

            requestedTags.forEach(
              (tag) => {
                if (
                  memoryTags.includes(
                    tag
                  )
                ) {
                  relevanceScore += 2;
                }
              }
            );

            const triggerTerms =
              normaliseArray(
                memory
                  .triggerTerms
              )
                .map(
                  normaliseComparableText
                )
                .filter(Boolean);

            triggerTerms.forEach(
              (term) => {
                if (
                  cleanMessage &&
                  cleanMessage.includes(
                    term
                  )
                ) {
                  relevanceScore += 3;
                }
              }
            );

            if (
              memory.status ===
              DEFERRED_MEMORY_STATUSES
                .READY
            ) {
              relevanceScore += 2;
            }

            return {
              memory,
              relevanceScore,
            };
          }
        )
        .filter(
          (candidate) =>
            candidate
              .relevanceScore >
            0
        )
        .sort(
          (a, b) => {
            if (
              b.relevanceScore !==
              a.relevanceScore
            ) {
              return (
                b.relevanceScore -
                a.relevanceScore
              );
            }

            return (
              new Date(
                b.memory
                  .updatedAt ||
                  b.memory
                    .createdAt ||
                  0
              ).getTime() -
              new Date(
                a.memory
                  .updatedAt ||
                  a.memory
                    .createdAt ||
                  0
              ).getTime()
            );
          }
        )
        .slice(
          0,
          Number.isInteger(
            limit
          ) &&
            limit >= 0
            ? limit
            : 5
        );

    return cloneValue(
      candidates
    );
  }

  /**
   * ----------------------------------------------------------
   * Milestones and Reflections
   * ----------------------------------------------------------
   */

  function addMilestone({
    title = "",
    description = "",
    relatedProjectId = null,

    significance =
      MEMORY_IMPORTANCE.HIGH,

    memoryKey = null,

    metadata = {},
  } = {}) {
    const cleanTitle =
      normaliseString(
        title
      );

    if (
      !cleanTitle ||
      containsSensitiveSecret(
        title,
        description,
        metadata
      )
    ) {
      return null;
    }

    const resolvedMemoryKey =
      normaliseString(
        memoryKey
      ) ||
      normaliseString(
        metadata?.memoryKey
      ) ||
      null;

    const cleanProjectId =
      normaliseString(
        relatedProjectId
      ) ||
      null;

    const timestamp =
      createTimestamp();

    if (resolvedMemoryKey) {
      const existing =
        findByMemoryKey(
          memoryState
            .milestones,

          resolvedMemoryKey,

          (entry) =>
            getEntryProjectId(
              entry
            ) ===
            cleanProjectId
        );

      if (
        existing &&
        isMemoryContextActive(
          existing
        )
      ) {
        existing.title =
          cleanTitle;

        existing.description =
          normaliseString(
            description
          ) ||
          existing.description;

        existing.significance =
          normaliseEnumValue(
            significance,
            MEMORY_IMPORTANCE,
            existing.significance ||
              MEMORY_IMPORTANCE
                .HIGH
          );

        existing
          .reinforcementCount =
          normaliseCount(
            existing
              .reinforcementCount
          ) + 1;

        existing
          .lastReinforcedAt =
          timestamp;

        existing.lifecycleStatus =
          MEMORY_STATUSES
            .REINFORCED;

        existing.updatedAt =
          timestamp;

        existing.metadata = {
          ...(existing.metadata ||
            {}),

          ...cloneValue(
            metadata
          ),

          memoryKey:
            resolvedMemoryKey,
        };

        persist();

        return cloneValue(
          existing
        );
      }
    }

    const milestone = {
      id:
        createMemoryId(
          "milestone"
        ),

      memoryKey:
        resolvedMemoryKey,

      type:
        MEMORY_ENTRY_TYPES
          .MILESTONE,

      lifecycleStatus:
        MEMORY_STATUSES.ACTIVE,

      title:
        cleanTitle,

      description:
        normaliseString(
          description
        ),

      relatedProjectId:
        cleanProjectId,

      significance:
        normaliseEnumValue(
          significance,
          MEMORY_IMPORTANCE,
          MEMORY_IMPORTANCE
            .HIGH
        ),

      reinforcementCount: 0,
      lastReinforcedAt: null,

      metadata: {
        ...cloneValue(
          metadata
        ),

        memoryKey:
          resolvedMemoryKey,
      },

      createdAt:
        timestamp,

      updatedAt:
        timestamp,
    };

    memoryState
      .milestones
      .push(milestone);

    persist();

    return cloneValue(
      milestone
    );
  }

  function getMilestones(
    limit = null,
    {
      includeHistorical =
        false,
    } = {}
  ) {
    let milestones =
      sortNewestFirst(
        memoryState
          .milestones
      );

    if (!includeHistorical) {
      milestones =
        milestones.filter(
          isMemoryContextActive
        );
    }

    if (
      Number.isInteger(
        limit
      ) &&
      limit >= 0
    ) {
      milestones =
        milestones.slice(
          0,
          limit
        );
    }

    return cloneValue(
      milestones
    );
  }

  function saveReflection({
    text = "",

    source =
      MEMORY_SOURCES.CREATOR,

    relatedObservationIds = [],
    relatedProjectIds = [],

    memoryKey = null,

    metadata = {},
  } = {}) {
    const cleanText =
      normaliseString(
        text
      );

    if (
      !cleanText ||
      containsSensitiveSecret(
        cleanText,
        metadata
      )
    ) {
      return null;
    }

    const resolvedMemoryKey =
      normaliseString(
        memoryKey
      ) ||
      normaliseString(
        metadata?.memoryKey
      ) ||
      null;

    const timestamp =
      createTimestamp();

    if (resolvedMemoryKey) {
      const existing =
        findByMemoryKey(
          memoryState
            .reflections,

          resolvedMemoryKey
        );

      if (
        existing &&
        isMemoryContextActive(
          existing
        )
      ) {
        existing.text =
          cleanText;

        existing
          .relatedObservationIds =
          normaliseStringArray([
            ...normaliseArray(
              existing
                .relatedObservationIds
            ),

            ...normaliseArray(
              relatedObservationIds
            ),
          ]);

        existing
          .relatedProjectIds =
          normaliseStringArray([
            ...normaliseArray(
              existing
                .relatedProjectIds
            ),

            ...normaliseArray(
              relatedProjectIds
            ),
          ]);

        existing
          .reinforcementCount =
          normaliseCount(
            existing
              .reinforcementCount
          ) + 1;

        existing
          .lastReinforcedAt =
          timestamp;

        existing.lifecycleStatus =
          MEMORY_STATUSES
            .REINFORCED;

        existing.updatedAt =
          timestamp;

        existing.metadata = {
          ...(existing.metadata ||
            {}),

          ...cloneValue(
            metadata
          ),

          memoryKey:
            resolvedMemoryKey,
        };

        persist();

        return cloneValue(
          existing
        );
      }
    }

    const reflection = {
      id:
        createMemoryId(
          "reflection"
        ),

      memoryKey:
        resolvedMemoryKey,

      type:
        MEMORY_ENTRY_TYPES
          .REFLECTION,

      lifecycleStatus:
        MEMORY_STATUSES.ACTIVE,

      text:
        cleanText,

      source:
        normaliseEnumValue(
          source,
          MEMORY_SOURCES,
          MEMORY_SOURCES.UNKNOWN
        ),

      relatedObservationIds:
        normaliseStringArray(
          relatedObservationIds
        ),

      relatedProjectIds:
        normaliseStringArray(
          relatedProjectIds
        ),

      reinforcementCount: 0,
      lastReinforcedAt: null,

      metadata: {
        ...cloneValue(
          metadata
        ),

        memoryKey:
          resolvedMemoryKey,
      },

      createdAt:
        timestamp,

      updatedAt:
        timestamp,
    };

    memoryState
      .reflections
      .push(reflection);

    persist();

    return cloneValue(
      reflection
    );
  }

  /**
   * ----------------------------------------------------------
   * Memory Lifecycle
   * ----------------------------------------------------------
   */

  function reinforceMemory({
    existingMemory = null,
    candidate = null,
    memoryId = null,
    memoryKey = null,
  } = {}) {
    if (
      containsSensitiveSecret(
        candidate
      )
    ) {
      return null;
    }

    const resolvedMemoryId =
      normaliseString(
        memoryId
      ) ||
      normaliseString(
        existingMemory?.id
      );

    const resolvedMemoryKey =
      normaliseString(
        memoryKey
      ) ||
      normaliseString(
        candidate?.memoryKey
      ) ||
      normaliseString(
        existingMemory
          ?.memoryKey
      );

    const record =
      findMemoryRecord({
        memoryId:
          resolvedMemoryId,

        memoryKey:
          resolvedMemoryKey,
      });

    if (!record) {
      return null;
    }

    const timestamp =
      createTimestamp();

    const entry =
      record.entry;

    entry.reinforcementCount =
      normaliseCount(
        entry.reinforcementCount
      ) + 1;

    entry.lastReinforcedAt =
      timestamp;

    entry.lifecycleStatus =
      MEMORY_STATUSES
        .REINFORCED;

    entry.updatedAt =
      timestamp;

    if (
      record.collectionName ===
        "projectMemories" &&
      entry.status !==
        MEMORY_STATUSES
          .CONFIRMED &&
      entry.status !==
        MEMORY_STATUSES
          .ESTABLISHED &&
      entry.status !==
        MEMORY_STATUSES
          .RESOLVED
    ) {
      entry.status =
        MEMORY_STATUSES
          .REINFORCED;
    }

    if (
      candidate?.confidence !==
      undefined
    ) {
      entry.confidence =
        Math.max(
          normaliseConfidence(
            entry.confidence,
            0
          ),

          normaliseConfidence(
            candidate
              .confidence,
            0
          )
        );
    }

    if (
      candidate?.evidence
    ) {
      entry.evidence =
        normaliseStringArray([
          ...normaliseArray(
            entry.evidence
          ),

          ...normaliseArray(
            candidate.evidence
          ),
        ]);
    }

    entry.metadata = {
      ...(entry.metadata || {}),

      lastReinforcement: {
        candidateId:
          candidate?.id ||
          null,

        source:
          candidate?.source ||
          null,

        reinforcedAt:
          timestamp,
      },
    };

    persist();

    return cloneValue(
      entry
    );
  }

  function weakenMemory({
    existingMemory = null,
    candidate = null,
    memoryId = null,
    memoryKey = null,
    amount = 0.15,
    reason = "",
  } = {}) {
    const record =
      findMemoryRecord({
        memoryId:
          normaliseString(
            memoryId
          ) ||
          normaliseString(
            existingMemory?.id
          ),

        memoryKey:
          normaliseString(
            memoryKey
          ) ||
          normaliseString(
            candidate?.memoryKey
          ) ||
          normaliseString(
            existingMemory
              ?.memoryKey
          ),
      });

    if (!record) {
      return null;
    }

    const timestamp =
      createTimestamp();

    const entry =
      record.entry;

    const reduction =
      normaliseConfidence(
        amount,
        0.15
      );

    entry.confidence =
      Math.max(
        0,
        normaliseConfidence(
          entry.confidence,
          0.5
        ) -
          reduction
      );

    entry.updatedAt =
      timestamp;

    entry.metadata = {
      ...(entry.metadata || {}),

      lastWeakening: {
        amount:
          reduction,

        reason:
          normaliseString(
            reason
          ),

        weakenedAt:
          timestamp,
      },
    };

    persist();

    return cloneValue(
      entry
    );
  }

  function supersedeMemory({
    existingMemory = null,
    candidate = null,
    memoryId = null,
    memoryKey = null,
  } = {}) {
    if (
      !candidate ||
      typeof candidate !==
        "object" ||
      containsSensitiveSecret(
        candidate
      )
    ) {
      return null;
    }

    const record =
      findMemoryRecord({
        memoryId:
          normaliseString(
            memoryId
          ) ||
          normaliseString(
            existingMemory?.id
          ),

        memoryKey:
          normaliseString(
            memoryKey
          ) ||
          normaliseString(
            existingMemory
              ?.memoryKey
          ),
      });

    if (!record) {
      return null;
    }

    const oldEntry =
      record.entry;

    /**
     * A weaker source is not allowed to supersede stronger truth.
     */
    if (
      shouldProtectExistingTruth({
        existing:
          oldEntry,

        incoming:
          candidate,
      })
    ) {
      oldEntry.evidence =
        normaliseStringArray([
          ...normaliseArray(
            oldEntry.evidence
          ),

          ...normaliseArray(
            candidate.evidence
          ),
        ]);

      oldEntry.metadata = {
        ...(oldEntry.metadata ||
          {}),

        rejectedSupersession: {
          candidateId:
            candidate.id ||
            null,

          source:
            candidate.source ||
            null,

          certainty:
            candidate.certainty ||
            null,

          rejectedAt:
            createTimestamp(),

          reason:
            "Incoming memory had lower authority than existing truth.",
        },
      };

      oldEntry.updatedAt =
        createTimestamp();

      persist();

      return {
        superseded: null,

        replacement: null,

        protected:
          cloneValue(
            oldEntry
          ),

        reason:
          "existing-truth-has-higher-authority",
      };
    }

    const timestamp =
      createTimestamp();

    const oldLifecycleStatus =
      oldEntry.lifecycleStatus;

    const oldDomainStatus =
      oldEntry.status;

    const oldMetadata =
      cloneValue(
        oldEntry.metadata ||
          {}
      );

    const oldSupersededAt =
      oldEntry.supersededAt;

    oldEntry.lifecycleStatus =
      MEMORY_STATUSES
        .SUPERSEDED;

    if (
      record.collectionName ===
      "projectMemories"
    ) {
      oldEntry.status =
        MEMORY_STATUSES
          .SUPERSEDED;
    }

    if (
      record.collectionName ===
      "sessionHandoffs"
    ) {
      oldEntry.status =
        SESSION_HANDOFF_STATUSES
          .SUPERSEDED;
    }

    oldEntry.supersededAt =
      timestamp;

    oldEntry.updatedAt =
      timestamp;

    oldEntry.metadata = {
      ...(oldEntry.metadata ||
        {}),

      historicalReason:
        "Superseded by newer creator or project information.",
    };

    let newEntry = null;

    if (
      record.collectionName ===
        "projectMemories" ||
      candidate.scope ===
        MEMORY_SCOPES
          .PROJECT ||
      candidate.projectId
    ) {
      const replacementProjectId =
        normaliseString(
          candidate.projectId
        ) ||
        getEntryProjectId(
          oldEntry
        );

      if (
        !replacementProjectId ||
        (
          getEntryProjectId(
            oldEntry
          ) &&
          replacementProjectId !==
            getEntryProjectId(
              oldEntry
            )
        )
      ) {
        oldEntry.lifecycleStatus =
          oldLifecycleStatus;

        oldEntry.status =
          oldDomainStatus;

        oldEntry.metadata =
          oldMetadata;

        oldEntry.supersededAt =
          oldSupersededAt;

        return null;
      }

      /**
       * Create the replacement under a distinct transitional key
       * so saveProjectMemory does not interpret the historical
       * entry as reinforcement.
       */
      const semanticKey =
        candidate.memoryKey ||
        oldEntry.memoryKey ||
        null;

      const replacementKey =
        semanticKey
          ? (
              `${semanticKey}` +
              `::replacement::` +
              `${Date.now()}`
            )
          : null;

      newEntry =
        saveProjectMemory({
          ...cloneValue(
            candidate
          ),

          projectId:
            replacementProjectId,

          status:
            normaliseConfidence(
              candidate.confidence,
              0
            ) >= 0.86
              ? MEMORY_STATUSES
                  .ESTABLISHED
              : MEMORY_STATUSES
                  .EMERGING,

          memoryKey:
            replacementKey,

          metadata: {
            ...cloneValue(
              candidate.metadata ||
                {}
            ),

            semanticMemoryKey:
              semanticKey,

            supersedesMemoryId:
              oldEntry.id,
          },
        });

      if (
        newEntry &&
        semanticKey
      ) {
        const storedReplacement =
          findById(
            memoryState
              .projectMemories,

            newEntry.id
          );

        if (storedReplacement) {
          storedReplacement.memoryKey =
            semanticKey;

          storedReplacement.metadata = {
            ...(storedReplacement
              .metadata ||
              {}),

            memoryKey:
              semanticKey,

            semanticMemoryKey:
              semanticKey,
          };

          newEntry =
            cloneValue(
              storedReplacement
            );
        }
      }
    } else {
      const replacementText =
        normaliseString(
          candidate.content
        ) ||
        memoryValueToText(
          candidate.value
        );

      if (replacementText) {
        newEntry =
          addObservation({
            text:
              replacementText,

            category:
              candidate.category ||
              "general",

            evidence:
              candidate.evidence ||
              [],

            confidence:
              candidate.confidence ??
              0.7,

            status:
              PATTERN_STATUSES
                .EMERGING,

            source:
              candidate.source ||
              MEMORY_SOURCES
                .CREATOR,

            certainty:
              candidate.certainty ||
              MEMORY_CERTAINTY
                .OBSERVED,

            memoryKey:
              candidate.memoryKey ||
              oldEntry.memoryKey ||
              null,

            projectId:
              candidate.projectId ||
              null,

            scope:
              candidate.scope ||
              MEMORY_SCOPES
                .CREATOR,

            metadata: {
              ...cloneValue(
                candidate.metadata ||
                  {}
              ),

              supersedesMemoryId:
                oldEntry.id,

              horizon:
                candidate.horizon ||
                null,

              value:
                cloneValue(
                  candidate.value
                ),
            },
          });
      }
    }

    if (!newEntry) {
      oldEntry.lifecycleStatus =
        oldLifecycleStatus;

      oldEntry.status =
        oldDomainStatus;

      oldEntry.metadata =
        oldMetadata;

      oldEntry.supersededAt =
        oldSupersededAt;

      return null;
    }

    oldEntry.supersededByMemoryId =
      newEntry.id;

    oldEntry.updatedAt =
      createTimestamp();

    persist();

    return {
      superseded:
        cloneValue(
          oldEntry
        ),

      replacement:
        cloneValue(
          newEntry
        ),
    };
  }

  function archiveMemory({
    memoryId = null,
    memoryKey = null,
    reason = "",
  } = {}) {
    const record =
      findMemoryRecord({
        memoryId,
        memoryKey,
      });

    if (!record) {
      return null;
    }

    const timestamp =
      createTimestamp();

    record.entry.lifecycleStatus =
      MEMORY_STATUSES
        .ARCHIVED;

    if (
      record.collectionName ===
      "ideas"
    ) {
      record.entry.status =
        IDEA_STATUSES
          .ARCHIVED;
    }

    if (
      record.collectionName ===
      "projectMemories"
    ) {
      record.entry.status =
        MEMORY_STATUSES
          .ARCHIVED;
    }

    if (
      record.collectionName ===
      "sessionHandoffs"
    ) {
      record.entry.status =
        SESSION_HANDOFF_STATUSES
          .ARCHIVED;
    }

    if (
      record.collectionName ===
      "deferredMemories"
    ) {
      record.entry.status =
        DEFERRED_MEMORY_STATUSES
          .ARCHIVED;
    }

    record.entry.archivedAt =
      timestamp;

    record.entry.updatedAt =
      timestamp;

    record.entry.metadata = {
      ...(record.entry.metadata ||
        {}),

      archiveReason:
        normaliseString(
          reason
        ),
    };

    persist();

    return cloneValue(
      record.entry
    );
  }

  function resolveThread({
    memoryId = null,
    memoryKey = null,
    resolution = "",
  } = {}) {
    const record =
      findMemoryRecord({
        memoryId,
        memoryKey,
      });

    if (!record) {
      return null;
    }

    if (
      containsSensitiveSecret(
        resolution
      )
    ) {
      return null;
    }

    const timestamp =
      createTimestamp();

    record.entry.lifecycleStatus =
      MEMORY_STATUSES
        .RESOLVED;

    if (
      record.collectionName ===
      "projectMemories"
    ) {
      record.entry.status =
        MEMORY_STATUSES
          .RESOLVED;
    }

    record.entry.resolvedAt =
      timestamp;

    record.entry.updatedAt =
      timestamp;

    record.entry.metadata = {
      ...(record.entry.metadata ||
        {}),

      resolution:
        normaliseString(
          resolution
        ),
    };

    persist();

    return cloneValue(
      record.entry
    );
  }

  /**
   * Permanently removes one unambiguously identified memory.
   *
   * Exact memory id is always preferred.
   *
   * A memory key is accepted only when it uniquely identifies one
   * record across every persistent memory collection. Historical
   * duplicates therefore cannot cause an accidental deletion.
   */
  function forgetMemory({
    memoryId = null,
    memoryKey = null,
  } = {}) {
    const cleanMemoryId =
      normaliseString(
        memoryId
      );

    const cleanMemoryKey =
      normaliseString(
        memoryKey
      );

    if (
      !cleanMemoryId &&
      !cleanMemoryKey
    ) {
      return {
        forgotten: false,

        reason:
          "memory-identifier-required",

        memoryId: null,
        memoryKey: null,
      };
    }

    const records =
      findMemoryRecords({
        memoryId:
          cleanMemoryId,

        memoryKey:
          cleanMemoryId
            ? null
            : cleanMemoryKey,
      });

    if (
      records.length === 0
    ) {
      return {
        forgotten: false,

        reason:
          "memory-not-found",

        memoryId:
          cleanMemoryId ||
          null,

        memoryKey:
          cleanMemoryKey ||
          null,
      };
    }

    if (
      !cleanMemoryId &&
      records.length !== 1
    ) {
      return {
        forgotten: false,

        reason:
          "ambiguous-memory-key",

        memoryId: null,

        memoryKey:
          cleanMemoryKey,

        matchCount:
          records.length,

        matches:
          records.map(
            (record) => ({
              memoryId:
                record.entry
                  ?.id ||
                null,

              collection:
                record.collectionName,

              lifecycleStatus:
                record.entry
                  ?.lifecycleStatus ||
                null,

              status:
                record.entry
                  ?.status ||
                null,
            })
          ),
      };
    }

    const record =
      records[0];

    const removed =
      record.collection.splice(
        record.index,
        1
      )[0];

    persist();

    return {
      forgotten: true,

      reason: null,

      collection:
        record.collectionName,

      memoryId:
        removed?.id ||
        null,

      memoryKey:
        removed?.memoryKey ||
        removed?.metadata
          ?.memoryKey ||
        null,
    };
  }

  /**
   * ----------------------------------------------------------
   * Journey and Mentor Context
   * ----------------------------------------------------------
   */

  function updateJourney(
    updates = {}
  ) {
    if (
      containsSensitiveSecret(
        updates
      )
    ) {
      return cloneValue(
        memoryState.journey
      );
    }

    memoryState.journey = {
      ...memoryState.journey,

      ...cloneValue(
        updates
      ),

      lastSeenAt:
        createTimestamp(),
    };

    return persist()
      .journey;
  }

  function createEngineContext() {
    recalculateJourneyCounts();

    const activeProject =
      getActiveProject();

    const activeProjectId =
      getProjectId(
        activeProject
      );

    const knownPatterns =
      getPatterns({
        status:
          PATTERN_STATUSES
            .CONFIRMED,

        minimumConfidence:
          0.65,
      })
        .filter(
          (pattern) =>
            isRelevantToProject(
              pattern,
              activeProjectId
            )
        )
        .slice(
          0,
          10
        )
        .map(
          (pattern) => ({
            id:
              pattern.id,

            name:
              pattern.name,

            description:
              pattern.description,

            confidence:
              pattern.confidence,

            positiveReflection:
              pattern
                .positiveReflection,
          })
        );

    return {
      conversationCount:
        memoryState
          .journey
          .conversationCount,

      completedProjectCount:
        memoryState
          .journey
          .completedProjectCount,

      publishedProjectCount:
        memoryState
          .journey
          .publishedProjectCount,

      savedIdeaCount:
        memoryState
          .journey
          .savedIdeaCount,

      inspirationDrawerCount:
        memoryState
          .journey
          .inspirationDrawerCount,

      recentStage:
        memoryState
          .journey
          .recentStage,

      recentEmotionalState:
        memoryState
          .journey
          .recentEmotionalState,

      knownPatterns,

      activeProject,

      hasSharedIdea:
        memoryState.ideas
          .some(
            isMemoryContextActive
          ),

      creatorProfile:
        getCreatorProfile(),
    };
  }

  /**
   * Creates rich context for CreatorMemoryEngine.
   *
   * IMPORTANT v2.2 RULE:
   *
   * The explicit projectId supplied by the CURRENT caller is
   * authoritative. The previously active persisted project is only
   * a fallback when no current project id was supplied.
   *
   * This prevents Project A memory from leaking into Project B when
   * a creator has just switched projects.
   */
  function getMemoryContext({
    projectId = null,
    conversationLimit = 10,
    observationLimit = 10,
    patternLimit = 10,
    deferredLimit = 10,
    milestoneLimit = 10,
    projectMemoryLimit = 100,
  } = {}) {
    recalculateJourneyCounts();

    const creatorProfile =
      getCreatorProfile();

    const explicitProjectId =
      normaliseString(
        projectId
      ) ||
      null;

    const persistedActiveProject =
      getActiveProject();

    const persistedProjectId =
      getProjectId(
        persistedActiveProject
      );

    const resolvedProjectId =
      explicitProjectId ||
      persistedProjectId ||
      null;

    /**
     * If the caller explicitly requested another project, return
     * that project rather than the stale persisted active project.
     */
    const activeProject =
      explicitProjectId
        ? (
            getProject(
              explicitProjectId
            ) ||
            {
              id:
                explicitProjectId,

              projectId:
                explicitProjectId,

              transientContext:
                true,
            }
          )
        : persistedActiveProject;

    const recentConversations =
      getRecentConversations(
        conversationLimit
      ).filter(
        (conversation) =>
          isRelevantToProject(
            conversation,
            resolvedProjectId
          )
      );

    const observations =
      getObservations({
        minimumConfidence:
          0.35,
      })
        .filter(
          (observation) =>
            isRelevantToProject(
              observation,
              resolvedProjectId
            )
        )
        .slice(
          0,
          observationLimit
        );

    const patterns =
      getPatterns({
        minimumConfidence:
          0.5,
      })
        .filter(
          (pattern) =>
            isRelevantToProject(
              pattern,
              resolvedProjectId
            )
        )
        .slice(
          0,
          patternLimit
        );

    const deferredMemories =
      getDeferredMemories({
        minimumConfidence:
          0.35,
      })
        .filter(
          (memory) =>
            isRelevantToProject(
              memory,
              resolvedProjectId
            )
        )
        .slice(
          0,
          deferredLimit
        );

    const milestones =
      getMilestones()
        .filter(
          (milestone) =>
            isRelevantToProject(
              milestone,
              resolvedProjectId
            )
        )
        .slice(
          0,
          milestoneLimit
        );

    const projectMemories =
      resolvedProjectId
        ? getProjectMemories({
            projectId:
              resolvedProjectId,

            includeHistorical:
              false,

            limit:
              projectMemoryLimit,
          })
        : [];

    const latestSessionHandoff =
      resolvedProjectId
        ? getLatestSessionHandoff(
            resolvedProjectId
          )
        : null;

    const contextIdeas =
      getIdeas()
        .filter(
          (idea) =>
            isRelevantToProject(
              idea,
              resolvedProjectId
            )
        )
        .slice(
          0,
          20
        );

    const existingMemories = [
      ...contextIdeas,
      ...milestones,
      ...deferredMemories,
    ];

    return {
      creatorProfile,

      creatorId:
        normaliseString(
          creatorProfile?.id
        ) ||
        cleanCreatorId ||
        null,

      journey:
        cloneValue(
          memoryState.journey
        ),

      activeProject,

      activeProjectId:
        resolvedProjectId,

      requestedProjectId:
        explicitProjectId,

      persistedActiveProjectId:
        persistedProjectId,

      projectContextWasExplicit:
        Boolean(
          explicitProjectId
        ),

      recentConversations,

      existingMemories,

      existingProjectMemories:
        projectMemories,

      existingPatterns:
        patterns,

      existingObservations:
        observations,

      deferredMemories,

      milestones,

      sessionHandoff:
        latestSessionHandoff,

      communicationPreferences:
        cloneValue(
          creatorProfile
            .communicationPreferences ||
            {}
        ),

      relationship: {
        interactionCount:
          memoryState
            .journey
            .conversationCount,

        firstSeenAt:
          memoryState
            .journey
            .firstSeenAt,

        lastSeenAt:
          memoryState
            .journey
            .lastSeenAt,
      },

      counts: {
        conversations:
          memoryState
            .journey
            .conversationCount,

        projects:
          memoryState
            .projects
            .length,

        ideas:
          memoryState
            .journey
            .savedIdeaCount,

        projectMemories:
          projectMemories
            .length,

        allProjectMemories:
          memoryState
            .projectMemories
            .filter(
              isMemoryContextActive
            )
            .length,

        completedProjects:
          memoryState
            .journey
            .completedProjectCount,

        publishedProjects:
          memoryState
            .journey
            .publishedProjectCount,

        inspirationDrawer:
          memoryState
            .journey
            .inspirationDrawerCount,

        deferredMemories:
          memoryState
            .journey
            .deferredMemoryCount,

        sessionHandoffs:
          memoryState
            .journey
            .sessionHandoffCount,
      },
    };
  }

  /**
   * ----------------------------------------------------------
   * Generic Memory Instruction Contract
   * ----------------------------------------------------------
   */

  function applyMemoryInstruction(
    instruction = {}
  ) {
    if (
      !instruction ||
      typeof instruction !==
        "object"
    ) {
      return {
        applied: false,

        reason:
          "invalid-instruction",

        result: null,
      };
    }

    const action =
      normaliseString(
        instruction.action ||
        instruction.type
      );

    const targetMethod =
      normaliseString(
        instruction.targetMethod ||
        instruction
          .preferredTargetMethod
      );

    const payload =
      instruction.payload &&
      typeof instruction.payload ===
        "object"
        ? instruction.payload
        : instruction;

    /**
     * Persistence-level secret barrier.
     */
    if (
      containsSensitiveSecret(
        payload
      )
    ) {
      return {
        applied: false,

        reason:
          "sensitive-secret-blocked",

        result: null,
      };
    }

    /**
     * Persistence-level scope validation.
     */
    const instructionScope =
      normaliseString(
        instruction.scope ||
        payload?.scope
      );

    const instructionProjectId =
      normaliseString(
        instruction.projectId ||
        payload?.projectId ||
        payload?.metadata
          ?.projectId
      );

    if (
      instructionScope ===
        MEMORY_SCOPES.PROJECT &&
      !instructionProjectId &&
      normaliseStringArray(
        payload
          ?.relatedProjectIds
      ).length === 0
    ) {
      return {
        applied: false,

        reason:
          "project-boundary-required",

        result: null,
      };
    }

    const directMethods = {
      saveIdea,
      saveDeferredMemory,
      addObservation,
      savePattern,
      saveReflection,
      addMilestone,
      rememberConversation,
      updateCreatorProfile,

      saveProjectMemory,
      saveSessionHandoff,
      reinforceMemory,
      weakenMemory,
      supersedeMemory,
      archiveMemory,
      resolveThread,
      forgetMemory,
    };

    if (
      targetMethod &&
      typeof directMethods[
        targetMethod
      ] === "function"
    ) {
      const result =
        directMethods[
          targetMethod
        ](
          payload
        );

      const applied =
        targetMethod ===
          "forgetMemory"
          ? Boolean(
              result?.forgotten
            )
          : targetMethod ===
              "supersedeMemory" &&
            result?.reason ===
              "existing-truth-has-higher-authority"
            ? false
            : Boolean(result);

      return {
        applied,

        reason:
          applied
            ? null
            : (
                result?.reason ||
                `${targetMethod}-not-applied`
              ),

        result,
      };
    }

    switch (action) {
      case "save-idea":
      case "capture-idea": {
        const result =
          saveIdea(
            payload
          );

        return {
          applied:
            Boolean(result),

          reason:
            result
              ? null
              : "idea-not-saved",

          result,
        };
      }

      case "save-deferred-memory":
      case "capture-deferred-memory":
      case "defer-memory":
      case "save-deferred-topic": {
        const result =
          saveDeferredMemory({
            ...cloneValue(
              payload
            ),

            relatedProjectIds:
              payload
                .relatedProjectIds ||
              (
                payload
                  .relatedProjectId
                  ? [
                      payload
                        .relatedProjectId,
                    ]
                  : []
              ),
          });

        return {
          applied:
            Boolean(result),

          reason:
            result
              ? null
              : "deferred-memory-not-saved",

          result,
        };
      }

      case "save-observation":
      case "capture-observation":
      case "hold-for-more-evidence": {
        const result =
          addObservation(
            payload
          );

        return {
          applied:
            Boolean(result),

          reason:
            result
              ? null
              : "observation-not-saved",

          result,
        };
      }

      case "save-pattern":
      case "capture-pattern": {
        const result =
          savePattern(
            payload
          );

        return {
          applied:
            Boolean(result),

          reason:
            result
              ? null
              : "pattern-not-saved",

          result,
        };
      }

      case "save-reflection":
      case "capture-reflection": {
        const result =
          saveReflection(
            payload
          );

        return {
          applied:
            Boolean(result),

          reason:
            result
              ? null
              : "reflection-not-saved",

          result,
        };
      }

      case "save-milestone":
      case "capture-milestone": {
        const result =
          addMilestone(
            payload
          );

        return {
          applied:
            Boolean(result),

          reason:
            result
              ? null
              : "milestone-not-saved",

          result,
        };
      }

      case "remember-conversation":
      case "save-conversation": {
        const result =
          rememberConversation(
            payload
          );

        return {
          applied:
            Boolean(result),

          reason:
            result
              ? null
              : "conversation-not-saved",

          result,
        };
      }

      case "update-profile":
      case "update-creator-profile": {
        const result =
          updateCreatorProfile(
            payload
          );

        return {
          applied:
            Boolean(result),

          reason:
            result
              ? null
              : "profile-update-not-applied",

          result,
        };
      }

      case "save-project-memory": {
        const result =
          saveProjectMemory(
            payload
          );

        return {
          applied:
            Boolean(result),

          reason:
            result
              ? null
              : "project-memory-not-saved",

          result,
        };
      }

      case "save-session-handoff": {
        const result =
          saveSessionHandoff(
            payload
          );

        return {
          applied:
            Boolean(result),

          reason:
            result
              ? null
              : "session-handoff-not-saved",

          result,
        };
      }

      case "reinforce-memory": {
        const result =
          reinforceMemory(
            payload
          );

        return {
          applied:
            Boolean(result),

          reason:
            result
              ? null
              : "memory-not-found",

          result,
        };
      }

      case "weaken-memory": {
        const result =
          weakenMemory(
            payload
          );

        return {
          applied:
            Boolean(result),

          reason:
            result
              ? null
              : "memory-not-found",

          result,
        };
      }

      case "supersede-memory": {
        const result =
          supersedeMemory(
            payload
          );

        const protectedTruth =
          result?.reason ===
          "existing-truth-has-higher-authority";

        return {
          applied:
            Boolean(
              result &&
              !protectedTruth
            ),

          reason:
            protectedTruth
              ? result.reason
              : result
                ? null
                : "memory-not-superseded",

          result,
        };
      }

      case "archive-as-history":
      case "archive-memory": {
        const result =
          archiveMemory(
            payload
          );

        return {
          applied:
            Boolean(result),

          reason:
            result
              ? null
              : "memory-not-found",

          result,
        };
      }

      case "resolve-thread": {
        const result =
          resolveThread(
            payload
          );

        return {
          applied:
            Boolean(result),

          reason:
            result
              ? null
              : "thread-not-found",

          result,
        };
      }

      case "forget-memory": {
        const result =
          forgetMemory(
            payload
          );

        return {
          applied:
            Boolean(
              result
                ?.forgotten
            ),

          reason:
            result
              ?.forgotten
              ? null
              : (
                  result?.reason ||
                  "memory-not-forgotten"
                ),

          result,
        };
      }

      case "mark-deferred-ready": {
        const result =
          markDeferredMemoryReady(
            payload.memoryId ||
            payload.id
          );

        return {
          applied:
            Boolean(result),

          reason:
            result
              ? null
              : "deferred-memory-not-found",

          result,
        };
      }

      case "mark-deferred-recalled": {
        const result =
          markDeferredMemoryRecalled(
            payload.memoryId ||
            payload.id
          );

        return {
          applied:
            Boolean(result),

          reason:
            result
              ? null
              : "deferred-memory-not-found",

          result,
        };
      }

      case "dismiss-deferred-memory": {
        const result =
          dismissDeferredMemory(
            payload.memoryId ||
            payload.id,

            payload.reason ||
            ""
          );

        return {
          applied:
            Boolean(result),

          reason:
            result
              ? null
              : "deferred-memory-not-found",

          result,
        };
      }

      case "ignore":
        return {
          applied: false,

          reason:
            "instruction-intentionally-ignored",

          result: null,
        };

      default:
        return {
          applied: false,

          reason:
            "unsupported-memory-action",

          result: null,

          instruction:
            cloneValue(
              instruction
            ),
        };
    }
  }

  /**
   * Applies several memory instructions and reports exactly what
   * persisted.
   *
   * v2.2 distinguishes:
   *
   * - empty
   * - fully-successful
   * - partially-successful
   * - failed
   * - no-op
   */
  function applyMemoryInstructions(
    instructions = []
  ) {
    const safeInstructions =
      normaliseArray(
        instructions
      );

    const applied = [];
    const skipped = [];
    const errors = [];

    if (
      safeInstructions.length ===
      0
    ) {
      return {
        applied,
        skipped,
        errors,

        attemptedCount: 0,
        appliedCount: 0,
        skippedCount: 0,
        errorCount: 0,

        successful: true,
        fullySuccessful: true,
        partiallySuccessful: false,
        failed: false,
        noOp: true,

        status: "empty",
      };
    }

    safeInstructions.forEach(
      (instruction) => {
        try {
          const result =
            applyMemoryInstruction(
              instruction
            );

          if (result.applied) {
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
          } else {
            skipped.push({
              instruction:
                cloneValue(
                  instruction
                ),

              reason:
                result.reason ||
                "not-applied",

              result:
                cloneValue(
                  result.result
                ),

              requiresMemoryAdapterResolution:
                result.reason ===
                "unsupported-memory-action",
            });
          }
        } catch (error) {
          errors.push({
            instruction:
              cloneValue(
                instruction
              ),

            error:
              error instanceof Error
                ? error.message
                : String(error),
          });
        }
      }
    );

    const attemptedCount =
      safeInstructions.length;

    const appliedCount =
      applied.length;

    const skippedCount =
      skipped.length;

    const errorCount =
      errors.length;

    const fullySuccessful =
      attemptedCount > 0 &&
      appliedCount ===
        attemptedCount &&
      skippedCount === 0 &&
      errorCount === 0;

    const partiallySuccessful =
      appliedCount > 0 &&
      !fullySuccessful;

    const failed =
      appliedCount === 0 &&
      errorCount > 0;

    const noOp =
      appliedCount === 0 &&
      errorCount === 0;

    const successful =
      fullySuccessful ||
      partiallySuccessful;

    let status =
      "no-op";

    if (fullySuccessful) {
      status =
        "fully-successful";
    } else if (
      partiallySuccessful
    ) {
      status =
        "partially-successful";
    } else if (failed) {
      status =
        "failed";
    }

    return {
      applied,
      skipped,
      errors,

      attemptedCount,
      appliedCount,
      skippedCount,
      errorCount,

      successful,
      fullySuccessful,
      partiallySuccessful,
      failed,
      noOp,

      status,
    };
  }

  /**
   * ----------------------------------------------------------
   * Portable Memory
   * ----------------------------------------------------------
   */

  function exportMemory() {
    return {
      exportedAt:
        createTimestamp(),

      storageKey:
        resolvedStorageKey,

      version:
        CREATOR_MEMORY_VERSION,

      memory:
        getState(),
    };
  }

  function importMemory(
    value
  ) {
    const importedState =
      value?.memory ||
      value;

    if (
      !importedState ||
      typeof importedState !==
        "object"
    ) {
      return null;
    }

    if (
      containsSensitiveSecret(
        importedState
      )
    ) {
      return null;
    }

    return replaceState(
      importedState
    );
  }

  return {
    getState,
    replaceState,
    resetMemory,
    clearPersistedMemory,

    getCreatorProfile,
    updateCreatorProfile,
    addProfileListItem,

    saveIdea,
    getIdeas,
    getIdea,
    updateIdea,

    moveIdeaToInspirationDrawer,
    restoreIdeaFromInspirationDrawer,
    getInspirationDrawer,

    saveProject,
    getProjects,
    getProject,
    updateProject,
    getActiveProject,
    setActiveProject,

    saveProjectMemory,
    getProjectMemories,
    getProjectMemory,
    updateProjectMemory,

    saveSessionHandoff,
    getSessionHandoffs,
    getLatestSessionHandoff,
    markSessionHandoffResumed,

    rememberConversation,
    getRecentConversations,

    addObservation,
    getObservations,
    updateObservation,
    markObservationReflected,

    savePattern,
    getPatterns,

    saveDeferredMemory,
    getDeferredMemories,
    getDeferredMemory,
    updateDeferredMemory,
    markDeferredMemoryReady,
    markDeferredMemoryRecalled,
    dismissDeferredMemory,
    findRelevantDeferredMemories,

    addMilestone,
    getMilestones,
    saveReflection,

    reinforceMemory,
    weakenMemory,
    supersedeMemory,
    archiveMemory,
    resolveThread,
    forgetMemory,

    updateJourney,

    createEngineContext,
    getMemoryContext,

    applyMemoryInstruction,
    applyMemoryInstructions,

    exportMemory,
    importMemory,
  };
}

export {
  CREATOR_MEMORY_VERSION,

  DEFAULT_STORAGE_KEY,

  MEMORY_ENTRY_TYPES,

  IDEA_STATUSES,
  PROJECT_STATUSES,
  PATTERN_STATUSES,

  MEMORY_IMPORTANCE,
  MEMORY_STATUSES,
  MEMORY_SCOPES,
  MEMORY_HORIZONS,
  MEMORY_SOURCES,
  MEMORY_CERTAINTY,

  MEMORY_AUTHORITY,

  DEFERRED_MEMORY_STATUSES,
  SESSION_HANDOFF_STATUSES,

  createDefaultMemoryState,
  createMemoryStorageAdapter,
  createCreatorMemory,
};

export default createCreatorMemory;
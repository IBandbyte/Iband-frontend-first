/**
 * Creator Memory
 * ------------------------------------------------------------
 * The long-term memory foundation for iBand's AI Mentor.
 *
 * Responsibilities:
 * - Remember creator preferences and identity.
 * - Preserve ideas and unfinished possibilities.
 * - Record projects, milestones and conversation summaries.
 * - Store evidence-based observations and creative patterns.
 * - Support the Inspiration Drawer.
 * - Provide safe context to The Creator Engine.
 *
 * Version 1 uses browser localStorage.
 * The storage adapter can later be replaced with the iBand API
 * without changing the public memory methods.
 */

const CREATOR_MEMORY_VERSION = "1.0.0";

const DEFAULT_STORAGE_KEY = "iband.creator-memory";

const MEMORY_ENTRY_TYPES = Object.freeze({
  IDEA: "idea",
  INSPIRATION: "inspiration",
  PROJECT: "project",
  CONVERSATION: "conversation",
  OBSERVATION: "observation",
  PATTERN: "pattern",
  STRENGTH: "strength",
  PREFERENCE: "preference",
  MILESTONE: "milestone",
  REFLECTION: "reflection",
});

const IDEA_STATUSES = Object.freeze({
  ACTIVE: "active",
  DEVELOPING: "developing",
  PAUSED: "paused",
  INSPIRATION_DRAWER: "inspiration-drawer",
  COMPLETED: "completed",
  ARCHIVED: "archived",
});

const PROJECT_STATUSES = Object.freeze({
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

const PATTERN_STATUSES = Object.freeze({
  EMERGING: "emerging",
  REPEATED: "repeated",
  CONFIRMED: "confirmed",
  REJECTED: "rejected",
});

const MEMORY_IMPORTANCE = Object.freeze({
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high",
  CORE: "core",
});

const DEFAULT_CREATOR_PROFILE = Object.freeze({
  id: null,
  displayName: "",
  creatorName: "",
  preferredMentorName: "The Creator",
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
    permissionBeforePerspective: true,
    encouragementBeforeCorrection: true,
  },
});

const DEFAULT_MEMORY_STATE = Object.freeze({
  version: CREATOR_MEMORY_VERSION,

  creatorProfile: DEFAULT_CREATOR_PROFILE,

  ideas: [],
  projects: [],
  conversations: [],
  observations: [],
  patterns: [],
  milestones: [],
  reflections: [],

  journey: {
    conversationCount: 0,
    completedProjectCount: 0,
    publishedProjectCount: 0,
    savedIdeaCount: 0,
    inspirationDrawerCount: 0,
    firstSeenAt: null,
    lastSeenAt: null,
    recentStage: null,
    recentEmotionalState: null,
    activeProjectId: null,
  },

  metadata: {
    createdAt: null,
    updatedAt: null,
  },
});

/**
 * Returns a current ISO timestamp.
 */
function createTimestamp() {
  return new Date().toISOString();
}

/**
 * Generates a lightweight unique identifier.
 */
function createMemoryId(prefix = "memory") {
  const randomValue = Math.random()
    .toString(36)
    .slice(2, 10);

  return `${prefix}-${Date.now()}-${randomValue}`;
}

/**
 * Creates a deep clone suitable for plain memory objects.
 */
function cloneValue(value) {
  if (value === undefined) {
    return undefined;
  }

  return JSON.parse(JSON.stringify(value));
}

/**
 * Ensures a value is a usable string.
 */
function normaliseString(value) {
  return typeof value === "string"
    ? value.trim()
    : "";
}

/**
 * Ensures a value is stored as a clean string array.
 */
function normaliseStringArray(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return [
    ...new Set(
      value
        .map(normaliseString)
        .filter(Boolean)
    ),
  ];
}

/**
 * Prevents confidence values from moving outside 0–1.
 */
function normaliseConfidence(value, fallback = 0.5) {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return fallback;
  }

  return Math.max(0, Math.min(1, numericValue));
}

/**
 * Checks whether browser localStorage is available.
 */
function canUseLocalStorage() {
  try {
    return (
      typeof window !== "undefined" &&
      Boolean(window.localStorage)
    );
  } catch {
    return false;
  }
}

/**
 * Builds a fresh memory state.
 */
function createDefaultMemoryState() {
  const timestamp = createTimestamp();

  return {
    ...cloneValue(DEFAULT_MEMORY_STATE),

    creatorProfile: cloneValue(
      DEFAULT_CREATOR_PROFILE
    ),

    metadata: {
      createdAt: timestamp,
      updatedAt: timestamp,
    },

    journey: {
      ...cloneValue(DEFAULT_MEMORY_STATE.journey),
      firstSeenAt: timestamp,
      lastSeenAt: timestamp,
    },
  };
}

/**
 * Repairs incomplete or older memory structures.
 */
function hydrateMemoryState(value) {
  const fallback = createDefaultMemoryState();

  if (!value || typeof value !== "object") {
    return fallback;
  }

  return {
    ...fallback,
    ...cloneValue(value),

    version: CREATOR_MEMORY_VERSION,

    creatorProfile: {
      ...fallback.creatorProfile,
      ...(value.creatorProfile || {}),

      communicationPreferences: {
        ...fallback.creatorProfile
          .communicationPreferences,
        ...(value.creatorProfile
          ?.communicationPreferences || {}),
      },

      creatorTypes: normaliseStringArray(
        value.creatorProfile?.creatorTypes
      ),

      interests: normaliseStringArray(
        value.creatorProfile?.interests
      ),

      goals: normaliseStringArray(
        value.creatorProfile?.goals
      ),

      values: normaliseStringArray(
        value.creatorProfile?.values
      ),

      creativeStrengths: normaliseStringArray(
        value.creatorProfile?.creativeStrengths
      ),

      confidenceNotes: normaliseStringArray(
        value.creatorProfile?.confidenceNotes
      ),
    },

    ideas: Array.isArray(value.ideas)
      ? value.ideas
      : [],

    projects: Array.isArray(value.projects)
      ? value.projects
      : [],

    conversations: Array.isArray(
      value.conversations
    )
      ? value.conversations
      : [],

    observations: Array.isArray(
      value.observations
    )
      ? value.observations
      : [],

    patterns: Array.isArray(value.patterns)
      ? value.patterns
      : [],

    milestones: Array.isArray(
      value.milestones
    )
      ? value.milestones
      : [],

    reflections: Array.isArray(
      value.reflections
    )
      ? value.reflections
      : [],

    journey: {
      ...fallback.journey,
      ...(value.journey || {}),
    },

    metadata: {
      ...fallback.metadata,
      ...(value.metadata || {}),
      updatedAt: createTimestamp(),
    },
  };
}

/**
 * Safely parses persisted memory.
 */
function parseMemoryState(serialisedValue) {
  if (!serialisedValue) {
    return createDefaultMemoryState();
  }

  try {
    return hydrateMemoryState(
      JSON.parse(serialisedValue)
    );
  } catch {
    return createDefaultMemoryState();
  }
}

/**
 * Creates an in-memory storage adapter.
 *
 * Useful during server rendering, testing or when
 * localStorage is unavailable.
 */
function createMemoryStorageAdapter(
  initialState = null
) {
  let storedValue = initialState
    ? JSON.stringify(
        hydrateMemoryState(initialState)
      )
    : null;

  return {
    getItem() {
      return storedValue;
    },

    setItem(_key, value) {
      storedValue = value;
    },

    removeItem() {
      storedValue = null;
    },
  };
}

/**
 * Returns browser storage when available.
 * Otherwise returns a private in-memory adapter.
 */
function resolveStorageAdapter(storageAdapter) {
  if (storageAdapter) {
    return storageAdapter;
  }

  if (canUseLocalStorage()) {
    return window.localStorage;
  }

  return createMemoryStorageAdapter();
}

/**
 * Sorts memory entries newest first.
 */
function sortNewestFirst(entries = []) {
  return [...entries].sort((a, b) => {
    const timeA = new Date(
      a.updatedAt || a.createdAt || 0
    ).getTime();

    const timeB = new Date(
      b.updatedAt || b.createdAt || 0
    ).getTime();

    return timeB - timeA;
  });
}

/**
 * Finds an item by id.
 */
function findById(entries, id) {
  return entries.find(
    (entry) => entry.id === id
  );
}

/**
 * Creates the public Creator Memory service.
 */
function createCreatorMemory({
  storageKey = DEFAULT_STORAGE_KEY,
  storageAdapter = null,
  creatorId = null,
} = {}) {
  const storage = resolveStorageAdapter(
    storageAdapter
  );

  const resolvedStorageKey = creatorId
    ? `${storageKey}.${creatorId}`
    : storageKey;

  let memoryState = parseMemoryState(
    storage.getItem(resolvedStorageKey)
  );

  function persist() {
    memoryState.metadata.updatedAt =
      createTimestamp();

    memoryState.journey.lastSeenAt =
      createTimestamp();

    storage.setItem(
      resolvedStorageKey,
      JSON.stringify(memoryState)
    );

    return getState();
  }

  function getState() {
    return cloneValue(memoryState);
  }

  function replaceState(nextState) {
    memoryState = hydrateMemoryState(nextState);
    return persist();
  }

  function resetMemory() {
    memoryState = createDefaultMemoryState();
    return persist();
  }

  function clearPersistedMemory() {
    storage.removeItem(resolvedStorageKey);
    memoryState = createDefaultMemoryState();

    return getState();
  }

  /**
   * Creator Profile
   */

  function getCreatorProfile() {
    return cloneValue(
      memoryState.creatorProfile
    );
  }

  function updateCreatorProfile(updates = {}) {
    memoryState.creatorProfile = {
      ...memoryState.creatorProfile,
      ...cloneValue(updates),

      communicationPreferences: {
        ...memoryState.creatorProfile
          .communicationPreferences,
        ...(updates.communicationPreferences ||
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

    arrayFields.forEach((fieldName) => {
      if (fieldName in updates) {
        memoryState.creatorProfile[fieldName] =
          normaliseStringArray(
            updates[fieldName]
          );
      }
    });

    return persist().creatorProfile;
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

    if (!allowedFields.includes(fieldName)) {
      return getCreatorProfile();
    }

    const cleanValue = normaliseString(value);

    if (!cleanValue) {
      return getCreatorProfile();
    }

    const currentValues =
      memoryState.creatorProfile[fieldName] ||
      [];

    memoryState.creatorProfile[fieldName] =
      normaliseStringArray([
        ...currentValues,
        cleanValue,
      ]);

    return persist().creatorProfile;
  }

  /**
   * Ideas and Inspiration Drawer
   */

  function saveIdea({
    title = "",
    content = "",
    creatorType = "",
    status = IDEA_STATUSES.ACTIVE,
    source = "creator",
    tags = [],
    importance = MEMORY_IMPORTANCE.MEDIUM,
    emotionalContext = null,
    relatedProjectId = null,
    metadata = {},
  } = {}) {
    const cleanTitle = normaliseString(title);
    const cleanContent = normaliseString(content);

    if (!cleanTitle && !cleanContent) {
      return null;
    }

    const timestamp = createTimestamp();

    const idea = {
      id: createMemoryId("idea"),
      type: MEMORY_ENTRY_TYPES.IDEA,
      title: cleanTitle || "Untitled idea",
      content: cleanContent,
      creatorType: normaliseString(creatorType),
      status,
      source,
      tags: normaliseStringArray(tags),
      importance,
      emotionalContext,
      relatedProjectId,
      metadata: cloneValue(metadata),
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    memoryState.ideas.push(idea);
    memoryState.journey.savedIdeaCount =
      memoryState.ideas.length;

    if (
      status === IDEA_STATUSES.INSPIRATION_DRAWER
    ) {
      memoryState.journey
        .inspirationDrawerCount += 1;
    }

    persist();

    return cloneValue(idea);
  }

  function getIdeas({
    status = null,
    creatorType = null,
    tag = null,
    limit = null,
  } = {}) {
    let ideas = sortNewestFirst(
      memoryState.ideas
    );

    if (status) {
      ideas = ideas.filter(
        (idea) => idea.status === status
      );
    }

    if (creatorType) {
      ideas = ideas.filter(
        (idea) =>
          idea.creatorType === creatorType
      );
    }

    if (tag) {
      ideas = ideas.filter((idea) =>
        idea.tags.includes(tag)
      );
    }

    if (
      Number.isInteger(limit) &&
      limit >= 0
    ) {
      ideas = ideas.slice(0, limit);
    }

    return cloneValue(ideas);
  }

  function getIdea(ideaId) {
    return cloneValue(
      findById(memoryState.ideas, ideaId) ||
        null
    );
  }

  function updateIdea(
    ideaId,
    updates = {}
  ) {
    const idea = findById(
      memoryState.ideas,
      ideaId
    );

    if (!idea) {
      return null;
    }

    const previousStatus = idea.status;

    Object.assign(idea, cloneValue(updates), {
      id: idea.id,
      type: MEMORY_ENTRY_TYPES.IDEA,
      updatedAt: createTimestamp(),
    });

    if ("tags" in updates) {
      idea.tags = normaliseStringArray(
        updates.tags
      );
    }

    if (
      previousStatus !==
        IDEA_STATUSES.INSPIRATION_DRAWER &&
      idea.status ===
        IDEA_STATUSES.INSPIRATION_DRAWER
    ) {
      memoryState.journey
        .inspirationDrawerCount += 1;
    }

    if (
      previousStatus ===
        IDEA_STATUSES.INSPIRATION_DRAWER &&
      idea.status !==
        IDEA_STATUSES.INSPIRATION_DRAWER
    ) {
      memoryState.journey
        .inspirationDrawerCount = Math.max(
        0,
        memoryState.journey
          .inspirationDrawerCount - 1
      );
    }

    persist();

    return cloneValue(idea);
  }

  function moveIdeaToInspirationDrawer(
    ideaId,
    reason = ""
  ) {
    const idea = findById(
      memoryState.ideas,
      ideaId
    );

    if (!idea) {
      return null;
    }

    const drawerHistory = Array.isArray(
      idea.metadata?.drawerHistory
    )
      ? idea.metadata.drawerHistory
      : [];

    return updateIdea(ideaId, {
      status:
        IDEA_STATUSES.INSPIRATION_DRAWER,

      metadata: {
        ...(idea.metadata || {}),

        drawerHistory: [
          ...drawerHistory,
          {
            reason: normaliseString(reason),
            movedAt: createTimestamp(),
          },
        ],
      },
    });
  }

  function restoreIdeaFromInspirationDrawer(
    ideaId
  ) {
    return updateIdea(ideaId, {
      status: IDEA_STATUSES.ACTIVE,
    });
  }

  function getInspirationDrawer({
    creatorType = null,
    limit = null,
  } = {}) {
    return getIdeas({
      status:
        IDEA_STATUSES.INSPIRATION_DRAWER,
      creatorType,
      limit,
    });
  }

  /**
   * Projects
   */

  function saveProject({
    title = "",
    description = "",
    creatorType = "",
    status = PROJECT_STATUSES.IDEA,
    relatedIdeaIds = [],
    tags = [],
    metadata = {},
  } = {}) {
    const cleanTitle = normaliseString(title);

    if (!cleanTitle) {
      return null;
    }

    const timestamp = createTimestamp();

    const project = {
      id: createMemoryId("project"),
      type: MEMORY_ENTRY_TYPES.PROJECT,
      title: cleanTitle,
      description:
        normaliseString(description),
      creatorType:
        normaliseString(creatorType),
      status,
      relatedIdeaIds:
        normaliseStringArray(
          relatedIdeaIds
        ),
      tags: normaliseStringArray(tags),
      metadata: cloneValue(metadata),
      createdAt: timestamp,
      updatedAt: timestamp,
      publishedAt:
        status === PROJECT_STATUSES.PUBLISHED
          ? timestamp
          : null,
      completedAt:
        status === PROJECT_STATUSES.COMPLETED
          ? timestamp
          : null,
    };

    memoryState.projects.push(project);

    if (
      status === PROJECT_STATUSES.CREATING ||
      status === PROJECT_STATUSES.REFINING
    ) {
      memoryState.journey.activeProjectId =
        project.id;
    }

    recalculateJourneyCounts();
    persist();

    return cloneValue(project);
  }

  function getProjects({
    status = null,
    creatorType = null,
    limit = null,
  } = {}) {
    let projects = sortNewestFirst(
      memoryState.projects
    );

    if (status) {
      projects = projects.filter(
        (project) =>
          project.status === status
      );
    }

    if (creatorType) {
      projects = projects.filter(
        (project) =>
          project.creatorType === creatorType
      );
    }

    if (
      Number.isInteger(limit) &&
      limit >= 0
    ) {
      projects = projects.slice(0, limit);
    }

    return cloneValue(projects);
  }

  function getProject(projectId) {
    return cloneValue(
      findById(
        memoryState.projects,
        projectId
      ) || null
    );
  }

  function updateProject(
    projectId,
    updates = {}
  ) {
    const project = findById(
      memoryState.projects,
      projectId
    );

    if (!project) {
      return null;
    }

    Object.assign(
      project,
      cloneValue(updates),
      {
        id: project.id,
        type: MEMORY_ENTRY_TYPES.PROJECT,
        updatedAt: createTimestamp(),
      }
    );

    if ("tags" in updates) {
      project.tags = normaliseStringArray(
        updates.tags
      );
    }

    if ("relatedIdeaIds" in updates) {
      project.relatedIdeaIds =
        normaliseStringArray(
          updates.relatedIdeaIds
        );
    }

    if (
      updates.status ===
        PROJECT_STATUSES.PUBLISHED &&
      !project.publishedAt
    ) {
      project.publishedAt =
        createTimestamp();
    }

    if (
      updates.status ===
        PROJECT_STATUSES.COMPLETED &&
      !project.completedAt
    ) {
      project.completedAt =
        createTimestamp();
    }

    if (
      project.status ===
        PROJECT_STATUSES.CREATING ||
      project.status ===
        PROJECT_STATUSES.REFINING
    ) {
      memoryState.journey.activeProjectId =
        project.id;
    }

    if (
      memoryState.journey
        .activeProjectId === project.id &&
      [
        PROJECT_STATUSES.PUBLISHED,
        PROJECT_STATUSES.COMPLETED,
        PROJECT_STATUSES.ARCHIVED,
      ].includes(project.status)
    ) {
      memoryState.journey.activeProjectId =
        null;
    }

    recalculateJourneyCounts();
    persist();

    return cloneValue(project);
  }

  function getActiveProject() {
    const activeProjectId =
      memoryState.journey.activeProjectId;

    if (!activeProjectId) {
      return null;
    }

    return getProject(activeProjectId);
  }

  function setActiveProject(projectId) {
    const project = findById(
      memoryState.projects,
      projectId
    );

    if (!project) {
      return null;
    }

    memoryState.journey.activeProjectId =
      project.id;

    persist();

    return cloneValue(project);
  }

  /**
   * Conversations
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
      normaliseString(summary);

    if (
      !cleanSummary &&
      !normaliseString(creatorMessage) &&
      !normaliseString(mentorResponse)
    ) {
      return null;
    }

    const timestamp = createTimestamp();

    const conversation = {
      id: createMemoryId("conversation"),
      type: MEMORY_ENTRY_TYPES.CONVERSATION,
      summary: cleanSummary,
      creatorMessage:
        normaliseString(creatorMessage),
      mentorResponse:
        normaliseString(mentorResponse),
      intent,
      emotionalState,
      creatorStage,
      strategies:
        normaliseStringArray(strategies),
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
      metadata: cloneValue(metadata),
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    memoryState.conversations.push(
      conversation
    );

    memoryState.journey.conversationCount =
      memoryState.conversations.length;

    memoryState.journey.recentStage =
      creatorStage ||
      memoryState.journey.recentStage;

    memoryState.journey.recentEmotionalState =
      emotionalState ||
      memoryState.journey
        .recentEmotionalState;

    persist();

    return cloneValue(conversation);
  }

  function getRecentConversations(
    limit = 10
  ) {
    const safeLimit =
      Number.isInteger(limit) && limit >= 0
        ? limit
        : 10;

    return cloneValue(
      sortNewestFirst(
        memoryState.conversations
      ).slice(0, safeLimit)
    );
  }

  /**
   * Observations and Patterns
   */

  function addObservation({
    text = "",
    category = "general",
    evidence = [],
    confidence = 0.5,
    importance = MEMORY_IMPORTANCE.MEDIUM,
    status = PATTERN_STATUSES.EMERGING,
    permissionToReflect = false,
    metadata = {},
  } = {}) {
    const cleanText = normaliseString(text);

    if (!cleanText) {
      return null;
    }

    const timestamp = createTimestamp();

    const observation = {
      id: createMemoryId("observation"),
      type: MEMORY_ENTRY_TYPES.OBSERVATION,
      text: cleanText,
      category:
        normaliseString(category) ||
        "general",
      evidence:
        normaliseStringArray(evidence),
      confidence:
        normaliseConfidence(confidence),
      importance,
      status,
      permissionToReflect: Boolean(
        permissionToReflect
      ),
      reflectionCount: 0,
      lastReflectedAt: null,
      creatorResponse: null,
      metadata: cloneValue(metadata),
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    memoryState.observations.push(
      observation
    );

    persist();

    return cloneValue(observation);
  }

  function getObservations({
    category = null,
    status = null,
    minimumConfidence = 0,
    reflectableOnly = false,
    limit = null,
  } = {}) {
    let observations = sortNewestFirst(
      memoryState.observations
    ).filter(
      (observation) =>
        observation.confidence >=
        normaliseConfidence(
          minimumConfidence,
          0
        )
    );

    if (category) {
      observations = observations.filter(
        (observation) =>
          observation.category === category
      );
    }

    if (status) {
      observations = observations.filter(
        (observation) =>
          observation.status === status
      );
    }

    if (reflectableOnly) {
      observations = observations.filter(
        (observation) =>
          observation.permissionToReflect
      );
    }

    if (
      Number.isInteger(limit) &&
      limit >= 0
    ) {
      observations = observations.slice(
        0,
        limit
      );
    }

    return cloneValue(observations);
  }

  function updateObservation(
    observationId,
    updates = {}
  ) {
    const observation = findById(
      memoryState.observations,
      observationId
    );

    if (!observation) {
      return null;
    }

    Object.assign(
      observation,
      cloneValue(updates),
      {
        id: observation.id,
        type:
          MEMORY_ENTRY_TYPES.OBSERVATION,
        updatedAt: createTimestamp(),
      }
    );

    if ("evidence" in updates) {
      observation.evidence =
        normaliseStringArray(
          updates.evidence
        );
    }

    if ("confidence" in updates) {
      observation.confidence =
        normaliseConfidence(
          updates.confidence
        );
    }

    persist();

    return cloneValue(observation);
  }

  function markObservationReflected(
    observationId,
    creatorResponse = null
  ) {
    const observation = findById(
      memoryState.observations,
      observationId
    );

    if (!observation) {
      return null;
    }

    observation.reflectionCount += 1;
    observation.lastReflectedAt =
      createTimestamp();

    if (creatorResponse !== null) {
      observation.creatorResponse =
        normaliseString(creatorResponse);
    }

    observation.updatedAt =
      createTimestamp();

    persist();

    return cloneValue(observation);
  }

  function savePattern({
    name = "",
    description = "",
    category = "creative",
    evidence = [],
    confidence = 0.5,
    status = PATTERN_STATUSES.EMERGING,
    positiveReflection = "",
    metadata = {},
  } = {}) {
    const cleanName = normaliseString(name);

    if (!cleanName) {
      return null;
    }

    const timestamp = createTimestamp();

    const pattern = {
      id: createMemoryId("pattern"),
      type: MEMORY_ENTRY_TYPES.PATTERN,
      name: cleanName,
      description:
        normaliseString(description),
      category:
        normaliseString(category) ||
        "creative",
      evidence:
        normaliseStringArray(evidence),
      confidence:
        normaliseConfidence(confidence),
      status,
      positiveReflection:
        normaliseString(
          positiveReflection
        ),
      metadata: cloneValue(metadata),
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    memoryState.patterns.push(pattern);
    persist();

    return cloneValue(pattern);
  }

  function getPatterns({
    status = null,
    minimumConfidence = 0,
    limit = null,
  } = {}) {
    let patterns = sortNewestFirst(
      memoryState.patterns
    ).filter(
      (pattern) =>
        pattern.confidence >=
        normaliseConfidence(
          minimumConfidence,
          0
        )
    );

    if (status) {
      patterns = patterns.filter(
        (pattern) =>
          pattern.status === status
      );
    }

    if (
      Number.isInteger(limit) &&
      limit >= 0
    ) {
      patterns = patterns.slice(0, limit);
    }

    return cloneValue(patterns);
  }

  /**
   * Milestones and Reflections
   */

  function addMilestone({
    title = "",
    description = "",
    relatedProjectId = null,
    significance = MEMORY_IMPORTANCE.HIGH,
    metadata = {},
  } = {}) {
    const cleanTitle = normaliseString(title);

    if (!cleanTitle) {
      return null;
    }

    const timestamp = createTimestamp();

    const milestone = {
      id: createMemoryId("milestone"),
      type: MEMORY_ENTRY_TYPES.MILESTONE,
      title: cleanTitle,
      description:
        normaliseString(description),
      relatedProjectId,
      significance,
      metadata: cloneValue(metadata),
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    memoryState.milestones.push(
      milestone
    );

    persist();

    return cloneValue(milestone);
  }

  function getMilestones(limit = null) {
    let milestones = sortNewestFirst(
      memoryState.milestones
    );

    if (
      Number.isInteger(limit) &&
      limit >= 0
    ) {
      milestones = milestones.slice(
        0,
        limit
      );
    }

    return cloneValue(milestones);
  }

  function saveReflection({
    text = "",
    source = "creator",
    relatedObservationIds = [],
    relatedProjectIds = [],
    metadata = {},
  } = {}) {
    const cleanText = normaliseString(text);

    if (!cleanText) {
      return null;
    }

    const timestamp = createTimestamp();

    const reflection = {
      id: createMemoryId("reflection"),
      type: MEMORY_ENTRY_TYPES.REFLECTION,
      text: cleanText,
      source,
      relatedObservationIds:
        normaliseStringArray(
          relatedObservationIds
        ),
      relatedProjectIds:
        normaliseStringArray(
          relatedProjectIds
        ),
      metadata: cloneValue(metadata),
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    memoryState.reflections.push(
      reflection
    );

    persist();

    return cloneValue(reflection);
  }

  /**
   * Journey and Engine Context
   */

  function recalculateJourneyCounts() {
    memoryState.journey.savedIdeaCount =
      memoryState.ideas.length;

    memoryState.journey
      .inspirationDrawerCount =
      memoryState.ideas.filter(
        (idea) =>
          idea.status ===
          IDEA_STATUSES.INSPIRATION_DRAWER
      ).length;

    memoryState.journey
      .completedProjectCount =
      memoryState.projects.filter(
        (project) =>
          project.status ===
            PROJECT_STATUSES.COMPLETED ||
          project.status ===
            PROJECT_STATUSES.PUBLISHED
      ).length;

    memoryState.journey
      .publishedProjectCount =
      memoryState.projects.filter(
        (project) =>
          project.status ===
          PROJECT_STATUSES.PUBLISHED
      ).length;

    memoryState.journey.conversationCount =
      memoryState.conversations.length;
  }

  function updateJourney(updates = {}) {
    memoryState.journey = {
      ...memoryState.journey,
      ...cloneValue(updates),
      lastSeenAt: createTimestamp(),
    };

    return persist().journey;
  }

  /**
   * Creates the compact context shape expected by
   * TheCreatorEngine.analyseCreatorMessage().
   */
  function createEngineContext() {
    recalculateJourneyCounts();

    const activeProject =
      getActiveProject();

    const knownPatterns = getPatterns({
      status: PATTERN_STATUSES.CONFIRMED,
      minimumConfidence: 0.65,
      limit: 10,
    }).map((pattern) => ({
      id: pattern.id,
      name: pattern.name,
      description: pattern.description,
      confidence: pattern.confidence,
      positiveReflection:
        pattern.positiveReflection,
    }));

    return {
      conversationCount:
        memoryState.journey
          .conversationCount,

      completedProjectCount:
        memoryState.journey
          .completedProjectCount,

      publishedProjectCount:
        memoryState.journey
          .publishedProjectCount,

      savedIdeaCount:
        memoryState.journey.savedIdeaCount,

      inspirationDrawerCount:
        memoryState.journey
          .inspirationDrawerCount,

      recentStage:
        memoryState.journey.recentStage,

      recentEmotionalState:
        memoryState.journey
          .recentEmotionalState,

      knownPatterns,

      activeProject,

      hasSharedIdea:
        memoryState.ideas.length > 0,

      creatorProfile: getCreatorProfile(),
    };
  }

  /**
   * Creates a portable memory export.
   */
  function exportMemory() {
    return {
      exportedAt: createTimestamp(),
      storageKey: resolvedStorageKey,
      memory: getState(),
    };
  }

  /**
   * Imports a previously exported memory object.
   */
  function importMemory(value) {
    const importedState =
      value?.memory || value;

    if (
      !importedState ||
      typeof importedState !== "object"
    ) {
      return null;
    }

    return replaceState(importedState);
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

    rememberConversation,
    getRecentConversations,

    addObservation,
    getObservations,
    updateObservation,
    markObservationReflected,

    savePattern,
    getPatterns,

    addMilestone,
    getMilestones,
    saveReflection,

    updateJourney,
    createEngineContext,

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
  createDefaultMemoryState,
  createMemoryStorageAdapter,
  createCreatorMemory,
};

export default createCreatorMemory;